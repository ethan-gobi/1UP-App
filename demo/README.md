# Fold-Out Garden Market pickup rehearsal

Run `python demo/server.py` from the repository root (Python 3.9+). Open http://127.0.0.1:8077 in a browser. The demo runs on your computer and uses sample data. No accounts, cloud services or purchases are required.

1. Staff approves the example host and hours. Switch to Vendor, check the stall and open with 12 packets.
2. Switch to Customer and reserve one. The count falls to 11. Copy the code into Vendor and confirm collection. A second collection is rejected.
3. Use Pause reservations for an outage drill. New holds and collections stop until the vendor reconciles stock and resumes. An individual disconnected browser also disables actions. Other browsers can keep operating until the shared session is paused.
4. For the last-item drill, start with one packet and use separate customer browser sessions. Only one can get it. Run `python -m unittest discover -s demo -p "test_*.py"` for the concurrent test.

This is a local role-switching mock. Restarting the server clears all stock and holds. Start the next drill in a fresh browser tab or clear its session storage. Copp Hall is a proposed host and the displayed hours are fictional. Public use would require authenticated roles, durable records, a real host agreement and a designated maintainer.
