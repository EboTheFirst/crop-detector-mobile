/**
 * Tutorial Screen
 * Interactive tutorial for first-time users
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

const { width } = Dimensions.get('window');

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  tips: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome to Crop Disease Detector',
    description: 'This app helps you identify crop diseases and get treatment recommendations using AI technology.',
    icon: 'leaf',
    tips: [
      'Works with Cashew, Cassava, Maize, and Tomato crops',
      'Provides accurate disease identification',
      'Offers treatment recommendations',
      'Finds nearby suppliers and pricing'
    ]
  },
  {
    id: 2,
    title: 'Taking Good Photos',
    description: 'The quality of your photo directly affects the accuracy of disease detection.',
    icon: 'camera',
    tips: [
      'Use good lighting - natural daylight works best',
      'Focus on the affected parts of the plant',
      'Fill the frame with the crop leaves or stems',
      'Avoid shadows and blurry images',
      'Take multiple photos from different angles'
    ]
  },
  {
    id: 3,
    title: 'Understanding Results',
    description: 'Learn how to interpret the disease detection results and confidence scores.',
    icon: 'analytics',
    tips: [
      'Confidence scores above 80% are highly reliable',
      'Scores between 60-80% are moderately reliable',
      'Scores below 60% may need verification',
      'You can manually select the correct crop type',
      'Review disease symptoms for confirmation'
    ]
  },
  {
    id: 4,
    title: 'Treatment Recommendations',
    description: 'Get detailed treatment plans with dosages, application methods, and timing.',
    icon: 'medical',
    tips: [
      'Filter by organic or chemical treatments',
      'Consider severity level for treatment selection',
      'Follow dosage instructions carefully',
      'Note application timing and frequency',
      'Read all safety precautions'
    ]
  },
  {
    id: 5,
    title: 'Finding Suppliers',
    description: 'Locate nearby agricultural suppliers and get current pricing information.',
    icon: 'storefront',
    tips: [
      'Enable location services for accurate results',
      'Contact suppliers to confirm availability',
      'Compare prices from multiple suppliers',
      'Check supplier ratings and verification',
      'Save supplier contacts for future use'
    ]
  },
  {
    id: 6,
    title: 'Offline Features',
    description: 'Use the app even without internet connection for basic functions.',
    icon: 'cloud-offline',
    tips: [
      'Disease information is cached for offline use',
      'Treatment recommendations work offline',
      'History is stored locally on your device',
      'Sync data when internet is available',
      'Camera functions work without internet'
    ]
  }
];

export default function TutorialScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    // Mark tutorial as completed (you could save this to storage)
    router.replace('/(tabs)');
  };

  const renderStep = (step: TutorialStep) => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name={step.icon as any} size={64} color="#4CAF50" />
      </View>
      
      <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
      <ThemedText style={styles.stepDescription}>{step.description}</ThemedText>
      
      <View style={styles.tipsContainer}>
        <ThemedText style={styles.tipsTitle}>Key Points:</ThemedText>
        {step.tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <ThemedText style={styles.tipText}>{tip}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {tutorialSteps.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentStep && styles.progressDotActive,
            index < currentStep && styles.progressDotCompleted,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.skipButton} onPress={skipTutorial}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Tutorial</ThemedText>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep(tutorialSteps[currentStep])}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.prevButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={prevStep}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentStep === 0 ? "#ccc" : "#666"} />
          <ThemedText style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            Previous
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.stepCounter}>
          <ThemedText style={styles.stepCounterText}>
            {currentStep + 1} of {tutorialSteps.length}
          </ThemedText>
        </View>

        <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={nextStep}>
          <ThemedText style={styles.nextButtonText}>
            {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
          </ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressDotActive: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#666',
    marginBottom: 32,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
    color: '#555',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  prevButton: {
    backgroundColor: '#f5f5f5',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginRight: 4,
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 4,
  },
  stepCounter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  stepCounterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
