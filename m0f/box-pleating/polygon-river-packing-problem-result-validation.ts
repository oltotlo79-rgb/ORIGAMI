import { deepFreezeOwned } from '../clone-and-freeze.js';
import { parseExactRationalJsonV1 } from '../model/exact-rational-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  adaptOrderedTreeToSquareGridCandidateInputV1,
  type OrderedTreeGridQuantizationResultV1,
} from './ordered-tree-grid-quantization.js';
import {
  parsePolygonRiverPackingProblemInputV1,
  POLYGON_RIVER_PACKING_PROBLEM_RESULT_RECORD_TYPE,
  type PolygonRiverPackingProblemResultV1,
} from './polygon-river-packing-problem.js';
import {
  validateSquareGridSelectedCandidateV1,
  type SquareGridSelectedCandidateViolationV1,
} from './square-grid-selected-candidate-validation.js';
import type { SquareGridCandidateV1 } from './square-grid-candidates.js';

/**
 * Defensive response ceilings. These limits are not a SupportProfile and do
 * not imply candidate-enumeration completeness, placement, feasibility, or GO.
 */
export const POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS = deepFreezeOwned({
  maxArrayLength: 190,
  maxContainerCount: 2_048,
  maxDepth: 12,
  maxObjectPropertyCount: 64,
  maxPropertyNameCodeUnits: 64,
  maxStringCodeUnits: 8_192,
  maxTotalStringCodeUnits: 4_194_304,
  maxTotalPropertyCount: 8_192,
  maxViolations: 512,
});

export type PolygonRiverPackingProblemResultValidationStageV1 =
  | 'request-input'
  | 'ordered-tree-adapter'
  | 'result-snapshot'
  | 'result-structure'
  | 'claim-boundary'
  | 'candidate-reference'
  | 'source-binding'
  | 'tree-path'
  | 'exact-arithmetic';

export type PolygonRiverPackingProblemResultValidationCodeV1 =
  | 'invalid-request'
  | 'invalid-snapshot'
  | 'invalid-object'
  | 'invalid-array'
  | 'unknown-field'
  | 'missing-field'
  | 'invalid-literal'
  | 'claim-boundary'
  | 'candidate-invalid'
  | 'candidate-id-mismatch'
  | 'cardinality-mismatch'
  | 'source-mismatch'
  | 'order-mismatch'
  | 'invalid-domain'
  | 'invalid-step-integer'
  | 'arithmetic-mismatch'
  | 'missing-tree-path';

export type PolygonRiverPackingProblemResultViolationV1 = Readonly<{
  stage: PolygonRiverPackingProblemResultValidationStageV1;
  path: string;
  code: PolygonRiverPackingProblemResultValidationCodeV1;
  message: string;
  sourceStage?: string;
  sourceCode?: string;
}>;

export type PolygonRiverPackingProblemResultValidationV1 =
  | Readonly<{ ok: true; value: PolygonRiverPackingProblemResultV1 }>
  | Readonly<{
      ok: false;
      violations: readonly PolygonRiverPackingProblemResultViolationV1[];
    }>;

type Violation = PolygonRiverPackingProblemResultViolationV1;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'scope',
  'interpretation',
  'candidateReferenceMode',
  'automaticCandidateSelectionIncluded',
  'treePointSnapIncluded',
  'metric',
  'metricSelectionIncluded',
  'constraintEvaluable',
  'assignmentIncluded',
  'solverIncluded',
  'placementIncluded',
  'fullPaperCoverage',
  'residualStripHandling',
  'polygonGeometryIncluded',
  'riverGeometryIncluded',
  'packingIncluded',
  'polygonRiverPackingIncluded',
  'hingeConstructionIncluded',
  'ridgeConstructionIncluded',
  'axialConstructionIncluded',
  'junctionConstructionIncluded',
  'creasePatternIncluded',
  'pleatRoutingIncluded',
  'mountainValleyIncluded',
  'foldabilityIncluded',
  'feasibilityDecisionIncluded',
  'globalM0fGo',
  'candidateReference',
  'activeGridDomain',
  'candidateResidualStrips',
  'positiveResidualStripOrder',
  'positiveResidualStrips',
  'leafVariableOrder',
  'leafGridVertexVariables',
  'riverDimensionInputOrder',
  'riverEndpointOrder',
  'riverDimensionInputs',
  'separationConstraintInputOrder',
  'separationConstraintInputs',
  'sourceBinding',
] as const;

