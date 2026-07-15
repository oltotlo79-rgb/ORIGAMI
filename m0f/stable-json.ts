export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export class StableJsonError extends TypeError {
  readonly path: string;

  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = 'StableJsonError';
    this.path = path;
  }
}

/**
 * Deterministic JSON serialization for M0F records.
 *
 * Object keys are sorted by JavaScript code-unit order, array order is
 * preserved, negative zero is normalized to zero, and values that JSON would
 * silently discard are rejected. This is intentionally a small, version-1
 * project convention, not a claim of RFC 8785 compliance.
 */
export function stableStringify(value: unknown): string {
  const ancestors = new Set<object>();

  const visit = (current: unknown, path: string): string => {
    if (current === null) {
      return 'null';
    }

    switch (typeof current) {
      case 'boolean':
      case 'string':
        return JSON.stringify(current);
      case 'number':
        if (!Number.isFinite(current)) {
          throw new StableJsonError(path, 'number must be finite');
        }
        return Object.is(current, -0) ? '0' : JSON.stringify(current);
      case 'undefined':
      case 'bigint':
      case 'function':
      case 'symbol':
        throw new StableJsonError(path, `unsupported value type: ${typeof current}`);
      case 'object':
        break;
      default:
        throw new StableJsonError(path, 'unsupported runtime value');
    }

    if (ancestors.has(current)) {
      throw new StableJsonError(path, 'cyclic value is not valid JSON');
    }
    ancestors.add(current);

    try {
      if (Array.isArray(current)) {
        const values: string[] = [];
        for (let index = 0; index < current.length; index += 1) {
          if (!(index in current)) {
            throw new StableJsonError(`${path}[${index}]`, 'sparse arrays are not supported');
          }
          values.push(visit(current[index], `${path}[${index}]`));
        }
        return `[${values.join(',')}]`;
      }

      const prototype: unknown = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new StableJsonError(path, 'only plain objects are supported');
      }
      if (Object.getOwnPropertySymbols(current).length > 0) {
        throw new StableJsonError(path, 'symbol keys are not supported');
      }

      const record = current as Record<string, unknown>;
      const fields = Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${visit(record[key], `${path}.${key}`)}`);
      return `{${fields.join(',')}}`;
    } finally {
      ancestors.delete(current);
    }
  };

  return visit(value, '$');
}

export function serializeJsonLine(value: unknown): string {
  return `${stableStringify(value)}\n`;
}
