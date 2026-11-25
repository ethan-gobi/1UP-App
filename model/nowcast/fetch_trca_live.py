"""Download 2021-2026 TRCA gauge data (5-minute) from TRCA's public gauging site export (trcagauging.ca),
one gauge and one half-year at a time, into data/raw/live/. Read-only, polite pacing."""
import os, time, urllib.request
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw", "live")
GAUGES = {41: "HY019_stage", 48: "HY022_stage", 32: "HY008_rain", 145: "HY094_rain", 45: "HY021_rain", 50: "HY027_rain", 193: "HY036_rain", 12: "HY070_rain"}
URL = "https://api.trcagauging.ca/api/web/export/time_series_data.csv?format=csv&gauge_ids={g}&datetime_of_measurement_range_after={a}+00:00:00&datetime_of_measurement_range_before={b}+00:00:00"
spans = []
for y in range(2021, 2027):
    spans += [(f"{y}-01-01", f"{y}-07-01"), (f"{y}-07-01", f"{y+1}-01-01")]
for g, name in GAUGES.items():
    for a, b in spans:
        fn = os.path.join(OUT, f"{name}_{a[:7]}.csv")
        if os.path.exists(fn) and os.path.getsize(fn) > 100: continue
        for k in range(4):
            try:
                urllib.request.urlretrieve(URL.format(g=g, a=a, b=b), fn); break
            except Exception as e:
                print("retry", name, a, e); time.sleep(5 * (k + 1))
        print(name, a, os.path.getsize(fn) // 1024, "KB", flush=True)
        time.sleep(1)
