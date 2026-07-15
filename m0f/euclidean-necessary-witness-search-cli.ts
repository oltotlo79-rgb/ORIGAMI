import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
  searchEuclideanNecessaryWitnessesV1,
} from './box-pleating/euclidean-necessary-witness-search.js';
import { validateEuclideanNecessaryWitnessSearchResultV1 } from './box-pleating/euclidean-necessary-witness-search-result-validation.js';
import { BOX_PLEATING_PACKING_SEMANTICS_V1 } from './box-pleating/packing-semantics.js';
import { DEFAULT_POLYGON_RIVER_PACKING_PROBLEM_INPUT } from './polygon-river-packing-problem-cli.js';
import { serializeJsonLine } from './stable-json.js';

/** Fixed candidate-only search probe; its result is never a global packing decision. */
export const DEFAULT_EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT = Object.freeze({
  schemaVersion: 1 as const,
  recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
  contractStatus: 'candidate' as const,
  scientificClaim: false as const,
  semantics: BOX_PLEATING_PACKING_SEMANTICS_V1,
  packingProblemInput: DEFAULT_POLYGON_RIVER_PACKING_PROBLEM_INPUT,
  maxVisitedStates: 20_000,
  maxWitnesses: 1,
});

export type EuclideanNecessaryWitnessSearchCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): EuclideanNecessaryWitnessSearchCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits one deterministic necessary-filter-only assignment search record. */
export function runDefaultEuclideanNecessaryWitnessSearchCli(
  io: EuclideanNecessaryWitnessSearchCliIo = defaultIo(),
): number {
  try {
    const result = searchEuclideanNecessaryWitnessesV1(
      DEFAULT_EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT,
    );
    if (!result.ok) {
      io.stderr('Euclidean necessary-filter witness search rejected its fixed example\n');
      return 1;
    }
    const independentlyValidated = validateEuclideanNecessaryWitnessSearchResultV1(
      DEFAULT_EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT,
      result.value,
    );
    if (!independentlyValidated.ok) {
      io.stderr('Euclidean necessary-filter witness search failed independent replay\n');
      return 1;
    }
    io.stdout(serializeJsonLine(independentlyValidated.value));
    return 0;
  } catch {
    io.stderr('Euclidean necessary-filter witness search failed before producing a record\n');
    return 1;
  }
}

export function runEuclideanNecessaryWitnessSearchCli(
  arguments_: readonly string[],
  io: EuclideanNecessaryWitnessSearchCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultEuclideanNecessaryWitnessSearchCli(io);
  io.stderr('usage: npm run m0f:euclidean-necessary-witness-search\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runEuclideanNecessaryWitnessSearchCli(process.argv.slice(2));
}
