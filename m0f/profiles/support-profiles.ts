import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';

export const SUPPORT_PROFILE_CANDIDATES_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/support-profile-candidates-v1.schema.json' as const;

export const SUPPORT_PROFILE_CANDIDATE_CATALOG_ID =
  'oridesign-support-profile-v1-candidates' as const;

export const SUPPORT_CONSTRAINT_SCHEMA_IDS = {
  treeMethod:
    'https://oridesign.local/schemas/m0f/support-profile-tree-method-constraints-v1' as const,
  boxPleating:
    'https://oridesign.local/schemas/m0f/support-profile-box-pleating-constraints-v1' as const,
  foldVerification:
    'https://oridesign.local/schemas/m0f/support-profile-fold-verification-constraints-v1' as const,
} as const;

export type NumericCandidateSelection = Readonly<{
  candidates: readonly number[];
  selected: null;
}>;

export type PolicyCandidateSelection<TPolicy extends string> = Readonly<{
  candidates: readonly TPolicy[];
  selected: null;
}>;

export type PendingSupportEvidence = Readonly<{
  status: 'pending';
  ref: null;
}>;

export type TreeMethodCandidateConstraints = Readonly<{
  leafCountMinimum: NumericCandidateSelection;
  leafCountMaximum: NumericCandidateSelection;
  maxTreeDegree: NumericCandidateSelection;
  maxTreeEdges: NumericCandidateSelection;
  degreeSequencePolicy: PolicyCandidateSelection<'bounded-explicit-sequence'>;
  cyclicOrderPolicy: PolicyCandidateSelection<'required-explicit'>;
  maxInputDecimalDigits: NumericCandidateSelection;
  minNormalizedBranchLength: NumericCandidateSelection;
  maxNormalizedLengthRatio: NumericCandidateSelection;
  maxWidthToLengthRatio: NumericCandidateSelection;
  branchWidthAccommodationPolicy: PolicyCandidateSelection<'all-branches-including-internal'>;
  maxPaperAspectRatio: NumericCandidateSelection;
  minNormalizedPaperFeature: NumericCandidateSelection;
  minNormalizedBoundaryMargin: NumericCandidateSelection;
  packingCondition: PolicyCandidateSelection<
    'strict-circle-river-clearance' | 'certified-tangency'
  >;
  moleculeFamily: PolicyCandidateSelection<
    'finite-certified-gadget-library' | 'universal-molecule-subset'
  >;
  minNormalizedSingularityDistance: NumericCandidateSelection;
  pathCompositionPolicy: PolicyCandidateSelection<
    'constructive-gadget-schedule' | 'certified-continuation'
  >;
  maxPathDegreesOfFreedom: NumericCandidateSelection;
  maxClosedLoopConditionNumber: NumericCandidateSelection;
  layerPatternPolicy: PolicyCandidateSelection<'finite-certified-pattern-library'>;
  terminationModel: PolicyCandidateSelection<'finite-enumeration' | 'total-constructive'>;
}>;

