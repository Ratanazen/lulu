/**
 * High-performance Image Background Removal Engine
 *
 * Removes solid, near-solid, white, dark, or gradient backdrops from avatars and
 * companion mascot images using corner sampling, Euclidean color distance,
 * and BFS edge flood-fill.
 */

export interface BackgroundRemovalOptions {
  tolerance?: number;       // Color distance tolerance (0-255, default: 32)
  feather?: number;         // Edge feathering / anti-aliasing radius (default: 1)
  sampleCornersOnly?: boolean; // Sample corners to auto-detect background color (default: true)
  targetColor?: { r: number; g: number; b: number }; // Optional manual key color
}

/**
 * Calculates Euclidean distance between two RGB colors
 */
function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Removes the background of an image and returns a transparent PNG Data URL
 */
export async function removeImageBackground(
  imageInput: string | HTMLImageElement | HTMLCanvasElement,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  const tolerance = options.tolerance ?? 32;
  const feather = options.feather ?? 1;

  if (!imageInput || (typeof imageInput === 'string' && !imageInput.trim())) {
    return '';
  }

  if (typeof window === 'undefined') {
    // In SSR / non-browser environments, return input if string
    return typeof imageInput === 'string' ? imageInput : '';
  }

  // 1. Resolve to HTMLCanvasElement with image drawn
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  if (imageInput instanceof HTMLCanvasElement) {
    canvas = document.createElement('canvas');
    canvas.width = imageInput.width;
    canvas.height = imageInput.height;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    ctx.drawImage(imageInput, 0, 0);
  } else {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      if (imageInput instanceof HTMLImageElement) {
        if (imageInput.complete && imageInput.naturalWidth > 0) {
          resolve(imageInput);
        } else {
          imageInput.onload = () => resolve(imageInput);
          imageInput.onerror = reject;
        }
      } else {
        const newImg = new Image();
        newImg.crossOrigin = 'anonymous';
        newImg.onload = () => resolve(newImg);
        newImg.onerror = reject;
        newImg.src = imageInput;
      }
    });

    canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    ctx.drawImage(img, 0, 0);
  }

  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) return '';

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 2. Identify candidate background colors from corners
  let bgR = 255;
  let bgG = 255;
  let bgB = 255;

  if (options.targetColor) {
    bgR = options.targetColor.r;
    bgG = options.targetColor.g;
    bgB = options.targetColor.b;
  } else {
    // Sample corners: (0,0), (W-1, 0), (0, H-1), (W-1, H-1)
    const corners = [
      0, // top-left
      (width - 1) * 4, // top-right
      (height - 1) * width * 4, // bottom-left
      ((height - 1) * width + (width - 1)) * 4, // bottom-right
    ];

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let validCorners = 0;

    for (const c of corners) {
      if (c < data.length) {
        rSum += data[c];
        gSum += data[c + 1];
        bSum += data[c + 2];
        validCorners++;
      }
    }

    if (validCorners > 0) {
      bgR = Math.round(rSum / validCorners);
      bgG = Math.round(gSum / validCorners);
      bgB = Math.round(bSum / validCorners);
    }
  }

  // 3. BFS flood fill starting from all outer border pixels
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const pushPixel = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;

    const p = idx * 4;
    const dist = colorDistance(data[p], data[p + 1], data[p + 2], bgR, bgG, bgB);

    if (dist <= tolerance) {
      data[p + 3] = 0; // Transparent
      queue.push(idx);
    } else if (dist <= tolerance + 16 && feather > 0) {
      // Soft edge feathering
      const alphaFactor = (dist - tolerance) / 16;
      data[p + 3] = Math.round(data[p + 3] * alphaFactor);
    }
  };

  // Seed BFS queue with top and bottom edges
  for (let x = 0; x < width; x++) {
    pushPixel(x, 0);
    pushPixel(x, height - 1);
  }
  // Seed BFS queue with left and right edges
  for (let y = 1; y < height - 1; y++) {
    pushPixel(0, y);
    pushPixel(width - 1, y);
  }

  // Process BFS queue
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    pushPixel(cx + 1, cy);
    pushPixel(cx - 1, cy);
    pushPixel(cx, cy + 1);
    pushPixel(cx, cy - 1);
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}
