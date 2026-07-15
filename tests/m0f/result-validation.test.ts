import { describe, expect, it } from 'vitest';

import { FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID } from '../../m0f/experiments/face-reconstruction.js';
import { FACE_COMPLEX_AUDIT_EXPERIMENT_ID } from '../../m0f/experiments/face-complex-audit.js';
import { NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID } from '../../m0f/experiments/numeric-kernel.js';
import { validateCompletedExperimentResult } from '../../m0f/experiments/result-validation.js';
import { reconstructFoldFacesCandidateV1 } from '../../m0f/geometry/reconstruct-fold-faces.js';

function validOrientationResult(): Record<string, unknown> {
  return {
    comparisonCount: 3,
    fastFilterCount: 1,
    exactFallbackCount: 2,
    mismatchCount: 0,
    oracleAgreement: true,
    signCounts: { negative: 0, zero: 1, positive: 2 },
  };
}

function validFoldResult(): unknown {
  const reconstructed = reconstructFoldFacesCandidateV1({
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
  });
  if (!reconstructed.ok) {
    throw new Error(reconstructed.error.map((issue) => issue.code).join(', '));
  }
  return reconstructed.value;
}

function validFaceAuditResult(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: 'm0f-face-complex-audit-result',
    contractStatus: 'candidate',
    scientificClaim: false,
    scope: 'face-complex-only',
    implementationRole: 'independent-auditor',
    verificationIndependence: 'separate-projective-kernel-not-full-reference-verifier',
    auditOutcome: 'consistent',
    topology: {
      sourceVertexCount: 7,
      sourceEdgeCount: 9,
      planarVertexCount: 8,
      planarEdgeCount: 11,
      boundedFaceCount: 4,
      triangleCount: 7,
      createdIntersectionVertexCount: 1,
      nonDyadicVertexCount: 1,
      eulerValue: 1,
    },
  };
}

function violations(result: unknown) {
  const validated = validateCompletedExperimentResult(
    NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID,
    result,
  );
  if (validated.ok) throw new Error('expected numeric result rejection');
  return validated.violations;
}

