import { describe, expect, it } from 'vitest';

import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_PROTOCOL_LIMITS,
  parseEuclideanNecessaryWitnessCandidateRelayV1,
  parseEuclideanNecessaryWitnessSearchInputForWorkerV1,
  parseEuclideanNecessaryWitnessSearchWorkerRequestV1,
  parseEuclideanNecessaryWitnessSearchWorkerResponseV1,
} from '../../m0f/workers/euclidean-necessary-witness-search-worker-protocol.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_PROTOCOL_LIMITS,
  parseEuclideanNecessaryWitnessValidationWorkerRequestV1,
  parseEuclideanNecessaryWitnessValidationWorkerResponseV1,
} from '../../m0f/workers/euclidean-necessary-witness-validation-worker-protocol.js';
import {
  witnessWorkerCandidate,
  witnessWorkerInput,
  witnessWorkerMaximalInput,
  witnessWorkerSearchRequest,
  witnessWorkerSearchResponse,
  witnessWorkerValidationRequest,
  witnessWorkerValidationResponse,
  type WitnessWorkerJson,
} from './euclidean-necessary-witness-worker-fixtures.js';

describe('two-stage Euclidean necessary-witness Worker protocols', () => {
  it('canonicalizes input without producing or independently replaying a search', () => {
    const input = witnessWorkerInput();
    const parsed = parseEuclideanNecessaryWitnessSearchInputForWorkerV1(input);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(Object.isFrozen(parsed.value)).toBe(true);
    ((input.packingProblemInput as WitnessWorkerJson).candidateId as string) = 'changed';
    expect(parsed.value.packingProblemInput.candidateId).not.toBe('changed');
    expect(parsed.value.maxVisitedStates).toBe(100);
  });

  it('accepts closed request/relay envelopes for witness, domain, budget, and maximal 20-leaf inputs', () => {
    const cases = [
      witnessWorkerInput(100, 1, 0.5),
      witnessWorkerInput(100, 1, 2),
      witnessWorkerInput(1, 1, 2),
      witnessWorkerMaximalInput(),
    ];
    const statuses = ['witness-found', 'domain-exhausted', 'budget-exhausted', 'budget-exhausted'];
    for (let index = 0; index < cases.length; index += 1) {
      const input = cases[index];
      const candidate = witnessWorkerCandidate(input);
      expect(candidate.searchStatus).toBe(statuses[index]);
      expect(
        parseEuclideanNecessaryWitnessSearchWorkerRequestV1(
          witnessWorkerSearchRequest(`job:${String(index)}`, input),
        ).ok,
      ).toBe(true);
      const response = parseEuclideanNecessaryWitnessSearchWorkerResponseV1(
        witnessWorkerSearchResponse(`job:${String(index)}`, input, candidate),
      );
      expect(response.ok).toBe(true);
      const validation = parseEuclideanNecessaryWitnessValidationWorkerRequestV1(
        witnessWorkerValidationRequest(
          `job:${String(index)}`,
          `validation:${String(index)}`,
          input,
          candidate,
        ),
      );
      expect(validation.ok).toBe(true);
      if (index === 3) {
        expect(candidate.packingProblemReference.leafGridVertexVariables).toHaveLength(20);
        expect(candidate.packingProblemReference.separationConstraintInputs).toHaveLength(190);
        expect(candidate.maxWitnesses).toBe(8);
      }
    }
  });

  it('checks top-level and witness claim boundaries without treating a candidate as validated', () => {
    const candidate = structuredClone(witnessWorkerCandidate()) as unknown as WitnessWorkerJson;
    candidate.packingIncluded = true;
    expect(parseEuclideanNecessaryWitnessCandidateRelayV1(candidate).ok).toBe(false);

    const witnessCandidate = structuredClone(
      witnessWorkerCandidate(),
    ) as unknown as WitnessWorkerJson;
    const witness = (witnessCandidate.witnesses as WitnessWorkerJson[])[0];
    if (witness === undefined) throw new Error('fixture must contain a witness');
    witness.geometryEvidence = true;
    expect(parseEuclideanNecessaryWitnessCandidateRelayV1(witnessCandidate).ok).toBe(false);
  });

  it('rejects wrong IDs, source claims, outcomes, unknown fields, accessors, and oversize arrays', () => {
    const wrongId = witnessWorkerValidationRequest();
    wrongId.validationId = 'bad id';
    expect(parseEuclideanNecessaryWitnessValidationWorkerRequestV1(wrongId).ok).toBe(false);

    const claim = witnessWorkerValidationResponse();
    claim.globalM0fGo = true;
    expect(parseEuclideanNecessaryWitnessValidationWorkerResponseV1(claim).ok).toBe(false);

    const outcome = witnessWorkerSearchResponse() as WitnessWorkerJson;
    outcome.reason = 'verified';
    expect(parseEuclideanNecessaryWitnessSearchWorkerResponseV1(outcome).ok).toBe(false);

    const unknown = witnessWorkerSearchRequest() as WitnessWorkerJson;
    unknown.extra = true;
    expect(parseEuclideanNecessaryWitnessSearchWorkerRequestV1(unknown).ok).toBe(false);

    let getterCalls = 0;
    const accessor = witnessWorkerSearchRequest();
    Object.defineProperty(accessor, 'input', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return witnessWorkerInput();
      },
    });
    expect(parseEuclideanNecessaryWitnessSearchWorkerRequestV1(accessor).ok).toBe(false);
    expect(getterCalls).toBe(0);

    const oversize = witnessWorkerCandidate();
    const hostile = { ...oversize, witnesses: Array.from({ length: 191 }, () => null) };
    expect(parseEuclideanNecessaryWitnessCandidateRelayV1(hostile).ok).toBe(false);
  });

  it('caps hostile nested diagnostics at exactly the public protocol limits', () => {
    const candidate = structuredClone(witnessWorkerCandidate(witnessWorkerInput(200_000, 8)));
    expect(candidate.witnesses).toHaveLength(8);
    for (const witness of candidate.witnesses) {
      const pair = witness.pairEvaluations[0] as unknown as WitnessWorkerJson;
      for (let index = 0; index < 80; index += 1)
        pair[`unknown${String(index).padStart(2, '0')}`] = true;
    }
    const search = parseEuclideanNecessaryWitnessCandidateRelayV1(candidate);
    expect(search.ok).toBe(false);
    if (search.ok) return;
    expect(search.error).toHaveLength(
      EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_PROTOCOL_LIMITS.maxIssues,
    );

    const request = witnessWorkerValidationRequest(
      'job:cap',
      'validation:cap',
      witnessWorkerInput(200_000, 8),
      candidate,
    );
    const validation = parseEuclideanNecessaryWitnessValidationWorkerRequestV1(request);
    expect(validation.ok).toBe(false);
    if (validation.ok) return;
    expect(validation.error).toHaveLength(
      EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_PROTOCOL_LIMITS.maxIssues,
    );
  });
});
