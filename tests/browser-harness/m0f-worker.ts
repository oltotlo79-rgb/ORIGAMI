import { createBrowserFoldDocumentFaceReconstructionWorkerV1 } from '../../m0f/workers/browser-fold-document-face-reconstruction-worker.js';
import {
  runFoldDocumentFaceReconstructionWorkerV1,
  type RunFoldDocumentFaceReconstructionWorkerOptionsV1,
} from '../../m0f/workers/run-fold-document-face-reconstruction-worker.js';
import type { FaceReconstructionWorkerRunResultV1 } from '../../m0f/workers/run-face-reconstruction-worker.js';
import { createBrowserSquareGridQuantizationWorkerV1 } from '../../m0f/workers/browser-square-grid-quantization-worker.js';
import {
  runSquareGridQuantizationWorkerV1,
  type SquareGridQuantizationWorkerRunResultV1,
} from '../../m0f/workers/run-square-grid-quantization-worker.js';
import { SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/square-grid-candidates.js';
import { createBrowserPolygonRiverPackingProblemWorkerV1 } from '../../m0f/workers/browser-polygon-river-packing-problem-worker.js';
import {
  runPolygonRiverPackingProblemWorkerV1,
  type PolygonRiverPackingProblemWorkerRunResultV1,
} from '../../m0f/workers/run-polygon-river-packing-problem-worker.js';
import { BOX_PLEATING_PACKING_SEMANTICS_V1 } from '../../m0f/box-pleating/packing-semantics.js';
import {
  createBrowserEuclideanNecessaryWitnessSearchWorkerV1,
  createBrowserEuclideanNecessaryWitnessValidationWorkerV1,
} from '../../m0f/workers/browser-euclidean-necessary-witness-workers.js';
import {
  runEuclideanNecessaryWitnessSearchWorkerV1,
  type EuclideanNecessaryWitnessTwoStageWorkerRunResultV1,
} from '../../m0f/workers/run-euclidean-necessary-witness-search-worker.js';
import { createBrowserAffineOriginRotationSweptAabbCensusWorkerV1 } from '../../m0f/workers/affine-origin-rotation-swept-aabb-census-worker-browser.js';
import {
  runAffineOriginRotationSweptAabbCensusWorkerV1,
  type AffineOriginRotationSweptAabbCensusWorkerRunResultV1,
} from '../../m0f/workers/affine-origin-rotation-swept-aabb-census-worker-runner.js';
import { AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1 } from '../../m0f/geometry/affine-origin-rotation-swept-aabb.js';

function requiredElement(selector: string): Element {
  const element = document.querySelector(selector);
  if (element === null) throw new TypeError(`${selector} is missing`);
  return element;
}

const output = requiredElement('[data-testid="measurement"]') as HTMLElement;

const FOLD_DOCUMENT = Object.freeze({
  file_spec: 1.2,
  frame_classes: ['creasePattern'],
  frame_attributes: ['2D'],
  vertices_coords: [
    [0, 0],
    [1, 0],
    [3, 0],
    [3, 1],
    [3, 2],
    [1, 2],
    [0, 2],
  ],
  edges_vertices: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 0],
    [1, 5],
    [0, 3],
  ],
  edges_assignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M'],
});

type Measurement = Readonly<{
  mode: 'success' | 'cancel' | 'pre-abort';
  beforeByteLength: number;
  afterByteLength: number;
  elapsedMs: number;
  contractStatus: FaceReconstructionWorkerRunResultV1['contractStatus'];
  scientificClaim: FaceReconstructionWorkerRunResultV1['scientificClaim'];
  outcome: FaceReconstructionWorkerRunResultV1['outcome'];
  reason: string | null;
  boundedFaceCount: number | null;
  resultJson: string | null;
}>;