export type BoxPleatingCandidateConstraints = Readonly<{
  leafCountMinimum: NumericCandidateSelection;
  leafCountMaximum: NumericCandidateSelection;
  maxTreeDegree: NumericCandidateSelection;
  maxTreeEdges: NumericCandidateSelection;
  degreeSequencePolicy: PolicyCandidateSelection<'bounded-explicit-sequence'>;
  cyclicOrderPolicy: PolicyCandidateSelection<'required-explicit'>;
  maxInputDecimalDigits: NumericCandidateSelection;
  minNormalizedBranchLength: NumericCandidateSelection;
  maxNormalizedLengthRatio: NumericCandidateSelection;
  maxWidthToLengthRatio: NumericCandidateSelection;
  branchWidthAccommodationPolicy: PolicyCandidateSelection<'all-branches-including-internal'>;
  maxPaperAspectRatio: NumericCandidateSelection;
  minNormalizedPaperFeature: NumericCandidateSelection;
  minNormalizedBoundaryMargin: NumericCandidateSelection;
  maxGridColumns: NumericCandidateSelection;
  maxGridRows: NumericCandidateSelection;
  cellGeometryPolicy: PolicyCandidateSelection<'square-cells-only'>;
  gridAspectPolicy: PolicyCandidateSelection<'independent-nx-ny-rectangular-sheet'>;
  directionFamilyPolicy: PolicyCandidateSelection<'orthogonal-axial-n'>;
  maxNormalizedQuantizationError: NumericCandidateSelection;
  junctionGadgetFamily: PolicyCandidateSelection<'finite-certified-junction-library'>;
  elevationRoutingPolicy: PolicyCandidateSelection<'integer-axial-plus-n'>;
  pathCompositionPolicy: PolicyCandidateSelection<'constructive-gadget-schedule'>;
  maxPathDegreesOfFreedom: NumericCandidateSelection;
  maxClosedLoopConditionNumber: NumericCandidateSelection;
  layerPatternPolicy: PolicyCandidateSelection<'finite-certified-pattern-library'>;
  terminationModel: PolicyCandidateSelection<'finite-enumeration' | 'total-constructive'>;
}>;

export type FoldVerificationCandidateConstraints = Readonly<{
  formatVersionPolicy: PolicyCandidateSelection<'fold-1.1-1.2-top-level-keyframe'>;
  dimensionPolicy: PolicyCandidateSelection<'two-dimensional-cp'>;
  fileFramesPolicy: PolicyCandidateSelection<'absent-or-empty'>;
  maxVertices: NumericCandidateSelection;
  maxEdges: NumericCandidateSelection;
  maxFaces: NumericCandidateSelection;
  assignmentPolicy: PolicyCandidateSelection<'mvbfu-only'>;
  facesPolicy: PolicyCandidateSelection<'present-or-reconstruct'>;
  planarityPolicy: PolicyCandidateSelection<'certified-planar'>;
  manifoldPolicy: PolicyCandidateSelection<'two-manifold-with-boundary'>;
  minNormalizedFeature: NumericCandidateSelection;
  maxPaperAspectRatio: NumericCandidateSelection;
  maxVertexDegree: NumericCandidateSelection;
  faceAdjacencyPolicy: PolicyCandidateSelection<'consistent-two-sided-incidence'>;
  treeDependencyPolicy: PolicyCandidateSelection<'none'>;
  targetPolicy: PolicyCandidateSelection<'cp-mv-consistent-complete-flat'>;
  pathCompositionPolicy: PolicyCandidateSelection<'certified-continuation'>;
  maxPathDegreesOfFreedom: NumericCandidateSelection;
  maxClosedLoopConditionNumber: NumericCandidateSelection;
  layerPatternPolicy: PolicyCandidateSelection<'finite-certified-pattern-library'>;
  terminationModel: PolicyCandidateSelection<'finite-enumeration' | 'total-constructive'>;
}>;

type CandidateProfileBase = Readonly<{
  profileHash: null;
  evidence: PendingSupportEvidence;
}>;

export type TreeMethodGenerationSupportProfileCandidate = CandidateProfileBase &
  Readonly<{
    profileId: 'oridesign-generation-tree-method-v1-candidates';
    kind: 'design-generation';
    method: 'treeMethod';
    constraintsSchemaId: typeof SUPPORT_CONSTRAINT_SCHEMA_IDS.treeMethod;
    constraints: TreeMethodCandidateConstraints;
  }>;

export type BoxPleatingGenerationSupportProfileCandidate = CandidateProfileBase &
  Readonly<{
    profileId: 'oridesign-generation-box-pleating-v1-candidates';
    kind: 'design-generation';
    method: 'boxPleating';
    constraintsSchemaId: typeof SUPPORT_CONSTRAINT_SCHEMA_IDS.boxPleating;
    constraints: BoxPleatingCandidateConstraints;
  }>;

