import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
  enumerateSquareGridCandidatesV1,
} from './box-pleating/square-grid-candidates.js';
import { serializeJsonLine } from './stable-json.js';

export const DEFAULT_SQUARE_GRID_CANDIDATE_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  paper: Object.freeze({ width: 1.5, height: 1 }),
  maxColumns: 12,
  maxRows: 12,
  relativeErrorLimit: 0.01,
  branches: Object.freeze([
    Object.freeze({ id: 'terminal-a', branchClass: 'terminal', length: 0.75, width: 0 }),
    Object.freeze({ id: 'internal-a', branchClass: 'internal', length: 0.5, width: 0.25 }),
  ]),
});

export type SquareGridCandidateCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): SquareGridCandidateCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits the fixed rectangular-paper, internal-width candidate enumeration. */
export function runDefaultSquareGridCandidateCli(
  io: SquareGridCandidateCliIo = defaultIo(),
): number {
  try {
    const result = enumerateSquareGridCandidatesV1(DEFAULT_SQUARE_GRID_CANDIDATE_INPUT);
    if (!result.ok || result.value.candidates.length === 0) {
      io.stderr('square-grid candidate enumeration produced no admissible candidate\n');
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('square-grid candidate enumeration failed before producing a record\n');
    return 1;
  }
}

export function runSquareGridCandidateCli(
  arguments_: readonly string[],
  io: SquareGridCandidateCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultSquareGridCandidateCli(io);
  io.stderr('usage: npm run m0f:box-grid-candidates\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runSquareGridCandidateCli(process.argv.slice(2));
}
