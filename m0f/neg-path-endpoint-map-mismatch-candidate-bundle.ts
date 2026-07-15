import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { parseArtifactContractV1, type ArtifactContractIssue } from './artifacts/contract.js';
import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import {
  NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1,
  type NegTopologySourceDocumentV1,
} from './neg-topology-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from './manifest.js';
import { stableStringify } from './stable-json.js';

export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/neg-path-endpoint-map-mismatch-candidate-bundle-ledger-v1.schema.json' as const;
export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_RECORD_TYPE =
  'm0f-neg-path-endpoint-map-mismatch-candidate-bundle-ledger' as const;
export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_SCOPE =
  'project-authored-exact-negative-artifact-contract-adjacent-bounded-interpolation-crease-map-parser-replay-only' as const;
export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_GENERATOR_ID =
  'oridesign-neg-path-endpoint-map-mismatch-candidate-bundle' as const;
export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_GENERATOR_VERSION =
  '1.0.0-candidate' as const;
export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY =
  'tests/candidate-vectors/NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH' as const;
export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME =
  'candidate-bundle-ledger.json' as const;
export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CANONICAL_MANIFEST_PATH =
  'tests/fixtures/manifest.json' as const;
export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_ID =
  'NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH' as const;

const SOURCE_REFERENCE_ID = 'oridesign-neg-path-endpoint-map-mismatch-candidate-v1' as const;
const CONTROL_ARTIFACT_ID = 'control-design' as const;
const SOURCE_ARTIFACT_ID = 'source-path-endpoint-map-mismatch' as const;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

export type NegPathEndpointMapMismatchSourceDocumentV1 = NegTopologySourceDocumentV1;

function requiredEntry<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new TypeError(`missing fixed entry ${String(index)}`);
  return value;
}

function expandedTwoHingeDesignControl(): NegPathEndpointMapMismatchSourceDocumentV1 {
  const control = structuredClone(NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1);
  control.creaseMesh.vertices.push({ id: 'v-tq', x: 0.75, y: 0 }, { id: 'v-bq', x: 0.75, y: 1 });
  const topRight = control.creaseMesh.edges.find((edge) => edge.id === 'e-top-right');
  const bottomRight = control.creaseMesh.edges.find((edge) => edge.id === 'e-bottom-right');
  if (topRight === undefined || bottomRight === undefined) {
    throw new TypeError('fixed topology control is missing right boundary edges');
  }
  topRight.vertices = ['v-tm', 'v-tq'];
  bottomRight.vertices = ['v-bq', 'v-bm'];
  control.creaseMesh.edges.push(
    {
      id: 'e-top-far',
      vertices: ['v-tq', 'v-tr'],
      assignment: 'B',
      role: 'boundary',
      sourceTreeEdgeIds: [],
      generationKey: 'boundary:top-far',
    },
    {
      id: 'e-bottom-far',
      vertices: ['v-br', 'v-bq'],
      assignment: 'B',
      role: 'boundary',
      sourceTreeEdgeIds: [],
      generationKey: 'boundary:bottom-far',
    },
    {
      id: 'e-hinge-far',
      vertices: ['v-tq', 'v-bq'],
      assignment: 'V',
      role: 'hinge',
      sourceTreeEdgeIds: ['t-right'],
      generationKey: 'tree:hinge-far',
    },
  );
  const rightFace = control.creaseMesh.faces.find((face) => face.id === 'f-right');
  if (rightFace === undefined) throw new TypeError('fixed topology control is missing right face');
  rightFace.vertices = ['v-tm', 'v-bm', 'v-bq', 'v-tq'];
  control.creaseMesh.faces.push({
    id: 'f-far',
    vertices: ['v-tq', 'v-bq', 'v-br', 'v-tr'],
  });
  control.target.faceTransforms.push({
    faceId: 'f-far',
    quaternion: [0, 0, 0, 1],
    translation: [0, 0, 0],
  });
  control.target.goalFaceOrders = [
    ['f-right', 'f-left', 1],
    ['f-far', 'f-right', 1],
  ];
  control.pathCandidate.segments = [
    {
      t0: 0,
      t1: 0.5,
      motion: {
        kind: 'bounded-interpolation',
        knotTimes: [0, 0.5],
        anglesByCrease: [
          { edgeId: 'e-hinge', angles: [0, Math.PI / 2] },
          { edgeId: 'e-hinge-far', angles: [0, Math.PI / 2] },
        ],
        intervalAngleBoundsByCrease: [
          { edgeId: 'e-hinge', bounds: [[0, Math.PI / 2]] },
          { edgeId: 'e-hinge-far', bounds: [[0, Math.PI / 2]] },
        ],
      },
    },
    {
      t0: 0.5,
      t1: 1,
      motion: {
        kind: 'bounded-interpolation',
        knotTimes: [0.5, 1],
        anglesByCrease: [
          { edgeId: 'e-hinge', angles: [Math.PI / 2, Math.PI] },
          { edgeId: 'e-hinge-far', angles: [Math.PI / 2, Math.PI] },
        ],
        intervalAngleBoundsByCrease: [
          { edgeId: 'e-hinge', bounds: [[Math.PI / 2, Math.PI]] },
          { edgeId: 'e-hinge-far', bounds: [[Math.PI / 2, Math.PI]] },
        ],
      },
    },
  ];
  return control;
}

