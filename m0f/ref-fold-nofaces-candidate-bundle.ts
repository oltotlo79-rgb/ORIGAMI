import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import {
  FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE,
  FACE_COMPLEX_CANDIDATE_EVIDENCE_SCOPE,
  FACE_COMPLEX_CANDIDATE_FIXTURE_ID,
  parseFaceComplexCandidateEvidenceIndexV1,
  type FaceComplexCandidateEvidenceIndexV1,
} from './face-complex-candidate-evidence.js';
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
import { parseCandidateExperimentRecordV1 } from './experiments/contract.js';
import { runCandidateExperimentV1 } from './experiments/runner.js';
import { adaptFoldDocumentToFaceReconstructionInputV1 } from './geometry/fold-document-face-adapter.js';
import { prepareFaceComplexAuditInputV1 } from './geometry/prepare-face-complex-audit-input.js';
import { parseFixtureManifest, sha256Prefixed } from './manifest.js';
import {
  createFaceComplexAuditEvidenceV1,
  parseFaceComplexAuditEvidenceV1,
  reauditFaceComplexAuditEvidenceV1,
} from './reference-verifier/face-complex-evidence.js';
import {
  FACE_COMPLEX_MUTATION_CASE_IDS,
  FACE_COMPLEX_MUTATION_SUITE_V1,
  parseFaceComplexMutationSuiteResultV1,
  parseFaceComplexMutationSuiteV1,
  runFaceComplexMutationSuiteV1,
} from './reference-verifier/face-complex-mutation-suite.js';
import { stableStringify } from './stable-json.js';

export const REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/ref-fold-nofaces-candidate-bundle-ledger-v1.schema.json' as const;
export const REF_FOLD_NOFACES_CANDIDATE_BUNDLE_RECORD_TYPE =
  'm0f-ref-fold-nofaces-candidate-bundle-ledger' as const;
export const REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCOPE =
  'project-authored-face-reconstruction-audit-and-mutation-reproducibility-only' as const;
export const REF_FOLD_NOFACES_CANDIDATE_BUNDLE_GENERATOR_ID =
  'oridesign-ref-fold-nofaces-candidate-bundle' as const;
export const REF_FOLD_NOFACES_CANDIDATE_BUNDLE_GENERATOR_VERSION = '1.0.0-candidate' as const;
export const REF_FOLD_NOFACES_CANDIDATE_BUNDLE_LEDGER_FILENAME =
  'candidate-bundle-ledger.json' as const;
export const REF_FOLD_NOFACES_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY =
  'tests/candidate-vectors/REF-FOLD-NOFACES' as const;
export const REF_FOLD_NOFACES_CANONICAL_MANIFEST_PATH = 'tests/fixtures/manifest.json' as const;

const RECONSTRUCTION_SEED = 41;
const RECONSTRUCTION_REPETITION = 0;
const AUDIT_SEED = 42;
const AUDIT_REPETITION = 0;
const SOURCE_REFERENCE_ID = 'oridesign-ref-fold-nofaces-candidate-v1' as const;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

export const REF_FOLD_NOFACES_SOURCE_DOCUMENT_V1 = deepFreezeOwned({
  file_spec: 1.2,
  frame_classes: ['creasePattern'],
  frame_attributes: ['2D'],
  vertices_coords: [
    [0, 0],
    [3, 0],
    [3, 1],
    [1, 1],
    [1, 3],
    [0, 3],
  ],
  edges_vertices: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 0],
  ],
  edges_assignment: ['B', 'B', 'B', 'B', 'B', 'B'],
});

export const REF_FOLD_NOFACES_CANDIDATE_README_V1 = `# REF-FOLD-NOFACES candidate vector

This directory is a project-authored candidate bundle for the closed FOLD 1.1/1.2 NOFACES face-reconstruction boundary.

It is intentionally outside \`tests/fixtures/manifest.json\` and is not a canonical fixture. Canonical promotion is not claimed. No ToleranceProfile is defined, selected, or implied. Scientific verification is not claimed, and the global M0F gate is not evaluated.

The ledger binds the committed bytes and project provenance of the source, this README, the evidence index, exact reconstruction record, separate audit record, independent audit evidence, canonical eleven-case mutation suite, and saved mutation result.

Regenerate and immediately verify the bundle with:

\`\`\`text
npx tsx m0f/ref-fold-nofaces-candidate-bundle-cli.ts --write
\`\`\`

Verify the committed bundle without writing with:

\`\`\`text
npx tsx m0f/ref-fold-nofaces-candidate-bundle-cli.ts --verify
\`\`\`
`;

export type RefFoldNoFacesCandidateArtifactRoleV1 =
  | 'source-input'
  | 'readme'
  | 'evidence-index'
  | 'reconstruction-record'
  | 'audit-record'
  | 'audit-evidence'
  | 'mutation-suite'
  | 'mutation-result';

