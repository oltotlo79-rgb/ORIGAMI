import { deepFreezeOwned } from '../clone-and-freeze.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';

export const ORDERED_TREE_INPUT_RECORD_TYPE = 'm0f-ordered-tree-input' as const;
export const ORDERED_TREE_RESULT_RECORD_TYPE = 'm0f-ordered-tree-input-result' as const;

/**
 * Defensive implementation ceilings only. They bound validation work and are
 * not a SupportProfile or a claim that every accepted tree is constructible.
 */
export const ORDERED_TREE_INPUT_LIMITS = deepFreezeOwned({
  minLeaves: 2,
  maxLeaves: 20,
  maxNodes: 40,
  maxEdges: 39,
  maxDegree: 20,
  maxIdCodeUnits: 128,
  maxLabelCodeUnits: 256,
  maxSnapshotStringCodeUnits: 4_096,
  maxSnapshotArrayLength: 40,
  maxSnapshotContainerCount: 512,
  maxSnapshotDepth: 6,
  maxSnapshotObjectPropertyCount: 8,
  maxSnapshotPropertyNameCodeUnits: 64,
  maxSnapshotTotalStringCodeUnits: 131_072,
  maxSnapshotTotalPropertyCount: 1_024,
});

export type OrderedTreeNodeV1 = Readonly<{
  id: string;
  pos: Readonly<{ x: number; y: number }>;
  label: string;
  mirrorOf: string | null;
  onSymmetryAxis: boolean;
}>;

export type OrderedTreeEdgeV1 = Readonly<{
  id: string;
  from: string;
  to: string;
  length: number;
  width: number;
  label: string;
  mirrorOf: string | null;
}>;

export type OrderedTreeRotationEntryV1 = Readonly<{
  nodeId: string;
  /** Semantic cyclic order; never sorted or inferred from pos. */
  edgeIds: readonly string[];
}>;

export type OrderedTreeInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof ORDERED_TREE_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  nodes: readonly OrderedTreeNodeV1[];
  edges: readonly OrderedTreeEdgeV1[];
  rotation: readonly OrderedTreeRotationEntryV1[];
}>;

export type OrderedTreeInputIssue = Readonly<{
  path: string;
  code:
    | 'invalid-snapshot'
    | 'invalid-object'
    | 'invalid-array'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'claim-boundary'
    | 'invalid-id'
    | 'duplicate-id'
    | 'invalid-string'
    | 'invalid-boolean'
    | 'non-finite-number'
    | 'invalid-bound'
    | 'missing-reference'
    | 'duplicate-reference'
    | 'edge-count-mismatch'
    | 'tree-self-loop'
    | 'tree-parallel-edge'
    | 'tree-cycle'
    | 'tree-disconnected'
    | 'degree-limit-exceeded'
    | 'leaf-count-out-of-range'
    | 'rotation-coverage-mismatch'
    | 'rotation-incidence-mismatch'
    | 'mirror-reference-mismatch'
    | 'mirror-reciprocity-mismatch'
    | 'mirror-axis-mismatch'
    | 'mirror-dimension-mismatch'
    | 'mirror-endpoint-mismatch'
    | 'mirror-rotation-mismatch';
  message: string;
}>;

export type OrderedTreeInputParseResult =
  | Readonly<{ ok: true; value: OrderedTreeInputV1 }>
  | Readonly<{ ok: false; error: readonly OrderedTreeInputIssue[] }>;

export type OrderedTreeNodeClassificationV1 = Readonly<{
  nodeId: string;
  degree: number;
  nodeClass: 'leaf' | 'internal';
}>;

export type OrderedTreeEdgeClassificationV1 = Readonly<{
  edgeId: string;
  branchClass: 'terminal' | 'internal';
}>;

