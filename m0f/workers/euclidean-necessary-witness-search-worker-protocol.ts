import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS,
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_RECORD_TYPE,
  type EuclideanNecessaryWitnessSearchInputV1,
  type EuclideanNecessaryWitnessSearchResultV1,
} from '../box-pleating/euclidean-necessary-witness-search.js';
import { EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS } from '../box-pleating/euclidean-necessary-witness-search-result-validation.js';
import { parseBoxPleatingPackingSemanticsV1 } from '../box-pleating/packing-semantics.js';
import { parsePolygonRiverPackingProblemInputV1 } from '../box-pleating/polygon-river-packing-problem.js';
import { deepFreezeOwned } from '../clone-and-freeze.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';

export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_SCHEMA_VERSION = 1 as const;
export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_REQUEST_MESSAGE_TYPE =
  'm0f-euclidean-necessary-witness-search-request' as const;
export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_RESPONSE_MESSAGE_TYPE =
  'm0f-euclidean-necessary-witness-search-response' as const;
export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION =
  'search-euclidean-necessary-filter-witnesses' as const;
export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_CONTRACT_STATUS = 'candidate' as const;
export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_SCIENTIFIC_CLAIM = false as const;
export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_MAX_JOB_ID_LENGTH = 128 as const;
export const EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_PROTOCOL_LIMITS = deepFreezeOwned({
  maxIssues: 512,
});

export type EuclideanNecessaryWitnessSearchWorkerFailureReasonV1 =
  'search-producer-rejected' | 'internal-error';

export type EuclideanNecessaryWitnessSearchWorkerRequestV1 = Readonly<{
  schemaVersion: 1;
  messageType: typeof EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_REQUEST_MESSAGE_TYPE;
  operation: typeof EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION;
  contractStatus: 'candidate';
  scientificClaim: false;
  jobId: string;
  input: EuclideanNecessaryWitnessSearchInputV1;
}>;

type ResponseBase = Readonly<{
  schemaVersion: 1;
  messageType: typeof EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_RESPONSE_MESSAGE_TYPE;
  operation: typeof EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION;
  contractStatus: 'candidate';
  scientificClaim: false;
  generalPolygonRiverPackingSolverIncluded: false;
  packingIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  jobId: string;
  sourceInput: EuclideanNecessaryWitnessSearchInputV1;
}>;

export type EuclideanNecessaryWitnessSearchWorkerResponseV1 =
  | (ResponseBase &
      Readonly<{
        outcome: 'candidate-produced';
        reason: null;
        candidate: EuclideanNecessaryWitnessSearchResultV1;
      }>)
  | (ResponseBase &
      Readonly<{
        outcome: 'failed';
        reason: EuclideanNecessaryWitnessSearchWorkerFailureReasonV1;
        candidate: null;
      }>);

export type EuclideanNecessaryWitnessSearchWorkerProtocolIssueV1 = Readonly<{
  stage: 'snapshot' | 'structure' | 'input' | 'candidate' | 'invariant';
  path: string;
  code: string;
  message: string;
}>;

export type ParseEuclideanNecessaryWitnessSearchInputV1Result =
  | Readonly<{ ok: true; value: EuclideanNecessaryWitnessSearchInputV1 }>
  | Readonly<{ ok: false; error: readonly EuclideanNecessaryWitnessSearchWorkerProtocolIssueV1[] }>;
export type ParseEuclideanNecessaryWitnessSearchWorkerRequestV1Result =
  | Readonly<{ ok: true; value: EuclideanNecessaryWitnessSearchWorkerRequestV1 }>
  | Readonly<{ ok: false; error: readonly EuclideanNecessaryWitnessSearchWorkerProtocolIssueV1[] }>;
export type ParseEuclideanNecessaryWitnessSearchWorkerResponseV1Result =
  | Readonly<{ ok: true; value: EuclideanNecessaryWitnessSearchWorkerResponseV1 }>
  | Readonly<{ ok: false; error: readonly EuclideanNecessaryWitnessSearchWorkerProtocolIssueV1[] }>;
export type ParseEuclideanNecessaryWitnessCandidateRelayV1Result =
  | Readonly<{ ok: true; value: EuclideanNecessaryWitnessSearchResultV1 }>
  | Readonly<{ ok: false; error: readonly EuclideanNecessaryWitnessSearchWorkerProtocolIssueV1[] }>;

