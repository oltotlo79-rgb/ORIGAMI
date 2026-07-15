import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { classifySegmentIntersection } from '../geometry/predicates.js';
import { exactPolygonAreaSign } from '../model/exact-dyadic.js';
import { M0F_CONVENTIONS_ID, type ReferenceAssignment } from '../model/reference-model.js';

export const ARTIFACT_CONTRACT_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/artifact-contract-v1.schema.json' as const;

type Point2 = readonly [number, number];
type Interval = readonly [number, number];
type StableIdPair = readonly [string, string];

export type DesignGenerationInput = Readonly<{
  kind: 'design-generation';
  method: 'treeMethod' | 'boxPleating';
  paper: Readonly<{ width: number; height: number }>;
  grid: Readonly<{ columns: number; rows: number }> | null;
  tree: Readonly<{
    nodes: readonly Readonly<{ id: string; x: number; y: number }>[];
    edges: readonly Readonly<{
      id: string;
      from: string;
      to: string;
      length: number;
      width: number;
    }>[];
    rotation: readonly Readonly<{ nodeId: string; edgeIds: readonly string[] }>[];
  }>;
}>;

export type FoldVerificationInput = Readonly<{
  kind: 'fold-verification';
  specVersion: '1.1' | '1.2';
  frameCount: 1;
  frameClasses: readonly string[];
  verticesCoords: readonly Point2[];
  edgesVertices: readonly (readonly [number, number])[];
  edgesAssignment: readonly ReferenceAssignment[];
  facesVertices: readonly (readonly number[])[] | null;
}>;

export type CreaseMeshV1 = Readonly<{
  vertices: readonly Readonly<{ id: string; x: number; y: number }>[];
  edges: readonly Readonly<{
    id: string;
    vertices: StableIdPair;
    assignment: ReferenceAssignment;
    role: 'boundary' | 'axial' | 'axialN' | 'ridge' | 'hinge' | 'gusset' | 'pleat' | 'flat';
    sourceTreeEdgeIds: readonly string[];
    generationKey: string;
  }>[];
  faces: readonly Readonly<{ id: string; vertices: readonly string[] }>[];
  meshJoinEdges: readonly Readonly<{
    id: string;
    vertices: StableIdPair;
    purpose: 'triangulation' | 'overlap-subdivision';
    incidentFaceIds: StableIdPair;
  }>[];
}>;

type FaceTransform = Readonly<{
  faceId: string;
  quaternion: readonly [number, number, number, number];
  translation: readonly [number, number, number];
}>;

type TargetBase = Readonly<{
  schemaVersion: 1;
  faceTransforms: readonly FaceTransform[];
  goalFaceOrders: readonly (readonly [string, string, -1 | 1])[];
  overlapRegionIds: readonly string[];
}>;

export type TargetStateV1 =
  | (TargetBase &
      Readonly<{
        kind: 'flat-folded-cp';
        assignmentPolicy: 'respect-mv-solve-u';
        resolvedInteriorAssignments: readonly Readonly<{
          edgeId: string;
          assignment: 'M' | 'V' | 'F';
        }>[];
      }>)
  | (TargetBase &
      Readonly<{
        kind: 'uniaxial-tree-base';
        branchMeasurements: readonly Readonly<{
          treeEdgeId: string;
          axisEndpoints: readonly [Point2, Point2];
          effectiveLength: number;
          effectiveWidth: number;
        }>[];
        rotation: readonly Readonly<{ nodeId: string; edgeIds: readonly string[] }>[];
      }>);

export type PathCandidateV1 = Readonly<{
  representationVersion: 1;
  representationStatus: 'candidate';
  segments: readonly Readonly<{
    t0: number;
    t1: number;
    motion:
      | Readonly<{
          kind: 'bounded-interpolation';
          knotTimes: readonly number[];
          anglesByCrease: readonly Readonly<{ edgeId: string; angles: readonly number[] }>[];
          intervalAngleBoundsByCrease: readonly Readonly<{
            edgeId: string;
            bounds: readonly Interval[];
          }>[];
        }>
      | Readonly<{
          kind: 'piecewise-polynomial';
          degree: number;
          coefficientsByCrease: readonly Readonly<{
            edgeId: string;
            coefficients: readonly (readonly number[])[];
          }>[];
          derivativeBoundsByCrease: readonly Readonly<{
            edgeId: string;
            bounds: Interval;
          }>[];
        }>;
  }>[];
}>;

export type ArtifactContractV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof ARTIFACT_CONTRACT_SCHEMA_ID;
  contractId: string;
  conventionsId: typeof M0F_CONVENTIONS_ID;
  contractStatus: 'candidate';
  scientificClaim: false;
  input: DesignGenerationInput | FoldVerificationInput;
  creaseMesh: CreaseMeshV1;
  target: TargetStateV1;
  pathCandidate: PathCandidateV1;
  overlapRegions: readonly Readonly<{ id: string; faceIds: StableIdPair }>[];
  contacts: readonly Readonly<{
    id: string;
    interval: Interval;
    faceIds: StableIdPair;
    overlapRegionId: string | null;
    classification: 'point' | 'edge' | 'tangential-face' | 'coplanar-overlap';
  }>[];
  layerEvents: readonly Readonly<{
    id: string;
    interval: Interval;
    overlapRegionId: string;
    aboveFaceId: string;
    belowFaceId: string;
  }>[];
}>;

export type ArtifactContractIssue = Readonly<{ path: string; code: string; message: string }>;
export type ArtifactContractParseResult =
  | Readonly<{ ok: true; value: ArtifactContractV1 }>
  | Readonly<{ ok: false; error: readonly ArtifactContractIssue[] }>;

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const ROOT_KEYS = [
  'schemaVersion',
  'schemaId',
  'contractId',
  'conventionsId',
  'contractStatus',
  'scientificClaim',
  'input',
  'creaseMesh',
  'target',
  'pathCandidate',
  'overlapRegions',
  'contacts',
  'layerEvents',
] as const;
const ASSIGNMENTS = ['M', 'V', 'B', 'F', 'U'] as const;
const INTERIOR_ASSIGNMENTS = ['M', 'V', 'F'] as const;
const EDGE_ROLES = [
  'boundary',
  'axial',
  'axialN',
  'ridge',
  'hinge',
  'gusset',
  'pleat',
  'flat',
] as const;

