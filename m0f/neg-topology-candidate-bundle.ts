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

export const NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/neg-topology-candidate-bundle-ledger-v1.schema.json' as const;
export const NEG_TOPOLOGY_CANDIDATE_BUNDLE_RECORD_TYPE =
  'm0f-neg-topology-candidate-bundle-ledger' as const;
export const NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCOPE =
  'project-authored-exact-negative-artifact-contract-topology-parser-replay-only' as const;
export const NEG_TOPOLOGY_CANDIDATE_BUNDLE_GENERATOR_ID =
  'oridesign-neg-topology-candidate-bundle' as const;
export const NEG_TOPOLOGY_CANDIDATE_BUNDLE_GENERATOR_VERSION = '1.0.0-candidate' as const;
export const NEG_TOPOLOGY_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY =
  'tests/candidate-vectors/NEG-TOPOLOGY' as const;
export const NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME =
  'candidate-bundle-ledger.json' as const;
export const NEG_TOPOLOGY_CANONICAL_MANIFEST_PATH = 'tests/fixtures/manifest.json' as const;
export const NEG_TOPOLOGY_CASE_ID_PREFIX = 'NEG-TOPOLOGY-' as const;

const SOURCE_REFERENCE_ID = 'oridesign-neg-topology-candidates-v1' as const;
const PRIMARY_CONTROL_ARTIFACT_ID = 'control-primary-design' as const;
const ANNULUS_CONTROL_ARTIFACT_ID = 'control-filled-annulus-fold' as const;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

type Mutable<T> = T extends readonly (infer U)[]
  ? Mutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: Mutable<T[K]> }
    : T;
export type NegTopologySourceDocumentV1 = Mutable<ArtifactContractV1>;

function primaryControl(): NegTopologySourceDocumentV1 {
  return {
    schemaVersion: 1,
    schemaId: 'https://oridesign.local/schemas/m0f/artifact-contract-v1.schema.json',
    contractId: 'CONTRACT-DESIGN-TWO-LEAF-V1',
    conventionsId: 'oridesign-m0f-conventions-v1',
    contractStatus: 'candidate',
    scientificClaim: false,
    input: {
      kind: 'design-generation',
      method: 'treeMethod',
      paper: { width: 1, height: 1 },
      grid: null,
      tree: {
        nodes: [
          { id: 'n-left', x: 0.25, y: 0.5 },
          { id: 'n-center', x: 0.5, y: 0.5 },
          { id: 'n-right', x: 0.75, y: 0.5 },
        ],
        edges: [
          { id: 't-left', from: 'n-left', to: 'n-center', length: 1, width: 0 },
          { id: 't-right', from: 'n-center', to: 'n-right', length: 1, width: 0 },
        ],
        rotation: [
          { nodeId: 'n-left', edgeIds: ['t-left'] },
          { nodeId: 'n-center', edgeIds: ['t-left', 't-right'] },
          { nodeId: 'n-right', edgeIds: ['t-right'] },
        ],
      },
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
          sourceTreeEdgeIds: ['t-left', 't-right'],
          generationKey: 'tree:hinge',
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
      kind: 'uniaxial-tree-base',
      faceTransforms: [
        { faceId: 'f-left', quaternion: [0, 0, 0, 1], translation: [0, 0, 0] },
        { faceId: 'f-right', quaternion: [0, 0, 1, 0], translation: [1, 0, 0] },
      ],
      goalFaceOrders: [],
      overlapRegionIds: [],
      branchMeasurements: [
        {
          treeEdgeId: 't-left',
          axisEndpoints: [
            [0, 0],
            [0.5, 0],
          ],
          effectiveLength: 1,
          effectiveWidth: 0,
        },
        {
          treeEdgeId: 't-right',
          axisEndpoints: [
            [0.5, 0],
            [1, 0],
          ],
          effectiveLength: 1,
          effectiveWidth: 0,
        },
      ],
      rotation: [
        { nodeId: 'n-left', edgeIds: ['t-left'] },
        { nodeId: 'n-center', edgeIds: ['t-left', 't-right'] },
        { nodeId: 'n-right', edgeIds: ['t-right'] },
      ],
    },
    pathCandidate: {
      representationVersion: 1,
      representationStatus: 'candidate',
      segments: [
        {
          t0: 0,
          t1: 1,
          motion: {
            kind: 'piecewise-polynomial',
            degree: 1,
            coefficientsByCrease: [{ edgeId: 'e-hinge', coefficients: [[0, Math.PI]] }],
            derivativeBoundsByCrease: [{ edgeId: 'e-hinge', bounds: [0, Math.PI] }],
          },
        },
      ],
    },
    overlapRegions: [],
    contacts: [],
    layerEvents: [],
  };
}

