import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import {
  computeStaticRationalTriangleOverlapCensusV1,
  type StaticRationalTriangleOverlapCensusIssueV1,
} from './geometry/static-rational-triangle-overlap-census.js';
import {
  analyzeStaticRationalTriangleFoldMeshStrataV1,
  type StaticRationalTriangleFoldMeshStrataCategoryV1,
  type StaticRationalTriangleFoldMeshStrataIssueV1,
} from './geometry/static-rational-triangle-fold-mesh-strata.js';
import {
  createStaticRationalTriangleNonadjacentCrossingWitnessesV1,
  type StaticRationalTriangleNonadjacentCrossingWitnessIssueV1,
  type StaticRationalTriangleNonadjacentCrossingWitnessSetV1,
} from './geometry/static-rational-triangle-nonadjacent-crossing-witness.js';
import type { StaticRationalTriangle3 } from './geometry/static-rational-triangle-overlap.js';
import {
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
  type StaticRationalTriangleOverlapCensusAuditInputSnapshotV1,
} from './reference-verifier/static-rational-triangle-overlap-census-audit.js';
import {
  createStaticRationalTriangleOverlapCensusEvidenceV1,
  parseStaticRationalTriangleOverlapCensusEvidenceV1,
  type StaticRationalTriangleOverlapCensusEvidenceIssueV1,
  type StaticRationalTriangleOverlapCensusEvidenceV1,
} from './reference-verifier/static-rational-triangle-overlap-census-evidence.js';
import {
  auditStaticRationalTriangleNonadjacentCrossingWitnessesV1,
  type StaticRationalTriangleNonadjacentCrossingAuditConsistentV1,
  type StaticRationalTriangleNonadjacentCrossingAuditIssueV1,
} from './reference-verifier/static-rational-triangle-nonadjacent-crossing-audit.js';

export const STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT_RECORD_TYPE =
  'm0f-static-exact-3d-candidate-flow-input' as const;
export const STATIC_EXACT_3D_CANDIDATE_FLOW_RESULT_RECORD_TYPE =
  'm0f-static-exact-3d-candidate-flow-result' as const;
export const STATIC_EXACT_3D_PORTABLE_COORDINATE_ENCODING =
  'canonical-projective-bigint-decimal-v1' as const;

export type StaticExact3dPortablePointV1 = Readonly<{
  x: string;
  y: string;
  z: string;
  w: string;
}>;

export type StaticExact3dCandidateFlowIssueV1 = Readonly<{
  stage:
    | 'portable-input'
    | 'mesh-strata'
    | 'raw-overlap-census'
    | 'census-evidence'
    | 'census-evidence-replay'
    | 'crossing-witness'
    | 'crossing-witness-audit'
    | 'cross-stage-binding'
    | 'flow-internal';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
}>;

export type StaticExact3dPairDiagnosticV1 = Readonly<{
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  firstFaceId: string;
  secondFaceId: string;
  category: StaticRationalTriangleFoldMeshStrataCategoryV1;
  staticNonadjacentInteriorCrossingDetected: boolean;
  staticContactCandidate: boolean;
  requiresMotionSideHistory: boolean;
  requiresLayerOrder: boolean;
}>;

