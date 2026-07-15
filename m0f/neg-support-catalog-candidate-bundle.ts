import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import { parseFixtureManifest, sha256Prefixed } from './manifest.js';
import {
  parseSupportProfileCandidatesV1,
  type SupportProfileCandidatesIssue,
} from './profiles/support-profiles.js';
import { stableStringify } from './stable-json.js';

export const NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/neg-support-catalog-candidate-bundle-ledger-v1.schema.json' as const;
export const NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_RECORD_TYPE =
  'm0f-neg-support-catalog-candidate-bundle-ledger' as const;
export const NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCOPE =
  'project-authored-exact-negative-support-profile-candidate-catalog-parser-replay-only' as const;
export const NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_GENERATOR_ID =
  'oridesign-neg-support-catalog-candidate-bundle' as const;
export const NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_GENERATOR_VERSION = '1.0.0-candidate' as const;
export const NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY =
  'tests/candidate-vectors/NEG-SUPPORT-CATALOG' as const;
export const NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME =
  'candidate-bundle-ledger.json' as const;
export const NEG_SUPPORT_CATALOG_CANONICAL_MANIFEST_PATH = 'tests/fixtures/manifest.json' as const;
export const NEG_SUPPORT_CATALOG_CASE_ID_PREFIX = 'NEG-SUPPORT-CATALOG-' as const;

const SOURCE_REFERENCE_ID = 'oridesign-neg-support-catalog-candidates-v1' as const;
const CONTROL_ARTIFACT_ID = 'control-support-profile-candidate-catalog' as const;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

type JsonRecord = Record<string, unknown>;

function numericSelection(...candidates: number[]): JsonRecord {
  return { candidates, selected: null };
}

function policySelection(...candidates: string[]): JsonRecord {
  return { candidates, selected: null };
}

function generationCommonConstraints(): JsonRecord {
  return {
    leafCountMinimum: numericSelection(2),
    leafCountMaximum: numericSelection(4, 8, 20),
    maxTreeDegree: numericSelection(3, 4, 6, 10, 20),
    maxTreeEdges: numericSelection(7, 19, 39),
    degreeSequencePolicy: policySelection('bounded-explicit-sequence'),
    cyclicOrderPolicy: policySelection('required-explicit'),
    maxInputDecimalDigits: numericSelection(8, 12, 15),
    minNormalizedBranchLength: numericSelection(1e-8, 0.000001, 0.0001),
    maxNormalizedLengthRatio: numericSelection(100, 1000, 10000),
    maxWidthToLengthRatio: numericSelection(0.1, 0.25, 0.5, 1),
    branchWidthAccommodationPolicy: policySelection('all-branches-including-internal'),
    maxPaperAspectRatio: numericSelection(1, 2, 4),
    minNormalizedPaperFeature: numericSelection(1e-8, 0.000001, 0.0001),
    minNormalizedBoundaryMargin: numericSelection(0.000001, 0.0001, 0.001),
  };
}

function pathCommonConstraints(): JsonRecord {
  return {
    maxPathDegreesOfFreedom: numericSelection(4, 8, 16),
    maxClosedLoopConditionNumber: numericSelection(1000, 10000, 1000000),
    layerPatternPolicy: policySelection('finite-certified-pattern-library'),
    terminationModel: policySelection('finite-enumeration', 'total-constructive'),
  };
}

function supportCatalogControl(): JsonRecord {
  return {
    schemaVersion: 1,
    schemaId: 'https://oridesign.local/schemas/m0f/support-profile-candidates-v1.schema.json',
    catalogId: 'oridesign-support-profile-v1-candidates',
    status: 'candidate',
    profiles: [
      {
        profileId: 'oridesign-generation-tree-method-v1-candidates',
        kind: 'design-generation',
        method: 'treeMethod',
        profileHash: null,
        constraintsSchemaId:
          'https://oridesign.local/schemas/m0f/support-profile-tree-method-constraints-v1',
        constraints: {
          ...generationCommonConstraints(),
          packingCondition: policySelection('strict-circle-river-clearance', 'certified-tangency'),
          moleculeFamily: policySelection(
            'finite-certified-gadget-library',
            'universal-molecule-subset',
          ),
          minNormalizedSingularityDistance: numericSelection(1e-8, 0.000001, 0.0001),
          pathCompositionPolicy: policySelection(
            'constructive-gadget-schedule',
            'certified-continuation',
          ),
          ...pathCommonConstraints(),
        },
        evidence: { status: 'pending', ref: null },
      },
      {
        profileId: 'oridesign-generation-box-pleating-v1-candidates',
        kind: 'design-generation',
        method: 'boxPleating',
        profileHash: null,
        constraintsSchemaId:
          'https://oridesign.local/schemas/m0f/support-profile-box-pleating-constraints-v1',
        constraints: {
          ...generationCommonConstraints(),
          maxGridColumns: numericSelection(16, 32, 64, 128),
          maxGridRows: numericSelection(16, 32, 64, 128),
          cellGeometryPolicy: policySelection('square-cells-only'),
          gridAspectPolicy: policySelection('independent-nx-ny-rectangular-sheet'),
          directionFamilyPolicy: policySelection('orthogonal-axial-n'),
          maxNormalizedQuantizationError: numericSelection(1e-8, 0.000001, 0.0001, 0.01),
          junctionGadgetFamily: policySelection('finite-certified-junction-library'),
          elevationRoutingPolicy: policySelection('integer-axial-plus-n'),
          pathCompositionPolicy: policySelection('constructive-gadget-schedule'),
          ...pathCommonConstraints(),
        },
        evidence: { status: 'pending', ref: null },
      },
      {
        profileId: 'oridesign-fold-verification-v1-candidates',
        kind: 'fold-verification',
        profileHash: null,
        constraintsSchemaId:
          'https://oridesign.local/schemas/m0f/support-profile-fold-verification-constraints-v1',
        constraints: {
          formatVersionPolicy: policySelection('fold-1.1-1.2-top-level-keyframe'),
          dimensionPolicy: policySelection('two-dimensional-cp'),
          fileFramesPolicy: policySelection('absent-or-empty'),
          maxVertices: numericSelection(100, 1000, 10000),
          maxEdges: numericSelection(200, 2000, 20000),
          maxFaces: numericSelection(100, 1000, 10000),
          assignmentPolicy: policySelection('mvbfu-only'),
          facesPolicy: policySelection('present-or-reconstruct'),
          planarityPolicy: policySelection('certified-planar'),
          manifoldPolicy: policySelection('two-manifold-with-boundary'),
          minNormalizedFeature: numericSelection(1e-8, 0.000001, 0.0001),
          maxPaperAspectRatio: numericSelection(1, 2, 4),
          maxVertexDegree: numericSelection(4, 8, 16),
          faceAdjacencyPolicy: policySelection('consistent-two-sided-incidence'),
          treeDependencyPolicy: policySelection('none'),
          targetPolicy: policySelection('cp-mv-consistent-complete-flat'),
          pathCompositionPolicy: policySelection('certified-continuation'),
          ...pathCommonConstraints(),
        },
        evidence: { status: 'pending', ref: null },
      },
    ],
  };
}

