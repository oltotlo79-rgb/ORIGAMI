# M0F SupportProfile candidates v1

Status: measurement candidates; **not** supported-input claims  
Schema: `https://oridesign.local/schemas/m0f/support-profile-candidates-v1.schema.json`

The catalog intentionally separates three workflows:

- tree-method design generation;
- true grid box-pleating design generation;
- imported FOLD crease-pattern verification.

Each workflow has a closed constraints object and a distinct
`constraintsSchemaId`. A tree-method constraint cannot silently appear in a
box-pleating or FOLD profile, and FOLD verification has no dependency on a
design tree.

Every numeric entry is an ordered list of experiment points, not a product
limit. Every policy entry is an ordered list of hypotheses to test. The catalog
therefore fixes all of the following:

```text
status = candidate
profileHash = null
selection.selected = null
evidence = { status: pending, ref: null }
```

`parseSupportProfileCandidatesV1` rejects attempts to freeze the catalog,
select a boundary, attach a hash/evidence reference, add an unknown constraint,
mix workflows, reorder profiles, or provide duplicate/nonascending candidate
values.

The generation profiles explicitly retain the 2..20-leaf product goal and
internal-branch width accommodation as dimensions to measure. The box-pleating
profile separately measures `Nx`/`Ny`, square-cell geometry, rectangular-sheet
handling, axial+N directions, quantization error, and junction/elevation
families. Its quantization-error experiment points retain `0.01` because every
individual length and width at the inclusive one-percent boundary is part of
the product requirement; the candidate catalog still selects no value. The
FOLD profile separately measures file limits, face
reconstruction, planarity/manifold checks, CP target rules, and continuation
limits.

A future frozen SupportProfile is valid only after M0F evidence selects every
value, defines a pure terminating `checkSupport`, binds a domain-separated
profile hash, passes holdout/adversarial fixtures, and records the applicable
reference checker. That future profile requires a different candidate status
and parser; editing this file is deliberately insufficient.
