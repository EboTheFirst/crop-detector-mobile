// components/CropDetector.tsx
import React, { useState, useEffect } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useTfModel } from '@/hooks/useTfModel'
import { CropDetectionService } from '@/services/cropDetectionService'
import { PredictionResult } from '@/services/predictImage'

export const CropDetector: React.FC = () => {
  const { model, ready, error } = useTfModel()
  const [detectionService, setDetectionService] = useState<CropDetectionService | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Initialize detection service when model is ready
  useEffect(() => {
    if (ready && model) {
      const service = new CropDetectionService(model)
      setDetectionService(service)
      console.log('Crop detection service initialized')
    }
  }, [ready, model])

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
        setPrediction(null) // Clear previous prediction
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
        setPrediction(null) // Clear previous prediction
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage || !detectionService) {
      Alert.alert('Error', 'Please select an image first')
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await detectionService.detectCrop(selectedImage)
      setPrediction(result)
      
      if (result) {
        console.log('Analysis complete:', result.label, `${(result.confidence * 100).toFixed(1)}%`)
      } else {
        Alert.alert('Error', 'Failed to analyze image')
      }
    } catch (error) {
      console.error('Error analyzing image:', error)
      Alert.alert('Error', 'Failed to analyze image')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const renderModelStatus = () => {
    if (error) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>Model Error: {error}</Text>
        </View>
      )
    }

    if (!ready) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.loadingText}>Loading AI Model...</Text>
        </View>
      )
    }

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.readyText}>✅ AI Model Ready</Text>
      </View>
    )
  }

  const renderPrediction = () => {
    if (!prediction) return null

    return (
      <View style={styles.predictionContainer}>
        <Text style={styles.predictionTitle}>Analysis Results:</Text>
        
        <View style={styles.mainPrediction}>
          <Text style={styles.predictionLabel}>{prediction.label}</Text>
          <Text style={styles.predictionConfidence}>
            {(prediction.confidence * 100).toFixed(1)}% confidence
          </Text>
        </View>

        <Text style={styles.topPredictionsTitle}>Top Predictions:</Text>
        {prediction.topPredictions.map((pred, index) => (
          <View key={index} style={styles.topPrediction}>
            <Text style={styles.topPredictionLabel}>{pred.label}</Text>
            <Text style={styles.topPredictionConfidence}>
              {(pred.confidence * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {renderModelStatus()}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Pick from Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.image} />
          
          <TouchableOpacity 
            style={[styles.analyzeButton, (!ready || isAnalyzing) && styles.disabledButton]} 
            onPress={analyzeImage}
            disabled={!ready || isAnalyzing}
          >
            <Text style={styles.analyzeButtonText}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Crop'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {renderPrediction()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  statusContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  readyText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  predictionContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  mainPrediction: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
  },
  predictionConfidence: {
    fontSize: 16,
    color: '#4caf50',
    marginTop: 5,
  },
  topPredictionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },
  topPrediction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topPredictionLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  topPredictionConfidence: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
})
