import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_LAYER_CONTACT_COVERAGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegLayerContactCoverageCandidateBundleV1,
  writeNegLayerContactCoverageCandidateBundleV1,
} from './neg-layer-contact-coverage-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegLayerContactCoverageCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-layer-contact-coverage-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only the project-authored declared coplanar-contact layer-interval-union parser vector.
It does not complete or register a canonical contact fixture, infer contacts, establish contact completeness or legality, physical layer order or order-reversal evidence, path continuity, CCD, collision detection or freedom, foldability, certificate-hash verification or cryptographic authenticity, a SupportProfile or ToleranceProfile, or scientific verification, or evaluate M0F GO.
`;

export async function runNegLayerContactCoverageCandidateBundleCli(
  argv: readonly string[],
  io?: NegLayerContactCoverageCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegLayerContactCoverageCandidateBundleCliIo);
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
    positional[0] ?? NEG_LAYER_CONTACT_COVERAGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write') await writeNegLayerContactCoverageCandidateBundleV1(directory);
    const result = await verifyNegLayerContactCoverageCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-LAYER-CONTACT-COVERAGE REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared coplanar-contact layer-interval-union parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr('NEG-LAYER-CONTACT-COVERAGE CANDIDATE BUNDLE GENERATION FAILED\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegLayerContactCoverageCandidateBundleCli(process.argv.slice(2));
}
