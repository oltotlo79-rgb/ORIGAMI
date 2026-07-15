import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ALLOWED_LICENSE_IDS, evaluateLicense } from './license-policy.mjs';

function dependencyName(location, metadata) {
  if (typeof metadata.name === 'string' && metadata.name.length > 0) return metadata.name;

  const marker = 'node_modules/';
  const index = location.lastIndexOf(marker);
  return index >= 0 ? location.slice(index + marker.length) : location;
}

async function fallbackLicense(lockDirectory, location) {
  try {
    const packageJson = JSON.parse(
      await readFile(resolve(lockDirectory, location, 'package.json'), 'utf8'),
    );
    return packageJson.license;
  } catch {
    return undefined;
  }
}

export async function collectDependencyLicenses(lockPath) {
  const absoluteLockPath = resolve(lockPath);
  const lock = JSON.parse(await readFile(absoluteLockPath, 'utf8'));

  if (
    typeof lock !== 'object' ||
    lock === null ||
    typeof lock.packages !== 'object' ||
    lock.packages === null
  ) {
    throw new Error('package-lock.json must use lockfileVersion 2 or newer and contain packages.');
  }

  const inventory = [];
  const lockDirectory = dirname(absoluteLockPath);

  for (const [location, rawMetadata] of Object.entries(lock.packages)) {
    if (location.length === 0 || !location.includes('node_modules/') || rawMetadata.link === true)
      continue;

    const metadata = rawMetadata;
    const license = metadata.license ?? (await fallbackLicense(lockDirectory, location));
    const evaluation = evaluateLicense(license);

    inventory.push({
      name: dependencyName(location, metadata),
      version: typeof metadata.version === 'string' ? metadata.version : 'unknown',
      location,
      license: typeof license === 'string' ? license : null,
      ...evaluation,
    });
  }

  if (inventory.length === 0) {
    throw new Error('package-lock.json contains no dependency packages.');
  }

  return inventory.sort((left, right) =>
    `${left.name}\u0000${left.version}\u0000${left.location}`.localeCompare(
      `${right.name}\u0000${right.version}\u0000${right.location}`,
      'en',
    ),
  );
}

function parseArguments(arguments_) {
  const options = {
    lockPath: 'package-lock.json',
    outputPath: '.artifacts/license-inventory.json',
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--lock' && arguments_[index + 1]) options.lockPath = arguments_[++index];
    else if (argument === '--output' && arguments_[index + 1])
      options.outputPath = arguments_[++index];
    else throw new Error(`Unknown or incomplete argument: ${argument}`);
  }

  return options;
}

export async function runLicenseCheck(options) {
  const dependencies = await collectDependencyLicenses(options.lockPath);
  const lockDirectory = dirname(resolve(options.lockPath));
  const packageMetadata = JSON.parse(
    await readFile(resolve(lockDirectory, 'package.json'), 'utf8'),
  );
  const projectLicense = {
    name: typeof packageMetadata.name === 'string' ? packageMetadata.name : '(project)',
    version: typeof packageMetadata.version === 'string' ? packageMetadata.version : 'unknown',
    location: '',
    license: typeof packageMetadata.license === 'string' ? packageMetadata.license : null,
    ...evaluateLicense(packageMetadata.license),
  };
  const violations = [projectLicense, ...dependencies].filter((dependency) => !dependency.allowed);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    allowlist: ALLOWED_LICENSE_IDS,
    projectLicense,
    dependencyCount: dependencies.length,
    violations,
    dependencies,
  };

  await mkdir(dirname(resolve(options.outputPath)), { recursive: true });
  await writeFile(resolve(options.outputPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await runLicenseCheck(options);

  if (report.violations.length > 0) {
    for (const violation of report.violations) {
      console.error(
        `${violation.name}@${violation.version}: ${violation.license ?? 'UNKNOWN'} (${violation.reason})`,
      );
    }
    console.error(`License check failed with ${report.violations.length} violation(s).`);
    process.exitCode = 1;
    return;
  }

  console.log(`License check passed for ${report.dependencyCount} dependency package(s).`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  await main();
}
