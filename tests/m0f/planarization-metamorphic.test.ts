import { describe, expect, it } from 'vitest';

import {
  planarizeDyadicSegments,
  type CandidatePlanarization,
  type SourceEdgeSegment2,
} from '../../m0f/geometry/planarize-segments.js';

type OracleRational = Readonly<{ numerator: bigint; denominator: bigint }>;
type OraclePoint = Readonly<{ x: OracleRational; y: OracleRational }>;
type OracleSegment = Readonly<{ start: OraclePoint; end: OraclePoint }>;
type OutputPoint = CandidatePlanarization['vertices'][number]['point'];

const FRACTION_MASK = (1n << 52n) - 1n;
const HIDDEN_BIT = 1n << 52n;

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absolute(left);
  let b = absolute(right);
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function rational(numerator: bigint, denominator = 1n): OracleRational {
  if (denominator === 0n) throw new Error('oracle division by zero');
  if (numerator === 0n) return { numerator: 0n, denominator: 1n };
  const divisor = greatestCommonDivisor(numerator, denominator);
  const denominatorSign = denominator < 0n ? -1n : 1n;
  return {
    numerator: (numerator * denominatorSign) / divisor,
    denominator: absolute(denominator) / divisor,
  };
}

function decodeBinary64(value: number): OracleRational {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  const exponentBits = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & FRACTION_MASK;
  const unsignedCoefficient = exponentBits === 0 ? fraction : HIDDEN_BIT | fraction;
  const coefficient = bits >> 63n === 0n ? unsignedCoefficient : -unsignedCoefficient;
  const exponent = exponentBits === 0 ? -1074 : exponentBits - 1075;
  return exponent >= 0
    ? rational(coefficient << BigInt(exponent))
    : rational(coefficient, 1n << BigInt(-exponent));
}

