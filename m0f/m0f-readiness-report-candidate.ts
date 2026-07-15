import { createHash } from 'node:crypto';

import { deepFreezeOwned } from './clone-and-freeze.js';
import {
  M0F_PRODUCT_HANDOFF_DIAGNOSTIC_RESULT_RECORD_TYPE,
  type M0fProductHandoffDiagnosticResultV1,
} from './m0f-product-handoff-diagnostic.js';
import { serializeJsonLine, stableStringify } from './stable-json.js';

export const M0F_READINESS_REPORT_CANDIDATE_RECORD_TYPE =
  'm0f-readiness-report-artifact-candidate' as const;
export const M0F_READINESS_REPORT_CANDIDATE_MARKDOWN_PATH =
  'M0F_READINESS_REPORT.candidate.md' as const;
export const M0F_READINESS_REPORT_DIAGNOSTIC_PATH = 'readiness-diagnostic.json' as const;
export const M0F_READINESS_REPORT_CANDIDATE_MANIFEST_PATH = 'manifest.json' as const;
export const M0F_FINAL_REPORT_RESERVED_PATH = 'M0F_REPORT.md' as const;

type HashedReadinessFileV1<Path extends string> = Readonly<{
  path: Path;
  byteLength: number;
  hashBasis: 'sha256-of-exact-utf8-file-bytes';
  sha256: string;
}>;

type M0fReadinessReportCandidateManifestPayloadV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof M0F_READINESS_REPORT_CANDIDATE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  artifactKind: 'fail-closed-readiness-report-not-final-m0f-report';
  readinessDecision: 'not-ready';
  handoffReady: false;
  m0fReportIncluded: false;
  m0fDecisionRecorded: false;
  finalDecision: 'not-recorded';
  globalM0fGo: false;
  productImplementationStartAuthorized: false;
  finalReportReservedPath: typeof M0F_FINAL_REPORT_RESERVED_PATH;
  candidateMarkdown: HashedReadinessFileV1<typeof M0F_READINESS_REPORT_CANDIDATE_MARKDOWN_PATH>;
  sourceDiagnostic: HashedReadinessFileV1<typeof M0F_READINESS_REPORT_DIAGNOSTIC_PATH> &
    Readonly<{
      recordType: typeof M0F_PRODUCT_HANDOFF_DIAGNOSTIC_RESULT_RECORD_TYPE;
    }>;
  summary: Readonly<{
    blockingAreaCount: number;
    unmetGoConditionCount: 14;
    unmetRequiredDeliverableCount: 14;
    missingCanonicalFixtureCount: number;
  }>;
  limitations: Readonly<{
    registeredFinalEvidenceIncluded: false;
    finalGoNoGoDecisionIncluded: false;
    normativeM0fReportIncluded: false;
    productStartAuthorizationIncluded: false;
  }>;
}>;

export type M0fReadinessReportCandidateManifestV1 = M0fReadinessReportCandidateManifestPayloadV1 &
  Readonly<{
    manifestPayloadSha256: string;
  }>;

export type M0fReadinessReportCandidateArtifactV1 = Readonly<{
  markdown: string;
  diagnosticJson: string;
  manifest: M0fReadinessReportCandidateManifestV1;
  manifestJson: string;
}>;

export type M0fReadinessReportCandidateVerificationIssueV1 = Readonly<{
  code: string;
  message: string;
}>;

const MANIFEST_HASH_DOMAIN = 'oridesign:m0f-readiness-report-candidate-manifest:v1\0';
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

