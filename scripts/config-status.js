#!/usr/bin/env node

// =====================================================
// 📁 scripts/config-status.js - Configuration Status Check
// =====================================================

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function logHeader(text) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(`🔧 ${text}`, 'cyan'));
  console.log(colorize('='.repeat(60), 'cyan'));
}

function logSection(text) {
  console.log('\n' + colorize(`📋 ${text}`, 'blue'));
  console.log(colorize('-'.repeat(40), 'blue'));
}

function logSuccess(text) {
  console.log(colorize(`✅ ${text}`, 'green'));
}

function logWarning(text) {
  console.log(colorize(`⚠️  ${text}`, 'yellow'));
}

function logError(text) {
  console.log(colorize(`❌ ${text}`, 'red'));
}

function logInfo(text) {
  console.log(colorize(`ℹ️  ${text}`, 'blue'));
}

// Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(path.resolve(filePath));
  } catch (error) {
    return false;
  }
}

// Read environment variable from .env files
function readEnvFile(filePath) {
  try {
    if (!fileExists(filePath)) return {};
    
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    return {};
  }
}

// Get environment variable value
function getEnvVar(key, envFiles = []) {
  // Check process.env first (runtime environment)
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Check .env files
  for (const envFile of envFiles) {
    const env = readEnvFile(envFile);
    if (env[key]) {
      return env[key];
    }
  }
  
  return undefined;
}

// Validate API key format
function validateApiKey(apiKey) {
  if (!apiKey) return { valid: false, reason: 'Missing' };
  if (apiKey.length < 20) return { valid: false, reason: 'Too short' };
  if (apiKey === 'your_gemini_api_key_here') return { valid: false, reason: 'Default template value' };
  if (apiKey === 'your_api_key_here') return { valid: false, reason: 'Default template value' };
  return { valid: true, reason: 'Valid format' };
}

