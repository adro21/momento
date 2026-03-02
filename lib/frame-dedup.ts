import fs from "fs/promises";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const COMPARE_SIZE = 128; // resize to 128x128 for fast comparison

/**
 * Compare two PNG files and return the percentage of pixels that differ.
 * Returns a value between 0 (identical) and 1 (completely different).
 */
export async function compareFrames(
  pathA: string,
  pathB: string
): Promise<number> {
  const [bufA, bufB] = await Promise.all([
    fs.readFile(pathA),
    fs.readFile(pathB),
  ]);

  const imgA = PNG.sync.read(bufA);
  const imgB = PNG.sync.read(bufB);

  // Resize both to a common small size for fast comparison
  const thumbA = resizeNearest(imgA, COMPARE_SIZE, COMPARE_SIZE);
  const thumbB = resizeNearest(imgB, COMPARE_SIZE, COMPARE_SIZE);

  const totalPixels = COMPARE_SIZE * COMPARE_SIZE;
  const diffOutput = new Uint8Array(totalPixels * 4);
  const diffPixels = pixelmatch(
    thumbA.data,
    thumbB.data,
    diffOutput,
    COMPARE_SIZE,
    COMPARE_SIZE,
    { threshold: 0.1 }
  );

  return diffPixels / totalPixels;
}

/**
 * Check if two frames are visually duplicate.
 * Default threshold: 0.5% of pixels differ.
 */
export async function isDuplicate(
  pathA: string,
  pathB: string,
  threshold: number = 0.005
): Promise<boolean> {
  try {
    const diff = await compareFrames(pathA, pathB);
    return diff < threshold;
  } catch {
    // If comparison fails, assume not duplicate
    return false;
  }
}

/**
 * Nearest-neighbor resize for PNG — fast and good enough for comparison.
 */
function resizeNearest(src: PNG, targetW: number, targetH: number): PNG {
  const dst = new PNG({ width: targetW, height: targetH });
  const xRatio = src.width / targetW;
  const yRatio = src.height / targetH;

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = (srcY * src.width + srcX) * 4;
      const dstIdx = (y * targetW + x) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }
  return dst;
}
