import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_ANGLE_BOUND_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathAngleBoundCandidateBundleV1,
  writeNegPathAngleBoundCandidateBundleV1,
} from './neg-path-angle-bound-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathAngleBoundCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-angle-bound-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only the project-authored declared bounded-interpolation angle-containment parser vector.
It does not establish physically valid angle bounds, a radian convention, conservative bounds, kinematic feasibility, endpoint or physical path continuity, crease-map completeness, polynomial endpoint inference, rigidity, face isometry, hinge geometry, certificate-hash verification, contact semantics, CCD, collision detection or freedom, or foldability; register a canonical fixture or complete the canonical path-mutation family; define a SupportProfile or ToleranceProfile; claim scientific verification; or evaluate M0F GO.
`;

export async function runNegPathAngleBoundCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathAngleBoundCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathAngleBoundCandidateBundleCliIo);
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
    positional[0] ?? NEG_PATH_ANGLE_BOUND_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write') await writeNegPathAngleBoundCandidateBundleV1(directory);
    const result = await verifyNegPathAngleBoundCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-ANGLE-OUTSIDE-BOUND REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared bounded-interpolation angle-containment parser replay only; no canonical promotion; no physical or scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr('NEG-PATH-MUTATION-ANGLE-OUTSIDE-BOUND CANDIDATE BUNDLE GENERATION FAILED\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathAngleBoundCandidateBundleCli(process.argv.slice(2));
}
