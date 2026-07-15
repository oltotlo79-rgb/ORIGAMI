import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { parseArtifactContractV1 } from '../../m0f/artifacts/contract.js';
import { runNegPathTimeCoverageCandidateBundleCli } from '../../m0f/neg-path-time-coverage-candidate-bundle-cli.js';
import {
  buildNegPathTimeCoverageCandidateBundleV1,
  NEG_PATH_TIME_COVERAGE_ARTIFACT_SPECS_V1,
  NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCHEMA_ID,
  NEG_PATH_TIME_COVERAGE_CASE_IDS,
  NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1,
  NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1,
  parseNegPathTimeCoverageCandidateBundleLedgerV1,
  verifyNegPathTimeCoverageCandidateBundleV1,
  writeNegPathTimeCoverageCandidateBundleV1,
  type NegPathTimeCoverageCandidateVerificationResultV1,
} from '../../m0f/neg-path-time-coverage-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY);
const SCHEMA_PATH = resolve(
  'm0f/schemas/neg-path-time-coverage-candidate-bundle-ledger-v1.schema.json',
);
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
  const destination = join(root, 'NEG-PATH-MUTATION-COVERAGE');
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
  const ledgerPath = join(directory, NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_LEDGER_FILENAME);
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

function secondBoundedMotion(source: JsonRecord): JsonRecord {
  const path = record(source.pathCandidate);
  const second = record(array(path.segments)[1]);
  const motion = record(second.motion);
  if (motion.kind !== 'bounded-interpolation') throw new TypeError('expected bounded motion');
  return motion;
}

let committedVerification: NegPathTimeCoverageCandidateVerificationResultV1;