type GridMeasurement = Readonly<{
  mode: 'grid-success' | 'grid-cancel' | 'grid-pre-abort';
  elapsedMs: number;
  contractStatus: SquareGridQuantizationWorkerRunResultV1['contractStatus'];
  scientificClaim: SquareGridQuantizationWorkerRunResultV1['scientificClaim'];
  outcome: SquareGridQuantizationWorkerRunResultV1['outcome'];
  reason: string | null;
  candidateCount: number | null;
  resultJson: string | null;
}>;

type PackingMeasurement = Readonly<{
  mode: 'packing-success' | 'packing-cancel' | 'packing-pre-abort';
  elapsedMs: number;
  workerFactoryCallCount: number;
  contractStatus: PolygonRiverPackingProblemWorkerRunResultV1['contractStatus'];
  scientificClaim: PolygonRiverPackingProblemWorkerRunResultV1['scientificClaim'];
  outcome: PolygonRiverPackingProblemWorkerRunResultV1['outcome'];
  reason: PolygonRiverPackingProblemWorkerRunResultV1['reason'];
  resultContractStatus: 'candidate' | null;
  resultScientificClaim: false | null;
  candidateId: string | null;
  treeEdgeCount: number | null;
  riverDimensionInputCount: number | null;
  leafCount: number | null;
  leafVariableCount: number | null;
  leafPairCount: number | null;
  separationConstraintInputCount: number | null;
  interpretation: string | null;
  constraintEvaluable: false | null;
  solverIncluded: false | null;
  packingIncluded: false | null;
  polygonRiverPackingIncluded: false | null;
  feasibilityDecisionIncluded: false | null;
  globalM0fGo: false | null;
  resultJson: string | null;
}>;

type WitnessMeasurement = Readonly<{
  mode: 'witness-success' | 'witness-cancel' | 'witness-pre-abort';
  searchWorkerFactoryCallCount: number;
  validationWorkerFactoryCallCount: number;
  contractStatus: EuclideanNecessaryWitnessTwoStageWorkerRunResultV1['contractStatus'];
  scientificClaim: EuclideanNecessaryWitnessTwoStageWorkerRunResultV1['scientificClaim'];
  outcome: EuclideanNecessaryWitnessTwoStageWorkerRunResultV1['outcome'];
  reason: EuclideanNecessaryWitnessTwoStageWorkerRunResultV1['reason'];
  generalPolygonRiverPackingSolverIncluded: false;
  packingIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  resultContractStatus: 'candidate' | null;
  resultScientificClaim: false | null;
  searchStatus: string | null;
  searchComplete: boolean | null;
  witnessCount: number | null;
  filterOnlySearch: true | null;
  necessaryFilterWitnessSearchIncluded: true | null;
  geometryIncluded: false | null;
  placementIncluded: false | null;
  globalPackingIncluded: false | null;
  polygonRiverPackingIncluded: false | null;
  resultJson: string | null;
}>;

type SweptCensusMeasurement = Readonly<{
  mode: 'swept-census-success' | 'swept-census-cancel' | 'swept-census-pre-abort';
  elapsedMs: number;
  workerFactoryCallCount: number;
  contractStatus: AffineOriginRotationSweptAabbCensusWorkerRunResultV1['contractStatus'];
  scientificClaim: false;
  collisionFreeClaim: false;
  selfIntersectionClassificationIncluded: false;
  globalM0fGo: false;
  outcome: AffineOriginRotationSweptAabbCensusWorkerRunResultV1['outcome'];
  reason: AffineOriginRotationSweptAabbCensusWorkerRunResultV1['reason'];
  primitiveCount: number | null;
  unorderedPairCount: number | null;
  separatedPairCount: number | null;
  candidatePairCount: number | null;
  indeterminatePairCount: number | null;
  resultJson: string | null;
}>;

