import { describe, expect, it } from 'vitest';

import { reconstructFoldFacesCandidateV1 } from '../../m0f/geometry/reconstruct-fold-faces.js';
import {
  FACE_RECONSTRUCTION_WORKER_FAILURE_REASONS,
  FACE_RECONSTRUCTION_WORKER_MAX_JOB_ID_LENGTH,
  FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
  FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
  isFaceReconstructionWorkerFailureReasonV1,
  parseCandidateFoldFaceReconstructionWorkerRequestV1,
  parseCandidateFoldFaceReconstructionWorkerResponseV1,
  type ParseCandidateFoldFaceReconstructionWorkerRequestV1Result,
  type ParseCandidateFoldFaceReconstructionWorkerResponseV1Result,
} from '../../m0f/workers/face-reconstruction-protocol.js';

function squareInput(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B'],
    facesVertices: null,
  };
}

function request(input: unknown = squareInput()): Record<string, unknown> {
  return {
    schemaVersion: 1,
    messageType: FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    jobId: 'job:face-001',
    input,
  };
}

function reconstructedResult(): Record<string, unknown> {
  const result = reconstructFoldFacesCandidateV1(squareInput());
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return structuredClone(result.value) as unknown as Record<string, unknown>;
}

function completedResponse(result: unknown = reconstructedResult()): Record<string, unknown> {
  return {
    schemaVersion: 1,
    messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    jobId: 'job:face-001',
    outcome: 'completed',
    reason: null,
    result,
  };
}

function failedResponse(
  reason: unknown = 'reconstruction-failed',
  result: unknown = null,
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    jobId: 'job:face-001',
    outcome: 'failed',
    reason,
    result,
  };
}

function expectRequestIssue(
  supplied: unknown,
  code: string,
): ParseCandidateFoldFaceReconstructionWorkerRequestV1Result {
  const result = parseCandidateFoldFaceReconstructionWorkerRequestV1(supplied);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected request issue ${code}`);
  expect(result.error.some((entry) => entry.code === code)).toBe(true);
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.error)).toBe(true);
  expect(result.error.every((entry) => Object.isFrozen(entry))).toBe(true);
  return result;
}

function expectResponseIssue(
  supplied: unknown,
  code: string,
): ParseCandidateFoldFaceReconstructionWorkerResponseV1Result {
  const result = parseCandidateFoldFaceReconstructionWorkerResponseV1(supplied);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected response issue ${code}`);
  expect(result.error.some((entry) => entry.code === code)).toBe(true);
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.error)).toBe(true);
  expect(result.error.every((entry) => Object.isFrozen(entry))).toBe(true);
  return result;
}

