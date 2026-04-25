export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

export async function prepareMediaPayload(file, options = {}) {
  if (!file) return null;
  const maxSizeMb = options.maxSizeMb || 25;
  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`Please choose a file smaller than ${maxSizeMb}MB.`);
  }

  const dataUrl = await fileToDataUrl(file);
  const mime = file.type || '';
  const mediaType = mime.startsWith('video/') ? 'video' : mime.startsWith('image/') ? 'image' : 'document';

  return {
    mediaType,
    mediaUrl: dataUrl,
    mediaName: file.name,
    mediaPoster: '',
  };
}
