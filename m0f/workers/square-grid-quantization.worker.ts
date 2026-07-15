import { executeSquareGridQuantizationWorkerMessageV1 } from './square-grid-quantization-worker-handler.js';
import type { CandidateSquareGridQuantizationWorkerResponseV1 } from './square-grid-quantization-protocol.js';

interface SquareGridQuantizationWorkerScope {
  addEventListener: (
    type: 'message',
    listener: (event: Readonly<{ data: unknown }>) => void,
  ) => void;
  postMessage: (message: CandidateSquareGridQuantizationWorkerResponseV1) => void;
}

const workerScope = globalThis as unknown as SquareGridQuantizationWorkerScope;
let hasConsumedMessage = false;

workerScope.addEventListener('message', (event) => {
  if (hasConsumedMessage) return;
  hasConsumedMessage = true;
  const response = executeSquareGridQuantizationWorkerMessageV1(event.data);
  if (response !== undefined) workerScope.postMessage(response);
});
