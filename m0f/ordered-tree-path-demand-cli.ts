import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildOrderedTreePathDemandsV1,
  ORDERED_TREE_PATH_DEMAND_INPUT_RECORD_TYPE,
} from './box-pleating/ordered-tree-path-demands.js';
import { DEFAULT_ORDERED_TREE_GRID_QUANTIZATION_INPUT } from './ordered-tree-grid-quantization-cli.js';
import { serializeJsonLine } from './stable-json.js';

export const DEFAULT_ORDERED_TREE_PATH_DEMAND_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: ORDERED_TREE_PATH_DEMAND_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  source: DEFAULT_ORDERED_TREE_GRID_QUANTIZATION_INPUT,
  candidateId: 'square-grid:12x8:xy:1/8',
});

export type OrderedTreePathDemandCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): OrderedTreePathDemandCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits one fixed metric-independent leaf-pair path-demand record. */
export function runDefaultOrderedTreePathDemandCli(
  io: OrderedTreePathDemandCliIo = defaultIo(),
): number {
  try {
    const result = buildOrderedTreePathDemandsV1(DEFAULT_ORDERED_TREE_PATH_DEMAND_INPUT);
    if (!result.ok) {
      io.stderr('ordered-tree path-demand builder rejected its fixed example\n');
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('ordered-tree path-demand builder failed before producing a record\n');
    return 1;
  }
}

export function runOrderedTreePathDemandCli(
  arguments_: readonly string[],
  io: OrderedTreePathDemandCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultOrderedTreePathDemandCli(io);
  io.stderr('usage: npm run m0f:ordered-tree-path-demands\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runOrderedTreePathDemandCli(process.argv.slice(2));
}
