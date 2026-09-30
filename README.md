# AI Food Lens

Responsive Expo Router web MVP for reading a menu photo and explaining five selected dishes: **Tteokbokki, Phở, Pad Thai, Nasi Goreng, and Lángos**. The original mobile screen layout and vector artwork remain in place.

## Run and validate

```sh
npm ci
npm run web
npm run typecheck
npm run test:logic
npm run export:web
npm run preview:web
```

Open the local URL shown by Expo. On Home, **Scan a menu** opens the browser's camera-oriented image picker (`accept="image/*" capture="environment"`); **Upload a photo instead** opens the normal image picker. The scanner shows a preview, lets the user retake or replace it, and starts OCR only after **Analyze image**. Image selection is limited to valid, loadable images under 15 MB. Cancelling the picker leaves the current screen intact.

## OCR and recognition

`src/services/ocr/ocrService.ts` defines the OCR interface and a Tesseract.js browser adapter. It runs OCR on the user's device, using English, Vietnamese, Korean, and Thai language data. The library downloads its worker, WebAssembly core, and language data over HTTPS on first use, so first scans can take longer and scanning requires a network connection unless those assets are later self-hosted. OCR failure or timeout shows a retryable error; no sample text is substituted.

`src/features/prepareMenuImage.ts` leaves ordinary images untouched. Photos over 3200 pixels on their longest side or 9 megapixels are drawn to a canvas at no more than those limits and encoded as high-quality JPEG before OCR. A browser canvas failure falls back to the original image. This cap reduced a 6000×4000 test menu to 3200×2133 while still detecting Lángos; real phone photos need further testing.

`src/features/recognition.ts` normalizes case, Latin accents, punctuation, and whitespace while keeping Korean and Thai text. It matches complete aliases on OCR lines, deduplicates dishes, and never creates cards for unsupported names. `src/data/supportedFoods.ts` is the only active five-food catalog. Typical ingredient and caution descriptions are general references; restaurant recipes must be confirmed with the restaurant.

`src/features/tasteMatch.ts` calculates deterministic scores: base 56, +8 for each preferred ingredient/taste/texture/trait match, −28 for each matching avoid signal, clamped to 0–100. The result includes reasons and warnings. Profile edits change scores immediately. `src/store/ProfileContext.tsx` persists the taste profile, onboarding completion, and saved dishes through AsyncStorage on web (browser local storage). Photos, OCR text, and scan results stay in memory only and disappear on refresh.

## Test fixtures

`tests/fixtures/` contains generated PNG menus for cases A–D, an all-five development menu, and a large-image sizing fixture. Regenerate on Windows with `Get-Content -Raw scripts/generate-fixtures.ps1 | Invoke-Expression`. `npm run test:logic` checks recognition, deterministic scoring, image size limits, and model-asset checks. Image OCR was manually exercised in the browser with A–D, all five dishes, and the resized large image. OCR quality on real, angled, handwritten, or low-light menus is not guaranteed.

## Deployment

The project exports a single-page app to `dist`. `vercel.json` sets the build command, output directory, deep-link rewrite, and model MIME headers. Expo copies files from `public/` into `dist/`. Import a committed repository into Vercel, or from a linked Vercel project run `npx vercel --prod`. No environment variables or API keys are required. Serve over HTTPS for mobile camera capture and WebXR. The site has no localhost dependency after export; OCR currently depends on the public Tesseract.js CDNs. A local static preview verified direct route refresh at `/food/langos`, browser storage, image upload, OCR, and missing-model behavior; actual Vercel HTTPS deployment remains untested.

## 3D and AR assets

Place real food assets at `public/models/<food-id>.glb` and, for iOS AR, `public/models/<food-id>.usdz`. The five IDs are `tteokbokki`, `pho`, `pad-thai`, `nasi-goreng`, and `langos`. `SupportedFood.model3d` and `model3dIOS` can override these paths. After adding files, rebuild and redeploy. The detail page reads the first bytes of each candidate to distinguish real GLB/USDZ files from the SPA's HTML fallback for missing paths. Only then does it load the separate `<model-viewer>` bundle. The viewer supports drag rotation, zoom, loading/error states, and a device-gated AR button. Android uses WebXR or Scene Viewer; iOS Quick Look is offered only when a USDZ asset exists. Unsupported devices retain 3D and show an AR fallback message.

Five real GLB food assets are included at the conventional paths. They were copied from the supplied source files without modification. Lángos is the first intended AR test target. No USDZ assets are included, so iOS Quick Look is not available yet. AR still requires validation on a suitable physical device; native Expo rendering is outside this web MVP, and menu image input is intentionally web-specific.

## Physical mobile release check

On an HTTPS Vercel preview, test iPhone Safari and Android Chrome: tap **Scan a menu** to confirm the camera opens, take a real menu photo, replace it from the library, inspect the preview, finish OCR, refresh to confirm profile persistence, and retry after a deliberately interrupted network request. After food models are added, verify rotation/zoom and AR on supported devices, plus the 3D fallback on an unsupported device.