export const NEG_PATH_ENDPOINT_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1 = deepFreezeOwned(
  expandedTwoHingeDesignControl(),
);

function pathEndpointMapMismatchSource(): NegPathEndpointMapMismatchSourceDocumentV1 {
  const source = structuredClone(NEG_PATH_ENDPOINT_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1);
  const secondMotion = requiredEntry(source.pathCandidate.segments, 1).motion;
  if (secondMotion.kind !== 'bounded-interpolation') {
    throw new TypeError('fixed second segment must use bounded interpolation');
  }
  const removedAngles = secondMotion.anglesByCrease.splice(1, 1);
  const removedBounds = secondMotion.intervalAngleBoundsByCrease.splice(1, 1);
  if (removedAngles[0]?.edgeId !== 'e-hinge-far' || removedBounds[0]?.edgeId !== 'e-hinge-far') {
    throw new TypeError('fixed second segment must contain the far hinge in both maps');
  }
  return source;
}

type ExpectedIssueV1 = Readonly<{ path: string; code: string }>;

export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1 = deepFreezeOwned({
  caseId: NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_ID,
  controlArtifactId: CONTROL_ARTIFACT_ID,
  mutationKind: 'remove-far-hinge-from-second-bounded-segment-angle-and-bound-maps',
  changedPaths: [
    '$.pathCandidate.segments[1].motion.anglesByCrease[1]',
    '$.pathCandidate.segments[1].motion.intervalAngleBoundsByCrease[1]',
  ],
  sourceArtifactId: SOURCE_ARTIFACT_ID,
  sourcePath: 'path-endpoint-map-mismatch.json',
  sourceDocument: pathEndpointMapMismatchSource(),
  expectedIssues: [
    {
      path: '$.pathCandidate.segments[1].motion.anglesByCrease',
      code: 'path-endpoint-map-mismatch',
    },
  ],
} as const);

export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_README_V1 = `# NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH exact-negative candidate vector

This closed directory contains one saved project-authored expanded three-face/two-hinge design artifact-contract control and one exact-negative mutation for the current \`parseArtifactContractV1\` adjacent bounded-interpolation crease-map check. Both accepted-control segments declare the same local two-edge angle and bound maps for \`e-hinge\` and \`e-hinge-far\`. The mutation removes only the \`e-hinge-far\` row from both maps of the second segment, so both segments remain locally valid while their adjacent declared crease sets differ.

The bundle is intentionally outside \`tests/fixtures/manifest.json\`; \`NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH\` is not canonically registered or promoted. Exact-negative means only that the current artifact-contract parser rejects the saved bytes with the complete ordered issue signature fixed in the ledger.

This parser replay establishes only that the current parser rejects one exact difference between adjacent declared bounded-interpolation crease maps. It is not a physical hinge-drift detector and does not establish mesh or crease-map completeness, endpoint or physical path continuity, rigidity, face isometry, hinge geometry, or piecewise-polynomial endpoint semantics. It includes no contact analysis, CCD, collision detection, collision-freedom or foldability proof, certificate-hash verification or cryptographic authenticity, completeness of the canonical path-mutation family, SupportProfile or ToleranceProfile, scientific verification, or M0F GO. Local SHA-256 rows detect saved-byte drift only and are not signatures.

Verify with \`npx tsx m0f/neg-path-endpoint-map-mismatch-candidate-bundle-cli.ts --verify\`. Regenerate with \`npx tsx m0f/neg-path-endpoint-map-mismatch-candidate-bundle-cli.ts --write\`.
`;

