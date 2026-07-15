import type {
  SquareGridQuantizationWorkerFactoryV1,
  SquareGridQuantizationWorkerLikeV1,
} from './run-square-grid-quantization-worker.js';

/** Vite-compatible same-origin module-worker factory for M0F-2 quantization. */
export const createBrowserSquareGridQuantizationWorkerV1: SquareGridQuantizationWorkerFactoryV1 =
  (): SquareGridQuantizationWorkerLikeV1 =>
    new Worker(new URL('./square-grid-quantization.worker.ts', import.meta.url), {
      type: 'module',
      name: 'oridesign-m0f-square-grid-quantization-v1',
    }) as unknown as SquareGridQuantizationWorkerLikeV1;
