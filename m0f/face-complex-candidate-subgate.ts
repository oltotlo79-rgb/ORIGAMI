import { lstat, open, realpath } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';

import { deepFreezeOwned } from './clone-and-freeze.js';
import {
  FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE,
  FACE_COMPLEX_CANDIDATE_EVIDENCE_SCOPE,
  FACE_COMPLEX_CANDIDATE_FIXTURE_ID,
  parseFaceComplexCandidateEvidenceIndexV1,
  type FaceComplexCandidateEvidenceIndexV1,
} from './face-complex-candidate-evidence.js';
import {
  FACE_COMPLEX_AUDIT_ENGINE_VERSION,
  FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
  FACE_COMPLEX_AUDIT_PARAMETERS_V1,
} from './experiments/face-complex-audit.js';
import {
  FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
  FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
  FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1,
} from './experiments/face-reconstruction.js';
import {
  parseCandidateExperimentRecordV1,
  type CandidateExperimentRecordV1,
} from './experiments/contract.js';
import { runCandidateExperimentV1 } from './experiments/runner.js';
import { adaptFoldDocumentToFaceReconstructionInputV1 } from './geometry/fold-document-face-adapter.js';
import { prepareFaceComplexAuditInputV1 } from './geometry/prepare-face-complex-audit-input.js';
import {
  type DistributedArtifact,
  type ExpectedOutcome,
  type FixtureManifestEntry,
  sha256Prefixed,
  validateFixtureRepository,
} from './manifest.js';
import {
  parseFaceComplexAuditEvidenceV1,
  reauditFaceComplexAuditEvidenceV1,
} from './reference-verifier/face-complex-evidence.js';
import {
  FACE_COMPLEX_MUTATION_SUITE_V1,
  parseFaceComplexMutationSuiteV1,
  parseFaceComplexMutationSuiteResultV1,
  runFaceComplexMutationSuiteV1,
  type FaceComplexMutationSuiteConsistentV1,
} from './reference-verifier/face-complex-mutation-suite.js';
import { stableStringify } from './stable-json.js';

export const FACE_COMPLEX_CANDIDATE_SUBGATE_RECORD_TYPE =
  'm0f-face-complex-candidate-subgate-result' as const;

export const FACE_COMPLEX_CANDIDATE_SUBGATE_REASON_CODES = [
  'repository-invalid',
  'fixture-missing',
  'fixture-contract-invalid',
  'evidence-index-missing',
  'evidence-index-duplicate',
  'evidence-index-invalid',
  'evidence-reference-invalid',
  'artifact-hash-changed',
  'source-input-unreadable',
  'source-input-invalid-json',
  'source-fold-unsupported',
  'reconstruction-record-unreadable',
  'reconstruction-record-invalid',
  'reconstruction-record-not-completed',
  'reconstruction-rerun-failed',
  'reconstruction-evidence-mismatch',
  'audit-record-unreadable',
  'audit-record-invalid',
  'audit-record-not-completed',
  'audit-input-preparation-failed',
  'audit-rerun-failed',
  'audit-evidence-mismatch',
  'audit-evidence-unreadable',
  'audit-evidence-invalid',
  'audit-evidence-source-mismatch',
  'audit-evidence-reaudit-failed',
  'mutation-suite-unreadable',
  'mutation-suite-invalid',
  'mutation-suite-noncanonical',
  'mutation-result-unreadable',
  'mutation-result-invalid',
  'mutation-suite-rerun-failed',
  'mutation-evidence-mismatch',
  'unexpected-failure',
] as const;

export type FaceComplexCandidateSubgateReasonCode =
  (typeof FACE_COMPLEX_CANDIDATE_SUBGATE_REASON_CODES)[number];

type ExpectedOutcomeKind = ExpectedOutcome['kind'];

export type FaceComplexCandidateSubgateResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof FACE_COMPLEX_CANDIDATE_SUBGATE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: typeof FACE_COMPLEX_CANDIDATE_EVIDENCE_SCOPE;
  globalM0fGate: 'not-evaluated';
  fixtureId: typeof FACE_COMPLEX_CANDIDATE_FIXTURE_ID;
  outcome: 'candidate-stage-ready' | 'blocked';
  passed: boolean;
  reasonCodes: readonly FaceComplexCandidateSubgateReasonCode[];
  manifest: Readonly<{
    repositoryValid: boolean;
    fixturePresent: boolean;
    fixtureContractValid: boolean;
    expectedOutcomeObserved: ExpectedOutcomeKind | null;
    expectedOutcomeUsedAsEvidence: false;
  }>;
  evidence: Readonly<{
    indexPresentAndValid: boolean;
    reconstructionRecordPresentAndValid: boolean;
    auditRecordPresentAndValid: boolean;
    reconstructionRerunMatched: boolean;
    auditRerunMatched: boolean;
    auditEvidencePresentAndValid: boolean;
    auditEvidenceReauditMatched: boolean;
    mutationSuitePresentAndValid: boolean;
    mutationResultPresentAndValid: boolean;
    mutationSuiteRerunMatched: boolean;
  }>;
}>;

interface MutableState {
  reasons: Set<FaceComplexCandidateSubgateReasonCode>;
  repositoryValid: boolean;
  fixturePresent: boolean;
  fixtureContractValid: boolean;
  expectedOutcomeObserved: ExpectedOutcomeKind | null;
  indexPresentAndValid: boolean;
  reconstructionRecordPresentAndValid: boolean;
  auditRecordPresentAndValid: boolean;
  reconstructionRerunMatched: boolean;
  auditRerunMatched: boolean;
  auditEvidencePresentAndValid: boolean;
  auditEvidenceReauditMatched: boolean;
  mutationSuitePresentAndValid: boolean;
  mutationResultPresentAndValid: boolean;
  mutationSuiteRerunMatched: boolean;
}

type CompletedCandidateExperimentRecordV1 = CandidateExperimentRecordV1 &
  Readonly<{
    outcome: 'completed';
    seed: number;
    repetition: number;
    result: NonNullable<CandidateExperimentRecordV1['result']>;
  }>;

function isCompletedExperimentRecord(
  record: CandidateExperimentRecordV1,
): record is CompletedCandidateExperimentRecordV1 {
  return (
    record.outcome === 'completed' &&
    record.seed !== null &&
    record.repetition !== null &&
    record.result !== null
  );
}

function initialState(): MutableState {
  return {
    reasons: new Set(),
    repositoryValid: false,
    fixturePresent: false,
    fixtureContractValid: false,
    expectedOutcomeObserved: null,
    indexPresentAndValid: false,
    reconstructionRecordPresentAndValid: false,
    auditRecordPresentAndValid: false,
    reconstructionRerunMatched: false,
    auditRerunMatched: false,
    auditEvidencePresentAndValid: false,
    auditEvidenceReauditMatched: false,
    mutationSuitePresentAndValid: false,
    mutationResultPresentAndValid: false,
    mutationSuiteRerunMatched: false,
  };
}

function resultFromState(state: MutableState): FaceComplexCandidateSubgateResultV1 {
  const reasonCodes = FACE_COMPLEX_CANDIDATE_SUBGATE_REASON_CODES.filter((code) =>
    state.reasons.has(code),
  );
  const passed = reasonCodes.length === 0;
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: FACE_COMPLEX_CANDIDATE_SUBGATE_RECORD_TYPE,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    scope: FACE_COMPLEX_CANDIDATE_EVIDENCE_SCOPE,
    globalM0fGate: 'not-evaluated' as const,
    fixtureId: FACE_COMPLEX_CANDIDATE_FIXTURE_ID,
    outcome: passed ? ('candidate-stage-ready' as const) : ('blocked' as const),
    passed,
    reasonCodes,
    manifest: {
      repositoryValid: state.repositoryValid,
      fixturePresent: state.fixturePresent,
      fixtureContractValid: state.fixtureContractValid,
      expectedOutcomeObserved: state.expectedOutcomeObserved,
      expectedOutcomeUsedAsEvidence: false as const,
    },
    evidence: {
      indexPresentAndValid: state.indexPresentAndValid,
      reconstructionRecordPresentAndValid: state.reconstructionRecordPresentAndValid,
      auditRecordPresentAndValid: state.auditRecordPresentAndValid,
      reconstructionRerunMatched: state.reconstructionRerunMatched,
      auditRerunMatched: state.auditRerunMatched,
      auditEvidencePresentAndValid: state.auditEvidencePresentAndValid,
      auditEvidenceReauditMatched: state.auditEvidenceReauditMatched,
      mutationSuitePresentAndValid: state.mutationSuitePresentAndValid,
      mutationResultPresentAndValid: state.mutationResultPresentAndValid,
      mutationSuiteRerunMatched: state.mutationSuiteRerunMatched,
    },
  });
}

