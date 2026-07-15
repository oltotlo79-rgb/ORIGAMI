import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
import {
  buildPolygonRiverPackingProblemV1,
  POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
  type PolygonRiverPackingProblemResultV1,
} from '../../m0f/box-pleating/polygon-river-packing-problem.js';
import {
  POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS,
  validatePolygonRiverPackingProblemResultV1,
} from '../../m0f/box-pleating/polygon-river-packing-problem-result-validation.js';
import { enumerateOrderedTreeSquareGridCandidatesV1 } from '../../m0f/box-pleating/ordered-tree-square-grid-candidates.js';
import { DEFAULT_ORDERED_TREE_INPUT } from '../../m0f/ordered-tree-cli.js';

type DeepMutable<T> = T extends readonly (infer U)[]
  ? DeepMutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
    : T;

interface MutableTreeEdge {
  id: string;
  from: string;
  to: string;
  length: number;
  width: number;
  label: string;
  mirrorOf: string | null;
}

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
  edges: MutableTreeEdge[];
  rotation: { nodeId: string; edgeIds: string[] }[];
}

type JsonRecord = Record<string, unknown>;

interface Fixture {
  request: JsonRecord;
  value: PolygonRiverPackingProblemResultV1;
}

function defaultSource(): JsonRecord {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: structuredClone(DEFAULT_ORDERED_TREE_INPUT),
    paper: { width: 1.5, height: 1 },
    maxColumns: 12,
    maxRows: 12,
    relativeErrorLimit: 0.01,
  };
}

function candidates(source: JsonRecord): readonly { candidateId: string }[] {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('test source must enumerate');
  return enumerated.value.quantization.candidates;
}

function requestFor(source: JsonRecord, candidateId: string): JsonRecord {
  return {
    schemaVersion: 1,
    recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    source,
    candidateId,
  };
}

function fixture(
  source: JsonRecord = defaultSource(),
  select: (candidate: { candidateId: string }, index: number) => boolean = (_candidate, index) =>
    index === 0,
): Fixture {
  const candidate = candidates(source).find(select);
  if (candidate === undefined) throw new Error('test source must contain the requested candidate');
  const request = requestFor(source, candidate.candidateId);
  const built = buildPolygonRiverPackingProblemV1(request);
  if (!built.ok) throw new Error('test problem must build');
  return { request, value: built.value };
}

function mutable(
  value: PolygonRiverPackingProblemResultV1,
): DeepMutable<PolygonRiverPackingProblemResultV1> {
  return structuredClone(value) as DeepMutable<PolygonRiverPackingProblemResultV1>;
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

function expectInvalid(
  request: unknown,
  result: unknown,
): ReturnType<typeof validatePolygonRiverPackingProblemResultV1> & { ok: false } {
  const validated = validatePolygonRiverPackingProblemResultV1(request, result);
  expect(validated.ok).toBe(false);
  if (validated.ok) throw new Error('expected result validation to fail');
  expect(validated.violations.length).toBeGreaterThan(0);
  expect(validated.violations.length).toBeLessThanOrEqual(
    POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxViolations,
  );
  expect(allFrozen(validated)).toBe(true);
  return validated;
}

function maximalCaterpillarSource(longIds = false): JsonRecord {
  const nodes: MutableTree['nodes'] = [];
  const edges: MutableTreeEdge[] = [];
  const rotation: MutableTree['rotation'] = [];
  const spineId = (index: number): string =>
    `${longIds ? 'spine-node-with-deliberately-long-validator-id-' : 'spine-'}${String(index).padStart(2, '0')}`;
  const leafId = (index: number): string =>
    `${longIds ? 'leaf-node-with-deliberately-long-validator-id-' : 'leaf-'}${String(index).padStart(2, '0')}`;
  const spineEdgeId = (index: number): string =>
    `${longIds ? 'spine-edge-with-deliberately-long-validator-id-' : 'spine-edge-'}${String(index).padStart(2, '0')}`;
  const leafEdgeId = (index: number): string =>
    `${longIds ? 'leaf-edge-with-deliberately-long-validator-id-' : 'leaf-edge-'}${String(index).padStart(2, '0')}`;

  for (let index = 0; index < 20; index += 1) {
    const suffix = String(index).padStart(2, '0');
    const spineNodeId = spineId(index);
    const leafNodeId = leafId(index);
    const terminalEdgeId = leafEdgeId(index);
    nodes.push(
      {
        id: spineNodeId,
        pos: { x: index, y: 0 },
        label: suffix,
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: leafNodeId,
        pos: { x: index, y: 1 },
        label: suffix,
        mirrorOf: null,
        onSymmetryAxis: false,
      },
    );
    edges.push({
      id: terminalEdgeId,
      from: spineNodeId,
      to: leafNodeId,
      length: 1,
      width: 0.125,
      label: suffix,
      mirrorOf: null,
    });
    const incident: string[] = [];
    if (index > 0) incident.push(spineEdgeId(index - 1));
    incident.push(terminalEdgeId);
    if (index < 19) incident.push(spineEdgeId(index));
    rotation.push(
      { nodeId: leafNodeId, edgeIds: [terminalEdgeId] },
      { nodeId: spineNodeId, edgeIds: incident },
    );
    if (index < 19) {
      edges.push({
        id: spineEdgeId(index),
        from: spineNodeId,
        to: spineId(index + 1),
        length: 1,
        width: 0.25,
        label: suffix,
        mirrorOf: null,
      });
    }
  }

  const tree: MutableTree = {
    schemaVersion: 1,
    recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes,
    edges,
    rotation,
  };
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: tree,
    paper: { width: 1, height: 1 },
    maxColumns: 8,
    maxRows: 8,
    relativeErrorLimit: 0,
  };
}

