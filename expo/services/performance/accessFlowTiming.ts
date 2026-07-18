type TimingDetails = Record<string, string | number | boolean | null>;

const ENABLE_ACCESS_FLOW_TIMING = __DEV__;

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

export function createAccessFlowTimer(flow: string) {
  const startedAt = nowMs();

  return {
    mark(step: string, details?: TimingDetails): void {
      if (!ENABLE_ACCESS_FLOW_TIMING) return;
      console.log('[AccessFlowTiming]', {
        flow,
        step,
        elapsedMs: Math.round(nowMs() - startedAt),
        ...(details ?? {}),
      });
    },
  };
}
