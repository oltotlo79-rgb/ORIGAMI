import { parseArtifactContractV1 } from './artifacts/contract.js';
import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
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

export const MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT_RECORD_TYPE =
  'm0f-mutation-verifier-candidate-flow-input' as const;
export const MUTATION_VERIFIER_CANDIDATE_FLOW_RESULT_RECORD_TYPE =
  'm0f-mutation-verifier-candidate-flow-result' as const;

export type ParserOnlyMutationCaseInputV1 = Readonly<{
  caseId: string;
  detector: 'parseArtifactContractV1';
  sourceDocument: unknown;
  expectedIssues: readonly Readonly<{ path: string; code: string }>[];
}>;

export type MutationVerifierCandidateFlowIssueV1 = Readonly<{
  stage:
    | 'flow-input'
    | 'parser-only-replay'
    | 'independent-face-evidence'
    | 'current-face-reaudit'
    | 'face-mutation-suite'
    | 'cross-stage-binding';
  path: string;
  code: string;
  message: string;
  caseId?: string;
  sourceStage?: string;
}>;

export type ParserOnlyMutationReplayV1 = Readonly<{
  caseIndex: number;
  caseId: string;
  detector: 'parseArtifactContractV1';
  verificationClass: 'parser-exact-issue-regression-only';
  expectedIssuesMatched: true;
  observedIssues: readonly Readonly<{ path: string; code: string }>[];
  independentVerifierIncluded: false;
  canonicalManifestRegistrationEvaluated: false;
  canonicalPromotionClaimed: false;
  scientificClaim: false;
}>;

export type MutationVerifierCandidateFlowResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof MUTATION_VERIFIER_CANDIDATE_FLOW_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  outputKind: 'separated-parser-regression-and-independent-audit-diagnostic';
  parserOnlyReplay: Readonly<{
    verificationClass: 'parser-exact-issue-regression-only';
    caseCount: number;
    everyExpectedIssueSignatureMatched: true;
    independentVerifierIncluded: false;
    acceptedControlsReplayed: false;
    changedPathsCompared: false;
    bundleLedgersVerified: false;
    artifactHashesVerified: false;
    deterministicBundleRegenerationVerified: false;
    cases: readonly ParserOnlyMutationReplayV1[];
  }>;
  independentFaceComplexAudit: Readonly<{
    verificationClass: 'separate-projective-kernel-current-source-set-audit';
    auditScope: 'face-complex-only';
    evidenceCreated: true;
    currentSourceSetReauditPassed: true;
    savedEvidenceReplayed: false;
    sourceProvenanceVerified: false;
    mutationSuiteExpectationsMet: true;
    mutationCaseCount: number;
    mutationSuiteVerificationClass: 'semantic-mutation-regression-not-full-reference-verifier';
    mutationSuiteIndependentVerifierIncluded: false;
    fullReferenceVerifierIncluded: false;
    evidence: FaceComplexAuditEvidenceV1;
    reaudit: FaceComplexAuditEvidenceReauditConsistentV1;
    mutationSuite: FaceComplexMutationSuiteConsistentV1;
  }>;
  parserOnlyAndIndependentResultsKeptSeparate: true;
  parserOnlyCasesIndependentlyVerified: false;
  canonicalManifestEvaluated: false;
  canonicalMutationFamilyComplete: false;
  independentVerificationScope: 'face-complex-only';
  independentPathVerifierIncluded: false;
  independentContactVerifierIncluded: false;
  independentLayerVerifierIncluded: false;
  fullIndependentReferenceVerifierIncluded: false;
  sourceDocumentBytesBound: false;
  sourceArtifactProvenanceVerified: false;
  savedEvidenceProvenanceVerified: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  physicalPathContinuityVerified: false;
  collisionFreedomVerified: false;
  layerOrderVerified: false;
  foldabilityVerified: false;
  verifiedClaim: false;
  globalM0fGate: 'not-evaluated';
}>;

export type MutationVerifierCandidateFlowEvaluationV1 =
  | Readonly<{ ok: true; value: MutationVerifierCandidateFlowResultV1 }>
  | Readonly<{ ok: false; error: readonly MutationVerifierCandidateFlowIssueV1[] }>;

