from concurrent.futures import ThreadPoolExecutor
import json
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from server import server


class PickupFlow(unittest.TestCase):
    def setUp(self):
        self.httpd = server(0)
        self.url = "http://127.0.0.1:%s" % self.httpd.server_port
        thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(self.httpd.server_close)
        self.addCleanup(self.httpd.shutdown)

    def post(self, action, **data):
        req = Request(self.url + "/api/" + action, data=json.dumps(data).encode(),
                      headers={"Content-Type": "application/json"})
        try:
            with urlopen(req, timeout=3) as res:
                return res.status, json.load(res)
        except HTTPError as exc:
            with exc:
                return exc.code, json.load(exc)

    def open(self, count):
        self.assertEqual(self.post("approve")[0], 200)
        self.assertEqual(self.post("open", checked=True, count=count)[0], 200)

    def test_full_flow_and_duplicate_requests(self):
        self.assertEqual(self.post("open", checked=True, count=12)[0], 409)
        self.open(12)
        key = "first-customer-order"
        status, hold = self.post("reserve", requestId=key)
        self.assertEqual((status, hold["available"]), (200, 11))
        self.assertEqual(self.post("reserve", requestId=key)[1], hold)
        self.assertEqual(self.post("collect", code=hold["code"])[1]["available"], 11)
        self.assertEqual(self.post("collect", code=hold["code"])[0], 409)
        with urlopen(self.url+"/api/status") as response:
            self.assertEqual(json.load(response)["available"], 11)

    def test_last_item_and_pause(self):
        self.open(1)
        self.assertEqual(self.post("pause")[0], 200)
        self.assertEqual(self.post("reserve", requestId="offline-attempt")[0], 409)
        self.assertEqual(self.post("resume", reconciled=False)[0], 409)
        self.assertEqual(self.post("resume", reconciled=True)[0], 200)
        together = threading.Barrier(2)
        def buy(key):
            together.wait(timeout=3)
            return self.post("reserve", requestId=key)
        with ThreadPoolExecutor(2) as pool:
            replies = list(pool.map(buy, ["customer-order-one", "customer-order-two"]))
        self.assertEqual(sorted(code for code, _ in replies), [200, 409])
        held = next(body for code, body in replies if code == 200)
        self.assertEqual(held["available"], 0)
        self.post("pause")
        self.assertEqual(self.post("collect", code=held["code"])[0], 409)