export type StaticExact3dCandidateFlowResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof STATIC_EXACT_3D_CANDIDATE_FLOW_RESULT_RECORD_TYPE;
  contractStatus: 'candidate-no-claim';
  scientificClaim: false;
  outputKind: 'one-exact-static-pose-diagnostic-not-continuous-collision-verification';
  scope: 'caller-supplied-bound-fold-mesh-at-one-exact-static-3d-pose-only';
  portableDecimalInputAccepted: true;
  exactStaticMeshStrataCompleted: true;
  allUnorderedStaticPairsIncluded: true;
  meshIdentityBoundToExactPose: true;
  declaredHingeLocusContainmentIncluded: true;
  rawOverlapCensusCompleted: true;
  independentWholeCensusAuditPassed: true;
  currentSourceSetEvidenceReplayPassed: true;
  portableCrossingWitnessSetCreated: true;
  independentCrossingWitnessAuditConsistent: true;
  staticContactCandidateCategoriesIncluded: true;
  layerOrderRequirementFlagsIncluded: true;
  triangleCount: number;
  unorderedPairCount: number;
  staticContactCandidatePairCount: number;
  staticNonadjacentInteriorCrossingPairCount: number;
  requiresMotionSideHistoryPairCount: number;
  requiresLayerOrderPairCount: number;
  nonadjacentContactRequiresMotionHistoryPairCount: number;
  nonadjacentCoplanarAreaRequiresLayerOrderPairCount: number;
  positiveStaticCrossingEvidenceConfirmed: boolean;
  pairDiagnostics: readonly StaticExact3dPairDiagnosticV1[];
  censusEvidence: StaticRationalTriangleOverlapCensusEvidenceV1;
  crossingWitnesses: StaticRationalTriangleNonadjacentCrossingWitnessSetV1;
  crossingAudit: StaticRationalTriangleNonadjacentCrossingAuditConsistentV1;
  cryptographicMeshRevisionBindingIncluded: false;
  productStableIdentityIncluded: false;
  motionSideHistoryIncluded: false;
  legalContactPolicyIncluded: false;
  physicalContactCompletenessEstablished: false;
  penetrationClassificationIncluded: false;
  layerOrderDecisionIncluded: false;
  physicalLayerOrderEstablished: false;
  selfIntersectionDecisionIncluded: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  continuousCollisionFreedomEstablished: false;
  foldabilityEstablished: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  verifiedClaim: false;
  globalM0fGate: 'not-evaluated';
}>;

export type StaticExact3dCandidateFlowEvaluationV1 =
  | Readonly<{ ok: true; value: StaticExact3dCandidateFlowResultV1 }>
  | Readonly<{ ok: false; error: readonly StaticExact3dCandidateFlowIssueV1[] }>;

type DecodedTriangleEntry = Readonly<{ triangleId: string; triangle: StaticRationalTriangle3 }>;
type DecodedInput = Readonly<{
  meshRevisionId: string;
  triangulationRevisionId: string;
  poseRevisionId: string;
  reconstruction: unknown;
  staticTriangleSet: Readonly<{ triangles: readonly DecodedTriangleEntry[] }>;
}>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'coordinateEncoding',
  'meshRevisionId',
  'triangulationRevisionId',
  'poseRevisionId',
  'reconstruction',
  'staticTriangleSet',
] as const;
const INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;
const MAX_DECIMAL_DIGITS = 4_934;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(path: string, code: string, message: string): StaticExact3dCandidateFlowIssueV1 {
  return { stage: 'portable-input', path, code, message };
}

function failure(
  error: readonly StaticExact3dCandidateFlowIssueV1[],
): StaticExact3dCandidateFlowEvaluationV1 {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  issues: StaticExact3dCandidateFlowIssueV1[],
): void {
  const expectedSet = new Set(expected);
  for (const key of Object.keys(value)) {
    if (!expectedSet.has(key))
      issues.push(issue(`${path}.${key}`, 'unknown-field', 'unknown field'));
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key))
      issues.push(issue(`${path}.${key}`, 'missing-field', 'required field'));
  }
}

function decimalBigInt(
  value: unknown,
  path: string,
  positive: boolean,
  issues: StaticExact3dCandidateFlowIssueV1[],
): bigint | undefined {
  if (typeof value !== 'string') {
    issues.push(issue(path, 'expected-decimal-string', 'coordinate must be a decimal string'));
    return undefined;
  }
  const digits = value.startsWith('-') ? value.length - 1 : value.length;
  if (digits > MAX_DECIMAL_DIGITS) {
    issues.push(issue(path, 'coordinate-limit-exceeded', 'coordinate decimal string is too long'));
    return undefined;
  }
  const pattern = positive ? POSITIVE_INTEGER_PATTERN : INTEGER_PATTERN;
  if (!pattern.test(value)) {
    issues.push(
      issue(
        path,
        'noncanonical-decimal',
        positive ? 'weight must be a canonical positive integer' : 'coordinate must be canonical',
      ),
    );
    return undefined;
  }
  return BigInt(value);
}