type Issue = EuclideanNecessaryWitnessSearchWorkerProtocolIssueV1;
const JOB_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const INPUT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'semantics',
  'packingProblemInput',
  'maxVisitedStates',
  'maxWitnesses',
] as const;
const REQUEST_KEYS = [
  'schemaVersion',
  'messageType',
  'operation',
  'contractStatus',
  'scientificClaim',
  'jobId',
  'input',
] as const;
const RESPONSE_KEYS = [
  'schemaVersion',
  'messageType',
  'operation',
  'contractStatus',
  'scientificClaim',
  'generalPolygonRiverPackingSolverIncluded',
  'packingIncluded',
  'feasibilityDecisionIncluded',
  'globalM0fGo',
  'jobId',
  'sourceInput',
  'outcome',
  'reason',
  'candidate',
] as const;
const CANDIDATE_KEYS = [
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
] as const;
const FALSE_CANDIDATE_KEYS = [
  'scientificClaim',
  'globalNoSolutionEvidence',
  'packingInfeasibilityEvidence',
  'coordinateDistinctnessConstraintIncluded',
  'widthUsedBySearch',
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
] as const;
const TRUE_CANDIDATE_KEYS = [
  'zeroDemandCoordinateCoincidenceAllowed',
  'assignmentSearchIncluded',
  'necessaryFilterWitnessSearchIncluded',
  'necessaryFilterEvaluationIncluded',
  'filterOnlySearch',
] as const;
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
] as const;
const ASSIGNMENT_KEYS = ['leafNodeId', 'x', 'y'] as const;
const PAIR_KEYS = [
  'firstLeafId',
  'secondLeafId',
  'absoluteDeltaX',
  'absoluteDeltaY',
  'actualSquaredDistance',
  'requiredSquaredDistance',
  'totalLengthSteps',
  'maximumWidthSteps',
  'passesNecessaryFilter',
] as const;
const DECIMAL = /^(?:0|[1-9][0-9]*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** A bounded diagnostic sink prevents hostile nested shapes from amplifying issues. */
function issueList(): Issue[] {
  const issues: Issue[] = [];
  Object.defineProperty(issues, 'push', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: (...entries: Issue[]): number => {
      const remaining =
        EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_PROTOCOL_LIMITS.maxIssues - issues.length;
      if (remaining > 0) Array.prototype.push.apply(issues, entries.slice(0, remaining));
      return issues.length;
    },
  });
  return issues;
}

function fail(error: readonly Issue[]): Readonly<{ ok: false; error: readonly Issue[] }> {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function addClosedIssues(
  raw: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  stage: Issue['stage'],
  issues: Issue[],
): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(raw).sort()) {
    if (!allowed.has(key)) {
      issues.push({
        stage,
        path: `${path}.${key}`,
        code: 'unknown-field',
        message: 'field is not declared by v1',
      });
    }
  }
  for (const key of keys) {
    if (!Object.hasOwn(raw, key)) {
      issues.push({
        stage,
        path: `${path}.${key}`,
        code: 'missing-field',
        message: 'required field is missing',
      });
    }
  }
}

function requestSnapshot(value: unknown) {
  const limits = EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS;
  return tryCreateStrictValidationSnapshot(value, {
    maxArrayLength: limits.maxArrayLength,
    maxContainerCount: limits.maxContainerCount + 16,
    maxDepth: limits.maxDepth + 2,
    maxObjectPropertyCount: limits.maxObjectPropertyCount,
    maxPropertyNameCodeUnits: limits.maxPropertyNameCodeUnits,
    maxStringCodeUnits: limits.maxStringCodeUnits,
    maxTotalStringCodeUnits: limits.maxTotalStringCodeUnits + 16_384,
    maxTotalPropertyCount: limits.maxTotalPropertyCount + 128,
  });
}

function relaySnapshot(value: unknown) {
  const limits = EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS;
  return tryCreateStrictValidationSnapshot(value, {
    maxArrayLength: limits.maxArrayLength,
    maxContainerCount: limits.maxContainerCount + 1_024,
    maxDepth: limits.maxDepth + 2,
    maxObjectPropertyCount: limits.maxObjectPropertyCount,
    maxPropertyNameCodeUnits: limits.maxPropertyNameCodeUnits,
    maxStringCodeUnits: limits.maxStringCodeUnits,
    maxTotalStringCodeUnits: limits.maxTotalStringCodeUnits + 1_048_576,
    maxTotalPropertyCount: limits.maxTotalPropertyCount + 8_192,
  });
}

