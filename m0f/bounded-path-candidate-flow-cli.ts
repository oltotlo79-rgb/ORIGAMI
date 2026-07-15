import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { evaluateBoundedPathCandidateFlowV1 } from './bounded-path-candidate-flow.js';
import { NEG_PATH_ENDPOINT_CONTINUITY_FOLD_CONTROL_SOURCE_V1 } from './neg-path-endpoint-continuity-candidate-bundle.js';
import { serializeJsonLine } from './stable-json.js';

const USAGE = `Usage: npm run m0f:bounded-path-candidate-flow -- [artifact-contract.json]
       npm run m0f:bounded-path-candidate-flow -- --example

Runs declared bounded-path parser diagnostics for at least two contiguous segments.
The output is not physical continuity, rigidity, CCD, collision, or M0F gate evidence.
`;

export const DEFAULT_BOUNDED_PATH_CANDIDATE_FLOW_INPUT =
  NEG_PATH_ENDPOINT_CONTINUITY_FOLD_CONTROL_SOURCE_V1;

export type BoundedPathCandidateFlowCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): BoundedPathCandidateFlowCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

function evaluateAndWrite(input: unknown, io: BoundedPathCandidateFlowCliIo): number {
  try {
    const result = evaluateBoundedPathCandidateFlowV1(input);
    if (!result.ok) {
      result.error.forEach((entry) =>
        io.stderr(`FLOW BLOCKED ${entry.stage} ${entry.code} ${entry.path}: ${entry.message}\n`),
      );
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('bounded path candidate flow failed before producing a record\n');
    return 1;
  }
}

/** Runs the fixed example or one caller-owned artifact-contract JSON file. */
export async function runBoundedPathCandidateFlowCli(
  arguments_: readonly string[],
  io: BoundedPathCandidateFlowCliIo = defaultIo(),
): Promise<number> {
  if (arguments_.length === 0) {
    return evaluateAndWrite(DEFAULT_BOUNDED_PATH_CANDIDATE_FLOW_INPUT, io);
  }
  if (arguments_.length === 1 && (arguments_[0] === '--help' || arguments_[0] === '-h')) {
    io.stdout(USAGE);
    return 0;
  }
  if (arguments_.length === 1 && arguments_[0] === '--example') {
    io.stdout(serializeJsonLine(DEFAULT_BOUNDED_PATH_CANDIDATE_FLOW_INPUT));
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
    io.stderr('bounded path candidate flow could not read the artifact-contract JSON file\n');
    return 1;
  }
  let input: unknown;
  try {
    input = JSON.parse(text) as unknown;
  } catch {
    io.stderr('bounded path candidate flow input is not valid JSON\n');
    return 1;
  }
  return evaluateAndWrite(input, io);
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runBoundedPathCandidateFlowCli(process.argv.slice(2));
}
