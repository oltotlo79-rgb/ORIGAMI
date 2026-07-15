import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { adaptFoldDocumentToFaceReconstructionInputV1 } from '../../m0f/geometry/fold-document-face-adapter.js';
import { runNegFoldUnsupportedCandidateBundleCli } from '../../m0f/neg-fold-unsupported-candidate-bundle-cli.js';
import {
  buildNegFoldUnsupportedCandidateBundleV1,
  NEG_FOLD_UNSUPPORTED_ARTIFACT_SPECS_V1,
  NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCHEMA_ID,
  NEG_FOLD_UNSUPPORTED_CASE_SPECS_V1,
  NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1,
  parseNegFoldUnsupportedCandidateBundleLedgerV1,
  verifyNegFoldUnsupportedCandidateBundleV1,
  writeNegFoldUnsupportedCandidateBundleV1,
  type NegFoldUnsupportedCandidateVerificationResultV1,
} from '../../m0f/neg-fold-unsupported-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY);
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
  const destination = join(root, 'NEG-FOLD-UNSUPPORTED');
  await cp(BUNDLE_DIRECTORY, destination, { recursive: true });
  return destination;
}

function expectedSource(caseId: string): Record<string, unknown> {
  const control = structuredClone(NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1);
  switch (caseId) {
    case 'NEG-FOLD-UNSUPPORTED-MULTI-FRAME':
      return { ...control, file_frames: [{}] };
    case 'NEG-FOLD-UNSUPPORTED-3D':
      return { ...control, frame_attributes: ['3D'] };
    case 'NEG-FOLD-UNSUPPORTED-NONPLANAR-3D-COORDINATE':
      return {
        ...control,
        vertices_coords: [
          [1, 1, 1],
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ],
      };
    case 'NEG-FOLD-UNSUPPORTED-NON-MANIFOLD':
      return { ...control, frame_attributes: ['2D', 'nonManifold'] };
    case 'NEG-FOLD-UNSUPPORTED-NON-ORIENTABLE':
      return { ...control, frame_attributes: ['2D', 'nonOrientable'] };
    case 'NEG-FOLD-UNSUPPORTED-SELF-INTERSECTING':
      return { ...control, frame_attributes: ['2D', 'selfIntersecting'] };
    case 'NEG-FOLD-UNSUPPORTED-CUTS':
      return { ...control, frame_attributes: ['2D', 'cuts'] };
    case 'NEG-FOLD-UNSUPPORTED-JOINS':
      return { ...control, frame_attributes: ['2D', 'joins'] };
    case 'NEG-FOLD-UNSUPPORTED-ASSIGNMENT-C':
      return { ...control, edges_assignment: ['C', 'B', 'B', 'B'] };
    case 'NEG-FOLD-UNSUPPORTED-ASSIGNMENT-J':
      return { ...control, edges_assignment: ['J', 'B', 'B', 'B'] };
    default:
      throw new TypeError(`unknown negative case ${caseId}`);
  }
}

let committedVerification: NegFoldUnsupportedCandidateVerificationResultV1;

