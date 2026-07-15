import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  parseArtifactContractV1,
  type ArtifactContractIssue,
  type ArtifactContractV1,
} from './artifacts/contract.js';
import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import { parseFixtureManifest, sha256Prefixed } from './manifest.js';
import { stableStringify } from './stable-json.js';

export const NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/neg-layer-cycle-candidate-bundle-ledger-v1.schema.json' as const;
export const NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_RECORD_TYPE =
  'm0f-neg-layer-cycle-candidate-bundle-ledger' as const;
export const NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCOPE =
  'project-authored-exact-negative-artifact-contract-layer-cycle-parser-replay-only' as const;
export const NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_GENERATOR_ID =
  'oridesign-neg-layer-cycle-candidate-bundle' as const;
export const NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_GENERATOR_VERSION = '1.0.0-candidate' as const;
export const NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY =
  'tests/candidate-vectors/NEG-LAYER-CYCLE' as const;
export const NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_LEDGER_FILENAME =
  'candidate-bundle-ledger.json' as const;
export const NEG_LAYER_CYCLE_CANONICAL_MANIFEST_PATH = 'tests/fixtures/manifest.json' as const;
export const NEG_LAYER_CYCLE_CASE_ID = 'NEG-LAYER-CYCLE' as const;

const SOURCE_REFERENCE_ID = 'oridesign-neg-layer-cycle-candidate-v1' as const;
const CONTROL_ARTIFACT_ID = 'control-fold' as const;
const SOURCE_ARTIFACT_ID = 'source-layer-cycle' as const;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

type Mutable<T> = T extends readonly (infer U)[]
  ? Mutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: Mutable<T[K]> }
    : T;

export type NegLayerCycleSourceDocumentV1 = Mutable<ArtifactContractV1>;

