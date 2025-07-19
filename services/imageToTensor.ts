// services/imageToTensor.ts
import * as ImageManipulator from 'expo-image-manipulator'
import { decodeJpeg } from '@tensorflow/tfjs-react-native'
import * as tf from '@tensorflow/tfjs'
import * as FileSystem from 'expo-file-system'

export async function imageToTensor(uri: string): Promise<tf.Tensor4D> {
  try {
    console.log('🖼️ Processing image:', uri)
    console.log('🖼️ Image URI type:', typeof uri)
    console.log('🖼️ Image URI length:', uri.length)

    // First, try to validate the URI
    if (!uri || uri.trim() === '') {
      throw new Error('Empty or invalid image URI')
    }

    // Check if this is a permanent file (from our document directory)
    if (uri.includes('files/crop_image_') || uri.includes('files/gallery_image_')) {
      console.log('📁 Permanent file detected, using alternative processing...')
      return await processImageAlternative(uri)
    }

    // Add a small delay to ensure file is fully written (for camera images)
    if (uri.includes('Camera/')) {
      console.log('📸 Camera image detected, adding small delay...')
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    let resized: any
    let retryCount = 0
    const maxRetries = 3

    // Retry logic for image manipulation
    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Attempt ${retryCount + 1}/${maxRetries} to process image`)

        // Resize image to 224x224 and get as base64
        resized = await ImageManipulator.manipulateAsync(uri, [
          { resize: { width: 224, height: 224 } }
        ], {
          base64: true,
          format: ImageManipulator.SaveFormat.JPEG,
          compress: 0.8
        })

        console.log('✅ Image manipulation successful')
        break

      } catch (manipulatorError) {
        retryCount++
        console.error(`❌ ImageManipulator attempt ${retryCount} failed:`, manipulatorError)

        if (retryCount >= maxRetries) {
          console.log('🔄 ImageManipulator failed, trying alternative approach...')
          return await processImageAlternative(uri)
        }

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 200 * retryCount))
      }
    }

    if (!resized || !resized.base64) {
      throw new Error('Failed to get base64 from resized image')
    }

    console.log('🖼️ Image resized to 224x224')
    console.log('🖼️ Base64 length:', resized.base64.length)

    // Convert base64 to Uint8Array directly (without fetch)
    console.log('🖼️ Converting base64 to Uint8Array...')
    const binaryString = atob(resized.base64)
    const rawBytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      rawBytes[i] = binaryString.charCodeAt(i)
    }

    console.log('🖼️ Image data size:', rawBytes.length, 'bytes')

    // Decode JPEG to tensor and preprocess
    const imageTensor = decodeJpeg(rawBytes)
    console.log('🖼️ Decoded image tensor shape:', imageTensor.shape)

    // Validate tensor shape
    if (imageTensor.shape.length !== 3 || imageTensor.shape[2] !== 3) {
      imageTensor.dispose()
      throw new Error(`Invalid decoded tensor shape: ${imageTensor.shape}. Expected [224, 224, 3]`)
    }

    // Add batch dimension and normalize to [0, 1]
    const preprocessed = imageTensor
      .expandDims(0) // Add batch dimension: [1, 224, 224, 3]
      .div(255.0) // Normalize pixel values to [0, 1]

    console.log('🖼️ Preprocessed tensor shape:', preprocessed.shape)

    // Clean up intermediate tensor
    imageTensor.dispose()

    return preprocessed as tf.Tensor4D
  } catch (error) {
    console.error('❌ Error converting image to tensor:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      uri: uri,
      uriType: typeof uri
    })
    throw error
  }
}

// Alternative image processing method for when ImageManipulator fails
async function processImageAlternative(uri: string): Promise<tf.Tensor4D> {
  try {
    console.log('🔧 Using alternative image processing method...')

    // Try to read the image file directly using FileSystem
    let base64Data: string

    try {
      console.log('📁 Reading image file with FileSystem...')
      base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      console.log('✅ FileSystem read successful, base64 length:', base64Data.length)
    } catch (fsError) {
      console.error('❌ FileSystem read failed:', fsError)
      throw new Error(`Failed to read image file: ${fsError}`)
    }

    // Convert base64 to Uint8Array directly (without fetch)
    console.log('🔧 Converting base64 to Uint8Array...')
    const binaryString = atob(base64Data)
    const rawBytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      rawBytes[i] = binaryString.charCodeAt(i)
    }
    console.log('🔧 Alternative: Image data size:', rawBytes.length, 'bytes')

    // Decode JPEG to tensor
    const imageTensor = decodeJpeg(rawBytes)
    console.log('🔧 Alternative: Decoded tensor shape:', imageTensor.shape)

    // Resize tensor to 224x224 if needed
    let resizedTensor = imageTensor
    if (imageTensor.shape[0] !== 224 || imageTensor.shape[1] !== 224) {
      console.log('🔧 Alternative: Resizing tensor to 224x224...')
      resizedTensor = tf.image.resizeBilinear(imageTensor, [224, 224])
      imageTensor.dispose()
    }

    // Validate tensor shape
    if (resizedTensor.shape.length !== 3 || resizedTensor.shape[2] !== 3) {
      resizedTensor.dispose()
      throw new Error(`Invalid tensor shape: ${resizedTensor.shape}. Expected [224, 224, 3]`)
    }

    // Add batch dimension and normalize to [0, 1]
    const preprocessed = resizedTensor
      .expandDims(0) // Add batch dimension: [1, 224, 224, 3]
      .div(255.0) // Normalize pixel values to [0, 1]

    console.log('🔧 Alternative: Final tensor shape:', preprocessed.shape)

    // Clean up intermediate tensor
    resizedTensor.dispose()

    return preprocessed as tf.Tensor4D
  } catch (error) {
    console.error('❌ Alternative image processing failed:', error)
    throw new Error(`All image processing methods failed. Original error: ${error}`)
  }
}