function hasFixtureContract(fixture: FixtureManifestEntry): boolean {
  const tags = new Set(fixture.coverageTags);
  return (
    fixture.workflow === 'fold-verification' &&
    fixture.polarity === 'positive' &&
    fixture.leafCount === null &&
    tags.has('fold:face-reconstruction') &&
    tags.has('cp:topology')
  );
}

function artifactById(
  fixture: FixtureManifestEntry,
  artifactId: string,
): DistributedArtifact | undefined {
  return fixture.distributedArtifacts.find((artifact) => artifact.artifactId === artifactId);
}

export type FaceComplexCandidateArtifactJsonReadResultV1 =
  Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false; kind: 'read' | 'hash' | 'json' }>;

function pathKey(path: string): string {
  return process.platform === 'win32' ? path.toLowerCase() : path;
}

function isInsideRoot(root: string, candidate: string): boolean {
  const normalizedRoot = pathKey(root);
  const normalizedCandidate = pathKey(candidate);
  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}${sep}`)
  );
}

function samePath(left: string, right: string): boolean {
  return pathKey(left) === pathKey(right);
}

function sameFileIdentity(
  left: Readonly<{ dev: number; ino: number }>,
  right: Readonly<{ dev: number; ino: number }>,
): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

/** @internal Rechecks the manifest-bound hash on the exact bytes consumed by the subgate. */
export async function readManifestBoundFaceComplexArtifactJsonV1(
  fixtureRoot: string,
  artifact: DistributedArtifact,
): Promise<FaceComplexCandidateArtifactJsonReadResultV1> {
  try {
    // Capture the manifest binding before the first await so caller mutation
    // cannot retarget the path or bless different bytes while I/O is pending.
    const artifactPath = artifact.path;
    const expectedSha256 = artifact.sha256;
    const absoluteRoot = resolve(fixtureRoot);
    const absolutePath = resolve(absoluteRoot, artifactPath);
    if (!isInsideRoot(absoluteRoot, absolutePath) || samePath(absoluteRoot, absolutePath)) {
      return { ok: false, kind: 'read' };
    }

    const canonicalRoot = await realpath(absoluteRoot);
    const expectedCanonicalPath = resolve(canonicalRoot, relative(absoluteRoot, absolutePath));
    if (!isInsideRoot(canonicalRoot, expectedCanonicalPath)) {
      return { ok: false, kind: 'read' };
    }

    const initialPathStats = await lstat(absolutePath);
    if (initialPathStats.isSymbolicLink() || !initialPathStats.isFile()) {
      return { ok: false, kind: 'read' };
    }
    const canonicalPath = await realpath(absolutePath);
    if (
      !isInsideRoot(canonicalRoot, canonicalPath) ||
      !samePath(canonicalPath, expectedCanonicalPath)
    ) {
      return { ok: false, kind: 'read' };
    }

    const handle = await open(canonicalPath, 'r');
    let bytes: Uint8Array;
    try {
      const openedStats = await handle.stat();
      const beforeReadStats = await lstat(absolutePath);
      const beforeReadCanonicalPath = await realpath(absolutePath);
      if (
        !openedStats.isFile() ||
        beforeReadStats.isSymbolicLink() ||
        !beforeReadStats.isFile() ||
        !samePath(beforeReadCanonicalPath, canonicalPath) ||
        !sameFileIdentity(openedStats, beforeReadStats)
      ) {
        return { ok: false, kind: 'read' };
      }

      bytes = await handle.readFile();

      const afterReadStats = await lstat(absolutePath);
      const afterReadCanonicalPath = await realpath(absolutePath);
      if (
        afterReadStats.isSymbolicLink() ||
        !afterReadStats.isFile() ||
        !samePath(afterReadCanonicalPath, canonicalPath) ||
        !sameFileIdentity(openedStats, afterReadStats)
      ) {
        return { ok: false, kind: 'read' };
      }
    } finally {
      await handle.close();
    }

    if (sha256Prefixed(bytes) !== expectedSha256) return { ok: false, kind: 'hash' };
    try {
      return { ok: true, value: JSON.parse(Buffer.from(bytes).toString('utf8')) as unknown };
    } catch {
      return { ok: false, kind: 'json' };
    }
  } catch {
    return { ok: false, kind: 'read' };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function findEvidenceIndex(
  fixtureRoot: string,
  fixture: FixtureManifestEntry,
  state: MutableState,
): Promise<FaceComplexCandidateEvidenceIndexV1 | undefined> {
  const evidenceIds = fixture.knownArtifacts
    .filter((pointer) => pointer.kind === 'evidence-blob')
    .map((pointer) => pointer.artifactId);
  const candidates: unknown[] = [];
  for (const artifactId of evidenceIds) {
    const artifact = artifactById(fixture, artifactId);
    if (artifact === undefined) continue;
    const loaded = await readManifestBoundFaceComplexArtifactJsonV1(fixtureRoot, artifact);
    if (!loaded.ok && loaded.kind === 'hash') state.reasons.add('artifact-hash-changed');
    if (
      loaded.ok &&
      isRecord(loaded.value) &&
      loaded.value.recordType === FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE
    ) {
      candidates.push(loaded.value);
    }
  }
  if (candidates.length === 0) {
    state.reasons.add('evidence-index-missing');
    return undefined;
  }
  if (candidates.length !== 1) {
    state.reasons.add('evidence-index-duplicate');
    return undefined;
  }
  const parsed = parseFaceComplexCandidateEvidenceIndexV1(candidates[0]);
  if (!parsed.ok) {
    state.reasons.add('evidence-index-invalid');
    return undefined;
  }
  state.indexPresentAndValid = true;
  return parsed.value;
}

async function loadExperimentRecord(
  fixtureRoot: string,
  fixture: FixtureManifestEntry,
  artifactId: string,
  expectedExperimentId: string,
  expectedEngineVersion: string,
  role: 'reconstruction' | 'audit',
  state: MutableState,
): Promise<CompletedCandidateExperimentRecordV1 | undefined> {
  const artifact = artifactById(fixture, artifactId);
  const pointer = fixture.knownArtifacts.find(
    (entry) => entry.kind === 'evidence-blob' && entry.artifactId === artifactId,
  );
  if (artifact?.artifactKind !== 'known-artifact' || pointer === undefined) {
    state.reasons.add('evidence-reference-invalid');
    return undefined;
  }
  const loaded = await readManifestBoundFaceComplexArtifactJsonV1(fixtureRoot, artifact);
  if (!loaded.ok) {
    if (loaded.kind === 'hash') state.reasons.add('artifact-hash-changed');
    else state.reasons.add(`${role}-record-${loaded.kind === 'read' ? 'unreadable' : 'invalid'}`);
    return undefined;
  }
  const parsed = await parseCandidateExperimentRecordV1(loaded.value);
  if (
    !parsed.ok ||
    parsed.value.experimentId !== expectedExperimentId ||
    parsed.value.engineVersion !== expectedEngineVersion
  ) {
    state.reasons.add(`${role}-record-invalid`);
    return undefined;
  }
  if (!isCompletedExperimentRecord(parsed.value)) {
    state.reasons.add(`${role}-record-not-completed`);
    return undefined;
  }
  if (role === 'reconstruction') state.reconstructionRecordPresentAndValid = true;
  else state.auditRecordPresentAndValid = true;
  return parsed.value;
}

async function loadRegisteredEvidenceJson(
  fixtureRoot: string,
  fixture: FixtureManifestEntry,
  artifactId: string,
  unreadableCode: FaceComplexCandidateSubgateReasonCode,
  invalidCode: FaceComplexCandidateSubgateReasonCode,
  state: MutableState,
): Promise<Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }>> {
  const artifact = artifactById(fixture, artifactId);
  const pointer = fixture.knownArtifacts.find(
    (entry) => entry.kind === 'evidence-blob' && entry.artifactId === artifactId,
  );
  if (artifact?.artifactKind !== 'known-artifact' || pointer === undefined) {
    state.reasons.add('evidence-reference-invalid');
    return { ok: false };
  }
  const loaded = await readManifestBoundFaceComplexArtifactJsonV1(fixtureRoot, artifact);
  if (!loaded.ok) {
    if (loaded.kind === 'hash') state.reasons.add('artifact-hash-changed');
    else state.reasons.add(loaded.kind === 'read' ? unreadableCode : invalidCode);
    return { ok: false };
  }
  return { ok: true, value: loaded.value };
}

/**
 * Executes the REF-FOLD-NOFACES reconstruction and separate face audit again.
 * Passing means only that this candidate stage's registered evidence is complete
 * and reproducible; the global M0F evidence gate is deliberately not evaluated.
 */
export async function evaluateFaceComplexCandidateSubgateV1(
  manifestPath: string,
): Promise<FaceComplexCandidateSubgateResultV1> {
  const state = initialState();
  try {
    const repository = await validateFixtureRepository(manifestPath);
    if (repository.issues.some((issue) => issue.severity === 'error') || !repository.manifest) {
      state.reasons.add('repository-invalid');
      return resultFromState(state);
    }
    state.repositoryValid = true;
    const fixture = repository.manifest.fixtures.find(
      (entry) => entry.id === FACE_COMPLEX_CANDIDATE_FIXTURE_ID,
    );
    if (fixture === undefined) {
      state.reasons.add('fixture-missing');
      return resultFromState(state);
    }
    state.fixturePresent = true;
    state.expectedOutcomeObserved = fixture.expectedOutcome.kind;
    if (!hasFixtureContract(fixture)) {
      state.reasons.add('fixture-contract-invalid');
      return resultFromState(state);
    }
    state.fixtureContractValid = true;

    const fixtureRoot = dirname(repository.manifestPath);
    const index = await findEvidenceIndex(fixtureRoot, fixture, state);
    if (index === undefined) return resultFromState(state);
    if (index.sourceInputArtifactId !== fixture.input.artifactId) {
      state.reasons.add('evidence-reference-invalid');
      return resultFromState(state);
    }

    const sourceArtifact = artifactById(fixture, index.sourceInputArtifactId);
    if (sourceArtifact?.artifactKind !== 'input') {
      state.reasons.add('evidence-reference-invalid');
      return resultFromState(state);
    }
    const source = await readManifestBoundFaceComplexArtifactJsonV1(fixtureRoot, sourceArtifact);
    if (!source.ok) {
      if (source.kind === 'hash') state.reasons.add('artifact-hash-changed');
      else
        state.reasons.add(
          source.kind === 'read' ? 'source-input-unreadable' : 'source-input-invalid-json',
        );
      return resultFromState(state);
    }
    const adapted = adaptFoldDocumentToFaceReconstructionInputV1(source.value);
    if (!adapted.ok) {
      state.reasons.add('source-fold-unsupported');
      return resultFromState(state);
    }

    const reconstructionRecord = await loadExperimentRecord(
      fixtureRoot,
      fixture,
      index.reconstructionExperimentArtifactId,
      FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
      FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
      'reconstruction',
      state,
    );
    const auditRecord = await loadExperimentRecord(
      fixtureRoot,
      fixture,
      index.auditExperimentArtifactId,
      FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
      FACE_COMPLEX_AUDIT_ENGINE_VERSION,
      'audit',
      state,
    );
    if (reconstructionRecord === undefined || auditRecord === undefined) {
      return resultFromState(state);
    }

    const reconstructionRerun = await runCandidateExperimentV1({
      experimentId: FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
      engineVersion: FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
      parameters: FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1,
      input: adapted.value,
      seed: reconstructionRecord.seed,
      repetition: reconstructionRecord.repetition,
    });
    if (reconstructionRerun.outcome !== 'completed' || reconstructionRerun.result === null) {
      state.reasons.add('reconstruction-rerun-failed');
      return resultFromState(state);
    }
    if (reconstructionRerun.semanticHash !== reconstructionRecord.semanticHash) {
      state.reasons.add('reconstruction-evidence-mismatch');
    } else {
      state.reconstructionRerunMatched = true;
    }

    const auditInput = prepareFaceComplexAuditInputV1(adapted.value, reconstructionRerun.result);
    if (!auditInput.ok) {
      state.reasons.add('audit-input-preparation-failed');
      return resultFromState(state);
    }
    const auditRerun = await runCandidateExperimentV1({
      experimentId: FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
      engineVersion: FACE_COMPLEX_AUDIT_ENGINE_VERSION,
      parameters: FACE_COMPLEX_AUDIT_PARAMETERS_V1,
      input: auditInput.value,
      seed: auditRecord.seed,
      repetition: auditRecord.repetition,
    });
    if (auditRerun.outcome !== 'completed') {
      state.reasons.add('audit-rerun-failed');
      return resultFromState(state);
    }
    if (auditRerun.semanticHash !== auditRecord.semanticHash) {
      state.reasons.add('audit-evidence-mismatch');
    } else {
      state.auditRerunMatched = true;
    }

    const auditEvidenceDocument = await loadRegisteredEvidenceJson(
      fixtureRoot,
      fixture,
      index.auditEvidenceArtifactId,
      'audit-evidence-unreadable',
      'audit-evidence-invalid',
      state,
    );
    if (auditEvidenceDocument.ok) {
      const parsedEvidence = await parseFaceComplexAuditEvidenceV1(auditEvidenceDocument.value);
      if (!parsedEvidence.ok) {
        state.reasons.add('audit-evidence-invalid');
      } else {
        state.auditEvidencePresentAndValid = true;
        if (
          stableStringify(parsedEvidence.value.auditInput) !== stableStringify(auditInput.value)
        ) {
          state.reasons.add('audit-evidence-source-mismatch');
        }
        const reaudited = await reauditFaceComplexAuditEvidenceV1(auditEvidenceDocument.value);
        if (!reaudited.ok) {
          state.reasons.add('audit-evidence-reaudit-failed');
        } else {
          state.auditEvidenceReauditMatched = true;
        }
      }
    }

    const mutationSuiteDocument = await loadRegisteredEvidenceJson(
      fixtureRoot,
      fixture,
      index.mutationSuiteArtifactId,
      'mutation-suite-unreadable',
      'mutation-suite-invalid',
      state,
    );
    const mutationResultDocument = await loadRegisteredEvidenceJson(
      fixtureRoot,
      fixture,
      index.mutationResultArtifactId,
      'mutation-result-unreadable',
      'mutation-result-invalid',
      state,
    );
    let savedMutationResult: FaceComplexMutationSuiteConsistentV1 | undefined;
    if (mutationResultDocument.ok) {
      const parsedMutationResult = parseFaceComplexMutationSuiteResultV1(
        mutationResultDocument.value,
      );
      if (!parsedMutationResult.ok) {
        state.reasons.add('mutation-result-invalid');
      } else {
        savedMutationResult = parsedMutationResult.value;
        state.mutationResultPresentAndValid = true;
      }
    }
    if (mutationSuiteDocument.ok) {
      const parsedSuite = parseFaceComplexMutationSuiteV1(mutationSuiteDocument.value);
      if (!parsedSuite.ok) {
        state.reasons.add('mutation-suite-invalid');
      } else if (
        stableStringify(parsedSuite.value) !== stableStringify(FACE_COMPLEX_MUTATION_SUITE_V1)
      ) {
        state.reasons.add('mutation-suite-noncanonical');
      } else {
        state.mutationSuitePresentAndValid = true;
        const mutationRerun = runFaceComplexMutationSuiteV1(auditInput.value, parsedSuite.value);
        if (!mutationRerun.ok) {
          state.reasons.add('mutation-suite-rerun-failed');
        } else {
          const parsedMutationRerun = parseFaceComplexMutationSuiteResultV1(mutationRerun.value);
          if (!parsedMutationRerun.ok) {
            state.reasons.add('mutation-suite-rerun-failed');
          } else if (savedMutationResult === undefined) {
            // The loader already recorded the precise missing/invalid artifact reason.
          } else if (
            stableStringify(parsedMutationRerun.value) !== stableStringify(savedMutationResult)
          ) {
            state.reasons.add('mutation-evidence-mismatch');
          } else {
            state.mutationSuiteRerunMatched = true;
          }
        }
      }
    }
    return resultFromState(state);
  } catch {
    state.reasons.add('unexpected-failure');
    return resultFromState(state);
  }
}