function hugeStepSource(): JsonRecord {
  const tree = structuredClone(DEFAULT_ORDERED_TREE_INPUT) as MutableTree;
  for (const edge of tree.edges) {
    edge.length = Number.MAX_VALUE;
    edge.width = Number.MIN_VALUE;
  }
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: tree,
    paper: { width: Number.MIN_VALUE, height: Number.MIN_VALUE },
    maxColumns: 1,
    maxRows: 1,
    relativeErrorLimit: 0,
  };
}

describe('polygon/river packing-problem independent result validation', () => {
  it('publishes the fixed defensive response budgets', () => {
    expect(POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS).toEqual({
      maxArrayLength: 190,
      maxContainerCount: 2048,
      maxDepth: 12,
      maxObjectPropertyCount: 64,
      maxPropertyNameCodeUnits: 64,
      maxStringCodeUnits: 8192,
      maxTotalStringCodeUnits: 4194304,
      maxTotalPropertyCount: 8192,
      maxViolations: 512,
    });
    expect(Object.isFrozen(POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS)).toBe(true);
    expect(POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS).not.toHaveProperty(
      'supportProfile',
    );
  });

  it('has no production dependency on a problem builder, path builder, or enumerator', () => {
    const source = readFileSync(
      new URL(
        '../../m0f/box-pleating/polygon-river-packing-problem-result-validation.ts',
        import.meta.url,
      ),
      'utf8',
    );
    expect(source).not.toContain('buildPolygonRiverPackingProblemV1');
    expect(source).not.toContain('buildOrderedTreePathDemandsV1');
    expect(source).not.toMatch(/\benumerate[A-Za-z0-9_]*\s*\(/u);
  });

  it('accepts and independently normalizes the complete default response', () => {
    const built = fixture();
    const validated = validatePolygonRiverPackingProblemResultV1(built.request, built.value);
    expect(validated.ok).toBe(true);
    if (!validated.ok) throw new Error('default response must validate');
    expect(validated.value).toEqual(built.value);
    expect(validated.value).not.toBe(built.value);
    expect(allFrozen(validated)).toBe(true);
    expect(validated.value).not.toHaveProperty('enumerationComplete');
    expect(validated.value).not.toHaveProperty('placement');
    expect(validated.value.globalM0fGo).toBe(false);
  });

  it('canonicalizes a permuted request source before checking the response', () => {
    const built = fixture();
    const request = structuredClone(built.request);
    const source = request.source as JsonRecord;
    const tree = source.orderedTree as MutableTree;
    tree.nodes.reverse();
    tree.edges.reverse();
    tree.rotation.reverse();
    const validated = validatePolygonRiverPackingProblemResultV1(request, built.value);
    expect(validated.ok).toBe(true);
  });

  it('returns an owned deep-frozen value and cuts every caller alias', () => {
    const source = defaultSource();
    source.relativeErrorLimit = 1;
    const built = fixture(source, (_candidate, index) => index === 1);
    const raw = mutable(built.value);
    const aliasedStrip = raw.positiveResidualStrips[0];
    if (aliasedStrip !== undefined) {
      aliasedStrip.size = raw.candidateResidualStrips[`${aliasedStrip.axis}Axis`];
    }
    const validated = validatePolygonRiverPackingProblemResultV1(built.request, raw);
    expect(validated.ok).toBe(true);
    if (!validated.ok) throw new Error('aliased but acyclic plain input must validate');
    const originalId = validated.value.candidateReference.candidateId;
    raw.candidateReference.candidateId = 'mutated-after-validation';
    const mutableLeaf = raw.leafGridVertexVariables[0];
    if (mutableLeaf === undefined) throw new Error('leaf fixture is incomplete');
    mutableLeaf.leafNodeId = 'mutated-after-validation';
    expect(validated.value.candidateReference.candidateId).toBe(originalId);
    expect(validated.value.leafGridVertexVariables[0]?.leafNodeId).not.toBe(
      'mutated-after-validation',
    );
    expect(allFrozen(validated)).toBe(true);
  });

  it('rejects unknown and missing root fields and every escalated false claim', () => {
    const built = fixture();
    const raw = mutable(built.value);
    const record = raw as unknown as JsonRecord;
    record.unknownClaim = true;
    delete record.interpretation;
    for (const key of Object.keys(record)) {
      if (record[key] === false) record[key] = true;
    }
    const invalid = expectInvalid(built.request, raw);
    expect(invalid.violations).toContainEqual(
      expect.objectContaining({ path: '$.result.unknownClaim', code: 'unknown-field' }),
    );
    expect(invalid.violations).toContainEqual(
      expect.objectContaining({ path: '$.result.interpretation', code: 'missing-field' }),
    );
    expect(
      invalid.violations.filter((violation) => violation.code === 'claim-boundary').length,
    ).toBeGreaterThan(10);
  });

  it('rejects a mathematically valid candidate from the same source when its ID is stale', () => {
    const source = defaultSource();
    source.relativeErrorLimit = 1;
    expect(candidates(source).length).toBeGreaterThan(1);
    const first = fixture(source, (_candidate, index) => index === 0);
    const second = fixture(structuredClone(source), (_candidate, index) => index === 1);
    const invalid = expectInvalid(first.request, second.value);
    expect(invalid.violations).toContainEqual(
      expect.objectContaining({
        path: '$.result.candidateReference.candidateId',
        code: 'candidate-id-mismatch',
      }),
    );
  });

  it('rejects a candidate bound to a valid but different source branch', () => {
    const built = fixture();
    const request = structuredClone(built.request);
    const tree = (request.source as JsonRecord).orderedTree as MutableTree;
    const internal = tree.edges.find((edge) => edge.id === 'edge-internal');
    if (internal === undefined) throw new Error('internal edge fixture is missing');
    internal.width *= 2;
    const invalid = expectInvalid(request, built.value);
    expect(invalid.violations).toContainEqual(
      expect.objectContaining({ stage: 'candidate-reference', code: 'candidate-invalid' }),
    );
  });

  it('rejects branch quantization arithmetic and branch-order tampering', () => {
    const built = fixture();
    const arithmetic = mutable(built.value);
    const first = arithmetic.candidateReference.branchQuantizations[0];
    if (first === undefined) throw new Error('candidate fixture is incomplete');
    first.length.steps = (BigInt(first.length.steps) + 1n).toString();
    const invalidArithmetic = expectInvalid(built.request, arithmetic);
    expect(invalidArithmetic.violations).toContainEqual(
      expect.objectContaining({ stage: 'candidate-reference', code: 'candidate-invalid' }),
    );

    const reordered = mutable(built.value);
    reordered.candidateReference.branchQuantizations.reverse();
    expectInvalid(built.request, reordered);
  });

  it('rejects active-grid and compact leaf-domain tampering or an assignment', () => {
    const built = fixture();
    const raw = mutable(built.value);
    raw.activeGridDomain.columns += 1;
    raw.leafGridVertexVariables.reverse();
    const variable = raw.leafGridVertexVariables[0];
    if (variable === undefined) throw new Error('leaf fixture is incomplete');
    variable.x.maximum += 1;
    variable.assignedCoordinate = { x: 0, y: 0 } as never;
    const invalid = expectInvalid(built.request, raw);
    expect(invalid.violations).toContainEqual(
      expect.objectContaining({ path: '$.result.activeGridDomain.columns' }),
    );
    expect(
      invalid.violations.some((violation) => violation.path.includes('assignedCoordinate')),
    ).toBe(true);
  });

  it('rejects river order, endpoint, class, and dimension tampering', () => {
    const built = fixture();
    const raw = mutable(built.value);
    raw.riverDimensionInputs.reverse();
    const first = raw.riverDimensionInputs[0];
    if (first === undefined) throw new Error('river fixture is incomplete');
    [first.firstEndpointNodeId, first.secondEndpointNodeId] = [
      first.secondEndpointNodeId,
      first.firstEndpointNodeId,
    ];
    first.branchClass = first.branchClass === 'internal' ? 'terminal' : 'internal';
    first.widthSteps = (BigInt(first.widthSteps) + 1n).toString();
    const invalid = expectInvalid(built.request, raw);
    expect(
      invalid.violations.some((violation) =>
        violation.path.startsWith('$.result.riverDimensionInputs'),
      ),
    ).toBe(true);
  });

  it('rejects pair order, first-to-second path order, and BigInt aggregation tampering', () => {
    const built = fixture();
    const raw = mutable(built.value);
    raw.separationConstraintInputs.reverse();
    const pair = raw.separationConstraintInputs[0];
    if (pair === undefined) throw new Error('separation fixture is incomplete');
    pair.pathTreeEdgeIds.reverse();
    pair.totalLengthSteps = (BigInt(pair.totalLengthSteps) + 1n).toString();
    pair.maximumWidthSteps = (BigInt(pair.maximumWidthSteps) + 1n).toString();
    const invalid = expectInvalid(built.request, raw);
    expect(
      invalid.violations.some((violation) =>
        violation.path.startsWith('$.result.separationConstraintInputs'),
      ),
    ).toBe(true);
  });

  it('retains rectangular positive residuals and rejects strip tampering or reordering', () => {
    const source = defaultSource();
    source.relativeErrorLimit = 1;
    const built = fixture(source, (_candidate, index) => index === 1);
    expect(built.value.positiveResidualStrips.length).toBeGreaterThan(0);
    const accepted = validatePolygonRiverPackingProblemResultV1(built.request, built.value);
    expect(accepted.ok).toBe(true);

    const raw = mutable(built.value);
    raw.positiveResidualStrips.reverse();
    const strip = raw.positiveResidualStrips[0];
    if (strip === undefined) throw new Error('positive residual fixture is incomplete');
    strip.size = { numerator: '0', denominator: '1' };
    raw.candidateResidualStrips.xAxis = { numerator: '0', denominator: '1' };
    expectInvalid(built.request, raw);
  });

  it('rejects all sourceBinding cardinality mutations', () => {
    const built = fixture();
    const raw = mutable(built.value);
    for (const key of Object.keys(raw.sourceBinding) as (keyof typeof raw.sourceBinding)[]) {
      raw.sourceBinding[key] += 1;
    }
    const invalid = expectInvalid(built.request, raw);
    expect(
      invalid.violations.filter((violation) => violation.path.startsWith('$.result.sourceBinding'))
        .length,
    ).toBe(Object.keys(raw.sourceBinding).length);
  });

  it('rejects malformed result primitives, arrays, and objects', () => {
    const built = fixture();
    expectInvalid(built.request, null);
    expectInvalid(built.request, []);

    const wrongArray = mutable(built.value);
    (wrongArray as unknown as JsonRecord).riverDimensionInputs = {};
    expectInvalid(built.request, wrongArray);

    const wrongObject = mutable(built.value);
    (wrongObject as unknown as JsonRecord).activeGridDomain = [];
    expectInvalid(built.request, wrongObject);
  });

  it('rejects accessors without invoking them', () => {
    const built = fixture();
    const raw = mutable(built.value);
    let invocations = 0;
    Object.defineProperty(raw, 'scope', {
      enumerable: true,
      configurable: true,
      get() {
        invocations += 1;
        return 'finite-polygon-river-packing-csp-problem-description-only';
      },
    });
    const invalid = expectInvalid(built.request, raw);
    expect(invocations).toBe(0);
    expect(invalid.violations[0]).toMatchObject({
      stage: 'result-snapshot',
      code: 'invalid-snapshot',
    });
  });

  it('rejects sparse arrays, cycles, excessive arrays, objects, and strings at snapshot time', () => {
    const built = fixture();
    const sparse = mutable(built.value);
    const sparseVariables: typeof sparse.leafGridVertexVariables = [];
    sparseVariables.length = 2;
    sparse.leafGridVertexVariables = sparseVariables;
    expectInvalid(built.request, sparse);

    const cyclic = mutable(built.value) as unknown as JsonRecord;
    cyclic.cycle = cyclic;
    expectInvalid(built.request, cyclic);

    const longArray = mutable(built.value);
    longArray.positiveResidualStrips = Array.from({ length: 191 }, () => ({
      axis: 'x' as const,
      boundary: 'positive' as const,
      size: { numerator: '1', denominator: '1' },
    }));
    expectInvalid(built.request, longArray);

    const manyFields = mutable(built.value) as unknown as JsonRecord;
    manyFields.activeGridDomain = Object.fromEntries(
      Array.from({ length: 65 }, (_entry, index) => [`field${String(index)}`, index]),
    );
    expectInvalid(built.request, manyFields);

    const longString = mutable(built.value);
    longString.interpretation = 'x'.repeat(8193) as typeof longString.interpretation;
    expectInvalid(built.request, longString);
  });

  it('caps violations at 512 even when every maximal path edge is stale', () => {
    const built = fixture(maximalCaterpillarSource());
    const raw = mutable(built.value);
    for (const pair of raw.separationConstraintInputs) {
      pair.pathTreeEdgeIds = pair.pathTreeEdgeIds.map(
        (_edgeId, index) => `tampered-${String(index)}`,
      );
    }
    const invalid = expectInvalid(built.request, raw);
    expect(invalid.violations).toHaveLength(512);
  });

  it('validates the 40-node, 39-edge, 20-leaf, 190-pair response above 91 KiB', () => {
    const built = fixture(maximalCaterpillarSource(true));
    expect(built.value.sourceBinding).toMatchObject({
      treeEdgeCount: 39,
      candidateBranchQuantizationCount: 39,
      leafCount: 20,
      leafPairCount: 190,
      separationConstraintInputCount: 190,
    });
    expect(JSON.stringify(built.value).length).toBeGreaterThan(91 * 1024);
    const validated = validatePolygonRiverPackingProblemResultV1(built.request, built.value);
    expect(validated.ok).toBe(true);
  });

  it('uses BigInt aggregation for a valid 632-digit quantized step count', () => {
    const built = fixture(hugeStepSource());
    const maximumStepDigits = Math.max(
      ...built.value.candidateReference.branchQuantizations.map(
        (branch) => branch.length.steps.length,
      ),
    );
    expect(maximumStepDigits).toBeGreaterThan(600);
    const validated = validatePolygonRiverPackingProblemResultV1(built.request, built.value);
    expect(validated.ok).toBe(true);
    if (!validated.ok) throw new Error('huge exact step fixture must validate');
    const expectedTotal = validated.value.riverDimensionInputs
      .map((entry) => BigInt(entry.lengthSteps))
      .reduce((sum, value) => sum + value, 0n);
    const firstPair = validated.value.separationConstraintInputs[0];
    if (firstPair === undefined) throw new Error('huge-step pair fixture is incomplete');
    expect(BigInt(firstPair.totalLengthSteps)).toBe(expectedTotal);
  });

  it('treats an unknown request ID as consistency failure, not enumeration membership evidence', () => {
    const built = fixture();
    const request = structuredClone(built.request);
    request.candidateId = 'square-grid:not-present';
    const invalid = expectInvalid(request, built.value);
    expect(invalid.violations).toContainEqual(
      expect.objectContaining({ code: 'candidate-id-mismatch' }),
    );
    expect(
      invalid.violations.some(
        (violation) =>
          violation.code === ('candidate-not-found' as typeof violation.code) ||
          violation.message.includes('bounded enumeration'),
      ),
    ).toBe(false);
  });

  it('does not reinterpret candidateReferenceMode as proof that the producer process ran', () => {
    const built = fixture();
    const validated = validatePolygonRiverPackingProblemResultV1(built.request, built.value);
    expect(validated.ok).toBe(true);
    if (!validated.ok) throw new Error('baseline response must validate');
    expect(validated.value.candidateReferenceMode).toBe(
      'caller-supplied-id-re-enumerated-from-embedded-source',
    );
    expect(validated.value).not.toHaveProperty('enumerationComplete');
    expect(validated.value).not.toHaveProperty('enumerationMembershipVerified');
    expect(validated.value).not.toHaveProperty('producerProcessVerified');
  });

  it('fails closed on an empty-enumeration source without making candidate-not-found claims', () => {
    const built = fixture();
    const source = defaultSource();
    const tree = source.orderedTree as MutableTree;
    for (const edge of tree.edges) {
      edge.length = 0.3;
      edge.width = 0;
    }
    source.paper = { width: 1, height: 1 };
    source.maxColumns = 1;
    source.maxRows = 1;
    source.relativeErrorLimit = 0;
    const request = requestFor(source, 'square-grid:1x1:xy:1/1');
    const invalid = expectInvalid(request, built.value);
    expect(invalid.violations).toContainEqual(
      expect.objectContaining({ stage: 'candidate-reference', code: 'candidate-invalid' }),
    );
    expect(invalid.violations.some((violation) => violation.message.includes('not present'))).toBe(
      false,
    );
  });

  it('rejects an invalid closed request before accepting any response', () => {
    const built = fixture();
    const request = structuredClone(built.request);
    request.scientificClaim = true;
    const invalid = expectInvalid(request, built.value);
    expect(invalid.violations[0]).toMatchObject({
      stage: 'request-input',
      code: 'invalid-request',
    });
  });

  it('is deterministic across repeated validation', () => {
    const built = fixture();
    const first = validatePolygonRiverPackingProblemResultV1(built.request, built.value);
    const second = validatePolygonRiverPackingProblemResultV1(built.request, built.value);
    expect(second).toEqual(first);

    const tampered = mutable(built.value);
    const firstPair = tampered.separationConstraintInputs[0];
    if (firstPair === undefined) throw new Error('separation fixture is incomplete');
    firstPair.totalLengthSteps = '0';
    expect(validatePolygonRiverPackingProblemResultV1(built.request, tampered)).toEqual(
      validatePolygonRiverPackingProblemResultV1(built.request, tampered),
    );
  });

  it('orders invalid-response violations independently of property insertion order', () => {
    const built = fixture();
    const first = mutable(built.value) as unknown as JsonRecord;
    const second = mutable(built.value) as unknown as JsonRecord;
    const firstCandidate = first.candidateReference as JsonRecord;
    const secondCandidate = second.candidateReference as JsonRecord;
    first.zUnknown = true;
    first.aUnknown = true;
    firstCandidate.zUnknown = true;
    firstCandidate.aUnknown = true;
    second.aUnknown = true;
    second.zUnknown = true;
    secondCandidate.aUnknown = true;
    secondCandidate.zUnknown = true;
    expect(validatePolygonRiverPackingProblemResultV1(built.request, second)).toEqual(
      validatePolygonRiverPackingProblemResultV1(built.request, first),
    );
  });
});
