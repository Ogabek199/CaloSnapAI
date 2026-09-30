import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Reads the JWT `sub` without verifying it; authentication itself is still done by the route's AuthGuard. */
export function userIdFromAuthHeader(header?: string): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  const payload = header.slice(7).split('.')[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof json?.sub === 'string' && json.sub.length <= 64 ? json.sub : null;
  } catch {
    return null;
  }
}

/**
 * Mobile carriers put many users behind one CGNAT IP, so authenticated traffic is limited per user.
 * A forged `sub` only picks a different per-user bucket; the separate per-IP throttler still applies.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = userIdFromAuthHeader(req.headers?.authorization);
    return userId ? `user:${userId}` : `ip:${req.ip}`;
  }
}
