import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DEFAULT_SQUARE_GRID_QUANTIZATION_EXPERIMENT_REQUEST } from '../../m0f/experiment-cli.js';
import { SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/square-grid-candidates.js';
import {
  canonicalExperimentSemanticHashV1,
  createCandidateExperimentRegistry,
  EXPERIMENT_REASON_CODES,
  parseCandidateExperimentRecordV1,
  type CandidateExperimentDefinition,
  type CandidateExperimentRecordV1,
} from '../../m0f/experiments/contract.js';
import {
  DEFAULT_CANDIDATE_EXPERIMENT_REGISTRY,
  runCandidateExperimentV1,
} from '../../m0f/experiments/runner.js';
import {
  SQUARE_GRID_QUANTIZATION_ENGINE_VERSION,
  SQUARE_GRID_QUANTIZATION_EXPERIMENT,
  SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
  SQUARE_GRID_QUANTIZATION_PARAMETERS_V1,
} from '../../m0f/experiments/square-grid-quantization.js';
import { validateCompletedExperimentResult } from '../../m0f/experiments/result-validation.js';
import { SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS } from '../../m0f/experiments/square-grid-result-validation.js';

function input(
  overrides: Partial<{
    paper: { width: number; height: number };
    maxColumns: number;
    maxRows: number;
    relativeErrorLimit: number;
    branches: { id: string; branchClass: 'terminal' | 'internal'; length: number; width: number }[];
  }> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: { width: 1, height: 1 },
    maxColumns: 4,
    maxRows: 4,
    relativeErrorLimit: 0.01,
    branches: [{ id: 'branch-a', branchClass: 'terminal', length: 1, width: 0 }],
    ...overrides,
  };
}

function request(
  inputValue: unknown,
  parameters: unknown = SQUARE_GRID_QUANTIZATION_PARAMETERS_V1,
) {
  return {
    experimentId: SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
    engineVersion: SQUARE_GRID_QUANTIZATION_ENGINE_VERSION,
    parameters,
    input: inputValue,
    seed: 0x4d30_4632,
    repetition: 0,
  } as const;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('test value must be an object');
  }
  return value as Record<string, unknown>;
}

