import { useState } from 'react';

import {
  runBundledM0fCandidateFoldPreview,
  type BundledM0fCandidateFoldPreviewResult,
} from './diagnostics/m0fCandidateFoldPreview';
import { ja } from './strings/ja';

type PreviewState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'running' }>
  | Readonly<{ status: 'complete'; result: BundledM0fCandidateFoldPreviewResult }>;

export function M0fCandidateFoldPreview() {
  const [state, setState] = useState<PreviewState>({ status: 'idle' });

  const showPreview = () => {
    setState({ status: 'running' });
    void runBundledM0fCandidateFoldPreview().then((result) => {
      setState({ status: 'complete', result });
    });
  };

  const succeeded = state.status === 'complete' && state.result.ok;

  return (
    <section
      className="candidate-fold-preview"
      aria-labelledby="candidate-fold-preview-title"
      aria-busy={state.status === 'running'}
      data-testid="m0f-candidate-fold-preview"
    >
      <div className="candidate-fold-preview__header">
        <div>
          <p className="candidate-fold-preview__label">{ja.candidateFoldPreview.label}</p>
          <h3 id="candidate-fold-preview-title">{ja.candidateFoldPreview.title}</h3>
        </div>
        <button
          type="button"
          aria-controls="candidate-fold-preview-status"
          disabled={state.status === 'running'}
          onClick={showPreview}
        >
          {state.status === 'running'
            ? ja.candidateFoldPreview.runningButton
            : ja.candidateFoldPreview.showButton}
        </button>
      </div>

      <p className="candidate-fold-preview__boundary">{ja.candidateFoldPreview.boundary}</p>
      <p id="candidate-fold-preview-limitations" className="candidate-fold-preview__limitations">
        {ja.candidateFoldPreview.limitations}
      </p>

      <p
        id="candidate-fold-preview-status"
        className="candidate-fold-preview__status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="m0f-candidate-fold-preview-status"
      >
        {state.status === 'idle'
          ? ja.candidateFoldPreview.idle
          : state.status === 'running'
            ? ja.candidateFoldPreview.running
            : state.result.ok
              ? ja.candidateFoldPreview.complete(
                  state.result.vertexCount,
                  state.result.edgeCount,
                  state.result.faceCount,
                )
              : ja.candidateFoldPreview.unavailable}
      </p>

      {succeeded ? (
        <pre
          className="candidate-fold-preview__json"
          aria-label={ja.candidateFoldPreview.jsonLabel}
          aria-describedby="candidate-fold-preview-limitations"
          data-testid="m0f-candidate-fold-preview-json"
          tabIndex={0}
        >
          <code>{state.result.json}</code>
        </pre>
      ) : null}
    </section>
  );
}
