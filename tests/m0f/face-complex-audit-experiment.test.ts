import { describe, expect, it } from 'vitest';

import { DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST } from '../../m0f/experiment-cli.js';
import {
  FACE_COMPLEX_AUDIT_ENGINE_VERSION,
  FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
  FACE_COMPLEX_AUDIT_PARAMETERS_V1,
} from '../../m0f/experiments/face-complex-audit.js';
import {
  canonicalExperimentSemanticHashV1,
  createCandidateExperimentRegistry,
  parseCandidateExperimentRecordV1,
  type CandidateExperimentDefinition,
  type CandidateExperimentRecordV1,
} from '../../m0f/experiments/contract.js';
import {
  DEFAULT_CANDIDATE_EXPERIMENT_REGISTRY,
  runCandidateExperimentV1,
} from '../../m0f/experiments/runner.js';

function mutableAuditInput(): Record<string, unknown> {
  return structuredClone(DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST.input) as Record<
    string,
    unknown
  >;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('test value must be an object');
  }
  return value as Record<string, unknown>;
}

describe('candidate independent face-complex audit experiment', () => {
  it('is registered and deterministically audits the fixed non-dyadic bundle', async () => {
    expect(DEFAULT_CANDIDATE_EXPERIMENT_REGISTRY.experimentIds).toContain(
      FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
    );
    expect(DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST).toMatchObject({
      experimentId: FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
      engineVersion: FACE_COMPLEX_AUDIT_ENGINE_VERSION,
      parameters: FACE_COMPLEX_AUDIT_PARAMETERS_V1,
      seed: 0x4d30_4634,
      repetition: 0,
    });
    expect(Object.isFrozen(DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST.input)).toBe(true);

    const first = await runCandidateExperimentV1(DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST);
    const second = await runCandidateExperimentV1(DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST);
    expect(second).toEqual(first);
    expect(first).toMatchObject({
      experimentId: FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
      engineVersion: FACE_COMPLEX_AUDIT_ENGINE_VERSION,
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      reasonCode: null,
      result: {
        recordType: 'm0f-face-complex-audit-result',
        contractStatus: 'candidate',
        scientificClaim: false,
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
      },
    });
  });

  it('maps parameter, input-contract, and consistency failures to fixed reason codes', async () => {
    const invalidParameters = await runCandidateExperimentV1({
      ...DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST,
      parameters: { coordinateKernel: 'homogeneous-projective-bigint' },
    });
    expect(invalidParameters).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.face-complex-audit.invalid-parameters',
      result: null,
    });

    const invalidContract = await runCandidateExperimentV1({
      ...DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST,
      input: { contractStatus: 'candidate', scientificClaim: false },
    });
    expect(invalidContract).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.face-complex-audit.invalid-contract',
      result: null,
    });

    const inconsistentInput = mutableAuditInput();
    const topology = record(record(inconsistentInput.artifact).topology);
    topology.triangleCount = 999;
    const inconsistent = await runCandidateExperimentV1({
      ...DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST,
      input: inconsistentInput,
    });
    expect(inconsistent).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.face-complex-audit.inconsistent',
      result: null,
    });
  });

  it('rejects malformed built-in results at execution and persisted-record boundaries', async () => {
    const malformedDefinition: CandidateExperimentDefinition = Object.freeze({
      contractStatus: 'candidate',
      scientificClaim: false,
      experimentId: FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
      engineVersion: FACE_COMPLEX_AUDIT_ENGINE_VERSION,
      execute: () => ({
        outcome: 'completed' as const,
        result: {
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
            createdIntersectionVertexCount: 2,
            nonDyadicVertexCount: 1,
            eulerValue: 1,
          },
        },
      }),
    });
    const malformedRun = await runCandidateExperimentV1(
      DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST,
      createCandidateExperimentRegistry([malformedDefinition]),
    );
    expect(malformedRun).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.result.invalid-json',
      result: null,
    });

    const valid = await runCandidateExperimentV1(DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST);
    const forged = structuredClone(valid) as unknown as Record<string, unknown>;
    record(record(forged.result).topology).nonDyadicVertexCount = 2;
    forged.semanticHash = await canonicalExperimentSemanticHashV1(
      forged as unknown as CandidateExperimentRecordV1,
    );
    const parsed = await parseCandidateExperimentRecordV1(forged);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new Error('malformed persisted audit result must fail');
    expect(parsed.error).toContainEqual(
      expect.objectContaining({
        path: '$.result.topology.nonDyadicVertexCount',
        code: 'invalid-value',
      }),
    );
  });
});
