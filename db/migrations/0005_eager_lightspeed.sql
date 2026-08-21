CREATE TABLE "camp_team_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"zone" text NOT NULL,
	"team_name" text NOT NULL,
	"role" text NOT NULL,
	"room" text,
	"shirt_size" text,
	"member_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "camp_team_member" ADD CONSTRAINT "camp_team_member_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "camp_team_member_enrollment_id_idx" ON "camp_team_member" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "camp_team_member_zone_team_name_idx" ON "camp_team_member" USING btree ("zone","team_name");