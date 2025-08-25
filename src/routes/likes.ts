import { Hono } from 'hono';
import type { Vars } from '../types/hono';
import type { ResultSetHeader } from 'mysql2';
import { db } from '../db/client';
import { likes, posts } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '../middlewares/auth';

export const likesRoute = new Hono<{ Variables: Vars }>();

likesRoute.post('/:postId', auth, async (c) => {
  const postId = parseInt(c.req.param('postId'));
  if (isNaN(postId)) return c.json({ error: 'Invalid post ID' }, 400);

  const user = c.get('user');

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0) return c.json({ error: 'Post not found' }, 404);

  const existingLike = await db.select().from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.authorId, user.id)))
    .limit(1);

  if (existingLike.length > 0) {
    return c.json({ error: 'Already liked' }, 409);
  }

  await db.insert(likes).values({
    postId,
    authorId: user.id,
  });

  return c.json({ message: 'Liked' }, 201);
});

likesRoute.delete('/:postId', auth, async (c) => {
  const postId = parseInt(c.req.param('postId'));
  if (isNaN(postId)) return c.json({ error: 'Invalid post ID' }, 400);

  const user = c.get('user');

  const result = await db.delete(likes)
    .where(and(eq(likes.postId, postId), eq(likes.authorId, user.id)));

  const deletedRows = (result as unknown as ResultSetHeader).affectedRows;
  if (deletedRows === 0) {
    return c.json({ error: 'Like not found' }, 404);
  }

  return c.json({ message: 'Unliked' }, 200);
});

likesRoute.get('/post/:postId/count', async (c) => {
  const postId = parseInt(c.req.param('postId'));
  if (isNaN(postId)) return c.json({ error: 'Invalid post ID' }, 400);

  const result = await db.select().from(likes).where(eq(likes.postId, postId));
  return c.json({ count: result.length });
});
