CREATE TABLE "conference_dinner_registration" (
	"enrollment_id" uuid PRIMARY KEY NOT NULL,
	"attending" boolean NOT NULL,
	"meal_type" text,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conference_dinner_registration" ADD CONSTRAINT "conference_dinner_registration_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_dinner_registration" ADD CONSTRAINT "conference_dinner_registration_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;