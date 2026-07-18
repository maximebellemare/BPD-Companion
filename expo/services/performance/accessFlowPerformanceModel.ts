export type BackgroundTaskErrorHandler = (error: unknown) => void;

export function startAccessFlowBackgroundTask(
  task: () => Promise<void>,
  onError?: BackgroundTaskErrorHandler,
): void {
  void Promise.resolve()
    .then(task)
    .catch((error) => {
      onError?.(error);
    });
}