export type RefFoldNoFacesCandidateArtifactProvenanceV1 = Readonly<{
  sourceReferenceId: typeof SOURCE_REFERENCE_ID;
  sourceUse: 'project-authored' | 'generated';
  derivation: 'authored' | 'deterministically-generated';
  dependsOnArtifactIds: readonly string[];
}>;

export type RefFoldNoFacesCandidateArtifactLedgerEntryV1 = Readonly<{
  artifactId: string;
  role: RefFoldNoFacesCandidateArtifactRoleV1;
  path: string;
  mediaType: string;
  sha256: `sha256:${string}`;
  licenseSpdx: 'MIT';
  provenance: RefFoldNoFacesCandidateArtifactProvenanceV1;
}>;

type RefFoldNoFacesCandidateArtifactSpecV1 = Omit<
  RefFoldNoFacesCandidateArtifactLedgerEntryV1,
  'sha256'
>;

export const REF_FOLD_NOFACES_CANDIDATE_ARTIFACT_SPECS_V1 = deepFreezeOwned([
  {
    artifactId: 'fold-source',
    role: 'source-input',
    path: 'input.fold',
    mediaType: 'application/vnd.fold+json',
    licenseSpdx: 'MIT',
    provenance: {
      sourceReferenceId: SOURCE_REFERENCE_ID,
      sourceUse: 'project-authored',
      derivation: 'authored',
      dependsOnArtifactIds: [],
    },
  },
  {
    artifactId: 'fixture-readme',
    role: 'readme',
    path: 'README.md',
    mediaType: 'text/markdown; charset=utf-8',
    licenseSpdx: 'MIT',
    provenance: {
      sourceReferenceId: SOURCE_REFERENCE_ID,
      sourceUse: 'project-authored',
      derivation: 'authored',
      dependsOnArtifactIds: [],
    },
  },
  {
    artifactId: 'face-evidence-index',
    role: 'evidence-index',
    path: 'face-evidence-index.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: {
      sourceReferenceId: SOURCE_REFERENCE_ID,
      sourceUse: 'generated',
      derivation: 'deterministically-generated',
      dependsOnArtifactIds: ['fold-source'],
    },
  },
  {
    artifactId: 'face-reconstruction-record',
    role: 'reconstruction-record',
    path: 'face-reconstruction-record.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: {
      sourceReferenceId: SOURCE_REFERENCE_ID,
      sourceUse: 'generated',
      derivation: 'deterministically-generated',
      dependsOnArtifactIds: ['fold-source'],
    },
  },
  {
    artifactId: 'face-audit-record',
    role: 'audit-record',
    path: 'face-audit-record.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: {
      sourceReferenceId: SOURCE_REFERENCE_ID,
      sourceUse: 'generated',
      derivation: 'deterministically-generated',
      dependsOnArtifactIds: ['fold-source', 'face-reconstruction-record'],
    },
  },
  {
    artifactId: 'face-audit-evidence',
    role: 'audit-evidence',
    path: 'face-audit-evidence.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: {
      sourceReferenceId: SOURCE_REFERENCE_ID,
      sourceUse: 'generated',
      derivation: 'deterministically-generated',
      dependsOnArtifactIds: ['fold-source', 'face-reconstruction-record'],
    },
  },
  {
    artifactId: 'face-mutation-suite',
    role: 'mutation-suite',
    path: 'face-mutation-suite.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: {
      sourceReferenceId: SOURCE_REFERENCE_ID,
      sourceUse: 'project-authored',
      derivation: 'authored',
      dependsOnArtifactIds: [],
    },
  },
  {
    artifactId: 'face-mutation-result',
    role: 'mutation-result',
    path: 'face-mutation-result.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: {
      sourceReferenceId: SOURCE_REFERENCE_ID,
      sourceUse: 'generated',
      derivation: 'deterministically-generated',
      dependsOnArtifactIds: ['fold-source', 'face-reconstruction-record', 'face-mutation-suite'],
    },
  },
] as const satisfies readonly RefFoldNoFacesCandidateArtifactSpecV1[]);

const GENERATOR_PROVENANCE = deepFreezeOwned({
  generatorId: REF_FOLD_NOFACES_CANDIDATE_BUNDLE_GENERATOR_ID,
  generatorVersion: REF_FOLD_NOFACES_CANDIDATE_BUNDLE_GENERATOR_VERSION,
  serialization: 'stable-json-utf8-lf-v1' as const,
  reconstructionSeed: RECONSTRUCTION_SEED,
  reconstructionRepetition: RECONSTRUCTION_REPETITION,
  auditSeed: AUDIT_SEED,
  auditRepetition: AUDIT_REPETITION,
});

const SOURCE_PROVENANCE = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceKind: 'project-authored' as const,
  title: 'REF-FOLD-NOFACES project-authored candidate vector',
  authors: ['OriDesign contributors'],
  redistribution: 'allowed' as const,
  licenseSpdx: 'MIT' as const,
});

