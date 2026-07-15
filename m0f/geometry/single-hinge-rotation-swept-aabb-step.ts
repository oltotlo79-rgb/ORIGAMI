import { deepFreezeOwned } from '../clone-and-freeze.js';
import { canonicalProjectivePoint3 } from '../reference-verifier/projective-rational-3d.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
  type AffineOriginRotationTrianglePrimitiveV1,
  type CanonicalDyadicTimeSlabV1,
} from './affine-origin-rotation-swept-aabb.js';
import {
  computeAffineOriginRotationSweptAabbCensusV1,
  type AffineOriginRotationSweptAabbCensusRecordV1,
} from './affine-origin-rotation-swept-aabb-census.js';
import {
  bindStaticRationalTrianglePoseToFoldMeshV1,
  type StaticRationalTriangleFoldMeshBindingPairV1,
  type StaticRationalTriangleFoldMeshBindingRecordV1,
} from './static-rational-triangle-fold-mesh-binding.js';

export type SingleHingeRotationSweptAabbStepPairV1 = Readonly<{
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  topologyRelation: StaticRationalTriangleFoldMeshBindingPairV1['pairRelation'];
  broadPhaseStatus:
    'separated-by-certified-swept-aabb' | 'swept-aabb-overlap-candidate' | 'indeterminate';
  narrowPhaseRequired: boolean;
}>;

export type SingleHingeRotationSweptAabbStepRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rotation-swept-aabb-step';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-dual-bridge-single-hinge-step-one-dyadic-slab';
  pathRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  poseRevisionId: string;
  activeHingeEdgeId: string;
  activeHingeFaceIds: readonly [string, string];
  activeHingeAxisVertexIds: readonly [string, string];
  movingSideFaceId: string;
  movingFaceIds: readonly string[];
  stationaryFaceIds: readonly string[];
  slab: CanonicalDyadicTimeSlabV1;
  primitives: readonly AffineOriginRotationTrianglePrimitiveV1[];
  pairs: readonly SingleHingeRotationSweptAabbStepPairV1[];
  triangleCount: number;
  unorderedPairCount: number;
  separatedPairCount: number;
  broadPhaseCandidatePairCount: number;
  indeterminatePairCount: number;
  narrowPhaseRequiredPairCount: number;
  binding: StaticRationalTriangleFoldMeshBindingRecordV1;
  broadPhaseCensus: AffineOriginRotationSweptAabbCensusRecordV1;
  activeHingeIsUniqueFacePairEdge: true;
  activeHingeIsDualGraphBridge: true;
  movingComponentDerivedByGraphCut: true;
  exactHingePointOriginIncluded: true;
  exactLocalTriangleOffsetsIncluded: true;
  stationaryTriangleFirstVertexOriginsIncluded: true;
  stationaryFacesConservativelyEnclosed: true;
  stationaryTriangleArbitrarySo3Enclosed: true;
  stationaryIdentityPoseIsSubsetOfEnclosure: true;
  movingComponentArbitrarySo3AboutHingePointEnclosed: true;
  declaredFixedAxisRotationIsSubsetOfEnclosure: true;
  completeTriangleSetIncluded: true;
  completePairEnumerationIncluded: true;
  broadPhaseOnly: true;
  exactRotationScheduleIncluded: false;
  nonlinearNarrowPhaseIncluded: false;
  continuousCollisionDetectionIncluded: false;
  legalContactPolicyIncluded: false;
  selfIntersectionDecisionIncluded: false;
  collisionFreeClaim: false;
  isSupportProfile: false;
  supportClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type SingleHingeRotationSweptAabbStepIssueV1 = Readonly<{
  stage: 'root' | 'binding' | 'step' | 'motion-census' | 'join';
  path: string;
  code: string;
  message: string;
}>;

export type SingleHingeRotationSweptAabbStepResultV1 =
  | Readonly<{ ok: true; value: SingleHingeRotationSweptAabbStepRecordV1 }>
  | Readonly<{ ok: false; error: readonly SingleHingeRotationSweptAabbStepIssueV1[] }>;

type Descriptors = Readonly<Record<string, PropertyDescriptor | undefined>>;

