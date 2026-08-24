CREATE TABLE `collection_items` (
	`collection_id` text NOT NULL,
	`work_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`added_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`collection_id`, `work_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_name_uidx` ON `collections` (`name`);--> statement-breakpoint
CREATE TABLE `contributors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contributors_sort_name_uidx` ON `contributors` (`sort_name`);--> statement-breakpoint
CREATE TABLE `copies` (
	`id` text PRIMARY KEY NOT NULL,
	`edition_id` text NOT NULL,
	`source_row` integer,
	`ownership_status` text DEFAULT 'owned' NOT NULL,
	`location` text,
	`condition` text,
	`acquired_at` text,
	`acquired_from` text,
	`purchase_price` real,
	`is_gift` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `copies_edition_idx` ON `copies` (`edition_id`);--> statement-breakpoint
CREATE INDEX `copies_location_idx` ON `copies` (`location`);--> statement-breakpoint
CREATE TABLE `editions` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`publisher` text,
	`publication_year` integer,
	`illustrator` text,
	`language` text DEFAULT 'ru' NOT NULL,
	`features` text,
	`format` text DEFAULT 'hardcopy' NOT NULL,
	`isbn_10` text,
	`isbn_13` text,
	`pages` integer,
	`cover_key` text,
	`cover_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `editions_work_idx` ON `editions` (`work_id`);--> statement-breakpoint
CREATE INDEX `editions_isbn13_idx` ON `editions` (`isbn_13`);--> statement-breakpoint
CREATE INDEX `editions_publisher_idx` ON `editions` (`publisher`);--> statement-breakpoint
CREATE TABLE `progress_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attempt_id` integer NOT NULL,
	`progress` integer NOT NULL,
	`page` integer,
	`minutes` integer,
	`note` text,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `reading_attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `progress_events_attempt_idx` ON `progress_events` (`attempt_id`);--> statement-breakpoint
CREATE TABLE `reading_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_id` text NOT NULL,
	`status` text DEFAULT 'owned' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`current_page` integer,
	`rating` real,
	`started_at` text,
	`finished_at` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reading_attempts_work_idx` ON `reading_attempts` (`work_id`);--> statement-breakpoint
CREATE INDEX `reading_attempts_status_idx` ON `reading_attempts` (`status`);--> statement-breakpoint
CREATE INDEX `reading_attempts_finished_idx` ON `reading_attempts` (`finished_at`);--> statement-breakpoint
CREATE TABLE `reading_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`target_books` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reading_goals_year_uidx` ON `reading_goals` (`year`);--> statement-breakpoint
CREATE TABLE `work_contributors` (
	`work_id` text NOT NULL,
	`contributor_id` text NOT NULL,
	`role` text DEFAULT 'author' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`work_id`, `contributor_id`, `role`),
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contributor_id`) REFERENCES `contributors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `work_contributors_work_idx` ON `work_contributors` (`work_id`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`sort_title` text NOT NULL,
	`primary_author` text NOT NULL,
	`genre` text DEFAULT 'Без жанра' NOT NULL,
	`media_type` text DEFAULT 'book' NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `works_sort_title_idx` ON `works` (`sort_title`);--> statement-breakpoint
CREATE INDEX `works_author_idx` ON `works` (`primary_author`);--> statement-breakpoint
CREATE INDEX `works_genre_idx` ON `works` (`genre`);