const NONNEGATIVE_INTEGER_PATTERN = /^(?:0|[1-9][0-9]*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function addViolation(
  violations: Violation[],
  stage: Violation['stage'],
  path: string,
  code: Violation['code'],
  message: string,
  sourceStage?: string,
  sourceCode?: string,
): void {
  if (violations.length >= POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxViolations) {
    return;
  }
  const violation: Violation = { stage, path, code, message };
  if (sourceStage !== undefined) {
    (violation as { sourceStage?: string }).sourceStage = sourceStage;
  }
  if (sourceCode !== undefined) {
    (violation as { sourceCode?: string }).sourceCode = sourceCode;
  }
  violations.push(violation);
}

function failure(
  violations: readonly Violation[],
): Extract<PolygonRiverPackingProblemResultValidationV1, { ok: false }> {
  const ordered = [...violations].sort((left, right) => {
    for (const [leftValue, rightValue] of [
      [left.path, right.path],
      [left.stage, right.stage],
      [left.code, right.code],
      [left.sourceStage ?? '', right.sourceStage ?? ''],
      [left.sourceCode ?? '', right.sourceCode ?? ''],
      [left.message, right.message],
    ] as const) {
      const order = compareCodeUnits(leftValue, rightValue);
      if (order !== 0) return order;
    }
    return 0;
  });
  return deepFreezeOwned({ ok: false as const, violations: ordered });
}

function prefixPath(prefix: string, path: string): string {
  if (path === '$') return prefix;
  if (path.startsWith('$')) return `${prefix}${path.slice(1)}`;
  return `${prefix}.${path}`;
}

function closedKeys(
  actual: Record<string, unknown>,
  expectedKeys: readonly string[],
  path: string,
  violations: Violation[],
): void {
  const expected = new Set(expectedKeys);
  for (const key of Object.keys(actual).sort(compareCodeUnits)) {
    if (!expected.has(key)) {
      addViolation(
        violations,
        'result-structure',
        `${path}.${key}`,
        'unknown-field',
        'field is not declared by polygon/river packing problem result v1',
      );
    }
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(actual, key)) {
      addViolation(
        violations,
        'result-structure',
        `${path}.${key}`,
        'missing-field',
        'required field is missing',
      );
    }
  }
}

function mismatchStage(expected: unknown): Violation['stage'] {
  return expected === false ? 'claim-boundary' : 'source-binding';
}

function mismatchCode(expected: unknown): Violation['code'] {
  return expected === false ? 'claim-boundary' : 'source-mismatch';
}

/** Compares all non-candidate response fields with one independently derived value. */
function compareExpected(
  actual: unknown,
  expected: unknown,
  path: string,
  violations: Violation[],
): void {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      addViolation(violations, 'result-structure', path, 'invalid-array', 'must be an array');
      return;
    }
    if (actual.length !== expected.length) {
      addViolation(
        violations,
        'source-binding',
        path,
        'cardinality-mismatch',
        `must contain exactly ${String(expected.length)} entries`,
      );
    }
    const sharedLength = Math.min(actual.length, expected.length);
    for (let index = 0; index < sharedLength; index += 1) {
      compareExpected(actual[index], expected[index], `${path}[${String(index)}]`, violations);
    }
    return;
  }

  if (typeof expected === 'object' && expected !== null) {
    if (!isRecord(actual)) {
      addViolation(violations, 'result-structure', path, 'invalid-object', 'must be an object');
      return;
    }
    const expectedRecord = expected as Readonly<Record<string, unknown>>;
    const expectedKeys = Object.keys(expectedRecord);
    closedKeys(actual, expectedKeys, path, violations);
    for (const key of expectedKeys) {
      if (Object.hasOwn(actual, key)) {
        compareExpected(actual[key], expectedRecord[key], `${path}.${key}`, violations);
      }
    }
    return;
  }

  if (!Object.is(actual, expected)) {
    addViolation(
      violations,
      mismatchStage(expected),
      path,
      mismatchCode(expected),
      expected === false
        ? 'claim boundary requires false'
        : `must equal the independently derived value ${JSON.stringify(expected)}`,
    );
  }
}

