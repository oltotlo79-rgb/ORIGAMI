import type {
  EuclideanNecessaryWitnessWorkerFactoryV1,
  EuclideanNecessaryWitnessWorkerLikeV1,
} from './run-euclidean-necessary-witness-search-worker.js';

export const createBrowserEuclideanNecessaryWitnessSearchWorkerV1: EuclideanNecessaryWitnessWorkerFactoryV1 =
  (): EuclideanNecessaryWitnessWorkerLikeV1 =>
    new Worker(
      new URL('../../src/workers/euclidean-necessary-witness-search.worker.ts', import.meta.url),
      { type: 'module', name: 'oridesign-m0f-euclidean-necessary-witness-search-v1' },
    ) as unknown as EuclideanNecessaryWitnessWorkerLikeV1;

export const createBrowserEuclideanNecessaryWitnessValidationWorkerV1: EuclideanNecessaryWitnessWorkerFactoryV1 =
  (): EuclideanNecessaryWitnessWorkerLikeV1 =>
    new Worker(
      new URL(
        '../../src/workers/euclidean-necessary-witness-validation.worker.ts',
        import.meta.url,
      ),
      { type: 'module', name: 'oridesign-m0f-euclidean-necessary-witness-validation-v1' },
    ) as unknown as EuclideanNecessaryWitnessWorkerLikeV1;
