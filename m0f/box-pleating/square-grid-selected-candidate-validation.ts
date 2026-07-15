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
import {
  exactRationalToJsonV1,
  parseExactRationalJsonV1,
  type ExactRationalJsonV1,
} from '../model/exact-rational-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  parseSquareGridCandidateInputV1,
  SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS,
  type SquareGridBranchQuantizationV1,
  type SquareGridCandidateBranchInputV1,
  type SquareGridCandidateV1,
  type SquareGridQuantizedDimensionV1,
} from './square-grid-candidates.js';

/**
 * Defensive validation ceilings for one selected candidate. They are neither
 * a product SupportProfile nor evidence that enumeration is complete.
 */
export const SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS = deepFreezeOwned({
  exactIntegerDigits: 2_048,
  stepDigits: 1_024,
  candidateIdCodeUnits: 4_160,
  maxArrayLength: SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches,
  maxContainerCount: 4_096,
  maxDepth: 8,
  maxObjectPropertyCount: 16,
  maxPropertyNameCodeUnits: 64,
  maxStringCodeUnits: 8_192,
  maxTotalStringCodeUnits: 8_388_608,
  maxTotalPropertyCount: 8_192,
  maxViolations: 256,
});

export type SquareGridSelectedCandidateValidationStageV1 =
  | 'source-input'
  | 'candidate-snapshot'
  | 'candidate-structure'
  | 'source-binding'
  | 'exact-arithmetic';

export type SquareGridSelectedCandidateValidationCodeV1 =
  | 'invalid-source-input'
  | 'invalid-snapshot'
  | 'invalid-object'
  | 'unknown-field'
  | 'missing-field'
  | 'invalid-bound'
  | 'invalid-enum'
  | 'invalid-string'
  | 'invalid-integer'
  | 'invalid-rational'
  | 'source-mismatch'
  | 'cardinality-mismatch'
  | 'arithmetic-mismatch'
  | 'candidate-id-mismatch';

export type SquareGridSelectedCandidateViolationV1 = Readonly<{
  stage: SquareGridSelectedCandidateValidationStageV1;
  path: string;
  code: SquareGridSelectedCandidateValidationCodeV1;
  message: string;
}>;

export type SquareGridSelectedCandidateValidationResultV1 =
  | Readonly<{ ok: true; value: SquareGridCandidateV1 }>
  | Readonly<{ ok: false; violations: readonly SquareGridSelectedCandidateViolationV1[] }>;

type MutableViolation = SquareGridSelectedCandidateViolationV1;

type ParsedRational = Readonly<{
  exact: ExactRational;
  json: ExactRationalJsonV1;
}>;

type ParsedDimension = Readonly<{
  value: SquareGridQuantizedDimensionV1;
  error: ExactRational;
}>;

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
const NONNEGATIVE_INTEGER_PATTERN = /^(?:0|[1-9][0-9]*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function addViolation(
  violations: MutableViolation[],
  stage: SquareGridSelectedCandidateValidationStageV1,
  path: string,
  code: SquareGridSelectedCandidateValidationCodeV1,
  message: string,
): void {
  if (violations.length >= SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxViolations) return;
  violations.push({ stage, path, code, message });
}

function failure(
  violations: readonly MutableViolation[],
): Extract<SquareGridSelectedCandidateValidationResultV1, { ok: false }> {
  return deepFreezeOwned({ ok: false as const, violations: [...violations] });
}

function closedKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  violations: MutableViolation[],
): void {
  const expectedSet = new Set(expected);
  for (const key of Object.keys(value)) {
    if (!expectedSet.has(key)) {
      addViolation(
        violations,
        'candidate-structure',
        `${path}.${key}`,
        'unknown-field',
        'field is not declared by the selected-candidate contract',
      );
    }
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) {
      addViolation(
        violations,
        'candidate-structure',
        `${path}.${key}`,
        'missing-field',
        'required field is missing',
      );
    }
  }
}

function positiveBoundedInteger(
  value: unknown,
  maximum: number,
  path: string,
  violations: MutableViolation[],
): number | undefined {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    addViolation(
      violations,
      'candidate-structure',
      path,
      'invalid-bound',
      `must be a positive safe integer no greater than ${String(maximum)}`,
    );
    return undefined;
  }
  return value;
}

