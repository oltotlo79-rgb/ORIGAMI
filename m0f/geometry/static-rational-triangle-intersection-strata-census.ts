import { deepFreezeOwned } from '../clone-and-freeze.js';
import { equalProjectivePoints3 } from '../reference-verifier/projective-rational-3d.js';
import {
  parseStaticRationalTriangleOverlapCensusInputV1,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS,
  type StaticRationalTriangleIncidenceClassV1,
  type StaticRationalTriangleOverlapCensusInputV1,
  type StaticRationalTriangleOverlapCensusIssueCode,
  type StaticRationalTriangleOverlapCensusIssueV1,
} from './static-rational-triangle-overlap-census.js';
import type { StaticRationalTriangle3 } from './static-rational-triangle-overlap.js';
import {
  classifyStaticRationalTriangleIntersectionStrataV1,
  type StaticRationalTriangleIntersectionCharacter,
  type StaticRationalTriangleIntersectionStrataRecordV1,
  type StaticRationalTriangleLocusRelativeLocation,
} from './static-rational-triangle-intersection-strata.js';

export const STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_CENSUS_LIMITS = deepFreezeOwned({
  maxTriangles: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxTriangles,
  maxPairs: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxPairs,
  maxIssues: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxIssues,
});

export type StaticRationalTriangleIntersectionStrataCensusPairV1 = Readonly<{
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  sharedCanonicalVertexCount: 0 | 1 | 2 | 3;
  incidenceBasis: 'shared-canonical-vertex-count-only-not-mesh-topology';
  incidenceClass: StaticRationalTriangleIncidenceClassV1;
  character: StaticRationalTriangleIntersectionCharacter;
  triangleARelativeLocation: StaticRationalTriangleLocusRelativeLocation;
  triangleBRelativeLocation: StaticRationalTriangleLocusRelativeLocation;
  staticInteriorInteriorIntersectionDetected: boolean;
  staticContactCandidate: boolean;
  coplanarAreaOverlapDetected: boolean;
  requiresMotionSideHistory: boolean;
  requiresLayerOrder: boolean;
  strata: StaticRationalTriangleIntersectionStrataRecordV1;
}>;

export type StaticRationalTriangleIntersectionStrataCensusRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-static-rational-triangle-intersection-strata-census';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-static-configuration-all-unordered-closed-triangle-pairs';
  arithmetic: 'exact-projective-rational-bigint-with-bounded-safe-integer-counts';
  triangleOrder: 'triangle-id-code-unit';
  pairOrder: 'first-triangle-id-then-second-triangle-id-code-unit';
  incidenceBasis: 'shared-canonical-vertex-count-only-not-mesh-topology';
  triangleIds: readonly string[];
  triangleCount: number;
  unorderedPairCount: number;
  disjointPairCount: number;
  staticInteriorInteriorIntersectionPairCount: number;
  staticContactCandidatePairCount: number;
  coplanarAreaOverlapPairCount: number;
  requiresMotionSideHistoryPairCount: number;
  requiresLayerOrderPairCount: number;
  nonincidentPairCount: number;
  sharedVertexPairCount: number;
  sharedEdgePairCount: number;
  coincidentTrianglePairCount: number;
  pairs: readonly StaticRationalTriangleIntersectionStrataCensusPairV1[];
  allUnorderedPairsIncluded: true;
  silentPairExclusionIncluded: false;
  relativeInteriorStrataIncluded: true;
  exactIntersectionLocusIncluded: true;
  staticInteriorIntersectionEvidenceIncluded: true;
  meshIdentityBindingIncluded: false;
  declaredIncidencePolicyIncluded: false;
  legalContactClassificationIncluded: false;
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

export type StaticRationalTriangleIntersectionStrataCensusIssueCode =
  | StaticRationalTriangleOverlapCensusIssueCode
  | 'strata-classifier-failure-invariant'
  | 'internal-count-invariant';

export type StaticRationalTriangleIntersectionStrataCensusIssueV1 = Readonly<{
  path: string;
  code: StaticRationalTriangleIntersectionStrataCensusIssueCode;
  message: string;
  sourceCode?: string;
}>;

export type StaticRationalTriangleIntersectionStrataCensusResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleIntersectionStrataCensusRecordV1 }>
  | Readonly<{
      ok: false;
      error: readonly StaticRationalTriangleIntersectionStrataCensusIssueV1[];
    }>;

