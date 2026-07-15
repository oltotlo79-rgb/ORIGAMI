import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { parseArtifactContractV1, type ArtifactContractIssue } from './artifacts/contract.js';
import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import {
  NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1,
  type NegLayerCycleSourceDocumentV1,
} from './neg-layer-cycle-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from './manifest.js';
import { stableStringify } from './stable-json.js';

export const NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/neg-path-time-coverage-candidate-bundle-ledger-v1.schema.json' as const;
export const NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_RECORD_TYPE =
  'm0f-neg-path-time-coverage-candidate-bundle-ledger' as const;
export const NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCOPE =
  'project-authored-exact-negative-artifact-contract-path-time-coverage-parser-replay-only' as const;
export const NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_GENERATOR_ID =
  'oridesign-neg-path-time-coverage-candidate-bundle' as const;
export const NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_GENERATOR_VERSION = '1.0.0-candidate' as const;
export const NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY =
  'tests/candidate-vectors/NEG-PATH-MUTATION-COVERAGE' as const;
export const NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_LEDGER_FILENAME =
  'candidate-bundle-ledger.json' as const;
export const NEG_PATH_TIME_COVERAGE_CANONICAL_MANIFEST_PATH =
  'tests/fixtures/manifest.json' as const;
export const NEG_PATH_TIME_COVERAGE_CASE_IDS = [
  'NEG-PATH-MUTATION-COVERAGE-START-GAP',
  'NEG-PATH-MUTATION-COVERAGE-INTERNAL-GAP',
  'NEG-PATH-MUTATION-COVERAGE-TERMINAL-GAP',
  'NEG-PATH-MUTATION-COVERAGE-KNOT-GAP',
] as const;

const SOURCE_REFERENCE_ID = 'oridesign-neg-path-time-coverage-candidate-v1' as const;
const CONTROL_ARTIFACT_ID = 'control-fold' as const;
const SOURCE_ARTIFACT_IDS = [
  'source-path-coverage-start-gap',
  'source-path-coverage-internal-gap',
  'source-path-coverage-terminal-gap',
  'source-path-coverage-knot-gap',
] as const;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

export type NegPathTimeCoverageSourceDocumentV1 = NegLayerCycleSourceDocumentV1;

function requiredEntry<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new TypeError(`missing fixed entry ${String(index)}`);
  return value;
}

function twoSegmentFoldControl(): NegPathTimeCoverageSourceDocumentV1 {
  const control = structuredClone(NEG_LAYER_CYCLE_FOLD_CONTROL_SOURCE_V1);
  control.pathCandidate.segments = [
    {
      t0: 0,
      t1: 0.5,
      motion: {
        kind: 'bounded-interpolation',
        knotTimes: [0, 0.5],
        anglesByCrease: [{ edgeId: 'e-hinge', angles: [0, Math.PI / 2] }],
        intervalAngleBoundsByCrease: [{ edgeId: 'e-hinge', bounds: [[0, Math.PI / 2]] }],
      },
    },
    {
      t0: 0.5,
      t1: 1,
      motion: {
        kind: 'bounded-interpolation',
        knotTimes: [0.5, 1],
        anglesByCrease: [{ edgeId: 'e-hinge', angles: [Math.PI / 2, Math.PI] }],
        intervalAngleBoundsByCrease: [{ edgeId: 'e-hinge', bounds: [[Math.PI / 2, Math.PI]] }],
      },
    },
  ];
  return control;
}

export const NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1 =
  deepFreezeOwned(twoSegmentFoldControl());

function startGapSource(): NegPathTimeCoverageSourceDocumentV1 {
  const source = structuredClone(NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1);
  const first = requiredEntry(source.pathCandidate.segments, 0);
  if (first.motion.kind !== 'bounded-interpolation') {
    throw new TypeError('fixed first segment must use bounded interpolation');
  }
  first.t0 = 0.125;
  first.motion.knotTimes[0] = 0.125;
  return source;
}

function internalGapSource(): NegPathTimeCoverageSourceDocumentV1 {
  const source = structuredClone(NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1);
  const second = requiredEntry(source.pathCandidate.segments, 1);
  if (second.motion.kind !== 'bounded-interpolation') {
    throw new TypeError('fixed second segment must use bounded interpolation');
  }
  second.t0 = 0.75;
  second.motion.knotTimes[0] = 0.75;
  return source;
}

function terminalGapSource(): NegPathTimeCoverageSourceDocumentV1 {
  const source = structuredClone(NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1);
  const second = requiredEntry(source.pathCandidate.segments, 1);
  if (second.motion.kind !== 'bounded-interpolation') {
    throw new TypeError('fixed second segment must use bounded interpolation');
  }
  second.t1 = 0.875;
  second.motion.knotTimes[1] = 0.875;
  return source;
}

function knotGapSource(): NegPathTimeCoverageSourceDocumentV1 {
  const source = structuredClone(NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1);
  const second = requiredEntry(source.pathCandidate.segments, 1);
  if (second.motion.kind !== 'bounded-interpolation') {
    throw new TypeError('fixed second segment must use bounded interpolation');
  }
  second.motion.knotTimes[0] = 0.75;
  return source;
}

