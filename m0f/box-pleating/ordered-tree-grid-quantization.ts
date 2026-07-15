import { deepFreezeOwned } from '../clone-and-freeze.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  analyzeOrderedTreeInputV1,
  type OrderedTreeInputIssue,
  type OrderedTreeInputResultV1,
  type OrderedTreeInputV1,
} from './ordered-tree-input.js';
import {
  parseSquareGridCandidateInputV1,
  SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
  type SquareGridBranchClass,
  type SquareGridCandidateInputIssue,
  type SquareGridCandidateInputV1,
} from './square-grid-candidates.js';

export const ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE =
  'm0f-ordered-tree-grid-quantization-input' as const;
export const ORDERED_TREE_GRID_QUANTIZATION_RESULT_RECORD_TYPE =
  'm0f-ordered-tree-grid-quantization-result' as const;

/**
 * Defensive adapter ceilings only. These budgets do not define a
 * SupportProfile and do not imply that a grid candidate or CP exists.
 */
export const ORDERED_TREE_GRID_QUANTIZATION_LIMITS = deepFreezeOwned({
  maxOrderedTreeNodes: 40,
  maxOrderedTreeEdges: 39,
  maxArrayLength: 40,
  maxContainerCount: 256,
  maxDepth: 7,
  maxObjectPropertyCount: 12,
  maxPropertyNameCodeUnits: 64,
  maxStringCodeUnits: 4_096,
  maxTotalStringCodeUnits: 131_072,
  maxTotalPropertyCount: 1_024,
});

export type OrderedTreeGridQuantizationInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  orderedTree: OrderedTreeInputV1;
  paper: Readonly<{ width: number; height: number }>;
  maxColumns: number;
  maxRows: number;
  relativeErrorLimit: number;
}>;

export type OrderedTreeGridBranchMappingV1 = Readonly<{
  treeEdgeId: string;
  squareGridBranchId: string;
  branchClass: SquareGridBranchClass;
  length: number;
  width: number;
}>;

export type OrderedTreeGridQuantizationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof ORDERED_TREE_GRID_QUANTIZATION_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'ordered-tree-to-square-grid-input-adapter-only';
  mappingOrder: 'tree-edge-id-code-unit';
  enumerationIncluded: false;
  placementIncluded: false;
  packingIncluded: false;
  creasePatternIncluded: false;
  pleatRoutingIncluded: false;
  mountainValleyIncluded: false;
  foldabilityIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  orderedTree: OrderedTreeInputResultV1;
  squareGridInput: SquareGridCandidateInputV1;
  branchMapping: readonly OrderedTreeGridBranchMappingV1[];
}>;

export type OrderedTreeGridQuantizationIssue = Readonly<{
  stage: 'snapshot' | 'adapter-input' | 'ordered-tree' | 'square-grid-input' | 'mapping';
  path: string;
  code: string;
  message: string;
}>;

export type OrderedTreeGridQuantizationResult =
  | Readonly<{ ok: true; value: OrderedTreeGridQuantizationResultV1 }>
  | Readonly<{ ok: false; error: readonly OrderedTreeGridQuantizationIssue[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'orderedTree',
  'paper',
  'maxColumns',
  'maxRows',
  'relativeErrorLimit',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function addIssue(
  issues: OrderedTreeGridQuantizationIssue[],
  stage: OrderedTreeGridQuantizationIssue['stage'],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ stage, path, code, message });
}

function validateClosedRoot(
  raw: Record<string, unknown>,
  issues: OrderedTreeGridQuantizationIssue[],
): void {
  const allowed = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      addIssue(
        issues,
        'adapter-input',
        `$.${key}`,
        'unknown-field',
        'field is not declared by adapter input v1',
      );
    }
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      addIssue(issues, 'adapter-input', `$.${key}`, 'missing-field', 'required field is missing');
    }
  }
  if (raw.schemaVersion !== 1) {
    addIssue(issues, 'adapter-input', '$.schemaVersion', 'invalid-literal', 'must equal 1');
  }
  if (raw.recordType !== ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE) {
    addIssue(
      issues,
      'adapter-input',
      '$.recordType',
      'invalid-literal',
      `must equal ${ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE}`,
    );
  }
  if (raw.contractStatus !== 'candidate') {
    addIssue(issues, 'adapter-input', '$.contractStatus', 'claim-boundary', 'must equal candidate');
  }
  if (raw.scientificClaim !== false) {
    addIssue(issues, 'adapter-input', '$.scientificClaim', 'claim-boundary', 'must equal false');
  }
}

function prefixedPath(prefix: '$.orderedTree' | '$.squareGridInput', path: string): string {
  if (path === '$') return prefix;
  if (path.startsWith('$')) return `${prefix}${path.slice(1)}`;
  return `${prefix}.${path}`;
}

function orderedTreeIssues(
  source: readonly OrderedTreeInputIssue[],
): OrderedTreeGridQuantizationIssue[] {
  return source.map((issue) => ({
    stage: 'ordered-tree',
    path: prefixedPath('$.orderedTree', issue.path),
    code: issue.code,
    message: issue.message,
  }));
}

