"""Export one storm as a 15-minute replay file for app/replay.html, using the frozen alert rules in results.json.
Usage: python export_event.py 2020-08-02T00:00 2020-08-03T00:00 name"""
import json, os, sys, pandas as pd
from backtest import features, prepare_rule, move_rule, LINE

HERE = os.path.dirname(__file__)
start, end, name = sys.argv[1], sys.argv[2], sys.argv[3]
src = sys.argv[4] if len(sys.argv) > 4 else os.path.join(HERE, "..", "..", "data", "don15.csv.gz")
d = pd.read_csv(src, index_col=0, parse_dates=True)
R = json.load(open(os.path.join(HERE, "results.json")))
f = features(d)
prep, move = prepare_rule(f, R["prepare"]["params"]), move_rule(f, R["move"]["params"])
w = slice(start, end)
rows = []
for t in d.loc[w].index:
    num = lambda v: None if pd.isna(v) else round(float(v), 3)
    rows.append({"t": (t + pd.Timedelta("1h")).strftime("%Y-%m-%dT%H:%M"),  # EST -> EDT wall clock for summer storms
                 "rain": num(f.rain.get(t + pd.Timedelta("15min"))),  # rain measured in this 15 min
                 "r1h": num(f.r1h[t]), "r3h": num(f.r3h[t]), "tod": num(d.HY019_stage[t]),
                 "up": num(d.get("HY022_stage", pd.Series(dtype=float)).get(t)), "wil": num(d.get("HY068_stage", pd.Series(dtype=float)).get(t)),
                 "prepare": bool(prep[t]), "move": bool(move[t])})
out = {"name": name, "line": LINE, "tz": "EDT", "rules": {"prepare": R["prepare"]["params"], "move": R["move"]["params"]}, "rows": rows}
os.makedirs(os.path.join(HERE, "..", "..", "app", "replays"), exist_ok=True)
json.dump(out, open(os.path.join(HERE, "..", "..", "app", "replays", f"{name}.json"), "w"), separators=(",", ":"))
first = lambda k: next((r["t"] for r in rows if r[k]), None)
cross = next((r["t"] for r in rows if r["tod"] and r["tod"] >= LINE), None)
print(name, "prepare", first("prepare"), "move", first("move"), "crosses", cross, "peak", max(r["tod"] or 0 for r in rows))
