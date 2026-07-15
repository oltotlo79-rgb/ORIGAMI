import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  compareExactRational,
  divideExactRational,
  exactRational,
  exactRationalKey,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import { exactRationalToJsonV1, type ExactRationalJsonV1 } from '../model/exact-rational-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';

export const BRANCH_GRID_ALLOCATION_INPUT_RECORD_TYPE = 'm0f-branch-grid-allocation-input' as const;
export const BRANCH_GRID_ALLOCATION_RESULT_RECORD_TYPE =
  'm0f-branch-grid-allocation-result' as const;

/**
 * Defensive implementation ceilings only. They are neither a SupportProfile
 * nor a statement that a box-pleating construction exists at these sizes.
 */
export const BRANCH_GRID_ALLOCATION_LIMITS = deepFreezeOwned({
  maxColumns: 512,
  maxRows: 512,
  maxBranches: 256,
  maxExactIntegerDigits: 512,
  maxCandidateIdLength: 1088,
  maxDimensionSteps: '1048576',
});

export type BranchGridAllocationBranchClass = 'terminal' | 'internal';
export type BranchGridAllocationFitAxis = 'x' | 'y' | 'both';

export type BranchGridAllocationInputBranchV1 = Readonly<{
  id: string;
  branchClass: BranchGridAllocationBranchClass;
  length: ExactRationalJsonV1;
  width: ExactRationalJsonV1;
}>;

export type BranchGridAllocationInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BRANCH_GRID_ALLOCATION_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  squareGridCandidate: Readonly<{
    candidateId: string;
    columns: number;
    rows: number;
    fitAxis: BranchGridAllocationFitAxis;
    cellSize: ExactRationalJsonV1;
  }>;
  relativeErrorLimit: ExactRationalJsonV1;
  branches: readonly BranchGridAllocationInputBranchV1[];
}>;

export type BranchGridAllocationInputIssue = Readonly<{
  path: string;
  code:
    | 'invalid-snapshot'
    | 'invalid-object'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'claim-boundary'
    | 'invalid-bound'
    | 'invalid-array'
    | 'invalid-id'
    | 'duplicate-id'
    | 'invalid-enum'
    | 'invalid-integer'
    | 'not-normalized'
    | 'candidate-identity-mismatch';
  message: string;
}>;

export type BranchGridAllocationInputParseResult =
  | Readonly<{ ok: true; value: BranchGridAllocationInputV1 }>
  | Readonly<{ ok: false; error: readonly BranchGridAllocationInputIssue[] }>;

export type BranchGridAllocatedDimensionV1 = Readonly<{
  sourceValue: ExactRationalJsonV1;
  /** Canonical nonnegative base-10 integer. */
  steps: string;
  gridValue: ExactRationalJsonV1;
  relativeError: ExactRationalJsonV1;
}>;

export type BranchGridAllocationV1 = Readonly<{
  branchId: string;
  branchClass: BranchGridAllocationBranchClass;
  length: BranchGridAllocatedDimensionV1;
  width: BranchGridAllocatedDimensionV1;
}>;

export type BranchGridAllocationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BRANCH_GRID_ALLOCATION_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'branch-dimension-grid-allocation-only';
  placementIncluded: false;
  pleatRoutingIncluded: false;
  mountainValleyIncluded: false;
  foldabilityIncluded: false;
  squareGridCandidate: Readonly<{
    candidateId: string;
    columns: number;
    rows: number;
    fitAxis: BranchGridAllocationFitAxis;
    cellSize: ExactRationalJsonV1;
  }>;
  relativeErrorLimit: ExactRationalJsonV1;
  quantizationRule: 'nearest-integer-half-up';
  allocationOrder: 'branch-id-code-unit';
  allocations: readonly BranchGridAllocationV1[];
}>;

export type BranchGridAllocationFailure = Readonly<{
  path: string;
  code: 'relative-error-exceeded' | 'step-limit-exceeded';
  message: string;
}>;

