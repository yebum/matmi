const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  module._compile(result.outputText, filename);
};
const { normalizeMenuText, detectSupportedFoods } = require('../src/features/recognition.ts');
const { getSupportedFood, supportedFoods } = require('../src/data/supportedFoods.ts');
const { calculateTasteMatch, allergenWarning } = require('../src/features/tasteMatch.ts');
const { foodCultures, cultureFromLanguage, clampSensitivity, toggleAllergen, defaultSensitivities } = require('../src/data/personalization.ts');
const { migrateProfile } = require('../src/features/profileMigration.ts');
const { targetMenuImageSize } = require('../src/features/prepareMenuImage.ts');
const { modelAssetPaths, findAvailableModel } = require('../src/features/modelAssets.ts');
const { frameMapping, scanGuide, canvasBoxToVideo, videoBoxToViewport, detectLiveFoods, LiveDetectionTracker } = require('../src/features/liveScanner.ts');
const { scannerOverlayLayout, smoothOverlayBox } = require('../src/features/scannerOverlayLayout.ts');
const { emptyReviewDraft, validateReview, summarizeCommunity } = require('../src/features/communityLens.ts');
const communitySql = fs.readFileSync(require('node:path').join(__dirname, '../supabase/migrations/20261001000000_community_lens.sql'), 'utf8');
assert.match(communitySql, /alter table public\.food_experience_reviews enable row level security;/i);
assert.match(communitySql, /grant select on table public\.food_experience_reviews to anon;/i);
assert.match(communitySql, /grant insert \(food_id, culture, reminded_of, cultural_description,\s*familiarity_score, liking_score, matmi_accuracy_score\)\s*on table public\.food_experience_reviews to anon;/i);
assert.doesNotMatch(communitySql, /grant (?:select, )?insert on table public\.food_experience_reviews to anon;/i);
assert.match(communitySql, /for select to anon using \(true\)/i);
assert.match(communitySql, /for insert to anon with check \(is_demo = false\)/i);
const ids = text => detectSupportedFoods(text).map(food => food.id);
const reviewDraft = { remindedOf: 'A savory hotteok', culturalDescription: '', familiarityScore: 7, likingScore: 8, matmiAccuracyScore: 9 };
assert.equal(validateReview('langos', 'Korean', reviewDraft), null);
assert.match(validateReview('unknown', 'Korean', reviewDraft), /unavailable/);
assert.match(validateReview('langos', 'Spanish', reviewDraft), /culture/);
assert.match(validateReview('langos', 'Korean', emptyReviewDraft()), /Share a little/);
assert.match(validateReview('langos', 'Korean', { ...reviewDraft, remindedOf: 'asdf' }), /Share a little/);
assert.match(validateReview('langos', 'Korean', { ...reviewDraft, remindedOf: 'x'.repeat(161) }), /shorten/);
assert.match(validateReview('langos', 'Korean', { ...reviewDraft, likingScore: 11 }), /score/);
const example = (id, isDemo, likingScore, culture = 'Korean') => ({ id, foodId: 'langos', culture, remindedOf: `Comparison ${id}`, culturalDescription: '', familiarityScore: 6, likingScore, matmiAccuracyScore: 8, createdAt: `2026-10-01T00:00:0${id}Z`, isDemo });
const demoSummary = summarizeCommunity([example('1', true, 7), example('2', true, 9)], 'langos', 'Korean');
assert.deepEqual([demoSummary.count, demoSummary.demo, demoSummary.liking, demoSummary.quotes.length], [2, true, 8, 2]);
const realSummary = summarizeCommunity([example('1', true, 7), example('2', false, 4), example('3', false, 8), example('4', false, 10, 'Thai')], 'langos', 'Korean');
assert.deepEqual([realSummary.count, realSummary.demo, realSummary.liking], [2, false, 6]);
assert.equal(summarizeCommunity([], 'langos', 'Korean').count, 0);
assert.equal(normalizeMenuText('LÁNGOS'), 'langos');
assert.equal(normalizeMenuText('PHỞ bò'), 'pho bo');
assert.equal(normalizeMenuText('떡볶이 ผัดไทย'), '떡볶이 ผัดไทย');
assert.deepEqual(ids('LÁNGOS 2800 FT\nGULYAS 3900 FT\nHURKA 3500 FT'), ['langos']);
assert.deepEqual(ids('PHỞ BÒ\nPAD THAI'), ['pho', 'pad-thai']);
assert.deepEqual(ids('NASI GORENG\nLÁNGOS\nTTEOKBOKKI\nLANGOS'), ['tteokbokki', 'nasi-goreng', 'langos']);
assert.deepEqual(ids('GULYAS\nHURKA\nPAPRIKASH'), []);
assert.deepEqual(ids('PHONE REPAIR\nPAD THAILAND'), []);
assert.deepEqual(ids('떡볶이 9000\nผัดไทย 120'), ['tteokbokki', 'pad-thai']);
const food = getSupportedFood('langos');
assert.deepEqual(foodCultures.map(item => item.value), ['Korean', 'Vietnamese', 'Thai', 'Indonesian', 'Hungarian']);
assert.equal(cultureFromLanguage('vi-VN'), 'Vietnamese');
assert.equal(cultureFromLanguage('en-US'), null);
assert.equal(clampSensitivity(-9), 0);
assert.equal(clampSensitivity(13), 10);
assert.equal(clampSensitivity(6.7), 7);
assert.deepEqual(toggleAllergen(['nuts'], 'shellfish'), ['nuts', 'shellfish']);
assert.deepEqual(toggleAllergen(['nuts', 'shellfish'], 'nuts'), ['shellfish']);
assert.deepEqual(toggleAllergen(['nuts', 'shellfish'], 'none'), []);
const oldProfile = migrateProfile({ culture: 'Korean', likes: ['Cheese'], avoids: ['Organ meat', 'Strong fish smell'], avoidOrganMeat: true });
assert.equal(oldProfile.sensitivities.organMeat, 1);
assert.deepEqual(oldProfile.avoids, ['Strong fish smell']);
assert.equal(migrateProfile({ culture: 'Vietnamese', avoidOrganMeat: false }).sensitivities.organMeat, 6);
assert.deepEqual(migrateProfile({ culture: 'Japanese' }).sensitivities, defaultSensitivities);
assert.equal(migrateProfile({ sensitivities: { spicy: 99, rich: -3, organMeat: 2.8 } }).sensitivities.spicy, 10);
assert.equal(migrateProfile({ sensitivities: { spicy: 99, rich: -3, organMeat: 2.8 } }).sensitivities.rich, 0);
assert.equal(migrateProfile({ sensitivities: { spicy: 99, rich: -3, organMeat: 2.8 } }).sensitivities.organMeat, 3);
const persisted = { culture: 'Vietnamese', likes: ['Cheese'], avoids: [], sensitivities: { spicy: 3, rich: 6, strongAroma: 4, unfamiliarTexture: 8, organMeat: 1 }, allergens: ['nuts', 'shellfish'] };
assert.deepEqual(migrateProfile(JSON.parse(JSON.stringify(persisted))), persisted);
assert.deepEqual(supportedFoods.map(item => item.id), ['tteokbokki', 'pho', 'pad-thai', 'nasi-goreng', 'langos']);
for (const item of supportedFoods) {
  for (const value of Object.values(item.sensoryProfile)) assert.ok(Number.isInteger(value) && value >= 0 && value <= 10);
  assert.ok(Array.isArray(item.commonAllergens));
}
const profile = migrateProfile({ culture: 'Korean', likes: ['Cheese'], avoids: [] });
const original = calculateTasteMatch(food, profile).score;
assert.equal(calculateTasteMatch(food, profile).score, original);
assert.ok(calculateTasteMatch(food, { ...profile, likes: [] }).score < original);
assert.ok(calculateTasteMatch(getSupportedFood('tteokbokki'), { ...profile, sensitivities: { ...profile.sensitivities, spicy: 2 } }).score < calculateTasteMatch(getSupportedFood('tteokbokki'), { ...profile, sensitivities: { ...profile.sensitivities, spicy: 9 } }).score);
const conflict = calculateTasteMatch(getSupportedFood('pad-thai'), { ...profile, allergens: ['nuts', 'shellfish'] });
assert.deepEqual(conflict.allergenConflicts, ['nuts', 'shellfish']);
assert.match(allergenWarning(conflict.allergenConflicts), /Peanuts \/ tree nuts.*Shellfish/);
assert.ok(conflict.score < calculateTasteMatch(getSupportedFood('pad-thai'), profile).score);
assert.deepEqual(calculateTasteMatch(food, profile).allergenConflicts, []);
assert.deepEqual(targetMenuImageSize(1200, 800), { width: 1200, height: 800 });
assert.deepEqual(targetMenuImageSize(8000, 6000), { width: 3200, height: 2400 });
for (const [width, height] of [[320, 568], [390, 844], [430, 700], [844, 390]]) {
  const mapping = frameMapping(1920, 1080, width, height);
  const guide = scanGuide(width, height);
  const mapped = videoBoxToViewport(canvasBoxToVideo({ x: 0, y: 0, width: mapping.canvasWidth, height: mapping.canvasHeight }, mapping), mapping);
  assert.ok(Math.abs(mapped.x - guide.x) < 0.01 && Math.abs(mapped.y - guide.y) < 0.01);
  assert.ok(Math.abs(mapped.width - guide.width) < 0.01 && Math.abs(mapped.height - guide.height) < 0.01);
  assert.ok(mapping.canvasWidth <= 1100 && mapping.canvasWidth * mapping.canvasHeight <= 900000);
}
for (const [width, height] of [[272, 400], [342, 560], [382, 500]]) {
  const centered = scannerOverlayLayout({ x: width / 2 - 25, y: height / 2, width: 50, height: 24 }, width, height);
  assert.ok(centered.modelWidth >= 185 && centered.modelHeight >= 155);
  for (const x of [8, width / 2, width - 70]) {
    for (const y of [height * 0.22, height * 0.5, height * 0.7]) {
      const box = { x, y, width: 50, height: 24 };
      const overlay = scannerOverlayLayout(box, width, height);
      assert.ok(overlay.modelWidth > 0 && overlay.modelWidth <= 200);
      assert.ok(overlay.left >= 6 && overlay.left + overlay.modelWidth <= width - 6);
      assert.ok(overlay.top >= 6 && overlay.top + overlay.modelHeight + 26 <= height - 6);
      if (overlay.placement === 'above') assert.ok(overlay.top + overlay.modelHeight + 26 <= box.y - 4);
      else assert.ok(overlay.top >= box.y + box.height + 5);
    }
  }
}
assert.deepEqual(smoothOverlayBox({ x: 10, y: 20, width: 50, height: 20 }, { x: 30, y: 40, width: 70, height: 28 }),
  { x: 25, y: 35, width: 65, height: 26 });
