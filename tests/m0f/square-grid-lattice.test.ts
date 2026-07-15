import { describe, expect, it } from 'vitest';

import {
  buildSquareGridLatticeV1,
  parseSquareGridLatticeInputV1,
  SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
  SQUARE_GRID_LATTICE_LIMITS,
  type SquareGridLatticeResultV1,
} from '../../m0f/box-pleating/square-grid-lattice.js';
import type { ExactRationalJsonV1 } from '../../m0f/model/exact-rational-json.js';

interface MutableCandidate {
  candidateId: string;
  columns: number;
  rows: number;
  fitAxis: 'x' | 'y' | 'both';
  cellSize: ExactRationalJsonV1;
  paper: { width: ExactRationalJsonV1; height: ExactRationalJsonV1 };
  residualStrips: { xAxis: ExactRationalJsonV1; yAxis: ExactRationalJsonV1 };
}

function rational(numerator: string, denominator = '1'): ExactRationalJsonV1 {
  return { numerator, denominator };
}

function input(candidateOverrides: Partial<MutableCandidate> = {}): Record<string, unknown> {
  const candidate: MutableCandidate = {
    candidateId: 'square-grid:3x2:y:1/4',
    columns: 3,
    rows: 2,
    fitAxis: 'y',
    cellSize: rational('1', '4'),
    paper: { width: rational('1'), height: rational('1', '2') },
    residualStrips: { xAxis: rational('1', '4'), yAxis: rational('0') },
    ...candidateOverrides,
  };
  return {
    schemaVersion: 1,
    recordType: SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    squareGridCandidate: candidate,
  };
}

function unitGridInput(columns: number, rows: number): Record<string, unknown> {
  return input({
    candidateId: `square-grid:${String(columns)}x${String(rows)}:xy:1`,
    columns,
    rows,
    fitAxis: 'both',
    cellSize: rational('1'),
    paper: { width: rational(String(columns)), height: rational(String(rows)) },
    residualStrips: { xAxis: rational('0'), yAxis: rational('0') },
  });
}

function expectIssue(raw: unknown, code: string): void {
  const parsed = parseSquareGridLatticeInputV1(raw);
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error(`expected square-grid lattice issue ${code}`);
  expect(parsed.error.some((issue) => issue.code === code)).toBe(true);
}

function build(raw: unknown): SquareGridLatticeResultV1 {
  const result = buildSquareGridLatticeV1(raw);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('square-grid lattice must build');
  return result.value;
}

type Fraction = Readonly<{ numerator: bigint; denominator: bigint }>;

function fraction(value: ExactRationalJsonV1): Fraction {
  return { numerator: BigInt(value.numerator), denominator: BigInt(value.denominator) };
}

function add(left: Fraction, right: Fraction): Fraction {
  return {
    numerator: left.numerator * right.denominator + right.numerator * left.denominator,
    denominator: left.denominator * right.denominator,
  };
}

function equal(left: Fraction, right: Fraction): boolean {
  return left.numerator * right.denominator === right.numerator * left.denominator;
}

