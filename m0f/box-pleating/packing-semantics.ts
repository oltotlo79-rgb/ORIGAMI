import { deepFreezeOwned } from '../clone-and-freeze.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';

export const BOX_PLEATING_PACKING_SEMANTICS_RECORD_TYPE =
  'm0f-box-pleating-packing-semantics' as const;

/**
 * Candidate semantics for one exact pairwise necessary filter. This is an ADR
 * candidate and experimental contract, not an adopted construction policy.
 */
export const BOX_PLEATING_PACKING_SEMANTICS_V1 = deepFreezeOwned({
  schemaVersion: 1 as const,
  recordType: BOX_PLEATING_PACKING_SEMANTICS_RECORD_TYPE,
  contractStatus: 'candidate' as const,
  scientificClaim: false as const,
  scope: 'box-pleating-packing-semantics-adr-candidate-only' as const,
  interpretation:
    'pairwise-necessary-filter-semantics-only-without-evaluation-or-construction-family-adoption' as const,
  adrStatus: 'candidate-not-adopted' as const,
  experimentStatus: 'experimental-semantic-contract' as const,

  leafAnchorRole: 'projected-flap-tip-and-minimum-polygon-center' as const,
  lengthRole: 'classical-uniaxial-tree-edge-weight' as const,
  coordinateScale: 'one-grid-index-unit-per-quantized-length-step' as const,
  pairwiseNecessaryFilter: 'squared-euclidean-distance-at-least-squared-tree-path-length' as const,
  filterStrength: 'necessary-only' as const,
  tangencyPolicy: 'allowed-at-equality-for-this-filter' as const,
  widthRole: 'independent-finished-branch-width-not-bound-to-classical-river-width' as const,
  maximumWidthRole: 'trace-only-without-separation-or-packing-semantics' as const,

  manhattanMetricSelected: false as const,
  chebyshevMetricSelected: false as const,
  globalMetricSelectionIncluded: false as const,
  pairwiseNecessaryFilterIsGlobalMetric: false as const,

  constructionFamily: 'unresolved' as const,
  constructionFamilySelectionIncluded: false as const,
  finishedWidthGeometryPolicy: 'unresolved' as const,
  polygonGeometryPolicy: 'unresolved' as const,
  riverGeometryPolicy: 'unresolved' as const,
  junctionGeometryPolicy: 'unresolved' as const,
  residualPaperPolicy: 'unresolved' as const,
  boundaryPolicy: 'unresolved' as const,
  overlapPolicy: 'unresolved' as const,
  gadgetPolicy: 'unresolved' as const,
  pureMinimumSquareAdopted: false as const,
  pythagoreanStretchAdopted: false as const,
  generalizedOffsetPythagoreanStretchAdopted: false as const,

  actualGeometryConstraintEvaluable: false as const,
  globalPackingConstraintEvaluable: false as const,
  filterEvaluationIncluded: false as const,
  placementIncluded: false as const,
  packingIncluded: false as const,
  geometryIncluded: false as const,
  creasePatternIncluded: false as const,
  mountainValleyIncluded: false as const,
  foldabilityIncluded: false as const,
  feasibilityDecisionIncluded: false as const,
  globalM0fGo: false as const,
  isSupportProfile: false as const,
  supportClaim: false as const,
  verifiedClaim: false as const,
} as const);

export type BoxPleatingPackingSemanticsV1 = typeof BOX_PLEATING_PACKING_SEMANTICS_V1;

export type BoxPleatingPackingSemanticsIssue = Readonly<{
  path: string;
  code:
    | 'invalid-snapshot'
    | 'invalid-object'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'claim-boundary';
  message: string;
}>;

