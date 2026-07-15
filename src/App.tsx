import { useEffect } from 'react';

import { ja } from './strings/ja';

export function App() {
  useEffect(() => {
    document.title = ja.meta.documentTitle;
  }, []);

  return (
    <div className="app-shell" data-testid="m0-shell">
      <a className="skip-link" href="#main-content">
        {ja.accessibility.skipToMain}
      </a>

      <header className="site-header" aria-label={ja.shell.headerLabel}>
        <div className="brand" aria-label={ja.meta.appName}>
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>{ja.meta.appName}</span>
        </div>

        <p className="phase-badge" role="status" aria-live="polite">
          <span className="phase-badge__mark" aria-hidden="true" />
          {ja.shell.phaseStatus}
        </p>
      </header>

      <main id="main-content" className="main-content" tabIndex={-1}>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">{ja.shell.eyebrow}</p>
          <h1 id="page-title">{ja.shell.title}</h1>
          <p className="intro__summary">{ja.shell.summary}</p>
        </section>

        <section className="gate-card" aria-labelledby="gate-title">
          <div className="gate-card__icon" aria-hidden="true">
            <span />
          </div>
          <div>
            <p className="gate-card__label">{ja.shell.gateLabel}</p>
            <h2 id="gate-title">{ja.shell.gateTitle}</h2>
            <p>{ja.shell.gateDescription}</p>
          </div>
        </section>

        <aside className="notice" aria-labelledby="notice-title">
          <h2 id="notice-title">{ja.shell.noticeTitle}</h2>
          <p>{ja.shell.noticeDescription}</p>
        </aside>
      </main>

      <footer className="site-footer">
        <p>{ja.shell.footer}</p>
      </footer>
    </div>
  );
}
