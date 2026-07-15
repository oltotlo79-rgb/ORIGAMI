import { ALLOWED_LICENSE_IDS, evaluateLicense } from '../scripts/license-policy.mjs';

import { deepFreezeOwned } from './clone-and-freeze.js';
import {
  serializeBenchmarkRecord,
  validateBenchmarkRecord,
  type BenchmarkRecord,
} from './benchmark.js';
import {
  parseRuntimeLimitsV1,
  RUNTIME_LIMIT_KEYS,
  type RuntimeLimitsV1,
} from './profiles/runtime-limits.js';
import { tryCreateStrictValidationSnapshot } from './strict-validation-snapshot.js';

export const BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_INPUT_RECORD_TYPE =
  'm0f-browser-runtime-license-candidate-flow-input' as const;
export const BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_RESULT_RECORD_TYPE =
  'm0f-browser-runtime-license-candidate-flow-result' as const;

export const M0F_BROWSER_WORKER_MATRIX_CANDIDATE_V1 = deepFreezeOwned({
  descriptorStatus: 'candidate-configuration-reference-only' as const,
  configPath: 'playwright.m0f.config.ts' as const,
  testPath: 'tests/e2e-m0f/worker-measurement.spec.ts' as const,
  harnessPath: 'tests/browser-harness/m0f-worker.html' as const,
  projects: ['chromium', 'edge', 'firefox'] as const,
  workerFlows: [
    'fold-document-face-reconstruction',
    'square-grid-quantization',
    'polygon-river-packing-problem',
    'euclidean-necessary-witness-two-stage',
    'affine-origin-rotation-swept-aabb-census',
  ] as const,
  scenarioKinds: ['success-repeatability', 'in-progress-cancellation', 'pre-abort'] as const,
  configuredProjectCount: 3 as const,
  configuredWorkerFlowCount: 5 as const,
  configuredScenarioKindCount: 3 as const,
  configuredProjectFlowScenarioCount: 45 as const,
  sourceConfigurationParsedByFlow: false as const,
  browserExecutionIncluded: false as const,
  browserMeasurementsPersisted: false as const,
  measuredRuntimeLimitEvidence: false as const,
});

export const M0F_PERFORMANCE_PROBE_CATALOG_V1 = deepFreezeOwned({
  descriptorStatus: 'candidate-vitest-bench-source-reference-only' as const,
  command: 'npm run test:perf' as const,
  probeFiles: [
    'tests/perf/m0f-harness.bench.ts',
    'tests/perf/m0f-square-grid.bench.ts',
    'tests/perf/m0f-face-reconstruction.bench.ts',
    'tests/perf/m0f-face-complex-audit.bench.ts',
    'tests/perf/m0f-numeric-kernel.bench.ts',
    'tests/perf/m0f-euclidean-necessary-witness-search.bench.ts',
  ] as const,
  probeFileCount: 6 as const,
  executionIncluded: false as const,
  passThresholdIncluded: false as const,
  rawMeasurementArtifactIncluded: false as const,
  frozenLimitSelectionIncluded: false as const,
});

export type LicenseInventorySourceEntryV1 = Readonly<{
  name: string;
  version: string;
  location: string;
  license: string | null;
}>;

export type BrowserRuntimeLicenseCandidateFlowInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  runtimeLimitsCandidate: RuntimeLimitsV1;
  benchmarkRecords: readonly BenchmarkRecord[];
  licenseInventory: Readonly<{
    projectLicense: LicenseInventorySourceEntryV1;
    dependencies: readonly LicenseInventorySourceEntryV1[];
  }>;
}>;

export type EvaluatedLicenseInventoryEntryV1 = LicenseInventorySourceEntryV1 &
  Readonly<{
    allowed: boolean;
    identifiers: readonly string[];
    reason: string;
  }>;

