import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  equalProjectivePoints3,
  type ProjectivePoint3,
} from '../reference-verifier/projective-rational-3d.js';
import {
  bindStaticRationalTrianglePoseToFoldMeshV1,
  type StaticRationalTriangleFoldMeshBindingEdgeV1,
  type StaticRationalTriangleFoldMeshBindingPairV1,
  type StaticRationalTriangleFoldMeshBindingRecordV1,
} from './static-rational-triangle-fold-mesh-binding.js';
import {
  computeStaticRationalTriangleIntersectionStrataCensusV1,
  type StaticRationalTriangleIntersectionStrataCensusPairV1,
  type StaticRationalTriangleIntersectionStrataCensusRecordV1,
} from './static-rational-triangle-intersection-strata-census.js';

export type StaticRationalTriangleFoldMeshStrataCategoryV1 =
  | 'disjoint'
  | 'same-face-triangulation-contact-candidate'
  | 'same-face-unexpected-intersection-evidence'
  | 'declared-hinge-contact-contained-candidate'
  | 'declared-hinge-off-axis-intersection-evidence'
  | 'nonadjacent-static-interior-crossing-evidence'
  | 'nonadjacent-contact-requires-motion-history'
  | 'nonadjacent-coplanar-area-requires-layer-order';

export type StaticRationalTriangleFoldMeshStrataPairV1 = Readonly<{
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  firstFaceId: string;
  secondFaceId: string;
  category: StaticRationalTriangleFoldMeshStrataCategoryV1;
  declaredHingeLocusContained: boolean;
  sharedTriangulationFeatureLocusContained: boolean;
  staticNonadjacentInteriorCrossingDetected: boolean;
  requiresMotionSideHistory: boolean;
  requiresLayerOrder: boolean;
  topology: StaticRationalTriangleFoldMeshBindingPairV1;
  strata: StaticRationalTriangleIntersectionStrataCensusPairV1;
}>;

export type StaticRationalTriangleFoldMeshStrataRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-static-rational-triangle-fold-mesh-strata';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-bound-fold-mesh-at-one-exact-static-3d-pose';
  arithmetic: 'exact-projective-rational-bigint';
  meshRevisionId: string;
  triangulationRevisionId: string;
  poseRevisionId: string;
  triangleCount: number;
  unorderedPairCount: number;
  disjointPairCount: number;
  sameFaceTriangulationContactCandidatePairCount: number;
  sameFaceUnexpectedIntersectionEvidencePairCount: number;
  declaredHingeContactContainedCandidatePairCount: number;
  declaredHingeOffAxisIntersectionEvidencePairCount: number;
  nonadjacentStaticInteriorCrossingEvidencePairCount: number;
  nonadjacentContactRequiresMotionHistoryPairCount: number;
  nonadjacentCoplanarAreaRequiresLayerOrderPairCount: number;
  staticNonadjacentInteriorCrossingDetected: boolean;
  pairs: readonly StaticRationalTriangleFoldMeshStrataPairV1[];
  binding: StaticRationalTriangleFoldMeshBindingRecordV1;
  strataCensus: StaticRationalTriangleIntersectionStrataCensusRecordV1;
  allUnorderedPairsIncluded: true;
  meshIdentityJoinedToExactStrata: true;
  declaredHingeLocusContainmentIncluded: true;
  sameFaceTriangulationContactSeparated: true;
  staticSelfIntersectionEvidenceIncluded: true;
  cryptographicSourceRevisionBindingIncluded: false;
  productStableIdentityIncluded: false;
  legalContactPolicyIncluded: false;
  motionSideHistoryIncluded: false;
  layerOrderDecisionIncluded: false;
  penetrationClassificationIncluded: false;
  selfIntersectionDecisionIncluded: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  isSupportProfile: false;
  supportClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type StaticRationalTriangleFoldMeshStrataIssueV1 = Readonly<{
  stage: 'binding' | 'strata-census' | 'join';
  path: string;
  code: string;
  message: string;
}>;

export type StaticRationalTriangleFoldMeshStrataResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleFoldMeshStrataRecordV1 }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleFoldMeshStrataIssueV1[] }>;

type Segment3 = readonly [ProjectivePoint3, ProjectivePoint3];

function failure(
  stage: StaticRationalTriangleFoldMeshStrataIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): StaticRationalTriangleFoldMeshStrataResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [{ stage, path, code, message }] });
}

