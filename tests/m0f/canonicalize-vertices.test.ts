import { describe, expect, it } from 'vitest';

import {
  canonicalizeVertices,
  type IdentifiedPoint2,
} from '../../m0f/geometry/canonicalize-vertices.js';

function requireCanonical(points: readonly IdentifiedPoint2[], coordMergeAbs: number) {
  const result = canonicalizeVertices(points, { coordMergeAbs });
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

describe('M0F exact reference vertex canonicalization', () => {
  it('merges distances below and exactly at the L2 threshold', () => {
    const result = requireCanonical(
      [
        { id: 'v-a', x: 0, y: 0 },
        { id: 'v-b', x: 0.25, y: 0 },
        { id: 'v-c', x: 0.5, y: 0 },
      ],
      0.5,
    );
    expect(result.vertices).toEqual([{ id: 'v-a', x: 0, y: 0 }]);
    expect(result.components).toEqual([
      { representativeId: 'v-a', memberIds: ['v-a', 'v-b', 'v-c'] },
    ]);
    expect(result.representativeById).toEqual({ 'v-a': 'v-a', 'v-b': 'v-a', 'v-c': 'v-a' });
  });

  it('keeps a point one ULP outside the threshold separate', () => {
    const outside = 0.5000000000000001;
    const result = requireCanonical(
      [
        { id: 'v-a', x: 0, y: 0 },
        { id: 'v-b', x: outside, y: 0 },
      ],
      0.5,
    );
    expect(result.vertices.map((point) => point.id)).toEqual(['v-a', 'v-b']);
  });

  it('fails closed instead of applying an order-dependent chain merge', () => {
    const result = canonicalizeVertices(
      [
        { id: 'v-a', x: 0, y: 0 },
        { id: 'v-b', x: 0.75, y: 0 },
        { id: 'v-c', x: 1.5, y: 0 },
      ],
      { coordMergeAbs: 1 },
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected chain ambiguity');
    const ambiguity = result.error.find((entry) => entry.code === 'merge-chain-ambiguous');
    expect(ambiguity?.pointIds).toEqual(['v-a', 'v-b', 'v-c']);
  });

  it('is invariant to input order and normalizes negative zero through an existing representative', () => {
    const points: readonly IdentifiedPoint2[] = [
      { id: 'v-z', x: -0, y: 0 },
      { id: 'v-a', x: 0, y: -0 },
      { id: 'v-far', x: 1, y: 1 },
    ];
    const forward = requireCanonical(points, 0);
    const reverse = requireCanonical([...points].reverse(), 0);
    expect(reverse).toEqual(forward);
    expect(forward.components[0]).toEqual({
      representativeId: 'v-a',
      memberIds: ['v-a', 'v-z'],
    });
  });

  it('rejects duplicate IDs, non-finite coordinates, and invalid tolerance', () => {
    const duplicate = canonicalizeVertices(
      [
        { id: 'v-a', x: 0, y: 0 },
        { id: 'v-a', x: 1, y: 1 },
      ],
      { coordMergeAbs: 0 },
    );
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) throw new Error('expected duplicate rejection');
    expect(duplicate.error.some((entry) => entry.code === 'duplicate-id')).toBe(true);

    const nonFinite = canonicalizeVertices([{ id: 'v-a', x: Number.NaN, y: 0 }], {
      coordMergeAbs: 0,
    });
    expect(nonFinite.ok).toBe(false);
    if (nonFinite.ok) throw new Error('expected finite rejection');
    expect(nonFinite.error.some((entry) => entry.code === 'non-finite-coordinate')).toBe(true);

    const badTolerance = canonicalizeVertices([{ id: 'v-a', x: 0, y: 0 }], {
      coordMergeAbs: -1,
    });
    expect(badTolerance.ok).toBe(false);
    if (badTolerance.ok) throw new Error('expected tolerance rejection');
    expect(badTolerance.error.some((entry) => entry.code === 'invalid-merge-policy')).toBe(true);
  });
});
