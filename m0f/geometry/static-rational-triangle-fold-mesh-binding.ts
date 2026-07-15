import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  equalProjectivePoints3,
  projectiveOrient3DSign,
  type ProjectivePoint3,
} from '../reference-verifier/projective-rational-3d.js';
import {
  parseCandidateFoldFaceReconstructionV1,
  type CandidateFoldFaceReconstructionParseIssue,
} from './fold-face-reconstruction-result.js';
import type { FoldFaceReconstructionAssignment } from './fold-face-input.js';
import {
  parseStaticRationalTriangleOverlapCensusInputV1,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS,
  type StaticRationalTriangleOverlapCensusIssueV1,
} from './static-rational-triangle-overlap-census.js';
import type { StaticRationalTriangle3 } from './static-rational-triangle-overlap.js';

export const STATIC_RATIONAL_TRIANGLE_FOLD_MESH_BINDING_LIMITS = deepFreezeOwned({
  maxTriangles: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxTriangles,
  maxPairs: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxPairs,
  maxIssues: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxIssues,
  maxRevisionIdCodeUnits: 128,
  maxRootProperties: 5,
});

export type StaticRationalTriangleFoldMeshBindingVertexV1 = Readonly<{
  vertexId: string;
  point: ProjectivePoint3;
}>;

export type StaticRationalTriangleFoldMeshBindingTriangleV1 = Readonly<{
  triangleId: string;
  faceId: string;
  vertexIds: readonly [string, string, string];
  semanticVertexIds: readonly [string, string, string];
  triangle: StaticRationalTriangle3;
}>;

export type StaticRationalTriangleFoldMeshBindingFaceV1 = Readonly<{
  faceId: string;
  triangleIds: readonly string[];
  boundaryEdgeIds: readonly string[];
}>;

export type StaticRationalTriangleFoldMeshBindingEdgeV1 = Readonly<{
  edgeId: string;
  vertexIds: readonly [string, string];
  incidentFaceIds: readonly [string] | readonly [string, string];
  assignment: FoldFaceReconstructionAssignment;
  structuralKind: 'boundary' | 'declared-hinge';
  exactPoseSegment: readonly [ProjectivePoint3, ProjectivePoint3];
}>;

export type StaticRationalTriangleFoldMeshPairRelationV1 =
  'same-source-face' | 'declared-hinge-adjacent-faces' | 'distinct-nonadjacent-faces';

export type StaticRationalTriangleFoldMeshDirectIncidenceV1 =
  | 'none'
  | 'shared-mesh-vertex'
  | 'same-face-triangulation-edge'
  | 'declared-hinge-edge'
  | 'multiple-shared-mesh-vertices';

export type StaticRationalTriangleFoldMeshBindingPairV1 = Readonly<{
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  firstFaceId: string;
  secondFaceId: string;
  pairRelation: StaticRationalTriangleFoldMeshPairRelationV1;
  sharedMeshVertexIds: readonly string[];
  sharedMeshVertexCount: 0 | 1 | 2 | 3;
  sharedCoordinateVertexCount: 0 | 1 | 2 | 3;
  additionalCoordinateCoincidenceCount: 0 | 1 | 2 | 3;
  directIncidence: StaticRationalTriangleFoldMeshDirectIncidenceV1;
  declaredHingeEdgeIdsForFacePair: readonly string[];
  directlySharedDeclaredHingeEdgeIds: readonly string[];
}>;