describe('M0F exact square-grid lattice input', () => {
  it('revalidates a rectangular paper with a positive-x residual strip exactly', () => {
    const parsed = parseSquareGridLatticeInputV1(input());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('rectangular candidate must parse');

    const candidate = parsed.value.squareGridCandidate;
    const gridWidth: Fraction = {
      numerator: BigInt(candidate.cellSize.numerator) * BigInt(candidate.columns),
      denominator: BigInt(candidate.cellSize.denominator),
    };
    const gridHeight: Fraction = {
      numerator: BigInt(candidate.cellSize.numerator) * BigInt(candidate.rows),
      denominator: BigInt(candidate.cellSize.denominator),
    };
    expect(
      equal(
        add(gridWidth, fraction(candidate.residualStrips.xAxis)),
        fraction(candidate.paper.width),
      ),
    ).toBe(true);
    expect(
      equal(
        add(gridHeight, fraction(candidate.residualStrips.yAxis)),
        fraction(candidate.paper.height),
      ),
    ).toBe(true);
    expect(candidate.fitAxis).toBe('y');
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(candidate.paper)).toBe(true);
  });

  it('accepts an exact rectangular aspect whose two axes both fit', () => {
    const result = build(
      input({
        candidateId: 'square-grid:4x3:xy:1/4',
        columns: 4,
        rows: 3,
        fitAxis: 'both',
        paper: { width: rational('1'), height: rational('3', '4') },
        residualStrips: { xAxis: rational('0'), yAxis: rational('0') },
      }),
    );
    expect(result.internalGridRegion.width).toEqual(rational('1'));
    expect(result.internalGridRegion.height).toEqual(rational('3', '4'));
    expect(result.residualStrips.xAxis).toEqual({
      boundarySide: 'positive-x',
      size: rational('0'),
    });
    expect(result.residualStrips.yAxis).toEqual({
      boundarySide: 'positive-y',
      size: rational('0'),
    });
  });

  it('rejects open fields, claim escalation, and noncanonical rational data', () => {
    expectIssue({ ...input(), selected: true }, 'unknown-field');
    expectIssue({ ...input(), contractStatus: 'verified' }, 'claim-boundary');
    expectIssue({ ...input(), scientificClaim: true }, 'claim-boundary');

    const nestedUnknown = input();
    const nestedCandidate = nestedUnknown.squareGridCandidate as MutableCandidate & {
      crease?: boolean;
    };
    nestedCandidate.crease = false;
    expectIssue(nestedUnknown, 'unknown-field');

    expectIssue(input({ cellSize: rational('2', '8') }), 'not-normalized');
    expectIssue(input({ cellSize: rational('0') }), 'invalid-bound');
    expectIssue(
      input({ residualStrips: { xAxis: rational('-1', '4'), yAxis: rational('0') } }),
      'invalid-bound',
    );
  });

  it('rejects identity, extent, zero-residual, and fit-axis inconsistencies', () => {
    expectIssue(input({ candidateId: 'square-grid:3x2:y:1/5' }), 'candidate-identity-mismatch');
    expectIssue(
      input({ paper: { width: rational('2'), height: rational('1', '2') } }),
      'grid-invariant-mismatch',
    );
    expectIssue(
      input({
        paper: { width: rational('1'), height: rational('3', '4') },
        residualStrips: { xAxis: rational('1', '4'), yAxis: rational('1', '4') },
      }),
      'grid-invariant-mismatch',
    );
    expectIssue(
      input({
        candidateId: 'square-grid:3x2:x:1/4',
        fitAxis: 'x',
      }),
      'grid-invariant-mismatch',
    );
  });

  it('rejects cyclic, exotic, sparse, and accessor-bearing inputs without invoking a getter', () => {
    const cyclic = input();
    cyclic.self = cyclic;
    expectIssue(cyclic, 'invalid-snapshot');

    expectIssue(new Map(Object.entries(input())), 'invalid-snapshot');

    const sparse = input();
    sparse.unused = Array(2);
    expectIssue(sparse, 'invalid-snapshot');

    let getterCalls = 0;
    const accessor = input();
    const accessorCandidate = accessor.squareGridCandidate as MutableCandidate;
    Object.defineProperty(accessorCandidate.paper, 'width', {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return rational('1');
      },
    });
    expectIssue(accessor, 'invalid-snapshot');
    expect(getterCalls).toBe(0);

    const symbolBearing = input();
    Object.defineProperty(symbolBearing, Symbol('hidden'), { enumerable: true, value: false });
    expectIssue(symbolBearing, 'invalid-snapshot');

    const nonEnumerable = input();
    Object.defineProperty(nonEnumerable, 'hidden', { enumerable: false, value: false });
    expectIssue(nonEnumerable, 'invalid-snapshot');

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
  });

  it('enforces individual and composite defensive ceilings without treating them as support', () => {
    const atAxisCeiling = build(
      input({
        candidateId: `square-grid:${String(SQUARE_GRID_LATTICE_LIMITS.maxColumns)}x1:xy:1`,
        columns: SQUARE_GRID_LATTICE_LIMITS.maxColumns,
        rows: 1,
        fitAxis: 'both',
        cellSize: rational('1'),
        paper: {
          width: rational(String(SQUARE_GRID_LATTICE_LIMITS.maxColumns)),
          height: rational('1'),
        },
        residualStrips: { xAxis: rational('0'), yAxis: rational('0') },
      }),
    );
    expect(atAxisCeiling.isSupportProfile).toBe(false);

    expectIssue(input({ columns: SQUARE_GRID_LATTICE_LIMITS.maxColumns + 1 }), 'invalid-bound');
    expectIssue(
      input({
        candidateId: `square-grid:${String(SQUARE_GRID_LATTICE_LIMITS.maxColumns)}x${String(SQUARE_GRID_LATTICE_LIMITS.maxRows)}:xy:1`,
        columns: SQUARE_GRID_LATTICE_LIMITS.maxColumns,
        rows: SQUARE_GRID_LATTICE_LIMITS.maxRows,
        fitAxis: 'both',
        cellSize: rational('1'),
        paper: {
          width: rational(String(SQUARE_GRID_LATTICE_LIMITS.maxColumns)),
          height: rational(String(SQUARE_GRID_LATTICE_LIMITS.maxRows)),
        },
        residualStrips: { xAxis: rational('0'), yAxis: rational('0') },
      }),
      'output-limit-exceeded',
    );
    expectIssue(
      input({
        cellSize: rational('1'.repeat(SQUARE_GRID_LATTICE_LIMITS.maxExactIntegerDigits + 1)),
      }),
      'invalid-integer',
    );
  });

  it('keeps the 128 by 128 candidate profile point inside the defensive ceilings', () => {
    const result = build(unitGridInput(128, 128));
    expect(result.counts).toEqual({
      vertices: 16_641,
      directionPrimitives: 65_792,
      byDirectionFamily: {
        horizontal: 16_512,
        vertical: 16_512,
        positive45Diagonal: 16_384,
        negative45Diagonal: 16_384,
      },
    });
    expect(result.isSupportProfile).toBe(false);
    expect(result.feasibilityDecisionIncluded).toBe(false);
  });

  it('accepts the last composite-limit shapes and rejects the adjacent larger shapes', () => {
    expect(parseSquareGridLatticeInputV1(unitGridInput(258, 258)).ok).toBe(true);
    expectIssue(unitGridInput(259, 259), 'output-limit-exceeded');

    expect(parseSquareGridLatticeInputV1(unitGridInput(512, 130)).ok).toBe(true);
    expectIssue(unitGridInput(512, 131), 'output-limit-exceeded');
    expect(parseSquareGridLatticeInputV1(unitGridInput(130, 512)).ok).toBe(true);
    expectIssue(unitGridInput(131, 512), 'output-limit-exceeded');
  });

  it('accepts normalized exact integers at the digit ceiling without lossy conversion', () => {
    const numerator = `1${'0'.repeat(SQUARE_GRID_LATTICE_LIMITS.maxExactIntegerDigits - 1)}`;
    const denominator = '9'.repeat(SQUARE_GRID_LATTICE_LIMITS.maxExactIntegerDigits);
    const exactCell = rational(numerator, denominator);
    const result = build(
      input({
        candidateId: `square-grid:1x1:xy:${numerator}/${denominator}`,
        columns: 1,
        rows: 1,
        fitAxis: 'both',
        cellSize: exactCell,
        paper: { width: exactCell, height: exactCell },
        residualStrips: { xAxis: rational('0'), yAxis: rational('0') },
      }),
    );
    expect(result.squareGridCandidate.cellSize).toEqual(exactCell);
    expect(result.vertices.at(-1)?.position).toEqual({ x: exactCell, y: exactCell });
  });
});