function foldControl(): NegLayerCycleSourceDocumentV1 {
  return {
    schemaVersion: 1,
    schemaId: 'https://oridesign.local/schemas/m0f/artifact-contract-v1.schema.json',
    contractId: 'CONTRACT-FOLD-TWO-FACE-V1',
    conventionsId: 'oridesign-m0f-conventions-v1',
    contractStatus: 'candidate',
    scientificClaim: false,
    input: {
      kind: 'fold-verification',
      specVersion: '1.2',
      frameCount: 1,
      frameClasses: ['creasePattern'],
      verticesCoords: [
        [0, 0],
        [0.5, 0],
        [1, 0],
        [1, 1],
        [0.5, 1],
        [0, 1],
      ],
      edgesVertices: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 0],
        [1, 4],
      ],
      edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'V'],
      facesVertices: [
        [0, 5, 4, 1],
        [1, 4, 3, 2],
      ],
    },
    creaseMesh: {
      vertices: [
        { id: 'v-tl', x: 0, y: 0 },
        { id: 'v-tm', x: 0.5, y: 0 },
        { id: 'v-tr', x: 1, y: 0 },
        { id: 'v-br', x: 1, y: 1 },
        { id: 'v-bm', x: 0.5, y: 1 },
        { id: 'v-bl', x: 0, y: 1 },
      ],
      edges: [
        {
          id: 'e-top-left',
          vertices: ['v-tl', 'v-tm'],
          assignment: 'B',
          role: 'boundary',
          sourceTreeEdgeIds: [],
          generationKey: 'boundary:top-left',
        },
        {
          id: 'e-top-right',
          vertices: ['v-tm', 'v-tr'],
          assignment: 'B',
          role: 'boundary',
          sourceTreeEdgeIds: [],
          generationKey: 'boundary:top-right',
        },
        {
          id: 'e-right',
          vertices: ['v-tr', 'v-br'],
          assignment: 'B',
          role: 'boundary',
          sourceTreeEdgeIds: [],
          generationKey: 'boundary:right',
        },
        {
          id: 'e-bottom-right',
          vertices: ['v-br', 'v-bm'],
          assignment: 'B',
          role: 'boundary',
          sourceTreeEdgeIds: [],
          generationKey: 'boundary:bottom-right',
        },
        {
          id: 'e-bottom-left',
          vertices: ['v-bm', 'v-bl'],
          assignment: 'B',
          role: 'boundary',
          sourceTreeEdgeIds: [],
          generationKey: 'boundary:bottom-left',
        },
        {
          id: 'e-left',
          vertices: ['v-bl', 'v-tl'],
          assignment: 'B',
          role: 'boundary',
          sourceTreeEdgeIds: [],
          generationKey: 'boundary:left',
        },
        {
          id: 'e-hinge',
          vertices: ['v-tm', 'v-bm'],
          assignment: 'V',
          role: 'hinge',
          sourceTreeEdgeIds: [],
          generationKey: 'fold:hinge',
        },
      ],
      faces: [
        { id: 'f-left', vertices: ['v-tl', 'v-bl', 'v-bm', 'v-tm'] },
        { id: 'f-right', vertices: ['v-tm', 'v-bm', 'v-br', 'v-tr'] },
      ],
      meshJoinEdges: [],
    },
    target: {
      schemaVersion: 1,
      kind: 'flat-folded-cp',
      faceTransforms: [
        { faceId: 'f-left', quaternion: [0, 0, 0, 1], translation: [0, 0, 0] },
        { faceId: 'f-right', quaternion: [0, 0, 1, 0], translation: [1, 0, 0] },
      ],
      goalFaceOrders: [['f-right', 'f-left', 1]],
      overlapRegionIds: ['overlap-final'],
      assignmentPolicy: 'respect-mv-solve-u',
      resolvedInteriorAssignments: [{ edgeId: 'e-hinge', assignment: 'V' }],
    },
    pathCandidate: {
      representationVersion: 1,
      representationStatus: 'candidate',
      segments: [
        {
          t0: 0,
          t1: 1,
          motion: {
            kind: 'bounded-interpolation',
            knotTimes: [0, 1],
            anglesByCrease: [{ edgeId: 'e-hinge', angles: [0, Math.PI] }],
            intervalAngleBoundsByCrease: [{ edgeId: 'e-hinge', bounds: [[0, Math.PI]] }],
          },
        },
      ],
    },
    overlapRegions: [{ id: 'overlap-final', faceIds: ['f-left', 'f-right'] }],
    contacts: [
      {
        id: 'contact-final',
        interval: [1, 1],
        faceIds: ['f-left', 'f-right'],
        overlapRegionId: 'overlap-final',
        classification: 'coplanar-overlap',
      },
    ],
    layerEvents: [
      {
        id: 'layer-final',
        interval: [1, 1],
        overlapRegionId: 'overlap-final',
        aboveFaceId: 'f-right',
        belowFaceId: 'f-left',
      },
    ],
  };
}

export const NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1 = deepFreezeOwned(foldControl());

function layerCycleSource(): NegLayerCycleSourceDocumentV1 {
  const source = structuredClone(NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1);
  source.layerEvents.push({
    id: 'layer-reverse-terminal',
    interval: [1, 1],
    overlapRegionId: 'overlap-final',
    aboveFaceId: 'f-left',
    belowFaceId: 'f-right',
  });
  return source;
}

type ExpectedIssueV1 = Readonly<{ path: string; code: string }>;

export const NEG_LAYER_CYCLE_CASE_SPEC_V1 = deepFreezeOwned({
  caseId: NEG_LAYER_CYCLE_CASE_ID,
  controlArtifactId: CONTROL_ARTIFACT_ID,
  mutationKind: 'append-reverse-terminal-layer-relation',
  changedPaths: ['$.layerEvents[1]'],
  sourceArtifactId: SOURCE_ARTIFACT_ID,
  sourcePath: 'layer-cycle.json',
  sourceDocument: layerCycleSource(),
  expectedIssues: [{ path: '$.layerEvents', code: 'layer-cycle' }],
} as const);

