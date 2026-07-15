import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { parseArtifactContractV1, type ArtifactContractIssue } from './artifacts/contract.js';
import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import {
  NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1,
  type NegPathPolynomialCoefficientDegreeSourceDocumentV1,
} from './neg-path-polynomial-coefficient-degree-candidate-bundle.js';
import { parseFixtureManifest, sha256Prefixed } from './manifest.js';
import { stableStringify } from './stable-json.js';

export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/neg-path-polynomial-degree-range-candidate-bundle-ledger-v1.schema.json' as const;
export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_RECORD_TYPE =
  'm0f-neg-path-polynomial-degree-range-candidate-bundle-ledger' as const;
export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_SCOPE =
  'project-authored-exact-negative-artifact-contract-piecewise-polynomial-zero-degree-rejection-parser-replay-only' as const;
export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_GENERATOR_ID =
  'oridesign-neg-path-polynomial-degree-range-candidate-bundle' as const;
export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_GENERATOR_VERSION =
  '1.0.0-candidate' as const;
export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY =
  'tests/candidate-vectors/NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE' as const;
export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_LEDGER_FILENAME =
  'candidate-bundle-ledger.json' as const;
export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANONICAL_MANIFEST_PATH =
  'tests/fixtures/manifest.json' as const;
export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_ID =
  'NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE' as const;

const SOURCE_REFERENCE_ID = 'oridesign-neg-path-polynomial-degree-range-candidate-v1' as const;
const CONTROL_ARTIFACT_ID = 'control-design' as const;
const SOURCE_ARTIFACT_ID = 'source-path-polynomial-degree-out-of-range' as const;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

export type NegPathPolynomialDegreeRangeSourceDocumentV1 =
  NegPathPolynomialCoefficientDegreeSourceDocumentV1;

type PolynomialDegreeRangePathSegmentV1 =
  NegPathPolynomialDegreeRangeSourceDocumentV1['pathCandidate']['segments'][number];

function isFixedDegreeOnePolynomialSegment(
  segment: PolynomialDegreeRangePathSegmentV1 | undefined,
  t0: number,
  t1: number,
): segment is PolynomialDegreeRangePathSegmentV1 {
  if (
    segment?.t0 !== t0 ||
    segment.t1 !== t1 ||
    segment.motion.kind !== 'piecewise-polynomial' ||
    segment.motion.degree !== 1 ||
    segment.motion.coefficientsByCrease.length !== 1 ||
    segment.motion.derivativeBoundsByCrease.length !== 1
  ) {
    return false;
  }
  const coefficientEntry = segment.motion.coefficientsByCrease[0];
  const coefficientRow = coefficientEntry?.coefficients[0];
  const derivativeEntry = segment.motion.derivativeBoundsByCrease[0];
  return (
    coefficientEntry?.edgeId === 'e-hinge' &&
    coefficientEntry.coefficients.length === 1 &&
    coefficientRow?.length === 2 &&
    coefficientRow[0] === 0 &&
    coefficientRow[1] === Math.PI &&
    derivativeEntry?.edgeId === 'e-hinge' &&
    derivativeEntry.bounds[0] === 0 &&
    derivativeEntry.bounds[1] === Math.PI
  );
}

function twoSegmentPolynomialControl(): NegPathPolynomialDegreeRangeSourceDocumentV1 {
  const control = structuredClone(NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1);
  const original = control.pathCandidate.segments[0];
  if (
    control.pathCandidate.segments.length !== 1 ||
    !isFixedDegreeOnePolynomialSegment(original, 0, 1)
  ) {
    throw new TypeError('fixed source control must contain a degree-one polynomial segment');
  }
  const first = structuredClone(original);
  const second = structuredClone(original);
  first.t0 = 0;
  first.t1 = 0.5;
  second.t0 = 0.5;
  second.t1 = 1;
  control.pathCandidate.segments = [first, second];
  if (
    control.pathCandidate.segments.length !== 2 ||
    !isFixedDegreeOnePolynomialSegment(control.pathCandidate.segments[0], 0, 0.5) ||
    !isFixedDegreeOnePolynomialSegment(control.pathCandidate.segments[1], 0.5, 1)
  ) {
    throw new TypeError('fixed two-segment polynomial control anchor drifted');
  }
  if (!parseArtifactContractV1(control).ok) {
    throw new TypeError('fixed time-contiguous two-segment polynomial control must be accepted');
  }
  return control;
}

