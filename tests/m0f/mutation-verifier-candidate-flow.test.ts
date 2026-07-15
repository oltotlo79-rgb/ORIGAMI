import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  MUTATION_VERIFIER_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
  evaluateMutationVerifierCandidateFlowV1,
} from '../../m0f/mutation-verifier-candidate-flow.js';
import {
  DEFAULT_MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT,
  runMutationVerifierCandidateFlowCli,
  type MutationVerifierCandidateFlowCliIo,
} from '../../m0f/mutation-verifier-candidate-flow-cli.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

function capture(cwd = process.cwd()) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: MutationVerifierCandidateFlowCliIo = {
    cwd,
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  };
  return { stdout, stderr, io };
}

describe('M0F mutation and verifier candidate flow', () => {
  it('keeps parser regression evidence separate from independent face auditing', async () => {
    const result = await evaluateMutationVerifierCandidateFlowV1(
      DEFAULT_MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));

    expect(result.value).toMatchObject({
      recordType: MUTATION_VERIFIER_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      outputKind: 'separated-parser-regression-and-independent-audit-diagnostic',
      parserOnlyReplay: {
        verificationClass: 'parser-exact-issue-regression-only',
        caseCount: 8,
        everyExpectedIssueSignatureMatched: true,
        independentVerifierIncluded: false,
      },
      independentFaceComplexAudit: {
        verificationClass: 'separate-projective-kernel-current-source-set-audit',
        auditScope: 'face-complex-only',
        evidenceCreated: true,
        currentSourceSetReauditPassed: true,
        mutationSuiteExpectationsMet: true,
        mutationCaseCount: 11,
        mutationSuiteVerificationClass: 'semantic-mutation-regression-not-full-reference-verifier',
        mutationSuiteIndependentVerifierIncluded: false,
        fullReferenceVerifierIncluded: false,
      },
      parserOnlyAndIndependentResultsKeptSeparate: true,
      parserOnlyCasesIndependentlyVerified: false,
      canonicalManifestEvaluated: false,
      canonicalMutationFamilyComplete: false,
      independentVerificationScope: 'face-complex-only',
      independentPathVerifierIncluded: false,
      independentContactVerifierIncluded: false,
      independentLayerVerifierIncluded: false,
      fullIndependentReferenceVerifierIncluded: false,
      sourceDocumentBytesBound: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      physicalPathContinuityVerified: false,
      collisionFreedomVerified: false,
      layerOrderVerified: false,
      foldabilityVerified: false,
      verifiedClaim: false,
      globalM0fGate: 'not-evaluated',
    });
    expect(result.value.parserOnlyReplay.cases).toHaveLength(8);
    expect(result.value.independentFaceComplexAudit.mutationSuite.cases).toHaveLength(11);
    expect(Object.isFrozen(result.value)).toBe(true);

    const wrongExpectation = JSON.parse(
      JSON.stringify(DEFAULT_MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT),
    ) as {
      parserOnlyCases: { expectedIssues: { code: string }[] }[];
    };
    const firstCase = wrongExpectation.parserOnlyCases[0];
    if (firstCase === undefined || firstCase.expectedIssues[0] === undefined) {
      throw new Error('fixture test parser case is missing');
    }
    firstCase.expectedIssues[0].code = 'wrong-code';
    expect(await evaluateMutationVerifierCandidateFlowV1(wrongExpectation)).toMatchObject({
      ok: false,
      error: [
        {
          stage: 'parser-only-replay',
          code: 'issue-signature-mismatch',
          path: '$.parserOnlyCases[0].expectedIssues',
        },
      ],
    });

    const directory = await mkdtemp(join(tmpdir(), 'oridesign-mutation-verifier-flow-'));
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'input.json'),
      JSON.stringify(DEFAULT_MUTATION_VERIFIER_CANDIDATE_FLOW_INPUT),
      'utf8',
    );
    const first = capture(directory);
    const second = capture(directory);
    expect(await runMutationVerifierCandidateFlowCli(['input.json'], first.io)).toBe(0);
    expect(await runMutationVerifierCandidateFlowCli(['input.json'], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);
    expect(JSON.parse(first.stdout[0] ?? 'null')).toMatchObject({
      parserOnlyAndIndependentResultsKeptSeparate: true,
      parserOnlyCasesIndependentlyVerified: false,
      fullIndependentReferenceVerifierIncluded: false,
      verifiedClaim: false,
      globalM0fGate: 'not-evaluated',
    });
  });
});
