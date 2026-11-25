"""Turn the 5-minute TRCA gauging-site exports (data/raw/live/) into the same 15-minute table as prepare.py,
with times converted from Toronto local time to fixed EST to match TRCA open data. Writes data/don15_live.csv.gz."""
import glob, os, pandas as pd
HERE = os.path.dirname(__file__)
import sys
RAW = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "data", "raw", "live")
OUT = os.path.join(HERE, "..", "..", "data", "don15_live.csv.gz")
parts = {}
for p in sorted(glob.glob(os.path.join(RAW, "*.csv"))):
    name = "_".join(os.path.basename(p).split("_")[:2])
    df = pd.read_csv(p, usecols=["measured_value", "datetime_of_measurement"])
    if df.empty: continue
    parts.setdefault(name, []).append(df)
cols = {}
for name, dfs in parts.items():
    df = pd.concat(dfs).drop_duplicates("datetime_of_measurement")
    t = pd.to_datetime(df["datetime_of_measurement"], format="%Y-%m-%d %H:%M:%S")
    t = t.dt.tz_localize("America/Toronto", ambiguous="NaT", nonexistent="NaT").dt.tz_convert("Etc/GMT+5").dt.tz_localize(None)
    s = pd.Series(df["measured_value"].astype(float).values, index=t).dropna().sort_index()
    s = s[~s.index.isna()]
    # TRCA open data stamps each 15-min value at the END of the interval it covers; do the same.
    r = s.resample("15min", label="right", closed="right")
    s = r.sum(min_count=1) if name.endswith("rain") else r.mean()
    cols[name] = s
    print(name, s.index.min(), s.index.max(), s.notna().sum())
out = pd.DataFrame(cols); out.index.name = "t_est"
out.round(3).to_csv(OUT, compression="gzip"); print(out.shape)