export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1 = deepFreezeOwned(
  twoSegmentPolynomialControl(),
);

function polynomialDegreeRangeSource(): NegPathPolynomialDegreeRangeSourceDocumentV1 {
  const source = structuredClone(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1);
  const firstSegment = source.pathCandidate.segments[0];
  if (firstSegment?.motion.kind !== 'piecewise-polynomial' || firstSegment.motion.degree !== 1) {
    throw new TypeError('fixed first segment must use a degree-one piecewise polynomial');
  }
  const secondSegment = source.pathCandidate.segments[1];
  if (secondSegment?.motion.kind !== 'piecewise-polynomial' || secondSegment.motion.degree !== 1) {
    throw new TypeError('fixed second segment must use the same degree-one polynomial motion');
  }
  const firstCoefficientEntry = firstSegment.motion.coefficientsByCrease[0];
  const firstCoefficientRow = firstCoefficientEntry?.coefficients[0];
  if (
    firstCoefficientEntry?.edgeId !== 'e-hinge' ||
    firstCoefficientRow?.length !== 2 ||
    firstCoefficientRow[0] !== 0 ||
    firstCoefficientRow[1] !== Math.PI
  ) {
    throw new TypeError('fixed coefficient row must remain e-hinge [0, pi]');
  }
  const firstDerivativeBounds = firstSegment.motion.derivativeBoundsByCrease[0];
  if (
    firstDerivativeBounds?.edgeId !== 'e-hinge' ||
    firstDerivativeBounds.bounds[0] !== 0 ||
    firstDerivativeBounds.bounds[1] !== Math.PI
  ) {
    throw new TypeError('fixed derivative bounds must remain e-hinge [0, pi]');
  }
  if (
    secondSegment.motion.coefficientsByCrease[0]?.coefficients[0]?.[1] !== Math.PI ||
    secondSegment.motion.derivativeBoundsByCrease[0]?.bounds[1] !== Math.PI
  ) {
    throw new TypeError('fixed second polynomial motion drifted');
  }
  firstSegment.motion.degree = 0;
  return source;
}

type ExpectedIssueV1 = Readonly<{ path: string; code: string }>;

export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1 = deepFreezeOwned({
  caseId: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_ID,
  controlArtifactId: CONTROL_ARTIFACT_ID,
  mutationKind: 'replace-first-polynomial-segment-degree-with-zero',
  changedPaths: ['$.pathCandidate.segments[0].motion.degree'],
  sourceArtifactId: SOURCE_ARTIFACT_ID,
  sourcePath: 'path-polynomial-degree-out-of-range.json',
  sourceDocument: polynomialDegreeRangeSource(),
  expectedIssues: [
    {
      path: '$.pathCandidate.segments[0].motion.degree',
      code: 'out-of-range',
    },
  ],
} as const);