export type NegPathEndpointMapMismatchArtifactProvenanceV1 = Readonly<{
  sourceReferenceId: typeof SOURCE_REFERENCE_ID;
  sourceUse: 'project-authored';
  derivation: 'authored' | 'mutated-from-control';
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[];
}>;

export type NegPathEndpointMapMismatchArtifactLedgerEntryV1 = Readonly<{
  artifactId: string;
  role: 'readme' | 'accepted-control' | 'negative-source';
  path: string;
  mediaType: 'text/markdown; charset=utf-8' | 'application/json';
  sha256: `sha256:${string}`;
  licenseSpdx: 'MIT';
  provenance: NegPathEndpointMapMismatchArtifactProvenanceV1;
}>;

type ArtifactSpecV1 = Omit<NegPathEndpointMapMismatchArtifactLedgerEntryV1, 'sha256'>;

function artifactProvenance(
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[],
): NegPathEndpointMapMismatchArtifactProvenanceV1 {
  return {
    sourceReferenceId: SOURCE_REFERENCE_ID,
    sourceUse: 'project-authored',
    derivation: dependsOnArtifactIds.length === 0 ? 'authored' : 'mutated-from-control',
    dependsOnArtifactIds,
  };
}

export const NEG_PATH_ENDPOINT_MAP_MISMATCH_ARTIFACT_SPECS_V1 = deepFreezeOwned([
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
    path: 'control-design.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([]),
  },
  {
    artifactId: SOURCE_ARTIFACT_ID,
    role: 'negative-source',
    path: NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.sourcePath,
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([CONTROL_ARTIFACT_ID]),
  },
] as const satisfies readonly ArtifactSpecV1[]);

export type NegPathEndpointMapMismatchCaseLedgerRowV1 = Readonly<{
  caseIndex: 0;
  caseId: typeof NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_ID;
  controlArtifactId: typeof CONTROL_ARTIFACT_ID;
  mutationKind: typeof NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.mutationKind;
  changedPaths: readonly [
    '$.pathCandidate.segments[1].motion.anglesByCrease[1]',
    '$.pathCandidate.segments[1].motion.intervalAngleBoundsByCrease[1]',
  ];
  sourceArtifactId: typeof SOURCE_ARTIFACT_ID;
  sourcePath: 'path-endpoint-map-mismatch.json';
  expectedOutcome: 'rejected';
  expectedIssues: readonly ExpectedIssueV1[];
}>;

const GENERATOR = deepFreezeOwned({
  generatorId: NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_GENERATOR_ID,
  generatorVersion: NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_GENERATOR_VERSION,
  serialization: 'stable-json-utf8-lf-v1' as const,
  detector: 'parseArtifactContractV1' as const,
  detectorSourcePath: 'm0f/artifacts/contract.ts' as const,
});

const SOURCE_PROVENANCE = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceKind: 'project-authored' as const,
  title:
    'NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH project-authored adjacent bounded-interpolation crease-map parser vector',
  authors: ['OriDesign contributors'],
  redistribution: 'allowed' as const,
  licenseSpdx: 'MIT' as const,
});

function ledgerCases(): readonly NegPathEndpointMapMismatchCaseLedgerRowV1[] {
  return [
    {
      caseIndex: 0,
      caseId: NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_ID,
      controlArtifactId: CONTROL_ARTIFACT_ID,
      mutationKind: NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.mutationKind,
      changedPaths: NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.changedPaths,
      sourceArtifactId: SOURCE_ARTIFACT_ID,
      sourcePath: NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.sourcePath,
      expectedOutcome: 'rejected',
      expectedIssues: NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.expectedIssues,
    },
  ];
}

