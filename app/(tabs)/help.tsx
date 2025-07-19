/**
 * Help Tab Screen
 * Provides tutorials, FAQs, and support information
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcon } from '@/components/ThemedIcon';
import { useThemeColor } from '@/hooks/useThemeColor';

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  action?: () => void;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function HelpScreen() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Get theme colors
  const screenBg = useThemeColor({}, 'screenBackground');
  const cardBg = useThemeColor({}, 'cardBackground');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');

  const helpSections: HelpSection[] = [
    {
      id: 'tutorial',
      title: 'Getting Started',
      icon: 'play-circle',
      description: 'Learn how to use the app to detect crop diseases',
      action: () => router.push('/tutorial'),
    },
    {
      id: 'camera',
      title: 'Taking Good Photos',
      icon: 'camera',
      description: 'Tips for capturing clear crop images',
      action: () => router.push('/photo-tips'),
    },
    {
      id: 'diseases',
      title: 'Supported Crops & Diseases',
      icon: 'medical',
      description: 'Cashew, Cassava, Maize, and Tomato diseases',
      action: () => router.push('/supported-diseases'),
    },
  ];

  const faqs: FAQ[] = [
    {
      question: 'Which crops are supported?',
      answer: 'Currently, we support Cashew, Cassava, Maize, and Tomato crops with 22 different disease types.',
    },
    {
      question: 'How do I get the best photo results?',
      answer: 'Take photos in good lighting, focus on affected plant parts, avoid shadows, and ensure the diseased area is clearly visible in the frame.',
    },
    {
      question: 'How does the disease detection work?',
      answer: 'The app uses a on-device AI model that runs directly on your phone to identify crop diseases from photos. No internet required for detection.',
    },
    {
      question: 'What if my disease is not detected correctly?',
      answer: 'Consider taking multiple photos from different angles with better lighting. The app shows confidence levels to help you assess the results.',
    },
  ];





  const renderHelpSection = (section: HelpSection) => (
    <TouchableOpacity
      key={section.id}
      style={styles.helpSection}
      onPress={section.action}
    >
      <View style={styles.sectionIcon}>
        <Ionicons name={section.icon as any} size={24} color="#4CAF50" />
      </View>
      <View style={styles.sectionContent}>
        <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
        <ThemedText style={styles.sectionDescription}>{section.description}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderFAQ = (faq: FAQ, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.faqItem}
      onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
    >
      <View style={styles.faqHeader}>
        <ThemedText style={styles.faqQuestion}>{faq.question}</ThemedText>
        <Ionicons
          name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </View>
      {expandedFAQ === index && (
        <ThemedText style={styles.faqAnswer}>{faq.answer}</ThemedText>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: buttonPrimary }]}>
          <ThemedText style={styles.headerTitle}>Help & Support</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Get help using the Crop Disease Detector
          </ThemedText>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <ThemedText style={styles.sectionHeader}>Quick Start</ThemedText>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/tutorial')}
          >
            <View style={styles.quickActionIcon}>
              <ThemedIcon name="play-circle" size={32} colorKey="buttonPrimary" />
            </View>
            <View style={styles.quickActionContent}>
              <ThemedText style={styles.quickActionTitle}>Watch Tutorial</ThemedText>
              <ThemedText style={[styles.quickActionSubtitle, { color: buttonPrimary }]}>
                5-minute guide to get started
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Help Sections */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <ThemedText style={styles.sectionHeader}>Help Topics</ThemedText>
          {helpSections.map(renderHelpSection)}
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionHeader}>Frequently Asked Questions</ThemedText>
          {faqs.map(renderFAQ)}
        </View>



        {/* App Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionHeader}>About</ThemedText>
          <View style={styles.appInfo}>
            <ThemedText style={styles.appInfoText}>Crop Disease Detector v1.0.0</ThemedText>
            <ThemedText style={styles.appInfoText}>
              AI-powered crop disease detection for farmers
            </ThemedText>
          </View>
        </View>
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
    // backgroundColor will be set dynamically
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  section: {
    // backgroundColor will be set dynamically
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 16,
    color: '#333',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F5E8',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  quickActionIcon: {
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  faqItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
  },


  appInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
});
