import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../reference-verifier/projective-rational-3d.js';
import {
  analyzeStaticRationalTriangleFoldMeshStrataV1,
  type StaticRationalTriangleFoldMeshStrataRecordV1,
} from './static-rational-triangle-fold-mesh-strata.js';
import type { StaticRationalTriangle3 } from './static-rational-triangle-overlap.js';

export const STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_WITNESS_RECORD_TYPE =
  'm0f-static-rational-triangle-nonadjacent-crossing-witness-set' as const;

export type PortableProjectivePoint3V1 = Readonly<{
  x: string;
  y: string;
  z: string;
  w: string;
}>;

export type PortableProjectiveTriangle3V1 = readonly [
  PortableProjectivePoint3V1,
  PortableProjectivePoint3V1,
  PortableProjectivePoint3V1,
];

export type StaticRationalTriangleNonadjacentCrossingWitnessTriangleV1 = Readonly<{
  triangleId: string;
  faceId: string;
  vertexIds: readonly [string, string, string];
  triangle: PortableProjectiveTriangle3V1;
}>;

export type StaticRationalTriangleNonadjacentCrossingWitnessV1 = Readonly<{
  witnessIndex: number;
  sourcePairIndex: number;
  first: StaticRationalTriangleNonadjacentCrossingWitnessTriangleV1;
  second: StaticRationalTriangleNonadjacentCrossingWitnessTriangleV1;
  exactRelativeInteriorPoint: PortableProjectivePoint3V1;
  producerCategory: 'nonadjacent-static-interior-crossing-evidence';
  producerLocusKind: 'segment';
  producerRelativeLocations: readonly ['interior', 'interior'];
}>;

export type StaticRationalTriangleNonadjacentCrossingWitnessSetV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_WITNESS_RECORD_TYPE;
  contractStatus: 'candidate-no-claim';
  coordinateEncoding: 'canonical-projective-bigint-decimal-v1';
  meshRevisionId: string;
  triangulationRevisionId: string;
  poseRevisionId: string;
  triangleCount: number;
  unorderedPairCount: number;
  declaredHingeFacePairs: readonly Readonly<{
    firstFaceId: string;
    secondFaceId: string;
  }>[];
  witnessCount: number;
  witnesses: readonly StaticRationalTriangleNonadjacentCrossingWitnessV1[];
  completeProducerCrossingWitnessSet: true;
  declaredHingeFacePairsCompleteForBoundMesh: true;
  exactRelativeInteriorPointIncluded: true;
  independentAuditIncluded: false;
  cryptographicSourceRevisionBindingIncluded: false;
  legalContactPolicyIncluded: false;
  selfIntersectionDecisionIncluded: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type StaticRationalTriangleNonadjacentCrossingWitnessIssueV1 = Readonly<{
  stage: 'analysis' | 'witness';
  path: string;
  code: string;
  message: string;
}>;

export type StaticRationalTriangleNonadjacentCrossingWitnessResultV1 =
  | Readonly<{
      ok: true;
      value: StaticRationalTriangleNonadjacentCrossingWitnessSetV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly StaticRationalTriangleNonadjacentCrossingWitnessIssueV1[];
    }>;

function portablePoint(point: ProjectivePoint3): PortableProjectivePoint3V1 {
  return {
    x: point.x.toString(),
    y: point.y.toString(),
    z: point.z.toString(),
    w: point.w.toString(),
  };
}

function portableTriangle(triangle: StaticRationalTriangle3): PortableProjectiveTriangle3V1 {
  return [portablePoint(triangle[0]), portablePoint(triangle[1]), portablePoint(triangle[2])];
}

function canonicalMidpoint(first: ProjectivePoint3, second: ProjectivePoint3): ProjectivePoint3 {
  return canonicalProjectivePoint3(
    first.x * second.w + second.x * first.w,
    first.y * second.w + second.y * first.w,
    first.z * second.w + second.z * first.w,
    2n * first.w * second.w,
  );
}

function facePairKey(firstFaceId: string, secondFaceId: string): string {
  return firstFaceId < secondFaceId
    ? `${firstFaceId}\u0000${secondFaceId}`
    : `${secondFaceId}\u0000${firstFaceId}`;
}