function validJobId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_MAX_JOB_ID_LENGTH &&
    JOB_ID_PATTERN.test(value)
  );
}

/** Canonicalizes only the declared search input; it never runs either DFS stage. */
export function parseEuclideanNecessaryWitnessSearchInputForWorkerV1(
  supplied: unknown,
): ParseEuclideanNecessaryWitnessSearchInputV1Result {
  const snapshot = requestSnapshot(supplied);
  if (!snapshot.ok || !isRecord(snapshot.value)) {
    return fail([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: 'input must be one bounded accessor-free plain snapshot',
      },
    ]);
  }
  const raw = snapshot.value;
  const issues = issueList();
  addClosedIssues(raw, INPUT_KEYS, '$', 'input', issues);
  const literals: readonly [string, unknown, unknown][] = [
    ['schemaVersion', raw.schemaVersion, 1],
    ['recordType', raw.recordType, EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE],
    ['contractStatus', raw.contractStatus, 'candidate'],
    ['scientificClaim', raw.scientificClaim, false],
  ];
  for (const [key, actual, expected] of literals) {
    if (actual !== expected)
      issues.push({
        stage: 'input',
        path: `$.${key}`,
        code: 'invalid-literal',
        message: `must equal ${String(expected)}`,
      });
  }
  const semantics = parseBoxPleatingPackingSemanticsV1(raw.semantics);
  if (!semantics.ok) {
    for (const entry of semantics.error)
      issues.push({
        stage: 'input',
        path: `$.semantics${entry.path.slice(1)}`,
        code: entry.code,
        message: entry.message,
      });
  }
  const problem = parsePolygonRiverPackingProblemInputV1(raw.packingProblemInput);
  if (!problem.ok) {
    for (const entry of problem.error)
      issues.push({
        stage: 'input',
        path: `$.packingProblemInput${entry.path.slice(1)}`,
        code: entry.code,
        message: entry.message,
      });
  }
  if (
    typeof raw.maxVisitedStates !== 'number' ||
    !Number.isSafeInteger(raw.maxVisitedStates) ||
    raw.maxVisitedStates < 1 ||
    raw.maxVisitedStates > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxVisitedStates
  ) {
    issues.push({
      stage: 'input',
      path: '$.maxVisitedStates',
      code: 'invalid-work-budget',
      message: `must be 1-${String(EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxVisitedStates)}`,
    });
  }
  if (
    typeof raw.maxWitnesses !== 'number' ||
    !Number.isSafeInteger(raw.maxWitnesses) ||
    raw.maxWitnesses < 1 ||
    raw.maxWitnesses > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxWitnesses
  ) {
    issues.push({
      stage: 'input',
      path: '$.maxWitnesses',
      code: 'invalid-witness-limit',
      message: `must be 1-${String(EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxWitnesses)}`,
    });
  }
  if (issues.length > 0 || !semantics.ok || !problem.ok) return fail(issues);
  return deepFreezeOwned({
    ok: true as const,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      semantics: semantics.value,
      packingProblemInput: problem.value,
      maxVisitedStates: raw.maxVisitedStates as number,
      maxWitnesses: raw.maxWitnesses as number,
    }),
  });
}

function candidateIssue(path: string, code: string, message: string): Issue {
  return { stage: 'candidate', path, code, message };
}

