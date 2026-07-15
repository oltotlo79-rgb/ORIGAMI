import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { runNegPathPolynomialDerivativeBoundsCandidateBundleCli } from '../../m0f/neg-path-polynomial-derivative-bounds-candidate-bundle-cli.js';
import {
  NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1,
  NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1,
  polynomialDerivativeBoundsJsonDifferencePaths,
  buildNegPathPolynomialDerivativeBoundsCandidateBundleV1,
  parseNegPathPolynomialDerivativeBoundsCandidateBundleLedgerV1,
  verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1,
  writeNegPathPolynomialDerivativeBoundsCandidateBundleV1,
} from '../../m0f/neg-path-polynomial-derivative-bounds-candidate-bundle.js';
import { NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1 } from '../../m0f/neg-topology-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(
  NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
);
const SCHEMA_PATH = resolve(
  'm0f/schemas/neg-path-polynomial-derivative-bounds-candidate-bundle-ledger-v1.schema.json',
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

function firstDerivativeBounds(document: JsonRecord): unknown[] {
  return array(record(array(firstMotion(document).derivativeBoundsByCrease)[0]).bounds);
}

const temporaryDirectories: string[] = [];

async function copyBundle(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  const directory = join(root, 'bundle');
  await writeNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory);
  return directory;
}

