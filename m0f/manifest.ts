import { createHash } from 'node:crypto';
import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';

import { serializeBenchmarkRecord, validateBenchmarkRecord } from './benchmark.js';
import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import {
  FIXTURE_COVERAGE_TAGS,
  HARNESS_SMOKE_FIXTURE_ID,
  auditCanonicalFixtureIds,
  findCanonicalFixtureRule,
  type FixtureCoverageTag,
} from './canonical-fixtures.js';
import { stableStringify } from './stable-json.js';

export const ALLOWED_SPDX_IDS = [
  'MIT',
  '0BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  'ISC',
] as const;
export type AllowedSpdxId = (typeof ALLOWED_SPDX_IDS)[number];

export { FIXTURE_COVERAGE_TAGS, type FixtureCoverageTag };

export type FixtureManifestCompleteness = 'harness' | 'm0f';
export type FixtureWorkflow =
  | 'generation-tree'
  | 'generation-box-pleating'
  | 'fold-verification'
  | 'reference-verification'
  | 'harness';
export type FixturePolarity = 'positive' | 'negative' | 'boundary' | 'harness';

export type ExpectedOutcome =
  | Readonly<{ kind: 'verified'; checks: readonly string[] }>
  | Readonly<{ kind: 'no-solution-certified'; reasonCode: string; checkerId: string }>
  | Readonly<{ kind: 'invalid' | 'unsupported' | 'rejected'; reasonCode: string }>
  | Readonly<{ kind: 'harness-only'; checks: readonly string[] }>;

export type FixtureSourceReference = Readonly<{
  sourceId: string;
  sourceKind: 'project-authored' | 'publication' | 'external' | 'generated';
  title: string;
  authors: readonly string[];
  rights:
    | Readonly<{ redistribution: 'allowed'; licenseSpdx: AllowedSpdxId }>
    | Readonly<{
        redistribution: 'metadata-only';
        status: 'restricted' | 'unknown';
        termsUrl?: string;
      }>;
  sourceUrl?: string;
  sourceSha256?: string;
  acquisitionInstructions?: string;
}>;

export type DistributedArtifact = Readonly<{
  artifactId: string;
  artifactKind:
    'input' | 'readme' | 'known-artifact' | 'benchmark-record' | 'benchmark-golden-jsonl';
  path: string;
  sha256: string;
  licenseSpdx: AllowedSpdxId;
  sourceReferenceId: string;
  sourceUse: 'project-authored' | 'redistributed-source' | 'generated' | 'independent-equivalent';
}>;

export const KNOWN_ARTIFACT_KINDS = [
  'expectation',
  'known-solution',
  'crease-pattern',
  'target-state',
  'path-certificate',
  'no-solution-certificate',
  'collision-certificate',
  'contact-events',
  'layer-order',
  'evidence-blob',
] as const;
export type KnownArtifactKind = (typeof KNOWN_ARTIFACT_KINDS)[number];

export type FixtureManifestEntry = Readonly<{
  id: string;
  title: string;
  purpose: string;
  workflow: FixtureWorkflow;
  polarity: FixturePolarity;
  leafCount: number | null;
  coverageTags: readonly FixtureCoverageTag[];
  input: Readonly<{ artifactId: string; normalizedSha256: string }>;
  readme: Readonly<{ artifactId: string }>;
  expectedOutcome: ExpectedOutcome;
  sourceReferences: readonly FixtureSourceReference[];
  distributedArtifacts: readonly DistributedArtifact[];
  randomness: Readonly<{ seed: number; generatorVersion: string }> | null;
  toleranceProfileId: string | null;
  knownArtifacts: readonly Readonly<{ kind: KnownArtifactKind; artifactId: string }>[];
  benchmark?: Readonly<{ recordArtifactId: string; goldenJsonlArtifactId: string }>;
}>;

export type FixtureManifest = Readonly<{
  schemaVersion: 2;
  fixtureSetId: string;
  completeness: FixtureManifestCompleteness;
  fixtures: readonly FixtureManifestEntry[];
}>;

export type FixtureValidationIssue = Readonly<{
  severity: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
  fixtureId?: string;
  canonicalPattern?: string;
}>;

export type FixtureManifestParseResult = Readonly<{
  manifest?: FixtureManifest;
  issues: readonly FixtureValidationIssue[];
}>;

export type FixtureRepositoryValidationResult = Readonly<{
  manifestPath: string;
  manifest?: FixtureManifest;
  issues: readonly FixtureValidationIssue[];
}>;

const ROOT_KEYS = ['schemaVersion', 'fixtureSetId', 'completeness', 'fixtures'] as const;
const ENTRY_KEYS = [
  'id',
  'title',
  'purpose',
  'workflow',
  'polarity',
  'leafCount',
  'coverageTags',
  'input',
  'readme',
  'expectedOutcome',
  'sourceReferences',
  'distributedArtifacts',
  'randomness',
  'toleranceProfileId',
  'knownArtifacts',
  'benchmark',
] as const;
const REQUIRED_ENTRY_KEYS = ENTRY_KEYS.filter((key) => key !== 'benchmark');
const INPUT_KEYS = ['artifactId', 'normalizedSha256'] as const;
const README_KEYS = ['artifactId'] as const;
const SOURCE_KEYS = [
  'sourceId',
  'sourceKind',
  'title',
  'authors',
  'rights',
  'sourceUrl',
  'sourceSha256',
  'acquisitionInstructions',
] as const;
const REQUIRED_SOURCE_KEYS = SOURCE_KEYS.filter(
  (key) => key !== 'sourceUrl' && key !== 'sourceSha256' && key !== 'acquisitionInstructions',
);
const DISTRIBUTED_ARTIFACT_KEYS = [
  'artifactId',
  'artifactKind',
  'path',
  'sha256',
  'licenseSpdx',
  'sourceReferenceId',
  'sourceUse',
] as const;
const RANDOMNESS_KEYS = ['seed', 'generatorVersion'] as const;
const KNOWN_ARTIFACT_KEYS = ['kind', 'artifactId'] as const;
const BENCHMARK_KEYS = ['recordArtifactId', 'goldenJsonlArtifactId'] as const;
const WORKFLOWS: readonly FixtureWorkflow[] = [
  'generation-tree',
  'generation-box-pleating',
  'fold-verification',
  'reference-verification',
  'harness',
];
const POLARITIES: readonly FixturePolarity[] = ['positive', 'negative', 'boundary', 'harness'];
const SCIENTIFIC_OUTCOMES = [
  'verified',
  'no-solution-certified',
  'invalid',
  'unsupported',
  'rejected',
] as const;
const ARTIFACT_KINDS: readonly DistributedArtifact['artifactKind'][] = [
  'input',
  'readme',
  'known-artifact',
  'benchmark-record',
  'benchmark-golden-jsonl',
];
const SOURCE_USES: readonly DistributedArtifact['sourceUse'][] = [
  'project-authored',
  'redistributed-source',
  'generated',
  'independent-equivalent',
];
const ALLOWED_RIGHTS_KEYS = ['redistribution', 'licenseSpdx'] as const;
const METADATA_RIGHTS_KEYS = ['redistribution', 'status', 'termsUrl'] as const;
const REQUIRED_METADATA_RIGHTS_KEYS = ['redistribution', 'status'] as const;
const HARNESS_COVERAGE_TAGS: readonly FixtureCoverageTag[] = [
  'harness:manifest-runtime',
  'harness:hashes',
  'harness:jsonl',
  'harness:cli',
];
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const FIXTURE_ID_PATTERN = /^(?:_harness-smoke|[A-Z0-9][A-Z0-9-]*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addIssue(
  issues: FixtureValidationIssue[],
  severity: 'error' | 'warning',
  code: string,
  message: string,
  path?: string,
  fixtureId?: string,
): void {
  const issue: {
    severity: 'error' | 'warning';
    code: string;
    message: string;
    path?: string;
    fixtureId?: string;
  } = { severity, code, message };
  if (path !== undefined) issue.path = path;
  if (fixtureId !== undefined) issue.fixtureId = fixtureId;
  issues.push(issue);
}

function validateKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[],
  path: string,
  issues: FixtureValidationIssue[],
  fixtureId?: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      addIssue(
        issues,
        'error',
        'unknown-field',
        'field is not declared by manifest schema version 2',
        `${path}.${key}`,
        fixtureId,
      );
    }
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) {
      addIssue(
        issues,
        'error',
        'missing-field',
        'required field is missing',
        `${path}.${key}`,
        fixtureId,
      );
    }
  }
}

