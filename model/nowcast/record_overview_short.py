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
    pg.goto(BASE + "index.html"); pg.wait_for_timeout(3000)
    cap("<b>Flood Desk</b>: flood alerts for Evergreen Brick Works"); pg.wait_for_timeout(1800)
    cap("<b>Forecast</b>: today's Don River risk, live"); pg.wait_for_timeout(1800)
    pg.click("#tab-tasks"); cap("<b>Tasks</b>: who does what at each level"); pg.wait_for_timeout(1800)
    pg.click("#tab-pickup"); cap("<b>Pickup</b>: keep selling if the valley closes"); pg.wait_for_timeout(1500)
    pg.goto(BASE + "replay.html?event=2024-07-16&speed=9&delay=200")
    cap("<b>16 July 2024</b>, real TRCA data"); 
    pg.wait_for_function("document.getElementById('feed').textContent.includes('PREPARE sent')", timeout=60000)
    cap("09:35 TRCA Flood Watch → site checklist starts")
    pg.wait_for_function("document.getElementById('feed').textContent.includes('passes 79.0 m')", timeout=60000)
    cap("11:15 river floods the valley: 90 min after the checklist"); pg.wait_for_timeout(1800)
    pg.evaluate("window.__summary(); document.getElementById('__cap').remove()"); pg.wait_for_timeout(2600)
    vid = pg.video.path(); ctx.close(); b.close()
webm = os.path.join(OUT, "overview-short.webm"); shutil.move(vid, webm)
mp4 = os.path.join(OUT, "flood-desk-overview-short.mp4")
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", webm, "-ss", "2.5", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", mp4], check=True)
os.remove(webm); print(mp4, os.path.getsize(mp4) // 1024, "KB")