export const NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1 = deepFreezeOwned(supportCatalogControl());

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredRecord(value: unknown, description: string): JsonRecord {
  if (!isRecord(value)) throw new TypeError(`missing fixed ${description}`);
  return value;
}

function requiredEntry<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new TypeError(`missing fixed entry ${String(index)}`);
  return value;
}

function profiles(source: JsonRecord): JsonRecord[] {
  if (!Array.isArray(source.profiles)) throw new TypeError('missing fixed profiles');
  return source.profiles.map((entry, index) => requiredRecord(entry, `profile ${String(index)}`));
}

function profile(source: JsonRecord, index: number): JsonRecord {
  return requiredEntry(profiles(source), index);
}

function constraints(source: JsonRecord, profileIndex: number): JsonRecord {
  return requiredRecord(profile(source, profileIndex).constraints, 'constraints');
}

function selection(source: JsonRecord, profileIndex: number, key: string): JsonRecord {
  return requiredRecord(constraints(source, profileIndex)[key], `selection ${key}`);
}

function mutateControl(mutation: (source: JsonRecord) => void): JsonRecord {
  const source = structuredClone(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1);
  mutation(source);
  return source;
}

type ExpectedIssueV1 = Readonly<{
  path: string;
  code: SupportProfileCandidatesIssue['code'];
}>;

type NegativeCaseSpecV1 = Readonly<{
  caseId: `${typeof NEG_SUPPORT_CATALOG_CASE_ID_PREFIX}${string}`;
  mutationKind: string;
  changedPaths: readonly string[];
  sourceArtifactId: string;
  sourcePath: string;
  sourceDocument: JsonRecord;
  expectedIssues: readonly ExpectedIssueV1[];
}>;

