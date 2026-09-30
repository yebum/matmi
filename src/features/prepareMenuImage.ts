// Keep enough pixels for small menu text while limiting exceptionally large phone photos.
const maxSide = 3200;
const maxPixels = 9_000_000;

export function targetMenuImageSize(width: number, height: number): { width: number; height: number } {
  if (width <= 0 || height <= 0) throw new Error('The image has invalid dimensions.');
  const scale = Math.min(1, maxSide / Math.max(width, height), Math.sqrt(maxPixels / (width * height)));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function prepareMenuImage(file: File, image: HTMLImageElement): Promise<File> {
  const target = targetMenuImageSize(image.naturalWidth, image.naturalHeight);
  const supportedType = /^image\/(jpeg|png|webp|bmp)$/i.test(file.type);
  if (target.width === image.naturalWidth && target.height === image.naturalHeight && supportedType) return file;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, target.width, target.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, target.width, target.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    canvas.width = 0; canvas.height = 0;
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    // Canvas encoding is an optimization. Keep the original image if unavailable.
    return file;
  }
}
