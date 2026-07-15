import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { arch, cpus, platform, release, totalmem } from 'node:os';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  createBrowserWorkerMeasurementArtifactV1,
  createBrowserWorkerRawMeasurementCandidateV1,
  verifyBrowserWorkerMeasurementArtifactV1,
  type BrowserWorkerFlowV1,
  type BrowserWorkerProjectV1,
  type BrowserWorkerRawMeasurementCandidateV1,
  type BrowserWorkerScenarioV1,
} from '../../m0f/browser-worker-measurement-artifact.js';
import type { JsonValue } from '../../m0f/stable-json.js';

type Measurement = Readonly<{
  mode: string;
  inputJson: string;
  beforeByteLength: number;
  afterByteLength: number;
  elapsedMs: number;
  contractStatus: string;
  scientificClaim: boolean;
  outcome: string;
  reason: string | null;
  boundedFaceCount: number | null;
  resultJson: string | null;
}>;

type GridMeasurement = Readonly<{
  mode: string;
  inputJson: string;
  elapsedMs: number;
  contractStatus: string;
  scientificClaim: boolean;
  outcome: string;
  reason: string | null;
  candidateCount: number | null;
  resultJson: string | null;
}>;

type PackingMeasurement = Readonly<{
  mode: string;
  inputJson: string;
  elapsedMs: number;
  workerFactoryCallCount: number;
  contractStatus: string;
  scientificClaim: boolean;
  outcome: string;
  reason: string | null;
  resultContractStatus: string | null;
  resultScientificClaim: boolean | null;
  candidateId: string | null;
  treeEdgeCount: number | null;
  riverDimensionInputCount: number | null;
  leafCount: number | null;
  leafVariableCount: number | null;
  leafPairCount: number | null;
  separationConstraintInputCount: number | null;
  interpretation: string | null;
  constraintEvaluable: boolean | null;
  solverIncluded: boolean | null;
  packingIncluded: boolean | null;
  polygonRiverPackingIncluded: boolean | null;
  feasibilityDecisionIncluded: boolean | null;
  globalM0fGo: boolean | null;
  resultJson: string | null;
}>;

type WitnessMeasurement = Readonly<{
  mode: string;
  inputJson: string;
  elapsedMs: number;
  searchWorkerFactoryCallCount: number;
  validationWorkerFactoryCallCount: number;
  contractStatus: string;
  scientificClaim: boolean;
  outcome: string;
  reason: string | null;
  generalPolygonRiverPackingSolverIncluded: boolean;
  packingIncluded: boolean;
  feasibilityDecisionIncluded: boolean;
  globalM0fGo: boolean;
  resultContractStatus: string | null;
  resultScientificClaim: boolean | null;
  searchStatus: string | null;
  searchComplete: boolean | null;
  witnessCount: number | null;
  filterOnlySearch: boolean | null;
  necessaryFilterWitnessSearchIncluded: boolean | null;
  geometryIncluded: boolean | null;
  placementIncluded: boolean | null;
  globalPackingIncluded: boolean | null;
  polygonRiverPackingIncluded: boolean | null;
  resultJson: string | null;
}>;

type SweptCensusMeasurement = Readonly<{
  mode: string;
  inputJson: string;
  elapsedMs: number;
  workerFactoryCallCount: number;
  contractStatus: string;
  scientificClaim: boolean;
  collisionFreeClaim: boolean;
  selfIntersectionClassificationIncluded: boolean;
  globalM0fGo: boolean;
  outcome: string;
  reason: string | null;
  primitiveCount: number | null;
  unorderedPairCount: number | null;
  separatedPairCount: number | null;
  candidatePairCount: number | null;
  indeterminatePairCount: number | null;
  resultJson: string | null;
}>;

type CapturableMeasurement =
  Measurement | GridMeasurement | PackingMeasurement | WitnessMeasurement | SweptCensusMeasurement;

