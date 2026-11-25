"""Backtest a two-tier live alert for the Don at Todmorden (TRCA HY019) crossing 79.0 m.
PREPARE: basin rain (mean of TRCA rain gauges) over 1 h / 3 h, scaled up when the ground is wet.
MOVE NOW: the river itself is rising fast (upstream East Don + Wilket Creek, or Todmorden).
Every input is lagged 15 min to mimic publication delay. Thresholds are picked on the train years only."""
import itertools, json, os, sys, numpy as np, pandas as pd

HERE = os.path.dirname(__file__)
LINE = 79.0
RAIN = ["HY008_rain", "HY021_rain", "HY027_rain", "HY036_rain", "HY094_rain", "HY070_rain"]

def load_all():
    """TRCA open data (2015 to March 2021) followed by TRCA gauging-site exports (March 2021 on), 15-min, fixed EST."""
    base = os.path.join(HERE, "..", "..", "data")
    d = pd.read_csv(os.path.join(base, "don15.csv.gz"), index_col=0, parse_dates=True)
    live = os.path.join(base, "don15_live.csv.gz")
    if os.path.exists(live):
        l = pd.read_csv(live, index_col=0, parse_dates=True)
        d = pd.concat([d[d.index < l.index.min()], l]).sort_index()
        d = d[~d.index.duplicated()].asfreq("15min")
    return d

def features(d):
    f = pd.DataFrame(index=d.index)
    rain = d[[c for c in RAIN if c in d]].mean(axis=1, skipna=True).fillna(0)
    f["rain"] = rain
    f["r1h"] = rain.rolling(4).sum()
    f["r3h"] = rain.rolling(12).sum()
    f["r72h"] = rain.rolling(288).sum() - f["r3h"]
    up = [c for c in ["HY022_stage", "HY068_stage"] if c in d]
    rise = pd.concat([d[c].diff(4) for c in up], axis=1)  # metres in the last hour
    f["uprise"] = rise.max(axis=1)
    f["tod"] = d["HY019_stage"]
    f["todrise"] = d["HY019_stage"].diff(4)
    return f.shift(1)  # 15 min publication delay

def events(h, gap="24h"):
    above = h >= LINE
    starts = h.index[above & ~above.shift(1, fill_value=False)]
    ev, last = [], None
    for t in starts:
        if last is None or t - last > pd.Timedelta(gap): ev.append(t)
        last = t
    return ev

def prepare_rule(f, p):
    wet = 1 + p["wet"] * np.clip(f.r72h / 25, 0, 1)
    return (f.r1h * wet >= p["r1"]) | (f.r3h * wet >= p["r3"])

def move_rule(f, p):
    return (f.uprise >= p["up"]) | ((f.todrise >= p["tr"]) & (f.tod >= p["tl"]))

def score(alert, h, ev, years):
    """Per-event lead time and false alarms. An alert episode is a false alarm if the river does not cross within 6 h of its start."""
    a = alert[alert.index.year.isin(years)]
    hv = h[h.index.year.isin(years)]
    ev = [t for t in ev if t.year in years]
    on = a.fillna(False).astype(bool)
    starts = on.index[on & ~on.shift(1, fill_value=False)]
    eps, last = [], None
    for t in starts:
        if last is None or t - last > pd.Timedelta("12h"): eps.append(t)
        last = t
    leads = []
    for t in ev:
        w = on[t - pd.Timedelta("12h"): t]
        leads.append((t - w.index[w.values.argmax()]).total_seconds() / 60 if w.any() else None)
    fa = sum(1 for s in eps if not any(pd.Timedelta(0) <= t - s <= pd.Timedelta("6h") for t in ev) and not (hv[s - pd.Timedelta('1h'):s] >= LINE).any())
    nyears = len(years)
    hit = [l for l in leads if l is not None]
    return {"events": len(ev), "caught": len(hit), "leadMedianMin": float(np.median(hit)) if hit else None,
            "leadMinMin": float(min(hit)) if hit else None, "falseAlarms": fa, "falseAlarmsPerYear": round(fa / nyears, 1),
            "leads": leads}

def tune(rule, grid, f, h, ev, years, fa_budget):
    best = None
    for vals in itertools.product(*grid.values()):
        p = dict(zip(grid, vals))
        s = score(rule(f, p), h, ev, years)
        if s["falseAlarmsPerYear"] > fa_budget: continue
        key = (s["caught"], s["leadMedianMin"] or 0)
        if best is None or key > best[0]: best = (key, p, s)
    return best

if __name__ == "__main__":
    d = load_all()
    f, h = features(d), d["HY019_stage"]
    ev = events(h)
    train = [2015, 2016, 2017, 2018]
    test = sorted({y for y in d.index.year if y >= 2019 and d.loc[str(y), "HY019_stage"].notna().mean() > 0.5})
    out = {"line": LINE, "train": train, "test": test, "events": [str(t) for t in ev]}
    tiers = {
        "prepare": (prepare_rule, {"r1": [8, 10, 12, 15, 18], "r3": [15, 18, 22, 26, 30], "wet": [0, 0.5, 1]}, 4),
        "move": (move_rule, {"up": [0.5, 1.0, 9], "tr": [0.0, 0.1, 0.2, 0.3, 0.4, 0.5], "tl": [78.0, 78.2, 78.3, 78.4, 78.5, 78.6, 78.7]}, 2),
    }
    for name, (rule, grid, budget) in tiers.items():
        _, p, s_train = tune(rule, grid, f, h, ev, train, budget)
        s_test = score(rule(f, p), h, ev, test)
        out[name] = {"params": p, "falseAlarmBudgetPerYear": budget, "train": s_train, "test": s_test}
        print(name, p, "\n train", {k: v for k, v in s_train.items() if k != "leads"}, "\n test ", {k: v for k, v in s_test.items() if k != "leads"})
    # Baseline: alert when Todmorden itself passes 78.5 m
    base = (f.tod >= 78.5)
    out["baseline_78_5"] = {"test": score(base, h, ev, test)}
    print("baseline 78.5", {k: v for k, v in out["baseline_78_5"]["test"].items() if k != "leads"})
    json.dump(out, open(os.path.join(HERE, "results.json"), "w"), indent=1, default=str)
