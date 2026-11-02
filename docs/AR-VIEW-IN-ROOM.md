# "View in your room" (camera AR) on the product page

Status: **implemented 2026-11-02, awaiting the real-device checklist (§9.5).** `npm run check` and `npm run build` pass; desktop and fallback states were checked in a headless browser.

## 0. Decisions

| Decision | Choice | Why |
|---|---|---|
| v1 technique | Live rear camera (`getUserMedia`) with the 2D arImage cutout on top; drag, pinch and twist | It is the only option that works on iPhones and handles ceiling lights. iOS Safari has no WebXR AR, and model-viewer, Scene Viewer and Quick Look place objects only on the floor or a wall. |
| Desktop / no camera | Open the existing `RoomVisualizerModal`; no QR code | No new code and no new dependency. A QR code can follow in v1.1. |
| Capture and share | In v1: photo preview, then Share (system share sheet) or Save | Buying decisions are often shared on WhatsApp with family. Pepperfry and Lightology both lead with sharing. |
| Image re-processing | None on the backend. Images load through `/_next/image` (same-origin, 1080px WebP with transparency); padding is trimmed in the browser | The cutouts are already clean (§10). The only problems are file size, CORS and padding. |
| Analytics | `track()` pushes to `window.dataLayer` | No analytics tool is installed yet; GTM or GA4 will read entries queued before they load. |

## 1. Scope

**In:**
- Camera view on touch devices.
- Uses the selected variation's arImage, falling back to the product's.
- Starting size and position from the category and `productHeight`.
- Gestures, buttons and keyboard arrows.
- Photo capture with share/save.
- Every failure path ends in the room visualizer.
- Analytics events and unit tests.

