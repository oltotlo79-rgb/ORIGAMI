import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  divideExactRational,
  equalExactRational,
  exactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import {
  equalProjectivePoints3,
  type ProjectivePoint3,
} from '../reference-verifier/projective-rational-3d.js';
import type { CanonicalDyadicTimeSlabV1 } from './affine-origin-rotation-swept-aabb.js';
import {
  computeSingleHingeRotationSweptAabbStepV1,
  type SingleHingeRotationSweptAabbStepRecordV1,
} from './single-hinge-rotation-swept-aabb-step.js';
import {
  bindStaticRationalTrianglePoseToFoldMeshV1,
  type StaticRationalTriangleFoldMeshBindingRecordV1,
} from './static-rational-triangle-fold-mesh-binding.js';

type RationalVector3 = readonly [x: ExactRational, y: ExactRational, z: ExactRational];

export type SingleHingeRigidPoseTransitionRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rigid-pose-transition';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-dual-bridge-hinge-one-exact-start-pose-one-exact-end-pose';
  arithmetic: 'exact-projective-rational-bigint';
  transitionRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  startPoseRevisionId: string;
  endPoseRevisionId: string;
  activeHingeEdgeId: string;
  activeHingeFaceIds: readonly [string, string];
  activeHingeAxisVertexIds: readonly [string, string];
  movingSideFaceId: string;
  movingFaceIds: readonly string[];
  stationaryFaceIds: readonly string[];
  movingComponentVertexIds: readonly string[];
  stationaryComponentVertexIds: readonly string[];
  slab: CanonicalDyadicTimeSlabV1;
  axisDirectionSquaredLength: ExactRational;
  rotationCosine: ExactRational;
  rotationSineOverAxisLength: ExactRational;
  endpointRotationKind: 'identity' | 'half-turn' | 'general';
  startBinding: StaticRationalTriangleFoldMeshBindingRecordV1;
  endBinding: StaticRationalTriangleFoldMeshBindingRecordV1;
  broadPhaseStep: SingleHingeRotationSweptAabbStepRecordV1;
  completeTopologyEqualityChecked: true;
  callerRevisionLabelsOnly: true;
  exactSourceReconstructionGeometryEqualityChecked: false;
  cryptographicSourceRevisionBindingIncluded: false;
  exactStationaryVertexEqualityChecked: true;
  exactHingeAxisEqualityChecked: true;
  exactMovingAxialCoordinatesChecked: true;
  exactMovingRadialDistancesChecked: true;
  commonExactRotationParametersChecked: true;
  exactRodriguesEndpointEquationChecked: true;
  orientationPreservingAxisRotationEstablished: true;
  exactEndpointRigidRotationEstablished: true;
  endpointOnly: true;
  angleBranchOrWindingIncluded: false;
  exactIntermediateAngleScheduleIncluded: false;
  chainedOrSimultaneousHingesIncluded: false;
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

export type SingleHingeRigidPoseTransitionIssueV1 = Readonly<{
  stage: 'root' | 'start-step' | 'end-binding' | 'topology' | 'transition';
  path: string;
  code: string;
  message: string;
  relatedIds?: readonly string[];
}>;

export type SingleHingeRigidPoseTransitionResultV1 =
  | Readonly<{ ok: true; value: SingleHingeRigidPoseTransitionRecordV1 }>
  | Readonly<{ ok: false; error: readonly SingleHingeRigidPoseTransitionIssueV1[] }>;

type Descriptors = Readonly<Record<string, PropertyDescriptor | undefined>>;

const ROOT_KEYS = [
  'transitionRevisionId',
  'stepId',
  'activeHingeEdgeId',
  'movingSideFaceId',
  'slab',
  'startBindingInput',
  'endBindingInput',
] as const;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const ZERO = exactRational(0n);
const ONE = exactRational(1n);
const NEGATIVE_ONE = exactRational(-1n);

function issue(
  stage: SingleHingeRigidPoseTransitionIssueV1['stage'],
  path: string,
  code: string,
  message: string,
  relatedIds?: readonly string[],
): SingleHingeRigidPoseTransitionIssueV1 {
  return relatedIds === undefined
    ? { stage, path, code, message }
    : { stage, path, code, message, relatedIds: [...relatedIds] };
}

