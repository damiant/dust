/**
 * Dust App Cache Store - Hybrid Web/Native Caching System
 *
 * This module provides a robust caching system that works efficiently across both
 * web browsers and native mobile platforms (iOS/Android) using Capacitor.
 *
 * ARCHITECTURE:
 *
 * 1. PLATFORM DETECTION:
 *    - Uses Capacitor.isNativePlatform() to detect the runtime environment
 *    - Applies different strategies optimized for each platform
 *
 * 2. WEB ENVIRONMENT STRATEGY:
 *    - Primary: IndexedDB cache index for reliable file tracking
 *    - Reason: Capacitor Filesystem.readdir() is unreliable in web browsers
 *    - Fallback: Filesystem operations for actual file storage/retrieval
 *
 * 3. NATIVE ENVIRONMENT STRATEGY:
 *    - Primary: Native filesystem operations (readdir, stat, etc.)
 *    - Reason: Native filesystem APIs work reliably on iOS/Android
 *    - Backup: IndexedDB index maintained for consistency and performance
 *
 * 4. CACHE CATEGORIES:
 *    - AUDIO: Audio tour files (.mp3, .wav, .m4a, etc.)
 *    - IMAGE: Event and art images (.jpg, .png, .webp, etc.)
 *    - MAP: Event maps and layouts (.svg, .pdf)
 *    - OTHER: Miscellaneous cached files
 *
 * 5. EVENT-BASED ORGANIZATION:
 *    - Files are prefixed with eventId for organization
 *    - Enables bulk operations per event (download all, clear all)
 *    - Supports offline usage at Burning Man events
 *
 * 6. OFFLINE CAPABILITIES:
 *    - Pre-download audio tours for offline playback
 *    - Cache management UI for storage monitoring
 *    - Automatic cleanup and maintenance functions
 *
 * USAGE:
 * - getCachedAudio(url, eventId) - Get cached audio or download if needed
 * - preDownloadAudio(url, eventId) - Pre-download for offline use
 * - getCacheStats() - Get detailed cache statistics
 * - clearCacheByType(type) - Clear cache by file type
 * - clearCacheByEvent(eventId) - Clear cache for specific event
 */

import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { get, set, del, keys } from 'idb-keyval';

export interface CacheInfo {
  path: string;
  size: number;
  type: CacheFileType;
  eventId?: string;
  mtime: number;
}

export enum CacheFileType {
  IMAGE = 'image',
  AUDIO = 'audio',
  MAP = 'map',
  OTHER = 'other'
}

export interface CacheStats {
  totalSize: number;
  fileCount: number;
  categories: {
    [key in CacheFileType]: {
      size: number;
      count: number;
      files: CacheInfo[];
    }
  };
  byEvent: {
    [eventId: string]: {
      size: number;
      count: number;
      files: CacheInfo[];
    }
  };
}

export enum CacheDataType {
  EVENTS = 'EVENTS',
  CAMPS = 'CAMPS',
  ART = 'ART',
  RSL = 'RSL',
  PINS = 'PINS',
  LINKS = 'LINKS',
  GEO = 'GEO',
  SETTINGS = 'SETTINGS',
  FAVORITES = 'FAVORITES',
  OTHER_DATA = 'OTHER_DATA'
}

export interface DataCacheInfo {
  key: string;
  size: number;
  type: CacheDataType;
  eventId?: string;
  lastModified: number;
  itemCount?: number;
}

export interface DataCacheStats {
  totalSize: number;
  totalKeys: number;
  categories: {
    [key in CacheDataType]: {
      size: number;
      count: number;
      keys: DataCacheInfo[];
    }
  };
  byEvent: {
    [eventId: string]: {
      size: number;
      count: number;
      keys: DataCacheInfo[];
    }
  };
}

// Environment detection and cache strategy
const isNative = Capacitor.isNativePlatform();
const isWeb = !isNative;

// Cache index management using IndexedDB (works reliably in web environments)
const CACHE_INDEX_KEY = 'dust-cache-index';

// Dynamic file discovery configuration
const SUPPORTED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'];
const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const SUPPORTED_MAP_EXTENSIONS = ['svg', 'pdf'];

// Test IndexedDB functionality on module load
async function testIndexedDBFunctionality(): Promise<void> {
  if (isWeb) {
    try {
      // Test basic set/get operations
      const testKey = 'dust-test-key';
      const testValue = { test: 'data', timestamp: Date.now() };
      
      await set(testKey, testValue);
      const retrievedValue = await get(testKey);
      
      if (!retrievedValue || retrievedValue.test !== 'data') {
        console.error(`[testIndexedDBFunctionality] IndexedDB test failed - data mismatch`);
      }
      
      // Clean up test data
      await del(testKey);
      
    } catch (error) {
      console.error(`[testIndexedDBFunctionality] IndexedDB test failed:`, error);
    }
  }
}

// Run the test when the module loads
testIndexedDBFunctionality();

interface CacheIndexEntry {
  fileName: string;
  filePath: string; // Full hierarchical path: {event-id}/{category}/{filename}
  size: number;
  type: CacheFileType;
  eventId?: string;
  mtime: number;
  url: string;
}

async function addToCacheIndex(fileName: string, size: number, type: CacheFileType, eventId?: string, url?: string): Promise<void> {
  try {
    const index = await getCacheIndex();
    
    // Create hierarchical path - but for legacy files, use the fileName directly
    let filePath: string;
    if (eventId && !fileName.includes('/')) {
      // New hierarchical structure
      filePath = getHierarchicalPath(eventId, type, fileName);
    } else if (!eventId && !fileName.includes('/')) {
      // Category-only structure
      filePath = getHierarchicalPathWithoutEvent(type, fileName);
    } else {
      // Already a full path or legacy flat file
      filePath = fileName;
    }
    
    const entry: CacheIndexEntry = {
      fileName: fileName.includes('/') ? fileName.split('/').pop() || fileName : fileName,
      filePath,
      size,
      type,
      eventId,
      mtime: Date.now(),
      url: url || ''
    };
    index[filePath] = entry; // Use filePath as key
    
    await set(CACHE_INDEX_KEY, index);
    
    console.log(`[addToCacheIndex] Added entry for ${filePath} (${size} bytes, type: ${type}, eventId: ${eventId})`);
    
    // Verify the save worked immediately
    const verifyIndex = await get(CACHE_INDEX_KEY);
    if (!verifyIndex || !verifyIndex[filePath]) {
      console.error(`[addToCacheIndex] Entry ${filePath} NOT found in IndexedDB after save!`);
    }
    
  } catch (error) {
    console.error('[addToCacheIndex] Failed to update cache index:', error);
    
    // On web, this is critical; on native, it's just for optimization
    if (isWeb) {
      throw error;
    }
  }
}

async function removeFromCacheIndex(filePath: string): Promise<void> {
  try {
    const index = await getCacheIndex();
    delete index[filePath]; // Now using filePath as key instead of fileName
    await set(CACHE_INDEX_KEY, index);
  } catch (error) {
    console.error('[removeFromCacheIndex] Failed to update cache index:', error);
  }
}

async function getCacheIndex(): Promise<{[fileName: string]: CacheIndexEntry}> {
  try {
    const index = await get(CACHE_INDEX_KEY);
    return index || {};
  } catch (error) {
    console.error('[getCacheIndex] Failed to get cache index:', error);
    return {};
  }
}

export async function getCachedImage(imageUrl: string, eventId?: string): Promise<string> {
  // Already converted?
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith('data:')) return imageUrl;

  const imageName = imageUrl.split('/').pop();
  const sanitizedImageName = sanitizeFileName(imageName || '');
  const fileType = sanitizedImageName.split('.').pop();
  
  // Create hierarchical path
  const filePath = eventId
    ? getHierarchicalPath(eventId, CacheFileType.IMAGE, sanitizedImageName)
    : getHierarchicalPathWithoutEvent(CacheFileType.IMAGE, sanitizedImageName);
  
  try {
    // Check if we need to refresh the cache based on URL changes
    const shouldRefresh = await shouldRefreshCache(filePath, imageUrl);
    if (shouldRefresh) {
      return await storeAndRead(imageUrl, sanitizedImageName, fileType!, 'image', eventId);
    }
    
    return await read(filePath, fileType!, 'image');
  } catch {
    return await storeAndRead(imageUrl, sanitizedImageName, fileType!, 'image', eventId);
  }
}

