import { describe, expect, it } from 'vitest';

import {
  SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
  parseSquareGridCandidateInputV1,
  type SquareGridBranchClass,
  type SquareGridCandidateInputV1,
} from '../../m0f/box-pleating/square-grid-candidates.js';
import {
  SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS,
  validateSquareGridSelectedCandidateV1,
} from '../../m0f/box-pleating/square-grid-selected-candidate-validation.js';
import {
  compareExactRational,
  divideExactRational,
  exactRational,
  exactRationalKey,
  finiteBinary64ToExactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../../m0f/model/exact-rational.js';
import { exactRationalToJsonV1 } from '../../m0f/model/exact-rational-json.js';

interface MutableRational {
  numerator: string;
  denominator: string;
}

interface MutableDimension {
  sourceValue: number;
  sourceValueExact: MutableRational;
  steps: string;
  quantizedValue: MutableRational;
  relativeError: MutableRational;
}

interface MutableBranchQuantization {
  branchId: string;
  branchClass: SquareGridBranchClass;
  length: MutableDimension;
  width: MutableDimension;
}

interface MutableCandidate {
  candidateId: string;
  columns: number;
  rows: number;
  fitAxis: 'x' | 'y' | 'both';
  cellSize: MutableRational;
  gridRegion: { width: MutableRational; height: MutableRational };
  residualStrips: { xAxis: MutableRational; yAxis: MutableRational };
  maximumRelativeError: MutableRational;
  branchQuantizations: MutableBranchQuantization[];
}

function rationalJson(value: ExactRational): MutableRational {
  const encoded = exactRationalToJsonV1(value);
  return { numerator: encoded.numerator, denominator: encoded.denominator };
}

function absolute(value: ExactRational): ExactRational {
  return value.numerator < 0n ? exactRational(-value.numerator, value.denominator) : value;
}

function nearestIntegerHalfUp(value: ExactRational): bigint {
  const lower = value.numerator / value.denominator;
  const remainder = value.numerator % value.denominator;
  return remainder * 2n >= value.denominator ? lower + 1n : lower;
}

function quantizedDimension(sourceValue: number, cellSize: ExactRational): MutableDimension {
  const source = finiteBinary64ToExactRational(sourceValue);
  const steps = nearestIntegerHalfUp(divideExactRational(source, cellSize));
  const quantized = multiplyExactRational(cellSize, exactRational(steps));
  const difference = absolute(subtractExactRational(quantized, source));
  const relativeError =
    source.numerator === 0n
      ? exactRational(0n)
      : exactRational(
          difference.numerator * source.denominator,
          difference.denominator * source.numerator,
        );
  return {
    sourceValue,
    sourceValueExact: rationalJson(source),
    steps: steps.toString(),
    quantizedValue: rationalJson(quantized),
    relativeError: rationalJson(relativeError),
  };
}

function defaultSource(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: { width: 1.5, height: 1 },
    maxColumns: 12,
    maxRows: 12,
    relativeErrorLimit: 0.01,
    branches: [
      { id: 'terminal-z', branchClass: 'terminal', length: 0.5, width: 0 },
      { id: 'internal-a', branchClass: 'internal', length: 0.75, width: 0.25 },
    ],
  };
}

function parsedSource(raw: unknown): SquareGridCandidateInputV1 {
  const parsed = parseSquareGridCandidateInputV1(raw);
  if (!parsed.ok) throw new Error(`invalid test source: ${JSON.stringify(parsed.error)}`);
  return parsed.value;
}

