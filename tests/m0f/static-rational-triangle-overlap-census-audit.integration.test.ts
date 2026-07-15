import { describe, expect, it } from 'vitest';

import {
  computeStaticRationalTriangleOverlapCensusV1,
  type StaticRationalTriangleOverlapCensusTriangleV1,
} from '../../m0f/geometry/static-rational-triangle-overlap-census.js';
import type {
  StaticRationalTriangle3,
  StaticRationalTriangleOverlapClassification,
} from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_INPUT_RECORD_TYPE,
  auditStaticRationalTriangleOverlapCandidateV1,
  type StaticRationalTriangleOverlapAuditInputSnapshotV1,
  type StaticRationalTriangleOverlapProducerSnapshotV1,
} from '../../m0f/reference-verifier/static-rational-triangle-overlap-audit.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

function point(x: number, y: number, z: number): ProjectivePoint3 {
  return canonicalProjectivePoint3(BigInt(x), BigInt(y), BigInt(z), 1n);
}

function triangle(
  first: ProjectivePoint3,
  second: ProjectivePoint3,
  third: ProjectivePoint3,
): StaticRationalTriangle3 {
  return [first, second, third];
}

function producerSnapshot(
  classification: StaticRationalTriangleOverlapClassification,
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

function auditInput(
  triangleA: StaticRationalTriangle3,
  triangleB: StaticRationalTriangle3,
  classification: StaticRationalTriangleOverlapClassification,
): StaticRationalTriangleOverlapAuditInputSnapshotV1 {
  return {
    schemaVersion: 1,
    recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_INPUT_RECORD_TYPE,
    coordinateEncoding: 'bigint',
    triangleA,
    triangleB,
    producer: producerSnapshot(classification),
  };
}

function replayEveryCensusPair(
  entries: readonly StaticRationalTriangleOverlapCensusTriangleV1[],
): number {
  const computed = computeStaticRationalTriangleOverlapCensusV1({ triangles: entries });
  expect(computed.ok).toBe(true);
  if (!computed.ok) throw new TypeError('integration corpus must satisfy the census contract');
  const byId = new Map(entries.map((entry) => [entry.triangleId, entry.triangle] as const));
  expect(byId.size).toBe(entries.length);
  const expectedTriangleIds = entries.map((entry) => entry.triangleId).sort();
  expect(computed.value.triangleIds).toEqual(expectedTriangleIds);
  expect(computed.value.triangleCount).toBe(entries.length);
  const expectedPairKeys = new Set<string>();
  for (let firstIndex = 0; firstIndex < expectedTriangleIds.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < expectedTriangleIds.length;
      secondIndex += 1
    ) {
      expectedPairKeys.add(
        JSON.stringify([expectedTriangleIds[firstIndex], expectedTriangleIds[secondIndex]]),
      );
    }
  }
  expect(computed.value.unorderedPairCount).toBe(expectedPairKeys.size);
  expect(computed.value.pairs).toHaveLength(expectedPairKeys.size);
  const replayedPairKeys = new Set<string>();
  let audited = 0;
  for (const [pairIndex, pair] of computed.value.pairs.entries()) {
    expect(pair.pairIndex).toBe(pairIndex);
    expect(pair.firstTriangleId < pair.secondTriangleId).toBe(true);
    const pairKey = JSON.stringify([pair.firstTriangleId, pair.secondTriangleId]);
    expect(expectedPairKeys.has(pairKey)).toBe(true);
    expect(replayedPairKeys.has(pairKey)).toBe(false);
    replayedPairKeys.add(pairKey);
    const first = byId.get(pair.firstTriangleId);
    const second = byId.get(pair.secondTriangleId);
    if (first === undefined || second === undefined) {
      throw new TypeError('census pair must bind to supplied triangle IDs');
    }
    const replay = auditStaticRationalTriangleOverlapCandidateV1(
      auditInput(first, second, pair.staticClassification),
    );
    expect(replay.ok).toBe(true);
    if (!replay.ok) throw new TypeError('independent replay must accept every census pair');
    expect(replay.value).toMatchObject({
      auditOutcome: 'consistent',
      auditedClassification: pair.staticClassification,
      auditedClosedTrianglesIntersect: pair.closedTrianglesIntersect,
      producerRecordMatched: true,
      verifiedClaim: false,
      globalM0fGo: false,
    });
    audited += 1;
  }
  expect([...replayedPairKeys].sort()).toEqual([...expectedPairKeys].sort());
  expect(audited).toBe(expectedPairKeys.size);
  return audited;
}

function makeGenerator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
}

function corpus(seed: number, count: number): StaticRationalTriangleOverlapCensusTriangleV1[] {
  const next = makeGenerator(seed);
  return Array.from({ length: count }, (_, index) => {
    const x = (next() % 11) - 5;
    const y = (next() % 11) - 5;
    const z = (next() % 7) - 3;
    const firstLift = next() % 3;
    const secondLift = next() % 3;
    return {
      triangleId: `T${String(index).padStart(2, '0')}`,
      triangle: triangle(
        point(x, y, z),
        point(x + 2, y, z + firstLift),
        point(x, y + 2, z + secondLift),
      ),
    };
  });
}

describe('static triangle census to independent pair-audit integration', () => {
  it('replays a contact and incidence corpus without trusting census classifications', () => {
    const base = triangle(point(0, 0, 0), point(4, 0, 0), point(0, 4, 0));
    const entries = [
      { triangleId: 'base', triangle: base },
      {
        triangleId: 'coplanar',
        triangle: triangle(point(1, 1, 0), point(5, 1, 0), point(1, 5, 0)),
      },
      {
        triangleId: 'transverse',
        triangle: triangle(point(1, 1, -1), point(1, 1, 1), point(3, 1, 0)),
      },
      {
        triangleId: 'shared-vertex',
        triangle: triangle(base[0], point(-1, 0, 1), point(0, -1, 1)),
      },
      {
        triangleId: 'shared-edge',
        triangle: triangle(base[0], base[1], point(0, 0, 1)),
      },
      {
        triangleId: 'far',
        triangle: triangle(point(20, 20, 2), point(22, 20, 2), point(20, 22, 2)),
      },
    ] as const;

    expect(replayEveryCensusPair(entries)).toBe(15);
    expect(replayEveryCensusPair([...entries].reverse())).toBe(15);
  });

  it('replays every pair in deterministic integer corpora', () => {
    let audited = 0;
    for (let seed = 1; seed <= 20; seed += 1) {
      audited += replayEveryCensusPair(corpus(seed, 8));
    }
    expect(audited).toBe(560);
  });

  it('detects a forged census-pair classification through the independent method', () => {
    const first = triangle(point(0, 0, 0), point(2, 0, 0), point(0, 2, 0));
    const second = triangle(point(20, 20, 0), point(22, 20, 0), point(20, 22, 0));
    const replay = auditStaticRationalTriangleOverlapCandidateV1(
      auditInput(first, second, 'intersecting-coplanar'),
    );
    expect(replay.ok).toBe(false);
    if (replay.ok || !('value' in replay)) {
      throw new TypeError('forged semantic record must produce an inconsistent decision');
    }
    expect(replay.value).toMatchObject({
      auditOutcome: 'inconsistent',
      auditedClassification: 'disjoint',
      producerRecordMatched: false,
      verifiedClaim: false,
      globalM0fGo: false,
    });
    expect(replay.error).toContainEqual(
      expect.objectContaining({ code: 'classification-mismatch' }),
    );
  });
});