function copiedParseFailure(
  issues: readonly StaticRationalTriangleOverlapCensusIssueV1[],
): StaticRationalTriangleIntersectionStrataCensusResultV1 {
  return deepFreezeOwned({ ok: false as const, error: issues.map((issue) => ({ ...issue })) });
}

function failure(
  path: string,
  code: StaticRationalTriangleIntersectionStrataCensusIssueCode,
  message: string,
  sourceCode?: string,
): StaticRationalTriangleIntersectionStrataCensusResultV1 {
  return deepFreezeOwned({
    ok: false as const,
    error: [
      sourceCode === undefined ? { path, code, message } : { path, code, message, sourceCode },
    ],
  });
}

function sharedCanonicalVertexCount(
  first: StaticRationalTriangle3,
  second: StaticRationalTriangle3,
): 0 | 1 | 2 | 3 {
  let count = 0;
  for (const firstVertex of first) {
    if (second.some((secondVertex) => equalProjectivePoints3(firstVertex, secondVertex)))
      count += 1;
  }
  if (count === 0 || count === 1 || count === 2 || count === 3) return count;
  throw new RangeError('two triangles cannot share more than three canonical vertices');
}

function incidenceClass(count: 0 | 1 | 2 | 3): StaticRationalTriangleIncidenceClassV1 {
  return count === 0
    ? 'nonincident'
    : count === 1
      ? 'shared-vertex'
      : count === 2
        ? 'shared-edge'
        : 'coincident-triangle';
}

function expectedPairCount(triangleCount: number): number {
  return triangleCount < 2 ? 0 : (triangleCount * (triangleCount - 1)) / 2;
}

function isProjectivePointRecord(supplied: unknown): boolean {
  if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) return false;
  const point = supplied as Record<string, unknown>;
  return (
    typeof point.x === 'bigint' &&
    typeof point.y === 'bigint' &&
    typeof point.z === 'bigint' &&
    typeof point.w === 'bigint' &&
    point.w > 0n
  );
}

function isExpectedLocusRecord(supplied: unknown): boolean {
  if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) return false;
  const locus = supplied as Record<string, unknown>;
  const relation = locus.supportingPlaneRelation;
  const kind = locus.locusKind;
  const vertices = locus.vertices;
  const classification = locus.derivedStaticClassification;
  if (
    (relation !== 'coplanar' &&
      relation !== 'parallel-distinct' &&
      relation !== 'intersecting-planes') ||
    (kind !== 'empty' && kind !== 'point' && kind !== 'segment' && kind !== 'coplanar-polygon') ||
    !Array.isArray(vertices) ||
    !vertices.every(isProjectivePointRecord)
  ) {
    return false;
  }
  const expectedVertexCount =
    kind === 'empty' ? 0 : kind === 'point' ? 1 : kind === 'segment' ? 2 : undefined;
  if (
    (expectedVertexCount === undefined
      ? vertices.length < 3 || vertices.length > 6
      : vertices.length !== expectedVertexCount) ||
    (relation === 'coplanar') !== (locus.canonicalProjectionDropAxis !== null) ||
    (relation === 'coplanar' &&
      locus.canonicalProjectionDropAxis !== 'x' &&
      locus.canonicalProjectionDropAxis !== 'y' &&
      locus.canonicalProjectionDropAxis !== 'z') ||
    (relation === 'parallel-distinct' && kind !== 'empty') ||
    (kind === 'coplanar-polygon') !== (relation === 'coplanar' && vertices.length >= 3) ||
    (classification !== 'disjoint' &&
      classification !== 'intersecting-coplanar' &&
      classification !== 'intersecting-noncoplanar') ||
    classification !==
      (kind === 'empty'
        ? 'disjoint'
        : relation === 'coplanar'
          ? 'intersecting-coplanar'
          : 'intersecting-noncoplanar')
  ) {
    return false;
  }
  return (
    locus.schemaVersion === 1 &&
    locus.recordType === 'm0f-static-rational-triangle-intersection-locus' &&
    locus.contractStatus === 'candidate-no-claim' &&
    locus.predicateScope === 'one-static-configuration-of-two-closed-triangles' &&
    locus.arithmetic === 'exact-projective-rational-bigint' &&
    locus.closedTrianglesIntersect === (kind !== 'empty') &&
    locus.boundaryContactCountsAsIntersection === true &&
    locus.rawGeometricLocusIncluded === true &&
    locus.staticPredicateIncluded === true &&
    locus.meshIdentityBindingIncluded === false &&
    locus.sourceEvidenceBindingIncluded === false &&
    locus.declaredHingePolicyIncluded === false &&
    locus.legalContactClassificationIncluded === false &&
    locus.penetrationClassificationIncluded === false &&
    locus.selfIntersectionClassificationIncluded === false &&
    locus.independentAuditIncluded === false &&
    locus.continuousTimeIncluded === false &&
    locus.continuousCollisionDetectionIncluded === false &&
    locus.rigidMotionIntervalIncluded === false &&
    locus.collisionFreeClaim === false &&
    locus.verifiedClaim === false &&
    locus.scientificClaim === false &&
    locus.globalM0fGo === false
  );
}