const BUTTON_CASES = {
  'run-success': ['fold-document-face-reconstruction', 'success-repeatability'],
  'run-cancel': ['fold-document-face-reconstruction', 'in-progress-cancellation'],
  'run-pre-abort': ['fold-document-face-reconstruction', 'pre-abort'],
  'run-grid-success': ['square-grid-quantization', 'success-repeatability'],
  'run-grid-cancel': ['square-grid-quantization', 'in-progress-cancellation'],
  'run-grid-pre-abort': ['square-grid-quantization', 'pre-abort'],
  'run-packing-success': ['polygon-river-packing-problem', 'success-repeatability'],
  'run-packing-cancel': ['polygon-river-packing-problem', 'in-progress-cancellation'],
  'run-packing-pre-abort': ['polygon-river-packing-problem', 'pre-abort'],
  'run-witness-success': ['euclidean-necessary-witness-two-stage', 'success-repeatability'],
  'run-witness-cancel': ['euclidean-necessary-witness-two-stage', 'in-progress-cancellation'],
  'run-witness-pre-abort': ['euclidean-necessary-witness-two-stage', 'pre-abort'],
  'run-swept-census-success': ['affine-origin-rotation-swept-aabb-census', 'success-repeatability'],
  'run-swept-census-cancel': [
    'affine-origin-rotation-swept-aabb-census',
    'in-progress-cancellation',
  ],
  'run-swept-census-pre-abort': ['affine-origin-rotation-swept-aabb-census', 'pre-abort'],
} as const satisfies Readonly<
  Record<string, readonly [BrowserWorkerFlowV1, BrowserWorkerScenarioV1]>
>;

type MeasurementButtonTestId = keyof typeof BUTTON_CASES;

