// examples/CropDetectionExample.tsx
// Complete example showing how to use the crop detection system

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useTfModel } from '@/hooks/useTfModel'
import { CropDetectionService } from '@/services/cropDetectionService'
import { predictImage, PredictionResult } from '@/services/predictImage'
import { ModelValidator, MemoryManager } from '@/utils/modelUtils'

export const CropDetectionExample: React.FC = () => {
  const { model, ready, error, loadingProgress } = useTfModel()
  const [detectionService, setDetectionService] = useState<CropDetectionService | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    if (ready && model) {
      initializeService()
    }
  }, [ready, model])

  const initializeService = async () => {
    if (!model) return

    try {
      // Create detection service
      const service = new CropDetectionService(model)
      setDetectionService(service)

      // Log model info
      const modelInfo = service.getModelInfo()
      addTestResult(`Model Info: Input ${modelInfo?.inputShape}, Output ${modelInfo?.outputShape}`)

      // Test with a sample prediction (you would replace this with actual image URI)
      addTestResult('Service initialized successfully')
      
    } catch (error) {
      addTestResult(`Service initialization failed: ${error}`)
    }
  }

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const runManualTest = async () => {
    if (!detectionService) {
      addTestResult('Service not ready')
      return
    }

    try {
      // This is how you would use the service with an actual image
      // const result = await detectionService.detectCrop('file://path/to/image.jpg')
      
      addTestResult('Manual test would run here with actual image URI')
      
      // Example of direct prediction usage:
      // const result = await predictImage('file://path/to/image.jpg', model!)
      
    } catch (error) {
      addTestResult(`Test failed: ${error}`)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crop Detection System Status</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model Loading</Text>
        <Text style={styles.status}>
          Status: {ready ? '✅ Ready' : error ? '❌ Error' : '⏳ Loading'}
        </Text>
        <Text style={styles.progress}>Progress: {loadingProgress}</Text>
        {error && <Text style={styles.error}>Error: {error}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Status</Text>
        <Text style={styles.status}>
          Detection Service: {detectionService ? '✅ Ready' : '❌ Not Ready'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.testResult}>{result}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage Instructions</Text>
        <Text style={styles.instruction}>
          1. Import the CropDetector component into your screen
        </Text>
        <Text style={styles.instruction}>
          2. Use the useTfModel hook to get the model state
        </Text>
        <Text style={styles.instruction}>
          3. Create a CropDetectionService instance when model is ready
        </Text>
        <Text style={styles.instruction}>
          4. Call detectCrop(imageUri) to analyze images
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Example Code</Text>
        <Text style={styles.code}>
{`// In your component:
const { model, ready } = useTfModel()
const [service, setService] = useState(null)

useEffect(() => {
  if (ready && model) {
    setService(new CropDetectionService(model))
  }
}, [ready, model])

// To analyze an image:
const result = await service.detectCrop(imageUri)
if (result) {
  console.log('Detected:', result.label)
  console.log('Confidence:', result.confidence)
}`}
        </Text>
      </View>
    </ScrollView>
  )
}

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
    marginBottom: 5,
    color: '#666',
  },
  progress: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  error: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 5,
  },
  testResult: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    color: '#333',
  },
})
