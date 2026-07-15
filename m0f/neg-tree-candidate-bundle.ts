import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  parseOrderedTreeInputV1,
  type OrderedTreeInputIssue,
} from './box-pleating/ordered-tree-input.js';
import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import { parseFixtureManifest, sha256Prefixed } from './manifest.js';
import { stableStringify } from './stable-json.js';

export const NEG_TREE_CANDIDATE_BUNDLE_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/neg-tree-candidate-bundle-ledger-v1.schema.json' as const;
export const NEG_TREE_CANDIDATE_BUNDLE_RECORD_TYPE =
  'm0f-neg-tree-candidate-bundle-ledger' as const;
export const NEG_TREE_CANDIDATE_BUNDLE_SCOPE =
  'project-authored-exact-negative-ordered-tree-input-parser-replay-only' as const;
export const NEG_TREE_CANDIDATE_BUNDLE_GENERATOR_ID =
  'oridesign-neg-tree-candidate-bundle' as const;
export const NEG_TREE_CANDIDATE_BUNDLE_GENERATOR_VERSION = '1.0.0-candidate' as const;
export const NEG_TREE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY =
  'tests/candidate-vectors/NEG-TREE' as const;
export const NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME = 'candidate-bundle-ledger.json' as const;
export const NEG_TREE_CANONICAL_MANIFEST_PATH = 'tests/fixtures/manifest.json' as const;
export const NEG_TREE_CASE_ID_PREFIX = 'NEG-TREE-' as const;

const SOURCE_REFERENCE_ID = 'oridesign-neg-tree-candidates-v1' as const;
const PRIMARY_CONTROL_ID = 'primary-star-four-leaf-control-v1' as const;
const LEAF_BOUNDARY_CONTROL_ID = 'two-center-twenty-leaf-control-v1' as const;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

export interface NegTreeSourceNodeV1 {
  id: string;
  pos: { x: number; y: number };
  label: string;
  mirrorOf: string | null;
  onSymmetryAxis: boolean;
}

export interface NegTreeSourceEdgeV1 {
  id: string;
  from: string;
  to: string;
  length: number;
  width: number;
  label: string;
  mirrorOf: string | null;
}

export interface NegTreeSourceRotationV1 {
  nodeId: string;
  edgeIds: string[];
}

export interface NegTreeSourceDocumentV1 {
  schemaVersion: 1;
  recordType: 'm0f-ordered-tree-input';
  contractStatus: 'candidate';
  scientificClaim: false;
  nodes: NegTreeSourceNodeV1[];
  edges: NegTreeSourceEdgeV1[];
  rotation: NegTreeSourceRotationV1[];
}

function sourceNode(id: string, x: number, y: number): NegTreeSourceNodeV1 {
  return { id, pos: { x, y }, label: id, mirrorOf: null, onSymmetryAxis: false };
}

function sourceEdge(id: string, from: string, to: string): NegTreeSourceEdgeV1 {
  return { id, from, to, length: 1, width: 0, label: id, mirrorOf: null };
}

function primaryControl(): NegTreeSourceDocumentV1 {
  return {
    schemaVersion: 1,
    recordType: 'm0f-ordered-tree-input',
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes: [
      sourceNode('node-a', -1, 0),
      sourceNode('node-b', 0, 1),
      sourceNode('node-c', 0, 0),
      sourceNode('node-d', 1, 0),
      sourceNode('node-e', 0, -1),
    ],
    edges: [
      sourceEdge('edge-ca', 'node-c', 'node-a'),
      sourceEdge('edge-cb', 'node-c', 'node-b'),
      sourceEdge('edge-cd', 'node-c', 'node-d'),
      sourceEdge('edge-ce', 'node-c', 'node-e'),
    ],
    rotation: [
      { nodeId: 'node-a', edgeIds: ['edge-ca'] },
      { nodeId: 'node-b', edgeIds: ['edge-cb'] },
      { nodeId: 'node-c', edgeIds: ['edge-ca', 'edge-cb', 'edge-cd', 'edge-ce'] },
      { nodeId: 'node-d', edgeIds: ['edge-cd'] },
      { nodeId: 'node-e', edgeIds: ['edge-ce'] },
    ],
  };
}

