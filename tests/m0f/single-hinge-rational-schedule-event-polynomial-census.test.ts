import { describe, expect, it } from 'vitest';

import {
  computeSingleHingeRationalScheduleEventPolynomialCensusV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS,
  type SingleHingeRationalScheduleEventPolynomialCensusRecordV1,
  type SingleHingeRationalScheduleEventPolynomialV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-event-polynomial-census.js';
import { evaluateSingleHingeRationalHalfAngleVertexPathV1 } from '../../m0f/geometry/single-hinge-rational-half-angle-schedule.js';
import {
  bindStaticRationalTrianglePoseToFoldMeshV1,
  type StaticRationalTriangleFoldMeshBindingRecordV1,
} from '../../m0f/geometry/static-rational-triangle-fold-mesh-binding.js';
import type { StaticRationalTriangle3 } from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
} from '../../m0f/geometry/reconstruct-fold-faces.js';
import {
  addExactRational,
  exactRational,
  multiplyExactRational,
  signExactRational,
  subtractExactRational,
  type ExactRational,
} from '../../m0f/model/exact-rational.js';
import {
  projectiveOrient3DSign,
  projectivePoint3FromRationalComponents,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

type RationalPoint3 = readonly [x: ExactRational, y: ExactRational, z: ExactRational];
type Pose = (x: ExactRational, y: ExactRational) => RationalPoint3;

const ZERO = exactRational(0n);
const ONE = exactRational(1n);
const HALF = exactRational(1n, 2n);
const SLAB = {
  t0: { numerator: 0n, exponent: 0 },
  t1: { numerator: 1n, exponent: 0 },
} as const;

function twoFaceSource(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [0.5, 0],
      [1, 0],
      [1, 1],
      [0.5, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [1, 4],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'V'],
    facesVertices: null,
  };
}

function threeFaceStripSource(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [3, 1],
      [2, 1],
      [1, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
      [1, 6],
      [2, 5],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M'],
    facesVertices: null,
  };
}

function reconstruct(source: Record<string, unknown>): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(source);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('FOLD reconstruction fixture must succeed');
  return result.value;
}

function sourceCoordinates(
  vertex: CandidateFoldFaceReconstructionV1['vertices'][number],
): readonly [ExactRational, ExactRational] {
  return [
    exactRational(
      BigInt(vertex.exactCoordinate.x.numerator),
      BigInt(vertex.exactCoordinate.x.denominator),
    ),
    exactRational(
      BigInt(vertex.exactCoordinate.y.numerator),
      BigInt(vertex.exactCoordinate.y.denominator),
    ),
  ];
}

function projective(point: RationalPoint3): ProjectivePoint3 {
  return projectivePoint3FromRationalComponents(
    [point[0].numerator, point[0].denominator],
    [point[1].numerator, point[1].denominator],
    [point[2].numerator, point[2].denominator],
  );
}

function bindingInput(
  reconstruction: CandidateFoldFaceReconstructionV1,
  poseRevisionId: string,
  pose: Pose,
) {
  const pointById = new Map(
    reconstruction.vertices.map((vertex) => {
      const [x, y] = sourceCoordinates(vertex);
      return [vertex.id, projective(pose(x, y))] as const;
    }),
  );
  return {
    meshRevisionId: 'Mesh:event-polynomial:fixture:1',
    triangulationRevisionId: 'Triangulation:event-polynomial:fixture:1',
    poseRevisionId,
    reconstruction,
    staticTriangleSet: {
      triangles: reconstruction.faces.flatMap((face) =>
        face.triangles.map((triangle) => {
          const points = triangle.vertexIds.map((vertexId) => pointById.get(vertexId));
          const first = points[0];
          const second = points[1];
          const third = points[2];
          if (first === undefined || second === undefined || third === undefined) {
            throw new TypeError('pose fixture vertex must resolve');
          }
          return {
            triangleId: triangle.id,
            triangle: [first, second, third] as StaticRationalTriangle3,
          };
        }),
      ),
    },
  };
}

function bind(
  supplied: ReturnType<typeof bindingInput>,
): StaticRationalTriangleFoldMeshBindingRecordV1 {
  const result = bindStaticRationalTrianglePoseToFoldMeshV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('mesh binding fixture must succeed');
  return result.value;
}

function planarPose(x: ExactRational, y: ExactRational): RationalPoint3 {
  return [x, y, ZERO];
}

function quarterRightOf(hingeX: ExactRational): Pose {
  return (x, y) => {
    const offset = subtractExactRational(x, hingeX);
    return offset.numerator <= 0n ? [x, y, ZERO] : [hingeX, y, offset];
  };
}

