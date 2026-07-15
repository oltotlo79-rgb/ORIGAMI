import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { deepFreezeOwned } from './clone-and-freeze.js';
import { DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT } from './fold-face-candidate-flow-cli.js';
import { adaptFoldDocumentToFaceReconstructionInputV1 } from './geometry/fold-document-face-adapter.js';
import { prepareFaceComplexAuditInputV1 } from './geometry/prepare-face-complex-audit-input.js';
import { reconstructFoldFacesCandidateV1 } from './geometry/reconstruct-fold-faces.js';
import {
  MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT_RECORD_TYPE,
  evaluateMutationVerifierCandidateFlowV1,
} from './mutation-verifier-candidate-flow.js';
import { NEG_LAYER_CONTACT_COVERAGE_CASE_SPEC_V1 } from './neg-layer-contact-coverage-candidate-bundle.js';
import { NEG_ORDER_REVERSAL_CASE_SPEC_V1 } from './neg-order-reversal-candidate-bundle.js';
import { NEG_PATH_ENDPOINT_CONTINUITY_CASE_SPEC_V1 } from './neg-path-endpoint-continuity-candidate-bundle.js';
import { NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1 } from './neg-path-time-coverage-candidate-bundle.js';
import { NEG_PATH_UNSUPPORTED_REPRESENTATION_KIND_CASE_SPEC_V1 } from './neg-path-unsupported-representation-kind-candidate-bundle.js';
import { serializeJsonLine } from './stable-json.js';

const USAGE = `Usage: npm run m0f:mutation-verifier-candidate-flow -- [input.json]
       npm run m0f:mutation-verifier-candidate-flow -- --example

Runs parser-only exact-issue regressions separately from the independent face audit.
The combined diagnostic is not canonical promotion, full verification, or M0F GO.
`;

type CaseSpec = Readonly<{
  caseId: string;
  sourceDocument: unknown;
  expectedIssues: readonly Readonly<{ path: string; code: string }>[];
}>;

function parserCase(spec: CaseSpec) {
  return {
    caseId: spec.caseId,
    detector: 'parseArtifactContractV1' as const,
    sourceDocument: spec.sourceDocument,
    expectedIssues: spec.expectedIssues,
  };
}

const DEFAULT_PARSER_ONLY_CASES = [
  parserCase(NEG_PATH_ENDPOINT_CONTINUITY_CASE_SPEC_V1),
  ...NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1.map(parserCase),
  parserCase(NEG_PATH_UNSUPPORTED_REPRESENTATION_KIND_CASE_SPEC_V1),
  parserCase(NEG_LAYER_CONTACT_COVERAGE_CASE_SPEC_V1),
  parserCase(NEG_ORDER_REVERSAL_CASE_SPEC_V1),
];

function defaultFaceComplexAuditInput() {
  const adapted = adaptFoldDocumentToFaceReconstructionInputV1(
    DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT,
  );
  if (!adapted.ok) throw new TypeError('fixed FOLD face input must adapt');
  const reconstructed = reconstructFoldFacesCandidateV1(adapted.value);
  if (!reconstructed.ok) throw new TypeError('fixed FOLD face input must reconstruct');
  const prepared = prepareFaceComplexAuditInputV1(adapted.value, reconstructed.value);
  if (!prepared.ok) throw new TypeError('fixed reconstructed face complex must prepare');
  return prepared.value;
}

export const DEFAULT_MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT = deepFreezeOwned({
  schemaVersion: 1,
  recordType: MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  faceComplexAuditInput: defaultFaceComplexAuditInput(),
  parserOnlyCases: DEFAULT_PARSER_ONLY_CASES,
});

export type MutationVerifierCandidateFlowCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): MutationVerifierCandidateFlowCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

async function evaluateAndWrite(input: unknown, io: MutationVerifierCandidateFlowCliIo) {
  try {
    const result = await evaluateMutationVerifierCandidateFlowV1(input);
    if (!result.ok) {
      result.error.forEach((entry) =>
        io.stderr(`FLOW BLOCKED ${entry.stage} ${entry.code} ${entry.path}: ${entry.message}\n`),
      );
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('mutation verifier candidate flow failed before producing a record\n');
    return 1;
  }
}

export async function runMutationVerifierCandidateFlowCli(
  arguments_: readonly string[],
  io: MutationVerifierCandidateFlowCliIo = defaultIo(),
): Promise<number> {
  if (arguments_.length === 0) {
    return evaluateAndWrite(DEFAULT_MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT, io);
  }
  if (arguments_.length === 1 && (arguments_[0] === '--help' || arguments_[0] === '-h')) {
    io.stdout(USAGE);
    return 0;
  }
  if (arguments_.length === 1 && arguments_[0] === '--example') {
    io.stdout(serializeJsonLine(DEFAULT_MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT));
    return 0;
  }
  if (arguments_.length !== 1 || arguments_[0]?.startsWith('-') === true) {
    io.stderr(USAGE);
    return 2;
  }
  const inputPath = arguments_[0];
  if (inputPath === undefined) {
    io.stderr(USAGE);
    return 2;
  }
  let text: string;
  try {
    text = await readFile(resolve(io.cwd, inputPath), 'utf8');
  } catch {
    io.stderr('mutation verifier candidate flow could not read the input JSON file\n');
    return 1;
  }
  let input: unknown;
  try {
    input = JSON.parse(text) as unknown;
  } catch {
    io.stderr('mutation verifier candidate flow input is not valid JSON\n');
    return 1;
  }
  return evaluateAndWrite(input, io);
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runMutationVerifierCandidateFlowCli(process.argv.slice(2));
}
