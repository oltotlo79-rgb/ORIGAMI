import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { CANONICAL_FIXTURE_RULES } from '../../m0f/canonical-fixtures.js';
import {
  M0F_FINAL_REPORT_RESERVED_PATH,
  M0F_READINESS_REPORT_CANDIDATE_MANIFEST_PATH,
  M0F_READINESS_REPORT_CANDIDATE_MARKDOWN_PATH,
  M0F_READINESS_REPORT_DIAGNOSTIC_PATH,
  createM0fReadinessReportCandidateArtifactV1,
  verifyM0fReadinessReportCandidateArtifactV1,
} from '../../m0f/m0f-readiness-report-candidate.js';
import {
  runM0fReadinessReportCandidateCli,
  type M0fReadinessReportCandidateCliIo,
} from '../../m0f/m0f-readiness-report-candidate-cli.js';
import {
  M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE,
  evaluateM0fProductHandoffDiagnosticV1,
  type M0fProductHandoffDiagnosticResultV1,
} from '../../m0f/m0f-product-handoff-diagnostic.js';

function currentBlockedDiagnostic(): M0fProductHandoffDiagnosticResultV1 {
  const patterns = CANONICAL_FIXTURE_RULES.map(({ pattern }) => pattern);
  const evaluated = evaluateM0fProductHandoffDiagnosticV1({
    schemaVersion: 1,
    recordType: M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    catalog: {
      complete: false,
      errorCount: patterns.length,
      missingCanonicalPatterns: patterns,
    },
  });
  if (!evaluated.ok) throw new Error(JSON.stringify(evaluated.error));
  return evaluated.value;
}

function capture(): Readonly<{
  stdout: string[];
  stderr: string[];
  io: M0fReadinessReportCandidateCliIo;
}> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    stdout,
    stderr,
    io: {
      cwd: process.cwd(),
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    },
  };
}

describe('candidate M0F readiness report artifact', () => {
  it('renders deterministic fail-closed Markdown and binds both generated files', () => {
    const diagnostic = currentBlockedDiagnostic();
    const first = createM0fReadinessReportCandidateArtifactV1(diagnostic);
    const second = createM0fReadinessReportCandidateArtifactV1(diagnostic);

    expect(first).toEqual(second);
    expect(first.markdown).toContain('# M0F Readiness Report — Candidate Diagnostic');
    expect(first.markdown).toContain('**NOT READY.');
    expect(first.markdown).toContain(
      `Reserved final report path: \`${M0F_FINAL_REPORT_RESERVED_PATH}\``,
    );
    expect(first.markdown).toContain('Product implementation start authorized: `false`');
    expect(first.markdown).not.toContain('# M0F_REPORT');
    expect(first.manifest).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      artifactKind: 'fail-closed-readiness-report-not-final-m0f-report',
      readinessDecision: 'not-ready',
      handoffReady: false,
      m0fReportIncluded: false,
      m0fDecisionRecorded: false,
      finalDecision: 'not-recorded',
      globalM0fGo: false,
      productImplementationStartAuthorized: false,
      finalReportReservedPath: 'M0F_REPORT.md',
      candidateMarkdown: { path: M0F_READINESS_REPORT_CANDIDATE_MARKDOWN_PATH },
      sourceDiagnostic: { path: M0F_READINESS_REPORT_DIAGNOSTIC_PATH },
      summary: {
        blockingAreaCount: 10,
        unmetGoConditionCount: 14,
        unmetRequiredDeliverableCount: 14,
        missingCanonicalFixtureCount: 27,
      },
    });
    expect(
      verifyM0fReadinessReportCandidateArtifactV1(
        first.markdown,
        first.diagnosticJson,
        first.manifest,
      ),
    ).toEqual([]);
  });

  it('detects candidate Markdown, diagnostic, and manifest drift', () => {
    const artifact = createM0fReadinessReportCandidateArtifactV1(currentBlockedDiagnostic());
    expect(
      verifyM0fReadinessReportCandidateArtifactV1(
        `${artifact.markdown}\nchanged`,
        artifact.diagnosticJson,
        artifact.manifest,
      ).map(({ code }) => code),
    ).toEqual(expect.arrayContaining(['byte-length-mismatch', 'file-sha256-mismatch']));
    expect(
      verifyM0fReadinessReportCandidateArtifactV1(artifact.markdown, artifact.diagnosticJson, {
        ...artifact.manifest,
        blockingAreaCount: 0,
      } as never).map(({ code }) => code),
    ).toContain('manifest-sha256-mismatch');
  });

  it('writes only the candidate-named report, diagnostic, and manifest through the CLI', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'oridesign-m0f-readiness-'));
    const captured = capture();
    try {
      expect(await runM0fReadinessReportCandidateCli([outputDirectory], captured.io)).toBe(0);
      expect(captured.stderr).toEqual([]);
      const [markdown, diagnosticJson, manifestJson] = await Promise.all([
        readFile(join(outputDirectory, M0F_READINESS_REPORT_CANDIDATE_MARKDOWN_PATH), 'utf8'),
        readFile(join(outputDirectory, M0F_READINESS_REPORT_DIAGNOSTIC_PATH), 'utf8'),
        readFile(join(outputDirectory, M0F_READINESS_REPORT_CANDIDATE_MANIFEST_PATH), 'utf8'),
      ]);
      expect(markdown).toContain('This file is not `M0F_REPORT.md`');
      expect(JSON.parse(diagnosticJson)).toMatchObject({
        finalDecision: 'not-recorded',
        globalM0fGo: false,
      });
      expect(JSON.parse(manifestJson)).toEqual(JSON.parse(captured.stdout[0] ?? 'null'));
      await expect(
        readFile(join(outputDirectory, M0F_FINAL_REPORT_RESERVED_PATH), 'utf8'),
      ).rejects.toThrow();
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
});
