import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle2,
  Sparkles,
  X,
  Camera,
  Cpu,
  Scale,
  UtensilsCrossed,
  Lightbulb,
} from 'lucide-react-native';
import { useAppStore } from '../../src/store/useAppStore';
import { useScanStore } from '../../src/store/useScanStore';

const { width } = Dimensions.get('window');

interface StepItem {
  id: number;
  title: string;
  sub: string;
  icon: (color: string, size: number) => React.ReactNode;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    title: 'Rasm serverga yuklanmoqda',
    sub: 'Xavfsiz va tezkor uzatish',
    icon: (color, size) => <Camera color={color} size={size} strokeWidth={2.2} />,
  },
  {
    id: 2,
    title: 'Gemini AI taomni aniqlamoqda',
    sub: 'Tarkib va mahsulotlar tahlili',
    icon: (color, size) => <Cpu color={color} size={size} strokeWidth={2.2} />,
  },
  {
    id: 3,
    title: 'Porsiya hajmi baholanmoqda',
    sub: 'Taxminiy og‘irlik va hajm',
    icon: (color, size) => <Scale color={color} size={size} strokeWidth={2.2} />,
  },
  {
    id: 4,
    title: 'O‘zbek taomlari bazasidan hisoblanmoqda',
    sub: 'Kaloriya, oqsil, yog‘, uglevod',
    icon: (color, size) => <UtensilsCrossed color={color} size={size} strokeWidth={2.2} />,
  },
];

const AI_TIPS = [
  'Maslahat: Keyingi sahifada taom og‘irligini o‘zingizga moslab osongina o‘zgartira olasiz.',
  'AI bazamizda 500+ dan ortiq O‘zbek milliy va zamonaviy taomlari mavjud.',
  'Gemini Vision taomdagi oqsil, yog‘ va uglevodlarni yuqori aniqlikda hisoblaydi.',
  'Palov, Somsa, Sho‘rva va Manti kabi taomlar milliy retseptlar asosida baholanadi.',
];