function validateString(
  value: unknown,
  path: string,
  issues: FixtureValidationIssue[],
  fixtureId?: string,
): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    addIssue(issues, 'error', 'invalid-string', 'must be a non-empty string', path, fixtureId);
    return false;
  }
  return true;
}

function validateId(
  value: unknown,
  path: string,
  issues: FixtureValidationIssue[],
  fixtureId?: string,
): value is string {
  if (!validateString(value, path, issues, fixtureId)) return false;
  if (!ID_PATTERN.test(value)) {
    addIssue(issues, 'error', 'invalid-id', 'must be a stable ASCII identifier', path, fixtureId);
    return false;
  }
  return true;
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: FixtureValidationIssue[],
  fixtureId?: string,
): void {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, 'error', 'invalid-string-array', 'must be a non-empty array', path, fixtureId);
    return;
  }
  value.forEach((item, index) => validateString(item, `${path}[${index}]`, issues, fixtureId));
}

function validateSha256(
  value: unknown,
  path: string,
  issues: FixtureValidationIssue[],
  fixtureId?: string,
): void {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    addIssue(
      issues,
      'error',
      'invalid-sha256',
      'must use sha256:<64 lowercase hex digits>',
      path,
      fixtureId,
    );
  }
}

function validateSafePath(
  value: unknown,
  path: string,
  fixtureId: string,
  issues: FixtureValidationIssue[],
): void {
  if (!validateString(value, path, issues, fixtureId)) return;
  const components = value.split('/');
  const valid =
    !value.includes('\\') &&
    !value.startsWith('/') &&
    !value.endsWith('/') &&
    components.length >= 2 &&
    components[0] === fixtureId &&
    components.every((component) => component !== '' && component !== '.' && component !== '..');
  if (!valid) {
    addIssue(
      issues,
      'error',
      'unsafe-path',
      `must be a POSIX relative path rooted at ${fixtureId}/ without dot segments`,
      path,
      fixtureId,
    );
  }
}

function validateHttpUrl(
  value: unknown,
  path: string,
  issues: FixtureValidationIssue[],
  fixtureId: string,
): void {
  if (!validateString(value, path, issues, fixtureId)) return;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('protocol');
  } catch {
    addIssue(issues, 'error', 'invalid-url', 'must be an HTTP(S) URL', path, fixtureId);
  }
}

function validateExpectedOutcome(
  value: unknown,
  path: string,
  issues: FixtureValidationIssue[],
  fixtureId: string,
): void {
  if (!isRecord(value)) {
    addIssue(issues, 'error', 'invalid-object', 'must be an object', path, fixtureId);
    return;
  }
  if (typeof value.kind !== 'string') {
    addIssue(
      issues,
      'error',
      'invalid-outcome',
      'kind must be a supported outcome',
      `${path}.kind`,
      fixtureId,
    );
    return;
  }
  if (value.kind === 'verified' || value.kind === 'harness-only') {
    validateKeys(value, ['kind', 'checks'], ['kind', 'checks'], path, issues, fixtureId);
    validateStringArray(value.checks, `${path}.checks`, issues, fixtureId);
  } else if (value.kind === 'no-solution-certified') {
    validateKeys(
      value,
      ['kind', 'reasonCode', 'checkerId'],
      ['kind', 'reasonCode', 'checkerId'],
      path,
      issues,
      fixtureId,
    );
    validateString(value.reasonCode, `${path}.reasonCode`, issues, fixtureId);
    validateString(value.checkerId, `${path}.checkerId`, issues, fixtureId);
  } else if ((SCIENTIFIC_OUTCOMES as readonly string[]).includes(value.kind)) {
    validateKeys(value, ['kind', 'reasonCode'], ['kind', 'reasonCode'], path, issues, fixtureId);
    validateString(value.reasonCode, `${path}.reasonCode`, issues, fixtureId);
  } else {
    addIssue(
      issues,
      'error',
      'invalid-outcome',
      'kind is not a supported expected outcome',
      `${path}.kind`,
      fixtureId,
    );
  }
}

function validateCoverageTags(
  value: unknown,
  path: string,
  issues: FixtureValidationIssue[],
  fixtureId: string,
): void {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(
      issues,
      'error',
      'invalid-coverage-tags',
      'must be a non-empty array',
      path,
      fixtureId,
    );
    return;
  }
  const seen = new Set<string>();
  value.forEach((tag, index) => {
    const tagPath = `${path}[${index}]`;
    if (typeof tag !== 'string' || !(FIXTURE_COVERAGE_TAGS as readonly string[]).includes(tag)) {
      addIssue(
        issues,
        'error',
        'invalid-coverage-tag',
        'tag is not in the fixed coverage tag catalog',
        tagPath,
        fixtureId,
      );
    } else if (seen.has(tag)) {
      addIssue(
        issues,
        'error',
        'duplicate-coverage-tag',
        'coverage tags must be unique',
        tagPath,
        fixtureId,
      );
    } else {
      seen.add(tag);
    }
  });
}

function sourceRedistribution(source: Record<string, unknown>): string | undefined {
  return isRecord(source.rights) && typeof source.rights.redistribution === 'string'
    ? source.rights.redistribution
    : undefined;
}

function sourceAllowedLicense(source: Record<string, unknown>): string | undefined {
  return isRecord(source.rights) &&
    source.rights.redistribution === 'allowed' &&
    typeof source.rights.licenseSpdx === 'string'
    ? source.rights.licenseSpdx
    : undefined;
}

