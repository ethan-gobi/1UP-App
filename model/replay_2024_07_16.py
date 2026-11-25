# Replays Flood Desk for 2024-07-16 using only data available before 07:00.
# Usage: python model/replay_2024_07_16.py app/model.json  (model.json from PR #12)
import json, math, sys, urllib.request, statistics as st
from datetime import date, timedelta
MODEL = json.load(open(sys.argv[1]))
LAT, LON, TZ = 43.75, -79.37, "America/Toronto"
V = ["relative_humidity_2m","precipitation","temperature_2m","surface_pressure","snow_depth"]
def get(u): return json.load(urllib.request.urlopen(u, timeout=60))
FROM, TODAY = "2024-06-05", "2024-07-16"
arch = get(f"https://archive-api.open-meteo.com/v1/archive?latitude={LAT}&longitude={LON}&start_date={FROM}&end_date=2024-07-15&hourly={','.join(V)}&timezone={TZ}")["hourly"]
pr_vars = ",".join(f"{v}_previous_day{d}" for v in V for d in (1,2))
pr = get(f"https://previous-runs-api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}&start_date=2024-07-16&end_date=2024-07-17&hourly={pr_vars}&timezone={TZ}")["hourly"]
H = {k: list(arch[k]) for k in ["time"]+V}
for i,t in enumerate(pr["time"]):
    d = 1 if t.startswith("2024-07-16") else 2   # forecast made >=24h (16th) / >=48h (17th) before each hour: all runs before cutoff
    H["time"].append(t)
    for v in V: H[v].append(pr[f"{v}_previous_day{d}"][i])
rain = {}
for cid in ["6158355","615S001","6158733","6158731"]:
    try:
        j = get(f"https://api.weather.gc.ca/collections/climate-daily/items?CLIMATE_IDENTIFIER={cid}&datetime={FROM}/2024-07-17&properties=LOCAL_DATE,TOTAL_PRECIPITATION&f=json&limit=500")
        for f in j["features"]:
            p=f["properties"]
            if p["TOTAL_PRECIPITATION"] is not None: rain.setdefault(p["LOCAL_DATE"][:10],[]).append(p["TOTAL_PRECIPITATION"])
    except Exception as e: print("station",cid,"failed",e)
obs = {d:v for d,v in rain.items() if d < TODAY}
# dailyFromHourly
by = {}
for i,t in enumerate(H["time"]): by.setdefault(t[:10],[]).append(i)
rows=[]
for d in sorted(by):
    ix=by[d]; val=lambda k:[H[k][i] for i in ix if H[k][i] is not None]
    rh=val("relative_humidity_2m"); p=[H["precipitation"][i] or 0 for i in ix]; ps=val("surface_pressure"); sd=val("snow_depth")
    pk=ix[0]
    for i in ix:
        if (H["precipitation"][i] or 0) > (H["precipitation"][pk] or 0): pk=i
    rh5=None
    for i in range(max(0,pk-5),pk):
        if H["relative_humidity_2m"][i] is not None: rh5=max(rh5 or 0,H["relative_humidity_2m"][i])
    rows.append(dict(date=d,p=st.mean(obs[d]) if d in obs else sum(p),pmax=max(p),rhmax=max(rh) if rh else None,h80=sum(1 for v in rh if v>=80),
        rh5pk=rh5 if rh5 is not None else (max(rh) if rh else None),t=st.mean(val("temperature_2m")) if val("temperature_2m") else None,
        psrng=max(ps)-min(ps) if ps else None,snd=st.mean(sd) if sd else None,src="gauges" if d in obs else "forecast"))
l1p=lambda x: math.log1p(max(0,x or 0))
api=0; M=MODEL["weather"]
for i,r in enumerate(rows):
    y1=rows[i-1] if i>0 else r; y2=rows[i-2] if i>1 else y1; t1=rows[i+1] if i+1<len(rows) else None
    m=int(r["date"][5:7])-1
    f=dict(lp=l1p(r["p"]),lpn=l1p(t1["p"]) if t1 else 0,lpmax=l1p(r["pmax"]),lp1=l1p(y1["p"]),lp2=l1p(y2["p"]),lapi=l1p(api),
      melt=l1p(max(0,(y1["snd"] or 0)-(r["snd"] or 0))*100),warm=1 if (r["t"] or 0)>2 else 0,rhmax=(r["rhmax"] if r["rhmax"] is not None else 70)/100,
      h80=(r["h80"] or 0)/24,rh5pk=(r["rh5pk"] if r["rh5pk"] is not None else 70)/100,msin=math.sin(2*math.pi*m/12),mcos=math.cos(2*math.pi*m/12),psrng=r["psrng"] if r["psrng"] is not None else 2)
    api=api*0.85+(r["p"] or 0)
    s=M["b"]+sum(w*((f[k]-mu)/sd) for k,w,mu,sd in zip(M["features"],M["w"],M["mu"],M["sd"]))
    if r["date"]>="2024-07-12": print(r["date"], r["src"], "rain %.1f mm"%r["p"], "maxhr %.1f"%r["pmax"], "score %.0f%%"%(100/(1+math.exp(-s))))
print("tiers", MODEL["tiers"])
