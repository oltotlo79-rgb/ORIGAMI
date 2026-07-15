import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegSupportCatalogCandidateBundleV1,
  writeNegSupportCatalogCandidateBundleV1,
} from './neg-support-catalog-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegSupportCatalogCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-support-catalog-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only the project-authored SupportProfile candidate-catalog parser bundle.
It is distinct from canonical NEG-SUPPORT-BOUNDARY fixtures and does not freeze a SupportProfile, implement checkSupport, decide actual input support, establish a termination guarantee, define a ToleranceProfile, make a scientific claim, or evaluate M0F GO.
`;

export async function runNegSupportCatalogCandidateBundleCli(
  argv: readonly string[],
  io?: NegSupportCatalogCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegSupportCatalogCandidateBundleCliIo);
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
    positional[0] ?? NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write') await writeNegSupportCatalogCandidateBundleV1(directory);
    const result = await verifyNegSupportCatalogCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-SUPPORT-CATALOG REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (candidate-catalog parser replay only; not NEG-SUPPORT-BOUNDARY; no SupportProfile; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr('NEG-SUPPORT-CATALOG CANDIDATE BUNDLE GENERATION FAILED\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegSupportCatalogCandidateBundleCli(process.argv.slice(2));
}
