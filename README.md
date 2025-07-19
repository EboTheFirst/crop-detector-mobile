# Crop Disease Detector Mobile App

A comprehensive React Native mobile application for crop disease detection and treatment recommendations, designed specifically for farmers in Ghana.

## Features

### Core Functionality
- **Photo Capture & Disease Detection**: Use AI to identify crop diseases from photos
- **Treatment Recommendations**: Get detailed treatment plans with dosages and timing
- **Supplier Locator**: Find nearby agricultural suppliers with contact information
- **Price Estimation**: View treatment costs in Ghana Cedis (GHS)

### Supported Crops
- Cashew
- Cassava
- Maize
- Tomato

### Key Features
- **Offline Mode**: Works without internet for cached data
- **Treatment History**: Track past diagnoses and treatments
- **Location Services**: Find suppliers based on your location
- **User-Friendly Interface**: Designed for outdoor use with high contrast
- **Tutorial System**: Interactive guide for first-time users

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Storage**: AsyncStorage for offline functionality
- **Camera**: Expo Camera API
- **Location**: Expo Location

## Installation & Setup

1. **Prerequisites**
   ```bash
   npm install -g expo-cli
   ```

2. **Install Dependencies**
   ```bash
   cd crop-detector-mobile
   npm install
   ```

3. **Configure Backend URL**
   Update the API base URL in `config/app.ts`:
   ```typescript
   export const APP_CONFIG: AppConfig = {
     apiBaseUrl: 'YOUR_BACKEND_URL', // Update this
     // ... other config
   };
   ```

4. **Start Development Server**
   ```bash
   npx expo start
   ```

5. **Run on Device/Simulator**
   - iOS: Press `i` or scan QR code with Expo Go
   - Android: Press `a` or scan QR code with Expo Go

## Backend Integration

The app integrates with the FastAPI backend through these endpoints:

- `POST /api/diseases` - Image upload for disease detection
- `GET /api/recommendations/{disease_id}` - Treatment recommendations
- `GET /api/suppliers?lat={lat}&lon={lon}` - Nearby suppliers
- `GET /api/prices?treatment={treatment_id}` - Price information

## User Flow

1. **Capture Image**: Take photo of affected crop
2. **Disease Detection**: AI analyzes image and identifies disease
3. **Crop Confirmation**: User confirms or corrects crop type
4. **Treatment Selection**: Choose from recommended treatments
5. **Supplier Location**: Find nearby suppliers for treatments
6. **Price Estimation**: View cost breakdown in GHS
7. **Save Plan**: Store treatment plan in history

## Project Structure

```
crop-detector-mobile/
├── app/                          # Main application screens
│   ├── (tabs)/                   # Tab navigation screens
│   ├── camera.tsx               # Main camera screen
│   ├── disease-detection.tsx    # Disease analysis results
│   ├── treatment-recommendations.tsx # Treatment options
│   ├── supplier-locator.tsx     # Supplier finder
│   ├── price-estimation.tsx     # Cost breakdown
│   └── tutorial.tsx             # Interactive tutorial
├── services/                     # API and storage services
├── types/                        # TypeScript type definitions
├── config/                       # App configuration
└── components/                   # Reusable UI components
```

## Permissions Required

- **Camera**: For capturing crop images
- **Location**: For finding nearby suppliers
- **Storage**: For saving images and data locally

## Development

```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Type checking
npx tsc --noEmit
```

## License

This project is developed for the Ghana Agricultural Extension Service.