function validateWitnesses(raw: Record<string, unknown>, issues: Issue[]): void {
  if (!Array.isArray(raw.witnesses)) {
    issues.push(candidateIssue('$.candidate.witnesses', 'invalid-array', 'must be an array'));
    return;
  }
  const witnesses = raw.witnesses as unknown[];
  for (let index = 0; index < witnesses.length; index += 1) {
    const witness = witnesses[index];
    const path = `$.candidate.witnesses[${String(index)}]`;
    if (!isRecord(witness)) {
      issues.push(candidateIssue(path, 'invalid-object', 'witness must be an object'));
      continue;
    }
    addClosedIssues(witness, WITNESS_KEYS, path, 'candidate', issues);
    if (
      witness.witnessIndex !== index ||
      witness.assignmentRole !== 'projected-leaf-anchors-only-not-polygon-placement' ||
      witness.leafAssignmentOrder !== 'leaf-node-id-code-unit' ||
      witness.pairEvaluationOrder !== 'packing-problem-separation-constraint-order' ||
      witness.allNecessaryPairFiltersPass !== true
    ) {
      issues.push(
        candidateIssue(
          path,
          'invalid-witness-literal',
          'witness relay literals must match the filter-only v1 boundary',
        ),
      );
    }
    for (const key of ['packingEvidence', 'geometryEvidence', 'placementEvidence'] as const) {
      if (witness[key] !== false)
        issues.push(candidateIssue(`${path}.${key}`, 'claim-boundary', 'must equal false'));
    }
    if (
      !Array.isArray(witness.leafAssignments) ||
      witness.leafAssignments.length > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxLeaves
    ) {
      issues.push(
        candidateIssue(
          `${path}.leafAssignments`,
          'invalid-array',
          'leaf assignments exceed the bounded relay',
        ),
      );
    } else {
      const assignments = witness.leafAssignments as unknown[];
      for (let assignmentIndex = 0; assignmentIndex < assignments.length; assignmentIndex += 1) {
        const assignment = assignments[assignmentIndex];
        const assignmentPath = `${path}.leafAssignments[${String(assignmentIndex)}]`;
        if (!isRecord(assignment)) {
          issues.push(
            candidateIssue(assignmentPath, 'invalid-object', 'assignment must be an object'),
          );
          continue;
        }
        addClosedIssues(assignment, ASSIGNMENT_KEYS, assignmentPath, 'candidate', issues);
        if (
          typeof assignment.leafNodeId !== 'string' ||
          assignment.leafNodeId.length === 0 ||
          typeof assignment.x !== 'number' ||
          !Number.isSafeInteger(assignment.x) ||
          typeof assignment.y !== 'number' ||
          !Number.isSafeInteger(assignment.y)
        ) {
          issues.push(
            candidateIssue(
              assignmentPath,
              'invalid-assignment',
              'assignment fields must be a leaf id and safe-integer coordinates',
            ),
          );
        }
      }
    }
    if (!Array.isArray(witness.pairEvaluations) || witness.pairEvaluations.length > 190) {
      issues.push(
        candidateIssue(
          `${path}.pairEvaluations`,
          'invalid-array',
          'pair evaluations exceed the bounded relay',
        ),
      );
    } else {
      const pairs = witness.pairEvaluations as unknown[];
      for (let pairIndex = 0; pairIndex < pairs.length; pairIndex += 1) {
        const pair = pairs[pairIndex];
        const pairPath = `${path}.pairEvaluations[${String(pairIndex)}]`;
        if (!isRecord(pair)) {
          issues.push(
            candidateIssue(pairPath, 'invalid-object', 'pair evaluation must be an object'),
          );
          continue;
        }
        addClosedIssues(pair, PAIR_KEYS, pairPath, 'candidate', issues);
        if (
          typeof pair.firstLeafId !== 'string' ||
          typeof pair.secondLeafId !== 'string' ||
          pair.passesNecessaryFilter !== true ||
          [
            'absoluteDeltaX',
            'absoluteDeltaY',
            'actualSquaredDistance',
            'requiredSquaredDistance',
            'totalLengthSteps',
            'maximumWidthSteps',
          ].some((key) => {
            const value = pair[key];
            return typeof value !== 'string' || !DECIMAL.test(value);
          })
        ) {
          issues.push(
            candidateIssue(
              pairPath,
              'invalid-pair-evaluation',
              'pair relay fields must have the bounded necessary-filter shape',
            ),
          );
        }
      }
    }
  }
}

