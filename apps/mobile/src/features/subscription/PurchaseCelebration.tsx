import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Check, Crown } from 'lucide-react-native';
import { usePalette, useStrings } from '../../store/useAppStore';
import { SUBSCRIPTION_PLANS, useSubscriptionStore } from '../../store/useSubscriptionStore';
import { androidTextFix } from '../../shared/theme/spacing';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CONFETTI_COLORS = ['#FBBF24', '#34D399', '#60A5FA', '#F472B6', '#A78BFA', '#FB923C', '#FFFFFF'];
const CONFETTI_COUNT = 42;
// Lets the paywall's own modal finish dismissing; iOS can't present two modals at once.
const SHOW_DELAY_MS = 450;

type Piece = {
  x: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  round: boolean;
};

const makePieces = (): Piece[] =>
  Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    x: Math.random() * SCREEN_W,
    size: 6 + Math.random() * 7,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 500,
    duration: 2200 + Math.random() * 1600,
    drift: (Math.random() - 0.5) * 120,
    spin: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 4),
    round: Math.random() > 0.7,
  }));

function ConfettiPiece({ piece }: { piece: Piece }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: piece.duration,
      delay: piece.delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [t, piece]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-40, SCREEN_H + 40] });
  const translateX = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, piece.drift, piece.drift * 0.4] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin * 360}deg`] });
  const opacity = t.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: piece.x,
        top: 0,
        width: piece.size,
        height: piece.round ? piece.size : piece.size * 0.45,
        borderRadius: piece.round ? piece.size / 2 : 1.5,
        backgroundColor: piece.color,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }],
      }}
    />
  );
}

export function PurchaseCelebration() {
  const planId = useSubscriptionStore((s) => s.celebratePlanId);
  const dismiss = useSubscriptionStore((s) => s.dismissCelebration);
  const strings = useStrings();
  const c = usePalette();

  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pieces = useMemo(() => (visible ? makePieces() : []), [visible]);

  const backdrop = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const perks = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!planId) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [planId]);

  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    [backdrop, card, badge, pulse, ...perks].forEach((v) => v.setValue(0));

    Animated.sequence([
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(card, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
      ]),
      Animated.spring(badge, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
      Animated.stagger(
        110,
        perks.map((v) => Animated.timing(v, { toValue: 1, duration: 260, useNativeDriver: true })),
      ),
    ]).start();

    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    if (!reduceMotion) loop.start();
    return () => loop.stop();
  }, [visible, reduceMotion, backdrop, card, badge, pulse, perks]);

  const close = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(card, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      dismiss();
    });
  };

  if (!visible) return null;

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  const planTitle = plan ? strings[plan.titleKey] : strings.proTitle;
  const perkTexts = [strings.proFeatureUnlimitedScan, strings.proFeatureMultiScan, strings.proFeaturePartyMode];

  const cardStyle = {
    opacity: card,
    transform: [
      { scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
      { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
    ],
  };
  const badgeStyle = {
    transform: [
      { scale: badge.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
      { rotate: badge.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) },
    ],
  };
  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />

      {!reduceMotion ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {pieces.map((p, i) => (
            <ConfettiPiece key={i} piece={p} />
          ))}
        </View>
      ) : null}

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.card, { backgroundColor: c.card }, cardStyle]}>
          <LinearGradient
            colors={['#312E81', '#4338CA', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardHeader}
          >
            <View style={styles.badgeWrap}>
              <Animated.View style={[styles.pulse, pulseStyle]} />
              <Animated.View style={badgeStyle}>
                <LinearGradient colors={['#FDE68A', '#F59E0B']} style={styles.badge}>
                  <Crown size={40} color="#FFFFFF" strokeWidth={2.2} />
                </LinearGradient>
              </Animated.View>
            </View>
            <Text style={styles.proLabel}>CALOSNAP PRO</Text>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={[styles.title, { color: c.text }]}>{strings.celebrateTitle}</Text>
            <Text style={[styles.sub, { color: c.textSecondary }]}>
              {strings.celebrateSub.replace('{plan}', planTitle)}
            </Text>

            <View style={styles.perks}>
              {perkTexts.map((text, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.perkRow,
                    {
                      opacity: perks[i],
                      transform: [
                        { translateX: perks[i].interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
                      ],
                    },
                  ]}
                >
                  <View style={[styles.perkCheck, { backgroundColor: c.primary }]}>
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={[styles.perkText, { color: c.text }]} numberOfLines={2}>
                    {text}
                  </Text>
                </Animated.View>
              ))}
            </View>

            <Pressable onPress={close} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>{strings.celebrateCta}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8, 6, 28, 0.72)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: Math.min(SCREEN_W - 40, 380),
    borderRadius: 28,
    overflow: 'hidden',
  },
  cardHeader: { alignItems: 'center', paddingTop: 32, paddingBottom: 22 },
  badgeWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  pulse: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FBBF24',
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  proLabel: {
    marginTop: 14,
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.4,
    ...androidTextFix,
  },
  body: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 22 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, ...androidTextFix },
  sub: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, ...androidTextFix },
  perks: { marginTop: 18, gap: 10 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkCheck: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  perkText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 19, ...androidTextFix },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', ...androidTextFix },
});