export type NegPathEndpointMapMismatchCandidateBundleLedgerV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_SCHEMA_ID;
  recordType: typeof NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH-V1';
  scope: typeof NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_SCOPE;
  declaredAdjacentBoundedInterpolationCreaseMapParserOnly: true;
  canonicalManifestPath: typeof NEG_PATH_ENDPOINT_MAP_MISMATCH_CANONICAL_MANIFEST_PATH;
  canonicalManifestRegistration: 'not-registered';
  canonicalPromotionClaimed: false;
  canonicalPathMutationFamilyComplete: false;
  piecewisePolynomialEndpointInferenceIncluded: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  physicalPathContinuityEstablished: false;
  endpointContinuityEstablished: false;
  creaseMapCompletenessEstablished: false;
  rigidityEstablished: false;
  faceIsometryEstablished: false;
  hingeGeometryEstablished: false;
  certificateHashVerificationIncluded: false;
  contactAnalysisIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionDetectionIncluded: false;
  collisionFreedomEstablished: false;
  foldabilityEstablished: false;
  scientificVerificationClaimed: false;
  globalM0fGate: 'not-evaluated';
  caseCount: 1;
  artifactCount: 3;
  generator: typeof GENERATOR;
  provenance: typeof SOURCE_PROVENANCE;
  cases: readonly NegPathEndpointMapMismatchCaseLedgerRowV1[];
  artifacts: readonly NegPathEndpointMapMismatchArtifactLedgerEntryV1[];
}>;

