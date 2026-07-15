import { CANONICAL_FIXTURE_RULES } from './canonical-fixtures.js';
import { deepFreezeOwned } from './clone-and-freeze.js';
import {
  createM0fFinalEvidenceGateReadinessV1,
  type M0fFinalEvidenceGateAreaDiagnosticV1,
  type M0fFinalEvidenceGateAreaReasonCodeV1,
  type M0fFinalEvidenceGateReadinessV1,
  type M0fGoConditionNumber,
  type M0fRequiredDeliverableNumber,
} from './final-evidence-gate-readiness.js';
import { tryCreateStrictValidationSnapshot } from './strict-validation-snapshot.js';

export const M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE =
  'm0f-product-handoff-diagnostic-input' as const;
export const M0F_PRODUCT_HANDOFF_DIAGNOSTIC_RESULT_RECORD_TYPE =
  'm0f-product-handoff-diagnostic-result' as const;

export const M0F_PRODUCT_HANDOFF_DIAGNOSTIC_LIMITS = deepFreezeOwned({
  maxArrayLength: 64,
  maxContainerCount: 96,
  maxDepth: 5,
  maxObjectPropertyCount: 16,
  maxPropertyNameCodeUnits: 96,
  maxStringCodeUnits: 256,
  maxTotalStringCodeUnits: 32_768,
  maxTotalPropertyCount: 512,
});

export type M0fProductHandoffDiagnosticInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  catalog: Readonly<{
    complete: boolean;
    errorCount: number;
    missingCanonicalPatterns: readonly string[];
  }>;
}>;

type AreaId = M0fFinalEvidenceGateAreaDiagnosticV1['areaId'];

export type M0fProductHandoffGoConditionV1 = Readonly<{
  conditionNumber: M0fGoConditionNumber;
  areaId: AreaId;
  reasonCode: M0fFinalEvidenceGateAreaReasonCodeV1;
  status: 'not-evaluated';
  blocking: true;
}>;

export type M0fProductHandoffRequiredDeliverableV1 = Readonly<{
  deliverableNumber: M0fRequiredDeliverableNumber;
  areaId: AreaId;
  reasonCode: M0fFinalEvidenceGateAreaReasonCodeV1;
  status: 'not-evaluated';
  blocking: true;
}>;

export type M0fProductHandoffDiagnosticResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof M0F_PRODUCT_HANDOFF_DIAGNOSTIC_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  outputKind: 'fail-closed-m0f-handoff-readiness-not-final-go-no-go-decision';
  readinessDecision: 'not-ready';
  handoffReady: false;
  m0fReportIncluded: false;
  m0fDecisionRecorded: false;
  finalDecision: 'not-recorded';
  globalM0fGo: false;
  productImplementationStartAuthorized: false;
  productStartPolicy: 'recorded-m0f-go-and-zero-blockers-required';
  frozenSupportProfileIncluded: false;
  frozenToleranceProfileIncluded: false;
  frozenRuntimeLimitsIncluded: false;
  finalReferenceVerifierEvidenceIncluded: false;
  finalBrowserRuntimeEvidenceIncluded: false;
  finalLicenseProvenanceAuditIncluded: false;
  frozenProductContractsIncluded: false;
  allNormativeNumbersEnumeratedExactlyOnce: true;
  unmetGoConditionCount: 14;
  unmetRequiredDeliverableCount: 14;
  blockingAreaCount: number;
  readiness: M0fFinalEvidenceGateReadinessV1;
  areas: readonly M0fFinalEvidenceGateAreaDiagnosticV1[];
  unmetGoConditions: readonly M0fProductHandoffGoConditionV1[];
  unmetRequiredDeliverables: readonly M0fProductHandoffRequiredDeliverableV1[];
  productStartCondition: Readonly<{
    predicateId: 'm0f-product-start-authorization-v1';
    operator: 'all';
    value: false;
    signals: readonly Readonly<{
      signalId:
        | 'canonical-fixture-catalog-complete'
        | 'zero-blocking-evidence-areas'
        | 'all-go-conditions-met'
        | 'all-required-deliverables-present'
        | 'm0f-report-included'
        | 'recorded-final-go-decision';
      satisfied: boolean;
    }>[];
  }>;
}>;

export type M0fProductHandoffDiagnosticIssueV1 = Readonly<{
  stage: 'snapshot' | 'input' | 'catalog' | 'mapping';
  path: string;
  code: string;
  message: string;
}>;

