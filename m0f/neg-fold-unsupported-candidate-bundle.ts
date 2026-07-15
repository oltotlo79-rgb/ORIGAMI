import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import {
  adaptFoldDocumentToFaceReconstructionInputV1,
  type FoldDocumentFaceAdapterIssue,
} from './geometry/fold-document-face-adapter.js';
import { parseFixtureManifest, sha256Prefixed } from './manifest.js';
import { stableStringify } from './stable-json.js';

export const NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/neg-fold-unsupported-candidate-bundle-ledger-v1.schema.json' as const;
export const NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_RECORD_TYPE =
  'm0f-neg-fold-unsupported-candidate-bundle-ledger' as const;
export const NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCOPE =
  'project-authored-exact-negative-fold-document-face-adapter-replay-only' as const;
export const NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_GENERATOR_ID =
  'oridesign-neg-fold-unsupported-candidate-bundle' as const;
export const NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_GENERATOR_VERSION = '1.0.0-candidate' as const;
export const NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY =
  'tests/candidate-vectors/NEG-FOLD-UNSUPPORTED' as const;
export const NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME =
  'candidate-bundle-ledger.json' as const;
export const NEG_FOLD_UNSUPPORTED_CANONICAL_MANIFEST_PATH = 'tests/fixtures/manifest.json' as const;
export const NEG_FOLD_UNSUPPORTED_CASE_ID_PREFIX = 'NEG-FOLD-UNSUPPORTED-' as const;

const SOURCE_REFERENCE_ID = 'oridesign-neg-fold-unsupported-candidates-v1' as const;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

type ExpectedIssueV1 = Readonly<{
  path: string;
  code: FoldDocumentFaceAdapterIssue['code'];
}>;

type NegativeCaseSpecV1 = Readonly<{
  caseId: `${typeof NEG_FOLD_UNSUPPORTED_CASE_ID_PREFIX}${string}`;
  sourceArtifactId: string;
  sourcePath: string;
  sourceDocument: Readonly<Record<string, unknown>>;
  expectedIssues: readonly ExpectedIssueV1[];
}>;