export type BrowserRuntimeLicenseCandidateFlowResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  outputKind: 'runtime-performance-license-readiness-diagnostic-not-final-evidence';
  scope: 'candidate-runtime-benchmark-browser-matrix-and-license-policy-metadata-only';
  runtimeCandidateProfileParsed: true;
  runtimeLimitCandidateCount: 18;
  selectedRuntimeLimitCount: 0;
  measuredRuntimeLimitCount: 0;
  measuredFrozenRuntimeLimitsIncluded: false;
  runtimeSupportClaim: false;
  benchmarkRecordMetadataValidated: true;
  benchmarkRecordCount: number;
  benchmarkExecutionIncluded: false;
  benchmarkGoldenManifestBindingVerified: false;
  performanceThresholdDecisionIncluded: false;
  browserMatrixConfigurationDescriptorIncluded: true;
  realBrowserExecutionIncluded: false;
  windowsBrowserMeasurementEvidenceIncluded: false;
  browserResultArtifactsIncluded: false;
  dependencyLicensePolicyEvaluated: true;
  dependencyCount: number;
  licenseViolationCount: number;
  licenseAllowlistDiagnosticPassed: boolean;
  packageLockBindingVerified: false;
  licenseInventoryCompletenessVerified: false;
  licenseTextAuditIncluded: false;
  referenceImplementationSourceAuditIncluded: false;
  finalDependencyLicenseAuditIncluded: false;
  sourceProvenanceAuditIncluded: false;
  redistributionDecisionAuditIncluded: false;
  licenseInventoryArtifactPersisted: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  productRuntimeGuaranteeIncluded: false;
  scientificEvidenceIncluded: false;
  globalM0fGo: false;
  runtimeLimitsCandidate: RuntimeLimitsV1;
  benchmarkRecords: readonly BenchmarkRecord[];
  canonicalBenchmarkJsonl: readonly string[];
  browserMatrix: typeof M0F_BROWSER_WORKER_MATRIX_CANDIDATE_V1;
  performanceProbeCatalog: typeof M0F_PERFORMANCE_PROBE_CATALOG_V1;
  licensePolicy: Readonly<{
    allowlist: readonly string[];
    projectLicense: EvaluatedLicenseInventoryEntryV1;
    dependencies: readonly EvaluatedLicenseInventoryEntryV1[];
    violations: readonly EvaluatedLicenseInventoryEntryV1[];
  }>;
}>;

export type BrowserRuntimeLicenseCandidateFlowIssueV1 = Readonly<{
  stage: 'snapshot' | 'flow-input' | 'runtime-limits' | 'benchmark' | 'license-inventory';
  path: string;
  code: string;
  message: string;
}>;

export type BrowserRuntimeLicenseCandidateFlowEvaluationV1 =
  | Readonly<{ ok: true; value: BrowserRuntimeLicenseCandidateFlowResultV1 }>
  | Readonly<{ ok: false; error: readonly BrowserRuntimeLicenseCandidateFlowIssueV1[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'runtimeLimitsCandidate',
  'benchmarkRecords',
  'licenseInventory',
] as const;
const LICENSE_INVENTORY_KEYS = ['projectLicense', 'dependencies'] as const;
const LICENSE_ENTRY_KEYS = ['name', 'version', 'location', 'license'] as const;

export const BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_LIMITS = deepFreezeOwned({
  maxArrayLength: 4_096,
  maxContainerCount: 32_768,
  maxDepth: 12,
  maxObjectPropertyCount: 64,
  maxPropertyNameCodeUnits: 128,
  maxStringCodeUnits: 16_384,
  maxTotalStringCodeUnits: 8_388_608,
  maxTotalPropertyCount: 200_000,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issue(
  stage: BrowserRuntimeLicenseCandidateFlowIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): BrowserRuntimeLicenseCandidateFlowIssueV1 {
  return { stage, path, code, message };
}

function failure(
  error: readonly BrowserRuntimeLicenseCandidateFlowIssueV1[],
): BrowserRuntimeLicenseCandidateFlowEvaluationV1 {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function prefixedPath(prefix: string, path: string): string {
  if (path === '$') return prefix;
  return path.startsWith('$') ? `${prefix}${path.slice(1)}` : `${prefix}.${path}`;
}

function exactKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  stage: BrowserRuntimeLicenseCandidateFlowIssueV1['stage'],
): BrowserRuntimeLicenseCandidateFlowIssueV1[] {
  const issues: BrowserRuntimeLicenseCandidateFlowIssueV1[] = [];
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key))
      issues.push(issue(stage, `${path}.${key}`, 'unknown-field', 'field is not declared'));
  }
  for (const key of allowedKeys) {
    if (!Object.hasOwn(value, key))
      issues.push(issue(stage, `${path}.${key}`, 'missing-field', 'required field is missing'));
  }
  return issues;
}

