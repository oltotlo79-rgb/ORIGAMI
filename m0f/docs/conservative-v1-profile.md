# Conservative v1 profile decision

The approved v1 policy is now represented by
`m0f/profiles/conservative-v1.ts`.  It is deliberately **provisional and
fail-closed**: no SupportProfile or ToleranceProfile numeric value is selected
until measurement evidence is bound, and no existing candidate fixture is
promoted to the canonical manifest.

This is an implementation of the approved policy, not a claim that M0F has
passed. Product generation and verification entry points must continue to
reject while `isConservativeProfileReady()` returns `false`.

The current candidate corpus contains no fixture that satisfies all exact
canonical rules in `m0f/canonical-fixtures.ts`; promoting a candidate would
invent missing evidence and is therefore intentionally refused.