export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_README_V1 = `# NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE exact-negative candidate vector

This closed directory contains one saved project-authored time-contiguous two-segment piecewise-polynomial design control and one exact-negative mutation for the current \`parseArtifactContractV1\` zero-degree rejection check. Both accepted segments clone the same valid degree-one \`e-hinge\` motion and cover \`[0,0.5]\` and \`[0.5,1]\`. The mutation changes only segment 0 degree from \`1\` to \`0\`. It produces exactly the sole \`out-of-range\` issue and no coefficient-degree, coverage, motion-map, or other path secondary issue.

The bundle is intentionally outside \`tests/fixtures/manifest.json\`; \`NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE\` is not canonically registered or promoted. Exact-negative means only that the current artifact-contract parser rejects these saved bytes with the complete ordered issue signature fixed in the ledger.

This replay establishes only rejection of the saved zero-degree lower-bound example. The parser uses a combined positive-safe-integer predicate, but this one vector does not establish fractional-degree rejection, unsafe-integer or upper-domain coverage, the general degree domain, or coefficient-row/degree cardinality. It does not establish path-time or physical continuity, select a representation, freeze a polynomial basis, establish coefficient ordering or semantics, associate coefficients with time intervals, establish derivative semantics or validation, infer polynomial endpoints, prove motion-map or crease-map completeness, rigidity, face isometry, hinge geometry, contact analysis, CCD, collision detection or freedom, foldability, certificate-hash verification, cryptographic authenticity, canonical path-mutation-family completeness, SupportProfile, ToleranceProfile, scientific verification, or M0F GO. Local SHA-256 rows detect saved-byte drift only and are not signatures.

Verify with \`npx tsx m0f/neg-path-polynomial-degree-range-candidate-bundle-cli.ts --verify\`. Regenerate with \`npx tsx m0f/neg-path-polynomial-degree-range-candidate-bundle-cli.ts --write\`.
`;

export type NegPathPolynomialDegreeRangeArtifactProvenanceV1 = Readonly<{
  sourceReferenceId: typeof SOURCE_REFERENCE_ID;
  sourceUse: 'project-authored';
  derivation: 'authored' | 'mutated-from-control';
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[];
}>;

export type NegPathPolynomialDegreeRangeArtifactLedgerEntryV1 = Readonly<{
  artifactId: string;
  role: 'readme' | 'accepted-control' | 'negative-source';
  path: string;
  mediaType: 'text/markdown; charset=utf-8' | 'application/json';
  sha256: `sha256:${string}`;
  licenseSpdx: 'MIT';
  provenance: NegPathPolynomialDegreeRangeArtifactProvenanceV1;
}>;

function artifactProvenance(
  dependsOnArtifactIds: readonly (typeof CONTROL_ARTIFACT_ID)[],
): NegPathPolynomialDegreeRangeArtifactProvenanceV1 {
  return {
    sourceReferenceId: SOURCE_REFERENCE_ID,
    sourceUse: 'project-authored',
    derivation: dependsOnArtifactIds.length === 0 ? 'authored' : 'mutated-from-control',
    dependsOnArtifactIds,
  };
}

type ArtifactSpecV1 = Omit<NegPathPolynomialDegreeRangeArtifactLedgerEntryV1, 'sha256'>;

export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_ARTIFACT_SPECS_V1 = deepFreezeOwned([
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
    path: 'control-design.json',
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([]),
  },
  {
    artifactId: SOURCE_ARTIFACT_ID,
    role: 'negative-source',
    path: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.sourcePath,
    mediaType: 'application/json',
    licenseSpdx: 'MIT',
    provenance: artifactProvenance([CONTROL_ARTIFACT_ID]),
  },
] as const satisfies readonly ArtifactSpecV1[]);

export type NegPathPolynomialDegreeRangeCaseLedgerRowV1 = Readonly<{
  caseIndex: 0;
  caseId: typeof NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_ID;
  controlArtifactId: typeof CONTROL_ARTIFACT_ID;
  mutationKind: typeof NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.mutationKind;
  changedPaths: readonly ['$.pathCandidate.segments[0].motion.degree'];
  sourceArtifactId: typeof SOURCE_ARTIFACT_ID;
  sourcePath: 'path-polynomial-degree-out-of-range.json';
  expectedOutcome: 'rejected';
  expectedIssues: readonly ExpectedIssueV1[];
}>;