function copiedBindingFailure(
  error: Extract<
    ReturnType<typeof bindStaticRationalTrianglePoseToFoldMeshV1>,
    Readonly<{ ok: false }>
  >['error'],
): StaticRationalTriangleFoldMeshStrataResultV1 {
  return deepFreezeOwned({
    ok: false as const,
    error: error.map((entry) => ({
      stage: 'binding' as const,
      path: entry.path,
      code: entry.code,
      message: entry.message,
    })),
  });
}

function copiedStrataFailure(
  error: Extract<
    ReturnType<typeof computeStaticRationalTriangleIntersectionStrataCensusV1>,
    Readonly<{ ok: false }>
  >['error'],
): StaticRationalTriangleFoldMeshStrataResultV1 {
  return deepFreezeOwned({
    ok: false as const,
    error: error.map((entry) => ({
      stage: 'strata-census' as const,
      path: entry.path,
      code: entry.code,
      message: entry.message,
    })),
  });
}

function pairKey(firstTriangleId: string, secondTriangleId: string): string {
  return `${firstTriangleId}\u0000${secondTriangleId}`;
}

function pointOnClosedSegment(point: ProjectivePoint3, segment: Segment3): boolean {
  const [first, second] = segment;
  const pointFromFirst = {
    x: point.x * first.w - first.x * point.w,
    y: point.y * first.w - first.y * point.w,
    z: point.z * first.w - first.z * point.w,
  };
  const secondFromFirst = {
    x: second.x * first.w - first.x * second.w,
    y: second.y * first.w - first.y * second.w,
    z: second.z * first.w - first.z * second.w,
  };
  if (
    pointFromFirst.x * secondFromFirst.y !== pointFromFirst.y * secondFromFirst.x ||
    pointFromFirst.x * secondFromFirst.z !== pointFromFirst.z * secondFromFirst.x ||
    pointFromFirst.y * secondFromFirst.z !== pointFromFirst.z * secondFromFirst.y
  ) {
    return false;
  }
  const axes = ['x', 'y', 'z'] as const;
  const axis = axes.find((candidate) => secondFromFirst[candidate] !== 0n);
  if (axis === undefined) return false;
  const pointMinusFirst = point[axis] * first.w - first[axis] * point.w;
  const pointMinusSecond = point[axis] * second.w - second[axis] * point.w;
  const secondMinusFirst = second[axis] * first.w - first[axis] * second.w;
  return secondMinusFirst > 0n
    ? pointMinusFirst >= 0n && pointMinusSecond <= 0n
    : pointMinusFirst <= 0n && pointMinusSecond >= 0n;
}

function locusContainedInOneSegment(
  strata: StaticRationalTriangleIntersectionStrataCensusPairV1,
  segments: readonly Segment3[],
): boolean {
  const locus = strata.strata.locus;
  if (locus.locusKind === 'empty' || locus.locusKind === 'coplanar-polygon') return false;
  return segments.some((segment) =>
    locus.vertices.every((point) => pointOnClosedSegment(point, segment)),
  );
}

function sharedTriangulationFeatureLocusContained(
  topology: StaticRationalTriangleFoldMeshBindingPairV1,
  strata: StaticRationalTriangleIntersectionStrataCensusPairV1,
  pointByVertexId: ReadonlyMap<string, ProjectivePoint3>,
): boolean {
  if (topology.pairRelation !== 'same-source-face') return false;
  const locus = strata.strata.locus;
  if (topology.sharedMeshVertexIds.length === 1 && locus.locusKind === 'point') {
    const sharedPoint = pointByVertexId.get(topology.sharedMeshVertexIds[0] ?? '');
    const locusPoint = locus.vertices[0];
    return (
      sharedPoint !== undefined &&
      locusPoint !== undefined &&
      equalProjectivePoints3(sharedPoint, locusPoint)
    );
  }
  if (
    topology.directIncidence !== 'same-face-triangulation-edge' ||
    topology.sharedMeshVertexIds.length !== 2
  )
    return false;
  const first = pointByVertexId.get(topology.sharedMeshVertexIds[0] ?? '');
  const second = pointByVertexId.get(topology.sharedMeshVertexIds[1] ?? '');
  return (
    first !== undefined &&
    second !== undefined &&
    locusContainedInOneSegment(strata, [[first, second]])
  );
}

