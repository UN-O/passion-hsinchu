ALTER TABLE "exp_record" ADD COLUMN "team_name" text;--> statement-breakpoint
CREATE INDEX "exp_record_team_name_idx" ON "exp_record" USING btree ("team_name");