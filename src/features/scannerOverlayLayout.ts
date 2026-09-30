import type { Box } from './liveScanner';

export type ScannerOverlayLayout = {
  left: number;
  top: number;
  modelWidth: number;
  modelHeight: number;
  placement: 'above' | 'below';
};

const edge = 6;
const textGap = 5;
const labelHeight = 26;
const modelLabelGap = 0;

function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(value, high));
}

export function scannerOverlayLayout(box: Box, viewportWidth: number, viewportHeight: number): ScannerOverlayLayout {
  const baseWidth = clamp(viewportWidth * 0.72, 184, 200);
  const baseHeight = baseWidth * 0.85;
  const spaceAbove = Math.max(0, box.y - textGap - edge);
  const spaceBelow = Math.max(0, viewportHeight - (box.y + box.height) - textGap - edge);
  const fullHeight = baseHeight + modelLabelGap + labelHeight;
  const placement = spaceAbove >= fullHeight || spaceAbove >= spaceBelow ? 'above' : 'below';
  const available = placement === 'above' ? spaceAbove : spaceBelow;
  const scale = Math.min(1, Math.max(0.3, (available - modelLabelGap - labelHeight) / baseHeight));
  const modelWidth = Math.round(baseWidth * scale);
  const modelHeight = Math.round(baseHeight * scale);
  const totalHeight = modelHeight + modelLabelGap + labelHeight;
  const left = clamp(box.x + box.width / 2 - modelWidth / 2, edge, Math.max(edge, viewportWidth - modelWidth - edge));
  const top = placement === 'above' ? Math.max(edge, box.y - textGap - totalHeight) :
    Math.min(viewportHeight - totalHeight - edge, box.y + box.height + textGap);
  return { left, top, modelWidth, modelHeight, placement };
}

export function smoothOverlayBox(previous: Box, next: Box): Box {
  const movement = Math.hypot(next.x - previous.x, next.y - previous.y);
  if (movement > 80) return next;
  const blend = (oldValue: number, newValue: number) => oldValue * 0.25 + newValue * 0.75;
  return { x: blend(previous.x, next.x), y: blend(previous.y, next.y),
    width: blend(previous.width, next.width), height: blend(previous.height, next.height) };
}
