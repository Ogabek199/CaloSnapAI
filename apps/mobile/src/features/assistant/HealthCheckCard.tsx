import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { HeartPulse, ShieldAlert, TriangleAlert, Info, Crown, RefreshCw } from 'lucide-react-native';
import { useAppStore, usePalette, useStrings } from '../../store/useAppStore';
import { ApiClient, type HealthCheckItem, type HealthCheckResult } from '../../shared/api/api-client';
import { FontSize, Radius, Spacing, androidTextFix } from '../../shared/theme/spacing';
import { getTodayContext } from './day-context';
import { isPremiumRequiredError } from './pro-gate';

// Portion steppers fire rapidly; wait until the user stops adjusting before paying for a model call.
const DEBOUNCE_MS = 900;

type Props = { items: HealthCheckItem[] };

export function HealthCheckCard({ items }: Props) {
  const router = useRouter();
  const c = usePalette();
  const strings = useStrings();
  const language = useAppStore((s) => s.language);
  const isPremium = useAppStore((s) => !!s.user.isPremium);
  const conditions = useAppStore((s) => s.user.healthConditions);
  const hasConditions = !!conditions?.length;

  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const requestIdRef = useRef(0);

  const signature = useMemo(
    () =>
      JSON.stringify([
        language,
        conditions ?? [],
        items.map((i) => [i.name, Math.round(i.weightGrams), Math.round(i.calories)]),
      ]),
    [items, language, conditions],
  );

  useEffect(() => {
    if (!hasConditions || !isPremium || items.length === 0) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setFailed(false);
    const timer = setTimeout(async () => {
      try {
        const res = await ApiClient.assistantHealthCheck(items, language, getTodayContext());
        if (requestId === requestIdRef.current) setResult(res);
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        if (isPremiumRequiredError(e)) {
          setResult(null);
        }
        setFailed(true);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      // Invalidate the in-flight request so a slow reply for old portions can't overwrite a newer one.
      requestIdRef.current++;
    };
    // `items` is captured through `signature`, which changes whenever the meal does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, hasConditions, isPremium, attempt]);

  if (!hasConditions) return null;

  if (!isPremium) {
    return (
      <Pressable
        onPress={() => router.push('/paywall')}
        style={({ pressed }) => [
          styles.card,
          styles.teaser,
          { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityRole="button"
      >
        <View style={[styles.icon, { backgroundColor: c.dangerBg }]}>
          <HeartPulse size={18} color={c.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>{strings.healthCheckTitle}</Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>{strings.healthProTeaser}</Text>
        </View>
        <View style={styles.proPill}>
          <Crown size={11} color="#FBBF24" />
          <Text style={styles.proText}>PRO</Text>
        </View>
      </Pressable>
    );
  }

  const overallLabel =
    result?.overall === 'avoid'
      ? strings.healthOverallAvoid
      : result?.overall === 'caution'
        ? strings.healthOverallCaution
        : result?.overall === 'good'
          ? strings.healthOverallGood
          : null;
  const overallColor = result?.overall === 'avoid' ? c.danger : result?.overall === 'caution' ? c.secondary : c.primary;
  const overallBg = result?.overall === 'avoid' ? c.dangerBg : result?.overall === 'caution' ? c.secondaryBg : c.primaryBg;

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.headRow}>
        <View style={[styles.icon, { backgroundColor: c.dangerBg }]}>
          <HeartPulse size={18} color={c.danger} />
        </View>
        <Text style={[styles.title, { color: c.text, flex: 1 }]}>{strings.healthCheckTitle}</Text>
        {loading ? (
          <ActivityIndicator size="small" color={c.primary} />
        ) : overallLabel ? (
          <View style={[styles.overallPill, { backgroundColor: overallBg }]}>
            <Text style={[styles.overallText, { color: overallColor }]}>{overallLabel}</Text>
          </View>
        ) : null}
      </View>

      {loading && !result ? (
        <Text style={[styles.sub, { color: c.textMuted }]}>{strings.healthChecking}</Text>
      ) : failed && !result ? (
        <Pressable onPress={() => setAttempt((n) => n + 1)} style={styles.retryRow} accessibilityRole="button">
          <Text style={[styles.sub, { color: c.textMuted, flex: 1 }]}>{strings.healthCheckFailed}</Text>
          <RefreshCw size={14} color={c.primary} />
          <Text style={[styles.retryText, { color: c.primary }]}>{strings.retryBtn}</Text>
        </Pressable>
      ) : result ? (
        <View style={[styles.alerts, loading && { opacity: 0.5 }]}>
          {result.alerts.map((a, i) => {
            const color = a.level === 'danger' ? c.danger : a.level === 'warning' ? c.secondary : c.primary;
            const bg = a.level === 'danger' ? c.dangerBg : a.level === 'warning' ? c.secondaryBg : c.primaryBg;
            const Icon = a.level === 'danger' ? ShieldAlert : a.level === 'warning' ? TriangleAlert : Info;
            return (
              <View key={`${a.title}-${i}`} style={[styles.alert, { backgroundColor: bg }]}>
                <Icon size={16} color={color} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertTitle, { color }]}>{a.title}</Text>
                  <Text style={[styles.alertMsg, { color: c.text }]}>{a.message}</Text>
                </View>
              </View>
            );
          })}
          <Text style={[styles.disclaimer, { color: c.textMuted }]}>{strings.healthDisclaimer}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg + 2,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  teaser: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },
  sub: { fontSize: 13, lineHeight: 18, ...androidTextFix },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: '#1F2937',
  },
  proText: { color: '#FBBF24', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  overallPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  overallText: { fontSize: 12, fontWeight: '700', ...androidTextFix },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  retryText: { fontSize: 13, fontWeight: '700', ...androidTextFix },
  alerts: { gap: Spacing.sm },
  alert: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: Radius.md },
  alertTitle: { fontSize: 14, fontWeight: '700', ...androidTextFix },
  alertMsg: { fontSize: 13, lineHeight: 18, marginTop: 2, ...androidTextFix },
  disclaimer: { fontSize: 11, textAlign: 'center', ...androidTextFix },
});
