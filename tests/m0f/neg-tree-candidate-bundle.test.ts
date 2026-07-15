import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { parseOrderedTreeInputV1 } from '../../m0f/box-pleating/ordered-tree-input.js';
import { runNegTreeCandidateBundleCli } from '../../m0f/neg-tree-candidate-bundle-cli.js';
import {
  buildNegTreeCandidateBundleV1,
  NEG_TREE_ARTIFACT_SPECS_V1,
  NEG_TREE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_TREE_CANDIDATE_BUNDLE_SCHEMA_ID,
  NEG_TREE_CASE_SPECS_V1,
  NEG_TREE_LEAF_BOUNDARY_CONTROL_SOURCE_V1,
  NEG_TREE_VALID_CONTROL_SOURCE_V1,
  parseNegTreeCandidateBundleLedgerV1,
  verifyNegTreeCandidateBundleV1,
  writeNegTreeCandidateBundleV1,
  type NegTreeCandidateVerificationResultV1,
} from '../../m0f/neg-tree-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(NEG_TREE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY);
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
  const destination = join(root, 'NEG-TREE');
  await cp(BUNDLE_DIRECTORY, destination, { recursive: true });
  return destination;
}

function jsonDifferencePaths(left: unknown, right: unknown, path = '$'): string[] {
  if (Object.is(left, right)) return [];
  if (Array.isArray(left) && Array.isArray(right)) {
    const differences: string[] = [];
    for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
      const childPath = `${path}[${String(index)}]`;
      if (!Object.hasOwn(left, index) || !Object.hasOwn(right, index)) {
        differences.push(childPath);
      } else {
        differences.push(...jsonDifferencePaths(left[index], right[index], childPath));
      }
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
    ];
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
  const ledgerPath = join(directory, NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME);
  const ledger = record(await jsonFile(ledgerPath));
  const artifact = array(ledger.artifacts)
    .map(record)
    .find((entry) => entry.artifactId === artifactId);
  if (artifact === undefined || typeof artifact.path !== 'string') {
    throw new TypeError(`missing artifact ${artifactId}`);
  }
  const sourceText = `${stableStringify(source)}\n`;
  await writeFile(join(directory, artifact.path), sourceText, 'utf8');
  artifact.sha256 = sha256Prefixed(sourceText);
  await writeFile(ledgerPath, `${stableStringify(ledger)}\n`, 'utf8');
}

let committedVerification: NegTreeCandidateVerificationResultV1;

