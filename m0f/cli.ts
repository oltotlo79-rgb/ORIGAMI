import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { CANONICAL_FIXTURE_RULES, HARNESS_SMOKE_FIXTURE_ID } from './canonical-fixtures.js';
import {
  type FixtureRepositoryValidationResult,
  type FixtureValidationIssue,
  validateFixtureRepository,
} from './manifest.js';
import { stableStringify } from './stable-json.js';

export type CliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const DEFAULT_MANIFEST_PATH = 'tests/fixtures/manifest.json';

const USAGE = `M0F fixture harness (metadata and serialization only)

Usage:
  m0f validate [manifest] [--json] [--complete]
  m0f list [manifest] [--json]
  m0f list --canonical [--json]
  m0f smoke [manifest] [--json]
  m0f gate [manifest] [--json]

Commands:
  validate   Validate schema, canonical IDs, paths, hashes, records, and golden JSONL.
  list       List populated fixtures or the normative canonical fixture patterns.
  smoke      Exercise _harness-smoke. This makes no scientific claim.
  gate       Fail closed until the final M0F evidence gate is implemented and satisfied.

--complete checks fixture catalog ID completeness only. It is not the M0F GO gate.
`;

type ParsedArgs = Readonly<{
  command: 'validate' | 'list' | 'smoke' | 'gate';
  manifestPath: string;
  json: boolean;
  complete: boolean;
  canonical: boolean;
}>;

class CliUsageError extends Error {}

function parseArgs(argv: readonly string[], cwd: string): ParsedArgs | 'help' {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h' || argv[0] === 'help') {
    return 'help';
  }
  const command = argv[0];
  if (command !== 'validate' && command !== 'list' && command !== 'smoke' && command !== 'gate') {
    throw new CliUsageError(`unknown command: ${command}`);
  }

  let json = false;
  let complete = false;
  let canonical = false;
  const positional: string[] = [];
  for (const argument of argv.slice(1)) {
    if (argument === '--json') json = true;
    else if (argument === '--complete') complete = true;
    else if (argument === '--canonical') canonical = true;
    else if (argument.startsWith('-')) throw new CliUsageError(`unknown option: ${argument}`);
    else positional.push(argument);
  }
  if (positional.length > 1) throw new CliUsageError('at most one manifest path may be supplied');
  if (complete && command !== 'validate')
    throw new CliUsageError('--complete is valid only with validate');
  if (canonical && command !== 'list')
    throw new CliUsageError('--canonical is valid only with list');
  if (canonical && positional.length > 0)
    throw new CliUsageError('a manifest path cannot be used with --canonical');

  return {
    command,
    manifestPath: resolve(cwd, positional[0] ?? DEFAULT_MANIFEST_PATH),
    json,
    complete,
    canonical,
  };
}

function issueText(issue: FixtureValidationIssue): string {
  const location = issue.path === undefined ? '' : ` ${issue.path}`;
  const fixture = issue.fixtureId === undefined ? '' : ` [${issue.fixtureId}]`;
  return `${issue.severity.toUpperCase()} ${issue.code}${fixture}${location}: ${issue.message}\n`;
}

function hasErrors(result: FixtureRepositoryValidationResult): boolean {
  return result.issues.some((issue) => issue.severity === 'error');
}

function validationPayload(result: FixtureRepositoryValidationResult): Record<string, unknown> {
  return {
    command: 'validate',
    manifestPath: result.manifestPath,
    valid: !hasErrors(result),
    fixtureCount: result.manifest?.fixtures.length ?? 0,
    errorCount: result.issues.filter((issue) => issue.severity === 'error').length,
    warningCount: result.issues.filter((issue) => issue.severity === 'warning').length,
    issues: result.issues,
  };
}

function writeJson(io: CliIo, value: unknown): void {
  io.stdout(`${stableStringify(value)}\n`);
}

async function runValidate(parsed: ParsedArgs, io: CliIo): Promise<number> {
  const result = await validateFixtureRepository(
    parsed.manifestPath,
    parsed.complete ? { completeness: 'm0f' } : {},
  );
  if (parsed.json) {
    writeJson(io, validationPayload(result));
  } else {
    for (const issue of result.issues) {
      (issue.severity === 'error' ? io.stderr : io.stdout)(issueText(issue));
    }
    const errorCount = result.issues.filter((issue) => issue.severity === 'error').length;
    const warningCount = result.issues.filter((issue) => issue.severity === 'warning').length;
    io.stdout(
      `${errorCount === 0 ? 'VALID' : 'INVALID'}: ${result.manifest?.fixtures.length ?? 0} fixture(s), ${errorCount} error(s), ${warningCount} warning(s)\n`,
    );
  }
  return hasErrors(result) ? 1 : 0;
}

