import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import { FOLD_FACE_CANDIDATE_FLOW_RESULT_RECORD_TYPE } from './fold-face-candidate-flow.js';
import { parseCandidateFoldFaceReconstructionV1 } from './geometry/fold-face-reconstruction-result.js';
import { parseAndRoundtripCandidateFoldProjectionV1 } from './geometry/fold-projection-roundtrip.js';
import type { CandidateFoldProjectionV1 } from './geometry/reconstruct-fold-faces.js';
import { stableStringify } from './stable-json.js';

export type CandidateFoldProjectionPreviewJsonV1 = Readonly<{
  projection: CandidateFoldProjectionV1;
  json: string;
}>;

export type CandidateFoldProjectionPreviewIssueV1 = Readonly<{
  stage: 'snapshot' | 'flow-result' | 'reconstruction-result' | 'projection-roundtrip';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
}>;

export type CandidateFoldProjectionPreviewEvaluationV1 =
  | Readonly<{ ok: true; value: CandidateFoldProjectionPreviewJsonV1 }>
  | Readonly<{ ok: false; error: readonly CandidateFoldProjectionPreviewIssueV1[] }>;

function failure(
  error: readonly CandidateFoldProjectionPreviewIssueV1[],
): CandidateFoldProjectionPreviewEvaluationV1 {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Extracts the existing CandidateFoldProjectionV1 from one completed candidate
 * flow result and emits deterministic preview JSON. This is a read-only
 * candidate preview boundary, not a product export or foldability claim.
 */
export function createCandidateFoldProjectionPreviewJsonV1(
  supplied: unknown,
): CandidateFoldProjectionPreviewEvaluationV1 {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return failure([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: 'flow result must be one cloneable plain JSON-data snapshot',
      },
    ]);
  }

  const flow = snapshot.value;
  if (
    !isRecord(flow) ||
    flow.recordType !== FOLD_FACE_CANDIDATE_FLOW_RESULT_RECORD_TYPE ||
    flow.contractStatus !== 'candidate' ||
    flow.scientificClaim !== false ||
    flow.outputKind !== 'fold-nofaces-candidate-diagnostic-not-scientific-verification'
  ) {
    return failure([
      {
        stage: 'flow-result',
        path: '$',
        code: 'claim-boundary',
        message: 'preview requires an unchanged candidate fold-face flow result',
      },
    ]);
  }

  const reconstructionExperiment = flow.reconstructionExperiment;
  const reconstruction = parseCandidateFoldFaceReconstructionV1(
    isRecord(reconstructionExperiment) ? reconstructionExperiment.result : undefined,
  );
  if (!reconstruction.ok) {
    return failure(
      reconstruction.error.map((entry) => ({
        stage: 'reconstruction-result' as const,
        path:
          entry.path === '$'
            ? '$.reconstructionExperiment.result'
            : `$.reconstructionExperiment.result${entry.path.slice(1)}`,
        code: entry.code,
        message: entry.message,
        sourceStage: entry.stage,
      })),
    );
  }

  const projection = reconstruction.value.foldProjection;
  const roundtrip = parseAndRoundtripCandidateFoldProjectionV1(projection);
  if (!roundtrip.ok) {
    return failure(
      roundtrip.error.map((entry) => ({
        stage: 'projection-roundtrip' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
        sourceStage: entry.stage,
      })),
    );
  }

  try {
    const json = stableStringify(projection);
    const serializedRoundtrip = parseAndRoundtripCandidateFoldProjectionV1(
      JSON.parse(json) as unknown,
    );
    if (!serializedRoundtrip.ok) {
      return failure(
        serializedRoundtrip.error.map((entry) => ({
          stage: 'projection-roundtrip' as const,
          path: entry.path,
          code: entry.code,
          message: entry.message,
          sourceStage: entry.stage,
        })),
      );
    }
    return deepFreezeOwned({ ok: true as const, value: { projection, json } });
  } catch {
    return failure([
      {
        stage: 'projection-roundtrip',
        path: '$',
        code: 'serialization-failed',
        message: 'candidate projection could not be serialized and reparsed',
      },
    ]);
  }
}
