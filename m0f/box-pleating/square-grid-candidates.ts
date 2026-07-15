import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  compareExactRational,
  divideExactRational,
  exactRational,
  exactRationalKey,
  finiteBinary64ToExactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import { exactRationalToJsonV1, type ExactRationalJsonV1 } from '../model/exact-rational-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';

export const SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE = 'm0f-square-grid-candidate-input' as const;
export const SQUARE_GRID_CANDIDATE_RESULT_RECORD_TYPE = 'm0f-square-grid-candidate-result' as const;

/**
 * Defensive implementation bounds, not product support boundaries. The
 * current M0F profile experiment points (at most 128 by 128 and 39 branches)
 * are strictly inside these bounds.
 */
export const SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS = deepFreezeOwned({
  maxColumns: 512,
  maxRows: 512,
  maxBranches: 256,
  /** Bounds the multiplicative result/work surface, not only each input axis. */
  maxCandidateBranchQuantizations: 65_536,
});

export type SquareGridBranchClass = 'terminal' | 'internal';

export type SquareGridCandidateBranchInputV1 = Readonly<{
  id: string;
  branchClass: SquareGridBranchClass;
  length: number;
  width: number;
}>;

export type SquareGridCandidateInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  paper: Readonly<{ width: number; height: number }>;
  maxColumns: number;
  maxRows: number;
  relativeErrorLimit: number;
  branches: readonly SquareGridCandidateBranchInputV1[];
}>;

export type SquareGridCandidateInputIssue = Readonly<{
  path: string;
  code:
    | 'invalid-snapshot'
    | 'invalid-object'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'claim-boundary'
    | 'invalid-number'
    | 'invalid-bound'
    | 'invalid-array'
    | 'invalid-id'
    | 'duplicate-id'
    | 'invalid-enum';
  message: string;
}>;

export type SquareGridCandidateInputParseResult =
  | Readonly<{ ok: true; value: SquareGridCandidateInputV1 }>
  | Readonly<{ ok: false; error: readonly SquareGridCandidateInputIssue[] }>;

export type SquareGridQuantizedDimensionV1 = Readonly<{
  sourceValue: number;
  sourceValueExact: ExactRationalJsonV1;
  /** Canonical nonnegative base-10 integer. */
  steps: string;
  quantizedValue: ExactRationalJsonV1;
  relativeError: ExactRationalJsonV1;
}>;

export type SquareGridBranchQuantizationV1 = Readonly<{
  branchId: string;
  branchClass: SquareGridBranchClass;
  length: SquareGridQuantizedDimensionV1;
  width: SquareGridQuantizedDimensionV1;
}>;

export type SquareGridCandidateV1 = Readonly<{
  candidateId: string;
  columns: number;
  rows: number;
  /** Axis whose grid extent equals the paper extent exactly. */
  fitAxis: 'x' | 'y' | 'both';
  /** One exact value is shared by both cell axes; cells are never stretched. */
  cellSize: ExactRationalJsonV1;
  gridRegion: Readonly<{
    width: ExactRationalJsonV1;
    height: ExactRationalJsonV1;
  }>;
  /** Unoccupied strips at the positive x/y paper boundaries. */
  residualStrips: Readonly<{
    xAxis: ExactRationalJsonV1;
    yAxis: ExactRationalJsonV1;
  }>;
  maximumRelativeError: ExactRationalJsonV1;
  branchQuantizations: readonly SquareGridBranchQuantizationV1[];
}>;

export type SquareGridCandidateResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof SQUARE_GRID_CANDIDATE_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'square-grid-quantization-only';
  placementIncluded: false;
  pleatRoutingIncluded: false;
  paper: Readonly<{
    width: ExactRationalJsonV1;
    height: ExactRationalJsonV1;
  }>;
  enumerationBounds: Readonly<{ maxColumns: number; maxRows: number }>;
  relativeErrorLimit: ExactRationalJsonV1;
  /** Canonical source branches retained even when no candidate passes the bound. */
  sourceBranches: readonly SquareGridCandidateBranchInputV1[];
  quantizationRule: 'nearest-integer-half-up';
  candidateOrder: 'error-then-residual-area-then-cell-count-then-columns-then-rows-then-fit-axis';
  candidates: readonly SquareGridCandidateV1[];
}>;