export type M0fProductHandoffDiagnosticEvaluationV1 =
  | Readonly<{ ok: true; value: M0fProductHandoffDiagnosticResultV1 }>
  | Readonly<{ ok: false; error: readonly M0fProductHandoffDiagnosticIssueV1[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'catalog',
] as const;
const CATALOG_KEYS = ['complete', 'errorCount', 'missingCanonicalPatterns'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issue(
  stage: M0fProductHandoffDiagnosticIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): M0fProductHandoffDiagnosticIssueV1 {
  return { stage, path, code, message };
}

function failure(
  error: readonly M0fProductHandoffDiagnosticIssueV1[],
): M0fProductHandoffDiagnosticEvaluationV1 {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function exactKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  stage: M0fProductHandoffDiagnosticIssueV1['stage'],
): M0fProductHandoffDiagnosticIssueV1[] {
  const issues: M0fProductHandoffDiagnosticIssueV1[] = [];
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key))
      issues.push(issue(stage, `${path}.${key}`, 'unknown-field', 'field is not declared'));
  }
  for (const key of allowedKeys) {
    if (!Object.hasOwn(value, key))
      issues.push(issue(stage, `${path}.${key}`, 'missing-field', 'required field is missing'));
  }
  return issues;
}

function expectedOneThroughFourteen(values: readonly number[]): boolean {
  return values.length === 14 && values.every((value, index) => value === index + 1);
}

/**
 * Flattens the existing fail-closed readiness record into a product handoff
 * diagnostic. It neither creates M0F_REPORT.md nor records a final GO/NO-GO
 * decision.
 */
