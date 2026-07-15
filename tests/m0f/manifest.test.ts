import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import {
  CANONICAL_FIXTURE_RULES,
  FIXTURE_COVERAGE_TAGS,
  auditCanonicalFixtureIds,
} from '../../m0f/canonical-fixtures.js';
import {
  ALLOWED_SPDX_IDS,
  KNOWN_ARTIFACT_KINDS,
  parseFixtureManifest,
  validateFixtureRepository,
} from '../../m0f/manifest.js';

async function manifestDocument(): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(resolve('tests/fixtures/manifest.json'), 'utf8')) as Record<
    string,
    unknown
  >;
}

function firstFixture(document: Record<string, unknown>): Record<string, unknown> {
  const fixtures = document.fixtures;
  if (!Array.isArray(fixtures) || typeof fixtures[0] !== 'object' || fixtures[0] === null) {
    throw new Error('test manifest has no first fixture');
  }
  return fixtures[0] as Record<string, unknown>;
}

function objectArray(fixture: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const value = fixture[key];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'object' || entry === null)) {
    throw new Error(`test fixture has no ${key} object array`);
  }
  return value as Record<string, unknown>[];
}

function objectAt(values: Record<string, unknown>[], index: number): Record<string, unknown> {
  const value = values[index];
  if (value === undefined) throw new Error(`test object array has no entry ${index}`);
  return value;
}