type BrowserNavigatorSnapshot = Readonly<{
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

const HARNESS_SOURCE_PATHS = [
  'playwright.m0f.config.ts',
  'tests/browser-harness/m0f-worker.html',
  'tests/browser-harness/m0f-worker.ts',
  'tests/e2e-m0f/worker-measurement.spec.ts',
  'm0f/browser-worker-measurement-artifact.ts',
] as const;
const records: BrowserWorkerRawMeasurementCandidateV1[] = [];
const repetitionByCase = new Map<string, number>();
let activeProject: BrowserWorkerProjectV1 | undefined;
let runGroupId: string | undefined;
let browserNavigator: BrowserNavigatorSnapshot | undefined;

function parseProject(value: string): BrowserWorkerProjectV1 {
  if (value === 'chromium' || value === 'edge' || value === 'firefox') return value;
  throw new TypeError(`unsupported browser measurement project: ${value}`);
}

function gitOutput(arguments_: readonly string[]): string | null {
  try {
    return execFileSync('git', arguments_, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

async function hashHarnessSources(): Promise<string> {
  const hash = createHash('sha256');
  for (const path of HARNESS_SOURCE_PATHS) {
    hash.update(path, 'utf8');
    hash.update('\0', 'utf8');
    hash.update(await readFile(resolve(process.cwd(), path)));
    hash.update('\0', 'utf8');
  }
  return `sha256:${hash.digest('hex')}`;
}

function captureMeasurement<T extends CapturableMeasurement>(
  buttonTestId: MeasurementButtonTestId,
  startedAt: string,
  measurement: T,
): T {
  if (activeProject === undefined || runGroupId === undefined) {
    throw new TypeError('measurement project was not initialized');
  }
  if (measurement.outcome !== 'completed' && measurement.outcome !== 'cancelled') {
    throw new TypeError('measurement outcome escaped the candidate closed enum');
  }
  const [workerFlow, scenario] = BUTTON_CASES[buttonTestId];
  const caseKey = `${workerFlow}\0${scenario}`;
  const repetition = repetitionByCase.get(caseKey) ?? 0;
  repetitionByCase.set(caseKey, repetition + 1);
  records.push(
    createBrowserWorkerRawMeasurementCandidateV1({
      runGroupId,
      project: activeProject,
      workerFlow,
      scenario,
      repetition,
      startedAt,
      outcome: measurement.outcome,
      inputJson: measurement.inputJson,
      resultJson: measurement.resultJson,
      measurement: measurement as unknown as Readonly<Record<string, JsonValue>>,
    }),
  );
  return measurement;
}

async function runCapturedMeasurement<T extends CapturableMeasurement>(
  page: Page,
  buttonTestId: MeasurementButtonTestId,
): Promise<T> {
  const startedAt = new Date().toISOString();
  await page.getByTestId(buttonTestId).click();
  const output = page.getByTestId('measurement');
  await expect(output).not.toHaveText('running');
  const measurement = JSON.parse(await output.innerText()) as T;
  return captureMeasurement(buttonTestId, startedAt, measurement);
}

function runMeasurement(page: Page, buttonTestId: MeasurementButtonTestId): Promise<Measurement> {
  return runCapturedMeasurement<Measurement>(page, buttonTestId);
}

function runGridMeasurement(
  page: Page,
  buttonTestId: MeasurementButtonTestId,
): Promise<GridMeasurement> {
  return runCapturedMeasurement<GridMeasurement>(page, buttonTestId);
}

function runPackingMeasurement(
  page: Page,
  buttonTestId: MeasurementButtonTestId,
): Promise<PackingMeasurement> {
  return runCapturedMeasurement<PackingMeasurement>(page, buttonTestId);
}

function runWitnessMeasurement(
  page: Page,
  buttonTestId: MeasurementButtonTestId,
): Promise<WitnessMeasurement> {
  return runCapturedMeasurement<WitnessMeasurement>(page, buttonTestId);
}

function runSweptCensusMeasurement(
  page: Page,
  buttonTestId: MeasurementButtonTestId,
): Promise<SweptCensusMeasurement> {
  return runCapturedMeasurement<SweptCensusMeasurement>(page, buttonTestId);
}

test.beforeEach(async ({ page }, testInfo) => {
  const project = parseProject(testInfo.project.name);
  activeProject ??= project;
  if (activeProject !== project) throw new TypeError('one worker cannot mix browser projects');
  runGroupId ??= `m0f-worker:${project}:${new Date().toISOString()}:${process.pid}`;
  const response = await page.goto('/tests/browser-harness/m0f-worker.html');
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle('M0F Worker measurement harness');
  browserNavigator ??= await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info') ?? null;
    const navigatorMetadata = navigator as Navigator & {
      deviceMemory?: number;
      userAgentData?: { platform?: string };
    };
    const deviceMemory = navigatorMetadata.deviceMemory;
    return {
      userAgent: navigator.userAgent,
      navigatorPlatform: navigatorMetadata.userAgentData?.platform ?? 'unavailable',
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemoryGiB: typeof deviceMemory === 'number' ? deviceMemory : null,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        devicePixelRatio,
      },
      webGlVendor:
        gl === null || debugInfo === null
          ? null
          : String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)),
      webGlRenderer:
        gl === null || debugInfo === null
          ? null
          : String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)),
    };
  });
});

