import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST } from './experiment-cli.js';
import { createFaceComplexAuditEvidenceV1 } from './reference-verifier/face-complex-evidence.js';
import { serializeJsonLine } from './stable-json.js';

export type FaceComplexAuditEvidenceCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): FaceComplexAuditEvidenceCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits deterministic candidate evidence for the fixed non-dyadic face case. */
export async function runDefaultFaceComplexAuditEvidenceCli(
  io: FaceComplexAuditEvidenceCliIo = defaultIo(),
): Promise<number> {
  try {
    const created = await createFaceComplexAuditEvidenceV1(
      DEFAULT_FACE_COMPLEX_AUDIT_EXPERIMENT_REQUEST.input,
    );
    if (!created.ok) {
      io.stderr('candidate face-complex evidence could not be created\n');
      return 1;
    }
    io.stdout(serializeJsonLine(created.value));
    return 0;
  } catch {
    io.stderr('candidate face-complex evidence failed before producing a record\n');
    return 1;
  }
}

export async function runFaceComplexAuditEvidenceCli(
  arguments_: readonly string[],
  io: FaceComplexAuditEvidenceCliIo = defaultIo(),
): Promise<number> {
  if (arguments_.length === 0) return runDefaultFaceComplexAuditEvidenceCli(io);
  io.stderr('usage: npm run m0f:face-evidence\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = await runFaceComplexAuditEvidenceCli(process.argv.slice(2));
}