function filledAnnulusControl(): NegTopologySourceDocumentV1 {
  const vertexIds = ['v-o0', 'v-o1', 'v-o2', 'v-o3', 'v-i0', 'v-i1', 'v-i2', 'v-i3'];
  const coordinates = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0.25, 0.25],
    [0.75, 0.25],
    [0.75, 0.75],
    [0.25, 0.75],
  ] as const;
  const edgeIndices = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
  ] as const;
  const edgeIds = [
    'e-outer-0',
    'e-outer-1',
    'e-outer-2',
    'e-outer-3',
    'e-spoke-0',
    'e-spoke-1',
    'e-spoke-2',
    'e-spoke-3',
    'e-inner-0',
    'e-inner-1',
    'e-inner-2',
    'e-inner-3',
  ];
  const faceIndices = [
    [0, 4, 5, 1],
    [1, 5, 6, 2],
    [2, 6, 7, 3],
    [3, 7, 4, 0],
    [4, 7, 6, 5],
  ];
  const faceIds = ['f-annular-0', 'f-annular-1', 'f-annular-2', 'f-annular-3', 'f-center'];
  return {
    schemaVersion: 1,
    schemaId: 'https://oridesign.local/schemas/m0f/artifact-contract-v1.schema.json',
    contractId: 'CONTRACT-FOLD-FILLED-ANNULUS-V1',
    conventionsId: 'oridesign-m0f-conventions-v1',
    contractStatus: 'candidate',
    scientificClaim: false,
    input: {
      kind: 'fold-verification',
      specVersion: '1.2',
      frameCount: 1,
      frameClasses: ['creasePattern'],
      verticesCoords: coordinates.map(([x, y]) => [x, y]),
      edgesVertices: edgeIndices.map(([first, second]) => [first, second]),
      edgesAssignment: edgeIndices.map((_, index) => (index < 4 ? 'B' : 'F')),
      facesVertices: faceIndices.map((ring) => [...ring]),
    },
    creaseMesh: {
      vertices: vertexIds.map((id, index) => {
        const coordinate = coordinates[index];
        if (coordinate === undefined) throw new TypeError('missing fixed annulus coordinate');
        return { id, x: coordinate[0], y: coordinate[1] };
      }),
      edges: edgeIds.map((id, index) => {
        const endpoints = edgeIndices[index];
        if (endpoints === undefined) throw new TypeError('missing fixed annulus endpoints');
        const boundary = index < 4;
        const first = vertexIds[endpoints[0]];
        const second = vertexIds[endpoints[1]];
        if (first === undefined || second === undefined)
          throw new TypeError('missing fixed annulus vertex');
        return {
          id,
          vertices: [first, second],
          assignment: boundary ? ('B' as const) : ('F' as const),
          role: boundary ? ('boundary' as const) : ('flat' as const),
          sourceTreeEdgeIds: [],
          generationKey: `fold:${id}`,
        };
      }),
      faces: faceIds.map((id, index) => {
        const ring = faceIndices[index];
        if (ring === undefined) throw new TypeError('missing fixed annulus face');
        return {
          id,
          vertices: ring.map((vertexIndex) => {
            const vertexId = vertexIds[vertexIndex];
            if (vertexId === undefined) throw new TypeError('missing fixed annulus face vertex');
            return vertexId;
          }),
        };
      }),
      meshJoinEdges: [],
    },
    target: {
      schemaVersion: 1,
      kind: 'flat-folded-cp',
      faceTransforms: faceIds.map((faceId) => ({
        faceId,
        quaternion: [0, 0, 0, 1],
        translation: [0, 0, 0],
      })),
      goalFaceOrders: [],
      overlapRegionIds: [],
      assignmentPolicy: 'respect-mv-solve-u',
      resolvedInteriorAssignments: edgeIds.slice(4).map((edgeId) => ({ edgeId, assignment: 'F' })),
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
            anglesByCrease: edgeIds.slice(4).map((edgeId) => ({ edgeId, angles: [0, 0] })),
            intervalAngleBoundsByCrease: edgeIds
              .slice(4)
              .map((edgeId) => ({ edgeId, bounds: [[0, 0]] })),
          },
        },
      ],
    },
    overlapRegions: [],
    contacts: [],
    layerEvents: [],
  };
}

export const NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1 = deepFreezeOwned(primaryControl());
export const NEG_TOPOLOGY_FILLED_ANNULUS_CONTROL_SOURCE_V1 =
  deepFreezeOwned(filledAnnulusControl());

type ExpectedIssueV1 = Readonly<{ path: string; code: ArtifactContractIssue['code'] }>;
type ControlArtifactIdV1 = typeof PRIMARY_CONTROL_ARTIFACT_ID | typeof ANNULUS_CONTROL_ARTIFACT_ID;
type NegativeCaseSpecV1 = Readonly<{
  caseId: `${typeof NEG_TOPOLOGY_CASE_ID_PREFIX}${string}`;
  controlArtifactId: ControlArtifactIdV1;
  mutationKind: string;
  changedPaths: readonly string[];
  sourceArtifactId: string;
  sourcePath: string;
  sourceDocument: NegTopologySourceDocumentV1;
  expectedIssues: readonly ExpectedIssueV1[];
}>;

