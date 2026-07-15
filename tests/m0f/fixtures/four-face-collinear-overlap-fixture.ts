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
const THREE = exactRational(3n);
const FOUR = exactRational(4n);
const SEVEN = exactRational(7n);
const TWELVE = exactRational(12n);
const THREE_FIFTHS = exactRational(3n, 5n);
const FOUR_FIFTHS = exactRational(4n, 5n);

function fourFaceStripSource(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [3, 0],
      [7, 0],
      [12, 0],
      [15, 0],
      [15, 1],
      [12, 1],
      [7, 1],
      [3, 1],
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
      [7, 8],
      [8, 9],
      [9, 0],
      [1, 8],
      [2, 7],
      [3, 6],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M', 'V'],
    facesVertices: null,
  };
}

function reconstruct(): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(fourFaceStripSource());
  if (!result.ok) throw new TypeError('four-face collinear reconstruction fixture must succeed');
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

/** Folds the 3/4/5 middle pair back so the two outer faces coincide exactly. */
function loopbackStartPose(x: ExactRational, y: ExactRational): RationalPoint3 {
  if (compareExactRational(x, THREE) <= 0) return [x, y, ZERO];
  if (compareExactRational(x, SEVEN) <= 0) {
    return [THREE, y, subtractExactRational(x, THREE)];
  }
  if (compareExactRational(x, TWELVE) <= 0) {
    const fromActiveHinge = subtractExactRational(x, SEVEN);
    return [
      subtractExactRational(THREE, multiplyExactRational(THREE_FIFTHS, fromActiveHinge)),
      y,
      subtractExactRational(FOUR, multiplyExactRational(FOUR_FIFTHS, fromActiveHinge)),
    ];
  }
  return [subtractExactRational(x, TWELVE), y, ZERO];
}

/** Rotates the right two-face component a rational quarter turn about x=7. */
function quarterTurnEndPose(x: ExactRational, y: ExactRational): RationalPoint3 {
  const start = loopbackStartPose(x, y);
  if (compareExactRational(x, SEVEN) <= 0) return start;
  const relativeX = subtractExactRational(start[0], THREE);
  const relativeZ = subtractExactRational(start[2], FOUR);
  return [subtractExactRational(THREE, relativeZ), y, addExactRational(FOUR, relativeX)];
}

function rotatedLoopbackPose(cosine: ExactRational, sine: ExactRational): Pose {
  return (x, y) => {
    const start = loopbackStartPose(x, y);
    if (compareExactRational(x, SEVEN) <= 0) return start;
    const relativeX = subtractExactRational(start[0], THREE);
    const relativeZ = subtractExactRational(start[2], FOUR);
    return [
      addExactRational(
        THREE,
        subtractExactRational(
          multiplyExactRational(cosine, relativeX),
          multiplyExactRational(sine, relativeZ),
        ),
      ),
      y,
      addExactRational(
        FOUR,
        addExactRational(
          multiplyExactRational(sine, relativeX),
          multiplyExactRational(cosine, relativeZ),
        ),
      ),
    ];
  };
}

