import { describe, expect, it } from 'vitest';

import {
  FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
  FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
  FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1,
} from '../../m0f/experiments/face-reconstruction.js';
import {
  DEFAULT_CANDIDATE_EXPERIMENT_REGISTRY,
  runCandidateExperimentV1,
} from '../../m0f/experiments/runner.js';

function nonDyadicInput(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [3, 0],
      [3, 1],
      [3, 2],
      [1, 2],
      [0, 2],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
      [1, 5],
      [0, 3],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M'],
    facesVertices: null,
  };
}

function request(input: unknown, parameters: unknown = FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1) {
  return {
    experimentId: FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
    engineVersion: FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
    parameters,
    input,
    seed: 0x4d30_4633,
    repetition: 0,
  } as const;
}

describe('candidate FOLD face reconstruction experiment', () => {
  it('is in the closed default registry and emits a deterministic hashable exact result', async () => {
    expect(DEFAULT_CANDIDATE_EXPERIMENT_REGISTRY.experimentIds).toContain(
      FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
    );
    const first = await runCandidateExperimentV1(request(nonDyadicInput()));
    const second = await runCandidateExperimentV1(request(nonDyadicInput()));
    expect(second).toEqual(first);
    expect(first).toMatchObject({
      experimentId: FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
      engineVersion: FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      reasonCode: null,
      result: {
        contractStatus: 'candidate',
        scientificClaim: false,
        topology: {
          planarVertexCount: 8,
          planarEdgeCount: 11,
          boundedFaceCount: 4,
          triangleCount: 7,
          nonDyadicVertexCount: 1,
        },
      },
    });
    expect(first.parameterHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(first.inputHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(first.semanticHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(() => JSON.stringify(first)).not.toThrow();
  });

  it('uses declared failure codes for parameters, raw input, and rejected topology', async () => {
    const invalidParameters = await runCandidateExperimentV1(
      request(nonDyadicInput(), { emitFoldProjection: true }),
    );
    expect(invalidParameters).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.face-reconstruction.invalid-parameters',
      result: null,
    });

    const invalidInput = await runCandidateExperimentV1(
      request({ ...nonDyadicInput(), facesVertices: [[0, 1, 2]] }),
    );
    expect(invalidInput).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.face-reconstruction.invalid-input',
      result: { contractStatus: 'candidate', scientificClaim: false },
    });

    const rejectedTopology = await runCandidateExperimentV1(
      request({
        specVersion: '1.2',
        verticesCoords: [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [3, 2],
        ],
        edgesVertices: [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 0],
          [2, 4],
        ],
        edgesAssignment: ['B', 'B', 'B', 'B', 'F'],
        facesVertices: null,
      }),
    );
    expect(rejectedTopology).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.face-reconstruction.topology-rejected',
      result: {
        issues: [expect.objectContaining({ stage: 'face-enumeration', code: 'bridge-edge' })],
      },
    });
  });
});
