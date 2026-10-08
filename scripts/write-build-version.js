/**
 * Writes dist/version.json with a unique build id and stamps the same id
 * into dist/service-worker.js, so every deploy is detected as a new version
 * (the app polls version.json and shows the "Actualizar" banner).
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const commit = process.env.VERCEL_GIT_COMMIT_SHA;
const buildId = commit ? `${commit.slice(0, 7)}-${Date.now()}` : String(Date.now());

fs.writeFileSync(
  path.join(distDir, 'version.json'),
  JSON.stringify({ version: buildId }),
);

const swPath = path.join(distDir, 'service-worker.js');
const sw = fs.readFileSync(swPath, 'utf8');
const stamped = sw.replace(
  /const CACHE_NAME = '[^']*';/,
  `const CACHE_NAME = 'reserva-padel-${buildId}';`,
);
if (stamped === sw) {
  console.error('❌ CACHE_NAME not found in service-worker.js');
  process.exit(1);
}
fs.writeFileSync(swPath, stamped);

console.log(`✅ Build version: ${buildId}`);
