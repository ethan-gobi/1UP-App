// Flood-risk model for the Don River at Evergreen Brick Works.
// Pure JS, no dependencies. The app imports this file in the browser; model/train.mjs imports it in Node to retrain.
// Data (all free, no key):
//   Rain:    ECCC daily climate stations Toronto City (6158355), North York (615S001), Pearson (6158733 / 6158731), averaged.
//            Station gauges are used because the reanalysis grid misses summer cloudbursts (it shows 12 mm on 2013-07-08; Pearson logged 126 mm).
//   Weather: Open-Meteo historical archive (ERA5 / ERA5-Land), point 43.75 N, -79.37 W (middle of the Don watershed).
//   River:   Water Survey of Canada daily mean discharge, station 02HC024 "Don River at Todmorden" (just upstream of the Brick Works).
// Question: will Todmorden's daily mean discharge reach 20 m3/s today or tomorrow? Uses today's and tomorrow's rain (forecast in
// the app, measured in training) plus the days before.

// Soil-moisture fields were tried and dropped: the archive (ERA5-Land) and live forecast (ECMWF IFS) soil values sit on
// different scales (about 0.44 vs 0.22), so a model trained on one would misread the other. The antecedent
// precipitation index (lapi) stands in for "how soaked the ground already is".
export const FEATURES_WEATHER = [
  "lp", "lpn", "lpmax", "lp1", "lp2", "lapi", "melt", "warm", "rhmax", "h80", "rh5pk", "msin", "mcos", "psrng",
];
export const FEATURES_GAUGE = [...FEATURES_WEATHER, "lq1"];

const l1p = (x) => Math.log1p(Math.max(0, x ?? 0));

// rows: [{date, p (station rain mm), pmax (max hourly rain, grid), rhmax, h80, rh5pk, t, psrng, snd, q024}] sorted by date, one per day.
export function buildFeatures(rows) {
  const out = [];
  let api = 0; // antecedent precipitation index up to (not incl.) day D
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], y1 = rows[i - 1] || r, y2 = rows[i - 2] || y1, t1 = rows[i + 1];
    const m = new Date(r.date + "T12:00").getMonth();
    const melt = Math.max(0, (y1.snd ?? 0) - (r.snd ?? 0)) * 100; // cm of snow depth lost
    const f = {
      date: r.date,
      lp: l1p(r.p), lpn: t1 ? l1p(t1.p) : 0, lpmax: l1p(r.pmax), lp1: l1p(y1.p), lp2: l1p(y2.p), lapi: l1p(api),
      melt: l1p(melt), warm: (r.t ?? 0) > 2 ? 1 : 0,
      rhmax: (r.rhmax ?? 70) / 100, h80: (r.h80 ?? 0) / 24, rh5pk: (r.rh5pk ?? 70) / 100,
      msin: Math.sin((2 * Math.PI * m) / 12), mcos: Math.cos((2 * Math.PI * m) / 12),
      psrng: r.psrng ?? 2,
      lq1: y1.q024 != null ? Math.log(0.1 + y1.q024) : null,
      q: r.q024, q1: y1.q024,
    };
    out.push(f);
    api = api * 0.85 + (r.p ?? 0);
  }
  return out;
}

export function fitLogistic(X, y, { l2 = 1e-3, iters = 3000, lr = 0.05 } = {}) {
  const n = X.length, d = X[0].length;
  const mu = Array(d).fill(0), sd = Array(d).fill(0);
  for (const x of X) x.forEach((v, j) => (mu[j] += v / n));
  for (const x of X) x.forEach((v, j) => (sd[j] += (v - mu[j]) ** 2 / n));
  for (let j = 0; j < d; j++) sd[j] = Math.sqrt(sd[j]) || 1;
  const Z = X.map((x) => x.map((v, j) => (v - mu[j]) / sd[j]));
  let w = Array(d).fill(0), b = 0;
  const m = Array(d + 1).fill(0), v = Array(d + 1).fill(0);
  for (let t = 1; t <= iters; t++) {
    const g = Array(d + 1).fill(0);
    for (let i = 0; i < n; i++) {
      let s = b; for (let j = 0; j < d; j++) s += w[j] * Z[i][j];
      const e = 1 / (1 + Math.exp(-s)) - y[i];
      for (let j = 0; j < d; j++) g[j] += (e * Z[i][j]) / n;
      g[d] += e / n;
    }
    for (let j = 0; j < d; j++) g[j] += l2 * w[j];
    for (let j = 0; j <= d; j++) {
      m[j] = 0.9 * m[j] + 0.1 * g[j]; v[j] = 0.999 * v[j] + 0.001 * g[j] ** 2;
      const step = (lr * (m[j] / (1 - 0.9 ** t))) / (Math.sqrt(v[j] / (1 - 0.999 ** t)) + 1e-8);
      if (j < d) w[j] -= step; else b -= step;
    }
  }
  return { mu, sd, w, b };
}

