import { describe, expect, it } from 'vitest';

import {
  enumerateSquareGridCandidatesV1,
  parseSquareGridCandidateInputV1,
  SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS,
  SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
} from '../../m0f/box-pleating/square-grid-candidates.js';
import type { ExactRationalJsonV1 } from '../../m0f/model/exact-rational-json.js';

interface MutableBranch {
  id: string;
  branchClass: 'terminal' | 'internal';
  length: number;
  width: number;
}

function input(
  overrides: Partial<{
    paper: { width: number; height: number };
    maxColumns: number;
    maxRows: number;
    relativeErrorLimit: number;
    branches: MutableBranch[];
  }> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: { width: 1, height: 1 },
    maxColumns: 8,
    maxRows: 8,
    relativeErrorLimit: 0.01,
    branches: [{ id: 'branch-a', branchClass: 'terminal', length: 1, width: 0 }],
    ...overrides,
  };
}

function expectIssue(raw: unknown, code: string): void {
  const parsed = parseSquareGridCandidateInputV1(raw);
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error(`expected square-grid input issue ${code}`);
  expect(parsed.error.some((issue) => issue.code === code)).toBe(true);
}

type Fraction = Readonly<{ numerator: bigint; denominator: bigint }>;

function fraction(value: ExactRationalJsonV1): Fraction {
  return { numerator: BigInt(value.numerator), denominator: BigInt(value.denominator) };
}

