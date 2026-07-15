import { describe, expect, it } from 'vitest';

import {
  bindStaticRationalTrianglePoseToFoldMeshV1,
  type StaticRationalTriangleFoldMeshBindingRecordV1,
} from '../../m0f/geometry/static-rational-triangle-fold-mesh-binding.js';
import type { StaticRationalTriangle3 } from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
} from '../../m0f/geometry/reconstruct-fold-faces.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

function sourceInput(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [0.5, 0],
      [1, 0],
      [1, 1],
      [0.5, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [1, 4],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'V'],
    facesVertices: null,
  };
}

function reconstruction(): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(sourceInput());
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('two-face reconstruction fixture must succeed');
  return result.value;
}

function exactInteger(text: string): bigint {
  return BigInt(text);
}

function foldedPoint(
  vertex: CandidateFoldFaceReconstructionV1['vertices'][number],
  flatOverlap: boolean,
): ProjectivePoint3 {
  const xNumerator = exactInteger(vertex.exactCoordinate.x.numerator);
  const xDenominator = exactInteger(vertex.exactCoordinate.x.denominator);
  const yNumerator = exactInteger(vertex.exactCoordinate.y.numerator);
  const yDenominator = exactInteger(vertex.exactCoordinate.y.denominator);
  const isRightOfHinge = 2n * xNumerator > xDenominator;
  if (!isRightOfHinge) {
    return canonicalProjectivePoint3(
      xNumerator * yDenominator,
      yNumerator * xDenominator,
      0n,
      xDenominator * yDenominator,
    );
  }
  if (flatOverlap) {
    return canonicalProjectivePoint3(
      (xDenominator - xNumerator) * yDenominator,
      yNumerator * xDenominator,
      0n,
      xDenominator * yDenominator,
    );
  }
  return canonicalProjectivePoint3(
    xDenominator * yDenominator,
    2n * xDenominator * yNumerator,
    (2n * xNumerator - xDenominator) * yDenominator,
    2n * xDenominator * yDenominator,
  );
}

function staticTriangleSet(artifact: CandidateFoldFaceReconstructionV1, flatOverlap = false) {
  const pointById = new Map(
    artifact.vertices.map((vertex) => [vertex.id, foldedPoint(vertex, flatOverlap)]),
  );
  return {
    triangles: artifact.faces.flatMap((face) =>
      face.triangles.map((topology) => {
        const points = topology.vertexIds.map((vertexId) => pointById.get(vertexId));
        const first = points[0];
        const second = points[1];
        const third = points[2];
        if (first === undefined || second === undefined || third === undefined) {
          throw new TypeError('pose fixture vertex must resolve');
        }
        return {
          triangleId: topology.id,
          triangle: [first, second, third] as StaticRationalTriangle3,
        };
      }),
    ),
  };
}

function input(artifact = reconstruction(), flatOverlap = false) {
  return {
    meshRevisionId: 'Mesh:fixture:1',
    triangulationRevisionId: 'Triangulation:fixture:1',
    poseRevisionId: flatOverlap ? 'Pose:flat-overlap:1' : 'Pose:quarter-fold:1',
    reconstruction: artifact,
    staticTriangleSet: staticTriangleSet(artifact, flatOverlap),
  };
}

function bind(supplied = input()): StaticRationalTriangleFoldMeshBindingRecordV1 {
  const result = bindStaticRationalTrianglePoseToFoldMeshV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('mesh binding fixture must succeed');
  return result.value;
}