export const NEG_LAYER_CYCLE_CANDIDATE_README_V1 = `# NEG-LAYER-CYCLE exact-negative candidate vector

This closed directory contains one saved project-authored FOLD artifact-contract control and one exact-negative mutation for the current \`parseArtifactContractV1\` temporal layer-DAG check. The saved control must freshly parse. The mutation adds the reverse relation at the same terminal interval \`[1,1]\`, so the current parser must reject it with the complete ordered issue signature fixed in the ledger.

The bundle is intentionally outside \`tests/fixtures/manifest.json\`; \`NEG-LAYER-CYCLE\` is not canonically registered or promoted. Exact-negative means only current artifact-contract parser regression replay. It does not establish a physical layer order, order-reversal detection, contact legality, path continuity, rigid motion, target attainment, collision detection or freedom, foldability, a SupportProfile, a ToleranceProfile, scientific verification, or M0F GO.

Verify with \`npx tsx m0f/neg-layer-cycle-candidate-bundle-cli.ts --verify\`. Regenerate with \`npx tsx m0f/neg-layer-cycle-candidate-bundle-cli.ts --write\`.
`;

export type NegLayerCycleArtifactProvenanceV1 = Readonly<{
  sourceReferenceId: typeof SOURCE_REFERENCE_ID;
  sourceUse: 'project-authored';
  derivation: 'authored' | 'mutated-from-control';
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[];
}>;

export type NegLayerCycleArtifactLedgerEntryV1 = Readonly<{
  artifactId: string;
  role: 'readme' | 'accepted-control' | 'negative-source';
  path: string;
  mediaType: 'text/markdown; charset=utf-8' | 'application/json';
  sha256: `sha256:${string}`;
  licenseSpdx: 'MIT';
  provenance: NegLayerCycleArtifactProvenanceV1;
}>;

type ArtifactSpecV1 = Omit<NegLayerCycleArtifactLedgerEntryV1, 'sha256'>;

function provenance(
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[],
): NegLayerCycleArtifactProvenanceV1 {
  return {
    sourceReferenceId: SOURCE_REFERENCE_ID,
    sourceUse: 'project-authored',
    derivation: dependsOnArtifactIds.length === 0 ? 'authored' : 'mutated-from-control',
    dependsOnArtifactIds,
  };
}

export const NEG_LAYER_CYCLE_ARTIFACT_SPECS_V1 = deepFreezeOwned([
  {
    artifactId: 'bundle-readme',
    role: 'readme',
    path: 'README.md',
    mediaType: 'text/markdown; charset=utf-8',
    licenseSpdx: 'MIT',
    provenance: provenance([]),
  },
  {
    artifactId: CONTROL_ARTIFACT_ID,
    role: 'accepted-control',
    path: 'control-fold.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: provenance([]),
  },
  {
    artifactId: SOURCE_ARTIFACT_ID,
    role: 'negative-source',
    path: NEG_LAYER_CYCLE_CASE_SPEC_V1.sourcePath,
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: provenance([CONTROL_ARTIFACT_ID]),
  },
] as const satisfies readonly ArtifactSpecV1[]);

export type NegLayerCycleCaseLedgerRowV1 = Readonly<{
  caseIndex: 0;
  caseId: typeof NEG_LAYER_CYCLE_CASE_ID;
  controlArtifactId: typeof CONTROL_ARTIFACT_ID;
  mutationKind: typeof NEG_LAYER_CYCLE_CASE_SPEC_V1.mutationKind;
  changedPaths: readonly ['$.layerEvents[1]'];
  sourceArtifactId: typeof SOURCE_ARTIFACT_ID;
  sourcePath: 'layer-cycle.json';
  expectedOutcome: 'rejected';
  expectedIssues: readonly ExpectedIssueV1[];
}>;

const GENERATOR = deepFreezeOwned({
  generatorId: NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_GENERATOR_ID,
  generatorVersion: NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_GENERATOR_VERSION,
  serialization: 'stable-json-utf8-lf-v1' as const,
  detector: 'parseArtifactContractV1' as const,
  detectorSourcePath: 'm0f/artifacts/contract.ts' as const,
});

const SOURCE_PROVENANCE = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceKind: 'project-authored' as const,
  title: 'NEG-LAYER-CYCLE project-authored artifact-contract temporal layer-DAG vector',
  authors: ['OriDesign contributors'],
  redistribution: 'allowed' as const,
  licenseSpdx: 'MIT' as const,
});