function finiteSourceNumber(
  value: unknown,
  allowZero: boolean,
  path: string,
  violations: MutableViolation[],
): number | undefined {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    (!allowZero && value === 0)
  ) {
    addViolation(
      violations,
      'candidate-structure',
      path,
      'invalid-bound',
      allowZero
        ? 'must be a finite nonnegative binary64 number'
        : 'must be a finite positive binary64 number',
    );
    return undefined;
  }
  return value === 0 ? 0 : value;
}

function digitCount(value: string): number {
  return value.startsWith('-') ? value.length - 1 : value.length;
}

function parseRational(
  value: unknown,
  path: string,
  sign: 'positive' | 'nonnegative',
  violations: MutableViolation[],
): ParsedRational | undefined {
  const startingViolationCount = violations.length;
  if (!isRecord(value)) {
    addViolation(
      violations,
      'candidate-structure',
      path,
      'invalid-rational',
      'must be a canonical exact-rational object',
    );
    return undefined;
  }

  let overDigitLimit = false;
  for (const key of ['numerator', 'denominator'] as const) {
    const integer = value[key];
    if (
      typeof integer === 'string' &&
      digitCount(integer) > SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.exactIntegerDigits
    ) {
      overDigitLimit = true;
      addViolation(
        violations,
        'candidate-structure',
        `${path}.${key}`,
        'invalid-integer',
        `must contain at most ${String(SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.exactIntegerDigits)} decimal digits`,
      );
    }
  }
  if (overDigitLimit) return undefined;

  const parsed = parseExactRationalJsonV1(value);
  if (!parsed.ok) {
    for (const issue of parsed.error) {
      addViolation(
        violations,
        'candidate-structure',
        issue.path === '$' ? path : `${path}${issue.path.slice(1)}`,
        'invalid-rational',
        `[${issue.code}] ${issue.message}`,
      );
    }
    return undefined;
  }
  if (parsed.value.numerator < 0n || (sign === 'positive' && parsed.value.numerator === 0n)) {
    addViolation(violations, 'candidate-structure', path, 'invalid-bound', `must be ${sign}`);
  }
  if (violations.length !== startingViolationCount) return undefined;
  return { exact: parsed.value, json: exactRationalToJsonV1(parsed.value) };
}

function requireEqualRational(
  actual: ExactRational | undefined,
  expected: ExactRational | undefined,
  path: string,
  message: string,
  violations: MutableViolation[],
): void {
  if (
    actual !== undefined &&
    expected !== undefined &&
    compareExactRational(actual, expected) !== 0
  ) {
    addViolation(violations, 'exact-arithmetic', path, 'arithmetic-mismatch', message);
  }
}

function absoluteRational(value: ExactRational): ExactRational {
  return value.numerator < 0n ? exactRational(-value.numerator, value.denominator) : value;
}

function expectedRelativeError(source: ExactRational, quantized: ExactRational): ExactRational {
  if (source.numerator === 0n) return exactRational(0n);
  const difference = absoluteRational(subtractExactRational(quantized, source));
  return exactRational(
    difference.numerator * source.denominator,
    difference.denominator * source.numerator,
  );
}

function nearestIntegerHalfUp(value: ExactRational): bigint {
  if (value.numerator < 0n) {
    throw new RangeError('nearest-integer helper requires a nonnegative rational');
  }
  const lower = value.numerator / value.denominator;
  const remainder = value.numerator % value.denominator;
  return remainder * 2n >= value.denominator ? lower + 1n : lower;
}

function parseSteps(
  value: unknown,
  path: string,
  violations: MutableViolation[],
): Readonly<{ bigint: bigint; text: string }> | undefined {
  if (
    typeof value !== 'string' ||
    value.length > SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.stepDigits ||
    !NONNEGATIVE_INTEGER_PATTERN.test(value)
  ) {
    addViolation(
      violations,
      'candidate-structure',
      path,
      'invalid-integer',
      'must be a bounded canonical nonnegative base-10 integer',
    );
    return undefined;
  }
  return { bigint: BigInt(value), text: value };
}

