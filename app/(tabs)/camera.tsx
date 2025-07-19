/**
 * Camera Tab Screen
 * Provides camera functionality directly in the tab
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcon } from '@/components/ThemedIcon';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width, height } = Dimensions.get('window');

interface CapturedImage {
  uri: string;
  width: number;
  height: number;
}

export default function CameraTabScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState<'on' | 'off' | 'auto'>('auto');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isTabFocused, setIsTabFocused] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Get theme colors
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const screenBg = useThemeColor({}, 'screenBackground');

  useEffect(() => {
    // Request permissions on component mount
    const requestPermissions = async () => {
      console.log('Camera Tab - permission status:', permission);
      if (permission && !permission.granted) {
        console.log('Camera Tab - requesting camera permission...');
        const result = await requestPermission();
        console.log('Camera Tab - permission result:', result);
      }
      if (mediaPermission && !mediaPermission.granted) {
        console.log('Camera Tab - requesting media permission...');
        await requestMediaPermission();
      }
    };

    requestPermissions();
  }, [permission, mediaPermission]);

  // Handle tab focus to ensure camera is properly initialized
  useFocusEffect(
    React.useCallback(() => {
      console.log('Camera Tab - Tab focused');
      setIsTabFocused(true);
      setCameraReady(false);
      // Clear any previous errors when tab becomes focused
      setCameraError(null);

      // Small delay to ensure proper camera initialization
      const timer = setTimeout(() => {
        setCameraReady(true);
      }, 100);

      return () => {
        console.log('Camera Tab - Tab unfocused');
        setIsTabFocused(false);
        setCameraReady(false);
        clearTimeout(timer);
      };
    }, [])
  );

  const handleCameraPermission = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to capture crop images for disease detection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Permission', onPress: requestPermission },
          ]
        );
        return false;
      }
    }
    return true;
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    const hasPermission = await handleCameraPermission();
    if (!hasPermission) return;

    try {
      setIsCapturing(true);
      console.log('📸 Taking picture...');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (photo) {
        console.log('📸 Photo captured:', photo.uri);

        // Copy the image to a permanent location to prevent it from being deleted
        const filename = `crop_image_${Date.now()}.jpg`;
        const permanentUri = `${FileSystem.documentDirectory}${filename}`;

        try {
          console.log('💾 Copying image to permanent location...');
          await FileSystem.copyAsync({
            from: photo.uri,
            to: permanentUri,
          });
          console.log('✅ Image copied to:', permanentUri);

          // Use the permanent URI instead of the temporary one
          setCapturedImage({
            uri: permanentUri,
            width: photo.width,
            height: photo.height,
          });
        } catch (copyError) {
          console.error('❌ Failed to copy image:', copyError);
          // Fallback to original URI if copy fails
          console.log('⚠️ Using original URI as fallback');
          setCapturedImage({
            uri: photo.uri,
            width: photo.width,
            height: photo.height,
          });
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const selectFromGallery = async () => {
    try {
      console.log('📱 Opening gallery picker...');

      // Check media library permissions
      if (mediaPermission && !mediaPermission.granted) {
        console.log('📱 Requesting media library permission...');
        const permissionResult = await requestMediaPermission();
        if (!permissionResult.granted) {
          Alert.alert(
            'Permission Required',
            'This app needs access to your photo library to select images.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('📱 Gallery picker result:', {
        canceled: result.canceled,
        assetsLength: result.assets?.length || 0,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('📱 Selected asset details:', {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          type: asset.type,
        });

        // Copy gallery image to permanent location like camera images
        const filename = `gallery_image_${Date.now()}.jpg`;
        const permanentUri = `${FileSystem.documentDirectory}${filename}`;

        try {
          console.log('💾 Copying gallery image to permanent location...');
          await FileSystem.copyAsync({
            from: asset.uri,
            to: permanentUri,
          });
          console.log('✅ Gallery image copied to:', permanentUri);

          setCapturedImage({
            uri: permanentUri,
            width: asset.width,
            height: asset.height,
          });
        } catch (copyError) {
          console.error('❌ Failed to copy gallery image:', copyError);
          console.log('⚠️ Using original gallery URI as fallback');
          setCapturedImage({
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
          });
        }
      } else {
        console.log('📱 Gallery selection was canceled or no asset selected');
      }
    } catch (error) {
      console.error('❌ Error selecting from gallery:', error);
      Alert.alert('Error', 'Failed to select image from gallery.');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const usePhoto = () => {
    if (!capturedImage) return;

    // Navigate to disease detection screen with the captured image
    router.push({
      pathname: '/disease-detection',
      params: {
        imageUri: capturedImage.uri,
      },
    });
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off': return 'auto';
        case 'auto': return 'on';
        case 'on': return 'off';
        default: return 'auto';
      }
    });
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on': return 'flash';
      case 'off': return 'flash-off';
      case 'auto': return 'flash-outline';
      default: return 'flash-outline';
    }
  };

  console.log('Camera Tab render - permission:', permission);
  console.log('Camera Tab render - capturedImage:', capturedImage);
  console.log('Camera Tab render - cameraError:', cameraError);

  // Show error if camera failed to mount
  if (cameraError) {
    return (
      <ThemedView style={[styles.container, styles.permissionContainer, { backgroundColor: screenBg }]}>
        <ThemedText style={styles.message}>{cameraError}</ThemedText>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: buttonPrimary }]}
          onPress={() => {
            setCameraError(null);
          }}
        >
          <ThemedText style={styles.permissionButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (!permission) {
    console.log('Camera Tab - No permission object, showing loading...');
    return (
      <ThemedView style={[styles.container, styles.permissionContainer, { backgroundColor: screenBg }]}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    console.log('Camera Tab - Permission not granted, showing permission screen...');
    return (
      <ThemedView style={[styles.container, styles.permissionContainer, { backgroundColor: screenBg }]}>
        <ThemedText style={styles.message}>
          Camera access is required to capture crop images for disease detection.
        </ThemedText>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: buttonPrimary }]}
          onPress={async () => {
            console.log('Camera Tab - Permission button pressed');
            const result = await requestPermission();
            console.log('Camera Tab - Permission request result:', result);
          }}
        >
          <ThemedText style={styles.permissionButtonText}>Grant Camera Permission</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (capturedImage) {
    console.log('🖼️ Rendering image preview with URI:', capturedImage.uri);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Image Preview */}
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: capturedImage.uri }}
            style={styles.previewImage}
            onLoad={() => console.log('✅ Image loaded successfully')}
            onError={(error) => console.error('❌ Image load error:', error)}
          />

          {/* Preview Controls */}
          <View style={styles.previewControls}>
            <TouchableOpacity style={styles.controlButton} onPress={retakePhoto}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.controlButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.controlButton, styles.useButton, { backgroundColor: buttonPrimary }]} onPress={usePhoto}>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.controlButtonText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  console.log('Camera Tab - Rendering main camera view...');

  // Don't render camera if tab is not focused or not ready
  if (!isTabFocused || !cameraReady) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ThemedView style={[styles.container, styles.permissionContainer]}>
          <ThemedText style={styles.message}>
            Initializing camera...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera View */}
      <CameraView
        key={`camera-tab-${cameraReady ? 'ready' : 'initializing'}`}
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flashMode}
        onCameraReady={() => {
          console.log('Camera Tab - Camera is ready!');
          setCameraError(null);
        }}
        onMountError={(error) => {
          console.error('Camera Tab - Camera mount error:', error);
          setCameraError('Failed to initialize camera. Please try again.');
        }}
      >
        {/* Header Controls */}
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
            <Ionicons name={getFlashIcon()} size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Camera Guidelines */}
        <View style={styles.guidelines}>
          <View style={styles.guideline} />
          <View style={[styles.guideline, styles.guidelineHorizontal]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <ThemedText style={styles.instructionsText}>
            Position the affected crop area within the frame
          </ThemedText>
          <ThemedText style={styles.instructionsSubtext}>
            Ensure good lighting and focus on the diseased parts
          </ThemedText>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={selectFromGallery}>
            <Ionicons name="images" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionButton: {
    // backgroundColor will be set dynamically
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidelines: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    right: '20%',
    bottom: '40%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
  },
  guideline: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  guidelineHorizontal: {
    width: '100%',
    height: 1,
    top: '50%',
  },
  instructionsContainer: {
    position: 'absolute',
    top: '70%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instructionsSubtext: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    justifyContent: 'center',
  },
  useButton: {
    // backgroundColor will be set dynamically
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