function categoryFor(
  topology: StaticRationalTriangleFoldMeshBindingPairV1,
  strata: StaticRationalTriangleIntersectionStrataCensusPairV1,
  declaredHingeLocusContained: boolean,
  sharedTriangulationFeatureLocusContained: boolean,
): StaticRationalTriangleFoldMeshStrataCategoryV1 {
  if (strata.character === 'disjoint') return 'disjoint';
  if (topology.pairRelation === 'same-source-face') {
    return strata.staticContactCandidate && sharedTriangulationFeatureLocusContained
      ? 'same-face-triangulation-contact-candidate'
      : 'same-face-unexpected-intersection-evidence';
  }
  if (topology.pairRelation === 'declared-hinge-adjacent-faces') {
    return strata.staticContactCandidate && declaredHingeLocusContained
      ? 'declared-hinge-contact-contained-candidate'
      : 'declared-hinge-off-axis-intersection-evidence';
  }
  if (strata.staticInteriorInteriorIntersectionDetected) {
    return 'nonadjacent-static-interior-crossing-evidence';
  }
  return strata.coplanarAreaOverlapDetected
    ? 'nonadjacent-coplanar-area-requires-layer-order'
    : 'nonadjacent-contact-requires-motion-history';
}

/**
 * Joins exact static intersection strata to candidate FOLD mesh identity and
 * exact declared hinge segments. It emits evidence categories, not policy or
 * continuous-time collision decisions.
 */
