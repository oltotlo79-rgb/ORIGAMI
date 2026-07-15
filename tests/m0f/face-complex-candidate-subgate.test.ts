import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE,
  type FaceComplexCandidateEvidenceIndexV1,
} from '../../m0f/face-complex-candidate-evidence.js';
import {
  evaluateFaceComplexCandidateSubgateV1,
  readManifestBoundFaceComplexArtifactJsonV1,
} from '../../m0f/face-complex-candidate-subgate.js';
import {
  FACE_COMPLEX_AUDIT_ENGINE_VERSION,
  FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
  FACE_COMPLEX_AUDIT_PARAMETERS_V1,
} from '../../m0f/experiments/face-complex-audit.js';
import {
  FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
  FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
  FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1,
} from '../../m0f/experiments/face-reconstruction.js';
import { runCandidateExperimentV1 } from '../../m0f/experiments/runner.js';
import { adaptFoldDocumentToFaceReconstructionInputV1 } from '../../m0f/geometry/fold-document-face-adapter.js';
import { prepareFaceComplexAuditInputV1 } from '../../m0f/geometry/prepare-face-complex-audit-input.js';
import { sha256Prefixed } from '../../m0f/manifest.js';
import { createFaceComplexAuditEvidenceV1 } from '../../m0f/reference-verifier/face-complex-evidence.js';
import {
  FACE_COMPLEX_MUTATION_SUITE_V1,
  runFaceComplexMutationSuiteV1,
} from '../../m0f/reference-verifier/face-complex-mutation-suite.js';
import { stableStringify } from '../../m0f/stable-json.js';

const FIXTURE_ID = 'REF-FOLD-NOFACES';

function foldSource(maximumX = 3): Record<string, unknown> {
  return {
    file_spec: 1.2,
    frame_classes: ['creasePattern'],
    frame_attributes: ['2D'],
    vertices_coords: [
      [0, 0],
      [maximumX, 0],
      [maximumX, 1],
      [1, 1],
      [1, 3],
      [0, 3],
    ],
    edges_vertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
    edges_assignment: ['B', 'B', 'B', 'B', 'B', 'B'],
  };
}

type FileRecord = Readonly<{
  artifactId: string;
  artifactKind: 'input' | 'readme' | 'known-artifact';
  filename: string;
  text: string;
}>;