function leafBoundaryControl(leafCount: 20 | 21): NegTreeSourceDocumentV1 {
  const nodes = [sourceNode('center-left', -1, 0), sourceNode('center-right', 1, 0)];
  const edges = [sourceEdge('edge-centers', 'center-left', 'center-right')];
  const leftEdgeIds = ['edge-centers'];
  const rightEdgeIds = ['edge-centers'];
  const leafRotations: NegTreeSourceRotationV1[] = [];
  for (let index = 0; index < leafCount; index += 1) {
    const suffix = String(index).padStart(2, '0');
    const nodeId = `leaf-${suffix}`;
    const edgeId = `edge-leaf-${suffix}`;
    const centerId = index < 10 || index >= 20 ? 'center-left' : 'center-right';
    nodes.push(sourceNode(nodeId, index, index % 2));
    edges.push(sourceEdge(edgeId, centerId, nodeId));
    leafRotations.push({ nodeId, edgeIds: [edgeId] });
    (centerId === 'center-left' ? leftEdgeIds : rightEdgeIds).push(edgeId);
  }
  return {
    schemaVersion: 1,
    recordType: 'm0f-ordered-tree-input',
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes,
    edges,
    rotation: [
      { nodeId: 'center-left', edgeIds: leftEdgeIds },
      { nodeId: 'center-right', edgeIds: rightEdgeIds },
      ...leafRotations,
    ],
  };
}

export const NEG_TREE_VALID_CONTROL_SOURCE_V1 = deepFreezeOwned(primaryControl());
export const NEG_TREE_LEAF_BOUNDARY_CONTROL_SOURCE_V1 = deepFreezeOwned(leafBoundaryControl(20));

type ExpectedIssueV1 = Readonly<{
  path: string;
  code: OrderedTreeInputIssue['code'];
}>;

type ControlIdV1 = typeof PRIMARY_CONTROL_ID | typeof LEAF_BOUNDARY_CONTROL_ID;

type NegativeCaseSpecV1 = Readonly<{
  caseId: `${typeof NEG_TREE_CASE_ID_PREFIX}${string}`;
  controlId: ControlIdV1;
  mutationKind: string;
  changedPaths: readonly string[];
  sourceArtifactId: string;
  sourcePath: string;
  sourceDocument: NegTreeSourceDocumentV1;
  expectedIssues: readonly ExpectedIssueV1[];
}>;

function mutatePrimary(
  mutation: (source: NegTreeSourceDocumentV1) => void,
): NegTreeSourceDocumentV1 {
  const source = structuredClone(NEG_TREE_VALID_CONTROL_SOURCE_V1);
  mutation(source);
  return source;
}

function requiredEntry<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new TypeError(`missing fixed source entry ${String(index)}`);
  return value;
}

