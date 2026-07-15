import { describe, expect, it } from 'vitest';

import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_FAILURE_REASONS,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_MAX_JOB_ID_LENGTH,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_LIMITS,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_LIMITS,
  equalAffineOriginRotationSweptAabbCensusWorkerSourceV1,
  parseAffineOriginRotationSweptAabbCensusWorkerRequestV1,
  parseAffineOriginRotationSweptAabbCensusWorkerResponseV1,
} from '../../m0f/workers/affine-origin-rotation-swept-aabb-census-worker-protocol.js';
import {
  censusWorkerCompletedResponse,
  censusWorkerFailedResponse,
  censusWorkerInput,
  censusWorkerPrimitive,
  censusWorkerRequest,
  type MutableRecord,
} from './affine-origin-rotation-swept-aabb-census-worker-fixtures.js';

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

function expectInvalidRequest(value: unknown): void {
  const parsed = parseAffineOriginRotationSweptAabbCensusWorkerRequestV1(value);
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error('request fixture must fail');
  expect(parsed.error.length).toBeGreaterThan(0);
  expect(allFrozen(parsed)).toBe(true);
}

function expectInvalidResponse(value: unknown): void {
  const parsed = parseAffineOriginRotationSweptAabbCensusWorkerResponseV1(value);
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error('response fixture must fail');
  expect(parsed.error.length).toBeGreaterThan(0);
  expect(allFrozen(parsed)).toBe(true);
}

function resultOf(response: MutableRecord): MutableRecord {
  return response.result as MutableRecord;
}

function firstPair(response: MutableRecord): MutableRecord {
  const found = (resultOf(response).pairs as MutableRecord[])[0];
  if (found === undefined) throw new Error('fixture response must contain one pair');
  return found;
}