async function createFixtureRepository(
  useDifferentRegisteredSource = false,
  tamperMutationResult = false,
): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'oridesign-face-subgate-'));
  const fixtureDirectory = join(root, FIXTURE_ID);
  await mkdir(fixtureDirectory);

  const evidenceSource = foldSource();
  const adapted = adaptFoldDocumentToFaceReconstructionInputV1(evidenceSource);
  if (!adapted.ok) throw new Error('test source must adapt');
  const reconstructionRecord = await runCandidateExperimentV1({
    experimentId: FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID,
    engineVersion: FOLD_FACE_RECONSTRUCTION_ENGINE_VERSION,
    parameters: FOLD_FACE_RECONSTRUCTION_PARAMETERS_V1,
    input: adapted.value,
    seed: 41,
    repetition: 0,
  });
  if (reconstructionRecord.outcome !== 'completed' || reconstructionRecord.result === null) {
    throw new Error('test reconstruction must complete');
  }
  const prepared = prepareFaceComplexAuditInputV1(adapted.value, reconstructionRecord.result);
  if (!prepared.ok) throw new Error('test audit input must prepare');
  const auditRecord = await runCandidateExperimentV1({
    experimentId: FACE_COMPLEX_AUDIT_EXPERIMENT_ID,
    engineVersion: FACE_COMPLEX_AUDIT_ENGINE_VERSION,
    parameters: FACE_COMPLEX_AUDIT_PARAMETERS_V1,
    input: prepared.value,
    seed: 42,
    repetition: 0,
  });
  if (auditRecord.outcome !== 'completed') throw new Error('test audit must complete');
  const auditEvidence = await createFaceComplexAuditEvidenceV1(prepared.value);
  if (!auditEvidence.ok) throw new Error('test audit evidence must be created');
  const mutationResult = runFaceComplexMutationSuiteV1(
    prepared.value,
    FACE_COMPLEX_MUTATION_SUITE_V1,
  );
  if (!mutationResult.ok) {
    throw new Error(`test mutation suite must complete: ${JSON.stringify(mutationResult.error)}`);
  }
  const persistedMutationResult = tamperMutationResult
    ? { ...mutationResult.value, scientificClaim: true }
    : mutationResult.value;

  const index: FaceComplexCandidateEvidenceIndexV1 = {
    schemaVersion: 1,
    recordType: FACE_COMPLEX_CANDIDATE_EVIDENCE_INDEX_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    scope: 'face-reconstruction-and-audit-only',
    fixtureId: FIXTURE_ID,
    manifestExpectedOutcomePolicy: 'observed-only-not-stage-evidence',
    sourceInputArtifactId: 'fold-source',
    reconstructionExperimentArtifactId: 'face-reconstruction-record',
    auditExperimentArtifactId: 'face-audit-record',
    auditEvidenceArtifactId: 'face-audit-evidence',
    mutationSuiteArtifactId: 'face-mutation-suite',
    mutationResultArtifactId: 'face-mutation-result',
  };
  const registeredSource = useDifferentRegisteredSource ? foldSource(4) : evidenceSource;
  const files: FileRecord[] = [
    {
      artifactId: 'fold-source',
      artifactKind: 'input',
      filename: 'input.fold',
      text: `${stableStringify(registeredSource)}\n`,
    },
    {
      artifactId: 'fixture-readme',
      artifactKind: 'readme',
      filename: 'README.md',
      text: '# REF-FOLD-NOFACES\n\nProject-authored candidate gate fixture.\n',
    },
    {
      artifactId: 'face-evidence-index',
      artifactKind: 'known-artifact',
      filename: 'face-evidence-index.json',
      text: `${stableStringify(index)}\n`,
    },
    {
      artifactId: 'face-reconstruction-record',
      artifactKind: 'known-artifact',
      filename: 'face-reconstruction-record.json',
      text: `${stableStringify(reconstructionRecord)}\n`,
    },
    {
      artifactId: 'face-audit-record',
      artifactKind: 'known-artifact',
      filename: 'face-audit-record.json',
      text: `${stableStringify(auditRecord)}\n`,
    },
    {
      artifactId: 'face-audit-evidence',
      artifactKind: 'known-artifact',
      filename: 'face-audit-evidence.json',
      text: `${stableStringify(auditEvidence.value)}\n`,
    },
    {
      artifactId: 'face-mutation-suite',
      artifactKind: 'known-artifact',
      filename: 'face-mutation-suite.json',
      text: `${stableStringify(FACE_COMPLEX_MUTATION_SUITE_V1)}\n`,
    },
    {
      artifactId: 'face-mutation-result',
      artifactKind: 'known-artifact',
      filename: 'face-mutation-result.json',
      text: `${stableStringify(persistedMutationResult)}\n`,
    },
  ];
  for (const file of files) await writeFile(join(fixtureDirectory, file.filename), file.text);

  const manifest = {
    schemaVersion: 2,
    fixtureSetId: 'face-subgate-test-v1',
    completeness: 'harness',
    fixtures: [
      {
        id: FIXTURE_ID,
        title: 'FOLD NOFACES candidate stage fixture',
        purpose: 'Exercise exact face reconstruction and the separate face-complex audit.',
        workflow: 'fold-verification',
        polarity: 'positive',
        leafCount: null,
        coverageTags: ['fold:face-reconstruction', 'cp:topology'],
        input: {
          artifactId: 'fold-source',
          normalizedSha256: sha256Prefixed(stableStringify(registeredSource)),
        },
        readme: { artifactId: 'fixture-readme' },
        expectedOutcome: {
          kind: 'verified',
          checks: ['future-full-reference-verifier'],
        },
        sourceReferences: [
          {
            sourceId: 'oridesign-face-subgate-test',
            sourceKind: 'project-authored',
            title: 'OriDesign candidate face subgate test fixture',
            authors: ['OriDesign contributors'],
            rights: { redistribution: 'allowed', licenseSpdx: 'MIT' },
          },
        ],
        distributedArtifacts: files.map((file) => ({
          artifactId: file.artifactId,
          artifactKind: file.artifactKind,
          path: `${FIXTURE_ID}/${file.filename}`,
          sha256: sha256Prefixed(file.text),
          licenseSpdx: 'MIT',
          sourceReferenceId: 'oridesign-face-subgate-test',
          sourceUse: 'project-authored',
        })),
        randomness: null,
        toleranceProfileId: 'exact-rational-v1',
        knownArtifacts: [
          { kind: 'evidence-blob', artifactId: 'face-evidence-index' },
          { kind: 'evidence-blob', artifactId: 'face-reconstruction-record' },
          { kind: 'evidence-blob', artifactId: 'face-audit-record' },
          { kind: 'evidence-blob', artifactId: 'face-audit-evidence' },
          { kind: 'evidence-blob', artifactId: 'face-mutation-suite' },
          { kind: 'evidence-blob', artifactId: 'face-mutation-result' },
        ],
      },
    ],
  };
  const manifestPath = join(root, 'manifest.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
}

