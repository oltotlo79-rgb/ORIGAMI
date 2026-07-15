import { deepFreezeOwned } from '../clone-and-freeze.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  type OrderedTreeGridQuantizationInputV1,
  type OrderedTreeGridQuantizationResultV1,
} from './ordered-tree-grid-quantization.js';
import {
  enumerateOrderedTreeSquareGridCandidatesV1,
  type OrderedTreeSquareGridCandidateIssue,
} from './ordered-tree-square-grid-candidates.js';
import {
  type SquareGridBranchClass,
  type SquareGridCandidateBranchInputV1,
  type SquareGridCandidateV1,
} from './square-grid-candidates.js';

export const ORDERED_TREE_PATH_DEMAND_INPUT_RECORD_TYPE =
  'm0f-ordered-tree-path-demand-input' as const;
export const ORDERED_TREE_PATH_DEMAND_RESULT_RECORD_TYPE =
  'm0f-ordered-tree-path-demand-result' as const;

/**
 * Defensive parser ceilings only. They cover the existing ordered-tree input
 * maximums plus this boundary's two-field wrapper; they are not a support or
 * feasibility profile.
 */
export const ORDERED_TREE_PATH_DEMAND_LIMITS = deepFreezeOwned({
  maxArrayLength: 40,
  maxContainerCount: 320,
  maxDepth: 8,
  maxObjectPropertyCount: 12,
  maxPropertyNameCodeUnits: 64,
  maxStringCodeUnits: 4_096,
  maxTotalStringCodeUnits: 262_144,
  maxTotalPropertyCount: 2_048,
  maxLeaves: 20,
  maxLeafPairs: 190,
  maxTreeEdges: 39,
});

export type OrderedTreePathDemandInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof ORDERED_TREE_PATH_DEMAND_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  source: OrderedTreeGridQuantizationInputV1;
  candidateId: string;
}>;

export type OrderedTreePathDemandEdgeV1 = Readonly<{
  treeEdgeId: string;
  branchClass: SquareGridBranchClass;
  /** Canonical nonnegative base-10 integer copied from the referenced candidate. */
  lengthSteps: string;
  /** Canonical nonnegative base-10 integer copied from the referenced candidate. */
  widthSteps: string;
}>;

export type OrderedTreeLeafPairPathDemandV1 = Readonly<{
  firstLeafId: string;
  secondLeafId: string;
  edgeOrder: 'first-leaf-to-second-leaf';
  edges: readonly OrderedTreePathDemandEdgeV1[];
  /** Canonical nonnegative base-10 integer. */
  totalLengthSteps: string;
  /** Canonical nonnegative base-10 integer. */
  maximumWidthSteps: string;
}>;

export type OrderedTreePathDemandResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof ORDERED_TREE_PATH_DEMAND_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'metric-independent-tree-path-demand-only';
  interpretation: 'metric-independent tree path demand only';
  lengthAggregation: 'sum-of-path-edge-length-steps';
  widthAggregation: 'maximum-path-edge-width-steps-without-packing-semantics';
  candidateReferenceMode: 'caller-supplied-id-re-enumerated-from-embedded-source';
  automaticCandidateSelectionIncluded: false;
  metricSelectionIncluded: false;
  placementIncluded: false;
  packingIncluded: false;
  polygonRiverPackingIncluded: false;
  hingeConstructionIncluded: false;
  ridgeConstructionIncluded: false;
  axialConstructionIncluded: false;
  creasePatternIncluded: false;
  mountainValleyIncluded: false;
  foldabilityIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  /** Full caller-referenced candidate; retaining this is not automatic selection. */
  candidateReference: SquareGridCandidateV1;
  sourceBinding: Readonly<{
    treeEdgeCount: number;
    mappedBranchCount: number;
    candidateBranchQuantizationCount: number;
  }>;
  leafOrder: 'node-id-code-unit';
  leafPairOrder: 'first-leaf-id-then-second-leaf-id-code-unit';
  leafNodeIds: readonly string[];
  leafPairCount: number;
  pathDemands: readonly OrderedTreeLeafPairPathDemandV1[];
}>;