describe('affine-origin rotation swept-AABB census Worker protocol', () => {
  it('publishes frozen bounded clone ceilings and a closed failure vocabulary', () => {
    expect(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_FAILURE_REASONS).toEqual([
      'census-computation-rejected',
      'internal-error',
    ]);
    expect(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_LIMITS).toMatchObject({
      maxArrayLength: 64,
      maxBigIntBits: 16_384,
    });
    expect(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_LIMITS).toMatchObject({
      maxArrayLength: 2_016,
      maxBigIntBits: 131_072,
    });
    expect(allFrozen(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_LIMITS)).toBe(true);
    expect(allFrozen(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_LIMITS)).toBe(true);
  });

  it('structured-clones BigInt input, canonicalizes primitive order, and cuts aliases', () => {
    const input = censusWorkerInput([
      censusWorkerPrimitive('b', 10),
      censusWorkerPrimitive('a', 0),
    ]);
    const raw = censusWorkerRequest('job:bigint', 'source:bigint', input);
    const parsed = parseAffineOriginRotationSweptAabbCensusWorkerRequestV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('valid request must parse');
    expect(parsed.value.input.primitives.map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(parsed.value.input.slab.t1.numerator).toBe(1n);
    ((input.slab as MutableRecord).t1 as MutableRecord).numerator = 3n;
    raw.jobId = 'mutated';
    expect(parsed.value.jobId).toBe('job:bigint');
    expect(parsed.value.input.slab.t1.numerator).toBe(1n);
    expect(allFrozen(parsed)).toBe(true);
  });

  it('rejects open, malformed, claim-bearing, and non-ASCII-ID requests', () => {
    for (const value of [undefined, null, [], new Map(), 'request']) expectInvalidRequest(value);
    expectInvalidRequest({ ...censusWorkerRequest(), extra: true });
    expectInvalidRequest({ ...censusWorkerRequest(), recordType: 'other' });
    expectInvalidRequest({ ...censusWorkerRequest(), scientificClaim: true });
    expectInvalidRequest({ ...censusWorkerRequest(), sourceId: 'source with spaces' });
    expectInvalidRequest({ ...censusWorkerRequest(), jobId: '仕事' });
    expectInvalidRequest({
      ...censusWorkerRequest(),
      jobId: 'x'.repeat(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_MAX_JOB_ID_LENGTH + 1),
    });
  });

  it('rejects accessors and cycles without invoking caller code', () => {
    const accessor = censusWorkerRequest();
    let getterCalls = 0;
    Object.defineProperty(accessor, 'input', {
      enumerable: true,
      get(): unknown {
        getterCalls += 1;
        return censusWorkerInput();
      },
    });
    expectInvalidRequest(accessor);
    expect(getterCalls).toBe(0);

    const cyclic = censusWorkerRequest();
    cyclic.input = cyclic;
    expectInvalidRequest(cyclic);
  });

  it('never rereads already-inspected caller objects after a hostile Proxy mutation', () => {
    let getterCalls = 0;
    const victim = { safe: true };
    const mutator = new Proxy(
      { trigger: true },
      {
        getOwnPropertyDescriptor(target, key) {
          if (key === 'trigger') {
            Object.defineProperty(victim, 'safe', {
              configurable: true,
              enumerable: true,
              get(): boolean {
                getterCalls += 1;
                return true;
              },
            });
          }
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    const hostile = { victim, mutator, ...censusWorkerRequest() };

    expectInvalidRequest(hostile);
    expect(getterCalls).toBe(0);
  });

  it('rejects symbol-keyed hostile data without coercing a large Symbol description', () => {
    const hostile = censusWorkerRequest();
    Object.defineProperty(hostile, Symbol('x'.repeat(100_000)), {
      value: true,
      enumerable: true,
    });
    expectInvalidRequest(hostile);
  });

  it('accepts closed completed and failed responses while preserving every no-claim flag', () => {
    const completed = parseAffineOriginRotationSweptAabbCensusWorkerResponseV1(
      censusWorkerCompletedResponse('job:completed', 'source:completed'),
    );
    expect(completed.ok).toBe(true);
    if (!completed.ok || completed.value.outcome !== 'completed') {
      throw new Error('completion must parse');
    }
    expect(completed.value).toMatchObject({
      contractStatus: 'candidate-no-claim',
      broadPhaseOnly: true,
      continuousCollisionDetectionIncluded: false,
      collisionFreeClaim: false,
      selfIntersectionClassificationIncluded: false,
      verified: false,
      scientificClaim: false,
      globalM0fGo: false,
      outcome: 'completed',
    });
    expect(completed.value.result).toMatchObject({
      separatedPairCount: 1,
      scientificClaim: false,
      globalM0fGo: false,
    });
    expect(allFrozen(completed)).toBe(true);

    const failed = parseAffineOriginRotationSweptAabbCensusWorkerResponseV1(
      censusWorkerFailedResponse('job:failed', 'source:failed'),
    );
    expect(failed.ok && failed.value).toMatchObject({
      outcome: 'failed',
      reason: 'census-computation-rejected',
      result: null,
    });
  });

  it('accepts unsupported-family indeterminates and an explicit zero-pair census', () => {
    const unsupportedInput = censusWorkerInput(
      [censusWorkerPrimitive('a', 0), censusWorkerPrimitive('b', 10)],
      'unsupported-motion-v1',
    );
    const unsupported = parseAffineOriginRotationSweptAabbCensusWorkerResponseV1(
      censusWorkerCompletedResponse('job:unsupported', 'source:unsupported', unsupportedInput),
    );
    expect(unsupported.ok).toBe(true);
    if (!unsupported.ok || unsupported.value.outcome !== 'completed') {
      throw new Error('unsupported-family census must remain a completion');
    }
    expect(unsupported.value.result.pairs[0]).toMatchObject({
      status: 'indeterminate',
      reason: 'unsupported-motion-family',
      motionFamilySupported: false,
    });

    const emptyInput = censusWorkerInput([]);
    const empty = parseAffineOriginRotationSweptAabbCensusWorkerResponseV1(
      censusWorkerCompletedResponse('job:empty', 'source:empty', emptyInput),
    );
    expect(empty.ok).toBe(true);
    if (!empty.ok || empty.value.outcome !== 'completed')
      throw new Error('empty census must parse');
    expect(empty.value.result.unorderedPairCount).toBe(0);
    expect(Object.is(empty.value.result.unorderedPairCount, -0)).toBe(false);
  });

  it('never promotes an unsupported motion family to a forged determinate pair', () => {
    const unsupportedInput = censusWorkerInput(
      [censusWorkerPrimitive('a', 0), censusWorkerPrimitive('b', 10)],
      'unsupported-motion-v1',
    );
    const forged = structuredClone(
      censusWorkerCompletedResponse(
        'job:unsupported-forgery',
        'source:unsupported',
        unsupportedInput,
      ),
    );
    const supported = censusWorkerCompletedResponse('job:supported', 'source:supported');
    (resultOf(forged).pairs as unknown[])[0] = structuredClone(firstPair(supported));
    resultOf(forged).separatedPairCount = 1;
    resultOf(forged).indeterminatePairCount = 0;
    expectInvalidResponse(forged);
  });

  it('binds response source identity with exact BigInt structural equality', () => {
    const first = parseAffineOriginRotationSweptAabbCensusWorkerRequestV1(
      censusWorkerRequest('job:first', 'source:same'),
    );
    const second = parseAffineOriginRotationSweptAabbCensusWorkerRequestV1(
      censusWorkerRequest('job:second', 'source:same'),
    );
    const changed = parseAffineOriginRotationSweptAabbCensusWorkerRequestV1(
      censusWorkerRequest(
        'job:third',
        'source:same',
        censusWorkerInput([censusWorkerPrimitive('a', 0), censusWorkerPrimitive('b', 11)]),
      ),
    );
    if (!first.ok || !second.ok || !changed.ok) throw new Error('source fixtures must parse');
    expect(
      equalAffineOriginRotationSweptAabbCensusWorkerSourceV1(
        { sourceId: first.value.sourceId, input: first.value.input },
        { sourceId: second.value.sourceId, input: second.value.input },
      ),
    ).toBe(true);
    expect(
      equalAffineOriginRotationSweptAabbCensusWorkerSourceV1(
        { sourceId: first.value.sourceId, input: first.value.input },
        { sourceId: changed.value.sourceId, input: changed.value.input },
      ),
    ).toBe(false);
  });

  it('rejects source-unbound bounds and candidate-to-false-separated forgery', () => {
    const unbound = structuredClone(censusWorkerCompletedResponse('job:unbound', 'source:unbound'));
    const pair = firstPair(unbound);
    const secondBound = (pair.primitiveBounds as MutableRecord[])[1];
    if (secondBound === undefined) throw new Error('fixture pair must contain its second bound');
    const x = (secondBound.aabb as MutableRecord).x as MutableRecord;
    for (const endpoint of ['min', 'max']) {
      const rational = x[endpoint] as MutableRecord;
      rational.numerator = (rational.numerator as bigint) + 100n * (rational.denominator as bigint);
    }
    const gap = (pair.certificate as MutableRecord).strictGap as MutableRecord;
    gap.numerator = (gap.numerator as bigint) + 100n * (gap.denominator as bigint);
    expectInvalidResponse(unbound);

    const candidateInput = censusWorkerInput([
      censusWorkerPrimitive('a', 0),
      censusWorkerPrimitive('b', 1),
    ]);
    const forged = structuredClone(
      censusWorkerCompletedResponse('job:forged', 'source:forged', candidateInput),
    );
    const separated = censusWorkerCompletedResponse('job:other', 'source:other');
    (resultOf(forged).pairs as unknown[])[0] = structuredClone(firstPair(separated));
    resultOf(forged).separatedPairCount = 1;
    resultOf(forged).candidatePairCount = 0;
    expectInvalidResponse(forged);
  });

  it('requires the producer first-axis certificate and rejects a later separating axis', () => {
    const input = censusWorkerInput([
      censusWorkerPrimitive('a', 0, 0),
      censusWorkerPrimitive('b', 10, 10),
    ]);
    const laterAxis = structuredClone(
      censusWorkerCompletedResponse('job:later-axis', 'source:later-axis', input),
    );
    const certificate = firstPair(laterAxis).certificate as MutableRecord;
    expect(certificate.axis).toBe('x');
    certificate.axis = 'y';
    expectInvalidResponse(laterAxis);
  });

  it('rejects claim tampering, inconsistent terminal states, unknown fields, and oversized data', () => {
    const claim = censusWorkerCompletedResponse('job:claim');
    claim.collisionFreeClaim = true;
    expectInvalidResponse(claim);

    const resultClaim = structuredClone(censusWorkerCompletedResponse('job:result-claim'));
    resultOf(resultClaim).scientificClaim = true;
    expectInvalidResponse(resultClaim);

    const malformedSlab = structuredClone(censusWorkerCompletedResponse('job:malformed-slab'));
    resultOf(malformedSlab).slab = {};
    expectInvalidResponse(malformedSlab);
    expectInvalidResponse({ ...censusWorkerFailedResponse(), reason: 'no-collision' });
    expectInvalidResponse({ ...censusWorkerFailedResponse(), outcome: 'completed' });
    expectInvalidResponse({ ...censusWorkerFailedResponse(), extra: true });

    const oversized = censusWorkerFailedResponse();
    (oversized.sourceInput as MutableRecord).primitives = Array.from({ length: 2_017 }, () => ({}));
    expectInvalidResponse(oversized);
  });
});
