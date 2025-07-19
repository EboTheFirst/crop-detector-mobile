/**
 * Supported Diseases Screen
 * Shows all supported crops and their diseases
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcon } from '@/components/ThemedIcon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { api } from '@/services/api';

interface CropDiseases {
  [cropType: string]: string[];
}

export default function SupportedDiseasesScreen() {
  const [diseases, setDiseases] = useState<CropDiseases>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);

  // Get theme colors
  const screenBg = useThemeColor({}, 'screenBackground');
  const cardBg = useThemeColor({}, 'cardBackground');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const dividerColor = useThemeColor({}, 'dividerColor');

  // Crop information with icons and descriptions
  const cropInfo = {
    cashew: {
      icon: 'leaf',
      description: 'Cashew trees and nuts',
      color: '#8B4513'
    },
    cassava: {
      icon: 'nutrition',
      description: 'Cassava roots and leaves',
      color: '#CD853F'
    },
    maize: {
      icon: 'flower',
      description: 'Corn/Maize plants',
      color: '#FFD700'
    },
    tomato: {
      icon: 'restaurant',
      description: 'Tomato plants and fruits',
      color: '#FF6347'
    }
  };

  useEffect(() => {
    loadSupportedDiseases();
  }, []);

  const loadSupportedDiseases = async () => {
    try {
      setIsLoading(true);
      const supportedDiseases = await api.disease.getSupportedDiseases();
      setDiseases(supportedDiseases);
    } catch (error) {
      console.error('Error loading supported diseases:', error);
      Alert.alert('Error', 'Failed to load supported diseases');
      // Fallback to hardcoded data
      setDiseases({
        cashew: ['anthracnose', 'gumosis', 'leaf_miner', 'red_rust', 'healthy'],
        cassava: ['bacterial_blight', 'brown_spot', 'green_mite', 'mosaic', 'healthy'],
        maize: ['fall_armyworm', 'grasshopper', 'leaf_beetle', 'leaf_blight', 'leaf_spot', 'streak_virus', 'healthy'],
        tomato: ['leaf_blight', 'leaf_curl', 'septoria_leaf_spot', 'verticillium_wilt', 'healthy']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDiseaseName = (disease: string) => {
    return disease
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatCropName = (crop: string) => {
    return crop.charAt(0).toUpperCase() + crop.slice(1);
  };

  const renderCropSection = (cropType: string, diseaseList: string[]) => {
    const isExpanded = expandedCrop === cropType;
    const cropData = cropInfo[cropType as keyof typeof cropInfo];

    return (
      <View key={cropType} style={[styles.cropCard, { backgroundColor: cardBg, borderColor: dividerColor }]}>
        <TouchableOpacity
          style={styles.cropHeader}
          onPress={() => setExpandedCrop(isExpanded ? null : cropType)}
        >
          <View style={styles.cropHeaderLeft}>
            <View style={[styles.cropIcon, { backgroundColor: `${cropData?.color || buttonPrimary}20` }]}>
              <Ionicons name={cropData?.icon as any || 'leaf'} size={24} color={cropData?.color || buttonPrimary} />
            </View>
            <View style={styles.cropHeaderText}>
              <ThemedText style={styles.cropName}>{formatCropName(cropType)}</ThemedText>
              <ThemedText style={styles.cropDescription}>{cropData?.description || 'Agricultural crop'}</ThemedText>
              <ThemedText style={styles.diseaseCount}>{diseaseList.length} diseases supported</ThemedText>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.diseasesList}>
            {diseaseList.map((disease, index) => (
              <View key={disease} style={[styles.diseaseItem, { borderTopColor: dividerColor }]}>
                <View style={styles.diseaseInfo}>
                  <View style={[styles.diseaseIcon, { backgroundColor: disease === 'healthy' ? '#4CAF50' : '#FF9800' }]}>
                    <Ionicons
                      name={disease === 'healthy' ? 'checkmark' : 'warning'}
                      size={16}
                      color="#fff"
                    />
                  </View>
                  <ThemedText style={styles.diseaseName}>{formatDiseaseName(disease)}</ThemedText>
                </View>
                {disease === 'healthy' && (
                  <View style={styles.healthyBadge}>
                    <ThemedText style={styles.healthyBadgeText}>Healthy</ThemedText>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: dividerColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedIcon name="arrow-back" size={24} colorKey="text" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Supported Crops & Diseases</ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={buttonPrimary} />
          <ThemedText style={styles.loadingText}>Loading supported diseases...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: dividerColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedIcon name="arrow-back" size={24} colorKey="text" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Supported Crops & Diseases</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={[styles.introSection, { backgroundColor: cardBg }]}>
          <ThemedIcon name="medical" size={32} colorKey="buttonPrimary" />
          <ThemedText style={styles.introTitle}>Disease Detection Coverage</ThemedText>
          <ThemedText style={styles.introText}>
            Our AI model can detect diseases across {Object.keys(diseases).length} major crop types with {Object.values(diseases).flat().length} total disease classifications.
          </ThemedText>
        </View>

        {/* Crops and Diseases */}
        <View style={styles.cropsContainer}>
          {Object.entries(diseases).map(([cropType, diseaseList]) =>
            renderCropSection(cropType, diseaseList)
          )}
        </View>

        {/* Additional Information */}
        <View style={[styles.infoSection, { backgroundColor: cardBg }]}>
          <ThemedText style={styles.infoTitle}>Detection Accuracy</ThemedText>
          <ThemedText style={styles.infoText}>
            Our AI model has been trained on thousands of crop images and provides reliable disease detection with confidence scores to help you make informed decisions.
          </ThemedText>
          
          <View style={styles.accuracyStats}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>85%+</ThemedText>
              <ThemedText style={styles.statLabel}>Average Accuracy</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{Object.values(diseases).flat().length}</ThemedText>
              <ThemedText style={styles.statLabel}>Disease Types</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{Object.keys(diseases).length}</ThemedText>
              <ThemedText style={styles.statLabel}>Crop Types</ThemedText>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: buttonPrimary }]}
            onPress={() => router.push('/(tabs)/camera')}
          >
            <ThemedIcon name="camera" size={24} colorKey="retryButtonText" />
            <ThemedText style={styles.actionButtonText}>Start Disease Detection</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
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
  scrollView: {
    flex: 1,
  },
  introSection: {
    padding: 24,
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#666',
  },
  cropsContainer: {
    paddingHorizontal: 16,
  },
  cropCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cropHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cropIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cropHeaderText: {
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  cropDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  diseaseCount: {
    fontSize: 12,
    color: '#999',
  },
  diseasesList: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  diseaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  diseaseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  diseaseIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  diseaseName: {
    fontSize: 16,
    flex: 1,
  },
  healthyBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthyBadgeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  infoSection: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 20,
  },
  accuracyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionSection: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