// Kept local so this browser entry never pulls server-only imports through CLI fixtures.
const PACKING_PROBLEM_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: 'm0f-polygon-river-packing-problem-input',
  contractStatus: 'candidate',
  scientificClaim: false,
  source: {
    schemaVersion: 1,
    recordType: 'm0f-ordered-tree-grid-quantization-input',
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: {
      schemaVersion: 1,
      recordType: 'm0f-ordered-tree-input',
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
          id: 'river',
          from: 'leaf-a',
          to: 'leaf-b',
          length: 1,
          width: 0,
          label: 'river',
          mirrorOf: null,
        },
      ],
      rotation: [
        { nodeId: 'leaf-a', edgeIds: ['river'] },
        { nodeId: 'leaf-b', edgeIds: ['river'] },
      ],
    },
    paper: { width: 1, height: 1 },
    maxColumns: 2,
    maxRows: 2,
    relativeErrorLimit: 0,
  },
  candidateId: 'square-grid:1x1:xy:1',
});

const WITNESS_SEARCH_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: 'm0f-euclidean-necessary-witness-search-input',
  contractStatus: 'candidate',
  scientificClaim: false,
  semantics: BOX_PLEATING_PACKING_SEMANTICS_V1,
  packingProblemInput: PACKING_PROBLEM_INPUT,
  maxVisitedStates: 100,
  maxWitnesses: 1,
});

const SWEPT_CENSUS_LOCAL_TRIANGLE = Object.freeze([
  Object.freeze({ x: 0n, y: 0n, z: 0n, w: 1n }),
  Object.freeze({ x: 1n, y: 0n, z: 0n, w: 1n }),
  Object.freeze({ x: 0n, y: 1n, z: 0n, w: 1n }),
]);

function sweptCensusPrimitive(id: string, x: bigint) {
  const origin = Object.freeze({ x, y: 0n, z: 0n, w: 1n });
  return Object.freeze({
    id,
    localVertices: SWEPT_CENSUS_LOCAL_TRIANGLE,
    q0: origin,
    q1: origin,
  });
}

const SWEPT_CENSUS_INPUT = Object.freeze({
  motionFamily: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
  slab: Object.freeze({
    t0: Object.freeze({ numerator: 0n, exponent: 0 }),
    t1: Object.freeze({ numerator: 1n, exponent: 0 }),
  }),
  primitives: Object.freeze([
    sweptCensusPrimitive('triangle:a', 0n),
    sweptCensusPrimitive('triangle:b', 10n),
    sweptCensusPrimitive('triangle:c', 11n),
  ]),
});

function encodeDocument(): ArrayBuffer {
  return new TextEncoder().encode(JSON.stringify(FOLD_DOCUMENT)).buffer;
}

function summarize(
  mode: Measurement['mode'],
  beforeByteLength: number,
  afterByteLength: number,
  elapsedMs: number,
  result: FaceReconstructionWorkerRunResultV1,
): Measurement {
  return {
    mode,
    beforeByteLength,
    afterByteLength,
    elapsedMs,
    contractStatus: result.contractStatus,
    scientificClaim: result.scientificClaim,
    outcome: result.outcome,
    reason: result.reason,
    boundedFaceCount:
      result.outcome === 'completed' ? result.result.topology.boundedFaceCount : null,
    resultJson: result.outcome === 'completed' ? JSON.stringify(result.result) : null,
  };
}

async function measure(mode: Measurement['mode']): Promise<Measurement> {
  const foldDocumentBytes = encodeDocument();
  const beforeByteLength = foldDocumentBytes.byteLength;
  const controller = new AbortController();
  if (mode === 'pre-abort') controller.abort();

  const options: RunFoldDocumentFaceReconstructionWorkerOptionsV1 = {
    jobId: `browser-measurement:${mode}`,
    foldDocumentBytes,
    workerFactory: createBrowserFoldDocumentFaceReconstructionWorkerV1,
    signal: controller.signal,
  };
  const started = performance.now();
  const pending = runFoldDocumentFaceReconstructionWorkerV1(options);
  const afterByteLength = foldDocumentBytes.byteLength;
  if (mode === 'cancel') controller.abort();
  const result = await pending;
  return summarize(mode, beforeByteLength, afterByteLength, performance.now() - started, result);
}

