import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { runNegLayerCycleCandidateBundleCli } from '../../m0f/neg-layer-cycle-candidate-bundle-cli.js';
import {
  buildNegLayerCycleCandidateBundleV1,
  NEG_LAYER_CYCLE_ARTIFACT_SPECS_V1,
  NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCHEMA_ID,
  NEG_LAYER_CYCLE_CASE_SPEC_V1,
  NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1,
  parseNegLayerCycleCandidateBundleLedgerV1,
  verifyNegLayerCycleCandidateBundleV1,
  writeNegLayerCycleCandidateBundleV1,
  type NegLayerCycleCandidateVerificationResultV1,
} from '../../m0f/neg-layer-cycle-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY);
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
  const destination = join(root, 'NEG-LAYER-CYCLE');
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
  const ledgerPath = join(directory, NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_LEDGER_FILENAME);
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

let committedVerification: NegLayerCycleCandidateVerificationResultV1;

beforeAll(async () => {
  committedVerification = await verifyNegLayerCycleCandidateBundleV1();
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('NEG-LAYER-CYCLE exact-negative candidate bundle', () => {
  it('anchors the self-contained saved control to the authored FOLD vector and freshly accepts it', async () => {
    const authored = await jsonFile(resolve('tests/vectors/m0f-0/artifact-contract-fold-v1.json'));
    const saved = await jsonFile(join(BUNDLE_DIRECTORY, 'control-fold.json'));
    expect(stableStringify(NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1)).toBe(stableStringify(authored));
    expect(saved).toEqual(NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1);
    expect(stableStringify(saved)).toBe(stableStringify(authored));
    expect(parseArtifactContractV1(saved)).toMatchObject({ ok: true });
  });

  it('fixes the sole mutation, exact saved-control delta, and negative source bytes', async () => {
    expect(NEG_LAYER_CYCLE_CASE_SPEC_V1).toMatchObject({
      caseId: 'NEG-LAYER-CYCLE',
      controlArtifactId: 'control-fold',
      mutationKind: 'append-reverse-terminal-layer-relation',
      changedPaths: ['$.layerEvents[1]'],
      sourceArtifactId: 'source-layer-cycle',
      sourcePath: 'layer-cycle.json',
    });
    expect(
      jsonDifferencePaths(
        NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1,
        NEG_LAYER_CYCLE_CASE_SPEC_V1.sourceDocument,
      ),
    ).toEqual(['$.layerEvents[1]']);
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'layer-cycle.json'))).toEqual(
      NEG_LAYER_CYCLE_CASE_SPEC_V1.sourceDocument,
    );
  });

  it('freshly rejects the saved source with the complete ordered code/path oracle', async () => {
    const source = await jsonFile(join(BUNDLE_DIRECTORY, 'layer-cycle.json'));
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('NEG-LAYER-CYCLE source must be rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents', code: 'layer-cycle' },
    ]);
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_LAYER_CYCLE_CASE_SPEC_V1.expectedIssues,
    );
  });

  it('accepts the committed ledger in both the closed runtime parser and strict schema', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const parsed = parseNegLayerCycleCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('committed NEG-LAYER-CYCLE ledger must parse');
    expect(parsed.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      vectorSetId: 'NEG-LAYER-CYCLE-V1',
      canonicalManifestRegistration: 'not-registered',
      canonicalPromotionClaimed: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      physicalLayerOrderEstablished: false,
      orderReversalDetectionIncluded: false,
      contactLegalityEstablished: false,
      pathContinuityEstablished: false,
      collisionDetectionIncluded: false,
      foldabilityEstablished: false,
      scientificVerificationClaimed: false,
      globalM0fGate: 'not-evaluated',
      caseCount: 1,
      artifactCount: 3,
    });
    const schema = record(
      await jsonFile(resolve('m0f/schemas/neg-layer-cycle-candidate-bundle-ledger-v1.schema.json')),
    );
    expect(schema.$id).toBe(NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_SCHEMA_ID);
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    expect(validate(ledger), JSON.stringify(validate.errors)).toBe(true);
  });

  it('fixes artifact order and the negative-to-control provenance dependency', async () => {
    const ledger = record(
      await jsonFile(join(BUNDLE_DIRECTORY, NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_LEDGER_FILENAME)),
    );
    const artifacts = array(ledger.artifacts).map(record);
    expect(artifacts.map((entry) => entry.artifactId)).toEqual(
      NEG_LAYER_CYCLE_ARTIFACT_SPECS_V1.map((entry) => entry.artifactId),
    );
    expect(record(artifacts[2]?.provenance).dependsOnArtifactIds).toEqual(['control-fold']);
  });

  it('rejects case, oracle, artifact, control-link, delta, and claim rewrites', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_LAYER_CYCLE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const schema = record(
      await jsonFile(resolve('m0f/schemas/neg-layer-cycle-candidate-bundle-ledger-v1.schema.json')),
    );
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    const mutations: JsonRecord[] = [];
    for (const [field, value] of [
      ['caseId', 'NEG-LAYER-CYCLE-REWRITTEN'],
      ['sourcePath', 'rewritten.json'],
      ['controlArtifactId', 'rewritten-control'],
      ['changedPaths', ['$.layerEvents']],
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
      ['orderReversalDetectionIncluded', true],
      ['contactLegalityEstablished', true],
      ['pathContinuityEstablished', true],
      ['collisionDetectionIncluded', true],
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
      expect(parseNegLayerCycleCandidateBundleLedgerV1(changed).ok).toBe(false);
    }
  });

  it('builds twice and writes isolated directories with byte-identical closed sets', async () => {
    const firstBuild = buildNegLayerCycleCandidateBundleV1();
    const secondBuild = buildNegLayerCycleCandidateBundleV1();
    expect(firstBuild.files).toEqual(secondBuild.files);
    expect(firstBuild.files).toHaveLength(4);
    const firstRoot = await mkdtemp(join(tmpdir(), 'neg-layer-cycle-write-a-'));
    const secondRoot = await mkdtemp(join(tmpdir(), 'neg-layer-cycle-write-b-'));
    temporaryDirectories.push(firstRoot, secondRoot);
    const firstDirectory = join(firstRoot, 'NEG-LAYER-CYCLE');
    const secondDirectory = join(secondRoot, 'NEG-LAYER-CYCLE');
    await writeNegLayerCycleCandidateBundleV1(firstDirectory);
    await writeNegLayerCycleCandidateBundleV1(secondDirectory);
    for (const file of firstBuild.files) {
      expect(await readFile(join(firstDirectory, file.path))).toEqual(
        await readFile(join(secondDirectory, file.path)),
      );
    }
    expect((await verifyNegLayerCycleCandidateBundleV1(firstDirectory)).reasonCodes).toEqual([]);
    expect((await verifyNegLayerCycleCandidateBundleV1(secondDirectory)).reasonCodes).toEqual([]);
  });

  it('verifies the committed bundle with every downstream claim boundary false', () => {
    expect(committedVerification).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      globalM0fGate: 'not-evaluated',
      canonicalPromotionClaimed: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      physicalLayerOrderEstablished: false,
      orderReversalDetectionIncluded: false,
      contactLegalityEstablished: false,
      pathContinuityEstablished: false,
      collisionDetectionIncluded: false,
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

  it('keeps NEG-LAYER-CYCLE outside the canonical manifest', async () => {
    const parsed = parseFixtureManifest(await jsonFile(resolve('tests/fixtures/manifest.json')));
    expect(parsed.manifest).toBeDefined();
    expect(parsed.manifest?.fixtures.some((fixture) => fixture.id === 'NEG-LAYER-CYCLE')).toBe(
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
    expect(await runNegLayerCycleCandidateBundleCli(['--verify'], io)).toBe(0);
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    expect(stderr).toEqual([]);
    const root = await mkdtemp(join(tmpdir(), 'neg-layer-cycle-cli-'));
    temporaryDirectories.push(root);
    const destination = join(root, 'bundle');
    stdout.length = 0;
    expect(await runNegLayerCycleCandidateBundleCli(['--write', destination, '--json'], io)).toBe(
      0,
    );
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(await runNegLayerCycleCandidateBundleCli(['--unknown'], io)).toBe(2);
  });

  it('rejects raw tampering, extra entries, links, and unsafe writer cleanup', async () => {
    const tampered = await copyBundle('neg-layer-cycle-tamper-');
    await writeFile(join(tampered, 'layer-cycle.json'), '{}\n', 'utf8');
    expect((await verifyNegLayerCycleCandidateBundleV1(tampered)).reasonCodes).toEqual([
      'artifact-hash-mismatch',
    ]);
    const extra = await copyBundle('neg-layer-cycle-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect((await verifyNegLayerCycleCandidateBundleV1(extra)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
    await expect(writeNegLayerCycleCandidateBundleV1(extra)).rejects.toThrow('unexpected entry');
    const linked = await copyBundle('neg-layer-cycle-link-');
    const linkPath = join(linked, 'layer-cycle.json');
    await rm(linkPath);
    await symlink(BUNDLE_DIRECTORY, linkPath, 'junction');
    expect((await verifyNegLayerCycleCandidateBundleV1(linked)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-layer-cycle-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-layer-cycle',
      NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1,
    );
    expect((await verifyNegLayerCycleCandidateBundleV1(directory)).reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a coherently rehashed accepted saved-control rewrite', async () => {
    const directory = await copyBundle('neg-layer-cycle-control-');
    const control = record(await jsonFile(join(directory, 'control-fold.json')));
    control.contractId = 'CONTRACT-FOLD-TWO-FACE-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-fold', control);
    const result = await verifyNegLayerCycleCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks.everySavedControlAccepted).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });

  it('rejects a coherent source rewrite that changes rejection into acceptance', async () => {
    const directory = await copyBundle('neg-layer-cycle-signature-');
    const source = record(await jsonFile(join(directory, 'layer-cycle.json')));
    const reverse = record(array(source.layerEvents)[1]);
    reverse.interval = [0, 0];
    expect(parseArtifactContractV1(source)).toMatchObject({ ok: true });
    expect(jsonDifferencePaths(NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1, source)).toEqual([
      '$.layerEvents[1]',
    ]);
    await coherentlyRewriteArtifact(directory, 'source-layer-cycle', source);
    expect((await verifyNegLayerCycleCandidateBundleV1(directory)).reasonCodes).toEqual([
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a coherently rehashed source whose complete issue signature changes', async () => {
    const directory = await copyBundle('neg-layer-cycle-parser-signature-');
    const source = record(await jsonFile(join(directory, 'layer-cycle.json')));
    const reverse = record(array(source.layerEvents)[1]);
    reverse.belowFaceId = 'f-left';
    expect(jsonDifferencePaths(NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1, source)).toEqual([
      '$.layerEvents[1]',
    ]);
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('changed-signature rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents[1]', code: 'invalid-layer-relation' },
      { path: '$.layerEvents', code: 'layer-cycle' },
    ]);
    await coherentlyRewriteArtifact(directory, 'source-layer-cycle', source);
    const verification = await verifyNegLayerCycleCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual([
      'parser-issue-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(verification.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(verification.checks.everySourceRejected).toBe(true);
    expect(verification.checks.everyOrderedIssueSignatureMatched).toBe(false);
  });

  it('rejects a coherent wrong delta even when the complete parser oracle is unchanged', async () => {
    const directory = await copyBundle('neg-layer-cycle-delta-');
    const source = record(await jsonFile(join(directory, 'layer-cycle.json')));
    source.contractId = 'CONTRACT-FOLD-TWO-FACE-DELTA-V1';
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('wrong-delta rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_LAYER_CYCLE_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(directory, 'source-layer-cycle', source);
    expect((await verifyNegLayerCycleCandidateBundleV1(directory)).reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects different source bytes with the same delta and complete parser oracle', async () => {
    const directory = await copyBundle('neg-layer-cycle-same-oracle-');
    const source = record(await jsonFile(join(directory, 'layer-cycle.json')));
    record(array(source.layerEvents)[1]).id = 'layer-reverse-terminal-alternate';
    expect(jsonDifferencePaths(NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1, source)).toEqual([
      '$.layerEvents[1]',
    ]);
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('same-oracle rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_LAYER_CYCLE_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(directory, 'source-layer-cycle', source);
    const verification = await verifyNegLayerCycleCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(verification.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(verification.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
