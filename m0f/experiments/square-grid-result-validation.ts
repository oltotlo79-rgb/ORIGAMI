import {
  SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS,
  SQUARE_GRID_CANDIDATE_RESULT_RECORD_TYPE,
} from '../box-pleating/square-grid-candidates.js';
import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  compareExactRational,
  divideExactRational,
  exactRational,
  exactRationalKey,
  finiteBinary64ToExactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import { parseExactRationalJsonV1 } from '../model/exact-rational-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';

export type SquareGridCompletedResultViolation = Readonly<{
  path: string;
  message: string;
}>;

export type SquareGridCompletedResultValidation =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; violations: readonly SquareGridCompletedResultViolation[] }>;

const VALID = Object.freeze({ ok: true as const });
const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'scope',
  'placementIncluded',
  'pleatRoutingIncluded',
  'paper',
  'enumerationBounds',
  'relativeErrorLimit',
  'sourceBranches',
  'quantizationRule',
  'candidateOrder',
  'candidates',
] as const;
const PAPER_KEYS = ['width', 'height'] as const;
const BOUNDS_KEYS = ['maxColumns', 'maxRows'] as const;
const SOURCE_BRANCH_KEYS = ['id', 'branchClass', 'length', 'width'] as const;
const CANDIDATE_KEYS = [
  'candidateId',
  'columns',
  'rows',
  'fitAxis',
  'cellSize',
  'gridRegion',
  'residualStrips',
  'maximumRelativeError',
  'branchQuantizations',
] as const;
const GRID_REGION_KEYS = ['width', 'height'] as const;
const RESIDUAL_KEYS = ['xAxis', 'yAxis'] as const;
const BRANCH_KEYS = ['branchId', 'branchClass', 'length', 'width'] as const;
const DIMENSION_KEYS = [
  'sourceValue',
  'sourceValueExact',
  'steps',
  'quantizedValue',
  'relativeError',
] as const;
const BRANCH_ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const NONNEGATIVE_INTEGER_PATTERN = /^(?:0|[1-9][0-9]*)$/;
/** Defensive persisted-payload budgets; these are not product support-profile limits. */
export const SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS = Object.freeze({
  exactIntegerDigits: 2048,
  stepDigits: 1024,
  candidateIdCodeUnits: 4160,
  snapshotStringCodeUnits: 8192,
  snapshotContainerCount: 700_000,
  snapshotDepth: 16,
  snapshotObjectPropertyCount: 16,
  snapshotPropertyNameCodeUnits: 64,
  snapshotTotalStringCodeUnits: 512_000_000,
  snapshotTotalPropertyCount: 2_100_000,
});

type Violation = SquareGridCompletedResultViolation;

type CandidateSortData = Readonly<{
  candidateId: string;
  maximumError: ExactRational;
  residualArea: ExactRational;
  columns: number;
  rows: number;
  fitAxis: 'x' | 'y' | 'both';
  branchSignature: string;
}>;

function invalid(violations: readonly Violation[]): SquareGridCompletedResultValidation {
  return deepFreezeOwned({
    ok: false as const,
    violations: violations.map((violation) => ({ ...violation })),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function closedKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  violations: Violation[],
): void {
  const expectedSet = new Set(expected);
  for (const key of Object.keys(value)) {
    if (!expectedSet.has(key)) {
      violations.push({ path: `${path}.${key}`, message: 'field is not declared' });
    }
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) {
      violations.push({ path: `${path}.${key}`, message: 'required field is missing' });
    }
  }
}

function exactLiteral(
  value: unknown,
  expected: string | number | boolean,
  path: string,
  violations: Violation[],
): void {
  if (value !== expected) {
    violations.push({ path, message: `must equal ${JSON.stringify(expected)}` });
  }
}

function positiveBoundedInteger(
  value: unknown,
  maximum: number,
  path: string,
  violations: Violation[],
): number | undefined {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    violations.push({
      path,
      message: `must be a positive safe integer no greater than ${String(maximum)}`,
    });
    return undefined;
  }
  return value;
}