// Main configuration check
function checkConfiguration() {
  logHeader('Vocabulary Master - Configuration Status');
  
  // Environment files to check
  const envFiles = ['.env.local', '.env.development', '.env'];
  
  logSection('Environment Files');
  
  let hasEnvFile = false;
  envFiles.forEach(file => {
    if (fileExists(file)) {
      logSuccess(`Found: ${file}`);
      hasEnvFile = true;
    } else {
      logInfo(`Not found: ${file}`);
    }
  });
  
  if (!hasEnvFile) {
    logWarning('No environment files found');
    logInfo('Run: npm run setup:env');
  }
  
  // Check example file
  if (fileExists('.env.example')) {
    logSuccess('Template file: .env.example');
  } else {
    logError('Missing: .env.example template');
  }
  
  logSection('Environment Variables');
  
  // Required variables
  const requiredVars = [
    { key: 'REACT_APP_GEMINI_API_KEY', description: 'Gemini AI API Key', required: true }
  ];
  
  // Optional variables
  const optionalVars = [
    { key: 'REACT_APP_ENVIRONMENT', description: 'App Environment' },
    { key: 'REACT_APP_DEBUG_LOGGING', description: 'Debug Logging' },
    { key: 'REACT_APP_ENABLE_AI_FEATURES', description: 'AI Features Enabled' },
    { key: 'REACT_APP_MOCK_AI_RESPONSES', description: 'Mock AI Responses' },
    { key: 'REACT_APP_AI_TIMEOUT', description: 'AI Request Timeout' },
    { key: 'REACT_APP_AI_MAX_RETRIES', description: 'AI Max Retries' }
  ];
  
  let allConfigured = true;
  
  // Check required variables
  console.log('\n' + colorize('Required Variables:', 'bright'));
  requiredVars.forEach(({ key, description, required }) => {
    const value = getEnvVar(key, envFiles);
    
    if (value) {
      if (key === 'REACT_APP_GEMINI_API_KEY') {
        const validation = validateApiKey(value);
        if (validation.valid) {
          logSuccess(`${key}: Configured (${validation.reason})`);
        } else {
          logError(`${key}: ${validation.reason}`);
          allConfigured = false;
        }
      } else {
        logSuccess(`${key}: ${value}`);
      }
    } else {
      if (required) {
        logError(`${key}: Missing (${description})`);
        allConfigured = false;
      } else {
        logWarning(`${key}: Not set (${description})`);
      }
    }
  });
  
  // Check optional variables
  console.log('\n' + colorize('Optional Variables:', 'bright'));
  optionalVars.forEach(({ key, description }) => {
    const value = getEnvVar(key, envFiles);
    if (value) {
      logInfo(`${key}: ${value}`);
    } else {
      logInfo(`${key}: Using default`);
    }
  });
  
  logSection('Configuration Status');
  
  // Overall status
  if (allConfigured) {
    logSuccess('Configuration is complete!');
    logSuccess('All required variables are properly set');
  } else {
    logError('Configuration is incomplete!');
    logError('Some required variables are missing or invalid');
  }
  
  // Feature availability
  const apiKey = getEnvVar('REACT_APP_GEMINI_API_KEY', envFiles);
  const aiEnabled = getEnvVar('REACT_APP_ENABLE_AI_FEATURES', envFiles);
  const mockMode = getEnvVar('REACT_APP_MOCK_AI_RESPONSES', envFiles);
  
  console.log('\n' + colorize('Feature Availability:', 'bright'));
  
  if (apiKey && validateApiKey(apiKey).valid) {
    if (aiEnabled === 'false') {
      logWarning('AI Features: Disabled by configuration');
    } else {
      logSuccess('AI Features: Available');
    }
  } else {
    if (mockMode === 'true') {
      logWarning('AI Features: Mock mode (no real API calls)');
    } else {
      logError('AI Features: Unavailable (no valid API key)');
    }
  }
  
  logSection('Security Check');
  
  // Check for hardcoded credentials with smart filtering
  const sourceFiles = [
    'src/constants/appConstants.js',
    'src/services/aiService.js',
    'src/config/appConfig.js'
  ];
  
  let securityIssues = false;
  
  sourceFiles.forEach(file => {
    if (fileExists(file)) {
      try {
        const content = fs.readFileSync(path.resolve(file), 'utf8');
        
        // Smart patterns that avoid false positives
        const suspiciousPatterns = [
          {
            pattern: /['"]AIzaSy[0-9A-Za-z-_]{33}['"]/g,
            name: 'Google API Key'
          },
          {
            pattern: /apiKey\s*[:=]\s*['"][A-Za-z0-9-_]{20,}['"]/g,
            name: 'Hardcoded API Key'
          }
        ];
        
        let fileHasIssues = false;
        
        suspiciousPatterns.forEach(({ pattern, name }) => {
          const matches = content.match(pattern);
          if (matches) {
            // Filter out false positives
            const realMatches = matches.filter(match => {
              // Skip placeholder values
              if (match.includes('your_api_key') || 
                  match.includes('your_key_here') || 
                  match.includes('example') || 
                  match.includes('placeholder')) {
                return false;
              }
              
              // Check if it's in a comment
              const lines = content.split('\n');
              const matchLine = lines.find(line => line.includes(match));
              if (matchLine && (matchLine.trim().startsWith('//') || 
                              matchLine.trim().startsWith('*') ||
                              matchLine.includes('RIMOSSA PER SICUREZZA'))) {
                return false;
              }
              
              return true;
            });
            
            if (realMatches.length > 0) {
              fileHasIssues = true;
            }
          }
        });
        
        if (fileHasIssues) {
          logError(`Real security issues in: ${file}`);
          securityIssues = true;
        } else {
          logSuccess(`Clean: ${file}`);
        }
      } catch (error) {
        logWarning(`Could not check: ${file}`);
      }
    }
  });
  
  if (!securityIssues) {
    logSuccess('No hardcoded credentials detected');
  } else {
    logError('Security issues found! Remove hardcoded credentials');
  }
  
  logSection('Recommendations');
  
  if (!allConfigured) {
    console.log('\n' + colorize('To fix configuration issues:', 'yellow'));
    console.log('1. Copy template: ' + colorize('cp .env.example .env.local', 'cyan'));
    console.log('2. Get API key: ' + colorize('https://makersuite.google.com/app/apikey', 'cyan'));
    console.log('3. Add API key to .env.local');
    console.log('4. Restart development server');
  }
  
  if (securityIssues) {
    console.log('\n' + colorize('To fix security issues:', 'red'));
    console.log('1. Remove hardcoded credentials from source files');
    console.log('2. Use environment variables instead');
    console.log('3. Commit clean code only');
  }
  
  console.log('\n' + colorize('For more help:', 'blue'));
  console.log('📖 Read: SECURITY_SETUP.md');
  console.log('🔧 Run: npm run setup:env');
  
  logHeader('Configuration Check Complete');
  
  // Exit with appropriate code
  process.exit(allConfigured && !securityIssues ? 0 : 1);
}

// Run the check
if (require.main === module) {
  checkConfiguration();
}

module.exports = { checkConfiguration };