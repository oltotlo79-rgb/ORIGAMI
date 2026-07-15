import { describe, expect, it } from 'vitest';

import {
  allocateBranchDimensionsToSquareGridV1,
  BRANCH_GRID_ALLOCATION_INPUT_RECORD_TYPE,
  BRANCH_GRID_ALLOCATION_LIMITS,
  parseBranchGridAllocationInputV1,
} from '../../m0f/box-pleating/branch-grid-allocation.js';
import { enumerateSquareGridCandidatesV1 } from '../../m0f/box-pleating/square-grid-candidates.js';
import type { ExactRationalJsonV1 } from '../../m0f/model/exact-rational-json.js';

function rational(numerator: string, denominator = '1'): ExactRationalJsonV1 {
  return { numerator, denominator };
}

interface MutableAllocationBranch {
  id: string;
  branchClass: 'terminal' | 'internal';
  length: ExactRationalJsonV1;
  width: ExactRationalJsonV1;
}

function input(
  overrides: Partial<{
    squareGridCandidate: {
      candidateId: string;
      columns: number;
      rows: number;
      fitAxis: 'x' | 'y' | 'both';
      cellSize: ExactRationalJsonV1;
    };
    relativeErrorLimit: ExactRationalJsonV1;
    branches: MutableAllocationBranch[];
  }> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: BRANCH_GRID_ALLOCATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    squareGridCandidate: {
      candidateId: 'square-grid:4x4:xy:1/4',
      columns: 4,
      rows: 4,
      fitAxis: 'both',
      cellSize: rational('1', '4'),
    },
    relativeErrorLimit: rational('1', '100'),
    branches: [
      {
        id: 'branch-a',
        branchClass: 'terminal',
        length: rational('1', '2'),
        width: rational('0'),
      },
    ],
    ...overrides,
  };
}

