import { buildFeatures, dailyFromHourly, score } from "./flood-model.js";
import { ROLES, LEVELS, TASKS, levelFor } from "./protocol.js";
import { mountPickup } from "./pickup.js";

const TZ = "America/Toronto";
const LAT = 43.75, LON = -79.37; // middle of the Don watershed, same point the model was trained on
const STATIONS = ["6158355", "615S001", "6158731"]; // Toronto City, North York, Pearson (rain gauges)
const HIGH_WATER = 20; // m3/s daily mean at Todmorden
const ECCC = "https://api.weather.gc.ca/collections";
const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

const S = { model: null, role: store.get("fd-role", "maya"), view: "forecast", replay: false, data: null, level: "normal" };

// ---------- dates ----------
const ymd = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
const hourKey = (d) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hour: "2-digit", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:00`;
};
const addDays = (s, n) => { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dow = (s, len = "short") => new Date(s + "T12:00:00Z").toLocaleDateString("en-CA", { weekday: len, timeZone: "UTC" });
const md = (s) => new Date(s + "T12:00:00Z").toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
const pct = (p) => (p < 0.01 ? "<1" : Math.round(p * 100));

// ---------- data ----------
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url.split("?")[0]}`);
  return r.json();
}

async function stationRain(from, to) {
  const rain = {};
  await Promise.all(STATIONS.map(async (id) => {
    try {
      const j = await getJSON(`${ECCC}/climate-daily/items?CLIMATE_IDENTIFIER=${id}&datetime=${from}/${to}&properties=LOCAL_DATE,TOTAL_PRECIPITATION&f=json&limit=500`);
      for (const f of j.features) { const p = f.properties; if (p.TOTAL_PRECIPITATION != null) (rain[p.LOCAL_DATE.slice(0, 10)] ||= []).push(p.TOTAL_PRECIPITATION); }
    } catch { /* one station down is fine */ }
  }));
  return rain;
}

