import { describe, expect, it } from 'vitest';

import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
} from '../../m0f/geometry/reconstruct-fold-faces.js';
import { parseFaceComplexAuditInputV1 } from '../../m0f/reference-verifier/face-complex-contract.js';
import {
  FACE_COMPLEX_MUTATION_CASE_IDS,
  FACE_COMPLEX_MUTATION_SUITE_V1,
  generateFaceComplexMutationCandidateV1,
  parseFaceComplexMutationSuiteV1,
  parseFaceComplexMutationSuiteResultV1,
  runFaceComplexMutationSuiteV1,
  type FaceComplexMutationCaseIdV1,
} from '../../m0f/reference-verifier/face-complex-mutation-suite.js';

type JsonRecord = Record<string, unknown>;

function concaveInput(): JsonRecord {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [3, 0],
      [3, 1],
      [1, 1],
      [1, 3],
      [0, 3],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B'],
    facesVertices: null,
  };
}

function triangleInput(): JsonRecord {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [2, 0],
      [0, 2],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
    edgesAssignment: ['B', 'B', 'B'],
    facesVertices: null,
  };
}

function requireReconstruction(input: unknown): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(input);
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

function bundleFrom(input: JsonRecord): JsonRecord {
  const result = requireReconstruction(input);
  return structuredClone({
    schemaVersion: 1,
    recordType: 'm0f-face-complex-audit-input',
    contractStatus: 'candidate',
    scientificClaim: false,
    source: input,
    artifact: {
      inputSpecVersion: result.inputSpecVersion,
      exactCoordinateEncoding: result.exactCoordinateEncoding,
      vertices: result.vertices,
      edges: result.edges,
      exteriorBoundary: result.exteriorBoundary,
      faces: result.faces,
      topology: result.topology,
    },
  });
}

function suiteWith(...ids: readonly FaceComplexMutationCaseIdV1[]): JsonRecord {
  return structuredClone({
    schemaVersion: 1,
    recordType: 'm0f-face-complex-mutation-suite',
    contractStatus: 'candidate',
    scientificClaim: false,
    scope: 'face-complex-only',
    verificationIndependence: 'semantic-mutation-regression-not-full-reference-verifier',
    cases: ids.map((id) => ({
      id,
      expectedOutcome: id === 'display-coordinate-only' ? 'accepted' : 'rejected',
    })),
  });
}

function record(value: unknown): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('test fixture entry must be a record');
  }
  return value as JsonRecord;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new TypeError('test fixture entry must be an array');
  return value;
}

