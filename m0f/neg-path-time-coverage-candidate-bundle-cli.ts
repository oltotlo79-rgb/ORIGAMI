import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathTimeCoverageCandidateBundleV1,
  writeNegPathTimeCoverageCandidateBundleV1,
} from './neg-path-time-coverage-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathTimeCoverageCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-time-coverage-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only four project-authored declared path-time coverage parser vectors.
It does not register canonical fixtures, complete the canonical path-mutation family, establish endpoint or physical path continuity, infer piecewise-polynomial coverage, establish rigidity, face isometry, hinge geometry, crease-map completeness, certificate-hash verification, contact semantics, CCD, collision detection or freedom, or foldability, define a SupportProfile or ToleranceProfile, claim scientific verification, or evaluate M0F GO.
`;

export async function runNegPathTimeCoverageCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathTimeCoverageCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathTimeCoverageCandidateBundleCliIo);
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
    positional[0] ?? NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write') await writeNegPathTimeCoverageCandidateBundleV1(directory);
    const result = await verifyNegPathTimeCoverageCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-COVERAGE REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (four declared path-time coverage parser replays only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr('NEG-PATH-MUTATION-COVERAGE CANDIDATE BUNDLE GENERATION FAILED\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathTimeCoverageCandidateBundleCli(process.argv.slice(2));
}
