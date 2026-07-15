import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  auditStaticRationalTriangleOverlapCandidateV1,
  auditTrustedStaticRationalTriangleOverlapCandidateV1,
  parseStaticRationalTriangleOverlapAuditInputV1,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_INPUT_RECORD_TYPE,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS,
  type StaticRationalTriangleOverlapAuditClassification,
  type StaticRationalTriangleOverlapAuditCoordinateEncoding,
  type StaticRationalTriangleOverlapAuditInputSnapshotV1,
  type StaticRationalTriangleOverlapAuditPoint3,
  type StaticRationalTriangleOverlapAuditTriangle3,
  type StaticRationalTriangleOverlapProducerSnapshotV1,
} from '../../m0f/reference-verifier/static-rational-triangle-overlap-audit.js';
import { classifyStaticRationalTriangleOverlap } from '../../m0f/geometry/static-rational-triangle-overlap.js';

const PERMUTATIONS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
] as const;

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absolute(left);
  let b = absolute(right);
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function canonicalPoint(
  x: bigint | number,
  y: bigint | number,
  z: bigint | number,
  w: bigint | number = 1n,
): StaticRationalTriangleOverlapAuditPoint3 {
  const supplied = [BigInt(x), BigInt(y), BigInt(z), BigInt(w)] as const;
  const direction = supplied[3] < 0n ? -1n : 1n;
  const oriented = supplied.map((value) => value * direction) as [bigint, bigint, bigint, bigint];
  const divisor = greatestCommonDivisor(
    greatestCommonDivisor(oriented[0], oriented[1]),
    greatestCommonDivisor(oriented[2], oriented[3]),
  );
  return Object.freeze({
    x: oriented[0] / divisor,
    y: oriented[1] / divisor,
    z: oriented[2] / divisor,
    w: oriented[3] / divisor,
  });
}

function triangle(
  first: StaticRationalTriangleOverlapAuditPoint3,
  second: StaticRationalTriangleOverlapAuditPoint3,
  third: StaticRationalTriangleOverlapAuditPoint3,
): StaticRationalTriangleOverlapAuditTriangle3 {
  return [first, second, third];
}

const BASE = triangle(canonicalPoint(0, 0, 0), canonicalPoint(4, 0, 0), canonicalPoint(0, 4, 0));

function producerRecord(
  classification: StaticRationalTriangleOverlapAuditClassification,
): StaticRationalTriangleOverlapProducerSnapshotV1 {
  return {
    schemaVersion: 1,
    recordType: 'm0f-static-rational-triangle-overlap',
    contractStatus: 'candidate-no-claim',
    predicateScope: 'one-static-configuration-of-two-closed-triangles',
    arithmetic: 'exact-projective-rational-bigint',
    classification,
    closedTrianglesIntersect: classification !== 'disjoint',
    boundaryContactCountsAsIntersection: true,
    staticPredicateIncluded: true,
    legalContactClassificationIncluded: false,
    penetrationClassificationIncluded: false,
    collisionFreeClaim: false,
    continuousTimeIncluded: false,
    continuousCollisionDetectionIncluded: false,
    rigidMotionIntervalIncluded: false,
    verifiedClaim: false,
    globalM0fGo: false,
  };
}

function snapshotPoint(
  point: StaticRationalTriangleOverlapAuditPoint3,
  encoding: StaticRationalTriangleOverlapAuditCoordinateEncoding,
) {
  return encoding === 'bigint'
    ? { ...point }
    : {
        x: point.x.toString(),
        y: point.y.toString(),
        z: point.z.toString(),
        w: point.w.toString(),
      };
}

function snapshotTriangle(
  value: StaticRationalTriangleOverlapAuditTriangle3,
  encoding: StaticRationalTriangleOverlapAuditCoordinateEncoding,
) {
  return [
    snapshotPoint(value[0], encoding),
    snapshotPoint(value[1], encoding),
    snapshotPoint(value[2], encoding),
  ] as const;
}

function auditInput(
  triangleA: StaticRationalTriangleOverlapAuditTriangle3,
  triangleB: StaticRationalTriangleOverlapAuditTriangle3,
  classification: StaticRationalTriangleOverlapAuditClassification,
  encoding: StaticRationalTriangleOverlapAuditCoordinateEncoding = 'bigint',
): StaticRationalTriangleOverlapAuditInputSnapshotV1 {
  return {
    schemaVersion: 1,
    recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_INPUT_RECORD_TYPE,
    coordinateEncoding: encoding,
    triangleA: snapshotTriangle(triangleA, encoding),
    triangleB: snapshotTriangle(triangleB, encoding),
    producer: producerRecord(classification),
  };
}

