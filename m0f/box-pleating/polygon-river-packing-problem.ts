import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  parseExactRationalJsonV1,
  type ExactRationalJsonV1,
} from '../model/exact-rational-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  adaptOrderedTreeToSquareGridCandidateInputV1,
  ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
  type OrderedTreeGridQuantizationInputV1,
  type OrderedTreeGridQuantizationIssue,
} from './ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from './ordered-tree-input.js';
import {
  buildOrderedTreePathDemandsV1,
  ORDERED_TREE_PATH_DEMAND_INPUT_RECORD_TYPE,
  type OrderedTreePathDemandIssue,
} from './ordered-tree-path-demands.js';
import {
  type SquareGridBranchClass,
  type SquareGridCandidateV1,
} from './square-grid-candidates.js';

export const POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE =
  'm0f-polygon-river-packing-problem-input' as const;
export const POLYGON_RIVER_PACKING_PROBLEM_RESULT_RECORD_TYPE =
  'm0f-polygon-river-packing-problem-result' as const;

/**
 * Defensive parser and finite-problem ceilings only. They are not a product
 * SupportProfile and do not imply that the described constraints are
 * geometrically evaluable or satisfiable.
 */
export const POLYGON_RIVER_PACKING_PROBLEM_LIMITS = deepFreezeOwned({
  maxArrayLength: 40,
  maxContainerCount: 320,
  maxDepth: 8,
  maxObjectPropertyCount: 12,
  maxPropertyNameCodeUnits: 64,
  maxStringCodeUnits: 4_096,
  maxTotalStringCodeUnits: 262_144,
  maxTotalPropertyCount: 2_048,
  maxLeaves: 20,
  maxLeafPairs: 190,
  maxTreeEdges: 39,
});

export type PolygonRiverPackingProblemInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  source: OrderedTreeGridQuantizationInputV1;
  candidateId: string;
}>;

export type PolygonRiverPackingProblemInputIssue = Readonly<{
  stage: 'snapshot' | 'packing-problem-input' | 'ordered-tree-adapter';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
}>;

export type PolygonRiverPackingProblemInputParseResult =
  | Readonly<{ ok: true; value: PolygonRiverPackingProblemInputV1 }>
  | Readonly<{ ok: false; error: readonly PolygonRiverPackingProblemInputIssue[] }>;

export type CompactInclusiveIntegerDomainV1 = Readonly<{
  representation: 'compact-inclusive-integer-range';
  minimum: number;
  maximum: number;
  step: 1;
}>;

export type PolygonRiverLeafGridVertexVariableV1 = Readonly<{
  leafNodeId: string;
  x: CompactInclusiveIntegerDomainV1;
  y: CompactInclusiveIntegerDomainV1;
  assignedCoordinate: null;
}>;

export type PolygonRiverDimensionInputV1 = Readonly<{
  treeEdgeId: string;
  firstEndpointNodeId: string;
  secondEndpointNodeId: string;
  branchClass: SquareGridBranchClass;
  /** Canonical nonnegative base-10 integer copied from the referenced candidate. */
  lengthSteps: string;
  /** Canonical nonnegative base-10 integer copied from the referenced candidate. */
  widthSteps: string;
}>;

export type PolygonRiverSeparationConstraintInputV1 = Readonly<{
  firstLeafId: string;
  secondLeafId: string;
  /** Canonical nonnegative base-10 integer copied from the path-demand stage. */
  totalLengthSteps: string;
  /** Canonical nonnegative base-10 integer copied from the path-demand stage. */
  maximumWidthSteps: string;
  pathTreeEdgeIds: readonly string[];
}>;

export type PositiveResidualStripV1 = Readonly<{
  axis: 'x' | 'y';
  boundary: 'positive';
  size: ExactRationalJsonV1;
}>;

export type PolygonRiverPackingProblemResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof POLYGON_RIVER_PACKING_PROBLEM_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'finite-polygon-river-packing-csp-problem-description-only';
  interpretation: 'finite CSP problem description only; no geometry, metric, assignment, or solver';
  candidateReferenceMode: 'caller-supplied-id-re-enumerated-from-embedded-source';
  automaticCandidateSelectionIncluded: false;
  treePointSnapIncluded: false;
  metric: 'unresolved';
  metricSelectionIncluded: false;
  constraintEvaluable: false;
  assignmentIncluded: false;
  solverIncluded: false;
  placementIncluded: false;
  fullPaperCoverage: false;
  residualStripHandling: 'unresolved';
  polygonGeometryIncluded: false;
  riverGeometryIncluded: false;
  packingIncluded: false;
  polygonRiverPackingIncluded: false;
  hingeConstructionIncluded: false;
  ridgeConstructionIncluded: false;
  axialConstructionIncluded: false;
  junctionConstructionIncluded: false;
  creasePatternIncluded: false;
  pleatRoutingIncluded: false;
  mountainValleyIncluded: false;
  foldabilityIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  candidateReference: SquareGridCandidateV1;
  activeGridDomain: Readonly<{
    columns: number;
    rows: number;
  }>;
  candidateResidualStrips: Readonly<{
    xAxis: ExactRationalJsonV1;
    yAxis: ExactRationalJsonV1;
  }>;
  positiveResidualStripOrder: 'x-then-y';
  positiveResidualStrips: readonly PositiveResidualStripV1[];
  leafVariableOrder: 'leaf-node-id-code-unit';
  leafGridVertexVariables: readonly PolygonRiverLeafGridVertexVariableV1[];
  riverDimensionInputOrder: 'tree-edge-id-code-unit';
  riverEndpointOrder: 'first-endpoint-id-then-second-endpoint-id-code-unit';
  riverDimensionInputs: readonly PolygonRiverDimensionInputV1[];
  separationConstraintInputOrder: 'first-leaf-id-then-second-leaf-id-code-unit';
  separationConstraintInputs: readonly PolygonRiverSeparationConstraintInputV1[];
  sourceBinding: Readonly<{
    treeEdgeCount: number;
    mappedBranchCount: number;
    sourceBranchCount: number;
    candidateBranchQuantizationCount: number;
    riverDimensionInputCount: number;
    leafCount: number;
    leafVariableCount: number;
    leafPairCount: number;
    separationConstraintInputCount: number;
  }>;
}>;

export type PolygonRiverPackingProblemIssue = Readonly<{
  stage:
    | PolygonRiverPackingProblemInputIssue['stage']
    | 'path-demand'
    | 'source-binding'
    | 'problem-shape';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
}>;

export type PolygonRiverPackingProblemBuildResult =
  | Readonly<{ ok: true; value: PolygonRiverPackingProblemResultV1 }>
  | Readonly<{ ok: false; error: readonly PolygonRiverPackingProblemIssue[] }>;

type ProblemFailure = Extract<PolygonRiverPackingProblemBuildResult, { ok: false }>;
type InputFailure = Extract<PolygonRiverPackingProblemInputParseResult, { ok: false }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'source',
  'candidateId',
] as const;
const NONNEGATIVE_DECIMAL_PATTERN = /^(?:0|[1-9][0-9]*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function oneIssue(
  stage: PolygonRiverPackingProblemIssue['stage'],
  path: string,
  code: string,
  message: string,
  sourceStage?: string,
): ProblemFailure {
  const issue: PolygonRiverPackingProblemIssue =
    sourceStage === undefined
      ? { stage, path, code, message }
      : { stage, path, code, message, sourceStage };
  return { ok: false, error: deepFreezeOwned([issue]) };
}

function oneInputIssue(
  stage: PolygonRiverPackingProblemInputIssue['stage'],
  path: string,
  code: string,
  message: string,
  sourceStage?: string,
): InputFailure {
  const issue: PolygonRiverPackingProblemInputIssue =
    sourceStage === undefined
      ? { stage, path, code, message }
      : { stage, path, code, message, sourceStage };
  return deepFreezeOwned({ ok: false, error: [issue] });
}

function validateClosedRoot(
  raw: Record<string, unknown>,
): readonly PolygonRiverPackingProblemInputIssue[] {
  const issues: PolygonRiverPackingProblemInputIssue[] = [];
  const allowed = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      issues.push({
        stage: 'packing-problem-input',
        path: `$.${key}`,
        code: 'unknown-field',
        message: 'field is not declared by polygon/river packing problem input v1',
      });
    }
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      issues.push({
        stage: 'packing-problem-input',
        path: `$.${key}`,
        code: 'missing-field',
        message: 'required field is missing',
      });
    }
  }
  if (raw.schemaVersion !== 1) {
    issues.push({
      stage: 'packing-problem-input',
      path: '$.schemaVersion',
      code: 'invalid-literal',
      message: 'must equal 1',
    });
  }
  if (raw.recordType !== POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE) {
    issues.push({
      stage: 'packing-problem-input',
      path: '$.recordType',
      code: 'invalid-literal',
      message: `must equal ${POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE}`,
    });
  }
  if (raw.contractStatus !== 'candidate') {
    issues.push({
      stage: 'packing-problem-input',
      path: '$.contractStatus',
      code: 'claim-boundary',
      message: 'must equal candidate',
    });
  }
  if (raw.scientificClaim !== false) {
    issues.push({
      stage: 'packing-problem-input',
      path: '$.scientificClaim',
      code: 'claim-boundary',
      message: 'must equal false',
    });
  }
  if (
    typeof raw.candidateId !== 'string' ||
    raw.candidateId.length === 0 ||
    raw.candidateId.length > POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxStringCodeUnits
  ) {
    issues.push({
      stage: 'packing-problem-input',
      path: '$.candidateId',
      code: 'invalid-candidate-id',
      message: 'must be a nonempty bounded string',
    });
  }
  return issues;
}

