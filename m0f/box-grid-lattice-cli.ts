import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { DEFAULT_SQUARE_GRID_CANDIDATE_INPUT } from './box-grid-candidate-cli.js';
import { enumerateSquareGridCandidatesV1 } from './box-pleating/square-grid-candidates.js';
import {
  buildSquareGridLatticeV1,
  SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
} from './box-pleating/square-grid-lattice.js';
import { serializeJsonLine } from './stable-json.js';

export type SquareGridLatticeCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): SquareGridLatticeCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits a fixed exact lattice substrate; it cannot emit construction claims. */
export function runDefaultSquareGridLatticeCli(io: SquareGridLatticeCliIo = defaultIo()): number {
  try {
    const enumeration = enumerateSquareGridCandidatesV1(DEFAULT_SQUARE_GRID_CANDIDATE_INPUT);
    if (!enumeration.ok) {
      io.stderr('square-grid prerequisite enumeration failed\n');
      return 1;
    }
    const candidate = enumeration.value.candidates[0];
    if (candidate === undefined) {
      io.stderr('square-grid prerequisite enumeration produced no candidate\n');
      return 1;
    }
    const lattice = buildSquareGridLatticeV1({
      schemaVersion: 1,
      recordType: SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      squareGridCandidate: {
        candidateId: candidate.candidateId,
        columns: candidate.columns,
        rows: candidate.rows,
        fitAxis: candidate.fitAxis,
        cellSize: candidate.cellSize,
        paper: enumeration.value.paper,
        residualStrips: candidate.residualStrips,
      },
    });
    if (!lattice.ok) {
      io.stderr('square-grid lattice construction rejected its prerequisite\n');
      return 1;
    }
    io.stdout(serializeJsonLine(lattice.value));
    return 0;
  } catch {
    io.stderr('square-grid lattice construction failed before producing a record\n');
    return 1;
  }
}

export function runSquareGridLatticeCli(
  arguments_: readonly string[],
  io: SquareGridLatticeCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultSquareGridLatticeCli(io);
  io.stderr('usage: npm run m0f:box-grid-lattice\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runSquareGridLatticeCli(process.argv.slice(2));
}
