# Fold-Out Market App: Build Plan

**Goal of the first release:** a working mock web app that shows a customer can reserve and collect one item from the fold-out stall while the Garden Market is closed, with staff in control and no stock errors.

Scope follows the team's chosen direction ([issue #1](https://github.com/ethan-gobi/1UP-App/issues/1), `docs/FOLD-OUT-PILOT.md`). Synthetic stock only. No real payments, river gauge, alarms or screens.

## 1. Who does what in the app

| Person | Role in app | Can do |
| --- | --- | --- |
| Maya | Staff | Publish main-site closure, approve host location + access + hours, open / pause / close reservations, enter phone orders, reconcile after an outage |
| Aisha | Vendor | Run stall checklist (brakes, legs braced, approach clear, stock counted), confirm pickup window and count, redeem pickup codes |
| Daniel | Customer | See status and accessible entrance, reserve 1 item, get a one-time pickup code |
| Marcus | Organizer | Share the same public link; no special role in v1 |

## 2. The demo flow (must work end to end)

1. Maya marks the Garden Market **Closed** (timestamped public message).
2. Maya approves **Copp Hall** with address, access notes and hours. The location stays **Not taking reservations** until step 3 is done.
3. Aisha completes the stall checklist and counts **12 seed packets**. The location opens.
4. Daniel reserves 1 packet and the page shows **11 left**. He gets a 6-character pickup code.
5. At the stall, Aisha enters the code. It is redeemed **once**, and a second try is refused.
6. Maya pauses the location (connectivity lost). New reservations are blocked, existing holds stay valid, and Maya reconciles before reopening.

## 3. Rules the code must enforce (each one gets a test)

- Stock never goes below 0. Two people racing for the **last item** means one wins and one gets a clear "sold out".
- Retrying a reservation or redemption (double tap, network retry) never double-counts: each request carries an idempotency key.
- A code redeems only once and only at its own location, and only while the hold is valid.
- No reservations while a location is **Draft**, **Paused** or **Closed**, or before the checklist is complete.
- Every public status change records who did it and when.
- Holds expire at the end of the pickup window and their stock is returned.
- A missed checklist item never triggers a public alarm (out of scope by design).

## 4. Screens

| Screen | Who | Key content |
| --- | --- | --- |
| Public status | Everyone | Site status, approved pickup location, hours, accessible entrance, items left, last updated |
| Reserve | Customer | Pick item, name + phone (fake in mock), get code |
| My pickup | Customer | Code, location, window, "show this at the stall" |
| Staff console | Maya | Site status, location approval, open / pause / close, phone order, reconcile list |
| Stall checklist | Vendor | 4 checks + stock count, confirm window |
| Redeem | Vendor | Enter code, see result, mark paid (cash / card, recorded only) |

## 5. Tech choices

The working demo in [PR #4](https://github.com/ethan-gobi/1UP-App/pull/4) sets the stack for now:

- **Demo:** a local Python server (`demo/server.py`, standard library only) with plain HTML/JS. All roles share one in-memory session, guarded by a single lock.
- **Tests:** `unittest` over HTTP, including a barrier-based race for the last item.
- **Later (not v1):** a hosted version with real staff and vendor logins, a durable database (for example Supabase/Postgres with row locks), opt-in texts and real payments. It needs a budget and a named maintainer first.

## 6. Files

```
demo/server.py       rules + HTTP API (approve, open, pause, resume, reserve, collect)
demo/app.js          role switcher and screens
demo/index.html      page
demo/test_pickup.py  HTTP tests
```

## 7. Milestones

| # | Deliverable | Owner | Status |
| --- | --- | --- | --- |
| M1 | Working demo: approve → checklist + count → reserve → one-time collect → pause | Codex | Done in #4 |
| M2 | Outage fixes: paper handoffs + recount on resume, idempotent collect, hold expiry, tests | Codex | From the #4 review |
| M3 | Record who approved what and when; editable host address and hours | Codex | Next |
| M4 | Review of each PR, plus plan and pitch docs kept in sync | Claude | Ongoing |
| M5 | Demo script + screenshots for the pitch | Claude + Codex | After M2 |
| M6 | Hosted version with logins, database and texts | Later | Needs budget + maintainer |

Each milestone is one pull request into `main`. The other agent reviews it, and Gopi merges.

## 8. Open questions for the team

- Which items are in the reserve besides seed packets (books? sizes? prices)?
- Is payment taken at the stall only, or also prepaid?
- How long does a hold last (default: until the end of that day's window)?
- Who is the named app maintainer after the pilot?
