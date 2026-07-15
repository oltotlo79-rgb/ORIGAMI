import { createHash } from 'node:crypto';

import { cloneAndDeepFreeze, deepFreezeOwned } from './clone-and-freeze.js';
import { serializeJsonLine, stableStringify, type JsonValue } from './stable-json.js';

export const BROWSER_WORKER_MEASUREMENT_RECORD_TYPE =
  'm0f-browser-worker-raw-measurement-candidate' as const;
export const BROWSER_WORKER_MEASUREMENT_MANIFEST_RECORD_TYPE =
  'm0f-browser-worker-measurement-artifact-manifest-candidate' as const;
export const BROWSER_WORKER_SUCCESS_REPETITIONS = 5 as const;

export const BROWSER_WORKER_PROJECTS = ['chromium', 'edge', 'firefox'] as const;
export const BROWSER_WORKER_FLOWS = [
  'fold-document-face-reconstruction',
  'square-grid-quantization',
  'polygon-river-packing-problem',
  'euclidean-necessary-witness-two-stage',
  'affine-origin-rotation-swept-aabb-census',
] as const;
export const BROWSER_WORKER_SCENARIOS = [
  'success-repeatability',
  'in-progress-cancellation',
  'pre-abort',
] as const;

export type BrowserWorkerProjectV1 = (typeof BROWSER_WORKER_PROJECTS)[number];
export type BrowserWorkerFlowV1 = (typeof BROWSER_WORKER_FLOWS)[number];
export type BrowserWorkerScenarioV1 = (typeof BROWSER_WORKER_SCENARIOS)[number];

export type BrowserWorkerRawMeasurementCandidateV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BROWSER_WORKER_MEASUREMENT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  finalPerformanceEvidence: false;
  runtimeLimitEvidence: false;
  globalM0fGo: false;
  harnessVersion: 'm0f-browser-worker-measurement-harness-v1';
  runGroupId: string;
  runId: string;
  project: BrowserWorkerProjectV1;
  workerFlow: BrowserWorkerFlowV1;
  scenario: BrowserWorkerScenarioV1;
  repetition: number;
  startedAt: string;
  durationMs: number;
  seed: null;
  inputBinding: Readonly<{
    identity: string;
    hashBasis: 'sha256-of-utf8-harness-input-json-candidate-encoding-not-semantic-hash';
    json: string;
    sha256: string;
  }>;
  outcome: 'completed' | 'cancelled';
  resultBinding: Readonly<{
    hashBasis: 'sha256-of-utf8-result-json-not-certificate-or-semantic-hash';
    sha256: string | null;
  }>;
  measurement: Readonly<Record<string, JsonValue>>;
}>;

export type BrowserWorkerMeasurementEnvironmentV1 = Readonly<{
  project: BrowserWorkerProjectV1;
  os: string;
  osRelease: string;
  arch: string;
  cpu: string;
  logicalCores: number;
  memoryBytes: number;
  nodeVersion: string;
  browserEngine: string;
  browserVersion: string;
  userAgent: string;
  navigatorPlatform: string;
  hardwareConcurrency: number;
  deviceMemoryGiB: number | null;
  screen: Readonly<{
    width: number;
    height: number;
    colorDepth: number;
    devicePixelRatio: number;
  }>;
  webGlVendor: string | null;
  webGlRenderer: string | null;
}>;

export type BrowserWorkerMeasurementBuildIdentityV1 = Readonly<{
  sourceRevision: string;
  sourceTreeState: 'clean' | 'dirty' | 'unknown';
  ciRunId: string | null;
  harnessVersion: 'm0f-browser-worker-measurement-harness-v1';
  harnessSourceHashBasis: 'sha256-of-path-nul-raw-bytes-nul-in-declared-order';
  harnessSourceSha256: string;
  harnessSourcePaths: readonly string[];
}>;

