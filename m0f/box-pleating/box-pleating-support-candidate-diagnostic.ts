import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  parseSupportProfileCandidatesV1,
  type BoxPleatingGenerationSupportProfileCandidate,
  type SupportProfileCandidatesV1,
} from '../profiles/support-profiles.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  evaluateBoxPleatingCandidateFlowV1,
  type BoxPleatingCandidateFlowInputV1,
  type BoxPleatingCandidateFlowResultV1,
} from './box-pleating-candidate-flow.js';

export const BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_INPUT_RECORD_TYPE =
  'm0f-box-pleating-support-candidate-diagnostic-input' as const;
export const BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_RESULT_RECORD_TYPE =
  'm0f-box-pleating-support-candidate-diagnostic-result' as const;

/** Candidate diagnostic ceilings only; never a product SupportProfile. */
export const BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_LIMITS = deepFreezeOwned({
  maxArrayLength: 40,
  maxContainerCount: 1_024,
  maxDepth: 14,
  maxObjectPropertyCount: 64,
  maxPropertyNameCodeUnits: 96,
  maxStringCodeUnits: 8_192,
  maxTotalStringCodeUnits: 786_432,
  maxTotalPropertyCount: 8_192,
});

export type BoxPleatingSupportCandidateDiagnosticInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  supportProfileCandidates: SupportProfileCandidatesV1;
  candidateFlowInput: BoxPleatingCandidateFlowInputV1;
}>;

export type BoxPleatingCandidatePredicateIdV1 =
  | 'leafCountMinimum'
  | 'leafCountMaximum'
  | 'maxTreeDegree'
  | 'maxTreeEdges'
  | 'maxGridColumns'
  | 'maxGridRows';

export type BoxPleatingCandidatePredicateObservationV1 = Readonly<{
  predicateId: BoxPleatingCandidatePredicateIdV1;
  predicateClass: 'candidate-boundary-hypothesis-only';
  actualValue: number;
  comparison: 'actual-at-least-candidate' | 'actual-at-most-candidate';
  candidateOutcomes: readonly Readonly<{
    candidateValue: number;
    inputSatisfiesCandidateHypothesis: boolean;
  }>[];
  selectedBoundary: null;
  supportDecisionAvailable: false;
}>;

export type BoxPleatingSupportCandidateDiagnosticResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  outputKind: 'candidate-input-predicate-diagnostic-not-support-decision';
  scope: 'one-box-pleating-input-against-unselected-support-boundary-hypotheses';
  supportProfileCandidateCatalogParsed: true;
  boxPleatingCandidateFlowCompleted: true;
  packingProblemIndependentValidationPassed: true;
  euclideanNecessaryFilterIndependentReplayPassed: true;
  candidateInputPredicateDiagnosticIncluded: true;
  checkSupportImplemented: false;
  supportedInputDecisionIncluded: false;
  supportedInputClaim: false;
  supportProfileIncluded: false;
  supportProfileSelected: false;
  supportProfileFrozen: false;
  supportProfileHashVerified: false;
  supportProfileEvidenceVerified: false;
  isSupportProfile: false;
  toleranceProfileIncluded: false;
  toleranceProfileSelected: false;
  packingSolutionIncluded: false;
  packingSufficiencyEvidenceIncluded: false;
  packingInfeasibilityEvidenceIncluded: false;
  creasePatternIncluded: false;
  foldabilityIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  profileCandidateBinding: Readonly<{
    catalogId: SupportProfileCandidatesV1['catalogId'];
    catalogStatus: 'candidate';
    profileId: BoxPleatingGenerationSupportProfileCandidate['profileId'];
    profileKind: 'design-generation';
    method: 'boxPleating';
    profileHash: null;
    evidenceStatus: 'pending';
    constraintCount: 27;
    selectedConstraintCount: 0;
    evaluatedConstraintCount: 6;
    unevaluatedConstraintCount: 21;
  }>;
  inputFacts: Readonly<{
    selectedCandidateId: string;
    leafCount: number;
    treeEdgeCount: number;
    maximumTreeDegree: number;
    selectedGridColumns: number;
    selectedGridRows: number;
    euclideanNecessarySearchStatus: BoxPleatingCandidateFlowResultV1['necessaryFilterSearch']['searchStatus'];
    visitedStates: number;
    witnessCount: number;
  }>;
  candidatePredicateObservations: readonly BoxPleatingCandidatePredicateObservationV1[];
  unevaluatedConstraintIds: readonly string[];
  packingNecessaryDiagnostic: Readonly<{
    semanticsContractStatus: 'candidate';
    filterStrength: 'necessary-only';
    pairwiseNecessaryFilter: 'squared-euclidean-distance-at-least-squared-tree-path-length';
    packingProblemDescriptionIncluded: true;
    necessaryFilterSearchIncluded: true;
    necessaryFilterWitnessObserved: boolean;
    necessaryFilterDomainExhausted: boolean;
    passingWitnessIsPackingEvidence: false;
    domainExhaustionIsPackingNoSolutionEvidence: false;
    widthUsedByNecessaryFilter: false;
    constructionFamilySelectionIncluded: false;
    polygonRiverGeometryIncluded: false;
  }>;
  candidateProfileReference: BoxPleatingGenerationSupportProfileCandidate;
  candidateFlow: BoxPleatingCandidateFlowResultV1;
}>;

