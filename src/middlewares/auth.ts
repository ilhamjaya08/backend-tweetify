import type { MiddlewareHandler } from 'hono';
import type { Vars } from '../types/hono';
import { db } from '../db/client';
import { authTokens, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export const auth: MiddlewareHandler<{ Variables: Vars }> = async (c, next) => {
  const hdr = c.req.header('authorization') || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7).trim() : '';

  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const tokenHash = sha256(token);
  const row = await db.query.authTokens.findFirst({
    where: and(eq(authTokens.tokenHash, tokenHash), eq(authTokens.revoked, false)),
  });

  if (!row) return c.json({ error: 'Unauthorized' }, 401);

  const user = await db.query.users.findFirst({ where: eq(users.id, row.userId) });
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  // set user ke context
  c.set('user', { id: user.id, username: user.username });
  await next();
};
