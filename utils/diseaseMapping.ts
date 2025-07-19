// utils/diseaseMapping.ts
// Maps local TensorFlow.js model predictions to backend API disease names

import { CropType } from '@/types';

export interface DiseaseMapping {
  localLabel: string;           // From TensorFlow.js model
  backendDiseaseName: string;   // Expected by backend API
  cropType: CropType;          // Crop type for the disease
  isHealthy: boolean;          // Whether this represents a healthy plant
}

/**
 * Complete mapping between local model predictions and backend API
 * This ensures perfect synchronization between frontend and backend
 */
export const DISEASE_MAPPINGS: DiseaseMapping[] = [
  // CASHEW DISEASES
  {
    localLabel: "Cashew - Anthracnose",
    backendDiseaseName: "anthracnose",
    cropType: CropType.CASHEW,
    isHealthy: false
  },
  {
    localLabel: "Cashew - Gumosis",
    backendDiseaseName: "gumosis",
    cropType: CropType.CASHEW,
    isHealthy: false
  },
  {
    localLabel: "Cashew - Healthy",
    backendDiseaseName: "healthy",
    cropType: CropType.CASHEW,
    isHealthy: true
  },
  {
    localLabel: "Cashew - Leaf Miner",
    backendDiseaseName: "leaf_miner",
    cropType: CropType.CASHEW,
    isHealthy: false
  },
  {
    localLabel: "Cashew - Red Rust",
    backendDiseaseName: "red_rust",
    cropType: CropType.CASHEW,
    isHealthy: false
  },

  // CASSAVA DISEASES
  {
    localLabel: "Cassava - Bacterial Blight",
    backendDiseaseName: "bacterial_blight",
    cropType: CropType.CASSAVA,
    isHealthy: false
  },
  {
    localLabel: "Cassava - Brown Spot",
    backendDiseaseName: "brown_spot",
    cropType: CropType.CASSAVA,
    isHealthy: false
  },
  {
    localLabel: "Cassava - Green Mite",
    backendDiseaseName: "green_mite",
    cropType: CropType.CASSAVA,
    isHealthy: false
  },
  {
    localLabel: "Cassava - Healthy",
    backendDiseaseName: "healthy",
    cropType: CropType.CASSAVA,
    isHealthy: true
  },
  {
    localLabel: "Cassava - Mosaic",
    backendDiseaseName: "mosaic",
    cropType: CropType.CASSAVA,
    isHealthy: false
  },

  // MAIZE DISEASES
  {
    localLabel: "Maize - Fall Armyworm",
    backendDiseaseName: "fall_armyworm",
    cropType: CropType.MAIZE,
    isHealthy: false
  },
  {
    localLabel: "Maize - Grasshopper",
    backendDiseaseName: "grasshopper",
    cropType: CropType.MAIZE,
    isHealthy: false
  },
  {
    localLabel: "Maize - Healthy",
    backendDiseaseName: "healthy",
    cropType: CropType.MAIZE,
    isHealthy: true
  },
  {
    localLabel: "Maize - Leaf Beetle",
    backendDiseaseName: "leaf_beetle",
    cropType: CropType.MAIZE,
    isHealthy: false
  },
  {
    localLabel: "Maize - Leaf Blight",
    backendDiseaseName: "leaf_blight",
    cropType: CropType.MAIZE,
    isHealthy: false
  },
  {
    localLabel: "Maize - Leaf Spot",
    backendDiseaseName: "leaf_spot",
    cropType: CropType.MAIZE,
    isHealthy: false
  },
  {
    localLabel: "Maize - Streak Virus",
    backendDiseaseName: "streak_virus",
    cropType: CropType.MAIZE,
    isHealthy: false
  },

  // TOMATO DISEASES
  {
    localLabel: "Tomato - Healthy",
    backendDiseaseName: "healthy",
    cropType: CropType.TOMATO,
    isHealthy: true
  },
  {
    localLabel: "Tomato - Leaf Blight",
    backendDiseaseName: "leaf_blight",
    cropType: CropType.TOMATO,
    isHealthy: false
  },
  {
    localLabel: "Tomato - Leaf Curl",
    backendDiseaseName: "leaf_curl",
    cropType: CropType.TOMATO,
    isHealthy: false
  },
  {
    localLabel: "Tomato - Septoria Leaf Spot",
    backendDiseaseName: "septoria_leaf_spot",
    cropType: CropType.TOMATO,
    isHealthy: false
  },
  {
    localLabel: "Tomato - Verticillium Wilt",
    backendDiseaseName: "verticillium_wilt",
    cropType: CropType.TOMATO,
    isHealthy: false
  }
];

