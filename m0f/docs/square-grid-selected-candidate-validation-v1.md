# Selected square-grid candidate validator v1

Status: independent one-candidate source-binding validator; **not** candidate
enumeration, enumeration-completeness evidence, placement, or feasibility

`validateSquareGridSelectedCandidateV1` validates one supplied
`SquareGridCandidateV1` against one closed square-grid source input without
calling the enumerator or the completed-result validator. This keeps a future
Worker response check from repeating the expensive full candidate search on
the main thread.

The validator independently checks:

- closed candidate structure and bounded text/container work;
- column and row bounds;
- exact cell size, grid extents, paper residuals, and fitted axes;
- the largest bounded opposite-axis count for each anchored candidate;
- canonical candidate identity;
- one-to-one canonical source-branch order, IDs, and terminal/internal classes;
- exact binary64 source values, nearest-integer-half-up steps, quantized values,
  relative errors, the source error limit, and maximum error.

All rational arithmetic and quantized step checks use exact integers. A valid
result is caller-owned and deeply frozen. Malformed, accessor-bearing,
over-budget, stale, differently sourced, missing, duplicate, or reordered
candidate data fails without a partial normalized candidate.

Validation of one candidate says nothing about whether the original
enumeration was complete, whether another candidate is preferable, whether an
empty enumeration proves no solution, or whether the candidate supports a
polygon/river placement, crease pattern, foldability result, or M0F GO.
