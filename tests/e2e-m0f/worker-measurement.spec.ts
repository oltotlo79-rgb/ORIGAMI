import { expect, test, type Page } from '@playwright/test';

type Measurement = Readonly<{
  mode: string;
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

async function runMeasurement(page: Page, buttonTestId: string): Promise<Measurement> {
  await page.getByTestId(buttonTestId).click();
  const output = page.getByTestId('measurement');
  await expect(output).not.toHaveText('running');
  return JSON.parse(await output.innerText()) as Measurement;
}

async function runGridMeasurement(page: Page, buttonTestId: string): Promise<GridMeasurement> {
  await page.getByTestId(buttonTestId).click();
  const output = page.getByTestId('measurement');
  await expect(output).not.toHaveText('running');
  return JSON.parse(await output.innerText()) as GridMeasurement;
}

async function runPackingMeasurement(
  page: Page,
  buttonTestId: string,
): Promise<PackingMeasurement> {
  await page.getByTestId(buttonTestId).click();
  const output = page.getByTestId('measurement');
  await expect(output).not.toHaveText('running');
  return JSON.parse(await output.innerText()) as PackingMeasurement;
}

async function runWitnessMeasurement(
  page: Page,
  buttonTestId: string,
): Promise<WitnessMeasurement> {
  await page.getByTestId(buttonTestId).click();
  const output = page.getByTestId('measurement');
  await expect(output).not.toHaveText('running');
  return JSON.parse(await output.innerText()) as WitnessMeasurement;
}

async function runSweptCensusMeasurement(
  page: Page,
  buttonTestId: string,
): Promise<SweptCensusMeasurement> {
  await page.getByTestId(buttonTestId).click();
  const output = page.getByTestId('measurement');
  await expect(output).not.toHaveText('running');
  return JSON.parse(await output.innerText()) as SweptCensusMeasurement;
}

test.beforeEach(async ({ page }) => {
  const response = await page.goto('/tests/browser-harness/m0f-worker.html');
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle('M0F Worker measurement harness');
});

test('transfers FOLD bytes and returns repeatable results in real module Workers', async ({
  page,
}) => {
  const measurements: Measurement[] = [];
  for (let repetition = 0; repetition < 3; repetition += 1) {
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
  for (let repetition = 0; repetition < 3; repetition += 1) {
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
  for (let repetition = 0; repetition < 3; repetition += 1) {
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
  for (let repetition = 0; repetition < 2; repetition += 1) {
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
});

test('returns a repeatable complete swept-AABB census in a real module Worker', async ({
  page,
}) => {
  const measurements: SweptCensusMeasurement[] = [];
  for (let repetition = 0; repetition < 3; repetition += 1) {
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
