import { createAffineOriginRotationSweptAabbCensusWorkerMessageHandlerV1 } from '../../m0f/workers/affine-origin-rotation-swept-aabb-census-worker-handler.js';
import type { AffineOriginRotationSweptAabbCensusWorkerResponseV1 } from '../../m0f/workers/affine-origin-rotation-swept-aabb-census-worker-protocol.js';

interface AffineOriginRotationSweptAabbCensusWorkerScope {
  addEventListener: (
    type: 'message',
    listener: (event: Readonly<{ data: unknown }>) => void,
  ) => void;
  postMessage: (message: AffineOriginRotationSweptAabbCensusWorkerResponseV1) => void;
}

const workerScope = globalThis as unknown as AffineOriginRotationSweptAabbCensusWorkerScope;
workerScope.addEventListener(
  'message',
  createAffineOriginRotationSweptAabbCensusWorkerMessageHandlerV1((response) => {
    workerScope.postMessage(response);
  }),
);
