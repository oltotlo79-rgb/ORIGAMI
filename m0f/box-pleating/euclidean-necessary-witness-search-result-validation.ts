import { deepFreezeOwned } from '../clone-and-freeze.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS,
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_RECORD_TYPE,
  type EuclideanNecessaryWitnessAssignmentV1,
  type EuclideanNecessaryWitnessPairEvaluationV1,
  type EuclideanNecessaryWitnessSearchInputV1,
  type EuclideanNecessaryWitnessSearchResultV1,
  type EuclideanNecessaryWitnessV1,
} from './euclidean-necessary-witness-search.js';
import {
  parseBoxPleatingPackingSemanticsV1,
  type BoxPleatingPackingSemanticsV1,
} from './packing-semantics.js';
import {
  parsePolygonRiverPackingProblemInputV1,
  type PolygonRiverPackingProblemInputV1,
  type PolygonRiverPackingProblemResultV1,
} from './polygon-river-packing-problem.js';
import { validatePolygonRiverPackingProblemResultV1 } from './polygon-river-packing-problem-result-validation.js';

/**
 * Independent response ceilings. They bound validation work and are not a
 * SupportProfile, a packing claim, a no-solution claim, or M0F GO evidence.
 */
export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS = deepFreezeOwned({
  maxArrayLength: 190,
  maxContainerCount: 8_192,
  maxDepth: 16,
  maxObjectPropertyCount: 96,
  maxPropertyNameCodeUnits: 96,
  maxStringCodeUnits: 8_192,
  maxTotalStringCodeUnits: 16_777_216,
  maxTotalPropertyCount: 65_536,
  maxViolations: 512,
});

export type EuclideanNecessaryWitnessSearchResultValidationStageV1 =
  | 'search-input-snapshot'
  | 'search-input-structure'
  | 'semantics-input'
  | 'packing-problem-input'
  | 'result-snapshot'
  | 'result-structure'
  | 'claim-boundary'
  | 'semantics-reference'
  | 'packing-problem-reference'
  | 'source-binding'
  | 'search-replay'
  | 'exact-arithmetic';

export type EuclideanNecessaryWitnessSearchResultValidationCodeV1 =
  | 'invalid-input'
  | 'invalid-snapshot'
  | 'invalid-object'
  | 'invalid-array'
  | 'unknown-field'
  | 'missing-field'
  | 'invalid-literal'
  | 'invalid-work-budget'
  | 'invalid-witness-limit'
  | 'claim-boundary'
  | 'source-mismatch'
  | 'cardinality-mismatch'
  | 'order-mismatch'
  | 'replay-mismatch'
  | 'arithmetic-mismatch';

export type EuclideanNecessaryWitnessSearchResultViolationV1 = Readonly<{
  stage: EuclideanNecessaryWitnessSearchResultValidationStageV1;
  path: string;
  code: EuclideanNecessaryWitnessSearchResultValidationCodeV1;
  message: string;
  sourceStage?: string;
  sourceCode?: string;
}>;

export type EuclideanNecessaryWitnessSearchResultValidationV1 =
  | Readonly<{ ok: true; value: EuclideanNecessaryWitnessSearchResultV1 }>
  | Readonly<{
      ok: false;
      violations: readonly EuclideanNecessaryWitnessSearchResultViolationV1[];
    }>;

type Violation = EuclideanNecessaryWitnessSearchResultViolationV1;
interface MutableViolation {
  stage: Violation['stage'];
  path: string;
  code: Violation['code'];
  message: string;
  sourceStage?: string;
  sourceCode?: string;
}

const SEARCH_INPUT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'semantics',
  'packingProblemInput',
  'maxVisitedStates',
  'maxWitnesses',
] as const satisfies readonly (keyof EuclideanNecessaryWitnessSearchInputV1)[];