const GENERATOR = deepFreezeOwned({
  generatorId: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_GENERATOR_ID,
  generatorVersion: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_GENERATOR_VERSION,
  serialization: 'stable-json-utf8-lf-v1' as const,
  detector: 'parseArtifactContractV1' as const,
  detectorSourcePath: 'm0f/artifacts/contract.ts' as const,
});

const SOURCE_PROVENANCE = deepFreezeOwned({
  sourceReferenceId: SOURCE_REFERENCE_ID,
  sourceKind: 'project-authored' as const,
  title:
    'NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE project-authored piecewise-polynomial zero-degree rejection parser vector',
  authors: ['OriDesign contributors'],
  redistribution: 'allowed' as const,
  licenseSpdx: 'MIT' as const,
});

function ledgerCases(): readonly NegPathPolynomialDegreeRangeCaseLedgerRowV1[] {
  return [
    {
      caseIndex: 0,
      caseId: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_ID,
      controlArtifactId: CONTROL_ARTIFACT_ID,
      mutationKind: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.mutationKind,
      changedPaths: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.changedPaths,
      sourceArtifactId: SOURCE_ARTIFACT_ID,
      sourcePath: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.sourcePath,
      expectedOutcome: 'rejected',
      expectedIssues: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.expectedIssues,
    },
  ];
}

export type NegPathPolynomialDegreeRangeCandidateBundleLedgerV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_SCHEMA_ID;
  recordType: typeof NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE-V1';
  scope: typeof NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_SCOPE;
  declaredPiecewisePolynomialZeroDegreeRejectionParserOnly: true;
  fractionalDegreeRejectionVectorIncluded: false;
  unsafeIntegerDegreeRejectionVectorIncluded: false;
  generalPositiveSafeIntegerDegreeDomainEstablished: false;
  declaredPiecewisePolynomialCoefficientDegreeCardinalityParserOnly: false;
  pathTimeCoverageEstablished: false;
  canonicalManifestPath: typeof NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANONICAL_MANIFEST_PATH;
  canonicalManifestRegistration: 'not-registered';
  canonicalPromotionClaimed: false;
  canonicalPathMutationFamilyComplete: false;
  representationSelectionEstablished: false;
  piecewisePolynomialBasisFrozen: false;
  polynomialCoefficientOrderingEstablished: false;
  polynomialCoefficientSemanticsEstablished: false;
  polynomialCoefficientIntervalAssociationEstablished: false;
  polynomialDerivativeSemanticsEstablished: false;
  polynomialDerivativeValidationIncluded: false;
  piecewisePolynomialEndpointInferenceIncluded: false;
  pathRepresentationCompletenessEstablished: false;
  creaseMapCompletenessEstablished: false;
  motionMapCompletenessEstablished: false;
  physicalAngleScheduleEstablished: false;
  radianConventionEstablished: false;
  physicalAngleBoundsEstablished: false;
  conservativeDerivativeBoundsEstablished: false;
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
  cases: readonly NegPathPolynomialDegreeRangeCaseLedgerRowV1[];
  artifacts: readonly NegPathPolynomialDegreeRangeArtifactLedgerEntryV1[];
}>;

