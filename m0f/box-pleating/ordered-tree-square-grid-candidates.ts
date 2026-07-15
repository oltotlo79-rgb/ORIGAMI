import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  adaptOrderedTreeToSquareGridCandidateInputV1,
  type OrderedTreeGridQuantizationIssue,
  type OrderedTreeGridQuantizationResultV1,
} from './ordered-tree-grid-quantization.js';
import {
  enumerateSquareGridCandidatesV1,
  type SquareGridCandidateEnumerationResult,
  type SquareGridCandidateInputIssue,
  type SquareGridCandidateResultV1,
} from './square-grid-candidates.js';
import { findSquareGridSourceBindingViolationV1 } from './square-grid-source-binding.js';

export const ORDERED_TREE_SQUARE_GRID_CANDIDATE_RESULT_RECORD_TYPE =
  'm0f-ordered-tree-square-grid-candidate-result' as const;

export type OrderedTreeSquareGridCandidateResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof ORDERED_TREE_SQUARE_GRID_CANDIDATE_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'ordered-tree-square-grid-quantization-enumeration-only';
  enumerationIncluded: true;
  placementIncluded: false;
  packingIncluded: false;
  creasePatternIncluded: false;
  pleatRoutingIncluded: false;
  mountainValleyIncluded: false;
  foldabilityIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  adapter: OrderedTreeGridQuantizationResultV1;
  quantization: SquareGridCandidateResultV1;
}>;

export type OrderedTreeSquareGridCandidateIssue = Readonly<{
  stage: 'adapter' | 'enumeration' | 'composition';
  sourceStage: string;
  path: string;
  code: string;
  message: string;
}>;

export type OrderedTreeSquareGridCandidateEnumerationResult =
  | Readonly<{ ok: true; value: OrderedTreeSquareGridCandidateResultV1 }>
  | Readonly<{ ok: false; error: readonly OrderedTreeSquareGridCandidateIssue[] }>;

function adapterIssues(
  issues: readonly OrderedTreeGridQuantizationIssue[],
): OrderedTreeSquareGridCandidateIssue[] {
  return issues.map((issue) => ({
    stage: 'adapter',
    sourceStage: issue.stage,
    path: issue.path,
    code: issue.code,
    message: issue.message,
  }));
}

function prefixedGridPath(path: string): string {
  if (path === '$') return '$.adapter.squareGridInput';
  if (path.startsWith('$')) return `$.adapter.squareGridInput${path.slice(1)}`;
  return `$.adapter.squareGridInput.${path}`;
}

function enumerationIssues(
  issues: readonly SquareGridCandidateInputIssue[],
): OrderedTreeSquareGridCandidateIssue[] {
  return issues.map((issue) => ({
    stage: 'enumeration',
    sourceStage: 'square-grid-input',
    path: prefixedGridPath(issue.path),
    code: issue.code,
    message: issue.message,
  }));
}

export type OrderedTreeSquareGridCandidateEnumeratorV1 = (
  supplied: unknown,
) => SquareGridCandidateEnumerationResult;

/**
 * Runs the closed ordered-tree adapter followed by finite exact square-grid
 * quantization enumeration. This composition still performs no placement,
 * polygon/river packing, crease construction, or feasibility decision.
 */
export function enumerateOrderedTreeSquareGridCandidatesV1(
  supplied: unknown,
  enumerator: OrderedTreeSquareGridCandidateEnumeratorV1 = enumerateSquareGridCandidatesV1,
): OrderedTreeSquareGridCandidateEnumerationResult {
  const adapted = adaptOrderedTreeToSquareGridCandidateInputV1(supplied);
  if (!adapted.ok) {
    return { ok: false, error: deepFreezeOwned(adapterIssues(adapted.error)) };
  }

  let enumerated: SquareGridCandidateEnumerationResult;
  try {
    enumerated = enumerator(adapted.value.squareGridInput);
  } catch {
    return {
      ok: false,
      error: deepFreezeOwned([
        {
          stage: 'enumeration' as const,
          sourceStage: 'square-grid-executor',
          path: '$.adapter.squareGridInput',
          code: 'enumeration-exception',
          message: 'square-grid enumeration failed before producing a candidate result',
        },
      ]),
    };
  }
  if (!enumerated.ok) {
    return { ok: false, error: deepFreezeOwned(enumerationIssues(enumerated.error)) };
  }
  const bindingViolation = findSquareGridSourceBindingViolationV1(
    adapted.value.squareGridInput,
    enumerated.value,
  );
  if (bindingViolation !== undefined) {
    return {
      ok: false,
      error: deepFreezeOwned([
        {
          stage: 'composition' as const,
          sourceStage: 'source-binding',
          path:
            bindingViolation.path === '$'
              ? '$.quantization'
              : `$.quantization${bindingViolation.path.slice(1)}`,
          code: 'source-result-mismatch',
          message: bindingViolation.message,
        },
      ]),
    };
  }

  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: ORDERED_TREE_SQUARE_GRID_CANDIDATE_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'ordered-tree-square-grid-quantization-enumeration-only',
      enumerationIncluded: true,
      placementIncluded: false,
      packingIncluded: false,
      creasePatternIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      adapter: adapted.value,
      quantization: enumerated.value,
    }),
  };
}
