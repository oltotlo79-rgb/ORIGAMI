import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { prepareFaceComplexAuditInputV1 } from './geometry/prepare-face-complex-audit-input.js';
import { reconstructFoldFacesCandidateV1 } from './geometry/reconstruct-fold-faces.js';
import {
  FACE_COMPLEX_MUTATION_SUITE_V1,
  runFaceComplexMutationSuiteV1,
} from './reference-verifier/face-complex-mutation-suite.js';
import { serializeJsonLine } from './stable-json.js';

const DEFAULT_MUTATION_SOURCE = Object.freeze({
  specVersion: '1.2',
  verticesCoords: [
    [0, 0],
    [3, 0],
    [3, 1],
    [1, 1],
    [1, 3],
    [0, 3],
  ],
  edgesVertices: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 0],
  ],
  edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B'],
  facesVertices: null,
});

export type FaceComplexMutationCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): FaceComplexMutationCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Runs all fixed semantic mutations against the fixed non-dyadic face bundle. */
export function runDefaultFaceComplexMutationCli(
  io: FaceComplexMutationCliIo = defaultIo(),
): number {
  try {
    const reconstruction = reconstructFoldFacesCandidateV1(DEFAULT_MUTATION_SOURCE);
    if (!reconstruction.ok) {
      io.stderr('candidate face-complex mutation source could not be reconstructed\n');
      return 1;
    }
    const prepared = prepareFaceComplexAuditInputV1(DEFAULT_MUTATION_SOURCE, reconstruction.value);
    if (!prepared.ok) {
      io.stderr('candidate face-complex mutation input could not be prepared\n');
      return 1;
    }
    const result = runFaceComplexMutationSuiteV1(prepared.value, FACE_COMPLEX_MUTATION_SUITE_V1);
    if (!result.ok) {
      io.stderr('candidate face-complex mutation suite did not meet its expectations\n');
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('candidate face-complex mutation suite failed before producing a record\n');
    return 1;
  }
}

export function runFaceComplexMutationCli(
  arguments_: readonly string[],
  io: FaceComplexMutationCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultFaceComplexMutationCli(io);
  if (arguments_.length === 1 && arguments_[0] === '--suite') {
    io.stdout(serializeJsonLine(FACE_COMPLEX_MUTATION_SUITE_V1));
    return 0;
  }
  io.stderr('usage: npm run m0f:face-mutations [-- --suite]\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runFaceComplexMutationCli(process.argv.slice(2));
}