async function loadLive() {
  const today = ymd(new Date());
  const vars = "relative_humidity_2m,precipitation,temperature_2m,surface_pressure,snow_depth";
  const [wx, rain, gauge] = await Promise.all([
    getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&hourly=${vars}&past_days=35&forecast_days=8&timezone=${encodeURIComponent(TZ)}`),
    stationRain(addDays(today, -40), addDays(today, -1)),
    getJSON(`${ECCC}/hydrometric-realtime/items?STATION_NUMBER=02HC024&properties=DATETIME,DISCHARGE,LEVEL&sortby=-DATETIME&f=json&limit=9000`).catch(() => null),
  ]);
  const series = (gauge?.features || []).map((f) => ({ t: new Date(f.properties.DATETIME), q: f.properties.DISCHARGE, h: f.properties.LEVEL })).filter((x) => x.q != null).reverse();
  return { today, nowKey: hourKey(new Date()), H: wx.hourly, rain, series, live: true };
}

async function loadReplay() {
  // 16 July 2024: about 51 mm fell on the Don watershed (more downtown) and the Brick Works flooded. Days from the 16th play as "forecast".
  const today = "2024-07-16", from = "2024-06-05", to = "2024-07-22";
  const vars = "relative_humidity_2m,precipitation,temperature_2m,surface_pressure,snow_depth";
  const [wx, rain] = await Promise.all([
    getJSON(`https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}&start_date=${from}&end_date=${to}&hourly=${vars}&timezone=${encodeURIComponent(TZ)}`),
    stationRain(from, to),
  ]);
  // No hindsight: from the storm day on, use the forecast that was actually issued the day before
  // (Open-Meteo previous-runs archive), not the rain that fell. It called for under 10 mm; about 51 mm fell.
  const fc = await getJSON(`https://previous-runs-api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&start_date=${today}&end_date=${to}&hourly=${vars.split(",").map((v) => v + "_previous_day1").join(",")}&timezone=${encodeURIComponent(TZ)}`);
  const H = wx.hourly;
  fc.hourly.time.forEach((t, j) => {
    const i = H.time.indexOf(t); if (i < 0) return;
    for (const v of vars.split(",")) { const x = fc.hourly[v + "_previous_day1"]?.[j]; if (x != null) H[v][i] = x; }
  });
  return { today, nowKey: "2024-07-16T08:00", H, rain, series: [], live: false };
}

function assemble(raw) {
  const { today } = raw;
  const observedRain = {};
  for (const [d, v] of Object.entries(raw.rain)) if (d < today) observedRain[d] = v;
  const flowByDay = {};
  for (const x of raw.series) (flowByDay[ymd(x.t)] ||= []).push(x.q);
  const flow = Object.fromEntries(Object.entries(flowByDay).filter(([, v]) => v.length >= 200).map(([d, v]) => [d, v.reduce((a, b) => a + b, 0) / v.length]));
  const rows = dailyFromHourly(raw.H, {}, observedRain).filter((r) => r.hours >= 20);
  const feats = buildFeatures(rows);
  const days = rows.map((r, i) => ({
    ...r, p: score(S.model.weather, feats[i]), f: feats[i], river: flow[r.date] ?? null,
    source: r.date < today ? (observedRain[r.date] ? "observed" : "analysis") : r.date === today ? "today" : "forecast",
    rainSource: observedRain[r.date] ? "gauges" : "model",
  }));
  return { ...raw, days, flow };
}

async function load() {
  setBusy(true);
  try {
    if (!S.model) S.model = await getJSON("model.json");
    S.data = assemble(S.replay ? await loadReplay() : await loadLive());
    render();
  } catch (e) {
    console.error(e);
    $("asOf").textContent = "Could not reach the weather service. Check the connection and press refresh.";
    $("headline").textContent = "No live data right now";
    $("levelName").textContent = "Unknown";
  } finally { setBusy(false); }
}

function setBusy(b) { $("refresh").classList.toggle("spin", b); $("refresh").disabled = b; }

// ---------- level ----------
function currentLevel(D) {
  const t = D.days.find((d) => d.date === D.today);
  const recent = D.series.slice(-72); // last ~6 h of 5-minute readings
  const flowNow = recent.length ? recent.reduce((a, x) => a + x.q, 0) / recent.length : null;
  const highRecently = [1, 2].some((k) => (D.flow[addDays(D.today, -k)] ?? 0) >= HIGH_WATER);
  return levelFor(t?.p ?? 0, S.model.tiers, { riverHigh: flowNow != null && flowNow >= HIGH_WATER, recovering: highRecently });
}
const dayLevel = (d, D) => (d.date === D.today ? S.level : levelFor(d.p, S.model.tiers));

// ---------- render ----------
function render() {
  const D = S.data; if (!D) return;
  S.level = currentLevel(D);
  renderForecast(D); renderTasks(D); renderModel(D); pickup.update(S.level, S.role);
  const when = D.live ? `Updated ${new Date().toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", timeZone: TZ })} Toronto time` : "Replay: 16 July 2024 at 8 am, with the forecast issued the day before (no hindsight)";
  $("asOf").textContent = when;
}

function renderForecast(D) {
  const t = D.days.find((d) => d.date === D.today);
  const lv = S.level, card = $("status");
  card.dataset.level = lv;
  $("levelName").textContent = LEVELS[lv].label;
  $("pctToday").textContent = pct(t.p);
  requestAnimationFrame(() => $("dialArc").style.strokeDasharray = `${Math.max(1, Math.round(t.p * 100))} 100`);
  const ahead = D.days.filter((d) => d.date > D.today && d.date <= addDays(D.today, 6));
  const nextAlert = ahead.find((d) => d.p >= S.model.tiers.watch);
  const head = {
    normal: nextAlert ? `Low today. ${levelFor(nextAlert.p, S.model.tiers) === "warning" ? "Warning" : "Watch"} ${dow(nextAlert.date, "long")}.` : "Low risk all week",
    watch: "Heavy rain possible. Get ready.",
    warning: "Pack down the market today",
    flood: "The Don is high right now",
    recovery: "Water is down. Recovery under way.",
  }[lv];
  $("headline").textContent = head;
  $("speech").textContent = {
    normal: "All calm in the valley today. Go enjoy the market!",
    watch: "Ooh, clouds are gathering. Let's get our bags packed, just in case.",
    warning: "Eek! Big rain is coming. Time to fold up the market and head somewhere dry.",
    flood: "The river is up! Stay out of the valley. Pickup is at Copp Hall.",
    recovery: "Phew, the water's going down. Let's tidy up and reopen soon!",
  }[lv];
  $("subline").textContent = `${pct(t.p)}% chance the Don at Todmorden runs high today or tomorrow. ${LEVELS[lv].summary}`;

  // Drivers: the inputs pushing today's score up the most, in plain words.
  const M = S.model.weather, f = t.f;
  const contrib = Object.fromEntries(M.features.map((k, j) => [k, M.w[j] * ((f[k] - M.mu[j]) / M.sd[j])]));
  const rainOn = (n) => Math.expm1(D.days.find((d) => d.date === addDays(D.today, n))?.f.lp ?? 0);
  const items = [
    ["lp", "Rain today", `${rainOn(0).toFixed(0)} mm`],
    ["lpn", "Rain tomorrow", `${rainOn(1).toFixed(0)} mm`],
    ["lp1", "Last 3 days", `${(rainOn(-1) + rainOn(-2) + rainOn(-3)).toFixed(0)} mm`],
    ["lapi", "Ground wetness", `${Math.expm1(f.lapi).toFixed(0)} mm stored`],
    ["rh5pk", "Humidity before rain", `${Math.round(f.rh5pk * 100)}%`],
    ["melt", "Snowmelt", f.melt > 0 ? `${Math.expm1(f.melt).toFixed(0)} cm` : "none"],
  ];
  $("drivers").innerHTML = items.map(([k, label, v]) => `<li${contrib[k] > 0.4 ? ' class="up"' : ""}><span>${label}</span><b>${v}</b></li>`).join("");

  // Day strip: 3 days back, today, 6 ahead.
  const win = D.days.filter((d) => d.date >= addDays(D.today, -3) && d.date <= addDays(D.today, 6));
  const box = $("days"); box.style.setProperty("--n", win.length);
  box.innerHTML = win.map((d) => {
    const l = dayLevel(d, D), fc = d.source === "forecast" || d.source === "today";
    const tag = d.source === "today" ? "Today" : dow(d.date);
    const label = `${dow(d.date, "long")} ${md(d.date)}: ${pct(d.p)}% chance, ${Math.expm1(d.f.lp).toFixed(0)} mm rain, ${fc ? "forecast" : "measured"}`;
    return `<div class="day ${fc ? "fc" : "obs"} ${d.date === D.today ? "today" : ""}" role="listitem" aria-label="${label}">
      <span class="dow">${tag}</span><span class="date">${md(d.date)}</span>
      <span class="bar"><i data-lv="${l}" style="transform:scaleY(0)" data-h="${Math.max(0.04, Math.min(1, d.p / 0.6))}"></i></span>
      <span class="pct">${pct(d.p)}%</span><span class="rain">${Math.expm1(d.f.lp).toFixed(0)} mm</span></div>`;
  }).join("");
  requestAnimationFrame(() => box.querySelectorAll("i").forEach((el, i) => { el.style.transitionDelay = `${i * 40}ms`; el.style.transform = `scaleY(${el.dataset.h})`; }));

  // Gauge
  if (D.series.length) {
    const recent = D.series.slice(-12), now = recent.reduce((a, x) => a + x.q, 0) / recent.length;
    $("flowNow").textContent = now < 10 ? now.toFixed(1) : now.toFixed(0);
    $("gaugeTag").textContent = "Live";
    const peak = Math.max(...D.series.filter((x) => x.t > Date.now() - 7 * 864e5).map((x) => x.q));
    $("flowSub").textContent = `High-water line is ${HIGH_WATER} m³/s as a daily average. Peak in the last 7 days: ${peak.toFixed(1)} m³/s. Water Survey of Canada gauge 02HC024.`;
    lineChart($("gaugeChart"), D.series.filter((x) => x.t > Date.now() - 7 * 864e5).map((x) => [x.t.getTime(), x.q]), { thr: HIGH_WATER, thrLabel: "High-water line" });
  } else {
    $("flowNow").textContent = "–"; $("gaugeTag").textContent = D.live ? "Offline" : "Replay";
    $("flowSub").textContent = D.live ? "The live gauge did not answer. The forecast still works without it." : "This daily view only had the day-before forecast. Open the minute-by-minute storm replay to see the river gauges.";
    $("gaugeChart").innerHTML = "";
  }

  // Next 48 h
  const i0 = Math.max(0, D.H.time.indexOf(D.nowKey));
  const hrs = D.H.time.slice(i0, i0 + 48).map((tm, k) => ({ tm, p: D.H.precipitation[i0 + k] ?? 0, rh: D.H.relative_humidity_2m[i0 + k] }));
  hourChart($("hourChart"), hrs);
  const humid = hrs.filter((h) => h.rh >= 75).length;
  $("humidityNote").textContent = `Bars: rain per hour. Line: humidity, with 75 to 80% shaded. Humidity is above 75% for ${humid} of the next ${hrs.length} hours. That alone is normal in Toronto, so it only counts alongside the rain.`;
}

// ---------- charts (plain SVG) ----------
let W = 600; // set to the chart's real width so text is never stretched
function lineChart(el, pts, { thr, thrLabel } = {}) {
  W = Math.max(280, el.clientWidth || 600);
  if (!pts.length) { el.innerHTML = ""; return; }
  const H = el.clientHeight || 150, pad = { l: 34, r: 8, t: 10, b: 22 };
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y1 = Math.max(thr ?? 0, ...ys) * 1.1 || 1;
  const X = (x) => pad.l + ((x - x0) / (x1 - x0 || 1)) * (W - pad.l - pad.r), Y = (y) => pad.t + (1 - y / y1) * (H - pad.t - pad.b);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("");
  const ticks = [0, y1 / 2, y1].map((v) => `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pad.l - 6}" y="${Y(v) + 4}" text-anchor="end">${v.toFixed(v < 10 ? 1 : 0)}</text>`).join("");
  const days = []; for (let t = Math.ceil(x0 / 864e5) * 864e5; t <= x1; t += 864e5) days.push(t);
  const xl = days.map((t) => `<text x="${X(t)}" y="${H - 4}" text-anchor="middle">${new Date(t).toLocaleDateString("en-CA", { weekday: "short", timeZone: TZ })}</text>`).join("");
  const th = thr != null ? `<line class="thr" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(thr)}" y2="${Y(thr)}"/><text class="thrlabel" x="${W - pad.r}" y="${Y(thr) - 5}" text-anchor="end">${thrLabel}</text>` : "";
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}">${ticks}${th}<path class="area" d="${d}L${X(x1)},${Y(0)}L${X(x0)},${Y(0)}Z"/><path class="line" d="${d}" vector-effect="non-scaling-stroke"/>${xl}</svg>`;
}

