import {
  bindStaticRationalTrianglePoseToFoldMeshV1,
  type StaticRationalTriangleFoldMeshBindingRecordV1,
} from '../../../m0f/geometry/static-rational-triangle-fold-mesh-binding.js';
import type { StaticRationalTriangle3 } from '../../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
} from '../../../m0f/geometry/reconstruct-fold-faces.js';
import {
  addExactRational,
  compareExactRational,
  exactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../../../m0f/model/exact-rational.js';
import { projectivePoint3FromRationalComponents } from '../../../m0f/reference-verifier/projective-rational-3d.js';

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
  if (!result.ok) throw new TypeError('shared FOLD reconstruction fixture must succeed');
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

function bindingInput(
  reconstruction: CandidateFoldFaceReconstructionV1,
  poseRevisionId: string,
  pose: Pose,
) {
  const pointById = new Map(
    reconstruction.vertices.map((vertex) => {
      const [x, y] = sourceCoordinates(vertex);
      return [
        vertex.id,
        projectivePoint3FromRationalComponents(
          [pose(x, y)[0].numerator, pose(x, y)[0].denominator],
          [pose(x, y)[1].numerator, pose(x, y)[1].denominator],
          [pose(x, y)[2].numerator, pose(x, y)[2].denominator],
        ),
      ] as const;
    }),
  );
  return {
    meshRevisionId: 'Mesh:shared-single-hinge:fixture:1',
    triangulationRevisionId: 'Triangulation:shared-single-hinge:fixture:1',
    poseRevisionId,
    reconstruction,
    staticTriangleSet: {
      triangles: reconstruction.faces.flatMap((face) =>
        face.triangles.map((triangle) => {
          const first = pointById.get(triangle.vertexIds[0]);
          const second = pointById.get(triangle.vertexIds[1]);
          const third = pointById.get(triangle.vertexIds[2]);
          if (first === undefined || second === undefined || third === undefined) {
            throw new TypeError('shared pose fixture vertex must resolve');
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
  if (!result.ok) throw new TypeError('shared mesh binding fixture must succeed');
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

function transition(
  source: Record<string, unknown>,
  startPose: Pose,
  endPose: Pose,
  hingeX: ExactRational,
) {
  const reconstruction = reconstruct(source);
  const startBindingInput = bindingInput(reconstruction, 'Pose:shared:start:1', startPose);
  const endBindingInput = bindingInput(reconstruction, 'Pose:shared:end:1', endPose);
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
  if (hinge === undefined) throw new TypeError('shared active hinge fixture must exist');
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
  if (movingFace === undefined) throw new TypeError('shared moving face fixture must exist');
  return {
    transitionRevisionId: 'Transition:shared-single-hinge:fixture:1',
    stepId: 'Step:shared-single-hinge:fixture:1',
    activeHingeEdgeId: hinge.edgeId,
    movingSideFaceId: movingFace.id,
    slab: {
      t0: { numerator: 0n, exponent: 0 },
      t1: { numerator: 1n, exponent: 0 },
    },
    startBindingInput,
    endBindingInput,
  };
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

export function makeTwoFaceQuarterTransitionFixture() {
  return transition(twoFaceSource(), planarPose, quarterRightOf(HALF), HALF);
}

export function makeThreeFaceQuarterTransitionFixture() {
  return transition(threeFaceStripSource(), planarPose, quarterRightOf(ONE), ONE);
}

export function makeThreeFaceCrossingTransitionFixture() {
  return transition(threeFaceStripSource(), crossingStartPose, crossingEndPose, ONE);
}
