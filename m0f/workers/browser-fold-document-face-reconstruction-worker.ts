import type {
  FaceReconstructionWorkerFactoryV1,
  FaceReconstructionWorkerLikeV1,
} from './run-face-reconstruction-worker.js';

/** Vite-compatible same-origin module Worker for transferred FOLD JSON bytes. */
export const createBrowserFoldDocumentFaceReconstructionWorkerV1: FaceReconstructionWorkerFactoryV1 =
  (): FaceReconstructionWorkerLikeV1 =>
    new Worker(new URL('./fold-document-face-reconstruction.worker.ts', import.meta.url), {
      type: 'module',
      name: 'oridesign-m0f-fold-document-face-reconstruction-v1',
    }) as unknown as FaceReconstructionWorkerLikeV1;
