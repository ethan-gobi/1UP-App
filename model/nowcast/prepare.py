"""Build a 15-minute table of TRCA Don stream levels and rain from TRCA open data CSVs in data/raw/.
Times are kept in fixed EST (UTC-5), as TRCA publishes them."""
import glob, os, pandas as pd

RAW = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw")
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "data", "don15.csv.gz")

def load(path):
    s = pd.read_csv(path, skiprows=find_header(path), dtype={"value": float})
    s["t"] = pd.to_datetime(s["timestamp"].str[:19], format="%Y-%m-%dT%H:%M:%S")  # wall clock in EST
    return s.set_index("t")["value"]

def find_header(path):
    with open(path, encoding="utf-8-sig") as f:
        for i, line in enumerate(f):
            if line.startswith("timestamp,value"): return i
    raise ValueError(path)

cols = {}
for p in sorted(glob.glob(os.path.join(RAW, "HY*_*.csv"))):
    sid, kind = os.path.basename(p)[:-4].split("_")
    s = load(p)
    s = s[s.index >= "2015-01-01"]
    s = s.resample("15min").sum(min_count=1) if kind == "rain" else s.resample("15min").mean()
    cols[f"{sid}_{kind}"] = s
    print(sid, kind, s.index.min(), s.index.max(), s.notna().sum())
df = pd.DataFrame(cols)
df.index.name = "t_est"
df.round(3).to_csv(OUT, compression="gzip")
print(df.shape, OUT)
