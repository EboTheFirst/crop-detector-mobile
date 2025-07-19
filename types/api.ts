/**
 * API Types and Interfaces for Crop Disease Detection App
 * Based on the FastAPI backend models
 */

// Enums
export const CropType = {
  CASHEW: 'cashew',
  CASSAVA: 'cassava',
  MAIZE: 'maize',
  TOMATO: 'tomato'
} as const;

export type CropType = typeof CropType[keyof typeof CropType];



export const TreatmentType = {
  CHEMICAL: 'chemical',
  ORGANIC: 'organic',
  BIOLOGICAL: 'biological',
  CULTURAL: 'cultural'
} as const;

export type TreatmentType = typeof TreatmentType[keyof typeof TreatmentType];

// Base Models
export interface Treatment {
  name: string;
  type: TreatmentType;
  active_ingredients: string[];
  application_method: string;
  dosage: string;
  frequency: string;
  precautions: string[];
}

export interface Supplier {
  name: string;
  location?: string;
  phone?: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  products: string[];
  verified: boolean;
  rating?: number;
  distance_km?: number;
}

export interface PriceInfo {
  product_name: string;
  supplier_name: string;
  price_ghs: number;
  quantity: string;
  unit: string;
  location: string;
  last_updated: string;
  availability: string;
}

export interface DiseaseInfo {
  name: string;
  crop_type: CropType;
  scientific_name?: string;
  symptoms: string[];
  causes: string[];
  prevention_methods: string[];
  treatments: Treatment[];
  severity_indicators: Record<string, string[]>;
}

// Request Models
export interface RecommendRequest {
  disease: string;
  user_location: string;
  crop_type?: CropType;
  organic_preference: boolean;
}

export interface LocationRequest {
  latitude: number;
  longitude: number;
  radius_km?: number;
}

// Response Models
export interface RecommendationResponse {
  disease: string;
  crop_type: string;
  location: string;
  severity: string;
  disease_info: DiseaseInfo;
  recommended_treatments: Treatment[];
  nearby_suppliers: Supplier[];
  price_estimates: PriceInfo[];
  total_estimated_cost_ghs?: number;
  emergency_contacts: Array<Record<string, string>>;
  additional_resources: Array<Record<string, string>>;
}

export interface SuppliersResponse {
  location: string;
  radius_km: number;
  suppliers: Supplier[];
  total_count: number;
}

export interface PricesResponse {
  treatment_name: string;
  location?: string;
  prices: PriceInfo[];
  average_price_ghs?: number;
  price_range_ghs?: Record<string, number>;
}

export interface DiseaseDetectionResponse {
  predicted_disease: string;
  crop_type: string;
  confidence: number;
  message?: string;
}

export interface ErrorResponse {
  detail: string;
  error_code?: string;
  suggestions?: string[];
}

// API Endpoints
export const API_ENDPOINTS = {
  DISEASES: '/api/diseases',
  DISEASE_INFO: '/api/disease-info',
  PREDICT: '/api/predict',
  RECOMMEND: '/api/recommend',
  SUPPLIERS: '/api/suppliers/nearby',
  PRICES: '/api/prices'
} as const;