export const NEG_TREE_CASE_SPECS_V1 = deepFreezeOwned([
  {
    caseId: 'NEG-TREE-DUPLICATE-NODE-ID',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'replace-node-id-with-existing-node-id',
    changedPaths: ['$.nodes[1].id'],
    sourceArtifactId: 'source-duplicate-node-id',
    sourcePath: 'duplicate-node-id.json',
    sourceDocument: mutatePrimary((source) => {
      requiredEntry(source.nodes, 1).id = 'node-a';
    }),
    expectedIssues: [
      { path: '$.nodes[1].id', code: 'duplicate-id' },
      { path: '$.edges', code: 'edge-count-mismatch' },
      { path: '$.edges[1].to', code: 'missing-reference' },
      { path: '$.rotation[1].nodeId', code: 'missing-reference' },
      { path: '$.rotation[2].edgeIds', code: 'rotation-incidence-mismatch' },
      { path: '$.rotation', code: 'rotation-coverage-mismatch' },
    ],
  },
  {
    caseId: 'NEG-TREE-DUPLICATE-EDGE-ID',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'replace-edge-id-with-existing-edge-id',
    changedPaths: ['$.edges[1].id'],
    sourceArtifactId: 'source-duplicate-edge-id',
    sourcePath: 'duplicate-edge-id.json',
    sourceDocument: mutatePrimary((source) => {
      requiredEntry(source.edges, 1).id = 'edge-ca';
    }),
    expectedIssues: [
      { path: '$.edges[1].id', code: 'duplicate-id' },
      { path: '$.edges', code: 'edge-count-mismatch' },
      { path: '$', code: 'tree-disconnected' },
      { path: '$.rotation[1].edgeIds[0]', code: 'missing-reference' },
      { path: '$.rotation[1].edgeIds', code: 'rotation-incidence-mismatch' },
      { path: '$.rotation[2].edgeIds[1]', code: 'missing-reference' },
      { path: '$.rotation[2].edgeIds', code: 'rotation-incidence-mismatch' },
    ],
  },
  {
    caseId: 'NEG-TREE-DUPLICATE-ID-NAMESPACE',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'replace-edge-id-with-existing-node-id',
    changedPaths: ['$.edges[0].id'],
    sourceArtifactId: 'source-duplicate-id-namespace',
    sourcePath: 'duplicate-id-namespace.json',
    sourceDocument: mutatePrimary((source) => {
      requiredEntry(source.edges, 0).id = 'node-a';
    }),
    expectedIssues: [
      { path: '$.edges[0].id', code: 'duplicate-id' },
      { path: '$.edges', code: 'edge-count-mismatch' },
      { path: '$', code: 'tree-disconnected' },
      { path: '$.rotation[0].edgeIds[0]', code: 'missing-reference' },
      { path: '$.rotation[0].edgeIds', code: 'rotation-incidence-mismatch' },
      { path: '$.rotation[2].edgeIds[0]', code: 'missing-reference' },
      { path: '$.rotation[2].edgeIds', code: 'rotation-incidence-mismatch' },
    ],
  },
  {
    caseId: 'NEG-TREE-SELF-LOOP',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'append-self-loop-edge',
    changedPaths: ['$.edges[4]'],
    sourceArtifactId: 'source-self-loop',
    sourcePath: 'self-loop.json',
    sourceDocument: mutatePrimary((source) => {
      source.edges.push(sourceEdge('edge-loop', 'node-c', 'node-c'));
    }),
    expectedIssues: [
      { path: '$.edges', code: 'edge-count-mismatch' },
      { path: '$.edges[4]', code: 'tree-self-loop' },
    ],
  },
  {
    caseId: 'NEG-TREE-PARALLEL-EDGE',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'append-parallel-edge-and-incidence',
    changedPaths: ['$.edges[4]', '$.rotation[0].edgeIds[1]', '$.rotation[2].edgeIds[4]'],
    sourceArtifactId: 'source-parallel-edge',
    sourcePath: 'parallel-edge.json',
    sourceDocument: mutatePrimary((source) => {
      source.edges.push(sourceEdge('edge-parallel', 'node-c', 'node-a'));
      requiredEntry(source.rotation, 0).edgeIds.push('edge-parallel');
      requiredEntry(source.rotation, 2).edgeIds.push('edge-parallel');
    }),
    expectedIssues: [
      { path: '$.edges', code: 'edge-count-mismatch' },
      { path: '$.edges[4]', code: 'tree-parallel-edge' },
      { path: '$.edges[4]', code: 'tree-cycle' },
    ],
  },
  {
    caseId: 'NEG-TREE-CYCLE',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'append-cycle-closing-edge-and-incidence',
    changedPaths: ['$.edges[4]', '$.rotation[0].edgeIds[1]', '$.rotation[1].edgeIds[1]'],
    sourceArtifactId: 'source-cycle',
    sourcePath: 'cycle.json',
    sourceDocument: mutatePrimary((source) => {
      source.edges.push(sourceEdge('edge-cycle', 'node-a', 'node-b'));
      requiredEntry(source.rotation, 0).edgeIds.push('edge-cycle');
      requiredEntry(source.rotation, 1).edgeIds.push('edge-cycle');
    }),
    expectedIssues: [
      { path: '$.edges', code: 'edge-count-mismatch' },
      { path: '$.edges[4]', code: 'tree-cycle' },
    ],
  },
  {
    caseId: 'NEG-TREE-DISCONNECTED',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'remove-terminal-edge-and-incidence',
    changedPaths: ['$.edges[3]', '$.rotation[2].edgeIds[3]', '$.rotation[4].edgeIds[0]'],
    sourceArtifactId: 'source-disconnected',
    sourcePath: 'disconnected.json',
    sourceDocument: mutatePrimary((source) => {
      source.edges.pop();
      requiredEntry(source.rotation, 2).edgeIds.pop();
      requiredEntry(source.rotation, 4).edgeIds = [];
    }),
    expectedIssues: [
      { path: '$.edges', code: 'edge-count-mismatch' },
      { path: '$', code: 'tree-disconnected' },
    ],
  },
  {
    caseId: 'NEG-TREE-NONPOSITIVE-LENGTH',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'replace-length-with-zero',
    changedPaths: ['$.edges[0].length'],
    sourceArtifactId: 'source-nonpositive-length',
    sourcePath: 'nonpositive-length.json',
    sourceDocument: mutatePrimary((source) => {
      requiredEntry(source.edges, 0).length = 0;
    }),
    expectedIssues: [
      { path: '$.edges[0].length', code: 'invalid-bound' },
      { path: '$.edges', code: 'edge-count-mismatch' },
      { path: '$', code: 'tree-disconnected' },
      { path: '$.rotation[0].edgeIds[0]', code: 'missing-reference' },
      { path: '$.rotation[0].edgeIds', code: 'rotation-incidence-mismatch' },
      { path: '$.rotation[2].edgeIds[0]', code: 'missing-reference' },
      { path: '$.rotation[2].edgeIds', code: 'rotation-incidence-mismatch' },
    ],
  },
  {
    caseId: 'NEG-TREE-NEGATIVE-WIDTH',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'replace-width-with-negative-value',
    changedPaths: ['$.edges[0].width'],
    sourceArtifactId: 'source-negative-width',
    sourcePath: 'negative-width.json',
    sourceDocument: mutatePrimary((source) => {
      requiredEntry(source.edges, 0).width = -1;
    }),
    expectedIssues: [
      { path: '$.edges[0].width', code: 'invalid-bound' },
      { path: '$.edges', code: 'edge-count-mismatch' },
      { path: '$', code: 'tree-disconnected' },
      { path: '$.rotation[0].edgeIds[0]', code: 'missing-reference' },
      { path: '$.rotation[0].edgeIds', code: 'rotation-incidence-mismatch' },
      { path: '$.rotation[2].edgeIds[0]', code: 'missing-reference' },
      { path: '$.rotation[2].edgeIds', code: 'rotation-incidence-mismatch' },
    ],
  },
  {
    caseId: 'NEG-TREE-ROTATION-COVERAGE-MISSING',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'remove-one-rotation-row',
    changedPaths: ['$.rotation[4]'],
    sourceArtifactId: 'source-rotation-coverage-missing',
    sourcePath: 'rotation-coverage-missing.json',
    sourceDocument: mutatePrimary((source) => {
      source.rotation.pop();
    }),
    expectedIssues: [{ path: '$.rotation', code: 'rotation-coverage-mismatch' }],
  },
  {
    caseId: 'NEG-TREE-ROTATION-INCIDENCE-MISMATCH',
    controlId: PRIMARY_CONTROL_ID,
    mutationKind: 'replace-incident-edge-with-nonincident-edge',
    changedPaths: ['$.rotation[0].edgeIds[0]'],
    sourceArtifactId: 'source-rotation-incidence-mismatch',
    sourcePath: 'rotation-incidence-mismatch.json',
    sourceDocument: mutatePrimary((source) => {
      requiredEntry(source.rotation, 0).edgeIds = ['edge-cb'];
    }),
    expectedIssues: [{ path: '$.rotation[0].edgeIds', code: 'rotation-incidence-mismatch' }],
  },
  {
    caseId: 'NEG-TREE-LEAF-COUNT-OUT-OF-RANGE',
    controlId: LEAF_BOUNDARY_CONTROL_ID,
    mutationKind: 'append-twenty-first-leaf-with-edge-and-rotation',
    changedPaths: ['$.nodes[22]', '$.edges[21]', '$.rotation[0].edgeIds[11]', '$.rotation[22]'],
    sourceArtifactId: 'source-leaf-count-out-of-range',
    sourcePath: 'leaf-count-out-of-range.json',
    sourceDocument: leafBoundaryControl(21),
    expectedIssues: [{ path: '$.nodes', code: 'leaf-count-out-of-range' }],
  },
] as const satisfies readonly NegativeCaseSpecV1[]);