function squareGridIssues(
  source: readonly SquareGridCandidateInputIssue[],
): OrderedTreeGridQuantizationIssue[] {
  return source.map((issue) => ({
    stage: 'square-grid-input',
    path: prefixedPath('$.squareGridInput', issue.path),
    code: issue.code,
    message: issue.message,
  }));
}

/**
 * Prepares the exact existing square-grid candidate input shape from one
 * validated embedded ordered tree. Every tree edge maps to exactly one branch;
 * no grid candidate is enumerated and no construction or feasibility claim is
 * made by this adapter.
 */
export function adaptOrderedTreeToSquareGridCandidateInputV1(
  supplied: unknown,
): OrderedTreeGridQuantizationResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: ORDERED_TREE_GRID_QUANTIZATION_LIMITS.maxArrayLength,
    maxContainerCount: ORDERED_TREE_GRID_QUANTIZATION_LIMITS.maxContainerCount,
    maxDepth: ORDERED_TREE_GRID_QUANTIZATION_LIMITS.maxDepth,
    maxObjectPropertyCount: ORDERED_TREE_GRID_QUANTIZATION_LIMITS.maxObjectPropertyCount,
    maxPropertyNameCodeUnits: ORDERED_TREE_GRID_QUANTIZATION_LIMITS.maxPropertyNameCodeUnits,
    maxStringCodeUnits: ORDERED_TREE_GRID_QUANTIZATION_LIMITS.maxStringCodeUnits,
    maxTotalStringCodeUnits: ORDERED_TREE_GRID_QUANTIZATION_LIMITS.maxTotalStringCodeUnits,
    maxTotalPropertyCount: ORDERED_TREE_GRID_QUANTIZATION_LIMITS.maxTotalPropertyCount,
  });
  if (!snapshot.ok) {
    return {
      ok: false,
      error: deepFreezeOwned([
        {
          stage: 'snapshot' as const,
          path: '$',
          code: 'invalid-snapshot',
          message: 'adapter input must be one bounded acyclic plain snapshot without accessors',
        },
      ]),
    };
  }
  const raw = snapshot.value;
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: deepFreezeOwned([
        {
          stage: 'adapter-input' as const,
          path: '$',
          code: 'invalid-object',
          message: 'adapter input must be an object',
        },
      ]),
    };
  }

  const rootIssues: OrderedTreeGridQuantizationIssue[] = [];
  validateClosedRoot(raw, rootIssues);
  if (rootIssues.length > 0) {
    return { ok: false, error: deepFreezeOwned(rootIssues) };
  }

  const orderedTree = analyzeOrderedTreeInputV1(raw.orderedTree);
  if (!orderedTree.ok) {
    return { ok: false, error: deepFreezeOwned(orderedTreeIssues(orderedTree.error)) };
  }

  const classByEdgeId = new Map(
    orderedTree.value.derived.edgeClassifications.map((entry) => [entry.edgeId, entry.branchClass]),
  );
  const branchMapping: OrderedTreeGridBranchMappingV1[] = [];
  const branches: SquareGridCandidateInputV1['branches'][number][] = [];
  const mappingIssues: OrderedTreeGridQuantizationIssue[] = [];
  for (const edge of orderedTree.value.edges) {
    const branchClass = classByEdgeId.get(edge.id);
    if (branchClass === undefined) {
      addIssue(
        mappingIssues,
        'mapping',
        `$.orderedTree.edges.${edge.id}`,
        'missing-derived-classification',
        'every ordered-tree edge must have exactly one derived branch classification',
      );
      continue;
    }
    branches.push({ id: edge.id, branchClass, length: edge.length, width: edge.width });
    branchMapping.push({
      treeEdgeId: edge.id,
      squareGridBranchId: edge.id,
      branchClass,
      length: edge.length,
      width: edge.width,
    });
  }
  if (
    mappingIssues.length > 0 ||
    branches.length !== orderedTree.value.edges.length ||
    branchMapping.length !== orderedTree.value.edges.length
  ) {
    if (mappingIssues.length === 0) {
      addIssue(
        mappingIssues,
        'mapping',
        '$.branchMapping',
        'mapping-cardinality-mismatch',
        'tree edges and square-grid branches must have a one-to-one mapping',
      );
    }
    return { ok: false, error: deepFreezeOwned(mappingIssues) };
  }

  const prepared = parseSquareGridCandidateInputV1({
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: raw.paper,
    maxColumns: raw.maxColumns,
    maxRows: raw.maxRows,
    relativeErrorLimit: raw.relativeErrorLimit,
    branches,
  });
  if (!prepared.ok) {
    return { ok: false, error: deepFreezeOwned(squareGridIssues(prepared.error)) };
  }

  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: ORDERED_TREE_GRID_QUANTIZATION_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'ordered-tree-to-square-grid-input-adapter-only',
      mappingOrder: 'tree-edge-id-code-unit',
      enumerationIncluded: false,
      placementIncluded: false,
      packingIncluded: false,
      creasePatternIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      orderedTree: orderedTree.value,
      squareGridInput: prepared.value,
      branchMapping,
    }),
  };
}