function squareFoldDocument(): Record<string, unknown> {
  return {
    file_spec: 1.2,
    vertices_coords: [
      [1, 1],
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    edges_vertices: [
      [0, 3],
      [2, 0],
      [1, 2],
      [3, 1],
    ],
    edges_assignment: ['B', 'B', 'B', 'B'],
  };
}

export const NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1 = deepFreezeOwned(squareFoldDocument());

function unsupportedAttributeCase(
  caseId: NegativeCaseSpecV1['caseId'],
  sourceArtifactId: string,
  sourcePath: string,
  attribute: string,
): NegativeCaseSpecV1 {
  return {
    caseId,
    sourceArtifactId,
    sourcePath,
    sourceDocument: {
      ...NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1,
      frame_attributes: ['2D', attribute],
    },
    expectedIssues: [{ path: '$.frame_attributes[1]', code: 'unsupported-frame-attribute' }],
  };
}

function unsupportedAssignmentCase(
  caseId: NegativeCaseSpecV1['caseId'],
  sourceArtifactId: string,
  sourcePath: string,
  assignment: 'C' | 'J',
): NegativeCaseSpecV1 {
  return {
    caseId,
    sourceArtifactId,
    sourcePath,
    sourceDocument: {
      ...NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1,
      edges_assignment: [assignment, 'B', 'B', 'B'],
    },
    expectedIssues: [{ path: '$.edges_assignment[0]', code: 'unsupported-assignment' }],
  };
}

export const NEG_FOLD_UNSUPPORTED_CASE_SPECS_V1 = deepFreezeOwned([
  {
    caseId: 'NEG-FOLD-UNSUPPORTED-MULTI-FRAME',
    sourceArtifactId: 'source-multi-frame',
    sourcePath: 'multi-frame.fold',
    sourceDocument: { ...NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1, file_frames: [{}] },
    expectedIssues: [{ path: '$.file_frames', code: 'unsupported-file-frames' }],
  },
  {
    caseId: 'NEG-FOLD-UNSUPPORTED-3D',
    sourceArtifactId: 'source-3d',
    sourcePath: 'frame-attribute-3d.fold',
    sourceDocument: {
      ...NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1,
      frame_attributes: ['3D'],
    },
    expectedIssues: [
      { path: '$.frame_attributes', code: 'unsupported-frame-attribute' },
      { path: '$.frame_attributes[0]', code: 'unsupported-frame-attribute' },
    ],
  },
  {
    caseId: 'NEG-FOLD-UNSUPPORTED-NONPLANAR-3D-COORDINATE',
    sourceArtifactId: 'source-nonplanar-3d-coordinate',
    sourcePath: 'nonplanar-3d-coordinate.fold',
    sourceDocument: {
      ...NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1,
      vertices_coords: [
        [1, 1, 1],
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    expectedIssues: [
      { path: '$.vertices_coords[0]', code: 'invalid-coordinate' },
      { path: '$.vertices_coords[1]', code: 'invalid-coordinate' },
      { path: '$.vertices_coords[2]', code: 'invalid-coordinate' },
      { path: '$.vertices_coords[3]', code: 'invalid-coordinate' },
    ],
  },
  unsupportedAttributeCase(
    'NEG-FOLD-UNSUPPORTED-NON-MANIFOLD',
    'source-non-manifold',
    'frame-attribute-non-manifold.fold',
    'nonManifold',
  ),
  unsupportedAttributeCase(
    'NEG-FOLD-UNSUPPORTED-NON-ORIENTABLE',
    'source-non-orientable',
    'frame-attribute-non-orientable.fold',
    'nonOrientable',
  ),
  unsupportedAttributeCase(
    'NEG-FOLD-UNSUPPORTED-SELF-INTERSECTING',
    'source-self-intersecting',
    'frame-attribute-self-intersecting.fold',
    'selfIntersecting',
  ),
  unsupportedAttributeCase(
    'NEG-FOLD-UNSUPPORTED-CUTS',
    'source-cuts',
    'frame-attribute-cuts.fold',
    'cuts',
  ),
  unsupportedAttributeCase(
    'NEG-FOLD-UNSUPPORTED-JOINS',
    'source-joins',
    'frame-attribute-joins.fold',
    'joins',
  ),
  unsupportedAssignmentCase(
    'NEG-FOLD-UNSUPPORTED-ASSIGNMENT-C',
    'source-assignment-c',
    'assignment-c.fold',
    'C',
  ),
  unsupportedAssignmentCase(
    'NEG-FOLD-UNSUPPORTED-ASSIGNMENT-J',
    'source-assignment-j',
    'assignment-j.fold',
    'J',
  ),
] as const satisfies readonly NegativeCaseSpecV1[]);

export const NEG_FOLD_UNSUPPORTED_CANDIDATE_README_V1 = `# NEG-FOLD-UNSUPPORTED exact-negative candidate vectors

This directory contains project-authored exact-negative inputs for the closed FOLD NOFACES adapter boundary.

It is intentionally outside \`tests/fixtures/manifest.json\`; none of its \`NEG-FOLD-UNSUPPORTED-*\` case IDs is registered in the canonical manifest. No canonical promotion is claimed. No ToleranceProfile is defined, selected, or implied. Scientific verification is not claimed, and the global M0F gate is not evaluated.

Here, exact-negative means only that this closed adapter deterministically rejects the saved bytes with the complete ordered issue code/path sequence in the ledger. It is not a numerical or scientific impossibility proof. Each source is replayed only through \`adaptFoldDocumentToFaceReconstructionInputV1\`.

Verify without writing:

\`\`\`text
npx tsx m0f/neg-fold-unsupported-candidate-bundle-cli.ts --verify
\`\`\`

Regenerate and immediately verify:

\`\`\`text
npx tsx m0f/neg-fold-unsupported-candidate-bundle-cli.ts --write
\`\`\`
`;

export type NegFoldUnsupportedArtifactProvenanceV1 = Readonly<{
  sourceReferenceId: typeof SOURCE_REFERENCE_ID;
  sourceUse: 'project-authored';
  derivation: 'authored';
  dependsOnArtifactIds: readonly [];
}>;

export type NegFoldUnsupportedArtifactLedgerEntryV1 = Readonly<{
  artifactId: string;
  role: 'readme' | 'negative-source';
  path: string;
  mediaType: 'text/markdown; charset=utf-8' | 'application/vnd.fold+json';
  sha256: `sha256:${string}`;
  licenseSpdx: 'MIT';
  provenance: NegFoldUnsupportedArtifactProvenanceV1;
}>;

type ArtifactSpecV1 = Omit<NegFoldUnsupportedArtifactLedgerEntryV1, 'sha256'>;

const AUTHORED_PROVENANCE: NegFoldUnsupportedArtifactProvenanceV1 = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceUse: 'project-authored',
  derivation: 'authored',
  dependsOnArtifactIds: [],
});

export const NEG_FOLD_UNSUPPORTED_ARTIFACT_SPECS_V1 = deepFreezeOwned([
  {
    artifactId: 'bundle-readme',
    role: 'readme',
    path: 'README.md',
    mediaType: 'text/markdown; charset=utf-8',
    licenseSpdx: 'MIT',
    provenance: AUTHORED_PROVENANCE,
  },
  ...NEG_FOLD_UNSUPPORTED_CASE_SPECS_V1.map((caseSpec) => ({
    artifactId: caseSpec.sourceArtifactId,
    role: 'negative-source' as const,
    path: caseSpec.sourcePath,
    mediaType: 'application/vnd.fold+json' as const,
    licenseSpdx: 'MIT' as const,
    provenance: AUTHORED_PROVENANCE,
  })),
] satisfies readonly ArtifactSpecV1[]);

export type NegFoldUnsupportedCaseLedgerRowV1 = Readonly<{
  caseIndex: number;
  caseId: NegativeCaseSpecV1['caseId'];
  sourceArtifactId: string;
  sourcePath: string;
  expectedOutcome: 'rejected';
  expectedIssues: readonly ExpectedIssueV1[];
}>;

const GENERATOR = deepFreezeOwned({
  generatorId: NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_GENERATOR_ID,
  generatorVersion: NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_GENERATOR_VERSION,
  serialization: 'stable-json-utf8-lf-v1' as const,
  detector: 'adaptFoldDocumentToFaceReconstructionInputV1' as const,
  detectorSourcePath: 'm0f/geometry/fold-document-face-adapter.ts' as const,
});

const SOURCE_PROVENANCE = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceKind: 'project-authored' as const,
  title: 'NEG-FOLD-UNSUPPORTED project-authored exact-negative candidate vectors',
  authors: ['OriDesign contributors'],
  redistribution: 'allowed' as const,
  licenseSpdx: 'MIT' as const,
});