function sha256Utf8(value: string): string {
  return `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

function hashedFile<Path extends string>(path: Path, value: string): HashedReadinessFileV1<Path> {
  return {
    path,
    byteLength: Buffer.byteLength(value, 'utf8'),
    hashBasis: 'sha256-of-exact-utf8-file-bytes',
    sha256: sha256Utf8(value),
  };
}

function escapeTable(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll(/\r?\n/g, ' ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function listNumbers(values: readonly number[]): string {
  return values.length === 0 ? '—' : values.join(', ');
}

function assertFailClosedDiagnostic(
  diagnostic: unknown,
): asserts diagnostic is M0fProductHandoffDiagnosticResultV1 {
  if (!isRecord(diagnostic)) {
    throw new TypeError('readiness report input must remain a fail-closed handoff diagnostic');
  }
  const candidate = diagnostic;
  if (
    candidate.schemaVersion !== 1 ||
    candidate.recordType !== M0F_PRODUCT_HANDOFF_DIAGNOSTIC_RESULT_RECORD_TYPE ||
    candidate.contractStatus !== 'candidate' ||
    candidate.scientificClaim !== false ||
    candidate.readinessDecision !== 'not-ready' ||
    candidate.handoffReady !== false ||
    candidate.m0fReportIncluded !== false ||
    candidate.m0fDecisionRecorded !== false ||
    candidate.finalDecision !== 'not-recorded' ||
    candidate.globalM0fGo !== false ||
    candidate.productImplementationStartAuthorized !== false ||
    candidate.unmetGoConditionCount !== 14 ||
    candidate.unmetRequiredDeliverableCount !== 14
  ) {
    throw new TypeError('readiness report input must remain a fail-closed handoff diagnostic');
  }
  if (
    !Array.isArray(diagnostic.areas) ||
    !Array.isArray(diagnostic.unmetGoConditions) ||
    !Array.isArray(diagnostic.unmetRequiredDeliverables) ||
    !isRecord(diagnostic.readiness) ||
    !isRecord(diagnostic.readiness.catalog) ||
    !Number.isSafeInteger(diagnostic.blockingAreaCount) ||
    diagnostic.blockingAreaCount !== diagnostic.areas.length
  ) {
    throw new TypeError('readiness report input has an incomplete diagnostic structure');
  }
  const goNumbers = diagnostic.unmetGoConditions.map((entry) =>
    isRecord(entry) && Number.isSafeInteger(entry.conditionNumber)
      ? (entry.conditionNumber as number)
      : Number.NaN,
  );
  const deliverableNumbers = diagnostic.unmetRequiredDeliverables.map((entry) =>
    isRecord(entry) && Number.isSafeInteger(entry.deliverableNumber)
      ? (entry.deliverableNumber as number)
      : Number.NaN,
  );
  if (
    goNumbers.length !== 14 ||
    deliverableNumbers.length !== 14 ||
    goNumbers.some((value, index) => value !== index + 1) ||
    deliverableNumbers.some((value, index) => value !== index + 1)
  ) {
    throw new TypeError('readiness report requires normative numbers 1 through 14 in order');
  }
}

export function renderM0fReadinessReportCandidateMarkdownV1(
  diagnostic: M0fProductHandoffDiagnosticResultV1,
): string {
  assertFailClosedDiagnostic(diagnostic);
  const lines = [
    '# M0F Readiness Report — Candidate Diagnostic',
    '',
    '> **NOT READY. This file is not `M0F_REPORT.md`, is not a GO/NO-GO decision, and does not authorize product implementation.**',
    '',
    '## Claim boundary',
    '',
    `- Readiness decision: \`${diagnostic.readinessDecision}\``,
    `- Final decision: \`${diagnostic.finalDecision}\``,
    '- Global M0F GO: `false`',
    '- Product implementation start authorized: `false`',
    `- Reserved final report path: \`${M0F_FINAL_REPORT_RESERVED_PATH}\``,
    `- This candidate artifact path: \`${M0F_READINESS_REPORT_CANDIDATE_MARKDOWN_PATH}\``,
    '',
    'The reserved final report may be created only from registered final evidence after every GO condition is evaluated. This candidate file must not be renamed or cited as that deliverable.',
    '',
    '## Current summary',
    '',
    `- Blocking evidence areas: ${diagnostic.blockingAreaCount}`,
    `- Unmet GO conditions: ${diagnostic.unmetGoConditionCount} / 14`,
    `- Unmet required deliverables: ${diagnostic.unmetRequiredDeliverableCount} / 14`,
    `- Fixture catalog status: \`${diagnostic.readiness.catalog.status}\``,
    `- Fixture repository errors: ${diagnostic.readiness.catalog.errorCount}`,
    `- Missing canonical fixture rules: ${diagnostic.readiness.catalog.missingCanonicalFixtureCount}`,
    '',
    '## Blocking evidence areas',
    '',
    '| Area | Reason code | GO conditions | Deliverables | Status | Next action |',
    '| --- | --- | ---: | ---: | --- | --- |',
    ...diagnostic.areas.map(
      (area) =>
        `| ${escapeTable(area.areaId)} | ${escapeTable(area.reasonCode)} | ${listNumbers(area.goConditionNumbers)} | ${listNumbers(area.requiredDeliverableNumbers)} | ${area.status} | ${escapeTable(area.nextAction)} |`,
    ),
    '',
    '## Missing canonical fixture rules',
    '',
    ...(diagnostic.readiness.catalog.missingCanonicalPatterns.length === 0
      ? [
          '- None reported by the catalog diagnostic. Catalog completeness alone does not open the final gate.',
        ]
      : diagnostic.readiness.catalog.missingCanonicalPatterns.map((pattern) => `- \`${pattern}\``)),
    '',
    '## Unmet GO-condition mapping',
    '',
    '| Condition | Area | Reason code |',
    '| ---: | --- | --- |',
    ...diagnostic.unmetGoConditions.map(
      (entry) =>
        `| ${entry.conditionNumber} | ${escapeTable(entry.areaId)} | ${escapeTable(entry.reasonCode)} |`,
    ),
    '',
    '## Unmet required-deliverable mapping',
    '',
    '| Deliverable | Area | Reason code |',
    '| ---: | --- | --- |',
    ...diagnostic.unmetRequiredDeliverables.map(
      (entry) =>
        `| ${entry.deliverableNumber} | ${escapeTable(entry.areaId)} | ${escapeTable(entry.reasonCode)} |`,
    ),
    '',
    '## Interpretation',
    '',
    'Candidate experiments, candidate fixtures, smoke measurements, and hash-bound diagnostics may reduce uncertainty, but they do not become registered final evidence merely by appearing here. The machine-readable diagnostic and this Markdown are byte-hash-bound by the adjacent candidate manifest.',
    '',
  ];
  return lines.join('\n');
}

