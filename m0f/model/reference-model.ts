import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { stableStringify, type JsonValue } from '../stable-json.js';
import { exactPolygonAreaSign } from './exact-dyadic.js';

export const REFERENCE_MODEL_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/reference-model-v1.schema.json' as const;
export const M0F_CONVENTIONS_ID = 'oridesign-m0f-conventions-v1' as const;
export const CANONICALIZATION_VERSION = 'oridesign-canonical-v1' as const;

export type ReferenceAssignment = 'M' | 'V' | 'B' | 'F' | 'U';

export type ReferenceVertex = Readonly<{ id: string; x: number; y: number }>;
export type ReferenceFace = Readonly<{ id: string; vertices: readonly string[] }>;
export type ReferenceEdge = Readonly<{
  id: string;
  vertices: readonly [string, string];
  assignment: ReferenceAssignment;
  leftFaceId: string | null;
  rightFaceId: string | null;
}>;
export type HingeSample = Readonly<{ edgeId: string; foldAngleRadians: number }>;
export type OverlapRegion = Readonly<{
  id: string;
  faceIds: readonly [string, string];
  aboveFaceId: string;
  belowFaceId: string;
}>;

export type ReferenceModelV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof REFERENCE_MODEL_SCHEMA_ID;
  conventionsId: typeof M0F_CONVENTIONS_ID;
  canonicalizationVersion: typeof CANONICALIZATION_VERSION;
  id: string;
  scope: 'conventions-only';
  scientificClaim: false;
  paper: Readonly<{ width: number; height: number; normalizedShortSide: 1 }>;
  vertices: readonly ReferenceVertex[];
  edges: readonly ReferenceEdge[];
  faces: readonly ReferenceFace[];
  hingeSamples: readonly HingeSample[];
  overlapRegions: readonly OverlapRegion[];
}>;

export type ReferenceModelIssue = Readonly<{
  path: string;
  code: string;
  message: string;
}>;