export type RefFoldNoFacesCandidateBundleLedgerV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCHEMA_ID;
  recordType: typeof REF_FOLD_NOFACES_CANDIDATE_BUNDLE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  fixtureId: typeof FACE_COMPLEX_CANDIDATE_FIXTURE_ID;
  scope: typeof REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCOPE;
  canonicalManifestPath: typeof REF_FOLD_NOFACES_CANONICAL_MANIFEST_PATH;
  canonicalManifestRegistration: 'not-registered';
  canonicalPromotionClaimed: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  globalM0fGate: 'not-evaluated';
  artifactCount: 8;
  generator: typeof GENERATOR_PROVENANCE;
  provenance: typeof SOURCE_PROVENANCE;
  artifacts: readonly RefFoldNoFacesCandidateArtifactLedgerEntryV1[];
}>;

export type RefFoldNoFacesCandidateBundleLedgerIssueV1 = Readonly<{
  path: string;
  code:
    | 'invalid-snapshot'
    | 'invalid-object'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'invalid-array'
    | 'invalid-artifact'
    | 'invalid-hash';
  message: string;
}>;

export type RefFoldNoFacesCandidateBundleLedgerParseResultV1 =
  | Readonly<{ ok: true; value: RefFoldNoFacesCandidateBundleLedgerV1 }>
  | Readonly<{ ok: false; error: readonly RefFoldNoFacesCandidateBundleLedgerIssueV1[] }>;

const LEDGER_ROOT_KEYS = [
  'schemaVersion',
  'schemaId',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'fixtureId',
  'scope',
  'canonicalManifestPath',
  'canonicalManifestRegistration',
  'canonicalPromotionClaimed',
  'toleranceProfileIncluded',
  'scientificVerificationClaimed',
  'globalM0fGate',
  'artifactCount',
  'generator',
  'provenance',
  'artifacts',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addLedgerIssue(
  issues: RefFoldNoFacesCandidateBundleLedgerIssueV1[],
  path: string,
  code: RefFoldNoFacesCandidateBundleLedgerIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: RefFoldNoFacesCandidateBundleLedgerIssueV1[],
): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key))
      addLedgerIssue(issues, `${path}.${key}`, 'unknown-field', 'is not declared');
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key))
      addLedgerIssue(issues, `${path}.${key}`, 'missing-field', 'is required');
  }
}

function sameStableJson(left: unknown, right: unknown): boolean {
  try {
    return stableStringify(left) === stableStringify(right);
  } catch {
    return false;
  }
}

/** Parses the closed candidate-only ledger and rejects claim or provenance rewrites. */
export function parseRefFoldNoFacesCandidateBundleLedgerV1(
  supplied: unknown,
): RefFoldNoFacesCandidateBundleLedgerParseResultV1 {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'must be one cloneable accessor-free plain JSON-data snapshot',
        },
      ],
    });
  }
  if (!isRecord(snapshot.value)) {
    return deepFreezeOwned({
      ok: false as const,
      error: [{ path: '$', code: 'invalid-object' as const, message: 'must be an object' }],
    });
  }

  const value = snapshot.value;
  const issues: RefFoldNoFacesCandidateBundleLedgerIssueV1[] = [];
  exactKeys(value, LEDGER_ROOT_KEYS, '$', issues);
  const literals = [
    ['schemaVersion', 1],
    ['schemaId', REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCHEMA_ID],
    ['recordType', REF_FOLD_NOFACES_CANDIDATE_BUNDLE_RECORD_TYPE],
    ['contractStatus', 'candidate'],
    ['scientificClaim', false],
    ['fixtureId', FACE_COMPLEX_CANDIDATE_FIXTURE_ID],
    ['scope', REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCOPE],
    ['canonicalManifestPath', REF_FOLD_NOFACES_CANONICAL_MANIFEST_PATH],
    ['canonicalManifestRegistration', 'not-registered'],
    ['canonicalPromotionClaimed', false],
    ['toleranceProfileIncluded', false],
    ['scientificVerificationClaimed', false],
    ['globalM0fGate', 'not-evaluated'],
    ['artifactCount', REF_FOLD_NOFACES_CANDIDATE_ARTIFACT_SPECS_V1.length],
  ] as const;
  for (const [key, expected] of literals) {
    if (value[key] !== expected) {
      addLedgerIssue(
        issues,
        `$.${key}`,
        'invalid-literal',
        `must equal ${JSON.stringify(expected)}`,
      );
    }
  }
  if (!sameStableJson(value.generator, GENERATOR_PROVENANCE)) {
    addLedgerIssue(
      issues,
      '$.generator',
      'invalid-literal',
      'must equal the candidate generator contract',
    );
  }
  if (!sameStableJson(value.provenance, SOURCE_PROVENANCE)) {
    addLedgerIssue(
      issues,
      '$.provenance',
      'invalid-literal',
      'must equal the project-authored provenance',
    );
  }

  if (
    !Array.isArray(value.artifacts) ||
    value.artifacts.length !== REF_FOLD_NOFACES_CANDIDATE_ARTIFACT_SPECS_V1.length
  ) {
    addLedgerIssue(
      issues,
      '$.artifacts',
      'invalid-array',
      'must contain the eight canonical candidate artifact rows',
    );
  } else {
    for (const [index, expected] of REF_FOLD_NOFACES_CANDIDATE_ARTIFACT_SPECS_V1.entries()) {
      const actual: unknown = value.artifacts[index];
      const path = `$.artifacts[${String(index)}]`;
      if (!isRecord(actual)) {
        addLedgerIssue(issues, path, 'invalid-artifact', 'must be an artifact object');
        continue;
      }
      exactKeys(
        actual,
        ['artifactId', 'role', 'path', 'mediaType', 'sha256', 'licenseSpdx', 'provenance'],
        path,
        issues,
      );
      const { sha256, ...actualWithoutHash } = actual;
      if (!sameStableJson(actualWithoutHash, expected)) {
        addLedgerIssue(
          issues,
          path,
          'invalid-artifact',
          'identity, path, role, license, or provenance differs from the closed contract',
        );
      }
      if (typeof sha256 !== 'string' || !SHA256_PATTERN.test(sha256)) {
        addLedgerIssue(
          issues,
          `${path}.sha256`,
          'invalid-hash',
          'must be a lowercase SHA-256 value',
        );
      }
    }
  }

  if (issues.length > 0) return deepFreezeOwned({ ok: false as const, error: issues });
  return deepFreezeOwned({
    ok: true as const,
    value: value as unknown as RefFoldNoFacesCandidateBundleLedgerV1,
  });
}

