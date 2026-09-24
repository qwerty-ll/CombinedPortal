export const initialsOf = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// A chosen profile photo is cropped to a square and shrunk to a small JPEG (about 20 KB),
// so it fits browser storage on every device — a multi-megabyte photo does not fit in Safari.
export const shrinkAvatar = (file, size = 256) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white'; // transparent PNG areas would turn black in JPEG
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    URL.revokeObjectURL(url);
    resolve(canvas.toDataURL('image/jpeg', 0.85));
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Не удалось прочитать изображение'));
  };
  img.src = url;
});
