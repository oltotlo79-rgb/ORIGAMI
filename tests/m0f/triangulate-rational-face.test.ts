import { describe, expect, it } from 'vitest';

import {
  triangulatePlanarRationalFaceCandidate,
  triangulateRationalSimpleFaceCandidate,
  type RationalCandidateFaceTriangulation,
  type RationalFaceRingVertex2,
  type RationalSimpleFaceRing2,
  type PlanarRationalFaceInput,
} from '../../m0f/geometry/triangulate-rational-face.js';
import {
  addExactRational,
  equalExactRational,
  exactRational,
  exactRationalOrientationSign,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
  type ExactRationalPoint2,
} from '../../m0f/model/exact-rational.js';

function point(
  id: string,
  xNumerator: bigint,
  yNumerator: bigint,
  xDenominator = 1n,
  yDenominator = 1n,
): RationalFaceRingVertex2 {
  return {
    id,
    point: {
      x: exactRational(xNumerator, xDenominator),
      y: exactRational(yNumerator, yDenominator),
    },
  };
}

function requireTriangulation(
  faceId: string,
  vertices: readonly RationalFaceRingVertex2[],
): RationalCandidateFaceTriangulation {
  const result = triangulateRationalSimpleFaceCandidate({ faceId, vertices });
  if (!result.ok) throw new Error(result.error.map((issue) => issue.code).join(', '));
  return result.value;
}

function issueCodes(input: RationalSimpleFaceRing2): readonly string[] {
  const result = triangulateRationalSimpleFaceCandidate(input);
  if (result.ok) throw new Error('expected rational face triangulation rejection');
  return result.error.map((issue) => issue.code);
}

function invokeUntypedSimple(input: unknown) {
  return triangulateRationalSimpleFaceCandidate(input as RationalSimpleFaceRing2);
}

function invokeUntypedAdapter(input: unknown) {
  return triangulatePlanarRationalFaceCandidate(input as PlanarRationalFaceInput);
}

function exactTwiceArea(points: readonly ExactRationalPoint2[]): ExactRational {
  return points.reduce<ExactRational>((sum, current, index) => {
    const next = points[(index + 1) % points.length];
    if (next === undefined) throw new Error('area fixture requires a non-empty ring');
    return addExactRational(
      sum,
      subtractExactRational(
        multiplyExactRational(current.x, next.y),
        multiplyExactRational(current.y, next.x),
      ),
    );
  }, exactRational(0n));
}

function pointsForTriangle(
  triangle: RationalCandidateFaceTriangulation['triangles'][number],
  source: readonly RationalFaceRingVertex2[],
): readonly [ExactRationalPoint2, ExactRationalPoint2, ExactRationalPoint2] {
  const byId = new Map(source.map((vertex) => [vertex.id, vertex.point]));
  const [firstId, secondId, thirdId] = triangle.vertexIds;
  const first = byId.get(firstId);
  const second = byId.get(secondId);
  const third = byId.get(thirdId);
  if (first === undefined || second === undefined || third === undefined) {
    throw new Error('triangle references an unknown source vertex');
  }
  return [first, second, third];
}

