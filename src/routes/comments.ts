import { Hono } from 'hono';
import type { Vars } from '../types/hono';
import type { ResultSetHeader } from 'mysql2';
import { db } from '../db/client';
import { comments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '../middlewares/auth';

export const commentsRoute = new Hono<{ Variables: Vars }>();

commentsRoute.post('/', auth, async (c) => {
  const schema = z.object({
    comment: z.string().min(1),
    postId: z.number().int().optional(),
    replyId: z.number().int().optional(),
  });

  const body = await c.req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422);

  const { postId, replyId } = parsed.data;
  if (!postId && !replyId) return c.json({ error: 'postId or replyId required' }, 422);

  const user = c.get('user');

  const res = await db.insert(comments).values({
    comment: parsed.data.comment,
    postId,
    replyId,
    authorId: user.id,
  });

  const id = (res as unknown as ResultSetHeader).insertId;
  
  const newComment = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return c.json(newComment[0], 201);
});
