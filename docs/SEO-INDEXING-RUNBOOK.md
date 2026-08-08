# Indexing runbook — Phases 3 and 4

Phases 1 and 2 (product page copy, sitemap 404s) shipped in code. What follows
needs the GoDaddy and Search Console accounts, so it is written as steps to
execute rather than code to merge.

Measured 2026-08-08. Re-run the verification commands after each change.

---

## Phase 3 — the apex domain

### What is actually there

`litmeup.in` is **not** a broken redirect to the store. It is a separate
**GoDaddy Website Builder site** still published on the apex:

```
$ curl -sSIk https://litmeup.in/
HTTP/1.1 200 OK
Content-Security-Policy: frame-ancestors 'self' godaddy.com *.godaddy.com …
Set-Cookie: dps_site_id=ap-south-1
```

- Title `Litmeup`, 135 words, no canonical tag, tagline "We Light Up your World
  Like No Body Does", copyright footer in Hindi.
- Served behind a GoDaddy certificate that **expired 25 June 2026**
  (`notAfter=Jun 25 09:34:14 2026 GMT`), so every visitor gets a browser
  security interstitial before they see it.
- DNS: apex `A` → `13.248.243.5`, `76.223.105.230` (GoDaddy's forwarding/builder
  anycast). Nameservers are `ns19/ns20.domaincontrol.com`.

Meanwhile `www.litmeup.in` is a `CNAME` to
`eqmpgafg6h.us-east-1.awsapprunner.com` with a healthy Amazon certificate valid
to 13 December 2026.

So the brand has two different websites on two hostnames, and the one on the
bare domain is a thin placeholder behind a certificate error.

### Fix

**Step 1 — take down the builder site.** GoDaddy → *My Products* → *Websites +
Marketing* → the `Litmeup` site → *Settings* → **Unpublish**. Nothing links to
it; there is no content worth migrating.

**Step 2 — forward the apex to www.** GoDaddy → *Domains* → `litmeup.in` →
*Domain Settings* → *Forwarding* → *Add forwarding*:

| Field | Value |
| --- | --- |
| Forward to | `https://www.litmeup.in` |
| Forward type | **Permanent (301)** |
| Settings | **Forward only** — masking OFF |

Masking must be off. It serves the destination inside a frame under the apex
URL, which would recreate the duplicate-site problem it is meant to solve.

**Step 3 — verify.** All three must pass:

```bash
# apex resolves with a valid certificate (no -k flag)
curl -sSI https://litmeup.in/ | head -3          # expect 301, no TLS error
# ...and lands on www
curl -sSIL https://litmeup.in/ | grep -i '^location'
# www itself is untouched
curl -sSI https://www.litmeup.in/ | head -1      # expect 200
```

Certificate provisioning after enabling forwarding takes GoDaddy up to ~1 hour.

### The durable version, when there is time

GoDaddy-managed forwarding certificates are exactly what lapsed here. The
version that cannot expire quietly:

1. Move DNS hosting for `litmeup.in` to **Route 53**.
2. Associate the apex as a custom domain on the App Runner service — it issues
   an ACM certificate that **auto-renews**.
3. Point the apex at it with a Route 53 **ALIAS A** record. (GoDaddy DNS cannot
   do this; it has no `ALIAS`/`ANAME` type, which is why forwarding is the only
   option while DNS stays there.)

The app already redirects `litmeup.in` → `www.litmeup.in` in `next.config.ts`,
so the moment the apex reaches App Runner the redirect is handled in-app and the
GoDaddy forwarding rule can be deleted.

### Also fixed in code, ships on next deploy

App Runner leaves its generated domain publicly reachable next to the custom
one, so `https://eqmpgafg6h.us-east-1.awsapprunner.com` served **the entire
catalogue** — 1,000+ crawlable duplicate URLs with `Allow: /` in its robots.txt.
The canonical tags pointed at www, which limited the damage, but
`next.config.ts` now 301s that host to `www.litmeup.in`. Confirm after deploy:

```bash
curl -sSI https://eqmpgafg6h.us-east-1.awsapprunner.com/collections/1011 | head -3
# expect: 308 -> https://www.litmeup.in/collections/1011
```

---

## Phase 4 — Search Console

### 1. Add a Domain property

The existing verification is file-based (`/google3e97f565f89efc73.html`, still
serving 200), which only covers the `https://www.litmeup.in/` URL prefix. A
**Domain property** covers the apex, www and every subdomain in one place —
which is what you want while diagnosing a two-hostname problem.

Search Console → *Add property* → **Domain** → `litmeup.in` → add the supplied
`TXT` record at GoDaddy DNS. Keep the existing URL-prefix property; the
historical data lives there.

### 2. Resubmit the sitemap

*Indexing* → *Sitemaps* → submit `sitemap.xml`. It currently validates clean:

- 1,080 URLs, valid XML, every `<url>` has a `<loc>`
- 0 URLs on a non-canonical host
- 0 duplicate URLs
- 85-URL sample against the fixed build: **85 × 200, no 404s**

Do this **after** the Phase 1–2 deploy, so the first recrawl sees the new titles
rather than the old SKU ones.

### 3. Request indexing, in priority order

*URL Inspection* → paste URL → *Request Indexing*. The quota is roughly 10–12
URLs per day per property, so this is a six-day job, not one sitting. Do the
pages that already have real copy — never spend quota on product pages, which
have to earn their crawl through the sitemap and internal links.

**Day 1 — highest commercial intent**

```
https://www.litmeup.in/
https://www.litmeup.in/chandelier-lights
https://www.litmeup.in/pendant-lights
https://www.litmeup.in/ceiling-lights
https://www.litmeup.in/wall-lights
https://www.litmeup.in/table-lamps
https://www.litmeup.in/floor-lamps
https://www.litmeup.in/collections
https://www.litmeup.in/guides
https://www.litmeup.in/rooms
```

**Day 2 — guides and rooms** (informational queries, these rank fastest)

```
/guides/what-size-chandelier
/guides/how-high-to-hang-a-dining-light
/guides/how-many-pendants-over-a-kitchen-island
/guides/how-to-light-a-living-room
/guides/bedroom-lighting-ideas
/guides/warm-or-cool-light
/rooms/living-room
/rooms/dining-room
/rooms/bedroom
/rooms/kitchen
```

**Day 3 — local and store**

```
/rooms/home-office
/lighting/mumbai
/lighting/delhi
/lighting/bangalore
/lighting/hyderabad
/lighting/chennai
/lighting/pune
/lighting/ahmedabad
/lighting/kolkata
/surat-store
```

**Days 4–6 — sub-tier category pages** (25 URLs: the `under-N` price bands and
room pairings under each category, e.g. `/pendant-lights/kitchen`,
`/chandelier-lights/under-50000`). Full list: every non-product entry in
`sitemap.xml`.

Then stop. Products index through the sitemap and the category pages linking to
them; there is no version of this where you hand-submit 1,017 URLs.

### 4. What to watch, and when to expect it

*Indexing* → *Pages*, weekly. The report groups by reason — the number that
matters is how many URLs move **out of** "Crawled – currently not indexed".

| Timeframe | Expected |
| --- | --- |
| 3–7 days | Category, guide and room pages indexed |
| 2–4 weeks | Products begin moving out of "Crawled – currently not indexed" |
| 4–8 weeks | The bulk of viable products indexed |

Realistic ceiling is 60–75% of products. The 359 out-of-stock SKUs with no
editorial copy will stay marginal until they get stock or hand-written
descriptions — generated attribute copy makes a page indexable, not compelling.

**If products are still not indexed at week 6**, the next lever is content depth,
not configuration: hand-write descriptions for the top ~50 sellers and check
whether those specifically get picked up. That isolates "thin content" from
"crawl budget" as the cause.
