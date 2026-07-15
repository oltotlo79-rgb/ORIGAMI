import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  canonicalReferenceModelHash,
  parseReferenceModelV1,
  type ReferenceModelV1,
} from '../../m0f/model/reference-model.js';
import { evaluateConventionsV1 } from '../../m0f/model/conventions.js';

async function fixtureDocument(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(resolve('tests/vectors/m0f-0/convention-two-face-v1.json'), 'utf8'),
  ) as Record<string, unknown>;
}

async function goldenDocument(): Promise<{
  canonicalHash: string;
  evidence: unknown;
}> {
  return JSON.parse(
    await readFile(resolve('tests/vectors/m0f-0/convention-two-face-v1.golden.json'), 'utf8'),
  ) as { canonicalHash: string; evidence: unknown };
}

function requireModel(raw: unknown): ReferenceModelV1 {
  const result = parseReferenceModelV1(raw);
  if (!result.ok) {
    throw new Error(result.error.map((issue) => `${issue.path}: ${issue.code}`).join('; '));
  }
  return result.value;
}

function expectReferenceIssue(raw: unknown, code: string): void {
  const result = parseReferenceModelV1(raw);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected reference-model issue ${code}`);
  expect(result.error.some((issue) => issue.code === code)).toBe(true);
}

function expectConventionIssue(model: ReferenceModelV1, code: string): void {
  const result = evaluateConventionsV1(model);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected convention issue ${code}`);
  expect(result.error.some((issue) => issue.code === code)).toBe(true);
}

describe('M0F-0 reference model parser', () => {
  it('accepts the two-face convention vector without making a scientific claim', async () => {
    const model = requireModel(await fixtureDocument());
    expect(model.scope).toBe('conventions-only');
    expect(model.scientificClaim).toBe(false);
    expect(model.paper.normalizedShortSide).toBe(1);
  });

  it('returns an owned deeply frozen convention vector', async () => {
    const raw = await fixtureDocument();
    const model = requireModel(raw);
    raw.scientificClaim = true;
    const rawVertices = raw.vertices as Record<string, unknown>[];
    const firstRawVertex = rawVertices[0];
    if (firstRawVertex === undefined) throw new Error('fixture vertex must exist');
    firstRawVertex.x = 99;

    expect(model.scientificClaim).toBe(false);
    expect(model.vertices[0]?.x).toBe(0);
    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.vertices[0])).toBe(true);
  });

  it('validates one getter-consistent convention snapshot', async () => {
    const raw = await fixtureDocument();
    let reads = 0;
    Object.defineProperty(raw, 'scientificClaim', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? false : true;
      },
    });
    const result = parseReferenceModelV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('snapshot must parse');
    expect(result.value.scientificClaim).toBe(false);
    expect(reads).toBe(1);
  });

  it('rejects unknown fields, non-finite coordinates, duplicate IDs, and bad references', async () => {
    const unknownField = await fixtureDocument();
    unknownField.unexpected = true;
    expectReferenceIssue(unknownField, 'unknown-field');

    const nonFinite = await fixtureDocument();
    const vertices = nonFinite.vertices as Record<string, unknown>[];
    vertices[0] = { ...vertices[0], x: Number.POSITIVE_INFINITY };
    expectReferenceIssue(nonFinite, 'non-finite-number');

    const duplicate = await fixtureDocument();
    const duplicateVertices = duplicate.vertices as Record<string, unknown>[];
    duplicateVertices[1] = { ...duplicateVertices[1], id: 'v-tl' };
    expectReferenceIssue(duplicate, 'duplicate-id');

    const badReference = await fixtureDocument();
    const edges = badReference.edges as Record<string, unknown>[];
    edges[0] = { ...edges[0], vertices: ['v-missing', 'v-tm'] };
    expectReferenceIssue(badReference, 'missing-reference');
  });

  it('rejects a face whose exact binary64 signed area is zero', async () => {
    const raw = await fixtureDocument();
    const faces = raw.faces as Record<string, unknown>[];
    faces[0] = { ...faces[0], vertices: ['v-tl', 'v-tm', 'v-tr'] };
    expectReferenceIssue(raw, 'degenerate-face');
  });
});

