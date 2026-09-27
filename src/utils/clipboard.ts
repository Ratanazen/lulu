import { invoke } from '@tauri-apps/api/core';

/**
 * Copies text to system clipboard with priority on native Wayland (wl-copy) / X11 (xsel)
 * before falling back to browser navigator.clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try native backend command (vital for Wayland/Sway webviews)
  try {
    if (typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
      await invoke('copy_to_clipboard', { text });
      return true;
    }
  } catch (err) {
    console.warn('Native clipboard copy failed, trying browser clipboard:', err);
  }

  // 2. Try browser standard clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard.writeText failed:', err);
  }

  // 3. Fallback textarea copy execCommand
  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (success) return true;
    }
  } catch (err) {
    console.error('All clipboard copy strategies failed:', err);
  }

  return false;
}