export async function getCachedAudio(audioUrl: string, eventId?: string): Promise<string> {
  if (!audioUrl) return audioUrl;
  if (audioUrl.startsWith('data:')) return audioUrl;
  if (audioUrl.startsWith('blob:')) return audioUrl;

  const audioName = audioUrl.split('/').pop();
  const sanitizedAudioName = sanitizeFileName(audioName || '');
  const fileType = sanitizedAudioName.split('.').pop();
  
  // Create hierarchical path
  const filePath = eventId
    ? getHierarchicalPath(eventId, CacheFileType.AUDIO, sanitizedAudioName)
    : getHierarchicalPathWithoutEvent(CacheFileType.AUDIO, sanitizedAudioName);
  
  try {
    // Check if we need to refresh the cache based on URL changes or age
    const shouldRefresh = await shouldRefreshCache(filePath, audioUrl);
    if (shouldRefresh) {
      return await storeAndRead(audioUrl, sanitizedAudioName, fileType!, 'audio', eventId);
    }
    
    return await read(filePath, fileType!, 'audio');
  } catch {
    return await storeAndRead(audioUrl, sanitizedAudioName, fileType!, 'audio', eventId);
  }
}

export async function preDownloadAudio(audioUrl: string, eventId?: string): Promise<boolean> {
  try {
    await getCachedAudio(audioUrl, eventId);
    return true;
  } catch (error) {
    console.error(`[preDownloadAudio] Failed to cache audio:`, error);
    return false;
  }
}

export async function isAudioCached(audioUrl: string, eventId?: string): Promise<boolean> {
  if (!audioUrl) return false;
  
  const audioName = audioUrl.split('/').pop();
  const sanitizedAudioName = sanitizeFileName(audioName || '');
  
  // Create hierarchical path
  const filePath = eventId
    ? getHierarchicalPath(eventId, CacheFileType.AUDIO, sanitizedAudioName)
    : getHierarchicalPathWithoutEvent(CacheFileType.AUDIO, sanitizedAudioName);
  
  try {
    await Filesystem.stat({
      directory: Directory.Cache,
      path: filePath
    });
    return true;
  } catch {
    return false;
  }
}

export async function getCacheStats(): Promise<CacheStats> {
  const stats: CacheStats = {
    totalSize: 0,
    fileCount: 0,
    categories: {
      [CacheFileType.IMAGE]: { size: 0, count: 0, files: [] },
      [CacheFileType.AUDIO]: { size: 0, count: 0, files: [] },
      [CacheFileType.MAP]: { size: 0, count: 0, files: [] },
      [CacheFileType.OTHER]: { size: 0, count: 0, files: [] }
    },
    byEvent: {}
  };

  try {
    if (isNative) {
      // Native platform: Try filesystem readdir first, fall back to index if needed
      await getCacheStatsNative(stats);
    } else {
      // Web platform: Use IndexedDB cache index (more reliable)
      await getCacheStatsWeb(stats);
    }
  } catch (error) {
    console.error('[getCacheStats] Failed to get cache stats:', error);
  }

  return stats;
}

async function getCacheStatsNative(stats: CacheStats): Promise<void> {
  try {
    console.log('[getCacheStatsNative] Starting native cache stats scan...');
    
    // On native platforms, we need to scan the hierarchical folder structure
    // First, get the root directory contents
    const result = await Filesystem.readdir({
      directory: Directory.Cache,
      path: '.'
    });

    console.log(`[getCacheStatsNative] Found ${result.files.length} items in cache root`);

    // Process each item in the root directory
    for (const item of result.files) {
      try {
        if (item.type === 'directory') {
          // This could be an event folder or a category folder
          console.log(`[getCacheStatsNative] Scanning directory: ${item.name}`);
          await scanCacheDirectory(item.name, stats);
        } else if (item.type === 'file') {
          // Legacy flat file - process it directly
          console.log(`[getCacheStatsNative] Processing legacy file: ${item.name}`);
          await processLegacyCacheFile(item.name, stats);
        }
      } catch (error) {
        console.warn(`[getCacheStatsNative] Failed to process item ${item.name}:`, error);
      }
    }

    console.log(`[getCacheStatsNative] Completed scan. Total files: ${stats.fileCount}, Total size: ${stats.totalSize}`);
  } catch (readdirError) {
    console.warn('[getCacheStatsNative] Filesystem readdir failed, falling back to index:', readdirError);
    // Fall back to web method if filesystem readdir fails
    await getCacheStatsWeb(stats);
  }
}

// Helper function to scan a cache directory (could be event folder or category folder)
async function scanCacheDirectory(dirPath: string, stats: CacheStats): Promise<void> {
  try {
    const dirResult = await Filesystem.readdir({
      directory: Directory.Cache,
      path: dirPath
    });

    console.log(`[scanCacheDirectory] Directory ${dirPath} contains ${dirResult.files.length} items`);

    for (const item of dirResult.files) {
      if (item.type === 'directory') {
        // This is a subdirectory (likely category folder within event folder)
        const subDirPath = `${dirPath}/${item.name}`;
        console.log(`[scanCacheDirectory] Scanning subdirectory: ${subDirPath}`);
        await scanCacheSubdirectory(subDirPath, dirPath, stats);
      } else if (item.type === 'file') {
        // Direct file in directory (could be legacy or category folder)
        const filePath = `${dirPath}/${item.name}`;
        console.log(`[scanCacheDirectory] Processing file: ${filePath}`);
        await processCacheFile(filePath, dirPath, stats);
      }
    }
  } catch (error) {
    console.warn(`[scanCacheDirectory] Failed to scan directory ${dirPath}:`, error);
  }
}

// Helper function to scan a subdirectory (category folder within event folder)
async function scanCacheSubdirectory(subDirPath: string, parentEventId: string, stats: CacheStats): Promise<void> {
  try {
    const subDirResult = await Filesystem.readdir({
      directory: Directory.Cache,
      path: subDirPath
    });

    console.log(`[scanCacheSubdirectory] Subdirectory ${subDirPath} contains ${subDirResult.files.length} files`);

    for (const file of subDirResult.files) {
      if (file.type === 'file') {
        const filePath = `${subDirPath}/${file.name}`;
        console.log(`[scanCacheSubdirectory] Processing file: ${filePath}`);
        await processCacheFile(filePath, parentEventId, stats);
      }
    }
  } catch (error) {
    console.warn(`[scanCacheSubdirectory] Failed to scan subdirectory ${subDirPath}:`, error);
  }
}

// Helper function to process a cache file and add it to stats
async function processCacheFile(filePath: string, parentDir: string, stats: CacheStats): Promise<void> {
  try {
    const fileStat = await Filesystem.stat({
      directory: Directory.Cache,
      path: filePath
    });

    const fileName = filePath.split('/').pop() || filePath;
    const pathParts = filePath.split('/');
    
    // Determine if this is an event-based file or category-only file
    let eventId: string | undefined;
    
    if (pathParts.length === 3) {
      // Format: eventId/category/filename
      eventId = pathParts[0];
    } else if (pathParts.length === 2) {
      // Format: category/filename (no event) OR eventId/filename (legacy in event folder)
      // Check if parent directory looks like an event ID
      const categoryFolders = ['audio', 'image', 'map', 'other'];
      if (!categoryFolders.includes(parentDir.toLowerCase())) {
        // Parent is likely an event ID
        eventId = parentDir;
      }
    } else if (pathParts.length === 1) {
      // Legacy flat file, check if parentDir is an event ID
      if (parentDir !== '.' && parentDir !== '') {
        eventId = parentDir;
      }
    }

    const fileInfo: CacheInfo = {
      path: filePath,
      size: fileStat.size,
      type: getFileType(fileName),
      eventId: eventId,
      mtime: fileStat.mtime
    };

    // Add to event stats if we have an event ID
    if (eventId) {
      if (!stats.byEvent[eventId]) {
        stats.byEvent[eventId] = { size: 0, count: 0, files: [] };
      }
      stats.byEvent[eventId].size += fileInfo.size;
      stats.byEvent[eventId].count++;
      stats.byEvent[eventId].files.push(fileInfo);
    }

    // Add to category stats
    stats.categories[fileInfo.type].size += fileInfo.size;
    stats.categories[fileInfo.type].count++;
    stats.categories[fileInfo.type].files.push(fileInfo);
    
    // Add to total stats
    stats.totalSize += fileInfo.size;
    stats.fileCount++;

    // Also update the index for consistency - pass the full filePath as fileName for hierarchical files
    await addToCacheIndex(filePath, fileStat.size, fileInfo.type, eventId);
    
    console.log(`[processCacheFile] Processed ${filePath}: ${fileInfo.size} bytes, type: ${fileInfo.type}, eventId: ${eventId}`);
  } catch (error) {
    console.warn(`[processCacheFile] Failed to process file ${filePath}:`, error);
  }
}