export type StaticRationalTriangleFoldMeshBindingRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-static-rational-triangle-fold-mesh-binding';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-fold-face-reconstruction-and-one-exact-static-3d-pose';
  arithmetic: 'exact-projective-rational-bigint';
  meshRevisionId: string;
  triangulationRevisionId: string;
  poseRevisionId: string;
  reconstructionSchemaId: string;
  reconstructionConventionsId: string;
  triangleOrder: 'triangle-id-code-unit';
  pairOrder: 'first-triangle-id-then-second-triangle-id-code-unit';
  vertexCount: number;
  edgeCount: number;
  faceCount: number;
  triangleCount: number;
  unorderedPairCount: number;
  boundaryEdgeCount: number;
  declaredHingeEdgeCount: number;
  sameSourceFacePairCount: number;
  declaredHingeAdjacentFacePairCount: number;
  distinctNonadjacentFacePairCount: number;
  vertices: readonly StaticRationalTriangleFoldMeshBindingVertexV1[];
  edges: readonly StaticRationalTriangleFoldMeshBindingEdgeV1[];
  faces: readonly StaticRationalTriangleFoldMeshBindingFaceV1[];
  triangles: readonly StaticRationalTriangleFoldMeshBindingTriangleV1[];
  pairs: readonly StaticRationalTriangleFoldMeshBindingPairV1[];
  allReconstructedTrianglesPoseBound: true;
  allUnorderedPairsIncluded: true;
  foldFaceReconstructionContractChecked: true;
  exactTrianglePoseContractChecked: true;
  faceTriangulationIdentityIncluded: true;
  meshVertexIdentityIncluded: true;
  meshEdgeFaceIncidenceIncluded: true;
  declaredHingeEdgesIncluded: true;
  sourceFacePairwiseMetricRigidityChecked: true;
  sourceFaceCoplanarityChecked: true;
  callerRevisionLabelsIncluded: true;
  cryptographicSourceRevisionBindingIncluded: false;
  productStableIdentityIncluded: false;
  legalContactPolicyIncluded: false;
  motionSideHistoryIncluded: false;
  layerOrderIncluded: false;
  penetrationClassificationIncluded: false;
  selfIntersectionClassificationIncluded: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  isSupportProfile: false;
  supportClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type StaticRationalTriangleFoldMeshBindingIssueV1 = Readonly<{
  stage: 'root' | 'reconstruction' | 'static-triangle-set' | 'cross-field';
  path: string;
  code: string;
  message: string;
  relatedIds?: readonly string[];
}>;

export type StaticRationalTriangleFoldMeshBindingResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleFoldMeshBindingRecordV1 }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleFoldMeshBindingIssueV1[] }>;

type InspectedRoot = Readonly<Record<string, PropertyDescriptor | undefined>>;
type Reconstruction = Extract<
  ReturnType<typeof parseCandidateFoldFaceReconstructionV1>,
  Readonly<{ ok: true }>
>['value'];
type ReconstructionTriangle = Reconstruction['faces'][number]['triangles'][number];

const ROOT_KEYS = [
  'meshRevisionId',
  'triangulationRevisionId',
  'poseRevisionId',
  'reconstruction',
  'staticTriangleSet',
] as const;
const REVISION_ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]*$/;

function issue(
  stage: StaticRationalTriangleFoldMeshBindingIssueV1['stage'],
  path: string,
  code: string,
  message: string,
  relatedIds?: readonly string[],
): StaticRationalTriangleFoldMeshBindingIssueV1 {
  return relatedIds === undefined
    ? { stage, path, code, message }
    : { stage, path, code, message, relatedIds: [...relatedIds] };
}

function failure(
  error: readonly StaticRationalTriangleFoldMeshBindingIssueV1[],
): StaticRationalTriangleFoldMeshBindingResultV1 {
  return deepFreezeOwned({
    ok: false as const,
    error: error.slice(0, STATIC_RATIONAL_TRIANGLE_FOLD_MESH_BINDING_LIMITS.maxIssues),
  });
}

function inspectRoot(
  supplied: unknown,
):
  | Readonly<{ ok: true; value: InspectedRoot }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleFoldMeshBindingIssueV1[] }> {
  try {
    if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) {
      return { ok: false, error: [issue('root', '$', 'expected-object', 'must be one object')] };
    }
    const prototype: unknown = Object.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) {
      return {
        ok: false,
        error: [issue('root', '$', 'expected-plain-object', 'must be one plain data object')],
      };
    }
    const keys = Reflect.ownKeys(supplied);
    if (keys.length > STATIC_RATIONAL_TRIANGLE_FOLD_MESH_BINDING_LIMITS.maxRootProperties) {
      return {
        ok: false,
        error: [
          issue(
            'root',
            '$',
            'property-limit-exceeded',
            'root exceeds the closed five-property contract',
          ),
        ],
      };
    }
    const allowed = new Set<string>(ROOT_KEYS);
    const issues: StaticRationalTriangleFoldMeshBindingIssueV1[] = [];
    for (const key of keys) {
      if (typeof key !== 'string' || !allowed.has(key)) {
        issues.push(issue('root', '$', 'unknown-property', 'root contains an undeclared property'));
      }
    }
    const inspected: Record<string, PropertyDescriptor | undefined> = {};
    for (const key of ROOT_KEYS) {
      const descriptor = Object.getOwnPropertyDescriptor(supplied, key);
      inspected[key] = descriptor;
      if (descriptor === undefined) {
        issues.push(issue('root', `$.${key}`, 'missing-property', 'required property is missing'));
      } else if (!('value' in descriptor)) {
        issues.push(issue('root', `$.${key}`, 'accessor-property', 'accessors are not input data'));
      } else if (!descriptor.enumerable) {
        issues.push(
          issue('root', `$.${key}`, 'invalid-property', 'input properties must be enumerable'),
        );
      }
    }
    return issues.length === 0 ? { ok: true, value: inspected } : { ok: false, error: issues };
  } catch {
    return {
      ok: false,
      error: [
        issue('root', '$', 'inspection-failed', 'root properties could not be inspected safely'),
      ],
    };
  }
}

