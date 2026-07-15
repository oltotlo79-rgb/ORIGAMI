import { reconstructFoldFacesCandidateV1 } from '../geometry/reconstruct-fold-faces.js';
import type { JsonValue } from '../stable-json.js';
import type {
  CandidateExperimentContext,
  CandidateExperimentDefinition,
  CandidateExperimentExecution,
} from './contract.js';

export const FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID =
  'geometry.fold-face-reconstruction-v1' as const;
export const FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION =
  'oridesign-fold-face-reconstruction/1.0.0-candidate' as const;

export const FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1 = Object.freeze({
  coordinateKernel: 'exact-bigint-rational',
  triangulation: 'deterministic-ear-clipping',
  emitFoldProjection: true,
} as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validParameters(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.keys(value).length === 3 &&
    value.coordinateKernel === FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1.coordinateKernel &&
    value.triangulation === FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1.triangulation &&
    value.emitFoldProjection === true
  );
}

function executeFaceReconstruction(
  parameters: unknown,
  input: unknown,
  context: CandidateExperimentContext,
): CandidateExperimentExecution {
  if (!validParameters(parameters)) {
    return {
      outcome: 'failed',
      reasonCode: 'experiment.face-reconstruction.invalid-parameters',
      result: null,
    };
  }
  context.checkpoint();
  const reconstructed = reconstructFoldFacesCandidateV1(input);
  context.checkpoint();
  if (!reconstructed.ok) {
    const stages = [...new Set(reconstructed.error.map((issue) => issue.stage))];
    const reasonCode = stages.includes('input')
      ? 'experiment.face-reconstruction.invalid-input'
      : stages.includes('triangulation') || stages.includes('fold-projection')
        ? 'experiment.face-reconstruction.invariant-failed'
        : 'experiment.face-reconstruction.topology-rejected';
    return {
      outcome: 'failed',
      reasonCode,
      result: {
        contractStatus: 'candidate',
        scientificClaim: false,
        issues: reconstructed.error,
      } as unknown as JsonValue,
    };
  }
  return { outcome: 'completed', result: reconstructed.value as unknown as JsonValue };
}

/** Candidate measurement only; successful reconstruction is not a foldability claim. */
export const FOLD_FACE_RECONSTRUCTION_EXPERIMENT: CandidateExperimentDefinition = Object.freeze({
  contractStatus: 'candidate',
  scientificClaim: false,
  experimentId: FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
  engineVersion: FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
  execute: executeFaceReconstruction,
});
