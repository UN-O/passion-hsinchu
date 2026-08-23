CREATE TABLE "root_bible_readings" (
	"root_post_id" uuid PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"book" text NOT NULL,
	"chapter" integer NOT NULL,
	"verse_start" integer NOT NULL,
	"verse_end" integer,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "root_bible_readings" ADD CONSTRAINT "root_bible_readings_root_post_id_posts_id_fk" FOREIGN KEY ("root_post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "root_bible_readings" ADD CONSTRAINT "root_bible_readings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;