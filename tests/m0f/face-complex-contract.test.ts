import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FACE_COMPLEX_AUDIT_EXACT_COORDINATE_ENCODING,
  parseFaceComplexAuditInputV1,
} from '../../m0f/reference-verifier/face-complex-contract.js';

function rational(numerator: string, denominator = '1'): Record<string, unknown> {
  return { numerator, denominator };
}

function point(x: string, y: string): Record<string, unknown> {
  return { x: rational(x), y: rational(y) };
}

function vertex(
  id: string,
  x: number,
  y: number,
  sourceVertexIndex: number,
): Record<string, unknown> {
  return {
    id,
    exactCoordinate: point(String(x), String(y)),
    displayCoordinate: [x, y],
    sourceVertexIndex,
  };
}

function edge(
  id: string,
  first: string,
  second: string,
  assignment: 'M' | 'B',
  sourceEdgeIndex: number,
): Record<string, unknown> {
  return {
    id,
    vertexIds: [first, second],
    assignment,
    sourceEdges: [{ id: `source:${sourceEdgeIndex}`, sourceEdgeIndex, assignment }],
  };
}

function triangle(id: string, faceId: string, ids: readonly string[]): Record<string, unknown> {
  return { id, faceId, vertexIds: [...ids], semanticVertexIds: [...ids] };
}

function validBundle(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: 'm0f-face-complex-audit-input',
    contractStatus: 'candidate',
    scientificClaim: false,
    source: {
      specVersion: '1.2',
      verticesCoords: [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      edgesVertices: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [0, 2],
      ],
      edgesAssignment: ['B', 'B', 'B', 'B', 'M'],
      facesVertices: null,
    },
    artifact: {
      inputSpecVersion: '1.2',
      exactCoordinateEncoding: FACE_COMPLEX_AUDIT_EXACT_COORDINATE_ENCODING,
      vertices: [
        vertex('v:0', 0, 0, 0),
        vertex('v:1', 1, 0, 1),
        vertex('v:2', 1, 1, 2),
        vertex('v:3', 0, 1, 3),
      ],
      edges: [
        edge('e:0', 'v:0', 'v:1', 'B', 0),
        edge('e:1', 'v:1', 'v:2', 'B', 1),
        edge('e:2', 'v:2', 'v:3', 'B', 2),
        edge('e:3', 'v:3', 'v:0', 'B', 3),
        edge('e:4', 'v:0', 'v:2', 'M', 4),
      ],
      exteriorBoundary: {
        id: 'boundary:exterior',
        vertexIds: ['v:0', 'v:3', 'v:2', 'v:1'],
        edgeIds: ['e:3', 'e:2', 'e:1', 'e:0'],
        areaSign: 1,
      },
      faces: [
        {
          id: 'face:0',
          vertexIds: ['v:0', 'v:1', 'v:2'],
          edgeIds: ['e:0', 'e:1', 'e:4'],
          areaSign: -1,
          triangles: [triangle('triangle face:0 0', 'face:0', ['v:0', 'v:1', 'v:2'])],
        },
        {
          id: 'face:1',
          vertexIds: ['v:0', 'v:2', 'v:3'],
          edgeIds: ['e:4', 'e:2', 'e:3'],
          areaSign: -1,
          triangles: [triangle('triangle face:1 0', 'face:1', ['v:0', 'v:2', 'v:3'])],
        },
      ],
      topology: {
        sourceVertexCount: 4,
        sourceEdgeCount: 5,
        planarVertexCount: 4,
        planarEdgeCount: 5,
        boundedFaceCount: 2,
        triangleCount: 2,
        createdIntersectionVertexCount: 0,
        nonDyadicVertexCount: 0,
        eulerValue: 1,
      },
    },
  };
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('test fixture entry must be a record');
  }
  return value as Record<string, unknown>;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new TypeError('test fixture entry must be an array');
  return value;
}

function issueCodes(value: unknown): readonly string[] {
  const result = parseFaceComplexAuditInputV1(value);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('expected contract rejection');
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.error)).toBe(true);
  for (const entry of result.error) expect(Object.isFrozen(entry)).toBe(true);
  return result.error.map((entry) => entry.code);
}

