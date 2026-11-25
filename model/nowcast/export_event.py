"""Export one storm as a 15-minute replay file for app/replay.html, using the frozen alert rules in results.json.
Usage: python export_event.py 2020-08-02T00:00 2020-08-03T00:00 name"""
import json, os, sys, pandas as pd
from backtest import features, prepare_rule, move_rule, LINE, load_all

HERE = os.path.dirname(__file__)
start, end, name = sys.argv[1], sys.argv[2], sys.argv[3]
d = load_all()
R = json.load(open(os.path.join(HERE, "results.json")))
f = features(d)
prep, move = prepare_rule(f, R["prepare"]["params"]), move_rule(f, R["move"]["params"])
# start/end are given in Toronto local time
loc = lambda s: pd.Timestamp(s).tz_localize("America/Toronto").tz_convert("Etc/GMT+5").tz_localize(None)
w = slice(loc(start), loc(end))
rows = []
for t in d.loc[w].index:
    num = lambda v: None if pd.isna(v) else round(float(v), 3)
    rows.append({"t": t.tz_localize("Etc/GMT+5").tz_convert("America/Toronto").strftime("%Y-%m-%dT%H:%M"),  # Toronto wall clock
                 "rain": num(f.rain.get(t + pd.Timedelta("15min"))),  # rain measured in this 15 min
                 "r1h": num(f.r1h[t]), "r3h": num(f.r3h[t]), "tod": num(d.HY019_stage[t]),
                 "up": num(d.get("HY022_stage", pd.Series(dtype=float)).get(t)), "wil": num(d.get("HY068_stage", pd.Series(dtype=float)).get(t)),
                 "prepare": bool(prep[t]), "move": bool(move[t])})
out = {"name": name, "line": LINE, "tz": "America/Toronto", "rules": {"prepare": R["prepare"]["params"], "move": R["move"]["params"]}, "rows": rows}
os.makedirs(os.path.join(HERE, "..", "..", "app", "replays"), exist_ok=True)
json.dump(out, open(os.path.join(HERE, "..", "..", "app", "replays", f"{name}.json"), "w"), separators=(",", ":"))
first = lambda k: next((r["t"] for r in rows if r[k]), None)
cross = next((r["t"] for r in rows if r["tod"] and r["tod"] >= LINE), None)
print(name, "prepare", first("prepare"), "move", first("move"), "crosses", cross, "peak", max(r["tod"] or 0 for r in rows))