const RESULT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'scope',
  'interpretation',
  'semanticsReference',
  'packingProblemReference',
  'activeGridDomain',
  'leafAssignmentOrder',
  'gridVertexOrder',
  'traversal',
  'visitedStateDefinition',
  'maxVisitedStates',
  'maxWitnesses',
  'visitedStates',
  'searchStatus',
  'searchComplete',
  'witnessCount',
  'witnesses',
  'noNecessaryFilterWitnessInEnumeratedDomain',
  'globalNoSolutionEvidence',
  'packingInfeasibilityEvidence',
  'coordinateDistinctnessConstraintIncluded',
  'zeroDemandCoordinateCoincidenceAllowed',
  'evaluatedRelation',
  'tangencyPolicy',
  'widthUsedBySearch',
  'maximumWidthRole',
  'assignmentSearchIncluded',
  'necessaryFilterWitnessSearchIncluded',
  'necessaryFilterEvaluationIncluded',
  'filterOnlySearch',
  'generalPolygonRiverPackingSolverIncluded',
  'constructionFamily',
  'constructionFamilySelectionIncluded',
  'geometryIncluded',
  'actualGeometryIncluded',
  'polygonGeometryIncluded',
  'riverGeometryIncluded',
  'junctionGeometryIncluded',
  'placementIncluded',
  'globalPackingIncluded',
  'packingIncluded',
  'polygonRiverPackingIncluded',
  'hingeConstructionIncluded',
  'ridgeConstructionIncluded',
  'axialConstructionIncluded',
  'junctionConstructionIncluded',
  'pleatRoutingIncluded',
  'creasePatternIncluded',
  'mountainValleyIncluded',
  'foldabilityIncluded',
  'feasibilityDecisionIncluded',
  'globalM0fGo',
  'isSupportProfile',
  'supportClaim',
] as const satisfies readonly (keyof EuclideanNecessaryWitnessSearchResultV1)[];

const WITNESS_KEYS = [
  'witnessIndex',
  'assignmentRole',
  'leafAssignmentOrder',
  'leafAssignments',
  'pairEvaluationOrder',
  'pairEvaluations',
  'allNecessaryPairFiltersPass',
  'packingEvidence',
  'geometryEvidence',
  'placementEvidence',
] as const satisfies readonly (keyof EuclideanNecessaryWitnessV1)[];

const ASSIGNMENT_KEYS = [
  'leafNodeId',
  'x',
  'y',
] as const satisfies readonly (keyof EuclideanNecessaryWitnessAssignmentV1)[];

const PAIR_EVALUATION_KEYS = [
  'firstLeafId',
  'secondLeafId',
  'absoluteDeltaX',
  'absoluteDeltaY',
  'actualSquaredDistance',
  'requiredSquaredDistance',
  'totalLengthSteps',
  'maximumWidthSteps',
  'passesNecessaryFilter',
] as const satisfies readonly (keyof EuclideanNecessaryWitnessPairEvaluationV1)[];

