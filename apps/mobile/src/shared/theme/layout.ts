/** Floating Telegram-style tab bar metrics. */

export const TAB_BAR_HEIGHT = 62;

export const TAB_BAR_H_MARGIN = 18;

export const TAB_BAR_BOTTOM_GAP = 8;

/** @deprecated */
export const TAB_BAR_FAB_SIZE = 0;
export const TAB_BAR_FAB_LIFT = 0;

export const TAB_BAR_SCROLL_EXTRA = 18;
export const TAB_BAR_MIN_INSET = 8;

export function tabBarScrollPadding(safeBottom: number): number {
  const inset = Math.max(safeBottom, TAB_BAR_MIN_INSET);
  return TAB_BAR_HEIGHT + inset + TAB_BAR_BOTTOM_GAP + TAB_BAR_SCROLL_EXTRA;
}
