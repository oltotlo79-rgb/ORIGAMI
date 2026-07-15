import { orientation2D, type Point2 } from '../geometry/predicates.js';
import { exactOrientationSign, type ExactSign } from '../model/exact-dyadic.js';
import type { JsonValue } from '../stable-json.js';
import type {
  CandidateExperimentDefinition,
  CandidateExperimentExecution,
  CandidateExperimentContext,
} from './contract.js';

export const NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID = 'numeric-kernel.orientation2d-v1' as const;
export const NUMERIC_KERNEL_ORIENTATION_ENGINE_VERSION =
  'oridesign-orientation2d/1.0.0-candidate' as const;

type OrientationParameters = Readonly<{ fastFilterArea: number }>;
type OrientationSample = Readonly<{ a: Point2; b: Point2; c: Point2 }>;
type OrientationInput = Readonly<{ samples: readonly OrientationSample[] }>;

const MAX_SAMPLE_COUNT = 100_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return (
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))
  );
}

function isFinitePoint(value: unknown): value is Point2 {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['x', 'y']) &&
    typeof value.x === 'number' &&
    Number.isFinite(value.x) &&
    typeof value.y === 'number' &&
    Number.isFinite(value.y)
  );
}

function parseParameters(value: unknown): OrientationParameters | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['fastFilterArea']) ||
    typeof value.fastFilterArea !== 'number' ||
    !Number.isFinite(value.fastFilterArea) ||
    value.fastFilterArea < 0
  ) {
    return undefined;
  }
  return { fastFilterArea: value.fastFilterArea };
}

function parseInput(value: unknown): OrientationInput | undefined {
  if (!isRecord(value) || !hasExactKeys(value, ['samples']) || !Array.isArray(value.samples)) {
    return undefined;
  }
  if (value.samples.length === 0 || value.samples.length > MAX_SAMPLE_COUNT) return undefined;
  const samples: OrientationSample[] = [];
  for (const sample of value.samples) {
    if (
      !isRecord(sample) ||
      !hasExactKeys(sample, ['a', 'b', 'c']) ||
      !isFinitePoint(sample.a) ||
      !isFinitePoint(sample.b) ||
      !isFinitePoint(sample.c)
    ) {
      return undefined;
    }
    samples.push({ a: sample.a, b: sample.b, c: sample.c });
  }
  return { samples };
}

function failed(
  reasonCode:
    | 'experiment.numeric-kernel.invalid-parameters'
    | 'experiment.numeric-kernel.invalid-input'
    | 'experiment.numeric-kernel.oracle-mismatch',
  result: JsonValue | null = null,
): CandidateExperimentExecution {
  return { outcome: 'failed', reasonCode, result };
}

function signIndex(sign: ExactSign): 'negative' | 'zero' | 'positive' {
  if (sign < 0) return 'negative';
  if (sign > 0) return 'positive';
  return 'zero';
}

function runOrientationComparison(
  parametersValue: unknown,
  inputValue: unknown,
  context: CandidateExperimentContext,
): CandidateExperimentExecution {
  const parameters = parseParameters(parametersValue);
  if (parameters === undefined) return failed('experiment.numeric-kernel.invalid-parameters');
  const input = parseInput(inputValue);
  if (input === undefined) return failed('experiment.numeric-kernel.invalid-input');

  let fastFilterCount = 0;
  let exactFallbackCount = 0;
  let mismatchCount = 0;
  const signs = { negative: 0, zero: 0, positive: 0 };

  for (const sample of input.samples) {
    context.checkpoint();
    const filtered = orientation2D(sample.a, sample.b, sample.c, parameters);
    if (!filtered.ok) return failed('experiment.numeric-kernel.invalid-input');
    const oracleSign = exactOrientationSign(sample.a, sample.b, sample.c);
    if (filtered.value.path === 'fast-filter') fastFilterCount += 1;
    else exactFallbackCount += 1;
    signs[signIndex(oracleSign)] += 1;
    if (filtered.value.sign !== oracleSign) mismatchCount += 1;
  }

  const result = {
    comparisonCount: input.samples.length,
    fastFilterCount,
    exactFallbackCount,
    mismatchCount,
    oracleAgreement: mismatchCount === 0,
    signCounts: signs,
  };
  if (mismatchCount > 0) {
    return {
      outcome: 'failed',
      reasonCode: 'experiment.numeric-kernel.oracle-mismatch',
      result,
    };
  }
  return { outcome: 'completed', result };
}

/** Candidate experiment only: agreement is measurement data, not a proof or support claim. */
export const NUMERIC_KERNEL_ORIENTATION_EXPERIMENT: CandidateExperimentDefinition = Object.freeze({
  contractStatus: 'candidate',
  scientificClaim: false,
  experimentId: NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID,
  engineVersion: NUMERIC_KERNEL_ORIENTATION_ENGINE_VERSION,
  execute: runOrientationComparison,
});
