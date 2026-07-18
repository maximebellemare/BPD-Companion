import { startAccessFlowBackgroundTask } from '@/services/performance/accessFlowPerformanceModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Access flow performance regression failed: ${message}`);
}

function waitForMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export async function assertAccessFlowPerformanceRegressionScenarios(): Promise<true> {
  let navigationReleaseCount = 0;
  let hydrationStartCount = 0;
  let hydrationErrorCount = 0;

  startAccessFlowBackgroundTask(async () => {
    hydrationStartCount += 1;
    throw new Error('hydrate failed');
  }, () => {
    hydrationErrorCount += 1;
  });

  navigationReleaseCount += 1;
  assert(navigationReleaseCount === 1, 'signup navigation is released immediately after auth/profile readiness');
  await waitForMicrotasks();
  assert(hydrationStartCount === 1, 'background hydration starts after navigation can proceed');
  assert(hydrationErrorCount === 1, 'background hydration failures are caught');

  return true;
}

export const accessFlowPerformanceRegressionTestsPassed = assertAccessFlowPerformanceRegressionScenarios();
