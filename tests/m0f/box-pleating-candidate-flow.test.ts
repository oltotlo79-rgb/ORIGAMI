import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  BOX_PLEATING_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
  evaluateBoxPleatingCandidateFlowV1,
} from '../../m0f/box-pleating/box-pleating-candidate-flow.js';
import {
  DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT,
  runBoxPleatingCandidateFlowCli,
  type BoxPleatingCandidateFlowCliIo,
} from '../../m0f/box-pleating-candidate-flow-cli.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

function capture(cwd = process.cwd()) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: BoxPleatingCandidateFlowCliIo = {
    cwd,
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  };
  return { stdout, stderr, io };
}

describe('M0F box-pleating candidate flow', () => {
  it('runs the fixed end-to-end diagnostic while keeping every downstream claim false', async () => {
    const result = evaluateBoxPleatingCandidateFlowV1(DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));

    expect(result.value).toMatchObject({
      recordType: BOX_PLEATING_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      outputKind: 'preconstruction-diagnostic-not-crease-pattern',
      candidateSelectionMode: 'caller-supplied-id',
      automaticCandidateSelectionIncluded: false,
      selectedCandidateIndependentValidationPassed: true,
      necessaryFilterIndependentReplayPassed: true,
      gridSubstrateIncluded: true,
      paperPartitionIncluded: true,
      generalPolygonRiverPackingSolverIncluded: false,
      actualPolygonRiverGeometryIncluded: false,
      branchPlacementIncluded: false,
      packingIncluded: false,
      axialConstructionIncluded: false,
      junctionConstructionIncluded: false,
      pleatRoutingIncluded: false,
      creasePatternIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      candidateCatalog: { selectedCandidateId: 'square-grid:12x8:xy:1/8' },
      necessaryFilterSearch: {
        globalNoSolutionEvidence: false,
        packingInfeasibilityEvidence: false,
        placementIncluded: false,
        creasePatternIncluded: false,
      },
    });
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.enumeration)).toBe(true);

    const directory = await mkdtemp(join(tmpdir(), 'oridesign-box-flow-'));
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'input.json'),
      JSON.stringify(DEFAULT_BOX_PLEATING_CANDIDATE_FLOW_INPUT),
      'utf8',
    );
    const first = capture(directory);
    const second = capture(directory);
    expect(await runBoxPleatingCandidateFlowCli(['input.json'], first.io)).toBe(0);
    expect(await runBoxPleatingCandidateFlowCli(['input.json'], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);
    expect(JSON.parse(first.stdout[0] ?? 'null')).toMatchObject({
      outputKind: 'preconstruction-diagnostic-not-crease-pattern',
      creasePatternIncluded: false,
      globalM0fGo: false,
    });
  });
});
