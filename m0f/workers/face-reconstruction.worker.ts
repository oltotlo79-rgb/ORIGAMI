import { executeFaceReconstructionWorkerMessageV1 } from './face-reconstruction-worker-handler.js';
import type { CandidateFoldFaceReconstructionWorkerResponseV1 } from './face-reconstruction-protocol.js';

interface FaceReconstructionWorkerScope {
  addEventListener: (
    type: 'message',
    listener: (event: Readonly<{ data: unknown }>) => void,
  ) => void;
  postMessage: (message: CandidateFoldFaceReconstructionWorkerResponseV1) => void;
}

const workerScope = globalThis as unknown as FaceReconstructionWorkerScope;
let hasConsumedMessage = false;

workerScope.addEventListener('message', (event) => {
  if (hasConsumedMessage) return;
  hasConsumedMessage = true;
  const response = executeFaceReconstructionWorkerMessageV1(event.data);
  if (response !== undefined) workerScope.postMessage(response);
});
