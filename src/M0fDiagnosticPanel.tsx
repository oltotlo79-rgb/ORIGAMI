import { bundledM0fProductHandoffDiagnostic as diagnostic } from './diagnostics/m0fProductHandoffDiagnostic';
import { ja } from './strings/ja';

export function M0fDiagnosticPanel() {
  const summary = diagnostic.readiness.summary;
  const catalog = diagnostic.readiness.catalog;

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
          {ja.diagnostic.statusNotReady}
        </p>
      </div>

      <p className="diagnostic-card__boundary">{ja.diagnostic.boundary}</p>

      <dl className="diagnostic-metrics" aria-label={ja.diagnostic.metricsLabel}>
        <div>
          <dt>{ja.diagnostic.blockingAreas}</dt>
          <dd data-testid="m0f-blocking-areas">
            {diagnostic.blockingAreaCount} / {summary.gateAreaCount}
          </dd>
        </div>
        <div>
          <dt>{ja.diagnostic.unmetGoConditions}</dt>
          <dd data-testid="m0f-unmet-go-conditions">
            {diagnostic.unmetGoConditionCount} / {summary.goConditionCount}
          </dd>
        </div>
        <div>
          <dt>{ja.diagnostic.unmetDeliverables}</dt>
          <dd data-testid="m0f-unmet-deliverables">
            {diagnostic.unmetRequiredDeliverableCount} / {summary.requiredDeliverableCount}
          </dd>
        </div>
        <div>
          <dt>{ja.diagnostic.missingFixtures}</dt>
          <dd data-testid="m0f-missing-fixtures">{catalog.missingCanonicalFixtureCount}</dd>
        </div>
      </dl>

      <p className="diagnostic-card__authorization" data-testid="m0f-product-authorization">
        <strong>{ja.diagnostic.productStartBlocked}</strong>
        <span>{ja.diagnostic.finalDecisionNotRecorded}</span>
      </p>

      <details className="diagnostic-details">
        <summary>{ja.diagnostic.detailsSummary}</summary>
        <ul>
          {diagnostic.areas.map((area) => (
            <li key={area.areaId}>
              <span>{ja.diagnostic.areaLabels[area.areaId]}</span>
              <small>{ja.diagnostic.notEvaluated}</small>
            </li>
          ))}
        </ul>
        <p>{ja.diagnostic.claimBoundary}</p>
      </details>
    </section>
  );
}
