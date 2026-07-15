import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { deepFreezeOwned } from './clone-and-freeze.js';
import { reconstructFoldFacesCandidateV1 } from './geometry/reconstruct-fold-faces.js';
import {
  STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT_RECORD_TYPE,
  STATIC_EXACT_3D_PORTABLE_COORDINATE_ENCODING,
  evaluateStaticExact3dCandidateFlowV1,
  type StaticExact3dPortablePointV1,
} from './static-exact-3d-candidate-flow.js';
import { serializeJsonLine } from './stable-json.js';

const USAGE = `Usage: npm run m0f:static-exact-3d-candidate-flow -- [input.json]
       npm run m0f:static-exact-3d-candidate-flow -- --example

Runs exact diagnostics for one static 3D pose. The result is not continuous CCD,
legal-contact, physical layer-order, collision-freedom, or M0F gate evidence.
`;

const THREE_FACE_STRIP_SOURCE = Object.freeze({
  specVersion: '1.2',
  verticesCoords: Object.freeze([
    Object.freeze([0, 0]),
    Object.freeze([1, 0]),
    Object.freeze([2, 0]),
    Object.freeze([3, 0]),
    Object.freeze([3, 1]),
    Object.freeze([2, 1]),
    Object.freeze([1, 1]),
    Object.freeze([0, 1]),
  ]),
  edgesVertices: Object.freeze([
    Object.freeze([0, 1]),
    Object.freeze([1, 2]),
    Object.freeze([2, 3]),
    Object.freeze([3, 4]),
    Object.freeze([4, 5]),
    Object.freeze([5, 6]),
    Object.freeze([6, 7]),
    Object.freeze([7, 0]),
    Object.freeze([1, 6]),
    Object.freeze([2, 5]),
  ]),
  edgesAssignment: Object.freeze(['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M']),
  facesVertices: null,
});

function foldedPoint(sourceVertexIndex: number): StaticExact3dPortablePointV1 {
  const source = THREE_FACE_STRIP_SOURCE.verticesCoords[sourceVertexIndex];
  if (source === undefined) throw new TypeError('fixed source vertex must exist');
  const x = source[0];
  const y = source[1];
  if (x === undefined || y === undefined) throw new TypeError('fixed source point must be 2D');
  const foldedX = x <= 1 ? x : x <= 2 ? 2 - x : x - 2;
  return { x: String(foldedX), y: String(y), z: '0', w: '1' };
}

function createDefaultInput() {
  const reconstructed = reconstructFoldFacesCandidateV1(THREE_FACE_STRIP_SOURCE);
  if (!reconstructed.ok) throw new TypeError('fixed three-face strip must reconstruct');
  const pointByVertexId = new Map(
    reconstructed.value.vertices.map((vertex) => {
      if (vertex.sourceVertexIndex === null) {
        throw new TypeError('fixed strip must not create intersection vertices');
      }
      return [vertex.id, foldedPoint(vertex.sourceVertexIndex)] as const;
    }),
  );
  const triangles = reconstructed.value.faces.flatMap((face) =>
    face.triangles.map((triangle) => {
      const points = triangle.vertexIds.map((vertexId) => pointByVertexId.get(vertexId));
      const first = points[0];
      const second = points[1];
      const third = points[2];
      if (first === undefined || second === undefined || third === undefined) {
        throw new TypeError('fixed triangle vertex must resolve');
      }
      return { triangleId: triangle.id, triangle: [first, second, third] };
    }),
  );
  return deepFreezeOwned({
    schemaVersion: 1,
    recordType: STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    coordinateEncoding: STATIC_EXACT_3D_PORTABLE_COORDINATE_ENCODING,
    meshRevisionId: 'Mesh:static-exact-three-face-demo:1',
    triangulationRevisionId: 'Triangulation:static-exact-three-face-demo:1',
    poseRevisionId: 'Pose:static-exact-three-face-coplanar-overlap-demo:1',
    reconstruction: reconstructed.value,
    staticTriangleSet: { triangles },
  });
}

export const DEFAULT_STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT = createDefaultInput();

export type StaticExact3dCandidateFlowCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): StaticExact3dCandidateFlowCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

async function evaluateAndWrite(input: unknown, io: StaticExact3dCandidateFlowCliIo) {
  try {
    const result = await evaluateStaticExact3dCandidateFlowV1(input);
    if (!result.ok) {
      result.error.forEach((entry) =>
        io.stderr(`FLOW BLOCKED ${entry.stage} ${entry.code} ${entry.path}: ${entry.message}\n`),
      );
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('static exact 3D candidate flow failed before producing a record\n');
    return 1;
  }
}

export async function runStaticExact3dCandidateFlowCli(
  arguments_: readonly string[],
  io: StaticExact3dCandidateFlowCliIo = defaultIo(),
): Promise<number> {
  if (arguments_.length === 0) {
    return evaluateAndWrite(DEFAULT_STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT, io);
  }
  if (arguments_.length === 1 && (arguments_[0] === '--help' || arguments_[0] === '-h')) {
    io.stdout(USAGE);
    return 0;
  }
  if (arguments_.length === 1 && arguments_[0] === '--example') {
    io.stdout(serializeJsonLine(DEFAULT_STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT));
    return 0;
  }
  if (arguments_.length !== 1 || arguments_[0]?.startsWith('-') === true) {
    io.stderr(USAGE);
    return 2;
  }
  const inputPath = arguments_[0];
  if (inputPath === undefined) {
    io.stderr(USAGE);
    return 2;
  }
  let text: string;
  try {
    text = await readFile(resolve(io.cwd, inputPath), 'utf8');
  } catch {
    io.stderr('static exact 3D candidate flow could not read the input JSON file\n');
    return 1;
  }
  let input: unknown;
  try {
    input = JSON.parse(text) as unknown;
  } catch {
    io.stderr('static exact 3D candidate flow input is not valid JSON\n');
    return 1;
  }
  return evaluateAndWrite(input, io);
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runStaticExact3dCandidateFlowCli(process.argv.slice(2));
}