function compare(left: Fraction, right: Fraction): number {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function add(left: Fraction, right: Fraction): Fraction {
  return {
    numerator: left.numerator * right.denominator + right.numerator * left.denominator,
    denominator: left.denominator * right.denominator,
  };
}

function multiplyInteger(value: Fraction, multiplier: number): Fraction {
  return { numerator: value.numerator * BigInt(multiplier), denominator: value.denominator };
}

function nextDown(value: number): number {
  if (!Number.isFinite(value)) throw new TypeError('nextDown requires a finite number');
  if (value === -Infinity) return value;
  if (value === 0) return -Number.MIN_VALUE;
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  view.setBigUint64(0, value > 0 ? bits - 1n : bits + 1n, false);
  return view.getFloat64(0, false);
}

function keysDeep(value: unknown, destination: string[] = []): string[] {
  if (typeof value !== 'object' || value === null) return destination;
  if (Array.isArray(value)) {
    for (const entry of value) keysDeep(entry, destination);
    return destination;
  }
  for (const [key, child] of Object.entries(value)) {
    destination.push(key);
    keysDeep(child, destination);
  }
  return destination;
}

describe('M0F square-grid quantization candidate input', () => {
  it('parses a closed no-claim input, canonicalizes branch order, and owns the result', () => {
    const raw = input({
      branches: [
        { id: 'branch-z', branchClass: 'internal', length: 0.5, width: 0.25 },
        { id: 'branch-a', branchClass: 'terminal', length: 1, width: -0 },
      ],
    });
    const parsed = parseSquareGridCandidateInputV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('candidate input must parse');
    expect(parsed.value.branches.map((branch) => branch.id)).toEqual(['branch-a', 'branch-z']);
    expect(parsed.value.branches[0]?.width).toBe(0);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.branches)).toBe(true);

    const firstRawBranch = (raw.branches as MutableBranch[])[0];
    if (firstRawBranch === undefined) throw new Error('test branch is missing');
    firstRawBranch.width = 99;
    expect(parsed.value.branches[1]?.width).toBe(0.25);
  });

  it('rejects claim escalation, unknown fields, exotic snapshots, and duplicate IDs', () => {
    expectIssue({ ...input(), contractStatus: 'verified' }, 'claim-boundary');
    expectIssue({ ...input(), scientificClaim: true }, 'claim-boundary');
    expectIssue({ ...input(), result: 'verified' }, 'unknown-field');
    expectIssue(new Map(Object.entries(input())), 'invalid-snapshot');
    expectIssue(
      input({
        branches: [
          { id: 'same', branchClass: 'terminal', length: 1, width: 0 },
          { id: 'same', branchClass: 'internal', length: 1, width: 0 },
        ],
      }),
      'duplicate-id',
    );
  });

  it('rejects invalid dimensions, non-finite values, empty branches, and unsafe bounds', () => {
    expectIssue(input({ paper: { width: 0, height: 1 } }), 'invalid-bound');
    expectIssue(input({ paper: { width: 1, height: Number.POSITIVE_INFINITY } }), 'invalid-number');
    expectIssue(
      input({ branches: [{ id: 'bad', branchClass: 'terminal', length: 0, width: 0 }] }),
      'invalid-bound',
    );
    expectIssue(
      input({ branches: [{ id: 'bad', branchClass: 'internal', length: 1, width: -0.1 }] }),
      'invalid-bound',
    );
    expectIssue(input({ relativeErrorLimit: -Number.MIN_VALUE }), 'invalid-bound');
    expectIssue(input({ branches: [] }), 'invalid-bound');
    expectIssue(
      input({ maxColumns: SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxColumns + 1 }),
      'invalid-bound',
    );
    expectIssue(input({ maxRows: 1.5 }), 'invalid-bound');
  });

  it('bounds the multiplicative candidate-by-branch work surface', () => {
    const branch = (index: number): MutableBranch => ({
      id: `branch-${String(index)}`,
      branchClass: index % 2 === 0 ? 'terminal' : 'internal',
      length: 1,
      width: 0,
    });
    const atLimit = input({
      maxColumns: 512,
      maxRows: 512,
      branches: Array.from({ length: 64 }, (_, index) => branch(index)),
    });
    expect(parseSquareGridCandidateInputV1(atLimit).ok).toBe(true);

    expectIssue(
      input({
        maxColumns: 512,
        maxRows: 512,
        branches: Array.from({ length: 65 }, (_, index) => branch(index)),
      }),
      'invalid-bound',
    );
  });

  it('fails closed on cyclic, exotic, sparse, accessor-bearing, and proxy inputs', () => {
    const cyclic = input();
    cyclic.self = cyclic;
    expectIssue(cyclic, 'invalid-snapshot');

    const classInstance = Object.assign(
      new (class CandidateInput {
        readonly marker = true;
      })(),
      input(),
    );
    expectIssue(classInstance, 'invalid-snapshot');

    const symbolKey = input();
    Object.defineProperty(symbolKey, Symbol('hidden'), { enumerable: true, value: true });
    expectIssue(symbolKey, 'invalid-snapshot');

    const nonEnumerable = input();
    Object.defineProperty(nonEnumerable, 'hidden', { enumerable: false, value: true });
    expectIssue(nonEnumerable, 'invalid-snapshot');

    const sparse = input();
    const sparseBranches: MutableBranch[] = [];
    sparseBranches.length = 2;
    sparseBranches[1] = {
      id: 'present',
      branchClass: 'terminal',
      length: 1,
      width: 0,
    };
    sparse.branches = sparseBranches;
    expectIssue(sparse, 'invalid-snapshot');

    let proxyGetCalls = 0;
    expectIssue(
      new Proxy(input(), {
        get(target, property, receiver): unknown {
          proxyGetCalls += 1;
          return Reflect.get(target, property, receiver) as unknown;
        },
      }),
      'invalid-snapshot',
    );
    expect(proxyGetCalls).toBe(0);

    const revoked = Proxy.revocable(input(), {});
    revoked.revoke();
    expectIssue(revoked.proxy, 'invalid-snapshot');

    let getterCalls = 0;
    const getter = input();
    Object.defineProperty(getter, 'paper', {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return { width: 1, height: 1 };
      },
    });
    expectIssue(getter, 'invalid-snapshot');
    expect(getterCalls).toBe(0);
  });
});

