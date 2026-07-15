import { deepFreezeOwned } from '../clone-and-freeze.js';
import { adaptFoldDocumentToFaceReconstructionInputV1 } from './fold-document-face-adapter.js';
import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
  type FoldFaceReconstructionIssue,
} from './reconstruct-fold-faces.js';

export type FoldDocumentFaceReconstructionIssue =
  | Readonly<{
      stage: 'fold-document';
      path: string;
      code: string;
      message: string;
    }>
  | FoldFaceReconstructionIssue;

export type FoldDocumentFaceReconstructionResult =
  | Readonly<{ ok: true; value: CandidateFoldFaceReconstructionV1 }>
  | Readonly<{ ok: false; error: readonly FoldDocumentFaceReconstructionIssue[] }>;

/** Runs the candidate face pipeline directly from the supported external FOLD slice. */
export function reconstructFoldDocumentFacesCandidateV1(
  supplied: unknown,
): FoldDocumentFaceReconstructionResult {
  const adapted = adaptFoldDocumentToFaceReconstructionInputV1(supplied);
  if (!adapted.ok) {
    return deepFreezeOwned({
      ok: false as const,
      error: adapted.error.map((entry) => ({
        stage: 'fold-document' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
      })),
    });
  }
  return reconstructFoldFacesCandidateV1(adapted.value);
}
