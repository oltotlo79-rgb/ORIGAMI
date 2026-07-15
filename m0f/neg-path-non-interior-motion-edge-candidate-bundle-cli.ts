import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_NON_INTERIOR_MOTION_EDGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathNonInteriorMotionEdgeCandidateBundleV1,
  writeNegPathNonInteriorMotionEdgeCandidateBundleV1,
} from './neg-path-non-interior-motion-edge-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathNonInteriorMotionEdgeCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-non-interior-motion-edge-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only one project-authored declared motion-row reference to an existing boundary edge instead of an interior crease.
It is not a physical hinge-drift detector and does not infer edge roles, establish assignment physics, prove crease-map completeness, establish angle or bound cardinality, select a path representation, infer physical angles, establish physical/endpoint continuity, rigidity, face isometry, hinge geometry, certificate-hash verification or cryptographic authenticity, contact semantics, CCD, collision freedom, foldability, SupportProfile, ToleranceProfile, canonical family completeness, scientific verification, or M0F GO.
`;

export async function runNegPathNonInteriorMotionEdgeCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathNonInteriorMotionEdgeCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathNonInteriorMotionEdgeCandidateBundleCliIo);
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
    positional[0] ?? NEG_PATH_NON_INTERIOR_MOTION_EDGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write')
      await writeNegPathNonInteriorMotionEdgeCandidateBundleV1(directory);
    const result = await verifyNegPathNonInteriorMotionEdgeCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-NON-INTERIOR-MOTION-EDGE REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared bounded-interpolation interior crease motion reference parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr(
      'NEG-PATH-MUTATION-NON-INTERIOR-MOTION-EDGE CANDIDATE BUNDLE GENERATION FAILED\n',
    );
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathNonInteriorMotionEdgeCandidateBundleCli(process.argv.slice(2));
}