type ExpectedIssueV1 = Readonly<{ path: string; code: string }>;

export const NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1 = deepFreezeOwned([
  {
    caseId: NEG_PATH_TIME_COVERAGE_CASE_IDS[0],
    controlArtifactId: CONTROL_ARTIFACT_ID,
    mutationKind: 'move-path-start-and-first-bounded-knot-forward',
    changedPaths: [
      '$.pathCandidate.segments[0].motion.knotTimes[0]',
      '$.pathCandidate.segments[0].t0',
    ],
    sourceArtifactId: SOURCE_ARTIFACT_IDS[0],
    sourcePath: 'path-coverage-start-gap.json',
    sourceDocument: startGapSource(),
    expectedIssues: [{ path: '$.pathCandidate.segments[0].t0', code: 'incomplete-time-coverage' }],
  },
  {
    caseId: NEG_PATH_TIME_COVERAGE_CASE_IDS[1],
    controlArtifactId: CONTROL_ARTIFACT_ID,
    mutationKind: 'move-second-segment-start-and-first-bounded-knot-forward',
    changedPaths: [
      '$.pathCandidate.segments[1].motion.knotTimes[0]',
      '$.pathCandidate.segments[1].t0',
    ],
    sourceArtifactId: SOURCE_ARTIFACT_IDS[1],
    sourcePath: 'path-coverage-internal-gap.json',
    sourceDocument: internalGapSource(),
    expectedIssues: [{ path: '$.pathCandidate.segments[1].t0', code: 'incomplete-time-coverage' }],
  },
  {
    caseId: NEG_PATH_TIME_COVERAGE_CASE_IDS[2],
    controlArtifactId: CONTROL_ARTIFACT_ID,
    mutationKind: 'move-path-end-and-last-bounded-knot-backward',
    changedPaths: [
      '$.pathCandidate.segments[1].motion.knotTimes[1]',
      '$.pathCandidate.segments[1].t1',
    ],
    sourceArtifactId: SOURCE_ARTIFACT_IDS[2],
    sourcePath: 'path-coverage-terminal-gap.json',
    sourceDocument: terminalGapSource(),
    expectedIssues: [{ path: '$.pathCandidate.segments', code: 'incomplete-time-coverage' }],
  },
  {
    caseId: NEG_PATH_TIME_COVERAGE_CASE_IDS[3],
    controlArtifactId: CONTROL_ARTIFACT_ID,
    mutationKind: 'move-second-bounded-first-knot-forward-only',
    changedPaths: ['$.pathCandidate.segments[1].motion.knotTimes[0]'],
    sourceArtifactId: SOURCE_ARTIFACT_IDS[3],
    sourcePath: 'path-coverage-knot-gap.json',
    sourceDocument: knotGapSource(),
    expectedIssues: [
      {
        path: '$.pathCandidate.segments[1].motion.knotTimes',
        code: 'incomplete-time-coverage',
      },
    ],
  },
] as const);

export const NEG_PATH_TIME_COVERAGE_CANDIDATE_README_V1 = `# NEG-PATH-MUTATION-COVERAGE exact-negative candidate vectors

This closed directory contains one saved project-authored accepted two-segment bounded-interpolation FOLD artifact-contract control and four exact-negative mutations for the current \`parseArtifactContractV1\` path-time coverage checks: a missing start prefix, an internal segment gap, a missing terminal suffix, and a bounded-motion knot prefix gap. Each mutation is compared byte-for-byte with the same saved control and replayed against its complete ordered parser issue signature.

All four case IDs are intentionally outside \`tests/fixtures/manifest.json\`; none is canonically registered or promoted. Exact-negative means only that the current artifact-contract parser rejects each saved source with the exact changed paths and complete ordered issue signature fixed in the ledger.

This parser replay establishes only the four declared JSON time-coverage boundaries above. It does not establish endpoint continuity, physical path continuity, rigidity, face isometry, hinge geometry, crease-map completeness, piecewise-polynomial coverage, contact semantics, CCD or collision detection, collision freedom or foldability, certificate-hash verification or cryptographic authenticity, completeness of the canonical path-mutation family, a SupportProfile or ToleranceProfile, scientific verification, or M0F GO. Local SHA-256 rows detect saved-byte drift only and are not signatures.

Verify with \`npx tsx m0f/neg-path-time-coverage-candidate-bundle-cli.ts --verify\`. Regenerate with \`npx tsx m0f/neg-path-time-coverage-candidate-bundle-cli.ts --write\`.
`;

export type NegPathTimeCoverageArtifactProvenanceV1 = Readonly<{
  sourceReferenceId: typeof SOURCE_REFERENCE_ID;
  sourceUse: 'project-authored';
  derivation: 'authored' | 'mutated-from-control';
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[];
}>;