function add(left: OracleRational, right: OracleRational): OracleRational {
  return rational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function subtract(left: OracleRational, right: OracleRational): OracleRational {
  return rational(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function multiply(left: OracleRational, right: OracleRational): OracleRational {
  return rational(left.numerator * right.numerator, left.denominator * right.denominator);
}

function divide(left: OracleRational, right: OracleRational): OracleRational {
  return rational(left.numerator * right.denominator, left.denominator * right.numerator);
}

function compare(left: OracleRational, right: OracleRational): -1 | 0 | 1 {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function pointEqual(left: OraclePoint, right: OraclePoint): boolean {
  return compare(left.x, right.x) === 0 && compare(left.y, right.y) === 0;
}

function minimum(left: OracleRational, right: OracleRational): OracleRational {
  return compare(left, right) <= 0 ? left : right;
}

function maximum(left: OracleRational, right: OracleRational): OracleRational {
  return compare(left, right) >= 0 ? left : right;
}

function cross(
  leftX: OracleRational,
  leftY: OracleRational,
  rightX: OracleRational,
  rightY: OracleRational,
): OracleRational {
  return subtract(multiply(leftX, rightY), multiply(leftY, rightX));
}

function orientation(a: OraclePoint, b: OraclePoint, c: OraclePoint): -1 | 0 | 1 {
  return compare(
    cross(subtract(b.x, a.x), subtract(b.y, a.y), subtract(c.x, a.x), subtract(c.y, a.y)),
    rational(0n),
  );
}

function onSegment(point: OraclePoint, segment: OracleSegment): boolean {
  return (
    orientation(segment.start, segment.end, point) === 0 &&
    compare(point.x, minimum(segment.start.x, segment.end.x)) >= 0 &&
    compare(point.x, maximum(segment.start.x, segment.end.x)) <= 0 &&
    compare(point.y, minimum(segment.start.y, segment.end.y)) >= 0 &&
    compare(point.y, maximum(segment.start.y, segment.end.y)) <= 0
  );
}

function isInterior(point: OraclePoint, segment: OracleSegment): boolean {
  return (
    onSegment(point, segment) &&
    !pointEqual(point, segment.start) &&
    !pointEqual(point, segment.end)
  );
}

function opposite(left: -1 | 0 | 1, right: -1 | 0 | 1): boolean {
  return (left === -1 && right === 1) || (left === 1 && right === -1);
}

function properIntersection(a: OracleSegment, b: OracleSegment): OraclePoint | undefined {
  const aStart = orientation(a.start, a.end, b.start);
  const aEnd = orientation(a.start, a.end, b.end);
  const bStart = orientation(b.start, b.end, a.start);
  const bEnd = orientation(b.start, b.end, a.end);
  if (!opposite(aStart, aEnd) || !opposite(bStart, bEnd)) return undefined;

  const rayAX = subtract(a.end.x, a.start.x);
  const rayAY = subtract(a.end.y, a.start.y);
  const rayBX = subtract(b.end.x, b.start.x);
  const rayBY = subtract(b.end.y, b.start.y);
  const offsetX = subtract(b.start.x, a.start.x);
  const offsetY = subtract(b.start.y, a.start.y);
  const parameter = divide(
    cross(offsetX, offsetY, rayBX, rayBY),
    cross(rayAX, rayAY, rayBX, rayBY),
  );
  return {
    x: add(a.start.x, multiply(parameter, rayAX)),
    y: add(a.start.y, multiply(parameter, rayAY)),
  };
}

function toOracleSegment(source: SourceEdgeSegment2): OracleSegment {
  return {
    start: { x: decodeBinary64(source.start.x), y: decodeBinary64(source.start.y) },
    end: { x: decodeBinary64(source.end.x), y: decodeBinary64(source.end.y) },
  };
}

function toOracleOutputPoint(point: OutputPoint): OraclePoint {
  return {
    x: rational(point.x.numerator, point.x.denominator),
    y: rational(point.y.numerator, point.y.denominator),
  };
}

function pointKey(point: OraclePoint): string {
  const component = (value: OracleRational): string => `${value.numerator}/${value.denominator}`;
  return `${component(point.x)},${component(point.y)}`;
}

function expectedEventPoints(sources: readonly SourceEdgeSegment2[]): readonly OraclePoint[] {
  const events = new Map<string, OraclePoint>();
  for (let leftIndex = 0; leftIndex < sources.length; leftIndex += 1) {
    const leftSource = sources[leftIndex];
    if (leftSource === undefined) throw new Error('oracle source is missing');
    const left = toOracleSegment(leftSource);
    for (let rightIndex = leftIndex + 1; rightIndex < sources.length; rightIndex += 1) {
      const rightSource = sources[rightIndex];
      if (rightSource === undefined) throw new Error('oracle source is missing');
      const right = toOracleSegment(rightSource);
      const proper = properIntersection(left, right);
      if (proper !== undefined) {
        events.set(pointKey(proper), proper);
        continue;
      }
      for (const endpoint of [left.start, left.end]) {
        if (isInterior(endpoint, right)) events.set(pointKey(endpoint), endpoint);
      }
      for (const endpoint of [right.start, right.end]) {
        if (isInterior(endpoint, left)) events.set(pointKey(endpoint), endpoint);
      }
    }
  }
  return [...events.values()];
}

function source(
  sourceEdgeId: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): SourceEdgeSegment2 {
  return {
    sourceEdgeId,
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
  };
}

function createGenerator(seed: number): () => number {
  let state = seed >>> 0;
  return (): number => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
}

function generatedCorpus(index: number): readonly SourceEdgeSegment2[] {
  const next = createGenerator((0x4f524947 ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const scale = 2 ** ((next() % 4) - 2);
  const originX = ((next() % 81) - 40) * scale;
  const originY = ((next() % 81) - 40) * scale;
  const prefix = `c${index}`;
  return [
    source(`${prefix}.trunk`, originX, originY, originX + 12 * scale, originY),
    source(
      `${prefix}.cross`,
      originX + 2 * scale,
      originY - 3 * scale,
      originX + 4 * scale,
      originY + 6 * scale,
    ),
    source(
      `${prefix}.branch`,
      originX + 9 * scale,
      originY,
      originX + 9 * scale,
      originY + 2 * scale,
    ),
    source(
      `${prefix}.isolated`,
      originX + 6 * scale,
      originY + 10 * scale,
      originX + 8 * scale,
      originY + 10 * scale,
    ),
  ];
}

function reverseSegment(segment: SourceEdgeSegment2): SourceEdgeSegment2 {
  return { ...segment, start: segment.end, end: segment.start };
}

function shuffled(
  sources: readonly SourceEdgeSegment2[],
  next: () => number,
): readonly SourceEdgeSegment2[] {
  const result = [...sources];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = next() % (index + 1);
    const temporary = result[index];
    const otherValue = result[other];
    if (temporary === undefined || otherValue === undefined) {
      throw new Error('shuffle index must reference a source segment');
    }
    result[index] = otherValue;
    result[other] = temporary;
  }
  return result;
}

function requirePlanarization(sources: readonly SourceEdgeSegment2[]): CandidatePlanarization {
  const result = planarizeDyadicSegments(sources);
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

describe('M0F planarization fixed-seed metamorphic oracle', () => {
  it('is invariant under permutations and independent direction reversals', () => {
    for (let corpusIndex = 0; corpusIndex < 32; corpusIndex += 1) {
      const corpus = generatedCorpus(corpusIndex);
      const baseline = requirePlanarization(corpus);
      const next = createGenerator((0x6a09e667 ^ corpusIndex) >>> 0);
      const partialReversal = corpus.map((segment, segmentIndex) =>
        segmentIndex % 2 === corpusIndex % 2 ? reverseSegment(segment) : segment,
      );
      const variants = [
        [...corpus].reverse(),
        corpus.map(reverseSegment),
        partialReversal,
        shuffled(corpus, next),
        shuffled(partialReversal, next),
      ];
      for (const variant of variants) {
        expect(requirePlanarization(variant)).toEqual(baseline);
      }
    }
  });

  it('satisfies exact provenance, incidence, event uniqueness, and nonzero-edge invariants', () => {
    for (let corpusIndex = 0; corpusIndex < 32; corpusIndex += 1) {
      const corpus = generatedCorpus(corpusIndex);
      const result = requirePlanarization(corpus);
      const sourceById = new Map(corpus.map((entry) => [entry.sourceEdgeId, entry]));
      const vertexById = new Map(result.vertices.map((vertex) => [vertex.id, vertex.point]));

      for (const edge of result.edges) {
        expect(edge.sourceEdgeIds).toHaveLength(1);
        const sourceId = edge.sourceEdgeIds[0];
        const original = sourceId === undefined ? undefined : sourceById.get(sourceId);
        const start = vertexById.get(edge.startVertexId);
        const end = vertexById.get(edge.endVertexId);
        expect(original).toBeDefined();
        expect(start).toBeDefined();
        expect(end).toBeDefined();
        if (original === undefined || start === undefined || end === undefined) {
          throw new Error('edge provenance or endpoint is missing');
        }
        const oracleSource = toOracleSegment(original);
        const oracleStart = toOracleOutputPoint(start);
        const oracleEnd = toOracleOutputPoint(end);
        expect(onSegment(oracleStart, oracleSource)).toBe(true);
        expect(onSegment(oracleEnd, oracleSource)).toBe(true);
        expect(pointEqual(oracleStart, oracleEnd)).toBe(false);
      }

      const expectedEvents = expectedEventPoints(corpus);
      expect(expectedEvents).toHaveLength(2);
      const outputPoints = result.vertices.map((vertex) => toOracleOutputPoint(vertex.point));
      for (const event of expectedEvents) {
        expect(outputPoints.filter((point) => pointEqual(point, event))).toHaveLength(1);
      }
      expect(expectedEvents.some((point) => point.x.denominator % 3n === 0n)).toBe(true);
    }
  });
});