function ledgerCases(): readonly NegFoldUnsupportedCaseLedgerRowV1[] {
  return NEG_FOLD_UNSUPPORTED_CASE_SPECS_V1.map((caseSpec, caseIndex) => ({
    caseIndex,
    caseId: caseSpec.caseId,
    sourceArtifactId: caseSpec.sourceArtifactId,
    sourcePath: caseSpec.sourcePath,
    expectedOutcome: 'rejected' as const,
    expectedIssues: caseSpec.expectedIssues,
  }));
}

export type NegFoldUnsupportedCandidateBundleLedgerV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCHEMA_ID;
  recordType: typeof NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-FOLD-UNSUPPORTED-V1';
  scope: typeof NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCOPE;
  canonicalManifestPath: typeof NEG_FOLD_UNSUPPORTED_CANONICAL_MANIFEST_PATH;
  canonicalManifestRegistration: 'not-registered';
  canonicalPromotionClaimed: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  globalM0fGate: 'not-evaluated';
  caseCount: 10;
  artifactCount: 11;
  generator: typeof GENERATOR;
  provenance: typeof SOURCE_PROVENANCE;
  cases: readonly NegFoldUnsupportedCaseLedgerRowV1[];
  artifacts: readonly NegFoldUnsupportedArtifactLedgerEntryV1[];
}>;

