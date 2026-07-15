import { describe, expect, it } from 'vitest';

import {
  runCandidateExperimentCli,
  runDefaultCandidateExperimentCli,
  runDefaultFaceComplexAuditExperimentCli,
  runDefaultFaceReconstructionExperimentCli,
  runDefaultSquareGridQuantizationExperimentCli,
} from '../../m0f/experiment-cli.js';
import { parseCandidateExperimentRecordV1 } from '../../m0f/experiments/index.js';

describe('M0F candidate experiment CLI', () => {
  it('emits the same one-line candidate record on every run', async () => {
    const firstOutput: string[] = [];
    const secondOutput: string[] = [];
    const errors: string[] = [];
    const firstCode = await runDefaultCandidateExperimentCli({
      stdout: (text) => firstOutput.push(text),
      stderr: (text) => errors.push(text),
    });
    const secondCode = await runDefaultCandidateExperimentCli({
      stdout: (text) => secondOutput.push(text),
      stderr: (text) => errors.push(text),
    });

    expect(firstCode).toBe(0);
    expect(secondCode).toBe(0);
    expect(errors).toEqual([]);
    expect(firstOutput).toEqual(secondOutput);
    expect(firstOutput).toHaveLength(1);
    expect(firstOutput[0]?.endsWith('\n')).toBe(true);

    const parsed = await parseCandidateExperimentRecordV1(JSON.parse(firstOutput[0] ?? ''));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('CLI record must parse');
    expect(parsed.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      reasonCode: null,
    });
  });

  it('runs the fixed non-dyadic face reconstruction experiment explicitly', async () => {
    const output: string[] = [];
    const errors: string[] = [];
    const code = await runDefaultFaceReconstructionExperimentCli({
      stdout: (text) => output.push(text),
      stderr: (text) => errors.push(text),
    });
    expect(code).toBe(0);
    expect(errors).toEqual([]);
    const parsed = await parseCandidateExperimentRecordV1(JSON.parse(output[0] ?? ''));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toMatchObject({
      experimentId: 'geometry.fold-face-reconstruction-v1',
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      result: {
        topology: {
          boundedFaceCount: 4,
          triangleCount: 7,
          nonDyadicVertexCount: 1,
        },
      },
    });
  });

  it('runs the fixed face-complex audit experiment explicitly and deterministically', async () => {
    const firstOutput: string[] = [];
    const secondOutput: string[] = [];
    const errors: string[] = [];
    const firstCode = await runDefaultFaceComplexAuditExperimentCli({
      stdout: (text) => firstOutput.push(text),
      stderr: (text) => errors.push(text),
    });
    const secondCode = await runCandidateExperimentCli(['--face-complex-audit'], {
      stdout: (text) => secondOutput.push(text),
      stderr: (text) => errors.push(text),
    });
    expect(firstCode).toBe(0);
    expect(secondCode).toBe(0);
    expect(errors).toEqual([]);
    expect(secondOutput).toEqual(firstOutput);
    expect(firstOutput).toHaveLength(1);
    const parsed = await parseCandidateExperimentRecordV1(JSON.parse(firstOutput[0] ?? ''));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toMatchObject({
      experimentId: 'geometry.fold-face-complex-audit-v1',
      engineVersion: 'oridesign-independent-face-complex-auditor/1.0.0-candidate',
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      reasonCode: null,
      result: {
        auditOutcome: 'consistent',
        topology: {
          boundedFaceCount: 4,
          nonDyadicVertexCount: 1,
        },
      },
    });
  });

  it('runs the fixed square-grid quantization experiment explicitly and deterministically', async () => {
    const firstOutput: string[] = [];
    const secondOutput: string[] = [];
    const errors: string[] = [];
    const firstCode = await runDefaultSquareGridQuantizationExperimentCli({
      stdout: (text) => firstOutput.push(text),
      stderr: (text) => errors.push(text),
    });
    const secondCode = await runCandidateExperimentCli(['--square-grid-quantization'], {
      stdout: (text) => secondOutput.push(text),
      stderr: (text) => errors.push(text),
    });
    expect(firstCode).toBe(0);
    expect(secondCode).toBe(0);
    expect(errors).toEqual([]);
    expect(secondOutput).toEqual(firstOutput);
    expect(firstOutput).toHaveLength(1);
    const parsed = await parseCandidateExperimentRecordV1(JSON.parse(firstOutput[0] ?? ''));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toMatchObject({
      experimentId: 'box-pleating.square-grid-quantization-v1',
      engineVersion: 'oridesign-square-grid-quantization/1.0.0-candidate',
      seed: 0x4d30_4632,
      repetition: 0,
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      reasonCode: null,
      result: {
        scope: 'square-grid-quantization-only',
        placementIncluded: false,
        pleatRoutingIncluded: false,
      },
    });
  });

  it('rejects unknown CLI arguments without running an experiment', async () => {
    const output: string[] = [];
    const errors: string[] = [];
    const code = await runCandidateExperimentCli(['--unknown'], {
      stdout: (text) => output.push(text),
      stderr: (text) => errors.push(text),
    });
    expect(code).toBe(2);
    expect(output).toEqual([]);
    expect(errors).toEqual([
      'usage: npm run m0f:experiment [-- --square-grid-quantization|--face-reconstruction|--face-complex-audit]\n',
    ]);
  });
});