function mutatePrimary(
  mutation: (source: NegTopologySourceDocumentV1) => void,
): NegTopologySourceDocumentV1 {
  const source = structuredClone(NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1);
  mutation(source);
  return source;
}

function mutateAnnulus(
  mutation: (source: NegTopologySourceDocumentV1) => void,
): NegTopologySourceDocumentV1 {
  const source = structuredClone(NEG_TOPOLOGY_FILLED_ANNULUS_CONTROL_SOURCE_V1);
  mutation(source);
  return source;
}

function requiredEntry<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new TypeError(`missing fixed source entry ${String(index)}`);
  return value;
}

function requireFoldInput(
  source: NegTopologySourceDocumentV1,
): Extract<NegTopologySourceDocumentV1['input'], { kind: 'fold-verification' }> {
  if (source.input.kind !== 'fold-verification') throw new TypeError('expected fixed FOLD control');
  return source.input;
}

function requireTreeTarget(
  source: NegTopologySourceDocumentV1,
): Extract<NegTopologySourceDocumentV1['target'], { kind: 'uniaxial-tree-base' }> {
  if (source.target.kind !== 'uniaxial-tree-base')
    throw new TypeError('expected fixed tree target');
  return source.target;
}

function requireFlatTarget(
  source: NegTopologySourceDocumentV1,
): Extract<NegTopologySourceDocumentV1['target'], { kind: 'flat-folded-cp' }> {
  if (source.target.kind !== 'flat-folded-cp') throw new TypeError('expected fixed FOLD target');
  return source.target;
}

