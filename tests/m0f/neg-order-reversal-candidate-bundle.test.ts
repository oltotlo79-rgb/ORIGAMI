import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { runNegOrderReversalCandidateBundleCli } from '../../m0f/neg-order-reversal-candidate-bundle-cli.js';
import {
  buildNegOrderReversalCandidateBundleV1,
  NEG_ORDER_REVERSAL_ARTIFACT_SPECS_V1,
  NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_SCHEMA_ID,
  NEG_ORDER_REVERSAL_CASE_SPEC_V1,
  NEG_ORDER_REVERSAL_FOLD_CONTROL_SOURCE_V1,
  parseNegOrderReversalCandidateBundleLedgerV1,
  verifyNegOrderReversalCandidateBundleV1,
  writeNegOrderReversalCandidateBundleV1,
  type NegOrderReversalCandidateVerificationResultV1,
} from '../../m0f/neg-order-reversal-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY);
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

async function jsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

async function copyBundle(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  const destination = join(root, 'NEG-ORDER-REVERSAL');
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
  const ledgerPath = join(directory, NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_LEDGER_FILENAME);
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

let committedVerification: NegOrderReversalCandidateVerificationResultV1;

beforeAll(async () => {
  committedVerification = await verifyNegOrderReversalCandidateBundleV1();
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('NEG-ORDER-REVERSAL exact-negative candidate bundle', () => {
  it('anchors the saved control to the authored FOLD vector and freshly accepts it', async () => {
    const authored = await jsonFile(resolve('tests/vectors/m0f-0/artifact-contract-fold-v1.json'));
    const saved = await jsonFile(join(BUNDLE_DIRECTORY, 'control-fold.json'));
    expect(stableStringify(NEG_ORDER_REVERSAL_FOLD_CONTROL_SOURCE_V1)).toBe(
      stableStringify(authored),
    );
    expect(saved).toEqual(NEG_ORDER_REVERSAL_FOLD_CONTROL_SOURCE_V1);
    expect(stableStringify(saved)).toBe(stableStringify(authored));
    expect(parseArtifactContractV1(saved)).toMatchObject({ ok: true });
  });

  it('fixes the mutation, exact two-path delta, and saved negative bytes', async () => {
    expect(NEG_ORDER_REVERSAL_CASE_SPEC_V1).toMatchObject({
      caseId: 'NEG-ORDER-REVERSAL',
      controlArtifactId: 'control-fold',
      mutationKind: 'extend-terminal-contact-to-full-interval-and-append-initial-reverse-relation',
      changedPaths: ['$.contacts[0].interval[0]', '$.layerEvents[1]'],
      sourceArtifactId: 'source-order-reversal',
      sourcePath: 'order-reversal.json',
    });
    expect(
      jsonDifferencePaths(
        NEG_ORDER_REVERSAL_FOLD_CONTROL_SOURCE_V1,
        NEG_ORDER_REVERSAL_CASE_SPEC_V1.sourceDocument,
      ),
    ).toEqual(['$.contacts[0].interval[0]', '$.layerEvents[1]']);
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'order-reversal.json'))).toEqual(
      NEG_ORDER_REVERSAL_CASE_SPEC_V1.sourceDocument,
    );
  });

  it('freshly rejects the saved source with the complete ordered oracle', async () => {
    const replay = parseArtifactContractV1(
      await jsonFile(join(BUNDLE_DIRECTORY, 'order-reversal.json')),
    );
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('NEG-ORDER-REVERSAL source must be rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents', code: 'layer-order-reversal' },
    ]);
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_ORDER_REVERSAL_CASE_SPEC_V1.expectedIssues,
    );
  });

  it('states the parser-only boundary and every material nonclaim in the saved README', async () => {
    const readme = await readFile(join(BUNDLE_DIRECTORY, 'README.md'), 'utf8');
    for (const phrase of [
      'not canonically registered or promoted',
      'does not establish a physical layer order',
      'infer contacts',
      'contact completeness or legality',
      'path continuity or rigid motion',
      'CCD or collision detection',
      'collision freedom or foldability',
      'SupportProfile or ToleranceProfile',
      'scientific verification claim',
      'M0F GO',
    ]) {
      expect(readme).toContain(phrase);
    }
  });

  it('accepts the committed ledger in the closed runtime parser and strict schema', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const parsed = parseNegOrderReversalCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('committed ledger must parse');
    expect(parsed.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      vectorSetId: 'NEG-ORDER-REVERSAL-V1',
      declaredContinuousContactOrderParserOnly: true,
      canonicalManifestRegistration: 'not-registered',
      canonicalPromotionClaimed: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      physicalLayerOrderEstablished: false,
      contactCompletenessEstablished: false,
      contactLegalityEstablished: false,
      pathContinuityEstablished: false,
      collisionDetectionIncluded: false,
      collisionFreedomEstablished: false,
      foldabilityEstablished: false,
      scientificVerificationClaimed: false,
      globalM0fGate: 'not-evaluated',
      caseCount: 1,
      artifactCount: 3,
    });
    const schema = record(
      await jsonFile(
        resolve('m0f/schemas/neg-order-reversal-candidate-bundle-ledger-v1.schema.json'),
      ),
    );
    expect(schema.$id).toBe(NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_SCHEMA_ID);
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    expect(validate(ledger), JSON.stringify(validate.errors)).toBe(true);
  });

  it('fixes artifact order and the source-to-control provenance dependency', async () => {
    const ledger = record(
      await jsonFile(join(BUNDLE_DIRECTORY, NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_LEDGER_FILENAME)),
    );
    const artifacts = array(ledger.artifacts).map(record);
    expect(artifacts.map((entry) => entry.artifactId)).toEqual(
      NEG_ORDER_REVERSAL_ARTIFACT_SPECS_V1.map((entry) => entry.artifactId),
    );
    expect(record(artifacts[2]?.provenance).dependsOnArtifactIds).toEqual(['control-fold']);
  });

  it('rejects case, oracle, artifact, provenance, delta, and false-claim rewrites', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_ORDER_REVERSAL_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const schema = record(
      await jsonFile(
        resolve('m0f/schemas/neg-order-reversal-candidate-bundle-ledger-v1.schema.json'),
      ),
    );
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    const mutations: JsonRecord[] = [];
    for (const [field, value] of [
      ['caseId', 'NEG-ORDER-REVERSAL-REWRITTEN'],
      ['sourcePath', 'rewritten.json'],
      ['controlArtifactId', 'rewritten-control'],
      ['changedPaths', ['$.layerEvents[1]']],
      ['expectedIssues', [{ path: '$.layerEvents', code: 'rewritten' }]],
    ] as const) {
      const changed = structuredClone(ledger) as JsonRecord;
      record(array(changed.cases)[0])[field] = value;
      mutations.push(changed);
    }
    const artifactOrder = structuredClone(ledger) as JsonRecord;
    array(artifactOrder.artifacts).reverse();
    mutations.push(artifactOrder);
    const provenance = structuredClone(ledger) as JsonRecord;
    record(record(array(provenance.artifacts)[2]).provenance).dependsOnArtifactIds = [];
    mutations.push(provenance);
    for (const [field, value] of [
      ['contractStatus', 'verified'],
      ['scientificClaim', true],
      ['canonicalPromotionClaimed', true],
      ['supportProfileIncluded', true],
      ['toleranceProfileIncluded', true],
      ['physicalLayerOrderEstablished', true],
      ['contactCompletenessEstablished', true],
      ['contactLegalityEstablished', true],
      ['pathContinuityEstablished', true],
      ['collisionDetectionIncluded', true],
      ['collisionFreedomEstablished', true],
      ['foldabilityEstablished', true],
      ['scientificVerificationClaimed', true],
      ['globalM0fGate', 'GO'],
      ['supportProfile', { id: 'invented' }],
    ] as const) {
      const changed = structuredClone(ledger) as JsonRecord;
      changed[field] = value;
      mutations.push(changed);
    }
    for (const changed of mutations) {
      expect(validate(changed)).toBe(false);
      expect(parseNegOrderReversalCandidateBundleLedgerV1(changed).ok).toBe(false);
    }
  });

  it('builds twice and writes isolated directories as byte-identical closed sets', async () => {
    const firstBuild = buildNegOrderReversalCandidateBundleV1();
    const secondBuild = buildNegOrderReversalCandidateBundleV1();
    expect(firstBuild.files).toEqual(secondBuild.files);
    expect(firstBuild.files).toHaveLength(4);
    const firstRoot = await mkdtemp(join(tmpdir(), 'neg-order-reversal-write-a-'));
    const secondRoot = await mkdtemp(join(tmpdir(), 'neg-order-reversal-write-b-'));
    temporaryDirectories.push(firstRoot, secondRoot);
    const firstDirectory = join(firstRoot, 'NEG-ORDER-REVERSAL');
    const secondDirectory = join(secondRoot, 'NEG-ORDER-REVERSAL');
    await writeNegOrderReversalCandidateBundleV1(firstDirectory);
    await writeNegOrderReversalCandidateBundleV1(secondDirectory);
    for (const file of firstBuild.files) {
      expect(await readFile(join(firstDirectory, file.path))).toEqual(
        await readFile(join(secondDirectory, file.path)),
      );
    }
    expect((await verifyNegOrderReversalCandidateBundleV1(firstDirectory)).reasonCodes).toEqual([]);
    expect((await verifyNegOrderReversalCandidateBundleV1(secondDirectory)).reasonCodes).toEqual(
      [],
    );
  });

  it('verifies every committed check while keeping downstream claims false', () => {
    expect(committedVerification).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      declaredContinuousContactOrderParserOnly: true,
      globalM0fGate: 'not-evaluated',
      canonicalPromotionClaimed: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      physicalLayerOrderEstablished: false,
      contactCompletenessEstablished: false,
      contactLegalityEstablished: false,
      pathContinuityEstablished: false,
      collisionDetectionIncluded: false,
      collisionFreedomEstablished: false,
      foldabilityEstablished: false,
      scientificVerificationClaimed: false,
      reproducibleExactNegativeBundle: true,
      reasonCodes: [],
      checks: {
        ledgerPresentAndValid: true,
        artifactSetExact: true,
        allArtifactHashesMatch: true,
        allArtifactProvenanceFixed: true,
        canonicalManifestRegistrationAbsent: true,
        controlArtifactCount: 1,
        everyControlArtifactParsed: true,
        everySavedControlAccepted: true,
        sourceCaseCount: 1,
        everySourceParsed: true,
        everySourceControlDifferenceMatched: true,
        everySourceRejected: true,
        everyOrderedIssueSignatureMatched: true,
        deterministicRegenerationMatched: true,
      },
    });
  });

  it('keeps NEG-ORDER-REVERSAL outside the canonical manifest', async () => {
    const parsed = parseFixtureManifest(await jsonFile(resolve('tests/fixtures/manifest.json')));
    expect(parsed.manifest).toBeDefined();
    expect(parsed.manifest?.fixtures.some((fixture) => fixture.id === 'NEG-ORDER-REVERSAL')).toBe(
      false,
    );
  });

  it('supports deterministic CLI verify/write and rejects invalid options', async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = {
      cwd: process.cwd(),
      stdout: (text: string) => stdout.push(text),
      stderr: (text: string) => stderr.push(text),
    };
    expect(await runNegOrderReversalCandidateBundleCli(['--verify'], io)).toBe(0);
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    expect(stderr).toEqual([]);
    const root = await mkdtemp(join(tmpdir(), 'neg-order-reversal-cli-'));
    temporaryDirectories.push(root);
    const destination = join(root, 'bundle');
    stdout.length = 0;
    expect(
      await runNegOrderReversalCandidateBundleCli(['--write', destination, '--json'], io),
    ).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(await runNegOrderReversalCandidateBundleCli(['--unknown'], io)).toBe(2);
  });

  it('rejects raw tampering, extra entries, links, and unsafe writer cleanup', async () => {
    const tampered = await copyBundle('neg-order-reversal-tamper-');
    await writeFile(join(tampered, 'order-reversal.json'), '{}\n', 'utf8');
    expect((await verifyNegOrderReversalCandidateBundleV1(tampered)).reasonCodes).toEqual([
      'artifact-hash-mismatch',
    ]);
    const extra = await copyBundle('neg-order-reversal-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect((await verifyNegOrderReversalCandidateBundleV1(extra)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
    await expect(writeNegOrderReversalCandidateBundleV1(extra)).rejects.toThrow('unexpected entry');
    const linked = await copyBundle('neg-order-reversal-link-');
    const linkPath = join(linked, 'order-reversal.json');
    await rm(linkPath);
    await symlink(BUNDLE_DIRECTORY, linkPath, 'junction');
    expect((await verifyNegOrderReversalCandidateBundleV1(linked)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-order-reversal-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-order-reversal',
      NEG_ORDER_REVERSAL_FOLD_CONTROL_SOURCE_V1,
    );
    expect((await verifyNegOrderReversalCandidateBundleV1(directory)).reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a coherently rehashed accepted saved-control rewrite', async () => {
    const directory = await copyBundle('neg-order-reversal-control-');
    const control = record(await jsonFile(join(directory, 'control-fold.json')));
    control.contractId = 'CONTRACT-FOLD-TWO-FACE-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-fold', control);
    const result = await verifyNegOrderReversalCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks.everySavedControlAccepted).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });

  it('rejects a same-delta rewrite whose complete parser signature changes', async () => {
    const directory = await copyBundle('neg-order-reversal-signature-');
    const source = record(await jsonFile(join(directory, 'order-reversal.json')));
    record(array(source.layerEvents)[1]).interval = [1, 1];
    expect(jsonDifferencePaths(NEG_ORDER_REVERSAL_FOLD_CONTROL_SOURCE_V1, source)).toEqual([
      '$.contacts[0].interval[0]',
      '$.layerEvents[1]',
    ]);
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('changed-signature rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents', code: 'layer-cycle' },
    ]);
    await coherentlyRewriteArtifact(directory, 'source-order-reversal', source);
    const result = await verifyNegOrderReversalCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual([
      'parser-issue-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everySourceRejected).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(false);
  });

  it('rejects a wrong delta even when the complete parser oracle is unchanged', async () => {
    const directory = await copyBundle('neg-order-reversal-delta-');
    const source = record(await jsonFile(join(directory, 'order-reversal.json')));
    source.contractId = 'CONTRACT-FOLD-TWO-FACE-DELTA-V1';
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('wrong-delta rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_ORDER_REVERSAL_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(directory, 'source-order-reversal', source);
    expect((await verifyNegOrderReversalCandidateBundleV1(directory)).reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects different source bytes with the same delta and complete parser oracle', async () => {
    const directory = await copyBundle('neg-order-reversal-same-oracle-');
    const source = record(await jsonFile(join(directory, 'order-reversal.json')));
    record(array(source.layerEvents)[1]).id = 'layer-initial-reverse-alternate';
    expect(jsonDifferencePaths(NEG_ORDER_REVERSAL_FOLD_CONTROL_SOURCE_V1, source)).toEqual([
      '$.contacts[0].interval[0]',
      '$.layerEvents[1]',
    ]);
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('same-oracle rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_ORDER_REVERSAL_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(directory, 'source-order-reversal', source);
    const result = await verifyNegOrderReversalCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
