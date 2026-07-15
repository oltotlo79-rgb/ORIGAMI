import { describe, expect, it } from 'vitest';

import {
  classifySingleHingeRationalScheduleVertexFaceRootContainmentCompactFromOwnedPolynomialCensusV1,
  classifySingleHingeRationalScheduleVertexFaceRootContainmentFromOwnedPolynomialCensusV1,
  classifySingleHingeRationalScheduleVertexFaceRootContainmentV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS,
  type SingleHingeRationalScheduleVertexFaceRootContainmentRecordV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-vertex-face-root-containment.js';
import { computeSingleHingeRationalScheduleEventPolynomialCensusV1 } from '../../m0f/geometry/single-hinge-rational-schedule-event-polynomial-census.js';
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
  makeThreeFaceCrossingTransitionFixture,
  makeTwoFaceQuarterTransitionFixture,
} from './fixtures/single-hinge-rational-test-fixture.js';
import { makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture } from './fixtures/symmetric-three-face-algebraic-crossing-fixture.js';

function classify(
  transition: unknown,
  eventIndex: number,
  definingRootIndex = 0,
  classificationId = `vf-root-test:${String(eventIndex)}:${String(definingRootIndex)}`,
): SingleHingeRationalScheduleVertexFaceRootContainmentRecordV1 {
  const result = classifySingleHingeRationalScheduleVertexFaceRootContainmentV1({
    classificationId,
    transition,
    eventIndex,
    definingRootIndex,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('vertex-face root containment fixture must succeed');
  return result.value;
}

function polynomialSignAt(coefficients: readonly bigint[], parameter: ExactRational): -1 | 0 | 1 {
  let value = exactRational(0n);
  for (let index = coefficients.length - 1; index >= 0; index -= 1) {
    value = addExactRational(
      multiplyExactRational(value, parameter),
      exactRational(coefficients[index] ?? 0n),
    );
  }
  return value.numerator < 0n ? -1 : value.numerator > 0n ? 1 : 0;
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

describe('single-hinge exact vertex-face containment at one algebraic event root candidate', () => {
  it('classifies a bound vertex feature at an exact endpoint event root', () => {
    const record = classify(makeThreeFaceCrossingTransitionFixture(), 1);

    expect(record).toMatchObject({
      recordType: 'm0f-single-hinge-rational-schedule-vertex-face-root-containment',
      contractStatus: 'candidate-no-claim',
      definingEventId: 'vf:1:first:1',
      definingRootIndex: 0,
      classification: 'vertex',
      insideClosedTriangle: true,
      insideOpenTriangle: false,
      onTriangleBoundary: true,
      selectedProjectionDropAxis: 'z',
      edgeOrientationEvaluationDropAxis: 'z',
      zeroEdgeOrientationCount: 2,
    });
    expect(record.containingFaceVertexIndex).not.toBeNull();
    expect(record.containingFaceVertexId).toBe(
      record.faceVertexIds[record.containingFaceVertexIndex ?? 0],
    );
    expect(record.containingFaceEdgeIndex).toBeNull();
    expect(record.containingFaceEdgeVertexIds).toBeNull();
  });

  it('classifies an outside vertex and retains all three exact edge signs', () => {
    const record = classify(makeThreeFaceCrossingTransitionFixture(), 2);

    expect(record).toMatchObject({
      definingEventId: 'vf:1:first:2',
      classification: 'outside',
      insideClosedTriangle: false,
      insideOpenTriangle: false,
      onTriangleBoundary: false,
      containingFaceVertexIndex: null,
      containingFaceEdgeIndex: null,
    });
    expect(record.edgeOrientations).toHaveLength(3);
    const areaSign = record.selectedProjectionArea.signAtDefiningRoot;
    expect(areaSign).not.toBe(0);
    expect(
      record.edgeOrientations.some(
        (entry) => entry.signAtDefiningRoot !== 0 && entry.signAtDefiningRoot !== areaSign,
      ),
    ).toBe(true);
  });

  it('skips two collapsed projection candidates and selects the first nonzero area exactly', () => {
    const record = classify(makeTwoFaceQuarterTransitionFixture(), 1);

    expect(record.projectionAreaCandidates.map((entry) => entry.projectionDropAxis)).toEqual([
      'x',
      'y',
      'z',
    ]);
    expect(
      record.projectionAreaCandidates.slice(0, 2).map((entry) => entry.signAtDefiningRoot),
    ).toEqual([0, 0]);
    expect(record.projectionAreaCandidates[2]?.signAtDefiningRoot).not.toBe(0);
    expect(record.selectedProjectionDropAxis).toBe('z');
    expect(record.edgeOrientations.every((entry) => entry.projectionDropAxis === 'z')).toBe(true);
  });

  it('evaluates every auxiliary sign at an interior algebraic root without floating point', () => {
    const record = classify(symmetricCoplanarTransitionFixture(), 1, 0, 'vf-interior-root');
    const root = record.projectionAreaCandidates[0]?.signEvidence.definingRoot;
    expect(root?.location).toBe('interior');
    expect(record.classification).toBe('outside');

    const exactRoot = exactRational(3n, 8n);
    for (const entry of [...record.projectionAreaCandidates, ...record.edgeOrientations]) {
      expect(entry.signAtDefiningRoot).toBe(
        polynomialSignAt(entry.polynomial.primitiveIntegerCoefficientsLowToHigh, exactRoot),
      );
      expect(entry.signEvidence).toMatchObject({
        definingRootSelectedExactly: true,
        algebraicSignDeterminedExactly: true,
        floatingPointUsed: false,
      });
    }
  });

  it('classifies v6 on a face edge at the representative irrational nonadjacent event root', () => {
    const record = classify(
      makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture(),
      33,
      0,
      'vf-irrational-edge',
    );

    expect(record).toMatchObject({
      definingEventId: 'vf:3:second:0',
      vertexId: 'v6',
      topologyRelation: 'distinct-nonadjacent-faces',
      classification: 'edge',
      insideClosedTriangle: true,
      insideOpenTriangle: false,
      onTriangleBoundary: true,
      containingFaceEdgeIndex: 0,
      containingFaceEdgeVertexIds: ['v2', 'v0'],
      containingFaceVertexIndex: null,
      selectedProjectionDropAxis: 'z',
      zeroEdgeOrientationCount: 1,
    });
    expect(record.edgeOrientations.map((entry) => entry.signAtDefiningRoot)).toEqual([0, -1, -1]);
    expect(record.selectedProjectionArea.signAtDefiningRoot).toBe(-1);
    expect(record.edgeOrientations[0]?.signEvidence).toMatchObject({
      definingRootLocation: 'interior',
      proofKind: 'query-identically-zero',
      queryPolynomialSignAtDefiningRoot: 0,
      floatingPointUsed: false,
    });
  });

  it('keeps every auxiliary polynomial primitive, sign-preserving, and degree bounded', () => {
    const record = classify(symmetricCoplanarTransitionFixture(), 1, 0, 'vf-polynomials');
    const polynomials = [
      ...record.projectionAreaCandidates.map((entry) => entry.polynomial),
      ...record.edgeOrientations.map((entry) => entry.polynomial),
    ];

    expect(polynomials).toHaveLength(
      SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS.algebraicSignEvaluationCount,
    );
    for (const polynomial of polynomials) {
      expect(polynomial.primitiveIntegerCoefficientsLowToHigh).not.toHaveLength(0);
      expect(polynomial.polynomialDegree ?? 0).toBeLessThanOrEqual(
        SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS.maxAuxiliaryPolynomialDegree,
      );
      expect(polynomial).toMatchObject({
        coefficientOrder: 'constant-to-highest-degree',
        normalization: 'positive-denominator-lcm-then-integer-content-gcd-or-zero',
      });
    }
    expect(record.maximumObservedAuxiliaryPolynomialDegree).toBeLessThanOrEqual(4);
  });

  it('composes compact owned evidence without embedding or freeze-traversing the census', () => {
    const census = computeSingleHingeRationalScheduleEventPolynomialCensusV1(
      makeThreeFaceCrossingTransitionFixture(),
    );
    expect(census.ok).toBe(true);
    if (!census.ok) throw new TypeError('compact containment fixture census must succeed');

    const censusWithoutFreezeTraversal = new Proxy(census.value, {
      ownKeys: () => {
        throw new TypeError('compact composition must not enumerate the source census');
      },
    });
    const compact =
      classifySingleHingeRationalScheduleVertexFaceRootContainmentCompactFromOwnedPolynomialCensusV1(
        'vf-owned-compact',
        censusWithoutFreezeTraversal,
        1,
        0,
      );
    const full =
      classifySingleHingeRationalScheduleVertexFaceRootContainmentFromOwnedPolynomialCensusV1(
        'vf-owned-compact',
        census.value,
        1,
        0,
      );
    expect(compact.ok).toBe(true);
    expect(full.ok).toBe(true);
    if (!compact.ok || !full.ok) {
      throw new TypeError('full and compact owned containment composition must succeed');
    }

    expect(compact.value.classification).toBe(full.value.classification);
    expect(compact.value.projectionAreaCandidates.map((entry) => entry.signEvidence)).toEqual(
      full.value.projectionAreaCandidates.map((entry) => entry.signEvidence),
    );
    expect(compact.value.edgeOrientations.map((entry) => entry.signEvidence)).toEqual(
      full.value.edgeOrientations.map((entry) => entry.signEvidence),
    );
    expect(compact.value.selectedProjectionArea.signEvidence).toEqual(
      full.value.selectedProjectionArea.signEvidence,
    );
    expect(Object.hasOwn(compact.value, 'polynomialCensus')).toBe(false);
    expect(Object.keys(compact.value)).toEqual(
      Object.keys(full.value).filter((key) => key !== 'polynomialCensus'),
    );
    expect(Object.isFrozen(compact)).toBe(true);
    expect(Object.isFrozen(compact.value)).toBe(true);
    expect(Object.isFrozen(compact.value.projectionAreaCandidates)).toBe(true);
    expect(Object.isFrozen(compact.value.projectionAreaCandidates[0]?.polynomial)).toBe(true);
    expect(Object.isFrozen(compact.value.edgeOrientations)).toBe(true);
    expect(Object.isFrozen(compact.value.edgeOrientations[0]?.signEvidence)).toBe(true);
  });

  it('keeps compact owned composition failures fail-closed and deeply frozen', () => {
    const census = computeSingleHingeRationalScheduleEventPolynomialCensusV1(
      makeTwoFaceQuarterTransitionFixture(),
    );
    expect(census.ok).toBe(true);
    if (!census.ok) throw new TypeError('compact rejection fixture census must succeed');

    const result =
      classifySingleHingeRationalScheduleVertexFaceRootContainmentCompactFromOwnedPolynomialCensusV1(
        'vf-owned-compact-reject',
        census.value,
        60,
        0,
      );
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('compact composition must reject an unavailable event');
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'event-index-out-of-range' }),
    );
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.error)).toBe(true);
    expect(Object.isFrozen(result.error[0])).toBe(true);
  });

  it('rejects a persistent defining event, an edge-edge event, and unavailable selectors', () => {
    const transition = makeTwoFaceQuarterTransitionFixture();
    const cases = [
      { eventIndex: 0, definingRootIndex: 0, code: 'persistent-defining-root-set' },
      { eventIndex: 6, definingRootIndex: 0, code: 'vertex-face-event-required' },
      { eventIndex: 60, definingRootIndex: 0, code: 'event-index-out-of-range' },
      { eventIndex: 1, definingRootIndex: 1, code: 'defining-root-index-out-of-range' },
    ] as const;

    for (const testCase of cases) {
      const result = classifySingleHingeRationalScheduleVertexFaceRootContainmentV1({
        classificationId: `vf-reject:${String(testCase.eventIndex)}:${String(testCase.definingRootIndex)}`,
        transition,
        eventIndex: testCase.eventIndex,
        definingRootIndex: testCase.definingRootIndex,
      });
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError(`expected rejection ${testCase.code}`);
      expect(result.error).toContainEqual(expect.objectContaining({ code: testCase.code }));
      expect(Object.isFrozen(result)).toBe(true);
    }
  });

  it('fails closed on a degenerate source triangle instead of emitting feature containment', () => {
    const transition = makeTwoFaceQuarterTransitionFixture();
    for (const binding of [transition.startBindingInput, transition.endBindingInput]) {
      const first = binding.staticTriangleSet.triangles[0];
      if (first === undefined) throw new TypeError('degenerate rejection fixture needs a triangle');
      first.triangle = [first.triangle[0], first.triangle[1], first.triangle[1]];
    }

    const result = classifySingleHingeRationalScheduleVertexFaceRootContainmentV1({
      classificationId: 'vf-degenerate-source',
      transition,
      eventIndex: 1,
      definingRootIndex: 0,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('a degenerate source triangle must fail closed');
    expect(result.error).toContainEqual(
      expect.objectContaining({
        stage: 'event-census',
        code: 'invalid-triangle',
      }),
    );
  });

  it('rejects non-closed or accessor-bearing selector input before transition work', () => {
    const transition = makeTwoFaceQuarterTransitionFixture();
    const valid = {
      classificationId: 'vf-input',
      transition,
      eventIndex: 1,
      definingRootIndex: 0,
    };
    const accessor = Object.defineProperty(
      { transition, eventIndex: 1, definingRootIndex: 0 },
      'classificationId',
      { enumerable: true, get: () => 'vf-accessor' },
    );
    const cases = [
      { supplied: { ...valid, extra: true }, code: 'expected-closed-object' },
      { supplied: { ...valid, classificationId: 'bad id' }, code: 'invalid-classification-id' },
      { supplied: { ...valid, eventIndex: -1 }, code: 'invalid-event-index' },
      { supplied: accessor, code: 'data-property-required' },
    ] as const;

    for (const testCase of cases) {
      const result = classifySingleHingeRationalScheduleVertexFaceRootContainmentV1(
        testCase.supplied,
      );
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError(`expected rejection ${testCase.code}`);
      expect(result.error).toContainEqual(expect.objectContaining({ code: testCase.code }));
    }
  });

  it('deep-freezes exact evidence while leaving every broader decision false', () => {
    const result = classifySingleHingeRationalScheduleVertexFaceRootContainmentV1({
      classificationId: 'vf-frozen',
      transition: makeThreeFaceCrossingTransitionFixture(),
      eventIndex: 1,
      definingRootIndex: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new TypeError('frozen containment fixture must succeed');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.projectionAreaCandidates)).toBe(true);
    expect(Object.isFrozen(result.value.projectionAreaCandidates[0]?.polynomial)).toBe(true);
    expect(Object.isFrozen(result.value.edgeOrientations)).toBe(true);
    expect(Object.isFrozen(result.value.edgeOrientations[0]?.signEvidence)).toBe(true);
    expect(result.value).toMatchObject({
      sourceTransitionRevalidated: true,
      vertexFaceEventBoundExactly: true,
      faceAndVertexSchedulePathsBoundExactly: true,
      definingRootSelectedExactly: true,
      definingEventPlaneCoplanarityEstablishedAtRoot: true,
      allThreeProjectionAreaCandidatesIncluded: true,
      degenerateFaceAtEventRootRejectedFailClosed: true,
      canonicalProjectionSelectionCompletedExactly: true,
      allThreeEdgeOrientationPolynomialsIncluded: true,
      allAuxiliaryPolynomialSignsDeterminedExactly: true,
      commonPositiveScheduleDenominatorSquaredRemoved: true,
      featureContainmentAtOneVertexFaceRootIncluded: true,
      allEventRootsClassified: false,
      edgeEdgeContainmentIncluded: false,
      staticTrianglePairIntersectionIncluded: false,
      legalContactPolicyIncluded: false,
      penetrationClassificationIncluded: false,
      continuousCollisionDetectionIncluded: false,
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
