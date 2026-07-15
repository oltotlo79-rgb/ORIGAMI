import {
  createCandidateExperimentRecordV1,
  createCandidateExperimentRegistry,
  captureCandidateExperimentDefinition,
  hashExperimentValue,
  inspectStableJson,
  inspectCandidateResultClaimBoundary,
  isExperimentReasonCode,
  isValidEngineVersion,
  isValidExperimentId,
  isValidExperimentRepetition,
  isValidExperimentSeed,
  type CandidateExperimentExecution,
  type CandidateExperimentRecordV1,
  type CandidateExperimentRegistry,
  type CandidateExperimentRequestV1,
  type ExperimentReasonCode,
  type Sha256Prefixed,
} from './contract.js';
import { tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { NUMERIC_KERNEL_ORIENTATION_EXPERIMENT } from './numeric-kernel.js';
import { FOLD_FACE_RECONSTRUCTION_EXPERIMENT } from './face-reconstruction.js';
import { FACE_COMPLEX_AUDIT_EXPERIMENT } from './face-complex-audit.js';
import { SQUARE_GRID_QUANTIZATION_EXPERIMENT } from './square-grid-quantization.js';
import { validateCompletedExperimentResult } from './result-validation.js';
import type { JsonValue } from '../stable-json.js';

export const DEFAULT_CANDIDATE_EXPERIMENT_REGISTRY = createCandidateExperimentRegistry([
  FACE_COMPLEX_AUDIT_EXPERIMENT,
  FOLD_FACE_RECONSTRUCTION_EXPERIMENT,
  NUMERIC_KERNEL_ORIENTATION_EXPERIMENT,
  SQUARE_GRID_QUANTIZATION_EXPERIMENT,
]);

class ExperimentCancelledError extends Error {
  constructor() {
    super('candidate experiment was cancelled');
    this.name = 'ExperimentCancelledError';
  }
}

type RecordProvenance = Readonly<{
  experimentId: string | null;
  engineVersion: string | null;
  parameterHash: Sha256Prefixed | null;
  inputHash: Sha256Prefixed | null;
  seed: number | null;
  repetition: number | null;
}>;

async function failureRecord(
  provenance: RecordProvenance,
  reasonCode: ExperimentReasonCode,
  result: JsonValue | null = null,
): Promise<CandidateExperimentRecordV1> {
  return createCandidateExperimentRecordV1({
    ...provenance,
    outcome: 'failed',
    reasonCode,
    result,
  });
}

function requestStableFailure(
  parameterKind: 'non-finite-number' | 'invalid-json' | undefined,
  inputKind: 'non-finite-number' | 'invalid-json' | undefined,
): ExperimentReasonCode | undefined {
  if (parameterKind === 'non-finite-number' || inputKind === 'non-finite-number') {
    return 'experiment.request.non-finite-number';
  }
  if (parameterKind === 'invalid-json' || inputKind === 'invalid-json') {
    return 'experiment.request.invalid-json';
  }
  return undefined;
}

function parseExecution(value: unknown): CandidateExperimentExecution | undefined {
  const snapshot = tryCreateValidationSnapshot(value);
  if (!snapshot.ok) return undefined;
  if (
    typeof snapshot.value !== 'object' ||
    snapshot.value === null ||
    Array.isArray(snapshot.value)
  )
    return undefined;
  const record = snapshot.value as Record<string, unknown>;
  if (record.outcome === 'completed') {
    if (
      Object.keys(record).length !== 2 ||
      !Object.hasOwn(record, 'result') ||
      record.result === null
    ) {
      return undefined;
    }
    return { outcome: 'completed', result: record.result as JsonValue };
  }
  if (record.outcome === 'failed') {
    if (
      Object.keys(record).length !== 3 ||
      !Object.hasOwn(record, 'reasonCode') ||
      !Object.hasOwn(record, 'result')
    ) {
      return undefined;
    }
    const reasonCode = record.reasonCode;
    if (!isExperimentReasonCode(reasonCode)) {
      return undefined;
    }
    return {
      outcome: 'failed',
      reasonCode,
      result: record.result as JsonValue | null,
    };
  }
  return undefined;
}

/**
 * Runs one registered candidate experiment and returns a deterministic semantic record.
 * No timestamp, duration, host information, or exception message enters the record.
 */
export async function runCandidateExperimentV1(
  request: CandidateExperimentRequestV1,
  registry: CandidateExperimentRegistry = DEFAULT_CANDIDATE_EXPERIMENT_REGISTRY,
): Promise<CandidateExperimentRecordV1> {
  const experimentId = request.experimentId;
  const engineVersion = request.engineVersion;
  const parameters = tryCreateValidationSnapshot(request.parameters);
  const input = tryCreateValidationSnapshot(request.input);
  const seed = request.seed;
  const repetition = request.repetition;
  const signal = request.signal;
  const signalAborted = (): boolean => signal?.aborted ?? false;
  const invalidJson = { ok: false, kind: 'invalid-json' } as const;
  const [parameterResult, inputResult] = await Promise.all([
    parameters.ok ? hashExperimentValue('parameter', parameters.value) : invalidJson,
    input.ok ? hashExperimentValue('input', input.value) : invalidJson,
  ]);
  const provenance: RecordProvenance = {
    experimentId: isValidExperimentId(experimentId) ? experimentId : null,
    engineVersion: isValidEngineVersion(engineVersion) ? engineVersion : null,
    parameterHash: parameterResult.ok ? parameterResult.hash : null,
    inputHash: inputResult.ok ? inputResult.hash : null,
    seed: isValidExperimentSeed(seed) ? seed : null,
    repetition: isValidExperimentRepetition(repetition) ? repetition : null,
  };

  if (provenance.experimentId === null) {
    return failureRecord(provenance, 'experiment.request.invalid-id');
  }
  if (provenance.engineVersion === null) {
    return failureRecord(provenance, 'experiment.request.invalid-engine-version');
  }
  if (provenance.seed === null) {
    return failureRecord(provenance, 'experiment.request.invalid-seed');
  }
  if (provenance.repetition === null) {
    return failureRecord(provenance, 'experiment.request.invalid-repetition');
  }
  const stableFailure = requestStableFailure(
    parameterResult.ok ? undefined : parameterResult.kind,
    inputResult.ok ? undefined : inputResult.kind,
  );
  if (stableFailure !== undefined) return failureRecord(provenance, stableFailure);
  if (signalAborted()) {
    return failureRecord(provenance, 'experiment.execution.cancelled');
  }

  let resolvedDefinition: unknown;
  try {
    resolvedDefinition = registry.resolve(provenance.experimentId);
  } catch {
    return failureRecord(provenance, 'experiment.execution.exception');
  }
  if (resolvedDefinition === undefined) return failureRecord(provenance, 'experiment.unknown-id');
  const definition = captureCandidateExperimentDefinition(resolvedDefinition);
  if (definition === undefined) {
    return failureRecord(provenance, 'experiment.execution.exception');
  }
  if (definition.engineVersion !== provenance.engineVersion) {
    return failureRecord(provenance, 'experiment.engine-version-mismatch');
  }

  let execution: CandidateExperimentExecution;
  try {
    const checkpoint = (): void => {
      if (signalAborted()) throw new ExperimentCancelledError();
    };
    checkpoint();
    if (!parameters.ok || !input.ok) {
      return await failureRecord(provenance, 'experiment.request.invalid-json');
    }
    const rawExecution: unknown = await definition.execute(parameters.value, input.value, {
      seed: provenance.seed,
      repetition: provenance.repetition,
      signal,
      checkpoint,
    });
    checkpoint();
    const parsed = parseExecution(rawExecution);
    if (parsed === undefined) {
      return await failureRecord(provenance, 'experiment.result.invalid-json');
    }
    execution = parsed;
  } catch (error) {
    if (error instanceof ExperimentCancelledError || signalAborted()) {
      return failureRecord(provenance, 'experiment.execution.cancelled');
    }
    return failureRecord(provenance, 'experiment.execution.exception');
  }

  const inspected = inspectStableJson(execution.result);
  if (!inspected.ok) {
    return failureRecord(
      provenance,
      inspected.kind === 'non-finite-number'
        ? 'experiment.result.non-finite-number'
        : 'experiment.result.invalid-json',
    );
  }
  if (!inspectCandidateResultClaimBoundary(execution.result).ok) {
    return failureRecord(provenance, 'experiment.result.claim-boundary');
  }
  if (execution.outcome === 'failed') {
    return failureRecord(provenance, execution.reasonCode, execution.result);
  }
  if (!validateCompletedExperimentResult(provenance.experimentId, execution.result).ok) {
    return failureRecord(provenance, 'experiment.result.invalid-json');
  }
  return createCandidateExperimentRecordV1({
    ...provenance,
    outcome: 'completed',
    reasonCode: null,
    result: execution.result,
  });
}
