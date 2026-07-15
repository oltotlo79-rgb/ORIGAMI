import { parseFaceComplexAuditInputV1 } from '../reference-verifier/face-complex-contract.js';
import { auditFaceComplexCandidateV1 } from '../reference-verifier/face-complex-v1.js';
import type {
  CandidateExperimentContext,
  CandidateExperimentDefinition,
  CandidateExperimentExecution,
} from './contract.js';

export const FACE_COMPLEX_AUDIT_EXPERIMENT_ID = 'geometry.fold-face-complex-audit-v1' as const;
export const FACE_COMPLEX_AUDIT_ENGINE_VERSION =
  'oridesign-independent-face-complex-auditor/1.0.0-candidate' as const;

export const FACE_COMPLEX_AUDIT_PARAMETERS_V1 = Object.freeze({
  coordinateKernel: 'homogeneous-projective-bigint',
  scope: 'face-complex-only',
} as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validParameters(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.keys(value).length === 2 &&
    value.coordinateKernel === FACE_COMPLEX_AUDIT_PARAMETERS_V1.coordinateKernel &&
    value.scope === FACE_COMPLEX_AUDIT_PARAMETERS_V1.scope
  );
}

function executeFaceComplexAudit(
  parameters: unknown,
  input: unknown,
  context: CandidateExperimentContext,
): CandidateExperimentExecution {
  if (!validParameters(parameters)) {
    return {
      outcome: 'failed',
      reasonCode: 'experiment.face-complex-audit.invalid-parameters',
      result: null,
    };
  }

  context.checkpoint();
  const parsed = parseFaceComplexAuditInputV1(input);
  if (!parsed.ok) {
    return {
      outcome: 'failed',
      reasonCode: 'experiment.face-complex-audit.invalid-contract',
      result: null,
    };
  }

  context.checkpoint();
  const audited = auditFaceComplexCandidateV1(parsed.value);
  context.checkpoint();
  if (!audited.ok) {
    return {
      outcome: 'failed',
      reasonCode: 'experiment.face-complex-audit.inconsistent',
      result: null,
    };
  }
  return { outcome: 'completed', result: audited.value };
}

/** Candidate face-complex consistency measurement; it makes no scientific claim. */
export const FACE_COMPLEX_AUDIT_EXPERIMENT: CandidateExperimentDefinition = Object.freeze({
  contractStatus: 'candidate',
  scientificClaim: false,
  experimentId: FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
  engineVersion: FACE_COMPLEX_AUDIT_ENGINE_VERSION,
  execute: executeFaceComplexAudit,
});