export type NegPathTimeCoverageArtifactLedgerEntryV1 = Readonly<{
  artifactId: string;
  role: 'readme' | 'accepted-control' | 'negative-source';
  path: string;
  mediaType: 'text/markdown; charset=utf-8' | 'application/json';
  sha256: `sha256:${string}`;
  licenseSpdx: 'MIT';
  provenance: NegPathTimeCoverageArtifactProvenanceV1;
}>;

type ArtifactSpecV1 = Omit<NegPathTimeCoverageArtifactLedgerEntryV1, 'sha256'>;

function artifactProvenance(
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[],
): NegPathTimeCoverageArtifactProvenanceV1 {
  return {
    sourceReferenceId: SOURCE_REFERENCE_ID,
    sourceUse: 'project-authored',
    derivation: dependsOnArtifactIds.length === 0 ? 'authored' : 'mutated-from-control',
    dependsOnArtifactIds,
  };
}

export const NEG_PATH_TIME_COVERAGE_ARTIFACT_SPECS_V1 = deepFreezeOwned([
  {
    artifactId: 'bundle-readme',
    role: 'readme',
    path: 'README.md',
    mediaType: 'text/markdown; charset=utf-8',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([]),
  },
  {
    artifactId: CONTROL_ARTIFACT_ID,
    role: 'accepted-control',
    path: 'control-fold.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([]),
  },
  ...NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1.map((caseSpec) => ({
    artifactId: caseSpec.sourceArtifactId,
    role: 'negative-source' as const,
    path: caseSpec.sourcePath,
    mediaType: 'application/json' as const,
    licenseSpdx: 'MIT' as const,
    provenance: artifactProvenance([CONTROL_ARTIFACT_ID]),
  })),
] as const satisfies readonly ArtifactSpecV1[]);

export type NegPathTimeCoverageCaseLedgerRowV1 = Readonly<{
  caseIndex: 0 | 1 | 2 | 3;
  caseId: (typeof NEG_PATH_TIME_COVERAGE_CASE_IDS)[number];
  controlArtifactId: typeof CONTROL_ARTIFACT_ID;
  mutationKind: string;
  changedPaths: readonly string[];
  sourceArtifactId: (typeof SOURCE_ARTIFACT_IDS)[number];
  sourcePath:
    | 'path-coverage-start-gap.json'
    | 'path-coverage-internal-gap.json'
    | 'path-coverage-terminal-gap.json'
    | 'path-coverage-knot-gap.json';
  expectedOutcome: 'rejected';
  expectedIssues: readonly ExpectedIssueV1[];
}>;

const GENERATOR = deepFreezeOwned({
  generatorId: NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_GENERATOR_ID,
  generatorVersion: NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_GENERATOR_VERSION,
  serialization: 'stable-json-utf8-lf-v1' as const,
  detector: 'parseArtifactContractV1' as const,
  detectorSourcePath: 'm0f/artifacts/contract.ts' as const,
});

const SOURCE_PROVENANCE = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceKind: 'project-authored' as const,
  title: 'NEG-PATH-MUTATION-COVERAGE project-authored path-time coverage parser vectors',
  authors: ['OriDesign contributors'],
  redistribution: 'allowed' as const,
  licenseSpdx: 'MIT' as const,
});

function ledgerCases(): readonly NegPathTimeCoverageCaseLedgerRowV1[] {
  return NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1.map((caseSpec, caseIndex) => ({
    caseIndex: caseIndex as 0 | 1 | 2 | 3,
    caseId: caseSpec.caseId,
    controlArtifactId: CONTROL_ARTIFACT_ID,
    mutationKind: caseSpec.mutationKind,
    changedPaths: caseSpec.changedPaths,
    sourceArtifactId: caseSpec.sourceArtifactId,
    sourcePath: caseSpec.sourcePath,
    expectedOutcome: 'rejected' as const,
    expectedIssues: caseSpec.expectedIssues,
  }));
}

export type NegPathTimeCoverageCandidateBundleLedgerV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCHEMA_ID;
  recordType: typeof NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-PATH-MUTATION-COVERAGE-V1';
  scope: typeof NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCOPE;
  declaredPathTimeCoverageParserOnly: true;
  canonicalManifestPath: typeof NEG_PATH_TIME_COVERAGE_CANONICAL_MANIFEST_PATH;
  canonicalManifestRegistration: 'not-registered';
  canonicalPromotionClaimed: false;
  canonicalPathMutationFamilyComplete: false;
  endpointContinuityEstablished: false;
  piecewisePolynomialCoverageIncluded: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  physicalPathContinuityEstablished: false;
  creaseMapCompletenessEstablished: false;
  rigidityEstablished: false;
  faceIsometryEstablished: false;
  hingeGeometryEstablished: false;
  certificateHashVerificationIncluded: false;
  contactAnalysisIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionDetectionIncluded: false;
  collisionFreedomEstablished: false;
  foldabilityEstablished: false;
  scientificVerificationClaimed: false;
  globalM0fGate: 'not-evaluated';
  caseCount: 4;
  artifactCount: 6;
  generator: typeof GENERATOR;
  provenance: typeof SOURCE_PROVENANCE;
  cases: readonly NegPathTimeCoverageCaseLedgerRowV1[];
  artifacts: readonly NegPathTimeCoverageArtifactLedgerEntryV1[];
}>;

