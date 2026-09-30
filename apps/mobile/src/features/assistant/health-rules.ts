import type { HealthCondition } from '../../shared/api/api-client';
import type { translations } from '../../shared/i18n/translations';

type Strings = (typeof translations)['uz'];

export type DailyHealthAlert = { level: 'warning' | 'info'; text: string };

const DIABETES: HealthCondition[] = ['DIABETES_TYPE_1', 'DIABETES_TYPE_2'];

/**
 * Offline day-level checks from diary totals. Deliberately conservative general guidance
 * (carbs ~40% of energy with diabetes, ~45% with prediabetes; fat ~30% with high cholesterol).
 */
export function dailyHealthAlerts(
  conditions: HealthCondition[] | undefined,
  totals: { carbs: number; fat: number },
  goalKcal: number,
  strings: Strings,
): DailyHealthAlert[] {
  if (!conditions?.length || goalKcal <= 0) return [];
  const alerts: DailyHealthAlert[] = [];

  const carbShare = conditions.some((c) => DIABETES.includes(c)) ? 0.4 : conditions.includes('PREDIABETES') ? 0.45 : 0;
  if (carbShare > 0) {
    const limit = Math.round((goalKcal * carbShare) / 4);
    const carbs = Math.round(totals.carbs);
    const fill = (template: string) => template.replace('{n}', String(carbs)).replace('{limit}', String(limit));
    if (carbs > limit) alerts.push({ level: 'warning', text: fill(strings.healthDailyCarbsOver) });
    else if (carbs >= limit * 0.85) alerts.push({ level: 'info', text: fill(strings.healthDailyCarbsNear) });
  }

  if (conditions.includes('HIGH_CHOLESTEROL')) {
    const limit = Math.round((goalKcal * 0.3) / 9);
    const fat = Math.round(totals.fat);
    if (fat > limit) {
      alerts.push({
        level: 'warning',
        text: strings.healthDailyFatOver.replace('{n}', String(fat)).replace('{limit}', String(limit)),
      });
    }
  }
  return alerts;
}
