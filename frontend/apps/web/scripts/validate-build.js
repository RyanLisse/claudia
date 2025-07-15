#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Build validation script for Claudia Web App
 * Validates that all required files are present and properly formatted
 */

const BUILD_DIR = path.join(__dirname, '../out');
const REQUIRED_FILES = [
  'index.html',
  'agents.html',
  'projects.html',
  'dashboard.html',
  'manifest.webmanifest',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  '_next/static',
];

const REQUIRED_ASSETS = [
  'favicon/favicon.svg',
  'favicon/favicon-96x96.png',
  'favicon/apple-touch-icon.png',
  'favicon/web-app-manifest-192x192.png',
  'favicon/web-app-manifest-512x512.png',
];

function checkFileExists(filePath) {
  const fullPath = path.join(BUILD_DIR, filePath);
  return fs.existsSync(fullPath);
}

function checkDirectoryExists(dirPath) {
  const fullPath = path.join(BUILD_DIR, dirPath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

function validateManifest() {
  const manifestPath = path.join(BUILD_DIR, 'manifest.webmanifest');
  if (!fs.existsSync(manifestPath)) {
    return false;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifest.name && manifest.short_name && manifest.icons && manifest.icons.length > 0;
  } catch (error) {
    return false;
  }
}

function validateStaticAssets() {
  const errors = [];
  const warnings = [];

  console.log('🔍 Validating build output...');

  // Check required files
  for (const file of REQUIRED_FILES) {
    if (file.includes('/')) {
      if (!checkDirectoryExists(file)) {
        errors.push(`Missing required directory: ${file}`);
      }
    } else {
      if (!checkFileExists(file)) {
        errors.push(`Missing required file: ${file}`);
      }
    }
  }

  // Check required assets
  for (const asset of REQUIRED_ASSETS) {
    if (!checkFileExists(asset)) {
      warnings.push(`Missing recommended asset: ${asset}`);
    }
  }

  // Validate manifest
  if (!validateManifest()) {
    errors.push('Invalid or missing manifest.webmanifest');
  }

  // Check for Next.js static assets
  const nextStaticDir = path.join(BUILD_DIR, '_next/static');
  if (fs.existsSync(nextStaticDir)) {
    const staticFiles = fs.readdirSync(nextStaticDir);
    if (staticFiles.length === 0) {
      warnings.push('No static assets found in _next/static');
    }
  }

  // Check index.html structure
  const indexPath = path.join(BUILD_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (!indexContent.includes('<!DOCTYPE html>')) {
      errors.push('index.html missing DOCTYPE declaration');
    }
    if (!indexContent.includes('<meta charset')) {
      warnings.push('index.html missing charset meta tag');
    }
    if (!indexContent.includes('<meta name="viewport"')) {
      warnings.push('index.html missing viewport meta tag');
    }
  }

  return { errors, warnings };
}

function calculateBuildStats() {
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    htmlFiles: 0,
    jsFiles: 0,
    cssFiles: 0,
    assetFiles: 0,
  };

  function traverseDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        traverseDirectory(filePath);
      } else {
        stats.totalFiles++;
        stats.totalSize += stat.size;
        
        const ext = path.extname(file).toLowerCase();
        if (ext === '.html') stats.htmlFiles++;
        else if (ext === '.js') stats.jsFiles++;
        else if (ext === '.css') stats.cssFiles++;
        else stats.assetFiles++;
      }
    }
  }

  if (fs.existsSync(BUILD_DIR)) {
    traverseDirectory(BUILD_DIR);
  }

  return stats;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function main() {
  console.log('🚀 Claudia Build Validation');
  console.log('=' .repeat(50));

  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  const { errors, warnings } = validateStaticAssets();
  const stats = calculateBuildStats();

  // Display results
  console.log('\n📊 Build Statistics:');
  console.log(`   Total Files: ${stats.totalFiles}`);
  console.log(`   Total Size: ${formatSize(stats.totalSize)}`);
  console.log(`   HTML Files: ${stats.htmlFiles}`);
  console.log(`   JS Files: ${stats.jsFiles}`);
  console.log(`   CSS Files: ${stats.cssFiles}`);
  console.log(`   Asset Files: ${stats.assetFiles}`);

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`   • ${error}`));
    console.log('\n💥 Build validation failed!');
    process.exit(1);
  }

  console.log('\n✅ Build validation passed!');
  console.log('\n🎉 Ready for deployment!');
}

main();