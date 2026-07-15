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
  type PolygonRiverSeparationConstraintInputV1,
} from './polygon-river-packing-problem.js';

export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE =
  'm0f-euclidean-necessary-witness-search-input' as const;
export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_RECORD_TYPE =
  'm0f-euclidean-necessary-witness-search-result' as const;

/** Defensive parser and explicit work ceilings, not product support claims. */
export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS = deepFreezeOwned({
  maxArrayLength: 40,
  maxContainerCount: 400,
  maxDepth: 10,
  maxObjectPropertyCount: 64,
  maxPropertyNameCodeUnits: 64,
  maxStringCodeUnits: 4_096,
  maxTotalStringCodeUnits: 320_000,
  maxTotalPropertyCount: 2_700,
  maxLeaves: 20,
  maxVisitedStates: 200_000,
  maxWitnesses: 8,
});

export type EuclideanNecessaryWitnessSearchInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  semantics: BoxPleatingPackingSemanticsV1;
  packingProblemInput: PolygonRiverPackingProblemInputV1;
  maxVisitedStates: number;
  maxWitnesses: number;
}>;

export type EuclideanNecessaryWitnessAssignmentV1 = Readonly<{
  leafNodeId: string;
  x: number;
  y: number;
}>;

export type EuclideanNecessaryWitnessPairEvaluationV1 = Readonly<{
  firstLeafId: string;
  secondLeafId: string;
  absoluteDeltaX: string;
  absoluteDeltaY: string;
  actualSquaredDistance: string;
  requiredSquaredDistance: string;
  totalLengthSteps: string;
  maximumWidthSteps: string;
  passesNecessaryFilter: true;
}>;

export type EuclideanNecessaryWitnessV1 = Readonly<{
  witnessIndex: number;
  assignmentRole: 'projected-leaf-anchors-only-not-polygon-placement';
  leafAssignmentOrder: 'leaf-node-id-code-unit';
  leafAssignments: readonly EuclideanNecessaryWitnessAssignmentV1[];
  pairEvaluationOrder: 'packing-problem-separation-constraint-order';
  pairEvaluations: readonly EuclideanNecessaryWitnessPairEvaluationV1[];
  allNecessaryPairFiltersPass: true;
  packingEvidence: false;
  geometryEvidence: false;
  placementEvidence: false;
}>;

export type EuclideanNecessaryWitnessSearchStatus =
  'witness-found' | 'budget-exhausted' | 'domain-exhausted';

export type EuclideanNecessaryWitnessSearchResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'bounded-active-grid-euclidean-necessary-filter-witness-search-only';
  interpretation: 'finite deterministic assignment search for pairwise necessary-filter witnesses only';
  semanticsReference: BoxPleatingPackingSemanticsV1;
  packingProblemReference: PolygonRiverPackingProblemResultV1;
  activeGridDomain: Readonly<{
    columns: number;
    rows: number;
    vertexCount: number;
  }>;
  leafAssignmentOrder: 'leaf-node-id-code-unit';
  gridVertexOrder: 'y-then-x';
  traversal: 'depth-first-canonical-leaf-order';
  visitedStateDefinition: 'one-attempted-leaf-to-grid-vertex-assignment-including-pruned-assignments';
  maxVisitedStates: number;
  maxWitnesses: number;
  visitedStates: number;
  searchStatus: EuclideanNecessaryWitnessSearchStatus;
  searchComplete: boolean;
  witnessCount: number;
  witnesses: readonly EuclideanNecessaryWitnessV1[];
  noNecessaryFilterWitnessInEnumeratedDomain: boolean;
  globalNoSolutionEvidence: false;
  packingInfeasibilityEvidence: false;
  coordinateDistinctnessConstraintIncluded: false;
  zeroDemandCoordinateCoincidenceAllowed: true;
  evaluatedRelation: 'dx-squared-plus-dy-squared-at-least-total-length-steps-squared';
  tangencyPolicy: 'allowed-at-equality-for-this-filter';
  widthUsedBySearch: false;
  maximumWidthRole: 'trace-only-without-separation-or-packing-semantics';
  assignmentSearchIncluded: true;
  necessaryFilterWitnessSearchIncluded: true;
  necessaryFilterEvaluationIncluded: true;
  filterOnlySearch: true;
  generalPolygonRiverPackingSolverIncluded: false;
  constructionFamily: 'unresolved';
  constructionFamilySelectionIncluded: false;
  geometryIncluded: false;
  actualGeometryIncluded: false;
  polygonGeometryIncluded: false;
  riverGeometryIncluded: false;
  junctionGeometryIncluded: false;
  placementIncluded: false;
  globalPackingIncluded: false;
  packingIncluded: false;
  polygonRiverPackingIncluded: false;
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