export const NEG_TOPOLOGY_CASE_SPECS_V1 = deepFreezeOwned([
  {
    caseId: 'NEG-TOPOLOGY-UNSPLIT-CROSSING',
    controlArtifactId: PRIMARY_CONTROL_ARTIFACT_ID,
    mutationKind: 'append-unsplit-crossing-interior-edge',
    changedPaths: ['$.creaseMesh.edges[7]'],
    sourceArtifactId: 'source-unsplit-crossing',
    sourcePath: 'unsplit-crossing.json',
    sourceDocument: mutatePrimary((source) => {
      source.creaseMesh.edges.push({
        id: 'e-cross',
        vertices: ['v-tl', 'v-br'],
        assignment: 'V',
        role: 'flat',
        sourceTreeEdgeIds: ['t-left'],
        generationKey: 'tree:unsplit-crossing',
      });
    }),
    expectedIssues: [
      { path: '$.creaseMesh.edges[7]', code: 'interior-incidence' },
      { path: '$.creaseMesh', code: 'non-planar-intersection' },
      { path: '$.creaseMesh', code: 'euler-characteristic-mismatch' },
    ],
  },
  {
    caseId: 'NEG-TOPOLOGY-DUPLICATE-EDGE',
    controlArtifactId: PRIMARY_CONTROL_ARTIFACT_ID,
    mutationKind: 'append-duplicate-physical-edge-with-unique-identity',
    changedPaths: ['$.creaseMesh.edges[7]'],
    sourceArtifactId: 'source-duplicate-edge',
    sourcePath: 'duplicate-edge.json',
    sourceDocument: mutatePrimary((source) => {
      source.creaseMesh.edges.push({
        id: 'e-top-left-duplicate',
        vertices: ['v-tl', 'v-tm'],
        assignment: 'B',
        role: 'boundary',
        sourceTreeEdgeIds: [],
        generationKey: 'boundary:top-left:duplicate',
      });
    }),
    expectedIssues: [
      { path: '$.creaseMesh.edges[7].vertices', code: 'duplicate-edge' },
      { path: '$.creaseMesh', code: 'non-planar-intersection' },
    ],
  },
  {
    caseId: 'NEG-TOPOLOGY-ZERO-AREA-FACE',
    controlArtifactId: PRIMARY_CONTROL_ARTIFACT_ID,
    mutationKind: 'replace-left-face-ring-with-collinear-top-row',
    changedPaths: [
      '$.creaseMesh.faces[0].vertices[1]',
      '$.creaseMesh.faces[0].vertices[2]',
      '$.creaseMesh.faces[0].vertices[3]',
    ],
    sourceArtifactId: 'source-zero-area-face',
    sourcePath: 'zero-area-face.json',
    sourceDocument: mutatePrimary((source) => {
      requiredEntry(source.creaseMesh.faces, 0).vertices = ['v-tl', 'v-tm', 'v-tr'];
    }),
    expectedIssues: [
      { path: '$.creaseMesh.faces[0].vertices', code: 'degenerate-face' },
      { path: '$.creaseMesh.edges[1]', code: 'boundary-incidence' },
      { path: '$.creaseMesh.edges[4]', code: 'boundary-incidence' },
      { path: '$.creaseMesh.edges[5]', code: 'boundary-incidence' },
      { path: '$.creaseMesh.edges[6]', code: 'interior-incidence' },
      { path: '$.creaseMesh', code: 'missing-mesh-edge' },
    ],
  },
  {
    caseId: 'NEG-TOPOLOGY-HOLE',
    controlArtifactId: ANNULUS_CONTROL_ARTIFACT_ID,
    mutationKind: 'remove-center-face-and-reclassify-inner-boundary-coherently',
    changedPaths: [
      '$.creaseMesh.edges[8].assignment',
      '$.creaseMesh.edges[8].role',
      '$.creaseMesh.edges[9].assignment',
      '$.creaseMesh.edges[9].role',
      '$.creaseMesh.edges[10].assignment',
      '$.creaseMesh.edges[10].role',
      '$.creaseMesh.edges[11].assignment',
      '$.creaseMesh.edges[11].role',
      '$.creaseMesh.faces[4]',
      '$.input.edgesAssignment[8]',
      '$.input.edgesAssignment[9]',
      '$.input.edgesAssignment[10]',
      '$.input.edgesAssignment[11]',
      '$.input.facesVertices[4]',
      '$.pathCandidate.segments[0].motion.anglesByCrease[4]',
      '$.pathCandidate.segments[0].motion.anglesByCrease[5]',
      '$.pathCandidate.segments[0].motion.anglesByCrease[6]',
      '$.pathCandidate.segments[0].motion.anglesByCrease[7]',
      '$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[4]',
      '$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[5]',
      '$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[6]',
      '$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[7]',
      '$.target.faceTransforms[4]',
      '$.target.resolvedInteriorAssignments[4]',
      '$.target.resolvedInteriorAssignments[5]',
      '$.target.resolvedInteriorAssignments[6]',
      '$.target.resolvedInteriorAssignments[7]',
    ],
    sourceArtifactId: 'source-hole',
    sourcePath: 'hole.json',
    sourceDocument: mutateAnnulus((source) => {
      const input = requireFoldInput(source);
      for (let index = 8; index < 12; index += 1) input.edgesAssignment[index] = 'B';
      input.facesVertices?.pop();
      for (let index = 8; index < 12; index += 1) {
        const edge = requiredEntry(source.creaseMesh.edges, index);
        edge.assignment = 'B';
        edge.role = 'boundary';
      }
      source.creaseMesh.faces.pop();
      const target = requireFlatTarget(source);
      target.faceTransforms.pop();
      target.resolvedInteriorAssignments.splice(4);
      const motion = requiredEntry(source.pathCandidate.segments, 0).motion;
      if (motion.kind !== 'bounded-interpolation')
        throw new TypeError('expected fixed bounded path');
      motion.anglesByCrease.splice(4);
      motion.intervalAngleBoundsByCrease.splice(4);
    }),
    expectedIssues: [{ path: '$.creaseMesh', code: 'euler-characteristic-mismatch' }],
  },
  {
    caseId: 'NEG-TOPOLOGY-NON-MANIFOLD-EDGE',
    controlArtifactId: PRIMARY_CONTROL_ARTIFACT_ID,
    mutationKind: 'append-duplicate-right-face-and-target-transform',
    changedPaths: ['$.creaseMesh.faces[2]', '$.target.faceTransforms[2]'],
    sourceArtifactId: 'source-non-manifold-edge',
    sourcePath: 'non-manifold-edge.json',
    sourceDocument: mutatePrimary((source) => {
      source.creaseMesh.faces.push({ id: 'f-third', vertices: ['v-tm', 'v-bm', 'v-br', 'v-tr'] });
      requireTreeTarget(source).faceTransforms.push({
        faceId: 'f-third',
        quaternion: [0, 0, 0, 1],
        translation: [0, 0, 0],
      });
    }),
    expectedIssues: [
      { path: '$.creaseMesh.edges[1]', code: 'boundary-incidence' },
      { path: '$.creaseMesh.edges[2]', code: 'boundary-incidence' },
      { path: '$.creaseMesh.edges[3]', code: 'boundary-incidence' },
      { path: '$.creaseMesh.edges[6]', code: 'interior-incidence' },
      { path: '$.creaseMesh.faces', code: 'non-manifold-edge' },
      { path: '$.creaseMesh', code: 'euler-characteristic-mismatch' },
    ],
  },
] as const satisfies readonly NegativeCaseSpecV1[]);

export const NEG_TOPOLOGY_CANDIDATE_README_V1 = `# NEG-TOPOLOGY exact-negative candidate vectors

This closed directory contains project-authored controls and exact-negative sources for the current \`parseArtifactContractV1\` topology checks only. Both saved controls must freshly parse before generation or verification succeeds. Every negative source is hash-bound to, and names, its saved accepted control.

The bundle is intentionally outside \`tests/fixtures/manifest.json\`; no \`NEG-TOPOLOGY-*\` case is canonically registered or promoted. It defines no SupportProfile or ToleranceProfile, makes no scientific verification claim, and does not evaluate M0F GO.

Exact-negative means only that the current artifact-contract parser rejects the saved bytes with the complete ordered issue code/path sequence recorded in the ledger. This is parser regression evidence. It does not prove planarization or reconstruction, general hole recognition, manifold completeness, crease-pattern validity or constructibility, MV validity, foldability, collision freedom, or any scientific topology theorem.

The filled-annulus FOLD control is a connected V8/E12/F5 disk: four annular quadrilaterals plus a center face. Its hole mutation removes the center coherently and isolates the parser's current disk Euler check; that single vector is not a general hole-support claim.

Verify with \`npx tsx m0f/neg-topology-candidate-bundle-cli.ts --verify\`. Regenerate with \`npx tsx m0f/neg-topology-candidate-bundle-cli.ts --write\`.
`;

