/**
 * Storage Service for Offline Functionality
 * Handles caching and local storage using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CachedData,
  OfflineStorage,
  DetectionResult,
  TreatmentHistory,
  UserProfile,
  DiseaseInfo,
  Treatment,
  Supplier,
  PriceInfo,
} from '@/types';

// Storage keys
const STORAGE_KEYS = {
  DISEASES: 'cached_diseases',
  TREATMENTS: 'cached_treatments',
  SUPPLIERS: 'cached_suppliers',
  PRICES: 'cached_prices',
  DETECTION_HISTORY: 'detection_history',
  TREATMENT_HISTORY: 'treatment_history',
  USER_PROFILE: 'user_profile',
  APP_SETTINGS: 'app_settings',
  OFFLINE_QUEUE: 'offline_queue',
} as const;

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL_HOURS: 24,
  DISEASE_INFO_TTL_HOURS: 72,
  SUPPLIER_TTL_HOURS: 12,
  PRICE_TTL_HOURS: 6,
  MAX_HISTORY_ITEMS: 100,
  MAX_CACHE_SIZE_MB: 50,
};

// Utility functions
function createCachedData<T>(data: T, ttlHours: number = CACHE_CONFIG.DEFAULT_TTL_HOURS): CachedData<T> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
  
  return {
    data,
    timestamp: now,
    expiresAt,
  };
}

function isCacheValid<T>(cachedData: CachedData<T>): boolean {
  return new Date() < new Date(cachedData.expiresAt);
}

async function getStorageItem<T>(key: string): Promise<T | null> {
  try {
    const item = await AsyncStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting storage item ${key}:`, error);
    return null;
  }
}

async function setStorageItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting storage item ${key}:`, error);
    throw error;
  }
}

async function removeStorageItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing storage item ${key}:`, error);
  }
}

// Disease caching functions
export const diseaseStorage = {
  async cacheDiseaseInfo(diseaseName: string, diseaseInfo: DiseaseInfo): Promise<void> {
    const cached = await getStorageItem<Record<string, CachedData<DiseaseInfo>>>(STORAGE_KEYS.DISEASES) || {};
    cached[diseaseName.toLowerCase()] = createCachedData(diseaseInfo, CACHE_CONFIG.DISEASE_INFO_TTL_HOURS);
    await setStorageItem(STORAGE_KEYS.DISEASES, cached);
  },

  async getCachedDiseaseInfo(diseaseName: string): Promise<DiseaseInfo | null> {
    const cached = await getStorageItem<Record<string, CachedData<DiseaseInfo>>>(STORAGE_KEYS.DISEASES);
    if (!cached) return null;

    const diseaseData = cached[diseaseName.toLowerCase()];
    if (!diseaseData || !isCacheValid(diseaseData)) {
      return null;
    }

    return diseaseData.data;
  },

  async cacheTreatments(diseaseKey: string, treatments: Treatment[]): Promise<void> {
    const cached = await getStorageItem<Record<string, CachedData<Treatment[]>>>(STORAGE_KEYS.TREATMENTS) || {};
    cached[diseaseKey] = createCachedData(treatments, CACHE_CONFIG.DEFAULT_TTL_HOURS);
    await setStorageItem(STORAGE_KEYS.TREATMENTS, cached);
  },

  async getCachedTreatments(diseaseKey: string): Promise<Treatment[] | null> {
    const cached = await getStorageItem<Record<string, CachedData<Treatment[]>>>(STORAGE_KEYS.TREATMENTS);
    if (!cached) return null;

    const treatmentData = cached[diseaseKey];
    if (!treatmentData || !isCacheValid(treatmentData)) {
      return null;
    }

    return treatmentData.data;
  },
};

// Supplier caching functions
export const supplierStorage = {
  async cacheSuppliers(locationKey: string, suppliers: Supplier[]): Promise<void> {
    const cached = await getStorageItem<Record<string, CachedData<Supplier[]>>>(STORAGE_KEYS.SUPPLIERS) || {};
    cached[locationKey] = createCachedData(suppliers, CACHE_CONFIG.SUPPLIER_TTL_HOURS);
    await setStorageItem(STORAGE_KEYS.SUPPLIERS, cached);
  },

  async getCachedSuppliers(locationKey: string): Promise<Supplier[] | null> {
    const cached = await getStorageItem<Record<string, CachedData<Supplier[]>>>(STORAGE_KEYS.SUPPLIERS);
    if (!cached) return null;

    const supplierData = cached[locationKey];
    if (!supplierData || !isCacheValid(supplierData)) {
      return null;
    }

    return supplierData.data;
  },

  async clearCachedSuppliers(locationKey: string): Promise<void> {
    const cached = await getStorageItem<Record<string, CachedData<Supplier[]>>>(STORAGE_KEYS.SUPPLIERS) || {};
    delete cached[locationKey];
    await setStorageItem(STORAGE_KEYS.SUPPLIERS, cached);
  },

  async clearAllCachedSuppliers(): Promise<void> {
    await removeStorageItem(STORAGE_KEYS.SUPPLIERS);
  },
};

// Price caching functions
export const priceStorage = {
  async cachePrices(treatmentKey: string, prices: PriceInfo[]): Promise<void> {
    const cached = await getStorageItem<Record<string, CachedData<PriceInfo[]>>>(STORAGE_KEYS.PRICES) || {};
    cached[treatmentKey] = createCachedData(prices, CACHE_CONFIG.PRICE_TTL_HOURS);
    await setStorageItem(STORAGE_KEYS.PRICES, cached);
  },

  async getCachedPrices(treatmentKey: string): Promise<PriceInfo[] | null> {
    const cached = await getStorageItem<Record<string, CachedData<PriceInfo[]>>>(STORAGE_KEYS.PRICES);
    if (!cached) return null;

    const priceData = cached[treatmentKey];
    if (!priceData || !isCacheValid(priceData)) {
      return null;
    }

    return priceData.data;
  },
};

// History management functions
export const historyStorage = {
  async saveDetectionResult(result: DetectionResult): Promise<void> {
    const history = await getStorageItem<DetectionResult[]>(STORAGE_KEYS.DETECTION_HISTORY) || [];
    
    // Add new result at the beginning
    history.unshift(result);
    
    // Limit history size
    if (history.length > CACHE_CONFIG.MAX_HISTORY_ITEMS) {
      history.splice(CACHE_CONFIG.MAX_HISTORY_ITEMS);
    }
    
    await setStorageItem(STORAGE_KEYS.DETECTION_HISTORY, history);
  },

  async getDetectionHistory(): Promise<DetectionResult[]> {
    return await getStorageItem<DetectionResult[]>(STORAGE_KEYS.DETECTION_HISTORY) || [];
  },

  async saveTreatmentHistory(treatment: TreatmentHistory): Promise<void> {
    const history = await getStorageItem<TreatmentHistory[]>(STORAGE_KEYS.TREATMENT_HISTORY) || [];
    
    // Add new treatment at the beginning
    history.unshift(treatment);
    
    // Limit history size
    if (history.length > CACHE_CONFIG.MAX_HISTORY_ITEMS) {
      history.splice(CACHE_CONFIG.MAX_HISTORY_ITEMS);
    }
    
    await setStorageItem(STORAGE_KEYS.TREATMENT_HISTORY, history);
  },

  async getTreatmentHistory(): Promise<TreatmentHistory[]> {
    return await getStorageItem<TreatmentHistory[]>(STORAGE_KEYS.TREATMENT_HISTORY) || [];
  },

  async updateDetectionResult(id: string, updates: Partial<DetectionResult>): Promise<void> {
    const history = await getStorageItem<DetectionResult[]>(STORAGE_KEYS.DETECTION_HISTORY) || [];
    const index = history.findIndex(item => item.id === id);
    
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      await setStorageItem(STORAGE_KEYS.DETECTION_HISTORY, history);
    }
  },
};

// User profile functions
export const userStorage = {
  async saveUserProfile(profile: UserProfile): Promise<void> {
    await setStorageItem(STORAGE_KEYS.USER_PROFILE, profile);
  },

  async getUserProfile(): Promise<UserProfile | null> {
    return await getStorageItem<UserProfile>(STORAGE_KEYS.USER_PROFILE);
  },

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    const profile = await this.getUserProfile();
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      await this.saveUserProfile(updatedProfile);
    }
  },
};

// Cache management functions
export const cacheManager = {
  async clearExpiredCache(): Promise<void> {
    const keys = [STORAGE_KEYS.DISEASES, STORAGE_KEYS.TREATMENTS, STORAGE_KEYS.SUPPLIERS, STORAGE_KEYS.PRICES];
    
    for (const key of keys) {
      const cached = await getStorageItem<Record<string, CachedData<any>>>(key);
      if (!cached) continue;
      
      const validEntries: Record<string, CachedData<any>> = {};
      
      for (const [entryKey, entryValue] of Object.entries(cached)) {
        if (isCacheValid(entryValue)) {
          validEntries[entryKey] = entryValue;
        }
      }
      
      await setStorageItem(key, validEntries);
    }
  },

  async clearAllCache(): Promise<void> {
    const keys = [
      STORAGE_KEYS.DISEASES,
      STORAGE_KEYS.TREATMENTS,
      STORAGE_KEYS.SUPPLIERS,
      STORAGE_KEYS.PRICES,
    ];
    
    for (const key of keys) {
      await removeStorageItem(key);
    }
  },

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += new Blob([item]).size;
        }
      }
      
      return totalSize / (1024 * 1024); // Return size in MB
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  },
};

// Main storage service
export const storage = {
  disease: diseaseStorage,
  supplier: supplierStorage,
  price: priceStorage,
  history: historyStorage,
  user: userStorage,
  cache: cacheManager,
};
