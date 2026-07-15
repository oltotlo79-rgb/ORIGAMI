import {
  parseArtifactContractV1,
  type ArtifactContractIssue,
  type ArtifactContractV1,
  type PathCandidateV1,
} from './artifacts/contract.js';
import { deepFreezeOwned } from './clone-and-freeze.js';

export const BOUNDED_PATH_CANDIDATE_FLOW_RESULT_RECORD_TYPE =
  'm0f-bounded-path-candidate-flow-result' as const;

type PathSegmentV1 = PathCandidateV1['segments'][number];
type BoundedMotionV1 = Extract<PathSegmentV1['motion'], { kind: 'bounded-interpolation' }>;
type BoundedSegmentV1 = Omit<PathSegmentV1, 'motion'> & Readonly<{ motion: BoundedMotionV1 }>;

export type BoundedPathCandidateFlowIssueV1 = Readonly<{
  stage: 'artifact-contract' | 'flow-scope' | 'current-parser-replay';
  path: string;
  code: string;
  message: string;
}>;

export type BoundedPathCandidateFlowResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BOUNDED_PATH_CANDIDATE_FLOW_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  outputKind: 'declared-bounded-path-parser-diagnostic-not-physical-continuity';
  scope: 'caller-supplied-artifact-contract-two-or-more-bounded-interpolation-segments-only';
  artifactContractAccepted: true;
  boundedRepresentationAccepted: true;
  candidateRepresentationBoundaryAccepted: true;
  uniformRepresentationAccepted: true;
  declaredTimeCoverageAccepted: true;
  declaredKnotCoverageAccepted: true;
  declaredFiniteNumbersAccepted: true;
  declaredMotionMapAccepted: true;
  declaredAngleBoundsAccepted: true;
  declaredEndpointMapAccepted: true;
  declaredEndpointEqualityAccepted: true;
  currentParserReplayAccepted: true;
  segmentCount: number;
  adjacentEndpointCount: number;
  declaredMovingCreaseCount: number;
  declaredKnotCount: number;
  declaredKnotIntervalCount: number;
  piecewisePolynomialIncluded: false;
  independentPathVerifierIncluded: false;
  physicalAngleSemanticsEstablished: false;
  physicalPathContinuityEstablished: false;
  endpointTargetStateVerified: false;
  creaseMapCompletenessEstablished: false;
  rigidMotionEstablished: false;
  faceIsometryEstablished: false;
  hingeGeometryEstablished: false;
  contactAnalysisIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionFreedomEstablished: false;
  layerOrderEstablished: false;
  foldabilityEstablished: false;
  supportProfileIncluded: false;
  toleranceProfileIncluded: false;
  globalM0fGate: 'not-evaluated';
  artifactContract: ArtifactContractV1;
}>;

export type BoundedPathCandidateFlowEvaluationV1 =
  | Readonly<{ ok: true; value: BoundedPathCandidateFlowResultV1 }>
  | Readonly<{ ok: false; error: readonly BoundedPathCandidateFlowIssueV1[] }>;

function failure(
  error: readonly BoundedPathCandidateFlowIssueV1[],
): BoundedPathCandidateFlowEvaluationV1 {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function artifactFailure(
  error: readonly ArtifactContractIssue[],
  stage: 'artifact-contract' | 'current-parser-replay' = 'artifact-contract',
): BoundedPathCandidateFlowEvaluationV1 {
  return failure(
    error.map((entry) => ({
      stage,
      path: entry.path,
      code: entry.code,
      message: entry.message,
    })),
  );
}

/**
 * Replays the existing artifact-contract path checks for a caller-owned,
 * multi-segment bounded-interpolation declaration. Parser acceptance concerns
 * only declared data consistency and is not physical path verification.
 */
export function evaluateBoundedPathCandidateFlowV1(
  supplied: unknown,
): BoundedPathCandidateFlowEvaluationV1 {
  const parsed = parseArtifactContractV1(supplied);
  if (!parsed.ok) return artifactFailure(parsed.error);

  const segments = parsed.value.pathCandidate.segments;
  if (segments.length < 2) {
    return failure([
      {
        stage: 'flow-scope',
        path: '$.pathCandidate.segments',
        code: 'insufficient-segments-for-endpoint-check',
        message: 'candidate flow requires at least two segments to exercise endpoint checks',
      },
    ]);
  }
  const unsupportedIndex = segments.findIndex(
    (segment) => segment.motion.kind !== 'bounded-interpolation',
  );
  if (unsupportedIndex >= 0) {
    return failure([
      {
        stage: 'flow-scope',
        path: `$.pathCandidate.segments[${unsupportedIndex}].motion.kind`,
        code: 'bounded-interpolation-required',
        message: 'candidate flow is limited to bounded-interpolation segments',
      },
    ]);
  }
  const boundedSegments = segments as readonly BoundedSegmentV1[];
  const firstSegment = boundedSegments[0];
  if (firstSegment === undefined) {
    return failure([
      {
        stage: 'flow-scope',
        path: '$.pathCandidate.segments',
        code: 'insufficient-segments-for-endpoint-check',
        message: 'candidate flow requires at least two segments to exercise endpoint checks',
      },
    ]);
  }

  const replay = parseArtifactContractV1(parsed.value);
  if (!replay.ok) return artifactFailure(replay.error, 'current-parser-replay');

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: BOUNDED_PATH_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      outputKind: 'declared-bounded-path-parser-diagnostic-not-physical-continuity' as const,
      scope:
        'caller-supplied-artifact-contract-two-or-more-bounded-interpolation-segments-only' as const,
      artifactContractAccepted: true as const,
      boundedRepresentationAccepted: true as const,
      candidateRepresentationBoundaryAccepted: true as const,
      uniformRepresentationAccepted: true as const,
      declaredTimeCoverageAccepted: true as const,
      declaredKnotCoverageAccepted: true as const,
      declaredFiniteNumbersAccepted: true as const,
      declaredMotionMapAccepted: true as const,
      declaredAngleBoundsAccepted: true as const,
      declaredEndpointMapAccepted: true as const,
      declaredEndpointEqualityAccepted: true as const,
      currentParserReplayAccepted: true as const,
      segmentCount: boundedSegments.length,
      adjacentEndpointCount: boundedSegments.length - 1,
      declaredMovingCreaseCount: firstSegment.motion.anglesByCrease.length,
      declaredKnotCount: boundedSegments.reduce(
        (total, segment) => total + segment.motion.knotTimes.length,
        0,
      ),
      declaredKnotIntervalCount: boundedSegments.reduce(
        (total, segment) => total + segment.motion.knotTimes.length - 1,
        0,
      ),
      piecewisePolynomialIncluded: false as const,
      independentPathVerifierIncluded: false as const,
      physicalAngleSemanticsEstablished: false as const,
      physicalPathContinuityEstablished: false as const,
      endpointTargetStateVerified: false as const,
      creaseMapCompletenessEstablished: false as const,
      rigidMotionEstablished: false as const,
      faceIsometryEstablished: false as const,
      hingeGeometryEstablished: false as const,
      contactAnalysisIncluded: false as const,
      continuousCollisionDetectionIncluded: false as const,
      collisionFreedomEstablished: false as const,
      layerOrderEstablished: false as const,
      foldabilityEstablished: false as const,
      supportProfileIncluded: false as const,
      toleranceProfileIncluded: false as const,
      globalM0fGate: 'not-evaluated' as const,
      artifactContract: replay.value,
    },
  });
}
