const appJson = require('./app.json');

const META_APP_ID = process.env.EXPO_PUBLIC_META_APP_ID || '1546153426837970';
const META_CLIENT_TOKEN = process.env.EXPO_PUBLIC_META_CLIENT_TOKEN;

function withoutPlugin(plugins, pluginName) {
  return (plugins || []).filter((plugin) => {
    if (plugin === pluginName) return false;
    return !Array.isArray(plugin) || plugin[0] !== pluginName;
  });
}

module.exports = ({ config }) => {
  const expo = {
    ...config,
    ...appJson.expo,
    ios: {
      ...(config.ios || {}),
      ...(appJson.expo.ios || {}),
    },
    android: {
      ...(config.android || {}),
      ...(appJson.expo.android || {}),
    },
    extra: {
      ...(config.extra || {}),
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
