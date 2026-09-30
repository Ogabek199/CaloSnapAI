import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

const REVENUECAT_API = 'https://api.revenuecat.com/v1';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface RevenueCatEvent {
  id?: string;
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_from?: string[];
  transferred_to?: string[];
  entitlement_ids?: string[] | null;
  expiration_at_ms?: number | null;
  environment?: string;
}

interface Entitlement {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
}

interface PremiumState {
  isPremium: boolean;
  premiumUntil: Date | null;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly entitlementIds: string[];
  private readonly secretKey?: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.entitlementIds = (configService.get<string>('REVENUECAT_ENTITLEMENT_IDS') || 'calosnap_pro')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.secretKey = configService.get<string>('REVENUECAT_SECRET_API_KEY') || undefined;
  }

  async handleEvent(event: RevenueCatEvent): Promise<void> {
    if (event.type === 'TEST') {
      this.logger.log('RevenueCat TEST webhook received');
      return;
    }

    const userIds = this.collectUserIds(event);
    if (userIds.length === 0) {
      this.logger.warn(`RevenueCat ${event.type} (${event.id}) has no known app user id; ignored`);
      return;
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });

    for (const { id } of users) {
      const state = this.secretKey
        ? await this.fetchPremiumState(id)
        : this.premiumStateFromEvent(event, id);
      if (!state) continue;

      await this.prisma.user.update({ where: { id }, data: state });
      this.logger.log(
        `Premium for ${id} -> ${state.isPremium} until ${state.premiumUntil?.toISOString() ?? 'never'} (${event.type})`,
      );
    }
  }

  async syncUser(userId: string): Promise<{ isPremium: boolean; premiumUntil: string | null }> {
    if (this.secretKey) {
      const state = await this.fetchPremiumState(userId);
      if (state) {
        await this.prisma.user.update({ where: { id: userId }, data: state });
      }
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { isPremium: true, premiumUntil: true },
    });
    return {
      isPremium: hasActivePremium(user),
      premiumUntil: user.premiumUntil?.toISOString() ?? null,
    };
  }

  /** Our app user ids are Prisma UUIDs; anonymous RevenueCat ids ($RCAnonymousID:...) are skipped. */
  private collectUserIds(event: RevenueCatEvent): string[] {
    const ids = [
      event.app_user_id,
      event.original_app_user_id,
      ...(event.aliases || []),
      ...(event.transferred_from || []),
      ...(event.transferred_to || []),
    ];
    return [...new Set(ids.filter((id): id is string => !!id && UUID_RE.test(id)))];
  }

  /** Source of truth: ask RevenueCat for the subscriber's current entitlements (order-independent). */
  private async fetchPremiumState(appUserId: string): Promise<PremiumState | null> {
    try {
      const res = await fetch(`${REVENUECAT_API}/subscribers/${encodeURIComponent(appUserId)}`, {
        headers: { Authorization: `Bearer ${this.secretKey}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        this.logger.error(`RevenueCat subscriber fetch failed for ${appUserId}: HTTP ${res.status}`);
        return null;
      }
      const body = (await res.json()) as { subscriber?: { entitlements?: Record<string, Entitlement> } };
      return this.stateFromEntitlements(body.subscriber?.entitlements || {});
    } catch (e: any) {
      this.logger.error(`RevenueCat subscriber fetch error for ${appUserId}: ${e?.message}`);
      return null;
    }
  }

  private stateFromEntitlements(entitlements: Record<string, Entitlement>): PremiumState {
    const now = Date.now();
    let active = false;
    let latest: Date | null = null;
    let lifetime = false;

    for (const id of this.entitlementIds) {
      const ent = entitlements[id];
      if (!ent) continue;
      const expiry = ent.grace_period_expires_date || ent.expires_date;
      if (!expiry) {
        active = true;
        lifetime = true;
        continue;
      }
      const date = new Date(expiry);
      if (date.getTime() > now) active = true;
      if (!latest || date > latest) latest = date;
    }

    return { isPremium: active, premiumUntil: lifetime ? null : latest };
  }

  /** Fallback when no secret key is configured: derive state from the event payload itself. */
  private premiumStateFromEvent(event: RevenueCatEvent, userId: string): PremiumState | null {
    if (event.transferred_from?.includes(userId)) {
      return { isPremium: false, premiumUntil: null };
    }
    const relevant =
      !event.entitlement_ids || event.entitlement_ids.some((id) => this.entitlementIds.includes(id));
    if (!relevant) return null;

    if (event.type === 'EXPIRATION') {
      return { isPremium: false, premiumUntil: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null };
    }
    if (!event.expiration_at_ms) {
      return event.type === 'NON_RENEWING_PURCHASE' ? { isPremium: true, premiumUntil: null } : null;
    }
    const until = new Date(event.expiration_at_ms);
    return { isPremium: until.getTime() > Date.now(), premiumUntil: until };
  }
}

/** Premium is active if granted and not past its expiry (null expiry = non-expiring grant). */
export function hasActivePremium(user: { isPremium: boolean; premiumUntil: Date | null }): boolean {
  return user.isPremium && (!user.premiumUntil || user.premiumUntil.getTime() > Date.now());
}
