import { View, Text, StyleSheet } from 'react-native';
import { FontSize, Radius, Spacing, androidTextFix } from '../theme/spacing';

interface MacroBarsProps {
  protein: number;
  carbs: number;
  fat: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  proteinColor: string;
  carbsColor: string;
  fatColor: string;
  trackColor: string;
  textColor: string;
  mutedColor: string;
  labels: { protein: string; carbs: string; fat: string };
}

function MacroCol({
  label,
  value,
  target,
  color,
  trackColor,
  textColor,
  mutedColor,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  trackColor: string;
  textColor: string;
  mutedColor: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <View style={styles.col}>
      <Text style={[styles.val, { color: textColor }]}>{Math.round(value)}g</Text>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View style={[styles.fill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.label, { color: mutedColor }]}>{label}</Text>
    </View>
  );
}

export function MacroBars(props: MacroBarsProps) {
  return (
    <View style={styles.row}>
      <MacroCol
        label={props.labels.protein}
        value={props.protein}
        target={props.proteinTarget}
        color={props.proteinColor}
        trackColor={props.trackColor}
        textColor={props.textColor}
        mutedColor={props.mutedColor}
      />
      <MacroCol
        label={props.labels.carbs}
        value={props.carbs}
        target={props.carbsTarget}
        color={props.carbsColor}
        trackColor={props.trackColor}
        textColor={props.textColor}
        mutedColor={props.mutedColor}
      />
      <MacroCol
        label={props.labels.fat}
        value={props.fat}
        target={props.fatTarget}
        color={props.fatColor}
        trackColor={props.trackColor}
        textColor={props.textColor}
        mutedColor={props.mutedColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    marginHorizontal: Spacing.sm / 2,
  },
  val: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
    ...androidTextFix,
  },
  track: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    ...androidTextFix,
  },
});
