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

## Results on the held-out years (2019 to 2026, 25 crossings)

2019 to March 2021 come from TRCA open data; March 2021 to November 2026 from TRCA's gauging site export (`fetch_trca_live.py`, 5-minute values averaged to 15 minutes). Settings were not changed after 2018.

| | Crossings warned at least 15 min ahead | Median warning | False alarms a year |
|---|---|---|---|
| Prepare (rain) | 18 of 25 | 105 min | 3.2 |
| Move now (river) | 18 of 25 | 30 min | 1.6 |
| Either alert | **24 of 25** | 105 min | up to about 5 |
| Simple baseline: Todmorden passes 78.5 m | 23 of 25 | 45 min | 5.8 |

The one miss is 17 February 2022, a winter snowmelt rise with little rain. Per crossing, in Toronto time (minutes of warning; "–" = no alert):

| Crossing | Prepare | Move now | Baseline |
|---|---|---|---|
| 2019-04-14 23:15 | 105 | 15 | 45 |
| 2019-06-20 21:30 | – | 105 | 15 |
| 2019-10-27 05:00 | 60 | 0 | 30 |
| 2020-01-11 14:00 | – | 45 | 90 |
| 2020-07-23 00:45 | 120 | 90 | 0 |
| 2020-08-02 12:00 | 105 | 15 | 45 |
| 2020-08-03 19:15 | 120 | 30 | 45 |
| 2021-03-26 09:15 | 90 | 60 | 90 |
| 2021-09-08 03:45 | 255 | 0 | 210 |
| 2021-09-15 02:15 | 120 | 105 | 30 |
| 2021-09-22 23:30 | 105 | 15 | 45 |
| 2022-02-17 06:00 | – | – | 15 |
| 2022-07-25 00:00 | 120 | 90 | 15 |
| 2023-04-01 04:45 | – | 15 | 30 |
| 2023-06-12 10:15 | 45 | 30 | 60 |
| 2023-08-25 02:30 | – | 30 | 45 |
| 2024-04-03 13:00 | 45 | 15 | 30 |
| 2024-07-15 18:00 (and 16 July, same 24 h event) | – | 60 | 30 |
| 2024-08-17 16:00 | 105 | 90 | 15 |
| 2025-04-03 03:15 | 60 | 0 | 315 |
| 2025-12-28 22:45 | 90 | 15 | 45 |
| 2026-05-23 20:00 | 0 | 30 | 105 |
| 2026-06-18 05:30 | 105 | 0 | 30 |
| 2026-08-31 08:45 | 120 | 0 | 15 |
| 2026-09-02 18:00 | 675 | 0 | 0 |

What this means in plain words:
- The river gives **minutes, not hours**. Move now alone gives a median of 30 minutes; Prepare, from rain, adds about an hour more.
- Together they warned 24 of 25 crossings at least 15 minutes ahead, with fewer false alarms than the simple 78.5 m rule, which gives similar coverage at 5.8 false alarms a year.
- Prepare's false alarms rose from 1 a year (2019 to 2021) to 3.2 a year over 2019 to 2026. Heavy rain that doesn't flood the Don is common. That is why Prepare means "get ready", not "close".
- 16 July 2024 counts in the same event as a smaller crossing the evening before (events closer than 24 h are merged). In the replay, TRCA's 09:35 Flood Watch starts the checklist; Flood Desk's rain rule confirms at 10:45; the river passes 79.0 m at 11:15.

## What Flood Desk does and does not claim

- It does **not** forecast floods earlier than TRCA. TRCA issues watershed messages; on 16 July 2024 it issued a Flood Watch at 9:35 and a Flood Warning at 11:35 and phoned the Brick Works.
- It turns TRCA's message and the live gauges into a site plan: who moves what, by when.