describe('M0F exact square-grid lattice substrate', () => {
  it('enumerates the minimum grid in canonical vertex and direction-family order', () => {
    const result = build(
      input({
        candidateId: 'square-grid:1x1:xy:2/3',
        columns: 1,
        rows: 1,
        fitAxis: 'both',
        cellSize: rational('2', '3'),
        paper: { width: rational('2', '3'), height: rational('2', '3') },
        residualStrips: { xAxis: rational('0'), yAxis: rational('0') },
      }),
    );

    expect(result.vertices.map((vertex) => vertex.vertexId)).toEqual([
      'grid-vertex:0:0',
      'grid-vertex:1:0',
      'grid-vertex:0:1',
      'grid-vertex:1:1',
    ]);
    expect(result.directionPrimitives.map((primitive) => primitive.primitiveId)).toEqual([
      'grid-direction:h:0:0',
      'grid-direction:h:0:1',
      'grid-direction:v:0:0',
      'grid-direction:v:1:0',
      'grid-direction:dp:0:0',
      'grid-direction:dn:0:0',
    ]);
    expect(result.directionPrimitives.map((primitive) => primitive.directionFamily)).toEqual([
      'horizontal',
      'horizontal',
      'vertical',
      'vertical',
      'positive-45-diagonal',
      'negative-45-diagonal',
    ]);
    expect(result.counts).toEqual({
      vertices: 4,
      directionPrimitives: 6,
      byDirectionFamily: {
        horizontal: 2,
        vertical: 2,
        positive45Diagonal: 1,
        negative45Diagonal: 1,
      },
    });
  });

  it('preserves exact square-cell coordinates and every primitive arithmetic invariant', () => {
    const result = build(input());
    const vertices = new Map(result.vertices.map((vertex) => [vertex.vertexId, vertex]));
    const cell = fraction(result.squareGridCandidate.cellSize);

    expect(result.vertices.at(-1)).toEqual({
      vertexId: 'grid-vertex:3:2',
      gridIndex: { x: 3, y: 2 },
      position: { x: rational('3', '4'), y: rational('1', '2') },
    });
    for (const vertex of result.vertices) {
      expect(
        equal(fraction(vertex.position.x), {
          numerator: cell.numerator * BigInt(vertex.gridIndex.x),
          denominator: cell.denominator,
        }),
      ).toBe(true);
      expect(
        equal(fraction(vertex.position.y), {
          numerator: cell.numerator * BigInt(vertex.gridIndex.y),
          denominator: cell.denominator,
        }),
      ).toBe(true);
    }

    for (const primitive of result.directionPrimitives) {
      const from = vertices.get(primitive.fromVertexId);
      const to = vertices.get(primitive.toVertexId);
      expect(from).toBeDefined();
      expect(to).toBeDefined();
      if (from === undefined || to === undefined) throw new Error('primitive endpoint is missing');
      expect(to.gridIndex.x - from.gridIndex.x).toBe(primitive.gridStep.dx);
      expect(to.gridIndex.y - from.gridIndex.y).toBe(primitive.gridStep.dy);
    }
    expect(new Set(result.directionPrimitives.map((entry) => entry.primitiveId)).size).toBe(
      result.directionPrimitives.length,
    );
    expect(
      new Set(
        result.directionPrimitives.map((entry) =>
          [entry.fromVertexId, entry.toVertexId].sort().join('--'),
        ),
      ).size,
    ).toBe(result.directionPrimitives.length);
    expect(new Set(result.directionPrimitives.map((entry) => entry.directionFamily))).toEqual(
      new Set(['horizontal', 'vertical', 'positive-45-diagonal', 'negative-45-diagonal']),
    );
  });

  it('uses the declared family-major and row-major order on a multi-cell grid', () => {
    const result = build(input());
    expect(result.directionPrimitives.map((primitive) => primitive.primitiveId)).toEqual([
      'grid-direction:h:0:0',
      'grid-direction:h:1:0',
      'grid-direction:h:2:0',
      'grid-direction:h:0:1',
      'grid-direction:h:1:1',
      'grid-direction:h:2:1',
      'grid-direction:h:0:2',
      'grid-direction:h:1:2',
      'grid-direction:h:2:2',
      'grid-direction:v:0:0',
      'grid-direction:v:1:0',
      'grid-direction:v:2:0',
      'grid-direction:v:3:0',
      'grid-direction:v:0:1',
      'grid-direction:v:1:1',
      'grid-direction:v:2:1',
      'grid-direction:v:3:1',
      'grid-direction:dp:0:0',
      'grid-direction:dp:1:0',
      'grid-direction:dp:2:0',
      'grid-direction:dp:0:1',
      'grid-direction:dp:1:1',
      'grid-direction:dp:2:1',
      'grid-direction:dn:0:0',
      'grid-direction:dn:1:0',
      'grid-direction:dn:2:0',
      'grid-direction:dn:0:1',
      'grid-direction:dn:1:1',
      'grid-direction:dn:2:1',
    ]);
  });

  it('is deterministic, deeply frozen, and unaffected by later caller mutation', () => {
    const raw = input();
    const first = build(raw);
    const second = build(input());
    expect(first).toEqual(second);

    const mutableCandidate = raw.squareGridCandidate as MutableCandidate;
    mutableCandidate.candidateId = 'changed';
    mutableCandidate.paper.width = rational('99');
    mutableCandidate.residualStrips.xAxis = rational('98');
    expect(first).toEqual(second);

    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.vertices)).toBe(true);
    expect(Object.isFrozen(first.vertices[0])).toBe(true);
    expect(Object.isFrozen(first.directionPrimitives)).toBe(true);
    expect(Object.isFrozen(first.directionPrimitives[0]?.gridStep)).toBe(true);
  });

  it('fixes the no-claim boundary and never turns direction primitives into construction data', () => {
    const result = build(input());
    expect(result).toMatchObject({
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
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/"contractStatus":"(?:selected|supported|verified|passed|go)"/i);
    expect(serialized).not.toContain('creaseAssignment');
    expect(serialized).not.toContain('branchRole');
    for (const primitive of result.directionPrimitives) {
      expect(Object.keys(primitive).sort()).toEqual([
        'directionFamily',
        'fromVertexId',
        'gridStep',
        'primitiveId',
        'toVertexId',
      ]);
    }
  });
});
