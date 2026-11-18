const el = id => document.getElementById(id);
// Browser-only version of demo/server.py, for static hosting (e.g. Vercel).
// State lives in localStorage, so every tab in this browser shares one practice session.
// Open the Customer role in a second tab to watch the count change live.
const KEY = "foldout-market-v1";
function fresh() { return {session: crypto.randomUUID(), phase: "waiting", available: 0, byRequest: {}, collected: {}, collectByRequest: {}}; }
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { return fresh(); } }
function save(m) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch {} }
function snapshot(m) { return {session: m.session, phase: m.phase, available: m.available}; }
function newCode(m) {
  const taken = new Set(Object.values(m.byRequest));
  let c;
  do { c = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(16).padStart(2, "0")).join("").toUpperCase(); } while (taken.has(c));
  return c;
}
function marketAct(action, data) {
  const m = load();
  const no = msg => { throw new Error(msg); };
  if (action === "status") return snapshot(m);
  if (action === "approve" && m.phase === "waiting") m.phase = "approved";
  else if (action === "open" && m.phase === "approved") {
    const count = data.count;
    if (!Number.isInteger(count) || count < 1 || count > 999 || data.checked !== true) no("Check the stall and count 1 to 999 packets.");
    m.available = count; m.phase = "open";
  }
  else if (action === "pause" && m.phase === "open") m.phase = "paused";
  else if (action === "resume" && m.phase === "paused" && data.reconciled === true) m.phase = "open";
  else if (action === "reserve") {
    const key = data.requestId;
    if (typeof key !== "string" || key.length < 12 || key.length > 100) no("A reservation request ID is required.");
    if (m.byRequest[key]) return {...snapshot(m), code: m.byRequest[key]};
    if (m.phase !== "open" || m.available < 1) no("Reservations are closed or all packets are held.");
    const code = newCode(m);
    m.byRequest[key] = code; m.available -= 1; save(m);
    return {...snapshot(m), code};
  }
  else if (action === "collect" && m.phase === "open") {
    const code = String(data.code || "").trim().toUpperCase();
    if (data.requestId && m.collectByRequest[data.requestId] === code) return snapshot(m); // retry of a success
    if (!Object.values(m.byRequest).includes(code)) no("Pickup code not found.");
    if (m.collected[code]) no("Already collected. No second handoff.");
    m.collected[code] = true;
    if (data.requestId) m.collectByRequest[data.requestId] = code;
  }
  else no("That action is unavailable in the current session.");
  save(m);
  return snapshot(m);
}
async function api(action, data = {}) {
  await new Promise(r => setTimeout(r, 120)); // feel like a network round trip
  try { return {ok: true, body: marketAct(action, data)}; }
  catch (e) { return {ok: false, body: {error: e.message}}; }
}
function resetDemo() {
  localStorage.removeItem(KEY);
  for (const k of ["marketTicket", "marketRequest", "marketCollected", "marketSession"]) sessionStorage.removeItem(k);
  for (const c of document.querySelectorAll("input[type=checkbox]")) c.checked = false;
  el("count").value = 12; el("code").value = "";
  el("message").textContent = "Demo reset. Start again as Staff.";
  refresh();
}
window.addEventListener("storage", e => { if (e.key === KEY) refresh(); });

const all = sel => Array.from(document.querySelectorAll(sel));
let state = {phase:"waiting", available:0};
let connected = false;
let busy = false;
let shownCount = null;
const names = {waiting:"Waiting for staff approval", approved:"Stall check pending", open:"Open for pickup", paused:"Pickup paused"};
const checksDone = () => all(".check").every(c => c.checked);
const online = () => connected && navigator.onLine;

function hint(id, text) { el(id).textContent = text; }

