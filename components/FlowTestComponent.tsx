// components/FlowTestComponent.tsx
// Test component to verify the complete end-to-end flow

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTfModel } from '@/hooks/useTfModel';
import { CropDetectionService } from '@/services/cropDetectionService';
import { api } from '@/services/api';
import { CropType } from '@/types';

export const FlowTestComponent: React.FC = () => {
  const { model, ready, error, loadingProgress } = useTfModel();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runCompleteFlowTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('🚀 Starting complete flow test...');

      // Step 1: Test model readiness
      addResult(`📱 Model Status: ${ready ? '✅ Ready' : '❌ Not Ready'}`);
      if (!ready) {
        addResult(`⏳ Loading Progress: ${loadingProgress}`);
        if (error) addResult(`❌ Model Error: ${error}`);
        return;
      }

      // Step 2: Test disease detection service
      if (model) {
        const detectionService = new CropDetectionService(model);
        addResult('✅ Detection service created');
        
        const modelInfo = detectionService.getModelInfo();
        addResult(`📊 Model Info: Input ${modelInfo?.inputShape}, Output ${modelInfo?.outputShape}`);
      }

      // Step 3: Test backend API connectivity
      try {
        addResult('🌐 Testing backend API connectivity...');
        const healthCheck = await api.healthCheck();
        addResult('✅ Backend API is healthy');
      } catch (error) {
        addResult(`❌ Backend API error: ${error}`);
      }

      // Step 4: Test disease information API
      try {
        addResult('🔍 Testing disease information API...');
        const diseaseInfo = await api.disease.getDiseaseInfo('anthracnose');
        addResult(`✅ Disease info retrieved: ${diseaseInfo.name}`);
      } catch (error) {
        addResult(`❌ Disease info error: ${error}`);
      }

      // Step 5: Test treatment recommendations API
      try {
        addResult('💊 Testing treatment recommendations API...');
        const recommendations = await api.recommendation.getRecommendations('anthracnose', {
          disease: 'anthracnose',
          user_location: 'Accra, Ghana',
          crop_type: CropType.CASHEW,
          organic_preference: false
        });
        addResult(`✅ Recommendations retrieved: ${recommendations.recommended_treatments.length} treatments`);
      } catch (error) {
        addResult(`❌ Recommendations error: ${error}`);
      }

      // Step 6: Test supplier locator API
      try {
        addResult('🏪 Testing supplier locator API...');
        const suppliers = await api.supplier.getNearbySuppliers('Accra, Ghana', 20);
        addResult(`✅ Suppliers found: ${suppliers.total_count} suppliers`);
      } catch (error) {
        addResult(`❌ Suppliers error: ${error}`);
      }

      // Step 7: Test price information API
      try {
        addResult('💰 Testing price information API...');
        const prices = await api.price.getTreatmentPrices('copper oxychloride', 'Ghana');
        addResult(`✅ Prices retrieved: ${prices.prices.length} price entries`);
      } catch (error) {
        addResult(`❌ Prices error: ${error}`);
      }

      addResult('🎉 Complete flow test finished!');

    } catch (error) {
      addResult(`❌ Test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testLocalPrediction = async () => {
    if (!ready || !model) {
      Alert.alert('Model Not Ready', 'Please wait for the model to load');
      return;
    }

    Alert.alert(
      'Local Prediction Test',
      'This would test local prediction with a sample image. For now, this is a placeholder since we need an actual image URI.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>End-to-End Flow Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model Status</Text>
        <Text style={styles.status}>
          Ready: {ready ? '✅' : '❌'} | Progress: {loadingProgress}
        </Text>
        {error && <Text style={styles.error}>Error: {error}</Text>}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isRunning && styles.buttonDisabled]} 
          onPress={runCompleteFlowTest}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run Complete Flow Test'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={testLocalPrediction}
          disabled={!ready}
        >
          <Text style={styles.buttonText}>Test Local Prediction</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.result}>{result}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flow Summary</Text>
        <Text style={styles.flowStep}>1. 📱 Local Disease Detection (TensorFlow.js)</Text>
        <Text style={styles.flowStep}>2. 🔍 Disease Information (Backend API)</Text>
        <Text style={styles.flowStep}>3. 💊 Treatment Recommendations (Backend API)</Text>
        <Text style={styles.flowStep}>4. 🏪 Supplier Locator (Backend API)</Text>
        <Text style={styles.flowStep}>5. 💰 Price Information (Backend API)</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  status: {
    fontSize: 16,
    color: '#666',
  },
  error: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  result: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  flowStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 10,
  },
});
