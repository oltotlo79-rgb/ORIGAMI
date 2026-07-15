import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_INPUT_RECORD_TYPE,
  evaluateBoxPleatingSupportCandidateDiagnosticV1,
} from './box-pleating/box-pleating-support-candidate-diagnostic.js';
import { DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT } from './box-pleating-candidate-flow-cli.js';
import { serializeJsonLine } from './stable-json.js';

const USAGE = `Usage: npm run m0f:box-pleating-support-candidate-diagnostic -- [input.json]
       npm run m0f:box-pleating-support-candidate-diagnostic -- --example

Runs candidate input-boundary observations plus the independently replayed Euclidean
necessary-filter flow. It does not define SupportProfile or ToleranceProfile, decide
checkSupport, prove packing or foldability, or evaluate M0F GO.
`;

const CANDIDATE_CATALOG_URL = new URL(
  './profiles/support-profile-v1.candidates.json',
  import.meta.url,
);

export type BoxPleatingSupportCandidateDiagnosticCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): BoxPleatingSupportCandidateDiagnosticCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

async function readJson(path: string | URL): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

export async function createDefaultBoxPleatingSupportCandidateDiagnosticInput(): Promise<unknown> {
  return {
    schemaVersion: 1,
    recordType: BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    supportProfileCandidates: await readJson(CANDIDATE_CATALOG_URL),
    candidateFlowInput: DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT,
  };
}

function evaluateAndWrite(input: unknown, io: BoxPleatingSupportCandidateDiagnosticCliIo): number {
  const result = evaluateBoxPleatingSupportCandidateDiagnosticV1(input);
  if (!result.ok) {
    result.error.forEach((entry) =>
      io.stderr(
        `DIAGNOSTIC BLOCKED ${entry.stage} ${entry.code} ${entry.path}: ${entry.message}\n`,
      ),
    );
    return 1;
  }
  io.stdout(serializeJsonLine(result.value));
  return 0;
}

/** Runs the fixed candidate diagnostic or one caller-owned JSON input file. */
export async function runBoxPleatingSupportCandidateDiagnosticCli(
  arguments_: readonly string[],
  io: BoxPleatingSupportCandidateDiagnosticCliIo = defaultIo(),
): Promise<number> {
  if (arguments_.length === 1 && (arguments_[0] === '--help' || arguments_[0] === '-h')) {
    io.stdout(USAGE);
    return 0;
  }
  if (arguments_.length === 0 || (arguments_.length === 1 && arguments_[0] === '--example')) {
    try {
      const input = await createDefaultBoxPleatingSupportCandidateDiagnosticInput();
      if (arguments_[0] === '--example') {
        io.stdout(serializeJsonLine(input));
        return 0;
      }
      return evaluateAndWrite(input, io);
    } catch {
      io.stderr('support candidate diagnostic could not load its candidate catalog\n');
      return 1;
    }
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
  let input: unknown;
  try {
    input = await readJson(resolve(io.cwd, inputPath));
  } catch {
    io.stderr('support candidate diagnostic input could not be read as JSON\n');
    return 1;
  }
  return evaluateAndWrite(input, io);
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runBoxPleatingSupportCandidateDiagnosticCli(process.argv.slice(2));
}