export type NegPathTimeCoverageCandidateLedgerIssueV1 = Readonly<{
  path: string;
  code:
    | 'invalid-snapshot'
    | 'invalid-object'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'invalid-array'
    | 'invalid-case'
    | 'invalid-artifact'
    | 'invalid-hash';
  message: string;
}>;

export type NegPathTimeCoverageCandidateLedgerParseResultV1 =
  | Readonly<{ ok: true; value: NegPathTimeCoverageCandidateBundleLedgerV1 }>
  | Readonly<{ ok: false; error: readonly NegPathTimeCoverageCandidateLedgerIssueV1[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'schemaId',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'vectorSetId',
  'scope',
  'declaredPathTimeCoverageParserOnly',
  'canonicalManifestPath',
  'canonicalManifestRegistration',
  'canonicalPromotionClaimed',
  'canonicalPathMutationFamilyComplete',
  'endpointContinuityEstablished',
  'piecewisePolynomialCoverageIncluded',
  'supportProfileIncluded',
  'toleranceProfileIncluded',
  'physicalPathContinuityEstablished',
  'creaseMapCompletenessEstablished',
  'rigidityEstablished',
  'faceIsometryEstablished',
  'hingeGeometryEstablished',
  'certificateHashVerificationIncluded',
  'contactAnalysisIncluded',
  'continuousCollisionDetectionIncluded',
  'collisionDetectionIncluded',
  'collisionFreedomEstablished',
  'foldabilityEstablished',
  'scientificVerificationClaimed',
  'globalM0fGate',
  'caseCount',
  'artifactCount',
  'generator',
  'provenance',
  'cases',
  'artifacts',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addLedgerIssue(
  issues: NegPathTimeCoverageCandidateLedgerIssueV1[],
  path: string,
  code: NegPathTimeCoverageCandidateLedgerIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: NegPathTimeCoverageCandidateLedgerIssueV1[],
): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key))
      addLedgerIssue(issues, `${path}.${key}`, 'unknown-field', 'is undeclared');
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key))
      addLedgerIssue(issues, `${path}.${key}`, 'missing-field', 'is required');
  }
}

function sameStableJson(left: unknown, right: unknown): boolean {
  try {
    return stableStringify(left) === stableStringify(right);
  } catch {
    return false;
  }
}

