import { executeFoldDocumentFaceReconstructionWorkerMessageV1 } from './fold-document-face-reconstruction-worker-handler.js';
import type { CandidateFoldFaceReconstructionWorkerResponseV1 } from './face-reconstruction-protocol.js';

interface WorkerScopeV1 {
  addEventListener(type: 'message', listener: (event: Readonly<{ data: unknown }>) => void): void;
  postMessage(message: CandidateFoldFaceReconstructionWorkerResponseV1): void;
}

const workerScope = globalThis as unknown as WorkerScopeV1;
let consumed = false;
workerScope.addEventListener('message', (event) => {
  if (consumed) return;
  consumed = true;
  const response = executeFoldDocumentFaceReconstructionWorkerMessageV1(event.data);
  if (response !== undefined) workerScope.postMessage(response);
});
