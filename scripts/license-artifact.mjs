import { createHash } from 'node:crypto';

import { ALLOWED_LICENSE_IDS } from './license-policy.mjs';

export const LICENSE_INVENTORY_RECORD_TYPE = 'm0f-license-inventory-candidate';
export const LICENSE_INVENTORY_MANIFEST_RECORD_TYPE = 'm0f-license-inventory-manifest-candidate';
export const LICENSE_INVENTORY_DEFAULT_PATH = '.artifacts/license-inventory.json';
export const LICENSE_INVENTORY_DEFAULT_MANIFEST_PATH = '.artifacts/license-inventory.manifest.json';

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/u;
const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const MANIFEST_HASH_DOMAIN = 'oridesign:m0f-license-inventory-manifest:v1\0';
const REASON_CODES = new Set([
  'allowlisted',
  'missing-or-unknown-license',
  'forbidden-copyleft-license',
  'license-exception-not-allowlisted',
  'invalid-spdx-expression',
  'license-not-allowlisted',
]);

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepFreeze(value, seen = new WeakSet()) {
  if (typeof value !== 'object' || value === null || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
}

function exactKeys(value, expected) {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

export function stableStringifyLicenseArtifact(value) {
  const ancestors = new Set();
  const visit = (current, path) => {
    if (current === null) return 'null';
    if (typeof current === 'boolean' || typeof current === 'string') return JSON.stringify(current);
    if (typeof current === 'number') {
      if (!Number.isFinite(current)) throw new TypeError(`${path}: number must be finite`);
      return Object.is(current, -0) ? '0' : JSON.stringify(current);
    }
    if (typeof current !== 'object') throw new TypeError(`${path}: value is not JSON data`);
    if (ancestors.has(current)) throw new TypeError(`${path}: cyclic value`);
    ancestors.add(current);
    try {
      if (Array.isArray(current)) {
        if (Object.keys(current).length !== current.length) {
          throw new TypeError(`${path}: sparse or augmented array`);
        }
        return `[${current.map((entry, index) => visit(entry, `${path}[${index}]`)).join(',')}]`;
      }
      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError(`${path}: object must be plain`);
      }
      return `{${Object.keys(current)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${visit(current[key], `${path}.${key}`)}`)
        .join(',')}}`;
    } finally {
      ancestors.delete(current);
    }
  };
  return visit(value, '$');
}

export function serializeLicenseArtifactJson(value) {
  return `${stableStringifyLicenseArtifact(value)}\n`;
}

export function sha256LicenseArtifactBytes(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

export function createRawFileHashDescriptor(path, bytes) {
  if (typeof path !== 'string' || path.length === 0) throw new TypeError('path must be non-empty');
  return deepFreeze({
    path,
    byteLength: bytes.byteLength,
    hashBasis: 'sha256-of-raw-file-bytes',
    sha256: sha256LicenseArtifactBytes(bytes),
  });
}

function codeUnitCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function entryKey(entry) {
  return `${entry.name}\0${entry.version}\0${entry.location}`;
}

function normalizeEvaluation(evaluation) {
  if (
    !isRecord(evaluation) ||
    typeof evaluation.allowed !== 'boolean' ||
    !Array.isArray(evaluation.identifiers) ||
    !evaluation.identifiers.every((value) => typeof value === 'string' && value.length > 0) ||
    !Array.isArray(evaluation.rejectedIdentifiers) ||
    !evaluation.rejectedIdentifiers.every(
      (value) => typeof value === 'string' && value.length > 0,
    ) ||
    typeof evaluation.reasonCode !== 'string' ||
    !REASON_CODES.has(evaluation.reasonCode)
  ) {
    throw new TypeError('license evaluation must use the closed candidate policy result');
  }
  if (
    (evaluation.allowed &&
      (evaluation.reasonCode !== 'allowlisted' || evaluation.rejectedIdentifiers.length !== 0)) ||
    (!evaluation.allowed && evaluation.reasonCode === 'allowlisted')
  ) {
    throw new TypeError('license evaluation allowed flag and reason code disagree');
  }
  return {
    allowed: evaluation.allowed,
    identifiers: [...evaluation.identifiers],
    rejectedIdentifiers: [...evaluation.rejectedIdentifiers],
    reasonCode: evaluation.reasonCode,
    reason: evaluation.reasonCode,
  };
}

function normalizeEntry(entry, source) {
  if (!isRecord(entry)) throw new TypeError('license inventory entry must be an object');
  for (const key of ['name', 'version', 'location']) {
    if (typeof entry[key] !== 'string' || (entry[key].length === 0 && key !== 'location')) {
      throw new TypeError(`license inventory ${key} must be a string`);
    }
  }
  if (typeof entry.license !== 'string' || entry.license.length === 0) {
    throw new TypeError(`${entry.location || '(project)'} must declare a license`);
  }
  const evaluation = normalizeEvaluation(entry);
  const common = {
    name: entry.name,
    version: entry.version,
    location: entry.location,
    license: entry.license,
    licenseSource: source,
    ...evaluation,
  };
  if (source === 'package-json') return common;
  if (
    typeof entry.integrity !== 'string' ||
    entry.integrity.length === 0 ||
    typeof entry.resolved !== 'string' ||
    entry.resolved.length === 0
  ) {
    throw new TypeError(`${entry.location} must bind lockfile integrity and resolved metadata`);
  }
  return { ...common, integrity: entry.integrity, resolved: entry.resolved };
}

function violationProjection(entry) {
  return {
    name: entry.name,
    version: entry.version,
    location: entry.location,
    license: entry.license,
    reasonCode: entry.reasonCode,
    rejectedIdentifiers: entry.rejectedIdentifiers,
  };
}

export function createDeterministicLicenseInventory({ projectLicense, dependencies }) {
  if (!Array.isArray(dependencies) || dependencies.length === 0) {
    throw new TypeError('license inventory requires dependency entries');
  }
  const project = normalizeEntry(projectLicense, 'package-json');
  const normalizedDependencies = dependencies
    .map((entry) => normalizeEntry(entry, 'package-lock'))
    .sort((left, right) => codeUnitCompare(entryKey(left), entryKey(right)));
  if (
    new Set(normalizedDependencies.map(({ location }) => location)).size !== dependencies.length
  ) {
    throw new TypeError('dependency locations must be unique');
  }
  const violations = [project, ...normalizedDependencies]
    .filter(({ allowed }) => !allowed)
    .map(violationProjection);
  const inventory = {
    schemaVersion: 1,
    recordType: LICENSE_INVENTORY_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    artifactKind: 'deterministic-lockfile-license-inventory-not-final-audit',
    allowlist: [...ALLOWED_LICENSE_IDS],
    projectLicense: project,
    dependencyCount: normalizedDependencies.length,
    counts: {
      eligiblePackageCount: normalizedDependencies.length,
      dependencyCount: normalizedDependencies.length,
      linkEntryCount: 0,
      nodeModulesFallbackCount: 0,
      violationCount: violations.length,
    },
    violations,
    dependencies: normalizedDependencies,
    limitations: {
      licenseTextAndNoticeAuditIncluded: false,
      declaredMetadataTruthVerified: false,
      legalCompatibilityAuditIncluded: false,
      redistributionDecisionAuditIncluded: false,
      fixtureAndSourceProvenanceAuditIncluded: false,
      gplReferenceImplementationAuditIncluded: false,
      finalDependencyLicenseAuditIncluded: false,
      globalM0fGo: false,
    },
  };
  const issues = validateDeterministicLicenseInventory(inventory);
  if (issues.length > 0) throw new TypeError(issues.map(({ message }) => message).join('; '));
  return deepFreeze(inventory);
}

const INVENTORY_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'artifactKind',
  'allowlist',
  'projectLicense',
  'dependencyCount',
  'counts',
  'violations',
  'dependencies',
  'limitations',
];
const COMMON_ENTRY_KEYS = [
  'name',
  'version',
  'location',
  'license',
  'licenseSource',
  'allowed',
  'identifiers',
  'rejectedIdentifiers',
  'reasonCode',
  'reason',
];

export function validateDeterministicLicenseInventory(inventory) {
  const issues = [];
  const add = (code, message) => issues.push({ code, message });
  if (!isRecord(inventory) || !exactKeys(inventory, INVENTORY_KEYS)) {
    add('invalid-inventory-shape', 'inventory root must use the closed schema');
    return issues;
  }
  if (
    inventory.schemaVersion !== 1 ||
    inventory.recordType !== LICENSE_INVENTORY_RECORD_TYPE ||
    inventory.contractStatus !== 'candidate' ||
    inventory.scientificClaim !== false ||
    inventory.artifactKind !== 'deterministic-lockfile-license-inventory-not-final-audit'
  ) {
    add('claim-boundary', 'inventory candidate claim boundary changed');
  }
  if (
    stableStringifyLicenseArtifact(inventory.allowlist) !==
    stableStringifyLicenseArtifact(ALLOWED_LICENSE_IDS)
  ) {
    add('allowlist-mismatch', 'inventory allowlist differs from policy');
  }
  if (!Array.isArray(inventory.dependencies) || !isRecord(inventory.projectLicense)) {
    add('invalid-entry-list', 'inventory entries are missing');
    return issues;
  }
  const entries = [inventory.projectLicense, ...inventory.dependencies];
  entries.forEach((entry, index) => {
    const dependency = index > 0;
    const expectedKeys = dependency
      ? [...COMMON_ENTRY_KEYS, 'integrity', 'resolved']
      : COMMON_ENTRY_KEYS;
    if (!isRecord(entry) || !exactKeys(entry, expectedKeys)) {
      add('invalid-entry-shape', `entry ${index} does not use the closed schema`);
      return;
    }
    if (
      typeof entry.name !== 'string' ||
      typeof entry.version !== 'string' ||
      typeof entry.location !== 'string' ||
      typeof entry.license !== 'string' ||
      entry.licenseSource !== (dependency ? 'package-lock' : 'package-json') ||
      typeof entry.allowed !== 'boolean' ||
      !Array.isArray(entry.identifiers) ||
      !Array.isArray(entry.rejectedIdentifiers) ||
      typeof entry.reasonCode !== 'string' ||
      entry.reason !== entry.reasonCode ||
      !REASON_CODES.has(entry.reasonCode)
    ) {
      add('invalid-entry', `entry ${index} contains invalid license metadata`);
    }
    if (dependency && (typeof entry.integrity !== 'string' || typeof entry.resolved !== 'string')) {
      add('missing-lock-binding', `entry ${index} lacks lock metadata`);
    }
  });
  const sorted = [...inventory.dependencies].sort((left, right) =>
    codeUnitCompare(entryKey(left), entryKey(right)),
  );
  if (
    stableStringifyLicenseArtifact(sorted) !==
    stableStringifyLicenseArtifact(inventory.dependencies)
  ) {
    add('dependency-order', 'dependency entries are not in code-unit order');
  }
  const locations = inventory.dependencies.map(({ location }) => location);
  if (new Set(locations).size !== locations.length) add('duplicate-location', 'locations repeat');
  const expectedViolations = entries.filter(({ allowed }) => !allowed).map(violationProjection);
  if (
    stableStringifyLicenseArtifact(expectedViolations) !==
    stableStringifyLicenseArtifact(inventory.violations)
  ) {
    add('violation-mismatch', 'violation projection differs from evaluated entries');
  }
  if (
    !isRecord(inventory.counts) ||
    inventory.dependencyCount !== inventory.dependencies.length ||
    inventory.counts.eligiblePackageCount !== inventory.dependencies.length ||
    inventory.counts.dependencyCount !== inventory.dependencies.length ||
    inventory.counts.linkEntryCount !== 0 ||
    inventory.counts.nodeModulesFallbackCount !== 0 ||
    inventory.counts.violationCount !== expectedViolations.length
  ) {
    add('count-mismatch', 'inventory counts do not match entries');
  }
  if (
    !isRecord(inventory.limitations) ||
    Object.values(inventory.limitations).some((value) => value !== false)
  ) {
    add('limitation-escalation', 'all final/legal/GO limitations must remain false');
  }
  return issues;
}

function manifestPayloadHash(payload) {
  return sha256LicenseArtifactBytes(
    Buffer.from(`${MANIFEST_HASH_DOMAIN}${stableStringifyLicenseArtifact(payload)}`, 'utf8'),
  );
}

export function createLicenseInventoryManifest({
  createdAt,
  inventoryPath,
  inventoryJson,
  inputs,
  toolSources,
  environment,
}) {
  if (
    typeof createdAt !== 'string' ||
    !UTC_TIMESTAMP_PATTERN.test(createdAt) ||
    Number.isNaN(Date.parse(createdAt)) ||
    new Date(createdAt).toISOString() !== createdAt
  ) {
    throw new TypeError('createdAt must be a real UTC timestamp');
  }
  const parsedInventory = JSON.parse(inventoryJson);
  const inventoryIssues = validateDeterministicLicenseInventory(parsedInventory);
  if (
    inventoryIssues.length > 0 ||
    serializeLicenseArtifactJson(parsedInventory) !== inventoryJson
  ) {
    throw new TypeError('inventory JSON must be valid canonical candidate data');
  }
  if (
    !Array.isArray(inputs) ||
    !Array.isArray(toolSources) ||
    inputs.length === 0 ||
    toolSources.length === 0
  ) {
    throw new TypeError('manifest must bind input and tool source files');
  }
  const descriptors = [...inputs, ...toolSources];
  if (
    descriptors.some(
      (entry) =>
        !isRecord(entry) ||
        typeof entry.path !== 'string' ||
        !Number.isSafeInteger(entry.byteLength) ||
        entry.hashBasis !== 'sha256-of-raw-file-bytes' ||
        typeof entry.sha256 !== 'string' ||
        !SHA256_PATTERN.test(entry.sha256),
    ) ||
    new Set(descriptors.map(({ path }) => path)).size !== descriptors.length
  ) {
    throw new TypeError('manifest file descriptors must be unique raw SHA-256 bindings');
  }
  const payload = {
    schemaVersion: 1,
    recordType: LICENSE_INVENTORY_MANIFEST_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    artifactKind: 'license-inventory-input-tool-and-output-binding-not-final-audit',
    createdAt,
    inputs: [...inputs],
    toolSources: [...toolSources],
    inventory: {
      path: inventoryPath,
      byteLength: Buffer.byteLength(inventoryJson, 'utf8'),
      hashBasis: 'sha256-of-exact-utf8-file-bytes',
      sha256: sha256LicenseArtifactBytes(Buffer.from(inventoryJson, 'utf8')),
      dependencyCount: parsedInventory.dependencyCount,
      violationCount: parsedInventory.counts.violationCount,
    },
    environment: { ...environment },
    limitations: {
      inventoryStoredAsRepositoryDeliverable: false,
      licenseTextAndNoticeAuditIncluded: false,
      legalCompatibilityAuditIncluded: false,
      redistributionDecisionAuditIncluded: false,
      sourceProvenanceAuditIncluded: false,
      gplReferenceImplementationAuditIncluded: false,
      finalDependencyLicenseAuditIncluded: false,
      globalM0fGo: false,
    },
  };
  const manifest = {
    ...payload,
    manifestPayloadSha256: manifestPayloadHash(payload),
  };
  return deepFreeze(manifest);
}

export function verifyLicenseInventoryArtifact(inventoryJson, manifest) {
  const issues = [];
  let inventory;
  try {
    inventory = JSON.parse(inventoryJson);
    issues.push(...validateDeterministicLicenseInventory(inventory));
    if (serializeLicenseArtifactJson(inventory) !== inventoryJson) {
      issues.push({ code: 'noncanonical-inventory', message: 'inventory bytes are not canonical' });
    }
  } catch {
    issues.push({ code: 'invalid-inventory-json', message: 'inventory is not valid JSON' });
  }
  if (!isRecord(manifest) || !isRecord(manifest.inventory)) {
    issues.push({ code: 'invalid-manifest', message: 'manifest is not an object' });
    return issues;
  }
  if (
    manifest.inventory.byteLength !== Buffer.byteLength(inventoryJson, 'utf8') ||
    manifest.inventory.sha256 !== sha256LicenseArtifactBytes(Buffer.from(inventoryJson, 'utf8'))
  ) {
    issues.push({ code: 'inventory-hash-mismatch', message: 'inventory bytes changed' });
  }
  const { manifestPayloadSha256, ...payload } = manifest;
  if (
    typeof manifestPayloadSha256 !== 'string' ||
    !SHA256_PATTERN.test(manifestPayloadSha256) ||
    manifestPayloadSha256 !== manifestPayloadHash(payload)
  ) {
    issues.push({ code: 'manifest-hash-mismatch', message: 'manifest payload changed' });
  }
  if (
    inventory !== undefined &&
    (manifest.inventory.dependencyCount !== inventory.dependencyCount ||
      manifest.inventory.violationCount !== inventory.counts.violationCount)
  ) {
    issues.push({ code: 'manifest-count-mismatch', message: 'manifest counts differ' });
  }
  return issues;
}