export type BoxPleatingSupportCandidateDiagnosticIssueV1 = Readonly<{
  stage: 'snapshot' | 'diagnostic-input' | 'profile-catalog' | 'candidate-flow';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
}>;

export type BoxPleatingSupportCandidateDiagnosticEvaluationV1 =
  | Readonly<{ ok: true; value: BoxPleatingSupportCandidateDiagnosticResultV1 }>
  | Readonly<{ ok: false; error: readonly BoxPleatingSupportCandidateDiagnosticIssueV1[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'supportProfileCandidates',
  'candidateFlowInput',
] as const;

const UNEVALUATED_CONSTRAINT_IDS = [
  'degreeSequencePolicy',
  'cyclicOrderPolicy',
  'maxInputDecimalDigits',
  'minNormalizedBranchLength',
  'maxNormalizedLengthRatio',
  'maxWidthToLengthRatio',
  'branchWidthAccommodationPolicy',
  'maxPaperAspectRatio',
  'minNormalizedPaperFeature',
  'minNormalizedBoundaryMargin',
  'cellGeometryPolicy',
  'gridAspectPolicy',
  'directionFamilyPolicy',
  'maxNormalizedQuantizationError',
  'junctionGadgetFamily',
  'elevationRoutingPolicy',
  'pathCompositionPolicy',
  'maxPathDegreesOfFreedom',
  'maxClosedLoopConditionNumber',
  'layerPatternPolicy',
  'terminationModel',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issue(
  stage: BoxPleatingSupportCandidateDiagnosticIssueV1['stage'],
  path: string,
  code: string,
  message: string,
  sourceStage?: string,
): BoxPleatingSupportCandidateDiagnosticIssueV1 {
  return sourceStage === undefined
    ? { stage, path, code, message }
    : { stage, path, code, message, sourceStage };
}

function failure(
  error: readonly BoxPleatingSupportCandidateDiagnosticIssueV1[],
): BoxPleatingSupportCandidateDiagnosticEvaluationV1 {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function prefixedPath(prefix: string, path: string): string {
  if (path === '$') return prefix;
  return path.startsWith('$') ? `${prefix}${path.slice(1)}` : `${prefix}.${path}`;
}

function rootIssues(raw: Record<string, unknown>): BoxPleatingSupportCandidateDiagnosticIssueV1[] {
  const issues: BoxPleatingSupportCandidateDiagnosticIssueV1[] = [];
  const allowed = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      issues.push(
        issue(
          'diagnostic-input',
          `$.${key}`,
          'unknown-field',
          'field is not declared by support candidate diagnostic input v1',
        ),
      );
    }
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      issues.push(
        issue('diagnostic-input', `$.${key}`, 'missing-field', 'required field is missing'),
      );
    }
  }
  if (raw.schemaVersion !== 1) {
    issues.push(issue('diagnostic-input', '$.schemaVersion', 'invalid-literal', 'must equal 1'));
  }
  if (raw.recordType !== BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_INPUT_RECORD_TYPE) {
    issues.push(
      issue(
        'diagnostic-input',
        '$.recordType',
        'invalid-literal',
        `must equal ${BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_INPUT_RECORD_TYPE}`,
      ),
    );
  }
  if (raw.contractStatus !== 'candidate') {
    issues.push(
      issue('diagnostic-input', '$.contractStatus', 'claim-boundary', 'must remain candidate'),
    );
  }
  if (raw.scientificClaim !== false) {
    issues.push(
      issue('diagnostic-input', '$.scientificClaim', 'claim-boundary', 'must remain false'),
    );
  }
  return issues;
}

