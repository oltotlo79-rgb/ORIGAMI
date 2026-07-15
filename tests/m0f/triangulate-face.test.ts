import { describe, expect, it } from 'vitest';

import {
  triangulateSimpleFaceCandidate,
  type CandidateFaceTriangulation,
  type FaceRingVertex2,
  type SimpleFaceRing2,
} from '../../m0f/geometry/triangulate-face.js';
import { exactPolygonAreaSign } from '../../m0f/model/exact-dyadic.js';

const DEFAULT_POLICY = Object.freeze({ fastFilterArea: 0 });

function requireTriangulation(
  faceId: string,
  vertices: readonly FaceRingVertex2[],
  fastFilterArea = 0,
): CandidateFaceTriangulation {
  const result = triangulateSimpleFaceCandidate({ faceId, vertices }, { fastFilterArea });
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

function issueCodes(input: SimpleFaceRing2): readonly string[] {
  const result = triangulateSimpleFaceCandidate(input, DEFAULT_POLICY);
  if (result.ok) throw new Error('expected face triangulation rejection');
  return result.error.map((entry) => entry.code);
}

function invokeUntyped(input: unknown, policy: unknown = DEFAULT_POLICY) {
  return triangulateSimpleFaceCandidate(
    input as SimpleFaceRing2,
    policy as Readonly<{ fastFilterArea: number }>,
  );
}

function trianglePoints(
  triangle: CandidateFaceTriangulation['triangles'][number],
  source: readonly FaceRingVertex2[],
): readonly FaceRingVertex2[] {
  const byId = new Map(source.map((vertex) => [vertex.id, vertex]));
  return triangle.vertexIds.map((id) => {
    const point = byId.get(id);
    if (point === undefined) throw new Error(`missing triangle point ${id}`);
    return point;
  });
}

describe('M0F-3A candidate simple-face triangulation', () => {
  const square: readonly FaceRingVertex2[] = [
    { id: 'v-a', x: 0, y: 0 },
    { id: 'v-b', x: 0, y: 1 },
    { id: 'v-c', x: 1, y: 1 },
    { id: 'v-d', x: 1, y: 0 },
  ];

  it('emits n-2 negative-winding triangles with stable face provenance', () => {
    const result = requireTriangulation('f-square', square);
    expect(result).toMatchObject({
      status: 'candidate',
      scientificClaim: false,
      faceId: 'f-square',
      sourceVertexIds: ['v-a', 'v-b', 'v-c', 'v-d'],
    });
    expect(result.triangles).toHaveLength(square.length - 2);
    expect(new Set(result.triangles.flatMap((triangle) => triangle.vertexIds))).toEqual(
      new Set(square.map((vertex) => vertex.id)),
    );
    for (const triangle of result.triangles) {
      expect(triangle.faceId).toBe('f-square');
      expect(triangle.id).toContain('candidate-triangle-v1');
      expect(triangle.semanticVertexIds).toEqual([...triangle.vertexIds].sort());
      expect(exactPolygonAreaSign(trianglePoints(triangle, square))).toBe(-1);
    }
  });

  it('is invariant to a cyclic ring rotation and to an always-exact policy', () => {
    const baseline = requireTriangulation('f-square', square);
    const rotated = requireTriangulation('f-square', [...square.slice(2), ...square.slice(0, 2)]);
    const alwaysExact = requireTriangulation('f-square', square, Number.MAX_VALUE);

    expect(rotated.sourceVertexIds).toEqual(baseline.sourceVertexIds);
    expect(rotated.triangles).toEqual(baseline.triangles);
    expect(alwaysExact.triangles).toEqual(baseline.triangles);
    expect(alwaysExact.predicateStats.exactFallbacks).toBe(
      alwaysExact.predicateStats.orientationTests,
    );
    expect(alwaysExact.predicateStats.orientationTests).toBeGreaterThan(0);
  });

  it('triangulates a concave face deterministically and preserves every boundary vertex', () => {
    const concave: readonly FaceRingVertex2[] = [
      { id: 'v-a', x: 0, y: 0 },
      { id: 'v-b', x: 0, y: 2 },
      { id: 'v-c', x: 1, y: 2 },
      { id: 'v-d', x: 1, y: 1 },
      { id: 'v-e', x: 2, y: 1 },
      { id: 'v-f', x: 2, y: 0 },
    ];
    const result = requireTriangulation('f-concave', concave);

    expect(result.triangles).toHaveLength(4);
    expect(new Set(result.triangles.flatMap((triangle) => triangle.vertexIds))).toEqual(
      new Set(concave.map((vertex) => vertex.id)),
    );
    expect(result.triangles.map((triangle) => triangle.id)).toEqual(
      [...result.triangles.map((triangle) => triangle.id)].sort(),
    );
  });

  it('does not skip a collinear boundary vertex by accepting an ear through it', () => {
    const withBoundaryPoint: readonly FaceRingVertex2[] = [
      { id: 'v-a', x: 0, y: 0 },
      { id: 'v-b', x: 0, y: 1 },
      { id: 'v-c', x: 0, y: 2 },
      { id: 'v-d', x: 2, y: 2 },
      { id: 'v-e', x: 2, y: 0 },
    ];
    const result = requireTriangulation('f-boundary-point', withBoundaryPoint);
    const undirectedTriangleEdges = new Set(
      result.triangles.flatMap((triangle) => {
        const [first, second, third] = triangle.vertexIds;
        return [
          [first, second],
          [second, third],
          [third, first],
        ].map((edge) => [...edge].sort().join('|'));
      }),
    );

    expect(undirectedTriangleEdges).toContain('v-a|v-b');
    expect(undirectedTriangleEdges).toContain('v-b|v-c');
    expect(undirectedTriangleEdges).not.toContain('v-a|v-c');
    expect(result.triangles).toHaveLength(3);
  });

  it('owns and recursively freezes output instead of retaining input aliases', () => {
    const mutable = square.map((vertex) => ({ ...vertex }));
    const result = requireTriangulation('f-owned', mutable);
    const snapshot = JSON.stringify(result);
    const mutableFirst = mutable[0];
    if (mutableFirst === undefined) throw new Error('mutable square needs its first vertex');

    mutableFirst.id = 'v-mutated';
    mutableFirst.x = 99;
    mutable.push({ id: 'v-extra', x: 2, y: 2 });

    expect(JSON.stringify(result)).toBe(snapshot);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.sourceVertexIds)).toBe(true);
    expect(Object.isFrozen(result.triangles)).toBe(true);
    expect(Object.isFrozen(result.triangles[0])).toBe(true);
    expect(Object.isFrozen(result.triangles[0]?.vertexIds)).toBe(true);
    expect(Object.isFrozen(result.triangles[0]?.semanticVertexIds)).toBe(true);
    expect(Object.isFrozen(result.predicateStats)).toBe(true);
  });

  it('fails closed on malformed IDs, too few vertices, non-finite values, and aliases', () => {
    expect(issueCodes({ faceId: 'bad face', vertices: square })).toContain('invalid-face-id');
    expect(issueCodes({ faceId: 'f-short', vertices: square.slice(0, 2) })).toContain(
      'too-few-vertices',
    );
    expect(
      issueCodes({
        faceId: 'f-non-finite',
        vertices: [{ id: 'v-a', x: Number.NaN, y: 0 }, ...square.slice(1)],
      }),
    ).toContain('non-finite-coordinate');

    const sameObject = { id: 'v-shared', x: 0, y: 0 };
    const aliasCodes = issueCodes({
      faceId: 'f-alias',
      vertices: [sameObject, sameObject, { id: 'v-c', x: 1, y: 1 }],
    });
    expect(aliasCodes).toContain('duplicate-vertex-id');
    expect(aliasCodes).toContain('duplicate-coordinate');
    expect(aliasCodes).toContain('zero-length-edge');
  });

  it('rejects zero-area, positive-winding, crossing, overlap, and T-junction rings', () => {
    const collinear: readonly FaceRingVertex2[] = [
      { id: 'v-a', x: 0, y: 0 },
      { id: 'v-b', x: 1, y: 0 },
      { id: 'v-c', x: 2, y: 0 },
    ];
    expect(issueCodes({ faceId: 'f-flat', vertices: collinear })).toContain('degenerate-face');
    expect(issueCodes({ faceId: 'f-reversed', vertices: [...square].reverse() })).toContain(
      'wrong-face-winding',
    );

    const crossing: readonly FaceRingVertex2[] = [
      { id: 'v-a', x: 0, y: 0 },
      { id: 'v-b', x: 2, y: 2 },
      { id: 'v-c', x: 0, y: 2 },
      { id: 'v-d', x: 2, y: 0 },
    ];
    expect(issueCodes({ faceId: 'f-crossing', vertices: crossing })).toContain('self-intersection');

    const adjacentOverlap: readonly FaceRingVertex2[] = [
      { id: 'v-a', x: 0, y: 0 },
      { id: 'v-b', x: 2, y: 0 },
      { id: 'v-c', x: 1, y: 0 },
      { id: 'v-d', x: 1, y: 1 },
    ];
    expect(issueCodes({ faceId: 'f-overlap', vertices: adjacentOverlap })).toContain(
      'self-intersection',
    );

    const tJunction: readonly FaceRingVertex2[] = [
      { id: 'v-a', x: 0, y: 0 },
      { id: 'v-b', x: 0, y: 2 },
      { id: 'v-c', x: 2, y: 2 },
      { id: 'v-d', x: 2, y: 0 },
      { id: 'v-e', x: 0, y: 1 },
    ];
    expect(issueCodes({ faceId: 'f-t-junction', vertices: tJunction })).toContain(
      'self-intersection',
    );
  });

  it('rejects an invalid filter policy without entering geometry predicates', () => {
    const result = triangulateSimpleFaceCandidate(
      { faceId: 'f-square', vertices: square },
      {
        fastFilterArea: -1,
      },
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected invalid policy rejection');
    expect(result.error.map((entry) => entry.code)).toContain('invalid-orientation-policy');
  });

  it('captures getter-backed input once before validating and never retains its aliases', () => {
    let xReads = 0;
    const getterInput = {
      faceId: 'f-getter-snapshot',
      vertices: [
        {
          id: 'v-a',
          get x() {
            xReads += 1;
            return xReads === 1 ? 0 : Number.NaN;
          },
          y: 0,
        },
        { id: 'v-b', x: 0, y: 1 },
        { id: 'v-c', x: 1, y: 1 },
        { id: 'v-d', x: 1, y: 0 },
      ],
    };
    const result = invokeUntyped(getterInput);
    expect(result.ok).toBe(true);
    expect(xReads).toBe(1);

    const throwing = invokeUntyped({
      get faceId(): string {
        throw new Error('hostile getter');
      },
      vertices: square,
    });
    expect(throwing.ok).toBe(false);
    if (throwing.ok) throw new Error('expected getter capture rejection');
    expect(throwing.error.map((issue) => issue.code)).toContain('invalid-input');
  });

  it('rejects Map, class, cycle, and malformed plain JavaScript inputs without throwing', () => {
    class NonPlainFace {
      readonly faceId = 'f-class';
      readonly vertices = square;
    }
    const cyclic: Record<string, unknown> = {
      faceId: 'f-cycle',
      vertices: square,
    };
    cyclic.self = cyclic;

    const hostileInputs: readonly unknown[] = [new Map(), new NonPlainFace(), cyclic];
    for (const hostile of hostileInputs) {
      const result = invokeUntyped(hostile);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('expected hostile input rejection');
      expect(result.error.map((issue) => issue.code)).toContain('invalid-input');
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.error)).toBe(true);
    }

    const malformedInputs: readonly unknown[] = [
      null,
      { faceId: 'f-object-vertices', vertices: {} },
      { faceId: 'f-null-vertex', vertices: [null, ...square.slice(1)] },
      {
        faceId: 'f-string-coordinate',
        vertices: [{ id: 'v-a', x: '0', y: 0 }, ...square.slice(1)],
      },
    ];
    for (const malformed of malformedInputs) {
      expect(invokeUntyped(malformed).ok).toBe(false);
    }
  });

  it('rejects unknown fields at input, vertex, and policy boundaries', () => {
    const rootUnknown = invokeUntyped({ faceId: 'f-root-extra', vertices: square, extra: true });
    const vertexUnknown = invokeUntyped({
      faceId: 'f-vertex-extra',
      vertices: [{ id: 'v-a', x: 0, y: 0, extra: true }, ...square.slice(1)],
    });
    const policyUnknown = invokeUntyped(
      { faceId: 'f-policy-extra', vertices: square },
      { fastFilterArea: 0, extra: true },
    );
    for (const result of [rootUnknown, vertexUnknown, policyUnknown]) {
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('expected unknown-field rejection');
      expect(result.error.map((issue) => issue.code)).toContain('unknown-field');
    }
  });
});