describe('static exact-rational triangle to reconstructed FOLD mesh binding candidate', () => {
  it('binds all reconstructed IDs, exact pose vertices, edges, faces, triangles, and pairs', () => {
    const record = bind();
    expect(record).toMatchObject({
      meshRevisionId: 'Mesh:fixture:1',
      triangulationRevisionId: 'Triangulation:fixture:1',
      poseRevisionId: 'Pose:quarter-fold:1',
      vertexCount: 6,
      edgeCount: 7,
      faceCount: 2,
      triangleCount: 4,
      unorderedPairCount: 6,
      boundaryEdgeCount: 6,
      declaredHingeEdgeCount: 1,
      sameSourceFacePairCount: 2,
      declaredHingeAdjacentFacePairCount: 4,
      distinctNonadjacentFacePairCount: 0,
    });
    expect(record.triangles.map((triangle) => triangle.triangleId)).toEqual(
      [...record.triangles.map((triangle) => triangle.triangleId)].sort(),
    );
    expect(record.pairs.map((pair) => pair.pairIndex)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(new Set(record.pairs.map((pair) => pair.pairRelation))).toEqual(
      new Set(['same-source-face', 'declared-hinge-adjacent-faces']),
    );
    expect(record.pairs.every((pair) => pair.additionalCoordinateCoincidenceCount === 0)).toBe(
      true,
    );
  });

  it('retains the exact declared hinge segment and distinguishes direct triangle incidence', () => {
    const record = bind();
    const hinge = record.edges.find((edge) => edge.structuralKind === 'declared-hinge');
    expect(hinge).toMatchObject({
      assignment: 'V',
      incidentFaceIds: ['candidate-face:000001', 'candidate-face:000002'],
      vertexIds: ['v2', 'v3'],
    });
    expect(hinge?.exactPoseSegment).toEqual([
      canonicalProjectivePoint3(1n, 0n, 0n, 2n),
      canonicalProjectivePoint3(1n, 2n, 0n, 2n),
    ]);

    const directHingePairs = record.pairs.filter(
      (pair) => pair.directIncidence === 'declared-hinge-edge',
    );
    expect(directHingePairs).toHaveLength(1);
    expect(directHingePairs[0]).toMatchObject({
      sharedMeshVertexIds: ['v2', 'v3'],
      directlySharedDeclaredHingeEdgeIds: [hinge?.edgeId],
    });
    expect(
      record.pairs.filter((pair) => pair.directIncidence === 'same-face-triangulation-edge'),
    ).toHaveLength(2);
  });

  it('does not confuse additional flat-fold coordinate coincidence with mesh incidence', () => {
    const record = bind(input(reconstruction(), true));
    const coincident = record.pairs.filter((pair) => pair.additionalCoordinateCoincidenceCount > 0);
    expect(coincident.length).toBeGreaterThan(0);
    expect(
      coincident.every((pair) => pair.sharedCoordinateVertexCount > pair.sharedMeshVertexCount),
    ).toBe(true);
    expect(record.meshVertexIdentityIncluded).toBe(true);
    expect(record.legalContactPolicyIncluded).toBe(false);
  });

  it('is invariant under caller static-triangle entry order', () => {
    const supplied = input();
    const canonical = bind(supplied);
    const reversed = bind({
      ...supplied,
      staticTriangleSet: { triangles: [...supplied.staticTriangleSet.triangles].reverse() },
    });
    expect(reversed).toEqual(canonical);
  });

  it('rejects a missing or renamed pose triangle instead of accepting partial coverage', () => {
    const missingInput = input();
    missingInput.staticTriangleSet.triangles.pop();
    const missing = bindStaticRationalTrianglePoseToFoldMeshV1(missingInput);
    expect(missing.ok).toBe(false);
    if (missing.ok) throw new TypeError('missing pose triangle must fail');
    expect(missing.error).toContainEqual(
      expect.objectContaining({
        stage: 'cross-field',
        code: 'triangle-id-bijection-mismatch',
      }),
    );

    const renamedInput = input();
    const first = renamedInput.staticTriangleSet.triangles[0];
    if (first === undefined) throw new TypeError('fixture triangle is missing');
    renamedInput.staticTriangleSet.triangles[0] = { ...first, triangleId: 'Renamed:triangle' };
    const renamed = bindStaticRationalTrianglePoseToFoldMeshV1(renamedInput);
    expect(renamed.ok).toBe(false);
    if (renamed.ok) throw new TypeError('renamed pose triangle must fail');
    expect(renamed.error).toContainEqual(
      expect.objectContaining({ code: 'triangle-id-bijection-mismatch' }),
    );
  });

  it('rejects inconsistent exact positions for one shared reconstructed vertex', () => {
    const supplied = input();
    const topologyById = new Map(
      supplied.reconstruction.faces.flatMap((face) =>
        face.triangles.map((triangle) => [triangle.id, triangle] as const),
      ),
    );
    const first = supplied.staticTriangleSet.triangles[0];
    if (first === undefined) throw new TypeError('fixture triangle is missing');
    const topology = topologyById.get(first.triangleId);
    if (topology === undefined) throw new TypeError('fixture topology is missing');
    const sharedIndex = topology.vertexIds.findIndex((vertexId) => vertexId === 'v2');
    expect(sharedIndex).toBeGreaterThanOrEqual(0);
    const changed = [...first.triangle] as unknown as ProjectivePoint3[];
    changed[sharedIndex] = canonicalProjectivePoint3(1n, 0n, 1n, 2n);
    supplied.staticTriangleSet.triangles[0] = {
      ...first,
      triangle: changed as unknown as StaticRationalTriangle3,
    };
    const result = bindStaticRationalTrianglePoseToFoldMeshV1(supplied);
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('inconsistent mesh vertex pose must fail');
    expect(result.error).toContainEqual(
      expect.objectContaining({
        stage: 'cross-field',
        code: 'inconsistent-pose-vertex',
      }),
    );
    expect(
      result.error.find((entry) => entry.code === 'inconsistent-pose-vertex')?.relatedIds,
    ).toContain('v2');
  });

  it('rejects a stretched or bent source face even when mesh vertex IDs remain consistent', () => {
    const supplied = input();
    const topologyById = new Map(
      supplied.reconstruction.faces.flatMap((face) =>
        face.triangles.map((triangle) => [triangle.id, triangle] as const),
      ),
    );
    const occurrence = supplied.staticTriangleSet.triangles.find((entry) =>
      topologyById.get(entry.triangleId)?.vertexIds.includes('v0'),
    );
    if (occurrence === undefined) throw new TypeError('unique face vertex fixture is missing');
    const topology = topologyById.get(occurrence.triangleId);
    if (topology === undefined) throw new TypeError('fixture topology is missing');
    const vertexIndex = topology.vertexIds.findIndex((vertexId) => vertexId === 'v0');
    const changed = [...occurrence.triangle] as unknown as ProjectivePoint3[];
    changed[vertexIndex] = canonicalProjectivePoint3(0n, 0n, 1n, 1n);
    occurrence.triangle = changed as unknown as StaticRationalTriangle3;
    const result = bindStaticRationalTrianglePoseToFoldMeshV1(supplied);
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('nonrigid source face pose must fail');
    expect(result.error).toContainEqual(
      expect.objectContaining({
        stage: 'cross-field',
        code: 'source-face-metric-mismatch',
      }),
    );
  });

  it('propagates closed reconstruction and exact-triangle parser failures by stage', () => {
    const malformedReconstruction = input();
    const reconstructionValue = structuredClone(malformedReconstruction.reconstruction) as Record<
      string,
      unknown
    >;
    reconstructionValue.scientificClaim = true;
    const first = bindStaticRationalTrianglePoseToFoldMeshV1({
      ...malformedReconstruction,
      reconstruction: reconstructionValue,
    });
    expect(first.ok).toBe(false);
    if (first.ok) throw new TypeError('malformed reconstruction must fail');
    expect(first.error).toContainEqual(
      expect.objectContaining({
        stage: 'reconstruction',
        path: '$.reconstruction.scientificClaim',
      }),
    );

    const malformedPose = input();
    const firstPoseTriangle = malformedPose.staticTriangleSet.triangles[0];
    if (firstPoseTriangle === undefined) throw new TypeError('fixture triangle is missing');
    malformedPose.staticTriangleSet.triangles[0] = {
      ...firstPoseTriangle,
      triangle: [
        firstPoseTriangle.triangle[0],
        firstPoseTriangle.triangle[0],
        firstPoseTriangle.triangle[2],
      ],
    };
    const second = bindStaticRationalTrianglePoseToFoldMeshV1(malformedPose);
    expect(second.ok).toBe(false);
    if (second.ok) throw new TypeError('degenerate pose triangle must fail');
    expect(second.error).toContainEqual(
      expect.objectContaining({
        stage: 'static-triangle-set',
        code: 'invalid-triangle',
      }),
    );
  });

  it('rejects root accessors without invocation and handles revoked proxies', () => {
    let getterCalls = 0;
    const accessor = input() as Record<string, unknown>;
    Object.defineProperty(accessor, 'poseRevisionId', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'Pose:hostile';
      },
    });
    expect(bindStaticRationalTrianglePoseToFoldMeshV1(accessor).ok).toBe(false);
    expect(getterCalls).toBe(0);

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(() => bindStaticRationalTrianglePoseToFoldMeshV1(revoked.proxy)).not.toThrow();
    const rejected = bindStaticRationalTrianglePoseToFoldMeshV1(revoked.proxy);
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new TypeError('revoked root must fail');
    expect(rejected.error).toContainEqual(
      expect.objectContaining({ stage: 'root', code: 'inspection-failed' }),
    );
  });

  it('returns deeply frozen records while keeping every policy and verification claim false', () => {
    const result = bindStaticRationalTrianglePoseToFoldMeshV1(input());
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('fixture binding must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.vertices)).toBe(true);
    expect(Object.isFrozen(result.value.edges[0]?.exactPoseSegment)).toBe(true);
    expect(Object.isFrozen(result.value.triangles[0]?.triangle)).toBe(true);
    expect(Object.isFrozen(result.value.pairs[0])).toBe(true);
    expect(result.value).toMatchObject({
      contractStatus: 'candidate-no-claim',
      allReconstructedTrianglesPoseBound: true,
      allUnorderedPairsIncluded: true,
      faceTriangulationIdentityIncluded: true,
      meshVertexIdentityIncluded: true,
      meshEdgeFaceIncidenceIncluded: true,
      declaredHingeEdgesIncluded: true,
      sourceFacePairwiseMetricRigidityChecked: true,
      sourceFaceCoplanarityChecked: true,
      callerRevisionLabelsIncluded: true,
      cryptographicSourceRevisionBindingIncluded: false,
      productStableIdentityIncluded: false,
      legalContactPolicyIncluded: false,
      motionSideHistoryIncluded: false,
      layerOrderIncluded: false,
      penetrationClassificationIncluded: false,
      selfIntersectionClassificationIncluded: false,
      continuousTimeIncluded: false,
      continuousCollisionDetectionIncluded: false,
      collisionFreeClaim: false,
      isSupportProfile: false,
      supportClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });
});
