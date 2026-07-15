import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { parseArtifactContractV1, type ArtifactContractIssue } from './artifacts/contract.js';
import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import {
  NEG_PATH_ANGLE_BOUND_FOLD_CONTROL_SOURCE_V1,
  type NegPathAngleBoundSourceDocumentV1,
} from './neg-path-angle-bound-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from './manifest.js';
import { stableStringify } from './stable-json.js';

export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/neg-path-bounded-finite-interval-angle-bounds-candidate-bundle-ledger-v1.schema.json' as const;
export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_RECORD_TYPE =
  'm0f-neg-path-bounded-finite-interval-angle-bounds-candidate-bundle-ledger' as const;
export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_SCOPE =
  'project-authored-exact-negative-artifact-contract-bounded-interpolation-finite-interval-angle-bounds-parser-replay-only' as const;
export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_GENERATOR_ID =
  'oridesign-neg-path-bounded-finite-interval-angle-bounds-candidate-bundle' as const;
export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_GENERATOR_VERSION =
  '1.0.0-candidate' as const;
export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY =
  'tests/candidate-vectors/NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS' as const;
export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_LEDGER_FILENAME =
  'candidate-bundle-ledger.json' as const;
export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANONICAL_MANIFEST_PATH =
  'tests/fixtures/manifest.json' as const;
export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_ID =
  'NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS' as const;

const SOURCE_REFERENCE_ID =
  'oridesign-neg-path-bounded-finite-interval-angle-bounds-candidate-v1' as const;
const CONTROL_ARTIFACT_ID = 'control-fold' as const;
const SOURCE_ARTIFACT_ID = 'source-path-bounded-finite-interval-angle-bounds' as const;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

export type NegPathBoundedFiniteIntervalAngleBoundsSourceDocumentV1 =
  NegPathAngleBoundSourceDocumentV1;

function ownedAcceptedControl(): NegPathBoundedFiniteIntervalAngleBoundsSourceDocumentV1 {
  const control = structuredClone(NEG_PATH_ANGLE_BOUND_FOLD_CONTROL_SOURCE_V1);
  const pathCandidate = control.pathCandidate as unknown as Record<string, unknown>;
  const segment = control.pathCandidate.segments[0];
  if (
    control.pathCandidate.segments.length !== 1 ||
    pathCandidate.representationVersion !== 1 ||
    pathCandidate.representationStatus !== 'candidate' ||
    segment?.t0 !== 0 ||
    segment.t1 !== 1 ||
    segment.motion.kind !== 'bounded-interpolation' ||
    segment.motion.knotTimes.length !== 3 ||
    segment.motion.knotTimes[0] !== 0 ||
    segment.motion.knotTimes[1] !== 0.5 ||
    segment.motion.knotTimes[2] !== 1 ||
    segment.motion.anglesByCrease.length !== 1 ||
    segment.motion.anglesByCrease[0]?.edgeId !== 'e-hinge' ||
    segment.motion.anglesByCrease[0].angles.length !== 3 ||
    segment.motion.anglesByCrease[0].angles[0] !== 0 ||
    segment.motion.anglesByCrease[0].angles[1] !== Math.PI / 2 ||
    segment.motion.anglesByCrease[0].angles[2] !== Math.PI ||
    segment.motion.intervalAngleBoundsByCrease.length !== 1 ||
    segment.motion.intervalAngleBoundsByCrease[0]?.edgeId !== 'e-hinge' ||
    segment.motion.intervalAngleBoundsByCrease[0].bounds.length !== 2 ||
    segment.motion.intervalAngleBoundsByCrease[0].bounds[0]?.[0] !== 0 ||
    segment.motion.intervalAngleBoundsByCrease[0].bounds[0][1] !== Math.PI / 2 ||
    segment.motion.intervalAngleBoundsByCrease[0].bounds[1]?.[0] !== Math.PI / 2 ||
    segment.motion.intervalAngleBoundsByCrease[0].bounds[1][1] !== Math.PI
  ) {
    throw new TypeError('fixed bounded-interpolation control anchor drifted');
  }
  if (!parseArtifactContractV1(control).ok) {
    throw new TypeError('fixed bounded-interpolation control must be accepted');
  }
  return control;
}

export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_FOLD_CONTROL_SOURCE_V1 =
  deepFreezeOwned(ownedAcceptedControl());

function boundedFiniteIntervalAngleBoundsSource(): NegPathBoundedFiniteIntervalAngleBoundsSourceDocumentV1 {
  const source = structuredClone(
    NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_FOLD_CONTROL_SOURCE_V1,
  );
  const segment = source.pathCandidate.segments[0];
  const bounds =
    segment?.motion.kind === 'bounded-interpolation'
      ? segment.motion.intervalAngleBoundsByCrease[0]?.bounds
      : undefined;
  if (
    source.pathCandidate.segments.length !== 1 ||
    segment?.motion.kind !== 'bounded-interpolation' ||
    bounds?.length !== 2 ||
    bounds[0]?.[0] !== 0 ||
    bounds[0][1] !== Math.PI / 2 ||
    bounds[1]?.[0] !== Math.PI / 2 ||
    bounds[1][1] !== Math.PI
  ) {
    throw new TypeError(
      'fixed bounded-interpolation interval-angle-bound anchor drifted before replacement',
    );
  }
  (bounds[0] as unknown[])[0] = null;
  return source;
}

