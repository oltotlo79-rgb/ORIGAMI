import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  equalExactRational,
  exactRational,
  exactRationalKey,
  multiplyExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import { exactRationalToJsonV1, type ExactRationalJsonV1 } from '../model/exact-rational-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';

export const SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE = 'm0f-square-grid-lattice-input' as const;
export const SQUARE_GRID_LATTICE_RESULT_RECORD_TYPE = 'm0f-square-grid-lattice-result' as const;

/**
 * Defensive implementation ceilings only. They bound parser and output work;
 * they are not a SupportProfile and do not establish product support.
 */
export const SQUARE_GRID_LATTICE_LIMITS = deepFreezeOwned({
  maxColumns: 512,
  maxRows: 512,
  maxExactIntegerDigits: 512,
  maxCandidateIdLength: 1_088,
  maxVertices: 70_000,
  maxDirectionPrimitives: 270_000,
  maxOutputRecords: 335_000,
});

export type SquareGridLatticeFitAxis = 'x' | 'y' | 'both';

export type SquareGridLatticeCandidateInputV1 = Readonly<{
  candidateId: string;
  columns: number;
  rows: number;
  fitAxis: SquareGridLatticeFitAxis;
  cellSize: ExactRationalJsonV1;
  paper: Readonly<{
    width: ExactRationalJsonV1;
    height: ExactRationalJsonV1;
  }>;
  residualStrips: Readonly<{
    xAxis: ExactRationalJsonV1;
    yAxis: ExactRationalJsonV1;
  }>;
}>;

export type SquareGridLatticeInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  squareGridCandidate: SquareGridLatticeCandidateInputV1;
}>;

export type SquareGridLatticeInputIssue = Readonly<{
  path: string;
  code:
    | 'invalid-snapshot'
    | 'invalid-object'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'claim-boundary'
    | 'invalid-bound'
    | 'invalid-enum'
    | 'invalid-id'
    | 'invalid-integer'
    | 'not-normalized'
    | 'candidate-identity-mismatch'
    | 'grid-invariant-mismatch'
    | 'output-limit-exceeded';
  message: string;
}>;

export type SquareGridLatticeInputParseResult =
  | Readonly<{ ok: true; value: SquareGridLatticeInputV1 }>
  | Readonly<{ ok: false; error: readonly SquareGridLatticeInputIssue[] }>;

export type SquareGridLatticeVertexV1 = Readonly<{
  vertexId: string;
  gridIndex: Readonly<{ x: number; y: number }>;
  position: Readonly<{ x: ExactRationalJsonV1; y: ExactRationalJsonV1 }>;
}>;

export type SquareGridDirectionFamilyV1 =
  'horizontal' | 'vertical' | 'positive-45-diagonal' | 'negative-45-diagonal';

export type SquareGridDirectionPrimitiveV1 = Readonly<{
  primitiveId: string;
  directionFamily: SquareGridDirectionFamilyV1;
  /** One primitive grid step; this is not a normalized Euclidean vector. */
  gridStep: Readonly<{ dx: 0 | 1; dy: -1 | 0 | 1 }>;
  fromVertexId: string;
  toVertexId: string;
}>;