describe('REF-FOLD-NOFACES candidate subgate', () => {
  it('rejects bytes changed after the manifest-bound artifact hash was captured', async () => {
    const root = await mkdtemp(join(tmpdir(), 'oridesign-face-subgate-hash-'));
    const expectedText = '{"recordType":"expected"}\n';
    try {
      await writeFile(join(root, 'evidence.json'), '{"recordType":"replaced"}\n');
      const loaded = await readManifestBoundFaceComplexArtifactJsonV1(root, {
        artifactId: 'evidence',
        artifactKind: 'known-artifact',
        path: 'evidence.json',
        sha256: sha256Prefixed(expectedText),
        licenseSpdx: 'MIT',
        sourceReferenceId: 'test-source',
        sourceUse: 'project-authored',
      });
      expect(loaded).toEqual({ ok: false, kind: 'hash' });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('captures the manifest hash before asynchronous file access', async () => {
    const root = await mkdtemp(join(tmpdir(), 'oridesign-face-subgate-binding-'));
    const text = '{"recordType":"expected"}\n';
    const artifact = {
      artifactId: 'evidence',
      artifactKind: 'known-artifact' as const,
      path: 'evidence.json',
      sha256: `sha256:${'0'.repeat(64)}`,
      licenseSpdx: 'MIT' as const,
      sourceReferenceId: 'test-source',
      sourceUse: 'project-authored' as const,
    };
    try {
      await writeFile(join(root, artifact.path), text);
      const pending = readManifestBoundFaceComplexArtifactJsonV1(root, artifact);
      artifact.sha256 = sha256Prefixed(text);
      await expect(pending).resolves.toEqual({ ok: false, kind: 'hash' });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not consume path escapes or linked directories even when outside bytes match the hash', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'oridesign-face-subgate-path-'));
    const root = join(parent, 'fixture-root');
    const outside = join(parent, 'outside');
    const text = '{"recordType":"outside"}\n';
    const artifact = {
      artifactId: 'evidence',
      artifactKind: 'known-artifact' as const,
      path: '../outside/evidence.json',
      sha256: sha256Prefixed(text),
      licenseSpdx: 'MIT' as const,
      sourceReferenceId: 'test-source',
      sourceUse: 'project-authored' as const,
    };
    try {
      await mkdir(root);
      await mkdir(outside);
      await writeFile(join(outside, 'evidence.json'), text);

      await expect(readManifestBoundFaceComplexArtifactJsonV1(root, artifact)).resolves.toEqual({
        ok: false,
        kind: 'read',
      });

      const linkedDirectory = join(root, 'linked');
      await symlink(outside, linkedDirectory, process.platform === 'win32' ? 'junction' : 'dir');
      await expect(
        readManifestBoundFaceComplexArtifactJsonV1(root, {
          ...artifact,
          path: 'linked/evidence.json',
        }),
      ).resolves.toEqual({ ok: false, kind: 'read' });
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  });

  it('fails closed when the canonical fixture is not registered', async () => {
    const result = await evaluateFaceComplexCandidateSubgateV1('tests/fixtures/manifest.json');
    expect(result).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      globalM0fGate: 'not-evaluated',
      passed: false,
      reasonCodes: ['fixture-missing'],
      manifest: {
        repositoryValid: true,
        fixturePresent: false,
        expectedOutcomeUsedAsEvidence: false,
      },
    });
  });

  it('passes only after both saved candidate records reproduce from the registered source', async () => {
    const manifestPath = await createFixtureRepository();
    try {
      const result = await evaluateFaceComplexCandidateSubgateV1(manifestPath);
      expect(result).toMatchObject({
        outcome: 'candidate-stage-ready',
        passed: true,
        reasonCodes: [],
        manifest: {
          repositoryValid: true,
          fixturePresent: true,
          fixtureContractValid: true,
          expectedOutcomeObserved: 'verified',
          expectedOutcomeUsedAsEvidence: false,
        },
        evidence: {
          indexPresentAndValid: true,
          reconstructionRecordPresentAndValid: true,
          auditRecordPresentAndValid: true,
          reconstructionRerunMatched: true,
          auditRerunMatched: true,
          auditEvidencePresentAndValid: true,
          auditEvidenceReauditMatched: true,
          mutationSuitePresentAndValid: true,
          mutationResultPresentAndValid: true,
          mutationSuiteRerunMatched: true,
        },
      });
      expect(Object.isFrozen(result)).toBe(true);
    } finally {
      await rm(join(manifestPath, '..'), { recursive: true, force: true });
    }
  });

  it('rejects internally valid evidence records that belong to different source geometry', async () => {
    const manifestPath = await createFixtureRepository(true);
    try {
      const result = await evaluateFaceComplexCandidateSubgateV1(manifestPath);
      expect(result.passed).toBe(false);
      expect(result.reasonCodes).toEqual([
        'reconstruction-evidence-mismatch',
        'audit-evidence-mismatch',
        'audit-evidence-source-mismatch',
      ]);
      expect(result.evidence.reconstructionRecordPresentAndValid).toBe(true);
      expect(result.evidence.auditRecordPresentAndValid).toBe(true);
    } finally {
      await rm(join(manifestPath, '..'), { recursive: true, force: true });
    }
  });

  it('rejects a claim-escalated saved mutation result before comparing the rerun', async () => {
    const manifestPath = await createFixtureRepository(false, true);
    try {
      const result = await evaluateFaceComplexCandidateSubgateV1(manifestPath);
      expect(result.passed).toBe(false);
      expect(result.reasonCodes).toEqual(['mutation-result-invalid']);
      expect(result.evidence.mutationResultPresentAndValid).toBe(false);
      expect(result.evidence.mutationSuiteRerunMatched).toBe(false);
    } finally {
      await rm(join(manifestPath, '..'), { recursive: true, force: true });
    }
  });
});
