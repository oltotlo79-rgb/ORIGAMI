import { describe, expect, it } from 'vitest';
import { evaluateFoldSafetyCandidateCheckerV1 } from '../../m0f/fold-safety-candidate-checker.js';

describe('fold safety candidate checker', () => {
  it('fails closed on malformed input', () => {
    const result = evaluateFoldSafetyCandidateCheckerV1({});
    expect(result.ok).toBe(false);
  });

  it('never escalates candidate data to a product safety claim', () => {
    const result = evaluateFoldSafetyCandidateCheckerV1({
      schemaVersion: 1,
      schemaId: 'bad',
    });
    expect(result.ok).toBe(false);
  });
});
