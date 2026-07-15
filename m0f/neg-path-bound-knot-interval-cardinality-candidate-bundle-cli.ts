import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_BOUND_KNOT_INTERVAL_CARDINALITY_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathBoundKnotIntervalCardinalityCandidateBundleV1,
  writeNegPathBoundKnotIntervalCardinalityCandidateBundleV1,
} from './neg-path-bound-knot-interval-cardinality-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathBoundKnotIntervalCardinalityCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-bound-knot-interval-cardinality-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only one project-authored declared bounded-interpolation bound/knot-interval cardinality mismatch.
It does not establish the sibling angle/knot cardinality boundary, crease-map or path-representation completeness, polynomial semantics, a radian convention, physical or conservative angle bounds, kinematic feasibility, physical/endpoint continuity, rigidity, face isometry, hinge geometry, certificate-hash verification or cryptographic authenticity, contact semantics, CCD, collision freedom, foldability, SupportProfile, ToleranceProfile, canonical family completeness, scientific verification, or M0F GO.
`;

export async function runNegPathBoundKnotIntervalCardinalityCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathBoundKnotIntervalCardinalityCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathBoundKnotIntervalCardinalityCandidateBundleCliIo);
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
    positional[0] ?? NEG_PATH_BOUND_KNOT_INTERVAL_CARDINALITY_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write')
      await writeNegPathBoundKnotIntervalCardinalityCandidateBundleV1(directory);
    const result = await verifyNegPathBoundKnotIntervalCardinalityCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-BOUND-KNOT-INTERVAL-CARDINALITY-MISMATCH REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared bounded-interpolation bound/knot-interval cardinality parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr(
      'NEG-PATH-MUTATION-BOUND-KNOT-INTERVAL-CARDINALITY-MISMATCH CANDIDATE BUNDLE GENERATION FAILED\n',
    );
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathBoundKnotIntervalCardinalityCandidateBundleCli(
    process.argv.slice(2),
  );
}