describe('M0F-0 coordinate, M/V, normal, and layer conventions', () => {
  it('interprets front-wound faces, FOLD-positive valley angle, and above/below identically', async () => {
    const model = requireModel(await fixtureDocument());
    const result = evaluateConventionsV1(model);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected valid convention vector');
    expect(result.value).toEqual((await goldenDocument()).evidence);
  });

  it('maps a negative FOLD angle to mountain and rejects an M/V sign mismatch', async () => {
    const raw = await fixtureDocument();
    const edges = raw.edges as Record<string, unknown>[];
    const hingeIndex = edges.findIndex((edge) => edge.id === 'e-hinge');
    edges[hingeIndex] = { ...edges[hingeIndex], assignment: 'M' };
    const samples = raw.hingeSamples as Record<string, unknown>[];
    samples[0] = { ...samples[0], foldAngleRadians: -Math.PI / 2 };
    const mountain = evaluateConventionsV1(requireModel(raw));
    expect(mountain.ok).toBe(true);
    if (!mountain.ok) throw new Error('expected valid mountain convention');
    expect(mountain.value.hingeAssignments).toEqual([
      { edgeId: 'e-hinge', foldAngleSign: -1, assignment: 'M' },
    ]);

    samples[0] = { ...samples[0], foldAngleRadians: Math.PI / 2 };
    expectConventionIssue(requireModel(raw), 'mv-sign-mismatch');
  });

  it('rejects reversed face winding and a cyclic symbolic layer order', async () => {
    const reversed = await fixtureDocument();
    const faces = reversed.faces as Record<string, unknown>[];
    const firstFace = faces[0];
    const firstRing: unknown = firstFace?.vertices;
    if (!Array.isArray(firstRing) || !firstRing.every((entry) => typeof entry === 'string')) {
      throw new Error('bad fixture');
    }
    faces[0] = { ...firstFace, vertices: [...firstRing].reverse() };
    expectConventionIssue(requireModel(reversed), 'face-winding');

    const cyclic = await fixtureDocument();
    const regions = cyclic.overlapRegions as Record<string, unknown>[];
    regions.push({
      id: 'overlap-return',
      faceIds: ['f-left', 'f-right'],
      aboveFaceId: 'f-left',
      belowFaceId: 'f-right',
    });
    expectConventionIssue(requireModel(cyclic), 'layer-cycle');
  });
});

describe('M0F-0 reference model canonical hash', () => {
  it('is invariant to object, collection, and face-ring presentation order', async () => {
    const original = requireModel(await fixtureDocument());
    const permutedRaw = await fixtureDocument();
    permutedRaw.vertices = [...(permutedRaw.vertices as unknown[])].reverse();
    permutedRaw.edges = [...(permutedRaw.edges as unknown[])].reverse();
    permutedRaw.faces = [...(permutedRaw.faces as Record<string, unknown>[])]
      .reverse()
      .map((face) => {
        const vertices = face.vertices as string[];
        return { ...face, vertices: [...vertices.slice(1), vertices[0]] };
      });
    permutedRaw.overlapRegions = [...(permutedRaw.overlapRegions as unknown[])].reverse();
    const permuted = requireModel(permutedRaw);

    const expected = await canonicalReferenceModelHash(original);
    expect(expected).toBe((await goldenDocument()).canonicalHash);
    expect(expected).toMatch(/^sha256:[0-9a-f]{64}$/);
    await expect(canonicalReferenceModelHash(permuted)).resolves.toBe(expected);
  });

  it('changes when one semantic coordinate changes by one ULP', async () => {
    const original = requireModel(await fixtureDocument());
    const changedRaw = await fixtureDocument();
    const vertices = changedRaw.vertices as Record<string, unknown>[];
    const targetIndex = vertices.findIndex((vertex) => vertex.id === 'v-tm');
    vertices[targetIndex] = { ...vertices[targetIndex], x: 0.5000000000000001 };
    const changed = requireModel(changedRaw);
    await expect(canonicalReferenceModelHash(changed)).resolves.not.toBe(
      await canonicalReferenceModelHash(original),
    );
  });
});
