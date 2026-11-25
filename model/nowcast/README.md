# Live alert ("nowcast"): TRCA gauges, minute by minute

The daily forecast (`model/README.md`) can't see a summer cloudburst coming. On 16 July 2024 the forecasts issued the day before called for 4 to 7 mm of rain, and about 51 mm fell. So Flood Desk also watches TRCA's live rain and river gauges and gives the Brick Works two alerts:

| Alert | Fires when (data 15 min old, as published) | What it's for |
|---|---|---|
| **Prepare** | Average of TRCA's Don watershed rain gauges reaches 10 mm in 1 hour or 18 mm in 3 hours. Lower thresholds when the past 3 days were wet, by up to a third. | Get people and stock ready while the river is still low |
| **Move now** | The Don at Todmorden (TRCA HY019) is at 78.7 m or higher and rose 30 cm in the last hour, or East Don / Wilket Creek rose 1 m in an hour | Clear the valley floor |

The target is the Don at Todmorden passing **79.0 m**, TRCA's flood line for the site.

## Data

TRCA open data (data.trca.ca, 15-minute values, 2015 to March 2021):
- River level: Todmorden HY019, East Don at York Mills HY022, Wilket Creek HY068, plus HY017, HY079, HY092, HY100 for context.
- Rain: Brickworks HY008, Dufferin Reservoir HY021, G Ross Dam HY027, Kennedy Pump Station HY036, Broadlands HY094, York Region Works Yard HY070.

The river passed 79.0 m **18 times** in that period (separate events at least 24 h apart).

`prepare.py` builds `data/don15.csv.gz` from the raw CSVs (download them into `data/raw/`, they are not committed because they total 280 MB). `backtest.py` tunes and scores. `export_event.py` writes one storm for the replay page. `record.py` records the video.

## How it was tested

- Settings were chosen on **2015 to 2018** (11 crossings), with a false-alarm budget fixed in advance: at most 4 a year for Prepare and 2 a year for Move now.
- Then scored once on **2019 to 2021** (7 crossings), which the tuning never saw.
- A false alarm is an alert that is not followed by a crossing within 6 hours.
- Every input is delayed 15 minutes to mimic publishing.

## Results on the held-out years (2019 to 2021)

| | Crossings warned at least 15 min ahead | Median warning | False alarms a year |
|---|---|---|---|
| Prepare (rain) | 5 of 7 | 105 min | 1.0 |
| Move now (river) | 6 of 7 | 30 min | 1.0 |
| Either alert | **7 of 7, every one at least 45 min ahead** | 105 min | up to 2 |
| Simple baseline: Todmorden passes 78.5 m | 6 of 7 | 45 min | 3.3 |

Per crossing (minutes of warning before the river passed 79.0 m; "–" = no alert):

| Crossing (EST) | Prepare | Move now | Baseline |
|---|---|---|---|
| 2019-04-14 22:15 | 105 | 15 | 45 |
| 2019-06-20 20:30 | – | 105 | 15 |
| 2019-10-27 04:00 | 60 | 0 | 30 |
| 2020-01-11 14:00 (rain on snow) | – | 45 | 90 |
| 2020-07-22 23:45 | 120 | 90 | 0 |
| 2020-08-02 11:00 | 105 | 15 | 45 |
| 2020-08-03 18:15 | 120 | 30 | 45 |

What this means in plain words:
- The river gives **minutes, not hours**. Move now gives a median of 30 minutes. Prepare, from rain, buys about an hour and a half more, but missed 2 of 7 (a winter rain-on-snow event and one storm that fell mostly outside the gauges).
- Move now beats the simple 78.5 m rule on false alarms (1 vs 3.3 a year) but not on warning time. We say so.
- 7 test crossings is a small sample. Treat these as "it works on real storms", not as a precise accuracy figure.

## What Flood Desk does and does not claim

- It does **not** forecast floods earlier than TRCA. TRCA issues watershed messages; on 16 July 2024 it issued a Flood Watch at 9:35 and a Flood Warning at 11:35 and phoned the Brick Works.
- It turns TRCA's message and the live gauges into a site plan: who moves what, by when.

## Not yet included

TRCA's open-data files stop in March 2021. Storms from 2022 to 2026, including 16 July 2024, need TRCA's live gauge feed.