export type NegPathEndpointMapMismatchCandidateLedgerIssueV1 = Readonly<{
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

export type NegPathEndpointMapMismatchCandidateLedgerParseResultV1 =
  | Readonly<{ ok: true; value: NegPathEndpointMapMismatchCandidateBundleLedgerV1 }>
  | Readonly<{ ok: false; error: readonly NegPathEndpointMapMismatchCandidateLedgerIssueV1[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'schemaId',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'vectorSetId',
  'scope',
  'declaredAdjacentBoundedInterpolationCreaseMapParserOnly',
  'canonicalManifestPath',
  'canonicalManifestRegistration',
  'canonicalPromotionClaimed',
  'canonicalPathMutationFamilyComplete',
  'piecewisePolynomialEndpointInferenceIncluded',
  'supportProfileIncluded',
  'toleranceProfileIncluded',
  'physicalPathContinuityEstablished',
  'endpointContinuityEstablished',
  'creaseMapCompletenessEstablished',
  'rigidityEstablished',
  'faceIsometryEstablished',
  'hingeGeometryEstablished',
  'certificateHashVerificationIncluded',
  'contactAnalysisIncluded',
  'continuousCollisionDetectionIncluded',
  'collisionDetectionIncluded',
  'collisionFreedomEstablished',
  'foldabilityEstablished',
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

function addLedgerIssue(
  issues: NegPathEndpointMapMismatchCandidateLedgerIssueV1[],
  path: string,
  code: NegPathEndpointMapMismatchCandidateLedgerIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: NegPathEndpointMapMismatchCandidateLedgerIssueV1[],
): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key))
      addLedgerIssue(issues, `${path}.${key}`, 'unknown-field', 'is undeclared');
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

/** Parses a closed ledger and fixes its case, complete oracle, claims, and artifact rows. */
export function parseNegPathEndpointMapMismatchCandidateBundleLedgerV1(
  supplied: unknown,
): NegPathEndpointMapMismatchCandidateLedgerParseResultV1 {
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
  const issues: NegPathEndpointMapMismatchCandidateLedgerIssueV1[] = [];
  exactKeys(value, ROOT_KEYS, '$', issues);
  const literals = [
    ['schemaVersion', 1],
    ['schemaId', NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_SCHEMA_ID],
    ['recordType', NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_RECORD_TYPE],
    ['contractStatus', 'candidate'],
    ['scientificClaim', false],
    ['vectorSetId', 'NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH-V1'],
    ['scope', NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_SCOPE],
    ['declaredAdjacentBoundedInterpolationCreaseMapParserOnly', true],
    ['canonicalManifestPath', NEG_PATH_ENDPOINT_MAP_MISMATCH_CANONICAL_MANIFEST_PATH],
    ['canonicalManifestRegistration', 'not-registered'],
    ['canonicalPromotionClaimed', false],
    ['canonicalPathMutationFamilyComplete', false],
    ['piecewisePolynomialEndpointInferenceIncluded', false],
    ['supportProfileIncluded', false],
    ['toleranceProfileIncluded', false],
    ['physicalPathContinuityEstablished', false],
    ['endpointContinuityEstablished', false],
    ['creaseMapCompletenessEstablished', false],
    ['rigidityEstablished', false],
    ['faceIsometryEstablished', false],
    ['hingeGeometryEstablished', false],
    ['certificateHashVerificationIncluded', false],
    ['contactAnalysisIncluded', false],
    ['continuousCollisionDetectionIncluded', false],
    ['collisionDetectionIncluded', false],
    ['collisionFreedomEstablished', false],
    ['foldabilityEstablished', false],
    ['scientificVerificationClaimed', false],
    ['globalM0fGate', 'not-evaluated'],
    ['caseCount', 1],
    ['artifactCount', 3],
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
      'must equal the fixed detector identity',
    );
  }
  if (!sameStableJson(value.provenance, SOURCE_PROVENANCE)) {
    addLedgerIssue(issues, '$.provenance', 'invalid-literal', 'must equal fixed provenance');
  }
  const expectedCases = ledgerCases();
  if (!Array.isArray(value.cases) || value.cases.length !== 1) {
    addLedgerIssue(issues, '$.cases', 'invalid-array', 'must contain one ordered case');
  } else if (!sameStableJson(value.cases[0], expectedCases[0])) {
    addLedgerIssue(
      issues,
      '$.cases[0]',
      'invalid-case',
      'case identity, control link, delta, path, or complete ordered issue oracle differs',
    );
  }
  if (!Array.isArray(value.artifacts) || value.artifacts.length !== 3) {
    addLedgerIssue(issues, '$.artifacts', 'invalid-array', 'must contain three ordered artifacts');
  } else {
    for (const [index, expected] of NEG_PATH_ENDPOINT_MAP_MISMATCH_ARTIFACT_SPECS_V1.entries()) {
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
        addLedgerIssue(issues, path, 'invalid-artifact', 'artifact identity or provenance differs');
      }
      if (typeof sha256 !== 'string' || !SHA256_PATTERN.test(sha256)) {
        addLedgerIssue(issues, `${path}.sha256`, 'invalid-hash', 'must be lowercase SHA-256');
      }
    }
  }
  if (issues.length > 0) return deepFreezeOwned({ ok: false as const, error: issues });
  return deepFreezeOwned({
    ok: true as const,
    value: value as unknown as NegPathEndpointMapMismatchCandidateBundleLedgerV1,
  });
}

