import { deepFreezeOwned } from '../clone-and-freeze.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import { type OrderedTreeGridQuantizationInputV1 } from './ordered-tree-grid-quantization.js';
import {
  buildPolygonRiverPackingProblemV1,
  POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
  POLYGON_RIVER_PACKING_PROBLEM_LIMITS,
  type CompactInclusiveIntegerDomainV1,
  type PolygonRiverPackingProblemIssue,
  type PolygonRiverPackingProblemResultV1,
} from './polygon-river-packing-problem.js';
import { SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS } from './square-grid-candidates.js';

export const POLYGON_RIVER_SEARCH_SPACE_INPUT_RECORD_TYPE =
  'm0f-polygon-river-search-space-input' as const;
export const POLYGON_RIVER_SEARCH_SPACE_RESULT_RECORD_TYPE =
  'm0f-polygon-river-search-space-result' as const;

/** Defensive computation ceilings, not capacity, support, or performance claims. */
export const POLYGON_RIVER_SEARCH_SPACE_LIMITS = deepFreezeOwned({
  maxColumns: SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxColumns,
  maxRows: SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxRows,
  maxLeaves: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxLeaves,
});

export type PolygonRiverSearchSpaceInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof POLYGON_RIVER_SEARCH_SPACE_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  source: OrderedTreeGridQuantizationInputV1;
  candidateId: string;
}>;

export type PolygonRiverPerLeafSearchDomainV1 = Readonly<{
  leafNodeId: string;
  x: CompactInclusiveIntegerDomainV1;
  y: CompactInclusiveIntegerDomainV1;
  /** Canonical nonnegative base-10 BigInt decimal. */
  gridVertexDomainCardinality: string;
}>;

export type PolygonRiverSearchSpaceAuditV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof POLYGON_RIVER_SEARCH_SPACE_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'metric-independent-exact-finite-search-space-cardinality-audit-only';
  interpretation: 'raw Cartesian leaf-to-grid-vertex assignment space before all constraints';
  exactIntegerEncoding: 'canonical-nonnegative-base-10-bigint-decimal';
  rawCartesianProductRole: 'constraint-free-upper-bound-and-enumeration-domain-cardinality';
  coordinateCoincidenceIncludedInRawProduct: true;
  distinctnessConstraintApplied: false;
  nonoverlapConstraintApplied: false;
  separationConstraintApplied: false;
  metricDependent: false;
  metricSelectionIncluded: false;
  constraintEvaluationIncluded: false;
  assignmentEnumerationIncluded: false;
  assignmentMaterializationIncluded: false;
  solverIncluded: false;
  placementIncluded: false;
  packingIncluded: false;
  geometryIncluded: false;
  creasePatternIncluded: false;
  mountainValleyIncluded: false;
  foldabilityIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  capacityClaim: false;
  supportClaim: false;
  performanceClaim: false;
  activeGridDomain: Readonly<{
    columns: number;
    rows: number;
  }>;
  /** `(columns + 1) * (rows + 1)`, as a canonical BigInt decimal. */
  gridVertexDomainCardinality: string;
  leafCount: number;
  /** `gridVertexDomainCardinality ^ leafCount`, before every constraint. */
  rawCartesianAssignmentCount: string;
  perLeafDomainOrder: 'leaf-node-id-code-unit';
  perLeafDomains: readonly PolygonRiverPerLeafSearchDomainV1[];
  /** Full candidate and both residual axes are retained inside this reference. */
  packingProblemReference: PolygonRiverPackingProblemResultV1;
}>;

export type PolygonRiverSearchSpaceIssue = Readonly<{
  stage:
    | 'snapshot'
    | 'search-space-input'
    | 'packing-problem'
    | 'source-binding'
    | 'cardinality'
    | 'search-space-internal';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
}>;

export type PolygonRiverSearchSpaceBuildResult =
  | Readonly<{ ok: true; value: PolygonRiverSearchSpaceAuditV1 }>
  | Readonly<{ ok: false; error: readonly PolygonRiverSearchSpaceIssue[] }>;

