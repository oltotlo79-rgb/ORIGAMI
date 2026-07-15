import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_INPUT_RECORD_TYPE,
  BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
  evaluateBrowserRuntimeLicenseCandidateFlowV1,
} from '../../m0f/browser-runtime-license-candidate-flow.js';
import {
  runBrowserRuntimeLicenseCandidateFlowCli,
  type BrowserRuntimeLicenseCandidateFlowCliIo,
} from '../../m0f/browser-runtime-license-candidate-flow-cli.js';

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(path), 'utf8')) as unknown;
}

async function defaultInput(): Promise<Record<string, unknown>> {
  return {
    schemaVersion: 1,
    recordType: BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    runtimeLimitsCandidate: await readJson('m0f/profiles/runtime-limits-v1.candidates.json'),
    benchmarkRecords: [await readJson('tests/fixtures/_harness-smoke/benchmark-record.json')],
    licenseInventory: {
      projectLicense: {
        name: 'oridesign',
        version: '0.0.0',
        location: '',
        license: 'MIT',
      },
      dependencies: [
        {
          name: 'alpha',
          version: '1.0.0',
          location: 'node_modules/alpha',
          license: 'Apache-2.0',
        },
        {
          name: 'beta',
          version: '2.0.0',
          location: 'node_modules/beta',
          license: 'MIT OR ISC',
        },
      ],
    },
  };
}

function capture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: BrowserRuntimeLicenseCandidateFlowCliIo = {
    cwd: process.cwd(),
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  };
  return { stdout, stderr, io };
}

