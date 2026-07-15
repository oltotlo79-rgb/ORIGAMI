import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { enumerateOrderedTreeSquareGridCandidatesV1 } from './box-pleating/ordered-tree-square-grid-candidates.js';
import { DEFAULT_ORDERED_TREE_GRID_QUANTIZATION_INPUT } from './ordered-tree-grid-quantization-cli.js';
import { serializeJsonLine } from './stable-json.js';

export type OrderedTreeSquareGridCandidateCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): OrderedTreeSquareGridCandidateCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits the fixed tree-to-grid exact quantization candidate composition. */
export function runDefaultOrderedTreeSquareGridCandidateCli(
  io: OrderedTreeSquareGridCandidateCliIo = defaultIo(),
): number {
  try {
    const result = enumerateOrderedTreeSquareGridCandidatesV1(
      DEFAULT_ORDERED_TREE_GRID_QUANTIZATION_INPUT,
    );
    if (!result.ok) {
      io.stderr('ordered-tree square-grid candidate enumeration rejected its fixed example\n');
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('ordered-tree square-grid candidate enumeration failed before producing a record\n');
    return 1;
  }
}

export function runOrderedTreeSquareGridCandidateCli(
  arguments_: readonly string[],
  io: OrderedTreeSquareGridCandidateCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultOrderedTreeSquareGridCandidateCli(io);
  io.stderr('usage: npm run m0f:ordered-tree-grid-candidates\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runOrderedTreeSquareGridCandidateCli(process.argv.slice(2));
}