function issueSignature(issues: readonly ArtifactContractIssue[]): readonly ExpectedIssueV1[] {
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

export type NegPathEndpointMapMismatchCandidateBuiltFileV1 = Readonly<{
  artifactId: string | null;
  path: string;
  text: string;
}>;

export type NegPathEndpointMapMismatchCandidateBuildV1 = Readonly<{
  ledger: NegPathEndpointMapMismatchCandidateBundleLedgerV1;
  files: readonly NegPathEndpointMapMismatchCandidateBuiltFileV1[];
}>;

/** Builds only after the accepted control, exact two-path delta, and parser oracle replay. */
export function buildNegPathEndpointMapMismatchCandidateBundleV1(): NegPathEndpointMapMismatchCandidateBuildV1 {
  if (!parseArtifactContractV1(NEG_PATH_ENDPOINT_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1).ok) {
    throw new TypeError(
      'accepted NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH design control no longer parses',
    );
  }
  const differences = jsonDifferencePaths(
    NEG_PATH_ENDPOINT_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
    NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument,
  );
  if (!sameStableJson(differences, NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.changedPaths)) {
    throw new TypeError('NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH control delta changed');
  }
  const replay = parseArtifactContractV1(
    NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument,
  );
  if (
    replay.ok ||
    !sameStableJson(
      issueSignature(replay.error),
      NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.expectedIssues,
    )
  ) {
    throw new TypeError('NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH parser oracle changed');
  }
  const textByArtifactId = new Map<string, string>([
    ['bundle-readme', NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_README_V1],
    [CONTROL_ARTIFACT_ID, jsonLine(NEG_PATH_ENDPOINT_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1)],
    [SOURCE_ARTIFACT_ID, jsonLine(NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument)],
  ]);
  const artifacts = NEG_PATH_ENDPOINT_MAP_MISMATCH_ARTIFACT_SPECS_V1.map((spec) => {
    const text = textByArtifactId.get(spec.artifactId);
    if (text === undefined)
      throw new TypeError(`missing path-endpoint-map-mismatch artifact ${spec.artifactId}`);
    return { ...spec, sha256: sha256Prefixed(text) as `sha256:${string}` };
  });
  const ledger: NegPathEndpointMapMismatchCandidateBundleLedgerV1 = {
    schemaVersion: 1,
    schemaId: NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_SCHEMA_ID,
    recordType: NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    vectorSetId: 'NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH-V1',
    scope: NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_SCOPE,
    declaredAdjacentBoundedInterpolationCreaseMapParserOnly: true,
    canonicalManifestPath: NEG_PATH_ENDPOINT_MAP_MISMATCH_CANONICAL_MANIFEST_PATH,
    canonicalManifestRegistration: 'not-registered',
    canonicalPromotionClaimed: false,
    canonicalPathMutationFamilyComplete: false,
    piecewisePolynomialEndpointInferenceIncluded: false,
    supportProfileIncluded: false,
    toleranceProfileIncluded: false,
    physicalPathContinuityEstablished: false,
    endpointContinuityEstablished: false,
    creaseMapCompletenessEstablished: false,
    rigidityEstablished: false,
    faceIsometryEstablished: false,
    hingeGeometryEstablished: false,
    certificateHashVerificationIncluded: false,
    contactAnalysisIncluded: false,
    continuousCollisionDetectionIncluded: false,
    collisionDetectionIncluded: false,
    collisionFreedomEstablished: false,
    foldabilityEstablished: false,
    scientificVerificationClaimed: false,
    globalM0fGate: 'not-evaluated',
    caseCount: 1,
    artifactCount: 3,
    generator: GENERATOR,
    provenance: SOURCE_PROVENANCE,
    cases: ledgerCases(),
    artifacts,
  };
  const files: NegPathEndpointMapMismatchCandidateBuiltFileV1[] = artifacts.map((artifact) => {
    const text = textByArtifactId.get(artifact.artifactId);
    if (text === undefined)
      throw new TypeError(`missing path-endpoint-map-mismatch artifact ${artifact.artifactId}`);
    return { artifactId: artifact.artifactId, path: artifact.path, text };
  });
  files.push({
    artifactId: null,
    path: NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME,
    text: jsonLine(ledger),
  });
  return deepFreezeOwned({ ledger, files });
}

/** Writes exactly four regular files and refuses unexpected entries instead of deleting them. */
export async function writeNegPathEndpointMapMismatchCandidateBundleV1(
  bundleDirectory: string = NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegPathEndpointMapMismatchCandidateBuildV1> {
  const built = buildNegPathEndpointMapMismatchCandidateBundleV1();
  const absoluteDirectory = resolve(bundleDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const expectedNames = new Set(built.files.map((file) => file.path));
  const existing = await readdir(absoluteDirectory, { withFileTypes: true });
  if (existing.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))) {
    throw new TypeError(
      'negative path-endpoint-map-mismatch candidate directory contains an unexpected entry',
    );
  }
  await Promise.all(
    built.files.map((file) => writeFile(resolve(absoluteDirectory, file.path), file.text, 'utf8')),
  );
  return built;
}

export const NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_REASON_CODES = [
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

export type NegPathEndpointMapMismatchCandidateReasonCodeV1 =
  (typeof NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_REASON_CODES)[number];

export type NegPathEndpointMapMismatchCandidateVerificationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-neg-path-endpoint-map-mismatch-candidate-bundle-verification-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH-V1';
  scope: typeof NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_SCOPE;
  declaredAdjacentBoundedInterpolationCreaseMapParserOnly: true;
  globalM0fGate: 'not-evaluated';
  canonicalPromotionClaimed: false;
  canonicalPathMutationFamilyComplete: false;
  piecewisePolynomialEndpointInferenceIncluded: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  physicalPathContinuityEstablished: false;
  endpointContinuityEstablished: false;
  creaseMapCompletenessEstablished: false;
  rigidityEstablished: false;
  faceIsometryEstablished: false;
  hingeGeometryEstablished: false;
  certificateHashVerificationIncluded: false;
  contactAnalysisIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionDetectionIncluded: false;
  collisionFreedomEstablished: false;
  foldabilityEstablished: false;
  scientificVerificationClaimed: false;
  reproducibleExactNegativeBundle: boolean;
  reasonCodes: readonly NegPathEndpointMapMismatchCandidateReasonCodeV1[];
  checks: Readonly<{
    ledgerPresentAndValid: boolean;
    artifactSetExact: boolean;
    allArtifactHashesMatch: boolean;
    allArtifactProvenanceFixed: boolean;
    canonicalManifestRegistrationAbsent: boolean;
    controlArtifactCount: number;
    everyControlArtifactParsed: boolean;
    everySavedControlAccepted: boolean;
    sourceCaseCount: number;
    everySourceParsed: boolean;
    everySourceControlDifferenceMatched: boolean;
    everySourceRejected: boolean;
    everyOrderedIssueSignatureMatched: boolean;
    deterministicRegenerationMatched: boolean;
  }>;
}>;

interface MutableVerificationState {
  reasons: Set<NegPathEndpointMapMismatchCandidateReasonCodeV1>;
  ledgerPresentAndValid: boolean;
  artifactSetExact: boolean;
  allArtifactHashesMatch: boolean;
  allArtifactProvenanceFixed: boolean;
  canonicalManifestRegistrationAbsent: boolean;
  controlArtifactCount: number;
  everyControlArtifactParsed: boolean;
  everySavedControlAccepted: boolean;
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
    controlArtifactCount: 0,
    everyControlArtifactParsed: false,
    everySavedControlAccepted: false,
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
): NegPathEndpointMapMismatchCandidateVerificationResultV1 {
  const reasonCodes = NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_REASON_CODES.filter((code) =>
    state.reasons.has(code),
  );
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: 'm0f-neg-path-endpoint-map-mismatch-candidate-bundle-verification-result' as const,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    vectorSetId: 'NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH-V1' as const,
    scope: NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_SCOPE,
    declaredAdjacentBoundedInterpolationCreaseMapParserOnly: true as const,
    globalM0fGate: 'not-evaluated' as const,
    canonicalPromotionClaimed: false as const,
    canonicalPathMutationFamilyComplete: false as const,
    piecewisePolynomialEndpointInferenceIncluded: false as const,
    supportProfileIncluded: false as const,
    toleranceProfileIncluded: false as const,
    physicalPathContinuityEstablished: false as const,
    endpointContinuityEstablished: false as const,
    creaseMapCompletenessEstablished: false as const,
    rigidityEstablished: false as const,
    faceIsometryEstablished: false as const,
    hingeGeometryEstablished: false as const,
    certificateHashVerificationIncluded: false as const,
    contactAnalysisIncluded: false as const,
    continuousCollisionDetectionIncluded: false as const,
    collisionDetectionIncluded: false as const,
    collisionFreedomEstablished: false as const,
    foldabilityEstablished: false as const,
    scientificVerificationClaimed: false as const,
    reproducibleExactNegativeBundle: reasonCodes.length === 0,
    reasonCodes,
    checks: {
      ledgerPresentAndValid: state.ledgerPresentAndValid,
      artifactSetExact: state.artifactSetExact,
      allArtifactHashesMatch: state.allArtifactHashesMatch,
      allArtifactProvenanceFixed: state.allArtifactProvenanceFixed,
      canonicalManifestRegistrationAbsent: state.canonicalManifestRegistrationAbsent,
      controlArtifactCount: state.controlArtifactCount,
      everyControlArtifactParsed: state.everyControlArtifactParsed,
      everySavedControlAccepted: state.everySavedControlAccepted,
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

async function canonicalCaseIsAbsent(): Promise<boolean | undefined> {
  try {
    const parsed = parseFixtureManifest(
      JSON.parse(
        await readFile(resolve(NEG_PATH_ENDPOINT_MAP_MISMATCH_CANONICAL_MANIFEST_PATH), 'utf8'),
      ) as unknown,
    );
    if (parsed.manifest === undefined) return undefined;
    return !parsed.manifest.fixtures.some(
      (fixture) => fixture.id === NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_ID,
    );
  } catch {
    return undefined;
  }
}

/** Replays the saved control and source only through the declared bounded-endpoint parser boundary. */
export async function verifyNegPathEndpointMapMismatchCandidateBundleV1(
  bundleDirectory: string = NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegPathEndpointMapMismatchCandidateVerificationResultV1> {
  const state = initialState();
  try {
    const absoluteDirectory = resolve(bundleDirectory);
    let ledgerText: string;
    let ledgerDocument: unknown;
    try {
      ledgerText = await readFile(
        resolve(absoluteDirectory, NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME),
        'utf8',
      );
      ledgerDocument = JSON.parse(ledgerText) as unknown;
    } catch {
      state.reasons.add('ledger-unreadable');
      return resultFromState(state);
    }
    const parsedLedger = parseNegPathEndpointMapMismatchCandidateBundleLedgerV1(ledgerDocument);
    if (!parsedLedger.ok) {
      state.reasons.add('ledger-invalid');
      return resultFromState(state);
    }
    state.ledgerPresentAndValid = true;
    state.allArtifactProvenanceFixed = true;

    const expectedNames = new Set([
      NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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
      [NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME, ledgerText],
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

    const canonicalAbsent = await canonicalCaseIsAbsent();
    if (canonicalAbsent === undefined) state.reasons.add('canonical-manifest-unreadable');
    else if (!canonicalAbsent) state.reasons.add('canonical-manifest-registration-present');
    else state.canonicalManifestRegistrationAbsent = true;

    const control = parseJsonText(textByArtifactId.get(CONTROL_ARTIFACT_ID) ?? '');
    if (control === undefined) {
      state.reasons.add('control-invalid-json');
    } else {
      state.controlArtifactCount = 1;
      state.everyControlArtifactParsed = true;
      if (parseArtifactContractV1(control).ok) state.everySavedControlAccepted = true;
      else state.reasons.add('control-unexpectedly-rejected');
    }

    const source = parseJsonText(textByArtifactId.get(SOURCE_ARTIFACT_ID) ?? '');
    if (source === undefined) {
      state.reasons.add('source-invalid-json');
    } else {
      state.sourceCaseCount = 1;
      state.everySourceParsed = true;
      if (
        control !== undefined &&
        sameStableJson(
          jsonDifferencePaths(control, source),
          NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.changedPaths,
        )
      ) {
        state.everySourceControlDifferenceMatched = true;
      } else {
        state.reasons.add('source-control-difference-mismatch');
      }
      const replay = parseArtifactContractV1(source);
      if (replay.ok) {
        state.reasons.add('source-unexpectedly-accepted');
      } else {
        state.everySourceRejected = true;
        if (
          sameStableJson(
            issueSignature(replay.error),
            NEG_PATH_ENDPOINT_MAP_MISMATCH_CASE_SPEC_V1.expectedIssues,
          )
        ) {
          state.everyOrderedIssueSignatureMatched = true;
        } else {
          state.reasons.add('parser-issue-mismatch');
        }
      }
    }

    const regenerated = buildNegPathEndpointMapMismatchCandidateBundleV1();
    if (regenerated.files.every((file) => textByPath.get(file.path) === file.text)) {
      state.deterministicRegenerationMatched = true;
    } else {
      state.reasons.add('deterministic-regeneration-mismatch');
    }
    return resultFromState(state);
  } catch {
    state.reasons.add('unexpected-failure');
    return resultFromState(state);
  }
}