export const NEG_TREE_CANDIDATE_README_V1 = `# NEG-TREE exact-negative candidate vectors

This directory contains project-authored exact-negative inputs for the closed ordered-tree input parser boundary.

It is intentionally outside \`tests/fixtures/manifest.json\`; none of its \`NEG-TREE-*\` case IDs is registered in the canonical manifest. No canonical promotion is claimed. No SupportProfile or ToleranceProfile is defined, selected, or implied. The 2..20 leaf range is only the current defensive parser limit. Scientific verification is not claimed, and the global M0F gate is not evaluated.

Here, exact-negative means only that \`parseOrderedTreeInputV1\` deterministically rejects the saved bytes with the complete ordered issue code/path sequence in the ledger. These vectors are parser regression evidence, not a proof of tree-method feasibility, constructibility, crease-pattern validity, or foldability. The twenty-first-leaf vector isolates the implemented upper leaf-count boundary; it does not claim a separately reachable connected-tree leaf-underflow result.

The primary four-leaf star control and the separate two-center twenty-leaf boundary control must both remain accepted before generation or verification can succeed. Each ledger row also fixes its control, mutation description, and complete ordered JSON-difference path list.

Verify without writing:

\`\`\`text
npx tsx m0f/neg-tree-candidate-bundle-cli.ts --verify
\`\`\`

Regenerate and immediately verify:

\`\`\`text
npx tsx m0f/neg-tree-candidate-bundle-cli.ts --write
\`\`\`
`;

export type NegTreeArtifactProvenanceV1 = Readonly<{
  sourceReferenceId: typeof SOURCE_REFERENCE_ID;
  sourceUse: 'project-authored';
  derivation: 'authored';
  dependsOnArtifactIds: readonly [];
}>;

export type NegTreeArtifactLedgerEntryV1 = Readonly<{
  artifactId: string;
  role: 'readme' | 'negative-source';
  path: string;
  mediaType: 'text/markdown; charset=utf-8' | 'application/json';
  sha256: `sha256:${string}`;
  licenseSpdx: 'MIT';
  provenance: NegTreeArtifactProvenanceV1;
}>;

type ArtifactSpecV1 = Omit<NegTreeArtifactLedgerEntryV1, 'sha256'>;

