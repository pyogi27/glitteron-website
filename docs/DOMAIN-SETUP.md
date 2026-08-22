# Domain setup — `litmeup.in` and `www.litmeup.in`

Referenced from `next.config.ts`. Measured 2026-08-19; re-run the verification
commands after any change.

## The problem

There are two different websites on this brand's two hostnames.

| | `litmeup.in` (apex) | `www.litmeup.in` |
| --- | --- | --- |
| Serves | GoDaddy Website Builder placeholder | the real Next.js store |
| Status | `200 OK` | `200 OK` |
| DNS | `A` → `13.248.243.5`, `76.223.105.230` (GoDaddy anycast) | `CNAME` → `eqmpgafg6h.us-east-1.awsapprunner.com` |
| Certificate | GoDaddy, `CN=litmeup.in` — **expired 25 Jun 2026** | Amazon, valid to 13 Dec 2026 |

So a visitor who types `litmeup.in` gets a browser security interstitial, and if
they click through it, a 135-word placeholder with the tagline "We Light Up your
World Like No Body Does" — not the store.

The app is already ready for the fix. `next.config.ts` lists `litmeup.in` in
`REDIRECTED_HOSTS`, so the moment apex traffic reaches the App Runner service it
gets a `301` to `https://www.litmeup.in`. Nothing in the codebase needs to
change; this is entirely DNS and account work.

## What is on the domain besides the website

Anything that touches DNS must preserve these, or **email breaks**:

```
MX     0  smtp.secureserver.net.
MX    10  mailstore1.secureserver.net.
TXT       "v=spf1 include:secureserver.net -all"
TXT  _dmarc  "v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;"
TXT  _dmarc  "v=DMARC1; p=none;"
```

There are no `AAAA`, `CAA` or other subdomain records. Nameservers are
`ns19`/`ns20.domaincontrol.com` (GoDaddy).

> **Separate bug, worth fixing while you are in there:** there are **two**
> `_dmarc` TXT records. RFC 7489 says a domain publishing more than one is
> treated as having **no** DMARC policy at all, so neither of these is in
> effect. Delete the `p=none` one and keep `p=quarantine`.

---

## Option A — GoDaddy forwarding (do this today, ~20 minutes)

Stops the bleeding without moving anything. Fixes the visitor-facing problem the
same day.

**1. Unpublish the placeholder.** GoDaddy → *My Products* → *Websites +
Marketing* → the `Litmeup` site → *Settings* → **Unpublish**. Nothing links to
it and there is no content worth migrating. This is also what frees the apex
hostname, and it is the site whose certificate expired.

**2. Forward the apex to www.** GoDaddy → *Domains* → `litmeup.in` → *Domain
Settings* → *Forwarding* → *Add forwarding*:

| Field | Value |
| --- | --- |
| Forward to | `https://www.litmeup.in` |
| Forward type | **Permanent (301)** |
| Settings | **Forward only** — masking **OFF** |

Masking must be off. It serves the destination inside a frame under the apex
URL, which recreates the exact duplicate-site problem this is meant to solve.

Certificate provisioning takes GoDaddy up to about an hour.

**The catch.** The forwarding certificate is GoDaddy-managed, which is the same
class of thing that just lapsed. Option A is a stopgap, not a resting place.

---

## Option B — Route 53 + App Runner custom domain (the durable fix)

This is the version that cannot expire quietly: the certificate is issued by ACM
through App Runner and **auto-renews**.

**Why DNS has to move.** App Runner's own documentation is explicit that a root
domain cannot be a `CNAME` and requires a Route 53 **alias** record:

> "DNS has some inherent limitations which might block you from creating CNAME
> records for the root domain name. […] To create a root domain, ensure that you
> add an alias record. An alias record is specific to Route 53."

GoDaddy DNS has no `ALIAS`/`ANAME` record type. So while DNS hosting stays at
GoDaddy, forwarding (Option A) is the *only* way to serve the apex — pointing it
at App Runner is not possible. Moving DNS to Route 53 is the unlock.

**Steps**

1. **Route 53 → Create hosted zone** for `litmeup.in` (public).
2. **Copy every record from the list above into it** before touching
   nameservers — the two `MX`, the SPF `TXT`, and one `_dmarc` `TXT` (the
   `p=quarantine` one). Also recreate `www` for now; step 5 replaces it.
3. **Change the nameservers at GoDaddy** to the four Route 53 NS values.
   *Domains* → `litmeup.in` → *Nameservers* → *Change* → *Enter my own*.
   Propagation is typically under an hour, up to 48 hours.
4. **Wait for propagation** before step 5 — App Runner cannot validate a
   certificate through nameservers that are not yet authoritative:
   ```bash
   dig +short litmeup.in NS       # expect the Route 53 set, not domaincontrol.com
   dig +short litmeup.in MX       # email must still resolve
   ```
5. **App Runner → your service → Custom domains → Link domain.** Choose
   **Amazon Route 53** as the registrar, pick `litmeup.in`, DNS record type
   **alias**. App Runner then writes the certificate-validation and target
   records into the hosted zone for you.
   - The console does **not** offer the "include `www`" checkbox — that option is
     API-only. Since `www` already works, leave it as its own record pointing at
     the App Runner service; there is no need to use the `www` option at all.
   - Never delete the certificate-validation records afterwards. They are what
     makes the auto-renewal work.
6. **Wait for the domain status to reach `Active`** (usually minutes, up to
   24–48 hours).
7. **Delete the GoDaddy forwarding rule** from Option A if you set one up. Once
   apex traffic reaches App Runner, `next.config.ts` issues the `301` in-app.

---

## Verify

All of these must pass, whichever option you took:

```bash
# apex has a valid certificate — note there is no -k flag
curl -sSI https://litmeup.in/ | head -1

# ...and lands on www
curl -sSIL https://litmeup.in/ | grep -i '^location'

# www itself is untouched
curl -sSI https://www.litmeup.in/ | head -1            # expect 200

# the certificate is not about to lapse again
echo | openssl s_client -connect litmeup.in:443 -servername litmeup.in 2>/dev/null \
  | openssl x509 -noout -issuer -dates

# email survived
dig +short litmeup.in MX
dig +short litmeup.in TXT
dig +short _dmarc.litmeup.in TXT                        # expect exactly one record
```

Under Option B the issuer should read `O=Amazon`. Under Option A it will be
GoDaddy — set a calendar reminder two weeks before `notAfter`, because nothing
else will tell you when it lapses.

## Then, in Search Console

1. Add a **Domain property** for `litmeup.in` (covers apex, www and every
   subdomain in one place) via the supplied `TXT` record. Keep the existing
   URL-prefix property — the historical data lives there.
2. Re-submit `sitemap.xml`.
3. Use *URL Inspection* on `https://litmeup.in/` to confirm Google now sees the
   redirect rather than the placeholder.
