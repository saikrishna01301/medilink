#!/usr/bin/env node

/**
 * Health Check Script
 * Monitors frontend application health and reports issues
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const HEALTH_CHECK_ENDPOINTS = [
    '/',
    '/api/health',
    '/api/status'
];

const healthReport = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    checks: [],
    errors: [],
    warnings: []
};

/**
 * Check if a URL is accessible
 */
function checkUrl(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const startTime = Date.now();
        
        const req = client.get(url, (res) => {
            const duration = Date.now() - startTime;
            const isHealthy = res.statusCode >= 200 && res.statusCode < 400;
            
            resolve({
                url,
                status: res.statusCode,
                healthy: isHealthy,
                duration,
                headers: res.headers
            });
            
            res.on('data', () => {}); // Consume response
            res.on('end', () => {});
        });
        
        req.on('error', (error) => {
            resolve({
                url,
                status: 'error',
                healthy: false,
                duration: Date.now() - startTime,
                error: error.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                url,
                status: 'timeout',
                healthy: false,
                duration: 10000,
                error: 'Request timeout'
            });
        });
    });
}

/**
 * Check build artifacts
 */
function checkBuildArtifacts() {
    const checks = [];
    const requiredPaths = [
        '.next',
        '.next/static',
        'package.json'
    ];
    
    requiredPaths.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);
        const exists = fs.existsSync(fullPath);
        
        checks.push({
            type: 'artifact',
            path: filePath,
            exists,
            healthy: exists
        });
        
        if (!exists) {
            healthReport.warnings.push(`Missing build artifact: ${filePath}`);
        }
    });
    
    return checks;
}

/**
 * Check file sizes for potential issues
 */
function checkFileSizes() {
    const checks = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (fs.existsSync('.next')) {
        try {
            const stats = fs.statSync('.next');
            const size = stats.size;
            const isHealthy = size < maxSize;
            
            checks.push({
                type: 'file_size',
                path: '.next',
                size,
                maxSize,
                healthy: isHealthy
            });
            
            if (!isHealthy) {
                healthReport.warnings.push(
                    `Build directory size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${maxSize / 1024 / 1024}MB)`
                );
            }
        } catch (error) {
            healthReport.errors.push(`Error checking file sizes: ${error.message}`);
        }
    }
    
    return checks;
}

/**
 * Main health check function
 */
async function runHealthChecks() {
    console.log('🏥 Starting Health Checks...\n');
    
    // Check build artifacts
    console.log('📦 Checking build artifacts...');
    const artifactChecks = checkBuildArtifacts();
    healthReport.checks.push(...artifactChecks);
    
    // Check file sizes
    console.log('📊 Checking file sizes...');
    const sizeChecks = checkFileSizes();
    healthReport.checks.push(...sizeChecks);
    
    // Check URLs if deployment URL is provided
    if (DEPLOYMENT_URL && DEPLOYMENT_URL !== 'http://localhost:3000') {
        console.log(`🌐 Checking deployment URLs (${DEPLOYMENT_URL})...`);
        
        for (const endpoint of HEALTH_CHECK_ENDPOINTS) {
            const fullUrl = `${DEPLOYMENT_URL}${endpoint}`;
            console.log(`  Checking ${fullUrl}...`);
            
            const result = await checkUrl(fullUrl);
            healthReport.checks.push({
                type: 'url_check',
                ...result
            });
            
            if (!result.healthy) {
                healthReport.errors.push(`Health check failed for ${fullUrl}: ${result.error || `Status ${result.status}`}`);
            } else if (result.duration > 5000) {
                healthReport.warnings.push(`Slow response time for ${fullUrl}: ${result.duration}ms`);
            }
        }
    } else {
        console.log('⚠️  Skipping URL checks (no deployment URL configured)');
    }
    
    // Determine overall status
    const hasErrors = healthReport.errors.length > 0;
    const hasFailures = healthReport.checks.some(check => check.healthy === false);
    
    if (hasErrors || hasFailures) {
        healthReport.status = 'unhealthy';
    } else if (healthReport.warnings.length > 0) {
        healthReport.status = 'degraded';
    } else {
        healthReport.status = 'healthy';
    }
    
    // Generate report
    const reportPath = path.join(process.cwd(), 'health-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(healthReport, null, 2));
    
    // Print summary
    console.log('\n📋 Health Check Summary:');
    console.log(`Status: ${healthReport.status.toUpperCase()}`);
    console.log(`Total Checks: ${healthReport.checks.length}`);
    console.log(`Errors: ${healthReport.errors.length}`);
    console.log(`Warnings: ${healthReport.warnings.length}`);
    
    if (healthReport.errors.length > 0) {
        console.log('\n❌ Errors:');
        healthReport.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (healthReport.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        healthReport.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    // Exit with error code if unhealthy
    if (healthReport.status === 'unhealthy') {
        process.exit(1);
    }
}

// Run health checks
runHealthChecks().catch(error => {
    console.error('❌ Health check failed:', error);
    healthReport.errors.push(`Health check script error: ${error.message}`);
    healthReport.status = 'unhealthy';
    
    const reportPath = path.join(process.cwd(), 'health-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(healthReport, null, 2));
    
    process.exit(1);
});

