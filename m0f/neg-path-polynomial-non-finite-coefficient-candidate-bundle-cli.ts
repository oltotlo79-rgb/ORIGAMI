import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1,
  writeNegPathPolynomialNonFiniteCoefficientCandidateBundleV1,
} from './neg-path-polynomial-non-finite-coefficient-candidate-bundle.js';
import { stableStringify } from './stable-json.js';

export type NegPathPolynomialNonFiniteCoefficientCandidateBundleCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

const USAGE = `Usage: neg-path-polynomial-non-finite-coefficient-candidate-bundle [--verify|--write] [directory] [--json]

Replays or regenerates only one project-authored declared piecewise-polynomial non-finite coefficient rejection.
It does not establish non-empty coefficient rows, coefficient/degree cardinality, coefficient- or derivative-bound-row uniqueness, path-time coverage, representation selection, a polynomial basis, coefficient ordering or semantics, row/interval association, derivative semantics or validation, endpoint inference, physical angle/path semantics, crease-/motion-map completeness, rigidity, face isometry, hinge geometry, certificate-hash verification or cryptographic authenticity, contact semantics, CCD, collision freedom, foldability, SupportProfile, ToleranceProfile, canonical family completeness, scientific verification, or M0F GO.
`;

export async function runNegPathPolynomialNonFiniteCoefficientCandidateBundleCli(
  argv: readonly string[],
  io?: NegPathPolynomialNonFiniteCoefficientCandidateBundleCliIo,
): Promise<number> {
  const actualIo =
    io ??
    ({
      cwd: process.cwd(),
      stdout: (text: string) => process.stdout.write(text),
      stderr: (text: string) => process.stderr.write(text),
    } satisfies NegPathPolynomialNonFiniteCoefficientCandidateBundleCliIo);
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
    positional[0] ?? NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  );
  try {
    if (actions[0] === '--write')
      await writeNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory);
    const result = await verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory);
    if (argv.includes('--json')) actualIo.stdout(`${stableStringify(result)}\n`);
    else if (result.reproducibleExactNegativeBundle) {
      actualIo.stdout(
        'NEG-PATH-MUTATION-POLYNOMIAL-NON-FINITE-COEFFICIENT REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE (declared piecewise-polynomial finite-coefficients parser replay only; no canonical promotion; no scientific claim; M0F GO not evaluated)\n',
      );
    } else {
      for (const reasonCode of result.reasonCodes) actualIo.stderr(`BLOCKED ${reasonCode}\n`);
    }
    return result.reproducibleExactNegativeBundle ? 0 : 1;
  } catch {
    actualIo.stderr(
      'NEG-PATH-MUTATION-POLYNOMIAL-NON-FINITE-COEFFICIENT CANDIDATE BUNDLE GENERATION FAILED\n',
    );
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runNegPathPolynomialNonFiniteCoefficientCandidateBundleCli(
    process.argv.slice(2),
  );
}
