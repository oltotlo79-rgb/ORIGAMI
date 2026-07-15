import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { exactRational, type ExactRational, type ExactRationalPoint2 } from './exact-rational.js';

export const EXACT_RATIONAL_JSON_ENCODING_ID = 'oridesign-exact-rational-json-v1' as const;

export type ExactRationalJsonV1 = Readonly<{
  numerator: string;
  denominator: string;
}>;

export type ExactRationalPointJsonV1 = Readonly<{
  x: ExactRationalJsonV1;
  y: ExactRationalJsonV1;
}>;

export type ExactRationalJsonIssue = Readonly<{
  path: string;
  code:
    'invalid-snapshot' | 'invalid-object' | 'unknown-field' | 'invalid-integer' | 'not-normalized';
  message: string;
}>;

export type ExactRationalJsonParseResult =
  | Readonly<{ ok: true; value: ExactRational }>
  | Readonly<{ ok: false; error: readonly ExactRationalJsonIssue[] }>;

const INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

export function exactRationalToJsonV1(value: ExactRational): ExactRationalJsonV1 {
  if (value.denominator <= 0n) {
    throw new TypeError('exact rational JSON serialization requires a positive denominator');
  }
  const normalized = exactRational(value.numerator, value.denominator);
  if (normalized.numerator !== value.numerator || normalized.denominator !== value.denominator) {
    throw new TypeError('exact rational JSON serialization requires a reduced canonical value');
  }
  return deepFreezeOwned({
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString(),
  });
}

export function exactRationalPointToJsonV1(point: ExactRationalPoint2): ExactRationalPointJsonV1 {
  return deepFreezeOwned({
    x: exactRationalToJsonV1(point.x),
    y: exactRationalToJsonV1(point.y),
  });
}

/** Parses only the unique reduced representation emitted by `exactRationalToJsonV1`. */
export function parseExactRationalJsonV1(supplied: unknown): ExactRationalJsonParseResult {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot',
          message: 'value must be one cloneable plain JSON-data snapshot',
        },
      ],
    };
  }
  const raw = snapshot.value;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-object', message: 'value must be an object' }],
    };
  }
  const record = raw as Record<string, unknown>;
  const issues: ExactRationalJsonIssue[] = [];
  for (const key of Object.keys(record)) {
    if (key !== 'numerator' && key !== 'denominator') {
      issues.push({
        path: `$.${key}`,
        code: 'unknown-field',
        message: 'field is not declared by exact-rational JSON v1',
      });
    }
  }
  const numerator = record.numerator;
  const denominator = record.denominator;
  if (typeof numerator !== 'string' || !INTEGER_PATTERN.test(numerator)) {
    issues.push({
      path: '$.numerator',
      code: 'invalid-integer',
      message: 'must be a canonical base-10 integer string',
    });
  }
  if (typeof denominator !== 'string' || !POSITIVE_INTEGER_PATTERN.test(denominator)) {
    issues.push({
      path: '$.denominator',
      code: 'invalid-integer',
      message: 'must be a canonical positive base-10 integer string',
    });
  }
  if (issues.length > 0) return { ok: false, error: issues };
  if (typeof numerator !== 'string' || typeof denominator !== 'string') {
    throw new TypeError('integer strings were already validated');
  }
  const value = exactRational(BigInt(numerator), BigInt(denominator));
  if (value.numerator.toString() !== numerator || value.denominator.toString() !== denominator) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'not-normalized',
          message: 'fraction must be reduced, use a positive denominator, and encode zero as 0/1',
        },
      ],
    };
  }
  return { ok: true, value };
}