export const NEG_SUPPORT_CATALOG_CASE_SPECS_V1 = deepFreezeOwned([
  {
    caseId: 'NEG-SUPPORT-CATALOG-PREMATURE-FROZEN',
    mutationKind: 'replace-candidate-status-with-frozen',
    changedPaths: ['$.status'],
    sourceArtifactId: 'source-premature-frozen',
    sourcePath: 'premature-frozen.json',
    sourceDocument: mutateControl((source) => {
      source.status = 'frozen';
    }),
    expectedIssues: [{ path: '$.status', code: 'premature-frozen-profile' }],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-PREMATURE-PROFILE-HASH',
    mutationKind: 'attach-profile-hash-before-evidence',
    changedPaths: ['$.profiles[0].profileHash'],
    sourceArtifactId: 'source-premature-profile-hash',
    sourcePath: 'premature-profile-hash.json',
    sourceDocument: mutateControl((source) => {
      profile(source, 0).profileHash = `sha256:${'0'.repeat(64)}`;
    }),
    expectedIssues: [{ path: '$.profiles[0].profileHash', code: 'premature-profile-hash' }],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-SELECT-TREE-MAX-DEGREE',
    mutationKind: 'select-tree-max-degree-candidate',
    changedPaths: ['$.profiles[0].constraints.maxTreeDegree.selected'],
    sourceArtifactId: 'source-select-tree-max-degree',
    sourcePath: 'select-tree-max-degree.json',
    sourceDocument: mutateControl((source) => {
      selection(source, 0, 'maxTreeDegree').selected = 4;
    }),
    expectedIssues: [
      {
        path: '$.profiles[0].constraints.maxTreeDegree.selected',
        code: 'premature-selection',
      },
    ],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-SELECT-TREE-DECIMAL-DIGITS',
    mutationKind: 'select-tree-decimal-digit-candidate',
    changedPaths: ['$.profiles[0].constraints.maxInputDecimalDigits.selected'],
    sourceArtifactId: 'source-select-tree-decimal-digits',
    sourcePath: 'select-tree-decimal-digits.json',
    sourceDocument: mutateControl((source) => {
      selection(source, 0, 'maxInputDecimalDigits').selected = 12;
    }),
    expectedIssues: [
      {
        path: '$.profiles[0].constraints.maxInputDecimalDigits.selected',
        code: 'premature-selection',
      },
    ],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-SELECT-TREE-LENGTH-RATIO',
    mutationKind: 'select-tree-length-ratio-candidate',
    changedPaths: ['$.profiles[0].constraints.maxNormalizedLengthRatio.selected'],
    sourceArtifactId: 'source-select-tree-length-ratio',
    sourcePath: 'select-tree-length-ratio.json',
    sourceDocument: mutateControl((source) => {
      selection(source, 0, 'maxNormalizedLengthRatio').selected = 1000;
    }),
    expectedIssues: [
      {
        path: '$.profiles[0].constraints.maxNormalizedLengthRatio.selected',
        code: 'premature-selection',
      },
    ],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-SELECT-GRID-COLUMNS',
    mutationKind: 'select-box-grid-column-candidate',
    changedPaths: ['$.profiles[1].constraints.maxGridColumns.selected'],
    sourceArtifactId: 'source-select-grid-columns',
    sourcePath: 'select-grid-columns.json',
    sourceDocument: mutateControl((source) => {
      selection(source, 1, 'maxGridColumns').selected = 64;
    }),
    expectedIssues: [
      {
        path: '$.profiles[1].constraints.maxGridColumns.selected',
        code: 'premature-selection',
      },
    ],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-SELECT-GRID-QUANTIZATION-ERROR',
    mutationKind: 'select-box-grid-quantization-error-candidate',
    changedPaths: ['$.profiles[1].constraints.maxNormalizedQuantizationError.selected'],
    sourceArtifactId: 'source-select-grid-quantization-error',
    sourcePath: 'select-grid-quantization-error.json',
    sourceDocument: mutateControl((source) => {
      selection(source, 1, 'maxNormalizedQuantizationError').selected = 0.01;
    }),
    expectedIssues: [
      {
        path: '$.profiles[1].constraints.maxNormalizedQuantizationError.selected',
        code: 'premature-selection',
      },
    ],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-SELECT-FOLD-MAX-VERTICES',
    mutationKind: 'select-fold-max-vertices-candidate',
    changedPaths: ['$.profiles[2].constraints.maxVertices.selected'],
    sourceArtifactId: 'source-select-fold-max-vertices',
    sourcePath: 'select-fold-max-vertices.json',
    sourceDocument: mutateControl((source) => {
      selection(source, 2, 'maxVertices').selected = 1000;
    }),
    expectedIssues: [
      {
        path: '$.profiles[2].constraints.maxVertices.selected',
        code: 'premature-selection',
      },
    ],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-PREMATURE-EVIDENCE',
    mutationKind: 'replace-pending-evidence-status',
    changedPaths: ['$.profiles[2].evidence.status'],
    sourceArtifactId: 'source-premature-evidence',
    sourcePath: 'premature-evidence.json',
    sourceDocument: mutateControl((source) => {
      requiredRecord(profile(source, 2).evidence, 'fold evidence').status = 'measured';
    }),
    expectedIssues: [{ path: '$.profiles[2].evidence', code: 'premature-evidence' }],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-METHOD-MISMATCH',
    mutationKind: 'replace-tree-method-with-box-pleating',
    changedPaths: ['$.profiles[0].method'],
    sourceArtifactId: 'source-method-mismatch',
    sourcePath: 'method-mismatch.json',
    sourceDocument: mutateControl((source) => {
      profile(source, 0).method = 'boxPleating';
    }),
    expectedIssues: [{ path: '$.profiles[0].method', code: 'profile-method-mismatch' }],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-UNKNOWN-SOLVER-KEY',
    mutationKind: 'append-undeclared-solver-constraint',
    changedPaths: ['$.profiles[0].constraints.solverSucceeded'],
    sourceArtifactId: 'source-unknown-solver-key',
    sourcePath: 'unknown-solver-key.json',
    sourceDocument: mutateControl((source) => {
      constraints(source, 0).solverSucceeded = { candidates: [true], selected: null };
    }),
    expectedIssues: [{ path: '$.profiles[0].constraints.solverSucceeded', code: 'unknown-key' }],
  },
  {
    caseId: 'NEG-SUPPORT-CATALOG-UNSORTED-CANDIDATES',
    mutationKind: 'replace-one-candidate-with-descending-value',
    changedPaths: ['$.profiles[0].constraints.leafCountMaximum.candidates[1]'],
    sourceArtifactId: 'source-unsorted-candidates',
    sourcePath: 'unsorted-candidates.json',
    sourceDocument: mutateControl((source) => {
      const candidates = selection(source, 0, 'leafCountMaximum').candidates;
      if (!Array.isArray(candidates)) throw new TypeError('missing fixed numeric candidates');
      candidates[1] = 3;
    }),
    expectedIssues: [
      {
        path: '$.profiles[0].constraints.leafCountMaximum.candidates[1]',
        code: 'invalid-candidates',
      },
    ],
  },
] as const satisfies readonly NegativeCaseSpecV1[]);