describe('independent face-complex audit input contract', () => {
  it('returns one owned, deeply frozen closed bundle', () => {
    const caller = validBundle();
    const callerArtifact = record(caller.artifact);
    const callerVertices = array(callerArtifact.vertices);
    const sharedExactCoordinate = record(record(callerVertices[0]).exactCoordinate);
    record(callerVertices[1]).exactCoordinate = sharedExactCoordinate;
    const result = parseFaceComplexAuditInputV1(caller);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('valid bundle must parse');

    const callerSource = record(caller.source);
    const firstCoordinate = array(array(callerSource.verticesCoords)[0]);
    firstCoordinate[0] = 99;
    record(sharedExactCoordinate.x).numerator = '99';
    expect(result.value.source.verticesCoords[0]).toEqual([0, 0]);
    expect(result.value.artifact.vertices[0]?.exactCoordinate.x.numerator).toBe('0');
    expect(result.value.artifact.vertices[0]?.exactCoordinate).not.toBe(sharedExactCoordinate);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.source.verticesCoords[0])).toBe(true);
    expect(Object.isFrozen(result.value.artifact.vertices[0]?.exactCoordinate.x)).toBe(true);
    expect(Object.isFrozen(result.value.artifact.faces[0]?.triangles)).toBe(true);
  });

  it('rejects unknown fields, full projections, and claim escalation', () => {
    const rootClaim = validBundle();
    rootClaim.verified = true;
    rootClaim.success = true;
    rootClaim.scientificClaim = true;
    expect(issueCodes(rootClaim)).toEqual(
      expect.arrayContaining(['unknown-field', 'invalid-literal']),
    );

    const projection = validBundle();
    record(projection.artifact).foldProjection = {};
    expect(issueCodes(projection)).toContain('unknown-field');
  });

  it('closes every nested object layer against undeclared fields', () => {
    const addUnknownField: readonly ((bundle: Record<string, unknown>) => void)[] = [
      (bundle) => {
        record(bundle.source).unexpected = true;
      },
      (bundle) => {
        record(bundle.artifact).unexpected = true;
      },
      (bundle) => {
        record(array(record(bundle.artifact).vertices)[0]).unexpected = true;
      },
      (bundle) => {
        record(record(array(record(bundle.artifact).vertices)[0]).exactCoordinate).unexpected =
          true;
      },
      (bundle) => {
        record(
          record(record(array(record(bundle.artifact).vertices)[0]).exactCoordinate).x,
        ).unexpected = true;
      },
      (bundle) => {
        record(array(record(bundle.artifact).edges)[0]).unexpected = true;
      },
      (bundle) => {
        record(array(record(array(record(bundle.artifact).edges)[0]).sourceEdges)[0]).unexpected =
          true;
      },
      (bundle) => {
        record(record(bundle.artifact).exteriorBoundary).unexpected = true;
      },
      (bundle) => {
        record(array(record(bundle.artifact).faces)[0]).unexpected = true;
      },
      (bundle) => {
        record(array(record(array(record(bundle.artifact).faces)[0]).triangles)[0]).unexpected =
          true;
      },
      (bundle) => {
        record(record(bundle.artifact).topology).unexpected = true;
      },
    ];

    for (const mutate of addUnknownField) {
      const bundle = validBundle();
      mutate(bundle);
      expect(issueCodes(bundle)).toContain('unknown-field');
    }
  });

  it('validates canonical decimal rationals independently with BigInt gcd', () => {
    const unreduced = validBundle();
    const firstVertex = record(array(record(unreduced.artifact).vertices)[0]);
    record(record(firstVertex.exactCoordinate).x).numerator = '9007199254740994';
    record(record(firstVertex.exactCoordinate).x).denominator = '9007199254740992';
    expect(issueCodes(unreduced)).toContain('non-canonical-rational');

    for (const malformedParts of [
      { numerator: '01', denominator: '1' },
      { numerator: '-0', denominator: '1' },
      { numerator: '+1', denominator: '1' },
      { numerator: '1', denominator: '0' },
      { numerator: '1', denominator: '-1' },
      { numerator: '1', denominator: '01' },
    ]) {
      const malformed = validBundle();
      const malformedVertex = record(array(record(malformed.artifact).vertices)[0]);
      const coordinate = record(record(malformedVertex.exactCoordinate).x);
      coordinate.numerator = malformedParts.numerator;
      coordinate.denominator = malformedParts.denominator;
      expect(issueCodes(malformed)).toContain('invalid-rational');
    }

    const canonicalNegative = validBundle();
    const canonicalVertex = record(array(record(canonicalNegative.artifact).vertices)[0]);
    const canonicalCoordinate = record(record(canonicalVertex.exactCoordinate).x);
    canonicalCoordinate.numerator = '-2';
    canonicalCoordinate.denominator = '3';
    expect(parseFaceComplexAuditInputV1(canonicalNegative).ok).toBe(true);
  });

  it('checks finite tuples, safe indices, assignments, IDs, and matching spec versions', () => {
    const malformed = validBundle();
    const source = record(malformed.source);
    array(array(source.verticesCoords)[0])[0] = Number.NaN;
    array(source.edgesVertices)[0] = [0, 1, 2];
    array(source.edgesVertices)[1] = [0, 0.5];
    array(source.edgesVertices)[2] = [0, Number.MAX_SAFE_INTEGER + 1];
    array(source.edgesAssignment)[0] = 'X';
    const artifact = record(malformed.artifact);
    record(array(artifact.vertices)[1]).displayCoordinate = [0, Number.POSITIVE_INFINITY];
    record(array(artifact.edges)[1]).vertexIds = ['v:0'];
    record(array(artifact.vertices)[0]).id = '頂点';
    record(array(record(array(artifact.edges)[0]).sourceEdges)[0]).sourceEdgeIndex = -1;
    record(array(record(array(artifact.faces)[0]).triangles)[0]).semanticVertexIds = ['v:0', 'v:1'];
    artifact.inputSpecVersion = '1.1';
    expect(issueCodes(malformed)).toEqual(
      expect.arrayContaining([
        'invalid-number',
        'invalid-tuple',
        'invalid-assignment',
        'invalid-id',
        'invalid-index',
        'cross-field-mismatch',
      ]),
    );
  });

  it('enforces parallel source lengths and every fixed contract literal', () => {
    const mismatchedLength = validBundle();
    array(record(mismatchedLength.source).edgesAssignment).pop();
    expect(issueCodes(mismatchedLength)).toContain('length-mismatch');

    const malformed = validBundle();
    malformed.schemaVersion = 2;
    malformed.recordType = 'm0f-face-complex-audit-result';
    malformed.contractStatus = 'verified';
    malformed.scientificClaim = true;
    record(malformed.source).facesVertices = [];
    const artifact = record(malformed.artifact);
    artifact.inputSpecVersion = '1.1';
    artifact.exactCoordinateEncoding = 'decimal-rounded';
    record(artifact.exteriorBoundary).areaSign = -1;
    record(array(artifact.faces)[0]).areaSign = 1;
    record(artifact.topology).eulerValue = 2;

    const result = parseFaceComplexAuditInputV1(malformed);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('fixed literals must be rejected');
    expect(result.error.map((entry) => entry.path)).toEqual(
      expect.arrayContaining([
        '$.schemaVersion',
        '$.recordType',
        '$.contractStatus',
        '$.scientificClaim',
        '$.source.facesVertices',
        '$.artifact.inputSpecVersion',
        '$.artifact.exactCoordinateEncoding',
        '$.artifact.exteriorBoundary.areaSign',
        '$.artifact.faces[0].areaSign',
        '$.artifact.topology.eulerValue',
      ]),
    );
  });

  it('leaves duplicate, reference, count, and incidence decisions to the audit engine', () => {
    const structurallyValid = validBundle();
    const artifact = record(structurallyValid.artifact);
    const vertices = array(artifact.vertices);
    record(vertices[1]).id = record(vertices[0]).id;
    const firstEdge = record(array(artifact.edges)[0]);
    firstEdge.vertexIds = ['v:missing', 'v:missing'];
    firstEdge.assignment = 'M';
    record(artifact.topology).planarVertexCount = 999;
    const firstFace = record(array(artifact.faces)[0]);
    firstFace.edgeIds = ['e:0', 'e:1', 'e:4', 'e:4'];
    record(array(firstFace.triangles)[0]).semanticVertexIds = ['v:0', 'v:0', 'v:0'];
    const source = record(structurallyValid.source);
    array(source.edgesVertices)[0] = [999, 999];

    expect(parseFaceComplexAuditInputV1(structurallyValid).ok).toBe(true);
  });

  it('rejects exotic, cyclic, sparse, and accessor-bearing caller data without invoking getters', () => {
    expect(issueCodes(new Map([['recordType', 'm0f-face-complex-audit-input']]))).toContain(
      'invalid-snapshot',
    );

    const classInstance = Object.assign(
      new (class Bundle {
        readonly marker = true;
      })(),
      validBundle(),
    );
    expect(issueCodes(classInstance)).toContain('invalid-snapshot');

    const exotic = validBundle();
    Object.setPrototypeOf(exotic, { marker: true });
    expect(issueCodes(exotic)).toContain('invalid-snapshot');

    const symbolKey = validBundle();
    Object.defineProperty(symbolKey, Symbol('hidden'), { enumerable: true, value: true });
    expect(issueCodes(symbolKey)).toContain('invalid-snapshot');

    const symbolValue = validBundle();
    symbolValue.scientificClaim = Symbol('false');
    expect(issueCodes(symbolValue)).toContain('invalid-snapshot');

    const nonEnumerable = validBundle();
    Object.defineProperty(nonEnumerable, 'hidden', { enumerable: false, value: true });
    expect(issueCodes(nonEnumerable)).toContain('invalid-snapshot');

    const cyclic = validBundle();
    cyclic.cycle = cyclic;
    expect(issueCodes(cyclic)).toContain('invalid-snapshot');

    const sparse = validBundle();
    const sparseCoordinates: unknown[] = [[0, 0]];
    sparseCoordinates.length = 3;
    sparseCoordinates[2] = [1, 1];
    record(sparse.source).verticesCoords = sparseCoordinates;
    expect(issueCodes(sparse)).toContain('invalid-snapshot');

    let getterCalls = 0;
    const nestedAccessor = validBundle();
    const nestedCoordinates = array(record(nestedAccessor.source).verticesCoords);
    const firstNestedCoordinate = nestedCoordinates[0];
    Object.defineProperty(nestedCoordinates, '0', {
      enumerable: true,
      get(): unknown {
        getterCalls += 1;
        return firstNestedCoordinate;
      },
    });
    expect(issueCodes(nestedAccessor)).toContain('invalid-snapshot');
    expect(getterCalls).toBe(0);

    const accessor = validBundle();
    Object.defineProperty(accessor, 'scientificClaim', {
      enumerable: true,
      get(): false {
        getterCalls += 1;
        return false;
      },
    });
    expect(issueCodes(accessor)).toContain('invalid-snapshot');
    expect(getterCalls).toBe(0);

    let proxyGetCalls = 0;
    const proxied = validBundle();
    const coordinates = array(record(proxied.source).verticesCoords);
    record(proxied.source).verticesCoords = new Proxy(coordinates, {
      get(target, property, receiver): unknown {
        proxyGetCalls += 1;
        return Reflect.get(target, property, receiver) as unknown;
      },
    });
    expect(issueCodes(proxied)).toContain('invalid-snapshot');
    expect(proxyGetCalls).toBe(0);

    const revoked = Proxy.revocable(validBundle(), {});
    revoked.revoke();
    expect(issueCodes(revoked.proxy)).toContain('invalid-snapshot');
  });

  it('keeps the audit contract free from producer geometry and exact-rational imports', async () => {
    const source = await readFile(
      resolve('m0f/reference-verifier/face-complex-contract.ts'),
      'utf8',
    );
    const imports = [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map(
      (match) => match[1],
    );
    expect(imports).toEqual(['../clone-and-freeze.js']);
    expect(source).not.toMatch(/\b(?:import\s*\(|require\s*\()/);
    expect(source).not.toMatch(/\/geometry\/|\/experiments\/|\/model\/exact-rational/);
  });
});
