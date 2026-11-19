// Fold-Out Market pickup rehearsal: staff approve the site, the vendor opens the stall, a customer reserves,
// the vendor hands over. Same flow as the earlier server demo, now kept in this browser so it runs on free static hosting.
// State lives in localStorage and syncs across tabs through the storage event.

const KEY = "fd-pickup";
const fresh = () => ({ phase: "waiting", available: 0, holds: {} });
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { return fresh(); } };
const write = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ } };
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
const NAMES = { waiting: "Waiting for staff", approved: "Stall check pending", open: "Open for pickup", paused: "Paused" };

export function mountPickup({ panel, say }) {
  let level = "normal", role = "maya";
  const el = (id) => document.getElementById(id);

  function act(fn, msg) {
    const s = read(); const err = fn(s);
    if (err) { say(err); return; }
    write(s); say(msg); draw();
  }

  function draw() {
    const s = read(), mine = sessionStorage.getItem("fd-ticket");
    const n = el("available");
    if (n.textContent !== String(s.available)) { n.textContent = s.available; n.classList.remove("tick"); void n.offsetWidth; n.classList.add("tick"); }
    el("phase").textContent = NAMES[s.phase]; el("phase").dataset.phase = s.phase;
    const steps = [s.phase !== "waiting", s.phase === "open" || s.phase === "paused", Object.keys(s.holds).length > 0, Object.values(s.holds).includes("collected")];
    const now = steps.indexOf(false);
    el("steps").querySelectorAll("li").forEach((li, i) => { li.classList.toggle("done", steps[i]); li.classList.toggle("now", i === now); });

    const banner = level === "warning" || level === "flood"
      ? `<p class="banner">Flood ${level === "flood" ? "in progress" : "warning"}. The Garden Market is closed on site. Pickup runs at Copp Hall.</p>` : "";
    const view = role === "maya" ? "staff" : role === "aisha" ? "vendor" : "customer";

    if (view === "staff") {
      panel.innerHTML = `${banner}<h3>Approve the pickup site</h3>
        <p class="muted">Check the host, the step-free entrance and the hours before anything goes public. Reservations stay shut until the vendor finishes the stall check.</p>
        <ul class="needs"><li>Copp Hall · 159 Roxborough Dr</li><li>West entrance lift</li><li>Sat 10 am–4 pm (proposed)</li></ul>
        <div class="row"><button class="btn primary" id="approve" ${s.phase !== "waiting" ? "disabled" : ""}>Approve and publish</button>
        <button class="btn quiet" id="reset">Reset rehearsal</button></div>
        <p class="hint">${s.phase === "waiting" ? "" : "Approved. Aisha opens the stall next (switch to Aisha)."}</p>`;
      el("approve").onclick = () => act((x) => { x.phase = "approved"; }, "Site approved and published.");
      el("reset").onclick = () => { write(fresh()); sessionStorage.removeItem("fd-ticket"); say("Rehearsal reset."); draw(); };
    } else if (view === "vendor") {
      const canOpen = s.phase === "approved";
      panel.innerHTML = `${banner}<h3>Open the stall</h3>
        <fieldset class="checks"><legend>Safety check before loading the counter</legend>
          <label><input type="checkbox" class="chk"> Wheel brakes set</label>
          <label><input type="checkbox" class="chk"> Both legs braced and locked</label>
          <label><input type="checkbox" class="chk"> Approach and aisle clear</label></fieldset>
        <div class="row"><label class="field">Seed packets counted <input type="number" id="count" value="12" min="1" max="999" inputmode="numeric"></label>
          <button class="btn primary" id="open" disabled>Open for pickup</button></div>
        <p class="hint" id="openHint">${s.phase === "waiting" ? "Maya has to approve the site first." : s.phase === "approved" ? "Tick every safety check to open." : "Stall is open."}</p>
        <div class="sub"><h3>Hand over an order</h3>
          <div class="row"><label class="field">Pickup code <input id="code" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="7F3A9C21"></label>
          <button class="btn primary" id="collect" ${s.phase !== "open" ? "disabled" : ""}>Confirm collection</button></div></div>
        <div class="sub"><h3>Outage drill</h3>
          <p class="muted small">Lost signal or power? Pause for everyone. Before resuming, count the stock against the holds still open.</p>
          <div class="row"><button class="btn quiet" id="pause" ${s.phase !== "open" ? "disabled" : ""}>Pause reservations</button>
          <label class="inline"><input type="checkbox" id="reconciled"> Stock and open holds match</label>
          <button class="btn quiet" id="resume" disabled>Resume pickup</button></div></div>`;
      const checks = [...panel.querySelectorAll(".chk")];
      const sync = () => { el("open").disabled = !(canOpen && checks.every((c) => c.checked)); };
      checks.forEach((c) => (c.onchange = sync)); sync();
      el("reconciled").onchange = () => { el("resume").disabled = !(s.phase === "paused" && el("reconciled").checked); };
      el("open").onclick = () => act((x) => { const c = Math.floor(+el("count").value); if (!(c > 0 && c < 1000)) return "Enter a count from 1 to 999."; x.phase = "open"; x.available = c; }, "The stall is open for pickup.");
      el("collect").onclick = () => act((x) => {
        const c = el("code").value.trim().toUpperCase();
        if (x.phase !== "open") return "Pickup is paused.";
        if (!x.holds[c]) return "That code does not match a hold."; if (x.holds[c] === "collected") return "Already collected. Do not hand over another.";
        x.holds[c] = "collected";
      }, "Collected. Hand over one packet.");
      el("pause").onclick = () => act((x) => { x.phase = "paused"; }, "Pickup paused for everyone.");
      el("resume").onclick = () => act((x) => { x.phase = "open"; }, "Pickup resumed.");
    } else {
      panel.innerHTML = `${banner}<h3>Reserve a seed packet</h3>
        <p class="muted">Hold one packet, then show your code at the stall. Pay when you collect.</p>
        <div class="row"><button class="btn primary" id="reserve" ${mine || s.phase !== "open" || s.available < 1 ? "disabled" : ""}>Reserve one packet</button></div>
        <p class="hint">${mine ? "You hold a packet. One per customer." : s.phase === "paused" ? "Reservations are paused. Existing codes still work once service resumes." : s.phase !== "open" ? "Not open yet. The vendor opens the stall first." : s.available < 1 ? "Sold out." : ""}</p>
        ${mine ? `<div class="ticket"><span class="muted small">Your pickup code</span><strong>${mine}</strong><span class="small">Copp Hall · west entrance · Sat 10 am–4 pm</span></div>` : ""}`;
      el("reserve").onclick = () => {
        let c; act((x) => { if (x.phase !== "open" || x.available < 1) return "Not available right now."; c = code(); x.holds[c] = "held"; x.available -= 1; }, "One packet held. Show your code at the stall.");
        if (c) { sessionStorage.setItem("fd-ticket", c); draw(); }
      };
    }
  }

  addEventListener("storage", (e) => { if (e.key === KEY) draw(); });
  draw();
  return { update(l, r) { level = l; role = r; draw(); } };
}
