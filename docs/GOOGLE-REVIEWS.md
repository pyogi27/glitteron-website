# Google Reviews banner

`components/reviews/GoogleReviewsBanner.tsx` (home page and every product page) reads the
store's rating, review count and up to 5 reviews from the Places API (New), server-side.
If either env var is missing, or the API fails or returns no reviews with text, the banner
renders nothing.

## Env vars (server-only, never `NEXT_PUBLIC_`)

| Var | Value |
|---|---|
| `GOOGLE_PLACES_API_KEY` | API key restricted to **Places API (New)** |
| `GOOGLE_PLACE_ID` | The Business Profile's place ID, e.g. `ChIJ...` |

### App Runner

Add both to the frontend service's `RuntimeEnvironmentVariables` (same `describe-service` →
`jq` → `update-service` flow as the other secrets), then redeploy. Delete `cur.json`/`new.json`
afterwards; they contain live secrets.

## Getting the values

1. Google Cloud Console → select or create a project → enable **billing**.
2. APIs & Services → Library → enable **Places API (New)**.
3. APIs & Services → Credentials → Create credentials → API key. Edit it:
   - API restrictions: **Restrict key** → Places API (New) only.
   - Application restrictions: App Runner has no fixed egress IP, so leave as None unless
     the service gets a NAT with a static IP; then use IP addresses.
4. APIs & Services → Places API (New) → Quotas: cap requests per day, and set a budget alert
   under Billing. `reviews` bills every call at the Enterprise + Atmosphere SKU.
5. Place ID: look the business up in Google's
   [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id),
   or ask the API:

   ```bash
   curl -s -X POST https://places.googleapis.com/v1/places:searchText \
     -H "Content-Type: application/json" \
     -H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
     -H "X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.userRatingCount" \
     -d '{"textQuery": "LitMeUp <city>"}'
   ```

   Pick the result whose address and review count match the Business Profile.

## Policy notes

- Responses are cached for 1 hour (`REVALIDATE_SECONDS` in `lib/api/googleReviews.ts`).
  Google's terms only permit caching place IDs; this is a deliberate trade-off for cost and
  ISR. Switch to `cache: "no-store"` for strict compliance.
- Required on screen: the Google Maps logo, author name/avatar/link, and a link from each
  review to its Google Maps page. The "most relevant reviews with text" line discloses the
  filtering. Never add Google ratings or reviews to JSON-LD.