function jsonLine(value: unknown): string {
  return `${stableStringify(value)}\n`;
}

function evidenceIndex(): FaceComplexCandidateEvidenceIndexV1 {
  return {
    schemaVersion: 1,
    recordType: FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    scope: FACE_COMPLEX_CANDIDATE_EVIDENCE_SCOPE,
    fixtureId: FACE_COMPLEX_CANDIDATE_FIXTURE_ID,
    manifestExpectedOutcomePolicy: 'observed-only-not-stage-evidence',
    sourceInputArtifactId: 'fold-source',
    reconstructionExperimentArtifactId: 'face-reconstruction-record',
    auditExperimentArtifactId: 'face-audit-record',
    auditEvidenceArtifactId: 'face-audit-evidence',
    mutationSuiteArtifactId: 'face-mutation-suite',
    mutationResultArtifactId: 'face-mutation-result',
  };
}

export type RefFoldNoFacesCandidateBundleBuiltFileV1 = Readonly<{
  artifactId: string | null;
  path: string;
  text: string;
}>;

export type RefFoldNoFacesCandidateBundleBuildV1 = Readonly<{
  ledger: RefFoldNoFacesCandidateBundleLedgerV1;
  files: readonly RefFoldNoFacesCandidateBundleBuiltFileV1[];
}>;

