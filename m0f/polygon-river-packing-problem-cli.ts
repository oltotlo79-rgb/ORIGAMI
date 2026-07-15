import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildPolygonRiverPackingProblemV1,
  POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
} from './box-pleating/polygon-river-packing-problem.js';
import { DEFAULT_ORDERED_TREE_GRID_QUANTIZATION_INPUT } from './ordered-tree-grid-quantization-cli.js';
import { serializeJsonLine } from './stable-json.js';

export const DEFAULT_POLYGON_RIVER_PACKING_PROBLEM_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  source: DEFAULT_ORDERED_TREE_GRID_QUANTIZATION_INPUT,
  candidateId: 'square-grid:12x8:xy:1/8',
});

export type PolygonRiverPackingProblemCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): PolygonRiverPackingProblemCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits one fixed finite-domain problem description without a placement or solution claim. */
export function runDefaultPolygonRiverPackingProblemCli(
  io: PolygonRiverPackingProblemCliIo = defaultIo(),
): number {
  try {
    const result = buildPolygonRiverPackingProblemV1(DEFAULT_POLYGON_RIVER_PACKING_PROBLEM_INPUT);
    if (!result.ok) {
      io.stderr('polygon/river packing problem builder rejected its fixed example\n');
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('polygon/river packing problem builder failed before producing a record\n');
    return 1;
  }
}

export function runPolygonRiverPackingProblemCli(
  arguments_: readonly string[],
  io: PolygonRiverPackingProblemCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultPolygonRiverPackingProblemCli(io);
  io.stderr('usage: npm run m0f:polygon-river-packing-problem\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runPolygonRiverPackingProblemCli(process.argv.slice(2));
}
