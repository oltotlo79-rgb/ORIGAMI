import { describe, expect, it } from 'vitest';

import { determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1 } from '../../m0f/geometry/primitive-integer-polynomial-algebraic-root-sign.js';
import {
  computeSingleHingeRationalScheduleEventRootCensusV1,
  type SingleHingeRationalScheduleEventRootCensusRecordV1,
  type SingleHingeRationalScheduleEventRootV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-event-root-census.js';
import {
  computeSingleHingeRationalScheduleGlobalEventTimePartitionV1,
  type SingleHingeRationalScheduleGlobalEventTimePartitionRecordV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-global-event-time-partition.js';
import {
  analyzeSingleHingeRationalScheduleStaticSampleV1,
  type SingleHingeRationalScheduleStaticSampleRecordV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-static-sample.js';
import { makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture } from './fixtures/symmetric-three-face-algebraic-crossing-fixture.js';

const REPRESENTATIVE_COEFFICIENTS = [729n, -648n, 1296n, -2304n, -2304n, -2048n, -4096n] as const;

function multiplyPolynomials(left: readonly bigint[], right: readonly bigint[]): bigint[] {
  const product = Array.from({ length: left.length + right.length - 1 }, () => 0n);
  for (const [leftIndex, leftCoefficient] of left.entries()) {
    for (const [rightIndex, rightCoefficient] of right.entries()) {
      product[leftIndex + rightIndex] =
        (product[leftIndex + rightIndex] ?? 0n) + leftCoefficient * rightCoefficient;
    }
  }
  return product;
}

function rootCensus(): SingleHingeRationalScheduleEventRootCensusRecordV1 {
  const result = computeSingleHingeRationalScheduleEventRootCensusV1(
    makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture(),
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('symmetric crossing root census must succeed');
  return result.value;
}

function representativeEvent(
  record: SingleHingeRationalScheduleEventRootCensusRecordV1,
): SingleHingeRationalScheduleEventRootV1 {
  const event = record.events.find(
    (candidate) =>
      candidate.polynomial.eventKind === 'vertex-face-plane' &&
      candidate.polynomial.topologyRelation === 'distinct-nonadjacent-faces' &&
      candidate.polynomial.vertexId === 'v6' &&
      candidate.polynomial.primitiveIntegerCoefficientsLowToHigh.length ===
        REPRESENTATIVE_COEFFICIENTS.length &&
      candidate.polynomial.primitiveIntegerCoefficientsLowToHigh.every(
        (coefficient, index) => coefficient === REPRESENTATIVE_COEFFICIENTS[index],
      ),
  );
  if (event === undefined) throw new TypeError('representative nonadjacent event must exist');
  return event;
}

function partition(): SingleHingeRationalScheduleGlobalEventTimePartitionRecordV1 {
  const result = computeSingleHingeRationalScheduleGlobalEventTimePartitionV1(
    makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture(),
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('symmetric crossing partition must succeed');
  return result.value;
}

function sample(
  sampleRevisionId: string,
  numerator: bigint,
  exponent: number,
): SingleHingeRationalScheduleStaticSampleRecordV1 {
  const result = analyzeSingleHingeRationalScheduleStaticSampleV1({
    transitionInput: makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture(),
    sample: {
      sampleRevisionId,
      sampleTime: { numerator, exponent },
    },
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('symmetric crossing static sample must succeed');
  return result.value;
}

describe('symmetric three-face algebraic crossing fixture', () => {
  it('binds the discovered nonadjacent vertex-face event to its actual canonical IDs', () => {
    const record = rootCensus();
    const event = representativeEvent(record);
    expect(record).toMatchObject({
      triangleCount: 6,
      eventCount: 180,
      persistentEventCount: 66,
      eventsWithInteriorRootCount: 12,
    });
    expect(event).toMatchObject({
      eventIndex: 33,
      eventId: 'vf:3:second:0',
      hasInteriorRoot: true,
      polynomial: {
        pairIndex: 3,
        eventKind: 'vertex-face-plane',
        vertexTriangleSide: 'second',
        vertexIndex: 0,
        vertexId: 'v6',
        topologyRelation: 'distinct-nonadjacent-faces',
        faceTriangleId: '30:candidate-rational-triangle-v1:21:candidate-face:000001:2:v0:2:v1:2:v2',
        secondTriangleId:
          '30:candidate-rational-triangle-v1:21:candidate-face:000003:2:v4:2:v5:2:v6',
      },
    });
    expect(event.isolation.roots).toEqual([
      expect.objectContaining({ location: 'interior', multiplicity: 1, sturmCertified: true }),
    ]);
  });

  it('recovers the exact irrational event factor without floating point', () => {
    const event = representativeEvent(rootCensus());
    const positiveAxialFactor = [9n, 0n, 16n];
    const uniqueUnitIntervalRootFactor = [-9n, 8n, 16n];
    const factored = multiplyPolynomials(
      multiplyPolynomials(positiveAxialFactor, positiveAxialFactor),
      uniqueUnitIntervalRootFactor,
    ).map((coefficient) => -coefficient);
    expect(event.polynomial.primitiveIntegerCoefficientsLowToHigh).toEqual(factored);
    expect(factored).toEqual(REPRESENTATIVE_COEFFICIENTS);

    const definingPolynomial = {
      polynomialId: event.eventId,
      coefficients: event.polynomial.primitiveIntegerCoefficientsLowToHigh,
    };
    const query = (polynomialId: string, coefficients: readonly bigint[]) => {
      const result = determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1({
        evaluationId: `symmetric-crossing:${polynomialId}`,
        definingPolynomial,
        definingRootIndex: 0,
        queryPolynomial: { polynomialId, coefficients },
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new TypeError('algebraic query sign must succeed');
      return result.value;
    };

    expect(query('root-factor', uniqueUnitIntervalRootFactor)).toMatchObject({
      queryPolynomialSignAtDefiningRoot: 0,
      proofKind: 'shared-refined-root-class',
      floatingPointUsed: false,
    });
    expect(query('above-one-half', [-1n, 2n]).queryPolynomialSignAtDefiningRoot).toBe(1);
    expect(query('below-nine-sixteenths', [-9n, 16n]).queryPolynomialSignAtDefiningRoot).toBe(-1);
  });

  it('merges twelve occurrences at the same isolated interior boundary', () => {
    const record = partition();
    expect(record).toMatchObject({
      boundaryCount: 3,
      interiorBoundaryCount: 1,
      openCellCount: 2,
    });
    const interior = record.boundaries.find((boundary) => boundary.location === 'interior');
    expect(interior).toMatchObject({
      boundaryId: 'event-boundary:interior:0',
      finiteEventOccurrenceCount: 12,
      simultaneousFiniteEventCount: 12,
      normalizedTimeIsolatingInterval: {
        lower: { numerator: 1n, denominator: 2n },
        upper: { numerator: 3n, denominator: 4n },
      },
    });
    expect(
      interior?.finiteEventOccurrences.some((occurrence) => occurrence.eventId === 'vf:3:second:0'),
    ).toBe(true);
  });

  it('separates an exact crossing sample from a post-event disjoint sample', () => {
    const beforeRoot = sample('Pose:symmetric-crossing:one-half:1', 1n, 1);
    const afterRoot = sample('Pose:symmetric-crossing:nine-sixteenths:1', 9n, 4);
    expect(beforeRoot).toMatchObject({
      normalizedTime: { numerator: 1n, denominator: 2n },
      staticNonadjacentInteriorCrossingDetected: true,
      nonadjacentStaticInteriorCrossingEvidencePairCount: 3,
    });
    expect(
      beforeRoot.strata.pairs
        .filter((pair) => pair.staticNonadjacentInteriorCrossingDetected)
        .map((pair) => pair.pairIndex),
    ).toEqual([3, 4, 8]);
    expect(afterRoot).toMatchObject({
      normalizedTime: { numerator: 9n, denominator: 16n },
      staticNonadjacentInteriorCrossingDetected: false,
      nonadjacentStaticInteriorCrossingEvidencePairCount: 0,
    });
    expect(
      afterRoot.strata.pairs
        .filter((pair) => pair.topology.pairRelation === 'distinct-nonadjacent-faces')
        .every((pair) => pair.category === 'disjoint'),
    ).toBe(true);
    expect(beforeRoot.continuousCollisionDetectionIncluded).toBe(false);
    expect(afterRoot.globalM0fGo).toBe(false);
  });
});
