export async function photoData(file) {
  if (!file || file.size > 20 * 1024 * 1024) throw new Error('Choose a photo under 20 MB.');
  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('Choose a JPEG, PNG or WebP photo your browser can open.'); }
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let result = canvas.toDataURL('image/jpeg', 0.84).split(',')[1];
  if (result.length > 900000) result = canvas.toDataURL('image/jpeg', 0.65).split(',')[1];
  if (result.length > 900000) throw new Error('Choose a smaller photo with less detail.');
  return result;
}