function rational(
  value: unknown,
  path: string,
  violations: Violation[],
): ExactRational | undefined {
  if (isRecord(value)) {
    for (const key of ['numerator', 'denominator'] as const) {
      const integer = value[key];
      if (
        typeof integer === 'string' &&
        (integer.startsWith('-') ? integer.length - 1 : integer.length) >
          SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.exactIntegerDigits
      ) {
        violations.push({
          path: `${path}.${key}`,
          message: `must contain at most ${String(SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.exactIntegerDigits)} decimal digits`,
        });
        return undefined;
      }
    }
  }
  const parsed = parseExactRationalJsonV1(value);
  if (parsed.ok) return parsed.value;
  for (const issue of parsed.error) {
    violations.push({
      path: issue.path === '$' ? path : `${path}${issue.path.slice(1)}`,
      message: `[${issue.code}] ${issue.message}`,
    });
  }
  return undefined;
}

function requireSign(
  value: ExactRational | undefined,
  sign: 'positive' | 'nonnegative',
  path: string,
  violations: Violation[],
): void {
  if (
    value !== undefined &&
    (value.numerator < 0n || (sign === 'positive' && value.numerator === 0n))
  ) {
    violations.push({ path, message: `must be ${sign}` });
  }
}

function equalRational(
  actual: ExactRational | undefined,
  expected: ExactRational | undefined,
  path: string,
  message: string,
  violations: Violation[],
): void {
  if (
    actual !== undefined &&
    expected !== undefined &&
    compareExactRational(actual, expected) !== 0
  ) {
    violations.push({ path, message });
  }
}

function finiteSourceNumber(
  value: unknown,
  allowZero: boolean,
  path: string,
  violations: Violation[],
): number | undefined {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    (!allowZero && value === 0)
  ) {
    violations.push({
      path,
      message: allowZero
        ? 'must be a finite non-negative number'
        : 'must be a finite positive number',
    });
    return undefined;
  }
  return value === 0 ? 0 : value;
}

function validateSourceBranches(
  value: unknown,
  violations: Violation[],
): Readonly<{ count: number; signature: string }> | undefined {
  const path = '$.result.sourceBranches';
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches
  ) {
    violations.push({
      path,
      message: `must be an array of 1..${String(SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches)} branches`,
    });
    return undefined;
  }

  const startingViolationCount = violations.length;
  const ids = new Set<string>();
  const signature: string[] = [];
  let previousId: string | undefined;
  value.forEach((entry, index) => {
    const branchPath = `${path}[${String(index)}]`;
    if (!isRecord(entry)) {
      violations.push({ path: branchPath, message: 'must be an object' });
      return;
    }
    closedKeys(entry, SOURCE_BRANCH_KEYS, branchPath, violations);

    const id = entry.id;
    let idOk = false;
    if (typeof id !== 'string' || !BRANCH_ID_PATTERN.test(id)) {
      violations.push({ path: `${branchPath}.id`, message: 'must be a stable branch ID' });
    } else {
      idOk = true;
      if (ids.has(id)) {
        violations.push({ path: `${branchPath}.id`, message: 'must be unique' });
        idOk = false;
      }
      if (previousId !== undefined && previousId >= id) {
        violations.push({ path: `${branchPath}.id`, message: 'must be in strict ID order' });
        idOk = false;
      }
      ids.add(id);
      previousId = id;
    }

    const branchClass = entry.branchClass;
    const classOk = branchClass === 'terminal' || branchClass === 'internal';
    if (!classOk) {
      violations.push({
        path: `${branchPath}.branchClass`,
        message: 'must equal terminal or internal',
      });
    }
    const length = finiteSourceNumber(entry.length, false, `${branchPath}.length`, violations);
    const width = finiteSourceNumber(entry.width, true, `${branchPath}.width`, violations);
    if (idOk && typeof id === 'string' && classOk && length !== undefined && width !== undefined) {
      signature.push(`${id}\0${branchClass}\0${String(length)}\0${String(width)}`);
    }
  });

  if (violations.length !== startingViolationCount) return undefined;
  return { count: value.length, signature: signature.join('\u0001') };
}

