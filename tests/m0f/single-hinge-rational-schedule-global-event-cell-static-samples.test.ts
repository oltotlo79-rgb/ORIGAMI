import { describe, expect, it } from 'vitest';

import {
  analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1,
  type SingleHingeRationalScheduleGlobalEventCellStaticSamplesRecordV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-global-event-cell-static-samples.js';
import { compareExactRational } from '../../m0f/model/exact-rational.js';
import {
  makeThreeFaceQuarterTransitionFixture,
  makeTwoFaceQuarterTransitionFixture,
} from './fixtures/single-hinge-rational-test-fixture.js';
import { makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture } from './fixtures/symmetric-three-face-algebraic-crossing-fixture.js';

function samples(
  supplied = makeTwoFaceQuarterTransitionFixture(),
): SingleHingeRationalScheduleGlobalEventCellStaticSamplesRecordV1 {
  const result = analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('global event-cell static sample fixture must succeed');
  return result.value;
}

describe('single-hinge global event-cell exact static 3D sample ledger candidate', () => {
  it('samples the complete two-face static mesh at the sole open-cell dyadic time', () => {
    const record = samples();
    expect(record).toMatchObject({
      recordType: 'm0f-single-hinge-rational-schedule-global-event-cell-static-samples',
      contractStatus: 'candidate-no-claim',
      openCellCount: 1,
      sampledCellCount: 1,
      aggregateStaticTrianglePairRowCount: 6,
      cellsWithStaticNonadjacentInteriorCrossingCount: 0,
      totalNonadjacentStaticInteriorCrossingEvidencePairCount: 0,
      crossingCellIndices: [],
    });
    expect(record.cellSamples[0]).toMatchObject({
      cellIndex: 0,
      cellId: 'event-open-cell:0',
      sampleRevisionId: 'CellSample:0',
      staticNonadjacentInteriorCrossingDetected: false,
      staticSample: {
        sampleTime: { numerator: 1n, exponent: 1 },
        normalizedTime: { numerator: 1n, denominator: 2n },
        unorderedPairCount: 6,
      },
    });
  });

  it('joins every symmetric algebraic-event cell to an exact static mesh census', () => {
    const record = samples(makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture());
    expect(record.openCellCount).toBe(2);
    expect(record.sampledCellCount).toBe(2);
    expect(record.aggregateStaticTrianglePairRowCount).toBe(30);
    expect(record.cellsWithStaticNonadjacentInteriorCrossingCount).toBe(1);
    expect(record.totalNonadjacentStaticInteriorCrossingEvidencePairCount).toBe(3);
    for (const cellSample of record.cellSamples) {
      expect(cellSample.staticSample.unorderedPairCount).toBe(15);
      expect(
        compareExactRational(
          cellSample.openCell.certifiedNormalizedSampleGap.lower,
          cellSample.staticSample.normalizedTime,
        ),
      ).toBeLessThan(0);
      expect(
        compareExactRational(
          cellSample.staticSample.normalizedTime,
          cellSample.openCell.certifiedNormalizedSampleGap.upper,
        ),
      ).toBeLessThan(0);
      expect(cellSample.staticSample.normalizedTime).toEqual(
        cellSample.openCell.normalizedSampleTime,
      );
    }
    expect(record.crossingCellIndices).toEqual([0]);
  });

  it('is deterministic under triangle input order for the larger three-face ledger', () => {
    const canonical = samples(makeThreeFaceQuarterTransitionFixture());
    const reordered = makeThreeFaceQuarterTransitionFixture();
    reordered.startBindingInput.staticTriangleSet.triangles.reverse();
    reordered.endBindingInput.staticTriangleSet.triangles.reverse();
    expect(samples(reordered)).toEqual(canonical);
    expect(canonical.openCellCount).toBe(1);
    expect(canonical.aggregateStaticTrianglePairRowCount).toBe(15);
  });

  it('propagates rejection and deep-freezes sample evidence without interval claims', () => {
    const invalid = makeTwoFaceQuarterTransitionFixture();
    invalid.endBindingInput.poseRevisionId = 'bad revision id';
    const rejected = analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1(invalid);
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new TypeError('invalid transition must fail');
    expect(rejected.error).toContainEqual(
      expect.objectContaining({ stage: 'event-time-partition', code: 'invalid-revision-id' }),
    );

    const result = analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1(
      makeTwoFaceQuarterTransitionFixture(),
    );
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('static sample ledger must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.cellSamples)).toBe(true);
    expect(Object.isFrozen(result.value.cellSamples[0]?.staticSample)).toBe(true);
    expect(result.value).toMatchObject({
      everyOpenCellSampledExactlyOnce: true,
      everySampleIsCanonicalDyadicActualTime: true,
      everySampleInsideItsCertifiedOpenGap: true,
      completeStaticMeshTrianglePairStrataAtEverySampleIncluded: true,
      actualStatic3dSelfIntersectionEvidenceAtSamplesIncluded: true,
      sampleOnlyPerOpenCell: true,
      openCellStrataConstancyEstablished: false,
      rootBoundaryGeometryIncluded: false,
      featureContainmentAtRootsIncluded: false,
      persistentEventSubdivisionIncluded: false,
      collisionEventCompletenessEstablished: false,
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
