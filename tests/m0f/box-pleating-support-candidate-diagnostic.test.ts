import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_INPUT_RECORD_TYPE,
  BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_RESULT_RECORD_TYPE,
  evaluateBoxPleatingSupportCandidateDiagnosticV1,
} from '../../m0f/box-pleating/box-pleating-support-candidate-diagnostic.js';
import { DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT } from '../../m0f/box-pleating-candidate-flow-cli.js';
import {
  runBoxPleatingSupportCandidateDiagnosticCli,
  type BoxPleatingSupportCandidateDiagnosticCliIo,
} from '../../m0f/box-pleating-support-candidate-diagnostic-cli.js';

async function candidateCatalog(): Promise<unknown> {
  return JSON.parse(
    await readFile(resolve('m0f/profiles/support-profile-v1.candidates.json'), 'utf8'),
  ) as unknown;
}

async function defaultInput(): Promise<Record<string, unknown>> {
  return {
    schemaVersion: 1,
    recordType: BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    supportProfileCandidates: await candidateCatalog(),
    candidateFlowInput: DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT,
  };
}

function capture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: BoxPleatingSupportCandidateDiagnosticCliIo = {
    cwd: process.cwd(),
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  };
  return { stdout, stderr, io };
}

describe('M0F box-pleating support candidate diagnostic', () => {
  it('binds measurable candidate predicates to independently replayed packing semantics', async () => {
    const result = evaluateBoxPleatingSupportCandidateDiagnosticV1(await defaultInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));

    expect(result.value).toMatchObject({
      recordType: BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      outputKind: 'candidate-input-predicate-diagnostic-not-support-decision',
      supportProfileCandidateCatalogParsed: true,
      boxPleatingCandidateFlowCompleted: true,
      packingProblemIndependentValidationPassed: true,
      euclideanNecessaryFilterIndependentReplayPassed: true,
      candidateInputPredicateDiagnosticIncluded: true,
      checkSupportImplemented: false,
      supportedInputDecisionIncluded: false,
      supportedInputClaim: false,
      supportProfileIncluded: false,
      supportProfileSelected: false,
      supportProfileFrozen: false,
      supportProfileHashVerified: false,
      supportProfileEvidenceVerified: false,
      isSupportProfile: false,
      toleranceProfileIncluded: false,
      toleranceProfileSelected: false,
      packingSolutionIncluded: false,
      packingSufficiencyEvidenceIncluded: false,
      packingInfeasibilityEvidenceIncluded: false,
      creasePatternIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      profileCandidateBinding: {
        profileId: 'oridesign-generation-box-pleating-v1-candidates',
        catalogStatus: 'candidate',
        profileHash: null,
        evidenceStatus: 'pending',
        constraintCount: 27,
        selectedConstraintCount: 0,
        evaluatedConstraintCount: 6,
        unevaluatedConstraintCount: 21,
      },
      inputFacts: {
        selectedCandidateId: 'square-grid:12x8:xy:1/8',
        leafCount: 2,
        treeEdgeCount: 3,
        maximumTreeDegree: 2,
        selectedGridColumns: 12,
        selectedGridRows: 8,
      },
      packingNecessaryDiagnostic: {
        semanticsContractStatus: 'candidate',
        filterStrength: 'necessary-only',
        packingProblemDescriptionIncluded: true,
        necessaryFilterSearchIncluded: true,
        passingWitnessIsPackingEvidence: false,
        domainExhaustionIsPackingNoSolutionEvidence: false,
        widthUsedByNecessaryFilter: false,
        constructionFamilySelectionIncluded: false,
        polygonRiverGeometryIncluded: false,
      },
    });
    expect(result.value.candidatePredicateObservations.map((entry) => entry.predicateId)).toEqual([
      'leafCountMinimum',
      'leafCountMaximum',
      'maxTreeDegree',
      'maxTreeEdges',
      'maxGridColumns',
      'maxGridRows',
    ]);
    expect(result.value.candidatePredicateObservations).toHaveLength(6);
    expect(
      result.value.candidatePredicateObservations.every((entry) =>
        entry.candidateOutcomes.every((outcome) => outcome.inputSatisfiesCandidateHypothesis),
      ),
    ).toBe(true);
    expect(result.value.unevaluatedConstraintIds).toHaveLength(21);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.candidateFlow)).toBe(true);
  });

  it('rejects any premature support-profile selection before running the flow', async () => {
    const input = await defaultInput();
    const catalog = structuredClone(input.supportProfileCandidates) as {
      profiles: { constraints: { maxGridColumns: { selected: number | null } } }[];
    };
    const boxProfile = catalog.profiles[1];
    if (boxProfile === undefined) throw new Error('box-pleating candidate profile must exist');
    boxProfile.constraints.maxGridColumns.selected = 16;
    input.supportProfileCandidates = catalog;

    const result = evaluateBoxPleatingSupportCandidateDiagnosticV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected premature selection rejection');
    expect(result.error).toContainEqual(
      expect.objectContaining({
        stage: 'profile-catalog',
        path: '$.supportProfileCandidates.profiles[1].constraints.maxGridColumns.selected',
        code: 'premature-selection',
      }),
    );
  });

  it('fails closed on claim escalation and unknown selected candidates', async () => {
    const escalated = await defaultInput();
    escalated.scientificClaim = true;
    const escalatedResult = evaluateBoxPleatingSupportCandidateDiagnosticV1(escalated);
    expect(escalatedResult.ok).toBe(false);
    if (escalatedResult.ok) throw new Error('expected claim-boundary rejection');
    expect(escalatedResult.error).toContainEqual(
      expect.objectContaining({
        stage: 'diagnostic-input',
        path: '$.scientificClaim',
        code: 'claim-boundary',
      }),
    );

    const unknown = await defaultInput();
    unknown.candidateFlowInput = {
      ...DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT,
      candidateId: 'square-grid:unknown',
    };
    const unknownResult = evaluateBoxPleatingSupportCandidateDiagnosticV1(unknown);
    expect(unknownResult.ok).toBe(false);
    if (unknownResult.ok) throw new Error('expected unknown candidate rejection');
    expect(unknownResult.error).toContainEqual(
      expect.objectContaining({
        stage: 'candidate-flow',
        sourceStage: 'candidate-selection',
        path: '$.candidateFlowInput.candidateId',
        code: 'unknown-candidate-id',
      }),
    );
  });

  it('emits the fixed diagnostic deterministically through the CLI', async () => {
    const first = capture();
    const second = capture();
    expect(await runBoxPleatingSupportCandidateDiagnosticCli([], first.io)).toBe(0);
    expect(await runBoxPleatingSupportCandidateDiagnosticCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);
    expect(JSON.parse(first.stdout[0] ?? 'null')).toMatchObject({
      outputKind: 'candidate-input-predicate-diagnostic-not-support-decision',
      checkSupportImplemented: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      globalM0fGo: false,
    });
  });
});