const ACTIVE_GRID_KEYS = ['columns', 'rows', 'vertexCount'] as const;
const ROOT_FALSE_CLAIM_KEYS = new Set<string>([
  'scientificClaim',
  'globalNoSolutionEvidence',
  'packingInfeasibilityEvidence',
  'generalPolygonRiverPackingSolverIncluded',
  'constructionFamilySelectionIncluded',
  'geometryIncluded',
  'actualGeometryIncluded',
  'polygonGeometryIncluded',
  'riverGeometryIncluded',
  'junctionGeometryIncluded',
  'placementIncluded',
  'globalPackingIncluded',
  'packingIncluded',
  'polygonRiverPackingIncluded',
  'hingeConstructionIncluded',
  'ridgeConstructionIncluded',
  'axialConstructionIncluded',
  'junctionConstructionIncluded',
  'pleatRoutingIncluded',
  'creasePatternIncluded',
  'mountainValleyIncluded',
  'foldabilityIncluded',
  'feasibilityDecisionIncluded',
  'globalM0fGo',
  'isSupportProfile',
  'supportClaim',
]);
const WITNESS_FALSE_CLAIM_KEYS = new Set<string>([
  'packingEvidence',
  'geometryEvidence',
  'placementEvidence',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function prefixPath(prefix: string, path: string): string {
  if (path === '$') return prefix;
  if (path.startsWith('$')) return `${prefix}${path.slice(1)}`;
  return `${prefix}.${path}`;
}

function pushViolation(
  violations: MutableViolation[],
  stage: Violation['stage'],
  path: string,
  code: Violation['code'],
  message: string,
  sourceStage?: string,
  sourceCode?: string,
): void {
  if (
    violations.length >= EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS.maxViolations
  ) {
    return;
  }
  const next: MutableViolation = { stage, path, code, message };
  if (sourceStage !== undefined) next.sourceStage = sourceStage;
  if (sourceCode !== undefined) next.sourceCode = sourceCode;
  violations.push(next);
}

function failed(
  violations: readonly MutableViolation[],
): Extract<EuclideanNecessaryWitnessSearchResultValidationV1, { ok: false }> {
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

function closedObject(
  raw: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  violations: MutableViolation[],
  description: string,
): void {
  const expected = new Set(keys);
  for (const key of Object.keys(raw).sort(compareCodeUnits)) {
    if (!expected.has(key)) {
      pushViolation(
        violations,
        path === '$.result' && ROOT_FALSE_CLAIM_KEYS.has(key)
          ? 'claim-boundary'
          : 'result-structure',
        `${path}.${key}`,
        'unknown-field',
        `field is not declared by ${description}`,
      );
    }
  }
  for (const key of keys) {
    if (!Object.hasOwn(raw, key)) {
      pushViolation(
        violations,
        'result-structure',
        `${path}.${key}`,
        'missing-field',
        `required ${description} field is missing`,
      );
    }
  }
}

interface ParsedSearchInput {
  readonly value: EuclideanNecessaryWitnessSearchInputV1;
  readonly semantics: BoxPleatingPackingSemanticsV1;
  readonly packingProblemInput: PolygonRiverPackingProblemInputV1;
}

function parseClosedSearchInput(
  supplied: unknown,
  violations: MutableViolation[],
): ParsedSearchInput | undefined {
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
    pushViolation(
      violations,
      'search-input-snapshot',
      '$.input',
      'invalid-snapshot',
      'search input must be one bounded acyclic accessor-free plain snapshot',
    );
    return undefined;
  }
  if (!isRecord(snapshot.value)) {
    pushViolation(
      violations,
      'search-input-structure',
      '$.input',
      'invalid-object',
      'search input must be an object',
    );
    return undefined;
  }

  const raw = snapshot.value;
  const allowed = new Set<string>(SEARCH_INPUT_KEYS);
  for (const key of Object.keys(raw).sort(compareCodeUnits)) {
    if (!allowed.has(key)) {
      pushViolation(
        violations,
        'search-input-structure',
        `$.input.${key}`,
        'unknown-field',
        'field is not declared by Euclidean necessary witness search input v1',
      );
    }
  }
  for (const key of SEARCH_INPUT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      pushViolation(
        violations,
        'search-input-structure',
        `$.input.${key}`,
        'missing-field',
        'required search input field is missing',
      );
    }
  }
  if (raw.schemaVersion !== 1) {
    pushViolation(
      violations,
      'search-input-structure',
      '$.input.schemaVersion',
      'invalid-literal',
      'schemaVersion must equal 1',
    );
  }
  if (raw.recordType !== EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE) {
    pushViolation(
      violations,
      'search-input-structure',
      '$.input.recordType',
      'invalid-literal',
      `recordType must equal ${EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE}`,
    );
  }
  if (raw.contractStatus !== 'candidate') {
    pushViolation(
      violations,
      'search-input-structure',
      '$.input.contractStatus',
      'claim-boundary',
      'contractStatus must equal candidate',
    );
  }
  if (raw.scientificClaim !== false) {
    pushViolation(
      violations,
      'search-input-structure',
      '$.input.scientificClaim',
      'claim-boundary',
      'scientificClaim must equal false',
    );
  }

  const maxVisitedStates = raw.maxVisitedStates;
  if (
    typeof maxVisitedStates !== 'number' ||
    !Number.isSafeInteger(maxVisitedStates) ||
    maxVisitedStates < 1 ||
    maxVisitedStates > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxVisitedStates
  ) {
    pushViolation(
      violations,
      'search-input-structure',
      '$.input.maxVisitedStates',
      'invalid-work-budget',
      `maxVisitedStates must be a positive safe integer at most ${String(EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxVisitedStates)}`,
    );
  }
  const maxWitnesses = raw.maxWitnesses;
  if (
    typeof maxWitnesses !== 'number' ||
    !Number.isSafeInteger(maxWitnesses) ||
    maxWitnesses < 1 ||
    maxWitnesses > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxWitnesses
  ) {
    pushViolation(
      violations,
      'search-input-structure',
      '$.input.maxWitnesses',
      'invalid-witness-limit',
      `maxWitnesses must be a safe integer from 1 through ${String(EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxWitnesses)}`,
    );
  }
  if (violations.length > 0) return undefined;

  const semantics = parseBoxPleatingPackingSemanticsV1(raw.semantics);
  if (!semantics.ok) {
    for (const entry of semantics.error) {
      pushViolation(
        violations,
        'semantics-input',
        prefixPath('$.input.semantics', entry.path),
        'invalid-input',
        entry.message,
        'semantics',
        entry.code,
      );
    }
  }
  const packingProblemInput = parsePolygonRiverPackingProblemInputV1(raw.packingProblemInput);
  if (!packingProblemInput.ok) {
    for (const entry of packingProblemInput.error) {
      pushViolation(
        violations,
        'packing-problem-input',
        prefixPath('$.input.packingProblemInput', entry.path),
        'invalid-input',
        entry.message,
        entry.stage,
        entry.code,
      );
    }
  }
  if (!semantics.ok || !packingProblemInput.ok) return undefined;

  return {
    semantics: semantics.value,
    packingProblemInput: packingProblemInput.value,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      semantics: semantics.value,
      packingProblemInput: packingProblemInput.value,
      maxVisitedStates: maxVisitedStates as number,
      maxWitnesses: maxWitnesses as number,
    }),
  };
}