function validateDimension(
  value: unknown,
  path: string,
  cellSize: ExactRational | undefined,
  errorLimit: ExactRational | undefined,
  allowZero: boolean,
  violations: Violation[],
): ExactRational | undefined {
  if (!isRecord(value)) {
    violations.push({ path, message: 'must be an object' });
    return undefined;
  }
  closedKeys(value, DIMENSION_KEYS, path, violations);
  const sourceValue = finiteSourceNumber(
    value.sourceValue,
    allowZero,
    `${path}.sourceValue`,
    violations,
  );
  const sourceExact = rational(value.sourceValueExact, `${path}.sourceValueExact`, violations);
  const quantized = rational(value.quantizedValue, `${path}.quantizedValue`, violations);
  const relativeError = rational(value.relativeError, `${path}.relativeError`, violations);
  requireSign(
    sourceExact,
    allowZero ? 'nonnegative' : 'positive',
    `${path}.sourceValueExact`,
    violations,
  );
  requireSign(quantized, 'nonnegative', `${path}.quantizedValue`, violations);
  requireSign(relativeError, 'nonnegative', `${path}.relativeError`, violations);

  let steps: bigint | undefined;
  if (
    typeof value.steps !== 'string' ||
    value.steps.length > SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.stepDigits ||
    !NONNEGATIVE_INTEGER_PATTERN.test(value.steps)
  ) {
    violations.push({ path: `${path}.steps`, message: 'must be a canonical non-negative integer' });
  } else {
    steps = BigInt(value.steps);
  }

  if (sourceValue !== undefined && sourceExact !== undefined) {
    equalRational(
      sourceExact,
      finiteBinary64ToExactRational(sourceValue),
      `${path}.sourceValueExact`,
      'must be the exact binary64 source value',
      violations,
    );
  }
  if (cellSize !== undefined && steps !== undefined && quantized !== undefined) {
    equalRational(
      quantized,
      multiplyExactRational(cellSize, exactRational(steps)),
      `${path}.quantizedValue`,
      'must equal cellSize multiplied by steps',
      violations,
    );
  }
  if (
    sourceExact !== undefined &&
    sourceExact.numerator >= 0n &&
    cellSize !== undefined &&
    cellSize.numerator > 0n &&
    steps !== undefined
  ) {
    const unrounded = divideExactRational(sourceExact, cellSize);
    const lower = unrounded.numerator / unrounded.denominator;
    const remainder = unrounded.numerator % unrounded.denominator;
    const expectedSteps = remainder * 2n >= unrounded.denominator ? lower + 1n : lower;
    if (steps !== expectedSteps) {
      violations.push({
        path: `${path}.steps`,
        message: 'must equal exact nearest-integer-half-up quantization',
      });
    }
  }

  if (sourceExact !== undefined && quantized !== undefined && relativeError !== undefined) {
    let expectedError: ExactRational;
    if (sourceExact.numerator === 0n) {
      expectedError = exactRational(0n);
      if (steps !== undefined && steps !== 0n) {
        violations.push({
          path: `${path}.steps`,
          message: 'zero source values require zero steps',
        });
      }
      if (quantized.numerator !== 0n) {
        violations.push({
          path: `${path}.quantizedValue`,
          message: 'zero source values require zero quantized value',
        });
      }
    } else {
      const difference = subtractExactRational(quantized, sourceExact);
      const absolute =
        difference.numerator < 0n
          ? exactRational(-difference.numerator, difference.denominator)
          : difference;
      expectedError = exactRational(
        absolute.numerator * sourceExact.denominator,
        absolute.denominator * sourceExact.numerator,
      );
    }
    equalRational(
      relativeError,
      expectedError,
      `${path}.relativeError`,
      'must equal the exact relative quantization error',
      violations,
    );
  }
  if (
    relativeError !== undefined &&
    errorLimit !== undefined &&
    compareExactRational(relativeError, errorLimit) > 0
  ) {
    violations.push({ path: `${path}.relativeError`, message: 'must not exceed the error limit' });
  }
  return relativeError;
}

