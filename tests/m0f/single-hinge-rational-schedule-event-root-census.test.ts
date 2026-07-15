import { describe, expect, it } from 'vitest';

import {
  computeSingleHingeRationalScheduleEventRootCensusV1,
  type SingleHingeRationalScheduleEventRootCensusRecordV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-event-root-census.js';
import {
  makeThreeFaceQuarterTransitionFixture,
  makeTwoFaceQuarterTransitionFixture,
} from './fixtures/single-hinge-rational-test-fixture.js';

function census(
  supplied = makeTwoFaceQuarterTransitionFixture(),
): SingleHingeRationalScheduleEventRootCensusRecordV1 {
  const result = computeSingleHingeRationalScheduleEventRootCensusV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('event root census fixture must succeed');
  return result.value;
}

describe('single-hinge rational schedule exact event root census candidate', () => {
  it('isolates every two-face event polynomial on the closed unit interval', () => {
    const record = census();
    expect(record).toMatchObject({
      recordType: 'm0f-single-hinge-rational-schedule-event-root-census',
      contractStatus: 'candidate-no-claim',
      arithmetic: 'exact-rational-sturm-bigint',
      triangleCount: 4,
      unorderedTrianglePairCount: 6,
      eventCount: 60,
    });
    expect(record.events).toHaveLength(record.polynomialCensus.eventCount);
    expect(record.events.map((event) => event.eventIndex)).toEqual(
      Array.from({ length: 60 }, (_, index) => index),
    );
    expect(new Set(record.events.map((event) => event.eventId)).size).toBe(60);
  });

  it('binds each isolation record to its exact source polynomial and derived flags', () => {
    const record = census();
    for (const event of record.events) {
      expect(event.eventId).toBe(event.polynomial.eventId);
      expect(event.isolation.polynomialId).toBe(event.eventId);
      expect(event.isolation.primitiveIntegerCoefficientsLowToHigh).toEqual(
        event.polynomial.primitiveIntegerCoefficientsLowToHigh,
      );
      expect(event.persistentOnEntireUnitInterval).toBe(
        event.isolation.rootSetKind === 'entire-unit-interval',
      );
      expect(event.hasStartRoot).toBe(event.isolation.startRootMultiplicity > 0);
      expect(event.hasInteriorRoot).toBe(event.isolation.interiorDistinctRootCount > 0);
      expect(event.hasEndRoot).toBe(event.isolation.endRootMultiplicity > 0);
      expect(event.hasAnyUnitIntervalRoot).toBe(
        event.persistentOnEntireUnitInterval ||
          event.hasStartRoot ||
          event.hasInteriorRoot ||
          event.hasEndRoot,
      );
    }
  });

  it('replays every aggregate root and subdivision counter from the ledger', () => {
    const record = census();
    expect(record.persistentEventCount).toBe(
      record.events.filter((event) => event.persistentOnEntireUnitInterval).length,
    );
    expect(record.finiteRootSetEventCount).toBe(record.eventCount - record.persistentEventCount);
    expect(record.eventsWithAnyUnitIntervalRootCount).toBe(
      record.events.filter((event) => event.hasAnyUnitIntervalRoot).length,
    );
    expect(record.eventsWithStartRootCount).toBe(
      record.events.filter((event) => event.hasStartRoot).length,
    );
    expect(record.eventsWithInteriorRootCount).toBe(
      record.events.filter((event) => event.hasInteriorRoot).length,
    );
    expect(record.eventsWithEndRootCount).toBe(
      record.events.filter((event) => event.hasEndRoot).length,
    );
    expect(record.totalDistinctFiniteRootCountBeforeCrossEventMerge).toBe(
      record.events.reduce((sum, event) => sum + event.isolation.distinctRootCount, 0),
    );
    expect(record.totalFiniteRootMultiplicityBeforeCrossEventMerge).toBe(
      record.events.reduce((sum, event) => sum + (event.isolation.rootMultiplicitySum ?? 0), 0),
    );
    expect(record.totalSubdivisionNodeCount).toBe(
      record.events.reduce((sum, event) => sum + event.isolation.subdivisionNodeCount, 0),
    );
    expect(record.maximumSubdivisionDepthUsed).toBe(
      Math.max(...record.events.map((event) => event.isolation.maximumSubdivisionDepthUsed)),
    );
  });

  it('covers all 180 events including nonadjacent faces in a three-face component', () => {
    const record = census(makeThreeFaceQuarterTransitionFixture());
    expect(record.triangleCount).toBe(6);
    expect(record.eventCount).toBe(180);
    expect(
      record.events.some(
        (event) => event.polynomial.topologyRelation === 'distinct-nonadjacent-faces',
      ),
    ).toBe(true);
    expect(record.persistentEventCount).toBe(record.polynomialCensus.identicallyZeroEventCount);
  });

  it('is invariant under triangle order and propagates transition rejection', () => {
    const canonical = makeTwoFaceQuarterTransitionFixture();
    const reordered = makeTwoFaceQuarterTransitionFixture();
    reordered.startBindingInput.staticTriangleSet.triangles.reverse();
    reordered.endBindingInput.staticTriangleSet.triangles.reverse();
    expect(census(reordered)).toEqual(census(canonical));

    const rejectedInput = makeTwoFaceQuarterTransitionFixture();
    rejectedInput.endBindingInput.poseRevisionId = 'bad revision id';
    const rejected = computeSingleHingeRationalScheduleEventRootCensusV1(rejectedInput);
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new TypeError('invalid transition must fail');
    expect(rejected.error).toContainEqual(
      expect.objectContaining({ stage: 'polynomial-census', code: 'invalid-revision-id' }),
    );
  });

  it('deep-freezes the ledger and leaves every collision claim explicitly false', () => {
    const result = computeSingleHingeRationalScheduleEventRootCensusV1(
      makeTwoFaceQuarterTransitionFixture(),
    );
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('event root census fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.events)).toBe(true);
    expect(Object.isFrozen(result.value.events[0]?.isolation)).toBe(true);
    expect(result.value).toMatchObject({
      everyEventPolynomialRootSetCoveredOnClosedUnitInterval: true,
      endpointRootsHandledExactly: true,
      repeatedRootMultiplicitiesIncluded: true,
      persistentZeroPolynomialsRetained: true,
      independentEventRootIsolationIncluded: true,
      simultaneousCrossEventRootsMerged: false,
      globalEventCellPartitionIncluded: false,
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
