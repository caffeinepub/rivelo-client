// API Key management with multi-key failover logic

import { getCurrentProfile, updateProfile } from "./auth";

// Track exhausted keys in-memory (resets on page reload)
const exhaustedKeys = new Set<string>();
// Track current key index per session
let currentKeyIndex = 0;

export function getActiveApiKey(): string | null {
  const profile = getCurrentProfile();
  if (!profile) return null;

  const keys = (profile.apiKeys || []).filter(
    (k) => k.key && k.key.trim() !== "",
  );
  if (keys.length === 0) return null;

  // Find first non-exhausted key starting from currentKeyIndex
  for (let i = 0; i < keys.length; i++) {
    const idx = (currentKeyIndex + i) % keys.length;
    if (!exhaustedKeys.has(keys[idx].id)) {
      currentKeyIndex = idx;
      return keys[idx].key;
    }
  }

  // All keys exhausted — reset and use first
  exhaustedKeys.clear();
  currentKeyIndex = 0;
  return keys[0]?.key || null;
}

export function getActiveKeyInfo(): { index: number; label: string } | null {
  const profile = getCurrentProfile();
  if (!profile) return null;
  const keys = (profile.apiKeys || []).filter(
    (k) => k.key && k.key.trim() !== "",
  );
  if (keys.length === 0) return null;
  const key = keys[currentKeyIndex % keys.length];
  return {
    index: currentKeyIndex + 1,
    label: key?.label || `Key ${currentKeyIndex + 1}`,
  };
}

export function rotateToNextKey(): string | null {
  const profile = getCurrentProfile();
  if (!profile) return null;

  const keys = (profile.apiKeys || []).filter(
    (k) => k.key && k.key.trim() !== "",
  );
  if (keys.length <= 1) return null;

  const fromIndex = currentKeyIndex;
  const fromKey = keys[fromIndex % keys.length];

  // Mark current key as exhausted
  if (fromKey) exhaustedKeys.add(fromKey.id);

  // Find next non-exhausted
  for (let i = 1; i < keys.length; i++) {
    const nextIdx = (fromIndex + i) % keys.length;
    if (!exhaustedKeys.has(keys[nextIdx].id)) {
      currentKeyIndex = nextIdx;
      const toKey = keys[nextIdx];

      // Emit failover event
      window.dispatchEvent(
        new CustomEvent("key-failover", {
          detail: {
            fromKey: fromKey?.label || `Key ${fromIndex + 1}`,
            toKey: toKey?.label || `Key ${nextIdx + 1}`,
            fromIndex: fromIndex + 1,
            toIndex: nextIdx + 1,
          },
        }),
      );

      return toKey.key;
    }
  }

  return null;
}

export function isFailoverError(status: number, message?: string): boolean {
  if (status === 429 || status === 402) return true;
  if (message) {
    const lower = message.toLowerCase();
    return (
      lower.includes("rate limit") ||
      lower.includes("credit") ||
      lower.includes("quota") ||
      lower.includes("exceeded")
    );
  }
  return false;
}

export function resetExhaustedKeys(): void {
  exhaustedKeys.clear();
  currentKeyIndex = 0;
}

export function saveApiKeys(
  keys: Array<{ id: string; label: string; key: string; isActive: boolean }>,
): void {
  updateProfile({ apiKeys: keys });
}
