#!/usr/bin/env node
/* global __dirname */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const EXPECTED_ANDROID_PACKAGE = 'com.maximebellemare.bpdcompanion';
const REQUIRED_AD_ID_PERMISSION = 'com.google.android.gms.permission.AD_ID';
const BLOCKED_MEDIA_PLAYBACK_PERMISSION = 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK';

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

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const initialStashSnapshot = getStashSnapshot(projectRoot);
  const appJson = readJson(path.join(projectRoot, 'app.json'));
  const easJson = readJson(path.join(projectRoot, 'eas.json'));
  const resolvedConfig = getResolvedExpoConfig(projectRoot);

  const resolvedVersion = resolvedConfig.version;
  const appJsonVersion = appJson.expo?.version;
  const androidPackage = resolvedConfig.android?.package;
  const androidPermissions = resolvedConfig.android?.permissions ?? [];
  const appVersionSource = easJson.cli?.appVersionSource ?? 'local';
  const productionAutoIncrement = easJson.build?.production?.autoIncrement ?? null;

  console.log('[preflight:android] resolved Expo version:', resolvedVersion);
  console.log('[preflight:android] app.json Expo version:', appJsonVersion);
  console.log('[preflight:android] Android package:', androidPackage);
  console.log('[preflight:android] EAS version source:', appVersionSource);
  console.log('[preflight:android] production autoIncrement:', productionAutoIncrement);
  console.log('[preflight:android] required AD_ID permission present:', androidPermissions.includes(REQUIRED_AD_ID_PERMISSION));
  console.log('[preflight:android] media playback foreground service permission absent:', !androidPermissions.includes(BLOCKED_MEDIA_PLAYBACK_PERMISSION));

  assert(androidPackage === EXPECTED_ANDROID_PACKAGE, `Android package must be ${EXPECTED_ANDROID_PACKAGE}; resolved ${androidPackage || 'missing'}.`);
  assert(resolvedVersion && isSemverLike(resolvedVersion), `Resolved Expo version is invalid: ${resolvedVersion || 'missing'}.`);
  assert(resolvedVersion === appJsonVersion, `Resolved Expo version ${resolvedVersion} does not match app.json version ${appJsonVersion}.`);
  assert(appVersionSource === 'remote', `EAS cli.appVersionSource must be remote; found ${appVersionSource}.`);
  assert(productionAutoIncrement === true, `EAS production.autoIncrement must be true; found ${productionAutoIncrement}.`);
  assert(androidPermissions.includes(REQUIRED_AD_ID_PERMISSION), `${REQUIRED_AD_ID_PERMISSION} must be present in resolved Android permissions.`);
  assert(!androidPermissions.includes(BLOCKED_MEDIA_PLAYBACK_PERMISSION), `${BLOCKED_MEDIA_PLAYBACK_PERMISSION} must be absent from resolved Android permissions.`);

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
