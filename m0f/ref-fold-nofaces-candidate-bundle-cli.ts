import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  REF_FOLD_NOFACES_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyRefFoldNoFacesCandidateBundleV1,
  writeRefFoldNoFacesCandidateBundleV1,
} from './ref-fold-nofaces-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type RefFoldNoFacesCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: ref-fold-nofaces-candidate-bundle [--verify|--write] [directory] [--json]

Replays or deterministically regenerates only the project-authored candidate bundle.
It does not register a canonical fixture, select a ToleranceProfile, make a scientific claim, or evaluate M0F GO.
`;

/** Runs the dedicated candidate bundle generator/verifier without invoking a global gate. */
export async function runRefFoldNoFacesCandidateBundleCli(
  argv: readonly string[],
  io?: RefFoldNoFacesCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies RefFoldNoFacesCandidateBundleCliIo);
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
    positional[0] ?? REF_FOLD_NOFACES_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write') await writeRefFoldNoFacesCandidateBundleV1(directory);
    const result = await verifyRefFoldNoFacesCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleCandidateBundle) {
      actualIo.stdout(
        'REF-FOLD-NOFACES REPRODUCIBLE CANDIDATE BUNDLE (no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleCandidateBundle ? 0 : 1;
  } catch {
    actualIo.stderr('REF-FOLD-NOFACES CANDIDATE BUNDLE GENERATION FAILED\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runRefFoldNoFacesCandidateBundleCli(process.argv.slice(2));
}
