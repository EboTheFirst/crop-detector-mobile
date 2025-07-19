/**
 * API Call Hook
 * Provides standardized API calling with loading states, error handling, and retry logic
 */

import { useState, useCallback } from 'react';
import { ApiError } from '@/services/api';
import { useNetworkStatus } from './useNetworkStatus';
import { ERROR_MESSAGES } from '@/config/app';

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errorCode?: string;
  suggestions?: string[];
}

interface UseApiCallOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

export function useApiCall<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
) {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { isOffline } = useNetworkStatus();

  const execute = useCallback(
    async (...args: any[]) => {
      // Check network status
      if (isOffline) {
        setState(prev => ({
          ...prev,
          error: ERROR_MESSAGES.NETWORK_ERROR,
          loading: false,
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        errorCode: undefined,
        suggestions: undefined,
      }));

      let lastError: ApiError | null = null;
      const maxAttempts = options.retryAttempts || 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await apiFunction(...args);
          
          setState(prev => ({
            ...prev,
            data: result,
            loading: false,
            error: null,
          }));

          if (options.onSuccess) {
            options.onSuccess(result);
          }

          return result;
        } catch (error) {
          lastError = error instanceof ApiError ? error : new ApiError(
            error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
          );

          // If this is not the last attempt, wait before retrying
          if (attempt < maxAttempts) {
            await new Promise(resolve => 
              setTimeout(resolve, options.retryDelay || 1000)
            );
          }
        }
      }

      // All attempts failed
      if (lastError) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: lastError!.message,
          errorCode: lastError!.errorCode,
          suggestions: lastError!.suggestions,
        }));

        if (options.onError) {
          options.onError(lastError);
        }
      }

      return null;
    },
    [apiFunction, options, isOffline]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  const retry = useCallback(() => {
    // This will be set by the component using the hook
    // to store the last arguments used
    return execute;
  }, [execute]);

  return {
    ...state,
    execute,
    reset,
    retry,
    isLoading: state.loading,
    hasError: !!state.error,
    hasData: !!state.data,
  };
}

// Specialized hook for image upload with progress
export function useImageUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { isOffline } = useNetworkStatus();

  const uploadImage = useCallback(
    async (imageUri: string, onProgress?: (progress: number) => void) => {
      if (isOffline) {
        throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR);
      }

      setUploadProgress(0);

      // Simulate upload progress for now
      // In a real implementation, you would use XMLHttpRequest or fetch with progress tracking
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 0.1, 0.9);
          if (onProgress) {
            onProgress(newProgress);
          }
          return newProgress;
        });
      }, 100);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        clearInterval(progressInterval);
        setUploadProgress(1);
        
        if (onProgress) {
          onProgress(1);
        }

        // Return mock response
        return {
          predicted_disease: 'early_blight',
          crop_type: 'tomato',
          confidence: 0.85,
          message: 'Disease detected successfully',
        };
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    [isOffline]
  );

  return {
    uploadImage,
    uploadProgress,
    isUploading: uploadProgress > 0 && uploadProgress < 1,
  };
}

// Hook for caching API responses
export function useCachedApiCall<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  cacheKey: string,
  cacheDuration: number = 3600000, // 1 hour default
  options: UseApiCallOptions = {}
) {
  const apiCall = useApiCall(apiFunction, options);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);

  const executeWithCache = useCallback(
    async (...args: any[]) => {
      const now = Date.now();
      
      // Check if we have cached data that's still valid
      if (
        apiCall.data && 
        cacheTimestamp && 
        (now - cacheTimestamp) < cacheDuration
      ) {
        return apiCall.data;
      }

      // Execute API call and update cache timestamp
      const result = await apiCall.execute(...args);
      if (result) {
        setCacheTimestamp(now);
      }
      
      return result;
    },
    [apiCall, cacheTimestamp, cacheDuration]
  );

  return {
    ...apiCall,
    execute: executeWithCache,
    isCached: !!(apiCall.data && cacheTimestamp),
    cacheAge: cacheTimestamp ? Date.now() - cacheTimestamp : null,
  };
}