/** Deterministically rebuilds every candidate artifact from the fixed project-authored vector. */
export async function buildRefFoldNoFacesCandidateBundleV1(): Promise<RefFoldNoFacesCandidateBundleBuildV1> {
  const adapted = adaptFoldDocumentToFaceReconstructionInputV1(REF_FOLD_NOFACES_SOURCE_DOCUMENT_V1);
  if (!adapted.ok) throw new TypeError('fixed REF-FOLD-NOFACES source must adapt');

  const reconstructionRecord = await runCandidateExperimentV1({
    experimentId: FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
    engineVersion: FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
    parameters: FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1,
    input: adapted.value,
    seed: RECONSTRUCTION_SEED,
    repetition: RECONSTRUCTION_REPETITION,
  });
  if (reconstructionRecord.outcome !== 'completed' || reconstructionRecord.result === null) {
    throw new TypeError('fixed REF-FOLD-NOFACES reconstruction must complete');
  }
  const auditInput = prepareFaceComplexAuditInputV1(adapted.value, reconstructionRecord.result);
  if (!auditInput.ok) throw new TypeError('fixed REF-FOLD-NOFACES audit input must prepare');

  const auditRecord = await runCandidateExperimentV1({
    experimentId: FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
    engineVersion: FACE_COMPLEX_AUDIT_ENGINE_VERSION,
    parameters: FACE_COMPLEX_AUDIT_PARAMETERS_V1,
    input: auditInput.value,
    seed: AUDIT_SEED,
    repetition: AUDIT_REPETITION,
  });
  if (auditRecord.outcome !== 'completed' || auditRecord.result === null) {
    throw new TypeError('fixed REF-FOLD-NOFACES independent audit must complete');
  }
  const auditEvidence = await createFaceComplexAuditEvidenceV1(auditInput.value);
  if (!auditEvidence.ok) throw new TypeError('fixed REF-FOLD-NOFACES audit evidence must complete');
  const mutationResult = runFaceComplexMutationSuiteV1(
    auditInput.value,
    FACE_COMPLEX_MUTATION_SUITE_V1,
  );
  if (!mutationResult.ok) throw new TypeError('fixed eleven-case mutation suite must complete');

  const documentByArtifactId = new Map<string, string>([
    ['fold-source', jsonLine(REF_FOLD_NOFACES_SOURCE_DOCUMENT_V1)],
    ['fixture-readme', REF_FOLD_NOFACES_CANDIDATE_README_V1],
    ['face-evidence-index', jsonLine(evidenceIndex())],
    ['face-reconstruction-record', jsonLine(reconstructionRecord)],
    ['face-audit-record', jsonLine(auditRecord)],
    ['face-audit-evidence', jsonLine(auditEvidence.value)],
    ['face-mutation-suite', jsonLine(FACE_COMPLEX_MUTATION_SUITE_V1)],
    ['face-mutation-result', jsonLine(mutationResult.value)],
  ]);
  const artifacts = REF_FOLD_NOFACES_CANDIDATE_ARTIFACT_SPECS_V1.map((spec) => {
    const text = documentByArtifactId.get(spec.artifactId);
    if (text === undefined) throw new TypeError(`missing generated artifact ${spec.artifactId}`);
    return { ...spec, sha256: sha256Prefixed(text) as `sha256:${string}` };
  });
  const ledger: RefFoldNoFacesCandidateBundleLedgerV1 = {
    schemaVersion: 1,
    schemaId: REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCHEMA_ID,
    recordType: REF_FOLD_NOFACES_CANDIDATE_BUNDLE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    fixtureId: FACE_COMPLEX_CANDIDATE_FIXTURE_ID,
    scope: REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCOPE,
    canonicalManifestPath: REF_FOLD_NOFACES_CANONICAL_MANIFEST_PATH,
    canonicalManifestRegistration: 'not-registered',
    canonicalPromotionClaimed: false,
    toleranceProfileIncluded: false,
    scientificVerificationClaimed: false,
    globalM0fGate: 'not-evaluated',
    artifactCount: 8,
    generator: GENERATOR_PROVENANCE,
    provenance: SOURCE_PROVENANCE,
    artifacts,
  };
  const files: RefFoldNoFacesCandidateBundleBuiltFileV1[] = artifacts.map((artifact) => {
    const text = documentByArtifactId.get(artifact.artifactId);
    if (text === undefined)
      throw new TypeError(`missing generated artifact ${artifact.artifactId}`);
    return { artifactId: artifact.artifactId, path: artifact.path, text };
  });
  files.push({
    artifactId: null,
    path: REF_FOLD_NOFACES_CANDIDATE_BUNDLE_LEDGER_FILENAME,
    text: jsonLine(ledger),
  });
  return deepFreezeOwned({ ledger, files });
}

/** Writes only the closed candidate bundle file set; it never edits the canonical manifest. */
export async function writeRefFoldNoFacesCandidateBundleV1(
  bundleDirectory: string = REF_FOLD_NOFACES_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<RefFoldNoFacesCandidateBundleBuildV1> {
  const built = await buildRefFoldNoFacesCandidateBundleV1();
  const absoluteDirectory = resolve(bundleDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const expectedNames = new Set(built.files.map((file) => file.path));
  const existing = await readdir(absoluteDirectory, { withFileTypes: true });
  if (existing.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))) {
    throw new TypeError('candidate bundle directory contains an unexpected entry');
  }
  await Promise.all(
    built.files.map((file) => writeFile(resolve(absoluteDirectory, file.path), file.text, 'utf8')),
  );
  return built;
}

export const REF_FOLD_NOFACES_CANDIDATE_BUNDLE_REASON_CODES = [
  'ledger-unreadable',
  'ledger-invalid',
  'artifact-set-mismatch',
  'artifact-unreadable',
  'artifact-hash-mismatch',
  'source-input-invalid',
  'evidence-index-invalid',
  'reconstruction-record-invalid',
  'audit-record-invalid',
  'audit-evidence-invalid',
  'mutation-suite-invalid',
  'mutation-result-invalid',
  'canonical-manifest-unreadable',
  'canonical-manifest-registration-present',
  'reconstruction-rerun-mismatch',
  'audit-rerun-mismatch',
  'audit-evidence-rerun-mismatch',
  'mutation-rerun-mismatch',
  'deterministic-regeneration-mismatch',
  'unexpected-failure',
] as const;

export type RefFoldNoFacesCandidateBundleReasonCodeV1 =
  (typeof REF_FOLD_NOFACES_CANDIDATE_BUNDLE_REASON_CODES)[number];