/** Performs bounded envelope/claim checks only; it deliberately does not replay DFS. */
export function parseEuclideanNecessaryWitnessCandidateRelayV1(
  supplied: unknown,
): ParseEuclideanNecessaryWitnessCandidateRelayV1Result {
  const snapshot = relaySnapshot(supplied);
  if (!snapshot.ok || !isRecord(snapshot.value)) {
    return fail([
      {
        stage: 'snapshot',
        path: '$.candidate',
        code: 'invalid-snapshot',
        message: 'candidate must be one bounded accessor-free plain snapshot',
      },
    ]);
  }
  const raw = snapshot.value;
  const issues = issueList();
  addClosedIssues(raw, CANDIDATE_KEYS, '$.candidate', 'candidate', issues);
  const literals: readonly [string, unknown, unknown][] = [
    ['schemaVersion', raw.schemaVersion, 1],
    ['recordType', raw.recordType, EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_RECORD_TYPE],
    ['contractStatus', raw.contractStatus, 'candidate'],
    ['scope', raw.scope, 'bounded-active-grid-euclidean-necessary-filter-witness-search-only'],
    [
      'interpretation',
      raw.interpretation,
      'finite deterministic assignment search for pairwise necessary-filter witnesses only',
    ],
    ['leafAssignmentOrder', raw.leafAssignmentOrder, 'leaf-node-id-code-unit'],
    ['gridVertexOrder', raw.gridVertexOrder, 'y-then-x'],
    ['traversal', raw.traversal, 'depth-first-canonical-leaf-order'],
    [
      'visitedStateDefinition',
      raw.visitedStateDefinition,
      'one-attempted-leaf-to-grid-vertex-assignment-including-pruned-assignments',
    ],
    [
      'evaluatedRelation',
      raw.evaluatedRelation,
      'dx-squared-plus-dy-squared-at-least-total-length-steps-squared',
    ],
    ['tangencyPolicy', raw.tangencyPolicy, 'allowed-at-equality-for-this-filter'],
    [
      'maximumWidthRole',
      raw.maximumWidthRole,
      'trace-only-without-separation-or-packing-semantics',
    ],
    ['constructionFamily', raw.constructionFamily, 'unresolved'],
  ];
  for (const [key, actual, expected] of literals)
    if (actual !== expected)
      issues.push(
        candidateIssue(`$.candidate.${key}`, 'invalid-literal', `must equal ${String(expected)}`),
      );
  for (const key of FALSE_CANDIDATE_KEYS)
    if (raw[key] !== false)
      issues.push(candidateIssue(`$.candidate.${key}`, 'claim-boundary', 'must equal false'));
  for (const key of TRUE_CANDIDATE_KEYS)
    if (raw[key] !== true)
      issues.push(candidateIssue(`$.candidate.${key}`, 'invalid-literal', 'must equal true'));
  const maxVisitedStates = raw.maxVisitedStates;
  const maxWitnesses = raw.maxWitnesses;
  const visitedStates = raw.visitedStates;
  const witnessCount = raw.witnessCount;
  if (
    typeof maxVisitedStates !== 'number' ||
    !Number.isSafeInteger(maxVisitedStates) ||
    maxVisitedStates < 1 ||
    maxVisitedStates > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxVisitedStates
  )
    issues.push(
      candidateIssue(
        '$.candidate.maxVisitedStates',
        'invalid-work-budget',
        'invalid bounded work budget',
      ),
    );
  if (
    typeof maxWitnesses !== 'number' ||
    !Number.isSafeInteger(maxWitnesses) ||
    maxWitnesses < 1 ||
    maxWitnesses > EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxWitnesses
  )
    issues.push(
      candidateIssue(
        '$.candidate.maxWitnesses',
        'invalid-witness-limit',
        'invalid bounded witness limit',
      ),
    );
  if (
    typeof visitedStates !== 'number' ||
    !Number.isSafeInteger(visitedStates) ||
    visitedStates < 0 ||
    (typeof maxVisitedStates === 'number' && visitedStates > maxVisitedStates)
  )
    issues.push(
      candidateIssue(
        '$.candidate.visitedStates',
        'invalid-work-count',
        'visited state count must lie within the declared budget',
      ),
    );
  if (
    typeof witnessCount !== 'number' ||
    !Number.isSafeInteger(witnessCount) ||
    witnessCount < 0 ||
    (typeof maxWitnesses === 'number' && witnessCount > maxWitnesses)
  )
    issues.push(
      candidateIssue(
        '$.candidate.witnessCount',
        'invalid-witness-count',
        'witness count must lie within the declared limit',
      ),
    );
  if (!isRecord(raw.activeGridDomain)) {
    issues.push(
      candidateIssue(
        '$.candidate.activeGridDomain',
        'invalid-object',
        'active grid domain must be an object',
      ),
    );
  } else {
    addClosedIssues(
      raw.activeGridDomain,
      ['columns', 'rows', 'vertexCount'],
      '$.candidate.activeGridDomain',
      'candidate',
      issues,
    );
    for (const key of ['columns', 'rows', 'vertexCount'] as const) {
      const value = raw.activeGridDomain[key];
      if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1)
        issues.push(
          candidateIssue(
            `$.candidate.activeGridDomain.${key}`,
            'invalid-domain',
            'must be a positive safe integer',
          ),
        );
    }
  }
  validateWitnesses(raw, issues);
  if (Array.isArray(raw.witnesses) && raw.witnesses.length !== witnessCount)
    issues.push(
      candidateIssue(
        '$.candidate.witnessCount',
        'outcome-invariant',
        'must equal witnesses.length',
      ),
    );
  const status = raw.searchStatus;
  if (status !== 'witness-found' && status !== 'budget-exhausted' && status !== 'domain-exhausted')
    issues.push(
      candidateIssue('$.candidate.searchStatus', 'invalid-status', 'invalid bounded search status'),
    );
  const complete = raw.searchComplete;
  if (typeof complete !== 'boolean' || complete !== (status === 'domain-exhausted'))
    issues.push(
      candidateIssue(
        '$.candidate.searchComplete',
        'outcome-invariant',
        'only domain-exhausted is complete',
      ),
    );
  if (
    typeof raw.noNecessaryFilterWitnessInEnumeratedDomain !== 'boolean' ||
    raw.noNecessaryFilterWitnessInEnumeratedDomain !==
      (status === 'domain-exhausted' && witnessCount === 0)
  )
    issues.push(
      candidateIssue(
        '$.candidate.noNecessaryFilterWitnessInEnumeratedDomain',
        'outcome-invariant',
        'must describe only an exhausted zero-witness filter domain',
      ),
    );
  if (status === 'witness-found' && witnessCount !== maxWitnesses)
    issues.push(
      candidateIssue(
        '$.candidate.witnessCount',
        'outcome-invariant',
        'witness-found must reach the declared witness limit',
      ),
    );
  if (status === 'budget-exhausted' && visitedStates !== maxVisitedStates)
    issues.push(
      candidateIssue(
        '$.candidate.visitedStates',
        'outcome-invariant',
        'budget-exhausted must consume the declared budget',
      ),
    );
  if (issues.length > 0) return fail(issues);
  return deepFreezeOwned({
    ok: true as const,
    value: raw as unknown as EuclideanNecessaryWitnessSearchResultV1,
  });
}