function validateSourceRights(
  value: unknown,
  path: string,
  issues: FixtureValidationIssue[],
  fixtureId: string,
): 'allowed' | 'metadata-only' | undefined {
  if (!isRecord(value)) {
    addIssue(issues, 'error', 'invalid-object', 'rights must be an object', path, fixtureId);
    return undefined;
  }
  if (value.redistribution === 'allowed') {
    validateKeys(value, ALLOWED_RIGHTS_KEYS, ALLOWED_RIGHTS_KEYS, path, issues, fixtureId);
    if (
      typeof value.licenseSpdx !== 'string' ||
      !(ALLOWED_SPDX_IDS as readonly string[]).includes(value.licenseSpdx)
    )
      addIssue(
        issues,
        'error',
        'unapproved-spdx',
        `must be one of: ${ALLOWED_SPDX_IDS.join(', ')}`,
        `${path}.licenseSpdx`,
        fixtureId,
      );
    return 'allowed';
  }
  if (value.redistribution === 'metadata-only') {
    validateKeys(
      value,
      METADATA_RIGHTS_KEYS,
      REQUIRED_METADATA_RIGHTS_KEYS,
      path,
      issues,
      fixtureId,
    );
    if (value.status !== 'restricted' && value.status !== 'unknown')
      addIssue(
        issues,
        'error',
        'invalid-enum',
        'metadata-only status must be restricted or unknown',
        `${path}.status`,
        fixtureId,
      );
    if (value.termsUrl !== undefined)
      validateHttpUrl(value.termsUrl, `${path}.termsUrl`, issues, fixtureId);
    return 'metadata-only';
  }
  addIssue(
    issues,
    'error',
    'invalid-enum',
    'redistribution must be allowed or metadata-only',
    `${path}.redistribution`,
    fixtureId,
  );
  return undefined;
}

function validateSourceReferences(
  value: unknown,
  path: string,
  issues: FixtureValidationIssue[],
  fixtureId: string,
): Map<string, Record<string, unknown>> {
  const sources = new Map<string, Record<string, unknown>>();
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, 'error', 'invalid-array', 'must be a non-empty array', path, fixtureId);
    return sources;
  }
  value.forEach((source, index) => {
    const sourcePath = `${path}[${index}]`;
    if (!isRecord(source)) {
      addIssue(issues, 'error', 'invalid-object', 'must be an object', sourcePath, fixtureId);
      return;
    }
    validateKeys(source, SOURCE_KEYS, REQUIRED_SOURCE_KEYS, sourcePath, issues, fixtureId);
    if (validateId(source.sourceId, `${sourcePath}.sourceId`, issues, fixtureId)) {
      if (sources.has(source.sourceId)) {
        addIssue(
          issues,
          'error',
          'duplicate-source-id',
          'sourceId must be unique within the fixture',
          `${sourcePath}.sourceId`,
          fixtureId,
        );
      } else {
        sources.set(source.sourceId, source);
      }
    }
    if (
      typeof source.sourceKind !== 'string' ||
      !['project-authored', 'publication', 'external', 'generated'].includes(source.sourceKind)
    ) {
      addIssue(
        issues,
        'error',
        'invalid-enum',
        'invalid sourceKind',
        `${sourcePath}.sourceKind`,
        fixtureId,
      );
    }
    validateString(source.title, `${sourcePath}.title`, issues, fixtureId);
    validateStringArray(source.authors, `${sourcePath}.authors`, issues, fixtureId);
    const redistribution = validateSourceRights(
      source.rights,
      `${sourcePath}.rights`,
      issues,
      fixtureId,
    );
    if (source.sourceUrl !== undefined)
      validateHttpUrl(source.sourceUrl, `${sourcePath}.sourceUrl`, issues, fixtureId);
    if (source.sourceSha256 !== undefined)
      validateSha256(source.sourceSha256, `${sourcePath}.sourceSha256`, issues, fixtureId);
    if (source.acquisitionInstructions !== undefined) {
      validateString(
        source.acquisitionInstructions,
        `${sourcePath}.acquisitionInstructions`,
        issues,
        fixtureId,
      );
    }
    if (redistribution === 'metadata-only') {
      if (source.sourceUrl === undefined)
        addIssue(
          issues,
          'error',
          'metadata-only-incomplete',
          'metadata-only sources require sourceUrl',
          `${sourcePath}.sourceUrl`,
          fixtureId,
        );
      if (source.sourceSha256 === undefined)
        addIssue(
          issues,
          'error',
          'metadata-only-incomplete',
          'metadata-only sources require sourceSha256',
          `${sourcePath}.sourceSha256`,
          fixtureId,
        );
      if (source.acquisitionInstructions === undefined)
        addIssue(
          issues,
          'error',
          'metadata-only-incomplete',
          'metadata-only sources require acquisitionInstructions',
          `${sourcePath}.acquisitionInstructions`,
          fixtureId,
        );
    }
  });
  return sources;
}

