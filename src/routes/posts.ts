import { Hono } from 'hono';
import type { Vars } from '../types/hono';
import type { ResultSetHeader } from 'mysql2';
import { db } from '../db/client';
import { posts } from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '../middlewares/auth';

export const postsRoute = new Hono<{ Variables: Vars }>();

postsRoute.get('/', async (c) => {
  const data = await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(30);
  return c.json(data);
});

postsRoute.post('/', auth, async (c) => {
  const schema = z.object({
    text: z.string().max(1000).optional(),
    image: z.string().url().optional(),
  });
  const body = await c.req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422);

  const user = c.get('user');
  const res = await db.insert(posts).values({
    authorId: user.id,
    text: parsed.data.text,
    image: parsed.data.image,
  });

  const id = (res as unknown as ResultSetHeader).insertId;
  
  const newPost = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return c.json(newPost[0], 201);
});