export type SquareGridLatticeResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof SQUARE_GRID_LATTICE_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'square-grid-lattice-substrate-only';
  isSupportProfile: false;
  cellGeometry: 'square';
  candidateSelectionIncluded: false;
  creaseIncluded: false;
  roleIncluded: false;
  branchPlacementIncluded: false;
  branchPackingIncluded: false;
  axialOrAxialPlusNSelectionIncluded: false;
  riverJunctionIncluded: false;
  pleatRoutingIncluded: false;
  mountainValleyIncluded: false;
  foldabilityIncluded: false;
  feasibilityDecisionIncluded: false;
  directionPrimitiveSemantics: 'grid-direction-only';
  squareGridCandidate: SquareGridLatticeCandidateInputV1;
  internalGridRegion: Readonly<{
    origin: Readonly<{ x: ExactRationalJsonV1; y: ExactRationalJsonV1 }>;
    width: ExactRationalJsonV1;
    height: ExactRationalJsonV1;
  }>;
  residualStrips: Readonly<{
    xAxis: Readonly<{ boundarySide: 'positive-x'; size: ExactRationalJsonV1 }>;
    yAxis: Readonly<{ boundarySide: 'positive-y'; size: ExactRationalJsonV1 }>;
  }>;
  vertexOrder: 'row-major-y-then-x';
  directionPrimitiveOrder: 'horizontal-then-vertical-then-positive-45-then-negative-45-each-row-major';
  counts: Readonly<{
    vertices: number;
    directionPrimitives: number;
    byDirectionFamily: Readonly<{
      horizontal: number;
      vertical: number;
      positive45Diagonal: number;
      negative45Diagonal: number;
    }>;
  }>;
  vertices: readonly SquareGridLatticeVertexV1[];
  directionPrimitives: readonly SquareGridDirectionPrimitiveV1[];
}>;

