// Fold-Out Garden Market pickup demo. Browser-only: state lives in localStorage,
// so every tab in this browser shares one practice session (open Visitors in a
// second tab to watch the count change live).
const el = id => document.getElementById(id);
const all = sel => Array.from(document.querySelectorAll(sel));
const KEY = "foldout-market-v2";
const HOSTS = {
  copp: {name: "Copp Hall, Rosedale United", addr: "159 Roxborough Dr · west entrance lift"},
  yorkminster: {name: "Yorkminster Park Baptist", addr: "1585 Yonge St · St Clair station"},
  redeemer: {name: "Church of the Redeemer", addr: "162 Bloor St W · elevator from Avenue Rd ramp"},
};

function fresh() {
  return {session: crypto.randomUUID(), phase: "waiting", closed: false, host: null, window: "",
          available: 0, byRequest: {}, collected: {}, collectByRequest: {}, beforeEvac: null};
}
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { return fresh(); } }
function save(m) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch {} }
function snapshot(m) {
  return {session: m.session, phase: m.phase, closed: m.closed, host: m.host, window: m.window, available: m.available};
}
function newCode(m) {
  const taken = new Set(Object.values(m.byRequest));
  let c;
  do { c = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(16).padStart(2, "0")).join("").toUpperCase(); } while (taken.has(c));
  return c;
}

// The rules every action must pass. Mirrors demo/server.py.
function marketAct(action, data) {
  const m = load();
  const no = msg => { throw new Error(msg); };
  if (action === "status") return snapshot(m);
  if (m.phase === "evacuate" && action !== "allclear") no("Evacuation alert is on. Everyone leaves now.");
  if (action === "close") m.closed = true;
  else if (action === "approve" && m.phase === "waiting") {
    if (!m.closed) no("Post the closure notice first.");
    if (!HOSTS[data.host]) no("Choose an approved dry host.");
    const w = String(data.window || "").trim();
    if (w.length < 3 || w.length > 40) no("Enter the pickup window.");
    m.host = data.host; m.window = w; m.phase = "approved";
  }
  else if (action === "open" && m.phase === "approved") {
    const count = data.count;
    if (!Number.isInteger(count) || count < 1 || count > 999 || data.checked !== true) no("Finish the checks and count 1 to 999 packets.");
    m.available = count; m.phase = "open";
  }
  else if (action === "pause" && m.phase === "open") m.phase = "paused";
  else if (action === "resume" && m.phase === "paused" && data.reconciled === true) m.phase = "open";
  else if (action === "evacuate") { m.beforeEvac = m.phase; m.phase = "evacuate"; }
  else if (action === "allclear" && m.phase === "evacuate") {
    // Stock may have moved: anything that was open comes back paused until it is reconciled.
    const prev = m.beforeEvac || "waiting";
    m.phase = prev === "open" ? "paused" : prev; m.beforeEvac = null;
  }
  else if (action === "reserve") {
    const key = data.requestId;
    if (typeof key !== "string" || key.length < 12 || key.length > 100) no("A reservation request ID is required.");
    if (m.byRequest[key]) return {...snapshot(m), code: m.byRequest[key]};
    if (m.phase !== "open" || m.available < 1) no("Reservations are closed or every packet is held.");
    const code = newCode(m);
    m.byRequest[key] = code; m.available -= 1; save(m);
    return {...snapshot(m), code};
  }
  else if (action === "collect" && m.phase === "open") {
    const code = String(data.code || "").trim().toUpperCase();
    if (data.requestId && m.collectByRequest[data.requestId] === code) return snapshot(m);
    if (!Object.values(m.byRequest).includes(code)) no("Pickup code not found.");
    if (m.collected[code]) no("Already collected. No second handoff.");
    m.collected[code] = true;
    if (data.requestId) m.collectByRequest[data.requestId] = code;
  }
  else no("That isn't available right now.");
  save(m);
  return snapshot(m);
}
async function api(action, data = {}) {
  await new Promise(r => setTimeout(r, 120)); // feel like a network round trip
  const run = () => {
    try { return {ok: true, body: marketAct(action, data)}; }
    catch (e) { return {ok: false, body: {error: e.message}}; }
  };
  // Web Locks serialize the read-check-write across tabs, so two tabs can't both take the last packet.
  return navigator.locks ? navigator.locks.request(KEY, run) : run();
}