function isExpectedStrataRecord(
  supplied: unknown,
): supplied is StaticRationalTriangleIntersectionStrataRecordV1 {
  if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) return false;
  const record = supplied as Record<string, unknown>;
  const character = record.character;
  const triangleALocation = record.triangleARelativeLocation;
  const triangleBLocation = record.triangleBRelativeLocation;
  if (
    (character !== 'disjoint' &&
      character !== 'noncoplanar-point-contact-candidate' &&
      character !== 'noncoplanar-boundary-supported-segment-contact-candidate' &&
      character !== 'noncoplanar-interior-interior-segment-intersection' &&
      character !== 'coplanar-point-contact-candidate' &&
      character !== 'coplanar-segment-contact-candidate' &&
      character !== 'coplanar-area-overlap-requires-layer-order') ||
    (triangleALocation !== 'none' &&
      triangleALocation !== 'vertex' &&
      triangleALocation !== 'edge' &&
      triangleALocation !== 'interior') ||
    (triangleBLocation !== 'none' &&
      triangleBLocation !== 'vertex' &&
      triangleBLocation !== 'edge' &&
      triangleBLocation !== 'interior') ||
    !isExpectedLocusRecord(record.locus)
  ) {
    return false;
  }
  const locus = record.locus as StaticRationalTriangleIntersectionStrataRecordV1['locus'];
  const isDisjoint = character === 'disjoint';
  const isInterior = character === 'noncoplanar-interior-interior-segment-intersection';
  const isArea = character === 'coplanar-area-overlap-requires-layer-order';
  const isContact = !isDisjoint && !isInterior && !isArea;
  const expectedLocusKind =
    character === 'disjoint'
      ? 'empty'
      : character === 'noncoplanar-point-contact-candidate' ||
          character === 'coplanar-point-contact-candidate'
        ? 'point'
        : character === 'coplanar-area-overlap-requires-layer-order'
          ? 'coplanar-polygon'
          : 'segment';
  const expectedSample =
    expectedLocusKind === 'empty'
      ? 'none'
      : expectedLocusKind === 'point'
        ? 'locus-point'
        : expectedLocusKind === 'coplanar-polygon'
          ? 'area-interior'
          : 'open-segment-midpoint';
  const expectsCoplanar = character.startsWith('coplanar-');
  if (
    locus.locusKind !== expectedLocusKind ||
    (!isDisjoint && (locus.supportingPlaneRelation === 'coplanar') !== expectsCoplanar) ||
    record.relativeLocationSample !== expectedSample ||
    record.staticInteriorInteriorIntersectionDetected !== isInterior ||
    record.staticContactCandidate !== isContact ||
    record.coplanarAreaOverlapDetected !== isArea ||
    record.requiresMotionSideHistory !== (isContact || isArea) ||
    record.requiresLayerOrder !== isArea ||
    (isDisjoint && (triangleALocation !== 'none' || triangleBLocation !== 'none')) ||
    (!isDisjoint && (triangleALocation === 'none' || triangleBLocation === 'none')) ||
    ((isInterior || isArea) &&
      (triangleALocation !== 'interior' || triangleBLocation !== 'interior')) ||
    (isContact && triangleALocation === 'interior' && triangleBLocation === 'interior')
  ) {
    return false;
  }
  return (
    record.schemaVersion === 1 &&
    record.recordType === 'm0f-static-rational-triangle-intersection-strata' &&
    record.contractStatus === 'candidate-no-claim' &&
    record.predicateScope === 'one-static-configuration-of-two-closed-triangles' &&
    record.arithmetic === 'exact-projective-rational-bigint' &&
    record.meshIdentityBindingIncluded === false &&
    record.declaredIncidencePolicyIncluded === false &&
    record.legalContactClassificationIncluded === false &&
    record.penetrationClassificationIncluded === false &&
    record.selfIntersectionClassificationIncluded === false &&
    record.continuousTimeIncluded === false &&
    record.continuousCollisionDetectionIncluded === false &&
    record.collisionFreeClaim === false &&
    record.verifiedClaim === false &&
    record.scientificClaim === false &&
    record.globalM0fGo === false
  );
}