export type SquareGridLatticeBuildResult =
  | Readonly<{ ok: true; value: SquareGridLatticeResultV1 }>
  | Readonly<{ ok: false; error: readonly SquareGridLatticeInputIssue[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'squareGridCandidate',
] as const;
const CANDIDATE_KEYS = [
  'candidateId',
  'columns',
  'rows',
  'fitAxis',
  'cellSize',
  'paper',
  'residualStrips',
] as const;
const PAPER_KEYS = ['width', 'height'] as const;
const RESIDUAL_KEYS = ['xAxis', 'yAxis'] as const;
const RATIONAL_KEYS = ['numerator', 'denominator'] as const;
const INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function addIssue(
  issues: SquareGridLatticeInputIssue[],
  path: string,
  code: SquareGridLatticeInputIssue['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function closedKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  issues: SquareGridLatticeInputIssue[],
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      addIssue(issues, `${path}.${key}`, 'unknown-field', 'field is not declared by input v1');
    }
  }
  for (const key of allowedKeys) {
    if (!Object.hasOwn(value, key)) {
      addIssue(issues, `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function boundedPositiveInteger(
  value: unknown,
  maximum: number,
  path: string,
  issues: SquareGridLatticeInputIssue[],
): value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    addIssue(
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
  issues: SquareGridLatticeInputIssue[],
): ExactRational | undefined {
  if (!isRecord(supplied)) {
    addIssue(issues, path, 'invalid-object', 'exact rational must be an object');
    return undefined;
  }
  closedKeys(supplied, RATIONAL_KEYS, path, issues);
  const numerator = supplied.numerator;
  const denominator = supplied.denominator;
  let valid = true;
  if (
    typeof numerator !== 'string' ||
    digitCount(numerator) > SQUARE_GRID_LATTICE_LIMITS.maxExactIntegerDigits ||
    !INTEGER_PATTERN.test(numerator)
  ) {
    addIssue(
      issues,
      `${path}.numerator`,
      'invalid-integer',
      `must be a canonical integer string of at most ${String(SQUARE_GRID_LATTICE_LIMITS.maxExactIntegerDigits)} digits`,
    );
    valid = false;
  }
  if (
    typeof denominator !== 'string' ||
    digitCount(denominator) > SQUARE_GRID_LATTICE_LIMITS.maxExactIntegerDigits ||
    !POSITIVE_INTEGER_PATTERN.test(denominator)
  ) {
    addIssue(
      issues,
      `${path}.denominator`,
      'invalid-integer',
      `must be a canonical positive integer string of at most ${String(SQUARE_GRID_LATTICE_LIMITS.maxExactIntegerDigits)} digits`,
    );
    valid = false;
  }
  if (!valid || typeof numerator !== 'string' || typeof denominator !== 'string') return undefined;

  const value = exactRational(BigInt(numerator), BigInt(denominator));
  if (value.numerator.toString() !== numerator || value.denominator.toString() !== denominator) {
    addIssue(
      issues,
      path,
      'not-normalized',
      'fraction must be reduced, use a positive denominator, and encode zero as 0/1',
    );
    return undefined;
  }
  return value;
}

function parsePositiveRational(
  supplied: unknown,
  path: string,
  issues: SquareGridLatticeInputIssue[],
): ExactRational | undefined {
  const value = parseRational(supplied, path, issues);
  if (value !== undefined && value.numerator <= 0n) {
    addIssue(issues, path, 'invalid-bound', 'must be greater than zero');
    return undefined;
  }
  return value;
}

function parseNonnegativeRational(
  supplied: unknown,
  path: string,
  issues: SquareGridLatticeInputIssue[],
): ExactRational | undefined {
  const value = parseRational(supplied, path, issues);
  if (value !== undefined && value.numerator < 0n) {
    addIssue(issues, path, 'invalid-bound', 'must be greater than or equal to zero');
    return undefined;
  }
  return value;
}

function canonicalCandidateId(
  columns: number,
  rows: number,
  fitAxis: SquareGridLatticeFitAxis,
  cellSize: ExactRational,
): string {
  const fitKey = fitAxis === 'both' ? 'xy' : fitAxis;
  return `square-grid:${String(columns)}x${String(rows)}:${fitKey}:${exactRationalKey(cellSize)}`;
}

type OutputSize = Readonly<{
  vertices: number;
  horizontal: number;
  vertical: number;
  positive45Diagonal: number;
  negative45Diagonal: number;
  directionPrimitives: number;
  outputRecords: number;
}>;

function outputSize(columns: number, rows: number): OutputSize {
  const vertices = (columns + 1) * (rows + 1);
  const horizontal = columns * (rows + 1);
  const vertical = (columns + 1) * rows;
  const positive45Diagonal = columns * rows;
  const negative45Diagonal = columns * rows;
  const directionPrimitives = horizontal + vertical + positive45Diagonal + negative45Diagonal;
  return {
    vertices,
    horizontal,
    vertical,
    positive45Diagonal,
    negative45Diagonal,
    directionPrimitives,
    outputRecords: vertices + directionPrimitives,
  };
}

function validateOutputSize(
  columns: number,
  rows: number,
  issues: SquareGridLatticeInputIssue[],
): void {
  const size = outputSize(columns, rows);
  if (
    size.vertices > SQUARE_GRID_LATTICE_LIMITS.maxVertices ||
    size.directionPrimitives > SQUARE_GRID_LATTICE_LIMITS.maxDirectionPrimitives ||
    size.outputRecords > SQUARE_GRID_LATTICE_LIMITS.maxOutputRecords
  ) {
    addIssue(
      issues,
      '$.squareGridCandidate',
      'output-limit-exceeded',
      'the combined vertex and direction-primitive output exceeds defensive implementation ceilings',
    );
  }
}

function parseCandidate(
  supplied: unknown,
  issues: SquareGridLatticeInputIssue[],
): SquareGridLatticeCandidateInputV1 | undefined {
  const path = '$.squareGridCandidate';
  if (!isRecord(supplied)) {
    addIssue(issues, path, 'invalid-object', 'squareGridCandidate must be an object');
    return undefined;
  }
  closedKeys(supplied, CANDIDATE_KEYS, path, issues);

  const candidateId = supplied.candidateId;
  const candidateIdOk =
    typeof candidateId === 'string' &&
    candidateId.length > 0 &&
    candidateId.length <= SQUARE_GRID_LATTICE_LIMITS.maxCandidateIdLength;
  if (!candidateIdOk) {
    addIssue(
      issues,
      `${path}.candidateId`,
      'invalid-id',
      `must contain 1..${String(SQUARE_GRID_LATTICE_LIMITS.maxCandidateIdLength)} characters`,
    );
  }

  const columnsOk = boundedPositiveInteger(
    supplied.columns,
    SQUARE_GRID_LATTICE_LIMITS.maxColumns,
    `${path}.columns`,
    issues,
  );
  const rowsOk = boundedPositiveInteger(
    supplied.rows,
    SQUARE_GRID_LATTICE_LIMITS.maxRows,
    `${path}.rows`,
    issues,
  );
  if (
    columnsOk &&
    rowsOk &&
    typeof supplied.columns === 'number' &&
    typeof supplied.rows === 'number'
  ) {
    validateOutputSize(supplied.columns, supplied.rows, issues);
  }

  const fitAxis = supplied.fitAxis;
  const fitAxisOk = fitAxis === 'x' || fitAxis === 'y' || fitAxis === 'both';
  if (!fitAxisOk) {
    addIssue(issues, `${path}.fitAxis`, 'invalid-enum', 'must equal x, y, or both');
  }
  const cellSize = parsePositiveRational(supplied.cellSize, `${path}.cellSize`, issues);

  let paperWidth: ExactRational | undefined;
  let paperHeight: ExactRational | undefined;
  if (!isRecord(supplied.paper)) {
    addIssue(issues, `${path}.paper`, 'invalid-object', 'paper must be an object');
  } else {
    closedKeys(supplied.paper, PAPER_KEYS, `${path}.paper`, issues);
    paperWidth = parsePositiveRational(supplied.paper.width, `${path}.paper.width`, issues);
    paperHeight = parsePositiveRational(supplied.paper.height, `${path}.paper.height`, issues);
  }

  let residualX: ExactRational | undefined;
  let residualY: ExactRational | undefined;
  if (!isRecord(supplied.residualStrips)) {
    addIssue(
      issues,
      `${path}.residualStrips`,
      'invalid-object',
      'residualStrips must be an object',
    );
  } else {
    closedKeys(supplied.residualStrips, RESIDUAL_KEYS, `${path}.residualStrips`, issues);
    residualX = parseNonnegativeRational(
      supplied.residualStrips.xAxis,
      `${path}.residualStrips.xAxis`,
      issues,
    );
    residualY = parseNonnegativeRational(
      supplied.residualStrips.yAxis,
      `${path}.residualStrips.yAxis`,
      issues,
    );
  }

  if (
    !candidateIdOk ||
    typeof candidateId !== 'string' ||
    !columnsOk ||
    !rowsOk ||
    typeof supplied.columns !== 'number' ||
    typeof supplied.rows !== 'number' ||
    !fitAxisOk ||
    cellSize === undefined ||
    paperWidth === undefined ||
    paperHeight === undefined ||
    residualX === undefined ||
    residualY === undefined
  ) {
    return undefined;
  }

  const expectedId = canonicalCandidateId(supplied.columns, supplied.rows, fitAxis, cellSize);
  if (candidateId !== expectedId) {
    addIssue(
      issues,
      `${path}.candidateId`,
      'candidate-identity-mismatch',
      'candidateId must match columns, rows, fitAxis, and exact cellSize',
    );
  }

  const gridWidth = multiplyExactRational(cellSize, exactRational(BigInt(supplied.columns)));
  const gridHeight = multiplyExactRational(cellSize, exactRational(BigInt(supplied.rows)));
  if (!equalExactRational(addExactRational(gridWidth, residualX), paperWidth)) {
    addIssue(
      issues,
      `${path}.residualStrips.xAxis`,
      'grid-invariant-mismatch',
      'columns * cellSize + xAxis residual must equal paper width exactly',
    );
  }
  if (!equalExactRational(addExactRational(gridHeight, residualY), paperHeight)) {
    addIssue(
      issues,
      `${path}.residualStrips.yAxis`,
      'grid-invariant-mismatch',
      'rows * cellSize + yAxis residual must equal paper height exactly',
    );
  }

  const xFits = residualX.numerator === 0n;
  const yFits = residualY.numerator === 0n;
  if (!xFits && !yFits) {
    addIssue(
      issues,
      `${path}.residualStrips`,
      'grid-invariant-mismatch',
      'at least one residual strip must be exactly zero',
    );
  } else {
    const expectedFitAxis: SquareGridLatticeFitAxis = xFits && yFits ? 'both' : xFits ? 'x' : 'y';
    if (fitAxis !== expectedFitAxis) {
      addIssue(
        issues,
        `${path}.fitAxis`,
        'grid-invariant-mismatch',
        'fitAxis must identify exactly the zero residual axis or both zero residual axes',
      );
    }
  }

  return {
    candidateId,
    columns: supplied.columns,
    rows: supplied.rows,
    fitAxis,
    cellSize: exactRationalToJsonV1(cellSize),
    paper: {
      width: exactRationalToJsonV1(paperWidth),
      height: exactRationalToJsonV1(paperHeight),
    },
    residualStrips: {
      xAxis: exactRationalToJsonV1(residualX),
      yAxis: exactRationalToJsonV1(residualY),
    },
  };
}

/**
 * Parses one exact square-grid candidate and independently rechecks its
 * canonical identity, paper fit, residual strips, and bounded output size.
 */
export function parseSquareGridLatticeInputV1(
  supplied: unknown,
): SquareGridLatticeInputParseResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: 0,
    maxContainerCount: 16,
    maxDepth: 4,
    maxObjectPropertyCount: 8,
    maxPropertyNameCodeUnits: 64,
    maxStringCodeUnits: SQUARE_GRID_LATTICE_LIMITS.maxCandidateIdLength,
    maxTotalStringCodeUnits: 32_768,
    maxTotalPropertyCount: 64,
  });
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot',
          message: 'input must be one acyclic plain JSON-data snapshot without accessors',
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

  const issues: SquareGridLatticeInputIssue[] = [];
  closedKeys(raw, ROOT_KEYS, '$', issues);
  if (raw.schemaVersion !== 1) {
    addIssue(issues, '$.schemaVersion', 'invalid-literal', 'must equal 1');
  }
  if (raw.recordType !== SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE) {
    addIssue(
      issues,
      '$.recordType',
      'invalid-literal',
      `must equal ${SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE}`,
    );
  }
  if (raw.contractStatus !== 'candidate') {
    addIssue(issues, '$.contractStatus', 'claim-boundary', 'must equal candidate');
  }
  if (raw.scientificClaim !== false) {
    addIssue(issues, '$.scientificClaim', 'claim-boundary', 'must equal false');
  }
  const squareGridCandidate = parseCandidate(raw.squareGridCandidate, issues);
  if (issues.length > 0 || squareGridCandidate === undefined) {
    return { ok: false, error: deepFreezeOwned(issues) };
  }
  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      squareGridCandidate,
    }),
  };
}

function rationalFromJson(value: ExactRationalJsonV1): ExactRational {
  return exactRational(BigInt(value.numerator), BigInt(value.denominator));
}

function vertexId(x: number, y: number): string {
  return `grid-vertex:${String(x)}:${String(y)}`;
}

function primitiveId(code: 'h' | 'v' | 'dp' | 'dn', x: number, y: number): string {
  return `grid-direction:${code}:${String(x)}:${String(y)}`;
}

/**
 * Expands only the finite square-grid substrate for one unselected candidate.
 * The returned direction primitives are neither creases nor assigned roles;
 * no branch placement, packing, routing, foldability, or feasibility follows.
 */
export function buildSquareGridLatticeV1(supplied: unknown): SquareGridLatticeBuildResult {
  const parsed = parseSquareGridLatticeInputV1(supplied);
  if (!parsed.ok) return parsed;
  const candidate = parsed.value.squareGridCandidate;
  const cellSize = rationalFromJson(candidate.cellSize);
  const zero = exactRational(0n);
  const zeroJson = exactRationalToJsonV1(zero);
  const xCoordinates = Array.from({ length: candidate.columns + 1 }, (_, x) =>
    exactRationalToJsonV1(multiplyExactRational(cellSize, exactRational(BigInt(x)))),
  );
  const yCoordinates = Array.from({ length: candidate.rows + 1 }, (_, y) =>
    exactRationalToJsonV1(multiplyExactRational(cellSize, exactRational(BigInt(y)))),
  );

  const vertices: SquareGridLatticeVertexV1[] = [];
  for (let y = 0; y <= candidate.rows; y += 1) {
    for (let x = 0; x <= candidate.columns; x += 1) {
      const positionX = xCoordinates[x];
      const positionY = yCoordinates[y];
      if (positionX === undefined || positionY === undefined) {
        throw new RangeError('validated coordinate index must exist');
      }
      vertices.push({
        vertexId: vertexId(x, y),
        gridIndex: { x, y },
        position: { x: positionX, y: positionY },
      });
    }
  }

  const directionPrimitives: SquareGridDirectionPrimitiveV1[] = [];
  for (let y = 0; y <= candidate.rows; y += 1) {
    for (let x = 0; x < candidate.columns; x += 1) {
      directionPrimitives.push({
        primitiveId: primitiveId('h', x, y),
        directionFamily: 'horizontal',
        gridStep: { dx: 1, dy: 0 },
        fromVertexId: vertexId(x, y),
        toVertexId: vertexId(x + 1, y),
      });
    }
  }
  for (let y = 0; y < candidate.rows; y += 1) {
    for (let x = 0; x <= candidate.columns; x += 1) {
      directionPrimitives.push({
        primitiveId: primitiveId('v', x, y),
        directionFamily: 'vertical',
        gridStep: { dx: 0, dy: 1 },
        fromVertexId: vertexId(x, y),
        toVertexId: vertexId(x, y + 1),
      });
    }
  }
  for (let y = 0; y < candidate.rows; y += 1) {
    for (let x = 0; x < candidate.columns; x += 1) {
      directionPrimitives.push({
        primitiveId: primitiveId('dp', x, y),
        directionFamily: 'positive-45-diagonal',
        gridStep: { dx: 1, dy: 1 },
        fromVertexId: vertexId(x, y),
        toVertexId: vertexId(x + 1, y + 1),
      });
    }
  }
  for (let y = 0; y < candidate.rows; y += 1) {
    for (let x = 0; x < candidate.columns; x += 1) {
      directionPrimitives.push({
        primitiveId: primitiveId('dn', x, y),
        directionFamily: 'negative-45-diagonal',
        gridStep: { dx: 1, dy: -1 },
        fromVertexId: vertexId(x, y + 1),
        toVertexId: vertexId(x + 1, y),
      });
    }
  }

  const size = outputSize(candidate.columns, candidate.rows);
  if (
    vertices.length !== size.vertices ||
    directionPrimitives.length !== size.directionPrimitives
  ) {
    throw new RangeError('lattice enumeration count must match its preflight bound calculation');
  }
  const gridWidth = multiplyExactRational(cellSize, exactRational(BigInt(candidate.columns)));
  const gridHeight = multiplyExactRational(cellSize, exactRational(BigInt(candidate.rows)));

  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: SQUARE_GRID_LATTICE_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'square-grid-lattice-substrate-only',
      isSupportProfile: false,
      cellGeometry: 'square',
      candidateSelectionIncluded: false,
      creaseIncluded: false,
      roleIncluded: false,
      branchPlacementIncluded: false,
      branchPackingIncluded: false,
      axialOrAxialPlusNSelectionIncluded: false,
      riverJunctionIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      directionPrimitiveSemantics: 'grid-direction-only',
      squareGridCandidate: candidate,
      internalGridRegion: {
        origin: { x: zeroJson, y: zeroJson },
        width: exactRationalToJsonV1(gridWidth),
        height: exactRationalToJsonV1(gridHeight),
      },
      residualStrips: {
        xAxis: {
          boundarySide: 'positive-x',
          size: candidate.residualStrips.xAxis,
        },
        yAxis: {
          boundarySide: 'positive-y',
          size: candidate.residualStrips.yAxis,
        },
      },
      vertexOrder: 'row-major-y-then-x',
      directionPrimitiveOrder:
        'horizontal-then-vertical-then-positive-45-then-negative-45-each-row-major',
      counts: {
        vertices: size.vertices,
        directionPrimitives: size.directionPrimitives,
        byDirectionFamily: {
          horizontal: size.horizontal,
          vertical: size.vertical,
          positive45Diagonal: size.positive45Diagonal,
          negative45Diagonal: size.negative45Diagonal,
        },
      },
      vertices,
      directionPrimitives,
    }),
  };
}