export default function AnalyzingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, themeMode } = useAppStore();
  const { imageUri } = useScanStore();

  const currentTheme = theme();
  const isDark = themeMode === 'dark';

  const [activeStep, setActiveStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Animations
  const laserAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0.15)).current;

  // Step progression
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < STEPS.length - 1) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
          return prev + 1;
        }
        return prev;
      });
    }, 1100);

    return () => clearInterval(stepInterval);
  }, []);

  // Update progress bar
  useEffect(() => {
    const targetProgress = (activeStep + 1) / (STEPS.length + 0.3);
    Animated.timing(progressAnim, {
      toValue: Math.min(0.96, targetProgress),
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeStep]);

  // Laser scanning animation loop
  useEffect(() => {
    const laserLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    laserLoop.start();

    // Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    // Rotate tips
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % AI_TIPS.length);
    }, 3200);

    return () => {
      laserLoop.stop();
      pulseLoop.stop();
      clearInterval(tipInterval);
    };
  }, []);

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  const progressPercent = Math.round(
    ((activeStep + 1) / STEPS.length) * 100 > 95 ? 96 : Math.round(((activeStep + 1) / STEPS.length) * 85),
  );

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#080C16' : currentTheme.background,
        },
      ]}
    >
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={[
            styles.closeBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.card,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : currentTheme.border,
            },
          ]}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <X color={isDark ? '#F8FAFC' : currentTheme.text} size={20} />
        </TouchableOpacity>

        <View
          style={[
            styles.aiEnginePill,
            {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(5, 150, 105, 0.08)',
              borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.25)',
            },
          ]}
        >
          <Sparkles color={isDark ? '#00E599' : '#059669'} size={13} />
          <Text style={[styles.aiEngineText, { color: isDark ? '#00E599' : '#059669' }]}>
            Gemini Vision 2.5
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.contentContainer}>
        {/* Photo Scanner HUD */}
        <View style={styles.hudWrapper}>
          <View
            style={[
              styles.photoCard,
              {
                backgroundColor: isDark ? '#111827' : currentTheme.card,
                borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : currentTheme.border,
                shadowColor: isDark ? '#00E599' : '#64748B',
                shadowOpacity: isDark ? 0.25 : 0.1,
              },
            ]}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.foodImage} />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: isDark ? '#151C2C' : '#EDF2F7' }]}>
                <UtensilsCrossed color={isDark ? '#34D399' : '#059669'} size={54} />
              </View>
            )}

            {/* Dark Gradient Overlay for high-tech HUD look */}
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.4)']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Animated Laser Scanning Line */}
            <Animated.View
              style={[
                styles.laserLineContainer,
                {
                  transform: [{ translateY: laserTranslateY }],
                },
              ]}
            >
              <LinearGradient
                colors={['transparent', '#00E599', '#34D399', '#00E599', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.laserGradientLine}
              />
              <View style={styles.laserGlow} />
            </Animated.View>

            {/* HUD Corner Brackets */}
            <View style={[styles.hudCorner, styles.hudTopLeft, { borderColor: isDark ? '#00E599' : '#059669' }]} />
            <View style={[styles.hudCorner, styles.hudTopRight, { borderColor: isDark ? '#00E599' : '#059669' }]} />
            <View style={[styles.hudCorner, styles.hudBottomLeft, { borderColor: isDark ? '#00E599' : '#059669' }]} />
            <View style={[styles.hudCorner, styles.hudBottomRight, { borderColor: isDark ? '#00E599' : '#059669' }]} />

            {/* Floating Live AI Radar Pill */}
            <Animated.View
              style={[
                styles.floatingRadarPill,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={styles.radarPulseDot} />
              <Text style={styles.radarText}>AI Idrok faol</Text>
            </Animated.View>
          </View>
        </View>

        {/* Title & Progress Header */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
            Taom tahlil qilinmoqda
          </Text>
          <Text style={[styles.mainSubtitle, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
            Gemini Vision va Milliy retseptlar bazasi
          </Text>

          {/* Animated Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={['#059669', '#00E599', '#34D399']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressPercentText, { color: isDark ? '#00E599' : '#059669' }]}>
                {progressPercent}%
              </Text>
              <Text style={[styles.progressEtaText, { color: isDark ? '#64748B' : currentTheme.textMuted }]}>
                Kuting, bir necha soniya...
              </Text>
            </View>
          </View>
        </View>

        {/* 4-Step Analysis Timeline Card */}
        <View
          style={[
            styles.timelineCard,
            {
              backgroundColor: isDark ? '#121A2B' : currentTheme.card,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
              shadowColor: isDark ? '#000000' : '#64748B',
              shadowOpacity: isDark ? 0.25 : 0.06,
            },
          ]}
        >
          {STEPS.map((step, idx) => {
            const isDone = idx < activeStep;
            const isCurrent = idx === activeStep;
            const isPending = idx > activeStep;

            return (
              <View key={step.id} style={styles.stepItemRow}>
                {/* Step Icon / Status Bubble */}
                <View
                  style={[
                    styles.stepIconBox,
                    isDone && {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.12)',
                      borderColor: isDark ? '#00E599' : '#059669',
                    },
                    isCurrent && {
                      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(217, 119, 6, 0.12)',
                      borderColor: isDark ? '#F59E0B' : '#D97706',
                    },
                    isPending && {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F1F5F9',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    },
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 color={isDark ? '#00E599' : '#059669'} size={18} strokeWidth={2.6} />
                  ) : isCurrent ? (
                    <ActivityIndicator size="small" color={isDark ? '#F59E0B' : '#D97706'} />
                  ) : (
                    step.icon(isDark ? '#64748B' : '#94A3B8', 16)
                  )}
                </View>

                {/* Step Text Info */}
                <View style={styles.stepInfoContent}>
                  <Text
                    style={[
                      styles.stepTitleText,
                      isDone && { color: isDark ? '#F8FAFC' : currentTheme.text, fontWeight: '700' },
                      isCurrent && { color: isDark ? '#FCD34D' : '#B45309', fontWeight: '800' },
                      isPending && { color: isDark ? '#64748B' : currentTheme.textMuted },
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text
                    style={[
                      styles.stepSubText,
                      { color: isDark ? '#64748B' : currentTheme.textSecondary },
                    ]}
                  >
                    {step.sub}
                  </Text>
                </View>

                {/* Status Indicator on the right */}
                {isDone && (
                  <View style={[styles.doneBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)' }]}>
                    <Text style={[styles.doneBadgeText, { color: isDark ? '#00E599' : '#059669' }]}>Bajarildi</Text>
                  </View>
                )}
                {isCurrent && (
                  <View style={[styles.doneBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.1)' }]}>
                    <Text style={[styles.doneBadgeText, { color: isDark ? '#F59E0B' : '#D97706' }]}>Tahlilda</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* AI Tip / Smart Fact Ticker at Bottom */}
        <View
          style={[
            styles.tipCard,
            {
              backgroundColor: isDark ? 'rgba(18, 26, 43, 0.75)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
              shadowColor: isDark ? '#000000' : '#64748B',
              shadowOpacity: isDark ? 0.2 : 0.06,
            },
          ]}
        >
          <View style={[styles.tipIconBubble, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(217, 119, 6, 0.10)' }]}>
            <Lightbulb color={isDark ? '#F59E0B' : '#D97706'} size={16} />
          </View>
          <Text
            key={tipIndex}
            style={[styles.tipText, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}
          >
            {AI_TIPS[tipIndex]}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  aiEnginePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  aiEngineText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  hudWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  photoCard: {
    width: width - 48,
    height: 175,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  foodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laserLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 20,
    justifyContent: 'center',
  },
  laserGradientLine: {
    width: '100%',
    height: 3,
  },
  laserGlow: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(0, 229, 153, 0.22)',
  },
  hudCorner: {
    position: 'absolute',
    width: 22,
    height: 22,
  },
  hudTopLeft: {
    top: 10,
    left: 10,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  hudTopRight: {
    top: 10,
    right: 10,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  hudBottomLeft: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  hudBottomRight: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  floatingRadarPill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 14, 26, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.4)',
  },
  radarPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00E599',
  },
  radarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  mainSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 14,
  },
  progressContainer: {
    width: '100%',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressEtaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  timelineCard: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    gap: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfoContent: {
    flex: 1,
  },
  stepTitleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stepSubText: {
    fontSize: 11,
    marginTop: 1,
  },
  doneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  doneBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  tipIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
});