function validateDimension(
  supplied: unknown,
  path: string,
  expectedSourceValue: number,
  allowZero: boolean,
  cellSize: ExactRational | undefined,
  errorLimit: ExactRational,
  violations: MutableViolation[],
): ParsedDimension | undefined {
  const startingViolationCount = violations.length;
  if (!isRecord(supplied)) {
    addViolation(
      violations,
      'candidate-structure',
      path,
      'invalid-object',
      'quantized dimension must be an object',
    );
    return undefined;
  }
  closedKeys(supplied, DIMENSION_KEYS, path, violations);

  const sourceValue = finiteSourceNumber(
    supplied.sourceValue,
    allowZero,
    `${path}.sourceValue`,
    violations,
  );
  if (sourceValue !== undefined && sourceValue !== expectedSourceValue) {
    addViolation(
      violations,
      'source-binding',
      `${path}.sourceValue`,
      'source-mismatch',
      'must equal the canonical source branch dimension',
    );
  }

  const sourceExact = parseRational(
    supplied.sourceValueExact,
    `${path}.sourceValueExact`,
    allowZero ? 'nonnegative' : 'positive',
    violations,
  );
  const steps = parseSteps(supplied.steps, `${path}.steps`, violations);
  const quantized = parseRational(
    supplied.quantizedValue,
    `${path}.quantizedValue`,
    'nonnegative',
    violations,
  );
  const relativeError = parseRational(
    supplied.relativeError,
    `${path}.relativeError`,
    'nonnegative',
    violations,
  );
  const expectedSourceExact = finiteBinary64ToExactRational(expectedSourceValue);

  requireEqualRational(
    sourceExact?.exact,
    expectedSourceExact,
    `${path}.sourceValueExact`,
    'must equal the exact binary64 source branch dimension',
    violations,
  );
  if (sourceValue !== undefined) {
    requireEqualRational(
      sourceExact?.exact,
      finiteBinary64ToExactRational(sourceValue),
      `${path}.sourceValueExact`,
      'must equal the exact candidate sourceValue',
      violations,
    );
  }

  if (cellSize !== undefined && steps !== undefined) {
    requireEqualRational(
      quantized?.exact,
      multiplyExactRational(cellSize, exactRational(steps.bigint)),
      `${path}.quantizedValue`,
      'must equal cellSize multiplied by steps',
      violations,
    );
    const expectedSteps = nearestIntegerHalfUp(divideExactRational(expectedSourceExact, cellSize));
    if (steps.bigint !== expectedSteps) {
      addViolation(
        violations,
        'exact-arithmetic',
        `${path}.steps`,
        'arithmetic-mismatch',
        'must equal exact nearest-integer-half-up quantization',
      );
    }
  }

  if (sourceExact !== undefined && quantized !== undefined) {
    requireEqualRational(
      relativeError?.exact,
      expectedRelativeError(sourceExact.exact, quantized.exact),
      `${path}.relativeError`,
      'must equal the exact relative quantization error',
      violations,
    );
  }
  if (relativeError !== undefined && compareExactRational(relativeError.exact, errorLimit) > 0) {
    addViolation(
      violations,
      'exact-arithmetic',
      `${path}.relativeError`,
      'invalid-bound',
      'must not exceed the source relativeErrorLimit',
    );
  }

  if (
    violations.length !== startingViolationCount ||
    sourceValue === undefined ||
    sourceExact === undefined ||
    steps === undefined ||
    quantized === undefined ||
    relativeError === undefined
  ) {
    return undefined;
  }
  return {
    value: {
      sourceValue,
      sourceValueExact: sourceExact.json,
      steps: steps.text,
      quantizedValue: quantized.json,
      relativeError: relativeError.json,
    },
    error: relativeError.exact,
  };
}

