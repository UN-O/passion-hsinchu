CREATE TABLE "exp_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" text,
	"created_by" text,
	"created_by_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exp_record" ADD CONSTRAINT "exp_record_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exp_record_region_idx" ON "exp_record" USING btree ("region");--> statement-breakpoint
CREATE INDEX "exp_record_created_at_idx" ON "exp_record" USING btree ("created_at");