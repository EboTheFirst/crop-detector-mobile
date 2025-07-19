/**
 * Supplier Locator Screen
 * Shows nearby suppliers for selected treatments with map integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { api } from '@/services/api';
import { storage } from '@/services/storage';
import { Treatment, Supplier, LocationData } from '@/types';

interface SupplierLocatorState {
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;
  currentLocation: LocationData | null;
  selectedSuppliers: Supplier[];
  treatments: Treatment[];
}

export default function SupplierLocatorScreen() {
  const { treatments: treatmentsParam, location } = useLocalSearchParams<{
    treatments: string;
    location: string;
  }>();

  // Note: Theme colors temporarily removed due to bundling issue

  const [state, setState] = useState<SupplierLocatorState>({
    suppliers: [],
    isLoading: false,
    error: null,
    currentLocation: null,
    selectedSuppliers: [],
    treatments: [],
  });

  useEffect(() => {
    if (treatmentsParam) {
      try {
        const treatments = JSON.parse(treatmentsParam);
        setState(prev => ({ ...prev, treatments }));
      } catch (error) {
        console.error('Error parsing treatments:', error);
        Alert.alert('Error', 'Invalid treatment data');
        router.back();
      }
    }
  }, [treatmentsParam]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (state.currentLocation && state.treatments.length > 0) {
      loadSuppliers();
    }
  }, [state.currentLocation, state.treatments]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Use provided location as fallback
        setState(prev => ({
          ...prev,
          currentLocation: {
            latitude: 5.6037, // Accra coordinates as default
            longitude: -0.1870,
            address: location || 'Ghana',
          },
        }));
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      });

      setState(prev => ({
        ...prev,
        currentLocation: {
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
          address: address[0]?.city || location || 'Ghana',
        },
      }));
    } catch (error) {
      console.error('Error getting location:', error);
      // Use provided location as fallback
      setState(prev => ({
        ...prev,
        currentLocation: {
          latitude: 5.6037,
          longitude: -0.1870,
          address: location || 'Ghana',
        },
      }));
    }
  };

  const loadSuppliers = async () => {
    if (!state.currentLocation) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const locationKey = `${state.currentLocation.latitude},${state.currentLocation.longitude}`;
      
      // Try to get from cache first
      let suppliers = await storage.supplier.getCachedSuppliers(locationKey);
      
      if (!suppliers) {
        // Fetch from API if not in cache
        const response = await api.supplier.getNearbySuppliers(
          locationKey,
          20, // 20km radius
          'agricultural', // Filter for agricultural suppliers
          false
        );
        
        suppliers = response.suppliers;
        
        // Cache the result
        await storage.supplier.cacheSuppliers(locationKey, suppliers);
      }

      setState(prev => ({
        ...prev,
        suppliers,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load suppliers',
        isLoading: false,
      }));
    }
  };

  const handleSupplierSelection = (supplier: Supplier) => {
    setState(prev => {
      const isSelected = prev.selectedSuppliers.some(s => s.name === supplier.name);
      const selectedSuppliers = isSelected
        ? prev.selectedSuppliers.filter(s => s.name !== supplier.name)
        : [...prev.selectedSuppliers, supplier];

      return { ...prev, selectedSuppliers };
    });
  };

  const handleCall = (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    });
  };

  const proceedToPricing = () => {
    if (state.selectedSuppliers.length === 0) {
      Alert.alert('No Suppliers Selected', 'Please select at least one supplier to get pricing.');
      return;
    }

    router.push({
      pathname: '/price-estimation',
      params: {
        treatments: JSON.stringify(state.treatments),
        suppliers: JSON.stringify(state.selectedSuppliers),
        location: state.currentLocation?.address || 'Ghana',
      },
    });
  };

  const renderSupplierItem = ({ item }: { item: Supplier }) => {
    const isSelected = state.selectedSuppliers.some(s => s.name === item.name);
    
    return (
      <TouchableOpacity
        style={[styles.supplierCard, isSelected && styles.supplierCardSelected]}
        onPress={() => handleSupplierSelection(item)}
      >
        <View style={styles.supplierHeader}>
          <View style={styles.supplierInfo}>
            <ThemedText style={styles.supplierName}>{item.name}</ThemedText>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <ThemedText style={styles.supplierLocation}>{item.location}</ThemedText>
            </View>
            {item.distance_km && (
              <ThemedText style={styles.distance}>
                {item.distance_km.toFixed(1)} km away
              </ThemedText>
            )}
          </View>
          
          <View style={styles.supplierBadges}>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <ThemedText style={styles.verifiedText}>Verified</ThemedText>
              </View>
            )}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <ThemedText style={styles.ratingText}>{item.rating.toFixed(1)}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.productsContainer}>
          <ThemedText style={styles.productsLabel}>Available Products:</ThemedText>
          <View style={styles.productTags}>
            {item.products.slice(0, 3).map((product, index) => (
              <View key={`${item.id}-product-${index}-${product}`} style={styles.productTag}>
                <ThemedText style={styles.productText}>{product}</ThemedText>
              </View>
            ))}
            {item.products.length > 3 && (
              <View style={styles.productTag}>
                <ThemedText style={styles.productText}>+{item.products.length - 3}</ThemedText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contactContainer}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleCall(item.contact_phone)}
          >
            <Ionicons name="call" size={18} color="#4CAF50" />
            <ThemedText style={styles.contactButtonText}>Call</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="location" size={18} color="#FF9800" />
            <ThemedText style={styles.contactButtonText}>Directions</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.selectionIndicator}>
          <Ionicons
            name={isSelected ? "checkmark-circle" : "radio-button-off"}
            size={24}
            color={isSelected ? "#4CAF50" : "#ccc"}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="storefront-outline" size={64} color="#ccc" />
      <ThemedText style={styles.emptyTitle}>No Suppliers Found</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        No agricultural suppliers found in your area
      </ThemedText>
      <TouchableOpacity style={styles.retryButton} onPress={loadSuppliers}>
        <ThemedText style={styles.retryButtonText}>Retry Search</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (!treatmentsParam) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <ThemedText style={styles.errorText}>No treatments provided</ThemedText>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Find Suppliers</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Treatments Summary */}
      <View style={styles.treatmentsSummary}>
        <ThemedText style={styles.summaryTitle}>
          Looking for suppliers for {state.treatments.length} treatment(s)
        </ThemedText>
        <View style={styles.treatmentTags}>
          {state.treatments.slice(0, 2).map((treatment, index) => (
            <View key={`treatment-${treatment.name}-${index}`} style={styles.treatmentTag}>
              <ThemedText style={styles.treatmentTagText}>{treatment.name}</ThemedText>
            </View>
          ))}
          {state.treatments.length > 2 && (
            <View style={styles.treatmentTag}>
              <ThemedText style={styles.treatmentTagText}>+{state.treatments.length - 2}</ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Current Location */}
      {state.currentLocation && (
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <ThemedText style={styles.locationText}>
            Searching near {state.currentLocation.address}
          </ThemedText>
        </View>
      )}

      {/* Loading State */}
      {state.isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <ThemedText style={styles.loadingText}>Finding suppliers...</ThemedText>
        </View>
      )}

      {/* Error State */}
      {state.error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color="#F44336" />
          <ThemedText style={styles.errorText}>{state.error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadSuppliers}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Suppliers List */}
      {!state.isLoading && !state.error && (
        <FlatList
          data={state.suppliers}
          renderItem={renderSupplierItem}
          keyExtractor={(item) => item.name + item.location}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Selected Suppliers Summary */}
      {state.selectedSuppliers.length > 0 && (
        <View style={styles.selectedSummary}>
          <ThemedText style={styles.selectedTitle}>
            {state.selectedSuppliers.length} supplier(s) selected
          </ThemedText>
        </View>
      )}

      {/* Action Buttons */}
      {!state.isLoading && !state.error && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              state.selectedSuppliers.length === 0 && styles.buttonDisabled,
            ]}
            onPress={proceedToPricing}
            disabled={state.selectedSuppliers.length === 0}
          >
            <ThemedText style={styles.primaryButtonText}>Get Pricing</ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  treatmentsSummary: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  treatmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  treatmentTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  treatmentTagText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
    color: '#F44336',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  supplierCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  supplierCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  supplierLocation: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  distance: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  supplierBadges: {
    alignItems: 'flex-end',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '500',
    marginLeft: 4,
  },
  productsContainer: {
    marginBottom: 12,
  },
  productsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  productTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  productTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productText: {
    fontSize: 12,
    color: '#666',
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    color: '#333',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  selectedSummary: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  actionButtons: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