export const NEG_SUPPORT_CATALOG_CANDIDATE_README_V1 = `# NEG-SUPPORT-CATALOG exact-negative candidate vectors

This closed directory contains one project-authored accepted SupportProfile candidate catalog and exact-negative mutations for the current \`parseSupportProfileCandidatesV1\` boundary only.

The \`NEG-SUPPORT-CATALOG-*\` IDs are deliberately distinct from the canonical \`NEG-SUPPORT-BOUNDARY-*\` family. They are not registered in \`tests/fixtures/manifest.json\`, do not satisfy canonical \`support:boundary\` coverage, and make no canonical promotion claim.

Every catalog selection remains pending in the accepted control, including the termination-model candidates. This bundle establishes no termination guarantee. It does not freeze or define a SupportProfile, implement \`checkSupport\`, decide whether any actual input is supported, validate a construction, make a scientific claim, or evaluate M0F GO. It includes no ToleranceProfile.

Exact-negative means only that \`parseSupportProfileCandidatesV1\` rejects each saved mutation with the complete ordered issue code/path list fixed by the ledger. This is candidate-catalog parser regression evidence, not measured support-boundary evidence.

Verify with \`npx tsx m0f/neg-support-catalog-candidate-bundle-cli.ts --verify\`. Regenerate with \`npx tsx m0f/neg-support-catalog-candidate-bundle-cli.ts --write\`.
`;

export type NegSupportCatalogArtifactProvenanceV1 = Readonly<{
  sourceReferenceId: typeof SOURCE_REFERENCE_ID;
  sourceUse: 'project-authored';
  derivation: 'authored' | 'mutated-from-control';
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[];
}>;

export type NegSupportCatalogArtifactLedgerEntryV1 = Readonly<{
  artifactId: string;
  role: 'readme' | 'accepted-control' | 'negative-source';
  path: string;
  mediaType: 'text/markdown; charset=utf-8' | 'application/json';
  sha256: `sha256:${string}`;
  licenseSpdx: 'MIT';
  provenance: NegSupportCatalogArtifactProvenanceV1;
}>;

type ArtifactSpecV1 = Omit<NegSupportCatalogArtifactLedgerEntryV1, 'sha256'>;

function artifactProvenance(
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[],
): NegSupportCatalogArtifactProvenanceV1 {
  return {
    sourceReferenceId: SOURCE_REFERENCE_ID,
    sourceUse: 'project-authored',
    derivation: dependsOnArtifactIds.length === 0 ? 'authored' : 'mutated-from-control',
    dependsOnArtifactIds,
  };
}

export const NEG_SUPPORT_CATALOG_ARTIFACT_SPECS_V1 = deepFreezeOwned([
  {
    artifactId: 'bundle-readme',
    role: 'readme',
    path: 'README.md',
    mediaType: 'text/markdown; charset=utf-8',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([]),
  },
  {
    artifactId: CONTROL_ARTIFACT_ID,
    role: 'accepted-control',
    path: 'control-support-profile-candidate-catalog.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([]),
  },
  ...NEG_SUPPORT_CATALOG_CASE_SPECS_V1.map((caseSpec) => ({
    artifactId: caseSpec.sourceArtifactId,
    role: 'negative-source' as const,
    path: caseSpec.sourcePath,
    mediaType: 'application/json' as const,
    licenseSpdx: 'MIT' as const,
    provenance: artifactProvenance([CONTROL_ARTIFACT_ID]),
  })),
] satisfies readonly ArtifactSpecV1[]);

export type NegSupportCatalogCaseLedgerRowV1 = Readonly<{
  caseIndex: number;
  caseId: NegativeCaseSpecV1['caseId'];
  controlArtifactId: typeof CONTROL_ARTIFACT_ID;
  mutationKind: string;
  changedPaths: readonly string[];
  sourceArtifactId: string;
  sourcePath: string;
  expectedOutcome: 'rejected';
  expectedIssues: readonly ExpectedIssueV1[];
}>;

const GENERATOR = deepFreezeOwned({
  generatorId: NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_GENERATOR_ID,
  generatorVersion: NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_GENERATOR_VERSION,
  serialization: 'stable-json-utf8-lf-v1' as const,
  detector: 'parseSupportProfileCandidatesV1' as const,
  detectorSourcePath: 'm0f/profiles/support-profiles.ts' as const,
});

const SOURCE_PROVENANCE = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceKind: 'project-authored' as const,
  title: 'NEG-SUPPORT-CATALOG project-authored candidate-catalog parser vectors',
  authors: ['OriDesign contributors'],
  redistribution: 'allowed' as const,
  licenseSpdx: 'MIT' as const,
});

function ledgerCases(): readonly NegSupportCatalogCaseLedgerRowV1[] {
  return NEG_SUPPORT_CATALOG_CASE_SPECS_V1.map((caseSpec, caseIndex) => ({
    caseIndex,
    caseId: caseSpec.caseId,
    controlArtifactId: CONTROL_ARTIFACT_ID,
    mutationKind: caseSpec.mutationKind,
    changedPaths: caseSpec.changedPaths,
    sourceArtifactId: caseSpec.sourceArtifactId,
    sourcePath: caseSpec.sourcePath,
    expectedOutcome: 'rejected' as const,
    expectedIssues: caseSpec.expectedIssues,
  }));
}

