"""Record the storm replay as a video plus key-moment screenshots.
Needs: pip install playwright imageio-ffmpeg; python -m playwright install ffmpeg; Microsoft Edge installed.
Serve the app first: python -m http.server 8765 -d app
Usage: python record.py 2024-07-16 [speed]"""
import os, shutil, subprocess, sys, imageio_ffmpeg
from playwright.sync_api import sync_playwright

ev = sys.argv[1]; speed = sys.argv[2] if len(sys.argv) > 2 else "1.6"
out = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "demo"); os.makedirs(out, exist_ok=True)
url = f"http://localhost:8765/replay.html?event={ev}&speed={speed}&delay=1500"
with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge")
    ctx = b.new_context(viewport={"width": 1600, "height": 900}, device_scale_factor=1,
                        record_video_dir=out, record_video_size={"width": 1600, "height": 900}, color_scheme="dark")
    pg = ctx.new_page(); pg.goto(url)
    shots = {"prepare": "PREPARE sent", "move": "MOVE NOW sent", "flood": "passes 79.0 m"}
    for key, label in shots.items():
        try:
            pg.wait_for_function(f"document.getElementById('feed').textContent.includes({label!r}) || window.__replayDone", timeout=240000)
            pg.wait_for_timeout(900)
            pg.screenshot(path=os.path.join(out, f"{ev}-{key}.png"))
        except Exception as e: print("no", key, e)
    pg.wait_for_function("window.__replayDone === true", timeout=300000)
    pg.wait_for_timeout(4500)
    pg.screenshot(path=os.path.join(out, f"{ev}-summary.png"))
    vid = pg.video.path(); ctx.close(); b.close()
webm = os.path.join(out, f"{ev}-replay.webm"); shutil.move(vid, webm)
mp4 = os.path.join(out, f"{ev}-replay.mp4")
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", webm, "-ss", "0.8", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", mp4], check=True)
os.remove(webm)
print(mp4, os.path.getsize(mp4) // 1024, "KB")