function pathDemandIssues(
  issues: readonly OrderedTreePathDemandIssue[],
): readonly PolygonRiverPackingProblemIssue[] {
  return issues.map((issue) => ({
    stage: 'path-demand' as const,
    path: issue.path,
    code: issue.code,
    message: issue.message,
    sourceStage:
      issue.sourceStage === undefined ? issue.stage : `${issue.stage}/${issue.sourceStage}`,
  }));
}

function prefixedSourcePath(path: string): string {
  if (path === '$') return '$.source';
  if (path.startsWith('$')) return `$.source${path.slice(1)}`;
  return `$.source.${path}`;
}

function publicAdapterSourcePath(issue: OrderedTreeGridQuantizationIssue): string {
  const gridPrefix = '$.squareGridInput';
  if (issue.stage !== 'square-grid-input' || !issue.path.startsWith(gridPrefix)) {
    return prefixedSourcePath(issue.path);
  }
  const suffix = issue.path.slice(gridPrefix.length);
  if (
    suffix === '' ||
    suffix.startsWith('.paper') ||
    suffix.startsWith('.maxColumns') ||
    suffix.startsWith('.maxRows') ||
    suffix.startsWith('.relativeErrorLimit')
  ) {
    return `$.source${suffix}`;
  }
  if (suffix.startsWith('.branches')) return '$.source.orderedTree.edges';
  return '$.source';
}

function adapterIssues(
  issues: readonly OrderedTreeGridQuantizationIssue[],
): readonly PolygonRiverPackingProblemInputIssue[] {
  return issues.map((issue) => ({
    stage: 'ordered-tree-adapter' as const,
    path: publicAdapterSourcePath(issue),
    code: issue.code,
    message: issue.message,
    sourceStage: issue.stage,
  }));
}

/**
 * Parses and canonicalizes only the closed ordered-tree/grid source and caller
 * candidate reference. Candidate enumeration and path-demand construction are
 * deliberately outside this input boundary.
 */