beforeAll(async () => {
  committedVerification = await verifyNegTreeCandidateBundleV1();
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('NEG-TREE exact-negative candidate bundle', () => {
  it('requires both accepted controls before fixing twelve exact negative cases', () => {
    expect(parseOrderedTreeInputV1(NEG_TREE_VALID_CONTROL_SOURCE_V1)).toMatchObject({ ok: true });
    expect(parseOrderedTreeInputV1(NEG_TREE_LEAF_BOUNDARY_CONTROL_SOURCE_V1)).toMatchObject({
      ok: true,
    });
    expect(NEG_TREE_CASE_SPECS_V1.map((entry) => entry.caseId)).toEqual([
      'NEG-TREE-DUPLICATE-NODE-ID',
      'NEG-TREE-DUPLICATE-EDGE-ID',
      'NEG-TREE-DUPLICATE-ID-NAMESPACE',
      'NEG-TREE-SELF-LOOP',
      'NEG-TREE-PARALLEL-EDGE',
      'NEG-TREE-CYCLE',
      'NEG-TREE-DISCONNECTED',
      'NEG-TREE-NONPOSITIVE-LENGTH',
      'NEG-TREE-NEGATIVE-WIDTH',
      'NEG-TREE-ROTATION-COVERAGE-MISSING',
      'NEG-TREE-ROTATION-INCIDENCE-MISMATCH',
      'NEG-TREE-LEAF-COUNT-OUT-OF-RANGE',
    ]);
  });

  it('fixes every source to its declared control by the complete ordered difference path list', async () => {
    for (const caseSpec of NEG_TREE_CASE_SPECS_V1) {
      const control =
        caseSpec.controlId === 'primary-star-four-leaf-control-v1'
          ? NEG_TREE_VALID_CONTROL_SOURCE_V1
          : NEG_TREE_LEAF_BOUNDARY_CONTROL_SOURCE_V1;
      expect(jsonDifferencePaths(control, caseSpec.sourceDocument), caseSpec.caseId).toEqual(
        caseSpec.changedPaths,
      );
      expect(await jsonFile(join(BUNDLE_DIRECTORY, caseSpec.sourcePath)), caseSpec.caseId).toEqual(
        caseSpec.sourceDocument,
      );
    }
  });

  it('freshly rejects every saved source with its complete ordered parser code/path array', async () => {
    for (const caseSpec of NEG_TREE_CASE_SPECS_V1) {
      const source = await jsonFile(join(BUNDLE_DIRECTORY, caseSpec.sourcePath));
      const replay = parseOrderedTreeInputV1(source);
      expect(replay.ok, caseSpec.caseId).toBe(false);
      if (replay.ok) throw new TypeError('negative tree source must be rejected');
      expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
        caseSpec.expectedIssues,
      );
    }
  });

  it('covers every required parser boundary without treating overflow as leaf-underflow evidence', () => {
    const codes = new Set<string>(
      NEG_TREE_CASE_SPECS_V1.flatMap((entry) => entry.expectedIssues.map((issue) => issue.code)),
    );
    for (const required of [
      'duplicate-id',
      'tree-self-loop',
      'tree-parallel-edge',
      'tree-cycle',
      'tree-disconnected',
      'invalid-bound',
      'rotation-coverage-mismatch',
      'rotation-incidence-mismatch',
      'leaf-count-out-of-range',
    ]) {
      expect(codes.has(required), required).toBe(true);
    }
    const leafCase = NEG_TREE_CASE_SPECS_V1.at(-1);
    expect(leafCase).toMatchObject({
      caseId: 'NEG-TREE-LEAF-COUNT-OUT-OF-RANGE',
      controlId: 'two-center-twenty-leaf-control-v1',
      expectedIssues: [{ path: '$.nodes', code: 'leaf-count-out-of-range' }],
    });
    expect(leafCase?.sourceDocument.nodes).toHaveLength(23);
  });

  it('accepts the committed ledger in the runtime parser and strict exact-row schema', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const parsed = parseNegTreeCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('committed NEG-TREE ledger must parse');
    expect(parsed.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      vectorSetId: 'NEG-TREE-V1',
      canonicalManifestRegistration: 'not-registered',
      canonicalPromotionClaimed: false,
      toleranceProfileIncluded: false,
      scientificVerificationClaimed: false,
      globalM0fGate: 'not-evaluated',
      caseCount: 12,
      artifactCount: 13,
    });

    const schema = record(
      await jsonFile(resolve('m0f/schemas/neg-tree-candidate-bundle-ledger-v1.schema.json')),
    );
    expect(schema.$id).toBe(NEG_TREE_CANDIDATE_BUNDLE_SCHEMA_ID);
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    expect(validate(ledger), JSON.stringify(validate.errors)).toBe(true);

    const wrongArtifactId = structuredClone(ledger) as JsonRecord;
    record(array(wrongArtifactId.artifacts)[1]).artifactId = 'source-rewritten';
    expect(validate(wrongArtifactId)).toBe(false);
    expect(parseNegTreeCandidateBundleLedgerV1(wrongArtifactId).ok).toBe(false);

    const wrongArtifactPath = structuredClone(ledger) as JsonRecord;
    record(array(wrongArtifactPath.artifacts)[1]).path = 'rewritten.json';
    expect(validate(wrongArtifactPath)).toBe(false);
    expect(parseNegTreeCandidateBundleLedgerV1(wrongArtifactPath).ok).toBe(false);
  });

  it('rejects case order, source path, difference path, and expected issue rewrites', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const schema = record(
      await jsonFile(resolve('m0f/schemas/neg-tree-candidate-bundle-ledger-v1.schema.json')),
    );
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

    const reordered = structuredClone(ledger) as JsonRecord;
    const reorderedCases = array(reordered.cases);
    [reorderedCases[0], reorderedCases[1]] = [reorderedCases[1], reorderedCases[0]];
    expect(validate(reordered)).toBe(false);
    expect(parseNegTreeCandidateBundleLedgerV1(reordered).ok).toBe(false);

    const wrongPath = structuredClone(ledger) as JsonRecord;
    record(array(wrongPath.cases)[0]).sourcePath = 'rewritten.json';
    expect(validate(wrongPath)).toBe(false);
    expect(parseNegTreeCandidateBundleLedgerV1(wrongPath).ok).toBe(false);

    const wrongDifference = structuredClone(ledger) as JsonRecord;
    array(record(array(wrongDifference.cases)[0]).changedPaths)[0] = '$.nodes[0].id';
    expect(validate(wrongDifference)).toBe(false);
    expect(parseNegTreeCandidateBundleLedgerV1(wrongDifference).ok).toBe(false);

    const wrongIssue = structuredClone(ledger) as JsonRecord;
    record(array(record(array(wrongIssue.cases)[0]).expectedIssues)[0]).path = '$.nodes[0].id';
    expect(validate(wrongIssue)).toBe(false);
    expect(parseNegTreeCandidateBundleLedgerV1(wrongIssue).ok).toBe(false);

    const reorderedIssues = structuredClone(ledger) as JsonRecord;
    const firstIssues = array(record(array(reorderedIssues.cases)[0]).expectedIssues);
    [firstIssues[0], firstIssues[1]] = [firstIssues[1], firstIssues[0]];
    expect(validate(reorderedIssues)).toBe(false);
    expect(parseNegTreeCandidateBundleLedgerV1(reorderedIssues).ok).toBe(false);

    const reorderedArtifacts = structuredClone(ledger) as JsonRecord;
    const artifacts = array(reorderedArtifacts.artifacts);
    [artifacts[1], artifacts[2]] = [artifacts[2], artifacts[1]];
    expect(validate(reorderedArtifacts)).toBe(false);
    expect(parseNegTreeCandidateBundleLedgerV1(reorderedArtifacts).ok).toBe(false);
  });

  it.each([
    ['verified', true],
    ['toleranceProfile', { id: 'invented' }],
    ['globalM0fGo', true],
    ['supportProfile', { id: 'invented' }],
    ['foldabilityProven', true],
    ['treeMethodFeasible', true],
  ])('rejects undeclared claim field %s', async (field, suppliedValue) => {
    const ledger = record(
      await jsonFile(join(BUNDLE_DIRECTORY, NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME)),
    );
    ledger[field] = suppliedValue;
    const parsed = parseNegTreeCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new TypeError('claim field must be rejected');
    expect(parsed.error).toContainEqual(
      expect.objectContaining({ path: `$.${field}`, code: 'unknown-field' }),
    );
  });

  it('rejects direct status, scientific, promotion, tolerance, and GO escalation', async () => {
    const ledger = record(
      await jsonFile(join(BUNDLE_DIRECTORY, NEG_TREE_CANDIDATE_BUNDLE_LEDGER_FILENAME)),
    );
    ledger.contractStatus = 'verified';
    ledger.scientificClaim = true;
    ledger.canonicalPromotionClaimed = true;
    ledger.toleranceProfileIncluded = true;
    ledger.scientificVerificationClaimed = true;
    ledger.globalM0fGate = 'GO';
    const parsed = parseNegTreeCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new TypeError('claim escalation must be rejected');
    for (const path of [
      '$.contractStatus',
      '$.scientificClaim',
      '$.canonicalPromotionClaimed',
      '$.toleranceProfileIncluded',
      '$.scientificVerificationClaimed',
      '$.globalM0fGate',
    ]) {
      expect(parsed.error).toContainEqual(
        expect.objectContaining({ path, code: 'invalid-literal' }),
      );
    }
  });

  it('hash-checks thirteen artifacts and reproduces every control, delta, and issue oracle', () => {
    expect(committedVerification).toEqual({
      schemaVersion: 1,
      recordType: 'm0f-neg-tree-candidate-bundle-verification-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      vectorSetId: 'NEG-TREE-V1',
      scope: 'project-authored-exact-negative-ordered-tree-input-parser-replay-only',
      globalM0fGate: 'not-evaluated',
      canonicalPromotionClaimed: false,
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
        everyControlAccepted: true,
        sourceCaseCount: 12,
        everySourceParsed: true,
        everySourceControlDifferenceMatched: true,
        everySourceRejected: true,
        everyOrderedIssueSignatureMatched: true,
        deterministicRegenerationMatched: true,
      },
    });
    expect(NEG_TREE_ARTIFACT_SPECS_V1).toHaveLength(13);
    expect(Object.isFrozen(committedVerification)).toBe(true);
  });

  it('keeps every NEG-TREE case outside the canonical fixture manifest', async () => {
    const manifest = parseFixtureManifest(await jsonFile(resolve('tests/fixtures/manifest.json')));
    expect(manifest.manifest).toBeDefined();
    expect(manifest.manifest?.fixtures.some((fixture) => fixture.id.startsWith('NEG-TREE-'))).toBe(
      false,
    );
  });

  it('regenerates identical files, writes an isolated copy, and exposes verify-by-default CLI', async () => {
    const first = buildNegTreeCandidateBundleV1();
    const second = buildNegTreeCandidateBundleV1();
    expect(second).toEqual(first);
    for (const file of first.files) {
      expect(await readFile(join(BUNDLE_DIRECTORY, file.path), 'utf8')).toBe(file.text);
    }

    const root = await mkdtemp(join(tmpdir(), 'oridesign-neg-tree-regenerate-'));
    temporaryDirectories.push(root);
    const generatedDirectory = join(root, 'NEG-TREE');
    await writeNegTreeCandidateBundleV1(generatedDirectory);
    await expect(verifyNegTreeCandidateBundleV1(generatedDirectory)).resolves.toMatchObject({
      reproducibleExactNegativeBundle: true,
      reasonCodes: [],
    });

    let stdout = '';
    let stderr = '';
    const code = await runNegTreeCandidateBundleCli(['--json'], {
      cwd: process.cwd(),
      stdout: (text) => {
        stdout += text;
      },
      stderr: (text) => {
        stderr += text;
      },
    });
    expect(code).toBe(0);
    expect(stderr).toBe('');
    expect(JSON.parse(stdout)).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      globalM0fGate: 'not-evaluated',
      reproducibleExactNegativeBundle: true,
    });
  });

  it('rejects changed source bytes even when JSON remains syntactically valid', async () => {
    const tampered = await copyBundle('oridesign-neg-tree-tamper-');
    await writeFile(join(tampered, 'cycle.json'), '{}\n', 'utf8');
    await expect(verifyNegTreeCandidateBundleV1(tampered)).resolves.toMatchObject({
      reproducibleExactNegativeBundle: false,
      reasonCodes: ['artifact-hash-mismatch'],
      checks: { allArtifactHashesMatch: false },
    });
  });

  it('rejects an extra file and a linked expected path as artifact-set mismatches', async () => {
    const withExtra = await copyBundle('oridesign-neg-tree-extra-');
    await writeFile(join(withExtra, 'unregistered.txt'), 'extra\n', 'utf8');
    await expect(verifyNegTreeCandidateBundleV1(withExtra)).resolves.toMatchObject({
      reproducibleExactNegativeBundle: false,
      reasonCodes: ['artifact-set-mismatch'],
      checks: { artifactSetExact: false },
    });

    const withLink = await copyBundle('oridesign-neg-tree-link-');
    const outside = join(dirname(withLink), 'outside-directory');
    await mkdir(outside);
    await rm(join(withLink, 'README.md'));
    await symlink(
      outside,
      join(withLink, 'README.md'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    await expect(verifyNegTreeCandidateBundleV1(withLink)).resolves.toMatchObject({
      reproducibleExactNegativeBundle: false,
      reasonCodes: ['artifact-set-mismatch'],
      checks: { artifactSetExact: false },
    });
  });

  it('rejects a coherently rehashed accepted-control rewrite through delta and parser replay', async () => {
    const rewritten = await copyBundle('oridesign-neg-tree-accepted-');
    await coherentlyRewriteArtifact(
      rewritten,
      'source-duplicate-node-id',
      NEG_TREE_VALID_CONTROL_SOURCE_V1,
    );
    const result = await verifyNegTreeCandidateBundleV1(rewritten);
    expect(result.reasonCodes).toEqual([
      'source-control-difference-mismatch',
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks).toMatchObject({
      allArtifactHashesMatch: true,
      everySourceControlDifferenceMatched: false,
      everySourceRejected: false,
      everyOrderedIssueSignatureMatched: false,
      deterministicRegenerationMatched: false,
    });
  });

  it('rejects a coherently rehashed source whose complete parser issue signature changes', async () => {
    const rewritten = await copyBundle('oridesign-neg-tree-issue-');
    const source = structuredClone(
      NEG_TREE_CASE_SPECS_V1.find(
        (entry) => entry.caseId === 'NEG-TREE-ROTATION-INCIDENCE-MISMATCH',
      )?.sourceDocument,
    );
    if (source === undefined) throw new TypeError('rotation incidence source must exist');
    requiredEntry(source.rotation, 0).edgeIds = ['missing-edge'];
    await coherentlyRewriteArtifact(rewritten, 'source-rotation-incidence-mismatch', source);

    const result = await verifyNegTreeCandidateBundleV1(rewritten);
    expect(result.reasonCodes).toEqual([
      'parser-issue-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks).toMatchObject({
      allArtifactHashesMatch: true,
      everySourceControlDifferenceMatched: true,
      everySourceRejected: true,
      everyOrderedIssueSignatureMatched: false,
      deterministicRegenerationMatched: false,
    });
  });

  it('rejects different coherently rehashed bytes even when delta paths and parser issues match', async () => {
    const rewritten = await copyBundle('oridesign-neg-tree-exact-bytes-');
    const source = structuredClone(
      NEG_TREE_CASE_SPECS_V1.find((entry) => entry.caseId === 'NEG-TREE-NONPOSITIVE-LENGTH')
        ?.sourceDocument,
    );
    if (source === undefined) throw new TypeError('nonpositive-length source must exist');
    requiredEntry(source.edges, 0).length = -1;
    await coherentlyRewriteArtifact(rewritten, 'source-nonpositive-length', source);

    const result = await verifyNegTreeCandidateBundleV1(rewritten);
    expect(result.reasonCodes).toEqual(['deterministic-regeneration-mismatch']);
    expect(result.checks).toMatchObject({
      allArtifactHashesMatch: true,
      everySourceControlDifferenceMatched: true,
      everySourceRejected: true,
      everyOrderedIssueSignatureMatched: true,
      deterministicRegenerationMatched: false,
    });
  });
});