function validateRoot(raw: Record<string, unknown>): BrowserRuntimeLicenseCandidateFlowIssueV1[] {
  const issues = exactKeys(raw, ROOT_KEYS, '$', 'flow-input');
  if (raw.schemaVersion !== 1)
    issues.push(issue('flow-input', '$.schemaVersion', 'invalid-literal', 'must equal 1'));
  if (raw.recordType !== BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_INPUT_RECORD_TYPE) {
    issues.push(
      issue(
        'flow-input',
        '$.recordType',
        'invalid-literal',
        `must equal ${BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_INPUT_RECORD_TYPE}`,
      ),
    );
  }
  if (raw.contractStatus !== 'candidate')
    issues.push(issue('flow-input', '$.contractStatus', 'claim-boundary', 'must remain candidate'));
  if (raw.scientificClaim !== false)
    issues.push(issue('flow-input', '$.scientificClaim', 'claim-boundary', 'must remain false'));
  return issues;
}

function validateLicenseEntry(
  supplied: unknown,
  path: string,
  project: boolean,
): Readonly<
  | { ok: true; value: EvaluatedLicenseInventoryEntryV1 }
  | { ok: false; error: readonly BrowserRuntimeLicenseCandidateFlowIssueV1[] }
> {
  if (!isRecord(supplied)) {
    return {
      ok: false,
      error: [issue('license-inventory', path, 'invalid-object', 'must be an object')],
    };
  }
  const issues = exactKeys(supplied, LICENSE_ENTRY_KEYS, path, 'license-inventory');
  for (const key of ['name', 'version'] as const) {
    if (typeof supplied[key] !== 'string' || supplied[key].trim().length === 0) {
      issues.push(
        issue('license-inventory', `${path}.${key}`, 'invalid-string', 'must be non-empty'),
      );
    }
  }
  if (
    typeof supplied.location !== 'string' ||
    (project ? supplied.location !== '' : supplied.location.length === 0)
  ) {
    issues.push(
      issue(
        'license-inventory',
        `${path}.location`,
        'invalid-location',
        project ? 'project location must be empty' : 'dependency location must be non-empty',
      ),
    );
  }
  if (supplied.license !== null && typeof supplied.license !== 'string') {
    issues.push(
      issue('license-inventory', `${path}.license`, 'invalid-license', 'must be string or null'),
    );
  }
  if (issues.length > 0) return { ok: false, error: issues };
  const evaluation = evaluateLicense(supplied.license);
  return {
    ok: true,
    value: {
      name: supplied.name as string,
      version: supplied.version as string,
      location: supplied.location as string,
      license: supplied.license as string | null,
      allowed: evaluation.allowed,
      identifiers: [...evaluation.identifiers],
      reason: evaluation.reason,
    },
  };
}

