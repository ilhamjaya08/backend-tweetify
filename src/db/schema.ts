import {
  mysqlTable, serial, varchar, text, int, timestamp, boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// USERS
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 191 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// AUTH TOKENS (bearer ala sanctum)
export const authTokens = mysqlTable("auth_tokens", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  tokenHash: varchar("token_hash", { length: 191 }).notNull().unique(),
  // optional: device name / ip
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  revoked: boolean("revoked").default(false).notNull(),
}, (t) => ({
  userIdx: sql`INDEX user_idx (${t.userId})`,
}));

// POSTS
export const posts = mysqlTable("posts", {
  id: serial("id").primaryKey(),
  authorId: int("author_id").notNull(),
  text: text("text"),
  image: varchar("image", { length: 512 }), // URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  authorIdx: sql`INDEX author_idx (${t.authorId})`,
}));

// COMMENTS
export const comments = mysqlTable("comments", {
  id: serial("id").primaryKey(),
  comment: text("comment").notNull(),
  postId: int("post_id"),        // nullable: bisa komentar ke post...
  replyId: int("reply_id"),      // ...atau reply ke comment lain
  authorId: int("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  postIdx: sql`INDEX post_idx (${t.postId})`,
  replyIdx: sql`INDEX reply_idx (${t.replyId})`,
  authorIdx: sql`INDEX c_author_idx (${t.authorId})`,
}));

// LIKES
export const likes = mysqlTable("likes", {
  id: serial("id").primaryKey(),
  postId: int("post_id").notNull(),
  authorId: int("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniq: sql`UNIQUE KEY likes_unique (${t.postId}, ${t.authorId})`,
  postIdx: sql`INDEX like_post_idx (${t.postId})`,
  authorIdx: sql`INDEX like_author_idx (${t.authorId})`,
}));

// REPOSTS
export const reposts = mysqlTable("reposts", {
  id: serial("id").primaryKey(),
  postId: int("post_id").notNull(),
  authorId: int("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniq: sql`UNIQUE KEY reposts_unique (${t.postId}, ${t.authorId})`,
  postIdx: sql`INDEX repost_post_idx (${t.postId})`,
  authorIdx: sql`INDEX repost_author_idx (${t.authorId})`,
}));

/**
 * Catatan:
 * - MySQL CHECK constraint buat enforce "postId XOR replyId" historisnya suka diabaikan,
 *   jadi validasi logic ini kita enforce di layer aplikasi.
 * - Foreign key bisa ditambah lewat raw SQL migration kalau perlu strict FK.
 */