describe('candidate face-complex semantic mutation suite v1', () => {
  it('defines and parses one closed candidate/no-claim suite', () => {
    const parsed = parseFaceComplexMutationSuiteV1(FACE_COMPLEX_MUTATION_SUITE_V1);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('canonical mutation suite must parse');

    expect(parsed.value).toEqual(FACE_COMPLEX_MUTATION_SUITE_V1);
    expect(parsed.value.cases.map((entry) => entry.id)).toEqual(FACE_COMPLEX_MUTATION_CASE_IDS);
    expect(parsed.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'face-complex-only',
      verificationIndependence: 'semantic-mutation-regression-not-full-reference-verifier',
    });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.cases)).toBe(true);
    for (const entry of parsed.value.cases) expect(Object.isFrozen(entry)).toBe(true);
  });

  it('rejects unknown fields, duplicate IDs, expectation rewrites, and accessors', () => {
    const unknown = suiteWith('edge-provenance');
    unknown.verified = true;
    const unknownResult = parseFaceComplexMutationSuiteV1(unknown);
    expect(unknownResult.ok).toBe(false);
    if (unknownResult.ok) throw new Error('unknown field must be rejected');
    expect(unknownResult.error.map((entry) => entry.code)).toContain('unknown-field');

    const duplicate = suiteWith('edge-provenance', 'edge-provenance');
    const duplicateResult = parseFaceComplexMutationSuiteV1(duplicate);
    expect(duplicateResult.ok).toBe(false);
    if (duplicateResult.ok) throw new Error('duplicate case ID must be rejected');
    expect(duplicateResult.error.map((entry) => entry.code)).toContain('duplicate-case-id');

    const rewritten = suiteWith('display-coordinate-only');
    record(array(rewritten.cases)[0]).expectedOutcome = 'rejected';
    const rewrittenResult = parseFaceComplexMutationSuiteV1(rewritten);
    expect(rewrittenResult.ok).toBe(false);
    if (rewrittenResult.ok) throw new Error('rewritten expectation must be rejected');
    expect(rewrittenResult.error.map((entry) => entry.code)).toContain('expectation-mismatch');

    let getterCalls = 0;
    const accessor = suiteWith('edge-assignment');
    Object.defineProperty(accessor, 'scientificClaim', {
      enumerable: true,
      get(): false {
        getterCalls += 1;
        return false;
      },
    });
    expect(parseFaceComplexMutationSuiteV1(accessor)).toMatchObject({
      ok: false,
      error: [{ code: 'invalid-snapshot' }],
    });
    expect(getterCalls).toBe(0);

    const originalKeys = Object.keys;
    Object.keys = () => {
      throw new Error('injected host failure');
    };
    try {
      expect(parseFaceComplexMutationSuiteV1(suiteWith('edge-provenance'))).toEqual({
        ok: false,
        error: [
          {
            path: '$',
            code: 'invalid-snapshot',
            message: 'suite validation failed closed on an unexpected host condition',
          },
        ],
      });
    } finally {
      Object.keys = originalKeys;
    }
  });

  it('generates every mutation deterministically without changing the base bundle', () => {
    const base = bundleFrom(concaveInput());
    const before = structuredClone(base);

    for (const id of FACE_COMPLEX_MUTATION_CASE_IDS) {
      const first = generateFaceComplexMutationCandidateV1(base, id);
      const second = generateFaceComplexMutationCandidateV1(base, id);
      expect(first.ok, id).toBe(true);
      expect(second.ok, id).toBe(true);
      if (!first.ok || !second.ok) throw new Error(`${id} must generate`);
      expect(first.value, id).toEqual(second.value);
      expect(parseFaceComplexAuditInputV1(first.value).ok, id).toBe(true);
      expect(Object.isFrozen(first.value), id).toBe(true);
    }
    expect(base).toEqual(before);
  });

  it('rejects all semantic mutations and explicitly accepts display-only changes', () => {
    const result = runFaceComplexMutationSuiteV1(bundleFrom(concaveInput()));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));

    expect(result.value).toMatchObject({
      schemaVersion: 1,
      recordType: 'm0f-face-complex-mutation-suite-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'face-complex-only',
      verificationIndependence: 'semantic-mutation-regression-not-full-reference-verifier',
      suiteOutcome: 'expectations-met',
    });
    expect(result.value.cases).toHaveLength(FACE_COMPLEX_MUTATION_CASE_IDS.length);
    expect(result.value.cases).toEqual([
      {
        id: 'artifact-exact-coordinate',
        expectedOutcome: 'rejected',
        observedOutcome: 'rejected',
        observedIssueCode: 'artifact-coordinate-surplus',
        expectationMet: true,
      },
      {
        id: 'edge-provenance',
        expectedOutcome: 'rejected',
        observedOutcome: 'rejected',
        observedIssueCode: 'artifact-edge-provenance-invalid',
        expectationMet: true,
      },
      {
        id: 'edge-assignment',
        expectedOutcome: 'rejected',
        observedOutcome: 'rejected',
        observedIssueCode: 'artifact-edge-assignment-invalid',
        expectationMet: true,
      },
      {
        id: 'face-cycle',
        expectedOutcome: 'rejected',
        observedOutcome: 'rejected',
        observedIssueCode: 'boundary-edge-alignment-invalid',
        expectationMet: true,
      },
      {
        id: 'triangle-incidence',
        expectedOutcome: 'rejected',
        observedOutcome: 'rejected',
        observedIssueCode: 'triangle-edge-incidence-invalid',
        expectationMet: true,
      },
      {
        id: 'triangle-area',
        expectedOutcome: 'rejected',
        observedOutcome: 'rejected',
        observedIssueCode: 'triangle-area-invalid',
        expectationMet: true,
      },
      {
        id: 'topology-counter',
        expectedOutcome: 'rejected',
        observedOutcome: 'rejected',
        observedIssueCode: 'topology-counter-invalid',
        expectationMet: true,
      },
      {
        id: 'semantic-duplicate',
        expectedOutcome: 'rejected',
        observedOutcome: 'rejected',
        observedIssueCode: 'triangle-semantic-ids-invalid',
        expectationMet: true,
      },
      {
        id: 'disconnected-component',
        expectedOutcome: 'rejected',
        observedOutcome: 'rejected',
        observedIssueCode: 'artifact-graph-disconnected',
        expectationMet: true,
      },
      {
        id: 'bridge-edge',
        expectedOutcome: 'rejected',
        observedOutcome: 'rejected',
        observedIssueCode: 'dart-traversal-invalid',
        expectationMet: true,
      },
      {
        id: 'display-coordinate-only',
        expectedOutcome: 'accepted',
        observedOutcome: 'accepted',
        observedIssueCode: null,
        expectationMet: true,
      },
    ]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.cases)).toBe(true);
  });

  it('strictly parses only a complete canonical persisted result', () => {
    const run = runFaceComplexMutationSuiteV1(bundleFrom(concaveInput()));
    expect(run.ok).toBe(true);
    if (!run.ok) throw new Error('canonical suite must run');
    const caller = structuredClone(run.value);
    const parsed = parseFaceComplexMutationSuiteResultV1(caller);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('canonical result must parse');
    expect(parsed.value).toEqual(run.value);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.cases)).toBe(true);

    record(array(caller.cases)[0]).observedIssueCode = 'caller-mutation';
    expect(parsed.value.cases[0]?.observedIssueCode).toBe('artifact-coordinate-surplus');
  });

  it('rejects unknown, incomplete, reordered, duplicated, or forged persisted results', () => {
    const run = runFaceComplexMutationSuiteV1(bundleFrom(concaveInput()));
    if (!run.ok) throw new Error('canonical suite must run');
    const valid = record(structuredClone(run.value));

    const cases: readonly Readonly<{
      expectedCode:
        | 'unknown-field'
        | 'missing-field'
        | 'invalid-array'
        | 'duplicate-case-id'
        | 'case-order-mismatch'
        | 'expectation-mismatch'
        | 'observed-outcome-mismatch'
        | 'issue-code-mismatch';
      mutate: (value: JsonRecord) => void;
    }>[] = [
      {
        expectedCode: 'unknown-field',
        mutate: (value) => {
          value.verified = true;
        },
      },
      {
        expectedCode: 'unknown-field',
        mutate: (value) => {
          record(array(value.cases)[0]).extra = true;
        },
      },
      {
        expectedCode: 'missing-field',
        mutate: (value) => {
          delete record(array(value.cases)[0]).observedOutcome;
        },
      },
      {
        expectedCode: 'invalid-array',
        mutate: (value) => {
          array(value.cases).pop();
        },
      },
      {
        expectedCode: 'duplicate-case-id',
        mutate: (value) => {
          record(array(value.cases)[1]).id = record(array(value.cases)[0]).id;
        },
      },
      {
        expectedCode: 'case-order-mismatch',
        mutate: (value) => {
          const entries = array(value.cases);
          [entries[0], entries[1]] = [entries[1], entries[0]];
        },
      },
      {
        expectedCode: 'expectation-mismatch',
        mutate: (value) => {
          record(array(value.cases)[0]).expectedOutcome = 'accepted';
        },
      },
      {
        expectedCode: 'observed-outcome-mismatch',
        mutate: (value) => {
          record(array(value.cases)[0]).observedOutcome = 'accepted';
        },
      },
      {
        expectedCode: 'issue-code-mismatch',
        mutate: (value) => {
          record(array(value.cases)[0]).observedIssueCode = 'unexpected-audit-failure';
        },
      },
      {
        expectedCode: 'expectation-mismatch',
        mutate: (value) => {
          record(array(value.cases)[0]).expectationMet = false;
        },
      },
    ];

    for (const entry of cases) {
      const forged = structuredClone(valid);
      entry.mutate(forged);
      const parsed = parseFaceComplexMutationSuiteResultV1(forged);
      expect(parsed.ok, entry.expectedCode).toBe(false);
      if (parsed.ok) throw new Error(`${entry.expectedCode} mutation must be rejected`);
      expect(
        parsed.error.map((issue) => issue.code),
        entry.expectedCode,
      ).toContain(entry.expectedCode);
    }

    let getterCalls = 0;
    const accessor = structuredClone(valid);
    Object.defineProperty(array(accessor.cases)[0], 'observedOutcome', {
      enumerable: true,
      get(): string {
        getterCalls += 1;
        return 'rejected';
      },
    });
    expect(parseFaceComplexMutationSuiteResultV1(accessor)).toMatchObject({
      ok: false,
      error: [{ code: 'invalid-snapshot' }],
    });
    expect(getterCalls).toBe(0);

    const revoked = Proxy.revocable(valid, {});
    revoked.revoke();
    expect(parseFaceComplexMutationSuiteResultV1(revoked.proxy)).toMatchObject({
      ok: false,
      error: [{ code: 'invalid-snapshot' }],
    });
  });

  it('supports deterministic strict subsets and reports unmet generation preconditions', () => {
    const parsedSubset = parseFaceComplexMutationSuiteV1(
      suiteWith('edge-provenance', 'display-coordinate-only'),
    );
    expect(parsedSubset.ok).toBe(true);
    if (!parsedSubset.ok) throw new Error('valid subset must parse');
    const result = runFaceComplexMutationSuiteV1(bundleFrom(concaveInput()), parsedSubset.value);
    expect(result).toMatchObject({
      ok: true,
      value: {
        cases: [
          { id: 'edge-provenance', observedOutcome: 'rejected' },
          { id: 'display-coordinate-only', observedOutcome: 'accepted' },
        ],
      },
    });
    if (!result.ok) throw new Error('valid subset must run');
    const parsedSubsetResult = parseFaceComplexMutationSuiteResultV1(result.value);
    expect(parsedSubsetResult.ok).toBe(false);
    if (parsedSubsetResult.ok) throw new Error('subset result is not complete persisted evidence');
    expect(parsedSubsetResult.error.map((entry) => entry.code)).toContain('invalid-array');

    const unsupported = runFaceComplexMutationSuiteV1(
      bundleFrom(triangleInput()),
      suiteWith('triangle-incidence'),
    );
    expect(unsupported).toEqual({
      ok: false,
      error: [
        {
          stage: 'mutation-generation',
          caseId: 'triangle-incidence',
          path: '$',
          code: 'mutation-precondition-failed',
          message: 'base bundle does not satisfy this deterministic mutation case precondition',
        },
      ],
    });
  });

  it('does not allow an inconsistent or malformed base to masquerade as mutation evidence', () => {
    const inconsistent = bundleFrom(concaveInput());
    record(record(inconsistent.artifact).topology).triangleCount = 999;
    expect(
      runFaceComplexMutationSuiteV1(inconsistent, suiteWith('topology-counter')),
    ).toMatchObject({
      ok: false,
      error: [{ stage: 'base-audit', code: 'topology-counter-invalid' }],
    });

    expect(generateFaceComplexMutationCandidateV1({}, 'edge-assignment')).toMatchObject({
      ok: false,
      error: [{ stage: 'base-contract', code: 'base-bundle-contract-rejected' }],
    });
    expect(generateFaceComplexMutationCandidateV1(bundleFrom(concaveInput()), 'unknown')).toEqual({
      ok: false,
      error: [
        {
          stage: 'mutation-generation',
          caseId: null,
          path: '$.caseId',
          code: 'invalid-case-id',
          message: 'mutation case ID is not declared by v1',
        },
      ],
    });
  });
});
