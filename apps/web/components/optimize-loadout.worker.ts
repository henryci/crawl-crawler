/**
 * Web Worker for the loadout optimizer.
 *
 * The optimizer's brute-force search can run for several seconds on
 * late-game inventories. Running it on the main thread freezes React
 * (including the "Optimizing..." spinner that's supposed to indicate
 * the work is happening). This worker moves that compute off-thread so
 * the UI stays responsive.
 *
 * Each request carries a monotonically increasing `requestId`; the UI
 * uses it to ignore stale results when the user clicks Optimize again
 * before the previous run finishes.
 */

import { optimize, type OptimizerInputs, type OptimizerResult } from "dcss-loadout-optimizer";

export interface OptimizeRequest {
  requestId: number;
  inputs: OptimizerInputs;
}

export interface OptimizeResponse {
  requestId: number;
  result: OptimizerResult;
  elapsedMs: number;
}

self.addEventListener("message", (event: MessageEvent<OptimizeRequest>) => {
  const { requestId, inputs } = event.data;
  const start = performance.now();
  const result = optimize(inputs);
  const elapsedMs = performance.now() - start;
  const response: OptimizeResponse = { requestId, result, elapsedMs };
  (self as unknown as Worker).postMessage(response);
});