export type FoldVerificationSupportProfileCandidate = CandidateProfileBase &
  Readonly<{
    profileId: 'oridesign-fold-verification-v1-candidates';
    kind: 'fold-verification';
    constraintsSchemaId: typeof SUPPORT_CONSTRAINT_SCHEMA_IDS.foldVerification;
    constraints: FoldVerificationCandidateConstraints;
  }>;

export type SupportProfileCandidate =
  | TreeMethodGenerationSupportProfileCandidate
  | BoxPleatingGenerationSupportProfileCandidate
  | FoldVerificationSupportProfileCandidate;

export type SupportProfileCandidatesV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof SUPPORT_PROFILE_CANDIDATES_SCHEMA_ID;
  catalogId: typeof SUPPORT_PROFILE_CANDIDATE_CATALOG_ID;
  status: 'candidate';
  profiles: readonly [
    TreeMethodGenerationSupportProfileCandidate,
    BoxPleatingGenerationSupportProfileCandidate,
    FoldVerificationSupportProfileCandidate,
  ];
}>;

export type SupportProfileCandidatesIssue = Readonly<{
  path: string;
  code: string;
  message: string;
}>;

export type SupportProfileCandidatesParseResult =
  | Readonly<{ ok: true; value: SupportProfileCandidatesV1 }>
  | Readonly<{ ok: false; error: readonly SupportProfileCandidatesIssue[] }>;

type ConstraintSpecification = Readonly<
  | { kind: 'number'; integer: boolean; allowZero?: boolean }
  | { kind: 'policy'; allowed: readonly string[] }
>;

type ProfileSpecification = Readonly<{
  profileId: string;
  kind: 'design-generation' | 'fold-verification';
  method?: 'treeMethod' | 'boxPleating';
  constraintsSchemaId: string;
  constraints: Readonly<Record<string, ConstraintSpecification>>;
}>;

const GENERATION_COMMON_CONSTRAINTS = {
  leafCountMinimum: { kind: 'number', integer: true },
  leafCountMaximum: { kind: 'number', integer: true },
  maxTreeDegree: { kind: 'number', integer: true },
  maxTreeEdges: { kind: 'number', integer: true },
  degreeSequencePolicy: { kind: 'policy', allowed: ['bounded-explicit-sequence'] },
  cyclicOrderPolicy: { kind: 'policy', allowed: ['required-explicit'] },
  maxInputDecimalDigits: { kind: 'number', integer: true },
  minNormalizedBranchLength: { kind: 'number', integer: false },
  maxNormalizedLengthRatio: { kind: 'number', integer: false },
  maxWidthToLengthRatio: { kind: 'number', integer: false },
  branchWidthAccommodationPolicy: {
    kind: 'policy',
    allowed: ['all-branches-including-internal'],
  },
  maxPaperAspectRatio: { kind: 'number', integer: false },
  minNormalizedPaperFeature: { kind: 'number', integer: false },
  minNormalizedBoundaryMargin: { kind: 'number', integer: false },
} as const satisfies Readonly<Record<string, ConstraintSpecification>>;

const PATH_COMMON_CONSTRAINTS = {
  maxPathDegreesOfFreedom: { kind: 'number', integer: true },
  maxClosedLoopConditionNumber: { kind: 'number', integer: false },
  layerPatternPolicy: { kind: 'policy', allowed: ['finite-certified-pattern-library'] },
  terminationModel: {
    kind: 'policy',
    allowed: ['finite-enumeration', 'total-constructive'],
  },
} as const satisfies Readonly<Record<string, ConstraintSpecification>>;