let state = snapshot(fresh());
let connected = false, busy = false, shownCount = null;
const names = {waiting: "Waiting for staff", approved: "Vendor setting up", open: "Open for pickup", paused: "Pickup paused", evacuate: "Evacuate now"};
const checksDone = () => all(".check").every(c => c.checked);
const online = () => connected && navigator.onLine;
const hint = (id, text) => { el(id).textContent = text; };
const selectedHost = () => (document.querySelector("input[name=host]:checked") || {}).value;

function render() {
  const ready = online() && !busy;
  const phase = online() ? state.phase : "offline";
  const evac = state.phase === "evacuate";
  const badge = el("phase");
  badge.textContent = online() ? names[state.phase] : "Offline · updates paused";
  badge.dataset.phase = phase;

  const count = online() && state.phase !== "waiting" ? String(state.available) : "–";
  const n = el("available");
  if (count !== shownCount) {
    n.textContent = count;
    if (shownCount !== null) { n.classList.remove("tick"); void n.offsetWidth; n.classList.add("tick"); }
    shownCount = count;
  }

  const host = HOSTS[state.host];
  el("hostName").textContent = host ? host.name : "Not confirmed yet";
  el("hostAddr").textContent = host ? host.addr : "";
  el("hostWindow").textContent = state.window || "–";

  el("alert").hidden = !evac;
  el("alert").textContent = evac ? "Evacuation alert: leave the Brick Works now. Stop packing. Pickups and reservations are stopped." : "";
  el("notice").hidden = !state.closed;
  el("notice").textContent = !state.closed ? "" :
    host ? `Garden Market closed for flooding. Pickup moves to ${host.name}, ${state.window}.`
         : "Garden Market closing early for flooding. Pickup location coming soon.";

  const ticket = sessionStorage.getItem("marketTicket");
  const pending = sessionStorage.getItem("marketRequest");
  const allowed = {
    closeShop: !state.closed && !evac,
    approve: state.phase === "waiting" && state.closed,
    evacuate: !evac,
    allClear: evac,
    open: state.phase === "approved" && checksDone(),
    reserve: (pending || (state.phase === "open" && state.available > 0)) && !ticket,
    collect: state.phase === "open",
    pause: state.phase === "open",
    resume: state.phase === "paused" && el("reconciled").checked,
    share: true,
  };
  for (const [id, ok] of Object.entries(allowed)) el(id).disabled = !ready || !ok;
  all("input[name=host], #window").forEach(i => i.disabled = state.phase !== "waiting");

  // Say why a main action is unavailable, so a disabled button never looks broken.
  hint("hint-staff", evac ? "Evacuation alert is on." :
    !state.closed ? "Post the closure notice first." :
    state.phase === "waiting" ? "" : "Confirmed and published. Switch to Vendor.");
  hint("hint-open", evac ? "Evacuation alert is on. Leave now." :
    state.phase === "waiting" ? "Staff must confirm the location and hours first." :
    state.phase === "approved" && !checksDone() ? "Tick every check to open." :
    state.phase === "open" || state.phase === "paused" ? "Pickup is open." : "");
  hint("hint-reserve", evac ? "Evacuation alert is on. Don't travel to the Brick Works." :
    ticket ? "You already hold a packet. One per visitor in this demo." :
    state.phase === "paused" ? "Pickup is paused. Codes still work once it resumes." :
    state.phase !== "open" ? "Not open yet. The vendor opens pickup after staff confirm the site." :
    state.available < 1 ? "Sold out. Every packet is held." : "");

  el("ticket").hidden = !ticket;
  el("ticketCode").textContent = ticket || "";
  el("ticketWhere").textContent = host ? `${host.name} · ${host.addr} · ${state.window}` : "";

  const done = [
    state.closed,
    state.phase !== "waiting" && Boolean(state.host),
    ["open", "paused"].includes(state.phase) || Boolean(ticket),
    Boolean(ticket),
    Boolean(sessionStorage.getItem("marketCollected")),
  ];
  const now = done.indexOf(false);
  all("#steps li").forEach((li, i) => {
    li.classList.toggle("done", done[i]);
    li.classList.toggle("now", i === now);
    if (i === now) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
  });
}

function refresh() {
  try {
    state = marketAct("status", {}); connected = true;
    if (sessionStorage.getItem("marketSession") !== state.session) {
      for (const k of ["marketTicket", "marketRequest", "marketCollected"]) sessionStorage.removeItem(k);
      sessionStorage.setItem("marketSession", state.session);
    }
  } catch { connected = false; }
  render();
}

