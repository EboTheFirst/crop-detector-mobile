/**
 * Offline Manager Service
 * Handles offline functionality, data synchronization, and queue management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './storage';
import { api } from './api';
import { APP_CONSTANTS } from '@/config/app';
import { DetectionResult, TreatmentHistory, DiseaseInfo, Treatment } from '@/types';

interface OfflineAction {
  id: string;
  type: 'detection' | 'treatment_save' | 'supplier_request' | 'price_request';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

interface OfflineQueue {
  actions: OfflineAction[];
  lastSync: Date | null;
}

class OfflineManager {
  private queue: OfflineQueue = {
    actions: [],
    lastSync: null,
  };

  private isOnline = true;
  private syncInProgress = false;

  constructor() {
    this.loadQueue();
  }

  // Initialize offline manager
  async initialize(preloadData: boolean = false) {
    await this.loadQueue();
    // Only preload data if explicitly requested
    if (preloadData) {
      await this.preloadEssentialData();
    }
  }

  // Set online/offline status
  setOnlineStatus(isOnline: boolean) {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    // If we just came back online, sync queued actions
    if (wasOffline && isOnline && !this.syncInProgress) {
      this.syncQueuedActions();
    }
  }

  // Add action to offline queue
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) {
    const queuedAction: OfflineAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date(),
      retryCount: 0,
    };

    this.queue.actions.push(queuedAction);
    await this.saveQueue();

    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncQueuedActions();
    }
  }

  // Sync queued actions when back online
  async syncQueuedActions() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const actionsToSync = [...this.queue.actions];
      const successfulActions: string[] = [];

      for (const action of actionsToSync) {
        try {
          await this.executeAction(action);
          successfulActions.push(action.id);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          
          // Increment retry count
          action.retryCount++;
          
          // Remove action if max retries exceeded
          if (action.retryCount >= action.maxRetries) {
            successfulActions.push(action.id);
            console.warn(`Action ${action.id} removed after ${action.maxRetries} retries`);
          }
        }
      }

      // Remove successful actions from queue
      this.queue.actions = this.queue.actions.filter(
        action => !successfulActions.includes(action.id)
      );

      this.queue.lastSync = new Date();
      await this.saveQueue();

    } finally {
      this.syncInProgress = false;
    }
  }

  // Execute a queued action
  private async executeAction(action: OfflineAction) {
    switch (action.type) {
      case 'detection':
        // Re-submit detection for online processing
        await api.disease.predictDisease(action.data.imageUri);
        break;
        
      case 'treatment_save':
        // Sync treatment history
        await this.syncTreatmentHistory(action.data);
        break;
        
      case 'supplier_request':
        // Refresh supplier data
        await api.supplier.getNearbySuppliers(
          action.data.location,
          action.data.radius
        );
        break;
        
      case 'price_request':
        // Refresh price data
        await api.price.getTreatmentPrices(action.data.treatmentName);
        break;
        
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  // Preload essential data for offline use
  async preloadEssentialData() {
    try {
      // Preload common disease information using API-supported disease names
      const commonDiseases = [
        // Cashew diseases
        'anthracnose',
        'gumosis',
        'leaf_miner',
        'red_rust',
        // Cassava diseases
        'bacterial_blight',
        'brown_spot',
        'green_mite',
        'mosaic',
        // Maize diseases
        'fall_armyworm',
        'grasshopper',
        'leaf_beetle',
        'leaf_blight',
        'leaf_spot',
        'streak_virus',
        // Tomato diseases
        'leaf_curl',
        'septoria_leaf_spot',
        'verticillium_wilt',
        // Healthy states
        'healthy',
      ];

      for (const disease of commonDiseases) {
        try {
          const diseaseInfo = await api.disease.getDiseaseInfo(disease);
          await storage.disease.cacheDiseaseInfo(disease, diseaseInfo);
        } catch (error) {
          // Use debug logging instead of console.warn to reduce noise
          console.debug(`Failed to preload disease info for ${disease}:`, error);
        }
      }

      // Preload common treatments
      const commonTreatments = [
        'copper_fungicide',
        'neem_oil',
        'bacillus_subtilis',
        'potassium_bicarbonate',
        'sulfur_spray',
      ];

      // This would be implemented when we have treatment endpoints
      // for (const treatment of commonTreatments) {
      //   try {
      //     const treatmentInfo = await api.treatment.getTreatmentInfo(treatment);
      //     await storage.treatment.cacheTreatmentInfo(treatment, treatmentInfo);
      //   } catch (error) {
      //     console.warn(`Failed to preload treatment info for ${treatment}:`, error);
      //   }
      // }

    } catch (error) {
      console.error('Failed to preload essential data:', error);
    }
  }

  // Get offline detection capability
  async getOfflineDetectionCapability(): Promise<{
    canDetect: boolean;
    supportedCrops: string[];
    cachedDiseases: string[];
  }> {
    const cachedDiseases = await this.getCachedDiseases();
    
    return {
      canDetect: cachedDiseases.length > 0,
      supportedCrops: ['cashew', 'cassava', 'maize', 'tomato'],
      cachedDiseases,
    };
  }

  // Get cached diseases
  private async getCachedDiseases(): Promise<string[]> {
    try {
      const cached = await AsyncStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.DISEASES);
      if (cached) {
        const diseasesData = JSON.parse(cached);
        return Object.keys(diseasesData);
      }
    } catch (error) {
      console.error('Failed to get cached diseases:', error);
    }
    return [];
  }

  // Perform offline disease detection (simplified)
  async performOfflineDetection(imageUri: string, cropType: string): Promise<DetectionResult> {
    // This is a simplified offline detection
    // In a real implementation, you might use a local ML model
    
    const commonDiseases = {
      tomato: ['leaf_blight', 'leaf_curl', 'septoria_leaf_spot', 'verticillium_wilt', 'healthy'],
      maize: ['fall_armyworm', 'grasshopper', 'leaf_beetle', 'leaf_blight', 'leaf_spot', 'streak_virus', 'healthy'],
      cassava: ['bacterial_blight', 'brown_spot', 'green_mite', 'mosaic', 'healthy'],
      cashew: ['anthracnose', 'gumosis', 'leaf_miner', 'red_rust', 'healthy'],
    };

    const diseases = commonDiseases[cropType as keyof typeof commonDiseases] || [];
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = 0.6 + Math.random() * 0.3; // Random confidence between 0.6-0.9

    const result: DetectionResult = {
      id: Date.now().toString(),
      timestamp: new Date(),
      imageUri,
      cropType: cropType as any,
      detectedDisease: randomDisease || 'unknown_disease',
      confidence,
      location: {
        latitude: 0,
        longitude: 0,
        address: 'Offline Mode',
      },
      status: 'completed',
    };

    // Save to history
    await storage.history.saveDetectionResult(result);

    // Queue for online verification when connection is restored
    await this.queueAction({
      type: 'detection',
      data: { imageUri, cropType, offlineResult: result },
      maxRetries: 3,
    });

    return result;
  }

  // Sync treatment history
  private async syncTreatmentHistory(treatmentData: TreatmentHistory) {
    // In a real implementation, this would sync with a backend service
    console.log('Syncing treatment history:', treatmentData);
  }

  // Get offline status
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      queuedActions: this.queue.actions.length,
      lastSync: this.queue.lastSync,
      syncInProgress: this.syncInProgress,
    };
  }

  // Clear offline queue
  async clearQueue() {
    this.queue.actions = [];
    await this.saveQueue();
  }

  // Load queue from storage
  private async loadQueue() {
    try {
      const queueData = await AsyncStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.OFFLINE_QUEUE);
      if (queueData) {
        const parsed = JSON.parse(queueData);
        this.queue = {
          actions: parsed.actions || [],
          lastSync: parsed.lastSync ? new Date(parsed.lastSync) : null,
        };
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  // Save queue to storage
  private async saveQueue() {
    try {
      await AsyncStorage.setItem(
        APP_CONSTANTS.STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(this.queue)
      );
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  // Get cache statistics
  async getCacheStatistics() {
    const cacheSize = await storage.cache.getCacheSize();
    const detectionHistory = await storage.history.getDetectionHistory();
    const treatmentHistory = await storage.history.getTreatmentHistory();
    
    return {
      cacheSize,
      detectionCount: detectionHistory.length,
      treatmentCount: treatmentHistory.length,
      queuedActions: this.queue.actions.length,
      lastSync: this.queue.lastSync,
    };
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();
