import { deepFreezeOwned } from '../clone-and-freeze.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  parseBoxPleatingPackingSemanticsV1,
  type BoxPleatingPackingSemanticsIssue,
  type BoxPleatingPackingSemanticsV1,
} from './packing-semantics.js';
import {
  buildPolygonRiverPackingProblemV1,
  type PolygonRiverPackingProblemInputV1,
  type PolygonRiverPackingProblemIssue,
  type PolygonRiverPackingProblemResultV1,
} from './polygon-river-packing-problem.js';

export const EUCLIDEAN_NECESSARY_FILTER_INPUT_RECORD_TYPE =
  'm0f-euclidean-necessary-filter-input' as const;
export const EUCLIDEAN_NECESSARY_FILTER_RESULT_RECORD_TYPE =
  'm0f-euclidean-necessary-filter-result' as const;

/** Defensive parser ceilings only; these are not product support claims. */
export const EUCLIDEAN_NECESSARY_FILTER_LIMITS = deepFreezeOwned({
  maxArrayLength: 40,
  maxContainerCount: 384,
  maxDepth: 10,
  maxObjectPropertyCount: 64,
  maxPropertyNameCodeUnits: 64,
  maxStringCodeUnits: 4_096,
  maxTotalStringCodeUnits: 300_000,
  maxTotalPropertyCount: 2_500,
  maxLeafAssignments: 20,
});

export type ProjectedLeafAnchorAssignmentV1 = Readonly<{
  leafNodeId: string;
  x: number;
  y: number;
}>;

export type EuclideanNecessaryFilterInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof EUCLIDEAN_NECESSARY_FILTER_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  semantics: BoxPleatingPackingSemanticsV1;
  packingProblemInput: PolygonRiverPackingProblemInputV1;
  leafAssignments: readonly ProjectedLeafAnchorAssignmentV1[];
}>;

export type EuclideanNecessaryPairEvaluationV1 = Readonly<{
  firstLeafId: string;
  secondLeafId: string;
  /** Canonical nonnegative base-10 integer in grid-index units. */
  absoluteDeltaX: string;
  /** Canonical nonnegative base-10 integer in grid-index units. */
  absoluteDeltaY: string;
  /** Canonical nonnegative base-10 integer in squared grid-index units. */
  actualSquaredDistance: string;
  /** Canonical nonnegative base-10 integer in squared grid-index units. */
  requiredSquaredDistance: string;
  /** Source path demand retained for auditability. */
  totalLengthSteps: string;
  /** Trace only and deliberately unused by this filter. */
  maximumWidthSteps: string;
  passesNecessaryFilter: boolean;
}>;

export type EuclideanNecessaryFilterResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof EUCLIDEAN_NECESSARY_FILTER_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'assigned-projected-leaf-anchor-euclidean-necessary-filter-only';
  interpretation: 'one exact pairwise necessary filter over caller-assigned projected leaf anchors';
  semanticsReference: BoxPleatingPackingSemanticsV1;
  packingProblemReference: PolygonRiverPackingProblemResultV1;
  assignmentRole: 'projected-leaf-anchors-only-not-polygon-placement';
  leafAssignmentOrder: 'leaf-node-id-code-unit';
  leafAssignments: readonly ProjectedLeafAnchorAssignmentV1[];
  pairEvaluationOrder: 'packing-problem-separation-constraint-order';
  pairEvaluations: readonly EuclideanNecessaryPairEvaluationV1[];
  coordinateScale: 'one-grid-index-unit-per-quantized-length-step';
  evaluatedRelation: 'dx-squared-plus-dy-squared-at-least-total-length-steps-squared';
  tangencyPolicy: 'allowed-at-equality-for-this-filter';
  filterStrength: 'necessary-only';
  filterEvaluationIncluded: true;
  assignmentIncluded: true;
  allNecessaryFiltersPass: boolean;
  failedPairCount: number;
  assignmentRejectedByNecessaryFilter: boolean;
  passingIsPackingSufficiencyEvidence: false;
  failureIsGlobalNoSolutionEvidence: false;
  widthUsedByFilter: false;
  maximumWidthRole: 'trace-only-without-separation-or-packing-semantics';
  manhattanMetricEvaluated: false;
  chebyshevMetricEvaluated: false;
  globalMetricSelectionIncluded: false;
  constructionFamily: 'unresolved';
  constructionFamilySelectionIncluded: false;
  actualGeometryIncluded: false;
  globalPackingIncluded: false;
  packingIncluded: false;
  polygonRiverPackingIncluded: false;
  automaticSearchIncluded: false;
  solverIncluded: false;
  polygonGeometryIncluded: false;
  riverGeometryIncluded: false;
  placementIncluded: false;
  hingeConstructionIncluded: false;
  ridgeConstructionIncluded: false;
  axialConstructionIncluded: false;
  junctionConstructionIncluded: false;
  pleatRoutingIncluded: false;
  creasePatternIncluded: false;
  mountainValleyIncluded: false;
  foldabilityIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  isSupportProfile: false;
  supportClaim: false;
}>;

