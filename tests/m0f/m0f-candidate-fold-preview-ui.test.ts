import { describe, expect, it } from 'vitest';

import { DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT } from '../../m0f/fold-face-candidate-flow-cli.js';
import {
  BUNDLED_M0F_CANDIDATE_FOLD_PREVIEW_INPUT,
  runBundledM0fCandidateFoldPreview,
} from '../../src/diagnostics/m0fCandidateFoldPreview.js';

describe('bundled M0F candidate FOLD preview UI boundary', () => {
  it('uses exactly the browser-safe fixed CLI example input', () => {
    expect(BUNDLED_M0F_CANDIDATE_FOLD_PREVIEW_INPUT).toBe(DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT);
    expect(Object.isFrozen(BUNDLED_M0F_CANDIDATE_FOLD_PREVIEW_INPUT)).toBe(true);
    expect(Object.isFrozen(BUNDLED_M0F_CANDIDATE_FOLD_PREVIEW_INPUT.vertices_coords)).toBe(true);
    expect(Object.isFrozen(BUNDLED_M0F_CANDIDATE_FOLD_PREVIEW_INPUT.vertices_coords[0])).toBe(true);
  });

  it('creates only a frozen candidate JSON preview from the fixed input', async () => {
    const result = await runBundledM0fCandidateFoldPreview();

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.vertexCount).toBe(6);
    expect(result.edgeCount).toBe(6);
    expect(result.faceCount).toBeGreaterThan(0);
    expect(JSON.parse(result.json)).toMatchObject({
      file_spec: 1.2,
      _oridesign_m0f_candidate: {
        contractStatus: 'candidate',
        scientificClaim: false,
      },
    });
  });

  it('fails closed without JSON if execution throws', async () => {
    const result = await runBundledM0fCandidateFoldPreview(() =>
      Promise.reject(new Error('injected failure')),
    );

    expect(result).toEqual({ ok: false, reason: 'execution-exception' });
    expect(result).not.toHaveProperty('json');
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('fails closed without JSON if the candidate flow is blocked', async () => {
    const result = await runBundledM0fCandidateFoldPreview(
      () => Promise.resolve({ ok: false, error: [] }),
      () => {
        throw new Error('preview creator must not run');
      },
    );

    expect(result).toEqual({ ok: false, reason: 'candidate-flow-blocked' });
    expect(result).not.toHaveProperty('json');
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('fails closed without JSON if preview validation is blocked', async () => {
    const result = await runBundledM0fCandidateFoldPreview(undefined, () => ({
      ok: false,
      error: [],
    }));

    expect(result).toEqual({ ok: false, reason: 'preview-blocked' });
    expect(result).not.toHaveProperty('json');
    expect(Object.isFrozen(result)).toBe(true);
  });
});
