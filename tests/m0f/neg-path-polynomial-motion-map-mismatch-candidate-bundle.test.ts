import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { runNegPathPolynomialMotionMapMismatchCandidateBundleCli } from '../../m0f/neg-path-polynomial-motion-map-mismatch-candidate-bundle-cli.js';
import {
  NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1,
  NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
  polynomialMotionMapMismatchJsonDifferencePaths,
  buildNegPathPolynomialMotionMapMismatchCandidateBundleV1,
  parseNegPathPolynomialMotionMapMismatchCandidateBundleLedgerV1,
  verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1,
  writeNegPathPolynomialMotionMapMismatchCandidateBundleV1,
} from '../../m0f/neg-path-polynomial-motion-map-mismatch-candidate-bundle.js';
import { NEG_PATH_ENDPOINT_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1 } from '../../m0f/neg-path-endpoint-map-mismatch-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(
  NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
);
const SCHEMA_PATH = resolve(
  'm0f/schemas/neg-path-polynomial-motion-map-mismatch-candidate-bundle-ledger-v1.schema.json',
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

function firstMotion(document: JsonRecord): JsonRecord {
  return record(record(array(record(document.pathCandidate).segments)[0]).motion);
}

function firstDerivativeRows(document: JsonRecord): unknown[] {
  return array(firstMotion(document).derivativeBoundsByCrease);
}

function firstCoefficientRows(document: JsonRecord): unknown[] {
  return array(firstMotion(document).coefficientsByCrease);
}

const temporaryDirectories: string[] = [];

async function copyBundle(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  const directory = join(root, 'bundle');
  await writeNegPathPolynomialMotionMapMismatchCandidateBundleV1(directory);
  return directory;
}

async function coherentlyRewriteArtifactText(
  directory: string,
  artifactId: string,
  text: string,
): Promise<void> {
  const ledgerPath = join(
    directory,
    NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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

describe('NEG-PATH-MUTATION-POLYNOMIAL-MOTION-MAP-MISMATCH candidate bundle', () => {
  let committedLedger: JsonRecord;
  let validate: ReturnType<Ajv2020['compile']>;
  let committedVerification: Awaited<
    ReturnType<typeof verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1>
  >;

  beforeAll(async () => {
    committedLedger = record(
      await jsonFile(
        join(
          BUNDLE_DIRECTORY,
          NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CANDIDATE_BUNDLE_LEDGER_FILENAME,
        ),
      ),
    );
    validate = new Ajv2020({ strict: true, allErrors: true }).compile(
      record(await jsonFile(SCHEMA_PATH)),
    );
    committedVerification = await verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1();
  });

  afterAll(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('keeps the owned three-face/two-hinge base and fixes the accepted polynomial path', () => {
    expect(
      parseArtifactContractV1(NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1),
    ).toMatchObject({ ok: true });
    expect(NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1).not.toBe(
      NEG_PATH_ENDPOINT_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
    );
    const control = record(
      structuredClone(NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1),
    );
    const base = record(structuredClone(NEG_PATH_ENDPOINT_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1));
    expect(control.input).toEqual(base.input);
    expect(control.creaseMesh).toEqual(base.creaseMesh);
    expect(control.target).toEqual(base.target);
    expect(control.pathCandidate).not.toEqual(base.pathCandidate);
    expect(array(record(control.creaseMesh).faces)).toHaveLength(3);
    expect(
      array(record(control.creaseMesh).edges)
        .map(record)
        .filter((edge) => edge.role === 'hinge')
        .map((edge) => edge.id),
    ).toEqual(['e-hinge', 'e-hinge-far']);
    const segments = array(record(control.pathCandidate).segments);
    expect(segments).toHaveLength(1);
    expect(record(segments[0])).toMatchObject({ t0: 0, t1: 1 });
    const motion = firstMotion(control);
    expect(motion).toMatchObject({ kind: 'piecewise-polynomial', degree: 1 });
    expect(firstCoefficientRows(control)).toEqual([
      { edgeId: 'e-hinge', coefficients: [[0, Math.PI]] },
      { edgeId: 'e-hinge-far', coefficients: [[0, Math.PI]] },
    ]);
    expect(firstDerivativeRows(control)).toEqual([
      { edgeId: 'e-hinge', bounds: [0, Math.PI] },
      { edgeId: 'e-hinge-far', bounds: [0, Math.PI] },
    ]);
  });

  it('preserves every base field outside the replaced path candidate', () => {
    const controlRest = record(
      structuredClone(NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1),
    );
    const baseRest = record(
      structuredClone(NEG_PATH_ENDPOINT_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1),
    );
    delete controlRest.pathCandidate;
    delete baseRest.pathCandidate;
    expect(controlRest).toEqual(baseRest);
  });

  it('fixes one derivative-row deletion and the sole complete parser oracle', () => {
    expect(
      polynomialMotionMapMismatchJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
        NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1.changedPaths);
    const result = parseArtifactContractV1(
      NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1.expectedIssues,
    );
  });

  it('fixes absence of all secondary path diagnostics', () => {
    const result = parseArtifactContractV1(
      NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map((issue) => issue.code)).toEqual(['motion-map-mismatch']);
  });

  it('matches the committed control and source exactly', async () => {
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'control-design.json'))).toEqual(
      NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(
      await jsonFile(join(BUNDLE_DIRECTORY, 'path-polynomial-motion-map-mismatch.json')),
    ).toEqual(NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1.sourceDocument);
  });

  it('strict-compiles the Draft 2020-12 schema and validates the runtime ledger', () => {
    expect(validate(committedLedger), JSON.stringify(validate.errors)).toBe(true);
    expect(parseNegPathPolynomialMotionMapMismatchCandidateBundleLedgerV1(committedLedger).ok).toBe(
      true,
    );
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
      expect(parseNegPathPolynomialMotionMapMismatchCandidateBundleLedgerV1(changed).ok).toBe(
        false,
      );
    }
  });

  it.each([
    'canonicalPathMutationFamilyComplete',
    'declaredPiecewisePolynomialCoefficientDegreeCardinalityParserOnly',
    'representationSelectionEstablished',
    'piecewisePolynomialBasisFrozen',
    'polynomialCoefficientOrderingEstablished',
    'polynomialCoefficientSemanticsEstablished',
    'polynomialCoefficientIntervalAssociationEstablished',
    'polynomialDerivativeSemanticsEstablished',
    'polynomialDerivativeUnitsEstablished',
    'piecewisePolynomialEndpointInferenceIncluded',
    'pathRepresentationCompletenessEstablished',
    'creaseMapCompletenessEstablished',
    'motionMapCompletenessEstablished',
    'physicalHingeDriftDetectionIncluded',
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
    expect(parseNegPathPolynomialMotionMapMismatchCandidateBundleLedgerV1(changed).ok).toBe(false);
  });

  it('builds the same closed four-file set twice', () => {
    const first = buildNegPathPolynomialMotionMapMismatchCandidateBundleV1();
    expect(first.files).toEqual(buildNegPathPolynomialMotionMapMismatchCandidateBundleV1().files);
    expect(first.files).toHaveLength(4);
  });

  it('verifies every check while keeping downstream claims false', () => {
    expect(committedVerification).toMatchObject({
      declaredPiecewisePolynomialMotionMapPairingParserOnly: true,
      declaredPiecewisePolynomialCoefficientDegreeCardinalityParserOnly: false,
      canonicalPromotionClaimed: false,
      canonicalPathMutationFamilyComplete: false,
      representationSelectionEstablished: false,
      piecewisePolynomialBasisFrozen: false,
      polynomialCoefficientOrderingEstablished: false,
      polynomialCoefficientSemanticsEstablished: false,
      polynomialCoefficientIntervalAssociationEstablished: false,
      polynomialDerivativeSemanticsEstablished: false,
      polynomialDerivativeUnitsEstablished: false,
      piecewisePolynomialEndpointInferenceIncluded: false,
      motionMapCompletenessEstablished: false,
      physicalHingeDriftDetectionIncluded: false,
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
        (fixture) => fixture.id === 'NEG-PATH-MUTATION-POLYNOMIAL-MOTION-MAP-MISMATCH',
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
    expect(await runNegPathPolynomialMotionMapMismatchCandidateBundleCli(['--verify'], io)).toBe(0);
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    const root = await mkdtemp(join(tmpdir(), 'neg-path-polynomial-motion-map-mismatch-cli-'));
    temporaryDirectories.push(root);
    stdout.length = 0;
    expect(
      await runNegPathPolynomialMotionMapMismatchCandidateBundleCli(
        ['--write', join(root, 'bundle'), '--json'],
        io,
      ),
    ).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(await runNegPathPolynomialMotionMapMismatchCandidateBundleCli(['--unknown'], io)).toBe(
      2,
    );
  });

  it('rejects raw tampering and extra entries', async () => {
    const raw = await copyBundle('neg-path-polynomial-motion-map-mismatch-raw-');
    await writeFile(join(raw, 'path-polynomial-motion-map-mismatch.json'), '{}\n', 'utf8');
    expect(
      (await verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1(raw)).reasonCodes,
    ).toEqual(['artifact-hash-mismatch']);
    const extra = await copyBundle('neg-path-polynomial-motion-map-mismatch-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect(
      (await verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1(extra)).reasonCodes,
    ).toEqual(['artifact-set-mismatch']);
  });

  it('rejects links and unsafe writer cleanup', async () => {
    const directory = await copyBundle('neg-path-polynomial-motion-map-mismatch-link-');
    const sourcePath = join(directory, 'path-polynomial-motion-map-mismatch.json');
    await rm(sourcePath);
    await symlink(BUNDLE_DIRECTORY, sourcePath, 'junction');
    expect(
      (await verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['artifact-set-mismatch']);
    await expect(
      writeNegPathPolynomialMotionMapMismatchCandidateBundleV1(directory),
    ).rejects.toThrow('unexpected entry');
  });

  it('refuses cleanup of an unexpected regular file', async () => {
    const directory = await copyBundle('neg-path-polynomial-motion-map-mismatch-writer-');
    await writeFile(join(directory, 'keep.txt'), 'keep\n', 'utf8');
    await expect(
      writeNegPathPolynomialMotionMapMismatchCandidateBundleV1(directory),
    ).rejects.toThrow('unexpected entry');
    expect(await readFile(join(directory, 'keep.txt'), 'utf8')).toBe('keep\n');
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-path-polynomial-motion-map-mismatch-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-motion-map-mismatch',
      NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(
      (await verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1(directory)).reasonCodes,
    ).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a shifted but accepted saved-control anchor', async () => {
    const directory = await copyBundle('neg-path-polynomial-motion-map-mismatch-control-');
    const control = record(await jsonFile(join(directory, 'control-design.json')));
    control.contractId = 'CONTRACT-DESIGN-POLYNOMIAL-MOTION-MAP-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-design', control);
    expect(
      (await verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects the same derivative-row path when its complete parser oracle changes', async () => {
    const directory = await copyBundle('neg-path-polynomial-motion-map-mismatch-signature-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-motion-map-mismatch.json')),
    );
    firstDerivativeRows(source).push(null);
    expect(
      polynomialMotionMapMismatchJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('changed oracle must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      {
        path: '$.pathCandidate.segments[0].motion.derivativeBoundsByCrease[1]',
        code: 'invalid-object',
      },
      {
        path: '$.pathCandidate.segments[0].motion',
        code: 'motion-map-mismatch',
      },
    ]);
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-motion-map-mismatch',
      source,
    );
    expect(
      (await verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['parser-issue-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects a wrong delta with the same complete parser oracle', async () => {
    const directory = await copyBundle('neg-path-polynomial-motion-map-mismatch-delta-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-motion-map-mismatch.json')),
    );
    firstDerivativeRows(source).push({ edgeId: 'e-hinge-far', bounds: [0, Math.PI] });
    firstCoefficientRows(source).splice(1, 1);
    expect(
      polynomialMotionMapMismatchJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(['$.pathCandidate.segments[0].motion.coefficientsByCrease[1]']);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('wrong delta must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-motion-map-mismatch',
      source,
    );
    expect(
      (await verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects different bytes with the same delta and complete oracle', async () => {
    const directory = await copyBundle('neg-path-polynomial-motion-map-mismatch-bytes-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-motion-map-mismatch.json')),
    );
    expect(
      polynomialMotionMapMismatchJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('different bytes must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_MOTION_MAP_MISMATCH_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifactText(
      directory,
      'source-path-polynomial-motion-map-mismatch',
      `${JSON.stringify(source, null, 2)}\n`,
    );
    const result = await verifyNegPathPolynomialMotionMapMismatchCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