export type SquareGridCandidateEnumerationResult =
  | Readonly<{ ok: true; value: SquareGridCandidateResultV1 }>
  | Readonly<{ ok: false; error: readonly SquareGridCandidateInputIssue[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'paper',
  'maxColumns',
  'maxRows',
  'relativeErrorLimit',
  'branches',
] as const;
const PAPER_KEYS = ['width', 'height'] as const;
const BRANCH_KEYS = ['id', 'branchClass', 'length', 'width'] as const;
const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function addIssue(
  issues: SquareGridCandidateInputIssue[],
  path: string,
  code: SquareGridCandidateInputIssue['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function closedKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: SquareGridCandidateInputIssue[],
): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      addIssue(issues, `${path}.${key}`, 'unknown-field', 'field is not declared by input v1');
    }
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) {
      addIssue(issues, `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function finiteNumber(
  value: unknown,
  path: string,
  issues: SquareGridCandidateInputIssue[],
): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    addIssue(issues, path, 'invalid-number', 'must be a finite binary64 number');
    return false;
  }
  return true;
}

function positiveNumber(
  value: unknown,
  path: string,
  issues: SquareGridCandidateInputIssue[],
): value is number {
  if (!finiteNumber(value, path, issues)) return false;
  if (value <= 0) {
    addIssue(issues, path, 'invalid-bound', 'must be greater than zero');
    return false;
  }
  return true;
}

function nonnegativeNumber(
  value: unknown,
  path: string,
  issues: SquareGridCandidateInputIssue[],
): value is number {
  if (!finiteNumber(value, path, issues)) return false;
  if (value < 0) {
    addIssue(issues, path, 'invalid-bound', 'must be greater than or equal to zero');
    return false;
  }
  return true;
}

function positiveBoundedInteger(
  value: unknown,
  maximum: number,
  path: string,
  issues: SquareGridCandidateInputIssue[],
): value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    addIssue(
      issues,
      path,
      'invalid-bound',
      `must be a positive safe integer no greater than ${maximum}`,
    );
    return false;
  }
  return true;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Parses one owned, closed candidate input. Branches are canonicalized by ID,
 * so their caller order cannot affect candidate order or error aggregation.
 */
export function parseSquareGridCandidateInputV1(
  supplied: unknown,
): SquareGridCandidateInputParseResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches,
    maxContainerCount: SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches + 8,
    maxDepth: 4,
    maxObjectPropertyCount: 16,
    maxPropertyNameCodeUnits: 64,
    maxStringCodeUnits: 128,
    maxTotalStringCodeUnits: 131_072,
    maxTotalPropertyCount: 1_400,
  });
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

  const issues: SquareGridCandidateInputIssue[] = [];
  closedKeys(raw, ROOT_KEYS, '$', issues);
  if (raw.schemaVersion !== 1) {
    addIssue(issues, '$.schemaVersion', 'invalid-literal', 'must equal 1');
  }
  if (raw.recordType !== SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE) {
    addIssue(
      issues,
      '$.recordType',
      'invalid-literal',
      `must equal ${SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE}`,
    );
  }
  if (raw.contractStatus !== 'candidate') {
    addIssue(issues, '$.contractStatus', 'claim-boundary', 'must equal candidate');
  }
  if (raw.scientificClaim !== false) {
    addIssue(issues, '$.scientificClaim', 'claim-boundary', 'must equal false');
  }

  let paper: { width: number; height: number } | undefined;
  if (!isRecord(raw.paper)) {
    addIssue(issues, '$.paper', 'invalid-object', 'paper must be an object');
  } else {
    closedKeys(raw.paper, PAPER_KEYS, '$.paper', issues);
    const width = raw.paper.width;
    const height = raw.paper.height;
    const widthOk = positiveNumber(width, '$.paper.width', issues);
    const heightOk = positiveNumber(height, '$.paper.height', issues);
    if (widthOk && heightOk) paper = { width, height };
  }

  const columnsOk = positiveBoundedInteger(
    raw.maxColumns,
    SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxColumns,
    '$.maxColumns',
    issues,
  );
  const rowsOk = positiveBoundedInteger(
    raw.maxRows,
    SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxRows,
    '$.maxRows',
    issues,
  );
  const errorLimitOk = nonnegativeNumber(raw.relativeErrorLimit, '$.relativeErrorLimit', issues);

  const branches: SquareGridCandidateBranchInputV1[] = [];
  if (!Array.isArray(raw.branches)) {
    addIssue(issues, '$.branches', 'invalid-array', 'branches must be a nonempty array');
  } else if (
    raw.branches.length === 0 ||
    raw.branches.length > SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches
  ) {
    addIssue(
      issues,
      '$.branches',
      'invalid-bound',
      `must contain 1..${SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches} branches`,
    );
  } else {
    const ids = new Map<string, string>();
    raw.branches.forEach((entry, index) => {
      const path = `$.branches[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, path, 'invalid-object', 'branch must be an object');
        return;
      }
      closedKeys(entry, BRANCH_KEYS, path, issues);

      const id = entry.id;
      let idOk = false;
      if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
        addIssue(
          issues,
          `${path}.id`,
          'invalid-id',
          'must be a stable ASCII ID of 1..128 characters',
        );
      } else {
        idOk = true;
        const previous = ids.get(id);
        if (previous !== undefined) {
          addIssue(
            issues,
            `${path}.id`,
            'duplicate-id',
            `${id} is already declared at ${previous}`,
          );
          idOk = false;
        } else {
          ids.set(id, `${path}.id`);
        }
      }

      const branchClass = entry.branchClass;
      const classOk = branchClass === 'terminal' || branchClass === 'internal';
      if (!classOk) {
        addIssue(issues, `${path}.branchClass`, 'invalid-enum', 'must equal terminal or internal');
      }
      const length = entry.length;
      const width = entry.width;
      const lengthOk = positiveNumber(length, `${path}.length`, issues);
      const widthOk = nonnegativeNumber(width, `${path}.width`, issues);
      if (idOk && typeof id === 'string' && classOk && lengthOk && widthOk) {
        branches.push({
          id,
          branchClass,
          length,
          width: width === 0 ? 0 : width,
        });
      }
    });
  }

  if (
    columnsOk &&
    rowsOk &&
    typeof raw.maxColumns === 'number' &&
    typeof raw.maxRows === 'number' &&
    Array.isArray(raw.branches) &&
    raw.branches.length > 0 &&
    raw.branches.length <= SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches
  ) {
    const maximumCandidateBranchQuantizations =
      (raw.maxColumns + raw.maxRows) * raw.branches.length;
    if (
      maximumCandidateBranchQuantizations >
      SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxCandidateBranchQuantizations
    ) {
      addIssue(
        issues,
        '$.branches',
        'invalid-bound',
        'the sum of the grid-axis bounds multiplied by the branch count must be no greater ' +
          `than ${SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxCandidateBranchQuantizations}`,
      );
    }
  }

  if (issues.length > 0 || paper === undefined || !columnsOk || !rowsOk || !errorLimitOk) {
    return { ok: false, error: deepFreezeOwned(issues) };
  }

  branches.sort((left, right) => compareCodeUnits(left.id, right.id));
  const maxColumns = raw.maxColumns;
  const maxRows = raw.maxRows;
  const relativeErrorLimit = raw.relativeErrorLimit;
  if (
    typeof maxColumns !== 'number' ||
    typeof maxRows !== 'number' ||
    typeof relativeErrorLimit !== 'number'
  ) {
    throw new TypeError('numeric input fields were already validated');
  }
  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      paper,
      maxColumns,
      maxRows,
      relativeErrorLimit: relativeErrorLimit === 0 ? 0 : relativeErrorLimit,
      branches,
    }),
  };
}