type ExpectedIssueV1 = Readonly<{ path: string; code: string }>;

export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1 = deepFreezeOwned({
  caseId: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_ID,
  controlArtifactId: CONTROL_ARTIFACT_ID,
  mutationKind: 'replace-first-bounded-interpolation-interval-angle-lower-bound-with-json-null',
  changedPaths: ['$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[0].bounds[0][0]'],

  sourceArtifactId: SOURCE_ARTIFACT_ID,
  sourcePath: 'path-bounded-finite-interval-angle-bounds.json',
  sourceDocument: boundedFiniteIntervalAngleBoundsSource(),
  expectedIssues: [
    {
      path: '$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[0].bounds[0][0]',
      code: 'non-finite-number',
    },
  ],
} as const);

export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_README_V1 = `# NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS exact-negative candidate vector

This closed directory contains one saved project-authored single-segment bounded-interpolation FOLD control and one exact-negative mutation for the current \`parseArtifactContractV1\` finite interval-angle-bound boundary. The accepted owned control declares representation version 1, status \`candidate\`, knot times \`[0,0.5,1]\`, one valid \`e-hinge\` angle row \`[0,pi/2,pi]\`, and matching interval bounds \`[[0,pi/2],[pi/2,pi]]\`. The mutation replaces only the first interval lower bound with JSON \`null\`. It fixes the sole \`non-finite-number\` issue with message \`must be a finite binary64 number\` at that leaf and no secondary issue. The bounds-row length, interval count, and crease-reference set remain unchanged; failed finite-tuple validation prevents bound-map and containment inference from adding a secondary issue.

The bundle is intentionally outside \`tests/fixtures/manifest.json\`; \`NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS\` is not canonically registered or promoted. Exact-negative means only that the current artifact-contract parser rejects these saved bytes with the complete ordered issue signature fixed in the ledger.

This replay establishes only rejection of the saved non-finite bounded-interpolation interval-angle-bound value. It does not establish finite angle or knot-time handling, representation-version, representation-status, or supported-representation-kind handling, bounded-interpolation angle- or interval-bound-row uniqueness, angle/knot or bound/knot-interval cardinality, motion- or crease-map completeness, angle containment, strict knot ordering, path-time coverage, endpoint or physical continuity, representation selection or completeness, polynomial semantics, a radian convention, physical angle schedules or bounds, conservative bounds, kinematic feasibility, rigidity, face isometry, hinge geometry, contact analysis, CCD, collision detection or freedom, foldability, certificate-hash verification, cryptographic authenticity, canonical path-mutation-family completeness, SupportProfile, ToleranceProfile, scientific verification, or M0F GO. Local SHA-256 rows detect saved-byte drift only and are not signatures.

Verify with \`npx tsx m0f/neg-path-bounded-finite-interval-angle-bounds-candidate-bundle-cli.ts --verify\`. Regenerate with \`npx tsx m0f/neg-path-bounded-finite-interval-angle-bounds-candidate-bundle-cli.ts --write\`.
`;

export type NegPathBoundedFiniteIntervalAngleBoundsArtifactProvenanceV1 = Readonly<{
  sourceReferenceId: typeof SOURCE_REFERENCE_ID;
  sourceUse: 'project-authored';
  derivation: 'authored' | 'mutated-from-control';
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[];
}>;

export type NegPathBoundedFiniteIntervalAngleBoundsArtifactLedgerEntryV1 = Readonly<{
  artifactId: string;
  role: 'readme' | 'accepted-control' | 'negative-source';
  path: string;
  mediaType: 'text/markdown; charset=utf-8' | 'application/json';
  sha256: `sha256:${string}`;
  licenseSpdx: 'MIT';
  provenance: NegPathBoundedFiniteIntervalAngleBoundsArtifactProvenanceV1;
}>;

function artifactProvenance(
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[],
): NegPathBoundedFiniteIntervalAngleBoundsArtifactProvenanceV1 {
  return {
    sourceReferenceId: SOURCE_REFERENCE_ID,
    sourceUse: 'project-authored',
    derivation: dependsOnArtifactIds.length === 0 ? 'authored' : 'mutated-from-control',
    dependsOnArtifactIds,
  };
}

type ArtifactSpecV1 = Omit<NegPathBoundedFiniteIntervalAngleBoundsArtifactLedgerEntryV1, 'sha256'>;

export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_ARTIFACT_SPECS_V1 = deepFreezeOwned([
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
  {
    artifactId: SOURCE_ARTIFACT_ID,
    role: 'negative-source',
    path: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.sourcePath,
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([CONTROL_ARTIFACT_ID]),
  },
] as const satisfies readonly ArtifactSpecV1[]);

export type NegPathBoundedFiniteIntervalAngleBoundsCaseLedgerRowV1 = Readonly<{
  caseIndex: 0;
  caseId: typeof NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_ID;
  controlArtifactId: typeof CONTROL_ARTIFACT_ID;
  mutationKind: typeof NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.mutationKind;
  changedPaths: readonly [
    '$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[0].bounds[0][0]',
  ];
  sourceArtifactId: typeof SOURCE_ARTIFACT_ID;
  sourcePath: 'path-bounded-finite-interval-angle-bounds.json';
  expectedOutcome: 'rejected';
  expectedIssues: readonly ExpectedIssueV1[];
}>;