// Helper function to process legacy flat cache files
async function processLegacyCacheFile(fileName: string, stats: CacheStats): Promise<void> {
  try {
    const fileStat = await Filesystem.stat({
      directory: Directory.Cache,
      path: fileName
    });

    const fileInfo: CacheInfo = {
      path: fileName,
      size: fileStat.size,
      type: getFileType(fileName),
      mtime: fileStat.mtime
    };

    // Extract event ID if present in legacy format (eventId_filename)
    const eventMatch = fileName.match(/^([^_]+)_/);
    if (eventMatch) {
      fileInfo.eventId = eventMatch[1];
      
      if (!stats.byEvent[fileInfo.eventId]) {
        stats.byEvent[fileInfo.eventId] = { size: 0, count: 0, files: [] };
      }
      stats.byEvent[fileInfo.eventId].size += fileInfo.size;
      stats.byEvent[fileInfo.eventId].count++;
      stats.byEvent[fileInfo.eventId].files.push(fileInfo);
    }

    // Add to category stats
    stats.categories[fileInfo.type].size += fileInfo.size;
    stats.categories[fileInfo.type].count++;
    stats.categories[fileInfo.type].files.push(fileInfo);
    
    // Add to total stats
    stats.totalSize += fileInfo.size;
    stats.fileCount++;

    // Also update the index for consistency
    await addToCacheIndex(fileName, fileStat.size, fileInfo.type, fileInfo.eventId);
    
    console.log(`[processLegacyCacheFile] Processed legacy file ${fileName}: ${fileInfo.size} bytes, type: ${fileInfo.type}`);
  } catch (error) {
    console.warn(`[processLegacyCacheFile] Failed to process legacy file ${fileName}:`, error);
  }
}

async function getCacheStatsWeb(stats: CacheStats): Promise<void> {
  // Web platform: Use IndexedDB cache index (more reliable than filesystem operations)
  let cacheIndex = await getCacheIndex();
  let fileNames = Object.keys(cacheIndex);

  // Check if we have an incomplete index by comparing with web registry
  const webRegistry = isWeb ? getWebFileRegistry() : {};
  const webRegistryCount = Object.keys(webRegistry).length;
  const hasIncompleteIndex = fileNames.length > 0 && webRegistryCount > fileNames.length;
  
  if (hasIncompleteIndex) {
    const discoveredIndex = await discoverCachedFilesAlternative();
    
    // Merge existing index with discovered files
    cacheIndex = { ...cacheIndex, ...discoveredIndex };
    fileNames = Object.keys(cacheIndex);
  }
  // If index is completely empty, try to rebuild it by scanning the filesystem
  else if (fileNames.length === 0) {
    cacheIndex = await rebuildCacheIndexFromFilesystem();
    fileNames = Object.keys(cacheIndex);
    
    // If filesystem scan also failed (expected in web), try alternative approach
    if (fileNames.length === 0) {
      cacheIndex = await discoverCachedFilesAlternative();
      fileNames = Object.keys(cacheIndex);
    }
  }

  for (const fileName of fileNames) {
    const indexEntry = cacheIndex[fileName];
    
    // Verify the file still exists in the filesystem
    try {
      const fileStat = await Filesystem.stat({
        directory: Directory.Cache,
        path: fileName
      });
      
      const fileInfo: CacheInfo = {
        path: fileName,
        size: indexEntry.size || fileStat.size,
        type: indexEntry.type,
        eventId: indexEntry.eventId,
        mtime: indexEntry.mtime || fileStat.mtime
      };

      // Group by event if eventId exists
      if (indexEntry.eventId) {
        if (!stats.byEvent[indexEntry.eventId]) {
          stats.byEvent[indexEntry.eventId] = { size: 0, count: 0, files: [] };
        }
        stats.byEvent[indexEntry.eventId].size += fileInfo.size;
        stats.byEvent[indexEntry.eventId].count++;
        stats.byEvent[indexEntry.eventId].files.push(fileInfo);
      }

      stats.categories[indexEntry.type].size += fileInfo.size;
      stats.categories[indexEntry.type].count++;
      stats.categories[indexEntry.type].files.push(fileInfo);
      
      stats.totalSize += fileInfo.size;
      stats.fileCount++;
    } catch {
      // File in index but not in filesystem, remove from index
      await removeFromCacheIndex(fileName);
    }
  }
}

async function discoverCachedFilesAlternative(): Promise<{[fileName: string]: CacheIndexEntry}> {
  let discoveredIndex: {[fileName: string]: CacheIndexEntry} = {};
  
  // First, try to get files from the localStorage backup registry
  if (isWeb) {
    const webRegistry = getWebFileRegistry();
    
    if (Object.keys(webRegistry).length > 0) {
      // Verify each file still exists in the filesystem
      for (const fileName of Object.keys(webRegistry)) {
        try {
          await Filesystem.stat({
            directory: Directory.Cache,
            path: fileName
          });
          
          discoveredIndex[fileName] = webRegistry[fileName];
        } catch {
          // Remove from web registry since file doesn't exist
          await removeFromWebFileRegistry(fileName);
        }
      }
      
      if (Object.keys(discoveredIndex).length > 0) {
        // Save to IndexedDB for future use
        await set(CACHE_INDEX_KEY, discoveredIndex);
        return discoveredIndex;
      }
    }
  }
  
  // In web environments, we rely primarily on the web file registry and cache index
  // rather than trying to guess filenames, since the hierarchical structure makes
  // filename guessing impractical and unnecessary
  
  // Save the discovered index to both IndexedDB and localStorage for future use
  if (Object.keys(discoveredIndex).length > 0) {
    await set(CACHE_INDEX_KEY, discoveredIndex);
    // Also populate the localStorage registry for future sessions
    if (isWeb) {
      const currentRegistry = getWebFileRegistry();
      const updatedRegistry = { ...currentRegistry, ...discoveredIndex };
      localStorage.setItem(WEB_FILE_REGISTRY_KEY, JSON.stringify(updatedRegistry));
    }
  }
  return discoveredIndex;
}


// Helper functions for hierarchical folder structure
function getHierarchicalPath(eventId: string, fileType: CacheFileType, fileName: string): string {
  // Create path: {event-id}/{category}/{filename}
  const categoryFolder = fileType.toLowerCase(); // 'audio', 'image', 'map', 'other'
  return `${eventId}/${categoryFolder}/${fileName}`;
}

function getHierarchicalPathWithoutEvent(fileType: CacheFileType, fileName: string): string {
  // For files without event association: {category}/{filename}
  const categoryFolder = fileType.toLowerCase();
  return `${categoryFolder}/${fileName}`;
}


async function ensureDirectoryExists(path: string): Promise<void> {
  try {
    await Filesystem.mkdir({
      directory: Directory.Cache,
      path: path,
      recursive: true
    });
  } catch {
    // Directory might already exist, which is fine
  }
}