type SearchSpaceFailure = Extract<PolygonRiverSearchSpaceBuildResult, { ok: false }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'source',
  'candidateId',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function oneIssue(
  stage: PolygonRiverSearchSpaceIssue['stage'],
  path: string,
  code: string,
  message: string,
  sourceStage?: string,
): SearchSpaceFailure {
  const issue: PolygonRiverSearchSpaceIssue =
    sourceStage === undefined
      ? { stage, path, code, message }
      : { stage, path, code, message, sourceStage };
  return deepFreezeOwned({ ok: false as const, error: [issue] });
}

function rootIssues(raw: Record<string, unknown>): readonly PolygonRiverSearchSpaceIssue[] {
  const issues: PolygonRiverSearchSpaceIssue[] = [];
  const allowed = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      issues.push({
        stage: 'search-space-input',
        path: `$.${key}`,
        code: 'unknown-field',
        message: 'field is not declared by polygon/river search-space input v1',
      });
    }
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      issues.push({
        stage: 'search-space-input',
        path: `$.${key}`,
        code: 'missing-field',
        message: 'required field is missing',
      });
    }
  }
  if (raw.schemaVersion !== 1) {
    issues.push({
      stage: 'search-space-input',
      path: '$.schemaVersion',
      code: 'invalid-literal',
      message: 'must equal 1',
    });
  }
  if (raw.recordType !== POLYGON_RIVER_SEARCH_SPACE_INPUT_RECORD_TYPE) {
    issues.push({
      stage: 'search-space-input',
      path: '$.recordType',
      code: 'invalid-literal',
      message: `must equal ${POLYGON_RIVER_SEARCH_SPACE_INPUT_RECORD_TYPE}`,
    });
  }
  if (raw.contractStatus !== 'candidate') {
    issues.push({
      stage: 'search-space-input',
      path: '$.contractStatus',
      code: 'claim-boundary',
      message: 'must equal candidate',
    });
  }
  if (raw.scientificClaim !== false) {
    issues.push({
      stage: 'search-space-input',
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
      stage: 'search-space-input',
      path: '$.candidateId',
      code: 'invalid-candidate-id',
      message: 'must be a nonempty bounded string',
    });
  }
  return issues;
}

function packingIssues(
  issues: readonly PolygonRiverPackingProblemIssue[],
): readonly PolygonRiverSearchSpaceIssue[] {
  return issues.map((issue) => ({
    stage: 'packing-problem' as const,
    path: issue.path,
    code: issue.code,
    message: issue.message,
    sourceStage:
      issue.sourceStage === undefined ? issue.stage : `${issue.stage}/${issue.sourceStage}`,
  }));
}

function sameRational(
  first: Readonly<{ numerator: string; denominator: string }>,
  second: Readonly<{ numerator: string; denominator: string }>,
): boolean {
  return first.numerator === second.numerator && first.denominator === second.denominator;
}

function isExpectedDomain(value: unknown, maximum: number): boolean {
  if (!isRecord(value)) return false;
  return (
    value.representation === 'compact-inclusive-integer-range' &&
    value.minimum === 0 &&
    value.maximum === maximum &&
    value.step === 1
  );
}