function descriptorValue(inspected: InspectedRoot, key: (typeof ROOT_KEYS)[number]): unknown {
  const descriptor = inspected[key];
  return descriptor !== undefined && 'value' in descriptor && descriptor.enumerable
    ? descriptor.value
    : undefined;
}

function revisionId(
  supplied: unknown,
  path: string,
): string | StaticRationalTriangleFoldMeshBindingIssueV1 {
  return typeof supplied === 'string' &&
    supplied.length <= STATIC_RATIONAL_TRIANGLE_FOLD_MESH_BINDING_LIMITS.maxRevisionIdCodeUnits &&
    REVISION_ID_PATTERN.test(supplied)
    ? supplied
    : issue(
        'root',
        path,
        'invalid-revision-id',
        'must be a stable ASCII revision ID beginning with a letter',
      );
}

function copiedReconstructionIssues(
  issues: readonly CandidateFoldFaceReconstructionParseIssue[],
): readonly StaticRationalTriangleFoldMeshBindingIssueV1[] {
  return issues.map((entry) =>
    issue(
      'reconstruction',
      `$.reconstruction${entry.path === '$' ? '' : entry.path.slice(1)}`,
      entry.code,
      entry.message,
      entry.relatedIds,
    ),
  );
}

function copiedStaticTriangleIssues(
  issues: readonly StaticRationalTriangleOverlapCensusIssueV1[],
): readonly StaticRationalTriangleFoldMeshBindingIssueV1[] {
  return issues.map((entry) =>
    issue(
      'static-triangle-set',
      `$.staticTriangleSet${entry.path === '$' ? '' : entry.path.slice(1)}`,
      entry.code,
      entry.message,
    ),
  );
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function pairKey(first: string, second: string): string {
  return first < second ? `${first}\u0000${second}` : `${second}\u0000${first}`;
}

function sharedCoordinateVertexCount(
  first: StaticRationalTriangle3,
  second: StaticRationalTriangle3,
): 0 | 1 | 2 | 3 {
  const count = first.filter((point) =>
    second.some((candidate) => equalProjectivePoints3(point, candidate)),
  ).length;
  if (count === 0 || count === 1 || count === 2 || count === 3) return count;
  throw new RangeError('two nondegenerate triangles cannot share more than three points');
}

function expectedPairCount(triangleCount: number): number {
  return triangleCount < 2 ? 0 : (triangleCount * (triangleCount - 1)) / 2;
}

function sourceSquaredDistance(
  first: Reconstruction['vertices'][number]['exactCoordinate'],
  second: Reconstruction['vertices'][number]['exactCoordinate'],
): Readonly<{ numerator: bigint; denominator: bigint }> {
  const firstXNumerator = BigInt(first.x.numerator);
  const firstXDenominator = BigInt(first.x.denominator);
  const firstYNumerator = BigInt(first.y.numerator);
  const firstYDenominator = BigInt(first.y.denominator);
  const secondXNumerator = BigInt(second.x.numerator);
  const secondXDenominator = BigInt(second.x.denominator);
  const secondYNumerator = BigInt(second.y.numerator);
  const secondYDenominator = BigInt(second.y.denominator);
  const xNumerator = firstXNumerator * secondXDenominator - secondXNumerator * firstXDenominator;
  const xDenominator = firstXDenominator * secondXDenominator;
  const yNumerator = firstYNumerator * secondYDenominator - secondYNumerator * firstYDenominator;
  const yDenominator = firstYDenominator * secondYDenominator;
  return {
    numerator:
      xNumerator * xNumerator * yDenominator * yDenominator +
      yNumerator * yNumerator * xDenominator * xDenominator,
    denominator: xDenominator * xDenominator * yDenominator * yDenominator,
  };
}

function poseSquaredDistance(
  first: ProjectivePoint3,
  second: ProjectivePoint3,
): Readonly<{ numerator: bigint; denominator: bigint }> {
  const x = first.x * second.w - second.x * first.w;
  const y = first.y * second.w - second.y * first.w;
  const z = first.z * second.w - second.z * first.w;
  const denominator = first.w * second.w;
  return {
    numerator: x * x + y * y + z * z,
    denominator: denominator * denominator,
  };
}

function sameRational(
  first: Readonly<{ numerator: bigint; denominator: bigint }>,
  second: Readonly<{ numerator: bigint; denominator: bigint }>,
): boolean {
  return first.numerator * second.denominator === second.numerator * first.denominator;
}

function oneOrTwoStrings(values: readonly string[]): readonly [string] | readonly [string, string] {
  const first = values[0];
  const second = values[1];
  if (values.length === 1 && first !== undefined) return [first];
  if (values.length === 2 && first !== undefined && second !== undefined) return [first, second];
  throw new RangeError('expected one or two canonical strings');
}

function directIncidence(
  sameFace: boolean,
  sharedMeshVertexCount: 0 | 1 | 2 | 3,
  directlySharedHingeCount: number,
): StaticRationalTriangleFoldMeshDirectIncidenceV1 {
  if (sharedMeshVertexCount === 0) return 'none';
  if (sharedMeshVertexCount === 1) return 'shared-mesh-vertex';
  if (directlySharedHingeCount > 0) return 'declared-hinge-edge';
  if (sameFace && sharedMeshVertexCount === 2) return 'same-face-triangulation-edge';
  return 'multiple-shared-mesh-vertices';
}

function buildBinding(
  meshRevisionId: string,
  triangulationRevisionId: string,
  poseRevisionId: string,
  reconstruction: Reconstruction,
  staticTriangles: Extract<
    ReturnType<typeof parseStaticRationalTriangleOverlapCensusInputV1>,
    Readonly<{ ok: true }>
  >['value'],
): StaticRationalTriangleFoldMeshBindingResultV1 {
  const reconstructionTriangles = reconstruction.faces.flatMap((face) => face.triangles);
  const reconstructionTriangleById = new Map<string, ReconstructionTriangle>();
  for (const triangle of reconstructionTriangles) {
    reconstructionTriangleById.set(triangle.id, triangle);
  }
  const staticTriangleById = new Map(
    staticTriangles.triangles.map((entry) => [entry.triangleId, entry.triangle]),
  );
  const expectedTriangleIds = [...reconstructionTriangleById.keys()].sort(compareCodeUnits);
  const suppliedTriangleIds = staticTriangles.triangles.map((entry) => entry.triangleId);
  if (
    expectedTriangleIds.length !== suppliedTriangleIds.length ||
    expectedTriangleIds.some((id, index) => suppliedTriangleIds[index] !== id)
  ) {
    return failure([
      issue(
        'cross-field',
        '$.staticTriangleSet.triangles',
        'triangle-id-bijection-mismatch',
        'static pose triangle IDs must exactly equal the reconstructed triangulation IDs',
      ),
    ]);
  }

  const pointByVertexId = new Map<string, ProjectivePoint3>();
  const triangles: StaticRationalTriangleFoldMeshBindingTriangleV1[] = [];
  for (const triangleId of expectedTriangleIds) {
    const topology = reconstructionTriangleById.get(triangleId);
    const pose = staticTriangleById.get(triangleId);
    if (topology === undefined || pose === undefined) {
      return failure([
        issue(
          'cross-field',
          '$.staticTriangleSet.triangles',
          'triangle-id-bijection-mismatch',
          'one canonical triangle ID did not resolve in both inputs',
          [triangleId],
        ),
      ]);
    }
    for (let index = 0; index < 3; index += 1) {
      const vertexId = topology.vertexIds[index];
      const point = pose[index];
      if (vertexId === undefined || point === undefined) {
        return failure([
          issue(
            'cross-field',
            `$.staticTriangleSet.triangles[${triangleId}]`,
            'triangle-vertex-binding-invariant',
            'triangle topology and pose must each contain three ordered vertices',
            [triangleId],
          ),
        ]);
      }
      const previous = pointByVertexId.get(vertexId);
      if (previous !== undefined && !equalProjectivePoints3(previous, point)) {
        return failure([
          issue(
            'cross-field',
            `$.staticTriangleSet.triangles[${triangleId}].triangle[${String(index)}]`,
            'inconsistent-pose-vertex',
            'one reconstructed mesh vertex has different exact 3D positions across triangles',
            [vertexId, triangleId],
          ),
        ]);
      }
      pointByVertexId.set(vertexId, point);
    }
    triangles.push({
      triangleId,
      faceId: topology.faceId,
      vertexIds: [...topology.vertexIds],
      semanticVertexIds: [...topology.semanticVertexIds],
      triangle: pose,
    });
  }

  const expectedVertexIds = reconstruction.vertices
    .map((vertex) => vertex.id)
    .sort(compareCodeUnits);
  const boundVertexIds = [...pointByVertexId.keys()].sort(compareCodeUnits);
  if (
    expectedVertexIds.length !== boundVertexIds.length ||
    expectedVertexIds.some((id, index) => boundVertexIds[index] !== id)
  ) {
    return failure([
      issue(
        'cross-field',
        '$.staticTriangleSet.triangles',
        'vertex-coverage-mismatch',
        'the complete reconstructed vertex set must be covered by pose triangles',
      ),
    ]);
  }
  const vertices: StaticRationalTriangleFoldMeshBindingVertexV1[] = boundVertexIds.map(
    (vertexId) => {
      const point = pointByVertexId.get(vertexId);
      if (point === undefined) throw new TypeError('bound canonical vertex is missing');
      return { vertexId, point };
    },
  );
  const sourceVertexById = new Map(
    reconstruction.vertices.map((vertex) => [vertex.id, vertex.exactCoordinate]),
  );
  for (const face of reconstruction.faces) {
    const facePosePoints = face.vertexIds.map((vertexId) => pointByVertexId.get(vertexId));
    const faceSourcePoints = face.vertexIds.map((vertexId) => sourceVertexById.get(vertexId));
    if (
      facePosePoints.some((point) => point === undefined) ||
      faceSourcePoints.some((point) => point === undefined)
    ) {
      return failure([
        issue(
          'cross-field',
          `$.reconstruction.faces[${face.id}]`,
          'source-face-vertex-binding-invariant',
          'one reconstructed face vertex is absent from source or exact pose binding',
          [face.id],
        ),
      ]);
    }
    for (let firstIndex = 0; firstIndex < face.vertexIds.length; firstIndex += 1) {
      const firstPose = facePosePoints[firstIndex];
      const firstSource = faceSourcePoints[firstIndex];
      if (firstPose === undefined || firstSource === undefined) {
        throw new TypeError('checked face vertex is missing');
      }
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < face.vertexIds.length;
        secondIndex += 1
      ) {
        const secondPose = facePosePoints[secondIndex];
        const secondSource = faceSourcePoints[secondIndex];
        if (secondPose === undefined || secondSource === undefined) {
          throw new TypeError('checked face vertex is missing');
        }
        if (
          !sameRational(
            sourceSquaredDistance(firstSource, secondSource),
            poseSquaredDistance(firstPose, secondPose),
          )
        ) {
          return failure([
            issue(
              'cross-field',
              `$.reconstruction.faces[${face.id}]`,
              'source-face-metric-mismatch',
              'exact 3D pose does not preserve every source-face vertex-pair distance',
              [face.id, face.vertexIds[firstIndex] ?? '', face.vertexIds[secondIndex] ?? ''],
            ),
          ]);
        }
      }
    }
    const firstTriangleId = face.triangles[0]?.id;
    const firstTriangle =
      firstTriangleId === undefined ? undefined : staticTriangleById.get(firstTriangleId);
    if (firstTriangle === undefined) {
      return failure([
        issue(
          'cross-field',
          `$.reconstruction.faces[${face.id}].triangles`,
          'source-face-triangle-binding-invariant',
          'one reconstructed face has no bound reference triangle',
          [face.id],
        ),
      ]);
    }
    if (
      facePosePoints.some(
        (point) =>
          point === undefined ||
          projectiveOrient3DSign(firstTriangle[0], firstTriangle[1], firstTriangle[2], point) !== 0,
      )
    ) {
      return failure([
        issue(
          'cross-field',
          `$.reconstruction.faces[${face.id}]`,
          'source-face-noncoplanar-pose',
          'all exact pose vertices of one rigid source face must remain coplanar',
          [face.id],
        ),
      ]);
    }
  }

  const incidentFaceIdsByEdgeId = new Map<string, string[]>();
  for (const face of reconstruction.faces) {
    for (const edgeId of face.edgeIds) {
      const incident = incidentFaceIdsByEdgeId.get(edgeId) ?? [];
      incident.push(face.id);
      incidentFaceIdsByEdgeId.set(edgeId, incident);
    }
  }
  const edges: StaticRationalTriangleFoldMeshBindingEdgeV1[] = [];
  for (const edge of [...reconstruction.edges].sort((left, right) =>
    compareCodeUnits(left.id, right.id),
  )) {
    const firstVertexId = edge.vertexIds[0];
    const secondVertexId = edge.vertexIds[1];
    const firstPoint = pointByVertexId.get(firstVertexId);
    const secondPoint = pointByVertexId.get(secondVertexId);
    const incidentFaceIds = (incidentFaceIdsByEdgeId.get(edge.id) ?? []).sort(compareCodeUnits);
    if (
      firstPoint === undefined ||
      secondPoint === undefined ||
      (incidentFaceIds.length !== 1 && incidentFaceIds.length !== 2) ||
      (edge.assignment === 'B' && incidentFaceIds.length !== 1) ||
      (edge.assignment !== 'B' && incidentFaceIds.length !== 2)
    ) {
      return failure([
        issue(
          'cross-field',
          `$.reconstruction.edges[${edge.id}]`,
          'edge-pose-incidence-invariant',
          'one parsed edge could not be bound to its exact pose segment and face incidence',
          [edge.id],
        ),
      ]);
    }
    const orderedVertexIds =
      compareCodeUnits(firstVertexId, secondVertexId) <= 0
        ? ([firstVertexId, secondVertexId] as const)
        : ([secondVertexId, firstVertexId] as const);
    const orderedPoints =
      orderedVertexIds[0] === firstVertexId
        ? ([firstPoint, secondPoint] as const)
        : ([secondPoint, firstPoint] as const);
    edges.push({
      edgeId: edge.id,
      vertexIds: orderedVertexIds,
      incidentFaceIds: oneOrTwoStrings(incidentFaceIds),
      assignment: edge.assignment,
      structuralKind: edge.assignment === 'B' ? 'boundary' : 'declared-hinge',
      exactPoseSegment: orderedPoints,
    });
  }

  const faces: StaticRationalTriangleFoldMeshBindingFaceV1[] = reconstruction.faces
    .map((face) => ({
      faceId: face.id,
      triangleIds: face.triangles.map((triangle) => triangle.id).sort(compareCodeUnits),
      boundaryEdgeIds: [...face.edgeIds].sort(compareCodeUnits),
    }))
    .sort((left, right) => compareCodeUnits(left.faceId, right.faceId));
  const hingeEdgeIdsByFacePair = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.structuralKind !== 'declared-hinge' || edge.incidentFaceIds.length !== 2) continue;
    const firstFaceId = edge.incidentFaceIds[0];
    const secondFaceId = edge.incidentFaceIds[1];
    const key = pairKey(firstFaceId, secondFaceId);
    const edgeIds = hingeEdgeIdsByFacePair.get(key) ?? [];
    edgeIds.push(edge.edgeId);
    edgeIds.sort(compareCodeUnits);
    hingeEdgeIdsByFacePair.set(key, edgeIds);
  }
  const edgeById = new Map(edges.map((edge) => [edge.edgeId, edge]));
  const pairs: StaticRationalTriangleFoldMeshBindingPairV1[] = [];
  let sameSourceFacePairCount = 0;
  let declaredHingeAdjacentFacePairCount = 0;
  let distinctNonadjacentFacePairCount = 0;
  for (let firstIndex = 0; firstIndex < triangles.length; firstIndex += 1) {
    const first = triangles[firstIndex];
    if (first === undefined) throw new TypeError('canonical first triangle is missing');
    for (let secondIndex = firstIndex + 1; secondIndex < triangles.length; secondIndex += 1) {
      const second = triangles[secondIndex];
      if (second === undefined) throw new TypeError('canonical second triangle is missing');
      const sharedMeshVertexIds = first.vertexIds
        .filter((vertexId) => second.vertexIds.includes(vertexId))
        .sort(compareCodeUnits);
      const sharedMeshVertexCount = sharedMeshVertexIds.length;
      if (
        sharedMeshVertexCount !== 0 &&
        sharedMeshVertexCount !== 1 &&
        sharedMeshVertexCount !== 2 &&
        sharedMeshVertexCount !== 3
      ) {
        throw new RangeError('two triangles cannot share more than three mesh vertices');
      }
      const coordinateCount = sharedCoordinateVertexCount(first.triangle, second.triangle);
      if (coordinateCount < sharedMeshVertexCount) {
        return failure([
          issue(
            'cross-field',
            `$.pairs[${first.triangleId},${second.triangleId}]`,
            'mesh-coordinate-incidence-mismatch',
            'shared mesh vertex IDs must retain equal exact pose coordinates',
            [first.triangleId, second.triangleId],
          ),
        ]);
      }
      const sameFace = first.faceId === second.faceId;
      const facePairHingeEdgeIds = sameFace
        ? []
        : [...(hingeEdgeIdsByFacePair.get(pairKey(first.faceId, second.faceId)) ?? [])];
      const directlySharedHingeEdgeIds = facePairHingeEdgeIds.filter((edgeId) => {
        const edge = edgeById.get(edgeId);
        return (
          edge?.vertexIds.every(
            (vertexId) => first.vertexIds.includes(vertexId) && second.vertexIds.includes(vertexId),
          ) === true
        );
      });
      const pairRelation: StaticRationalTriangleFoldMeshPairRelationV1 = sameFace
        ? 'same-source-face'
        : facePairHingeEdgeIds.length > 0
          ? 'declared-hinge-adjacent-faces'
          : 'distinct-nonadjacent-faces';
      if (pairRelation === 'same-source-face') sameSourceFacePairCount += 1;
      else if (pairRelation === 'declared-hinge-adjacent-faces') {
        declaredHingeAdjacentFacePairCount += 1;
      } else distinctNonadjacentFacePairCount += 1;
      const additionalCoordinateCoincidenceCount = coordinateCount - sharedMeshVertexCount;
      if (
        additionalCoordinateCoincidenceCount !== 0 &&
        additionalCoordinateCoincidenceCount !== 1 &&
        additionalCoordinateCoincidenceCount !== 2 &&
        additionalCoordinateCoincidenceCount !== 3
      ) {
        throw new RangeError('coordinate coincidence delta is outside the closed range');
      }
      pairs.push({
        pairIndex: pairs.length,
        firstTriangleId: first.triangleId,
        secondTriangleId: second.triangleId,
        firstFaceId: first.faceId,
        secondFaceId: second.faceId,
        pairRelation,
        sharedMeshVertexIds,
        sharedMeshVertexCount,
        sharedCoordinateVertexCount: coordinateCount,
        additionalCoordinateCoincidenceCount,
        directIncidence: directIncidence(
          sameFace,
          sharedMeshVertexCount,
          directlySharedHingeEdgeIds.length,
        ),
        declaredHingeEdgeIdsForFacePair: facePairHingeEdgeIds,
        directlySharedDeclaredHingeEdgeIds: directlySharedHingeEdgeIds,
      });
    }
  }

  const unorderedPairCount = expectedPairCount(triangles.length);
  if (
    pairs.length !== unorderedPairCount ||
    sameSourceFacePairCount +
      declaredHingeAdjacentFacePairCount +
      distinctNonadjacentFacePairCount !==
      unorderedPairCount
  ) {
    return failure([
      issue(
        'cross-field',
        '$.pairs',
        'pair-count-invariant',
        'complete topology-pair ledger and counters disagree',
      ),
    ]);
  }

  const boundaryEdgeCount = edges.filter((edge) => edge.structuralKind === 'boundary').length;
  const declaredHingeEdgeCount = edges.length - boundaryEdgeCount;
  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: 'm0f-static-rational-triangle-fold-mesh-binding' as const,
      contractStatus: 'candidate-no-claim' as const,
      predicateScope: 'one-fold-face-reconstruction-and-one-exact-static-3d-pose' as const,
      arithmetic: 'exact-projective-rational-bigint' as const,
      meshRevisionId,
      triangulationRevisionId,
      poseRevisionId,
      reconstructionSchemaId: reconstruction.schemaId,
      reconstructionConventionsId: reconstruction.conventionsId,
      triangleOrder: 'triangle-id-code-unit' as const,
      pairOrder: 'first-triangle-id-then-second-triangle-id-code-unit' as const,
      vertexCount: vertices.length,
      edgeCount: edges.length,
      faceCount: faces.length,
      triangleCount: triangles.length,
      unorderedPairCount,
      boundaryEdgeCount,
      declaredHingeEdgeCount,
      sameSourceFacePairCount,
      declaredHingeAdjacentFacePairCount,
      distinctNonadjacentFacePairCount,
      vertices,
      edges,
      faces,
      triangles,
      pairs,
      allReconstructedTrianglesPoseBound: true as const,
      allUnorderedPairsIncluded: true as const,
      foldFaceReconstructionContractChecked: true as const,
      exactTrianglePoseContractChecked: true as const,
      faceTriangulationIdentityIncluded: true as const,
      meshVertexIdentityIncluded: true as const,
      meshEdgeFaceIncidenceIncluded: true as const,
      declaredHingeEdgesIncluded: true as const,
      sourceFacePairwiseMetricRigidityChecked: true as const,
      sourceFaceCoplanarityChecked: true as const,
      callerRevisionLabelsIncluded: true as const,
      cryptographicSourceRevisionBindingIncluded: false as const,
      productStableIdentityIncluded: false as const,
      legalContactPolicyIncluded: false as const,
      motionSideHistoryIncluded: false as const,
      layerOrderIncluded: false as const,
      penetrationClassificationIncluded: false as const,
      selfIntersectionClassificationIncluded: false as const,
      continuousTimeIncluded: false as const,
      continuousCollisionDetectionIncluded: false as const,
      collisionFreeClaim: false as const,
      isSupportProfile: false as const,
      supportClaim: false as const,
      verifiedClaim: false as const,
      scientificClaim: false as const,
      globalM0fGo: false as const,
    },
  });
}