const AUTHORED_PROVENANCE: NegTreeArtifactProvenanceV1 = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceUse: 'project-authored',
  derivation: 'authored',
  dependsOnArtifactIds: [],
});

export const NEG_TREE_ARTIFACT_SPECS_V1 = deepFreezeOwned([
  {
    artifactId: 'bundle-readme',
    role: 'readme',
    path: 'README.md',
    mediaType: 'text/markdown; charset=utf-8',
    licenseSpdx: 'MIT',
    provenance: AUTHORED_PROVENANCE,
  },
  ...NEG_TREE_CASE_SPECS_V1.map((caseSpec) => ({
    artifactId: caseSpec.sourceArtifactId,
    role: 'negative-source' as const,
    path: caseSpec.sourcePath,
    mediaType: 'application/json' as const,
    licenseSpdx: 'MIT' as const,
    provenance: AUTHORED_PROVENANCE,
  })),
] satisfies readonly ArtifactSpecV1[]);

export type NegTreeCaseLedgerRowV1 = Readonly<{
  caseIndex: number;
  caseId: NegativeCaseSpecV1['caseId'];
  controlId: ControlIdV1;
  mutationKind: string;
  changedPaths: readonly string[];
  sourceArtifactId: string;
  sourcePath: string;
  expectedOutcome: 'rejected';
  expectedIssues: readonly ExpectedIssueV1[];
}>;

const GENERATOR = deepFreezeOwned({
  generatorId: NEG_TREE_CANDIDATE_BUNDLE_GENERATOR_ID,
  generatorVersion: NEG_TREE_CANDIDATE_BUNDLE_GENERATOR_VERSION,
  serialization: 'stable-json-utf8-lf-v1' as const,
  detector: 'parseOrderedTreeInputV1' as const,
  detectorSourcePath: 'm0f/box-pleating/ordered-tree-input.ts' as const,
});

const SOURCE_PROVENANCE = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceKind: 'project-authored' as const,
  title: 'NEG-TREE project-authored exact-negative candidate vectors',
  authors: ['OriDesign contributors'],
  redistribution: 'allowed' as const,
  licenseSpdx: 'MIT' as const,
});

function ledgerCases(): readonly NegTreeCaseLedgerRowV1[] {
  return NEG_TREE_CASE_SPECS_V1.map((caseSpec, caseIndex) => ({
    caseIndex,
    caseId: caseSpec.caseId,
    controlId: caseSpec.controlId,
    mutationKind: caseSpec.mutationKind,
    changedPaths: caseSpec.changedPaths,
    sourceArtifactId: caseSpec.sourceArtifactId,
    sourcePath: caseSpec.sourcePath,
    expectedOutcome: 'rejected' as const,
    expectedIssues: caseSpec.expectedIssues,
  }));
}

export type NegTreeCandidateBundleLedgerV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof NEG_TREE_CANDIDATE_BUNDLE_SCHEMA_ID;
  recordType: typeof NEG_TREE_CANDIDATE_BUNDLE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-TREE-V1';
  scope: typeof NEG_TREE_CANDIDATE_BUNDLE_SCOPE;
  canonicalManifestPath: typeof NEG_TREE_CANONICAL_MANIFEST_PATH;
  canonicalManifestRegistration: 'not-registered';
  canonicalPromotionClaimed: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  globalM0fGate: 'not-evaluated';
  caseCount: 12;
  artifactCount: 13;
  generator: typeof GENERATOR;
  provenance: typeof SOURCE_PROVENANCE;
  cases: readonly NegTreeCaseLedgerRowV1[];
  artifacts: readonly NegTreeArtifactLedgerEntryV1[];
}>;

export type NegTreeCandidateLedgerIssueV1 = Readonly<{
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

export type NegTreeCandidateLedgerParseResultV1 =
  | Readonly<{ ok: true; value: NegTreeCandidateBundleLedgerV1 }>
  | Readonly<{ ok: false; error: readonly NegTreeCandidateLedgerIssueV1[] }>;

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
  issues: NegTreeCandidateLedgerIssueV1[],
  path: string,
  code: NegTreeCandidateLedgerIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: NegTreeCandidateLedgerIssueV1[],
): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) addIssue(issues, `${path}.${key}`, 'unknown-field', 'is not declared');
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) {
      addIssue(issues, `${path}.${key}`, 'missing-field', 'is required');
    }
  }
}

function sameStableJson(left: unknown, right: unknown): boolean {
  try {
    return stableStringify(left) === stableStringify(right);
  } catch {
    return false;
  }
}

