import {
  GOOGLE_PLAY_SUBSCRIPTIONS_URL,
  IOS_SUBSCRIPTIONS_APP_URL,
  IOS_SUBSCRIPTIONS_WEB_URL,
  createSingleFlightRunner,
  getSubscriptionManagementUrl,
  normalizeAndroidSubscriptionSku,
  openSubscriptionManagement,
} from '@/services/subscription/manageSubscriptionService';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Manage subscription regression failed: ${message}`);
}

export async function assertManageSubscriptionScenarios(): Promise<true> {
  assert(
    getSubscriptionManagementUrl('android', 'bpd_monthly') === 'https://play.google.com/store/account/subscriptions?sku=bpd_monthly&package=com.maximebellemare.bpdcompanion',
    'Android active monthly SKU opens targeted monthly URL',
  );
  assert(
    getSubscriptionManagementUrl('android', 'bpd_monthly:monthly') === 'https://play.google.com/store/account/subscriptions?sku=bpd_monthly&package=com.maximebellemare.bpdcompanion',
    'Android active monthly base-plan identifier opens targeted monthly URL',
  );
  assert(
    getSubscriptionManagementUrl('android', 'bpd_yearly') === 'https://play.google.com/store/account/subscriptions?sku=bpd_yearly&package=com.maximebellemare.bpdcompanion',
    'Android active yearly SKU opens targeted yearly URL',
  );
  assert(
    getSubscriptionManagementUrl('android', 'bpd_yearly:annual') === 'https://play.google.com/store/account/subscriptions?sku=bpd_yearly&package=com.maximebellemare.bpdcompanion',
    'Android active yearly base-plan identifier opens targeted yearly URL',
  );

  assert(
    getSubscriptionManagementUrl('android', null) === GOOGLE_PLAY_SUBSCRIPTIONS_URL,
    'Android missing active product uses generic subscriptions URL',
  );
  assert(
    getSubscriptionManagementUrl('android', 'unknown_product') === GOOGLE_PLAY_SUBSCRIPTIONS_URL,
    'Android unknown active product uses generic subscriptions URL',
  );
  assert(normalizeAndroidSubscriptionSku('unknown_product') === null, 'unknown Android product is not treated as owned');
  assert(getSubscriptionManagementUrl('ios', 'bpd_monthly:monthly') === IOS_SUBSCRIPTIONS_APP_URL, 'iOS opens App Store subscription management');

  const openedUrls: string[] = [];
  const opened = await openSubscriptionManagement('android', {
    canOpenURL: async () => true,
    openURL: async (url) => {
      openedUrls.push(url);
    },
  }, 'bpd_monthly');
  assert(opened.opened === true, 'successful Android open returns opened');
  assert(openedUrls[0]?.includes('sku=bpd_monthly'), 'successful Android open uses targeted active product URL');

  const genericUrls: string[] = [];
  await openSubscriptionManagement('android', {
    canOpenURL: async () => true,
    openURL: async (url) => {
      genericUrls.push(url);
    },
  }, null);
  assert(genericUrls[0] === GOOGLE_PLAY_SUBSCRIPTIONS_URL, 'missing Android product opens generic URL');

  const failed = await openSubscriptionManagement('android', {
    canOpenURL: async () => false,
    openURL: async () => {
      throw new Error('should not open');
    },
  }, 'bpd_yearly');
  assert(failed.opened === false, 'failed external link returns safe failure');

  const iosUrls: string[] = [];
  await openSubscriptionManagement('ios', {
    canOpenURL: async (url) => url !== IOS_SUBSCRIPTIONS_APP_URL,
    openURL: async (url) => {
      iosUrls.push(url);
    },
  }, 'bpd_monthly');
  assert(iosUrls[0] === IOS_SUBSCRIPTIONS_WEB_URL, 'iOS falls back to web subscriptions URL when app URL is unavailable');

  let resolveFirstTask: () => void = () => {};
  let taskStarts = 0;
  const runOnce = createSingleFlightRunner();
  const firstRun = runOnce(async () => {
    taskStarts += 1;
    await new Promise<void>((resolve) => {
      resolveFirstTask = resolve;
    });
    return 'first';
  });
  const secondRun = await runOnce(async () => {
    taskStarts += 1;
    return 'second';
  });
  assert(secondRun.started === false, 'repeated tap while opening is ignored');
  assert(taskStarts === 1, 'repeated tap does not start another external navigation task');
  resolveFirstTask();
  const completedFirstRun = await firstRun;
  assert(completedFirstRun.started === true && completedFirstRun.result === 'first', 'first single-flight task completes');
  const thirdRun = await runOnce(async () => {
    taskStarts += 1;
    return 'third';
  });
  assert(thirdRun.started === true && thirdRun.result === 'third', 'single-flight guard resets after completion');

  return true;
}

export const manageSubscriptionRegressionTestsPassed = assertManageSubscriptionScenarios();
