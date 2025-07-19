import { imageToTensor } from '@/services/imageToTensor'
import { readableLabels } from '@/constants/labels'
import * as tf from '@tensorflow/tfjs'

export interface PredictionResult {
  label: string
  confidence: number
  classIndex: number
  allScores: number[]
  topPredictions: Array<{
    label: string
    confidence: number
    classIndex: number
  }>
}

export const predictImage = async (
  uri: string,
  model: tf.GraphModel
): Promise<PredictionResult | null> => {
  if (!model) {
    console.error('Model not provided')
    return null
  }

  try {
    // Convert image to tensor
    const tensor = await imageToTensor(uri)
    console.log('📸 Input tensor shape:', tensor.shape)

    // Make prediction
    console.log('🔮 Running model prediction...')
    const prediction = model.predict(tensor) as tf.Tensor
    console.log('📊 Raw prediction tensor shape:', prediction.shape)
    console.log('📊 Raw prediction tensor size:', prediction.size)

    // Handle different output shapes more robustly
    let processedPrediction = prediction
    let scores: Float32Array | Int32Array | Uint8Array

    try {
      // First, try to get the raw scores
      scores = await prediction.data()
      console.log('📈 Raw scores length:', scores.length)

      // If we have exactly 22 scores, we're good
      if (scores.length === 22) {
        console.log('✅ Perfect! Got exactly 22 class scores')
      } else {
        console.log(`⚠️ Got ${scores.length} scores, expected 22`)

        // Try to squeeze the tensor to remove singleton dimensions
        if (prediction.shape.length > 1) {
          processedPrediction = prediction.squeeze()
          console.log('🔄 Squeezed prediction shape:', processedPrediction.shape)
          scores = await processedPrediction.data()
          console.log('🔄 Squeezed scores length:', scores.length)
        }

        // If still not 22, try to find the right slice
        if (scores.length > 22) {
          console.log('🔪 Trimming scores to first 22 values')
          scores = scores.slice(0, 22) as Float32Array
        } else if (scores.length < 22) {
          throw new Error(`Insufficient output classes: got ${scores.length}, need 22`)
        }
      }
    } catch (error) {
      console.error('❌ Error processing prediction output:', error)
      throw error
    }

    // Get the predicted class index
    const classIndex = processedPrediction.argMax(-1).dataSync()[0]
    const confidence = scores[classIndex]
    const label = readableLabels[classIndex]

    console.log(`🎯 Prediction: ${label} (${(confidence * 100).toFixed(2)}%)`)

    // Get top 3 predictions
    const scoresArray = Array.from(scores)
    const topPredictions = scoresArray
      .map((score, index) => ({
        label: readableLabels[index],
        confidence: score,
        classIndex: index
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)

    // Clean up tensors
    tensor.dispose()
    prediction.dispose()
    if (processedPrediction !== prediction) {
      processedPrediction.dispose()
    }

    const result: PredictionResult = {
      label,
      confidence,
      classIndex,
      allScores: scoresArray,
      topPredictions
    }

    console.log('Prediction:', label, 'Confidence:', (confidence * 100).toFixed(2) + '%')

    return result
  } catch (error) {
    console.error('Error during prediction:', error)
    return null
  }
}