export type OrderedTreeInputResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof ORDERED_TREE_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'ordered-tree-input-validation-only';
  nodeOrder: 'node-id-code-unit';
  edgeOrder: 'edge-id-code-unit';
  rotationEntryOrder: 'node-id-code-unit';
  rotationEdgeOrder: 'caller-supplied-cyclic-order-preserved';
  positionQuantizationIncluded: false;
  positionEvidenceIncluded: false;
  labelEvidenceIncluded: false;
  placementIncluded: false;
  packingIncluded: false;
  creasePatternIncluded: false;
  pleatRoutingIncluded: false;
  mountainValleyIncluded: false;
  foldabilityIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  nodes: readonly OrderedTreeNodeV1[];
  edges: readonly OrderedTreeEdgeV1[];
  rotation: readonly OrderedTreeRotationEntryV1[];
  derived: Readonly<{
    counts: Readonly<{
      nodes: number;
      edges: number;
      leaves: number;
      internalNodes: number;
      terminalEdges: number;
      internalEdges: number;
      maximumDegree: number;
    }>;
    nodeClassifications: readonly OrderedTreeNodeClassificationV1[];
    edgeClassifications: readonly OrderedTreeEdgeClassificationV1[];
    leafNodeIds: readonly string[];
    internalNodeIds: readonly string[];
    terminalEdgeIds: readonly string[];
    internalEdgeIds: readonly string[];
  }>;
}>;

