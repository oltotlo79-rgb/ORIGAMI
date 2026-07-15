import { bench, describe } from 'vitest';

import { canonicalizeVertices } from '../../m0f/geometry/canonicalize-vertices.js';
import { orientation2D } from '../../m0f/geometry/predicates.js';

describe('M0F numeric kernel plumbing (non-scientific)', () => {
  bench('filtered orientation typical case', () => {
    orientation2D(
      { x: 0, y: 0 },
      { x: 0.875, y: 0.125 },
      { x: 0.25, y: 0.75 },
      { fastFilterArea: 0 },
    );
  });

  bench('exact dyadic orientation fallback', () => {
    orientation2D(
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2.0000000000000004 },
      { fastFilterArea: 0 },
    );
  });

  const points = Array.from({ length: 40 }, (_, index) => ({
    id: `v-${index.toString().padStart(2, '0')}`,
    x: index / 100,
    y: (index % 7) / 100,
  }));
  bench('O(n^2) exact reference vertex canonicalization (40 points)', () => {
    canonicalizeVertices(points, { coordMergeAbs: 0.001 });
  });
});