const ROOT_KEYS = ['bindingInput', 'step'] as const;
const STEP_KEYS = [
  'pathRevisionId',
  'stepId',
  'activeHingeEdgeId',
  'movingSideFaceId',
  'slab',
] as const;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function issue(
  stage: SingleHingeRotationSweptAabbStepIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRotationSweptAabbStepIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRotationSweptAabbStepIssueV1[],
): SingleHingeRotationSweptAabbStepResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function inspectClosedObject(
  supplied: unknown,
  path: string,
  keys: readonly string[],
  stage: SingleHingeRotationSweptAabbStepIssueV1['stage'],
):
  | Readonly<{ ok: true; value: Descriptors }>
  | Readonly<{ ok: false; error: readonly SingleHingeRotationSweptAabbStepIssueV1[] }> {
  try {
    if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) {
      return { ok: false, error: [issue(stage, path, 'expected-object', 'must be one object')] };
    }
    const prototype: unknown = Object.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) {
      return {
        ok: false,
        error: [issue(stage, path, 'expected-plain-object', 'must be one plain data object')],
      };
    }
    const allowed = new Set(keys);
    const ownKeys = Reflect.ownKeys(supplied);
    if (ownKeys.length > keys.length) {
      return {
        ok: false,
        error: [issue(stage, path, 'unknown-property', 'contains an undeclared property')],
      };
    }
    const issues: SingleHingeRotationSweptAabbStepIssueV1[] = [];
    for (const key of ownKeys) {
      if (typeof key !== 'string' || !allowed.has(key)) {
        issues.push(issue(stage, path, 'unknown-property', 'contains an undeclared property'));
      }
    }
    const descriptors: Record<string, PropertyDescriptor | undefined> = {};
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(supplied, key);
      descriptors[key] = descriptor;
      if (descriptor === undefined) {
        issues.push(issue(stage, `${path}.${key}`, 'missing-property', 'is required'));
      } else if (!('value' in descriptor)) {
        issues.push(issue(stage, `${path}.${key}`, 'accessor-property', 'accessors are not data'));
      } else if (!descriptor.enumerable) {
        issues.push(issue(stage, `${path}.${key}`, 'invalid-property', 'must be enumerable'));
      }
    }
    return issues.length === 0 ? { ok: true, value: descriptors } : { ok: false, error: issues };
  } catch {
    return {
      ok: false,
      error: [issue(stage, path, 'inspection-failed', 'properties could not be inspected safely')],
    };
  }
}

function descriptorValue(descriptors: Descriptors, key: string): unknown {
  const descriptor = descriptors[key];
  return descriptor !== undefined && 'value' in descriptor && descriptor.enumerable
    ? descriptor.value
    : undefined;
}

function parseStableId(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 128 && STABLE_ID_PATTERN.test(value)
    ? value
    : undefined;
}

function facePairKey(first: string, second: string): string {
  return first < second ? `${first}\u0000${second}` : `${second}\u0000${first}`;
}

function translatedLocalPoint(
  point: StaticRationalTriangleFoldMeshBindingRecordV1['vertices'][number]['point'],
  origin: StaticRationalTriangleFoldMeshBindingRecordV1['vertices'][number]['point'],
) {
  return canonicalProjectivePoint3(
    point.x * origin.w - origin.x * point.w,
    point.y * origin.w - origin.y * point.w,
    point.z * origin.w - origin.z * point.w,
    point.w * origin.w,
  );
}

