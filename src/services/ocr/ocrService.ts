export type OCRResult = { rawText: string; confidence?: number };
export type OCRProgress = { stage: 'loading' | 'recognizing'; progress: number };
export interface OCRService { extractText(image: File, onProgress?: (progress: OCRProgress) => void): Promise<OCRResult> }

export class BrowserTesseractOCR implements OCRService {
  async extractText(image: File, onProgress?: (progress: OCRProgress) => void): Promise<OCRResult> {
    if (typeof window === 'undefined') throw new Error('Browser OCR is unavailable here.');
    const { createWorker } = await import('tesseract.js');
    onProgress?.({ stage: 'loading', progress: 0 });
    const worker = await createWorker(['eng', 'vie', 'kor', 'tha'], 1, {
      logger: event => onProgress?.({ stage: event.status === 'recognizing text' ? 'recognizing' : 'loading', progress: event.progress }),
    });
    try {
      const result = await worker.recognize(image);
      return { rawText: result.data.text, confidence: result.data.confidence };
    } finally {
      await worker.terminate();
    }
  }
}

export const ocrService: OCRService = new BrowserTesseractOCR();
