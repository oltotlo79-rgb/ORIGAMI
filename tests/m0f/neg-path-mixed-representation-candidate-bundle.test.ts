import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { runNegPathMixedRepresentationCandidateBundleCli } from '../../m0f/neg-path-mixed-representation-candidate-bundle-cli.js';
import {
  NEG_PATH_MIXED_REPRESENTATION_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_PATH_MIXED_REPRESENTATION_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_PATH_MIXED_REPRESENTATION_CASE_SPEC_V1,
  NEG_PATH_MIXED_REPRESENTATION_FOLD_CONTROL_SOURCE_V1,
  mixedRepresentationJsonDifferencePaths,
  buildNegPathMixedRepresentationCandidateBundleV1,
  parseNegPathMixedRepresentationCandidateBundleLedgerV1,
  verifyNegPathMixedRepresentationCandidateBundleV1,
  writeNegPathMixedRepresentationCandidateBundleV1,
} from '../../m0f/neg-path-mixed-representation-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(NEG_PATH_MIXED_REPRESENTATION_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY);
const SCHEMA_PATH = resolve(
  'm0f/schemas/neg-path-mixed-representation-candidate-bundle-ledger-v1.schema.json',
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

function segmentMotion(document: JsonRecord, index: number): JsonRecord {
  const pathCandidate = record(document.pathCandidate);
  return record(record(array(pathCandidate.segments)[index]).motion);
}

const temporaryDirectories: string[] = [];

async function copyBundle(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  const directory = join(root, 'bundle');
  await writeNegPathMixedRepresentationCandidateBundleV1(directory);
  return directory;
}

async function coherentlyRewriteArtifactText(
  directory: string,
  artifactId: string,
  text: string,
): Promise<void> {
  const ledgerPath = join(
    directory,
    NEG_PATH_MIXED_REPRESENTATION_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  );
  const ledger = record(await jsonFile(ledgerPath));
  const artifact = array(ledger.artifacts)
    .map(record)
    .find((entry) => entry.artifactId === artifactId);
  if (artifact === undefined || typeof artifact.path !== 'string')
    throw new TypeError('missing artifact');
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

describe('NEG-PATH-MUTATION-MIXED-REPRESENTATION candidate bundle', () => {
  let committedLedger: JsonRecord;
  let validate: ReturnType<Ajv2020['compile']>;
  let committedVerification: Awaited<
    ReturnType<typeof verifyNegPathMixedRepresentationCandidateBundleV1>
  >;

  beforeAll(async () => {
    committedLedger = record(
      await jsonFile(
        join(BUNDLE_DIRECTORY, NEG_PATH_MIXED_REPRESENTATION_CANDIDATE_BUNDLE_LEDGER_FILENAME),
      ),
    );
    validate = new Ajv2020({ strict: true, allErrors: true }).compile(
      record(await jsonFile(SCHEMA_PATH)),
    );
    committedVerification = await verifyNegPathMixedRepresentationCandidateBundleV1();
  });

  afterAll(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('keeps both bounded segments of the owned control freshly accepted', () => {
    expect(
      parseArtifactContractV1(NEG_PATH_MIXED_REPRESENTATION_FOLD_CONTROL_SOURCE_V1),
    ).toMatchObject({ ok: true });
    const control = structuredClone(
      NEG_PATH_MIXED_REPRESENTATION_FOLD_CONTROL_SOURCE_V1,
    ) as unknown as JsonRecord;
    expect(segmentMotion(control, 0)).toMatchObject({
      kind: 'bounded-interpolation',
      knotTimes: [0, 0.5],
    });
    expect(segmentMotion(control, 1)).toMatchObject({
      kind: 'bounded-interpolation',
      knotTimes: [0.5, 1],
    });
  });

  it('fixes the exact seven-path replacement and sole complete parser oracle', () => {
    expect(
      mixedRepresentationJsonDifferencePaths(
        NEG_PATH_MIXED_REPRESENTATION_FOLD_CONTROL_SOURCE_V1,
        NEG_PATH_MIXED_REPRESENTATION_CASE_SPEC_V1.sourceDocument,
      ),
    ).toEqual(NEG_PATH_MIXED_REPRESENTATION_CASE_SPEC_V1.changedPaths);
    const result = parseArtifactContractV1(
      NEG_PATH_MIXED_REPRESENTATION_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_MIXED_REPRESENTATION_CASE_SPEC_V1.expectedIssues,
    );
  });

  it('fixes absence of all secondary path diagnostics', () => {
    const result = parseArtifactContractV1(
      NEG_PATH_MIXED_REPRESENTATION_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map((issue) => issue.code)).toEqual(['mixed-path-representation']);
  });

  it('matches the committed control and source exactly', async () => {
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'control-fold.json'))).toEqual(
      NEG_PATH_MIXED_REPRESENTATION_FOLD_CONTROL_SOURCE_V1,
    );
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'path-mixed-representation.json'))).toEqual(
      NEG_PATH_MIXED_REPRESENTATION_CASE_SPEC_V1.sourceDocument,
    );
  });

  it('strict-compiles the Draft 2020-12 schema and validates the runtime ledger', () => {
    expect(validate(committedLedger), JSON.stringify(validate.errors)).toBe(true);
    expect(parseNegPathMixedRepresentationCandidateBundleLedgerV1(committedLedger).ok).toBe(true);
  });

  it('rejects unknown, missing, and changed case fields', () => {
    const extra = structuredClone(committedLedger);
    extra.unexpected = false;
    const missing = structuredClone(committedLedger);
    delete missing.scope;
    const caseChanged = structuredClone(committedLedger);
    record(array(caseChanged.cases)[0]).expectedIssues = [];
    for (const changed of [extra, missing, caseChanged]) {
      expect(validate(changed)).toBe(false);
      expect(parseNegPathMixedRepresentationCandidateBundleLedgerV1(changed).ok).toBe(false);
    }
  });

  it.each([
    'canonicalPathMutationFamilyComplete',
    'representationSelectionEstablished',
    'boundedInterpolationBasisFrozen',
    'piecewisePolynomialBasisFrozen',
    'crossRepresentationSemanticInferenceIncluded',
    'piecewisePolynomialEndpointInferenceIncluded',
    'intervalProofIncluded',
    'boundedInterpolationEndpointContinuityEstablished',
    'polynomialCoefficientSemanticsEstablished',
    'polynomialDerivativeBoundsSemanticsEstablished',
    'crossRepresentationEndpointContinuityEstablished',
    'physicalPathContinuityEstablished',
    'endpointContinuityEstablished',
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
  ])('rejects %s claim escalation', (field) => {
    const changed = structuredClone(committedLedger);
    changed[field] = true;
    expect(validate(changed)).toBe(false);
    expect(parseNegPathMixedRepresentationCandidateBundleLedgerV1(changed).ok).toBe(false);
  });

  it('builds the same closed four-file set twice', () => {
    const first = buildNegPathMixedRepresentationCandidateBundleV1();
    expect(first.files).toEqual(buildNegPathMixedRepresentationCandidateBundleV1().files);
    expect(first.files).toHaveLength(4);
  });

  it('verifies every check while keeping downstream claims false', () => {
    expect(committedVerification).toMatchObject({
      declaredPathRepresentationUniformityParserOnly: true,
      canonicalPromotionClaimed: false,
      canonicalPathMutationFamilyComplete: false,
      representationSelectionEstablished: false,
      boundedInterpolationEndpointContinuityEstablished: false,
      crossRepresentationEndpointContinuityEstablished: false,
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

  it('keeps the case outside the canonical manifest', async () => {
    const parsed = parseFixtureManifest(await jsonFile(resolve('tests/fixtures/manifest.json')));
    expect(
      parsed.manifest?.fixtures.some(
        (fixture) => fixture.id === 'NEG-PATH-MUTATION-MIXED-REPRESENTATION',
      ),
    ).toBe(false);
  });

  it('supports CLI verify/write and rejects invalid options', async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = {
      cwd: process.cwd(),
      stdout: (text: string) => stdout.push(text),
      stderr: (text: string) => stderr.push(text),
    };
    expect(await runNegPathMixedRepresentationCandidateBundleCli(['--verify'], io)).toBe(0);
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    const root = await mkdtemp(join(tmpdir(), 'neg-path-mixed-representation-cli-'));
    temporaryDirectories.push(root);
    stdout.length = 0;
    expect(
      await runNegPathMixedRepresentationCandidateBundleCli(
        ['--write', join(root, 'bundle'), '--json'],
        io,
      ),
    ).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(await runNegPathMixedRepresentationCandidateBundleCli(['--unknown'], io)).toBe(2);
  });

  it('rejects raw tampering and extra entries', async () => {
    const raw = await copyBundle('neg-path-mixed-representation-raw-');
    await writeFile(join(raw, 'path-mixed-representation.json'), '{}\n', 'utf8');
    expect((await verifyNegPathMixedRepresentationCandidateBundleV1(raw)).reasonCodes).toEqual([
      'artifact-hash-mismatch',
    ]);
    const extra = await copyBundle('neg-path-mixed-representation-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect((await verifyNegPathMixedRepresentationCandidateBundleV1(extra)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
  });

  it('rejects links and unsafe writer cleanup', async () => {
    const directory = await copyBundle('neg-path-mixed-representation-link-');
    const sourcePath = join(directory, 'path-mixed-representation.json');
    await rm(sourcePath);
    await symlink(BUNDLE_DIRECTORY, sourcePath, 'junction');
    expect(
      (await verifyNegPathMixedRepresentationCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['artifact-set-mismatch']);
    await expect(writeNegPathMixedRepresentationCandidateBundleV1(directory)).rejects.toThrow(
      'unexpected entry',
    );
  });

  it('refuses cleanup of an unexpected regular file', async () => {
    const directory = await copyBundle('neg-path-mixed-representation-writer-');
    await writeFile(join(directory, 'keep.txt'), 'keep\n', 'utf8');
    await expect(writeNegPathMixedRepresentationCandidateBundleV1(directory)).rejects.toThrow(
      'unexpected entry',
    );
    expect(await readFile(join(directory, 'keep.txt'), 'utf8')).toBe('keep\n');
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-path-mixed-representation-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-path-mixed-representation',
      NEG_PATH_MIXED_REPRESENTATION_FOLD_CONTROL_SOURCE_V1,
    );
    expect(
      (await verifyNegPathMixedRepresentationCandidateBundleV1(directory)).reasonCodes,
    ).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a shifted but accepted saved-control anchor', async () => {
    const directory = await copyBundle('neg-path-mixed-representation-control-');
    const control = record(await jsonFile(join(directory, 'control-fold.json')));
    control.contractId = 'CONTRACT-FOLD-MIXED-REPRESENTATION-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-fold', control);
    expect(
      (await verifyNegPathMixedRepresentationCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects the same seven paths when its complete parser oracle changes', async () => {
    const directory = await copyBundle('neg-path-mixed-representation-signature-');
    const source = record(await jsonFile(join(directory, 'path-mixed-representation.json')));
    const coefficientRow = record(array(segmentMotion(source, 1).coefficientsByCrease)[0]);
    array(array(coefficientRow.coefficients)[0])[0] = null;
    expect(
      mixedRepresentationJsonDifferencePaths(
        NEG_PATH_MIXED_REPRESENTATION_FOLD_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_MIXED_REPRESENTATION_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('changed oracle must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      {
        path: '$.pathCandidate.segments[1].motion.kind',
        code: 'mixed-path-representation',
      },
      {
        path: '$.pathCandidate.segments[1].motion.coefficientsByCrease[0].coefficients[0][0]',
        code: 'non-finite-number',
      },
    ]);
    await coherentlyRewriteArtifact(directory, 'source-path-mixed-representation', source);
    expect(
      (await verifyNegPathMixedRepresentationCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['parser-issue-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects a wrong delta with the same complete parser oracle', async () => {
    const directory = await copyBundle('neg-path-mixed-representation-delta-');
    const source = record(await jsonFile(join(directory, 'path-mixed-representation.json')));
    source.contractId = 'CONTRACT-FOLD-MIXED-REPRESENTATION-DELTA-V1';
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('wrong delta must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_MIXED_REPRESENTATION_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(directory, 'source-path-mixed-representation', source);
    expect(
      (await verifyNegPathMixedRepresentationCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects different bytes with the same delta and complete oracle', async () => {
    const directory = await copyBundle('neg-path-mixed-representation-bytes-');
    const source = record(await jsonFile(join(directory, 'path-mixed-representation.json')));
    const text = `${JSON.stringify(source, null, 2)}\n`;
    await coherentlyRewriteArtifactText(directory, 'source-path-mixed-representation', text);
    const result = await verifyNegPathMixedRepresentationCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