function decodePoint(value: unknown, path: string, issues: StaticExact3dCandidateFlowIssueV1[]) {
  if (!isRecord(value)) {
    issues.push(issue(path, 'invalid-point', 'projective point must be an object'));
    return undefined;
  }
  exactKeys(value, ['x', 'y', 'z', 'w'], path, issues);
  const x = decimalBigInt(value.x, `${path}.x`, false, issues);
  const y = decimalBigInt(value.y, `${path}.y`, false, issues);
  const z = decimalBigInt(value.z, `${path}.z`, false, issues);
  const w = decimalBigInt(value.w, `${path}.w`, true, issues);
  return x === undefined || y === undefined || z === undefined || w === undefined
    ? undefined
    : { x, y, z, w };
}

function decodePortableInput(
  supplied: unknown,
): Readonly<
  | { ok: true; value: DecodedInput }
  | { ok: false; error: readonly StaticExact3dCandidateFlowIssueV1[] }
> {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok || !isRecord(snapshot.value)) {
    return {
      ok: false,
      error: [issue('$', 'invalid-snapshot', 'input must be one plain JSON-data object')],
    };
  }
  const raw = snapshot.value;
  const issues: StaticExact3dCandidateFlowIssueV1[] = [];
  exactKeys(raw, ROOT_KEYS, '$', issues);
  const literals: readonly [string, unknown, unknown][] = [
    ['$.schemaVersion', raw.schemaVersion, 1],
    ['$.recordType', raw.recordType, STATIC_EXACT_3D_CANDIDATE_FLOW_INPUT_RECORD_TYPE],
    ['$.contractStatus', raw.contractStatus, 'candidate'],
    ['$.scientificClaim', raw.scientificClaim, false],
    ['$.coordinateEncoding', raw.coordinateEncoding, STATIC_EXACT_3D_PORTABLE_COORDINATE_ENCODING],
  ];
  for (const [path, actual, expected] of literals) {
    if (actual !== expected)
      issues.push(issue(path, 'invalid-literal', `must equal ${String(expected)}`));
  }
  for (const key of ['meshRevisionId', 'triangulationRevisionId', 'poseRevisionId'] as const) {
    if (typeof raw[key] !== 'string') {
      issues.push(issue(`$.${key}`, 'expected-string', 'revision ID must be a string'));
    }
  }
  const triangleEntries: DecodedTriangleEntry[] = [];
  if (!isRecord(raw.staticTriangleSet)) {
    issues.push(
      issue('$.staticTriangleSet', 'invalid-object', 'staticTriangleSet must be an object'),
    );
  } else {
    exactKeys(raw.staticTriangleSet, ['triangles'], '$.staticTriangleSet', issues);
    const triangles = raw.staticTriangleSet.triangles;
    if (!Array.isArray(triangles)) {
      issues.push(
        issue('$.staticTriangleSet.triangles', 'invalid-array', 'triangles must be an array'),
      );
    } else {
      triangles.forEach((entry, triangleIndex) => {
        const entryPath = `$.staticTriangleSet.triangles[${triangleIndex}]`;
        if (!isRecord(entry)) {
          issues.push(issue(entryPath, 'invalid-object', 'triangle entry must be an object'));
          return;
        }
        exactKeys(entry, ['triangleId', 'triangle'], entryPath, issues);
        if (typeof entry.triangleId !== 'string') {
          issues.push(
            issue(`${entryPath}.triangleId`, 'expected-string', 'triangleId must be a string'),
          );
          return;
        }
        if (!Array.isArray(entry.triangle) || entry.triangle.length !== 3) {
          issues.push(
            issue(
              `${entryPath}.triangle`,
              'invalid-triangle',
              'triangle must contain three points',
            ),
          );
          return;
        }
        const points = entry.triangle.map((point, pointIndex) =>
          decodePoint(point, `${entryPath}.triangle[${pointIndex}]`, issues),
        );
        const first = points[0];
        const second = points[1];
        const third = points[2];
        if (first !== undefined && second !== undefined && third !== undefined) {
          triangleEntries.push({
            triangleId: entry.triangleId,
            triangle: [first, second, third],
          });
        }
      });
    }
  }
  if (issues.length > 0) return { ok: false, error: issues };
  return {
    ok: true,
    value: {
      meshRevisionId: raw.meshRevisionId as string,
      triangulationRevisionId: raw.triangulationRevisionId as string,
      poseRevisionId: raw.poseRevisionId as string,
      reconstruction: raw.reconstruction,
      staticTriangleSet: { triangles: triangleEntries },
    },
  };
}

