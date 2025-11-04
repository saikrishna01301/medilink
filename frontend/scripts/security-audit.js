#!/usr/bin/env node

/**
 * Security Audit Script
 * Monitors security vulnerabilities and data protection compliance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const securityReport = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    vulnerabilities: [],
    securityIssues: [],
    dataProtection: {
        envFiles: [],
        exposedSecrets: [],
        sensitiveData: []
    },
    recommendations: []
};

/**
 * Check for exposed environment variables
 */
function checkEnvironmentFiles() {
    const issues = [];
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    
    envFiles.forEach(envFile => {
        const filePath = path.join(process.cwd(), envFile);
        if (fs.existsSync(filePath)) {
            securityReport.dataProtection.envFiles.push(envFile);
            
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    // Check for potentially exposed secrets
                    if (line.includes('SECRET') || line.includes('KEY') || line.includes('PASSWORD') || line.includes('TOKEN')) {
                        if (!line.includes('=') || line.split('=')[1].trim() !== '') {
                            issues.push({
                                type: 'exposed_secret',
                                file: envFile,
                                line: index + 1,
                                severity: 'high',
                                message: `Potential secret found in ${envFile}`
                            });
                            securityReport.dataProtection.exposedSecrets.push({
                                file: envFile,
                                line: index + 1
                            });
                        }
                    }
                });
            } catch (error) {
                securityReport.securityIssues.push(`Error reading ${envFile}: ${error.message}`);
            }
        }
    });
    
    return issues;
}

/**
 * Check for sensitive data in code
 */
function checkSensitiveData() {
    const issues = [];
    const sensitivePatterns = [
        { pattern: /password\s*=\s*['"][^'"]+['"]/gi, type: 'hardcoded_password', severity: 'high' },
        { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi, type: 'hardcoded_api_key', severity: 'high' },
        { pattern: /secret\s*=\s*['"][^'"]+['"]/gi, type: 'hardcoded_secret', severity: 'high' },
        { pattern: /token\s*=\s*['"][^'"]+['"]/gi, type: 'hardcoded_token', severity: 'high' },
        { pattern: /localhost:3000/gi, type: 'development_url', severity: 'low' }
    ];
    
    const scanDirectory = (dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) => {
        try {
            const files = fs.readdirSync(dir);
            
            files.forEach(file => {
                // Skip node_modules and .next
                if (file === 'node_modules' || file === '.next' || file === '.git') {
                    return;
                }
                
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    scanDirectory(filePath, extensions);
                } else if (extensions.some(ext => file.endsWith(ext))) {
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        
                        sensitivePatterns.forEach(({ pattern, type, severity }) => {
                            const matches = content.match(pattern);
                            if (matches) {
                                matches.forEach(match => {
                                    issues.push({
                                        type,
                                        file: filePath,
                                        severity,
                                        match: match.substring(0, 50) + '...',
                                        message: `Potential ${type} found in ${filePath}`
                                    });
                                    securityReport.dataProtection.sensitiveData.push({
                                        file: filePath,
                                        type,
                                        severity
                                    });
                                });
                            }
                        });
                    } catch (error) {
                        // Skip files that can't be read
                    }
                }
            });
        } catch (error) {
            // Skip directories that can't be accessed
        }
    };
    
    // Scan src directory
    const srcDir = path.join(process.cwd(), 'src');
    if (fs.existsSync(srcDir)) {
        scanDirectory(srcDir);
    }
    
    return issues;
}

/**
 * Check npm audit results
 */
function checkNpmAudit() {
    try {
        const auditResult = execSync('npm audit --json 2>/dev/null || echo "{}"', {
            encoding: 'utf8',
            cwd: process.cwd()
        });
        
        const audit = JSON.parse(auditResult);
        
        if (audit.vulnerabilities) {
            Object.keys(audit.vulnerabilities).forEach(pkg => {
                const vuln = audit.vulnerabilities[pkg];
                securityReport.vulnerabilities.push({
                    package: pkg,
                    severity: vuln.severity,
                    title: vuln.title,
                    dependencyOf: vuln.via || []
                });
            });
        }
        
        return audit;
    } catch (error) {
        securityReport.securityIssues.push(`Error running npm audit: ${error.message}`);
        return null;
    }
}

/**
 * Check for security headers in Next.js config
 */
function checkSecurityHeaders() {
    const issues = [];
    const configPath = path.join(process.cwd(), 'next.config.ts');
    
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            
            const requiredHeaders = [
                'X-Frame-Options',
                'X-Content-Type-Options',
                'X-XSS-Protection',
                'Strict-Transport-Security'
            ];
            
            requiredHeaders.forEach(header => {
                if (!content.includes(header)) {
                    issues.push({
                        type: 'missing_security_header',
                        header,
                        severity: 'medium',
                        message: `Missing security header: ${header}`
                    });
                }
            });
        } catch (error) {
            securityReport.securityIssues.push(`Error checking security headers: ${error.message}`);
        }
    }
    
    return issues;
}

/**
 * Generate security recommendations
 */