export type EuclideanNecessaryFilterIssue = Readonly<{
  stage: 'snapshot' | 'filter-input' | 'semantics' | 'packing-problem' | 'assignment';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
}>;

export type EuclideanNecessaryFilterEvaluationResult =
  | Readonly<{ ok: true; value: EuclideanNecessaryFilterResultV1 }>
  | Readonly<{ ok: false; error: readonly EuclideanNecessaryFilterIssue[] }>;

type EvaluationFailure = Extract<EuclideanNecessaryFilterEvaluationResult, { ok: false }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'semantics',
  'packingProblemInput',
  'leafAssignments',
] as const;
const ASSIGNMENT_KEYS = ['leafNodeId', 'x', 'y'] as const;
const NONNEGATIVE_DECIMAL_PATTERN = /^(?:0|[1-9][0-9]*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issue(
  stage: EuclideanNecessaryFilterIssue['stage'],
  path: string,
  code: string,
  message: string,
  sourceStage?: string,
): EuclideanNecessaryFilterIssue {
  return sourceStage === undefined
    ? { stage, path, code, message }
    : { stage, path, code, message, sourceStage };
}

function failure(error: readonly EuclideanNecessaryFilterIssue[]): EvaluationFailure {
  return deepFreezeOwned({ ok: false, error: [...error] });
}

function prefixedPath(prefix: string, path: string): string {
  if (path === '$') return prefix;
  if (path.startsWith('$')) return `${prefix}${path.slice(1)}`;
  return `${prefix}.${path}`;
}

function semanticsIssues(
  issues: readonly BoxPleatingPackingSemanticsIssue[],
): readonly EuclideanNecessaryFilterIssue[] {
  return issues.map((entry) =>
    issue('semantics', prefixedPath('$.semantics', entry.path), entry.code, entry.message),
  );
}

function packingProblemIssues(
  issues: readonly PolygonRiverPackingProblemIssue[],
): readonly EuclideanNecessaryFilterIssue[] {
  return issues.map((entry) =>
    issue(
      'packing-problem',
      prefixedPath('$.packingProblemInput', entry.path),
      entry.code,
      entry.message,
      entry.sourceStage === undefined ? entry.stage : `${entry.stage}/${entry.sourceStage}`,
    ),
  );
}

function validateClosedRoot(
  raw: Record<string, unknown>,
): readonly EuclideanNecessaryFilterIssue[] {
  const issues: EuclideanNecessaryFilterIssue[] = [];
  const allowed = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(raw).sort()) {
    if (!allowed.has(key)) {
      issues.push(
        issue(
          'filter-input',
          `$.${key}`,
          'unknown-field',
          'field is not declared by Euclidean necessary filter input v1',
        ),
      );
    }
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      issues.push(issue('filter-input', `$.${key}`, 'missing-field', 'required field is missing'));
    }
  }
  if (raw.schemaVersion !== 1) {
    issues.push(issue('filter-input', '$.schemaVersion', 'invalid-literal', 'must equal 1'));
  }
  if (raw.recordType !== EUCLIDEAN_NECESSARY_FILTER_INPUT_RECORD_TYPE) {
    issues.push(
      issue(
        'filter-input',
        '$.recordType',
        'invalid-literal',
        `must equal ${EUCLIDEAN_NECESSARY_FILTER_INPUT_RECORD_TYPE}`,
      ),
    );
  }
  if (raw.contractStatus !== 'candidate') {
    issues.push(
      issue('filter-input', '$.contractStatus', 'claim-boundary', 'must equal candidate'),
    );
  }
  if (raw.scientificClaim !== false) {
    issues.push(issue('filter-input', '$.scientificClaim', 'claim-boundary', 'must equal false'));
  }
  return issues;
}

