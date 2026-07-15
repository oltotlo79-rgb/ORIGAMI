import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { runNegSupportCatalogCandidateBundleCli } from '../../m0f/neg-support-catalog-candidate-bundle-cli.js';
import {
  buildNegSupportCatalogCandidateBundleV1,
  NEG_SUPPORT_CATALOG_ARTIFACT_SPECS_V1,
  NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCHEMA_ID,
  NEG_SUPPORT_CATALOG_CANDIDATE_README_V1,
  NEG_SUPPORT_CATALOG_CASE_SPECS_V1,
  NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1,
  parseNegSupportCatalogCandidateBundleLedgerV1,
  verifyNegSupportCatalogCandidateBundleV1,
  writeNegSupportCatalogCandidateBundleV1,
  type NegSupportCatalogCandidateVerificationResultV1,
} from '../../m0f/neg-support-catalog-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { parseSupportProfileCandidatesV1 } from '../../m0f/profiles/support-profiles.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY);
const SCHEMA_PATH = resolve(
  'm0f/schemas/neg-support-catalog-candidate-bundle-ledger-v1.schema.json',
);
const CATALOG_SOURCE_PATH = resolve('m0f/profiles/support-profile-v1.candidates.json');
const temporaryDirectories: string[] = [];

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('expected JSON object');
  }
  return value as JsonRecord;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new TypeError('expected JSON array');
  return value;
}

function requiredEntry<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new TypeError(`missing test entry ${String(index)}`);
  return value;
}

function profile(source: unknown, index: number): JsonRecord {
  return record(requiredEntry(array(record(source).profiles), index));
}

function selection(source: unknown, profileIndex: number, key: string): JsonRecord {
  return record(record(profile(source, profileIndex).constraints)[key]);
}

async function jsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

async function schemaValidator(): Promise<ReturnType<Ajv2020['compile']>> {
  const schema = record(await jsonFile(SCHEMA_PATH));
  return new Ajv2020({ allErrors: true, strict: true }).compile(schema);
}

async function copyBundle(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  const destination = join(root, 'NEG-SUPPORT-CATALOG');
  await cp(BUNDLE_DIRECTORY, destination, { recursive: true });
  return destination;
}

function jsonDifferencePaths(left: unknown, right: unknown, path = '$'): string[] {
  if (Object.is(left, right)) return [];
  if (Array.isArray(left) && Array.isArray(right)) {
    const differences: string[] = [];
    for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
      const childPath = `${path}[${String(index)}]`;
      if (!Object.hasOwn(left, index) || !Object.hasOwn(right, index)) differences.push(childPath);
      else differences.push(...jsonDifferencePaths(left[index], right[index], childPath));
    }
    return differences;
  }
  if (
    typeof left === 'object' &&
    left !== null &&
    !Array.isArray(left) &&
    typeof right === 'object' &&
    right !== null &&
    !Array.isArray(right)
  ) {
    const leftRecord = left as JsonRecord;
    const rightRecord = right as JsonRecord;
    const differences: string[] = [];
    const keys = [
      ...Object.keys(leftRecord),
      ...Object.keys(rightRecord).filter((key) => !Object.hasOwn(leftRecord, key)),
    ].sort();
    for (const key of keys) {
      const childPath = `${path}.${key}`;
      if (!Object.hasOwn(leftRecord, key) || !Object.hasOwn(rightRecord, key)) {
        differences.push(childPath);
      } else {
        differences.push(...jsonDifferencePaths(leftRecord[key], rightRecord[key], childPath));
      }
    }
    return differences;
  }
  return [path];
}

async function coherentlyRewriteArtifact(
  directory: string,
  artifactId: string,
  source: unknown,
): Promise<void> {
  const ledgerPath = join(directory, NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME);
  const ledger = record(await jsonFile(ledgerPath));
  const artifact = array(ledger.artifacts)
    .map(record)
    .find((entry) => entry.artifactId === artifactId);
  if (artifact === undefined || typeof artifact.path !== 'string') {
    throw new TypeError(`missing artifact ${artifactId}`);
  }
  const text = `${stableStringify(source)}\n`;
  await writeFile(join(directory, artifact.path), text, 'utf8');
  artifact.sha256 = sha256Prefixed(text);
  await writeFile(ledgerPath, `${stableStringify(ledger)}\n`, 'utf8');
}

let committedVerification: NegSupportCatalogCandidateVerificationResultV1;

