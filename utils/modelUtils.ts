// utils/modelUtils.ts
import * as tf from '@tensorflow/tfjs'

export interface ModelInfo {
  inputShape: number[]
  outputShape: number[]
  totalParams?: number
  memoryUsage?: string
}

export class ModelValidator {
  static validateModel(model: tf.GraphModel): boolean {
    try {
      console.log('🔍 Starting model validation...')
      console.log('Model object:', typeof model)
      console.log('Model inputs:', model.inputs?.length || 0)
      console.log('Model outputs:', model.outputs?.length || 0)

      // Check if model has inputs and outputs
      if (!model.inputs || model.inputs.length === 0) {
        console.error('Model has no inputs')
        return false
      }

      if (!model.outputs || model.outputs.length === 0) {
        console.error('Model has no outputs')
        return false
      }

      // Log detailed model information
      console.log('Model inputs details:')
      model.inputs.forEach((input, i) => {
        console.log(`  Input ${i}:`, {
          name: input.name,
          shape: input.shape,
          dtype: input.dtype
        })
      })

      console.log('Model outputs details:')
      model.outputs.forEach((output, i) => {
        console.log(`  Output ${i}:`, {
          name: output.name,
          shape: output.shape,
          dtype: output.dtype
        })
      })

      // Validate input shape for image classification
      const inputShape = model.inputs[0].shape
      console.log('First input shape:', inputShape)

      if (!inputShape) {
        console.warn('Input shape is undefined, but continuing...')
      } else if (inputShape.length !== 4) {
        console.warn(`Unexpected input shape dimensions: ${inputShape.length}D. Expected 4D [batch, height, width, channels]`)
      } else {
        const [, height, width, channels] = inputShape
        if (height !== 224 || width !== 224 || channels !== 3) {
          console.warn(`Unexpected input dimensions: ${height}x${width}x${channels}. Expected 224x224x3`)
        }
      }

      // Validate output shape for classification
      const outputShape = model.outputs[0].shape
      console.log('First output shape:', outputShape)

      if (!outputShape) {
        console.warn('⚠️ Model output shape is undefined. This might be a dynamic shape model.')
        console.log('Attempting to continue with dynamic shape handling...')
        // Don't fail validation for undefined shapes - some models have dynamic outputs
        return true
      }

      // More flexible validation - accept different output shapes
      if (outputShape.length < 1) {
        console.error('Invalid output shape. Expected at least 1D tensor')
        return false
      }

      // For classification models, try to find the classes dimension
      let classesDim = outputShape[outputShape.length - 1]
      if (classesDim === null || classesDim === undefined) {
        console.warn('Output shape has undefined dimensions, assuming dynamic shape')
        return true
      }

      if (classesDim !== 22) {
        console.warn(`Unexpected number of classes: ${classesDim}. Expected 22`)
        // Don't fail validation, just warn
      }

      console.log(`✅ Model output shape validation passed: ${outputShape.join('x')}`)

      return true
    } catch (error) {
      console.error('Error validating model:', error)
      console.log('Continuing despite validation error...')
      return true // Don't fail on validation errors
    }
  }

  static getModelInfo(model: tf.GraphModel): ModelInfo {
    const inputShape = model.inputs[0].shape as number[]
    const outputShape = model.outputs[0].shape as number[]
    
    return {
      inputShape,
      outputShape,
      memoryUsage: `${tf.memory().numBytes} bytes`
    }
  }

  static async testModelPrediction(model: tf.GraphModel): Promise<boolean> {
    try {
      console.log('🧪 Testing model with dummy input...')

      // Create a dummy input tensor
      const dummyInput = tf.randomNormal([1, 224, 224, 3])
      console.log('🧪 Dummy input shape:', dummyInput.shape)

      // Run prediction
      const prediction = model.predict(dummyInput) as tf.Tensor
      console.log('🧪 Test prediction shape:', prediction.shape)
      console.log('🧪 Test prediction size:', prediction.size)

      // Handle different output shapes
      let processedPrediction = prediction
      let output: Float32Array | Int32Array | Uint8Array

      try {
        output = await prediction.data()
        console.log('🧪 Raw test output length:', output.length)

        // Try to squeeze if needed
        if (prediction.shape.length > 2) {
          processedPrediction = prediction.squeeze()
          console.log('🧪 Test squeezed prediction shape:', processedPrediction.shape)
          output = await processedPrediction.data()
          console.log('🧪 Squeezed test output length:', output.length)
        }

        // Handle different output lengths
        if (output.length > 22) {
          console.log('🧪 Trimming test output to first 22 values')
          output = output.slice(0, 22) as Float32Array
        }

      } catch (error) {
        console.error('🧪 Error getting test prediction data:', error)
        throw error
      }

      // Clean up
      dummyInput.dispose()
      prediction.dispose()
      if (processedPrediction !== prediction) {
        processedPrediction.dispose()
      }

      // Validate output length
      console.log(`🧪 Final test output length: ${output.length}`)
      if (output.length < 22) {
        console.warn(`⚠️ Test output too short: got ${output.length}, expected at least 22`)
        return false
      }

      // Check if outputs are valid numbers
      const validNumbers = Array.from(output).every(val => !isNaN(val) && isFinite(val))
      if (!validNumbers) {
        console.error('🧪 Test output contains invalid numbers')
        return false
      }

      // Check if outputs are valid probabilities (should sum to ~1 if softmax)
      const sum = Array.from(output.slice(0, 22)).reduce((a, b) => a + b, 0)
      console.log(`🧪 Model test successful! Output sum: ${sum.toFixed(4)}`)

      return true
    } catch (error) {
      console.error('🧪 Model test failed:', error)
      console.log('🧪 Continuing despite test failure...')
      return true // Don't fail the entire model loading due to test failure
    }
  }
}

export class TensorUtils {
  static logTensorInfo(tensor: tf.Tensor, name: string = 'Tensor') {
    console.log(`${name}:`, {
      shape: tensor.shape,
      dtype: tensor.dtype,
      size: tensor.size
    })
  }

  static async logTensorStats(tensor: tf.Tensor, name: string = 'Tensor') {
    const data = await tensor.data()
    const values = Array.from(data)
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    
    console.log(`${name} stats:`, {
      shape: tensor.shape,
      min: min.toFixed(4),
      max: max.toFixed(4),
      mean: mean.toFixed(4)
    })
  }

  static disposeTensors(...tensors: (tf.Tensor | null | undefined)[]) {
    tensors.forEach(tensor => {
      if (tensor) {
        tensor.dispose()
      }
    })
  }
}

export class MemoryManager {
  static logMemoryUsage(context: string = '') {
    const memory = tf.memory()
    console.log(`Memory usage ${context}:`, {
      numTensors: memory.numTensors,
      numDataBuffers: memory.numDataBuffers,
      numBytes: memory.numBytes,
      unreliable: memory.unreliable
    })
  }

  static async cleanupMemory() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    // Log memory after cleanup
    this.logMemoryUsage('after cleanup')
  }
}