function commonEnvelope(
  raw: Record<string, unknown>,
  messageType: string,
  issues: Issue[],
): string | undefined {
  const literals: readonly [string, unknown, unknown][] = [
    ['schemaVersion', raw.schemaVersion, EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_SCHEMA_VERSION],
    ['messageType', raw.messageType, messageType],
    ['operation', raw.operation, EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION],
    [
      'contractStatus',
      raw.contractStatus,
      EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_CONTRACT_STATUS,
    ],
    ['scientificClaim', raw.scientificClaim, false],
  ];
  for (const [key, actual, expected] of literals)
    if (actual !== expected)
      issues.push({
        stage: 'structure',
        path: `$.${key}`,
        code:
          key === 'scientificClaim' || key === 'contractStatus'
            ? 'claim-boundary'
            : 'invalid-literal',
        message: `must equal ${String(expected)}`,
      });
  if (!validJobId(raw.jobId)) {
    issues.push({
      stage: 'structure',
      path: '$.jobId',
      code: 'invalid-job-id',
      message: 'job ID must be bounded stable ASCII',
    });
    return undefined;
  }
  return raw.jobId;
}

export function parseEuclideanNecessaryWitnessSearchWorkerRequestV1(
  supplied: unknown,
): ParseEuclideanNecessaryWitnessSearchWorkerRequestV1Result {
  const snapshot = requestSnapshot(supplied);
  if (!snapshot.ok || !isRecord(snapshot.value))
    return fail([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: 'request must be one bounded accessor-free plain snapshot',
      },
    ]);
  const raw = snapshot.value;
  const issues = issueList();
  addClosedIssues(raw, REQUEST_KEYS, '$', 'structure', issues);
  const jobId = commonEnvelope(
    raw,
    EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_REQUEST_MESSAGE_TYPE,
    issues,
  );
  const input = parseEuclideanNecessaryWitnessSearchInputForWorkerV1(raw.input);
  if (!input.ok)
    for (const entry of input.error)
      issues.push({ ...entry, path: `$.input${entry.path.slice(1)}` });
  if (issues.length > 0 || jobId === undefined || !input.ok) return fail(issues);
  return deepFreezeOwned({
    ok: true as const,
    value: deepFreezeOwned({
      schemaVersion: 1,
      messageType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_REQUEST_MESSAGE_TYPE,
      operation: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION,
      contractStatus: 'candidate',
      scientificClaim: false,
      jobId,
      input: input.value,
    }),
  });
}