beforeAll(async () => {
  committedVerification = await verifyNegPathTimeCoverageCandidateBundleV1();
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('NEG-PATH-MUTATION-COVERAGE exact-negative candidate bundle', () => {
  it('anchors one saved two-segment FOLD control and freshly accepts it', async () => {
    const authored = await jsonFile(resolve('tests/vectors/m0f-0/artifact-contract-fold-v1.json'));
    const saved = await jsonFile(join(BUNDLE_DIRECTORY, 'control-fold.json'));
    expect(saved).toEqual(NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1);
    const authoredWithoutPath = structuredClone(record(authored));
    const savedWithoutPath = structuredClone(record(saved));
    delete authoredWithoutPath.pathCandidate;
    delete savedWithoutPath.pathCandidate;
    expect(savedWithoutPath).toEqual(authoredWithoutPath);
    expect(array(record(record(saved).pathCandidate).segments)).toMatchObject([
      { t0: 0, t1: 0.5, motion: { kind: 'bounded-interpolation', knotTimes: [0, 0.5] } },
      { t0: 0.5, t1: 1, motion: { kind: 'bounded-interpolation', knotTimes: [0.5, 1] } },
    ]);
    expect(parseArtifactContractV1(saved)).toMatchObject({ ok: true });
  });

  it('fixes four saved mutations and their exact ordered changed paths', async () => {
    const savedControl = await jsonFile(join(BUNDLE_DIRECTORY, 'control-fold.json'));
    expect(NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1).toHaveLength(4);
    for (const caseSpec of NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1) {
      const sourceText = await readFile(join(BUNDLE_DIRECTORY, caseSpec.sourcePath), 'utf8');
      const source = JSON.parse(sourceText) as unknown;
      expect(sourceText).toBe(`${stableStringify(caseSpec.sourceDocument)}\n`);
      expect(source).toEqual(caseSpec.sourceDocument);
      expect(jsonDifferencePaths(savedControl, source)).toEqual(caseSpec.changedPaths);
    }
  });

  it('freshly rejects all four saved sources with their complete ordered oracles', async () => {
    for (const caseSpec of NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1) {
      const replay = parseArtifactContractV1(
        await jsonFile(join(BUNDLE_DIRECTORY, caseSpec.sourcePath)),
      );
      expect(replay.ok).toBe(false);
      if (replay.ok) throw new TypeError('exact-negative source must be rejected');
      expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
        caseSpec.expectedIssues,
      );
    }
  });

  it('states every material parser-only nonclaim in the saved README', async () => {
    const readme = await readFile(join(BUNDLE_DIRECTORY, 'README.md'), 'utf8');
    for (const phrase of [
      'four exact-negative mutations',
      'canonically registered or promoted',
      'endpoint continuity',
      'physical path continuity',
      'piecewise-polynomial coverage',
      'rigidity',
      'face isometry',
      'hinge geometry',
      'crease-map completeness',
      'contact semantics',
      'CCD',
      'collision detection',
      'collision freedom or foldability',
      'certificate-hash verification',
      'canonical path-mutation family',
      'SupportProfile',
      'ToleranceProfile',
      'scientific verification',
      'M0F GO',
    ]) {
      expect(readme).toContain(phrase);
    }
  });

  it('accepts the committed ledger in the closed runtime parser and strict Draft 2020 schema', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const parsed = parseNegPathTimeCoverageCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new TypeError('committed ledger must parse');
    expect(parsed.value.caseCount).toBe(4);
    expect(parsed.value.artifactCount).toBe(6);
    expect(parsed.value.cases.map(({ caseId }) => caseId)).toEqual(NEG_PATH_TIME_COVERAGE_CASE_IDS);

    const schema = await jsonFile(SCHEMA_PATH);
    expect(record(schema).$id).toBe(NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCHEMA_ID);
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    const validate = ajv.compile(record(schema));
    expect(validate(ledger), JSON.stringify(validate.errors)).toBe(true);
    const extra = { ...record(ledger), undeclared: false };
    expect(validate(extra)).toBe(false);
  });

  it('fixes artifact order and every source dependency on the single control', async () => {
    const ledger = record(
      await jsonFile(
        join(BUNDLE_DIRECTORY, NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
      ),
    );
    const artifacts = array(ledger.artifacts).map(record);
    expect(artifacts.map(({ artifactId }) => artifactId)).toEqual(
      NEG_PATH_TIME_COVERAGE_ARTIFACT_SPECS_V1.map(({ artifactId }) => artifactId),
    );
    expect(artifacts).toHaveLength(6);
    for (const artifact of artifacts.slice(2)) {
      expect(record(artifact.provenance)).toMatchObject({
        derivation: 'mutated-from-control',
        dependsOnArtifactIds: ['control-fold'],
      });
    }
  });

  it('rejects case, oracle, artifact, provenance, delta, and false-claim ledger rewrites', () => {
    const built = buildNegPathTimeCoverageCandidateBundleV1();
    const mutations: ((ledger: JsonRecord) => void)[] = [
      (ledger) => {
        record(array(ledger.cases)[0]).caseId = 'NEG-PATH-MUTATION-COVERAGE-REWRITE';
      },
      (ledger) => {
        record(array(record(array(ledger.cases)[0]).expectedIssues)[0]).code = 'wrong-code';
      },
      (ledger) => {
        record(array(ledger.artifacts)[2]).path = 'alternate.json';
      },
      (ledger) => {
        record(record(array(ledger.artifacts)[2]).provenance).dependsOnArtifactIds = [];
      },
      (ledger) => {
        record(array(ledger.cases)[0]).changedPaths = ['$.wrong'];
      },
      (ledger) => {
        ledger.canonicalPathMutationFamilyComplete = true;
      },
      (ledger) => {
        ledger.endpointContinuityEstablished = true;
      },
      (ledger) => {
        ledger.physicalPathContinuityEstablished = true;
      },
      (ledger) => {
        ledger.continuousCollisionDetectionIncluded = true;
      },
      (ledger) => {
        ledger.scientificVerificationClaimed = true;
      },
    ];
    for (const mutate of mutations) {
      const ledger = structuredClone(built.ledger) as unknown as JsonRecord;
      mutate(ledger);
      expect(parseNegPathTimeCoverageCandidateBundleLedgerV1(ledger).ok).toBe(false);
    }
  });

  it('builds twice and writes byte-identical isolated closed directories', async () => {
    const first = buildNegPathTimeCoverageCandidateBundleV1();
    const second = buildNegPathTimeCoverageCandidateBundleV1();
    expect(first).toEqual(second);
    expect(first.files).toHaveLength(7);
    const root = await mkdtemp(join(tmpdir(), 'neg-path-time-coverage-build-'));
    temporaryDirectories.push(root);
    const left = join(root, 'left');
    const right = join(root, 'right');
    await writeNegPathTimeCoverageCandidateBundleV1(left);
    await writeNegPathTimeCoverageCandidateBundleV1(right);
    expect((await readdir(left)).sort()).toEqual((await readdir(right)).sort());
    for (const file of first.files) {
      expect(await readFile(join(left, file.path), 'utf8')).toBe(file.text);
      expect(await readFile(join(right, file.path), 'utf8')).toBe(file.text);
    }
  });

  it('verifies every committed check while all downstream claims remain false', () => {
    expect(committedVerification).toMatchObject({
      reproducibleExactNegativeBundle: true,
      reasonCodes: [],
      declaredPathTimeCoverageParserOnly: true,
      canonicalPromotionClaimed: false,
      canonicalPathMutationFamilyComplete: false,
      endpointContinuityEstablished: false,
      piecewisePolynomialCoverageIncluded: false,
      supportProfileIncluded: false,
      toleranceProfileIncluded: false,
      physicalPathContinuityEstablished: false,
      creaseMapCompletenessEstablished: false,
      rigidityEstablished: false,
      faceIsometryEstablished: false,
      hingeGeometryEstablished: false,
      certificateHashVerificationIncluded: false,
      contactAnalysisIncluded: false,
      continuousCollisionDetectionIncluded: false,
      collisionDetectionIncluded: false,
      collisionFreedomEstablished: false,
      foldabilityEstablished: false,
      scientificVerificationClaimed: false,
      globalM0fGate: 'not-evaluated',
      checks: {
        ledgerPresentAndValid: true,
        artifactSetExact: true,
        allArtifactHashesMatch: true,
        allArtifactProvenanceFixed: true,
        canonicalManifestRegistrationAbsent: true,
        controlArtifactCount: 1,
        everyControlArtifactParsed: true,
        everySavedControlAccepted: true,
        sourceCaseCount: 4,
        everySourceParsed: true,
        everySourceControlDifferenceMatched: true,
        everySourceRejected: true,
        everyOrderedIssueSignatureMatched: true,
        deterministicRegenerationMatched: true,
      },
    });
  });

  it('keeps all four case IDs outside the canonical manifest', async () => {
    const parsed = parseFixtureManifest(await jsonFile(resolve('tests/fixtures/manifest.json')));
    expect(parsed.manifest).toBeDefined();
    const ids = new Set(parsed.manifest?.fixtures.map(({ id }) => id) ?? []);
    for (const caseId of NEG_PATH_TIME_COVERAGE_CASE_IDS) expect(ids.has(caseId)).toBe(false);
  });

  it('supports deterministic CLI verify/write and rejects invalid options', async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = {
      cwd: process.cwd(),
      stdout: (text: string) => stdout.push(text),
      stderr: (text: string) => stderr.push(text),
    };
    expect(await runNegPathTimeCoverageCandidateBundleCli(['--verify'], io)).toBe(0);
    expect(stdout.join('')).toContain('four declared path-time coverage parser replays only');
    expect(stderr).toEqual([]);
    const root = await mkdtemp(join(tmpdir(), 'neg-path-time-coverage-cli-'));
    temporaryDirectories.push(root);
    const destination = join(root, 'bundle');
    stdout.length = 0;
    expect(
      await runNegPathTimeCoverageCandidateBundleCli(['--write', destination, '--json'], io),
    ).toBe(0);
    expect(JSON.parse(stdout.join(''))).toMatchObject({
      reproducibleExactNegativeBundle: true,
      declaredPathTimeCoverageParserOnly: true,
    });
    expect(await runNegPathTimeCoverageCandidateBundleCli(['--unknown'], io)).toBe(2);
  });

  it('rejects raw tampering, extra entries, links, and unsafe writer cleanup', async () => {
    const sourceName = NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1[0].sourcePath;
    const tampered = await copyBundle('neg-path-time-coverage-tamper-');
    await writeFile(join(tampered, sourceName), '{}\n', 'utf8');
    expect((await verifyNegPathTimeCoverageCandidateBundleV1(tampered)).reasonCodes).toEqual([
      'artifact-hash-mismatch',
    ]);

    const extra = await copyBundle('neg-path-time-coverage-extra-');
    await writeFile(join(extra, 'extra.json'), '{}\n', 'utf8');
    expect((await verifyNegPathTimeCoverageCandidateBundleV1(extra)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
    await expect(writeNegPathTimeCoverageCandidateBundleV1(extra)).rejects.toThrow(
      'unexpected entry',
    );

    const linked = await copyBundle('neg-path-time-coverage-link-');
    const linkPath = join(linked, sourceName);
    await rm(linkPath);
    await symlink(BUNDLE_DIRECTORY, linkPath, 'junction');
    expect((await verifyNegPathTimeCoverageCandidateBundleV1(linked)).reasonCodes).toEqual([
      'artifact-set-mismatch',
    ]);
  });

  it('rejects a coherently rehashed accepted-source rewrite', async () => {
    const directory = await copyBundle('neg-path-time-coverage-accepted-');
    await coherentlyRewriteArtifact(
      directory,
      NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1[3].sourceArtifactId,
      NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1,
    );
    const result = await verifyNegPathTimeCoverageCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks.sourceCaseCount).toBe(4);
  });

  it('rejects a coherently rehashed accepted saved-control rewrite', async () => {
    const directory = await copyBundle('neg-path-time-coverage-control-');
    const control = record(await jsonFile(join(directory, 'control-fold.json')));
    control.contractId = 'CONTRACT-FOLD-TWO-FACE-ALTERNATE-V1';
    expect(parseArtifactContractV1(control)).toMatchObject({ ok: true });
    await coherentlyRewriteArtifact(directory, 'control-fold', control);
    const result = await verifyNegPathTimeCoverageCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks.everySavedControlAccepted).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });

  it('rejects a same-delta rewrite whose complete parser signature changes', async () => {
    const directory = await copyBundle('neg-path-time-coverage-signature-');
    const caseSpec = NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1[3];
    const source = record(await jsonFile(join(directory, caseSpec.sourcePath)));
    array(secondBoundedMotion(source).knotTimes)[0] = 'not-a-finite-knot';
    expect(jsonDifferencePaths(NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1, source)).toEqual(
      caseSpec.changedPaths,
    );
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('changed-signature rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).not.toEqual(
      caseSpec.expectedIssues,
    );
    await coherentlyRewriteArtifact(directory, caseSpec.sourceArtifactId, source);
    const result = await verifyNegPathTimeCoverageCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual([
      'parser-issue-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everySourceRejected).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(false);
  });

  it('rejects a wrong delta even when the complete parser oracle is unchanged', async () => {
    const directory = await copyBundle('neg-path-time-coverage-delta-');
    const caseSpec = NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1[3];
    const source = record(await jsonFile(join(directory, caseSpec.sourcePath)));
    source.contractId = 'CONTRACT-FOLD-TWO-FACE-DELTA-V1';
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('wrong-delta rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(caseSpec.expectedIssues);
    await coherentlyRewriteArtifact(directory, caseSpec.sourceArtifactId, source);
    expect((await verifyNegPathTimeCoverageCandidateBundleV1(directory)).reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
  });

  it('rejects different bytes with the same delta and complete parser oracle', async () => {
    const directory = await copyBundle('neg-path-time-coverage-same-oracle-');
    const caseSpec = NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1[3];
    const source = record(await jsonFile(join(directory, caseSpec.sourcePath)));
    array(secondBoundedMotion(source).knotTimes)[0] = 0.625;
    expect(jsonDifferencePaths(NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1, source)).toEqual(
      caseSpec.changedPaths,
    );
    const replay = parseArtifactContractV1(source);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new TypeError('same-oracle rewrite must remain rejected');
    expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(caseSpec.expectedIssues);
    await coherentlyRewriteArtifact(directory, caseSpec.sourceArtifactId, source);
    const result = await verifyNegPathTimeCoverageCandidateBundleV1(directory);
    expect(result.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(result.checks.everySourceControlDifferenceMatched).toBe(true);
    expect(result.checks.everyOrderedIssueSignatureMatched).toBe(true);
  });
});