export type RefFoldNoFacesCandidateBundleVerificationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-ref-fold-nofaces-candidate-bundle-verification-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  fixtureId: typeof FACE_COMPLEX_CANDIDATE_FIXTURE_ID;
  scope: typeof REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCOPE;
  globalM0fGate: 'not-evaluated';
  canonicalPromotionClaimed: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  reproducibleCandidateBundle: boolean;
  reasonCodes: readonly RefFoldNoFacesCandidateBundleReasonCodeV1[];
  checks: Readonly<{
    ledgerPresentAndValid: boolean;
    artifactSetExact: boolean;
    allArtifactHashesMatch: boolean;
    allArtifactProvenanceFixed: boolean;
    canonicalManifestRegistrationAbsent: boolean;
    sourceInputParsed: boolean;
    evidenceIndexParsed: boolean;
    reconstructionRecordParsed: boolean;
    reconstructionRerunMatched: boolean;
    auditRecordParsed: boolean;
    auditRerunMatched: boolean;
    auditEvidenceParsed: boolean;
    auditEvidenceRerunMatched: boolean;
    mutationSuiteParsed: boolean;
    mutationResultParsed: boolean;
    mutationCaseCount: number;
    mutationRerunMatched: boolean;
    deterministicRegenerationMatched: boolean;
  }>;
}>;

interface MutableVerificationState {
  reasons: Set<RefFoldNoFacesCandidateBundleReasonCodeV1>;
  ledgerPresentAndValid: boolean;
  artifactSetExact: boolean;
  allArtifactHashesMatch: boolean;
  allArtifactProvenanceFixed: boolean;
  canonicalManifestRegistrationAbsent: boolean;
  sourceInputParsed: boolean;
  evidenceIndexParsed: boolean;
  reconstructionRecordParsed: boolean;
  reconstructionRerunMatched: boolean;
  auditRecordParsed: boolean;
  auditRerunMatched: boolean;
  auditEvidenceParsed: boolean;
  auditEvidenceRerunMatched: boolean;
  mutationSuiteParsed: boolean;
  mutationResultParsed: boolean;
  mutationCaseCount: number;
  mutationRerunMatched: boolean;
  deterministicRegenerationMatched: boolean;
}

function initialVerificationState(): MutableVerificationState {
  return {
    reasons: new Set(),
    ledgerPresentAndValid: false,
    artifactSetExact: false,
    allArtifactHashesMatch: false,
    allArtifactProvenanceFixed: false,
    canonicalManifestRegistrationAbsent: false,
    sourceInputParsed: false,
    evidenceIndexParsed: false,
    reconstructionRecordParsed: false,
    reconstructionRerunMatched: false,
    auditRecordParsed: false,
    auditRerunMatched: false,
    auditEvidenceParsed: false,
    auditEvidenceRerunMatched: false,
    mutationSuiteParsed: false,
    mutationResultParsed: false,
    mutationCaseCount: 0,
    mutationRerunMatched: false,
    deterministicRegenerationMatched: false,
  };
}

function verificationResult(
  state: MutableVerificationState,
): RefFoldNoFacesCandidateBundleVerificationResultV1 {
  const reasonCodes = REF_FOLD_NOFACES_CANDIDATE_BUNDLE_REASON_CODES.filter((code) =>
    state.reasons.has(code),
  );
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: 'm0f-ref-fold-nofaces-candidate-bundle-verification-result' as const,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    fixtureId: FACE_COMPLEX_CANDIDATE_FIXTURE_ID,
    scope: REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCOPE,
    globalM0fGate: 'not-evaluated' as const,
    canonicalPromotionClaimed: false as const,
    toleranceProfileIncluded: false as const,
    scientificVerificationClaimed: false as const,
    reproducibleCandidateBundle: reasonCodes.length === 0,
    reasonCodes,
    checks: {
      ledgerPresentAndValid: state.ledgerPresentAndValid,
      artifactSetExact: state.artifactSetExact,
      allArtifactHashesMatch: state.allArtifactHashesMatch,
      allArtifactProvenanceFixed: state.allArtifactProvenanceFixed,
      canonicalManifestRegistrationAbsent: state.canonicalManifestRegistrationAbsent,
      sourceInputParsed: state.sourceInputParsed,
      evidenceIndexParsed: state.evidenceIndexParsed,
      reconstructionRecordParsed: state.reconstructionRecordParsed,
      reconstructionRerunMatched: state.reconstructionRerunMatched,
      auditRecordParsed: state.auditRecordParsed,
      auditRerunMatched: state.auditRerunMatched,
      auditEvidenceParsed: state.auditEvidenceParsed,
      auditEvidenceRerunMatched: state.auditEvidenceRerunMatched,
      mutationSuiteParsed: state.mutationSuiteParsed,
      mutationResultParsed: state.mutationResultParsed,
      mutationCaseCount: state.mutationCaseCount,
      mutationRerunMatched: state.mutationRerunMatched,
      deterministicRegenerationMatched: state.deterministicRegenerationMatched,
    },
  });
}

