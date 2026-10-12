# SEO Bet Ledger

Single source of truth for the emerging-keyword lifecycle. The companion engine loop
("SEO - Scale Proven Keywords") reads this file for its earn-the-engine gate — a term is
only eligible for an engine if it has a `SCALE` verdict recorded here.

One line per bet. Never delete a row; a closed bet stays as evidence.

| Term | Thesis (one line) | Opened | Seed PR | Verdict | Verdict date |
|------|-------------------|--------|---------|---------|--------------|
| `acrylic chandelier` | Query already gets 15 impressions/90d at position 8.5 with zero dedicated content; an honest acrylic-vs-glass buying guide (we stock no acrylic — CTA routes to hand-blown glass) captures the intent without fabricating inventory. | 2026-09-28 | (opens with this run) | OPEN | |

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

### Attribute and umbrella pages — shipped 2026-08-21

Added from a competitor gap analysis, not from keyword mining, so they are listed
here rather than as ledger bets: the thesis is structural (every site ranking above
us multiplies category by attribute, and we did not), and the inventory behind each
was counted before the page was written. **Mining must not re-propose these terms.**

Counts are live product totals at ship time, verified against the API per URL.

| URL | Term covered | Products |
|-----|--------------|----------|
| `/hanging-lights` | hanging lights (chandeliers + pendants together) | 658 |
| `/chandelier-lights/glass` | glass chandelier | 124 |
| `/chandelier-lights/gold` | gold / golden chandelier | 134 |
| `/chandelier-lights/black` | black chandelier | 64 |
| `/pendant-lights/glass` | glass pendant light | 147 |
| `/pendant-lights/gold` | gold pendant light | 81 |
| `/pendant-lights/black` | black pendant light | 58 |
| `/pendant-lights/wood` | wooden pendant / wooden hanging light | 32 |
| `/pendant-lights/marble` | marble pendant light | 22 |
| `/wall-lights/gold` | gold wall light | 141 |
| `/wall-lights/glass` | glass wall light | 102 |
| `/wall-lights/black` | black wall light | 59 |
| `/wall-lights/marble` | marble wall light | 24 |

Also shipped, without new URLs: the **jhoomar** entity, previously absent from every
page on the site while White Teak (`"Chandeliers (Jhoomar) Online In India"`), Lights
& Living (`"Jhoomar Lights India"`) and Jainsons (`"Small Jhoomar for Hall"`) all
carry it in the title tag. Now in `/chandelier-lights` title, description, body copy
and a dedicated FAQ, plus the site-wide meta description.

**Facets deliberately NOT shipped.** `crystal` is the highest-volume term in Indian
decorative lighting and the catalogue holds four crystal products. `metal` covers 632
products and is a term nobody shops by. Ceiling lights (47), floor lamps (25) and
table lamps (14) are too small for any attribute slice to fill a grid. These are
merchandising and catalogue-depth gaps, not URL gaps — a four-product page claiming
to be a crystal chandelier range would be the worse mistake.

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
