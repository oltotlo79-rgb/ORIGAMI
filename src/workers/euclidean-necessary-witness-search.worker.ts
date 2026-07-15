import { executeEuclideanNecessaryWitnessSearchWorkerMessageV1 } from '../../m0f/workers/euclidean-necessary-witness-search-worker-handler.js';
import type { EuclideanNecessaryWitnessSearchWorkerResponseV1 } from '../../m0f/workers/euclidean-necessary-witness-search-worker-protocol.js';

interface Scope {
  addEventListener(type: 'message', listener: (event: Readonly<{ data: unknown }>) => void): void;
  postMessage(message: EuclideanNecessaryWitnessSearchWorkerResponseV1): void;
}
const scope = globalThis as unknown as Scope;
let consumed = false;
scope.addEventListener('message', (event) => {
  if (consumed) return;
  consumed = true;
  const response = executeEuclideanNecessaryWitnessSearchWorkerMessageV1(event.data);
  if (response !== undefined) scope.postMessage(response);
});
