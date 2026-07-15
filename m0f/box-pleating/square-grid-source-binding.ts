import { finiteBinary64ToExactRational } from '../model/exact-rational.js';
import type {
  SquareGridCandidateInputV1,
  SquareGridCandidateResultV1,
} from './square-grid-candidates.js';

export type SquareGridSourceBindingViolationV1 = Readonly<{
  path: string;
  message: string;
}>;

function exactJsonMatchesBinary64(
  supplied: Readonly<{ numerator: string; denominator: string }>,
  source: number,
): boolean {
  const expected = finiteBinary64ToExactRational(source);
  return (
    supplied.numerator === expected.numerator.toString() &&
    supplied.denominator === expected.denominator.toString()
  );
}

/**
 * Finds the first mismatch between a canonical grid input and a completed
 * candidate result. Paths are rooted at `$` so each enclosing protocol can
 * prefix them without duplicating the binding rules.
 */
export function findSquareGridSourceBindingViolationV1(
  source: SquareGridCandidateInputV1,
  result: SquareGridCandidateResultV1,
): SquareGridSourceBindingViolationV1 | undefined {
  if (
    !exactJsonMatchesBinary64(result.paper.width, source.paper.width) ||
    !exactJsonMatchesBinary64(result.paper.height, source.paper.height)
  ) {
    return { path: '$.paper', message: 'result paper must match its canonical source exactly' };
  }
  if (
    result.enumerationBounds.maxColumns !== source.maxColumns ||
    result.enumerationBounds.maxRows !== source.maxRows
  ) {
    return {
      path: '$.enumerationBounds',
      message: 'result enumeration bounds must match its canonical source',
    };
  }
  if (!exactJsonMatchesBinary64(result.relativeErrorLimit, source.relativeErrorLimit)) {
    return {
      path: '$.relativeErrorLimit',
      message: 'result relative-error limit must match its canonical source exactly',
    };
  }

  if (result.sourceBranches.length !== source.branches.length) {
    return {
      path: '$.sourceBranches',
      message: 'result source branches must contain exactly the canonical source branches',
    };
  }
  for (const [branchIndex, sourceBranch] of source.branches.entries()) {
    const resultBranch = result.sourceBranches[branchIndex];
    if (
      resultBranch === undefined ||
      resultBranch.id !== sourceBranch.id ||
      resultBranch.branchClass !== sourceBranch.branchClass ||
      resultBranch.length !== sourceBranch.length ||
      resultBranch.width !== sourceBranch.width
    ) {
      return {
        path: `$.sourceBranches[${String(branchIndex)}]`,
        message:
          'result source branch identity, class, length, and width must match its canonical source',
      };
    }
  }

  for (const [candidateIndex, candidate] of result.candidates.entries()) {
    if (candidate.branchQuantizations.length !== source.branches.length) {
      return {
        path: `$.candidates[${String(candidateIndex)}].branchQuantizations`,
        message: 'every candidate must contain exactly the canonical source branches',
      };
    }
    for (const [branchIndex, sourceBranch] of source.branches.entries()) {
      const branch = candidate.branchQuantizations[branchIndex];
      if (
        branch === undefined ||
        branch.branchId !== sourceBranch.id ||
        branch.branchClass !== sourceBranch.branchClass ||
        branch.length.sourceValue !== sourceBranch.length ||
        branch.width.sourceValue !== sourceBranch.width
      ) {
        return {
          path: `$.candidates[${String(candidateIndex)}].branchQuantizations[${String(branchIndex)}]`,
          message:
            'candidate branch identity, class, length, and width must match its canonical source',
        };
      }
    }
  }
  return undefined;
}
