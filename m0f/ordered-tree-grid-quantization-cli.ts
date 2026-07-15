import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  adaptOrderedTreeToSquareGridCandidateInputV1,
  ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
} from './box-pleating/ordered-tree-grid-quantization.js';
import { DEFAULT_ORDERED_TREE_INPUT } from './ordered-tree-cli.js';
import { serializeJsonLine } from './stable-json.js';

export const DEFAULT_ORDERED_TREE_GRID_QUANTIZATION_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  orderedTree: DEFAULT_ORDERED_TREE_INPUT,
  paper: Object.freeze({ width: 1.5, height: 1 }),
  maxColumns: 12,
  maxRows: 12,
  relativeErrorLimit: 0.01,
});

export type OrderedTreeGridQuantizationCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): OrderedTreeGridQuantizationCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits one fixed candidate-only ordered-tree to square-grid adapter result. */
export function runDefaultOrderedTreeGridQuantizationCli(
  io: OrderedTreeGridQuantizationCliIo = defaultIo(),
): number {
  try {
    const result = adaptOrderedTreeToSquareGridCandidateInputV1(
      DEFAULT_ORDERED_TREE_GRID_QUANTIZATION_INPUT,
    );
    if (!result.ok) {
      io.stderr('ordered-tree grid quantization adapter rejected its fixed example\n');
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('ordered-tree grid quantization adapter failed before producing a record\n');
    return 1;
  }
}

export function runOrderedTreeGridQuantizationCli(
  arguments_: readonly string[],
  io: OrderedTreeGridQuantizationCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultOrderedTreeGridQuantizationCli(io);
  io.stderr('usage: npm run m0f:ordered-tree-grid-quantization\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runOrderedTreeGridQuantizationCli(process.argv.slice(2));
}