assert.equal(smoothOverlayBox({ x: 0, y: 0, width: 50, height: 20 }, { x: 100, y: 0, width: 50, height: 20 }).x, 100);
const liveLines = [{ text: 'PAD THAI 320', confidence: 70, bbox: { x: 10, y: 20, width: 180, height: 30 }, words: [
  { text: 'PAD', confidence: 72, bbox: { x: 10, y: 20, width: 50, height: 30 } },
  { text: 'THAI', confidence: 80, bbox: { x: 64, y: 20, width: 64, height: 30 } },
  { text: '320', confidence: 95, bbox: { x: 150, y: 20, width: 40, height: 30 } },
] }];
assert.deepEqual(detectLiveFoods(liveLines).map(item => item.foodId), ['pad-thai']);
assert.deepEqual(detectLiveFoods(liveLines)[0].bbox, { x: 10, y: 20, width: 118, height: 30 });
assert.deepEqual(detectLiveFoods([{ ...liveLines[0], text: 'GULYAS 320' }]), []);
const tracker = new LiveDetectionTracker();
const candidate = detectLiveFoods(liveLines)[0];
assert.deepEqual(tracker.update([{ ...candidate, confidence: 55 }], 1000), []);
assert.equal(tracker.update([{ ...candidate, confidence: 55 }], 2000)[0].foodId, 'pad-thai');
assert.equal(tracker.update([], 3400)[0].foodId, 'pad-thai');
assert.deepEqual(tracker.update([], 3700), []);
async function checkModelPaths() {
  assert.deepEqual(modelAssetPaths(food), { glb: '/models/langos.glb', usdz: '/models/langos.usdz' });
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => new Response('<html></html>', { headers: { 'content-type': 'model/gltf-binary' } });
    assert.equal(await findAvailableModel(food), null);
    global.fetch = async path => new Response(path.endsWith('.glb') ? 'glTF\0\0\0\0' : '<html>', { headers: { 'content-type': 'application/octet-stream' } });
    assert.deepEqual(await findAvailableModel(food), { src: '/models/langos.glb', iosSrc: undefined });
    global.fetch = async path => new Response(path.endsWith('.glb') ? 'glTF\0\0\0\0' : 'PK\x03\x04', { headers: { 'content-type': 'application/octet-stream' } });
    assert.deepEqual(await findAvailableModel(food), { src: '/models/langos.glb', iosSrc: '/models/langos.usdz' });
  } finally { global.fetch = originalFetch; }
}
checkModelPaths().then(() => console.log('Community Lens, personalization, recognition, Taste Match, image sizing, model paths, live boxes, and detection stability passed.')).catch(error => { console.error(error); process.exitCode = 1; });
