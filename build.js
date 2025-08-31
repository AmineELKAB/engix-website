#!/usr/bin/env node

/**
 * Build script for engix.dev website
 * Optimizes files for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Building engix.dev website for production...');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Files to copy
const filesToCopy = [
    'index.html',
    'styles.css',
    'script.js',
    'config.js',
    'performance.js',
    'sw.js',
    'README.md',
    'FORM_SETUP.md',
    'DEPLOYMENT.md'
];

// Directories to copy
const dirsToCopy = [
    'images'
];

// Copy files
filesToCopy.forEach(file => {
    const sourcePath = path.join(__dirname, file);
    const destPath = path.join(distDir, file);
    
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${file}`);
    } else {
        console.log(`⚠️  Warning: ${file} not found`);
    }
});

// Copy directories
dirsToCopy.forEach(dir => {
    const sourcePath = path.join(__dirname, dir);
    const destPath = path.join(distDir, dir);
    
    if (fs.existsSync(sourcePath)) {
        copyDirectory(sourcePath, destPath);
        console.log(`✅ Copied directory ${dir}`);
    } else {
        console.log(`⚠️  Warning: directory ${dir} not found`);
    }
});

// Add cache busting to HTML
const htmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    const timestamp = Date.now();
    
    // Add cache busting to CSS and JS files
    html = html.replace(/styles\.css/g, `styles.css?v=${timestamp}`);
    html = html.replace(/script\.js/g, `script.js?v=${timestamp}`);
    html = html.replace(/config\.js/g, `config.js?v=${timestamp}`);
    html = html.replace(/performance\.js/g, `performance.js?v=${timestamp}`);
    
    fs.writeFileSync(htmlPath, html);
    console.log('✅ Added cache busting to HTML');
}

// Create .htaccess for Apache servers
const htaccessContent = `# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Redirect to HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
`;

fs.writeFileSync(path.join(distDir, '.htaccess'), htaccessContent);
console.log('✅ Created .htaccess file');

// Create robots.txt
const robotsContent = `User-agent: *
Allow: /

Sitemap: https://engix.dev/sitemap.xml
`;

fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsContent);
console.log('✅ Created robots.txt');

// Create sitemap.xml
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://engix.dev/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent);
console.log('✅ Created sitemap.xml');

console.log('\n🎉 Build completed successfully!');
console.log(`📁 Production files are in: ${distDir}`);
console.log('\n📋 Next steps:');
console.log('1. Upload the dist/ folder to your hosting provider');
console.log('2. Configure your domain and SSL certificate');
console.log('3. Test all functionality on the live site');
console.log('4. Set up monitoring and analytics');

// Helper function to copy directories recursively
function copyDirectory(source, destination) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }
    
    const files = fs.readdirSync(source);
    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    });
}