async function coherentlyRewriteArtifactText(
  directory: string,
  artifactId: string,
  text: string,
): Promise<void> {
  const ledgerPath = join(
    directory,
    NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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

describe('NEG-PATH-MUTATION-POLYNOMIAL-DERIVATIVE-BOUNDS-INVERTED candidate bundle', () => {
  let committedLedger: JsonRecord;
  let validate: ReturnType<Ajv2020['compile']>;
  let committedVerification: Awaited<
    ReturnType<typeof verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1>
  >;

  beforeAll(async () => {
    committedLedger = record(
      await jsonFile(
        join(
          BUNDLE_DIRECTORY,
          NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CANDIDATE_BUNDLE_LEDGER_FILENAME,
        ),
      ),
    );
    validate = new Ajv2020({ strict: true, allErrors: true }).compile(
      record(await jsonFile(SCHEMA_PATH)),
    );
    committedVerification = await verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1();
  });

  afterAll(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('keeps the owned degree-one polynomial control and upstream bytes/value anchored', async () => {
    expect(
      parseArtifactContractV1(NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1),
    ).toMatchObject({ ok: true });
    expect(NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1).toEqual(
      NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1,
    );
    expect(NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1).not.toBe(
      NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1,
    );
    const upstreamPath = resolve('tests/vectors/m0f-0/artifact-contract-design-v1.json');
    const upstreamText = await readFile(upstreamPath, 'utf8');
    expect(sha256Prefixed(upstreamText)).toBe(
      'sha256:af396adc87978828015f4df8b17c4c7b13e32b954193edf30088616176854ac3',
    );
    expect(JSON.parse(upstreamText)).toEqual(
      NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1,
    );
    const ownedControl = structuredClone(
      NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1,
    ) as unknown as JsonRecord;
    const motion = firstMotion(ownedControl);
    expect(motion).toMatchObject({ kind: 'piecewise-polynomial', degree: 1 });
    expect(array(array(record(array(motion.coefficientsByCrease)[0]).coefficients)[0])).toEqual([
      0,
      Math.PI,
    ]);
    expect(record(array(motion.derivativeBoundsByCrease)[0])).toEqual({
      edgeId: 'e-hinge',
      bounds: [0, Math.PI],
    });
  });

  it('fixes one derivative lower-bound replacement and the sole complete parser oracle', () => {
    expect(
      polynomialDerivativeBoundsJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1,
        NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1.sourceDocument,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1.changedPaths);
    const result = parseArtifactContractV1(
      NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1.expectedIssues,
    );
  });

  it('fixes absence of all secondary path diagnostics', () => {
    const result = parseArtifactContractV1(
      NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map((issue) => issue.code)).toEqual(['invalid-bounds']);
  });

  it('matches the committed control and source exactly', async () => {
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'control-design.json'))).toEqual(
      NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(
      await jsonFile(join(BUNDLE_DIRECTORY, 'path-polynomial-derivative-bounds-inverted.json')),
    ).toEqual(NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1.sourceDocument);
  });

  it('strict-compiles the Draft 2020-12 schema and validates the runtime ledger', () => {
    expect(validate(committedLedger), JSON.stringify(validate.errors)).toBe(true);
    expect(parseNegPathPolynomialDerivativeBoundsCandidateBundleLedgerV1(committedLedger).ok).toBe(
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
      expect(parseNegPathPolynomialDerivativeBoundsCandidateBundleLedgerV1(changed).ok).toBe(false);
    }
  });

  it.each([
    'canonicalPathMutationFamilyComplete',
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
    expect(parseNegPathPolynomialDerivativeBoundsCandidateBundleLedgerV1(changed).ok).toBe(false);
  });

  it('builds the same closed four-file set twice', () => {
    const first = buildNegPathPolynomialDerivativeBoundsCandidateBundleV1();
    expect(first.files).toEqual(buildNegPathPolynomialDerivativeBoundsCandidateBundleV1().files);
    expect(first.files).toHaveLength(4);
  });

  it('verifies every check while keeping downstream claims false', () => {
    expect(committedVerification).toMatchObject({
      declaredPiecewisePolynomialDerivativeBoundsLowerUpperParserOnly: true,
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
        (fixture) => fixture.id === 'NEG-PATH-MUTATION-POLYNOMIAL-DERIVATIVE-BOUNDS-INVERTED',
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
    expect(await runNegPathPolynomialDerivativeBoundsCandidateBundleCli(['--verify'], io)).toBe(0);
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    const root = await mkdtemp(join(tmpdir(), 'neg-path-polynomial-derivative-bounds-cli-'));
    temporaryDirectories.push(root);
    stdout.length = 0;
    expect(
      await runNegPathPolynomialDerivativeBoundsCandidateBundleCli(
        ['--write', join(root, 'bundle'), '--json'],
        io,
      ),
    ).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(await runNegPathPolynomialDerivativeBoundsCandidateBundleCli(['--unknown'], io)).toBe(2);
  });

  it('rejects raw tampering and extra entries', async () => {
    const raw = await copyBundle('neg-path-polynomial-derivative-bounds-raw-');
    await writeFile(join(raw, 'path-polynomial-derivative-bounds-inverted.json'), '{}\n', 'utf8');
    expect(
      (await verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1(raw)).reasonCodes,
    ).toEqual(['artifact-hash-mismatch']);
    const extra = await copyBundle('neg-path-polynomial-derivative-bounds-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect(
      (await verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1(extra)).reasonCodes,
    ).toEqual(['artifact-set-mismatch']);
  });

  it('rejects links and unsafe writer cleanup', async () => {
    const directory = await copyBundle('neg-path-polynomial-derivative-bounds-link-');
    const sourcePath = join(directory, 'path-polynomial-derivative-bounds-inverted.json');
    await rm(sourcePath);
    await symlink(BUNDLE_DIRECTORY, sourcePath, 'junction');
    expect(
      (await verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['artifact-set-mismatch']);
    await expect(
      writeNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory),
    ).rejects.toThrow('unexpected entry');
  });

  it('refuses cleanup of an unexpected regular file', async () => {
    const directory = await copyBundle('neg-path-polynomial-derivative-bounds-writer-');
    await writeFile(join(directory, 'keep.txt'), 'keep\n', 'utf8');
    await expect(
      writeNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory),
    ).rejects.toThrow('unexpected entry');
    expect(await readFile(join(directory, 'keep.txt'), 'utf8')).toBe('keep\n');
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-path-polynomial-derivative-bounds-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-derivative-bounds',
      NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(
      (await verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory)).reasonCodes,
    ).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a shifted but accepted saved-control anchor', async () => {
    const directory = await copyBundle('neg-path-polynomial-derivative-bounds-control-');
    const control = record(await jsonFile(join(directory, 'control-design.json')));
    control.contractId = 'CONTRACT-DESIGN-POLYNOMIAL-DERIVATIVE-BOUNDS-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-design', control);
    expect(
      (await verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects the same lower-bound path when its complete parser oracle changes', async () => {
    const directory = await copyBundle('neg-path-polynomial-derivative-bounds-signature-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-derivative-bounds-inverted.json')),
    );
    firstDerivativeBounds(source)[0] = null;
    expect(
      polynomialDerivativeBoundsJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('changed oracle must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      {
        path: '$.pathCandidate.segments[0].motion.derivativeBoundsByCrease[0].bounds[0]',
        code: 'non-finite-number',
      },
    ]);
    await coherentlyRewriteArtifact(directory, 'source-path-polynomial-derivative-bounds', source);
    expect(
      (await verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['parser-issue-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects a wrong delta with the same complete parser oracle', async () => {
    const directory = await copyBundle('neg-path-polynomial-derivative-bounds-delta-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-derivative-bounds-inverted.json')),
    );
    const bounds = firstDerivativeBounds(source);
    bounds[0] = 0;
    bounds[1] = -1;
    expect(
      polynomialDerivativeBoundsJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(['$.pathCandidate.segments[0].motion.derivativeBoundsByCrease[0].bounds[1]']);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('wrong delta must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(directory, 'source-path-polynomial-derivative-bounds', source);
    expect(
      (await verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects different bytes with the same delta and complete oracle', async () => {
    const directory = await copyBundle('neg-path-polynomial-derivative-bounds-bytes-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-derivative-bounds-inverted.json')),
    );
    firstDerivativeBounds(source)[0] = 3 * Math.PI;
    expect(
      polynomialDerivativeBoundsJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('different bytes must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_DERIVATIVE_BOUNDS_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(directory, 'source-path-polynomial-derivative-bounds', source);
    const result = await verifyNegPathPolynomialDerivativeBoundsCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
