import {
  constructStaticRationalTriangleIntersectionLocusV1,
  parseStaticRationalTriangleIntersectionLocusInputV1,
  STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS,
  type StaticRationalTriangleIntersectionLocusInputV1,
  type StaticRationalTriangleIntersectionLocusIssue,
  type StaticRationalTriangleIntersectionLocusRecordV1,
} from './static-rational-triangle-intersection-locus.js';
import type { StaticRationalTriangle3 } from './static-rational-triangle-overlap.js';
import {
  canonicalProjectivePoint3,
  equalProjectivePoints3,
  projectiveAxisDropOrient2DSign,
  projectivePlaneThrough3,
  type ProjectiveAxis3,
  type ProjectivePoint3,
} from '../reference-verifier/projective-rational-3d.js';

export const STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_LIMITS = Object.freeze({
  maxMidpointIntermediateBits:
    STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxIntermediateArithmeticBits,
} as const);

export type StaticRationalTriangleLocusRelativeLocation = 'none' | 'vertex' | 'edge' | 'interior';

export type StaticRationalTriangleIntersectionCharacter =
  | 'disjoint'
  | 'noncoplanar-point-contact-candidate'
  | 'noncoplanar-boundary-supported-segment-contact-candidate'
  | 'noncoplanar-interior-interior-segment-intersection'
  | 'coplanar-point-contact-candidate'
  | 'coplanar-segment-contact-candidate'
  | 'coplanar-area-overlap-requires-layer-order';

export type StaticRationalTriangleIntersectionStrataIssue =
  | StaticRationalTriangleIntersectionLocusIssue
  | Readonly<{
      path: '$';
      code: 'midpoint-arithmetic-limit-exceeded' | 'strata-invariant-failed';
      message: string;
    }>;

export type StaticRationalTriangleIntersectionStrataRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-static-rational-triangle-intersection-strata';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-static-configuration-of-two-closed-triangles';
  arithmetic: 'exact-projective-rational-bigint';
  locus: StaticRationalTriangleIntersectionLocusRecordV1;
  character: StaticRationalTriangleIntersectionCharacter;
  triangleARelativeLocation: StaticRationalTriangleLocusRelativeLocation;
  triangleBRelativeLocation: StaticRationalTriangleLocusRelativeLocation;
  relativeLocationSample: 'none' | 'locus-point' | 'open-segment-midpoint' | 'area-interior';
  staticInteriorInteriorIntersectionDetected: boolean;
  staticContactCandidate: boolean;
  coplanarAreaOverlapDetected: boolean;
  requiresMotionSideHistory: boolean;
  requiresLayerOrder: boolean;
  meshIdentityBindingIncluded: false;
  declaredIncidencePolicyIncluded: false;
  legalContactClassificationIncluded: false;
  penetrationClassificationIncluded: false;
  selfIntersectionClassificationIncluded: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type StaticRationalTriangleIntersectionStrataResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleIntersectionStrataRecordV1 }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleIntersectionStrataIssue[] }>;

class StrataFailure extends Error {
  readonly code: 'midpoint-arithmetic-limit-exceeded' | 'strata-invariant-failed';

