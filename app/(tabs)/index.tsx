/**
 * Home Screen - Main dashboard for the Crop Disease Detector app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { storage } from '@/services/storage';
import { DetectionResult, UserProfile } from '@/types';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalDetections: number;
  recentDetections: DetectionResult[];
  commonDiseases: string[];
}

export default function HomeScreen() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDetections: 0,
    recentDetections: [],
    commonDiseases: [],
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get theme colors for better accessibility
  const subtitleColor = useThemeColor({}, 'subtitleText');
  const secondaryColor = useThemeColor({}, 'secondaryText');
  const cardBackgroundColor = useThemeColor({}, 'statCardBackground');
  const buttonPrimaryColor = useThemeColor({}, 'buttonPrimary');
  const screenBg = useThemeColor({}, 'screenBackground');
  const headerBg = useThemeColor({}, 'cardBackground');
  const dividerColor = useThemeColor({}, 'dividerColor');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [detectionHistory, profile] = await Promise.all([
        storage.history.getDetectionHistory(),
        storage.user.getUserProfile(),
      ]);

      // Calculate common diseases
      const diseaseCount: Record<string, number> = {};
      detectionHistory.forEach((detection: DetectionResult) => {
        diseaseCount[detection.detectedDisease] = (diseaseCount[detection.detectedDisease] || 0) + 1;
      });

      const commonDiseases = Object.entries(diseaseCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([disease]) => disease);

      setStats({
        totalDetections: detectionHistory.length,
        recentDetections: detectionHistory.slice(0, 3),
        commonDiseases,
      });

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      id: 'camera',
      title: 'Detect Disease',
      subtitle: 'Capture crop image',
      icon: 'camera',
      color: buttonPrimaryColor,
      action: () => router.push('/(tabs)/camera'),
    },
    {
      id: 'history',
      title: 'View History',
      subtitle: 'Past detections',
      icon: 'time',
      color: useThemeColor({}, 'buttonSecondary'),
      action: () => router.push('/(tabs)/history'),
    },
    {
      id: 'suppliers',
      title: 'Find Suppliers',
      subtitle: 'Nearby stores',
      icon: 'storefront',
      color: useThemeColor({}, 'warningColor'),
      action: () => router.push('/(tabs)/suppliers'),
    },
    {
      id: 'help',
      title: 'Get Help',
      subtitle: 'Tutorials & FAQ',
      icon: 'help-circle',
      color: useThemeColor({}, 'helpActionColor'),
      action: () => router.push('/(tabs)/help'),
    },
  ];

  const renderQuickAction = (action: typeof quickActions[0]) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.quickAction, { backgroundColor: action.color }]}
      onPress={action.action}
    >
      <Ionicons name={action.icon as any} size={32} color="#fff" />
      <ThemedText style={styles.quickActionTitle}>{action.title}</ThemedText>
      <ThemedText style={styles.quickActionSubtitle}>{action.subtitle}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: dividerColor }]}>
          <View>
            <ThemedText style={styles.greeting}>
              Welcome{userProfile?.name ? `, ${userProfile.name}` : ''}!
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
              Detect crop diseases with AI
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={40} color={buttonPrimaryColor} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: headerBg }]}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Statistics */}
        <View style={[styles.section, { backgroundColor: headerBg }]}>
          <ThemedText style={styles.sectionTitle}>Your Statistics</ThemedText>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}>
              <ThemedText style={[styles.statNumber, { color: buttonPrimaryColor }]}>{stats.totalDetections}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>Total Detections</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}>
              <ThemedText style={[styles.statNumber, { color: buttonPrimaryColor }]}>{stats.commonDiseases.length}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>Disease Types</ThemedText>
            </View>
          </View>
        </View>

        {/* Getting Started */}
        {stats.totalDetections === 0 && (
          <View style={[styles.section, { backgroundColor: headerBg }]}>
            <ThemedText style={styles.sectionTitle}>Getting Started</ThemedText>
            <View style={styles.gettingStarted}>
              <Ionicons name="camera" size={48} color={buttonPrimaryColor} />
              <ThemedText style={styles.gettingStartedTitle}>
                Start Detecting Crop Diseases
              </ThemedText>
              <ThemedText style={[styles.gettingStartedText, { color: subtitleColor }]}>
                Take a photo of your crop to identify diseases and get treatment recommendations
              </ThemedText>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: buttonPrimaryColor }]}
                onPress={() => {
                  console.log('Navigating to camera...');
                  router.push('/(tabs)/camera');
                }}
              >
                <Ionicons name="camera" size={20} color="#fff" />
                <ThemedText style={styles.startButtonText}>Take Photo</ThemedText>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor will be set dynamically
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    // borderBottomColor will be set dynamically
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    // Color will be set dynamically using theme colors
  },
  profileButton: {
    padding: 4,
  },
  section: {
    // backgroundColor will be set dynamically
    marginTop: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: (width - 48) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    // backgroundColor will be set dynamically using theme colors
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    // color will be set dynamically using buttonPrimary
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
    // Color will be set dynamically using theme colors
  },
  gettingStarted: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  gettingStartedTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  gettingStartedText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    // Color will be set dynamically using theme colors
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set dynamically using theme colors
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