function candidateViolations(
  source: readonly SquareGridSelectedCandidateViolationV1[],
  violations: Violation[],
): void {
  for (const issue of source) {
    addViolation(
      violations,
      'candidate-reference',
      prefixPath('$.result.candidateReference', issue.path.replace(/^\$\.candidate/, '$')),
      'candidate-invalid',
      issue.message,
      issue.stage,
      issue.code,
    );
  }
}

function canonicalNonnegativeInteger(
  value: string,
  path: string,
  violations: Violation[],
): bigint | undefined {
  if (!NONNEGATIVE_INTEGER_PATTERN.test(value)) {
    addViolation(
      violations,
      'exact-arithmetic',
      path,
      'invalid-step-integer',
      'must be a canonical nonnegative base-10 integer',
    );
    return undefined;
  }
  try {
    return BigInt(value);
  } catch {
    addViolation(
      violations,
      'exact-arithmetic',
      path,
      'invalid-step-integer',
      'must fit the ECMAScript BigInt parser after response text bounds are applied',
    );
    return undefined;
  }
}

type AdjacencyEntry = Readonly<{ neighborId: string; edgeId: string }>;

function uniqueTreePath(
  firstNodeId: string,
  secondNodeId: string,
  adjacency: ReadonlyMap<string, readonly AdjacencyEntry[]>,
  maximumEdgeCount: number,
): readonly string[] | undefined {
  const queue = [firstNodeId];
  const visited = new Set([firstNodeId]);
  const predecessor = new Map<string, AdjacencyEntry>();
  for (const nodeId of queue) {
    if (nodeId === secondNodeId) break;
    for (const entry of adjacency.get(nodeId) ?? []) {
      if (visited.has(entry.neighborId)) continue;
      visited.add(entry.neighborId);
      predecessor.set(entry.neighborId, { neighborId: nodeId, edgeId: entry.edgeId });
      queue.push(entry.neighborId);
    }
  }
  if (!visited.has(secondNodeId)) return undefined;

  const reversed: string[] = [];
  let nodeId = secondNodeId;
  while (nodeId !== firstNodeId) {
    const entry = predecessor.get(nodeId);
    if (entry === undefined || reversed.length >= maximumEdgeCount) return undefined;
    reversed.push(entry.edgeId);
    nodeId = entry.neighborId;
  }
  reversed.reverse();
  return reversed;
}

