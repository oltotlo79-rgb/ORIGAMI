import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  BOUNDED_PATH_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
  evaluateBoundedPathCandidateFlowV1,
} from '../../m0f/bounded-path-candidate-flow.js';
import {
  DEFAULT_BOUNDED_PATH_CANDIDATE_FLOW_INPUT,
  runBoundedPathCandidateFlowCli,
  type BoundedPathCandidateFlowCliIo,
} from '../../m0f/bounded-path-candidate-flow-cli.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

function capture(cwd = process.cwd()) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: BoundedPathCandidateFlowCliIo = {
    cwd,
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  };
  return { stdout, stderr, io };
}

describe('M0F bounded path candidate flow', () => {
  it('bundles declared path checks while keeping physical and global claims false', async () => {
    const result = evaluateBoundedPathCandidateFlowV1(DEFAULT_BOUNDED_PATH_CANDIDATE_FLOW_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));

    expect(result.value).toMatchObject({
      recordType: BOUNDED_PATH_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      outputKind: 'declared-bounded-path-parser-diagnostic-not-physical-continuity',
      artifactContractStructuralParseAccepted: true,
      boundedRepresentationAccepted: true,
      candidateRepresentationBoundaryAccepted: true,
      declaredUniformRepresentationAccepted: true,
      declaredSegmentTimeCoverageAccepted: true,
      declaredKnotCoverageAccepted: true,
      declaredFiniteNumbersAccepted: true,
      declaredMotionMapAccepted: true,
      declaredAngleBoundsAccepted: true,
      declaredAdjacentEndpointMapEqualityAccepted: true,
      declaredAdjacentEndpointAngleEqualityAccepted: true,
      currentParserReplayAccepted: true,
      segmentCount: 2,
      adjacentEndpointCount: 1,
      declaredMovingCreaseCount: 1,
      declaredKnotCount: 4,
      declaredKnotIntervalCount: 2,
      piecewisePolynomialIncluded: false,
      representationSelectionIncluded: false,
      independentPathVerifierIncluded: false,
      artifactHashIncluded: false,
      pathCertificateIncluded: false,
      physicalAngleSemanticsEstablished: false,
      physicalPathContinuityEstablished: false,
      startStateBindingVerified: false,
      goalStateBindingVerified: false,
      endpointTargetStateVerified: false,
      intervalProofIncluded: false,
      conservativeBoundsVerified: false,
      creaseMapCompletenessEstablished: false,
      rigidMotionEstablished: false,
      faceIsometryEstablished: false,
      hingeGeometryEstablished: false,
      singularityHandlingIncluded: false,
      branchHandlingIncluded: false,
      closedLoopHandlingIncluded: false,
      progressReportingIncluded: false,
      seededSearchIncluded: false,
      cancellationIncluded: false,
      resumeIncluded: false,
      contactAnalysisIncluded: false,
      legalContactVerified: false,
      continuousCollisionDetectionIncluded: false,
      collisionFreedomEstablished: false,
      layerOrderEstablished: false,
      foldabilityEstablished: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      globalM0fGate: 'not-evaluated',
    });
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.artifactContract.pathCandidate)).toBe(true);

    const discontinuous = structuredClone(DEFAULT_BOUNDED_PATH_CANDIDATE_FLOW_INPUT);
    const second = discontinuous.pathCandidate.segments[1];
    if (second?.motion.kind !== 'bounded-interpolation') throw new Error('bad fixed control');
    const angles = second.motion.anglesByCrease[0]?.angles;
    if (angles === undefined) throw new Error('bad fixed control');
    angles[0] = (3 * Math.PI) / 4;
    expect(evaluateBoundedPathCandidateFlowV1(discontinuous)).toMatchObject({
      ok: false,
      error: [
        {
          stage: 'artifact-contract',
          path: '$.pathCandidate.segments[1].motion.anglesByCrease',
          code: 'path-endpoint-discontinuity',
        },
      ],
    });

    const directory = await mkdtemp(join(tmpdir(), 'oridesign-bounded-path-flow-'));
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'input.json'),
      JSON.stringify(DEFAULT_BOUNDED_PATH_CANDIDATE_FLOW_INPUT),
      'utf8',
    );
    const first = capture(directory);
    const secondRun = capture(directory);
    expect(await runBoundedPathCandidateFlowCli(['input.json'], first.io)).toBe(0);
    expect(await runBoundedPathCandidateFlowCli(['input.json'], secondRun.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(secondRun.stdout);
    expect(JSON.parse(first.stdout[0] ?? 'null')).toMatchObject({
      outputKind: 'declared-bounded-path-parser-diagnostic-not-physical-continuity',
      declaredAdjacentEndpointAngleEqualityAccepted: true,
      continuousCollisionDetectionIncluded: false,
      physicalPathContinuityEstablished: false,
      globalM0fGate: 'not-evaluated',
    });
  });
});
