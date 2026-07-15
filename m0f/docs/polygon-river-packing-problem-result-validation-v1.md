# Polygon/river packing-problem result validator v1

Status: independent completed-result consistency validator; **not** candidate
enumeration, packing evidence, or a feasibility decision

`validatePolygonRiverPackingProblemResultV1` checks one returned finite
polygon/river problem description against one closed request without calling
the problem builder, path-demand builder, or candidate enumerator. It is the
main-thread prerequisite for a future Worker boundary.

The validator:

- parses and canonicalizes the request without enumeration;
- validates the selected square-grid candidate with independent exact
  one-candidate arithmetic;
- binds the candidate ID, active grid, residual strips, and source branches;
- independently reconstructs canonical leaves, undirected tree edges, and the
  unique path of every unordered leaf pair;
- recomputes path-length sums and maximum-width trace values with `BigInt`;
- checks all compact domains, residual records, ordering declarations,
  cardinalities, and false claim flags;
- returns an owned, deeply frozen normalized result.

The response parser has a dedicated budget sized for 20 leaves, 39 edges, and
190 leaf pairs. It does not reuse the smaller request budget, nor the much
larger all-candidates result budget.

Success establishes selected-candidate arithmetic and source/result
consistency only. It does not prove that an external producer actually ran a
particular enumeration process, that an enumeration was complete, that an
empty result implies no construction, or that any assignment, polygon/river
packing, crease pattern, foldability result, or M0F GO exists.
