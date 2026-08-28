CREATE TABLE "conference_workshop_capacity" (
	"workshop_id" text NOT NULL,
	"round" text NOT NULL,
	"capacity" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conference_workshop_capacity_workshop_id_round_pk" PRIMARY KEY("workshop_id","round")
);
--> statement-breakpoint
CREATE TABLE "conference_workshop_registration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"round" text NOT NULL,
	"workshop_id" text NOT NULL,
	"source" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conference_workshop_registration" ADD CONSTRAINT "conference_workshop_registration_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_workshop_registration" ADD CONSTRAINT "conference_workshop_registration_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "conf_workshop_reg_enrollment_round_idx" ON "conference_workshop_registration" USING btree ("enrollment_id","round");