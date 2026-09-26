import { SpeechCategory } from '../types';

/**
 * Splits text into user-perceived characters (grapheme clusters).
 * Safely handles Khmer script (e.g. ខ្មែរ, សួស្តី), complex ligatures,
 * multi-codepoint emojis (e.g. 👁️, 🍥, 🌸), and accented characters.
 */
export function splitGraphemes(text: string): string[] {
  if (!text) return [];
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (s: any) => s.segment);
    } catch {
      // Fallback if Segmenter constructor errors
    }
  }
  // Fallback: array spread handles surrogate pairs
  return Array.from(text);
}

/**
 * Calculates smart reading duration for a speech bubble message.
 *
 * Rules:
 * - base: 2500ms
 * - readingTime: characterCount * 45ms
 * - minimum: 4000ms (no normal message disappears before 4s)
 * - maximum: 12000ms
 *
 * Duration formula:
 *   clamp(base + characterCount * 45, 4000, 12000)
 *
 * Category / Priority adjustments:
 * - CRITICAL (priority >= 5): Infinity (persists until user dismisses)
 * - FAILURE / ERROR: min 8000ms
 * - NOTIFICATION: min 6000ms
 * - USER_INTERACTION: min 6000ms
 * - MUSIC / SYSTEM: min 5000ms
 */
export function calculateMessageDuration(
  text: string,
  category?: SpeechCategory | 'error' | 'user' | string,
  priority?: number
): number {
  if (priority !== undefined && priority >= 5) {
    return Infinity;
  }

  const graphemes = splitGraphemes(text);
  const charCount = graphemes.length;

  const base = 2500;
  const readingTime = charCount * 45;
  let duration = Math.max(4000, Math.min(12000, base + readingTime));

  // Category adjustments
  switch (category) {
    case 'failure':
    case 'error':
      duration = Math.max(8000, duration);
      break;
    case 'user':
    case 'encouragement':
      duration = Math.max(6000, duration);
      break;
    case 'morning':
    case 'night':
    case 'weather':
    case 'study':
      duration = Math.max(5500, duration);
      break;
    case 'music':
    case 'settings':
    case 'game':
      duration = Math.max(5000, duration);
      break;
    default:
      break;
  }

  // Priority weighting
  if (priority !== undefined) {
    if (priority === 4) {
      // Notification
      duration = Math.max(6500, duration);
    } else if (priority === 3) {
      // User interaction
      duration = Math.max(6000, duration);
    }
  }

  return duration;
}

/**
 * Splits very long text into clean pages for speech bubble pagination.
 * Avoids breaking words or sentences abruptly.
 */
export function paginateText(text: string, maxCharsPerPage = 160): string[] {
  if (!text || text.length <= maxCharsPerPage) {
    return [text || ''];
  }

  const pages: string[] = [];
  // Split on paragraph or sentence boundaries
  const sentences = text.match(/[^.!?។\n]+[.!?។\n]+|[^.!?។\n]+$/g) || [text];

  let currentPage = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (!currentPage) {
      currentPage = trimmed;
    } else if ((currentPage + ' ' + trimmed).length <= maxCharsPerPage) {
      currentPage += ' ' + trimmed;
    } else {
      pages.push(currentPage);
      // If a single sentence exceeds maxCharsPerPage, split by word
      if (trimmed.length > maxCharsPerPage) {
        const words = trimmed.split(/\s+/);
        let subPage = '';
        for (const w of words) {
          if (!subPage) {
            subPage = w;
          } else if ((subPage + ' ' + w).length <= maxCharsPerPage) {
            subPage += ' ' + w;
          } else {
            pages.push(subPage);
            subPage = w;
          }
        }
        currentPage = subPage;
      } else {
        currentPage = trimmed;
      }
    }
  }

  if (currentPage) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [text];
}