export type EuclideanNecessaryWitnessSearchIssue = Readonly<{
  stage: 'snapshot' | 'search-input' | 'semantics' | 'packing-problem' | 'search-binding';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
}>;

export type EuclideanNecessaryWitnessSearchEvaluationResult =
  | Readonly<{ ok: true; value: EuclideanNecessaryWitnessSearchResultV1 }>
  | Readonly<{ ok: false; error: readonly EuclideanNecessaryWitnessSearchIssue[] }>;

type SearchFailure = Extract<EuclideanNecessaryWitnessSearchEvaluationResult, { ok: false }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'semantics',
  'packingProblemInput',
  'maxVisitedStates',
  'maxWitnesses',
] as const;
const NONNEGATIVE_DECIMAL_PATTERN = /^(?:0|[1-9][0-9]*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issue(
  stage: EuclideanNecessaryWitnessSearchIssue['stage'],
  path: string,
  code: string,
  message: string,
  sourceStage?: string,
): EuclideanNecessaryWitnessSearchIssue {
  return sourceStage === undefined
    ? { stage, path, code, message }
    : { stage, path, code, message, sourceStage };
}

function failure(error: readonly EuclideanNecessaryWitnessSearchIssue[]): SearchFailure {
  return deepFreezeOwned({ ok: false, error: [...error] });
}

function prefixedPath(prefix: string, path: string): string {
  if (path === '$') return prefix;
  if (path.startsWith('$')) return `${prefix}${path.slice(1)}`;
  return `${prefix}.${path}`;
}

function semanticsIssues(
  issues: readonly BoxPleatingPackingSemanticsIssue[],
): readonly EuclideanNecessaryWitnessSearchIssue[] {
  return issues.map((entry) =>
    issue('semantics', prefixedPath('$.semantics', entry.path), entry.code, entry.message),
  );
}

function packingProblemIssues(
  issues: readonly PolygonRiverPackingProblemIssue[],
): readonly EuclideanNecessaryWitnessSearchIssue[] {
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
): readonly EuclideanNecessaryWitnessSearchIssue[] {
  const issues: EuclideanNecessaryWitnessSearchIssue[] = [];
  const allowed = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(raw).sort()) {
    if (!allowed.has(key)) {
      issues.push(
        issue(
          'search-input',
          `$.${key}`,
          'unknown-field',
          'field is not declared by Euclidean necessary witness search input v1',
        ),
      );
    }
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      issues.push(issue('search-input', `$.${key}`, 'missing-field', 'required field is missing'));
    }
  }
  if (raw.schemaVersion !== 1) {
    issues.push(issue('search-input', '$.schemaVersion', 'invalid-literal', 'must equal 1'));
  }
  if (raw.recordType !== EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE) {
    issues.push(
      issue(
        'search-input',
        '$.recordType',
        'invalid-literal',
        `must equal ${EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE}`,
      ),
    );
  }
  if (raw.contractStatus !== 'candidate') {
    issues.push(
      issue('search-input', '$.contractStatus', 'claim-boundary', 'must equal candidate'),
    );
  }
  if (raw.scientificClaim !== false) {
    issues.push(issue('search-input', '$.scientificClaim', 'claim-boundary', 'must equal false'));
  }
  if (
    typeof raw.maxVisitedStates !== 'number' ||
    !Number.isSafeInteger(raw.maxVisitedStates) ||
    raw.maxVisitedStates < 1 ||
    raw.maxVisitedStates > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxVisitedStates
  ) {
    issues.push(
      issue(
        'search-input',
        '$.maxVisitedStates',
        'invalid-work-budget',
        `must be a positive safe integer at most ${String(EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxVisitedStates)}`,
      ),
    );
  }
  if (
    typeof raw.maxWitnesses !== 'number' ||
    !Number.isSafeInteger(raw.maxWitnesses) ||
    raw.maxWitnesses < 1 ||
    raw.maxWitnesses > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxWitnesses
  ) {
    issues.push(
      issue(
        'search-input',
        '$.maxWitnesses',
        'invalid-witness-limit',
        `must be a safe integer from 1 through ${String(EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxWitnesses)}`,
      ),
    );
  }
  return issues;
}

