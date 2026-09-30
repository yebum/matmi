const fs = require('node:fs');
const path = require('node:path');

const exportDir = path.join(__dirname, '..', 'dist');
const htmlPath = path.join(exportDir, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('<title>MATMI</title>') || !html.includes('</head>')) {
  throw new Error('MATMI export metadata could not be added: unexpected index.html.');
}

for (const asset of ['brand/matmi-logo.webp', 'brand/favicon-32.png', 'brand/favicon-48.png',
  'brand/apple-touch-icon.png', 'brand/icon-192.png', 'brand/icon-512.png', 'manifest.webmanifest']) {
  if (!fs.existsSync(path.join(exportDir, asset))) throw new Error(`MATMI export is missing ${asset}.`);
}

const metadata = [
  '    <meta name="description" content="Understand unfamiliar food through your culture and taste." />',
  '    <meta property="og:title" content="MATMI" />',
  '    <meta property="og:description" content="Understand unfamiliar food through your culture and taste." />',
  '    <meta name="theme-color" content="#FFFFFF" />',
  '    <meta name="apple-mobile-web-app-capable" content="yes" />',
  '    <meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '    <meta name="apple-mobile-web-app-title" content="MATMI" />',
  '    <link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png" />',
  '    <link rel="icon" type="image/png" sizes="48x48" href="/brand/favicon-48.png" />',
  '    <link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png" />',
  '    <link rel="manifest" href="/manifest.webmanifest" />',
].join('\n');

const missing = metadata.split('\n').filter(tag => !html.includes(tag.trim()));
const updated = missing.length ? html.replace('  </head>', `${missing.join('\n')}\n  </head>`) : html;
fs.writeFileSync(htmlPath, updated);
