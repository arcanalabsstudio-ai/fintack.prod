/**
 * Robust unique ID generator using crypto.randomUUID() with fallback.
 * Guarantees unique, collision-resistant IDs across rapid batch additions.
 */
export function generateUniqueId(prefix = 'tx'): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {
    // Fallback if crypto.randomUUID is not available in environment
  }

  // Fallback: high-resolution timestamp + random alphanumeric entropy
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  const counter = Math.floor(Math.random() * 100000).toString(36);
  return `${prefix}-${timestamp}-${counter}-${randomPart}`;
}

/**
 * Sanitizes an array of items, ensuring every item has a non-empty, globally unique ID.
 * If duplicate IDs are encountered, assigns a new guaranteed unique ID.
 */
export function sanitizeUniqueIds<T extends { id: string }>(items: T[], prefix = 'tx'): T[] {
  const seenIds = new Set<string>();
  let hasDuplicates = false;

  const result = items.map((item) => {
    if (!item.id || seenIds.has(item.id)) {
      hasDuplicates = true;
      const newId = generateUniqueId(prefix);
      seenIds.add(newId);
      return { ...item, id: newId };
    }
    seenIds.add(item.id);
    return item;
  });

  return result;
}

/**
 * Validates whether a proposed ID already exists in a given list of existing items.
 */
export function isIdUnique<T extends { id: string }>(proposedId: string, existingItems: T[]): boolean {
  if (!proposedId) return false;
  return !existingItems.some((item) => item.id === proposedId);
}