export type NegPathPolynomialDegreeRangeCandidateLedgerIssueV1 = Readonly<{
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

export type NegPathPolynomialDegreeRangeCandidateLedgerParseResultV1 =
  | Readonly<{ ok: true; value: NegPathPolynomialDegreeRangeCandidateBundleLedgerV1 }>
  | Readonly<{
      ok: false;
      error: readonly NegPathPolynomialDegreeRangeCandidateLedgerIssueV1[];
    }>;

const ROOT_KEYS = [
  'schemaVersion',
  'schemaId',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'vectorSetId',
  'scope',
  'declaredPiecewisePolynomialZeroDegreeRejectionParserOnly',
  'fractionalDegreeRejectionVectorIncluded',
  'unsafeIntegerDegreeRejectionVectorIncluded',
  'generalPositiveSafeIntegerDegreeDomainEstablished',
  'declaredPiecewisePolynomialCoefficientDegreeCardinalityParserOnly',
  'pathTimeCoverageEstablished',
  'canonicalManifestPath',
  'canonicalManifestRegistration',
  'canonicalPromotionClaimed',
  'canonicalPathMutationFamilyComplete',
  'representationSelectionEstablished',
  'piecewisePolynomialBasisFrozen',
  'polynomialCoefficientOrderingEstablished',
  'polynomialCoefficientSemanticsEstablished',
  'polynomialCoefficientIntervalAssociationEstablished',
  'polynomialDerivativeSemanticsEstablished',
  'polynomialDerivativeValidationIncluded',
  'piecewisePolynomialEndpointInferenceIncluded',
  'pathRepresentationCompletenessEstablished',
  'creaseMapCompletenessEstablished',
  'motionMapCompletenessEstablished',
  'physicalAngleScheduleEstablished',
  'radianConventionEstablished',
  'physicalAngleBoundsEstablished',
  'conservativeDerivativeBoundsEstablished',
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
  ['schemaId', NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_SCHEMA_ID],
  ['recordType', NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_RECORD_TYPE],
  ['contractStatus', 'candidate'],
  ['scientificClaim', false],
  ['vectorSetId', 'NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE-V1'],
  ['scope', NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_SCOPE],
  ['declaredPiecewisePolynomialZeroDegreeRejectionParserOnly', true],
  ['fractionalDegreeRejectionVectorIncluded', false],
  ['unsafeIntegerDegreeRejectionVectorIncluded', false],
  ['generalPositiveSafeIntegerDegreeDomainEstablished', false],
  ['declaredPiecewisePolynomialCoefficientDegreeCardinalityParserOnly', false],
  ['pathTimeCoverageEstablished', false],
  ['canonicalManifestPath', NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANONICAL_MANIFEST_PATH],
  ['canonicalManifestRegistration', 'not-registered'],
  ['canonicalPromotionClaimed', false],
  ['canonicalPathMutationFamilyComplete', false],
  ['representationSelectionEstablished', false],
  ['piecewisePolynomialBasisFrozen', false],
  ['polynomialCoefficientOrderingEstablished', false],
  ['polynomialCoefficientSemanticsEstablished', false],
  ['polynomialCoefficientIntervalAssociationEstablished', false],
  ['polynomialDerivativeSemanticsEstablished', false],
  ['polynomialDerivativeValidationIncluded', false],
  ['piecewisePolynomialEndpointInferenceIncluded', false],
  ['pathRepresentationCompletenessEstablished', false],
  ['creaseMapCompletenessEstablished', false],
  ['motionMapCompletenessEstablished', false],
  ['physicalAngleScheduleEstablished', false],
  ['radianConventionEstablished', false],
  ['physicalAngleBoundsEstablished', false],
  ['conservativeDerivativeBoundsEstablished', false],
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
  issues: NegPathPolynomialDegreeRangeCandidateLedgerIssueV1[],
  path: string,
  code: NegPathPolynomialDegreeRangeCandidateLedgerIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: NegPathPolynomialDegreeRangeCandidateLedgerIssueV1[],
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

export function parseNegPathPolynomialDegreeRangeCandidateBundleLedgerV1(
  supplied: unknown,
): NegPathPolynomialDegreeRangeCandidateLedgerParseResultV1 {
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
  const issues: NegPathPolynomialDegreeRangeCandidateLedgerIssueV1[] = [];
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
      'case identity, control link, degree delta, path, or complete issue oracle differs',
    );
  }
  if (!Array.isArray(value.artifacts) || value.artifacts.length !== 3) {
    addLedgerIssue(issues, '$.artifacts', 'invalid-array', 'must contain three ordered artifacts');
  } else {
    for (const [index, expected] of NEG_PATH_POLYNOMIAL_DEGREE_RANGE_ARTIFACT_SPECS_V1.entries()) {
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
    value: value as unknown as NegPathPolynomialDegreeRangeCandidateBundleLedgerV1,
  });
}

