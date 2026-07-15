import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1,
  writeNegPathPolynomialDerivativeBoundsCandidateBundleV1,
} from './neg-path-polynomial-derivative-bounds-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathPolynomialDerivativeBoundsCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-polynomial-derivative-bounds-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only one project-authored declared piecewise-polynomial derivative-bound lower/upper inversion.
It does not establish derivative semantics, conservative proof, or units, select a representation, freeze a polynomial basis, establish coefficient semantics, infer polynomial endpoints, establish physical angle/path semantics or crease-map completeness, rigidity, face isometry, hinge geometry, certificate-hash verification or cryptographic authenticity, contact semantics, CCD, collision freedom, foldability, SupportProfile, ToleranceProfile, canonical family completeness, scientific verification, or M0F GO.
`;

export async function runNegPathPolynomialDerivativeBoundsCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathPolynomialDerivativeBoundsCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathPolynomialDerivativeBoundsCandidateBundleCliIo);
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
    positional[0] ?? NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write')
      await writeNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory);
    const result = await verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-POLYNOMIAL-DERIVATIVE-BOUNDS-INVERTED REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared piecewise-polynomial derivative-bounds lower/upper parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr(
      'NEG-PATH-MUTATION-POLYNOMIAL-DERIVATIVE-BOUNDS-INVERTED CANDIDATE BUNDLE GENERATION FAILED\n',
    );
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathPolynomialDerivativeBoundsCandidateBundleCli(
    process.argv.slice(2),
  );
}