function validateDistributedArtifacts(
  value: unknown,
  path: string,
  sources: ReadonlyMap<string, Record<string, unknown>>,
  issues: FixtureValidationIssue[],
  fixtureId: string,
): Map<string, Record<string, unknown>> {
  const artifacts = new Map<string, Record<string, unknown>>();
  const paths = new Set<string>();
  const referencedSources = new Set<string>();
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, 'error', 'invalid-array', 'must be a non-empty array', path, fixtureId);
    return artifacts;
  }
  value.forEach((artifact, index) => {
    const artifactPath = `${path}[${index}]`;
    if (!isRecord(artifact)) {
      addIssue(issues, 'error', 'invalid-object', 'must be an object', artifactPath, fixtureId);
      return;
    }
    validateKeys(
      artifact,
      DISTRIBUTED_ARTIFACT_KEYS,
      DISTRIBUTED_ARTIFACT_KEYS,
      artifactPath,
      issues,
      fixtureId,
    );
    if (validateId(artifact.artifactId, `${artifactPath}.artifactId`, issues, fixtureId)) {
      if (artifacts.has(artifact.artifactId))
        addIssue(
          issues,
          'error',
          'duplicate-artifact-id',
          'artifactId must be unique within the fixture',
          `${artifactPath}.artifactId`,
          fixtureId,
        );
      else artifacts.set(artifact.artifactId, artifact);
    }
    if (
      typeof artifact.artifactKind !== 'string' ||
      !ARTIFACT_KINDS.includes(artifact.artifactKind as DistributedArtifact['artifactKind'])
    ) {
      addIssue(
        issues,
        'error',
        'invalid-enum',
        `must be one of: ${ARTIFACT_KINDS.join(', ')}`,
        `${artifactPath}.artifactKind`,
        fixtureId,
      );
    }
    validateSafePath(artifact.path, `${artifactPath}.path`, fixtureId, issues);
    if (typeof artifact.path === 'string') {
      if (paths.has(artifact.path))
        addIssue(
          issues,
          'error',
          'duplicate-artifact-path',
          'a distributed file may be registered only once',
          `${artifactPath}.path`,
          fixtureId,
        );
      else paths.add(artifact.path);
    }
    validateSha256(artifact.sha256, `${artifactPath}.sha256`, issues, fixtureId);
    if (
      typeof artifact.licenseSpdx !== 'string' ||
      !(ALLOWED_SPDX_IDS as readonly string[]).includes(artifact.licenseSpdx)
    )
      addIssue(
        issues,
        'error',
        'unapproved-spdx',
        `must be one of: ${ALLOWED_SPDX_IDS.join(', ')}`,
        `${artifactPath}.licenseSpdx`,
        fixtureId,
      );
    if (
      validateId(artifact.sourceReferenceId, `${artifactPath}.sourceReferenceId`, issues, fixtureId)
    ) {
      const source = sources.get(artifact.sourceReferenceId);
      if (source === undefined)
        addIssue(
          issues,
          'error',
          'missing-source-reference',
          'sourceReferenceId does not resolve',
          `${artifactPath}.sourceReferenceId`,
          fixtureId,
        );
      else {
        referencedSources.add(artifact.sourceReferenceId);
        const redistribution = sourceRedistribution(source);
        const sourceLicense = sourceAllowedLicense(source);
        if (redistribution === 'metadata-only' && artifact.sourceUse !== 'independent-equivalent')
          addIssue(
            issues,
            'error',
            'metadata-only-redistribution',
            'metadata-only sources may only identify independently authored equivalent fixtures',
            `${artifactPath}.sourceUse`,
            fixtureId,
          );
        if (
          artifact.sourceUse === 'project-authored' &&
          (source.sourceKind !== 'project-authored' || redistribution !== 'allowed')
        )
          addIssue(
            issues,
            'error',
            'source-use-mismatch',
            'project-authored artifacts require a redistributable project-authored source',
            `${artifactPath}.sourceUse`,
            fixtureId,
          );
        if (
          artifact.sourceUse === 'generated' &&
          (source.sourceKind !== 'generated' || redistribution !== 'allowed')
        )
          addIssue(
            issues,
            'error',
            'source-use-mismatch',
            'generated artifacts require a redistributable generated source',
            `${artifactPath}.sourceUse`,
            fixtureId,
          );
        if (
          artifact.sourceUse === 'independent-equivalent' &&
          source.sourceKind !== 'publication' &&
          source.sourceKind !== 'external'
        )
          addIssue(
            issues,
            'error',
            'source-use-mismatch',
            'independent equivalents must cite a publication or external source',
            `${artifactPath}.sourceUse`,
            fixtureId,
          );
        if (
          (artifact.sourceUse === 'project-authored' ||
            artifact.sourceUse === 'generated' ||
            artifact.sourceUse === 'redistributed-source') &&
          sourceLicense !== undefined &&
          artifact.licenseSpdx !== sourceLicense
        )
          addIssue(
            issues,
            'error',
            'artifact-license-mismatch',
            'distributed artifact license must match its redistributable source license',
            `${artifactPath}.licenseSpdx`,
            fixtureId,
          );
      }
    }
    if (
      typeof artifact.sourceUse !== 'string' ||
      !SOURCE_USES.includes(artifact.sourceUse as DistributedArtifact['sourceUse'])
    ) {
      addIssue(
        issues,
        'error',
        'invalid-enum',
        `must be one of: ${SOURCE_USES.join(', ')}`,
        `${artifactPath}.sourceUse`,
        fixtureId,
      );
    }
  });
  for (const sourceId of sources.keys()) {
    if (!referencedSources.has(sourceId))
      addIssue(
        issues,
        'error',
        'unreferenced-source',
        'every source reference must be used by a distributed artifact',
        path,
        fixtureId,
      );
  }
  return artifacts;
}

function validateArtifactPointer(
  artifactId: unknown,
  expectedKind: DistributedArtifact['artifactKind'],
  path: string,
  artifacts: ReadonlyMap<string, Record<string, unknown>>,
  pointerCounts: Map<string, number>,
  issues: FixtureValidationIssue[],
  fixtureId: string,
): void {
  if (!validateId(artifactId, path, issues, fixtureId)) return;
  pointerCounts.set(artifactId, (pointerCounts.get(artifactId) ?? 0) + 1);
  const artifact = artifacts.get(artifactId);
  if (artifact === undefined) {
    addIssue(
      issues,
      'error',
      'missing-artifact-reference',
      'artifactId does not resolve',
      path,
      fixtureId,
    );
  } else if (artifact.artifactKind !== expectedKind) {
    addIssue(
      issues,
      'error',
      'artifact-kind-mismatch',
      `referenced artifact must have kind ${expectedKind}`,
      path,
      fixtureId,
    );
  }
}

