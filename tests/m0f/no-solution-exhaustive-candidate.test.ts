import { describe, expect, it } from 'vitest';
import {
  candidateBranchDigest,
  evaluateBoundedExhaustiveCandidate,
} from '../../m0f/no-solution-exhaustive-candidate';

const base = {
  schemaVersion: 1 as const,
  recordType: 'm0f-bounded-exhaustive-no-solution-candidate' as const,
  contractStatus: 'candidate' as const,
  domain: { name: 'single-hinge-v1', version: '1', cardinality: 2 },
  explored: { count: 2, branchIds: ['a', 'b'], branchDigest: candidateBranchDigest(['a', 'b']) },
  terminal: { allRejected: true, rejectionDigest: 'a'.repeat(64) },
};

describe('bounded exhaustive no-solution candidate', () => {
  it('accepts only closed exhaustive rejection evidence', () => {
    const result = evaluateBoundedExhaustiveCandidate(base);
    expect(result.accepted).toBe(true);
    expect(result.noSolutionCertified).toBe(false);
  });
  it('fails closed on incomplete exploration', () => {
    const result = evaluateBoundedExhaustiveCandidate({
      ...base,
      explored: { ...base.explored, count: 1 },
    });
    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('exploration-does-not-cover-entire-bounded-domain');
  });
});