export type NegTopologyArtifactProvenanceV1 = Readonly<{
  sourceReferenceId: typeof SOURCE_REFERENCE_ID;
  sourceUse: 'project-authored';
  derivation: 'authored' | 'mutated-from-control';
  dependsOnArtifactIds: readonly ControlArtifactIdV1[];
}>;

export type NegTopologyArtifactLedgerEntryV1 = Readonly<{
  artifactId: string;
  role: 'readme' | 'accepted-control' | 'negative-source';
  path: string;
  mediaType: 'text/markdown; charset=utf-8' | 'application/json';
  sha256: `sha256:${string}`;
  licenseSpdx: 'MIT';
  provenance: NegTopologyArtifactProvenanceV1;
}>;

type ArtifactSpecV1 = Omit<NegTopologyArtifactLedgerEntryV1, 'sha256'>;

function artifactProvenance(
  dependsOnArtifactIds: readonly ControlArtifactIdV1[],
): NegTopologyArtifactProvenanceV1 {
  return {
    sourceReferenceId: SOURCE_REFERENCE_ID,
    sourceUse: 'project-authored',
    derivation: dependsOnArtifactIds.length === 0 ? 'authored' : 'mutated-from-control',
    dependsOnArtifactIds,
  };
}

export const NEG_TOPOLOGY_ARTIFACT_SPECS_V1 = deepFreezeOwned([
  {
    artifactId: 'bundle-readme',
    role: 'readme',
    path: 'README.md',
    mediaType: 'text/markdown; charset=utf-8',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([]),
  },
  {
    artifactId: PRIMARY_CONTROL_ARTIFACT_ID,
    role: 'accepted-control',
    path: 'control-primary-design.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([]),
  },
  {
    artifactId: ANNULUS_CONTROL_ARTIFACT_ID,
    role: 'accepted-control',
    path: 'control-filled-annulus-fold.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([]),
  },
  ...NEG_TOPOLOGY_CASE_SPECS_V1.map((caseSpec) => ({
    artifactId: caseSpec.sourceArtifactId,
    role: 'negative-source' as const,
    path: caseSpec.sourcePath,
    mediaType: 'application/json' as const,
    licenseSpdx: 'MIT' as const,
    provenance: artifactProvenance([caseSpec.controlArtifactId]),
  })),
] satisfies readonly ArtifactSpecV1[]);

export type NegTopologyCaseLedgerRowV1 = Readonly<{
  caseIndex: number;
  caseId: NegativeCaseSpecV1['caseId'];
  controlArtifactId: ControlArtifactIdV1;
  mutationKind: string;
  changedPaths: readonly string[];
  sourceArtifactId: string;
  sourcePath: string;
  expectedOutcome: 'rejected';
  expectedIssues: readonly ExpectedIssueV1[];
}>;

const GENERATOR = deepFreezeOwned({
  generatorId: NEG_TOPOLOGY_CANDIDATE_BUNDLE_GENERATOR_ID,
  generatorVersion: NEG_TOPOLOGY_CANDIDATE_BUNDLE_GENERATOR_VERSION,
  serialization: 'stable-json-utf8-lf-v1' as const,
  detector: 'parseArtifactContractV1' as const,
  detectorSourcePath: 'm0f/artifacts/contract.ts' as const,
});

const SOURCE_PROVENANCE = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceKind: 'project-authored' as const,
  title: 'NEG-TOPOLOGY project-authored artifact-contract topology parser vectors',
  authors: ['OriDesign contributors'],
  redistribution: 'allowed' as const,
  licenseSpdx: 'MIT' as const,
});

function ledgerCases(): readonly NegTopologyCaseLedgerRowV1[] {
  return NEG_TOPOLOGY_CASE_SPECS_V1.map((caseSpec, caseIndex) => ({
    caseIndex,
    caseId: caseSpec.caseId,
    controlArtifactId: caseSpec.controlArtifactId,
    mutationKind: caseSpec.mutationKind,
    changedPaths: caseSpec.changedPaths,
    sourceArtifactId: caseSpec.sourceArtifactId,
    sourcePath: caseSpec.sourcePath,
    expectedOutcome: 'rejected' as const,
    expectedIssues: caseSpec.expectedIssues,
  }));
}

