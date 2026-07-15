import { describe, expect, it } from 'vitest';

import {
  enumerateSquareGridCandidatesV1,
  parseSquareGridCandidateInputV1,
  SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
  type SquareGridCandidateInputV1,
  type SquareGridCandidateResultV1,
} from '../../m0f/box-pleating/square-grid-candidates.js';
import { findSquareGridSourceBindingViolationV1 } from '../../m0f/box-pleating/square-grid-source-binding.js';

function rawInput(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: { width: 1.5, height: 1 },
    maxColumns: 8,
    maxRows: 8,
    relativeErrorLimit: 0.01,
    branches: [
      { id: 'internal-a', branchClass: 'internal', length: 0.75, width: 0.25 },
      { id: 'terminal-z', branchClass: 'terminal', length: 0.5, width: 0 },
    ],
    ...overrides,
  };
}

function source(overrides: Readonly<Record<string, unknown>> = {}): SquareGridCandidateInputV1 {
  const parsed = parseSquareGridCandidateInputV1(rawInput(overrides));
  if (!parsed.ok) throw new Error('source-binding input fixture must parse');
  return parsed.value;
}

function result(overrides: Readonly<Record<string, unknown>> = {}): SquareGridCandidateResultV1 {
  const enumerated = enumerateSquareGridCandidatesV1(rawInput(overrides));
  if (!enumerated.ok) throw new Error('source-binding result fixture must enumerate');
  return enumerated.value;
}

describe('square-grid canonical source/result binding', () => {
  it('accepts the result produced from the canonical source', () => {
    expect(findSquareGridSourceBindingViolationV1(source(), result())).toBeUndefined();
  });

  it('finds paper, enumeration-bound, and relative-error mismatches on valid results', () => {
    expect(
      findSquareGridSourceBindingViolationV1(source(), result({ paper: { width: 2, height: 1 } })),
    ).toMatchObject({ path: '$.paper' });
    expect(
      findSquareGridSourceBindingViolationV1(source(), result({ maxColumns: 7 })),
    ).toMatchObject({ path: '$.enumerationBounds' });
    expect(
      findSquareGridSourceBindingViolationV1(source(), result({ relativeErrorLimit: 0.02 })),
    ).toMatchObject({ path: '$.relativeErrorLimit' });
  });

  it('finds a changed result-level source branch before inspecting candidates', () => {
    const changed = structuredClone(result()) as unknown as {
      sourceBranches: { length: number }[];
    };
    const first = changed.sourceBranches[0];
    if (first === undefined) throw new Error('source branch fixture is missing');
    first.length = 0.625;
    expect(
      findSquareGridSourceBindingViolationV1(
        source(),
        changed as unknown as SquareGridCandidateResultV1,
      ),
    ).toMatchObject({ path: '$.sourceBranches[0]' });
  });

  it('finds a changed candidate branch even when the result source list is intact', () => {
    const changed = structuredClone(result()) as unknown as {
      candidates: { branchQuantizations: { length: { sourceValue: number } }[] }[];
    };
    const first = changed.candidates[0]?.branchQuantizations[0];
    if (first === undefined) throw new Error('candidate branch fixture is missing');
    first.length.sourceValue = 0.625;
    expect(
      findSquareGridSourceBindingViolationV1(
        source(),
        changed as unknown as SquareGridCandidateResultV1,
      ),
    ).toMatchObject({ path: '$.candidates[0].branchQuantizations[0]' });
  });
});