function validateFixtureEntry(
  value: unknown,
  index: number,
  issues: FixtureValidationIssue[],
): void {
  const path = `$.fixtures[${index}]`;
  if (!isRecord(value)) {
    addIssue(issues, 'error', 'invalid-object', 'fixture entry must be an object', path);
    return;
  }
  const fixtureId =
    typeof value.id === 'string' && value.id.trim() !== '' ? value.id : `<index:${index}>`;
  validateKeys(value, ENTRY_KEYS, REQUIRED_ENTRY_KEYS, path, issues, fixtureId);
  if (
    validateString(value.id, `${path}.id`, issues, fixtureId) &&
    !FIXTURE_ID_PATTERN.test(value.id)
  )
    addIssue(
      issues,
      'error',
      'invalid-fixture-id',
      'fixture ID must be _harness-smoke or canonical uppercase ASCII form',
      `${path}.id`,
      fixtureId,
    );
  validateString(value.title, `${path}.title`, issues, fixtureId);
  validateString(value.purpose, `${path}.purpose`, issues, fixtureId);
  if (typeof value.workflow !== 'string' || !WORKFLOWS.includes(value.workflow as FixtureWorkflow))
    addIssue(
      issues,
      'error',
      'invalid-enum',
      `must be one of: ${WORKFLOWS.join(', ')}`,
      `${path}.workflow`,
      fixtureId,
    );
  if (typeof value.polarity !== 'string' || !POLARITIES.includes(value.polarity as FixturePolarity))
    addIssue(
      issues,
      'error',
      'invalid-enum',
      `must be one of: ${POLARITIES.join(', ')}`,
      `${path}.polarity`,
      fixtureId,
    );
  if (
    value.leafCount !== null &&
    (typeof value.leafCount !== 'number' ||
      !Number.isInteger(value.leafCount) ||
      value.leafCount < 1 ||
      value.leafCount > 20)
  )
    addIssue(
      issues,
      'error',
      'invalid-leaf-count',
      'must be null or an integer from 1 through 20',
      `${path}.leafCount`,
      fixtureId,
    );
  validateCoverageTags(value.coverageTags, `${path}.coverageTags`, issues, fixtureId);
  if (typeof value.id === 'string' && Array.isArray(value.coverageTags)) {
    const canonicalRule = findCanonicalFixtureRule(value.id);
    if (canonicalRule !== undefined) {
      const declaredTags = new Set(
        value.coverageTags.filter((tag): tag is string => typeof tag === 'string'),
      );
      for (const requiredTag of canonicalRule.requiredCoverageTags) {
        if (!declaredTags.has(requiredTag))
          addIssue(
            issues,
            'error',
            'missing-required-coverage-tag',
            `${canonicalRule.pattern} requires coverage tag ${requiredTag}`,
            `${path}.coverageTags`,
            fixtureId,
          );
      }
    }
  }

  const sources = validateSourceReferences(
    value.sourceReferences,
    `${path}.sourceReferences`,
    issues,
    fixtureId,
  );
  const artifacts = validateDistributedArtifacts(
    value.distributedArtifacts,
    `${path}.distributedArtifacts`,
    sources,
    issues,
    fixtureId,
  );
  const pointerCounts = new Map<string, number>();

  if (!isRecord(value.input))
    addIssue(issues, 'error', 'invalid-object', 'must be an object', `${path}.input`, fixtureId);
  else {
    validateKeys(value.input, INPUT_KEYS, INPUT_KEYS, `${path}.input`, issues, fixtureId);
    validateArtifactPointer(
      value.input.artifactId,
      'input',
      `${path}.input.artifactId`,
      artifacts,
      pointerCounts,
      issues,
      fixtureId,
    );
    validateSha256(
      value.input.normalizedSha256,
      `${path}.input.normalizedSha256`,
      issues,
      fixtureId,
    );
  }
  if (!isRecord(value.readme))
    addIssue(issues, 'error', 'invalid-object', 'must be an object', `${path}.readme`, fixtureId);
  else {
    validateKeys(value.readme, README_KEYS, README_KEYS, `${path}.readme`, issues, fixtureId);
    validateArtifactPointer(
      value.readme.artifactId,
      'readme',
      `${path}.readme.artifactId`,
      artifacts,
      pointerCounts,
      issues,
      fixtureId,
    );
  }
  validateExpectedOutcome(value.expectedOutcome, `${path}.expectedOutcome`, issues, fixtureId);

  if (value.randomness !== null) {
    if (!isRecord(value.randomness))
      addIssue(
        issues,
        'error',
        'invalid-object',
        'must be null or an object',
        `${path}.randomness`,
        fixtureId,
      );
    else {
      validateKeys(
        value.randomness,
        RANDOMNESS_KEYS,
        RANDOMNESS_KEYS,
        `${path}.randomness`,
        issues,
        fixtureId,
      );
      if (
        typeof value.randomness.seed !== 'number' ||
        !Number.isSafeInteger(value.randomness.seed) ||
        value.randomness.seed < 0
      )
        addIssue(
          issues,
          'error',
          'invalid-seed',
          'must be a non-negative safe integer',
          `${path}.randomness.seed`,
          fixtureId,
        );
      validateString(
        value.randomness.generatorVersion,
        `${path}.randomness.generatorVersion`,
        issues,
        fixtureId,
      );
    }
  }
  if (value.toleranceProfileId !== null)
    validateString(value.toleranceProfileId, `${path}.toleranceProfileId`, issues, fixtureId);

  if (!Array.isArray(value.knownArtifacts))
    addIssue(
      issues,
      'error',
      'invalid-array',
      'must be an array',
      `${path}.knownArtifacts`,
      fixtureId,
    );
  else
    value.knownArtifacts.forEach((known, knownIndex) => {
      const knownPath = `${path}.knownArtifacts[${knownIndex}]`;
      if (!isRecord(known)) {
        addIssue(issues, 'error', 'invalid-object', 'must be an object', knownPath, fixtureId);
        return;
      }
      validateKeys(known, KNOWN_ARTIFACT_KEYS, KNOWN_ARTIFACT_KEYS, knownPath, issues, fixtureId);
      if (
        typeof known.kind !== 'string' ||
        !(KNOWN_ARTIFACT_KINDS as readonly string[]).includes(known.kind)
      )
        addIssue(
          issues,
          'error',
          'invalid-known-artifact-kind',
          `must be one of: ${KNOWN_ARTIFACT_KINDS.join(', ')}`,
          `${knownPath}.kind`,
          fixtureId,
        );
      validateArtifactPointer(
        known.artifactId,
        'known-artifact',
        `${knownPath}.artifactId`,
        artifacts,
        pointerCounts,
        issues,
        fixtureId,
      );
    });

  if (value.benchmark !== undefined) {
    if (!isRecord(value.benchmark))
      addIssue(
        issues,
        'error',
        'invalid-object',
        'must be an object',
        `${path}.benchmark`,
        fixtureId,
      );
    else {
      validateKeys(
        value.benchmark,
        BENCHMARK_KEYS,
        BENCHMARK_KEYS,
        `${path}.benchmark`,
        issues,
        fixtureId,
      );
      validateArtifactPointer(
        value.benchmark.recordArtifactId,
        'benchmark-record',
        `${path}.benchmark.recordArtifactId`,
        artifacts,
        pointerCounts,
        issues,
        fixtureId,
      );
      validateArtifactPointer(
        value.benchmark.goldenJsonlArtifactId,
        'benchmark-golden-jsonl',
        `${path}.benchmark.goldenJsonlArtifactId`,
        artifacts,
        pointerCounts,
        issues,
        fixtureId,
      );
    }
  }
  for (const artifactId of artifacts.keys()) {
    const count = pointerCounts.get(artifactId) ?? 0;
    if (count === 0)
      addIssue(
        issues,
        'error',
        'unreferenced-artifact',
        'every distributed artifact must be referenced by one semantic pointer',
        `${path}.distributedArtifacts`,
        fixtureId,
      );
    else if (count > 1)
      addIssue(
        issues,
        'error',
        'duplicate-artifact-pointer',
        'a distributed artifact may be referenced by only one semantic pointer',
        `${path}.distributedArtifacts`,
        fixtureId,
      );
  }

  const isSmoke = value.id === HARNESS_SMOKE_FIXTURE_ID;
  if (isSmoke) {
    if (value.workflow !== 'harness' || value.polarity !== 'harness')
      addIssue(
        issues,
        'error',
        'smoke-claim-violation',
        'reserved smoke fixture must use harness workflow and polarity',
        path,
        fixtureId,
      );
    if (!isRecord(value.expectedOutcome) || value.expectedOutcome.kind !== 'harness-only')
      addIssue(
        issues,
        'error',
        'smoke-claim-violation',
        'reserved smoke fixture must be harness-only',
        `${path}.expectedOutcome`,
        fixtureId,
      );
    if (value.toleranceProfileId !== null || value.randomness !== null)
      addIssue(
        issues,
        'error',
        'smoke-claim-violation',
        'reserved smoke fixture cannot claim tolerance or randomness evidence',
        path,
        fixtureId,
      );
    if (Array.isArray(value.knownArtifacts) && value.knownArtifacts.length !== 0)
      addIssue(
        issues,
        'error',
        'smoke-claim-violation',
        'reserved smoke fixture cannot have scientific artifacts',
        `${path}.knownArtifacts`,
        fixtureId,
      );
    const coverageSet = new Set(Array.isArray(value.coverageTags) ? value.coverageTags : []);
    if (
      coverageSet.size !== HARNESS_COVERAGE_TAGS.length ||
      !HARNESS_COVERAGE_TAGS.every((tag) => coverageSet.has(tag))
    )
      addIssue(
        issues,
        'error',
        'smoke-coverage-violation',
        'reserved smoke fixture requires exactly the four harness coverage tags',
        `${path}.coverageTags`,
        fixtureId,
      );
    const smokeSources = Array.isArray(value.sourceReferences) ? value.sourceReferences : [];
    if (
      smokeSources.length !== 1 ||
      !isRecord(smokeSources[0]) ||
      smokeSources[0].sourceKind !== 'project-authored' ||
      !isRecord(smokeSources[0].rights) ||
      smokeSources[0].rights.redistribution !== 'allowed' ||
      smokeSources[0].rights.licenseSpdx !== 'MIT'
    )
      addIssue(
        issues,
        'error',
        'smoke-provenance-violation',
        'reserved smoke fixture requires exactly one project-authored MIT source with redistribution allowed',
        `${path}.sourceReferences`,
        fixtureId,
      );
    if (
      Array.isArray(value.distributedArtifacts) &&
      value.distributedArtifacts.some(
        (artifact) =>
          !isRecord(artifact) ||
          artifact.sourceUse !== 'project-authored' ||
          artifact.licenseSpdx !== 'MIT',
      )
    )
      addIssue(
        issues,
        'error',
        'smoke-provenance-violation',
        'all smoke artifacts must be project-authored',
        `${path}.distributedArtifacts`,
        fixtureId,
      );
    if (!isRecord(value.benchmark))
      addIssue(
        issues,
        'error',
        'missing-smoke-benchmark',
        'reserved smoke fixture requires benchmark and golden JSONL artifacts',
        `${path}.benchmark`,
        fixtureId,
      );
  } else {
    if (value.workflow === 'harness' || value.polarity === 'harness')
      addIssue(
        issues,
        'error',
        'reserved-smoke-semantics',
        `harness workflow and polarity are reserved for ${HARNESS_SMOKE_FIXTURE_ID}`,
        path,
        fixtureId,
      );
    if (isRecord(value.expectedOutcome) && value.expectedOutcome.kind === 'harness-only')
      addIssue(
        issues,
        'error',
        'reserved-smoke-semantics',
        `harness-only is reserved for ${HARNESS_SMOKE_FIXTURE_ID}`,
        `${path}.expectedOutcome`,
        fixtureId,
      );
    if (
      Array.isArray(value.coverageTags) &&
      value.coverageTags.some((tag) => typeof tag === 'string' && tag.startsWith('harness:'))
    )
      addIssue(
        issues,
        'error',
        'reserved-smoke-semantics',
        'harness coverage tags are reserved for the smoke fixture',
        `${path}.coverageTags`,
        fixtureId,
      );
    if (value.toleranceProfileId === null)
      addIssue(
        issues,
        'error',
        'missing-tolerance-profile',
        'scientific fixtures require a tolerance profile ID',
        `${path}.toleranceProfileId`,
        fixtureId,
      );
  }
  if (
    (value.workflow === 'generation-tree' || value.workflow === 'generation-box-pleating') &&
    (typeof value.leafCount !== 'number' || value.leafCount < 2)
  )
    addIssue(
      issues,
      'error',
      'missing-leaf-count',
      'generation fixtures require 2..20 leaves',
      `${path}.leafCount`,
      fixtureId,
    );
  if (
    Array.isArray(value.sourceReferences) &&
    value.sourceReferences.some(
      (source) => isRecord(source) && source.sourceKind === 'generated',
    ) &&
    value.randomness === null
  )
    addIssue(
      issues,
      'error',
      'missing-randomness',
      'generated fixture sources require a seed and generator version',
      `${path}.randomness`,
      fixtureId,
    );
}