const GENERATOR = deepFreezeOwned({
  generatorId: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_GENERATOR_ID,
  generatorVersion:
    NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_GENERATOR_VERSION,
  serialization: 'stable-json-utf8-lf-v1' as const,
  detector: 'parseArtifactContractV1' as const,
  detectorSourcePath: 'm0f/artifacts/contract.ts' as const,
});

const SOURCE_PROVENANCE = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceKind: 'project-authored' as const,
  title:
    'NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS project-authored bounded-interpolation finite-interval-angle-bounds parser vector',
  authors: ['OriDesign contributors'],
  redistribution: 'allowed' as const,
  licenseSpdx: 'MIT' as const,
});

function ledgerCases(): readonly NegPathBoundedFiniteIntervalAngleBoundsCaseLedgerRowV1[] {
  return [
    {
      caseIndex: 0,
      caseId: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_ID,
      controlArtifactId: CONTROL_ARTIFACT_ID,
      mutationKind: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.mutationKind,
      changedPaths: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.changedPaths,
      sourceArtifactId: SOURCE_ARTIFACT_ID,
      sourcePath: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.sourcePath,
      expectedOutcome: 'rejected',
      expectedIssues: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.expectedIssues,
    },
  ];
}

export type NegPathBoundedFiniteIntervalAngleBoundsCandidateBundleLedgerV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_SCHEMA_ID;
  recordType: typeof NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS-V1';
  scope: typeof NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_SCOPE;
  declaredBoundedInterpolationFiniteIntervalAngleBoundsParserOnly: true;
  declaredBoundedInterpolationFiniteAnglesParserOnly: false;
  declaredBoundedInterpolationFiniteKnotTimesParserOnly: false;
  declaredPathCandidateRepresentationVersionParserOnly: false;
  declaredPathCandidateRepresentationStatusParserOnly: false;
  declaredPathCandidateSupportedRepresentationKindParserOnly: false;
  declaredBoundedInterpolationUniqueAngleCreaseRowsParserOnly: false;
  declaredBoundedInterpolationUniqueIntervalBoundCreaseRowsParserOnly: false;
  declaredBoundedInterpolationAngleKnotCardinalityParserOnly: false;
  declaredBoundedInterpolationBoundKnotIntervalCardinalityParserOnly: false;
  declaredBoundedInterpolationAngleContainmentParserOnly: false;
  declaredBoundedInterpolationKnotTimeStrictMonotonicityParserOnly: false;
  canonicalManifestPath: typeof NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANONICAL_MANIFEST_PATH;
  canonicalManifestRegistration: 'not-registered';
  canonicalPromotionClaimed: false;
  canonicalPathMutationFamilyComplete: false;
  representationSelectionEstablished: false;
  pathTimeCoverageEstablished: false;
  motionMapCompletenessEstablished: false;
  creaseMapCompletenessEstablished: false;
  pathRepresentationCompletenessEstablished: false;
  piecewisePolynomialCardinalityIncluded: false;
  piecewisePolynomialSemanticsEstablished: false;
  piecewisePolynomialEndpointInferenceIncluded: false;
  physicalAngleScheduleEstablished: false;
  radianConventionEstablished: false;
  physicalAngleBoundsEstablished: false;
  conservativeAngleBoundsEstablished: false;
  kinematicFeasibilityEstablished: false;
  physicalPathContinuityEstablished: false;
  endpointContinuityEstablished: false;
  rigidityEstablished: false;
  faceIsometryEstablished: false;
  hingeGeometryEstablished: false;
  certificateHashVerificationIncluded: false;
  cryptographicAuthenticityEstablished: false;
  contactAnalysisIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionDetectionIncluded: false;
  collisionFreedomEstablished: false;
  foldabilityEstablished: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  globalM0fGate: 'not-evaluated';
  caseCount: 1;
  artifactCount: 3;
  generator: typeof GENERATOR;
  provenance: typeof SOURCE_PROVENANCE;
  cases: readonly NegPathBoundedFiniteIntervalAngleBoundsCaseLedgerRowV1[];
  artifacts: readonly NegPathBoundedFiniteIntervalAngleBoundsArtifactLedgerEntryV1[];
}>;