function minimumBigInt(left: bigint, right: bigint): bigint {
  return left < right ? left : right;
}

function floorPositiveRational(value: ExactRational): bigint {
  if (value.numerator < 0n) throw new RangeError('floor helper requires a nonnegative rational');
  return value.numerator / value.denominator;
}

function nearestIntegerHalfUp(value: ExactRational): bigint {
  const lower = floorPositiveRational(value);
  const remainder = value.numerator % value.denominator;
  return remainder * 2n >= value.denominator ? lower + 1n : lower;
}

function absoluteRational(value: ExactRational): ExactRational {
  return value.numerator < 0n ? exactRational(-value.numerator, value.denominator) : value;
}

type QuantizedDimensionBuild = Readonly<{
  value: SquareGridQuantizedDimensionV1;
  error: ExactRational;
}>;

function quantizeDimension(
  sourceValue: number,
  cellSize: ExactRational,
  relativeErrorLimit: ExactRational,
): QuantizedDimensionBuild | undefined {
  const sourceExact = finiteBinary64ToExactRational(sourceValue);
  if (sourceExact.numerator === 0n) {
    const zero = exactRational(0n);
    return {
      value: {
        sourceValue: 0,
        sourceValueExact: exactRationalToJsonV1(zero),
        steps: '0',
        quantizedValue: exactRationalToJsonV1(zero),
        relativeError: exactRationalToJsonV1(zero),
      },
      error: zero,
    };
  }

  const steps = nearestIntegerHalfUp(divideExactRational(sourceExact, cellSize));
  const quantized = multiplyExactRational(cellSize, exactRational(steps));
  const error = divideExactRational(
    absoluteRational(subtractExactRational(quantized, sourceExact)),
    sourceExact,
  );
  if (compareExactRational(error, relativeErrorLimit) > 0) return undefined;
  return {
    value: {
      sourceValue,
      sourceValueExact: exactRationalToJsonV1(sourceExact),
      steps: steps.toString(),
      quantizedValue: exactRationalToJsonV1(quantized),
      relativeError: exactRationalToJsonV1(error),
    },
    error,
  };
}