export type BrowserWorkerRepeatabilitySummaryV1 = Readonly<{
  workerFlow: BrowserWorkerFlowV1;
  requiredRepetitions: typeof BROWSER_WORKER_SUCCESS_REPETITIONS;
  observedRepetitions: number;
  observedRepetitionIndexes: readonly number[];
  distinctOutcomes: readonly string[];
  distinctResultJsonSha256s: readonly (string | null)[];
  outcomeStable: boolean;
  resultHashStable: boolean;
  candidateFiveRunCheckPassed: boolean;
}>;

type BrowserWorkerMeasurementManifestPayloadV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BROWSER_WORKER_MEASUREMENT_MANIFEST_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  artifactKind: 'raw-browser-worker-smoke-diagnostic-not-final-evidence';
  createdAt: string;
  build: BrowserWorkerMeasurementBuildIdentityV1;
  environment: BrowserWorkerMeasurementEnvironmentV1;
  canonicalRecordOrdering: 'worker-flow-then-scenario-then-repetition-then-start-time';
  rawJsonl: Readonly<{
    path: 'measurements.raw.jsonl';
    byteLength: number;
    sha256: string;
    recordCount: number;
  }>;
  successRepetitionTarget: typeof BROWSER_WORKER_SUCCESS_REPETITIONS;
  repeatability: readonly BrowserWorkerRepeatabilitySummaryV1[];
  allSuccessFlowsHaveFiveRepeatableResults: boolean;
  cleanSourceRevisionBound: boolean;
  limitations: Readonly<{
    referenceWindowsHardwareQualified: false;
    runtimeLimitsFrozen: false;
    performanceThresholdDecisionIncluded: false;
    percentileSummaryIncluded: false;
    memoryMeasurementIncluded: false;
    environmentMetadataComplete: false;
    buildArtifactHashIncluded: false;
    supportProfileIncluded: false;
    toleranceProfileIncluded: false;
    scientificEvidenceIncluded: false;
    finalPerformanceEvidence: false;
    globalM0fGo: false;
  }>;
}>;

export type BrowserWorkerMeasurementManifestV1 = BrowserWorkerMeasurementManifestPayloadV1 &
  Readonly<{
    manifestPayloadSha256: string;
  }>;

export type BrowserWorkerMeasurementArtifactV1 = Readonly<{
  rawJsonl: string;
  manifest: BrowserWorkerMeasurementManifestV1;
  manifestJson: string;
}>;

export type BrowserWorkerMeasurementArtifactIssueV1 = Readonly<{
  code: string;
  message: string;
}>;

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MANIFEST_HASH_DOMAIN = 'oridesign:m0f-browser-worker-measurement-manifest:v1\0';
const HARNESS_VERSION = 'm0f-browser-worker-measurement-harness-v1' as const;
const INPUT_HASH_BASIS =
  'sha256-of-utf8-harness-input-json-candidate-encoding-not-semantic-hash' as const;
const RESULT_HASH_BASIS = 'sha256-of-utf8-result-json-not-certificate-or-semantic-hash' as const;

const EXPECTED_MODES: Readonly<
  Record<BrowserWorkerFlowV1, Readonly<Record<BrowserWorkerScenarioV1, string>>>
> = {
  'fold-document-face-reconstruction': {
    'success-repeatability': 'success',
    'in-progress-cancellation': 'cancel',
    'pre-abort': 'pre-abort',
  },
  'square-grid-quantization': {
    'success-repeatability': 'grid-success',
    'in-progress-cancellation': 'grid-cancel',
    'pre-abort': 'grid-pre-abort',
  },
  'polygon-river-packing-problem': {
    'success-repeatability': 'packing-success',
    'in-progress-cancellation': 'packing-cancel',
    'pre-abort': 'packing-pre-abort',
  },
  'euclidean-necessary-witness-two-stage': {
    'success-repeatability': 'witness-success',
    'in-progress-cancellation': 'witness-cancel',
    'pre-abort': 'witness-pre-abort',
  },
  'affine-origin-rotation-swept-aabb-census': {
    'success-repeatability': 'swept-census-success',
    'in-progress-cancellation': 'swept-census-cancel',
    'pre-abort': 'swept-census-pre-abort',
  },
};

