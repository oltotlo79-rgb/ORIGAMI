import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegOrderReversalCandidateBundleV1,
  writeNegOrderReversalCandidateBundleV1,
} from './neg-order-reversal-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegOrderReversalCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-order-reversal-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only the project-authored declared continuous-contact layer-order parser vector.
It does not register a canonical fixture, establish physical layer order, contact completeness or legality, path continuity, collision detection or freedom, foldability, or scientific verification, or evaluate M0F GO.
`;

export async function runNegOrderReversalCandidateBundleCli(
  argv: readonly string[],
  io?: NegOrderReversalCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegOrderReversalCandidateBundleCliIo);
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
    positional[0] ?? NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write') await writeNegOrderReversalCandidateBundleV1(directory);
    const result = await verifyNegOrderReversalCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-ORDER-REVERSAL REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared continuous-contact parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr('NEG-ORDER-REVERSAL CANDIDATE BUNDLE GENERATION FAILED\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegOrderReversalCandidateBundleCli(process.argv.slice(2));
}