function producerClassification(
  triangleA: StaticRationalTriangleOverlapAuditTriangle3,
  triangleB: StaticRationalTriangleOverlapAuditTriangle3,
): StaticRationalTriangleOverlapAuditClassification {
  const produced = classifyStaticRationalTriangleOverlap({ triangleA, triangleB });
  if (!produced.ok) throw new TypeError('test triangles must satisfy the producer contract');
  return produced.value.classification;
}

function makeGenerator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
}

function areaVector(value: StaticRationalTriangleOverlapAuditTriangle3): readonly bigint[] {
  const [first, second, third] = value;
  const ab = [
    second.x * first.w - first.x * second.w,
    second.y * first.w - first.y * second.w,
    second.z * first.w - first.z * second.w,
  ] as const;
  const ac = [
    third.x * first.w - first.x * third.w,
    third.y * first.w - first.y * third.w,
    third.z * first.w - first.z * third.w,
  ] as const;
  return [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  ];
}

function generatedTriangle(next: () => number): StaticRationalTriangleOverlapAuditTriangle3 {
  for (;;) {
    const value = Array.from({ length: 3 }, () =>
      canonicalPoint((next() % 13) - 6, (next() % 13) - 6, (next() % 13) - 6, (next() % 5) + 1),
    ) as unknown as StaticRationalTriangleOverlapAuditTriangle3;
    if (areaVector(value).some((coordinate) => coordinate !== 0n)) return value;
  }
}

function permute(
  value: StaticRationalTriangleOverlapAuditTriangle3,
  order: (typeof PERMUTATIONS)[number],
): StaticRationalTriangleOverlapAuditTriangle3 {
  return [value[order[0]], value[order[1]], value[order[2]]];
}

type IntegerVector3 = readonly [x: bigint, y: bigint, z: bigint];

function integerDifference(
  end: StaticRationalTriangleOverlapAuditPoint3,
  start: StaticRationalTriangleOverlapAuditPoint3,
): IntegerVector3 {
  return [end.x - start.x, end.y - start.y, end.z - start.z];
}

