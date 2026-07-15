import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { DEFAULT_SQUARE_GRID_CANDIDATE_INPUT } from './box-grid-candidate-cli.js';
import { enumerateSquareGridCandidatesV1 } from './box-pleating/square-grid-candidates.js';
import {
  buildSquareGridPaperPartitionV1,
  SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE,
} from './box-pleating/square-grid-paper-partition.js';
import { serializeJsonLine } from './stable-json.js';

export type SquareGridPaperPartitionCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): SquareGridPaperPartitionCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits a fixed residual-strip example without treating its interface as a crease. */
export function runDefaultSquareGridPaperPartitionCli(
  io: SquareGridPaperPartitionCliIo = defaultIo(),
): number {
  try {
    const enumeration = enumerateSquareGridCandidatesV1(DEFAULT_SQUARE_GRID_CANDIDATE_INPUT);
    if (!enumeration.ok) {
      io.stderr('square-grid prerequisite enumeration failed\n');
      return 1;
    }
    const candidate = enumeration.value.candidates.find(
      (entry) =>
        entry.residualStrips.xAxis.numerator !== '0' ||
        entry.residualStrips.yAxis.numerator !== '0',
    );
    if (candidate === undefined) {
      io.stderr('square-grid prerequisite enumeration produced no residual-strip example\n');
      return 1;
    }
    const partition = buildSquareGridPaperPartitionV1({
      schemaVersion: 1,
      recordType: SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE,
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
    if (!partition.ok) {
      io.stderr('square-grid paper partition rejected its prerequisite\n');
      return 1;
    }
    io.stdout(serializeJsonLine(partition.value));
    return 0;
  } catch {
    io.stderr('square-grid paper partition failed before producing a record\n');
    return 1;
  }
}

export function runSquareGridPaperPartitionCli(
  arguments_: readonly string[],
  io: SquareGridPaperPartitionCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultSquareGridPaperPartitionCli(io);
  io.stderr('usage: npm run m0f:box-grid-paper-partition\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runSquareGridPaperPartitionCli(process.argv.slice(2));
}
