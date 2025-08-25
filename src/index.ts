import { Hono } from 'hono';
import type { Vars } from './types/hono';
import { auth as authRoute } from './routes/auth';
import { postsRoute } from './routes/posts';
import { commentsRoute } from './routes/comments';
import { likesRoute } from './routes/likes';
import { repostsRoute } from './routes/reposts';

const app = new Hono<{ Variables: Vars }>();

app.get('/health', (c) => c.text('ok'));
app.route('/auth', authRoute);
app.route('/posts', postsRoute);
app.route('/comments', commentsRoute);
app.route('/likes', likesRoute);
app.route('/reposts', repostsRoute);
export default app;