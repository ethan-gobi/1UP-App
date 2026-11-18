# Timeline: Fold-Out Market pilot

**Assumed start: January 2027.** If the pilot starts later, shift every date by the same amount. The goal is for the carts, the trained staff and the pickup website to be ready **before spring flood season** (snowmelt and spring storms, March to April). Pickups then run through the summer storm months. The July 2024 flood is the one we are planning for.

```mermaid
gantt
    title Fold-Out Market pilot, 2027 (CAD $100,000)
    dateFormat YYYY-MM-DD
    axisFormat %b
    todayMarker off

    section Approvals
    Evergreen sign-off and vendor briefing     :a1, 2027-01-04, 3w
    Copp Hall quote, host agreement, insurance :a2, 2027-01-04, 5w
    Host agreement signed                      :milestone, m1, after a2, 0d

    section Cart and canopy
    Final cart design and safety review        :d1, 2027-01-11, 4w
    Build and test the prototype cart          :d2, after d1, 3w
    Build cart 2, buy canopies, stock, readers :d3, after d2, 3w
    Carts ready                                :milestone, m2, after d3, 0d

    section Website ($100)
    Outage fixes and approval records          :w1, 2027-01-04, 6w
    Accessibility check with real users        :w2, after w1, 2w
    Domain and free hosting live               :milestone, m3, after w2, 0d

    section Drills and training
    Staff and vendor training                  :t1, 2027-03-15, 2w
    4 timed drills vs a folding table and bins :t2, after t1, 3w
    Signs, QR cards and flyers at both sites   :t3, 2027-03-22, 3w
    Ready for flood season                     :milestone, m4, 2027-04-19, 0d

    section Pickup season
    12 market days at Copp Hall                :s1, 2027-04-24, 2027-10-30
    Monthly cart inspections                   :s2, 2027-04-24, 2027-10-30

    section Review
    Year-one review: sales, drill times, cost  :r1, 2027-11-01, 4w
    Decide on the $29,783.89 year-two reserve  :milestone, m5, 2027-12-03, 0d
```

## Phases

| Phase | When | What gets done | Money (see [BUDGET.md](BUDGET.md)) |
| --- | --- | --- | --- |
| 1. Approvals | Jan 2027 (5 weeks) | Evergreen signs off on the pilot. The church gives a written quote covering room, storage, weekend custodial fees and short-notice access. Host agreement and liability insurance are in place. | Admin $2,300; storage retainer starts ($275/month) |
| 2. Cart and canopy | Jan to Mar (10 weeks) | Lock Hogan's push-bar cart design. A professional checks stability and accessibility. Build and load-test the prototype, then build the second cart and buy canopies, stock and card readers. | Materials $7,838; design review $3,600; fabrication $7,200 |
| 3. Website | Jan to Mar (8 weeks, in parallel) | Codex finishes the outage fixes and approval records. The team tests the site with users who rely on large print and screen readers. A domain goes live on free hosting. | Website $100 (student hours in kind) |
| 4. Drills and training | Mid-Mar to mid-Apr (5 weeks) | Train staff and vendors. Run 4 timed drills, comparing the cart with a plain folding table and bins. Put signs and QR cards up at the Brick Works and Copp Hall. | Coordination $4,400; trials $1,030; outreach $1,500 |
| 5. Pickup season | Late Apr to Oct (27 weeks) | 12 booked market days at Copp Hall, plus a pickup whenever a flood closes the shop. Inspect the carts monthly. | Hall $19,200; staffing $3,072; van $2,160; inspections $864 |
| 6. Review | Nov 2027 (4 weeks) | Compare sales, drill times and costs with the plan. Decide whether to release the year-two reserve, change the plan or stop. | Year-two reserve $29,783.89 held until this point |

## Checkpoints that can stop or change the plan

- **End of January:** no written answer from the church means we look for a second host before building anything.
- **Mid-March:** if the prototype fails its stability or doorway test, fix it before drills start, or use the folding table and bins for this season.
- **Mid-April:** if the cart isn't faster or safer than a folding table and bins in the drills, build no more and run the season with the cheaper setup.
- **December:** the reserve is released only if the stall was used and the drills passed.