export function parsePolygonRiverPackingProblemInputV1(
  supplied: unknown,
): PolygonRiverPackingProblemInputParseResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxArrayLength,
    maxContainerCount: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxContainerCount,
    maxDepth: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxDepth,
    maxObjectPropertyCount: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxObjectPropertyCount,
    maxPropertyNameCodeUnits: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxPropertyNameCodeUnits,
    maxStringCodeUnits: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxStringCodeUnits,
    maxTotalStringCodeUnits: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxTotalStringCodeUnits,
    maxTotalPropertyCount: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxTotalPropertyCount,
  });
  if (!snapshot.ok) {
    return oneInputIssue(
      'snapshot',
      '$',
      'invalid-snapshot',
      'input must be one bounded acyclic plain snapshot without accessors',
    );
  }
  if (!isRecord(snapshot.value)) {
    return oneInputIssue(
      'packing-problem-input',
      '$',
      'invalid-object',
      'polygon/river packing problem input must be an object',
    );
  }

  const issues = validateClosedRoot(snapshot.value);
  if (issues.length > 0) return deepFreezeOwned({ ok: false, error: issues });
  const candidateId = snapshot.value.candidateId;
  if (typeof candidateId !== 'string') throw new TypeError('candidate ID was already validated');

  const adapted = adaptOrderedTreeToSquareGridCandidateInputV1(snapshot.value.source);
  if (!adapted.ok) {
    return deepFreezeOwned({ ok: false, error: adapterIssues(adapted.error) });
  }
  const canonicalTree = adapted.value.orderedTree;
  const canonicalGrid = adapted.value.squareGridInput;
  const source: OrderedTreeGridQuantizationInputV1 = {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: {
      schemaVersion: 1,
      recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      nodes: canonicalTree.nodes,
      edges: canonicalTree.edges,
      rotation: canonicalTree.rotation,
    },
    paper: {
      width: canonicalGrid.paper.width,
      height: canonicalGrid.paper.height,
    },
    maxColumns: canonicalGrid.maxColumns,
    maxRows: canonicalGrid.maxRows,
    relativeErrorLimit: canonicalGrid.relativeErrorLimit,
  };

  return deepFreezeOwned({
    ok: true,
    value: {
      schemaVersion: 1,
      recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      source,
      candidateId,
    },
  });
}

