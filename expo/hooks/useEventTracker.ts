import { useCallback, useRef, useEffect } from 'react';
import { useAnalytics } from '@/providers/AnalyticsProvider';

type EventProperties = Record<string, string | number | boolean>;

export function useEventTracker(screenName?: string) {
  const { trackEvent, trackScreen } = useAnalytics();
  const screenTracked = useRef(false);
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    if (screenName && !screenTracked.current) {
      screenTracked.current = true;
      sessionStart.current = Date.now();
      trackScreen(screenName);
    }
  }, [screenName, trackScreen]);

  const track = useCallback(
    (eventName: string, properties?: EventProperties) => {
      trackEvent(eventName, {
        ...(screenName ? { screen: screenName } : {}),
        ...properties,
      });
    },
    [trackEvent, screenName],
  );

  const trackWithDuration = useCallback(
    (eventName: string, properties?: EventProperties) => {
      const durationMs = Date.now() - sessionStart.current;
      trackEvent(eventName, {
        ...(screenName ? { screen: screenName } : {}),
        duration_ms: durationMs,
        ...properties,
      });
    },
    [trackEvent, screenName],
  );

  const trackTap = useCallback(
    (element: string, properties?: EventProperties) => {
      trackEvent('tap', {
        ...(screenName ? { screen: screenName } : {}),
        element,
        ...properties,
      });
    },
    [trackEvent, screenName],
  );

  return {
    track,
    trackWithDuration,
    trackTap,
    trackEvent,
    trackScreen,
  };
}

export function useTimedEvent(eventName: string, screenName?: string) {
  const { trackEvent } = useAnalytics();
  const startTime = useRef<number | null>(null);

  const start = useCallback(() => {
    startTime.current = Date.now();
    console.log(`[TimedEvent] Started: ${eventName}`);
  }, [eventName]);

  const stop = useCallback(
    (properties?: EventProperties) => {
      if (startTime.current === null) return;
      const durationMs = Date.now() - startTime.current;
      trackEvent(eventName, {
        ...(screenName ? { screen: screenName } : {}),
        duration_ms: durationMs,
        ...properties,
      });
      startTime.current = null;
      console.log(`[TimedEvent] Completed: ${eventName} (${durationMs}ms)`);
    },
    [eventName, screenName, trackEvent],
  );

  return { start, stop };
}
