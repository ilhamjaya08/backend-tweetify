import { Hono } from 'hono';
import { db } from '../db/client';
import { users, authTokens } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function genToken() {
  return crypto.randomBytes(32).toString('hex'); // simpen plain ke client
}

export const auth = new Hono();

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(6),
});

auth.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422);

  const exists = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });
  if (exists) return c.json({ error: 'Email already used' }, 409);

  const pwdHash = await bcrypt.hash(parsed.data.password, 10);
  await db.insert(users).values({
    username: parsed.data.username,
    email: parsed.data.email,
    passwordHash: pwdHash,
  });

  // Fetch the user to get their ID
  const newUser = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });
  if (!newUser) return c.json({ error: 'Failed to create user' }, 500);

  const token = genToken();
  await db.insert(authTokens).values({
    userId: newUser.id,
    tokenHash: sha256(token),
  });

  return c.json({ token }, 201);
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

auth.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422);

  const u = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (!u) return c.json({ error: 'Invalid credentials' }, 401);

  const ok = await bcrypt.compare(parsed.data.password, u.passwordHash);
  if (!ok) return c.json({ error: 'Invalid credentials' }, 401);

  const token = genToken();
  await db.insert(authTokens).values({ userId: u.id, tokenHash: sha256(token) });

  return c.json({ token });
});
