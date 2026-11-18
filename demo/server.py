"""Local rehearsal server. All roles share one in-memory practice session."""
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import secrets
import threading
from urllib.parse import urlsplit

ROOT = Path(__file__).parent
FILES = {"/": ("index.html", "text/html"), "/app.js": ("app.js", "text/javascript"), "/style.css": ("style.css", "text/css")}


class Market:
    def __init__(self):
        self.lock = threading.Lock()
        self.session_id = secrets.token_hex(12)
        self.phase = "waiting"
        self.available = 0
        self.by_request = {}
        self.collected = set()

    def snapshot(self):
        return {"session": self.session_id, "phase": self.phase, "available": self.available}

    def act(self, action, data):
        with self.lock:
            if action == "status":
                return self.snapshot()
            if action == "approve" and self.phase == "waiting":
                self.phase = "approved"
            elif action == "open" and self.phase == "approved":
                count = data.get("count")
                if type(count) is not int or not 1 <= count <= 999 or data.get("checked") is not True:
                    raise ValueError("Check the stall and count 1 to 999 packets.")
                self.available = count
                self.phase = "open"
            elif action == "pause" and self.phase == "open":
                self.phase = "paused"
            elif action == "resume" and self.phase == "paused" and data.get("reconciled") is True:
                self.phase = "open"
            elif action == "reserve":
                key = data.get("requestId")
                if not isinstance(key, str) or not 12 <= len(key) <= 100:
                    raise ValueError("A reservation request ID is required.")
                if key in self.by_request:
                    return {**self.snapshot(), "code": self.by_request[key]}
                if self.phase != "open" or self.available < 1:
                    raise ValueError("Reservations are closed or all packets are held.")
                code = secrets.token_hex(4).upper()
                while code in self.by_request.values():
                    code = secrets.token_hex(4).upper()
                self.by_request[key] = code
                self.available -= 1
                return {**self.snapshot(), "code": code}
            elif action == "collect" and self.phase == "open":
                code = str(data.get("code", "")).strip().upper()
                if code not in self.by_request.values():
                    raise ValueError("Pickup code not found.")
                if code in self.collected:
                    raise ValueError("Already collected. No second handoff.")
                self.collected.add(code)
            else:
                raise ValueError("That action is unavailable in the current session.")
            return self.snapshot()


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, payload, mime="application/json"):
        body = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", mime + "; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/status":
            return self.reply(200, self.server.market.act("status", {}))
        if path in FILES:
            name, mime = FILES[path]
            return self.reply(200, (ROOT / name).read_bytes(), mime)
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self):
        action = self.path.removeprefix("/api/")
        if self.path != "/api/" + action or action not in {"approve","open","pause","resume","reserve","collect"}:
            return self.send_error(404)
        if self.headers.get_content_type() != "application/json":
            return self.send_error(415)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 4096:
                return self.send_error(400)
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                return self.send_error(400)
            self.reply(200, self.server.market.act(action, data))
        except ValueError as exc:
            self.reply(409, {"error": str(exc)})


def server(port=8077):
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    httpd.market = Market()
    return httpd


if __name__ == "__main__":
    with server() as httpd:
        print("Fold-Out Garden Market rehearsal: http://127.0.0.1:8077", flush=True)
        httpd.serve_forever()