const COMMON_MEASUREMENT_KEYS = [
  'mode',
  'inputJson',
  'elapsedMs',
  'contractStatus',
  'scientificClaim',
  'outcome',
  'reason',
  'resultJson',
] as const;
const FLOW_MEASUREMENT_KEYS: Readonly<Record<BrowserWorkerFlowV1, readonly string[]>> = {
  'fold-document-face-reconstruction': [
    ...COMMON_MEASUREMENT_KEYS,
    'beforeByteLength',
    'afterByteLength',
    'boundedFaceCount',
  ],
  'square-grid-quantization': [...COMMON_MEASUREMENT_KEYS, 'candidateCount'],
  'polygon-river-packing-problem': [
    ...COMMON_MEASUREMENT_KEYS,
    'workerFactoryCallCount',
    'resultContractStatus',
    'resultScientificClaim',
    'candidateId',
    'treeEdgeCount',
    'riverDimensionInputCount',
    'leafCount',
    'leafVariableCount',
    'leafPairCount',
    'separationConstraintInputCount',
    'interpretation',
    'constraintEvaluable',
    'solverIncluded',
    'packingIncluded',
    'polygonRiverPackingIncluded',
    'feasibilityDecisionIncluded',
    'globalM0fGo',
  ],
  'euclidean-necessary-witness-two-stage': [
    ...COMMON_MEASUREMENT_KEYS,
    'searchWorkerFactoryCallCount',
    'validationWorkerFactoryCallCount',
    'generalPolygonRiverPackingSolverIncluded',
    'packingIncluded',
    'feasibilityDecisionIncluded',
    'globalM0fGo',
    'resultContractStatus',
    'resultScientificClaim',
    'searchStatus',
    'searchComplete',
    'witnessCount',
    'filterOnlySearch',
    'necessaryFilterWitnessSearchIncluded',
    'geometryIncluded',
    'placementIncluded',
    'globalPackingIncluded',
    'polygonRiverPackingIncluded',
  ],
  'affine-origin-rotation-swept-aabb-census': [
    ...COMMON_MEASUREMENT_KEYS,
    'workerFactoryCallCount',
    'collisionFreeClaim',
    'selfIntersectionClassificationIncluded',
    'globalM0fGo',
    'primitiveCount',
    'unorderedPairCount',
    'separatedPairCount',
    'candidatePairCount',
    'indeterminatePairCount',
  ],
};
const RAW_RECORD_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'finalPerformanceEvidence',
  'runtimeLimitEvidence',
  'globalM0fGo',
  'harnessVersion',
  'runGroupId',
  'runId',
  'project',
  'workerFlow',
  'scenario',
  'repetition',
  'startedAt',
  'durationMs',
  'seed',
  'inputBinding',
  'outcome',
  'resultBinding',
  'measurement',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProject(value: unknown): value is BrowserWorkerProjectV1 {
  return (
    typeof value === 'string' && (BROWSER_WORKER_PROJECTS as readonly string[]).includes(value)
  );
}

function isWorkerFlow(value: unknown): value is BrowserWorkerFlowV1 {
  return typeof value === 'string' && (BROWSER_WORKER_FLOWS as readonly string[]).includes(value);
}

function isScenario(value: unknown): value is BrowserWorkerScenarioV1 {
  return (
    typeof value === 'string' && (BROWSER_WORKER_SCENARIOS as readonly string[]).includes(value)
  );
}

function assertUtcTimestamp(value: string, label: string): void {
  if (
    !UTC_TIMESTAMP_PATTERN.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    throw new TypeError(`${label} must be a real millisecond-resolution UTC timestamp`);
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim() === '') throw new TypeError(`${label} must be non-empty`);
}