async function rebuildCacheIndexFromFilesystem(): Promise<{[fileName: string]: CacheIndexEntry}> {
  const rebuiltIndex: {[fileName: string]: CacheIndexEntry} = {};
  
  try {
    // Try to read the cache directory
    const result = await Filesystem.readdir({
      directory: Directory.Cache,
      path: '.'
    });
    
    if (result.files.length === 0) {
      // For web environments, we can't reliably scan the filesystem
      // The files exist (as evidenced by successful reads), but readdir doesn't work
      if (isWeb) {
        return rebuiltIndex; // Return empty index - files exist but can't be scanned
      }
    }
    
    for (const file of result.files) {
      try {
        const fileStat = await Filesystem.stat({
          directory: Directory.Cache,
          path: file.name
        });
        
        // Extract event ID if present (format: eventId_filename)
        const eventMatch = file.name.match(/^([^_]+)_/);
        const eventId = eventMatch ? eventMatch[1] : undefined;
        const fileType = getFileType(file.name);
        
        // Create hierarchical path
        const filePath = eventId
          ? getHierarchicalPath(eventId, fileType, file.name)
          : getHierarchicalPathWithoutEvent(fileType, file.name);
        
        const entry: CacheIndexEntry = {
          fileName: file.name,
          filePath,
          size: fileStat.size,
          type: fileType,
          eventId,
          mtime: fileStat.mtime,
          url: '' // We don't have the original URL, but that's okay
        };
        
        rebuiltIndex[filePath] = entry; // Use filePath as key
      } catch {
        console.warn(`[rebuildCacheIndexFromFilesystem] Failed to stat file ${file.name}`);
      }
    }
    
    // Save the rebuilt index to IndexedDB
    if (Object.keys(rebuiltIndex).length > 0) {
      await set(CACHE_INDEX_KEY, rebuiltIndex);
    }
    
  } catch (readdirError) {
    console.warn(`[rebuildCacheIndexFromFilesystem] Failed to read cache directory:`, readdirError);
    
    if (isWeb) {
      // This is expected in web environments - Capacitor Filesystem.readdir() is not reliable in browsers
    }
  }
  
  return rebuiltIndex;
}

export async function clearCacheByType(type: CacheFileType): Promise<number> {
  let deletedCount = 0;
  
  try {
    if (isNative) {
      // Native: Try filesystem readdir first, fall back to index
      deletedCount = await clearCacheByTypeNative(type);
    } else {
      // Web: Use IndexedDB cache index
      deletedCount = await clearCacheByTypeWeb(type);
    }
  } catch (error) {
    console.error('[clearCacheByType] Failed to clear cache by type:', error);
  }

  return deletedCount;
}

async function clearCacheByTypeNative(type: CacheFileType): Promise<number> {
  let deletedCount = 0;
  
  try {
    // For hierarchical structure, we need to scan category folders
    const categoryFolder = type.toLowerCase();
    
    // First try to scan the category folder directly
    try {
      const categoryResult = await Filesystem.readdir({
        directory: Directory.Cache,
        path: categoryFolder
      });
      
      // Delete files in the category folder (files without event association)
      for (const file of categoryResult.files) {
        const filePath = `${categoryFolder}/${file.name}`;
        try {
          await Filesystem.deleteFile({
            directory: Directory.Cache,
            path: filePath
          });
          await removeFromCacheIndex(filePath);
          deletedCount++;
        } catch (error) {
          console.warn(`[clearCacheByTypeNative] Failed to delete file ${filePath}:`, error);
        }
      }
    } catch {
      // Category folder might not exist, which is fine
    }
    
    // Then scan event folders for files of this type
    try {
      const rootResult = await Filesystem.readdir({
        directory: Directory.Cache,
        path: '.'
      });
      
      for (const item of rootResult.files) {
        // Skip if it's not a directory or is the category folder we already processed
        if (item.type !== 'directory' || item.name === categoryFolder) continue;
        
        try {
          // Check if this event folder has a category subfolder
          const eventCategoryPath = `${item.name}/${categoryFolder}`;
          const eventCategoryResult = await Filesystem.readdir({
            directory: Directory.Cache,
            path: eventCategoryPath
          });
          
          // Delete files in the event's category folder
          for (const file of eventCategoryResult.files) {
            const filePath = `${eventCategoryPath}/${file.name}`;
            try {
              await Filesystem.deleteFile({
                directory: Directory.Cache,
                path: filePath
              });
              await removeFromCacheIndex(filePath);
              deletedCount++;
            } catch (error) {
              console.warn(`[clearCacheByTypeNative] Failed to delete file ${filePath}:`, error);
            }
          }
        } catch {
          // Event might not have this category, which is fine
        }
      }
    } catch (rootError) {
      console.warn('[clearCacheByTypeNative] Failed to scan root directory:', rootError);
    }
    
  } catch (readdirError) {
    console.warn('[clearCacheByTypeNative] Filesystem operations failed, falling back to index:', readdirError);
    deletedCount = await clearCacheByTypeWeb(type);
  }
  
  return deletedCount;
}

async function clearCacheByTypeWeb(type: CacheFileType): Promise<number> {
  let deletedCount = 0;
  
  const cacheIndex = await getCacheIndex();
  const filesToDelete = Object.keys(cacheIndex).filter(filePath => cacheIndex[filePath].type === type);
  
  for (const filePath of filesToDelete) {
    try {
      await Filesystem.deleteFile({
        directory: Directory.Cache,
        path: filePath // Now using hierarchical filePath instead of flat fileName
      });
      
      await removeFromCacheIndex(filePath);
      deletedCount++;
    } catch (error) {
      console.warn(`[clearCacheByTypeWeb] Failed to delete file ${filePath}:`, error);
    }
  }
  
  return deletedCount;
}

export async function clearCacheByEvent(eventId: string): Promise<number> {
  let deletedCount = 0;
  
  try {
    if (isNative) {
      // Native: Try filesystem readdir first, fall back to index
      deletedCount = await clearCacheByEventNative(eventId);
    } else {
      // Web: Use IndexedDB cache index
      deletedCount = await clearCacheByEventWeb(eventId);
    }
  } catch (error) {
    console.error('[clearCacheByEvent] Failed to clear cache by event:', error);
  }

  return deletedCount;
}

async function clearCacheByEventNative(eventId: string): Promise<number> {
  let deletedCount = 0;
  
  try {
    // For hierarchical structure, delete the entire event folder
    try {
      const eventResult = await Filesystem.readdir({
        directory: Directory.Cache,
        path: eventId
      });
      
      // Delete all category folders and their contents within the event folder
      for (const item of eventResult.files) {
        if (item.type === 'directory') {
          // This is a category folder, delete all files in it
          try {
            const categoryPath = `${eventId}/${item.name}`;
            const categoryResult = await Filesystem.readdir({
              directory: Directory.Cache,
              path: categoryPath
            });
            
            for (const file of categoryResult.files) {
              const filePath = `${categoryPath}/${file.name}`;
              try {
                await Filesystem.deleteFile({
                  directory: Directory.Cache,
                  path: filePath
                });
                await removeFromCacheIndex(filePath);
                deletedCount++;
              } catch (error) {
                console.warn(`[clearCacheByEventNative] Failed to delete file ${filePath}:`, error);
              }
            }
            
            // Try to remove the empty category directory
            try {
              await Filesystem.rmdir({
                directory: Directory.Cache,
                path: categoryPath
              });
            } catch {
              // Directory might not be empty or might not support rmdir, which is fine
            }
          } catch (categoryError) {
            console.warn(`[clearCacheByEventNative] Failed to process category ${item.name}:`, categoryError);
          }
        } else {
          // This is a direct file in the event folder (shouldn't happen with new structure, but handle legacy)
          const filePath = `${eventId}/${item.name}`;
          try {
            await Filesystem.deleteFile({
              directory: Directory.Cache,
              path: filePath
            });
            await removeFromCacheIndex(filePath);
            deletedCount++;
          } catch (error) {
            console.warn(`[clearCacheByEventNative] Failed to delete file ${filePath}:`, error);
          }
        }
      }
      
      // Try to remove the empty event directory
      try {
        await Filesystem.rmdir({
          directory: Directory.Cache,
          path: eventId
        });
      } catch {
        // Directory might not be empty or might not support rmdir, which is fine
      }
      
    } catch (eventError) {
      console.warn(`[clearCacheByEventNative] Event folder ${eventId} not found or inaccessible:`, eventError);
    }
    
    // Also check for legacy flat files with event prefix (for backward compatibility)
    try {
      const rootResult = await Filesystem.readdir({
        directory: Directory.Cache,
        path: '.'
      });

      for (const file of rootResult.files) {
        if (file.type === 'file' && file.name.startsWith(`${eventId}_`)) {
          try {
            await Filesystem.deleteFile({
              directory: Directory.Cache,
              path: file.name
            });
            await removeFromCacheIndex(file.name);
            deletedCount++;
          } catch (error) {
            console.warn(`[clearCacheByEventNative] Failed to delete legacy file ${file.name}:`, error);
          }
        }
      }
    } catch (rootError) {
      console.warn('[clearCacheByEventNative] Failed to scan root for legacy files:', rootError);
    }
    
  } catch (readdirError) {
    console.warn('[clearCacheByEventNative] Filesystem operations failed, falling back to index:', readdirError);
    deletedCount = await clearCacheByEventWeb(eventId);
  }
  
  return deletedCount;
}