export type OrderedTreePathDemandIssue = Readonly<{
  stage:
    | 'snapshot'
    | 'path-demand-input'
    | 'source-enumeration'
    | 'candidate-reference'
    | 'source-binding'
    | 'tree-path';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
}>;

export type OrderedTreePathDemandBuildResult =
  | Readonly<{ ok: true; value: OrderedTreePathDemandResultV1 }>
  | Readonly<{ ok: false; error: readonly OrderedTreePathDemandIssue[] }>;

type OrderedTreePathDemandFailure = Extract<OrderedTreePathDemandBuildResult, { ok: false }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'source',
  'candidateId',
] as const;
const NONNEGATIVE_DECIMAL_PATTERN = /^(?:0|[1-9][0-9]*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function oneIssue(
  stage: OrderedTreePathDemandIssue['stage'],
  path: string,
  code: string,
  message: string,
  sourceStage?: string,
): OrderedTreePathDemandFailure {
  const issue: OrderedTreePathDemandIssue =
    sourceStage === undefined
      ? { stage, path, code, message }
      : { stage, path, code, message, sourceStage };
  return { ok: false, error: deepFreezeOwned([issue]) };
}

function validateClosedRoot(raw: Record<string, unknown>): readonly OrderedTreePathDemandIssue[] {
  const issues: OrderedTreePathDemandIssue[] = [];
  const allowed = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      issues.push({
        stage: 'path-demand-input',
        path: `$.${key}`,
        code: 'unknown-field',
        message: 'field is not declared by path-demand input v1',
      });
    }
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      issues.push({
        stage: 'path-demand-input',
        path: `$.${key}`,
        code: 'missing-field',
        message: 'required field is missing',
      });
    }
  }
  if (raw.schemaVersion !== 1) {
    issues.push({
      stage: 'path-demand-input',
      path: '$.schemaVersion',
      code: 'invalid-literal',
      message: 'must equal 1',
    });
  }
  if (raw.recordType !== ORDERED_TREE_PATH_DEMAND_INPUT_RECORD_TYPE) {
    issues.push({
      stage: 'path-demand-input',
      path: '$.recordType',
      code: 'invalid-literal',
      message: `must equal ${ORDERED_TREE_PATH_DEMAND_INPUT_RECORD_TYPE}`,
    });
  }
  if (raw.contractStatus !== 'candidate') {
    issues.push({
      stage: 'path-demand-input',
      path: '$.contractStatus',
      code: 'claim-boundary',
      message: 'must equal candidate',
    });
  }
  if (raw.scientificClaim !== false) {
    issues.push({
      stage: 'path-demand-input',
      path: '$.scientificClaim',
      code: 'claim-boundary',
      message: 'must equal false',
    });
  }
  if (
    typeof raw.candidateId !== 'string' ||
    raw.candidateId.length === 0 ||
    raw.candidateId.length > ORDERED_TREE_PATH_DEMAND_LIMITS.maxStringCodeUnits
  ) {
    issues.push({
      stage: 'path-demand-input',
      path: '$.candidateId',
      code: 'invalid-candidate-id',
      message: 'must be a nonempty bounded string',
    });
  }
  return issues;
}

function prefixedSourcePath(path: string): string {
  if (path === '$') return '$.source';
  if (path.startsWith('$')) return `$.source${path.slice(1)}`;
  return `$.source.${path}`;
}

function sourceIssues(
  issues: readonly OrderedTreeSquareGridCandidateIssue[],
): readonly OrderedTreePathDemandIssue[] {
  return issues.map((issue) => ({
    stage: 'source-enumeration' as const,
    path: prefixedSourcePath(issue.path),
    code: issue.code,
    message: issue.message,
    sourceStage: `${issue.stage}/${issue.sourceStage}`,
  }));
}

