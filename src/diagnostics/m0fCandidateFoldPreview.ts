import { DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT } from '../../m0f/fold-face-candidate-flow-default-input.js';
import type { CandidateFoldProjectionPreviewEvaluationV1 } from '../../m0f/candidate-fold-projection-preview.js';
import type { FoldFaceCandidateFlowEvaluationV1 } from '../../m0f/fold-face-candidate-flow.js';

type EvaluateCandidateFlow = (foldDocument: unknown) => Promise<FoldFaceCandidateFlowEvaluationV1>;
type CreateCandidatePreview = (supplied: unknown) => CandidateFoldProjectionPreviewEvaluationV1;

export const BUNDLED_M0F_CANDIDATE_FOLD_PREVIEW_INPUT = DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT;

export type BundledM0fCandidateFoldPreviewResult =
  | Readonly<{
      ok: true;
      json: string;
      vertexCount: number;
      edgeCount: number;
      faceCount: number;
    }>
  | Readonly<{
      ok: false;
      reason: 'candidate-flow-blocked' | 'preview-blocked' | 'execution-exception';
    }>;

/** Runs only the fixed bundled candidate and returns non-persistent preview text. */
export async function runBundledM0fCandidateFoldPreview(
  evaluateFlow?: EvaluateCandidateFlow,
  createPreview?: CreateCandidatePreview,
): Promise<BundledM0fCandidateFoldPreviewResult> {
  try {
    let resolvedEvaluateFlow = evaluateFlow;
    let resolvedCreatePreview = createPreview;
    if (resolvedEvaluateFlow === undefined || resolvedCreatePreview === undefined) {
      const [flowModule, previewModule] = await Promise.all([
        import('../../m0f/fold-face-candidate-flow.js'),
        import('../../m0f/candidate-fold-projection-preview.js'),
      ]);
      resolvedEvaluateFlow ??= flowModule.evaluateFoldFaceCandidateFlowV1;
      resolvedCreatePreview ??= previewModule.createCandidateFoldProjectionPreviewJsonV1;
    }

    const flow = await resolvedEvaluateFlow(BUNDLED_M0F_CANDIDATE_FOLD_PREVIEW_INPUT);
    if (!flow.ok) return Object.freeze({ ok: false, reason: 'candidate-flow-blocked' });
    const preview = resolvedCreatePreview(flow.value);
    if (!preview.ok) return Object.freeze({ ok: false, reason: 'preview-blocked' });
    return Object.freeze({
      ok: true,
      json: preview.value.json,
      vertexCount: preview.value.projection.vertices_coords.length,
      edgeCount: preview.value.projection.edges_vertices.length,
      faceCount: preview.value.projection.faces_vertices.length,
    });
  } catch {
    return Object.freeze({ ok: false, reason: 'execution-exception' });
  }
}
