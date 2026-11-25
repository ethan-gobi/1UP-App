"""Record a ~50 s captioned walkthrough of Flood Desk (all screens + storm replay) for the pitch.
Serve the app first: python -m http.server 8765 -d app"""
import os, shutil, subprocess, imageio_ffmpeg
from playwright.sync_api import sync_playwright
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "demo"); os.makedirs(OUT, exist_ok=True)
BASE = "http://localhost:8765/"
CAP = """(t) => { let c = document.getElementById('__cap'); if (!c) { c = document.createElement('div'); c.id='__cap';
 c.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99999;background:rgba(6,20,28,.92);color:#fff;font:800 26px/1.3 Nunito,system-ui,sans-serif;padding:14px 26px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:1300px;text-align:center;transition:opacity .25s';
 document.body.appendChild(c);} c.style.opacity=0; setTimeout(()=>{c.innerHTML=t;c.style.opacity=1},200); }"""
with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge")
    ctx = b.new_context(viewport={"width": 1600, "height": 900}, record_video_dir=OUT, record_video_size={"width": 1600, "height": 900})
    pg = ctx.new_page()
    cap = lambda t: pg.evaluate(CAP, t)
    pg.goto(BASE + "index.html"); pg.wait_for_timeout(3500)
    cap("<b>Flood Desk</b> · Don River flood alerts for Evergreen Brick Works"); pg.wait_for_timeout(3500)
    cap("1 · <b>Forecast</b>: today's flood risk from live river gauges and weather"); pg.wait_for_timeout(4000)
    pg.mouse.wheel(0, 500); pg.wait_for_timeout(2500); pg.mouse.wheel(0, -500)
    pg.click("#tab-tasks"); cap("2 · <b>Tasks</b>: each person sees exactly what to do at today's level"); pg.wait_for_timeout(4000)
    pg.select_option("#role", "aisha"); cap("Switch person: the market vendor gets her own checklist"); pg.wait_for_timeout(3000)
    pg.select_option("#role", "maya")
    pg.click("#tab-pickup"); cap("3 · <b>Pickup</b>: if the valley closes, the market keeps selling off site"); pg.wait_for_timeout(4000)
    pg.click("#tab-model"); cap("4 · <b>Accuracy</b>: tested on real storms, misses and false alarms shown"); pg.wait_for_timeout(3500)
    pg.goto(BASE + "replay.html?event=2024-07-16&speed=5&delay=300")
    cap("5 · <b>Storm replay</b>: 16 July 2024, real TRCA data, minute by minute"); pg.wait_for_timeout(3000)
    pg.wait_for_function("document.getElementById('feed').textContent.includes('PREPARE sent')", timeout=60000)
    cap("09:35 TRCA Flood Watch → Flood Desk turns it into the Brick Works checklist"); pg.wait_for_timeout(3000)
    pg.wait_for_function("document.getElementById('feed').textContent.includes('passes 79.0 m')", timeout=60000)
    cap("11:15 the river crosses the flood line: 90 minutes after the checklist started"); pg.wait_for_timeout(3000)
    pg.wait_for_function("window.__replayDone === true", timeout=60000)
    pg.evaluate("document.getElementById('__cap') && document.getElementById('__cap').remove()"); pg.wait_for_timeout(4000)
    vid = pg.video.path(); ctx.close(); b.close()
webm = os.path.join(OUT, "overview.webm"); shutil.move(vid, webm)
mp4 = os.path.join(OUT, "flood-desk-overview.mp4")
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", webm, "-ss", "2.5", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", mp4], check=True)
os.remove(webm); print(mp4, os.path.getsize(mp4) // 1024, "KB")
