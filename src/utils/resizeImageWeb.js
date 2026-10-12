/**
 * Web only: scales an image (data/blob URL) down to fit maxSize×maxSize and
 * re-encodes it as JPEG, so profile photos upload small and fast.
 * Resolves with the original URI if the browser can't decode the image.
 */
export function resizeImageWeb(uri, maxSize = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        // White background so transparent PNGs don't turn black as JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(uri);
      }
    };
    img.onerror = () => resolve(uri);
    img.src = uri;
  });
}
