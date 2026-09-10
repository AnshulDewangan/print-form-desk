import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    plan: text('plan').notNull(),
    mode: text('mode').notNull(),
    amount: integer('amount').notNull(),
    createdAt: integer('created_at').notNull(),
    refunded: integer('refunded').notNull().default(0),
  },
  (t) => [index('orders_user_created').on(t.userId, t.createdAt)],
);
export const grants = sqliteTable(
  'grants',
  {
    paymentId: text('payment_id').primaryKey(),
    orderId: text('order_id').notNull().unique(),
    userId: text('user_id').notNull(),
    plan: text('plan').notNull(),
    mode: text('mode').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('grants_user_mode_expiry').on(t.userId, t.mode, t.expiresAt)],
);
export const templates = sqliteTable(
  'templates',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    settings: text('settings').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('templates_user').on(t.userId)],
);
