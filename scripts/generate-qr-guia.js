const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const GUIA_URL = 'https://rio-tamesis-app.vercel.app/guia.html';
const OUTPUT_DIR = path.join(__dirname, '../public');
const QR_PATH = path.join(OUTPUT_DIR, 'guia-qr.png');

async function generateQR() {
  try {
    // Ensure public directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Generate QR code
    await QRCode.toFile(QR_PATH, GUIA_URL, {
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#ff9800',  // Naranja (accent color) para diferenciar
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });

    console.log(`✅ QR guía generado exitosamente en: ${QR_PATH}`);
    console.log(`📚 URL: ${GUIA_URL}`);
    console.log(`📐 Tamaño: 512x512 píxeles`);
    console.log(`🎨 Color: #ff9800 (Naranja - Guía)`);
  } catch (error) {
    console.error('❌ Error generando QR de guía:', error);
    process.exit(1);
  }
}

generateQR();
