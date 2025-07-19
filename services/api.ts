/**
 * API Service Layer for Crop Disease Detection App
 * Handles all communication with the FastAPI backend
 */

import {
  CropType,
  RecommendRequest,
  LocationRequest,
  RecommendationResponse,
  SuppliersResponse,
  PricesResponse,
  DiseaseDetectionResponse,
  DiseaseInfo,
  ErrorResponse,
  API_ENDPOINTS
} from '@/types';
import { APP_CONFIG, APP_CONSTANTS } from '@/config/app';

// Configuration
const API_CONFIG = {
  BASE_URL: APP_CONFIG.apiBaseUrl,
  TIMEOUT: APP_CONSTANTS.API_TIMEOUT,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Utility function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }
    
    throw new ApiError(
      errorData.detail || 'An error occurred',
      response.status,
      errorData.error_code,
      errorData.suggestions
    );
  }

  return response.json();
}

// Utility function to make API requests with retry logic
async function makeRequest<T>(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return handleResponse<T>(response);
  } catch (error) {
    if (retryCount < API_CONFIG.RETRY_ATTEMPTS && 
        (error instanceof TypeError || (error as any).name === 'AbortError')) {
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1)));
      return makeRequest<T>(url, options, retryCount + 1);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred'
    );
  }
}

// Disease-related API functions
export const diseaseApi = {
  /**
   * Get all supported diseases organized by crop type
   */
  async getSupportedDiseases(): Promise<Record<string, string[]>> {
    return makeRequest<Record<string, string[]>>(API_ENDPOINTS.DISEASES);
  },

  /**
   * Get diseases for a specific crop type
   */
  async getDiseasesByCrop(cropType: CropType): Promise<string[]> {
    return makeRequest<string[]>(`${API_ENDPOINTS.DISEASES}/${cropType}`);
  },

  /**
   * Get complete disease information
   */
  async getDiseaseInfo(diseaseName: string): Promise<DiseaseInfo> {
    try {
      return await makeRequest<DiseaseInfo>(`${API_ENDPOINTS.DISEASE_INFO}/${encodeURIComponent(diseaseName)}`);
    } catch (error: any) {
      // If it's a 404 error (disease not found), throw a more specific error
      if (error?.status === 404 || error?.message?.includes('Disease not found')) {
        throw new Error(`Disease "${diseaseName}" is not supported by the API`);
      }
      throw error;
    }
  },

  /**
   * Predict disease from image (mock endpoint)
   */
  async predictDisease(imageUri: string): Promise<DiseaseDetectionResponse> {
    // For now, this is a mock implementation
    // In a real app, you would upload the image as FormData
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'crop_image.jpg',
    } as any);

    return makeRequest<DiseaseDetectionResponse>(API_ENDPOINTS.PREDICT, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Recommendation API functions
export const recommendationApi = {
  /**
   * Get comprehensive treatment recommendations
   */
  async getRecommendations(
    diseaseName: string,
    request: RecommendRequest
  ): Promise<RecommendationResponse> {
    return makeRequest<RecommendationResponse>(
      `${API_ENDPOINTS.RECOMMEND}/${encodeURIComponent(diseaseName)}`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  },

  /**
   * Get quick treatment recommendation
   */
  async getQuickRecommendation(
    diseaseName: string,
    location: string = 'Ghana',
    organicOnly: boolean = false
  ): Promise<any> {
    const params = new URLSearchParams({
      location,
      organic_only: organicOnly.toString(),
    });

    return makeRequest<any>(
      `${API_ENDPOINTS.RECOMMEND}/quick/${encodeURIComponent(diseaseName)}?${params}`
    );
  },
};

// Supplier API functions
export const supplierApi = {
  /**
   * Find nearby agricultural suppliers
   */
  async getNearbySuppliers(
    location: string,
    radiusKm: number = 10,
    productType?: string,
    verifiedOnly: boolean = false
  ): Promise<SuppliersResponse> {
    const params = new URLSearchParams({
      location,
      radius_km: radiusKm.toString(),
      verified_only: verifiedOnly.toString(),
    });

    if (productType) {
      params.append('product_type', productType);
    }

    return makeRequest<SuppliersResponse>(`${API_ENDPOINTS.SUPPLIERS}?${params}`);
  },
};

// Price API functions
export const priceApi = {
  /**
   * Get current market prices for a treatment
   */
  async getTreatmentPrices(
    treatmentName: string,
    location?: string,
    quantity?: string,
    maxResults: number = 10
  ): Promise<PricesResponse> {
    const params = new URLSearchParams({
      max_results: maxResults.toString(),
    });

    if (location) {
      params.append('location', location);
    }

    if (quantity) {
      params.append('quantity', quantity);
    }

    return makeRequest<PricesResponse>(
      `${API_ENDPOINTS.PRICES}/${encodeURIComponent(treatmentName)}?${params}`
    );
  },
};

// Combined API object for easy import
export const api = {
  disease: diseaseApi,
  recommendation: recommendationApi,
  supplier: supplierApi,
  price: priceApi,
  
  // Utility function to update base URL
  setBaseUrl: (url: string) => {
    API_CONFIG.BASE_URL = url;
  },
  
  // Utility function to check API health
  async healthCheck(): Promise<any> {
    return makeRequest<any>('/');
  },
};
