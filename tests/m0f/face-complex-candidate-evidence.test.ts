import { describe, expect, it } from 'vitest';

import {
  FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE,
  parseFaceComplexCandidateEvidenceIndexV1,
} from '../../m0f/face-complex-candidate-evidence.js';

function validIndex(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    scope: 'face-reconstruction-and-audit-only',
    fixtureId: 'REF-FOLD-NOFACES',
    manifestExpectedOutcomePolicy: 'observed-only-not-stage-evidence',
    sourceInputArtifactId: 'source-input',
    reconstructionExperimentArtifactId: 'reconstruction-record',
    auditExperimentArtifactId: 'audit-record',
    auditEvidenceArtifactId: 'audit-evidence',
    mutationSuiteArtifactId: 'mutation-suite',
    mutationResultArtifactId: 'mutation-result',
  };
}

describe('face-complex candidate evidence index', () => {
  it('accepts and owns the closed candidate-only pointer record', () => {
    const supplied = validIndex();
    const parsed = parseFaceComplexCandidateEvidenceIndexV1(supplied);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('expected valid index');
    expect(parsed.value.scientificClaim).toBe(false);
    expect(parsed.value.manifestExpectedOutcomePolicy).toBe('observed-only-not-stage-evidence');
    expect(Object.isFrozen(parsed.value)).toBe(true);
    supplied.sourceInputArtifactId = 'changed-after-parse';
    expect(parsed.value.sourceInputArtifactId).toBe('source-input');
  });

  it('fails closed on claim escalation, extra fields, and ambiguous artifact roles', () => {
    const parsed = parseFaceComplexCandidateEvidenceIndexV1({
      ...validIndex(),
      scientificClaim: true,
      surprise: true,
      auditExperimentArtifactId: 'reconstruction-record',
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new Error('expected invalid index');
    const locations = parsed.error.map(({ code, path }) => ({ code, path }));
    expect(locations).toContainEqual({ code: 'invalid-literal', path: '$.scientificClaim' });
    expect(locations).toContainEqual({ code: 'unknown-field', path: '$.surprise' });
    expect(locations).toContainEqual({ code: 'duplicate-artifact-id', path: '$' });
  });

  it('does not invoke getters while taking its validation snapshot', () => {
    const supplied = validIndex();
    Object.defineProperty(supplied, 'scope', {
      enumerable: true,
      get: () => {
        throw new Error('must not run');
      },
    });
    const parsed = parseFaceComplexCandidateEvidenceIndexV1(supplied);
    expect(parsed).toMatchObject({
      ok: false,
      error: [expect.objectContaining({ code: 'invalid-snapshot' })],
    });
  });

  it('fails closed instead of throwing on an unexpected host validation failure', () => {
    const originalKeys = Object.keys;
    Object.keys = () => {
      throw new Error('injected host failure');
    };
    try {
      expect(parseFaceComplexCandidateEvidenceIndexV1(validIndex())).toEqual({
        ok: false,
        error: [
          {
            path: '$',
            code: 'invalid-snapshot',
            message: 'index validation failed closed on an unexpected host condition',
          },
        ],
      });
    } finally {
      Object.keys = originalKeys;
    }
  });
});