function hasExactKeys(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function assertExactMeasurementKeys(
  measurement: Readonly<Record<string, unknown>>,
  workerFlow: BrowserWorkerFlowV1,
): void {
  if (!hasExactKeys(measurement, FLOW_MEASUREMENT_KEYS[workerFlow])) {
    throw new TypeError(`measurement keys do not match the closed ${workerFlow} contract`);
  }
}

function assertCandidateClaims(value: unknown, path = '$'): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertCandidateClaims(entry, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (
      ((key === 'scientificClaim' || key === 'collisionFreeClaim') && child !== false) ||
      (key === 'globalM0fGo' && child !== false && child !== null)
    ) {
      throw new TypeError(`${childPath} must remain false in candidate artifacts`);
    }
    if (key === 'contractStatus' && child !== 'candidate' && child !== 'candidate-no-claim') {
      throw new TypeError(`${childPath} must remain candidate-only`);
    }
    assertCandidateClaims(child, childPath);
  }
}

export function sha256BrowserWorkerMeasurementUtf8(value: string): string {
  return `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

export function createBrowserWorkerRawMeasurementCandidateV1(
  input: Readonly<{
    runGroupId: string;
    project: BrowserWorkerProjectV1;
    workerFlow: BrowserWorkerFlowV1;
    scenario: BrowserWorkerScenarioV1;
    repetition: number;
    startedAt: string;
    outcome: 'completed' | 'cancelled';
    inputJson: string;
    resultJson: string | null;
    measurement: Readonly<Record<string, JsonValue>>;
  }>,
): BrowserWorkerRawMeasurementCandidateV1 {
  if (!BROWSER_WORKER_PROJECTS.includes(input.project)) throw new TypeError('unknown project');
  if (!BROWSER_WORKER_FLOWS.includes(input.workerFlow)) throw new TypeError('unknown worker flow');
  if (!BROWSER_WORKER_SCENARIOS.includes(input.scenario)) throw new TypeError('unknown scenario');
  if (!Number.isSafeInteger(input.repetition) || input.repetition < 0) {
    throw new TypeError('repetition must be a non-negative safe integer');
  }
  assertUtcTimestamp(input.startedAt, 'startedAt');
  assertNonEmpty(input.runGroupId, 'runGroupId');
  stableStringify(input.measurement);
  const measurement = cloneAndDeepFreeze(input.measurement);
  assertExactMeasurementKeys(measurement, input.workerFlow);
  const expectedOutcome = input.scenario === 'success-repeatability' ? 'completed' : 'cancelled';
  if (input.outcome !== expectedOutcome || measurement.outcome !== expectedOutcome) {
    throw new TypeError(`${input.scenario} must have outcome ${expectedOutcome}`);
  }
  if (measurement.mode !== EXPECTED_MODES[input.workerFlow][input.scenario]) {
    throw new TypeError('measurement mode does not match worker flow and scenario');
  }
  if (measurement.scientificClaim !== false) {
    throw new TypeError('measurement.scientificClaim must remain false');
  }
  const expectedContractStatus =
    input.workerFlow === 'affine-origin-rotation-swept-aabb-census'
      ? 'candidate-no-claim'
      : 'candidate';
  if (measurement.contractStatus !== expectedContractStatus) {
    throw new TypeError(`measurement.contractStatus must equal ${expectedContractStatus}`);
  }
  if (measurement.reason !== (expectedOutcome === 'completed' ? null : 'aborted-by-caller')) {
    throw new TypeError('measurement reason does not match the scenario outcome');
  }
  if (
    typeof measurement.elapsedMs !== 'number' ||
    !Number.isFinite(measurement.elapsedMs) ||
    measurement.elapsedMs < 0
  ) {
    throw new TypeError('measurement.elapsedMs must be a non-negative finite number');
  }
  if (measurement.inputJson !== input.inputJson) {
    throw new TypeError('measurement.inputJson must match the input hash source');
  }
  if (measurement.resultJson !== input.resultJson) {
    throw new TypeError('measurement.resultJson must match the hash source');
  }
  if ((expectedOutcome === 'completed') !== (input.resultJson !== null)) {
    throw new TypeError('only completed measurements may contain result JSON');
  }
  try {
    assertCandidateClaims(JSON.parse(input.inputJson) as unknown, '$.inputJson');
    if (input.resultJson !== null) {
      assertCandidateClaims(JSON.parse(input.resultJson) as unknown, '$.resultJson');
    }
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new TypeError('input and result JSON must be valid JSON');
    throw error;
  }
  assertCandidateClaims(measurement, '$.measurement');
  const runId = `${input.runGroupId}:${input.workerFlow}:${input.scenario}:${input.repetition}`;
  const record: BrowserWorkerRawMeasurementCandidateV1 = {
    schemaVersion: 1,
    recordType: BROWSER_WORKER_MEASUREMENT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    finalPerformanceEvidence: false,
    runtimeLimitEvidence: false,
    globalM0fGo: false,
    harnessVersion: HARNESS_VERSION,
    runGroupId: input.runGroupId,
    runId,
    project: input.project,
    workerFlow: input.workerFlow,
    scenario: input.scenario,
    repetition: input.repetition,
    startedAt: input.startedAt,
    durationMs: measurement.elapsedMs,
    seed: null,
    inputBinding: {
      identity: `tests/browser-harness/m0f-worker.ts#${input.workerFlow}:${input.scenario}:v1`,
      hashBasis: INPUT_HASH_BASIS,
      json: input.inputJson,
      sha256: sha256BrowserWorkerMeasurementUtf8(input.inputJson),
    },
    outcome: input.outcome,
    resultBinding: {
      hashBasis: RESULT_HASH_BASIS,
      sha256:
        input.resultJson === null ? null : sha256BrowserWorkerMeasurementUtf8(input.resultJson),
    },
    measurement,
  };
  return deepFreezeOwned(record);
}

