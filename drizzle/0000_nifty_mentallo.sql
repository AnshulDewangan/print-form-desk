CREATE TABLE `grants` (
	`payment_id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`user_id` text NOT NULL,
	`plan` text NOT NULL,
	`mode` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grants_order_id_unique` ON `grants` (`order_id`);--> statement-breakpoint
CREATE INDEX `grants_user_mode_expiry` ON `grants` (`user_id`,`mode`,`expires_at`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan` text NOT NULL,
	`mode` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` integer NOT NULL,
	`refunded` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `orders_user_created` ON `orders` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`settings` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `templates_user` ON `templates` (`user_id`);