CREATE TABLE "bookmarks" (
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_user_id_post_id_pk" PRIMARY KEY("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "discussion_pins" (
	"root_post_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"pinned_by" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discussion_pins_root_post_id_post_id_pk" PRIMARY KEY("root_post_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "discussion_settings" (
	"root_post_id" uuid PRIMARY KEY NOT NULL,
	"discussion_enabled" boolean DEFAULT true NOT NULL,
	"default_sort" text DEFAULT 'top' NOT NULL,
	"slow_mode_seconds" integer DEFAULT 0 NOT NULL,
	"allow_student_root_replies" boolean DEFAULT true NOT NULL,
	"allow_nested_replies" boolean DEFAULT true NOT NULL,
	"max_reply_depth" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_post_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"vote_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"poll_post_id" uuid NOT NULL,
	"poll_option_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "poll_votes_poll_post_id_poll_option_id_user_id_pk" PRIMARY KEY("poll_post_id","poll_option_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"post_id" uuid PRIMARY KEY NOT NULL,
	"allow_multiple" boolean DEFAULT false NOT NULL,
	"closes_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_likes_user_id_post_id_pk" PRIMARY KEY("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" text,
	"content" text NOT NULL,
	"reply_to_id" uuid,
	"root_post_id" uuid NOT NULL,
	"root_branch_id" uuid,
	"root_key" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reply_rank" (
	"post_id" uuid PRIMARY KEY NOT NULL,
	"parent_id" uuid,
	"root_post_id" uuid NOT NULL,
	"root_branch_id" uuid,
	"like_count" integer DEFAULT 0 NOT NULL,
	"direct_reply_count" integer DEFAULT 0 NOT NULL,
	"descendant_count" integer DEFAULT 0 NOT NULL,
	"reply_score" double precision DEFAULT 0 NOT NULL,
	"branch_score" double precision DEFAULT 0 NOT NULL,
	"best_direct_child_id" uuid,
	"best_direct_child_score" double precision DEFAULT 0 NOT NULL,
	"root_author_participated" boolean DEFAULT false NOT NULL,
	"root_author_reply_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_pins" ADD CONSTRAINT "discussion_pins_root_post_id_posts_id_fk" FOREIGN KEY ("root_post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_pins" ADD CONSTRAINT "discussion_pins_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_pins" ADD CONSTRAINT "discussion_pins_pinned_by_user_id_fk" FOREIGN KEY ("pinned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_settings" ADD CONSTRAINT "discussion_settings_root_post_id_posts_id_fk" FOREIGN KEY ("root_post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_post_id_polls_post_id_fk" FOREIGN KEY ("poll_post_id") REFERENCES "public"."polls"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_post_id_polls_post_id_fk" FOREIGN KEY ("poll_post_id") REFERENCES "public"."polls"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_option_id_poll_options_id_fk" FOREIGN KEY ("poll_option_id") REFERENCES "public"."poll_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_reply_to_id_posts_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_root_post_id_posts_id_fk" FOREIGN KEY ("root_post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_root_branch_id_posts_id_fk" FOREIGN KEY ("root_branch_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_rank" ADD CONSTRAINT "reply_rank_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_rank" ADD CONSTRAINT "reply_rank_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_rank" ADD CONSTRAINT "reply_rank_root_post_id_posts_id_fk" FOREIGN KEY ("root_post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_rank" ADD CONSTRAINT "reply_rank_root_branch_id_posts_id_fk" FOREIGN KEY ("root_branch_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_rank" ADD CONSTRAINT "reply_rank_best_direct_child_id_posts_id_fk" FOREIGN KEY ("best_direct_child_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discussion_pins_root_position_idx" ON "discussion_pins" USING btree ("root_post_id","position");--> statement-breakpoint
CREATE INDEX "poll_options_poll_post_position_idx" ON "poll_options" USING btree ("poll_post_id","position");--> statement-breakpoint
CREATE INDEX "poll_votes_user_poll_idx" ON "poll_votes" USING btree ("user_id","poll_post_id");--> statement-breakpoint
CREATE INDEX "post_likes_post_created_idx" ON "post_likes" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_root_key_idx" ON "posts" USING btree ("root_key");--> statement-breakpoint
CREATE INDEX "posts_reply_to_created_idx" ON "posts" USING btree ("reply_to_id","created_at","id");--> statement-breakpoint
CREATE INDEX "posts_root_post_id_idx" ON "posts" USING btree ("root_post_id");--> statement-breakpoint
CREATE INDEX "posts_root_branch_id_idx" ON "posts" USING btree ("root_branch_id");--> statement-breakpoint
CREATE INDEX "reply_rank_parent_branch_score_idx" ON "reply_rank" USING btree ("parent_id","branch_score","post_id");--> statement-breakpoint
CREATE INDEX "reply_rank_parent_reply_score_idx" ON "reply_rank" USING btree ("parent_id","reply_score","post_id");