/** Validate the schema-v2 in-memory manifest without touching fixture files. */
export function parseFixtureManifest(supplied: unknown): FixtureManifestParseResult {
  const issues: FixtureValidationIssue[] = [];
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    addIssue(
      issues,
      'error',
      'invalid-object',
      'manifest must be one cloneable plain JSON-data snapshot',
      '$',
    );
    return { issues };
  }
  const value = snapshot.value;
  if (!isRecord(value)) {
    addIssue(issues, 'error', 'invalid-object', 'manifest must be an object', '$');
    return { issues };
  }
  validateKeys(value, ROOT_KEYS, ROOT_KEYS, '$', issues);
  if (value.schemaVersion !== 2)
    addIssue(
      issues,
      'error',
      'unsupported-schema',
      'schemaVersion must equal 2',
      '$.schemaVersion',
    );
  validateString(value.fixtureSetId, '$.fixtureSetId', issues);
  if (value.completeness !== 'harness' && value.completeness !== 'm0f')
    addIssue(issues, 'error', 'invalid-enum', 'must be harness or m0f', '$.completeness');
  if (!Array.isArray(value.fixtures) || value.fixtures.length === 0)
    addIssue(issues, 'error', 'invalid-array', 'fixtures must be a non-empty array', '$.fixtures');
  else value.fixtures.forEach((fixture, index) => validateFixtureEntry(fixture, index, issues));
  if (issues.some((issue) => issue.severity === 'error')) return { issues };
  const ownedManifest = deepFreezeOwned(value);
  return { manifest: ownedManifest as unknown as FixtureManifest, issues };
}

export function sha256Prefixed(data: string | Uint8Array): string {
  return `sha256:${createHash('sha256').update(data).digest('hex')}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function pathKey(path: string): string {
  return process.platform === 'win32' ? path.toLowerCase() : path;
}

function isInsideRoot(root: string, candidate: string): boolean {
  const normalizedRoot = pathKey(root);
  const normalizedCandidate = pathKey(candidate);
  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}${sep}`)
  );
}

async function readFixtureFile(
  fixtureRoot: string,
  realFixtureRoot: string,
  relativePath: string,
  issues: FixtureValidationIssue[],
  fixtureId: string,
  logicalPath: string,
): Promise<Uint8Array | undefined> {
  const absolutePath = resolve(fixtureRoot, relativePath);
  if (!isInsideRoot(fixtureRoot, absolutePath)) {
    addIssue(
      issues,
      'error',
      'path-escape',
      'resolved path escapes fixture root',
      logicalPath,
      fixtureId,
    );
    return undefined;
  }
  try {
    const stats = await lstat(absolutePath);
    if (stats.isSymbolicLink()) {
      addIssue(
        issues,
        'error',
        'symlink-or-reparse',
        'fixture artifacts cannot be symbolic links or reparse points',
        logicalPath,
        fixtureId,
      );
      return undefined;
    }
    if (!stats.isFile()) {
      addIssue(
        issues,
        'error',
        'not-regular-file',
        'registered artifact must be a regular file',
        logicalPath,
        fixtureId,
      );
      return undefined;
    }
    const canonicalPath = await realpath(absolutePath);
    if (!isInsideRoot(realFixtureRoot, canonicalPath)) {
      addIssue(
        issues,
        'error',
        'realpath-escape',
        'artifact realpath escapes fixture root',
        logicalPath,
        fixtureId,
      );
      return undefined;
    }
    if (pathKey(canonicalPath) !== pathKey(absolutePath)) {
      addIssue(
        issues,
        'error',
        'symlink-or-reparse',
        'artifact path traverses a symbolic link or reparse point',
        logicalPath,
        fixtureId,
      );
      return undefined;
    }
    return await readFile(canonicalPath);
  } catch (error) {
    addIssue(issues, 'error', 'file-read-error', errorMessage(error), logicalPath, fixtureId);
    return undefined;
  }
}

