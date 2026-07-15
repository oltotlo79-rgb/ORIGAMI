import { describe, expect, it } from 'vitest';

import { prepareFaceComplexAuditInputV1 } from '../../m0f/geometry/prepare-face-complex-audit-input.js';
import { reconstructFoldFacesCandidateV1 } from '../../m0f/geometry/reconstruct-fold-faces.js';

function sourceInput(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [0.5, 0],
      [1, 0],
      [1, 1],
      [0.5, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [1, 4],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'V'],
    facesVertices: null,
  };
}

function artifact(): unknown {
  const reconstructed = reconstructFoldFacesCandidateV1(sourceInput());
  if (!reconstructed.ok) throw new Error(reconstructed.error.map((entry) => entry.code).join(','));
  return reconstructed.value;
}

describe('face-complex audit input preparation', () => {
  it('extracts the compact closed bundle and returns an owned frozen value', () => {
    const source = sourceInput();
    const result = prepareFaceComplexAuditInputV1(source, artifact());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toMatchObject({
      recordType: 'm0f-face-complex-audit-input',
      contractStatus: 'candidate',
      scientificClaim: false,
      source: { specVersion: '1.2', facesVertices: null },
      artifact: {
        inputSpecVersion: '1.2',
        topology: { boundedFaceCount: 2, triangleCount: 4 },
      },
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.value.artifact.faces[0]?.triangles)).toBe(true);

    const before = JSON.stringify(result.value);
    (source.verticesCoords as number[][])[0]?.splice(0, 2, 99, 99);
    expect(JSON.stringify(result.value)).toBe(before);
  });

  it('maps invalid source and artifact boundaries without throwing', () => {
    const invalidSource = prepareFaceComplexAuditInputV1(
      { ...sourceInput(), facesVertices: [] },
      artifact(),
    );
    expect(invalidSource).toMatchObject({ ok: false, error: [{ stage: 'source' }] });

    const invalidArtifact = structuredClone(artifact()) as Record<string, unknown>;
    invalidArtifact.scientificClaim = true;
    const artifactFailure = prepareFaceComplexAuditInputV1(sourceInput(), invalidArtifact);
    expect(artifactFailure).toMatchObject({ ok: false, error: [{ stage: 'artifact' }] });
    expect(Object.isFrozen(artifactFailure)).toBe(true);
  });
});