async function clearCacheByEventWeb(eventId: string): Promise<number> {
  let deletedCount = 0;
  
  const cacheIndex = await getCacheIndex();
  const filesToDelete = Object.keys(cacheIndex).filter(filePath => {
    const entry = cacheIndex[filePath];
    // Match by eventId in the entry OR by hierarchical path starting with eventId OR legacy flat filename
    return entry.eventId === eventId ||
           filePath.startsWith(`${eventId}/`) ||
           filePath.startsWith(`${eventId}_`);
  });
  
  for (const filePath of filesToDelete) {
    try {
      await Filesystem.deleteFile({
        directory: Directory.Cache,
        path: filePath // Now using hierarchical filePath
      });
      
      await removeFromCacheIndex(filePath);
      deletedCount++;
    } catch (error) {
      console.warn(`[clearCacheByEventWeb] Failed to delete file ${filePath}:`, error);
    }
  }
  
  return deletedCount;
}

export async function clearCacheByEventAndType(eventId: string, type: CacheFileType): Promise<number> {
  let deletedCount = 0;
  
  try {
    if (isNative) {
      // Native: Try filesystem readdir first, fall back to index
      deletedCount = await clearCacheByEventAndTypeNative(eventId, type);
    } else {
      // Web: Use IndexedDB cache index
      deletedCount = await clearCacheByEventAndTypeWeb(eventId, type);
    }
  } catch (error) {
    console.error('[clearCacheByEventAndType] Failed to clear cache by event and type:', error);
  }

  return deletedCount;
}

async function clearCacheByEventAndTypeNative(eventId: string, type: CacheFileType): Promise<number> {
  let deletedCount = 0;
  
  try {
    const categoryFolder = type.toLowerCase();
    
    // Delete files in the event's category folder
    try {
      const eventCategoryPath = `${eventId}/${categoryFolder}`;
      const eventCategoryResult = await Filesystem.readdir({
        directory: Directory.Cache,
        path: eventCategoryPath
      });
      
      for (const file of eventCategoryResult.files) {
        const filePath = `${eventCategoryPath}/${file.name}`;
        try {
          await Filesystem.deleteFile({
            directory: Directory.Cache,
            path: filePath
          });
          await removeFromCacheIndex(filePath);
          
          // Also remove from web registry if in web environment
          if (isWeb) {
            await removeFromWebFileRegistry(filePath);
          }
          
          deletedCount++;
        } catch (error) {
          console.warn(`[clearCacheByEventAndTypeNative] Failed to delete file ${filePath}:`, error);
        }
      }
      
      // Try to remove the empty category directory
      try {
        await Filesystem.rmdir({
          directory: Directory.Cache,
          path: eventCategoryPath
        });
      } catch {
        // Directory might not be empty or might not support rmdir, which is fine
      }
      
    } catch (eventCategoryError) {
      console.warn(`[clearCacheByEventAndTypeNative] Event category folder ${eventId}/${categoryFolder} not found:`, eventCategoryError);
    }
    
    // Also check for legacy flat files with event prefix (for backward compatibility)
    try {
      const rootResult = await Filesystem.readdir({
        directory: Directory.Cache,
        path: '.'
      });

      for (const file of rootResult.files) {
        if (file.type === 'file' && file.name.startsWith(`${eventId}_`) && getFileType(file.name) === type) {
          try {
            await Filesystem.deleteFile({
              directory: Directory.Cache,
              path: file.name
            });
            await removeFromCacheIndex(file.name);
            
            if (isWeb) {
              await removeFromWebFileRegistry(file.name);
            }
            
            deletedCount++;
          } catch (error) {
            console.warn(`[clearCacheByEventAndTypeNative] Failed to delete legacy file ${file.name}:`, error);
          }
        }
      }
    } catch (rootError) {
      console.warn('[clearCacheByEventAndTypeNative] Failed to scan root for legacy files:', rootError);
    }
    
  } catch (readdirError) {
    console.warn('[clearCacheByEventAndTypeNative] Filesystem operations failed, falling back to index:', readdirError);
    deletedCount = await clearCacheByEventAndTypeWeb(eventId, type);
  }
  
  return deletedCount;
}

async function clearCacheByEventAndTypeWeb(eventId: string, type: CacheFileType): Promise<number> {
  let deletedCount = 0;
  
  const cacheIndex = await getCacheIndex();
  const filesToDelete = Object.keys(cacheIndex).filter(filePath => {
    const entry = cacheIndex[filePath];
    // Match by eventId and type, supporting both hierarchical and legacy flat paths
    return ((entry.eventId === eventId || filePath.startsWith(`${eventId}/`) || filePath.startsWith(`${eventId}_`)) &&
            entry.type === type);
  });
  
  for (const filePath of filesToDelete) {
    try {
      await Filesystem.deleteFile({
        directory: Directory.Cache,
        path: filePath // Now using hierarchical filePath
      });
      await removeFromCacheIndex(filePath);
      await removeFromWebFileRegistry(filePath);
      deletedCount++;
    } catch (error) {
      console.warn(`[clearCacheByEventAndTypeWeb] Failed to delete file ${filePath}:`, error);
    }
  }
  
  return deletedCount;
}

export async function deleteSpecificCacheFile(filePath: string): Promise<boolean> {
  try {
    await Filesystem.deleteFile({
      directory: Directory.Cache,
      path: filePath // Now using hierarchical filePath
    });
    await removeFromCacheIndex(filePath);
    return true;
  } catch (error) {
    console.error(`[deleteSpecificCacheFile] Failed to delete ${filePath}:`, error);
    return false;
  }
}

function sanitizeFileName(fileName: string): string {
  // Remove query parameters and fragments
  let sanitized = fileName.split('?')[0].split('#')[0];
  
  // Replace illegal characters with underscores
  // Illegal characters for web filesystems: < > : " | ? * \ /
  sanitized = sanitized.replace(/[<>:"|?*\\\/]/g, '_');
  
  // Remove multiple consecutive underscores
  sanitized = sanitized.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  
  // Ensure we have a valid filename
  if (!sanitized || sanitized.length === 0) {
    sanitized = `file_${Date.now()}`;
  }
  
  return sanitized;
}

function getFileType(fileName: string): CacheFileType {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext || '')) {
    return CacheFileType.IMAGE;
  }
  
  if (SUPPORTED_AUDIO_EXTENSIONS.includes(ext || '')) {
    return CacheFileType.AUDIO;
  }
  
  if (SUPPORTED_MAP_EXTENSIONS.includes(ext || '') && fileName.includes('map')) {
    return CacheFileType.MAP;
  }
  
  return CacheFileType.OTHER;
}

async function read(filePath: string, fileType: string, mediaType: 'image' | 'audio'): Promise<string> {
  const readFile = await Filesystem.readFile({
    directory: Directory.Cache,
    path: filePath
  });
  
  if (mediaType === 'audio') {
    return `data:audio/${fileType};base64,${readFile.data}`;
  } else {
    return `data:image/${fileType};base64,${readFile.data}`;
  }
}

async function storeAndRead(url: string, fileName: string, fileType: string, mediaType: 'image' | 'audio', eventId?: string) {
  await storeFile(url, fileName, eventId);
  
  // Create hierarchical path for reading
  const fileTypeEnum = getFileType(fileName);
  const filePath = eventId
    ? getHierarchicalPath(eventId, fileTypeEnum, fileName)
    : getHierarchicalPathWithoutEvent(fileTypeEnum, fileName);
  
  return await read(filePath, fileType, mediaType);
}

