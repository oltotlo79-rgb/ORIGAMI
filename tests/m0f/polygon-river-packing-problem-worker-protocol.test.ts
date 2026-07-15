import { describe, expect, it } from 'vitest';

import {
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_FAILURE_REASONS,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_MAX_JOB_ID_LENGTH,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_LIMITS,
  parseCandidatePolygonRiverPackingProblemWorkerRequestV1,
  parseCandidatePolygonRiverPackingProblemWorkerResponseV1,
} from '../../m0f/workers/polygon-river-packing-problem-protocol.js';
import {
  packingWorkerCompletedResponse,
  packingWorkerDefaultSource,
  packingWorkerFailedResponse,
  packingWorkerInput,
  packingWorkerMaximalSource,
  packingWorkerRequest,
  type JsonRecord,
} from './polygon-river-packing-problem-worker-fixtures.js';

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

function expectInvalidRequest(value: unknown): void {
  const parsed = parseCandidatePolygonRiverPackingProblemWorkerRequestV1(value);
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error('request fixture must fail');
  expect(parsed.error.length).toBeGreaterThan(0);
  expect(allFrozen(parsed)).toBe(true);
}

function expectInvalidResponse(value: unknown): void {
  const parsed = parseCandidatePolygonRiverPackingProblemWorkerResponseV1(value);
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error('response fixture must fail');
  expect(parsed.error.length).toBeGreaterThan(0);
  expect(allFrozen(parsed)).toBe(true);
}

