#!/usr/bin/env node

// =====================================================
// 📁 scripts/security-check.js - Security Audit Script
// =====================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  console.log('\n' + colorize('='.repeat(60), 'magenta'));
  console.log(colorize(`🔐 ${text}`, 'magenta'));
  console.log(colorize('='.repeat(60), 'magenta'));
}

function logSection(text) {
  console.log('\n' + colorize(`🔍 ${text}`, 'blue'));
  console.log(colorize('-'.repeat(40), 'blue'));
}

function logSuccess(text) {
  console.log(colorize(`✅ ${text}`, 'green'));
}

function logWarning(text) {
  console.log(colorize(`⚠️  ${text}`, 'yellow'));
}

function logError(text) {
  console.log(colorize(`🚨 ${text}`, 'red'));
}

function logInfo(text) {
  console.log(colorize(`ℹ️  ${text}`, 'blue'));
}

function logCritical(text) {
  console.log(colorize(`💥 CRITICAL: ${text}`, 'red'));
}

// Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(path.resolve(filePath));
  } catch (error) {
    return false;
  }
}

// Get all files in directory recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // Skip node_modules, build, and other non-source directories
      if (!['node_modules', 'build', '.git', 'dist', 'coverage'].includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Security patterns to check for
const SECURITY_PATTERNS = [
  {
    name: 'Google API Keys',
    pattern: /['"]AIzaSy[0-9A-Za-z-_]{33}['"]/g,
    severity: 'CRITICAL',
    description: 'Google API key detected'
  },
  {
    name: 'Hardcoded API Keys',
    pattern: /apiKey\s*[:=]\s*['"][A-Za-z0-9-_]{20,}['"]/g,
    severity: 'HIGH',
    description: 'Hardcoded API key'
  },
  {
    name: 'Environment Variables in Code',
    pattern: /REACT_APP_[A-Z_]+\s*[:=]\s*['"][^'"]+['"]/g,
    severity: 'MEDIUM',
    description: 'Environment variable with hardcoded value'
  },
  {
    name: 'AWS Keys',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL',
    description: 'AWS access key detected'
  },
  {
    name: 'Private Keys',
    pattern: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    description: 'Private key detected'
  },
  {
    name: 'Database URLs',
    pattern: /(mongodb|postgres|mysql):\/\/[^\s'"]+/g,
    severity: 'HIGH',
    description: 'Database connection string'
  },
  {
    name: 'JWT Tokens',
    pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
    severity: 'HIGH',
    description: 'JWT token detected'
  },
  {
    name: 'Slack Tokens',
    pattern: /xox[bpoa]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32}/g,
    severity: 'HIGH',
    description: 'Slack token detected'
  }
];

// File extensions to check
const CHECK_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.env', '.md', '.yml', '.yaml'];

// Files that should never contain credentials
const CRITICAL_FILES = [
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'README.md',
  'SECURITY_SETUP.md'
];

function checkFileForSecrets(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Skip checking template files and examples
    const fileName = path.basename(filePath);
    if (fileName.includes('.example') || fileName.includes('template') || fileName.includes('sample')) {
      return issues;
    }
    
    SECURITY_PATTERNS.forEach(({ name, pattern, severity, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        // Filter out false positives
        const realMatches = matches.filter(match => {
          // Skip comments and documentation
          const lines = content.split('\n');
          const matchLine = lines.find(line => line.includes(match));
          if (matchLine && (matchLine.trim().startsWith('//') || matchLine.trim().startsWith('*') || matchLine.includes('example') || matchLine.includes('your_api_key'))) {
            return false;
          }
          
          // Skip placeholder values
          if (match.includes('your_api_key') || match.includes('your_key_here') || match.includes('example') || match.includes('placeholder')) {
            return false;
          }
          
          return true;
        });
        
        realMatches.forEach(match => {
          issues.push({
            file: filePath,
            pattern: name,
            severity,
            description,
            match: match.substring(0, 50) + (match.length > 50 ? '...' : ''),
            line: content.substring(0, content.indexOf(match)).split('\n').length
          });
        });
      }
    });
    
    return issues;
  } catch (error) {
    return [];
  }
}

function checkGitignore() {
  logSection('Git Ignore Check');
  
  const gitignorePath = '.gitignore';
  const requiredPatterns = [
    '.env',
    '.env.local',
    '.env.development.local',
    '.env.test.local',
    '.env.production.local',
    '*.backup',
    '*.bak',
    '*-secrets.*',
    '*-credentials.*'
  ];
  
  if (!fileExists(gitignorePath)) {
    logError('No .gitignore file found');
    return false;
  }
  
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const missingPatterns = [];
  
  requiredPatterns.forEach(pattern => {
    if (!gitignoreContent.includes(pattern)) {
      missingPatterns.push(pattern);
    }
  });
  
  if (missingPatterns.length === 0) {
    logSuccess('Git ignore properly configured');
    return true;
  } else {
    logWarning(`Missing patterns in .gitignore: ${missingPatterns.join(', ')}`);
    return false;
  }
}

function checkEnvironmentFiles() {
  logSection('Environment Files Check');
  
  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  let hasIssues = false;
  
  envFiles.forEach(file => {
    if (fileExists(file)) {
      if (file === '.env.example') {
        logSuccess(`Template file found: ${file}`);
      } else {
        logWarning(`Environment file detected: ${file}`);
        logInfo('Ensure this file is in .gitignore and contains no real credentials');
        
        // Check if it's tracked by git
        try {
          execSync(`git ls-files --error-unmatch ${file}`, { stdio: 'ignore' });
          logCritical(`Environment file ${file} is tracked by Git!`);
          hasIssues = true;
        } catch (error) {
          logSuccess(`Environment file ${file} is not tracked by Git`);
        }
      }
    }
  });
  
  return !hasIssues;
}

function checkCommitHistory() {
  logSection('Git History Check');
  
  try {
    // Check recent commits for potential credential leaks
    const recentCommits = execSync('git log --oneline -10 --grep="key\\|secret\\|password\\|token" -i', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (recentCommits.trim()) {
      logWarning('Found commits with potential credential-related messages:');
      console.log(recentCommits);
    } else {
      logSuccess('No suspicious commit messages found');
    }
    
    return true;
  } catch (error) {
    logInfo('Could not check git history (no git repository or no commits)');
    return true;
  }
}

function runNpmAudit() {
  logSection('NPM Security Audit');
  
  try {
    const auditResult = execSync('npm audit --audit-level=moderate --json', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const audit = JSON.parse(auditResult);
    
    if (audit.metadata.vulnerabilities.total === 0) {
      logSuccess('No security vulnerabilities found in dependencies');
      return true;
    } else {
      const { info, low, moderate, high, critical } = audit.metadata.vulnerabilities;
      
      if (critical > 0) {
        logCritical(`${critical} critical vulnerabilities found`);
      }
      if (high > 0) {
        logError(`${high} high vulnerabilities found`);
      }
      if (moderate > 0) {
        logWarning(`${moderate} moderate vulnerabilities found`);
      }
      if (low > 0) {
        logInfo(`${low} low vulnerabilities found`);
      }
      if (info > 0) {
        logInfo(`${info} info vulnerabilities found`);
      }
      
      logInfo('Run "npm audit fix" to attempt automatic fixes');
      return critical === 0 && high === 0; // Allow moderate and below
    }
  } catch (error) {
    try {
      // Try without JSON flag for older npm versions
      execSync('npm audit', { stdio: 'inherit' });
      return true;
    } catch (error2) {
      logWarning('Could not run npm audit');
      return true;
    }
  }
}

function main() {
  logHeader('Security Audit - Vocabulary Master');
  
  let overallSecure = true;
  let criticalIssues = 0;
  let highIssues = 0;
  let mediumIssues = 0;
  
  // Check for hardcoded secrets in files
  logSection('Source Code Secret Scan');
  
  try {
    const allFiles = getAllFiles('./src');
    const sourceFiles = allFiles.filter(file => 
      CHECK_EXTENSIONS.some(ext => file.endsWith(ext))
    );
    
    let totalIssues = 0;
    
    sourceFiles.forEach(file => {
      const issues = checkFileForSecrets(file);
      if (issues.length > 0) {
        issues.forEach(issue => {
          totalIssues++;
          const icon = issue.severity === 'CRITICAL' ? '💥' : 
                      issue.severity === 'HIGH' ? '🚨' : '⚠️';
          
          console.log(`${icon} ${colorize(issue.severity, 'red')} in ${colorize(issue.file, 'yellow')}:${issue.line}`);
          console.log(`   ${issue.description}: ${colorize(issue.match, 'red')}`);
          
          if (issue.severity === 'CRITICAL') criticalIssues++;
          else if (issue.severity === 'HIGH') highIssues++;
          else mediumIssues++;
        });
      }
    });
    
    if (totalIssues === 0) {
      logSuccess('No secrets detected in source code');
    } else {
      logError(`Found ${totalIssues} potential security issues`);
      overallSecure = false;
    }
  } catch (error) {
    logWarning('Could not scan source files');
  }
  
  // Check critical files
  logSection('Critical Files Check');
  
  CRITICAL_FILES.forEach(file => {
    if (fileExists(file)) {
      const issues = checkFileForSecrets(file);
      if (issues.length > 0) {
        logCritical(`Secrets found in critical file: ${file}`);
        criticalIssues += issues.length;
        overallSecure = false;
      } else {
        logSuccess(`Clean: ${file}`);
      }
    }
  });
  
  // Run other checks
  const gitignoreOk = checkGitignore();
  const envFilesOk = checkEnvironmentFiles();
  const commitHistoryOk = checkCommitHistory();
  const npmAuditOk = runNpmAudit();
  
  overallSecure = overallSecure && gitignoreOk && envFilesOk && commitHistoryOk && npmAuditOk;
  
  // Final assessment
  logSection('Security Assessment');
  
  if (criticalIssues > 0) {
    logCritical(`${criticalIssues} critical security issues found`);
  }
  if (highIssues > 0) {
    logError(`${highIssues} high-severity issues found`);
  }
  if (mediumIssues > 0) {
    logWarning(`${mediumIssues} medium-severity issues found`);
  }
  
  if (overallSecure && criticalIssues === 0) {
    logSuccess('Security audit passed!');
    logSuccess('No critical security issues detected');
  } else {
    logError('Security audit failed!');
    logError('Critical security issues must be addressed');
  }
  
  // Recommendations
  logSection('Security Recommendations');
  
  if (criticalIssues > 0 || highIssues > 0) {
    console.log('\n' + colorize('🔥 IMMEDIATE ACTIONS REQUIRED:', 'red'));
    console.log('1. Remove all hardcoded credentials from source code');
    console.log('2. Move credentials to environment variables');
    console.log('3. Add .env* files to .gitignore');
    console.log('4. Review git history for leaked credentials');
    console.log('5. Regenerate any exposed API keys');
  }
  
  console.log('\n' + colorize('🔐 General Security Best Practices:', 'blue'));
  console.log('• Use environment variables for all secrets');
  console.log('• Keep .env files out of version control');
  console.log('• Regularly rotate API keys and credentials');
  console.log('• Run security audits before each deployment');
  console.log('• Use HTTPS for all external API calls');
  console.log('• Keep dependencies updated');
  
  console.log('\n' + colorize('📚 Resources:', 'cyan'));
  console.log('• Security Setup Guide: SECURITY_SETUP.md');
  console.log('• Environment Config: npm run config:status');
  console.log('• Git Secrets Tool: https://github.com/awslabs/git-secrets');
  
  logHeader('Security Audit Complete');
  
  // Exit with appropriate code
  const exitCode = (criticalIssues === 0 && overallSecure) ? 0 : 1;
  if (exitCode !== 0) {
    logError('Security audit failed - fix issues before deployment');
  }
  
  process.exit(exitCode);
}

// Run the security check
if (require.main === module) {
  main();
}

module.exports = { main };