function ledgerCases(): readonly NegLayerCycleCaseLedgerRowV1[] {
  return [
    {
      caseIndex: 0,
      caseId: NEG_LAYER_CYCLE_CASE_ID,
      controlArtifactId: CONTROL_ARTIFACT_ID,
      mutationKind: NEG_LAYER_CYCLE_CASE_SPEC_V1.mutationKind,
      changedPaths: NEG_LAYER_CYCLE_CASE_SPEC_V1.changedPaths,
      sourceArtifactId: SOURCE_ARTIFACT_ID,
      sourcePath: NEG_LAYER_CYCLE_CASE_SPEC_V1.sourcePath,
      expectedOutcome: 'rejected',
      expectedIssues: NEG_LAYER_CYCLE_CASE_SPEC_V1.expectedIssues,
    },
  ];
}

export type NegLayerCycleCandidateBundleLedgerV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCHEMA_ID;
  recordType: typeof NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-LAYER-CYCLE-V1';
  scope: typeof NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCOPE;
  canonicalManifestPath: typeof NEG_LAYER_CYCLE_CANONICAL_MANIFEST_PATH;
  canonicalManifestRegistration: 'not-registered';
  canonicalPromotionClaimed: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  physicalLayerOrderEstablished: false;
  orderReversalDetectionIncluded: false;
  contactLegalityEstablished: false;
  pathContinuityEstablished: false;
  collisionDetectionIncluded: false;
  foldabilityEstablished: false;
  scientificVerificationClaimed: false;
  globalM0fGate: 'not-evaluated';
  caseCount: 1;
  artifactCount: 3;
  generator: typeof GENERATOR;
  provenance: typeof SOURCE_PROVENANCE;
  cases: readonly NegLayerCycleCaseLedgerRowV1[];
  artifacts: readonly NegLayerCycleArtifactLedgerEntryV1[];
}>;