interface IndexedPair {
  readonly firstIndex: number;
  readonly secondIndex: number;
  readonly firstLeafId: string;
  readonly secondLeafId: string;
  readonly totalLengthSteps: string;
  readonly maximumWidthSteps: string;
  readonly requiredSquaredDistance: bigint;
}

interface ReplayPreparation {
  readonly leafIds: readonly string[];
  readonly pairs: readonly IndexedPair[];
  readonly requiredSquareByPair: readonly (readonly (bigint | undefined)[])[];
}

function prepareReplay(
  problem: PolygonRiverPackingProblemResultV1,
  violations: MutableViolation[],
): ReplayPreparation | undefined {
  const leafIds = problem.leafGridVertexVariables.map((entry) => entry.leafNodeId);
  if (
    leafIds.length < 2 ||
    leafIds.length > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxLeaves ||
    leafIds.some((leafId, index) => index > 0 && (leafIds[index - 1] ?? '') >= leafId) ||
    new Set(leafIds).size !== leafIds.length
  ) {
    pushViolation(
      violations,
      'source-binding',
      '$.result.packingProblemReference.leafGridVertexVariables',
      'order-mismatch',
      'leaf variables must be distinct and strictly code-unit ordered',
    );
    return undefined;
  }

  const expectedPairCount = (leafIds.length * (leafIds.length - 1)) / 2;
  if (problem.separationConstraintInputs.length !== expectedPairCount) {
    pushViolation(
      violations,
      'source-binding',
      '$.result.packingProblemReference.separationConstraintInputs',
      'cardinality-mismatch',
      'separation inputs must contain every unordered leaf pair exactly once',
    );
    return undefined;
  }

  const leafIndex = new Map(leafIds.map((leafId, index) => [leafId, index] as const));
  const requiredSquareByPair: (bigint | undefined)[][] = Array.from(
    { length: leafIds.length },
    () => Array<bigint | undefined>(leafIds.length),
  );
  const pairs: IndexedPair[] = [];
  let pairOffset = 0;
  for (let firstIndex = 0; firstIndex < leafIds.length - 1; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < leafIds.length; secondIndex += 1) {
      const constraint = problem.separationConstraintInputs[pairOffset];
      const firstLeafId = leafIds[firstIndex];
      const secondLeafId = leafIds[secondIndex];
      if (
        constraint === undefined ||
        firstLeafId === undefined ||
        secondLeafId === undefined ||
        leafIndex.get(constraint.firstLeafId) !== firstIndex ||
        leafIndex.get(constraint.secondLeafId) !== secondIndex ||
        !/^(?:0|[1-9][0-9]*)$/u.test(constraint.totalLengthSteps) ||
        !/^(?:0|[1-9][0-9]*)$/u.test(constraint.maximumWidthSteps)
      ) {
        pushViolation(
          violations,
          'source-binding',
          `$.result.packingProblemReference.separationConstraintInputs[${String(pairOffset)}]`,
          'order-mismatch',
          'separation inputs must follow canonical first-leaf then second-leaf order',
        );
        return undefined;
      }
      const demand = BigInt(constraint.totalLengthSteps);
      const requiredSquaredDistance = demand * demand;
      const firstRow = requiredSquareByPair[firstIndex];
      const secondRow = requiredSquareByPair[secondIndex];
      if (firstRow === undefined || secondRow === undefined) {
        pushViolation(
          violations,
          'source-binding',
          '$.result.packingProblemReference.separationConstraintInputs',
          'cardinality-mismatch',
          'pair matrix dimensions must agree with the canonical leaf count',
        );
        return undefined;
      }
      firstRow[secondIndex] = requiredSquaredDistance;
      secondRow[firstIndex] = requiredSquaredDistance;
      pairs.push({
        firstIndex,
        secondIndex,
        firstLeafId,
        secondLeafId,
        totalLengthSteps: constraint.totalLengthSteps,
        maximumWidthSteps: constraint.maximumWidthSteps,
        requiredSquaredDistance,
      });
      pairOffset += 1;
    }
  }
  return { leafIds, pairs, requiredSquareByPair };
}

