import { supportedFoods, type SupportedFood } from '../data/supportedFoods';

// Keep Unicode letters from scripts such as Korean and Thai while folding Latin accents.
export function normalizeMenuText(value: string): string {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function detectSupportedFoods(rawText: string): SupportedFood[] {
  const lines = rawText.split(/\r?\n/).map(normalizeMenuText).filter(Boolean);
  return supportedFoods.filter(food => food.aliases.some(alias => {
    const candidate = normalizeMenuText(alias);
    return lines.some(line => (` ${line} `).includes(` ${candidate} `));
  }));
}