function validateBranchQuantizations(
  value: unknown,
  path: string,
  cellSize: ExactRational | undefined,
  errorLimit: ExactRational | undefined,
  violations: Violation[],
): Readonly<{ maximumError: ExactRational; signature: string }> | undefined {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches
  ) {
    violations.push({
      path,
      message: `must be an array of 1..${String(SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches)} branches`,
    });
    return undefined;
  }

  const ids = new Set<string>();
  const signature: string[] = [];
  let previousId: string | undefined;
  let maximumError = exactRational(0n);
  value.forEach((entry, index) => {
    const branchPath = `${path}[${String(index)}]`;
    if (!isRecord(entry)) {
      violations.push({ path: branchPath, message: 'must be an object' });
      return;
    }
    closedKeys(entry, BRANCH_KEYS, branchPath, violations);
    const branchId = entry.branchId;
    if (typeof branchId !== 'string' || !BRANCH_ID_PATTERN.test(branchId)) {
      violations.push({ path: `${branchPath}.branchId`, message: 'must be a stable branch ID' });
    } else {
      if (ids.has(branchId)) {
        violations.push({ path: `${branchPath}.branchId`, message: 'must be unique' });
      }
      if (previousId !== undefined && previousId >= branchId) {
        violations.push({ path: `${branchPath}.branchId`, message: 'must be in strict ID order' });
      }
      ids.add(branchId);
      previousId = branchId;
    }
    const branchClass = entry.branchClass;
    if (branchClass !== 'terminal' && branchClass !== 'internal') {
      violations.push({
        path: `${branchPath}.branchClass`,
        message: 'must equal terminal or internal',
      });
    }
    const lengthError = validateDimension(
      entry.length,
      `${branchPath}.length`,
      cellSize,
      errorLimit,
      false,
      violations,
    );
    const widthError = validateDimension(
      entry.width,
      `${branchPath}.width`,
      cellSize,
      errorLimit,
      true,
      violations,
    );
    for (const error of [lengthError, widthError]) {
      if (error !== undefined && compareExactRational(error, maximumError) > 0) {
        maximumError = error;
      }
    }
    if (
      typeof branchId === 'string' &&
      (branchClass === 'terminal' || branchClass === 'internal') &&
      isRecord(entry.length) &&
      typeof entry.length.sourceValue === 'number' &&
      isRecord(entry.width) &&
      typeof entry.width.sourceValue === 'number'
    ) {
      signature.push(
        `${branchId}\0${branchClass}\0${String(entry.length.sourceValue)}\0${String(entry.width.sourceValue)}`,
      );
    }
  });
  return { maximumError, signature: signature.join('\u0001') };
}