export type BranchGridAllocationResult =
  | Readonly<{ ok: true; value: BranchGridAllocationResultV1 }>
  | Readonly<{
      ok: false;
      error: readonly (BranchGridAllocationInputIssue | BranchGridAllocationFailure)[];
    }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'squareGridCandidate',
  'relativeErrorLimit',
  'branches',
] as const;
const GRID_KEYS = ['candidateId', 'columns', 'rows', 'fitAxis', 'cellSize'] as const;
const BRANCH_KEYS = ['id', 'branchClass', 'length', 'width'] as const;
const RATIONAL_KEYS = ['numerator', 'denominator'] as const;
const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;
const MAX_DIMENSION_STEPS = BigInt(BRANCH_GRID_ALLOCATION_LIMITS.maxDimensionSteps);

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function addInputIssue(
  issues: BranchGridAllocationInputIssue[],
  path: string,
  code: BranchGridAllocationInputIssue['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function closedKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  issues: BranchGridAllocationInputIssue[],
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      addInputIssue(issues, `${path}.${key}`, 'unknown-field', 'field is not declared by input v1');
    }
  }
  for (const key of allowedKeys) {
    if (!Object.hasOwn(value, key)) {
      addInputIssue(issues, `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function boundedPositiveInteger(
  value: unknown,
  maximum: number,
  path: string,
  issues: BranchGridAllocationInputIssue[],
): value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    addInputIssue(
      issues,
      path,
      'invalid-bound',
      `must be a positive safe integer no greater than ${String(maximum)}`,
    );
    return false;
  }
  return true;
}

function digitCount(value: string): number {
  return value.startsWith('-') ? value.length - 1 : value.length;
}

function parseRational(
  supplied: unknown,
  path: string,
  issues: BranchGridAllocationInputIssue[],
): ExactRational | undefined {
  if (!isRecord(supplied)) {
    addInputIssue(issues, path, 'invalid-object', 'exact rational must be an object');
    return undefined;
  }
  closedKeys(supplied, RATIONAL_KEYS, path, issues);
  const numerator = supplied.numerator;
  const denominator = supplied.denominator;
  let valid = true;
  if (
    typeof numerator !== 'string' ||
    digitCount(numerator) > BRANCH_GRID_ALLOCATION_LIMITS.maxExactIntegerDigits ||
    !INTEGER_PATTERN.test(numerator)
  ) {
    addInputIssue(
      issues,
      `${path}.numerator`,
      'invalid-integer',
      `must be a canonical integer string of at most ${String(BRANCH_GRID_ALLOCATION_LIMITS.maxExactIntegerDigits)} digits`,
    );
    valid = false;
  }
  if (
    typeof denominator !== 'string' ||
    digitCount(denominator) > BRANCH_GRID_ALLOCATION_LIMITS.maxExactIntegerDigits ||
    !POSITIVE_INTEGER_PATTERN.test(denominator)
  ) {
    addInputIssue(
      issues,
      `${path}.denominator`,
      'invalid-integer',
      `must be a canonical positive integer string of at most ${String(BRANCH_GRID_ALLOCATION_LIMITS.maxExactIntegerDigits)} digits`,
    );
    valid = false;
  }
  if (!valid || typeof numerator !== 'string' || typeof denominator !== 'string') return undefined;

  const value = exactRational(BigInt(numerator), BigInt(denominator));
  if (value.numerator.toString() !== numerator || value.denominator.toString() !== denominator) {
    addInputIssue(
      issues,
      path,
      'not-normalized',
      'fraction must be reduced, use a positive denominator, and encode zero as 0/1',
    );
    return undefined;
  }
  return value;
}

function parseNonnegativeRational(
  supplied: unknown,
  path: string,
  issues: BranchGridAllocationInputIssue[],
): ExactRational | undefined {
  const value = parseRational(supplied, path, issues);
  if (value !== undefined && value.numerator < 0n) {
    addInputIssue(issues, path, 'invalid-bound', 'must be greater than or equal to zero');
    return undefined;
  }
  return value;
}

function parsePositiveRational(
  supplied: unknown,
  path: string,
  issues: BranchGridAllocationInputIssue[],
): ExactRational | undefined {
  const value = parseRational(supplied, path, issues);
  if (value !== undefined && value.numerator <= 0n) {
    addInputIssue(issues, path, 'invalid-bound', 'must be greater than zero');
    return undefined;
  }
  return value;
}

function rationalFromJson(value: ExactRationalJsonV1): ExactRational {
  return exactRational(BigInt(value.numerator), BigInt(value.denominator));
}

function canonicalCandidateId(
  columns: number,
  rows: number,
  fitAxis: BranchGridAllocationFitAxis,
  cellSize: ExactRational,
): string {
  const fitKey = fitAxis === 'both' ? 'xy' : fitAxis;
  return `square-grid:${String(columns)}x${String(rows)}:${fitKey}:${exactRationalKey(cellSize)}`;
}

/**
 * Accepts only the exact, no-claim boundary needed to allocate branch
 * dimensions. Branches are canonicalized by ID before any computation.
 */
export function parseBranchGridAllocationInputV1(
  supplied: unknown,
): BranchGridAllocationInputParseResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot',
          message: 'input must be one cloneable plain JSON-data snapshot',
        },
      ],
    };
  }
  const raw = snapshot.value;
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-object', message: 'input must be an object' }],
    };
  }

  const issues: BranchGridAllocationInputIssue[] = [];
  closedKeys(raw, ROOT_KEYS, '$', issues);
  if (raw.schemaVersion !== 1) {
    addInputIssue(issues, '$.schemaVersion', 'invalid-literal', 'must equal 1');
  }
  if (raw.recordType !== BRANCH_GRID_ALLOCATION_INPUT_RECORD_TYPE) {
    addInputIssue(
      issues,
      '$.recordType',
      'invalid-literal',
      `must equal ${BRANCH_GRID_ALLOCATION_INPUT_RECORD_TYPE}`,
    );
  }
  if (raw.contractStatus !== 'candidate') {
    addInputIssue(issues, '$.contractStatus', 'claim-boundary', 'must equal candidate');
  }
  if (raw.scientificClaim !== false) {
    addInputIssue(issues, '$.scientificClaim', 'claim-boundary', 'must equal false');
  }

  let squareGridCandidate: BranchGridAllocationInputV1['squareGridCandidate'] | undefined;
  if (!isRecord(raw.squareGridCandidate)) {
    addInputIssue(
      issues,
      '$.squareGridCandidate',
      'invalid-object',
      'squareGridCandidate must be an object',
    );
  } else {
    const grid = raw.squareGridCandidate;
    closedKeys(grid, GRID_KEYS, '$.squareGridCandidate', issues);
    const candidateId = grid.candidateId;
    const candidateIdOk =
      typeof candidateId === 'string' &&
      candidateId.length > 0 &&
      candidateId.length <= BRANCH_GRID_ALLOCATION_LIMITS.maxCandidateIdLength;
    if (!candidateIdOk) {
      addInputIssue(
        issues,
        '$.squareGridCandidate.candidateId',
        'invalid-id',
        `candidateId must contain 1..${String(BRANCH_GRID_ALLOCATION_LIMITS.maxCandidateIdLength)} characters`,
      );
    }
    const columnsOk = boundedPositiveInteger(
      grid.columns,
      BRANCH_GRID_ALLOCATION_LIMITS.maxColumns,
      '$.squareGridCandidate.columns',
      issues,
    );
    const rowsOk = boundedPositiveInteger(
      grid.rows,
      BRANCH_GRID_ALLOCATION_LIMITS.maxRows,
      '$.squareGridCandidate.rows',
      issues,
    );
    const fitAxis = grid.fitAxis;
    const fitAxisOk = fitAxis === 'x' || fitAxis === 'y' || fitAxis === 'both';
    if (!fitAxisOk) {
      addInputIssue(
        issues,
        '$.squareGridCandidate.fitAxis',
        'invalid-enum',
        'must equal x, y, or both',
      );
    }
    const cellSize = parsePositiveRational(grid.cellSize, '$.squareGridCandidate.cellSize', issues);
    if (
      candidateIdOk &&
      typeof candidateId === 'string' &&
      columnsOk &&
      rowsOk &&
      fitAxisOk &&
      cellSize !== undefined &&
      typeof grid.columns === 'number' &&
      typeof grid.rows === 'number'
    ) {
      const expectedId = canonicalCandidateId(grid.columns, grid.rows, fitAxis, cellSize);
      if (candidateId !== expectedId) {
        addInputIssue(
          issues,
          '$.squareGridCandidate.candidateId',
          'candidate-identity-mismatch',
          'candidateId must match columns, rows, fitAxis, and exact cellSize',
        );
      } else {
        squareGridCandidate = {
          candidateId,
          columns: grid.columns,
          rows: grid.rows,
          fitAxis,
          cellSize: exactRationalToJsonV1(cellSize),
        };
      }
    }
  }

  const relativeErrorLimit = parseNonnegativeRational(
    raw.relativeErrorLimit,
    '$.relativeErrorLimit',
    issues,
  );

  const branches: BranchGridAllocationInputBranchV1[] = [];
  if (!Array.isArray(raw.branches)) {
    addInputIssue(issues, '$.branches', 'invalid-array', 'branches must be a nonempty array');
  } else if (
    raw.branches.length === 0 ||
    raw.branches.length > BRANCH_GRID_ALLOCATION_LIMITS.maxBranches
  ) {
    addInputIssue(
      issues,
      '$.branches',
      'invalid-bound',
      `must contain 1..${String(BRANCH_GRID_ALLOCATION_LIMITS.maxBranches)} branches`,
    );
  } else {
    const ids = new Map<string, string>();
    raw.branches.forEach((entry, index) => {
      const path = `$.branches[${String(index)}]`;
      if (!isRecord(entry)) {
        addInputIssue(issues, path, 'invalid-object', 'branch must be an object');
        return;
      }
      closedKeys(entry, BRANCH_KEYS, path, issues);
      const id = entry.id;
      let idOk = false;
      if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
        addInputIssue(
          issues,
          `${path}.id`,
          'invalid-id',
          'must be a stable ASCII ID of 1..128 characters',
        );
      } else if (ids.has(id)) {
        addInputIssue(
          issues,
          `${path}.id`,
          'duplicate-id',
          `${id} is already declared at ${ids.get(id) ?? 'an earlier branch'}`,
        );
      } else {
        ids.set(id, `${path}.id`);
        idOk = true;
      }

      const branchClass = entry.branchClass;
      const classOk = branchClass === 'terminal' || branchClass === 'internal';
      if (!classOk) {
        addInputIssue(
          issues,
          `${path}.branchClass`,
          'invalid-enum',
          'must equal terminal or internal',
        );
      }
      const length = parsePositiveRational(entry.length, `${path}.length`, issues);
      const width = parseNonnegativeRational(entry.width, `${path}.width`, issues);
      if (
        idOk &&
        typeof id === 'string' &&
        classOk &&
        length !== undefined &&
        width !== undefined
      ) {
        branches.push({
          id,
          branchClass,
          length: exactRationalToJsonV1(length),
          width: exactRationalToJsonV1(width),
        });
      }
    });
  }

  if (issues.length > 0 || squareGridCandidate === undefined || relativeErrorLimit === undefined) {
    return { ok: false, error: deepFreezeOwned(issues) };
  }
  branches.sort((left, right) => compareCodeUnits(left.id, right.id));
  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: BRANCH_GRID_ALLOCATION_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      squareGridCandidate,
      relativeErrorLimit: exactRationalToJsonV1(relativeErrorLimit),
      branches,
    }),
  };
}

function floorNonnegativeRational(value: ExactRational): bigint {
  if (value.numerator < 0n) throw new RangeError('floor helper requires a nonnegative rational');
  return value.numerator / value.denominator;
}

function nearestIntegerHalfUp(value: ExactRational): bigint {
  const lower = floorNonnegativeRational(value);
  const remainder = value.numerator % value.denominator;
  return remainder * 2n >= value.denominator ? lower + 1n : lower;
}

function absoluteRational(value: ExactRational): ExactRational {
  return value.numerator < 0n ? exactRational(-value.numerator, value.denominator) : value;
}

type DimensionAllocation = Readonly<{
  ok: true;
  value: BranchGridAllocatedDimensionV1;
}>;

function allocateDimension(
  source: ExactRational,
  cellSize: ExactRational,
  relativeErrorLimit: ExactRational,
  path: string,
): DimensionAllocation | Readonly<{ ok: false; error: BranchGridAllocationFailure }> {
  if (source.numerator === 0n) {
    const zero = exactRational(0n);
    return {
      ok: true,
      value: {
        sourceValue: exactRationalToJsonV1(zero),
        steps: '0',
        gridValue: exactRationalToJsonV1(zero),
        relativeError: exactRationalToJsonV1(zero),
      },
    };
  }

  const steps = nearestIntegerHalfUp(divideExactRational(source, cellSize));
  if (steps > MAX_DIMENSION_STEPS) {
    return {
      ok: false,
      error: {
        path,
        code: 'step-limit-exceeded',
        message: `nearest allocation exceeds the defensive ${BRANCH_GRID_ALLOCATION_LIMITS.maxDimensionSteps}-step ceiling`,
      },
    };
  }
  const gridValue = multiplyExactRational(cellSize, exactRational(steps));
  const relativeError = divideExactRational(
    absoluteRational(subtractExactRational(gridValue, source)),
    source,
  );
  if (compareExactRational(relativeError, relativeErrorLimit) > 0) {
    return {
      ok: false,
      error: {
        path,
        code: 'relative-error-exceeded',
        message: 'nearest half-up grid allocation exceeds relativeErrorLimit',
      },
    };
  }
  return {
    ok: true,
    value: {
      sourceValue: exactRationalToJsonV1(source),
      steps: steps.toString(),
      gridValue: exactRationalToJsonV1(gridValue),
      relativeError: exactRationalToJsonV1(relativeError),
    },
  };
}

/**
 * Allocates only exact branch length/width values to integer cell steps for
 * one square-grid candidate. It does not place a branch or construct any
 * crease, junction, assignment, target state, or folding path.
 */
export function allocateBranchDimensionsToSquareGridV1(
  supplied: unknown,
): BranchGridAllocationResult {
  const parsed = parseBranchGridAllocationInputV1(supplied);
  if (!parsed.ok) return parsed;
  const input = parsed.value;
  const cellSize = rationalFromJson(input.squareGridCandidate.cellSize);
  const relativeErrorLimit = rationalFromJson(input.relativeErrorLimit);
  const allocations: BranchGridAllocationV1[] = [];
  const failures: BranchGridAllocationFailure[] = [];

  for (const [index, branch] of input.branches.entries()) {
    const length = allocateDimension(
      rationalFromJson(branch.length),
      cellSize,
      relativeErrorLimit,
      `$.branches[${String(index)}].length`,
    );
    const width = allocateDimension(
      rationalFromJson(branch.width),
      cellSize,
      relativeErrorLimit,
      `$.branches[${String(index)}].width`,
    );
    if (!length.ok) failures.push(length.error);
    if (!width.ok) failures.push(width.error);
    if (length.ok && width.ok) {
      allocations.push({
        branchId: branch.id,
        branchClass: branch.branchClass,
        length: length.value,
        width: width.value,
      });
    }
  }

  if (failures.length > 0) return { ok: false, error: deepFreezeOwned(failures) };
  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: BRANCH_GRID_ALLOCATION_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'branch-dimension-grid-allocation-only',
      placementIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      squareGridCandidate: input.squareGridCandidate,
      relativeErrorLimit: input.relativeErrorLimit,
      quantizationRule: 'nearest-integer-half-up',
      allocationOrder: 'branch-id-code-unit',
      allocations,
    }),
  };
}
