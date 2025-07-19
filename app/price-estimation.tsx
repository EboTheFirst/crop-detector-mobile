/**
 * Price Estimation Screen
 * Shows treatment cost estimates in Ghana Cedis (GHS) with detailed breakdowns
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { api } from '@/services/api';
import { storage } from '@/services/storage';
import { Treatment, Supplier, PriceInfo, TreatmentHistory } from '@/types';

interface PriceEstimationState {
  isLoading: boolean;
  error: string | null;
  treatments: Treatment[];
  suppliers: Supplier[];
  priceData: Record<string, PriceInfo[]>;
  totalCost: number;
  location: string;
}

export default function PriceEstimationScreen() {
  const { treatments: treatmentsParam, suppliers: suppliersParam, location } = useLocalSearchParams<{
    treatments: string;
    suppliers: string;
    location: string;
  }>();

  const [state, setState] = useState<PriceEstimationState>({
    isLoading: false,
    error: null,
    treatments: [],
    suppliers: [],
    priceData: {},
    totalCost: 0,
    location: location || 'Ghana',
  });

  useEffect(() => {
    if (treatmentsParam && suppliersParam) {
      try {
        const treatments = JSON.parse(treatmentsParam);
        const suppliers = JSON.parse(suppliersParam);
        setState(prev => ({ ...prev, treatments, suppliers }));
        loadPriceData(treatments);
      } catch (error) {
        console.error('Error parsing data:', error);
        Alert.alert('Error', 'Invalid data provided');
        router.back();
      }
    }
  }, [treatmentsParam, suppliersParam]);

  const loadPriceData = async (treatments: Treatment[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const pricePromises = treatments.map(async (treatment) => {
        try {
          // Try to get from cache first
          let prices = await storage.price.getCachedPrices(treatment.name);
          
          if (!prices) {
            // Fetch from API if not in cache
            const response = await api.price.getTreatmentPrices(
              treatment.name,
              state.location,
              undefined,
              5
            );
            prices = response.prices;
            
            // Cache the result
            await storage.price.cachePrices(treatment.name, prices);
          }
          
          return { treatmentName: treatment.name, prices };
        } catch (error) {
          console.error(`Error fetching prices for ${treatment.name}:`, error);
          // Return estimated prices based on treatment cost
          return {
            treatmentName: treatment.name,
            prices: [{
              product_name: treatment.name,
              supplier_name: 'Estimated',
              price_ghs: treatment.cost_estimate_ghs,
              quantity: '1 unit',
              unit: 'unit',
              location: state.location,
              last_updated: new Date().toISOString(),
              availability: 'Available',
            }]
          };
        }
      });

      const priceResults = await Promise.all(pricePromises);
      
      const priceData: Record<string, PriceInfo[]> = {};
      let totalCost = 0;

      priceResults.forEach(({ treatmentName, prices }) => {
        priceData[treatmentName] = prices;
        if (prices.length > 0) {
          // Use the lowest price for total calculation
          const lowestPrice = Math.min(...prices.map(p => p.price_ghs));
          totalCost += lowestPrice;
        }
      });

      setState(prev => ({
        ...prev,
        priceData,
        totalCost,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading price data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load price data',
        isLoading: false,
      }));
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'GHS 0.00';
    }
    return `GHS ${amount.toFixed(2)}`;
  };

  const saveTreatmentPlan = async () => {
    try {
      const treatmentHistory: TreatmentHistory = {
        id: Date.now().toString(),
        detectionId: 'manual', // This would come from the detection flow
        disease: 'Unknown', // This would come from the detection
        cropType: 'Unknown' as any, // This would come from the detection
        selectedTreatments: state.treatments,
        cost: state.totalCost,
        suppliers: state.suppliers,
        notes: `Treatment plan created on ${new Date().toLocaleDateString()}`,
      };

      await storage.history.saveTreatmentHistory(treatmentHistory);
      
      Alert.alert(
        'Treatment Plan Saved',
        'Your treatment plan has been saved to history.',
        [
          { text: 'View History', onPress: () => router.push('/(tabs)/history') },
          { text: 'OK', style: 'default' },
        ]
      );
    } catch (error) {
      console.error('Error saving treatment plan:', error);
      Alert.alert('Error', 'Failed to save treatment plan');
    }
  };

  const renderTreatmentPricing = (treatment: Treatment) => {
    const prices = state.priceData[treatment.name] || [];
    const fallbackPrice = treatment.cost_estimate_ghs || 0;
    const lowestPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price_ghs || 0)) : fallbackPrice;
    const highestPrice = prices.length > 0 ? Math.max(...prices.map(p => p.price_ghs || 0)) : fallbackPrice;

    return (
      <View key={treatment.name} style={styles.treatmentCard}>
        <View style={styles.treatmentHeader}>
          <ThemedText style={styles.treatmentName}>{treatment.name}</ThemedText>
          <View style={styles.priceRange}>
            <ThemedText style={styles.priceText}>
              {formatCurrency(lowestPrice)}
              {prices.length > 1 && ` - ${formatCurrency(highestPrice)}`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.treatmentDetails}>
          <ThemedText style={styles.treatmentType}>{treatment.type.toUpperCase()}</ThemedText>
          <ThemedText style={styles.treatmentDosage}>Dosage: {treatment.dosage}</ThemedText>
        </View>

        {prices.length > 0 && (
          <View style={styles.priceBreakdown}>
            <ThemedText style={styles.breakdownTitle}>Price Breakdown:</ThemedText>
            {prices.slice(0, 3).map((price, index) => (
              <View key={index} style={styles.priceItem}>
                <View style={styles.priceInfo}>
                  <ThemedText style={styles.supplierName}>{price.supplier_name}</ThemedText>
                  <ThemedText style={styles.priceQuantity}>
                    {price.quantity} {price.unit}
                  </ThemedText>
                </View>
                <ThemedText style={styles.priceAmount}>
                  {formatCurrency(price.price_ghs)}
                </ThemedText>
              </View>
            ))}
            {prices.length > 3 && (
              <ThemedText style={styles.moreOptions}>
                +{prices.length - 3} more options available
              </ThemedText>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCostSummary = () => (
    <View style={styles.summaryCard}>
      <ThemedText style={styles.summaryTitle}>Cost Summary</ThemedText>
      
      <View style={styles.summaryDetails}>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Number of Treatments:</ThemedText>
          <ThemedText style={styles.summaryValue}>{state.treatments.length}</ThemedText>
        </View>
        
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Selected Suppliers:</ThemedText>
          <ThemedText style={styles.summaryValue}>{state.suppliers.length}</ThemedText>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryRow}>
          <ThemedText style={styles.totalLabel}>Estimated Total Cost:</ThemedText>
          <ThemedText style={styles.totalAmount}>
            {formatCurrency(state.totalCost)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.summaryNote}>
        <Ionicons name="information-circle" size={16} color="#666" />
        <ThemedText style={styles.noteText}>
          Prices are estimates and may vary. Contact suppliers for current pricing.
        </ThemedText>
      </View>
    </View>
  );

  if (!treatmentsParam || !suppliersParam) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <ThemedText style={styles.errorText}>Missing required data</ThemedText>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Price Estimation</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <ThemedText style={styles.locationText}>
            Prices for {state.location}
          </ThemedText>
        </View>

        {/* Loading State */}
        {state.isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <ThemedText style={styles.loadingText}>Loading price data...</ThemedText>
          </View>
        )}

        {/* Error State */}
        {state.error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={32} color="#F44336" />
            <ThemedText style={styles.errorText}>{state.error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadPriceData(state.treatments)}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Treatment Pricing */}
        {!state.isLoading && !state.error && (
          <>
            <View style={styles.treatmentsSection}>
              <ThemedText style={styles.sectionTitle}>Treatment Pricing</ThemedText>
              {state.treatments.map(renderTreatmentPricing)}
            </View>

            {/* Cost Summary */}
            {renderCostSummary()}

            {/* Suppliers Info */}
            <View style={styles.suppliersSection}>
              <ThemedText style={styles.sectionTitle}>Selected Suppliers</ThemedText>
              {state.suppliers.map((supplier, index) => (
                <View key={index} style={styles.supplierItem}>
                  <View style={styles.supplierInfo}>
                    <ThemedText style={styles.supplierName}>{supplier.name}</ThemedText>
                    <ThemedText style={styles.supplierLocation}>{supplier.location}</ThemedText>
                  </View>
                  <View style={styles.supplierContact}>
                    <Ionicons name="call" size={16} color="#4CAF50" />
                    <ThemedText style={styles.contactText}>{supplier.contact_phone}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!state.isLoading && !state.error && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/(tabs)/history')}>
            <ThemedText style={styles.secondaryButtonText}>View History</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.primaryButton} onPress={saveTreatmentPlan}>
            <Ionicons name="save" size={20} color="#fff" />
            <ThemedText style={styles.primaryButtonText}>Save Plan</ThemedText>
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
  scrollView: {
    flex: 1,
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
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  treatmentsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  treatmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  treatmentName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  priceRange: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  treatmentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  treatmentType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  treatmentDosage: {
    fontSize: 12,
    color: '#666',
  },
  priceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceQuantity: {
    fontSize: 12,
    color: '#666',
  },
  priceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  moreOptions: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryDetails: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  suppliersSection: {
    padding: 16,
  },
  supplierItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  supplierInfo: {
    marginBottom: 8,
  },
  supplierLocation: {
    fontSize: 14,
    color: '#666',
  },
  supplierContact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  primaryButton: {
    flex: 1,
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
    marginLeft: 8,
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
