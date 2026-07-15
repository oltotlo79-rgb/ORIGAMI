import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_MIXED_REPRESENTATION_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathMixedRepresentationCandidateBundleV1,
  writeNegPathMixedRepresentationCandidateBundleV1,
} from './neg-path-mixed-representation-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathMixedRepresentationCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-mixed-representation-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only one project-authored path containing locally valid but mixed candidate representation kinds.
It does not select a representation, freeze either candidate basis, establish polynomial coefficient, derivative-bound, endpoint, or cross-representation semantics, include an interval proof, establish bounded or physical endpoint continuity, rigidity, face isometry, hinge geometry, certificate-hash verification or cryptographic authenticity, contact semantics, CCD, collision freedom, foldability, SupportProfile, ToleranceProfile, canonical family completeness, scientific verification, or M0F GO.
`;

export async function runNegPathMixedRepresentationCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathMixedRepresentationCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathMixedRepresentationCandidateBundleCliIo);
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
    positional[0] ?? NEG_PATH_MIXED_REPRESENTATION_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write') await writeNegPathMixedRepresentationCandidateBundleV1(directory);
    const result = await verifyNegPathMixedRepresentationCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-MIXED-REPRESENTATION REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared path-representation uniformity parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr('NEG-PATH-MUTATION-MIXED-REPRESENTATION CANDIDATE BUNDLE GENERATION FAILED\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathMixedRepresentationCandidateBundleCli(process.argv.slice(2));
}
