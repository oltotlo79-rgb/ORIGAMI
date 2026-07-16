import { parseArtifactContractV1, type ArtifactContractV1 } from './artifacts/contract.js';

export const FOLD_SAFETY_CANDIDATE_CHECKER_RECORD_TYPE =
  'm0f-fold-safety-candidate-checker-result' as const;

export type FoldSafetyCandidateCheckerResultV1 = Readonly<{
  recordType: typeof FOLD_SAFETY_CANDIDATE_CHECKER_RECORD_TYPE;
  contractStatus: 'candidate-no-claim';
  scientificClaim: false;
  structuralInputAccepted: boolean;
  pathConnectionAccepted: boolean;
  layerCoverageAccepted: boolean;
  contactDeclarationsAccepted: boolean;
  throughPenetrationChecked: false;
  continuousMotionChecked: false;
  layerOrderPhysicallyVerified: false;
  safeToUseAsProductResult: false;
  issues: readonly Readonly<{ path: string; code: string; message: string }>[];
}>;

export type FoldSafetyCandidateCheckerEvaluationV1 =
  | Readonly<{ ok: true; value: FoldSafetyCandidateCheckerResultV1 }>
  | Readonly<{
      ok: false;
      error: readonly Readonly<{ path: string; code: string; message: string }>[];
    }>;

export function evaluateFoldSafetyCandidateCheckerV1(
  input: unknown,
): FoldSafetyCandidateCheckerEvaluationV1 {
  const parsed = parseArtifactContractV1(input);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  const contract: ArtifactContractV1 = parsed.value;
  const issues: { path: string; code: string; message: string }[] = [];
  const pathConnectionAccepted = contract.pathCandidate.segments.length >= 2;
  if (!pathConnectionAccepted)
    issues.push({
      path: '$.pathCandidate.segments',
      code: 'insufficient-segments',
      message: 'at least two segments are required',
    });
  const layerCoverageAccepted = contract.contacts.every((contact) =>
    contract.layerEvents.some((event) => event.overlapRegionId === contact.overlapRegionId),
  );
  const contactDeclarationsAccepted = true;
  return {
    ok: true,
    value: {
      recordType: FOLD_SAFETY_CANDIDATE_CHECKER_RECORD_TYPE,
      contractStatus: 'candidate-no-claim',
      scientificClaim: false,
      structuralInputAccepted: true,
      pathConnectionAccepted,
      layerCoverageAccepted,
      contactDeclarationsAccepted,
      throughPenetrationChecked: false,
      continuousMotionChecked: false,
      layerOrderPhysicallyVerified: false,
      safeToUseAsProductResult: false,
      issues,
    },
  };
}
