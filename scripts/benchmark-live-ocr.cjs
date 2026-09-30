const path = require('node:path');
const os = require('node:os');
const { performance } = require('node:perf_hooks');
const { createWorker, PSM } = require('tesseract.js');
const ts = require('typescript');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (module, filename) => {
  const source = require('node:fs').readFileSync(filename, 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  module._compile(result.outputText, filename);
};
const { detectLiveFoods } = require('../src/features/liveScanner.ts');

const fixtures = ['a-langos.png', 'b-pho-pad-thai.png', 'c-three-dishes.png', 'all-five.png', 'd-unsupported.png'];
const expected = { 'a-langos.png': ['langos'], 'b-pho-pad-thai.png': ['pho', 'pad-thai'],
  'c-three-dishes.png': ['tteokbokki', 'nasi-goreng', 'langos'],
  'all-five.png': ['tteokbokki', 'pho', 'pad-thai', 'nasi-goreng', 'langos'], 'd-unsupported.png': [] };
const cachePath = path.join(os.tmpdir(), 'matmi-ocr-benchmark');

async function run(label, languages, sparse) {
  const initStart = performance.now();
  const worker = await createWorker(languages, 1, { cachePath });
  if (sparse) await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
  const initMs = performance.now() - initStart;
  const samples = [];
  try {
    for (const fixture of fixtures) {
      const start = performance.now();
      const { data } = await worker.recognize(path.join(__dirname, '..', 'tests', 'fixtures', fixture), {}, { text: true, blocks: true });
      const lines = (data.blocks ?? []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines.map(line => ({
        text: line.text, confidence: line.confidence,
        bbox: { x: line.bbox.x0, y: line.bbox.y0, width: line.bbox.x1 - line.bbox.x0, height: line.bbox.y1 - line.bbox.y0 },
        words: line.words.map(word => ({ text: word.text, confidence: word.confidence,
          bbox: { x: word.bbox.x0, y: word.bbox.y0, width: word.bbox.x1 - word.bbox.x0, height: word.bbox.y1 - word.bbox.y0 } })),
      }))));
      const detections = detectLiveFoods(lines);
      assert.deepEqual(detections.map(item => item.foodId).sort(), [...expected[fixture]].sort(), `${label}: ${fixture}`);
      samples.push({ fixture, ms: Math.round(performance.now() - start), confidence: Math.round(data.confidence),
        lines: lines.length, detections: detections.map(item => ({ foodId: item.foodId, bbox: item.bbox })),
        text: data.text.replace(/\s+/g, ' ').trim().slice(0, 140) });
    }
  } finally { await worker.terminate(); }
  console.log(JSON.stringify({ label, initMs: Math.round(initMs), averageMs: Math.round(samples.reduce((sum, sample) => sum + sample.ms, 0) / samples.length), samples }));
}

(async () => {
  await run('live-eng-sparse', 'eng', true);
  await run('still-four-language-auto', ['eng', 'vie', 'kor', 'tha'], false);
})().catch(error => { console.error(error); process.exitCode = 1; });