describe('candidate square-grid quantization experiment', () => {
  it('is registered and emits a deterministic, closed no-placement result', async () => {
    expect(DEFAULT_CANDIDATE_EXPERIMENT_REGISTRY.experimentIds).toContain(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
    );
    expect(DEFAULT_SQUARE_GRID_QUANTIZATION_EXPERIMENT_REQUEST).toMatchObject({
      experimentId: SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      engineVersion: SQUARE_GRID_QUANTIZATION_ENGINE_VERSION,
      parameters: SQUARE_GRID_QUANTIZATION_PARAMETERS_V1,
      seed: 0x4d30_4632,
      repetition: 0,
    });
    const first = await runCandidateExperimentV1(
      DEFAULT_SQUARE_GRID_QUANTIZATION_EXPERIMENT_REQUEST,
    );
    const second = await runCandidateExperimentV1(
      DEFAULT_SQUARE_GRID_QUANTIZATION_EXPERIMENT_REQUEST,
    );
    expect(second).toEqual(first);
    expect(first).toMatchObject({
      experimentId: SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      engineVersion: SQUARE_GRID_QUANTIZATION_ENGINE_VERSION,
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      reasonCode: null,
      result: {
        recordType: 'm0f-square-grid-candidate-result',
        contractStatus: 'candidate',
        scientificClaim: false,
        scope: 'square-grid-quantization-only',
        placementIncluded: false,
        pleatRoutingIncluded: false,
      },
    });
    const result = record(first.result);
    expect(Array.isArray(result.candidates)).toBe(true);
    expect((result.candidates as unknown[]).length).toBeGreaterThan(0);
  });

  it('maps closed-parameter and input failures to distinct fixed reason codes', async () => {
    const invalidParameters = await runCandidateExperimentV1(
      request(input(), { ...SQUARE_GRID_QUANTIZATION_PARAMETERS_V1, placementIncluded: true }),
    );
    expect(invalidParameters).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.square-grid-quantization.invalid-parameters',
      result: null,
    });

    const invalidInput = await runCandidateExperimentV1(request({ ...input(), maxColumns: 0 }));
    expect(invalidInput).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.square-grid-quantization.invalid-input',
      result: {
        contractStatus: 'candidate',
        scientificClaim: false,
        issues: [expect.objectContaining({ path: '$.maxColumns', code: 'invalid-bound' })],
      },
    });
  });

  it('keeps reason-code schema synchronization and rejects exotic direct parameters', async () => {
    const schema = JSON.parse(
      await readFile(resolve('m0f/schemas/experiment-result-v1.schema.json'), 'utf8'),
    ) as { $defs: { reasonCode: { enum: string[] } } };
    expect(schema.$defs.reasonCode.enum).toEqual([...EXPERIMENT_REASON_CODES]);

    let getterCalls = 0;
    const parameters = { ...SQUARE_GRID_QUANTIZATION_PARAMETERS_V1 };
    Object.defineProperty(parameters, 'scope', {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return 'square-grid-quantization-only';
      },
    });
    const execution = await SQUARE_GRID_QUANTIZATION_EXPERIMENT.execute(parameters, input(), {
      seed: 0,
      repetition: 0,
      signal: undefined,
      checkpoint: () => undefined,
    });
    expect(execution).toEqual({
      outcome: 'failed',
      reasonCode: 'experiment.square-grid-quantization.invalid-parameters',
      result: null,
    });
    expect(getterCalls).toBe(0);
  });

  it('records an empty bounded candidate set as completed without a no-solution claim', async () => {
    const empty = await runCandidateExperimentV1(
      request(
        input({
          maxColumns: 1,
          maxRows: 1,
          relativeErrorLimit: 0,
          branches: [{ id: 'incompatible', branchClass: 'internal', length: 0.3, width: 0.2 }],
        }),
      ),
    );
    expect(empty).toMatchObject({
      outcome: 'completed',
      reasonCode: null,
      contractStatus: 'candidate',
      scientificClaim: false,
      result: {
        contractStatus: 'candidate',
        scientificClaim: false,
        placementIncluded: false,
        pleatRoutingIncluded: false,
        candidates: [],
      },
    });
    expect(JSON.stringify(empty)).not.toContain('no-solution');
    expect(JSON.stringify(empty)).not.toContain('verified');
  });

  it('rejects malformed built-in results at execution and persisted-record boundaries', async () => {
    const malformedDefinition: CandidateExperimentDefinition = Object.freeze({
      contractStatus: 'candidate',
      scientificClaim: false,
      experimentId: SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      engineVersion: SQUARE_GRID_QUANTIZATION_ENGINE_VERSION,
      execute: () => ({
        outcome: 'completed' as const,
        result: {
          schemaVersion: 1,
          recordType: 'm0f-square-grid-candidate-result',
          contractStatus: 'candidate',
          scientificClaim: false,
          scope: 'square-grid-quantization-only',
          placementIncluded: true,
          pleatRoutingIncluded: false,
          paper: {
            width: { numerator: '1', denominator: '1' },
            height: { numerator: '1', denominator: '1' },
          },
          enumerationBounds: { maxColumns: 1, maxRows: 1 },
          relativeErrorLimit: { numerator: '0', denominator: '1' },
          sourceBranches: [{ id: 'branch-a', branchClass: 'terminal', length: 1, width: 0 }],
          quantizationRule: 'nearest-integer-half-up',
          candidateOrder:
            'error-then-residual-area-then-cell-count-then-columns-then-rows-then-fit-axis',
          candidates: [],
        },
      }),
    });
    const malformedRun = await runCandidateExperimentV1(
      request(input()),
      createCandidateExperimentRegistry([malformedDefinition]),
    );
    expect(malformedRun).toMatchObject({
      outcome: 'failed',
      reasonCode: 'experiment.result.invalid-json',
      result: null,
    });

    const valid = await runCandidateExperimentV1(request(input()));
    const forged = structuredClone(valid) as unknown as Record<string, unknown>;
    record(forged.result).pleatRoutingIncluded = true;
    forged.semanticHash = await canonicalExperimentSemanticHashV1(
      forged as unknown as CandidateExperimentRecordV1,
    );
    const parsed = await parseCandidateExperimentRecordV1(forged);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new Error('malformed persisted quantization result must fail');
    expect(parsed.error).toContainEqual(
      expect.objectContaining({
        path: '$.result.pleatRoutingIncluded',
        code: 'invalid-value',
      }),
    );
  });

  it('recomputes exact half-up steps and bounds persisted BigInt/work surfaces', async () => {
    const valid = await runCandidateExperimentV1(
      DEFAULT_SQUARE_GRID_QUANTIZATION_EXPERIMENT_REQUEST,
    );
    const wrongSteps = structuredClone(valid.result);
    const firstCandidate = (record(wrongSteps).candidates as unknown[])[0];
    const firstBranch = (record(firstCandidate).branchQuantizations as unknown[])[0];
    record(record(firstBranch).length).steps = '999';
    const stepValidation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      wrongSteps,
    );
    expect(stepValidation.ok).toBe(false);
    if (stepValidation.ok) throw new Error('forged steps must fail');
    expect(stepValidation.violations).toContainEqual(
      expect.objectContaining({
        path: '$.result.candidates[0].branchQuantizations[0].length.steps',
        message: 'must equal exact nearest-integer-half-up quantization',
      }),
    );

    const oversizedInteger = structuredClone(valid.result);
    record(record(oversizedInteger).relativeErrorLimit).numerator = '1'.repeat(2049);
    const integerValidation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      oversizedInteger,
    );
    expect(integerValidation.ok).toBe(false);
    if (integerValidation.ok) throw new Error('oversized rational must fail');
    expect(integerValidation.violations).toContainEqual(
      expect.objectContaining({ path: '$.result.relativeErrorLimit.numerator' }),
    );

    const excessiveWorkSurface = structuredClone(valid.result);
    const workRoot = record(excessiveWorkSurface);
    workRoot.enumerationBounds = { maxColumns: 512, maxRows: 512 };
    const workCandidate = record((workRoot.candidates as unknown[])[0]);
    const branchTemplate = structuredClone(
      record((workCandidate.branchQuantizations as unknown[])[0]),
    );
    workCandidate.branchQuantizations = Array.from({ length: 65 }, (_, index) => ({
      ...structuredClone(branchTemplate),
      branchId: `branch-${String(index).padStart(3, '0')}`,
    }));
    const workValidation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      excessiveWorkSurface,
    );
    expect(workValidation.ok).toBe(false);
    if (workValidation.ok) throw new Error('excessive work surface must fail');
    expect(
      workValidation.violations.some(
        (violation) =>
          violation.path === '$.result.candidates[0].branchQuantizations' &&
          violation.message.includes('work-surface'),
      ),
    ).toBe(true);

    const excessiveSourceWorkSurface = structuredClone(valid.result);
    const sourceWorkRoot = record(excessiveSourceWorkSurface);
    sourceWorkRoot.enumerationBounds = { maxColumns: 512, maxRows: 512 };
    sourceWorkRoot.candidates = [];
    sourceWorkRoot.sourceBranches = Array.from({ length: 65 }, (_, index) => ({
      id: `branch-${String(index).padStart(3, '0')}`,
      branchClass: 'terminal',
      length: 1,
      width: 0,
    }));
    const sourceWorkValidation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      excessiveSourceWorkSurface,
    );
    expect(sourceWorkValidation.ok).toBe(false);
    if (sourceWorkValidation.ok) throw new Error('excessive source work surface must fail');
    expect(
      sourceWorkValidation.violations.some(
        (violation) =>
          violation.path === '$.result.sourceBranches' &&
          violation.message.includes('work-surface'),
      ),
    ).toBe(true);

    const oversizedCandidateId = structuredClone(valid.result);
    const idCandidate = (record(oversizedCandidateId).candidates as unknown[])[0];
    record(idCandidate).candidateId = 'x'.repeat(
      SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.candidateIdCodeUnits + 1,
    );
    const idValidation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      oversizedCandidateId,
    );
    expect(idValidation.ok).toBe(false);
    if (idValidation.ok) throw new Error('oversized candidate ID must fail');
    expect(idValidation.violations).toContainEqual(
      expect.objectContaining({ path: '$.result.candidates[0].candidateId' }),
    );

    const oversizedSnapshotString = structuredClone(valid.result);
    const snapshotCandidate = (record(oversizedSnapshotString).candidates as unknown[])[0];
    record(snapshotCandidate).candidateId = 'x'.repeat(
      SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotStringCodeUnits + 1,
    );
    expect(
      validateCompletedExperimentResult(
        SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
        oversizedSnapshotString,
      ),
    ).toMatchObject({
      ok: false,
      violations: [expect.objectContaining({ path: '$.result' })],
    });

    const oversizedSnapshotArray = structuredClone(valid.result);
    record(oversizedSnapshotArray).candidates = Array.from({ length: 1025 }, () => null);
    expect(
      validateCompletedExperimentResult(
        SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
        oversizedSnapshotArray,
      ),
    ).toMatchObject({
      ok: false,
      violations: [expect.objectContaining({ path: '$.result' })],
    });
  });

  it('rejects coherent non-maximal anchors, identity/order, and cross-candidate branch mutations', async () => {
    const valid = await runCandidateExperimentV1(
      DEFAULT_SQUARE_GRID_QUANTIZATION_EXPERIMENT_REQUEST,
    );
    if (valid.outcome !== 'completed')
      throw new Error('fixed quantization experiment must complete');

    const nonMaximal = structuredClone(valid.result);
    const candidates = record(nonMaximal).candidates as unknown[];
    const exactCandidate = candidates.find(
      (candidate) => record(candidate).candidateId === 'square-grid:6x4:xy:1/4',
    );
    if (exactCandidate === undefined) throw new Error('fixed 6x4 candidate is required');
    const forgedCandidate = record(exactCandidate);
    forgedCandidate.rows = 3;
    forgedCandidate.fitAxis = 'x';
    forgedCandidate.candidateId = 'square-grid:6x3:x:1/4';
    forgedCandidate.gridRegion = {
      width: { numerator: '3', denominator: '2' },
      height: { numerator: '3', denominator: '4' },
    };
    forgedCandidate.residualStrips = {
      xAxis: { numerator: '0', denominator: '1' },
      yAxis: { numerator: '1', denominator: '4' },
    };
    record(nonMaximal).candidates = [forgedCandidate];
    const nonMaximalValidation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      nonMaximal,
    );
    expect(nonMaximalValidation.ok).toBe(false);
    if (nonMaximalValidation.ok) throw new Error('non-maximal anchor must fail');
    expect(nonMaximalValidation.violations).toContainEqual({
      path: '$.result.candidates[0].rows',
      message: 'x-anchored candidates must use the largest bounded fitting row count',
    });

    const forgedRecord = structuredClone(valid) as unknown as Record<string, unknown>;
    forgedRecord.result = nonMaximal;
    forgedRecord.semanticHash = await canonicalExperimentSemanticHashV1(
      forgedRecord as unknown as CandidateExperimentRecordV1,
    );
    const persisted = await parseCandidateExperimentRecordV1(forgedRecord);
    expect(persisted.ok).toBe(false);
    if (persisted.ok) throw new Error('persisted non-maximal anchor must fail');
    expect(persisted.error).toContainEqual(
      expect.objectContaining({ path: '$.result.candidates[0].rows', code: 'invalid-value' }),
    );

    const wrongIdentity = structuredClone(valid.result);
    record((record(wrongIdentity).candidates as unknown[])[0]).candidateId = 'square-grid:1x1:xy:1';
    const identityValidation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      wrongIdentity,
    );
    expect(identityValidation.ok).toBe(false);
    if (identityValidation.ok) throw new Error('forged identity must fail');
    expect(identityValidation.violations).toContainEqual(
      expect.objectContaining({
        path: '$.result.candidates[0].candidateId',
        message: 'must match the canonical grid identity',
      }),
    );

    const wrongOrder = structuredClone(valid.result);
    record(wrongOrder).candidates = [...(record(wrongOrder).candidates as unknown[])].reverse();
    const orderValidation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      wrongOrder,
    );
    expect(orderValidation.ok).toBe(false);
    if (orderValidation.ok) throw new Error('forged candidate order must fail');
    expect(
      orderValidation.violations.some(
        (violation) => violation.message === 'must follow the declared canonical candidate order',
      ),
    ).toBe(true);

    const wrongBranchSet = structuredClone(valid.result);
    const secondCandidate = (record(wrongBranchSet).candidates as unknown[])[1];
    const firstBranch = (record(secondCandidate).branchQuantizations as unknown[])[0];
    record(firstBranch).branchId = 'internal-b';
    const branchValidation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      wrongBranchSet,
    );
    expect(branchValidation.ok).toBe(false);
    if (branchValidation.ok) throw new Error('cross-candidate branch mutation must fail');
    expect(branchValidation.violations).toContainEqual(
      expect.objectContaining({
        path: '$.result.candidates[1].branchQuantizations',
        message: 'all candidates must describe the same canonical branch input set',
      }),
    );

    const wrongSourceBranches = structuredClone(valid.result);
    const firstSourceBranch = (record(wrongSourceBranches).sourceBranches as unknown[])[0];
    record(firstSourceBranch).length = 0.625;
    const sourceValidation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      wrongSourceBranches,
    );
    expect(sourceValidation.ok).toBe(false);
    if (sourceValidation.ok) throw new Error('source/candidate branch mutation must fail');
    expect(sourceValidation.violations).toContainEqual(
      expect.objectContaining({
        path: '$.result.candidates[0].branchQuantizations',
        message: 'must match the declared canonical source branch set',
      }),
    );
  });

  it('rejects exotic completed payloads without invoking accessors', async () => {
    const valid = await runCandidateExperimentV1(
      DEFAULT_SQUARE_GRID_QUANTIZATION_EXPERIMENT_REQUEST,
    );
    const exotic = structuredClone(valid.result);
    let getterCalls = 0;
    Object.defineProperty(exotic, 'scope', {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return 'square-grid-quantization-only';
      },
    });
    const validation = validateCompletedExperimentResult(
      SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
      exotic,
    );
    expect(validation.ok).toBe(false);
    expect(getterCalls).toBe(0);
  });

  it('does not treat completed-result integrity validation as an enumeration-completeness proof', async () => {
    const valid = await runCandidateExperimentV1(
      DEFAULT_SQUARE_GRID_QUANTIZATION_EXPERIMENT_REQUEST,
    );
    const candidateSetRemoved = structuredClone(valid.result);
    record(candidateSetRemoved).candidates = [];
    expect(
      validateCompletedExperimentResult(
        SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
        candidateSetRemoved,
      ),
    ).toEqual({ ok: true });
    expect(JSON.stringify(candidateSetRemoved)).not.toContain('no-solution');
    expect(JSON.stringify(candidateSetRemoved)).not.toContain('verified');

    const coherentlyReducedBranchSet = structuredClone(valid.result);
    record(coherentlyReducedBranchSet).sourceBranches = (
      record(coherentlyReducedBranchSet).sourceBranches as unknown[]
    ).filter((branch) => record(branch).id === 'internal-a');
    for (const candidate of record(coherentlyReducedBranchSet).candidates as unknown[]) {
      const candidateRecord = record(candidate);
      candidateRecord.branchQuantizations = (
        candidateRecord.branchQuantizations as unknown[]
      ).filter((branch) => record(branch).branchId === 'internal-a');
    }
    expect(
      validateCompletedExperimentResult(
        SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID,
        coherentlyReducedBranchSet,
      ),
    ).toEqual({ ok: true });
    expect(JSON.stringify(coherentlyReducedBranchSet)).not.toContain('verified');
  });
});
