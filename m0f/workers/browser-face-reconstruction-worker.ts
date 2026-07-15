import type {
  FaceReconstructionWorkerFactoryV1,
  FaceReconstructionWorkerLikeV1,
} from './run-face-reconstruction-worker.js';

/** Vite-compatible same-origin module-worker factory for the M0F candidate client. */
export const createBrowserFaceReconstructionWorkerV1: FaceReconstructionWorkerFactoryV1 =
  (): FaceReconstructionWorkerLikeV1 =>
    new Worker(new URL('./face-reconstruction.worker.ts', import.meta.url), {
      type: 'module',
      name: 'oridesign-m0f-face-reconstruction-v1',
    }) as unknown as FaceReconstructionWorkerLikeV1;
