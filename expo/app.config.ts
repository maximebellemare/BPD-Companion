import type { ConfigContext } from 'expo/config';
import appJsonSource from './app.json';

const META_APP_ID = '1546153426837970';
const META_CLIENT_TOKEN = process.env.META_CLIENT_TOKEN;

type ExpoConfigLike = Record<string, unknown> & {
  android?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  ios?: Record<string, unknown>;
  plugins?: unknown[];
};

const appJson = appJsonSource as { expo: ExpoConfigLike };

function withoutPlugin(plugins: unknown, pluginName: string): unknown[] {
  if (!Array.isArray(plugins)) return [];

  return plugins.filter((plugin) => {
    if (plugin === pluginName) return false;
    return !Array.isArray(plugin) || plugin[0] !== pluginName;
  });
}

export default ({ config }: ConfigContext) => {
  const configLike = config as ExpoConfigLike;
  const expo = {
    ...configLike,
    ...appJson.expo,
    ios: {
      ...(configLike.ios || {}),
      ...(appJson.expo.ios || {}),
    },
    android: {
      ...(configLike.android || {}),
      ...(appJson.expo.android || {}),
    },
    extra: {
      ...(configLike.extra || {}),
      ...(appJson.expo.extra || {}),
    },
  };

  return {
    ...expo,
    plugins: [
      ...withoutPlugin(withoutPlugin(expo.plugins, 'react-native-fbsdk-next'), 'expo-localization'),
      'expo-localization',
      [
        'react-native-fbsdk-next',
        {
          appID: META_APP_ID,
          ...(META_CLIENT_TOKEN ? { clientToken: META_CLIENT_TOKEN } : {}),
          displayName: 'BPD Companion',
          scheme: `fb${META_APP_ID}`,
          autoLogAppEventsEnabled: false,
          advertiserIDCollectionEnabled: false,
          isAutoInitEnabled: false,
          iosUserTrackingPermission: false,
        },
      ],
    ],
  };
};