/** Parses the closed candidate ledger and rejects claim, row, path, or ordering rewrites. */
export function parseNegTreeCandidateBundleLedgerV1(
  supplied: unknown,
): NegTreeCandidateLedgerParseResultV1 {
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
  const issues: NegTreeCandidateLedgerIssueV1[] = [];
  exactKeys(value, ROOT_KEYS, '$', issues);
  const literals = [
    ['schemaVersion', 1],
    ['schemaId', NEG_TREE_CANDIDATE_BUNDLE_SCHEMA_ID],
    ['recordType', NEG_TREE_CANDIDATE_BUNDLE_RECORD_TYPE],
    ['contractStatus', 'candidate'],
    ['scientificClaim', false],
    ['vectorSetId', 'NEG-TREE-V1'],
    ['scope', NEG_TREE_CANDIDATE_BUNDLE_SCOPE],
    ['canonicalManifestPath', NEG_TREE_CANONICAL_MANIFEST_PATH],
    ['canonicalManifestRegistration', 'not-registered'],
    ['canonicalPromotionClaimed', false],
    ['toleranceProfileIncluded', false],
    ['scientificVerificationClaimed', false],
    ['globalM0fGate', 'not-evaluated'],
    ['caseCount', NEG_TREE_CASE_SPECS_V1.length],
    ['artifactCount', NEG_TREE_ARTIFACT_SPECS_V1.length],
  ] as const;
  for (const [key, expected] of literals) {
    if (value[key] !== expected) {
      addIssue(issues, `$.${key}`, 'invalid-literal', `must equal ${JSON.stringify(expected)}`);
    }
  }
  if (!sameStableJson(value.generator, GENERATOR)) {
    addIssue(issues, '$.generator', 'invalid-literal', 'must equal the fixed parser generator');
  }
  if (!sameStableJson(value.provenance, SOURCE_PROVENANCE)) {
    addIssue(issues, '$.provenance', 'invalid-literal', 'must equal project-authored provenance');
  }

  const expectedCases = ledgerCases();
  if (!Array.isArray(value.cases) || value.cases.length !== expectedCases.length) {
    addIssue(issues, '$.cases', 'invalid-array', 'must contain the twelve ordered negative cases');
  } else {
    for (const [index, expected] of expectedCases.entries()) {
      const actual: unknown = value.cases[index];
      if (!sameStableJson(actual, expected)) {
        addIssue(
          issues,
          `$.cases[${String(index)}]`,
          'invalid-case',
          'case identity, control delta, source path, or ordered expected issue list differs',
        );
      }
    }
  }

  if (
    !Array.isArray(value.artifacts) ||
    value.artifacts.length !== NEG_TREE_ARTIFACT_SPECS_V1.length
  ) {
    addIssue(issues, '$.artifacts', 'invalid-array', 'must contain thirteen artifact rows');
  } else {
    for (const [index, expected] of NEG_TREE_ARTIFACT_SPECS_V1.entries()) {
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
    value: value as unknown as NegTreeCandidateBundleLedgerV1,
  });
}

function issueSignature(issues: readonly OrderedTreeInputIssue[]): readonly ExpectedIssueV1[] {
  return issues.map(({ path, code }) => ({ path, code }));
}

function controlSource(controlId: ControlIdV1): NegTreeSourceDocumentV1 {
  return controlId === PRIMARY_CONTROL_ID
    ? NEG_TREE_VALID_CONTROL_SOURCE_V1
    : NEG_TREE_LEAF_BOUNDARY_CONTROL_SOURCE_V1;
}

function jsonDifferencePaths(left: unknown, right: unknown, path = '$'): string[] {
  if (Object.is(left, right)) return [];
  if (Array.isArray(left) && Array.isArray(right)) {
    const differences: string[] = [];
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
      const childPath = `${path}[${String(index)}]`;
      if (!Object.hasOwn(left, index) || !Object.hasOwn(right, index)) {
        differences.push(childPath);
      } else {
        differences.push(...jsonDifferencePaths(left[index], right[index], childPath));
      }
    }
    return differences;
  }
  if (isRecord(left) && isRecord(right)) {
    const differences: string[] = [];
    const keys = [
      ...Object.keys(left),
      ...Object.keys(right).filter((key) => !Object.hasOwn(left, key)),
    ];
    for (const key of keys) {
      const childPath = `${path}.${key}`;
      if (!Object.hasOwn(left, key) || !Object.hasOwn(right, key)) {
        differences.push(childPath);
      } else {
        differences.push(...jsonDifferencePaths(left[key], right[key], childPath));
      }
    }
    return differences;
  }
  return [path];
}

function jsonLine(value: unknown): string {
  return `${stableStringify(value)}\n`;
}

export type NegTreeCandidateBuiltFileV1 = Readonly<{
  artifactId: string | null;
  path: string;
  text: string;
}>;

export type NegTreeCandidateBuildV1 = Readonly<{
  ledger: NegTreeCandidateBundleLedgerV1;
  files: readonly NegTreeCandidateBuiltFileV1[];
}>;

