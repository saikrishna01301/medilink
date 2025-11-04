#!/usr/bin/env node

/**
 * Performance Monitor Script
 * Monitors frontend build performance and reports metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const PERFORMANCE_THRESHOLDS = {
    buildTime: 300000, // 5 minutes in ms
    bundleSize: 5 * 1024 * 1024, // 5MB
    pageLoadTime: 3000, // 3 seconds
    firstContentfulPaint: 2000, // 2 seconds
    largestContentfulPaint: 4000 // 4 seconds
};

const performanceReport = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    metrics: {},
    warnings: [],
    errors: []
};

/**
 * Get build directory size
 */
function getBuildSize() {
    try {
        if (!fs.existsSync('.next')) {
            return null;
        }
        
        const stats = execSync(`du -sb .next 2>/dev/null || echo "0"`, { encoding: 'utf8' });
        return parseInt(stats.trim().split('\t')[0] || stats.trim());
    } catch (error) {
        performanceReport.errors.push(`Error calculating build size: ${error.message}`);
        return null;
    }
}

/**
 * Analyze bundle sizes
 */
function analyzeBundleSizes() {
    const metrics = {
        totalSize: 0,
        chunks: [],
        pages: []
    };
    
    try {
        const staticDir = path.join('.next', 'static', 'chunks');
        if (fs.existsSync(staticDir)) {
            const files = fs.readdirSync(staticDir);
            
            files.forEach(file => {
                const filePath = path.join(staticDir, file);
                const stats = fs.statSync(filePath);
                const size = stats.size;
                
                metrics.totalSize += size;
                metrics.chunks.push({
                    name: file,
                    size: size,
                    sizeMB: (size / 1024 / 1024).toFixed(2)
                });
                
                if (size > PERFORMANCE_THRESHOLDS.bundleSize) {
                    performanceReport.warnings.push(
                        `Large bundle detected: ${file} (${(size / 1024 / 1024).toFixed(2)}MB)`
                    );
                }
            });
            
            // Sort chunks by size
            metrics.chunks.sort((a, b) => b.size - a.size);
        }
        
        // Check page sizes
        const pagesDir = path.join('.next', 'server', 'app');
        if (fs.existsSync(pagesDir)) {
            const analyzeDir = (dir) => {
                const items = fs.readdirSync(dir);
                items.forEach(item => {
                    const itemPath = path.join(dir, item);
                    const stats = fs.statSync(itemPath);
                    
                    if (stats.isDirectory()) {
                        analyzeDir(itemPath);
                    } else if (item.endsWith('.js')) {
                        const size = stats.size;
                        metrics.pages.push({
                            path: itemPath.replace('.next/', ''),
                            size: size,
                            sizeKB: (size / 1024).toFixed(2)
                        });
                    }
                });
            };
            
            analyzeDir(pagesDir);
        }
        
    } catch (error) {
        performanceReport.errors.push(`Error analyzing bundles: ${error.message}`);
    }
    
    return metrics;
}

/**
 * Check for performance issues in code
 */
