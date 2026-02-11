CREATE TABLE `drafts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`place_id` text,
	`batch_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`vercel_url` text NOT NULL,
	`custom_domain` text,
	`status` text DEFAULT 'deployed',
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `place_search_results` (
	`search_id` integer,
	`place_id` text,
	PRIMARY KEY(`search_id`, `place_id`),
	FOREIGN KEY (`search_id`) REFERENCES `place_searches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `place_searches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text_query` text NOT NULL,
	`included_type` text,
	`min_rating` real,
	`location_bias_lat` real,
	`location_bias_lng` real,
	`location_bias_radius` real,
	`result_count` integer,
	`searched_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`formatted_address` text,
	`city` text,
	`region` text,
	`country` text DEFAULT 'US',
	`postal_code` text,
	`location_lat` real,
	`location_lng` real,
	`primary_type` text,
	`types` text,
	`business_status` text,
	`google_maps_uri` text,
	`phone` text,
	`website_uri` text,
	`rating` real,
	`user_rating_count` integer,
	`price_level` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `site_audits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`place_id` text,
	`url` text NOT NULL,
	`success` integer NOT NULL,
	`error` text,
	`emails` text,
	`phone_numbers` text,
	`social_links` text,
	`https` integer,
	`has_viewport` integer,
	`generator` text,
	`free_subdomain` integer,
	`copyright_year` integer,
	`server_header` text,
	`has_sitemap` integer,
	`has_structured_data` integer,
	`load_time_ms` integer,
	`page_size` integer,
	`scraped_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE no action
);
