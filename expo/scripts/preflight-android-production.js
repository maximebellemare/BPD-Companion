#!/usr/bin/env node
/* global __dirname */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const EXPECTED_ANDROID_PACKAGE = 'com.maximebellemare.bpdcompanion';
const REQUIRED_AD_ID_PERMISSION = 'com.google.android.gms.permission.AD_ID';
const BLOCKED_MEDIA_PLAYBACK_PERMISSION = 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK';
const IOS_FIREBASE_FILE = './GoogleService-Info.plist';
const ANDROID_FIREBASE_FILE = './google-services.json';

function printError(message) {
  console.error(`\n[preflight:android] ${message}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function getResolvedExpoConfig(projectRoot) {
  const output = run('npx', ['expo', 'config', '--type', 'public', '--json'], { cwd: projectRoot });
  return JSON.parse(output);
}

function getStashSnapshot(projectRoot) {
  return run('git', ['stash', 'list', '--format=%gd:%H:%s'], { cwd: projectRoot });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isSemverLike(version) {
  return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(String(version));
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

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const initialStashSnapshot = getStashSnapshot(projectRoot);
  const appJson = readJson(path.join(projectRoot, 'app.json'));
  const easJson = readJson(path.join(projectRoot, 'eas.json'));
  const packageJson = readJson(path.join(projectRoot, 'package.json'));
  const resolvedConfig = getResolvedExpoConfig(projectRoot);

  const resolvedVersion = resolvedConfig.version;
  const appJsonVersion = appJson.expo?.version;
  const androidPackage = resolvedConfig.android?.package;
  const androidPermissions = resolvedConfig.android?.permissions ?? [];
  const appVersionSource = easJson.cli?.appVersionSource ?? 'local';
  const productionAutoIncrement = easJson.build?.production?.autoIncrement ?? null;
  const plugins = resolvedConfig.plugins ?? [];
  const firebaseAnalyticsOptions = getPluginOptions(plugins, '@react-native-firebase/analytics');
  const hasFirebaseAppPackage = hasDependency(packageJson, '@react-native-firebase/app');
  const hasFirebaseAnalyticsPackage = hasDependency(packageJson, '@react-native-firebase/analytics');
  const hasFirebaseAppPlugin = Boolean(getPluginEntry(plugins, '@react-native-firebase/app'));
  const hasFirebaseAnalyticsPlugin = Boolean(getPluginEntry(plugins, '@react-native-firebase/analytics'));
  const hasTrackingTransparencyPlugin = Boolean(getPluginEntry(plugins, 'expo-tracking-transparency'));
  const hasTrackingTransparencyDependency = hasDependency(packageJson, 'expo-tracking-transparency');
  const firebaseWithoutAdIdSupport = firebaseAnalyticsOptions?.ios?.withoutAdIdSupport === true;
  const iosFirebaseFileExists = fs.existsSync(path.join(projectRoot, 'GoogleService-Info.plist'));
  const androidFirebaseFileExists = fs.existsSync(path.join(projectRoot, 'google-services.json'));

  console.log('[preflight:android] resolved Expo version:', resolvedVersion);
  console.log('[preflight:android] app.json Expo version:', appJsonVersion);
  console.log('[preflight:android] Android package:', androidPackage);
  console.log('[preflight:android] EAS version source:', appVersionSource);
  console.log('[preflight:android] production autoIncrement:', productionAutoIncrement);
  console.log('[preflight:android] required AD_ID permission present:', androidPermissions.includes(REQUIRED_AD_ID_PERMISSION));
  console.log('[preflight:android] media playback foreground service permission absent:', !androidPermissions.includes(BLOCKED_MEDIA_PLAYBACK_PERMISSION));
  console.log('[preflight:android] iOS Firebase file present:', iosFirebaseFileExists);
  console.log('[preflight:android] Android Firebase file present:', androidFirebaseFileExists);
  console.log('[preflight:android] iOS googleServicesFile:', resolvedConfig.ios?.googleServicesFile);
  console.log('[preflight:android] Android googleServicesFile:', resolvedConfig.android?.googleServicesFile);
  console.log('[preflight:android] Firebase packages installed:', hasFirebaseAppPackage && hasFirebaseAnalyticsPackage);
  console.log('[preflight:android] Firebase plugins configured:', hasFirebaseAppPlugin && hasFirebaseAnalyticsPlugin);
  console.log('[preflight:android] Firebase iOS without Ad ID support:', firebaseWithoutAdIdSupport);
  console.log('[preflight:android] ATT plugin/dependency absent:', !hasTrackingTransparencyPlugin && !hasTrackingTransparencyDependency);

  assert(androidPackage === EXPECTED_ANDROID_PACKAGE, `Android package must be ${EXPECTED_ANDROID_PACKAGE}; resolved ${androidPackage || 'missing'}.`);
  assert(resolvedVersion && isSemverLike(resolvedVersion), `Resolved Expo version is invalid: ${resolvedVersion || 'missing'}.`);
  assert(resolvedVersion === appJsonVersion, `Resolved Expo version ${resolvedVersion} does not match app.json version ${appJsonVersion}.`);
  assert(appVersionSource === 'remote', `EAS cli.appVersionSource must be remote; found ${appVersionSource}.`);
  assert(productionAutoIncrement === true, `EAS production.autoIncrement must be true; found ${productionAutoIncrement}.`);
  assert(androidPermissions.includes(REQUIRED_AD_ID_PERMISSION), `${REQUIRED_AD_ID_PERMISSION} must be present in resolved Android permissions.`);
  assert(!androidPermissions.includes(BLOCKED_MEDIA_PLAYBACK_PERMISSION), `${BLOCKED_MEDIA_PLAYBACK_PERMISSION} must be absent from resolved Android permissions.`);
  assert(iosFirebaseFileExists && androidFirebaseFileExists, 'Firebase configuration files must be present.');
  assert(resolvedConfig.ios?.googleServicesFile === IOS_FIREBASE_FILE, `iOS googleServicesFile must be ${IOS_FIREBASE_FILE}.`);
  assert(resolvedConfig.android?.googleServicesFile === ANDROID_FIREBASE_FILE, `Android googleServicesFile must be ${ANDROID_FIREBASE_FILE}.`);
  assert(hasFirebaseAppPackage && hasFirebaseAnalyticsPackage, 'React Native Firebase packages must be installed.');
  assert(hasFirebaseAppPlugin && hasFirebaseAnalyticsPlugin, 'React Native Firebase config plugins must be configured.');
  assert(firebaseWithoutAdIdSupport, 'Firebase Analytics iOS plugin must use withoutAdIdSupport=true.');
  assert(!hasTrackingTransparencyPlugin && !hasTrackingTransparencyDependency, 'ATT/tracking transparency package and plugin must remain absent.');

  const finalStashSnapshot = getStashSnapshot(projectRoot);
  assert(finalStashSnapshot === initialStashSnapshot, 'Git stash list changed during Android preflight.');

  console.log('[preflight:android] git stashes untouched:', true);
  console.log('[preflight:android] passed');
}

try {
  main();
} catch (error) {
  printError(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
