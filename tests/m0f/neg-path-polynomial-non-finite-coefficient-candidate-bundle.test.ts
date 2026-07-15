import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { runNegPathPolynomialNonFiniteCoefficientCandidateBundleCli } from '../../m0f/neg-path-polynomial-non-finite-coefficient-candidate-bundle-cli.js';
import {
  NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1,
  NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1,
  polynomialNonFiniteCoefficientJsonDifferencePaths,
  buildNegPathPolynomialNonFiniteCoefficientCandidateBundleV1,
  parseNegPathPolynomialNonFiniteCoefficientCandidateBundleLedgerV1,
  verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1,
  writeNegPathPolynomialNonFiniteCoefficientCandidateBundleV1,
} from '../../m0f/neg-path-polynomial-non-finite-coefficient-candidate-bundle.js';
import { NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1 } from '../../m0f/neg-path-polynomial-coefficient-degree-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(
  NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
);
const SCHEMA_PATH = resolve(
  'm0f/schemas/neg-path-polynomial-non-finite-coefficient-candidate-bundle-ledger-v1.schema.json',
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

function coefficientEntries(document: JsonRecord, segmentIndex: number): unknown[] {
  const pathCandidate = record(document.pathCandidate);
  const segment = record(array(pathCandidate.segments)[segmentIndex]);
  const motion = record(segment.motion);
  return array(motion.coefficientsByCrease);
}

function coefficientRows(document: JsonRecord, segmentIndex: number): unknown[] {
  return array(record(coefficientEntries(document, segmentIndex)[0]).coefficients);
}

function coefficientRow(document: JsonRecord, segmentIndex: number, rowIndex = 0): unknown[] {
  return array(coefficientRows(document, segmentIndex)[rowIndex]);
}

function segmentMotion(document: JsonRecord, segmentIndex: number): JsonRecord {
  return record(record(array(record(document.pathCandidate).segments)[segmentIndex]).motion);
}

function withoutPathCandidate(document: unknown): JsonRecord {
  const copy = structuredClone(record(document));
  delete copy.pathCandidate;
  return copy;
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
  await writeNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory);
  return directory;
}