function canonicalNonnegativeSteps(value: string): bigint | undefined {
  if (!NONNEGATIVE_DECIMAL_PATTERN.test(value)) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/**
 * Describes a finite, compact-domain CSP input surface for a caller-selected
 * square-grid candidate. This function deliberately does not select a metric,
 * create polygon or river geometry, assign any leaf coordinate, run a solver,
 * discard residual paper, or make packing/feasibility/GO claims.
 */
export function buildPolygonRiverPackingProblemV1(
  supplied: unknown,
): PolygonRiverPackingProblemBuildResult {
  const parsed = parsePolygonRiverPackingProblemInputV1(supplied);
  if (!parsed.ok) return parsed;
  const source = parsed.value.source;
  const candidateId = parsed.value.candidateId;

  const pathDemand = buildOrderedTreePathDemandsV1({
    schemaVersion: 1,
    recordType: ORDERED_TREE_PATH_DEMAND_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    source,
    candidateId,
  });
  if (!pathDemand.ok) {
    return { ok: false, error: deepFreezeOwned(pathDemandIssues(pathDemand.error)) };
  }

  const adapted = adaptOrderedTreeToSquareGridCandidateInputV1(source);
  if (!adapted.ok) {
    return { ok: false, error: deepFreezeOwned(adapterIssues(adapted.error)) };
  }

  const candidate = pathDemand.value.candidateReference;
  const tree = adapted.value.orderedTree;
  const treeEdges = tree.edges;
  const mappings = adapted.value.branchMapping;
  const sourceBranches = adapted.value.squareGridInput.branches;
  const quantizations = candidate.branchQuantizations;
  const treeEdgeCount = treeEdges.length;
  if (
    candidate.candidateId !== candidateId ||
    treeEdgeCount === 0 ||
    treeEdgeCount > POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxTreeEdges ||
    mappings.length !== treeEdgeCount ||
    sourceBranches.length !== treeEdgeCount ||
    quantizations.length !== treeEdgeCount ||
    pathDemand.value.sourceBinding.treeEdgeCount !== treeEdgeCount ||
    pathDemand.value.sourceBinding.mappedBranchCount !== mappings.length ||
    pathDemand.value.sourceBinding.candidateBranchQuantizationCount !== quantizations.length
  ) {
    return oneIssue(
      'source-binding',
      '$.source',
      'source-cardinality-mismatch',
      'tree edges, mappings, source branches, path binding, and candidate quantizations must agree exactly',
    );
  }
  if (
    !Number.isSafeInteger(candidate.columns) ||
    candidate.columns <= 0 ||
    !Number.isSafeInteger(candidate.rows) ||
    candidate.rows <= 0
  ) {
    return oneIssue(
      'problem-shape',
      '$.candidateId',
      'invalid-active-grid-domain',
      'referenced candidate columns and rows must be positive safe integers',
    );
  }

  const mappingByEdgeId = new Map(mappings.map((entry) => [entry.treeEdgeId, entry] as const));
  const sourceBranchById = new Map(sourceBranches.map((entry) => [entry.id, entry] as const));
  const quantizationByEdgeId = new Map(
    quantizations.map((entry) => [entry.branchId, entry] as const),
  );
  const classificationByEdgeId = new Map(
    tree.derived.edgeClassifications.map((entry) => [entry.edgeId, entry.branchClass] as const),
  );
  if (
    mappingByEdgeId.size !== treeEdgeCount ||
    sourceBranchById.size !== treeEdgeCount ||
    quantizationByEdgeId.size !== treeEdgeCount ||
    classificationByEdgeId.size !== treeEdgeCount
  ) {
    return oneIssue(
      'source-binding',
      '$.source.orderedTree.edges',
      'duplicate-or-missing-edge-binding',
      'each canonical tree edge must have one distinct mapping, source branch, classification, and quantization',
    );
  }

  const riverDimensionInputs: PolygonRiverDimensionInputV1[] = [];
  for (let index = 0; index < treeEdges.length; index += 1) {
    const edge = treeEdges[index];
    if (edge === undefined) {
      return oneIssue(
        'source-binding',
        '$.source.orderedTree.edges',
        'missing-tree-edge',
        'tree edge array must be dense',
      );
    }
    if (index > 0 && compareCodeUnits(treeEdges[index - 1]?.id ?? '', edge.id) >= 0) {
      return oneIssue(
        'source-binding',
        '$.source.orderedTree.edges',
        'noncanonical-tree-edge-order',
        'tree edges must be strictly ordered by code unit ID',
      );
    }
    const mapping = mappingByEdgeId.get(edge.id);
    const sourceBranch = sourceBranchById.get(edge.id);
    const quantization = quantizationByEdgeId.get(edge.id);
    const branchClass = classificationByEdgeId.get(edge.id);
    if (
      mapping === undefined ||
      sourceBranch === undefined ||
      quantization === undefined ||
      branchClass === undefined ||
      mapping.squareGridBranchId !== edge.id ||
      mapping.branchClass !== branchClass ||
      mapping.length !== edge.length ||
      mapping.width !== edge.width ||
      sourceBranch.branchClass !== branchClass ||
      sourceBranch.length !== edge.length ||
      sourceBranch.width !== edge.width ||
      quantization.branchClass !== branchClass ||
      quantization.length.sourceValue !== edge.length ||
      quantization.width.sourceValue !== edge.width ||
      canonicalNonnegativeSteps(quantization.length.steps) === undefined ||
      canonicalNonnegativeSteps(quantization.width.steps) === undefined
    ) {
      return oneIssue(
        'source-binding',
        `$.source.orderedTree.edges.${edge.id}`,
        'edge-source-binding-mismatch',
        'tree edge endpoints and dimensions must retain one canonical source-bound candidate quantization',
      );
    }
    const [firstEndpointNodeId, secondEndpointNodeId] =
      compareCodeUnits(edge.from, edge.to) <= 0 ? [edge.from, edge.to] : [edge.to, edge.from];
    riverDimensionInputs.push({
      treeEdgeId: edge.id,
      firstEndpointNodeId,
      secondEndpointNodeId,
      branchClass,
      lengthSteps: quantization.length.steps,
      widthSteps: quantization.width.steps,
    });
  }

  const leafNodeIds = pathDemand.value.leafNodeIds;
  const adapterLeafNodeIds = tree.derived.leafNodeIds;
  const expectedLeafPairCount = (leafNodeIds.length * (leafNodeIds.length - 1)) / 2;
  if (
    leafNodeIds.length < 2 ||
    leafNodeIds.length > POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxLeaves ||
    !sameStringArray(leafNodeIds, adapterLeafNodeIds) ||
    leafNodeIds.some(
      (leafId, index) => index > 0 && compareCodeUnits(leafNodeIds[index - 1] ?? '', leafId) >= 0,
    ) ||
    pathDemand.value.leafPairCount !== expectedLeafPairCount ||
    pathDemand.value.pathDemands.length !== expectedLeafPairCount ||
    expectedLeafPairCount > POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxLeafPairs
  ) {
    return oneIssue(
      'source-binding',
      '$.source.orderedTree.derived.leafNodeIds',
      'leaf-or-pair-cardinality-mismatch',
      'canonical leaves and all unordered leaf pairs must agree with the adapter and path-demand stage',
    );
  }

  const leafGridVertexVariables: PolygonRiverLeafGridVertexVariableV1[] = leafNodeIds.map(
    (leafNodeId) => ({
      leafNodeId,
      x: {
        representation: 'compact-inclusive-integer-range',
        minimum: 0,
        maximum: candidate.columns,
        step: 1,
      },
      y: {
        representation: 'compact-inclusive-integer-range',
        minimum: 0,
        maximum: candidate.rows,
        step: 1,
      },
      assignedCoordinate: null,
    }),
  );

  const expectedPairs: Readonly<{ firstLeafId: string; secondLeafId: string }>[] = [];
  for (let firstIndex = 0; firstIndex < leafNodeIds.length - 1; firstIndex += 1) {
    const firstLeafId = leafNodeIds[firstIndex];
    if (firstLeafId === undefined) {
      return oneIssue('problem-shape', '$.leafPairs', 'missing-leaf', 'leaf array must be dense');
    }
    for (let secondIndex = firstIndex + 1; secondIndex < leafNodeIds.length; secondIndex += 1) {
      const secondLeafId = leafNodeIds[secondIndex];
      if (secondLeafId === undefined) {
        return oneIssue('problem-shape', '$.leafPairs', 'missing-leaf', 'leaf array must be dense');
      }
      expectedPairs.push({ firstLeafId, secondLeafId });
    }
  }

  const separationConstraintInputs: PolygonRiverSeparationConstraintInputV1[] = [];
  for (let index = 0; index < pathDemand.value.pathDemands.length; index += 1) {
    const path = pathDemand.value.pathDemands[index];
    const expected = expectedPairs[index];
    if (
      path === undefined ||
      expected === undefined ||
      path.firstLeafId !== expected.firstLeafId ||
      path.secondLeafId !== expected.secondLeafId ||
      path.edges.length === 0 ||
      path.edges.length > treeEdgeCount ||
      new Set(path.edges.map((entry) => entry.treeEdgeId)).size !== path.edges.length
    ) {
      return oneIssue(
        'source-binding',
        `$.pathDemands[${String(index)}]`,
        'path-pair-binding-mismatch',
        'each canonical leaf pair must retain one nonempty simple tree path',
      );
    }

    let totalLength = 0n;
    let maximumWidth = 0n;
    const pathTreeEdgeIds: string[] = [];
    for (const pathEdge of path.edges) {
      const quantization = quantizationByEdgeId.get(pathEdge.treeEdgeId);
      if (
        quantization === undefined ||
        pathEdge.branchClass !== quantization.branchClass ||
        pathEdge.lengthSteps !== quantization.length.steps ||
        pathEdge.widthSteps !== quantization.width.steps
      ) {
        return oneIssue(
          'source-binding',
          `$.pathDemands[${String(index)}].${pathEdge.treeEdgeId}`,
          'path-edge-quantization-mismatch',
          'every path edge must retain the referenced candidate quantization',
        );
      }
      const length = canonicalNonnegativeSteps(pathEdge.lengthSteps);
      const width = canonicalNonnegativeSteps(pathEdge.widthSteps);
      if (length === undefined || width === undefined) {
        return oneIssue(
          'source-binding',
          `$.pathDemands[${String(index)}].${pathEdge.treeEdgeId}`,
          'invalid-step-integer',
          'path dimensions must be canonical nonnegative base-10 integers',
        );
      }
      totalLength += length;
      if (width > maximumWidth) maximumWidth = width;
      pathTreeEdgeIds.push(pathEdge.treeEdgeId);
    }
    if (
      path.totalLengthSteps !== totalLength.toString() ||
      path.maximumWidthSteps !== maximumWidth.toString()
    ) {
      return oneIssue(
        'source-binding',
        `$.pathDemands[${String(index)}]`,
        'path-aggregation-mismatch',
        'path totals must equal the candidate-bound edge-step aggregation',
      );
    }
    separationConstraintInputs.push({
      firstLeafId: path.firstLeafId,
      secondLeafId: path.secondLeafId,
      totalLengthSteps: path.totalLengthSteps,
      maximumWidthSteps: path.maximumWidthSteps,
      pathTreeEdgeIds,
    });
  }

  if (
    riverDimensionInputs.length !== treeEdgeCount ||
    leafGridVertexVariables.length !== leafNodeIds.length ||
    separationConstraintInputs.length !== expectedLeafPairCount
  ) {
    return oneIssue(
      'problem-shape',
      '$',
      'problem-cardinality-mismatch',
      'finite problem variables and inputs must cover every bound edge, leaf, and leaf pair exactly once',
    );
  }

  const residualX = parseExactRationalJsonV1(candidate.residualStrips.xAxis);
  const residualY = parseExactRationalJsonV1(candidate.residualStrips.yAxis);
  if (
    !residualX.ok ||
    !residualY.ok ||
    residualX.value.numerator < 0n ||
    residualY.value.numerator < 0n
  ) {
    return oneIssue(
      'source-binding',
      '$.candidateId',
      'invalid-candidate-residual-strip',
      'candidate residual strips must be canonical nonnegative exact rationals',
    );
  }
  const positiveResidualStrips: PositiveResidualStripV1[] = [];
  if (residualX.value.numerator > 0n) {
    positiveResidualStrips.push({
      axis: 'x',
      boundary: 'positive',
      size: candidate.residualStrips.xAxis,
    });
  }
  if (residualY.value.numerator > 0n) {
    positiveResidualStrips.push({
      axis: 'y',
      boundary: 'positive',
      size: candidate.residualStrips.yAxis,
    });
  }

  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: POLYGON_RIVER_PACKING_PROBLEM_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'finite-polygon-river-packing-csp-problem-description-only',
      interpretation:
        'finite CSP problem description only; no geometry, metric, assignment, or solver',
      candidateReferenceMode: 'caller-supplied-id-re-enumerated-from-embedded-source',
      automaticCandidateSelectionIncluded: false,
      treePointSnapIncluded: false,
      metric: 'unresolved',
      metricSelectionIncluded: false,
      constraintEvaluable: false,
      assignmentIncluded: false,
      solverIncluded: false,
      placementIncluded: false,
      fullPaperCoverage: false,
      residualStripHandling: 'unresolved',
      polygonGeometryIncluded: false,
      riverGeometryIncluded: false,
      packingIncluded: false,
      polygonRiverPackingIncluded: false,
      hingeConstructionIncluded: false,
      ridgeConstructionIncluded: false,
      axialConstructionIncluded: false,
      junctionConstructionIncluded: false,
      creasePatternIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      candidateReference: candidate,
      activeGridDomain: { columns: candidate.columns, rows: candidate.rows },
      candidateResidualStrips: {
        xAxis: candidate.residualStrips.xAxis,
        yAxis: candidate.residualStrips.yAxis,
      },
      positiveResidualStripOrder: 'x-then-y',
      positiveResidualStrips,
      leafVariableOrder: 'leaf-node-id-code-unit',
      leafGridVertexVariables,
      riverDimensionInputOrder: 'tree-edge-id-code-unit',
      riverEndpointOrder: 'first-endpoint-id-then-second-endpoint-id-code-unit',
      riverDimensionInputs,
      separationConstraintInputOrder: 'first-leaf-id-then-second-leaf-id-code-unit',
      separationConstraintInputs,
      sourceBinding: {
        treeEdgeCount,
        mappedBranchCount: mappings.length,
        sourceBranchCount: sourceBranches.length,
        candidateBranchQuantizationCount: quantizations.length,
        riverDimensionInputCount: riverDimensionInputs.length,
        leafCount: leafNodeIds.length,
        leafVariableCount: leafGridVertexVariables.length,
        leafPairCount: expectedLeafPairCount,
        separationConstraintInputCount: separationConstraintInputs.length,
      },
    }),
  };
}
