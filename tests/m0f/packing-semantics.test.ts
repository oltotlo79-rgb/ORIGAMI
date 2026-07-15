import { describe, expect, it } from 'vitest';

import {
  BOX_PLEATING_PACKING_SEMANTICS_RECORD_TYPE,
  BOX_PLEATING_PACKING_SEMANTICS_V1,
  parseBoxPleatingPackingSemanticsV1,
  type BoxPleatingPackingSemanticsParseResult,
} from '../../m0f/box-pleating/packing-semantics.js';

function input(): Record<string, unknown> {
  return { ...BOX_PLEATING_PACKING_SEMANTICS_V1 };
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

function expectFailure(
  raw: unknown,
  code: string,
  path?: string,
): Extract<BoxPleatingPackingSemanticsParseResult, { ok: false }> {
  const result = parseBoxPleatingPackingSemanticsV1(raw);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected ${code}`);
  expect(
    result.error.some(
      (entry) => entry.code === code && (path === undefined || entry.path === path),
    ),
  ).toBe(true);
  expect(result).not.toHaveProperty('value');
  expect(allFrozen(result)).toBe(true);
  return result;
}

describe('M0F box-pleating packing semantics candidate', () => {
  it('normalizes the exact necessary-filter meanings without selecting a global metric', () => {
    const result = parseBoxPleatingPackingSemanticsV1(input());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('canonical semantics must parse');

    expect(result.value).toMatchObject({
      schemaVersion: 1,
      recordType: BOX_PLEATING_PACKING_SEMANTICS_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'box-pleating-packing-semantics-adr-candidate-only',
      adrStatus: 'candidate-not-adopted',
      experimentStatus: 'experimental-semantic-contract',
      leafAnchorRole: 'projected-flap-tip-and-minimum-polygon-center',
      lengthRole: 'classical-uniaxial-tree-edge-weight',
      coordinateScale: 'one-grid-index-unit-per-quantized-length-step',
      pairwiseNecessaryFilter: 'squared-euclidean-distance-at-least-squared-tree-path-length',
      filterStrength: 'necessary-only',
      tangencyPolicy: 'allowed-at-equality-for-this-filter',
      widthRole: 'independent-finished-branch-width-not-bound-to-classical-river-width',
      maximumWidthRole: 'trace-only-without-separation-or-packing-semantics',
      manhattanMetricSelected: false,
      chebyshevMetricSelected: false,
      globalMetricSelectionIncluded: false,
      pairwiseNecessaryFilterIsGlobalMetric: false,
    });
  });

  it('keeps all construction and finished-width geometry policies unresolved', () => {
    const result = parseBoxPleatingPackingSemanticsV1(input());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('canonical semantics must parse');

    for (const key of [
      'constructionFamily',
      'finishedWidthGeometryPolicy',
      'polygonGeometryPolicy',
      'riverGeometryPolicy',
      'junctionGeometryPolicy',
      'residualPaperPolicy',
      'boundaryPolicy',
      'overlapPolicy',
      'gadgetPolicy',
    ] as const) {
      expect(result.value[key], key).toBe('unresolved');
    }
    expect(result.value).toMatchObject({
      constructionFamilySelectionIncluded: false,
      pureMinimumSquareAdopted: false,
      pythagoreanStretchAdopted: false,
      generalizedOffsetPythagoreanStretchAdopted: false,
    });
  });

  it('keeps evaluation, construction, product, and GO claims outside scope', () => {
    const result = parseBoxPleatingPackingSemanticsV1(input());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('canonical semantics must parse');

    for (const key of [
      'actualGeometryConstraintEvaluable',
      'globalPackingConstraintEvaluable',
      'filterEvaluationIncluded',
      'placementIncluded',
      'packingIncluded',
      'geometryIncluded',
      'creasePatternIncluded',
      'mountainValleyIncluded',
      'foldabilityIncluded',
      'feasibilityDecisionIncluded',
      'globalM0fGo',
      'isSupportProfile',
      'supportClaim',
      'verifiedClaim',
    ] as const) {
      expect(result.value[key], key).toBe(false);
    }
  });

  it('is deterministic, cuts caller aliases, and deeply freezes success', () => {
    const raw = input();
    const alias = raw;
    const first = parseBoxPleatingPackingSemanticsV1(raw);
    const second = parseBoxPleatingPackingSemanticsV1(input());
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error('canonical semantics must parse');

    alias.widthRole = 'caller-mutated';
    alias.constructionFamily = 'pure-minimum-square-v1';
    expect(first.value).toEqual(BOX_PLEATING_PACKING_SEMANTICS_V1);
    expect(first.value).not.toBe(raw);
    expect(allFrozen(first)).toBe(true);
  });
});

describe('M0F box-pleating packing semantics fail-closed boundary', () => {
  it('rejects open records, missing fields, and wrong fixed literals', () => {
    expectFailure({ ...input(), metric: 'euclidean' }, 'unknown-field', '$.metric');

    const missing = input();
    delete missing.maximumWidthRole;
    expectFailure(missing, 'missing-field', '$.maximumWidthRole');

    expectFailure(
      { ...input(), leafAnchorRole: 'grid-vertex' },
      'invalid-literal',
      '$.leafAnchorRole',
    );
    expectFailure(
      { ...input(), pairwiseNecessaryFilter: 'manhattan-distance-at-least-tree-path-length' },
      'invalid-literal',
      '$.pairwiseNecessaryFilter',
    );
    expectFailure(
      { ...input(), constructionFamily: 'pure-minimum-square-v1' },
      'invalid-literal',
      '$.constructionFamily',
    );
    expectFailure({ ...input(), schemaVersion: 2 }, 'invalid-literal', '$.schemaVersion');
    expectFailure(
      { ...input(), recordType: 'm0f-packing-semantics-verified' },
      'invalid-literal',
      '$.recordType',
    );
  });

  it('orders invalid-record issues independently of caller key insertion order', () => {
    const first = parseBoxPleatingPackingSemanticsV1({
      zetaUnknown: false,
      ...input(),
      alphaUnknown: false,
    });
    const second = parseBoxPleatingPackingSemanticsV1({
      alphaUnknown: false,
      ...input(),
      zetaUnknown: false,
    });

    expect(first).toEqual(second);
    expect(first.ok).toBe(false);
    if (first.ok) throw new Error('open semantics records must fail');
    expect(first.error.map((entry) => entry.path)).toEqual(['$.alphaUnknown', '$.zetaUnknown']);
  });

  it('rejects every direct or indirect claim escalation', () => {
    for (const key of [
      'scientificClaim',
      'manhattanMetricSelected',
      'chebyshevMetricSelected',
      'globalMetricSelectionIncluded',
      'pairwiseNecessaryFilterIsGlobalMetric',
      'constructionFamilySelectionIncluded',
      'pureMinimumSquareAdopted',
      'pythagoreanStretchAdopted',
      'generalizedOffsetPythagoreanStretchAdopted',
      'actualGeometryConstraintEvaluable',
      'globalPackingConstraintEvaluable',
      'filterEvaluationIncluded',
      'placementIncluded',
      'packingIncluded',
      'geometryIncluded',
      'creasePatternIncluded',
      'mountainValleyIncluded',
      'foldabilityIncluded',
      'feasibilityDecisionIncluded',
      'globalM0fGo',
      'isSupportProfile',
      'supportClaim',
      'verifiedClaim',
    ] as const) {
      expectFailure({ ...input(), [key]: true }, 'claim-boundary', `$.${key}`);
    }
    expectFailure({ ...input(), contractStatus: 'verified' }, 'claim-boundary', '$.contractStatus');
  });

  it('rejects cycles, exotic inputs, and accessors without invoking them', () => {
    const cyclic = input();
    cyclic.self = cyclic;
    expectFailure(cyclic, 'invalid-snapshot', '$');

    expectFailure(new Map(Object.entries(input())), 'invalid-snapshot', '$');

    let getterCalls = 0;
    const accessor = input();
    Object.defineProperty(accessor, 'widthRole', {
      enumerable: true,
      get(): string {
        getterCalls += 1;
        return BOX_PLEATING_PACKING_SEMANTICS_V1.widthRole;
      },
    });
    expectFailure(accessor, 'invalid-snapshot', '$');
    expect(getterCalls).toBe(0);

    const symbolBearing = input();
    Object.defineProperty(symbolBearing, Symbol('hidden-claim'), {
      enumerable: true,
      value: true,
    });
    expectFailure(symbolBearing, 'invalid-snapshot', '$');

    const revoked = Proxy.revocable(input(), {});
    revoked.revoke();
    expectFailure(revoked.proxy, 'invalid-snapshot', '$');
  });
});
