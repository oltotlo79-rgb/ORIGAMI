import { enumerateSquareGridCandidatesV1 } from '../box-pleating/square-grid-candidates.js';
import type { JsonValue } from '../stable-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import type {
  CandidateExperimentContext,
  CandidateExperimentDefinition,
  CandidateExperimentExecution,
} from './contract.js';

export const SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID =
  'box-pleating.square-grid-quantization-v1' as const;
export const SQUARE_GRID_QUANTIZATION_ENGINE_VERSION =
  'oridesign-square-grid-quantization/1.0.0-candidate' as const;

/**
 * Closed engine parameters. These describe only the deterministic grid and
 * branch-dimension quantization slice; placement and pleat routing are absent.
 */
export const SQUARE_GRID_QUANTIZATION_PARAMETERS_V1 = Object.freeze({
  arithmetic: 'exact-binary64-to-bigint-rational',
  cellShape: 'square',
  enumeration: 'paper-axis-anchored',
  quantizationRule: 'nearest-integer-half-up',
  scope: 'square-grid-quantization-only',
  placementIncluded: false,
  pleatRoutingIncluded: false,
} as const);

const PARAMETER_KEYS = [
  'arithmetic',
  'cellShape',
  'enumeration',
  'quantizationRule',
  'scope',
  'placementIncluded',
  'pleatRoutingIncluded',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validParameters(value: unknown): boolean {
  const snapshot = tryCreateStrictValidationSnapshot(value);
  if (!snapshot.ok || !isRecord(snapshot.value)) return false;
  const parameters = snapshot.value;
  if (
    Object.keys(parameters).length !== PARAMETER_KEYS.length ||
    !PARAMETER_KEYS.every((key) => Object.hasOwn(parameters, key))
  ) {
    return false;
  }
  return (
    parameters.arithmetic === SQUARE_GRID_QUANTIZATION_PARAMETERS_V1.arithmetic &&
    parameters.cellShape === SQUARE_GRID_QUANTIZATION_PARAMETERS_V1.cellShape &&
    parameters.enumeration === SQUARE_GRID_QUANTIZATION_PARAMETERS_V1.enumeration &&
    parameters.quantizationRule === SQUARE_GRID_QUANTIZATION_PARAMETERS_V1.quantizationRule &&
    parameters.scope === SQUARE_GRID_QUANTIZATION_PARAMETERS_V1.scope &&
    parameters.placementIncluded === false &&
    parameters.pleatRoutingIncluded === false
  );
}

function executeSquareGridQuantization(
  parameters: unknown,
  input: unknown,
  context: CandidateExperimentContext,
): CandidateExperimentExecution {
  if (!validParameters(parameters)) {
    return {
      outcome: 'failed',
      reasonCode: 'experiment.square-grid-quantization.invalid-parameters',
      result: null,
    };
  }

  context.checkpoint();
  const enumerated = enumerateSquareGridCandidatesV1(input);
  context.checkpoint();
  if (!enumerated.ok) {
    return {
      outcome: 'failed',
      reasonCode: 'experiment.square-grid-quantization.invalid-input',
      result: {
        contractStatus: 'candidate',
        scientificClaim: false,
        issues: enumerated.error,
      } as unknown as JsonValue,
    };
  }

  // An empty candidate list is still a completed bounded enumeration. It is
  // deliberately not mapped to a failure or a no-solution claim.
  return { outcome: 'completed', result: enumerated.value as unknown as JsonValue };
}

/** Candidate quantization measurement only; it does not place or route a box pleat. */
export const SQUARE_GRID_QUANTIZATION_EXPERIMENT: CandidateExperimentDefinition = Object.freeze({
  contractStatus: 'candidate',
  scientificClaim: false,
  experimentId: SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
  engineVersion: SQUARE_GRID_QUANTIZATION_ENGINE_VERSION,
  execute: executeSquareGridQuantization,
});