describe('polygon/river packing-problem Worker protocol', () => {
  it('publishes the closed failure vocabulary and measured response ceilings', () => {
    expect(POLYGON_RIVER_PACKING_PROBLEM_WORKER_FAILURE_REASONS).toEqual([
      'packing-problem-build-failed',
      'internal-error',
    ]);
    expect(POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_LIMITS).toEqual({
      maxArrayLength: 190,
      maxContainerCount: 2048,
      maxDepth: 12,
      maxObjectPropertyCount: 64,
      maxPropertyNameCodeUnits: 64,
      maxStringCodeUnits: 8192,
      maxTotalStringCodeUnits: 4194304,
      maxTotalPropertyCount: 8192,
    });
    expect(allFrozen(POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_LIMITS)).toBe(true);
  });

  it('canonicalizes and deeply freezes a bounded request while cutting aliases', () => {
    const input = packingWorkerInput();
    const raw = packingWorkerRequest('packing-job:canonical', input);
    const parsed = parseCandidatePolygonRiverPackingProblemWorkerRequestV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('valid request must parse');
    expect(parsed.value).toMatchObject({
      operation: 'build-polygon-river-packing-problem',
      contractStatus: 'candidate',
      scientificClaim: false,
      jobId: 'packing-job:canonical',
    });
    const source = input.source as JsonRecord;
    source.maxColumns = 1;
    raw.jobId = 'mutated';
    expect(parsed.value.jobId).toBe('packing-job:canonical');
    expect(parsed.value.input.source.maxColumns).toBe(12);
    expect(allFrozen(parsed)).toBe(true);
  });

  it('rejects non-objects, missing fields, extras, wrong literals, claims, and job IDs', () => {
    for (const value of [undefined, null, [], new Map(), 'request']) expectInvalidRequest(value);

    const missing = packingWorkerRequest();
    delete missing.input;
    expectInvalidRequest(missing);
    expectInvalidRequest({ ...packingWorkerRequest(), extra: true });
    expectInvalidRequest({ ...packingWorkerRequest(), operation: 'solve-packing' });
    expectInvalidRequest({ ...packingWorkerRequest(), contractStatus: 'verified' });
    expectInvalidRequest({ ...packingWorkerRequest(), scientificClaim: true });
    expectInvalidRequest({ ...packingWorkerRequest(), jobId: '' });
    expectInvalidRequest({ ...packingWorkerRequest(), jobId: 'bad job' });
    expectInvalidRequest({
      ...packingWorkerRequest(),
      jobId: 'x'.repeat(POLYGON_RIVER_PACKING_PROBLEM_WORKER_MAX_JOB_ID_LENGTH + 1),
    });
  });

  it('rejects hostile request snapshots without invoking accessors', () => {
    const accessor = packingWorkerRequest();
    let getterCalls = 0;
    Object.defineProperty(accessor, 'input', {
      enumerable: true,
      get(): unknown {
        getterCalls += 1;
        return packingWorkerInput();
      },
    });
    expectInvalidRequest(accessor);
    expect(getterCalls).toBe(0);

    const cyclic = packingWorkerRequest();
    cyclic.cycle = cyclic;
    expectInvalidRequest(cyclic);
  });

  it('independently validates completed responses and canonical failure echoes', () => {
    const completed = parseCandidatePolygonRiverPackingProblemWorkerResponseV1(
      packingWorkerCompletedResponse('packing-job:completed'),
    );
    expect(completed.ok).toBe(true);
    if (!completed.ok || completed.value.outcome !== 'completed') {
      throw new Error('valid completion must parse');
    }
    expect(completed.value.result).toMatchObject({
      metric: 'unresolved',
      constraintEvaluable: false,
      packingIncluded: false,
      globalM0fGo: false,
    });
    expect(allFrozen(completed)).toBe(true);

    const unknownInput = packingWorkerInput(
      packingWorkerDefaultSource(),
      'square-grid:not-present',
    );
    const failed = parseCandidatePolygonRiverPackingProblemWorkerResponseV1(
      packingWorkerFailedResponse('packing-job:failed', unknownInput),
    );
    expect(failed.ok).toBe(true);
    expect(failed.ok && failed.value).toMatchObject({
      outcome: 'failed',
      reason: 'packing-problem-build-failed',
      sourceInput: { candidateId: 'square-grid:not-present' },
      result: null,
    });
    expect(JSON.stringify(failed)).not.toMatch(/no[- ]solution|infeasible/i);
  });

  it('rejects stale source/candidate bindings and result claim tampering', () => {
    const staleCandidate = packingWorkerCompletedResponse('packing-job:stale-candidate');
    (staleCandidate.sourceInput as JsonRecord).candidateId = 'square-grid:not-present';
    expectInvalidResponse(staleCandidate);

    const staleSource = packingWorkerCompletedResponse('packing-job:stale-source');
    ((staleSource.sourceInput as JsonRecord).source as JsonRecord).maxColumns = 1;
    expectInvalidResponse(staleSource);

    const claim = packingWorkerCompletedResponse('packing-job:claim');
    (claim.result as JsonRecord).packingIncluded = true;
    expectInvalidResponse(claim);

    const extra = packingWorkerCompletedResponse('packing-job:extra');
    (extra.result as JsonRecord).selected = true;
    expectInvalidResponse(extra);
  });

  it('rejects malformed, oversized, accessor-backed, and inconsistent responses', () => {
    for (const value of [undefined, null, [], 'response']) expectInvalidResponse(value);
    expectInvalidResponse({ ...packingWorkerFailedResponse(), extra: true });
    expectInvalidResponse({ ...packingWorkerFailedResponse(), operation: 'solve-packing' });
    expectInvalidResponse({ ...packingWorkerFailedResponse(), outcome: 'completed' });
    expectInvalidResponse({ ...packingWorkerFailedResponse(), reason: 'no-solution' });

    const oversized = packingWorkerCompletedResponse('packing-job:oversized');
    (oversized.result as JsonRecord).separationConstraintInputs = Array.from(
      { length: 191 },
      () => ({}),
    );
    expectInvalidResponse(oversized);

    const accessor = packingWorkerCompletedResponse('packing-job:accessor');
    let getterCalls = 0;
    Object.defineProperty(accessor, 'result', {
      enumerable: true,
      get(): unknown {
        getterCalls += 1;
        return {};
      },
    });
    expectInvalidResponse(accessor);
    expect(getterCalls).toBe(0);
  });

  it('accepts the simultaneous 39-edge, 20-leaf, 190-pair response with its source echo', () => {
    const input = packingWorkerInput(packingWorkerMaximalSource());
    const raw = packingWorkerCompletedResponse('packing-job:maximal', input);
    expect(JSON.stringify(raw).length).toBeGreaterThan(90_000);
    const parsed = parseCandidatePolygonRiverPackingProblemWorkerResponseV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || parsed.value.outcome !== 'completed') {
      throw new Error('maximal response must fit the Worker response budget');
    }
    expect(parsed.value.result.sourceBinding).toMatchObject({
      treeEdgeCount: 39,
      leafCount: 20,
      leafPairCount: 190,
    });
  });
});