function issueSignature(issues: readonly ArtifactContractIssue[]): readonly ExpectedIssueV1[] {
  return issues.map(({ path, code }) => ({ path, code }));
}

export function polynomialDegreeRangeJsonDifferencePaths(
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
          ...polynomialDegreeRangeJsonDifferencePaths(left[index], right[index], childPath),
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
          ...polynomialDegreeRangeJsonDifferencePaths(left[key], right[key], childPath),
        );
    }
    return differences;
  }
  return [path];
}

function jsonLine(value: unknown): string {
  return `${stableStringify(value)}\n`;
}

export type NegPathPolynomialDegreeRangeCandidateBuiltFileV1 = Readonly<{
  artifactId: string | null;
  path: string;
  text: string;
}>;

export type NegPathPolynomialDegreeRangeCandidateBuildV1 = Readonly<{
  ledger: NegPathPolynomialDegreeRangeCandidateBundleLedgerV1;
  files: readonly NegPathPolynomialDegreeRangeCandidateBuiltFileV1[];
}>;

export function buildNegPathPolynomialDegreeRangeCandidateBundleV1(): NegPathPolynomialDegreeRangeCandidateBuildV1 {
  if (!parseArtifactContractV1(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1).ok) {
    throw new TypeError('accepted polynomial degree-range control no longer parses');
  }
  const differences = polynomialDegreeRangeJsonDifferencePaths(
    NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1,
    NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.sourceDocument,
  );
  if (!sameStableJson(differences, NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.changedPaths)) {
    throw new TypeError('polynomial zero-degree control delta changed');
  }
  const replay = parseArtifactContractV1(
    NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.sourceDocument,
  );
  if (
    replay.ok ||
    !sameStableJson(
      issueSignature(replay.error),
      NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.expectedIssues,
    )
  ) {
    throw new TypeError('polynomial zero-degree parser oracle changed');
  }
  const textByArtifactId = new Map<string, string>([
    ['bundle-readme', NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_README_V1],
    [CONTROL_ARTIFACT_ID, jsonLine(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_DESIGN_CONTROL_SOURCE_V1)],
    [SOURCE_ARTIFACT_ID, jsonLine(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.sourceDocument)],
  ]);
  const artifacts = NEG_PATH_POLYNOMIAL_DEGREE_RANGE_ARTIFACT_SPECS_V1.map((spec) => {
    const text = textByArtifactId.get(spec.artifactId);
    if (text === undefined)
      throw new TypeError(`missing polynomial degree-range artifact ${spec.artifactId}`);
    return { ...spec, sha256: sha256Prefixed(text) as `sha256:${string}` };
  });
  const ledger: NegPathPolynomialDegreeRangeCandidateBundleLedgerV1 = {
    schemaVersion: 1,
    schemaId: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_SCHEMA_ID,
    recordType: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    vectorSetId: 'NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE-V1',
    scope: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_SCOPE,
    declaredPiecewisePolynomialZeroDegreeRejectionParserOnly: true,
    fractionalDegreeRejectionVectorIncluded: false,
    unsafeIntegerDegreeRejectionVectorIncluded: false,
    generalPositiveSafeIntegerDegreeDomainEstablished: false,
    declaredPiecewisePolynomialCoefficientDegreeCardinalityParserOnly: false,
    pathTimeCoverageEstablished: false,
    canonicalManifestPath: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANONICAL_MANIFEST_PATH,
    canonicalManifestRegistration: 'not-registered',
    canonicalPromotionClaimed: false,
    canonicalPathMutationFamilyComplete: false,
    representationSelectionEstablished: false,
    piecewisePolynomialBasisFrozen: false,
    polynomialCoefficientOrderingEstablished: false,
    polynomialCoefficientSemanticsEstablished: false,
    polynomialCoefficientIntervalAssociationEstablished: false,
    polynomialDerivativeSemanticsEstablished: false,
    polynomialDerivativeValidationIncluded: false,
    piecewisePolynomialEndpointInferenceIncluded: false,
    pathRepresentationCompletenessEstablished: false,
    creaseMapCompletenessEstablished: false,
    motionMapCompletenessEstablished: false,
    physicalAngleScheduleEstablished: false,
    radianConventionEstablished: false,
    physicalAngleBoundsEstablished: false,
    conservativeDerivativeBoundsEstablished: false,
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
  const files: NegPathPolynomialDegreeRangeCandidateBuiltFileV1[] = artifacts.map((artifact) => {
    const text = textByArtifactId.get(artifact.artifactId);
    if (text === undefined)
      throw new TypeError(`missing polynomial degree-range artifact ${artifact.artifactId}`);
    return { artifactId: artifact.artifactId, path: artifact.path, text };
  });
  files.push({
    artifactId: null,
    path: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
    text: jsonLine(ledger),
  });
  return deepFreezeOwned({ ledger, files });
}

export async function writeNegPathPolynomialDegreeRangeCandidateBundleV1(
  bundleDirectory: string = NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegPathPolynomialDegreeRangeCandidateBuildV1> {
  const built = buildNegPathPolynomialDegreeRangeCandidateBundleV1();
  const absoluteDirectory = resolve(bundleDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const expectedNames = new Set(built.files.map((file) => file.path));
  const existing = await readdir(absoluteDirectory, { withFileTypes: true });
  if (existing.some((entry) => !entry.isFile() || !expectedNames.has(entry.name))) {
    throw new TypeError(
      'negative path polynomial degree-range candidate directory contains an unexpected entry',
    );
  }
  await Promise.all(
    built.files.map((file) => writeFile(resolve(absoluteDirectory, file.path), file.text, 'utf8')),
  );
  return built;
}

export const NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_REASON_CODES = [
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

export type NegPathPolynomialDegreeRangeCandidateReasonCodeV1 =
  (typeof NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_REASON_CODES)[number];

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

export type NegPathPolynomialDegreeRangeCandidateVerificationResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-neg-path-polynomial-degree-range-candidate-bundle-verification-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  vectorSetId: 'NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE-V1';
  scope: typeof NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_SCOPE;
  declaredPiecewisePolynomialZeroDegreeRejectionParserOnly: true;
  fractionalDegreeRejectionVectorIncluded: false;
  unsafeIntegerDegreeRejectionVectorIncluded: false;
  generalPositiveSafeIntegerDegreeDomainEstablished: false;
  declaredPiecewisePolynomialCoefficientDegreeCardinalityParserOnly: false;
  pathTimeCoverageEstablished: false;
  globalM0fGate: 'not-evaluated';
  canonicalPromotionClaimed: false;
  canonicalPathMutationFamilyComplete: false;
  representationSelectionEstablished: false;
  piecewisePolynomialBasisFrozen: false;
  polynomialCoefficientOrderingEstablished: false;
  polynomialCoefficientSemanticsEstablished: false;
  polynomialCoefficientIntervalAssociationEstablished: false;
  polynomialDerivativeSemanticsEstablished: false;
  polynomialDerivativeValidationIncluded: false;
  piecewisePolynomialEndpointInferenceIncluded: false;
  pathRepresentationCompletenessEstablished: false;
  creaseMapCompletenessEstablished: false;
  motionMapCompletenessEstablished: false;
  physicalAngleScheduleEstablished: false;
  radianConventionEstablished: false;
  physicalAngleBoundsEstablished: false;
  conservativeDerivativeBoundsEstablished: false;
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
  reasonCodes: readonly NegPathPolynomialDegreeRangeCandidateReasonCodeV1[];
  checks: VerificationChecks;
}>;

interface MutableVerificationState {
  reasons: Set<NegPathPolynomialDegreeRangeCandidateReasonCodeV1>;
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
): NegPathPolynomialDegreeRangeCandidateVerificationResultV1 {
  const reasonCodes = NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_REASON_CODES.filter((code) =>
    state.reasons.has(code),
  );
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType:
      'm0f-neg-path-polynomial-degree-range-candidate-bundle-verification-result' as const,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    vectorSetId: 'NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE-V1' as const,
    scope: NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_SCOPE,
    declaredPiecewisePolynomialZeroDegreeRejectionParserOnly: true as const,
    fractionalDegreeRejectionVectorIncluded: false as const,
    unsafeIntegerDegreeRejectionVectorIncluded: false as const,
    generalPositiveSafeIntegerDegreeDomainEstablished: false as const,
    declaredPiecewisePolynomialCoefficientDegreeCardinalityParserOnly: false as const,
    pathTimeCoverageEstablished: false as const,
    globalM0fGate: 'not-evaluated' as const,
    canonicalPromotionClaimed: false as const,
    canonicalPathMutationFamilyComplete: false as const,
    representationSelectionEstablished: false as const,
    piecewisePolynomialBasisFrozen: false as const,
    polynomialCoefficientOrderingEstablished: false as const,
    polynomialCoefficientSemanticsEstablished: false as const,
    polynomialCoefficientIntervalAssociationEstablished: false as const,
    polynomialDerivativeSemanticsEstablished: false as const,
    polynomialDerivativeValidationIncluded: false as const,
    piecewisePolynomialEndpointInferenceIncluded: false as const,
    pathRepresentationCompletenessEstablished: false as const,
    creaseMapCompletenessEstablished: false as const,
    motionMapCompletenessEstablished: false as const,
    physicalAngleScheduleEstablished: false as const,
    radianConventionEstablished: false as const,
    physicalAngleBoundsEstablished: false as const,
    conservativeDerivativeBoundsEstablished: false as const,
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
        await readFile(resolve(NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANONICAL_MANIFEST_PATH), 'utf8'),
      ) as unknown,
    );
    if (parsed.manifest === undefined) return undefined;
    return !parsed.manifest.fixtures.some(
      (fixture) => fixture.id === NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_ID,
    );
  } catch {
    return undefined;
  }
}

