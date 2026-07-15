import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createStaticRationalTriangleNonadjacentCrossingWitnessesV1 } from '../../m0f/geometry/static-rational-triangle-nonadjacent-crossing-witness.js';
import type { StaticRationalTriangle3 } from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
} from '../../m0f/geometry/reconstruct-fold-faces.js';
import {
  STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_RECORD_TYPE,
  auditStaticRationalTriangleNonadjacentCrossingWitnessesV1,
} from '../../m0f/reference-verifier/static-rational-triangle-nonadjacent-crossing-audit.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

interface MutablePoint {
  x: string;
  y: string;
  z: string;
  w: string;
}

interface MutableWitnessTriangle {
  triangleId: string;
  faceId: string;
  vertexIds: [string, string, string];
  triangle: [MutablePoint, MutablePoint, MutablePoint];
}

interface MutableWitness {
  witnessIndex: number;
  sourcePairIndex: number;
  first: MutableWitnessTriangle;
  second: MutableWitnessTriangle;
  exactRelativeInteriorPoint: MutablePoint;
  producerCategory: string;
  producerLocusKind: string;
  producerRelativeLocations: [string, string];
}

interface MutableWitnessSet {
  schemaVersion: number;
  recordType: string;
  contractStatus: string;
  coordinateEncoding: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  poseRevisionId: string;
  triangleCount: number;
  unorderedPairCount: number;
  declaredHingeFacePairs: { firstFaceId: string; secondFaceId: string }[];
  witnessCount: number;
  witnesses: MutableWitness[];
  completeProducerCrossingWitnessSet: boolean;
  declaredHingeFacePairsCompleteForBoundMesh: boolean;
  exactRelativeInteriorPointIncluded: boolean;
  independentAuditIncluded: boolean;
  cryptographicSourceRevisionBindingIncluded: boolean;
  legalContactPolicyIncluded: boolean;
  selfIntersectionDecisionIncluded: boolean;
  continuousTimeIncluded: boolean;
  continuousCollisionDetectionIncluded: boolean;
  collisionFreeClaim: boolean;
  verifiedClaim: boolean;
  scientificClaim: boolean;
  globalM0fGo: boolean;
}

function point(x: number, y: number, z: number, w = 1): MutablePoint {
  return { x: String(x), y: String(y), z: String(z), w: String(w) };
}

function validWitnessSet(): MutableWitnessSet {
  return {
    schemaVersion: 1,
    recordType: 'm0f-static-rational-triangle-nonadjacent-crossing-witness-set',
    contractStatus: 'candidate-no-claim',
    coordinateEncoding: 'canonical-projective-bigint-decimal-v1',
    meshRevisionId: 'Mesh:audit:1',
    triangulationRevisionId: 'Triangulation:audit:1',
    poseRevisionId: 'Pose:audit:1',
    triangleCount: 2,
    unorderedPairCount: 1,
    declaredHingeFacePairs: [
      { firstFaceId: 'Face:1', secondFaceId: 'Face:2' },
      { firstFaceId: 'Face:2', secondFaceId: 'Face:3' },
    ],
    witnessCount: 1,
    witnesses: [
      {
        witnessIndex: 0,
        sourcePairIndex: 0,
        first: {
          triangleId: 'Triangle:A',
          faceId: 'Face:1',
          vertexIds: ['Vertex:A0', 'Vertex:A1', 'Vertex:A2'],
          triangle: [point(0, 0, 0), point(4, 0, 0), point(0, 4, 0)],
        },
        second: {
          triangleId: 'Triangle:B',
          faceId: 'Face:3',
          vertexIds: ['Vertex:B0', 'Vertex:B1', 'Vertex:B2'],
          triangle: [point(1, 1, -1), point(1, 1, 1), point(3, 1, 0)],
        },
        exactRelativeInteriorPoint: point(2, 1, 0),
        producerCategory: 'nonadjacent-static-interior-crossing-evidence',
        producerLocusKind: 'segment',
        producerRelativeLocations: ['interior', 'interior'],
      },
    ],
    completeProducerCrossingWitnessSet: true,
    declaredHingeFacePairsCompleteForBoundMesh: true,
    exactRelativeInteriorPointIncluded: true,
    independentAuditIncluded: false,
    cryptographicSourceRevisionBindingIncluded: false,
    legalContactPolicyIncluded: false,
    selfIntersectionDecisionIncluded: false,
    continuousTimeIncluded: false,
    continuousCollisionDetectionIncluded: false,
    collisionFreeClaim: false,
    verifiedClaim: false,
    scientificClaim: false,
    globalM0fGo: false,
  };
}

