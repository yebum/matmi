# MATMI

Responsive Expo Router web MVP for recognizing five selected dishes from a live menu camera: **Tteokbokki, Phở, Pad Thai, Nasi Goreng, and Lángos**. The existing photo OCR flow remains available as a fallback.

The welcome screen uses the latest supplied MATMI logo at `public/brand/matmi-logo.webp`. `MatmiLogo` preserves its aspect ratio and falls back to MATMI text if the image cannot load. The existing browser storage key keeps prior local profiles after the rename.

## Run and validate

```sh
npm ci
npm run web
npm run typecheck
npm run test:logic
npm run export:web
npm run preview:web
```

Open the local URL shown by Expo. On Home, **Scan a menu** opens the in-app live camera scanner. It requests the rear camera through `getUserMedia`, samples the central guide region at most once per completed OCR job, and places one active 3D model above confirmed menu text. Tapping the active model or label opens Food Lens. Camera tracks and the live OCR worker stop when the scanner loses focus. If camera access fails, **Upload menu photo** and **Take a photo instead** use the existing file picker path. Photo selection shows a preview and **Analyze image** continues through the existing four-language still-image OCR and results screens. Image selection is limited to valid, loadable images under 15 MB.

## OCR and recognition

`src/services/ocr/ocrService.ts` defines the OCR interface and a Tesseract.js browser adapter. It runs OCR on the user's device, using English, Vietnamese, Korean, and Thai language data. The library downloads its worker, WebAssembly core, and language data over HTTPS on first use, so first scans can take longer and scanning requires a network connection unless those assets are later self-hosted. OCR failure or timeout shows a retryable error; no sample text is substituted.

The live scanner uses a separate persistent English Tesseract worker with sparse-text page segmentation and block output. `src/features/liveScanner.ts` maps OCR boxes from a bounded canvas ROI through the video `object-fit: cover` crop into the visible viewport. Supported foods are confirmed at high confidence or after two scans, held for 1.6 seconds after a temporary miss, and only one confirmed food model is mounted at a time. The normal still-photo OCR worker remains unchanged. Add `?ocrDebug=1` to the scanner URL in a development build to see timing, raw text, confidence, detections, boxes, and worker state; this panel is disabled in production.

`src/features/prepareMenuImage.ts` leaves ordinary images untouched. Photos over 3200 pixels on their longest side or 9 megapixels are drawn to a canvas at no more than those limits and encoded as high-quality JPEG before OCR. A browser canvas failure falls back to the original image. This cap reduced a 6000×4000 test menu to 3200×2133 while still detecting Lángos; real phone photos need further testing.

`src/features/recognition.ts` normalizes case, Latin accents, punctuation, and whitespace while keeping Korean and Thai text. It matches complete aliases on OCR lines, deduplicates dishes, and never creates cards for unsupported names. `src/data/supportedFoods.ts` is the only active five-food catalog. Typical ingredient and caution descriptions are general references; restaurant recipes must be confirmed with the restaurant.

`src/features/tasteMatch.ts` calculates deterministic scores: base 56, +8 for each preferred ingredient/taste/texture/trait match, −28 for each matching avoid signal, clamped to 0–100. The result includes reasons and warnings. Profile edits change scores immediately. `src/store/ProfileContext.tsx` persists the taste profile, onboarding completion, saved dishes, tried food IDs, and successful review IDs through AsyncStorage on web (browser local storage). Photos, OCR text, and scan results stay in memory only and disappear on refresh.

## Test fixtures

`tests/fixtures/` contains generated PNG menus for cases A–D, an all-five development menu, and a large-image sizing fixture. Regenerate on Windows with `Get-Content -Raw scripts/generate-fixtures.ps1 | Invoke-Expression`. `npm run test:logic` checks recognition, deterministic scoring, image size limits, model paths, live detection stability, cover-crop coordinate mapping, and Community Lens validation/aggregation. `node scripts/benchmark-live-ocr.cjs` runs both workers on the five menu fixtures and asserts exact supported-food detections with OCR word boxes. Local English sparse-text OCR averaged 130 ms per fixture versus 207 ms for the four-language worker in one run; real camera latency and OCR quality need device testing.

## Community Lens

