CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`email` text(255) NOT NULL,
	`password` text(255) NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);