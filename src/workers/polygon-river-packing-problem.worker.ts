import { executePolygonRiverPackingProblemWorkerMessageV1 } from '../../m0f/workers/polygon-river-packing-problem-worker-handler.js';
import type { CandidatePolygonRiverPackingProblemWorkerResponseV1 } from '../../m0f/workers/polygon-river-packing-problem-protocol.js';

interface PolygonRiverPackingProblemWorkerScope {
  addEventListener: (
    type: 'message',
    listener: (event: Readonly<{ data: unknown }>) => void,
  ) => void;
  postMessage: (message: CandidatePolygonRiverPackingProblemWorkerResponseV1) => void;
}

const workerScope = globalThis as unknown as PolygonRiverPackingProblemWorkerScope;
let hasConsumedMessage = false;

workerScope.addEventListener('message', (event) => {
  if (hasConsumedMessage) return;
  hasConsumedMessage = true;
  const response = executePolygonRiverPackingProblemWorkerMessageV1(event.data);
  if (response !== undefined) workerScope.postMessage(response);
});