function observe(
  predicateId: BoxPleatingCandidatePredicateIdV1,
  actualValue: number,
  candidates: readonly number[],
  comparison: BoxPleatingCandidatePredicateObservationV1['comparison'],
): BoxPleatingCandidatePredicateObservationV1 {
  return {
    predicateId,
    predicateClass: 'candidate-boundary-hypothesis-only',
    actualValue,
    comparison,
    candidateOutcomes: candidates.map((candidateValue) => ({
      candidateValue,
      inputSatisfiesCandidateHypothesis:
        comparison === 'actual-at-least-candidate'
          ? actualValue >= candidateValue
          : actualValue <= candidateValue,
    })),
    selectedBoundary: null,
    supportDecisionAvailable: false,
  };
}

/**
 * Composes the candidate support catalog with the existing packing-problem and
 * squared-Euclidean necessary-filter flow. Passing observations remain
 * unselected hypotheses and cannot answer checkSupport.
 */
export function evaluateBoxPleatingSupportCandidateDiagnosticV1(
  supplied: unknown,
): BoxPleatingSupportCandidateDiagnosticEvaluationV1 {
  const snapshot = tryCreateStrictValidationSnapshot(
    supplied,
    BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_LIMITS,
  );
  if (!snapshot.ok) {
    return failure([
      issue(
        'snapshot',
        '$',
        'invalid-snapshot',
        'input must be one bounded acyclic accessor-free plain snapshot',
      ),
    ]);
  }
  if (!isRecord(snapshot.value)) {
    return failure([
      issue('diagnostic-input', '$', 'invalid-object', 'diagnostic input must be an object'),
    ]);
  }
  const inputIssues = rootIssues(snapshot.value);
  if (inputIssues.length > 0) return failure(inputIssues);

  const catalog = parseSupportProfileCandidatesV1(snapshot.value.supportProfileCandidates);
  if (!catalog.ok) {
    return failure(
      catalog.error.map((entry) =>
        issue(
          'profile-catalog',
          prefixedPath('$.supportProfileCandidates', entry.path),
          entry.code,
          entry.message,
        ),
      ),
    );
  }

  const candidateFlow = evaluateBoxPleatingCandidateFlowV1(snapshot.value.candidateFlowInput);
  if (!candidateFlow.ok) {
    return failure(
      candidateFlow.error.map((entry) =>
        issue(
          'candidate-flow',
          prefixedPath('$.candidateFlowInput', entry.path),
          entry.code,
          entry.message,
          entry.stage,
        ),
      ),
    );
  }

  const profile = catalog.value.profiles[1];
  const flow = candidateFlow.value;
  const counts = flow.enumeration.adapter.orderedTree.derived.counts;
  const search = flow.necessaryFilterSearch;
  const facts = {
    selectedCandidateId: flow.candidateCatalog.selectedCandidateId,
    leafCount: counts.leaves,
    treeEdgeCount: counts.edges,
    maximumTreeDegree: counts.maximumDegree,
    selectedGridColumns: search.activeGridDomain.columns,
    selectedGridRows: search.activeGridDomain.rows,
    euclideanNecessarySearchStatus: search.searchStatus,
    visitedStates: search.visitedStates,
    witnessCount: search.witnessCount,
  };
  const observations = [
    observe(
      'leafCountMinimum',
      facts.leafCount,
      profile.constraints.leafCountMinimum.candidates,
      'actual-at-least-candidate',
    ),
    observe(
      'leafCountMaximum',
      facts.leafCount,
      profile.constraints.leafCountMaximum.candidates,
      'actual-at-most-candidate',
    ),
    observe(
      'maxTreeDegree',
      facts.maximumTreeDegree,
      profile.constraints.maxTreeDegree.candidates,
      'actual-at-most-candidate',
    ),
    observe(
      'maxTreeEdges',
      facts.treeEdgeCount,
      profile.constraints.maxTreeEdges.candidates,
      'actual-at-most-candidate',
    ),
    observe(
      'maxGridColumns',
      facts.selectedGridColumns,
      profile.constraints.maxGridColumns.candidates,
      'actual-at-most-candidate',
    ),
    observe(
      'maxGridRows',
      facts.selectedGridRows,
      profile.constraints.maxGridRows.candidates,
      'actual-at-most-candidate',
    ),
  ];

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: BOX_PLEATING_SUPPORT_CANDIDATE_DIAGNOSTIC_RESULT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      outputKind: 'candidate-input-predicate-diagnostic-not-support-decision' as const,
      scope: 'one-box-pleating-input-against-unselected-support-boundary-hypotheses' as const,
      supportProfileCandidateCatalogParsed: true as const,
      boxPleatingCandidateFlowCompleted: true as const,
      packingProblemIndependentValidationPassed: true as const,
      euclideanNecessaryFilterIndependentReplayPassed: true as const,
      candidateInputPredicateDiagnosticIncluded: true as const,
      checkSupportImplemented: false as const,
      supportedInputDecisionIncluded: false as const,
      supportedInputClaim: false as const,
      supportProfileIncluded: false as const,
      supportProfileSelected: false as const,
      supportProfileFrozen: false as const,
      supportProfileHashVerified: false as const,
      supportProfileEvidenceVerified: false as const,
      isSupportProfile: false as const,
      toleranceProfileIncluded: false as const,
      toleranceProfileSelected: false as const,
      packingSolutionIncluded: false as const,
      packingSufficiencyEvidenceIncluded: false as const,
      packingInfeasibilityEvidenceIncluded: false as const,
      creasePatternIncluded: false as const,
      foldabilityIncluded: false as const,
      feasibilityDecisionIncluded: false as const,
      globalM0fGo: false as const,
      profileCandidateBinding: {
        catalogId: catalog.value.catalogId,
        catalogStatus: 'candidate' as const,
        profileId: profile.profileId,
        profileKind: profile.kind,
        method: profile.method,
        profileHash: profile.profileHash,
        evidenceStatus: profile.evidence.status,
        constraintCount: 27 as const,
        selectedConstraintCount: 0 as const,
        evaluatedConstraintCount: 6 as const,
        unevaluatedConstraintCount: 21 as const,
      },
      inputFacts: facts,
      candidatePredicateObservations: observations,
      unevaluatedConstraintIds: UNEVALUATED_CONSTRAINT_IDS,
      packingNecessaryDiagnostic: {
        semanticsContractStatus: search.semanticsReference.contractStatus,
        filterStrength: search.semanticsReference.filterStrength,
        pairwiseNecessaryFilter: search.semanticsReference.pairwiseNecessaryFilter,
        packingProblemDescriptionIncluded: true as const,
        necessaryFilterSearchIncluded: true as const,
        necessaryFilterWitnessObserved: search.witnessCount > 0,
        necessaryFilterDomainExhausted: search.searchStatus === 'domain-exhausted',
        passingWitnessIsPackingEvidence: false as const,
        domainExhaustionIsPackingNoSolutionEvidence: false as const,
        widthUsedByNecessaryFilter: false as const,
        constructionFamilySelectionIncluded: false as const,
        polygonRiverGeometryIncluded: false as const,
      },
      candidateProfileReference: profile,
      candidateFlow: flow,
    },
  });
}
