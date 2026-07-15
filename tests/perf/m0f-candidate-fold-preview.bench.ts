import { bench, describe } from 'vitest';

import { createCandidateFoldProjectionPreviewJsonV1 } from '../../m0f/candidate-fold-projection-preview.js';
import { evaluateFoldFaceCandidateFlowV1 } from '../../m0f/fold-face-candidate-flow.js';
import { DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT } from '../../m0f/fold-face-candidate-flow-default-input.js';

// This measures the exact fixed diagnostic path shown by the M0 shell. It has
// no threshold and is not browser-runtime, support-profile, or scientific GO
// evidence. Final performance evidence still requires the frozen M0F setup.
const CANDIDATE_MEASUREMENT_LABEL =
  'M0F bundled candidate FOLD preview measurement (non-scientific, no threshold)';

let candidateMeasurementSink = 0;

async function measureBundledCandidatePreview(): Promise<void> {
  const flow = await evaluateFoldFaceCandidateFlowV1(DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT);
  if (!flow.ok) {
    throw new Error(`candidate flow blocked: ${flow.error.map((entry) => entry.code).join(',')}`);
  }

  const preview = createCandidateFoldProjectionPreviewJsonV1(flow.value);
  if (!preview.ok) {
    throw new Error(
      `candidate preview blocked: ${preview.error.map((entry) => entry.code).join(',')}`,
    );
  }
  if (
    !preview.value.json.includes('"contractStatus":"candidate"') ||
    !preview.value.json.includes('"scientificClaim":false')
  ) {
    throw new Error('candidate preview claim boundary changed');
  }

  candidateMeasurementSink = new TextEncoder().encode(preview.value.json).byteLength;
}

describe(CANDIDATE_MEASUREMENT_LABEL, () => {
  bench('fixed bundled NOFACES flow plus validated preview serialization', async () => {
    await measureBundledCandidatePreview();
  });
});

void candidateMeasurementSink;