export type ReferenceModelParseResult =
  | Readonly<{ ok: true; value: ReferenceModelV1 }>
  | Readonly<{ ok: false; error: readonly ReferenceModelIssue[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'schemaId',
  'conventionsId',
  'canonicalizationVersion',
  'id',
  'scope',
  'scientificClaim',
  'paper',
  'vertices',
  'edges',
  'faces',
  'hingeSamples',
  'overlapRegions',
] as const;
const PAPER_KEYS = ['width', 'height', 'normalizedShortSide'] as const;
const VERTEX_KEYS = ['id', 'x', 'y'] as const;
const EDGE_KEYS = ['id', 'vertices', 'assignment', 'leftFaceId', 'rightFaceId'] as const;
const FACE_KEYS = ['id', 'vertices'] as const;
const HINGE_SAMPLE_KEYS = ['edgeId', 'foldAngleRadians'] as const;
const OVERLAP_KEYS = ['id', 'faceIds', 'aboveFaceId', 'belowFaceId'] as const;
const ASSIGNMENTS: readonly ReferenceAssignment[] = ['M', 'V', 'B', 'F', 'U'];
const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issue(issues: ReferenceModelIssue[], path: string, code: string, message: string): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: ReferenceModelIssue[],
): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      issue(issues, `${path}.${key}`, 'unknown-field', 'field is not declared by schema version 1');
    }
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) {
      issue(issues, `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function validId(value: unknown, path: string, issues: ReferenceModelIssue[]): value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    issue(issues, path, 'invalid-id', 'must be a stable ID of 1..128 ASCII characters');
    return false;
  }
  return true;
}

function finiteNumber(
  value: unknown,
  path: string,
  issues: ReferenceModelIssue[],
): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issue(issues, path, 'non-finite-number', 'must be a finite binary64 number');
    return false;
  }
  return true;
}

function nullableId(
  value: unknown,
  path: string,
  issues: ReferenceModelIssue[],
): value is string | null {
  return value === null || validId(value, path, issues);
}

function stringTuple2(
  value: unknown,
  path: string,
  issues: ReferenceModelIssue[],
): value is [string, string] {
  if (!Array.isArray(value) || value.length !== 2) {
    issue(issues, path, 'invalid-tuple', 'must contain exactly two stable IDs');
    return false;
  }
  const first = validId(value[0], `${path}[0]`, issues);
  const second = validId(value[1], `${path}[1]`, issues);
  return first && second;
}

function registerId(
  id: string,
  path: string,
  seen: Map<string, string>,
  issues: ReferenceModelIssue[],
): void {
  const previous = seen.get(id);
  if (previous !== undefined) {
    issue(issues, path, 'duplicate-id', `stable ID ${id} is already declared at ${previous}`);
  } else {
    seen.set(id, path);
  }
}

function validatePaper(
  value: unknown,
  issues: ReferenceModelIssue[],
): { width: number; height: number } | undefined {
  if (!isRecord(value)) {
    issue(issues, '$.paper', 'invalid-object', 'paper must be an object');
    return undefined;
  }
  exactKeys(value, PAPER_KEYS, '$.paper', issues);
  const width = value.width;
  const height = value.height;
  const hasWidth = finiteNumber(width, '$.paper.width', issues);
  const hasHeight = finiteNumber(height, '$.paper.height', issues);
  if (hasWidth && width <= 0) {
    issue(issues, '$.paper.width', 'out-of-range', 'must be positive');
  }
  if (hasHeight && height <= 0) {
    issue(issues, '$.paper.height', 'out-of-range', 'must be positive');
  }
  if (value.normalizedShortSide !== 1) {
    issue(issues, '$.paper.normalizedShortSide', 'invalid-literal', 'must equal 1');
  }
  if (hasWidth && hasHeight && Math.min(width, height) !== 1) {
    issue(issues, '$.paper', 'paper-not-normalized', 'the shorter paper side must equal 1');
  }
  return hasWidth && hasHeight && width > 0 && height > 0 ? { width, height } : undefined;
}

/** Runtime parser for the intentionally small M0F-0 convention-vector model. */
export function parseReferenceModelV1(supplied: unknown): ReferenceModelParseResult {
  const issues: ReferenceModelIssue[] = [];
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'invalid-object',
          message: 'must be one cloneable plain JSON-data snapshot',
        },
      ],
    };
  }
  const value = snapshot.value;
  if (!isRecord(value)) {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-object', message: 'must be an object' }],
    };
  }
  exactKeys(value, ROOT_KEYS, '$', issues);
  if (value.schemaVersion !== 1)
    issue(issues, '$.schemaVersion', 'invalid-literal', 'must equal 1');
  if (value.schemaId !== REFERENCE_MODEL_SCHEMA_ID) {
    issue(issues, '$.schemaId', 'invalid-literal', `must equal ${REFERENCE_MODEL_SCHEMA_ID}`);
  }
  if (value.conventionsId !== M0F_CONVENTIONS_ID) {
    issue(issues, '$.conventionsId', 'invalid-literal', `must equal ${M0F_CONVENTIONS_ID}`);
  }
  if (value.canonicalizationVersion !== CANONICALIZATION_VERSION) {
    issue(
      issues,
      '$.canonicalizationVersion',
      'invalid-literal',
      `must equal ${CANONICALIZATION_VERSION}`,
    );
  }
  validId(value.id, '$.id', issues);
  if (value.scope !== 'conventions-only') {
    issue(issues, '$.scope', 'invalid-literal', 'must equal conventions-only');
  }
  if (value.scientificClaim !== false) {
    issue(issues, '$.scientificClaim', 'claim-boundary', 'convention vectors must set false');
  }

  const paper = validatePaper(value.paper, issues);
  const seenIds = new Map<string, string>();
  const vertices = new Map<string, ReferenceVertex>();
  if (!Array.isArray(value.vertices) || value.vertices.length < 3) {
    issue(issues, '$.vertices', 'invalid-array', 'must contain at least three vertices');
  } else {
    value.vertices.forEach((candidate, index) => {
      const path = `$.vertices[${index}]`;
      if (!isRecord(candidate)) {
        issue(issues, path, 'invalid-object', 'vertex must be an object');
        return;
      }
      exactKeys(candidate, VERTEX_KEYS, path, issues);
      const id = candidate.id;
      const x = candidate.x;
      const y = candidate.y;
      const hasId = validId(id, `${path}.id`, issues);
      const hasX = finiteNumber(x, `${path}.x`, issues);
      const hasY = finiteNumber(y, `${path}.y`, issues);
      if (hasId) registerId(id, `${path}.id`, seenIds, issues);
      if (hasX && paper !== undefined && (x < 0 || x > paper.width)) {
        issue(issues, `${path}.x`, 'outside-paper', 'must lie inside the normalized paper');
      }
      if (hasY && paper !== undefined && (y < 0 || y > paper.height)) {
        issue(issues, `${path}.y`, 'outside-paper', 'must lie inside the normalized paper');
      }
      if (hasId && hasX && hasY) vertices.set(id, { id, x, y });
    });
  }

  const faces = new Map<string, ReferenceFace>();
  if (!Array.isArray(value.faces) || value.faces.length === 0) {
    issue(issues, '$.faces', 'invalid-array', 'must contain at least one face');
  } else {
    value.faces.forEach((candidate, index) => {
      const path = `$.faces[${index}]`;
      if (!isRecord(candidate)) {
        issue(issues, path, 'invalid-object', 'face must be an object');
        return;
      }
      exactKeys(candidate, FACE_KEYS, path, issues);
      const id = candidate.id;
      const ring = candidate.vertices;
      const hasId = validId(id, `${path}.id`, issues);
      if (hasId) registerId(id, `${path}.id`, seenIds, issues);
      if (!Array.isArray(ring) || ring.length < 3) {
        issue(
          issues,
          `${path}.vertices`,
          'invalid-array',
          'face must contain at least three vertex IDs',
        );
        return;
      }
      const ids: string[] = [];
      ring.forEach((vertexId, vertexIndex) => {
        if (validId(vertexId, `${path}.vertices[${vertexIndex}]`, issues)) ids.push(vertexId);
      });
      if (new Set(ids).size !== ids.length) {
        issue(
          issues,
          `${path}.vertices`,
          'duplicate-face-vertex',
          'face ring cannot repeat a vertex',
        );
      }
      for (const vertexId of ids) {
        if (!vertices.has(vertexId)) {
          issue(issues, `${path}.vertices`, 'missing-reference', `unknown vertex ${vertexId}`);
        }
      }
      const points = ids.map((id) => vertices.get(id)).filter((point) => point !== undefined);
      if (
        points.length === ids.length &&
        points.length >= 3 &&
        exactPolygonAreaSign(points) === 0
      ) {
        issue(issues, `${path}.vertices`, 'degenerate-face', 'exact binary64 signed area is zero');
      }
      if (hasId && ids.length >= 3) faces.set(id, { id, vertices: ids });
    });
  }

  const edges = new Map<string, ReferenceEdge>();
  if (!Array.isArray(value.edges) || value.edges.length === 0) {
    issue(issues, '$.edges', 'invalid-array', 'must contain at least one edge');
  } else {
    value.edges.forEach((candidate, index) => {
      const path = `$.edges[${index}]`;
      if (!isRecord(candidate)) {
        issue(issues, path, 'invalid-object', 'edge must be an object');
        return;
      }
      exactKeys(candidate, EDGE_KEYS, path, issues);
      const id = candidate.id;
      const endpointIds = candidate.vertices;
      const assignment = candidate.assignment;
      const leftFaceId = candidate.leftFaceId;
      const rightFaceId = candidate.rightFaceId;
      const hasId = validId(id, `${path}.id`, issues);
      if (hasId) registerId(id, `${path}.id`, seenIds, issues);
      const hasVertices = stringTuple2(endpointIds, `${path}.vertices`, issues);
      if (hasVertices && endpointIds[0] === endpointIds[1]) {
        issue(issues, `${path}.vertices`, 'degenerate-edge', 'edge endpoints must differ');
      }
      if (hasVertices) {
        endpointIds.forEach((vertexId, vertexIndex) => {
          if (!vertices.has(vertexId)) {
            issue(
              issues,
              `${path}.vertices[${vertexIndex}]`,
              'missing-reference',
              `unknown vertex ${vertexId}`,
            );
          }
        });
      }
      const hasAssignment =
        typeof assignment === 'string' && ASSIGNMENTS.includes(assignment as ReferenceAssignment);
      if (!hasAssignment) {
        issue(
          issues,
          `${path}.assignment`,
          'invalid-enum',
          `must be one of ${ASSIGNMENTS.join(', ')}`,
        );
      }
      const hasLeft = nullableId(leftFaceId, `${path}.leftFaceId`, issues);
      const hasRight = nullableId(rightFaceId, `${path}.rightFaceId`, issues);
      if (hasLeft && leftFaceId !== null && !faces.has(leftFaceId)) {
        issue(issues, `${path}.leftFaceId`, 'missing-reference', `unknown face ${leftFaceId}`);
      }
      if (hasRight && rightFaceId !== null && !faces.has(rightFaceId)) {
        issue(issues, `${path}.rightFaceId`, 'missing-reference', `unknown face ${rightFaceId}`);
      }
      if (leftFaceId !== null && leftFaceId === rightFaceId) {
        issue(issues, path, 'duplicate-incident-face', 'left and right faces must differ');
      }
      const incidentCount = Number(leftFaceId !== null) + Number(rightFaceId !== null);
      if (hasAssignment && assignment === 'B' && incidentCount !== 1) {
        issue(issues, path, 'boundary-incidence', 'B edge must have exactly one incident face');
      }
      if (hasAssignment && assignment !== 'B' && incidentCount !== 2) {
        issue(issues, path, 'interior-incidence', 'non-boundary edge must have two incident faces');
      }
      if (hasVertices) {
        for (const faceId of [leftFaceId, rightFaceId]) {
          if (typeof faceId === 'string') {
            const face = faces.get(faceId);
            if (
              face !== undefined &&
              !endpointIds.every((vertexId) => face.vertices.includes(vertexId))
            ) {
              issue(
                issues,
                path,
                'edge-face-incidence',
                `face ${faceId} does not contain both endpoints`,
              );
            }
          }
        }
      }
      if (hasId && hasVertices && hasAssignment && hasLeft && hasRight) {
        edges.set(id, {
          id,
          vertices: endpointIds,
          assignment: assignment as ReferenceAssignment,
          leftFaceId,
          rightFaceId,
        });
      }
    });
  }

  if (!Array.isArray(value.hingeSamples)) {
    issue(issues, '$.hingeSamples', 'invalid-array', 'must be an array');
  } else {
    const sampledEdges = new Set<string>();
    value.hingeSamples.forEach((candidate, index) => {
      const path = `$.hingeSamples[${index}]`;
      if (!isRecord(candidate)) {
        issue(issues, path, 'invalid-object', 'hinge sample must be an object');
        return;
      }
      exactKeys(candidate, HINGE_SAMPLE_KEYS, path, issues);
      const edgeId = candidate.edgeId;
      const foldAngle = candidate.foldAngleRadians;
      if (validId(edgeId, `${path}.edgeId`, issues)) {
        if (!edges.has(edgeId))
          issue(issues, `${path}.edgeId`, 'missing-reference', `unknown edge ${edgeId}`);
        if (sampledEdges.has(edgeId))
          issue(
            issues,
            `${path}.edgeId`,
            'duplicate-sample',
            'edge may have only one convention sample',
          );
        sampledEdges.add(edgeId);
      }
      if (finiteNumber(foldAngle, `${path}.foldAngleRadians`, issues)) {
        if (foldAngle < -Math.PI || foldAngle > Math.PI) {
          issue(issues, `${path}.foldAngleRadians`, 'out-of-range', 'must be within [-pi, pi]');
        }
      }
    });
  }

  if (!Array.isArray(value.overlapRegions)) {
    issue(issues, '$.overlapRegions', 'invalid-array', 'must be an array');
  } else {
    value.overlapRegions.forEach((candidate, index) => {
      const path = `$.overlapRegions[${index}]`;
      if (!isRecord(candidate)) {
        issue(issues, path, 'invalid-object', 'overlap region must be an object');
        return;
      }
      exactKeys(candidate, OVERLAP_KEYS, path, issues);
      const id = candidate.id;
      const faceIds = candidate.faceIds;
      const aboveFaceId = candidate.aboveFaceId;
      const belowFaceId = candidate.belowFaceId;
      const hasId = validId(id, `${path}.id`, issues);
      if (hasId) registerId(id, `${path}.id`, seenIds, issues);
      const hasFaces = stringTuple2(faceIds, `${path}.faceIds`, issues);
      const hasAbove = validId(aboveFaceId, `${path}.aboveFaceId`, issues);
      const hasBelow = validId(belowFaceId, `${path}.belowFaceId`, issues);
      if (hasFaces) {
        if (faceIds[0] === faceIds[1]) {
          issue(
            issues,
            `${path}.faceIds`,
            'duplicate-face',
            'overlap requires two different faces',
          );
        }
        faceIds.forEach((faceId, faceIndex) => {
          if (!faces.has(faceId))
            issue(
              issues,
              `${path}.faceIds[${faceIndex}]`,
              'missing-reference',
              `unknown face ${faceId}`,
            );
        });
      }
      if (hasAbove && !faces.has(aboveFaceId))
        issue(issues, `${path}.aboveFaceId`, 'missing-reference', `unknown face ${aboveFaceId}`);
      if (hasBelow && !faces.has(belowFaceId))
        issue(issues, `${path}.belowFaceId`, 'missing-reference', `unknown face ${belowFaceId}`);
      if (hasFaces && hasAbove && hasBelow) {
        const pair = new Set(faceIds);
        if (!pair.has(aboveFaceId) || !pair.has(belowFaceId) || aboveFaceId === belowFaceId) {
          issue(
            issues,
            path,
            'invalid-layer-relation',
            'above and below must be the two distinct overlap faces',
          );
        }
      }
    });
  }

  if (issues.length > 0) return { ok: false, error: issues };
  return { ok: true, value: deepFreezeOwned(value) as unknown as ReferenceModelV1 };
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareStringArrays(left: readonly string[], right: readonly string[]): number {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];
    if (leftValue === undefined || rightValue === undefined) break;
    const comparison = compareCodeUnits(leftValue, rightValue);
    if (comparison !== 0) return comparison;
  }
  return left.length - right.length;
}

function canonicalRing(vertices: readonly string[]): string[] {
  const rotations = vertices.map((_, index) => [
    ...vertices.slice(index),
    ...vertices.slice(0, index),
  ]);
  rotations.sort(compareStringArrays);
  const first = rotations[0];
  if (first === undefined) throw new TypeError('face ring cannot be empty');
  return first;
}

function canonicalReferenceModel(model: ReferenceModelV1): JsonValue {
  return {
    schemaVersion: model.schemaVersion,
    schemaId: model.schemaId,
    conventionsId: model.conventionsId,
    canonicalizationVersion: model.canonicalizationVersion,
    id: model.id,
    scope: model.scope,
    scientificClaim: model.scientificClaim,
    paper: { ...model.paper },
    vertices: [...model.vertices]
      .sort((left, right) => compareCodeUnits(left.id, right.id))
      .map((vertex) => ({ ...vertex })),
    edges: [...model.edges]
      .sort((left, right) => compareCodeUnits(left.id, right.id))
      .map((edge) => ({ ...edge, vertices: [...edge.vertices] })),
    faces: [...model.faces]
      .sort((left, right) => compareCodeUnits(left.id, right.id))
      .map((face) => ({ id: face.id, vertices: canonicalRing(face.vertices) })),
    hingeSamples: [...model.hingeSamples]
      .sort((left, right) => compareCodeUnits(left.edgeId, right.edgeId))
      .map((sample) => ({ ...sample })),
    overlapRegions: [...model.overlapRegions]
      .sort((left, right) => compareCodeUnits(left.id, right.id))
      .map((region) => ({
        ...region,
        faceIds: [...region.faceIds].sort(compareCodeUnits),
      })),
  };
}

/** Domain-separated SHA-256 over canonical convention-vector semantics. */
export async function canonicalReferenceModelHash(
  model: ReferenceModelV1,
): Promise<`sha256:${string}`> {
  const payload = `oridesign\0${CANONICALIZATION_VERSION}\0m0f-reference-model\0${stableStringify(canonicalReferenceModel(model))}`;
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(payload),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}
