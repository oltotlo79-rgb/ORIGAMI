import { CANONICAL_FIXTURE_RULES } from './canonical-fixtures.js';
import { deepFreezeOwned } from './clone-and-freeze.js';

export const M0F_FINAL_EVIDENCE_GATE_READINESS_RECORD_TYPE =
  'm0f-final-evidence-gate-readiness' as const;
export const M0F_FINAL_EVIDENCE_GATE_REASON_CODE = 'final-evidence-gate-not-ready' as const;

export type M0fGoConditionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type M0fRequiredDeliverableNumber = M0fGoConditionNumber;

type GateAreaDefinitionV1 = Readonly<{
  areaId:
    | 'support-profile'
    | 'terminal-evidence-and-no-solution'
    | 'generation-and-fixture-evidence'
    | 'face-path-contact-and-layer-certificates'
    | 'independent-verifier-and-mutations'
    | 'tolerance-profile'
    | 'browser-runtime-and-benchmarks'
    | 'license-and-provenance'
    | 'product-contract-and-documentation'
    | 'go-decision-record';
  reasonCode:
    | 'support-profile-evidence-not-evaluated'
    | 'terminal-evidence-not-evaluated'
    | 'generation-fixture-evidence-not-evaluated'
    | 'path-collision-layer-evidence-not-evaluated'
    | 'independent-verifier-evidence-not-evaluated'
    | 'tolerance-profile-evidence-not-evaluated'
    | 'browser-runtime-evidence-not-evaluated'
    | 'license-provenance-evidence-not-evaluated'
    | 'product-contract-evidence-not-evaluated'
    | 'go-decision-record-not-evaluated';
  goConditionNumbers: readonly M0fGoConditionNumber[];
  requiredDeliverableNumbers: readonly M0fRequiredDeliverableNumber[];
  message: string;
  nextAction: string;
}>;

/**
 * Fail-closed evidence areas covering docs/05 sections 12.3 and 13 exactly once.
 * Candidate artifacts are deliberately not treated as final evidence here.
 */
export const M0F_FINAL_EVIDENCE_GATE_AREA_DEFINITIONS_V1 = deepFreezeOwned([
  {
    areaId: 'support-profile',
    reasonCode: 'support-profile-evidence-not-evaluated',
    goConditionNumbers: [1],
    requiredDeliverableNumbers: [2],
    message:
      'The global gate does not evaluate a frozen, non-circular support profile or its checkSupport contract.',
    nextAction:
      'Freeze support-profile-v1.json, its schema, checkSupport implementation, and reason-code catalog, then register their evidence checks.',
  },
  {
    areaId: 'terminal-evidence-and-no-solution',
    reasonCode: 'terminal-evidence-not-evaluated',
    goConditionNumbers: [2],
    requiredDeliverableNumbers: [6],
    message:
      'The global gate does not evaluate evidence that every supported terminal is verified or no-solution-certified.',
    nextAction:
      'Define the distinguishable no-solution evidence schema and reference checker, then evaluate every supported terminal path.',
  },
  {
    areaId: 'generation-and-fixture-evidence',
    reasonCode: 'generation-fixture-evidence-not-evaluated',
    goConditionNumbers: [3, 4, 11],
    requiredDeliverableNumbers: [1, 8],
    message:
      'The global gate does not evaluate canonical, generated, holdout, and boundary evidence for the separate generation workflows.',
    nextAction:
      'Populate provenance-bound canonical fixtures and register deterministic generation, holdout, and boundary test results.',
  },
  {
    areaId: 'face-path-contact-and-layer-certificates',
    reasonCode: 'path-collision-layer-evidence-not-evaluated',
    goConditionNumbers: [5, 6, 7],
    requiredDeliverableNumbers: [5],
    message:
      'The global gate does not evaluate FOLD round-trip, continuous rigid path, CCD/contact, or layer-order certificates.',
    nextAction:
      'Freeze the path certificate contract and register independent checks for topology, rigid continuity, penetration, reversal, and cycles.',
  },
  {
    areaId: 'independent-verifier-and-mutations',
    reasonCode: 'independent-verifier-evidence-not-evaluated',
    goConditionNumbers: [8],
    requiredDeliverableNumbers: [7],
    message:
      'Candidate verifiers and mutation suites are not registered as the final independent reference-verifier evidence.',
    nextAction:
      'Complete the independent verifier scope, freeze its mutation suite, and register reproducible passing evidence.',
  },
  {
    areaId: 'tolerance-profile',
    reasonCode: 'tolerance-profile-evidence-not-evaluated',
    goConditionNumbers: [9],
    requiredDeliverableNumbers: [3],
    message:
      'The global gate does not evaluate a sensitivity-tested, frozen tolerance profile and guarantee wording.',
    nextAction:
      'Measure sensitivity boundaries, freeze tolerance-profile-v1.json with rationale, and register the result.',
  },
  {
    areaId: 'browser-runtime-and-benchmarks',
    reasonCode: 'browser-runtime-evidence-not-evaluated',
    goConditionNumbers: [10, 13],
    requiredDeliverableNumbers: [4, 9],
    message:
      'The global gate does not evaluate frozen runtime limits or the required Windows three-browser measurements.',
    nextAction:
      'Replace candidate limits with measured frozen limits and register raw benchmark JSONL, environment, progress, cancellation, and reproducibility evidence.',
  },
  {
    areaId: 'license-and-provenance',
    reasonCode: 'license-provenance-evidence-not-evaluated',
    goConditionNumbers: [12],
    requiredDeliverableNumbers: [12],
    message: 'The global gate does not evaluate a final dependency-license and source audit.',
    nextAction:
      'Record the dependency license inventory, source provenance, redistribution decisions, and automated audit result.',
  },
  {
    areaId: 'product-contract-and-documentation',
    reasonCode: 'product-contract-evidence-not-evaluated',
    goConditionNumbers: [14],
    requiredDeliverableNumbers: [10, 11, 14],
    message:
      'The global gate does not evaluate frozen product-domain contracts or the removal of unresolved generic fields and limits.',
    nextAction:
      'Freeze canonicalization/hash and domain schemas, resolve representation and limit choices, record the ADR, and update normative documents.',
  },
  {
    areaId: 'go-decision-record',
    reasonCode: 'go-decision-record-not-evaluated',
    goConditionNumbers: [],
    requiredDeliverableNumbers: [13],
    message: 'The global gate does not evaluate M0F_REPORT.md and a recorded GO or NO-GO decision.',
    nextAction:
      'Create M0F_REPORT.md from registered evidence and record the final decision only after every GO condition passes.',
  },
] as const satisfies readonly GateAreaDefinitionV1[]);

