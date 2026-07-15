import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { NEG_PATH_ANGLE_BOUND_FOLD_CONTROL_SOURCE_V1 } from '../../m0f/neg-path-angle-bound-candidate-bundle.js';
import { runNegPathRepresentationVersionMismatchCandidateBundleCli } from '../../m0f/neg-path-representation-version-mismatch-candidate-bundle-cli.js';
import {
  NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1,
  NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1,
  representationVersionMismatchJsonDifferencePaths,
  buildNegPathRepresentationVersionMismatchCandidateBundleV1,
  parseNegPathRepresentationVersionMismatchCandidateBundleLedgerV1,
  verifyNegPathRepresentationVersionMismatchCandidateBundleV1,
  writeNegPathRepresentationVersionMismatchCandidateBundleV1,
} from '../../m0f/neg-path-representation-version-mismatch-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(
  NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
);
const SCHEMA_PATH = resolve(
  'm0f/schemas/neg-path-representation-version-mismatch-candidate-bundle-ledger-v1.schema.json',
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

function boundedMotion(document: JsonRecord): JsonRecord {
  const pathCandidate = record(document.pathCandidate);
  const segment = record(array(pathCandidate.segments)[0]);
  return record(segment.motion);
}

function angleRows(document: JsonRecord): unknown[] {
  return array(boundedMotion(document).anglesByCrease);
}

function angleArray(document: JsonRecord, rowIndex = 0): unknown[] {
  const angleRow = record(angleRows(document)[rowIndex]);
  return array(angleRow.angles);
}

function intervalBoundRows(document: JsonRecord): unknown[] {
  return array(boundedMotion(document).intervalAngleBoundsByCrease);
}

function intervalBounds(document: JsonRecord, rowIndex = 0): unknown[] {
  return array(record(intervalBoundRows(document)[rowIndex]).bounds);
}

type JsonPath = readonly (string | number)[];

function valueAtPath(document: JsonRecord, path: JsonPath): unknown {
  let value: unknown = document;
  for (const part of path) {
    value = Array.isArray(value) ? value[Number(part)] : record(value)[String(part)];
  }
  return value;
}

function recursiveClosedLedgerMutations(document: JsonRecord): JsonRecord[] {
  const mutations: JsonRecord[] = [];
  const visit = (value: unknown, path: JsonPath): void => {
    const changed = structuredClone(document);
    const target = valueAtPath(changed, path);
    if (Array.isArray(value)) {
      array(target).push(null);
      mutations.push(changed);
      value.forEach((entry, index) => visit(entry, [...path, index]));
      return;
    }
    if (typeof value === 'object' && value !== null) {
      record(target).__unexpected = true;
      mutations.push(changed);
      for (const [key, entry] of Object.entries(record(value))) visit(entry, [...path, key]);
      return;
    }
    const parentPath = path.slice(0, -1);
    const finalPart = path.at(-1);

    if (finalPart === undefined) throw new TypeError('primitive root is unsupported');
    const parent = valueAtPath(changed, parentPath);
    const replacement =
      typeof value === 'string'
        ? `${value}-rewritten`
        : typeof value === 'number'
          ? value + 1
          : typeof value === 'boolean'
            ? !value
            : 'rewritten';
    if (Array.isArray(parent)) parent[Number(finalPart)] = replacement;
    else record(parent)[String(finalPart)] = replacement;
    mutations.push(changed);
  };
  visit(document, []);
  return mutations;
}

const temporaryDirectories: string[] = [];

async function copyBundle(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  const directory = join(root, 'bundle');
  await writeNegPathRepresentationVersionMismatchCandidateBundleV1(directory);
  return directory;
}

async function coherentlyRewriteArtifactText(
  directory: string,
  artifactId: string,
  text: string,
): Promise<void> {
  const ledgerPath = join(
    directory,
    NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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

describe('NEG-PATH-MUTATION-REPRESENTATION-VERSION-MISMATCH candidate bundle', () => {
  let committedLedger: JsonRecord;
  let validate: ReturnType<Ajv2020['compile']>;
  let committedVerification: Awaited<
    ReturnType<typeof verifyNegPathRepresentationVersionMismatchCandidateBundleV1>
  >;

  beforeAll(async () => {
    committedLedger = record(
      await jsonFile(
        join(
          BUNDLE_DIRECTORY,
          NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME,
        ),
      ),
    );
    validate = new Ajv2020({ strict: true, allErrors: true }).compile(
      record(await jsonFile(SCHEMA_PATH)),
    );
    committedVerification = await verifyNegPathRepresentationVersionMismatchCandidateBundleV1();
  });

  afterAll(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('keeps the owned bounded-interpolation control fully anchored and freshly accepted', () => {
    expect(
      parseArtifactContractV1(NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1),
    ).toMatchObject({ ok: true });
    expect(NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1).not.toBe(
      NEG_PATH_ANGLE_BOUND_FOLD_CONTROL_SOURCE_V1,
    );
    expect(NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1).toEqual(
      NEG_PATH_ANGLE_BOUND_FOLD_CONTROL_SOURCE_V1,
    );
    const control = structuredClone(
      NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1,
    ) as unknown as JsonRecord;
    const segments = array(record(control.pathCandidate).segments).map(record);
    expect(record(control.pathCandidate)).toMatchObject({
      representationVersion: 1,

      representationStatus: 'candidate',
    });
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ t0: 0, t1: 1 });
    expect(boundedMotion(control)).toMatchObject({
      kind: 'bounded-interpolation',
      knotTimes: [0, 0.5, 1],
    });
    expect(angleRows(control)).toHaveLength(1);
    expect(angleArray(control)).toEqual([0, Math.PI / 2, Math.PI]);
    expect(intervalBoundRows(control)).toHaveLength(1);
    expect(intervalBounds(control)).toEqual([
      [0, Math.PI / 2],
      [Math.PI / 2, Math.PI],
    ]);
  });

  it('fixes one path-candidate representation-version mismatch and the sole parser oracle', () => {
    expect(
      representationVersionMismatchJsonDifferencePaths(
        NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1,
        NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.sourceDocument,
      ),
    ).toEqual(NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.changedPaths);
    const result = parseArtifactContractV1(
      NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.expectedIssues,
    );
    expect(result.error[0]?.message).toBe('must equal 1');
    const source = structuredClone(
      NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.sourceDocument,
    ) as unknown as JsonRecord;
    expect(record(source.pathCandidate)).toMatchObject({
      representationVersion: 2,
      representationStatus: 'candidate',
    });
    expect(boundedMotion(source).kind).toBe('bounded-interpolation');
    expect(angleRows(source)).toHaveLength(1);
    expect(intervalBoundRows(source)).toHaveLength(1);
  });

  it('fixes absence of all secondary path diagnostics', () => {
    const result = parseArtifactContractV1(
      NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map((issue) => issue.code)).toEqual(['invalid-literal']);
  });

  it('matches the committed control and source exactly', async () => {
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'control-fold.json'))).toEqual(
      NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1,
    );
    expect(
      await jsonFile(join(BUNDLE_DIRECTORY, 'path-representation-version-mismatch.json')),
    ).toEqual(NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.sourceDocument);
  });

  it('strict-compiles the Draft 2020-12 schema and validates the runtime ledger', () => {
    expect(validate(committedLedger), JSON.stringify(validate.errors)).toBe(true);
    expect(
      parseNegPathRepresentationVersionMismatchCandidateBundleLedgerV1(committedLedger).ok,
    ).toBe(true);
  });

  it('keeps strict Ajv and the runtime parser aligned across recursive rewrites', () => {
    const mutations = recursiveClosedLedgerMutations(committedLedger);
    expect(mutations.length).toBeGreaterThan(100);
    for (const changed of mutations) {
      const schemaAccepted = validate(changed);
      const runtimeAccepted =
        parseNegPathRepresentationVersionMismatchCandidateBundleLedgerV1(changed).ok;
      expect(schemaAccepted).toBe(runtimeAccepted);
      expect(runtimeAccepted).toBe(false);
    }
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
      expect(parseNegPathRepresentationVersionMismatchCandidateBundleLedgerV1(changed).ok).toBe(
        false,
      );
    }
  });

  it.each([
    'declaredPathCandidateRepresentationStatusParserOnly',
    'declaredPathCandidateSupportedRepresentationKindParserOnly',
    'declaredBoundedInterpolationUniqueAngleCreaseRowsParserOnly',
    'declaredBoundedInterpolationUniqueIntervalBoundCreaseRowsParserOnly',
    'declaredBoundedInterpolationAngleKnotCardinalityParserOnly',
    'declaredBoundedInterpolationBoundKnotIntervalCardinalityParserOnly',
    'declaredBoundedInterpolationAngleContainmentParserOnly',
    'declaredBoundedInterpolationKnotTimeStrictMonotonicityParserOnly',

    'canonicalPathMutationFamilyComplete',
    'representationSelectionEstablished',
    'pathTimeCoverageEstablished',
    'motionMapCompletenessEstablished',
    'creaseMapCompletenessEstablished',
    'pathRepresentationCompletenessEstablished',
    'piecewisePolynomialCardinalityIncluded',
    'piecewisePolynomialSemanticsEstablished',
    'piecewisePolynomialEndpointInferenceIncluded',
    'physicalAngleScheduleEstablished',
    'radianConventionEstablished',
    'physicalAngleBoundsEstablished',
    'conservativeAngleBoundsEstablished',
    'kinematicFeasibilityEstablished',
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
    expect(parseNegPathRepresentationVersionMismatchCandidateBundleLedgerV1(changed).ok).toBe(
      false,
    );
  });

  it('builds the same closed four-file set twice', () => {
    const first = buildNegPathRepresentationVersionMismatchCandidateBundleV1();
    expect(first.files).toEqual(buildNegPathRepresentationVersionMismatchCandidateBundleV1().files);
    expect(first.files).toHaveLength(4);
  });

  it('verifies every check while keeping downstream claims false', () => {
    expect(committedVerification).toMatchObject({
      declaredPathCandidateRepresentationVersionParserOnly: true,
      declaredPathCandidateRepresentationStatusParserOnly: false,
      declaredPathCandidateSupportedRepresentationKindParserOnly: false,
      declaredBoundedInterpolationUniqueAngleCreaseRowsParserOnly: false,
      declaredBoundedInterpolationUniqueIntervalBoundCreaseRowsParserOnly: false,
      declaredBoundedInterpolationAngleKnotCardinalityParserOnly: false,
      declaredBoundedInterpolationBoundKnotIntervalCardinalityParserOnly: false,
      declaredBoundedInterpolationAngleContainmentParserOnly: false,
      declaredBoundedInterpolationKnotTimeStrictMonotonicityParserOnly: false,
      canonicalPromotionClaimed: false,
      canonicalPathMutationFamilyComplete: false,
      representationSelectionEstablished: false,
      pathTimeCoverageEstablished: false,
      motionMapCompletenessEstablished: false,
      creaseMapCompletenessEstablished: false,
      pathRepresentationCompletenessEstablished: false,
      piecewisePolynomialCardinalityIncluded: false,
      piecewisePolynomialSemanticsEstablished: false,
      radianConventionEstablished: false,
      kinematicFeasibilityEstablished: false,
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
        (fixture) => fixture.id === 'NEG-PATH-MUTATION-REPRESENTATION-VERSION-MISMATCH',
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
    expect(await runNegPathRepresentationVersionMismatchCandidateBundleCli(['--verify'], io)).toBe(
      0,
    );
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    const root = await mkdtemp(join(tmpdir(), 'neg-path-representation-version-mismatch-cli-'));
    temporaryDirectories.push(root);
    stdout.length = 0;
    expect(
      await runNegPathRepresentationVersionMismatchCandidateBundleCli(
        ['--write', join(root, 'bundle'), '--json'],
        io,
      ),
    ).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(await runNegPathRepresentationVersionMismatchCandidateBundleCli(['--unknown'], io)).toBe(
      2,
    );
  });

  it('rejects raw tampering and extra entries', async () => {
    const raw = await copyBundle('neg-path-representation-version-mismatch-raw-');
    await writeFile(join(raw, 'path-representation-version-mismatch.json'), '{}\n', 'utf8');
    expect(
      (await verifyNegPathRepresentationVersionMismatchCandidateBundleV1(raw)).reasonCodes,
    ).toEqual(['artifact-hash-mismatch']);
    const extra = await copyBundle('neg-path-representation-version-mismatch-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect(
      (await verifyNegPathRepresentationVersionMismatchCandidateBundleV1(extra)).reasonCodes,
    ).toEqual(['artifact-set-mismatch']);
  });

  it('rejects links and unsafe writer cleanup', async () => {
    const directory = await copyBundle('neg-path-representation-version-mismatch-link-');
    const sourcePath = join(directory, 'path-representation-version-mismatch.json');
    await rm(sourcePath);
    await symlink(BUNDLE_DIRECTORY, sourcePath, 'junction');
    expect(
      (await verifyNegPathRepresentationVersionMismatchCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['artifact-set-mismatch']);
    await expect(
      writeNegPathRepresentationVersionMismatchCandidateBundleV1(directory),
    ).rejects.toThrow('unexpected entry');
  });

  it('refuses cleanup of an unexpected regular file', async () => {
    const directory = await copyBundle('neg-path-representation-version-mismatch-writer-');
    await writeFile(join(directory, 'keep.txt'), 'keep\n', 'utf8');
    await expect(
      writeNegPathRepresentationVersionMismatchCandidateBundleV1(directory),
    ).rejects.toThrow('unexpected entry');
    expect(await readFile(join(directory, 'keep.txt'), 'utf8')).toBe('keep\n');
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-path-representation-version-mismatch-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-path-representation-version-mismatch',
      NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1,
    );
    expect(
      (await verifyNegPathRepresentationVersionMismatchCandidateBundleV1(directory)).reasonCodes,
    ).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a shifted but accepted saved-control anchor', async () => {
    const directory = await copyBundle('neg-path-representation-version-mismatch-control-');
    const control = record(await jsonFile(join(directory, 'control-fold.json')));
    control.contractId = 'CONTRACT-FOLD-REPRESENTATION-VERSION-MISMATCH-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-fold', control);
    expect(
      (await verifyNegPathRepresentationVersionMismatchCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects the same version-leaf delta when its complete parser oracle changes', async () => {
    const directory = await copyBundle('neg-path-representation-version-mismatch-signature-');
    const source = record(
      await jsonFile(join(directory, 'path-representation-version-mismatch.json')),
    );
    delete record(source.pathCandidate).representationVersion;
    expect(
      representationVersionMismatchJsonDifferencePaths(
        NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);

    if (replay.ok) throw new TypeError('changed oracle must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      {
        path: '$.pathCandidate.representationVersion',
        code: 'missing-field',
      },
      {
        path: '$.pathCandidate.representationVersion',
        code: 'invalid-literal',
      },
    ]);
    expect(replay.error.map((issue) => issue.message)).toEqual([
      'required field is missing',
      'must equal 1',
    ]);
    await coherentlyRewriteArtifact(
      directory,
      'source-path-representation-version-mismatch',
      source,
    );
    expect(
      (await verifyNegPathRepresentationVersionMismatchCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['parser-issue-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects a wrong delta with the same complete parser oracle', async () => {
    const directory = await copyBundle('neg-path-representation-version-mismatch-delta-');
    const source = record(
      await jsonFile(join(directory, 'path-representation-version-mismatch.json')),
    );
    const benignControl = structuredClone(
      NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1,
    ) as unknown as JsonRecord;
    angleArray(benignControl)[0] = Math.PI / 4;
    expect(parseArtifactContractV1(benignControl)).toMatchObject({ ok: true });
    angleArray(source)[0] = Math.PI / 4;
    expect(
      representationVersionMismatchJsonDifferencePaths(
        NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual([
      '$.pathCandidate.representationVersion',
      '$.pathCandidate.segments[0].motion.anglesByCrease[0].angles[0]',
    ]);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('wrong delta must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(
      directory,
      'source-path-representation-version-mismatch',
      source,
    );
    expect(
      (await verifyNegPathRepresentationVersionMismatchCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects different bytes with the same delta and complete oracle', async () => {
    const directory = await copyBundle('neg-path-representation-version-mismatch-bytes-');
    const source = record(
      await jsonFile(join(directory, 'path-representation-version-mismatch.json')),
    );
    record(source.pathCandidate).representationVersion = 3;
    expect(
      representationVersionMismatchJsonDifferencePaths(
        NEG_PATH_REPRESENTATION_VERSION_MISMATCH_FOLD_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('same-path negative must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_REPRESENTATION_VERSION_MISMATCH_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(
      directory,
      'source-path-representation-version-mismatch',
      source,
    );
    const result = await verifyNegPathRepresentationVersionMismatchCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