test.afterAll(async ({ browser }, testInfo) => {
  if (activeProject === undefined || browserNavigator === undefined) {
    throw new TypeError('browser measurement environment was not captured');
  }
  const sourceRevision = (process.env.GITHUB_SHA ?? gitOutput(['rev-parse', 'HEAD']) ?? 'unknown')
    .trim()
    .toLowerCase();
  const status = gitOutput(['status', '--porcelain']);
  const sourceTreeState = status === null ? 'unknown' : status === '' ? 'clean' : 'dirty';
  const cpuInfo = cpus();
  const artifact = createBrowserWorkerMeasurementArtifactV1({
    records,
    createdAt: new Date().toISOString(),
    build: {
      sourceRevision,
      sourceTreeState,
      ciRunId: process.env.GITHUB_RUN_ID ?? null,
      harnessVersion: 'm0f-browser-worker-measurement-harness-v1',
      harnessSourceHashBasis: 'sha256-of-path-nul-raw-bytes-nul-in-declared-order',
      harnessSourceSha256: await hashHarnessSources(),
      harnessSourcePaths: HARNESS_SOURCE_PATHS,
    },
    environment: {
      project: activeProject,
      os: platform(),
      osRelease: release(),
      arch: arch(),
      cpu: cpuInfo[0]?.model ?? 'unknown-cpu',
      logicalCores: cpuInfo.length,
      memoryBytes: totalmem(),
      nodeVersion: process.version,
      browserEngine: browser.browserType().name(),
      browserVersion: browser.version(),
      ...browserNavigator,
    },
  });
  const verificationIssues = verifyBrowserWorkerMeasurementArtifactV1(
    artifact.rawJsonl,
    artifact.manifest,
  );
  if (verificationIssues.length > 0) {
    throw new TypeError(
      `measurement artifact failed self-check: ${JSON.stringify(verificationIssues)}`,
    );
  }
  const artifactRoot = resolve(
    process.env.M0F_WORKER_MEASUREMENT_ARTIFACT_ROOT ??
      resolve(process.cwd(), '.artifacts', 'm0f-worker-measurements'),
    testInfo.project.name,
  );
  await mkdir(artifactRoot, { recursive: true });
  await Promise.all([
    writeFile(resolve(artifactRoot, 'measurements.raw.jsonl'), artifact.rawJsonl, 'utf8'),
    writeFile(resolve(artifactRoot, 'manifest.json'), artifact.manifestJson, 'utf8'),
  ]);
});

