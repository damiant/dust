import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  ToastController,
  AlertController,
  IonicSafeString
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  downloadOutline,
  trashOutline,
  refreshOutline,
  musicalNotesOutline,
  imagesOutline,
  mapOutline,
  documentOutline,
  cloudDownloadOutline,
  checkmarkCircleOutline,
  timeOutline,
  buildOutline,
  copyOutline,
  trashBinOutline,
  calendarOutline,
  homeOutline,
  colorPaletteOutline,
  locationOutline,
  linkOutline,
  settingsOutline,
  heartOutline,
  chevronDownOutline,
  chevronForwardOutline,
  folderOutline
} from 'ionicons/icons';
import { CacheStats, CacheFileType, getCacheStats, clearCacheByType, clearCacheByEvent, clearCacheByEventAndType, preDownloadAudio, getCachedImage, cleanupDuplicateImages, clearOrphanedImages, analyzeDuplicateImages, analyzeOrphanedImages, DuplicateAnalysis, OrphanedAnalysis, getDataCacheStats, clearDataCacheByType, clearDataCacheByEvent, clearAllDataCache, CacheDataType, DataCacheStats, shouldRefreshCache, isAudioCached } from '../data/cache-store';
import { DbService } from '../data/db.service';
import { SettingsService } from '../data/settings.service';
import { Art, Dataset } from '../data/models';
import { ApiService, DownloadStatus } from '../data/api.service';

interface EventCacheInfo {
  eventId: string;
  eventName: string;
  size: number;
  count: number;
  audioFiles: number;
  imageFiles: number;
}

@Component({
  selector: 'app-cache-management',
  templateUrl: './cache-management.page.html',
  styleUrls: ['./cache-management.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonLabel,
    IonText,
    IonProgressBar,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent,
    IonChip
  ]
})
export class CacheManagementPage implements OnInit {
  private db = inject(DbService);
  private settings = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private api = inject(ApiService);

  cacheStats = signal<CacheStats | null>(null);
  dataCacheStats = signal<DataCacheStats | null>(null);
  loading = signal(true);
  selectedSegment = signal<'overview' | 'categories' | 'events' | 'data'>('overview');
  eventCacheInfo = signal<EventCacheInfo[]>([]);
  downloadingAudio = signal<Set<string>>(new Set());
  currentEventName = signal<string>('');
  downloadProgress = signal<{
    current: number;
    total: number;
    currentFile: string;
    isDownloading: boolean;
  }>({ current: 0, total: 0, currentFile: '', isDownloading: false });
  downloadCancelled = signal<boolean>(false);
  duplicateAnalysis = signal<DuplicateAnalysis | null>(null);
  orphanedAnalysis = signal<OrphanedAnalysis | null>(null);
  analyzingDuplicates = signal<boolean>(false);
  analyzingOrphaned = signal<boolean>(false);
  expandedDataSections = signal<Set<string>>(new Set());
  downloadingData = signal<boolean>(false);
  downloadStatus = signal<DownloadStatus>({ status: '', firstDownload: false });

  readonly CacheFileType = CacheFileType;
  readonly CacheDataType = CacheDataType;

  constructor() {
    addIcons({
      saveOutline,
      downloadOutline,
      trashOutline,
      refreshOutline,
      musicalNotesOutline,
      imagesOutline,
      mapOutline,
      documentOutline,
      cloudDownloadOutline,
      checkmarkCircleOutline,
      timeOutline,
      buildOutline,
      copyOutline,
      trashBinOutline,
      calendarOutline,
      homeOutline,
      colorPaletteOutline,
      locationOutline,
      linkOutline,
      settingsOutline,
      heartOutline,
      chevronDownOutline,
      chevronForwardOutline,
      folderOutline
    });
  }

  async ngOnInit() {
    // Set current event name
    this.currentEventName.set(this.settings.eventTitle() || 'Current Event');
    await this.loadCacheStats();
  }