const PROFILE_SPECIFICATIONS: readonly ProfileSpecification[] = [
  {
    profileId: 'oridesign-generation-tree-method-v1-candidates',
    kind: 'design-generation',
    method: 'treeMethod',
    constraintsSchemaId: SUPPORT_CONSTRAINT_SCHEMA_IDS.treeMethod,
    constraints: {
      ...GENERATION_COMMON_CONSTRAINTS,
      packingCondition: {
        kind: 'policy',
        allowed: ['strict-circle-river-clearance', 'certified-tangency'],
      },
      moleculeFamily: {
        kind: 'policy',
        allowed: ['finite-certified-gadget-library', 'universal-molecule-subset'],
      },
      minNormalizedSingularityDistance: { kind: 'number', integer: false },
      pathCompositionPolicy: {
        kind: 'policy',
        allowed: ['constructive-gadget-schedule', 'certified-continuation'],
      },
      ...PATH_COMMON_CONSTRAINTS,
    },
  },
  {
    profileId: 'oridesign-generation-box-pleating-v1-candidates',
    kind: 'design-generation',
    method: 'boxPleating',
    constraintsSchemaId: SUPPORT_CONSTRAINT_SCHEMA_IDS.boxPleating,
    constraints: {
      ...GENERATION_COMMON_CONSTRAINTS,
      maxGridColumns: { kind: 'number', integer: true },
      maxGridRows: { kind: 'number', integer: true },
      cellGeometryPolicy: { kind: 'policy', allowed: ['square-cells-only'] },
      gridAspectPolicy: {
        kind: 'policy',
        allowed: ['independent-nx-ny-rectangular-sheet'],
      },
      directionFamilyPolicy: { kind: 'policy', allowed: ['orthogonal-axial-n'] },
      maxNormalizedQuantizationError: { kind: 'number', integer: false },
      junctionGadgetFamily: {
        kind: 'policy',
        allowed: ['finite-certified-junction-library'],
      },
      elevationRoutingPolicy: { kind: 'policy', allowed: ['integer-axial-plus-n'] },
      pathCompositionPolicy: {
        kind: 'policy',
        allowed: ['constructive-gadget-schedule'],
      },
      ...PATH_COMMON_CONSTRAINTS,
    },
  },
  {
    profileId: 'oridesign-fold-verification-v1-candidates',
    kind: 'fold-verification',
    constraintsSchemaId: SUPPORT_CONSTRAINT_SCHEMA_IDS.foldVerification,
    constraints: {
      formatVersionPolicy: {
        kind: 'policy',
        allowed: ['fold-1.1-1.2-top-level-keyframe'],
      },
      dimensionPolicy: { kind: 'policy', allowed: ['two-dimensional-cp'] },
      fileFramesPolicy: { kind: 'policy', allowed: ['absent-or-empty'] },
      maxVertices: { kind: 'number', integer: true },
      maxEdges: { kind: 'number', integer: true },
      maxFaces: { kind: 'number', integer: true },
      assignmentPolicy: { kind: 'policy', allowed: ['mvbfu-only'] },
      facesPolicy: { kind: 'policy', allowed: ['present-or-reconstruct'] },
      planarityPolicy: { kind: 'policy', allowed: ['certified-planar'] },
      manifoldPolicy: { kind: 'policy', allowed: ['two-manifold-with-boundary'] },
      minNormalizedFeature: { kind: 'number', integer: false },
      maxPaperAspectRatio: { kind: 'number', integer: false },
      maxVertexDegree: { kind: 'number', integer: true },
      faceAdjacencyPolicy: {
        kind: 'policy',
        allowed: ['consistent-two-sided-incidence'],
      },
      treeDependencyPolicy: { kind: 'policy', allowed: ['none'] },
      targetPolicy: {
        kind: 'policy',
        allowed: ['cp-mv-consistent-complete-flat'],
      },
      pathCompositionPolicy: { kind: 'policy', allowed: ['certified-continuation'] },
      ...PATH_COMMON_CONSTRAINTS,
    },
  },
] as const;

