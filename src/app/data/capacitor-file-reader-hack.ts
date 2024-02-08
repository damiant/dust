// This code is not used but is interesting and needs to be written about.
// Hack for Capacitor: See https://github.com/ionic-team/capacitor/issues/1564
function getFileReader(): FileReader {
  const fileReader = new FileReader();
  const zoneOriginalInstance = (fileReader as any)['__zone_symbol__originalInstance'];
  return zoneOriginalInstance || fileReader;
}

// Keeping this in here as its a good quirk
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
