/**
 * Script para inyectar meta tags de PWA en el HTML generado por Expo
 * iOS Safari requiere estos meta tags para modo standalone
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

const metaTags = `
    <!-- PWA iOS Meta Tags -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Reserva Pádel" />

    <!-- PWA Icons -->
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
`;

try {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Inyectar después de </title>
  html = html.replace('</title>', '</title>' + metaTags);

  fs.writeFileSync(indexPath, html);
  console.log('PWA meta tags injected successfully');
} catch (error) {
  console.error('Error injecting PWA meta tags:', error);
  process.exit(1);
}