const ROOT_KEYS = ['schemaVersion', 'schemaId', 'catalogId', 'status', 'profiles'] as const;
const GENERATION_PROFILE_KEYS = [
  'profileId',
  'kind',
  'method',
  'profileHash',
  'constraintsSchemaId',
  'constraints',
  'evidence',
] as const;
const FOLD_PROFILE_KEYS = [
  'profileId',
  'kind',
  'profileHash',
  'constraintsSchemaId',
  'constraints',
  'evidence',
] as const;
const SELECTION_KEYS = ['candidates', 'selected'] as const;
const EVIDENCE_KEYS = ['status', 'ref'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function addIssue(
  issues: SupportProfileCandidatesIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  issues: SupportProfileCandidatesIssue[],
): void {
  const expectedKeys = new Set(expected);
  for (const key of Object.keys(value)) {
    if (!expectedKeys.has(key)) {
      addIssue(issues, `${path}.${key}`, 'unknown-key', 'is not allowed');
    }
  }
  for (const key of expected) {
    if (!(key in value)) {
      addIssue(issues, `${path}.${key}`, 'missing-key', 'is required');
    }
  }
}

function validateSelection(
  value: unknown,
  specification: ConstraintSpecification,
  path: string,
  issues: SupportProfileCandidatesIssue[],
): void {
  if (!isRecord(value)) {
    addIssue(issues, path, 'invalid-selection', 'must be an object');
    return;
  }
  exactKeys(value, SELECTION_KEYS, path, issues);
  if (value.selected !== null) {
    addIssue(
      issues,
      `${path}.selected`,
      'premature-selection',
      'candidate profiles cannot select a supported boundary',
    );
  }
  if (!Array.isArray(value.candidates) || value.candidates.length === 0) {
    addIssue(issues, `${path}.candidates`, 'invalid-candidates', 'must be a non-empty array');
    return;
  }

  if (specification.kind === 'number') {
    let previous = Number.NEGATIVE_INFINITY;
    value.candidates.forEach((candidate, index) => {
      const valid =
        typeof candidate === 'number' &&
        Number.isFinite(candidate) &&
        (specification.allowZero === true ? candidate >= 0 : candidate > 0) &&
        (!specification.integer || Number.isSafeInteger(candidate)) &&
        candidate > previous;
      if (!valid) {
        addIssue(
          issues,
          `${path}.candidates[${index}]`,
          'invalid-candidates',
          'numeric candidates must be finite, ascending, unique, and within their number kind',
        );
      }
      if (typeof candidate === 'number') previous = candidate;
    });
    return;
  }

  let previousAllowedIndex = -1;
  value.candidates.forEach((candidate, index) => {
    const allowedIndex =
      typeof candidate === 'string' ? specification.allowed.indexOf(candidate) : -1;
    if (allowedIndex < 0 || allowedIndex <= previousAllowedIndex) {
      addIssue(
        issues,
        `${path}.candidates[${index}]`,
        'invalid-candidates',
        'policy candidates must be unique values in their declared canonical order',
      );
    }
    previousAllowedIndex = allowedIndex;
  });
}

function validateEvidence(
  value: unknown,
  path: string,
  issues: SupportProfileCandidatesIssue[],
): void {
  if (!isRecord(value)) {
    addIssue(issues, path, 'invalid-evidence', 'must be an object');
    return;
  }
  exactKeys(value, EVIDENCE_KEYS, path, issues);
  if (value.status !== 'pending' || value.ref !== null) {
    addIssue(
      issues,
      path,
      'premature-evidence',
      'candidate profiles require pending evidence with a null reference',
    );
  }
}

function validateProfile(
  value: unknown,
  specification: ProfileSpecification,
  index: number,
  issues: SupportProfileCandidatesIssue[],
): void {
  const path = `$.profiles[${index}]`;
  if (!isRecord(value)) {
    addIssue(issues, path, 'invalid-profile', 'must be an object');
    return;
  }
  exactKeys(
    value,
    specification.kind === 'design-generation' ? GENERATION_PROFILE_KEYS : FOLD_PROFILE_KEYS,
    path,
    issues,
  );
  if (value.profileId !== specification.profileId) {
    addIssue(issues, `${path}.profileId`, 'profile-order-mismatch', specification.profileId);
  }
  if (value.kind !== specification.kind) {
    addIssue(issues, `${path}.kind`, 'profile-kind-mismatch', `must be ${specification.kind}`);
  }
  if (specification.method !== undefined && value.method !== specification.method) {
    addIssue(
      issues,
      `${path}.method`,
      'profile-method-mismatch',
      `must be ${specification.method}`,
    );
  }
  if (value.profileHash !== null) {
    addIssue(
      issues,
      `${path}.profileHash`,
      'premature-profile-hash',
      'candidate profileHash must be null',
    );
  }
  if (value.constraintsSchemaId !== specification.constraintsSchemaId) {
    addIssue(
      issues,
      `${path}.constraintsSchemaId`,
      'constraint-schema-mismatch',
      `must be ${specification.constraintsSchemaId}`,
    );
  }
  validateEvidence(value.evidence, `${path}.evidence`, issues);

  if (!isRecord(value.constraints)) {
    addIssue(issues, `${path}.constraints`, 'invalid-constraints', 'must be an object');
    return;
  }
  const constraintKeys = Object.keys(specification.constraints);
  exactKeys(value.constraints, constraintKeys, `${path}.constraints`, issues);
  for (const key of constraintKeys) {
    const constraintSpecification = specification.constraints[key];
    if (constraintSpecification === undefined) continue;
    validateSelection(
      value.constraints[key],
      constraintSpecification,
      `${path}.constraints.${key}`,
      issues,
    );
  }
}

/**
 * Validates M0F support-boundary hypotheses without creating a SupportedInput claim.
 *
 * This candidate-only parser deliberately rejects frozen status, selected values,
 * evidence references, and profile hashes. A separate v1 frozen-profile parser must
 * be introduced with M0F-7 evidence and hash verification.
 */
export function parseSupportProfileCandidatesV1(
  supplied: unknown,
): SupportProfileCandidatesParseResult {
  const issues: SupportProfileCandidatesIssue[] = [];
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'invalid-root',
          message: 'must be one cloneable plain JSON-data snapshot',
        },
      ],
    };
  }
  const raw = snapshot.value;
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-root', message: 'must be an object' }],
    };
  }

  exactKeys(raw, ROOT_KEYS, '$', issues);
  if (raw.schemaVersion !== 1) {
    addIssue(issues, '$.schemaVersion', 'invalid-schema-version', 'must be 1');
  }
  if (raw.schemaId !== SUPPORT_PROFILE_CANDIDATES_SCHEMA_ID) {
    addIssue(
      issues,
      '$.schemaId',
      'invalid-schema-id',
      `must be ${SUPPORT_PROFILE_CANDIDATES_SCHEMA_ID}`,
    );
  }
  if (raw.catalogId !== SUPPORT_PROFILE_CANDIDATE_CATALOG_ID) {
    addIssue(
      issues,
      '$.catalogId',
      'invalid-catalog-id',
      `must be ${SUPPORT_PROFILE_CANDIDATE_CATALOG_ID}`,
    );
  }
  if (raw.status !== 'candidate') {
    addIssue(
      issues,
      '$.status',
      raw.status === 'frozen' ? 'premature-frozen-profile' : 'invalid-status',
      'this schema is candidate-only; a frozen profile requires M0F-7 evidence',
    );
  }

  if (!Array.isArray(raw.profiles)) {
    addIssue(issues, '$.profiles', 'invalid-profiles', 'must be an array');
  } else {
    const profiles = raw.profiles;
    if (profiles.length !== PROFILE_SPECIFICATIONS.length) {
      addIssue(
        issues,
        '$.profiles',
        'incomplete-profile-catalog',
        `must contain exactly ${PROFILE_SPECIFICATIONS.length} workflow profiles`,
      );
    }
    PROFILE_SPECIFICATIONS.forEach((specification, index) => {
      validateProfile(profiles[index], specification, index, issues);
    });
  }

  if (issues.length > 0) return { ok: false, error: issues };
  const ownedCatalog = deepFreezeOwned(raw);
  return { ok: true, value: ownedCatalog as unknown as SupportProfileCandidatesV1 };
}