describe('candidate face-reconstruction worker request protocol v1', () => {
  it('captures one owned internal input snapshot and freezes the entire parse result', () => {
    const callerInput = squareInput();
    const callerRequest = request(callerInput);
    const parsed = parseCandidateFoldFaceReconstructionWorkerRequestV1(callerRequest);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value).toMatchObject({
      schemaVersion: 1,
      messageType: 'm0f-face-reconstruction-request',
      contractStatus: 'candidate',
      scientificClaim: false,
      jobId: 'job:face-001',
      input: { specVersion: '1.2', facesVertices: null },
    });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.input)).toBe(true);
    expect(Object.isFrozen(parsed.value.input.verticesCoords)).toBe(true);
    expect(Object.isFrozen(parsed.value.input.verticesCoords[0])).toBe(true);

    const coordinates = callerInput.verticesCoords as number[][];
    const firstCoordinate = coordinates[0];
    if (firstCoordinate === undefined) throw new Error('fixture coordinate is missing');
    firstCoordinate[0] = 99;
    callerRequest.jobId = 'job:mutated';
    expect(parsed.value.jobId).toBe('job:face-001');
    expect(parsed.value.input.verticesCoords[0]).toEqual([0, 0]);
  });

  it('uses the existing input normalizer as the complete internal-input validity check', () => {
    const unknown = squareInput();
    unknown.fileFrames = [];
    const unknownIssue = expectRequestIssue(request(unknown), 'unknown-field');
    if (!unknownIssue.ok) expect(unknownIssue.error[0]?.path.startsWith('$.input')).toBe(true);

    const duplicate = squareInput();
    duplicate.verticesCoords = [
      [0, 0],
      [-0, 0],
      [1, 0],
      [0, 1],
    ];
    expectRequestIssue(request(duplicate), 'duplicate-coordinate');
  });

  it('enforces every fixed envelope field and closes unknown fields', () => {
    expectRequestIssue({ ...request(), schemaVersion: 2 }, 'invalid-literal');
    expectRequestIssue({ ...request(), messageType: 'verified-request' }, 'invalid-literal');
    expectRequestIssue({ ...request(), contractStatus: 'verified' }, 'claim-boundary');
    expectRequestIssue({ ...request(), scientificClaim: true }, 'claim-boundary');
    expectRequestIssue({ ...request(), verifierApproved: true }, 'unknown-field');

    const missing = request();
    delete missing.messageType;
    expectRequestIssue(missing, 'missing-field');
  });

  it('accepts bounded stable ASCII job IDs and rejects unstable IDs', () => {
    const maximum = request();
    maximum.jobId = `j${'0'.repeat(FACE_RECONSTRUCTION_WORKER_MAX_JOB_ID_LENGTH - 1)}`;
    expect(parseCandidateFoldFaceReconstructionWorkerRequestV1(maximum).ok).toBe(true);

    for (const jobId of [
      '',
      'contains space',
      '仕事-1',
      'job/1',
      `j${'0'.repeat(FACE_RECONSTRUCTION_WORKER_MAX_JOB_ID_LENGTH)}`,
    ]) {
      expectRequestIssue({ ...request(), jobId }, 'invalid-job-id');
    }
  });

  it('fails closed on Map, class, cycles, sparse arrays, and getters', () => {
    expectRequestIssue(new Map([['jobId', 'job:face-001']]), 'invalid-snapshot');

    class ProtocolMessage {
      readonly marker = 'class-instance';
    }
    const classMessage = Object.assign(new ProtocolMessage(), request());
    expectRequestIssue(classMessage, 'invalid-snapshot');

    const cyclic = request();
    cyclic.self = cyclic;
    expectRequestIssue(cyclic, 'invalid-snapshot');

    const sparseInput = squareInput();
    const sparseVertices = new Array<unknown>(4);
    sparseVertices[0] = [0, 0];
    sparseVertices[1] = [1, 0];
    sparseVertices[3] = [0, 1];
    sparseInput.verticesCoords = sparseVertices;
    expectRequestIssue(request(sparseInput), 'invalid-snapshot');

    let getterReads = 0;
    const getter = request();
    Object.defineProperty(getter, 'scientificClaim', {
      configurable: true,
      enumerable: true,
      get(): boolean {
        getterReads += 1;
        return false;
      },
    });
    expectRequestIssue(getter, 'invalid-snapshot');
    expect(getterReads).toBe(0);

    const revoked = Proxy.revocable(request(), {});
    revoked.revoke();
    expectRequestIssue(revoked.proxy, 'invalid-snapshot');
  });
});