async function act(action, data = {}, success = "Saved.") {
  if (busy || !navigator.onLine) return;
  busy = true; render();
  try {
    const r = await api(action, data);
    if (!r.ok) {
      if (action === "reserve") sessionStorage.removeItem("marketRequest");
      el("message").textContent = r.body.error || "Could not save.";
      return;
    }
    if (action === "reserve") sessionStorage.setItem("marketTicket", r.body.code);
    if (action === "collect") { el("code").value = ""; sessionStorage.setItem("marketCollected", "1"); }
    state = r.body; el("message").textContent = success;
  } finally { busy = false; refresh(); }
}

function resetDemo() {
  localStorage.removeItem(KEY);
  for (const k of ["marketTicket", "marketRequest", "marketCollected", "marketSession"]) sessionStorage.removeItem(k);
  all("input[type=checkbox]").forEach(c => c.checked = false);
  el("count").value = 12; el("code").value = ""; el("window").value = "Saturday, 10 am to 4 pm";
  document.querySelector("input[name=host][value=copp]").checked = true;
  stopTimer(true);
  el("message").textContent = "Demo restarted. Start as Staff.";
  refresh();
}

// Pack-down drill timer (local to this tab).
let timerStart = null, timerId = null;
const fmt = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
function stopTimer(reset) {
  clearInterval(timerId); timerId = null;
  if (reset) { timerStart = null; el("timer").textContent = "0:00"; }
  el("timerBtn").textContent = "Start drill timer";
}
el("timerBtn").onclick = () => {
  if (timerId) { stopTimer(false); return; }
  timerStart = Date.now(); all(".pack-step").forEach(c => c.checked = false);
  el("timer").textContent = "0:00"; el("timerBtn").textContent = "Stop";
  timerId = setInterval(() => el("timer").textContent = fmt(Date.now() - timerStart), 250);
};
all(".pack-step").forEach(c => c.onchange = () => {
  if (timerId && all(".pack-step").every(x => x.checked)) {
    stopTimer(false);
    el("message").textContent = `Packed and rolling in ${fmt(Date.now() - timerStart)}.`;
  }
});

all(".roles button").forEach(button => button.onclick = () => {
  for (const name of ["staff", "vendor", "customer"]) el(name).hidden = name !== button.dataset.role;
  all(".roles button").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
  el("message").textContent = ""; refresh();
});
el("closeShop").onclick = () => act("close", {}, "Closure notice posted for vendors and visitors.");
el("approve").onclick = () => act("approve", {host: selectedHost(), window: el("window").value}, "Location and hours confirmed. Switch to Vendor.");
el("evacuate").onclick = () => act("evacuate", {}, "Evacuation alert sent to everyone.");
el("allClear").onclick = () => act("allclear", {}, "All clear. Check stock against holds before resuming.");
el("open").onclick = () => act("open", {count: Number(el("count").value), checked: checksDone()}, "Pickup is open.");
el("reserve").onclick = () => {
  const key = sessionStorage.getItem("marketRequest") || crypto.randomUUID();
  sessionStorage.setItem("marketRequest", key);
  act("reserve", {requestId: key}, "One packet held. Show your code at the pickup.");
};
el("collect").onclick = () => act("collect", {code: el("code").value, requestId: crypto.randomUUID()}, "Collected. Hand over one packet.");
el("pause").onclick = () => { el("reconciled").checked = false; act("pause", {}, "Pickup paused for everyone."); };
el("resume").onclick = () => act("resume", {reconciled: el("reconciled").checked}, "Pickup resumed.");
el("share").onclick = async () => {
  const url = location.href.split("#")[0];
  try {
    if (navigator.share) await navigator.share({title: "Garden Market pickup", url});
    else { await navigator.clipboard.writeText(url); el("message").textContent = "Pickup link copied. Send it to your guests."; }
  } catch { el("message").textContent = `Share this link: ${url}`; }
};
el("reset").onclick = resetDemo;
all(".check").forEach(c => c.onchange = render);
el("reconciled").onchange = render;
window.addEventListener("storage", e => { if (e.key === KEY) refresh(); });
window.addEventListener("offline", render); window.addEventListener("online", refresh);
refresh(); setInterval(() => { if (!busy) refresh(); }, 3000);