  constructor(code: StrataFailure['code'], message: string) {
    super(message);
    this.name = 'StaticRationalTriangleIntersectionStrataFailure';
    this.code = code;
  }
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function bitLength(value: bigint): number {
  const magnitude = absolute(value);
  return magnitude === 0n ? 0 : magnitude.toString(2).length;
}

function dominantPlaneAxis(triangle: StaticRationalTriangle3): ProjectiveAxis3 {
  const plane = projectivePlaneThrough3(triangle[0], triangle[1], triangle[2]);
  let axis: ProjectiveAxis3 = 'x';
  let magnitude = absolute(plane.a);
  if (absolute(plane.b) > magnitude) {
    axis = 'y';
    magnitude = absolute(plane.b);
  }
  if (absolute(plane.c) > magnitude) axis = 'z';
  return axis;
}

function relativeLocation(
  point: ProjectivePoint3,
  triangle: StaticRationalTriangle3,
): Exclude<StaticRationalTriangleLocusRelativeLocation, 'none'> {
  if (triangle.some((vertex) => equalProjectivePoints3(vertex, point))) return 'vertex';
  const drop = dominantPlaneAxis(triangle);
  const signs = [
    projectiveAxisDropOrient2DSign(triangle[0], triangle[1], point, drop),
    projectiveAxisDropOrient2DSign(triangle[1], triangle[2], point, drop),
    projectiveAxisDropOrient2DSign(triangle[2], triangle[0], point, drop),
  ] as const;
  const hasPositive = signs.some((value) => value > 0);
  const hasNegative = signs.some((value) => value < 0);
  if (hasPositive && hasNegative) {
    throw new StrataFailure(
      'strata-invariant-failed',
      'the locus sample is outside one source triangle',
    );
  }
  return signs.some((value) => value === 0) ? 'edge' : 'interior';
}

function checkedMidpoint(first: ProjectivePoint3, second: ProjectivePoint3): ProjectivePoint3 {
  const coordinates = {
    x: first.x * second.w + second.x * first.w,
    y: first.y * second.w + second.y * first.w,
    z: first.z * second.w + second.z * first.w,
    w: 2n * first.w * second.w,
  };
  if (
    Object.values(coordinates).some(
      (value) =>
        bitLength(value) >
        STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_LIMITS.maxMidpointIntermediateBits,
    )
  ) {
    throw new StrataFailure(
      'midpoint-arithmetic-limit-exceeded',
      'the exact open-segment midpoint exceeds the defensive arithmetic boundary',
    );
  }
  return canonicalProjectivePoint3(coordinates.x, coordinates.y, coordinates.z, coordinates.w);
}

function failure(caught: StrataFailure): StaticRationalTriangleIntersectionStrataResultV1 {
  return Object.freeze({
    ok: false as const,
    error: Object.freeze([
      Object.freeze({ path: '$' as const, code: caught.code, message: caught.message }),
    ]),
  });
}

function makeRecord(
  input: StaticRationalTriangleIntersectionLocusInputV1,
  locus: StaticRationalTriangleIntersectionLocusRecordV1,
): StaticRationalTriangleIntersectionStrataRecordV1 {
  let character: StaticRationalTriangleIntersectionCharacter;
  let triangleARelativeLocation: StaticRationalTriangleLocusRelativeLocation = 'none';
  let triangleBRelativeLocation: StaticRationalTriangleLocusRelativeLocation = 'none';
  let relativeLocationSample: StaticRationalTriangleIntersectionStrataRecordV1['relativeLocationSample'] =
    'none';
  let staticInteriorInteriorIntersectionDetected = false;
  let staticContactCandidate = false;
  let coplanarAreaOverlapDetected = false;
  let requiresMotionSideHistory = false;
  let requiresLayerOrder = false;

  if (locus.locusKind === 'empty') {
    character = 'disjoint';
  } else if (locus.locusKind === 'coplanar-polygon') {
    character = 'coplanar-area-overlap-requires-layer-order';
    triangleARelativeLocation = 'interior';
    triangleBRelativeLocation = 'interior';
    relativeLocationSample = 'area-interior';
    coplanarAreaOverlapDetected = true;
    requiresMotionSideHistory = true;
    requiresLayerOrder = true;
  } else {
    const firstVertex = locus.vertices[0];
    if (firstVertex === undefined) {
      throw new StrataFailure('strata-invariant-failed', 'the nonempty locus has no sample point');
    }
    let sample = firstVertex;
    if (locus.locusKind === 'segment') {
      const secondVertex = locus.vertices[1];
      if (secondVertex === undefined) {
        throw new StrataFailure(
          'strata-invariant-failed',
          'the segment locus has no second endpoint',
        );
      }
      sample = checkedMidpoint(firstVertex, secondVertex);
    }
    triangleARelativeLocation = relativeLocation(sample, input.triangleA);
    triangleBRelativeLocation = relativeLocation(sample, input.triangleB);
    relativeLocationSample = locus.locusKind === 'point' ? 'locus-point' : 'open-segment-midpoint';
    requiresMotionSideHistory = true;

    if (
      triangleARelativeLocation === 'interior' &&
      triangleBRelativeLocation === 'interior' &&
      (locus.locusKind === 'point' || locus.supportingPlaneRelation === 'coplanar')
    ) {
      throw new StrataFailure(
        'strata-invariant-failed',
        'a zero-area locus cannot be relatively interior to both coplanar triangles, and an interior-interior noncoplanar point must extend to a segment',
      );
    }

    if (locus.supportingPlaneRelation === 'coplanar') {
      character =
        locus.locusKind === 'point'
          ? 'coplanar-point-contact-candidate'
          : 'coplanar-segment-contact-candidate';
      staticContactCandidate = true;
    } else if (locus.locusKind === 'point') {
      character = 'noncoplanar-point-contact-candidate';
      staticContactCandidate = true;
    } else if (
      triangleARelativeLocation === 'interior' &&
      triangleBRelativeLocation === 'interior'
    ) {
      character = 'noncoplanar-interior-interior-segment-intersection';
      staticInteriorInteriorIntersectionDetected = true;
      requiresMotionSideHistory = false;
    } else {
      character = 'noncoplanar-boundary-supported-segment-contact-candidate';
      staticContactCandidate = true;
    }
  }

  return Object.freeze({
    schemaVersion: 1 as const,
    recordType: 'm0f-static-rational-triangle-intersection-strata' as const,
    contractStatus: 'candidate-no-claim' as const,
    predicateScope: 'one-static-configuration-of-two-closed-triangles' as const,
    arithmetic: 'exact-projective-rational-bigint' as const,
    locus,
    character,
    triangleARelativeLocation,
    triangleBRelativeLocation,
    relativeLocationSample,
    staticInteriorInteriorIntersectionDetected,
    staticContactCandidate,
    coplanarAreaOverlapDetected,
    requiresMotionSideHistory,
    requiresLayerOrder,
    meshIdentityBindingIncluded: false as const,
    declaredIncidencePolicyIncluded: false as const,
    legalContactClassificationIncluded: false as const,
    penetrationClassificationIncluded: false as const,
    selfIntersectionClassificationIncluded: false as const,
    continuousTimeIncluded: false as const,
    continuousCollisionDetectionIncluded: false as const,
    collisionFreeClaim: false as const,
    verifiedClaim: false as const,
    scientificClaim: false as const,
    globalM0fGo: false as const,
  });
}

/**
 * Refines one exact static locus by relative triangle interior/boundary strata.
 * It deliberately leaves contact legality and every continuous-time decision
 * to later topology, side-history, and layer-order contracts.
 */
export function classifyStaticRationalTriangleIntersectionStrataV1(
  supplied: unknown,
): StaticRationalTriangleIntersectionStrataResultV1 {
  const parsed = parseStaticRationalTriangleIntersectionLocusInputV1(supplied);
  if (!parsed.ok) return parsed;
  const locus = constructStaticRationalTriangleIntersectionLocusV1(parsed.value);
  if (!locus.ok) return locus;
  try {
    return Object.freeze({ ok: true as const, value: makeRecord(parsed.value, locus.value) });
  } catch (caught) {
    return failure(
      caught instanceof StrataFailure
        ? caught
        : new StrataFailure(
            'strata-invariant-failed',
            'static exact triangle intersection-strata classification failed closed unexpectedly',
          ),
    );
  }
}
