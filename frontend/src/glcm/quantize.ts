export function quantizeGray(gray: number, levels: number): number {
  return Math.min(levels - 1, Math.max(0, Math.floor((gray * levels) / 256)));
}

export function quantizeImage(gray: Uint8Array, levels: number): Uint8Array {
  const out = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) out[i] = quantizeGray(gray[i], levels);
  return out;
}