function validateAssignmentRecords(raw: unknown): Readonly<{
  issues: readonly EuclideanNecessaryFilterIssue[];
  values: readonly ProjectedLeafAnchorAssignmentV1[];
}> {
  if (!Array.isArray(raw)) {
    return {
      issues: [issue('assignment', '$.leafAssignments', 'invalid-array', 'must be a dense array')],
      values: [],
    };
  }
  if (raw.length > EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxLeafAssignments) {
    return {
      issues: [
        issue(
          'assignment',
          '$.leafAssignments',
          'assignment-limit',
          `must contain at most ${EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxLeafAssignments} entries`,
        ),
      ],
      values: [],
    };
  }

  const issues: EuclideanNecessaryFilterIssue[] = [];
  const values: ProjectedLeafAnchorAssignmentV1[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const path = `$.leafAssignments[${String(index)}]`;
    const entry: unknown = raw[index];
    if (!isRecord(entry)) {
      issues.push(issue('assignment', path, 'invalid-object', 'assignment must be an object'));
      continue;
    }
    const allowed = new Set<string>(ASSIGNMENT_KEYS);
    for (const key of Object.keys(entry).sort()) {
      if (!allowed.has(key)) {
        issues.push(
          issue(
            'assignment',
            `${path}.${key}`,
            'unknown-field',
            'field is not declared by projected leaf anchor assignment v1',
          ),
        );
      }
    }
    for (const key of ASSIGNMENT_KEYS) {
      if (!Object.hasOwn(entry, key)) {
        issues.push(
          issue('assignment', `${path}.${key}`, 'missing-field', 'required field is missing'),
        );
      }
    }
    const leafNodeId = entry.leafNodeId;
    const x = entry.x;
    const y = entry.y;
    if (typeof leafNodeId !== 'string' || leafNodeId.length === 0) {
      issues.push(
        issue('assignment', `${path}.leafNodeId`, 'invalid-leaf-id', 'must be a nonempty string'),
      );
    }
    if (typeof x !== 'number' || !Number.isSafeInteger(x)) {
      issues.push(issue('assignment', `${path}.x`, 'invalid-coordinate', 'must be a safe integer'));
    }
    if (typeof y !== 'number' || !Number.isSafeInteger(y)) {
      issues.push(issue('assignment', `${path}.y`, 'invalid-coordinate', 'must be a safe integer'));
    }
    if (
      typeof leafNodeId === 'string' &&
      leafNodeId.length > 0 &&
      typeof x === 'number' &&
      Number.isSafeInteger(x) &&
      typeof y === 'number' &&
      Number.isSafeInteger(y)
    ) {
      values.push({ leafNodeId, x: x === 0 ? 0 : x, y: y === 0 ? 0 : y });
    }
  }
  return { issues, values };
}

