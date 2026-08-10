/**
 * Web Worker for the loadout optimizer.
 *
 * The optimizer's brute-force search can run for several seconds on
 * late-game inventories. Running it on the main thread freezes React
 * (including the "Optimizing..." spinner that's supposed to indicate
 * the work is happening). This worker moves that compute off-thread so
 * the UI stays responsive.
 *
 * Two request kinds share the worker:
 *   - "optimize": find the single best loadout for an objective.
 *   - "frontier": map the Pareto frontier of achievable stat
 *     combinations for the Stat Explorer view.
 *
 * Each request carries a monotonically increasing `requestId`; the UI
 * uses it to ignore stale results when a newer request of the same
 * kind is issued before the previous run finishes.
 */

import {
  computeFrontier,
  optimize,
  type FrontierInputs,
  type FrontierResult,
  type OptimizerInputs,
  type OptimizerResult,
} from "dcss-loadout-optimizer";

export type WorkerRequest =
  | { kind: "optimize"; requestId: number; inputs: OptimizerInputs }
  | { kind: "frontier"; requestId: number; inputs: FrontierInputs };

export type WorkerResponse =
  | {
      kind: "optimize";
      requestId: number;
      result: OptimizerResult;
      elapsedMs: number;
    }
  | {
      kind: "frontier";
      requestId: number;
      result: FrontierResult;
      elapsedMs: number;
    };

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  const start = performance.now();
  let response: WorkerResponse;
  if (request.kind === "frontier") {
    const result = computeFrontier(request.inputs);
    response = {
      kind: "frontier",
      requestId: request.requestId,
      result,
      elapsedMs: performance.now() - start,
    };
  } else {
    const result = optimize(request.inputs);
    response = {
      kind: "optimize",
      requestId: request.requestId,
      result,
      elapsedMs: performance.now() - start,
    };
  }
  (self as unknown as Worker).postMessage(response);
});
