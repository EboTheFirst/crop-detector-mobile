/**
 * Location Services Hook
 * Handles location permissions and provides current location functionality
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { LocationData } from '@/types';
import { APP_CONFIG, ERROR_MESSAGES } from '@/config/app';

interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
}

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export function useLocation(options: UseLocationOptions = {}) {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    hasPermission: false,
  });

  const [watchId, setWatchId] = useState<Location.LocationSubscription | null>(null);

  // Check and request permissions
  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      
      setState(prev => ({
        ...prev,
        hasPermission,
        error: hasPermission ? null : ERROR_MESSAGES.LOCATION_PERMISSION,
      }));

      return hasPermission;
    } catch (error) {
      setState(prev => ({
        ...prev,
        hasPermission: false,
        error: ERROR_MESSAGES.LOCATION_PERMISSION,
      }));
      return false;
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check permission first
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState(prev => ({ ...prev, loading: false }));
        return null;
      }

      // Get location
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: options.enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
        maximumAge: options.maximumAge || 60000,
      });

      // Reverse geocode to get address
      let address = 'Unknown';
      let region = 'Unknown';
      let country = 'Ghana';

      try {
        const geocodeResult = await Location.reverseGeocodeAsync({
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
        });

        if (geocodeResult.length > 0) {
          const result = geocodeResult[0];
          address = result.city || result.district || result.subregion || 'Unknown';
          region = result.region || 'Unknown';
          country = result.country || 'Ghana';
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError);
      }

      const location: LocationData = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        address,
        region,
        country,
      };

      setState(prev => ({
        ...prev,
        location,
        loading: false,
        error: null,
      }));

      return location;
    } catch (error) {
      console.error('Location error:', error);
      
      // Use default location as fallback
      const defaultLocation = APP_CONFIG.defaultLocation;
      
      setState(prev => ({
        ...prev,
        location: defaultLocation,
        loading: false,
        error: 'Could not get precise location. Using default location.',
      }));

      return defaultLocation;
    }
  }, [options, requestPermission]);

  // Start watching position
  const startWatching = useCallback(async () => {
    if (watchId) {
      return; // Already watching
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return;
    }

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: options.enableHighAccuracy 
            ? Location.Accuracy.High 
            : Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 100, // Update every 100 meters
        },
        async (locationResult) => {
          // Reverse geocode for new location
          let address = 'Unknown';
          let region = 'Unknown';
          let country = 'Ghana';

          try {
            const geocodeResult = await Location.reverseGeocodeAsync({
              latitude: locationResult.coords.latitude,
              longitude: locationResult.coords.longitude,
            });

            if (geocodeResult.length > 0) {
              const result = geocodeResult[0];
              address = result.city || result.district || result.subregion || 'Unknown';
              region = result.region || 'Unknown';
              country = result.country || 'Ghana';
            }
          } catch (geocodeError) {
            console.warn('Geocoding failed:', geocodeError);
          }

          const location: LocationData = {
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude,
            address,
            region,
            country,
          };

          setState(prev => ({
            ...prev,
            location,
            error: null,
          }));
        }
      );

      setWatchId(subscription);
    } catch (error) {
      console.error('Watch position error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to start location tracking',
      }));
    }
  }, [options, requestPermission, watchId]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchId) {
      watchId.remove();
      setWatchId(null);
    }
  }, [watchId]);

  // Calculate distance between two points
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in kilometers
    },
    []
  );

  // Check permissions on mount
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setState(prev => ({
        ...prev,
        hasPermission: status === 'granted',
      }));
    });
  }, []);

  // Start watching if enabled
  useEffect(() => {
    if (options.watchPosition && state.hasPermission) {
      startWatching();
    }

    return () => {
      if (options.watchPosition) {
        stopWatching();
      }
    };
  }, [options.watchPosition, state.hasPermission, startWatching, stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    ...state,
    getCurrentLocation,
    requestPermission,
    startWatching,
    stopWatching,
    calculateDistance,
    isWatching: !!watchId,
  };
}
