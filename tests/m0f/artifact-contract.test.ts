import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ARTIFACT_CONTRACT_SCHEMA_ID,
  parseArtifactContractV1,
} from '../../m0f/artifacts/contract.js';

async function vector(name: 'design' | 'fold'): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(resolve(`tests/vectors/m0f-0/artifact-contract-${name}-v1.json`), 'utf8'),
  ) as Record<string, unknown>;
}

function expectIssue(raw: unknown, code: string): void {
  const result = parseArtifactContractV1(raw);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected artifact contract issue ${code}`);
  expect(result.error.some((entry) => entry.code === code)).toBe(true);
}

function boundedSegment(
  t0: number,
  t1: number,
  startAngle: number,
  endAngle: number,
  edgeIds: readonly string[] = ['e-hinge'],
): Record<string, unknown> {
  return {
    t0,
    t1,
    motion: {
      kind: 'bounded-interpolation',
      knotTimes: [t0, t1],
      anglesByCrease: edgeIds.map((edgeId) => ({
        edgeId,
        angles: [startAngle, endAngle],
      })),
      intervalAngleBoundsByCrease: edgeIds.map((edgeId) => ({
        edgeId,
        bounds: [[Math.min(startAngle, endAngle), Math.max(startAngle, endAngle)]],
      })),
    },
  };
}

describe('M0F-0 artifact contract vectors', () => {
  it('accepts separate generation and FOLD workflows without claiming verification', async () => {
    for (const name of ['design', 'fold'] as const) {
      const result = parseArtifactContractV1(await vector(name));
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(`${name} contract must parse`);
      expect(result.value.schemaId).toBe(ARTIFACT_CONTRACT_SCHEMA_ID);
      expect(result.value.contractStatus).toBe('candidate');
      expect(result.value.scientificClaim).toBe(false);
    }
  });

  it('rejects unknown fields and any attempt to attach a verified result', async () => {
    const raw = await vector('fold');
    raw.result = 'verified';
    expectIssue(raw, 'unknown-field');
  });

  it('rejects missing stable-ID references and incompatible input/target kinds', async () => {
    const missing = await vector('fold');
    const target = missing.target as Record<string, unknown>;
    const transforms = target.faceTransforms as Record<string, unknown>[];
    if (transforms[0] === undefined) throw new Error('bad fixture');
    transforms[0].faceId = 'f-missing';
    expectIssue(missing, 'missing-reference');

    const incompatible = await vector('fold');
    const incompatibleTarget = incompatible.target as Record<string, unknown>;
    incompatibleTarget.kind = 'uniaxial-tree-base';
    expectIssue(incompatible, 'workflow-target-mismatch');
  });

  it('rejects path gaps, unknown crease motion, invalid contact regions, and layer cycles', async () => {
    const gap = await vector('fold');
    const path = gap.pathCandidate as Record<string, unknown>;
    const segments = path.segments as Record<string, unknown>[];
    if (segments[0] === undefined) throw new Error('bad fixture');
    segments[0].t0 = 0.1;
    expectIssue(gap, 'incomplete-time-coverage');

    const unknownCrease = await vector('fold');
    const unknownPath = unknownCrease.pathCandidate as Record<string, unknown>;
    const unknownSegments = unknownPath.segments as Record<string, unknown>[];
    const firstSegment = unknownSegments[0];
    if (firstSegment === undefined) throw new Error('bad fixture');
    const motion = firstSegment.motion as Record<string, unknown>;
    const angles = motion.anglesByCrease as Record<string, unknown>[];
    if (angles[0] === undefined) throw new Error('bad fixture');
    angles[0].edgeId = 'e-missing';
    expectIssue(unknownCrease, 'missing-reference');

    const badRegion = await vector('fold');
    const contacts = badRegion.contacts as Record<string, unknown>[];
    if (contacts[0] === undefined) throw new Error('bad fixture');
    contacts[0].overlapRegionId = 'overlap-missing';
    expectIssue(badRegion, 'missing-reference');

    const cycle = await vector('fold');
    const layerEvents = cycle.layerEvents as Record<string, unknown>[];
    layerEvents.push({
      id: 'layer-return',
      interval: [1, 1],
      overlapRegionId: 'overlap-final',
      aboveFaceId: 'f-left',
      belowFaceId: 'f-right',
    });
    expectIssue(cycle, 'layer-cycle');
  });

  it('rejects bounded-interpolation evidence that excludes its own knot angles', async () => {
    const raw = await vector('fold');
    const path = raw.pathCandidate as Record<string, unknown>;
    const segments = path.segments as Record<string, unknown>[];
    const first = segments[0];
    if (first === undefined) throw new Error('bad fixture');
    const motion = first.motion as Record<string, unknown>;
    const bounds = motion.intervalAngleBoundsByCrease as Record<string, unknown>[];
    if (bounds[0] === undefined) throw new Error('bad fixture');
    bounds[0].bounds = [[100, 101]];
    expectIssue(raw, 'angle-outside-bound');
  });

  it('accepts exact bounded-interpolation endpoint agreement across two segments', async () => {
    const raw = await vector('fold');
    const path = raw.pathCandidate as Record<string, unknown>;
    path.segments = [
      boundedSegment(0, 0.5, 0, Math.PI / 2),
      boundedSegment(0.5, 1, Math.PI / 2, Math.PI),
    ];
    expect(parseArtifactContractV1(raw).ok).toBe(true);
  });

  it('rejects an exact bounded-interpolation endpoint discontinuity', async () => {
    const raw = await vector('fold');
    const path = raw.pathCandidate as Record<string, unknown>;
    path.segments = [
      boundedSegment(0, 0.5, 0, Math.PI / 2),
      boundedSegment(0.5, 1, Math.PI / 3, Math.PI),
    ];
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('discontinuous bounded path must fail');
    expect(result.error.map(({ path: issuePath, code }) => ({ path: issuePath, code }))).toEqual([
      {
        path: '$.pathCandidate.segments[1].motion.anglesByCrease',
        code: 'path-endpoint-discontinuity',
      },
    ]);
  });

  it('does not infer endpoint continuity from a structurally invalid motion', async () => {
    const raw = await vector('fold');
    const path = raw.pathCandidate as Record<string, unknown>;
    const second = boundedSegment(0.5, 1, Math.PI / 3, Math.PI);
    (second.motion as Record<string, unknown>).unexpected = true;
    path.segments = [boundedSegment(0, 0.5, 0, Math.PI / 2), second];
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('malformed bounded path must fail');
    expect(result.error.map(({ path: issuePath, code }) => ({ path: issuePath, code }))).toEqual([
      { path: '$.pathCandidate.segments[1].motion.unexpected', code: 'unknown-field' },
    ]);
  });

  it('rejects different valid crease maps at a bounded segment endpoint', async () => {
    const raw = await vector('design');
    const mesh = raw.creaseMesh as Record<string, unknown>;
    const vertices = mesh.vertices as Record<string, unknown>[];
    vertices.push({ id: 'v-tq', x: 0.75, y: 0 }, { id: 'v-bq', x: 0.75, y: 1 });
    const edges = mesh.edges as Record<string, unknown>[];
    const topRight = edges.find((edge) => edge.id === 'e-top-right');
    const bottomRight = edges.find((edge) => edge.id === 'e-bottom-right');
    if (topRight === undefined || bottomRight === undefined) throw new Error('bad fixture');
    topRight.vertices = ['v-tm', 'v-tq'];
    bottomRight.vertices = ['v-bq', 'v-bm'];
    edges.push(
      {
        id: 'e-top-far',
        vertices: ['v-tq', 'v-tr'],
        assignment: 'B',
        role: 'boundary',
        sourceTreeEdgeIds: [],
        generationKey: 'boundary:top-far',
      },
      {
        id: 'e-bottom-far',
        vertices: ['v-br', 'v-bq'],
        assignment: 'B',
        role: 'boundary',
        sourceTreeEdgeIds: [],
        generationKey: 'boundary:bottom-far',
      },
      {
        id: 'e-hinge-far',
        vertices: ['v-tq', 'v-bq'],
        assignment: 'V',
        role: 'hinge',
        sourceTreeEdgeIds: ['t-right'],
        generationKey: 'tree:hinge-far',
      },
    );
    const faces = mesh.faces as Record<string, unknown>[];
    const right = faces.find((face) => face.id === 'f-right');
    if (right === undefined) throw new Error('bad fixture');
    right.vertices = ['v-tm', 'v-bm', 'v-bq', 'v-tq'];
    faces.push({ id: 'f-far', vertices: ['v-tq', 'v-bq', 'v-br', 'v-tr'] });
    const target = raw.target as Record<string, unknown>;
    (target.faceTransforms as Record<string, unknown>[]).push({
      faceId: 'f-far',
      quaternion: [0, 0, 0, 1],
      translation: [0, 0, 0],
    });
    target.goalFaceOrders = [
      ['f-right', 'f-left', 1],
      ['f-far', 'f-right', 1],
    ];
    const path = raw.pathCandidate as Record<string, unknown>;
    path.segments = [
      boundedSegment(0, 0.5, 0, Math.PI / 2, ['e-hinge', 'e-hinge-far']),
      boundedSegment(0.5, 1, Math.PI / 2, Math.PI, ['e-hinge']),
    ];
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('mismatched endpoint maps must fail');
    expect(result.error.map(({ path: issuePath, code }) => ({ path: issuePath, code }))).toEqual([
      {
        path: '$.pathCandidate.segments[1].motion.anglesByCrease',
        code: 'path-endpoint-map-mismatch',
      },
    ]);
  });

  it('does not infer endpoint values from piecewise-polynomial coefficients', async () => {
    const raw = await vector('design');
    const path = raw.pathCandidate as Record<string, unknown>;
    const segments = path.segments as Record<string, unknown>[];
    const first = segments[0];
    if (first === undefined) throw new Error('bad fixture');
    first.t1 = 0.5;
    const second = structuredClone(first);
    second.t0 = 0.5;
    second.t1 = 1;
    const secondMotion = second.motion as Record<string, unknown>;
    const coefficients = secondMotion.coefficientsByCrease as Record<string, unknown>[];
    const hinge = coefficients[0];
    if (hinge === undefined) throw new Error('bad fixture');
    hinge.coefficients = [[100, -50]];
    segments.push(second);
    expect(parseArtifactContractV1(raw).ok).toBe(true);
  });

  it('rejects invalid trees before support checking', async () => {
    const raw = await vector('design');
    const input = raw.input as Record<string, unknown>;
    const tree = input.tree as Record<string, unknown>;
    const edges = tree.edges as Record<string, unknown>[];
    edges.push({
      id: 't-cycle',
      from: 'n-left',
      to: 'n-right',
      length: 1,
      width: 0,
    });
    expectIssue(raw, 'tree-cycle');
  });

  it('rejects non-canonical topology and incomplete target coverage', async () => {
    const winding = await vector('fold');
    const mesh = winding.creaseMesh as Record<string, unknown>;
    const faces = mesh.faces as Record<string, unknown>[];
    if (faces[0] === undefined) throw new Error('bad fixture');
    (faces[0].vertices as unknown[]).reverse();
    expectIssue(winding, 'non-canonical-winding');

    const targetCoverage = await vector('fold');
    const target = targetCoverage.target as Record<string, unknown>;
    (target.faceTransforms as unknown[]).pop();
    expectIssue(targetCoverage, 'incomplete-coverage');
  });

  it('rejects claim escalation, malformed FOLD arrays, and mismatched motion maps', async () => {
    const claimed = await vector('fold');
    claimed.scientificClaim = true;
    expectIssue(claimed, 'claim-boundary');

    const parallel = await vector('fold');
    const input = parallel.input as Record<string, unknown>;
    (input.edgesAssignment as unknown[]).pop();
    expectIssue(parallel, 'parallel-array-mismatch');

    const motionMap = await vector('design');
    const path = motionMap.pathCandidate as Record<string, unknown>;
    const segments = path.segments as Record<string, unknown>[];
    const segment = segments[0];
    if (segment === undefined) throw new Error('bad fixture');
    const motion = segment.motion as Record<string, unknown>;
    motion.derivativeBoundsByCrease = [];
    expectIssue(motionMap, 'motion-map-mismatch');
  });

  it('binds normalized FOLD coordinates and fixed assignments to the stable mesh', async () => {
    const shifted = await vector('fold');
    const shiftedInput = shifted.input as Record<string, unknown>;
    shiftedInput.verticesCoords = (shiftedInput.verticesCoords as [number, number][]).map(
      ([x, y]) => [x + 100, y + 100],
    );
    expectIssue(shifted, 'paper-not-normalized');

    const reassigned = await vector('fold');
    const mesh = reassigned.creaseMesh as Record<string, unknown>;
    const edges = mesh.edges as Record<string, unknown>[];
    const hinge = edges.find((edge) => edge.id === 'e-hinge');
    if (hinge === undefined) throw new Error('bad fixture');
    hinge.assignment = 'M';
    expectIssue(reassigned, 'fold-assignment-mismatch');
  });

  it('accepts the normalized FOLD 1.1 face-reconstruction input boundary', async () => {
    const raw = await vector('fold');
    const input = raw.input as Record<string, unknown>;
    input.specVersion = '1.1';
    input.facesVertices = null;
    expect(parseArtifactContractV1(raw).ok).toBe(true);
  });

  it('rejects duplicate coordinates and zero-length geometry before path checking', async () => {
    const raw = await vector('fold');
    const mesh = raw.creaseMesh as Record<string, unknown>;
    const vertices = mesh.vertices as Record<string, unknown>[];
    const topMiddle = vertices.find((vertex) => vertex.id === 'v-tm');
    if (topMiddle === undefined) throw new Error('bad fixture');
    topMiddle.x = 0;
    topMiddle.y = 0;
    expectIssue(raw, 'duplicate-coordinate');
    expectIssue(raw, 'zero-length-edge');
  });

  it('checks layer DAGs at active times rather than merging disjoint events', async () => {
    const raw = await vector('fold');
    const layerEvents = raw.layerEvents as Record<string, unknown>[];
    layerEvents.push({
      id: 'layer-initial-reverse',
      interval: [0, 0],
      overlapRegionId: 'overlap-final',
      aboveFaceId: 'f-left',
      belowFaceId: 'f-right',
    });
    expect(parseArtifactContractV1(raw).ok).toBe(true);
  });

  it('accepts one declared layer relation covering a continuous coplanar contact', async () => {
    const raw = await vector('fold');
    const contact = (raw.contacts as Record<string, unknown>[])[0];
    const relation = (raw.layerEvents as Record<string, unknown>[])[0];
    if (contact === undefined || relation === undefined) throw new Error('bad fixture');
    contact.interval = [0, 1];
    relation.interval = [0, 1];
    expect(parseArtifactContractV1(raw).ok).toBe(true);
  });

  it('rejects a prefix gap in declared coplanar-contact layer coverage', async () => {
    const raw = await vector('fold');
    const contact = (raw.contacts as Record<string, unknown>[])[0];
    const relation = (raw.layerEvents as Record<string, unknown>[])[0];
    if (contact === undefined || relation === undefined) throw new Error('bad fixture');
    contact.interval = [0, 1];
    relation.interval = [0.25, 1];
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('prefix layer-coverage gap must fail');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents', code: 'incomplete-layer-contact-coverage' },
    ]);
  });

  it('rejects a suffix gap or no matching relation in coplanar-contact coverage', async () => {
    for (const kind of ['suffix', 'none'] as const) {
      const raw = await vector('fold');
      const contact = (raw.contacts as Record<string, unknown>[])[0];
      const layerEvents = raw.layerEvents as Record<string, unknown>[];
      const relation = layerEvents[0];
      if (contact === undefined || relation === undefined) throw new Error('bad fixture');
      contact.interval = [0, 1];
      if (kind === 'suffix') relation.interval = [0, 0.75];
      else layerEvents.splice(0, 1);
      const result = parseArtifactContractV1(raw);
      expect(result.ok, kind).toBe(false);
      if (result.ok) throw new Error('incomplete layer coverage must fail');
      expect(
        result.error.map(({ path, code }) => ({ path, code })),
        kind,
      ).toEqual([{ path: '$.layerEvents', code: 'incomplete-layer-contact-coverage' }]);
    }
  });

  it('treats coverage as direction-independent and excludes non-coplanar contacts', async () => {
    const reversed = await vector('fold');
    const reversedContact = (reversed.contacts as Record<string, unknown>[])[0];
    const reversedRelation = (reversed.layerEvents as Record<string, unknown>[])[0];
    if (reversedContact === undefined || reversedRelation === undefined)
      throw new Error('bad fixture');
    reversedContact.interval = [0, 1];
    reversedRelation.interval = [0, 1];
    reversedRelation.aboveFaceId = 'f-left';
    reversedRelation.belowFaceId = 'f-right';
    expect(parseArtifactContractV1(reversed).ok).toBe(true);

    const nonCoplanar = await vector('fold');
    const nonCoplanarContact = (nonCoplanar.contacts as Record<string, unknown>[])[0];
    if (nonCoplanarContact === undefined) throw new Error('bad fixture');
    nonCoplanarContact.interval = [0, 1];
    nonCoplanarContact.classification = 'point';
    expect(parseArtifactContractV1(nonCoplanar).ok).toBe(true);
  });

  it('accepts touching layer-event intervals as closed contact coverage', async () => {
    const raw = await vector('fold');
    const contact = (raw.contacts as Record<string, unknown>[])[0];
    const layerEvents = raw.layerEvents as Record<string, unknown>[];
    const first = layerEvents[0];
    if (contact === undefined || first === undefined) throw new Error('bad fixture');
    contact.interval = [0, 1];
    first.interval = [0, 0.5];
    layerEvents.push({
      id: 'layer-terminal-half',
      interval: [0.5, 1],
      overlapRegionId: 'overlap-final',
      aboveFaceId: 'f-right',
      belowFaceId: 'f-left',
    });
    expect(parseArtifactContractV1(raw).ok).toBe(true);
  });

  it('rejects a positive internal gap in declared coplanar-contact layer coverage', async () => {
    const raw = await vector('fold');
    const contact = (raw.contacts as Record<string, unknown>[])[0];
    const layerEvents = raw.layerEvents as Record<string, unknown>[];
    const first = layerEvents[0];
    if (contact === undefined || first === undefined) throw new Error('bad fixture');
    contact.interval = [0, 1];
    first.interval = [0, 0.4];
    layerEvents.push({
      id: 'layer-terminal-part',
      interval: [0.6, 1],
      overlapRegionId: 'overlap-final',
      aboveFaceId: 'f-right',
      belowFaceId: 'f-left',
    });
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('internal layer-coverage gap must fail');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents', code: 'incomplete-layer-contact-coverage' },
    ]);
  });

  it('does not add contact-coverage inference to malformed or duplicate participants', async () => {
    for (const kind of ['malformed', 'duplicate'] as const) {
      const raw = await vector('fold');
      const contact = (raw.contacts as Record<string, unknown>[])[0];
      const layerEvents = raw.layerEvents as Record<string, unknown>[];
      const relation = layerEvents[0];
      if (contact === undefined || relation === undefined) throw new Error('bad fixture');
      contact.interval = [0, 1];
      relation.interval = [0.25, 1];
      if (kind === 'malformed') relation.unexpected = true;
      else layerEvents.push(structuredClone(relation));
      const result = parseArtifactContractV1(raw);
      expect(result.ok, kind).toBe(false);
      if (result.ok) throw new Error('invalid coverage participant must fail');
      expect(
        result.error.map(({ path, code }) => ({ path, code })),
        kind,
      ).toEqual([
        kind === 'malformed'
          ? { path: '$.layerEvents[0].unexpected', code: 'unknown-field' }
          : { path: '$.layerEvents[1].id', code: 'duplicate-id' },
      ]);
    }
  });

  it('rejects a declared face-order reversal within one continuous coplanar contact', async () => {
    const raw = await vector('fold');
    const contacts = raw.contacts as Record<string, unknown>[];
    const contact = contacts[0];
    if (contact === undefined) throw new Error('bad fixture');
    contact.interval = [0, 1];
    const layerEvents = raw.layerEvents as Record<string, unknown>[];
    layerEvents.push({
      id: 'layer-initial-reverse',
      interval: [0, 0],
      overlapRegionId: 'overlap-final',
      aboveFaceId: 'f-left',
      belowFaceId: 'f-right',
    });
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('continuous-contact order reversal must fail');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents', code: 'layer-order-reversal' },
    ]);
  });

  it('treats touching valid contact records for one unordered face pair as one contact', async () => {
    const raw = await vector('fold');
    const contacts = raw.contacts as Record<string, unknown>[];
    const first = contacts[0];
    if (first === undefined) throw new Error('bad fixture');
    first.interval = [0, 0.5];
    contacts.push({
      id: 'contact-terminal-half',
      interval: [0.5, 1],
      faceIds: ['f-right', 'f-left'],
      overlapRegionId: 'overlap-final',
      classification: 'coplanar-overlap',
    });
    const layerEvents = raw.layerEvents as Record<string, unknown>[];
    layerEvents.push({
      id: 'layer-initial-reverse',
      interval: [0, 0],
      overlapRegionId: 'overlap-final',
      aboveFaceId: 'f-left',
      belowFaceId: 'f-right',
    });
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('touching contact records must form one contact');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents', code: 'layer-order-reversal' },
    ]);
  });

  it('keeps contact records separated when a positive time gap remains', async () => {
    const raw = await vector('fold');
    const contacts = raw.contacts as Record<string, unknown>[];
    const first = contacts[0];
    if (first === undefined) throw new Error('bad fixture');
    first.interval = [0, 0.4];
    contacts.push({
      id: 'contact-terminal-part',
      interval: [0.6, 1],
      faceIds: ['f-right', 'f-left'],
      overlapRegionId: 'overlap-final',
      classification: 'coplanar-overlap',
    });
    const layerEvents = raw.layerEvents as Record<string, unknown>[];
    const terminal = layerEvents[0];
    if (terminal === undefined) throw new Error('bad fixture');
    terminal.interval = [0.6, 1];
    layerEvents.push({
      id: 'layer-initial-reverse',
      interval: [0, 0.4],
      overlapRegionId: 'overlap-final',
      aboveFaceId: 'f-left',
      belowFaceId: 'f-right',
    });
    expect(parseArtifactContractV1(raw).ok).toBe(true);
  });

  it('transitively joins three touching contact records for one unordered face pair', async () => {
    const raw = await vector('fold');
    const contacts = raw.contacts as Record<string, unknown>[];
    const first = contacts[0];
    if (first === undefined) throw new Error('bad fixture');
    first.interval = [0, 0.3];
    contacts.push(
      {
        id: 'contact-middle-part',
        interval: [0.3, 0.7],
        faceIds: ['f-right', 'f-left'],
        overlapRegionId: 'overlap-final',
        classification: 'coplanar-overlap',
      },
      {
        id: 'contact-terminal-part',
        interval: [0.7, 1],
        faceIds: ['f-left', 'f-right'],
        overlapRegionId: 'overlap-final',
        classification: 'coplanar-overlap',
      },
    );
    const layerEvents = raw.layerEvents as Record<string, unknown>[];
    layerEvents.push({
      id: 'layer-initial-reverse',
      interval: [0, 0],
      overlapRegionId: 'overlap-final',
      aboveFaceId: 'f-left',
      belowFaceId: 'f-right',
    });
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('transitive contact chain must form one contact');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents', code: 'layer-order-reversal' },
    ]);
  });

  it('does not join touching contact intervals from different overlap regions', async () => {
    const raw = await vector('fold');
    const overlapRegions = raw.overlapRegions as Record<string, unknown>[];
    overlapRegions.push({
      id: 'overlap-initial',
      faceIds: ['f-left', 'f-right'],
    });
    const contacts = raw.contacts as Record<string, unknown>[];
    const terminal = contacts[0];
    if (terminal === undefined) throw new Error('bad fixture');
    terminal.interval = [0.5, 1];
    contacts.push({
      id: 'contact-initial-half',
      interval: [0, 0.5],
      faceIds: ['f-right', 'f-left'],
      overlapRegionId: 'overlap-initial',
      classification: 'coplanar-overlap',
    });
    const layerEvents = raw.layerEvents as Record<string, unknown>[];
    const terminalLayer = layerEvents[0];
    if (terminalLayer === undefined) throw new Error('bad fixture');
    terminalLayer.interval = [0.5, 1];
    layerEvents.push({
      id: 'layer-initial-reverse',
      interval: [0, 0.5],
      overlapRegionId: 'overlap-initial',
      aboveFaceId: 'f-right',
      belowFaceId: 'f-left',
    });
    expect(parseArtifactContractV1(raw).ok).toBe(true);
  });

  it('orders an unrelated structural event issue before a valid reversal issue', async () => {
    const raw = await vector('fold');
    const contacts = raw.contacts as Record<string, unknown>[];
    const contact = contacts[0];
    if (contact === undefined) throw new Error('bad fixture');
    contact.interval = [0, 1];
    const layerEvents = raw.layerEvents as Record<string, unknown>[];
    layerEvents.push(
      {
        id: 'layer-initial-reverse',
        interval: [0, 0],
        overlapRegionId: 'overlap-final',
        aboveFaceId: 'f-left',
        belowFaceId: 'f-right',
      },
      {
        id: 'layer-unrelated-malformed',
        interval: [0.5, 0.5],
        overlapRegionId: 'overlap-final',
        aboveFaceId: 'f-right',
        belowFaceId: 'f-left',
        unexpected: true,
      },
    );
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('malformed event plus reversal must fail');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents[2].unexpected', code: 'unknown-field' },
      { path: '$.layerEvents', code: 'layer-order-reversal' },
    ]);
  });

  it('reports only the existing layer-cycle issue for simultaneous opposite relations', async () => {
    const raw = await vector('fold');
    const layerEvents = raw.layerEvents as Record<string, unknown>[];
    layerEvents.push({
      id: 'layer-terminal-reverse',
      interval: [1, 1],
      overlapRegionId: 'overlap-final',
      aboveFaceId: 'f-left',
      belowFaceId: 'f-right',
    });
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('simultaneous opposite relations must fail');
    expect(result.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents', code: 'layer-cycle' },
    ]);
  });

  it('does not emit reversal as a secondary issue for malformed participating entries', async () => {
    for (const [kind, expectedPath] of [
      ['overlap', '$.overlapRegions[0].unexpected'],
      ['contact', '$.contacts[0].unexpected'],
      ['layer', '$.layerEvents[1].unexpected'],
    ] as const) {
      const raw = await vector('fold');
      const contacts = raw.contacts as Record<string, unknown>[];
      const contact = contacts[0];
      if (contact === undefined) throw new Error('bad fixture');
      contact.interval = [0, 1];
      const layerEvents = raw.layerEvents as Record<string, unknown>[];
      layerEvents.push({
        id: 'layer-initial-reverse',
        interval: [0, 0],
        overlapRegionId: 'overlap-final',
        aboveFaceId: 'f-left',
        belowFaceId: 'f-right',
      });
      if (kind === 'overlap') {
        const overlapRegions = raw.overlapRegions as Record<string, unknown>[];
        const overlap = overlapRegions[0];
        if (overlap === undefined) throw new Error('bad fixture');
        overlap.unexpected = true;
      } else if (kind === 'contact') {
        contact.unexpected = true;
      } else {
        const reverse = layerEvents[1];
        if (reverse === undefined) throw new Error('bad fixture');
        reverse.unexpected = true;
      }
      const result = parseArtifactContractV1(raw);
      expect(result.ok, kind).toBe(false);
      if (result.ok) throw new Error('malformed reversal participant must fail');
      expect(
        result.error.map(({ path, code }) => ({ path, code })),
        kind,
      ).toEqual([{ path: expectedPath, code: 'unknown-field' }]);
    }
  });

  it('does not infer reversal through a participant ID made ambiguous by a later duplicate', async () => {
    for (const [kind, expectedPath] of [
      ['overlap', '$.overlapRegions[1].id'],
      ['contact', '$.contacts[1].id'],
      ['layer', '$.layerEvents[2].id'],
    ] as const) {
      const raw = await vector('fold');
      const contacts = raw.contacts as Record<string, unknown>[];
      const contact = contacts[0];
      if (contact === undefined) throw new Error('bad fixture');
      contact.interval = [0, 1];
      const layerEvents = raw.layerEvents as Record<string, unknown>[];
      layerEvents.push({
        id: 'layer-initial-reverse',
        interval: [0, 0],
        overlapRegionId: 'overlap-final',
        aboveFaceId: 'f-left',
        belowFaceId: 'f-right',
      });
      if (kind === 'overlap') {
        const overlapRegions = raw.overlapRegions as Record<string, unknown>[];
        const overlap = overlapRegions[0];
        if (overlap === undefined) throw new Error('bad fixture');
        overlapRegions.push(structuredClone(overlap));
      } else if (kind === 'contact') {
        contacts.push(structuredClone(contact));
      } else {
        const forward = layerEvents[0];
        if (forward === undefined) throw new Error('bad fixture');
        layerEvents.push(structuredClone(forward));
      }
      const result = parseArtifactContractV1(raw);
      expect(result.ok, kind).toBe(false);
      if (result.ok) throw new Error('duplicate participant ID must fail');
      expect(
        result.error.map(({ path, code }) => ({ path, code })),
        kind,
      ).toEqual([{ path: expectedPath, code: 'duplicate-id' }]);
    }
  });

  it('does not infer order reversal from a non-coplanar or structurally invalid relation', async () => {
    const pointContact = await vector('fold');
    const pointContacts = pointContact.contacts as Record<string, unknown>[];
    const point = pointContacts[0];
    if (point === undefined) throw new Error('bad fixture');
    point.interval = [0, 1];
    point.classification = 'point';
    const pointLayerEvents = pointContact.layerEvents as Record<string, unknown>[];
    pointLayerEvents.push({
      id: 'layer-initial-reverse',
      interval: [0, 0],
      overlapRegionId: 'overlap-final',
      aboveFaceId: 'f-left',
      belowFaceId: 'f-right',
    });
    expect(parseArtifactContractV1(pointContact).ok).toBe(true);

    const invalidRelation = await vector('fold');
    const invalidContacts = invalidRelation.contacts as Record<string, unknown>[];
    const continuous = invalidContacts[0];
    if (continuous === undefined) throw new Error('bad fixture');
    continuous.interval = [0, 1];
    const invalidLayerEvents = invalidRelation.layerEvents as Record<string, unknown>[];
    invalidLayerEvents.push({
      id: 'layer-initial-reverse',
      interval: [0, 0],
      overlapRegionId: 'overlap-missing',
      aboveFaceId: 'f-left',
      belowFaceId: 'f-right',
    });
    const invalid = parseArtifactContractV1(invalidRelation);
    expect(invalid.ok).toBe(false);
    if (invalid.ok) throw new Error('missing overlap region must fail');
    expect(invalid.error.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: '$.layerEvents[1].overlapRegionId', code: 'missing-reference' },
    ]);
  });

  it('rejects a cycle in a three-face terminal goal order', async () => {
    const raw = await vector('design');
    const mesh = raw.creaseMesh as Record<string, unknown>;
    const vertices = mesh.vertices as Record<string, unknown>[];
    vertices.push({ id: 'v-tq', x: 0.75, y: 0 }, { id: 'v-bq', x: 0.75, y: 1 });
    const edges = mesh.edges as Record<string, unknown>[];
    const topRight = edges.find((edge) => edge.id === 'e-top-right');
    const bottomRight = edges.find((edge) => edge.id === 'e-bottom-right');
    if (topRight === undefined || bottomRight === undefined) throw new Error('bad fixture');
    topRight.vertices = ['v-tm', 'v-tq'];
    bottomRight.vertices = ['v-bq', 'v-bm'];
    edges.push(
      {
        id: 'e-top-far',
        vertices: ['v-tq', 'v-tr'],
        assignment: 'B',
        role: 'boundary',
        sourceTreeEdgeIds: [],
        generationKey: 'boundary:top-far',
      },
      {
        id: 'e-bottom-far',
        vertices: ['v-br', 'v-bq'],
        assignment: 'B',
        role: 'boundary',
        sourceTreeEdgeIds: [],
        generationKey: 'boundary:bottom-far',
      },
      {
        id: 'e-hinge-far',
        vertices: ['v-tq', 'v-bq'],
        assignment: 'V',
        role: 'hinge',
        sourceTreeEdgeIds: ['t-right'],
        generationKey: 'tree:hinge-far',
      },
    );
    const faces = mesh.faces as Record<string, unknown>[];
    const right = faces.find((face) => face.id === 'f-right');
    if (right === undefined) throw new Error('bad fixture');
    right.vertices = ['v-tm', 'v-bm', 'v-bq', 'v-tq'];
    faces.push({ id: 'f-far', vertices: ['v-tq', 'v-bq', 'v-br', 'v-tr'] });

    const target = raw.target as Record<string, unknown>;
    (target.faceTransforms as Record<string, unknown>[]).push({
      faceId: 'f-far',
      quaternion: [0, 0, 0, 1],
      translation: [0, 0, 0],
    });
    target.goalFaceOrders = [
      ['f-right', 'f-left', 1],
      ['f-far', 'f-right', 1],
    ];

    const path = raw.pathCandidate as Record<string, unknown>;
    const segments = path.segments as Record<string, unknown>[];
    const first = segments[0];
    if (first === undefined) throw new Error('bad fixture');
    const motion = first.motion as Record<string, unknown>;
    (motion.coefficientsByCrease as Record<string, unknown>[]).push({
      edgeId: 'e-hinge-far',
      coefficients: [[0, 3.141592653589793]],
    });
    (motion.derivativeBoundsByCrease as Record<string, unknown>[]).push({
      edgeId: 'e-hinge-far',
      bounds: [0, 3.141592653589793],
    });

    expect(parseArtifactContractV1(raw).ok).toBe(true);
    (target.goalFaceOrders as unknown[]).push(['f-left', 'f-far', 1]);
    expectIssue(raw, 'goal-layer-cycle');
  });

  it('accepts a square-cell box-pleating contract and rejects an incompatible grid ratio', async () => {
    const box = await vector('design');
    const input = box.input as Record<string, unknown>;
    input.method = 'boxPleating';
    input.grid = { columns: 4, rows: 4 };
    const tree = input.tree as Record<string, unknown>;
    const treeEdges = tree.edges as Record<string, unknown>[];
    if (treeEdges[0] === undefined) throw new Error('bad fixture');
    treeEdges[0].width = 0.25;
    const target = box.target as Record<string, unknown>;
    const measurements = target.branchMeasurements as Record<string, unknown>[];
    if (measurements[0] === undefined) throw new Error('bad fixture');
    measurements[0].effectiveWidth = 0.25;
    expect(parseArtifactContractV1(box).ok).toBe(true);

    input.grid = { columns: 4, rows: 3 };
    expectIssue(box, 'non-square-grid-cell');

    input.grid = { columns: 4, rows: 4 };
    measurements[0].effectiveWidth = 0;
    expectIssue(box, 'branch-measurement-mismatch');
  });

  it('returns an owned frozen value whose claim boundary cannot be mutated through the input', async () => {
    const raw = await vector('fold');
    const result = parseArtifactContractV1(raw);
    if (!result.ok) throw new Error('fixture must parse');
    raw.scientificClaim = true;
    expect(result.value.scientificClaim).toBe(false);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.target)).toBe(true);
  });

  it('validates one getter-consistent plain-data snapshot', async () => {
    const raw = await vector('fold');
    let reads = 0;
    Object.defineProperty(raw, 'scientificClaim', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? false : true;
      },
    });
    const result = parseArtifactContractV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('snapshot must parse');
    expect(result.value.scientificClaim).toBe(false);
    expect(reads).toBe(1);

    const disguisedMap = Object.assign(new Map<string, unknown>(), await vector('fold'));
    expect(parseArtifactContractV1(disguisedMap).ok).toBe(false);
  });
});
