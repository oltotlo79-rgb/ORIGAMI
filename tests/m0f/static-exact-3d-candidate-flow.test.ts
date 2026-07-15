import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  STATIC_EXACT_3D_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
  evaluateStaticExact3dCandidateFlowV1,
} from '../../m0f/static-exact-3d-candidate-flow.js';
import {
  DEFAULT_STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT,
  runStaticExact3dCandidateFlowCli,
  type StaticExact3dCandidateFlowCliIo,
} from '../../m0f/static-exact-3d-candidate-flow-cli.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

function capture(cwd = process.cwd()) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: StaticExact3dCandidateFlowCliIo = {
    cwd,
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  };
  return { stdout, stderr, io };
}

describe('M0F static exact 3D candidate flow', () => {
  it('bundles static strata and independent audits without escalating to continuous claims', async () => {
    const result = await evaluateStaticExact3dCandidateFlowV1(
      DEFAULT_STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));

    expect(result.value).toMatchObject({
      recordType: STATIC_EXACT_3D_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate-no-claim',
      scientificClaim: false,
      outputKind: 'one-exact-static-pose-diagnostic-not-continuous-collision-verification',
      portableDecimalInputAccepted: true,
      exactStaticMeshStrataCompleted: true,
      allUnorderedStaticPairsIncluded: true,
      meshIdentityBoundToExactPose: true,
      declaredHingeLocusContainmentIncluded: true,
      rawOverlapCensusCompleted: true,
      independentWholeCensusAuditPassed: true,
      currentSourceSetEvidenceReplayPassed: true,
      portableCrossingWitnessSetCreated: true,
      independentCrossingWitnessAuditConsistent: true,
      staticContactCandidateCategoriesIncluded: true,
      layerOrderRequirementFlagsIncluded: true,
      cryptographicMeshRevisionBindingIncluded: false,
      productStableIdentityIncluded: false,
      motionSideHistoryIncluded: false,
      legalContactPolicyIncluded: false,
      physicalContactCompletenessEstablished: false,
      penetrationClassificationIncluded: false,
      layerOrderDecisionIncluded: false,
      physicalLayerOrderEstablished: false,
      selfIntersectionDecisionIncluded: false,
      continuousTimeIncluded: false,
      continuousCollisionDetectionIncluded: false,
      continuousCollisionFreedomEstablished: false,
      foldabilityEstablished: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      verifiedClaim: false,
      globalM0fGate: 'not-evaluated',
    });
    expect(result.value.triangleCount).toBeGreaterThan(0);
    expect(result.value.unorderedPairCount).toBeGreaterThan(0);
    expect(result.value.staticContactCandidatePairCount).toBeGreaterThan(0);
    expect(result.value.requiresLayerOrderPairCount).toBeGreaterThan(0);
    expect(result.value.requiresMotionSideHistoryPairCount).toBe(
      result.value.pairDiagnostics.filter((pair) => pair.requiresMotionSideHistory).length,
    );
    expect(result.value.requiresLayerOrderPairCount).toBe(
      result.value.pairDiagnostics.filter((pair) => pair.requiresLayerOrder).length,
    );
    expect(result.value.nonadjacentContactRequiresMotionHistoryPairCount).toBe(2);
    expect(result.value.nonadjacentCoplanarAreaRequiresLayerOrderPairCount).toBe(2);
    expect(
      result.value.pairDiagnostics.some(
        (pair) => pair.category === 'nonadjacent-coplanar-area-requires-layer-order',
      ),
    ).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.censusEvidence)).toBe(true);

    const invalidCoordinate = JSON.parse(
      JSON.stringify(DEFAULT_STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT),
    ) as {
      staticTriangleSet: { triangles: { triangle: { x: string }[] }[] };
    };
    const firstTriangle = invalidCoordinate.staticTriangleSet.triangles[0];
    expect(firstTriangle).toBeDefined();
    const firstVertex = firstTriangle?.triangle[0];
    expect(firstVertex).toBeDefined();
    if (firstVertex === undefined) throw new Error('fixture test triangle is missing');
    firstVertex.x = '01';
    expect(await evaluateStaticExact3dCandidateFlowV1(invalidCoordinate)).toMatchObject({
      ok: false,
      error: [
        {
          stage: 'portable-input',
          code: 'noncanonical-decimal',
          path: '$.staticTriangleSet.triangles[0].triangle[0].x',
        },
      ],
    });

    const directory = await mkdtemp(join(tmpdir(), 'oridesign-static-exact-3d-flow-'));
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'input.json'),
      JSON.stringify(DEFAULT_STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT),
      'utf8',
    );
    const first = capture(directory);
    const second = capture(directory);
    expect(await runStaticExact3dCandidateFlowCli(['input.json'], first.io)).toBe(0);
    expect(await runStaticExact3dCandidateFlowCli(['input.json'], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);
    expect(JSON.parse(first.stdout[0] ?? 'null')).toMatchObject({
      outputKind: 'one-exact-static-pose-diagnostic-not-continuous-collision-verification',
      exactStaticMeshStrataCompleted: true,
      layerOrderDecisionIncluded: false,
      continuousCollisionDetectionIncluded: false,
      continuousCollisionFreedomEstablished: false,
      globalM0fGate: 'not-evaluated',
    });
  });
});