function buildWitnessSet(
  analysis: StaticRationalTriangleFoldMeshStrataRecordV1,
): StaticRationalTriangleNonadjacentCrossingWitnessResultV1 {
  const triangleById = new Map(
    analysis.binding.triangles.map((triangle) => [triangle.triangleId, triangle]),
  );
  const hingeFacePairByKey = new Map<
    string,
    Readonly<{ firstFaceId: string; secondFaceId: string }>
  >();
  for (const edge of analysis.binding.edges) {
    if (edge.structuralKind !== 'declared-hinge' || edge.incidentFaceIds.length !== 2) continue;
    const firstFaceId = edge.incidentFaceIds[0];
    const secondFaceId = edge.incidentFaceIds[1];
    const ordered =
      firstFaceId < secondFaceId
        ? { firstFaceId, secondFaceId }
        : { firstFaceId: secondFaceId, secondFaceId: firstFaceId };
    hingeFacePairByKey.set(facePairKey(firstFaceId, secondFaceId), ordered);
  }
  const declaredHingeFacePairs = [...hingeFacePairByKey.values()].sort((left, right) =>
    left.firstFaceId < right.firstFaceId
      ? -1
      : left.firstFaceId > right.firstFaceId
        ? 1
        : left.secondFaceId < right.secondFaceId
          ? -1
          : left.secondFaceId > right.secondFaceId
            ? 1
            : 0,
  );
  const crossingRows = analysis.pairs.filter(
    (pair) => pair.category === 'nonadjacent-static-interior-crossing-evidence',
  );
  const witnesses: StaticRationalTriangleNonadjacentCrossingWitnessV1[] = [];
  for (const row of crossingRows) {
    const first = triangleById.get(row.firstTriangleId);
    const second = triangleById.get(row.secondTriangleId);
    const locusVertices = row.strata.strata.locus.vertices;
    const firstEndpoint = locusVertices[0];
    const secondEndpoint = locusVertices[1];
    if (
      first === undefined ||
      second === undefined ||
      row.strata.strata.locus.locusKind !== 'segment' ||
      firstEndpoint === undefined ||
      secondEndpoint === undefined ||
      row.topology.pairRelation !== 'distinct-nonadjacent-faces' ||
      row.strata.triangleARelativeLocation !== 'interior' ||
      row.strata.triangleBRelativeLocation !== 'interior'
    ) {
      return deepFreezeOwned({
        ok: false as const,
        error: [
          {
            stage: 'witness' as const,
            path: `$.pairs[${row.firstTriangleId},${row.secondTriangleId}]`,
            code: 'producer-crossing-invariant',
            message: 'one producer crossing row cannot form the fixed exact witness',
          },
        ],
      });
    }
    witnesses.push({
      witnessIndex: witnesses.length,
      sourcePairIndex: row.pairIndex,
      first: {
        triangleId: first.triangleId,
        faceId: first.faceId,
        vertexIds: [...first.vertexIds],
        triangle: portableTriangle(first.triangle),
      },
      second: {
        triangleId: second.triangleId,
        faceId: second.faceId,
        vertexIds: [...second.vertexIds],
        triangle: portableTriangle(second.triangle),
      },
      exactRelativeInteriorPoint: portablePoint(canonicalMidpoint(firstEndpoint, secondEndpoint)),
      producerCategory: 'nonadjacent-static-interior-crossing-evidence',
      producerLocusKind: 'segment',
      producerRelativeLocations: ['interior', 'interior'],
    });
  }
  if (witnesses.length !== analysis.nonadjacentStaticInteriorCrossingEvidencePairCount) {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          stage: 'witness' as const,
          path: '$.witnesses',
          code: 'witness-count-invariant',
          message: 'producer crossing count and complete witness set disagree',
        },
      ],
    });
  }
  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_WITNESS_RECORD_TYPE,
      contractStatus: 'candidate-no-claim' as const,
      coordinateEncoding: 'canonical-projective-bigint-decimal-v1' as const,
      meshRevisionId: analysis.meshRevisionId,
      triangulationRevisionId: analysis.triangulationRevisionId,
      poseRevisionId: analysis.poseRevisionId,
      triangleCount: analysis.triangleCount,
      unorderedPairCount: analysis.unorderedPairCount,
      declaredHingeFacePairs,
      witnessCount: witnesses.length,
      witnesses,
      completeProducerCrossingWitnessSet: true as const,
      declaredHingeFacePairsCompleteForBoundMesh: true as const,
      exactRelativeInteriorPointIncluded: true as const,
      independentAuditIncluded: false as const,
      cryptographicSourceRevisionBindingIncluded: false as const,
      legalContactPolicyIncluded: false as const,
      selfIntersectionDecisionIncluded: false as const,
      continuousTimeIncluded: false as const,
      continuousCollisionDetectionIncluded: false as const,
      collisionFreeClaim: false as const,
      verifiedClaim: false as const,
      scientificClaim: false as const,
      globalM0fGo: false as const,
    },
  });
}

/** Creates portable positive witnesses for every producer-detected crossing. */
export function createStaticRationalTriangleNonadjacentCrossingWitnessesV1(
  supplied: unknown,
): StaticRationalTriangleNonadjacentCrossingWitnessResultV1 {
  const analysis = analyzeStaticRationalTriangleFoldMeshStrataV1(supplied);
  if (!analysis.ok) {
    return deepFreezeOwned({
      ok: false as const,
      error: analysis.error.map((entry) => ({
        stage: 'analysis' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
      })),
    });
  }
  try {
    return buildWitnessSet(analysis.value);
  } catch {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          stage: 'witness' as const,
          path: '$',
          code: 'witness-construction-failed',
          message: 'crossing witness construction failed closed unexpectedly',
        },
      ],
    });
  }
}
