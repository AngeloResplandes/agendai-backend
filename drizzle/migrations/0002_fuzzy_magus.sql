CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text(255) NOT NULL,
	`description` text(1000),
	`scheduled_date` text,
	`scheduled_time` text,
	`priority` text(10) DEFAULT 'medium',
	`status` text(20) DEFAULT 'pending',
	`created_by_agent` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
