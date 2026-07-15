import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { runNegPathMotionMapMismatchCandidateBundleCli } from '../../m0f/neg-path-motion-map-mismatch-candidate-bundle-cli.js';
import {
  NEG_PATH_MOTION_MAP_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_PATH_MOTION_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1,
  NEG_PATH_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
  buildNegPathMotionMapMismatchCandidateBundleV1,
  jsonDifferencePaths,
  parseNegPathMotionMapMismatchCandidateBundleLedgerV1,
  verifyNegPathMotionMapMismatchCandidateBundleV1,
  writeNegPathMotionMapMismatchCandidateBundleV1,
} from '../../m0f/neg-path-motion-map-mismatch-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(NEG_PATH_MOTION_MAP_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY);
const SCHEMA_PATH = resolve(
  'm0f/schemas/neg-path-motion-map-mismatch-candidate-bundle-ledger-v1.schema.json',
);

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('expected object');
  }
  return value as JsonRecord;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new TypeError('expected array');
  return value;
}

async function jsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

function firstSegmentMotion(document: JsonRecord): JsonRecord {
  const candidate = record(document.pathCandidate);
  const firstSegment = record(array(candidate.segments)[0]);
  return record(firstSegment.motion);
}

const temporaryDirectories: string[] = [];

async function copyBundle(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  const directory = join(root, 'bundle');
  await writeNegPathMotionMapMismatchCandidateBundleV1(directory);
  return directory;
}

async function coherentlyRewriteArtifactText(
  directory: string,
  artifactId: string,
  text: string,
): Promise<void> {
  const ledgerPath = join(directory, NEG_PATH_MOTION_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME);
  const ledger = record(await jsonFile(ledgerPath));
  const artifacts = array(ledger.artifacts).map(record);
  const artifact = artifacts.find((entry) => entry.artifactId === artifactId);
  if (artifact === undefined || typeof artifact.path !== 'string') {
    throw new TypeError(`missing ${artifactId}`);
  }
  await writeFile(join(directory, artifact.path), text, 'utf8');
  artifact.sha256 = sha256Prefixed(text);
  await writeFile(ledgerPath, `${stableStringify(ledger)}\n`, 'utf8');
}

async function coherentlyRewriteArtifact(
  directory: string,
  artifactId: string,
  value: unknown,
): Promise<void> {
  await coherentlyRewriteArtifactText(directory, artifactId, `${stableStringify(value)}\n`);
}

