import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { collectDependencyLicenses } from '../scripts/check-licenses.mjs';
import {
  BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_INPUT_RECORD_TYPE,
  evaluateBrowserRuntimeLicenseCandidateFlowV1,
} from './browser-runtime-license-candidate-flow.js';
import { serializeJsonLine } from './stable-json.js';

const USAGE = `Usage: npm run m0f:browser-runtime-license-candidate-flow -- [input.json]
       npm run m0f:browser-runtime-license-candidate-flow -- --example

Builds a candidate readiness diagnostic from runtime-limit hypotheses, benchmark
metadata, the configured Playwright matrix, performance-probe references, and the
current dependency license inventory. It does not execute benchmark or browser runs,
freeze measured limits, complete provenance review, or evaluate M0F GO.
`;

const RUNTIME_LIMITS_URL = new URL('./profiles/runtime-limits-v1.candidates.json', import.meta.url);
const SMOKE_BENCHMARK_URL = new URL(
  '../tests/fixtures/_harness-smoke/benchmark-record.json',
  import.meta.url,
);

export type BrowserRuntimeLicenseCandidateFlowCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): BrowserRuntimeLicenseCandidateFlowCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

async function readJson(path: string | URL): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function createDefaultBrowserRuntimeLicenseCandidateFlowInput(
  cwd = process.cwd(),
): Promise<unknown> {
  const lockPath = resolve(cwd, 'package-lock.json');
  const dependencies = await collectDependencyLicenses(lockPath);
  const packageMetadata = await readJson(resolve(cwd, 'package.json'));
  if (!isRecord(packageMetadata)) throw new TypeError('package.json must be an object');
  return {
    schemaVersion: 1,
    recordType: BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    runtimeLimitsCandidate: await readJson(RUNTIME_LIMITS_URL),
    benchmarkRecords: [await readJson(SMOKE_BENCHMARK_URL)],
    licenseInventory: {
      projectLicense: {
        name: typeof packageMetadata.name === 'string' ? packageMetadata.name : '(project)',
        version: typeof packageMetadata.version === 'string' ? packageMetadata.version : 'unknown',
        location: '',
        license: typeof packageMetadata.license === 'string' ? packageMetadata.license : null,
      },
      dependencies: dependencies.map(({ name, version, location, license }) => ({
        name,
        version,
        location,
        license,
      })),
    },
  };
}

function evaluateAndWrite(input: unknown, io: BrowserRuntimeLicenseCandidateFlowCliIo): number {
  const result = evaluateBrowserRuntimeLicenseCandidateFlowV1(input);
  if (!result.ok) {
    result.error.forEach((entry) =>
      io.stderr(`FLOW BLOCKED ${entry.stage} ${entry.code} ${entry.path}: ${entry.message}\n`),
    );
    return 1;
  }
  io.stdout(serializeJsonLine(result.value));
  return 0;
}

export async function runBrowserRuntimeLicenseCandidateFlowCli(
  arguments_: readonly string[],
  io: BrowserRuntimeLicenseCandidateFlowCliIo = defaultIo(),
): Promise<number> {
  if (arguments_.length === 1 && (arguments_[0] === '--help' || arguments_[0] === '-h')) {
    io.stdout(USAGE);
    return 0;
  }
  if (arguments_.length === 0 || (arguments_.length === 1 && arguments_[0] === '--example')) {
    try {
      const input = await createDefaultBrowserRuntimeLicenseCandidateFlowInput(io.cwd);
      if (arguments_[0] === '--example') {
        io.stdout(serializeJsonLine(input));
        return 0;
      }
      return evaluateAndWrite(input, io);
    } catch {
      io.stderr('browser/runtime/license candidate flow could not load local metadata\n');
      return 1;
    }
  }
  if (arguments_.length !== 1 || arguments_[0]?.startsWith('-') === true) {
    io.stderr(USAGE);
    return 2;
  }
  const path = arguments_[0];
  if (path === undefined) {
    io.stderr(USAGE);
    return 2;
  }
  try {
    return evaluateAndWrite(await readJson(resolve(io.cwd, path)), io);
  } catch {
    io.stderr('browser/runtime/license candidate flow input could not be read as JSON\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runBrowserRuntimeLicenseCandidateFlowCli(process.argv.slice(2));
}
