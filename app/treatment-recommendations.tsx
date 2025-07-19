/**
 * Treatment Recommendations Screen
 * Shows detailed treatment recommendations for detected diseases
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcon } from '@/components/ThemedIcon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { api } from '@/services/api';
import {
  CropType,
  RecommendationResponse,
  Treatment,
  RecommendRequest,
} from '@/types';

interface RecommendationsState {
  isLoading: boolean;
  recommendations: RecommendationResponse | null;
  error: string | null;
  selectedTreatments: Treatment[];
  filters: {
    organicOnly: boolean;
  };
}

export default function TreatmentRecommendationsScreen() {
  const { disease, cropType, location, confidence } = useLocalSearchParams<{
    disease: string;
    cropType: string;
    location: string;
    confidence?: string;
  }>();

  // Theme colors
  const screenBg = useThemeColor({}, 'screenBackground');
  const cardBg = useThemeColor({}, 'cardBackground');
  const textPrimary = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'secondaryText');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const buttonSecondary = useThemeColor({}, 'buttonSecondary');
  const dividerColor = useThemeColor({}, 'dividerColor');
  const errorColor = useThemeColor({}, 'errorColor');
  const successColor = useThemeColor({}, 'successColor');
  const warningColor = useThemeColor({}, 'warningColor');

  const [state, setState] = useState<RecommendationsState>({
    isLoading: false,
    recommendations: null,
    error: null,
    selectedTreatments: [],
    filters: {
      organicOnly: false,
    },
  });

  useEffect(() => {
    if (disease && cropType && location) {
      loadRecommendations();
    }
  }, [disease, cropType, location, state.filters]);

  const loadRecommendations = async () => {
    if (!disease || !cropType || !location) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const request: RecommendRequest = {
        disease: disease.toLowerCase(),
        user_location: location,
        crop_type: cropType as CropType,
        organic_preference: state.filters.organicOnly,
      };

      const recommendations = await api.recommendation.getRecommendations(disease, request);

      setState(prev => ({
        ...prev,
        recommendations,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading recommendations:', error);

      // Try to create fallback recommendations
      try {
        console.log('Creating fallback recommendations for:', disease);
        const fallbackRecommendations = createFallbackRecommendations(disease, cropType as CropType);

        setState(prev => ({
          ...prev,
          recommendations: fallbackRecommendations,
          isLoading: false,
          error: null,
        }));
      } catch (fallbackError) {
        setState(prev => ({
          ...prev,
          error: 'Unable to load treatment recommendations. Please check your connection and try again.',
          isLoading: false,
        }));
      }
    }
  };

  const handleTreatmentSelection = (treatment: Treatment) => {
    setState(prev => {
      const isSelected = prev.selectedTreatments.some(t => t.name === treatment.name);
      const selectedTreatments = isSelected
        ? prev.selectedTreatments.filter(t => t.name !== treatment.name)
        : [...prev.selectedTreatments, treatment];

      console.log('Treatment selection changed:', {
        treatmentName: treatment.name,
        isSelected: !isSelected,
        totalSelected: selectedTreatments.length,
      });

      return { ...prev, selectedTreatments };
    });
  };

  const handleFilterChange = (key: keyof typeof state.filters, value: any) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }));
  };

  const proceedToSuppliers = () => {
    console.log('Navigating to general suppliers tab');

    // Navigate to the general suppliers tab
    router.push('/(tabs)/suppliers');
  };

  const renderTreatmentCard = (treatment: Treatment, index: number) => {
    const isSelected = state.selectedTreatments.some(t => t.name === treatment.name);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.treatmentCard,
          { backgroundColor: cardBg },
          [styles.treatmentCardSelected, { borderColor: successColor, backgroundColor: `${successColor}08` }]
        ]}
      >
        <View style={styles.treatmentHeader}>
          <View style={styles.treatmentInfo}>
            <ThemedText style={styles.treatmentName}>{treatment.name}</ThemedText>
            <View style={styles.treatmentMeta}>
              <View style={[styles.treatmentType, { backgroundColor: `${buttonSecondary}20` }]}>
                <ThemedText style={[styles.treatmentTypeText, { color: buttonSecondary }]}>
                  {treatment.type.toUpperCase()}
                </ThemedText>
              </View>
              {treatment.type === 'organic' && (
                <View style={[styles.organicBadge, { backgroundColor: `${successColor}20` }]}>
                  <Ionicons name="leaf" size={12} color={successColor} />
                  <ThemedText style={[styles.organicText, { color: successColor }]}>Organic</ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.treatmentDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="medical" size={16} color={textSecondary} />
            <ThemedText style={styles.detailText}>
              <ThemedText style={[styles.detailLabel, { color: textPrimary }]}>Active Ingredients: </ThemedText>
              {treatment.active_ingredients.join(', ')}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="water" size={16} color={textSecondary} />
            <ThemedText style={styles.detailText}>
              <ThemedText style={[styles.detailLabel, { color: textPrimary }]}>Application: </ThemedText>
              {treatment.application_method}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="scale" size={16} color={textSecondary} />
            <ThemedText style={styles.detailText}>
              <ThemedText style={[styles.detailLabel, { color: textPrimary }]}>Dosage: </ThemedText>
              {treatment.dosage}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={textSecondary} />
            <ThemedText style={styles.detailText}>
              <ThemedText style={[styles.detailLabel, { color: textPrimary }]}>Frequency: </ThemedText>
              {treatment.frequency}
            </ThemedText>
          </View>


        </View>

        {treatment.precautions?.length > 0 && (
          <View style={[styles.precautionsContainer, { backgroundColor: `${warningColor}10` }]}>
            <View style={styles.precautionsHeader}>
              <Ionicons name="warning" size={16} color={warningColor} />
              <ThemedText style={[styles.precautionsTitle, { color: warningColor }]}>Precautions</ThemedText>
            </View>
            {treatment.precautions.slice(0, 2).map((precaution, idx) => (
              <ThemedText key={idx} style={[styles.precautionText, { color: warningColor }]}>
                • {precaution}
              </ThemedText>
            ))}
          </View>
        )}

        <View style={styles.selectionIndicator}>
          <Ionicons
            name={"checkmark-circle"}
            size={24}
            color={successColor}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: cardBg }]}>
      <ThemedText style={styles.filtersTitle}>Filter Recommendations</ThemedText>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.organicToggle}
          onPress={() => handleFilterChange('organicOnly', !state.filters.organicOnly)}
        >
          <Ionicons
            name={state.filters.organicOnly ? "checkbox" : "square-outline"}
            size={20}
            color={state.filters.organicOnly ? successColor : textSecondary}
          />
          <ThemedText style={styles.organicToggleText}>Organic treatments only</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!disease || !cropType || !location) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
        <ThemedView style={[styles.errorContainer, { backgroundColor: cardBg }]}>
          <Ionicons name="alert-circle" size={48} color={errorColor} />
          <ThemedText style={[styles.errorText, { color: errorColor }]}>Missing required information</ThemedText>
          <TouchableOpacity style={[styles.button, { backgroundColor: buttonPrimary }]} onPress={() => router.back()}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: dividerColor }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Treatment Recommendations</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Disease Info */}
        <View style={[styles.diseaseInfo, { backgroundColor: cardBg }]}>
          <View style={styles.diseaseHeader}>
            <Ionicons name="medical" size={24} color={errorColor} />
            <ThemedText style={[styles.diseaseName, { color: errorColor }]}>
              {disease.replace(/_/g, ' ').toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.diseaseDetails}>
            <ThemedText style={[styles.diseaseDetail, { color: textSecondary }]}>
              <ThemedText style={[styles.diseaseDetailLabel, { color: textPrimary }]}>Crop: </ThemedText>
              {cropType}
            </ThemedText>
            <ThemedText style={[styles.diseaseDetail, { color: textSecondary }]}>
              <ThemedText style={[styles.diseaseDetailLabel, { color: textPrimary }]}>Location: </ThemedText>
              {location}
            </ThemedText>
            {confidence && (
              <ThemedText style={[styles.diseaseDetail, { color: textSecondary }]}>
                <ThemedText style={[styles.diseaseDetailLabel, { color: textPrimary }]}>Confidence: </ThemedText>
                {Math.round(parseFloat(confidence) * 100)}%
              </ThemedText>
            )}
          </View>
        </View>

        {/* Filters */}
        {renderFilters()}

        {/* Loading State */}
        {state.isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={successColor} />
            <ThemedText style={[styles.loadingText, { color: textSecondary }]}>Loading recommendations...</ThemedText>
          </View>
        )}

        {/* Error State */}
        {state.error && (
          <View style={[styles.errorContainer, { backgroundColor: cardBg }]}>
            <Ionicons name="alert-circle" size={32} color={errorColor} />
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {state.error}
            </ThemedText>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: successColor }]} onPress={loadRecommendations}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Recommendations */}
        {state.recommendations && !state.isLoading && (
          <>
            <View style={styles.recommendationsHeader}>
              <ThemedText style={styles.recommendationsTitle}>
                Recommended Treatments ({state.recommendations.recommended_treatments.length})
              </ThemedText>
              <ThemedText style={[styles.recommendationsSubtitle, { color: textSecondary }]}>
                Review recommended treatments for your crop disease
              </ThemedText>
            </View>

            <View style={styles.treatmentsList}>
              {state.recommendations.recommended_treatments.map(renderTreatmentCard)}
            </View>

            {/* Selected Treatments Summary */}
            {state.selectedTreatments.length > 0 && (
              <View style={[styles.summaryContainer, { backgroundColor: cardBg }]}>
                <ThemedText style={styles.summaryTitle}>
                  Selected Treatments ({state.selectedTreatments.length})
                </ThemedText>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {state.recommendations && !state.isLoading && (
        <View style={[styles.actionButtons, { backgroundColor: cardBg, borderTopColor: dividerColor }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: buttonPrimary }]}
            onPress={proceedToSuppliers}
          >
            <ThemedText style={styles.primaryButtonText}>
              Find Suppliers
            </ThemedText>
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
    // backgroundColor will be set dynamically
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
    // backgroundColor and borderBottomColor will be set dynamically
    borderBottomWidth: 1,
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
  diseaseInfo: {
    // backgroundColor will be set dynamically
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  diseaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: 'bold',
    // color will be set dynamically
    marginLeft: 8,
  },
  diseaseDetails: {
    gap: 4,
  },
  diseaseDetail: {
    fontSize: 14,
    // color will be set dynamically
  },
  diseaseDetailLabel: {
    fontWeight: '600',
    // color will be set dynamically
  },
  filtersContainer: {
    // backgroundColor will be set dynamically
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  organicToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organicToggleText: {
    fontSize: 14,
    marginLeft: 8,
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
    // color will be set dynamically
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    margin: 16,
    // backgroundColor will be set dynamically
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
    // color will be set dynamically
  },
  retryButton: {
    // backgroundColor will be set dynamically
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
  recommendationsHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationsSubtitle: {
    fontSize: 14,
    // color will be set dynamically
  },
  treatmentsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  treatmentCard: {
    // backgroundColor will be set dynamically
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  treatmentCardSelected: {
    // borderColor and backgroundColor will be set dynamically
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  treatmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  treatmentType: {
    // backgroundColor will be set dynamically
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  treatmentTypeText: {
    fontSize: 10,
    // color will be set dynamically
    fontWeight: '600',
  },
  organicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set dynamically
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  organicText: {
    fontSize: 10,
    // color will be set dynamically
    fontWeight: '600',
    marginLeft: 4,
  },
  treatmentRating: {
    alignItems: 'flex-end',
  },
  effectivenessBar: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  effectivenessText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  treatmentDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  detailLabel: {
    fontWeight: '600',
    // color will be set dynamically
  },
  precautionsContainer: {
    // backgroundColor will be set dynamically
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  precautionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  precautionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    // color will be set dynamically
    marginLeft: 4,
  },
  precautionText: {
    fontSize: 12,
    // color will be set dynamically
    lineHeight: 16,
    marginBottom: 2,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  summaryContainer: {
    // backgroundColor will be set dynamically
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    // color will be set dynamically
  },
  actionButtons: {
    padding: 16,
    // backgroundColor and borderTopColor will be set dynamically
    borderTopWidth: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor will be set dynamically
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
    // backgroundColor will be set dynamically
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

// Fallback function to create basic recommendations when API is unavailable
function createFallbackRecommendations(disease: string, cropType: CropType): RecommendationResponse {
  const diseaseKey = disease.toLowerCase().replace(/\s+/g, '_');

  // Basic treatment recommendations based on disease type
  const commonTreatments: Record<string, Treatment[]> = {
    // Fungal diseases
    anthracnose: [
      {
        name: 'Copper Fungicide',
        type: 'chemical',
        application_method: 'Foliar spray',
        dosage: '2-3ml per liter of water',
        frequency: 'Every 7-10 days',
        precautions: ['Wear protective gear', 'Avoid spraying during windy conditions'],
        active_ingredients: ['Copper sulfate'],
      },
      {
        name: 'Neem Oil',
        type: 'organic',
        application_method: 'Foliar spray',
        dosage: '5ml per liter of water',
        frequency: 'Every 5-7 days',
        precautions: ['Apply in early morning or evening'],
        active_ingredients: ['Azadirachtin'],
      },
    ],
    // Default treatments for unknown diseases
    default: [
      {
        name: 'General Purpose Fungicide',
        type: 'chemical',
        application_method: 'Foliar spray',
        dosage: '2ml per liter of water',
        frequency: 'Every 7-10 days',
        precautions: ['Follow label instructions'],
        active_ingredients: ['Mixed fungicides'],
      },
      {
        name: 'Organic Plant Tonic',
        type: 'organic',
        application_method: 'Foliar spray and soil drench',
        dosage: '10ml per liter of water',
        frequency: 'Every 10-14 days',
        precautions: ['Safe for organic farming'],
        active_ingredients: ['Plant extracts', 'Beneficial microorganisms'],
      },
    ],
  };

  const treatments = commonTreatments[diseaseKey] || commonTreatments.default;

  return {
    disease: disease,
    crop_type: cropType,
    location: 'Ghana',
    severity: 'moderate',
    disease_info: {
      name: disease,
      crop_type: cropType as CropType,
      symptoms: ['Visible disease symptoms on plant'],
      causes: ['Pathogen infection'],
      prevention_methods: ['Maintain good plant hygiene', 'Ensure proper spacing', 'Avoid overhead watering'],
      treatments: treatments,
      severity_indicators: {},
    },
    recommended_treatments: treatments,
    nearby_suppliers: [],
    price_estimates: [],
    total_estimated_cost_ghs: 0,
    emergency_contacts: [],
    additional_resources: [
      {
        title: 'Disease Management Guide',
        description: 'General guidelines for managing plant diseases',
        url: '#',
        type: 'guide',
      },
    ],
  };
}
