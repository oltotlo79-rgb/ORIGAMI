import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_BOUNDED_INTERVAL_ANGLE_BOUNDS_INVERTED_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathBoundedIntervalAngleBoundsInvertedCandidateBundleV1,
  writeNegPathBoundedIntervalAngleBoundsInvertedCandidateBundleV1,
} from './neg-path-bounded-interval-angle-bounds-inverted-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathBoundedIntervalAngleBoundsInvertedCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-bounded-interval-angle-bounds-inverted-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only one project-authored inverted bounded-interpolation interval-angle-bound rejection and its ordered containment secondary.
It does not establish finite-value handling, tuple, angle/knot, or outer bound/knot-interval cardinality, representation-version, representation-status, or supported-representation-kind handling, bounded-interpolation row uniqueness, motion-/crease-map completeness, physical or conservative bounds, strict knots, path-time coverage, endpoint/physical continuity, representation selection or completeness, polynomial semantics, a radian convention, kinematic feasibility, rigidity, face isometry, hinge geometry, certificate-hash verification or cryptographic authenticity, contact semantics, CCD, collision freedom, foldability, SupportProfile, ToleranceProfile, canonical family completeness, scientific verification, or M0F GO.
`;

export async function runNegPathBoundedIntervalAngleBoundsInvertedCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathBoundedIntervalAngleBoundsInvertedCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathBoundedIntervalAngleBoundsInvertedCandidateBundleCliIo);
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
    positional[0] ??
      NEG_PATH_BOUNDED_INTERVAL_ANGLE_BOUNDS_INVERTED_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write')
      await writeNegPathBoundedIntervalAngleBoundsInvertedCandidateBundleV1(directory);
    const result =
      await verifyNegPathBoundedIntervalAngleBoundsInvertedCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-BOUNDED-INTERVAL-ANGLE-BOUNDS-INVERTED REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared bounded-interpolation interval-angle-bound ordering and containment parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr(
      'NEG-PATH-MUTATION-BOUNDED-INTERVAL-ANGLE-BOUNDS-INVERTED CANDIDATE BUNDLE GENERATION FAILED\n',
    );
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathBoundedIntervalAngleBoundsInvertedCandidateBundleCli(
    process.argv.slice(2),
  );
}
