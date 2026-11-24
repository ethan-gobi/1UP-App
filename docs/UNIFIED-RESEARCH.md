# 1UP Yellow Zone: Unified Research

*All research for the 1UP Yellow Zone project, merged from Claude's and Codex's work. Updated 24 Nov 2026. Judging is around 14 Dec 2026. This file replaces older plans and budgets wherever they disagree, and links each fact to its source.*

**Who this is for:** the script writer and the slide maker. Section 12 lists the slides this research best supports.

---

## 1. The ask (one slide)

> We ask for **CAD $2,422.46** to run a **2027 pilot** at the Evergreen Garden Market.
> On every flood-watch morning, staff check three things:
> - our **Flood Desk** forecast
> - the official **TRCA** and **Environment Canada** alerts
> - the site itself
>
> If there's risk, the market opens with a **sample-only display**: one sample of each item, with the rest of the stock kept dry.
> Staff **log every market morning**, quiet ones too, so after one season we can show whether Flood Desk helped.
> **$100,000 is our ceiling, not our target.** A bigger off-site pickup service is **phase two**. It happens only if the pilot works and a host signs on.

Agreed by Ethan (Gopi), Hogan, Claude and Codex on 24 Nov 2026 ([issue #13](https://github.com/ethan-gobi/1UP-App/issues/13)).

---

## 2. The site and its floods

| Fact | Detail | Source |
|---|---|---|
| Site | Evergreen Brick Works, in the Don Valley. A brickworks from 1889 to 1984, heritage-designated in 2002, opened by Evergreen in Sept 2010. Over 500,000 visitors a year | [Evergreen](https://www.evergreen.ca/evergreen-brick-works/visitor-info/about-us/) |
| Yellow Zone | Welcome Centre, Garden Market, TD Future Cities Centre, Koerner Gardens. "Yellow Zone" is our label, not Evergreen's | team |
| Revitalization | "Evergreen Brick Works 2.0", **$15.6M**, announced 18 Mar 2026 | [Evergreen release](https://www.evergreen.ca/news/evergreen-brick-works-2-0-15-6m-revitalization-to-strengthen-climate-resilience-and-accessibility-of-historic-site/) |
| Garden Market | Evergreen's own social-enterprise shop. Native plants, seeds, tools, and goods from 100+ local makers. 100% of proceeds go to Evergreen. Open 7 days a week | [Evergreen](https://www.evergreen.ca/evergreen-brick-work/activities/evergreen-garden-market/) |
| Flood 1: 2013 | 8 Jul 2013. Pearson measured 126 mm. The Don averaged 53 m³/s at Todmorden. The site's flood design worked "as designed" | [Meeting of the Minds](https://meetingoftheminds.org/green-resilient-building-tested-at-evergreen-brick-works-8375), model/README.md |
| Flood 2: 16 Jul 2024 | About 100 mm of rain; Pearson had 96 mm by 2:30 p.m. Staff, tenants and 113 campers evacuated with no injuries. The Garden Market was among the "hardest hit" and had "considerable losses". **The year is 2024, not 2023** | [Evergreen Flood Recovery](https://www.evergreen.ca/flood-recovery/), [Evergreen](https://www.evergreen.ca/?p=27844), [CTV](https://toronto.ctvnews.ca/three-thunderstorms-in-three-hours-more-than-a-month-s-worth-of-rain-fell-in-toronto-1.6966041) |
| Flood 3: 2 Sep 2026 | An overnight "100-year" storm. The site closed and the Farmers Market moved to the Distillery District. Open daily again by 7 Oct 2026 | [Evergreen flood update](https://www.evergreen.ca/news/a-flood-a-faster-recovery-and-a-lesson-for-canadian-cities/), [CTV](https://www.ctvnews.ca/toronto/video/2026/09/05/evergreen-brick-works-closed-this-weekend-for-storm-cleanup-farmers-market-relocated/) |
| Insurance | Insurers won't offer flood coverage on the floodplain | [Evergreen Flood Recovery](https://www.evergreen.ca/flood-recovery/) |
| Existing flood design | "Wet floodproofing": water is allowed through ground floors. Systems are raised, with no drywall or carpet downstairs, 20,000 L cisterns and pervious paving. A 2019 case study already documents **raised retail displays and a staff weather tool** | [2019 case study, p. 27](https://bomacanada.ca/wp-content/uploads/2023/04/Ahead-of-the-Storm-1.pdf#page=27) |

**Three floods in about 12 years.** The buildings are designed to survive them. The **stock on the ground floor is not protected**.

---

## 3. The problem

- **Raising stock isn't enough on its own.** Outward Bound Canada, a tenant at the Brick Works, raised its gear about 3 ft after 2024. In Sept 2026 the water rose higher, got into its containers and knocked its shelving over ([Outward Bound, 2026](https://www.outwardbound.ca/blog/outward-bound-canada-toronto-flood-2026/)).
- **Opening day is the risky moment.** If staff put the full stock out and the river rises, the goods are on the floor when the water arrives. If they stay closed on every rainy day, vendors and Evergreen lose sales.
- **Staff need a clear morning signal.** Official alerts exist, but in July 2024 TRCA's Flood Watch came at 09:35, after the storm had started (Section 6).
- **No loss figure is published.** Evergreen gives no dollar figure for the Garden Market. Say "considerable losses" (Evergreen's words), not "thousands of dollars".

---

## 4. The pilot: how a flood-watch morning works

1. **Before opening**, a staff member checks:
   - Flood Desk's level for today (Normal, Watch, Warning)
   - the official alerts in force (TRCA flood messages, Environment Canada warnings)
   - the site itself
2. **Decide** (proposed rule, to confirm with Garden Market staff):
   - **Normal and no official alert:** open as usual.
   - **Watch or higher, or any official alert:** open with a **sample-only display**, one sample per variety. The rest of the stock stays packed in a dry spot. Customers still see the full range and can order.
   - **Official Flood Warning, or an evacuation order:** don't open. Evergreen staff always have the final say.
3. **Log the morning, every market day, quiet ones too:**

| Field | Example |
|---|---|
| Date, time checked | 2027-05-03 07:30 |
| Flood Desk level and % (screenshot) | Watch, 22% |
| Rain forecast it used, mm today / tomorrow | 18 / 6 |
| Official alerts in force, with issue times | TRCA Flood Outlook, 06:10 |
| Live gauge 02HC024 | 9.4 m³/s |
| Decision and reason | Opened, sample-only |
| Outcome (peak flow, site wet?) | Peak 14 m³/s, site dry |

4. **After the season,** count:
   - the mornings Flood Desk was at Watch or higher **before** any official alert
   - how many of those actually flooded
   - the floods it **missed**
   - the sales on sample-only days compared with normal days

> **Still open:** where exactly the stock is "kept dry" on site. Confirm the spot with Garden Market staff.

---

## 5. Flood Desk: the forecast

**What it predicts:** will the Don River at Todmorden (gauge 02HC024, just upstream of the Brick Works) **average 20 m³/s or more today or tomorrow?** That happened on 178 days from 2000 to 2023, about **7 days a year**.
- 20 m³/s is "high water", not a guaranteed flood at the market. The site itself flooded 3 times in 12 years.

**Data:** all free and public, no keys.
- **Rain:** Environment Canada stations Toronto City, North York and Pearson, averaged.
- **Other weather:** Open-Meteo (humidity, rain intensity, temperature, pressure, snowmelt).
- **River:** Water Survey of Canada gauge 02HC024.

**Model:** logistic regression with 14 inputs. The main ones are rain today and tomorrow, rain over the past days, and a "how soaked is the ground" index.
- **Train:** 2000–2015.
- **Tune:** 2016–2019.
- **Test:** 2020–2023, scored once, on data it never saw.

**Results on 2020–2023** (20 high-water events):

| Alert level | Events flagged a day ahead | Flagged by the day itself | False-alarm days a year |
|---|---|---|---|
| Watch (15%) | 16 of 20 | 20 of 20 | 13.3 |
| Warning (30%) | 13 of 20 | 18 of 20 | 5.3 |

- **AUC 0.963.** A "never warn" rule is right 97.0% of days, so plain accuracy is misleading. Count caught events instead.
- **Caveat:** the "day ahead" numbers assume a perfect rain forecast, because training used rain that actually fell. Real use relies on forecasts, so expect worse, especially for summer thunderstorms.

**Why not just use humidity?** The team's original idea was a 75% humidity rule. Tested on the same years:

| Rule | Floods caught (44 high-water days) | False alarms | Days right |
|---|---|---|---|
| Humidity over 75% | 44 of 44 | 1,255 | 14% |
| 20 mm of rain or more | 14 of 44 | 12 | 97% |
| **Flood Desk at 35%** | **27 of 44** | **16** | **98%** |

Humidity was over 75% on **89% of all days**. It "catches" every flood because it's almost always on.

**Station rain against satellite-grid rain:** on 8 Jul 2013 the weather grid showed 12 mm, but Pearson measured **126 mm**. Switching to real station gauges is what made the model work.

**How Flood Desk differs from Evergreen's 2019 weather tool:** it's tuned to this river gauge, tested on years it never saw, and gives a single Normal / Watch / Warning level with a task list for each staff role.

Sources: `model/README.md`, `model/results.json`, `app/README.md` in [PR #12](https://github.com/ethan-gobi/1UP-App/pull/12).

---

## 6. Case study: the morning of 16 July 2024

*Corrected 24 Nov 2026. An earlier version said Flood Desk showed "Watch at 7 a.m., ahead of TRCA". **Don't use that claim.** Forecasts issued the day before showed only 4–7 mm (two models 18–25 mm), so no forecast gave a real early warning. A borderline 29% score from one replay came mostly from rain already measured on 15 July, one point under Warning.*

| Time | Source | What happened |
|---|---|---|
| 15 Jul, afternoon | Rain gauges | Steady rain: 25 mm at Pearson |
| 15 Jul | TRCA | Yellow **Water Safety** statement |
| 15 Jul | Weather models | Forecasts for the 16th: **4–7 mm**, two models 18–25 mm |
| 16 Jul, about 09:00 | TRCA rain gauge at the Brick Works | Rain starts |
| 16 Jul, 09:35 | TRCA | **Flood Watch** |
| 16 Jul, 11:00–11:30 | TRCA gauge, Don at Todmorden | Water level rises **78.9 → 80.0 m** (1.1 m in 30 minutes) |
| 16 Jul, 11:35 | TRCA | **Flood Warning**. TRCA **phoned the Brick Works** |
| 16 Jul, by 2:30 p.m. | Pearson | 96 mm (97.8 mm for the day) |

**What this shows**
- **No forecast saw it coming.** The storm arrived on the day, with no useful warning the day before.
- **The river gives minutes, not hours.** Rain started around 09:00, and the Don rose a metre in half an hour at 11:00.
- **TRCA's system worked.** It issued the Watch at 09:35, the Warning at 11:35, and phoned the site.

**So the pitch is:** Flood Desk does **not** try to beat TRCA. It **works alongside TRCA**:
- It watches **live rain and upstream river gauges**.
- It runs the **Brick Works checklist** for each person (pack the stock, close the market, move people) the moment the river starts to rise.
- That way the minutes between "rain starts" and "water arrives" are used, not lost.
- The sample-only display means most stock is already packed before those minutes start.

**Don't say:** "Flood Desk predicted the July 2024 flood" or "Flood Desk beat TRCA."

Sources: [TRCA event report, Sept 2024](https://pub-trca.escribemeetings.com/filestream.ashx?DocumentId=17893), [TRCA real-time gauges](https://trcagauging.ca/), ECCC Pearson daily data (6158731), [CTV](https://toronto.ctvnews.ca/three-thunderstorms-in-three-hours-more-than-a-month-s-worth-of-rain-fell-in-toronto-1.6966041). Forecast backtest numbers since 2016 are coming from the Flood Desk demo work and will be added here.

**Other checks** (scored afterwards with the rain that actually fell, so hindsight, not forecasts):

| Day | Score |
|---|---|
| 15 Jul 2024 | 95% |
| 16 Jul 2024 | 89% |
| 16 Aug 2024 | 28% |
| 17 Aug 2024 | 85% |
| 1 Sep 2026 | 16% |
| 2 Sep 2026 | 24% |

The **2 Sep 2026 flood came overnight** and scored low even in hindsight. A morning check can't cover an overnight storm (Section 7).

Sources: [TRCA event report](https://pub-trca.escribemeetings.com/filestream.ashx?DocumentId=17893), [CBC](https://amp.cbc.ca/lite/story/1.7264873), [CTV](https://toronto.ctvnews.ca/three-thunderstorms-in-three-hours-more-than-a-month-s-worth-of-rain-fell-in-toronto-1.6966041), [City of Toronto](https://www.toronto.ca/news/city-of-toronto-provides-an-update-on-response-efforts-following-heavy-rainfall/), and the replay script `model/replay_2024_07_16.py`. The script uses the Open-Meteo Previous Runs API and ECCC station data.

---

## 7. Limits (what a judge will ask)

| Question | Honest answer |
|---|---|
| Does Flood Desk replace official alerts? | **No.** Staff check both. Official alerts and Evergreen staff always win |
| Can it predict a thunderstorm? | No. On 16 Jul 2024 forecasts issued the day before said 4–7 mm, and about 100 mm fell. That's why Flood Desk follows live rain and river gauges on the day |
| Overnight floods? | The morning check doesn't help. Stock that's already packed away overnight is the protection |
| How often will it cry wolf? | About 13 Watch days a year with no high water. Each one costs a sample-only morning. The pilot measures how much that costs in sales |
| Does it predict flooding at the site? | It predicts high water at the gauge (20 m³/s average), about 7 days a year. Short peaks can flood low ground even when the daily average is lower, so the app also shows the live 5-minute gauge |
| Has Evergreen agreed? | **Not yet.** Nor have vendors. Asking them is the first pilot step |
| What did the floods cost the market? | No published figure. Use Evergreen's words: "considerable losses" |

---

## 8. Budget

| | CAD |
|---|---:|
| **Judging ask: 2027 pilot** | **2,422.46** |
| Ceiling | 100,000.00 |
| Phase two (costed, **not requested now**) | see Section 9 |

> **Line items for the $2,422.46: to be added.** They're in Hogan's deck. Codex has been asked to post them on [issue #13](https://github.com/ethan-gobi/1UP-App/issues/13). Every slide must show **$2,422.46** as the ask.

**Out of date, don't use on slides:**
- $61,330.51
- $72,937.87
- $35,238
- the $43,000 / $26,000 / $28,000 / $18,000 lines from the first "Lucas Tian Yams" budget
- "$100,000 total" as a spend figure

Source of truth: [`docs/BUDGET.md`](BUDGET.md).

---

## 9. Phase two: off-site pickup (only if the pilot works)

**What it is:** a portable push-bar cart with a canopy strapped on and a lockable lid that becomes the counter. It carries stock to a dry, step-free hall so pre-ordered pickups still happen while the Brick Works is closed. A $100 static website handles reservations, one-time pickup codes and an offline pause.

| Host | Status |
|---|---|
| **Copp Hall**, Rosedale United Church (main, stores the cart) | 1,800 sq ft, 115 people, lift at the west entrance. "Vendor and artisan markets" listed as a use. **No prices online, no agreement, church not yet contacted.** The floodplain check on the [TRCA map](https://trca.ca/conservation/flood-risk-management/flood-plain-map-viewer/) still needs a person to do it ([Copp Hall](https://www.rosedaleunited.org/rent-with-us/copp-hall)) |
| **Yorkminster Park Baptist**, 1585 Yonge St (backup) | Friendship Room $50 to $100/h, 3-hour minimum, fully accessible ([rates](https://pages.yorkminsterpark.com/facility-rental/)) |
| **Church of the Redeemer**, 162 Bloor St W (backup) | Parish Hall, elevator from the Avenue Rd ramp, price by quote ([rooms](https://theredeemer.ca/renting-space/)) |

**Costed schedule** (phase two only):
- Year one: $81,104.23
- Website: $100
- Year-two reserve: $18,795.77
- Total: $100,000

**Conditions:**
- a written host agreement
- a TRCA map check
- a fabrication quote for the cart
- the pilot shows demand

**Design files:**
- Hogan's push-bar cart renders and Blender model ([PR #8](https://github.com/ethan-gobi/1UP-App/pull/8))
- the pickup demo ([PR #9](https://github.com/ethan-gobi/1UP-App/pull/9))

Rejected along the way:
- a 13 ft fold-lift frame (safety-critical machinery in a heritage building)
- fixed cabinets at the market

---

## 10. Options we considered (and why the pilot won)

We tested eight ideas against four user personas:
- **Maya**, site operations
- **Daniel**, a family visitor
- **Aisha**, a Garden Market vendor
- **Marcus**, an event organizer

| # | Idea | Why not now |
|---|---|---|
| 1 | Live flood status board and text alerts | **Kept as Flood Desk**, but staff-only first. Public alerts stay with TRCA and Evergreen |
| 2 | Raised rolling shelving | Outward Bound's 3 ft raise failed in 2026 |
| 3 | Deployable flood barriers | Needs staff on site, so it fails overnight. Heritage approvals |
| 4 | Raised boardwalk | Expensive, needs heritage and conservation approval, doesn't stop flooding |
| 5 | Sponge garden | Evergreen already has cisterns and pervious paving |
| 6 | Recovery kit and 48-hour playbook | Useful but invisible. Folded into the protocol |
| 7 | Pop-up backup market | **Kept as phase two** (off-site pickup) |
| 8 | Four-season covered hub | Costly and doesn't address floodwater. Koerner already runs year-round |

**Why the pilot:** it's cheap, needs no construction or permits, works with Evergreen's existing flood design, and produces evidence before anyone spends real money.

---

## 11. Earlier team research: "One Up Official" Google Doc

> **Slot reserved.** This doc used to be named after Lucas Chen Yam. Codex has been asked to upload it to the repo as `research/one-up-official.md`. When it arrives, its findings will be merged into the sections above, and anything that conflicts with Section 1 will be marked as superseded.

---

## 12. Slides this research supports

1. **Three floods in 12 years:** timeline 2013, 2024, 2026, plus the Garden Market's "considerable losses" and no flood insurance.
2. **Raising stock isn't enough:** Outward Bound's 3 ft raise, beaten in 2026.
3. **16 July 2024: the river gives minutes:** the timeline table in Section 6, with rain at 09:00, Flood Watch at 09:35, the river up 1.1 m by 11:30 and the Warning at 11:35. This is the strongest slide.
4. **Flood Desk works on years it never saw:** the held-out table, plus "never warn scores 97%".
5. **Why not humidity:** over 75% on 89% of days, with 1,255 false alarms.
6. **Real gauges beat the grid:** 12 mm against 126 mm on 8 Jul 2013.
7. **Flood Desk demo:** the live app ([PR #12](https://github.com/ethan-gobi/1UP-App/pull/12)). Note that "Replay July 2024" loads the rain that **actually fell**. Say on the slide that it's a replay, not a forecast made in advance. *(A separate thread is making a screen recording.)*
8. **The pilot morning:** the three checks, the sample-only display and the log.
9. **The ask:** $2,422.46, with $100K as the ceiling and phase two.
10. **Limits:** the Section 7 table. Judges respect it.

Images a person still has to capture:
- a [TRCA floodplain map](https://trca.ca/conservation/flood-risk-management/flood-plain-map-viewer/) screenshot of the Brick Works
- a live [02HC024 gauge](https://wateroffice.ec.gc.ca/report/real_time_e.html?stn=02HC024) screenshot
- [TRCA real-time monitoring](https://trcagauging.ca/)

---

## 13. Slide fixes from fact-checking

- The flood was **16 July 2024**, not 2023.
- Picnic Café is in **Building 14**, not the Welcome Centre.
- The TD Future Cities Centre is **brick and steel**, not timber. It's a kiln *building* (Building 16), not a kiln. It was **designed to** a carbon-neutral target, but the target isn't confirmed as met.
- The revitalization is **$15.6M**. "Nearly $16M" is acceptable.
- Evergreen never calls the Garden Market an "incubator". The Saturday Farmers Market fits that word better.
- Koerner Gardens skating: free public skate, with skate rental at a suggested $5 donation.
- Urban Minds' first 1UP Leaders Lab visited the Brick Works in **Aug 2018** ([8 80 Cities](https://www.880cities.org/?p=4429)). That's a precedent, not a current partnership.

Full detail: `project/research-notes.md` ([PR #11](https://github.com/ethan-gobi/1UP-App/pull/11)).

---

## Sources

**Evergreen**
- [About the Brick Works](https://www.evergreen.ca/evergreen-brick-works/visitor-info/about-us/)
- [$15.6M revitalization](https://www.evergreen.ca/news/evergreen-brick-works-2-0-15-6m-revitalization-to-strengthen-climate-resilience-and-accessibility-of-historic-site/)
- [Garden Market](https://www.evergreen.ca/evergreen-brick-work/activities/evergreen-garden-market/)
- [Flood Recovery 2024](https://www.evergreen.ca/flood-recovery/)
- [Flood update 2026](https://www.evergreen.ca/news/a-flood-a-faster-recovery-and-a-lesson-for-canadian-cities/)
- [Ahead of the Storm, 2019 case study, p. 27](https://bomacanada.ca/wp-content/uploads/2023/04/Ahead-of-the-Storm-1.pdf#page=27)

**Floods and alerts**
- [TRCA event report (16 Jul 2024 timeline)](https://pub-trca.escribemeetings.com/filestream.ashx?DocumentId=17893)
- [CBC](https://amp.cbc.ca/lite/story/1.7264873)
- [CTV](https://toronto.ctvnews.ca/three-thunderstorms-in-three-hours-more-than-a-month-s-worth-of-rain-fell-in-toronto-1.6966041)
- [City of Toronto](https://www.toronto.ca/news/city-of-toronto-provides-an-update-on-response-efforts-following-heavy-rainfall/)
- [Outward Bound 2026](https://www.outwardbound.ca/blog/outward-bound-canada-toronto-flood-2026/)
- [Meeting of the Minds](https://meetingoftheminds.org/green-resilient-building-tested-at-evergreen-brick-works-8375)

**Data**
- Water Survey of Canada gauge 02HC024
- Environment Canada climate stations 6158355, 615S001, 6158733/6158731 (`api.weather.gc.ca`)
- [Open-Meteo](https://open-meteo.com/) (archive, forecast and Previous Runs APIs)
- [TRCA floodplain map](https://trca.ca/conservation/flood-risk-management/flood-plain-map-viewer/)
- [TRCA real-time monitoring](https://trcagauging.ca/)

**Hosts**
- [Copp Hall](https://www.rosedaleunited.org/rent-with-us/copp-hall)
- [Yorkminster Park](https://pages.yorkminsterpark.com/facility-rental/)
- [Church of the Redeemer](https://theredeemer.ca/renting-space/)

**Team work**

| PR | What's in it |
|---|---|
| [#8](https://github.com/ethan-gobi/1UP-App/pull/8) | Cart designs |
| [#9](https://github.com/ethan-gobi/1UP-App/pull/9) | Pickup demo |
| [#10](https://github.com/ethan-gobi/1UP-App/pull/10) | Budget and timeline |
| [#11](https://github.com/ethan-gobi/1UP-App/pull/11) | Project archive |
| [#12](https://github.com/ethan-gobi/1UP-App/pull/12) | Flood Desk |
