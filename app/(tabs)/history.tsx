/**
 * History Tab Screen
 * Shows detection and treatment history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcon } from '@/components/ThemedIcon';
import { storage } from '@/services/storage';
import { DetectionResult, TreatmentHistory } from '@/types';
import { useThemeColor } from '@/hooks/useThemeColor';

interface HistoryItem {
  id: string;
  type: 'detection' | 'treatment';
  data: DetectionResult | TreatmentHistory;
  timestamp: Date;
}

export default function HistoryScreen() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'detections' | 'treatments'>('all');

  // Get theme colors for better accessibility
  const subtitleColor = useThemeColor({}, 'subtitleText');
  const secondaryColor = useThemeColor({}, 'secondaryText');
  const screenBg = useThemeColor({}, 'screenBackground');
  const cardBg = useThemeColor({}, 'cardBackground');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const buttonSecondary = useThemeColor({}, 'buttonSecondary');
  const dividerColor = useThemeColor({}, 'dividerColor');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      
      const [detections, treatments] = await Promise.all([
        storage.history.getDetectionHistory(),
        storage.history.getTreatmentHistory(),
      ]);

      const items: HistoryItem[] = [
        ...detections.map(detection => ({
          id: detection.id,
          type: 'detection' as const,
          data: detection,
          timestamp: new Date(detection.timestamp),
        })),
        ...treatments.map(treatment => ({
          id: treatment.id,
          type: 'treatment' as const,
          data: treatment,
          timestamp: treatment.appliedDate || new Date(),
        })),
      ];

      // Sort by timestamp (newest first)
      items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setHistoryItems(items);
    } catch (error) {
      console.error('Error loading history:', error);
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getFilteredItems = () => {
    switch (activeTab) {
      case 'detections':
        return historyItems.filter(item => item.type === 'detection');
      case 'treatments':
        return historyItems.filter(item => item.type === 'treatment');
      default:
        return historyItems;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderDetectionItem = (detection: DetectionResult) => (
    <TouchableOpacity
      style={[styles.historyItem, { backgroundColor: cardBg }]}
      onPress={() => {
        router.push({
          pathname: '/treatment-recommendations',
          params: {
            disease: detection.detectedDisease,
            cropType: detection.cropType,
            location: detection.location.address || 'Unknown',
          },
        });
      }}
    >
      <View style={styles.itemHeader}>
        <View style={[styles.itemIcon, { backgroundColor: `${buttonPrimary}20` }]}>
          <Ionicons name="camera" size={20} color={buttonPrimary} />
        </View>
        <View style={styles.itemInfo}>
          <ThemedText style={styles.itemTitle}>Disease Detection</ThemedText>
          <ThemedText style={[styles.itemSubtitle, { color: subtitleColor }]}>
            {detection.detectedDisease.replace(/_/g, ' ')} • {detection.cropType}
          </ThemedText>
          <ThemedText style={[styles.itemDate, { color: secondaryColor }]}>
            {formatDate(new Date(detection.timestamp))}
          </ThemedText>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: buttonPrimary }]}>
          <ThemedText style={styles.confidenceText}>
            {Math.round(detection.confidence * 100)}%
          </ThemedText>
        </View>
      </View>

      {detection.imageUri && (
        <Image source={{ uri: detection.imageUri }} style={styles.itemImage} />
      )}
    </TouchableOpacity>
  );

  const renderTreatmentItem = (treatment: TreatmentHistory) => (
    <TouchableOpacity style={[styles.historyItem, { backgroundColor: cardBg }]}>
      <View style={styles.itemHeader}>
        <View style={[styles.itemIcon, { backgroundColor: `${buttonSecondary}20` }]}>
          <Ionicons name="medical" size={20} color={buttonSecondary} />
        </View>
        <View style={styles.itemInfo}>
          <ThemedText style={styles.itemTitle}>Treatment Applied</ThemedText>
          <ThemedText style={[styles.itemSubtitle, { color: subtitleColor }]}>
            {treatment.disease.replace(/_/g, ' ')} • {treatment.cropType}
          </ThemedText>
          <ThemedText style={[styles.itemDate, { color: secondaryColor }]}>
            {formatDate(treatment.appliedDate || new Date())}
          </ThemedText>
        </View>
        <View style={[styles.costBadge, { backgroundColor: buttonSecondary }]}>
          <ThemedText style={styles.costText}>
            GHS {treatment.cost.toFixed(2)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.treatmentDetails, { borderTopColor: dividerColor }]}>
        <ThemedText style={[styles.treatmentCount, { color: subtitleColor }]}>
          {treatment.selectedTreatments.length} treatment(s) applied
        </ThemedText>
        {treatment.effectiveness && (
          <View style={styles.effectivenessContainer}>
            <ThemedText style={[styles.effectivenessLabel, { color: subtitleColor }]}>Effectiveness:</ThemedText>
            <ThemedText style={[
              styles.effectivenessValue,
              { color: treatment.effectiveness === 'excellent' ? buttonPrimary :
                       treatment.effectiveness === 'good' ? buttonPrimary :
                       treatment.effectiveness === 'fair' ? '#FF9800' : '#F44336' }
            ]}>
              {treatment.effectiveness}
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    return (
      <View style={styles.itemContainer}>
        {item.type === 'detection' 
          ? renderDetectionItem(item.data as DetectionResult)
          : renderTreatmentItem(item.data as TreatmentHistory)
        }
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color={secondaryColor} />
      <ThemedText style={styles.emptyTitle}>No History Yet</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: subtitleColor }]}>
        Start by capturing crop images to detect diseases
      </ThemedText>
      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: buttonPrimary }]}
        onPress={() => router.push('/(tabs)/camera')}
      >
        <Ionicons name="camera" size={20} color="#fff" />
        <ThemedText style={styles.startButtonText}>Start Detection</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: dividerColor }]}>
        <ThemedText style={styles.headerTitle}>History</ThemedText>
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: cardBg }]}>
        {[
          { key: 'all', label: 'All' },
          { key: 'detections', label: 'Detections' },
          { key: 'treatments', label: 'Treatments' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && [styles.activeTab, { backgroundColor: buttonPrimary }],
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? '#fff' : subtitleColor },
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* History List */}
      <FlatList
        data={getFilteredItems()}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set dynamically
  },
  header: {
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
  tabContainer: {
    flexDirection: 'row',
    // backgroundColor will be set dynamically
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {
    // backgroundColor will be set dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    // Color will be set dynamically using theme colors
  },
  activeTabText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    marginBottom: 12,
  },
  historyItem: {
    // backgroundColor will be set dynamically
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor will be set dynamically
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    marginBottom: 2,
    // Color will be set dynamically using theme colors
  },
  itemDate: {
    fontSize: 12,
    // Color will be set dynamically using theme colors
  },
  confidenceBadge: {
    // backgroundColor will be set dynamically
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  costBadge: {
    // backgroundColor will be set dynamically
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  costText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 12,
    resizeMode: 'cover',
  },
  treatmentDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    // borderTopColor will be set dynamically
  },
  treatmentCount: {
    fontSize: 14,
    marginBottom: 4,
    // Color will be set dynamically using theme colors
  },
  effectivenessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectivenessLabel: {
    fontSize: 14,
    marginRight: 8,
    // Color will be set dynamically using theme colors
  },
  effectivenessValue: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
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
    textAlign: 'center',
    marginBottom: 24,
    // Color will be set dynamically using theme colors
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set dynamically
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