function transitionInput(source: Record<string, unknown>, hingeX: ExactRational) {
  const reconstruction = reconstruct(source);
  const startBindingInput = bindingInput(reconstruction, 'Pose:start:1', planarPose);
  const endBindingInput = bindingInput(reconstruction, 'Pose:end:1', quarterRightOf(hingeX));
  const startBinding = bind(startBindingInput);
  const sourceXById = new Map(
    reconstruction.vertices.map((vertex) => [vertex.id, sourceCoordinates(vertex)[0]]),
  );
  const hinge = startBinding.edges.find(
    (edge) =>
      edge.structuralKind === 'declared-hinge' &&
      edge.vertexIds.every((vertexId) => {
        const x = sourceXById.get(vertexId);
        return (
          x !== undefined && x.numerator * hingeX.denominator === hingeX.numerator * x.denominator
        );
      }),
  );
  if (hinge === undefined) throw new TypeError('active hinge fixture must exist');
  const movingFace = reconstruction.faces.find(
    (face) =>
      hinge.incidentFaceIds.includes(face.id) &&
      face.triangles.some((triangle) =>
        triangle.vertexIds.some((vertexId) => {
          const x = sourceXById.get(vertexId);
          return (
            x !== undefined && x.numerator * hingeX.denominator > hingeX.numerator * x.denominator
          );
        }),
      ),
  );
  if (movingFace === undefined) throw new TypeError('moving face fixture must exist');
  return {
    transitionRevisionId: 'Transition:event-polynomial:fixture:1',
    stepId: 'Step:event-polynomial:fixture:1',
    activeHingeEdgeId: hinge.edgeId,
    movingSideFaceId: movingFace.id,
    slab: SLAB,
    startBindingInput,
    endBindingInput,
  };
}

function census(
  supplied = transitionInput(twoFaceSource(), HALF),
): SingleHingeRationalScheduleEventPolynomialCensusRecordV1 {
  const result = computeSingleHingeRationalScheduleEventPolynomialCensusV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('event polynomial census fixture must succeed');
  return result.value;
}

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

function polynomialSign(coefficients: readonly bigint[], parameter: ExactRational): -1 | 0 | 1 {
  let value = ZERO;
  for (let index = coefficients.length - 1; index >= 0; index -= 1) {
    value = addExactRational(
      exactRational(coefficients[index] ?? 0n),
      multiplyExactRational(parameter, value),
    );
  }
  return signExactRational(value);
}

function geometricEventSign(
  record: SingleHingeRationalScheduleEventPolynomialCensusRecordV1,
  event: SingleHingeRationalScheduleEventPolynomialV1,
  parameter: ExactRational,
): -1 | 0 | 1 {
  const pointById = new Map(
    record.schedule.vertexPaths.map((path) => [
      path.vertexId,
      evaluateSingleHingeRationalHalfAngleVertexPathV1(
        path,
        record.schedule.commonDenominator,
        parameter,
      ),
    ]),
  );
  const point = (vertexId: string): ProjectivePoint3 => {
    const found = pointById.get(vertexId);
    if (found === undefined) throw new TypeError('event vertex point must exist');
    return found;
  };
  if (event.eventKind === 'vertex-face-plane') {
    return projectiveOrient3DSign(
      point(event.faceVertexIds[0]),
      point(event.faceVertexIds[1]),
      point(event.faceVertexIds[2]),
      point(event.vertexId),
    );
  }
  return projectiveOrient3DSign(
    point(event.firstEdgeVertexIds[0]),
    point(event.firstEdgeVertexIds[1]),
    point(event.secondEdgeVertexIds[0]),
    point(event.secondEdgeVertexIds[1]),
  );
}

