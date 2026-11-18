# Yellow Zone Solution: The Simple Version

[Compare the proposed Fold-Out Garden Market pilot and updated financial plan](FOLD-OUT-PILOT.md). The team is reviewing the two scopes.

**Foldable shelves + a flood warning app + a practised drill = no Garden Market stock lost to the next flood.**

```mermaid
flowchart LR
    A[TRCA river data] --> B[App suggests<br/>Green / Yellow / Red]
    B --> C{Maya approves?}
    C -- no: keep watching --> A
    C -- yes --> D[Alerts out:<br/>app, texts, screen]
    D --> E[Vendors fold and load<br/>the foldable shelves]
    E --> F{All locked<br/>in 30 min?}
    F -- no --> G[Text next person,<br/>then sound alarm]
    G --> E
    F -- yes --> H[Stock safe,<br/>time logged]
```

```mermaid
pie showData
    title $100,000 budget (CAD)
    "Shelves + hardware" : 43000
    "App + first year" : 26000
    "Survey + design" : 10000
    "Contingency" : 9000
    "Training" : 5000
    "Permits, outreach, travel" : 7000
```

```mermaid
gantt
    title 12-month pilot
    dateFormat  YYYY-MM
    axisFormat  Month %m
    section Plan
    Design, survey, permits   :a1, 2027-01, 2M
    section Make
    Build shelves + app        :a2, after a1, 3M
    section Test
    Drill                      :a3, after a2, 1M
    Live pilot                 :a4, after a3, 6M
```
*(The Gantt uses example months. Shift them to the real start date.)*

## In bullets

- **Problem:** Evergreen's flood design protects the buildings, not the stock on the floor. The Garden Market lost stock in July 2024, and the site flooded again on September 2, 2026.
- **Part 1, the shelves:** 2 foldable, latched cabinet modules. Reserve stock stays up high on removable trays every night.
- **Part 2, the app:** it watches TRCA river data, Maya approves, vendors get a fold-and-load checklist, and texts plus an alarm chase anyone who hasn't finished.
- **Part 3, the drill:** staff and vendors practise. The goal is every shelf locked within 30 minutes.
- **Visitors and organizers:** a public status page and the Welcome Centre screen show whether the site is open.
- **Budget:** $100,000 over 12 months.
- **Success:** shelves locked in under 30 minutes, no missed tasks, and no stock lost.
- **Biggest risks:** a flood higher than the shelves, an overnight flood with nobody on site, and no funding confirmed for year two.

Full plan: [PLAN-DETAILED.md](PLAN-DETAILED.md)