async function storeFile(url: string, fileName: string, eventId?: string) {
  try {
    const response = await fetch(url);

    const blob = await response.blob();

    const base64Data = await blobToBase64(blob) as string;
    
    // Determine file type and create hierarchical path
    const fileType = getFileType(fileName);
    const filePath = eventId
      ? getHierarchicalPath(eventId, fileType, fileName)
      : getHierarchicalPathWithoutEvent(fileType, fileName);
    
    // Ensure the hierarchical directory structure exists
    const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'));
    await ensureDirectoryExists(directoryPath);
    
    const savedFile = await Filesystem.writeFile({
      path: filePath,
      data: base64Data,
      directory: Directory.Cache
    });
    
    // Verify the file was actually written and get its size
    let fileSize = blob.size;
    try {
      const verifyFile = await Filesystem.stat({
        directory: Directory.Cache,
        path: filePath
      });
      fileSize = verifyFile.size;
      
      // Add to cache index for reliable tracking
      await addToCacheIndex(fileName, fileSize, fileType, eventId, url);
      
      // For web environments, also maintain a persistent file registry
      if (isWeb) {
        await addToWebFileRegistry(fileName, fileSize, fileType, eventId, url);
      }
      
    } catch (verifyError) {
      console.error(`[storeFile] File verification failed:`, verifyError);
      // Still add to index with blob size as fallback
      await addToCacheIndex(fileName, fileSize, fileType, eventId, url);
      
      if (isWeb) {
        await addToWebFileRegistry(fileName, fileSize, fileType, eventId, url);
      }
    }
    
    return savedFile;
  } catch (error) {
    console.error(`[storeFile] Error storing file ${fileName}:`, error);
    throw error;
  }
}

// Legacy function for backward compatibility
async function _storeImage(url: string, path: string) {
  return await storeFile(url, path);
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

// Additional web-specific file registry using localStorage as backup
const WEB_FILE_REGISTRY_KEY = 'dust-web-file-registry';

async function addToWebFileRegistry(fileName: string, size: number, type: CacheFileType, eventId?: string, url?: string): Promise<void> {
  try {
    const registry = getWebFileRegistry();
    
    // Create hierarchical path - but for files that already include path, use as-is
    let filePath: string;
    if (fileName.includes('/')) {
      // Already a full path
      filePath = fileName;
      fileName = fileName.split('/').pop() || fileName;
    } else if (eventId) {
      filePath = getHierarchicalPath(eventId, type, fileName);
    } else {
      filePath = getHierarchicalPathWithoutEvent(type, fileName);
    }
    
    const entry = {
      fileName,
      filePath,
      size,
      type,
      eventId,
      mtime: Date.now(),
      url: url || ''
    };
    
    registry[filePath] = entry; // Use filePath as key
    localStorage.setItem(WEB_FILE_REGISTRY_KEY, JSON.stringify(registry));
    
    console.log(`[addToWebFileRegistry] Added ${filePath} to web registry`);
  } catch (error) {
    console.error(`[addToWebFileRegistry] Failed to update web file registry:`, error);
  }
}

function getWebFileRegistry(): {[fileName: string]: CacheIndexEntry} {
  try {
    const registryData = localStorage.getItem(WEB_FILE_REGISTRY_KEY);
    if (registryData) {
      const registry = JSON.parse(registryData);
      
      return registry;
    }
  } catch (error) {
    console.error(`[getWebFileRegistry] Failed to get web file registry:`, error);
  }
  
  
  return {};
}

export async function shouldRefreshCache(filePath: string, currentUrl: string): Promise<boolean> {
  try {
    const cacheIndex = await getCacheIndex();
    const entry = cacheIndex[filePath]; // Now using filePath as key
    
    if (!entry) {
      // No cache entry, so we should cache it
      return false;
    }
    
    // Check if URL has changed (indicating file might be updated)
    if (entry.url !== currentUrl) {
      return true;
    }
    
    // Check if file is older than 24 hours (configurable freshness check)
    const now = Date.now();
    const fileAge = now - entry.mtime;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (fileAge > maxAge) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`[shouldRefreshCache] Error checking cache freshness:`, error);
    return false;
  }
}

export async function cleanupDuplicateImages(): Promise<{cleaned: number, errors: string[]}> {
  
  
  const result = { cleaned: 0, errors: [] as string[] };
  
  try {
    const cacheIndex = await getCacheIndex();
    const fileNames = Object.keys(cacheIndex);
    
    // Group files by their base name (without event prefix)
    const fileGroups: {[baseName: string]: {fileName: string, entry: CacheIndexEntry}[]} = {};
    
    for (const fileName of fileNames) {
      const entry = cacheIndex[fileName];
      
      // Only process image files
      if (entry.type !== CacheFileType.IMAGE) continue;
      
      // Extract base name (remove event prefix if present)
      let baseName = fileName;
      if (entry.eventId && fileName.startsWith(`${entry.eventId}_`)) {
        baseName = fileName.substring(`${entry.eventId}_`.length);
      }
      
      if (!fileGroups[baseName]) {
        fileGroups[baseName] = [];
      }
      
      fileGroups[baseName].push({ fileName, entry });
    }
    
    // Find and clean up duplicates
    for (const [, files] of Object.entries(fileGroups)) {
      if (files.length <= 1) continue;
      
      
      // Sort by modification time (newest first)
      files.sort((a, b) => b.entry.mtime - a.entry.mtime);
      
      // Identify files to remove:
      // 1. Old files without event association (likely pre-update duplicates)
      // 2. Keep the newest event-associated version and newest non-event version
      const filesToRemove: string[] = [];
      let hasEventVersion = false;
      let hasNonEventVersion = false;
      
      for (const file of files) {
        const hasEventId = !!file.entry.eventId;
        
        if (hasEventId) {
          if (hasEventVersion) {
            // Already have a newer event version, remove this one
            filesToRemove.push(file.fileName);
          } else {
            hasEventVersion = true;
          }
        } else {
          if (hasNonEventVersion) {
            // Already have a newer non-event version, remove this one
            filesToRemove.push(file.fileName);
          } else {
            hasNonEventVersion = true;
          }
        }
      }
      
      // If we have both event and non-event versions, prefer the event version
      // and remove the non-event version (likely the old duplicate)
      if (hasEventVersion && hasNonEventVersion) {
        const nonEventFiles = files.filter(f => !f.entry.eventId);
        for (const file of nonEventFiles) {
          if (!filesToRemove.includes(file.fileName)) {
            filesToRemove.push(file.fileName);
            
          }
        }
      }
      
      // Remove the identified duplicate files
      for (const fileName of filesToRemove) {
        try {
          await Filesystem.deleteFile({
            directory: Directory.Cache,
            path: fileName
          });
          await removeFromCacheIndex(fileName);
          
          if (isWeb) {
            await removeFromWebFileRegistry(fileName);
          }
          
          result.cleaned++;
          
        } catch (error) {
          const errorMsg = `Failed to remove ${fileName}: ${error}`;
          result.errors.push(errorMsg);
          console.error(`[cleanupDuplicateImages] ${errorMsg}`);
        }
      }
    }
    
    
    
  } catch (error) {
    const errorMsg = `Cleanup failed: ${error}`;
    result.errors.push(errorMsg);
    console.error(`[cleanupDuplicateImages] ${errorMsg}`);
  }
  
  return result;
}