describe('M0F-3A candidate exact-rational simple-face triangulation', () => {
  const nonDyadicConcave: readonly RationalFaceRingVertex2[] = [
    point('v-a', 0n, 0n),
    point('v-b', 0n, 5n, 1n, 3n),
    point('v-c', 2n, 5n, 3n, 3n),
    point('v-d', 2n, 2n, 3n, 3n),
    point('v-e', 7n, 2n, 3n, 3n),
    point('v-f', 7n, 0n, 3n),
  ];

  it('triangulates a concave face containing non-dyadic rational vertices exactly', () => {
    const result = requireTriangulation('f-rational-concave', nonDyadicConcave);
    expect(result).toMatchObject({
      status: 'candidate',
      scientificClaim: false,
      faceId: 'f-rational-concave',
      sourceVertexIds: ['v-a', 'v-b', 'v-c', 'v-d', 'v-e', 'v-f'],
    });
    expect(nonDyadicConcave.some((vertex) => vertex.point.x.denominator === 3n)).toBe(true);
    expect(nonDyadicConcave.some((vertex) => vertex.point.y.denominator === 3n)).toBe(true);
    expect(result.triangles).toHaveLength(nonDyadicConcave.length - 2);

    const triangleAreas = result.triangles.map((triangle) => {
      const points = pointsForTriangle(triangle, nonDyadicConcave);
      expect(exactRationalOrientationSign(points[0], points[1], points[2])).toBe(-1);
      expect(triangle.faceId).toBe('f-rational-concave');
      expect(triangle.id).toContain('candidate-rational-triangle-v1');
      return exactTwiceArea(points);
    });
    const summedTriangleArea = triangleAreas.reduce(addExactRational, exactRational(0n));
    expect(
      equalExactRational(
        summedTriangleArea,
        exactTwiceArea(nonDyadicConcave.map((vertex) => vertex.point)),
      ),
    ).toBe(true);
    expect(new Set(result.triangles.flatMap((triangle) => triangle.vertexIds))).toEqual(
      new Set(nonDyadicConcave.map((vertex) => vertex.id)),
    );
  });

  it('is invariant to cyclic ring rotation and emits sorted stable candidate IDs', () => {
    const baseline = requireTriangulation('f-rational-concave', nonDyadicConcave);
    const rotated = requireTriangulation('f-rational-concave', [
      ...nonDyadicConcave.slice(3),
      ...nonDyadicConcave.slice(0, 3),
    ]);

    expect(rotated).toEqual(baseline);
    expect(baseline.triangles.map((triangle) => triangle.id)).toEqual(
      [...baseline.triangles.map((triangle) => triangle.id)].sort(),
    );
    for (const triangle of baseline.triangles) {
      expect(triangle.semanticVertexIds).toEqual([...triangle.vertexIds].sort());
    }
  });

  it('accepts a rational half-edge boundary and planarization vertex table without mapping coordinates', () => {
    const boundary = {
      id: 'f-from-planar-face',
      vertexIds: nonDyadicConcave.map((vertex) => vertex.id),
      edgeIds: ['e-ab', 'e-bc', 'e-cd', 'e-de', 'e-ef', 'e-fa'],
      areaSign: -1 as const,
    };
    const adapted = triangulatePlanarRationalFaceCandidate({
      boundary,
      vertices: nonDyadicConcave,
    });
    if (!adapted.ok) throw new Error(adapted.error.map((issue) => issue.code).join(', '));

    expect(adapted.value).toEqual(requireTriangulation(boundary.id, nonDyadicConcave));
  });

  it('keeps collinear rational boundary vertices instead of clipping an ear through them', () => {
    const source: readonly RationalFaceRingVertex2[] = [
      point('v-a', 0n, 0n),
      point('v-b', 0n, 1n, 1n, 3n),
      point('v-c', 0n, 1n),
      point('v-d', 2n, 1n),
      point('v-e', 2n, 0n),
    ];
    const result = requireTriangulation('f-rational-boundary-point', source);
    const triangleEdges = new Set(
      result.triangles.flatMap((triangle) => {
        const [first, second, third] = triangle.vertexIds;
        return [
          [first, second],
          [second, third],
          [third, first],
        ].map((edge) => [...edge].sort().join('|'));
      }),
    );

    expect(triangleEdges).toContain('v-a|v-b');
    expect(triangleEdges).toContain('v-b|v-c');
    expect(triangleEdges).not.toContain('v-a|v-c');
    expect(result.triangles).toHaveLength(3);
  });

  it('owns and deeply freezes results instead of retaining rational input aliases', () => {
    const mutable = nonDyadicConcave.map((vertex) => ({
      id: vertex.id,
      point: {
        x: { ...vertex.point.x },
        y: { ...vertex.point.y },
      },
    }));
    const result = requireTriangulation('f-owned-rational', mutable);
    const snapshot = JSON.stringify(result, (_key, value: unknown) =>
      typeof value === 'bigint' ? value.toString() : value,
    );
    const first = mutable[0];
    if (first === undefined) throw new Error('mutable fixture must have a first vertex');
    first.id = 'v-mutated';
    first.point.x.numerator = 99n;
    mutable.length = 0;

    expect(
      JSON.stringify(result, (_key, value: unknown) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    ).toBe(snapshot);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.sourceVertexIds)).toBe(true);
    expect(Object.isFrozen(result.triangles)).toBe(true);
    expect(Object.isFrozen(result.triangles[0])).toBe(true);
    expect(Object.isFrozen(result.triangles[0]?.vertexIds)).toBe(true);
    expect(Object.isFrozen(result.predicateStats)).toBe(true);
  });

  it('fails closed on malformed rational coordinates, duplicate aliases, and short rings', () => {
    expect(issueCodes({ faceId: 'f-short', vertices: nonDyadicConcave.slice(0, 2) })).toContain(
      'too-few-vertices',
    );
    expect(issueCodes({ faceId: 'bad face', vertices: nonDyadicConcave })).toContain(
      'invalid-face-id',
    );

    const malformed = {
      id: 'v-malformed',
      point: { x: { numerator: 2n, denominator: 2n }, y: exactRational(0n) },
    } as RationalFaceRingVertex2;
    expect(
      issueCodes({
        faceId: 'f-malformed',
        vertices: [malformed, ...nonDyadicConcave.slice(1, 3)],
      }),
    ).toContain('invalid-rational-coordinate');

    const shared = point('v-shared', 0n, 0n);
    const aliasCodes = issueCodes({
      faceId: 'f-alias',
      vertices: [shared, shared, point('v-c', 1n, 1n)],
    });
    expect(aliasCodes).toContain('duplicate-vertex-id');
    expect(aliasCodes).toContain('duplicate-coordinate');
    expect(aliasCodes).toContain('zero-length-edge');
  });

  it('rejects degenerate, positive-winding, crossing, overlap, and T-junction rings', () => {
    const square: readonly RationalFaceRingVertex2[] = [
      point('v-a', 0n, 0n),
      point('v-b', 0n, 2n),
      point('v-c', 2n, 2n),
      point('v-d', 2n, 0n),
    ];
    expect(issueCodes({ faceId: 'f-positive', vertices: [...square].reverse() })).toContain(
      'wrong-face-winding',
    );
    expect(
      issueCodes({
        faceId: 'f-flat',
        vertices: [point('v-a', 0n, 0n), point('v-b', 1n, 0n), point('v-c', 2n, 0n)],
      }),
    ).toContain('degenerate-face');
    expect(
      issueCodes({
        faceId: 'f-cross',
        vertices: [
          point('v-a', 0n, 0n),
          point('v-b', 2n, 2n),
          point('v-c', 0n, 2n),
          point('v-d', 2n, 0n),
        ],
      }),
    ).toContain('self-intersection');
    expect(
      issueCodes({
        faceId: 'f-overlap',
        vertices: [
          point('v-a', 0n, 0n),
          point('v-b', 2n, 0n),
          point('v-c', 1n, 0n),
          point('v-d', 1n, 1n),
        ],
      }),
    ).toContain('self-intersection');
    expect(
      issueCodes({
        faceId: 'f-t-junction',
        vertices: [...square, point('v-e', 0n, 1n)],
      }),
    ).toContain('self-intersection');
  });

  it('rejects missing and duplicate planarization vertex references in the adapter', () => {
    const missing = triangulatePlanarRationalFaceCandidate({
      boundary: { id: 'f-missing', vertexIds: ['v-a', 'v-missing', 'v-c'] },
      vertices: nonDyadicConcave,
    });
    expect(missing.ok).toBe(false);
    if (missing.ok) throw new Error('expected a missing vertex rejection');
    expect(missing.error.map((issue) => issue.code)).toContain('missing-vertex');

    const duplicatedVertex = nonDyadicConcave[0];
    if (duplicatedVertex === undefined) throw new Error('fixture must have a first vertex');
    const duplicate = triangulatePlanarRationalFaceCandidate({
      boundary: { id: 'f-duplicate-table', vertexIds: ['v-a', 'v-b', 'v-c'] },
      vertices: [duplicatedVertex, duplicatedVertex, ...nonDyadicConcave.slice(1)],
    });
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) throw new Error('expected duplicate table vertex rejection');
    expect(duplicate.error.map((issue) => issue.code)).toContain('duplicate-vertex-id');
  });

  it('captures BigInt getter-backed simple and adapter inputs exactly once', () => {
    let xReads = 0;
    const getterVertices = [
      {
        id: 'v-a',
        point: {
          get x() {
            xReads += 1;
            return xReads === 1 ? exactRational(0n) : { numerator: 2n, denominator: 2n };
          },
          y: exactRational(0n),
        },
      },
      ...nonDyadicConcave.slice(1),
    ];
    const simple = invokeUntypedSimple({ faceId: 'f-rational-getter', vertices: getterVertices });
    expect(simple.ok).toBe(true);
    expect(xReads).toBe(1);

    let boundaryReads = 0;
    const adapter = invokeUntypedAdapter({
      boundary: {
        id: 'f-adapter-getter',
        get vertexIds() {
          boundaryReads += 1;
          return nonDyadicConcave.map((vertex) => vertex.id);
        },
        areaSign: -1,
        edgeIds: ['e-ab', 'e-bc', 'e-cd', 'e-de', 'e-ef', 'e-fa'],
      },
      vertices: nonDyadicConcave,
    });
    expect(adapter.ok).toBe(true);
    expect(boundaryReads).toBe(1);

    const throwing = invokeUntypedSimple({
      get faceId(): string {
        throw new Error('hostile rational getter');
      },
      vertices: nonDyadicConcave,
    });
    expect(throwing.ok).toBe(false);
    if (throwing.ok) throw new Error('expected getter capture rejection');
    expect(throwing.error.map((issue) => issue.code)).toContain('invalid-input');
  });

  it('rejects Map, class, cycles, and malformed BigInt plain objects without throwing', () => {
    class NonPlainRationalFace {
      readonly faceId = 'f-rational-class';
      readonly vertices = nonDyadicConcave;
    }
    const cyclic: Record<string, unknown> = {
      faceId: 'f-rational-cycle',
      vertices: nonDyadicConcave,
    };
    cyclic.self = cyclic;

    for (const hostile of [new Map(), new NonPlainRationalFace(), cyclic]) {
      const result = invokeUntypedSimple(hostile);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('expected hostile rational input rejection');
      expect(result.error.map((issue) => issue.code)).toContain('invalid-input');
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.error)).toBe(true);
    }

    const adapterCycle: Record<string, unknown> = {
      boundary: { id: 'f-adapter-cycle', vertexIds: ['v-a', 'v-b', 'v-c'] },
      vertices: nonDyadicConcave,
    };
    adapterCycle.self = adapterCycle;
    for (const hostile of [new Map(), adapterCycle]) {
      const result = invokeUntypedAdapter(hostile);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('expected hostile adapter rejection');
      expect(result.error.map((issue) => issue.code)).toContain('invalid-input');
    }

    const malformedSimple = invokeUntypedSimple({
      faceId: 'f-malformed-plain',
      vertices: [
        { id: 'v-a', point: { x: { numerator: 0, denominator: 1n }, y: exactRational(0n) } },
        ...nonDyadicConcave.slice(1, 3),
      ],
    });
    expect(malformedSimple.ok).toBe(false);
    if (malformedSimple.ok) throw new Error('expected malformed rational rejection');
    expect(malformedSimple.error.map((issue) => issue.code)).toContain(
      'invalid-rational-coordinate',
    );

    const malformedAdapter = invokeUntypedAdapter({ boundary: null, vertices: [] });
    expect(malformedAdapter.ok).toBe(false);
  });

  it('rejects unknown fields throughout simple and planar adapter inputs', () => {
    const rootUnknown = invokeUntypedSimple({
      faceId: 'f-root-extra',
      vertices: nonDyadicConcave,
      extra: true,
    });
    const vertexUnknown = invokeUntypedSimple({
      faceId: 'f-vertex-extra',
      vertices: [{ ...point('v-a', 0n, 0n), extra: true }, ...nonDyadicConcave.slice(1)],
    });
    const rationalUnknown = invokeUntypedSimple({
      faceId: 'f-rational-extra',
      vertices: [
        {
          id: 'v-a',
          point: {
            x: { numerator: 0n, denominator: 1n, extra: true },
            y: exactRational(0n),
          },
        },
        ...nonDyadicConcave.slice(1),
      ],
    });
    const adapterUnknown = invokeUntypedAdapter({
      boundary: {
        id: 'f-adapter-extra',
        vertexIds: nonDyadicConcave.map((vertex) => vertex.id),
        extra: true,
      },
      vertices: nonDyadicConcave,
    });
    for (const result of [rootUnknown, vertexUnknown, rationalUnknown, adapterUnknown]) {
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('expected rational unknown-field rejection');
      expect(result.error.map((issue) => issue.code)).toContain('unknown-field');
    }
  });
});
