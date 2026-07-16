import { describe, expect, it } from 'vitest';
import {
  CONSERVATIVE_V1_PROFILE,
  isConservativeProfileReady,
} from '../../m0f/profiles/conservative-v1.js';

describe('conservative v1 profile', () => {
  it('is immutable and fail-closed', () => {
    expect(CONSERVATIVE_V1_PROFILE.status).toBe('provisional-fail-closed');
    expect(CONSERVATIVE_V1_PROFILE.support.selected).toBeNull();
    expect(CONSERVATIVE_V1_PROFILE.tolerance.selected).toBeNull();
    expect(CONSERVATIVE_V1_PROFILE.canonicalFixtures.promotedIds).toEqual([]);
    expect(isConservativeProfileReady()).toBe(false);
    expect(Object.isFrozen(CONSERVATIVE_V1_PROFILE)).toBe(true);
  });
});