type CandidateBuild = Readonly<{
  value: SquareGridCandidateV1;
  maximumError: ExactRational;
  residualArea: ExactRational;
}>;

function buildCandidate(
  input: SquareGridCandidateInputV1,
  paperWidth: ExactRational,
  paperHeight: ExactRational,
  cellSize: ExactRational,
  columns: number,
  rows: number,
  relativeErrorLimit: ExactRational,
): CandidateBuild | undefined {
  const gridWidth = multiplyExactRational(cellSize, exactRational(BigInt(columns)));
  const gridHeight = multiplyExactRational(cellSize, exactRational(BigInt(rows)));
  const residualX = subtractExactRational(paperWidth, gridWidth);
  const residualY = subtractExactRational(paperHeight, gridHeight);
  if (residualX.numerator < 0n || residualY.numerator < 0n) {
    throw new RangeError('enumerated grid region must remain inside the paper');
  }

  const branchQuantizations: SquareGridBranchQuantizationV1[] = [];
  let maximumError = exactRational(0n);
  for (const branch of input.branches) {
    const length = quantizeDimension(branch.length, cellSize, relativeErrorLimit);
    const width = quantizeDimension(branch.width, cellSize, relativeErrorLimit);
    if (length === undefined || width === undefined) return undefined;
    if (compareExactRational(length.error, maximumError) > 0) maximumError = length.error;
    if (compareExactRational(width.error, maximumError) > 0) maximumError = width.error;
    branchQuantizations.push({
      branchId: branch.id,
      branchClass: branch.branchClass,
      length: length.value,
      width: width.value,
    });
  }

  const fitAxis =
    residualX.numerator === 0n && residualY.numerator === 0n
      ? 'both'
      : residualX.numerator === 0n
        ? 'x'
        : 'y';
  const fitKey = fitAxis === 'both' ? 'xy' : fitAxis;
  const candidateId = `square-grid:${String(columns)}x${String(rows)}:${fitKey}:${exactRationalKey(cellSize)}`;
  const gridArea = multiplyExactRational(gridWidth, gridHeight);
  const paperArea = multiplyExactRational(paperWidth, paperHeight);

  return {
    value: {
      candidateId,
      columns,
      rows,
      fitAxis,
      cellSize: exactRationalToJsonV1(cellSize),
      gridRegion: {
        width: exactRationalToJsonV1(gridWidth),
        height: exactRationalToJsonV1(gridHeight),
      },
      residualStrips: {
        xAxis: exactRationalToJsonV1(residualX),
        yAxis: exactRationalToJsonV1(residualY),
      },
      maximumRelativeError: exactRationalToJsonV1(maximumError),
      branchQuantizations,
    },
    maximumError,
    residualArea: subtractExactRational(paperArea, gridArea),
  };
}