function compareRecords(
  left: BrowserWorkerRawMeasurementCandidateV1,
  right: BrowserWorkerRawMeasurementCandidateV1,
): number {
  const flowOrder =
    BROWSER_WORKER_FLOWS.indexOf(left.workerFlow) - BROWSER_WORKER_FLOWS.indexOf(right.workerFlow);
  if (flowOrder !== 0) return flowOrder;
  const scenarioOrder =
    BROWSER_WORKER_SCENARIOS.indexOf(left.scenario) -
    BROWSER_WORKER_SCENARIOS.indexOf(right.scenario);
  if (scenarioOrder !== 0) return scenarioOrder;
  if (left.repetition !== right.repetition) return left.repetition - right.repetition;
  return left.startedAt.localeCompare(right.startedAt);
}

function uniqueSorted<T extends string | null>(values: readonly T[]): readonly T[] {
  return [...new Set(values)].sort((left, right) => {
    if (left === right) return 0;
    if (left === null) return -1;
    if (right === null) return 1;
    return left.localeCompare(right);
  });
}

function summarizeRepeatability(
  records: readonly BrowserWorkerRawMeasurementCandidateV1[],
): readonly BrowserWorkerRepeatabilitySummaryV1[] {
  return BROWSER_WORKER_FLOWS.map((workerFlow) => {
    const successes = records
      .filter(
        (record) => record.workerFlow === workerFlow && record.scenario === 'success-repeatability',
      )
      .sort((left, right) => left.repetition - right.repetition);
    const repetitions = successes.map(({ repetition }) => repetition);
    const outcomes = uniqueSorted(successes.map(({ outcome }) => outcome));
    const hashes = uniqueSorted(successes.map(({ resultBinding }) => resultBinding.sha256));
    const expectedRepetitions = Array.from(
      { length: BROWSER_WORKER_SUCCESS_REPETITIONS },
      (_, index) => index,
    );
    const exactRepetitions =
      repetitions.length === expectedRepetitions.length &&
      repetitions.every((value, index) => value === expectedRepetitions[index]);
    const outcomeStable =
      successes.length > 0 && outcomes.length === 1 && outcomes[0] === 'completed';
    const resultHashStable = successes.length > 0 && hashes.length === 1 && hashes[0] !== null;
    return deepFreezeOwned({
      workerFlow,
      requiredRepetitions: BROWSER_WORKER_SUCCESS_REPETITIONS,
      observedRepetitions: successes.length,
      observedRepetitionIndexes: repetitions,
      distinctOutcomes: outcomes,
      distinctResultJsonSha256s: hashes,
      outcomeStable,
      resultHashStable,
      candidateFiveRunCheckPassed: exactRepetitions && outcomeStable && resultHashStable,
    });
  });
}

