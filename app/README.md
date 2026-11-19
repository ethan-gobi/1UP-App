# Brick Works Flood Desk (app)

A static web app. No build step, no server, no keys. Host the `app/` folder anywhere free (Vercel with the root `vercel.json`, GitHub Pages, Netlify). To try it on your computer: `npx serve app` (or `python -m http.server -d app`) and open the printed address.

## Screens

- **Forecast** (main): today's chance that the Don runs high today or tomorrow, the level (Normal, Watch, Warning, Flood, Recovery), what is driving it, a 10-day strip (3 measured days, today, 6 forecast days), the live Todmorden river gauge, and the next 48 hours of rain and humidity.
- **Tasks**: the flood protocol for the chosen person. Today's checklist follows the current level, and the week ahead shows each day's level and tasks. Maya (site operations) also sees everyone else's tasks, because she is the one source of truth.
- **Pickup**: the Fold-Out Market rehearsal from the earlier demo (staff approve, vendor opens after the safety check, customer reserves, vendor hands over, outage pause). It now runs in the browser so it can be hosted for free.
- **Accuracy**: held-out scores, the humidity-rule test, a live 30-day check against the river, and a forecast log that replaces each forecast with measured rain once the day has passed.

**Replay July 2024 storm** reloads the app with the real archived weather around the 16 July 2024 flood, for demos.

## Live data (all free, CORS-enabled)

| What | Source |
|---|---|
| Hourly forecast and the last 35 days | Open-Meteo forecast API |
| Measured daily rain | Environment Canada climate stations Toronto City, North York, Pearson (`api.weather.gc.ca`) |
| River flow every 5 minutes | Water Survey of Canada real-time gauge 02HC024 Don River at Todmorden (`api.weather.gc.ca`) |

## Files

`app.js` screens and charts · `flood-model.js` the model (shared with training) · `model.json` fitted weights and alert levels · `protocol.js` the tasks by level and person · `pickup.js` the pickup rehearsal. Tests: `node --test tests/*.test.mjs`.