function compareLicenseEntries(
  left: EvaluatedLicenseInventoryEntryV1,
  right: EvaluatedLicenseInventoryEntryV1,
): number {
  const leftKey = `${left.name}\u0000${left.version}\u0000${left.location}`;
  const rightKey = `${right.name}\u0000${right.version}\u0000${right.location}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

/**
 * Validates existing candidate metadata and configuration descriptors. It does
 * not execute Vitest bench, Playwright, persist a license report, or freeze a
 * measured runtime profile.
 */
export function evaluateBrowserRuntimeLicenseCandidateFlowV1(
  supplied: unknown,
): BrowserRuntimeLicenseCandidateFlowEvaluationV1 {
  const snapshot = tryCreateStrictValidationSnapshot(
    supplied,
    BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_LIMITS,
  );
  if (!snapshot.ok) {
    return failure([
      issue(
        'snapshot',
        '$',
        'invalid-snapshot',
        'input must be one bounded acyclic accessor-free plain snapshot',
      ),
    ]);
  }
  if (!isRecord(snapshot.value))
    return failure([issue('flow-input', '$', 'invalid-object', 'flow input must be an object')]);
  const rootIssues = validateRoot(snapshot.value);
  if (rootIssues.length > 0) return failure(rootIssues);

  const runtime = parseRuntimeLimitsV1(snapshot.value.runtimeLimitsCandidate);
  if (!runtime.ok) {
    return failure(
      runtime.error.map((entry) =>
        issue(
          'runtime-limits',
          prefixedPath('$.runtimeLimitsCandidate', entry.path),
          entry.code,
          entry.message,
        ),
      ),
    );
  }
  if (
    runtime.value.status !== 'candidate' ||
    runtime.value.profileHash !== null ||
    RUNTIME_LIMIT_KEYS.some((key) => {
      const limit = runtime.value.limits[key];
      return (
        limit.selected !== null ||
        limit.measurementStatus !== 'pending' ||
        limit.measurementRef !== null
      );
    })
  ) {
    return failure([
      issue(
        'runtime-limits',
        '$.runtimeLimitsCandidate',
        'claim-boundary',
        'this diagnostic accepts only the unselected, pending candidate runtime profile',
      ),
    ]);
  }

  if (
    !Array.isArray(snapshot.value.benchmarkRecords) ||
    snapshot.value.benchmarkRecords.length === 0
  ) {
    return failure([
      issue('benchmark', '$.benchmarkRecords', 'invalid-array', 'must contain at least one record'),
    ]);
  }
  if (snapshot.value.benchmarkRecords.length > 16) {
    return failure([
      issue('benchmark', '$.benchmarkRecords', 'limit-exceeded', 'must contain at most 16 records'),
    ]);
  }
  const benchmarkRecords: BenchmarkRecord[] = [];
  const benchmarkIssues: BrowserRuntimeLicenseCandidateFlowIssueV1[] = [];
  snapshot.value.benchmarkRecords.forEach((record, index) => {
    const validated = validateBenchmarkRecord(record);
    if (validated.record === undefined) {
      benchmarkIssues.push(
        ...validated.issues.map((entry) =>
          issue(
            'benchmark',
            prefixedPath(`$.benchmarkRecords[${String(index)}]`, entry.path),
            entry.code,
            entry.message,
          ),
        ),
      );
      return;
    }
    if (
      validated.record.scientificClaim ||
      validated.record.outcome === 'verified' ||
      validated.record.outcome === 'no-solution-certified' ||
      validated.record.versions.supportProfileId !== null ||
      validated.record.versions.toleranceProfileId !== null
    ) {
      benchmarkIssues.push(
        issue(
          'benchmark',
          `$.benchmarkRecords[${String(index)}]`,
          'claim-boundary',
          'candidate diagnostic records cannot carry scientific terminal or profile claims',
        ),
      );
      return;
    }
    benchmarkRecords.push(validated.record);
  });
  if (benchmarkIssues.length > 0) return failure(benchmarkIssues);

  if (!isRecord(snapshot.value.licenseInventory)) {
    return failure([
      issue('license-inventory', '$.licenseInventory', 'invalid-object', 'must be an object'),
    ]);
  }
  const inventoryIssues = exactKeys(
    snapshot.value.licenseInventory,
    LICENSE_INVENTORY_KEYS,
    '$.licenseInventory',
    'license-inventory',
  );
  const project = validateLicenseEntry(
    snapshot.value.licenseInventory.projectLicense,
    '$.licenseInventory.projectLicense',
    true,
  );
  if (!project.ok) inventoryIssues.push(...project.error);
  const dependenciesRaw = snapshot.value.licenseInventory.dependencies;
  const dependencies: EvaluatedLicenseInventoryEntryV1[] = [];
  if (!Array.isArray(dependenciesRaw) || dependenciesRaw.length === 0) {
    inventoryIssues.push(
      issue(
        'license-inventory',
        '$.licenseInventory.dependencies',
        'invalid-array',
        'must contain at least one dependency',
      ),
    );
  } else {
    const locations = new Set<string>();
    dependenciesRaw.forEach((entry, index) => {
      const evaluated = validateLicenseEntry(
        entry,
        `$.licenseInventory.dependencies[${String(index)}]`,
        false,
      );
      if (!evaluated.ok) {
        inventoryIssues.push(...evaluated.error);
        return;
      }
      if (locations.has(evaluated.value.location)) {
        inventoryIssues.push(
          issue(
            'license-inventory',
            `$.licenseInventory.dependencies[${String(index)}].location`,
            'duplicate-location',
            'dependency locations must be unique',
          ),
        );
        return;
      }
      locations.add(evaluated.value.location);
      dependencies.push(evaluated.value);
    });
  }
  if (inventoryIssues.length > 0 || !project.ok) return failure(inventoryIssues);
  dependencies.sort(compareLicenseEntries);
  const violations = [project.value, ...dependencies].filter((entry) => !entry.allowed);

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: BROWSER_RUNTIME_LICENSE_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      outputKind: 'runtime-performance-license-readiness-diagnostic-not-final-evidence' as const,
      scope: 'candidate-runtime-benchmark-browser-matrix-and-license-policy-metadata-only' as const,
      runtimeCandidateProfileParsed: true as const,
      runtimeLimitCandidateCount: 18 as const,
      selectedRuntimeLimitCount: 0 as const,
      measuredRuntimeLimitCount: 0 as const,
      measuredFrozenRuntimeLimitsIncluded: false as const,
      runtimeSupportClaim: false as const,
      benchmarkRecordMetadataValidated: true as const,
      benchmarkRecordCount: benchmarkRecords.length,
      benchmarkExecutionIncluded: false as const,
      benchmarkGoldenManifestBindingVerified: false as const,
      performanceThresholdDecisionIncluded: false as const,
      browserMatrixConfigurationDescriptorIncluded: true as const,
      realBrowserExecutionIncluded: false as const,
      windowsBrowserMeasurementEvidenceIncluded: false as const,
      browserResultArtifactsIncluded: false as const,
      dependencyLicensePolicyEvaluated: true as const,
      dependencyCount: dependencies.length,
      licenseViolationCount: violations.length,
      licenseAllowlistDiagnosticPassed: violations.length === 0,
      packageLockBindingVerified: false as const,
      licenseInventoryCompletenessVerified: false as const,
      licenseTextAuditIncluded: false as const,
      referenceImplementationSourceAuditIncluded: false as const,
      finalDependencyLicenseAuditIncluded: false as const,
      sourceProvenanceAuditIncluded: false as const,
      redistributionDecisionAuditIncluded: false as const,
      licenseInventoryArtifactPersisted: false as const,
      supportProfileIncluded: false as const,
      toleranceProfileIncluded: false as const,
      productRuntimeGuaranteeIncluded: false as const,
      scientificEvidenceIncluded: false as const,
      globalM0fGo: false as const,
      runtimeLimitsCandidate: runtime.value,
      benchmarkRecords,
      canonicalBenchmarkJsonl: benchmarkRecords.map((record) => serializeBenchmarkRecord(record)),
      browserMatrix: M0F_BROWSER_WORKER_MATRIX_CANDIDATE_V1,
      performanceProbeCatalog: M0F_PERFORMANCE_PROBE_CATALOG_V1,
      licensePolicy: {
        allowlist: [...ALLOWED_LICENSE_IDS],
        projectLicense: project.value,
        dependencies,
        violations,
      },
    },
  });
}