function installButton(testId: string, mode: Measurement['mode']): void {
  const button = requiredElement(`[data-testid="${testId}"]`) as HTMLButtonElement;
  button.addEventListener('click', () => {
    button.disabled = true;
    output.textContent = 'running';
    void measure(mode)
      .then((measurement) => {
        output.textContent = JSON.stringify(measurement);
      })
      .catch(() => {
        output.textContent = JSON.stringify({ mode, harnessFailure: true });
      })
      .finally(() => {
        button.disabled = false;
      });
  });
}

installButton('run-success', 'success');
installButton('run-cancel', 'cancel');
installButton('run-pre-abort', 'pre-abort');

function gridInput(stress: boolean): Record<string, unknown> {
  const branchCount = stress ? 64 : 2;
  return {
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: { width: 1.5, height: 1 },
    maxColumns: stress ? 512 : 12,
    maxRows: stress ? 512 : 12,
    relativeErrorLimit: 0.01,
    branches: Array.from({ length: branchCount }, (_, index) => ({
      id: `branch-${String(index).padStart(2, '0')}`,
      branchClass: index % 2 === 0 ? 'terminal' : 'internal',
      length: 0.75,
      width: index % 3 === 0 ? 0 : 0.25,
    })),
  };
}

async function measureGrid(mode: GridMeasurement['mode']): Promise<GridMeasurement> {
  const controller = new AbortController();
  if (mode === 'grid-pre-abort') controller.abort();
  const started = performance.now();
  const pending = runSquareGridQuantizationWorkerV1({
    jobId: `browser-measurement:${mode}`,
    input: gridInput(mode !== 'grid-success'),
    workerFactory: createBrowserSquareGridQuantizationWorkerV1,
    signal: controller.signal,
  });
  if (mode === 'grid-cancel') controller.abort();
  const result = await pending;
  return {
    mode,
    elapsedMs: performance.now() - started,
    contractStatus: result.contractStatus,
    scientificClaim: result.scientificClaim,
    outcome: result.outcome,
    reason: result.reason,
    candidateCount: result.outcome === 'completed' ? result.result.candidates.length : null,
    resultJson: result.outcome === 'completed' ? JSON.stringify(result.result) : null,
  };
}

function installGridButton(testId: string, mode: GridMeasurement['mode']): void {
  const button = requiredElement(`[data-testid="${testId}"]`) as HTMLButtonElement;
  button.addEventListener('click', () => {
    button.disabled = true;
    output.textContent = 'running';
    void measureGrid(mode)
      .then((measurement) => {
        output.textContent = JSON.stringify(measurement);
      })
      .catch(() => {
        output.textContent = JSON.stringify({ mode, harnessFailure: true });
      })
      .finally(() => {
        button.disabled = false;
      });
  });
}

installGridButton('run-grid-success', 'grid-success');
installGridButton('run-grid-cancel', 'grid-cancel');
installGridButton('run-grid-pre-abort', 'grid-pre-abort');

