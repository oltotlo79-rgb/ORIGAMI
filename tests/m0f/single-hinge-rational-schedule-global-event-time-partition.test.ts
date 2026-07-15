import { describe, expect, it } from 'vitest';

import {
  computeSingleHingeRationalScheduleGlobalEventTimePartitionV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_TIME_PARTITION_LIMITS,
  type SingleHingeRationalScheduleGlobalEventTimePartitionRecordV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-global-event-time-partition.js';
import {
  addExactRational,
  compareExactRational,
  exactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../../m0f/model/exact-rational.js';
import { projectivePoint3FromRationalComponents } from '../../m0f/reference-verifier/projective-rational-3d.js';
import {
  makeThreeFaceQuarterTransitionFixture,
  makeTwoFaceQuarterTransitionFixture,
} from './fixtures/single-hinge-rational-test-fixture.js';

function partition(
  supplied = makeTwoFaceQuarterTransitionFixture(),
): SingleHingeRationalScheduleGlobalEventTimePartitionRecordV1 {
  const result = computeSingleHingeRationalScheduleGlobalEventTimePartitionV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('global event time partition fixture must succeed');
  return result.value;
}

function symmetricCoplanarTransitionFixture() {
  const transition = makeTwoFaceQuarterTransitionFixture();
  const planarTriangles = structuredClone(transition.startBindingInput.staticTriangleSet.triangles);
  const half = exactRational(1n, 2n);
  const cosine = exactRational(3n, 5n);
  const pose = (sineSign: -1n | 1n) =>
    planarTriangles.map((triangle) => ({
      ...triangle,
      triangle: triangle.triangle.map((point) => {
        const x = exactRational(point.x, point.w);
        const y = exactRational(point.y, point.w);
        if (compareExactRational(x, half) <= 0) {
          return projectivePoint3FromRationalComponents(
            [x.numerator, x.denominator],
            [y.numerator, y.denominator],
            [0n, 1n],
          );
        }
        const offset = subtractExactRational(x, half);
        const posedX = addExactRational(half, multiplyExactRational(cosine, offset));
        const posedZ = multiplyExactRational(exactRational(sineSign * 4n, 5n), offset);
        return projectivePoint3FromRationalComponents(
          [posedX.numerator, posedX.denominator],
          [y.numerator, y.denominator],
          [posedZ.numerator, posedZ.denominator],
        );
      }) as unknown as typeof triangle.triangle,
    }));
  transition.startBindingInput.staticTriangleSet.triangles = pose(-1n);
  transition.endBindingInput.staticTriangleSet.triangles = pose(1n);
  return transition;
}

function dyadic(value: Readonly<{ numerator: bigint; exponent: number }>): ExactRational {
  return exactRational(value.numerator, 1n << BigInt(value.exponent));
}

describe('single-hinge rational schedule global exact event time partition candidate', () => {
  it('joins endpoint roots and retains persistent events outside the discrete boundary ledger', () => {
    const record = partition();
    expect(record).toMatchObject({
      recordType: 'm0f-single-hinge-rational-schedule-global-event-time-partition',
      contractStatus: 'candidate-no-claim',
      finiteRootOccurrenceCount: 30,
      persistentEventCount: 30,
      boundaryCount: 2,
      interiorBoundaryCount: 0,
      openCellCount: 1,
      boundariesWithSimultaneousFiniteEventsCount: 1,
    });
    expect(record.boundaries[0]).toMatchObject({
      location: 'start',
      finiteEventOccurrenceCount: 30,
    });
    expect(record.boundaries[1]).toMatchObject({
      location: 'end',
      finiteEventOccurrenceCount: 0,
    });
    expect(record.openCells[0]).toMatchObject({
      lowerBoundaryId: 'event-boundary:start',
      upperBoundaryId: 'event-boundary:end',
      sampleTime: { numerator: 1n, exponent: 1 },
      normalizedSampleTime: { numerator: 1n, denominator: 2n },
    });
    expect(new Set(record.persistentEvents.map((event) => event.eventId))).toEqual(
      new Set(
        record.eventRootCensus.events
          .filter((event) => event.persistentOnEntireUnitInterval)
          .map((event) => event.eventId),
      ),
    );
  });

  it('merges thirty independent interior occurrences into one simultaneous root boundary', () => {
    const record = partition(symmetricCoplanarTransitionFixture());
    expect(record).toMatchObject({
      finiteRootOccurrenceCount: 30,
      persistentEventCount: 30,
      boundaryCount: 3,
      interiorBoundaryCount: 1,
      openCellCount: 2,
      boundariesWithSimultaneousFiniteEventsCount: 1,
    });
    expect(record.rootRefinement.distinctFiniteRootClassCountAfterMerge).toBe(1);
    expect(record.rootRefinement.simultaneousRootClassCount).toBe(1);
    const interior = record.boundaries[1];
    expect(interior).toMatchObject({
      location: 'interior',
      normalizedTimeKind: 'isolated-algebraic',
      finiteEventOccurrenceCount: 30,
      simultaneousFiniteEventCount: 30,
    });
    if (interior?.location !== 'interior') throw new TypeError('interior boundary must exist');
    expect(
      compareExactRational(interior.normalizedTimeIsolatingInterval.lower, exactRational(3n, 8n)),
    ).toBeLessThan(0);
    expect(
      compareExactRational(exactRational(3n, 8n), interior.normalizedTimeIsolatingInterval.upper),
    ).toBeLessThan(0);
    expect(record.openCells.map((cell) => cell.sampleTime)).toEqual([
      { numerator: 1n, exponent: 3 },
      { numerator: 3n, exponent: 2 },
    ]);
  });

  it('makes the merged classes a bijection over every independent finite root occurrence', () => {
    const record = partition(symmetricCoplanarTransitionFixture());
    const expected = new Set(
      record.eventRootCensus.events.flatMap((event) =>
        event.persistentOnEntireUnitInterval
          ? []
          : event.isolation.roots.map(
              (root) => `${String(event.eventIndex)}:${String(root.rootIndex)}`,
            ),
      ),
    );
    const actual = record.boundaries.flatMap((boundary) =>
      boundary.finiteEventOccurrences.map(
        (occurrence) => `${String(occurrence.eventIndex)}:${String(occurrence.rootIndex)}`,
      ),
    );
    expect(actual).toHaveLength(expected.size);
    expect(new Set(actual)).toEqual(expected);
    expect(record.rootRefinement.isolations).toEqual(
      record.eventRootCensus.events.map((event) => event.isolation),
    );
  });

  it('selects a canonical dyadic actual time inside every certified open gap', () => {
    const transition = symmetricCoplanarTransitionFixture();
    transition.slab = {
      t0: { numerator: 2n, exponent: 0 },
      t1: { numerator: 6n, exponent: 0 },
    };
    const record = partition(transition);
    const start = exactRational(2n);
    const duration = exactRational(4n);
    for (const cell of record.openCells) {
      const actual = dyadic(cell.sampleTime);
      const reconstructed = addExactRational(
        start,
        multiplyExactRational(duration, cell.normalizedSampleTime),
      );
      expect(compareExactRational(actual, reconstructed)).toBe(0);
      expect(
        compareExactRational(cell.certifiedNormalizedSampleGap.lower, cell.normalizedSampleTime),
      ).toBeLessThan(0);
      expect(
        compareExactRational(cell.normalizedSampleTime, cell.certifiedNormalizedSampleGap.upper),
      ).toBeLessThan(0);
      expect(cell.sampleTime.exponent === 0 || cell.sampleTime.numerator % 2n !== 0n).toBe(true);
    }
    expect(record.dyadicSampleSearchTrialCount).toBeGreaterThan(0);
    expect(record.dyadicSampleSearchTrialCount).toBeLessThanOrEqual(
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_TIME_PARTITION_LIMITS.maxTotalDyadicSampleSearchTrials,
    );
  });

  it('covers the larger three-face endpoint ledger deterministically', () => {
    const canonical = partition(makeThreeFaceQuarterTransitionFixture());
    const reorderedInput = makeThreeFaceQuarterTransitionFixture();
    reorderedInput.startBindingInput.staticTriangleSet.triangles.reverse();
    reorderedInput.endBindingInput.staticTriangleSet.triangles.reverse();
    expect(partition(reorderedInput)).toEqual(canonical);
    expect(canonical).toMatchObject({
      finiteRootOccurrenceCount: 72,
      persistentEventCount: 108,
      boundaryCount: 2,
      openCellCount: 1,
    });
  });

  it('propagates transition rejection and deep-freezes every no-claim ledger', () => {
    const invalid = makeTwoFaceQuarterTransitionFixture();
    invalid.endBindingInput.poseRevisionId = 'bad revision id';
    const rejected = computeSingleHingeRationalScheduleGlobalEventTimePartitionV1(invalid);
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new TypeError('invalid transition must fail');
    expect(rejected.error).toContainEqual(
      expect.objectContaining({ stage: 'event-root-census', code: 'invalid-revision-id' }),
    );

    const result = computeSingleHingeRationalScheduleGlobalEventTimePartitionV1(
      makeTwoFaceQuarterTransitionFixture(),
    );
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('partition fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.boundaries)).toBe(true);
    expect(Object.isFrozen(result.value.openCells[0]?.sampleTime)).toBe(true);
    expect(result.value).toMatchObject({
      endpointBoundariesAlwaysIncluded: true,
      endpointFiniteRootsJoinedExactly: true,
      persistentEventsRetainedSeparately: true,
      persistentEventsApplyToEveryBoundaryAndOpenCell: true,
      simultaneousCrossEventRootsMerged: true,
      allFiniteRootsAssignedToExactlyOneBoundary: true,
      globalEventCellPartitionIncluded: true,
      exactDyadicSamplePerOpenCellIncluded: true,
      everyOpenCellFiniteEventPolynomialRootFree: true,
      featureContainmentAtRootsIncluded: false,
      collisionEventCompletenessEstablished: false,
      nonlinearNarrowPhaseIncluded: false,
      continuousCollisionDetectionIncluded: false,
      legalContactPolicyIncluded: false,
      selfIntersectionDecisionIncluded: false,
      collisionFreeClaim: false,
      isSupportProfile: false,
      supportClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });
});