function hasNullAssignedCoordinate(value: unknown): boolean {
  return isRecord(value) && value.assignedCoordinate === null;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function buildPolygonRiverSearchSpaceAuditUncheckedV1(
  supplied: unknown,
): PolygonRiverSearchSpaceBuildResult {
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
    return oneIssue(
      'snapshot',
      '$',
      'invalid-snapshot',
      'input must be one bounded acyclic plain snapshot without accessors',
    );
  }
  if (!isRecord(snapshot.value)) {
    return oneIssue(
      'search-space-input',
      '$',
      'invalid-object',
      'polygon/river search-space input must be an object',
    );
  }

  const issues = rootIssues(snapshot.value);
  if (issues.length !== 0) {
    return deepFreezeOwned({ ok: false as const, error: issues });
  }
  const candidateId = snapshot.value.candidateId;
  if (typeof candidateId !== 'string') throw new TypeError('candidate ID was already validated');

  // This composition boundary is mandatory: the search-space audit does not
  // independently reinterpret the ordered-tree or candidate source.
  const packing = buildPolygonRiverPackingProblemV1({
    schemaVersion: 1,
    recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    source: snapshot.value.source,
    candidateId,
  });
  if (!packing.ok) {
    return deepFreezeOwned({ ok: false as const, error: packingIssues(packing.error) });
  }

  const reference = packing.value;
  const columns = reference.activeGridDomain.columns;
  const rows = reference.activeGridDomain.rows;
  const candidate = reference.candidateReference;
  const leafVariables = reference.leafGridVertexVariables;
  const binding = reference.sourceBinding;
  const leafCount = binding.leafCount;
  if (
    !Number.isSafeInteger(columns) ||
    columns <= 0 ||
    columns > POLYGON_RIVER_SEARCH_SPACE_LIMITS.maxColumns ||
    !Number.isSafeInteger(rows) ||
    rows <= 0 ||
    rows > POLYGON_RIVER_SEARCH_SPACE_LIMITS.maxRows ||
    candidate.candidateId !== candidateId ||
    candidate.columns !== columns ||
    candidate.rows !== rows ||
    !sameRational(reference.candidateResidualStrips.xAxis, candidate.residualStrips.xAxis) ||
    !sameRational(reference.candidateResidualStrips.yAxis, candidate.residualStrips.yAxis)
  ) {
    return oneIssue(
      'source-binding',
      '$.candidateId',
      'candidate-domain-binding-mismatch',
      'packing reference candidate, active grid, and both residual axes must agree exactly',
    );
  }
  if (
    !Number.isSafeInteger(leafCount) ||
    leafCount < 2 ||
    leafCount > POLYGON_RIVER_SEARCH_SPACE_LIMITS.maxLeaves ||
    reference.sourceBinding.leafVariableCount !== leafCount ||
    leafVariables.length !== leafCount
  ) {
    return oneIssue(
      'source-binding',
      '$.source',
      'leaf-cardinality-mismatch',
      'packing reference leaf count and compact variables must agree within defensive ceilings',
    );
  }
  const treeEdgeCount = binding.treeEdgeCount;
  const expectedLeafPairCount = (leafCount * (leafCount - 1)) / 2;
  if (
    !Number.isSafeInteger(treeEdgeCount) ||
    treeEdgeCount < 1 ||
    treeEdgeCount > POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxTreeEdges ||
    binding.mappedBranchCount !== treeEdgeCount ||
    binding.sourceBranchCount !== treeEdgeCount ||
    binding.candidateBranchQuantizationCount !== treeEdgeCount ||
    binding.riverDimensionInputCount !== treeEdgeCount ||
    candidate.branchQuantizations.length !== treeEdgeCount ||
    reference.riverDimensionInputs.length !== treeEdgeCount ||
    !Number.isSafeInteger(expectedLeafPairCount) ||
    expectedLeafPairCount > POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxLeafPairs ||
    binding.leafPairCount !== expectedLeafPairCount ||
    binding.separationConstraintInputCount !== expectedLeafPairCount ||
    reference.separationConstraintInputs.length !== expectedLeafPairCount
  ) {
    return oneIssue(
      'source-binding',
      '$.packingProblemReference.sourceBinding',
      'source-cardinality-mismatch',
      'tree-edge, branch, river, leaf-pair, and separation input cardinalities must agree exactly',
    );
  }

  const leafIds = new Set<string>();
  for (let index = 0; index < leafVariables.length; index += 1) {
    const variable = leafVariables[index];
    if (
      variable === undefined ||
      variable.leafNodeId.length === 0 ||
      leafIds.has(variable.leafNodeId) ||
      (index > 0 &&
        compareCodeUnits(leafVariables[index - 1]?.leafNodeId ?? '', variable.leafNodeId) >= 0) ||
      !isExpectedDomain(variable.x, columns) ||
      !isExpectedDomain(variable.y, rows) ||
      !hasNullAssignedCoordinate(variable)
    ) {
      return oneIssue(
        'source-binding',
        `$.packingProblemReference.leafGridVertexVariables[${String(index)}]`,
        'leaf-domain-binding-mismatch',
        'each canonical leaf must retain one unassigned full active-grid compact domain',
      );
    }
    leafIds.add(variable.leafNodeId);
  }

  const domainCardinality = (BigInt(columns) + 1n) * (BigInt(rows) + 1n);
  if (domainCardinality <= 0n) {
    return oneIssue(
      'cardinality',
      '$.activeGridDomain',
      'invalid-domain-cardinality',
      'active grid must induce one positive finite grid-vertex domain',
    );
  }
  const rawCartesianAssignmentCount = domainCardinality ** BigInt(leafCount);
  const domainCardinalityDecimal = domainCardinality.toString();
  const perLeafDomains: PolygonRiverPerLeafSearchDomainV1[] = leafVariables.map((variable) => ({
    leafNodeId: variable.leafNodeId,
    x: {
      representation: 'compact-inclusive-integer-range',
      minimum: variable.x.minimum,
      maximum: variable.x.maximum,
      step: 1,
    },
    y: {
      representation: 'compact-inclusive-integer-range',
      minimum: variable.y.minimum,
      maximum: variable.y.maximum,
      step: 1,
    },
    gridVertexDomainCardinality: domainCardinalityDecimal,
  }));
  if (
    perLeafDomains.length !== leafCount ||
    perLeafDomains.some(
      (domain, index) =>
        domain.leafNodeId !== leafVariables[index]?.leafNodeId ||
        domain.gridVertexDomainCardinality !== domainCardinalityDecimal,
    )
  ) {
    return oneIssue(
      'cardinality',
      '$.perLeafDomains',
      'per-leaf-cardinality-mismatch',
      'every leaf domain must retain the same exact full-grid cardinality',
    );
  }

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: POLYGON_RIVER_SEARCH_SPACE_RESULT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      scope: 'metric-independent-exact-finite-search-space-cardinality-audit-only' as const,
      interpretation:
        'raw Cartesian leaf-to-grid-vertex assignment space before all constraints' as const,
      exactIntegerEncoding: 'canonical-nonnegative-base-10-bigint-decimal' as const,
      rawCartesianProductRole:
        'constraint-free-upper-bound-and-enumeration-domain-cardinality' as const,
      coordinateCoincidenceIncludedInRawProduct: true as const,
      distinctnessConstraintApplied: false as const,
      nonoverlapConstraintApplied: false as const,
      separationConstraintApplied: false as const,
      metricDependent: false as const,
      metricSelectionIncluded: false as const,
      constraintEvaluationIncluded: false as const,
      assignmentEnumerationIncluded: false as const,
      assignmentMaterializationIncluded: false as const,
      solverIncluded: false as const,
      placementIncluded: false as const,
      packingIncluded: false as const,
      geometryIncluded: false as const,
      creasePatternIncluded: false as const,
      mountainValleyIncluded: false as const,
      foldabilityIncluded: false as const,
      feasibilityDecisionIncluded: false as const,
      globalM0fGo: false as const,
      capacityClaim: false as const,
      supportClaim: false as const,
      performanceClaim: false as const,
      activeGridDomain: { columns, rows },
      gridVertexDomainCardinality: domainCardinalityDecimal,
      leafCount,
      rawCartesianAssignmentCount: rawCartesianAssignmentCount.toString(),
      perLeafDomainOrder: 'leaf-node-id-code-unit' as const,
      perLeafDomains,
      packingProblemReference: reference,
    },
  });
}

/**
 * Audits only the exact finite raw Cartesian search-space cardinality. It does
 * not enumerate assignments, evaluate constraints, select a metric, solve,
 * place, pack, construct geometry, or make feasibility/support/GO claims.
 */
export function buildPolygonRiverSearchSpaceAuditV1(
  supplied: unknown,
): PolygonRiverSearchSpaceBuildResult {
  try {
    return buildPolygonRiverSearchSpaceAuditUncheckedV1(supplied);
  } catch {
    return oneIssue(
      'search-space-internal',
      '$',
      'unexpected-search-space-failure',
      'search-space audit failed closed because of an unexpected internal condition',
    );
  }
}