/** Parses a closed ledger and fixes its case, complete oracle, claims, and artifact rows. */
export function parseNegPathTimeCoverageCandidateBundleLedgerV1(
  supplied: unknown,
): NegPathTimeCoverageCandidateLedgerParseResultV1 {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'must be one cloneable plain JSON-data snapshot',
        },
      ],
    });
  }
  if (!isRecord(snapshot.value)) {
    return deepFreezeOwned({
      ok: false as const,
      error: [{ path: '$', code: 'invalid-object' as const, message: 'must be an object' }],
    });
  }
  const value = snapshot.value;
  const issues: NegPathTimeCoverageCandidateLedgerIssueV1[] = [];
  exactKeys(value, ROOT_KEYS, '$', issues);
  const literals = [
    ['schemaVersion', 1],
    ['schemaId', NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCHEMA_ID],
    ['recordType', NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_RECORD_TYPE],
    ['contractStatus', 'candidate'],
    ['scientificClaim', false],
    ['vectorSetId', 'NEG-PATH-MUTATION-COVERAGE-V1'],
    ['scope', NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCOPE],
    ['declaredPathTimeCoverageParserOnly', true],
    ['canonicalManifestPath', NEG_PATH_TIME_COVERAGE_CANONICAL_MANIFEST_PATH],
    ['canonicalManifestRegistration', 'not-registered'],
    ['canonicalPromotionClaimed', false],
    ['canonicalPathMutationFamilyComplete', false],
    ['endpointContinuityEstablished', false],
    ['piecewisePolynomialCoverageIncluded', false],
    ['supportProfileIncluded', false],
    ['toleranceProfileIncluded', false],
    ['physicalPathContinuityEstablished', false],
    ['creaseMapCompletenessEstablished', false],
    ['rigidityEstablished', false],
    ['faceIsometryEstablished', false],
    ['hingeGeometryEstablished', false],
    ['certificateHashVerificationIncluded', false],
    ['contactAnalysisIncluded', false],
    ['continuousCollisionDetectionIncluded', false],
    ['collisionDetectionIncluded', false],
    ['collisionFreedomEstablished', false],
    ['foldabilityEstablished', false],
    ['scientificVerificationClaimed', false],
    ['globalM0fGate', 'not-evaluated'],
    ['caseCount', 4],
    ['artifactCount', 6],
  ] as const;
  for (const [key, expected] of literals) {
    if (value[key] !== expected) {
      addLedgerIssue(
        issues,
        `$.${key}`,
        'invalid-literal',
        `must equal ${JSON.stringify(expected)}`,
      );
    }
  }
  if (!sameStableJson(value.generator, GENERATOR)) {
    addLedgerIssue(
      issues,
      '$.generator',
      'invalid-literal',
      'must equal the fixed detector identity',
    );
  }
  if (!sameStableJson(value.provenance, SOURCE_PROVENANCE)) {
    addLedgerIssue(issues, '$.provenance', 'invalid-literal', 'must equal fixed provenance');
  }
  const expectedCases = ledgerCases();
  if (!Array.isArray(value.cases) || value.cases.length !== expectedCases.length) {
    addLedgerIssue(issues, '$.cases', 'invalid-array', 'must contain four ordered cases');
  } else {
    for (const [index, expectedCase] of expectedCases.entries()) {
      if (!sameStableJson(value.cases[index], expectedCase)) {
        addLedgerIssue(
          issues,
          `$.cases[${String(index)}]`,
          'invalid-case',
          'case identity, control link, delta, path, or complete ordered issue oracle differs',
        );
      }
    }
  }
  if (!Array.isArray(value.artifacts) || value.artifacts.length !== 6) {
    addLedgerIssue(issues, '$.artifacts', 'invalid-array', 'must contain six ordered artifacts');
  } else {
    for (const [index, expected] of NEG_PATH_TIME_COVERAGE_ARTIFACT_SPECS_V1.entries()) {
      const actual: unknown = value.artifacts[index];
      const path = `$.artifacts[${String(index)}]`;
      if (!isRecord(actual)) {
        addLedgerIssue(issues, path, 'invalid-artifact', 'must be an artifact object');
        continue;
      }
      exactKeys(
        actual,
        ['artifactId', 'role', 'path', 'mediaType', 'sha256', 'licenseSpdx', 'provenance'],
        path,
        issues,
      );
      const { sha256, ...withoutHash } = actual;
      if (!sameStableJson(withoutHash, expected)) {
        addLedgerIssue(issues, path, 'invalid-artifact', 'artifact identity or provenance differs');
      }
      if (typeof sha256 !== 'string' || !SHA256_PATTERN.test(sha256)) {
        addLedgerIssue(issues, `${path}.sha256`, 'invalid-hash', 'must be lowercase SHA-256');
      }
    }
  }
  if (issues.length > 0) return deepFreezeOwned({ ok: false as const, error: issues });
  return deepFreezeOwned({
    ok: true as const,
    value: value as unknown as NegPathTimeCoverageCandidateBundleLedgerV1,
  });
}

function issueSignature(issues: readonly ArtifactContractIssue[]): readonly ExpectedIssueV1[] {
  return issues.map(({ path, code }) => ({ path, code }));
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
  if (isRecord(left) && isRecord(right)) {
    const differences: string[] = [];
    const keys = [
      ...Object.keys(left),
      ...Object.keys(right).filter((key) => !Object.hasOwn(left, key)),
    ].sort();
    for (const key of keys) {
      const childPath = `${path}.${key}`;
      if (!Object.hasOwn(left, key) || !Object.hasOwn(right, key)) differences.push(childPath);
      else differences.push(...jsonDifferencePaths(left[key], right[key], childPath));
    }
    return differences;
  }
  return [path];
}

function jsonLine(value: unknown): string {
  return `${stableStringify(value)}\n`;
}

export type NegPathTimeCoverageCandidateBuiltFileV1 = Readonly<{
  artifactId: string | null;
  path: string;
  text: string;
}>;

export type NegPathTimeCoverageCandidateBuildV1 = Readonly<{
  ledger: NegPathTimeCoverageCandidateBundleLedgerV1;
  files: readonly NegPathTimeCoverageCandidateBuiltFileV1[];
}>;