export type NegLayerCycleCandidateLedgerIssueV1 = Readonly<{
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

export type NegLayerCycleCandidateLedgerParseResultV1 =
  | Readonly<{ ok: true; value: NegLayerCycleCandidateBundleLedgerV1 }>
  | Readonly<{ ok: false; error: readonly NegLayerCycleCandidateLedgerIssueV1[] }>;

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
  'supportProfileIncluded',
  'toleranceProfileIncluded',
  'physicalLayerOrderEstablished',
  'orderReversalDetectionIncluded',
  'contactLegalityEstablished',
  'pathContinuityEstablished',
  'collisionDetectionIncluded',
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
  issues: NegLayerCycleCandidateLedgerIssueV1[],
  path: string,
  code: NegLayerCycleCandidateLedgerIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: NegLayerCycleCandidateLedgerIssueV1[],
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

/** Parses a closed candidate ledger and fixes its sole case, oracle, and artifact rows. */
export function parseNegLayerCycleCandidateBundleLedgerV1(
  supplied: unknown,
): NegLayerCycleCandidateLedgerParseResultV1 {
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
  const issues: NegLayerCycleCandidateLedgerIssueV1[] = [];
  exactKeys(value, ROOT_KEYS, '$', issues);
  const literals = [
    ['schemaVersion', 1],
    ['schemaId', NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCHEMA_ID],
    ['recordType', NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_RECORD_TYPE],
    ['contractStatus', 'candidate'],
    ['scientificClaim', false],
    ['vectorSetId', 'NEG-LAYER-CYCLE-V1'],
    ['scope', NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCOPE],
    ['canonicalManifestPath', NEG_LAYER_CYCLE_CANONICAL_MANIFEST_PATH],
    ['canonicalManifestRegistration', 'not-registered'],
    ['canonicalPromotionClaimed', false],
    ['supportProfileIncluded', false],
    ['toleranceProfileIncluded', false],
    ['physicalLayerOrderEstablished', false],
    ['orderReversalDetectionIncluded', false],
    ['contactLegalityEstablished', false],
    ['pathContinuityEstablished', false],
    ['collisionDetectionIncluded', false],
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
    for (const [index, expected] of NEG_LAYER_CYCLE_ARTIFACT_SPECS_V1.entries()) {
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
    value: value as unknown as NegLayerCycleCandidateBundleLedgerV1,
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

export type NegLayerCycleCandidateBuiltFileV1 = Readonly<{
  artifactId: string | null;
  path: string;
  text: string;
}>;

export type NegLayerCycleCandidateBuildV1 = Readonly<{
  ledger: NegLayerCycleCandidateBundleLedgerV1;
  files: readonly NegLayerCycleCandidateBuiltFileV1[];
}>;

/** Builds only after the saved-control anchor, exact delta, and complete parser oracle replay. */
export function buildNegLayerCycleCandidateBundleV1(): NegLayerCycleCandidateBuildV1 {
  if (!parseArtifactContractV1(NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1).ok) {
    throw new TypeError('accepted NEG-LAYER-CYCLE fold control no longer parses');
  }
  const differences = jsonDifferencePaths(
    NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1,
    NEG_LAYER_CYCLE_CASE_SPEC_V1.sourceDocument,
  );
  if (!sameStableJson(differences, NEG_LAYER_CYCLE_CASE_SPEC_V1.changedPaths)) {
    throw new TypeError('NEG-LAYER-CYCLE control delta changed');
  }
  const replay = parseArtifactContractV1(NEG_LAYER_CYCLE_CASE_SPEC_V1.sourceDocument);
  if (
    replay.ok ||
    !sameStableJson(issueSignature(replay.error), NEG_LAYER_CYCLE_CASE_SPEC_V1.expectedIssues)
  ) {
    throw new TypeError('NEG-LAYER-CYCLE parser oracle changed');
  }
  const textByArtifactId = new Map<string, string>([
    ['bundle-readme', NEG_LAYER_CYCLE_CANDIDATE_README_V1],
    [CONTROL_ARTIFACT_ID, jsonLine(NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1)],
    [SOURCE_ARTIFACT_ID, jsonLine(NEG_LAYER_CYCLE_CASE_SPEC_V1.sourceDocument)],
  ]);
  const artifacts = NEG_LAYER_CYCLE_ARTIFACT_SPECS_V1.map((spec) => {
    const text = textByArtifactId.get(spec.artifactId);
    if (text === undefined) throw new TypeError(`missing layer-cycle artifact ${spec.artifactId}`);
    return { ...spec, sha256: sha256Prefixed(text) as `sha256:${string}` };
  });
  const ledger: NegLayerCycleCandidateBundleLedgerV1 = {
    schemaVersion: 1,
    schemaId: NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCHEMA_ID,
    recordType: NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    vectorSetId: 'NEG-LAYER-CYCLE-V1',
    scope: NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCOPE,
    canonicalManifestPath: NEG_LAYER_CYCLE_CANONICAL_MANIFEST_PATH,
    canonicalManifestRegistration: 'not-registered',
    canonicalPromotionClaimed: false,
    supportProfileIncluded: false,
    toleranceProfileIncluded: false,
    physicalLayerOrderEstablished: false,
    orderReversalDetectionIncluded: false,
    contactLegalityEstablished: false,
    pathContinuityEstablished: false,
    collisionDetectionIncluded: false,
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
  const files: NegLayerCycleCandidateBuiltFileV1[] = artifacts.map((artifact) => {
    const text = textByArtifactId.get(artifact.artifactId);
    if (text === undefined)
      throw new TypeError(`missing layer-cycle artifact ${artifact.artifactId}`);
    return { artifactId: artifact.artifactId, path: artifact.path, text };
  });
  files.push({
    artifactId: null,
    path: NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
    text: jsonLine(ledger),
  });
  return deepFreezeOwned({ ledger, files });
}

/** Writes exactly four regular files and refuses unexpected entries rather than deleting them. */
export async function writeNegLayerCycleCandidateBundleV1(
  bundleDirectory: string = NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegLayerCycleCandidateBuildV1> {
  const built = buildNegLayerCycleCandidateBundleV1();
  const absoluteDirectory = resolve(bundleDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const expectedNames = new Set(built.files.map((file) => file.path));
  const existing = await readdir(absoluteDirectory, { withFileTypes: true });
  if (existing.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))) {
    throw new TypeError('negative layer-cycle candidate directory contains an unexpected entry');
  }
  await Promise.all(
    built.files.map((file) => writeFile(resolve(absoluteDirectory, file.path), file.text, 'utf8')),
  );
  return built;
}

export const NEG_LAYER_CYCLE_CANDIDATE_REASON_CODES = [
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

export type NegLayerCycleCandidateReasonCodeV1 =
  (typeof NEG_LAYER_CYCLE_CANDIDATE_REASON_CODES)[number];

export type NegLayerCycleCandidateVerificationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-neg-layer-cycle-candidate-bundle-verification-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-LAYER-CYCLE-V1';
  scope: typeof NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCOPE;
  globalM0fGate: 'not-evaluated';
  canonicalPromotionClaimed: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  physicalLayerOrderEstablished: false;
  orderReversalDetectionIncluded: false;
  contactLegalityEstablished: false;
  pathContinuityEstablished: false;
  collisionDetectionIncluded: false;
  foldabilityEstablished: false;
  scientificVerificationClaimed: false;
  reproducibleExactNegativeBundle: boolean;
  reasonCodes: readonly NegLayerCycleCandidateReasonCodeV1[];
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
  reasons: Set<NegLayerCycleCandidateReasonCodeV1>;
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
): NegLayerCycleCandidateVerificationResultV1 {
  const reasonCodes = NEG_LAYER_CYCLE_CANDIDATE_REASON_CODES.filter((code) =>
    state.reasons.has(code),
  );
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: 'm0f-neg-layer-cycle-candidate-bundle-verification-result' as const,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    vectorSetId: 'NEG-LAYER-CYCLE-V1' as const,
    scope: NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCOPE,
    globalM0fGate: 'not-evaluated' as const,
    canonicalPromotionClaimed: false as const,
    supportProfileIncluded: false as const,
    toleranceProfileIncluded: false as const,
    physicalLayerOrderEstablished: false as const,
    orderReversalDetectionIncluded: false as const,
    contactLegalityEstablished: false as const,
    pathContinuityEstablished: false as const,
    collisionDetectionIncluded: false as const,
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
        await readFile(resolve(NEG_LAYER_CYCLE_CANONICAL_MANIFEST_PATH), 'utf8'),
      ) as unknown,
    );
    if (parsed.manifest === undefined) return undefined;
    return !parsed.manifest.fixtures.some((fixture) => fixture.id === NEG_LAYER_CYCLE_CASE_ID);
  } catch {
    return undefined;
  }
}

/** Replays only the saved artifact-contract control and its exact layer-cycle mutation. */
export async function verifyNegLayerCycleCandidateBundleV1(
  bundleDirectory: string = NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegLayerCycleCandidateVerificationResultV1> {
  const state = initialState();
  try {
    const absoluteDirectory = resolve(bundleDirectory);
    let ledgerText: string;
    let ledgerDocument: unknown;
    try {
      ledgerText = await readFile(
        resolve(absoluteDirectory, NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
        'utf8',
      );
      ledgerDocument = JSON.parse(ledgerText) as unknown;
    } catch {
      state.reasons.add('ledger-unreadable');
      return resultFromState(state);
    }
    const parsedLedger = parseNegLayerCycleCandidateBundleLedgerV1(ledgerDocument);
    if (!parsedLedger.ok) {
      state.reasons.add('ledger-invalid');
      return resultFromState(state);
    }
    state.ledgerPresentAndValid = true;
    state.allArtifactProvenanceFixed = true;

    const expectedNames = new Set([
      NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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
      [NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_LEDGER_FILENAME, ledgerText],
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
          NEG_LAYER_CYCLE_CASE_SPEC_V1.changedPaths,
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
          sameStableJson(issueSignature(replay.error), NEG_LAYER_CYCLE_CASE_SPEC_V1.expectedIssues)
        ) {
          state.everyOrderedIssueSignatureMatched = true;
        } else {
          state.reasons.add('parser-issue-mismatch');
        }
      }
    }

    const regenerated = buildNegLayerCycleCandidateBundleV1();
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