/** Builds only after both controls and every complete parser issue/difference oracle replay. */
export function buildNegTreeCandidateBundleV1(): NegTreeCandidateBuildV1 {
  for (const [controlId, control] of [
    [PRIMARY_CONTROL_ID, NEG_TREE_VALID_CONTROL_SOURCE_V1],
    [LEAF_BOUNDARY_CONTROL_ID, NEG_TREE_LEAF_BOUNDARY_CONTROL_SOURCE_V1],
  ] as const) {
    if (!parseOrderedTreeInputV1(control).ok) {
      throw new TypeError(`accepted ordered-tree control no longer parses: ${controlId}`);
    }
  }

  const textByArtifactId = new Map<string, string>([
    ['bundle-readme', NEG_TREE_CANDIDATE_README_V1],
  ]);
  for (const caseSpec of NEG_TREE_CASE_SPECS_V1) {
    const differences = jsonDifferencePaths(
      controlSource(caseSpec.controlId),
      caseSpec.sourceDocument,
    );
    if (!sameStableJson(differences, caseSpec.changedPaths)) {
      throw new TypeError(`negative case control delta changed: ${caseSpec.caseId}`);
    }
    const result = parseOrderedTreeInputV1(caseSpec.sourceDocument);
    if (result.ok || !sameStableJson(issueSignature(result.error), caseSpec.expectedIssues)) {
      throw new TypeError(`negative case no longer matches parser: ${caseSpec.caseId}`);
    }
    textByArtifactId.set(caseSpec.sourceArtifactId, jsonLine(caseSpec.sourceDocument));
  }

  const artifacts = NEG_TREE_ARTIFACT_SPECS_V1.map((spec) => {
    const text = textByArtifactId.get(spec.artifactId);
    if (text === undefined) throw new TypeError(`missing negative artifact ${spec.artifactId}`);
    return { ...spec, sha256: sha256Prefixed(text) as `sha256:${string}` };
  });
  const ledger: NegTreeCandidateBundleLedgerV1 = {
    schemaVersion: 1,
    schemaId: NEG_TREE_CANDIDATE_BUNDLE_SCHEMA_ID,
    recordType: NEG_TREE_CANDIDATE_BUNDLE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    vectorSetId: 'NEG-TREE-V1',
    scope: NEG_TREE_CANDIDATE_BUNDLE_SCOPE,
    canonicalManifestPath: NEG_TREE_CANONICAL_MANIFEST_PATH,
    canonicalManifestRegistration: 'not-registered',
    canonicalPromotionClaimed: false,
    toleranceProfileIncluded: false,
    scientificVerificationClaimed: false,
    globalM0fGate: 'not-evaluated',
    caseCount: 12,
    artifactCount: 13,
    generator: GENERATOR,
    provenance: SOURCE_PROVENANCE,
    cases: ledgerCases(),
    artifacts,
  };
  const files: NegTreeCandidateBuiltFileV1[] = artifacts.map((artifact) => {
    const text = textByArtifactId.get(artifact.artifactId);
    if (text === undefined) throw new TypeError(`missing negative artifact ${artifact.artifactId}`);
    return { artifactId: artifact.artifactId, path: artifact.path, text };
  });
  files.push({
    artifactId: null,
    path: NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
    text: jsonLine(ledger),
  });
  return deepFreezeOwned({ ledger, files });
}

/** Writes the exact closed file set and refuses to clean unexpected entries. */
export async function writeNegTreeCandidateBundleV1(
  bundleDirectory: string = NEG_TREE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegTreeCandidateBuildV1> {
  const built = buildNegTreeCandidateBundleV1();
  const absoluteDirectory = resolve(bundleDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const expectedNames = new Set(built.files.map((file) => file.path));
  const existing = await readdir(absoluteDirectory, { withFileTypes: true });
  if (existing.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))) {
    throw new TypeError('negative tree candidate directory contains an unexpected entry');
  }
  await Promise.all(
    built.files.map((file) => writeFile(resolve(absoluteDirectory, file.path), file.text, 'utf8')),
  );
  return built;
}

export const NEG_TREE_CANDIDATE_REASON_CODES = [
  'ledger-unreadable',
  'ledger-invalid',
  'artifact-set-mismatch',
  'artifact-unreadable',
  'artifact-hash-mismatch',
  'canonical-manifest-unreadable',
  'canonical-manifest-registration-present',
  'control-unexpectedly-rejected',
  'source-invalid-json',
  'source-control-difference-mismatch',
  'source-unexpectedly-accepted',
  'parser-issue-mismatch',
  'deterministic-regeneration-mismatch',
  'unexpected-failure',
] as const;

export type NegTreeCandidateReasonCodeV1 = (typeof NEG_TREE_CANDIDATE_REASON_CODES)[number];

export type NegTreeCandidateVerificationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-neg-tree-candidate-bundle-verification-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-TREE-V1';
  scope: typeof NEG_TREE_CANDIDATE_BUNDLE_SCOPE;
  globalM0fGate: 'not-evaluated';
  canonicalPromotionClaimed: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  reproducibleExactNegativeBundle: boolean;
  reasonCodes: readonly NegTreeCandidateReasonCodeV1[];
  checks: Readonly<{
    ledgerPresentAndValid: boolean;
    artifactSetExact: boolean;
    allArtifactHashesMatch: boolean;
    allArtifactProvenanceFixed: boolean;
    canonicalManifestRegistrationAbsent: boolean;
    everyControlAccepted: boolean;
    sourceCaseCount: number;
    everySourceParsed: boolean;
    everySourceControlDifferenceMatched: boolean;
    everySourceRejected: boolean;
    everyOrderedIssueSignatureMatched: boolean;
    deterministicRegenerationMatched: boolean;
  }>;
}>;

interface MutableVerificationState {
  reasons: Set<NegTreeCandidateReasonCodeV1>;
  ledgerPresentAndValid: boolean;
  artifactSetExact: boolean;
  allArtifactHashesMatch: boolean;
  allArtifactProvenanceFixed: boolean;
  canonicalManifestRegistrationAbsent: boolean;
  everyControlAccepted: boolean;
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
    everyControlAccepted: false,
    sourceCaseCount: 0,
    everySourceParsed: false,
    everySourceControlDifferenceMatched: false,
    everySourceRejected: false,
    everyOrderedIssueSignatureMatched: false,
    deterministicRegenerationMatched: false,
  };
}

function resultFromState(state: MutableVerificationState): NegTreeCandidateVerificationResultV1 {
  const reasonCodes = NEG_TREE_CANDIDATE_REASON_CODES.filter((code) => state.reasons.has(code));
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: 'm0f-neg-tree-candidate-bundle-verification-result' as const,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    vectorSetId: 'NEG-TREE-V1' as const,
    scope: NEG_TREE_CANDIDATE_BUNDLE_SCOPE,
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
      everyControlAccepted: state.everyControlAccepted,
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
      JSON.parse(await readFile(resolve(NEG_TREE_CANONICAL_MANIFEST_PATH), 'utf8')) as unknown,
    );
    if (manifest.manifest === undefined) return undefined;
    return !manifest.manifest.fixtures.some((fixture) =>
      fixture.id.startsWith(NEG_TREE_CASE_ID_PREFIX),
    );
  } catch {
    return undefined;
  }
}

/** Replays only the saved sources through the existing ordered-tree parser. */
export async function verifyNegTreeCandidateBundleV1(
  bundleDirectory: string = NEG_TREE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegTreeCandidateVerificationResultV1> {
  const state = initialState();
  try {
    const absoluteDirectory = resolve(bundleDirectory);
    let ledgerDocument: unknown;
    try {
      ledgerDocument = JSON.parse(
        await readFile(
          resolve(absoluteDirectory, NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
          'utf8',
        ),
      ) as unknown;
    } catch {
      state.reasons.add('ledger-unreadable');
      return resultFromState(state);
    }
    const parsedLedger = parseNegTreeCandidateBundleLedgerV1(ledgerDocument);
    if (!parsedLedger.ok) {
      state.reasons.add('ledger-invalid');
      return resultFromState(state);
    }
    state.ledgerPresentAndValid = true;
    state.allArtifactProvenanceFixed = true;

    const expectedNames = new Set([
      NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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

    state.everyControlAccepted = [
      NEG_TREE_VALID_CONTROL_SOURCE_V1,
      NEG_TREE_LEAF_BOUNDARY_CONTROL_SOURCE_V1,
    ].every((control) => parseOrderedTreeInputV1(control).ok);
    if (!state.everyControlAccepted) state.reasons.add('control-unexpectedly-rejected');

    let everyParsed = true;
    let everyDifferenceMatched = true;
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
      const differences = jsonDifferencePaths(controlSource(caseRow.controlId), source);
      if (!sameStableJson(differences, caseRow.changedPaths)) {
        everyDifferenceMatched = false;
        state.reasons.add('source-control-difference-mismatch');
      }
      const parsed = parseOrderedTreeInputV1(source);
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
      everyParsed && state.sourceCaseCount === NEG_TREE_CASE_SPECS_V1.length;
    state.everySourceControlDifferenceMatched = state.everySourceParsed && everyDifferenceMatched;
    state.everySourceRejected = state.everySourceParsed && everyRejected;
    state.everyOrderedIssueSignatureMatched = state.everySourceRejected && everySignatureMatched;

    const regenerated = buildNegTreeCandidateBundleV1();
    const regeneratedByPath = new Map(regenerated.files.map((file) => [file.path, file.text]));
    const savedLedgerText = await readFile(
      resolve(absoluteDirectory, NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
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
