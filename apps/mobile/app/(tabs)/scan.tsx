import React, { useState, useRef, useEffect } from 'react';
import {
  InteractionManager,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image as ImageIcon, Zap, Sparkles, X, Barcode } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, usePalette, useStrings } from '../../src/store/useAppStore';
import { useScanStore } from '../../src/store/useScanStore';
import { useToastStore } from '../../src/store/useToastStore';
import { ApiClient, ApiError } from '../../src/shared/api/api-client';
import { stripBottomWatermark } from '../../src/shared/media/strip-bottom-watermark';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const setImageUri = useScanStore((s) => s.setImageUri);
  const setScanResult = useScanStore((s) => s.setScanResult);
  const setAnalyzing = useScanStore((s) => s.setAnalyzing);
  const resetAnalysisCancel = useScanStore((s) => s.resetAnalysisCancel);
  const scanMode = useScanStore((s) => s.scanMode);
  const setScanMode = useScanStore((s) => s.setScanMode);
  const showToast = useToastStore((s) => s.showToast);
  const isPremium = useAppStore((s) => !!s.user.isPremium);
  const currentTheme = usePalette();
  const strings = useStrings();
  const isFocused = useIsFocused();

  const [flash, setFlash] = useState<boolean>(false);
  // Mounting the preview mid-transition leaves it sized to the animating frame (half-black), so wait for it to settle.
  const [cameraSession, setCameraSession] = useState(0);
  useEffect(() => {
    if (!isFocused) {
      setCameraSession(0);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => setCameraSession(Date.now()), 120);
    });
    return () => {
      task.cancel();
      if (timer) clearTimeout(timer);
    };
  }, [isFocused]);
  // Android's preview surface keeps its first size, so the camera is remounted if the screen height changes.
  const [layoutH, setLayoutH] = useState(0);
  const onContainerLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (Math.abs(h - layoutH) > 1) setLayoutH(h);
  };
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const processingRef = useRef(false);

  const finishProcessing = () => {
    processingRef.current = false;
    setIsProcessing(false);
  };

  const startAnalysis = async (uri: string) => {
    setIsProcessing(true);
    resetAnalysisCancel();
    let navigatedToAnalyzing = false;

    try {
      // Remove camera date/time stamp often burned into the bottom of photos
      const cleanUri = await stripBottomWatermark(uri);
      setImageUri(cleanUri);
      setAnalyzing(true);
      router.push('/scan/analyzing');
      navigatedToAnalyzing = true;

      const result = await ApiClient.scanFood(cleanUri);
      if (useScanStore.getState().analysisCancelled) {
        setAnalyzing(false);
        finishProcessing();
        return;
      }
      setScanResult(result);
      useScanStore.getState().setSelectedItemIndex(0);
      setAnalyzing(false);
      finishProcessing();
      router.replace('/scan/result');
    } catch (err: any) {
      const cancelled = useScanStore.getState().analysisCancelled;
      setAnalyzing(false);
      finishProcessing();
      if (cancelled) return;

      if (navigatedToAnalyzing) router.back();

      let toastMessage = strings.scanFailedHint;
      let toastType: 'warning' | 'error' = 'warning';
      let next: 'manual' | 'paywall' | null = 'manual';

      if (err instanceof ApiError) {
        const errCode = (err.data as { code?: string } | null)?.code;
        if (errCode === 'SCAN_LIMIT_REACHED') {
          toastMessage = err.message;
          next = isPremium ? 'manual' : 'paywall';
        } else if (err.code === 'network' || err.code === 'timeout') {
          toastMessage = err.message;
          toastType = 'error';
          next = null;
        } else if (err.code === 'unauthorized') {
          // A 401 has already logged out and shown the session-expired toast in api-client.
          if (err.status === 401) return;
          toastMessage = err.message;
          toastType = 'error';
          next = null;
        } else if (err.code === 'payload_too_large' || err.code === 'rate_limited') {
          toastMessage = err.message;
          toastType = 'error';
          next = null;
        } else if (err.status === 503) {
          toastMessage = strings.errAiUnavailable;
        } else if (err.code === 'server') {
          toastMessage = err.message;
          toastType = 'error';
          next = null;
        } else if (err.status === 422) {
          toastMessage = err.message || strings.nonFoodErrorMsg;
        } else if (err.message && err.message.length < 160) {
          toastMessage = err.message;
        }
      }

      showToast(toastMessage, toastType);
      if (next === 'manual') setTimeout(() => router.push('/diary/add'), 800);
      if (next === 'paywall') setTimeout(() => router.push('/paywall'), 800);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || processingRef.current) return;
    processingRef.current = true;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        shutterSound: false,
      });

      if (photo?.uri) {
        await startAnalysis(photo.uri);
      } else {
        processingRef.current = false;
      }
    } catch (e) {
      if (__DEV__) console.warn('Camera error:', e);
      finishProcessing();
      showToast(strings.photoCaptureFailed, 'error');
    }
  };

  const pickImageFromGallery = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await startAnalysis(result.assets[0].uri);
      } else {
        processingRef.current = false;
      }
    } catch (e) {
      if (__DEV__) console.warn('Gallery error:', e);
      finishProcessing();
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: currentTheme.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: currentTheme.background }]} edges={['top', 'bottom']}>
        <View style={[styles.permissionBox, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
          <Sparkles color={currentTheme.primary} size={40} />
          <Text style={[styles.permissionTitle, { color: currentTheme.text }]}>{strings.permissionTitle}</Text>
          <Text style={[styles.permissionText, { color: currentTheme.textSecondary }]}>
            {strings.permissionDesc}
          </Text>
          <TouchableOpacity
            style={[styles.permissionBtn, { backgroundColor: currentTheme.primary }]}
            onPress={() => {
              if (permission.canAskAgain) requestPermission();
              else Linking.openSettings().catch(() => {});
            }}
          >
            <Text style={styles.permissionBtnText}>{strings.grantPermission}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate dynamic adaptive viewfinder box
  const isTable = scanMode === 'table';
  const viewfinderWidth = isTable
    ? Math.min(width - 36, 380)
    : Math.min(width * 0.72, height * 0.35, 270);
  const viewfinderHeight = isTable
    ? Math.min(width * 0.82, 320)
    : Math.min(width * 0.72, height * 0.35, 270);
  const frameColor = isTable ? '#10B981' : currentTheme.primary;

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      {/* 1. Camera live stream in background */}
      {isFocused && cameraSession > 0 && layoutH > 0 ? (
        <CameraView
          key={`cam-${cameraSession}-${layoutH}`}
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flash}
        />
      ) : null}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
        style={[styles.topShade, { height: insets.top + 90 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.4, 1]}
        style={[styles.bottomShade, { height: insets.bottom + 260 }]}
      />

      {/* 2. Top-level overlay with perfect vertical balancing */}
      <SafeAreaView style={styles.overlayContainer} edges={['top', 'left', 'right']} pointerEvents="box-none">
        {/* Top Controls Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <X color="#FFFFFF" size={22} />
          </TouchableOpacity>

          <View style={[styles.aiBadge, isTable && { borderColor: '#10B981' }]}>
            <Sparkles color={isTable ? '#10B981' : currentTheme.primary} size={14} />
            <Text style={styles.aiBadgeText}>
              {isTable ? strings.tableMode : strings.singleDishMode}
            </Text>
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
          <View style={[styles.viewfinder, { width: viewfinderWidth, height: viewfinderHeight }]}>
            <View style={[styles.corner, styles.topLeft, { borderColor: frameColor }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: frameColor }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: frameColor }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: frameColor }]} />

            <View style={styles.targetCenter}>
              <Text style={styles.targetText}>
                {isTable
                  ? strings.tableModeHint
                  : strings.cameraHint}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Shutter Controls - safely elevated */}
        <View
          style={[
            styles.bottomControls,
            {
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}
        >
          {/* Mode Selector (Apple Camera Style) */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeTab, !isTable && styles.modeTabActive]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch (e) {}
                setScanMode('single');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeText, !isTable && styles.modeTextActive]}>
                🍽️ {strings.singleDishMode}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, isTable && styles.modeTabActive]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch (e) {}
                setScanMode('table');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeText, isTable && styles.modeTextActive]}>
                🍱 {strings.tableMode}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hintText}>{strings.cameraSub}</Text>

          <View style={styles.actionButtonsRow}>
            {/* Gallery Picker */}
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickImageFromGallery}
              disabled={isProcessing}
            >
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

            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/scan/barcode');
              }}
              disabled={isProcessing}
              accessibilityRole="button"
              accessibilityLabel={strings.barcodeScannerTitle}
            >
              <Barcode color="#FFFFFF" size={24} />
            </TouchableOpacity>
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
    ...StyleSheet.absoluteFill,
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
    paddingTop: 14,
  },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottomShade: { position: 'absolute', bottom: 0, left: 0, right: 0 },
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
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 24,
    padding: 3,
    marginBottom: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  modeTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  modeTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  modeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
