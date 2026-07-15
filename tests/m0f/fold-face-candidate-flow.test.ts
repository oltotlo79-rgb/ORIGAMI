import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT,
  runFoldFaceCandidateFlowCli,
  type FoldFaceCandidateFlowCliIo,
} from '../../m0f/fold-face-candidate-flow-cli.js';
import {
  evaluateFoldFaceCandidateFlowV1,
  FOLD_FACE_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
} from '../../m0f/fold-face-candidate-flow.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

function capture(cwd = process.cwd()) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: FoldFaceCandidateFlowCliIo = {
    cwd,
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  };
  return { stdout, stderr, io };
}

describe('M0F external FOLD face candidate flow', () => {
  it('runs reconstruction, independent audit, evidence, and mutations without escalating claims', async () => {
    const result = await evaluateFoldFaceCandidateFlowV1(DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));

    expect(result.value).toMatchObject({
      recordType: FOLD_FACE_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      outputKind: 'fold-nofaces-candidate-diagnostic-not-scientific-verification',
      scope: 'caller-supplied-fold-nofaces-reconstruction-and-face-complex-audit-only',
      canonicalFixtureRegistrationIncluded: false,
      candidateSubgateEvaluated: false,
      normalizedGeometryBound: true,
      rawSourceDocumentBytesBound: false,
      allSourceDocumentMetadataBound: false,
      faceReconstructionExperimentCompleted: true,
      faceComplexAuditExperimentCompleted: true,
      separateProjectiveKernelAuditCompleted: true,
      currentSourceSetEvidenceReauditPassed: true,
      mutationSuiteExpectationsMet: true,
      independentReferenceVerifierIncluded: false,
      referenceVerifierComplete: false,
      toleranceProfileIncluded: false,
      foldabilityVerified: false,
      rigidFoldPathVerified: false,
      collisionFreedomVerified: false,
      layerOrderVerified: false,
      globalM0fGate: 'not-evaluated',
      reconstructionExperiment: { outcome: 'completed' },
      auditExperiment: { outcome: 'completed' },
      reaudit: { auditOutcome: 'consistent' },
      mutationSuite: { suiteOutcome: 'expectations-met' },
    });
    expect(result.value.mutationSuite.cases).toHaveLength(11);
    expect(result.value.reaudit.auditResult).toEqual(result.value.evidence.auditResult);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.evidence)).toBe(true);

    const directory = await mkdtemp(join(tmpdir(), 'oridesign-fold-face-flow-'));
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'input.fold'),
      JSON.stringify(DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT),
      'utf8',
    );
    const first = capture(directory);
    const second = capture(directory);
    expect(await runFoldFaceCandidateFlowCli(['input.fold'], first.io)).toBe(0);
    expect(await runFoldFaceCandidateFlowCli(['input.fold'], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);
    expect(JSON.parse(first.stdout[0] ?? 'null')).toMatchObject({
      outputKind: 'fold-nofaces-candidate-diagnostic-not-scientific-verification',
      candidateSubgateEvaluated: false,
      rawSourceDocumentBytesBound: false,
      currentSourceSetEvidenceReauditPassed: true,
      foldabilityVerified: false,
      globalM0fGate: 'not-evaluated',
    });
  });
});
