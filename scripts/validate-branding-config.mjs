#!/usr/bin/env node
/**
 * Branding Configuration Validator
 *
 * Validates all operator branding configurations against the JSON schema.
 * Run: node scripts/validate-branding-config.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const OPERATORS_DIR = join(ROOT_DIR, 'platform-config', 'operators');
const SCHEMA_PATH = join(OPERATORS_DIR, 'schema', 'branding.schema.json');

// Simple JSON Schema validator (draft-07 subset)
class JsonSchemaValidator {
  constructor(schema) {
    this.schema = schema;
  }

  // Check if an object looks like a color palette (has numeric keys 50-900)
  isColorPalette(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
    const shadeKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
    return shadeKeys.some((key) => key in obj);
  }

  validate(data, path = '') {
    const errors = [];

    if (this.schema.type) {
      const actualType = Array.isArray(data) ? 'array' : typeof data;
      if (actualType !== this.schema.type && this.schema.type !== 'object') {
        errors.push(`${path}: expected type ${this.schema.type}, got ${actualType}`);
      }
    }

    if (this.schema.required && Array.isArray(this.schema.required)) {
      for (const field of this.schema.required) {
        if (!(field in data)) {
          errors.push(`${path}: missing required field "${field}"`);
        }
      }
    }

    if (this.schema.properties && typeof data === 'object' && !Array.isArray(data)) {
      for (const [key, value] of Object.entries(data)) {
        if (this.schema.properties[key]) {
          const propSchema = this.schema.properties[key];
          const propValidator = new JsonSchemaValidator(propSchema);
          errors.push(...propValidator.validate(value, `${path}.${key}`));
        } else if (this.schema.additionalProperties === false) {
          errors.push(`${path}.${key}: unexpected property`);
        }
      }
    }

    // Validate color format only for color palette objects
    if (this.isColorPalette(data)) {
      for (const [shade, color] of Object.entries(data)) {
        if (typeof color === 'string' && !/^#[0-9a-fA-F]{6}$/.test(color)) {
          errors.push(`${path}.${shade}: invalid color format "${color}" (expected #RRGGBB)`);
        }
      }
    }

    return errors;
  }
}

function validateBrandingConfig(configPath, schema) {
  console.log(`\n📋 Validating: ${configPath}`);

  try {
    const configData = JSON.parse(readFileSync(configPath, 'utf-8'));
    const validator = new JsonSchemaValidator(schema);
    const errors = validator.validate(configData, configPath);

    if (errors.length > 0) {
      console.error(`❌ ${configPath}:`);
      errors.forEach((err) => console.error(`   - ${err}`));
      return false;
    }

    console.log(`✅ ${configData.name} (${configData.operatorId}) - valid`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`❌ File not found: ${configPath}`);
    } else if (error instanceof SyntaxError) {
      console.error(`❌ Invalid JSON in ${configPath}: ${error.message}`);
    } else {
      console.error(`❌ Error validating ${configPath}: ${error.message}`);
    }
    return false;
  }
}

function main() {
  console.log('🔍 Branding Configuration Validator');
  console.log('====================================\n');

  // Load schema
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`❌ Schema not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  console.log(`📄 Loaded schema: ${schema.title} (${schema.$id || 'inline'})\n`);
  console.log('✅ Schema loaded successfully\n');

  // Get all operator directories
  if (!existsSync(OPERATORS_DIR)) {
    console.error(`❌ Operators directory not found: ${OPERATORS_DIR}`);
    process.exit(1);
  }

  const entries = readdirSync(OPERATORS_DIR, { withFileTypes: true });
  const operatorDirs = entries.filter((e) => e.isDirectory() && e.name !== 'schema');

  if (operatorDirs.length === 0) {
    console.log('⚠️  No operator configurations found');
    process.exit(0);
  }

  console.log(`📁 Found ${operatorDirs.length} operator(s)\n`);

  // Validate each operator config
  let allValid = true;
  for (const dir of operatorDirs) {
    const configPath = join(OPERATORS_DIR, dir.name, 'branding', 'config.json');

    if (!existsSync(configPath)) {
      console.error(`❌ ${dir.name}: branding/config.json not found`);
      allValid = false;
      continue;
    }

    const isValid = validateBrandingConfig(configPath, schema);
    allValid = allValid && isValid;
  }

  console.log('\n====================================');
  if (allValid) {
    console.log('✅ All branding configurations are valid');
    process.exit(0);
  } else {
    console.error('❌ Some branding configurations have errors');
    process.exit(1);
  }
}

main();
