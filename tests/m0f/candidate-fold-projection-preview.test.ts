import { describe, expect, it } from 'vitest';

import { createCandidateFoldProjectionPreviewJsonV1 } from '../../m0f/candidate-fold-projection-preview.js';
import { DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT } from '../../m0f/fold-face-candidate-flow-cli.js';
import { evaluateFoldFaceCandidateFlowV1 } from '../../m0f/fold-face-candidate-flow.js';
import { parseAndRoundtripCandidateFoldProjectionV1 } from '../../m0f/geometry/fold-projection-roundtrip.js';
import { stableStringify } from '../../m0f/stable-json.js';

async function completedFlow() {
  const result = await evaluateFoldFaceCandidateFlowV1(DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

describe('candidate FOLD projection preview JSON', () => {
  it('extracts and deterministically serializes only the existing candidate projection', async () => {
    const flow = await completedFlow();
    const first = createCandidateFoldProjectionPreviewJsonV1(flow);
    const second = createCandidateFoldProjectionPreviewJsonV1(flow);

    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(JSON.stringify(first.error));
    expect(second).toEqual(first);
    expect(first.value.json).toBe(stableStringify(first.value.projection));
    expect(JSON.parse(first.value.json)).toEqual(first.value.projection);
    expect(first.value.projection._oridesign_m0f_candidate).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
    });
    expect(first.value.json).not.toMatch(
      /"(?:verified|artifactHash|pathCertificateHash|globalM0fGo)"/u,
    );
    expect(parseAndRoundtripCandidateFoldProjectionV1(JSON.parse(first.value.json)).ok).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.value.projection)).toBe(true);
  });

  it('fails closed if the flow claim boundary is changed', async () => {
    const flow = await completedFlow();
    const escalated = structuredClone(flow) as unknown as { scientificClaim: boolean };
    escalated.scientificClaim = true;

    expect(createCandidateFoldProjectionPreviewJsonV1(escalated)).toEqual({
      ok: false,
      error: [
        {
          stage: 'flow-result',
          path: '$',
          code: 'claim-boundary',
          message: 'preview requires an unchanged candidate fold-face flow result',
        },
      ],
    });
  });

  it('fails closed for every claim-critical root-field mutation', async () => {
    const flow = await completedFlow();
    const mutations = [
      ['schemaVersion', 2],
      ['scope', 'product-export'],
      ['canonicalFixtureRegistrationIncluded', true],
      ['candidateSubgateEvaluated', true],
      ['normalizedGeometryBound', false],
      ['rawSourceDocumentBytesBound', true],
      ['allSourceDocumentMetadataBound', true],
      ['faceReconstructionExperimentCompleted', false],
      ['faceComplexAuditExperimentCompleted', false],
      ['separateProjectiveKernelAuditCompleted', false],
      ['currentSourceSetEvidenceReauditPassed', false],
      ['mutationSuiteExpectationsMet', false],
      ['independentReferenceVerifierIncluded', true],
      ['referenceVerifierComplete', true],
      ['toleranceProfileIncluded', true],
      ['foldabilityVerified', true],
      ['rigidFoldPathVerified', true],
      ['collisionFreedomVerified', true],
      ['layerOrderVerified', true],
      ['globalM0fGate', 'GO'],
    ] as const;

    for (const [field, value] of mutations) {
      const mutated = structuredClone(flow) as unknown as Record<string, unknown>;
      mutated[field] = value;
      const result = createCandidateFoldProjectionPreviewJsonV1(mutated);
      expect(result.ok, field).toBe(false);
      expect(result, field).not.toHaveProperty('value');
    }
  });

  it('rejects an escalated projection before emitting JSON', async () => {
    const mutable = structuredClone(await completedFlow()) as unknown as {
      reconstructionExperiment: {
        result: { foldProjection: { _oridesign_m0f_candidate: { scientificClaim: boolean } } };
      };
    };
    mutable.reconstructionExperiment.result.foldProjection._oridesign_m0f_candidate.scientificClaim = true;

    const result = createCandidateFoldProjectionPreviewJsonV1(mutable);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('escalated projection must be rejected');
    expect(result).not.toHaveProperty('value');
    expect(
      result.error.some(
        (entry) =>
          entry.stage === 'reconstruction-result' &&
          entry.path.includes('foldProjection._oridesign_m0f_candidate.scientificClaim'),
      ),
    ).toBe(true);
  });
});
