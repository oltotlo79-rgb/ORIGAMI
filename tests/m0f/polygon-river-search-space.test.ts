import { describe, expect, it } from 'vitest';

import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
import { enumerateOrderedTreeSquareGridCandidatesV1 } from '../../m0f/box-pleating/ordered-tree-square-grid-candidates.js';
import {
  buildPolygonRiverSearchSpaceAuditV1,
  POLYGON_RIVER_SEARCH_SPACE_INPUT_RECORD_TYPE,
  POLYGON_RIVER_SEARCH_SPACE_LIMITS,
  POLYGON_RIVER_SEARCH_SPACE_RESULT_RECORD_TYPE,
} from '../../m0f/box-pleating/polygon-river-search-space.js';
import { DEFAULT_ORDERED_TREE_INPUT } from '../../m0f/ordered-tree-cli.js';

interface MutableEdge {
  id: string;
  from: string;
  to: string;
  length: number;
  width: number;
  label: string;
  mirrorOf: string | null;
}

interface MutableTree {
  schemaVersion: number;
  recordType: string;
  contractStatus: string;
  scientificClaim: boolean;
  nodes: {
    id: string;
    pos: { x: number; y: number };
    label: string;
    mirrorOf: string | null;
    onSymmetryAxis: boolean;
  }[];
  edges: MutableEdge[];
  rotation: { nodeId: string; edgeIds: string[] }[];
}

type JsonRecord = Record<string, unknown>;

function defaultSource(): JsonRecord {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: structuredClone(DEFAULT_ORDERED_TREE_INPUT),
    paper: { width: 1.5, height: 1 },
    maxColumns: 12,
    maxRows: 12,
    relativeErrorLimit: 0.01,
  };
}

function firstCandidateId(source: JsonRecord): string {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('test source must enumerate');
  const candidate = enumerated.value.quantization.candidates[0];
  if (candidate === undefined) throw new Error('test source must contain a candidate');
  return candidate.candidateId;
}

function candidateIdWhere(
  source: JsonRecord,
  predicate: (candidate: Readonly<{ columns: number; rows: number }>) => boolean,
): string {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('test source must enumerate');
  const candidate = enumerated.value.quantization.candidates.find(predicate);
  if (candidate === undefined) throw new Error('required test candidate is missing');
  return candidate.candidateId;
}

function searchInput(
  source: JsonRecord = defaultSource(),
  candidateId: string = firstCandidateId(source),
): JsonRecord {
  return {
    schemaVersion: 1,
    recordType: POLYGON_RIVER_SEARCH_SPACE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    source,
    candidateId,
  };
}

function maximalCaterpillarTree(): MutableTree {
  const nodes: MutableTree['nodes'] = [];
  const edges: MutableEdge[] = [];
  const rotation: MutableTree['rotation'] = [];
  for (let index = 0; index < 20; index += 1) {
    const suffix = String(index).padStart(2, '0');
    const spineNodeId = `spine-${suffix}`;
    const leafNodeId = `leaf-${suffix}`;
    const leafEdgeId = `leaf-edge-${suffix}`;
    nodes.push(
      {
        id: spineNodeId,
        pos: { x: index, y: 0 },
        label: suffix,
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: leafNodeId,
        pos: { x: index, y: 1 },
        label: suffix,
        mirrorOf: null,
        onSymmetryAxis: false,
      },
    );
    edges.push({
      id: leafEdgeId,
      from: spineNodeId,
      to: leafNodeId,
      length: 1,
      width: 0.125,
      label: suffix,
      mirrorOf: null,
    });
    const incident: string[] = [];
    if (index > 0) incident.push(`spine-edge-${String(index - 1).padStart(2, '0')}`);
    incident.push(leafEdgeId);
    if (index < 19) incident.push(`spine-edge-${suffix}`);
    rotation.push(
      { nodeId: leafNodeId, edgeIds: [leafEdgeId] },
      { nodeId: spineNodeId, edgeIds: incident },
    );
    if (index < 19) {
      edges.push({
        id: `spine-edge-${suffix}`,
        from: spineNodeId,
        to: `spine-${String(index + 1).padStart(2, '0')}`,
        length: 1,
        width: 0.25,
        label: suffix,
        mirrorOf: null,
      });
    }
  }
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes,
    edges,
    rotation,
  };
}

function maximalCaterpillarSource(maximum = 8): JsonRecord {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: maximalCaterpillarTree(),
    paper: { width: 1, height: 1 },
    maxColumns: maximum,
    maxRows: maximum,
    relativeErrorLimit: 0,
  };
}

function emptyCandidateSource(): JsonRecord {
  const source = defaultSource();
  const tree = source.orderedTree as MutableTree;
  for (const edge of tree.edges) {
    edge.length = 0.3;
    edge.width = 0;
  }
  source.paper = { width: 1, height: 1 };
  source.maxColumns = 1;
  source.maxRows = 1;
  source.relativeErrorLimit = 0;
  return source;
}

