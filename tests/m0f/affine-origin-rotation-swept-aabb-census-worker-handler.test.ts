import { describe, expect, it, vi } from 'vitest';

import { computeAffineOriginRotationSweptAabbCensusV1 } from '../../m0f/geometry/affine-origin-rotation-swept-aabb-census.js';
import {
  createAffineOriginRotationSweptAabbCensusWorkerMessageHandlerV1,
  executeAffineOriginRotationSweptAabbCensusWorkerMessageV1,
  type AffineOriginRotationSweptAabbCensusWorkerComputerV1,
} from '../../m0f/workers/affine-origin-rotation-swept-aabb-census-worker-handler.js';
import {
  censusWorkerInput,
  censusWorkerRequest,
  type MutableRecord,
} from './affine-origin-rotation-swept-aabb-census-worker-fixtures.js';

describe('affine-origin rotation swept-AABB census Worker handler', () => {
  it('ignores an invalid envelope without invoking the computer', () => {
    const computer = vi.fn<AffineOriginRotationSweptAabbCensusWorkerComputerV1>();
    expect(executeAffineOriginRotationSweptAabbCensusWorkerMessageV1(undefined, computer)).toBe(
      undefined,
    );
    expect(
      executeAffineOriginRotationSweptAabbCensusWorkerMessageV1(
        { ...censusWorkerRequest(), extra: true },
        computer,
      ),
    ).toBeUndefined();
    expect(computer).not.toHaveBeenCalled();
  });

  it('computes exactly once with canonical BigInt input and returns a closed completion', () => {
    const input = censusWorkerInput();
    const computer = vi.fn(
      (canonical: Parameters<AffineOriginRotationSweptAabbCensusWorkerComputerV1>[0]) =>
        computeAffineOriginRotationSweptAabbCensusV1(canonical),
    );
    const response = executeAffineOriginRotationSweptAabbCensusWorkerMessageV1(
      censusWorkerRequest('job:success', 'source:success', input),
      computer,
    );
    expect(computer).toHaveBeenCalledTimes(1);
    expect(computer.mock.calls[0]?.[0]).not.toBe(input);
    expect(computer.mock.calls[0]?.[0].slab.t1.numerator).toBe(1n);
    expect(response).toMatchObject({
      sourceId: 'source:success',
      jobId: 'job:success',
      outcome: 'completed',
      reason: null,
      broadPhaseOnly: true,
      continuousCollisionDetectionIncluded: false,
      collisionFreeClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
      result: { separatedPairCount: 1, scientificClaim: false, globalM0fGo: false },
    });
    expect(Object.isFrozen(response)).toBe(true);
    expect(Object.isFrozen(response?.sourceInput)).toBe(true);
    expect(Object.isFrozen(response?.result)).toBe(true);
  });

  it('maps computation rejection and exceptions to fixed non-leaking failures', () => {
    const rejected = executeAffineOriginRotationSweptAabbCensusWorkerMessageV1(
      censusWorkerRequest('job:rejected'),
      () => ({ ok: false, error: [] }),
    );
    expect(rejected).toMatchObject({
      outcome: 'failed',
      reason: 'census-computation-rejected',
      result: null,
    });

    const thrown = executeAffineOriginRotationSweptAabbCensusWorkerMessageV1(
      censusWorkerRequest('job:throw'),
      () => {
        throw new Error('SECRET_HOST_PATH');
      },
    );
    expect(thrown).toMatchObject({ outcome: 'failed', reason: 'internal-error', result: null });
    expect(thrown?.reason).not.toContain('SECRET');
  });

  it('rejects forged successful output and cuts valid result aliases', () => {
    const computed = computeAffineOriginRotationSweptAabbCensusV1(censusWorkerInput());
    if (!computed.ok) throw new Error('fixture census must compute');
    const mutable = structuredClone(computed.value);
    (mutable as unknown as MutableRecord).scientificClaim = true;
    const forged = executeAffineOriginRotationSweptAabbCensusWorkerMessageV1(
      censusWorkerRequest('job:forged'),
      () => ({ ok: true, value: mutable }),
    );
    expect(forged).toMatchObject({ outcome: 'failed', reason: 'internal-error' });

    (mutable as unknown as MutableRecord).scientificClaim = false;
    const accepted = executeAffineOriginRotationSweptAabbCensusWorkerMessageV1(
      censusWorkerRequest('job:alias'),
      () => ({ ok: true, value: mutable }),
    );
    expect(accepted?.outcome).toBe('completed');
    (mutable as unknown as MutableRecord).separatedPairCount = 0;
    expect(accepted?.result?.separatedPairCount).toBe(1);
  });

  it('one-shot handler consumes exactly one job and posts at most one closed response', () => {
    const posted: unknown[] = [];
    const computer = vi.fn(
      (canonical: Parameters<AffineOriginRotationSweptAabbCensusWorkerComputerV1>[0]) =>
        computeAffineOriginRotationSweptAabbCensusV1(canonical),
    );
    const handler = createAffineOriginRotationSweptAabbCensusWorkerMessageHandlerV1(
      (response) => posted.push(response),
      computer,
    );
    handler({ data: censusWorkerRequest('job:first') });
    handler({ data: censusWorkerRequest('job:second') });
    expect(computer).toHaveBeenCalledTimes(1);
    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({ jobId: 'job:first', outcome: 'completed' });

    const latePosts: unknown[] = [];
    const invalidFirst = createAffineOriginRotationSweptAabbCensusWorkerMessageHandlerV1(
      (response) => latePosts.push(response),
      computer,
    );
    invalidFirst({ data: { jobId: 'untrusted' } });
    invalidFirst({ data: censusWorkerRequest('job:late') });
    expect(latePosts).toEqual([]);
    expect(computer).toHaveBeenCalledTimes(1);
  });
});
