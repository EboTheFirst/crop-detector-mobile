// services/cropDetectionService.ts
import * as tf from '@tensorflow/tfjs'
import { predictImage, PredictionResult } from './predictImage'

export class CropDetectionService {
  private model: tf.GraphModel | null = null
  private isReady: boolean = false

  constructor(model: tf.GraphModel | null) {
    this.model = model
    this.isReady = model !== null
  }

  updateModel(model: tf.GraphModel | null) {
    this.model = model
    this.isReady = model !== null
  }

  async detectCrop(imageUri: string): Promise<PredictionResult | null> {
    if (!this.isReady || !this.model) {
      console.error('Model not ready for prediction')
      return null
    }

    try {
      const result = await predictImage(imageUri, this.model)
      return result
    } catch (error) {
      console.error('Error in crop detection:', error)
      return null
    }
  }

  isModelReady(): boolean {
    return this.isReady
  }

  getModelInfo() {
    if (!this.model) return null
    
    return {
      inputShape: this.model.inputs[0].shape,
      outputShape: this.model.outputs[0].shape,
      ready: this.isReady
    }
  }
}