export type NegSupportCatalogCandidateBundleLedgerV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCHEMA_ID;
  recordType: typeof NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-SUPPORT-CATALOG-V1';
  scope: typeof NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCOPE;
  candidateCatalogOnly: true;
  canonicalManifestPath: typeof NEG_SUPPORT_CATALOG_CANONICAL_MANIFEST_PATH;
  canonicalManifestRegistration: 'not-registered';
  canonicalPromotionClaimed: false;
  canonicalSupportBoundaryFamilyClaimed: false;
  frozenSupportProfileIncluded: false;
  supportProfileIncluded: false;
  checkSupportIncluded: false;
  actualInputSupportDecisionIncluded: false;
  terminationGuaranteeEstablished: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  globalM0fGate: 'not-evaluated';
  caseCount: 12;
  artifactCount: 14;
  generator: typeof GENERATOR;
  provenance: typeof SOURCE_PROVENANCE;
  cases: readonly NegSupportCatalogCaseLedgerRowV1[];
  artifacts: readonly NegSupportCatalogArtifactLedgerEntryV1[];
}>;

export type NegSupportCatalogCandidateLedgerIssueV1 = Readonly<{
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

export type NegSupportCatalogCandidateLedgerParseResultV1 =
  | Readonly<{ ok: true; value: NegSupportCatalogCandidateBundleLedgerV1 }>
  | Readonly<{ ok: false; error: readonly NegSupportCatalogCandidateLedgerIssueV1[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'schemaId',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'vectorSetId',
  'scope',
  'candidateCatalogOnly',
  'canonicalManifestPath',
  'canonicalManifestRegistration',
  'canonicalPromotionClaimed',
  'canonicalSupportBoundaryFamilyClaimed',
  'frozenSupportProfileIncluded',
  'supportProfileIncluded',
  'checkSupportIncluded',
  'actualInputSupportDecisionIncluded',
  'terminationGuaranteeEstablished',
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

function addLedgerIssue(
  issues: NegSupportCatalogCandidateLedgerIssueV1[],
  path: string,
  code: NegSupportCatalogCandidateLedgerIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: JsonRecord,
  keys: readonly string[],
  path: string,
  issues: NegSupportCatalogCandidateLedgerIssueV1[],
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

/** Parses a closed candidate-catalog bundle ledger and fixes every row independently. */
export function parseNegSupportCatalogCandidateBundleLedgerV1(
  supplied: unknown,
): NegSupportCatalogCandidateLedgerParseResultV1 {
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
  const issues: NegSupportCatalogCandidateLedgerIssueV1[] = [];
  exactKeys(value, ROOT_KEYS, '$', issues);
  const literals = [
    ['schemaVersion', 1],
    ['schemaId', NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCHEMA_ID],
    ['recordType', NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_RECORD_TYPE],
    ['contractStatus', 'candidate'],
    ['scientificClaim', false],
    ['vectorSetId', 'NEG-SUPPORT-CATALOG-V1'],
    ['scope', NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCOPE],
    ['candidateCatalogOnly', true],
    ['canonicalManifestPath', NEG_SUPPORT_CATALOG_CANONICAL_MANIFEST_PATH],
    ['canonicalManifestRegistration', 'not-registered'],
    ['canonicalPromotionClaimed', false],
    ['canonicalSupportBoundaryFamilyClaimed', false],
    ['frozenSupportProfileIncluded', false],
    ['supportProfileIncluded', false],
    ['checkSupportIncluded', false],
    ['actualInputSupportDecisionIncluded', false],
    ['terminationGuaranteeEstablished', false],
    ['toleranceProfileIncluded', false],
    ['scientificVerificationClaimed', false],
    ['globalM0fGate', 'not-evaluated'],
    ['caseCount', NEG_SUPPORT_CATALOG_CASE_SPECS_V1.length],
    ['artifactCount', NEG_SUPPORT_CATALOG_ARTIFACT_SPECS_V1.length],
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
  if (!sameStableJson(value.generator, GENERATOR)) {
    addLedgerIssue(
      issues,
      '$.generator',
      'invalid-literal',
      'must equal the fixed catalog detector',
    );
  }
  if (!sameStableJson(value.provenance, SOURCE_PROVENANCE)) {
    addLedgerIssue(
      issues,
      '$.provenance',
      'invalid-literal',
      'must equal fixed project provenance',
    );
  }

  const expectedCases = ledgerCases();
  if (!Array.isArray(value.cases) || value.cases.length !== expectedCases.length) {
    addLedgerIssue(issues, '$.cases', 'invalid-array', 'must contain twelve ordered cases');
  } else {
    for (const [index, expected] of expectedCases.entries()) {
      if (!sameStableJson(value.cases[index], expected)) {
        addLedgerIssue(
          issues,
          `$.cases[${String(index)}]`,
          'invalid-case',
          'case identity, control delta, path, or ordered issue oracle differs',
        );
      }
    }
  }

  if (
    !Array.isArray(value.artifacts) ||
    value.artifacts.length !== NEG_SUPPORT_CATALOG_ARTIFACT_SPECS_V1.length
  ) {
    addLedgerIssue(issues, '$.artifacts', 'invalid-array', 'must contain fourteen artifacts');
  } else {
    for (const [index, expected] of NEG_SUPPORT_CATALOG_ARTIFACT_SPECS_V1.entries()) {
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
      const { sha256, ...withoutHash } = actual;
      if (!sameStableJson(withoutHash, expected)) {
        addLedgerIssue(
          issues,
          path,
          'invalid-artifact',
          'artifact identity, path, role, or control provenance differs',
        );
      }
      if (typeof sha256 !== 'string' || !SHA256_PATTERN.test(sha256)) {
        addLedgerIssue(issues, `${path}.sha256`, 'invalid-hash', 'must be lowercase SHA-256');
      }
    }
  }
  if (issues.length > 0) return deepFreezeOwned({ ok: false as const, error: issues });
  return deepFreezeOwned({
    ok: true as const,
    value: value as unknown as NegSupportCatalogCandidateBundleLedgerV1,
  });
}

function issueSignature(
  issues: readonly SupportProfileCandidatesIssue[],
): readonly ExpectedIssueV1[] {
  return issues.map(({ path, code }) => ({ path, code }));
}

function jsonDifferencePaths(left: unknown, right: unknown, path = '$'): string[] {
  if (Object.is(left, right)) return [];
  if (Array.isArray(left) && Array.isArray(right)) {
    const differences: string[] = [];
    for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
      const childPath = `${path}[${String(index)}]`;
      if (!Object.hasOwn(left, index) || !Object.hasOwn(right, index)) differences.push(childPath);
      else differences.push(...jsonDifferencePaths(left[index], right[index], childPath));
    }
    return differences;
  }
  if (isRecord(left) && isRecord(right)) {
    const differences: string[] = [];
    const keys = [
      ...Object.keys(left),
      ...Object.keys(right).filter((key) => !Object.hasOwn(left, key)),
    ].sort();
    for (const key of keys) {
      const childPath = `${path}.${key}`;
      if (!Object.hasOwn(left, key) || !Object.hasOwn(right, key)) differences.push(childPath);
      else differences.push(...jsonDifferencePaths(left[key], right[key], childPath));
    }
    return differences;
  }
  return [path];
}

function jsonLine(value: unknown): string {
  return `${stableStringify(value)}\n`;
}

export type NegSupportCatalogCandidateBuiltFileV1 = Readonly<{
  artifactId: string | null;
  path: string;
  text: string;
}>;
export type NegSupportCatalogCandidateBuildV1 = Readonly<{
  ledger: NegSupportCatalogCandidateBundleLedgerV1;
  files: readonly NegSupportCatalogCandidateBuiltFileV1[];
}>;

/** Builds only after the control and every complete delta/parser oracle replay. */
export function buildNegSupportCatalogCandidateBundleV1(): NegSupportCatalogCandidateBuildV1 {
  if (!parseSupportProfileCandidatesV1(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1).ok) {
    throw new TypeError('accepted support-profile candidate catalog no longer parses');
  }
  const textByArtifactId = new Map<string, string>([
    ['bundle-readme', NEG_SUPPORT_CATALOG_CANDIDATE_README_V1],
    [CONTROL_ARTIFACT_ID, jsonLine(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1)],
  ]);
  for (const caseSpec of NEG_SUPPORT_CATALOG_CASE_SPECS_V1) {
    if (
      !sameStableJson(
        jsonDifferencePaths(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1, caseSpec.sourceDocument),
        caseSpec.changedPaths,
      )
    ) {
      throw new TypeError(`support catalog source delta changed: ${caseSpec.caseId}`);
    }
    const parsed = parseSupportProfileCandidatesV1(caseSpec.sourceDocument);
    if (parsed.ok || !sameStableJson(issueSignature(parsed.error), caseSpec.expectedIssues)) {
      throw new TypeError(`support catalog parser oracle changed: ${caseSpec.caseId}`);
    }
    textByArtifactId.set(caseSpec.sourceArtifactId, jsonLine(caseSpec.sourceDocument));
  }

  const artifacts = NEG_SUPPORT_CATALOG_ARTIFACT_SPECS_V1.map((spec) => {
    const text = textByArtifactId.get(spec.artifactId);
    if (text === undefined)
      throw new TypeError(`missing support catalog artifact ${spec.artifactId}`);
    return { ...spec, sha256: sha256Prefixed(text) as `sha256:${string}` };
  });
  const ledger: NegSupportCatalogCandidateBundleLedgerV1 = {
    schemaVersion: 1,
    schemaId: NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCHEMA_ID,
    recordType: NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    vectorSetId: 'NEG-SUPPORT-CATALOG-V1',
    scope: NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCOPE,
    candidateCatalogOnly: true,
    canonicalManifestPath: NEG_SUPPORT_CATALOG_CANONICAL_MANIFEST_PATH,
    canonicalManifestRegistration: 'not-registered',
    canonicalPromotionClaimed: false,
    canonicalSupportBoundaryFamilyClaimed: false,
    frozenSupportProfileIncluded: false,
    supportProfileIncluded: false,
    checkSupportIncluded: false,
    actualInputSupportDecisionIncluded: false,
    terminationGuaranteeEstablished: false,
    toleranceProfileIncluded: false,
    scientificVerificationClaimed: false,
    globalM0fGate: 'not-evaluated',
    caseCount: 12,
    artifactCount: 14,
    generator: GENERATOR,
    provenance: SOURCE_PROVENANCE,
    cases: ledgerCases(),
    artifacts,
  };
  const files: NegSupportCatalogCandidateBuiltFileV1[] = artifacts.map((artifact) => {
    const text = textByArtifactId.get(artifact.artifactId);
    if (text === undefined)
      throw new TypeError(`missing support catalog artifact ${artifact.artifactId}`);
    return { artifactId: artifact.artifactId, path: artifact.path, text };
  });
  files.push({
    artifactId: null,
    path: NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME,
    text: jsonLine(ledger),
  });
  return deepFreezeOwned({ ledger, files });
}

/** Writes exactly fifteen files and refuses to clean or follow unexpected entries. */
export async function writeNegSupportCatalogCandidateBundleV1(
  bundleDirectory: string = NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegSupportCatalogCandidateBuildV1> {
  const built = buildNegSupportCatalogCandidateBundleV1();
  const absoluteDirectory = resolve(bundleDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const expectedNames = new Set(built.files.map((file) => file.path));
  const existing = await readdir(absoluteDirectory, { withFileTypes: true });
  if (existing.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))) {
    throw new TypeError('negative support catalog directory contains an unexpected entry');
  }
  await Promise.all(
    built.files.map((file) => writeFile(resolve(absoluteDirectory, file.path), file.text, 'utf8')),
  );
  return built;
}

export const NEG_SUPPORT_CATALOG_CANDIDATE_REASON_CODES = [
  'ledger-unreadable',
  'ledger-invalid',
  'artifact-set-mismatch',
  'artifact-unreadable',
  'artifact-hash-mismatch',
  'canonical-manifest-unreadable',
  'canonical-manifest-registration-present',
  'control-invalid-json',
  'control-unexpectedly-rejected',
  'source-invalid-json',
  'source-control-difference-mismatch',
  'source-unexpectedly-accepted',
  'parser-issue-mismatch',
  'deterministic-regeneration-mismatch',
  'unexpected-failure',
] as const;

export type NegSupportCatalogCandidateReasonCodeV1 =
  (typeof NEG_SUPPORT_CATALOG_CANDIDATE_REASON_CODES)[number];

export type NegSupportCatalogCandidateVerificationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-neg-support-catalog-candidate-bundle-verification-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-SUPPORT-CATALOG-V1';
  scope: typeof NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCOPE;
  candidateCatalogOnly: true;
  canonicalPromotionClaimed: false;
  canonicalSupportBoundaryFamilyClaimed: false;
  frozenSupportProfileIncluded: false;
  supportProfileIncluded: false;
  checkSupportIncluded: false;
  actualInputSupportDecisionIncluded: false;
  terminationGuaranteeEstablished: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  globalM0fGate: 'not-evaluated';
  reproducibleExactNegativeBundle: boolean;
  reasonCodes: readonly NegSupportCatalogCandidateReasonCodeV1[];
  checks: Readonly<{
    ledgerPresentAndValid: boolean;
    artifactSetExact: boolean;
    allArtifactHashesMatch: boolean;
    allArtifactProvenanceFixed: boolean;
    canonicalManifestRegistrationAbsent: boolean;
    controlArtifactParsed: boolean;
    savedControlAccepted: boolean;
    sourceCaseCount: number;
    everySourceParsed: boolean;
    everySourceControlDifferenceMatched: boolean;
    everySourceRejected: boolean;
    everyOrderedIssueSignatureMatched: boolean;
    deterministicRegenerationMatched: boolean;
  }>;
}>;

interface MutableVerificationState {
  reasons: Set<NegSupportCatalogCandidateReasonCodeV1>;
  ledgerPresentAndValid: boolean;
  artifactSetExact: boolean;
  allArtifactHashesMatch: boolean;
  allArtifactProvenanceFixed: boolean;
  canonicalManifestRegistrationAbsent: boolean;
  controlArtifactParsed: boolean;
  savedControlAccepted: boolean;
  sourceCaseCount: number;
  everySourceParsed: boolean;
  everySourceControlDifferenceMatched: boolean;
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
    controlArtifactParsed: false,
    savedControlAccepted: false,
    sourceCaseCount: 0,
    everySourceParsed: false,
    everySourceControlDifferenceMatched: false,
    everySourceRejected: false,
    everyOrderedIssueSignatureMatched: false,
    deterministicRegenerationMatched: false,
  };
}

function resultFromState(
  state: MutableVerificationState,
): NegSupportCatalogCandidateVerificationResultV1 {
  const reasonCodes = NEG_SUPPORT_CATALOG_CANDIDATE_REASON_CODES.filter((code) =>
    state.reasons.has(code),
  );
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: 'm0f-neg-support-catalog-candidate-bundle-verification-result' as const,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    vectorSetId: 'NEG-SUPPORT-CATALOG-V1' as const,
    scope: NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCOPE,
    candidateCatalogOnly: true as const,
    canonicalPromotionClaimed: false as const,
    canonicalSupportBoundaryFamilyClaimed: false as const,
    frozenSupportProfileIncluded: false as const,
    supportProfileIncluded: false as const,
    checkSupportIncluded: false as const,
    actualInputSupportDecisionIncluded: false as const,
    terminationGuaranteeEstablished: false as const,
    toleranceProfileIncluded: false as const,
    scientificVerificationClaimed: false as const,
    globalM0fGate: 'not-evaluated' as const,
    reproducibleExactNegativeBundle: reasonCodes.length === 0,
    reasonCodes,
    checks: {
      ledgerPresentAndValid: state.ledgerPresentAndValid,
      artifactSetExact: state.artifactSetExact,
      allArtifactHashesMatch: state.allArtifactHashesMatch,
      allArtifactProvenanceFixed: state.allArtifactProvenanceFixed,
      canonicalManifestRegistrationAbsent: state.canonicalManifestRegistrationAbsent,
      controlArtifactParsed: state.controlArtifactParsed,
      savedControlAccepted: state.savedControlAccepted,
      sourceCaseCount: state.sourceCaseCount,
      everySourceParsed: state.everySourceParsed,
      everySourceControlDifferenceMatched: state.everySourceControlDifferenceMatched,
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
        await readFile(resolve(NEG_SUPPORT_CATALOG_CANONICAL_MANIFEST_PATH), 'utf8'),
      ) as unknown,
    );
    if (manifest.manifest === undefined) return undefined;
    return !manifest.manifest.fixtures.some((fixture) =>
      fixture.id.startsWith(NEG_SUPPORT_CATALOG_CASE_ID_PREFIX),
    );
  } catch {
    return undefined;
  }
}