describe('M0F exact square-grid candidate enumeration', () => {
  it('enumerates every bounded x/y anchor once after canonical deduplication', () => {
    const result = enumerateSquareGridCandidatesV1(
      input({
        paper: { width: 2, height: 1 },
        maxColumns: 4,
        maxRows: 4,
        relativeErrorLimit: 1,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('anchor-completeness input must enumerate');

    expect(
      new Set(
        result.value.candidates.map(({ columns, rows }) => `${String(columns)}x${String(rows)}`),
      ),
    ).toEqual(new Set(['2x1', '3x1', '4x2', '4x3', '4x4']));
    expect(new Set(result.value.candidates.map((candidate) => candidate.candidateId)).size).toBe(
      result.value.candidates.length,
    );
  });

  it('keeps one exact square cell size and explicit nonnegative strips on rectangular paper', () => {
    const result = enumerateSquareGridCandidatesV1(
      input({ paper: { width: 2, height: 1 }, maxColumns: 4, maxRows: 4 }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('rectangular candidate input must enumerate');
    expect(result.value.candidates.map((candidate) => [candidate.columns, candidate.rows])).toEqual(
      [
        [2, 1],
        [4, 2],
        [4, 3],
        [4, 4],
      ],
    );

    const paperWidth = fraction(result.value.paper.width);
    const paperHeight = fraction(result.value.paper.height);
    for (const candidate of result.value.candidates) {
      const cell = fraction(candidate.cellSize);
      const gridWidth = fraction(candidate.gridRegion.width);
      const gridHeight = fraction(candidate.gridRegion.height);
      const residualX = fraction(candidate.residualStrips.xAxis);
      const residualY = fraction(candidate.residualStrips.yAxis);
      expect(compare(gridWidth, multiplyInteger(cell, candidate.columns))).toBe(0);
      expect(compare(gridHeight, multiplyInteger(cell, candidate.rows))).toBe(0);
      expect(compare(add(gridWidth, residualX), paperWidth)).toBe(0);
      expect(compare(add(gridHeight, residualY), paperHeight)).toBe(0);
      expect(residualX.numerator >= 0n).toBe(true);
      expect(residualY.numerator >= 0n).toBe(true);
      expect(residualX.numerator === 0n || residualY.numerator === 0n).toBe(true);
    }

    expect(result.value.candidates[0]?.fitAxis).toBe('both');
    expect(result.value.candidates[2]?.fitAxis).toBe('y');
    expect(result.value.scope).toBe('square-grid-quantization-only');
    expect(result.value.placementIncluded).toBe(false);
    expect(result.value.pleatRoutingIncluded).toBe(false);
  });

  it('quantizes internal widths through the same rule and preserves exact zero widths', () => {
    const result = enumerateSquareGridCandidatesV1(
      input({
        maxColumns: 8,
        maxRows: 8,
        branches: [
          { id: 'terminal', branchClass: 'terminal', length: 0.5, width: 0 },
          { id: 'internal', branchClass: 'internal', length: 0.5, width: 0.25 },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('internal-width input must enumerate');
    const four = result.value.candidates.find(
      (candidate) => candidate.columns === 4 && candidate.rows === 4,
    );
    expect(four).toBeDefined();
    const internal = four?.branchQuantizations.find((branch) => branch.branchId === 'internal');
    const terminal = four?.branchQuantizations.find((branch) => branch.branchId === 'terminal');
    expect(internal).toMatchObject({
      branchClass: 'internal',
      length: { steps: '2' },
      width: { steps: '1', relativeError: { numerator: '0', denominator: '1' } },
    });
    expect(terminal).toMatchObject({
      branchClass: 'terminal',
      width: {
        sourceValue: 0,
        steps: '0',
        quantizedValue: { numerator: '0', denominator: '1' },
        relativeError: { numerator: '0', denominator: '1' },
      },
    });
  });

  it('uses exact binary64 rational comparison on opposite sides of the 1% boundary', () => {
    const nominalBoundary = 100 / 99;
    const justInside = nextDown(nominalBoundary);
    const accepted = enumerateSquareGridCandidatesV1(
      input({
        maxColumns: 1,
        maxRows: 1,
        branches: [{ id: 'edge', branchClass: 'terminal', length: justInside, width: 0 }],
      }),
    );
    const rejected = enumerateSquareGridCandidatesV1(
      input({
        maxColumns: 1,
        maxRows: 1,
        branches: [{ id: 'edge', branchClass: 'terminal', length: nominalBoundary, width: 0 }],
      }),
    );
    expect(accepted.ok).toBe(true);
    expect(rejected.ok).toBe(true);
    if (!accepted.ok || !rejected.ok) throw new Error('boundary inputs must parse');
    expect(accepted.value.candidates).toHaveLength(1);
    expect(rejected.value.candidates).toHaveLength(0);
    expect(accepted.value.candidates[0]?.maximumRelativeError).not.toEqual(
      rejected.value.relativeErrorLimit,
    );
  });

  it('rounds exact half steps upward and includes an equal error boundary', () => {
    const result = enumerateSquareGridCandidatesV1(
      input({
        maxColumns: 1,
        maxRows: 1,
        relativeErrorLimit: 1,
        branches: [{ id: 'half', branchClass: 'internal', length: 0.5, width: 0.5 }],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('half-up input must enumerate');
    expect(result.value.candidates).toHaveLength(1);
    expect(result.value.candidates[0]?.branchQuantizations[0]).toMatchObject({
      length: { steps: '1', relativeError: { numerator: '1', denominator: '1' } },
      width: { steps: '1', relativeError: { numerator: '1', denominator: '1' } },
    });
  });

  it('keeps extreme finite binary64 magnitudes in exact arithmetic without overflow', () => {
    const result = enumerateSquareGridCandidatesV1(
      input({
        paper: { width: Number.MIN_VALUE, height: Number.MAX_VALUE },
        maxColumns: 1,
        maxRows: 1,
        relativeErrorLimit: Number.MAX_VALUE,
        branches: [
          {
            id: 'extreme-internal',
            branchClass: 'internal',
            length: Number.MAX_VALUE,
            width: Number.MIN_VALUE,
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('extreme finite input must enumerate');
    expect(result.value.candidates).toHaveLength(1);
    const candidate = result.value.candidates[0];
    expect(candidate?.residualStrips.xAxis.numerator).toBe('0');
    expect(BigInt(candidate?.residualStrips.yAxis.numerator ?? '-1') >= 0n).toBe(true);
    expect(candidate?.branchQuantizations[0]?.length.relativeError).toEqual({
      numerator: '0',
      denominator: '1',
    });
  });

  it('is invariant to branch order and deterministic across repeated enumeration', () => {
    const branches: MutableBranch[] = [
      { id: 'z-internal', branchClass: 'internal', length: 0.75, width: 0.25 },
      { id: 'a-terminal', branchClass: 'terminal', length: 0.5, width: 0 },
      { id: 'm-terminal', branchClass: 'terminal', length: 1, width: 0.125 },
    ];
    const forward = enumerateSquareGridCandidatesV1(input({ branches }));
    const reverse = enumerateSquareGridCandidatesV1(input({ branches: [...branches].reverse() }));
    const repeated = enumerateSquareGridCandidatesV1(input({ branches }));
    expect(forward).toEqual(reverse);
    expect(forward).toEqual(repeated);
    if (!forward.ok) throw new Error('order-invariance input must enumerate');
    expect(forward.value.sourceBranches.map((branch) => branch.id)).toEqual([
      'a-terminal',
      'm-terminal',
      'z-internal',
    ]);
    for (const candidate of forward.value.candidates) {
      expect(candidate.branchQuantizations.map((branch) => branch.branchId)).toEqual([
        'a-terminal',
        'm-terminal',
        'z-internal',
      ]);
    }
  });

  it('returns a deeply frozen candidate list without result-claim vocabulary', () => {
    const result = enumerateSquareGridCandidatesV1(input());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('candidate input must enumerate');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.sourceBranches)).toBe(true);
    expect(Object.isFrozen(result.value.sourceBranches[0])).toBe(true);
    expect(Object.isFrozen(result.value.candidates)).toBe(true);
    expect(Object.isFrozen(result.value.candidates[0]?.branchQuantizations)).toBe(true);
    const keys = keysDeep(result.value).map((key) => key.toLowerCase());
    expect(keys).not.toContain('selected');
    expect(keys).not.toContain('frozen');
    expect(keys).not.toContain('supported');
  });
});
