import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LICENSE_INVENTORY_DEFAULT_MANIFEST_PATH,
  LICENSE_INVENTORY_DEFAULT_PATH,
  createDeterministicLicenseInventory,
  createLicenseInventoryManifest,
  createRawFileHashDescriptor,
  serializeLicenseArtifactJson,
  verifyLicenseInventoryArtifact,
} from './license-artifact.mjs';
import { evaluateLicense } from './license-policy.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIRECTORY = dirname(SCRIPT_PATH);
const TOOL_SOURCE_PATHS = [
  SCRIPT_PATH,
  resolve(SCRIPT_DIRECTORY, 'license-policy.mjs'),
  resolve(SCRIPT_DIRECTORY, 'license-artifact.mjs'),
];

function dependencyName(location, metadata) {
  if (typeof metadata.name === 'string' && metadata.name.length > 0) return metadata.name;
  const marker = 'node_modules/';
  const index = location.lastIndexOf(marker);
  return index >= 0 ? location.slice(index + marker.length) : location;
}

function codeUnitCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portableRelative(root, path) {
  const value = relative(root, path).replaceAll('\\', '/');
  return value.length === 0 ? '.' : value;
}

function gitOutput(cwd, arguments_) {
  try {
    return execFileSync('git', arguments_, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function npmVersion() {
  const match = /(?:^|\s)npm\/([^\s]+)/u.exec(process.env.npm_config_user_agent ?? '');
  return match?.[1] ?? 'unknown';
}

export async function collectDependencyLicenses(lockPath) {
  const absoluteLockPath = resolve(lockPath);
  const lock = JSON.parse(await readFile(absoluteLockPath, 'utf8'));
  if (
    typeof lock !== 'object' ||
    lock === null ||
    !Number.isSafeInteger(lock.lockfileVersion) ||
    lock.lockfileVersion < 2 ||
    typeof lock.packages !== 'object' ||
    lock.packages === null ||
    Array.isArray(lock.packages)
  ) {
    throw new Error('package-lock.json must use lockfileVersion 2 or newer and contain packages.');
  }

  const inventory = [];
  for (const [location, rawMetadata] of Object.entries(lock.packages)) {
    if (location.length === 0 || !location.includes('node_modules/')) continue;
    if (typeof rawMetadata !== 'object' || rawMetadata === null || Array.isArray(rawMetadata)) {
      throw new Error(`${location}: package metadata must be an object.`);
    }
    if (rawMetadata.link === true) {
      throw new Error(`${location}: link entries are not accepted by deterministic artifact mode.`);
    }
    for (const field of ['version', 'license', 'integrity', 'resolved']) {
      if (typeof rawMetadata[field] !== 'string' || rawMetadata[field].length === 0) {
        throw new Error(
          `${location}: package-lock ${field} is required; node_modules fallback is disabled.`,
        );
      }
    }
    const evaluation = evaluateLicense(rawMetadata.license);
    inventory.push({
      name: dependencyName(location, rawMetadata),
      version: rawMetadata.version,
      location,
      license: rawMetadata.license,
      licenseSource: 'package-lock',
      integrity: rawMetadata.integrity,
      resolved: rawMetadata.resolved,
      ...evaluation,
    });
  }
  if (inventory.length === 0) throw new Error('package-lock.json contains no dependency packages.');
  return inventory.sort((left, right) =>
    codeUnitCompare(
      `${left.name}\0${left.version}\0${left.location}`,
      `${right.name}\0${right.version}\0${right.location}`,
    ),
  );
}

function parseArguments(arguments_) {
  const options = {
    lockPath: 'package-lock.json',
    outputPath: LICENSE_INVENTORY_DEFAULT_PATH,
    manifestPath: LICENSE_INVENTORY_DEFAULT_MANIFEST_PATH,
  };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--lock' && arguments_[index + 1]) options.lockPath = arguments_[++index];
    else if (argument === '--output' && arguments_[index + 1])
      options.outputPath = arguments_[++index];
    else if (argument === '--manifest' && arguments_[index + 1])
      options.manifestPath = arguments_[++index];
    else throw new Error(`Unknown or incomplete argument: ${argument}`);
  }
  return options;
}

async function descriptor(root, path) {
  const bytes = await readFile(path);
  return createRawFileHashDescriptor(portableRelative(root, path), bytes);
}

export async function runLicenseCheck(options) {
  const absoluteLockPath = resolve(options.lockPath);
  const projectRoot = dirname(absoluteLockPath);
  const packagePath = resolve(projectRoot, 'package.json');
  const licensePath = resolve(projectRoot, 'LICENSE');
  const dependencies = await collectDependencyLicenses(absoluteLockPath);
  const packageMetadata = JSON.parse(await readFile(packagePath, 'utf8'));
  if (typeof packageMetadata !== 'object' || packageMetadata === null) {
    throw new Error('package.json must be an object.');
  }
  const projectLicenseValue = packageMetadata.license;
  const projectLicense = {
    name: typeof packageMetadata.name === 'string' ? packageMetadata.name : '(project)',
    version: typeof packageMetadata.version === 'string' ? packageMetadata.version : 'unknown',
    location: '',
    license: typeof projectLicenseValue === 'string' ? projectLicenseValue : null,
    ...evaluateLicense(projectLicenseValue),
  };
  const inventory = createDeterministicLicenseInventory({ projectLicense, dependencies });
  const inventoryJson = serializeLicenseArtifactJson(inventory);
  const sourceRevision = (
    process.env.GITHUB_SHA ??
    gitOutput(projectRoot, ['rev-parse', 'HEAD']) ??
    'unknown'
  )
    .trim()
    .toLowerCase();
  const status = gitOutput(projectRoot, ['status', '--porcelain']);
  const manifest = createLicenseInventoryManifest({
    createdAt: options.createdAt ?? new Date().toISOString(),
    inventoryPath: portableRelative(projectRoot, resolve(options.outputPath)),
    inventoryJson,
    inputs: await Promise.all([
      descriptor(projectRoot, absoluteLockPath),
      descriptor(projectRoot, packagePath),
      descriptor(projectRoot, licensePath),
    ]),
    toolSources: await Promise.all(TOOL_SOURCE_PATHS.map((path) => descriptor(projectRoot, path))),
    environment: {
      nodeVersion: process.version,
      npmVersion: npmVersion(),
      sourceRevision,
      sourceTreeState: status === null ? 'unknown' : status === '' ? 'clean' : 'dirty',
      ciRunId: process.env.GITHUB_RUN_ID ?? null,
    },
  });
  const manifestJson = serializeLicenseArtifactJson(manifest);
  const verificationIssues = verifyLicenseInventoryArtifact(inventoryJson, manifest);
  if (verificationIssues.length > 0) {
    throw new Error(
      `license artifact self-verification failed: ${JSON.stringify(verificationIssues)}`,
    );
  }

  const absoluteOutputPath = resolve(options.outputPath);
  const absoluteManifestPath = resolve(options.manifestPath);
  await Promise.all([
    mkdir(dirname(absoluteOutputPath), { recursive: true }),
    mkdir(dirname(absoluteManifestPath), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(absoluteOutputPath, inventoryJson, 'utf8'),
    writeFile(absoluteManifestPath, manifestJson, 'utf8'),
  ]);
  return { ...inventory, manifest };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await runLicenseCheck(options);
  if (report.violations.length > 0) {
    for (const violation of report.violations) {
      console.error(
        `${violation.name}@${violation.version}: ${violation.license ?? 'UNKNOWN'} (${violation.reasonCode})`,
      );
    }
    console.error(`License check failed with ${report.violations.length} violation(s).`);
    process.exitCode = 1;
    return;
  }
  console.log(`License check passed for ${report.dependencyCount} dependency package(s).`);
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