export type BoxPleatingPackingSemanticsParseResult =
  | Readonly<{ ok: true; value: BoxPleatingPackingSemanticsV1 }>
  | Readonly<{ ok: false; error: readonly BoxPleatingPackingSemanticsIssue[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'scope',
  'interpretation',
  'adrStatus',
  'experimentStatus',
  'leafAnchorRole',
  'lengthRole',
  'coordinateScale',
  'pairwiseNecessaryFilter',
  'filterStrength',
  'tangencyPolicy',
  'widthRole',
  'maximumWidthRole',
  'manhattanMetricSelected',
  'chebyshevMetricSelected',
  'globalMetricSelectionIncluded',
  'pairwiseNecessaryFilterIsGlobalMetric',
  'constructionFamily',
  'constructionFamilySelectionIncluded',
  'finishedWidthGeometryPolicy',
  'polygonGeometryPolicy',
  'riverGeometryPolicy',
  'junctionGeometryPolicy',
  'residualPaperPolicy',
  'boundaryPolicy',
  'overlapPolicy',
  'gadgetPolicy',
  'pureMinimumSquareAdopted',
  'pythagoreanStretchAdopted',
  'generalizedOffsetPythagoreanStretchAdopted',
  'actualGeometryConstraintEvaluable',
  'globalPackingConstraintEvaluable',
  'filterEvaluationIncluded',
  'placementIncluded',
  'packingIncluded',
  'geometryIncluded',
  'creasePatternIncluded',
  'mountainValleyIncluded',
  'foldabilityIncluded',
  'feasibilityDecisionIncluded',
  'globalM0fGo',
  'isSupportProfile',
  'supportClaim',
  'verifiedClaim',
] as const satisfies readonly (keyof BoxPleatingPackingSemanticsV1)[];

const CLAIM_BOUNDARY_KEYS = new Set<keyof BoxPleatingPackingSemanticsV1>([
  'contractStatus',
  'scientificClaim',
  'manhattanMetricSelected',
  'chebyshevMetricSelected',
  'globalMetricSelectionIncluded',
  'pairwiseNecessaryFilterIsGlobalMetric',
  'constructionFamilySelectionIncluded',
  'pureMinimumSquareAdopted',
  'pythagoreanStretchAdopted',
  'generalizedOffsetPythagoreanStretchAdopted',
  'actualGeometryConstraintEvaluable',
  'globalPackingConstraintEvaluable',
  'filterEvaluationIncluded',
  'placementIncluded',
  'packingIncluded',
  'geometryIncluded',
  'creasePatternIncluded',
  'mountainValleyIncluded',
  'foldabilityIncluded',
  'feasibilityDecisionIncluded',
  'globalM0fGo',
  'isSupportProfile',
  'supportClaim',
  'verifiedClaim',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issue(
  path: string,
  code: BoxPleatingPackingSemanticsIssue['code'],
  message: string,
): BoxPleatingPackingSemanticsIssue {
  return { path, code, message };
}

/**
 * Parses only the closed v1 candidate record and returns its canonical frozen
 * semantics. It does not evaluate the filter or select any packing family.
 */
export function parseBoxPleatingPackingSemanticsV1(
  supplied: unknown,
): BoxPleatingPackingSemanticsParseResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: 0,
    maxContainerCount: 8,
    maxDepth: 2,
    maxObjectPropertyCount: 64,
    maxPropertyNameCodeUnits: 64,
    maxStringCodeUnits: 256,
    maxTotalStringCodeUnits: 8_192,
    maxTotalPropertyCount: 128,
  });
  if (!snapshot.ok) {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        issue(
          '$',
          'invalid-snapshot',
          'input must be one bounded acyclic plain snapshot without accessors',
        ),
      ],
    });
  }
  if (!isRecord(snapshot.value)) {
    return deepFreezeOwned({
      ok: false as const,
      error: [issue('$', 'invalid-object', 'packing semantics input must be an object')],
    });
  }

  const raw = snapshot.value;
  const issues: BoxPleatingPackingSemanticsIssue[] = [];
  const allowed = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(raw).sort()) {
    if (!allowed.has(key)) {
      issues.push(issue(`$.${key}`, 'unknown-field', 'field is not declared by semantics v1'));
    }
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      issues.push(issue(`$.${key}`, 'missing-field', 'required field is missing'));
      continue;
    }
    if (raw[key] !== BOX_PLEATING_PACKING_SEMANTICS_V1[key]) {
      const claimBoundary = CLAIM_BOUNDARY_KEYS.has(key);
      issues.push(
        issue(
          `$.${key}`,
          claimBoundary ? 'claim-boundary' : 'invalid-literal',
          claimBoundary
            ? `must equal ${String(BOX_PLEATING_PACKING_SEMANTICS_V1[key])} at this candidate boundary`
            : `must equal ${String(BOX_PLEATING_PACKING_SEMANTICS_V1[key])}`,
        ),
      );
    }
  }

  if (issues.length > 0) {
    return deepFreezeOwned({ ok: false as const, error: issues });
  }
  return deepFreezeOwned({ ok: true as const, value: BOX_PLEATING_PACKING_SEMANTICS_V1 });
}