interface Coordinate {
  readonly x: number;
  readonly y: number;
}

interface ReplayOutcome {
  readonly visitedStates: number;
  readonly termination: 'witness-limit' | 'budget' | 'domain';
  readonly witnesses: readonly EuclideanNecessaryWitnessV1[];
}

function replayCanonicalTraversal(
  problem: PolygonRiverPackingProblemResultV1,
  preparation: ReplayPreparation,
  maxVisitedStates: number,
  maxWitnesses: number,
): ReplayOutcome {
  const chosen: Coordinate[] = [];
  const witnesses: EuclideanNecessaryWitnessV1[] = [];
  const verticesPerRow = problem.activeGridDomain.columns + 1;
  const vertexCount = verticesPerRow * (problem.activeGridDomain.rows + 1);
  let visitedStates = 0;
  let termination: ReplayOutcome['termination'] = 'domain';

  const appendWitness = (): void => {
    const leafAssignments = preparation.leafIds.map((leafNodeId, index) => {
      const coordinate = chosen[index];
      if (coordinate === undefined) throw new Error('canonical replay assignment is incomplete');
      return { leafNodeId, x: coordinate.x, y: coordinate.y };
    });
    const pairEvaluations = preparation.pairs.map((pair) => {
      const first = chosen[pair.firstIndex];
      const second = chosen[pair.secondIndex];
      if (first === undefined || second === undefined) {
        throw new Error('canonical replay pair assignment is incomplete');
      }
      const absoluteDeltaX = Math.abs(first.x - second.x);
      const absoluteDeltaY = Math.abs(first.y - second.y);
      const deltaX = BigInt(absoluteDeltaX);
      const deltaY = BigInt(absoluteDeltaY);
      const actualSquaredDistance = deltaX * deltaX + deltaY * deltaY;
      return {
        firstLeafId: pair.firstLeafId,
        secondLeafId: pair.secondLeafId,
        absoluteDeltaX: absoluteDeltaX.toString(),
        absoluteDeltaY: absoluteDeltaY.toString(),
        actualSquaredDistance: actualSquaredDistance.toString(),
        requiredSquaredDistance: pair.requiredSquaredDistance.toString(),
        totalLengthSteps: pair.totalLengthSteps,
        maximumWidthSteps: pair.maximumWidthSteps,
        passesNecessaryFilter: true as const,
      };
    });
    witnesses.push({
      witnessIndex: witnesses.length,
      assignmentRole: 'projected-leaf-anchors-only-not-polygon-placement',
      leafAssignmentOrder: 'leaf-node-id-code-unit',
      leafAssignments,
      pairEvaluationOrder: 'packing-problem-separation-constraint-order',
      pairEvaluations,
      allNecessaryPairFiltersPass: true,
      packingEvidence: false,
      geometryEvidence: false,
      placementEvidence: false,
    });
  };

  const descend = (leafIndex: number): boolean => {
    if (leafIndex === preparation.leafIds.length) {
      appendWitness();
      if (witnesses.length === maxWitnesses) {
        termination = 'witness-limit';
        return false;
      }
      return true;
    }

    for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex += 1) {
      if (visitedStates === maxVisitedStates) {
        termination = 'budget';
        return false;
      }
      visitedStates += 1;
      const coordinate: Coordinate = {
        x: vertexIndex % verticesPerRow,
        y: Math.floor(vertexIndex / verticesPerRow),
      };
      chosen[leafIndex] = coordinate;

      let pairwisePass = true;
      for (let priorIndex = 0; priorIndex < leafIndex; priorIndex += 1) {
        const prior = chosen[priorIndex];
        const requiredSquared = preparation.requiredSquareByPair[priorIndex]?.[leafIndex];
        if (prior === undefined || requiredSquared === undefined) {
          pairwisePass = false;
          break;
        }
        const deltaX = BigInt(prior.x - coordinate.x);
        const deltaY = BigInt(prior.y - coordinate.y);
        if (deltaX * deltaX + deltaY * deltaY < requiredSquared) {
          pairwisePass = false;
          break;
        }
      }
      if (pairwisePass && !descend(leafIndex + 1)) return false;
    }
    chosen.length = leafIndex;
    return true;
  };

  if (descend(0)) termination = 'domain';
  return { visitedStates, termination, witnesses };
}