**Out (v2 or later):**
- WebXR or true scale.
- GLB/USDZ through `<model-viewer ar-placement="wall">`, for wall lights first.
- Desktop QR code.
- Ceiling/wall toggle (dragging covers it).
- Per-variation sizes (all variations use the product's height).
- Lit/unlit toggle.
- Backend padding trim.
- Using `arController.js`: it reads `product.dimensions`, which is empty on all 740 products, so its `scale` is always 1.

## 2. User flow

```
PDP "View in Room" button  (hidden when neither the picked variation nor the product has an arImage)
  ├─ desktop / no camera API ──────────────► RoomVisualizerModal (now fed the variation's arImage)
  └─ touch device + mediaDevices ─► ArViewer (full-screen <dialog>, loaded only on tap)
        1. Intro: cutout preview, "See it in your room", "Nothing is recorded or uploaded"
              [Open camera]   [Use a sample room instead → visualizer]
        2. Opening camera… (the browser's permission prompt appears here)
        3a. Ready: live camera + light + coaching ("Point your phone at the ceiling" /
            "Face the wall" / "Point at the floor" · "Drag · Pinch · Twist")
            Toolbar: [−] [+]   (◉ shutter)   [↺ reset]      Label: "Height ≈ 185 cm · approximate"
            ◉ → photo preview: [Retake] [Save] [Share (if supported)]
        3b. Denied / unavailable / error / paused / image failed → explanation screen
            (§6) with [Try again]/[Resume] and [Use a sample room]
```

The coaching text disappears after the first gesture and comes back after reset. Nothing animates, so reduced motion needs nothing extra.

## 3. Files

### New

| File | Status | What it does |
|---|---|---|
| `lib/ar/gestures.ts` | done | Placement, starting size, drag/pinch/twist maths, clamping (§4) |
| `lib/ar/helpers.ts` | done | Height parsing, image URL, alpha trim, cover crop, in-app detection (§4) |
| `lib/ar/gestures.test.mjs`, `lib/ar/helpers.test.mjs` | done, 21/21 passing | `node --test` cases for every helper |
| `lib/analytics.ts` | done | `track(event, params)` pushes to `window.dataLayer` and does nothing on the server |
| `components/product/ar/useCameraStream.ts` | done | `{state, start, stop}`: the camera lifecycle (§5) |
| `components/product/ar/useGestures.ts` | done | `{pose, setPose, handlers}`: Pointer Events for drag, pinch and twist on the stage |
| `components/product/ar/ArViewer.tsx` | done | The dialog, the screens, the overlay and capture (§5–7) |

### Edited

| File | Change |
|---|---|
| `lib/api/types.ts` | Add `arImages?: string \| null` to `ApiVariation`; remove arImages from the "returned but unused" comment |
| `lib/types.ts` | Add `ProductVariation.arImage?: string` and `Product.heightMm?: number` |
| `lib/variations.ts` | `mapVariation` sets `arImage: v.arImages \|\| undefined` |
| `lib/api/server.ts` | `mapApiProduct` sets `heightMm: parseHeightMm(productHeight)` |
| `components/product/ProductInfo.tsx` | `arImage = selectedVariation?.arImage ?? product.arImage`; button hidden without it; chooses camera or visualizer; loads `ArViewer` with `next/dynamic` (`ssr:false`); visualizer `full: arImage` instead of falling back to `images[0]` (not a cutout); events `ar_open` and `ar_fallback_visualizer` |
| `package.json` | Append `lib/ar/gestures.test.mjs lib/ar/helpers.test.mjs` to the `node --test` list in `check` |
| `next.config.ts` | Comment only: any future `Permissions-Policy` must allow `camera=(self)` |

`ProductHero`, `RoomVisualizerModal` and the backend are untouched.

## 4. Logic in `lib/ar/gestures.ts` and `lib/ar/helpers.ts`

| Function | Rule |
|---|---|
| `placementFor(category)` | `/wall/` → wall; `/floor\|table/` → floor; everything else → ceiling (Chandelier, Pendant, Ceiling) |
| `arImageSrc(url)` | `/_next/image?url=<encoded>&w=1080&q=75`. 1080 is a default size `next/image` accepts, and `**.amazonaws.com` is already allowed in the config. |
| `parseHeightMm(raw)` | Trusts only an explicit `H`/`Height` label or a bare number (mm). `"D600 H300"` → 300; `"L9xH9"`, `"9H-9"` → undefined. Units are always mm in the data. |
| `heightFraction(mm)` | `mm / ASSUMED_FRAME_HEIGHT_MM (2800)`, clamped to 0.15–0.6 of the stage height; 0.35 if the height is unknown. **2800 is a guess at how much wall the camera frame covers; tune it on real phones.** |
| `startPose(placement, h)` | Centered horizontally. Ceiling: top edge at 6% from the top. Wall: center at 40%. Floor: bottom edge at 90%. |
| `gesturePose(start, from, to, W, H)` | 1 pointer moves it; 2 pointers move by the midpoint, scale by the distance ratio (0.3–4×) and rotate by the angle change. Always computed from where the gesture started. Position is clamped to the stage. |
| `alphaBounds(rgba, w, h)` | Bounding box of pixels with alpha ≥ 16, used to trim padding. |
| `coverCrop(vw, vh, W, H)` | The part of the camera image visible on screen (`object-fit: cover`) and the screen-to-camera pixel factor `k`, used for capture. |
| `inAppBrowser(ua)`, `isAndroid(ua)`, `chromeIntentUrl(href)` | Detect Instagram/Facebook in-app browsers; build an Android `intent:` link to Chrome that falls back to the same URL. |

## 5. Camera lifecycle (`useCameraStream`)

- `getUserMedia({audio:false, video:{facingMode:{ideal:'environment'}, width:{ideal:1920}, height:{ideal:1080}}})`, called **only from the "Open camera" tap**.
  - `ideal`, never `exact`: `exact` throws on laptops and some iPhones.
  - Without a size hint, Chrome on Android defaults to 640×480.
- The `<video>` is `playsInline muted autoPlay`, then `await video.play()`. Without `playsInline`, iOS shows a black box.
- **States:** `idle → starting → ready`.
  - `NotAllowedError`/`SecurityError` → `denied`
  - `NotFoundError`/`OverconstrainedError`, or no `mediaDevices` → `unavailable`
  - `NotReadableError` (camera busy in another app), `AbortError` and anything else → `error`, which offers Try again
  - `play()` failing → `error`
  - track `ended` (another app took the camera) or page hidden → `paused`
- **Tracks are stopped on:** capture (restarted by Retake), unmount, `visibilitychange→hidden`, `pagehide`, starting again, and when the dialog closes while the permission prompt is still open (the stream that arrives late is stopped immediately).

## 6. Error and fallback screens

| Situation | Message | Actions |
|---|---|---|
| denied (iOS Safari) | "Camera access is blocked. Tap **aA** → Website Settings → Camera → Allow." | Try again · Sample room |
| denied (Android Chrome) | "Tap the icon left of the address bar → Permissions → Camera → Allow." | Try again · Sample room |
| any failure inside Instagram/Facebook, Android | "This app's browser can't open the camera." | **Open in Chrome** (intent link) · Sample room |
| any failure inside Instagram/Facebook, iOS | "Tap ⋯ and choose **Open in browser**, then try again." | Try again · Sample room |
| unavailable | "We couldn't find a camera on this device." | Sample room |
| error | "Couldn't start the camera." | Try again · Sample room |
| paused | "Camera paused." | Resume camera |
| arImage failed to load | "We couldn't load this light's image." | Sample room |

"Sample room" closes the viewer and opens `RoomVisualizerModal` with the same arImage.

## 7. Overlay and capture (`ArViewer`)

**Loading the art:**
1. Load `arImageSrc(src)` into an `Image`.
2. Draw it on a scratch canvas and run `alphaBounds` on its pixels.
3. Keep `{img, box}`. The trimmed region is drawn into the visible overlay `<canvas>`.

**Placing the overlay** (pure CSS, so it survives rotation without re-measuring):
- `left: x%`, `top: y%`
- `height: heightFraction%`, `aspect-ratio: box.w / box.h`
- `transform: translate(-50%,-50%) rotate(rot rad) scale(s)`
- `pointer-events: none`

The stage underneath (`touch-action: none`) takes the gestures, so the light can be moved by touching anywhere. That matters when the light is small.

**Keyboard and controls:**
- The stage is focusable (`role="group"`, labelled); arrow keys move it 2%.
- Buttons: −/+ (×0.87 / ×1.15), reset, shutter, close. All have `aria-label`s and are at least 44px.
- Escape closes the dialog (native `cancel` event).

**Capture:**
1. `coverCrop(videoW, videoH, stageW, stageH)` gives the visible part of the camera image.
2. A new canvas the size of that crop gets the video frame drawn into it.
3. Then `translate(x·W·k, y·H·k)`, `rotate(rot)`, `scale(s·k)`, and the trimmed light is drawn centered.
4. `toBlob('image/jpeg', 0.9)` → `File("<slug>-in-my-room.jpg")` → preview screen.

**Sharing:**
- **Share is a second tap on the preview, not the shutter tap.** iOS Safari rejects `navigator.share` once async work has used up the tap's permission.
- Share uses `navigator.share({files, title, text: name + page URL})` only when `canShare({files})` is true.
- Save is an `<a download>` on the blob URL.
- The blob URL is released when retaking or closing.

**Dialog:** full-screen black, safe-area padding at top and bottom, page scrolling locked while open (same approach as `RoomVisualizerModal`).

## 8. Analytics events (`window.dataLayer`)

| Event | Params | Fired when |
|---|---|---|
| `ar_open` | `product_id`, `mode: camera\|visualizer` | Button tapped |
| `ar_permission` | `product_id`, `result: granted\|denied\|unavailable\|error`, `in_app: instagram\|facebook\|none` | Camera reaches an outcome |
| `ar_first_gesture` | `product_id` | First move, pinch or twist |
| `ar_capture` | `product_id` | Shutter |
| `ar_share` | `product_id`, `result: shared\|cancelled\|failed\|downloaded` | Share or Save |
| `ar_fallback_visualizer` | `product_id`, `reason: declined\|denied\|unavailable\|error\|image` | Sample room chosen |
| `ar_close` | `product_id`, `seconds` | Viewer closed |

## 9. Verification

1. **`npm run check`.** `lib/ar/*.test.mjs` cover placement, URL encoding, the real `productHeight` formats, starting size and position, drag/pinch/twist maths, clamping, alpha trim, the cover-crop maths, in-app detection and the intent URL.
2. **`npm run build`**, plus type-checking.
3. **Desktop browser** (gstack `/browse`): the button opens the visualizer; a product without an arImage shows no button; a variation's arImage is used after picking a finish.
4. **Mobile emulation in Chromium with a fake camera** (`--use-fake-device-for-media-stream`), if Playwright is available: intro → camera → move it → capture → preview; and the denied path.
5. **Real-device checklist (before release).** It needs HTTPS: a preview deploy or tunnel, because a LAN IP over http has no `navigator.mediaDevices`.
   - [ ] iPhone Safari and iPhone Chrome: allow; deny; deny then re-enable; the rear camera is used
   - [ ] Android Chrome (Pixel or Samsung) and a mid-range Redmi; Samsung Internet
   - [ ] Instagram and Facebook in-app browsers on both platforms (Android shows "Open in Chrome"); a link opened from WhatsApp
   - [ ] Lock the screen mid-session → "Camera paused" → Resume works
   - [ ] Closing the viewer turns the iOS green camera dot off; navigating away does too
   - [ ] Rotating the phone keeps the light in place and in proportion
   - [ ] The starting size looks plausible for a 30 cm wall light and a 1.8 m chandelier (tune `ASSUMED_FRAME_HEIGHT_MM`)
   - [ ] Gestures are smooth, with no page zoom or scroll leaking through
   - [ ] The captured photo matches the screen (position, size, rotation)
   - [ ] Share to WhatsApp works, cancelling does nothing, Save downloads
   - [ ] Image load on throttled 3G: the light appears within a few seconds
   - [ ] VoiceOver and TalkBack read every control
   - [ ] Desktop opens the visualizer

## 10. Research findings (2026-11-02)

**Assets (live API):**
- 709 of 740 products have `arImages`; all are PNG. All 31 sampled are clean transparent cutouts, with no halos against a dark background.
- They are mostly 2508×2508, median 1.1 MB, max 4.5 MB.
- The product fills only 5–74% of the canvas.
- Variation arImages: 74 of 90 sampled have one, each different from the parent's. A variation lacks one exactly when its parent does.
- **S3 sends no `Access-Control-Allow-Origin`.** That is why everything goes through `/_next/image` (2.1 MB → 114 KB).
- **Sizing data:** `dimensions` is empty on every product; `productHeight` is set on 548 (median 330 mm, p90 900 mm). `productWidth` is set on 357 and `diameter` on 155.

**Platforms:**
- iOS Safari: no WebXR `immersive-ar` (threejsresources.com/webxr/browsers, 2026).
- Chrome Android: hit-test and anchors are shipped; plane detection is a developer trial (developers.google.com/ar/develop/webxr/arcore-comparison).
- model-viewer `ar-placement` accepts only `floor` or `wall`, and Quick Look has ignored `wall` (google/model-viewer#3989).
- Permission prompts: 12% allow when shown on page load versus 30% after a user action (web.dev/articles/permissions-best-practices).

**In-app browsers:**
- iOS web views have supported `getUserMedia` since iOS 14.3 (webkit.org/blog/11353).
- 8th Wall lists Instagram, Facebook, Messenger and TikTok on Android as needing a link-out to a real browser (8thwall.com/docs/getting-started/requirements).
- Ordinary WhatsApp chat links open in the default browser.

**Competitors:**
- IKEA, Amazon and Pepperfry are app-only with 3D models; Urban Ladder has had no AR since 2014.
- Houzz View in My Room 3D is the only one found with ceiling placement: choose wall or ceiling, then point the phone at it.
- Wayfair's first View in Room (2016) was a 2D cutout over the camera view.
- Lightology: swipe, pinch, then screenshot and share.

**Effect on sales:** Journal of Marketing (2022) found AR's effect is small overall but stronger for pricier products, less-known brands and first-time buyers in a category.

## 11. Order of work

1. Data plumbing: types, variation mapping, `heightMm`, test hook-up. *(Low)*
2. Helpers and hooks. *(Drafted)*
3. `ArViewer`: dialog, intro, camera screens, overlay, gestures, toolbar. *(Medium)*
4. Capture, preview, share and save. *(Medium)*
5. `ProductInfo` wiring and analytics. *(Low)*
6. Verification steps 1–4, then a code review pass. *(Low)*

## 12. Risks

| Level | Risk | Mitigation |
|---|---|---|
| High | Android Instagram/Facebook in-app browsers can't open the camera | Chrome intent link; the visualizer is always available |
| Medium | The starting size is a guess (2800 mm frame) | "approximate" label; pinch to correct; tune on device |
| Medium | The captured photo could be misaligned with the screen | `coverCrop` is unit-tested; device check |
| Medium | iOS back-swipe or page zoom fights the gestures | `touch-action: none` on the stage only; device check |
| Low | A future `Permissions-Policy: camera=()` header would silently break this | It must be `camera=(self)`; comment in `next.config.ts` |
| Low | Memory on low-end phones | One 1080px image and one video; capture is a one-off canvas |

## 13. v2 path

1. **Wall lights in true scale:** generate a flat GLB plane textured with the cutout and show it with `<model-viewer ar-placement="wall" ar-modes="scene-viewer quick-look">`. Wall lights are almost flat, so this looks right with no 3D modelling. Check on a device that Quick Look respects wall placement.
2. **Chandeliers and pendants:** commission real GLB models for the top sellers. Until then, keep the camera overlay.
3. **Desktop QR code**, if analytics shows meaningful desktop traffic opening the visualizer.
