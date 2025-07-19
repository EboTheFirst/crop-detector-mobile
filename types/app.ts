/**
 * App-specific types and interfaces
 */

import { CropType, DiseaseInfo, Treatment, Supplier, PriceInfo } from './api';

// Navigation Types
export type RootStackParamList = {
  '(tabs)': undefined;
  Camera: undefined;
  DiseaseDetection: {
    imageUri: string;
    cropType?: CropType;
  };
  TreatmentRecommendations: {
    disease: string;
    cropType: CropType;
    location: string;
  };
  SupplierLocator: {
    treatments: Treatment[];
    location: string;
  };
  PriceEstimation: {
    treatments: Treatment[];
    location: string;
  };
  Help: undefined;
  Tutorial: undefined;
};

export type TabParamList = {
  index: undefined;
  camera: undefined;
  history: undefined;
  suppliers: undefined;
  help: undefined;
};

// App State Types
export interface AppState {
  isLoading: boolean;
  error: string | null;
  user: UserProfile | null;
  currentLocation: LocationData | null;
  offlineMode: boolean;
}

export interface UserProfile {
  id: string;
  name?: string;
  location: string;
  preferredCrops: CropType[];
  organicPreference: boolean;
  language: 'en' | 'tw' | 'ak'; // English, Twi, Akan
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  region?: string;
  country?: string;
}

// Detection and Analysis Types
export interface DetectionResult {
  id: string;
  timestamp: Date;
  imageUri: string;
  cropType: CropType;
  detectedDisease: string;
  confidence: number;
  diseaseInfo?: DiseaseInfo;
  recommendations?: Treatment[];
  location: LocationData;
  status: 'pending' | 'completed' | 'failed';
}

export interface TreatmentHistory {
  id: string;
  detectionId: string;
  disease: string;
  cropType: CropType;
  selectedTreatments: Treatment[];
  appliedDate?: Date;
  effectiveness?: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
  cost: number;
  suppliers: Supplier[];
}

// UI Component Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  retry?: () => void;
}

export interface CameraState {
  hasPermission: boolean;
  isReady: boolean;
  flashMode: 'on' | 'off' | 'auto';
  cameraType: 'front' | 'back';
}

// Storage Types
export interface CachedData<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

export interface OfflineStorage {
  diseases: Record<string, CachedData<DiseaseInfo>>;
  treatments: Record<string, CachedData<Treatment[]>>;
  suppliers: Record<string, CachedData<Supplier[]>>;
  prices: Record<string, CachedData<PriceInfo[]>>;
  detectionHistory: DetectionResult[];
  treatmentHistory: TreatmentHistory[];
  userProfile: UserProfile | null;
}

// Form Types
export interface CropSelectionForm {
  cropType: CropType;
  confidence: number;
  manualOverride: boolean;
}

export interface RecommendationFilters {
  organicOnly: boolean;
  budgetRange: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface SupplierFilters {
  maxDistance: number;
  verifiedOnly: boolean;
  productType?: string;
  minRating: number;
}

// Utility Types
export type AsyncResult<T> = {
  data?: T;
  error?: string;
  loading: boolean;
};

export type NetworkStatus = 'online' | 'offline' | 'poor';

export interface AppConfig {
  apiBaseUrl: string;
  cacheExpirationHours: number;
  maxImageSize: number;
  supportedImageFormats: string[];
  defaultLocation: LocationData;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    region: string;
  }>;
}
