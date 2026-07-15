import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
  searchEuclideanNecessaryWitnessesV1,
  type EuclideanNecessaryWitnessSearchResultV1,
} from '../../m0f/box-pleating/euclidean-necessary-witness-search.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS,
  validateEuclideanNecessaryWitnessSearchResultV1,
  type EuclideanNecessaryWitnessSearchResultValidationV1,
} from '../../m0f/box-pleating/euclidean-necessary-witness-search-result-validation.js';
import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
import { enumerateOrderedTreeSquareGridCandidatesV1 } from '../../m0f/box-pleating/ordered-tree-square-grid-candidates.js';
import { BOX_PLEATING_PACKING_SEMANTICS_V1 } from '../../m0f/box-pleating/packing-semantics.js';
import { POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/polygon-river-packing-problem.js';
import { packingWorkerMaximalSource } from './polygon-river-packing-problem-worker-fixtures.js';

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T;

type JsonRecord = Record<string, unknown>;

interface MutableTree {
  schemaVersion: number;
  recordType: string;
  contractStatus: string;
  scientificClaim: boolean;
  nodes: {
    id: string;
    pos: { x: number; y: number };
    label: string;
    mirrorOf: string | null;
    onSymmetryAxis: boolean;
  }[];
  edges: {
    id: string;
    from: string;
    to: string;
    length: number;
    width: number;
    label: string;
    mirrorOf: string | null;
  }[];
  rotation: { nodeId: string; edgeIds: string[] }[];
}

function twoLeafSource(length: number, maxColumns = 2, relativeErrorLimit = 0): JsonRecord {
  const orderedTree: MutableTree = {
    schemaVersion: 1,
    recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes: [
      {
        id: 'leaf-a',
        pos: { x: 0, y: 0 },
        label: 'A',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: 'leaf-b',
        pos: { x: 1, y: 0 },
        label: 'B',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
    ],
    edges: [
      {
        id: 'edge-ab',
        from: 'leaf-a',
        to: 'leaf-b',
        length,
        width: 0,
        label: 'AB',
        mirrorOf: null,
      },
    ],
    rotation: [
      { nodeId: 'leaf-a', edgeIds: ['edge-ab'] },
      { nodeId: 'leaf-b', edgeIds: ['edge-ab'] },
    ],
  };
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree,
    paper: { width: 1, height: 1 },
    maxColumns,
    maxRows: maxColumns,
    relativeErrorLimit,
  };
}

function firstCandidateId(source: JsonRecord, columns?: number): string {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('test source must enumerate');
  const candidate =
    columns === undefined
      ? enumerated.value.quantization.candidates[0]
      : enumerated.value.quantization.candidates.find(
          (entry) => entry.columns === columns && entry.rows === columns,
        );
  if (candidate === undefined) throw new Error('test candidate must exist');
  return candidate.candidateId;
}

function searchInput(
  source: JsonRecord,
  maxVisitedStates: number,
  maxWitnesses: number,
  columns?: number,
): JsonRecord {
  return {
    schemaVersion: 1,
    recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    semantics: { ...BOX_PLEATING_PACKING_SEMANTICS_V1 },
    packingProblemInput: {
      schemaVersion: 1,
      recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      source,
      candidateId: firstCandidateId(source, columns),
    },
    maxVisitedStates,
    maxWitnesses,
  };
}

function completed(input: unknown): EuclideanNecessaryWitnessSearchResultV1 {
  const searched = searchEuclideanNecessaryWitnessesV1(input);
  if (!searched.ok) throw new Error('test search input must be valid');
  return searched.value;
}

function mutable(
  value: EuclideanNecessaryWitnessSearchResultV1,
): Mutable<EuclideanNecessaryWitnessSearchResultV1> {
  return structuredClone(value) as Mutable<EuclideanNecessaryWitnessSearchResultV1>;
}

function invalid(
  input: unknown,
  result: unknown,
): Extract<EuclideanNecessaryWitnessSearchResultValidationV1, { ok: false }> {
  const validated = validateEuclideanNecessaryWitnessSearchResultV1(input, result);
  expect(validated.ok).toBe(false);
  if (validated.ok) throw new Error('validation must fail');
  expect(validated).not.toHaveProperty('value');
  return validated;
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

function hugeStepSource(): JsonRecord {
  const source = twoLeafSource(Number.MAX_VALUE, 1);
  source.paper = { width: Number.MIN_VALUE, height: Number.MIN_VALUE };
  return source;
}

function maximalZeroDemandSource(): JsonRecord {
  const source = packingWorkerMaximalSource();
  const tree = source.orderedTree as MutableTree;
  for (const edge of tree.edges) {
    edge.length = Number.MIN_VALUE;
    edge.width = Number.MIN_VALUE;
  }
  source.maxColumns = 1;
  source.maxRows = 1;
  source.relativeErrorLimit = 1;
  return source;
}

describe('Euclidean necessary-witness completed-result independent validation', () => {
  it('publishes dedicated bounded response limits without a support claim', () => {
    expect(EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS).toEqual({
      maxArrayLength: 190,
      maxContainerCount: 8192,
      maxDepth: 16,
      maxObjectPropertyCount: 96,
      maxPropertyNameCodeUnits: 96,
      maxStringCodeUnits: 8192,
      maxTotalStringCodeUnits: 16777216,
      maxTotalPropertyCount: 65536,
      maxViolations: 512,
    });
    expect(Object.isFrozen(EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS)).toBe(true);
    expect(EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS).not.toHaveProperty(
      'supportProfile',
    );
  });

  it('does not call the producer, problem builder, or a candidate enumerator', () => {
    const source = readFileSync(
      new URL(
        '../../m0f/box-pleating/euclidean-necessary-witness-search-result-validation.ts',
        import.meta.url,
      ),
      'utf8',
    );
    expect(source).not.toMatch(/\bsearchEuclideanNecessaryWitnessesV1\s*\(/u);
    expect(source).not.toContain('buildPolygonRiverPackingProblemV1');
    expect(source).not.toMatch(/\benumerate[A-Za-z0-9_]*\s*\(/u);
  });

  it('accepts and owns the independently replayed domain-exhausted response', () => {
    const input = searchInput(twoLeafSource(2), 90, 8, 2);
    const result = completed(input);
    expect(result).toMatchObject({
      visitedStates: 90,
      searchStatus: 'domain-exhausted',
      searchComplete: true,
      witnessCount: 0,
      noNecessaryFilterWitnessInEnumeratedDomain: true,
    });
    const validated = validateEuclideanNecessaryWitnessSearchResultV1(input, result);
    expect(validated.ok).toBe(true);
    if (!validated.ok) throw new Error('complete domain response must validate');
    expect(validated.value).toEqual(result);
    expect(validated.value).not.toBe(result);
    expect(allFrozen(validated)).toBe(true);
  });

  it('accepts witness-limit, budget-exhausted, and zero-demand coincidence replays', () => {
    const witnessInput = searchInput(twoLeafSource(1), 20, 1, 2);
    const witness = completed(witnessInput);
    expect(witness).toMatchObject({
      visitedStates: 4,
      searchStatus: 'witness-found',
      witnessCount: 1,
    });
    expect(validateEuclideanNecessaryWitnessSearchResultV1(witnessInput, witness).ok).toBe(true);

    const budgetInput = searchInput(twoLeafSource(2), 89, 8, 2);
    const budget = completed(budgetInput);
    expect(budget).toMatchObject({
      visitedStates: 89,
      searchStatus: 'budget-exhausted',
      searchComplete: false,
    });
    expect(validateEuclideanNecessaryWitnessSearchResultV1(budgetInput, budget).ok).toBe(true);

    const zeroInput = searchInput(twoLeafSource(0.1, 2, 1), 10, 1, 2);
    const zero = completed(zeroInput);
    expect(zero.witnesses[0]?.leafAssignments).toEqual([
      { leafNodeId: 'leaf-a', x: 0, y: 0 },
      { leafNodeId: 'leaf-b', x: 0, y: 0 },
    ]);
    expect(validateEuclideanNecessaryWitnessSearchResultV1(zeroInput, zero).ok).toBe(true);
  });

  it('does not trust a forged domain-exhausted status or no-witness conclusion', () => {
    const input = searchInput(twoLeafSource(2), 89, 8, 2);
    const raw = mutable(completed(input));
    raw.searchStatus = 'domain-exhausted';
    raw.searchComplete = true;
    raw.noNecessaryFilterWitnessInEnumeratedDomain = true;
    const rejected = invalid(input, raw);
    expect(rejected.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '$.result.searchStatus', stage: 'search-replay' }),
        expect.objectContaining({ path: '$.result.searchComplete', stage: 'search-replay' }),
        expect.objectContaining({
          path: '$.result.noNecessaryFilterWitnessInEnumeratedDomain',
          stage: 'search-replay',
        }),
      ]),
    );
  });

  it('rejects canonical witness order, assignment order, pair order, and exact arithmetic tampering', () => {
    const input = searchInput(twoLeafSource(0.1, 2, 1), 30, 3, 2);
    const raw = mutable(completed(input));
    raw.witnesses.reverse();
    const first = raw.witnesses[0];
    if (first === undefined) throw new Error('witness fixture is incomplete');
    first.witnessIndex = 99;
    first.leafAssignments.reverse();
    const pair = first.pairEvaluations[0];
    if (pair === undefined) throw new Error('pair fixture is incomplete');
    pair.absoluteDeltaX = '99';
    pair.actualSquaredDistance = '9801';
    pair.requiredSquaredDistance = '1';
    pair.passesNecessaryFilter = false as never;
    const rejected = invalid(input, raw);
    expect(rejected.violations.some((entry) => entry.stage === 'search-replay')).toBe(true);
    expect(rejected.violations.some((entry) => entry.stage === 'exact-arithmetic')).toBe(true);
  });

  it('rejects stale budgets, source/result bindings, active-grid echoes, and semantics references', () => {
    const input = searchInput(twoLeafSource(1), 20, 1, 2);
    const result = completed(input);

    const staleBudget = structuredClone(input);
    staleBudget.maxVisitedStates = 19;
    expect(
      invalid(staleBudget, result).violations.some(
        (entry) => entry.path === '$.result.maxVisitedStates',
      ),
    ).toBe(true);

    const staleSource = searchInput(twoLeafSource(0.5), 20, 1, 2);
    expect(
      invalid(staleSource, result).violations.some(
        (entry) => entry.stage === 'packing-problem-reference',
      ),
    ).toBe(true);

    const gridTamper = mutable(result);
    gridTamper.activeGridDomain.vertexCount += 1;
    expect(
      invalid(input, gridTamper).violations.some((entry) => entry.stage === 'source-binding'),
    ).toBe(true);

    const semanticsTamper = mutable(result);
    semanticsTamper.semanticsReference.globalM0fGo = true as false;
    expect(
      invalid(input, semanticsTamper).violations.some(
        (entry) => entry.stage === 'semantics-reference' && entry.code === 'claim-boundary',
      ),
    ).toBe(true);
  });

  it('rejects every root false-claim escalation and fixed search-description tampering', () => {
    const input = searchInput(twoLeafSource(2), 1, 8, 2);
    const raw = mutable(completed(input));
    const record = raw as unknown as JsonRecord;
    let escalated = 0;
    for (const key of Object.keys(record)) {
      if (record[key] === false) {
        record[key] = true;
        escalated += 1;
      }
    }
    raw.scope = 'packing-solver' as typeof raw.scope;
    raw.evaluatedRelation = 'manhattan' as typeof raw.evaluatedRelation;
    const rejected = invalid(input, raw);
    expect(escalated).toBeGreaterThan(20);
    expect(
      rejected.violations.filter((entry) => entry.stage === 'claim-boundary').length,
    ).toBeGreaterThan(15);
    expect(rejected.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '$.result.scope' }),
        expect.objectContaining({ path: '$.result.evaluatedRelation' }),
      ]),
    );
  });

  it('validates a 20-leaf, 190-pair, eight-witness response and caps violations', () => {
    const source = maximalZeroDemandSource();
    const input = searchInput(source, 80, 8, 1);
    const result = completed(input);
    expect(result.packingProblemReference.leafGridVertexVariables).toHaveLength(20);
    expect(result.packingProblemReference.separationConstraintInputs).toHaveLength(190);
    expect(result.witnesses).toHaveLength(8);
    expect(result.witnesses[0]?.pairEvaluations).toHaveLength(190);
    expect(validateEuclideanNecessaryWitnessSearchResultV1(input, result).ok).toBe(true);

    const raw = mutable(result);
    for (const witness of raw.witnesses) {
      for (const evaluation of witness.pairEvaluations) {
        (evaluation as unknown as JsonRecord).unknown = true;
      }
    }
    const rejected = invalid(input, raw);
    expect(rejected.violations).toHaveLength(512);
    expect(allFrozen(rejected)).toBe(true);
  });

  it('replays a 632-digit demand and its 1264-digit square with BigInt', () => {
    const source = hugeStepSource();
    const input = searchInput(source, 2, 8, 1);
    const result = completed(input);
    const demand = result.packingProblemReference.separationConstraintInputs[0]?.totalLengthSteps;
    if (demand === undefined) throw new Error('huge pair fixture is incomplete');
    expect(demand).toHaveLength(632);
    expect((BigInt(demand) ** 2n).toString().length).toBeGreaterThan(1260);
    expect(result.searchStatus).toBe('budget-exhausted');
    expect(validateEuclideanNecessaryWitnessSearchResultV1(input, result).ok).toBe(true);
  });

  it('fails closed on hostile input and result snapshots without invoking accessors', () => {
    const input = searchInput(twoLeafSource(1), 20, 1, 2);
    const result = mutable(completed(input));

    let inputGetterCalls = 0;
    const accessorInput = structuredClone(input);
    Object.defineProperty(accessorInput, 'maxVisitedStates', {
      enumerable: true,
      get() {
        inputGetterCalls += 1;
        return 20;
      },
    });
    expect(invalid(accessorInput, result).violations[0]).toMatchObject({
      stage: 'search-input-snapshot',
      code: 'invalid-snapshot',
    });
    expect(inputGetterCalls).toBe(0);

    let resultGetterCalls = 0;
    Object.defineProperty(result, 'searchStatus', {
      enumerable: true,
      configurable: true,
      get() {
        resultGetterCalls += 1;
        return 'witness-found';
      },
    });
    expect(invalid(input, result).violations[0]).toMatchObject({
      stage: 'result-snapshot',
      code: 'invalid-snapshot',
    });
    expect(resultGetterCalls).toBe(0);

    const cyclic = mutable(completed(input)) as unknown as JsonRecord;
    cyclic.self = cyclic;
    expect(invalid(input, cyclic).violations[0]).toMatchObject({ stage: 'result-snapshot' });

    const sparse = mutable(completed(input));
    (sparse as unknown as JsonRecord).witnesses = new Array<unknown>(1);
    expect(invalid(input, sparse).violations[0]).toMatchObject({ stage: 'result-snapshot' });
  });

  it('enforces array, object-property, and string response ceilings', () => {
    const input = searchInput(twoLeafSource(1), 20, 1, 2);
    const baseline = completed(input);

    const arrayOverflow = mutable(baseline);
    const witnessTemplate = arrayOverflow.witnesses[0];
    if (witnessTemplate === undefined) throw new Error('witness fixture is incomplete');
    arrayOverflow.witnesses = Array.from({ length: 191 }, () => structuredClone(witnessTemplate));
    expect(invalid(input, arrayOverflow).violations[0]).toMatchObject({
      stage: 'result-snapshot',
    });

    const objectOverflow = mutable(baseline) as unknown as JsonRecord;
    objectOverflow.activeGridDomain = Object.fromEntries(
      Array.from({ length: 97 }, (_entry, index) => [`field-${String(index)}`, index]),
    );
    expect(invalid(input, objectOverflow).violations[0]).toMatchObject({
      stage: 'result-snapshot',
    });

    const stringOverflow = mutable(baseline);
    stringOverflow.interpretation = 'x'.repeat(8_193) as typeof stringOverflow.interpretation;
    expect(invalid(input, stringOverflow).violations[0]).toMatchObject({
      stage: 'result-snapshot',
    });
  });

  it('rejects closed-input tampering before examining a completed response', () => {
    const input = searchInput(twoLeafSource(1), 20, 1, 2);
    const result = completed(input);
    const raw = structuredClone(input);
    raw.unknown = true;
    raw.scientificClaim = true;
    const rejected = invalid(raw, result);
    expect(rejected.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '$.input.unknown', code: 'unknown-field' }),
        expect.objectContaining({ path: '$.input.scientificClaim', code: 'claim-boundary' }),
      ]),
    );
  });

  it('is deterministic and breaks all caller aliases on success', () => {
    const input = searchInput(twoLeafSource(1), 20, 1, 2);
    const result = mutable(completed(input));
    const first = validateEuclideanNecessaryWitnessSearchResultV1(input, result);
    const second = validateEuclideanNecessaryWitnessSearchResultV1(input, result);
    expect(second).toEqual(first);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error('baseline result must validate');
    const originalX = first.value.witnesses[0]?.leafAssignments[0]?.x;
    const callerAssignment = result.witnesses[0]?.leafAssignments[0];
    if (callerAssignment === undefined) throw new Error('caller fixture is incomplete');
    callerAssignment.x = 99;
    expect(first.value.witnesses[0]?.leafAssignments[0]?.x).toBe(originalX);
    expect(allFrozen(first)).toBe(true);
  });
});
