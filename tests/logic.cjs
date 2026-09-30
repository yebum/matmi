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
checkModelPaths().then(() => console.log('Recognition A–D, score E, image sizing, and model-path checks passed.')).catch(error => { console.error(error); process.exitCode = 1; });