type ParsedInput = Readonly<{
  faceComplexAuditInput: unknown;
  parserOnlyCases: readonly ParserOnlyMutationCaseInputV1[];
}>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'faceComplexAuditInput',
  'parserOnlyCases',
] as const;
const CASE_KEYS = ['caseId', 'detector', 'sourceDocument', 'expectedIssues'] as const;
const ISSUE_KEYS = ['path', 'code'] as const;
const CASE_ID_PATTERN = /^[A-Z0-9][A-Z0-9._:-]{0,127}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function failure(
  error: readonly MutationVerifierCandidateFlowIssueV1[],
): MutationVerifierCandidateFlowEvaluationV1 {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function inputIssue(
  path: string,
  code: string,
  message: string,
): MutationVerifierCandidateFlowIssueV1 {
  return { stage: 'flow-input', path, code, message };
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  issues: MutationVerifierCandidateFlowIssueV1[],
): void {
  const expectedSet = new Set(expected);
  Object.keys(value).forEach((key) => {
    if (!expectedSet.has(key))
      issues.push(inputIssue(`${path}.${key}`, 'unknown-field', 'unknown field'));
  });
  expected.forEach((key) => {
    if (!Object.hasOwn(value, key))
      issues.push(inputIssue(`${path}.${key}`, 'missing-field', 'required field'));
  });
}

function parseFlowInput(supplied: unknown):
  | Readonly<{ ok: true; value: ParsedInput }>
  | Readonly<{
      ok: false;
      error: readonly MutationVerifierCandidateFlowIssueV1[];
    }> {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok || !isRecord(snapshot.value)) {
    return {
      ok: false,
      error: [inputIssue('$', 'invalid-snapshot', 'input must be one plain JSON-data object')],
    };
  }
  const raw = snapshot.value;
  const issues: MutationVerifierCandidateFlowIssueV1[] = [];
  exactKeys(raw, ROOT_KEYS, '$', issues);
  const literals: readonly [string, unknown, unknown][] = [
    ['$.schemaVersion', raw.schemaVersion, 1],
    ['$.recordType', raw.recordType, MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT_RECORD_TYPE],
    ['$.contractStatus', raw.contractStatus, 'candidate'],
    ['$.scientificClaim', raw.scientificClaim, false],
  ];
  literals.forEach(([path, actual, expected]) => {
    if (actual !== expected)
      issues.push(inputIssue(path, 'invalid-literal', `must equal ${String(expected)}`));
  });
  const cases: ParserOnlyMutationCaseInputV1[] = [];
  const seenCaseIds = new Set<string>();
  if (!Array.isArray(raw.parserOnlyCases) || raw.parserOnlyCases.length === 0) {
    issues.push(
      inputIssue('$.parserOnlyCases', 'invalid-array', 'requires at least one parser-only case'),
    );
  } else {
    raw.parserOnlyCases.forEach((caseValue, caseIndex) => {
      const casePath = `$.parserOnlyCases[${caseIndex}]`;
      if (!isRecord(caseValue)) {
        issues.push(inputIssue(casePath, 'invalid-object', 'case must be an object'));
        return;
      }
      exactKeys(caseValue, CASE_KEYS, casePath, issues);
      const caseId = caseValue.caseId;
      if (typeof caseId !== 'string' || !CASE_ID_PATTERN.test(caseId)) {
        issues.push(inputIssue(`${casePath}.caseId`, 'invalid-case-id', 'caseId is invalid'));
        return;
      }
      if (seenCaseIds.has(caseId)) {
        issues.push(inputIssue(`${casePath}.caseId`, 'duplicate-case-id', 'caseId is duplicated'));
      }
      seenCaseIds.add(caseId);
      if (caseValue.detector !== 'parseArtifactContractV1') {
        issues.push(
          inputIssue(
            `${casePath}.detector`,
            'invalid-literal',
            'detector must equal parseArtifactContractV1',
          ),
        );
      }
      const expectedIssues: { path: string; code: string }[] = [];
      if (!Array.isArray(caseValue.expectedIssues) || caseValue.expectedIssues.length === 0) {
        issues.push(
          inputIssue(`${casePath}.expectedIssues`, 'invalid-array', 'requires expected issues'),
        );
      } else {
        caseValue.expectedIssues.forEach((expectedIssue, issueIndex) => {
          const issuePath = `${casePath}.expectedIssues[${issueIndex}]`;
          if (!isRecord(expectedIssue)) {
            issues.push(
              inputIssue(issuePath, 'invalid-object', 'expected issue must be an object'),
            );
            return;
          }
          exactKeys(expectedIssue, ISSUE_KEYS, issuePath, issues);
          if (typeof expectedIssue.path !== 'string' || typeof expectedIssue.code !== 'string') {
            issues.push(
              inputIssue(issuePath, 'invalid-issue-signature', 'path and code must be strings'),
            );
            return;
          }
          expectedIssues.push({ path: expectedIssue.path, code: expectedIssue.code });
        });
      }
      cases.push({
        caseId,
        detector: 'parseArtifactContractV1',
        sourceDocument: caseValue.sourceDocument,
        expectedIssues,
      });
    });
  }
  if (issues.length > 0) return { ok: false, error: issues };
  return {
    ok: true,
    value: { faceComplexAuditInput: raw.faceComplexAuditInput, parserOnlyCases: cases },
  };
}