function validateBranchQuantizations(
  supplied: unknown,
  sourceBranches: readonly SquareGridCandidateBranchInputV1[],
  cellSize: ExactRational | undefined,
  errorLimit: ExactRational,
  violations: MutableViolation[],
):
  | Readonly<{
      branches: readonly SquareGridBranchQuantizationV1[];
      maximumError: ExactRational;
    }>
  | undefined {
  const path = '$.candidate.branchQuantizations';
  const startingViolationCount = violations.length;
  if (!isUnknownArray(supplied)) {
    addViolation(violations, 'candidate-structure', path, 'invalid-object', 'must be an array');
    return undefined;
  }
  if (supplied.length !== sourceBranches.length) {
    addViolation(
      violations,
      'source-binding',
      path,
      'cardinality-mismatch',
      'must contain exactly one quantization for every canonical source branch',
    );
  }

  let maximumError = exactRational(0n);
  const branches: SquareGridBranchQuantizationV1[] = [];
  const sharedLength = Math.min(supplied.length, sourceBranches.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const entry = supplied[index];
    const source = sourceBranches[index];
    const branchPath = `${path}[${String(index)}]`;
    if (source === undefined || !isRecord(entry)) {
      addViolation(
        violations,
        'candidate-structure',
        branchPath,
        'invalid-object',
        'branch quantization must be an object',
      );
      continue;
    }
    const branchStartingViolationCount = violations.length;
    closedKeys(entry, BRANCH_KEYS, branchPath, violations);
    if (entry.branchId !== source.id) {
      addViolation(
        violations,
        'source-binding',
        `${branchPath}.branchId`,
        'source-mismatch',
        'must equal the canonical source branch ID at this position',
      );
    }
    if (entry.branchClass !== source.branchClass) {
      addViolation(
        violations,
        'source-binding',
        `${branchPath}.branchClass`,
        'source-mismatch',
        'must equal the canonical source branch class',
      );
    }

    const length = validateDimension(
      entry.length,
      `${branchPath}.length`,
      source.length,
      false,
      cellSize,
      errorLimit,
      violations,
    );
    const width = validateDimension(
      entry.width,
      `${branchPath}.width`,
      source.width,
      true,
      cellSize,
      errorLimit,
      violations,
    );
    for (const dimension of [length, width]) {
      if (dimension !== undefined && compareExactRational(dimension.error, maximumError) > 0) {
        maximumError = dimension.error;
      }
    }
    if (
      violations.length === branchStartingViolationCount &&
      length !== undefined &&
      width !== undefined
    ) {
      branches.push({
        branchId: source.id,
        branchClass: source.branchClass,
        length: length.value,
        width: width.value,
      });
    }
  }

  if (violations.length !== startingViolationCount || branches.length !== sourceBranches.length) {
    return undefined;
  }
  return { branches, maximumError };
}

function maximumFittingCount(
  paperExtent: ExactRational,
  cellSize: ExactRational,
  bound: number,
): bigint {
  const unbounded = divideExactRational(paperExtent, cellSize);
  const fitting = unbounded.numerator / unbounded.denominator;
  return fitting < BigInt(bound) ? fitting : BigInt(bound);
}

/**
 * Independently validates exactly one caller-selected square-grid candidate.
 * It never calls candidate enumeration or the completed-result validator and
 * makes no statement about enumeration completeness/order, placement,
 * packing, foldability, feasibility, or GO status.
 */