function candidateWithResidual(source: JsonRecord): string {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('residual source must enumerate');
  const candidate = enumerated.value.quantization.candidates.find(
    (entry) =>
      entry.residualStrips.xAxis.numerator !== '0' || entry.residualStrips.yAxis.numerator !== '0',
  );
  if (candidate === undefined) throw new Error('residual candidate must exist');
  return candidate.candidateId;
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

function expectFailure(raw: unknown, stage: string, code: string, path?: string): void {
  const result = buildPolygonRiverSearchSpaceAuditV1(raw);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected ${stage}/${code}`);
  expect(
    result.error.some(
      (issue) =>
        issue.stage === stage &&
        issue.code === code &&
        (path === undefined || issue.path.startsWith(path)),
    ),
  ).toBe(true);
  expect(result).not.toHaveProperty('value');
  expect(allFrozen(result)).toBe(true);
}

describe('M0F polygon/river exact finite raw search-space audit', () => {
  it('computes the metric-independent raw Cartesian domain with BigInt decimals', () => {
    const result = buildPolygonRiverSearchSpaceAuditV1(searchInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('default source must produce a search-space audit');

    expect(result.value.activeGridDomain).toEqual({ columns: 12, rows: 8 });
    expect(result.value.gridVertexDomainCardinality).toBe('117');
    expect(result.value.leafCount).toBe(2);
    expect(result.value.rawCartesianAssignmentCount).toBe('13689');
    expect(result.value.perLeafDomains).toEqual([
      {
        leafNodeId: 'node-a',
        x: {
          representation: 'compact-inclusive-integer-range',
          minimum: 0,
          maximum: 12,
          step: 1,
        },
        y: {
          representation: 'compact-inclusive-integer-range',
          minimum: 0,
          maximum: 8,
          step: 1,
        },
        gridVertexDomainCardinality: '117',
      },
      {
        leafNodeId: 'node-d',
        x: {
          representation: 'compact-inclusive-integer-range',
          minimum: 0,
          maximum: 12,
          step: 1,
        },
        y: {
          representation: 'compact-inclusive-integer-range',
          minimum: 0,
          maximum: 8,
          step: 1,
        },
        gridVertexDomainCardinality: '117',
      },
    ]);
    expect(result.value.perLeafDomains.map((entry) => entry.leafNodeId)).toEqual([
      'node-a',
      'node-d',
    ]);
    expect(result.value.packingProblemReference.activeGridDomain).toEqual(
      result.value.activeGridDomain,
    );
    expect(result.value.packingProblemReference.candidateReference.candidateId).toBe(
      searchInput().candidateId,
    );
  });

  it('retains the full rectangular candidate and both exact residual axes', () => {
    const source = defaultSource();
    source.relativeErrorLimit = 1;
    const candidateId = candidateWithResidual(source);
    const result = buildPolygonRiverSearchSpaceAuditV1(searchInput(source, candidateId));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('rectangular residual candidate must audit');

    const packing = result.value.packingProblemReference;
    expect(packing.candidateReference.candidateId).toBe(candidateId);
    expect(packing.candidateResidualStrips).toEqual(packing.candidateReference.residualStrips);
    expect(
      packing.candidateResidualStrips.xAxis.numerator !== '0' ||
        packing.candidateResidualStrips.yAxis.numerator !== '0',
    ).toBe(true);
    expect(result.value.gridVertexDomainCardinality).toBe(
      (
        (BigInt(result.value.activeGridDomain.columns) + 1n) *
        (BigInt(result.value.activeGridDomain.rows) + 1n)
      ).toString(),
    );
  });

  it('computes the exact 512 by 512, 20-leaf power without Number conversion', () => {
    const source = maximalCaterpillarSource(512);
    const candidateId = candidateIdWhere(
      source,
      (candidate) => candidate.columns === 512 && candidate.rows === 512,
    );
    const result = buildPolygonRiverSearchSpaceAuditV1(searchInput(source, candidateId));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('defensive boundary source must audit');

    expect(POLYGON_RIVER_SEARCH_SPACE_LIMITS).toEqual({
      maxColumns: 512,
      maxRows: 512,
      maxLeaves: 20,
    });
    expect(result.value.activeGridDomain).toEqual({ columns: 512, rows: 512 });
    expect(result.value.gridVertexDomainCardinality).toBe('263169');
    expect(result.value.leafCount).toBe(20);
    expect(result.value.perLeafDomains).toHaveLength(20);
    expect(result.value.rawCartesianAssignmentCount).toBe(
      '2539186523698567850756023937434047455487038796609427573825165601750353667551742828293184195425900644264857601',
    );
    expect(result.value.rawCartesianAssignmentCount).toBe((263169n ** 20n).toString());
  });

  it('is deterministic, cuts caller aliases, and deeply freezes the audit', () => {
    const source = defaultSource();
    const candidateId = firstCandidateId(source);
    const raw = searchInput(source, candidateId);
    const first = buildPolygonRiverSearchSpaceAuditV1(raw);
    const second = buildPolygonRiverSearchSpaceAuditV1(structuredClone(raw));
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error('default source must audit');

    const tree = source.orderedTree as MutableTree;
    tree.nodes.reverse();
    tree.edges.reverse();
    source.maxColumns = 1;
    raw.candidateId = 'caller-mutated';
    expect(first.value.activeGridDomain).toEqual({ columns: 12, rows: 8 });
    expect(first.value.packingProblemReference.candidateReference.candidateId).toBe(candidateId);
    expect(allFrozen(first)).toBe(true);
  });

  it('fixes the raw-product interpretation and every downstream or profile claim', () => {
    const result = buildPolygonRiverSearchSpaceAuditV1(searchInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('default source must audit');

    expect(result.value).toMatchObject({
      recordType: POLYGON_RIVER_SEARCH_SPACE_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'metric-independent-exact-finite-search-space-cardinality-audit-only',
      interpretation: 'raw Cartesian leaf-to-grid-vertex assignment space before all constraints',
      exactIntegerEncoding: 'canonical-nonnegative-base-10-bigint-decimal',
      rawCartesianProductRole: 'constraint-free-upper-bound-and-enumeration-domain-cardinality',
      coordinateCoincidenceIncludedInRawProduct: true,
    });
    const falseFields = [
      'distinctnessConstraintApplied',
      'nonoverlapConstraintApplied',
      'separationConstraintApplied',
      'metricDependent',
      'metricSelectionIncluded',
      'constraintEvaluationIncluded',
      'assignmentEnumerationIncluded',
      'assignmentMaterializationIncluded',
      'solverIncluded',
      'placementIncluded',
      'packingIncluded',
      'geometryIncluded',
      'creasePatternIncluded',
      'mountainValleyIncluded',
      'foldabilityIncluded',
      'feasibilityDecisionIncluded',
      'globalM0fGo',
      'capacityClaim',
      'supportClaim',
      'performanceClaim',
    ] as const;
    for (const field of falseFields) expect(result.value[field], field).toBe(false);
    expect(result.value).not.toHaveProperty('supportProfile');
    expect(result.value).not.toHaveProperty('assignments');
    expect(result.value).not.toHaveProperty('placements');
  });
});

describe('M0F polygon/river search-space fail-closed boundary', () => {
  it('rejects unknown, empty, and empty-enumeration candidates through the required builder', () => {
    const unknown = buildPolygonRiverSearchSpaceAuditV1(
      searchInput(defaultSource(), 'square-grid:not-present'),
    );
    expect(unknown.ok).toBe(false);
    if (unknown.ok) throw new Error('unknown candidate must fail');
    expect(unknown.error).toContainEqual(
      expect.objectContaining({
        stage: 'packing-problem',
        path: '$.candidateId',
        code: 'candidate-not-found',
        sourceStage: 'path-demand/candidate-reference',
      }),
    );

    expectFailure(searchInput(defaultSource(), ''), 'search-space-input', 'invalid-candidate-id');
    expectFailure(
      searchInput(emptyCandidateSource(), 'square-grid:not-present'),
      'packing-problem',
      'candidate-not-found',
      '$.candidateId',
    );
  });

  it('rejects unknown fields and outer or embedded claim escalation', () => {
    expectFailure(
      { ...searchInput(), metric: 'euclidean' },
      'search-space-input',
      'unknown-field',
      '$.metric',
    );
    expectFailure(
      { ...searchInput(), contractStatus: 'verified' },
      'search-space-input',
      'claim-boundary',
      '$.contractStatus',
    );
    expectFailure(
      { ...searchInput(), scientificClaim: true },
      'search-space-input',
      'claim-boundary',
      '$.scientificClaim',
    );
    const embedded = searchInput();
    (embedded.source as JsonRecord).scientificClaim = true;
    expectFailure(embedded, 'packing-problem', 'claim-boundary', '$.source.scientificClaim');
  });

  it('rejects hostile snapshots without invoking accessors or returning partial cardinality', () => {
    const cyclic = searchInput();
    cyclic.self = cyclic;
    expectFailure(cyclic, 'snapshot', 'invalid-snapshot', '$');

    const sparse = searchInput();
    const source = sparse.source as JsonRecord;
    (source.orderedTree as MutableTree).nodes = new Array<MutableTree['nodes'][number]>(2);
    expectFailure(sparse, 'snapshot', 'invalid-snapshot', '$');

    let getterCalls = 0;
    const accessor = searchInput();
    Object.defineProperty(accessor, 'candidateId', {
      enumerable: true,
      get(): string {
        getterCalls += 1;
        return 'candidate';
      },
    });
    expectFailure(accessor, 'snapshot', 'invalid-snapshot', '$');
    expect(getterCalls).toBe(0);

    const revoked = Proxy.revocable(searchInput(), {});
    revoked.revoke();
    expectFailure(revoked.proxy, 'snapshot', 'invalid-snapshot', '$');
  });
});
