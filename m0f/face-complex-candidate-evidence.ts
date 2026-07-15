import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';

export const FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE =
  'm0f-face-complex-candidate-evidence-index' as const;
export const FACE_COMPLEX_CANDIDATE_EVIDENCE_SCOPE = 'face-reconstruction-and-audit-only' as const;
export const FACE_COMPLEX_CANDIDATE_FIXTURE_ID = 'REF-FOLD-NOFACES' as const;

export type FaceComplexCandidateEvidenceIndexV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: typeof FACE_COMPLEX_CANDIDATE_EVIDENCE_SCOPE;
  fixtureId: typeof FACE_COMPLEX_CANDIDATE_FIXTURE_ID;
  manifestExpectedOutcomePolicy: 'observed-only-not-stage-evidence';
  sourceInputArtifactId: string;
  reconstructionExperimentArtifactId: string;
  auditExperimentArtifactId: string;
  auditEvidenceArtifactId: string;
  mutationSuiteArtifactId: string;
  mutationResultArtifactId: string;
}>;

export type FaceComplexCandidateEvidenceIndexIssue = Readonly<{
  path: string;
  code:
    | 'invalid-snapshot'
    | 'invalid-object'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'invalid-artifact-id'
    | 'duplicate-artifact-id';
  message: string;
}>;

export type FaceComplexCandidateEvidenceIndexParseResult =
  | Readonly<{ ok: true; value: FaceComplexCandidateEvidenceIndexV1 }>
  | Readonly<{ ok: false; error: readonly FaceComplexCandidateEvidenceIndexIssue[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'scope',
  'fixtureId',
  'manifestExpectedOutcomePolicy',
  'sourceInputArtifactId',
  'reconstructionExperimentArtifactId',
  'auditExperimentArtifactId',
  'auditEvidenceArtifactId',
  'mutationSuiteArtifactId',
  'mutationResultArtifactId',
] as const;

const ARTIFACT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addIssue(
  issues: FaceComplexCandidateEvidenceIndexIssue[],
  path: string,
  code: FaceComplexCandidateEvidenceIndexIssue['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function parseFaceComplexCandidateEvidenceIndexUncheckedV1(
  supplied: unknown,
): FaceComplexCandidateEvidenceIndexParseResult {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'must be one cloneable plain JSON-data snapshot',
        },
      ],
    });
  }
  if (!isRecord(snapshot.value)) {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-object' as const,
          message: 'must be an object',
        },
      ],
    });
  }

  const value = snapshot.value;
  const issues: FaceComplexCandidateEvidenceIndexIssue[] = [];
  const allowedKeys = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) addIssue(issues, `$.${key}`, 'unknown-field', 'is not declared');
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(value, key)) addIssue(issues, `$.${key}`, 'missing-field', 'is required');
  }

  const literals = [
    ['schemaVersion', 1],
    ['recordType', FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE],
    ['contractStatus', 'candidate'],
    ['scientificClaim', false],
    ['scope', FACE_COMPLEX_CANDIDATE_EVIDENCE_SCOPE],
    ['fixtureId', FACE_COMPLEX_CANDIDATE_FIXTURE_ID],
    ['manifestExpectedOutcomePolicy', 'observed-only-not-stage-evidence'],
  ] as const;
  for (const [key, expected] of literals) {
    if (value[key] !== expected) {
      addIssue(issues, `$.${key}`, 'invalid-literal', `must equal ${JSON.stringify(expected)}`);
    }
  }

  const artifactKeys = [
    'sourceInputArtifactId',
    'reconstructionExperimentArtifactId',
    'auditExperimentArtifactId',
    'auditEvidenceArtifactId',
    'mutationSuiteArtifactId',
    'mutationResultArtifactId',
  ] as const;
  const artifactIds: string[] = [];
  for (const key of artifactKeys) {
    const artifactId = value[key];
    if (typeof artifactId !== 'string' || !ARTIFACT_ID_PATTERN.test(artifactId)) {
      addIssue(
        issues,
        `$.${key}`,
        'invalid-artifact-id',
        'must be a stable nonempty manifest artifact ID',
      );
    } else {
      artifactIds.push(artifactId);
    }
  }
  if (new Set(artifactIds).size !== artifactIds.length) {
    addIssue(
      issues,
      '$',
      'duplicate-artifact-id',
      'all source, experiment, audit-evidence, and mutation artifact IDs must be distinct',
    );
  }

  if (issues.length > 0) return deepFreezeOwned({ ok: false as const, error: issues });
  return deepFreezeOwned({
    ok: true as const,
    value: value as unknown as FaceComplexCandidateEvidenceIndexV1,
  });
}

/** Parses the closed, candidate-only pointer record used by the stage subgate. */
export function parseFaceComplexCandidateEvidenceIndexV1(
  supplied: unknown,
): FaceComplexCandidateEvidenceIndexParseResult {
  try {
    return parseFaceComplexCandidateEvidenceIndexUncheckedV1(supplied);
  } catch {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'index validation failed closed on an unexpected host condition',
        },
      ],
    });
  }
}