/** Builds only after the accepted control, exact deltas, and complete parser oracle replays. */
export function buildNegPathTimeCoverageCandidateBundleV1(): NegPathTimeCoverageCandidateBuildV1 {
  if (!parseArtifactContractV1(NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1).ok) {
    throw new TypeError('accepted NEG-PATH-MUTATION-COVERAGE fold control no longer parses');
  }
  for (const caseSpec of NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1) {
    const differences = jsonDifferencePaths(
      NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1,
      caseSpec.sourceDocument,
    );
    if (!sameStableJson(differences, caseSpec.changedPaths)) {
      throw new TypeError(`${caseSpec.caseId} control delta changed`);
    }
    const replay = parseArtifactContractV1(caseSpec.sourceDocument);
    if (replay.ok || !sameStableJson(issueSignature(replay.error), caseSpec.expectedIssues)) {
      throw new TypeError(`${caseSpec.caseId} parser oracle changed`);
    }
  }
  const textByArtifactId = new Map<string, string>([
    ['bundle-readme', NEG_PATH_TIME_COVERAGE_CANDIDATE_README_V1],
    [CONTROL_ARTIFACT_ID, jsonLine(NEG_PATH_TIME_COVERAGE_FOLD_CONTROL_SOURCE_V1)],
    ...NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1.map(
      (caseSpec) => [caseSpec.sourceArtifactId, jsonLine(caseSpec.sourceDocument)] as const,
    ),
  ]);
  const artifacts = NEG_PATH_TIME_COVERAGE_ARTIFACT_SPECS_V1.map((spec) => {
    const text = textByArtifactId.get(spec.artifactId);
    if (text === undefined)
      throw new TypeError(`missing path-time-coverage artifact ${spec.artifactId}`);
    return { ...spec, sha256: sha256Prefixed(text) as `sha256:${string}` };
  });
  const ledger: NegPathTimeCoverageCandidateBundleLedgerV1 = {
    schemaVersion: 1,
    schemaId: NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCHEMA_ID,
    recordType: NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    vectorSetId: 'NEG-PATH-MUTATION-COVERAGE-V1',
    scope: NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCOPE,
    declaredPathTimeCoverageParserOnly: true,
    canonicalManifestPath: NEG_PATH_TIME_COVERAGE_CANONICAL_MANIFEST_PATH,
    canonicalManifestRegistration: 'not-registered',
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
    caseCount: 4,
    artifactCount: 6,
    generator: GENERATOR,
    provenance: SOURCE_PROVENANCE,
    cases: ledgerCases(),
    artifacts,
  };
  const files: NegPathTimeCoverageCandidateBuiltFileV1[] = artifacts.map((artifact) => {
    const text = textByArtifactId.get(artifact.artifactId);
    if (text === undefined)
      throw new TypeError(`missing path-time-coverage artifact ${artifact.artifactId}`);
    return { artifactId: artifact.artifactId, path: artifact.path, text };
  });
  files.push({
    artifactId: null,
    path: NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
    text: jsonLine(ledger),
  });
  return deepFreezeOwned({ ledger, files });
}

/** Writes exactly seven regular files and refuses unexpected entries instead of deleting them. */
export async function writeNegPathTimeCoverageCandidateBundleV1(
  bundleDirectory: string = NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegPathTimeCoverageCandidateBuildV1> {
  const built = buildNegPathTimeCoverageCandidateBundleV1();
  const absoluteDirectory = resolve(bundleDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const expectedNames = new Set(built.files.map((file) => file.path));
  const existing = await readdir(absoluteDirectory, { withFileTypes: true });
  if (existing.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))) {
    throw new TypeError(
      'negative path-time-coverage candidate directory contains an unexpected entry',
    );
  }
  await Promise.all(
    built.files.map((file) => writeFile(resolve(absoluteDirectory, file.path), file.text, 'utf8')),
  );
  return built;
}

export const NEG_PATH_TIME_COVERAGE_CANDIDATE_REASON_CODES = [
  'ledger-unreadable',
  'ledger-invalid',
  'artifact-set-mismatch',
  'artifact-unreadable',
  'artifact-hash-mismatch',
  'canonical-manifest-unreadable',
  'canonical-manifest-registration-present',
  'control-invalid-json',
  'control-unexpectedly-rejected',
  'source-invalid-json',
  'source-control-difference-mismatch',
  'source-unexpectedly-accepted',
  'parser-issue-mismatch',
  'deterministic-regeneration-mismatch',
  'unexpected-failure',
] as const;

export type NegPathTimeCoverageCandidateReasonCodeV1 =
  (typeof NEG_PATH_TIME_COVERAGE_CANDIDATE_REASON_CODES)[number];

export type NegPathTimeCoverageCandidateVerificationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-neg-path-time-coverage-candidate-bundle-verification-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-PATH-MUTATION-COVERAGE-V1';
  scope: typeof NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCOPE;
  declaredPathTimeCoverageParserOnly: true;
  globalM0fGate: 'not-evaluated';
  canonicalPromotionClaimed: false;
  canonicalPathMutationFamilyComplete: false;
  endpointContinuityEstablished: false;
  piecewisePolynomialCoverageIncluded: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  physicalPathContinuityEstablished: false;
  creaseMapCompletenessEstablished: false;
  rigidityEstablished: false;
  faceIsometryEstablished: false;
  hingeGeometryEstablished: false;
  certificateHashVerificationIncluded: false;
  contactAnalysisIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionDetectionIncluded: false;
  collisionFreedomEstablished: false;
  foldabilityEstablished: false;
  scientificVerificationClaimed: false;
  reproducibleExactNegativeBundle: boolean;
  reasonCodes: readonly NegPathTimeCoverageCandidateReasonCodeV1[];
  checks: Readonly<{
    ledgerPresentAndValid: boolean;
    artifactSetExact: boolean;
    allArtifactHashesMatch: boolean;
    allArtifactProvenanceFixed: boolean;
    canonicalManifestRegistrationAbsent: boolean;
    controlArtifactCount: number;
    everyControlArtifactParsed: boolean;
    everySavedControlAccepted: boolean;
    sourceCaseCount: number;
    everySourceParsed: boolean;
    everySourceControlDifferenceMatched: boolean;
    everySourceRejected: boolean;
    everyOrderedIssueSignatureMatched: boolean;
    deterministicRegenerationMatched: boolean;
  }>;
}>;