function failure(
  errors: readonly SingleHingeRigidPoseTransitionIssueV1[],
): SingleHingeRigidPoseTransitionResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function inspectRoot(
  supplied: unknown,
):
  | Readonly<{ ok: true; value: Descriptors }>
  | Readonly<{ ok: false; error: readonly SingleHingeRigidPoseTransitionIssueV1[] }> {
  try {
    if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) {
      return {
        ok: false,
        error: [issue('root', '$', 'expected-object', 'must be one plain data object')],
      };
    }
    const prototype: unknown = Object.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) {
      return {
        ok: false,
        error: [issue('root', '$', 'expected-plain-object', 'must be one plain data object')],
      };
    }
    const ownKeys = Reflect.ownKeys(supplied);
    if (ownKeys.length > ROOT_KEYS.length) {
      return {
        ok: false,
        error: [issue('root', '$', 'unknown-property', 'contains an undeclared property')],
      };
    }
    const allowed = new Set<string>(ROOT_KEYS);
    const errors: SingleHingeRigidPoseTransitionIssueV1[] = [];
    for (const key of ownKeys) {
      if (typeof key !== 'string' || !allowed.has(key)) {
        errors.push(issue('root', '$', 'unknown-property', 'contains an undeclared property'));
      }
    }
    const descriptors: Record<string, PropertyDescriptor | undefined> = {};
    for (const key of ROOT_KEYS) {
      const descriptor = Object.getOwnPropertyDescriptor(supplied, key);
      descriptors[key] = descriptor;
      if (descriptor === undefined) {
        errors.push(issue('root', `$.${key}`, 'missing-property', 'is required'));
      } else if (!('value' in descriptor)) {
        errors.push(issue('root', `$.${key}`, 'accessor-property', 'accessors are not data'));
      } else if (!descriptor.enumerable) {
        errors.push(issue('root', `$.${key}`, 'invalid-property', 'must be enumerable'));
      }
    }
    return errors.length === 0 ? { ok: true, value: descriptors } : { ok: false, error: errors };
  } catch {
    return {
      ok: false,
      error: [issue('root', '$', 'inspection-failed', 'properties could not be inspected safely')],
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

function nestedDiagnosticPath(prefix: string, path: string): string {
  return path === '$' ? prefix : path.startsWith('$.') ? `${prefix}${path.slice(1)}` : prefix;
}

function startStepDiagnosticPath(stage: string, path: string): string {
  if (stage === 'binding') return nestedDiagnosticPath('$.startBindingInput', path);
  if (path === '$.step') return '$';
  if (path.startsWith('$.step.')) return `$${path.slice('$.step'.length)}`;
  return nestedDiagnosticPath('$.startStep', path);
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameTopology(
  start: StaticRationalTriangleFoldMeshBindingRecordV1,
  end: StaticRationalTriangleFoldMeshBindingRecordV1,
): boolean {
  if (
    start.meshRevisionId !== end.meshRevisionId ||
    start.triangulationRevisionId !== end.triangulationRevisionId ||
    start.reconstructionSchemaId !== end.reconstructionSchemaId ||
    start.reconstructionConventionsId !== end.reconstructionConventionsId ||
    start.vertexCount !== end.vertexCount ||
    start.edgeCount !== end.edgeCount ||
    start.faceCount !== end.faceCount ||
    start.triangleCount !== end.triangleCount ||
    start.unorderedPairCount !== end.unorderedPairCount
  ) {
    return false;
  }
  if (!start.vertices.every((vertex, index) => vertex.vertexId === end.vertices[index]?.vertexId)) {
    return false;
  }
  if (
    !start.edges.every((edge, index) => {
      const candidate = end.edges[index];
      return (
        candidate !== undefined &&
        edge.edgeId === candidate.edgeId &&
        edge.assignment === candidate.assignment &&
        edge.structuralKind === candidate.structuralKind &&
        sameStrings(edge.vertexIds, candidate.vertexIds) &&
        sameStrings(edge.incidentFaceIds, candidate.incidentFaceIds)
      );
    })
  ) {
    return false;
  }
  if (
    !start.faces.every((face, index) => {
      const candidate = end.faces[index];
      return (
        candidate !== undefined &&
        face.faceId === candidate.faceId &&
        sameStrings(face.triangleIds, candidate.triangleIds) &&
        sameStrings(face.boundaryEdgeIds, candidate.boundaryEdgeIds)
      );
    })
  ) {
    return false;
  }
  if (
    !start.triangles.every((triangle, index) => {
      const candidate = end.triangles[index];
      return (
        candidate !== undefined &&
        triangle.triangleId === candidate.triangleId &&
        triangle.faceId === candidate.faceId &&
        sameStrings(triangle.vertexIds, candidate.vertexIds) &&
        sameStrings(triangle.semanticVertexIds, candidate.semanticVertexIds)
      );
    })
  ) {
    return false;
  }
  return start.pairs.every((pair, index) => {
    const candidate = end.pairs[index];
    return (
      candidate !== undefined &&
      pair.pairIndex === candidate.pairIndex &&
      pair.firstTriangleId === candidate.firstTriangleId &&
      pair.secondTriangleId === candidate.secondTriangleId &&
      pair.firstFaceId === candidate.firstFaceId &&
      pair.secondFaceId === candidate.secondFaceId &&
      pair.pairRelation === candidate.pairRelation &&
      pair.sharedMeshVertexCount === candidate.sharedMeshVertexCount &&
      pair.directIncidence === candidate.directIncidence &&
      sameStrings(pair.sharedMeshVertexIds, candidate.sharedMeshVertexIds) &&
      sameStrings(
        pair.declaredHingeEdgeIdsForFacePair,
        candidate.declaredHingeEdgeIdsForFacePair,
      ) &&
      sameStrings(
        pair.directlySharedDeclaredHingeEdgeIds,
        candidate.directlySharedDeclaredHingeEdgeIds,
      )
    );
  });
}

function componentVertexIds(
  binding: StaticRationalTriangleFoldMeshBindingRecordV1,
  faceIds: readonly string[],
): readonly string[] {
  const selectedFaces = new Set(faceIds);
  const ids = new Set<string>();
  for (const triangle of binding.triangles) {
    if (!selectedFaces.has(triangle.faceId)) continue;
    for (const vertexId of triangle.vertexIds) ids.add(vertexId);
  }
  return [...ids].sort();
}

function pointDifference(point: ProjectivePoint3, origin: ProjectivePoint3): RationalVector3 {
  return [
    subtractExactRational(exactRational(point.x, point.w), exactRational(origin.x, origin.w)),
    subtractExactRational(exactRational(point.y, point.w), exactRational(origin.y, origin.w)),
    subtractExactRational(exactRational(point.z, point.w), exactRational(origin.z, origin.w)),
  ];
}

function addVector(left: RationalVector3, right: RationalVector3): RationalVector3 {
  return [
    addExactRational(left[0], right[0]),
    addExactRational(left[1], right[1]),
    addExactRational(left[2], right[2]),
  ];
}

function subtractVector(left: RationalVector3, right: RationalVector3): RationalVector3 {
  return [
    subtractExactRational(left[0], right[0]),
    subtractExactRational(left[1], right[1]),
    subtractExactRational(left[2], right[2]),
  ];
}

function scaleVector(vector: RationalVector3, scale: ExactRational): RationalVector3 {
  return [
    multiplyExactRational(vector[0], scale),
    multiplyExactRational(vector[1], scale),
    multiplyExactRational(vector[2], scale),
  ];
}

function dotVector(left: RationalVector3, right: RationalVector3): ExactRational {
  return addExactRational(
    addExactRational(
      multiplyExactRational(left[0], right[0]),
      multiplyExactRational(left[1], right[1]),
    ),
    multiplyExactRational(left[2], right[2]),
  );
}

function crossVector(left: RationalVector3, right: RationalVector3): RationalVector3 {
  return [
    subtractExactRational(
      multiplyExactRational(left[1], right[2]),
      multiplyExactRational(left[2], right[1]),
    ),
    subtractExactRational(
      multiplyExactRational(left[2], right[0]),
      multiplyExactRational(left[0], right[2]),
    ),
    subtractExactRational(
      multiplyExactRational(left[0], right[1]),
      multiplyExactRational(left[1], right[0]),
    ),
  ];
}

function equalVector(left: RationalVector3, right: RationalVector3): boolean {
  return left.every((value, index) => {
    const candidate = right[index];
    return candidate !== undefined && equalExactRational(value, candidate);
  });
}

function perpendicularComponent(
  vector: RationalVector3,
  axis: RationalVector3,
  axisSquaredLength: ExactRational,
): RationalVector3 {
  const axialScale = divideExactRational(dotVector(vector, axis), axisSquaredLength);
  return subtractVector(vector, scaleVector(axis, axialScale));
}

type RotationCheck =
  | Readonly<{
      ok: true;
      cosine: ExactRational;
      sineOverAxisLength: ExactRational;
      axisSquaredLength: ExactRational;
    }>
  | Readonly<{ ok: false; code: string; message: string; relatedIds: readonly string[] }>;

function checkCommonAxisRotation(
  start: StaticRationalTriangleFoldMeshBindingRecordV1,
  end: StaticRationalTriangleFoldMeshBindingRecordV1,
  axisVertexIds: readonly [string, string],
  movingVertexIds: readonly string[],
): RotationCheck {
  const startPointById = new Map(start.vertices.map((vertex) => [vertex.vertexId, vertex.point]));
  const endPointById = new Map(end.vertices.map((vertex) => [vertex.vertexId, vertex.point]));
  const axisStart = startPointById.get(axisVertexIds[0]);
  const axisEnd = startPointById.get(axisVertexIds[1]);
  if (axisStart === undefined || axisEnd === undefined) {
    return {
      ok: false,
      code: 'missing-axis-vertex',
      message: 'active hinge axis vertices must resolve in the start pose',
      relatedIds: [...axisVertexIds],
    };
  }
  const axis = pointDifference(axisEnd, axisStart);
  const axisSquaredLength = dotVector(axis, axis);
  if (equalExactRational(axisSquaredLength, ZERO)) {
    return {
      ok: false,
      code: 'degenerate-axis',
      message: 'active hinge axis endpoints must be distinct',
      relatedIds: [...axisVertexIds],
    };
  }
  let commonCosine: ExactRational | undefined;
  let commonSineOverAxisLength: ExactRational | undefined;
  for (const vertexId of movingVertexIds) {
    const startPoint = startPointById.get(vertexId);
    const endPoint = endPointById.get(vertexId);
    if (startPoint === undefined || endPoint === undefined) {
      return {
        ok: false,
        code: 'missing-moving-vertex',
        message: 'every moving-component vertex must resolve in both poses',
        relatedIds: [vertexId],
      };
    }
    const startOffset = pointDifference(startPoint, axisStart);
    const endOffset = pointDifference(endPoint, axisStart);
    if (!equalExactRational(dotVector(startOffset, axis), dotVector(endOffset, axis))) {
      return {
        ok: false,
        code: 'moving-axial-coordinate-changed',
        message: 'one moving vertex changed its exact coordinate along the hinge axis',
        relatedIds: [vertexId],
      };
    }
    const startPerpendicular = perpendicularComponent(startOffset, axis, axisSquaredLength);
    const endPerpendicular = perpendicularComponent(endOffset, axis, axisSquaredLength);
    const startRadiusSquared = dotVector(startPerpendicular, startPerpendicular);
    const endRadiusSquared = dotVector(endPerpendicular, endPerpendicular);
    if (!equalExactRational(startRadiusSquared, endRadiusSquared)) {
      return {
        ok: false,
        code: 'moving-radial-distance-changed',
        message: 'one moving vertex changed its exact squared distance from the hinge axis',
        relatedIds: [vertexId],
      };
    }
    if (equalExactRational(startRadiusSquared, ZERO)) {
      if (!equalVector(startOffset, endOffset)) {
        return {
          ok: false,
          code: 'axis-vertex-moved',
          message: 'a moving-component point on the hinge axis changed position',
          relatedIds: [vertexId],
        };
      }
      continue;
    }
    const cosine = divideExactRational(
      dotVector(startPerpendicular, endPerpendicular),
      startRadiusSquared,
    );
    const sineOverAxisLength = divideExactRational(
      dotVector(axis, crossVector(startPerpendicular, endPerpendicular)),
      multiplyExactRational(axisSquaredLength, startRadiusSquared),
    );
    const unitIdentity = addExactRational(
      multiplyExactRational(cosine, cosine),
      multiplyExactRational(
        axisSquaredLength,
        multiplyExactRational(sineOverAxisLength, sineOverAxisLength),
      ),
    );
    if (!equalExactRational(unitIdentity, ONE)) {
      return {
        ok: false,
        code: 'non-rotation-endpoint-map',
        message: 'endpoint parameters do not satisfy the exact rotation identity',
        relatedIds: [vertexId],
      };
    }
    const predicted = addVector(
      scaleVector(startPerpendicular, cosine),
      scaleVector(crossVector(axis, startPerpendicular), sineOverAxisLength),
    );
    if (!equalVector(predicted, endPerpendicular)) {
      return {
        ok: false,
        code: 'rodrigues-endpoint-mismatch',
        message: 'one moving vertex fails the exact axis-rotation endpoint equation',
        relatedIds: [vertexId],
      };
    }
    if (commonCosine === undefined || commonSineOverAxisLength === undefined) {
      commonCosine = cosine;
      commonSineOverAxisLength = sineOverAxisLength;
    } else if (
      !equalExactRational(commonCosine, cosine) ||
      !equalExactRational(commonSineOverAxisLength, sineOverAxisLength)
    ) {
      return {
        ok: false,
        code: 'inconsistent-moving-rotation',
        message: 'moving-component vertices do not share one exact hinge-axis rotation',
        relatedIds: [vertexId],
      };
    }
  }
  if (commonCosine === undefined || commonSineOverAxisLength === undefined) {
    return {
      ok: false,
      code: 'no-off-axis-moving-vertex',
      message: 'moving component must contain at least one vertex off the active hinge axis',
      relatedIds: [...movingVertexIds],
    };
  }
  return {
    ok: true,
    cosine: commonCosine,
    sineOverAxisLength: commonSineOverAxisLength,
    axisSquaredLength,
  };
}

function classifyRotation(cosine: ExactRational, sine: ExactRational) {
  if (equalExactRational(cosine, ONE) && equalExactRational(sine, ZERO)) return 'identity' as const;
  if (equalExactRational(cosine, NEGATIVE_ONE) && equalExactRational(sine, ZERO)) {
    return 'half-turn' as const;
  }
  return 'general' as const;
}

/**
 * Establishes that two complete exact poses differ by one common
 * orientation-preserving rotation about a declared dual-bridge hinge.
 */
export function bindSingleHingeRigidPoseTransitionV1(
  supplied: unknown,
): SingleHingeRigidPoseTransitionResultV1 {
  const root = inspectRoot(supplied);
  if (!root.ok) return failure(root.error);
  const transitionRevisionId = parseStableId(descriptorValue(root.value, 'transitionRevisionId'));
  const stepId = parseStableId(descriptorValue(root.value, 'stepId'));
  const activeHingeEdgeId = parseStableId(descriptorValue(root.value, 'activeHingeEdgeId'));
  const movingSideFaceId = parseStableId(descriptorValue(root.value, 'movingSideFaceId'));
  if (
    transitionRevisionId === undefined ||
    stepId === undefined ||
    activeHingeEdgeId === undefined ||
    movingSideFaceId === undefined
  ) {
    return failure([
      issue(
        'root',
        '$',
        'invalid-stable-id',
        'transition, step, active hinge, and moving-side IDs must be bounded stable ASCII IDs',
      ),
    ]);
  }
  const startStep = computeSingleHingeRotationSweptAabbStepV1({
    bindingInput: descriptorValue(root.value, 'startBindingInput'),
    step: {
      pathRevisionId: transitionRevisionId,
      stepId,
      activeHingeEdgeId,
      movingSideFaceId,
      slab: descriptorValue(root.value, 'slab'),
    },
  });
  if (!startStep.ok) {
    return failure(
      startStep.error.map((entry) =>
        issue(
          'start-step',
          startStepDiagnosticPath(entry.stage, entry.path),
          entry.code,
          entry.message,
        ),
      ),
    );
  }
  const endBinding = bindStaticRationalTrianglePoseToFoldMeshV1(
    descriptorValue(root.value, 'endBindingInput'),
  );
  if (!endBinding.ok) {
    return failure(
      endBinding.error.map((entry) =>
        issue(
          'end-binding',
          nestedDiagnosticPath('$.endBindingInput', entry.path),
          entry.code,
          entry.message,
          entry.relatedIds,
        ),
      ),
    );
  }
  try {
    const startBinding = startStep.value.binding;
    if (!sameTopology(startBinding, endBinding.value)) {
      return failure([
        issue(
          'topology',
          '$.endBindingInput',
          'topology-mismatch',
          'start and end bindings must have exactly the same complete mesh topology',
        ),
      ]);
    }
    const startPointById = new Map(
      startBinding.vertices.map((vertex) => [vertex.vertexId, vertex.point]),
    );
    const endPointById = new Map(
      endBinding.value.vertices.map((vertex) => [vertex.vertexId, vertex.point]),
    );
    const movingComponentVertexIds = componentVertexIds(
      startBinding,
      startStep.value.movingFaceIds,
    );
    const stationaryComponentVertexIds = componentVertexIds(
      startBinding,
      startStep.value.stationaryFaceIds,
    );
    for (const vertexId of stationaryComponentVertexIds) {
      const startPoint = startPointById.get(vertexId);
      const endPoint = endPointById.get(vertexId);
      if (
        startPoint === undefined ||
        endPoint === undefined ||
        !equalProjectivePoints3(startPoint, endPoint)
      ) {
        return failure([
          issue(
            'transition',
            '$.endBindingInput.staticTriangleSet',
            'stationary-vertex-moved',
            'every stationary-component mesh vertex must remain at its exact start point',
            [vertexId],
          ),
        ]);
      }
    }
    const startAxis = startBinding.edges.find(
      (edge) => edge.edgeId === startStep.value.activeHingeEdgeId,
    );
    const endAxis = endBinding.value.edges.find(
      (edge) => edge.edgeId === startStep.value.activeHingeEdgeId,
    );
    if (
      startAxis === undefined ||
      endAxis === undefined ||
      !equalProjectivePoints3(startAxis.exactPoseSegment[0], endAxis.exactPoseSegment[0]) ||
      !equalProjectivePoints3(startAxis.exactPoseSegment[1], endAxis.exactPoseSegment[1])
    ) {
      return failure([
        issue(
          'transition',
          '$.endBindingInput.staticTriangleSet',
          'hinge-axis-moved',
          'the complete ordered active hinge segment must remain exact and fixed',
          [...startStep.value.activeHingeAxisVertexIds],
        ),
      ]);
    }
    const rotation = checkCommonAxisRotation(
      startBinding,
      endBinding.value,
      startStep.value.activeHingeAxisVertexIds,
      movingComponentVertexIds,
    );
    if (!rotation.ok) {
      return failure([
        issue(
          'transition',
          '$.endBindingInput.staticTriangleSet',
          rotation.code,
          rotation.message,
          rotation.relatedIds,
        ),
      ]);
    }
    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-single-hinge-rigid-pose-transition' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope: 'one-dual-bridge-hinge-one-exact-start-pose-one-exact-end-pose' as const,
        arithmetic: 'exact-projective-rational-bigint' as const,
        transitionRevisionId,
        stepId,
        meshRevisionId: startBinding.meshRevisionId,
        triangulationRevisionId: startBinding.triangulationRevisionId,
        startPoseRevisionId: startBinding.poseRevisionId,
        endPoseRevisionId: endBinding.value.poseRevisionId,
        activeHingeEdgeId,
        activeHingeFaceIds: startStep.value.activeHingeFaceIds,
        activeHingeAxisVertexIds: startStep.value.activeHingeAxisVertexIds,
        movingSideFaceId,
        movingFaceIds: startStep.value.movingFaceIds,
        stationaryFaceIds: startStep.value.stationaryFaceIds,
        movingComponentVertexIds,
        stationaryComponentVertexIds,
        slab: startStep.value.slab,
        axisDirectionSquaredLength: rotation.axisSquaredLength,
        rotationCosine: rotation.cosine,
        rotationSineOverAxisLength: rotation.sineOverAxisLength,
        endpointRotationKind: classifyRotation(rotation.cosine, rotation.sineOverAxisLength),
        startBinding,
        endBinding: endBinding.value,
        broadPhaseStep: startStep.value,
        completeTopologyEqualityChecked: true as const,
        callerRevisionLabelsOnly: true as const,
        exactSourceReconstructionGeometryEqualityChecked: false as const,
        cryptographicSourceRevisionBindingIncluded: false as const,
        exactStationaryVertexEqualityChecked: true as const,
        exactHingeAxisEqualityChecked: true as const,
        exactMovingAxialCoordinatesChecked: true as const,
        exactMovingRadialDistancesChecked: true as const,
        commonExactRotationParametersChecked: true as const,
        exactRodriguesEndpointEquationChecked: true as const,
        orientationPreservingAxisRotationEstablished: true as const,
        exactEndpointRigidRotationEstablished: true as const,
        endpointOnly: true as const,
        angleBranchOrWindingIncluded: false as const,
        exactIntermediateAngleScheduleIncluded: false as const,
        chainedOrSimultaneousHingesIncluded: false as const,
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
        'transition',
        '$',
        'transition-invariant-failed',
        'single-hinge endpoint transition failed closed unexpectedly',
      ),
    ]);
  }
}