interface PreparedSearch {
  readonly leafIds: readonly string[];
  readonly pairByLeafIds: ReadonlyMap<
    string,
    ReadonlyMap<string, PolygonRiverSeparationConstraintInputV1>
  >;
}

function prepareSearch(
  problem: PolygonRiverPackingProblemResultV1,
): Readonly<
  | { ok: true; value: PreparedSearch }
  | { ok: false; error: readonly EuclideanNecessaryWitnessSearchIssue[] }
> {
  const leafIds = problem.leafGridVertexVariables.map((entry) => entry.leafNodeId);
  if (
    leafIds.length < 2 ||
    leafIds.length > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxLeaves ||
    new Set(leafIds).size !== leafIds.length ||
    leafIds.some((leafId, index) => index > 0 && (leafIds[index - 1] ?? '') >= leafId)
  ) {
    return {
      ok: false,
      error: [
        issue(
          'search-binding',
          '$.packingProblemInput',
          'invalid-leaf-order',
          'packing-problem leaves must be distinct and strictly code-unit ordered within the bounded leaf count',
        ),
      ],
    };
  }

  const expectedPairCount = (leafIds.length * (leafIds.length - 1)) / 2;
  if (problem.separationConstraintInputs.length !== expectedPairCount) {
    return {
      ok: false,
      error: [
        issue(
          'search-binding',
          '$.packingProblemInput',
          'pair-cardinality-mismatch',
          'packing-problem separation inputs must cover every unordered leaf pair exactly once',
        ),
      ],
    };
  }

  const expectedLeaves = new Set(leafIds);
  const mutablePairMap = new Map<string, Map<string, PolygonRiverSeparationConstraintInputV1>>();
  for (const leafId of leafIds) mutablePairMap.set(leafId, new Map());
  for (let index = 0; index < problem.separationConstraintInputs.length; index += 1) {
    const constraint = problem.separationConstraintInputs[index];
    if (
      constraint === undefined ||
      !expectedLeaves.has(constraint.firstLeafId) ||
      !expectedLeaves.has(constraint.secondLeafId) ||
      constraint.firstLeafId >= constraint.secondLeafId ||
      !NONNEGATIVE_DECIMAL_PATTERN.test(constraint.totalLengthSteps)
    ) {
      return {
        ok: false,
        error: [
          issue(
            'search-binding',
            `$.packingProblemInput.separationConstraintInputs[${String(index)}]`,
            'invalid-pair-binding',
            'each pair must bind two ordered leaves and one canonical nonnegative path demand',
          ),
        ],
      };
    }
    const firstMap = mutablePairMap.get(constraint.firstLeafId);
    const secondMap = mutablePairMap.get(constraint.secondLeafId);
    if (
      firstMap === undefined ||
      secondMap === undefined ||
      firstMap.has(constraint.secondLeafId) ||
      secondMap.has(constraint.firstLeafId)
    ) {
      return {
        ok: false,
        error: [
          issue(
            'search-binding',
            `$.packingProblemInput.separationConstraintInputs[${String(index)}]`,
            'duplicate-pair-binding',
            'each unordered leaf pair must occur once',
          ),
        ],
      };
    }
    firstMap.set(constraint.secondLeafId, constraint);
    secondMap.set(constraint.firstLeafId, constraint);
  }
  if (leafIds.some((leafId) => (mutablePairMap.get(leafId)?.size ?? -1) !== leafIds.length - 1)) {
    return {
      ok: false,
      error: [
        issue(
          'search-binding',
          '$.packingProblemInput.separationConstraintInputs',
          'incomplete-pair-binding',
          'every leaf must bind one separation input to every other leaf',
        ),
      ],
    };
  }
  return { ok: true, value: { leafIds, pairByLeafIds: mutablePairMap } };
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function passesIncrementalNecessaryFilters(
  assignments: readonly EuclideanNecessaryWitnessAssignmentV1[],
  depth: number,
  pairByLeafIds: PreparedSearch['pairByLeafIds'],
): boolean {
  const current = assignments[depth];
  if (current === undefined) return false;
  for (let priorIndex = 0; priorIndex < depth; priorIndex += 1) {
    const prior = assignments[priorIndex];
    const constraint =
      prior === undefined
        ? undefined
        : pairByLeafIds.get(prior.leafNodeId)?.get(current.leafNodeId);
    if (prior === undefined || constraint === undefined) return false;
    const deltaX = BigInt(prior.x) - BigInt(current.x);
    const deltaY = BigInt(prior.y) - BigInt(current.y);
    const demand = BigInt(constraint.totalLengthSteps);
    if (deltaX * deltaX + deltaY * deltaY < demand * demand) return false;
  }
  return true;
}

function buildWitness(
  witnessIndex: number,
  assignments: readonly EuclideanNecessaryWitnessAssignmentV1[],
  problem: PolygonRiverPackingProblemResultV1,
): EuclideanNecessaryWitnessV1 | undefined {
  const assignmentByLeafId = new Map(
    assignments.map((entry) => [entry.leafNodeId, entry] as const),
  );
  const pairEvaluations: EuclideanNecessaryWitnessPairEvaluationV1[] = [];
  for (const constraint of problem.separationConstraintInputs) {
    const first = assignmentByLeafId.get(constraint.firstLeafId);
    const second = assignmentByLeafId.get(constraint.secondLeafId);
    if (first === undefined || second === undefined) return undefined;
    const deltaX = absolute(BigInt(first.x) - BigInt(second.x));
    const deltaY = absolute(BigInt(first.y) - BigInt(second.y));
    const actualSquaredDistance = deltaX * deltaX + deltaY * deltaY;
    const demand = BigInt(constraint.totalLengthSteps);
    const requiredSquaredDistance = demand * demand;
    if (actualSquaredDistance < requiredSquaredDistance) return undefined;
    pairEvaluations.push({
      firstLeafId: constraint.firstLeafId,
      secondLeafId: constraint.secondLeafId,
      absoluteDeltaX: deltaX.toString(),
      absoluteDeltaY: deltaY.toString(),
      actualSquaredDistance: actualSquaredDistance.toString(),
      requiredSquaredDistance: requiredSquaredDistance.toString(),
      totalLengthSteps: constraint.totalLengthSteps,
      maximumWidthSteps: constraint.maximumWidthSteps,
      passesNecessaryFilter: true,
    });
  }
  return {
    witnessIndex,
    assignmentRole: 'projected-leaf-anchors-only-not-polygon-placement',
    leafAssignmentOrder: 'leaf-node-id-code-unit',
    leafAssignments: assignments.map((entry) => ({ ...entry })),
    pairEvaluationOrder: 'packing-problem-separation-constraint-order',
    pairEvaluations,
    allNecessaryPairFiltersPass: true,
    packingEvidence: false,
    geometryEvidence: false,
    placementEvidence: false,
  };
}

interface SearchRun {
  readonly visitedStates: number;
  readonly stop: 'witness-limit' | 'budget' | 'domain';
  readonly witnesses: readonly EuclideanNecessaryWitnessV1[];
}

function runSearch(
  problem: PolygonRiverPackingProblemResultV1,
  prepared: PreparedSearch,
  maxVisitedStates: number,
  maxWitnesses: number,
): SearchRun {
  const assignments: EuclideanNecessaryWitnessAssignmentV1[] = [];
  const witnesses: EuclideanNecessaryWitnessV1[] = [];
  let visitedStates = 0;
  let stop: SearchRun['stop'] = 'domain';

  function visit(depth: number): boolean {
    if (depth === prepared.leafIds.length) {
      const witness = buildWitness(witnesses.length, assignments, problem);
      if (witness !== undefined) witnesses.push(witness);
      if (witnesses.length >= maxWitnesses) {
        stop = 'witness-limit';
        return false;
      }
      return true;
    }

    const leafNodeId = prepared.leafIds[depth];
    if (leafNodeId === undefined) return true;
    for (let y = 0; y <= problem.activeGridDomain.rows; y += 1) {
      for (let x = 0; x <= problem.activeGridDomain.columns; x += 1) {
        if (visitedStates >= maxVisitedStates) {
          stop = 'budget';
          return false;
        }
        visitedStates += 1;
        assignments[depth] = { leafNodeId, x, y };
        if (
          passesIncrementalNecessaryFilters(assignments, depth, prepared.pairByLeafIds) &&
          !visit(depth + 1)
        ) {
          return false;
        }
      }
    }
    assignments.length = depth;
    return true;
  }

  if (visit(0)) stop = 'domain';
  return { visitedStates, stop, witnesses };
}

/**
 * Searches only the finite active-grid assignment domain for witnesses that
 * pass the declared squared-Euclidean pairwise necessary relation.
 */
export function searchEuclideanNecessaryWitnessesV1(
  supplied: unknown,
): EuclideanNecessaryWitnessSearchEvaluationResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxArrayLength,
    maxContainerCount: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxContainerCount,
    maxDepth: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxDepth,
    maxObjectPropertyCount: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxObjectPropertyCount,
    maxPropertyNameCodeUnits: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxPropertyNameCodeUnits,
    maxStringCodeUnits: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxStringCodeUnits,
    maxTotalStringCodeUnits: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxTotalStringCodeUnits,
    maxTotalPropertyCount: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxTotalPropertyCount,
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
      issue('search-input', '$', 'invalid-object', 'witness search input must be an object'),
    ]);
  }

  const rootIssues = validateClosedRoot(snapshot.value);
  if (rootIssues.length > 0) return failure(rootIssues);

  const semantics = parseBoxPleatingPackingSemanticsV1(snapshot.value.semantics);
  if (!semantics.ok) return failure(semanticsIssues(semantics.error));
  const problem = buildPolygonRiverPackingProblemV1(snapshot.value.packingProblemInput);
  if (!problem.ok) return failure(packingProblemIssues(problem.error));
  const prepared = prepareSearch(problem.value);
  if (!prepared.ok) return failure(prepared.error);

  const maxVisitedStates = snapshot.value.maxVisitedStates as number;
  const maxWitnesses = snapshot.value.maxWitnesses as number;
  const run = runSearch(problem.value, prepared.value, maxVisitedStates, maxWitnesses);
  const searchStatus: EuclideanNecessaryWitnessSearchStatus =
    run.stop === 'witness-limit'
      ? 'witness-found'
      : run.stop === 'budget'
        ? 'budget-exhausted'
        : 'domain-exhausted';
  const searchComplete = searchStatus === 'domain-exhausted';
  const vertexCount =
    (problem.value.activeGridDomain.columns + 1) * (problem.value.activeGridDomain.rows + 1);

  return deepFreezeOwned({
    ok: true as const,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'bounded-active-grid-euclidean-necessary-filter-witness-search-only',
      interpretation:
        'finite deterministic assignment search for pairwise necessary-filter witnesses only',
      semanticsReference: semantics.value,
      packingProblemReference: problem.value,
      activeGridDomain: {
        columns: problem.value.activeGridDomain.columns,
        rows: problem.value.activeGridDomain.rows,
        vertexCount,
      },
      leafAssignmentOrder: 'leaf-node-id-code-unit',
      gridVertexOrder: 'y-then-x',
      traversal: 'depth-first-canonical-leaf-order',
      visitedStateDefinition:
        'one-attempted-leaf-to-grid-vertex-assignment-including-pruned-assignments',
      maxVisitedStates,
      maxWitnesses,
      visitedStates: run.visitedStates,
      searchStatus,
      searchComplete,
      witnessCount: run.witnesses.length,
      witnesses: run.witnesses,
      noNecessaryFilterWitnessInEnumeratedDomain: searchComplete && run.witnesses.length === 0,
      globalNoSolutionEvidence: false,
      packingInfeasibilityEvidence: false,
      coordinateDistinctnessConstraintIncluded: false,
      zeroDemandCoordinateCoincidenceAllowed: true,
      evaluatedRelation: 'dx-squared-plus-dy-squared-at-least-total-length-steps-squared',
      tangencyPolicy: 'allowed-at-equality-for-this-filter',
      widthUsedBySearch: false,
      maximumWidthRole: 'trace-only-without-separation-or-packing-semantics',
      assignmentSearchIncluded: true,
      necessaryFilterWitnessSearchIncluded: true,
      necessaryFilterEvaluationIncluded: true,
      filterOnlySearch: true,
      generalPolygonRiverPackingSolverIncluded: false,
      constructionFamily: 'unresolved',
      constructionFamilySelectionIncluded: false,
      geometryIncluded: false,
      actualGeometryIncluded: false,
      polygonGeometryIncluded: false,
      riverGeometryIncluded: false,
      junctionGeometryIncluded: false,
      placementIncluded: false,
      globalPackingIncluded: false,
      packingIncluded: false,
      polygonRiverPackingIncluded: false,
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
