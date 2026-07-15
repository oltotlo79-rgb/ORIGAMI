import type {
  AffineOriginRotationSweptAabbCensusWorkerFactoryV1,
  AffineOriginRotationSweptAabbCensusWorkerLikeV1,
} from './affine-origin-rotation-swept-aabb-census-worker-runner.js';

/** Vite-compatible same-origin module Worker factory for one bounded census. */
export const createBrowserAffineOriginRotationSweptAabbCensusWorkerV1: AffineOriginRotationSweptAabbCensusWorkerFactoryV1 =
  (): AffineOriginRotationSweptAabbCensusWorkerLikeV1 =>
    new Worker(
      new URL(
        '../../src/workers/affine-origin-rotation-swept-aabb-census.worker.ts',
        import.meta.url,
      ),
      {
        type: 'module',
        name: 'oridesign-m0f-affine-origin-rotation-swept-aabb-census-v1',
      },
    ) as unknown as AffineOriginRotationSweptAabbCensusWorkerLikeV1;