function expectedResult(
  input: ParsedSearchInput,
  problem: PolygonRiverPackingProblemResultV1,
  replay: ReplayOutcome,
): EuclideanNecessaryWitnessSearchResultV1 {
  const searchStatus =
    replay.termination === 'witness-limit'
      ? ('witness-found' as const)
      : replay.termination === 'budget'
        ? ('budget-exhausted' as const)
        : ('domain-exhausted' as const);
  const searchComplete = replay.termination === 'domain';
  return {
    schemaVersion: 1,
    recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    scope: 'bounded-active-grid-euclidean-necessary-filter-witness-search-only',
    interpretation:
      'finite deterministic assignment search for pairwise necessary-filter witnesses only',
    semanticsReference: input.semantics,
    packingProblemReference: problem,
    activeGridDomain: {
      columns: problem.activeGridDomain.columns,
      rows: problem.activeGridDomain.rows,
      vertexCount: (problem.activeGridDomain.columns + 1) * (problem.activeGridDomain.rows + 1),
    },
    leafAssignmentOrder: 'leaf-node-id-code-unit',
    gridVertexOrder: 'y-then-x',
    traversal: 'depth-first-canonical-leaf-order',
    visitedStateDefinition:
      'one-attempted-leaf-to-grid-vertex-assignment-including-pruned-assignments',
    maxVisitedStates: input.value.maxVisitedStates,
    maxWitnesses: input.value.maxWitnesses,
    visitedStates: replay.visitedStates,
    searchStatus,
    searchComplete,
    witnessCount: replay.witnesses.length,
    witnesses: replay.witnesses,
    noNecessaryFilterWitnessInEnumeratedDomain: searchComplete && replay.witnesses.length === 0,
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
  };
}

