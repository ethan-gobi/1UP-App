// Retrain the flood-risk model: `node model/train.mjs` (Node 18+, open internet, about 1 minute).
// Downloads 2000-2023 data, prints held-out accuracy and writes app/model.json.
import { experiment, fitFinal, dailyFromHourly } from "../app/flood-model.js";
import fs from "node:fs";

const ECCC = "https://api.weather.gc.ca/collections";
const STATIONS = ["6158355", "615S001", "6158733", "6158731"];

async function ogc(url) {
  let rows = [];
  for (let off = 0; ; off += 10000) {
    const j = await (await fetch(`${url}&f=json&limit=10000&offset=${off}`)).json();
    rows = rows.concat(j.features.map((f) => f.properties));
    if (j.features.length < 10000) return rows;
  }
}

export async function downloadRows(start = "2000-01-01", end = "2023-12-31") {
  const vars = "relative_humidity_2m,precipitation,temperature_2m,surface_pressure,snow_depth";
  const H = {};
  for (const [a, b] of [[start, "2011-12-31"], ["2012-01-01", end]]) {
    const j = await (await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=43.75&longitude=-79.37&start_date=${a}&end_date=${b}&hourly=${vars}&timezone=America/Toronto`)).json();
    for (const k in j.hourly) H[k] = (H[k] || []).concat(j.hourly[k]);
  }
  const flow = Object.fromEntries((await ogc(`${ECCC}/hydrometric-daily-mean/items?STATION_NUMBER=02HC024&datetime=${start}/${end}&properties=DATE,DISCHARGE`)).map((r) => [r.DATE, r.DISCHARGE]));
  const rain = {};
  for (const id of STATIONS) for (const r of await ogc(`${ECCC}/climate-daily/items?CLIMATE_IDENTIFIER=${id}&datetime=${start}/${end}&properties=LOCAL_DATE,TOTAL_PRECIPITATION`))
    if (r.TOTAL_PRECIPITATION != null) (rain[r.LOCAL_DATE.slice(0, 10)] ||= []).push(r.TOTAL_PRECIPITATION);
  return dailyFromHourly(H, flow, rain);
}


const rows = await downloadRows();
const result = experiment(rows);
console.log(JSON.stringify(result, null, 1));
const model = JSON.parse(fs.readFileSync(new URL("../app/model.json", import.meta.url)));
model.weather = fitFinal(rows).weather;
fs.writeFileSync(new URL("../app/model.json", import.meta.url), JSON.stringify(model, null, 1));
fs.writeFileSync(new URL("./results.json", import.meta.url), JSON.stringify(result, null, 1));
