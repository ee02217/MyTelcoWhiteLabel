#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const operatorsRoot = path.join(root, 'platform-config', 'operators');
const requiredOperators = ['default', 'alpha-telecom'];
const channels = ['web', 'mobile', 'admin'];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validateFlags(operatorId) {
  const filePath = path.join(operatorsRoot, operatorId, 'features', 'flags.json');
  if (!fs.existsSync(filePath)) {
    fail(`Missing flags config: ${filePath}`);
    return;
  }

  const json = readJson(filePath);
  if (json.operatorId !== operatorId) fail(`${filePath}: operatorId must be '${operatorId}'`);
  if (!Number.isInteger(json.version) || json.version < 1)
    fail(`${filePath}: version must be integer >= 1`);
  if (!json.updatedAt || Number.isNaN(Date.parse(json.updatedAt)))
    fail(`${filePath}: updatedAt must be valid ISO datetime`);

  for (const channel of channels) {
    const channelNode = json.channels?.[channel];
    if (!channelNode) {
      fail(`${filePath}: channels.${channel} is required`);
      continue;
    }

    const flags = channelNode.flags;
    if (
      !flags ||
      typeof flags !== 'object' ||
      Array.isArray(flags) ||
      Object.keys(flags).length === 0
    ) {
      fail(`${filePath}: channels.${channel}.flags must be a non-empty object`);
      continue;
    }

    for (const [flagKey, flagValue] of Object.entries(flags)) {
      if (typeof flagValue !== 'boolean') {
        fail(`${filePath}: channels.${channel}.flags.${flagKey} must be boolean`);
      }
    }
  }
}

function validateJourney(operatorId, filePath) {
  const json = readJson(filePath);
  if (json.operatorId !== operatorId) fail(`${filePath}: operatorId must be '${operatorId}'`);
  if (!json.journeyId || typeof json.journeyId !== 'string')
    fail(`${filePath}: journeyId is required`);
  if (!Number.isInteger(json.version) || json.version < 1)
    fail(`${filePath}: version must be integer >= 1`);
  if (!Array.isArray(json.steps) || json.steps.length === 0)
    fail(`${filePath}: steps must be non-empty array`);

  let expectedOrder = 1;
  for (const step of json.steps ?? []) {
    if (!Number.isInteger(step.order) || step.order !== expectedOrder) {
      fail(`${filePath}: step order must be sequential starting at 1 (expected ${expectedOrder})`);
    }
    for (const field of ['id', 'type', 'condition']) {
      if (!step[field] || typeof step[field] !== 'string') {
        fail(`${filePath}: step ${step.order} missing string field '${field}'`);
      }
    }
    expectedOrder += 1;
  }
}

for (const operatorId of requiredOperators) {
  validateFlags(operatorId);

  const journeysDir = path.join(operatorsRoot, operatorId, 'journeys');
  if (!fs.existsSync(journeysDir)) {
    fail(`Missing journeys directory: ${journeysDir}`);
    continue;
  }

  const journeyFiles = fs.readdirSync(journeysDir).filter((name) => name.endsWith('.json'));
  if (journeyFiles.length < 2) {
    fail(`${journeysDir}: at least two journey configuration files are required`);
  }

  for (const journeyFile of journeyFiles) {
    validateJourney(operatorId, path.join(journeysDir, journeyFile));
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('✅ Feature flag and journey configurations are valid.');