export type NegPathBoundedFiniteIntervalAngleBoundsCandidateLedgerIssueV1 = Readonly<{
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

export type NegPathBoundedFiniteIntervalAngleBoundsCandidateLedgerParseResultV1 =
  | Readonly<{ ok: true; value: NegPathBoundedFiniteIntervalAngleBoundsCandidateBundleLedgerV1 }>
  | Readonly<{
      ok: false;
      error: readonly NegPathBoundedFiniteIntervalAngleBoundsCandidateLedgerIssueV1[];
    }>;
const ROOT_KEYS = [
  'schemaVersion',
  'schemaId',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'vectorSetId',
  'scope',
  'declaredBoundedInterpolationFiniteIntervalAngleBoundsParserOnly',
  'declaredBoundedInterpolationFiniteAnglesParserOnly',
  'declaredBoundedInterpolationFiniteKnotTimesParserOnly',
  'declaredPathCandidateRepresentationVersionParserOnly',
  'declaredPathCandidateRepresentationStatusParserOnly',
  'declaredPathCandidateSupportedRepresentationKindParserOnly',
  'declaredBoundedInterpolationUniqueAngleCreaseRowsParserOnly',
  'declaredBoundedInterpolationUniqueIntervalBoundCreaseRowsParserOnly',
  'declaredBoundedInterpolationAngleKnotCardinalityParserOnly',
  'declaredBoundedInterpolationBoundKnotIntervalCardinalityParserOnly',
  'declaredBoundedInterpolationAngleContainmentParserOnly',
  'declaredBoundedInterpolationKnotTimeStrictMonotonicityParserOnly',
  'canonicalManifestPath',
  'canonicalManifestRegistration',
  'canonicalPromotionClaimed',
  'canonicalPathMutationFamilyComplete',
  'representationSelectionEstablished',
  'pathTimeCoverageEstablished',
  'motionMapCompletenessEstablished',
  'creaseMapCompletenessEstablished',
  'pathRepresentationCompletenessEstablished',
  'piecewisePolynomialCardinalityIncluded',
  'piecewisePolynomialSemanticsEstablished',
  'piecewisePolynomialEndpointInferenceIncluded',
  'physicalAngleScheduleEstablished',
  'radianConventionEstablished',
  'physicalAngleBoundsEstablished',
  'conservativeAngleBoundsEstablished',
  'kinematicFeasibilityEstablished',
  'physicalPathContinuityEstablished',
  'endpointContinuityEstablished',
  'rigidityEstablished',
  'faceIsometryEstablished',
  'hingeGeometryEstablished',
  'certificateHashVerificationIncluded',
  'cryptographicAuthenticityEstablished',
  'contactAnalysisIncluded',
  'continuousCollisionDetectionIncluded',
  'collisionDetectionIncluded',
  'collisionFreedomEstablished',
  'foldabilityEstablished',
  'supportProfileIncluded',
  'toleranceProfileIncluded',
  'scientificVerificationClaimed',
  'globalM0fGate',
  'caseCount',
  'artifactCount',
  'generator',
  'provenance',
  'cases',
  'artifacts',
] as const;

const FIXED_LITERALS = [
  ['schemaVersion', 1],
  ['schemaId', NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_SCHEMA_ID],
  ['recordType', NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_RECORD_TYPE],
  ['contractStatus', 'candidate'],
  ['scientificClaim', false],
  ['vectorSetId', 'NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS-V1'],
  ['scope', NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_SCOPE],
  ['declaredBoundedInterpolationFiniteIntervalAngleBoundsParserOnly', true],
  ['declaredBoundedInterpolationFiniteAnglesParserOnly', false],
  ['declaredBoundedInterpolationFiniteKnotTimesParserOnly', false],
  ['declaredPathCandidateRepresentationVersionParserOnly', false],
  ['declaredPathCandidateRepresentationStatusParserOnly', false],
  ['declaredPathCandidateSupportedRepresentationKindParserOnly', false],
  ['declaredBoundedInterpolationUniqueAngleCreaseRowsParserOnly', false],
  ['declaredBoundedInterpolationUniqueIntervalBoundCreaseRowsParserOnly', false],
  ['declaredBoundedInterpolationAngleKnotCardinalityParserOnly', false],
  ['declaredBoundedInterpolationBoundKnotIntervalCardinalityParserOnly', false],
  ['declaredBoundedInterpolationAngleContainmentParserOnly', false],
  ['declaredBoundedInterpolationKnotTimeStrictMonotonicityParserOnly', false],
  ['canonicalManifestPath', NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANONICAL_MANIFEST_PATH],
  ['canonicalManifestRegistration', 'not-registered'],
  ['canonicalPromotionClaimed', false],
  ['canonicalPathMutationFamilyComplete', false],
  ['representationSelectionEstablished', false],
  ['pathTimeCoverageEstablished', false],
  ['motionMapCompletenessEstablished', false],
  ['creaseMapCompletenessEstablished', false],
  ['pathRepresentationCompletenessEstablished', false],
  ['piecewisePolynomialCardinalityIncluded', false],
  ['piecewisePolynomialSemanticsEstablished', false],
  ['piecewisePolynomialEndpointInferenceIncluded', false],
  ['physicalAngleScheduleEstablished', false],
  ['radianConventionEstablished', false],
  ['physicalAngleBoundsEstablished', false],
  ['conservativeAngleBoundsEstablished', false],
  ['kinematicFeasibilityEstablished', false],
  ['physicalPathContinuityEstablished', false],
  ['endpointContinuityEstablished', false],
  ['rigidityEstablished', false],
  ['faceIsometryEstablished', false],
  ['hingeGeometryEstablished', false],
  ['certificateHashVerificationIncluded', false],
  ['cryptographicAuthenticityEstablished', false],

  ['contactAnalysisIncluded', false],
  ['continuousCollisionDetectionIncluded', false],
  ['collisionDetectionIncluded', false],
  ['collisionFreedomEstablished', false],
  ['foldabilityEstablished', false],
  ['supportProfileIncluded', false],
  ['toleranceProfileIncluded', false],
  ['scientificVerificationClaimed', false],
  ['globalM0fGate', 'not-evaluated'],
  ['caseCount', 1],
  ['artifactCount', 3],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sameStableJson(left: unknown, right: unknown): boolean {
  try {
    return stableStringify(left) === stableStringify(right);
  } catch {
    return false;
  }
}

function addLedgerIssue(
  issues: NegPathBoundedFiniteIntervalAngleBoundsCandidateLedgerIssueV1[],
  path: string,
  code: NegPathBoundedFiniteIntervalAngleBoundsCandidateLedgerIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: NegPathBoundedFiniteIntervalAngleBoundsCandidateLedgerIssueV1[],
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

export function parseNegPathBoundedFiniteIntervalAngleBoundsCandidateBundleLedgerV1(
  supplied: unknown,
): NegPathBoundedFiniteIntervalAngleBoundsCandidateLedgerParseResultV1 {
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
  const issues: NegPathBoundedFiniteIntervalAngleBoundsCandidateLedgerIssueV1[] = [];
  exactKeys(value, ROOT_KEYS, '$', issues);
  for (const [key, expected] of FIXED_LITERALS) {
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
  if (!Array.isArray(value.cases) || value.cases.length !== 1) {
    addLedgerIssue(issues, '$.cases', 'invalid-array', 'must contain one ordered case');
  } else if (!sameStableJson(value.cases[0], expectedCases[0])) {
    addLedgerIssue(
      issues,
      '$.cases[0]',
      'invalid-case',
      'case identity, control link, representation-kind delta, path, or complete issue oracle differs',
    );
  }
  if (!Array.isArray(value.artifacts) || value.artifacts.length !== 3) {
    addLedgerIssue(issues, '$.artifacts', 'invalid-array', 'must contain three ordered artifacts');
  } else {
    for (const [
      index,
      expected,
    ] of NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_ARTIFACT_SPECS_V1.entries()) {
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
    value: value as unknown as NegPathBoundedFiniteIntervalAngleBoundsCandidateBundleLedgerV1,
  });
}

function issueSignature(issues: readonly ArtifactContractIssue[]): readonly ExpectedIssueV1[] {
  return issues.map(({ path, code }) => ({ path, code }));
}

export function boundedFiniteIntervalAngleBoundsJsonDifferencePaths(
  left: unknown,
  right: unknown,
  path = '$',
): string[] {
  if (Object.is(left, right)) return [];
  if (Array.isArray(left) && Array.isArray(right)) {
    const differences: string[] = [];
    for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
      const childPath = `${path}[${String(index)}]`;
      if (!Object.hasOwn(left, index) || !Object.hasOwn(right, index)) differences.push(childPath);
      else
        differences.push(
          ...boundedFiniteIntervalAngleBoundsJsonDifferencePaths(
            left[index],
            right[index],
            childPath,
          ),
        );
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
      else
        differences.push(
          ...boundedFiniteIntervalAngleBoundsJsonDifferencePaths(left[key], right[key], childPath),
        );
    }
    return differences;
  }
  return [path];
}

function jsonLine(value: unknown): string {
  return `${stableStringify(value)}\n`;
}

export type NegPathBoundedFiniteIntervalAngleBoundsCandidateBuiltFileV1 = Readonly<{
  artifactId: string | null;
  path: string;
  text: string;
}>;

export type NegPathBoundedFiniteIntervalAngleBoundsCandidateBuildV1 = Readonly<{
  ledger: NegPathBoundedFiniteIntervalAngleBoundsCandidateBundleLedgerV1;
  files: readonly NegPathBoundedFiniteIntervalAngleBoundsCandidateBuiltFileV1[];
}>;

export function buildNegPathBoundedFiniteIntervalAngleBoundsCandidateBundleV1(): NegPathBoundedFiniteIntervalAngleBoundsCandidateBuildV1 {
  if (
    !parseArtifactContractV1(NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_FOLD_CONTROL_SOURCE_V1)
      .ok
  ) {
    throw new TypeError('accepted finite-interval-angle-bounds control no longer parses');
  }
  const differences = boundedFiniteIntervalAngleBoundsJsonDifferencePaths(
    NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_FOLD_CONTROL_SOURCE_V1,
    NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.sourceDocument,
  );
  if (
    !sameStableJson(
      differences,
      NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.changedPaths,
    )
  ) {
    throw new TypeError('bounded finite-interval-angle-bounds delta changed');
  }
  const replay = parseArtifactContractV1(
    NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.sourceDocument,
  );
  if (
    replay.ok ||
    !sameStableJson(
      issueSignature(replay.error),
      NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.expectedIssues,
    )
  ) {
    throw new TypeError('bounded finite-interval-angle-bounds parser oracle changed');
  }
  const textByArtifactId = new Map<string, string>([
    ['bundle-readme', NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_README_V1],
    [
      CONTROL_ARTIFACT_ID,
      jsonLine(NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_FOLD_CONTROL_SOURCE_V1),
    ],
    [
      SOURCE_ARTIFACT_ID,
      jsonLine(NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.sourceDocument),
    ],
  ]);
  const artifacts = NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_ARTIFACT_SPECS_V1.map((spec) => {
    const text = textByArtifactId.get(spec.artifactId);
    if (text === undefined)
      throw new TypeError(
        `missing bounded-finite-interval-angle-bounds artifact ${spec.artifactId}`,
      );
    return { ...spec, sha256: sha256Prefixed(text) as `sha256:${string}` };
  });
  const ledger: NegPathBoundedFiniteIntervalAngleBoundsCandidateBundleLedgerV1 = {
    schemaVersion: 1,
    schemaId: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_SCHEMA_ID,
    recordType: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    vectorSetId: 'NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS-V1',
    scope: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_SCOPE,
    declaredBoundedInterpolationFiniteIntervalAngleBoundsParserOnly: true,
    declaredBoundedInterpolationFiniteAnglesParserOnly: false,
    declaredBoundedInterpolationFiniteKnotTimesParserOnly: false,
    declaredPathCandidateRepresentationVersionParserOnly: false,
    declaredPathCandidateRepresentationStatusParserOnly: false,
    declaredPathCandidateSupportedRepresentationKindParserOnly: false,
    declaredBoundedInterpolationUniqueAngleCreaseRowsParserOnly: false,
    declaredBoundedInterpolationUniqueIntervalBoundCreaseRowsParserOnly: false,
    declaredBoundedInterpolationAngleKnotCardinalityParserOnly: false,
    declaredBoundedInterpolationBoundKnotIntervalCardinalityParserOnly: false,
    declaredBoundedInterpolationAngleContainmentParserOnly: false,
    declaredBoundedInterpolationKnotTimeStrictMonotonicityParserOnly: false,
    canonicalManifestPath: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANONICAL_MANIFEST_PATH,
    canonicalManifestRegistration: 'not-registered',
    canonicalPromotionClaimed: false,
    canonicalPathMutationFamilyComplete: false,
    representationSelectionEstablished: false,
    pathTimeCoverageEstablished: false,
    motionMapCompletenessEstablished: false,
    creaseMapCompletenessEstablished: false,
    pathRepresentationCompletenessEstablished: false,
    piecewisePolynomialCardinalityIncluded: false,
    piecewisePolynomialSemanticsEstablished: false,
    piecewisePolynomialEndpointInferenceIncluded: false,
    physicalAngleScheduleEstablished: false,
    radianConventionEstablished: false,
    physicalAngleBoundsEstablished: false,
    conservativeAngleBoundsEstablished: false,
    kinematicFeasibilityEstablished: false,
    physicalPathContinuityEstablished: false,
    endpointContinuityEstablished: false,
    rigidityEstablished: false,
    faceIsometryEstablished: false,
    hingeGeometryEstablished: false,
    certificateHashVerificationIncluded: false,
    cryptographicAuthenticityEstablished: false,
    contactAnalysisIncluded: false,
    continuousCollisionDetectionIncluded: false,
    collisionDetectionIncluded: false,
    collisionFreedomEstablished: false,
    foldabilityEstablished: false,
    supportProfileIncluded: false,
    toleranceProfileIncluded: false,
    scientificVerificationClaimed: false,
    globalM0fGate: 'not-evaluated',
    caseCount: 1,
    artifactCount: 3,
    generator: GENERATOR,
    provenance: SOURCE_PROVENANCE,
    cases: ledgerCases(),
    artifacts,
  };
  const files: NegPathBoundedFiniteIntervalAngleBoundsCandidateBuiltFileV1[] = artifacts.map(
    (artifact) => {
      const text = textByArtifactId.get(artifact.artifactId);
      if (text === undefined)
        throw new TypeError(
          `missing bounded-finite-interval-angle-bounds artifact ${artifact.artifactId}`,
        );
      return { artifactId: artifact.artifactId, path: artifact.path, text };
    },
  );
  files.push({
    artifactId: null,
    path: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_LEDGER_FILENAME,
    text: jsonLine(ledger),
  });
  return deepFreezeOwned({ ledger, files });
}

export async function writeNegPathBoundedFiniteIntervalAngleBoundsCandidateBundleV1(
  bundleDirectory: string = NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegPathBoundedFiniteIntervalAngleBoundsCandidateBuildV1> {
  const built = buildNegPathBoundedFiniteIntervalAngleBoundsCandidateBundleV1();
  const absoluteDirectory = resolve(bundleDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const expectedNames = new Set(built.files.map((file) => file.path));
  const existing = await readdir(absoluteDirectory, { withFileTypes: true });
  if (existing.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))) {
    throw new TypeError(
      'negative path bounded-finite-interval-angle-bounds candidate directory contains an unexpected entry',
    );
  }
  await Promise.all(
    built.files.map((file) => writeFile(resolve(absoluteDirectory, file.path), file.text, 'utf8')),
  );
  return built;
}

export const NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_REASON_CODES = [
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

export type NegPathBoundedFiniteIntervalAngleBoundsCandidateReasonCodeV1 =
  (typeof NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_REASON_CODES)[number];

type VerificationChecks = Readonly<{
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

export type NegPathBoundedFiniteIntervalAngleBoundsCandidateVerificationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-neg-path-bounded-finite-interval-angle-bounds-candidate-bundle-verification-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS-V1';
  scope: typeof NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_SCOPE;
  declaredBoundedInterpolationFiniteIntervalAngleBoundsParserOnly: true;
  declaredBoundedInterpolationFiniteAnglesParserOnly: false;
  declaredBoundedInterpolationFiniteKnotTimesParserOnly: false;
  declaredPathCandidateRepresentationVersionParserOnly: false;
  declaredPathCandidateRepresentationStatusParserOnly: false;
  declaredPathCandidateSupportedRepresentationKindParserOnly: false;
  declaredBoundedInterpolationUniqueAngleCreaseRowsParserOnly: false;
  declaredBoundedInterpolationUniqueIntervalBoundCreaseRowsParserOnly: false;
  declaredBoundedInterpolationAngleKnotCardinalityParserOnly: false;
  declaredBoundedInterpolationBoundKnotIntervalCardinalityParserOnly: false;
  declaredBoundedInterpolationAngleContainmentParserOnly: false;
  declaredBoundedInterpolationKnotTimeStrictMonotonicityParserOnly: false;
  globalM0fGate: 'not-evaluated';
  canonicalPromotionClaimed: false;
  canonicalPathMutationFamilyComplete: false;
  representationSelectionEstablished: false;
  pathTimeCoverageEstablished: false;
  motionMapCompletenessEstablished: false;
  creaseMapCompletenessEstablished: false;
  pathRepresentationCompletenessEstablished: false;
  piecewisePolynomialCardinalityIncluded: false;
  piecewisePolynomialSemanticsEstablished: false;
  piecewisePolynomialEndpointInferenceIncluded: false;

  physicalAngleScheduleEstablished: false;
  radianConventionEstablished: false;
  physicalAngleBoundsEstablished: false;
  conservativeAngleBoundsEstablished: false;
  kinematicFeasibilityEstablished: false;
  physicalPathContinuityEstablished: false;
  endpointContinuityEstablished: false;
  rigidityEstablished: false;
  faceIsometryEstablished: false;
  hingeGeometryEstablished: false;
  certificateHashVerificationIncluded: false;
  cryptographicAuthenticityEstablished: false;
  contactAnalysisIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionDetectionIncluded: false;
  collisionFreedomEstablished: false;
  foldabilityEstablished: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  scientificVerificationClaimed: false;
  reproducibleExactNegativeBundle: boolean;
  reasonCodes: readonly NegPathBoundedFiniteIntervalAngleBoundsCandidateReasonCodeV1[];
  checks: VerificationChecks;
}>;

interface MutableVerificationState {
  reasons: Set<NegPathBoundedFiniteIntervalAngleBoundsCandidateReasonCodeV1>;
  checks: { -readonly [Key in keyof VerificationChecks]: VerificationChecks[Key] };
}

function initialState(): MutableVerificationState {
  return {
    reasons: new Set(),
    checks: {
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
    },
  };
}

function resultFromState(
  state: MutableVerificationState,
): NegPathBoundedFiniteIntervalAngleBoundsCandidateVerificationResultV1 {
  const reasonCodes = NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_REASON_CODES.filter(
    (code) => state.reasons.has(code),
  );
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType:
      'm0f-neg-path-bounded-finite-interval-angle-bounds-candidate-bundle-verification-result' as const,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    vectorSetId: 'NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS-V1' as const,
    scope: NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_SCOPE,
    declaredBoundedInterpolationFiniteIntervalAngleBoundsParserOnly: true as const,
    declaredBoundedInterpolationFiniteAnglesParserOnly: false as const,
    declaredBoundedInterpolationFiniteKnotTimesParserOnly: false as const,
    declaredPathCandidateRepresentationVersionParserOnly: false as const,
    declaredPathCandidateRepresentationStatusParserOnly: false as const,
    declaredPathCandidateSupportedRepresentationKindParserOnly: false as const,
    declaredBoundedInterpolationUniqueAngleCreaseRowsParserOnly: false as const,
    declaredBoundedInterpolationUniqueIntervalBoundCreaseRowsParserOnly: false as const,
    declaredBoundedInterpolationAngleKnotCardinalityParserOnly: false as const,
    declaredBoundedInterpolationBoundKnotIntervalCardinalityParserOnly: false as const,
    declaredBoundedInterpolationAngleContainmentParserOnly: false as const,
    declaredBoundedInterpolationKnotTimeStrictMonotonicityParserOnly: false as const,
    globalM0fGate: 'not-evaluated' as const,
    canonicalPromotionClaimed: false as const,
    canonicalPathMutationFamilyComplete: false as const,
    representationSelectionEstablished: false as const,
    pathTimeCoverageEstablished: false as const,
    motionMapCompletenessEstablished: false as const,
    creaseMapCompletenessEstablished: false as const,
    pathRepresentationCompletenessEstablished: false as const,
    piecewisePolynomialCardinalityIncluded: false as const,
    piecewisePolynomialSemanticsEstablished: false as const,
    piecewisePolynomialEndpointInferenceIncluded: false as const,
    physicalAngleScheduleEstablished: false as const,
    radianConventionEstablished: false as const,
    physicalAngleBoundsEstablished: false as const,
    conservativeAngleBoundsEstablished: false as const,
    kinematicFeasibilityEstablished: false as const,
    physicalPathContinuityEstablished: false as const,
    endpointContinuityEstablished: false as const,
    rigidityEstablished: false as const,
    faceIsometryEstablished: false as const,
    hingeGeometryEstablished: false as const,
    certificateHashVerificationIncluded: false as const,
    cryptographicAuthenticityEstablished: false as const,
    contactAnalysisIncluded: false as const,
    continuousCollisionDetectionIncluded: false as const,
    collisionDetectionIncluded: false as const,

    collisionFreedomEstablished: false as const,
    foldabilityEstablished: false as const,
    supportProfileIncluded: false as const,
    toleranceProfileIncluded: false as const,
    scientificVerificationClaimed: false as const,
    reproducibleExactNegativeBundle: reasonCodes.length === 0,
    reasonCodes,
    checks: state.checks,
  });
}

function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

async function canonicalCaseIsAbsent(): Promise<boolean | undefined> {
  try {
    const parsed = parseFixtureManifest(
      JSON.parse(
        await readFile(
          resolve(NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANONICAL_MANIFEST_PATH),
          'utf8',
        ),
      ) as unknown,
    );
    if (parsed.manifest === undefined) return undefined;
    return !parsed.manifest.fixtures.some(
      (fixture) => fixture.id === NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_ID,
    );
  } catch {
    return undefined;
  }
}

export async function verifyNegPathBoundedFiniteIntervalAngleBoundsCandidateBundleV1(
  bundleDirectory: string = NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegPathBoundedFiniteIntervalAngleBoundsCandidateVerificationResultV1> {
  const state = initialState();
  try {
    const absoluteDirectory = resolve(bundleDirectory);
    let ledgerText: string;
    let ledgerDocument: unknown;
    try {
      ledgerText = await readFile(
        resolve(
          absoluteDirectory,
          NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_LEDGER_FILENAME,
        ),
        'utf8',
      );
      ledgerDocument = JSON.parse(ledgerText) as unknown;
    } catch {
      state.reasons.add('ledger-unreadable');
      return resultFromState(state);
    }
    const parsedLedger =
      parseNegPathBoundedFiniteIntervalAngleBoundsCandidateBundleLedgerV1(ledgerDocument);
    if (!parsedLedger.ok) {
      state.reasons.add('ledger-invalid');
      return resultFromState(state);
    }
    state.checks.ledgerPresentAndValid = true;
    state.checks.allArtifactProvenanceFixed = true;

    const expectedNames = new Set([
      NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_LEDGER_FILENAME,
      ...parsedLedger.value.artifacts.map((artifact) => artifact.path),
    ]);
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    if (
      entries.length !== expectedNames.size ||
      entries.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))
    ) {
      state.reasons.add('artifact-set-mismatch');
      return resultFromState(state);
    }
    state.checks.artifactSetExact = true;

    const textByArtifactId = new Map<string, string>();
    const textByPath = new Map<string, string>([
      [NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CANDIDATE_BUNDLE_LEDGER_FILENAME, ledgerText],
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
    state.checks.allArtifactHashesMatch = true;

    const canonicalAbsent = await canonicalCaseIsAbsent();
    if (canonicalAbsent === undefined) state.reasons.add('canonical-manifest-unreadable');
    else if (!canonicalAbsent) state.reasons.add('canonical-manifest-registration-present');
    else state.checks.canonicalManifestRegistrationAbsent = true;

    const control = parseJsonText(textByArtifactId.get(CONTROL_ARTIFACT_ID) ?? '');
    if (control === undefined) {
      state.reasons.add('control-invalid-json');
    } else {
      state.checks.controlArtifactCount = 1;
      state.checks.everyControlArtifactParsed = true;
      if (parseArtifactContractV1(control).ok) state.checks.everySavedControlAccepted = true;
      else state.reasons.add('control-unexpectedly-rejected');
    }

    const source = parseJsonText(textByArtifactId.get(SOURCE_ARTIFACT_ID) ?? '');
    if (source === undefined) {
      state.reasons.add('source-invalid-json');
    } else {
      state.checks.sourceCaseCount = 1;
      state.checks.everySourceParsed = true;
      if (
        control !== undefined &&
        sameStableJson(
          boundedFiniteIntervalAngleBoundsJsonDifferencePaths(control, source),
          NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.changedPaths,
        )
      ) {
        state.checks.everySourceControlDifferenceMatched = true;
      } else {
        state.reasons.add('source-control-difference-mismatch');
      }
      const replay = parseArtifactContractV1(source);
      if (replay.ok) {
        state.reasons.add('source-unexpectedly-accepted');
      } else {
        state.checks.everySourceRejected = true;
        if (
          sameStableJson(
            issueSignature(replay.error),
            NEG_PATH_BOUNDED_FINITE_INTERVAL_ANGLE_BOUNDS_CASE_SPEC_V1.expectedIssues,
          )
        ) {
          state.checks.everyOrderedIssueSignatureMatched = true;
        } else {
          state.reasons.add('parser-issue-mismatch');
        }
      }
    }
    const regenerated = buildNegPathBoundedFiniteIntervalAngleBoundsCandidateBundleV1();
    if (regenerated.files.every((file) => textByPath.get(file.path) === file.text)) {
      state.checks.deterministicRegenerationMatched = true;
    } else {
      state.reasons.add('deterministic-regeneration-mismatch');
    }
    return resultFromState(state);
  } catch {
    state.reasons.add('unexpected-failure');
    return resultFromState(state);
  }
}
