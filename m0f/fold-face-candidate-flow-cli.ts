import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { evaluateFoldFaceCandidateFlowV1 } from './fold-face-candidate-flow.js';
import { DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT } from './fold-face-candidate-flow-default-input.js';
import { serializeJsonLine } from './stable-json.js';

export { DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT } from './fold-face-candidate-flow-default-input.js';

const USAGE = `Usage: npm run m0f:fold-face-candidate-flow -- [input.fold]
       npm run m0f:fold-face-candidate-flow -- --example

Runs candidate face reconstruction and independent face-complex diagnostics for one
closed NOFACES FOLD document. The output is not foldability or M0F gate evidence.
`;

export type FoldFaceCandidateFlowCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): FoldFaceCandidateFlowCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

async function evaluateAndWrite(input: unknown, io: FoldFaceCandidateFlowCliIo): Promise<number> {
  try {
    const result = await evaluateFoldFaceCandidateFlowV1(input);
    if (!result.ok) {
      result.error.forEach((entry) =>
        io.stderr(`FLOW BLOCKED ${entry.stage} ${entry.code} ${entry.path}: ${entry.message}\n`),
      );
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('fold face candidate flow failed before producing a record\n');
    return 1;
  }
}

/** Runs the fixed example or one caller-owned FOLD JSON file. */
export async function runFoldFaceCandidateFlowCli(
  arguments_: readonly string[],
  io: FoldFaceCandidateFlowCliIo = defaultIo(),
): Promise<number> {
  if (arguments_.length === 0) {
    return evaluateAndWrite(DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT, io);
  }
  if (arguments_.length === 1 && (arguments_[0] === '--help' || arguments_[0] === '-h')) {
    io.stdout(USAGE);
    return 0;
  }
  if (arguments_.length === 1 && arguments_[0] === '--example') {
    io.stdout(serializeJsonLine(DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT));
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
    io.stderr('fold face candidate flow could not read the input FOLD JSON file\n');
    return 1;
  }
  let input: unknown;
  try {
    input = JSON.parse(text) as unknown;
  } catch {
    io.stderr('fold face candidate flow input is not valid JSON\n');
    return 1;
  }
  return evaluateAndWrite(input, io);
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runFoldFaceCandidateFlowCli(process.argv.slice(2));
}
