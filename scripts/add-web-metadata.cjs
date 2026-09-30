const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('<title>MATMI</title>') || !html.includes('</head>')) {
  throw new Error('MATMI export metadata could not be added: unexpected index.html.');
}

const metadata = [
  '    <meta name="description" content="Understand unfamiliar food through your culture and taste." />',
  '    <meta property="og:title" content="MATMI" />',
  '    <meta property="og:description" content="Understand unfamiliar food through your culture and taste." />',
].join('\n');

const updated = html.includes('name="description"') ? html : html.replace('  </head>', `${metadata}\n  </head>`);
fs.writeFileSync(htmlPath, updated);