export type NegTopologyCandidateBundleLedgerV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCHEMA_ID;
  recordType: typeof NEG_TOPOLOGY_CANDIDATE_BUNDLE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-TOPOLOGY-V1';
  scope: typeof NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCOPE;
  canonicalManifestPath: typeof NEG_TOPOLOGY_CANONICAL_MANIFEST_PATH;
  canonicalManifestRegistration: 'not-registered';
  canonicalPromotionClaimed: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  globalM0fGate: 'not-evaluated';
  caseCount: 5;
  artifactCount: 8;
  generator: typeof GENERATOR;
  provenance: typeof SOURCE_PROVENANCE;
  cases: readonly NegTopologyCaseLedgerRowV1[];
  artifacts: readonly NegTopologyArtifactLedgerEntryV1[];
}>;

export type NegTopologyCandidateLedgerIssueV1 = Readonly<{
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

export type NegTopologyCandidateLedgerParseResultV1 =
  | Readonly<{ ok: true; value: NegTopologyCandidateBundleLedgerV1 }>
  | Readonly<{ ok: false; error: readonly NegTopologyCandidateLedgerIssueV1[] }>;

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
  issues: NegTopologyCandidateLedgerIssueV1[],
  path: string,
  code: NegTopologyCandidateLedgerIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: NegTopologyCandidateLedgerIssueV1[],
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

/** Parses a closed ledger and independently fixes every identity, delta, oracle, and artifact row. */
export function parseNegTopologyCandidateBundleLedgerV1(
  supplied: unknown,
): NegTopologyCandidateLedgerParseResultV1 {
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
  const issues: NegTopologyCandidateLedgerIssueV1[] = [];
  exactKeys(value, ROOT_KEYS, '$', issues);
  const literals = [
    ['schemaVersion', 1],
    ['schemaId', NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCHEMA_ID],
    ['recordType', NEG_TOPOLOGY_CANDIDATE_BUNDLE_RECORD_TYPE],
    ['contractStatus', 'candidate'],
    ['scientificClaim', false],
    ['vectorSetId', 'NEG-TOPOLOGY-V1'],
    ['scope', NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCOPE],
    ['canonicalManifestPath', NEG_TOPOLOGY_CANONICAL_MANIFEST_PATH],
    ['canonicalManifestRegistration', 'not-registered'],
    ['canonicalPromotionClaimed', false],
    ['supportProfileIncluded', false],
    ['toleranceProfileIncluded', false],
    ['scientificVerificationClaimed', false],
    ['globalM0fGate', 'not-evaluated'],
    ['caseCount', NEG_TOPOLOGY_CASE_SPECS_V1.length],
    ['artifactCount', NEG_TOPOLOGY_ARTIFACT_SPECS_V1.length],
  ] as const;
  for (const [key, expected] of literals) {
    if (value[key] !== expected)
      addLedgerIssue(
        issues,
        `$.${key}`,
        'invalid-literal',
        `must equal ${JSON.stringify(expected)}`,
      );
  }
  if (!sameStableJson(value.generator, GENERATOR))
    addLedgerIssue(
      issues,
      '$.generator',
      'invalid-literal',
      'must equal the fixed artifact-contract detector',
    );
  if (!sameStableJson(value.provenance, SOURCE_PROVENANCE))
    addLedgerIssue(
      issues,
      '$.provenance',
      'invalid-literal',
      'must equal fixed project-authored provenance',
    );

  const expectedCases = ledgerCases();
  if (!Array.isArray(value.cases) || value.cases.length !== expectedCases.length) {
    addLedgerIssue(issues, '$.cases', 'invalid-array', 'must contain five ordered negative cases');
  } else {
    for (const [index, expected] of expectedCases.entries()) {
      if (!sameStableJson(value.cases[index], expected))
        addLedgerIssue(
          issues,
          `$.cases[${String(index)}]`,
          'invalid-case',
          'case identity, control link, delta, source path, or complete ordered issue oracle differs',
        );
    }
  }

  if (
    !Array.isArray(value.artifacts) ||
    value.artifacts.length !== NEG_TOPOLOGY_ARTIFACT_SPECS_V1.length
  ) {
    addLedgerIssue(
      issues,
      '$.artifacts',
      'invalid-array',
      'must contain eight ordered payload artifact rows',
    );
  } else {
    for (const [index, expected] of NEG_TOPOLOGY_ARTIFACT_SPECS_V1.entries()) {
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
      if (!sameStableJson(withoutHash, expected))
        addLedgerIssue(
          issues,
          path,
          'invalid-artifact',
          'artifact identity, control dependency, path, role, or license differs',
        );
      if (typeof sha256 !== 'string' || !SHA256_PATTERN.test(sha256))
        addLedgerIssue(
          issues,
          `${path}.sha256`,
          'invalid-hash',
          'must be a lowercase SHA-256 value',
        );
    }
  }
  if (issues.length > 0) return deepFreezeOwned({ ok: false as const, error: issues });
  return deepFreezeOwned({
    ok: true as const,
    value: value as unknown as NegTopologyCandidateBundleLedgerV1,
  });
}

function issueSignature(issues: readonly ArtifactContractIssue[]): readonly ExpectedIssueV1[] {
  return issues.map(({ path, code }) => ({ path, code }));
}

function fixedControlSource(controlArtifactId: ControlArtifactIdV1): NegTopologySourceDocumentV1 {
  return controlArtifactId === PRIMARY_CONTROL_ARTIFACT_ID
    ? NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1
    : NEG_TOPOLOGY_FILLED_ANNULUS_CONTROL_SOURCE_V1;
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

export type NegTopologyCandidateBuiltFileV1 = Readonly<{
  artifactId: string | null;
  path: string;
  text: string;
}>;
export type NegTopologyCandidateBuildV1 = Readonly<{
  ledger: NegTopologyCandidateBundleLedgerV1;
  files: readonly NegTopologyCandidateBuiltFileV1[];
}>;

/** Builds only after both controls and all complete difference/parser oracles replay. */
export function buildNegTopologyCandidateBundleV1(): NegTopologyCandidateBuildV1 {
  for (const [controlArtifactId, control] of [
    [PRIMARY_CONTROL_ARTIFACT_ID, NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1],
    [ANNULUS_CONTROL_ARTIFACT_ID, NEG_TOPOLOGY_FILLED_ANNULUS_CONTROL_SOURCE_V1],
  ] as const) {
    if (!parseArtifactContractV1(control).ok)
      throw new TypeError(
        `accepted artifact-contract control no longer parses: ${controlArtifactId}`,
      );
  }
  const textByArtifactId = new Map<string, string>([
    ['bundle-readme', NEG_TOPOLOGY_CANDIDATE_README_V1],
    [PRIMARY_CONTROL_ARTIFACT_ID, jsonLine(NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1)],
    [ANNULUS_CONTROL_ARTIFACT_ID, jsonLine(NEG_TOPOLOGY_FILLED_ANNULUS_CONTROL_SOURCE_V1)],
  ]);
  for (const caseSpec of NEG_TOPOLOGY_CASE_SPECS_V1) {
    const differences = jsonDifferencePaths(
      fixedControlSource(caseSpec.controlArtifactId),
      caseSpec.sourceDocument,
    );
    if (!sameStableJson(differences, caseSpec.changedPaths))
      throw new TypeError(`negative topology control delta changed: ${caseSpec.caseId}`);
    const result = parseArtifactContractV1(caseSpec.sourceDocument);
    if (result.ok || !sameStableJson(issueSignature(result.error), caseSpec.expectedIssues))
      throw new TypeError(`negative topology parser oracle changed: ${caseSpec.caseId}`);
    textByArtifactId.set(caseSpec.sourceArtifactId, jsonLine(caseSpec.sourceDocument));
  }
  const artifacts = NEG_TOPOLOGY_ARTIFACT_SPECS_V1.map((spec) => {
    const text = textByArtifactId.get(spec.artifactId);
    if (text === undefined) throw new TypeError(`missing topology artifact ${spec.artifactId}`);
    return { ...spec, sha256: sha256Prefixed(text) as `sha256:${string}` };
  });
  const ledger: NegTopologyCandidateBundleLedgerV1 = {
    schemaVersion: 1,
    schemaId: NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCHEMA_ID,
    recordType: NEG_TOPOLOGY_CANDIDATE_BUNDLE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    vectorSetId: 'NEG-TOPOLOGY-V1',
    scope: NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCOPE,
    canonicalManifestPath: NEG_TOPOLOGY_CANONICAL_MANIFEST_PATH,
    canonicalManifestRegistration: 'not-registered',
    canonicalPromotionClaimed: false,
    supportProfileIncluded: false,
    toleranceProfileIncluded: false,
    scientificVerificationClaimed: false,
    globalM0fGate: 'not-evaluated',
    caseCount: 5,
    artifactCount: 8,
    generator: GENERATOR,
    provenance: SOURCE_PROVENANCE,
    cases: ledgerCases(),
    artifacts,
  };
  const files: NegTopologyCandidateBuiltFileV1[] = artifacts.map((artifact) => {
    const text = textByArtifactId.get(artifact.artifactId);
    if (text === undefined) throw new TypeError(`missing topology artifact ${artifact.artifactId}`);
    return { artifactId: artifact.artifactId, path: artifact.path, text };
  });
  files.push({
    artifactId: null,
    path: NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME,
    text: jsonLine(ledger),
  });
  return deepFreezeOwned({ ledger, files });
}

/** Writes exactly nine files and refuses to remove or follow unexpected entries. */
export async function writeNegTopologyCandidateBundleV1(
  bundleDirectory: string = NEG_TOPOLOGY_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegTopologyCandidateBuildV1> {
  const built = buildNegTopologyCandidateBundleV1();
  const absoluteDirectory = resolve(bundleDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const expectedNames = new Set(built.files.map((file) => file.path));
  const existing = await readdir(absoluteDirectory, { withFileTypes: true });
  if (existing.some((entry) => !entry.isFile() || !expectedNames.has(entry.name)))
    throw new TypeError('negative topology candidate directory contains an unexpected entry');
  await Promise.all(
    built.files.map((file) => writeFile(resolve(absoluteDirectory, file.path), file.text, 'utf8')),
  );
  return built;
}

export const NEG_TOPOLOGY_CANDIDATE_REASON_CODES = [
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

export type NegTopologyCandidateReasonCodeV1 = (typeof NEG_TOPOLOGY_CANDIDATE_REASON_CODES)[number];

export type NegTopologyCandidateVerificationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-neg-topology-candidate-bundle-verification-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-TOPOLOGY-V1';
  scope: typeof NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCOPE;
  globalM0fGate: 'not-evaluated';
  canonicalPromotionClaimed: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  reproducibleExactNegativeBundle: boolean;
  reasonCodes: readonly NegTopologyCandidateReasonCodeV1[];
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
  reasons: Set<NegTopologyCandidateReasonCodeV1>;
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
): NegTopologyCandidateVerificationResultV1 {
  const reasonCodes = NEG_TOPOLOGY_CANDIDATE_REASON_CODES.filter((code) => state.reasons.has(code));
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: 'm0f-neg-topology-candidate-bundle-verification-result' as const,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    vectorSetId: 'NEG-TOPOLOGY-V1' as const,
    scope: NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCOPE,
    globalM0fGate: 'not-evaluated' as const,
    canonicalPromotionClaimed: false as const,
    supportProfileIncluded: false as const,
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

async function canonicalCasesAreAbsent(): Promise<boolean | undefined> {
  try {
    const manifest = parseFixtureManifest(
      JSON.parse(await readFile(resolve(NEG_TOPOLOGY_CANONICAL_MANIFEST_PATH), 'utf8')) as unknown,
    );
    if (manifest.manifest === undefined) return undefined;
    return !manifest.manifest.fixtures.some((fixture) =>
      fixture.id.startsWith(NEG_TOPOLOGY_CASE_ID_PREFIX),
    );
  } catch {
    return undefined;
  }
}

/** Replays saved controls and sources only through the current artifact-contract parser boundary. */
export async function verifyNegTopologyCandidateBundleV1(
  bundleDirectory: string = NEG_TOPOLOGY_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegTopologyCandidateVerificationResultV1> {
  const state = initialState();
  try {
    const absoluteDirectory = resolve(bundleDirectory);
    let ledgerText: string;
    let ledgerDocument: unknown;
    try {
      ledgerText = await readFile(
        resolve(absoluteDirectory, NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME),
        'utf8',
      );
      ledgerDocument = JSON.parse(ledgerText) as unknown;
    } catch {
      state.reasons.add('ledger-unreadable');
      return resultFromState(state);
    }
    const parsedLedger = parseNegTopologyCandidateBundleLedgerV1(ledgerDocument);
    if (!parsedLedger.ok) {
      state.reasons.add('ledger-invalid');
      return resultFromState(state);
    }
    state.ledgerPresentAndValid = true;
    state.allArtifactProvenanceFixed = true;

    const expectedNames = new Set([
      NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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
      [NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME, ledgerText],
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

    const savedControls = new Map<ControlArtifactIdV1, unknown>();
    let controlsParsed = true;
    let controlsAccepted = true;
    for (const controlArtifactId of [
      PRIMARY_CONTROL_ARTIFACT_ID,
      ANNULUS_CONTROL_ARTIFACT_ID,
    ] as const) {
      const control = parseJsonText(textByArtifactId.get(controlArtifactId) ?? '');
      if (control === undefined) {
        controlsParsed = false;
        controlsAccepted = false;
        state.reasons.add('control-invalid-json');
        continue;
      }
      state.controlArtifactCount += 1;
      savedControls.set(controlArtifactId, control);
      if (!parseArtifactContractV1(control).ok) {
        controlsAccepted = false;
        state.reasons.add('control-unexpectedly-rejected');
      }
    }
    state.everyControlArtifactParsed = controlsParsed && state.controlArtifactCount === 2;
    state.everySavedControlAccepted = state.everyControlArtifactParsed && controlsAccepted;

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
      const control = savedControls.get(caseRow.controlArtifactId);
      if (
        control === undefined ||
        !sameStableJson(jsonDifferencePaths(control, source), caseRow.changedPaths)
      ) {
        everyDifferenceMatched = false;
        state.reasons.add('source-control-difference-mismatch');
      }
      const parsed = parseArtifactContractV1(source);
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
      everyParsed && state.sourceCaseCount === NEG_TOPOLOGY_CASE_SPECS_V1.length;
    state.everySourceControlDifferenceMatched = state.everySourceParsed && everyDifferenceMatched;
    state.everySourceRejected = state.everySourceParsed && everyRejected;
    state.everyOrderedIssueSignatureMatched = state.everySourceRejected && everySignatureMatched;

    const regenerated = buildNegTopologyCandidateBundleV1();
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
