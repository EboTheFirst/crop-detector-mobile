# Complete Crop Disease Detection System

This implementation provides a **complete end-to-end crop disease detection system** combining local TensorFlow.js inference with comprehensive backend API integration.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native + Expo)            │
├─────────────────────────────────────────────────────────────────┤
│  📱 LOCAL PREDICTION          │  🌐 BACKEND INTEGRATION         │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐    │
│  │   TensorFlow.js Model   │  │  │     FastAPI Backend     │    │
│  │   • Image Processing    │  │  │   • Disease Database    │    │
│  │   • Local Inference     │  │  │   • Treatment Recommendations │
│  │   • 22 Disease Classes  │  │  │   • Supplier Locator    │    │
│  └─────────────────────────┘  │  │   • Price Information   │    │
│                               │  └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Complete User Flow

1. **📸 Image Capture** → User takes photo of crop
2. **🤖 On-device AI Analysis** → TensorFlow.js model predicts disease
3. **📚 Disease Information** → Backend API provides detailed info
4. **💊 Treatment Recommendations** → Backend suggests treatments
5. **🏪 Supplier Locator** → Backend finds nearby suppliers
6. **💰 Price Information** → Backend provides current prices

## 📁 Project Structure

```
crop-detector-mobile/
├── app/                           # Expo Router screens
│   ├── disease-detection.tsx      # Main detection screen (LOCAL + API)
│   ├── treatment-recommendations.tsx # Treatment suggestions (API)
│   └── supplier-locator.tsx       # Supplier finder (API)
├── hooks/
│   └── useTfModel.ts              # TensorFlow.js model management
├── services/
│   ├── api.ts                     # Backend API integration
│   ├── imageToTensor.ts           # Image preprocessing for local model
│   ├── predictImage.ts            # Local prediction logic
│   └── cropDetectionService.ts    # Local detection service wrapper
├── components/
│   ├── CropDetector.tsx           # Complete detection UI
│   └── FlowTestComponent.tsx      # End-to-end flow testing
├── utils/
│   └── modelUtils.ts              # Model validation and utilities
├── constants/
│   └── labels.ts                  # Disease class labels
├── types/
│   └── index.ts                   # TypeScript interfaces
└── assets/model/                  # Local TensorFlow.js model
    ├── model.json                 # Model architecture
    ├── group1-shard1of3.bin      # Model weights (part 1)
    ├── group1-shard2of3.bin      # Model weights (part 2)
    └── group1-shard3of3.bin      # Model weights (part 3)

../GhAIHack_CropDiseasePrediction/ # Backend API
├── routes/
│   ├── disease.py                 # Disease information endpoints
│   ├── recommend.py               # Treatment recommendations
│   ├── suppliers.py               # Supplier locator
│   └── prices.py                  # Price information
├── services/
│   ├── treatment_service.py       # Treatment logic
│   ├── location_service.py        # Location services
│   └── overpass_service.py        # Supplier finding
└── data/
    └── disease_database.py        # Comprehensive disease database
```

## Key Components

### 1. Model Loading Hook (`useTfModel.ts`)
- Loads TensorFlow.js GraphModel from bundled assets
- Provides model state (ready, error, loading progress)
- Validates model architecture and tests with dummy input
- Manages memory and provides detailed logging

### 2. Image Processing (`imageToTensor.ts`)
- Converts image URIs to preprocessed tensors
- Handles image resizing to 224x224
- Normalizes pixel values to [0, 1] range
- Adds batch dimension for model input

### 3. Prediction Service (`predictImage.ts`)
- Takes image URI and model as parameters
- Returns structured prediction results
- Provides top-N predictions with confidence scores
- Handles tensor cleanup and memory management

### 4. Detection Service (`cropDetectionService.ts`)
- High-level service class for crop detection
- Manages model state and provides simple API
- Handles errors gracefully
- Provides model information and status

## Usage Examples

### Basic Usage

```typescript
import { useTfModel } from '@/hooks/useTfModel'
import { CropDetectionService } from '@/services/cropDetectionService'

const MyComponent = () => {
  const { model, ready, error } = useTfModel()
  const [service, setService] = useState(null)

  useEffect(() => {
    if (ready && model) {
      setService(new CropDetectionService(model))
    }
  }, [ready, model])

  const analyzeImage = async (imageUri: string) => {
    if (!service) return
    
    const result = await service.detectCrop(imageUri)
    if (result) {
      console.log('Detected:', result.label)
      console.log('Confidence:', result.confidence)
    }
  }
}
```

### Direct Prediction

```typescript
import { predictImage } from '@/services/predictImage'

const result = await predictImage(imageUri, model)
if (result) {
  console.log('Top prediction:', result.label)
  console.log('All predictions:', result.topPredictions)
}
```

## Model Information

- **Architecture**: MobileNetV2 with custom classification head
- **Input**: 224x224x3 RGB images
- **Output**: 22 crop disease classes
- **Format**: TensorFlow.js GraphModel
- **Classes**: See `constants/labels.ts` for complete list

## Supported Crops & Diseases

The model can detect diseases in:
- **Cashew**: Anthracnose, Gumosis, Healthy, Leaf Miner, Red Rust
- **Cassava**: Bacterial Blight, Brown Spot, Green Mite, Healthy, Mosaic
- **Maize**: Fall Armyworm, Grasshopper, Healthy, Leaf Beetle, Leaf Blight, Leaf Spot, Streak Virus
- **Tomato**: Healthy, Leaf Blight, Leaf Curl, Septoria Leaf Spot, Verticillium Wilt

## Performance Considerations

1. **Memory Management**: All tensors are properly disposed after use
2. **Model Validation**: Comprehensive validation ensures model integrity
3. **Error Handling**: Graceful error handling throughout the pipeline
4. **Logging**: Detailed logging for debugging and monitoring

## Troubleshooting

### Common Issues

1. **Model Loading Fails**
   - Check that all model files are in `assets/model/`
   - Verify TensorFlow.js packages are installed
   - Check console for detailed error messages

2. **Prediction Errors**
   - Ensure image URI is valid and accessible
   - Check image format (JPEG/PNG supported)
   - Verify model is loaded and ready

3. **Memory Issues**
   - Monitor tensor disposal in console logs
   - Use `MemoryManager.logMemoryUsage()` for debugging
   - Ensure proper cleanup in components

### Debug Mode

Enable detailed logging by checking console output:
- Model loading progress
- Tensor shapes and statistics
- Memory usage tracking
- Prediction results and timing

## Integration Steps

1. **Install Dependencies**
   ```bash
   npm install @tensorflow/tfjs @tensorflow/tfjs-react-native expo-image-manipulator
   ```

2. **Import Components**
   ```typescript
   import { CropDetector } from '@/components/CropDetector'
   ```

3. **Use in Your App**
   ```typescript
   export default function App() {
     return <CropDetector />
   }
   ```

## API Reference

### `useTfModel()`
Returns: `{ model, ready, error, loadingProgress }`

### `CropDetectionService`
- `detectCrop(imageUri: string): Promise<PredictionResult | null>`
- `isModelReady(): boolean`
- `getModelInfo(): ModelInfo | null`

### `PredictionResult`
```typescript
interface PredictionResult {
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
```

This implementation provides a robust, production-ready crop detection system with proper error handling, memory management, and comprehensive logging.