function generateRecommendations() {
    const recommendations = [];
    
    // High severity vulnerabilities
    const highSeverityVulns = securityReport.vulnerabilities.filter(
        v => v.severity === 'high' || v.severity === 'critical'
    );
    
    if (highSeverityVulns.length > 0) {
        recommendations.push({
            priority: 'high',
            message: `Found ${highSeverityVulns.length} high/critical vulnerabilities. Run 'npm audit fix' to resolve.`
        });
    }
    
    // Exposed secrets
    if (securityReport.dataProtection.exposedSecrets.length > 0) {
        recommendations.push({
            priority: 'high',
            message: 'Potential secrets found in environment files. Review and secure sensitive data.'
        });
    }
    
    // Sensitive data in code
    const highSeverityData = securityReport.dataProtection.sensitiveData.filter(
        d => d.severity === 'high'
    );
    
    if (highSeverityData.length > 0) {
        recommendations.push({
            priority: 'high',
            message: `Found ${highSeverityData.length} instances of potentially sensitive data in code. Review and remove hardcoded secrets.`
        });
    }
    
    // Missing security headers
    const missingHeaders = securityReport.securityIssues.filter(
        issue => issue.type === 'missing_security_header'
    );
    
    if (missingHeaders.length > 0) {
        recommendations.push({
            priority: 'medium',
            message: 'Consider adding security headers to Next.js configuration.'
        });
    }
    
    return recommendations;
}

/**
 * Main security audit function
 */
function runSecurityAudit() {
    console.log('🔒 Starting Security Audit...\n');
    
    // Check environment files
    console.log('🔐 Checking environment files...');
    const envIssues = checkEnvironmentFiles();
    securityReport.securityIssues.push(...envIssues);
    
    // Check for sensitive data
    console.log('🔍 Scanning code for sensitive data...');
    const dataIssues = checkSensitiveData();
    securityReport.securityIssues.push(...dataIssues);
    
    // Check npm audit
    console.log('📦 Running npm audit...');
    checkNpmAudit();
    
    // Check security headers
    console.log('🛡️  Checking security headers...');
    const headerIssues = checkSecurityHeaders();
    securityReport.securityIssues.push(...headerIssues);
    
    // Generate recommendations
    securityReport.recommendations = generateRecommendations();
    
    // Determine overall status
    const hasHighSeverityVulns = securityReport.vulnerabilities.some(
        v => v.severity === 'high' || v.severity === 'critical'
    );
    const hasHighSeverityIssues = securityReport.securityIssues.some(
        issue => issue.severity === 'high'
    );
    
    if (hasHighSeverityVulns || hasHighSeverityIssues) {
        securityReport.status = 'critical';
    } else if (securityReport.vulnerabilities.length > 0 || securityReport.securityIssues.length > 0) {
        securityReport.status = 'warning';
    } else {
        securityReport.status = 'secure';
    }
    
    // Generate report
    const reportPath = path.join(process.cwd(), 'security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(securityReport, null, 2));
    
    // Print summary
    console.log('\n📋 Security Audit Summary:');
    console.log(`Status: ${securityReport.status.toUpperCase()}`);
    console.log(`Vulnerabilities: ${securityReport.vulnerabilities.length}`);
    console.log(`Security Issues: ${securityReport.securityIssues.length}`);
    console.log(`Environment Files Found: ${securityReport.dataProtection.envFiles.length}`);
    console.log(`Potential Secrets: ${securityReport.dataProtection.exposedSecrets.length}`);
    console.log(`Sensitive Data Instances: ${securityReport.dataProtection.sensitiveData.length}`);
    
    if (securityReport.vulnerabilities.length > 0) {
        console.log('\n🚨 Vulnerabilities:');
        securityReport.vulnerabilities.slice(0, 10).forEach(vuln => {
            console.log(`  [${vuln.severity.toUpperCase()}] ${vuln.package}: ${vuln.title}`);
        });
        if (securityReport.vulnerabilities.length > 10) {
            console.log(`  ... and ${securityReport.vulnerabilities.length - 10} more`);
        }
    }
    
    if (securityReport.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        securityReport.recommendations.forEach(rec => {
            console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`);
        });
    }
    
    if (securityReport.securityIssues.length > 0) {
        console.log('\n⚠️  Security Issues:');
        securityReport.securityIssues.slice(0, 10).forEach(issue => {
            console.log(`  [${issue.severity || 'medium'}] ${issue.message || issue}`);
        });
        if (securityReport.securityIssues.length > 10) {
            console.log(`  ... and ${securityReport.securityIssues.length - 10} more`);
        }
    }
    
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    // Exit with error code if critical issues found
    if (securityReport.status === 'critical') {
        process.exit(1);
    }
}

// Run security audit
try {
    runSecurityAudit();
} catch (error) {
    console.error('❌ Security audit failed:', error);
    securityReport.securityIssues.push(`Security audit script error: ${error.message}`);
    securityReport.status = 'error';
    
    const reportPath = path.join(process.cwd(), 'security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(securityReport, null, 2));
    
    process.exit(1);
}