export function validateSquareGridSelectedCandidateV1(
  sourceInput: unknown,
  candidate: unknown,
): SquareGridSelectedCandidateValidationResultV1 {
  const parsedSource = parseSquareGridCandidateInputV1(sourceInput);
  if (!parsedSource.ok) {
    return failure(
      parsedSource.error
        .slice(0, SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxViolations)
        .map((issue) => ({
          stage: 'source-input' as const,
          path: issue.path === '$' ? '$.sourceInput' : `$.sourceInput${issue.path.slice(1)}`,
          code: 'invalid-source-input' as const,
          message: `[${issue.code}] ${issue.message}`,
        })),
    );
  }
  const source = parsedSource.value;

  const snapshot = tryCreateStrictValidationSnapshot(candidate, {
    maxArrayLength: SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxArrayLength,
    maxContainerCount: SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxContainerCount,
    maxDepth: SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxDepth,
    maxObjectPropertyCount: SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxObjectPropertyCount,
    maxPropertyNameCodeUnits:
      SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxPropertyNameCodeUnits,
    maxStringCodeUnits: SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxStringCodeUnits,
    maxTotalStringCodeUnits:
      SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxTotalStringCodeUnits,
    maxTotalPropertyCount: SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxTotalPropertyCount,
  });
  if (!snapshot.ok) {
    return failure([
      {
        stage: 'candidate-snapshot',
        path: '$.candidate',
        code: 'invalid-snapshot',
        message: 'candidate must be one bounded accessor-free plain JSON-data snapshot',
      },
    ]);
  }
  if (!isRecord(snapshot.value)) {
    return failure([
      {
        stage: 'candidate-structure',
        path: '$.candidate',
        code: 'invalid-object',
        message: 'candidate must be an object',
      },
    ]);
  }

  const raw = snapshot.value;
  const violations: MutableViolation[] = [];
  closedKeys(raw, CANDIDATE_KEYS, '$.candidate', violations);
  const columns = positiveBoundedInteger(
    raw.columns,
    source.maxColumns,
    '$.candidate.columns',
    violations,
  );
  const rows = positiveBoundedInteger(raw.rows, source.maxRows, '$.candidate.rows', violations);
  const fitAxis = raw.fitAxis;
  if (fitAxis !== 'x' && fitAxis !== 'y' && fitAxis !== 'both') {
    addViolation(
      violations,
      'candidate-structure',
      '$.candidate.fitAxis',
      'invalid-enum',
      'must equal x, y, or both',
    );
  }

  const cellSize = parseRational(raw.cellSize, '$.candidate.cellSize', 'positive', violations);
  const maximumRelativeError = parseRational(
    raw.maximumRelativeError,
    '$.candidate.maximumRelativeError',
    'nonnegative',
    violations,
  );

  let gridWidth: ParsedRational | undefined;
  let gridHeight: ParsedRational | undefined;
  if (!isRecord(raw.gridRegion)) {
    addViolation(
      violations,
      'candidate-structure',
      '$.candidate.gridRegion',
      'invalid-object',
      'gridRegion must be an object',
    );
  } else {
    closedKeys(raw.gridRegion, GRID_REGION_KEYS, '$.candidate.gridRegion', violations);
    gridWidth = parseRational(
      raw.gridRegion.width,
      '$.candidate.gridRegion.width',
      'positive',
      violations,
    );
    gridHeight = parseRational(
      raw.gridRegion.height,
      '$.candidate.gridRegion.height',
      'positive',
      violations,
    );
  }

  let residualX: ParsedRational | undefined;
  let residualY: ParsedRational | undefined;
  if (!isRecord(raw.residualStrips)) {
    addViolation(
      violations,
      'candidate-structure',
      '$.candidate.residualStrips',
      'invalid-object',
      'residualStrips must be an object',
    );
  } else {
    closedKeys(raw.residualStrips, RESIDUAL_KEYS, '$.candidate.residualStrips', violations);
    residualX = parseRational(
      raw.residualStrips.xAxis,
      '$.candidate.residualStrips.xAxis',
      'nonnegative',
      violations,
    );
    residualY = parseRational(
      raw.residualStrips.yAxis,
      '$.candidate.residualStrips.yAxis',
      'nonnegative',
      violations,
    );
  }

  const paperWidth = finiteBinary64ToExactRational(source.paper.width);
  const paperHeight = finiteBinary64ToExactRational(source.paper.height);
  const errorLimit = finiteBinary64ToExactRational(source.relativeErrorLimit);
  if (cellSize !== undefined && columns !== undefined) {
    requireEqualRational(
      gridWidth?.exact,
      multiplyExactRational(cellSize.exact, exactRational(BigInt(columns))),
      '$.candidate.gridRegion.width',
      'must equal cellSize multiplied by columns',
      violations,
    );
  }
  if (cellSize !== undefined && rows !== undefined) {
    requireEqualRational(
      gridHeight?.exact,
      multiplyExactRational(cellSize.exact, exactRational(BigInt(rows))),
      '$.candidate.gridRegion.height',
      'must equal cellSize multiplied by rows',
      violations,
    );
  }
  if (gridWidth !== undefined && residualX !== undefined) {
    requireEqualRational(
      addExactRational(gridWidth.exact, residualX.exact),
      paperWidth,
      '$.candidate.residualStrips.xAxis',
      'grid width plus residual must equal the source paper width',
      violations,
    );
  }
  if (gridHeight !== undefined && residualY !== undefined) {
    requireEqualRational(
      addExactRational(gridHeight.exact, residualY.exact),
      paperHeight,
      '$.candidate.residualStrips.yAxis',
      'grid height plus residual must equal the source paper height',
      violations,
    );
  }

  if (residualX !== undefined && residualY !== undefined) {
    const expectedFitAxis =
      residualX.exact.numerator === 0n && residualY.exact.numerator === 0n
        ? 'both'
        : residualX.exact.numerator === 0n
          ? 'x'
          : residualY.exact.numerator === 0n
            ? 'y'
            : undefined;
    if (expectedFitAxis === undefined) {
      addViolation(
        violations,
        'exact-arithmetic',
        '$.candidate.residualStrips',
        'arithmetic-mismatch',
        'at least one paper-axis residual must be zero',
      );
    } else if (fitAxis !== expectedFitAxis) {
      addViolation(
        violations,
        'source-binding',
        '$.candidate.fitAxis',
        'source-mismatch',
        'must match the zero residual axes',
      );
    }
  }

  if (
    cellSize !== undefined &&
    rows !== undefined &&
    (fitAxis === 'x' || fitAxis === 'both') &&
    BigInt(rows) !== maximumFittingCount(paperHeight, cellSize.exact, source.maxRows)
  ) {
    addViolation(
      violations,
      'exact-arithmetic',
      '$.candidate.rows',
      'arithmetic-mismatch',
      'x-anchored candidates must use the largest bounded fitting row count',
    );
  }
  if (
    cellSize !== undefined &&
    columns !== undefined &&
    (fitAxis === 'y' || fitAxis === 'both') &&
    BigInt(columns) !== maximumFittingCount(paperWidth, cellSize.exact, source.maxColumns)
  ) {
    addViolation(
      violations,
      'exact-arithmetic',
      '$.candidate.columns',
      'arithmetic-mismatch',
      'y-anchored candidates must use the largest bounded fitting column count',
    );
  }

  const branchData = validateBranchQuantizations(
    raw.branchQuantizations,
    source.branches,
    cellSize?.exact,
    errorLimit,
    violations,
  );
  requireEqualRational(
    maximumRelativeError?.exact,
    branchData?.maximumError,
    '$.candidate.maximumRelativeError',
    'must equal the maximum source-bound branch-dimension error',
    violations,
  );
  if (
    maximumRelativeError !== undefined &&
    compareExactRational(maximumRelativeError.exact, errorLimit) > 0
  ) {
    addViolation(
      violations,
      'exact-arithmetic',
      '$.candidate.maximumRelativeError',
      'invalid-bound',
      'must not exceed the source relativeErrorLimit',
    );
  }

  const candidateId = raw.candidateId;
  if (
    typeof candidateId !== 'string' ||
    candidateId.length === 0 ||
    candidateId.length > SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.candidateIdCodeUnits
  ) {
    addViolation(
      violations,
      'candidate-structure',
      '$.candidate.candidateId',
      'invalid-string',
      `must be a nonempty string of at most ${String(SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.candidateIdCodeUnits)} code units`,
    );
  } else if (
    columns !== undefined &&
    rows !== undefined &&
    cellSize !== undefined &&
    (fitAxis === 'x' || fitAxis === 'y' || fitAxis === 'both')
  ) {
    const fitKey = fitAxis === 'both' ? 'xy' : fitAxis;
    const expectedId = `square-grid:${String(columns)}x${String(rows)}:${fitKey}:${exactRationalKey(cellSize.exact)}`;
    if (candidateId !== expectedId) {
      addViolation(
        violations,
        'source-binding',
        '$.candidate.candidateId',
        'candidate-id-mismatch',
        'must match the canonical selected grid identity',
      );
    }
  }

  if (violations.length > 0) return failure(violations);
  if (
    typeof candidateId !== 'string' ||
    columns === undefined ||
    rows === undefined ||
    (fitAxis !== 'x' && fitAxis !== 'y' && fitAxis !== 'both') ||
    cellSize === undefined ||
    gridWidth === undefined ||
    gridHeight === undefined ||
    residualX === undefined ||
    residualY === undefined ||
    maximumRelativeError === undefined ||
    branchData === undefined
  ) {
    return failure([
      {
        stage: 'candidate-structure',
        path: '$.candidate',
        code: 'invalid-object',
        message: 'candidate validation did not produce a complete normalized value',
      },
    ]);
  }

  const value: SquareGridCandidateV1 = {
    candidateId,
    columns,
    rows,
    fitAxis,
    cellSize: cellSize.json,
    gridRegion: { width: gridWidth.json, height: gridHeight.json },
    residualStrips: { xAxis: residualX.json, yAxis: residualY.json },
    maximumRelativeError: maximumRelativeError.json,
    branchQuantizations: branchData.branches,
  };
  return deepFreezeOwned({ ok: true as const, value: deepFreezeOwned(value) });
}