test('transfers FOLD bytes and returns repeatable results in real module Workers', async ({
  page,
}) => {
  const measurements: Measurement[] = [];
  for (let repetition = 0; repetition < 5; repetition += 1) {
    measurements.push(await runMeasurement(page, 'run-success'));
  }
  for (const measurement of measurements) {
    expect(measurement).toMatchObject({
      mode: 'success',
      afterByteLength: 0,
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      reason: null,
      boundedFaceCount: 4,
    });
    expect(measurement.beforeByteLength).toBeGreaterThan(0);
    expect(measurement.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(measurement.resultJson).not.toBeNull();
  }
  expect(new Set(measurements.map(({ resultJson }) => resultJson)).size).toBe(1);
});

test('immediate AbortSignal settles cancellation after consuming transferred bytes', async ({
  page,
}) => {
  const measurement = await runMeasurement(page, 'run-cancel');
  expect(measurement).toMatchObject({
    mode: 'cancel',
    afterByteLength: 0,
    contractStatus: 'candidate',
    scientificClaim: false,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    boundedFaceCount: null,
    resultJson: null,
  });
  expect(measurement.beforeByteLength).toBeGreaterThan(0);
  expect(measurement.elapsedMs).toBeLessThan(2_000);
});

test('pre-aborted work neither creates a Worker nor consumes the byte buffer', async ({ page }) => {
  const measurement = await runMeasurement(page, 'run-pre-abort');
  expect(measurement).toMatchObject({
    mode: 'pre-abort',
    contractStatus: 'candidate',
    scientificClaim: false,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    boundedFaceCount: null,
    resultJson: null,
  });
  expect(measurement.beforeByteLength).toBeGreaterThan(0);
  expect(measurement.afterByteLength).toBe(measurement.beforeByteLength);
});

test('returns repeatable square-grid candidates in real module Workers', async ({ page }) => {
  const measurements: GridMeasurement[] = [];
  for (let repetition = 0; repetition < 5; repetition += 1) {
    measurements.push(await runGridMeasurement(page, 'run-grid-success'));
  }
  for (const measurement of measurements) {
    expect(measurement).toMatchObject({
      mode: 'grid-success',
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      reason: null,
    });
    expect(measurement.candidateCount).toBeGreaterThan(0);
    expect(measurement.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(measurement.resultJson).not.toBeNull();
  }
  expect(new Set(measurements.map(({ resultJson }) => resultJson)).size).toBe(1);
});

test('immediate AbortSignal terminates a real square-grid Worker', async ({ page }) => {
  const measurement = await runGridMeasurement(page, 'run-grid-cancel');
  expect(measurement).toMatchObject({
    mode: 'grid-cancel',
    contractStatus: 'candidate',
    scientificClaim: false,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    candidateCount: null,
    resultJson: null,
  });
  expect(measurement.elapsedMs).toBeLessThan(2_000);
});

test('pre-aborted square-grid work settles without starting computation', async ({ page }) => {
  const measurement = await runGridMeasurement(page, 'run-grid-pre-abort');
  expect(measurement).toMatchObject({
    mode: 'grid-pre-abort',
    contractStatus: 'candidate',
    scientificClaim: false,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    candidateCount: null,
    resultJson: null,
  });
});

test('returns a repeatable finite packing-problem description in real module Workers', async ({
  page,
}) => {
  const measurements: PackingMeasurement[] = [];
  for (let repetition = 0; repetition < 5; repetition += 1) {
    measurements.push(await runPackingMeasurement(page, 'run-packing-success'));
  }
  for (const measurement of measurements) {
    expect(measurement).toMatchObject({
      mode: 'packing-success',
      workerFactoryCallCount: 1,
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      reason: null,
      resultContractStatus: 'candidate',
      resultScientificClaim: false,
      candidateId: 'square-grid:1x1:xy:1',
      treeEdgeCount: 1,
      riverDimensionInputCount: 1,
      leafCount: 2,
      leafVariableCount: 2,
      leafPairCount: 1,
      separationConstraintInputCount: 1,
      interpretation:
        'finite CSP problem description only; no geometry, metric, assignment, or solver',
      constraintEvaluable: false,
      solverIncluded: false,
      packingIncluded: false,
      polygonRiverPackingIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
    });
    expect(measurement.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(measurement.resultJson).not.toBeNull();
  }
  expect(new Set(measurements.map(({ resultJson }) => resultJson)).size).toBe(1);
});

test('immediate AbortSignal terminates a real packing-problem Worker', async ({ page }) => {
  const measurement = await runPackingMeasurement(page, 'run-packing-cancel');
  expect(measurement).toMatchObject({
    mode: 'packing-cancel',
    workerFactoryCallCount: 1,
    contractStatus: 'candidate',
    scientificClaim: false,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    resultContractStatus: null,
    candidateId: null,
    leafCount: null,
    leafPairCount: null,
    resultJson: null,
  });
  expect(measurement.elapsedMs).toBeLessThan(2_000);
});

test('pre-aborted packing-problem work does not create a Worker', async ({ page }) => {
  const measurement = await runPackingMeasurement(page, 'run-packing-pre-abort');
  expect(measurement).toMatchObject({
    mode: 'packing-pre-abort',
    workerFactoryCallCount: 0,
    contractStatus: 'candidate',
    scientificClaim: false,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    resultContractStatus: null,
    candidateId: null,
    leafCount: null,
    leafPairCount: null,
    resultJson: null,
  });
});

test('runs filter-only witness search and independent replay in two real module Workers', async ({
  page,
}) => {
  const measurements: WitnessMeasurement[] = [];
  for (let repetition = 0; repetition < 5; repetition += 1) {
    measurements.push(await runWitnessMeasurement(page, 'run-witness-success'));
  }
  for (const measurement of measurements) {
    expect(measurement).toMatchObject({
      mode: 'witness-success',
      searchWorkerFactoryCallCount: 1,
      validationWorkerFactoryCallCount: 1,
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'completed',
      reason: null,
      generalPolygonRiverPackingSolverIncluded: false,
      packingIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      resultContractStatus: 'candidate',
      resultScientificClaim: false,
      searchStatus: 'witness-found',
      searchComplete: false,
      witnessCount: 1,
      filterOnlySearch: true,
      necessaryFilterWitnessSearchIncluded: true,
      geometryIncluded: false,
      placementIncluded: false,
      globalPackingIncluded: false,
      polygonRiverPackingIncluded: false,
    });
    expect(measurement.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(measurement.resultJson).not.toBeNull();
  }
  expect(new Set(measurements.map(({ resultJson }) => resultJson)).size).toBe(1);
});

test('AbortSignal cancels an in-progress real witness-search Worker before replay starts', async ({
  page,
}) => {
  const measurement = await runWitnessMeasurement(page, 'run-witness-cancel');
  expect(measurement).toMatchObject({
    mode: 'witness-cancel',
    searchWorkerFactoryCallCount: 1,
    validationWorkerFactoryCallCount: 0,
    contractStatus: 'candidate',
    scientificClaim: false,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    generalPolygonRiverPackingSolverIncluded: false,
    packingIncluded: false,
    feasibilityDecisionIncluded: false,
    globalM0fGo: false,
    resultContractStatus: null,
    searchStatus: null,
    witnessCount: null,
    resultJson: null,
  });
  expect(measurement.elapsedMs).toBeLessThan(2_000);
});

test('pre-aborted witness work creates neither real Worker stage', async ({ page }) => {
  const measurement = await runWitnessMeasurement(page, 'run-witness-pre-abort');
  expect(measurement).toMatchObject({
    mode: 'witness-pre-abort',
    searchWorkerFactoryCallCount: 0,
    validationWorkerFactoryCallCount: 0,
    contractStatus: 'candidate',
    scientificClaim: false,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    generalPolygonRiverPackingSolverIncluded: false,
    packingIncluded: false,
    feasibilityDecisionIncluded: false,
    globalM0fGo: false,
    resultContractStatus: null,
    searchStatus: null,
    witnessCount: null,
    resultJson: null,
  });
  expect(measurement.elapsedMs).toBeGreaterThanOrEqual(0);
});

test('returns a repeatable complete swept-AABB census in a real module Worker', async ({
  page,
}) => {
  const measurements: SweptCensusMeasurement[] = [];
  for (let repetition = 0; repetition < 5; repetition += 1) {
    measurements.push(await runSweptCensusMeasurement(page, 'run-swept-census-success'));
  }
  for (const measurement of measurements) {
    expect(measurement).toMatchObject({
      mode: 'swept-census-success',
      workerFactoryCallCount: 1,
      contractStatus: 'candidate-no-claim',
      scientificClaim: false,
      collisionFreeClaim: false,
      selfIntersectionClassificationIncluded: false,
      globalM0fGo: false,
      outcome: 'completed',
      reason: null,
      primitiveCount: 3,
      unorderedPairCount: 3,
      separatedPairCount: 2,
      candidatePairCount: 1,
      indeterminatePairCount: 0,
    });
    expect(measurement.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(measurement.resultJson).not.toBeNull();
  }
  expect(new Set(measurements.map(({ resultJson }) => resultJson)).size).toBe(1);
});

test('AbortSignal terminates an in-progress real swept-AABB census Worker', async ({ page }) => {
  const measurement = await runSweptCensusMeasurement(page, 'run-swept-census-cancel');
  expect(measurement).toMatchObject({
    mode: 'swept-census-cancel',
    workerFactoryCallCount: 1,
    contractStatus: 'candidate-no-claim',
    scientificClaim: false,
    collisionFreeClaim: false,
    selfIntersectionClassificationIncluded: false,
    globalM0fGo: false,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    primitiveCount: null,
    unorderedPairCount: null,
    separatedPairCount: null,
    candidatePairCount: null,
    indeterminatePairCount: null,
    resultJson: null,
  });
  expect(measurement.elapsedMs).toBeLessThan(2_000);
});

test('pre-aborted swept-AABB census work does not create a Worker', async ({ page }) => {
  const measurement = await runSweptCensusMeasurement(page, 'run-swept-census-pre-abort');
  expect(measurement).toMatchObject({
    mode: 'swept-census-pre-abort',
    workerFactoryCallCount: 0,
    contractStatus: 'candidate-no-claim',
    scientificClaim: false,
    collisionFreeClaim: false,
    selfIntersectionClassificationIncluded: false,
    globalM0fGo: false,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    primitiveCount: null,
    unorderedPairCount: null,
    separatedPairCount: null,
    candidatePairCount: null,
    indeterminatePairCount: null,
    resultJson: null,
  });
});
