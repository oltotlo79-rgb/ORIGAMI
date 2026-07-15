import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  BOX_PLEATING_CANDIDATE_FLOW_INPUT_RECORD_TYPE,
  evaluateBoxPleatingCandidateFlowV1,
} from './box-pleating/box-pleating-candidate-flow.js';
import { DEFAULT_ORDERED_TREE_GRID_QUANTIZATION_INPUT } from './ordered-tree-grid-quantization-cli.js';
import { serializeJsonLine } from './stable-json.js';

const USAGE = `Usage: npm run m0f:box-pleating-candidate-flow -- [input.json]
       npm run m0f:box-pleating-candidate-flow -- --example

Runs a caller-selected preconstruction diagnostic. The output is not a crease pattern,
placement, packing solution, foldability result, or M0F GO evidence.
`;

export const DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: BOX_PLEATING_CANDIDATE_FLOW_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  source: DEFAULT_ORDERED_TREE_GRID_QUANTIZATION_INPUT,
  candidateId: 'square-grid:12x8:xy:1/8',
  maxVisitedStates: 20_000,
  maxWitnesses: 1,
});

export type BoxPleatingCandidateFlowCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): BoxPleatingCandidateFlowCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

function evaluateAndWrite(input: unknown, io: BoxPleatingCandidateFlowCliIo): number {
  const result = evaluateBoxPleatingCandidateFlowV1(input);
  if (!result.ok) {
    result.error.forEach((entry) =>
      io.stderr(`FLOW BLOCKED ${entry.stage} ${entry.code} ${entry.path}: ${entry.message}\n`),
    );
    return 1;
  }
  io.stdout(serializeJsonLine(result.value));
  return 0;
}

/** Runs the fixed example or one caller-owned JSON input file. */
export async function runBoxPleatingCandidateFlowCli(
  arguments_: readonly string[],
  io: BoxPleatingCandidateFlowCliIo = defaultIo(),
): Promise<number> {
  if (arguments_.length === 0) {
    return evaluateAndWrite(DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT, io);
  }
  if (arguments_.length === 1 && (arguments_[0] === '--help' || arguments_[0] === '-h')) {
    io.stdout(USAGE);
    return 0;
  }
  if (arguments_.length === 1 && arguments_[0] === '--example') {
    io.stdout(serializeJsonLine(DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT));
    return 0;
  }
  if (arguments_.length !== 1 || arguments_[0]?.startsWith('-') === true) {
    io.stderr(USAGE);
    return 2;
  }
  const inputPath = arguments_[0];
  if (inputPath === undefined) {
    io.stderr(USAGE);
    return 2;
  }

  let text: string;
  try {
    text = await readFile(resolve(io.cwd, inputPath), 'utf8');
  } catch {
    io.stderr('box-pleating candidate flow could not read the input JSON file\n');
    return 1;
  }
  let input: unknown;
  try {
    input = JSON.parse(text) as unknown;
  } catch {
    io.stderr('box-pleating candidate flow input is not valid JSON\n');
    return 1;
  }
  return evaluateAndWrite(input, io);
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runBoxPleatingCandidateFlowCli(process.argv.slice(2));
}