function classifyPair(
  firstTriangle: StaticRationalTriangle3,
  secondTriangle: StaticRationalTriangle3,
):
  | Readonly<{ ok: true; value: StaticRationalTriangleIntersectionStrataRecordV1 }>
  | Readonly<{ ok: false; sourceCode?: string }> {
  try {
    const classified = classifyStaticRationalTriangleIntersectionStrataV1({
      triangleA: firstTriangle,
      triangleB: secondTriangle,
    });
    if (!classified.ok) {
      const sourceCode = classified.error[0]?.code;
      return sourceCode === undefined
        ? Object.freeze({ ok: false as const })
        : Object.freeze({ ok: false as const, sourceCode });
    }
    if (!isExpectedStrataRecord(classified.value)) {
      return Object.freeze({ ok: false as const, sourceCode: 'strata-record-contract' });
    }
    if (
      (classified.value.locus.derivedStaticClassification === 'disjoint') !==
        (classified.value.character === 'disjoint') ||
      classified.value.locus.closedTrianglesIntersect ===
        (classified.value.character === 'disjoint') ||
      classified.value.staticInteriorInteriorIntersectionDetected !==
        (classified.value.character === 'noncoplanar-interior-interior-segment-intersection') ||
      classified.value.coplanarAreaOverlapDetected !==
        (classified.value.character === 'coplanar-area-overlap-requires-layer-order')
    ) {
      return Object.freeze({ ok: false as const, sourceCode: 'strata-record-invariant' });
    }
    return classified;
  } catch {
    return Object.freeze({ ok: false as const, sourceCode: 'unexpected-strata-exception' });
  }
}

/**
 * Enumerates and retains every unordered pair in one bounded static triangle
 * set. No topology exclusion or contact-policy promotion is performed.
 */
