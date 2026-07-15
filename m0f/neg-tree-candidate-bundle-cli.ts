import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_TREE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegTreeCandidateBundleV1,
  writeNegTreeCandidateBundleV1,
} from './neg-tree-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegTreeCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-tree-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only the project-authored exact-negative ordered-tree parser bundle.
It does not register canonical fixtures, define/select/imply a SupportProfile or ToleranceProfile, prove tree-method feasibility or foldability, make a scientific claim, or evaluate M0F GO. The 2..20 leaf range is only the current defensive parser limit.
`;

export async function runNegTreeCandidateBundleCli(
  argv: readonly string[],
  io?: NegTreeCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegTreeCandidateBundleCliIo);
  if (argv.includes('--help') || argv.includes('-h')) {
    actualIo.stdout(USAGE);
    return 0;
  }
  const actions = argv.filter((argument) => argument === '--verify' || argument === '--write');
  const unknownOptions = argv.filter(
    (argument) =>
      argument.startsWith('-') &&
      argument !== '--verify' &&
      argument !== '--write' &&
      argument !== '--json',
  );
  const positional = argv.filter((argument) => !argument.startsWith('-'));
  if (actions.length > 1 || unknownOptions.length > 0 || positional.length > 1) {
    actualIo.stderr(USAGE);
    return 2;
  }

  const directory = resolve(
    actualIo.cwd,
    positional[0] ?? NEG_TREE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write') await writeNegTreeCandidateBundleV1(directory);
    const result = await verifyNegTreeCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-TREE REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr('NEG-TREE CANDIDATE BUNDLE GENERATION FAILED\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegTreeCandidateBundleCli(process.argv.slice(2));
}
