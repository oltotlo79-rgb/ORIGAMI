import { describe, expect, it, vi } from 'vitest';

import { searchEuclideanNecessaryWitnessesV1 } from '../../m0f/box-pleating/euclidean-necessary-witness-search.js';
import { validateEuclideanNecessaryWitnessSearchResultV1 } from '../../m0f/box-pleating/euclidean-necessary-witness-search-result-validation.js';
import { executeEuclideanNecessaryWitnessSearchWorkerMessageV1 } from '../../m0f/workers/euclidean-necessary-witness-search-worker-handler.js';
import { executeEuclideanNecessaryWitnessValidationWorkerMessageV1 } from '../../m0f/workers/euclidean-necessary-witness-validation-worker-handler.js';
import {
  witnessWorkerCandidate,
  witnessWorkerInput,
  witnessWorkerSearchRequest,
  witnessWorkerValidationRequest,
  type WitnessWorkerJson,
} from './euclidean-necessary-witness-worker-fixtures.js';

describe('two-stage Euclidean necessary-witness Worker handlers', () => {
  it('calls the bounded producer exactly once and emits only a candidate relay', () => {
    const producer = vi.fn(searchEuclideanNecessaryWitnessesV1);
    const response = executeEuclideanNecessaryWitnessSearchWorkerMessageV1(
      witnessWorkerSearchRequest(),
      producer,
    );
    expect(producer).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({
      outcome: 'candidate-produced',
      scientificClaim: false,
      packingIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
    });
  });

  it('calls the independent replay exactly once and returns its canonical result', () => {
    const validator = vi.fn(validateEuclideanNecessaryWitnessSearchResultV1);
    const response = executeEuclideanNecessaryWitnessValidationWorkerMessageV1(
      witnessWorkerValidationRequest(),
      validator,
    );
    expect(validator).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({ outcome: 'validated', reason: null, globalM0fGo: false });
    expect(Object.isFrozen(response)).toBe(true);
  });

  it('has the real independent replay reject status, arithmetic, and nested-claim tampering', () => {
    const input = witnessWorkerInput();
    const base = witnessWorkerCandidate(input);
    const mutations: ((candidate: WitnessWorkerJson) => void)[] = [
      (candidate) => {
        candidate.searchStatus = 'budget-exhausted';
        candidate.visitedStates = candidate.maxVisitedStates;
      },
      (candidate) => {
        const witness = (candidate.witnesses as WitnessWorkerJson[])[0];
        const pair = (witness?.pairEvaluations as WitnessWorkerJson[] | undefined)?.[0];
        if (pair !== undefined) pair.actualSquaredDistance = '999';
      },
      (candidate) => {
        (candidate.packingProblemReference as WitnessWorkerJson).packingIncluded = true;
      },
    ];
    for (const mutate of mutations) {
      const candidate = structuredClone(base) as unknown as WitnessWorkerJson;
      mutate(candidate);
      const validator = vi.fn(validateEuclideanNecessaryWitnessSearchResultV1);
      const response = executeEuclideanNecessaryWitnessValidationWorkerMessageV1(
        witnessWorkerValidationRequest('job:tamper', 'validation:tamper', input, candidate),
        validator,
      );
      expect(validator).toHaveBeenCalledTimes(1);
      expect(response).toMatchObject({
        outcome: 'rejected',
        reason: 'independent-replay-rejected',
        result: null,
      });
    }
  });

  it('maps producer/validator failures and exceptions to fixed non-claim reasons', () => {
    const producerRejected = executeEuclideanNecessaryWitnessSearchWorkerMessageV1(
      witnessWorkerSearchRequest(),
      () => ({ ok: false, error: [] }),
    );
    expect(producerRejected).toMatchObject({
      outcome: 'failed',
      reason: 'search-producer-rejected',
    });
    const producerException = executeEuclideanNecessaryWitnessSearchWorkerMessageV1(
      witnessWorkerSearchRequest(),
      () => {
        throw new Error('SECRET');
      },
    );
    expect(producerException).toMatchObject({ outcome: 'failed', reason: 'internal-error' });
    const validatorException = executeEuclideanNecessaryWitnessValidationWorkerMessageV1(
      witnessWorkerValidationRequest(),
      () => {
        throw new Error('SECRET');
      },
    );
    expect(validatorException).toMatchObject({
      outcome: 'rejected',
      reason: 'independent-replay-rejected',
    });
    expect(JSON.stringify([producerRejected, producerException, validatorException])).not.toContain(
      'SECRET',
    );
  });

  it('consumes malformed trusted boundaries silently without running either expensive function', () => {
    const producer = vi.fn(searchEuclideanNecessaryWitnessesV1);
    const validator = vi.fn(validateEuclideanNecessaryWitnessSearchResultV1);
    expect(
      executeEuclideanNecessaryWitnessSearchWorkerMessageV1({ jobId: 'untrusted' }, producer),
    ).toBeUndefined();
    expect(
      executeEuclideanNecessaryWitnessValidationWorkerMessageV1(
        { validationId: 'untrusted' },
        validator,
      ),
    ).toBeUndefined();
    expect(producer).not.toHaveBeenCalled();
    expect(validator).not.toHaveBeenCalled();
  });
});