function manifestPayloadHash(payload: M0fReadinessReportCandidateManifestPayloadV1): string {
  return sha256Utf8(`${MANIFEST_HASH_DOMAIN}${stableStringify(payload)}`);
}

export function createM0fReadinessReportCandidateArtifactV1(
  diagnostic: M0fProductHandoffDiagnosticResultV1,
): M0fReadinessReportCandidateArtifactV1 {
  assertFailClosedDiagnostic(diagnostic);
  const markdown = renderM0fReadinessReportCandidateMarkdownV1(diagnostic);
  const diagnosticJson = serializeJsonLine(diagnostic);
  const payload: M0fReadinessReportCandidateManifestPayloadV1 = deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: M0F_READINESS_REPORT_CANDIDATE_RECORD_TYPE,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    artifactKind: 'fail-closed-readiness-report-not-final-m0f-report' as const,
    readinessDecision: 'not-ready' as const,
    handoffReady: false as const,
    m0fReportIncluded: false as const,
    m0fDecisionRecorded: false as const,
    finalDecision: 'not-recorded' as const,
    globalM0fGo: false as const,
    productImplementationStartAuthorized: false as const,
    finalReportReservedPath: M0F_FINAL_REPORT_RESERVED_PATH,
    candidateMarkdown: hashedFile(M0F_READINESS_REPORT_CANDIDATE_MARKDOWN_PATH, markdown),
    sourceDiagnostic: {
      ...hashedFile(M0F_READINESS_REPORT_DIAGNOSTIC_PATH, diagnosticJson),
      recordType: M0F_PRODUCT_HANDOFF_DIAGNOSTIC_RESULT_RECORD_TYPE,
    },
    summary: {
      blockingAreaCount: diagnostic.blockingAreaCount,
      unmetGoConditionCount: 14 as const,
      unmetRequiredDeliverableCount: 14 as const,
      missingCanonicalFixtureCount: diagnostic.readiness.catalog.missingCanonicalFixtureCount,
    },
    limitations: {
      registeredFinalEvidenceIncluded: false as const,
      finalGoNoGoDecisionIncluded: false as const,
      normativeM0fReportIncluded: false as const,
      productStartAuthorizationIncluded: false as const,
    },
  });
  const manifest: M0fReadinessReportCandidateManifestV1 = deepFreezeOwned({
    ...payload,
    manifestPayloadSha256: manifestPayloadHash(payload),
  });
  return deepFreezeOwned({
    markdown,
    diagnosticJson,
    manifest,
    manifestJson: serializeJsonLine(manifest),
  });
}

export function verifyM0fReadinessReportCandidateArtifactV1(
  markdown: string,
  diagnosticJson: string,
  manifest: M0fReadinessReportCandidateManifestV1,
): readonly M0fReadinessReportCandidateVerificationIssueV1[] {
  const issues: M0fReadinessReportCandidateVerificationIssueV1[] = [];
  for (const [label, value, descriptor] of [
    ['candidate Markdown', markdown, manifest.candidateMarkdown],
    ['source diagnostic', diagnosticJson, manifest.sourceDiagnostic],
  ] as const) {
    if (descriptor.byteLength !== Buffer.byteLength(value, 'utf8')) {
      issues.push({ code: 'byte-length-mismatch', message: `${label} byte length changed` });
    }
    if (descriptor.sha256 !== sha256Utf8(value)) {
      issues.push({ code: 'file-sha256-mismatch', message: `${label} hash changed` });
    }
  }
  const { manifestPayloadSha256, ...payload } = manifest;
  if (!SHA256_PATTERN.test(manifestPayloadSha256)) {
    issues.push({ code: 'invalid-manifest-sha256', message: 'manifest hash format is invalid' });
  }
  if (
    manifestPayloadSha256 !==
    manifestPayloadHash(payload as M0fReadinessReportCandidateManifestPayloadV1)
  ) {
    issues.push({ code: 'manifest-sha256-mismatch', message: 'manifest payload changed' });
  }
  try {
    const parsed = JSON.parse(diagnosticJson) as M0fProductHandoffDiagnosticResultV1;
    assertFailClosedDiagnostic(parsed);
    if (renderM0fReadinessReportCandidateMarkdownV1(parsed) !== markdown) {
      issues.push({
        code: 'report-diagnostic-mismatch',
        message: 'Markdown differs from diagnostic',
      });
    }
  } catch {
    issues.push({
      code: 'invalid-source-diagnostic',
      message: 'diagnostic is not fail-closed JSON',
    });
  }
  return deepFreezeOwned(issues);
}
