const el = id => document.getElementById(id);
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
    const r = await fetch("/api/status", {cache:"no-store"});
    if (!r.ok) throw Error();
    state = await r.json(); connected = true;
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
    const r = await fetch("/api/" + action, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)});
    const next = await r.json();
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
el("collect").onclick = () => act("collect", {code:el("code").value}, "Collected. Hand over one packet.");
el("pause").onclick = () => { el("reconciled").checked = false; act("pause", {}, "Pickup paused for everyone."); };
el("resume").onclick = () => act("resume", {reconciled:el("reconciled").checked}, "Pickup resumed.");
all(".check").forEach(c => c.onchange = render);
el("reconciled").onchange = render;
window.addEventListener("offline", render); window.addEventListener("online", refresh);
refresh(); setInterval(() => { if (!busy) refresh(); }, 3000);