async function withTemporaryFixtureRepository(
  operation: (root: string, document: Record<string, unknown>) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'oridesign-m0f-manifest-'));
  try {
    await cp(resolve('tests/fixtures/_harness-smoke'), join(root, '_harness-smoke'), {
      recursive: true,
    });
    const document = await manifestDocument();
    await operation(root, document);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe('fixture manifest runtime validation', () => {
  it('keeps the strict Draft 2020-12 schema in parity with the committed v2 manifest', async () => {
    const schema = JSON.parse(
      await readFile(resolve('m0f/schemas/fixture-manifest-v2.schema.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toBe('https://oridesign.local/schemas/m0f/fixture-manifest-v2.schema.json');

    const definitions = schema.$defs as Record<string, Record<string, unknown>>;
    expect((definitions.spdx as { enum: unknown }).enum).toEqual(ALLOWED_SPDX_IDS);
    expect((definitions.coverageTag as { enum: unknown }).enum).toEqual(FIXTURE_COVERAGE_TAGS);
    const knownProperties = definitions.knownArtifactPointer?.properties as Record<
      string,
      Record<string, unknown>
    >;
    expect(knownProperties.kind?.enum).toEqual(KNOWN_ARTIFACT_KINDS);

    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    expect(validate(await manifestDocument()), JSON.stringify(validate.errors)).toBe(true);

    const unknownFieldDocument = await manifestDocument();
    firstFixture(unknownFieldDocument).unexpected = true;
    expect(validate(unknownFieldDocument)).toBe(false);
  });

  it('validates the harness fixture while reporting incomplete scientific fixtures', async () => {
    const result = await validateFixtureRepository(resolve('tests/fixtures/manifest.json'));
    expect(result.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(result.issues.filter((issue) => issue.severity === 'warning')).toHaveLength(
      CANONICAL_FIXTURE_RULES.length,
    );
    expect(result.manifest?.fixtures.map((fixture) => fixture.id)).toEqual(['_harness-smoke']);
  });

  it('returns an owned deeply frozen manifest instead of aliasing caller data', async () => {
    const document = await manifestDocument();
    const result = parseFixtureManifest(document);
    expect(result.manifest).toBeDefined();
    if (result.manifest === undefined) throw new Error('expected a parsed manifest');

    document.schemaVersion = 1;
    const rawRights = objectAt(objectArray(firstFixture(document), 'sourceReferences'), 0)
      .rights as Record<string, unknown>;
    rawRights.licenseSpdx = 'GPL-3.0-only';

    expect(result.manifest.schemaVersion).toBe(2);
    expect(result.manifest.fixtures[0]?.sourceReferences[0]?.rights).toEqual({
      redistribution: 'allowed',
      licenseSpdx: 'MIT',
    });
    expect(Object.isFrozen(result.manifest)).toBe(true);
    expect(Object.isFrozen(result.manifest.fixtures[0]?.sourceReferences[0]?.rights)).toBe(true);
    expect(() => {
      (result.manifest as unknown as { schemaVersion: number }).schemaVersion = 1;
    }).toThrow(TypeError);
  });

  it('validates one getter-consistent plain-data manifest snapshot', async () => {
    const document = await manifestDocument();
    let reads = 0;
    Object.defineProperty(document, 'schemaVersion', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? 2 : 1;
      },
    });
    const result = parseFixtureManifest(document);
    expect(result.manifest?.schemaVersion).toBe(2);
    expect(reads).toBe(1);

    const disguisedMap = Object.assign(new Map<string, unknown>(), await manifestDocument());
    const mapResult = parseFixtureManifest(disguisedMap);
    expect(mapResult.manifest).toBeUndefined();
    expect(mapResult.issues).toContainEqual(expect.objectContaining({ code: 'invalid-object' }));
  });

  it('promotes missing canonical fixture families to errors at the complete gate', async () => {
    const result = await validateFixtureRepository(resolve('tests/fixtures/manifest.json'), {
      completeness: 'm0f',
    });
    expect(
      result.issues.filter((issue) => issue.code === 'missing-canonical-fixture'),
    ).toHaveLength(CANONICAL_FIXTURE_RULES.length);
    expect(result.issues.some((issue) => issue.severity === 'error')).toBe(true);
  });

  it('rejects unknown fields and path traversal before reading files', async () => {
    const document = await manifestDocument();
    const fixture = firstFixture(document);
    fixture.unexpected = true;
    objectAt(objectArray(fixture, 'distributedArtifacts'), 0).path = '../outside.json';
    const result = parseFixtureManifest(document);
    expect(result.issues.some((issue) => issue.code === 'unknown-field')).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'unsafe-path')).toBe(true);
  });

  it('rejects a forged scientific outcome for _harness-smoke', async () => {
    const document = await manifestDocument();
    firstFixture(document).expectedOutcome = { kind: 'verified', checks: ['not-real'] };
    const result = parseFixtureManifest(document);
    expect(result.manifest).toBeUndefined();
    expect(result.issues.some((issue) => issue.code === 'smoke-claim-violation')).toBe(true);
  });

  it('hard-rejects schema v1 instead of ambiguously accepting both shapes', async () => {
    const document = await manifestDocument();
    document.schemaVersion = 1;
    const result = parseFixtureManifest(document);
    expect(result.manifest).toBeUndefined();
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'unsupported-schema', path: '$.schemaVersion' }),
    );
  });

  it('uses the fixed six-license SPDX allowlist and rejects non-allowlisted licenses', async () => {
    expect(ALLOWED_SPDX_IDS).toEqual([
      'MIT',
      '0BSD',
      'BSD-2-Clause',
      'BSD-3-Clause',
      'Apache-2.0',
      'ISC',
    ]);
    const document = await manifestDocument();
    objectAt(objectArray(firstFixture(document), 'sourceReferences'), 0).rights = {
      redistribution: 'allowed',
      licenseSpdx: 'GPL-3.0-only',
    };
    objectAt(objectArray(firstFixture(document), 'distributedArtifacts'), 0).licenseSpdx =
      'GPL-3.0-only';
    const result = parseFixtureManifest(document);
    expect(result.issues.filter((issue) => issue.code === 'unapproved-spdx')).toHaveLength(2);
  });

  it('requires complete acquisition metadata and forbids redistribution of metadata-only sources', async () => {
    const document = await manifestDocument();
    const fixture = firstFixture(document);
    objectAt(objectArray(fixture, 'sourceReferences'), 0).rights = {
      redistribution: 'metadata-only',
      status: 'unknown',
    };
    objectAt(objectArray(fixture, 'distributedArtifacts'), 0).sourceUse = 'redistributed-source';
    const result = parseFixtureManifest(document);
    expect(result.issues.filter((issue) => issue.code === 'metadata-only-incomplete')).toHaveLength(
      3,
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'metadata-only-redistribution' }),
    );
  });

  it('permits an independently authored equivalent to cite complete metadata-only source records', async () => {
    const document = await manifestDocument();
    const fixture = firstFixture(document);
    fixture.id = 'REF-RABBIT-EAR';
    fixture.workflow = 'reference-verification';
    fixture.polarity = 'positive';
    fixture.toleranceProfileId = 'tolerance-candidate';
    fixture.expectedOutcome = { kind: 'verified', checks: ['reference-verifier'] };
    fixture.coverageTags = [
      'cp:topology',
      'cp:mountain-valley',
      'target:flat',
      'path:rigid-continuous',
    ];
    const source = objectAt(objectArray(fixture, 'sourceReferences'), 0);
    source.sourceKind = 'external';
    source.rights = { redistribution: 'metadata-only', status: 'unknown' };
    source.sourceUrl = 'https://example.test/source.json';
    source.sourceSha256 = `sha256:${'0'.repeat(64)}`;
    source.acquisitionInstructions = 'Obtain from the cited source and verify its hash.';
    for (const artifact of objectArray(fixture, 'distributedArtifacts')) {
      if (typeof artifact.path !== 'string') throw new Error('artifact path must be a string');
      artifact.path = artifact.path.replace('_harness-smoke/', 'REF-RABBIT-EAR/');
      artifact.sourceUse = 'independent-equivalent';
    }

    const result = parseFixtureManifest(document);
    expect(result.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(result.manifest).toBeDefined();
    expect(result.issues.some((issue) => issue.code === 'metadata-only-incomplete')).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'metadata-only-redistribution')).toBe(
      false,
    );
    expect(result.issues.some((issue) => issue.code === 'source-use-mismatch')).toBe(false);
  });

  it('rejects unknown or empty coverage and requires exactly the four harness tags', async () => {
    const unknownDocument = await manifestDocument();
    firstFixture(unknownDocument).coverageTags = ['harness:not-declared'];
    expect(parseFixtureManifest(unknownDocument).issues).toContainEqual(
      expect.objectContaining({ code: 'invalid-coverage-tag' }),
    );

    const emptyDocument = await manifestDocument();
    firstFixture(emptyDocument).coverageTags = [];
    const emptyIssues = parseFixtureManifest(emptyDocument).issues;
    expect(emptyIssues).toContainEqual(expect.objectContaining({ code: 'invalid-coverage-tags' }));
    expect(emptyIssues).toContainEqual(
      expect.objectContaining({ code: 'smoke-coverage-violation' }),
    );
  });

  it('requires the normative coverage subset attached to each canonical fixture family', async () => {
    const document = await manifestDocument();
    const fixture = firstFixture(document);
    fixture.id = 'REF-RABBIT-EAR';
    fixture.workflow = 'reference-verification';
    fixture.polarity = 'positive';
    fixture.toleranceProfileId = 'tolerance-candidate';
    fixture.expectedOutcome = { kind: 'verified', checks: ['reference-verifier'] };
    fixture.coverageTags = ['cp:topology'];
    const result = parseFixtureManifest(document);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: 'missing-required-coverage-tag',
        fixtureId: 'REF-RABBIT-EAR',
      }),
    );
  });

  it('rejects duplicate file registration and dangling artifact pointers', async () => {
    const duplicateDocument = await manifestDocument();
    const duplicateArtifacts = objectArray(firstFixture(duplicateDocument), 'distributedArtifacts');
    objectAt(duplicateArtifacts, 1).path = objectAt(duplicateArtifacts, 0).path;
    expect(parseFixtureManifest(duplicateDocument).issues).toContainEqual(
      expect.objectContaining({ code: 'duplicate-artifact-path' }),
    );

    const danglingDocument = await manifestDocument();
    const input = firstFixture(danglingDocument).input;
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('bad input pointer');
    }
    (input as Record<string, unknown>).artifactId = 'missing-input';
    expect(parseFixtureManifest(danglingDocument).issues).toContainEqual(
      expect.objectContaining({ code: 'missing-artifact-reference' }),
    );
  });

  it('rejects regular files that are present below a fixture directory but absent from the ledger', async () => {
    await withTemporaryFixtureRepository(async (root, document) => {
      await writeFile(join(root, '_harness-smoke', 'unregistered.txt'), 'not registered\n');
      await writeFile(join(root, 'manifest.json'), JSON.stringify(document));
      const result = await validateFixtureRepository(join(root, 'manifest.json'));
      expect(result.issues).toContainEqual(expect.objectContaining({ code: 'unregistered-file' }));
    });
  });

  it('rejects undeclared sibling directories at the fixture root', async () => {
    await withTemporaryFixtureRepository(async (root, document) => {
      await mkdir(join(root, 'not-in-manifest'));
      await writeFile(join(root, 'not-in-manifest', 'input.json'), '{}\n');
      await writeFile(join(root, 'manifest.json'), JSON.stringify(document));
      const result = await validateFixtureRepository(join(root, 'manifest.json'));
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: 'unregistered-root-entry' }),
      );
    });
  });

  it('rejects a declared fixture directory implemented as a junction or symbolic link', async () => {
    await withTemporaryFixtureRepository(async (root, document) => {
      const target = await mkdtemp(join(tmpdir(), 'oridesign-m0f-junction-target-'));
      try {
        await rm(join(root, '_harness-smoke'), { recursive: true, force: true });
        await symlink(target, join(root, '_harness-smoke'), 'junction');
        await writeFile(join(root, 'manifest.json'), JSON.stringify(document));
        const result = await validateFixtureRepository(join(root, 'manifest.json'));
        expect(result.issues).toContainEqual(
          expect.objectContaining({ code: 'symlink-or-reparse' }),
        );
      } finally {
        await rm(target, { recursive: true, force: true });
      }
    });
  });
});

describe('canonical ID audit', () => {
  it('rejects unknown and duplicate IDs independently of fixture contents', () => {
    const issues = auditCanonicalFixtureIds(
      ['GEN-TM-BIRD-4', 'GEN-TM-BIRD-4', 'NOT-NORMATIVE'],
      'harness',
    );
    expect(issues.some((issue) => issue.code === 'duplicate-id')).toBe(true);
    expect(issues.some((issue) => issue.code === 'unknown-id')).toBe(true);
  });
});
