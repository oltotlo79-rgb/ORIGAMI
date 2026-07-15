import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
import {
  buildPolygonRiverPackingProblemV1,
  POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
} from '../../m0f/box-pleating/polygon-river-packing-problem.js';
import { enumerateOrderedTreeSquareGridCandidatesV1 } from '../../m0f/box-pleating/ordered-tree-square-grid-candidates.js';
import { DEFAULT_ORDERED_TREE_INPUT } from '../../m0f/ordered-tree-cli.js';
import {
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_REQUEST_MESSAGE_TYPE,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
} from '../../m0f/workers/polygon-river-packing-problem-protocol.js';

export type JsonRecord = Record<string, unknown>;

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

export function packingWorkerDefaultSource(): JsonRecord {
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

export function packingWorkerFirstCandidateId(source: JsonRecord): string {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('worker test source must enumerate');
  const candidate = enumerated.value.quantization.candidates[0];
  if (candidate === undefined) throw new Error('worker test source must contain a candidate');
  return candidate.candidateId;
}

export function packingWorkerInput(
  source: JsonRecord = packingWorkerDefaultSource(),
  candidateId = packingWorkerFirstCandidateId(source),
): JsonRecord {
  return {
    schemaVersion: 1,
    recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    source,
    candidateId,
  };
}

export function packingWorkerRequest(
  jobId = 'packing-job:default',
  input: JsonRecord = packingWorkerInput(),
): JsonRecord {
  return {
    schemaVersion: POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: POLYGON_RIVER_PACKING_PROBLEM_WORKER_REQUEST_MESSAGE_TYPE,
    operation: POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
    contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
    scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    input,
  };
}

export function packingWorkerCompletedResponse(
  jobId = 'packing-job:default',
  input: JsonRecord = packingWorkerInput(),
): JsonRecord {
  const built = buildPolygonRiverPackingProblemV1(input);
  if (!built.ok) throw new Error('worker response fixture must build');
  return {
    schemaVersion: POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE,
    operation: POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
    contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
    scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    sourceInput: input,
    outcome: 'completed',
    reason: null,
    result: structuredClone(built.value),
  };
}

export function packingWorkerFailedResponse(
  jobId = 'packing-job:default',
  input: JsonRecord = packingWorkerInput(),
  reason: 'packing-problem-build-failed' | 'internal-error' = 'packing-problem-build-failed',
): JsonRecord {
  return {
    schemaVersion: POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE,
    operation: POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
    contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
    scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    sourceInput: input,
    outcome: 'failed',
    reason,
    result: null,
  };
}

function maximalCaterpillarTree(): MutableTree {
  const nodes: MutableTree['nodes'] = [];
  const edges: MutableTree['edges'] = [];
  const rotation: MutableTree['rotation'] = [];
  for (let index = 0; index < 20; index += 1) {
    const suffix = String(index).padStart(2, '0');
    const spineNodeId = `spine-${suffix}`;
    const leafNodeId = `leaf-${suffix}`;
    const leafEdgeId = `leaf-edge-${suffix}`;
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
      id: leafEdgeId,
      from: spineNodeId,
      to: leafNodeId,
      length: 1,
      width: 0.125,
      label: suffix,
      mirrorOf: null,
    });
    const incident: string[] = [];
    if (index > 0) incident.push(`spine-edge-${String(index - 1).padStart(2, '0')}`);
    incident.push(leafEdgeId);
    if (index < 19) incident.push(`spine-edge-${suffix}`);
    rotation.push(
      { nodeId: leafNodeId, edgeIds: [leafEdgeId] },
      { nodeId: spineNodeId, edgeIds: incident },
    );
    if (index < 19) {
      edges.push({
        id: `spine-edge-${suffix}`,
        from: spineNodeId,
        to: `spine-${String(index + 1).padStart(2, '0')}`,
        length: 1,
        width: 0.25,
        label: suffix,
        mirrorOf: null,
      });
    }
  }
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes,
    edges,
    rotation,
  };
}

export function packingWorkerMaximalSource(): JsonRecord {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: maximalCaterpillarTree(),
    paper: { width: 1, height: 1 },
    maxColumns: 8,
    maxRows: 8,
    relativeErrorLimit: 0,
  };
}