export type NegFoldUnsupportedCandidateLedgerIssueV1 = Readonly<{
  path: string;
  code:
    | 'invalid-snapshot'
    | 'invalid-object'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'invalid-array'
    | 'invalid-case'
    | 'invalid-artifact'
    | 'invalid-hash';
  message: string;
}>;

export type NegFoldUnsupportedCandidateLedgerParseResultV1 =
  | Readonly<{ ok: true; value: NegFoldUnsupportedCandidateBundleLedgerV1 }>
  | Readonly<{ ok: false; error: readonly NegFoldUnsupportedCandidateLedgerIssueV1[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'schemaId',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'vectorSetId',
  'scope',
  'canonicalManifestPath',
  'canonicalManifestRegistration',
  'canonicalPromotionClaimed',
  'toleranceProfileIncluded',
  'scientificVerificationClaimed',
  'globalM0fGate',
  'caseCount',
  'artifactCount',
  'generator',
  'provenance',
  'cases',
  'artifacts',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addIssue(
  issues: NegFoldUnsupportedCandidateLedgerIssueV1[],
  path: string,
  code: NegFoldUnsupportedCandidateLedgerIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: NegFoldUnsupportedCandidateLedgerIssueV1[],
): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) addIssue(issues, `${path}.${key}`, 'unknown-field', 'is not declared');
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key))
      addIssue(issues, `${path}.${key}`, 'missing-field', 'is required');
  }
}

function sameStableJson(left: unknown, right: unknown): boolean {
  try {
    return stableStringify(left) === stableStringify(right);
  } catch {
    return false;
  }
}

