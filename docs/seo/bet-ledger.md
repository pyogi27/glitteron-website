# SEO Bet Ledger

Single source of truth for the emerging-keyword lifecycle. The companion engine loop
("SEO - Scale Proven Keywords") reads this file for its earn-the-engine gate — a term is
only eligible for an engine if it has a `SCALE` verdict recorded here.

One line per bet. Never delete a row; a closed bet stays as evidence.

| Term | Thesis (one line) | Opened | Seed PR | Verdict | Verdict date |
|------|-------------------|--------|---------|---------|--------------|
| _(none yet)_ | | | | | |

**Verdict values:** `OPEN` · `SCALE` · `LEAVE` · `EXTENDED` (one borderline extension only —
a second borderline is a `LEAVE`).

## Pre-existing coverage

Pages that shipped **before this ledger existed**. They are deliberately *not* recorded as
closed bets: no thesis was written, no seed PR opened, and no 7-day window was ever scored,
so assigning them a `SCALE` or `LEAVE` verdict would fabricate history — and this file is
exactly what the engine loop's gate reads. They are listed here for one purpose: **mining must
not duplicate a term one of these already covers.**

GSC column is real data, 90 days ending 2026-08-08, property `https://www.litmeup.in/`.

### Guides — `/guides/<slug>`, shipped 2026-08-07

| Slug | Covers | GSC 90d |
|------|--------|---------|
| `bedroom-lighting-ideas` | How to light a bedroom | 0 impressions |
| `how-high-to-hang-a-dining-light` | How high to hang a light over a dining table | 0 impressions |
| `what-size-chandelier` | What size chandelier do you need | 0 impressions |
| `warm-or-cool-light` | Warm or cool light — which Kelvin for which room | 0 impressions |
| `how-many-pendants-over-a-kitchen-island` | How many pendants over a kitchen island | 0 impressions |
| `how-to-light-a-living-room` | How to light a living room | 0 impressions |

### City landing pages — `/lighting/<city>`, shipped 2026-08-07

`mumbai` · `delhi` · `bangalore` · `hyderabad` · `chennai` · `pune` · `ahmedabad` · `kolkata`
— all 0 impressions.

### Room pages — `/rooms/<slug>`, shipped 2026-06-15

| Slug | Covers | GSC 90d |
|------|--------|---------|
| `living-room` | Living Room Lighting | 0 impressions |
| `dining-room` | Dining Room Lighting | 2 impressions, position 32 |
| `bedroom` | Bedroom Lighting | 0 impressions |
| `kitchen` | Kitchen Lighting | 0 impressions |
| `home-office` | Home Office Lighting | 0 impressions |

`/rooms` (index) also shows 2 impressions at position 4.

**Read the zeros correctly.** The guides and city pages shipped **2026-08-07, one day before the
end of this reading window**, and GSC lags 2–3 days besides. Zero impressions means *not yet
measured*, not *failed*. Do not treat these as proven losers, and do not derive a losing
archetype from them. The room pages have had since 2026-06-15 and are the only pre-existing
pages with any signal at all.

## Watchlist

Emerging-but-unsearchable terms. These never get a seed article. Each carries a drop-dead
date; if it has not earned real impressions by then, it is dropped.

| Term | Why watching | Added | Drop-dead date |
|------|--------------|-------|----------------|
| _(none yet)_ | | | |

## Lessons

One line per `LEAVE`. This is how archetype evidence accumulates.

| Term | Verdict date | Lesson |
|------|--------------|--------|
| _(none yet)_ | | |
