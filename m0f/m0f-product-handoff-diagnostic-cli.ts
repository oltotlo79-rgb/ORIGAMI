import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { validateFixtureRepository } from './manifest.js';
import {
  evaluateM0fProductHandoffDiagnosticV1,
  M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE,
} from './m0f-product-handoff-diagnostic.js';
import { serializeJsonLine } from './stable-json.js';

const USAGE = `Usage: npm run m0f:product-handoff-diagnostic -- [input.json]
       npm run m0f:product-handoff-diagnostic -- --example

Emits a fail-closed M0F product-handoff readiness diagnostic. It does not create
M0F_REPORT.md, record a final GO/NO-GO decision, authorize product implementation,
or set global M0F GO.
`;

export type M0fProductHandoffDiagnosticCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): M0fProductHandoffDiagnosticCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

export async function createDefaultM0fProductHandoffDiagnosticInput(
  cwd = process.cwd(),
): Promise<unknown> {
  const validation = await validateFixtureRepository(resolve(cwd, 'tests/fixtures/manifest.json'), {
    completeness: 'm0f',
  });
  const errors = validation.issues.filter((entry) => entry.severity === 'error');
  return {
    schemaVersion: 1,
    recordType: M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    catalog: {
      complete: errors.length === 0,
      errorCount: errors.length,
      missingCanonicalPatterns: errors.flatMap((entry) =>
        entry.code === 'missing-canonical-fixture' && entry.canonicalPattern !== undefined
          ? [entry.canonicalPattern]
          : [],
      ),
    },
  };
}

function evaluateAndWrite(input: unknown, io: M0fProductHandoffDiagnosticCliIo): number {
  const result = evaluateM0fProductHandoffDiagnosticV1(input);
  if (!result.ok) {
    result.error.forEach((entry) =>
      io.stderr(`HANDOFF BLOCKED ${entry.stage} ${entry.code} ${entry.path}: ${entry.message}\n`),
    );
    return 1;
  }
  io.stdout(serializeJsonLine(result.value));
  return 0;
}

export async function runM0fProductHandoffDiagnosticCli(
  arguments_: readonly string[],
  io: M0fProductHandoffDiagnosticCliIo = defaultIo(),
): Promise<number> {
  if (arguments_.length === 1 && (arguments_[0] === '--help' || arguments_[0] === '-h')) {
    io.stdout(USAGE);
    return 0;
  }
  if (arguments_.length === 0 || (arguments_.length === 1 && arguments_[0] === '--example')) {
    try {
      const input = await createDefaultM0fProductHandoffDiagnosticInput(io.cwd);
      if (arguments_[0] === '--example') {
        io.stdout(serializeJsonLine(input));
        return 0;
      }
      return evaluateAndWrite(input, io);
    } catch {
      io.stderr('M0F product handoff diagnostic could not validate the fixture repository\n');
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
  try {
    const input = JSON.parse(await readFile(resolve(io.cwd, inputPath), 'utf8')) as unknown;
    return evaluateAndWrite(input, io);
  } catch {
    io.stderr('M0F product handoff diagnostic input could not be read as JSON\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runM0fProductHandoffDiagnosticCli(process.argv.slice(2));
}
