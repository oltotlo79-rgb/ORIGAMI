import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import {
  EXPERIMENT_RESULT_SCHEMA_ID,
  FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
  FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
  NUMERIC_KERNEL_ORIENTATION_ENGINE_VERSION,
  NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID,
  canonicalExperimentSemanticHashV1,
  createCandidateExperimentRecordV1,
  createCandidateExperimentRegistry,
  parseCandidateExperimentRecordV1,
  runCandidateExperimentV1,
  type CandidateExperimentDefinition,
  type CandidateExperimentRecordV1,
  type CandidateExperimentRequestV1,
} from '../../m0f/experiments/index.js';
import { stableStringify, type JsonValue } from '../../m0f/stable-json.js';

function orientationRequest(
  overrides: Partial<CandidateExperimentRequestV1> = {},
): CandidateExperimentRequestV1 {
  return {
    experimentId: NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID,
    engineVersion: NUMERIC_KERNEL_ORIENTATION_ENGINE_VERSION,
    parameters: { fastFilterArea: 0 },
    input: {
      samples: [
        { a: { x: 0, y: 0 }, b: { x: 2, y: 0 }, c: { x: 0, y: 1 } },
        { a: { x: 0, y: 0 }, b: { x: 1, y: 1 }, c: { x: 2, y: 2 } },
        {
          a: { x: 0, y: 0 },
          b: { x: 1, y: 1 },
          c: { x: 2, y: 2.0000000000000004 },
        },
      ],
    },
    seed: 0x4f52_4947,
    repetition: 0,
    ...overrides,
  };
}

function customDefinition(
  overrides: Partial<CandidateExperimentDefinition>,
): CandidateExperimentDefinition {
  return {
    contractStatus: 'candidate',
    scientificClaim: false,
    experimentId: 'test.runner-v1',
    engineVersion: 'test-runner/1.0.0-candidate',
    execute: () => ({ outcome: 'completed', result: { value: 1 } }),
    ...overrides,
  };
}

function customRequest(
  definition: CandidateExperimentDefinition,
  overrides: Partial<CandidateExperimentRequestV1> = {},
): CandidateExperimentRequestV1 {
  return {
    experimentId: definition.experimentId,
    engineVersion: definition.engineVersion,
    parameters: {},
    input: {},
    seed: 7,
    repetition: 2,
    ...overrides,
  };
}

