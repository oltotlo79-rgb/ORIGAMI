import { useState } from 'react';

import {
  bundledM0fProductHandoffDiagnosticEvaluation,
  runBundledM0fProductHandoffDiagnostic,
} from './diagnostics/m0fProductHandoffDiagnostic';
import { ja } from './strings/ja';

export function M0fDiagnosticPanel() {
  const diagnostic = bundledM0fProductHandoffDiagnosticEvaluation.ok
    ? bundledM0fProductHandoffDiagnosticEvaluation.value
    : null;
  const [lastRun, setLastRun] = useState<ReturnType<
    typeof runBundledM0fProductHandoffDiagnostic
  > | null>(null);

  const runDiagnostic = () => {
    setLastRun(runBundledM0fProductHandoffDiagnostic());
  };

  return (
    <section
      className="diagnostic-card"
      aria-labelledby="diagnostic-title"
      data-testid="m0f-diagnostic"
    >
      <div className="diagnostic-card__header">
        <div>
          <p className="diagnostic-card__label">{ja.diagnostic.label}</p>
          <h2 id="diagnostic-title">{ja.diagnostic.title}</h2>
        </div>
        <p className="diagnostic-card__status" data-testid="m0f-diagnostic-status">
          <span aria-hidden="true" />
          {diagnostic === null ? ja.diagnostic.statusUnavailable : ja.diagnostic.statusIncomplete}
        </p>
      </div>

      <p className="diagnostic-card__boundary">{ja.diagnostic.boundary}</p>

      <dl className="diagnostic-metrics" aria-label={ja.diagnostic.metricsLabel}>
        <div>
          <dt>{ja.diagnostic.blockingAreas}</dt>
          <dd data-testid="m0f-blocking-areas">
            {diagnostic === null
              ? ja.diagnostic.unavailableValue
              : `${String(diagnostic.blockingAreaCount)} / ${String(diagnostic.readiness.summary.gateAreaCount)}`}
          </dd>
        </div>
        <div>
          <dt>{ja.diagnostic.unmetGoConditions}</dt>
          <dd data-testid="m0f-unmet-go-conditions">
            {diagnostic === null
              ? ja.diagnostic.unavailableValue
              : `${String(diagnostic.unmetGoConditionCount)} / ${String(diagnostic.readiness.summary.goConditionCount)}`}
          </dd>
        </div>
        <div>
          <dt>{ja.diagnostic.unmetDeliverables}</dt>
          <dd data-testid="m0f-unmet-deliverables">
            {diagnostic === null
              ? ja.diagnostic.unavailableValue
              : `${String(diagnostic.unmetRequiredDeliverableCount)} / ${String(diagnostic.readiness.summary.requiredDeliverableCount)}`}
          </dd>
        </div>
        <div>
          <dt>{ja.diagnostic.missingFixtures}</dt>
          <dd data-testid="m0f-missing-canonical-rules">
            {diagnostic?.readiness.catalog.missingCanonicalFixtureCount ??
              ja.diagnostic.unavailableValue}
          </dd>
        </div>
      </dl>

      <p className="diagnostic-card__authorization" data-testid="m0f-product-authorization">
        <strong>{ja.diagnostic.productStartBlocked}</strong>
        <span>{ja.diagnostic.finalDecisionNotRecorded}</span>
      </p>

      <p className="diagnostic-card__claim-boundary">{ja.diagnostic.claimBoundary}</p>

      <div className="diagnostic-runner" aria-labelledby="diagnostic-runner-title">
        <div>
          <h3 id="diagnostic-runner-title">{ja.diagnostic.runnerTitle}</h3>
          <p>{ja.diagnostic.runnerDescription}</p>
        </div>
        <button type="button" onClick={runDiagnostic}>
          {ja.diagnostic.runButton}
        </button>
      </div>

      <div
        className="diagnostic-run-result"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="m0f-diagnostic-run-result"
      >
        {lastRun === null ? (
          <p>{ja.diagnostic.runIdle}</p>
        ) : lastRun.ok ? (
          <p>
            <strong>{ja.diagnostic.runComplete}</strong>{' '}
            {ja.diagnostic.runResultSummary(
              lastRun.value.blockingAreaCount,
              lastRun.value.finalDecision,
            )}
          </p>
        ) : (
          <p>
            <strong>{ja.diagnostic.runUnavailable}</strong>{' '}
            {ja.diagnostic.runUnavailableDescription}
          </p>
        )}
      </div>
    </section>
  );
}