function copiedFailure(
  stage: StaticExact3dCandidateFlowIssueV1['stage'],
  error:
    | readonly StaticRationalTriangleFoldMeshStrataIssueV1[]
    | readonly StaticRationalTriangleOverlapCensusIssueV1[]
    | readonly StaticRationalTriangleOverlapCensusEvidenceIssueV1[]
    | readonly StaticRationalTriangleNonadjacentCrossingWitnessIssueV1[]
    | readonly StaticRationalTriangleNonadjacentCrossingAuditIssueV1[],
): StaticExact3dCandidateFlowEvaluationV1 {
  return failure(
    error.map((entry) => ({
      stage,
      path: entry.path,
      code: entry.code,
      message: entry.message,
      ...('stage' in entry ? { sourceStage: entry.stage } : {}),
    })),
  );
}

/** Runs exact intersection diagnostics for one static pose; no time interval is checked. */
export async function evaluateStaticExact3dCandidateFlowV1(
  supplied: unknown,
): Promise<StaticExact3dCandidateFlowEvaluationV1> {
  const decoded = decodePortableInput(supplied);
  if (!decoded.ok) return failure(decoded.error);

  const analysis = analyzeStaticRationalTriangleFoldMeshStrataV1(decoded.value);
  if (!analysis.ok) return copiedFailure('mesh-strata', analysis.error);
  const triangles = analysis.value.binding.triangles.map((entry) => ({
    triangleId: entry.triangleId,
    triangle: entry.triangle,
  }));
  const census = computeStaticRationalTriangleOverlapCensusV1({ triangles });
  if (!census.ok) return copiedFailure('raw-overlap-census', census.error);

  const auditInput: StaticRationalTriangleOverlapCensusAuditInputSnapshotV1 = {
    schemaVersion: 1,
    recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
    coordinateEncoding: 'bigint',
    triangles,
    producer: census.value,
  };
  const evidence = await createStaticRationalTriangleOverlapCensusEvidenceV1(auditInput);
  if (!evidence.ok) return copiedFailure('census-evidence', evidence.error);
  const evidenceReplay = await parseStaticRationalTriangleOverlapCensusEvidenceV1(evidence.value);
  if (!evidenceReplay.ok) return copiedFailure('census-evidence-replay', evidenceReplay.error);

  const witnesses = createStaticRationalTriangleNonadjacentCrossingWitnessesV1(decoded.value);
  if (!witnesses.ok) return copiedFailure('crossing-witness', witnesses.error);
  const crossingAudit = auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(witnesses.value);
  if (!crossingAudit.ok) {
    if ('error' in crossingAudit) {
      return copiedFailure('crossing-witness-audit', crossingAudit.error);
    }
    return failure([
      {
        stage: 'crossing-witness-audit',
        path: `$.witnesses[${crossingAudit.value.firstInvalidWitnessIndex}]`,
        code: crossingAudit.value.reason,
        message: 'independent crossing witness audit reported inconsistency',
      },
    ]);
  }

  if (
    census.value.triangleCount !== analysis.value.triangleCount ||
    census.value.unorderedPairCount !== analysis.value.unorderedPairCount ||
    witnesses.value.witnessCount !==
      analysis.value.nonadjacentStaticInteriorCrossingEvidencePairCount
  ) {
    return failure([
      {
        stage: 'cross-stage-binding',
        path: '$',
        code: 'static-pipeline-count-mismatch',
        message: 'mesh strata, raw census, and portable witness counts must remain bound',
      },
    ]);
  }

  const pairDiagnostics = analysis.value.pairs.map((pair) => ({
    pairIndex: pair.pairIndex,
    firstTriangleId: pair.firstTriangleId,
    secondTriangleId: pair.secondTriangleId,
    firstFaceId: pair.firstFaceId,
    secondFaceId: pair.secondFaceId,
    category: pair.category,
    staticNonadjacentInteriorCrossingDetected: pair.staticNonadjacentInteriorCrossingDetected,
    staticContactCandidate: pair.strata.staticContactCandidate,
    requiresMotionSideHistory: pair.requiresMotionSideHistory,
    requiresLayerOrder: pair.requiresLayerOrder,
  }));
  const staticContactCandidatePairCount = pairDiagnostics.filter(
    (pair) => pair.staticContactCandidate,
  ).length;
  const requiresMotionSideHistoryPairCount = pairDiagnostics.filter(
    (pair) => pair.requiresMotionSideHistory,
  ).length;
  const requiresLayerOrderPairCount = pairDiagnostics.filter(
    (pair) => pair.requiresLayerOrder,
  ).length;

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: STATIC_EXACT_3D_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate-no-claim' as const,
      scientificClaim: false as const,
      outputKind: 'one-exact-static-pose-diagnostic-not-continuous-collision-verification' as const,
      scope: 'caller-supplied-bound-fold-mesh-at-one-exact-static-3d-pose-only' as const,
      portableDecimalInputAccepted: true as const,
      exactStaticMeshStrataCompleted: true as const,
      allUnorderedStaticPairsIncluded: true as const,
      meshIdentityBoundToExactPose: true as const,
      declaredHingeLocusContainmentIncluded: true as const,
      rawOverlapCensusCompleted: true as const,
      independentWholeCensusAuditPassed: true as const,
      currentSourceSetEvidenceReplayPassed: true as const,
      portableCrossingWitnessSetCreated: true as const,
      independentCrossingWitnessAuditConsistent: true as const,
      staticContactCandidateCategoriesIncluded: true as const,
      layerOrderRequirementFlagsIncluded: true as const,
      triangleCount: analysis.value.triangleCount,
      unorderedPairCount: analysis.value.unorderedPairCount,
      staticContactCandidatePairCount,
      staticNonadjacentInteriorCrossingPairCount:
        analysis.value.nonadjacentStaticInteriorCrossingEvidencePairCount,
      requiresMotionSideHistoryPairCount,
      requiresLayerOrderPairCount,
      nonadjacentContactRequiresMotionHistoryPairCount:
        analysis.value.nonadjacentContactRequiresMotionHistoryPairCount,
      nonadjacentCoplanarAreaRequiresLayerOrderPairCount:
        analysis.value.nonadjacentCoplanarAreaRequiresLayerOrderPairCount,
      positiveStaticCrossingEvidenceConfirmed:
        crossingAudit.value.positiveStaticCrossingEvidenceConfirmed,
      pairDiagnostics,
      censusEvidence: evidenceReplay.value,
      crossingWitnesses: witnesses.value,
      crossingAudit: crossingAudit.value,
      cryptographicMeshRevisionBindingIncluded: false as const,
      productStableIdentityIncluded: false as const,
      motionSideHistoryIncluded: false as const,
      legalContactPolicyIncluded: false as const,
      physicalContactCompletenessEstablished: false as const,
      penetrationClassificationIncluded: false as const,
      layerOrderDecisionIncluded: false as const,
      physicalLayerOrderEstablished: false as const,
      selfIntersectionDecisionIncluded: false as const,
      continuousTimeIncluded: false as const,
      continuousCollisionDetectionIncluded: false as const,
      continuousCollisionFreedomEstablished: false as const,
      foldabilityEstablished: false as const,
      supportProfileIncluded: false as const,
      toleranceProfileIncluded: false as const,
      verifiedClaim: false as const,
      globalM0fGate: 'not-evaluated' as const,
    },
  });
}
