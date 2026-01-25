const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const APP_URL = 'https://rio-tamesis-app.vercel.app';
const OUTPUT_DIR = path.join(__dirname, '../public');
const QR_PATH = path.join(OUTPUT_DIR, 'app-qr.png');

async function generateQR() {
  try {
    // Ensure public directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Generate QR code
    await QRCode.toFile(QR_PATH, APP_URL, {
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#2e7d32',  // Verde oscuro (primary color)
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });

    console.log(`✅ QR code generated successfully at: ${QR_PATH}`);
    console.log(`📱 URL: ${APP_URL}`);
    console.log(`📐 Size: 512x512 pixels`);
    console.log(`🎨 Color: #2e7d32 (Verde pádel)`);
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
    process.exit(1);
  }
}

generateQR();
