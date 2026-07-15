import type {
  PolygonRiverPackingProblemWorkerFactoryV1,
  PolygonRiverPackingProblemWorkerLikeV1,
} from './run-polygon-river-packing-problem-worker.js';

/** Vite-compatible same-origin module-worker factory for the M0F problem builder. */
export const createBrowserPolygonRiverPackingProblemWorkerV1: PolygonRiverPackingProblemWorkerFactoryV1 =
  (): PolygonRiverPackingProblemWorkerLikeV1 =>
    new Worker(
      new URL('../../src/workers/polygon-river-packing-problem.worker.ts', import.meta.url),
      {
        type: 'module',
        name: 'oridesign-m0f-polygon-river-packing-problem-v1',
      },
    ) as unknown as PolygonRiverPackingProblemWorkerLikeV1;