function checkCodePerformance() {
    const issues = [];
    
    try {
        // Check for large images in public folder
        const publicDir = path.join('public');
        if (fs.existsSync(publicDir)) {
            const files = fs.readdirSync(publicDir, { recursive: true });
            files.forEach(file => {
                const filePath = path.join(publicDir, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (stats.isFile()) {
                        const size = stats.size;
                        const ext = path.extname(file).toLowerCase();
                        
                        if (['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(ext)) {
                            if (size > 1024 * 1024) { // 1MB
                                issues.push({
                                    type: 'large_image',
                                    file: file,
                                    size: (size / 1024 / 1024).toFixed(2) + 'MB',
                                    suggestion: 'Consider optimizing images'
                                });
                            }
                        }
                    }
                } catch (e) {
                    // Skip files that can't be accessed
                }
            });
        }
    } catch (error) {
        performanceReport.errors.push(`Error checking code performance: ${error.message}`);
    }
    
    return issues;
}

/**
 * Generate performance recommendations
 */
function generateRecommendations() {
    const recommendations = [];
    
    if (performanceReport.metrics.bundleSize) {
        const totalSizeMB = performanceReport.metrics.bundleSize.totalSize / 1024 / 1024;
        
        if (totalSizeMB > 10) {
            recommendations.push({
                type: 'bundle_size',
                priority: 'high',
                message: `Total bundle size is ${totalSizeMB.toFixed(2)}MB. Consider code splitting and lazy loading.`
            });
        }
        
        const largeChunks = performanceReport.metrics.bundleSize.chunks.filter(
            chunk => chunk.size > PERFORMANCE_THRESHOLDS.bundleSize
        );
        
        if (largeChunks.length > 0) {
            recommendations.push({
                type: 'large_chunks',
                priority: 'medium',
                message: `${largeChunks.length} large chunks detected. Review imports and dependencies.`
            });
        }
    }
    
    if (performanceReport.metrics.codeIssues) {
        const largeImages = performanceReport.metrics.codeIssues.filter(
            issue => issue.type === 'large_image'
        );
        
        if (largeImages.length > 0) {
            recommendations.push({
                type: 'image_optimization',
                priority: 'medium',
                message: `${largeImages.length} large images detected. Optimize images for web.`
            });
        }
    }
    
    return recommendations;
}

/**
 * Main performance monitoring function
 */
function runPerformanceMonitoring() {
    console.log('⚡ Starting Performance Monitoring...\n');
    
    // Get build size
    console.log('📊 Calculating build size...');
    const buildSize = getBuildSize();
    performanceReport.metrics.buildSize = buildSize ? {
        bytes: buildSize,
        mb: (buildSize / 1024 / 1024).toFixed(2)
    } : null;
    
    if (buildSize && buildSize > PERFORMANCE_THRESHOLDS.bundleSize * 2) {
        performanceReport.warnings.push(
            `Build size (${(buildSize / 1024 / 1024).toFixed(2)}MB) exceeds threshold`
        );
    }
    
    // Analyze bundle sizes
    console.log('📦 Analyzing bundle sizes...');
    performanceReport.metrics.bundleSize = analyzeBundleSizes();
    
    // Check code performance
    console.log('🔍 Checking code for performance issues...');
    performanceReport.metrics.codeIssues = checkCodePerformance();
    
    // Generate recommendations
    performanceReport.metrics.recommendations = generateRecommendations();
    
    // Determine overall status
    const hasErrors = performanceReport.errors.length > 0;
    const hasHighPriorityWarnings = performanceReport.metrics.recommendations.some(
        rec => rec.priority === 'high'
    );
    
    if (hasErrors) {
        performanceReport.status = 'error';
    } else if (hasHighPriorityWarnings || performanceReport.warnings.length > 5) {
        performanceReport.status = 'needs_attention';
    } else if (performanceReport.warnings.length > 0) {
        performanceReport.status = 'warning';
    } else {
        performanceReport.status = 'good';
    }
    
    // Generate report
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(performanceReport, null, 2));
    
    // Print summary
    console.log('\n📋 Performance Summary:');
    console.log(`Status: ${performanceReport.status.toUpperCase()}`);
    
    if (performanceReport.metrics.buildSize) {
        console.log(`Build Size: ${performanceReport.metrics.buildSize.mb}MB`);
    }
    
    if (performanceReport.metrics.bundleSize) {
        console.log(`Total Bundle Size: ${(performanceReport.metrics.bundleSize.totalSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`Chunks: ${performanceReport.metrics.bundleSize.chunks.length}`);
        console.log(`Pages: ${performanceReport.metrics.bundleSize.pages.length}`);
    }
    
    console.log(`Warnings: ${performanceReport.warnings.length}`);
    console.log(`Errors: ${performanceReport.errors.length}`);
    
    if (performanceReport.metrics.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        performanceReport.metrics.recommendations.forEach(rec => {
            console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`);
        });
    }
    
    if (performanceReport.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        performanceReport.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (performanceReport.errors.length > 0) {
        console.log('\n❌ Errors:');
        performanceReport.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    // Exit with error code if there are critical issues
    if (performanceReport.status === 'error') {
        process.exit(1);
    }
}

// Run performance monitoring
try {
    runPerformanceMonitoring();
} catch (error) {
    console.error('❌ Performance monitoring failed:', error);
    performanceReport.errors.push(`Performance monitoring script error: ${error.message}`);
    performanceReport.status = 'error';
    
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(performanceReport, null, 2));
    
    process.exit(1);
}

