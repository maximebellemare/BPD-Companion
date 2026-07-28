#!/usr/bin/env node
/* global Buffer, __dirname */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { execFileSync } = require('child_process');

const APPROVED_VERSION_STATES = new Set([
  'READY_FOR_SALE',
  'READY_FOR_DISTRIBUTION',
  'PENDING_DEVELOPER_RELEASE',
]);

const ASC_API_BASE_URL = 'https://api.appstoreconnect.apple.com/v1';
const FALLBACK_VERSION_ENV = 'BPD_COMPANION_LATEST_APPROVED_IOS_VERSION';
const FALLBACK_CONFIRM_ENV = 'BPD_COMPANION_CONFIRM_LATEST_APPROVED_VERSION';
const IOS_FIREBASE_FILE = './GoogleService-Info.plist';
const ANDROID_FIREBASE_FILE = './google-services.json';

function printError(message) {
  console.error(`\n[preflight:ios] ${message}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getResolvedExpoConfig(projectRoot) {
  const output = execFileSync('npx', ['expo', 'config', '--json'], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}

function compareVersions(left, right) {
  const leftParts = String(left).split('.').map(part => Number.parseInt(part, 10));
  const rightParts = String(right).split('.').map(part => Number.parseInt(part, 10));
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = Number.isFinite(leftParts[index]) ? leftParts[index] : 0;
    const rightPart = Number.isFinite(rightParts[index]) ? rightParts[index] : 0;
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
}

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function readPrivateKey() {
  if (process.env.APP_STORE_CONNECT_API_PRIVATE_KEY) {
    return process.env.APP_STORE_CONNECT_API_PRIVATE_KEY.replace(/\\n/g, '\n');
  }

  const privateKeyPath = process.env.APP_STORE_CONNECT_API_PRIVATE_KEY_PATH;
  if (privateKeyPath) {
    return fs.readFileSync(path.resolve(privateKeyPath), 'utf8');
  }

  return null;
}

function createAppStoreConnectJwt() {
  const issuerId = process.env.APP_STORE_CONNECT_API_ISSUER_ID;
  const keyId = process.env.APP_STORE_CONNECT_API_KEY_ID;
  const privateKey = readPrivateKey();

  if (!issuerId || !keyId || !privateKey) {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'ES256',
    kid: keyId,
    typ: 'JWT',
  };
  const payload = {
    iss: issuerId,
    iat: nowSeconds,
    exp: nowSeconds + 20 * 60,
    aud: 'appstoreconnect-v1',
  };

  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = crypto
    .createSign('SHA256')
    .update(signingInput)
    .end()
    .sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });

  return `${signingInput}.${base64Url(signature)}`;
}

function ascGet(pathname, token) {
  const url = new URL(`${ASC_API_BASE_URL}${pathname}`);

  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
      response => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => {
          body += chunk;
        });
        response.on('end', () => {
          let parsed;
          try {
            parsed = body ? JSON.parse(body) : {};
          } catch (_error) {
            reject(new Error(`App Store Connect returned non-JSON response (${response.statusCode}).`));
            return;
          }

          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            const detail = parsed?.errors?.[0]?.detail ?? parsed?.errors?.[0]?.title ?? 'Unknown App Store Connect error';
            reject(new Error(`App Store Connect request failed (${response.statusCode}): ${detail}`));
            return;
          }

          resolve(parsed);
        });
      },
    );

    request.on('error', reject);
    request.end();
  });
}

async function fetchLatestApprovedVersion(bundleIdentifier) {
  const token = createAppStoreConnectJwt();
  if (!token) {
    return null;
  }

  const appsResponse = await ascGet(`/apps?filter[bundleId]=${encodeURIComponent(bundleIdentifier)}&limit=1`, token);
  const app = appsResponse.data?.[0];
  if (!app?.id) {
    throw new Error(`No App Store Connect app found for bundle identifier ${bundleIdentifier}.`);
  }

  const versions = [];
  let nextPath = `/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=200`;

  while (nextPath) {
    const versionsResponse = await ascGet(nextPath, token);
    versions.push(...(versionsResponse.data ?? []));
    const nextUrl = versionsResponse.links?.next;
    nextPath = nextUrl ? new URL(nextUrl).pathname + new URL(nextUrl).search : null;
  }

  const approvedVersions = versions
    .map(version => ({
      versionString: version.attributes?.versionString,
      state: version.attributes?.appVersionState,
    }))
    .filter(version => version.versionString && APPROVED_VERSION_STATES.has(version.state))
    .sort((a, b) => compareVersions(b.versionString, a.versionString));

  if (approvedVersions.length === 0) {
    throw new Error('No approved/released iOS App Store versions were found in App Store Connect.');
  }

  return approvedVersions[0].versionString;
}

function getFallbackLatestApprovedVersion() {
  const fallbackVersion = process.env.BPD_COMPANION_LATEST_APPROVED_IOS_VERSION;
  const fallbackConfirmed = process.env.BPD_COMPANION_CONFIRM_LATEST_APPROVED_VERSION === 'true';

  if (!fallbackVersion || !fallbackConfirmed) {
    return null;
  }

  return fallbackVersion;
}

function getPluginEntry(plugins, pluginName) {
  return (plugins ?? []).find(plugin => {
    if (plugin === pluginName) return true;
    return Array.isArray(plugin) && plugin[0] === pluginName;
  });
}

function getPluginOptions(plugins, pluginName) {
  const entry = getPluginEntry(plugins, pluginName);
  return Array.isArray(entry) ? entry[1] ?? {} : {};
}

function hasDependency(packageJson, packageName) {
  return Boolean(packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName]);
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const resolvedConfig = getResolvedExpoConfig(projectRoot);
  const easJson = readJson(path.join(projectRoot, 'eas.json'));
  const packageJson = readJson(path.join(projectRoot, 'package.json'));
  const localVersion = resolvedConfig.version;
  const bundleIdentifier = resolvedConfig.ios?.bundleIdentifier;
  const appVersionSource = easJson.cli?.appVersionSource ?? 'local';
  const productionAutoIncrement = easJson.build?.production?.autoIncrement ?? null;
  const plugins = resolvedConfig.plugins ?? [];
  const firebaseAnalyticsOptions = getPluginOptions(plugins, '@react-native-firebase/analytics');
  const hasTrackingTransparencyPlugin = Boolean(getPluginEntry(plugins, 'expo-tracking-transparency'));
  const hasTrackingTransparencyDependency = hasDependency(packageJson, 'expo-tracking-transparency');
  const userTrackingPurpose = resolvedConfig.ios?.infoPlist?.NSUserTrackingUsageDescription;

  if (!localVersion || !bundleIdentifier) {
    throw new Error('Could not resolve local Expo iOS version or bundle identifier.');
  }

  const iosFirebaseFileExists = fs.existsSync(path.join(projectRoot, 'GoogleService-Info.plist'));
  const androidFirebaseFileExists = fs.existsSync(path.join(projectRoot, 'google-services.json'));
  const hasFirebaseAppPackage = hasDependency(packageJson, '@react-native-firebase/app');
  const hasFirebaseAnalyticsPackage = hasDependency(packageJson, '@react-native-firebase/analytics');
  const hasFirebaseAppPlugin = Boolean(getPluginEntry(plugins, '@react-native-firebase/app'));
  const hasFirebaseAnalyticsPlugin = Boolean(getPluginEntry(plugins, '@react-native-firebase/analytics'));
  const firebaseWithoutAdIdSupport = firebaseAnalyticsOptions?.ios?.withoutAdIdSupport === true;

  let latestApprovedVersion = await fetchLatestApprovedVersion(bundleIdentifier);
  let source = 'App Store Connect API';

  if (!latestApprovedVersion) {
    latestApprovedVersion = getFallbackLatestApprovedVersion();
    source = 'explicit local fallback';
  }

  console.log('[preflight:ios] latest approved App Store version:', latestApprovedVersion ?? 'unavailable');
  console.log('[preflight:ios] local Expo version:', localVersion);
  console.log('[preflight:ios] EAS version source:', appVersionSource);
  console.log('[preflight:ios] production autoIncrement:', productionAutoIncrement);
  console.log('[preflight:ios] iOS Firebase file present:', iosFirebaseFileExists);
  console.log('[preflight:ios] Android Firebase file present:', androidFirebaseFileExists);
  console.log('[preflight:ios] iOS googleServicesFile:', resolvedConfig.ios?.googleServicesFile);
  console.log('[preflight:ios] Android googleServicesFile:', resolvedConfig.android?.googleServicesFile);
  console.log('[preflight:ios] Firebase packages installed:', hasFirebaseAppPackage && hasFirebaseAnalyticsPackage);
  console.log('[preflight:ios] Firebase plugins configured:', hasFirebaseAppPlugin && hasFirebaseAnalyticsPlugin);
  console.log('[preflight:ios] Firebase iOS without Ad ID support:', firebaseWithoutAdIdSupport);
  console.log('[preflight:ios] ATT plugin/dependency absent:', !hasTrackingTransparencyPlugin && !hasTrackingTransparencyDependency);

  if (!latestApprovedVersion) {
    printError('App Store Connect credentials are unavailable, and no explicit fallback confirmation was provided.');
    console.error(`Set App Store Connect API credentials, or set both:`);
    console.error(`  ${FALLBACK_VERSION_ENV}=<latest approved App Store version>`);
    console.error(`  ${FALLBACK_CONFIRM_ENV}=true`);
    process.exit(1);
  }

  if (compareVersions(localVersion, latestApprovedVersion) <= 0) {
    printError(
      `Blocked production iOS build. Local Expo version ${localVersion} must be greater than latest approved App Store version ${latestApprovedVersion} (${source}).`,
    );
    process.exit(1);
  }

  if (!iosFirebaseFileExists || !androidFirebaseFileExists) {
    printError('Firebase configuration files are missing.');
    process.exit(1);
  }

  if (resolvedConfig.ios?.googleServicesFile !== IOS_FIREBASE_FILE) {
    printError(`iOS googleServicesFile must be ${IOS_FIREBASE_FILE}; resolved ${resolvedConfig.ios?.googleServicesFile || 'missing'}.`);
    process.exit(1);
  }

  if (resolvedConfig.android?.googleServicesFile !== ANDROID_FIREBASE_FILE) {
    printError(`Android googleServicesFile must be ${ANDROID_FIREBASE_FILE}; resolved ${resolvedConfig.android?.googleServicesFile || 'missing'}.`);
    process.exit(1);
  }

  if (!hasFirebaseAppPackage || !hasFirebaseAnalyticsPackage || !hasFirebaseAppPlugin || !hasFirebaseAnalyticsPlugin) {
    printError('React Native Firebase packages/plugins are not fully configured.');
    process.exit(1);
  }

  if (!firebaseWithoutAdIdSupport) {
    printError('Firebase Analytics iOS plugin must use withoutAdIdSupport=true.');
    process.exit(1);
  }

  if (hasTrackingTransparencyPlugin || hasTrackingTransparencyDependency || userTrackingPurpose) {
    printError('ATT/tracking transparency configuration must remain absent.');
    process.exit(1);
  }

  console.log('[preflight:ios] passed');
}

main().catch(error => {
  printError(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