interface MutableVerificationState {
  reasons: Set<NegPathTimeCoverageCandidateReasonCodeV1>;
  ledgerPresentAndValid: boolean;
  artifactSetExact: boolean;
  allArtifactHashesMatch: boolean;
  allArtifactProvenanceFixed: boolean;
  canonicalManifestRegistrationAbsent: boolean;
  controlArtifactCount: number;
  everyControlArtifactParsed: boolean;
  everySavedControlAccepted: boolean;
  sourceCaseCount: number;
  everySourceParsed: boolean;
  everySourceControlDifferenceMatched: boolean;
  everySourceRejected: boolean;
  everyOrderedIssueSignatureMatched: boolean;
  deterministicRegenerationMatched: boolean;
}

function initialState(): MutableVerificationState {
  return {
    reasons: new Set(),
    ledgerPresentAndValid: false,
    artifactSetExact: false,
    allArtifactHashesMatch: false,
    allArtifactProvenanceFixed: false,
    canonicalManifestRegistrationAbsent: false,
    controlArtifactCount: 0,
    everyControlArtifactParsed: false,
    everySavedControlAccepted: false,
    sourceCaseCount: 0,
    everySourceParsed: false,
    everySourceControlDifferenceMatched: false,
    everySourceRejected: false,
    everyOrderedIssueSignatureMatched: false,
    deterministicRegenerationMatched: false,
  };
}

function resultFromState(
  state: MutableVerificationState,
): NegPathTimeCoverageCandidateVerificationResultV1 {
  const reasonCodes = NEG_PATH_TIME_COVERAGE_CANDIDATE_REASON_CODES.filter((code) =>
    state.reasons.has(code),
  );
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: 'm0f-neg-path-time-coverage-candidate-bundle-verification-result' as const,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    vectorSetId: 'NEG-PATH-MUTATION-COVERAGE-V1' as const,
    scope: NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_SCOPE,
    declaredPathTimeCoverageParserOnly: true as const,
    globalM0fGate: 'not-evaluated' as const,
    canonicalPromotionClaimed: false as const,
    canonicalPathMutationFamilyComplete: false as const,
    endpointContinuityEstablished: false as const,
    piecewisePolynomialCoverageIncluded: false as const,
    supportProfileIncluded: false as const,
    toleranceProfileIncluded: false as const,
    physicalPathContinuityEstablished: false as const,
    creaseMapCompletenessEstablished: false as const,
    rigidityEstablished: false as const,
    faceIsometryEstablished: false as const,
    hingeGeometryEstablished: false as const,
    certificateHashVerificationIncluded: false as const,
    contactAnalysisIncluded: false as const,
    continuousCollisionDetectionIncluded: false as const,
    collisionDetectionIncluded: false as const,
    collisionFreedomEstablished: false as const,
    foldabilityEstablished: false as const,
    scientificVerificationClaimed: false as const,
    reproducibleExactNegativeBundle: reasonCodes.length === 0,
    reasonCodes,
    checks: {
      ledgerPresentAndValid: state.ledgerPresentAndValid,
      artifactSetExact: state.artifactSetExact,
      allArtifactHashesMatch: state.allArtifactHashesMatch,
      allArtifactProvenanceFixed: state.allArtifactProvenanceFixed,
      canonicalManifestRegistrationAbsent: state.canonicalManifestRegistrationAbsent,
      controlArtifactCount: state.controlArtifactCount,
      everyControlArtifactParsed: state.everyControlArtifactParsed,
      everySavedControlAccepted: state.everySavedControlAccepted,
      sourceCaseCount: state.sourceCaseCount,
      everySourceParsed: state.everySourceParsed,
      everySourceControlDifferenceMatched: state.everySourceControlDifferenceMatched,
      everySourceRejected: state.everySourceRejected,
      everyOrderedIssueSignatureMatched: state.everyOrderedIssueSignatureMatched,
      deterministicRegenerationMatched: state.deterministicRegenerationMatched,
    },
  });
}

function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

async function canonicalCasesAreAbsent(): Promise<boolean | undefined> {
  try {
    const parsed = parseFixtureManifest(
      JSON.parse(
        await readFile(resolve(NEG_PATH_TIME_COVERAGE_CANONICAL_MANIFEST_PATH), 'utf8'),
      ) as unknown,
    );
    if (parsed.manifest === undefined) return undefined;
    const candidateIds = new Set<string>(NEG_PATH_TIME_COVERAGE_CASE_IDS);
    return !parsed.manifest.fixtures.some((fixture) => candidateIds.has(fixture.id));
  } catch {
    return undefined;
  }
}

