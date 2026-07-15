import { describe, expect, it } from 'vitest';

import {
  buildSquareGridPaperPartitionV1,
  parseSquareGridPaperPartitionInputV1,
  SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE,
  type SquareGridPaperPartitionResultV1,
} from '../../m0f/box-pleating/square-grid-paper-partition.js';
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
    recordType: SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    squareGridCandidate: candidate,
  };
}

function build(raw: unknown): SquareGridPaperPartitionResultV1 {
  const result = buildSquareGridPaperPartitionV1(raw);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('paper partition must build');
  return result.value;
}

function expectIssue(raw: unknown, code: string): void {
  const parsed = parseSquareGridPaperPartitionInputV1(raw);
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error(`expected paper-partition issue ${code}`);
  expect(parsed.error.some((entry) => entry.code === code)).toBe(true);
}

describe('M0F exact square-grid paper partition', () => {
  it('retains a positive-x residual as a second exact paper region', () => {
    const result = build(input());

    expect(result.activeGridSubdivision).toEqual({
      cellGeometry: 'square',
      cellSize: rational('1', '4'),
      columns: 3,
      rows: 2,
    });
    expect(result.regions).toEqual([
      {
        regionId: 'paper-region:active-square-grid',
        regionClass: 'active-square-grid',
        residualAxis: 'none',
        bounds: {
          minimum: { x: rational('0'), y: rational('0') },
          maximum: { x: rational('3', '4'), y: rational('1', '2') },
        },
      },
      {
        regionId: 'paper-region:residual-positive-x',
        regionClass: 'residual-strip',
        residualAxis: 'x',
        bounds: {
          minimum: { x: rational('3', '4'), y: rational('0') },
          maximum: { x: rational('1'), y: rational('1', '2') },
        },
      },
    ]);
    expect(result.interfaces).toEqual([
      {
        interfaceId: 'paper-interface:residual-positive-x',
        orientation: 'vertical',
        from: { x: rational('3', '4'), y: rational('0') },
        to: { x: rational('3', '4'), y: rational('1', '2') },
        separatesRegionIds: ['paper-region:active-square-grid', 'paper-region:residual-positive-x'],
        semantics: 'partition-interface-only',
      },
    ]);
  });

  it('retains a positive-y residual with a horizontal non-crease interface', () => {
    const result = build(
      input({
        candidateId: 'square-grid:2x3:x:1/4',
        columns: 2,
        rows: 3,
        fitAxis: 'x',
        paper: { width: rational('1', '2'), height: rational('1') },
        residualStrips: { xAxis: rational('0'), yAxis: rational('1', '4') },
      }),
    );

    expect(result.regions).toHaveLength(2);
    expect(result.regions[1]).toMatchObject({
      regionId: 'paper-region:residual-positive-y',
      regionClass: 'residual-strip',
      residualAxis: 'y',
      bounds: {
        minimum: { x: rational('0'), y: rational('3', '4') },
        maximum: { x: rational('1', '2'), y: rational('1') },
      },
    });
    expect(result.interfaces[0]).toMatchObject({
      orientation: 'horizontal',
      from: { x: rational('0'), y: rational('3', '4') },
      to: { x: rational('1', '2'), y: rational('3', '4') },
      semantics: 'partition-interface-only',
    });
  });

  it('uses exactly one region and no interface when both paper axes fit', () => {
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

    expect(result.regions).toHaveLength(1);
    expect(result.interfaces).toEqual([]);
    expect(result.paperBoundary.vertices.map((entry) => entry.position)).toEqual([
      { x: rational('0'), y: rational('0') },
      { x: rational('1'), y: rational('0') },
      { x: rational('1'), y: rational('3', '4') },
      { x: rational('0'), y: rational('3', '4') },
    ]);
    expect(result.paperBoundary.segments.map((entry) => entry.boundarySide)).toEqual([
      'negative-y',
      'positive-x',
      'positive-y',
      'negative-x',
    ]);
  });

  it('keeps every construction and feasibility claim explicitly outside scope', () => {
    const result = build(input());
    expect(result).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'square-grid-paper-partition-only',
      isSupportProfile: false,
      candidateSelectionIncluded: false,
      creaseIncluded: false,
      foldAssignmentIncluded: false,
      savedCpIntegrationIncluded: false,
      branchPlacementIncluded: false,
      branchPackingIncluded: false,
      pleatRoutingIncluded: false,
      feasibilityDecisionIncluded: false,
      residualTreatment: 'retained-as-unassigned-paper-region',
      regionCoverageInvariant: 'entire-paper-with-pairwise-disjoint-interiors',
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.regions)).toBe(true);
    expect(Object.isFrozen(result.paperBoundary.vertices[0]?.position)).toBe(true);
  });

  it('fails closed on open records, escalated claims, and candidate inconsistencies', () => {
    expectIssue({ ...input(), selected: true }, 'unknown-field');
    expectIssue({ ...input(), contractStatus: 'verified' }, 'claim-boundary');
    expectIssue({ ...input(), scientificClaim: true }, 'claim-boundary');
    expectIssue(
      input({
        paper: { width: rational('1'), height: rational('3', '4') },
        residualStrips: { xAxis: rational('1', '4'), yAxis: rational('1', '4') },
      }),
      'grid-invariant-mismatch',
    );
    expectIssue(input({ candidateId: 'square-grid:wrong' }), 'candidate-identity-mismatch');
  });

  it('rejects accessors without invoking them and never aliases caller data', () => {
    let getterCalls = 0;
    const accessor = input();
    Object.defineProperty(accessor, 'scientificClaim', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return false;
      },
    });
    expectIssue(accessor, 'invalid-snapshot');
    expect(getterCalls).toBe(0);

    const mutable = input();
    const parsed = parseSquareGridPaperPartitionInputV1(mutable);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('candidate must parse');
    const sourceCandidate = mutable.squareGridCandidate as MutableCandidate;
    sourceCandidate.paper.width = rational('99');
    expect(parsed.value.squareGridCandidate.paper.width).toEqual(rational('1'));
  });
});