async function measurePacking(mode: PackingMeasurement['mode']): Promise<PackingMeasurement> {
  const controller = new AbortController();
  if (mode === 'packing-pre-abort') controller.abort();
  let workerFactoryCallCount = 0;
  const started = performance.now();
  const pending = runPolygonRiverPackingProblemWorkerV1({
    jobId: `browser-measurement:${mode}`,
    input: PACKING_PROBLEM_INPUT,
    workerFactory: () => {
      workerFactoryCallCount += 1;
      return createBrowserPolygonRiverPackingProblemWorkerV1();
    },
    signal: controller.signal,
  });
  if (mode === 'packing-cancel') controller.abort();
  const result = await pending;
  const completed = result.outcome === 'completed' ? result.result : null;
  return {
    mode,
    elapsedMs: performance.now() - started,
    workerFactoryCallCount,
    contractStatus: result.contractStatus,
    scientificClaim: result.scientificClaim,
    outcome: result.outcome,
    reason: result.reason,
    resultContractStatus: completed?.contractStatus ?? null,
    resultScientificClaim: completed?.scientificClaim ?? null,
    candidateId: completed?.candidateReference.candidateId ?? null,
    treeEdgeCount: completed?.sourceBinding.treeEdgeCount ?? null,
    riverDimensionInputCount: completed?.sourceBinding.riverDimensionInputCount ?? null,
    leafCount: completed?.sourceBinding.leafCount ?? null,
    leafVariableCount: completed?.sourceBinding.leafVariableCount ?? null,
    leafPairCount: completed?.sourceBinding.leafPairCount ?? null,
    separationConstraintInputCount: completed?.sourceBinding.separationConstraintInputCount ?? null,
    interpretation: completed?.interpretation ?? null,
    constraintEvaluable: completed?.constraintEvaluable ?? null,
    solverIncluded: completed?.solverIncluded ?? null,
    packingIncluded: completed?.packingIncluded ?? null,
    polygonRiverPackingIncluded: completed?.polygonRiverPackingIncluded ?? null,
    feasibilityDecisionIncluded: completed?.feasibilityDecisionIncluded ?? null,
    globalM0fGo: completed?.globalM0fGo ?? null,
    resultJson: completed === null ? null : JSON.stringify(completed),
  };
}

function installPackingButton(testId: string, mode: PackingMeasurement['mode']): void {
  const button = requiredElement(`[data-testid="${testId}"]`) as HTMLButtonElement;
  button.addEventListener('click', () => {
    button.disabled = true;
    output.textContent = 'running';
    void measurePacking(mode)
      .then((measurement) => {
        output.textContent = JSON.stringify(measurement);
      })
      .catch(() => {
        output.textContent = JSON.stringify({ mode, harnessFailure: true });
      })
      .finally(() => {
        button.disabled = false;
      });
  });
}

installPackingButton('run-packing-success', 'packing-success');
installPackingButton('run-packing-cancel', 'packing-cancel');
installPackingButton('run-packing-pre-abort', 'packing-pre-abort');

async function measureWitness(mode: WitnessMeasurement['mode']): Promise<WitnessMeasurement> {
  const controller = new AbortController();
  if (mode === 'witness-pre-abort') controller.abort();
  let searchWorkerFactoryCallCount = 0;
  let validationWorkerFactoryCallCount = 0;
  const pending = runEuclideanNecessaryWitnessSearchWorkerV1({
    jobId: `browser-measurement:${mode}`,
    input: WITNESS_SEARCH_INPUT,
    searchWorkerFactory: () => {
      searchWorkerFactoryCallCount += 1;
      return createBrowserEuclideanNecessaryWitnessSearchWorkerV1();
    },
    validationWorkerFactory: () => {
      validationWorkerFactoryCallCount += 1;
      return createBrowserEuclideanNecessaryWitnessValidationWorkerV1();
    },
    signal: controller.signal,
  });
  if (mode === 'witness-cancel') controller.abort();
  const result = await pending;
  const completed = result.outcome === 'completed' ? result.result : null;
  return {
    mode,
    searchWorkerFactoryCallCount,
    validationWorkerFactoryCallCount,
    contractStatus: result.contractStatus,
    scientificClaim: result.scientificClaim,
    outcome: result.outcome,
    reason: result.reason,
    generalPolygonRiverPackingSolverIncluded: result.generalPolygonRiverPackingSolverIncluded,
    packingIncluded: result.packingIncluded,
    feasibilityDecisionIncluded: result.feasibilityDecisionIncluded,
    globalM0fGo: result.globalM0fGo,
    resultContractStatus: completed?.contractStatus ?? null,
    resultScientificClaim: completed?.scientificClaim ?? null,
    searchStatus: completed?.searchStatus ?? null,
    searchComplete: completed?.searchComplete ?? null,
    witnessCount: completed?.witnessCount ?? null,
    filterOnlySearch: completed?.filterOnlySearch ?? null,
    necessaryFilterWitnessSearchIncluded: completed?.necessaryFilterWitnessSearchIncluded ?? null,
    geometryIncluded: completed?.geometryIncluded ?? null,
    placementIncluded: completed?.placementIncluded ?? null,
    globalPackingIncluded: completed?.globalPackingIncluded ?? null,
    polygonRiverPackingIncluded: completed?.polygonRiverPackingIncluded ?? null,
    resultJson: completed === null ? null : JSON.stringify(completed),
  };
}

