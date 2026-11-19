// Run with: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { FEATURES_WEATHER, buildFeatures, dailyFromHourly, eventLevel, score, target } from "../app/flood-model.js";
import { levelFor, TASKS, ROLES, LEVELS } from "../app/protocol.js";

const model = JSON.parse(fs.readFileSync(new URL("../app/model.json", import.meta.url)));

test("shipped model uses the same features the code builds", () => {
  assert.deepEqual(model.weather.features, FEATURES_WEATHER);
  for (const k of ["mu", "sd", "w"]) assert.equal(model.weather[k].length, FEATURES_WEATHER.length);
});

function hourly(days, rainOn = {}) {
  const H = { time: [], relative_humidity_2m: [], precipitation: [], temperature_2m: [], surface_pressure: [], snow_depth: [] };
  for (let d = 0; d < days; d++) for (let h = 0; h < 24; h++) {
    const date = `2025-06-${String(d + 1).padStart(2, "0")}`;
    H.time.push(`${date}T${String(h).padStart(2, "0")}:00`);
    H.precipitation.push(rainOn[d] && h >= 12 && h < 18 ? rainOn[d] / 6 : 0);
    H.relative_humidity_2m.push(h === 11 ? 90 : 70);
    H.temperature_2m.push(18); H.surface_pressure.push(1010); H.snow_depth.push(0);
  }
  return H;
}

test("daily rows: station rain replaces model rain, humidity before the rain peak is found", () => {
  const rows = dailyFromHourly(hourly(3, { 1: 12 }), {}, { "2025-06-02": [40, 50] });
  assert.equal(rows.length, 3);
  assert.equal(rows[1].p, 45); // station mean wins
  assert.equal(rows[0].p, 0);
  assert.equal(rows[1].rh5pk, 90); // the 11:00 reading sits inside the 5 h before the 12:00 peak
});

test("risk rises with heavy rain on wet ground and stays low on a dry day", () => {
  const dry = dailyFromHourly(hourly(20));
  const wet = dailyFromHourly(hourly(20, { 15: 30, 16: 15, 17: 10, 18: 60 }), {}, {});
  const pDry = score(model.weather, buildFeatures(dry)[18]);
  const pWet = score(model.weather, buildFeatures(wet)[18]);
  assert.ok(pDry < 0.05, `dry ${pDry}`);
  assert.ok(pWet > model.tiers.watch, `wet ${pWet}`);
});

test("event scoring counts a catch a day ahead and false alarms", () => {
  const days = [2, 2, 30, 25, 2, 2, 2].map((q, i) => ({ date: `d${i}`, q }));
  const p = [0, 0.5, 0.6, 0.6, 0, 0.9, 0];
  const r = eventLevel(days, p, 0.3, 20);
  assert.equal(r.events, 1); assert.equal(r.caughtAhead, 1); assert.equal(r.caughtByDay, 1);
  assert.equal(r.falseAlarmDaysPerYear, 1 / (7 / 365.25)); // day 5 only
  assert.equal(target(days, 1, 20), 1); assert.equal(target(days, 4, 20), 0);
});

test("protocol covers every level and role, and levels follow the tiers", () => {
  for (const lv of Object.keys(LEVELS)) for (const r of Object.keys(ROLES)) assert.ok(TASKS[lv][r]?.length, `${lv}/${r}`);
  const t = model.tiers;
  assert.equal(levelFor(0.01, t), "normal");
  assert.equal(levelFor(t.watch, t), "watch");
  assert.equal(levelFor(t.warning, t), "warning");
  assert.equal(levelFor(0, t, { riverHigh: true }), "flood");
  assert.equal(levelFor(0, t, { recovering: true }), "recovery");
});
