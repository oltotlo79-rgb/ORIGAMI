function deepFreeze(value: unknown, seen: WeakSet<object>): void {
  if (typeof value !== 'object' || value === null || seen.has(value)) return;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  Object.freeze(value);
}

function isPlainSnapshot(value: unknown, ancestors: WeakSet<object>): boolean {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number')
    return true;
  if (typeof value !== 'object') return false;

  const object = value;
  if (ancestors.has(object)) return false;
  ancestors.add(object);
  try {
    if (Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) {
        return false;
      }
      return value.every((entry) => isPlainSnapshot(entry, ancestors));
    }

    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    return Object.values(value).every((entry) => isPlainSnapshot(entry, ancestors));
  } finally {
    ancestors.delete(object);
  }
}

export type ValidationSnapshot<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; reason: 'uncloneable' | 'non-json-data' }>;

/** Captures one getter-consistent, plain JSON-data snapshot before validation. */
export function tryCreateValidationSnapshot<T>(value: T): ValidationSnapshot<T> {
  let snapshot: T;
  try {
    snapshot = structuredClone(value);
  } catch {
    return { ok: false, reason: 'uncloneable' };
  }
  if (!isPlainSnapshot(snapshot, new WeakSet<object>())) {
    return { ok: false, reason: 'non-json-data' };
  }
  return { ok: true, value: snapshot };
}

/** Freezes an already-owned validation snapshot without reading caller state again. */
export function deepFreezeOwned<T>(value: T): T {
  deepFreeze(value, new WeakSet<object>());
  return value;
}

/**
 * Breaks caller aliases before exposing a value accepted by an M0F parser.
 * Runtime freezing complements readonly TypeScript types at claim boundaries.
 */
export function cloneAndDeepFreeze<T>(value: T): T {
  const snapshot = tryCreateValidationSnapshot(value);
  if (!snapshot.ok) throw new TypeError(`value is ${snapshot.reason}`);
  return deepFreezeOwned(snapshot.value);
}