describe('single-hinge rational schedule exact event polynomial census candidate', () => {
  it('enumerates all six vertex-face and nine edge-edge events for every inter-face pair', () => {
    const record = census();
    expect(record).toMatchObject({
      recordType: 'm0f-single-hinge-rational-schedule-event-polynomial-census',
      contractStatus: 'candidate-no-claim',
      triangleCount: 4,
      unorderedTrianglePairCount: 6,
      sameSourceFacePairExcludedCount: 2,
      interSourceFacePairCount: 4,
      vertexFaceEventCount: 24,
      edgeEdgeEventCount: 36,
      eventCount: 60,
    });
    expect(record.events.map((event) => event.eventIndex)).toEqual(
      Array.from({ length: 60 }, (_, index) => index),
    );
    expect(new Set(record.events.map((event) => event.eventId)).size).toBe(60);
    expect(record.identicallyZeroEventCount).toBeGreaterThan(0);
    expect(record.nonzeroEventCount + record.identicallyZeroEventCount).toBe(60);
  });

  it('emits trimmed primitive integer coefficients within the degree and bit limits', () => {
    const record = census();
    for (const event of record.events) {
      const coefficients = event.primitiveIntegerCoefficientsLowToHigh;
      expect(coefficients.length).toBeGreaterThan(0);
      expect(coefficients.length - 1).toBeLessThanOrEqual(
        SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxPolynomialDegree,
      );
      if (event.identicallyZero) {
        expect(coefficients).toEqual([0n]);
        expect(event.polynomialDegree).toBeNull();
      } else {
        expect(coefficients.at(-1)).not.toBe(0n);
        expect(event.polynomialDegree).toBe(coefficients.length - 1);
        expect(
          coefficients.reduce(
            (content, coefficient) => greatestCommonDivisor(content, coefficient),
            0n,
          ),
        ).toBe(1n);
      }
      expect(event.startSign).toBe(polynomialSign(coefficients, ZERO));
      expect(event.endSign).toBe(polynomialSign(coefficients, ONE));
    }
    expect(record.maximumObservedPolynomialDegree).toBeLessThanOrEqual(6);
  });

  it('matches every polynomial sign to the actual exact 3D orientation at three times', () => {
    const record = census();
    for (const parameter of [ZERO, HALF, ONE]) {
      for (const event of record.events) {
        expect(polynomialSign(event.primitiveIntegerCoefficientsLowToHigh, parameter)).toBe(
          geometricEventSign(record, event, parameter),
        );
      }
    }
  });

  it('retains persistent shared-hinge coplanarity candidates instead of discarding zeros', () => {
    const record = census();
    const persistent = record.events.filter((event) => event.identicallyZero);
    expect(persistent.length).toBe(record.identicallyZeroEventCount);
    expect(
      persistent.every(
        (event) =>
          event.boundaryClass === 'identically-zero' &&
          event.startSign === 0 &&
          event.endSign === 0,
      ),
    ).toBe(true);
    expect(
      persistent.some((event) => event.topologyRelation === 'declared-hinge-adjacent-faces'),
    ).toBe(true);
  });

  it('includes nonadjacent pairs in a three-face component without promoting roots to collisions', () => {
    const record = census(transitionInput(threeFaceStripSource(), ONE));
    expect(record.triangleCount).toBe(6);
    expect(record.unorderedTrianglePairCount).toBe(15);
    expect(record.sameSourceFacePairExcludedCount).toBe(3);
    expect(record.interSourceFacePairCount).toBe(12);
    expect(record.eventCount).toBe(180);
    expect(
      record.events.some((event) => event.topologyRelation === 'distinct-nonadjacent-faces'),
    ).toBe(true);
    expect(record.eventRootIsolationIncluded).toBe(false);
    expect(record.collisionEventCompletenessEstablished).toBe(false);
  });

  it('is invariant under triangle order and propagates schedule rejection', () => {
    const canonical = transitionInput(twoFaceSource(), HALF);
    const reordered = transitionInput(twoFaceSource(), HALF);
    reordered.startBindingInput.staticTriangleSet.triangles.reverse();
    reordered.endBindingInput.staticTriangleSet.triangles.reverse();
    expect(census(reordered)).toEqual(census(canonical));

    const rejectedInput = transitionInput(twoFaceSource(), HALF);
    rejectedInput.endBindingInput.poseRevisionId = 'bad revision id';
    const rejected = computeSingleHingeRationalScheduleEventPolynomialCensusV1(rejectedInput);
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new TypeError('invalid schedule must fail');
    expect(rejected.error).toContainEqual(
      expect.objectContaining({ stage: 'schedule', code: 'invalid-revision-id' }),
    );
  });

  it('deep-freezes the complete ledger while keeping root and collision claims false', () => {
    const result = computeSingleHingeRationalScheduleEventPolynomialCensusV1(
      transitionInput(twoFaceSource(), HALF),
    );
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('event census fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.events)).toBe(true);
    expect(Object.isFrozen(result.value.events[0]?.primitiveIntegerCoefficientsLowToHigh)).toBe(
      true,
    );
    expect(result.value).toMatchObject({
      commonPositiveScheduleDenominatorRemoved: true,
      completeInterSourceFacePairEnumerationIncluded: true,
      allSixVertexFacePlaneEventsPerPairIncluded: true,
      allNineEdgeEdgeCoplanarityEventsPerPairIncluded: true,
      exactNecessaryCoplanarityPolynomialsIncluded: true,
      sameSourceFaceStructuralExclusionIncluded: true,
      identicallyZeroPersistentCandidatesRetained: true,
      eventRootIsolationIncluded: false,
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
