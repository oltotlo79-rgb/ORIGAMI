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
} as const;

const BUILD = {
  sourceRevision: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  sourceTreeState: 'clean',
  ciRunId: 'test-run',
} as const;

function measurement(
  workerFlow: BrowserWorkerFlowV1,
  repetition: number,
  scenario:
    'success-repeatability' | 'in-progress-cancellation' | 'pre-abort' = 'success-repeatability',
): BrowserWorkerRawMeasurementCandidateV1 {
  const completed = scenario === 'success-repeatability';
  const resultJson = completed ? JSON.stringify({ workerFlow, stable: true }) : null;
  return createBrowserWorkerRawMeasurementCandidateV1({
    project: 'chromium',
    workerFlow,
    scenario,
    repetition,
    startedAt: `2026-01-01T00:${String(BROWSER_WORKER_FLOWS.indexOf(workerFlow)).padStart(2, '0')}:${String(repetition).padStart(2, '0')}.000Z`,
    outcome: completed ? 'completed' : 'cancelled',
    resultJson,
    measurement: {
      mode: scenario,
      elapsedMs: repetition + 0.25,
      outcome: completed ? 'completed' : 'cancelled',
      resultJson,
    },
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
      resultJsonSha256: `sha256:${'0'.repeat(64)}`,
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
    expect(() =>
      createBrowserWorkerRawMeasurementCandidateV1({
        project: 'chromium',
        workerFlow: 'square-grid-quantization',
        scenario: 'success-repeatability',
        repetition: 0,
        startedAt: '2026-01-01T00:00:00.000Z',
        outcome: 'completed',
        resultJson: '{"accepted":true}',
        measurement: { outcome: 'completed', resultJson: '{"accepted":false}' },
      }),
    ).toThrow('measurement.resultJson must match the hash source');
  });
});