describe('M0F browser/runtime/license candidate flow', () => {
  it('bundles candidate metadata while keeping every measured/final claim false', async () => {
    const result = evaluateBrowserRuntimeLicenseCandidateFlowV1(await defaultInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));

    expect(result.value).toMatchObject({
      recordType: BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      outputKind: 'runtime-performance-license-readiness-diagnostic-not-final-evidence',
      runtimeCandidateProfileParsed: true,
      runtimeLimitCandidateCount: 18,
      selectedRuntimeLimitCount: 0,
      measuredRuntimeLimitCount: 0,
      measuredFrozenRuntimeLimitsIncluded: false,
      runtimeSupportClaim: false,
      benchmarkRecordMetadataValidated: true,
      benchmarkRecordCount: 1,
      benchmarkExecutionIncluded: false,
      benchmarkGoldenManifestBindingVerified: false,
      performanceThresholdDecisionIncluded: false,
      browserMatrixConfigurationDescriptorIncluded: true,
      realBrowserExecutionIncluded: false,
      windowsBrowserMeasurementEvidenceIncluded: false,
      browserResultArtifactsIncluded: false,
      dependencyLicensePolicyEvaluated: true,
      dependencyCount: 2,
      licenseViolationCount: 0,
      licenseAllowlistDiagnosticPassed: true,
      packageLockBindingVerified: false,
      licenseInventoryCompletenessVerified: false,
      licenseTextAuditIncluded: false,
      referenceImplementationSourceAuditIncluded: false,
      finalDependencyLicenseAuditIncluded: false,
      sourceProvenanceAuditIncluded: false,
      redistributionDecisionAuditIncluded: false,
      licenseInventoryArtifactPersisted: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      productRuntimeGuaranteeIncluded: false,
      scientificEvidenceIncluded: false,
      globalM0fGo: false,
      browserMatrix: {
        projects: ['chromium', 'edge', 'firefox'],
        configuredProjectFlowScenarioCount: 45,
        sourceConfigurationParsedByFlow: false,
        browserExecutionIncluded: false,
        measuredRuntimeLimitEvidence: false,
      },
      performanceProbeCatalog: {
        probeFileCount: 6,
        executionIncluded: false,
        passThresholdIncluded: false,
        rawMeasurementArtifactIncluded: false,
        frozenLimitSelectionIncluded: false,
      },
    });
    expect(result.value.licensePolicy.violations).toEqual([]);
    expect(result.value.canonicalBenchmarkJsonl[0]).toBe(
      await readFile(resolve('tests/fixtures/_harness-smoke/benchmark-record.jsonl'), 'utf8'),
    );
    expect(Object.isFrozen(result.value)).toBe(true);

    const playwrightConfig = await readFile(resolve('playwright.m0f.config.ts'), 'utf8');
    const browserTest = await readFile(resolve('tests/e2e-m0f/worker-measurement.spec.ts'), 'utf8');
    for (const project of result.value.browserMatrix.projects) {
      expect(playwrightConfig).toContain(`name: '${project}'`);
    }
    expect(browserTest).toContain('run-witness-success');
    expect(browserTest).toContain('run-swept-census-pre-abort');
    for (const probe of result.value.performanceProbeCatalog.probeFiles) {
      expect(await readFile(resolve(probe), 'utf8')).not.toHaveLength(0);
    }
  });

  it('reports license-policy violations without promoting the diagnostic to a final audit', async () => {
    const input = await defaultInput();
    const inventory = input.licenseInventory as {
      dependencies: { license: string | null }[];
    };
    const dependency = inventory.dependencies[0];
    if (dependency === undefined) throw new Error('dependency fixture must exist');
    dependency.license = 'GPL-3.0-only';

    const result = evaluateBrowserRuntimeLicenseCandidateFlowV1(input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    expect(result.value).toMatchObject({
      licenseViolationCount: 1,
      licenseAllowlistDiagnosticPassed: false,
      finalDependencyLicenseAuditIncluded: false,
      sourceProvenanceAuditIncluded: false,
      globalM0fGo: false,
    });
    expect(result.value.licensePolicy.violations[0]).toMatchObject({
      name: 'alpha',
      allowed: false,
      reason: 'forbidden-copyleft-license',
    });
  });

  it('rejects measured runtime selections and scientific benchmark escalation', async () => {
    const selectedInput = await defaultInput();
    const runtime = selectedInput.runtimeLimitsCandidate as {
      limits: { maxVertices: { selected: number | null } };
    };
    runtime.limits.maxVertices.selected = 10_000;
    const selected = evaluateBrowserRuntimeLicenseCandidateFlowV1(selectedInput);
    expect(selected.ok).toBe(false);
    if (selected.ok) throw new Error('expected runtime claim-boundary rejection');
    expect(selected.error).toContainEqual(
      expect.objectContaining({
        stage: 'runtime-limits',
        path: '$.runtimeLimitsCandidate',
        code: 'claim-boundary',
      }),
    );

    const scientificInput = await defaultInput();
    const records = scientificInput.benchmarkRecords as { scientificClaim: boolean }[];
    const record = records[0];
    if (record === undefined) throw new Error('benchmark fixture must exist');
    record.scientificClaim = true;
    const scientific = evaluateBrowserRuntimeLicenseCandidateFlowV1(scientificInput);
    expect(scientific.ok).toBe(false);
    if (scientific.ok) throw new Error('expected benchmark claim-boundary rejection');
    expect(scientific.error[0]).toMatchObject({ stage: 'benchmark' });
  });

  it('runs the local metadata diagnostic deterministically through the CLI', async () => {
    const first = capture();
    const second = capture();
    expect(await runBrowserRuntimeLicenseCandidateFlowCli([], first.io)).toBe(0);
    expect(await runBrowserRuntimeLicenseCandidateFlowCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);
    expect(JSON.parse(first.stdout[0] ?? 'null')).toMatchObject({
      dependencyLicensePolicyEvaluated: true,
      licenseViolationCount: 0,
      measuredFrozenRuntimeLimitsIncluded: false,
      realBrowserExecutionIncluded: false,
      finalDependencyLicenseAuditIncluded: false,
      globalM0fGo: false,
    });
  });
});
