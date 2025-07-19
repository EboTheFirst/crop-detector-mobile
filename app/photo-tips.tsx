/**
 * Photo Tips Screen
 * Provides guidance on taking good photos for disease detection
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcon } from '@/components/ThemedIcon';
import { useThemeColor } from '@/hooks/useThemeColor';

interface PhotoTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  details: string[];
}

export default function PhotoTipsScreen() {
  // Get theme colors
  const screenBg = useThemeColor({}, 'screenBackground');
  const cardBg = useThemeColor({}, 'cardBackground');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const dividerColor = useThemeColor({}, 'dividerColor');

  const photoTips: PhotoTip[] = [
    {
      id: 'lighting',
      title: 'Good Lighting',
      description: 'Use natural light for best results',
      icon: 'sunny',
      details: [
        'Take photos during daylight hours',
        'Avoid direct harsh sunlight',
        'Use diffused light when possible',
        'Avoid shadows on the plant',
        'Turn on flash only if absolutely necessary'
      ]
    },
    {
      id: 'focus',
      title: 'Clear Focus',
      description: 'Ensure the diseased area is sharp and clear',
      icon: 'eye',
      details: [
        'Tap on the diseased area to focus',
        'Hold the phone steady while taking the photo',
        'Get close enough to see details clearly',
        'Avoid blurry or out-of-focus images',
        'Take multiple shots if needed'
      ]
    },
    {
      id: 'angle',
      title: 'Proper Angle',
      description: 'Position the camera for optimal view',
      icon: 'camera',
      details: [
        'Hold the phone parallel to the leaf surface',
        'Fill the frame with the affected area',
        'Avoid extreme angles or tilted shots',
        'Capture the entire diseased area',
        'Include some healthy tissue for comparison'
      ]
    },
    {
      id: 'background',
      title: 'Clean Background',
      description: 'Remove distractions from the photo',
      icon: 'crop',
      details: [
        'Use a plain background when possible',
        'Remove other leaves or debris',
        'Focus on one diseased area at a time',
        'Avoid cluttered backgrounds',
        'Use your hand as a backdrop if needed'
      ]
    },
    {
      id: 'distance',
      title: 'Optimal Distance',
      description: 'Get the right distance for detail',
      icon: 'resize',
      details: [
        'Get close enough to see symptoms clearly',
        'Maintain about 6-12 inches distance',
        'Ensure the entire affected area is visible',
        'Avoid getting too close (blurry)',
        'Avoid being too far (lack of detail)'
      ]
    },
    {
      id: 'multiple',
      title: 'Multiple Angles',
      description: 'Take several photos for better accuracy',
      icon: 'images',
      details: [
        'Capture different affected areas',
        'Take photos from various angles',
        'Include close-up and wider shots',
        'Show progression of the disease',
        'Document different symptoms'
      ]
    }
  ];

  const renderTip = (tip: PhotoTip) => (
    <View key={tip.id} style={[styles.tipCard, { backgroundColor: cardBg, borderColor: dividerColor }]}>
      <View style={styles.tipHeader}>
        <View style={[styles.tipIcon, { backgroundColor: `${buttonPrimary}20` }]}>
          <ThemedIcon name={tip.icon as any} size={24} colorKey="buttonPrimary" />
        </View>
        <View style={styles.tipHeaderText}>
          <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
          <ThemedText style={styles.tipDescription}>{tip.description}</ThemedText>
        </View>
      </View>
      <View style={styles.tipDetails}>
        {tip.details.map((detail, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={[styles.bullet, { backgroundColor: buttonPrimary }]} />
            <ThemedText style={styles.detailText}>{detail}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: dividerColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedIcon name="arrow-back" size={24} colorKey="text" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Taking Good Photos</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={[styles.introSection, { backgroundColor: cardBg }]}>
          <ThemedIcon name="information-circle" size={32} colorKey="buttonPrimary" />
          <ThemedText style={styles.introTitle}>Photo Quality Matters</ThemedText>
          <ThemedText style={styles.introText}>
            High-quality photos are essential for accurate disease detection. Follow these tips to capture the best images for analysis.
          </ThemedText>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          {photoTips.map(renderTip)}
        </View>

        {/* Best Practices Summary */}
        <View style={[styles.summarySection, { backgroundColor: cardBg }]}>
          <ThemedText style={styles.summaryTitle}>Quick Checklist</ThemedText>
          <View style={styles.checklistItem}>
            <ThemedIcon name="checkmark-circle" size={20} colorKey="successColor" />
            <ThemedText style={styles.checklistText}>Good natural lighting</ThemedText>
          </View>
          <View style={styles.checklistItem}>
            <ThemedIcon name="checkmark-circle" size={20} colorKey="successColor" />
            <ThemedText style={styles.checklistText}>Clear focus on diseased area</ThemedText>
          </View>
          <View style={styles.checklistItem}>
            <ThemedIcon name="checkmark-circle" size={20} colorKey="successColor" />
            <ThemedText style={styles.checklistText}>Clean, uncluttered background</ThemedText>
          </View>
          <View style={styles.checklistItem}>
            <ThemedIcon name="checkmark-circle" size={20} colorKey="successColor" />
            <ThemedText style={styles.checklistText}>Optimal distance (6-12 inches)</ThemedText>
          </View>
          <View style={styles.checklistItem}>
            <ThemedIcon name="checkmark-circle" size={20} colorKey="successColor" />
            <ThemedText style={styles.checklistText}>Multiple angles if possible</ThemedText>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: buttonPrimary }]}
            onPress={() => router.push('/(tabs)/camera')}
          >
            <ThemedIcon name="camera" size={24} colorKey="retryButtonText" />
            <ThemedText style={styles.actionButtonText}>Start Taking Photos</ThemedText>
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
  tipsContainer: {
    paddingHorizontal: 16,
  },
  tipCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipHeaderText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
  },
  tipDetails: {
    paddingLeft: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  summarySection: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checklistText: {
    fontSize: 16,
    marginLeft: 12,
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