export async function verifyNegPathPolynomialDegreeRangeCandidateBundleV1(
  bundleDirectory: string = NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_DEFAULT_DIRECTORY,
): Promise<NegPathPolynomialDegreeRangeCandidateVerificationResultV1> {
  const state = initialState();
  try {
    const absoluteDirectory = resolve(bundleDirectory);
    let ledgerText: string;
    let ledgerDocument: unknown;
    try {
      ledgerText = await readFile(
        resolve(
          absoluteDirectory,
          NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
        ),
        'utf8',
      );
      ledgerDocument = JSON.parse(ledgerText) as unknown;
    } catch {
      state.reasons.add('ledger-unreadable');
      return resultFromState(state);
    }
    const parsedLedger = parseNegPathPolynomialDegreeRangeCandidateBundleLedgerV1(ledgerDocument);
    if (!parsedLedger.ok) {
      state.reasons.add('ledger-invalid');
      return resultFromState(state);
    }
    state.checks.ledgerPresentAndValid = true;
    state.checks.allArtifactProvenanceFixed = true;

    const expectedNames = new Set([
      NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_LEDGER_FILENAME,
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
      [NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CANDIDATE_BUNDLE_LEDGER_FILENAME, ledgerText],
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
          polynomialDegreeRangeJsonDifferencePaths(control, source),
          NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.changedPaths,
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
            NEG_PATH_POLYNOMIAL_DEGREE_RANGE_CASE_SPEC_V1.expectedIssues,
          )
        ) {
          state.checks.everyOrderedIssueSignatureMatched = true;
        } else {
          state.reasons.add('parser-issue-mismatch');
        }
      }
    }
    const regenerated = buildNegPathPolynomialDegreeRangeCandidateBundleV1();
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
