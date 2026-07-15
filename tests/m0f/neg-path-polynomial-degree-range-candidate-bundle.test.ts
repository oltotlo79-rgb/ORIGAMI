import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { runNegPathPolynomialDegreeRangeCandidateBundleCli } from '../../m0f/neg-path-polynomial-degree-range-candidate-bundle-cli.js';
import {
  NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1,
  NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1,
  polynomialDegreeRangeJsonDifferencePaths,
  buildNegPathPolynomialDegreeRangeCandidateBundleV1,
  parseNegPathPolynomialDegreeRangeCandidateBundleLedgerV1,
  verifyNegPathPolynomialDegreeRangeCandidateBundleV1,
  writeNegPathPolynomialDegreeRangeCandidateBundleV1,
} from '../../m0f/neg-path-polynomial-degree-range-candidate-bundle.js';
import { NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1 } from '../../m0f/neg-path-polynomial-coefficient-degree-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(
  NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
);
const SCHEMA_PATH = resolve(
  'm0f/schemas/neg-path-polynomial-degree-range-candidate-bundle-ledger-v1.schema.json',
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

function coefficientRow(document: JsonRecord, segmentIndex: number): unknown[] {
  const pathCandidate = record(document.pathCandidate);
  const segment = record(array(pathCandidate.segments)[segmentIndex]);
  const motion = record(segment.motion);
  const coefficientEntry = record(array(motion.coefficientsByCrease)[0]);
  return array(array(coefficientEntry.coefficients)[0]);
}

function segmentMotion(document: JsonRecord, segmentIndex: number): JsonRecord {
  return record(record(array(record(document.pathCandidate).segments)[segmentIndex]).motion);
}

function withoutPathCandidate(document: unknown): JsonRecord {
  const copy = structuredClone(record(document));
  delete copy.pathCandidate;
  return copy;
}

const temporaryDirectories: string[] = [];

async function copyBundle(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  const directory = join(root, 'bundle');
  await writeNegPathPolynomialDegreeRangeCandidateBundleV1(directory);
  return directory;
}

async function coherentlyRewriteArtifactText(
  directory: string,
  artifactId: string,
  text: string,
): Promise<void> {
  const ledgerPath = join(
    directory,
    NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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

describe('NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE candidate bundle', () => {
  let committedLedger: JsonRecord;
  let validate: ReturnType<Ajv2020['compile']>;
  let committedVerification: Awaited<
    ReturnType<typeof verifyNegPathPolynomialDegreeRangeCandidateBundleV1>
  >;

  beforeAll(async () => {
    committedLedger = record(
      await jsonFile(
        join(BUNDLE_DIRECTORY, NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
      ),
    );
    validate = new Ajv2020({ strict: true, allErrors: true }).compile(
      record(await jsonFile(SCHEMA_PATH)),
    );
    committedVerification = await verifyNegPathPolynomialDegreeRangeCandidateBundleV1();
  });

  afterAll(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('derives an owned accepted time-contiguous two-segment polynomial control', () => {
    expect(
      parseArtifactContractV1(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1),
    ).toMatchObject({ ok: true });
    expect(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1).not.toBe(
      NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(withoutPathCandidate(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1)).toEqual(
      withoutPathCandidate(NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1),
    );
    const ownedControl = structuredClone(
      NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1,
    ) as unknown as JsonRecord;
    const segments = array(record(ownedControl.pathCandidate).segments).map(record);
    expect(segments).toHaveLength(2);
    expect(segments.map(({ t0, t1 }) => ({ t0, t1 }))).toEqual([
      { t0: 0, t1: 0.5 },
      { t0: 0.5, t1: 1 },
    ]);
    for (const segmentIndex of [0, 1]) {
      expect(coefficientRow(ownedControl, segmentIndex)).toEqual([0, Math.PI]);
      const motion = segmentMotion(ownedControl, segmentIndex);
      expect(motion).toMatchObject({ kind: 'piecewise-polynomial', degree: 1 });
      expect(record(array(motion.derivativeBoundsByCrease)[0])).toEqual({
        edgeId: 'e-hinge',
        bounds: [0, Math.PI],
      });
    }
    expect(segments[0]?.motion).toEqual(segments[1]?.motion);
  });

  it('keeps the inherited one-segment degree-one source anchor unchanged', () => {
    const inherited = structuredClone(
      NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1,
    ) as unknown as JsonRecord;
    const segments = array(record(inherited.pathCandidate).segments).map(record);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      t0: 0,
      t1: 1,
      motion: { kind: 'piecewise-polynomial', degree: 1 },
    });
  });

  it('fixes the segment-zero degree-one to zero delta and sole complete parser oracle', () => {
    expect(
      polynomialDegreeRangeJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1,
        NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.sourceDocument,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.changedPaths);
    const result = parseArtifactContractV1(
      NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.expectedIssues,
    );
  });

  it('fixes absence of all secondary path diagnostics', () => {
    const result = parseArtifactContractV1(
      NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map((issue) => issue.code)).toEqual(['out-of-range']);
  });

  it('matches the committed control and source exactly', async () => {
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'control-design.json'))).toEqual(
      NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(
      await jsonFile(join(BUNDLE_DIRECTORY, 'path-polynomial-degree-out-of-range.json')),
    ).toEqual(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.sourceDocument);
  });

  it('strict-compiles the Draft 2020-12 schema and validates the runtime ledger', () => {
    expect(validate(committedLedger), JSON.stringify(validate.errors)).toBe(true);
    expect(parseNegPathPolynomialDegreeRangeCandidateBundleLedgerV1(committedLedger).ok).toBe(true);
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
      expect(parseNegPathPolynomialDegreeRangeCandidateBundleLedgerV1(changed).ok).toBe(false);
    }
  });

  it.each([
    'fractionalDegreeRejectionVectorIncluded',
    'unsafeIntegerDegreeRejectionVectorIncluded',
    'generalPositiveSafeIntegerDegreeDomainEstablished',
    'declaredPiecewisePolynomialCoefficientDegreeCardinalityParserOnly',
    'pathTimeCoverageEstablished',
    'canonicalPathMutationFamilyComplete',
    'representationSelectionEstablished',
    'piecewisePolynomialBasisFrozen',
    'polynomialCoefficientOrderingEstablished',
    'polynomialCoefficientSemanticsEstablished',
    'polynomialCoefficientIntervalAssociationEstablished',
    'polynomialDerivativeSemanticsEstablished',
    'polynomialDerivativeValidationIncluded',
    'piecewisePolynomialEndpointInferenceIncluded',
    'pathRepresentationCompletenessEstablished',
    'motionMapCompletenessEstablished',
    'creaseMapCompletenessEstablished',
    'physicalAngleScheduleEstablished',
    'radianConventionEstablished',
    'physicalAngleBoundsEstablished',
    'conservativeDerivativeBoundsEstablished',
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
    expect(parseNegPathPolynomialDegreeRangeCandidateBundleLedgerV1(changed).ok).toBe(false);
  });

  it('builds the same closed four-file set twice', () => {
    const first = buildNegPathPolynomialDegreeRangeCandidateBundleV1();
    expect(first.files).toEqual(buildNegPathPolynomialDegreeRangeCandidateBundleV1().files);
    expect(first.files).toHaveLength(4);
  });

  it('verifies every check while keeping downstream claims false', () => {
    expect(committedVerification).toMatchObject({
      declaredPiecewisePolynomialZeroDegreeRejectionParserOnly: true,
      fractionalDegreeRejectionVectorIncluded: false,
      unsafeIntegerDegreeRejectionVectorIncluded: false,
      generalPositiveSafeIntegerDegreeDomainEstablished: false,
      declaredPiecewisePolynomialCoefficientDegreeCardinalityParserOnly: false,
      pathTimeCoverageEstablished: false,
      canonicalPromotionClaimed: false,
      canonicalPathMutationFamilyComplete: false,
      representationSelectionEstablished: false,
      piecewisePolynomialBasisFrozen: false,
      polynomialCoefficientOrderingEstablished: false,
      polynomialCoefficientSemanticsEstablished: false,
      polynomialCoefficientIntervalAssociationEstablished: false,
      polynomialDerivativeSemanticsEstablished: false,
      polynomialDerivativeValidationIncluded: false,
      piecewisePolynomialEndpointInferenceIncluded: false,
      pathRepresentationCompletenessEstablished: false,
      motionMapCompletenessEstablished: false,
      creaseMapCompletenessEstablished: false,
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
        (fixture) => fixture.id === 'NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE',
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
    expect(await runNegPathPolynomialDegreeRangeCandidateBundleCli(['--verify'], io)).toBe(0);
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    const root = await mkdtemp(join(tmpdir(), 'neg-path-polynomial-degree-range-cli-'));
    temporaryDirectories.push(root);
    stdout.length = 0;
    expect(
      await runNegPathPolynomialDegreeRangeCandidateBundleCli(
        ['--write', join(root, 'bundle'), '--json'],
        io,
      ),
    ).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(await runNegPathPolynomialDegreeRangeCandidateBundleCli(['--unknown'], io)).toBe(2);
  });

  it('rejects raw tampering and extra entries', async () => {
    const raw = await copyBundle('neg-path-polynomial-degree-range-raw-');
    await writeFile(join(raw, 'path-polynomial-degree-out-of-range.json'), '{}\n', 'utf8');
    expect((await verifyNegPathPolynomialDegreeRangeCandidateBundleV1(raw)).reasonCodes).toEqual([
      'artifact-hash-mismatch',
    ]);
    const extra = await copyBundle('neg-path-polynomial-degree-range-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect((await verifyNegPathPolynomialDegreeRangeCandidateBundleV1(extra)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
  });

  it('rejects links and unsafe writer cleanup', async () => {
    const directory = await copyBundle('neg-path-polynomial-degree-range-link-');
    const sourcePath = join(directory, 'path-polynomial-degree-out-of-range.json');
    await rm(sourcePath);
    await symlink(BUNDLE_DIRECTORY, sourcePath, 'junction');
    expect(
      (await verifyNegPathPolynomialDegreeRangeCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['artifact-set-mismatch']);
    await expect(writeNegPathPolynomialDegreeRangeCandidateBundleV1(directory)).rejects.toThrow(
      'unexpected entry',
    );
  });

  it('refuses cleanup of an unexpected regular file', async () => {
    const directory = await copyBundle('neg-path-polynomial-degree-range-writer-');
    await writeFile(join(directory, 'keep.txt'), 'keep\n', 'utf8');
    await expect(writeNegPathPolynomialDegreeRangeCandidateBundleV1(directory)).rejects.toThrow(
      'unexpected entry',
    );
    expect(await readFile(join(directory, 'keep.txt'), 'utf8')).toBe('keep\n');
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-path-polynomial-degree-range-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-degree-out-of-range',
      NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(
      (await verifyNegPathPolynomialDegreeRangeCandidateBundleV1(directory)).reasonCodes,
    ).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a shifted but accepted saved-control anchor', async () => {
    const directory = await copyBundle('neg-path-polynomial-degree-range-control-');
    const control = record(await jsonFile(join(directory, 'control-design.json')));
    control.contractId = 'CONTRACT-DESIGN-POLYNOMIAL-DEGREE-RANGE-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-design', control);
    expect(
      (await verifyNegPathPolynomialDegreeRangeCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects the same degree path when its complete parser oracle changes', async () => {
    const directory = await copyBundle('neg-path-polynomial-degree-range-signature-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-degree-out-of-range.json')),
    );
    segmentMotion(source, 0).degree = null;
    expect(
      polynomialDegreeRangeJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('changed oracle must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      {
        path: '$.pathCandidate.segments[0].motion.degree',
        code: 'non-finite-number',
      },
    ]);
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-degree-out-of-range',
      source,
    );
    expect(
      (await verifyNegPathPolynomialDegreeRangeCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['parser-issue-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects a wrong delta with the same complete parser oracle', async () => {
    const directory = await copyBundle('neg-path-polynomial-degree-range-delta-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-degree-out-of-range.json')),
    );
    coefficientRow(source, 1)[1] = Math.PI / 2;
    expect(
      polynomialDegreeRangeJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual([
      '$.pathCandidate.segments[0].motion.degree',
      '$.pathCandidate.segments[1].motion.coefficientsByCrease[0].coefficients[0][1]',
    ]);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('wrong delta must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-degree-out-of-range',
      source,
    );
    expect(
      (await verifyNegPathPolynomialDegreeRangeCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects different bytes with the same delta and complete oracle', async () => {
    const directory = await copyBundle('neg-path-polynomial-degree-range-bytes-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-degree-out-of-range.json')),
    );
    segmentMotion(source, 0).degree = -1;
    expect(
      polynomialDegreeRangeJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('same-path negative must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-degree-out-of-range',
      source,
    );
    const result = await verifyNegPathPolynomialDegreeRangeCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