describe('known completed experiment result validation', () => {
  it('accepts the exact closed numeric-kernel result shape', () => {
    expect(
      validateCompletedExperimentResult(
        NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID,
        validOrientationResult(),
      ),
    ).toEqual({ ok: true });
  });

  it('rejects missing, unknown, and non-safe numeric fields with $.result paths', () => {
    const missing = validOrientationResult();
    delete missing.comparisonCount;
    expect(violations(missing)).toContainEqual({
      path: '$.result.comparisonCount',
      message: 'required field is missing',
    });

    const unknown = { ...validOrientationResult(), extra: true };
    expect(violations(unknown)).toContainEqual({
      path: '$.result.extra',
      message: 'field is not declared',
    });

    const invalidCounts = validOrientationResult();
    invalidCounts.fastFilterCount = -1;
    invalidCounts.exactFallbackCount = 0.5;
    invalidCounts.mismatchCount = Number.MAX_SAFE_INTEGER + 1;
    const countViolations = violations(invalidCounts);
    expect(countViolations.map((entry) => entry.path)).toEqual(
      expect.arrayContaining([
        '$.result.fastFilterCount',
        '$.result.exactFallbackCount',
        '$.result.mismatchCount',
      ]),
    );
    expect(countViolations.every((entry) => entry.path.startsWith('$.result'))).toBe(true);
  });

  it('closes and validates every sign count', () => {
    const result = validOrientationResult();
    result.signCounts = { negative: 0, zero: -1, positive: 4, extra: 0 };
    const found = violations(result);
    expect(found).toContainEqual({
      path: '$.result.signCounts.extra',
      message: 'field is not declared',
    });
    expect(found).toContainEqual({
      path: '$.result.signCounts.zero',
      message: 'must be a non-negative safe integer',
    });
  });

  it('enforces filter, sign, mismatch, and oracle-agreement invariants', () => {
    const badFilterSum = validOrientationResult();
    badFilterSum.fastFilterCount = 2;
    expect(violations(badFilterSum).map((entry) => entry.path)).toContain(
      '$.result.comparisonCount',
    );

    const badSignSum = validOrientationResult();
    badSignSum.signCounts = { negative: 0, zero: 0, positive: 2 };
    expect(violations(badSignSum).map((entry) => entry.path)).toContain('$.result.signCounts');

    const tooManyMismatches = validOrientationResult();
    tooManyMismatches.mismatchCount = 4;
    tooManyMismatches.oracleAgreement = false;
    expect(violations(tooManyMismatches).map((entry) => entry.path)).toContain(
      '$.result.mismatchCount',
    );

    const falsePositiveAgreement = validOrientationResult();
    falsePositiveAgreement.mismatchCount = 1;
    expect(violations(falsePositiveAgreement).map((entry) => entry.path)).toContain(
      '$.result.oracleAgreement',
    );

    const falseNegativeAgreement = validOrientationResult();
    falseNegativeAgreement.oracleAgreement = false;
    expect(violations(falseNegativeAgreement).map((entry) => entry.path)).toContain(
      '$.result.oracleAgreement',
    );
  });

  it('delegates the complete FOLD reconstruction result to its runtime parser', () => {
    const valid = validFoldResult();
    expect(
      validateCompletedExperimentResult(FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID, valid),
    ).toEqual({ ok: true });

    const mutated = structuredClone(valid) as Record<string, unknown>;
    mutated.extra = true;
    const rejected = validateCompletedExperimentResult(
      FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
      mutated,
    );
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new Error('expected FOLD result rejection');
    expect(rejected.violations.some((entry) => entry.path === '$.result.extra')).toBe(true);
    expect(rejected.violations.every((entry) => entry.path.startsWith('$.result'))).toBe(true);
    expect(Object.isFrozen(rejected)).toBe(true);
    expect(Object.isFrozen(rejected.violations)).toBe(true);
  });

  it('uses $.result for malformed known-result roots', () => {
    const numeric = validateCompletedExperimentResult(
      NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID,
      null,
    );
    const fold = validateCompletedExperimentResult(FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID, null);
    expect(numeric).toEqual({
      ok: false,
      violations: [{ path: '$.result', message: 'must be an object' }],
    });
    expect(fold.ok).toBe(false);
    if (fold.ok) throw new Error('expected malformed FOLD result rejection');
    expect(fold.violations.every((entry) => entry.path.startsWith('$.result'))).toBe(true);
  });

  it('strictly closes the face-complex audit result and validates every topology counter', () => {
    expect(
      validateCompletedExperimentResult(FACE_COMPLEX_AUDIT_EXPERIMENT_ID, validFaceAuditResult()),
    ).toEqual({ ok: true });

    const malformed = validFaceAuditResult();
    malformed.extra = true;
    const topology = malformed.topology as Record<string, unknown>;
    topology.sourceVertexCount = -1;
    topology.sourceEdgeCount = 2;
    topology.planarVertexCount = 8.5;
    topology.planarEdgeCount = Number.MAX_SAFE_INTEGER + 1;
    topology.boundedFaceCount = 0;
    topology.triangleCount = -1;
    topology.createdIntersectionVertexCount = -1;
    topology.nonDyadicVertexCount = -1;
    topology.eulerValue = 2;
    topology.extra = 1;
    const rejected = validateCompletedExperimentResult(FACE_COMPLEX_AUDIT_EXPERIMENT_ID, malformed);
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new Error('malformed face audit result must fail');
    expect(rejected.violations.map((entry) => entry.path)).toEqual(
      expect.arrayContaining([
        '$.result.extra',
        '$.result.topology.extra',
        '$.result.topology.sourceVertexCount',
        '$.result.topology.sourceEdgeCount',
        '$.result.topology.planarVertexCount',
        '$.result.topology.planarEdgeCount',
        '$.result.topology.boundedFaceCount',
        '$.result.topology.createdIntersectionVertexCount',
        '$.result.topology.nonDyadicVertexCount',
        '$.result.topology.eulerValue',
      ]),
    );
    expect(Object.isFrozen(rejected)).toBe(true);
    expect(Object.isFrozen(rejected.violations)).toBe(true);
  });

  it('enforces face-complex topology relationships and fixed literals', () => {
    const malformed = validFaceAuditResult();
    malformed.auditOutcome = 'uncertain';
    const topology = malformed.topology as Record<string, unknown>;
    topology.planarVertexCount = 9;
    topology.planarEdgeCount = 8;
    topology.createdIntersectionVertexCount = 1;
    topology.nonDyadicVertexCount = 2;
    topology.triangleCount = 3;
    const rejected = validateCompletedExperimentResult(FACE_COMPLEX_AUDIT_EXPERIMENT_ID, malformed);
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new Error('inconsistent counters must fail');
    expect(rejected.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '$.result.auditOutcome' }),
        expect.objectContaining({
          path: '$.result.topology.createdIntersectionVertexCount',
        }),
        expect.objectContaining({ path: '$.result.topology.nonDyadicVertexCount' }),
        expect.objectContaining({ path: '$.result.topology.planarEdgeCount' }),
        expect.objectContaining({ path: '$.result.topology.triangleCount' }),
        expect.objectContaining({ path: '$.result.topology.eulerValue' }),
      ]),
    );
  });

  it('passes unknown experiment IDs without inspecting custom result payloads', () => {
    const hostile = {
      get value(): never {
        throw new Error('custom registry owns this result contract');
      },
    };
    expect(validateCompletedExperimentResult('custom.example-v1', hostile)).toEqual({ ok: true });
  });
});