export type M0fFinalEvidenceGateAreaReasonCodeV1 =
  (typeof M0F_FINAL_EVIDENCE_GATE_AREA_DEFINITIONS_V1)[number]['reasonCode'];

export type M0fCanonicalFixtureGapClassV1 =
  'positive-or-reference-exact' | 'negative-exact' | 'negative-family' | 'unclassified';

export type M0fFinalEvidenceGateReadinessReasonCodeV1 =
  | typeof M0F_FINAL_EVIDENCE_GATE_REASON_CODE
  | 'canonical-fixture-catalog-incomplete'
  | 'fixture-repository-invalid'
  | M0fFinalEvidenceGateAreaReasonCodeV1;

export type M0fFinalEvidenceGateReadinessInputV1 = Readonly<{
  catalogComplete: boolean;
  catalogErrorCount: number;
  missingCanonicalPatterns: readonly string[];
}>;

export type M0fFinalEvidenceGateAreaDiagnosticV1 = GateAreaDefinitionV1 &
  Readonly<{
    status: 'not-evaluated';
    blocking: true;
  }>;

export type M0fCanonicalFixtureGapGroupV1 = Readonly<{
  gapClass: M0fCanonicalFixtureGapClassV1;
  count: number;
  patterns: readonly string[];
}>;

export type M0fFinalEvidenceGateReadinessV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof M0F_FINAL_EVIDENCE_GATE_READINESS_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  passed: false;
  decision: 'not-ready';
  reasonCode: typeof M0F_FINAL_EVIDENCE_GATE_REASON_CODE;
  reasonCodes: readonly M0fFinalEvidenceGateReadinessReasonCodeV1[];
  message: string;
  catalog: Readonly<{
    status: 'ready' | 'blocked';
    complete: boolean;
    reasonCode: 'canonical-fixture-catalog-incomplete' | 'fixture-repository-invalid' | null;
    errorCount: number;
    missingCanonicalFixtureCount: number;
    missingCanonicalPatterns: readonly string[];
    missingCanonicalGroups: readonly M0fCanonicalFixtureGapGroupV1[];
  }>;
  summary: Readonly<{
    gateAreaCount: number;
    readyAreaCount: 0;
    blockingAreaCount: number;
    notEvaluatedAreaCount: number;
    goConditionCount: 14;
    coveredGoConditionCount: number;
    requiredDeliverableCount: 14;
    coveredRequiredDeliverableCount: number;
  }>;
  areas: readonly M0fFinalEvidenceGateAreaDiagnosticV1[];
}>;

