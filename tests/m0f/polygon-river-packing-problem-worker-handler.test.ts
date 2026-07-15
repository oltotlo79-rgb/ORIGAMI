import { describe, expect, it, vi } from 'vitest';

import {
  buildPolygonRiverPackingProblemV1,
  type PolygonRiverPackingProblemBuildResult,
  type PolygonRiverPackingProblemResultV1,
} from '../../m0f/box-pleating/polygon-river-packing-problem.js';
import { executePolygonRiverPackingProblemWorkerMessageV1 } from '../../m0f/workers/polygon-river-packing-problem-worker-handler.js';
import {
  packingWorkerInput,
  packingWorkerRequest,
} from './polygon-river-packing-problem-worker-fixtures.js';

describe('polygon/river packing-problem Worker handler', () => {
  it('ignores an invalid envelope without invoking the injected builder', () => {
    const builder = vi.fn<() => PolygonRiverPackingProblemBuildResult>();
    expect(executePolygonRiverPackingProblemWorkerMessageV1(undefined, builder)).toBeUndefined();
    expect(
      executePolygonRiverPackingProblemWorkerMessageV1(
        { ...packingWorkerRequest(), extra: true },
        builder,
      ),
    ).toBeUndefined();
    expect(builder).not.toHaveBeenCalled();
  });

  it('invokes the builder exactly once with the canonical closed input', () => {
    const rawInput = packingWorkerInput();
    const builder = vi.fn((input: Parameters<typeof buildPolygonRiverPackingProblemV1>[0]) =>
      buildPolygonRiverPackingProblemV1(input),
    );
    const response = executePolygonRiverPackingProblemWorkerMessageV1(
      packingWorkerRequest('packing-job:success', rawInput),
      builder,
    );
    expect(builder).toHaveBeenCalledTimes(1);
    expect(builder.mock.calls[0]?.[0]).not.toBe(rawInput);
    expect(response).toMatchObject({
      operation: 'build-polygon-river-packing-problem',
      jobId: 'packing-job:success',
      outcome: 'completed',
      reason: null,
      result: {
        metric: 'unresolved',
        assignmentIncluded: false,
        packingIncluded: false,
        globalM0fGo: false,
      },
    });
    expect(Object.isFrozen(response)).toBe(true);
    expect(Object.isFrozen(response?.sourceInput)).toBe(true);
    expect(Object.isFrozen(response?.result)).toBe(true);
  });

  it('maps an ordinary build rejection to a fixed failure without solution semantics', () => {
    const response = executePolygonRiverPackingProblemWorkerMessageV1(
      packingWorkerRequest('packing-job:rejected'),
      () => ({
        ok: false,
        error: [
          {
            stage: 'path-demand',
            path: '$.candidateId',
            code: 'candidate-not-found',
            message: 'SECRET_DETAIL',
          },
        ],
      }),
    );
    expect(response).toMatchObject({
      jobId: 'packing-job:rejected',
      outcome: 'failed',
      reason: 'packing-problem-build-failed',
      result: null,
    });
    expect(JSON.stringify(response)).not.toContain('SECRET');
    expect(JSON.stringify(response)).not.toMatch(/no[- ]solution|infeasible/i);
  });

  it('maps builder exceptions to internal-error without leaking host details', () => {
    const response = executePolygonRiverPackingProblemWorkerMessageV1(
      packingWorkerRequest('packing-job:throw'),
      () => {
        throw new Error('SECRET_HOST_PATH');
      },
    );
    expect(response).toMatchObject({
      jobId: 'packing-job:throw',
      outcome: 'failed',
      reason: 'internal-error',
      result: null,
    });
    expect(JSON.stringify(response)).not.toContain('SECRET');
  });

  it('rejects forged builder success and cuts successful result aliases', () => {
    const input = packingWorkerInput();
    const built = buildPolygonRiverPackingProblemV1(input);
    if (!built.ok) throw new Error('handler fixture must build');
    const mutable = structuredClone(built.value) as PolygonRiverPackingProblemResultV1 & {
      selected?: boolean;
    };
    mutable.selected = true;
    expect(
      executePolygonRiverPackingProblemWorkerMessageV1(
        packingWorkerRequest('packing-job:forged', input),
        () => ({ ok: true, value: mutable }),
      ),
    ).toMatchObject({ outcome: 'failed', reason: 'internal-error' });

    delete mutable.selected;
    const response = executePolygonRiverPackingProblemWorkerMessageV1(
      packingWorkerRequest('packing-job:alias', input),
      () => ({ ok: true, value: mutable }),
    );
    expect(response?.outcome).toBe('completed');
    (mutable.activeGridDomain as { columns: number }).columns = 1;
    expect(response?.result?.activeGridDomain.columns).not.toBe(1);
  });
});