function mismatchStageAndCode(
  path: string,
  expected: unknown,
): readonly [Violation['stage'], Violation['code']] {
  const rootMatch = /^\$\.result\.([^.[]+)/u.exec(path);
  const rootKey = rootMatch?.[1];
  const witnessMatch = /\.witnesses\[[0-9]+\]\.([^.[]+)/u.exec(path);
  const witnessKey = witnessMatch?.[1];
  if (
    (rootKey !== undefined && ROOT_FALSE_CLAIM_KEYS.has(rootKey)) ||
    (witnessKey !== undefined && WITNESS_FALSE_CLAIM_KEYS.has(witnessKey))
  ) {
    return ['claim-boundary', 'claim-boundary'];
  }
  if (path.startsWith('$.result.activeGridDomain') || path.startsWith('$.result.max')) {
    return ['source-binding', 'source-mismatch'];
  }
  if (
    path.startsWith('$.result.witnesses') ||
    /\.(?:visitedStates|searchStatus|searchComplete|witnessCount|noNecessaryFilterWitnessInEnumeratedDomain)$/u.test(
      path,
    )
  ) {
    return [
      path.includes('SquaredDistance') || path.includes('Delta') || path.includes('LengthSteps')
        ? 'exact-arithmetic'
        : 'search-replay',
      path.includes('SquaredDistance') || path.includes('Delta') || path.includes('LengthSteps')
        ? 'arithmetic-mismatch'
        : 'replay-mismatch',
    ];
  }
  if (expected === false && rootKey === 'scientificClaim') {
    return ['claim-boundary', 'claim-boundary'];
  }
  return ['result-structure', 'invalid-literal'];
}

function compareClosedValue(
  actual: unknown,
  expected: unknown,
  path: string,
  violations: MutableViolation[],
): void {
  if (
    violations.length >= EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS.maxViolations
  ) {
    return;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      pushViolation(
        violations,
        'result-structure',
        path,
        'invalid-array',
        'value must be an array',
      );
      return;
    }
    if (actual.length !== expected.length) {
      const [stage, code] = mismatchStageAndCode(path, expected);
      pushViolation(
        violations,
        stage,
        path,
        code === 'invalid-literal' ? 'cardinality-mismatch' : code,
        `array length must equal ${String(expected.length)}`,
      );
    }
    const sharedLength = Math.min(actual.length, expected.length);
    for (let index = 0; index < sharedLength; index += 1) {
      compareClosedValue(actual[index], expected[index], `${path}[${String(index)}]`, violations);
    }
    return;
  }
  if (isRecord(expected)) {
    if (!isRecord(actual)) {
      pushViolation(
        violations,
        'result-structure',
        path,
        'invalid-object',
        'value must be an object',
      );
      return;
    }
    const expectedKeys = Object.keys(expected).sort(compareCodeUnits);
    const expectedSet = new Set(expectedKeys);
    for (const key of Object.keys(actual).sort(compareCodeUnits)) {
      if (!expectedSet.has(key)) {
        pushViolation(
          violations,
          'result-structure',
          `${path}.${key}`,
          'unknown-field',
          'field is not declared by the canonical completed result',
        );
      }
    }
    for (const key of expectedKeys) {
      if (!Object.hasOwn(actual, key)) {
        pushViolation(
          violations,
          'result-structure',
          `${path}.${key}`,
          'missing-field',
          'required completed-result field is missing',
        );
      } else {
        compareClosedValue(actual[key], expected[key], `${path}.${key}`, violations);
      }
    }
    return;
  }
  if (!Object.is(actual, expected)) {
    const [stage, code] = mismatchStageAndCode(path, expected);
    pushViolation(
      violations,
      stage,
      path,
      code,
      `value must equal ${typeof expected === 'string' ? JSON.stringify(expected) : String(expected)}`,
    );
  }
}

function closeKnownResultContainers(
  raw: Record<string, unknown>,
  violations: MutableViolation[],
): void {
  closedObject(raw, RESULT_KEYS, '$.result', violations, 'witness search result v1');
  const activeGrid = raw.activeGridDomain;
  if (isRecord(activeGrid)) {
    closedObject(
      activeGrid,
      ACTIVE_GRID_KEYS,
      '$.result.activeGridDomain',
      violations,
      'active grid',
    );
  } else if (Object.hasOwn(raw, 'activeGridDomain')) {
    pushViolation(
      violations,
      'result-structure',
      '$.result.activeGridDomain',
      'invalid-object',
      'activeGridDomain must be an object',
    );
  }
  const rawWitnesses: unknown = raw.witnesses;
  if (!Array.isArray(rawWitnesses)) {
    if (Object.hasOwn(raw, 'witnesses')) {
      pushViolation(
        violations,
        'result-structure',
        '$.result.witnesses',
        'invalid-array',
        'witnesses must be an array',
      );
    }
    return;
  }
  const witnesses = rawWitnesses as readonly unknown[];
  for (let witnessIndex = 0; witnessIndex < witnesses.length; witnessIndex += 1) {
    const witness = witnesses[witnessIndex];
    const witnessPath = `$.result.witnesses[${String(witnessIndex)}]`;
    if (!isRecord(witness)) {
      pushViolation(
        violations,
        'result-structure',
        witnessPath,
        'invalid-object',
        'each witness must be an object',
      );
      continue;
    }
    closedObject(witness, WITNESS_KEYS, witnessPath, violations, 'witness');
    const rawAssignments: unknown = witness.leafAssignments;
    if (Array.isArray(rawAssignments)) {
      const assignments = rawAssignments as readonly unknown[];
      for (let assignmentIndex = 0; assignmentIndex < assignments.length; assignmentIndex += 1) {
        const assignment = assignments[assignmentIndex];
        if (isRecord(assignment)) {
          closedObject(
            assignment,
            ASSIGNMENT_KEYS,
            `${witnessPath}.leafAssignments[${String(assignmentIndex)}]`,
            violations,
            'leaf assignment',
          );
        } else {
          pushViolation(
            violations,
            'result-structure',
            `${witnessPath}.leafAssignments[${String(assignmentIndex)}]`,
            'invalid-object',
            'each leaf assignment must be an object',
          );
        }
      }
    } else if (Object.hasOwn(witness, 'leafAssignments')) {
      pushViolation(
        violations,
        'result-structure',
        `${witnessPath}.leafAssignments`,
        'invalid-array',
        'leafAssignments must be an array',
      );
    }
    const rawPairEvaluations: unknown = witness.pairEvaluations;
    if (Array.isArray(rawPairEvaluations)) {
      const pairEvaluations = rawPairEvaluations as readonly unknown[];
      for (let pairIndex = 0; pairIndex < pairEvaluations.length; pairIndex += 1) {
        const evaluation = pairEvaluations[pairIndex];
        if (isRecord(evaluation)) {
          closedObject(
            evaluation,
            PAIR_EVALUATION_KEYS,
            `${witnessPath}.pairEvaluations[${String(pairIndex)}]`,
            violations,
            'pair evaluation',
          );
        } else {
          pushViolation(
            violations,
            'result-structure',
            `${witnessPath}.pairEvaluations[${String(pairIndex)}]`,
            'invalid-object',
            'each pair evaluation must be an object',
          );
        }
      }
    } else if (Object.hasOwn(witness, 'pairEvaluations')) {
      pushViolation(
        violations,
        'result-structure',
        `${witnessPath}.pairEvaluations`,
        'invalid-array',
        'pairEvaluations must be an array',
      );
    }
  }
}

/**
 * Independently validates and replays one completed bounded filter-witness
 * search. It does not call the search producer, problem builder, candidate
 * enumerator, or a polygon/river packing solver. Success is filter-only replay
 * consistency, never packing, global no-solution, feasibility, or M0F GO.
 */
export function validateEuclideanNecessaryWitnessSearchResultV1(
  searchInput: unknown,
  result: unknown,
): EuclideanNecessaryWitnessSearchResultValidationV1 {
  const violations: MutableViolation[] = [];
  const input = parseClosedSearchInput(searchInput, violations);
  if (input === undefined) return failed(violations);

  const snapshot = tryCreateStrictValidationSnapshot(result, {
    maxArrayLength: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS.maxArrayLength,
    maxContainerCount:
      EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS.maxContainerCount,
    maxDepth: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS.maxDepth,
    maxObjectPropertyCount:
      EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS.maxObjectPropertyCount,
    maxPropertyNameCodeUnits:
      EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS.maxPropertyNameCodeUnits,
    maxStringCodeUnits:
      EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS.maxStringCodeUnits,
    maxTotalStringCodeUnits:
      EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS.maxTotalStringCodeUnits,
    maxTotalPropertyCount:
      EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS.maxTotalPropertyCount,
  });
  if (!snapshot.ok) {
    pushViolation(
      violations,
      'result-snapshot',
      '$.result',
      'invalid-snapshot',
      'result must be one bounded acyclic accessor-free plain snapshot',
    );
    return failed(violations);
  }
  if (!isRecord(snapshot.value)) {
    pushViolation(
      violations,
      'result-structure',
      '$.result',
      'invalid-object',
      'witness search result must be an object',
    );
    return failed(violations);
  }

  const raw = snapshot.value;
  closeKnownResultContainers(raw, violations);
  // Closed-shape failures never justify replaying up to the caller's work
  // budget. The response is already invalid, so fail before reference work or
  // deterministic DFS reconstruction.
  if (violations.length > 0) return failed(violations);

  const semanticsReference = parseBoxPleatingPackingSemanticsV1(raw.semanticsReference);
  if (!semanticsReference.ok) {
    for (const entry of semanticsReference.error) {
      pushViolation(
        violations,
        'semantics-reference',
        prefixPath('$.result.semanticsReference', entry.path),
        entry.code === 'claim-boundary' ? 'claim-boundary' : 'source-mismatch',
        entry.message,
        'semantics',
        entry.code,
      );
    }
  }

  const problemReference = validatePolygonRiverPackingProblemResultV1(
    input.packingProblemInput,
    raw.packingProblemReference,
  );
  if (!problemReference.ok) {
    for (const entry of problemReference.violations) {
      pushViolation(
        violations,
        'packing-problem-reference',
        prefixPath('$.result.packingProblemReference', entry.path.replace(/^\$\.result/u, '$')),
        entry.code === 'claim-boundary' ? 'claim-boundary' : 'source-mismatch',
        entry.message,
        entry.stage,
        entry.code,
      );
    }
  }
  if (!semanticsReference.ok || !problemReference.ok) return failed(violations);

  compareClosedValue(
    raw.semanticsReference,
    input.semantics,
    '$.result.semanticsReference',
    violations,
  );
  compareClosedValue(
    raw.packingProblemReference,
    problemReference.value,
    '$.result.packingProblemReference',
    violations,
  );

  const preparation = prepareReplay(problemReference.value, violations);
  if (preparation === undefined) return failed(violations);
  const replay = replayCanonicalTraversal(
    problemReference.value,
    preparation,
    input.value.maxVisitedStates,
    input.value.maxWitnesses,
  );
  const expected = expectedResult(input, problemReference.value, replay);

  for (const key of RESULT_KEYS) {
    if (
      key !== 'semanticsReference' &&
      key !== 'packingProblemReference' &&
      Object.hasOwn(raw, key)
    ) {
      compareClosedValue(raw[key], expected[key], `$.result.${key}`, violations);
    }
  }
  if (violations.length > 0) return failed(violations);
  return deepFreezeOwned({ ok: true as const, value: deepFreezeOwned(expected) });
}