function canonicalSteps(value: string): bigint | undefined {
  if (!NONNEGATIVE_DECIMAL_PATTERN.test(value)) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

type BoundQuantization = Readonly<{
  branchClass: SquareGridBranchClass;
  lengthSteps: string;
  widthSteps: string;
  length: bigint;
  width: bigint;
}>;

type BoundSource = Readonly<{
  adapter: OrderedTreeGridQuantizationResultV1;
  quantizationByEdgeId: ReadonlyMap<string, BoundQuantization>;
}>;

function bindCandidateToTree(
  adapter: OrderedTreeGridQuantizationResultV1,
  sourceBranches: readonly SquareGridCandidateBranchInputV1[],
  candidate: SquareGridCandidateV1,
): BoundSource | OrderedTreePathDemandFailure {
  const treeEdges = adapter.orderedTree.edges;
  const mappings = adapter.branchMapping;
  const squareBranches = adapter.squareGridInput.branches;
  const quantizations = candidate.branchQuantizations;
  const edgeCount = treeEdges.length;
  if (
    edgeCount === 0 ||
    edgeCount > ORDERED_TREE_PATH_DEMAND_LIMITS.maxTreeEdges ||
    mappings.length !== edgeCount ||
    squareBranches.length !== edgeCount ||
    sourceBranches.length !== edgeCount ||
    quantizations.length !== edgeCount
  ) {
    return oneIssue(
      'source-binding',
      '$.source',
      'mapping-cardinality-mismatch',
      'tree edges, mappings, source branches, and candidate quantizations must have equal cardinality',
    );
  }

  const mappingByEdgeId = new Map(mappings.map((entry) => [entry.treeEdgeId, entry]));
  const squareBranchById = new Map(squareBranches.map((entry) => [entry.id, entry]));
  const sourceBranchById = new Map(sourceBranches.map((entry) => [entry.id, entry]));
  const candidateBranchById = new Map(
    quantizations.map((entry) => [entry.branchId, entry] as const),
  );
  if (
    mappingByEdgeId.size !== edgeCount ||
    squareBranchById.size !== edgeCount ||
    sourceBranchById.size !== edgeCount ||
    candidateBranchById.size !== edgeCount
  ) {
    return oneIssue(
      'source-binding',
      '$.source',
      'duplicate-edge-mapping',
      'every tree edge must have exactly one distinct mapping and quantization',
    );
  }

  const classificationByEdgeId = new Map(
    adapter.orderedTree.derived.edgeClassifications.map((entry) => [
      entry.edgeId,
      entry.branchClass,
    ]),
  );
  if (classificationByEdgeId.size !== edgeCount) {
    return oneIssue(
      'source-binding',
      '$.source.orderedTree.edges',
      'classification-cardinality-mismatch',
      'every tree edge must have exactly one derived branch classification',
    );
  }

  const bound = new Map<string, BoundQuantization>();
  for (const edge of treeEdges) {
    const mapping = mappingByEdgeId.get(edge.id);
    const squareBranch = squareBranchById.get(edge.id);
    const sourceBranch = sourceBranchById.get(edge.id);
    const candidateBranch = candidateBranchById.get(edge.id);
    const branchClass = classificationByEdgeId.get(edge.id);
    if (
      mapping === undefined ||
      squareBranch === undefined ||
      sourceBranch === undefined ||
      candidateBranch === undefined ||
      branchClass === undefined ||
      mapping.squareGridBranchId !== edge.id ||
      mapping.branchClass !== branchClass ||
      mapping.length !== edge.length ||
      mapping.width !== edge.width ||
      squareBranch.branchClass !== branchClass ||
      squareBranch.length !== edge.length ||
      squareBranch.width !== edge.width ||
      sourceBranch.branchClass !== branchClass ||
      sourceBranch.length !== edge.length ||
      sourceBranch.width !== edge.width ||
      candidateBranch.branchClass !== branchClass ||
      candidateBranch.length.sourceValue !== edge.length ||
      candidateBranch.width.sourceValue !== edge.width
    ) {
      return oneIssue(
        'source-binding',
        `$.source.orderedTree.edges.${edge.id}`,
        'edge-source-binding-mismatch',
        'tree edge, adapter mapping, source branch, and candidate quantization must agree exactly',
      );
    }
    const length = canonicalSteps(candidateBranch.length.steps);
    const width = canonicalSteps(candidateBranch.width.steps);
    if (length === undefined || width === undefined) {
      return oneIssue(
        'source-binding',
        `$.candidate.${candidate.candidateId}.branchQuantizations.${edge.id}`,
        'invalid-step-integer',
        'candidate branch steps must be canonical nonnegative base-10 integers',
      );
    }
    bound.set(edge.id, {
      branchClass,
      lengthSteps: candidateBranch.length.steps,
      widthSteps: candidateBranch.width.steps,
      length,
      width,
    });
  }
  return { adapter, quantizationByEdgeId: bound };
}

type AdjacencyEntry = Readonly<{ neighborId: string; edgeId: string }>;

function pathEdgeIds(
  firstLeafId: string,
  secondLeafId: string,
  adjacency: ReadonlyMap<string, readonly AdjacencyEntry[]>,
  maximumEdgeCount: number,
): readonly string[] | undefined {
  const queue = [firstLeafId];
  const visited = new Set([firstLeafId]);
  const predecessor = new Map<string, AdjacencyEntry>();
  for (const nodeId of queue) {
    if (nodeId === secondLeafId) break;
    for (const entry of adjacency.get(nodeId) ?? []) {
      if (visited.has(entry.neighborId)) continue;
      visited.add(entry.neighborId);
      predecessor.set(entry.neighborId, { neighborId: nodeId, edgeId: entry.edgeId });
      queue.push(entry.neighborId);
    }
  }
  if (!visited.has(secondLeafId)) return undefined;

  const reversed: string[] = [];
  let nodeId = secondLeafId;
  while (nodeId !== firstLeafId) {
    const entry = predecessor.get(nodeId);
    if (entry === undefined || reversed.length >= maximumEdgeCount) return undefined;
    reversed.push(entry.edgeId);
    nodeId = entry.neighborId;
  }
  reversed.reverse();
  return reversed;
}

function buildPathDemands(
  bound: BoundSource,
): readonly OrderedTreeLeafPairPathDemandV1[] | OrderedTreePathDemandFailure {
  const tree = bound.adapter.orderedTree;
  const leaves = tree.derived.leafNodeIds;
  if (
    leaves.length < 2 ||
    leaves.length > ORDERED_TREE_PATH_DEMAND_LIMITS.maxLeaves ||
    leaves.some(
      (leafId, index) => index > 0 && compareCodeUnits(leaves[index - 1] ?? '', leafId) >= 0,
    )
  ) {
    return oneIssue(
      'tree-path',
      '$.source.orderedTree.derived.leafNodeIds',
      'invalid-leaf-order-or-cardinality',
      'leaf IDs must be unique, strictly code-unit ordered, and within the bounded leaf count',
    );
  }

  const adjacency = new Map<string, AdjacencyEntry[]>();
  for (const node of tree.nodes) adjacency.set(node.id, []);
  if (adjacency.size !== tree.nodes.length) {
    return oneIssue(
      'tree-path',
      '$.source.orderedTree.nodes',
      'duplicate-node-id',
      'tree nodes must have distinct IDs',
    );
  }
  for (const edge of tree.edges) {
    const from = adjacency.get(edge.from);
    const to = adjacency.get(edge.to);
    if (from === undefined || to === undefined) {
      return oneIssue(
        'tree-path',
        `$.source.orderedTree.edges.${edge.id}`,
        'missing-edge-endpoint',
        'every path edge endpoint must reference one tree node',
      );
    }
    from.push({ neighborId: edge.to, edgeId: edge.id });
    to.push({ neighborId: edge.from, edgeId: edge.id });
  }
  for (const entries of adjacency.values()) {
    entries.sort((left, right) => {
      const neighborOrder = compareCodeUnits(left.neighborId, right.neighborId);
      return neighborOrder !== 0 ? neighborOrder : compareCodeUnits(left.edgeId, right.edgeId);
    });
  }

  const pathDemands: OrderedTreeLeafPairPathDemandV1[] = [];
  for (let firstIndex = 0; firstIndex < leaves.length - 1; firstIndex += 1) {
    const firstLeafId = leaves[firstIndex];
    if (firstLeafId === undefined) {
      return oneIssue('tree-path', '$.pathDemands', 'missing-leaf', 'leaf pair is incomplete');
    }
    for (let secondIndex = firstIndex + 1; secondIndex < leaves.length; secondIndex += 1) {
      const secondLeafId = leaves[secondIndex];
      if (secondLeafId === undefined) {
        return oneIssue('tree-path', '$.pathDemands', 'missing-leaf', 'leaf pair is incomplete');
      }
      const edgeIds = pathEdgeIds(firstLeafId, secondLeafId, adjacency, tree.edges.length);
      if (
        edgeIds === undefined ||
        edgeIds.length === 0 ||
        new Set(edgeIds).size !== edgeIds.length
      ) {
        return oneIssue(
          'tree-path',
          `$.pathDemands.${firstLeafId}.${secondLeafId}`,
          'non-unique-or-missing-tree-path',
          'each distinct leaf pair must have one nonempty simple tree path',
        );
      }

      const edges: OrderedTreePathDemandEdgeV1[] = [];
      let totalLength = 0n;
      let maximumWidth = 0n;
      for (const edgeId of edgeIds) {
        const quantization = bound.quantizationByEdgeId.get(edgeId);
        if (quantization === undefined) {
          return oneIssue(
            'tree-path',
            `$.pathDemands.${firstLeafId}.${secondLeafId}.${edgeId}`,
            'missing-edge-quantization',
            'every path edge must retain its source-bound candidate quantization',
          );
        }
        totalLength += quantization.length;
        if (quantization.width > maximumWidth) maximumWidth = quantization.width;
        edges.push({
          treeEdgeId: edgeId,
          branchClass: quantization.branchClass,
          lengthSteps: quantization.lengthSteps,
          widthSteps: quantization.widthSteps,
        });
      }
      pathDemands.push({
        firstLeafId,
        secondLeafId,
        edgeOrder: 'first-leaf-to-second-leaf',
        edges,
        totalLengthSteps: totalLength.toString(),
        maximumWidthSteps: maximumWidth.toString(),
      });
    }
  }

  const expectedPairCount = (leaves.length * (leaves.length - 1)) / 2;
  if (
    pathDemands.length !== expectedPairCount ||
    pathDemands.length > ORDERED_TREE_PATH_DEMAND_LIMITS.maxLeafPairs
  ) {
    return oneIssue(
      'tree-path',
      '$.pathDemands',
      'leaf-pair-cardinality-mismatch',
      'path demand count must equal the unordered leaf-pair cardinality',
    );
  }
  return pathDemands;
}

function isFailure(
  value: BoundSource | readonly OrderedTreeLeafPairPathDemandV1[] | OrderedTreePathDemandFailure,
): value is OrderedTreePathDemandFailure {
  return isRecord(value) && 'error' in value;
}

/**
 * Re-enumerates the embedded ordered-tree source and resolves exactly the
 * caller-referenced candidate ID. It then derives the unique tree path for
 * every unordered leaf pair and sums only that candidate's integer edge
 * demands. No candidate is chosen automatically and no packing metric,
 * placement, crease construction, feasibility, or GO claim is produced.
 */
export function buildOrderedTreePathDemandsV1(supplied: unknown): OrderedTreePathDemandBuildResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: ORDERED_TREE_PATH_DEMAND_LIMITS.maxArrayLength,
    maxContainerCount: ORDERED_TREE_PATH_DEMAND_LIMITS.maxContainerCount,
    maxDepth: ORDERED_TREE_PATH_DEMAND_LIMITS.maxDepth,
    maxObjectPropertyCount: ORDERED_TREE_PATH_DEMAND_LIMITS.maxObjectPropertyCount,
    maxPropertyNameCodeUnits: ORDERED_TREE_PATH_DEMAND_LIMITS.maxPropertyNameCodeUnits,
    maxStringCodeUnits: ORDERED_TREE_PATH_DEMAND_LIMITS.maxStringCodeUnits,
    maxTotalStringCodeUnits: ORDERED_TREE_PATH_DEMAND_LIMITS.maxTotalStringCodeUnits,
    maxTotalPropertyCount: ORDERED_TREE_PATH_DEMAND_LIMITS.maxTotalPropertyCount,
  });
  if (!snapshot.ok) {
    return oneIssue(
      'snapshot',
      '$',
      'invalid-snapshot',
      'input must be one bounded acyclic plain snapshot without accessors',
    );
  }
  if (!isRecord(snapshot.value)) {
    return oneIssue(
      'path-demand-input',
      '$',
      'invalid-object',
      'path-demand input must be an object',
    );
  }

  const rootIssues = validateClosedRoot(snapshot.value);
  if (rootIssues.length > 0) return { ok: false, error: deepFreezeOwned(rootIssues) };
  const candidateId = snapshot.value.candidateId;
  if (typeof candidateId !== 'string') {
    throw new TypeError('candidate ID was already validated');
  }

  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(snapshot.value.source);
  if (!enumerated.ok) {
    return { ok: false, error: deepFreezeOwned(sourceIssues(enumerated.error)) };
  }
  const matches = enumerated.value.quantization.candidates.filter(
    (candidate) => candidate.candidateId === candidateId,
  );
  if (matches.length === 0) {
    return oneIssue(
      'candidate-reference',
      '$.candidateId',
      'candidate-not-found',
      'candidate ID is not present in the bounded source enumeration',
    );
  }
  if (matches.length !== 1 || matches[0] === undefined) {
    return oneIssue(
      'source-binding',
      '$.candidateId',
      'duplicate-candidate-id',
      'the bounded source enumeration must contain each candidate ID exactly once',
    );
  }
  const candidate = matches[0];
  const bound = bindCandidateToTree(
    enumerated.value.adapter,
    enumerated.value.quantization.sourceBranches,
    candidate,
  );
  if (isFailure(bound)) return bound;

  const pathDemands = buildPathDemands(bound);
  if (isFailure(pathDemands)) return pathDemands;
  const leafNodeIds = bound.adapter.orderedTree.derived.leafNodeIds;

  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: ORDERED_TREE_PATH_DEMAND_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'metric-independent-tree-path-demand-only',
      interpretation: 'metric-independent tree path demand only',
      lengthAggregation: 'sum-of-path-edge-length-steps',
      widthAggregation: 'maximum-path-edge-width-steps-without-packing-semantics',
      candidateReferenceMode: 'caller-supplied-id-re-enumerated-from-embedded-source',
      automaticCandidateSelectionIncluded: false,
      metricSelectionIncluded: false,
      placementIncluded: false,
      packingIncluded: false,
      polygonRiverPackingIncluded: false,
      hingeConstructionIncluded: false,
      ridgeConstructionIncluded: false,
      axialConstructionIncluded: false,
      creasePatternIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      candidateReference: candidate,
      sourceBinding: {
        treeEdgeCount: bound.adapter.orderedTree.edges.length,
        mappedBranchCount: bound.adapter.branchMapping.length,
        candidateBranchQuantizationCount: candidate.branchQuantizations.length,
      },
      leafOrder: 'node-id-code-unit',
      leafPairOrder: 'first-leaf-id-then-second-leaf-id-code-unit',
      leafNodeIds,
      leafPairCount: pathDemands.length,
      pathDemands,
    }),
  };
}
