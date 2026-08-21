CREATE TABLE "claim_merges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"old_user_id" text,
	"old_user_email" text NOT NULL,
	"new_user_id" text,
	"new_user_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claim_merges" ADD CONSTRAINT "claim_merges_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_merges" ADD CONSTRAINT "claim_merges_old_user_id_user_id_fk" FOREIGN KEY ("old_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_merges" ADD CONSTRAINT "claim_merges_new_user_id_user_id_fk" FOREIGN KEY ("new_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;