function hourChart(el, hrs) {
  W = Math.max(280, el.clientWidth || 600);
  const H = el.clientHeight || 190, pad = { l: 34, r: 34, t: 10, b: 22 }, n = hrs.length || 1;
  const pmax = Math.max(4, ...hrs.map((h) => h.p)) * 1.1, bw = (W - pad.l - pad.r) / n;
  const X = (i) => pad.l + i * bw, Yp = (v) => pad.t + (1 - v / pmax) * (H - pad.t - pad.b), Yr = (v) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  const band = `<rect class="band" x="${pad.l}" width="${W - pad.l - pad.r}" y="${Yr(80)}" height="${Yr(75) - Yr(80)}"/>`;
  const bars = hrs.map((h, i) => h.p > 0 ? `<rect class="rainbar" x="${X(i) + 1}" width="${Math.max(1, bw - 2)}" y="${Yp(h.p)}" height="${Yp(0) - Yp(h.p)}" rx="1.5"/>` : "").join("");
  const rh = hrs.map((h, i) => `${i ? "L" : "M"}${(X(i) + bw / 2).toFixed(1)},${Yr(h.rh ?? 0).toFixed(1)}`).join("");
  const xl = hrs.map((h, i) => (h.tm.endsWith("T00:00") ? `<line class="now" x1="${X(i)}" x2="${X(i)}" y1="${pad.t}" y2="${H - pad.b}"/><text x="${X(i) + 4}" y="${H - 4}">${dow(h.tm.slice(0, 10))}</text>` : "")).join("");
  const axes = `<text x="${pad.l - 6}" y="${Yp(0) + 4}" text-anchor="end">0</text><text x="${pad.l - 6}" y="${Yp(pmax / 1.1) + 4}" text-anchor="end">${(pmax / 1.1).toFixed(0)}mm</text><text x="${W - pad.r + 6}" y="${Yr(75) + 4}">75%</text><text x="${W - pad.r + 6}" y="${Yr(100) + 8}">100%</text>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}"><line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Yp(0)}" y2="${Yp(0)}"/>${band}${bars}<path class="rh" d="${rh}" vector-effect="non-scaling-stroke"/>${xl}${axes}</svg>`;
}

