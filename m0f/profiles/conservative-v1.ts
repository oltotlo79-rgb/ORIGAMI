/**
 * Conservative, fail-closed profile envelope.
 *
 * This module intentionally does not promote any candidate value to a
 * scientific SupportProfile/ToleranceProfile.  It provides a typed place for
 * the approved v1 policy while unresolved measurements remain pending.
 */
export const CONSERVATIVE_PROFILE_VERSION = 'v1' as const;

export type ConservativeProfileStatus = 'provisional-fail-closed';

export type ConservativeProfile = Readonly<{
  profileId: 'oridesign-conservative-v1';
  version: typeof CONSERVATIVE_PROFILE_VERSION;
  status: ConservativeProfileStatus;
  support: Readonly<{
    selected: null;
    decision: 'reject-until-evidence-bound';
  }>;
  tolerance: Readonly<{
    selected: null;
    decision: 'reject-until-measurement-bound';
  }>;
  canonicalFixtures: Readonly<{
    promotedIds: readonly [];
    decision: 'no-existing-candidate-eligible';
  }>;
}>;

export const CONSERVATIVE_V1_PROFILE: ConservativeProfile = Object.freeze({
  profileId: 'oridesign-conservative-v1',
  version: CONSERVATIVE_PROFILE_VERSION,
  status: 'provisional-fail-closed',
  support: Object.freeze({ selected: null, decision: 'reject-until-evidence-bound' }),
  tolerance: Object.freeze({ selected: null, decision: 'reject-until-measurement-bound' }),
  canonicalFixtures: Object.freeze({
    promotedIds: Object.freeze([]),
    decision: 'no-existing-candidate-eligible',
  }),
});

/** Product entry points must not proceed while this profile is provisional. */
export function isConservativeProfileReady(): false {
  return false;
}
