/**
 * Disease Detection Screen
 * Handles image analysis and disease identification using the backend ML model
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcon } from '@/components/ThemedIcon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { api } from '@/services/api';
import { storage } from '@/services/storage';
import { useTfModel } from '@/hooks/useTfModel';
import { CropDetectionService } from '@/services/cropDetectionService';
import { PredictionResult } from '@/services/predictImage';
import {
  mapLocalToBackend,
  extractCropTypeFromLabel,
  extractDiseaseFromLabel,
  isHealthyPrediction
} from '@/utils/diseaseMapping';
import {
  CropType,
  DiseaseInfo,
  DetectionResult,
  LocationData,
} from '@/types';

const { width } = Dimensions.get('window');

interface DetectionState {
  isAnalyzing: boolean;
  result: PredictionResult | null;
  diseaseInfo: DiseaseInfo | null;
  error: string | null;
  selectedCropType: CropType | null;
}

export default function DiseaseDetectionScreen() {
  const { imageUri, cropType } = useLocalSearchParams<{
    imageUri: string;
    cropType?: string;
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

  // TensorFlow.js model hook
  const { model, ready: modelReady, error: modelError, loadingProgress } = useTfModel();
  const [detectionService, setDetectionService] = useState<CropDetectionService | null>(null);

  const [detection, setDetection] = useState<DetectionState>({
    isAnalyzing: false,
    result: null,
    diseaseInfo: null,
    error: null,
    selectedCropType: cropType as CropType || null,
  });

  // Initialize detection service when model is ready
  useEffect(() => {
    if (modelReady && model) {
      const service = new CropDetectionService(model);
      setDetectionService(service);
      console.log('Detection service initialized');
    }
  }, [modelReady, model]);

  useEffect(() => {
    if (imageUri) {
      analyzeImage();
    }
  }, [imageUri]);



  const saveDetectionToHistory = async (result: PredictionResult, diseaseMapping: any) => {
    try {
      const detectionResult: DetectionResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        imageUri: imageUri!,
        cropType: diseaseMapping.cropType,
        detectedDisease: diseaseMapping.backendDiseaseName,
        confidence: result.confidence,
        diseaseInfo: detection.diseaseInfo || undefined,
        location: {
          latitude: 0, // TODO: Get actual location
          longitude: 0,
          address: 'Unknown',
        },
        status: 'completed',
      };

      await storage.history.saveDetectionResult(detectionResult);
    } catch (error) {
      console.error('Error saving detection to history:', error);
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) return;

    // Check if model is ready
    if (!modelReady || !detectionService) {
      setDetection(prev => ({
        ...prev,
        error: modelError || 'AI model not ready. Please wait...',
      }));
      return;
    }

    setDetection(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
    }));

    try {
      console.log('Using local TensorFlow.js model for prediction');
      const result = await detectionService.detectCrop(imageUri);

      if (result) {
        // Map local prediction to backend format
        const diseaseMapping = mapLocalToBackend(result.label);

        if (!diseaseMapping) {
          throw new Error(`Unknown disease prediction: ${result.label}`);
        }

        setDetection(prev => ({
          ...prev,
          result,
          selectedCropType: diseaseMapping.cropType,
        }));

        // Handle healthy vs diseased predictions differently
        if (diseaseMapping.isHealthy) {
          console.log('✅ Healthy plant detected:', result.label);
          // For healthy plants, we might not need disease info
          setDetection(prev => ({
            ...prev,
            diseaseInfo: {
              name: 'Healthy Plant',
              crop_type: diseaseMapping.cropType,
              scientific_name: 'N/A',
              symptoms: ['No disease symptoms detected'],
              causes: [],
              prevention_methods: ['Maintain good agricultural practices'],
              treatments: [],
              severity_indicators: {},
            },
          }));
        } else {
          // For diseased plants, get detailed information from backend
          console.log('🦠 Disease detected:', result.label, '→', diseaseMapping.backendDiseaseName);
          await fetchDiseaseInfo(diseaseMapping.backendDiseaseName);
        }

        // Save detection result to history
        await saveDetectionToHistory(result, diseaseMapping);
      } else {
        throw new Error('Local model prediction failed');
      }

    } catch (error) {
      console.error('Disease detection error:', error);
      setDetection(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to analyze image',
      }));
    } finally {
      setDetection(prev => ({
        ...prev,
        isAnalyzing: false,
      }));
    }
  };

  const fetchDiseaseInfo = async (diseaseName: string) => {
    try {
      // Try to get from cache first
      let diseaseInfo = await storage.disease.getCachedDiseaseInfo(diseaseName);

      if (!diseaseInfo) {
        // Fetch from backend API
        diseaseInfo = await api.disease.getDiseaseInfo(diseaseName);

        // Cache the result
        await storage.disease.cacheDiseaseInfo(diseaseName, diseaseInfo);
      }

      setDetection(prev => ({
        ...prev,
        diseaseInfo,
      }));
    } catch (error) {
      // Use debug logging to reduce console noise
      console.debug('Disease info not available for:', diseaseName, error);

      // Create fallback basic info if API fails
      const fallbackInfo = createBasicDiseaseInfo(diseaseName);
      setDetection(prev => ({
        ...prev,
        diseaseInfo: fallbackInfo,
      }));
    }
  };

  const createBasicDiseaseInfo = (diseaseName: string): DiseaseInfo => {
    // Basic disease information based on common crop diseases
    const diseaseMap: Record<string, Partial<DiseaseInfo>> = {
      'anthracnose': {
        symptoms: ['Dark, sunken lesions on leaves and fruits', 'Premature fruit drop', 'Leaf spots with yellow halos'],
        scientific_name: 'Colletotrichum spp.',
      },
      'gumosis': {
        symptoms: ['Gum exudation from bark', 'Cankers on trunk and branches', 'Yellowing of leaves'],
        scientific_name: 'Phytophthora spp.',
      },
      'leaf_miner': {
        symptoms: ['Serpentine mines in leaves', 'Reduced photosynthesis', 'Premature leaf drop'],
        scientific_name: 'Liriomyza spp.',
      },
      'red_rust': {
        symptoms: ['Reddish-brown spots on leaves', 'Premature defoliation', 'Reduced yield'],
        scientific_name: 'Cephaleuros virescens',
      },
      'bacterial_blight': {
        symptoms: ['Water-soaked lesions', 'Yellowing and wilting', 'Bacterial ooze'],
        scientific_name: 'Xanthomonas spp.',
      },
      'brown_spot': {
        symptoms: ['Brown circular spots on leaves', 'Concentric rings in lesions', 'Premature leaf drop'],
        scientific_name: 'Cercospora spp.',
      },
      'green_mite': {
        symptoms: ['Yellowing of leaves', 'Fine webbing on leaves', 'Stunted growth'],
        scientific_name: 'Mononychellus tanajoa',
      },
      'mosaic': {
        symptoms: ['Mosaic pattern on leaves', 'Stunted growth', 'Reduced yield'],
        scientific_name: 'Cassava mosaic virus',
      },
      'fall_armyworm': {
        symptoms: ['Holes in leaves', 'Feeding damage on young plants', 'Presence of caterpillars'],
        scientific_name: 'Spodoptera frugiperda',
      },
      'grasshopper': {
        symptoms: ['Chewed leaf edges', 'Defoliation', 'Visible insects'],
        scientific_name: 'Locusta migratoria',
      },
      'leaf_beetle': {
        symptoms: ['Holes in leaves', 'Skeletonized leaves', 'Presence of beetles'],
        scientific_name: 'Diabrotica spp.',
      },
      'leaf_blight': {
        symptoms: ['Large brown lesions on leaves', 'Rapid spread in humid conditions', 'Premature senescence'],
        scientific_name: 'Helminthosporium spp.',
      },
      'leaf_spot': {
        symptoms: ['Circular spots on leaves', 'Yellow halos around spots', 'Premature defoliation'],
        scientific_name: 'Cercospora zeae-maydis',
      },
      'streak_virus': {
        symptoms: ['Yellow streaks on leaves', 'Stunted growth', 'Reduced grain filling'],
        scientific_name: 'Maize streak virus',
      },
      'leaf_curl': {
        symptoms: ['Curling and distortion of leaves', 'Yellowing', 'Stunted growth'],
        scientific_name: 'Tomato leaf curl virus',
      },
      'septoria_leaf_spot': {
        symptoms: ['Small dark spots with light centers', 'Yellowing of lower leaves', 'Premature defoliation'],
        scientific_name: 'Septoria lycopersici',
      },
      'verticillium_wilt': {
        symptoms: ['Yellowing and wilting of leaves', 'Vascular discoloration', 'Stunted growth'],
        scientific_name: 'Verticillium dahliae',
      },
    };

    const info = diseaseMap[diseaseName] || {};

    return {
      name: diseaseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      crop_type: detection.selectedCropType || CropType.CASSAVA, // Default to cassava if no crop type selected
      scientific_name: info.scientific_name || 'Unknown',
      symptoms: info.symptoms || ['Symptoms vary depending on the specific condition'],
      causes: [],
      prevention_methods: [],
      treatments: [],
      severity_indicators: {},
    };
  };



  const handleCropTypeChange = (newCropType: CropType) => {
    setDetection(prev => ({
      ...prev,
      selectedCropType: newCropType,
    }));
  };

  const proceedToRecommendations = () => {
    if (!detection.result || !detection.selectedCropType) return;

    const diseaseMapping = mapLocalToBackend(detection.result.label);
    if (!diseaseMapping) {
      Alert.alert('Error', 'Unable to find treatment recommendations for this prediction');
      return;
    }

    // Don't proceed to recommendations for healthy plants
    if (diseaseMapping.isHealthy) {
      Alert.alert(
        'Healthy Plant Detected',
        'Your plant appears to be healthy! Continue with regular care and monitoring.',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push({
      pathname: '/treatment-recommendations',
      params: {
        disease: diseaseMapping.backendDiseaseName,
        cropType: diseaseMapping.cropType,
        location: 'Ghana', // TODO: Get actual location
        confidence: detection.result.confidence.toString(),
        modelType: 'local',
      },
    });
  };

  const retakePhoto = () => {
    router.back();
  };

  const renderCropTypeSelector = () => {
    const cropTypes = Object.values(CropType);

    return (
      <View style={[styles.cropSelector, { backgroundColor: cardBg }]}>
        <ThemedText style={styles.sectionTitle}>Crop Type</ThemedText>
        <View style={styles.cropButtons}>
          {cropTypes.map((crop) => (
            <TouchableOpacity
              key={crop}
              style={[
                styles.cropButton,
                { backgroundColor: cardBg, borderColor: dividerColor },
                detection.selectedCropType === crop && [styles.cropButtonSelected, { borderColor: successColor, backgroundColor: `${successColor}10` }],
              ]}
            >
              <ThemedText
                style={[
                  styles.cropButtonText,
                  { color: textSecondary },
                  detection.selectedCropType === crop && [styles.cropButtonTextSelected, { color: successColor }],
                ]}
              >
                {crop.charAt(0).toUpperCase() + crop.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDetectionResult = () => {
    if (!detection.result) return null;

    const confidence = detection.result.confidence;
    const diseaseName = detection.result.label;
    const cropType = extractCropTypeFromLabel(detection.result.label);

    const confidenceColor = confidence >= 0.8 ? successColor :
                           confidence >= 0.6 ? warningColor : errorColor;

    return (
      <View style={[styles.resultContainer, { backgroundColor: cardBg }]}>
        <View style={styles.resultHeader}>
          <Ionicons name="medical" size={24} color={successColor} />
          <ThemedText style={styles.resultTitle}>Detection Result</ThemedText>
          <View style={[styles.modelBadge, { backgroundColor: `${successColor}20` }]}>
            <Ionicons name="phone-portrait" size={16} color={successColor} />
            <ThemedText style={[styles.modelBadgeText, { color: successColor }]}>AI</ThemedText>
          </View>
        </View>

        <View style={styles.diseaseCard}>
          <ThemedText style={styles.diseaseName}>
            {diseaseName.toUpperCase()}
          </ThemedText>

          <View style={styles.confidenceContainer}>
            <ThemedText style={[styles.confidenceLabel, { color: textPrimary }]}>Confidence:</ThemedText>
            <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
              <ThemedText style={styles.confidenceText}>
                {Math.round(confidence * 100)}%
              </ThemedText>
            </View>
          </View>

          <View style={styles.cropTypeContainer}>
            <ThemedText style={[styles.cropTypeLabel, { color: textPrimary }]}>Detected Crop:</ThemedText>
            <ThemedText style={[styles.cropTypeText, { color: successColor }]}>
              {cropType.toString().charAt(0).toUpperCase() + cropType.toString().slice(1)}
            </ThemedText>
          </View>

          {/* Show top predictions */}
          {detection.result.topPredictions.length > 1 && (
            <View style={[styles.topPredictionsContainer, { borderTopColor: dividerColor }]}>
              <ThemedText style={[styles.topPredictionsTitle, { color: textSecondary }]}>Alternative Predictions:</ThemedText>
              {detection.result.topPredictions.slice(1, 3).map((pred, index) => (
                <View key={index} style={styles.topPrediction}>
                  <ThemedText style={[styles.topPredictionLabel, { color: textPrimary }]}>{pred.label}</ThemedText>
                  <ThemedText style={[styles.topPredictionConfidence, { color: textSecondary }]}>
                    {Math.round(pred.confidence * 100)}%
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        {detection.diseaseInfo && (
          <View style={[styles.diseaseInfoCard, { backgroundColor: cardBg }]}>
            <ThemedText style={[styles.infoTitle, { color: textPrimary }]}>Disease Information</ThemedText>

            {detection.diseaseInfo.symptoms.length > 0 && (
              <View style={styles.infoSection}>
                <ThemedText style={[styles.infoSectionTitle, { color: textPrimary }]}>Key Symptoms:</ThemedText>
                {detection.diseaseInfo.symptoms.slice(0, 3).map((symptom, index) => (
                  <ThemedText key={index} style={[styles.symptomText, { color: textSecondary }]}>
                    • {symptom}
                  </ThemedText>
                ))}
              </View>
            )}

            {detection.diseaseInfo.scientific_name && (
              <View style={styles.infoSection}>
                <ThemedText style={[styles.infoSectionTitle, { color: textPrimary }]}>Scientific Name:</ThemedText>
                <ThemedText style={[styles.scientificName, { color: textSecondary }]}>
                  {detection.diseaseInfo.scientific_name}
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!imageUri) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
        <ThemedView style={[styles.errorContainer, { backgroundColor: cardBg }]}>
          <Ionicons name="alert-circle" size={48} color={errorColor} />
          <ThemedText style={[styles.errorText, { color: errorColor }]}>No image provided</ThemedText>
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
          <ThemedText style={styles.headerTitle}>Disease Detection</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Model Status */}
        {!modelReady && (
          <View style={[styles.modelStatusContainer, { backgroundColor: `${successColor}10` }]}>
            <ActivityIndicator size="small" color={successColor} />
            <ThemedText style={[styles.modelStatusText, { color: successColor }]}>
              Loading AI Model: {loadingProgress}
            </ThemedText>
          </View>
        )}

        {modelError && (
          <View style={[styles.modelErrorContainer, { backgroundColor: `${errorColor}10` }]}>
            <Ionicons name="alert-circle" size={20} color={errorColor} />
            <ThemedText style={[styles.modelErrorText, { color: errorColor }]}>
              Model Error: {modelError}
            </ThemedText>
          </View>
        )}

        {/* Image Display */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          {detection.isAnalyzing && (
            <View style={styles.analysisOverlay}>
              <ActivityIndicator size="large" color={successColor} />
              <ThemedText style={[styles.analysisText, { color: textPrimary }]}>
                Analyzing with AI...
              </ThemedText>
            </View>
          )}
        </View>

        {/* Error State */}
        {detection.error && (
          <View style={[styles.errorContainer, { backgroundColor: cardBg }]}>
            <Ionicons name="alert-circle" size={32} color={errorColor} />
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {detection.error}
            </ThemedText>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: buttonPrimary }]} onPress={analyzeImage}>
              <ThemedText style={styles.retryButtonText}>Retry Analysis</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Detection Result */}
        {detection.result && !detection.isAnalyzing && (
          <>
            {renderDetectionResult()}
            {renderCropTypeSelector()}
          </>
        )}

        {/* Action Buttons */}
        {detection.result && !detection.isAnalyzing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: cardBg, borderColor: dividerColor }]} onPress={retakePhoto}>
              <Ionicons name="camera" size={20} color={textSecondary} />
              <ThemedText style={[styles.secondaryButtonText, { color: textSecondary }]}>Retake Photo</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: buttonPrimary },
                !detection.selectedCropType && styles.buttonDisabled,
              ]}
              onPress={proceedToRecommendations}
              disabled={!detection.selectedCropType}
            >
              <ThemedText style={styles.primaryButtonText}>Get Treatment</ThemedText>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  imageContainer: {
    position: 'relative',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    // backgroundColor will be set dynamically
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisText: {
    // color will be set dynamically
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
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
  resultContainer: {
    margin: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  diseaseCard: {
    // backgroundColor will be set dynamically
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  diseaseName: {
    fontSize: 24,
    fontWeight: 'bold',
    // color will be set dynamically
    marginBottom: 12,
    textAlign: 'center',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cropTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropTypeLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  cropTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  diseaseInfoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  symptomText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  cropSelector: {
    margin: 16,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  cropButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  cropButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  cropButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  cropButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  cropButtonTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
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
    marginLeft: 8,
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
  modelStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  modelStatusText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
  },
  modelErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  modelErrorText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modelBadgeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  topPredictionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  topPredictionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  topPrediction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  topPredictionLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  topPredictionConfidence: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