function firstWitness(value: MutableWitnessSet): MutableWitness {
  const witness = value.witnesses[0];
  if (witness === undefined) throw new TypeError('fixture witness is missing');
  return witness;
}

function threeStripSource(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [3, 1],
      [2, 1],
      [1, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
      [1, 6],
      [2, 5],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M'],
    facesVertices: null,
  };
}

function fractions(vertex: CandidateFoldFaceReconstructionV1['vertices'][number]) {
  return {
    xn: BigInt(vertex.exactCoordinate.x.numerator),
    xd: BigInt(vertex.exactCoordinate.x.denominator),
    yn: BigInt(vertex.exactCoordinate.y.numerator),
    yd: BigInt(vertex.exactCoordinate.y.denominator),
  };
}

function crossingPoint(
  vertex: CandidateFoldFaceReconstructionV1['vertices'][number],
): ProjectivePoint3 {
  const { xn, xd, yn, yd } = fractions(vertex);
  if (xn <= xd) return canonicalProjectivePoint3(xn * yd, yn * xd, 0n, xd * yd);
  if (xn <= 2n * xd) {
    return canonicalProjectivePoint3(
      (8n * xd - 3n * xn) * yd,
      5n * xd * yn,
      4n * (xn - xd) * yd,
      5n * xd * yd,
    );
  }
  return canonicalProjectivePoint3(
    2n * xd * yd,
    5n * xd * yn,
    (14n * xd - 5n * xn) * yd,
    5n * xd * yd,
  );
}

function crossingPoseInput() {
  const reconstructed = reconstructFoldFacesCandidateV1(threeStripSource());
  expect(reconstructed.ok).toBe(true);
  if (!reconstructed.ok) throw new TypeError('three-strip fixture must reconstruct');
  const artifact = reconstructed.value;
  const pointById = new Map(artifact.vertices.map((vertex) => [vertex.id, crossingPoint(vertex)]));
  return {
    meshRevisionId: 'Mesh:witness:1',
    triangulationRevisionId: 'Triangulation:witness:1',
    poseRevisionId: 'Pose:witness:1',
    reconstruction: artifact,
    staticTriangleSet: {
      triangles: artifact.faces.flatMap((face) =>
        face.triangles.map((topology) => {
          const points = topology.vertexIds.map((vertexId) => pointById.get(vertexId));
          const first = points[0];
          const second = points[1];
          const third = points[2];
          if (first === undefined || second === undefined || third === undefined) {
            throw new TypeError('crossing fixture point must resolve');
          }
          return {
            triangleId: topology.id,
            triangle: [first, second, third] as StaticRationalTriangle3,
          };
        }),
      ),
    },
  };
}

