import { Hono } from 'hono';
import type { Vars } from '../types/hono';
import type { ResultSetHeader } from 'mysql2';
import { db } from '../db/client';
import { reposts, posts } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '../middlewares/auth';

export const repostsRoute = new Hono<{ Variables: Vars }>();

repostsRoute.post('/:postId', auth, async (c) => {
  const postId = parseInt(c.req.param('postId'));
  if (isNaN(postId)) return c.json({ error: 'Invalid post ID' }, 400);

  const user = c.get('user');

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0) return c.json({ error: 'Post not found' }, 404);

  const existingRepost = await db.select().from(reposts)
    .where(and(eq(reposts.postId, postId), eq(reposts.authorId, user.id)))
    .limit(1);

  if (existingRepost.length > 0) {
    return c.json({ error: 'Already reposted' }, 409);
  }

  const res = await db.insert(reposts).values({
    postId,
    authorId: user.id,
  });

  const id = (res as unknown as ResultSetHeader).insertId;
  const newRepost = await db.select().from(reposts).where(eq(reposts.id, id)).limit(1);
  return c.json(newRepost[0], 201);
});

repostsRoute.delete('/:postId', auth, async (c) => {
  const postId = parseInt(c.req.param('postId'));
  if (isNaN(postId)) return c.json({ error: 'Invalid post ID' }, 400);

  const user = c.get('user');

  const result = await db.delete(reposts)
    .where(and(eq(reposts.postId, postId), eq(reposts.authorId, user.id)));

  const deletedRows = (result as unknown as ResultSetHeader).affectedRows;
  if (deletedRows === 0) {
    return c.json({ error: 'Repost not found' }, 404);
  }

  return c.json({ message: 'Unreposted' }, 200);
});

repostsRoute.get('/post/:postId/count', async (c) => {
  const postId = parseInt(c.req.param('postId'));
  if (isNaN(postId)) return c.json({ error: 'Invalid post ID' }, 400);

  const result = await db.select().from(reposts).where(eq(reposts.postId, postId));
  return c.json({ count: result.length });
});
