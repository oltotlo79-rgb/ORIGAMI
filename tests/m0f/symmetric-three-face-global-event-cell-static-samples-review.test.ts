import { describe, expect, it } from 'vitest';

import {
  analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1,
  type SingleHingeRationalScheduleGlobalEventCellStaticSamplesRecordV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-global-event-cell-static-samples.js';
import { compareExactRational } from '../../m0f/model/exact-rational.js';
import { makeThreeFaceQuarterTransitionFixture } from './fixtures/single-hinge-rational-test-fixture.js';
import { makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture } from './fixtures/symmetric-three-face-algebraic-crossing-fixture.js';

function analyze(
  supplied: ReturnType<typeof makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture>,
): SingleHingeRationalScheduleGlobalEventCellStaticSamplesRecordV1 {
  const result = analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('independent event-cell sample review must succeed');
  return result.value;
}

describe('symmetric three-face global event-cell static sample independent review', () => {
  it('binds cell zero to exactly three crossing pairs and cell one to none', () => {
    const transition = makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture();
    const record = analyze(transition);
    expect(
      record.cellSamples.map((cell) => ({
        cellIndex: cell.cellIndex,
        normalizedTime: cell.staticSample.normalizedTime,
        crossing: cell.staticNonadjacentInteriorCrossingDetected,
        crossingPairCount: cell.nonadjacentStaticInteriorCrossingEvidencePairCount,
      })),
    ).toEqual([
      {
        cellIndex: 0,
        normalizedTime: { numerator: 1n, denominator: 4n },
        crossing: true,
        crossingPairCount: 3,
      },
      {
        cellIndex: 1,
        normalizedTime: { numerator: 7n, denominator: 8n },
        crossing: false,
        crossingPairCount: 0,
      },
    ]);
    expect(
      record.cellSamples[0]?.staticSample.strata.pairs
        .filter((pair) => pair.staticNonadjacentInteriorCrossingDetected)
        .map((pair) => pair.pairIndex),
    ).toEqual([3, 4, 8]);
    expect(
      record.cellSamples[1]?.staticSample.strata.pairs
        .filter((pair) => pair.topology.pairRelation === 'distinct-nonadjacent-faces')
        .map((pair) => pair.category),
    ).toEqual(['disjoint', 'disjoint', 'disjoint', 'disjoint']);
    expect(record.crossingCellIndices).toEqual([0]);
    expect(record.totalNonadjacentStaticInteriorCrossingEvidencePairCount).toBe(3);
  });

  it('preserves actual-time, certified-gap, source revision, and no-claim boundaries', () => {
    const transition = makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture();
    transition.transitionRevisionId = 'Transition:independent-cell-review:7';
    transition.stepId = 'Step:independent-cell-review:11';
    transition.startBindingInput.meshRevisionId = 'Mesh:independent-cell-review:13';
    transition.endBindingInput.meshRevisionId = 'Mesh:independent-cell-review:13';
    transition.startBindingInput.triangulationRevisionId =
      'Triangulation:independent-cell-review:17';
    transition.endBindingInput.triangulationRevisionId = 'Triangulation:independent-cell-review:17';
    transition.slab = {
      t0: { numerator: 2n, exponent: 0 },
      t1: { numerator: 6n, exponent: 0 },
    };
    const record = analyze(transition);
    expect(record).toMatchObject({
      transitionRevisionId: 'Transition:independent-cell-review:7',
      stepId: 'Step:independent-cell-review:11',
      meshRevisionId: 'Mesh:independent-cell-review:13',
      triangulationRevisionId: 'Triangulation:independent-cell-review:17',
    });
    expect(record.cellSamples.map((cell) => cell.staticSample.sampleTime)).toEqual([
      { numerator: 3n, exponent: 0 },
      { numerator: 11n, exponent: 1 },
    ]);
    for (const [index, cell] of record.cellSamples.entries()) {
      expect(cell.openCell).toEqual(record.eventTimePartition.openCells[index]);
      expect(cell.staticSample.sampleTime).toEqual(cell.openCell.sampleTime);
      expect(cell.staticSample.normalizedTime).toEqual(cell.openCell.normalizedSampleTime);
      expect(cell.staticSample).toMatchObject({
        transitionRevisionId: record.transitionRevisionId,
        stepId: record.stepId,
        meshRevisionId: record.meshRevisionId,
        triangulationRevisionId: record.triangulationRevisionId,
        timePosition: 'interior',
      });
      expect(
        compareExactRational(
          cell.openCell.certifiedNormalizedSampleGap.lower,
          cell.staticSample.normalizedTime,
        ),
      ).toBeLessThan(0);
      expect(
        compareExactRational(
          cell.staticSample.normalizedTime,
          cell.openCell.certifiedNormalizedSampleGap.upper,
        ),
      ).toBeLessThan(0);
    }
    expect(record).toMatchObject({
      callerTransitionSnapshottedBeforeComposition: true,
      sameOwnedTransitionSnapshotUsedForPartitionAndAllSamples: true,
      callerRevisionLabelsOnly: true,
      exactSourceReconstructionGeometryEqualityChecked: false,
      cryptographicSourceRevisionBindingIncluded: false,
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
      supportClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });

  it('captures one source snapshot before a stateful Proxy can swap geometry under equal labels', () => {
    const first = makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture();
    const later = makeThreeFaceQuarterTransitionFixture();
    later.transitionRevisionId = first.transitionRevisionId;
    later.stepId = first.stepId;
    later.activeHingeEdgeId = first.activeHingeEdgeId;
    later.movingSideFaceId = first.movingSideFaceId;
    later.slab = structuredClone(first.slab);
    for (const key of ['meshRevisionId', 'triangulationRevisionId', 'poseRevisionId'] as const) {
      later.startBindingInput[key] = first.startBindingInput[key];
      later.endBindingInput[key] = first.endBindingInput[key];
    }

    let startBindingDescriptorReads = 0;
    const stateful = new Proxy(
      { ...first },
      {
        getOwnPropertyDescriptor(_target, key) {
          let source = first;
          if (key === 'startBindingInput') {
            startBindingDescriptorReads += 1;
            source = startBindingDescriptorReads === 1 ? first : later;
          } else if (key === 'endBindingInput') {
            source = startBindingDescriptorReads === 1 ? first : later;
          }
          const descriptor = Reflect.getOwnPropertyDescriptor(source, key);
          return descriptor === undefined ? undefined : { ...descriptor };
        },
      },
    );

    const record = analyze(stateful);
    expect(startBindingDescriptorReads).toBe(1);
    expect(
      record.cellSamples.map((cell) => cell.nonadjacentStaticInteriorCrossingEvidencePairCount),
    ).toEqual([3, 0]);
    for (const cell of record.cellSamples) {
      expect(cell.staticSample.schedule.transition.startBinding.vertices).toEqual(
        record.eventTimePartition.eventRootCensus.polynomialCensus.schedule.transition.startBinding
          .vertices,
      );
      expect(cell.staticSample.schedule.transition.endBinding.vertices).toEqual(
        record.eventTimePartition.eventRootCensus.polynomialCensus.schedule.transition.endBinding
          .vertices,
      );
    }
    expect(record.sameOwnedTransitionSnapshotUsedForPartitionAndAllSamples).toBe(true);
    expect(record.cryptographicSourceRevisionBindingIncluded).toBe(false);
  });
});