Food Lens now shows anonymous experiences for the selected dish and the profile's culture. The review form accepts a short cultural comparison and description plus three 0–10 ratings. At least one meaningful text response is required; no account, name, or contact information is requested. The browser does not store community reviews locally. After a successful submission, returning to Food Lens reloads the community data. A failed submission keeps the form values for retry.

My MATMI stores the returned IDs of successful submissions on this browser/device. Its Reviews tab fetches only those IDs, and a successful review also marks the dish tried. Older anonymous reviews cannot be attributed to this device; no cross-device sync is available without accounts. Saved and Tried remain independent.

In the existing MATMI Supabase project, open **SQL Editor**, paste the full contents of `supabase/migrations/20261001000000_community_lens.sql`, and run it once. Copy `.env.example` to ignored `.env.local` and set the project's public URL and anonymous/publishable key. The client uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. In **Vercel → MATMI project → Settings → Environment Variables**, set those same two public values for Production, then redeploy the existing project. The web export clears Metro's cache so newly set values are included in the bundle. Never use a service-role/secret key in a public environment variable. The table enables RLS, grants anonymous SELECT and INSERT on review input columns only, restricts reviews to the five dishes/cultures and valid scores/text, and does not grant anonymous UPDATE or DELETE. The database generates review IDs and timestamps. Anonymous posting can still attract spam; a public launch would need additional server-side rate limiting/moderation.

`supabase/seed.sql` is optional **invented demo data**, currently five Korean Lángos examples. Apply it manually only in a demo project. The UI labels demo examples explicitly. Once a real review exists for a dish/culture, real reviews alone are used for the displayed count, averages, and quotes. Missing configuration or backend errors show an unavailable state without affecting Food Lens. Browser-only checks are not proof that Supabase or Vercel production credentials are configured; verify a real anonymous INSERT and SELECT against the deployed project before claiming end-to-end production readiness.

## Deployment

The project exports a single-page app to `dist`. `vercel.json` sets the build command, output directory, deep-link rewrite, and model MIME headers. Expo copies files from `public/` into `dist/`. Import a committed repository into Vercel, or from a linked Vercel project run `npx vercel --prod`. Community Lens requires the two public Supabase environment variables above; the original scanner and Food Lens still run if they are absent. Serve over HTTPS for mobile camera capture and WebXR. The site has no localhost dependency after export; OCR currently depends on the public Tesseract.js CDNs. A local static preview verified direct route refresh at `/food/langos`, browser storage, image upload, OCR, and missing-model behavior; the Community Lens route and backend need deployment validation.

Use the Hexagon Vercel team and `matmi` as the project name when importing <https://github.com/yebum/matmi> at <https://vercel.com/new?teamSlug=hexagon>. The web export adds MATMI description and social title tags to `dist/index.html` after Expo's single-page export.

## 3D and AR assets

Place real food assets at `public/models/<food-id>.glb` and, for iOS AR, `public/models/<food-id>.usdz`. The five IDs are `tteokbokki`, `pho`, `pad-thai`, `nasi-goreng`, and `langos`. `SupportedFood.model3d` and `model3dIOS` can override these paths. After adding files, rebuild and redeploy. The detail page reads the first bytes of each candidate to distinguish real GLB/USDZ files from the SPA's HTML fallback for missing paths. Only then does it load the separate `<model-viewer>` bundle. The viewer supports drag rotation, zoom, loading/error states, and a device-gated AR button. Android uses WebXR or Scene Viewer; iOS Quick Look is offered only when a USDZ asset exists. Unsupported devices retain 3D and show an AR fallback message.

Five real GLB food assets are included at the conventional paths. They were copied from the supplied source files without modification. Lángos is the first intended AR test target. No USDZ assets are included, so iOS Quick Look is not available yet. AR still requires validation on a suitable physical device; native Expo rendering is outside this web MVP, and menu image input is intentionally web-specific.

## Physical mobile release check

On an HTTPS Vercel preview, test iPhone Safari and Android Chrome: tap **Scan a menu**, grant rear-camera access, point at a clear LÁNGOS menu line, wait for its anchored 3D overlay, tap through to Food Lens, and check that the camera stops on navigation. Also test denial and the photo-upload fallback, profile persistence, rotation and zoom on Food Lens, and device-gated AR. No physical phone or production HTTPS validation has occurred yet.