/**
 * Binds every candidate reconstructed FOLD triangle and mesh feature to one
 * exact static 3D pose without promoting topology to a contact decision.
 */
export function bindStaticRationalTrianglePoseToFoldMeshV1(
  supplied: unknown,
): StaticRationalTriangleFoldMeshBindingResultV1 {
  const inspected = inspectRoot(supplied);
  if (!inspected.ok) return failure(inspected.error);
  const meshRevision = revisionId(
    descriptorValue(inspected.value, 'meshRevisionId'),
    '$.meshRevisionId',
  );
  const triangulationRevision = revisionId(
    descriptorValue(inspected.value, 'triangulationRevisionId'),
    '$.triangulationRevisionId',
  );
  const poseRevision = revisionId(
    descriptorValue(inspected.value, 'poseRevisionId'),
    '$.poseRevisionId',
  );
  const revisionIssues = [meshRevision, triangulationRevision, poseRevision].filter(
    (value): value is StaticRationalTriangleFoldMeshBindingIssueV1 => typeof value !== 'string',
  );
  if (
    typeof meshRevision !== 'string' ||
    typeof triangulationRevision !== 'string' ||
    typeof poseRevision !== 'string'
  ) {
    return failure(revisionIssues);
  }

  const reconstruction = parseCandidateFoldFaceReconstructionV1(
    descriptorValue(inspected.value, 'reconstruction'),
  );
  if (!reconstruction.ok) return failure(copiedReconstructionIssues(reconstruction.error));
  const staticTriangles = parseStaticRationalTriangleOverlapCensusInputV1(
    descriptorValue(inspected.value, 'staticTriangleSet'),
  );
  if (!staticTriangles.ok) return failure(copiedStaticTriangleIssues(staticTriangles.error));
  try {
    return buildBinding(
      meshRevision,
      triangulationRevision,
      poseRevision,
      reconstruction.value,
      staticTriangles.value,
    );
  } catch {
    return failure([
      issue(
        'cross-field',
        '$',
        'binding-invariant-failed',
        'static fold-mesh binding failed closed on an unexpected invariant',
      ),
    ]);
  }
}
