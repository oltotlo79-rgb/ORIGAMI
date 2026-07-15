import { describe, expect, it } from 'vitest';

import {
  BROWSER_WORKER_FLOWS,
  createBrowserWorkerMeasurementArtifactV1,
  createBrowserWorkerRawMeasurementCandidateV1,
  verifyBrowserWorkerMeasurementArtifactV1,
  type BrowserWorkerFlowV1,
  type BrowserWorkerMeasurementManifestV1,
  type BrowserWorkerRawMeasurementCandidateV1,
} from '../../m0f/browser-worker-measurement-artifact.js';
import { serializeJsonLine } from '../../m0f/stable-json.js';

const ENVIRONMENT = {
  project: 'chromium',
  os: 'win32',
  osRelease: 'test-release',
  arch: 'x64',
  cpu: 'test cpu',
  logicalCores: 4,
  memoryBytes: 16 * 1024 * 1024 * 1024,
  nodeVersion: 'v22.0.0',
  browserEngine: 'chromium',
  browserVersion: '123.0.0.0',
  userAgent: 'test user agent',
  navigatorPlatform: 'Win32',
  hardwareConcurrency: 4,
  deviceMemoryGiB: 8,
  screen: { width: 1920, height: 1080, colorDepth: 24, devicePixelRatio: 1 },
  webGlVendor: 'test vendor',
  webGlRenderer: 'test renderer',
} as const;

const BUILD = {
  sourceRevision: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  sourceTreeState: 'clean',
  ciRunId: 'test-run',
  harnessVersion: 'm0f-browser-worker-measurement-harness-v1',
  harnessSourceHashBasis: 'sha256-of-path-nul-raw-bytes-nul-in-declared-order',
  harnessSourceSha256: `sha256:${'b'.repeat(64)}`,
  harnessSourcePaths: ['tests/browser-harness/m0f-worker.ts'],
} as const;

function measurement(
  workerFlow: BrowserWorkerFlowV1,
  repetition: number,
  scenario:
    'success-repeatability' | 'in-progress-cancellation' | 'pre-abort' = 'success-repeatability',
): BrowserWorkerRawMeasurementCandidateV1 {
  const completed = scenario === 'success-repeatability';
  const contractStatus =
    workerFlow === 'affine-origin-rotation-swept-aabb-census' ? 'candidate-no-claim' : 'candidate';
  const resultJson = completed
    ? JSON.stringify({ workerFlow, contractStatus, scientificClaim: false, stable: true })
    : null;
  const inputJson = JSON.stringify({ workerFlow, contractStatus, scientificClaim: false });
  const mode = {
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
  }[workerFlow][scenario];
  const common = {
    mode,
    inputJson,
    elapsedMs: repetition + 0.25,
    contractStatus,
    scientificClaim: false,
    outcome: completed ? 'completed' : 'cancelled',
    reason: completed ? null : 'aborted-by-caller',
    resultJson,
  } as const;
  const measurementByFlow = {
    'fold-document-face-reconstruction': {
      ...common,
      beforeByteLength: 100,
      afterByteLength: 0,
      boundedFaceCount: completed ? 4 : null,
    },
    'square-grid-quantization': { ...common, candidateCount: completed ? 2 : null },
    'polygon-river-packing-problem': {
      ...common,
      workerFactoryCallCount: scenario === 'pre-abort' ? 0 : 1,
      resultContractStatus: completed ? 'candidate' : null,
      resultScientificClaim: completed ? false : null,
      candidateId: completed ? 'candidate' : null,
      treeEdgeCount: completed ? 1 : null,
      riverDimensionInputCount: completed ? 1 : null,
      leafCount: completed ? 2 : null,
      leafVariableCount: completed ? 2 : null,
      leafPairCount: completed ? 1 : null,
      separationConstraintInputCount: completed ? 1 : null,
      interpretation: completed ? 'candidate diagnostic' : null,
      constraintEvaluable: completed ? false : null,
      solverIncluded: completed ? false : null,
      packingIncluded: completed ? false : null,
      polygonRiverPackingIncluded: completed ? false : null,
      feasibilityDecisionIncluded: completed ? false : null,
      globalM0fGo: completed ? false : null,
    },
    'euclidean-necessary-witness-two-stage': {
      ...common,
      searchWorkerFactoryCallCount: scenario === 'pre-abort' ? 0 : 1,
      validationWorkerFactoryCallCount: completed ? 1 : 0,
      generalPolygonRiverPackingSolverIncluded: false,
      packingIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      resultContractStatus: completed ? 'candidate' : null,
      resultScientificClaim: completed ? false : null,
      searchStatus: completed ? 'witness-found' : null,
      searchComplete: completed ? false : null,
      witnessCount: completed ? 1 : null,
      filterOnlySearch: completed ? true : null,
      necessaryFilterWitnessSearchIncluded: completed ? true : null,
      geometryIncluded: completed ? false : null,
      placementIncluded: completed ? false : null,
      globalPackingIncluded: completed ? false : null,
      polygonRiverPackingIncluded: completed ? false : null,
    },
    'affine-origin-rotation-swept-aabb-census': {
      ...common,
      workerFactoryCallCount: scenario === 'pre-abort' ? 0 : 1,
      collisionFreeClaim: false,
      selfIntersectionClassificationIncluded: false,
      globalM0fGo: false,
      primitiveCount: completed ? 3 : null,
      unorderedPairCount: completed ? 3 : null,
      separatedPairCount: completed ? 2 : null,
      candidatePairCount: completed ? 1 : null,
      indeterminatePairCount: completed ? 0 : null,
    },
  } as const;
  return createBrowserWorkerRawMeasurementCandidateV1({
    runGroupId: 'test-group',
    project: 'chromium',
    workerFlow,
    scenario,
    repetition,
    startedAt: `2026-01-01T00:${String(BROWSER_WORKER_FLOWS.indexOf(workerFlow)).padStart(2, '0')}:${String(repetition).padStart(2, '0')}.000Z`,
    outcome: completed ? 'completed' : 'cancelled',
    inputJson,
    resultJson,
    measurement: measurementByFlow[workerFlow],
  });
}

