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
const TWO = exactRational(2n);
const THREE_FIFTHS = exactRational(3n, 5n);
const FOUR_FIFTHS = exactRational(4n, 5n);

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

function reconstruct(): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(threeFaceStripSource());
  if (!result.ok) throw new TypeError('symmetric crossing reconstruction fixture must succeed');
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

function baselinePose(x: ExactRational, y: ExactRational): RationalPoint3 {
  if (compareExactRational(x, ONE) <= 0) return [x, y, ZERO];
  const fromFirstHinge = subtractExactRational(x, ONE);
  if (compareExactRational(x, TWO) <= 0) {
    return [
      subtractExactRational(ONE, multiplyExactRational(THREE_FIFTHS, fromFirstHinge)),
      y,
      multiplyExactRational(FOUR_FIFTHS, fromFirstHinge),
    ];
  }
  return [
    exactRational(2n, 5n),
    y,
    subtractExactRational(FOUR_FIFTHS, subtractExactRational(x, TWO)),
  ];
}

function rotateBaseline(sign: -1 | 1): Pose {
  return (x, y) => {
    const baseline = baselinePose(x, y);
    if (compareExactRational(x, ONE) <= 0) return baseline;
    const relativeX = subtractExactRational(baseline[0], ONE);
    const signedSine = exactRational(BigInt(sign) * 4n, 5n);
    return [
      addExactRational(
        ONE,
        subtractExactRational(
          multiplyExactRational(THREE_FIFTHS, relativeX),
          multiplyExactRational(signedSine, baseline[2]),
        ),
      ),
      y,
      addExactRational(
        multiplyExactRational(signedSine, relativeX),
        multiplyExactRational(THREE_FIFTHS, baseline[2]),
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
    meshRevisionId: 'Mesh:symmetric-three-face-crossing:fixture:1',
    triangulationRevisionId: 'Triangulation:symmetric-three-face-crossing:fixture:1',
    poseRevisionId,
    reconstruction,
    staticTriangleSet: {
      triangles: reconstruction.faces.flatMap((face) =>
        face.triangles.map((triangle) => {
          const first = pointById.get(triangle.vertexIds[0]);
          const second = pointById.get(triangle.vertexIds[1]);
          const third = pointById.get(triangle.vertexIds[2]);
          if (first === undefined || second === undefined || third === undefined) {
            throw new TypeError('symmetric crossing pose vertex must resolve');
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
  if (!result.ok) throw new TypeError('symmetric crossing mesh binding fixture must succeed');
  return result.value;
}

/**
 * Three source faces with one rigidly folded two-face moving component. The
 * component starts at R(+phi)B and ends at R(-phi)B around x=1, where
 * cos(phi)=3/5 and sin(phi)=4/5. This creates an irrational normalized event
 * time while retaining rational endpoint coordinates.
 */
export function makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture() {
  const reconstruction = reconstruct();
  const startBindingInput = bindingInput(
    reconstruction,
    'Pose:symmetric-three-face-crossing:start:1',
    rotateBaseline(1),
  );
  const endBindingInput = bindingInput(
    reconstruction,
    'Pose:symmetric-three-face-crossing:end:1',
    rotateBaseline(-1),
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
        return x !== undefined && compareExactRational(x, ONE) === 0;
      }),
  );
  if (hinge === undefined) throw new TypeError('symmetric crossing active hinge must exist');
  const movingFace = reconstruction.faces.find(
    (face) =>
      hinge.incidentFaceIds.includes(face.id) &&
      face.triangles.some((triangle) =>
        triangle.vertexIds.some((vertexId) => {
          const x = sourceXById.get(vertexId);
          return x !== undefined && compareExactRational(x, ONE) > 0;
        }),
      ),
  );
  if (movingFace === undefined) throw new TypeError('symmetric crossing moving face must exist');
  return {
    transitionRevisionId: 'Transition:symmetric-three-face-crossing:fixture:1',
    stepId: 'Step:symmetric-three-face-crossing:fixture:1',
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