function integerCross(left: IntegerVector3, right: IntegerVector3): IntegerVector3 {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

function integerDot(left: IntegerVector3, right: IntegerVector3): bigint {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function integerTriangleEdges(
  value: StaticRationalTriangleOverlapAuditTriangle3,
): readonly [IntegerVector3, IntegerVector3, IntegerVector3] {
  return [
    integerDifference(value[1], value[0]),
    integerDifference(value[2], value[1]),
    integerDifference(value[0], value[2]),
  ];
}

function projectionInterval(
  triangleValue: StaticRationalTriangleOverlapAuditTriangle3,
  axis: IntegerVector3,
): readonly [minimum: bigint, maximum: bigint] {
  let minimum = integerDot(axis, [triangleValue[0].x, triangleValue[0].y, triangleValue[0].z]);
  let maximum = minimum;
  for (const point of [triangleValue[1], triangleValue[2]]) {
    const projected = integerDot(axis, [point.x, point.y, point.z]);
    if (projected < minimum) minimum = projected;
    if (projected > maximum) maximum = projected;
  }
  return [minimum, maximum];
}

/** A third exact method: closed separating-axis tests on integer triangles. */
function exactIntegerSatClassification(
  triangleA: StaticRationalTriangleOverlapAuditTriangle3,
  triangleB: StaticRationalTriangleOverlapAuditTriangle3,
): StaticRationalTriangleOverlapAuditClassification {
  const edgesA = integerTriangleEdges(triangleA);
  const edgesB = integerTriangleEdges(triangleB);
  const normalA = integerCross(edgesA[0], edgesA[1]);
  const normalB = integerCross(edgesB[0], edgesB[1]);
  const axes: IntegerVector3[] = [normalA, normalB];
  for (const edgeA of edgesA) {
    for (const edgeB of edgesB) axes.push(integerCross(edgeA, edgeB));
    axes.push(integerCross(normalA, edgeA));
  }
  for (const edgeB of edgesB) axes.push(integerCross(normalB, edgeB));
  for (const axis of axes) {
    if (axis[0] === 0n && axis[1] === 0n && axis[2] === 0n) continue;
    const intervalA = projectionInterval(triangleA, axis);
    const intervalB = projectionInterval(triangleB, axis);
    if (intervalA[1] < intervalB[0] || intervalB[1] < intervalA[0]) return 'disjoint';
  }
  const coplanar = triangleB.every(
    (point) => integerDot(normalA, integerDifference(point, triangleA[0])) === 0n,
  );
  return coplanar ? 'intersecting-coplanar' : 'intersecting-noncoplanar';
}

function generatedIntegerTriangle(next: () => number): StaticRationalTriangleOverlapAuditTriangle3 {
  for (;;) {
    const value = Array.from({ length: 3 }, () =>
      canonicalPoint((next() % 13) - 6, (next() % 13) - 6, (next() % 13) - 6),
    ) as unknown as StaticRationalTriangleOverlapAuditTriangle3;
    if (areaVector(value).some((coordinate) => coordinate !== 0n)) return value;
  }
}

describe('independent static rational triangle producer audit', () => {
  it.each([
    {
      name: 'parallel disjoint',
      other: triangle(canonicalPoint(0, 0, 1), canonicalPoint(4, 0, 1), canonicalPoint(0, 4, 1)),
      expected: 'disjoint',
    },
    {
      name: 'coplanar positive-area overlap',
      other: triangle(canonicalPoint(1, 0, 0), canonicalPoint(5, 0, 0), canonicalPoint(1, 4, 0)),
      expected: 'intersecting-coplanar',
    },
    {
      name: 'transverse crossing',
      other: triangle(canonicalPoint(1, 1, -1), canonicalPoint(1, 1, 1), canonicalPoint(3, 1, 0)),
      expected: 'intersecting-noncoplanar',
    },
  ] as const)('accepts a consistent $name producer record', ({ other, expected }) => {
    const result = auditStaticRationalTriangleOverlapCandidateV1(auditInput(BASE, other, expected));
    expect(result).toMatchObject({
      ok: true,
      value: {
        contractStatus: 'candidate-no-claim',
        scientificClaim: false,
        implementationRole: 'independent-auditor',
        auditOutcome: 'consistent',
        auditedClassification: expected,
        producerRecordMatched: true,
        exactBarycentricFeasibilityIncluded: true,
        legalContactClassificationIncluded: false,
        penetrationClassificationIncluded: false,
        collisionFreeClaim: false,
        continuousTimeIncluded: false,
        continuousCollisionDetectionIncluded: false,
        rigidMotionIntervalIncluded: false,
        verifiedClaim: false,
        globalM0fGo: false,
      },
    });
  });

  it('replays non-unit-weight boundary contact through canonical decimal input', () => {
    const boundaryTouch = triangle(
      canonicalPoint(6, 2, -1, 2),
      canonicalPoint(9, 3, 1, 3),
      canonicalPoint(3, 2, 1),
    );
    const result = auditStaticRationalTriangleOverlapCandidateV1(
      auditInput(BASE, boundaryTouch, 'intersecting-noncoplanar', 'canonical-decimal'),
    );
    expect(result).toMatchObject({
      ok: true,
      value: {
        auditOutcome: 'consistent',
        auditedClassification: 'intersecting-noncoplanar',
        boundaryContactCountsAsIntersection: true,
      },
    });
  });

  it.each([
    {
      name: 'coplanar point-edge touch',
      other: triangle(canonicalPoint(2, 0, 0), canonicalPoint(3, -1, 0), canonicalPoint(1, -1, 0)),
      expected: 'intersecting-coplanar',
    },
    {
      name: 'coplanar collinear edge overlap without shared vertices',
      other: triangle(canonicalPoint(1, 0, 0), canonicalPoint(3, 0, 0), canonicalPoint(2, -2, 0)),
      expected: 'intersecting-coplanar',
    },
    {
      name: 'coplanar strict containment',
      other: triangle(canonicalPoint(1, 1, 0), canonicalPoint(2, 1, 0), canonicalPoint(1, 2, 0)),
      expected: 'intersecting-coplanar',
    },
    {
      name: 'coplanar coincident reversal',
      other: triangle(BASE[2], BASE[1], BASE[0]),
      expected: 'intersecting-coplanar',
    },
    {
      name: 'noncoplanar shared edge',
      other: triangle(BASE[0], BASE[1], canonicalPoint(0, 0, 1)),
      expected: 'intersecting-noncoplanar',
    },
    {
      name: 'noncoplanar edge-edge point tangency',
      other: triangle(canonicalPoint(2, -1, -1), canonicalPoint(2, 1, 1), canonicalPoint(2, -1, 1)),
      expected: 'intersecting-noncoplanar',
    },
    {
      name: 'noncoplanar vertex-face tangency',
      other: triangle(canonicalPoint(1, 1, 0), canonicalPoint(2, 1, 1), canonicalPoint(1, 2, 1)),
      expected: 'intersecting-noncoplanar',
    },
  ] as const)('covers rank-deficient and closed-boundary $name', ({ other, expected }) => {
    const result = auditStaticRationalTriangleOverlapCandidateV1(auditInput(BASE, other, expected));
    expect(result).toMatchObject({
      ok: true,
      value: { auditOutcome: 'consistent', auditedClassification: expected },
    });
  });

  it('keeps an extremely near but separated rational plane exact', () => {
    const denominator = 1n << 4_096n;
    const almostCoplanar = triangle(
      canonicalPoint(0n, 0n, 1n, denominator),
      canonicalPoint(4n * denominator, 0n, 1n, denominator),
      canonicalPoint(0n, 4n * denominator, 1n, denominator),
    );
    const result = auditStaticRationalTriangleOverlapCandidateV1(
      auditInput(BASE, almostCoplanar, 'disjoint', 'canonical-decimal'),
    );
    expect(result).toMatchObject({
      ok: true,
      value: { auditOutcome: 'consistent', auditedClassification: 'disjoint' },
    });
  });

  it('returns a fixed inconsistent record for classification and boolean tampering', () => {
    const crossing = triangle(
      canonicalPoint(1, 1, -1),
      canonicalPoint(1, 1, 1),
      canonicalPoint(3, 1, 0),
    );
    const supplied = auditInput(BASE, crossing, 'disjoint');
    const result = auditStaticRationalTriangleOverlapCandidateV1(supplied);
    expect(result).toMatchObject({
      ok: false,
      value: {
        contractStatus: 'candidate-no-claim',
        auditOutcome: 'inconsistent',
        auditedClassification: 'intersecting-noncoplanar',
        auditedClosedTrianglesIntersect: true,
        producerClassification: 'disjoint',
        producerClosedTrianglesIntersect: false,
        producerRecordMatched: false,
        collisionFreeClaim: false,
        verifiedClaim: false,
        globalM0fGo: false,
      },
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect('value' in result && Object.isFrozen(result.value)).toBe(true);
    if (result.ok) throw new TypeError('tampered topology must be inconsistent');
    expect(Object.isFrozen(result.error)).toBe(true);
    expect(result.error.every((entry) => Object.isFrozen(entry))).toBe(true);
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'classification-mismatch' }),
    );
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'closed-intersection-mismatch' }),
    );
  });

  it('rejects forged affirmative claims and producer metadata as inconsistency', () => {
    const supplied = auditInput(BASE, BASE, 'intersecting-coplanar');
    const forged = {
      ...supplied,
      producer: {
        ...supplied.producer,
        arithmetic: 'floating-point',
        continuousCollisionDetectionIncluded: true,
        verifiedClaim: true,
        globalM0fGo: true,
      },
    };
    const result = auditStaticRationalTriangleOverlapCandidateV1(forged);
    expect(result.ok).toBe(false);
    expect('value' in result && result.value.auditOutcome).toBe('inconsistent');
    if (result.ok) throw new TypeError('forged claims must be inconsistent');
    expect(result.error.filter((entry) => entry.code === 'producer-field-mismatch')).toHaveLength(
      4,
    );
  });

  it('distinguishes the bounded unknown-data API from the parsed trusted API', () => {
    const supplied = auditInput(BASE, BASE, 'intersecting-coplanar', 'canonical-decimal');
    const parsed = parseStaticRationalTriangleOverlapAuditInputV1(supplied);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new TypeError('valid snapshot must parse');
    expect(parsed.value.triangleA[1]).toEqual({ x: 4n, y: 0n, z: 0n, w: 1n });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.triangleA)).toBe(true);
    expect(Object.isFrozen(parsed.value.triangleA[0])).toBe(true);
    expect(Object.isFrozen(parsed.value.producer)).toBe(true);

    const unknownResult = auditStaticRationalTriangleOverlapCandidateV1(supplied);
    const trustedResult = auditTrustedStaticRationalTriangleOverlapCandidateV1(parsed.value);
    expect(trustedResult).toEqual(unknownResult);
    expect(Object.isFrozen(trustedResult)).toBe(true);
    if (!trustedResult.ok) throw new TypeError('trusted parsed snapshot must audit');
    expect(Object.isFrozen(trustedResult.value)).toBe(true);
  });

  it('fails the contract for mixed encodings, noncanonical points, and degenerate input', () => {
    const mixed = auditInput(BASE, BASE, 'intersecting-coplanar');
    const mixedPoint = { ...mixed.triangleA[0], x: '0' };
    const mixedResult = auditStaticRationalTriangleOverlapCandidateV1({
      ...mixed,
      triangleA: [mixedPoint, mixed.triangleA[1], mixed.triangleA[2]],
    });
    expect(mixedResult).toMatchObject({
      ok: false,
      error: [expect.objectContaining({ path: '$.triangleA[0].x', code: 'expected-bigint' })],
    });
    expect('value' in mixedResult).toBe(false);

    const decimal = auditInput(BASE, BASE, 'intersecting-coplanar', 'canonical-decimal');
    const noncanonicalDecimal = auditStaticRationalTriangleOverlapCandidateV1({
      ...decimal,
      triangleA: [{ ...decimal.triangleA[0], x: '00' }, decimal.triangleA[1], decimal.triangleA[2]],
    });
    expect(noncanonicalDecimal).toMatchObject({
      ok: false,
    });
    if (noncanonicalDecimal.ok) throw new TypeError('noncanonical decimal must fail');
    expect(noncanonicalDecimal.error).toContainEqual(
      expect.objectContaining({ code: 'expected-canonical-decimal' }),
    );

    const unreduced = auditStaticRationalTriangleOverlapCandidateV1({
      ...mixed,
      triangleA: [{ x: 2n, y: 0n, z: 0n, w: 2n }, mixed.triangleA[1], mixed.triangleA[2]],
    });
    expect(unreduced).toMatchObject({
      ok: false,
    });
    if (unreduced.ok) throw new TypeError('unreduced homogeneous point must fail');
    expect(unreduced.error).toContainEqual(expect.objectContaining({ code: 'noncanonical-point' }));

    const degenerate = triangle(
      canonicalPoint(0, 0, 0),
      canonicalPoint(1, 1, 1),
      canonicalPoint(2, 2, 2),
    );
    const degenerateResult = auditStaticRationalTriangleOverlapCandidateV1(
      auditInput(degenerate, BASE, 'disjoint'),
    );
    expect(degenerateResult).toMatchObject({
      ok: false,
    });
    if (degenerateResult.ok) throw new TypeError('degenerate triangle must fail');
    expect(degenerateResult.error).toContainEqual(
      expect.objectContaining({ code: 'degenerate-triangle' }),
    );
  });

  it('rejects unknown structure at the root, point, and producer boundaries', () => {
    const supplied = auditInput(BASE, BASE, 'intersecting-coplanar');
    const rootResult = auditStaticRationalTriangleOverlapCandidateV1({
      ...supplied,
      surprise: true,
    });
    expect(rootResult.ok).toBe(false);
    if (rootResult.ok) throw new TypeError('unknown root property must fail');
    expect(rootResult.error).toContainEqual(
      expect.objectContaining({ path: '$.surprise', code: 'unknown-property' }),
    );

    const pointResult = auditStaticRationalTriangleOverlapCandidateV1({
      ...supplied,
      triangleA: [{ ...supplied.triangleA[0], surprise: true }, ...supplied.triangleA.slice(1)],
    });
    expect(pointResult.ok).toBe(false);
    if (pointResult.ok) throw new TypeError('unknown point property must fail');
    expect(pointResult.error).toContainEqual(
      expect.objectContaining({ path: '$.triangleA[0].surprise', code: 'unknown-property' }),
    );

    const producerResult = auditStaticRationalTriangleOverlapCandidateV1({
      ...supplied,
      producer: { ...supplied.producer, surprise: true },
    });
    expect(producerResult.ok).toBe(false);
    if (producerResult.ok) throw new TypeError('unknown producer property must fail');
    expect(producerResult.error).toContainEqual(
      expect.objectContaining({ path: '$.producer.surprise', code: 'unknown-property' }),
    );
  });

  it('enforces public coordinate and metadata limits before exact replay', () => {
    const oversized = 1n << BigInt(STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxCoordinateBits);
    const supplied = auditInput(BASE, BASE, 'intersecting-coplanar');
    const coordinateResult = auditStaticRationalTriangleOverlapCandidateV1({
      ...supplied,
      triangleA: [
        { x: oversized, y: 0n, z: 0n, w: 1n },
        supplied.triangleA[1],
        supplied.triangleA[2],
      ],
    });
    expect(coordinateResult).toMatchObject({
      ok: false,
    });
    if (coordinateResult.ok) throw new TypeError('oversized coordinate must fail');
    expect(coordinateResult.error).toContainEqual(
      expect.objectContaining({ code: 'coordinate-limit-exceeded' }),
    );

    const decimal = auditInput(BASE, BASE, 'intersecting-coplanar', 'canonical-decimal');
    const digitResult = auditStaticRationalTriangleOverlapCandidateV1({
      ...decimal,
      triangleA: [
        {
          ...decimal.triangleA[0],
          x: '1'.repeat(
            STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxCoordinateDecimalDigits + 1,
          ),
        },
        decimal.triangleA[1],
        decimal.triangleA[2],
      ],
    });
    expect(digitResult).toMatchObject({
      ok: false,
    });
    if (digitResult.ok) throw new TypeError('oversized decimal must fail');
    expect(digitResult.error).toContainEqual(
      expect.objectContaining({ code: 'decimal-digit-limit-exceeded' }),
    );

    const metadataResult = auditStaticRationalTriangleOverlapCandidateV1({
      ...supplied,
      producer: {
        ...supplied.producer,
        arithmetic: 'a'.repeat(
          STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxMetadataStringLength + 1,
        ),
      },
    });
    expect(metadataResult).toMatchObject({
      ok: false,
    });
    if (metadataResult.ok) throw new TypeError('oversized metadata must fail');
    expect(metadataResult.error).toContainEqual(
      expect.objectContaining({ code: 'string-limit-exceeded' }),
    );
  });

  it('rejects accessors and revoked proxies without invoking or throwing', () => {
    const supplied = auditInput(BASE, BASE, 'intersecting-coplanar');
    let calls = 0;
    const accessorRoot: Record<string, unknown> = { ...supplied };
    Object.defineProperty(accessorRoot, 'triangleA', {
      enumerable: true,
      get() {
        calls += 1;
        return supplied.triangleA;
      },
    });
    const accessorResult = auditStaticRationalTriangleOverlapCandidateV1(accessorRoot);
    expect(accessorResult.ok).toBe(false);
    expect(calls).toBe(0);
    if (accessorResult.ok) throw new TypeError('accessor must fail');
    expect(accessorResult.error).toContainEqual(
      expect.objectContaining({ path: '$.triangleA', code: 'accessor-property' }),
    );

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(() => auditStaticRationalTriangleOverlapCandidateV1(revoked.proxy)).not.toThrow();
    const revokedResult = auditStaticRationalTriangleOverlapCandidateV1(revoked.proxy);
    expect(revokedResult).toMatchObject({
      ok: false,
      error: [expect.objectContaining({ code: 'inspection-failed' })],
    });
  });

  it('caps property-descriptor work and accumulated diagnostics', () => {
    const keys = Array.from(
      { length: STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxOwnPropertiesPerContainer + 1 },
      (_, index) => `hostile-${index}`,
    );
    let descriptorCalls = 0;
    const hostile = new Proxy(
      {},
      {
        ownKeys: () => keys,
        getOwnPropertyDescriptor: () => {
          descriptorCalls += 1;
          return { configurable: true, enumerable: true, value: null };
        },
      },
    );
    const hostileResult = auditStaticRationalTriangleOverlapCandidateV1(hostile);
    expect(hostileResult.ok).toBe(false);
    expect(descriptorCalls).toBe(0);
    if (hostileResult.ok) throw new TypeError('oversized property set must fail');
    expect(hostileResult.error).toContainEqual(
      expect.objectContaining({ code: 'property-limit-exceeded' }),
    );

    const malformedPoint: Record<string, unknown> = {};
    const pointKeys = ['x', 'y', 'z', 'w'] as const;
    for (
      let index = 0;
      index < STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxOwnPropertiesPerContainer;
      index += 1
    ) {
      malformedPoint[pointKeys[index] ?? `extra-${index}`] = null;
    }
    const supplied = auditInput(BASE, BASE, 'intersecting-coplanar');
    const issueResult = auditStaticRationalTriangleOverlapCandidateV1({
      ...supplied,
      triangleA: [malformedPoint, malformedPoint, malformedPoint],
      triangleB: [malformedPoint, malformedPoint, malformedPoint],
    });
    expect(issueResult.ok).toBe(false);
    if (issueResult.ok) throw new TypeError('malformed points must fail');
    expect(issueResult.error).toHaveLength(STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxIssues);
    expect(Object.isFrozen(issueResult.error)).toBe(true);
    expect(issueResult.error.every((entry) => Object.isFrozen(entry))).toBe(true);
  });

  it('has a source-level independence boundary with no imports or shared classifier calls', async () => {
    const source = await readFile(
      resolve('m0f/reference-verifier/static-rational-triangle-overlap-audit.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/^\s*import\s/mu);
    expect(source).not.toMatch(/import\s*\(/u);
    expect(source).not.toMatch(/geometry\/static-rational-triangle-overlap/u);
    expect(source).not.toMatch(/projective-rational-3d/u);
    expect(source).not.toMatch(/classifyStaticRationalTriangleOverlap/u);
    expect(source).toMatch(/exactBarycentricIntersection/u);
    expect(source).toMatch(/solveUniqueOverdetermined/u);
  });

  it('agrees with the edge-plane producer on 300 deterministic rational pairs', () => {
    const next = makeGenerator(0xa0d17);
    let intersections = 0;
    for (let caseIndex = 0; caseIndex < 300; caseIndex += 1) {
      const triangleA = generatedTriangle(next);
      const triangleB = generatedTriangle(next);
      const classification = producerClassification(triangleA, triangleB);
      if (classification !== 'disjoint') intersections += 1;
      const result = auditStaticRationalTriangleOverlapCandidateV1(
        auditInput(
          triangleA,
          triangleB,
          classification,
          caseIndex % 2 === 0 ? 'bigint' : 'canonical-decimal',
        ),
      );
      expect(result.ok, `differential case ${caseIndex}`).toBe(true);
    }
    expect(intersections).toBeGreaterThan(0);
    expect(intersections).toBeLessThan(300);
  });

  it('agrees with a separate exact separating-axis oracle on 500 integer pairs', () => {
    const next = makeGenerator(0x5a71);
    let intersections = 0;
    for (let caseIndex = 0; caseIndex < 500; caseIndex += 1) {
      const triangleA = generatedIntegerTriangle(next);
      const triangleB = generatedIntegerTriangle(next);
      const classification = exactIntegerSatClassification(triangleA, triangleB);
      if (classification !== 'disjoint') intersections += 1;
      const result = auditStaticRationalTriangleOverlapCandidateV1(
        auditInput(triangleA, triangleB, classification),
      );
      expect(result.ok, `SAT differential case ${caseIndex}`).toBe(true);
    }
    expect(intersections).toBeGreaterThan(0);
    expect(intersections).toBeLessThan(500);
  });

  it('is invariant under triangle swap and every vertex ordering on a rational corpus', () => {
    const next = makeGenerator(0x0dd3ed);
    for (let caseIndex = 0; caseIndex < 20; caseIndex += 1) {
      const triangleA = generatedTriangle(next);
      const triangleB = generatedTriangle(next);
      const classification = producerClassification(triangleA, triangleB);
      const swapped = auditStaticRationalTriangleOverlapCandidateV1(
        auditInput(triangleB, triangleA, classification),
      );
      expect(swapped.ok, `swapped case ${caseIndex}`).toBe(true);
      for (const orderA of PERMUTATIONS) {
        for (const orderB of PERMUTATIONS) {
          const result = auditStaticRationalTriangleOverlapCandidateV1(
            auditInput(permute(triangleA, orderA), permute(triangleB, orderB), classification),
          );
          expect(result.ok, `permutation case ${caseIndex}`).toBe(true);
        }
      }
    }
  });
});