function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

async function canonicalManifestRegistrationIsAbsent(): Promise<boolean | undefined> {
  try {
    const document = JSON.parse(
      await readFile(resolve(REF_FOLD_NOFACES_CANONICAL_MANIFEST_PATH), 'utf8'),
    ) as unknown;
    const parsed = parseFixtureManifest(document);
    if (parsed.manifest === undefined) return undefined;
    return !parsed.manifest.fixtures.some(
      (fixture) => fixture.id === FACE_COMPLEX_CANDIDATE_FIXTURE_ID,
    );
  } catch {
    return undefined;
  }
}

/** Hash-checks committed bytes and reruns every candidate computation without evaluating M0F GO. */
export async function verifyRefFoldNoFacesCandidateBundleV1(
  bundleDirectory: string = REF_FOLD_NOFACES_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<RefFoldNoFacesCandidateBundleVerificationResultV1> {
  const state = initialVerificationState();
  try {
    const absoluteDirectory = resolve(bundleDirectory);
    let ledgerDocument: unknown;
    try {
      ledgerDocument = JSON.parse(
        await readFile(
          resolve(absoluteDirectory, REF_FOLD_NOFACES_CANDIDATE_BUNDLE_LEDGER_FILENAME),
          'utf8',
        ),
      ) as unknown;
    } catch {
      state.reasons.add('ledger-unreadable');
      return verificationResult(state);
    }
    const parsedLedger = parseRefFoldNoFacesCandidateBundleLedgerV1(ledgerDocument);
    if (!parsedLedger.ok) {
      state.reasons.add('ledger-invalid');
      return verificationResult(state);
    }
    state.ledgerPresentAndValid = true;
    state.allArtifactProvenanceFixed = true;

    const expectedFileNames = new Set([
      REF_FOLD_NOFACES_CANDIDATE_BUNDLE_LEDGER_FILENAME,
      ...parsedLedger.value.artifacts.map((artifact) => artifact.path),
    ]);
    const directoryEntries = await readdir(absoluteDirectory, { withFileTypes: true });
    if (
      directoryEntries.length !== expectedFileNames.size ||
      directoryEntries.some((entry) => !entry.isFile() || !expectedFileNames.has(entry.name))
    ) {
      state.reasons.add('artifact-set-mismatch');
      return verificationResult(state);
    }
    state.artifactSetExact = true;

    const textByArtifactId = new Map<string, string>();
    let hashesMatch = true;
    for (const artifact of parsedLedger.value.artifacts) {
      let bytes: Uint8Array;
      try {
        bytes = await readFile(resolve(absoluteDirectory, artifact.path));
      } catch {
        state.reasons.add('artifact-unreadable');
        return verificationResult(state);
      }
      if (sha256Prefixed(bytes) !== artifact.sha256) hashesMatch = false;
      textByArtifactId.set(artifact.artifactId, Buffer.from(bytes).toString('utf8'));
    }
    if (!hashesMatch) {
      state.reasons.add('artifact-hash-mismatch');
      return verificationResult(state);
    }
    state.allArtifactHashesMatch = true;

    const manifestAbsent = await canonicalManifestRegistrationIsAbsent();
    if (manifestAbsent === undefined) state.reasons.add('canonical-manifest-unreadable');
    else if (!manifestAbsent) state.reasons.add('canonical-manifest-registration-present');
    else state.canonicalManifestRegistrationAbsent = true;

    const sourceDocument = parseJsonText(textByArtifactId.get('fold-source') ?? '');
    const adapted = adaptFoldDocumentToFaceReconstructionInputV1(sourceDocument);
    if (!adapted.ok) state.reasons.add('source-input-invalid');
    else state.sourceInputParsed = true;

    const savedIndexDocument = parseJsonText(textByArtifactId.get('face-evidence-index') ?? '');
    const savedIndex = parseFaceComplexCandidateEvidenceIndexV1(savedIndexDocument);
    if (!savedIndex.ok || !sameStableJson(savedIndex.value, evidenceIndex())) {
      state.reasons.add('evidence-index-invalid');
    } else {
      state.evidenceIndexParsed = true;
    }

    const reconstructionDocument = parseJsonText(
      textByArtifactId.get('face-reconstruction-record') ?? '',
    );
    const reconstructionRecord = await parseCandidateExperimentRecordV1(reconstructionDocument);
    if (
      !reconstructionRecord.ok ||
      reconstructionRecord.value.outcome !== 'completed' ||
      reconstructionRecord.value.experimentId !== FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID ||
      reconstructionRecord.value.engineVersion !== FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION ||
      reconstructionRecord.value.seed !== RECONSTRUCTION_SEED ||
      reconstructionRecord.value.repetition !== RECONSTRUCTION_REPETITION
    ) {
      state.reasons.add('reconstruction-record-invalid');
    } else {
      state.reconstructionRecordParsed = true;
    }

    const auditDocument = parseJsonText(textByArtifactId.get('face-audit-record') ?? '');
    const auditRecord = await parseCandidateExperimentRecordV1(auditDocument);
    if (
      !auditRecord.ok ||
      auditRecord.value.outcome !== 'completed' ||
      auditRecord.value.experimentId !== FACE_COMPLEX_AUDIT_EXPERIMENT_ID ||
      auditRecord.value.engineVersion !== FACE_COMPLEX_AUDIT_ENGINE_VERSION ||
      auditRecord.value.seed !== AUDIT_SEED ||
      auditRecord.value.repetition !== AUDIT_REPETITION
    ) {
      state.reasons.add('audit-record-invalid');
    } else {
      state.auditRecordParsed = true;
    }

    const auditEvidenceDocument = parseJsonText(textByArtifactId.get('face-audit-evidence') ?? '');
    const auditEvidence = await parseFaceComplexAuditEvidenceV1(auditEvidenceDocument);
    if (!auditEvidence.ok) state.reasons.add('audit-evidence-invalid');
    else state.auditEvidenceParsed = true;

    const mutationSuiteDocument = parseJsonText(textByArtifactId.get('face-mutation-suite') ?? '');
    const mutationSuite = parseFaceComplexMutationSuiteV1(mutationSuiteDocument);
    if (!mutationSuite.ok || !sameStableJson(mutationSuite.value, FACE_COMPLEX_MUTATION_SUITE_V1)) {
      state.reasons.add('mutation-suite-invalid');
    } else {
      state.mutationSuiteParsed = true;
      state.mutationCaseCount = mutationSuite.value.cases.length;
    }
    const mutationResultDocument = parseJsonText(
      textByArtifactId.get('face-mutation-result') ?? '',
    );
    const mutationResult = parseFaceComplexMutationSuiteResultV1(mutationResultDocument);
    if (!mutationResult.ok) state.reasons.add('mutation-result-invalid');
    else state.mutationResultParsed = true;

    const regenerated = await buildRefFoldNoFacesCandidateBundleV1();
    const regeneratedByPath = new Map(regenerated.files.map((file) => [file.path, file.text]));
    for (const artifact of parsedLedger.value.artifacts) {
      const savedText = textByArtifactId.get(artifact.artifactId);
      const regeneratedText = regeneratedByPath.get(artifact.path);
      if (savedText !== regeneratedText) {
        if (artifact.role === 'reconstruction-record') {
          state.reasons.add('reconstruction-rerun-mismatch');
        } else if (artifact.role === 'audit-record') {
          state.reasons.add('audit-rerun-mismatch');
        } else if (artifact.role === 'audit-evidence') {
          state.reasons.add('audit-evidence-rerun-mismatch');
        } else if (artifact.role === 'mutation-result') {
          state.reasons.add('mutation-rerun-mismatch');
        }
      }
    }
    state.reconstructionRerunMatched =
      state.sourceInputParsed &&
      state.reconstructionRecordParsed &&
      !state.reasons.has('reconstruction-rerun-mismatch');
    state.auditRerunMatched =
      state.sourceInputParsed &&
      state.reconstructionRerunMatched &&
      state.auditRecordParsed &&
      !state.reasons.has('audit-rerun-mismatch');
    state.mutationRerunMatched =
      state.sourceInputParsed &&
      state.reconstructionRerunMatched &&
      state.mutationSuiteParsed &&
      state.mutationResultParsed &&
      state.mutationCaseCount === FACE_COMPLEX_MUTATION_CASE_IDS.length &&
      !state.reasons.has('mutation-rerun-mismatch');

    if (auditEvidence.ok) {
      const reaudited = await reauditFaceComplexAuditEvidenceV1(auditEvidence.value);
      const directAuditEvidenceRerunMatched =
        reaudited.ok && !state.reasons.has('audit-evidence-rerun-mismatch');
      state.auditEvidenceRerunMatched =
        state.sourceInputParsed &&
        state.reconstructionRerunMatched &&
        state.auditEvidenceParsed &&
        directAuditEvidenceRerunMatched;
      if (!directAuditEvidenceRerunMatched) {
        state.reasons.add('audit-evidence-rerun-mismatch');
      }
    }

    const savedLedgerText = await readFile(
      resolve(absoluteDirectory, REF_FOLD_NOFACES_CANDIDATE_BUNDLE_LEDGER_FILENAME),
      'utf8',
    );
    const allRegeneratedBytesMatch = regenerated.files.every((file) => {
      const saved =
        file.artifactId === null ? savedLedgerText : textByArtifactId.get(file.artifactId);
      return saved === file.text;
    });
    if (!allRegeneratedBytesMatch) state.reasons.add('deterministic-regeneration-mismatch');
    else state.deterministicRegenerationMatched = true;

    return verificationResult(state);
  } catch {
    state.reasons.add('unexpected-failure');
    return verificationResult(state);
  }
}