/** Parses the exact-negative candidate ledger and rejects all claim or ordering rewrites. */
export function parseNegFoldUnsupportedCandidateBundleLedgerV1(
  supplied: unknown,
): NegFoldUnsupportedCandidateLedgerParseResultV1 {
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
      error: [{ path: '$', code: 'invalid-object' as const, message: 'must be an object' }],
    });
  }

  const value = snapshot.value;
  const issues: NegFoldUnsupportedCandidateLedgerIssueV1[] = [];
  exactKeys(value, ROOT_KEYS, '$', issues);
  const literals = [
    ['schemaVersion', 1],
    ['schemaId', NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCHEMA_ID],
    ['recordType', NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_RECORD_TYPE],
    ['contractStatus', 'candidate'],
    ['scientificClaim', false],
    ['vectorSetId', 'NEG-FOLD-UNSUPPORTED-V1'],
    ['scope', NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCOPE],
    ['canonicalManifestPath', NEG_FOLD_UNSUPPORTED_CANONICAL_MANIFEST_PATH],
    ['canonicalManifestRegistration', 'not-registered'],
    ['canonicalPromotionClaimed', false],
    ['toleranceProfileIncluded', false],
    ['scientificVerificationClaimed', false],
    ['globalM0fGate', 'not-evaluated'],
    ['caseCount', NEG_FOLD_UNSUPPORTED_CASE_SPECS_V1.length],
    ['artifactCount', NEG_FOLD_UNSUPPORTED_ARTIFACT_SPECS_V1.length],
  ] as const;
  for (const [key, expected] of literals) {
    if (value[key] !== expected) {
      addIssue(issues, `$.${key}`, 'invalid-literal', `must equal ${JSON.stringify(expected)}`);
    }
  }
  if (!sameStableJson(value.generator, GENERATOR)) {
    addIssue(issues, '$.generator', 'invalid-literal', 'must equal the fixed adapter generator');
  }
  if (!sameStableJson(value.provenance, SOURCE_PROVENANCE)) {
    addIssue(issues, '$.provenance', 'invalid-literal', 'must equal project-authored provenance');
  }

  const expectedCases = ledgerCases();
  if (!Array.isArray(value.cases) || value.cases.length !== expectedCases.length) {
    addIssue(issues, '$.cases', 'invalid-array', 'must contain the ten ordered negative cases');
  } else {
    for (const [index, expected] of expectedCases.entries()) {
      const actual: unknown = value.cases[index];
      if (!sameStableJson(actual, expected)) {
        addIssue(
          issues,
          `$.cases[${String(index)}]`,
          'invalid-case',
          'case ID, source path, or complete ordered expected issue list differs',
        );
      }
    }
  }

  if (
    !Array.isArray(value.artifacts) ||
    value.artifacts.length !== NEG_FOLD_UNSUPPORTED_ARTIFACT_SPECS_V1.length
  ) {
    addIssue(issues, '$.artifacts', 'invalid-array', 'must contain eleven artifact rows');
  } else {
    for (const [index, expected] of NEG_FOLD_UNSUPPORTED_ARTIFACT_SPECS_V1.entries()) {
      const actual: unknown = value.artifacts[index];
      const path = `$.artifacts[${String(index)}]`;
      if (!isRecord(actual)) {
        addIssue(issues, path, 'invalid-artifact', 'must be an artifact object');
        continue;
      }
      exactKeys(
        actual,
        ['artifactId', 'role', 'path', 'mediaType', 'sha256', 'licenseSpdx', 'provenance'],
        path,
        issues,
      );
      const { sha256, ...withoutHash } = actual;
      if (!sameStableJson(withoutHash, expected)) {
        addIssue(
          issues,
          path,
          'invalid-artifact',
          'artifact identity, path, role, license, or provenance differs',
        );
      }
      if (typeof sha256 !== 'string' || !SHA256_PATTERN.test(sha256)) {
        addIssue(issues, `${path}.sha256`, 'invalid-hash', 'must be a lowercase SHA-256 value');
      }
    }
  }

  if (issues.length > 0) return deepFreezeOwned({ ok: false as const, error: issues });
  return deepFreezeOwned({
    ok: true as const,
    value: value as unknown as NegFoldUnsupportedCandidateBundleLedgerV1,
  });
}

function issueSignature(
  issues: readonly FoldDocumentFaceAdapterIssue[],
): readonly ExpectedIssueV1[] {
  return issues.map(({ path, code }) => ({ path, code }));
}

function jsonLine(value: unknown): string {
  return `${stableStringify(value)}\n`;
}

export type NegFoldUnsupportedCandidateBuiltFileV1 = Readonly<{
  artifactId: string | null;
  path: string;
  text: string;
}>;

export type NegFoldUnsupportedCandidateBuildV1 = Readonly<{
  ledger: NegFoldUnsupportedCandidateBundleLedgerV1;
  files: readonly NegFoldUnsupportedCandidateBuiltFileV1[];
}>;

