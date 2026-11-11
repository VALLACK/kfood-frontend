const MAX_SIDE = 2048;
const TARGET_BYTES = 3 * 1024 * 1024;
const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
const MAX_PIXELS = 60_000_000;
const PASSTHROUGH_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This photo could not be read. Please choose a JPG, PNG, or WebP image. For HEIC photos, save a JPG copy first.'));
    };
    // The browser applies EXIF orientation when decoding the image.
    image.src = url;
  });
}

function encodeJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('This photo could not be prepared. Please choose another image.'));
    }, 'image/jpeg', quality);
  });
}

export async function prepareMenuImage(source, fileName) {
  const isBlob = source instanceof Blob;
  if (isBlob && (!source.size || source.size > MAX_SOURCE_BYTES)) {
    throw new Error('Please choose a photo smaller than 30 MB, or photograph the menu in sections.');
  }
  if (isBlob && source.type && !source.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, or WebP).');
  }
  const image = isBlob ? await loadImage(source) : source;
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height || width * height > MAX_PIXELS) {
    throw new Error('This photo is too large to process. Please photograph the menu in smaller sections.');
  }
  if (isBlob && PASSTHROUGH_TYPES.has(source.type) && Math.max(width, height) <= MAX_SIDE && source.size <= TARGET_BYTES) {
    return { blob: source, fileName };
  }

  const ratio = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo processing is unavailable. Please try another browser.');
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.85, 0.8, 0.75]) {
      const blob = await encodeJpeg(canvas, quality);
      if (blob.size <= TARGET_BYTES) {
        const base = fileName.replace(/\.[^.]+$/, '') || 'menu';
        return { blob, fileName: `${base}.jpg` };
      }
    }
    throw new Error('This photo is still too large. Please photograph the menu in sections so the text stays readable.');
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
