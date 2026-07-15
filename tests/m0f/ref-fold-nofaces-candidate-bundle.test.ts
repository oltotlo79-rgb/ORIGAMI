import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  buildRefFoldNoFacesCandidateBundleV1,
  parseRefFoldNoFacesCandidateBundleLedgerV1,
  REF_FOLD_NOFACES_CANDIDATE_ARTIFACT_SPECS_V1,
  REF_FOLD_NOFACES_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
  REF_FOLD_NOFACES_CANDIDATE_BUNDLE_LEDGER_FILENAME,
  REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCHEMA_ID,
  verifyRefFoldNoFacesCandidateBundleV1,
  writeRefFoldNoFacesCandidateBundleV1,
  type RefFoldNoFacesCandidateBundleVerificationResultV1,
} from '../../m0f/ref-fold-nofaces-candidate-bundle.js';
import { runRefFoldNoFacesCandidateBundleCli } from '../../m0f/ref-fold-nofaces-candidate-bundle-cli.js';
import { parseFixtureManifest, sha256Prefixed } from '../../m0f/manifest.js';
import {
  FACE_COMPLEX_AUDITOR_SOURCE_FILES_V1,
  FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH,
} from '../../m0f/reference-verifier/face-complex-evidence.js';
import { FACE_COMPLEX_MUTATION_CASE_IDS } from '../../m0f/reference-verifier/face-complex-mutation-suite.js';
import { stableStringify } from '../../m0f/stable-json.js';

const BUNDLE_DIRECTORY = resolve(REF_FOLD_NOFACES_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY);
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
  const destination = join(root, 'REF-FOLD-NOFACES');
  await cp(BUNDLE_DIRECTORY, destination, { recursive: true });
  return destination;
}

async function rewriteArtifactAndLedger(
  bundleDirectory: string,
  artifactId: string,
  document: unknown,
): Promise<void> {
  const ledgerPath = join(bundleDirectory, REF_FOLD_NOFACES_CANDIDATE_BUNDLE_LEDGER_FILENAME);
  const ledger = record(await jsonFile(ledgerPath));
  const artifacts = array(ledger.artifacts).map(record);
  const artifact = artifacts.find((entry) => entry.artifactId === artifactId);
  if (artifact === undefined || typeof artifact.path !== 'string') {
    throw new TypeError('test artifact must exist');
  }
  const text = `${stableStringify(document)}\n`;
  await writeFile(join(bundleDirectory, artifact.path), text, 'utf8');
  artifact.sha256 = sha256Prefixed(text);
  await writeFile(ledgerPath, `${stableStringify(ledger)}\n`, 'utf8');
}