function compareFitAxis(
  left: SquareGridCandidateV1['fitAxis'],
  right: SquareGridCandidateV1['fitAxis'],
): number {
  const order: Readonly<Record<SquareGridCandidateV1['fitAxis'], number>> = {
    both: 0,
    x: 1,
    y: 2,
  };
  return order[left] - order[right];
}

function compareCandidates(left: CandidateBuild, right: CandidateBuild): number {
  const error = compareExactRational(left.maximumError, right.maximumError);
  if (error !== 0) return error;
  const residual = compareExactRational(left.residualArea, right.residualArea);
  if (residual !== 0) return residual;
  const leftCells = left.value.columns * left.value.rows;
  const rightCells = right.value.columns * right.value.rows;
  if (leftCells !== rightCells) return leftCells - rightCells;
  if (left.value.columns !== right.value.columns) return left.value.columns - right.value.columns;
  if (left.value.rows !== right.value.rows) return left.value.rows - right.value.rows;
  return compareFitAxis(left.value.fitAxis, right.value.fitAxis);
}

/**
 * Enumerates only square-cell quantization candidates. For each x-anchored
 * column count and y-anchored row count, the other axis uses the largest count
 * allowed by the paper and caller bound. Exact rational arithmetic decides
 * fit, nearest-step rounding, and the inclusive relative-error boundary.
 *
 * This function does not perform tree placement, axial/river construction,
 * junction construction, or pleat routing.
 */
export function enumerateSquareGridCandidatesV1(
  supplied: unknown,
): SquareGridCandidateEnumerationResult {
  const parsed = parseSquareGridCandidateInputV1(supplied);
  if (!parsed.ok) return parsed;
  const input = parsed.value;
  const paperWidth = finiteBinary64ToExactRational(input.paper.width);
  const paperHeight = finiteBinary64ToExactRational(input.paper.height);
  const relativeErrorLimit = finiteBinary64ToExactRational(input.relativeErrorLimit);
  const byIdentity = new Map<string, CandidateBuild>();

  for (let columns = 1; columns <= input.maxColumns; columns += 1) {
    const cellSize = divideExactRational(paperWidth, exactRational(BigInt(columns)));
    const fittingRows = floorPositiveRational(divideExactRational(paperHeight, cellSize));
    const rows = Number(minimumBigInt(fittingRows, BigInt(input.maxRows)));
    if (rows === 0) continue;
    const candidate = buildCandidate(
      input,
      paperWidth,
      paperHeight,
      cellSize,
      columns,
      rows,
      relativeErrorLimit,
    );
    if (candidate !== undefined) byIdentity.set(candidate.value.candidateId, candidate);
  }

  for (let rows = 1; rows <= input.maxRows; rows += 1) {
    const cellSize = divideExactRational(paperHeight, exactRational(BigInt(rows)));
    const fittingColumns = floorPositiveRational(divideExactRational(paperWidth, cellSize));
    const columns = Number(minimumBigInt(fittingColumns, BigInt(input.maxColumns)));
    if (columns === 0) continue;
    const candidate = buildCandidate(
      input,
      paperWidth,
      paperHeight,
      cellSize,
      columns,
      rows,
      relativeErrorLimit,
    );
    if (candidate !== undefined) byIdentity.set(candidate.value.candidateId, candidate);
  }

  const candidates = [...byIdentity.values()].sort(compareCandidates).map((entry) => entry.value);
  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: SQUARE_GRID_CANDIDATE_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'square-grid-quantization-only',
      placementIncluded: false,
      pleatRoutingIncluded: false,
      paper: {
        width: exactRationalToJsonV1(paperWidth),
        height: exactRationalToJsonV1(paperHeight),
      },
      enumerationBounds: { maxColumns: input.maxColumns, maxRows: input.maxRows },
      relativeErrorLimit: exactRationalToJsonV1(relativeErrorLimit),
      sourceBranches: input.branches,
      quantizationRule: 'nearest-integer-half-up',
      candidateOrder:
        'error-then-residual-area-then-cell-count-then-columns-then-rows-then-fit-axis',
      candidates,
    }),
  };
}