beforeAll(async () => {
  committedVerification = await verifyNegSupportCatalogCandidateBundleV1();
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('NEG-SUPPORT-CATALOG exact-negative candidate bundle', () => {
  it('fixes stable-JSON equality among the exported, saved, and existing candidate catalogs', async () => {
    const saved = await jsonFile(
      join(BUNDLE_DIRECTORY, 'control-support-profile-candidate-catalog.json'),
    );
    const existing = await jsonFile(CATALOG_SOURCE_PATH);
    expect(stableStringify(saved)).toBe(stableStringify(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1));
    expect(stableStringify(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1)).toBe(stableStringify(existing));
    expect(parseSupportProfileCandidatesV1(saved)).toMatchObject({ ok: true });
    expect(record(saved).status).toBe('candidate');
    for (const entry of array(record(saved).profiles)) {
      const candidateProfile = record(entry);
      expect(candidateProfile.profileHash).toBeNull();
      expect(record(candidateProfile.evidence).status).toBe('pending');
    }
  });

  it('fixes twelve distinct case identities, exact sorted deltas, and saved sources', async () => {
    expect(NEG_SUPPORT_CATALOG_CASE_SPECS_V1.map((entry) => entry.caseId)).toEqual([
      'NEG-SUPPORT-CATALOG-PREMATURE-FROZEN',
      'NEG-SUPPORT-CATALOG-PREMATURE-PROFILE-HASH',
      'NEG-SUPPORT-CATALOG-SELECT-TREE-MAX-DEGREE',
      'NEG-SUPPORT-CATALOG-SELECT-TREE-DECIMAL-DIGITS',
      'NEG-SUPPORT-CATALOG-SELECT-TREE-LENGTH-RATIO',
      'NEG-SUPPORT-CATALOG-SELECT-GRID-COLUMNS',
      'NEG-SUPPORT-CATALOG-SELECT-GRID-QUANTIZATION-ERROR',
      'NEG-SUPPORT-CATALOG-SELECT-FOLD-MAX-VERTICES',
      'NEG-SUPPORT-CATALOG-PREMATURE-EVIDENCE',
      'NEG-SUPPORT-CATALOG-METHOD-MISMATCH',
      'NEG-SUPPORT-CATALOG-UNKNOWN-SOLVER-KEY',
      'NEG-SUPPORT-CATALOG-UNSORTED-CANDIDATES',
    ]);
    for (const caseSpec of NEG_SUPPORT_CATALOG_CASE_SPECS_V1) {
      expect(
        jsonDifferencePaths(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1, caseSpec.sourceDocument),
        caseSpec.caseId,
      ).toEqual(caseSpec.changedPaths);
      expect(await jsonFile(join(BUNDLE_DIRECTORY, caseSpec.sourcePath)), caseSpec.caseId).toEqual(
        caseSpec.sourceDocument,
      );
    }
  });

  it('freshly rejects every saved source with its complete ordered code/path oracle', async () => {
    for (const caseSpec of NEG_SUPPORT_CATALOG_CASE_SPECS_V1) {
      const source = await jsonFile(join(BUNDLE_DIRECTORY, caseSpec.sourcePath));
      const replay = parseSupportProfileCandidatesV1(source);
      expect(replay.ok, caseSpec.caseId).toBe(false);
      if (replay.ok) throw new TypeError('negative catalog source must be rejected');
      expect(
        replay.error.map(({ path, code }) => ({ path, code })),
        caseSpec.caseId,
      ).toEqual(caseSpec.expectedIssues);
    }
  });

  it('covers representative tree, box-grid, and fold selections without selecting the control', () => {
    expect(
      selection(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1, 0, 'maxTreeDegree').selected,
    ).toBeNull();
    expect(
      selection(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1, 1, 'maxGridColumns').selected,
    ).toBeNull();
    expect(selection(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1, 2, 'maxVertices').selected).toBeNull();
    expect(requiredEntry(NEG_SUPPORT_CATALOG_CASE_SPECS_V1, 2).changedPaths).toEqual([
      '$.profiles[0].constraints.maxTreeDegree.selected',
    ]);
    expect(requiredEntry(NEG_SUPPORT_CATALOG_CASE_SPECS_V1, 6).changedPaths).toEqual([
      '$.profiles[1].constraints.maxNormalizedQuantizationError.selected',
    ]);
    expect(requiredEntry(NEG_SUPPORT_CATALOG_CASE_SPECS_V1, 7).changedPaths).toEqual([
      '$.profiles[2].constraints.maxVertices.selected',
    ]);
  });

  it('states the parser-only boundary and every material nonclaim in the payload README', () => {
    expect(NEG_SUPPORT_CATALOG_CANDIDATE_README_V1).toContain('parseSupportProfileCandidatesV1');
    for (const phrase of [
      'NEG-SUPPORT-BOUNDARY-*',
      'does not freeze or define a SupportProfile',
      'checkSupport',
      'actual input is supported',
      'establishes no termination guarantee',
      'scientific claim',
      'M0F GO',
      'no ToleranceProfile',
    ]) {
      expect(NEG_SUPPORT_CATALOG_CANDIDATE_README_V1).toContain(phrase);
    }
  });

  it('accepts the committed ledger in both the runtime parser and strict exact-row schema', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const parsed = parseNegSupportCatalogCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('committed catalog ledger must parse');
    expect(parsed.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      vectorSetId: 'NEG-SUPPORT-CATALOG-V1',
      candidateCatalogOnly: true,
      canonicalManifestRegistration: 'not-registered',
      canonicalPromotionClaimed: false,
      canonicalSupportBoundaryFamilyClaimed: false,
      frozenSupportProfileIncluded: false,
      supportProfileIncluded: false,
      checkSupportIncluded: false,
      actualInputSupportDecisionIncluded: false,
      terminationGuaranteeEstablished: false,
      toleranceProfileIncluded: false,
      scientificVerificationClaimed: false,
      globalM0fGate: 'not-evaluated',
      caseCount: 12,
      artifactCount: 14,
    });

    const schema = record(await jsonFile(SCHEMA_PATH));
    expect(schema.$id).toBe(NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_SCHEMA_ID);
    const validate = await schemaValidator();
    expect(validate(ledger), JSON.stringify(validate.errors)).toBe(true);
  });

  it('fixes every artifact row and every negative-to-saved-control dependency', async () => {
    const ledger = record(
      await jsonFile(join(BUNDLE_DIRECTORY, NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME)),
    );
    const artifacts = array(ledger.artifacts).map(record);
    expect(artifacts.map((entry) => entry.artifactId)).toEqual(
      NEG_SUPPORT_CATALOG_ARTIFACT_SPECS_V1.map((entry) => entry.artifactId),
    );
    for (const caseSpec of NEG_SUPPORT_CATALOG_CASE_SPECS_V1) {
      const artifact = artifacts.find((entry) => entry.artifactId === caseSpec.sourceArtifactId);
      expect(record(artifact?.provenance).dependsOnArtifactIds, caseSpec.caseId).toEqual([
        'control-support-profile-candidate-catalog',
      ]);
    }
  });

  it('rejects case, issue, artifact, identity, path, link, delta, and provenance rewrites', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const validate = await schemaValidator();
    const mutations: JsonRecord[] = [];

    const caseOrder = structuredClone(ledger) as JsonRecord;
    array(caseOrder.cases).reverse();
    mutations.push(caseOrder);

    const issue = structuredClone(ledger) as JsonRecord;
    record(array(record(array(issue.cases)[0]).expectedIssues)[0]).code = 'unknown-key';
    mutations.push(issue);

    const artifactOrder = structuredClone(ledger) as JsonRecord;
    array(artifactOrder.artifacts).reverse();
    mutations.push(artifactOrder);

    for (const [field, value] of [
      ['caseId', 'NEG-SUPPORT-CATALOG-REWRITTEN'],
      ['sourcePath', 'rewritten.json'],
      ['sourceArtifactId', 'source-rewritten'],
      ['controlArtifactId', 'rewritten-control'],
      ['changedPaths', ['$.profiles']],
    ] as const) {
      const changed = structuredClone(ledger) as JsonRecord;
      record(array(changed.cases)[0])[field] = value;
      mutations.push(changed);
    }

    for (const [field, value] of [
      ['artifactId', 'source-rewritten'],
      ['path', 'rewritten.json'],
      ['role', 'accepted-control'],
    ] as const) {
      const changed = structuredClone(ledger) as JsonRecord;
      record(array(changed.artifacts)[2])[field] = value;
      mutations.push(changed);
    }

    const provenance = structuredClone(ledger) as JsonRecord;
    record(record(array(provenance.artifacts)[2]).provenance).dependsOnArtifactIds = [];
    mutations.push(provenance);

    for (const changed of mutations) {
      expect(validate(changed)).toBe(false);
      expect(parseNegSupportCatalogCandidateBundleLedgerV1(changed).ok).toBe(false);
    }
  });

  it('rejects every claim escalation and undeclared support/check objects', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_SUPPORT_CATALOG_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const validate = await schemaValidator();
    for (const [field, value] of [
      ['contractStatus', 'verified'],
      ['scientificClaim', true],
      ['candidateCatalogOnly', false],
      ['canonicalPromotionClaimed', true],
      ['canonicalSupportBoundaryFamilyClaimed', true],
      ['frozenSupportProfileIncluded', true],
      ['supportProfileIncluded', true],
      ['checkSupportIncluded', true],
      ['actualInputSupportDecisionIncluded', true],
      ['terminationGuaranteeEstablished', true],
      ['toleranceProfileIncluded', true],
      ['scientificVerificationClaimed', true],
      ['globalM0fGate', 'GO'],
      ['supportProfile', { profileId: 'invented' }],
      ['checkSupport', { status: 'supported' }],
    ] as const) {
      const changed = structuredClone(ledger) as JsonRecord;
      changed[field] = value;
      expect(validate(changed), field).toBe(false);
      expect(parseNegSupportCatalogCandidateBundleLedgerV1(changed).ok, field).toBe(false);
    }
  });

  it('builds twice and writes two isolated byte-identical closed file sets', async () => {
    const firstBuild = buildNegSupportCatalogCandidateBundleV1();
    const secondBuild = buildNegSupportCatalogCandidateBundleV1();
    expect(firstBuild.files).toEqual(secondBuild.files);
    expect(firstBuild.files).toHaveLength(15);

    const firstRoot = await mkdtemp(join(tmpdir(), 'neg-support-catalog-write-a-'));
    const secondRoot = await mkdtemp(join(tmpdir(), 'neg-support-catalog-write-b-'));
    temporaryDirectories.push(firstRoot, secondRoot);
    const firstDirectory = join(firstRoot, 'NEG-SUPPORT-CATALOG');
    const secondDirectory = join(secondRoot, 'NEG-SUPPORT-CATALOG');
    await writeNegSupportCatalogCandidateBundleV1(firstDirectory);
    await writeNegSupportCatalogCandidateBundleV1(secondDirectory);
    for (const file of firstBuild.files) {
      expect(await readFile(join(firstDirectory, file.path))).toEqual(
        await readFile(join(secondDirectory, file.path)),
      );
    }
    expect((await verifyNegSupportCatalogCandidateBundleV1(firstDirectory)).reasonCodes).toEqual(
      [],
    );
    expect((await verifyNegSupportCatalogCandidateBundleV1(secondDirectory)).reasonCodes).toEqual(
      [],
    );
  });

  it('verifies the committed bundle while keeping all support and science claims false', () => {
    expect(committedVerification).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      candidateCatalogOnly: true,
      canonicalPromotionClaimed: false,
      canonicalSupportBoundaryFamilyClaimed: false,
      frozenSupportProfileIncluded: false,
      supportProfileIncluded: false,
      checkSupportIncluded: false,
      actualInputSupportDecisionIncluded: false,
      terminationGuaranteeEstablished: false,
      toleranceProfileIncluded: false,
      scientificVerificationClaimed: false,
      globalM0fGate: 'not-evaluated',
      reproducibleExactNegativeBundle: true,
      reasonCodes: [],
      checks: {
        ledgerPresentAndValid: true,
        artifactSetExact: true,
        allArtifactHashesMatch: true,
        allArtifactProvenanceFixed: true,
        canonicalManifestRegistrationAbsent: true,
        controlArtifactParsed: true,
        savedControlAccepted: true,
        sourceCaseCount: 12,
        everySourceParsed: true,
        everySourceControlDifferenceMatched: true,
        everySourceRejected: true,
        everyOrderedIssueSignatureMatched: true,
        deterministicRegenerationMatched: true,
      },
    });
  });

  it('keeps candidate IDs outside the manifest and distinct from canonical support-boundary IDs', async () => {
    const parsed = parseFixtureManifest(await jsonFile(resolve('tests/fixtures/manifest.json')));
    expect(parsed.manifest).toBeDefined();
    expect(
      parsed.manifest?.fixtures.some((fixture) => fixture.id.startsWith('NEG-SUPPORT-CATALOG-')),
    ).toBe(false);
    expect(
      NEG_SUPPORT_CATALOG_CASE_SPECS_V1.some((entry) =>
        entry.caseId.startsWith('NEG-SUPPORT-BOUNDARY-'),
      ),
    ).toBe(false);
  });

  it('supports deterministic CLI verify/write and rejects invalid options', async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = {
      cwd: process.cwd(),
      stdout: (text: string) => stdout.push(text),
      stderr: (text: string) => stderr.push(text),
    };
    expect(await runNegSupportCatalogCandidateBundleCli(['--verify'], io)).toBe(0);
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    expect(stderr).toEqual([]);

    const root = await mkdtemp(join(tmpdir(), 'neg-support-catalog-cli-'));
    temporaryDirectories.push(root);
    const destination = join(root, 'bundle');
    stdout.length = 0;
    expect(
      await runNegSupportCatalogCandidateBundleCli(['--write', destination, '--json'], io),
    ).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(await runNegSupportCatalogCandidateBundleCli(['--unknown'], io)).toBe(2);
  });

  it('rejects raw-byte tampering, extra entries, links, and unsafe writer cleanup', async () => {
    const tampered = await copyBundle('neg-support-catalog-tamper-');
    await writeFile(join(tampered, 'premature-frozen.json'), '{}\n', 'utf8');
    expect((await verifyNegSupportCatalogCandidateBundleV1(tampered)).reasonCodes).toEqual([
      'artifact-hash-mismatch',
    ]);

    const extra = await copyBundle('neg-support-catalog-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect((await verifyNegSupportCatalogCandidateBundleV1(extra)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
    await expect(writeNegSupportCatalogCandidateBundleV1(extra)).rejects.toThrow(
      'unexpected entry',
    );

    const linked = await copyBundle('neg-support-catalog-link-');
    const linkPath = join(linked, 'premature-frozen.json');
    await rm(linkPath);
    await symlink(BUNDLE_DIRECTORY, linkPath, 'junction');
    expect((await verifyNegSupportCatalogCandidateBundleV1(linked)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
  });

  it('rejects a coherently rehashed negative source rewritten to the accepted control', async () => {
    const directory = await copyBundle('neg-support-catalog-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-premature-frozen',
      NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1,
    );
    const verification = await verifyNegSupportCatalogCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a coherently rehashed accepted saved-control rewrite while using it as anchor', async () => {
    const directory = await copyBundle('neg-support-catalog-control-');
    const control = await jsonFile(
      join(directory, 'control-support-profile-candidate-catalog.json'),
    );
    selection(control, 0, 'maxTreeDegree').candidates = [3, 4, 6, 10, 24];
    expect(parseSupportProfileCandidatesV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(
      directory,
      'control-support-profile-candidate-catalog',
      control,
    );
    const verification = await verifyNegSupportCatalogCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(verification.checks.savedControlAccepted).toBe(true);
    expect(verification.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });

  it('rejects a coherent source whose delta is unchanged but ordered parser signature changes', async () => {
    const directory = await copyBundle('neg-support-catalog-signature-');
    const source = await jsonFile(join(directory, 'premature-frozen.json'));
    record(source).status = 'unsupported';
    expect(jsonDifferencePaths(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1, source)).toEqual([
      '$.status',
    ]);
    await coherentlyRewriteArtifact(directory, 'source-premature-frozen', source);
    const verification = await verifyNegSupportCatalogCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual([
      'parser-issue-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(verification.checks.everySourceControlDifferenceMatched).toBe(true);
  });

  it('rejects a coherent wrong delta even when the original parser oracle remains unchanged', async () => {
    const directory = await copyBundle('neg-support-catalog-delta-');
    const source = await jsonFile(join(directory, 'select-tree-max-degree.json'));
    selection(source, 0, 'maxTreeDegree').candidates = [3, 4, 6, 10, 24];
    const replay = parseSupportProfileCandidatesV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('wrong-delta rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      requiredEntry(NEG_SUPPORT_CATALOG_CASE_SPECS_V1, 2).expectedIssues,
    );
    await coherentlyRewriteArtifact(directory, 'source-select-tree-max-degree', source);
    const verification = await verifyNegSupportCatalogCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(verification.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });

  it('rejects different source bytes even with the complete same delta and same parser oracle', async () => {
    const directory = await copyBundle('neg-support-catalog-same-oracle-');
    const source = await jsonFile(join(directory, 'select-tree-max-degree.json'));
    selection(source, 0, 'maxTreeDegree').selected = 6;
    const replay = parseSupportProfileCandidatesV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('same-oracle rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      requiredEntry(NEG_SUPPORT_CATALOG_CASE_SPECS_V1, 2).expectedIssues,
    );
    expect(jsonDifferencePaths(NEG_SUPPORT_CATALOG_CONTROL_SOURCE_V1, source)).toEqual([
      '$.profiles[0].constraints.maxTreeDegree.selected',
    ]);

    await coherentlyRewriteArtifact(directory, 'source-select-tree-max-degree', source);
    const verification = await verifyNegSupportCatalogCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(verification.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(verification.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