/** Replays saved catalog/control bytes only through the candidate-catalog parser. */
export async function verifyNegSupportCatalogCandidateBundleV1(
  bundleDirectory: string = NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegSupportCatalogCandidateVerificationResultV1> {
  const state = initialState();
  try {
    const absoluteDirectory = resolve(bundleDirectory);
    let ledgerText: string;
    let ledgerDocument: unknown;
    try {
      ledgerText = await readFile(
        resolve(absoluteDirectory, NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME),
        'utf8',
      );
      ledgerDocument = JSON.parse(ledgerText) as unknown;
    } catch {
      state.reasons.add('ledger-unreadable');
      return resultFromState(state);
    }
    const parsedLedger = parseNegSupportCatalogCandidateBundleLedgerV1(ledgerDocument);
    if (!parsedLedger.ok) {
      state.reasons.add('ledger-invalid');
      return resultFromState(state);
    }
    state.ledgerPresentAndValid = true;
    state.allArtifactProvenanceFixed = true;

    const expectedNames = new Set([
      NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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
    const textByPath = new Map<string, string>([
      [NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME, ledgerText],
    ]);
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
      const text = Buffer.from(bytes).toString('utf8');
      textByArtifactId.set(artifact.artifactId, text);
      textByPath.set(artifact.path, text);
    }
    state.allArtifactHashesMatch = true;

    const canonicalAbsent = await canonicalCasesAreAbsent();
    if (canonicalAbsent === undefined) state.reasons.add('canonical-manifest-unreadable');
    else if (!canonicalAbsent) state.reasons.add('canonical-manifest-registration-present');
    else state.canonicalManifestRegistrationAbsent = true;

    const savedControl = parseJsonText(textByArtifactId.get(CONTROL_ARTIFACT_ID) ?? '');
    if (savedControl === undefined) {
      state.reasons.add('control-invalid-json');
    } else {
      state.controlArtifactParsed = true;
      if (parseSupportProfileCandidatesV1(savedControl).ok) state.savedControlAccepted = true;
      else state.reasons.add('control-unexpectedly-rejected');
    }

    let everyParsed = true;
    let everyDifferenceMatched = true;
    let everyRejected = true;
    let everySignatureMatched = true;
    for (const caseRow of parsedLedger.value.cases) {
      const source = parseJsonText(textByArtifactId.get(caseRow.sourceArtifactId) ?? '');
      if (source === undefined) {
        everyParsed = false;
        state.reasons.add('source-invalid-json');
        continue;
      }
      state.sourceCaseCount += 1;
      if (
        savedControl === undefined ||
        !sameStableJson(jsonDifferencePaths(savedControl, source), caseRow.changedPaths)
      ) {
        everyDifferenceMatched = false;
        state.reasons.add('source-control-difference-mismatch');
      }
      const parsed = parseSupportProfileCandidatesV1(source);
      if (parsed.ok) {
        everyRejected = false;
        state.reasons.add('source-unexpectedly-accepted');
        continue;
      }
      if (!sameStableJson(issueSignature(parsed.error), caseRow.expectedIssues)) {
        everySignatureMatched = false;
        state.reasons.add('parser-issue-mismatch');
      }
    }
    state.everySourceParsed =
      everyParsed && state.sourceCaseCount === NEG_SUPPORT_CATALOG_CASE_SPECS_V1.length;
    state.everySourceControlDifferenceMatched = state.everySourceParsed && everyDifferenceMatched;
    state.everySourceRejected = state.everySourceParsed && everyRejected;
    state.everyOrderedIssueSignatureMatched = state.everySourceRejected && everySignatureMatched;

    const regenerated = buildNegSupportCatalogCandidateBundleV1();
    const allBytesMatch = regenerated.files.every(
      (file) => textByPath.get(file.path) === file.text,
    );
    if (!allBytesMatch) state.reasons.add('deterministic-regeneration-mismatch');
    else state.deterministicRegenerationMatched = true;

    return resultFromState(state);
  } catch {
    state.reasons.add('unexpected-failure');
    return resultFromState(state);
  }
}