export const predict = (M, x) => {
  let s = M.b; for (let j = 0; j < x.length; j++) s += M.w[j] * ((x[j] - M.mu[j]) / M.sd[j]);
  return 1 / (1 + Math.exp(-s));
};

export function auc(p, y) {
  const idx = p.map((v, i) => [v, y[i]]).sort((a, b) => a[0] - b[0]);
  let rank = 0, sumPos = 0, nPos = 0;
  idx.forEach(([, yy], i) => { rank = i + 1; if (yy) { sumPos += rank; nPos++; } });
  const nNeg = idx.length - nPos;
  return (sumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

export function confusion(p, y, thr) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  p.forEach((v, i) => { const h = v >= thr; if (h && y[i]) tp++; else if (h) fp++; else if (y[i]) fn++; else tn++; });
  return { tp, fp, fn, tn, recall: tp / (tp + fn || 1), precision: tp / (tp + fp || 1), accuracy: (tp + tn) / p.length,
    f1: (2 * tp) / (2 * tp + fp + fn || 1) };
}

export function bestThreshold(p, y) {
  let best = { f1: -1, thr: 0.5 };
  for (let t = 0.02; t < 0.95; t += 0.01) { const c = confusion(p, y, t); if (c.f1 > best.f1) best = { f1: c.f1, thr: +t.toFixed(2) }; }
  return best.thr;
}

// Event level: a high-water event is a run of days >= level. It counts as caught when the model was at or above
// `thr` on the first day or the day before. A false-alarm day is an alert day with no high water that day or the next.
// Target: high water at Todmorden today or tomorrow (the "next 48 hours" the app shows).
export const target = (F, i, level) => (F[i].q >= level || (F[i + 1] && F[i + 1].q >= level) ? 1 : 0);

// Event level. An event is a run of days >= level starting on day s.
//   caughtAhead: the score was at or above `thr` on day s-1, a day before the river went high.
//   caughtByDay: at or above on s-1 or s.
// A false-alarm day is an alert day with no high water that day or the next.
export function eventLevel(days, p, thr, level) {
  let events = 0, ahead = 0, byDay = 0, falseAlarmDays = 0;
  const hi = (k) => days[k] && days[k].q >= level, al = (k) => p[k] != null && p[k] >= thr;
  for (let i = 0; i < days.length; i++) {
    if (hi(i) && !hi(i - 1)) { events++; if (al(i - 1)) ahead++; if (al(i - 1) || al(i)) byDay++; }
    if (al(i) && !hi(i) && !hi(i + 1)) falseAlarmDays++;
  }
  return { events, caughtAhead: ahead, caughtByDay: byDay, falseAlarmDaysPerYear: falseAlarmDays / (days.length / 365.25) };
}

const labelled = (rows) => buildFeatures(rows).filter((f) => f.q != null && f.q1 != null);

// Full experiment. Train 2000-2015, pick the alert threshold on 2016-2019, report once on untouched 2020-2023.
export function experiment(rows, { level = 20 } = {}) {
  const F = labelled(rows), yr = (f) => +f.date.slice(0, 4);
  const idx = (lo, hi) => F.map((f, i) => (yr(f) >= lo && yr(f) <= hi && F[i + 1] ? i : -1)).filter((i) => i >= 0);
  const split = { train: idx(2000, 2015), val: idx(2016, 2019), test: idx(2020, 2023) };
  const Y = (ix) => ix.map((i) => target(F, i, level));
  const res = {};
  const sets = [["weather", FEATURES_WEATHER], ["weather+gauge", FEATURES_GAUGE], ["humidityOnly", ["rhmax", "h80", "rh5pk"]], ["rainOnly", ["lp", "lpn", "lp1", "lapi"]]];
  for (const [name, feats] of sets) {
    const X = (ix) => ix.map((i) => feats.map((k) => F[i][k]));
    const M = fitLogistic(X(split.train), Y(split.train));
    const pv = X(split.val).map((x) => predict(M, x)), thr = bestThreshold(pv, Y(split.val));
    const pt = X(split.test).map((x) => predict(M, x)), yt = Y(split.test);
    const testDays = split.test.map((i) => F[i]);
    res[name] = {
      threshold: thr, testDays: yt.length, positiveDays: yt.reduce((a, b) => a + b, 0),
      auc: auc(pt, yt), test: confusion(pt, yt, thr),
      brier: pt.reduce((a, v, i) => a + (v - yt[i]) ** 2, 0) / yt.length,
      tiers: Object.fromEntries([0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5].map((t) => [t, eventLevel(testDays, pt, t, level)])),
    };
  }
  const yt = Y(split.test), rule = (fn) => confusion(split.test.map((i) => (fn(rows.find((r) => r.date === F[i].date)) ? 1 : 0)), yt, 0.5);
  res.baselines = {
    humidityOver75: rule((r) => r.rhmax >= 75), humidityOver80: rule((r) => r.rhmax >= 80),
    humidity75in5hBeforeRain: rule((r) => r.rh5pk >= 75 && r.p > 1), rain20mm: rule((r) => r.p >= 20),
    neverWarn: rule(() => false),
  };
  return res;
}

// Refit on every labelled day for the version shipped in the app.
export function fitFinal(rows, { level = 20 } = {}) {
  const F = labelled(rows), ix = F.map((f, i) => (F[i + 1] ? i : -1)).filter((i) => i >= 0);
  const out = {};
  for (const [name, feats] of [["weather", FEATURES_WEATHER], ["gauge", FEATURES_GAUGE]]) {
    const M = fitLogistic(ix.map((i) => feats.map((k) => F[i][k])), ix.map((i) => target(F, i, level)));
    out[name] = { features: feats, mu: M.mu.map((v) => +v.toFixed(5)), sd: M.sd.map((v) => +v.toFixed(5)), w: M.w.map((v) => +v.toFixed(5)), b: +M.b.toFixed(5) };
  }
  return out;
}

// Hourly Open-Meteo arrays -> one row per local day. Also used by the app on live forecast data.
export function dailyFromHourly(H, flow = {}, rain = {}) {
  const byDay = {};
  H.time.forEach((t, i) => (byDay[t.slice(0, 10)] ||= []).push(i));
  return Object.keys(byDay).sort().map((d) => {
    const ix = byDay[d], val = (k) => ix.map((i) => H[k][i]).filter((v) => v != null);
    const rh = val("relative_humidity_2m"), p = ix.map((i) => H.precipitation[i] ?? 0), ps = val("surface_pressure");
    let pk = ix[0]; for (const i of ix) if ((H.precipitation[i] ?? 0) > (H.precipitation[pk] ?? 0)) pk = i;
    let rh5 = null; for (let i = Math.max(0, pk - 5); i < pk; i++) if (H.relative_humidity_2m[i] != null) rh5 = Math.max(rh5 ?? 0, H.relative_humidity_2m[i]);
    const st = rain[d], mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null), sd = val("snow_depth");
    return {
      date: d, p: st ? mean(st) : p.reduce((s, v) => s + v, 0), pmax: Math.max(...p),
      rhmax: rh.length ? Math.max(...rh) : null, h80: rh.filter((v) => v >= 80).length, rh5pk: rh5 ?? (rh.length ? Math.max(...rh) : null),
      t: mean(val("temperature_2m")), psrng: ps.length ? Math.max(...ps) - Math.min(...ps) : null, snd: mean(sd), q024: flow[d] ?? null, hours: ix.length,
    };
  });
}


// Score one day with a fitted model ({features, mu, sd, w, b}).
export const score = (M, f) => predict(M, M.features.map((k) => f[k]));