describe('independent static nonadjacent triangle-crossing witness audit', () => {
  it('has no producer or shared geometry runtime dependency', () => {
    const source = readFileSync(
      new URL(
        '../../m0f/reference-verifier/static-rational-triangle-nonadjacent-crossing-audit.ts',
        import.meta.url,
      ),
      'utf8',
    );
    expect([...source.matchAll(/from\s+['"]([^'"]+)['"]/g)]).toEqual([]);
  });

  it('independently confirms a canonical strict-interior point on two nonparallel triangles', () => {
    const result = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(validWitnessSet());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new TypeError('valid independent witness must audit');
    expect(result.value).toMatchObject({
      recordType: STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_RECORD_TYPE,
      auditOutcome: 'consistent',
      auditedWitnessCount: 1,
      allWitnessesCanonical: true,
      allWitnessPlanesNonparallel: true,
      allWitnessPointsStrictlyInsideBothTriangles: true,
      declaredNonadjacencyReplayed: true,
      positiveStaticCrossingEvidenceConfirmed: true,
      independentGeometryArithmeticIncluded: true,
      producerGeometryImported: false,
      producerParserImported: false,
    });
  });

  it('audits the complete portable witness set produced from the three-face crossing', () => {
    const produced =
      createStaticRationalTriangleNonadjacentCrossingWitnessesV1(crossingPoseInput());
    expect(produced.ok).toBe(true);
    if (!produced.ok) throw new TypeError('crossing witness production must succeed');
    expect(produced.value.witnessCount).toBeGreaterThan(0);
    expect(produced.value.witnesses).toHaveLength(produced.value.witnessCount);
    expect(() => JSON.stringify(produced.value)).not.toThrow();
    const audited = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(produced.value);
    expect(audited.ok).toBe(true);
    if (!audited.ok) throw new TypeError('producer witnesses must independently audit');
    expect(audited.value.auditedWitnessCount).toBe(produced.value.witnessCount);
    expect(audited.value.positiveStaticCrossingEvidenceConfirmed).toBe(true);
  });

  it.each([
    {
      name: 'declared adjacency',
      mutate: (value: MutableWitnessSet) => {
        value.declaredHingeFacePairs.splice(1, 0, {
          firstFaceId: 'Face:1',
          secondFaceId: 'Face:3',
        });
      },
      reason: 'declared-face-adjacency-conflict',
    },
    {
      name: 'parallel supporting planes',
      mutate: (value: MutableWitnessSet) => {
        firstWitness(value).second.triangle = [point(1, 1, 0), point(2, 1, 0), point(1, 2, 0)];
      },
      reason: 'parallel-supporting-planes',
    },
    {
      name: 'point off one plane',
      mutate: (value: MutableWitnessSet) => {
        firstWitness(value).exactRelativeInteriorPoint = point(2, 1, 1);
      },
      reason: 'point-off-supporting-plane',
    },
    {
      name: 'point on triangle boundary',
      mutate: (value: MutableWitnessSet) => {
        firstWitness(value).exactRelativeInteriorPoint = point(1, 1, 0);
      },
      reason: 'point-not-strictly-inside-both-triangles',
    },
    {
      name: 'degenerate triangle',
      mutate: (value: MutableWitnessSet) => {
        firstWitness(value).first.triangle = [point(0, 0, 0), point(1, 0, 0), point(2, 0, 0)];
      },
      reason: 'degenerate-triangle',
    },
  ])('returns a fixed inconsistent result for $name', ({ mutate, reason }) => {
    const value = validWitnessSet();
    mutate(value);
    const result = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(value);
    expect(result.ok).toBe(false);
    if (result.ok || !('value' in result)) throw new TypeError('semantic mutation must disagree');
    expect(result.value).toMatchObject({
      auditOutcome: 'inconsistent',
      firstInvalidWitnessIndex: 0,
      reason,
      positiveStaticCrossingEvidenceConfirmed: false,
      selfIntersectionDecisionIncluded: false,
      collisionFreeClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });

  it('rejects noncanonical coordinates, malformed counts, and unknown fields as contract failures', () => {
    const noncanonical = validWitnessSet();
    firstWitness(noncanonical).exactRelativeInteriorPoint = point(4, 2, 0, 2);
    const first = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(noncanonical);
    expect(first.ok).toBe(false);
    expect('error' in first).toBe(true);

    const badCount = validWitnessSet();
    badCount.unorderedPairCount = 0;
    const second = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(badCount);
    expect(second.ok).toBe(false);
    expect('error' in second).toBe(true);

    const extra = { ...validWitnessSet(), extra: true };
    const third = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(extra);
    expect(third.ok).toBe(false);
    expect('error' in third).toBe(true);
  });

  it('rejects accessors without invocation and handles revoked proxies', () => {
    let getterCalls = 0;
    const hostile = validWitnessSet() as unknown as Record<string, unknown>;
    Object.defineProperty(hostile, 'witnesses', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return [];
      },
    });
    expect(auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(hostile).ok).toBe(false);
    expect(getterCalls).toBe(0);

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(() =>
      auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(revoked.proxy),
    ).not.toThrow();
    expect(auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(revoked.proxy)).toMatchObject({
      ok: false,
    });
  });

  it('accepts an empty complete witness set without inventing positive evidence', () => {
    const empty = validWitnessSet();
    empty.witnessCount = 0;
    empty.witnesses = [];
    const result = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(empty);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new TypeError('empty witness set must audit');
    expect(result.value).toMatchObject({
      auditedWitnessCount: 0,
      positiveStaticCrossingEvidenceConfirmed: false,
      selfIntersectionDecisionIncluded: false,
    });
  });

  it('deeply freezes all success, inconsistency, and contract-failure results', () => {
    const success = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(validWitnessSet());
    expect(Object.isFrozen(success)).toBe(true);
    expect('value' in success && Object.isFrozen(success.value)).toBe(true);

    const changed = validWitnessSet();
    firstWitness(changed).exactRelativeInteriorPoint = point(1, 1, 0);
    const inconsistent = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(changed);
    expect(Object.isFrozen(inconsistent)).toBe(true);
    expect('value' in inconsistent && Object.isFrozen(inconsistent.value)).toBe(true);

    const failed = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(undefined);
    expect(Object.isFrozen(failed)).toBe(true);
    expect('error' in failed && Object.isFrozen(failed.error)).toBe(true);
  });
});
