const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  module._compile(result.outputText, filename);
};
const { normalizeMenuText, detectSupportedFoods } = require('../src/features/recognition.ts');
const { getSupportedFood } = require('../src/data/supportedFoods.ts');
const { calculateTasteMatch } = require('../src/features/tasteMatch.ts');
const { targetMenuImageSize } = require('../src/features/prepareMenuImage.ts');
const { modelAssetPaths, findAvailableModel } = require('../src/features/modelAssets.ts');
const { frameMapping, scanGuide, canvasBoxToVideo, videoBoxToViewport, detectLiveFoods, LiveDetectionTracker } = require('../src/features/liveScanner.ts');
const ids = text => detectSupportedFoods(text).map(food => food.id);
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
const profile = { culture: 'Korean', likes: ['Cheese'], avoids: [] };
const original = calculateTasteMatch(food, profile).score;
assert.equal(calculateTasteMatch(food, profile).score, original);
assert.ok(calculateTasteMatch(food, { ...profile, likes: [] }).score < original);
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
checkModelPaths().then(() => console.log('Recognition, Taste Match, image sizing, model paths, live boxes, and detection stability passed.')).catch(error => { console.error(error); process.exitCode = 1; });
