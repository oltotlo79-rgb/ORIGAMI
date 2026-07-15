import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  M0F_READINESS_REPORT_CANDIDATE_MANIFEST_PATH,
  M0F_READINESS_REPORT_CANDIDATE_MARKDOWN_PATH,
  M0F_READINESS_REPORT_DIAGNOSTIC_PATH,
  createM0fReadinessReportCandidateArtifactV1,
  verifyM0fReadinessReportCandidateArtifactV1,
} from './m0f-readiness-report-candidate.js';
import { createDefaultM0fProductHandoffDiagnosticInput } from './m0f-product-handoff-diagnostic-cli.js';
import { evaluateM0fProductHandoffDiagnosticV1 } from './m0f-product-handoff-diagnostic.js';

const USAGE = `Usage: npm run m0f:readiness-report -- [output-directory]

Writes a fail-closed candidate readiness report, its source diagnostic, and a
hash-binding manifest. The default output directory is
.artifacts/m0f-readiness-report. This does not create M0F_REPORT.md, record a
GO/NO-GO decision, set global M0F GO, or authorize product implementation.
`;

export type M0fReadinessReportCandidateCliIo = Readonly<{
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): M0fReadinessReportCandidateCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

export async function runM0fReadinessReportCandidateCli(
  arguments_: readonly string[],
  io: M0fReadinessReportCandidateCliIo = defaultIo(),
): Promise<number> {
  if (arguments_.length === 1 && (arguments_[0] === '--help' || arguments_[0] === '-h')) {
    io.stdout(USAGE);
    return 0;
  }
  if (arguments_.length > 1 || arguments_[0]?.startsWith('-') === true) {
    io.stderr(USAGE);
    return 2;
  }
  try {
    const input = await createDefaultM0fProductHandoffDiagnosticInput(io.cwd);
    const diagnostic = evaluateM0fProductHandoffDiagnosticV1(input);
    if (!diagnostic.ok) {
      diagnostic.error.forEach((entry) =>
        io.stderr(
          `READINESS REPORT BLOCKED ${entry.stage} ${entry.code} ${entry.path}: ${entry.message}\n`,
        ),
      );
      return 1;
    }
    const artifact = createM0fReadinessReportCandidateArtifactV1(diagnostic.value);
    const issues = verifyM0fReadinessReportCandidateArtifactV1(
      artifact.markdown,
      artifact.diagnosticJson,
      artifact.manifest,
    );
    if (issues.length > 0) {
      issues.forEach((entry) =>
        io.stderr(`READINESS REPORT BLOCKED ${entry.code}: ${entry.message}\n`),
      );
      return 1;
    }
    const outputDirectory = resolve(io.cwd, arguments_[0] ?? '.artifacts/m0f-readiness-report');
    await mkdir(outputDirectory, { recursive: true });
    await Promise.all([
      writeFile(
        resolve(outputDirectory, M0F_READINESS_REPORT_CANDIDATE_MARKDOWN_PATH),
        artifact.markdown,
        'utf8',
      ),
      writeFile(
        resolve(outputDirectory, M0F_READINESS_REPORT_DIAGNOSTIC_PATH),
        artifact.diagnosticJson,
        'utf8',
      ),
      writeFile(
        resolve(outputDirectory, M0F_READINESS_REPORT_CANDIDATE_MANIFEST_PATH),
        artifact.manifestJson,
        'utf8',
      ),
    ]);
    io.stdout(artifact.manifestJson);
    return 0;
  } catch {
    io.stderr('candidate M0F readiness report could not be generated\n');
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runM0fReadinessReportCandidateCli(process.argv.slice(2));
}