export function computeStaticRationalTriangleIntersectionStrataCensusV1(
  supplied: unknown,
): StaticRationalTriangleIntersectionStrataCensusResultV1 {
  const parsed = parseStaticRationalTriangleOverlapCensusInputV1(supplied);
  if (!parsed.ok) return copiedParseFailure(parsed.error);
  const input: StaticRationalTriangleOverlapCensusInputV1 = parsed.value;
  const pairs: StaticRationalTriangleIntersectionStrataCensusPairV1[] = [];
  let disjointPairCount = 0;
  let staticInteriorInteriorIntersectionPairCount = 0;
  let staticContactCandidatePairCount = 0;
  let coplanarAreaOverlapPairCount = 0;
  let requiresMotionSideHistoryPairCount = 0;
  let requiresLayerOrderPairCount = 0;
  let nonincidentPairCount = 0;
  let sharedVertexPairCount = 0;
  let sharedEdgePairCount = 0;
  let coincidentTrianglePairCount = 0;

  for (let firstIndex = 0; firstIndex < input.triangles.length; firstIndex += 1) {
    const first = input.triangles[firstIndex];
    if (first === undefined) {
      return failure(
        '$.triangles',
        'internal-count-invariant',
        'canonical triangle order contains a missing first entry',
      );
    }
    for (let secondIndex = firstIndex + 1; secondIndex < input.triangles.length; secondIndex += 1) {
      const second = input.triangles[secondIndex];
      if (second === undefined) {
        return failure(
          '$.triangles',
          'internal-count-invariant',
          'canonical triangle order contains a missing second entry',
        );
      }
      const classified = classifyPair(first.triangle, second.triangle);
      if (!classified.ok) {
        return failure(
          `$.pairs[${first.triangleId},${second.triangleId}]`,
          'strata-classifier-failure-invariant',
          'one canonical triangle pair did not produce the fixed exact strata record',
          classified.sourceCode,
        );
      }
      const shared = sharedCanonicalVertexCount(first.triangle, second.triangle);
      const incidence = incidenceClass(shared);
      if (
        (shared > 0 && classified.value.character === 'disjoint') ||
        (shared === 3 &&
          classified.value.character !== 'coplanar-area-overlap-requires-layer-order')
      ) {
        return failure(
          `$.pairs[${first.triangleId},${second.triangleId}]`,
          'strata-classifier-failure-invariant',
          'one canonical triangle pair produced an incidence-impossible strata record',
          'strata-incidence-invariant',
        );
      }
      if (incidence === 'nonincident') nonincidentPairCount += 1;
      else if (incidence === 'shared-vertex') sharedVertexPairCount += 1;
      else if (incidence === 'shared-edge') sharedEdgePairCount += 1;
      else coincidentTrianglePairCount += 1;

      const strata = classified.value;
      if (strata.character === 'disjoint') disjointPairCount += 1;
      if (strata.staticInteriorInteriorIntersectionDetected) {
        staticInteriorInteriorIntersectionPairCount += 1;
      }
      if (strata.staticContactCandidate) staticContactCandidatePairCount += 1;
      if (strata.coplanarAreaOverlapDetected) coplanarAreaOverlapPairCount += 1;
      if (strata.requiresMotionSideHistory) requiresMotionSideHistoryPairCount += 1;
      if (strata.requiresLayerOrder) requiresLayerOrderPairCount += 1;

      pairs.push({
        pairIndex: pairs.length,
        firstTriangleId: first.triangleId,
        secondTriangleId: second.triangleId,
        sharedCanonicalVertexCount: shared,
        incidenceBasis: 'shared-canonical-vertex-count-only-not-mesh-topology',
        incidenceClass: incidence,
        character: strata.character,
        triangleARelativeLocation: strata.triangleARelativeLocation,
        triangleBRelativeLocation: strata.triangleBRelativeLocation,
        staticInteriorInteriorIntersectionDetected:
          strata.staticInteriorInteriorIntersectionDetected,
        staticContactCandidate: strata.staticContactCandidate,
        coplanarAreaOverlapDetected: strata.coplanarAreaOverlapDetected,
        requiresMotionSideHistory: strata.requiresMotionSideHistory,
        requiresLayerOrder: strata.requiresLayerOrder,
        strata,
      });
    }
  }

  const unorderedPairCount = expectedPairCount(input.triangles.length);
  const incidencePairCount =
    nonincidentPairCount +
    sharedVertexPairCount +
    sharedEdgePairCount +
    coincidentTrianglePairCount;
  const characterPairCount =
    disjointPairCount +
    staticInteriorInteriorIntersectionPairCount +
    staticContactCandidatePairCount +
    coplanarAreaOverlapPairCount;
  if (
    pairs.length !== unorderedPairCount ||
    incidencePairCount !== unorderedPairCount ||
    characterPairCount !== unorderedPairCount ||
    requiresLayerOrderPairCount !== coplanarAreaOverlapPairCount ||
    requiresMotionSideHistoryPairCount !==
      staticContactCandidatePairCount + coplanarAreaOverlapPairCount
  ) {
    return failure(
      '$.pairs',
      'internal-count-invariant',
      'complete pair ledger and exact safe-integer counters disagree',
    );
  }

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: 'm0f-static-rational-triangle-intersection-strata-census' as const,
      contractStatus: 'candidate-no-claim' as const,
      predicateScope: 'one-static-configuration-all-unordered-closed-triangle-pairs' as const,
      arithmetic: 'exact-projective-rational-bigint-with-bounded-safe-integer-counts' as const,
      triangleOrder: 'triangle-id-code-unit' as const,
      pairOrder: 'first-triangle-id-then-second-triangle-id-code-unit' as const,
      incidenceBasis: 'shared-canonical-vertex-count-only-not-mesh-topology' as const,
      triangleIds: input.triangles.map((entry) => entry.triangleId),
      triangleCount: input.triangles.length,
      unorderedPairCount,
      disjointPairCount,
      staticInteriorInteriorIntersectionPairCount,
      staticContactCandidatePairCount,
      coplanarAreaOverlapPairCount,
      requiresMotionSideHistoryPairCount,
      requiresLayerOrderPairCount,
      nonincidentPairCount,
      sharedVertexPairCount,
      sharedEdgePairCount,
      coincidentTrianglePairCount,
      pairs,
      allUnorderedPairsIncluded: true as const,
      silentPairExclusionIncluded: false as const,
      relativeInteriorStrataIncluded: true as const,
      exactIntersectionLocusIncluded: true as const,
      staticInteriorIntersectionEvidenceIncluded: true as const,
      meshIdentityBindingIncluded: false as const,
      declaredIncidencePolicyIncluded: false as const,
      legalContactClassificationIncluded: false as const,
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