/**
 * Create lookup maps for efficient searching
 */
const localToBackendMap = new Map<string, DiseaseMapping>();
const backendToLocalMap = new Map<string, DiseaseMapping>();

DISEASE_MAPPINGS.forEach(mapping => {
  localToBackendMap.set(mapping.localLabel, mapping);
  backendToLocalMap.set(mapping.backendDiseaseName, mapping);
});

/**
 * Convert local model prediction to backend API format
 */
export function mapLocalToBackend(localLabel: string): DiseaseMapping | null {
  return localToBackendMap.get(localLabel) || null;
}

/**
 * Convert backend disease name to local format
 */
export function mapBackendToLocal(backendDiseaseName: string): DiseaseMapping | null {
  return backendToLocalMap.get(backendDiseaseName) || null;
}

/**
 * Extract crop type from local prediction
 */
export function extractCropTypeFromLabel(localLabel: string): CropType {
  const mapping = mapLocalToBackend(localLabel);
  if (mapping) {
    return mapping.cropType;
  }
  
  // Fallback: parse from label
  const lowerLabel = localLabel.toLowerCase();
  if (lowerLabel.includes('cashew')) return CropType.CASHEW;
  if (lowerLabel.includes('cassava')) return CropType.CASSAVA;
  if (lowerLabel.includes('maize')) return CropType.MAIZE;
  if (lowerLabel.includes('tomato')) return CropType.TOMATO;
  
  return CropType.MAIZE; // Default fallback
}

/**
 * Extract disease name for backend API from local prediction
 */
export function extractDiseaseFromLabel(localLabel: string): string {
  const mapping = mapLocalToBackend(localLabel);
  if (mapping) {
    return mapping.backendDiseaseName;
  }
  
  // Fallback: manual parsing
  const parts = localLabel.split(' - ');
  if (parts.length > 1) {
    return parts[1].toLowerCase().replace(/\s+/g, '_');
  }
  
  return localLabel.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Check if the prediction indicates a healthy plant
 */
export function isHealthyPrediction(localLabel: string): boolean {
  const mapping = mapLocalToBackend(localLabel);
  return mapping?.isHealthy || false;
}

/**
 * Get all diseases for a specific crop type
 */
export function getDiseasesForCrop(cropType: CropType): DiseaseMapping[] {
  return DISEASE_MAPPINGS.filter(mapping => mapping.cropType === cropType);
}

/**
 * Get all supported crop types
 */
export function getSupportedCropTypes(): CropType[] {
  const cropTypes = new Set<CropType>();
  DISEASE_MAPPINGS.forEach(mapping => cropTypes.add(mapping.cropType));
  return Array.from(cropTypes);
}

/**
 * Validate that a local label exists in our mapping
 */
export function isValidLocalLabel(localLabel: string): boolean {
  return localToBackendMap.has(localLabel);
}

/**
 * Get human-readable disease name from backend format
 */
export function getReadableDiseaseName(backendDiseaseName: string): string {
  const mapping = mapBackendToLocal(backendDiseaseName);
  if (mapping) {
    return mapping.localLabel;
  }
  
  // Fallback: format the backend name
  return backendDiseaseName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Debug function to validate all mappings
 */
export function validateMappings(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for duplicates
  const localLabels = new Set<string>();
  const backendNames = new Set<string>();
  
  DISEASE_MAPPINGS.forEach((mapping, index) => {
    if (localLabels.has(mapping.localLabel)) {
      errors.push(`Duplicate local label: ${mapping.localLabel}`);
    }
    localLabels.add(mapping.localLabel);
    
    if (backendNames.has(mapping.backendDiseaseName)) {
      errors.push(`Duplicate backend name: ${mapping.backendDiseaseName}`);
    }
    backendNames.add(mapping.backendDiseaseName);
    
    // Validate crop type consistency
    const expectedCrop = mapping.localLabel.split(' - ')[0].toLowerCase();
    const actualCrop = mapping.cropType.toLowerCase();
    if (!expectedCrop.includes(actualCrop) && !actualCrop.includes(expectedCrop)) {
      errors.push(`Crop type mismatch for ${mapping.localLabel}: expected ${expectedCrop}, got ${actualCrop}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