function deriveExpectedResult(
  adapter: OrderedTreeGridQuantizationResultV1,
  candidate: SquareGridCandidateV1,
  violations: Violation[],
): PolygonRiverPackingProblemResultV1 | undefined {
  const tree = adapter.orderedTree;
  const treeEdges = tree.edges;
  const mappings = adapter.branchMapping;
  const sourceBranches = adapter.squareGridInput.branches;
  const quantizations = candidate.branchQuantizations;
  const edgeCount = treeEdges.length;
  if (
    mappings.length !== edgeCount ||
    sourceBranches.length !== edgeCount ||
    quantizations.length !== edgeCount ||
    tree.derived.edgeClassifications.length !== edgeCount
  ) {
    addViolation(
      violations,
      'source-binding',
      '$.request.source',
      'cardinality-mismatch',
      'tree edges, mappings, source branches, classifications, and candidate quantizations must have equal cardinality',
    );
    return undefined;
  }

  const mappingByEdgeId = new Map(mappings.map((entry) => [entry.treeEdgeId, entry] as const));
  const sourceById = new Map(sourceBranches.map((entry) => [entry.id, entry] as const));
  const quantizationById = new Map(quantizations.map((entry) => [entry.branchId, entry] as const));
  const classByEdgeId = new Map(
    tree.derived.edgeClassifications.map((entry) => [entry.edgeId, entry.branchClass] as const),
  );
  if (
    mappingByEdgeId.size !== edgeCount ||
    sourceById.size !== edgeCount ||
    quantizationById.size !== edgeCount ||
    classByEdgeId.size !== edgeCount
  ) {
    addViolation(
      violations,
      'source-binding',
      '$.request.source.orderedTree.edges',
      'cardinality-mismatch',
      'every tree edge must have one distinct mapping, source branch, classification, and quantization',
    );
    return undefined;
  }

  const riverDimensionInputs: PolygonRiverPackingProblemResultV1['riverDimensionInputs'][number][] =
    [];
  for (let index = 0; index < treeEdges.length; index += 1) {
    const edge = treeEdges[index];
    if (edge === undefined) {
      addViolation(
        violations,
        'source-binding',
        '$.request.source.orderedTree.edges',
        'cardinality-mismatch',
        'tree edge collection must be dense',
      );
      return undefined;
    }
    if (index > 0 && compareCodeUnits(treeEdges[index - 1]?.id ?? '', edge.id) >= 0) {
      addViolation(
        violations,
        'source-binding',
        '$.request.source.orderedTree.edges',
        'order-mismatch',
        'tree edges must be strictly code-unit ordered',
      );
      return undefined;
    }
    const mapping = mappingByEdgeId.get(edge.id);
    const source = sourceById.get(edge.id);
    const quantization = quantizationById.get(edge.id);
    const branchClass = classByEdgeId.get(edge.id);
    if (
      mapping === undefined ||
      source === undefined ||
      quantization === undefined ||
      branchClass === undefined ||
      mapping.squareGridBranchId !== edge.id ||
      mapping.branchClass !== branchClass ||
      mapping.length !== edge.length ||
      mapping.width !== edge.width ||
      source.branchClass !== branchClass ||
      source.length !== edge.length ||
      source.width !== edge.width ||
      quantization.branchClass !== branchClass ||
      quantization.length.sourceValue !== edge.length ||
      quantization.width.sourceValue !== edge.width
    ) {
      addViolation(
        violations,
        'source-binding',
        `$.request.source.orderedTree.edges.${edge.id}`,
        'source-mismatch',
        'edge, mapping, source branch, classification, and candidate quantization must agree exactly',
      );
      return undefined;
    }
    if (
      canonicalNonnegativeInteger(
        quantization.length.steps,
        `$.result.candidateReference.branchQuantizations.${edge.id}.length.steps`,
        violations,
      ) === undefined ||
      canonicalNonnegativeInteger(
        quantization.width.steps,
        `$.result.candidateReference.branchQuantizations.${edge.id}.width.steps`,
        violations,
      ) === undefined
    ) {
      return undefined;
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

  const leafNodeIds = tree.derived.leafNodeIds;
  if (
    leafNodeIds.length < 2 ||
    leafNodeIds.length > 20 ||
    leafNodeIds.some(
      (leafId, index) => index > 0 && compareCodeUnits(leafNodeIds[index - 1] ?? '', leafId) >= 0,
    )
  ) {
    addViolation(
      violations,
      'source-binding',
      '$.request.source.orderedTree.derived.leafNodeIds',
      'order-mismatch',
      'leaf IDs must be distinct, strictly code-unit ordered, and within the 2..20 bound',
    );
    return undefined;
  }

  const leafGridVertexVariables: PolygonRiverPackingProblemResultV1['leafGridVertexVariables'][number][] =
    leafNodeIds.map((leafNodeId) => ({
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
    }));

  const adjacency = new Map<string, AdjacencyEntry[]>();
  for (const node of tree.nodes) adjacency.set(node.id, []);
  for (const edge of treeEdges) {
    const from = adjacency.get(edge.from);
    const to = adjacency.get(edge.to);
    if (from === undefined || to === undefined) {
      addViolation(
        violations,
        'tree-path',
        `$.request.source.orderedTree.edges.${edge.id}`,
        'missing-tree-path',
        'tree edge endpoints must both exist',
      );
      return undefined;
    }
    from.push({ neighborId: edge.to, edgeId: edge.id });
    to.push({ neighborId: edge.from, edgeId: edge.id });
  }
  for (const entries of adjacency.values()) {
    entries.sort((left, right) => {
      const neighborOrder = compareCodeUnits(left.neighborId, right.neighborId);
      return neighborOrder !== 0 ? neighborOrder : compareCodeUnits(left.edgeId, right.edgeId);
    });
  }

  const separationConstraintInputs: PolygonRiverPackingProblemResultV1['separationConstraintInputs'][number][] =
    [];
  for (let firstIndex = 0; firstIndex < leafNodeIds.length - 1; firstIndex += 1) {
    const firstLeafId = leafNodeIds[firstIndex];
    if (firstLeafId === undefined) return undefined;
    for (let secondIndex = firstIndex + 1; secondIndex < leafNodeIds.length; secondIndex += 1) {
      const secondLeafId = leafNodeIds[secondIndex];
      if (secondLeafId === undefined) return undefined;
      const pathTreeEdgeIds = uniqueTreePath(firstLeafId, secondLeafId, adjacency, edgeCount);
      if (
        pathTreeEdgeIds === undefined ||
        pathTreeEdgeIds.length === 0 ||
        new Set(pathTreeEdgeIds).size !== pathTreeEdgeIds.length
      ) {
        addViolation(
          violations,
          'tree-path',
          `$.request.source.orderedTree.paths.${firstLeafId}.${secondLeafId}`,
          'missing-tree-path',
          'each distinct leaf pair must have one nonempty simple tree path',
        );
        return undefined;
      }
      let totalLength = 0n;
      let maximumWidth = 0n;
      for (const edgeId of pathTreeEdgeIds) {
        const quantization = quantizationById.get(edgeId);
        if (quantization === undefined) {
          addViolation(
            violations,
            'source-binding',
            `$.request.source.orderedTree.paths.${firstLeafId}.${secondLeafId}.${edgeId}`,
            'source-mismatch',
            'path edge must have one candidate quantization',
          );
          return undefined;
        }
        const length = canonicalNonnegativeInteger(
          quantization.length.steps,
          `$.result.candidateReference.branchQuantizations.${edgeId}.length.steps`,
          violations,
        );
        const width = canonicalNonnegativeInteger(
          quantization.width.steps,
          `$.result.candidateReference.branchQuantizations.${edgeId}.width.steps`,
          violations,
        );
        if (length === undefined || width === undefined) return undefined;
        totalLength += length;
        if (width > maximumWidth) maximumWidth = width;
      }
      separationConstraintInputs.push({
        firstLeafId,
        secondLeafId,
        totalLengthSteps: totalLength.toString(),
        maximumWidthSteps: maximumWidth.toString(),
        pathTreeEdgeIds: [...pathTreeEdgeIds],
      });
    }
  }

  const expectedLeafPairCount = (leafNodeIds.length * (leafNodeIds.length - 1)) / 2;
  if (separationConstraintInputs.length !== expectedLeafPairCount) {
    addViolation(
      violations,
      'tree-path',
      '$.result.separationConstraintInputs',
      'cardinality-mismatch',
      'separation inputs must cover every unordered leaf pair exactly once',
    );
    return undefined;
  }

  const residualX = parseExactRationalJsonV1(candidate.residualStrips.xAxis);
  const residualY = parseExactRationalJsonV1(candidate.residualStrips.yAxis);
  if (!residualX.ok || !residualY.ok) {
    addViolation(
      violations,
      'exact-arithmetic',
      '$.result.candidateReference.residualStrips',
      'arithmetic-mismatch',
      'selected-candidate validation must yield canonical exact residual strips',
    );
    return undefined;
  }
  const positiveResidualStrips: PolygonRiverPackingProblemResultV1['positiveResidualStrips'][number][] =
    [];
  if (residualX.value.numerator > 0n) {
    positiveResidualStrips.push({
      axis: 'x',
      boundary: 'positive',
      size: { ...candidate.residualStrips.xAxis },
    });
  }
  if (residualY.value.numerator > 0n) {
    positiveResidualStrips.push({
      axis: 'y',
      boundary: 'positive',
      size: { ...candidate.residualStrips.yAxis },
    });
  }

  return {
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
      xAxis: { ...candidate.residualStrips.xAxis },
      yAxis: { ...candidate.residualStrips.yAxis },
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
      treeEdgeCount: edgeCount,
      mappedBranchCount: mappings.length,
      sourceBranchCount: sourceBranches.length,
      candidateBranchQuantizationCount: quantizations.length,
      riverDimensionInputCount: riverDimensionInputs.length,
      leafCount: leafNodeIds.length,
      leafVariableCount: leafGridVertexVariables.length,
      leafPairCount: expectedLeafPairCount,
      separationConstraintInputCount: separationConstraintInputs.length,
    },
  };
}

/**
 * Independently validates one polygon/river packing-problem response against a
 * closed request. It does not call the problem builder, path-demand builder, or
 * any candidate enumerator. In particular, success means selected-candidate
 * arithmetic/source consistency only; it does not attest that candidateId is a
 * member of a bounded enumeration, nor does it attest placement, packing,
 * feasibility, or GO.
 */
export function validatePolygonRiverPackingProblemResultV1(
  request: unknown,
  result: unknown,
): PolygonRiverPackingProblemResultValidationV1 {
  const violations: Violation[] = [];
  const parsedRequest = parsePolygonRiverPackingProblemInputV1(request);
  if (!parsedRequest.ok) {
    for (const issue of parsedRequest.error) {
      addViolation(
        violations,
        'request-input',
        prefixPath('$.request', issue.path),
        'invalid-request',
        issue.message,
        issue.stage,
        issue.code,
      );
    }
    return failure(violations);
  }

  const adapter = adaptOrderedTreeToSquareGridCandidateInputV1(parsedRequest.value.source);
  if (!adapter.ok) {
    for (const issue of adapter.error) {
      addViolation(
        violations,
        'ordered-tree-adapter',
        prefixPath('$.request.source', issue.path),
        'invalid-request',
        issue.message,
        issue.stage,
        issue.code,
      );
    }
    return failure(violations);
  }

  const snapshot = tryCreateStrictValidationSnapshot(result, {
    maxArrayLength: POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxArrayLength,
    maxContainerCount: POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxContainerCount,
    maxDepth: POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxDepth,
    maxObjectPropertyCount:
      POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxObjectPropertyCount,
    maxPropertyNameCodeUnits:
      POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxPropertyNameCodeUnits,
    maxStringCodeUnits: POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxStringCodeUnits,
    maxTotalStringCodeUnits:
      POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxTotalStringCodeUnits,
    maxTotalPropertyCount:
      POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxTotalPropertyCount,
  });
  if (!snapshot.ok) {
    addViolation(
      violations,
      'result-snapshot',
      '$.result',
      'invalid-snapshot',
      'result must be one bounded acyclic accessor-free plain snapshot',
    );
    return failure(violations);
  }
  if (!isRecord(snapshot.value)) {
    addViolation(
      violations,
      'result-structure',
      '$.result',
      'invalid-object',
      'polygon/river packing problem result must be an object',
    );
    return failure(violations);
  }

  const raw = snapshot.value;
  closedKeys(raw, ROOT_KEYS, '$.result', violations);
  const selectedCandidate = validateSquareGridSelectedCandidateV1(
    adapter.value.squareGridInput,
    raw.candidateReference,
  );
  if (!selectedCandidate.ok) {
    candidateViolations(selectedCandidate.violations, violations);
    return failure(violations);
  }
  if (selectedCandidate.value.candidateId !== parsedRequest.value.candidateId) {
    addViolation(
      violations,
      'candidate-reference',
      '$.result.candidateReference.candidateId',
      'candidate-id-mismatch',
      'candidateReference.candidateId must equal the closed request candidateId',
    );
  }

  const expected = deriveExpectedResult(adapter.value, selectedCandidate.value, violations);
  if (expected === undefined) return failure(violations);

  const expectedRecord = expected as Readonly<Record<string, unknown>>;
  for (const key of ROOT_KEYS) {
    if (key !== 'candidateReference' && Object.hasOwn(raw, key)) {
      compareExpected(raw[key], expectedRecord[key], `$.result.${key}`, violations);
    }
  }
  if (violations.length > 0) return failure(violations);

  return deepFreezeOwned({ ok: true as const, value: deepFreezeOwned(expected) });
}
