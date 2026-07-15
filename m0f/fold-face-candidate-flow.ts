import { deepFreezeOwned } from './clone-and-freeze.js';
import {
  FACE_COMPLEX_AUDIT_ENGINE_VERSION,
  FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
  FACE_COMPLEX_AUDIT_PARAMETERS_V1,
} from './experiments/face-complex-audit.js';
import {
  FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
  FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
  FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1,
} from './experiments/face-reconstruction.js';
import { runCandidateExperimentV1 } from './experiments/runner.js';
import type { CandidateExperimentRecordV1 } from './experiments/contract.js';
import {
  adaptFoldDocumentToFaceReconstructionInputV1,
  type FoldDocumentFaceAdapterIssue,
} from './geometry/fold-document-face-adapter.js';
import type { FoldFaceReconstructionInputV1 } from './geometry/fold-face-input.js';
import { prepareFaceComplexAuditInputV1 } from './geometry/prepare-face-complex-audit-input.js';
import {
  createFaceComplexAuditEvidenceV1,
  reauditFaceComplexAuditEvidenceV1,
  type FaceComplexAuditEvidenceReauditConsistentV1,
  type FaceComplexAuditEvidenceV1,
} from './reference-verifier/face-complex-evidence.js';
import {
  FACE_COMPLEX_MUTATION_SUITE_V1,
  runFaceComplexMutationSuiteV1,
  type FaceComplexMutationSuiteConsistentV1,
} from './reference-verifier/face-complex-mutation-suite.js';
import { stableStringify } from './stable-json.js';

export const FOLD_FACE_CANDIDATE_FLOW_RESULT_RECORD_TYPE =
  'm0f-fold-face-candidate-flow-result' as const;

export type FoldFaceCandidateFlowIssueV1 = Readonly<{
  stage:
    | 'fold-adapter'
    | 'face-reconstruction-experiment'
    | 'audit-input-preparation'
    | 'face-complex-audit-experiment'
    | 'independent-evidence'
    | 'independent-reaudit'
    | 'mutation-suite'
    | 'cross-stage-binding';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
}>;

export type FoldFaceCandidateFlowResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof FOLD_FACE_CANDIDATE_FLOW_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  outputKind: 'fold-nofaces-candidate-diagnostic-not-scientific-verification';
  scope: 'caller-supplied-fold-nofaces-reconstruction-and-face-complex-audit-only';
  canonicalFixtureRegistrationIncluded: false;
  candidateSubgateEvaluated: false;
  normalizedGeometryBound: true;
  rawSourceDocumentBytesBound: false;
  allSourceDocumentMetadataBound: false;
  faceReconstructionExperimentCompleted: true;
  faceComplexAuditExperimentCompleted: true;
  separateProjectiveKernelAuditCompleted: true;
  currentSourceSetEvidenceReauditPassed: true;
  mutationSuiteExpectationsMet: true;
  independentReferenceVerifierIncluded: false;
  referenceVerifierComplete: false;
  toleranceProfileIncluded: false;
  foldabilityVerified: false;
  rigidFoldPathVerified: false;
  collisionFreedomVerified: false;
  layerOrderVerified: false;
  globalM0fGate: 'not-evaluated';
  adaptedInput: FoldFaceReconstructionInputV1;
  reconstructionExperiment: CandidateExperimentRecordV1;
  auditExperiment: CandidateExperimentRecordV1;
  evidence: FaceComplexAuditEvidenceV1;
  reaudit: FaceComplexAuditEvidenceReauditConsistentV1;
  mutationSuite: FaceComplexMutationSuiteConsistentV1;
}>;

export type FoldFaceCandidateFlowEvaluationV1 =
  | Readonly<{ ok: true; value: FoldFaceCandidateFlowResultV1 }>
  | Readonly<{ ok: false; error: readonly FoldFaceCandidateFlowIssueV1[] }>;

