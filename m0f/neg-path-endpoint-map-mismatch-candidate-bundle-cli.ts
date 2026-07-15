import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathEndpointMapMismatchCandidateBundleV1,
  writeNegPathEndpointMapMismatchCandidateBundleV1,
} from './neg-path-endpoint-map-mismatch-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathEndpointMapMismatchCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-endpoint-map-mismatch-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only the project-authored adjacent bounded-interpolation crease-map parser vector.
It is not physical hinge-drift or mesh/crease-map-completeness evidence. It does not register a canonical fixture, complete the canonical path-mutation family, infer polynomial endpoints, establish endpoint or physical path continuity, rigidity, face isometry, hinge geometry, certificate-hash verification, contact semantics, continuous CCD, collision detection or freedom, or foldability, define a SupportProfile or ToleranceProfile, claim scientific verification, or evaluate M0F GO.
`;

export async function runNegPathEndpointMapMismatchCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathEndpointMapMismatchCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathEndpointMapMismatchCandidateBundleCliIo);
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
    positional[0] ?? NEG_PATH_ENDPOINT_MAP_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write') await writeNegPathEndpointMapMismatchCandidateBundleV1(directory);
    const result = await verifyNegPathEndpointMapMismatchCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (adjacent bounded-interpolation crease-map parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr('NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH CANDIDATE BUNDLE GENERATION FAILED\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathEndpointMapMismatchCandidateBundleCli(process.argv.slice(2));
}
