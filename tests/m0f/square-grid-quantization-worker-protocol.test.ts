import { describe, expect, it } from 'vitest';

import {
  SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
  enumerateSquareGridCandidatesV1,
} from '../../m0f/box-pleating/square-grid-candidates.js';
import {
  SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
  SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
  SQUARE_GRID_QUANTIZATION_WORKER_REQUEST_MESSAGE_TYPE,
  SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
  SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
  parseCandidateSquareGridQuantizationWorkerRequestV1,
  parseCandidateSquareGridQuantizationWorkerResponseV1,
} from '../../m0f/workers/square-grid-quantization-protocol.js';

function input(relativeErrorLimit = 0.01): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: { width: 1.5, height: 1 },
    maxColumns: 8,
    maxRows: 8,
    relativeErrorLimit,
    branches: [
      { id: 'terminal-z', branchClass: 'terminal', length: 0.5, width: 0 },
      { id: 'internal-a', branchClass: 'internal', length: 0.75, width: 0.25 },
    ],
  };
}

function emptyInput(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: { width: 1, height: 1 },
    maxColumns: 1,
    maxRows: 1,
    relativeErrorLimit: 0,
    branches: [{ id: 'branch-a', branchClass: 'terminal', length: 0.3, width: 0 }],
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

function result(requestInput: unknown = input()): Record<string, unknown> {
  const enumerated = enumerateSquareGridCandidatesV1(requestInput);
  if (!enumerated.ok) throw new Error('test input did not enumerate');
  return structuredClone(enumerated.value) as unknown as Record<string, unknown>;
}

function completedResponse(
  jobId = 'grid-job:1',
  completedResult: unknown = result(),
  sourceInput: unknown = input(),
): Record<string, unknown> {
  return {
    schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    sourceInput,
    outcome: 'completed',
    reason: null,
    result: completedResult,
  };
}

describe('square-grid quantization Worker protocol', () => {
  it('parses an owned, closed candidate request and canonicalizes branch order', () => {
    const raw = request();
    const parsed = parseCandidateSquareGridQuantizationWorkerRequestV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('request should parse');
    expect(parsed.value.input.branches.map((branch) => branch.id)).toEqual([
      'internal-a',
      'terminal-z',
    ]);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.input)).toBe(true);
    expect(Object.isFrozen(parsed.value.input.branches)).toBe(true);

    (raw.input as { paper: { width: number } }).paper.width = 999;
    expect(parsed.value.input.paper.width).toBe(1.5);
  });

  it('rejects undeclared fields and forbidden claim vocabulary', () => {
    const withExtra = request();
    withExtra.selected = true;
    const extraParsed = parseCandidateSquareGridQuantizationWorkerRequestV1(withExtra);
    expect(extraParsed.ok).toBe(false);
    if (extraParsed.ok) throw new Error('extra field should fail');
    expect(extraParsed.error.some((issue) => issue.code === 'unknown-field')).toBe(true);

    const claimed = request();
    claimed.contractStatus = 'verified';
    claimed.scientificClaim = true;
    const claimParsed = parseCandidateSquareGridQuantizationWorkerRequestV1(claimed);
    expect(claimParsed.ok).toBe(false);
    if (claimParsed.ok) throw new Error('claim vocabulary should fail');
    expect(claimParsed.error.some((issue) => issue.code === 'claim-boundary')).toBe(true);
  });

  it('rejects source accessors without executing them', () => {
    let calls = 0;
    const raw = request();
    Object.defineProperty(raw, 'input', {
      enumerable: true,
      get(): unknown {
        calls += 1;
        return input();
      },
    });
    expect(parseCandidateSquareGridQuantizationWorkerRequestV1(raw).ok).toBe(false);
    expect(calls).toBe(0);

    const rawResponse = completedResponse();
    const candidateResult = rawResponse.result as Record<string, unknown>;
    Object.defineProperty(candidateResult, 'candidates', {
      enumerable: true,
      get(): unknown[] {
        calls += 1;
        return [];
      },
    });
    expect(parseCandidateSquareGridQuantizationWorkerResponseV1(rawResponse).ok).toBe(false);
    expect(calls).toBe(0);
  });

  it('accepts only integrity-validated completed results and cuts aliases', () => {
    const raw = completedResponse();
    const parsed = parseCandidateSquareGridQuantizationWorkerResponseV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || parsed.value.outcome !== 'completed') {
      throw new Error('completion should parse');
    }
    expect(parsed.value.result.scope).toBe('square-grid-quantization-only');
    expect(parsed.value.sourceInput.paper).toEqual({ width: 1.5, height: 1 });
    expect(parsed.value.result.placementIncluded).toBe(false);
    expect(parsed.value.result.pleatRoutingIncluded).toBe(false);
    expect(Object.isFrozen(parsed.value.result)).toBe(true);
    expect(Object.isFrozen(parsed.value.result.candidates)).toBe(true);

    const rawResult = raw.result as { candidates: { columns: number }[] };
    if (rawResult.candidates[0] !== undefined) rawResult.candidates[0].columns = 999;
    expect(parsed.value.result.candidates[0]?.columns).not.toBe(999);

    const forged = completedResponse();
    (forged.result as Record<string, unknown>).supported = true;
    const forgedParsed = parseCandidateSquareGridQuantizationWorkerResponseV1(forged);
    expect(forgedParsed.ok).toBe(false);
    if (forgedParsed.ok) throw new Error('forged result should fail');
    expect(forgedParsed.error.some((issue) => issue.stage === 'result')).toBe(true);
  });

  it('treats an empty candidate set as a valid completion, not a no-solution failure', () => {
    const emptyResult = result(emptyInput());
    expect(emptyResult.candidates).toEqual([]);
    const parsed = parseCandidateSquareGridQuantizationWorkerResponseV1(
      completedResponse('grid-job:empty', emptyResult, emptyInput()),
    );
    expect(parsed).toMatchObject({
      ok: true,
      value: {
        jobId: 'grid-job:empty',
        outcome: 'completed',
        reason: null,
        result: { candidates: [] },
      },
    });
  });

  it('binds completed headers and branch sources to the echoed source input', () => {
    const mismatched = parseCandidateSquareGridQuantizationWorkerResponseV1(
      completedResponse('grid-job:mismatch', result(emptyInput()), input()),
    );
    expect(mismatched.ok).toBe(false);
    if (mismatched.ok) throw new Error('different source/result pair must fail');
    expect(mismatched.error.some((issue) => issue.code === 'source-result-mismatch')).toBe(true);

    const branchMismatch = input();
    const branches = branchMismatch.branches as { length: number }[];
    if (branches[0] === undefined) throw new Error('branch fixture is missing');
    branches[0].length = 0.625;
    const branchParsed = parseCandidateSquareGridQuantizationWorkerResponseV1(
      completedResponse('grid-job:branch-mismatch', result(), branchMismatch),
    );
    expect(branchParsed.ok).toBe(false);
    if (branchParsed.ok) throw new Error('different branch source must fail');
    expect(branchParsed.error.some((issue) => issue.code === 'source-result-mismatch')).toBe(true);

    const requested = input(0);
    requested.branches = [{ id: 'branch-a', branchClass: 'terminal', length: 0.75, width: 0 }];
    const other = structuredClone(requested);
    const otherBranch = (other.branches as { length: number }[])[0];
    if (otherBranch === undefined) throw new Error('empty-result branch fixture is missing');
    otherBranch.length = 0.7;
    const otherResult = result(other);
    expect(otherResult.candidates).toEqual([]);
    const emptyBranchMismatch = parseCandidateSquareGridQuantizationWorkerResponseV1(
      completedResponse('grid-job:empty-branch-mismatch', otherResult, requested),
    );
    expect(emptyBranchMismatch.ok).toBe(false);
    if (emptyBranchMismatch.ok)
      throw new Error('empty result from another branch source must fail');
    expect(
      emptyBranchMismatch.error.some(
        (issue) =>
          issue.code === 'source-result-mismatch' && issue.path === '$.result.sourceBranches[0]',
      ),
    ).toBe(true);
  });

  it('allows only fixed failure reasons and closed outcome invariants', () => {
    const failed = {
      ...completedResponse(),
      outcome: 'failed',
      reason: 'quantization-failed',
      result: null,
    };
    expect(parseCandidateSquareGridQuantizationWorkerResponseV1(failed).ok).toBe(true);
    expect(
      parseCandidateSquareGridQuantizationWorkerResponseV1({
        ...failed,
        reason: 'no-solution',
      }),
    ).toMatchObject({ ok: false });
    expect(
      parseCandidateSquareGridQuantizationWorkerResponseV1({
        ...failed,
        reason: 'internal-error',
      }).ok,
    ).toBe(true);
  });

  it('rejects invalid job IDs and completely validates the nested input', () => {
    expect(parseCandidateSquareGridQuantizationWorkerRequestV1(request('')).ok).toBe(false);
    const badInput = input();
    badInput.branches = [
      { id: 'duplicate', branchClass: 'terminal', length: 1, width: 0 },
      { id: 'duplicate', branchClass: 'internal', length: 1, width: 0.2 },
    ];
    const parsed = parseCandidateSquareGridQuantizationWorkerRequestV1(request('job-ok', badInput));
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new Error('duplicate branch ID should fail');
    expect(
      parsed.error.some((issue) => issue.stage === 'input' && issue.code === 'duplicate-id'),
    ).toBe(true);
  });
});