function installWitnessButton(testId: string, mode: WitnessMeasurement['mode']): void {
  const button = requiredElement(`[data-testid="${testId}"]`) as HTMLButtonElement;
  button.addEventListener('click', () => {
    button.disabled = true;
    output.textContent = 'running';
    void measureWitness(mode)
      .then((measurement) => {
        output.textContent = JSON.stringify(measurement);
      })
      .catch(() => {
        output.textContent = JSON.stringify({ mode, harnessFailure: true });
      })
      .finally(() => {
        button.disabled = false;
      });
  });
}

installWitnessButton('run-witness-success', 'witness-success');
installWitnessButton('run-witness-cancel', 'witness-cancel');
installWitnessButton('run-witness-pre-abort', 'witness-pre-abort');

function stringifyBigInt(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    typeof item === 'bigint' ? item.toString(10) : item,
  );
}

async function measureSweptCensus(
  mode: SweptCensusMeasurement['mode'],
): Promise<SweptCensusMeasurement> {
  const controller = new AbortController();
  if (mode === 'swept-census-pre-abort') controller.abort();
  let workerFactoryCallCount = 0;
  const started = performance.now();
  const pending = runAffineOriginRotationSweptAabbCensusWorkerV1({
    sourceId: 'browser-harness:swept-census-source',
    jobId: `browser-measurement:${mode}`,
    input: SWEPT_CENSUS_INPUT,
    workerFactory: () => {
      workerFactoryCallCount += 1;
      return createBrowserAffineOriginRotationSweptAabbCensusWorkerV1();
    },
    signal: controller.signal,
  });
  if (mode === 'swept-census-cancel') controller.abort();
  const result = await pending;
  const completed = result.outcome === 'completed' ? result.result : null;
  return {
    mode,
    elapsedMs: performance.now() - started,
    workerFactoryCallCount,
    contractStatus: result.contractStatus,
    scientificClaim: result.scientificClaim,
    collisionFreeClaim: result.collisionFreeClaim,
    selfIntersectionClassificationIncluded: result.selfIntersectionClassificationIncluded,
    globalM0fGo: result.globalM0fGo,
    outcome: result.outcome,
    reason: result.reason,
    primitiveCount: completed?.primitiveCount ?? null,
    unorderedPairCount: completed?.unorderedPairCount ?? null,
    separatedPairCount: completed?.separatedPairCount ?? null,
    candidatePairCount: completed?.candidatePairCount ?? null,
    indeterminatePairCount: completed?.indeterminatePairCount ?? null,
    resultJson: completed === null ? null : stringifyBigInt(completed),
  };
}

function installSweptCensusButton(testId: string, mode: SweptCensusMeasurement['mode']): void {
  const button = requiredElement(`[data-testid="${testId}"]`) as HTMLButtonElement;
  button.addEventListener('click', () => {
    button.disabled = true;
    output.textContent = 'running';
    void measureSweptCensus(mode)
      .then((measurement) => {
        output.textContent = JSON.stringify(measurement);
      })
      .catch(() => {
        output.textContent = JSON.stringify({ mode, harnessFailure: true });
      })
      .finally(() => {
        button.disabled = false;
      });
  });
}

installSweptCensusButton('run-swept-census-success', 'swept-census-success');
installSweptCensusButton('run-swept-census-cancel', 'swept-census-cancel');
installSweptCensusButton('run-swept-census-pre-abort', 'swept-census-pre-abort');
