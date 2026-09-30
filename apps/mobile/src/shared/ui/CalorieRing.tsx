import { memo } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import { FontSize, androidTextFix } from '../theme/spacing';

interface CalorieRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  trackColor: string;
  progressColor: string;
  centerLabel: string;
  centerValue: string | number;
  centerSub?: string;
  valueColor: string;
  labelColor: string;
}

export const CalorieRing = memo(function CalorieRing({
  progress,
  size = 140,
  strokeWidth = 10,
  trackColor,
  progressColor,
  centerLabel,
  centerValue,
  centerSub,
  valueColor,
  labelColor,
}: CalorieRingProps) {
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = circumference - (circumference * clamped) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <Text style={[styles.label, { color: labelColor }]}>{centerLabel}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{centerValue}</Text>
      {centerSub ? <Text style={[styles.sub, { color: labelColor }]}>{centerSub}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginBottom: 2,
    ...androidTextFix,
  },
  value: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    letterSpacing: -0.8,
    ...androidTextFix,
  },
  sub: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: 2,
    ...androidTextFix,
  },
});
