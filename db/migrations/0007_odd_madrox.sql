CREATE TABLE "link_previews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"status" text DEFAULT 'ok' NOT NULL,
	"title" text,
	"description" text,
	"site_name" text,
	"image_key" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "link_previews_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE INDEX "link_previews_fetched_at_idx" ON "link_previews" USING btree ("fetched_at");