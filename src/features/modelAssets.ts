import type { SupportedFood } from '../data/supportedFoods';

export type AvailableModel = { src: string; iosSrc?: string };

export function modelAssetPaths(food: SupportedFood): { glb: string; usdz: string } {
  return {
    glb: food.model3d ?? `/models/${food.id}.glb`,
    usdz: food.model3dIOS ?? `/models/${food.id}.usdz`,
  };
}

async function isPresentModel(path: string, format: 'glb' | 'usdz'): Promise<boolean> {
  try {
    // Read only the file header. SPA rewrites and MIME rules can return HTML with HTTP 200.
    const response = await fetch(path, { headers: { Range: 'bytes=0-15' } });
    if (!response.ok || !response.body) return false;
    const reader = response.body.getReader();
    const bytes: number[] = [];
    while (bytes.length < 4) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes.push(...chunk.value.slice(0, 4 - bytes.length));
    }
    await reader.cancel();
    const expected = format === 'glb' ? [0x67, 0x6c, 0x54, 0x46] : [0x50, 0x4b, 0x03, 0x04];
    return expected.every((byte, index) => bytes[index] === byte);
  } catch {
    return false;
  }
}

export async function findAvailableModel(food: SupportedFood): Promise<AvailableModel | null> {
  const paths = modelAssetPaths(food);
  if (!(await isPresentModel(paths.glb, 'glb'))) return null;
  return { src: paths.glb, iosSrc: await isPresentModel(paths.usdz, 'usdz') ? paths.usdz : undefined };
}
