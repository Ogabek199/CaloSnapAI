import { ApiError } from '../../shared/api/api-client';

/** The server re-checks Pro on every AI call; a stale local flag surfaces as this 403. */
export const isPremiumRequiredError = (e: unknown): boolean =>
  e instanceof ApiError && e.status === 403 && (e.data as any)?.code === 'PREMIUM_REQUIRED';
