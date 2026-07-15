import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { evaluateFaceComplexCandidateSubgateV1 } from './face-complex-candidate-subgate.js';
import { stableStringify } from './stable-json.js';

const DEFAULT_MANIFEST_PATH = 'tests/fixtures/manifest.json';

export type FaceComplexSubgateCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: m0f-face-subgate [manifest] [--json]

Re-runs only the REF-FOLD-NOFACES candidate reconstruction/audit evidence.
This is not the global M0F GO gate and makes no scientific claim.
`;

export async function runFaceComplexCandidateSubgateCli(
  argv: readonly string[],
  io?: FaceComplexSubgateCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies FaceComplexSubgateCliIo);
  if (argv.includes('--help') || argv.includes('-h')) {
    actualIo.stdout(USAGE);
    return 0;
  }
  const unknownOptions = argv.filter(
    (argument) => argument.startsWith('-') && argument !== '--json',
  );
  const positional = argv.filter((argument) => !argument.startsWith('-'));
  if (unknownOptions.length > 0 || positional.length > 1) {
    actualIo.stderr(USAGE);
    return 2;
  }
  const json = argv.includes('--json');
  const manifestPath = resolve(actualIo.cwd, positional[0] ?? DEFAULT_MANIFEST_PATH);
  const result = await evaluateFaceComplexCandidateSubgateV1(manifestPath);
  if (json) {
    actualIo.stdout(`${stableStringify(result)}\n`);
  } else if (result.passed) {
    actualIo.stdout(
      'FACE COMPLEX CANDIDATE SUBGATE PASS (candidate stage only; no scientific claim; global M0F gate not evaluated)\n',
    );
  } else {
    for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    actualIo.stderr('FACE COMPLEX CANDIDATE SUBGATE BLOCKED (global M0F gate not evaluated)\n');
  }
  return result.passed ? 0 : 1;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runFaceComplexCandidateSubgateCli(process.argv.slice(2));
}