export function evaluateM0fProductHandoffDiagnosticV1(
  supplied: unknown,
): M0fProductHandoffDiagnosticEvaluationV1 {
  const snapshot = tryCreateStrictValidationSnapshot(
    supplied,
    M0F_PRODUCT_HANDOFF_DIAGNOSTIC_LIMITS,
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
  if (!isRecord(snapshot.value))
    return failure([issue('input', '$', 'invalid-object', 'handoff input must be an object')]);

  const inputIssues = exactKeys(snapshot.value, ROOT_KEYS, '$', 'input');
  if (snapshot.value.schemaVersion !== 1)
    inputIssues.push(issue('input', '$.schemaVersion', 'invalid-literal', 'must equal 1'));
  if (snapshot.value.recordType !== M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE) {
    inputIssues.push(
      issue(
        'input',
        '$.recordType',
        'invalid-literal',
        `must equal ${M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE}`,
      ),
    );
  }
  if (snapshot.value.contractStatus !== 'candidate')
    inputIssues.push(issue('input', '$.contractStatus', 'claim-boundary', 'must remain candidate'));
  if (snapshot.value.scientificClaim !== false)
    inputIssues.push(issue('input', '$.scientificClaim', 'claim-boundary', 'must remain false'));
  if (inputIssues.length > 0) return failure(inputIssues);

  if (!isRecord(snapshot.value.catalog))
    return failure([issue('catalog', '$.catalog', 'invalid-object', 'catalog must be an object')]);
  const catalog = snapshot.value.catalog;
  const catalogIssues = exactKeys(catalog, CATALOG_KEYS, '$.catalog', 'catalog');
  if (typeof catalog.complete !== 'boolean')
    catalogIssues.push(
      issue('catalog', '$.catalog.complete', 'invalid-boolean', 'must be boolean'),
    );
  if (!Number.isSafeInteger(catalog.errorCount) || (catalog.errorCount as number) < 0) {
    catalogIssues.push(
      issue(
        'catalog',
        '$.catalog.errorCount',
        'invalid-count',
        'must be a nonnegative safe integer',
      ),
    );
  }
  const patterns = catalog.missingCanonicalPatterns;
  if (!Array.isArray(patterns)) {
    catalogIssues.push(
      issue('catalog', '$.catalog.missingCanonicalPatterns', 'invalid-array', 'must be an array'),
    );
  }
  const knownPatterns = new Set(CANONICAL_FIXTURE_RULES.map((rule) => rule.pattern));
  const normalizedPatterns: string[] = [];
  if (Array.isArray(patterns)) {
    const seen = new Set<string>();
    patterns.forEach((pattern, index) => {
      const path = `$.catalog.missingCanonicalPatterns[${String(index)}]`;
      if (typeof pattern !== 'string' || pattern.length === 0) {
        catalogIssues.push(issue('catalog', path, 'invalid-pattern', 'must be a non-empty string'));
      } else if (!knownPatterns.has(pattern)) {
        catalogIssues.push(issue('catalog', path, 'unknown-pattern', 'must name a canonical rule'));
      } else if (seen.has(pattern)) {
        catalogIssues.push(issue('catalog', path, 'duplicate-pattern', 'patterns must be unique'));
      } else {
        seen.add(pattern);
        normalizedPatterns.push(pattern);
      }
    });
  }
  if (
    typeof catalog.complete === 'boolean' &&
    Number.isSafeInteger(catalog.errorCount) &&
    Array.isArray(patterns)
  ) {
    const errorCount = catalog.errorCount as number;
    if (catalog.complete && (errorCount !== 0 || patterns.length !== 0)) {
      catalogIssues.push(
        issue(
          'catalog',
          '$.catalog',
          'inconsistent-completeness',
          'complete catalog must have zero errors and no missing patterns',
        ),
      );
    }
    if (!catalog.complete && errorCount === 0) {
      catalogIssues.push(
        issue(
          'catalog',
          '$.catalog.errorCount',
          'inconsistent-completeness',
          'incomplete catalog must have at least one error',
        ),
      );
    }
    if (errorCount < normalizedPatterns.length) {
      catalogIssues.push(
        issue(
          'catalog',
          '$.catalog.errorCount',
          'inconsistent-error-count',
          'error count cannot be smaller than the missing-pattern count',
        ),
      );
    }
  }
  if (catalogIssues.length > 0) return failure(catalogIssues);

  const readiness = createM0fFinalEvidenceGateReadinessV1({
    catalogComplete: catalog.complete as boolean,
    catalogErrorCount: catalog.errorCount as number,
    missingCanonicalPatterns: normalizedPatterns,
  });
  const unmetGoConditions = readiness.areas
    .flatMap((area) =>
      area.goConditionNumbers.map((conditionNumber) => ({
        conditionNumber,
        areaId: area.areaId,
        reasonCode: area.reasonCode,
        status: area.status,
        blocking: area.blocking,
      })),
    )
    .sort((left, right) => left.conditionNumber - right.conditionNumber);
  const unmetRequiredDeliverables = readiness.areas
    .flatMap((area) =>
      area.requiredDeliverableNumbers.map((deliverableNumber) => ({
        deliverableNumber,
        areaId: area.areaId,
        reasonCode: area.reasonCode,
        status: area.status,
        blocking: area.blocking,
      })),
    )
    .sort((left, right) => left.deliverableNumber - right.deliverableNumber);
  if (
    !expectedOneThroughFourteen(unmetGoConditions.map((entry) => entry.conditionNumber)) ||
    !expectedOneThroughFourteen(unmetRequiredDeliverables.map((entry) => entry.deliverableNumber))
  ) {
    return failure([
      issue(
        'mapping',
        '$',
        'incomplete-normative-mapping',
        'readiness areas must cover GO conditions and deliverables 1 through 14 exactly once',
      ),
    ]);
  }

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: M0F_PRODUCT_HANDOFF_DIAGNOSTIC_RESULT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      outputKind: 'fail-closed-m0f-handoff-readiness-not-final-go-no-go-decision' as const,
      readinessDecision: readiness.decision,
      handoffReady: false as const,
      m0fReportIncluded: false as const,
      m0fDecisionRecorded: false as const,
      finalDecision: 'not-recorded' as const,
      globalM0fGo: false as const,
      productImplementationStartAuthorized: false as const,
      productStartPolicy: 'recorded-m0f-go-and-zero-blockers-required' as const,
      frozenSupportProfileIncluded: false as const,
      frozenToleranceProfileIncluded: false as const,
      frozenRuntimeLimitsIncluded: false as const,
      finalReferenceVerifierEvidenceIncluded: false as const,
      finalBrowserRuntimeEvidenceIncluded: false as const,
      finalLicenseProvenanceAuditIncluded: false as const,
      frozenProductContractsIncluded: false as const,
      allNormativeNumbersEnumeratedExactlyOnce: true as const,
      unmetGoConditionCount: 14 as const,
      unmetRequiredDeliverableCount: 14 as const,
      blockingAreaCount: readiness.summary.blockingAreaCount,
      readiness,
      areas: readiness.areas,
      unmetGoConditions,
      unmetRequiredDeliverables,
      productStartCondition: {
        predicateId: 'm0f-product-start-authorization-v1' as const,
        operator: 'all' as const,
        value: false as const,
        signals: [
          {
            signalId: 'canonical-fixture-catalog-complete' as const,
            satisfied: readiness.catalog.complete,
          },
          { signalId: 'zero-blocking-evidence-areas' as const, satisfied: false },
          { signalId: 'all-go-conditions-met' as const, satisfied: false },
          { signalId: 'all-required-deliverables-present' as const, satisfied: false },
          { signalId: 'm0f-report-included' as const, satisfied: false },
          { signalId: 'recorded-final-go-decision' as const, satisfied: false },
        ],
      },
    },
  });
}