describe('M0F-1A candidate experiment runner', () => {
  it('compares the filtered orientation result with the exact oracle', async () => {
    const record = await runCandidateExperimentV1(orientationRequest());

    expect(record).toMatchObject({
      schemaVersion: 1,
      schemaId: EXPERIMENT_RESULT_SCHEMA_ID,
      recordType: 'm0f-experiment-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      experimentId: NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID,
      engineVersion: NUMERIC_KERNEL_ORIENTATION_ENGINE_VERSION,
      seed: 0x4f52_4947,
      repetition: 0,
      outcome: 'completed',
      reasonCode: null,
      result: {
        comparisonCount: 3,
        fastFilterCount: 1,
        exactFallbackCount: 2,
        mismatchCount: 0,
        oracleAgreement: true,
        signCounts: { negative: 0, zero: 1, positive: 2 },
      },
    });
    expect(record.parameterHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(record.inputHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(record.semanticHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.result)).toBe(true);
  });

  it('reproduces semantic hashes without time or elapsed-time fields', async () => {
    const first = await runCandidateExperimentV1(orientationRequest());
    const reordered = orientationRequest({
      parameters: { fastFilterArea: 0 },
      input: {
        samples: [
          { c: { y: 1, x: 0 }, b: { y: 0, x: 2 }, a: { y: 0, x: 0 } },
          { c: { y: 2, x: 2 }, b: { y: 1, x: 1 }, a: { y: 0, x: 0 } },
          {
            c: { y: 2.0000000000000004, x: 2 },
            b: { y: 1, x: 1 },
            a: { y: 0, x: 0 },
          },
        ],
      },
    });
    const second = await runCandidateExperimentV1(reordered);

    expect(second).toEqual(first);
    const serialized = stableStringify(first);
    expect(serialized).not.toMatch(/startedAt|timestamp|duration|elapsed/i);

    const nextRepetition = await runCandidateExperimentV1(orientationRequest({ repetition: 1 }));
    expect(nextRepetition.parameterHash).toBe(first.parameterHash);
    expect(nextRepetition.inputHash).toBe(first.inputHash);
    expect(nextRepetition.semanticHash).not.toBe(first.semanticHash);
  });

  it('hashes and executes the same captured request snapshot', async () => {
    const request = orientationRequest() as CandidateExperimentRequestV1 & Record<string, unknown>;
    let reads = 0;
    Object.defineProperty(request, 'parameters', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? { fastFilterArea: 0 } : { fastFilterArea: Number.NaN };
      },
    });
    const record = await runCandidateExperimentV1(request);
    expect(record.outcome).toBe('completed');
    expect(reads).toBe(1);
  });

  it('fails closed for unknown IDs and engine-version mismatches', async () => {
    const unknown = await runCandidateExperimentV1(
      orientationRequest({ experimentId: 'numeric-kernel.unknown-v1' }),
    );
    expect(unknown).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.unknown-id',
      result: null,
      contractStatus: 'candidate',
      scientificClaim: false,
    });

    const mismatch = await runCandidateExperimentV1(
      orientationRequest({ engineVersion: 'oridesign-orientation2d/2.0.0-candidate' }),
    );
    expect(mismatch.reasonCode).toBe('experiment.engine-version-mismatch');
  });

  it('rejects non-finite and non-JSON request values before engine execution', async () => {
    const nonFinite = await runCandidateExperimentV1(
      orientationRequest({ parameters: { fastFilterArea: Number.NaN } }),
    );
    expect(nonFinite).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.request.non-finite-number',
      parameterHash: null,
    });
    expect(nonFinite.inputHash).toMatch(/^sha256:/);

    const invalidJson = await runCandidateExperimentV1(
      orientationRequest({ input: { callback: () => true } }),
    );
    expect(invalidJson).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.request.invalid-json',
      inputHash: null,
    });

    const invalidNumericInput = await runCandidateExperimentV1(
      orientationRequest({ input: { samples: [] } }),
    );
    expect(invalidNumericInput.reasonCode).toBe('experiment.numeric-kernel.invalid-input');
  });

  it('classifies engine exceptions and cancellation without serializing exception text', async () => {
    const throwing = customDefinition({
      execute: () => {
        throw new Error('host-specific secret exception');
      },
    });
    const exceptionRecord = await runCandidateExperimentV1(
      customRequest(throwing),
      createCandidateExperimentRegistry([throwing]),
    );
    expect(exceptionRecord.reasonCode).toBe('experiment.execution.exception');
    expect(stableStringify(exceptionRecord)).not.toContain('host-specific');

    const controller = new AbortController();
    controller.abort('host-specific cancellation detail');
    const cancelled = await runCandidateExperimentV1(
      orientationRequest({ signal: controller.signal }),
    );
    expect(cancelled.reasonCode).toBe('experiment.execution.cancelled');
    expect(stableStringify(cancelled)).not.toContain('host-specific');
  });

  it('checks cancellation after asynchronous engine work', async () => {
    const controller = new AbortController();
    const cancellable = customDefinition({
      execute: async (_parameters, _input, context) => {
        await Promise.resolve();
        controller.abort();
        context.checkpoint();
        return { outcome: 'completed', result: { unreachable: true } };
      },
    });
    const record = await runCandidateExperimentV1(
      customRequest(cancellable, { signal: controller.signal }),
      createCandidateExperimentRegistry([cancellable]),
    );
    expect(record.reasonCode).toBe('experiment.execution.cancelled');
  });

  it('rejects non-finite or malformed engine results', async () => {
    const nonFinite = customDefinition({
      execute: () => ({
        outcome: 'completed',
        result: { value: Number.POSITIVE_INFINITY } as unknown as JsonValue,
      }),
    });
    const nonFiniteRecord = await runCandidateExperimentV1(
      customRequest(nonFinite),
      createCandidateExperimentRegistry([nonFinite]),
    );
    expect(nonFiniteRecord.reasonCode).toBe('experiment.result.non-finite-number');

    const malformed = customDefinition({
      execute: (() => ({ outcome: 'completed', result: { value: 1 }, extra: true })) as (
        ...args: Parameters<CandidateExperimentDefinition['execute']>
      ) => ReturnType<CandidateExperimentDefinition['execute']>,
    });
    const malformedRecord = await runCandidateExperimentV1(
      customRequest(malformed),
      createCandidateExperimentRegistry([malformed]),
    );
    expect(malformedRecord.reasonCode).toBe('experiment.result.invalid-json');
  });

  it('rejects malformed completed payloads reserved by built-in experiment IDs', async () => {
    const malformedNumeric = customDefinition({
      experimentId: NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID,
      engineVersion: NUMERIC_KERNEL_ORIENTATION_ENGINE_VERSION,
      execute: () => ({
        outcome: 'completed',
        result: {
          comparisonCount: 3,
          fastFilterCount: 3,
          exactFallbackCount: 3,
          mismatchCount: 0,
          oracleAgreement: true,
          signCounts: { negative: 0, zero: 1, positive: 2 },
        },
      }),
    });
    const numericRecord = await runCandidateExperimentV1(
      orientationRequest(),
      createCandidateExperimentRegistry([malformedNumeric]),
    );
    expect(numericRecord).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.result.invalid-json',
      result: null,
    });

    const malformedFaces = customDefinition({
      experimentId: FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
      engineVersion: FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
      execute: () => ({
        outcome: 'completed',
        result: { contractStatus: 'candidate', scientificClaim: false },
      }),
    });
    const faceRecord = await runCandidateExperimentV1(
      customRequest(malformedFaces),
      createCandidateExperimentRegistry([malformedFaces]),
    );
    expect(faceRecord).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.result.invalid-json',
      result: null,
    });
  });

  it('enforces candidate-only registry definitions at runtime', () => {
    const forged = {
      ...customDefinition({}),
      contractStatus: 'verified',
      scientificClaim: true,
    } as unknown as CandidateExperimentDefinition;
    expect(() => createCandidateExperimentRegistry([forged])).toThrow(/candidate-only/);
  });

  it('captures accessor-backed registry definitions exactly once', () => {
    const supplied = customDefinition({}) as CandidateExperimentDefinition &
      Record<string, unknown>;
    let reads = 0;
    Object.defineProperty(supplied, 'scientificClaim', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? false : true;
      },
    });
    const registry = createCandidateExperimentRegistry([supplied]);
    expect(registry.resolve(supplied.experimentId)?.scientificClaim).toBe(false);
    expect(reads).toBe(1);
  });
});