function deriveMovingComponent(
  binding: StaticRationalTriangleFoldMeshBindingRecordV1,
  activeFaceIds: readonly [string, string],
  movingSideFaceId: string,
): ReadonlySet<string> | undefined {
  const activeKey = facePairKey(activeFaceIds[0], activeFaceIds[1]);
  const adjacency = new Map(binding.faces.map((face) => [face.faceId, new Set<string>()]));
  for (const edge of binding.edges) {
    if (edge.structuralKind !== 'declared-hinge' || edge.incidentFaceIds.length !== 2) continue;
    const first = edge.incidentFaceIds[0];
    const second = edge.incidentFaceIds[1];
    if (facePairKey(first, second) === activeKey) continue;
    adjacency.get(first)?.add(second);
    adjacency.get(second)?.add(first);
  }
  const visited = new Set<string>([movingSideFaceId]);
  const queue = [movingSideFaceId];
  for (const faceId of queue) {
    for (const neighbor of adjacency.get(faceId) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }
  const opposite = activeFaceIds[0] === movingSideFaceId ? activeFaceIds[1] : activeFaceIds[0];
  return visited.has(opposite) ? undefined : visited;
}

/**
 * Derives a conservative continuous broad phase for one dual-bridge hinge
 * rotation. It does not construct or verify a rotation schedule or narrow CCD.
 */
export function computeSingleHingeRotationSweptAabbStepV1(
  supplied: unknown,
): SingleHingeRotationSweptAabbStepResultV1 {
  const root = inspectClosedObject(supplied, '$', ROOT_KEYS, 'root');
  if (!root.ok) return failure(root.error);
  const step = inspectClosedObject(
    descriptorValue(root.value, 'step'),
    '$.step',
    STEP_KEYS,
    'step',
  );
  if (!step.ok) return failure(step.error);
  const pathRevisionId = parseStableId(descriptorValue(step.value, 'pathRevisionId'));
  const stepId = parseStableId(descriptorValue(step.value, 'stepId'));
  const activeHingeEdgeId = parseStableId(descriptorValue(step.value, 'activeHingeEdgeId'));
  const movingSideFaceId = parseStableId(descriptorValue(step.value, 'movingSideFaceId'));
  if (
    pathRevisionId === undefined ||
    stepId === undefined ||
    activeHingeEdgeId === undefined ||
    movingSideFaceId === undefined
  ) {
    return failure([
      issue(
        'step',
        '$.step',
        'invalid-stable-id',
        'path, step, active hinge, and moving-side IDs must be bounded stable ASCII IDs',
      ),
    ]);
  }
  const binding = bindStaticRationalTrianglePoseToFoldMeshV1(
    descriptorValue(root.value, 'bindingInput'),
  );
  if (!binding.ok) {
    return failure(
      binding.error.map((entry) => issue('binding', entry.path, entry.code, entry.message)),
    );
  }
  try {
    const activeEdge = binding.value.edges.find((edge) => edge.edgeId === activeHingeEdgeId);
    if (
      activeEdge?.structuralKind !== 'declared-hinge' ||
      activeEdge.incidentFaceIds.length !== 2
    ) {
      return failure([
        issue(
          'step',
          '$.step.activeHingeEdgeId',
          'invalid-active-hinge',
          'must reference one two-face declared hinge edge',
        ),
      ]);
    }
    const activeHingeFaceIds = activeEdge.incidentFaceIds;
    if (!activeHingeFaceIds.includes(movingSideFaceId)) {
      return failure([
        issue(
          'step',
          '$.step.movingSideFaceId',
          'moving-side-not-incident',
          'moving-side face must be one face incident to the active hinge',
        ),
      ]);
    }
    const activePairKey = facePairKey(activeHingeFaceIds[0], activeHingeFaceIds[1]);
    const sameFacePairHinges = binding.value.edges.filter(
      (edge) =>
        edge.structuralKind === 'declared-hinge' &&
        edge.incidentFaceIds.length === 2 &&
        facePairKey(edge.incidentFaceIds[0], edge.incidentFaceIds[1]) === activePairKey,
    );
    if (sameFacePairHinges.length !== 1) {
      return failure([
        issue(
          'step',
          '$.step.activeHingeEdgeId',
          'multi-segment-hinge-unsupported',
          'candidate step currently requires one exact hinge segment for the active face pair',
        ),
      ]);
    }
    const movingComponent = deriveMovingComponent(
      binding.value,
      activeHingeFaceIds,
      movingSideFaceId,
    );
    if (movingComponent === undefined) {
      return failure([
        issue(
          'step',
          '$.step.activeHingeEdgeId',
          'active-hinge-not-dual-bridge',
          'removing the active hinge must separate its two incident face components',
        ),
      ]);
    }
    const movingFaceIds = [...movingComponent].sort();
    const stationaryFaceIds = binding.value.faces
      .map((face) => face.faceId)
      .filter((faceId) => !movingComponent.has(faceId))
      .sort();
    if (movingFaceIds.length === 0 || stationaryFaceIds.length === 0) {
      return failure([
        issue(
          'join',
          '$.step',
          'empty-graph-cut-side',
          'active hinge graph cut must leave nonempty moving and stationary components',
        ),
      ]);
    }
    const hingeOrigin = activeEdge.exactPoseSegment[0];
    const primitives: AffineOriginRotationTrianglePrimitiveV1[] = binding.value.triangles.map(
      (triangle) => {
        const moving = movingComponent.has(triangle.faceId);
        const origin = moving ? hingeOrigin : triangle.triangle[0];
        return {
          id: triangle.triangleId,
          localVertices: [
            translatedLocalPoint(triangle.triangle[0], origin),
            translatedLocalPoint(triangle.triangle[1], origin),
            translatedLocalPoint(triangle.triangle[2], origin),
          ],
          q0: origin,
          q1: origin,
        };
      },
    );
    const broadPhase = computeAffineOriginRotationSweptAabbCensusV1({
      motionFamily: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
      slab: descriptorValue(step.value, 'slab'),
      primitives,
    });
    if (!broadPhase.ok) {
      return failure(
        broadPhase.error.map((entry) =>
          issue('motion-census', `$.step${entry.path.slice(1)}`, entry.code, entry.message),
        ),
      );
    }
    const topologyByPair = new Map(
      binding.value.pairs.map((pair) => [
        `${pair.firstTriangleId}\u0000${pair.secondTriangleId}`,
        pair,
      ]),
    );
    const pairs: SingleHingeRotationSweptAabbStepPairV1[] = [];
    let narrowPhaseRequiredPairCount = 0;
    for (const pair of broadPhase.value.pairs) {
      const topology = topologyByPair.get(
        `${pair.firstPrimitiveId}\u0000${pair.secondPrimitiveId}`,
      );
      if (topology === undefined || topology.pairIndex !== pair.pairIndex) {
        return failure([
          issue(
            'join',
            '$.pairs',
            'pair-binding-mismatch',
            'broad-phase and topology pair ledgers do not match exactly',
          ),
        ]);
      }
      const narrowPhaseRequired =
        topology.pairRelation !== 'same-source-face' &&
        pair.status !== 'separated-by-certified-swept-aabb';
      if (narrowPhaseRequired) narrowPhaseRequiredPairCount += 1;
      pairs.push({
        pairIndex: pair.pairIndex,
        firstTriangleId: pair.firstPrimitiveId,
        secondTriangleId: pair.secondPrimitiveId,
        topologyRelation: topology.pairRelation,
        broadPhaseStatus: pair.status,
        narrowPhaseRequired,
      });
    }
    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-single-hinge-rotation-swept-aabb-step' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope: 'one-dual-bridge-single-hinge-step-one-dyadic-slab' as const,
        pathRevisionId,
        stepId,
        meshRevisionId: binding.value.meshRevisionId,
        triangulationRevisionId: binding.value.triangulationRevisionId,
        poseRevisionId: binding.value.poseRevisionId,
        activeHingeEdgeId,
        activeHingeFaceIds,
        activeHingeAxisVertexIds: activeEdge.vertexIds,
        movingSideFaceId,
        movingFaceIds,
        stationaryFaceIds,
        slab: broadPhase.value.slab,
        primitives,
        pairs,
        triangleCount: binding.value.triangleCount,
        unorderedPairCount: binding.value.unorderedPairCount,
        separatedPairCount: broadPhase.value.separatedPairCount,
        broadPhaseCandidatePairCount: broadPhase.value.candidatePairCount,
        indeterminatePairCount: broadPhase.value.indeterminatePairCount,
        narrowPhaseRequiredPairCount,
        binding: binding.value,
        broadPhaseCensus: broadPhase.value,
        activeHingeIsUniqueFacePairEdge: true as const,
        activeHingeIsDualGraphBridge: true as const,
        movingComponentDerivedByGraphCut: true as const,
        exactHingePointOriginIncluded: true as const,
        exactLocalTriangleOffsetsIncluded: true as const,
        stationaryTriangleFirstVertexOriginsIncluded: true as const,
        stationaryFacesConservativelyEnclosed: true as const,
        stationaryTriangleArbitrarySo3Enclosed: true as const,
        stationaryIdentityPoseIsSubsetOfEnclosure: true as const,
        movingComponentArbitrarySo3AboutHingePointEnclosed: true as const,
        declaredFixedAxisRotationIsSubsetOfEnclosure: true as const,
        completeTriangleSetIncluded: true as const,
        completePairEnumerationIncluded: true as const,
        broadPhaseOnly: true as const,
        exactRotationScheduleIncluded: false as const,
        nonlinearNarrowPhaseIncluded: false as const,
        continuousCollisionDetectionIncluded: false as const,
        legalContactPolicyIncluded: false as const,
        selfIntersectionDecisionIncluded: false as const,
        collisionFreeClaim: false as const,
        isSupportProfile: false as const,
        supportClaim: false as const,
        verifiedClaim: false as const,
        scientificClaim: false as const,
        globalM0fGo: false as const,
      },
    });
  } catch {
    return failure([
      issue(
        'join',
        '$',
        'step-invariant-failed',
        'single-hinge broad-phase step failed closed unexpectedly',
      ),
    ]);
  }
}
