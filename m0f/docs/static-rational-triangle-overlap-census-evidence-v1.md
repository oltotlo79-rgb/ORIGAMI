# Static rational triangle-overlap census evidence candidate v1

Status: saveable, hash-bound candidate consistency evidence for one bounded
static triangle set, its complete producer census, and a successful independent
whole-census replay. It is not scientific evidence and does not decide legal
contact, penetration, self-intersection, motion, CCD, collision freedom,
product `verified`, or global M0F `GO`.

## Bound record

The builder accepts the existing hostile-data whole-census audit input. It
parses that input, converts every BigInt coordinate to canonical decimal text,
sorts triangle entries by stable ID, and reruns the independent whole-census
auditor. Evidence is emitted only when the complete producer record matches the
fresh replay.

The persisted v1 record contains:

- canonical-decimal stable-ID-bound triangle geometry;
- the complete producer census snapshot, including every pair row and no-claim
  flag;
- the complete successful independent whole-audit snapshot;
- the independent auditor implementation ID, candidate version, normalized
  source-set hash convention, and source-set hash;
- three component hashes and one complete-payload hash; and
- fixed negative scientific, self-intersection, collision-free, `verified`, and
  global-`GO` flags.

The runtime source closure is exactly the import-free independent pair auditor
and the whole-census auditor that imports it. The producer census, producer pair
classifier, and shared projective kernel are deliberately absent. A source
closure test normalizes CRLF/CR to LF, hashes each declared file, checks all
relative imports remain inside the set, and recomputes the declared source-set
hash.

## Domain-separated identity

All hashes use SHA-256 over UTF-8 text produced by the project `stableStringify`
convention. The four independent domains bind:

1. canonical triangle IDs and exact canonical-decimal geometry;
2. the complete producer census snapshot;
3. the complete freshly replayed whole-audit snapshot; and
4. the entire evidence payload, including source-set identity, all three
   snapshots, their component hashes, record literals, and negative claims.

The final hash excludes only its own field. Changing an ID, coordinate, pair
row, count, audit field, source identity, scope, or no-claim flag changes a
component hash or the complete payload hash. Hashes provide deterministic
content identity and damage detection, not signatures or authorization against
an attacker who can replace and re-hash the entire artifact.

## Closed parser and replay

The evidence parser first captures one owned snapshot using property
descriptors. It rejects accessors without invoking them, exotic prototypes,
symbol keys or values, sparse arrays, cycles, non-finite numbers, negative zero,
BigInt values, revoked proxies, oversized strings, and excess depth, nodes,
arrays, or properties. The stored form must be JSON-portable and use
canonical-decimal coordinates.

After the closed root and source identity checks, the parser reuses the
whole-census hostile-data parser, reconstructs the one canonical audit input,
and requires byte-semantic equality under `stableStringify`. It then reruns the
current independent whole-census auditor before trusting the saved result. The
stored whole-audit object must equal the fresh complete result exactly; unknown,
missing, changed, or claim-escalated audit fields therefore fail even if every
stored hash was recomputed. Only then are all component hashes and the complete
payload hash recomputed. Every failure is closed and returns no geometry or
self-intersection decision.

## Defensive ceilings

The v1 evidence boundary retains the 64-triangle and 2,016-pair work surface and
adds ceilings of 2,016 array elements, 48 properties per object, 128 code units
per property name, 4,934 code units per string, 5,000,000 total string code
units, depth 16, 65,536 visited nodes, and 8,000,000 code units per canonical
hash payload. The extra coordinate code unit accounts for the sign on a valid
negative 4,933-digit coordinate.

A maximum-combinatorial regression creates and reparses 64 triangles, all 2,016
producer pairs, and 128-code-unit IDs. On the development machine this record
visited 19,531 values, had maximum depth 6 and 41 properties on one object,
serialized to 1,123,140 code units, completed create plus JSON round-trip parse
in about 0.8 seconds, and increased observed JavaScript heap use by about 11 MB.
Replacing all 768 stored coordinate strings by the maximum signed length gives
a conservative 4,516,745 string-code-unit and approximately 4,911,684 canonical
code-unit bound, still below the declared ceilings. Runtime and heap figures are
diagnostic observations, not test thresholds or performance claims. These
values bound persistence parsing and hashing; they are not a SupportProfile,
browser capacity measurement, or product support claim.

## Remaining boundary

This record binds only one static raw closed-triangle census and its consistency
audit. It has no mesh revision or triangulation provenance outside the embedded
canonical triangles, no declared adjacency or legal-contact policy, no
intersection-locus classification, no nonlinear rigid-motion coverage, no
conservative CCD certificate, no Worker execution provenance, and no digital
signature. Those remain separate requirements before any self-intersection,
collision-free, product-verification, or global-gate conclusion is possible.