describe('NEG-PATH-MUTATION-MOTION-MAP-MISMATCH exact-negative candidate bundle', () => {
  let committedLedger: JsonRecord;
  let committedVerification: Awaited<
    ReturnType<typeof verifyNegPathMotionMapMismatchCandidateBundleV1>
  >;
  let validate: ReturnType<Ajv2020['compile']>;

  beforeAll(async () => {
    committedLedger = record(
      await jsonFile(
        join(BUNDLE_DIRECTORY, NEG_PATH_MOTION_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME),
      ),
    );
    const schema = record(await jsonFile(SCHEMA_PATH));
    validate = new Ajv2020({ strict: true, allErrors: true }).compile(record(schema));
    committedVerification = await verifyNegPathMotionMapMismatchCandidateBundleV1();
  });

  afterAll(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('keeps the fresh three-face/two-hinge control accepted', () => {
    expect(
      parseArtifactContractV1(NEG_PATH_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1),
    ).toMatchObject({ ok: true });
    const firstMotion = firstSegmentMotion(
      structuredClone(
        NEG_PATH_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
      ) as unknown as JsonRecord,
    );
    expect(array(firstMotion.anglesByCrease)).toHaveLength(2);
    expect(array(firstMotion.intervalAngleBoundsByCrease)).toHaveLength(2);
  });

  it('fixes the sole deletion path and complete sole parser issue', () => {
    expect(
      jsonDifferencePaths(
        NEG_PATH_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
        NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument,
      ),
    ).toEqual(NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1.changedPaths);
    const result = parseArtifactContractV1(
      NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1.expectedIssues,
    );
  });

  it('suppresses adjacent endpoint-map secondary inference for the invalid first segment', () => {
    const result = parseArtifactContractV1(
      NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map((issue) => issue.code)).toEqual(['motion-map-mismatch']);
  });

  it('matches the committed control and source bytes exactly', async () => {
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'control-design.json'))).toEqual(
      NEG_PATH_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'path-motion-map-mismatch.json'))).toEqual(
      NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument,
    );
  });

  it('strict-compiles the Draft 2020-12 schema and validates the ledger', () => {
    expect(validate(committedLedger), JSON.stringify(validate.errors)).toBe(true);
    expect(parseNegPathMotionMapMismatchCandidateBundleLedgerV1(committedLedger).ok).toBe(true);
  });

  it('rejects unknown and missing root fields in both schema and runtime parser', () => {
    const extra = structuredClone(committedLedger);
    extra.unexpected = false;
    const missing = structuredClone(committedLedger);
    delete missing.scope;
    for (const changed of [extra, missing]) {
      expect(validate(changed)).toBe(false);
      expect(parseNegPathMotionMapMismatchCandidateBundleLedgerV1(changed).ok).toBe(false);
    }
  });

  it('rejects case delta and oracle escalation in both schema and runtime parser', () => {
    const changed = structuredClone(committedLedger);
    const row = record(array(changed.cases)[0]);
    row.expectedIssues = [];
    expect(validate(changed)).toBe(false);
    expect(parseNegPathMotionMapMismatchCandidateBundleLedgerV1(changed).ok).toBe(false);
  });

  it.each([
    'canonicalPathMutationFamilyComplete',
    'creaseMapCompletenessEstablished',
    'physicalHingeDriftDetectionIncluded',
    'physicalAngleBoundsEstablished',
    'conservativeAngleBoundsEstablished',
    'physicalPathContinuityEstablished',
    'endpointContinuityEstablished',
    'piecewisePolynomialEndpointInferenceIncluded',
    'rigidityEstablished',
    'faceIsometryEstablished',
    'hingeGeometryEstablished',
    'certificateHashVerificationIncluded',
    'cryptographicAuthenticityEstablished',
    'contactAnalysisIncluded',
    'continuousCollisionDetectionIncluded',
    'collisionDetectionIncluded',
    'collisionFreedomEstablished',
    'foldabilityEstablished',
    'supportProfileIncluded',
    'toleranceProfileIncluded',
    'scientificVerificationClaimed',
  ])('rejects the %s claim escalation', (field) => {
    const changed = structuredClone(committedLedger);
    changed[field] = true;
    expect(validate(changed)).toBe(false);
    expect(parseNegPathMotionMapMismatchCandidateBundleLedgerV1(changed).ok).toBe(false);
  });

  it('builds twice as the same closed four-file set', () => {
    const first = buildNegPathMotionMapMismatchCandidateBundleV1();
    const second = buildNegPathMotionMapMismatchCandidateBundleV1();
    expect(first.files).toEqual(second.files);
    expect(first.files).toHaveLength(4);
  });

  it('verifies all checks while keeping downstream claims false', () => {
    expect(committedVerification).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      declaredBoundedInterpolationMotionMapPairingParserOnly: true,
      globalM0fGate: 'not-evaluated',
      canonicalPromotionClaimed: false,
      canonicalPathMutationFamilyComplete: false,
      creaseMapCompletenessEstablished: false,
      physicalHingeDriftDetectionIncluded: false,
      physicalAngleBoundsEstablished: false,
      conservativeAngleBoundsEstablished: false,
      physicalPathContinuityEstablished: false,
      endpointContinuityEstablished: false,
      piecewisePolynomialEndpointInferenceIncluded: false,
      rigidityEstablished: false,
      faceIsometryEstablished: false,
      hingeGeometryEstablished: false,
      certificateHashVerificationIncluded: false,
      cryptographicAuthenticityEstablished: false,
      contactAnalysisIncluded: false,
      continuousCollisionDetectionIncluded: false,
      collisionDetectionIncluded: false,
      collisionFreedomEstablished: false,
      foldabilityEstablished: false,
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

  it('keeps the candidate case outside the canonical manifest', async () => {
    const parsed = parseFixtureManifest(await jsonFile(resolve('tests/fixtures/manifest.json')));
    expect(parsed.manifest).toBeDefined();
    expect(
      parsed.manifest?.fixtures.some(
        (fixture) => fixture.id === 'NEG-PATH-MUTATION-MOTION-MAP-MISMATCH',
      ),
    ).toBe(false);
  });

  it('supports deterministic CLI verify and write', async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = {
      cwd: process.cwd(),
      stdout: (text: string) => stdout.push(text),
      stderr: (text: string) => stderr.push(text),
    };
    expect(await runNegPathMotionMapMismatchCandidateBundleCli(['--verify'], io)).toBe(0);
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    const root = await mkdtemp(join(tmpdir(), 'neg-path-motion-map-mismatch-cli-'));
    temporaryDirectories.push(root);
    stdout.length = 0;
    expect(
      await runNegPathMotionMapMismatchCandidateBundleCli(
        ['--write', join(root, 'bundle'), '--json'],
        io,
      ),
    ).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(stderr).toEqual([]);
  });

  it('rejects invalid CLI options', async () => {
    const stderr: string[] = [];
    expect(
      await runNegPathMotionMapMismatchCandidateBundleCli(['--unknown'], {
        cwd: process.cwd(),
        stdout: () => undefined,
        stderr: (text: string) => stderr.push(text),
      }),
    ).toBe(2);
    expect(stderr.join('')).toContain('Usage:');
  });

  it('rejects raw source tampering', async () => {
    const directory = await copyBundle('neg-path-motion-map-mismatch-raw-');
    await writeFile(join(directory, 'path-motion-map-mismatch.json'), '{}\n', 'utf8');
    expect((await verifyNegPathMotionMapMismatchCandidateBundleV1(directory)).reasonCodes).toEqual([
      'artifact-hash-mismatch',
    ]);
  });

  it('rejects extra entries', async () => {
    const directory = await copyBundle('neg-path-motion-map-mismatch-extra-');
    await writeFile(join(directory, 'extra.json'), '{}\n', 'utf8');
    expect((await verifyNegPathMotionMapMismatchCandidateBundleV1(directory)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
  });

  it('rejects links and unsafe writer cleanup', async () => {
    const directory = await copyBundle('neg-path-motion-map-mismatch-link-');
    const sourcePath = join(directory, 'path-motion-map-mismatch.json');
    await rm(sourcePath);
    await symlink(BUNDLE_DIRECTORY, sourcePath, 'junction');
    expect((await verifyNegPathMotionMapMismatchCandidateBundleV1(directory)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
    await expect(writeNegPathMotionMapMismatchCandidateBundleV1(directory)).rejects.toThrow(
      'unexpected entry',
    );
  });

  it('refuses writer cleanup of an unexpected regular file', async () => {
    const directory = await copyBundle('neg-path-motion-map-mismatch-writer-');
    await writeFile(join(directory, 'unexpected.txt'), 'keep\n', 'utf8');
    await expect(writeNegPathMotionMapMismatchCandidateBundleV1(directory)).rejects.toThrow(
      'unexpected entry',
    );
    expect(await readFile(join(directory, 'unexpected.txt'), 'utf8')).toBe('keep\n');
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-path-motion-map-mismatch-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-path-motion-map-mismatch',
      NEG_PATH_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
    );
    expect((await verifyNegPathMotionMapMismatchCandidateBundleV1(directory)).reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a coherently rehashed shifted saved-control anchor', async () => {
    const directory = await copyBundle('neg-path-motion-map-mismatch-control-');
    const control = record(await jsonFile(join(directory, 'control-design.json')));
    control.contractId = 'CONTRACT-DESIGN-THREE-FACE-MOTION-MAP-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-design', control);
    const result = await verifyNegPathMotionMapMismatchCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks.everySavedControlAccepted).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });

  it('rejects the same deletion delta when its complete parser signature changes', async () => {
    const directory = await copyBundle('neg-path-motion-map-mismatch-signature-');
    const source = record(await jsonFile(join(directory, 'path-motion-map-mismatch.json')));
    array(firstSegmentMotion(source).intervalAngleBoundsByCrease).push(null);
    expect(
      jsonDifferencePaths(NEG_PATH_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1, source),
    ).toEqual(NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('changed-signature source must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      {
        path: '$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[1]',
        code: 'invalid-object',
      },
      { path: '$.pathCandidate.segments[0].motion', code: 'motion-map-mismatch' },
    ]);
    await coherentlyRewriteArtifact(directory, 'source-path-motion-map-mismatch', source);
    const result = await verifyNegPathMotionMapMismatchCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual([
      'parser-issue-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
  });

  it('rejects a wrong delta even when the complete parser oracle is unchanged', async () => {
    const directory = await copyBundle('neg-path-motion-map-mismatch-delta-');
    const source = record(await jsonFile(join(directory, 'path-motion-map-mismatch.json')));
    source.contractId = 'CONTRACT-DESIGN-THREE-FACE-MOTION-MAP-DELTA-V1';
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('wrong-delta source must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(directory, 'source-path-motion-map-mismatch', source);
    expect((await verifyNegPathMotionMapMismatchCandidateBundleV1(directory)).reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects different bytes with the same deletion delta and complete parser oracle', async () => {
    const directory = await copyBundle('neg-path-motion-map-mismatch-bytes-');
    const source = record(await jsonFile(join(directory, 'path-motion-map-mismatch.json')));
    expect(
      jsonDifferencePaths(NEG_PATH_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1, source),
    ).toEqual(NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('saved source must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_MOTION_MAP_MISMATCH_CASE_SPEC_V1.expectedIssues,
    );
    const rewrittenText = `${JSON.stringify(source, null, 2)}\n`;
    expect(rewrittenText).not.toBe(`${stableStringify(source)}\n`);
    await coherentlyRewriteArtifactText(
      directory,
      'source-path-motion-map-mismatch',
      rewrittenText,
    );
    const result = await verifyNegPathMotionMapMismatchCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
