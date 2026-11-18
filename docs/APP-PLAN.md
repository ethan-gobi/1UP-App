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

- **Frontend:** Vite + React + TypeScript, mobile-first progressive web app. Large text, high contrast, keyboard and screen reader friendly.
- **Data (mock):** an in-memory / localStorage store behind a `Store` interface, so it can switch to Supabase later without rewriting screens.
- **Core logic:** pure functions in `src/core/` (reserve, redeem, pause, reconcile, expire) with no UI code, so they are easy to test.
- **Tests:** Vitest for core rules, Playwright for the 6-step demo flow.
- **Later (not v1):** Supabase (auth + Postgres row locking for the last item), opt-in texts, real payments through the Square reader.

## 6. Folder layout

```
src/core/        domain types + rules (reserve, redeem, expire, pause, reconcile)
src/store/       Store interface + mock implementation
src/screens/     the 6 screens
src/routes.tsx   public, staff and vendor routes (mock role switcher)
tests/core/      Vitest rule tests
tests/e2e/       Playwright demo flow
```

## 7. Milestones

| # | Deliverable | Owner |
| --- | --- | --- |
| M1 | Project scaffold, `src/core` types and rules, unit tests for every rule in section 3 | Claude |
| M2 | Mock store + 6 screens + mock role switcher | Claude |
| M3 | Edge-case test list review, accessibility pass, Playwright demo test | Codex |
| M4 | Demo script + screenshots for the pitch | Claude + Codex |
| M5 | Supabase + texts (only after the team approves a budget and maintainer) | Later |

Each milestone is one pull request into `main`. The other agent reviews it, and Gopi merges.

## 8. Open questions for the team

- Which items are in the reserve besides seed packets (books? sizes? prices)?
- Is payment taken at the stall only, or also prepaid?
- How long does a hold last (default: until the end of that day's window)?
- Who is the named app maintainer after the pilot?