function validateCandidate(
  value: unknown,
  index: number,
  paperWidth: ExactRational | undefined,
  paperHeight: ExactRational | undefined,
  maxColumns: number | undefined,
  maxRows: number | undefined,
  errorLimit: ExactRational | undefined,
  violations: Violation[],
): CandidateSortData | undefined {
  const path = `$.result.candidates[${String(index)}]`;
  if (!isRecord(value)) {
    violations.push({ path, message: 'must be an object' });
    return undefined;
  }
  closedKeys(value, CANDIDATE_KEYS, path, violations);
  const columns = positiveBoundedInteger(
    value.columns,
    maxColumns ?? SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxColumns,
    `${path}.columns`,
    violations,
  );
  const rows = positiveBoundedInteger(
    value.rows,
    maxRows ?? SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxRows,
    `${path}.rows`,
    violations,
  );
  const fitAxis = value.fitAxis;
  if (fitAxis !== 'x' && fitAxis !== 'y' && fitAxis !== 'both') {
    violations.push({ path: `${path}.fitAxis`, message: 'must equal x, y, or both' });
  }
  const cellSize = rational(value.cellSize, `${path}.cellSize`, violations);
  requireSign(cellSize, 'positive', `${path}.cellSize`, violations);
  const maximumError = rational(
    value.maximumRelativeError,
    `${path}.maximumRelativeError`,
    violations,
  );
  requireSign(maximumError, 'nonnegative', `${path}.maximumRelativeError`, violations);
  if (
    maximumError !== undefined &&
    errorLimit !== undefined &&
    compareExactRational(maximumError, errorLimit) > 0
  ) {
    violations.push({
      path: `${path}.maximumRelativeError`,
      message: 'must not exceed the error limit',
    });
  }

  let gridWidth: ExactRational | undefined;
  let gridHeight: ExactRational | undefined;
  if (!isRecord(value.gridRegion)) {
    violations.push({ path: `${path}.gridRegion`, message: 'must be an object' });
  } else {
    closedKeys(value.gridRegion, GRID_REGION_KEYS, `${path}.gridRegion`, violations);
    gridWidth = rational(value.gridRegion.width, `${path}.gridRegion.width`, violations);
    gridHeight = rational(value.gridRegion.height, `${path}.gridRegion.height`, violations);
    requireSign(gridWidth, 'positive', `${path}.gridRegion.width`, violations);
    requireSign(gridHeight, 'positive', `${path}.gridRegion.height`, violations);
  }

  let residualX: ExactRational | undefined;
  let residualY: ExactRational | undefined;
  if (!isRecord(value.residualStrips)) {
    violations.push({ path: `${path}.residualStrips`, message: 'must be an object' });
  } else {
    closedKeys(value.residualStrips, RESIDUAL_KEYS, `${path}.residualStrips`, violations);
    residualX = rational(value.residualStrips.xAxis, `${path}.residualStrips.xAxis`, violations);
    residualY = rational(value.residualStrips.yAxis, `${path}.residualStrips.yAxis`, violations);
    requireSign(residualX, 'nonnegative', `${path}.residualStrips.xAxis`, violations);
    requireSign(residualY, 'nonnegative', `${path}.residualStrips.yAxis`, violations);
  }

  if (cellSize !== undefined && columns !== undefined) {
    equalRational(
      gridWidth,
      multiplyExactRational(cellSize, exactRational(BigInt(columns))),
      `${path}.gridRegion.width`,
      'must equal cellSize multiplied by columns',
      violations,
    );
  }
  if (cellSize !== undefined && rows !== undefined) {
    equalRational(
      gridHeight,
      multiplyExactRational(cellSize, exactRational(BigInt(rows))),
      `${path}.gridRegion.height`,
      'must equal cellSize multiplied by rows',
      violations,
    );
  }
  if (gridWidth !== undefined && residualX !== undefined) {
    equalRational(
      addExactRational(gridWidth, residualX),
      paperWidth,
      `${path}.residualStrips.xAxis`,
      'grid width plus residual must equal paper width',
      violations,
    );
  }
  if (gridHeight !== undefined && residualY !== undefined) {
    equalRational(
      addExactRational(gridHeight, residualY),
      paperHeight,
      `${path}.residualStrips.yAxis`,
      'grid height plus residual must equal paper height',
      violations,
    );
  }
  if (residualX !== undefined && residualY !== undefined) {
    const expectedFit =
      residualX.numerator === 0n && residualY.numerator === 0n
        ? 'both'
        : residualX.numerator === 0n
          ? 'x'
          : residualY.numerator === 0n
            ? 'y'
            : undefined;
    if (expectedFit === undefined) {
      violations.push({
        path: `${path}.residualStrips`,
        message: 'at least one paper-axis residual must be zero',
      });
    } else if (fitAxis !== expectedFit) {
      violations.push({ path: `${path}.fitAxis`, message: 'must match the zero residual axes' });
    }
  }

  if (
    (fitAxis === 'x' || fitAxis === 'both') &&
    paperHeight !== undefined &&
    cellSize !== undefined &&
    cellSize.numerator > 0n &&
    maxRows !== undefined &&
    rows !== undefined
  ) {
    const fittingRows = divideExactRational(paperHeight, cellSize);
    const maximumRows =
      fittingRows.numerator / fittingRows.denominator < BigInt(maxRows)
        ? fittingRows.numerator / fittingRows.denominator
        : BigInt(maxRows);
    if (BigInt(rows) !== maximumRows) {
      violations.push({
        path: `${path}.rows`,
        message: 'x-anchored candidates must use the largest bounded fitting row count',
      });
    }
  }
  if (
    (fitAxis === 'y' || fitAxis === 'both') &&
    paperWidth !== undefined &&
    cellSize !== undefined &&
    cellSize.numerator > 0n &&
    maxColumns !== undefined &&
    columns !== undefined
  ) {
    const fittingColumns = divideExactRational(paperWidth, cellSize);
    const maximumColumns =
      fittingColumns.numerator / fittingColumns.denominator < BigInt(maxColumns)
        ? fittingColumns.numerator / fittingColumns.denominator
        : BigInt(maxColumns);
    if (BigInt(columns) !== maximumColumns) {
      violations.push({
        path: `${path}.columns`,
        message: 'y-anchored candidates must use the largest bounded fitting column count',
      });
    }
  }

  const branchData = validateBranchQuantizations(
    value.branchQuantizations,
    `${path}.branchQuantizations`,
    cellSize,
    errorLimit,
    violations,
  );
  if (branchData !== undefined) {
    equalRational(
      maximumError,
      branchData.maximumError,
      `${path}.maximumRelativeError`,
      'must equal the maximum branch-dimension error',
      violations,
    );
  }

  const candidateId = value.candidateId;
  const candidateIdOk =
    typeof candidateId === 'string' &&
    candidateId.length <= SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.candidateIdCodeUnits;
  if (!candidateIdOk) {
    violations.push({
      path: `${path}.candidateId`,
      message: `must be a string of at most ${String(SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.candidateIdCodeUnits)} code units`,
    });
  } else if (
    typeof candidateId === 'string' &&
    columns !== undefined &&
    rows !== undefined &&
    (fitAxis === 'x' || fitAxis === 'y' || fitAxis === 'both') &&
    cellSize !== undefined
  ) {
    const fitKey = fitAxis === 'both' ? 'xy' : fitAxis;
    const expectedId = `square-grid:${String(columns)}x${String(rows)}:${fitKey}:${exactRationalKey(cellSize)}`;
    if (candidateId !== expectedId) {
      violations.push({
        path: `${path}.candidateId`,
        message: 'must match the canonical grid identity',
      });
    }
  }

  if (
    !candidateIdOk ||
    typeof candidateId !== 'string' ||
    maximumError === undefined ||
    gridWidth === undefined ||
    gridHeight === undefined ||
    paperWidth === undefined ||
    paperHeight === undefined ||
    columns === undefined ||
    rows === undefined ||
    (fitAxis !== 'x' && fitAxis !== 'y' && fitAxis !== 'both') ||
    branchData === undefined
  ) {
    return undefined;
  }
  const paperArea = multiplyExactRational(paperWidth, paperHeight);
  const gridArea = multiplyExactRational(gridWidth, gridHeight);
  return {
    candidateId,
    maximumError,
    residualArea: subtractExactRational(paperArea, gridArea),
    columns,
    rows,
    fitAxis,
    branchSignature: branchData.signature,
  };
}