function render() {
  const ready = online() && !busy;
  const phase = online() ? state.phase : "offline";
  const badge = el("phase");
  badge.textContent = online() ? names[state.phase] : "Offline · updates paused";
  badge.dataset.phase = phase;

  const count = online() ? String(state.available) : "–";
  const n = el("available");
  if (count !== shownCount) {
    n.textContent = count;
    if (shownCount !== null) { n.classList.remove("tick"); void n.offsetWidth; n.classList.add("tick"); }
    shownCount = count;
  }

  const ticket = sessionStorage.getItem("marketTicket");
  const pending = sessionStorage.getItem("marketRequest");
  const allowed = {
    approve: state.phase === "waiting",
    open: state.phase === "approved" && checksDone(),
    reserve: (pending || (state.phase === "open" && state.available > 0)) && !ticket,
    collect: state.phase === "open",
    pause: state.phase === "open",
    resume: state.phase === "paused" && el("reconciled").checked,
  };
  for (const [id, ok] of Object.entries(allowed)) el(id).disabled = !ready || !ok;

  // Say why a main action is unavailable, so a disabled button never looks broken.
  hint("hint-staff", state.phase === "waiting" ? "" : "Approved. Switch to Vendor to open the stall.");
  hint("hint-open",
    state.phase === "waiting" ? "Staff must approve the site first." :
    state.phase === "approved" && !checksDone() ? "Tick every safety check to open." :
    state.phase === "open" || state.phase === "paused" ? "Stall is open." : "");
  hint("hint-reserve",
    ticket ? "You already hold a packet. One per customer in this demo." :
    state.phase === "paused" ? "Reservations are paused. Existing codes still work once service resumes." :
    state.phase !== "open" ? "Not open yet. The vendor has to open the stall first." :
    state.available < 1 ? "Sold out. Every packet is held." : "");

  el("ticket").hidden = !ticket;
  el("ticketCode").textContent = ticket || "";

  // Progress through the four demo steps.
  const done = [
    state.phase !== "waiting",
    state.phase === "open" || state.phase === "paused",
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

async function refresh() {
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
    const next = r.body;
    if (!r.ok) {
      if (action === "reserve") sessionStorage.removeItem("marketRequest");
      el("message").textContent = next.error || "Could not save.";
      return;
    }
    if (action === "reserve") sessionStorage.setItem("marketTicket", next.code);
    if (action === "collect") { el("code").value = ""; sessionStorage.setItem("marketCollected", "1"); }
    state = next; el("message").textContent = success;
  } catch {
    connected = false; el("message").textContent = "Connection lost. Check the status before retrying.";
  } finally { await refresh(); busy = false; render(); }
}

all(".roles button").forEach(button => button.onclick = () => {
  for (const name of ["staff", "vendor", "customer"]) el(name).hidden = name !== button.dataset.role;
  all(".roles button").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
  el("message").textContent = ""; refresh();
});
el("approve").onclick = () => act("approve", {}, "Site approved and published. Switch to Vendor to open the stall.");
el("open").onclick = () => act("open", {count:Number(el("count").value), checked:checksDone()}, "The stall is open for pickup.");
el("reserve").onclick = () => {
  const key = sessionStorage.getItem("marketRequest") || crypto.randomUUID();
  sessionStorage.setItem("marketRequest", key);
  act("reserve", {requestId:key}, "One packet held. Show your code at the stall.");
};
el("collect").onclick = () => act("collect", {code:el("code").value, requestId:crypto.randomUUID()}, "Collected. Hand over one packet.");
el("reset").onclick = resetDemo;
el("pause").onclick = () => { el("reconciled").checked = false; act("pause", {}, "Pickup paused for everyone."); };
el("resume").onclick = () => act("resume", {reconciled:el("reconciled").checked}, "Pickup resumed.");
all(".check").forEach(c => c.onchange = render);
el("reconciled").onchange = render;
window.addEventListener("offline", render); window.addEventListener("online", refresh);
refresh(); setInterval(() => { if (!busy) refresh(); }, 3000);