/** Runs parser regressions and independent face auditing as explicitly separate classes. */
export async function evaluateMutationVerifierCandidateFlowV1(
  supplied: unknown,
): Promise<MutationVerifierCandidateFlowEvaluationV1> {
  const parsed = parseFlowInput(supplied);
  if (!parsed.ok) return failure(parsed.error);

  const parserOnlyCases: ParserOnlyMutationReplayV1[] = [];
  for (const [caseIndex, caseValue] of parsed.value.parserOnlyCases.entries()) {
    const replay = parseArtifactContractV1(caseValue.sourceDocument);
    if (replay.ok) {
      return failure([
        {
          stage: 'parser-only-replay',
          path: `$.parserOnlyCases[${caseIndex}].sourceDocument`,
          code: 'negative-source-accepted',
          message: 'parser-only negative source must be rejected',
          caseId: caseValue.caseId,
        },
      ]);
    }
    const observedIssues = replay.error.map(({ path, code }) => ({ path, code }));
    if (stableStringify(observedIssues) !== stableStringify(caseValue.expectedIssues)) {
      return failure([
        {
          stage: 'parser-only-replay',
          path: `$.parserOnlyCases[${caseIndex}].expectedIssues`,
          code: 'issue-signature-mismatch',
          message: 'complete ordered parser issue signature must match the saved expectation',
          caseId: caseValue.caseId,
        },
      ]);
    }
    parserOnlyCases.push({
      caseIndex,
      caseId: caseValue.caseId,
      detector: 'parseArtifactContractV1',
      verificationClass: 'parser-exact-issue-regression-only',
      expectedIssuesMatched: true,
      observedIssues,
      independentVerifierIncluded: false,
      canonicalManifestRegistrationEvaluated: false,
      canonicalPromotionClaimed: false,
      scientificClaim: false,
    });
  }

  const evidence = await createFaceComplexAuditEvidenceV1(parsed.value.faceComplexAuditInput);
  if (!evidence.ok) {
    return failure(
      evidence.error.map((entry) => ({
        stage: 'independent-face-evidence' as const,
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
        stage: 'current-face-reaudit' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
        sourceStage: entry.stage,
      })),
    );
  }
  const mutationSuite = runFaceComplexMutationSuiteV1(
    parsed.value.faceComplexAuditInput,
    FACE_COMPLEX_MUTATION_SUITE_V1,
  );
  if (!mutationSuite.ok) {
    return failure(
      mutationSuite.error.map((entry) => ({
        stage: 'face-mutation-suite' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
        sourceStage: entry.stage,
      })),
    );
  }
  if (stableStringify(evidence.value.auditResult) !== stableStringify(reaudit.value.auditResult)) {
    return failure([
      {
        stage: 'cross-stage-binding',
        path: '$.independentFaceComplexAudit',
        code: 'face-audit-result-mismatch',
        message: 'stored and freshly replayed face audit results must match',
      },
    ]);
  }

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: MUTATION_VERIFIER_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      outputKind: 'separated-parser-regression-and-independent-audit-diagnostic' as const,
      parserOnlyReplay: {
        verificationClass: 'parser-exact-issue-regression-only' as const,
        caseCount: parserOnlyCases.length,
        everyExpectedIssueSignatureMatched: true as const,
        independentVerifierIncluded: false as const,
        acceptedControlsReplayed: false as const,
        changedPathsCompared: false as const,
        bundleLedgersVerified: false as const,
        artifactHashesVerified: false as const,
        deterministicBundleRegenerationVerified: false as const,
        cases: parserOnlyCases,
      },
      independentFaceComplexAudit: {
        verificationClass: 'separate-projective-kernel-current-source-set-audit' as const,
        auditScope: 'face-complex-only' as const,
        evidenceCreated: true as const,
        currentSourceSetReauditPassed: true as const,
        savedEvidenceReplayed: false as const,
        sourceProvenanceVerified: false as const,
        mutationSuiteExpectationsMet: true as const,
        mutationCaseCount: mutationSuite.value.cases.length,
        mutationSuiteVerificationClass:
          'semantic-mutation-regression-not-full-reference-verifier' as const,
        mutationSuiteIndependentVerifierIncluded: false as const,
        fullReferenceVerifierIncluded: false as const,
        evidence: evidence.value,
        reaudit: reaudit.value,
        mutationSuite: mutationSuite.value,
      },
      parserOnlyAndIndependentResultsKeptSeparate: true as const,
      parserOnlyCasesIndependentlyVerified: false as const,
      canonicalManifestEvaluated: false as const,
      canonicalMutationFamilyComplete: false as const,
      independentVerificationScope: 'face-complex-only' as const,
      independentPathVerifierIncluded: false as const,
      independentContactVerifierIncluded: false as const,
      independentLayerVerifierIncluded: false as const,
      fullIndependentReferenceVerifierIncluded: false as const,
      sourceDocumentBytesBound: false as const,
      sourceArtifactProvenanceVerified: false as const,
      savedEvidenceProvenanceVerified: false as const,
      supportProfileIncluded: false as const,
      toleranceProfileIncluded: false as const,
      physicalPathContinuityVerified: false as const,
      collisionFreedomVerified: false as const,
      layerOrderVerified: false as const,
      foldabilityVerified: false as const,
      verifiedClaim: false as const,
      globalM0fGate: 'not-evaluated' as const,
    },
  });
}