/** Replays the saved control and four sources only through the declared path-time parser boundary. */
export async function verifyNegPathTimeCoverageCandidateBundleV1(
  bundleDirectory: string = NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegPathTimeCoverageCandidateVerificationResultV1> {
  const state = initialState();
  try {
    const absoluteDirectory = resolve(bundleDirectory);
    let ledgerText: string;
    let ledgerDocument: unknown;
    try {
      ledgerText = await readFile(
        resolve(absoluteDirectory, NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_LEDGER_FILENAME),
        'utf8',
      );
      ledgerDocument = JSON.parse(ledgerText) as unknown;
    } catch {
      state.reasons.add('ledger-unreadable');
      return resultFromState(state);
    }
    const parsedLedger = parseNegPathTimeCoverageCandidateBundleLedgerV1(ledgerDocument);
    if (!parsedLedger.ok) {
      state.reasons.add('ledger-invalid');
      return resultFromState(state);
    }
    state.ledgerPresentAndValid = true;
    state.allArtifactProvenanceFixed = true;

    const expectedNames = new Set([
      NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
      ...parsedLedger.value.artifacts.map((artifact) => artifact.path),
    ]);
    const directoryEntries = await readdir(absoluteDirectory, { withFileTypes: true });
    if (
      directoryEntries.length !== expectedNames.size ||
      directoryEntries.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))
    ) {
      state.reasons.add('artifact-set-mismatch');
      return resultFromState(state);
    }
    state.artifactSetExact = true;

    const textByArtifactId = new Map<string, string>();
    const textByPath = new Map<string, string>([
      [NEG_PATH_TIME_COVERAGE_CANDIDATE_BUNDLE_LEDGER_FILENAME, ledgerText],
    ]);
    for (const artifact of parsedLedger.value.artifacts) {
      let bytes: Uint8Array;
      try {
        bytes = await readFile(resolve(absoluteDirectory, artifact.path));
      } catch {
        state.reasons.add('artifact-unreadable');
        return resultFromState(state);
      }
      if (sha256Prefixed(bytes) !== artifact.sha256) {
        state.reasons.add('artifact-hash-mismatch');
        return resultFromState(state);
      }
      const text = Buffer.from(bytes).toString('utf8');
      textByArtifactId.set(artifact.artifactId, text);
      textByPath.set(artifact.path, text);
    }
    state.allArtifactHashesMatch = true;

    const canonicalAbsent = await canonicalCasesAreAbsent();
    if (canonicalAbsent === undefined) state.reasons.add('canonical-manifest-unreadable');
    else if (!canonicalAbsent) state.reasons.add('canonical-manifest-registration-present');
    else state.canonicalManifestRegistrationAbsent = true;

    const control = parseJsonText(textByArtifactId.get(CONTROL_ARTIFACT_ID) ?? '');
    if (control === undefined) {
      state.reasons.add('control-invalid-json');
    } else {
      state.controlArtifactCount = 1;
      state.everyControlArtifactParsed = true;
      if (parseArtifactContractV1(control).ok) state.everySavedControlAccepted = true;
      else state.reasons.add('control-unexpectedly-rejected');
    }

    let everySourceParsed = true;
    let everyDifferenceMatched = control !== undefined;
    let everySourceRejected = true;
    let everySignatureMatched = true;
    for (const caseSpec of NEG_PATH_TIME_COVERAGE_CASE_SPECS_V1) {
      const source = parseJsonText(textByArtifactId.get(caseSpec.sourceArtifactId) ?? '');
      if (source === undefined) {
        everySourceParsed = false;
        everyDifferenceMatched = false;
        everySourceRejected = false;
        everySignatureMatched = false;
        state.reasons.add('source-invalid-json');
        continue;
      }
      state.sourceCaseCount += 1;
      if (
        control === undefined ||
        !sameStableJson(jsonDifferencePaths(control, source), caseSpec.changedPaths)
      ) {
        everyDifferenceMatched = false;
        state.reasons.add('source-control-difference-mismatch');
      }
      const replay = parseArtifactContractV1(source);
      if (replay.ok) {
        everySourceRejected = false;
        everySignatureMatched = false;
        state.reasons.add('source-unexpectedly-accepted');
      } else if (!sameStableJson(issueSignature(replay.error), caseSpec.expectedIssues)) {
        everySignatureMatched = false;
        state.reasons.add('parser-issue-mismatch');
      }
    }
    state.everySourceParsed = everySourceParsed;
    state.everySourceControlDifferenceMatched = everyDifferenceMatched;
    state.everySourceRejected = everySourceRejected;
    state.everyOrderedIssueSignatureMatched = everySignatureMatched;

    const regenerated = buildNegPathTimeCoverageCandidateBundleV1();
    if (regenerated.files.every((file) => textByPath.get(file.path) === file.text)) {
      state.deterministicRegenerationMatched = true;
    } else {
      state.reasons.add('deterministic-regeneration-mismatch');
    }
    return resultFromState(state);
  } catch {
    state.reasons.add('unexpected-failure');
    return resultFromState(state);
  }
}