beforeAll(async () => {
  committedVerification = await verifyNegFoldUnsupportedCandidateBundleV1();
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('NEG-FOLD-UNSUPPORTED exact-negative candidate bundle', () => {
  it('keeps one accepted control and changes only the targeted field in each negative source', () => {
    expect(
      adaptFoldDocumentToFaceReconstructionInputV1(NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1),
    ).toMatchObject({ ok: true });
    expect(NEG_FOLD_UNSUPPORTED_CASE_SPECS_V1).toHaveLength(10);
    for (const caseSpec of NEG_FOLD_UNSUPPORTED_CASE_SPECS_V1) {
      expect(caseSpec.sourceDocument).toEqual(expectedSource(caseSpec.caseId));
      const replay = adaptFoldDocumentToFaceReconstructionInputV1(caseSpec.sourceDocument);
      expect(replay.ok, caseSpec.caseId).toBe(false);
      if (replay.ok) throw new TypeError('negative source must be rejected');
      expect(replay.error.map(({ path, code }) => ({ path, code }))).toEqual(
        caseSpec.expectedIssues,
      );
    }
  });

  it('fixes the multi-issue 3D and four-tuple nonplanar boundary oracles in order', () => {
    const byId = new Map(NEG_FOLD_UNSUPPORTED_CASE_SPECS_V1.map((entry) => [entry.caseId, entry]));
    expect(byId.get('NEG-FOLD-UNSUPPORTED-3D')?.expectedIssues).toEqual([
      { path: '$.frame_attributes', code: 'unsupported-frame-attribute' },
      { path: '$.frame_attributes[0]', code: 'unsupported-frame-attribute' },
    ]);
    expect(byId.get('NEG-FOLD-UNSUPPORTED-NONPLANAR-3D-COORDINATE')?.expectedIssues).toEqual([
      { path: '$.vertices_coords[0]', code: 'invalid-coordinate' },
      { path: '$.vertices_coords[1]', code: 'invalid-coordinate' },
      { path: '$.vertices_coords[2]', code: 'invalid-coordinate' },
      { path: '$.vertices_coords[3]', code: 'invalid-coordinate' },
    ]);
  });

  it('accepts the committed ledger in the runtime parser and strict exact-row schema', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const parsed = parseNegFoldUnsupportedCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('committed negative ledger must parse');
    expect(parsed.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      vectorSetId: 'NEG-FOLD-UNSUPPORTED-V1',
      canonicalManifestRegistration: 'not-registered',
      canonicalPromotionClaimed: false,
      toleranceProfileIncluded: false,
      scientificVerificationClaimed: false,
      globalM0fGate: 'not-evaluated',
      caseCount: 10,
      artifactCount: 11,
    });
    expect(
      parsed.value.artifacts.map(({ artifactId, role, path, provenance }) => ({
        artifactId,
        role,
        path,
        provenance,
      })),
    ).toEqual(
      NEG_FOLD_UNSUPPORTED_ARTIFACT_SPECS_V1.map(({ artifactId, role, path, provenance }) => ({
        artifactId,
        role,
        path,
        provenance,
      })),
    );

    const schema = record(
      await jsonFile(
        resolve('m0f/schemas/neg-fold-unsupported-candidate-bundle-ledger-v1.schema.json'),
      ),
    );
    expect(schema.$id).toBe(NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_SCHEMA_ID);
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    expect(validate(ledger), JSON.stringify(validate.errors)).toBe(true);

    const reordered = structuredClone(ledger) as JsonRecord;
    const cases = array(reordered.cases);
    [cases[0], cases[1]] = [cases[1], cases[0]];
    expect(validate(reordered)).toBe(false);
    expect(parseNegFoldUnsupportedCandidateBundleLedgerV1(reordered).ok).toBe(false);

    const wrongPath = structuredClone(ledger) as JsonRecord;
    record(array(wrongPath.cases)[0]).sourcePath = 'rewritten.fold';
    expect(validate(wrongPath)).toBe(false);
    expect(parseNegFoldUnsupportedCandidateBundleLedgerV1(wrongPath).ok).toBe(false);

    const claim = structuredClone(ledger) as JsonRecord;
    claim.verified = true;
    expect(validate(claim)).toBe(false);
  });

  it.each([
    ['verified', true],
    ['toleranceProfile', { id: 'invented' }],
    ['globalM0fGo', true],
  ])('rejects undeclared claim field %s', async (field, suppliedValue) => {
    const ledger = record(
      await jsonFile(join(BUNDLE_DIRECTORY, NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME)),
    );
    ledger[field] = suppliedValue;
    const parsed = parseNegFoldUnsupportedCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new TypeError('claim field must be rejected');
    expect(parsed.error).toContainEqual(
      expect.objectContaining({ path: `$.${field}`, code: 'unknown-field' }),
    );
  });

  it('rejects direct status and claim escalation', async () => {
    const ledger = record(
      await jsonFile(join(BUNDLE_DIRECTORY, NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME)),
    );
    ledger.contractStatus = 'verified';
    ledger.scientificClaim = true;
    ledger.canonicalPromotionClaimed = true;
    ledger.toleranceProfileIncluded = true;
    const parsed = parseNegFoldUnsupportedCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new TypeError('claim escalation must be rejected');
    for (const path of [
      '$.contractStatus',
      '$.scientificClaim',
      '$.canonicalPromotionClaimed',
      '$.toleranceProfileIncluded',
    ]) {
      expect(parsed.error).toContainEqual(
        expect.objectContaining({ path, code: 'invalid-literal' }),
      );
    }
  });

  it('hash-checks eleven artifacts and freshly reproduces every complete adapter issue list', () => {
    expect(committedVerification).toEqual({
      schemaVersion: 1,
      recordType: 'm0f-neg-fold-unsupported-candidate-bundle-verification-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      vectorSetId: 'NEG-FOLD-UNSUPPORTED-V1',
      scope: 'project-authored-exact-negative-fold-document-face-adapter-replay-only',
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
        sourceCaseCount: 10,
        everySourceParsed: true,
        everySourceRejected: true,
        everyOrderedIssueSignatureMatched: true,
        deterministicRegenerationMatched: true,
      },
    });
    expect(Object.isFrozen(committedVerification)).toBe(true);
  });

  it('keeps every NEG-FOLD-UNSUPPORTED case outside the canonical fixture manifest', async () => {
    const manifest = parseFixtureManifest(await jsonFile(resolve('tests/fixtures/manifest.json')));
    expect(manifest.manifest).toBeDefined();
    expect(
      manifest.manifest?.fixtures.some((fixture) => fixture.id.startsWith('NEG-FOLD-UNSUPPORTED-')),
    ).toBe(false);
  });

  it('regenerates identical files twice, writes an isolated copy, and exposes verify-by-default CLI', async () => {
    const first = buildNegFoldUnsupportedCandidateBundleV1();
    const second = buildNegFoldUnsupportedCandidateBundleV1();
    expect(second).toEqual(first);
    for (const file of first.files) {
      expect(await readFile(join(BUNDLE_DIRECTORY, file.path), 'utf8')).toBe(file.text);
    }

    const root = await mkdtemp(join(tmpdir(), 'oridesign-neg-fold-regenerate-'));
    temporaryDirectories.push(root);
    const generatedDirectory = join(root, 'NEG-FOLD-UNSUPPORTED');
    await writeNegFoldUnsupportedCandidateBundleV1(generatedDirectory);
    await expect(
      verifyNegFoldUnsupportedCandidateBundleV1(generatedDirectory),
    ).resolves.toMatchObject({ reproducibleExactNegativeBundle: true, reasonCodes: [] });

    let stdout = '';
    let stderr = '';
    const code = await runNegFoldUnsupportedCandidateBundleCli(['--json'], {
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

  it('rejects changed source bytes even when the JSON remains syntactically valid', async () => {
    const tampered = await copyBundle('oridesign-neg-fold-tamper-');
    await writeFile(join(tampered, 'assignment-c.fold'), '{}\n', 'utf8');
    await expect(verifyNegFoldUnsupportedCandidateBundleV1(tampered)).resolves.toMatchObject({
      reproducibleExactNegativeBundle: false,
      reasonCodes: ['artifact-hash-mismatch'],
      checks: { allArtifactHashesMatch: false },
    });
  });

  it('rejects an extra file and a linked expected path as artifact-set mismatches', async () => {
    const withExtra = await copyBundle('oridesign-neg-fold-extra-');
    await writeFile(join(withExtra, 'unregistered.txt'), 'extra\n', 'utf8');
    await expect(verifyNegFoldUnsupportedCandidateBundleV1(withExtra)).resolves.toMatchObject({
      reproducibleExactNegativeBundle: false,
      reasonCodes: ['artifact-set-mismatch'],
      checks: { artifactSetExact: false },
    });

    const withLink = await copyBundle('oridesign-neg-fold-link-');
    const outside = join(dirname(withLink), 'outside-directory');
    await mkdir(outside);
    await rm(join(withLink, 'README.md'));
    await symlink(
      outside,
      join(withLink, 'README.md'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    await expect(verifyNegFoldUnsupportedCandidateBundleV1(withLink)).resolves.toMatchObject({
      reproducibleExactNegativeBundle: false,
      reasonCodes: ['artifact-set-mismatch'],
      checks: { artifactSetExact: false },
    });
  });

  it('rejects a changed issue path even when the rewritten ledger remains valid JSON', async () => {
    const rewritten = await copyBundle('oridesign-neg-fold-path-');
    const ledgerPath = join(rewritten, NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME);
    const ledger = record(await jsonFile(ledgerPath));
    const firstCase = record(array(ledger.cases)[0]);
    record(array(firstCase.expectedIssues)[0]).path = '$.file_frames[0]';
    await writeFile(ledgerPath, `${stableStringify(ledger)}\n`, 'utf8');
    await expect(verifyNegFoldUnsupportedCandidateBundleV1(rewritten)).resolves.toMatchObject({
      reproducibleExactNegativeBundle: false,
      reasonCodes: ['ledger-invalid'],
      checks: { ledgerPresentAndValid: false },
    });
  });

  it('rejects a coherently rehashed source rewrite through adapter replay and regeneration', async () => {
    const rewritten = await copyBundle('oridesign-neg-fold-source-');
    const ledgerPath = join(rewritten, NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME);
    const ledger = record(await jsonFile(ledgerPath));
    const artifacts = array(ledger.artifacts).map(record);
    const sourceArtifact = artifacts.find((entry) => entry.artifactId === 'source-assignment-c');
    if (sourceArtifact === undefined || typeof sourceArtifact.path !== 'string') {
      throw new TypeError('assignment C artifact must exist');
    }
    const acceptedSource = structuredClone(NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1);
    const sourceText = `${stableStringify(acceptedSource)}\n`;
    await writeFile(join(rewritten, sourceArtifact.path), sourceText, 'utf8');
    sourceArtifact.sha256 = sha256Prefixed(sourceText);
    await writeFile(ledgerPath, `${stableStringify(ledger)}\n`, 'utf8');

    const result = await verifyNegFoldUnsupportedCandidateBundleV1(rewritten);
    expect(result.reproducibleExactNegativeBundle).toBe(false);
    expect(result.reasonCodes).toEqual([
      'source-unexpectedly-accepted',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks).toMatchObject({
      allArtifactHashesMatch: true,
      everySourceParsed: true,
      everySourceRejected: false,
      everyOrderedIssueSignatureMatched: false,
      deterministicRegenerationMatched: false,
    });
  });

  it('rejects a coherently rehashed source whose complete adapter issue signature changes', async () => {
    const rewritten = await copyBundle('oridesign-neg-fold-issue-');
    const ledgerPath = join(rewritten, NEG_FOLD_UNSUPPORTED_CANDIDATE_BUNDLE_LEDGER_FILENAME);
    const ledger = record(await jsonFile(ledgerPath));
    const artifacts = array(ledger.artifacts).map(record);
    const sourceArtifact = artifacts.find((entry) => entry.artifactId === 'source-multi-frame');
    if (sourceArtifact === undefined || typeof sourceArtifact.path !== 'string') {
      throw new TypeError('multi-frame artifact must exist');
    }
    const changedSource = {
      ...structuredClone(NEG_FOLD_UNSUPPORTED_VALID_CONTROL_SOURCE_V1),
      file_frames: null,
    };
    const sourceText = `${stableStringify(changedSource)}\n`;
    await writeFile(join(rewritten, sourceArtifact.path), sourceText, 'utf8');
    sourceArtifact.sha256 = sha256Prefixed(sourceText);
    await writeFile(ledgerPath, `${stableStringify(ledger)}\n`, 'utf8');

    const result = await verifyNegFoldUnsupportedCandidateBundleV1(rewritten);
    expect(result.reproducibleExactNegativeBundle).toBe(false);
    expect(result.reasonCodes).toEqual([
      'adapter-issue-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks).toMatchObject({
      allArtifactHashesMatch: true,
      everySourceParsed: true,
      everySourceRejected: true,
      everyOrderedIssueSignatureMatched: false,
      deterministicRegenerationMatched: false,
    });
  });
});