  async loadCacheStats() {
    this.loading.set(true);
    try {
      const [fileStats, dataStats] = await Promise.all([
        getCacheStats(),
        getDataCacheStats()
      ]);
      this.cacheStats.set(fileStats);
      this.dataCacheStats.set(dataStats);
      await this.buildEventCacheInfo(fileStats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
      await this.presentToast('Failed to load cache statistics', 'danger');
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  private async buildEventCacheInfo(stats: CacheStats) {
    const eventInfo: EventCacheInfo[] = [];
    
    for (const [eventId, data] of Object.entries(stats.byEvent)) {
      const audioFiles = data.files.filter(f => f.type === CacheFileType.AUDIO).length;
      const imageFiles = data.files.filter(f => f.type === CacheFileType.IMAGE).length;
      
      // Try to get event name from current dataset
      let eventName = eventId;
      try {
        if (eventId === this.settings.settings.datasetId) {
          eventName = this.settings.eventTitle() || eventId;
        }
      } catch {
        // Use eventId as fallback
      }

      eventInfo.push({
        eventId,
        eventName,
        size: data.size,
        count: data.count,
        audioFiles,
        imageFiles
      });
    }

    // Sort by size (largest first)
    eventInfo.sort((a, b) => b.size - a.size);
    this.eventCacheInfo.set(eventInfo);
  }

  async onRefresh(event: any) {
    await this.loadCacheStats();
    event.target.complete();
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getTypeIcon(type: CacheFileType): string {
    switch (type) {
      case CacheFileType.AUDIO: return 'musical-notes-outline';
      case CacheFileType.IMAGE: return 'images-outline';
      case CacheFileType.MAP: return 'map-outline';
      default: return 'document-outline';
    }
  }

  getTypeColor(type: CacheFileType): string {
    switch (type) {
      case CacheFileType.AUDIO: return 'success';
      case CacheFileType.IMAGE: return 'tertiary';
      case CacheFileType.MAP: return 'warning';
      default: return 'medium';
    }
  }

  async clearCacheByType(type: CacheFileType) {
    const alert = await this.alertController.create({
      header: 'Clear Cache',
      message: `Are you sure you want to delete all ${type} files? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              const deletedCount = await clearCacheByType(type);
              await this.presentToast(`Deleted ${deletedCount} ${type} files`, 'success');
              await this.loadCacheStats();
            } catch (error) {
              console.error('Failed to clear cache:', error);
              await this.presentToast('Failed to clear cache', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async clearEventCache(eventId: string, eventName: string) {
    const alert = await this.alertController.create({
      header: 'Clear Event Cache',
      message: `Are you sure you want to delete all cached files for "${eventName}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              const deletedCount = await clearCacheByEvent(eventId);
              await this.presentToast(`Deleted ${deletedCount} files for ${eventName}`, 'success');
              await this.loadCacheStats();
            } catch (error) {
              console.error('Failed to clear event cache:', error);
              await this.presentToast('Failed to clear event cache', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async clearEventCacheByType(eventId: string, eventName: string, type: CacheFileType) {
    const typeDisplayName = type.charAt(0).toUpperCase() + type.slice(1);
    
    const alert = await this.alertController.create({
      header: 'Clear Event Cache by Type',
      message: `Are you sure you want to delete all ${typeDisplayName.toLowerCase()} files for "${eventName}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              const deletedCount = await clearCacheByEventAndType(eventId, type);
              await this.presentToast(`Deleted ${deletedCount} ${typeDisplayName.toLowerCase()} files for ${eventName}`, 'success');
              await this.loadCacheStats();
            } catch (error) {
              console.error('Failed to clear event cache by type:', error);
              await this.presentToast('Failed to clear cache', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async analyzeDuplicates() {
    this.analyzingDuplicates.set(true);
    try {
      const analysis = await analyzeDuplicateImages();
      this.duplicateAnalysis.set(analysis);
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Failed to analyze duplicates:', error);
      await this.presentToast('Failed to analyze duplicate files', 'danger');
    } finally {
      this.analyzingDuplicates.set(false);
      this.cdr.markForCheck();
    }
  }

  async analyzeOrphaned() {
    this.analyzingOrphaned.set(true);
    try {
      const analysis = await analyzeOrphanedImages();
      this.orphanedAnalysis.set(analysis);
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Failed to analyze orphaned files:', error);
      await this.presentToast('Failed to analyze orphaned files', 'danger');
    } finally {
      this.analyzingOrphaned.set(false);
      this.cdr.markForCheck();
    }
  }

  async cleanupDuplicates() {
    // First analyze to show user what will be cleaned
    await this.analyzeDuplicates();
    const analysis = this.duplicateAnalysis();
    
    if (!analysis || analysis.totalFiles === 0) {
      await this.presentToast('No duplicate files found to clean up', 'success');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Clean Up Duplicate Images',
      message: `Found ${analysis.totalFiles} duplicate files (${this.formatBytes(analysis.totalSize)}) that can be safely removed.\n\nThis will remove old duplicate image files that were cached before the event-aware system was implemented. This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: `Clean Up ${analysis.totalFiles} Files`,
          role: 'destructive',
          handler: async () => {
            try {
              const result = await cleanupDuplicateImages();
              if (result.errors.length > 0) {
                await this.presentToast(`Cleaned ${result.cleaned} files with ${result.errors.length} errors`, 'warning');
                console.error('Cleanup errors:', result.errors);
              } else {
                await this.presentToast(`Successfully cleaned up ${result.cleaned} duplicate files (${this.formatBytes(analysis.totalSize)} freed)`, 'success');
              }
              // Clear analysis after cleanup
              this.duplicateAnalysis.set(null);
              await this.loadCacheStats();
            } catch (error) {
              console.error('Failed to cleanup duplicates:', error);
              await this.presentToast('Failed to cleanup duplicate files', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async cleanupOrphaned() {
    // First analyze to show user what will be cleaned
    await this.analyzeOrphaned();
    const analysis = this.orphanedAnalysis();
    
    if (!analysis || analysis.totalFiles === 0) {
      await this.presentToast('No orphaned files found to clean up', 'success');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Clean Up Orphaned Images',
      message: `Found ${analysis.totalFiles} orphaned files (${this.formatBytes(analysis.totalSize)}) that can be safely removed.\n\nThis will remove old image files that have newer event-associated versions. This helps free up storage space.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: `Clean Up ${analysis.totalFiles} Files`,
          role: 'destructive',
          handler: async () => {
            try {
              const result = await clearOrphanedImages();
              if (result.errors.length > 0) {
                await this.presentToast(`Cleaned ${result.cleaned} files with ${result.errors.length} errors`, 'warning');
                console.error('Cleanup errors:', result.errors);
              } else {
                await this.presentToast(`Successfully cleaned up ${result.cleaned} orphaned files (${this.formatBytes(analysis.totalSize)} freed)`, 'success');
              }
              // Clear analysis after cleanup
              this.orphanedAnalysis.set(null);
              await this.loadCacheStats();
            } catch (error) {
              console.error('Failed to cleanup orphaned files:', error);
              await this.presentToast('Failed to cleanup orphaned files', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async preDownloadAudioTours() {
    try {
      console.log('Attempting to get art data using different methods...');
      
      let arts: Art[] = [];
      
      // Try 1: Direct data access using readData
      try {
        const datasetId = this.settings.settings.datasetId;
        console.log(`Current dataset ID: ${datasetId}`);
        
        const artData = await this.db.readData(datasetId, 'art');
        if (artData && Array.isArray(artData)) {
          arts = artData;
          console.log(`readData(${datasetId}, 'art') returned ${arts.length} art pieces`);
        } else {
          console.log(`readData returned:`, artData);
        }
      } catch (error) {
        console.error('readData failed:', error);
      }
      
      // Try 2: Use findAll method to get art
      if (arts.length === 0) {
        try {
          const allData = await this.db.findAll('', undefined, '', undefined, undefined, true, true, 10000);
          arts = allData.art || [];
          console.log(`findAll returned ${arts.length} art pieces`);
        } catch (error) {
          console.error('findAll failed:', error);
        }
      }
      
      // Try 3: Use getArtList with empty array (might return all)
      if (arts.length === 0) {
        try {
          arts = await this.db.getArtList([]);
          console.log(`getArtList([]) returned ${arts.length} art pieces`);
        } catch (error) {
          console.error('getArtList failed:', error);
        }
      }
      
      // Try 4: Original findArts approach
      if (arts.length === 0) {
        try {
          arts = await this.db.findArts('', undefined, 10000);
          console.log(`findArts('', undefined, 10000) returned ${arts.length} art pieces`);
        } catch (error) {
          console.error('findArts failed:', error);
        }
      }
      
      console.log(`Total art pieces found: ${arts.length}`);
      if (arts.length > 0) {
        console.log('Sample art piece:', arts[0]);
        console.log('Art piece properties:', Object.keys(arts[0]));
      }
      
      const audioArts = arts.filter(art => {
        const hasAudio = art.audio && art.audio.trim() !== '';
        if (hasAudio) {
          console.log(`Art with audio: ${art.name} - ${art.audio}`);
        }
        return hasAudio;
      });
      
      console.log(`Found ${audioArts.length} art pieces with audio:`, audioArts.map(a => ({ name: a.name, audio: a.audio })));
      
      if (audioArts.length === 0) {
        await this.presentToast(`No audio tours found for ${this.currentEventName()}. Found ${arts.length} total art pieces.`, 'warning');
        return;
      }

      const alert = await this.alertController.create({
        header: `Download Audio Tours for ${this.currentEventName()}`,
        message: `Found ${audioArts.length} audio tour files for ${this.currentEventName()}. Download all for offline use?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Download',
            handler: async () => {
              // Dismiss the confirmation dialog first
              await alert.dismiss();
              // Show progress dialog and start download
              await this.showDownloadProgressDialog(audioArts);
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      console.error('Failed to get audio tours:', error);
      await this.presentToast('Failed to load audio tours', 'danger');
    }
  }

  async preDownloadImages() {
    try {
      console.log('Attempting to get art data for image downloads...');
      
      let arts: Art[] = [];
      
      // Try to get art data using the same methods as audio downloads
      try {
        const datasetId = this.settings.settings.datasetId;
        console.log(`Current dataset ID: ${datasetId}`);
        
        const artData = await this.db.readData(datasetId, 'art');
        if (artData && Array.isArray(artData)) {
          arts = artData;
          console.log(`readData(${datasetId}, 'art') returned ${arts.length} art pieces`);
        }
      } catch (error) {
        console.error('readData failed:', error);
      }
      
      // Fallback methods if needed
      if (arts.length === 0) {
        try {
          const allData = await this.db.findAll('', undefined, '', undefined, undefined, true, true, 10000);
          arts = allData.art || [];
          console.log(`findAll returned ${arts.length} art pieces`);
        } catch (error) {
          console.error('findAll failed:', error);
        }
      }
      
      console.log(`Total art pieces found: ${arts.length}`);
      
      // Find art pieces with images
      const imageArts = arts.filter(art => {
        const hasImage = art.images && art.images.length > 0 &&
          art.images.some(img => img.thumbnail_url && img.thumbnail_url.trim() !== '');
        if (hasImage) {
          console.log(`Art with images: ${art.name} - ${art.images.length} images`);
        }
        return hasImage;
      });
      
      console.log(`Found ${imageArts.length} art pieces with images`);
      
      if (imageArts.length === 0) {
        await this.presentToast(`No images found for ${this.currentEventName()}. Found ${arts.length} total art pieces.`, 'warning');
        return;
      }

      // Count total images with valid URLs
      const totalImages = imageArts.reduce((total, art) => {
        const validImages = art.images?.filter(img => img.thumbnail_url && img.thumbnail_url.trim() !== '') || [];
        return total + validImages.length;
      }, 0);

      const alert = await this.alertController.create({
        header: `Download Images for ${this.currentEventName()}`,
        message: `Found ${totalImages} downloadable images from ${imageArts.length} art pieces for ${this.currentEventName()}. Download all for offline use?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Download',
            handler: async () => {
              // Dismiss the confirmation dialog first
              await alert.dismiss();
              // Show progress dialog and start download
              await this.showImageDownloadProgressDialog(imageArts);
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      console.error('Failed to get images:', error);
      await this.presentToast('Failed to load images', 'danger');
    }
  }

  private async showImageDownloadProgressDialog(arts: Art[]) {
    // Count total images with valid URLs (matching the actual download logic)
    const totalImages = arts.reduce((total, art) => {
      const validImages = art.images?.filter(img => img.thumbnail_url && img.thumbnail_url.trim() !== '') || [];
      return total + validImages.length;
    }, 0);
    
    // Reset progress state
    this.downloadCancelled.set(false);
    this.downloadProgress.set({
      current: 0,
      total: totalImages,
      currentFile: '',
      isDownloading: true
    });

    const progressAlert = await this.alertController.create({
      header: 'Downloading Images',
      message: new IonicSafeString(this.buildProgressMessage(0, totalImages, 'Preparing...')),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.downloadCancelled.set(true);
            this.downloadProgress.update(p => ({ ...p, isDownloading: false }));
            return true;
          }
        }
      ],
      backdropDismiss: false,
      cssClass: 'download-progress-alert'
    });

    await progressAlert.present();

    // Start the download process
    try {
      await this.downloadImageFiles(arts, progressAlert);
    } finally {
      // Ensure dialog is dismissed
      await progressAlert.dismiss();
      this.downloadProgress.update(p => ({ ...p, isDownloading: false }));
    }
  }

  private async downloadImageFiles(arts: Art[], progressAlert?: HTMLIonAlertElement) {
    let successCount = 0;
    let failCount = 0;
    let _skippedCount = 0;
    let currentIndex = 0;
    const failedImages: { artName: string; imageUrl: string; reason: string }[] = [];

    for (const art of arts) {
      // Check if download was cancelled
      if (this.downloadCancelled()) {
        console.log('Image download cancelled by user');
        break;
      }

      if (!art.images || art.images.length === 0) continue;
      
      // Filter to only valid images with thumbnail URLs
      const validImages = art.images.filter(img => {
        const url = img.thumbnail_url?.trim();
        if (!url) return false;
        
        // Skip obviously invalid URLs
        if (url.startsWith('data:') || url.startsWith('blob:')) {
          _skippedCount++;
          console.log(`Skipping data/blob URL for ${art.name}`);
          return false;
        }
        
        // Basic URL validation
        try {
          new URL(url);
          return true;
        } catch {
          _skippedCount++;
          console.log(`Skipping invalid URL for ${art.name}: ${url}`);
          return false;
        }
      });
      
      for (const image of validImages) {
        // Check if download was cancelled
        if (this.downloadCancelled()) {
          console.log('Image download cancelled by user');
          break;
        }

        currentIndex++;
        
        // Update progress
        this.downloadProgress.update(p => ({
          ...p,
          current: currentIndex,
          currentFile: `${art.name} - Image ${validImages.indexOf(image) + 1}`
        }));

        // Update progress dialog if it exists
        if (progressAlert) {
          const currentFileName = `${art.name} - Image ${validImages.indexOf(image) + 1}`;
          progressAlert.message = new IonicSafeString(this.buildProgressMessage(currentIndex, this.downloadProgress().total, currentFileName));
        }
        
        try {
          const eventId = this.settings.settings.datasetId;
          
          // Check if already cached to avoid unnecessary downloads
          const imageName = image.thumbnail_url!.split('/').pop();
          const sanitizedImageName = this.sanitizeFileName(imageName || '');
          const filePath = eventId
            ? `${eventId}/image/${sanitizedImageName}`
            : `image/${sanitizedImageName}`;
          
          // Check if file already exists and is fresh
          const shouldRefresh = await this.shouldRefreshCache(filePath, image.thumbnail_url!);
          
          if (!shouldRefresh) {
            // File exists and is fresh, skip download
            successCount++;
            continue;
          }
          
          await getCachedImage(image.thumbnail_url!, eventId);
          successCount++;
        } catch (error) {
          const errorMessage = this.getDownloadErrorReason(error, image.thumbnail_url!);
          console.error(`Failed to download image for ${art.name}:`, error);
          failedImages.push({
            artName: art.name,
            imageUrl: image.thumbnail_url!,
            reason: errorMessage
          });
          failCount++;
        }
      }

      if (this.downloadCancelled()) break;
    }

    // Show completion message if not cancelled
    if (!this.downloadCancelled()) {
      let message = '';
      if (successCount > 0 && failCount === 0) {
        message = `Successfully downloaded ${successCount} images for offline use`;
      } else if (successCount > 0 && failCount > 0) {
        message = `Downloaded ${successCount} images, ${failCount} failed (${successCount} available offline)`;
      } else if (failCount > 0) {
        message = `Failed to download ${failCount} images`;
      } else {
        message = 'No images were downloaded';
      }
      
      await this.presentToast(message, failCount > 0 ? 'warning' : 'success');
    } else {
      await this.presentToast(
        `Download cancelled. ${successCount} images downloaded and available offline.`,
        'warning'
      );
    }
    
    await this.loadCacheStats();
  }

  private async showDownloadProgressDialog(arts: Art[]) {
    // Reset progress state
    this.downloadCancelled.set(false);
    this.downloadProgress.set({
      current: 0,
      total: arts.length,
      currentFile: '',
      isDownloading: true
    });

    const progressAlert = await this.alertController.create({
      header: 'Downloading Audio Tours',
      message: new IonicSafeString(this.buildProgressMessage(0, arts.length, 'Preparing...')),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.downloadCancelled.set(true);
            this.downloadProgress.update(p => ({ ...p, isDownloading: false }));
            return true;
          }
        }
      ],
      backdropDismiss: false,
      cssClass: 'download-progress-alert'
    });

    await progressAlert.present();

    // Start the download process
    try {
      await this.downloadAudioFiles(arts, progressAlert);
    } finally {
      // Ensure dialog is dismissed
      await progressAlert.dismiss();
      this.downloadProgress.update(p => ({ ...p, isDownloading: false }));
    }
  }

  private async downloadAudioFiles(arts: Art[], progressAlert?: HTMLIonAlertElement) {
    const eventId = this.settings.settings.datasetId;
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < arts.length; i++) {
      const art = arts[i];
      
      // Check if download was cancelled
      if (this.downloadCancelled()) {
        console.log('Download cancelled by user');
        break;
      }

      if (!art.audio) continue;
      
      // Update progress
      this.downloadProgress.update(p => ({
        ...p,
        current: i + 1,
        currentFile: art.name || `File ${i + 1}`
      }));

      // Check if file already exists and is fresh
      const audioName = art.audio.split('/').pop();
      const sanitizedAudioName = this.sanitizeFileName(audioName || '');
      const fileName = eventId ? `${this.sanitizeFileName(eventId)}_${sanitizedAudioName}` : sanitizedAudioName;
      
      let statusMessage = 'Checking...';
      
      try {
        // Check if we need to refresh the cache
        const needsRefresh = await this.shouldRefreshCache(fileName, art.audio);
        const fileExists = await this.isAudioCached(art.audio, eventId);
        
        if (fileExists && !needsRefresh) {
          statusMessage = 'Already cached (skipping)';
          skippedCount++;
        } else if (fileExists && needsRefresh) {
          statusMessage = 'Updating cached file...';
        } else {
          statusMessage = 'Downloading...';
        }
        
        // Update progress dialog if it exists
        if (progressAlert) {
          const currentFileName = `${art.name || `File ${i + 1}`} - ${statusMessage}`;
          progressAlert.message = new IonicSafeString(this.buildProgressMessage(i + 1, arts.length, currentFileName));
        }
        
        // Skip if file is fresh
        if (fileExists && !needsRefresh) {
          continue;
        }
        
        this.downloadingAudio.update(set => new Set([...set, art.uid]));
        const success = await preDownloadAudio(art.audio, eventId);
        if (success) {
          if (fileExists && needsRefresh) {
            updatedCount++;
          } else {
            successCount++;
          }
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Failed to download audio for ${art.name}:`, error);
        failCount++;
      } finally {
        this.downloadingAudio.update(set => {
          const newSet = new Set(set);
          newSet.delete(art.uid);
          return newSet;
        });
      }
    }

    // Show completion message if not cancelled
    if (!this.downloadCancelled()) {
      const messages = [];
      if (successCount > 0) messages.push(`${successCount} new files downloaded`);
      if (updatedCount > 0) messages.push(`${updatedCount} files updated`);
      if (skippedCount > 0) messages.push(`${skippedCount} files already current`);
      if (failCount > 0) messages.push(`${failCount} failed`);
      
      const message = messages.length > 0 ? messages.join(', ') : 'No changes needed';
      await this.presentToast(message, failCount > 0 ? 'warning' : 'success');
    } else {
      await this.presentToast(
        `Download cancelled. ${successCount + updatedCount} files processed before cancellation.`,
        'warning'
      );
    }
    
    await this.loadCacheStats();
  }

  isDownloading(artId: string): boolean {
    return this.downloadingAudio().has(artId);
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  segmentChanged(event: any) {
    this.selectedSegment.set(event.detail.value);
  }

  getDataTypeIcon(type: CacheDataType): string {
    switch (type) {
      case CacheDataType.EVENTS: return 'calendar-outline';
      case CacheDataType.CAMPS: return 'home-outline';
      case CacheDataType.ART: return 'color-palette-outline';
      case CacheDataType.RSL: return 'musical-notes-outline';
      case CacheDataType.PINS: return 'location-outline';
      case CacheDataType.LINKS: return 'link-outline';
      case CacheDataType.GEO: return 'map-outline';
      case CacheDataType.SETTINGS: return 'settings-outline';
      case CacheDataType.FAVORITES: return 'heart-outline';
      default: return 'document-outline';
    }
  }

  getDataTypeColor(type: CacheDataType): string {
    switch (type) {
      case CacheDataType.EVENTS: return 'primary';
      case CacheDataType.CAMPS: return 'secondary';
      case CacheDataType.ART: return 'tertiary';
      case CacheDataType.RSL: return 'success';
      case CacheDataType.PINS: return 'warning';
      case CacheDataType.LINKS: return 'danger';
      case CacheDataType.GEO: return 'dark';
      case CacheDataType.SETTINGS: return 'medium';
      case CacheDataType.FAVORITES: return 'light';
      default: return 'medium';
    }
  }

  async clearDataCacheByType(type: CacheDataType) {
    const typeDisplayName = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    
    const alert = await this.alertController.create({
      header: 'Clear Data Cache',
      message: `Are you sure you want to delete all ${typeDisplayName} data? This will remove locally stored ${typeDisplayName.toLowerCase()} information and may require re-downloading when you use the app. This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              const deletedCount = await clearDataCacheByType(type);
              await this.presentToast(`Deleted ${deletedCount} ${typeDisplayName.toLowerCase()} data entries`, 'success');
              await this.loadCacheStats();
            } catch (error) {
              console.error('Failed to clear data cache:', error);
              await this.presentToast('Failed to clear data cache', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async clearEventDataCache(eventId: string, eventName: string) {
    // Get detailed breakdown of what will be deleted
    const dataDetails = this.getEventDataDetails(eventId);
    const dataInfo = this.getEventDataInfo(eventId);
    
    let detailMessage = '';
    if (dataDetails.length > 0) {
      detailMessage = '\n\nData to be removed:\n';
      for (const detail of dataDetails) {
        detailMessage += `• ${detail.type}: ${detail.count} records (${this.formatBytes(detail.size)})\n`;
      }
    }

    const alert = await this.alertController.create({
      header: 'Clear Event Data Cache',
      message: `Are you sure you want to delete all cached data for "${eventName}"?${detailMessage}\n\nThis action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: `Delete ${dataInfo?.count || 0} Records`,
          role: 'destructive',
          handler: async () => {
            try {
              const deletedCount = await clearDataCacheByEvent(eventId);
              await this.presentToast(`Deleted ${deletedCount} data records for ${eventName}`, 'success');
              await this.loadCacheStats();
            } catch (error) {
              console.error('Failed to clear event data cache:', error);
              await this.presentToast('Failed to clear event data cache', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async clearAllDataCache() {
    const alert = await this.alertController.create({
      header: 'Clear All Data Cache',
      message: `Are you sure you want to delete ALL cached data? This will remove all locally stored events, camps, art, settings, and other app data. You will need to re-download all information when you use the app. This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete All Data',
          role: 'destructive',
          handler: async () => {
            try {
              const deletedCount = await clearAllDataCache();
              await this.presentToast(`Deleted ${deletedCount} data entries`, 'success');
              await this.loadCacheStats();
            } catch (error) {
              console.error('Failed to clear all data cache:', error);
              await this.presentToast('Failed to clear all data cache', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Helper method for template to access Object.entries
  getObjectEntries(obj: any): [string, any][] {
    return Object.entries(obj);
  }

  // Helper method for template to access Object.keys
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  // Helper methods for the download process
  private sanitizeFileName(fileName: string): string {
    let sanitized = fileName.split('?')[0].split('#')[0];
    sanitized = sanitized.replace(/[<>:"|?*\\\/]/g, '_');
    sanitized = sanitized.replace(/_+/g, '_');
    sanitized = sanitized.replace(/^_+|_+$/g, '');
    if (!sanitized || sanitized.length === 0) {
      sanitized = `file_${Date.now()}`;
    }
    return sanitized;
  }

  private async shouldRefreshCache(fileName: string, currentUrl: string): Promise<boolean> {
    try {
      return await shouldRefreshCache(fileName, currentUrl);
    } catch (error) {
      console.error('Error checking cache freshness:', error);
      return false;
    }
  }

  private async isAudioCached(audioUrl: string, eventId?: string): Promise<boolean> {
    try {
      return await isAudioCached(audioUrl, eventId);
    } catch (error) {
      console.error('Error checking if audio is cached:', error);
      return false;
    }
  }

  // Get data cache info for a specific event
  getEventDataInfo(eventId: string): { count: number; size: number } | null {
    const dataStats = this.dataCacheStats();
    if (!dataStats || !dataStats.byEvent[eventId]) {
      return null;
    }
    
    // Calculate total item count from all data keys for this event
    const eventData = dataStats.byEvent[eventId];
    const totalItemCount = eventData.keys.reduce((total, keyInfo) => {
      return total + (keyInfo.itemCount || 0);
    }, 0);
    
    return {
      count: totalItemCount, // Use actual item count instead of key count
      size: eventData.size
    };
  }

  // Debug method to see all available data keys
  getAllDataKeys(): string[] {
    const dataStats = this.dataCacheStats();
    if (!dataStats) return [];
    
    const allKeys: string[] = [];
    for (const category of Object.values(dataStats.categories)) {
      for (const keyInfo of category.keys) {
        allKeys.push(keyInfo.key);
      }
    }
    return allKeys;
  }

  // Debug method to see all byEvent keys
  getAllEventDataKeys(): string[] {
    const dataStats = this.dataCacheStats();
    if (!dataStats) return [];
    return Object.keys(dataStats.byEvent);
  }

  // Get detailed data breakdown for an event
  getEventDataDetails(eventId: string): { type: string; keys: string[]; count: number; size: number }[] {
    const dataStats = this.dataCacheStats();
    if (!dataStats || !dataStats.byEvent[eventId]) {
      return [];
    }

    const eventData = dataStats.byEvent[eventId];
    const details: { type: string; keys: string[]; count: number; size: number }[] = [];
    
    // Group the keys by data type
    const typeGroups: { [type: string]: { keys: string[]; size: number; itemCount: number } } = {};
    
    for (const dataInfo of eventData.keys) {
      const typeName = this.getDataTypeDisplayName(dataInfo.type);
      if (!typeGroups[typeName]) {
        typeGroups[typeName] = { keys: [], size: 0, itemCount: 0 };
      }
      typeGroups[typeName].keys.push(dataInfo.key);
      typeGroups[typeName].size += dataInfo.size;
      typeGroups[typeName].itemCount += dataInfo.itemCount || 0;
    }
    
    // Convert to array format
    for (const [type, group] of Object.entries(typeGroups)) {
      details.push({
        type,
        keys: group.keys,
        count: group.itemCount, // Use itemCount instead of keys.length
        size: group.size
      });
    }
    
    return details.sort((a, b) => b.size - a.size); // Sort by size, largest first
  }

  // Get display name for data type
  private getDataTypeDisplayName(type: CacheDataType): string {
    switch (type) {
      case CacheDataType.EVENTS: return 'Events';
      case CacheDataType.CAMPS: return 'Camps';
      case CacheDataType.ART: return 'Art';
      case CacheDataType.RSL: return 'Music/RSL';
      case CacheDataType.PINS: return 'Pins';
      case CacheDataType.LINKS: return 'Links';
      case CacheDataType.GEO: return 'Location/Geo';
      case CacheDataType.SETTINGS: return 'Settings';
      case CacheDataType.FAVORITES: return 'Favorites';
      default: return 'Other Data';
    }
  }

  // Clear both files and data for an event
  async clearEventEverything(eventId: string, eventName: string) {
    // Get detailed breakdown of what will be deleted
    const eventInfo = this.eventCacheInfo().find(e => e.eventId === eventId);
    const dataDetails = this.getEventDataDetails(eventId);
    const dataInfo = this.getEventDataInfo(eventId);
    
    let detailMessage = `\nContent to be deleted for "${eventName}":\n\n`;
    
    // File details
    if (eventInfo) {
      detailMessage += `📁 FILES (${this.formatBytes(eventInfo.size)}):\n`;
      if (eventInfo.audioFiles > 0) {
        detailMessage += `• ${eventInfo.audioFiles} audio files\n`;
      }
      if (eventInfo.imageFiles > 0) {
        detailMessage += `• ${eventInfo.imageFiles} image files\n`;
      }
      detailMessage += '\n';
    }
    
    // Data details
    if (dataDetails.length > 0) {
      detailMessage += `📊 DATA (${this.formatBytes(dataInfo?.size || 0)}):\n`;
      for (const detail of dataDetails) {
        detailMessage += `• ${detail.type}: ${detail.count} records\n`;
      }
      detailMessage += '\n';
    }
    
    detailMessage += `This action cannot be undone.`;

    const totalFiles = eventInfo ? eventInfo.count : 0;
    const totalData = dataInfo ? dataInfo.count : 0;
    const buttonText = `Delete ${totalFiles} Files & ${totalData} Data Records`;

    const alert = await this.alertController.create({
      header: 'Clear All Event Content',
      message: detailMessage,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: buttonText,
          role: 'destructive',
          handler: async () => {
            try {
              // Clear both files and data
              const [filesDeleted, dataDeleted] = await Promise.all([
                clearCacheByEvent(eventId),
                clearDataCacheByEvent(eventId)
              ]);
              
              await this.presentToast(
                `Successfully deleted ${filesDeleted} files and ${dataDeleted} data records for ${eventName}`,
                'success'
              );
              await this.loadCacheStats();
            } catch (error) {
              console.error('Failed to clear all event data:', error);
              await this.presentToast('Failed to clear all event data', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Get all events that have either files or data
  getAllEventsWithData(): EventCacheInfo[] {
    const fileEvents = this.eventCacheInfo();
    const dataStats = this.dataCacheStats();
    const allEventIds = new Set<string>();
    
    // Add events with files
    fileEvents.forEach(event => allEventIds.add(event.eventId));
    
    // Add events with data
    if (dataStats) {
      Object.keys(dataStats.byEvent).forEach(eventId => allEventIds.add(eventId));
    }
    
    // Create EventCacheInfo objects for all events
    const allEvents: EventCacheInfo[] = [];
    
    for (const eventId of allEventIds) {
      const fileEvent = fileEvents.find(e => e.eventId === eventId);
      
      if (fileEvent) {
        // Use existing file event data
        allEvents.push(fileEvent);
      } else {
        // Create a new entry for data-only events
        let eventName = eventId;
        try {
          if (eventId === this.settings.settings.datasetId) {
            eventName = this.settings.eventTitle() || eventId;
          }
        } catch {
          // Use eventId as fallback
        }
        
        allEvents.push({
          eventId,
          eventName,
          size: 0,
          count: 0,
          audioFiles: 0,
          imageFiles: 0
        });
      }
    }
    
    // Sort by size (largest first), then by name
    return allEvents.sort((a, b) => {
      if (b.size !== a.size) {
        return b.size - a.size;
      }
      return a.eventName.localeCompare(b.eventName);
    });
  }

  // Toggle data section expansion
  toggleDataSection(eventId: string): void {
    const expanded = this.expandedDataSections();
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    
    this.expandedDataSections.set(newExpanded);
  }

  // Check if data section is expanded
  isDataSectionExpanded(eventId: string): boolean {
    return this.expandedDataSections().has(eventId);
  }

  // Build progress message with HTML progress bar
  private buildProgressMessage(current: number, total: number, currentFile: string): string {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const progressBarWidth = Math.max(percentage, 2); // Minimum 2% width for visibility
    
    return `
      <div class="download-progress-container">
        <p>Downloading files for offline use...</p>
        
        <div class="progress-info">
          <span>Progress: ${current} / ${total}</span>
          <span>${percentage}%</span>
        </div>
        
        <div class="progress-bar-container">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${progressBarWidth}%"></div>
          </div>
        </div>
        
        <div class="current-file">
          <strong>Current:</strong> ${currentFile || 'Preparing...'}
        </div>
      </div>
    `;
  }

  private getDownloadErrorReason(error: any, imageUrl: string): string {
    if (!error) return 'Unknown error';
    
    const errorMessage = error.message || error.toString();
    
    // Network-related errors
    if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
      return 'Network error - check internet connection';
    }
    
    // CORS errors
    if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
      return 'CORS error - image server blocks downloads';
    }
    
    // 404 errors
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return 'Image not found (404)';
    }
    
    // 403 errors
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return 'Access forbidden (403)';
    }
    
    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return 'Download timeout';
    }
    
    // Invalid URL format
    if (imageUrl && (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1'))) {
      return 'Invalid URL (localhost)';
    }
    
    // File system errors
    if (errorMessage.includes('filesystem') || errorMessage.includes('storage')) {
      return 'Storage error - insufficient space?';
    }
    
    // Generic HTTP errors
    if (errorMessage.match(/\b[45]\d{2}\b/)) {
      const statusMatch = errorMessage.match(/\b([45]\d{2})\b/);
      return `HTTP error (${statusMatch ? statusMatch[1] : 'unknown'})`;
    }
    
    // Default fallback
    return `Download failed: ${errorMessage.substring(0, 50)}${errorMessage.length > 50 ? '...' : ''}`;
  }

  async downloadData() {
    try {
      this.downloadingData.set(true);
      this.downloadStatus.set({ status: 'Checking for updates...', firstDownload: false });
      
      if (this.db.networkStatus() == 'none') {
        await this.presentToast('No network connection. Please check your internet connection.', 'danger');
        return;
      }

      // Ensure DB is initialized and add delay like home page does
      this.db.checkInit();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the dataset the same way the home page does
      let dataset;
      try {
        dataset = this.db.selectedDataset();
        if (!dataset) {
          throw new Error('No dataset selected');
        }
        console.log('Cache management using dataset:', dataset);
      } catch (error) {
        console.error('Failed to get selected dataset:', error);
        await this.presentToast('No event selected. Please select an event first.', 'danger');
        return;
      }

      const result = await this.api.download(dataset, false, this.downloadStatus);
      
      switch (result) {
        case 'success': {
          await this.presentToast(`Data update complete for ${this.currentEventName()}`, 'success');
          await this.loadCacheStats(); // Refresh cache stats to show new data
          break;
        }
        case 'already-updated': {
          await this.presentToast(`You have the latest data for ${this.currentEventName()}`, 'success');
          break;
        }
        case 'error': {
          await this.presentToast('Failed to download data update. Please try again.', 'danger');
          break;
        }
      }
    } catch (error) {
      console.error('Failed to download data:', error);
      await this.presentToast('Failed to download data update. Please try again.', 'danger');
    } finally {
      this.downloadingData.set(false);
      this.downloadStatus.set({ status: '', firstDownload: false });
      this.cdr.markForCheck();
    }
  }

  // Helper method to get total number of data records across all categories
  getTotalDataRecords(): number {
    const dataStats = this.dataCacheStats();
    if (!dataStats) return 0;
    
    // Sum up itemCount from all categories
    let totalRecords = 0;
    for (const category of Object.values(dataStats.categories)) {
      for (const keyInfo of category.keys) {
        totalRecords += keyInfo.itemCount || 0;
      }
    }
    
    return totalRecords;
  }

  // Helper method to get total number of data records for a specific data type
  getDataTypeRecordCount(type: CacheDataType): number {
    const dataStats = this.dataCacheStats();
    if (!dataStats || !dataStats.categories[type]) return 0;
    
    // Sum up itemCount for this specific category
    let totalRecords = 0;
    for (const keyInfo of dataStats.categories[type].keys) {
      totalRecords += keyInfo.itemCount || 0;
    }
    
    return totalRecords;
  }

}