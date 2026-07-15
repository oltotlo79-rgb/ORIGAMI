# Square-grid paper partition candidate v1

`square-grid-paper-partition.ts` closes one geometry gap between a rectangular
paper candidate and any future saved crease-pattern artifact. It represents
the entire paper exactly instead of dropping the extent that is not covered by
the active square grid.

This is a candidate geometry contract with `scientificClaim: false`. It is not
a selected support profile and it makes no construction or feasibility claim.

## Exact partition

The input is the same independently rechecked square-grid candidate used by
the lattice builder. One paper axis must fit exactly. The result contains:

- a counterclockwise four-segment boundary for the complete rectangular paper;
- one active square-grid region with exact cell size, column count, and row
  count;
- zero or one exact positive-x or positive-y residual-strip region; and
- zero or one interface separating the grid and residual regions.

The regions cover the paper with pairwise-disjoint interiors. A positive
residual never disappears from the result. The interface semantics are fixed
to `partition-interface-only`; the interface is not a crease or fold
assignment.

All coordinates use normalized exact-rational JSON. The parser independently
checks the candidate identity, square-cell extents, paper extents, residuals,
and fit-axis invariant through the lattice-candidate boundary. It rejects
accessors, cycles, exotic objects, open fields, noncanonical rationals, and
claim escalation before returning an owned frozen value.

## Deliberate exclusions

The result fixes these fields to false:

- `candidateSelectionIncluded`
- `creaseIncluded`
- `foldAssignmentIncluded`
- `savedCpIntegrationIncluded`
- `branchPlacementIncluded`
- `branchPackingIncluded`
- `pleatRoutingIncluded`
- `feasibilityDecisionIncluded`

In particular, this contract does not decide whether a residual interface is
exported to FOLD, how it is assigned if exported, or whether a candidate can
support any tree. The generic saved-artifact schema and runtime validator must
be extended together before this geometry can enter a persisted CP artifact.

Run the deterministic residual-strip example with:

```text
npm run m0f:box-grid-paper-partition
```