function makeCandidate(
  rawSource: unknown,
  columns: number,
  rows: number,
  fitAxis: MutableCandidate['fitAxis'],
  cellSize: ExactRational,
): MutableCandidate {
  const source = parsedSource(rawSource);
  const paperWidth = finiteBinary64ToExactRational(source.paper.width);
  const paperHeight = finiteBinary64ToExactRational(source.paper.height);
  const gridWidth = multiplyExactRational(cellSize, exactRational(BigInt(columns)));
  const gridHeight = multiplyExactRational(cellSize, exactRational(BigInt(rows)));
  const residualX = subtractExactRational(paperWidth, gridWidth);
  const residualY = subtractExactRational(paperHeight, gridHeight);
  const branches = source.branches.map((branch) => ({
    branchId: branch.id,
    branchClass: branch.branchClass,
    length: quantizedDimension(branch.length, cellSize),
    width: quantizedDimension(branch.width, cellSize),
  }));
  let maximumError = exactRational(0n);
  for (const branch of branches) {
    for (const dimension of [branch.length, branch.width]) {
      const parsed = exactRational(
        BigInt(dimension.relativeError.numerator),
        BigInt(dimension.relativeError.denominator),
      );
      if (compareExactRational(parsed, maximumError) > 0) maximumError = parsed;
    }
  }
  const fitKey = fitAxis === 'both' ? 'xy' : fitAxis;
  return {
    candidateId: `square-grid:${String(columns)}x${String(rows)}:${fitKey}:${exactRationalKey(cellSize)}`,
    columns,
    rows,
    fitAxis,
    cellSize: rationalJson(cellSize),
    gridRegion: { width: rationalJson(gridWidth), height: rationalJson(gridHeight) },
    residualStrips: { xAxis: rationalJson(residualX), yAxis: rationalJson(residualY) },
    maximumRelativeError: rationalJson(maximumError),
    branchQuantizations: branches,
  };
}

function defaultCandidate(): MutableCandidate {
  return makeCandidate(defaultSource(), 12, 8, 'both', exactRational(1n, 8n));
}

function firstQuantization(candidate: MutableCandidate): MutableBranchQuantization {
  const branch = candidate.branchQuantizations[0];
  if (branch === undefined) throw new Error('test candidate must contain a branch quantization');
  return branch;
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((entry) => allFrozen(entry, seen));
}

function expectFailure(source: unknown, candidate: unknown, code?: string, path?: string): void {
  const result = validateSquareGridSelectedCandidateV1(source, candidate);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('selected candidate should fail validation');
  if (code !== undefined) {
    expect(
      result.violations.some(
        (violation) =>
          violation.code === code && (path === undefined || violation.path.startsWith(path)),
      ),
    ).toBe(true);
  }
  expect(allFrozen(result)).toBe(true);
}