export type OrderedTreeInputAnalysisResult =
  | Readonly<{ ok: true; value: OrderedTreeInputResultV1 }>
  | Readonly<{ ok: false; error: readonly OrderedTreeInputIssue[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'nodes',
  'edges',
  'rotation',
] as const;
const NODE_KEYS = ['id', 'pos', 'label', 'mirrorOf', 'onSymmetryAxis'] as const;
const POSITION_KEYS = ['x', 'y'] as const;
const EDGE_KEYS = ['id', 'from', 'to', 'length', 'width', 'label', 'mirrorOf'] as const;
const ROTATION_KEYS = ['nodeId', 'edgeIds'] as const;
const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizedNumber(value: number): number {
  return value === 0 ? 0 : value;
}

function addIssue(
  issues: OrderedTreeInputIssue[],
  path: string,
  code: OrderedTreeInputIssue['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function closedKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  issues: OrderedTreeInputIssue[],
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      addIssue(issues, `${path}.${key}`, 'unknown-field', 'field is not declared by input v1');
    }
  }
  for (const key of allowedKeys) {
    if (!Object.hasOwn(value, key)) {
      addIssue(issues, `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function stableId(value: unknown, path: string, issues: OrderedTreeInputIssue[]): value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    addIssue(
      issues,
      path,
      'invalid-id',
      `must be a stable ASCII ID of 1..${String(ORDERED_TREE_INPUT_LIMITS.maxIdCodeUnits)} characters`,
    );
    return false;
  }
  return true;
}

function registerId(
  value: unknown,
  path: string,
  seen: Map<string, string>,
  issues: OrderedTreeInputIssue[],
): value is string {
  if (!stableId(value, path, issues)) return false;
  const previous = seen.get(value);
  if (previous !== undefined) {
    addIssue(issues, path, 'duplicate-id', `${value} is already declared at ${previous}`);
    return false;
  }
  seen.set(value, path);
  return true;
}

function boundedString(
  value: unknown,
  path: string,
  issues: OrderedTreeInputIssue[],
): value is string {
  if (typeof value !== 'string' || value.length > ORDERED_TREE_INPUT_LIMITS.maxLabelCodeUnits) {
    addIssue(
      issues,
      path,
      'invalid-string',
      `must be a string of at most ${String(ORDERED_TREE_INPUT_LIMITS.maxLabelCodeUnits)} UTF-16 code units`,
    );
    return false;
  }
  return true;
}

function finiteNumber(
  value: unknown,
  path: string,
  issues: OrderedTreeInputIssue[],
): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    addIssue(issues, path, 'non-finite-number', 'must be a finite binary64 number');
    return false;
  }
  return true;
}

function mirrorReference(
  value: unknown,
  path: string,
  issues: OrderedTreeInputIssue[],
): value is string | null {
  if (value === null) return true;
  return stableId(value, path, issues);
}

function undirectedEndpointKey(first: string, second: string): string {
  return compareCodeUnits(first, second) <= 0 ? `${first}\0${second}` : `${second}\0${first}`;
}

function sameUndirectedEndpoints(
  leftFrom: string,
  leftTo: string,
  rightFrom: string,
  rightTo: string,
): boolean {
  return undirectedEndpointKey(leftFrom, leftTo) === undirectedEndpointKey(rightFrom, rightTo);
}

function cyclicSequencesEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  if (left.length === 0) return true;
  for (let offset = 0; offset < right.length; offset += 1) {
    let matches = true;
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[(index + offset) % right.length]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
}

function parseNodes(
  supplied: unknown,
  seenIds: Map<string, string>,
  issues: OrderedTreeInputIssue[],
): OrderedTreeNodeV1[] {
  const nodes: OrderedTreeNodeV1[] = [];
  if (!Array.isArray(supplied)) {
    addIssue(issues, '$.nodes', 'invalid-array', 'nodes must be an array');
    return nodes;
  }
  if (supplied.length < 2 || supplied.length > ORDERED_TREE_INPUT_LIMITS.maxNodes) {
    addIssue(
      issues,
      '$.nodes',
      'invalid-bound',
      `must contain 2..${String(ORDERED_TREE_INPUT_LIMITS.maxNodes)} nodes`,
    );
  }
  supplied.forEach((entry, index) => {
    const path = `$.nodes[${String(index)}]`;
    if (!isRecord(entry)) {
      addIssue(issues, path, 'invalid-object', 'node must be an object');
      return;
    }
    closedKeys(entry, NODE_KEYS, path, issues);
    const idOk = registerId(entry.id, `${path}.id`, seenIds, issues);

    let position: { x: number; y: number } | undefined;
    const suppliedPosition = entry.pos;
    if (!isRecord(suppliedPosition)) {
      addIssue(issues, `${path}.pos`, 'invalid-object', 'pos must be an object');
    } else {
      closedKeys(suppliedPosition, POSITION_KEYS, `${path}.pos`, issues);
      const x = suppliedPosition.x;
      const y = suppliedPosition.y;
      const xOk = finiteNumber(x, `${path}.pos.x`, issues);
      const yOk = finiteNumber(y, `${path}.pos.y`, issues);
      if (xOk && yOk) {
        position = { x: normalizedNumber(x), y: normalizedNumber(y) };
      }
    }

    const label = entry.label;
    const mirrorOf = entry.mirrorOf;
    const onSymmetryAxis = entry.onSymmetryAxis;
    const labelOk = boundedString(label, `${path}.label`, issues);
    const mirrorOk = mirrorReference(mirrorOf, `${path}.mirrorOf`, issues);
    const axisOk = typeof onSymmetryAxis === 'boolean';
    if (!axisOk) {
      addIssue(issues, `${path}.onSymmetryAxis`, 'invalid-boolean', 'must be a boolean');
    }
    if (
      idOk &&
      typeof entry.id === 'string' &&
      position !== undefined &&
      labelOk &&
      typeof label === 'string' &&
      mirrorOk &&
      axisOk &&
      typeof onSymmetryAxis === 'boolean'
    ) {
      nodes.push({
        id: entry.id,
        pos: position,
        label,
        mirrorOf,
        onSymmetryAxis,
      });
    }
  });
  return nodes;
}

function parseEdges(
  supplied: unknown,
  seenIds: Map<string, string>,
  issues: OrderedTreeInputIssue[],
): OrderedTreeEdgeV1[] {
  const edges: OrderedTreeEdgeV1[] = [];
  if (!Array.isArray(supplied)) {
    addIssue(issues, '$.edges', 'invalid-array', 'edges must be an array');
    return edges;
  }
  if (supplied.length < 1 || supplied.length > ORDERED_TREE_INPUT_LIMITS.maxEdges) {
    addIssue(
      issues,
      '$.edges',
      'invalid-bound',
      `must contain 1..${String(ORDERED_TREE_INPUT_LIMITS.maxEdges)} edges`,
    );
  }
  supplied.forEach((entry, index) => {
    const path = `$.edges[${String(index)}]`;
    if (!isRecord(entry)) {
      addIssue(issues, path, 'invalid-object', 'edge must be an object');
      return;
    }
    closedKeys(entry, EDGE_KEYS, path, issues);
    const id = entry.id;
    const from = entry.from;
    const to = entry.to;
    const length = entry.length;
    const width = entry.width;
    const label = entry.label;
    const mirrorOf = entry.mirrorOf;
    const idOk = registerId(id, `${path}.id`, seenIds, issues);
    const fromOk = stableId(from, `${path}.from`, issues);
    const toOk = stableId(to, `${path}.to`, issues);
    const lengthOk = finiteNumber(length, `${path}.length`, issues);
    if (lengthOk && length <= 0) {
      addIssue(issues, `${path}.length`, 'invalid-bound', 'length must be greater than zero');
    }
    const widthOk = finiteNumber(width, `${path}.width`, issues);
    if (widthOk && width < 0) {
      addIssue(issues, `${path}.width`, 'invalid-bound', 'width must be nonnegative');
    }
    const labelOk = boundedString(label, `${path}.label`, issues);
    const mirrorOk = mirrorReference(mirrorOf, `${path}.mirrorOf`, issues);
    if (
      idOk &&
      typeof id === 'string' &&
      fromOk &&
      typeof from === 'string' &&
      toOk &&
      typeof to === 'string' &&
      lengthOk &&
      length > 0 &&
      widthOk &&
      width >= 0 &&
      labelOk &&
      typeof label === 'string' &&
      mirrorOk
    ) {
      edges.push({
        id,
        from,
        to,
        length: normalizedNumber(length),
        width: normalizedNumber(width),
        label,
        mirrorOf,
      });
    }
  });
  return edges;
}

function parseRotation(
  supplied: unknown,
  issues: OrderedTreeInputIssue[],
): OrderedTreeRotationEntryV1[] {
  const rotation: OrderedTreeRotationEntryV1[] = [];
  if (!Array.isArray(supplied)) {
    addIssue(issues, '$.rotation', 'invalid-array', 'rotation must be an array');
    return rotation;
  }
  if (supplied.length > ORDERED_TREE_INPUT_LIMITS.maxNodes) {
    addIssue(
      issues,
      '$.rotation',
      'invalid-bound',
      `must contain no more than ${String(ORDERED_TREE_INPUT_LIMITS.maxNodes)} entries`,
    );
  }
  supplied.forEach((entry, index) => {
    const path = `$.rotation[${String(index)}]`;
    if (!isRecord(entry)) {
      addIssue(issues, path, 'invalid-object', 'rotation entry must be an object');
      return;
    }
    closedKeys(entry, ROTATION_KEYS, path, issues);
    const nodeIdOk = stableId(entry.nodeId, `${path}.nodeId`, issues);
    const edgeIds: string[] = [];
    let edgeIdsOk = true;
    if (!Array.isArray(entry.edgeIds)) {
      addIssue(issues, `${path}.edgeIds`, 'invalid-array', 'edgeIds must be an array');
      edgeIdsOk = false;
    } else if (entry.edgeIds.length > ORDERED_TREE_INPUT_LIMITS.maxDegree) {
      addIssue(
        issues,
        `${path}.edgeIds`,
        'degree-limit-exceeded',
        `rotation degree exceeds defensive limit ${String(ORDERED_TREE_INPUT_LIMITS.maxDegree)}`,
      );
      edgeIdsOk = false;
    } else {
      const referenced = new Set<string>();
      entry.edgeIds.forEach((edgeId, edgeIndex) => {
        const edgePath = `${path}.edgeIds[${String(edgeIndex)}]`;
        if (!stableId(edgeId, edgePath, issues)) {
          edgeIdsOk = false;
        } else if (referenced.has(edgeId)) {
          addIssue(
            issues,
            edgePath,
            'duplicate-reference',
            'each incident edge must occur exactly once in a node rotation',
          );
          edgeIdsOk = false;
        } else {
          referenced.add(edgeId);
          edgeIds.push(edgeId);
        }
      });
    }
    if (nodeIdOk && typeof entry.nodeId === 'string' && edgeIdsOk) {
      rotation.push({ nodeId: entry.nodeId, edgeIds });
    }
  });
  return rotation;
}

function validateTreeStructure(
  nodes: readonly OrderedTreeNodeV1[],
  edges: readonly OrderedTreeEdgeV1[],
  rotation: readonly OrderedTreeRotationEntryV1[],
  issues: OrderedTreeInputIssue[],
): void {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
  const incident = new Map(nodes.map((node) => [node.id, new Set<string>()]));

  if (edges.length !== nodes.length - 1) {
    addIssue(
      issues,
      '$.edges',
      'edge-count-mismatch',
      'a tree must contain exactly nodes.length - 1 edges',
    );
  }

  const endpointPairs = new Map<string, string>();
  for (const [index, edge] of edges.entries()) {
    const path = `$.edges[${String(index)}]`;
    const fromKnown = nodeById.has(edge.from);
    const toKnown = nodeById.has(edge.to);
    if (!fromKnown) {
      addIssue(issues, `${path}.from`, 'missing-reference', `unknown node ${edge.from}`);
    }
    if (!toKnown) {
      addIssue(issues, `${path}.to`, 'missing-reference', `unknown node ${edge.to}`);
    }
    if (edge.from === edge.to) {
      addIssue(issues, path, 'tree-self-loop', 'tree edge endpoints must differ');
    }
    if (edge.from !== edge.to) {
      const endpointKey = undirectedEndpointKey(edge.from, edge.to);
      const previous = endpointPairs.get(endpointKey);
      if (previous !== undefined) {
        addIssue(
          issues,
          path,
          'tree-parallel-edge',
          `edge is parallel to previously declared edge ${previous}`,
        );
      } else {
        endpointPairs.set(endpointKey, edge.id);
      }
    }
    if (fromKnown && toKnown && edge.from !== edge.to) {
      incident.get(edge.from)?.add(edge.id);
      incident.get(edge.to)?.add(edge.id);
    }
  }

  const parent = new Map(nodes.map((node) => [node.id, node.id]));
  const find = (id: string): string => {
    const direct = parent.get(id);
    if (direct === undefined || direct === id) return id;
    const root = find(direct);
    parent.set(id, root);
    return root;
  };
  for (const [index, edge] of edges.entries()) {
    if (!nodeById.has(edge.from) || !nodeById.has(edge.to) || edge.from === edge.to) continue;
    const firstRoot = find(edge.from);
    const secondRoot = find(edge.to);
    if (firstRoot === secondRoot) {
      addIssue(issues, `$.edges[${String(index)}]`, 'tree-cycle', `edge ${edge.id} closes a cycle`);
    } else {
      parent.set(secondRoot, firstRoot);
    }
  }
  if (nodes.length > 0 && new Set(nodes.map((node) => find(node.id))).size !== 1) {
    addIssue(issues, '$', 'tree-disconnected', 'tree must be connected');
  }

  for (const [nodeId, incidentEdges] of incident) {
    if (incidentEdges.size > ORDERED_TREE_INPUT_LIMITS.maxDegree) {
      addIssue(
        issues,
        `$.nodes.${nodeId}`,
        'degree-limit-exceeded',
        `node degree exceeds defensive limit ${String(ORDERED_TREE_INPUT_LIMITS.maxDegree)}`,
      );
    }
  }
  const leafCount = [...incident.values()].filter((entry) => entry.size === 1).length;
  if (
    leafCount < ORDERED_TREE_INPUT_LIMITS.minLeaves ||
    leafCount > ORDERED_TREE_INPUT_LIMITS.maxLeaves
  ) {
    addIssue(
      issues,
      '$.nodes',
      'leaf-count-out-of-range',
      `tree must contain ${String(ORDERED_TREE_INPUT_LIMITS.minLeaves)}..${String(ORDERED_TREE_INPUT_LIMITS.maxLeaves)} leaves`,
    );
  }

  const representedNodes = new Map<string, number>();
  for (const [index, entry] of rotation.entries()) {
    const path = `$.rotation[${String(index)}]`;
    const previous = representedNodes.get(entry.nodeId);
    if (previous !== undefined) {
      addIssue(
        issues,
        `${path}.nodeId`,
        'duplicate-reference',
        `node rotation is already declared at $.rotation[${String(previous)}]`,
      );
    } else {
      representedNodes.set(entry.nodeId, index);
    }
    if (!nodeById.has(entry.nodeId)) {
      addIssue(issues, `${path}.nodeId`, 'missing-reference', `unknown node ${entry.nodeId}`);
    }
    for (const [edgeIndex, edgeId] of entry.edgeIds.entries()) {
      if (!edgeById.has(edgeId)) {
        addIssue(
          issues,
          `${path}.edgeIds[${String(edgeIndex)}]`,
          'missing-reference',
          `unknown edge ${edgeId}`,
        );
      }
    }
    const expected = incident.get(entry.nodeId);
    if (
      expected !== undefined &&
      (entry.edgeIds.length !== expected.size ||
        entry.edgeIds.some((edgeId) => !expected.has(edgeId)))
    ) {
      addIssue(
        issues,
        `${path}.edgeIds`,
        'rotation-incidence-mismatch',
        'rotation must contain every incident edge exactly once and no nonincident edge',
      );
    }
  }
  if (
    representedNodes.size !== nodes.length ||
    nodes.some((node) => !representedNodes.has(node.id))
  ) {
    addIssue(
      issues,
      '$.rotation',
      'rotation-coverage-mismatch',
      'rotation must cover every node exactly once',
    );
  }
}

function validateMirrors(
  nodes: readonly OrderedTreeNodeV1[],
  edges: readonly OrderedTreeEdgeV1[],
  rotation: readonly OrderedTreeRotationEntryV1[],
  issues: OrderedTreeInputIssue[],
): void {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
  const rotationByNode = new Map(rotation.map((entry) => [entry.nodeId, entry.edgeIds]));

  for (const [index, node] of nodes.entries()) {
    const path = `$.nodes[${String(index)}]`;
    if (node.mirrorOf !== null && !nodeById.has(node.mirrorOf)) {
      addIssue(
        issues,
        `${path}.mirrorOf`,
        'mirror-reference-mismatch',
        `unknown mirrored node ${node.mirrorOf}`,
      );
    }
    if (node.onSymmetryAxis) {
      if (node.mirrorOf !== node.id) {
        addIssue(
          issues,
          `${path}.mirrorOf`,
          'mirror-axis-mismatch',
          'a node on the symmetry axis must be self-mirrored',
        );
      }
    } else if (node.mirrorOf === node.id) {
      addIssue(
        issues,
        `${path}.mirrorOf`,
        'mirror-axis-mismatch',
        'a self-mirrored node must be marked onSymmetryAxis',
      );
    }
    if (node.mirrorOf !== null && node.mirrorOf !== node.id) {
      const mirrored = nodeById.get(node.mirrorOf);
      if (mirrored !== undefined && mirrored.mirrorOf !== node.id) {
        addIssue(
          issues,
          `${path}.mirrorOf`,
          'mirror-reciprocity-mismatch',
          'non-self node mirror references must be reciprocal',
        );
      }
    }
  }

  for (const [index, edge] of edges.entries()) {
    const path = `$.edges[${String(index)}]`;
    if (edge.mirrorOf === null) continue;
    const mirrored = edgeById.get(edge.mirrorOf);
    if (mirrored === undefined) {
      addIssue(
        issues,
        `${path}.mirrorOf`,
        'mirror-reference-mismatch',
        `unknown mirrored edge ${edge.mirrorOf}`,
      );
      continue;
    }
    if (edge.mirrorOf !== edge.id && mirrored.mirrorOf !== edge.id) {
      addIssue(
        issues,
        `${path}.mirrorOf`,
        'mirror-reciprocity-mismatch',
        'non-self edge mirror references must be reciprocal',
      );
    }
    if (
      compareCodeUnits(edge.id, mirrored.id) <= 0 &&
      (edge.length !== mirrored.length || edge.width !== mirrored.width)
    ) {
      addIssue(
        issues,
        `${path}.mirrorOf`,
        'mirror-dimension-mismatch',
        'mirrored edge length and width must match exactly',
      );
    }
    const fromMirror = nodeById.get(edge.from)?.mirrorOf;
    const toMirror = nodeById.get(edge.to)?.mirrorOf;
    if (
      fromMirror === null ||
      fromMirror === undefined ||
      toMirror === null ||
      toMirror === undefined ||
      !sameUndirectedEndpoints(mirrored.from, mirrored.to, fromMirror, toMirror)
    ) {
      addIssue(
        issues,
        `${path}.mirrorOf`,
        'mirror-endpoint-mismatch',
        'mirrored edge endpoints must equal the corresponding node mirrors',
      );
    }
  }

  for (const [index, node] of nodes.entries()) {
    if (
      node.mirrorOf === null ||
      (node.mirrorOf !== node.id && compareCodeUnits(node.id, node.mirrorOf) > 0)
    ) {
      continue;
    }
    const sourceRotation = rotationByNode.get(node.id);
    const mirroredRotation = rotationByNode.get(node.mirrorOf);
    if (sourceRotation === undefined || mirroredRotation === undefined) continue;

    const mappedRotation: string[] = [];
    let mappingComplete = true;
    for (const edgeId of sourceRotation) {
      const mirroredEdgeId = edgeById.get(edgeId)?.mirrorOf;
      if (mirroredEdgeId === null || mirroredEdgeId === undefined) {
        mappingComplete = false;
        break;
      }
      mappedRotation.push(mirroredEdgeId);
    }
    mappedRotation.reverse();
    if (!mappingComplete || !cyclicSequencesEqual(mirroredRotation, mappedRotation)) {
      addIssue(
        issues,
        `$.nodes[${String(index)}].mirrorOf`,
        'mirror-rotation-mismatch',
        'mirrored node rotations must be reverse-cyclic under the edge mirror mapping',
      );
    }
  }
}

/**
 * Captures and validates one closed embedded ordered-tree input. Only the outer
 * node, edge, and rotation-entry arrays are ID-canonicalized. The semantic
 * edgeIds order inside every rotation entry is preserved exactly.
 */
export function parseOrderedTreeInputV1(supplied: unknown): OrderedTreeInputParseResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: ORDERED_TREE_INPUT_LIMITS.maxSnapshotArrayLength,
    maxContainerCount: ORDERED_TREE_INPUT_LIMITS.maxSnapshotContainerCount,
    maxDepth: ORDERED_TREE_INPUT_LIMITS.maxSnapshotDepth,
    maxObjectPropertyCount: ORDERED_TREE_INPUT_LIMITS.maxSnapshotObjectPropertyCount,
    maxPropertyNameCodeUnits: ORDERED_TREE_INPUT_LIMITS.maxSnapshotPropertyNameCodeUnits,
    maxStringCodeUnits: ORDERED_TREE_INPUT_LIMITS.maxSnapshotStringCodeUnits,
    maxTotalStringCodeUnits: ORDERED_TREE_INPUT_LIMITS.maxSnapshotTotalStringCodeUnits,
    maxTotalPropertyCount: ORDERED_TREE_INPUT_LIMITS.maxSnapshotTotalPropertyCount,
  });
  if (!snapshot.ok) {
    return {
      ok: false,
      error: deepFreezeOwned([
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'input must be one acyclic plain JSON-data snapshot without accessors',
        },
      ]),
    };
  }
  const raw = snapshot.value;
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: deepFreezeOwned([
        { path: '$', code: 'invalid-object' as const, message: 'input must be an object' },
      ]),
    };
  }

  const issues: OrderedTreeInputIssue[] = [];
  closedKeys(raw, ROOT_KEYS, '$', issues);
  if (raw.schemaVersion !== 1) {
    addIssue(issues, '$.schemaVersion', 'invalid-literal', 'must equal 1');
  }
  if (raw.recordType !== ORDERED_TREE_INPUT_RECORD_TYPE) {
    addIssue(
      issues,
      '$.recordType',
      'invalid-literal',
      `must equal ${ORDERED_TREE_INPUT_RECORD_TYPE}`,
    );
  }
  if (raw.contractStatus !== 'candidate') {
    addIssue(issues, '$.contractStatus', 'claim-boundary', 'must equal candidate');
  }
  if (raw.scientificClaim !== false) {
    addIssue(issues, '$.scientificClaim', 'claim-boundary', 'must equal false');
  }

  const seenIds = new Map<string, string>();
  const nodes = parseNodes(raw.nodes, seenIds, issues);
  const edges = parseEdges(raw.edges, seenIds, issues);
  const rotation = parseRotation(raw.rotation, issues);
  validateTreeStructure(nodes, edges, rotation, issues);
  validateMirrors(nodes, edges, rotation, issues);

  if (issues.length > 0) return { ok: false, error: deepFreezeOwned(issues) };
  nodes.sort((left, right) => compareCodeUnits(left.id, right.id));
  edges.sort((left, right) => compareCodeUnits(left.id, right.id));
  rotation.sort((left, right) => compareCodeUnits(left.nodeId, right.nodeId));
  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      nodes,
      edges,
      rotation,
    }),
  };
}

/**
 * Derives only topology classifications from a valid ordered tree. This does
 * not place or pack branches, build a CP, assign M/V, prove foldability, or
 * evaluate either a stage gate or the global M0F gate.
 */
export function analyzeOrderedTreeInputV1(supplied: unknown): OrderedTreeInputAnalysisResult {
  const parsed = parseOrderedTreeInputV1(supplied);
  if (!parsed.ok) return parsed;
  const input = parsed.value;
  const degreeByNode = new Map(input.nodes.map((node) => [node.id, 0]));
  for (const edge of input.edges) {
    degreeByNode.set(edge.from, (degreeByNode.get(edge.from) ?? 0) + 1);
    degreeByNode.set(edge.to, (degreeByNode.get(edge.to) ?? 0) + 1);
  }
  const nodeClassifications: OrderedTreeNodeClassificationV1[] = input.nodes.map((node) => {
    const degree = degreeByNode.get(node.id) ?? 0;
    return { nodeId: node.id, degree, nodeClass: degree === 1 ? 'leaf' : 'internal' };
  });
  const leafNodeIds = nodeClassifications
    .filter((entry) => entry.nodeClass === 'leaf')
    .map((entry) => entry.nodeId);
  const internalNodeIds = nodeClassifications
    .filter((entry) => entry.nodeClass === 'internal')
    .map((entry) => entry.nodeId);
  const edgeClassifications: OrderedTreeEdgeClassificationV1[] = input.edges.map((edge) => ({
    edgeId: edge.id,
    branchClass:
      degreeByNode.get(edge.from) === 1 || degreeByNode.get(edge.to) === 1
        ? 'terminal'
        : 'internal',
  }));
  const terminalEdgeIds = edgeClassifications
    .filter((entry) => entry.branchClass === 'terminal')
    .map((entry) => entry.edgeId);
  const internalEdgeIds = edgeClassifications
    .filter((entry) => entry.branchClass === 'internal')
    .map((entry) => entry.edgeId);
  const maximumDegree = nodeClassifications.reduce(
    (maximum, entry) => Math.max(maximum, entry.degree),
    0,
  );

  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: ORDERED_TREE_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'ordered-tree-input-validation-only',
      nodeOrder: 'node-id-code-unit',
      edgeOrder: 'edge-id-code-unit',
      rotationEntryOrder: 'node-id-code-unit',
      rotationEdgeOrder: 'caller-supplied-cyclic-order-preserved',
      positionQuantizationIncluded: false,
      positionEvidenceIncluded: false,
      labelEvidenceIncluded: false,
      placementIncluded: false,
      packingIncluded: false,
      creasePatternIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      nodes: input.nodes,
      edges: input.edges,
      rotation: input.rotation,
      derived: {
        counts: {
          nodes: input.nodes.length,
          edges: input.edges.length,
          leaves: leafNodeIds.length,
          internalNodes: internalNodeIds.length,
          terminalEdges: terminalEdgeIds.length,
          internalEdges: internalEdgeIds.length,
          maximumDegree,
        },
        nodeClassifications,
        edgeClassifications,
        leafNodeIds,
        internalNodeIds,
        terminalEdgeIds,
        internalEdgeIds,
      },
    }),
  };
}
