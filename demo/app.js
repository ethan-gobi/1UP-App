const el = id => document.getElementById(id);
let state = {phase:"waiting", available:0};
let connected = false;
let busy = false;
const names = {waiting:"Awaiting staff approval", approved:"Vendor setup pending", open:"Open for pickup", paused:"Pickup paused"};
function render() {
  const ready = connected && navigator.onLine && !busy;
  el("phase").textContent = connected && navigator.onLine ? names[state.phase] : "Offline · updates paused";
  el("available").textContent = connected && navigator.onLine ? state.available : "–";
  for (const [id, allowed] of Object.entries({
    approve:state.phase==="waiting", open:state.phase==="approved" && el("checked").checked,
    reserve:(sessionStorage.getItem("marketRequest") || (state.phase==="open" && state.available>0)) && !sessionStorage.getItem("marketTicket"),
    collect:state.phase==="open", pause:state.phase==="open",
    resume:state.phase==="paused" && el("reconciled").checked
  })) el(id).disabled = !ready || !allowed;
  const ticket = sessionStorage.getItem("marketTicket");
  el("ticket").hidden = !ticket;
  el("ticketCode").textContent = ticket || "";
}
async function refresh() {
  try {
    const r=await fetch("/api/status",{cache:"no-store"});
    if (!r.ok) throw Error();
    state=await r.json(); connected=true;
    if (sessionStorage.getItem("marketSession") !== state.session) {
      sessionStorage.removeItem("marketTicket"); sessionStorage.removeItem("marketRequest");
      sessionStorage.setItem("marketSession",state.session);
    }
  } catch { connected=false; }
  render();
}
async function act(action,data={},success="Saved.") {
  if (busy || !navigator.onLine) return;
  busy=true; render();
  try {
    const r=await fetch("/api/"+action,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const next=await r.json();
    if (!r.ok) {
      if (action==="reserve") sessionStorage.removeItem("marketRequest");
      el("message").textContent=next.error || "Could not save."; return;
    }
    if (action==="reserve") sessionStorage.setItem("marketTicket",next.code);
    if (action==="collect") el("code").value="";
    state=next; el("message").textContent=success;
  } catch { connected=false; el("message").textContent="Connection lost. Check the status before retrying."; }
  finally { await refresh(); busy=false; render(); }
}
document.querySelectorAll("nav button").forEach(button=>button.onclick=()=>{
  for(const name of ["staff","vendor","customer"]) el(name).hidden=name!==button.dataset.role;
  document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
  el("message").textContent=""; refresh();
});
el("approve").onclick=()=>act("approve",{},"Location approved. The vendor can check the stall.");
el("open").onclick=()=>act("open",{count:Number(el("count").value),checked:el("checked").checked},"The stall is open for pickup.");
el("reserve").onclick=()=>{
  const key=sessionStorage.getItem("marketRequest") || crypto.randomUUID();
  sessionStorage.setItem("marketRequest",key); act("reserve",{requestId:key},"One packet held. Show your code at the stall.");
};
el("collect").onclick=()=>act("collect",{code:el("code").value},"Collected. Hand over one packet.");
el("pause").onclick=()=>{el("reconciled").checked=false;act("pause",{},"Pickup paused for everyone.");};
el("resume").onclick=()=>act("resume",{reconciled:el("reconciled").checked},"Pickup resumed.");
el("checked").onchange=render; el("reconciled").onchange=render;
window.addEventListener("offline",render); window.addEventListener("online",refresh);
refresh(); setInterval(()=>{if(!busy) refresh();},3000);
