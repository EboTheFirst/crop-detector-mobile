/**
 * App Configuration
 * Central configuration for the Crop Disease Detector app
 */

import { AppConfig } from '@/types';

export const APP_CONFIG: AppConfig = {
  // API Configuration
  // apiBaseUrl: 'http://localhost:8000', // Update this to your backend URL
  apiBaseUrl: 'http://192.168.100.53:8000', // Update this to your backend URL
  
  // Cache Configuration
  cacheExpirationHours: 24,
  
  // Image Configuration
  maxImageSize: 5 * 1024 * 1024, // 5MB
  supportedImageFormats: ['jpg', 'jpeg', 'png'],
  
  // Default Location (Accra, Ghana)
  defaultLocation: {
    latitude: 5.6037,
    longitude: -0.1870,
    address: 'Accra',
    region: 'Greater Accra',
    country: 'Ghana',
  },
  
  // Emergency Contacts
  emergencyContacts: [
    {
      name: 'Ghana Agricultural Extension Service',
      phone: '+233-XXX-XXXX',
      region: 'National',
    },
    {
      name: 'Plant Protection Division',
      phone: '+233-XXX-XXXX',
      region: 'National',
    },
    {
      name: 'Agricultural Development Bank',
      phone: '+233-XXX-XXXX',
      region: 'National',
    },
    {
      name: 'Ministry of Food and Agriculture',
      phone: '+233-XXX-XXXX',
      region: 'National',
    },
  ],
};

// Supported Crops
export const SUPPORTED_CROPS = [
  'cashew',
  'cassava',
  'maize',
  'tomato',
] as const;

// Common Diseases by Crop
export const COMMON_DISEASES = {
  cashew: [
    'anthracnose',
    'powdery_mildew',
    'leaf_spot',
    'root_rot',
  ],
  cassava: [
    'cassava_mosaic_disease',
    'cassava_brown_streak',
    'bacterial_blight',
    'anthracnose',
  ],
  maize: [
    'northern_corn_leaf_blight',
    'gray_leaf_spot',
    'common_rust',
    'southern_corn_leaf_blight',
  ],
  tomato: [
    'early_blight',
    'late_blight',
    'bacterial_spot',
    'fusarium_wilt',
  ],
} as const;

// App Constants
export const APP_CONSTANTS = {
  // Version
  VERSION: '1.0.0',
  
  // Storage Keys
  STORAGE_KEYS: {
    USER_PROFILE: 'user_profile',
    TUTORIAL_COMPLETED: 'tutorial_completed',
    FIRST_LAUNCH: 'first_launch',
    SETTINGS: 'app_settings',
    DISEASES: 'cached_diseases',
    TREATMENTS: 'cached_treatments',
    SUPPLIERS: 'cached_suppliers',
    PRICES: 'cached_prices',
    DETECTION_HISTORY: 'detection_history',
    TREATMENT_HISTORY: 'treatment_history',
    OFFLINE_QUEUE: 'offline_queue',
  },
  
  // API Timeouts
  API_TIMEOUT: 30000, // 30 seconds
  
  // Cache TTL (Time To Live) in hours
  CACHE_TTL: {
    DISEASE_INFO: 72, // 3 days
    TREATMENTS: 24, // 1 day
    SUPPLIERS: 12, // 12 hours
    PRICES: 6, // 6 hours
  },
  
  // UI Constants
  UI: {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
    MAX_HISTORY_ITEMS: 100,
    ITEMS_PER_PAGE: 20,
  },
  
  // Map Configuration
  MAP: {
    DEFAULT_ZOOM: 12,
    MAX_SUPPLIER_DISTANCE: 50, // km
    DEFAULT_RADIUS: 10, // km
  },
  
  // Image Processing
  IMAGE: {
    QUALITY: 0.8,
    MAX_WIDTH: 1024,
    MAX_HEIGHT: 1024,
    COMPRESSION_QUALITY: 0.7,
  },
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_OFFLINE_MODE: true,
  ENABLE_LOCATION_SERVICES: true,
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_ANALYTICS: false,
  ENABLE_CRASH_REPORTING: false,
  ENABLE_BETA_FEATURES: false,
} as const;

// Theme Configuration
export const THEME = {
  COLORS: {
    PRIMARY: '#4CAF50',
    SECONDARY: '#2196F3',
    SUCCESS: '#4CAF50',
    WARNING: '#FF9800',
    ERROR: '#F44336',
    INFO: '#2196F3',
    LIGHT: '#f5f5f5',
    DARK: '#333333',
    WHITE: '#ffffff',
    BLACK: '#000000',
  },
  
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
  },
  
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
    ROUND: 50,
  },
  
  FONT_SIZES: {
    XS: 10,
    SM: 12,
    MD: 14,
    LG: 16,
    XL: 18,
    XXL: 20,
    XXXL: 24,
  },
} as const;

// Validation Rules
export const VALIDATION = {
  MIN_CONFIDENCE_THRESHOLD: 0.6,
  MAX_FILE_SIZE_MB: 5,
  MIN_IMAGE_DIMENSION: 224,
  MAX_SEARCH_RADIUS_KM: 100,
  MIN_SEARCH_RADIUS_KM: 1,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  CAMERA_PERMISSION: 'Camera permission is required to capture crop images.',
  LOCATION_PERMISSION: 'Location permission is required to find nearby suppliers.',
  IMAGE_TOO_LARGE: 'Image file is too large. Please select a smaller image.',
  INVALID_IMAGE_FORMAT: 'Invalid image format. Please select a JPG or PNG image.',
  API_ERROR: 'Service temporarily unavailable. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  DETECTION_COMPLETE: 'Disease detection completed successfully.',
  TREATMENT_SAVED: 'Treatment plan saved to history.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  CACHE_CLEARED: 'Cache cleared successfully.',
} as const;