describe('candidate face-reconstruction worker response protocol v1', () => {
  it('fully parses a completed candidate result, breaks aliases, and freezes all output', () => {
    const callerResult = reconstructedResult();
    const callerResponse = completedResponse(callerResult);
    const parsed = parseCandidateFoldFaceReconstructionWorkerResponseV1(callerResponse);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || parsed.value.outcome !== 'completed') return;

    expect(parsed.value).toMatchObject({
      schemaVersion: 1,
      messageType: 'm0f-face-reconstruction-response',
      contractStatus: 'candidate',
      scientificClaim: false,
      jobId: 'job:face-001',
      outcome: 'completed',
      reason: null,
      result: { recordType: 'm0f-fold-face-reconstruction' },
    });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.result)).toBe(true);
    expect(Object.isFrozen(parsed.value.result.faces)).toBe(true);

    const topology = callerResult.topology as Record<string, unknown>;
    topology.planarVertexCount = 999;
    callerResponse.jobId = 'job:mutated';
    expect(parsed.value.jobId).toBe('job:face-001');
    expect(parsed.value.result.topology.planarVertexCount).toBe(4);
  });

  it('accepts only declared, data-free failure reasons', () => {
    expect(Object.isFrozen(FACE_RECONSTRUCTION_WORKER_FAILURE_REASONS)).toBe(true);
    for (const reason of FACE_RECONSTRUCTION_WORKER_FAILURE_REASONS) {
      const parsed = parseCandidateFoldFaceReconstructionWorkerResponseV1(failedResponse(reason));
      expect(parsed.ok).toBe(true);
      if (!parsed.ok || parsed.value.outcome !== 'failed') continue;
      expect(parsed.value).toEqual({
        schemaVersion: 1,
        messageType: 'm0f-face-reconstruction-response',
        contractStatus: 'candidate',
        scientificClaim: false,
        jobId: 'job:face-001',
        outcome: 'failed',
        reason,
        result: null,
      });
      expect(Object.isFrozen(parsed)).toBe(true);
      expect(Object.isFrozen(parsed.value)).toBe(true);
    }
    expect(isFaceReconstructionWorkerFailureReasonV1('internal-error')).toBe(true);
    expect(isFaceReconstructionWorkerFailureReasonV1('host stack trace')).toBe(false);
  });

  it('checks completed/failed outcome invariants', () => {
    expectResponseIssue(
      { ...completedResponse(), reason: 'reconstruction-failed' },
      'outcome-invariant',
    );
    expectResponseIssue({ ...completedResponse(), result: null }, 'outcome-invariant');
    expectResponseIssue(failedResponse(null), 'outcome-invariant');
    expectResponseIssue(failedResponse('not-declared'), 'outcome-invariant');
    expectResponseIssue(
      failedResponse('internal-error', reconstructedResult()),
      'outcome-invariant',
    );
    expectResponseIssue({ ...failedResponse(), outcome: 'cancelled' }, 'invalid-outcome');
  });

  it('rejects claim spoofing and every invalid completed result', () => {
    expectResponseIssue({ ...completedResponse(), contractStatus: 'verified' }, 'claim-boundary');
    expectResponseIssue({ ...completedResponse(), scientificClaim: true }, 'claim-boundary');

    const nestedClaim = reconstructedResult();
    nestedClaim.scientificClaim = true;
    expectResponseIssue(completedResponse(nestedClaim), 'invalid-literal');

    const topologyMutation = reconstructedResult();
    const topology = topologyMutation.topology as Record<string, unknown>;
    topology.planarVertexCount = 999;
    expectResponseIssue(completedResponse(topologyMutation), 'topology-mismatch');

    const unknownResultField = reconstructedResult();
    unknownResultField.verifiedBy = 'worker';
    expectResponseIssue(completedResponse(unknownResultField), 'unknown-field');
  });

  it('forbids host exception text and closes the failed response', () => {
    expectResponseIssue(
      { ...failedResponse('internal-error'), error: 'private host stack' },
      'unknown-field',
    );
    expectResponseIssue(
      { ...failedResponse('internal-error'), message: 'private host exception text' },
      'unknown-field',
    );
    expectResponseIssue(
      { ...failedResponse('internal-error'), result: { message: 'private host exception text' } },
      'outcome-invariant',
    );
  });

  it('applies the same fail-closed snapshot boundary to responses', () => {
    expectResponseIssue(new Map([['outcome', 'failed']]), 'invalid-snapshot');

    const cyclic = failedResponse();
    cyclic.self = cyclic;
    expectResponseIssue(cyclic, 'invalid-snapshot');

    const sparseResult = reconstructedResult();
    const faces = sparseResult.faces as unknown[];
    const sparseFaces = new Array<unknown>(faces.length);
    for (let index = 1; index < faces.length; index += 1) sparseFaces[index] = faces[index];
    sparseResult.faces = sparseFaces;
    expectResponseIssue(completedResponse(sparseResult), 'invalid-snapshot');

    let getterReads = 0;
    const getter = failedResponse();
    Object.defineProperty(getter, 'reason', {
      configurable: true,
      enumerable: true,
      get(): string {
        getterReads += 1;
        return 'internal-error';
      },
    });
    expectResponseIssue(getter, 'invalid-snapshot');
    expect(getterReads).toBe(0);

    const revoked = Proxy.revocable(failedResponse(), {});
    revoked.revoke();
    expectResponseIssue(revoked.proxy, 'invalid-snapshot');
  });
});
