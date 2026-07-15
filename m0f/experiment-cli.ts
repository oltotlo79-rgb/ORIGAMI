import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { deepFreezeOwned } from './clone-and-freeze.js';
import { SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE } from './box-pleating/square-grid-candidates.js';
import {
  FACE_COMPLEX_AUDIT_ENGINE_VERSION,
  FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
  FACE_COMPLEX_AUDIT_PARAMETERS_V1,
  FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
  FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
  FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1,
  NUMERIC_KERNEL_ORIENTATION_ENGINE_VERSION,
  NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID,
  SQUARE_GRID_QUANTIZATION_ENGINE_VERSION,
  SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
  SQUARE_GRID_QUANTIZATION_PARAMETERS_V1,
  runCandidateExperimentV1,
  type CandidateExperimentRequestV1,
} from './experiments/index.js';
import { prepareFaceComplexAuditInputV1 } from './geometry/prepare-face-complex-audit-input.js';
import { reconstructFoldFacesCandidateV1 } from './geometry/reconstruct-fold-faces.js';
import { serializeJsonLine } from './stable-json.js';

export const DEFAULT_NUMERIC_KERNEL_EXPERIMENT_REQUEST = Object.freeze({
  experimentId: NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID,
  engineVersion: NUMERIC_KERNEL_ORIENTATION_ENGINE_VERSION,
  parameters: Object.freeze({ fastFilterArea: 0 }),
  input: deepFreezeOwned({
    samples: Object.freeze([
      Object.freeze({
        a: Object.freeze({ x: 0, y: 0 }),
        b: Object.freeze({ x: 2, y: 0 }),
        c: Object.freeze({ x: 0, y: 1 }),
      }),
      Object.freeze({
        a: Object.freeze({ x: 0, y: 0 }),
        b: Object.freeze({ x: 1, y: 1 }),
        c: Object.freeze({ x: 2, y: 2 }),
      }),
      Object.freeze({
        a: Object.freeze({ x: 0, y: 0 }),
        b: Object.freeze({ x: 1, y: 1 }),
        c: Object.freeze({ x: 2, y: 2.0000000000000004 }),
      }),
    ]),
  }),
  seed: 0x4f52_4947,
  repetition: 0,
} satisfies CandidateExperimentRequestV1);

/** Fixed record provenance for the M0F-2 quantization probe; neither field is a search knob. */
export const DEFAULT_SQUARE_GRID_QUANTIZATION_EXPERIMENT_REQUEST = Object.freeze({
  experimentId: SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
  engineVersion: SQUARE_GRID_QUANTIZATION_ENGINE_VERSION,
  parameters: SQUARE_GRID_QUANTIZATION_PARAMETERS_V1,
  input: deepFreezeOwned({
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: { width: 1.5, height: 1 },
    maxColumns: 12,
    maxRows: 12,
    relativeErrorLimit: 0.01,
    branches: [
      { id: 'terminal-a', branchClass: 'terminal', length: 0.75, width: 0 },
      { id: 'internal-a', branchClass: 'internal', length: 0.5, width: 0.25 },
    ],
  }),
  seed: 0x4d30_4632,
  repetition: 0,
} satisfies CandidateExperimentRequestV1);

export const DEFAULT_FACE_RECONSTRUCTION_EXPERIMENT_REQUEST = Object.freeze({
  experimentId: FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
  engineVersion: FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
  parameters: FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1,
  input: Object.freeze({
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [3, 0],
      [3, 1],
      [3, 2],
      [1, 2],
      [0, 2],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
      [1, 5],
      [0, 3],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M'],
    facesVertices: null,
  }),
  seed: 0x4d30_4633,
  repetition: 0,
} satisfies CandidateExperimentRequestV1);

function createDefaultFaceComplexAuditRequest(): CandidateExperimentRequestV1 {
  const reconstructed = reconstructFoldFacesCandidateV1(
    DEFAULT_FACE_RECONSTRUCTION_EXPERIMENT_REQUEST.input,
  );
  if (!reconstructed.ok) {
    throw new TypeError('default non-dyadic face source reconstruction failed');
  }
  const prepared = prepareFaceComplexAuditInputV1(
    DEFAULT_FACE_RECONSTRUCTION_EXPERIMENT_REQUEST.input,
    reconstructed.value,
  );
  if (!prepared.ok) {
    throw new TypeError('default face-complex audit bundle preparation failed');
  }
  return Object.freeze({
    experimentId: FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
    engineVersion: FACE_COMPLEX_AUDIT_ENGINE_VERSION,
    parameters: FACE_COMPLEX_AUDIT_PARAMETERS_V1,
    input: prepared.value,
    seed: 0x4d30_4634,
    repetition: 0,
  });
}

export const DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST = createDefaultFaceComplexAuditRequest();

export type ExperimentCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

/** Runs one fixed, deterministic candidate probe; it cannot emit a scientific claim. */
export async function runDefaultCandidateExperimentCli(io?: ExperimentCliIo): Promise<number> {
  return emitCandidateExperiment(DEFAULT_NUMERIC_KERNEL_EXPERIMENT_REQUEST, io);
}

/** Runs the fixed non-dyadic M0F-3 face reconstruction candidate. */
export async function runDefaultFaceReconstructionExperimentCli(
  io?: ExperimentCliIo,
): Promise<number> {
  return emitCandidateExperiment(DEFAULT_FACE_RECONSTRUCTION_EXPERIMENT_REQUEST, io);
}

/** Runs the fixed M0F-2 square-grid quantization candidate. */
export async function runDefaultSquareGridQuantizationExperimentCli(
  io?: ExperimentCliIo,
): Promise<number> {
  return emitCandidateExperiment(DEFAULT_SQUARE_GRID_QUANTIZATION_EXPERIMENT_REQUEST, io);
}

/** Runs the fixed independent face-complex consistency audit candidate. */
export async function runDefaultFaceComplexAuditExperimentCli(
  io?: ExperimentCliIo,
): Promise<number> {
  return emitCandidateExperiment(DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST, io);
}

async function emitCandidateExperiment(
  request: CandidateExperimentRequestV1,
  io?: ExperimentCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies ExperimentCliIo);
  try {
    const record = await runCandidateExperimentV1(request);
    actualIo.stdout(serializeJsonLine(record));
    return record.outcome === 'completed' ? 0 : 1;
  } catch {
    actualIo.stderr('candidate experiment runner failed before producing a record\n');
    return 1;
  }
}

export async function runCandidateExperimentCli(
  arguments_: readonly string[],
  io?: ExperimentCliIo,
): Promise<number> {
  if (arguments_.length === 0) return runDefaultCandidateExperimentCli(io);
  if (arguments_.length === 1 && arguments_[0] === '--face-reconstruction') {
    return runDefaultFaceReconstructionExperimentCli(io);
  }
  if (arguments_.length === 1 && arguments_[0] === '--face-complex-audit') {
    return runDefaultFaceComplexAuditExperimentCli(io);
  }
  if (arguments_.length === 1 && arguments_[0] === '--square-grid-quantization') {
    return runDefaultSquareGridQuantizationExperimentCli(io);
  }
  const actualIo =
    io ??
    ({
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies ExperimentCliIo);
  actualIo.stderr(
    'usage: npm run m0f:experiment [-- --square-grid-quantization|--face-reconstruction|--face-complex-audit]\n',
  );
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runCandidateExperimentCli(process.argv.slice(2));
}