describe('M0F-1A experiment result contract', () => {
  it('rejects forged claims and semantic changes at runtime', async () => {
    const valid = await runCandidateExperimentV1(orientationRequest());
    const parsed = await parseCandidateExperimentRecordV1(valid);
    expect(parsed.ok).toBe(true);

    const claimed = { ...valid, contractStatus: 'verified', scientificClaim: true };
    const claimResult = await parseCandidateExperimentRecordV1(claimed);
    expect(claimResult.ok).toBe(false);
    if (claimResult.ok) throw new Error('forged claim must be rejected');
    expect(claimResult.error.some((entry) => entry.code === 'claim-boundary')).toBe(true);

    const changed = { ...valid, repetition: 9 };
    const changedResult = await parseCandidateExperimentRecordV1(changed);
    expect(changedResult.ok).toBe(false);
    if (changedResult.ok) throw new Error('changed semantics must invalidate the hash');
    expect(changedResult.error.map((entry) => entry.code)).toContain('semantic-hash-mismatch');
  });

  it('validates one owned snapshot and rejects runtime Omit bypasses', async () => {
    const valid = await runCandidateExperimentV1(orientationRequest());
    const raw = structuredClone(valid) as CandidateExperimentRecordV1 & Record<string, unknown>;
    let reads = 0;
    Object.defineProperty(raw, 'scientificClaim', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? false : true;
      },
    });
    const parsed = await parseCandidateExperimentRecordV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('snapshot must parse');
    expect(parsed.value.scientificClaim).toBe(false);
    expect(reads).toBe(1);

    const omitBypass = await createCandidateExperimentRecordV1({
      experimentId: valid.experimentId,
      engineVersion: valid.engineVersion,
      parameterHash: valid.parameterHash,
      inputHash: valid.inputHash,
      seed: valid.seed,
      repetition: valid.repetition,
      outcome: 'completed',
      reasonCode: null,
      result: valid.result,
      scientificClaim: true,
      contractStatus: 'verified',
    } as never);
    expect(omitBypass.contractStatus).toBe('candidate');
    expect(omitBypass.scientificClaim).toBe(false);
  });

  it('rejects nested product claims from engines, record creation, and persisted records', async () => {
    const claimEngine = customDefinition({
      execute: () => ({
        outcome: 'completed',
        result: { contractStatus: 'verified', scientificClaim: true },
      }),
    });
    const registry = createCandidateExperimentRegistry([claimEngine]);
    const run = await runCandidateExperimentV1(customRequest(claimEngine), registry);
    expect(run).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.result.claim-boundary',
      result: null,
    });

    const valid = await runCandidateExperimentV1(orientationRequest());
    await expect(
      createCandidateExperimentRecordV1({
        experimentId: valid.experimentId,
        engineVersion: valid.engineVersion,
        parameterHash: valid.parameterHash,
        inputHash: valid.inputHash,
        seed: valid.seed,
        repetition: valid.repetition,
        outcome: 'completed',
        reasonCode: null,
        result: { nested: { status: 'no-solution-certified' } },
      }),
    ).rejects.toThrow(/invalid candidate experiment semantics: claim-boundary/);

    const mutated = structuredClone(valid) as unknown as Record<string, unknown>;
    mutated.result = { contractStatus: 'verified', scientificClaim: true };
    const reparsed = await parseCandidateExperimentRecordV1(mutated);
    expect(reparsed.ok).toBe(false);
    if (reparsed.ok) return;
    expect(reparsed.error.map((entry) => entry.code)).toContain('claim-boundary');
  });

  it('revalidates built-in payload semantics even when a persisted hash was recomputed', async () => {
    const valid = await runCandidateExperimentV1(orientationRequest());
    const forged = structuredClone(valid) as unknown as Record<string, unknown> & {
      result: { comparisonCount: number };
    };
    forged.result.comparisonCount = 999;
    forged.semanticHash = await canonicalExperimentSemanticHashV1(
      forged as unknown as CandidateExperimentRecordV1,
    );

    const parsed = await parseCandidateExperimentRecordV1(forged);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new Error('known payload invariants must be rechecked');
    expect(parsed.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '$.result.comparisonCount', code: 'invalid-value' }),
        expect.objectContaining({ path: '$.result.signCounts', code: 'invalid-value' }),
      ]),
    );

    await expect(
      createCandidateExperimentRecordV1({
        experimentId: valid.experimentId,
        engineVersion: valid.engineVersion,
        parameterHash: valid.parameterHash,
        inputHash: valid.inputHash,
        seed: valid.seed,
        repetition: valid.repetition,
        outcome: 'completed',
        reasonCode: null,
        result: forged.result,
      }),
    ).rejects.toThrow(/invalid candidate experiment semantics: invalid-value/);
  });

  it('strictly compiles the schema and validates success and failure records', async () => {
    const schema = JSON.parse(
      await readFile(resolve('m0f/schemas/experiment-result-v1.schema.json'), 'utf8'),
    ) as object;
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    const validate = ajv.compile<CandidateExperimentRecordV1>(schema);
    const success = await runCandidateExperimentV1(orientationRequest());
    const failure = await runCandidateExperimentV1(
      orientationRequest({ experimentId: 'numeric-kernel.unknown-v1' }),
    );

    expect(validate(success), JSON.stringify(validate.errors)).toBe(true);
    expect(validate(failure), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...success, scientificClaim: true })).toBe(false);
    expect(
      validate({ ...success, result: { contractStatus: 'verified', scientificClaim: true } }),
    ).toBe(false);
    expect(validate({ ...success, result: { status: 'verified' } })).toBe(false);
    expect(validate({ ...success, elapsedMs: 1 })).toBe(false);
  });
});