function failure(
  error: readonly FoldFaceCandidateFlowIssueV1[],
): FoldFaceCandidateFlowEvaluationV1 {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function adapterFailure(
  error: readonly FoldDocumentFaceAdapterIssue[],
): FoldFaceCandidateFlowEvaluationV1 {
  return failure(
    error.map((entry) => ({
      stage: 'fold-adapter' as const,
      path: entry.path,
      code: entry.code,
      message: entry.message,
    })),
  );
}

function experimentFailure(
  stage: 'face-reconstruction-experiment' | 'face-complex-audit-experiment',
  record: CandidateExperimentRecordV1,
): FoldFaceCandidateFlowEvaluationV1 {
  return failure([
    {
      stage,
      path: '$',
      code: record.reasonCode ?? 'experiment-did-not-complete',
      message: 'candidate experiment must complete before the flow can continue',
    },
  ]);
}

/**
 * Runs an external closed NOFACES FOLD document through the existing candidate
 * reconstruction, independent audit/evidence, and semantic mutation stages.
 * This intentionally does not evaluate the manifest-bound candidate subgate.
 */
export async function evaluateFoldFaceCandidateFlowV1(
  foldDocument: unknown,
): Promise<FoldFaceCandidateFlowEvaluationV1> {
  const adapted = adaptFoldDocumentToFaceReconstructionInputV1(foldDocument);
  if (!adapted.ok) return adapterFailure(adapted.error);

  const reconstructionExperiment = await runCandidateExperimentV1({
    experimentId: FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
    engineVersion: FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
    parameters: FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1,
    input: adapted.value,
    seed: 0x4d30_4633,
    repetition: 0,
  });
  if (
    reconstructionExperiment.outcome !== 'completed' ||
    reconstructionExperiment.result === null
  ) {
    return experimentFailure('face-reconstruction-experiment', reconstructionExperiment);
  }

  const prepared = prepareFaceComplexAuditInputV1(adapted.value, reconstructionExperiment.result);
  if (!prepared.ok) {
    return failure(
      prepared.error.map((entry) => ({
        stage: 'audit-input-preparation' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
        sourceStage: entry.stage,
      })),
    );
  }

  const auditExperiment = await runCandidateExperimentV1({
    experimentId: FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
    engineVersion: FACE_COMPLEX_AUDIT_ENGINE_VERSION,
    parameters: FACE_COMPLEX_AUDIT_PARAMETERS_V1,
    input: prepared.value,
    seed: 0x4d30_4634,
    repetition: 0,
  });
  if (auditExperiment.outcome !== 'completed' || auditExperiment.result === null) {
    return experimentFailure('face-complex-audit-experiment', auditExperiment);
  }

  const evidence = await createFaceComplexAuditEvidenceV1(prepared.value);
  if (!evidence.ok) {
    return failure(
      evidence.error.map((entry) => ({
        stage: 'independent-evidence' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
        sourceStage: entry.stage,
      })),
    );
  }
  const reaudit = await reauditFaceComplexAuditEvidenceV1(evidence.value);
  if (!reaudit.ok) {
    return failure(
      reaudit.error.map((entry) => ({
        stage: 'independent-reaudit' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
        sourceStage: entry.stage,
      })),
    );
  }
  if (stableStringify(auditExperiment.result) !== stableStringify(evidence.value.auditResult)) {
    return failure([
      {
        stage: 'cross-stage-binding',
        path: '$.auditExperiment.result',
        code: 'audit-result-mismatch',
        message: 'experiment audit result must equal the independently persisted audit result',
      },
    ]);
  }

  const mutationSuite = runFaceComplexMutationSuiteV1(
    prepared.value,
    FACE_COMPLEX_MUTATION_SUITE_V1,
  );
  if (!mutationSuite.ok) {
    return failure(
      mutationSuite.error.map((entry) => ({
        stage: 'mutation-suite' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
        sourceStage: entry.stage,
      })),
    );
  }

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: FOLD_FACE_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      outputKind: 'fold-nofaces-candidate-diagnostic-not-scientific-verification' as const,
      scope: 'caller-supplied-fold-nofaces-reconstruction-and-face-complex-audit-only' as const,
      canonicalFixtureRegistrationIncluded: false as const,
      candidateSubgateEvaluated: false as const,
      normalizedGeometryBound: true as const,
      rawSourceDocumentBytesBound: false as const,
      allSourceDocumentMetadataBound: false as const,
      faceReconstructionExperimentCompleted: true as const,
      faceComplexAuditExperimentCompleted: true as const,
      separateProjectiveKernelAuditCompleted: true as const,
      currentSourceSetEvidenceReauditPassed: true as const,
      mutationSuiteExpectationsMet: true as const,
      independentReferenceVerifierIncluded: false as const,
      referenceVerifierComplete: false as const,
      toleranceProfileIncluded: false as const,
      foldabilityVerified: false as const,
      rigidFoldPathVerified: false as const,
      collisionFreedomVerified: false as const,
      layerOrderVerified: false as const,
      globalM0fGate: 'not-evaluated' as const,
      adaptedInput: adapted.value,
      reconstructionExperiment,
      auditExperiment,
      evidence: evidence.value,
      reaudit: reaudit.value,
      mutationSuite: mutationSuite.value,
    },
  });
}
