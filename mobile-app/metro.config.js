const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/**
 * Ensure Metro can resolve shared files from the workspace root.
 * This repo imports shared design tokens from `platform-config`.
 */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.join(workspaceRoot, 'platform-config')];

module.exports = config;