function manifestPayloadHash(payload: BrowserWorkerMeasurementManifestPayloadV1): string {
  return sha256BrowserWorkerMeasurementUtf8(`${MANIFEST_HASH_DOMAIN}${stableStringify(payload)}`);
}

export function createBrowserWorkerMeasurementArtifactV1(
  input: Readonly<{
    records: readonly BrowserWorkerRawMeasurementCandidateV1[];
    createdAt: string;
    build: BrowserWorkerMeasurementBuildIdentityV1;
    environment: BrowserWorkerMeasurementEnvironmentV1;
  }>,
): BrowserWorkerMeasurementArtifactV1 {
  assertUtcTimestamp(input.createdAt, 'createdAt');
  assertNonEmpty(input.build.sourceRevision, 'build.sourceRevision');
  if (
    !SHA256_PATTERN.test(input.build.harnessSourceSha256) ||
    input.build.harnessSourcePaths.length === 0 ||
    input.build.harnessSourcePaths.some((path) => path.trim() === '')
  ) {
    throw new TypeError('build must bind the declared harness sources');
  }
  if (!BROWSER_WORKER_PROJECTS.includes(input.environment.project)) {
    throw new TypeError('environment project is unknown');
  }
  for (const [label, value] of [
    ['environment.os', input.environment.os],
    ['environment.osRelease', input.environment.osRelease],
    ['environment.arch', input.environment.arch],
    ['environment.cpu', input.environment.cpu],
    ['environment.nodeVersion', input.environment.nodeVersion],
    ['environment.browserEngine', input.environment.browserEngine],
    ['environment.browserVersion', input.environment.browserVersion],
    ['environment.userAgent', input.environment.userAgent],
    ['environment.navigatorPlatform', input.environment.navigatorPlatform],
  ] as const) {
    assertNonEmpty(value, label);
  }
  for (const [label, value] of [
    ['environment.logicalCores', input.environment.logicalCores],
    ['environment.memoryBytes', input.environment.memoryBytes],
    ['environment.hardwareConcurrency', input.environment.hardwareConcurrency],
    ['environment.screen.width', input.environment.screen.width],
    ['environment.screen.height', input.environment.screen.height],
    ['environment.screen.colorDepth', input.environment.screen.colorDepth],
    ['environment.screen.devicePixelRatio', input.environment.screen.devicePixelRatio],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) throw new TypeError(`${label} must be non-negative`);
  }
  stableStringify(input.build);
  stableStringify(input.environment);
  const records = [...input.records].sort(compareRecords);
  if (records.some(({ project }) => project !== input.environment.project)) {
    throw new TypeError('all records must match the manifest environment project');
  }
  const recordKeys = records.map(
    ({ workerFlow, scenario, repetition }) => `${workerFlow}\0${scenario}\0${repetition}`,
  );
  if (new Set(recordKeys).size !== recordKeys.length) {
    throw new TypeError('worker flow, scenario, and repetition must be unique');
  }
  const rawJsonl = records.map((record) => serializeJsonLine(record)).join('');
  const repeatability = summarizeRepeatability(records);
  const payload: BrowserWorkerMeasurementManifestPayloadV1 = deepFreezeOwned({
    schemaVersion: 1,
    recordType: BROWSER_WORKER_MEASUREMENT_MANIFEST_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    artifactKind: 'raw-browser-worker-smoke-diagnostic-not-final-evidence',
    createdAt: input.createdAt,
    build: cloneAndDeepFreeze(input.build),
    environment: cloneAndDeepFreeze(input.environment),
    canonicalRecordOrdering: 'worker-flow-then-scenario-then-repetition-then-start-time',
    rawJsonl: {
      path: 'measurements.raw.jsonl',
      byteLength: Buffer.byteLength(rawJsonl, 'utf8'),
      sha256: sha256BrowserWorkerMeasurementUtf8(rawJsonl),
      recordCount: records.length,
    },
    successRepetitionTarget: BROWSER_WORKER_SUCCESS_REPETITIONS,
    repeatability,
    allSuccessFlowsHaveFiveRepeatableResults: repeatability.every(
      ({ candidateFiveRunCheckPassed }) => candidateFiveRunCheckPassed,
    ),
    cleanSourceRevisionBound:
      input.build.sourceTreeState === 'clean' && /^[0-9a-f]{40}$/.test(input.build.sourceRevision),
    limitations: {
      referenceWindowsHardwareQualified: false,
      runtimeLimitsFrozen: false,
      performanceThresholdDecisionIncluded: false,
      percentileSummaryIncluded: false,
      memoryMeasurementIncluded: false,
      environmentMetadataComplete: false,
      buildArtifactHashIncluded: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      scientificEvidenceIncluded: false,
      finalPerformanceEvidence: false,
      globalM0fGo: false,
    },
  });
  const manifest: BrowserWorkerMeasurementManifestV1 = deepFreezeOwned({
    ...payload,
    manifestPayloadSha256: manifestPayloadHash(payload),
  });
  return deepFreezeOwned({
    rawJsonl,
    manifest,
    manifestJson: serializeJsonLine(manifest),
  });
}

