/**
 * Suppliers Tab Screen
 * Shows nearby agricultural suppliers with map integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcon } from '@/components/ThemedIcon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { api } from '@/services/api';
import { storage } from '@/services/storage';
import { Supplier, LocationData } from '@/types';

interface SuppliersState {
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  currentLocation: LocationData | null;
  selectedRadius: number;
}

export default function SuppliersScreen() {
  const [state, setState] = useState<SuppliersState>({
    suppliers: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    currentLocation: null,
    selectedRadius: 10,
  });

  const radiusOptions = [
    { value: 5, label: '5km' },
    { value: 10, label: '10km' },
    { value: 20, label: '20km' },
    { value: 50, label: '50km' },
    { value: 100, label: '100km' },
  ];

  // Get theme colors
  const screenBg = useThemeColor({}, 'screenBackground');
  const cardBg = useThemeColor({}, 'cardBackground');
  const searchBg = useThemeColor({}, 'searchBackground');
  const inputBg = useThemeColor({}, 'inputBackground');
  const inputTextColor = useThemeColor({}, 'inputText');
  const placeholderColor = useThemeColor({}, 'placeholderText');
  const dividerColor = useThemeColor({}, 'dividerColor');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const verifiedBg = useThemeColor({}, 'verifiedBackground');
  const verifiedTextColor = useThemeColor({}, 'verifiedText');
  const ratingBg = useThemeColor({}, 'ratingBackground');
  const ratingTextColor = useThemeColor({}, 'ratingText');
  const contactButtonBg = useThemeColor({}, 'contactButtonBackground');
  const contactButtonTextColor = useThemeColor({}, 'contactButtonText');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (state.currentLocation) {
      loadSuppliers();
    }
  }, [state.currentLocation, state.selectedRadius]);

  const getCurrentLocation = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setState(prev => ({ ...prev, isLoading: false }));
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to find nearby suppliers.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState(prev => ({ ...prev, isLoading: false }));
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to find nearby agricultural suppliers. Please grant location permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Get current position with better accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get address information
      let address;
      try {
        address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (addressError) {
        console.warn('Failed to get address:', addressError);
        address = [{ city: 'Unknown', region: 'Unknown', country: 'Ghana' }];
      }

      setState(prev => ({
        ...prev,
        currentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address[0]?.city || 'Unknown',
          region: address[0]?.region || 'Unknown',
          country: address[0]?.country || 'Ghana',
        },
        isLoading: false,
      }));

      console.log('✅ Location obtained:', location.coords.latitude, location.coords.longitude);

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      console.error('❌ Error getting location:', error);

      let errorMessage = 'Unable to get current location. ';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage += 'Location request timed out. Please check your GPS signal and try again.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Network error. Please check your internet connection.';
        } else if (error.message.includes('denied')) {
          errorMessage += 'Location access was denied. Please enable location permissions.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please check your location settings and try again.';
      }

      Alert.alert(
        'Location Error',
        errorMessage,
        [
          { text: 'Retry', onPress: getCurrentLocation },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const loadSuppliers = async () => {
    if (!state.currentLocation) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const isGhanaWideSearch = state.selectedRadius === -1;
      let actualRadius = isGhanaWideSearch ? 100 : state.selectedRadius; // Use 100km for Ghana-wide search (current backend limit)
      const locationKey = `${state.currentLocation.latitude},${state.currentLocation.longitude}-${isGhanaWideSearch ? 'ghana' : state.selectedRadius + 'km'}`;

      // Try to get from cache first
      let suppliers = await storage.supplier.getCachedSuppliers(locationKey);

      if (!suppliers) {
        // Fetch from API if not in cache
        try {
          const response = await api.supplier.getNearbySuppliers(
            `${state.currentLocation.latitude},${state.currentLocation.longitude}`,
            actualRadius,
            undefined,
            false
          );

          suppliers = response.suppliers;

          // For Ghana-wide search, filter out suppliers within 50km
          if (isGhanaWideSearch) {
            suppliers = suppliers.filter(supplier =>
              !supplier.distance_km || supplier.distance_km > 50
            );
          }

          // Cache the result
          await storage.supplier.cacheSuppliers(locationKey, suppliers);
        } catch (apiError) {
          console.error('API Error:', apiError);
          // If 100km fails, try with 50km as fallback
          if (isGhanaWideSearch && actualRadius > 50) {
            console.log('Retrying with 50km radius...');
            actualRadius = 50;
            const response = await api.supplier.getNearbySuppliers(
              `${state.currentLocation.latitude},${state.currentLocation.longitude}`,
              actualRadius,
              undefined,
              false
            );

            suppliers = response.suppliers.filter(supplier =>
              !supplier.distance_km || supplier.distance_km > 30 // Show suppliers beyond 30km as fallback
            );

            await storage.supplier.cacheSuppliers(locationKey, suppliers);
          } else {
            throw apiError; // Re-throw if not Ghana search or already at low radius
          }
        }
      }

      console.log('Loaded suppliers:', suppliers.length, suppliers);
      setState(prev => ({
        ...prev,
        suppliers,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading suppliers:', error);

      let errorMessage = 'Failed to load suppliers';
      if (error instanceof Error) {
        errorMessage = error.message;

        // Provide specific error messages for common issues
        if (error.message.includes('less than or equal to 100')) {
          errorMessage = 'Server limit: Cannot search beyond 100km. Please restart the backend server to enable larger radius searches.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  };

  const getFilteredSuppliers = () => {
    // First filter by radius (safety net in case backend doesn't filter properly)
    let filteredSuppliers = state.suppliers.filter(supplier => {
      const isGhanaWideSearch = state.selectedRadius === -1;

      if (isGhanaWideSearch) {
        // For Ghana-wide search, only show suppliers beyond 50km
        return !supplier.distance_km || supplier.distance_km > 50;
      } else {
        // For normal radius search, filter by selected radius
        if (supplier.distance_km && supplier.distance_km > state.selectedRadius) {
          return false;
        }
        return true;
      }
    });

    // Then filter by search query
    if (!state.searchQuery.trim()) {
      return filteredSuppliers;
    }

    const query = state.searchQuery.toLowerCase().replaceAll("_", " ");
    return filteredSuppliers.filter(supplier =>
      supplier.name?.toLowerCase().replaceAll("_", " ").includes(query) ||
      supplier.location?.toLowerCase().replaceAll("_", " ").includes(query) ||
      supplier.products?.some(product => product?.toLowerCase().replaceAll("_", " ").includes(query))
    );
  };

  const handleCall = (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert('Phone Not Available', 'This supplier has not provided a phone number.');
      return;
    }

    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    });
  };

  const handleEmail = (email: string) => {
    const url = `mailto:${email}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Email is not supported on this device');
      }
    });
  };

  const handleDirections = (supplier: Supplier) => {
    if (!supplier.latitude || !supplier.longitude) {
      Alert.alert('Location Not Available', 'This supplier does not have location coordinates available.');
      return;
    }

    const lat = supplier.latitude;
    const lng = supplier.longitude;
    const label = encodeURIComponent(supplier.name);

    // Try Google Maps first, then fallback to Apple Maps on iOS or default maps
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`;
    const defaultMapsUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;

    // Check if Google Maps is available
    Linking.canOpenURL(googleMapsUrl).then(supported => {
      if (supported) {
        Linking.openURL(googleMapsUrl);
      } else {
        // Fallback to platform-specific maps
        const fallbackUrl = Platform.OS === 'ios' ? appleMapsUrl : defaultMapsUrl;
        Linking.canOpenURL(fallbackUrl).then(fallbackSupported => {
          if (fallbackSupported) {
            Linking.openURL(fallbackUrl);
          } else {
            Alert.alert('Error', 'Maps application is not available on this device');
          }
        });
      }
    });
  };

  const renderSupplierItem = ({ item }: { item: Supplier }) => (
    <View style={[styles.supplierCard, { backgroundColor: cardBg }]}>
      <View style={styles.supplierHeader}>
        <View style={styles.supplierInfo}>
          <ThemedText style={styles.supplierName}>{item.name}</ThemedText>
          <View style={styles.locationContainer}>
            <ThemedIcon name="location-outline" size={14} colorKey="placeholderText" />
            <ThemedText style={[styles.supplierLocation, { color: placeholderColor }]}>{item.location}</ThemedText>
          </View>
          {item.distance_km && (
            <ThemedText style={[styles.distance, { color: buttonPrimary }]}>
              {item.distance_km?.toFixed(1)} km away
            </ThemedText>
          )}
        </View>
        
        <View style={styles.supplierBadges}>
          {item.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: verifiedBg }]}>
              <ThemedIcon name="checkmark-circle" size={16} colorKey="verifiedText" />
              <ThemedText style={[styles.verifiedText, { color: verifiedTextColor }]}>Verified</ThemedText>
            </View>
          )}
          <View style={[styles.ratingBadge, { backgroundColor: ratingBg }]}>
            <ThemedIcon name="star" size={14} colorKey="ratingIcon" />
            <ThemedText style={[styles.ratingText, { color: ratingTextColor }]}>{item.rating?.toFixed(1)}</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.productsContainer}>
        <ThemedText style={[styles.productsLabel, { color: inputTextColor }]}>Products:</ThemedText>
        <View style={styles.productTags}>
          {item.products.map((product, index) => (
            <View key={`${item.name || 'unknown'}-product-${product || 'unknown'}-${index}`} style={[styles.productTag, { backgroundColor: inputBg }]}>
              <ThemedText style={[styles.productText, { color: placeholderColor }]}>{product.replaceAll("_"," ")}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.contactContainer, { borderTopColor: dividerColor }]}>
        {/* Phone Button - Only show if phone number exists */}
        {item.phone && (
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: contactButtonBg }]}
            onPress={() => handleCall(item.phone)}
          >
            <ThemedIcon name="call" size={18} colorKey="successColor" />
            <ThemedText style={[styles.contactButtonText, { color: contactButtonTextColor }]}>
              Call
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Email Button - Only show if email exists */}
        {item.email && (
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: contactButtonBg }]}
            onPress={() => handleEmail(item.email!)}
          >
            <ThemedIcon name="mail" size={18} colorKey="buttonSecondary" />
            <ThemedText style={[styles.contactButtonText, { color: contactButtonTextColor }]}>Email</ThemedText>
          </TouchableOpacity>
        )}

        {/* Directions Button - Only show if coordinates exist */}
        {item.latitude && item.longitude && (
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: contactButtonBg }]}
            onPress={() => handleDirections(item)}
          >
            <ThemedIcon name="location" size={18} colorKey="warningColor" />
            <ThemedText style={[styles.contactButtonText, { color: contactButtonTextColor }]}>
              Directions
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Show message when no contact methods are available */}
        {!item.phone && !item.email && (!item.latitude || !item.longitude) && (
          <View style={styles.noContactContainer}>
            <ThemedIcon name="information-circle-outline" size={16} colorKey="placeholderText" />
            <ThemedText style={[styles.noContactText, { color: placeholderColor }]}>
              Limited contact information available
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="storefront-outline" size={64} color="#ccc" />
      <ThemedText style={styles.emptyTitle}>No Suppliers Found</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Try adjusting your search radius or location
      </ThemedText>
      <TouchableOpacity style={styles.retryButton} onPress={loadSuppliers}>
        <ThemedText style={styles.retryButtonText}>Retry Search</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: dividerColor }]}>
        <ThemedText style={styles.headerTitle}>Suppliers</ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={async () => {
              // Clear all supplier cache and reload
              await storage.supplier.clearAllCachedSuppliers();
              loadSuppliers();
            }}
            style={styles.headerButton}
          >
            <ThemedIcon name="refresh" size={20} colorKey="buttonPrimary" />
          </TouchableOpacity>
          <TouchableOpacity onPress={getCurrentLocation} style={styles.headerButton}>
            <ThemedIcon name="location" size={20} colorKey="buttonPrimary" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={[styles.searchContainer, { backgroundColor: cardBg, borderBottomColor: dividerColor }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: searchBg }]}>
          <ThemedIcon name="search" size={20} colorKey="placeholderText" />
          <TextInput
            style={[styles.searchInput, { color: inputTextColor }]}
            placeholder="Search suppliers or products..."
            value={state.searchQuery}
            onChangeText={(text) => setState(prev => ({ ...prev, searchQuery: text }))}
            placeholderTextColor={placeholderColor}
          />
        </View>
        
        <View style={styles.radiusContainer}>
          <ThemedText style={styles.radiusLabel}>Radius:</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.radiusScrollContent}
            style={styles.radiusScrollView}
          >
            {radiusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radiusButton,
                  state.selectedRadius === option.value && styles.radiusButtonActive,
                ]}
                onPress={async () => {
                  // Clear cache for current radius before changing
                  if (state.currentLocation) {
                    const isCurrentGhana = state.selectedRadius === -1;
                    const oldLocationKey = `${state.currentLocation.latitude},${state.currentLocation.longitude}-${isCurrentGhana ? 'ghana' : state.selectedRadius + 'km'}`;
                    await storage.supplier.clearCachedSuppliers(oldLocationKey);
                  }
                  setState(prev => ({ ...prev, selectedRadius: option.value }));
                }}
              >
                <ThemedText
                  style={[
                    styles.radiusButtonText,
                    state.selectedRadius === option.value && styles.radiusButtonTextActive,
                  ]}
                >
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Current Location */}
      {state.currentLocation && (
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <ThemedText style={styles.locationText}>
            {state.currentLocation.address}, {state.currentLocation.region}
          </ThemedText>
        </View>
      )}

      {/* Filter Status */}
      {!state.isLoading && !state.error && (
        <View style={styles.filterStatus}>
          <ThemedText style={styles.filterStatusText}>
            {state.selectedRadius === -1
              ? `Showing suppliers beyond 50km within 100km radius (${getFilteredSuppliers().length} found)`
              : `Showing suppliers within ${state.selectedRadius}km (${getFilteredSuppliers().length} found)`
            }
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
          data={getFilteredSuppliers()}
          renderItem={renderSupplierItem}
          keyExtractor={(item, index) => `supplier-${item.name || 'unknown'}-${item.location || 'unknown'}-${item.phone || 'unknown'}-${index}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set dynamically
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor will be set dynamically
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    // borderBottomColor will be set dynamically
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    // backgroundColor will be set dynamically
    padding: 16,
    borderBottomWidth: 1,
    // borderBottomColor will be set dynamically
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set dynamically
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    // color will be set dynamically
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
    minWidth: 60, // Ensure label doesn't get squeezed
  },
  radiusScrollView: {
    flex: 1,
  },
  radiusScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16, // Add padding at the end for better scrolling
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 60, // Ensure buttons have minimum width for longer text
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  radiusButtonText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  radiusButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
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
    // backgroundColor will be set dynamically
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    // color will be set dynamically
    marginLeft: 4,
  },
  distance: {
    fontSize: 12,
    // color will be set dynamically
    fontWeight: '500',
  },
  supplierBadges: {
    alignItems: 'flex-end',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set dynamically
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  verifiedText: {
    fontSize: 12,
    // color will be set dynamically
    fontWeight: '500',
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set dynamically
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    // color will be set dynamically
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
    // color will be set dynamically
  },
  productTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  productTag: {
    // backgroundColor will be set dynamically
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productText: {
    fontSize: 12,
    // color will be set dynamically
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    // borderTopColor will be set dynamically
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    // backgroundColor will be set dynamically
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    // color will be set dynamically
  },
  noContactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  noContactText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 4,
    // color will be set dynamically
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
  filterStatus: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterStatusText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '500',
  },
});