async function auditFixtureDirectory(
  fixtureRoot: string,
  realFixtureRoot: string,
  fixture: FixtureManifestEntry,
  fixtureIndex: number,
  issues: FixtureValidationIssue[],
): Promise<void> {
  const fixtureDirectory = resolve(fixtureRoot, fixture.id);
  const basePath = `$.fixtures[${fixtureIndex}].distributedArtifacts`;
  const actualFiles = new Set<string>();
  try {
    const fixtureStats = await lstat(fixtureDirectory);
    if (fixtureStats.isSymbolicLink() || !fixtureStats.isDirectory()) {
      addIssue(
        issues,
        'error',
        'symlink-or-reparse',
        'fixture directory must be a real directory, not a link or reparse point',
        basePath,
        fixture.id,
      );
      return;
    }
    const canonicalDirectory = await realpath(fixtureDirectory);
    if (!isInsideRoot(realFixtureRoot, canonicalDirectory)) {
      addIssue(
        issues,
        'error',
        'realpath-escape',
        'fixture directory realpath escapes fixture root',
        basePath,
        fixture.id,
      );
      return;
    }
    if (pathKey(canonicalDirectory) !== pathKey(fixtureDirectory)) {
      addIssue(
        issues,
        'error',
        'symlink-or-reparse',
        'fixture directory traverses a link or reparse point',
        basePath,
        fixture.id,
      );
      return;
    }

    const visit = async (directory: string): Promise<void> => {
      const entries = await readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        const absolute = resolve(directory, entry.name);
        const logical = relative(fixtureRoot, absolute).split(sep).join('/');
        const stats = await lstat(absolute);
        if (entry.isSymbolicLink() || stats.isSymbolicLink()) {
          addIssue(
            issues,
            'error',
            'symlink-or-reparse',
            'fixture directories cannot contain symbolic links or reparse points',
            basePath,
            fixture.id,
          );
        } else if (stats.isDirectory()) {
          const canonical = await realpath(absolute);
          if (!isInsideRoot(canonicalDirectory, canonical))
            addIssue(
              issues,
              'error',
              'realpath-escape',
              'directory realpath escapes the fixture directory',
              basePath,
              fixture.id,
            );
          else if (pathKey(canonical) !== pathKey(absolute))
            addIssue(
              issues,
              'error',
              'symlink-or-reparse',
              'directory traverses a link or reparse point',
              basePath,
              fixture.id,
            );
          else await visit(absolute);
        } else if (stats.isFile()) {
          const canonical = await realpath(absolute);
          if (!isInsideRoot(canonicalDirectory, canonical))
            addIssue(
              issues,
              'error',
              'realpath-escape',
              'file realpath escapes the fixture directory',
              basePath,
              fixture.id,
            );
          else if (pathKey(canonical) !== pathKey(absolute))
            addIssue(
              issues,
              'error',
              'symlink-or-reparse',
              'file traverses a link or reparse point',
              basePath,
              fixture.id,
            );
          else actualFiles.add(logical);
        } else {
          addIssue(
            issues,
            'error',
            'not-regular-file',
            `unsupported filesystem entry: ${logical}`,
            basePath,
            fixture.id,
          );
        }
      }
    };
    await visit(fixtureDirectory);
  } catch (error) {
    addIssue(
      issues,
      'error',
      'fixture-directory-read-error',
      errorMessage(error),
      basePath,
      fixture.id,
    );
    return;
  }

  const registered = new Map<string, number>();
  for (const artifact of fixture.distributedArtifacts)
    registered.set(artifact.path, (registered.get(artifact.path) ?? 0) + 1);
  for (const actualPath of actualFiles) {
    if ((registered.get(actualPath) ?? 0) === 0)
      addIssue(
        issues,
        'error',
        'unregistered-file',
        'every regular file under a fixture directory must be registered exactly once',
        basePath,
        fixture.id,
      );
  }
  for (const [registeredPath, count] of registered) {
    if (count !== 1)
      addIssue(
        issues,
        'error',
        'duplicate-artifact-path',
        `artifact path is registered ${count} times: ${registeredPath}`,
        basePath,
        fixture.id,
      );
    else if (!actualFiles.has(registeredPath))
      addIssue(
        issues,
        'error',
        'registered-file-missing',
        `registered artifact is not a regular file: ${registeredPath}`,
        basePath,
        fixture.id,
      );
  }
}

async function auditFixtureRoot(
  fixtureRoot: string,
  realFixtureRoot: string,
  absoluteManifestPath: string,
  manifest: FixtureManifest,
  issues: FixtureValidationIssue[],
): Promise<void> {
  const declaredDirectories = new Set(manifest.fixtures.map((fixture) => pathKey(fixture.id)));
  try {
    const entries = await readdir(fixtureRoot, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = resolve(fixtureRoot, entry.name);
      const stats = await lstat(absolutePath);
      const logicalPath = `$.fixtureRoot.${entry.name}`;
      if (entry.isSymbolicLink() || stats.isSymbolicLink()) {
        addIssue(
          issues,
          'error',
          'symlink-or-reparse',
          'fixture root cannot contain symbolic links or reparse points',
          logicalPath,
        );
        continue;
      }

      const canonicalPath = await realpath(absolutePath);
      if (!isInsideRoot(realFixtureRoot, canonicalPath)) {
        addIssue(
          issues,
          'error',
          'realpath-escape',
          'fixture-root entry resolves outside the fixture root',
          logicalPath,
        );
        continue;
      }
      if (pathKey(canonicalPath) !== pathKey(absolutePath)) {
        addIssue(
          issues,
          'error',
          'symlink-or-reparse',
          'fixture-root entry traverses a symbolic link or reparse point',
          logicalPath,
        );
        continue;
      }

      if (pathKey(absolutePath) === pathKey(absoluteManifestPath)) {
        if (!stats.isFile())
          addIssue(
            issues,
            'error',
            'not-regular-file',
            'fixture manifest must be a regular file',
            logicalPath,
          );
        continue;
      }
      if (stats.isDirectory() && declaredDirectories.has(pathKey(entry.name))) continue;

      addIssue(
        issues,
        'error',
        'unregistered-root-entry',
        'fixture root may contain only its manifest and declared fixture directories',
        logicalPath,
      );
    }
  } catch (error) {
    addIssue(issues, 'error', 'fixture-root-read-error', errorMessage(error), '$.fixtureRoot');
  }
}