function hindcastChart(el, days) {
  W = Math.max(280, el.clientWidth || 600);
  const H = el.clientHeight || 190, pad = { l: 34, r: 40, t: 10, b: 22 }, n = days.length || 1, bw = (W - pad.l - pad.r) / n;
  const qmax = Math.max(HIGH_WATER * 1.2, ...days.map((d) => d.river ?? 0));
  const X = (i) => pad.l + i * bw, Yp = (v) => pad.t + (1 - v) * (H - pad.t - pad.b), Yq = (v) => pad.t + (1 - v / qmax) * (H - pad.t - pad.b);
  const hit = (i) => (days[i]?.river ?? 0) >= HIGH_WATER || (days[i + 1]?.river ?? 0) >= HIGH_WATER;
  const bars = days.map((d, i) => `<rect class="${hit(i) ? "hit" : "rainbar"}" x="${X(i) + 1}" width="${Math.max(1, bw - 2)}" y="${Yp(d.p)}" height="${Yp(0) - Yp(d.p)}" rx="1.5" opacity=".85"/>`).join("");
  const rv = days.filter((d) => d.river != null);
  const line = days.map((d, i) => (d.river == null ? "" : `${rv.length && days.indexOf(rv[0]) === i ? "M" : "L"}${(X(i) + bw / 2).toFixed(1)},${Yq(d.river).toFixed(1)}`)).join("");
  const xl = days.map((d, i) => (i % 7 === 0 ? `<text x="${X(i)}" y="${H - 4}">${md(d.date)}</text>` : "")).join("");
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}">
    <line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Yp(0)}" y2="${Yp(0)}"/><line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Yp(0.5)}" y2="${Yp(0.5)}"/>
    <text x="${pad.l - 6}" y="${Yp(0) + 4}" text-anchor="end">0%</text><text x="${pad.l - 6}" y="${Yp(0.5) + 4}" text-anchor="end">50%</text>
    <line class="thr" x1="${pad.l}" x2="${W - pad.r}" y1="${Yq(HIGH_WATER)}" y2="${Yq(HIGH_WATER)}"/><text class="thrlabel" x="${W - pad.r + 4}" y="${Yq(HIGH_WATER) + 4}">${HIGH_WATER} m³/s</text>
    ${bars}<path class="line" d="${line}" vector-effect="non-scaling-stroke"/>${xl}</svg>`;
}

// ---------- tasks ----------
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function tasksFor(level, role, date) {
  return (TASKS[level][role] || []).filter(([when]) => !WEEKDAYS.includes(when) || when === dow(date));
}

function renderTasks(D) {
  const R = ROLES[S.role], lv = S.level;
  $("persona").innerHTML = `<div class="avatar" aria-hidden="true">${R.name[0]}</div><div><h2>${R.name}</h2><p class="muted">${R.role}</p></div>
    <ul class="needs" aria-label="${R.name}'s needs">${R.needs.map((n) => `<li>${n}</li>`).join("")}</ul>`;
  $("todayTitle").textContent = `Today, ${dow(D.today, "long")} ${md(D.today)}`;
  const chip = $("todayChip"); chip.className = `level-chip small lv-${lv}`; chip.style.background = `var(--${lv}-soft)`; chip.lastElementChild.textContent = LEVELS[lv].label;

  const doneKey = `fd-done-${D.today}-${lv}`, done = store.get(doneKey, {});
  const mine = tasksFor(lv, S.role, D.today).map((t, i) => ({ t, id: `${S.role}-${i}`, owner: null }));
  const others = S.role === "maya" ? Object.keys(ROLES).filter((r) => r !== "maya").flatMap((r) => tasksFor(lv, r, D.today).map((t, i) => ({ t, id: `${r}-${i}`, owner: ROLES[r].name }))) : [];
  const li = ({ t: [when, text], id, owner }) => `<li class="task ${done[id] ? "done" : ""}"><input type="checkbox" id="t-${id}" data-id="${id}" ${done[id] ? "checked" : ""}>
    <span class="when">${when}</span><label for="t-${id}">${owner ? `<span class="owner">${owner}</span>` : ""}${text}</label></li>`;
  $("todayTasks").innerHTML = mine.map(li).join("") + (others.length ? `<li class="task" style="grid-template-columns:1fr"><span class="when">Everyone else today, so Maya can see the whole picture</span></li>` + others.map(li).join("") : "");
  $("todayTasks").querySelectorAll("input").forEach((cb) => cb.onchange = () => {
    const cur = store.get(doneKey, {}); cur[cb.dataset.id] = cb.checked; store.set(doneKey, cur);
    cb.closest(".task").classList.toggle("done", cb.checked); updateCount(D);
  });
  $("taskNote").textContent = `Level ${LEVELS[lv].label}: ${LEVELS[lv].summary} The list changes by itself when the forecast or the river changes level. Ticks are saved on this device.`;
  updateCount(D);

  $("week").innerHTML = D.days.filter((d) => d.date >= D.today && d.date <= addDays(D.today, 6)).map((d) => {
    const l = dayLevel(d, D);
    let list = tasksFor(l, S.role, d.date);
    if (l === "normal") { const special = list.filter(([w]) => WEEKDAYS.includes(w)); list = [["", "Routine checks"], ...special]; }
    return `<li><span><b>${d.date === D.today ? "Today" : dow(d.date, "long")}</b><br><span class="muted small">${md(d.date)} · ${pct(d.p)}%</span></span>
      <span class="lv lv-${l}">${LEVELS[l].label}</span><span class="what">${list.map(([w, t]) => `<span class="muted small">${w}</span> ${t}`).join("<br>")}</span></li>`;
  }).join("");

  $("matrix").innerHTML = Object.entries(LEVELS).map(([k, L]) => `<section><h4 class="lv-${k}">${L.label}</h4><p class="muted small">${L.summary}</p><dl>${Object.entries(ROLES).map(([r, R]) => `<dt>${R.name} <span class="muted small">${R.short}</span></dt><dd>${TASKS[k][r].map(([w, t]) => `<p><b>${w}</b> ${t}</p>`).join("")}</dd>`).join("")}</dl></section>`).join("");
}

function updateCount(D) {
  const done = store.get(`fd-done-${D.today}-${S.level}`, {});
  const left = tasksFor(S.level, S.role, D.today).filter((_, i) => !done[`${S.role}-${i}`]).length;
  $("taskCount").hidden = !left; $("taskCount").textContent = left;
}

// ---------- model tab ----------
function renderModel(D) {
  const past = D.days.filter((d) => d.date < D.today).slice(-30);
  hindcastChart($("hindcastChart"), past);
  const top = past.reduce((a, d) => (d.p > (a?.p ?? -1) ? d : a), null);
  const rv = past.filter((d) => d.river != null), peak = rv.reduce((a, d) => (d.river > (a?.river ?? -1) ? d : a), null);
  $("hindcastNote").textContent = D.live
    ? `Bars: the model's score for each day using measured rain (red when the river crossed the line that day or the next). Line: the river's daily average. Highest score: ${top ? `${pct(top.p)}% on ${md(top.date)}` : "n/a"}. ${peak ? `River peak: ${peak.river.toFixed(1)} m³/s on ${md(peak.date)}.` : "River readings unavailable."}`
    : "Replay: bars show the model's score for the weeks before the 16 July 2024 storm.";

  if (!D.live) return;
  const L = store.get("fd-ledger", {});
  for (const d of D.days) {
    if (d.date >= D.today && !L[d.date]) L[d.date] = { first: d.p, made: D.today };
    if (L[d.date] && d.source === "observed") { L[d.date].obs = d.p; if (d.river != null) L[d.date].river = d.river; }
  }
  const keys = Object.keys(L).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete L[k];
  store.set("fd-ledger", L);
  const rows = Object.entries(L).filter(([d]) => d <= addDays(D.today, 6)).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
  $("ledger").tBodies[0].innerHTML = rows.map(([d, e]) => `<tr><th scope="row">${dow(d)} ${md(d)}</th><td>${pct(e.first)}% <span class="muted small">(${e.made === d ? "same day" : `${Math.round((new Date(d) - new Date(e.made)) / 864e5)} d ahead`})</span></td>
    <td>${e.obs != null ? `${pct(e.obs)}%` : `<span class="muted">${d >= D.today ? "waiting for the day" : "waiting for gauges"}</span>`}</td>
    <td>${e.river != null ? `${e.river.toFixed(1)} m³/s${e.river >= HIGH_WATER ? " · high" : ""}` : '<span class="muted">–</span>'}</td></tr>`).join("");
}

// ---------- navigation & roles ----------
const TITLES = { forecast: "Don River flood risk", tasks: "Flood protocol", pickup: "Market pickup", model: "Forecast accuracy" };
function show(view) {
  S.view = view;
  document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === view)));
  document.querySelectorAll(".view").forEach((v) => { const on = v.id === `view-${view}`; v.hidden = !on; if (on) { v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter"); } });
  $("viewTitle").textContent = TITLES[view];
  try { if (location.hash !== `#${view}`) history.replaceState(null, "", location.pathname + location.search + `#${view}`); } catch { /* embedded preview */ }
  if (view === "forecast" || view === "model") render(); // charts need visible size
}
document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => show(b.dataset.view)));
document.querySelector(".tabs").addEventListener("keydown", (e) => {
  const tabs = [...document.querySelectorAll(".tabs button")], i = tabs.indexOf(document.activeElement);
  if (i < 0 || !["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
  e.preventDefault(); const n = tabs[(i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); show(n.dataset.view);
});
function setRole(r) { S.role = r; store.set("fd-role", r); $("role").value = r; $("roleM").value = r; pickup.update(S.level, r); render(); }
$("role").onchange = (e) => setRole(e.target.value);
$("roleM").onchange = (e) => setRole(e.target.value);
$("role").value = $("roleM").value = S.role;
$("refresh").onclick = load;
$("replay").onclick = () => { S.replay = !S.replay; $("replay").setAttribute("aria-pressed", String(S.replay)); $("replay").textContent = S.replay ? "Back to live" : "Replay July 2024 storm"; load(); };
addEventListener("hashchange", () => { const v = location.hash.slice(1); if (TITLES[v] && v !== S.view) show(v); });
let resizeT; addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(render, 150); });

const pickup = mountPickup({ panel: $("pickupPanel"), say: (m) => ($("message").textContent = m) });
pickup.update(S.level, S.role);
show(["forecast", "tasks", "pickup", "model"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "forecast");
if (new URLSearchParams(location.search).has("replay")) $("replay").click(); else load();
setInterval(() => { if (!S.replay && document.visibilityState === "visible") load(); }, 15 * 60 * 1000);