function expectInputIssue(raw: unknown, code: string): void {
  const result = parseBranchGridAllocationInputV1(raw);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected branch-grid input issue ${code}`);
  expect(result.error.some((issue) => issue.code === code)).toBe(true);
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

describe('M0F branch-grid allocation input boundary', () => {
  it('publishes frozen defensive ceilings without SupportProfile semantics', () => {
    expect(BRANCH_GRID_ALLOCATION_LIMITS).toEqual({
      maxColumns: 512,
      maxRows: 512,
      maxBranches: 256,
      maxExactIntegerDigits: 512,
      maxCandidateIdLength: 1088,
      maxDimensionSteps: '1048576',
    });
    expect(Object.isFrozen(BRANCH_GRID_ALLOCATION_LIMITS)).toBe(true);
    expect(BRANCH_GRID_ALLOCATION_LIMITS).not.toHaveProperty('supportProfile');
    expect(BRANCH_GRID_ALLOCATION_LIMITS).not.toHaveProperty('selected');
    expect(BRANCH_GRID_ALLOCATION_LIMITS).not.toHaveProperty('supported');
  });

  it('accepts one closed exact candidate input, owns it, and canonicalizes branch order', () => {
    const raw = input({
      branches: [
        {
          id: 'z-internal',
          branchClass: 'internal',
          length: rational('3', '4'),
          width: rational('1', '4'),
        },
        {
          id: 'a-terminal',
          branchClass: 'terminal',
          length: rational('1', '2'),
          width: rational('0'),
        },
      ],
    });
    const parsed = parseBranchGridAllocationInputV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('closed allocation input must parse');
    expect(parsed.value.branches.map((branch) => branch.id)).toEqual(['a-terminal', 'z-internal']);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.squareGridCandidate.cellSize)).toBe(true);
    expect(Object.isFrozen(parsed.value.branches)).toBe(true);

    const mutable = raw.branches as MutableAllocationBranch[];
    const first = mutable[0];
    if (first === undefined) throw new Error('test branch is missing');
    first.length = rational('999');
    expect(parsed.value.branches[1]?.length).toEqual(rational('3', '4'));
  });

  it('rejects claim escalation and unknown fields at every object boundary', () => {
    expectInputIssue({ ...input(), contractStatus: 'verified' }, 'claim-boundary');
    expectInputIssue({ ...input(), scientificClaim: true }, 'claim-boundary');
    expectInputIssue({ ...input(), placementIncluded: true }, 'unknown-field');

    const unknownGrid = input();
    unknownGrid.squareGridCandidate = {
      ...(unknownGrid.squareGridCandidate as Record<string, unknown>),
      paperWidth: rational('1'),
    };
    expectInputIssue(unknownGrid, 'unknown-field');

    const unknownBranch = input();
    const branch = (unknownBranch.branches as Record<string, unknown>[])[0];
    if (branch === undefined) throw new Error('test branch is missing');
    branch.x = 0;
    expectInputIssue(unknownBranch, 'unknown-field');

    const unknownRational = input();
    const exactBranch = (unknownRational.branches as Record<string, unknown>[])[0];
    if (exactBranch === undefined) throw new Error('test branch is missing');
    exactBranch.length = { numerator: '1', denominator: '2', decimal: 0.5 };
    expectInputIssue(unknownRational, 'unknown-field');
  });

  it('rejects incoherent candidate identity, malformed rationals, and invalid branch dimensions', () => {
    expectInputIssue(
      input({
        squareGridCandidate: {
          candidateId: 'square-grid:4x4:xy:1/5',
          columns: 4,
          rows: 4,
          fitAxis: 'both',
          cellSize: rational('1', '4'),
        },
      }),
      'candidate-identity-mismatch',
    );
    expectInputIssue(
      input({
        branches: [
          { id: 'bad', branchClass: 'terminal', length: rational('2', '4'), width: rational('0') },
        ],
      }),
      'not-normalized',
    );
    expectInputIssue(
      input({
        branches: [
          { id: 'bad', branchClass: 'terminal', length: rational('0'), width: rational('0') },
        ],
      }),
      'invalid-bound',
    );
    expectInputIssue(
      input({
        branches: [
          { id: 'bad', branchClass: 'internal', length: rational('1'), width: rational('-1', '4') },
        ],
      }),
      'invalid-bound',
    );
    expectInputIssue(
      input({
        branches: [
          { id: 'same', branchClass: 'terminal', length: rational('1'), width: rational('0') },
          { id: 'same', branchClass: 'internal', length: rational('1'), width: rational('0') },
        ],
      }),
      'duplicate-id',
    );
  });

  it('enforces defensive collection, grid, and exact-integer bounds', () => {
    const exactDigitLimit = BRANCH_GRID_ALLOCATION_LIMITS.maxExactIntegerDigits;
    const atLimit = parseBranchGridAllocationInputV1(
      input({
        branches: [
          {
            id: 'exact-limit',
            branchClass: 'internal',
            length: rational(`1${'0'.repeat(exactDigitLimit - 1)}`),
            width: rational('1', `1${'0'.repeat(exactDigitLimit - 1)}`),
          },
        ],
      }),
    );
    expect(atLimit.ok).toBe(true);

    expectInputIssue(
      input({
        squareGridCandidate: {
          candidateId: `square-grid:${String(BRANCH_GRID_ALLOCATION_LIMITS.maxColumns + 1)}x1:xy:1`,
          columns: BRANCH_GRID_ALLOCATION_LIMITS.maxColumns + 1,
          rows: 1,
          fitAxis: 'both',
          cellSize: rational('1'),
        },
      }),
      'invalid-bound',
    );
    expectInputIssue(
      input({
        branches: Array.from(
          { length: BRANCH_GRID_ALLOCATION_LIMITS.maxBranches + 1 },
          (_, index) => ({
            id: `branch-${String(index)}`,
            branchClass: 'terminal' as const,
            length: rational('1'),
            width: rational('0'),
          }),
        ),
      }),
      'invalid-bound',
    );
    expectInputIssue(
      input({
        branches: [
          {
            id: 'too-many-digits',
            branchClass: 'terminal',
            length: rational('1'.repeat(exactDigitLimit + 1)),
            width: rational('0'),
          },
        ],
      }),
      'invalid-integer',
    );
  });

  it('fails closed on cyclic, exotic, sparse, accessor-bearing, and proxy inputs', () => {
    const cyclic = input();
    cyclic.self = cyclic;
    expectInputIssue(cyclic, 'invalid-snapshot');
    expectInputIssue(new Map(Object.entries(input())), 'invalid-snapshot');

    const classInstance = Object.assign(
      new (class AllocationInput {
        readonly marker = true;
      })(),
      input(),
    );
    expectInputIssue(classInstance, 'invalid-snapshot');

    const symbolKey = input();
    Object.defineProperty(symbolKey, Symbol('hidden'), { enumerable: true, value: true });
    expectInputIssue(symbolKey, 'invalid-snapshot');

    const nonEnumerable = input();
    Object.defineProperty(nonEnumerable, 'hidden', { enumerable: false, value: true });
    expectInputIssue(nonEnumerable, 'invalid-snapshot');

    const sparse = input();
    sparse.branches = new Array(1);
    expectInputIssue(sparse, 'invalid-snapshot');

    let proxyGetCalls = 0;
    expectInputIssue(
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
    expectInputIssue(revoked.proxy, 'invalid-snapshot');

    let getterCalls = 0;
    const getter = input();
    Object.defineProperty(getter, 'branches', {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return input().branches;
      },
    });
    expectInputIssue(getter, 'invalid-snapshot');
    expect(getterCalls).toBe(0);
  });
});

describe('M0F exact branch-dimension grid allocation', () => {
  it('consumes an enumerated square-grid candidate without adding placement semantics', () => {
    const enumeration = enumerateSquareGridCandidatesV1({
      schemaVersion: 1,
      recordType: 'm0f-square-grid-candidate-input',
      contractStatus: 'candidate',
      scientificClaim: false,
      paper: { width: 1, height: 1 },
      maxColumns: 4,
      maxRows: 4,
      relativeErrorLimit: 0.01,
      branches: [
        { id: 'terminal', branchClass: 'terminal', length: 0.5, width: 0 },
        { id: 'internal', branchClass: 'internal', length: 0.75, width: 0.25 },
      ],
    });
    expect(enumeration.ok).toBe(true);
    if (!enumeration.ok) throw new Error('square-grid prerequisite must enumerate');
    const grid = enumeration.value.candidates.find(
      (candidate) => candidate.columns === 4 && candidate.rows === 4,
    );
    if (grid === undefined) throw new Error('4x4 candidate is required');

    const allocation = allocateBranchDimensionsToSquareGridV1({
      schemaVersion: 1,
      recordType: BRANCH_GRID_ALLOCATION_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      squareGridCandidate: {
        candidateId: grid.candidateId,
        columns: grid.columns,
        rows: grid.rows,
        fitAxis: grid.fitAxis,
        cellSize: grid.cellSize,
      },
      relativeErrorLimit: enumeration.value.relativeErrorLimit,
      branches: grid.branchQuantizations.map((branch) => ({
        id: branch.branchId,
        branchClass: branch.branchClass,
        length: branch.length.sourceValueExact,
        width: branch.width.sourceValueExact,
      })),
    });
    expect(allocation.ok).toBe(true);
    if (!allocation.ok) throw new Error('enumerated dimensions must allocate');
    expect(allocation.value.allocations).toMatchObject([
      {
        branchId: 'internal',
        branchClass: 'internal',
        length: { steps: '3' },
        width: { steps: '1' },
      },
      {
        branchId: 'terminal',
        branchClass: 'terminal',
        length: { steps: '2' },
        width: { steps: '0' },
      },
    ]);
    for (const expected of grid.branchQuantizations) {
      const actual = allocation.value.allocations.find(
        (entry) => entry.branchId === expected.branchId,
      );
      expect(actual).toBeDefined();
      expect(actual?.length).toEqual({
        sourceValue: expected.length.sourceValueExact,
        steps: expected.length.steps,
        gridValue: expected.length.quantizedValue,
        relativeError: expected.length.relativeError,
      });
      expect(actual?.width).toEqual({
        sourceValue: expected.width.sourceValueExact,
        steps: expected.width.steps,
        gridValue: expected.width.quantizedValue,
        relativeError: expected.width.relativeError,
      });
    }
    expect(allocation.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'branch-dimension-grid-allocation-only',
      placementIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
    });
  });

  it('uses the same exact route for terminal/internal widths and preserves zero width', () => {
    const result = allocateBranchDimensionsToSquareGridV1(
      input({
        branches: [
          {
            id: 'terminal-positive',
            branchClass: 'terminal',
            length: rational('3', '4'),
            width: rational('1', '4'),
          },
          {
            id: 'internal-positive',
            branchClass: 'internal',
            length: rational('3', '4'),
            width: rational('1', '4'),
          },
          {
            id: 'internal-zero',
            branchClass: 'internal',
            length: rational('1', '2'),
            width: rational('0'),
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('exact dimensions must allocate');
    const terminal = result.value.allocations.find(
      (allocation) => allocation.branchId === 'terminal-positive',
    );
    const internal = result.value.allocations.find(
      (allocation) => allocation.branchId === 'internal-positive',
    );
    expect(terminal?.width).toEqual(internal?.width);
    expect(internal?.width).toEqual({
      sourceValue: rational('1', '4'),
      steps: '1',
      gridValue: rational('1', '4'),
      relativeError: rational('0'),
    });
    const zero = result.value.allocations.find(
      (allocation) => allocation.branchId === 'internal-zero',
    );
    expect(zero?.width).toEqual({
      sourceValue: rational('0'),
      steps: '0',
      gridValue: rational('0'),
      relativeError: rational('0'),
    });
  });

  it('applies nearest-half-up and the inclusive relative-error boundary with BigInt rationals', () => {
    const accepted = allocateBranchDimensionsToSquareGridV1(
      input({
        squareGridCandidate: {
          candidateId: 'square-grid:1x1:xy:1',
          columns: 1,
          rows: 1,
          fitAxis: 'both',
          cellSize: rational('1'),
        },
        relativeErrorLimit: rational('1', '10'),
        branches: [
          {
            id: 'boundary',
            branchClass: 'terminal',
            length: rational('10', '11'),
            width: rational('0'),
          },
        ],
      }),
    );
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) throw new Error('inclusive exact boundary must allocate');
    expect(accepted.value.allocations[0]).toMatchObject({
      length: { steps: '1', relativeError: rational('1', '10') },
      width: { steps: '0', relativeError: rational('0') },
    });

    const halfUp = allocateBranchDimensionsToSquareGridV1(
      input({
        squareGridCandidate: {
          candidateId: 'square-grid:1x1:xy:1',
          columns: 1,
          rows: 1,
          fitAxis: 'both',
          cellSize: rational('1'),
        },
        relativeErrorLimit: rational('1'),
        branches: [
          {
            id: 'half-up',
            branchClass: 'internal',
            length: rational('1', '2'),
            width: rational('0'),
          },
        ],
      }),
    );
    expect(halfUp.ok).toBe(true);
    if (!halfUp.ok) throw new Error('half-up tie must allocate');
    expect(halfUp.value.allocations[0]?.length.steps).toBe('1');

    const rejected = allocateBranchDimensionsToSquareGridV1(
      input({
        squareGridCandidate: {
          candidateId: 'square-grid:1x1:xy:1',
          columns: 1,
          rows: 1,
          fitAxis: 'both',
          cellSize: rational('1'),
        },
        relativeErrorLimit: rational('99', '1000'),
        branches: [
          {
            id: 'boundary',
            branchClass: 'terminal',
            length: rational('10', '11'),
            width: rational('0'),
          },
        ],
      }),
    );
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new Error('outside exact boundary must fail');
    expect(rejected.error).toMatchObject([{ code: 'relative-error-exceeded' }]);
  });

  it('returns no partial allocations when any dimension exceeds an error or step ceiling', () => {
    const branches: MutableAllocationBranch[] = [
      {
        id: 'fits',
        branchClass: 'terminal',
        length: rational('1'),
        width: rational('0'),
      },
      {
        id: 'too-many-steps',
        branchClass: 'internal',
        length: rational((BigInt(BRANCH_GRID_ALLOCATION_LIMITS.maxDimensionSteps) + 1n).toString()),
        width: rational('1', '3'),
      },
    ];
    const overrides = {
      relativeErrorLimit: rational('0'),
      squareGridCandidate: {
        candidateId: 'square-grid:1x1:xy:1',
        columns: 1,
        rows: 1,
        fitAxis: 'both' as const,
        cellSize: rational('1'),
      },
    };
    const result = allocateBranchDimensionsToSquareGridV1(input({ ...overrides, branches }));
    const reversed = allocateBranchDimensionsToSquareGridV1(
      input({ ...overrides, branches: [...branches].reverse() }),
    );
    expect(result).toEqual(reversed);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('ceiling violation must fail closed');
    expect(result).not.toHaveProperty('value');
    expect(result.error.map((issue) => issue.code)).toEqual([
      'step-limit-exceeded',
      'relative-error-exceeded',
    ]);
    expect(Object.isFrozen(result.error)).toBe(true);
    expect(Object.isFrozen(result.error[0])).toBe(true);
  });

  it('includes the exact defensive step ceiling', () => {
    const result = allocateBranchDimensionsToSquareGridV1(
      input({
        relativeErrorLimit: rational('0'),
        squareGridCandidate: {
          candidateId: 'square-grid:1x1:xy:1',
          columns: 1,
          rows: 1,
          fitAxis: 'both',
          cellSize: rational('1'),
        },
        branches: [
          {
            id: 'at-step-limit',
            branchClass: 'internal',
            length: rational(BRANCH_GRID_ALLOCATION_LIMITS.maxDimensionSteps),
            width: rational('0'),
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('inclusive step ceiling must allocate');
    expect(result.value.allocations[0]?.length.steps).toBe(
      BRANCH_GRID_ALLOCATION_LIMITS.maxDimensionSteps,
    );
  });

  it('is branch-order invariant, deterministic, deeply frozen, and contains no success claim', () => {
    const branches: MutableAllocationBranch[] = [
      {
        id: 'z-terminal',
        branchClass: 'terminal',
        length: rational('1'),
        width: rational('0'),
      },
      {
        id: 'a-internal',
        branchClass: 'internal',
        length: rational('3', '4'),
        width: rational('1', '4'),
      },
    ];
    const forward = allocateBranchDimensionsToSquareGridV1(input({ branches }));
    const reverse = allocateBranchDimensionsToSquareGridV1(
      input({ branches: [...branches].reverse() }),
    );
    const repeated = allocateBranchDimensionsToSquareGridV1(input({ branches }));
    expect(forward).toEqual(reverse);
    expect(forward).toEqual(repeated);
    expect(forward.ok).toBe(true);
    if (!forward.ok) throw new Error('deterministic input must allocate');
    expect(forward.value.allocations.map((allocation) => allocation.branchId)).toEqual([
      'a-internal',
      'z-terminal',
    ]);
    expect(Object.isFrozen(forward.value)).toBe(true);
    expect(Object.isFrozen(forward.value.squareGridCandidate.cellSize)).toBe(true);
    expect(Object.isFrozen(forward.value.allocations)).toBe(true);
    expect(Object.isFrozen(forward.value.allocations[0]?.length.relativeError)).toBe(true);

    const keys = keysDeep(forward.value).map((key) => key.toLowerCase());
    expect(keys).not.toContain('selected');
    expect(keys).not.toContain('supported');
    expect(keys).not.toContain('verified');
    expect(keys).not.toContain('go');
    expect(keys).not.toContain('packing');
    expect(keys).not.toContain('packed');
    expect(keys).not.toContain('coordinates');
    expect(keys).not.toContain('position');
  });
});
