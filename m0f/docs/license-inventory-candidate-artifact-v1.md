# License inventory candidate artifact v1

Status: deterministic dependency-metadata and integrity diagnostic only. It is
not a final legal, source-provenance, redistribution, NOTICE, or GPL-reference
implementation audit, and it does not contribute final evidence to M0F `GO`.

`npm run licenses:check` writes two ignored transient CI artifacts:

- `.artifacts/license-inventory.json`;
- `.artifacts/license-inventory.manifest.json`.

The inventory has no timestamp. For the same package lock, project metadata,
and policy implementation it is byte-for-byte deterministic. The manifest owns
run-specific time and environment metadata.

## Lockfile-only inventory

The collector requires lockfile version 2 or newer. Every dependency entry must
declare version, license, integrity, and resolved metadata directly in
`package-lock.json`. Link entries and missing fields fail closed; the artifact
path never consults `node_modules/package.json`. Dependencies use JavaScript
code-unit ordering rather than locale-dependent collation.

Each entry records its lock location, declared license expression, fixed policy
reason code, parsed identifiers, rejected identifiers, integrity, and resolved
source. The candidate inventory also records exact counts and fixes all final
legal/provenance/redistribution/GO claims to false. Policy violations are saved
to the inventory before the command exits unsuccessfully.

The current lockfile contains 292 eligible package entries, with no link,
fallback, missing license/integrity/resolved metadata, or allowlist violation.
This fact is a declaration-metadata check only; it does not establish that every
upstream package declaration is legally or factually correct.

## Hash binding

The manifest records raw byte lengths and SHA-256 values for:

- `package-lock.json`, `package.json`, and the project `LICENSE`;
- `scripts/check-licenses.mjs`, `scripts/license-policy.mjs`, and
  `scripts/license-artifact.mjs`;
- the exact canonical UTF-8 inventory bytes.

It also records Node/npm versions, source revision and tree state, and CI run ID.
A domain-separated SHA-256 binds the complete manifest payload while excluding
only its own hash field. The validator recomputes inventory schema, ordering,
counts, violation projection, exact bytes, inventory hash, and manifest hash.
These hashes are integrity keys, not signatures or proof of legal compliance.

CI uploads both files with missing-artifact handling set to error. This transient
upload does not make the inventory a repository-stored final deliverable and
does not change `packageLockBindingVerified`, final audit, provenance, product
runtime, scientific-evidence, or global-GO flags in the separate
browser/runtime/license candidate flow.

## Remaining human review

The following remain explicitly outside this artifact:

- license and NOTICE text obligations;
- correctness of declared package metadata;
- legal compatibility and redistribution decisions;
- fixture and source provenance;
- absence of copied, modified, or reference-ported GPL implementations;
- approval of future allowlist changes;
- the final dependency-license audit and M0F decision.
