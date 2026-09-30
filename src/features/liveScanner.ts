import { supportedFoods, type SupportedFood } from '../data/supportedFoods';
import { detectSupportedFoods, normalizeMenuText } from './recognition';

export type Box = { x: number; y: number; width: number; height: number };
export type LiveFoodDetection = { foodId: string; text: string; confidence: number; bbox: Box };
export type OCRWord = { text: string; confidence: number; bbox: Box };
export type OCRLine = { text: string; confidence: number; bbox: Box; words: OCRWord[] };
export type FrameMapping = {
  videoWidth: number; videoHeight: number; viewportWidth: number; viewportHeight: number;
  scale: number; offsetX: number; offsetY: number; roi: Box; canvasWidth: number; canvasHeight: number;
};

export function scanGuide(width: number, height: number): Box {
  return { x: width * 0.09, y: height * 0.22, width: width * 0.82, height: height * 0.52 };
}

export function frameMapping(videoWidth: number, videoHeight: number, viewportWidth: number, viewportHeight: number): FrameMapping {
  const scale = Math.max(viewportWidth / videoWidth, viewportHeight / videoHeight);
  const offsetX = (viewportWidth - videoWidth * scale) / 2;
  const offsetY = (viewportHeight - videoHeight * scale) / 2;
  const guide = scanGuide(viewportWidth, viewportHeight);
  const x = Math.max(0, (guide.x - offsetX) / scale);
  const y = Math.max(0, (guide.y - offsetY) / scale);
  const right = Math.min(videoWidth, (guide.x + guide.width - offsetX) / scale);
  const bottom = Math.min(videoHeight, (guide.y + guide.height - offsetY) / scale);
  const roi = { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
  const reduction = Math.min(1, 1100 / roi.width, Math.sqrt(900000 / (roi.width * roi.height)));
  return { videoWidth, videoHeight, viewportWidth, viewportHeight, scale, offsetX, offsetY, roi,
    canvasWidth: Math.max(1, Math.round(roi.width * reduction)), canvasHeight: Math.max(1, Math.round(roi.height * reduction)) };
}

export function canvasBoxToVideo(box: Box, mapping: FrameMapping): Box {
  return { x: mapping.roi.x + box.x * mapping.roi.width / mapping.canvasWidth,
    y: mapping.roi.y + box.y * mapping.roi.height / mapping.canvasHeight,
    width: box.width * mapping.roi.width / mapping.canvasWidth,
    height: box.height * mapping.roi.height / mapping.canvasHeight };
}

export function videoBoxToViewport(box: Box, mapping: FrameMapping): Box {
  return { x: box.x * mapping.scale + mapping.offsetX, y: box.y * mapping.scale + mapping.offsetY,
    width: box.width * mapping.scale, height: box.height * mapping.scale };
}

function wordBoxForFood(line: OCRLine, food: SupportedFood): { bbox: Box; confidence: number } | null {
  const words = line.words.map(word => ({ ...word, normalized: normalizeMenuText(word.text) })).filter(word => word.normalized);
  for (const alias of [...food.aliases].sort((a, b) => b.length - a.length)) {
    const tokens = normalizeMenuText(alias).split(' ');
    for (let index = 0; index <= words.length - tokens.length; index++) {
      const selected = words.slice(index, index + tokens.length);
      if (!selected.every((word, tokenIndex) => word.normalized === tokens[tokenIndex])) continue;
      const x = Math.min(...selected.map(word => word.bbox.x));
      const y = Math.min(...selected.map(word => word.bbox.y));
      const right = Math.max(...selected.map(word => word.bbox.x + word.bbox.width));
      const bottom = Math.max(...selected.map(word => word.bbox.y + word.bbox.height));
      return { bbox: { x, y, width: right - x, height: bottom - y },
        confidence: selected.reduce((sum, word) => sum + word.confidence, 0) / selected.length };
    }
  }
  return null;
}

export function detectLiveFoods(lines: OCRLine[]): LiveFoodDetection[] {
  const found: LiveFoodDetection[] = [];
  for (const line of lines) {
    for (const food of detectSupportedFoods(line.text)) {
      const precise = wordBoxForFood(line, food);
      found.push({ foodId: food.id, text: line.text.trim(), confidence: precise?.confidence ?? line.confidence,
        bbox: precise?.bbox ?? line.bbox });
    }
  }
  return supportedFoods.flatMap(food => {
    const matches = found.filter(item => item.foodId === food.id).sort((a, b) => b.confidence - a.confidence);
    return matches.slice(0, 1);
  });
}

type Track = { detection: LiveFoodDetection; streak: number; lastSeen: number; confirmed: boolean };
export class LiveDetectionTracker {
  private tracks = new Map<string, Track>();
  update(candidates: LiveFoodDetection[], now: number): LiveFoodDetection[] {
    for (const [id, track] of this.tracks) {
      if (now - track.lastSeen > (track.confirmed ? 1600 : 1000)) this.tracks.delete(id);
    }
    for (const item of candidates) {
      if (item.confidence < 35) continue;
      const previous = this.tracks.get(item.foodId);
      const streak = previous && now - previous.lastSeen < 2500 ? previous.streak + 1 : 1;
      this.tracks.set(item.foodId, { detection: item, streak, lastSeen: now,
        confirmed: !!previous?.confirmed || item.confidence >= 80 || streak >= 2 });
    }
    return this.current(now);
  }
  current(now: number): LiveFoodDetection[] {
    return [...this.tracks.values()].filter(track => track.confirmed && now - track.lastSeen <= 1600)
      .map(track => track.detection).sort((a, b) => b.confidence - a.confidence);
  }
}
