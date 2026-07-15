import {
  computeAffineOriginRotationSweptAabbCensusV1,
  type AffineOriginRotationSweptAabbCensusResultV1,
} from '../geometry/affine-origin-rotation-swept-aabb-census.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_RECORD_TYPE,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION,
  parseAffineOriginRotationSweptAabbCensusWorkerRequestV1,
  parseAffineOriginRotationSweptAabbCensusWorkerResponseV1,
  type AffineOriginRotationSweptAabbCensusWorkerRequestV1,
  type AffineOriginRotationSweptAabbCensusWorkerResponseV1,
  type FailedAffineOriginRotationSweptAabbCensusWorkerResponseV1,
} from './affine-origin-rotation-swept-aabb-census-worker-protocol.js';

export type AffineOriginRotationSweptAabbCensusWorkerComputerV1 = (
  input: AffineOriginRotationSweptAabbCensusWorkerRequestV1['input'],
) => AffineOriginRotationSweptAabbCensusResultV1;

export type AffineOriginRotationSweptAabbCensusWorkerPostMessageV1 = (
  response: AffineOriginRotationSweptAabbCensusWorkerResponseV1,
) => void;

const RESPONSE_NO_CLAIM_FIELDS = Object.freeze({
  contractStatus: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS,
  broadPhaseOnly: true as const,
  continuousCollisionDetectionIncluded: false as const,
  collisionFreeClaim: false as const,
  legalContactClassificationIncluded: false as const,
  penetrationClassificationIncluded: false as const,
  selfIntersectionClassificationIncluded: false as const,
  verified: false as const,
  verifiedClaim: false as const,
  scientificClaim: false as const,
  globalM0fGo: false as const,
});

function responseBase(request: AffineOriginRotationSweptAabbCensusWorkerRequestV1) {
  return {
    schemaVersion: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION,
    recordType: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_RECORD_TYPE,
    operation: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION,
    ...RESPONSE_NO_CLAIM_FIELDS,
    sourceId: request.sourceId,
    jobId: request.jobId,
    sourceInput: request.input,
  } as const;
}

function failedResponse(
  request: AffineOriginRotationSweptAabbCensusWorkerRequestV1,
  reason: 'census-computation-rejected' | 'internal-error',
): FailedAffineOriginRotationSweptAabbCensusWorkerResponseV1 {
  return Object.freeze({
    ...responseBase(request),
    outcome: 'failed' as const,
    reason,
    result: null,
  });
}

/** Executes one trusted census request and never exposes computation diagnostics. */
export function executeAffineOriginRotationSweptAabbCensusWorkerMessageV1(
  supplied: unknown,
  computer: AffineOriginRotationSweptAabbCensusWorkerComputerV1 = computeAffineOriginRotationSweptAabbCensusV1,
): AffineOriginRotationSweptAabbCensusWorkerResponseV1 | undefined {
  let request: AffineOriginRotationSweptAabbCensusWorkerRequestV1 | undefined;
  try {
    const parsedRequest = parseAffineOriginRotationSweptAabbCensusWorkerRequestV1(supplied);
    if (!parsedRequest.ok) return undefined;
    request = parsedRequest.value;
    const computed = computer(request.input);
    if (!computed.ok) return failedResponse(request, 'census-computation-rejected');

    const parsedResponse = parseAffineOriginRotationSweptAabbCensusWorkerResponseV1({
      ...responseBase(request),
      outcome: 'completed',
      reason: null,
      result: computed.value,
    });
    return parsedResponse.ok ? parsedResponse.value : failedResponse(request, 'internal-error');
  } catch {
    return request === undefined ? undefined : failedResponse(request, 'internal-error');
  }
}

/**
 * Creates a one-shot handler. The first message consumes the handler even when
 * its envelope is invalid, so a Worker can never start a second census job.
 */
export function createAffineOriginRotationSweptAabbCensusWorkerMessageHandlerV1(
  postMessage: AffineOriginRotationSweptAabbCensusWorkerPostMessageV1,
  computer: AffineOriginRotationSweptAabbCensusWorkerComputerV1 = computeAffineOriginRotationSweptAabbCensusV1,
): (event: Readonly<{ data: unknown }>) => void {
  let consumed = false;
  return (event): void => {
    if (consumed) return;
    consumed = true;
    const response = executeAffineOriginRotationSweptAabbCensusWorkerMessageV1(
      event.data,
      computer,
    );
    if (response !== undefined) postMessage(response);
  };
}