/** Builds only after every fixed source reproduces its complete ordered adapter issue signature. */
export function buildNegFoldUnsupportedCandidateBundleV1(): NegFoldUnsupportedCandidateBuildV1 {
  const controlResult = adaptFoldDocumentToFaceReconstructionInputV1(
    NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1,
  );
  if (!controlResult.ok) {
    throw new TypeError('valid square adapter control must remain accepted');
  }
  const textByArtifactId = new Map<string, string>([
    ['bundle-readme', NEG_FOLD_UNSUPPORTED_CANDIDATE_README_V1],
  ]);
  for (const caseSpec of NEG_FOLD_UNSUPPORTED_CASE_SPECS_V1) {
    const result = adaptFoldDocumentToFaceReconstructionInputV1(caseSpec.sourceDocument);
    if (result.ok || !sameStableJson(issueSignature(result.error), caseSpec.expectedIssues)) {
      throw new TypeError(`negative case no longer matches adapter: ${caseSpec.caseId}`);
    }
    textByArtifactId.set(caseSpec.sourceArtifactId, jsonLine(caseSpec.sourceDocument));
  }

  const artifacts = NEG_FOLD_UNSUPPORTED_ARTIFACT_SPECS_V1.map((spec) => {
    const text = textByArtifactId.get(spec.artifactId);
    if (text === undefined) throw new TypeError(`missing negative artifact ${spec.artifactId}`);
    return { ...spec, sha256: sha256Prefixed(text) as `sha256:${string}` };
  });
  const ledger: NegFoldUnsupportedCandidateBundleLedgerV1 = {
    schemaVersion: 1,
    schemaId: NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCHEMA_ID,
    recordType: NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    vectorSetId: 'NEG-FOLD-UNSUPPORTED-V1',
    scope: NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCOPE,
    canonicalManifestPath: NEG_FOLD_UNSUPPORTED_CANONICAL_MANIFEST_PATH,
    canonicalManifestRegistration: 'not-registered',
    canonicalPromotionClaimed: false,
    toleranceProfileIncluded: false,
    scientificVerificationClaimed: false,
    globalM0fGate: 'not-evaluated',
    caseCount: 10,
    artifactCount: 11,
    generator: GENERATOR,
    provenance: SOURCE_PROVENANCE,
    cases: ledgerCases(),
    artifacts,
  };
  const files: NegFoldUnsupportedCandidateBuiltFileV1[] = artifacts.map((artifact) => {
    const text = textByArtifactId.get(artifact.artifactId);
    if (text === undefined) throw new TypeError(`missing negative artifact ${artifact.artifactId}`);
    return { artifactId: artifact.artifactId, path: artifact.path, text };
  });
  files.push({
    artifactId: null,
    path: NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME,
    text: jsonLine(ledger),
  });
  return deepFreezeOwned({ ledger, files });
}

/** Writes the exact closed file set and refuses to clean unexpected entries. */
export async function writeNegFoldUnsupportedCandidateBundleV1(
  bundleDirectory: string = NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegFoldUnsupportedCandidateBuildV1> {
  const built = buildNegFoldUnsupportedCandidateBundleV1();
  const absoluteDirectory = resolve(bundleDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const expectedNames = new Set(built.files.map((file) => file.path));
  const existing = await readdir(absoluteDirectory, { withFileTypes: true });
  if (existing.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))) {
    throw new TypeError('negative candidate directory contains an unexpected entry');
  }
  await Promise.all(
    built.files.map((file) => writeFile(resolve(absoluteDirectory, file.path), file.text, 'utf8')),
  );
  return built;
}

export const NEG_FOLD_UNSUPPORTED_CANDIDATE_REASON_CODES = [
  'ledger-unreadable',
  'ledger-invalid',
  'artifact-set-mismatch',
  'artifact-unreadable',
  'artifact-hash-mismatch',
  'canonical-manifest-unreadable',
  'canonical-manifest-registration-present',
  'source-invalid-json',
  'source-unexpectedly-accepted',
  'adapter-issue-mismatch',
  'deterministic-regeneration-mismatch',
  'unexpected-failure',
] as const;

export type NegFoldUnsupportedCandidateReasonCodeV1 =
  (typeof NEG_FOLD_UNSUPPORTED_CANDIDATE_REASON_CODES)[number];

export type NegFoldUnsupportedCandidateVerificationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-neg-fold-unsupported-candidate-bundle-verification-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-FOLD-UNSUPPORTED-V1';
  scope: typeof NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCOPE;
  globalM0fGate: 'not-evaluated';
  canonicalPromotionClaimed: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  reproducibleExactNegativeBundle: boolean;
  reasonCodes: readonly NegFoldUnsupportedCandidateReasonCodeV1[];
  checks: Readonly<{
    ledgerPresentAndValid: boolean;
    artifactSetExact: boolean;
    allArtifactHashesMatch: boolean;
    allArtifactProvenanceFixed: boolean;
    canonicalManifestRegistrationAbsent: boolean;
    sourceCaseCount: number;
    everySourceParsed: boolean;
    everySourceRejected: boolean;
    everyOrderedIssueSignatureMatched: boolean;
    deterministicRegenerationMatched: boolean;
  }>;
}>;

