import { describe, expect, it } from 'vitest';

import {
  classifySingleHingeRationalScheduleEdgeEdgeAtAlgebraicRootV1,
  classifySingleHingeRationalScheduleEdgeEdgeCompactFromOwnedEventRootCensusV1,
  classifySingleHingeRationalScheduleEdgeEdgeFromOwnedEventRootCensusV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS,
} from '../../m0f/geometry/single-hinge-rational-schedule-edge-edge-algebraic-containment.js';
import { computeSingleHingeRationalScheduleEventRootCensusV1 } from '../../m0f/geometry/single-hinge-rational-schedule-event-root-census.js';
import { makeFourFaceCollinearOverlapTransitionFixture } from './fixtures/four-face-collinear-overlap-fixture.js';
import {
  makeThreeFaceCrossingTransitionFixture,
  makeTwoFaceQuarterTransitionFixture,
} from './fixtures/single-hinge-rational-test-fixture.js';
import { makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture } from './fixtures/symmetric-three-face-algebraic-crossing-fixture.js';

function classify(
  transition: ReturnType<typeof makeTwoFaceQuarterTransitionFixture>,
  eventId: string,
  definingRootIndex = 0,
) {
  const result = classifySingleHingeRationalScheduleEdgeEdgeAtAlgebraicRootV1({
    transition,
    eventId,
    definingRootIndex,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('exact edge-edge containment fixture must succeed');
  return result.value;
}

describe('single-hinge edge-edge containment at one algebraic event root candidate', () => {
  it('classifies a nonintersecting coplanar edge pair as disjoint', () => {
    const record = classify(makeTwoFaceQuarterTransitionFixture(), 'ee:1:0:2');

    expect(record).toMatchObject({
      eventId: 'ee:1:0:2',
      definingRootIndex: 0,
      definingRootLocation: 'start',
      directionRelation: 'nonparallel',
      projectionAxisDropped: 'z',
      directionCrossSignsAtSelectedRoot: { x: 0, y: 0, z: 1 },
      firstLineSecondEndpointSigns: [-1, 0],
      secondLineFirstEndpointSigns: [-1, -1],
      firstSegmentStraddlesSecondLine: false,
      secondSegmentStraddlesFirstLine: true,
      containmentClass: 'disjoint',
    });
  });

  it('classifies a nonparallel contact containing an endpoint', () => {
    const record = classify(makeThreeFaceCrossingTransitionFixture(), 'ee:1:0:2');

    expect(record).toMatchObject({
      definingRootLocation: 'start',
      directionRelation: 'nonparallel',
      projectionAxisDropped: 'z',
      directionCrossSignsAtSelectedRoot: { x: 0, y: 0, z: 1 },
      firstLineSecondEndpointSigns: [-1, 0],
      secondLineFirstEndpointSigns: [1, 0],
      firstSegmentStraddlesSecondLine: true,
      secondSegmentStraddlesFirstLine: true,
      containmentClass: 'endpoint-contact',
    });
  });

  it('classifies a strict interior-interior crossing', () => {
    const record = classify(makeThreeFaceCrossingTransitionFixture(), 'ee:1:2:2');

    expect(record).toMatchObject({
      definingRootLocation: 'start',
      directionRelation: 'nonparallel',
      projectionAxisDropped: 'z',
      directionCrossSignsAtSelectedRoot: { x: 0, y: 0, z: -1 },
      firstLineSecondEndpointSigns: [1, -1],
      secondLineFirstEndpointSigns: [-1, 1],
      firstSegmentStraddlesSecondLine: true,
      secondSegmentStraddlesFirstLine: true,
      containmentClass: 'proper-interior-crossing',
    });
  });

  it('classifies endpoint containment at a genuinely algebraic interior event time', () => {
    const result = classifySingleHingeRationalScheduleEdgeEdgeAtAlgebraicRootV1({
      transition: makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture(),
      eventId: 'ee:3:0:2',
      definingRootIndex: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new TypeError('algebraic interior edge event fixture must succeed');

    expect(result.value).toMatchObject({
      eventId: 'ee:3:0:2',
      definingRootIndex: 0,
      definingRootLocation: 'interior',
      definingRootMultiplicity: 1,
      directionRelation: 'nonparallel',
      projectionAxisDropped: 'y',
      directionCrossSignsAtSelectedRoot: { x: 0, y: -1, z: 1 },
      firstLineSecondEndpointSigns: [1, 0],
      secondLineFirstEndpointSigns: [-1, 1],
      firstSegmentStraddlesSecondLine: true,
      secondSegmentStraddlesFirstLine: true,
      containmentClass: 'endpoint-contact',
    });
    expect(
      result.value.auxiliarySigns.find((entry) => entry.role === 'first-line-to-second-end')
        ?.signEvidence.proofKind,
    ).toBe('shared-refined-root-class');
    expect(
      result.value.auxiliarySigns
        .filter((entry) => entry.signAtSelectedRoot !== 0)
        .every(
          (entry) => entry.signEvidence.proofKind === 'root-free-isolating-interval-rational-probe',
        ),
    ).toBe(true);
  });

  it('binds all seven sign proofs to the same event identity and selected root', () => {
    const record = classify(makeThreeFaceCrossingTransitionFixture(), 'ee:1:2:2');

    expect(record.auxiliarySigns).toHaveLength(7);
    expect(record.auxiliarySigns.map((entry) => entry.role)).toEqual([
      'direction-cross-x',
      'direction-cross-y',
      'direction-cross-z',
      'first-line-to-second-start',
      'first-line-to-second-end',
      'second-line-to-first-start',
      'second-line-to-first-end',
    ]);
    for (const auxiliary of record.auxiliarySigns) {
      expect(auxiliary.signEvidence).toMatchObject({
        definingPolynomialId: record.eventId,
        definingRootIndex: record.definingRootIndex,
        definingRootLocation: record.definingRootLocation,
        definingRootMultiplicity: record.definingRootMultiplicity,
        queryPolynomialId: auxiliary.polynomialId,
        queryPolynomialSignAtDefiningRoot: auxiliary.signAtSelectedRoot,
        algebraicSignDeterminedExactly: true,
        floatingPointUsed: false,
      });
      expect(auxiliary.signEvidence.queryIsolation.primitiveIntegerCoefficientsLowToHigh).toEqual(
        auxiliary.primitiveIntegerCoefficientsLowToHigh,
      );
      expect(auxiliary.polynomialDegree === null || auxiliary.polynomialDegree <= 4).toBe(true);
    }
    expect(
      record.auxiliarySigns.find((entry) => entry.role === 'direction-cross-z')
        ?.primitiveIntegerCoefficientsLowToHigh,
    ).toEqual([-4n, 0n, -1n]);
  });

  it('classifies an existing finite parallel noncollinear event as disjoint with twelve proofs', () => {
    const record = classify(makeThreeFaceCrossingTransitionFixture(), 'ee:2:0:0');

    expect(record).toMatchObject({
      eventId: 'ee:2:0:0',
      definingRootIndex: 0,
      definingRootLocation: 'start',
      directionRelation: 'parallel-noncollinear',
      projectionAxisDropped: null,
      directionCrossSignsAtSelectedRoot: { x: 0, y: 0, z: 0 },
      firstEdgeDirectionSignsAtSelectedRoot: { x: -1, y: 0, z: 0 },
      secondEdgeDirectionSignsAtSelectedRoot: { x: -1, y: 0, z: 0 },
      carrierOffsetCrossSignsAtSelectedRoot: { x: 0, y: 0, z: -1 },
      collinearProjectionAxis: null,
      collinearEndpointOrder: null,
      collinearIntervalComparisonSigns: null,
      firstLineSecondEndpointSigns: null,
      secondLineFirstEndpointSigns: null,
      firstSegmentStraddlesSecondLine: null,
      secondSegmentStraddlesFirstLine: null,
      collinearOverlapHasPositiveLength: false,
      containmentClass: 'disjoint',
      nonparallelProjectionEstablishedExactly: false,
      projectedSegmentContainmentClassifiedExactly: false,
      parallelDirectionsClassifiedExactly: true,
      carrierLineRelationClassifiedExactly: true,
      collinearIntervalComparisonIncluded: false,
      threeDimensionalContainmentFollowsFromCoplanarityAndProjection: false,
      threeDimensionalContainmentClassifiedExactly: true,
    });
    expect(record.auxiliarySigns).toHaveLength(12);
    expect(record.auxiliarySigns.map((entry) => entry.role)).toEqual([
      'direction-cross-x',
      'direction-cross-y',
      'direction-cross-z',
      'first-direction-x',
      'second-direction-x',
      'first-direction-y',
      'second-direction-y',
      'first-direction-z',
      'second-direction-z',
      'carrier-offset-cross-x',
      'carrier-offset-cross-y',
      'carrier-offset-cross-z',
    ]);
    for (const auxiliary of record.auxiliarySigns) {
      expect(auxiliary.signEvidence).toMatchObject({
        definingPolynomialId: record.eventId,
        definingRootIndex: record.definingRootIndex,
        definingRootLocation: record.definingRootLocation,
        definingRootMultiplicity: record.definingRootMultiplicity,
        queryPolynomialId: auxiliary.polynomialId,
        queryPolynomialSignAtDefiningRoot: auxiliary.signAtSelectedRoot,
        algebraicSignDeterminedExactly: true,
        floatingPointUsed: false,
      });
      expect(auxiliary.signEvidence.queryIsolation.primitiveIntegerCoefficientsLowToHigh).toEqual(
        auxiliary.primitiveIntegerCoefficientsLowToHigh,
      );
      expect(auxiliary.polynomialDegree === null || auxiliary.polynomialDegree <= 4).toBe(true);
    }
    expect(
      record.auxiliarySigns.find((entry) => entry.role === 'carrier-offset-cross-z')
        ?.primitiveIntegerCoefficientsLowToHigh,
    ).toEqual([-16n, 0n, -8n, 0n, -1n]);
  });

  it('classifies a finite collinear positive-length overlap with fourteen proofs', () => {
    const result = classifySingleHingeRationalScheduleEdgeEdgeAtAlgebraicRootV1({
      transition: makeFourFaceCollinearOverlapTransitionFixture(),
      eventId: 'ee:5:2:2',
      definingRootIndex: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new TypeError('finite collinear edge event fixture must succeed');
    const record = result.value;

    expect(record).toMatchObject({
      eventId: 'ee:5:2:2',
      definingRootIndex: 0,
      definingRootLocation: 'start',
      definingRootMultiplicity: 2,
      directionRelation: 'collinear',
      projectionAxisDropped: null,
      directionCrossSignsAtSelectedRoot: { x: 0, y: 0, z: 0 },
      firstEdgeDirectionSignsAtSelectedRoot: { x: 1, y: -1, z: 0 },
      secondEdgeDirectionSignsAtSelectedRoot: { x: 1, y: -1, z: 0 },
      carrierOffsetCrossSignsAtSelectedRoot: { x: 0, y: 0, z: 0 },
      collinearProjectionAxis: 'x',
      collinearEndpointOrder: {
        firstLowerVertexId: 'v1',
        firstUpperVertexId: 'v2',
        secondLowerVertexId: 'v7',
        secondUpperVertexId: 'v8',
      },
      collinearIntervalComparisonSigns: [-1, -1],
      firstLineSecondEndpointSigns: null,
      secondLineFirstEndpointSigns: null,
      firstSegmentStraddlesSecondLine: null,
      secondSegmentStraddlesFirstLine: null,
      collinearOverlapHasPositiveLength: true,
      containmentClass: 'collinear-overlap',
      parallelDirectionsClassifiedExactly: true,
      carrierLineRelationClassifiedExactly: true,
      collinearIntervalComparisonIncluded: true,
      threeDimensionalContainmentFollowsFromCoplanarityAndProjection: true,
      threeDimensionalContainmentClassifiedExactly: true,
    });
    expect(record.auxiliarySigns).toHaveLength(14);
    expect(record.auxiliarySigns.map((entry) => entry.role)).toEqual([
      'direction-cross-x',
      'direction-cross-y',
      'direction-cross-z',
      'first-direction-x',
      'second-direction-x',
      'first-direction-y',
      'second-direction-y',
      'first-direction-z',
      'second-direction-z',
      'carrier-offset-cross-x',
      'carrier-offset-cross-y',
      'carrier-offset-cross-z',
      'interval-second-lower-minus-first-upper',
      'interval-first-lower-minus-second-upper',
    ]);
    for (const auxiliary of record.auxiliarySigns) {
      expect(auxiliary.signEvidence).toMatchObject({
        definingPolynomialId: record.eventId,
        definingRootIndex: record.definingRootIndex,
        definingRootLocation: record.definingRootLocation,
        definingRootMultiplicity: record.definingRootMultiplicity,
        queryPolynomialId: auxiliary.polynomialId,
        queryPolynomialSignAtDefiningRoot: auxiliary.signAtSelectedRoot,
        algebraicSignDeterminedExactly: true,
        floatingPointUsed: false,
      });
    }
    expect(
      record.auxiliarySigns.slice(-2).map((entry) => entry.primitiveIntegerCoefficientsLowToHigh),
    ).toEqual([
      [-3n, 8n, 3n],
      [-3n, -8n, -3n],
    ]);
  });

  it('publishes the branch-specific seven, twelve, and fourteen row limits', () => {
    expect(SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS).toMatchObject({
      nonparallelAuxiliaryPolynomialCount: 7,
      parallelNoncollinearAuxiliaryPolynomialCount: 12,
      collinearAuxiliaryPolynomialCount: 14,
      maxAuxiliaryPolynomialCount: 14,
      maxAuxiliaryPolynomialDegree: 4,
    });
  });

  it('composes compact evidence from one owned census without embedding that shared source', () => {
    const transition = makeThreeFaceCrossingTransitionFixture();
    const census = computeSingleHingeRationalScheduleEventRootCensusV1(transition);
    expect(census.ok).toBe(true);
    if (!census.ok) throw new TypeError('owned edge event census fixture must succeed');
    const event = census.value.events.find((entry) => entry.eventId === 'ee:2:0:0');
    if (event === undefined) throw new TypeError('owned edge event must exist');
    const censusWithoutFreezeTraversal = new Proxy(census.value, {
      ownKeys: () => {
        throw new TypeError('compact composition must not enumerate the source census');
      },
    });

    const full = classifySingleHingeRationalScheduleEdgeEdgeFromOwnedEventRootCensusV1(
      census.value,
      event.eventIndex,
      0,
    );
    const compact = classifySingleHingeRationalScheduleEdgeEdgeCompactFromOwnedEventRootCensusV1(
      censusWithoutFreezeTraversal,
      event.eventIndex,
      0,
    );
    expect(full.ok).toBe(true);
    expect(compact.ok).toBe(true);
    if (!full.ok || !compact.ok) throw new TypeError('owned edge compositions must succeed');
    const { rootCensus, ...expectedCompact } = full.value;
    expect(rootCensus).toBe(census.value);
    expect(compact.value).toEqual(expectedCompact);
    expect('rootCensus' in compact.value).toBe(false);
    expect(Object.isFrozen(compact)).toBe(true);
    expect(Object.isFrozen(compact.value)).toBe(true);
    expect(Object.isFrozen(compact.value.auxiliarySigns)).toBe(true);
  });

  it('keeps compact owned-composition failures fail-closed and deeply frozen', () => {
    const census = computeSingleHingeRationalScheduleEventRootCensusV1(
      makeTwoFaceQuarterTransitionFixture(),
    );
    expect(census.ok).toBe(true);
    if (!census.ok) throw new TypeError('compact edge rejection census must succeed');
    const result = classifySingleHingeRationalScheduleEdgeEdgeCompactFromOwnedEventRootCensusV1(
      census.value,
      999,
      0,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('compact edge composition must reject a missing event');
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'event-index-out-of-range' }),
    );
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.error)).toBe(true);
    expect(Object.isFrozen(result.error[0])).toBe(true);
  });

  it('fails closed when the selected coplanarity event is persistent', () => {
    const result = classifySingleHingeRationalScheduleEdgeEdgeAtAlgebraicRootV1({
      transition: makeThreeFaceCrossingTransitionFixture(),
      eventId: 'ee:1:0:0',
      definingRootIndex: 0,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('expected persistent coplanarity to fail closed');
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'persistent-coplanarity-event-unsupported' }),
    );
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('rejects a vertex-face event, missing event, missing root, and non-closed input', () => {
    const transition = makeThreeFaceCrossingTransitionFixture();
    const accessor = Object.defineProperty(
      { transition, eventId: 'ee:1:0:2' },
      'definingRootIndex',
      { enumerable: true, get: () => 0 },
    );
    const cases: readonly Readonly<{ supplied: unknown; code: string }>[] = [
      {
        supplied: { transition, eventId: 'vf:1:first:1', definingRootIndex: 0 },
        code: 'edge-edge-event-required',
      },
      {
        supplied: { transition, eventId: 'ee:999:0:0', definingRootIndex: 0 },
        code: 'event-not-found',
      },
      {
        supplied: { transition, eventId: 'ee:1:0:2', definingRootIndex: 1 },
        code: 'defining-root-index-out-of-range',
      },
      {
        supplied: { transition, eventId: 'ee:1:0:2', definingRootIndex: 0, extra: true },
        code: 'expected-closed-object',
      },
      { supplied: accessor, code: 'data-property-required' },
    ];

    for (const testCase of cases) {
      const result = classifySingleHingeRationalScheduleEdgeEdgeAtAlgebraicRootV1(
        testCase.supplied,
      );
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError(`expected rejection ${testCase.code}`);
      expect(result.error).toContainEqual(expect.objectContaining({ code: testCase.code }));
    }
  });

  it('deep-freezes the evidence ledger and keeps every downstream claim false', () => {
    const result = classifySingleHingeRationalScheduleEdgeEdgeAtAlgebraicRootV1({
      transition: makeThreeFaceCrossingTransitionFixture(),
      eventId: 'ee:1:2:2',
      definingRootIndex: 0,
    });
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('exact edge-edge containment fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.auxiliarySigns)).toBe(true);
    expect(Object.isFrozen(result.value.auxiliarySigns[0]?.signEvidence)).toBe(true);
    expect(Object.isFrozen(result.value.rootCensus)).toBe(true);
    expect(result.value).toMatchObject({
      contractStatus: 'candidate-no-claim',
      selectedEventIdentityBoundExactly: true,
      selectedDefiningRootBoundExactly: true,
      coplanarityAtSelectedRootEstablishedExactly: true,
      commonPositiveScheduleDenominatorRemoved: true,
      nonparallelProjectionEstablishedExactly: true,
      projectedSegmentContainmentClassifiedExactly: true,
      parallelDirectionsClassifiedExactly: false,
      carrierLineRelationClassifiedExactly: false,
      collinearIntervalComparisonIncluded: false,
      threeDimensionalContainmentFollowsFromCoplanarityAndProjection: true,
      threeDimensionalContainmentClassifiedExactly: true,
      featureContainmentAtSelectedRootIncluded: true,
      parallelOrCollinearCaseSupported: true,
      collinearPositiveLengthOverlapIncluded: true,
      degenerateEdgeCaseSupported: false,
      persistentCoplanarityEventSupported: false,
      floatingPointUsed: false,
      collisionClassificationIncluded: false,
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
