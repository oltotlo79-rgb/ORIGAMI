import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_BOUNDED_FINITE_ANGLES_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathBoundedFiniteAnglesCandidateBundleV1,
  writeNegPathBoundedFiniteAnglesCandidateBundleV1,
} from './neg-path-bounded-finite-angles-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathBoundedFiniteAnglesCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-bounded-finite-angles-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only one project-authored non-finite bounded-interpolation angle rejection.
It does not establish finite-knot handling, representation-version, representation-status, or supported-representation-kind handling, bounded-interpolation row uniqueness, angle/knot or bound/knot-interval cardinality, motion-/crease-map completeness, containment, strict knots, path-time coverage, endpoint/physical continuity, representation selection or completeness, polynomial semantics, a radian convention, physical or conservative angle bounds, kinematic feasibility, rigidity, face isometry, hinge geometry, certificate-hash verification or cryptographic authenticity, contact semantics, CCD, collision freedom, foldability, SupportProfile, ToleranceProfile, canonical family completeness, scientific verification, or M0F GO.
`;

export async function runNegPathBoundedFiniteAnglesCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathBoundedFiniteAnglesCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathBoundedFiniteAnglesCandidateBundleCliIo);
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
    positional[0] ?? NEG_PATH_BOUNDED_FINITE_ANGLES_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write') await writeNegPathBoundedFiniteAnglesCandidateBundleV1(directory);
    const result = await verifyNegPathBoundedFiniteAnglesCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-BOUNDED-FINITE-ANGLES REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared bounded-interpolation finite-angles parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr('NEG-PATH-MUTATION-BOUNDED-FINITE-ANGLES CANDIDATE BUNDLE GENERATION FAILED\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathBoundedFiniteAnglesCandidateBundleCli(process.argv.slice(2));
}