async function runList(parsed: ParsedArgs, io: CliIo): Promise<number> {
  if (parsed.canonical) {
    const entries = CANONICAL_FIXTURE_RULES.map((rule) => ({
      pattern: rule.pattern,
      cardinality: rule.cardinality,
      description: rule.description,
    }));
    if (parsed.json) writeJson(io, { command: 'list', kind: 'canonical', entries });
    else
      entries.forEach((entry) =>
        io.stdout(`${entry.pattern}\t${entry.cardinality}\t${entry.description}\n`),
      );
    return 0;
  }

  const result = await validateFixtureRepository(parsed.manifestPath);
  if (hasErrors(result)) {
    if (parsed.json) writeJson(io, { ...validationPayload(result), command: 'list' });
    else
      result.issues
        .filter((issue) => issue.severity === 'error')
        .forEach((issue) => io.stderr(issueText(issue)));
    return 1;
  }
  const entries = [...(result.manifest?.fixtures ?? [])]
    .sort((left, right) => left.id.localeCompare(right.id, 'en'))
    .map((fixture) => ({
      id: fixture.id,
      workflow: fixture.workflow,
      polarity: fixture.polarity,
      expectedOutcome: fixture.expectedOutcome.kind,
      title: fixture.title,
    }));
  if (parsed.json) writeJson(io, { command: 'list', kind: 'populated', entries });
  else
    entries.forEach((entry) =>
      io.stdout(`${entry.id}\t${entry.workflow}\t${entry.expectedOutcome}\t${entry.title}\n`),
    );
  return 0;
}

async function runSmoke(parsed: ParsedArgs, io: CliIo): Promise<number> {
  const result = await validateFixtureRepository(parsed.manifestPath);
  const smoke = result.manifest?.fixtures.find(
    (fixture) => fixture.id === HARNESS_SMOKE_FIXTURE_ID,
  );
  const localErrors: FixtureValidationIssue[] = [];
  if (smoke === undefined) {
    localErrors.push({
      severity: 'error',
      code: 'missing-smoke-fixture',
      message: `${HARNESS_SMOKE_FIXTURE_ID} is required by the smoke command`,
    });
  } else if (smoke.expectedOutcome.kind !== 'harness-only' || smoke.benchmark === undefined) {
    localErrors.push({
      severity: 'error',
      code: 'invalid-smoke-fixture',
      fixtureId: smoke.id,
      message:
        'smoke fixture must remain harness-only and provide deterministic benchmark fixtures',
    });
  }
  const errors = [...result.issues.filter((issue) => issue.severity === 'error'), ...localErrors];
  const passed = errors.length === 0;
  if (parsed.json) {
    writeJson(io, {
      command: 'smoke',
      fixtureId: HARNESS_SMOKE_FIXTURE_ID,
      passed,
      scientificClaim: false,
      errors,
      warningCount: result.issues.filter((issue) => issue.severity === 'warning').length,
    });
  } else if (passed) {
    io.stdout('SMOKE PASS (harness only; no scientific claim)\n');
  } else {
    errors.forEach((issue) => io.stderr(issueText(issue)));
    io.stderr('SMOKE FAIL (harness metadata/serialization only)\n');
  }
  return passed ? 0 : 1;
}

async function runGate(parsed: ParsedArgs, io: CliIo): Promise<number> {
  const catalog = await validateFixtureRepository(parsed.manifestPath, { completeness: 'm0f' });
  const catalogComplete = !hasErrors(catalog);
  const reasonCode = 'final-evidence-gate-not-ready';
  const message =
    'The final M0F gate is fail-closed: artifact schemas, scientific fixtures, reference verifier, mutation tests, measured profiles, and a GO record are not complete.';
  if (parsed.json) {
    writeJson(io, {
      command: 'gate',
      passed: false,
      catalogComplete,
      reasonCode,
      message,
      catalog: validationPayload(catalog),
    });
  } else {
    catalog.issues
      .filter((entry) => entry.severity === 'error')
      .forEach((entry) => io.stderr(issueText(entry)));
    io.stderr(`M0F GATE NOT READY ${reasonCode}: ${message}\n`);
  }
  return 1;
}

export async function runCli(argv: readonly string[], io?: CliIo): Promise<number> {
  const actualIo: CliIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies CliIo);
  let parsed: ParsedArgs | 'help';
  try {
    parsed = parseArgs(argv, actualIo.cwd);
  } catch (error) {
    actualIo.stderr(`${error instanceof Error ? error.message : String(error)}\n\n${USAGE}`);
    return 2;
  }
  if (parsed === 'help') {
    actualIo.stdout(USAGE);
    return 0;
  }
  if (parsed.command === 'validate') return runValidate(parsed, actualIo);
  if (parsed.command === 'list') return runList(parsed, actualIo);
  if (parsed.command === 'smoke') return runSmoke(parsed, actualIo);
  return runGate(parsed, actualIo);
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runCli(process.argv.slice(2));
}
