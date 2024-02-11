import { Directory, Filesystem } from '@capacitor/filesystem';

export async function getCachedImage(imageUrl: string): Promise<string> {
  // Already converted?
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith('data:')) return imageUrl;

  const imageName = imageUrl.split('/').pop();
  const fileType = imageName?.split('.').pop();
  try {
    return await read(imageName!, fileType!);
  } catch (e) {
    return await storeAndRead(imageUrl, imageName!, fileType!);
  }
}

async function read(imageName: string, fileType: string): Promise<string> {
  const readFile = await Filesystem.readFile({
    directory: Directory.Cache,
    path: `${imageName}`
  });
  return `data:image/${fileType};base64,${readFile.data}`;
}

async function storeAndRead(imageUrl: string, imageName: string, fileType: string) {
  await storeImage(imageUrl, imageName);
  return await read(imageName, fileType);
}

async function storeImage(url: string, path: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const base64Data = await blobToBase64(blob) as string;
  const savedFile = await Filesystem.writeFile({
    path: `${path}`,
    data: base64Data,
    directory: Directory.Cache
  });
  return savedFile;
}

// Hack for Capacitor with Angular: See https://github.com/ionic-team/capacitor/issues/1564
function getFileReader(): FileReader {
  const fileReader = new FileReader();
  const zoneOriginalInstance = (fileReader as any)['__zone_symbol__originalInstance'];
  return zoneOriginalInstance || fileReader;
}

function blobToBase64(blob: Blob) {
  return new Promise((resolve, reject) => {
    try {
      const reader = getFileReader(); // new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}