function orderedUniqueMissingPatterns(patterns: readonly string[]): readonly string[] {
  const missing = new Set(patterns);
  const canonicalPatterns = new Set(CANONICAL_FIXTURE_RULES.map((rule) => rule.pattern));
  return [
    ...CANONICAL_FIXTURE_RULES.filter((rule) => missing.has(rule.pattern)).map(
      (rule) => rule.pattern,
    ),
    ...[...missing]
      .filter((pattern) => !canonicalPatterns.has(pattern))
      .sort((left, right) => left.localeCompare(right, 'en')),
  ];
}

function classifyMissingPattern(pattern: string): M0fCanonicalFixtureGapClassV1 {
  const rule = CANONICAL_FIXTURE_RULES.find((entry) => entry.pattern === pattern);
  if (rule === undefined) return 'unclassified';
  if (rule.cardinality === 'one-or-more') {
    return pattern.startsWith('NEG-') ? 'negative-family' : 'unclassified';
  }
  return pattern.startsWith('NEG-') ? 'negative-exact' : 'positive-or-reference-exact';
}

function groupMissingPatterns(
  patterns: readonly string[],
): readonly M0fCanonicalFixtureGapGroupV1[] {
  const classes: readonly M0fCanonicalFixtureGapClassV1[] = [
    'positive-or-reference-exact',
    'negative-exact',
    'negative-family',
    'unclassified',
  ];
  return classes.map((gapClass) => {
    const groupedPatterns = patterns.filter(
      (pattern) => classifyMissingPattern(pattern) === gapClass,
    );
    return {
      gapClass,
      count: groupedPatterns.length,
      patterns: groupedPatterns,
    };
  });
}

export function createM0fFinalEvidenceGateReadinessV1(
  input: M0fFinalEvidenceGateReadinessInputV1,
): M0fFinalEvidenceGateReadinessV1 {
  const missingCanonicalPatterns = orderedUniqueMissingPatterns(input.missingCanonicalPatterns);
  const catalogReasonCode = input.catalogComplete
    ? null
    : missingCanonicalPatterns.length > 0
      ? ('canonical-fixture-catalog-incomplete' as const)
      : ('fixture-repository-invalid' as const);
  const areas: M0fFinalEvidenceGateAreaDiagnosticV1[] =
    M0F_FINAL_EVIDENCE_GATE_AREA_DEFINITIONS_V1.map((definition) => ({
      ...definition,
      status: 'not-evaluated' as const,
      blocking: true as const,
    }));
  const coveredGoConditions = new Set(areas.flatMap((area) => area.goConditionNumbers)).size;
  const coveredRequiredDeliverables = new Set(
    areas.flatMap((area) => area.requiredDeliverableNumbers),
  ).size;
  const reasonCodes: M0fFinalEvidenceGateReadinessReasonCodeV1[] = [
    M0F_FINAL_EVIDENCE_GATE_REASON_CODE,
    ...(catalogReasonCode === null ? [] : [catalogReasonCode]),
    ...areas.map((area) => area.reasonCode),
  ];
  const message = input.catalogComplete
    ? 'The final M0F gate remains fail-closed because every final evidence area is still not evaluated.'
    : `The final M0F gate remains fail-closed: the fixture repository has ${input.catalogErrorCount} error(s), including ${missingCanonicalPatterns.length} missing canonical fixture rule(s), and every final evidence area is still not evaluated.`;

  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: M0F_FINAL_EVIDENCE_GATE_READINESS_RECORD_TYPE,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    passed: false as const,
    decision: 'not-ready' as const,
    reasonCode: M0F_FINAL_EVIDENCE_GATE_REASON_CODE,
    reasonCodes,
    message,
    catalog: {
      status: input.catalogComplete ? ('ready' as const) : ('blocked' as const),
      complete: input.catalogComplete,
      reasonCode: catalogReasonCode,
      errorCount: input.catalogErrorCount,
      missingCanonicalFixtureCount: missingCanonicalPatterns.length,
      missingCanonicalPatterns,
      missingCanonicalGroups: groupMissingPatterns(missingCanonicalPatterns),
    },
    summary: {
      gateAreaCount: areas.length,
      readyAreaCount: 0 as const,
      blockingAreaCount: areas.length,
      notEvaluatedAreaCount: areas.length,
      goConditionCount: 14 as const,
      coveredGoConditionCount: coveredGoConditions,
      requiredDeliverableCount: 14 as const,
      coveredRequiredDeliverableCount: coveredRequiredDeliverables,
    },
    areas,
  });
}
