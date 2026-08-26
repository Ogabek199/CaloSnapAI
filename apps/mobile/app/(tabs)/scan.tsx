import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, Zap, Sparkles, X } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { useScanStore } from '../../src/store/useScanStore';
import { useToastStore } from '../../src/store/useToastStore';
import { ApiClient } from '../../src/shared/api/api-client';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { setImageUri, setScanResult, setAnalyzing } = useScanStore();
  const { showToast } = useToastStore();
  const { t, theme } = useAppStore();
  const currentTheme = theme();
  const strings = t();

  const [flash, setFlash] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const startAnalysis = async (uri: string) => {
    setIsProcessing(true);
    setImageUri(uri);
    setAnalyzing(true);
    router.push('/scan/analyzing');

    try {
      const result = await ApiClient.scanFood(uri);
      setScanResult(result);
      setAnalyzing(false);
      setIsProcessing(false);
      router.replace('/scan/result');
    } catch (err: any) {
      setAnalyzing(false);
      setIsProcessing(false);
      router.back();

      const errMsg = err?.message || '';
      if (errMsg.includes('xira') || errMsg.includes('aniqlanmadi') || errMsg.includes('topilmadi')) {
        showToast(
          'Rasm xira yoki taom aniqlanmadi. Iltimos, kamerani yaqinroq tutib, yorug‘ joyda qayta oling 📸',
          'warning',
        );
      } else if (errMsg.includes('Internet') || errMsg.includes('tarmoq') || errMsg.includes('Network') || errMsg.includes('Failed to fetch')) {
        showToast(
          'Internet aloqasida uzilish. Iltimos, tarmoqni tekshirib qaytadan urinib ko‘ring.',
          'error',
        );
      } else {
        showToast(
          errMsg || 'Rasmda taom aniqlanmadi. Iltimos, haqiqiy taom rasmini oling.',
          'warning',
        );
      }
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        shutterSound: false,
      });

      if (photo?.uri) {
        startAnalysis(photo.uri);
      }
    } catch (e) {
      console.error('Camera error:', e);
      showToast('Rasmga olishda xatolik yuz berdi.', 'error');
    }
  };

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast(strings.permissionDesc, 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      startAnalysis(result.assets[0].uri);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.permissionBox, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
          <Sparkles color={currentTheme.primary} size={40} />
          <Text style={[styles.permissionTitle, { color: currentTheme.text }]}>{strings.permissionTitle}</Text>
          <Text style={[styles.permissionText, { color: currentTheme.textSecondary }]}>
            {strings.permissionDesc}
          </Text>
          <TouchableOpacity
            style={[styles.permissionBtn, { backgroundColor: currentTheme.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>{strings.grantPermission}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate dynamic adaptive viewfinder box
  const viewfinderSize = Math.min(width * 0.72, height * 0.35, 270);

  return (
    <View style={styles.container}>
      {/* 1. Camera live stream in background */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flash}
      />

      {/* 2. Top-level overlay with perfect vertical balancing */}
      <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
        {/* Top Controls Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <X color="#FFFFFF" size={22} />
          </TouchableOpacity>

          <View style={styles.aiBadge}>
            <Sparkles color={currentTheme.primary} size={14} />
            <Text style={styles.aiBadgeText}>AI Vision Camera</Text>
          </View>

          <TouchableOpacity
            style={[styles.iconButton, flash && styles.iconButtonActive]}
            onPress={() => setFlash(!flash)}
          >
            <Zap color={flash ? currentTheme.secondary : '#FFFFFF'} size={20} />
          </TouchableOpacity>
        </View>

        {/* Viewfinder in middle with flexible vertical space */}
        <View style={styles.viewfinderContainer}>
          <View style={[styles.viewfinder, { width: viewfinderSize, height: viewfinderSize }]}>
            <View style={[styles.corner, styles.topLeft, { borderColor: currentTheme.primary }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: currentTheme.primary }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: currentTheme.primary }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: currentTheme.primary }]} />

            <View style={styles.targetCenter}>
              <Text style={styles.targetText}>{strings.cameraHint}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Shutter Controls - safely elevated */}
        <View
          style={[
            styles.bottomControls,
            {
              paddingBottom: Math.max(insets.bottom + 20, 36),
            },
          ]}
        >
          <Text style={styles.hintText}>{strings.cameraSub}</Text>

          <View style={styles.actionButtonsRow}>
            {/* Gallery Picker */}
            <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
              <ImageIcon color="#FFFFFF" size={24} />
            </TouchableOpacity>

            {/* Shutter Take Photo */}
            <TouchableOpacity
              style={[styles.shutterOuter, { borderColor: currentTheme.primary }]}
              activeOpacity={0.8}
              onPress={takePhoto}
              disabled={isProcessing}
            >
              <View style={[styles.shutterInner, { backgroundColor: currentTheme.primary }]}>
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.shutterDot} />
                )}
              </View>
            </TouchableOpacity>

            {/* Symmetrical placeholder */}
            <View style={{ width: 52, height: 52 }} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionBox: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    width: '100%',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.45)',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  viewfinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  viewfinder: {
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  targetCenter: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  targetText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingTop: 14,
  },
  hintText: {
    color: '#E2E8F0',
    fontSize: 12,
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  galleryButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
});
