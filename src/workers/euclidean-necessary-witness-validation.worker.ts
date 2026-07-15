import { executeEuclideanNecessaryWitnessValidationWorkerMessageV1 } from '../../m0f/workers/euclidean-necessary-witness-validation-worker-handler.js';
import type { EuclideanNecessaryWitnessValidationWorkerResponseV1 } from '../../m0f/workers/euclidean-necessary-witness-validation-worker-protocol.js';

interface Scope {
  addEventListener(type: 'message', listener: (event: Readonly<{ data: unknown }>) => void): void;
  postMessage(message: EuclideanNecessaryWitnessValidationWorkerResponseV1): void;
}
const scope = globalThis as unknown as Scope;
let consumed = false;
scope.addEventListener('message', (event) => {
  if (consumed) return;
  consumed = true;
  const response = executeEuclideanNecessaryWitnessValidationWorkerMessageV1(event.data);
  if (response !== undefined) scope.postMessage(response);
});