describe('selected square-grid candidate independent validation', () => {
  it('returns one owned, canonical, deeply frozen candidate without enumeration claims', () => {
    const source = defaultSource();
    const raw = defaultCandidate();
    const result = validateSquareGridSelectedCandidateV1(source, raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('default selected candidate must validate');

    expect(result.value.branchQuantizations.map((branch) => branch.branchId)).toEqual([
      'internal-a',
      'terminal-z',
    ]);
    expect(result.value).not.toHaveProperty('enumerationComplete');
    expect(result.value).not.toHaveProperty('placementIncluded');
    expect(result.value).not.toHaveProperty('feasibilityDecisionIncluded');
    expect(allFrozen(result)).toBe(true);

    raw.columns = 1;
    firstQuantization(raw).length.steps = '999';
    expect(result.value.columns).toBe(12);
    expect(result.value.branchQuantizations[0]?.length.steps).toBe('6');
  });

  it('normalizes the source branch order before binding the selected candidate', () => {
    const source = defaultSource();
    const branches = source.branches as unknown[];
    branches.reverse();
    const candidate = makeCandidate(source, 12, 8, 'both', exactRational(1n, 8n));
    const result = validateSquareGridSelectedCandidateV1(source, candidate);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('permuted valid source should validate');
    expect(result.value.branchQuantizations.map((branch) => branch.branchId)).toEqual([
      'internal-a',
      'terminal-z',
    ]);
  });

  it('rejects empty, malformed, and wrong sources before accepting any candidate', () => {
    const empty = defaultSource();
    empty.branches = [];
    expectFailure(empty, defaultCandidate(), 'invalid-source-input', '$.sourceInput.branches');
    expectFailure({ schemaVersion: 1 }, defaultCandidate(), 'invalid-source-input');

    const wrong = defaultSource();
    const wrongBranches = wrong.branches as { id: string }[];
    const wrongFirst = wrongBranches[0];
    if (wrongFirst === undefined) throw new Error('wrong-source fixture must contain a branch');
    wrongFirst.id = 'internal-a';
    expectFailure(wrong, defaultCandidate(), 'invalid-source-input');
  });

  it('bounds violations emitted by a maximally hostile but snapshot-bounded source', () => {
    const hostile = defaultSource();
    hostile.maxColumns = 1;
    hostile.maxRows = 1;
    hostile.branches = Array.from(
      { length: SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxArrayLength },
      () => ({ id: '?', branchClass: 'rogue', length: 0, width: -1 }),
    );
    const result = validateSquareGridSelectedCandidateV1(hostile, defaultCandidate());
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('hostile source must fail validation');
    expect(result.violations).toHaveLength(
      SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxViolations,
    );
    expect(allFrozen(result)).toBe(true);
  });

  it('rejects a valid but stale candidate from a different branch source', () => {
    const staleSource = defaultSource();
    const staleBranches = staleSource.branches as { id: string; length: number }[];
    const staleInternal = staleBranches.find((branch) => branch.id === 'internal-a');
    if (staleInternal === undefined) throw new Error('stale fixture must contain internal-a');
    staleInternal.length = 0.625;
    const stale = makeCandidate(staleSource, 12, 8, 'both', exactRational(1n, 8n));
    expect(validateSquareGridSelectedCandidateV1(staleSource, stale).ok).toBe(true);
    expectFailure(defaultSource(), stale, 'source-mismatch');
  });

  it('rejects reordered, duplicated, missing, extra, and rogue branch records', () => {
    const reordered = defaultCandidate();
    reordered.branchQuantizations.reverse();
    expectFailure(defaultSource(), reordered, 'source-mismatch');

    const duplicated = defaultCandidate();
    duplicated.branchQuantizations[1] = structuredClone(firstQuantization(duplicated));
    expectFailure(defaultSource(), duplicated, 'source-mismatch');

    const missing = defaultCandidate();
    missing.branchQuantizations.pop();
    expectFailure(defaultSource(), missing, 'cardinality-mismatch');

    const extra = defaultCandidate();
    extra.branchQuantizations.push(structuredClone(firstQuantization(extra)));
    expectFailure(defaultSource(), extra, 'cardinality-mismatch');

    const rogue = defaultCandidate();
    firstQuantization(rogue).branchId = 'rogue-branch';
    expectFailure(defaultSource(), rogue, 'source-mismatch');
  });

  it('binds every branch class, source value, exact value, step, quantized value, and error', () => {
    const mutations: ((candidate: MutableCandidate) => void)[] = [
      (candidate) => {
        firstQuantization(candidate).branchClass = 'terminal';
      },
      (candidate) => {
        firstQuantization(candidate).length.sourceValue = 0.625;
      },
      (candidate) => {
        firstQuantization(candidate).length.sourceValueExact = {
          numerator: '5',
          denominator: '8',
        };
      },
      (candidate) => {
        firstQuantization(candidate).length.steps = '5';
      },
      (candidate) => {
        firstQuantization(candidate).length.quantizedValue = {
          numerator: '5',
          denominator: '8',
        };
      },
      (candidate) => {
        firstQuantization(candidate).length.relativeError = {
          numerator: '1',
          denominator: '10',
        };
      },
    ];
    for (const mutate of mutations) {
      const candidate = defaultCandidate();
      mutate(candidate);
      expectFailure(defaultSource(), candidate);
    }
  });

  it('rejects noncanonical rationals, residual/fit/identity tampering, and wrong maximum error', () => {
    const noncanonical = defaultCandidate();
    noncanonical.cellSize = { numerator: '2', denominator: '16' };
    expectFailure(defaultSource(), noncanonical, 'invalid-rational', '$.candidate.cellSize');

    const residual = defaultCandidate();
    residual.residualStrips.xAxis = { numerator: '1', denominator: '8' };
    expectFailure(defaultSource(), residual, 'arithmetic-mismatch');

    const fit = defaultCandidate();
    fit.fitAxis = 'x';
    expectFailure(defaultSource(), fit, 'source-mismatch', '$.candidate.fitAxis');

    const identity = defaultCandidate();
    identity.candidateId = 'square-grid:stale';
    expectFailure(defaultSource(), identity, 'candidate-id-mismatch');

    const maximum = defaultCandidate();
    maximum.maximumRelativeError = { numerator: '1', denominator: '100' };
    expectFailure(defaultSource(), maximum, 'arithmetic-mismatch');
  });

  it('enforces the exact source relative-error limit without enumerating alternatives', () => {
    const permissive = {
      schemaVersion: 1,
      recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      paper: { width: 1, height: 1 },
      maxColumns: 8,
      maxRows: 8,
      relativeErrorLimit: 1,
      branches: [{ id: 'branch-a', branchClass: 'terminal', length: 0.3, width: 0 }],
    };
    const candidate = makeCandidate(permissive, 8, 8, 'both', exactRational(1n, 8n));
    expect(validateSquareGridSelectedCandidateV1(permissive, candidate).ok).toBe(true);

    const restrictive = structuredClone(permissive);
    restrictive.relativeErrorLimit = 0.1;
    expectFailure(restrictive, candidate, 'invalid-bound');
  });

  it('checks anchored maximum fitting counts on rectangular residual candidates', () => {
    const source = defaultSource();
    source.maxColumns = 11;
    const candidate = makeCandidate(source, 11, 8, 'y', exactRational(1n, 8n));
    expect(validateSquareGridSelectedCandidateV1(source, candidate).ok).toBe(true);

    const wrongColumns = structuredClone(candidate);
    wrongColumns.columns = 10;
    wrongColumns.gridRegion.width = { numerator: '5', denominator: '4' };
    wrongColumns.residualStrips.xAxis = { numerator: '1', denominator: '4' };
    wrongColumns.candidateId = 'square-grid:10x8:y:1/8';
    expectFailure(source, wrongColumns, 'arithmetic-mismatch', '$.candidate.columns');
  });

  it('rejects accessors, sparse arrays, cycles, oversized arrays, and huge integers safely', () => {
    let getterCalls = 0;
    const accessor = defaultCandidate();
    Object.defineProperty(accessor, 'cellSize', {
      enumerable: true,
      get(): MutableRational {
        getterCalls += 1;
        return { numerator: '1', denominator: '8' };
      },
    });
    expectFailure(defaultSource(), accessor, 'invalid-snapshot');
    expect(getterCalls).toBe(0);

    const sparse = defaultCandidate();
    sparse.branchQuantizations = new Array<MutableBranchQuantization>(2);
    expectFailure(defaultSource(), sparse, 'invalid-snapshot');

    const cyclic = defaultCandidate() as MutableCandidate & { self?: unknown };
    cyclic.self = cyclic;
    expectFailure(defaultSource(), cyclic, 'invalid-snapshot');

    const oversized = defaultCandidate();
    oversized.branchQuantizations = Array.from(
      { length: SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.maxArrayLength + 1 },
      () => structuredClone(firstQuantization(defaultCandidate())),
    );
    expectFailure(defaultSource(), oversized, 'invalid-snapshot');

    const huge = defaultCandidate();
    huge.cellSize.numerator = '9'.repeat(
      SQUARE_GRID_SELECTED_CANDIDATE_VALIDATION_LIMITS.exactIntegerDigits + 1,
    );
    expectFailure(defaultSource(), huge, 'invalid-integer', '$.candidate.cellSize.numerator');
  });

  it('accepts the full 256-branch defensive boundary with one selected candidate', () => {
    const branchCount = 256;
    const source = {
      schemaVersion: 1,
      recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      paper: { width: 1, height: 1 },
      maxColumns: 128,
      maxRows: 128,
      relativeErrorLimit: 0,
      branches: Array.from({ length: branchCount }, (_, index) => ({
        id: `branch-${String(index).padStart(3, '0')}`,
        branchClass: index % 2 === 0 ? ('terminal' as const) : ('internal' as const),
        length: 1,
        width: 0,
      })),
    };
    const candidate = makeCandidate(source, 128, 128, 'both', exactRational(1n, 128n));
    const result = validateSquareGridSelectedCandidateV1(source, candidate);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('256-branch selected candidate must validate');
    expect(result.value.branchQuantizations).toHaveLength(branchCount);
    expect(result.value.branchQuantizations.at(-1)?.branchId).toBe('branch-255');
    expect(allFrozen(result)).toBe(true);
  });

  it('rejects undeclared claim escalation fields at the closed candidate boundary', () => {
    const claimed = defaultCandidate() as MutableCandidate & {
      placementIncluded?: boolean;
      feasibilityDecisionIncluded?: boolean;
    };
    claimed.placementIncluded = true;
    claimed.feasibilityDecisionIncluded = true;
    expectFailure(defaultSource(), claimed, 'unknown-field');
  });
});