export function verifyBrowserWorkerMeasurementArtifactV1(
  rawJsonl: string,
  manifest: BrowserWorkerMeasurementManifestV1,
): readonly BrowserWorkerMeasurementArtifactIssueV1[] {
  const issues: BrowserWorkerMeasurementArtifactIssueV1[] = [];
  if (manifest.rawJsonl.byteLength !== Buffer.byteLength(rawJsonl, 'utf8')) {
    issues.push({ code: 'raw-byte-length-mismatch', message: 'raw JSONL byte length changed' });
  }
  if (manifest.rawJsonl.sha256 !== sha256BrowserWorkerMeasurementUtf8(rawJsonl)) {
    issues.push({ code: 'raw-sha256-mismatch', message: 'raw JSONL hash changed' });
  }
  if (!SHA256_PATTERN.test(manifest.manifestPayloadSha256)) {
    issues.push({ code: 'invalid-manifest-sha256', message: 'manifest hash format is invalid' });
  }
  const { manifestPayloadSha256, ...payload } = manifest;
  if (
    manifestPayloadSha256 !==
    manifestPayloadHash(payload as BrowserWorkerMeasurementManifestPayloadV1)
  ) {
    issues.push({ code: 'manifest-sha256-mismatch', message: 'manifest payload changed' });
  }

  const lines = rawJsonl.endsWith('\n') ? rawJsonl.slice(0, -1).split('\n') : rawJsonl.split('\n');
  const nonEmptyLines = lines.filter((line) => line !== '');
  if (nonEmptyLines.length !== manifest.rawJsonl.recordCount) {
    issues.push({ code: 'record-count-mismatch', message: 'raw JSONL record count changed' });
  }
  const parsedRecords: BrowserWorkerRawMeasurementCandidateV1[] = [];
  for (const line of nonEmptyLines) {
    try {
      const parsed = JSON.parse(line) as unknown;
      if (!isRecord(parsed) || serializeJsonLine(parsed) !== `${line}\n`) {
        issues.push({ code: 'noncanonical-record', message: 'raw record is not canonical JSONL' });
        continue;
      }
      if (
        !hasExactKeys(parsed, RAW_RECORD_KEYS) ||
        parsed.schemaVersion !== 1 ||
        parsed.recordType !== BROWSER_WORKER_MEASUREMENT_RECORD_TYPE ||
        parsed.contractStatus !== 'candidate' ||
        parsed.scientificClaim !== false ||
        parsed.finalPerformanceEvidence !== false ||
        parsed.runtimeLimitEvidence !== false ||
        parsed.globalM0fGo !== false ||
        parsed.harnessVersion !== HARNESS_VERSION ||
        typeof parsed.runGroupId !== 'string' ||
        typeof parsed.runId !== 'string' ||
        !isProject(parsed.project) ||
        !isWorkerFlow(parsed.workerFlow) ||
        !isScenario(parsed.scenario) ||
        !Number.isSafeInteger(parsed.repetition) ||
        typeof parsed.startedAt !== 'string' ||
        typeof parsed.durationMs !== 'number' ||
        parsed.seed !== null ||
        (parsed.outcome !== 'completed' && parsed.outcome !== 'cancelled') ||
        !isRecord(parsed.inputBinding) ||
        !isRecord(parsed.resultBinding) ||
        !isRecord(parsed.measurement)
      ) {
        issues.push({
          code: 'invalid-candidate-record',
          message: 'raw record claim boundary changed',
        });
        continue;
      }
      const inputJson = parsed.inputBinding.json;
      const resultJson = parsed.measurement.resultJson;
      if (
        typeof inputJson !== 'string' ||
        (resultJson !== null && typeof resultJson !== 'string')
      ) {
        issues.push({ code: 'invalid-result-json', message: 'input/result JSON types changed' });
        continue;
      }
      const expectedInputHash = sha256BrowserWorkerMeasurementUtf8(inputJson);
      const expectedResultHash =
        resultJson === null ? null : sha256BrowserWorkerMeasurementUtf8(resultJson);
      if (
        parsed.inputBinding.hashBasis !== INPUT_HASH_BASIS ||
        parsed.inputBinding.sha256 !== expectedInputHash
      ) {
        issues.push({ code: 'input-sha256-mismatch', message: 'input JSON hash changed' });
        continue;
      }
      if (
        parsed.resultBinding.hashBasis !== RESULT_HASH_BASIS ||
        parsed.resultBinding.sha256 !== expectedResultHash
      ) {
        issues.push({ code: 'result-sha256-mismatch', message: 'result JSON hash changed' });
        continue;
      }
      const rebuilt = createBrowserWorkerRawMeasurementCandidateV1({
        runGroupId: parsed.runGroupId,
        project: parsed.project,
        workerFlow: parsed.workerFlow,
        scenario: parsed.scenario,
        repetition: parsed.repetition as number,
        startedAt: parsed.startedAt,
        outcome: parsed.outcome,
        inputJson,
        resultJson,
        measurement: parsed.measurement as Readonly<Record<string, JsonValue>>,
      });
      if (stableStringify(rebuilt) !== stableStringify(parsed)) {
        issues.push({ code: 'derived-record-mismatch', message: 'derived record fields changed' });
        continue;
      }
      parsedRecords.push(rebuilt);
    } catch {
      issues.push({
        code: 'invalid-jsonl',
        message: 'raw measurement line failed closed validation',
      });
    }
  }
  const recordKeys = parsedRecords.map(
    ({ workerFlow, scenario, repetition }) => `${workerFlow}\0${scenario}\0${repetition}`,
  );
  if (new Set(recordKeys).size !== recordKeys.length) {
    issues.push({ code: 'duplicate-record', message: 'raw JSONL contains duplicate run slots' });
  }
  const canonicalRaw = [...parsedRecords]
    .sort(compareRecords)
    .map((record) => serializeJsonLine(record))
    .join('');
  if (parsedRecords.length === nonEmptyLines.length && canonicalRaw !== rawJsonl) {
    issues.push({ code: 'record-order-mismatch', message: 'raw JSONL ordering changed' });
  }
  if (parsedRecords.some(({ project }) => project !== manifest.environment.project)) {
    issues.push({ code: 'project-mismatch', message: 'record project differs from environment' });
  }
  if (
    stableStringify(summarizeRepeatability(parsedRecords)) !==
    stableStringify(manifest.repeatability)
  ) {
    issues.push({
      code: 'repeatability-summary-mismatch',
      message: 'repeatability summary changed',
    });
  }
  return deepFreezeOwned(issues);
}
