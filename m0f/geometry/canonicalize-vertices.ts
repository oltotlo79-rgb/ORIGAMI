import { exactSquaredDistanceCompare } from '../model/exact-dyadic.js';

export type IdentifiedPoint2 = Readonly<{ id: string; x: number; y: number }>;
export type VertexMergePolicy = Readonly<{ coordMergeAbs: number }>;

type BasicCanonicalizationIssue = Readonly<{
  path: string;
  code: 'invalid-id' | 'duplicate-id' | 'non-finite-coordinate' | 'invalid-merge-policy';
  message: string;
}>;
type ChainAmbiguityIssue = Readonly<{
  path: '$.points';
  code: 'merge-chain-ambiguous';
  message: string;
  pointIds: readonly string[];
}>;
export type VertexCanonicalizationIssue = BasicCanonicalizationIssue | ChainAmbiguityIssue;

export type CanonicalVertexSet = Readonly<{
  vertices: readonly IdentifiedPoint2[];
  components: readonly Readonly<{
    representativeId: string;
    memberIds: readonly string[];
  }>[];
  representativeById: Readonly<Record<string, string>>;
}>;
export type VertexCanonicalizationResult =
  | Readonly<{ ok: true; value: CanonicalVertexSet }>
  | Readonly<{ ok: false; error: readonly VertexCanonicalizationIssue[] }>;

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function comparePoints(left: IdentifiedPoint2, right: IdentifiedPoint2): number {
  const leftX = left.x === 0 ? 0 : left.x;
  const rightX = right.x === 0 ? 0 : right.x;
  if (leftX !== rightX) return leftX < rightX ? -1 : 1;
  const leftY = left.y === 0 ? 0 : left.y;
  const rightY = right.y === 0 ? 0 : right.y;
  if (leftY !== rightY) return leftY < rightY ? -1 : 1;
  return compareCodeUnits(left.id, right.id);
}

function validateInput(
  points: readonly IdentifiedPoint2[],
  policy: VertexMergePolicy,
): VertexCanonicalizationIssue[] {
  const issues: VertexCanonicalizationIssue[] = [];
  if (!Number.isFinite(policy.coordMergeAbs) || policy.coordMergeAbs < 0) {
    issues.push({
      path: '$.policy.coordMergeAbs',
      code: 'invalid-merge-policy',
      message: 'must be a finite non-negative L2 threshold',
    });
  }
  const ids = new Set<string>();
  points.forEach((point, index) => {
    const path = `$.points[${index}]`;
    if (!ID_PATTERN.test(point.id)) {
      issues.push({
        path: `${path}.id`,
        code: 'invalid-id',
        message: 'must be a stable ID of 1..128 ASCII characters',
      });
    } else if (ids.has(point.id)) {
      issues.push({
        path: `${path}.id`,
        code: 'duplicate-id',
        message: `stable ID ${point.id} is duplicated`,
      });
    }
    ids.add(point.id);
    if (!Number.isFinite(point.x)) {
      issues.push({
        path: `${path}.x`,
        code: 'non-finite-coordinate',
        message: 'coordinate must be a finite binary64 number',
      });
    }
    if (!Number.isFinite(point.y)) {
      issues.push({
        path: `${path}.y`,
        code: 'non-finite-coordinate',
        message: 'coordinate must be a finite binary64 number',
      });
    }
  });
  return issues;
}

/**
 * O(n²) M0F reference canonicalizer. It merges closed L2 balls using an exact
 * binary64 comparison and rejects connected components whose diameter exceeds
 * the threshold, preventing order-dependent chain merges.
 */
export function canonicalizeVertices(
  points: readonly IdentifiedPoint2[],
  policy: VertexMergePolicy,
): VertexCanonicalizationResult {
  const issues = validateInput(points, policy);
  if (issues.length > 0) return { ok: false, error: issues };

  const parents = points.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parents[root] !== root) {
      const parent = parents[root];
      if (parent === undefined) throw new TypeError('union-find parent is missing');
      root = parent;
    }
    let current = index;
    while (current !== root) {
      const parent = parents[current];
      if (parent === undefined) throw new TypeError('union-find parent is missing');
      parents[current] = root;
      current = parent;
    }
    return root;
  };
  const union = (left: number, right: number): void => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot === rightRoot) return;
    const parent = Math.min(leftRoot, rightRoot);
    const child = Math.max(leftRoot, rightRoot);
    parents[child] = parent;
  };

  for (let leftIndex = 0; leftIndex < points.length; leftIndex += 1) {
    const left = points[leftIndex];
    if (left === undefined) throw new TypeError('point is missing');
    for (let rightIndex = leftIndex + 1; rightIndex < points.length; rightIndex += 1) {
      const right = points[rightIndex];
      if (right === undefined) throw new TypeError('point is missing');
      if (exactSquaredDistanceCompare(left, right, policy.coordMergeAbs) <= 0) {
        union(leftIndex, rightIndex);
      }
    }
  }

  const membersByRoot = new Map<number, IdentifiedPoint2[]>();
  points.forEach((point, index) => {
    const root = find(index);
    const members = membersByRoot.get(root) ?? [];
    members.push(point);
    membersByRoot.set(root, members);
  });

  for (const members of membersByRoot.values()) {
    for (let leftIndex = 0; leftIndex < members.length; leftIndex += 1) {
      const left = members[leftIndex];
      if (left === undefined) throw new TypeError('component point is missing');
      for (let rightIndex = leftIndex + 1; rightIndex < members.length; rightIndex += 1) {
        const right = members[rightIndex];
        if (right === undefined) throw new TypeError('component point is missing');
        if (exactSquaredDistanceCompare(left, right, policy.coordMergeAbs) > 0) {
          const pointIds = members.map((point) => point.id).sort(compareCodeUnits);
          return {
            ok: false,
            error: [
              {
                path: '$.points',
                code: 'merge-chain-ambiguous',
                message: 'proximity component diameter exceeds coordMergeAbs',
                pointIds,
              },
            ],
          };
        }
      }
    }
  }

  const representativeById: Record<string, string> = {};
  const components = [...membersByRoot.values()].map((members) => {
    const representative = [...members].sort(comparePoints)[0];
    if (representative === undefined) throw new TypeError('component cannot be empty');
    const memberIds = members.map((point) => point.id).sort(compareCodeUnits);
    for (const memberId of memberIds) representativeById[memberId] = representative.id;
    return { representative, memberIds };
  });
  components.sort((left, right) =>
    compareCodeUnits(left.representative.id, right.representative.id),
  );

  return {
    ok: true,
    value: {
      vertices: components
        .map(({ representative }) => ({
          id: representative.id,
          x: representative.x === 0 ? 0 : representative.x,
          y: representative.y === 0 ? 0 : representative.y,
        }))
        .sort((left, right) => compareCodeUnits(left.id, right.id)),
      components: components.map(({ representative, memberIds }) => ({
        representativeId: representative.id,
        memberIds,
      })),
      representativeById,
    },
  };
}