function fullRecords(): BrowserWorkerRawMeasurementCandidateV1[] {
  return BROWSER_WORKER_FLOWS.flatMap((workerFlow) => [
    ...Array.from({ length: 5 }, (_, repetition) => measurement(workerFlow, repetition)),
    measurement(workerFlow, 0, 'in-progress-cancellation'),
    measurement(workerFlow, 0, 'pre-abort'),
  ]);
}

describe('browser Worker candidate measurement artifact', () => {
  it('binds canonical raw JSONL, environment, build, and five-run summaries', () => {
    const artifact = createBrowserWorkerMeasurementArtifactV1({
      records: fullRecords().reverse(),
      createdAt: '2026-01-01T01:00:00.000Z',
      build: BUILD,
      environment: ENVIRONMENT,
    });

    expect(artifact.manifest).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      artifactKind: 'raw-browser-worker-smoke-diagnostic-not-final-evidence',
      rawJsonl: {
        path: 'measurements.raw.jsonl',
        recordCount: 35,
      },
      successRepetitionTarget: 5,
      allSuccessFlowsHaveFiveRepeatableResults: true,
      cleanSourceRevisionBound: true,
      limitations: {
        referenceWindowsHardwareQualified: false,
        runtimeLimitsFrozen: false,
        performanceThresholdDecisionIncluded: false,
        percentileSummaryIncluded: false,
        memoryMeasurementIncluded: false,
        scientificEvidenceIncluded: false,
        finalPerformanceEvidence: false,
        globalM0fGo: false,
      },
    });
    expect(artifact.manifest.repeatability).toHaveLength(5);
    expect(
      artifact.manifest.repeatability.every(
        ({ candidateFiveRunCheckPassed, observedRepetitions }) =>
          candidateFiveRunCheckPassed && observedRepetitions === 5,
      ),
    ).toBe(true);
    expect(artifact.rawJsonl.trim().split('\n')).toHaveLength(35);
    expect(JSON.parse(artifact.manifestJson)).toEqual(artifact.manifest);
    expect(verifyBrowserWorkerMeasurementArtifactV1(artifact.rawJsonl, artifact.manifest)).toEqual(
      [],
    );
  });

  it('keeps incomplete executions explicitly below the five-run diagnostic check', () => {
    const artifact = createBrowserWorkerMeasurementArtifactV1({
      records: Array.from({ length: 4 }, (_, repetition) =>
        measurement('fold-document-face-reconstruction', repetition),
      ),
      createdAt: '2026-01-01T01:00:00.000Z',
      build: { ...BUILD, sourceTreeState: 'dirty' },
      environment: ENVIRONMENT,
    });

    expect(artifact.manifest.allSuccessFlowsHaveFiveRepeatableResults).toBe(false);
    expect(artifact.manifest.cleanSourceRevisionBound).toBe(false);
    expect(artifact.manifest.repeatability[0]).toMatchObject({
      observedRepetitions: 4,
      outcomeStable: true,
      resultHashStable: true,
      candidateFiveRunCheckPassed: false,
    });
    expect(
      artifact.manifest.repeatability
        .slice(1)
        .every(({ observedRepetitions }) => observedRepetitions === 0),
    ).toBe(true);
  });

  it('detects raw data, result-hash, and manifest tampering', () => {
    const artifact = createBrowserWorkerMeasurementArtifactV1({
      records: fullRecords(),
      createdAt: '2026-01-01T01:00:00.000Z',
      build: BUILD,
      environment: ENVIRONMENT,
    });
    const lines = artifact.rawJsonl.trimEnd().split('\n');
    const first = JSON.parse(lines[0] ?? '') as BrowserWorkerRawMeasurementCandidateV1;
    lines[0] = serializeJsonLine({
      ...first,
      resultBinding: { ...first.resultBinding, sha256: `sha256:${'0'.repeat(64)}` },
    }).trimEnd();
    const tamperedRaw = `${lines.join('\n')}\n`;
    const rawIssues = verifyBrowserWorkerMeasurementArtifactV1(tamperedRaw, artifact.manifest);
    expect(rawIssues.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['raw-sha256-mismatch', 'result-sha256-mismatch']),
    );

    const tamperedManifest = {
      ...structuredClone(artifact.manifest),
      createdAt: '2026-01-01T02:00:00.000Z',
    } as BrowserWorkerMeasurementManifestV1;
    expect(
      verifyBrowserWorkerMeasurementArtifactV1(artifact.rawJsonl, tamperedManifest).map(
        ({ code }) => code,
      ),
    ).toContain('manifest-sha256-mismatch');
  });

  it('refuses to hash a result different from the stored raw measurement', () => {
    const valid = measurement('square-grid-quantization', 0);
    expect(() =>
      createBrowserWorkerRawMeasurementCandidateV1({
        runGroupId: valid.runGroupId,
        project: valid.project,
        workerFlow: valid.workerFlow,
        scenario: valid.scenario,
        repetition: valid.repetition,
        startedAt: valid.startedAt,
        outcome: valid.outcome,
        inputJson: valid.inputBinding.json,
        resultJson: '{"accepted":true}',
        measurement: valid.measurement,
      }),
    ).toThrow('measurement.resultJson must match the hash source');
  });
});
