import { describe, expect, it } from 'vitest';

import {
  analyzeSingleHingeRationalScheduleStaticSampleV1,
  type SingleHingeRationalScheduleStaticSampleRecordV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-static-sample.js';
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
  compareExactRational,
  exactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../../m0f/model/exact-rational.js';
import {
  projectivePoint3FromRationalComponents,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

type RationalPoint3 = readonly [x: ExactRational, y: ExactRational, z: ExactRational];
type Pose = (x: ExactRational, y: ExactRational) => RationalPoint3;

const ZERO = exactRational(0n);
const ONE = exactRational(1n);
const HALF = exactRational(1n, 2n);
const THREE_FIFTHS = exactRational(3n, 5n);
const FOUR_FIFTHS = exactRational(4n, 5n);

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
    meshRevisionId: 'Mesh:sample:fixture:1',
    triangulationRevisionId: 'Triangulation:sample:fixture:1',
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

function quarterPose(x: ExactRational, y: ExactRational): RationalPoint3 {
  const offset = subtractExactRational(x, HALF);
  return offset.numerator <= 0n ? [x, y, ZERO] : [HALF, y, offset];
}

function hingeAtSourceX(
  binding: StaticRationalTriangleFoldMeshBindingRecordV1,
  reconstruction: CandidateFoldFaceReconstructionV1,
  hingeX: ExactRational,
) {
  const sourceXById = new Map(
    reconstruction.vertices.map((vertex) => [vertex.id, sourceCoordinates(vertex)[0]]),
  );
  const hinge = binding.edges.find(
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
  return hinge;
}

function positiveSideFace(
  reconstruction: CandidateFoldFaceReconstructionV1,
  incidentFaceIds: readonly string[],
  hingeX: ExactRational,
): string {
  const sourceXById = new Map(
    reconstruction.vertices.map((vertex) => [vertex.id, sourceCoordinates(vertex)[0]]),
  );
  const face = reconstruction.faces.find(
    (candidate) =>
      incidentFaceIds.includes(candidate.id) &&
      candidate.triangles.some((triangle) =>
        triangle.vertexIds.some((vertexId) => {
          const x = sourceXById.get(vertexId);
          return (
            x !== undefined && x.numerator * hingeX.denominator > hingeX.numerator * x.denominator
          );
        }),
      ),
  );
  if (face === undefined) throw new TypeError('moving-side face fixture must exist');
  return face.id;
}

function transitionInput(
  source: Record<string, unknown>,
  startPose: Pose,
  endPose: Pose,
  hingeX: ExactRational,
  slab = {
    t0: { numerator: 0n, exponent: 0 },
    t1: { numerator: 1n, exponent: 0 },
  },
) {
  const reconstruction = reconstruct(source);
  const startBindingInput = bindingInput(reconstruction, 'Pose:start:1', startPose);
  const endBindingInput = bindingInput(reconstruction, 'Pose:end:1', endPose);
  const startBinding = bind(startBindingInput);
  const hinge = hingeAtSourceX(startBinding, reconstruction, hingeX);
  return {
    transitionRevisionId: 'Transition:sample:fixture:1',
    stepId: 'Step:sample:fixture:1',
    activeHingeEdgeId: hinge.edgeId,
    movingSideFaceId: positiveSideFace(reconstruction, hinge.incidentFaceIds, hingeX),
    slab,
    startBindingInput,
    endBindingInput,
  };
}

function twoFaceTransition(
  slab = {
    t0: { numerator: 0n, exponent: 0 },
    t1: { numerator: 1n, exponent: 0 },
  },
) {
  return transitionInput(twoFaceSource(), planarPose, quarterPose, HALF, slab);
}

function sampleInput(
  transition: ReturnType<typeof twoFaceTransition>,
  numerator: bigint,
  exponent = 0,
  sampleRevisionId = 'Pose:sample:1',
) {
  return {
    transitionInput: transition,
    sample: { sampleRevisionId, sampleTime: { numerator, exponent } },
  };
}

function analyze(
  supplied = sampleInput(twoFaceTransition(), 1n, 1),
): SingleHingeRationalScheduleStaticSampleRecordV1 {
  const result = analyzeSingleHingeRationalScheduleStaticSampleV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('exact static sample fixture must succeed');
  return result.value;
}

function crossingEndPose(x: ExactRational, y: ExactRational): RationalPoint3 {
  if (compareExactRational(x, ONE) <= 0) return [x, y, ZERO];
  const fromFirst = subtractExactRational(x, ONE);
  if (compareExactRational(x, exactRational(2n)) <= 0) {
    return [
      subtractExactRational(ONE, multiplyExactRational(THREE_FIFTHS, fromFirst)),
      y,
      multiplyExactRational(FOUR_FIFTHS, fromFirst),
    ];
  }
  return [
    exactRational(2n, 5n),
    y,
    subtractExactRational(FOUR_FIFTHS, subtractExactRational(x, exactRational(2n))),
  ];
}

function crossingStartPose(x: ExactRational, y: ExactRational): RationalPoint3 {
  const end = crossingEndPose(x, y);
  if (compareExactRational(x, ONE) <= 0) return end;
  const endRelativeX = subtractExactRational(end[0], ONE);
  return [
    addExactRational(
      ONE,
      subtractExactRational(
        multiplyExactRational(THREE_FIFTHS, endRelativeX),
        multiplyExactRational(FOUR_FIFTHS, end[2]),
      ),
    ),
    y,
    addExactRational(
      multiplyExactRational(FOUR_FIFTHS, endRelativeX),
      multiplyExactRational(THREE_FIFTHS, end[2]),
    ),
  ];
}

describe('single-hinge rational schedule exact static sample candidate', () => {
  it('evaluates complete start, midpoint, and end poses at exact dyadic times', () => {
    const transition = twoFaceTransition();
    const start = analyze(sampleInput(transition, 0n));
    const midpoint = analyze(sampleInput(transition, 1n, 1));
    const end = analyze(sampleInput(transition, 1n));
    expect(start.timePosition).toBe('start');
    expect(start.normalizedTime).toEqual({ numerator: 0n, denominator: 1n });
    expect(midpoint.timePosition).toBe('interior');
    expect(midpoint.normalizedTime).toEqual({ numerator: 1n, denominator: 2n });
    expect(end.timePosition).toBe('end');
    expect(end.normalizedTime).toEqual({ numerator: 1n, denominator: 1n });
    expect(start.sampledVertices).toEqual(start.schedule.transition.startBinding.vertices);
    expect(end.sampledVertices).toEqual(end.schedule.transition.endBinding.vertices);
    expect(midpoint).toMatchObject({
      vertexCount: 6,
      triangleCount: 4,
      unorderedPairCount: 6,
      staticNonadjacentInteriorCrossingDetected: false,
      nonadjacentStaticInteriorCrossingEvidencePairCount: 0,
    });
    const movingCorner = midpoint.sampledVertices.find(
      (vertex) =>
        vertex.point.x === 4n &&
        vertex.point.y === 0n &&
        vertex.point.z === 2n &&
        vertex.point.w === 5n,
    );
    expect(movingCorner).toBeDefined();
  });

  it('normalizes an arbitrary dyadic slab before evaluating the same path', () => {
    const transition = twoFaceTransition({
      t0: { numerator: 1n, exponent: 0 },
      t1: { numerator: 3n, exponent: 0 },
    });
    const record = analyze(sampleInput(transition, 2n));
    expect(record.sampleTime).toEqual({ numerator: 2n, exponent: 0 });
    expect(record.normalizedTime).toEqual({ numerator: 1n, denominator: 2n });
    expect(record.timePosition).toBe('interior');
  });

  it('detects an actual exact nonadjacent interior crossing at a schedule endpoint', () => {
    const transition = transitionInput(
      threeFaceStripSource(),
      crossingStartPose,
      crossingEndPose,
      ONE,
    );
    const record = analyze({
      transitionInput: transition,
      sample: {
        sampleRevisionId: 'Pose:sample:crossing:1',
        sampleTime: { numerator: 1n, exponent: 0 },
      },
    });
    expect(record.triangleCount).toBe(6);
    expect(record.unorderedPairCount).toBe(15);
    expect(record.staticNonadjacentInteriorCrossingDetected).toBe(true);
    expect(record.nonadjacentStaticInteriorCrossingEvidencePairCount).toBeGreaterThan(0);
    expect(
      record.strata.pairs
        .filter((pair) => pair.category === 'nonadjacent-static-interior-crossing-evidence')
        .every(
          (pair) =>
            pair.topology.pairRelation === 'distinct-nonadjacent-faces' &&
            pair.strata.staticInteriorInteriorIntersectionDetected,
        ),
    ).toBe(true);
  });

  it('rejects out-of-slab and noncanonical sample times', () => {
    const outside = analyzeSingleHingeRationalScheduleStaticSampleV1(
      sampleInput(twoFaceTransition(), 2n),
    );
    expect(outside.ok).toBe(false);
    if (outside.ok) throw new TypeError('outside sample must fail');
    expect(outside.error).toContainEqual(
      expect.objectContaining({ stage: 'sample', code: 'sample-time-outside-slab' }),
    );

    const noncanonical = analyzeSingleHingeRationalScheduleStaticSampleV1(
      sampleInput(twoFaceTransition(), 2n, 1),
    );
    expect(noncanonical.ok).toBe(false);
    if (noncanonical.ok) throw new TypeError('noncanonical sample must fail');
    expect(noncanonical.error).toContainEqual(
      expect.objectContaining({ stage: 'sample', code: 'noncanonical-dyadic' }),
    );
  });

  it('propagates schedule rejection with transition-relative diagnostic paths', () => {
    const transition = twoFaceTransition();
    transition.endBindingInput.poseRevisionId = 'bad revision id';
    const result = analyzeSingleHingeRationalScheduleStaticSampleV1(sampleInput(transition, 1n, 1));
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('invalid transition must fail');
    const scheduleError = result.error.find((entry) => entry.stage === 'schedule');
    expect(scheduleError?.path).toContain('$.transitionInput');
    expect(scheduleError?.code).toBe('invalid-revision-id');
  });

  it('is invariant under triangle order and rejects sample accessors without invocation', () => {
    const canonical = twoFaceTransition();
    const reordered = twoFaceTransition();
    reordered.startBindingInput.staticTriangleSet.triangles.reverse();
    reordered.endBindingInput.staticTriangleSet.triangles.reverse();
    expect(analyze(sampleInput(reordered, 1n, 1))).toEqual(analyze(sampleInput(canonical, 1n, 1)));

    let getterCalls = 0;
    const hostile = sampleInput(twoFaceTransition(), 1n, 1);
    Object.defineProperty(hostile.sample, 'sampleRevisionId', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'Pose:hostile';
      },
    });
    expect(analyzeSingleHingeRationalScheduleStaticSampleV1(hostile).ok).toBe(false);
    expect(getterCalls).toBe(0);

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(() => analyzeSingleHingeRationalScheduleStaticSampleV1(revoked.proxy)).not.toThrow();
  });

  it('deep-freezes actual static evidence while keeping interval and product claims false', () => {
    const result = analyzeSingleHingeRationalScheduleStaticSampleV1(
      sampleInput(twoFaceTransition(), 1n, 1),
    );
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('sample fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.sampledVertices[0]?.point)).toBe(true);
    expect(Object.isFrozen(result.value.sampledTriangles[0]?.triangle)).toBe(true);
    expect(Object.isFrozen(result.value.strata.pairs[0]?.strata)).toBe(true);
    expect(result.value).toMatchObject({
      exactScheduleEvaluationIncluded: true,
      completeMeshVertexSampleIncluded: true,
      completeMeshTriangleSampleIncluded: true,
      sourceFaceRigidityRecheckedAtSample: true,
      allStaticTrianglePairsIncluded: true,
      actualStatic3dIntersectionStrataIncluded: true,
      staticSelfIntersectionEvidenceIncluded: true,
      sampleOnly: true,
      continuousIntervalCovered: false,
      eventRootIsolationIncluded: false,
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
