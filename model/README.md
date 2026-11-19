# Flood forecast: how it was built and how good it is

## The question

Will the Don River at Todmorden (Water Survey of Canada gauge 02HC024, just upstream of the Brick Works) average **20 m³/s or more today or tomorrow**? That happened on 178 days from 2000 to 2023, about 7 days a year. The July 2013 flood averaged 53 m³/s.

Official daily flows stop at the end of 2023, so that is where labelled history ends.

## Data (free, no keys)

- **Rain:** daily totals from Environment Canada stations Toronto City (6158355), North York (615S001) and Pearson (6158733, then 6158731), averaged.
- **Other weather:** Open-Meteo historical archive (ERA5) at 43.75 N, 79.37 W, the middle of the Don watershed: hourly humidity, rain intensity, temperature, pressure, snow depth.
- **River:** Water Survey of Canada daily mean discharge, 02HC024.

The first version used grid rain only. It missed most summer floods because the grid smooths out cloudbursts: it shows 12 mm on 8 July 2013, when Pearson measured 126 mm. Switching to station rain fixed most of that.

## Model

Logistic regression, 14 inputs: rain today and tomorrow, rain the two days before, a fading total of past rain (0.85 per day, a stand-in for soil saturation), heaviest hourly rain, snowmelt, warmth, peak humidity, hours above 80% humidity, humidity in the 5 hours before the heaviest rain, pressure swing, and season. Soil-moisture fields were tried and dropped because archive and live-forecast soil values sit on different scales.

Trained on 2000 to 2015. Alert levels chosen on 2016 to 2019. Scored once on 2020 to 2023, which the model never saw. The shipped weights in `app/model.json` are refit on 2000 to 2023.

## Results on 2020 to 2023 (20 high-water events)

| Alert level | Events flagged a day ahead | Flagged by the day itself | False-alarm days a year |
|---|---|---|---|
| Watch (15%) | 16 of 20 | 20 of 20 | 13.3 |
| Warning (30%) | 13 of 20 | 18 of 20 | 5.3 |

AUC 0.963. Day-by-day accuracy 97.7% at the best single cut-off (35%), but a "never warn" rule gets 97.0%, so plain accuracy flatters any model here. Event counts are the honest measure.

Training used the rain that actually fell the next day, as if the forecast were perfect. In daily use the model depends on Open-Meteo's rain forecast, so expect somewhat worse, especially for summer thunderstorms.

Adding yesterday's river flow raised AUC to 0.970 but did not catch more events at Watch or Warning, so the app ships the weather-only model and shows the live gauge on its own card.

## The 75% humidity rule

Same test period, same question (high water today or tomorrow, 44 such days):

| Rule | Caught | False alarms | Days right |
|---|---|---|---|
| Humidity over 75% | 44 of 44 | 1,255 | 14.0% |
| Humidity over 80% | 44 of 44 | 1,145 | 21.6% |
| Over 75% in the 5 h before the heaviest rain | 37 of 44 | 336 | 76.5% |
| 20 mm of rain or more | 14 of 44 | 12 | 97.1% |
| This model at 35% | 27 of 44 | 16 | 97.7% |

Humidity passed 75% on 89% of all days from 2000 to 2023. It catches every flood because it is almost always on. A model trained on humidity alone (AUC 0.81) flags only 7 of 20 events a day ahead, with 44 false-alarm days a year. Humidity just before rain carries a little signal, so the model keeps it as an input, but rain does the real work.

## After 2023

Checked by hand with measured rain: the day before the 16 July 2024 flood scored 95% (Warning). The day before 17 August 2024 scored 28% (Watch). The day before 2 September 2026 scored 16% (Watch, just over the line).

## Limits

- A daily average can stay under 20 m³/s while a short peak still floods the low ground. The live gauge card shows 5-minute readings for that reason.
- The model works by day, so it cannot promise an exact 5-hour lead. The hourly chart and the live gauge cover the last hours.
- The rain forecast is the weakest link.

## Retrain

`node model/train.mjs` (Node 18+, open internet). It downloads the data, prints the scores, and rewrites `app/model.json` and `model/results.json`.
