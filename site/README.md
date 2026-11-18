# Static demo (for Vercel)

`site/` is a browser-only copy of the pickup demo in `demo/`. It enforces the same rules as `demo/server.py`, but keeps state in `localStorage`, so it runs on any static host. Tabs in the same browser share one practice session: open a second tab as the Customer to watch the count change live. Use **Reset demo** to start over.

Deploy: import this repo at https://vercel.com/new. `vercel.json` already points Vercel at `site/`, with no build step.

Limit: each browser has its own session, so two different phones do not see each other's reservations. A shared live demo needs the hosted backend (milestone M6 in `docs/APP-PLAN.md`).