type InputContext = Readonly<{
  kind: 'design-generation' | 'fold-verification' | undefined;
  method: 'treeMethod' | 'boxPleating' | undefined;
  treeNodeIds: ReadonlySet<string>;
  treeEdgeIds: ReadonlySet<string>;
  treeEdgeDimensions: ReadonlyMap<string, Readonly<{ length: number; width: number }>>;
  incidentTreeEdges: ReadonlyMap<string, ReadonlySet<string>>;
  paper: Readonly<{ width: number; height: number }> | undefined;
  foldVertexCoordinateKeys: ReadonlySet<string>;
  foldEdgesByCoordinateKey: ReadonlyMap<string, ReferenceAssignment>;
}>;
type MeshContext = Readonly<{
  vertexIds: ReadonlySet<string>;
  faceIds: ReadonlySet<string>;
  edgeIds: ReadonlySet<string>;
  interiorEdgeIds: ReadonlySet<string>;
  assignmentByEdgeId: ReadonlyMap<string, ReferenceAssignment>;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizedNumber(value: number): number {
  return value === 0 ? 0 : value;
}

function coordinateKey(point: Readonly<{ x: number; y: number }>): string {
  return `${String(normalizedNumber(point.x))}\0${String(normalizedNumber(point.y))}`;
}

function coordinateEdgeKey(
  first: Readonly<{ x: number; y: number }>,
  second: Readonly<{ x: number; y: number }>,
): string {
  return undirectedEdgeKey(coordinateKey(first), coordinateKey(second));
}

function addIssue(
  issues: ArtifactContractIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: ArtifactContractIssue[],
): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      addIssue(issues, `${path}.${key}`, 'unknown-field', 'field is not declared by contract v1');
    }
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) {
      addIssue(issues, `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function finite(value: unknown, path: string, issues: ArtifactContractIssue[]): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    addIssue(issues, path, 'non-finite-number', 'must be a finite binary64 number');
    return false;
  }
  return true;
}

function stableId(value: unknown, path: string, issues: ArtifactContractIssue[]): value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    addIssue(issues, path, 'invalid-id', 'must be a stable ID of 1..128 ASCII characters');
    return false;
  }
  return true;
}

function enumValue<const T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  issues: ArtifactContractIssue[],
): value is T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    addIssue(issues, path, 'invalid-enum', `must be one of ${allowed.join(', ')}`);
    return false;
  }
  return true;
}

function registerId(
  value: unknown,
  path: string,
  seen: Map<string, string>,
  issues: ArtifactContractIssue[],
): value is string {
  if (!stableId(value, path, issues)) return false;
  const previous = seen.get(value);
  if (previous !== undefined) {
    addIssue(issues, path, 'duplicate-id', `${value} is already declared at ${previous}`);
  } else {
    seen.set(value, path);
  }
  return true;
}

function idArray(
  value: unknown,
  path: string,
  issues: ArtifactContractIssue[],
): string[] | undefined {
  if (!Array.isArray(value)) {
    addIssue(issues, path, 'invalid-array', 'must be an array of stable IDs');
    return undefined;
  }
  const result: string[] = [];
  value.forEach((entry, index) => {
    if (stableId(entry, `${path}[${index}]`, issues)) result.push(entry);
  });
  if (new Set(result).size !== result.length) {
    addIssue(issues, path, 'duplicate-reference', 'stable-ID references must be unique');
  }
  return result;
}

function idPair(
  value: unknown,
  path: string,
  issues: ArtifactContractIssue[],
): [string, string] | undefined {
  if (!Array.isArray(value) || value.length !== 2) {
    addIssue(issues, path, 'invalid-tuple', 'must contain exactly two stable IDs');
    return undefined;
  }
  const first = stableId(value[0], `${path}[0]`, issues);
  const second = stableId(value[1], `${path}[1]`, issues);
  if (!first || !second) return undefined;
  if (value[0] === value[1]) {
    addIssue(issues, path, 'duplicate-reference', 'the two stable IDs must differ');
  }
  return [value[0], value[1]];
}

function finiteTuple(
  value: unknown,
  size: number,
  path: string,
  issues: ArtifactContractIssue[],
): number[] | undefined {
  if (!Array.isArray(value) || value.length !== size) {
    addIssue(issues, path, 'invalid-tuple', `must contain exactly ${size} finite numbers`);
    return undefined;
  }
  const result: number[] = [];
  value.forEach((entry, index) => {
    if (finite(entry, `${path}[${index}]`, issues)) result.push(entry);
  });
  return result.length === size ? result : undefined;
}

function interval(
  value: unknown,
  path: string,
  issues: ArtifactContractIssue[],
  allowPoint: boolean,
): [number, number] | undefined {
  const pair = finiteTuple(value, 2, path, issues);
  if (pair === undefined) return undefined;
  const first = pair[0];
  const second = pair[1];
  if (first === undefined || second === undefined) return undefined;
  if (first < 0 || second > 1 || (allowPoint ? first > second : first >= second)) {
    addIssue(
      issues,
      path,
      'invalid-interval',
      allowPoint ? 'must satisfy 0 <= t0 <= t1 <= 1' : 'must satisfy 0 <= t0 < t1 <= 1',
    );
  }
  return [first, second];
}

function requireReferences(
  ids: readonly string[],
  known: ReadonlySet<string>,
  path: string,
  issues: ArtifactContractIssue[],
  kind: string,
): void {
  ids.forEach((id, index) => {
    if (!known.has(id)) {
      addIssue(issues, `${path}[${index}]`, 'missing-reference', `unknown ${kind} ${id}`);
    }
  });
}

function validateRotation(
  value: unknown,
  path: string,
  nodeIds: ReadonlySet<string>,
  edgeIds: ReadonlySet<string>,
  incident: ReadonlyMap<string, ReadonlySet<string>>,
  issues: ArtifactContractIssue[],
): void {
  if (!Array.isArray(value)) {
    addIssue(issues, path, 'invalid-array', 'rotation must be an array');
    return;
  }
  const representedNodes = new Set<string>();
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      addIssue(issues, entryPath, 'invalid-object', 'rotation entry must be an object');
      return;
    }
    exactKeys(entry, ['nodeId', 'edgeIds'], entryPath, issues);
    const nodeId = entry.nodeId;
    if (stableId(nodeId, `${entryPath}.nodeId`, issues)) {
      if (!nodeIds.has(nodeId))
        addIssue(issues, `${entryPath}.nodeId`, 'missing-reference', `unknown tree node ${nodeId}`);
      if (representedNodes.has(nodeId))
        addIssue(issues, `${entryPath}.nodeId`, 'duplicate-reference', 'node rotation is repeated');
      representedNodes.add(nodeId);
    }
    const rotationEdges = idArray(entry.edgeIds, `${entryPath}.edgeIds`, issues);
    if (rotationEdges !== undefined) {
      requireReferences(rotationEdges, edgeIds, `${entryPath}.edgeIds`, issues, 'tree edge');
      if (typeof nodeId === 'string' && nodeIds.has(nodeId)) {
        const expected = incident.get(nodeId) ?? new Set<string>();
        if (
          rotationEdges.length !== expected.size ||
          rotationEdges.some((edgeId) => !expected.has(edgeId))
        ) {
          addIssue(
            issues,
            `${entryPath}.edgeIds`,
            'rotation-incidence-mismatch',
            'rotation must contain each incident tree edge exactly once',
          );
        }
      }
    }
  });
  if (representedNodes.size !== nodeIds.size) {
    addIssue(
      issues,
      path,
      'incomplete-coverage',
      'rotation must cover every tree node exactly once',
    );
  }
}

function validateDesignInput(
  value: Record<string, unknown>,
  path: string,
  seen: Map<string, string>,
  issues: ArtifactContractIssue[],
): InputContext {
  exactKeys(value, ['kind', 'method', 'paper', 'grid', 'tree'], path, issues);
  const method = enumValue(value.method, ['treeMethod', 'boxPleating'], `${path}.method`, issues)
    ? value.method
    : undefined;
  let paper: { width: number; height: number } | undefined;
  if (!isRecord(value.paper)) {
    addIssue(issues, `${path}.paper`, 'invalid-object', 'paper must be an object');
  } else {
    exactKeys(value.paper, ['width', 'height'], `${path}.paper`, issues);
    const width = value.paper.width;
    const height = value.paper.height;
    const widthOk = finite(width, `${path}.paper.width`, issues);
    const heightOk = finite(height, `${path}.paper.height`, issues);
    if (widthOk && width <= 0)
      addIssue(issues, `${path}.paper.width`, 'out-of-range', 'must be positive');
    if (heightOk && height <= 0)
      addIssue(issues, `${path}.paper.height`, 'out-of-range', 'must be positive');
    if (widthOk && heightOk && Math.min(width, height) !== 1) {
      addIssue(issues, `${path}.paper`, 'paper-not-normalized', 'shorter side must equal 1');
    }
    if (widthOk && heightOk && width > 0 && height > 0) paper = { width, height };
  }
  if (value.grid === null) {
    if (method === 'boxPleating')
      addIssue(issues, `${path}.grid`, 'missing-grid', 'boxPleating requires a grid');
  } else if (!isRecord(value.grid)) {
    addIssue(issues, `${path}.grid`, 'invalid-object', 'grid must be null or an object');
  } else {
    exactKeys(value.grid, ['columns', 'rows'], `${path}.grid`, issues);
    for (const key of ['columns', 'rows'] as const) {
      const candidate = value.grid[key];
      if (
        finite(candidate, `${path}.grid.${key}`, issues) &&
        (!Number.isSafeInteger(candidate) || candidate <= 0)
      ) {
        addIssue(issues, `${path}.grid.${key}`, 'out-of-range', 'must be a positive safe integer');
      }
    }
    if (
      method === 'boxPleating' &&
      paper !== undefined &&
      typeof value.grid.columns === 'number' &&
      Number.isSafeInteger(value.grid.columns) &&
      value.grid.columns > 0 &&
      typeof value.grid.rows === 'number' &&
      Number.isSafeInteger(value.grid.rows) &&
      value.grid.rows > 0 &&
      paper.width * value.grid.rows !== paper.height * value.grid.columns
    )
      addIssue(
        issues,
        `${path}.grid`,
        'non-square-grid-cell',
        'boxPleating columns/rows must form square cells on the rectangular paper',
      );
    if (method === 'treeMethod')
      addIssue(issues, `${path}.grid`, 'workflow-field-mismatch', 'treeMethod grid must be null');
  }

  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const treeEdgeDimensions = new Map<string, { length: number; width: number }>();
  const incident = new Map<string, Set<string>>();
  if (!isRecord(value.tree)) {
    addIssue(issues, `${path}.tree`, 'invalid-object', 'tree must be an object');
    return {
      kind: 'design-generation',
      method,
      treeNodeIds: nodeIds,
      treeEdgeIds: edgeIds,
      treeEdgeDimensions,
      incidentTreeEdges: incident,
      paper,
      foldVertexCoordinateKeys: new Set(),
      foldEdgesByCoordinateKey: new Map(),
    };
  }
  exactKeys(value.tree, ['nodes', 'edges', 'rotation'], `${path}.tree`, issues);
  if (!Array.isArray(value.tree.nodes) || value.tree.nodes.length < 2) {
    addIssue(issues, `${path}.tree.nodes`, 'invalid-array', 'tree requires at least two nodes');
  } else {
    value.tree.nodes.forEach((entry, index) => {
      const entryPath = `${path}.tree.nodes[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, entryPath, 'invalid-object', 'tree node must be an object');
        return;
      }
      exactKeys(entry, ['id', 'x', 'y'], entryPath, issues);
      if (registerId(entry.id, `${entryPath}.id`, seen, issues)) {
        nodeIds.add(entry.id);
        incident.set(entry.id, new Set());
      }
      finite(entry.x, `${entryPath}.x`, issues);
      finite(entry.y, `${entryPath}.y`, issues);
    });
  }

  const endpointByEdge = new Map<string, [string, string]>();
  if (!Array.isArray(value.tree.edges) || value.tree.edges.length === 0) {
    addIssue(issues, `${path}.tree.edges`, 'invalid-array', 'tree requires at least one edge');
  } else {
    value.tree.edges.forEach((entry, index) => {
      const entryPath = `${path}.tree.edges[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, entryPath, 'invalid-object', 'tree edge must be an object');
        return;
      }
      exactKeys(entry, ['id', 'from', 'to', 'length', 'width'], entryPath, issues);
      const edgeId = entry.id;
      const from = entry.from;
      const to = entry.to;
      const hasId = registerId(edgeId, `${entryPath}.id`, seen, issues);
      const hasFrom = stableId(from, `${entryPath}.from`, issues);
      const hasTo = stableId(to, `${entryPath}.to`, issues);
      if (hasId) edgeIds.add(edgeId);
      if (hasFrom && !nodeIds.has(from))
        addIssue(issues, `${entryPath}.from`, 'missing-reference', `unknown tree node ${from}`);
      if (hasTo && !nodeIds.has(to))
        addIssue(issues, `${entryPath}.to`, 'missing-reference', `unknown tree node ${to}`);
      if (hasFrom && hasTo && from === to)
        addIssue(issues, entryPath, 'tree-self-loop', 'tree edge endpoints must differ');
      if (hasId && hasFrom && hasTo) {
        endpointByEdge.set(edgeId, [from, to]);
        incident.get(from)?.add(edgeId);
        incident.get(to)?.add(edgeId);
      }
      if (finite(entry.length, `${entryPath}.length`, issues) && entry.length <= 0)
        addIssue(issues, `${entryPath}.length`, 'out-of-range', 'length must be positive');
      if (finite(entry.width, `${entryPath}.width`, issues) && entry.width < 0)
        addIssue(issues, `${entryPath}.width`, 'out-of-range', 'width must be non-negative');
      if (
        hasId &&
        typeof entry.length === 'number' &&
        Number.isFinite(entry.length) &&
        entry.length > 0 &&
        typeof entry.width === 'number' &&
        Number.isFinite(entry.width) &&
        entry.width >= 0
      )
        treeEdgeDimensions.set(edgeId, { length: entry.length, width: entry.width });
    });
  }

  const nodeOrder = [...nodeIds];
  const parent = new Map(nodeOrder.map((id) => [id, id]));
  const find = (id: string): string => {
    const direct = parent.get(id);
    if (direct === undefined || direct === id) return id;
    const root = find(direct);
    parent.set(id, root);
    return root;
  };
  for (const [edgeId, endpoints] of endpointByEdge) {
    if (!nodeIds.has(endpoints[0]) || !nodeIds.has(endpoints[1])) continue;
    const firstRoot = find(endpoints[0]);
    const secondRoot = find(endpoints[1]);
    if (firstRoot === secondRoot) {
      addIssue(issues, `${path}.tree.edges`, 'tree-cycle', `edge ${edgeId} closes a cycle`);
    } else {
      parent.set(secondRoot, firstRoot);
    }
  }
  if (nodeIds.size > 0 && new Set([...nodeIds].map(find)).size !== 1) {
    addIssue(issues, `${path}.tree`, 'tree-disconnected', 'tree must be connected');
  }
  const leafCount = [...incident.values()].filter((edges) => edges.size === 1).length;
  if (leafCount < 2 || leafCount > 20) {
    addIssue(issues, `${path}.tree`, 'leaf-count-out-of-range', 'tree must have 2..20 leaves');
  }
  validateRotation(
    value.tree.rotation,
    `${path}.tree.rotation`,
    nodeIds,
    edgeIds,
    incident,
    issues,
  );
  return {
    kind: 'design-generation',
    method,
    treeNodeIds: nodeIds,
    treeEdgeIds: edgeIds,
    treeEdgeDimensions,
    incidentTreeEdges: incident,
    paper,
    foldVertexCoordinateKeys: new Set(),
    foldEdgesByCoordinateKey: new Map(),
  };
}

function validateFoldInput(
  value: Record<string, unknown>,
  path: string,
  issues: ArtifactContractIssue[],
): InputContext {
  exactKeys(
    value,
    [
      'kind',
      'specVersion',
      'frameCount',
      'frameClasses',
      'verticesCoords',
      'edgesVertices',
      'edgesAssignment',
      'facesVertices',
    ],
    path,
    issues,
  );
  enumValue(value.specVersion, ['1.1', '1.2'], `${path}.specVersion`, issues);
  if (value.frameCount !== 1)
    addIssue(
      issues,
      `${path}.frameCount`,
      'unsupported-frame-count',
      'must contain exactly one frame',
    );
  if (
    !Array.isArray(value.frameClasses) ||
    value.frameClasses.length !== 1 ||
    value.frameClasses[0] !== 'creasePattern'
  )
    addIssue(
      issues,
      `${path}.frameClasses`,
      'unsupported-frame-class',
      'must contain exactly creasePattern',
    );
  const foldPoints: ({ x: number; y: number } | undefined)[] = [];
  const foldVertexCoordinateKeys = new Set<string>();
  let paper: { width: number; height: number } | undefined;
  let vertexCount = 0;
  if (!Array.isArray(value.verticesCoords) || value.verticesCoords.length < 3) {
    addIssue(
      issues,
      `${path}.verticesCoords`,
      'invalid-array',
      'must contain at least three 2D vertices',
    );
  } else {
    vertexCount = value.verticesCoords.length;
    value.verticesCoords.forEach((entry, index) => {
      const tuple = finiteTuple(entry, 2, `${path}.verticesCoords[${index}]`, issues);
      const x = tuple?.[0];
      const y = tuple?.[1];
      if (x === undefined || y === undefined) return;
      const point = { x, y };
      foldPoints[index] = point;
      const key = coordinateKey(point);
      if (foldVertexCoordinateKeys.has(key))
        addIssue(
          issues,
          `${path}.verticesCoords[${index}]`,
          'duplicate-coordinate',
          'FOLD vertices must have distinct normalized coordinates',
        );
      foldVertexCoordinateKeys.add(key);
    });
    const validPoints = foldPoints.filter((point) => point !== undefined);
    if (validPoints.length === vertexCount) {
      const minimumX = Math.min(...validPoints.map((point) => point.x));
      const minimumY = Math.min(...validPoints.map((point) => point.y));
      const maximumX = Math.max(...validPoints.map((point) => point.x));
      const maximumY = Math.max(...validPoints.map((point) => point.y));
      const width = maximumX - minimumX;
      const height = maximumY - minimumY;
      if (
        minimumX !== 0 ||
        minimumY !== 0 ||
        width <= 0 ||
        height <= 0 ||
        Math.min(width, height) !== 1
      )
        addIssue(
          issues,
          `${path}.verticesCoords`,
          'paper-not-normalized',
          'FOLD coordinates must start at (0,0) and have normalized short-side extent 1',
        );
      else paper = { width, height };
    }
  }
  const foldEdgeVertexIndices: ([number, number] | undefined)[] = [];
  let edgeCount = 0;
  if (!Array.isArray(value.edgesVertices) || value.edgesVertices.length === 0) {
    addIssue(issues, `${path}.edgesVertices`, 'invalid-array', 'must contain at least one edge');
  } else {
    edgeCount = value.edgesVertices.length;
    value.edgesVertices.forEach((entry, index) => {
      const entryPath = `${path}.edgesVertices[${index}]`;
      if (!Array.isArray(entry) || entry.length !== 2) {
        addIssue(issues, entryPath, 'invalid-tuple', 'edge must contain two vertex indices');
        return;
      }
      const indices = entry.filter(
        (candidate): candidate is number =>
          typeof candidate === 'number' && Number.isSafeInteger(candidate),
      );
      if (
        indices.length !== 2 ||
        indices.some((candidate) => candidate < 0 || candidate >= vertexCount)
      )
        addIssue(
          issues,
          entryPath,
          'invalid-index',
          'vertex indices must reference vertices_coords',
        );
      else if (indices[0] === indices[1])
        addIssue(issues, entryPath, 'degenerate-edge', 'edge endpoints must differ');
      else {
        const first = indices[0];
        const second = indices[1];
        if (first !== undefined && second !== undefined)
          foldEdgeVertexIndices[index] = [first, second];
      }
    });
  }
  const foldEdgesByCoordinateKey = new Map<string, ReferenceAssignment>();
  if (!Array.isArray(value.edgesAssignment) || value.edgesAssignment.length !== edgeCount) {
    addIssue(
      issues,
      `${path}.edgesAssignment`,
      'parallel-array-mismatch',
      'must have one assignment per edge',
    );
  } else {
    value.edgesAssignment.forEach((entry, index) => {
      const assignmentOk = enumValue(
        entry,
        ASSIGNMENTS,
        `${path}.edgesAssignment[${index}]`,
        issues,
      );
      const indices = foldEdgeVertexIndices[index];
      const first = indices === undefined ? undefined : foldPoints[indices[0]];
      const second = indices === undefined ? undefined : foldPoints[indices[1]];
      if (assignmentOk && first !== undefined && second !== undefined) {
        const key = coordinateEdgeKey(first, second);
        if (foldEdgesByCoordinateKey.has(key))
          addIssue(
            issues,
            `${path}.edgesVertices[${index}]`,
            'duplicate-edge',
            'FOLD physical edge is duplicated',
          );
        else foldEdgesByCoordinateKey.set(key, entry);
      }
    });
  }
  if (value.facesVertices !== null) {
    if (!Array.isArray(value.facesVertices) || value.facesVertices.length === 0) {
      addIssue(
        issues,
        `${path}.facesVertices`,
        'invalid-array',
        'must be null or a non-empty face array',
      );
    } else {
      value.facesVertices.forEach((entry, index) => {
        const entryPath = `${path}.facesVertices[${index}]`;
        if (!Array.isArray(entry) || entry.length < 3) {
          addIssue(issues, entryPath, 'invalid-array', 'face needs at least three vertex indices');
          return;
        }
        const indices = entry.filter(
          (candidate): candidate is number =>
            typeof candidate === 'number' && Number.isSafeInteger(candidate),
        );
        if (
          indices.length !== entry.length ||
          indices.some((candidate) => candidate < 0 || candidate >= vertexCount)
        )
          addIssue(
            issues,
            entryPath,
            'invalid-index',
            'face indices must reference vertices_coords',
          );
        if (new Set(indices).size !== indices.length)
          addIssue(issues, entryPath, 'duplicate-reference', 'face cannot repeat a vertex index');
      });
    }
  }
  return {
    kind: 'fold-verification',
    method: undefined,
    treeNodeIds: new Set(),
    treeEdgeIds: new Set(),
    treeEdgeDimensions: new Map(),
    incidentTreeEdges: new Map(),
    paper,
    foldVertexCoordinateKeys,
    foldEdgesByCoordinateKey,
  };
}

function validateInput(
  value: unknown,
  seen: Map<string, string>,
  issues: ArtifactContractIssue[],
): InputContext {
  if (!isRecord(value)) {
    addIssue(issues, '$.input', 'invalid-object', 'input must be an object');
    return {
      kind: undefined,
      method: undefined,
      treeNodeIds: new Set(),
      treeEdgeIds: new Set(),
      treeEdgeDimensions: new Map(),
      incidentTreeEdges: new Map(),
      paper: undefined,
      foldVertexCoordinateKeys: new Set(),
      foldEdgesByCoordinateKey: new Map(),
    };
  }
  if (value.kind === 'design-generation')
    return validateDesignInput(value, '$.input', seen, issues);
  if (value.kind === 'fold-verification') return validateFoldInput(value, '$.input', issues);
  addIssue(
    issues,
    '$.input.kind',
    'invalid-enum',
    'must be design-generation or fold-verification',
  );
  return {
    kind: undefined,
    method: undefined,
    treeNodeIds: new Set(),
    treeEdgeIds: new Set(),
    treeEdgeDimensions: new Map(),
    incidentTreeEdges: new Map(),
    paper: undefined,
    foldVertexCoordinateKeys: new Set(),
    foldEdgesByCoordinateKey: new Map(),
  };
}

function undirectedEdgeKey(first: string, second: string): string {
  return first < second ? `${first}\0${second}` : `${second}\0${first}`;
}

function validateMesh(
  value: unknown,
  input: InputContext,
  seen: Map<string, string>,
  issues: ArtifactContractIssue[],
): MeshContext {
  const vertexIds = new Set<string>();
  const faceIds = new Set<string>();
  const edgeIds = new Set<string>();
  const interiorEdgeIds = new Set<string>();
  const assignmentByEdgeId = new Map<string, ReferenceAssignment>();
  if (!isRecord(value)) {
    addIssue(issues, '$.creaseMesh', 'invalid-object', 'creaseMesh must be an object');
    return { vertexIds, faceIds, edgeIds, interiorEdgeIds, assignmentByEdgeId };
  }
  exactKeys(value, ['vertices', 'edges', 'faces', 'meshJoinEdges'], '$.creaseMesh', issues);
  const points = new Map<string, { x: number; y: number }>();
  const vertexIdByCoordinate = new Map<string, string>();
  if (!Array.isArray(value.vertices) || value.vertices.length < 3) {
    addIssue(
      issues,
      '$.creaseMesh.vertices',
      'invalid-array',
      'mesh needs at least three vertices',
    );
  } else {
    value.vertices.forEach((entry, index) => {
      const path = `$.creaseMesh.vertices[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, path, 'invalid-object', 'mesh vertex must be an object');
        return;
      }
      exactKeys(entry, ['id', 'x', 'y'], path, issues);
      const id = entry.id;
      const x = entry.x;
      const y = entry.y;
      const hasId = registerId(id, `${path}.id`, seen, issues);
      const hasX = finite(x, `${path}.x`, issues);
      const hasY = finite(y, `${path}.y`, issues);
      if (hasId) vertexIds.add(id);
      if (hasId && hasX && hasY) {
        const point = { x, y };
        points.set(id, point);
        const key = coordinateKey(point);
        const duplicateId = vertexIdByCoordinate.get(key);
        if (duplicateId !== undefined)
          addIssue(
            issues,
            path,
            'duplicate-coordinate',
            `mesh vertices ${duplicateId} and ${id} have identical coordinates`,
          );
        else vertexIdByCoordinate.set(key, id);
        if (
          input.paper !== undefined &&
          (x < 0 || y < 0 || x > input.paper.width || y > input.paper.height)
        )
          addIssue(
            issues,
            path,
            'outside-paper',
            'mesh vertex lies outside the normalized input paper',
          );
        if (input.kind === 'fold-verification' && !input.foldVertexCoordinateKeys.has(key))
          addIssue(
            issues,
            path,
            'fold-mesh-mismatch',
            'mesh vertex does not correspond to a normalized FOLD vertex',
          );
      }
    });
  }
  if (
    input.kind === 'fold-verification' &&
    (vertexIdByCoordinate.size !== input.foldVertexCoordinateKeys.size ||
      [...input.foldVertexCoordinateKeys].some((key) => !vertexIdByCoordinate.has(key)))
  )
    addIssue(
      issues,
      '$.creaseMesh.vertices',
      'fold-mesh-mismatch',
      'mesh vertices must exactly cover normalized FOLD vertex coordinates',
    );
  const faceRings = new Map<string, string[]>();
  const faceBoundaryCounts = new Map<string, number>();
  const faceIdsByBoundaryKey = new Map<string, Set<string>>();
  if (!Array.isArray(value.faces) || value.faces.length === 0) {
    addIssue(issues, '$.creaseMesh.faces', 'invalid-array', 'mesh needs at least one face');
  } else {
    value.faces.forEach((entry, index) => {
      const path = `$.creaseMesh.faces[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, path, 'invalid-object', 'mesh face must be an object');
        return;
      }
      exactKeys(entry, ['id', 'vertices'], path, issues);
      const id = entry.id;
      const hasId = registerId(id, `${path}.id`, seen, issues);
      const ring = idArray(entry.vertices, `${path}.vertices`, issues);
      if (ring !== undefined && ring.length < 3)
        addIssue(issues, `${path}.vertices`, 'invalid-array', 'face needs at least three vertices');
      if (ring !== undefined) {
        requireReferences(ring, vertexIds, `${path}.vertices`, issues, 'mesh vertex');
        const ringPoints = ring.map((id) => points.get(id)).filter((point) => point !== undefined);
        if (ringPoints.length === ring.length && ring.length >= 3) {
          const areaSign = exactPolygonAreaSign(ringPoints);
          if (areaSign === 0)
            addIssue(issues, `${path}.vertices`, 'degenerate-face', 'exact signed area is zero');
          else if (areaSign > 0)
            addIssue(
              issues,
              `${path}.vertices`,
              'non-canonical-winding',
              'stored xy face winding must be negative',
            );
        }
        for (let ringIndex = 0; ringIndex < ring.length; ringIndex += 1) {
          const first = ring[ringIndex];
          const second = ring[(ringIndex + 1) % ring.length];
          if (first !== undefined && second !== undefined) {
            const key = undirectedEdgeKey(first, second);
            faceBoundaryCounts.set(key, (faceBoundaryCounts.get(key) ?? 0) + 1);
            if (hasId) {
              const boundaryFaces = faceIdsByBoundaryKey.get(key) ?? new Set<string>();
              boundaryFaces.add(id);
              faceIdsByBoundaryKey.set(key, boundaryFaces);
            }
          }
        }
      }
      if (hasId) {
        faceIds.add(id);
        if (ring !== undefined) faceRings.set(id, ring);
      }
    });
  }

  const physicalEdgeKeys = new Set<string>();
  const physicalSegments: {
    id: string;
    vertices: [string, string];
    start: { x: number; y: number };
    end: { x: number; y: number };
  }[] = [];
  const matchedFoldEdges = new Set<string>();
  const generationKeys = new Set<string>();
  if (!Array.isArray(value.edges) || value.edges.length === 0) {
    addIssue(issues, '$.creaseMesh.edges', 'invalid-array', 'mesh needs at least one crease edge');
  } else {
    value.edges.forEach((entry, index) => {
      const path = `$.creaseMesh.edges[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, path, 'invalid-object', 'crease edge must be an object');
        return;
      }
      exactKeys(
        entry,
        ['id', 'vertices', 'assignment', 'role', 'sourceTreeEdgeIds', 'generationKey'],
        path,
        issues,
      );
      if (registerId(entry.id, `${path}.id`, seen, issues)) edgeIds.add(entry.id);
      const endpoints = idPair(entry.vertices, `${path}.vertices`, issues);
      if (endpoints !== undefined) {
        requireReferences(endpoints, vertexIds, `${path}.vertices`, issues, 'mesh vertex');
        const key = undirectedEdgeKey(endpoints[0], endpoints[1]);
        if (physicalEdgeKeys.has(key))
          addIssue(
            issues,
            `${path}.vertices`,
            'duplicate-edge',
            'mesh edge endpoints are duplicated',
          );
        physicalEdgeKeys.add(key);
        const start = points.get(endpoints[0]);
        const end = points.get(endpoints[1]);
        if (start !== undefined && end !== undefined) {
          if (coordinateKey(start) === coordinateKey(end))
            addIssue(issues, path, 'zero-length-edge', 'mesh edge has zero geometric length');
          physicalSegments.push({
            id: typeof entry.id === 'string' ? entry.id : `edge-${index}`,
            vertices: endpoints,
            start,
            end,
          });
          if (input.kind === 'fold-verification') {
            const foldKey = coordinateEdgeKey(start, end);
            const foldAssignment = input.foldEdgesByCoordinateKey.get(foldKey);
            if (foldAssignment === undefined)
              addIssue(
                issues,
                path,
                'fold-mesh-mismatch',
                'crease edge does not correspond to a FOLD input edge',
              );
            else {
              matchedFoldEdges.add(foldKey);
              if (entry.assignment !== foldAssignment)
                addIssue(
                  issues,
                  `${path}.assignment`,
                  'fold-assignment-mismatch',
                  `mesh assignment must preserve FOLD assignment ${foldAssignment}`,
                );
            }
          }
        }
        const incidence = faceBoundaryCounts.get(key) ?? 0;
        if (entry.assignment === 'B' && incidence !== 1)
          addIssue(issues, path, 'boundary-incidence', 'B edge must bound exactly one face');
        if (
          entry.assignment !== 'B' &&
          ASSIGNMENTS.includes(entry.assignment as ReferenceAssignment) &&
          incidence !== 2
        )
          addIssue(issues, path, 'interior-incidence', 'non-B edge must bound exactly two faces');
      }
      const assignment = entry.assignment;
      const assignmentOk = enumValue(assignment, ASSIGNMENTS, `${path}.assignment`, issues);
      enumValue(entry.role, EDGE_ROLES, `${path}.role`, issues);
      if (assignmentOk && assignment !== 'B' && typeof entry.id === 'string')
        interiorEdgeIds.add(entry.id);
      if (assignmentOk && typeof entry.id === 'string')
        assignmentByEdgeId.set(entry.id, assignment);
      if (assignmentOk && assignment === 'B' && entry.role !== 'boundary')
        addIssue(issues, `${path}.role`, 'edge-role-mismatch', 'B edge role must be boundary');
      if (assignmentOk && assignment !== 'B' && entry.role === 'boundary')
        addIssue(
          issues,
          `${path}.role`,
          'edge-role-mismatch',
          'interior edge cannot use boundary role',
        );
      const sources = idArray(entry.sourceTreeEdgeIds, `${path}.sourceTreeEdgeIds`, issues);
      if (sources !== undefined) {
        if (input.kind === 'fold-verification' && sources.length !== 0)
          addIssue(
            issues,
            `${path}.sourceTreeEdgeIds`,
            'workflow-field-mismatch',
            'FOLD-derived edges cannot cite tree edges',
          );
        if (input.kind === 'design-generation')
          requireReferences(
            sources,
            input.treeEdgeIds,
            `${path}.sourceTreeEdgeIds`,
            issues,
            'tree edge',
          );
        if (
          input.kind === 'design-generation' &&
          entry.assignment !== 'B' &&
          sources.length === 0
        ) {
          addIssue(
            issues,
            `${path}.sourceTreeEdgeIds`,
            'incomplete-provenance',
            'generated interior creases must cite at least one source tree edge',
          );
        }
      }
      if (typeof entry.generationKey !== 'string' || entry.generationKey.length === 0) {
        addIssue(
          issues,
          `${path}.generationKey`,
          'invalid-string',
          'generation key must be non-empty',
        );
      } else if (entry.generationKey.length > 256) {
        addIssue(
          issues,
          `${path}.generationKey`,
          'out-of-range',
          'generation key must not exceed 256 characters',
        );
      } else if (generationKeys.has(entry.generationKey)) {
        addIssue(
          issues,
          `${path}.generationKey`,
          'duplicate-generation-key',
          'generation key must be unique',
        );
      } else generationKeys.add(entry.generationKey);
    });
  }
  if (!Array.isArray(value.meshJoinEdges)) {
    addIssue(
      issues,
      '$.creaseMesh.meshJoinEdges',
      'invalid-array',
      'meshJoinEdges must be an array',
    );
  } else {
    value.meshJoinEdges.forEach((entry, index) => {
      const path = `$.creaseMesh.meshJoinEdges[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, path, 'invalid-object', 'mesh join edge must be an object');
        return;
      }
      exactKeys(entry, ['id', 'vertices', 'purpose', 'incidentFaceIds'], path, issues);
      registerId(entry.id, `${path}.id`, seen, issues);
      const endpoints = idPair(entry.vertices, `${path}.vertices`, issues);
      if (endpoints !== undefined) {
        requireReferences(endpoints, vertexIds, `${path}.vertices`, issues, 'mesh vertex');
        const key = undirectedEdgeKey(endpoints[0], endpoints[1]);
        if (physicalEdgeKeys.has(key))
          addIssue(
            issues,
            `${path}.vertices`,
            'duplicate-edge',
            'join edge duplicates a crease edge',
          );
        physicalEdgeKeys.add(key);
        const start = points.get(endpoints[0]);
        const end = points.get(endpoints[1]);
        if (start !== undefined && end !== undefined) {
          if (coordinateKey(start) === coordinateKey(end))
            addIssue(issues, path, 'zero-length-edge', 'mesh join edge has zero geometric length');
          physicalSegments.push({
            id: typeof entry.id === 'string' ? entry.id : `join-${index}`,
            vertices: endpoints,
            start,
            end,
          });
        }
        if ((faceBoundaryCounts.get(key) ?? 0) !== 2)
          addIssue(issues, path, 'join-incidence', 'mesh join edge must bound exactly two faces');
      }
      enumValue(entry.purpose, ['triangulation', 'overlap-subdivision'], `${path}.purpose`, issues);
      const faces = idPair(entry.incidentFaceIds, `${path}.incidentFaceIds`, issues);
      if (faces !== undefined) {
        requireReferences(faces, faceIds, `${path}.incidentFaceIds`, issues, 'face');
        if (endpoints !== undefined) {
          const actualFaces = faceIdsByBoundaryKey.get(
            undirectedEdgeKey(endpoints[0], endpoints[1]),
          );
          if (actualFaces?.size !== 2 || faces.some((faceId) => !actualFaces.has(faceId)))
            addIssue(
              issues,
              `${path}.incidentFaceIds`,
              'join-incident-face-mismatch',
              'incidentFaceIds must equal the two face rings sharing this join edge',
            );
        }
        if (
          endpoints !== undefined &&
          faces.some((faceId) => {
            const ring = faceRings.get(faceId);
            return ring !== undefined && endpoints.some((vertexId) => !ring.includes(vertexId));
          })
        ) {
          addIssue(
            issues,
            path,
            'edge-face-incidence',
            'each incident face must contain both join-edge endpoints',
          );
        }
      }
    });
  }
  for (const [key, count] of faceBoundaryCounts) {
    if (!physicalEdgeKeys.has(key))
      addIssue(
        issues,
        '$.creaseMesh',
        'missing-mesh-edge',
        `face boundary ${key.replace('\0', ' / ')} is not declared`,
      );
    if (count > 2)
      addIssue(
        issues,
        '$.creaseMesh.faces',
        'non-manifold-edge',
        'a face boundary is shared by more than two faces',
      );
  }
  if (
    input.kind === 'fold-verification' &&
    (matchedFoldEdges.size !== input.foldEdgesByCoordinateKey.size ||
      [...input.foldEdgesByCoordinateKey.keys()].some((key) => !matchedFoldEdges.has(key)))
  )
    addIssue(
      issues,
      '$.creaseMesh.edges',
      'fold-mesh-mismatch',
      'crease edges must exactly cover the normalized FOLD edge set',
    );

  for (let firstIndex = 0; firstIndex < physicalSegments.length; firstIndex += 1) {
    const first = physicalSegments[firstIndex];
    if (first === undefined || coordinateKey(first.start) === coordinateKey(first.end)) continue;
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < physicalSegments.length;
      secondIndex += 1
    ) {
      const second = physicalSegments[secondIndex];
      if (second === undefined || coordinateKey(second.start) === coordinateKey(second.end))
        continue;
      const classification = classifySegmentIntersection(
        { start: first.start, end: first.end },
        { start: second.start, end: second.end },
        { fastFilterArea: 0 },
      );
      if (!classification.ok) {
        addIssue(
          issues,
          '$.creaseMesh',
          'invalid-segment',
          `could not classify mesh edges ${first.id} and ${second.id}`,
        );
        continue;
      }
      const sharedEndpoint = first.vertices.some((id) => second.vertices.includes(id));
      const allowedSharedTouch =
        sharedEndpoint &&
        classification.value.kind === 'touch' &&
        classification.value.onA !== 'interior' &&
        classification.value.onB !== 'interior';
      if (classification.value.kind !== 'disjoint' && !allowedSharedTouch)
        addIssue(
          issues,
          '$.creaseMesh',
          'non-planar-intersection',
          `mesh edges ${first.id} and ${second.id} have an undeclared crossing, overlap, or T-junction`,
        );
    }
  }

  const adjacency = new Map([...vertexIds].map((id) => [id, new Set<string>()]));
  for (const segment of physicalSegments) {
    adjacency.get(segment.vertices[0])?.add(segment.vertices[1]);
    adjacency.get(segment.vertices[1])?.add(segment.vertices[0]);
  }
  const firstVertex = vertexIds.values().next().value;
  if (firstVertex !== undefined) {
    const visited = new Set<string>();
    const pending = [firstVertex];
    while (pending.length > 0) {
      const current = pending.pop();
      if (current === undefined || visited.has(current)) continue;
      visited.add(current);
      for (const neighbor of adjacency.get(current) ?? []) pending.push(neighbor);
    }
    if (visited.size !== vertexIds.size)
      addIssue(
        issues,
        '$.creaseMesh',
        'mesh-disconnected',
        'crease mesh must be one connected planar sheet',
      );
  }
  if (vertexIds.size - physicalEdgeKeys.size + faceIds.size !== 1)
    addIssue(
      issues,
      '$.creaseMesh',
      'euler-characteristic-mismatch',
      'connected disk mesh must satisfy V - E + F = 1',
    );
  return { vertexIds, faceIds, edgeIds, interiorEdgeIds, assignmentByEdgeId };
}

function validateFaceTransforms(
  value: unknown,
  mesh: MeshContext,
  issues: ArtifactContractIssue[],
): void {
  if (!Array.isArray(value)) {
    addIssue(issues, '$.target.faceTransforms', 'invalid-array', 'faceTransforms must be an array');
    return;
  }
  const transformed = new Set<string>();
  value.forEach((entry, index) => {
    const path = `$.target.faceTransforms[${index}]`;
    if (!isRecord(entry)) {
      addIssue(issues, path, 'invalid-object', 'face transform must be an object');
      return;
    }
    exactKeys(entry, ['faceId', 'quaternion', 'translation'], path, issues);
    if (stableId(entry.faceId, `${path}.faceId`, issues)) {
      if (!mesh.faceIds.has(entry.faceId))
        addIssue(issues, `${path}.faceId`, 'missing-reference', `unknown face ${entry.faceId}`);
      if (transformed.has(entry.faceId))
        addIssue(issues, `${path}.faceId`, 'duplicate-reference', 'face transform is repeated');
      transformed.add(entry.faceId);
    }
    const quaternion = finiteTuple(entry.quaternion, 4, `${path}.quaternion`, issues);
    if (quaternion !== undefined) {
      const squaredNorm = quaternion.reduce((sum, component) => sum + component * component, 0);
      if (Math.abs(squaredNorm - 1) > 1e-12)
        addIssue(
          issues,
          `${path}.quaternion`,
          'non-unit-quaternion',
          'quaternion norm must equal one',
        );
    }
    finiteTuple(entry.translation, 3, `${path}.translation`, issues);
  });
  if (
    transformed.size !== mesh.faceIds.size ||
    [...mesh.faceIds].some((id) => !transformed.has(id))
  )
    addIssue(
      issues,
      '$.target.faceTransforms',
      'incomplete-coverage',
      'must transform every mesh face exactly once',
    );
}

type TargetReferences = Readonly<{ overlapRegionIds: readonly string[] }>;

function directedGraphHasCycle(
  nodes: Iterable<string>,
  edges: Iterable<readonly [string, string]>,
): boolean {
  const graph = new Map<string, Set<string>>();
  for (const node of nodes) graph.set(node, new Set());
  for (const [from, to] of edges) {
    const outgoing = graph.get(from) ?? new Set<string>();
    outgoing.add(to);
    graph.set(from, outgoing);
    if (!graph.has(to)) graph.set(to, new Set());
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cyclicFrom = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) if (cyclicFrom(next)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return [...graph.keys()].some(cyclicFrom);
}

function validateTarget(
  value: unknown,
  input: InputContext,
  mesh: MeshContext,
  issues: ArtifactContractIssue[],
): TargetReferences {
  if (!isRecord(value)) {
    addIssue(issues, '$.target', 'invalid-object', 'target must be an object');
    return { overlapRegionIds: [] };
  }
  const common = ['schemaVersion', 'kind', 'faceTransforms', 'goalFaceOrders', 'overlapRegionIds'];
  if (value.kind === 'flat-folded-cp') {
    exactKeys(
      value,
      [...common, 'assignmentPolicy', 'resolvedInteriorAssignments'],
      '$.target',
      issues,
    );
  } else if (value.kind === 'uniaxial-tree-base') {
    exactKeys(value, [...common, 'branchMeasurements', 'rotation'], '$.target', issues);
  } else {
    exactKeys(value, common, '$.target', issues);
    addIssue(
      issues,
      '$.target.kind',
      'invalid-enum',
      'must be flat-folded-cp or uniaxial-tree-base',
    );
  }
  if (value.schemaVersion !== 1)
    addIssue(issues, '$.target.schemaVersion', 'invalid-literal', 'must equal 1');
  if (
    (input.kind === 'fold-verification' && value.kind !== 'flat-folded-cp') ||
    (input.kind === 'design-generation' && value.kind !== 'uniaxial-tree-base')
  ) {
    addIssue(
      issues,
      '$.target.kind',
      'workflow-target-mismatch',
      'input workflow and target kind are incompatible',
    );
  }
  validateFaceTransforms(value.faceTransforms, mesh, issues);
  const goalLayerEdges: [string, string][] = [];
  if (!Array.isArray(value.goalFaceOrders)) {
    addIssue(issues, '$.target.goalFaceOrders', 'invalid-array', 'goalFaceOrders must be an array');
  } else {
    const relations = new Set<string>();
    value.goalFaceOrders.forEach((entry, index) => {
      const path = `$.target.goalFaceOrders[${index}]`;
      if (!Array.isArray(entry) || entry.length !== 3) {
        addIssue(issues, path, 'invalid-tuple', 'must contain face, face, and -1 or 1');
        return;
      }
      const pair = idPair(entry.slice(0, 2), path, issues);
      if (pair !== undefined) requireReferences(pair, mesh.faceIds, path, issues, 'face');
      if (entry[2] !== -1 && entry[2] !== 1)
        addIssue(issues, `${path}[2]`, 'invalid-enum', 'must equal -1 or 1');
      if (pair !== undefined) {
        const key = undirectedEdgeKey(pair[0], pair[1]);
        if (relations.has(key))
          addIssue(issues, path, 'duplicate-reference', 'face pair order is repeated');
        relations.add(key);
        if (entry[2] === 1) goalLayerEdges.push([pair[0], pair[1]]);
        if (entry[2] === -1) goalLayerEdges.push([pair[1], pair[0]]);
      }
    });
  }
  if (directedGraphHasCycle(mesh.faceIds, goalLayerEdges))
    addIssue(
      issues,
      '$.target.goalFaceOrders',
      'goal-layer-cycle',
      'terminal face-order relation must be acyclic',
    );
  const overlapRegionIds =
    idArray(value.overlapRegionIds, '$.target.overlapRegionIds', issues) ?? [];
  if (value.kind === 'flat-folded-cp') {
    if (value.assignmentPolicy !== 'respect-mv-solve-u')
      addIssue(
        issues,
        '$.target.assignmentPolicy',
        'invalid-literal',
        'must equal respect-mv-solve-u',
      );
    const resolved = new Set<string>();
    if (!Array.isArray(value.resolvedInteriorAssignments)) {
      addIssue(issues, '$.target.resolvedInteriorAssignments', 'invalid-array', 'must be an array');
    } else {
      value.resolvedInteriorAssignments.forEach((entry, index) => {
        const path = `$.target.resolvedInteriorAssignments[${index}]`;
        if (!isRecord(entry)) {
          addIssue(issues, path, 'invalid-object', 'resolved assignment must be an object');
          return;
        }
        exactKeys(entry, ['edgeId', 'assignment'], path, issues);
        const edgeId = entry.edgeId;
        const assignment = entry.assignment;
        const edgeIdOk = stableId(edgeId, `${path}.edgeId`, issues);
        if (edgeIdOk) {
          if (!mesh.interiorEdgeIds.has(edgeId))
            addIssue(
              issues,
              `${path}.edgeId`,
              'missing-reference',
              `unknown interior edge ${edgeId}`,
            );
          if (resolved.has(edgeId))
            addIssue(
              issues,
              `${path}.edgeId`,
              'duplicate-reference',
              'edge assignment is repeated',
            );
          resolved.add(edgeId);
        }
        const assignmentOk = enumValue(
          assignment,
          INTERIOR_ASSIGNMENTS,
          `${path}.assignment`,
          issues,
        );
        if (edgeIdOk && assignmentOk) {
          const fixedAssignment = mesh.assignmentByEdgeId.get(edgeId);
          if (
            fixedAssignment !== undefined &&
            fixedAssignment !== 'U' &&
            fixedAssignment !== assignment
          )
            addIssue(
              issues,
              `${path}.assignment`,
              'fixed-assignment-mismatch',
              `fixed mesh assignment ${fixedAssignment} cannot be changed by target resolution`,
            );
        }
      });
    }
    if (
      resolved.size !== mesh.interiorEdgeIds.size ||
      [...mesh.interiorEdgeIds].some((id) => !resolved.has(id))
    )
      addIssue(
        issues,
        '$.target.resolvedInteriorAssignments',
        'incomplete-coverage',
        'must resolve every interior crease',
      );
  }
  if (value.kind === 'uniaxial-tree-base') {
    const measured = new Set<string>();
    if (!Array.isArray(value.branchMeasurements)) {
      addIssue(
        issues,
        '$.target.branchMeasurements',
        'invalid-array',
        'branchMeasurements must be an array',
      );
    } else {
      value.branchMeasurements.forEach((entry, index) => {
        const path = `$.target.branchMeasurements[${index}]`;
        if (!isRecord(entry)) {
          addIssue(issues, path, 'invalid-object', 'branch measurement must be an object');
          return;
        }
        exactKeys(
          entry,
          ['treeEdgeId', 'axisEndpoints', 'effectiveLength', 'effectiveWidth'],
          path,
          issues,
        );
        const treeEdgeId = entry.treeEdgeId;
        const effectiveLength = entry.effectiveLength;
        const effectiveWidth = entry.effectiveWidth;
        if (stableId(treeEdgeId, `${path}.treeEdgeId`, issues)) {
          if (!input.treeEdgeIds.has(treeEdgeId))
            addIssue(
              issues,
              `${path}.treeEdgeId`,
              'missing-reference',
              `unknown tree edge ${treeEdgeId}`,
            );
          if (measured.has(treeEdgeId))
            addIssue(
              issues,
              `${path}.treeEdgeId`,
              'duplicate-reference',
              'tree edge measurement is repeated',
            );
          measured.add(treeEdgeId);
        }
        if (!Array.isArray(entry.axisEndpoints) || entry.axisEndpoints.length !== 2) {
          addIssue(
            issues,
            `${path}.axisEndpoints`,
            'invalid-tuple',
            'must contain two 2D endpoints',
          );
        } else {
          finiteTuple(entry.axisEndpoints[0], 2, `${path}.axisEndpoints[0]`, issues);
          finiteTuple(entry.axisEndpoints[1], 2, `${path}.axisEndpoints[1]`, issues);
        }
        if (finite(effectiveLength, `${path}.effectiveLength`, issues) && effectiveLength <= 0)
          addIssue(issues, `${path}.effectiveLength`, 'out-of-range', 'must be positive');
        if (finite(effectiveWidth, `${path}.effectiveWidth`, issues) && effectiveWidth < 0)
          addIssue(issues, `${path}.effectiveWidth`, 'out-of-range', 'must be non-negative');
        if (
          typeof treeEdgeId === 'string' &&
          typeof effectiveLength === 'number' &&
          Number.isFinite(effectiveLength) &&
          typeof effectiveWidth === 'number' &&
          Number.isFinite(effectiveWidth)
        ) {
          const expected = input.treeEdgeDimensions.get(treeEdgeId);
          if (
            expected !== undefined &&
            (effectiveLength !== expected.length || effectiveWidth !== expected.width)
          )
            addIssue(
              issues,
              path,
              'branch-measurement-mismatch',
              'target branch length and width must preserve the input tree measurement',
            );
        }
      });
    }
    if (
      measured.size !== input.treeEdgeIds.size ||
      [...input.treeEdgeIds].some((id) => !measured.has(id))
    )
      addIssue(
        issues,
        '$.target.branchMeasurements',
        'incomplete-coverage',
        'must measure every tree edge',
      );
    validateRotation(
      value.rotation,
      '$.target.rotation',
      input.treeNodeIds,
      input.treeEdgeIds,
      input.incidentTreeEdges,
      issues,
    );
  }
  return { overlapRegionIds };
}

function validateMotionEdge(
  value: unknown,
  path: string,
  mesh: MeshContext,
  seen: Set<string>,
  issues: ArtifactContractIssue[],
): string | undefined {
  if (!stableId(value, path, issues)) return undefined;
  if (!mesh.interiorEdgeIds.has(value))
    addIssue(issues, path, 'missing-reference', `unknown movable crease ${value}`);
  if (seen.has(value)) addIssue(issues, path, 'duplicate-reference', 'crease motion is repeated');
  seen.add(value);
  return value;
}

type BoundedMotionEndpointMap = ReadonlyMap<
  string,
  Readonly<{ startAngle: number; endAngle: number }>
>;

function validateBoundedMotion(
  value: Record<string, unknown>,
  path: string,
  segmentInterval: readonly [number, number] | undefined,
  mesh: MeshContext,
  issues: ArtifactContractIssue[],
): BoundedMotionEndpointMap | undefined {
  const issueCountBefore = issues.length;
  exactKeys(
    value,
    ['kind', 'knotTimes', 'anglesByCrease', 'intervalAngleBoundsByCrease'],
    path,
    issues,
  );
  const knots: number[] = [];
  if (!Array.isArray(value.knotTimes) || value.knotTimes.length < 2) {
    addIssue(issues, `${path}.knotTimes`, 'invalid-array', 'requires at least two knot times');
  } else {
    value.knotTimes.forEach((entry, index) => {
      if (finite(entry, `${path}.knotTimes[${index}]`, issues)) knots.push(entry);
    });
    if (knots.some((entry, index) => index > 0 && entry <= (knots[index - 1] ?? entry)))
      addIssue(
        issues,
        `${path}.knotTimes`,
        'non-monotonic-time',
        'knot times must strictly increase',
      );
    if (
      segmentInterval !== undefined &&
      (knots[0] !== segmentInterval[0] || knots.at(-1) !== segmentInterval[1])
    )
      addIssue(
        issues,
        `${path}.knotTimes`,
        'incomplete-time-coverage',
        'knots must cover the segment endpoints',
      );
  }
  const angleEdges = new Set<string>();
  const anglesByEdge = new Map<string, number[]>();
  if (!Array.isArray(value.anglesByCrease) || value.anglesByCrease.length === 0) {
    addIssue(issues, `${path}.anglesByCrease`, 'invalid-array', 'must be a non-empty array');
  } else {
    value.anglesByCrease.forEach((entry, index) => {
      const entryPath = `${path}.anglesByCrease[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, entryPath, 'invalid-object', 'crease angles must be an object');
        return;
      }
      exactKeys(entry, ['edgeId', 'angles'], entryPath, issues);
      const edgeId = validateMotionEdge(
        entry.edgeId,
        `${entryPath}.edgeId`,
        mesh,
        angleEdges,
        issues,
      );
      if (!Array.isArray(entry.angles) || entry.angles.length !== knots.length) {
        addIssue(
          issues,
          `${entryPath}.angles`,
          'parallel-array-mismatch',
          'must have one angle per knot',
        );
      } else {
        const angles: number[] = [];
        entry.angles.forEach((angle, angleIndex) => {
          if (finite(angle, `${entryPath}.angles[${angleIndex}]`, issues)) angles.push(angle);
        });
        if (edgeId !== undefined && angles.length === entry.angles.length)
          anglesByEdge.set(edgeId, angles);
      }
    });
  }
  const boundEdges = new Set<string>();
  const boundsByEdge = new Map<string, [number, number][]>();
  if (
    !Array.isArray(value.intervalAngleBoundsByCrease) ||
    value.intervalAngleBoundsByCrease.length === 0
  ) {
    addIssue(
      issues,
      `${path}.intervalAngleBoundsByCrease`,
      'invalid-array',
      'must be a non-empty array',
    );
  } else {
    value.intervalAngleBoundsByCrease.forEach((entry, index) => {
      const entryPath = `${path}.intervalAngleBoundsByCrease[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, entryPath, 'invalid-object', 'crease bounds must be an object');
        return;
      }
      exactKeys(entry, ['edgeId', 'bounds'], entryPath, issues);
      const edgeId = validateMotionEdge(
        entry.edgeId,
        `${entryPath}.edgeId`,
        mesh,
        boundEdges,
        issues,
      );
      if (!Array.isArray(entry.bounds) || entry.bounds.length !== Math.max(0, knots.length - 1)) {
        addIssue(
          issues,
          `${entryPath}.bounds`,
          'parallel-array-mismatch',
          'must have one bound per knot interval',
        );
      } else {
        const bounds: [number, number][] = [];
        entry.bounds.forEach((bound, boundIndex) => {
          const pair = finiteTuple(bound, 2, `${entryPath}.bounds[${boundIndex}]`, issues);
          const lower = pair?.[0];
          const upper = pair?.[1];
          if (lower !== undefined && upper !== undefined) {
            bounds.push([lower, upper]);
            if (lower > upper)
              addIssue(
                issues,
                `${entryPath}.bounds[${boundIndex}]`,
                'invalid-bounds',
                'lower bound must not exceed upper bound',
              );
          }
        });
        if (edgeId !== undefined && bounds.length === entry.bounds.length)
          boundsByEdge.set(edgeId, bounds);
      }
    });
  }
  if (angleEdges.size !== boundEdges.size || [...angleEdges].some((id) => !boundEdges.has(id)))
    addIssue(
      issues,
      path,
      'motion-map-mismatch',
      'angle and interval-bound crease sets must match',
    );
  for (const [edgeId, angles] of anglesByEdge) {
    const bounds = boundsByEdge.get(edgeId);
    if (bounds === undefined) continue;
    bounds.forEach(([lower, upper], index) => {
      const startAngle = angles[index];
      const endAngle = angles[index + 1];
      if (
        startAngle !== undefined &&
        endAngle !== undefined &&
        (startAngle < lower || startAngle > upper || endAngle < lower || endAngle > upper)
      )
        addIssue(
          issues,
          `${path}.intervalAngleBoundsByCrease`,
          'angle-outside-bound',
          `interval bound for ${edgeId} must contain both adjacent knot angles`,
        );
    });
  }
  if (issues.length !== issueCountBefore) return undefined;
  const endpoints = new Map<string, Readonly<{ startAngle: number; endAngle: number }>>();
  for (const [edgeId, angles] of anglesByEdge) {
    const startAngle = angles[0];
    const endAngle = angles.at(-1);
    if (startAngle === undefined || endAngle === undefined) return undefined;
    endpoints.set(edgeId, { startAngle, endAngle });
  }
  return endpoints;
}

function validatePolynomialMotion(
  value: Record<string, unknown>,
  path: string,
  mesh: MeshContext,
  issues: ArtifactContractIssue[],
): void {
  exactKeys(
    value,
    ['kind', 'degree', 'coefficientsByCrease', 'derivativeBoundsByCrease'],
    path,
    issues,
  );
  const degree = value.degree;
  const degreeOk =
    finite(degree, `${path}.degree`, issues) && Number.isSafeInteger(degree) && degree >= 1;
  if (typeof degree === 'number' && (!Number.isSafeInteger(degree) || degree < 1))
    addIssue(issues, `${path}.degree`, 'out-of-range', 'degree must be a positive safe integer');
  const coefficientEdges = new Set<string>();
  if (!Array.isArray(value.coefficientsByCrease) || value.coefficientsByCrease.length === 0) {
    addIssue(issues, `${path}.coefficientsByCrease`, 'invalid-array', 'must be a non-empty array');
  } else {
    value.coefficientsByCrease.forEach((entry, index) => {
      const entryPath = `${path}.coefficientsByCrease[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, entryPath, 'invalid-object', 'polynomial coefficients must be an object');
        return;
      }
      exactKeys(entry, ['edgeId', 'coefficients'], entryPath, issues);
      validateMotionEdge(entry.edgeId, `${entryPath}.edgeId`, mesh, coefficientEdges, issues);
      if (!Array.isArray(entry.coefficients) || entry.coefficients.length === 0) {
        addIssue(
          issues,
          `${entryPath}.coefficients`,
          'invalid-array',
          'requires at least one coefficient row',
        );
      } else
        entry.coefficients.forEach((row, rowIndex) => {
          if (!Array.isArray(row) || (degreeOk && row.length !== degree + 1)) {
            addIssue(
              issues,
              `${entryPath}.coefficients[${rowIndex}]`,
              'coefficient-degree-mismatch',
              'row length must equal degree + 1',
            );
          } else
            row.forEach((coefficient, coefficientIndex) =>
              finite(
                coefficient,
                `${entryPath}.coefficients[${rowIndex}][${coefficientIndex}]`,
                issues,
              ),
            );
        });
    });
  }
  const boundEdges = new Set<string>();
  if (
    !Array.isArray(value.derivativeBoundsByCrease) ||
    value.derivativeBoundsByCrease.length === 0
  ) {
    addIssue(
      issues,
      `${path}.derivativeBoundsByCrease`,
      'invalid-array',
      'must be a non-empty array',
    );
  } else {
    value.derivativeBoundsByCrease.forEach((entry, index) => {
      const entryPath = `${path}.derivativeBoundsByCrease[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, entryPath, 'invalid-object', 'derivative bounds must be an object');
        return;
      }
      exactKeys(entry, ['edgeId', 'bounds'], entryPath, issues);
      validateMotionEdge(entry.edgeId, `${entryPath}.edgeId`, mesh, boundEdges, issues);
      const bounds = finiteTuple(entry.bounds, 2, `${entryPath}.bounds`, issues);
      if (bounds !== undefined && (bounds[0] ?? 0) > (bounds[1] ?? 0))
        addIssue(
          issues,
          `${entryPath}.bounds`,
          'invalid-bounds',
          'lower bound must not exceed upper bound',
        );
    });
  }
  if (
    coefficientEdges.size !== boundEdges.size ||
    [...coefficientEdges].some((id) => !boundEdges.has(id))
  )
    addIssue(
      issues,
      path,
      'motion-map-mismatch',
      'coefficient and derivative-bound crease sets must match',
    );
}

function validatePath(value: unknown, mesh: MeshContext, issues: ArtifactContractIssue[]): void {
  if (!isRecord(value)) {
    addIssue(issues, '$.pathCandidate', 'invalid-object', 'pathCandidate must be an object');
    return;
  }
  exactKeys(
    value,
    ['representationVersion', 'representationStatus', 'segments'],
    '$.pathCandidate',
    issues,
  );
  if (value.representationVersion !== 1)
    addIssue(issues, '$.pathCandidate.representationVersion', 'invalid-literal', 'must equal 1');
  if (value.representationStatus !== 'candidate')
    addIssue(
      issues,
      '$.pathCandidate.representationStatus',
      'claim-boundary',
      'must remain candidate',
    );
  if (!Array.isArray(value.segments) || value.segments.length === 0) {
    addIssue(issues, '$.pathCandidate.segments', 'invalid-array', 'requires at least one segment');
    return;
  }
  let previousEnd: number | undefined;
  let representationKind: 'bounded-interpolation' | 'piecewise-polynomial' | undefined;
  let previousBoundedEndpoints:
    | Readonly<{
        interval: readonly [number, number];
        endpoints: BoundedMotionEndpointMap;
      }>
    | undefined;
  value.segments.forEach((entry, index) => {
    const path = `$.pathCandidate.segments[${index}]`;
    const issueCountBefore = issues.length;
    if (!isRecord(entry)) {
      addIssue(issues, path, 'invalid-object', 'path segment must be an object');
      previousBoundedEndpoints = undefined;
      return;
    }
    exactKeys(entry, ['t0', 't1', 'motion'], path, issues);
    const segmentInterval = interval([entry.t0, entry.t1], path, issues, false);
    if (segmentInterval !== undefined) {
      if (
        (index === 0 && segmentInterval[0] !== 0) ||
        (previousEnd !== undefined && segmentInterval[0] !== previousEnd)
      ) {
        addIssue(
          issues,
          `${path}.t0`,
          'incomplete-time-coverage',
          'segments must contiguously cover [0,1]',
        );
      }
      previousEnd = segmentInterval[1];
    }
    if (!isRecord(entry.motion)) {
      addIssue(issues, `${path}.motion`, 'invalid-object', 'motion must be an object');
      previousBoundedEndpoints = undefined;
    } else if (entry.motion.kind === 'bounded-interpolation') {
      if (representationKind !== undefined && representationKind !== entry.motion.kind)
        addIssue(
          issues,
          `${path}.motion.kind`,
          'mixed-path-representation',
          'all path segments must use one candidate representation',
        );
      representationKind = entry.motion.kind;
      const endpoints = validateBoundedMotion(
        entry.motion,
        `${path}.motion`,
        segmentInterval,
        mesh,
        issues,
      );
      const structurallyValid = issues.length === issueCountBefore;
      if (structurallyValid && segmentInterval !== undefined && endpoints !== undefined) {
        if (
          previousBoundedEndpoints !== undefined &&
          previousBoundedEndpoints.interval[1] === segmentInterval[0]
        ) {
          const previous = previousBoundedEndpoints.endpoints;
          const mapsMatch =
            previous.size === endpoints.size &&
            [...previous.keys()].every((id) => endpoints.has(id));
          if (!mapsMatch) {
            addIssue(
              issues,
              `${path}.motion.anglesByCrease`,
              'path-endpoint-map-mismatch',
              'adjacent bounded-interpolation segments must declare the same crease map',
            );
          } else if (
            [...previous].some(
              ([edgeId, endpoint]) => endpoint.endAngle !== endpoints.get(edgeId)?.startAngle,
            )
          ) {
            addIssue(
              issues,
              `${path}.motion.anglesByCrease`,
              'path-endpoint-discontinuity',
              'adjacent bounded-interpolation segments must agree at their shared endpoint',
            );
          }
        }
        previousBoundedEndpoints = { interval: segmentInterval, endpoints };
      } else {
        previousBoundedEndpoints = undefined;
      }
    } else if (entry.motion.kind === 'piecewise-polynomial') {
      if (representationKind !== undefined && representationKind !== entry.motion.kind)
        addIssue(
          issues,
          `${path}.motion.kind`,
          'mixed-path-representation',
          'all path segments must use one candidate representation',
        );
      representationKind = entry.motion.kind;
      validatePolynomialMotion(entry.motion, `${path}.motion`, mesh, issues);
      previousBoundedEndpoints = undefined;
    } else {
      addIssue(issues, `${path}.motion.kind`, 'invalid-enum', 'unsupported path representation');
      previousBoundedEndpoints = undefined;
    }
  });
  if (previousEnd !== 1)
    addIssue(
      issues,
      '$.pathCandidate.segments',
      'incomplete-time-coverage',
      'segments must end at t=1',
    );
}

type ContinuousCoplanarContact = Readonly<{
  interval: readonly [number, number];
  overlapRegionId: string;
  faceIds: readonly [string, string];
}>;

type ValidCoplanarContact = ContinuousCoplanarContact &
  Readonly<{
    id: string;
  }>;

type ValidLayerRelation = Readonly<{
  id: string;
  interval: readonly [number, number];
  overlapRegionId: string;
  above: string;
  below: string;
}>;

function closedIntervalsIntersect(
  first: readonly [number, number],
  second: readonly [number, number],
): boolean {
  return first[0] <= second[1] && second[0] <= first[1];
}

function relationAppearsWithinContact(
  relation: ValidLayerRelation,
  contact: ContinuousCoplanarContact,
): boolean {
  return (
    relation.overlapRegionId === contact.overlapRegionId &&
    contact.faceIds.includes(relation.above) &&
    contact.faceIds.includes(relation.below) &&
    closedIntervalsIntersect(relation.interval, contact.interval)
  );
}

function layerRelationsCoverContact(
  relations: readonly ValidLayerRelation[],
  contact: ContinuousCoplanarContact,
): boolean {
  const clippedIntervals = relations
    .filter((relation) => relationAppearsWithinContact(relation, contact))
    .map(
      ({ interval: relationInterval }) =>
        [
          Math.max(relationInterval[0], contact.interval[0]),
          Math.min(relationInterval[1], contact.interval[1]),
        ] as const,
    )
    .sort((left, right) => left[0] - right[0] || left[1] - right[1]);
  const first = clippedIntervals[0];
  if (first === undefined || first[0] !== contact.interval[0]) return false;
  let coveredThrough = first[1];
  for (const candidate of clippedIntervals.slice(1)) {
    if (candidate[0] > coveredThrough) return false;
    coveredThrough = Math.max(coveredThrough, candidate[1]);
  }
  return coveredThrough === contact.interval[1];
}

function recordLocalStableId(value: unknown, declared: Set<string>, duplicates: Set<string>): void {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) return;
  if (declared.has(value)) duplicates.add(value);
  else declared.add(value);
}

function normalizedFacePair(faceIds: readonly [string, string]): readonly [string, string] {
  return faceIds[0] <= faceIds[1] ? faceIds : [faceIds[1], faceIds[0]];
}

function continuousCoplanarContacts(
  contacts: readonly ValidCoplanarContact[],
): ContinuousCoplanarContact[] {
  const groups = new Map<
    string,
    {
      overlapRegionId: string;
      faceIds: readonly [string, string];
      intervals: (readonly [number, number])[];
    }
  >();
  for (const contact of contacts) {
    const faceIds = normalizedFacePair(contact.faceIds);
    const key = JSON.stringify([contact.overlapRegionId, ...faceIds]);
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, {
        overlapRegionId: contact.overlapRegionId,
        faceIds,
        intervals: [contact.interval],
      });
    } else {
      group.intervals.push(contact.interval);
    }
  }

  const result: ContinuousCoplanarContact[] = [];
  for (const group of groups.values()) {
    const intervals = [...group.intervals].sort(
      (left, right) => left[0] - right[0] || left[1] - right[1],
    );
    let current: [number, number] | undefined;
    for (const candidate of intervals) {
      if (current === undefined) {
        current = [candidate[0], candidate[1]];
      } else if (candidate[0] <= current[1]) {
        current[1] = Math.max(current[1], candidate[1]);
      } else {
        result.push({
          interval: current,
          overlapRegionId: group.overlapRegionId,
          faceIds: group.faceIds,
        });
        current = [candidate[0], candidate[1]];
      }
    }
    if (current !== undefined)
      result.push({
        interval: current,
        overlapRegionId: group.overlapRegionId,
        faceIds: group.faceIds,
      });
  }
  return result;
}

function validateOverlapAndEvents(
  root: Record<string, unknown>,
  mesh: MeshContext,
  targetReferences: TargetReferences,
  seen: Map<string, string>,
  issues: ArtifactContractIssue[],
): void {
  const participantIssueCountBefore = issues.length;
  const overlapIds = new Set<string>();
  const overlapFaces = new Map<string, ReadonlySet<string>>();
  const declaredOverlapIds = new Set<string>();
  const duplicateOverlapIds = new Set<string>();
  const validOverlapCandidates: Readonly<{ id: string; faceIds: ReadonlySet<string> }>[] = [];
  if (!Array.isArray(root.overlapRegions)) {
    addIssue(issues, '$.overlapRegions', 'invalid-array', 'overlapRegions must be an array');
  } else {
    root.overlapRegions.forEach((entry, index) => {
      const path = `$.overlapRegions[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, path, 'invalid-object', 'overlap region must be an object');
        return;
      }
      const issueCountBefore = issues.length;
      exactKeys(entry, ['id', 'faceIds'], path, issues);
      const overlapId = entry.id;
      recordLocalStableId(overlapId, declaredOverlapIds, duplicateOverlapIds);
      const idOk = registerId(overlapId, `${path}.id`, seen, issues);
      if (idOk) overlapIds.add(overlapId);
      const faces = idPair(entry.faceIds, `${path}.faceIds`, issues);
      if (faces !== undefined) {
        requireReferences(faces, mesh.faceIds, `${path}.faceIds`, issues, 'face');
        if (typeof overlapId === 'string') {
          const faceSet = new Set(faces);
          overlapFaces.set(overlapId, faceSet);
          if (idOk && issues.length === issueCountBefore)
            validOverlapCandidates.push({ id: overlapId, faceIds: faceSet });
        }
      }
    });
  }
  const validOverlapFaces = new Map(
    validOverlapCandidates
      .filter(({ id }) => !duplicateOverlapIds.has(id))
      .map(({ id, faceIds }) => [id, faceIds]),
  );
  requireReferences(
    targetReferences.overlapRegionIds,
    overlapIds,
    '$.target.overlapRegionIds',
    issues,
    'overlap region',
  );

  const declaredContactIds = new Set<string>();
  const duplicateContactIds = new Set<string>();
  const validCoplanarContactCandidates: ValidCoplanarContact[] = [];
  if (!Array.isArray(root.contacts)) {
    addIssue(issues, '$.contacts', 'invalid-array', 'contacts must be an array');
  } else {
    root.contacts.forEach((entry, index) => {
      const path = `$.contacts[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, path, 'invalid-object', 'contact must be an object');
        return;
      }
      const issueCountBefore = issues.length;
      exactKeys(
        entry,
        ['id', 'interval', 'faceIds', 'overlapRegionId', 'classification'],
        path,
        issues,
      );
      recordLocalStableId(entry.id, declaredContactIds, duplicateContactIds);
      const idOk = registerId(entry.id, `${path}.id`, seen, issues);
      const contactInterval = interval(entry.interval, `${path}.interval`, issues, true);
      const faces = idPair(entry.faceIds, `${path}.faceIds`, issues);
      if (faces !== undefined)
        requireReferences(faces, mesh.faceIds, `${path}.faceIds`, issues, 'face');
      const classificationOk = enumValue(
        entry.classification,
        ['point', 'edge', 'tangential-face', 'coplanar-overlap'],
        `${path}.classification`,
        issues,
      );
      let overlapOk = false;
      if (entry.overlapRegionId !== null) {
        if (stableId(entry.overlapRegionId, `${path}.overlapRegionId`, issues)) {
          overlapOk = true;
          if (!overlapIds.has(entry.overlapRegionId))
            addIssue(
              issues,
              `${path}.overlapRegionId`,
              'missing-reference',
              `unknown overlap region ${entry.overlapRegionId}`,
            );
          const regionFaces = overlapFaces.get(entry.overlapRegionId);
          if (
            faces !== undefined &&
            regionFaces !== undefined &&
            faces.some((id) => !regionFaces.has(id))
          )
            addIssue(
              issues,
              path,
              'contact-region-mismatch',
              'contact faces must match overlap region faces',
            );
        }
      } else if (classificationOk && entry.classification === 'coplanar-overlap') {
        addIssue(
          issues,
          `${path}.overlapRegionId`,
          'missing-reference',
          'coplanar overlap requires an overlap region',
        );
      }
      if (
        issues.length === issueCountBefore &&
        idOk &&
        typeof entry.id === 'string' &&
        contactInterval !== undefined &&
        faces !== undefined &&
        classificationOk &&
        entry.classification === 'coplanar-overlap' &&
        overlapOk &&
        typeof entry.overlapRegionId === 'string' &&
        validOverlapFaces.has(entry.overlapRegionId)
      ) {
        validCoplanarContactCandidates.push({
          id: entry.id,
          interval: contactInterval,
          overlapRegionId: entry.overlapRegionId,
          faceIds: faces,
        });
      }
    });
  }
  const validCoplanarContacts = continuousCoplanarContacts(
    validCoplanarContactCandidates.filter(({ id }) => !duplicateContactIds.has(id)),
  );

  const layerRelations: { interval: [number, number]; above: string; below: string }[] = [];
  const declaredLayerEventIds = new Set<string>();
  const duplicateLayerEventIds = new Set<string>();
  const validLayerRelationCandidates: ValidLayerRelation[] = [];
  if (!Array.isArray(root.layerEvents)) {
    addIssue(issues, '$.layerEvents', 'invalid-array', 'layerEvents must be an array');
  } else {
    root.layerEvents.forEach((entry, index) => {
      const path = `$.layerEvents[${index}]`;
      if (!isRecord(entry)) {
        addIssue(issues, path, 'invalid-object', 'layer event must be an object');
        return;
      }
      const issueCountBefore = issues.length;
      exactKeys(
        entry,
        ['id', 'interval', 'overlapRegionId', 'aboveFaceId', 'belowFaceId'],
        path,
        issues,
      );
      recordLocalStableId(entry.id, declaredLayerEventIds, duplicateLayerEventIds);
      const idOk = registerId(entry.id, `${path}.id`, seen, issues);
      const eventInterval = interval(entry.interval, `${path}.interval`, issues, true);
      const overlapRegionId = entry.overlapRegionId;
      const aboveFaceId = entry.aboveFaceId;
      const belowFaceId = entry.belowFaceId;
      const overlapOk = stableId(overlapRegionId, `${path}.overlapRegionId`, issues);
      if (overlapOk && !overlapIds.has(overlapRegionId))
        addIssue(
          issues,
          `${path}.overlapRegionId`,
          'missing-reference',
          `unknown overlap region ${overlapRegionId}`,
        );
      const aboveOk = stableId(aboveFaceId, `${path}.aboveFaceId`, issues);
      const belowOk = stableId(belowFaceId, `${path}.belowFaceId`, issues);
      if (aboveOk && !mesh.faceIds.has(aboveFaceId))
        addIssue(issues, `${path}.aboveFaceId`, 'missing-reference', `unknown face ${aboveFaceId}`);
      if (belowOk && !mesh.faceIds.has(belowFaceId))
        addIssue(issues, `${path}.belowFaceId`, 'missing-reference', `unknown face ${belowFaceId}`);
      if (aboveOk && belowOk && aboveFaceId === belowFaceId)
        addIssue(issues, path, 'invalid-layer-relation', 'above and below faces must differ');
      if (overlapOk && aboveOk && belowOk) {
        const faces = overlapFaces.get(overlapRegionId);
        if (faces !== undefined && (!faces.has(aboveFaceId) || !faces.has(belowFaceId)))
          addIssue(
            issues,
            path,
            'layer-region-mismatch',
            'layer faces must match overlap region faces',
          );
        if (
          eventInterval !== undefined &&
          mesh.faceIds.has(aboveFaceId) &&
          mesh.faceIds.has(belowFaceId)
        )
          layerRelations.push({
            interval: eventInterval,
            above: aboveFaceId,
            below: belowFaceId,
          });
        if (
          issues.length === issueCountBefore &&
          idOk &&
          typeof entry.id === 'string' &&
          eventInterval !== undefined &&
          aboveFaceId !== belowFaceId &&
          validOverlapFaces.has(overlapRegionId)
        ) {
          validLayerRelationCandidates.push({
            id: entry.id,
            interval: eventInterval,
            overlapRegionId,
            above: aboveFaceId,
            below: belowFaceId,
          });
        }
      }
    });
  }
  const validLayerRelations = validLayerRelationCandidates.filter(
    ({ id }) => !duplicateLayerEventIds.has(id),
  );
  const coverageInferenceSafe = issues.length === participantIssueCountBefore;
  const endpoints = [...new Set(layerRelations.flatMap((relation) => relation.interval))].sort(
    (left, right) => left - right,
  );
  const sampleTimes = new Set(endpoints);
  for (let index = 1; index < endpoints.length; index += 1) {
    const previous = endpoints[index - 1];
    const current = endpoints[index];
    if (previous !== undefined && current !== undefined && previous < current)
      sampleTimes.add(previous + (current - previous) / 2);
  }
  const hasTemporalCycle = [...sampleTimes].some((time) =>
    directedGraphHasCycle(
      mesh.faceIds,
      layerRelations
        .filter((relation) => relation.interval[0] <= time && time <= relation.interval[1])
        .map((relation) => [relation.above, relation.below] as const),
    ),
  );
  if (hasTemporalCycle)
    addIssue(issues, '$.layerEvents', 'layer-cycle', 'layer-order relation must be acyclic');

  const contactsWithOrderReversal = validCoplanarContacts.filter((contact) => {
    const forward = validLayerRelations.filter(
      (relation) =>
        relationAppearsWithinContact(relation, contact) &&
        relation.above === contact.faceIds[0] &&
        relation.below === contact.faceIds[1],
    );
    const reverse = validLayerRelations.filter(
      (relation) =>
        relationAppearsWithinContact(relation, contact) &&
        relation.above === contact.faceIds[1] &&
        relation.below === contact.faceIds[0],
    );
    if (forward.length === 0 || reverse.length === 0) return false;
    const directionsOverlap = forward.some((first) =>
      reverse.some(
        (second) =>
          closedIntervalsIntersect(first.interval, second.interval) &&
          closedIntervalsIntersect(first.interval, contact.interval) &&
          closedIntervalsIntersect(second.interval, contact.interval),
      ),
    );
    return !directionsOverlap;
  });
  if (contactsWithOrderReversal.length > 0) {
    addIssue(
      issues,
      '$.layerEvents',
      'layer-order-reversal',
      'one continuous coplanar-overlap contact cannot reverse its declared face order',
    );
  }
  if (
    coverageInferenceSafe &&
    !hasTemporalCycle &&
    validCoplanarContacts.some(
      (contact) =>
        !contactsWithOrderReversal.includes(contact) &&
        !layerRelationsCoverContact(validLayerRelations, contact),
    )
  ) {
    addIssue(
      issues,
      '$.layerEvents',
      'incomplete-layer-contact-coverage',
      'valid layer-event intervals must continuously cover each declared coplanar contact',
    );
  }
}

/**
 * Parses the M0F-0 candidate artifact contract and checks invariants that JSON
 * Schema cannot express. Passing this parser is not a scientific verification.
 */
export function parseArtifactContractV1(supplied: unknown): ArtifactContractParseResult {
  const issues: ArtifactContractIssue[] = [];
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'invalid-object',
          message: 'artifact contract must be one cloneable plain JSON-data snapshot',
        },
      ],
    };
  }
  const value = snapshot.value;
  if (!isRecord(value)) {
    return {
      ok: false,
      error: [
        { path: '$', code: 'invalid-object', message: 'artifact contract must be an object' },
      ],
    };
  }
  exactKeys(value, ROOT_KEYS, '$', issues);
  if (value.schemaVersion !== 1)
    addIssue(issues, '$.schemaVersion', 'invalid-literal', 'must equal 1');
  if (value.schemaId !== ARTIFACT_CONTRACT_SCHEMA_ID)
    addIssue(issues, '$.schemaId', 'invalid-literal', `must equal ${ARTIFACT_CONTRACT_SCHEMA_ID}`);
  stableId(value.contractId, '$.contractId', issues);
  if (value.conventionsId !== M0F_CONVENTIONS_ID)
    addIssue(issues, '$.conventionsId', 'invalid-literal', `must equal ${M0F_CONVENTIONS_ID}`);
  if (value.contractStatus !== 'candidate')
    addIssue(issues, '$.contractStatus', 'claim-boundary', 'M0F-0 contract must remain candidate');
  if (value.scientificClaim !== false)
    addIssue(
      issues,
      '$.scientificClaim',
      'claim-boundary',
      'M0F-0 contract cannot make a scientific claim',
    );

  const seen = new Map<string, string>();
  const input = validateInput(value.input, seen, issues);
  const mesh = validateMesh(value.creaseMesh, input, seen, issues);
  const target = validateTarget(value.target, input, mesh, issues);
  validatePath(value.pathCandidate, mesh, issues);
  validateOverlapAndEvents(value, mesh, target, seen, issues);

  if (issues.length > 0) return { ok: false, error: issues };
  const ownedValue = deepFreezeOwned(value);
  return { ok: true, value: ownedValue as unknown as ArtifactContractV1 };
}
