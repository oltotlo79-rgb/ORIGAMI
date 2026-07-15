import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { runNegTopologyCandidateBundleCli } from '../../m0f/neg-topology-candidate-bundle-cli.js';
import {
  buildNegTopologyCandidateBundleV1,
  NEG_TOPOLOGY_ARTIFACT_SPECS_V1,
  NEG_TOPOLOGY_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCHEMA_ID,
  NEG_TOPOLOGY_CASE_SPECS_V1,
  NEG_TOPOLOGY_FILLED_ANNULUS_CONTROL_SOURCE_V1,
  NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1,
  parseNegTopologyCandidateBundleLedgerV1,
  verifyNegTopologyCandidateBundleV1,
  writeNegTopologyCandidateBundleV1,
  type NegTopologyCandidateVerificationResultV1,
} from '../../m0f/neg-topology-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(NEG_TOPOLOGY_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY);
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

async function jsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

async function copyBundle(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  const destination = join(root, 'NEG-TOPOLOGY');
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
  const ledgerPath = join(directory, NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME);
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

function controlForCase(controlArtifactId: string): unknown {
  if (controlArtifactId === 'control-primary-design') {
    return NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1;
  }
  if (controlArtifactId === 'control-filled-annulus-fold') {
    return NEG_TOPOLOGY_FILLED_ANNULUS_CONTROL_SOURCE_V1;
  }
  throw new TypeError(`unknown test control ${controlArtifactId}`);
}

let committedVerification: NegTopologyCandidateVerificationResultV1;

beforeAll(async () => {
  committedVerification = await verifyNegTopologyCandidateBundleV1();
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('NEG-TOPOLOGY exact-negative candidate bundle', () => {
  it('saves and freshly accepts both exact project-authored control payloads', async () => {
    const savedPrimary = await jsonFile(join(BUNDLE_DIRECTORY, 'control-primary-design.json'));
    const savedAnnulus = await jsonFile(join(BUNDLE_DIRECTORY, 'control-filled-annulus-fold.json'));
    expect(savedPrimary).toEqual(NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1);
    expect(savedPrimary).toEqual(
      await jsonFile(resolve('tests/vectors/m0f-0/artifact-contract-design-v1.json')),
    );
    expect(savedAnnulus).toEqual(NEG_TOPOLOGY_FILLED_ANNULUS_CONTROL_SOURCE_V1);
    expect(parseArtifactContractV1(savedPrimary)).toMatchObject({ ok: true });
    expect(parseArtifactContractV1(savedAnnulus)).toMatchObject({ ok: true });

    const annulus = record(savedAnnulus);
    const input = record(annulus.input);
    const mesh = record(annulus.creaseMesh);
    expect(array(input.verticesCoords)).toHaveLength(8);
    expect(array(input.edgesVertices)).toHaveLength(12);
    expect(array(input.facesVertices)).toHaveLength(5);
    expect(array(mesh.vertices)).toHaveLength(8);
    expect(array(mesh.edges)).toHaveLength(12);
    expect(array(mesh.faces)).toHaveLength(5);
  });

  it('fixes five case identities, complete sorted deltas, and saved source bytes', async () => {
    expect(NEG_TOPOLOGY_CASE_SPECS_V1.map((entry) => entry.caseId)).toEqual([
      'NEG-TOPOLOGY-UNSPLIT-CROSSING',
      'NEG-TOPOLOGY-DUPLICATE-EDGE',
      'NEG-TOPOLOGY-ZERO-AREA-FACE',
      'NEG-TOPOLOGY-HOLE',
      'NEG-TOPOLOGY-NON-MANIFOLD-EDGE',
    ]);
    for (const caseSpec of NEG_TOPOLOGY_CASE_SPECS_V1) {
      expect(
        jsonDifferencePaths(controlForCase(caseSpec.controlArtifactId), caseSpec.sourceDocument),
        caseSpec.caseId,
      ).toEqual(caseSpec.changedPaths);
      expect(await jsonFile(join(BUNDLE_DIRECTORY, caseSpec.sourcePath)), caseSpec.caseId).toEqual(
        caseSpec.sourceDocument,
      );
    }
  });

  it('freshly rejects all saved sources with each complete ordered code/path oracle', async () => {
    for (const caseSpec of NEG_TOPOLOGY_CASE_SPECS_V1) {
      const source = await jsonFile(join(BUNDLE_DIRECTORY, caseSpec.sourcePath));
      const replay = parseArtifactContractV1(source);
      expect(replay.ok, caseSpec.caseId).toBe(false);
      if (replay.ok) throw new TypeError('negative topology source must be rejected');
      expect(
        replay.error.map(({ path, code }) => ({ path, code })),
        caseSpec.caseId,
      ).toEqual(caseSpec.expectedIssues);
    }
  });

  it('uses a connected annulus mutation to isolate only the current disk Euler rejection', () => {
    const hole = requiredEntry(NEG_TOPOLOGY_CASE_SPECS_V1, 3);
    expect(hole).toMatchObject({
      caseId: 'NEG-TOPOLOGY-HOLE',
      controlArtifactId: 'control-filled-annulus-fold',
      expectedIssues: [{ path: '$.creaseMesh', code: 'euler-characteristic-mismatch' }],
    });
    expect(hole.changedPaths).toHaveLength(27);
    expect(hole.sourceDocument.creaseMesh.vertices).toHaveLength(8);
    expect(hole.sourceDocument.creaseMesh.edges).toHaveLength(12);
    expect(hole.sourceDocument.creaseMesh.faces).toHaveLength(4);
  });

  it('accepts the committed ledger in both the runtime parser and strict exact-row schema', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const parsed = parseNegTopologyCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('committed topology ledger must parse');
    expect(parsed.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      vectorSetId: 'NEG-TOPOLOGY-V1',
      canonicalManifestRegistration: 'not-registered',
      canonicalPromotionClaimed: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      scientificVerificationClaimed: false,
      globalM0fGate: 'not-evaluated',
      caseCount: 5,
      artifactCount: 8,
    });

    const schema = record(
      await jsonFile(resolve('m0f/schemas/neg-topology-candidate-bundle-ledger-v1.schema.json')),
    );
    expect(schema.$id).toBe(NEG_TOPOLOGY_CANDIDATE_BUNDLE_SCHEMA_ID);
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    expect(validate(ledger), JSON.stringify(validate.errors)).toBe(true);
  });

  it('fixes every artifact row and negative-to-control provenance dependency', async () => {
    const ledger = record(
      await jsonFile(join(BUNDLE_DIRECTORY, NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME)),
    );
    const artifacts = array(ledger.artifacts).map(record);
    expect(artifacts.map((entry) => entry.artifactId)).toEqual(
      NEG_TOPOLOGY_ARTIFACT_SPECS_V1.map((entry) => entry.artifactId),
    );
    for (const caseSpec of NEG_TOPOLOGY_CASE_SPECS_V1) {
      const artifact = artifacts.find((entry) => entry.artifactId === caseSpec.sourceArtifactId);
      expect(record(artifact?.provenance).dependsOnArtifactIds, caseSpec.caseId).toEqual([
        caseSpec.controlArtifactId,
      ]);
    }
  });

  it('rejects case, issue, artifact, identity, path, control-link, and delta rewrites', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const schema = record(
      await jsonFile(resolve('m0f/schemas/neg-topology-candidate-bundle-ledger-v1.schema.json')),
    );
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    const mutations: JsonRecord[] = [];

    const caseOrder = structuredClone(ledger) as JsonRecord;
    array(caseOrder.cases).reverse();
    mutations.push(caseOrder);

    const issueOrder = structuredClone(ledger) as JsonRecord;
    array(record(array(issueOrder.cases)[0]).expectedIssues).reverse();
    mutations.push(issueOrder);

    const artifactOrder = structuredClone(ledger) as JsonRecord;
    array(artifactOrder.artifacts).reverse();
    mutations.push(artifactOrder);

    for (const [field, value] of [
      ['caseId', 'NEG-TOPOLOGY-REWRITTEN'],
      ['sourcePath', 'rewritten.json'],
      ['controlArtifactId', 'control-filled-annulus-fold'],
      ['changedPaths', ['$.creaseMesh']],
    ] as const) {
      const changed = structuredClone(ledger) as JsonRecord;
      record(array(changed.cases)[0])[field] = value;
      mutations.push(changed);
    }

    const artifactPath = structuredClone(ledger) as JsonRecord;
    record(array(artifactPath.artifacts)[3]).path = 'rewritten.json';
    mutations.push(artifactPath);

    const artifactId = structuredClone(ledger) as JsonRecord;
    record(array(artifactId.artifacts)[3]).artifactId = 'source-rewritten';
    mutations.push(artifactId);

    const provenance = structuredClone(ledger) as JsonRecord;
    record(record(array(provenance.artifacts)[3]).provenance).dependsOnArtifactIds = [];
    mutations.push(provenance);

    for (const changed of mutations) {
      expect(validate(changed)).toBe(false);
      expect(parseNegTopologyCandidateBundleLedgerV1(changed).ok).toBe(false);
    }
  });

  it('rejects claim escalation and undeclared SupportProfile or verification objects', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_TOPOLOGY_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const schema = record(
      await jsonFile(resolve('m0f/schemas/neg-topology-candidate-bundle-ledger-v1.schema.json')),
    );
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    for (const [field, value] of [
      ['contractStatus', 'verified'],
      ['scientificClaim', true],
      ['canonicalPromotionClaimed', true],
      ['supportProfileIncluded', true],
      ['toleranceProfileIncluded', true],
      ['scientificVerificationClaimed', true],
      ['globalM0fGate', 'GO'],
      ['supportProfile', { id: 'invented' }],
      ['scientificVerification', { status: 'verified' }],
    ] as const) {
      const changed = structuredClone(ledger) as JsonRecord;
      changed[field] = value;
      expect(validate(changed), field).toBe(false);
      expect(parseNegTopologyCandidateBundleLedgerV1(changed).ok, field).toBe(false);
    }
  });

  it('builds twice and writes two isolated directories with byte-identical closed file sets', async () => {
    const firstBuild = buildNegTopologyCandidateBundleV1();
    const secondBuild = buildNegTopologyCandidateBundleV1();
    expect(firstBuild.files).toEqual(secondBuild.files);
    expect(firstBuild.files).toHaveLength(9);

    const firstRoot = await mkdtemp(join(tmpdir(), 'neg-topology-write-a-'));
    const secondRoot = await mkdtemp(join(tmpdir(), 'neg-topology-write-b-'));
    temporaryDirectories.push(firstRoot, secondRoot);
    const firstDirectory = join(firstRoot, 'NEG-TOPOLOGY');
    const secondDirectory = join(secondRoot, 'NEG-TOPOLOGY');
    await writeNegTopologyCandidateBundleV1(firstDirectory);
    await writeNegTopologyCandidateBundleV1(secondDirectory);
    for (const file of firstBuild.files) {
      expect(await readFile(join(firstDirectory, file.path))).toEqual(
        await readFile(join(secondDirectory, file.path)),
      );
    }
    expect((await verifyNegTopologyCandidateBundleV1(firstDirectory)).reasonCodes).toEqual([]);
    expect((await verifyNegTopologyCandidateBundleV1(secondDirectory)).reasonCodes).toEqual([]);
  });

  it('verifies the committed bundle and keeps all candidate claim boundaries false', () => {
    expect(committedVerification).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      globalM0fGate: 'not-evaluated',
      canonicalPromotionClaimed: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      scientificVerificationClaimed: false,
      reproducibleExactNegativeBundle: true,
      reasonCodes: [],
      checks: {
        ledgerPresentAndValid: true,
        artifactSetExact: true,
        allArtifactHashesMatch: true,
        allArtifactProvenanceFixed: true,
        canonicalManifestRegistrationAbsent: true,
        controlArtifactCount: 2,
        everyControlArtifactParsed: true,
        everySavedControlAccepted: true,
        sourceCaseCount: 5,
        everySourceParsed: true,
        everySourceControlDifferenceMatched: true,
        everySourceRejected: true,
        everyOrderedIssueSignatureMatched: true,
        deterministicRegenerationMatched: true,
      },
    });
  });

  it('keeps every NEG-TOPOLOGY case outside the canonical manifest', async () => {
    const parsed = parseFixtureManifest(await jsonFile(resolve('tests/fixtures/manifest.json')));
    expect(parsed.manifest).toBeDefined();
    expect(
      parsed.manifest?.fixtures.some((fixture) => fixture.id.startsWith('NEG-TOPOLOGY-')),
    ).toBe(false);
  });

  it('supports deterministic CLI verify and write while rejecting invalid options', async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = {
      cwd: process.cwd(),
      stdout: (text: string) => stdout.push(text),
      stderr: (text: string) => stderr.push(text),
    };
    expect(await runNegTopologyCandidateBundleCli(['--verify'], io)).toBe(0);
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    expect(stderr).toEqual([]);

    const root = await mkdtemp(join(tmpdir(), 'neg-topology-cli-'));
    temporaryDirectories.push(root);
    const destination = join(root, 'bundle');
    stdout.length = 0;
    expect(await runNegTopologyCandidateBundleCli(['--write', destination, '--json'], io)).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(await runNegTopologyCandidateBundleCli(['--unknown'], io)).toBe(2);
  });

  it('rejects raw byte tampering, extra entries, links, and unsafe writer cleanup', async () => {
    const tampered = await copyBundle('neg-topology-tamper-');
    await writeFile(join(tampered, 'unsplit-crossing.json'), '{}\n', 'utf8');
    expect((await verifyNegTopologyCandidateBundleV1(tampered)).reasonCodes).toEqual([
      'artifact-hash-mismatch',
    ]);

    const extra = await copyBundle('neg-topology-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect((await verifyNegTopologyCandidateBundleV1(extra)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
    await expect(writeNegTopologyCandidateBundleV1(extra)).rejects.toThrow('unexpected entry');

    const linked = await copyBundle('neg-topology-link-');
    const linkPath = join(linked, 'unsplit-crossing.json');
    await rm(linkPath);
    await symlink(BUNDLE_DIRECTORY, linkPath, 'junction');
    expect((await verifyNegTopologyCandidateBundleV1(linked)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-topology-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-unsplit-crossing',
      NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1,
    );
    const verification = await verifyNegTopologyCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a coherently rehashed accepted saved-control rewrite', async () => {
    const directory = await copyBundle('neg-topology-control-');
    const control = record(await jsonFile(join(directory, 'control-primary-design.json')));
    control.contractId = 'CONTRACT-DESIGN-TWO-LEAF-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-primary-design', control);
    const verification = await verifyNegTopologyCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(verification.checks.everySavedControlAccepted).toBe(true);
    expect(verification.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });

  it('rejects a coherently rehashed source with a changed ordered parser signature', async () => {
    const directory = await copyBundle('neg-topology-signature-');
    const source = record(await jsonFile(join(directory, 'unsplit-crossing.json')));
    const mesh = record(source.creaseMesh);
    const edge = record(array(mesh.edges)[7]);
    edge.assignment = 'B';
    edge.role = 'boundary';
    edge.sourceTreeEdgeIds = [];
    await coherentlyRewriteArtifact(directory, 'source-unsplit-crossing', source);
    const verification = await verifyNegTopologyCandidateBundleV1(directory);
    expect(verification.reasonCodes).toContain('parser-issue-mismatch');
    expect(verification.reasonCodes).toContain('deterministic-regeneration-mismatch');
    expect(verification.checks.everySourceControlDifferenceMatched).toBe(true);
  });

  it('rejects a coherent wrong delta even when the original parser oracle remains unchanged', async () => {
    const directory = await copyBundle('neg-topology-delta-');
    const source = record(await jsonFile(join(directory, 'unsplit-crossing.json')));
    source.contractId = 'CONTRACT-DESIGN-TWO-LEAF-DELTA-V1';
    await coherentlyRewriteArtifact(directory, 'source-unsplit-crossing', source);
    const verification = await verifyNegTopologyCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(verification.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });

  it('rejects different bytes even when the complete delta and parser oracle are unchanged', async () => {
    const directory = await copyBundle('neg-topology-same-oracle-');
    const source = record(await jsonFile(join(directory, 'unsplit-crossing.json')));
    const edge = record(array(record(source.creaseMesh).edges)[7]);
    edge.generationKey = 'tree:unsplit-crossing:alternate';
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('same-oracle rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      requiredEntry(NEG_TOPOLOGY_CASE_SPECS_V1, 0).expectedIssues,
    );
    expect(jsonDifferencePaths(NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1, source)).toEqual([
      '$.creaseMesh.edges[7]',
    ]);

    await coherentlyRewriteArtifact(directory, 'source-unsplit-crossing', source);
    const verification = await verifyNegTopologyCandidateBundleV1(directory);
    expect(verification.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(verification.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(verification.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
