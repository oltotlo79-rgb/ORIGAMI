import { createHash } from 'node:crypto';
import { deepFreezeOwned } from './clone-and-freeze.js';

export const NO_SOLUTION_EXHAUSTIVE_CANDIDATE_RECORD_TYPE =
  'm0f-bounded-exhaustive-no-solution-candidate' as const;

export type BoundedExhaustiveNoSolutionInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof NO_SOLUTION_EXHAUSTIVE_CANDIDATE_RECORD_TYPE;
  contractStatus: 'candidate';
  domain: Readonly<{ name: string; version: string; cardinality: number }>;
  explored: Readonly<{ count: number; branchIds: readonly string[]; branchDigest: string }>;
  terminal: Readonly<{ allRejected: boolean; rejectionDigest: string }>;
}>;

export type BoundedExhaustiveNoSolutionResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof NO_SOLUTION_EXHAUSTIVE_CANDIDATE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  noSolutionCertified: false;
  boundedDomainClosed: boolean;
  exhaustiveCoverage: boolean;
  allBranchesRejected: boolean;
  branchDigestValid: boolean;
  rejectionDigestValid: boolean;
  accepted: boolean;
  globalM0fGate: 'not-evaluated';
  issues: readonly string[];
}>;

const digest = (items: readonly string[]) =>
  createHash('sha256').update(JSON.stringify(items)).digest('hex');

export function evaluateBoundedExhaustiveCandidate(
  input: BoundedExhaustiveNoSolutionInputV1,
): BoundedExhaustiveNoSolutionResultV1 {
  const issues: string[] = [];
  const boundedDomainClosed = Number.isSafeInteger(input.domain.cardinality) && input.domain.cardinality > 0;
  const exhaustiveCoverage = boundedDomainClosed && input.explored.count === input.domain.cardinality &&
    input.explored.branchIds.length === input.domain.cardinality;
  const branchDigestValid = input.explored.branchDigest === digest(input.explored.branchIds);
  const allBranchesRejected = input.terminal.allRejected;
  const rejectionDigestValid = input.terminal.rejectionDigest.length === 64;
  if (!boundedDomainClosed) issues.push('domain-cardinality-must-be-positive-safe-integer');
  if (!exhaustiveCoverage) issues.push('exploration-does-not-cover-entire-bounded-domain');
  if (!branchDigestValid) issues.push('branch-digest-mismatch');
  if (!allBranchesRejected) issues.push('not-all-branches-rejected');
  if (!rejectionDigestValid) issues.push('rejection-digest-must-be-sha256');
  return deepFreezeOwned({ schemaVersion: 1, recordType: NO_SOLUTION_EXHAUSTIVE_CANDIDATE_RECORD_TYPE,
    contractStatus: 'candidate', scientificClaim: false, noSolutionCertified: false,
    boundedDomainClosed, exhaustiveCoverage, allBranchesRejected, branchDigestValid,
    rejectionDigestValid, accepted: issues.length === 0, globalM0fGate: 'not-evaluated', issues });
}

export { digest as candidateBranchDigest };