export function analyzeStaticRationalTriangleFoldMeshStrataV1(
  supplied: unknown,
): StaticRationalTriangleFoldMeshStrataResultV1 {
  const bound = bindStaticRationalTrianglePoseToFoldMeshV1(supplied);
  if (!bound.ok) return copiedBindingFailure(bound.error);
  const strataCensus = computeStaticRationalTriangleIntersectionStrataCensusV1({
    triangles: bound.value.triangles.map((triangle) => ({
      triangleId: triangle.triangleId,
      triangle: triangle.triangle,
    })),
  });
  if (!strataCensus.ok) return copiedStrataFailure(strataCensus.error);
  try {
    if (
      bound.value.triangleCount !== strataCensus.value.triangleCount ||
      bound.value.unorderedPairCount !== strataCensus.value.unorderedPairCount ||
      bound.value.triangles.some(
        (triangle, index) => strataCensus.value.triangleIds[index] !== triangle.triangleId,
      )
    ) {
      return failure(
        'join',
        '$.triangles',
        'triangle-binding-mismatch',
        'bound topology and exact strata census have different canonical triangle sets',
      );
    }
    const topologyByPair = new Map(
      bound.value.pairs.map((pair) => [pairKey(pair.firstTriangleId, pair.secondTriangleId), pair]),
    );
    const edgeById = new Map(bound.value.edges.map((edge) => [edge.edgeId, edge]));
    const pointByVertexId = new Map(
      bound.value.vertices.map((vertex) => [vertex.vertexId, vertex.point]),
    );
    const pairs: StaticRationalTriangleFoldMeshStrataPairV1[] = [];
    const categoryCounts = new Map<StaticRationalTriangleFoldMeshStrataCategoryV1, number>();
    for (const strata of strataCensus.value.pairs) {
      const topology = topologyByPair.get(pairKey(strata.firstTriangleId, strata.secondTriangleId));
      if (topology === undefined || topology.pairIndex !== strata.pairIndex) {
        return failure(
          'join',
          `$.pairs[${strata.firstTriangleId},${strata.secondTriangleId}]`,
          'pair-binding-mismatch',
          'one exact strata pair has no identically indexed topology pair',
        );
      }
      const hingeSegments = topology.declaredHingeEdgeIdsForFacePair
        .map((edgeId) => edgeById.get(edgeId))
        .filter((edge): edge is StaticRationalTriangleFoldMeshBindingEdgeV1 => edge !== undefined)
        .map((edge) => edge.exactPoseSegment);
      if (hingeSegments.length !== topology.declaredHingeEdgeIdsForFacePair.length) {
        return failure(
          'join',
          `$.pairs[${strata.firstTriangleId},${strata.secondTriangleId}]`,
          'hinge-edge-binding-mismatch',
          'one topology pair references an unavailable declared hinge edge',
        );
      }
      const declaredHingeLocusContained = locusContainedInOneSegment(strata, hingeSegments);
      const sharedTriangulationFeatureContained = sharedTriangulationFeatureLocusContained(
        topology,
        strata,
        pointByVertexId,
      );
      const category = categoryFor(
        topology,
        strata,
        declaredHingeLocusContained,
        sharedTriangulationFeatureContained,
      );
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      pairs.push({
        pairIndex: pairs.length,
        firstTriangleId: strata.firstTriangleId,
        secondTriangleId: strata.secondTriangleId,
        firstFaceId: topology.firstFaceId,
        secondFaceId: topology.secondFaceId,
        category,
        declaredHingeLocusContained,
        sharedTriangulationFeatureLocusContained: sharedTriangulationFeatureContained,
        staticNonadjacentInteriorCrossingDetected:
          category === 'nonadjacent-static-interior-crossing-evidence',
        requiresMotionSideHistory: strata.requiresMotionSideHistory,
        requiresLayerOrder: strata.requiresLayerOrder,
        topology,
        strata,
      });
    }

    const count = (category: StaticRationalTriangleFoldMeshStrataCategoryV1): number =>
      categoryCounts.get(category) ?? 0;
    const disjointPairCount = count('disjoint');
    const sameFaceTriangulationContactCandidatePairCount = count(
      'same-face-triangulation-contact-candidate',
    );
    const sameFaceUnexpectedIntersectionEvidencePairCount = count(
      'same-face-unexpected-intersection-evidence',
    );
    const declaredHingeContactContainedCandidatePairCount = count(
      'declared-hinge-contact-contained-candidate',
    );
    const declaredHingeOffAxisIntersectionEvidencePairCount = count(
      'declared-hinge-off-axis-intersection-evidence',
    );
    const nonadjacentStaticInteriorCrossingEvidencePairCount = count(
      'nonadjacent-static-interior-crossing-evidence',
    );
    const nonadjacentContactRequiresMotionHistoryPairCount = count(
      'nonadjacent-contact-requires-motion-history',
    );
    const nonadjacentCoplanarAreaRequiresLayerOrderPairCount = count(
      'nonadjacent-coplanar-area-requires-layer-order',
    );
    if (
      pairs.length !== bound.value.unorderedPairCount ||
      disjointPairCount +
        sameFaceTriangulationContactCandidatePairCount +
        sameFaceUnexpectedIntersectionEvidencePairCount +
        declaredHingeContactContainedCandidatePairCount +
        declaredHingeOffAxisIntersectionEvidencePairCount +
        nonadjacentStaticInteriorCrossingEvidencePairCount +
        nonadjacentContactRequiresMotionHistoryPairCount +
        nonadjacentCoplanarAreaRequiresLayerOrderPairCount !==
        pairs.length
    ) {
      return failure(
        'join',
        '$.pairs',
        'category-count-invariant',
        'complete joined pair ledger and category counters disagree',
      );
    }

    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-static-rational-triangle-fold-mesh-strata' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope: 'one-bound-fold-mesh-at-one-exact-static-3d-pose' as const,
        arithmetic: 'exact-projective-rational-bigint' as const,
        meshRevisionId: bound.value.meshRevisionId,
        triangulationRevisionId: bound.value.triangulationRevisionId,
        poseRevisionId: bound.value.poseRevisionId,
        triangleCount: bound.value.triangleCount,
        unorderedPairCount: bound.value.unorderedPairCount,
        disjointPairCount,
        sameFaceTriangulationContactCandidatePairCount,
        sameFaceUnexpectedIntersectionEvidencePairCount,
        declaredHingeContactContainedCandidatePairCount,
        declaredHingeOffAxisIntersectionEvidencePairCount,
        nonadjacentStaticInteriorCrossingEvidencePairCount,
        nonadjacentContactRequiresMotionHistoryPairCount,
        nonadjacentCoplanarAreaRequiresLayerOrderPairCount,
        staticNonadjacentInteriorCrossingDetected:
          nonadjacentStaticInteriorCrossingEvidencePairCount > 0,
        pairs,
        binding: bound.value,
        strataCensus: strataCensus.value,
        allUnorderedPairsIncluded: true as const,
        meshIdentityJoinedToExactStrata: true as const,
        declaredHingeLocusContainmentIncluded: true as const,
        sameFaceTriangulationContactSeparated: true as const,
        staticSelfIntersectionEvidenceIncluded: true as const,
        cryptographicSourceRevisionBindingIncluded: false as const,
        productStableIdentityIncluded: false as const,
        legalContactPolicyIncluded: false as const,
        motionSideHistoryIncluded: false as const,
        layerOrderDecisionIncluded: false as const,
        penetrationClassificationIncluded: false as const,
        selfIntersectionDecisionIncluded: false as const,
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
  } catch {
    return failure(
      'join',
      '$',
      'join-invariant-failed',
      'mesh-bound exact strata composition failed closed unexpectedly',
    );
  }
}