async function currentAuditorSourceSetHash(): Promise<string> {
  const nul = '\0';
  const sourceFiles = new Set<string>(FACE_COMPLEX_AUDITOR_SOURCE_FILES_V1);
  const fileEntries: string[] = [];
  expect(sourceFiles.size).toBe(FACE_COMPLEX_AUDITOR_SOURCE_FILES_V1.length);
  for (const relativePath of FACE_COMPLEX_AUDITOR_SOURCE_FILES_V1) {
    const absolutePath = resolve(relativePath);
    const source = await readFile(absolutePath, 'utf8');
    const normalizedSource = source.replace(/\r\n?/g, '\n');
    const sourceHash = createHash('sha256').update(normalizedSource).digest('hex');
    fileEntries.push(`${relativePath}${nul}${sourceHash}`);

    const imports = [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map(
      (match) => match[1],
    );
    for (const specifier of imports) {
      if (!specifier?.startsWith('.')) continue;
      const dependency = relative(
        process.cwd(),
        resolve(dirname(absolutePath), specifier.replace(/\.js$/, '.ts')),
      ).replaceAll('\\', '/');
      expect(sourceFiles.has(dependency), `${relativePath} imports unhashed ${dependency}`).toBe(
        true,
      );
    }
  }
  const material = `oridesign${nul}m0f-face-complex-auditor-source-set-utf8-lf-v1${nul}${fileEntries.join(nul)}`;
  return `sha256:${createHash('sha256').update(material).digest('hex')}`;
}

let committedVerification: RefFoldNoFacesCandidateBundleVerificationResultV1;

beforeAll(async () => {
  committedVerification = await verifyRefFoldNoFacesCandidateBundleV1();
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('REF-FOLD-NOFACES project-authored candidate bundle', () => {
  it('validates the committed closed ledger with both the runtime parser and exact-row schema', async () => {
    const ledger = await jsonFile(
      join(BUNDLE_DIRECTORY, REF_FOLD_NOFACES_CANDIDATE_BUNDLE_LEDGER_FILENAME),
    );
    const parsed = parseRefFoldNoFacesCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('committed candidate ledger must parse');
    expect(parsed.value).toMatchObject({
      schemaId: REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCHEMA_ID,
      contractStatus: 'candidate',
      scientificClaim: false,
      fixtureId: 'REF-FOLD-NOFACES',
      canonicalManifestRegistration: 'not-registered',
      canonicalPromotionClaimed: false,
      toleranceProfileIncluded: false,
      scientificVerificationClaimed: false,
      globalM0fGate: 'not-evaluated',
      artifactCount: 8,
    });
    expect(
      parsed.value.artifacts.map(({ artifactId, role, path, provenance }) => ({
        artifactId,
        role,
        path,
        provenance,
      })),
    ).toEqual(
      REF_FOLD_NOFACES_CANDIDATE_ARTIFACT_SPECS_V1.map(
        ({ artifactId, role, path, provenance }) => ({ artifactId, role, path, provenance }),
      ),
    );

    const schema = record(
      await jsonFile(
        resolve('m0f/schemas/ref-fold-nofaces-candidate-bundle-ledger-v1.schema.json'),
      ),
    );
    expect(schema.$id).toBe(REF_FOLD_NOFACES_CANDIDATE_BUNDLE_SCHEMA_ID);
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    expect(validate(ledger), JSON.stringify(validate.errors)).toBe(true);

    const permuted = structuredClone(ledger) as JsonRecord;
    const rows = array(permuted.artifacts);
    [rows[0], rows[1]] = [rows[1], rows[0]];
    expect(validate(permuted)).toBe(false);
    expect(parseRefFoldNoFacesCandidateBundleLedgerV1(permuted).ok).toBe(false);

    const claimField = structuredClone(ledger) as JsonRecord;
    claimField.verified = true;
    expect(validate(claimField)).toBe(false);
  });

  it.each([
    ['verified', true],
    ['toleranceProfile', { id: 'invented-profile' }],
    ['globalM0fGo', true],
  ])('rejects undeclared claim field %s', async (field, suppliedValue) => {
    const ledger = record(
      await jsonFile(join(BUNDLE_DIRECTORY, REF_FOLD_NOFACES_CANDIDATE_BUNDLE_LEDGER_FILENAME)),
    );
    ledger[field] = suppliedValue;
    const parsed = parseRefFoldNoFacesCandidateBundleLedgerV1(ledger);
    expect(parsed).toMatchObject({
      ok: false,
      error: [expect.objectContaining({ path: `$.${field}`, code: 'unknown-field' })],
    });
  });

  it('rejects direct candidate claim escalation', async () => {
    const ledger = record(
      await jsonFile(join(BUNDLE_DIRECTORY, REF_FOLD_NOFACES_CANDIDATE_BUNDLE_LEDGER_FILENAME)),
    );
    ledger.contractStatus = 'verified';
    ledger.scientificClaim = true;
    ledger.canonicalPromotionClaimed = true;
    ledger.toleranceProfileIncluded = true;
    const parsed = parseRefFoldNoFacesCandidateBundleLedgerV1(ledger);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new TypeError('claim-escalated ledger must fail');
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

  it('hash-checks all eight artifacts and replays reconstruction, audit, reaudit, and eleven mutations', async () => {
    expect(committedVerification).toEqual({
      schemaVersion: 1,
      recordType: 'm0f-ref-fold-nofaces-candidate-bundle-verification-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      fixtureId: 'REF-FOLD-NOFACES',
      scope: 'project-authored-face-reconstruction-audit-and-mutation-reproducibility-only',
      globalM0fGate: 'not-evaluated',
      canonicalPromotionClaimed: false,
      toleranceProfileIncluded: false,
      scientificVerificationClaimed: false,
      reproducibleCandidateBundle: true,
      reasonCodes: [],
      checks: {
        ledgerPresentAndValid: true,
        artifactSetExact: true,
        allArtifactHashesMatch: true,
        allArtifactProvenanceFixed: true,
        canonicalManifestRegistrationAbsent: true,
        sourceInputParsed: true,
        evidenceIndexParsed: true,
        reconstructionRecordParsed: true,
        reconstructionRerunMatched: true,
        auditRecordParsed: true,
        auditRerunMatched: true,
        auditEvidenceParsed: true,
        auditEvidenceRerunMatched: true,
        mutationSuiteParsed: true,
        mutationResultParsed: true,
        mutationCaseCount: 11,
        mutationRerunMatched: true,
        deterministicRegenerationMatched: true,
      },
    });
    expect(Object.isFrozen(committedVerification)).toBe(true);
    expect(FACE_COMPLEX_MUTATION_CASE_IDS).toHaveLength(11);

    const auditEvidence = record(
      await jsonFile(join(BUNDLE_DIRECTORY, 'face-audit-evidence.json')),
    );
    expect(record(auditEvidence.implementation).sourceSetHash).toBe(
      FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH,
    );
    expect(await currentAuditorSourceSetHash()).toBe(FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH);
  });

  it('keeps the candidate vector absent from the canonical fixture manifest', async () => {
    const manifest = parseFixtureManifest(await jsonFile(resolve('tests/fixtures/manifest.json')));
    expect(manifest.manifest).toBeDefined();
    expect(manifest.manifest?.fixtures.some((fixture) => fixture.id === 'REF-FOLD-NOFACES')).toBe(
      false,
    );
  });

  it('regenerates byte-identical files twice and verifies a freshly written isolated copy', async () => {
    const first = await buildRefFoldNoFacesCandidateBundleV1();
    const second = await buildRefFoldNoFacesCandidateBundleV1();
    expect(second).toEqual(first);
    for (const file of first.files) {
      expect(await readFile(join(BUNDLE_DIRECTORY, file.path), 'utf8')).toBe(file.text);
    }

    const root = await mkdtemp(join(tmpdir(), 'oridesign-ref-fold-nofaces-regenerate-'));
    temporaryDirectories.push(root);
    const generatedDirectory = join(root, 'REF-FOLD-NOFACES');
    await writeRefFoldNoFacesCandidateBundleV1(generatedDirectory);
    await expect(verifyRefFoldNoFacesCandidateBundleV1(generatedDirectory)).resolves.toMatchObject({
      reproducibleCandidateBundle: true,
      reasonCodes: [],
    });
  });

  it('exposes a verify-by-default JSON CLI without evaluating a wider gate', async () => {
    let stdout = '';
    let stderr = '';
    const code = await runRefFoldNoFacesCandidateBundleCli(['--json'], {
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
      reproducibleCandidateBundle: true,
    });
  });

  it('rejects changed bytes, an extra file, and a linked expected path', async () => {
    const tampered = await copyBundle('oridesign-ref-fold-nofaces-tamper-');
    await writeFile(join(tampered, 'face-mutation-result.json'), '{}\n', 'utf8');
    await expect(verifyRefFoldNoFacesCandidateBundleV1(tampered)).resolves.toMatchObject({
      reproducibleCandidateBundle: false,
      reasonCodes: ['artifact-hash-mismatch'],
      checks: { allArtifactHashesMatch: false },
    });

    const withExtra = await copyBundle('oridesign-ref-fold-nofaces-extra-');
    await writeFile(join(withExtra, 'unregistered.txt'), 'extra\n', 'utf8');
    await expect(verifyRefFoldNoFacesCandidateBundleV1(withExtra)).resolves.toMatchObject({
      reproducibleCandidateBundle: false,
      reasonCodes: ['artifact-set-mismatch'],
      checks: { artifactSetExact: false },
    });

    const withLink = await copyBundle('oridesign-ref-fold-nofaces-link-');
    const outside = join(dirname(withLink), 'outside-directory');
    await mkdir(outside);
    await rm(join(withLink, 'README.md'));
    await symlink(
      outside,
      join(withLink, 'README.md'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    await expect(verifyRefFoldNoFacesCandidateBundleV1(withLink)).resolves.toMatchObject({
      reproducibleCandidateBundle: false,
      reasonCodes: ['artifact-set-mismatch'],
      checks: { artifactSetExact: false },
    });
  });

  it('rejects a coherently rehashed reconstruction seed rewrite and keeps replay checks false', async () => {
    const rewritten = await copyBundle('oridesign-ref-fold-nofaces-seed-');
    const recordPath = join(rewritten, 'face-reconstruction-record.json');
    const reconstruction = record(await jsonFile(recordPath));
    reconstruction.seed = 43;
    await rewriteArtifactAndLedger(rewritten, 'face-reconstruction-record', reconstruction);

    const result = await verifyRefFoldNoFacesCandidateBundleV1(rewritten);
    expect(result.reproducibleCandidateBundle).toBe(false);
    expect(result.reasonCodes).toEqual([
      'reconstruction-record-invalid',
      'reconstruction-rerun-mismatch',
      'deterministic-regeneration-mismatch',
    ]);
    expect(result.checks).toMatchObject({
      allArtifactHashesMatch: true,
      reconstructionRecordParsed: false,
      reconstructionRerunMatched: false,
      auditRerunMatched: false,
      mutationRerunMatched: false,
      deterministicRegenerationMatched: false,
    });
  });
});
