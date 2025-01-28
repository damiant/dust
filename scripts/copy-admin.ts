import * as fs from 'fs';
import * as path from 'path';

function cleanAndCopyFiles(sourceFolder: string, destinationFolder: string, deleteAll: boolean): void {
  if (!doesFolderExist(sourceFolder)) {
    console.log(`Source folder ${sourceFolder} does not exist`);
    return;
  }
  // Delete all files and folders in the destination folder
  if (fs.existsSync(destinationFolder)) {
    if (deleteAll) {
      fs.rmSync(destinationFolder, { recursive: true });
    }
  }

  // // Create the destination folder if it doesn't exist
  if (!doesFolderExist(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true });
  }

  // Copy all files and folders recursively
  copyFolderRecursive(sourceFolder, destinationFolder);
}

function copyFolderRecursive(source: string, destination: string) {
  const files = fs.readdirSync(source);

  files.forEach(file => {
    const sourcePath = path.join(source, file);
    let destinationPath = path.join(destination, file);

    if (fs.lstatSync(sourcePath).isDirectory()) {
      // If it's a directory, create it and recursively copy its contents
      if (!doesFolderExist(destinationPath)) {
        fs.mkdirSync(destinationPath);
      }
      copyFolderRecursive(sourcePath, destinationPath);
    } else {
      // If it's a file, copy it
      if (sourcePath.endsWith('index.html')) {
        destinationPath = destinationPath.replace('index.html', 'admin.html');
        console.log(`Copied ${sourcePath} to ${destinationPath}`);
      }
      fs.copyFileSync(sourcePath, destinationPath);
    }
  });
}

function doesFolderExist(folderPath: string): boolean {
  try {
    fs.accessSync(folderPath);
    return true;
  } catch (err) {
    return false;
  }
}


// Example usage:
const sourceFolderPath = '../dust-admin/admin-app/www/browser';
const finalDestinationFolderPath = 'www/browser';
const destinationFolderPath = '.admin-app';

cleanAndCopyFiles(sourceFolderPath, destinationFolderPath, true);
cleanAndCopyFiles(destinationFolderPath, finalDestinationFolderPath, false);