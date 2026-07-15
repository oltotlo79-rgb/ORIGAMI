import { expect, test } from '@playwright/test';

test('CSP blocks inline scripts and external connections', async ({ page }) => {
  await page.goto('./');

  const result = await page.evaluate(async () => {
    const observedDirectives: string[] = [];
    const windowWithProbe = window as Window & { __oridesignInlineProbe?: boolean };

    document.addEventListener('securitypolicyviolation', (event) => {
      observedDirectives.push(event.effectiveDirective);
    });

    const inlineScript = document.createElement('script');
    inlineScript.textContent = 'window.__oridesignInlineProbe = true';
    document.head.append(inlineScript);

    try {
      await fetch('https://example.invalid/oridesign-csp-probe');
    } catch {
      // A rejected fetch is the expected result. The directive event is asserted below.
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      inlineExecuted: windowWithProbe.__oridesignInlineProbe === true,
      observedDirectives,
    };
  });

  expect(result.inlineExecuted).toBe(false);
  expect(result.observedDirectives).toContain('connect-src');
  expect(
    result.observedDirectives.some(
      (directive) => directive === 'script-src' || directive === 'script-src-elem',
    ),
  ).toBe(true);
});