function canonicalAssignments(
  supplied: readonly ProjectedLeafAnchorAssignmentV1[],
  problem: PolygonRiverPackingProblemResultV1,
):
  | Readonly<{ ok: true; value: readonly ProjectedLeafAnchorAssignmentV1[] }>
  | Readonly<{ ok: false; error: readonly EuclideanNecessaryFilterIssue[] }> {
  const issues: EuclideanNecessaryFilterIssue[] = [];
  const expectedLeafIds = problem.leafGridVertexVariables.map((entry) => entry.leafNodeId);
  const expected = new Set(expectedLeafIds);
  const assignmentByLeafId = new Map<string, ProjectedLeafAnchorAssignmentV1>();
  for (const assignment of supplied) {
    if (assignmentByLeafId.has(assignment.leafNodeId)) {
      issues.push(
        issue(
          'assignment',
          '$.leafAssignments',
          'duplicate-leaf-assignment',
          `leaf ${assignment.leafNodeId} must occur exactly once`,
        ),
      );
      continue;
    }
    assignmentByLeafId.set(assignment.leafNodeId, assignment);
    if (!expected.has(assignment.leafNodeId)) {
      issues.push(
        issue(
          'assignment',
          '$.leafAssignments',
          'unknown-leaf-assignment',
          `leaf ${assignment.leafNodeId} is not declared by the packing problem`,
        ),
      );
    }
    if (
      assignment.x < 0 ||
      assignment.x > problem.activeGridDomain.columns ||
      assignment.y < 0 ||
      assignment.y > problem.activeGridDomain.rows
    ) {
      issues.push(
        issue(
          'assignment',
          '$.leafAssignments',
          'coordinate-out-of-bounds',
          `leaf ${assignment.leafNodeId} must lie on an active-grid vertex`,
        ),
      );
    }
  }
  for (const leafNodeId of expectedLeafIds) {
    if (!assignmentByLeafId.has(leafNodeId)) {
      issues.push(
        issue(
          'assignment',
          '$.leafAssignments',
          'missing-leaf-assignment',
          `leaf ${leafNodeId} must occur exactly once`,
        ),
      );
    }
  }
  if (supplied.length !== expectedLeafIds.length) {
    issues.push(
      issue(
        'assignment',
        '$.leafAssignments',
        'assignment-cardinality-mismatch',
        'assignment count must equal the packing-problem leaf count',
      ),
    );
  }
  if (issues.length > 0) return { ok: false, error: issues };

  const values: ProjectedLeafAnchorAssignmentV1[] = [];
  for (const leafNodeId of expectedLeafIds) {
    const assignment = assignmentByLeafId.get(leafNodeId);
    if (assignment === undefined) {
      return {
        ok: false,
        error: [
          issue(
            'assignment',
            '$.leafAssignments',
            'missing-leaf-assignment',
            `leaf ${leafNodeId} must occur exactly once`,
          ),
        ],
      };
    }
    values.push(assignment);
  }
  return { ok: true, value: values };
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

/**
 * Evaluates only the declared squared-Euclidean pairwise necessary relation
 * for one complete caller assignment of projected leaf anchors.
 */
export function evaluateEuclideanNecessaryFilterV1(
  supplied: unknown,
): EuclideanNecessaryFilterEvaluationResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxArrayLength,
    maxContainerCount: EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxContainerCount,
    maxDepth: EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxDepth,
    maxObjectPropertyCount: EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxObjectPropertyCount,
    maxPropertyNameCodeUnits: EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxPropertyNameCodeUnits,
    maxStringCodeUnits: EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxStringCodeUnits,
    maxTotalStringCodeUnits: EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxTotalStringCodeUnits,
    maxTotalPropertyCount: EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxTotalPropertyCount,
  });
  if (!snapshot.ok) {
    return failure([
      issue(
        'snapshot',
        '$',
        'invalid-snapshot',
        'input must be one bounded acyclic plain snapshot without accessors',
      ),
    ]);
  }
  if (!isRecord(snapshot.value)) {
    return failure([
      issue('filter-input', '$', 'invalid-object', 'filter input must be an object'),
    ]);
  }

  const rootIssues = validateClosedRoot(snapshot.value);
  if (rootIssues.length > 0) return failure(rootIssues);

  const semantics = parseBoxPleatingPackingSemanticsV1(snapshot.value.semantics);
  if (!semantics.ok) return failure(semanticsIssues(semantics.error));

  const problem = buildPolygonRiverPackingProblemV1(snapshot.value.packingProblemInput);
  if (!problem.ok) return failure(packingProblemIssues(problem.error));

  const parsedAssignments = validateAssignmentRecords(snapshot.value.leafAssignments);
  if (parsedAssignments.issues.length > 0) return failure(parsedAssignments.issues);
  const assignments = canonicalAssignments(parsedAssignments.values, problem.value);
  if (!assignments.ok) return failure(assignments.error);

  const assignmentByLeafId = new Map(
    assignments.value.map((entry) => [entry.leafNodeId, entry] as const),
  );
  const pairEvaluations: EuclideanNecessaryPairEvaluationV1[] = [];
  let failedPairCount = 0;
  for (let index = 0; index < problem.value.separationConstraintInputs.length; index += 1) {
    const constraint = problem.value.separationConstraintInputs[index];
    if (constraint === undefined) {
      return failure([
        issue(
          'assignment',
          `$.packingProblemInput.separationConstraintInputs[${String(index)}]`,
          'missing-separation-constraint',
          'separation constraint array must be dense',
        ),
      ]);
    }
    const first = assignmentByLeafId.get(constraint.firstLeafId);
    const second = assignmentByLeafId.get(constraint.secondLeafId);
    if (first === undefined || second === undefined) {
      return failure([
        issue(
          'assignment',
          `$.packingProblemInput.separationConstraintInputs[${String(index)}]`,
          'pair-assignment-binding-mismatch',
          'every separation pair must bind two assigned projected leaf anchors',
        ),
      ]);
    }
    if (!NONNEGATIVE_DECIMAL_PATTERN.test(constraint.totalLengthSteps)) {
      return failure([
        issue(
          'packing-problem',
          `$.packingProblemInput.separationConstraintInputs[${String(index)}].totalLengthSteps`,
          'invalid-step-integer',
          'path length must be a canonical nonnegative base-10 integer',
        ),
      ]);
    }

    const deltaX = absolute(BigInt(first.x) - BigInt(second.x));
    const deltaY = absolute(BigInt(first.y) - BigInt(second.y));
    const actualSquaredDistance = deltaX * deltaX + deltaY * deltaY;
    const totalLengthSteps = BigInt(constraint.totalLengthSteps);
    const requiredSquaredDistance = totalLengthSteps * totalLengthSteps;
    const passesNecessaryFilter = actualSquaredDistance >= requiredSquaredDistance;
    if (!passesNecessaryFilter) failedPairCount += 1;
    pairEvaluations.push({
      firstLeafId: constraint.firstLeafId,
      secondLeafId: constraint.secondLeafId,
      absoluteDeltaX: deltaX.toString(),
      absoluteDeltaY: deltaY.toString(),
      actualSquaredDistance: actualSquaredDistance.toString(),
      requiredSquaredDistance: requiredSquaredDistance.toString(),
      totalLengthSteps: constraint.totalLengthSteps,
      maximumWidthSteps: constraint.maximumWidthSteps,
      passesNecessaryFilter,
    });
  }

  const allNecessaryFiltersPass = failedPairCount === 0;
  return deepFreezeOwned({
    ok: true as const,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: EUCLIDEAN_NECESSARY_FILTER_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'assigned-projected-leaf-anchor-euclidean-necessary-filter-only',
      interpretation:
        'one exact pairwise necessary filter over caller-assigned projected leaf anchors',
      semanticsReference: semantics.value,
      packingProblemReference: problem.value,
      assignmentRole: 'projected-leaf-anchors-only-not-polygon-placement',
      leafAssignmentOrder: 'leaf-node-id-code-unit',
      leafAssignments: assignments.value,
      pairEvaluationOrder: 'packing-problem-separation-constraint-order',
      pairEvaluations,
      coordinateScale: 'one-grid-index-unit-per-quantized-length-step',
      evaluatedRelation: 'dx-squared-plus-dy-squared-at-least-total-length-steps-squared',
      tangencyPolicy: 'allowed-at-equality-for-this-filter',
      filterStrength: 'necessary-only',
      filterEvaluationIncluded: true,
      assignmentIncluded: true,
      allNecessaryFiltersPass,
      failedPairCount,
      assignmentRejectedByNecessaryFilter: !allNecessaryFiltersPass,
      passingIsPackingSufficiencyEvidence: false,
      failureIsGlobalNoSolutionEvidence: false,
      widthUsedByFilter: false,
      maximumWidthRole: 'trace-only-without-separation-or-packing-semantics',
      manhattanMetricEvaluated: false,
      chebyshevMetricEvaluated: false,
      globalMetricSelectionIncluded: false,
      constructionFamily: 'unresolved',
      constructionFamilySelectionIncluded: false,
      actualGeometryIncluded: false,
      globalPackingIncluded: false,
      packingIncluded: false,
      polygonRiverPackingIncluded: false,
      automaticSearchIncluded: false,
      solverIncluded: false,
      polygonGeometryIncluded: false,
      riverGeometryIncluded: false,
      placementIncluded: false,
      hingeConstructionIncluded: false,
      ridgeConstructionIncluded: false,
      axialConstructionIncluded: false,
      junctionConstructionIncluded: false,
      pleatRoutingIncluded: false,
      creasePatternIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      isSupportProfile: false,
      supportClaim: false,
    }),
  });
}
