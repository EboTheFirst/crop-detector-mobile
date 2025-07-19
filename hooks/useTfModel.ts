// hooks/useTfModel.ts
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-react-native'
import { bundleResourceIO } from '@tensorflow/tfjs-react-native'
import { useEffect, useState } from 'react'
import { ModelValidator, MemoryManager } from '@/utils/modelUtils'

export const useTfModel = () => {
  const [model, setModel] = useState<tf.GraphModel | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState<string>('Initializing...')

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProgress('Initializing TensorFlow.js...')
        console.log('Initializing TensorFlow.js...')

        await tf.ready()
        console.log('TensorFlow.js ready, backend:', tf.getBackend())
        MemoryManager.logMemoryUsage('before model loading')

        setLoadingProgress('Loading model files...')

        // Load model using bundleResourceIO
        const modelJson = require('../assets/model/model.json')
        const modelWeights = [
          require('../assets/model/group1-shard1of3.bin'),
          require('../assets/model/group1-shard2of3.bin'),
          require('../assets/model/group1-shard3of3.bin'),
        ]

        console.log('Model JSON loaded:', typeof modelJson)
        console.log('Model weights loaded:', modelWeights.length)

        setLoadingProgress('Assembling model...')
        // Use tf.loadGraphModel for graph models (converted from TensorFlow)
        const loadedModel = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights))

        setLoadingProgress('Validating model...')
        // Validate the loaded model
        if (!ModelValidator.validateModel(loadedModel)) {
          throw new Error('Model validation failed')
        }

        console.log('Model loaded successfully')
        console.log('Model input shape:', loadedModel.inputs[0].shape)
        console.log('Model output shape:', loadedModel.outputs[0].shape)

        setLoadingProgress('Testing model...')
        // Test the model with dummy input
        const testPassed = await ModelValidator.testModelPrediction(loadedModel)
        if (!testPassed) {
          console.warn('Model test failed, but continuing anyway')
        }

        MemoryManager.logMemoryUsage('after model loading')

        setModel(loadedModel)
        setReady(true)
        setError(null)
        setLoadingProgress('Ready')

        console.log('✅ Model initialization complete')
      } catch (err) {
        console.error('❌ Error loading model:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading model'
        setError(errorMessage)
        setReady(false)
        setLoadingProgress('Failed')
        MemoryManager.logMemoryUsage('after error')
      }
    }

    load()
  }, [])

  return { model, ready, error, loadingProgress }
}
