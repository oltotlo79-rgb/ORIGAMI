import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
  enumerateSquareGridCandidatesV1,
  type SquareGridCandidateResultV1,
} from '../../m0f/box-pleating/square-grid-candidates.js';
import { executeSquareGridQuantizationWorkerMessageV1 } from '../../m0f/workers/square-grid-quantization-worker-handler.js';
import {
  SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
  SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
  SQUARE_GRID_QUANTIZATION_WORKER_REQUEST_MESSAGE_TYPE,
  SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
} from '../../m0f/workers/square-grid-quantization-protocol.js';

function input(empty = false): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: { width: empty ? 1 : 1.5, height: 1 },
    maxColumns: empty ? 1 : 8,
    maxRows: empty ? 1 : 8,
    relativeErrorLimit: empty ? 0 : 0.01,
    branches: [
      {
        id: 'branch-a',
        branchClass: empty ? 'terminal' : 'internal',
        length: empty ? 0.3 : 0.75,
        width: empty ? 0 : 0.25,
      },
    ],
  };
}

function request(jobId = 'grid-job:1', requestInput: unknown = input()): Record<string, unknown> {
  return {
    schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: SQUARE_GRID_QUANTIZATION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    input: requestInput,
  };
}

describe('square-grid quantization Worker handler', () => {
  it('returns an owned candidate completion from an owned frozen input', () => {
    let executorInput: unknown;
    const response = executeSquareGridQuantizationWorkerMessageV1(request(), (ownedInput) => {
      executorInput = ownedInput;
      expect(Object.isFrozen(ownedInput)).toBe(true);
      expect(Object.isFrozen(ownedInput.branches)).toBe(true);
      return enumerateSquareGridCandidatesV1(ownedInput);
    });
    expect(executorInput).toBeDefined();
    expect(response).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      jobId: 'grid-job:1',
      outcome: 'completed',
      reason: null,
      result: {
        scope: 'square-grid-quantization-only',
        placementIncluded: false,
        pleatRoutingIncluded: false,
      },
    });
    expect(Object.isFrozen(response)).toBe(true);
    expect(Object.isFrozen(response?.result)).toBe(true);
  });

  it('returns completed with an empty candidate set', () => {
    const response = executeSquareGridQuantizationWorkerMessageV1(
      request('grid-job:empty', input(true)),
    );
    expect(response).toMatchObject({
      jobId: 'grid-job:empty',
      outcome: 'completed',
      reason: null,
      result: { candidates: [] },
    });
  });

  it('rejects an empty result produced from different source branches', () => {
    const requested = input();
    requested.relativeErrorLimit = 0;
    requested.branches = [{ id: 'branch-a', branchClass: 'terminal', length: 0.75, width: 0 }];
    const other = structuredClone(requested);
    const otherBranch = (other.branches as { length: number }[])[0];
    if (otherBranch === undefined) throw new Error('source-binding branch fixture is missing');
    otherBranch.length = 0.7;

    const requestedEnumeration = enumerateSquareGridCandidatesV1(requested);
    const otherEnumeration = enumerateSquareGridCandidatesV1(other);
    if (!requestedEnumeration.ok || !otherEnumeration.ok) {
      throw new Error('source-binding fixtures must enumerate');
    }
    expect(requestedEnumeration.value.candidates.length).toBeGreaterThan(0);
    expect(otherEnumeration.value.candidates).toEqual([]);

    expect(
      executeSquareGridQuantizationWorkerMessageV1(
        request('grid-job:empty-source-mismatch', requested),
        () => otherEnumeration,
      ),
    ).toMatchObject({ outcome: 'failed', reason: 'internal-error' });
  });

  it('ignores invalid requests and never reflects their untrusted job ID', () => {
    const executor = vi.fn();
    expect(
      executeSquareGridQuantizationWorkerMessageV1({ jobId: 'forged-secret' }, executor),
    ).toBeUndefined();
    expect(executor).not.toHaveBeenCalled();

    let calls = 0;
    const accessor = request('forged-secret');
    Object.defineProperty(accessor, 'input', {
      enumerable: true,
      get(): unknown {
        calls += 1;
        return input();
      },
    });
    expect(executeSquareGridQuantizationWorkerMessageV1(accessor, executor)).toBeUndefined();
    expect(calls).toBe(0);
    expect(executor).not.toHaveBeenCalled();
  });

  it('maps executor rejection and exception to fixed reasons without host text', () => {
    const rejected = executeSquareGridQuantizationWorkerMessageV1(
      request('grid-job:reject'),
      () => ({
        ok: false,
        error: [],
      }),
    );
    expect(rejected).toMatchObject({
      jobId: 'grid-job:reject',
      outcome: 'failed',
      reason: 'quantization-failed',
      result: null,
    });

    const failed = executeSquareGridQuantizationWorkerMessageV1(request('grid-job:error'), () => {
      throw new Error('SECRET_HOST_PATH');
    });
    expect(failed).toMatchObject({
      jobId: 'grid-job:error',
      outcome: 'failed',
      reason: 'internal-error',
      result: null,
    });
    expect(JSON.stringify(failed)).not.toContain('SECRET');
  });

  it('rejects a forged successful result and cuts executor result aliases', () => {
    const enumerated = enumerateSquareGridCandidatesV1(input());
    if (!enumerated.ok) throw new Error('fixture should enumerate');
    const mutable = structuredClone(enumerated.value) as SquareGridCandidateResultV1 & {
      selected?: boolean;
    };
    mutable.selected = true;
    expect(
      executeSquareGridQuantizationWorkerMessageV1(request('grid-job:forged'), () => ({
        ok: true,
        value: mutable,
      })),
    ).toMatchObject({ outcome: 'failed', reason: 'internal-error' });

    delete mutable.selected;
    const response = executeSquareGridQuantizationWorkerMessageV1(
      request('grid-job:alias'),
      () => ({ ok: true, value: mutable }),
    );
    expect(response?.outcome).toBe('completed');
    const first = mutable.candidates[0] as { columns: number } | undefined;
    if (first !== undefined) first.columns = 999;
    expect(response?.result?.candidates[0]?.columns).not.toBe(999);
  });
});

describe('square-grid quantization dedicated Worker entry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('consumes exactly one message and never executes a second job', async () => {
    let listener: ((event: Readonly<{ data: unknown }>) => void) | undefined;
    const posted: unknown[] = [];
    vi.stubGlobal(
      'addEventListener',
      (type: string, registered: (event: Readonly<{ data: unknown }>) => void): void => {
        expect(type).toBe('message');
        listener = registered;
      },
    );
    vi.stubGlobal('postMessage', (message: unknown): void => {
      posted.push(message);
    });

    await import('../../m0f/workers/square-grid-quantization.worker.js');
    if (listener === undefined) throw new Error('worker listener was not installed');
    listener({ data: request('grid-job:first') });
    listener({ data: request('grid-job:second') });

    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({ jobId: 'grid-job:first', outcome: 'completed' });
  });
});