async function coherentlyRewriteArtifactText(
  directory: string,
  artifactId: string,
  text: string,
): Promise<void> {
  const ledgerPath = join(
    directory,
    NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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

describe('NEG-PATH-MUTATION-POLYNOMIAL-NON-FINITE-COEFFICIENT candidate bundle', () => {
  let committedLedger: JsonRecord;
  let validate: ReturnType<Ajv2020['compile']>;
  let committedVerification: Awaited<
    ReturnType<typeof verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1>
  >;

  beforeAll(async () => {
    committedLedger = record(
      await jsonFile(
        join(
          BUNDLE_DIRECTORY,
          NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CANDIDATE_BUNDLE_LEDGER_FILENAME,
        ),
      ),
    );
    validate = new Ajv2020({ strict: true, allErrors: true }).compile(
      record(await jsonFile(SCHEMA_PATH)),
    );
    committedVerification = await verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1();
  });

  afterAll(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('keeps an owned accepted single-segment degree-one polynomial control fully anchored', () => {
    expect(
      parseArtifactContractV1(NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1),
    ).toMatchObject({ ok: true });
    expect(NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1).not.toBe(
      NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1).toEqual(
      NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(
      withoutPathCandidate(NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1),
    ).toEqual(
      withoutPathCandidate(NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1),
    );
    const ownedControl = structuredClone(
      NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1,
    ) as unknown as JsonRecord;
    const segments = array(record(ownedControl.pathCandidate).segments).map(record);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      t0: 0,
      t1: 1,
      motion: { kind: 'piecewise-polynomial', degree: 1 },
    });
    expect(coefficientEntries(ownedControl, 0)).toHaveLength(1);
    expect(coefficientRow(ownedControl, 0)).toEqual([0, Math.PI]);
    const motion = segmentMotion(ownedControl, 0);
    expect(record(array(motion.derivativeBoundsByCrease)[0])).toEqual({
      edgeId: 'e-hinge',
      bounds: [0, Math.PI],
    });
  });

  it('fixes one non-finite terminal coefficient and the sole complete parser oracle', () => {
    expect(
      polynomialNonFiniteCoefficientJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1,
        NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.sourceDocument,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.changedPaths);
    const result = parseArtifactContractV1(
      NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.expectedIssues,
    );
    expect(result.error[0]?.message).toBe('must be a finite binary64 number');
    const source = structuredClone(
      NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.sourceDocument,
    ) as unknown as JsonRecord;
    expect(coefficientEntries(source, 0)).toHaveLength(1);
    expect(coefficientRows(source, 0)).toHaveLength(1);
    expect(coefficientRow(source, 0)).toEqual([0, null]);
    expect(array(segmentMotion(source, 0).derivativeBoundsByCrease)).toHaveLength(1);
  });

  it('fixes absence of all secondary path diagnostics', () => {
    const result = parseArtifactContractV1(
      NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.sourceDocument,
    );
    if (result.ok) throw new TypeError('negative must reject');
    expect(result.error.map((issue) => issue.code)).toEqual(['non-finite-number']);
  });

  it('matches the committed control and source exactly', async () => {
    expect(await jsonFile(join(BUNDLE_DIRECTORY, 'control-design.json'))).toEqual(
      NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(
      await jsonFile(join(BUNDLE_DIRECTORY, 'path-polynomial-non-finite-coefficient.json')),
    ).toEqual(NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.sourceDocument);
  });

  it('strict-compiles the Draft 2020-12 schema and validates the runtime ledger', () => {
    expect(validate(committedLedger), JSON.stringify(validate.errors)).toBe(true);
    expect(
      parseNegPathPolynomialNonFiniteCoefficientCandidateBundleLedgerV1(committedLedger).ok,
    ).toBe(true);
  });

  it('keeps strict Ajv and the runtime parser aligned across recursive rewrites', () => {
    const mutations = recursiveClosedLedgerMutations(committedLedger);
    expect(mutations.length).toBeGreaterThan(100);
    for (const changed of mutations) {
      const schemaAccepted = validate(changed);
      const runtimeAccepted =
        parseNegPathPolynomialNonFiniteCoefficientCandidateBundleLedgerV1(changed).ok;
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
      expect(parseNegPathPolynomialNonFiniteCoefficientCandidateBundleLedgerV1(changed).ok).toBe(
        false,
      );
    }
  });

  it.each([
    'declaredPiecewisePolynomialNonEmptyCoefficientRowsParserOnly',
    'declaredPiecewisePolynomialUniqueCoefficientCreaseRowsParserOnly',
    'declaredPiecewisePolynomialUniqueDerivativeBoundCreaseRowsParserOnly',
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
    expect(parseNegPathPolynomialNonFiniteCoefficientCandidateBundleLedgerV1(changed).ok).toBe(
      false,
    );
  });

  it('builds the same closed four-file set twice', () => {
    const first = buildNegPathPolynomialNonFiniteCoefficientCandidateBundleV1();
    expect(first.files).toEqual(
      buildNegPathPolynomialNonFiniteCoefficientCandidateBundleV1().files,
    );
    expect(first.files).toHaveLength(4);
  });

  it('verifies every check while keeping downstream claims false', () => {
    expect(committedVerification).toMatchObject({
      declaredPiecewisePolynomialFiniteCoefficientsParserOnly: true,
      declaredPiecewisePolynomialNonEmptyCoefficientRowsParserOnly: false,
      declaredPiecewisePolynomialUniqueCoefficientCreaseRowsParserOnly: false,
      declaredPiecewisePolynomialUniqueDerivativeBoundCreaseRowsParserOnly: false,
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
        (fixture) => fixture.id === 'NEG-PATH-MUTATION-POLYNOMIAL-NON-FINITE-COEFFICIENT',
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
    expect(await runNegPathPolynomialNonFiniteCoefficientCandidateBundleCli(['--verify'], io)).toBe(
      0,
    );
    expect(stdout.join('')).toContain('REPRODUCIBLE EXACT-NEGATIVE CANDIDATE BUNDLE');
    const root = await mkdtemp(join(tmpdir(), 'neg-path-polynomial-non-finite-coefficient-cli-'));
    temporaryDirectories.push(root);
    stdout.length = 0;
    expect(
      await runNegPathPolynomialNonFiniteCoefficientCandidateBundleCli(
        ['--write', join(root, 'bundle'), '--json'],
        io,
      ),
    ).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({ reproducibleExactNegativeBundle: true });
    expect(
      await runNegPathPolynomialNonFiniteCoefficientCandidateBundleCli(['--unknown'], io),
    ).toBe(2);
  });

  it('rejects raw tampering and extra entries', async () => {
    const raw = await copyBundle('neg-path-polynomial-non-finite-coefficient-raw-');
    await writeFile(join(raw, 'path-polynomial-non-finite-coefficient.json'), '{}\n', 'utf8');
    expect(
      (await verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(raw)).reasonCodes,
    ).toEqual(['artifact-hash-mismatch']);
    const extra = await copyBundle('neg-path-polynomial-non-finite-coefficient-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect(
      (await verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(extra)).reasonCodes,
    ).toEqual(['artifact-set-mismatch']);
  });

  it('rejects links and unsafe writer cleanup', async () => {
    const directory = await copyBundle('neg-path-polynomial-non-finite-coefficient-link-');
    const sourcePath = join(directory, 'path-polynomial-non-finite-coefficient.json');
    await rm(sourcePath);
    await symlink(BUNDLE_DIRECTORY, sourcePath, 'junction');
    expect(
      (await verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['artifact-set-mismatch']);
    await expect(
      writeNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory),
    ).rejects.toThrow('unexpected entry');
  });

  it('refuses cleanup of an unexpected regular file', async () => {
    const directory = await copyBundle('neg-path-polynomial-non-finite-coefficient-writer-');
    await writeFile(join(directory, 'keep.txt'), 'keep\n', 'utf8');
    await expect(
      writeNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory),
    ).rejects.toThrow('unexpected entry');
    expect(await readFile(join(directory, 'keep.txt'), 'utf8')).toBe('keep\n');
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-path-polynomial-non-finite-coefficient-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-non-finite-coefficient',
      NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1,
    );
    expect(
      (await verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory)).reasonCodes,
    ).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects a shifted but accepted saved-control anchor', async () => {
    const directory = await copyBundle('neg-path-polynomial-non-finite-coefficient-control-');
    const control = record(await jsonFile(join(directory, 'control-design.json')));
    control.contractId = 'CONTRACT-DESIGN-POLYNOMIAL-NON-FINITE-COEFFICIENT-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-design', control);
    expect(
      (await verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects the same coefficient-leaf delta when its complete parser oracle changes', async () => {
    const directory = await copyBundle('neg-path-polynomial-non-finite-coefficient-signature-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-non-finite-coefficient.json')),
    );
    coefficientRow(source, 0).splice(1, 1);
    expect(
      polynomialNonFiniteCoefficientJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('changed oracle must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual([
      {
        path: '$.pathCandidate.segments[0].motion.coefficientsByCrease[0].coefficients[0]',
        code: 'coefficient-degree-mismatch',
      },
    ]);
    expect(replay.error[0]?.message).toBe('row length must equal degree + 1');
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-non-finite-coefficient',
      source,
    );
    expect(
      (await verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['parser-issue-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects a wrong delta with the same complete parser oracle', async () => {
    const directory = await copyBundle('neg-path-polynomial-non-finite-coefficient-delta-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-non-finite-coefficient.json')),
    );
    const benignControl = structuredClone(
      NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1,
    ) as unknown as JsonRecord;
    const benignDerivativeEntry = record(
      array(segmentMotion(benignControl, 0).derivativeBoundsByCrease)[0],
    );
    array(benignDerivativeEntry.bounds)[1] = 2 * Math.PI;
    expect(parseArtifactContractV1(benignControl)).toMatchObject({ ok: true });
    const derivativeEntry = record(array(segmentMotion(source, 0).derivativeBoundsByCrease)[0]);
    array(derivativeEntry.bounds)[1] = 2 * Math.PI;
    expect(
      polynomialNonFiniteCoefficientJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual([
      '$.pathCandidate.segments[0].motion.coefficientsByCrease[0].coefficients[0][1]',
      '$.pathCandidate.segments[0].motion.derivativeBoundsByCrease[0].bounds[1]',
    ]);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('wrong delta must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-non-finite-coefficient',
      source,
    );
    expect(
      (await verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory)).reasonCodes,
    ).toEqual(['source-control-difference-mismatch', 'deterministic-regeneration-mismatch']);
  });

  it('rejects different bytes with the same delta and complete oracle', async () => {
    const directory = await copyBundle('neg-path-polynomial-non-finite-coefficient-bytes-');
    const source = record(
      await jsonFile(join(directory, 'path-polynomial-non-finite-coefficient.json')),
    );
    coefficientRow(source, 0)[1] = 'not-a-number';
    expect(
      polynomialNonFiniteCoefficientJsonDifferencePaths(
        NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_DESIGN_CONTROL_SOURCE_V1,
        source,
      ),
    ).toEqual(NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.changedPaths);
    const replay = parseArtifactContractV1(source);
    if (replay.ok) throw new TypeError('same-path negative must reject');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
      NEG_PATH_POLYNOMIAL_NON_FINITE_COEFFICIENT_CASE_SPEC_V1.expectedIssues,
    );
    await coherentlyRewriteArtifact(
      directory,
      'source-path-polynomial-non-finite-coefficient',
      source,
    );
    const result = await verifyNegPathPolynomialNonFiniteCoefficientCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