export function parseEuclideanNecessaryWitnessSearchWorkerResponseV1(
  supplied: unknown,
): ParseEuclideanNecessaryWitnessSearchWorkerResponseV1Result {
  const snapshot = relaySnapshot(supplied);
  if (!snapshot.ok || !isRecord(snapshot.value))
    return fail([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: 'response must be one bounded accessor-free plain snapshot',
      },
    ]);
  const raw = snapshot.value;
  const issues = issueList();
  addClosedIssues(raw, RESPONSE_KEYS, '$', 'structure', issues);
  const jobId = commonEnvelope(
    raw,
    EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_RESPONSE_MESSAGE_TYPE,
    issues,
  );
  for (const key of [
    'generalPolygonRiverPackingSolverIncluded',
    'packingIncluded',
    'feasibilityDecisionIncluded',
    'globalM0fGo',
  ] as const)
    if (raw[key] !== false)
      issues.push({
        stage: 'structure',
        path: `$.${key}`,
        code: 'claim-boundary',
        message: 'must equal false',
      });
  const input = parseEuclideanNecessaryWitnessSearchInputForWorkerV1(raw.sourceInput);
  if (!input.ok)
    for (const entry of input.error)
      issues.push({ ...entry, path: `$.sourceInput${entry.path.slice(1)}` });
  let candidate: EuclideanNecessaryWitnessSearchResultV1 | undefined;
  if (raw.outcome === 'candidate-produced') {
    if (raw.reason !== null)
      issues.push({
        stage: 'invariant',
        path: '$.reason',
        code: 'outcome-invariant',
        message: 'candidate-produced requires null reason',
      });
    const parsed = parseEuclideanNecessaryWitnessCandidateRelayV1(raw.candidate);
    if (!parsed.ok) for (const entry of parsed.error) issues.push(entry);
    else candidate = parsed.value;
  } else if (raw.outcome === 'failed') {
    if (raw.reason !== 'search-producer-rejected' && raw.reason !== 'internal-error')
      issues.push({
        stage: 'invariant',
        path: '$.reason',
        code: 'outcome-invariant',
        message: 'failed response requires one fixed reason',
      });
    if (raw.candidate !== null)
      issues.push({
        stage: 'invariant',
        path: '$.candidate',
        code: 'outcome-invariant',
        message: 'failed response requires null candidate',
      });
  } else {
    issues.push({
      stage: 'invariant',
      path: '$.outcome',
      code: 'invalid-outcome',
      message: 'invalid search Worker outcome',
    });
  }
  if (issues.length > 0 || jobId === undefined || !input.ok) return fail(issues);
  const base = {
    schemaVersion: 1 as const,
    messageType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_RESPONSE_MESSAGE_TYPE,
    operation: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    generalPolygonRiverPackingSolverIncluded: false as const,
    packingIncluded: false as const,
    feasibilityDecisionIncluded: false as const,
    globalM0fGo: false as const,
    jobId,
    sourceInput: input.value,
  };
  if (raw.outcome === 'candidate-produced' && candidate !== undefined)
    return deepFreezeOwned({
      ok: true as const,
      value: deepFreezeOwned({
        ...base,
        outcome: 'candidate-produced' as const,
        reason: null,
        candidate,
      }),
    });
  if (
    raw.outcome === 'failed' &&
    (raw.reason === 'search-producer-rejected' || raw.reason === 'internal-error')
  )
    return deepFreezeOwned({
      ok: true as const,
      value: deepFreezeOwned({
        ...base,
        outcome: 'failed' as const,
        reason: raw.reason,
        candidate: null,
      }),
    });
  return fail([
    { stage: 'invariant', path: '$', code: 'outcome-invariant', message: 'incomplete response' },
  ]);
}
