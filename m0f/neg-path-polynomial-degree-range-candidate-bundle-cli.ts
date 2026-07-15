import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathPolynomialDegreeRangeCandidateBundleV1,
  writeNegPathPolynomialDegreeRangeCandidateBundleV1,
} from './neg-path-polynomial-degree-range-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathPolynomialDegreeRangeCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-polynomial-degree-range-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only one project-authored declared piecewise-polynomial zero-degree rejection.
It does not exercise fractional or unsafe-integer degrees, establish the general positive-safe-integer degree domain or coefficient-row/degree cardinality, establish path-time coverage, select a representation, freeze a polynomial basis, establish coefficient ordering or semantics, associate rows with intervals, establish derivative semantics or validation, infer polynomial endpoints, establish physical angle/path semantics or crease-/motion-map completeness, rigidity, face isometry, hinge geometry, certificate-hash verification or cryptographic authenticity, contact semantics, CCD, collision freedom, foldability, SupportProfile, ToleranceProfile, canonical family completeness, scientific verification, or M0F GO.
`;

export async function runNegPathPolynomialDegreeRangeCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathPolynomialDegreeRangeCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathPolynomialDegreeRangeCandidateBundleCliIo);
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
    positional[0] ?? NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write')
      await writeNegPathPolynomialDegreeRangeCandidateBundleV1(directory);
    const result = await verifyNegPathPolynomialDegreeRangeCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared piecewise-polynomial zero-degree rejection parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr(
      'NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE CANDIDATE BUNDLE GENERATION FAILED\n',
    );
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathPolynomialDegreeRangeCandidateBundleCli(process.argv.slice(2));
}
