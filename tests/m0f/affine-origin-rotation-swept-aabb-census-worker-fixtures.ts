import { computeAffineOriginRotationSweptAabbCensusV1 } from '../../m0f/geometry/affine-origin-rotation-swept-aabb-census.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
  type AffineOriginRotationTrianglePrimitiveV1,
} from '../../m0f/geometry/affine-origin-rotation-swept-aabb.js';
import { canonicalProjectivePoint3 } from '../../m0f/reference-verifier/projective-rational-3d.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_RECORD_TYPE,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_RECORD_TYPE,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION,
  type AffineOriginRotationSweptAabbCensusWorkerFailureReasonV1,
} from '../../m0f/workers/affine-origin-rotation-swept-aabb-census-worker-protocol.js';

export type MutableRecord = Record<string, unknown>;

const point = (x: bigint | number, y: bigint | number, z: bigint | number) =>
  canonicalProjectivePoint3(BigInt(x), BigInt(y), BigInt(z), 1n);
const LOCAL_TRIANGLE = [point(0, 0, 0), point(1, 0, 0), point(0, 1, 0)] as const;

export function censusWorkerPrimitive(
  id: string,
  x: bigint | number,
  y: bigint | number = 0,
  z: bigint | number = 0,
): AffineOriginRotationTrianglePrimitiveV1 {
  const origin = point(x, y, z);
  return { id, localVertices: LOCAL_TRIANGLE, q0: origin, q1: origin };
}

export function censusWorkerInput(
  primitives: readonly AffineOriginRotationTrianglePrimitiveV1[] = [
    censusWorkerPrimitive('a', 0),
    censusWorkerPrimitive('b', 10),
  ],
  motionFamily: string = AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
): MutableRecord {
  return {
    motionFamily,
    slab: {
      t0: { numerator: 0n, exponent: 0 },
      t1: { numerator: 1n, exponent: 0 },
    },
    primitives,
  };
}

export function censusWorkerRequest(
  jobId = 'census-job:default',
  sourceId = 'source:default',
  input: unknown = censusWorkerInput(),
): MutableRecord {
  return {
    schemaVersion: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION,
    recordType: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_RECORD_TYPE,
    operation: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION,
    contractStatus: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS,
    scientificClaim: false,
    sourceId,
    jobId,
    input,
  };
}

function responseBase(jobId: string, sourceId: string, input: unknown): MutableRecord {
  return {
    schemaVersion: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION,
    recordType: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_RECORD_TYPE,
    operation: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION,
    contractStatus: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS,
    broadPhaseOnly: true,
    continuousCollisionDetectionIncluded: false,
    collisionFreeClaim: false,
    legalContactClassificationIncluded: false,
    penetrationClassificationIncluded: false,
    selfIntersectionClassificationIncluded: false,
    verified: false,
    verifiedClaim: false,
    scientificClaim: false,
    globalM0fGo: false,
    sourceId,
    jobId,
    sourceInput: input,
  };
}

export function censusWorkerCompletedResponse(
  jobId = 'census-job:default',
  sourceId = 'source:default',
  input: MutableRecord = censusWorkerInput(),
): MutableRecord {
  const computed = computeAffineOriginRotationSweptAabbCensusV1(input);
  if (!computed.ok) throw new TypeError('completed response fixture must compute');
  return {
    ...responseBase(jobId, sourceId, input),
    outcome: 'completed',
    reason: null,
    result: computed.value,
  };
}

export function censusWorkerFailedResponse(
  jobId = 'census-job:default',
  sourceId = 'source:default',
  input: MutableRecord = censusWorkerInput(),
  reason: AffineOriginRotationSweptAabbCensusWorkerFailureReasonV1 = 'census-computation-rejected',
): MutableRecord {
  return {
    ...responseBase(jobId, sourceId, input),
    outcome: 'failed',
    reason,
    result: null,
  };
}