export async function clearOrphanedImages(): Promise<{cleaned: number, errors: string[]}> {
  
  
  const result = { cleaned: 0, errors: [] as string[] };
  
  try {
    const cacheIndex = await getCacheIndex();
    const fileNames = Object.keys(cacheIndex);
    
    // Find image files without event association that might be orphaned
    const orphanedFiles: string[] = [];
    
    for (const fileName of fileNames) {
      const entry = cacheIndex[fileName];
      
      // Only process image files without event association
      if (entry.type !== CacheFileType.IMAGE || entry.eventId) continue;
      
      // Check if there's a newer event-associated version of this file
      const baseName = fileName;
      const eventVersionExists = fileNames.some(otherFileName => {
        const otherEntry = cacheIndex[otherFileName];
        if (otherEntry.type !== CacheFileType.IMAGE || !otherEntry.eventId) return false;
        
        // Check if this is the same file but with event prefix
        const otherBaseName = otherFileName.substring(`${otherEntry.eventId}_`.length);
        return otherBaseName === baseName && otherEntry.mtime > entry.mtime;
      });
      
      if (eventVersionExists) {
        orphanedFiles.push(fileName);
      }
    }
    
    
    // Remove orphaned files
    for (const fileName of orphanedFiles) {
      try {
        await Filesystem.deleteFile({
          directory: Directory.Cache,
          path: fileName
        });
        await removeFromCacheIndex(fileName);
        
        if (isWeb) {
          await removeFromWebFileRegistry(fileName);
        }
        
        result.cleaned++;
        
      } catch (error) {
        const errorMsg = `Failed to remove ${fileName}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`[clearOrphanedImages] ${errorMsg}`);
      }
    }
    
    
    
  } catch (error) {
    const errorMsg = `Orphaned cleanup failed: ${error}`;
    result.errors.push(errorMsg);
    console.error(`[clearOrphanedImages] ${errorMsg}`);
  }
  
  return result;
}

export interface DuplicateAnalysis {
  duplicateFiles: string[];
  totalFiles: number;
  totalSize: number;
  groups: {
    baseName: string;
    files: {fileName: string, size: number, hasEventId: boolean, mtime: number}[];
    duplicateCount: number;
    duplicateSize: number;
  }[];
}

export interface OrphanedAnalysis {
  orphanedFiles: string[];
  totalFiles: number;
  totalSize: number;
  details: {
    fileName: string;
    size: number;
    mtime: number;
    newerEventVersion?: string;
  }[];
}

export async function analyzeDuplicateImages(): Promise<DuplicateAnalysis> {
  
  
  const result: DuplicateAnalysis = {
    duplicateFiles: [],
    totalFiles: 0,
    totalSize: 0,
    groups: []
  };
  
  try {
    const cacheIndex = await getCacheIndex();
    const fileNames = Object.keys(cacheIndex);
    
    // Group files by their base name (without event prefix)
    const fileGroups: {[baseName: string]: {fileName: string, entry: CacheIndexEntry}[]} = {};
    
    for (const fileName of fileNames) {
      const entry = cacheIndex[fileName];
      
      // Only process image files
      if (entry.type !== CacheFileType.IMAGE) continue;
      
      // Extract base name (remove event prefix if present)
      let baseName = fileName;
      if (entry.eventId && fileName.startsWith(`${entry.eventId}_`)) {
        baseName = fileName.substring(`${entry.eventId}_`.length);
      }
      
      if (!fileGroups[baseName]) {
        fileGroups[baseName] = [];
      }
      
      fileGroups[baseName].push({ fileName, entry });
    }
    
    // Analyze duplicates
    for (const [baseName, files] of Object.entries(fileGroups)) {
      if (files.length <= 1) continue;
      
      
      // Sort by modification time (newest first)
      files.sort((a, b) => b.entry.mtime - a.entry.mtime);
      
      // Identify files that would be removed (same logic as cleanup function)
      const filesToRemove: string[] = [];
      let hasEventVersion = false;
      let hasNonEventVersion = false;
      
      for (const file of files) {
        const hasEventId = !!file.entry.eventId;
        
        if (hasEventId) {
          if (hasEventVersion) {
            filesToRemove.push(file.fileName);
          } else {
            hasEventVersion = true;
          }
        } else {
          if (hasNonEventVersion) {
            filesToRemove.push(file.fileName);
          } else {
            hasNonEventVersion = true;
          }
        }
      }
      
      // If we have both event and non-event versions, prefer the event version
      if (hasEventVersion && hasNonEventVersion) {
        const nonEventFiles = files.filter(f => !f.entry.eventId);
        for (const file of nonEventFiles) {
          if (!filesToRemove.includes(file.fileName)) {
            filesToRemove.push(file.fileName);
          }
        }
      }
      
      if (filesToRemove.length > 0) {
        const duplicateSize = filesToRemove.reduce((sum, fileName) => {
          const file = files.find(f => f.fileName === fileName);
          return sum + (file?.entry.size || 0);
        }, 0);
        
        result.groups.push({
          baseName,
          files: files.map(f => ({
            fileName: f.fileName,
            size: f.entry.size,
            hasEventId: !!f.entry.eventId,
            mtime: f.entry.mtime
          })),
          duplicateCount: filesToRemove.length,
          duplicateSize
        });
        
        result.duplicateFiles.push(...filesToRemove);
        result.totalFiles += filesToRemove.length;
        result.totalSize += duplicateSize;
      }
    }
    
    
  } catch (error) {
    console.error(`[analyzeDuplicateImages] Analysis failed:`, error);
  }
  
  return result;
}

export async function analyzeOrphanedImages(): Promise<OrphanedAnalysis> {
  
  
  const result: OrphanedAnalysis = {
    orphanedFiles: [],
    totalFiles: 0,
    totalSize: 0,
    details: []
  };
  
  try {
    const cacheIndex = await getCacheIndex();
    const fileNames = Object.keys(cacheIndex);
    
    // Find image files without event association that might be orphaned
    for (const fileName of fileNames) {
      const entry = cacheIndex[fileName];
      
      // Only process image files without event association
      if (entry.type !== CacheFileType.IMAGE || entry.eventId) continue;
      
      // Check if there's a newer event-associated version of this file
      const baseName = fileName;
      let newerEventVersion: string | undefined;
      
      const eventVersionExists = fileNames.some(otherFileName => {
        const otherEntry = cacheIndex[otherFileName];
        if (otherEntry.type !== CacheFileType.IMAGE || !otherEntry.eventId) return false;
        
        // Check if this is the same file but with event prefix
        const otherBaseName = otherFileName.substring(`${otherEntry.eventId}_`.length);
        const isNewer = otherBaseName === baseName && otherEntry.mtime > entry.mtime;
        
        if (isNewer) {
          newerEventVersion = otherFileName;
        }
        
        return isNewer;
      });
      
      if (eventVersionExists) {
        result.orphanedFiles.push(fileName);
        result.totalFiles++;
        result.totalSize += entry.size;
        
        result.details.push({
          fileName,
          size: entry.size,
          mtime: entry.mtime,
          newerEventVersion
        });
      }
    }
    
    
  } catch (error) {
    console.error(`[analyzeOrphanedImages] Analysis failed:`, error);
  }
  
  return result;
}

async function removeFromWebFileRegistry(filePath: string): Promise<void> {
  try {
    const registry = getWebFileRegistry();
    delete registry[filePath]; // Now using filePath as key
    localStorage.setItem(WEB_FILE_REGISTRY_KEY, JSON.stringify(registry));
    
  } catch (error) {
    console.error(`[removeFromWebFileRegistry] Failed to remove from web file registry:`, error);
  }
}

// Data Cache Management Functions

export async function getDataCacheStats(): Promise<DataCacheStats> {
  const stats: DataCacheStats = {
    totalSize: 0,
    totalKeys: 0,
    categories: {
      [CacheDataType.EVENTS]: { size: 0, count: 0, keys: [] },
      [CacheDataType.CAMPS]: { size: 0, count: 0, keys: [] },
      [CacheDataType.ART]: { size: 0, count: 0, keys: [] },
      [CacheDataType.RSL]: { size: 0, count: 0, keys: [] },
      [CacheDataType.PINS]: { size: 0, count: 0, keys: [] },
      [CacheDataType.LINKS]: { size: 0, count: 0, keys: [] },
      [CacheDataType.GEO]: { size: 0, count: 0, keys: [] },
      [CacheDataType.SETTINGS]: { size: 0, count: 0, keys: [] },
      [CacheDataType.FAVORITES]: { size: 0, count: 0, keys: [] },
      [CacheDataType.OTHER_DATA]: { size: 0, count: 0, keys: [] }
    },
    byEvent: {}
  };

  try {
    
    
    // Get all keys from IndexedDB
    const allKeys = await keys();
    
    for (const key of allKeys) {
      try {
        const value = await get(key);
        if (value === undefined) continue;
        
        // Calculate approximate size of the data
        const dataSize = calculateDataSize(value);
        const dataType = categorizeDataKey(key as string);
        const eventId = extractEventIdFromKey(key as string);
        
        const dataInfo: DataCacheInfo = {
          key: key as string,
          size: dataSize,
          type: dataType,
          eventId,
          lastModified: Date.now(), // We don't have exact modification time for IndexedDB entries
          itemCount: calculateItemCount(value)
        };
        
        // Add to category stats
        stats.categories[dataType].size += dataSize;
        stats.categories[dataType].count++;
        stats.categories[dataType].keys.push(dataInfo);
        
        // Add to event stats if applicable
        if (eventId) {
          if (!stats.byEvent[eventId]) {
            stats.byEvent[eventId] = { size: 0, count: 0, keys: [] };
          }
          stats.byEvent[eventId].size += dataSize;
          stats.byEvent[eventId].count++;
          stats.byEvent[eventId].keys.push(dataInfo);
        }
        
        stats.totalSize += dataSize;
        stats.totalKeys++;
        
      } catch (error) {
        console.warn(`[getDataCacheStats] Failed to analyze key ${key}:`, error);
      }
    }
    
    
  } catch (error) {
    console.error('[getDataCacheStats] Failed to get data cache stats:', error);
  }

  return stats;
}

function categorizeDataKey(key: string): CacheDataType {
  const lowerKey = key.toLowerCase();
  
  // Handle specific known data keys first
  if (lowerKey === 'datasets' || lowerKey === 'festivals') {
    return CacheDataType.EVENTS; // These contain event/festival information
  }
  if (lowerKey === 'location') {
    return CacheDataType.GEO; // Location data
  }
  if (lowerKey === 'ttitd') {
    return CacheDataType.OTHER_DATA; // This seems to be a specific data category
  }
  
  // Event-specific data patterns: {eventId}-events, {eventId}-camps, etc.
  if (lowerKey.includes('-events') || lowerKey.endsWith('events')) {
    return CacheDataType.EVENTS;
  }
  if (lowerKey.includes('-camps') || lowerKey.endsWith('camps')) {
    return CacheDataType.CAMPS;
  }
  if (lowerKey.includes('-art') || lowerKey.endsWith('art')) {
    return CacheDataType.ART;
  }
  if (lowerKey.includes('-rsl') || lowerKey.includes('rsl') || lowerKey.includes('music')) {
    return CacheDataType.RSL;
  }
  if (lowerKey.includes('-pins') || lowerKey.includes('pins')) {
    return CacheDataType.PINS;
  }
  if (lowerKey.includes('-links') || lowerKey.includes('links')) {
    return CacheDataType.LINKS;
  }
  if (lowerKey.includes('-geo') || lowerKey.includes('geo') || lowerKey.includes('restrooms') ||
      lowerKey.includes('medical') || lowerKey.includes('ice') || lowerKey.includes('location')) {
    return CacheDataType.GEO;
  }
  if (lowerKey.includes('settings') || lowerKey.includes('preferences') || lowerKey.includes('config')) {
    return CacheDataType.SETTINGS;
  }
  if (lowerKey.includes('favorites') || lowerKey.includes('favs') || lowerKey.includes('starred')) {
    return CacheDataType.FAVORITES;
  }
  
  return CacheDataType.OTHER_DATA;
}

function extractEventIdFromKey(key: string): string | undefined {
  // Pattern: {eventId}-{dataType} where eventId can include year like "ttitd-2024"
  // We need to distinguish between actual event IDs and data category names
  
  // First, check for patterns like "ttitd-2024-art" where "ttitd-2024" is the event ID
  const eventWithYearMatch = key.match(/^(ttitd-\d{4})-/);
  if (eventWithYearMatch) {
    const eventId = eventWithYearMatch[1];
    return eventId;
  }
  
  // Then check for other event patterns
  const match = key.match(/^([^-]+)-/);
  if (match && match[1]) {
    const potentialEventId = match[1];
    
    // Exclude known data category names that are NOT events
    const dataCategoryNames = [
      'dust', 'cache', 'web', 'test', 'datasets', 'festivals', 'location',
      'events', 'camps', 'art', 'rsl', 'pins', 'links', 'geo',
      'settings', 'favorites', 'config', 'preferences', 'mapuri'
    ];
    
    // If it's a known data category name, it's not an event ID
    if (dataCategoryNames.includes(potentialEventId.toLowerCase())) {
      return undefined;
    }
    
    // Check for event ID patterns:
    // 1. Contains a year (like "curiouser-2024")
    // 2. Is longer than 6 characters (like "curiouser")
    // 3. Specific known event patterns
    const hasYear = potentialEventId.match(/\d{4}/);
    const isLongEnough = potentialEventId.length > 6;
    const isKnownPattern = potentialEventId.match(/^ttitd$/);
    
    if (hasYear || isLongEnough || isKnownPattern) {
      return potentialEventId;
    }
    
    return undefined;
  }
  
  return undefined;
}

function calculateItemCount(data: any): number {
  try {
    // For arrays, return the length
    if (Array.isArray(data)) {
      return data.length;
    }
    
    // For objects, check if it's a data structure with items
    if (typeof data === 'object' && data !== null) {
      // Check for common data structure patterns
      if (data.items && Array.isArray(data.items)) {
        return data.items.length;
      }
      if (data.data && Array.isArray(data.data)) {
        return data.data.length;
      }
      if (data.results && Array.isArray(data.results)) {
        return data.results.length;
      }
      
      // For objects that might contain arrays of data
      const values = Object.values(data);
      const arrayValues = values.filter(v => Array.isArray(v));
      if (arrayValues.length === 1) {
        return (arrayValues[0] as any[]).length;
      }
      
      // If it's a flat object, count the keys
      return Object.keys(data).length;
    }
    
    // For primitive values, count as 1
    return 1;
  } catch (error) {
    console.warn('Error calculating item count:', error);
    return 1;
  }
}

function calculateDataSize(data: any): number {
  try {
    // Rough estimation of data size in bytes
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  } catch {
    // Fallback estimation
    if (typeof data === 'string') {
      return data.length * 2; // Rough UTF-16 estimation
    }
    if (Array.isArray(data)) {
      return data.length * 100; // Rough estimation for array items
    }
    if (typeof data === 'object') {
      return Object.keys(data).length * 50; // Rough estimation for object properties
    }
    return 50; // Default fallback
  }
}

export async function clearDataCacheByType(type: CacheDataType): Promise<number> {
  let deletedCount = 0;
  
  try {
    const allKeys = await keys();
    const keysToDelete = allKeys.filter(key => categorizeDataKey(key as string) === type);
    
    for (const key of keysToDelete) {
      try {
        await del(key);
        deletedCount++;
      } catch (error) {
        console.warn(`[clearDataCacheByType] Failed to delete key ${key}:`, error);
      }
    }
    
  } catch (error) {
    console.error('[clearDataCacheByType] Failed to clear data cache by type:', error);
  }

  return deletedCount;
}

export async function clearDataCacheByEvent(eventId: string): Promise<number> {
  let deletedCount = 0;
  
  try {
    const allKeys = await keys();
    const keysToDelete = allKeys.filter(key => {
      const keyEventId = extractEventIdFromKey(key as string);
      return keyEventId === eventId;
    });
    
    for (const key of keysToDelete) {
      try {
        await del(key);
        deletedCount++;
      } catch (error) {
        console.warn(`[clearDataCacheByEvent] Failed to delete key ${key}:`, error);
      }
    }
    
  } catch (error) {
    console.error('[clearDataCacheByEvent] Failed to clear data cache by event:', error);
  }

  return deletedCount;
}

export async function clearAllDataCache(): Promise<number> {
  let deletedCount = 0;
  
  try {
    const allKeys = await keys();
    
    // Filter out our own cache management keys to avoid breaking the system
    const keysToDelete = allKeys.filter(key => {
      const keyStr = key as string;
      return !keyStr.startsWith('dust-cache-') &&
             !keyStr.startsWith('dust-test-') &&
             !keyStr.startsWith('dust-web-file-registry');
    });
    
    for (const key of keysToDelete) {
      try {
        await del(key);
        deletedCount++;
      } catch (error) {
        console.warn(`[clearAllDataCache] Failed to delete key ${key}:`, error);
      }
    }
    
  } catch (error) {
    console.error('[clearAllDataCache] Failed to clear all data cache:', error);
  }

  return deletedCount;
}

export async function getDataCacheDetails(eventId?: string): Promise<DataCacheInfo[]> {
  const details: DataCacheInfo[] = [];
  
  try {
    const allKeys = await keys();
    
    for (const key of allKeys) {
      try {
        const keyEventId = extractEventIdFromKey(key as string);
        
        // Filter by event if specified
        if (eventId && keyEventId !== eventId) continue;
        
        const value = await get(key);
        if (value === undefined) continue;
        
        const dataSize = calculateDataSize(value);
        const dataType = categorizeDataKey(key as string);
        
        details.push({
          key: key as string,
          size: dataSize,
          type: dataType,
          eventId: keyEventId,
          lastModified: Date.now(),
          itemCount: calculateItemCount(value)
        });
        
      } catch (error) {
        console.warn(`[getDataCacheDetails] Failed to analyze key ${key}:`, error);
      }
    }
    
  } catch (error) {
    console.error('[getDataCacheDetails] Failed to get data cache details:', error);
  }
  
  return details;
}