function bindingInput(
  reconstruction: CandidateFoldFaceReconstructionV1,
  poseRevisionId: string,
  pose: Pose,
) {
  const pointById = new Map(
    reconstruction.vertices.map((vertex) => {
      const [x, y] = sourceCoordinates(vertex);
      const point = pose(x, y);
      return [
        vertex.id,
        projectivePoint3FromRationalComponents(
          [point[0].numerator, point[0].denominator],
          [point[1].numerator, point[1].denominator],
          [point[2].numerator, point[2].denominator],
        ),
      ] as const;
    }),
  );
  return {
    meshRevisionId: 'Mesh:four-face-collinear-overlap:fixture:1',
    triangulationRevisionId: 'Triangulation:four-face-collinear-overlap:fixture:1',
    poseRevisionId,
    reconstruction,
    staticTriangleSet: {
      triangles: reconstruction.faces.flatMap((face) =>
        face.triangles.map((triangle) => {
          const first = pointById.get(triangle.vertexIds[0]);
          const second = pointById.get(triangle.vertexIds[1]);
          const third = pointById.get(triangle.vertexIds[2]);
          if (first === undefined || second === undefined || third === undefined) {
            throw new TypeError('four-face collinear pose vertex must resolve');
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
  if (!result.ok) throw new TypeError('four-face collinear mesh binding fixture must succeed');
  return result.value;
}

/**
 * Four faces with a central active hinge and one prefolded face on each side.
 * At the start, the two outer faces coincide along a line skew to the active
 * axis; their duplicated triangulation diagonals are finite collinear roots.
 */
export function makeFourFaceCollinearOverlapTransitionFixture() {
  const reconstruction = reconstruct();
  const startBindingInput = bindingInput(
    reconstruction,
    'Pose:four-face-collinear-overlap:start:1',
    loopbackStartPose,
  );
  const endBindingInput = bindingInput(
    reconstruction,
    'Pose:four-face-collinear-overlap:end:1',
    quarterTurnEndPose,
  );
  const startBinding = bind(startBindingInput);
  const sourceXById = new Map(
    reconstruction.vertices.map((vertex) => [vertex.id, sourceCoordinates(vertex)[0]]),
  );
  const hinge = startBinding.edges.find(
    (edge) =>
      edge.structuralKind === 'declared-hinge' &&
      edge.vertexIds.every((vertexId) => {
        const x = sourceXById.get(vertexId);
        return x !== undefined && compareExactRational(x, SEVEN) === 0;
      }),
  );
  if (hinge === undefined) throw new TypeError('four-face collinear active hinge must exist');
  const movingFace = reconstruction.faces.find(
    (face) =>
      hinge.incidentFaceIds.includes(face.id) &&
      face.triangles.some((triangle) =>
        triangle.vertexIds.some((vertexId) => {
          const x = sourceXById.get(vertexId);
          return x !== undefined && compareExactRational(x, SEVEN) > 0;
        }),
      ),
  );
  if (movingFace === undefined) throw new TypeError('four-face collinear moving face must exist');
  return {
    transitionRevisionId: 'Transition:four-face-collinear-overlap:fixture:1',
    stepId: 'Step:four-face-collinear-overlap:fixture:1',
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

/**
 * Rotates the same moving component from sin/cos = -4/5,3/5 to +4/5,3/5.
 * The loopback pose is therefore crossed in the interior of the rational
 * half-angle schedule instead of occurring at an endpoint.
 */
export function makeFourFaceInteriorCollinearOverlapEvenRootTransitionFixture() {
  const reconstruction = reconstruct();
  const startBindingInput = bindingInput(
    reconstruction,
    'Pose:four-face-interior-even-root:start:1',
    rotatedLoopbackPose(THREE_FIFTHS, exactRational(-4n, 5n)),
  );
  const endBindingInput = bindingInput(
    reconstruction,
    'Pose:four-face-interior-even-root:end:1',
    rotatedLoopbackPose(THREE_FIFTHS, FOUR_FIFTHS),
  );
  const startBinding = bind(startBindingInput);
  const sourceXById = new Map(
    reconstruction.vertices.map((vertex) => [vertex.id, sourceCoordinates(vertex)[0]]),
  );
  const hinge = startBinding.edges.find(
    (edge) =>
      edge.structuralKind === 'declared-hinge' &&
      edge.vertexIds.every((vertexId) => {
        const x = sourceXById.get(vertexId);
        return x !== undefined && compareExactRational(x, SEVEN) === 0;
      }),
  );
  if (hinge === undefined) throw new TypeError('four-face interior-even active hinge must exist');
  const movingFace = reconstruction.faces.find(
    (face) =>
      hinge.incidentFaceIds.includes(face.id) &&
      face.triangles.some((triangle) =>
        triangle.vertexIds.some((vertexId) => {
          const x = sourceXById.get(vertexId);
          return x !== undefined && compareExactRational(x, SEVEN) > 0;
        }),
      ),
  );
  if (movingFace === undefined) {
    throw new TypeError('four-face interior-even moving face must exist');
  }
  return {
    transitionRevisionId: 'Transition:four-face-interior-even-root:fixture:1',
    stepId: 'Step:four-face-interior-even-root:fixture:1',
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