function artifactMap(fixture: FixtureManifestEntry): ReadonlyMap<string, DistributedArtifact> {
  return new Map(fixture.distributedArtifacts.map((artifact) => [artifact.artifactId, artifact]));
}

/**
 * Validate manifest structure, provenance, complete file registration, hashes,
 * benchmark records, and golden JSONL. No scientific algorithm is run here.
 */
export async function validateFixtureRepository(
  manifestPath: string,
  options: Readonly<{ completeness?: FixtureManifestCompleteness }> = {},
): Promise<FixtureRepositoryValidationResult> {
  const absoluteManifestPath = resolve(manifestPath);
  const fixtureRoot = dirname(absoluteManifestPath);
  const issues: FixtureValidationIssue[] = [];
  let document: unknown;
  try {
    document = JSON.parse(await readFile(absoluteManifestPath, 'utf8')) as unknown;
  } catch (error) {
    addIssue(issues, 'error', 'manifest-read-error', errorMessage(error), '$');
    return { manifestPath: absoluteManifestPath, issues };
  }
  const parsed = parseFixtureManifest(document);
  issues.push(...parsed.issues);
  if (parsed.manifest === undefined) return { manifestPath: absoluteManifestPath, issues };
  const manifest = parsed.manifest;
  const completeness = options.completeness ?? manifest.completeness;
  for (const canonicalIssue of auditCanonicalFixtureIds(
    manifest.fixtures.map((fixture) => fixture.id),
    completeness,
  ))
    issues.push({ ...canonicalIssue });

  let realFixtureRoot: string;
  try {
    realFixtureRoot = await realpath(fixtureRoot);
  } catch (error) {
    addIssue(issues, 'error', 'fixture-root-read-error', errorMessage(error), '$');
    return { manifestPath: absoluteManifestPath, manifest, issues };
  }

  await auditFixtureRoot(fixtureRoot, realFixtureRoot, absoluteManifestPath, manifest, issues);

  for (const [index, fixture] of manifest.fixtures.entries()) {
    const basePath = `$.fixtures[${index}]`;
    const artifacts = artifactMap(fixture);
    const bytesById = new Map<string, Uint8Array>();
    await auditFixtureDirectory(fixtureRoot, realFixtureRoot, fixture, index, issues);
    for (const [artifactIndex, artifact] of fixture.distributedArtifacts.entries()) {
      const bytes = await readFixtureFile(
        fixtureRoot,
        realFixtureRoot,
        artifact.path,
        issues,
        fixture.id,
        `${basePath}.distributedArtifacts[${artifactIndex}].path`,
      );
      if (bytes === undefined) continue;
      bytesById.set(artifact.artifactId, bytes);
      const actualHash = sha256Prefixed(bytes);
      if (actualHash !== artifact.sha256) {
        const code =
          artifact.artifactKind === 'input'
            ? 'raw-hash-mismatch'
            : artifact.artifactKind === 'known-artifact'
              ? 'artifact-hash-mismatch'
              : 'distributed-hash-mismatch';
        addIssue(
          issues,
          'error',
          code,
          `expected ${artifact.sha256}, received ${actualHash}`,
          `${basePath}.distributedArtifacts[${artifactIndex}].sha256`,
          fixture.id,
        );
      }
    }

    const inputArtifact = artifacts.get(fixture.input.artifactId);
    const inputBytes = bytesById.get(fixture.input.artifactId);
    if (inputArtifact !== undefined && inputBytes !== undefined) {
      try {
        const inputDocument = JSON.parse(Buffer.from(inputBytes).toString('utf8')) as unknown;
        const actualNormalizedHash = sha256Prefixed(stableStringify(inputDocument));
        if (actualNormalizedHash !== fixture.input.normalizedSha256)
          addIssue(
            issues,
            'error',
            'normalized-hash-mismatch',
            `expected ${fixture.input.normalizedSha256}, received ${actualNormalizedHash}`,
            `${basePath}.input.normalizedSha256`,
            fixture.id,
          );
        if (
          fixture.id === HARNESS_SMOKE_FIXTURE_ID &&
          (!isRecord(inputDocument) ||
            inputDocument.fixtureId !== HARNESS_SMOKE_FIXTURE_ID ||
            inputDocument.scientificClaim !== false)
        )
          addIssue(
            issues,
            'error',
            'smoke-claim-violation',
            'smoke input must identify itself and set scientificClaim to false',
            `${basePath}.input`,
            fixture.id,
          );
      } catch (error) {
        addIssue(
          issues,
          'error',
          'input-json-error',
          errorMessage(error),
          `${basePath}.input.artifactId`,
          fixture.id,
        );
      }
    }

    if (fixture.benchmark !== undefined) {
      const recordArtifact = artifacts.get(fixture.benchmark.recordArtifactId);
      const recordBytes = bytesById.get(fixture.benchmark.recordArtifactId);
      const goldenBytes = bytesById.get(fixture.benchmark.goldenJsonlArtifactId);
      if (recordArtifact !== undefined && recordBytes !== undefined) {
        try {
          const recordDocument = JSON.parse(Buffer.from(recordBytes).toString('utf8')) as unknown;
          const benchmarkResult = validateBenchmarkRecord(recordDocument);
          for (const benchmarkIssue of benchmarkResult.issues)
            addIssue(
              issues,
              'error',
              `benchmark-${benchmarkIssue.code}`,
              benchmarkIssue.message,
              `${basePath}.benchmark.record${benchmarkIssue.path.slice(1)}`,
              fixture.id,
            );
          if (benchmarkResult.record !== undefined) {
            if (benchmarkResult.record.fixtureId !== fixture.id)
              addIssue(
                issues,
                'error',
                'benchmark-fixture-mismatch',
                `record belongs to ${benchmarkResult.record.fixtureId}`,
                `${basePath}.benchmark.record.fixtureId`,
                fixture.id,
              );
            if (benchmarkResult.record.hashes.input !== inputArtifact?.sha256)
              addIssue(
                issues,
                'error',
                'benchmark-input-hash-mismatch',
                'benchmark input hash must equal manifest raw input hash',
                `${basePath}.benchmark.record.hashes.input`,
                fixture.id,
              );
            if (goldenBytes !== undefined) {
              const expectedJsonl = serializeBenchmarkRecord(benchmarkResult.record);
              const actualJsonl = Buffer.from(goldenBytes).toString('utf8');
              if (actualJsonl !== expectedJsonl)
                addIssue(
                  issues,
                  'error',
                  'benchmark-golden-mismatch',
                  'golden JSONL must equal deterministic schema-version-1 serialization plus one LF',
                  `${basePath}.benchmark.goldenJsonlArtifactId`,
                  fixture.id,
                );
            }
          }
        } catch (error) {
          addIssue(
            issues,
            'error',
            'benchmark-json-error',
            errorMessage(error),
            `${basePath}.benchmark.recordArtifactId`,
            fixture.id,
          );
        }
      }
    }
  }
  return { manifestPath: absoluteManifestPath, manifest, issues };
}
