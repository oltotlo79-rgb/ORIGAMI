import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { collectDependencyLicenses, runLicenseCheck } from '../../scripts/check-licenses.mjs';
import {
  createDeterministicLicenseInventory,
  createLicenseInventoryManifest,
  createRawFileHashDescriptor,
  serializeLicenseArtifactJson,
  verifyLicenseInventoryArtifact,
} from '../../scripts/license-artifact.mjs';
import { evaluateLicense } from '../../scripts/license-policy.mjs';

function dependency(name, location, license = 'MIT') {
  return {
    name,
    version: '1.0.0',
    location,
    license,
    integrity: `sha512-${name}`,
    resolved: `https://registry.example/${name}.tgz`,
    ...evaluateLicense(license),
  };
}

function project(license = 'MIT') {
  return {
    name: 'test-project',
    version: '0.0.0',
    location: '',
    license,
    ...evaluateLicense(license),
  };
}

function artifact() {
  const inventory = createDeterministicLicenseInventory({
    projectLicense: project(),
    dependencies: [
      dependency('z-package', 'node_modules/z-package'),
      dependency('a-package', 'node_modules/a-package', 'Apache-2.0'),
    ],
  });
  const inventoryJson = serializeLicenseArtifactJson(inventory);
  const manifest = createLicenseInventoryManifest({
    createdAt: '2026-01-01T00:00:00.000Z',
    inventoryPath: '.artifacts/license-inventory.json',
    inventoryJson,
    inputs: [createRawFileHashDescriptor('package-lock.json', Buffer.from('lock'))],
    toolSources: [createRawFileHashDescriptor('scripts/check-licenses.mjs', Buffer.from('tool'))],
    environment: {
      nodeVersion: 'v22.0.0',
      npmVersion: '10.0.0',
      sourceRevision: 'a'.repeat(40),
      sourceTreeState: 'clean',
      ciRunId: 'test-run',
    },
  });
  return { inventory, inventoryJson, manifest };
}

describe('candidate license inventory artifacts', () => {
  it('creates deterministic lockfile-only inventory and a hash-bound run manifest', () => {
    const first = artifact();
    const second = artifact();

    expect(first).toEqual(second);
    expect(first.inventory).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      artifactKind: 'deterministic-lockfile-license-inventory-not-final-audit',
      dependencyCount: 2,
      counts: {
        eligiblePackageCount: 2,
        linkEntryCount: 0,
        nodeModulesFallbackCount: 0,
        violationCount: 0,
      },
      limitations: {
        licenseTextAndNoticeAuditIncluded: false,
        legalCompatibilityAuditIncluded: false,
        redistributionDecisionAuditIncluded: false,
        fixtureAndSourceProvenanceAuditIncluded: false,
        gplReferenceImplementationAuditIncluded: false,
        finalDependencyLicenseAuditIncluded: false,
        globalM0fGo: false,
      },
    });
    expect(first.inventory.dependencies.map(({ name }) => name)).toEqual([
      'a-package',
      'z-package',
    ]);
    expect(first.inventoryJson).not.toContain('generatedAt');
    expect(first.manifest).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      inventory: { dependencyCount: 2, violationCount: 0 },
      limitations: {
        inventoryStoredAsRepositoryDeliverable: false,
        finalDependencyLicenseAuditIncluded: false,
        globalM0fGo: false,
      },
    });
    expect(verifyLicenseInventoryArtifact(first.inventoryJson, first.manifest)).toEqual([]);
  });

  it('detects inventory and manifest mutation', () => {
    const value = artifact();
    const tamperedInventory = value.inventoryJson.replace(
      '"dependencyCount":2',
      '"dependencyCount":3',
    );
    expect(
      verifyLicenseInventoryArtifact(tamperedInventory, value.manifest).map(({ code }) => code),
    ).toEqual(expect.arrayContaining(['count-mismatch', 'inventory-hash-mismatch']));
    expect(
      verifyLicenseInventoryArtifact(value.inventoryJson, {
        ...value.manifest,
        createdAt: '2026-01-02T00:00:00.000Z',
      }).map(({ code }) => code),
    ).toContain('manifest-hash-mismatch');
  });

  it('fails closed instead of consulting node_modules when lock bindings are missing', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'oridesign-license-lock-'));
    const lockPath = join(directory, 'package-lock.json');
    try {
      await writeFile(
        lockPath,
        JSON.stringify({
          lockfileVersion: 3,
          packages: {
            '': { name: 'test' },
            'node_modules/example': { version: '1.0.0', license: 'MIT' },
          },
        }),
        'utf8',
      );
      await expect(collectDependencyLicenses(lockPath)).rejects.toThrow(
        'package-lock integrity is required; node_modules fallback is disabled',
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('collects and persists the real lockfile deterministically without fallback', async () => {
    const first = await collectDependencyLicenses('package-lock.json');
    const second = await collectDependencyLicenses('package-lock.json');
    expect(first).toEqual(second);
    expect(first).toHaveLength(292);
    expect(
      first.every(
        ({ licenseSource, integrity, resolved }) =>
          licenseSource === 'package-lock' && integrity.length > 0 && resolved.length > 0,
      ),
    ).toBe(true);

    const directory = await mkdtemp(join(tmpdir(), 'oridesign-license-output-'));
    try {
      const firstOutput = join(directory, 'first.json');
      const secondOutput = join(directory, 'second.json');
      const firstManifest = join(directory, 'first.manifest.json');
      const secondManifest = join(directory, 'second.manifest.json');
      await runLicenseCheck({
        lockPath: 'package-lock.json',
        outputPath: firstOutput,
        manifestPath: firstManifest,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      await runLicenseCheck({
        lockPath: 'package-lock.json',
        outputPath: secondOutput,
        manifestPath: secondManifest,
        createdAt: '2026-01-02T00:00:00.000Z',
      });
      expect(await readFile(firstOutput, 'utf8')).toBe(await readFile(secondOutput, 'utf8'));
      const firstRunManifest = JSON.parse(await readFile(firstManifest, 'utf8'));
      const secondRunManifest = JSON.parse(await readFile(secondManifest, 'utf8'));
      expect(firstRunManifest.createdAt).not.toBe(secondRunManifest.createdAt);
      expect(firstRunManifest.inventory.sha256).toBe(secondRunManifest.inventory.sha256);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
