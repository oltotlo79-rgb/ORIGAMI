import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  EUCLIDEAN_NECESSARY_FILTER_INPUT_RECORD_TYPE,
  evaluateEuclideanNecessaryFilterV1,
} from './box-pleating/euclidean-necessary-filter.js';
import { BOX_PLEATING_PACKING_SEMANTICS_V1 } from './box-pleating/packing-semantics.js';
import { DEFAULT_POLYGON_RIVER_PACKING_PROBLEM_INPUT } from './polygon-river-packing-problem-cli.js';
import { serializeJsonLine } from './stable-json.js';

export const DEFAULT_EUCLIDEAN_NECESSARY_FILTER_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: EUCLIDEAN_NECESSARY_FILTER_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  semantics: BOX_PLEATING_PACKING_SEMANTICS_V1,
  packingProblemInput: DEFAULT_POLYGON_RIVER_PACKING_PROBLEM_INPUT,
  leafAssignments: Object.freeze([
    Object.freeze({ leafNodeId: 'node-a', x: 0, y: 0 }),
    Object.freeze({ leafNodeId: 'node-d', x: 12, y: 8 }),
  ]),
});

export type EuclideanNecessaryFilterCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): EuclideanNecessaryFilterCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits one exact necessary-filter evaluation without a packing or no-solution claim. */
export function runDefaultEuclideanNecessaryFilterCli(
  io: EuclideanNecessaryFilterCliIo = defaultIo(),
): number {
  try {
    const result = evaluateEuclideanNecessaryFilterV1(DEFAULT_EUCLIDEAN_NECESSARY_FILTER_INPUT);
    if (!result.ok) {
      io.stderr('Euclidean necessary filter rejected its fixed input\n');
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('Euclidean necessary filter failed before producing a record\n');
    return 1;
  }
}

export function runEuclideanNecessaryFilterCli(
  arguments_: readonly string[],
  io: EuclideanNecessaryFilterCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultEuclideanNecessaryFilterCli(io);
  io.stderr('usage: npm run m0f:euclidean-necessary-filter\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runEuclideanNecessaryFilterCli(process.argv.slice(2));
}
