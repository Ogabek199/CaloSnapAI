import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Check,
  Sparkles,
  X,
  Camera,
  ScanSearch,
  Scale,
  Salad,
} from 'lucide-react-native';
import { useAppStore } from '../../src/store/useAppStore';
import { useScanStore } from '../../src/store/useScanStore';
import { FontSize, Radius, Spacing } from '../../src/shared/theme/spacing';

const { width: SCREEN_W } = Dimensions.get('window');
const PHOTO_H = Math.min(280, SCREEN_W * 0.72);

const STEPS = [
  { title: 'Rasm yuklanmoqda', icon: Camera },
  { title: 'Taom aniqlanmoqda', icon: ScanSearch },
  { title: 'Porsiya baholanmoqda', icon: Scale },
  { title: 'Kaloriya hisoblanmoqda', icon: Salad },
];

const TIPS = [
  'Keyingi sahifada og‘irlikni o‘zingizga moslab o‘zgartira olasiz.',
  'Milliy taomlar — palov, somsa, manti — retsept asosida hisoblanadi.',
  'Yaxshi yorug‘likda surat aniqroq natija beradi.',
];

export default function AnalyzingScreen() {
  const router = useRouter();
  const { theme, themeMode } = useAppStore();
  const { imageUri } = useScanStore();
  const cancelAnalysis = useScanStore((s) => s.cancelAnalysis);
  const c = theme();
  const isDark = themeMode === 'dark';

  const accent = c.primary;
  const accentSoft = c.primaryBg;
  const surface = isDark ? 'rgba(255,255,255,0.06)' : c.card;
  const surfaceBorder = isDark ? 'rgba(255,255,255,0.1)' : c.border;
  const muted = c.textMuted;
  const text = c.text;
  const secondary = c.textSecondary;

  const [activeStep, setActiveStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const scanY = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0.12)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < STEPS.length - 1) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
          return prev + 1;
        }
        return prev;
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.min(0.94, (activeStep + 1) / (STEPS.length + 0.35)),
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeStep, progress]);

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const ringLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, {
          toValue: 1.04,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    scanLoop.start();
    ringLoop.start();
    breatheLoop.start();

    const tipTimer = setInterval(() => {
      Animated.timing(tipOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setTipIndex((i) => (i + 1) % TIPS.length);
        Animated.timing(tipOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }).start();
      });
    }, 3800);

    return () => {
      scanLoop.stop();
      ringLoop.stop();
      breatheLoop.stop();
      clearInterval(tipTimer);
    };
  }, [scanY, ringScale, breathe, tipOpacity]);

  const beamTranslate = scanY.interpolate({
    inputRange: [0, 1],
    outputRange: [8, PHOTO_H - 28],
  });

  const ambientOpacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  const pct = Math.min(
    96,
    Math.round(((activeStep + 1) / STEPS.length) * 88),
  );

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cancelAnalysis();
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(26,155,108,0.18)', 'transparent', 'transparent']
            : ['rgba(26,155,108,0.12)', 'rgba(26,155,108,0.04)', 'transparent']
        }
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientBlob,
          {
            backgroundColor: accent,
            opacity: ambientOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleCancel}
            hitSlop={10}
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: surface,
                borderColor: surfaceBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <X color={text} size={18} strokeWidth={2.4} />
          </Pressable>

          <View style={[styles.brandChip, { backgroundColor: accentSoft, borderColor: `${accent}33` }]}>
            <Sparkles color={accent} size={13} strokeWidth={2.2} />
            <Text style={[styles.brandText, { color: accent }]}>Taom AI</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          <Animated.View style={[styles.photoWrap, { transform: [{ scale: ringScale }] }]}>
            <View
              style={[
                styles.photoFrame,
                {
                  borderColor: surfaceBorder,
                  backgroundColor: isDark ? '#0F1419' : '#F1F5F9',
                  shadowColor: accent,
                },
              ]}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoFallback}>
                  <Salad color={accent} size={48} strokeWidth={1.6} />
                </View>
              )}

              <LinearGradient
                colors={['rgba(0,0,0,0.08)', 'transparent', 'transparent', 'rgba(0,0,0,0.75)']}
                locations={[0, 0.25, 0.72, 1]}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Cover residual camera date/time stamp at bottom */}
              <View style={styles.stampCover} />

              <View style={[styles.corner, styles.tl, { borderColor: accent }]} />
              <View style={[styles.corner, styles.tr, { borderColor: accent }]} />
              <View style={[styles.corner, styles.bl, { borderColor: accent }]} />
              <View style={[styles.corner, styles.br, { borderColor: accent }]} />

              <Animated.View
                style={[styles.beam, { transform: [{ translateY: beamTranslate }] }]}
              >
                <LinearGradient
                  colors={['transparent', accent, accent, 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.beamLine}
                />
                <View style={[styles.beamGlow, { backgroundColor: `${accent}40` }]} />
              </Animated.View>

              <View style={styles.liveWrap} pointerEvents="none">
                <View style={[styles.livePill, { backgroundColor: 'rgba(8,12,16,0.72)' }]}>
                  <View style={[styles.liveDot, { backgroundColor: accent }]} />
                  <Text style={styles.liveLabel}>Tahlil davom etmoqda</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: text }]}>Taom tahlil qilinmoqda</Text>
            <Text style={[styles.subtitle, { color: secondary }]}>
              Surat o‘qilmoqda — kaloriya va BJU hisoblanadi
            </Text>
          </View>

          <View style={styles.progressBlock}>
            <View style={[styles.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E8EEF2' }]}>
              <Animated.View
                style={[
                  styles.fill,
                  {
                    width: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={[c.primaryDark, accent, c.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <View style={styles.progressMeta}>
              <Text style={[styles.pct, { color: accent }]}>{pct}%</Text>
              <Text style={[styles.wait, { color: muted }]}>Bir necha soniya…</Text>
            </View>
          </View>

          <View style={[styles.stepsCard, { backgroundColor: surface, borderColor: surfaceBorder }]}>
            {STEPS.map((step, idx) => {
              const done = idx < activeStep;
              const current = idx === activeStep;
              const Icon = step.icon;
              const iconColor = done || current ? accent : muted;

              return (
                <View key={step.title} style={styles.stepRow}>
                  <View style={styles.stepRail}>
                    <View
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: done || current ? accentSoft : isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                          borderColor: done || current ? accent : surfaceBorder,
                        },
                      ]}
                    >
                      {done ? (
                        <Check color={accent} size={14} strokeWidth={3} />
                      ) : (
                        <Icon color={iconColor} size={14} strokeWidth={2.2} />
                      )}
                    </View>
                    {idx < STEPS.length - 1 ? (
                      <View
                        style={[
                          styles.stepLine,
                          {
                            backgroundColor: done ? accent : surfaceBorder,
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={styles.stepCopy}>
                    <Text
                      style={[
                        styles.stepTitle,
                        {
                          color: current ? text : done ? text : muted,
                          fontWeight: current ? '700' : '600',
                        },
                      ]}
                    >
                      {step.title}
                    </Text>
                    {current ? (
                      <Text style={[styles.stepHint, { color: accent }]}>Hozir</Text>
                    ) : done ? (
                      <Text style={[styles.stepHint, { color: muted }]}>Tayyor</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          <Animated.View
            style={[
              styles.tipBar,
              {
                backgroundColor: surface,
                borderColor: surfaceBorder,
                opacity: tipOpacity,
              },
            ]}
          >
            <View style={[styles.tipMark, { backgroundColor: accentSoft }]}>
              <Sparkles color={accent} size={14} />
            </View>
            <Text style={[styles.tipText, { color: secondary }]}>{TIPS[tipIndex]}</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  ambientBlob: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.55,
    borderRadius: SCREEN_W,
    opacity: 0.12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: 'space-between',
  },
  photoWrap: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  photoFrame: {
    width: SCREEN_W - Spacing.lg * 2,
    height: PHOTO_H,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampCover: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
  },
  tl: { top: 14, left: 14, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 10 },
  tr: { top: 14, right: 14, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 10 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 10 },
  br: { bottom: 14, right: 14, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 10 },
  beam: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 18,
    justifyContent: 'center',
  },
  beamLine: { height: 2.5, width: '100%' },
  beamGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 14,
    top: 2,
  },
  liveWrap: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  titleBlock: {
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 4,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  progressBlock: {
    marginTop: Spacing.md,
    gap: 8,
  },
  track: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pct: { fontSize: 13, fontWeight: '800' },
  wait: { fontSize: 12, fontWeight: '500' },
  stepsCard: {
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 44,
  },
  stepRail: {
    width: 36,
    alignItems: 'center',
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    borderRadius: 1,
  },
  stepCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.sm,
    paddingBottom: Spacing.sm,
    minHeight: 30,
  },
  stepTitle: {
    fontSize: 14,
    flex: 1,
  },
  stepHint: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  tipBar: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tipMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
});