function compareCandidates(left: CandidateSortData, right: CandidateSortData): number {
  const error = compareExactRational(left.maximumError, right.maximumError);
  if (error !== 0) return error;
  const residual = compareExactRational(left.residualArea, right.residualArea);
  if (residual !== 0) return residual;
  const cells = left.columns * left.rows - right.columns * right.rows;
  if (cells !== 0) return cells;
  if (left.columns !== right.columns) return left.columns - right.columns;
  if (left.rows !== right.rows) return left.rows - right.rows;
  const fitOrder = { both: 0, x: 1, y: 2 } as const;
  return fitOrder[left.fitAxis] - fitOrder[right.fitAxis];
}

/** Strict integrity validation for a completed built-in quantization payload. */
export function validateSquareGridQuantizationCompletedResultV1(
  result: unknown,
): SquareGridCompletedResultValidation {
  const snapshot = tryCreateStrictValidationSnapshot(result, {
    maxArrayLength:
      SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxColumns +
      SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxRows,
    maxContainerCount: SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotContainerCount,
    maxDepth: SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotDepth,
    maxObjectPropertyCount: SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotObjectPropertyCount,
    maxPropertyNameCodeUnits:
      SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotPropertyNameCodeUnits,
    maxStringCodeUnits: SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotStringCodeUnits,
    maxTotalStringCodeUnits: SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotTotalStringCodeUnits,
    maxTotalPropertyCount: SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotTotalPropertyCount,
  });
  if (!snapshot.ok) {
    return invalid([
      {
        path: '$.result',
        message: `must be one plain cloneable JSON-data snapshot; received ${snapshot.reason}`,
      },
    ]);
  }
  if (!isRecord(snapshot.value)) {
    return invalid([{ path: '$.result', message: 'must be an object' }]);
  }

  const root = snapshot.value;
  const violations: Violation[] = [];
  closedKeys(root, ROOT_KEYS, '$.result', violations);
  exactLiteral(root.schemaVersion, 1, '$.result.schemaVersion', violations);
  exactLiteral(
    root.recordType,
    SQUARE_GRID_CANDIDATE_RESULT_RECORD_TYPE,
    '$.result.recordType',
    violations,
  );
  exactLiteral(root.contractStatus, 'candidate', '$.result.contractStatus', violations);
  exactLiteral(root.scientificClaim, false, '$.result.scientificClaim', violations);
  exactLiteral(root.scope, 'square-grid-quantization-only', '$.result.scope', violations);
  exactLiteral(root.placementIncluded, false, '$.result.placementIncluded', violations);
  exactLiteral(root.pleatRoutingIncluded, false, '$.result.pleatRoutingIncluded', violations);
  exactLiteral(
    root.quantizationRule,
    'nearest-integer-half-up',
    '$.result.quantizationRule',
    violations,
  );
  exactLiteral(
    root.candidateOrder,
    'error-then-residual-area-then-cell-count-then-columns-then-rows-then-fit-axis',
    '$.result.candidateOrder',
    violations,
  );

  let paperWidth: ExactRational | undefined;
  let paperHeight: ExactRational | undefined;
  if (!isRecord(root.paper)) {
    violations.push({ path: '$.result.paper', message: 'must be an object' });
  } else {
    closedKeys(root.paper, PAPER_KEYS, '$.result.paper', violations);
    paperWidth = rational(root.paper.width, '$.result.paper.width', violations);
    paperHeight = rational(root.paper.height, '$.result.paper.height', violations);
    requireSign(paperWidth, 'positive', '$.result.paper.width', violations);
    requireSign(paperHeight, 'positive', '$.result.paper.height', violations);
  }

  let maxColumns: number | undefined;
  let maxRows: number | undefined;
  if (!isRecord(root.enumerationBounds)) {
    violations.push({ path: '$.result.enumerationBounds', message: 'must be an object' });
  } else {
    closedKeys(root.enumerationBounds, BOUNDS_KEYS, '$.result.enumerationBounds', violations);
    maxColumns = positiveBoundedInteger(
      root.enumerationBounds.maxColumns,
      SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxColumns,
      '$.result.enumerationBounds.maxColumns',
      violations,
    );
    maxRows = positiveBoundedInteger(
      root.enumerationBounds.maxRows,
      SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxRows,
      '$.result.enumerationBounds.maxRows',
      violations,
    );
  }
  const errorLimit = rational(root.relativeErrorLimit, '$.result.relativeErrorLimit', violations);
  requireSign(errorLimit, 'nonnegative', '$.result.relativeErrorLimit', violations);
  const sourceBranchData = validateSourceBranches(root.sourceBranches, violations);
  if (
    sourceBranchData !== undefined &&
    maxColumns !== undefined &&
    maxRows !== undefined &&
    (maxColumns + maxRows) * sourceBranchData.count >
      SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxCandidateBranchQuantizations
  ) {
    violations.push({
      path: '$.result.sourceBranches',
      message:
        'branch count multiplied by the x/y anchor bounds must not exceed the defensive work-surface limit',
    });
  }

  if (!Array.isArray(root.candidates)) {
    violations.push({ path: '$.result.candidates', message: 'must be an array' });
  } else {
    const maximumCount =
      (maxColumns ?? SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxColumns) +
      (maxRows ?? SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxRows);
    let withinWorkSurface = true;
    if (root.candidates.length > maximumCount) {
      violations.push({
        path: '$.result.candidates',
        message: 'must not exceed the bounded x/y anchor count',
      });
      withinWorkSurface = false;
    }

    let totalCandidateBranchRecords = 0;
    if (withinWorkSurface) {
      for (const [index, candidate] of root.candidates.entries()) {
        if (isRecord(candidate) && Array.isArray(candidate.branchQuantizations)) {
          totalCandidateBranchRecords += candidate.branchQuantizations.length;
          if (
            maxColumns !== undefined &&
            maxRows !== undefined &&
            (maxColumns + maxRows) * candidate.branchQuantizations.length >
              SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxCandidateBranchQuantizations
          ) {
            violations.push({
              path: `$.result.candidates[${String(index)}].branchQuantizations`,
              message:
                'branch count multiplied by the x/y anchor bounds must not exceed the defensive work-surface limit',
            });
            withinWorkSurface = false;
            break;
          }
          if (
            totalCandidateBranchRecords >
            SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxCandidateBranchQuantizations
          ) {
            violations.push({
              path: '$.result.candidates',
              message:
                'total candidate branch records must not exceed the defensive work-surface limit',
            });
            withinWorkSurface = false;
            break;
          }
        }
      }
    }
    if (withinWorkSurface) {
      const candidateData = root.candidates.map((candidate, index) =>
        validateCandidate(
          candidate,
          index,
          paperWidth,
          paperHeight,
          maxColumns,
          maxRows,
          errorLimit,
          violations,
        ),
      );
      const ids = new Set<string>();
      let previous: CandidateSortData | undefined;
      let branchSignature: string | undefined;
      candidateData.forEach((candidate, index) => {
        if (candidate === undefined) return;
        if (ids.has(candidate.candidateId)) {
          violations.push({
            path: `$.result.candidates[${String(index)}].candidateId`,
            message: 'must be unique',
          });
        }
        ids.add(candidate.candidateId);
        if (previous !== undefined && compareCandidates(previous, candidate) > 0) {
          violations.push({
            path: `$.result.candidates[${String(index)}]`,
            message: 'must follow the declared canonical candidate order',
          });
        }
        if (branchSignature === undefined) branchSignature = candidate.branchSignature;
        else if (candidate.branchSignature !== branchSignature) {
          violations.push({
            path: `$.result.candidates[${String(index)}].branchQuantizations`,
            message: 'all candidates must describe the same canonical branch input set',
          });
        }
        if (
          sourceBranchData !== undefined &&
          candidate.branchSignature !== sourceBranchData.signature
        ) {
          violations.push({
            path: `$.result.candidates[${String(index)}].branchQuantizations`,
            message: 'must match the declared canonical source branch set',
          });
        }
        previous = candidate;
      });
    }
  }

  return violations.length === 0 ? VALID : invalid(violations);
}