interface MutableVerificationState {
  reasons: Set<NegFoldUnsupportedCandidateReasonCodeV1>;
  ledgerPresentAndValid: boolean;
  artifactSetExact: boolean;
  allArtifactHashesMatch: boolean;
  allArtifactProvenanceFixed: boolean;
  canonicalManifestRegistrationAbsent: boolean;
  sourceCaseCount: number;
  everySourceParsed: boolean;
  everySourceRejected: boolean;
  everyOrderedIssueSignatureMatched: boolean;
  deterministicRegenerationMatched: boolean;
}

function initialState(): MutableVerificationState {
  return {
    reasons: new Set(),
    ledgerPresentAndValid: false,
    artifactSetExact: false,
    allArtifactHashesMatch: false,
    allArtifactProvenanceFixed: false,
    canonicalManifestRegistrationAbsent: false,
    sourceCaseCount: 0,
    everySourceParsed: false,
    everySourceRejected: false,
    everyOrderedIssueSignatureMatched: false,
    deterministicRegenerationMatched: false,
  };
}

function resultFromState(
  state: MutableVerificationState,
): NegFoldUnsupportedCandidateVerificationResultV1 {
  const reasonCodes = NEG_FOLD_UNSUPPORTED_CANDIDATE_REASON_CODES.filter((code) =>
    state.reasons.has(code),
  );
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: 'm0f-neg-fold-unsupported-candidate-bundle-verification-result' as const,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    vectorSetId: 'NEG-FOLD-UNSUPPORTED-V1' as const,
    scope: NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCOPE,
    globalM0fGate: 'not-evaluated' as const,
    canonicalPromotionClaimed: false as const,
    toleranceProfileIncluded: false as const,
    scientificVerificationClaimed: false as const,
    reproducibleExactNegativeBundle: reasonCodes.length === 0,
    reasonCodes,
    checks: {
      ledgerPresentAndValid: state.ledgerPresentAndValid,
      artifactSetExact: state.artifactSetExact,
      allArtifactHashesMatch: state.allArtifactHashesMatch,
      allArtifactProvenanceFixed: state.allArtifactProvenanceFixed,
      canonicalManifestRegistrationAbsent: state.canonicalManifestRegistrationAbsent,
      sourceCaseCount: state.sourceCaseCount,
      everySourceParsed: state.everySourceParsed,
      everySourceRejected: state.everySourceRejected,
      everyOrderedIssueSignatureMatched: state.everyOrderedIssueSignatureMatched,
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

async function canonicalCasesAreAbsent(): Promise<boolean | undefined> {
  try {
    const manifest = parseFixtureManifest(
      JSON.parse(
        await readFile(resolve(NEG_FOLD_UNSUPPORTED_CANONICAL_MANIFEST_PATH), 'utf8'),
      ) as unknown,
    );
    if (manifest.manifest === undefined) return undefined;
    return !manifest.manifest.fixtures.some((fixture) =>
      fixture.id.startsWith(NEG_FOLD_UNSUPPORTED_CASE_ID_PREFIX),
    );
  } catch {
    return undefined;
  }
}

/** Replays only the saved sources through the existing adapter and compares complete issue arrays. */
export async function verifyNegFoldUnsupportedCandidateBundleV1(
  bundleDirectory: string = NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegFoldUnsupportedCandidateVerificationResultV1> {
  const state = initialState();
  try {
    const absoluteDirectory = resolve(bundleDirectory);
    let ledgerDocument: unknown;
    try {
      ledgerDocument = JSON.parse(
        await readFile(
          resolve(absoluteDirectory, NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME),
          'utf8',
        ),
      ) as unknown;
    } catch {
      state.reasons.add('ledger-unreadable');
      return resultFromState(state);
    }
    const parsedLedger = parseNegFoldUnsupportedCandidateBundleLedgerV1(ledgerDocument);
    if (!parsedLedger.ok) {
      state.reasons.add('ledger-invalid');
      return resultFromState(state);
    }
    state.ledgerPresentAndValid = true;
    state.allArtifactProvenanceFixed = true;

    const expectedNames = new Set([
      NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME,
      ...parsedLedger.value.artifacts.map((artifact) => artifact.path),
    ]);
    const directoryEntries = await readdir(absoluteDirectory, { withFileTypes: true });
    if (
      directoryEntries.length !== expectedNames.size ||
      directoryEntries.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))
    ) {
      state.reasons.add('artifact-set-mismatch');
      return resultFromState(state);
    }
    state.artifactSetExact = true;

    const textByArtifactId = new Map<string, string>();
    for (const artifact of parsedLedger.value.artifacts) {
      let bytes: Uint8Array;
      try {
        bytes = await readFile(resolve(absoluteDirectory, artifact.path));
      } catch {
        state.reasons.add('artifact-unreadable');
        return resultFromState(state);
      }
      if (sha256Prefixed(bytes) !== artifact.sha256) {
        state.reasons.add('artifact-hash-mismatch');
        return resultFromState(state);
      }
      textByArtifactId.set(artifact.artifactId, Buffer.from(bytes).toString('utf8'));
    }
    state.allArtifactHashesMatch = true;

    const canonicalAbsent = await canonicalCasesAreAbsent();
    if (canonicalAbsent === undefined) state.reasons.add('canonical-manifest-unreadable');
    else if (!canonicalAbsent) state.reasons.add('canonical-manifest-registration-present');
    else state.canonicalManifestRegistrationAbsent = true;

    let everyParsed = true;
    let everyRejected = true;
    let everySignatureMatched = true;
    for (const caseRow of parsedLedger.value.cases) {
      const sourceText = textByArtifactId.get(caseRow.sourceArtifactId);
      const source = parseJsonText(sourceText ?? '');
      if (source === undefined) {
        everyParsed = false;
        state.reasons.add('source-invalid-json');
        continue;
      }
      state.sourceCaseCount += 1;
      const adapted = adaptFoldDocumentToFaceReconstructionInputV1(source);
      if (adapted.ok) {
        everyRejected = false;
        state.reasons.add('source-unexpectedly-accepted');
        continue;
      }
      if (!sameStableJson(issueSignature(adapted.error), caseRow.expectedIssues)) {
        everySignatureMatched = false;
        state.reasons.add('adapter-issue-mismatch');
      }
    }
    state.everySourceParsed =
      everyParsed && state.sourceCaseCount === NEG_FOLD_UNSUPPORTED_CASE_SPECS_V1.length;
    state.everySourceRejected = state.everySourceParsed && everyRejected;
    state.everyOrderedIssueSignatureMatched = state.everySourceRejected && everySignatureMatched;

    const regenerated = buildNegFoldUnsupportedCandidateBundleV1();
    const regeneratedByPath = new Map(regenerated.files.map((file) => [file.path, file.text]));
    const savedLedgerText = await readFile(
      resolve(absoluteDirectory, NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME),
      'utf8',
    );
    const allBytesMatch = regenerated.files.every((file) => {
      const saved =
        file.artifactId === null ? savedLedgerText : textByArtifactId.get(file.artifactId);
      return saved === regeneratedByPath.get(file.path);
    });
    if (!allBytesMatch) state.reasons.add('deterministic-regeneration-mismatch');
    else state.deterministicRegenerationMatched = true;

    return resultFromState(state);
  } catch {
    state.reasons.add('unexpected-failure');
    return resultFromState(state);
  }
}
