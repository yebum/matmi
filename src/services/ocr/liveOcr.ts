import type { OCRLine } from '../../features/liveScanner';

type TesseractWorker = Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>;
export type LiveOCRResult = { rawText: string; confidence: number; lines: OCRLine[]; elapsedMs: number };

export class LiveMenuOCR {
  private worker: TesseractWorker | null = null;
  private initializing: Promise<void> | null = null;
  private closed = false;
  constructor(private onState?: (state: string) => void) {}

  async initialize(): Promise<void> {
    if (this.closed) throw new Error('The scanner has closed.');
    if (this.worker) return;
    if (!this.initializing) this.initializing = (async () => {
      this.onState?.('Loading OCR');
      const { createWorker, PSM } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, { logger: event => this.onState?.(event.status) });
      if (this.closed) { await worker.terminate(); return; }
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      this.worker = worker;
      this.onState?.('Ready');
    })();
    try { await this.initializing; } finally { this.initializing = null; }
  }

  async recognize(canvas: HTMLCanvasElement): Promise<LiveOCRResult> {
    await this.initialize();
    if (!this.worker || this.closed) throw new Error('The scanner has closed.');
    const start = performance.now();
    const { data } = await this.worker.recognize(canvas, {}, { text: true, blocks: true });
    const lines: OCRLine[] = (data.blocks ?? []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines.map(line => ({
      text: line.text,
      confidence: line.confidence,
      bbox: { x: line.bbox.x0, y: line.bbox.y0, width: line.bbox.x1 - line.bbox.x0, height: line.bbox.y1 - line.bbox.y0 },
      words: line.words.map(word => ({ text: word.text, confidence: word.confidence,
        bbox: { x: word.bbox.x0, y: word.bbox.y0, width: word.bbox.x1 - word.bbox.x0, height: word.bbox.y1 - word.bbox.y0 } })),
    }))));
    return { rawText: data.text, confidence: data.confidence, lines, elapsedMs: performance.now() - start };
  }

  async close(): Promise<void> {
    this.closed = true;
    await this.initializing?.catch(() => {});
    const worker = this.worker;
    this.worker = null;
    await worker?.terminate();
  }
}
