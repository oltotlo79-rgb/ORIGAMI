import { tryCreateValidationSnapshot, type ValidationSnapshot } from './clone-and-freeze.js';

export type StrictValidationSnapshotLimits = Readonly<{
  maxArrayLength?: number;
  maxContainerCount?: number;
  maxDepth?: number;
  /** Maximum own string-key count on any non-array object. */
  maxObjectPropertyCount?: number;
  /** Maximum UTF-16 code units in each own string property name. */
  maxPropertyNameCodeUnits?: number;
  maxStringCodeUnits?: number;
  /** Global UTF-16 budget for string values and own property names. */
  maxTotalStringCodeUnits?: number;
  /** Global own string-property budget, including array indices and length. */
  maxTotalPropertyCount?: number;
}>;

interface StrictValidationSnapshotState {
  containerCount: number;
  propertyCount: number;
  stringCodeUnits: number;
}

function accountStringCodeUnits(
  codeUnits: number,
  limits: StrictValidationSnapshotLimits,
  state: StrictValidationSnapshotState,
): boolean {
  state.stringCodeUnits += codeUnits;
  return (
    limits.maxTotalStringCodeUnits === undefined ||
    state.stringCodeUnits <= limits.maxTotalStringCodeUnits
  );
}

function accountPropertyNames(
  names: readonly string[],
  isArray: boolean,
  limits: StrictValidationSnapshotLimits,
  state: StrictValidationSnapshotState,
): boolean {
  if (
    !isArray &&
    limits.maxObjectPropertyCount !== undefined &&
    names.length > limits.maxObjectPropertyCount
  ) {
    return false;
  }
  const maximumNameLength = limits.maxPropertyNameCodeUnits;
  if (maximumNameLength !== undefined && names.some((name) => name.length > maximumNameLength)) {
    return false;
  }
  if (
    !accountStringCodeUnits(
      names.reduce((total, name) => total + name.length, 0),
      limits,
      state,
    )
  ) {
    return false;
  }
  state.propertyCount += names.length;
  return (
    limits.maxTotalPropertyCount === undefined ||
    state.propertyCount <= limits.maxTotalPropertyCount
  );
}

/**
 * Reject accessors and exotic caller objects before structuredClone can
 * invoke or normalize them. Shared aliases are allowed; cycles are not.
 */
function isSafeCallerData(
  value: unknown,
  ancestors: WeakSet<object>,
  limits: StrictValidationSnapshotLimits,
  state: StrictValidationSnapshotState,
  depth: number,
): boolean {
  if (limits.maxDepth !== undefined && depth > limits.maxDepth) return false;
  if (value === null) return true;
  if (typeof value === 'string') {
    return (
      (limits.maxStringCodeUnits === undefined || value.length <= limits.maxStringCodeUnits) &&
      accountStringCodeUnits(value.length, limits, state)
    );
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return true;
  }
  if (typeof value !== 'object' || ancestors.has(value)) return false;
  state.containerCount += 1;
  if (limits.maxContainerCount !== undefined && state.containerCount > limits.maxContainerCount) {
    return false;
  }

  ancestors.add(value);
  try {
    const prototype: unknown = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype || Object.getOwnPropertySymbols(value).length !== 0) {
        return false;
      }
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (
        lengthDescriptor === undefined ||
        !('value' in lengthDescriptor) ||
        !Number.isSafeInteger(lengthDescriptor.value) ||
        (lengthDescriptor.value as number) < 0
      ) {
        return false;
      }
      const length = lengthDescriptor.value as number;
      if (limits.maxArrayLength !== undefined && length > limits.maxArrayLength) return false;
      const names = Object.getOwnPropertyNames(value);
      if (!accountPropertyNames(names, true, limits, state)) return false;
      if (names.length !== length + 1 || !names.includes('length')) return false;
      for (let index = 0; index < length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
          return false;
        }
        if (!isSafeCallerData(descriptor.value, ancestors, limits, state, depth + 1)) return false;
      }
      return true;
    }

    if (
      (prototype !== Object.prototype && prototype !== null) ||
      Object.getOwnPropertySymbols(value).length !== 0
    ) {
      return false;
    }
    const names = Object.getOwnPropertyNames(value);
    if (!accountPropertyNames(names, false, limits, state)) return false;
    for (const name of names) {
      const descriptor = Object.getOwnPropertyDescriptor(value, name);
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        return false;
      }
      if (!isSafeCallerData(descriptor.value, ancestors, limits, state, depth + 1)) return false;
    }
    return true;
  } catch {
    return false;
  } finally {
    ancestors.delete(value);
  }
}

/** Captures only acyclic plain caller data, without invoking accessors. */
export function tryCreateStrictValidationSnapshot<T>(
  value: T,
  limits: StrictValidationSnapshotLimits = {},
): ValidationSnapshot<T> {
  if (
    !isSafeCallerData(
      value,
      new WeakSet<object>(),
      limits,
      { containerCount: 0, propertyCount: 0, stringCodeUnits: 0 },
      0,
    )
  ) {
    return { ok: false, reason: 'non-json-data' };
  }
  return tryCreateValidationSnapshot(value);
}
