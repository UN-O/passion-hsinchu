-- 2026 Passion Camp — 舊版營會系統遺留表的結構備份
-- 匯出時間：2026-08-07T12:46:28.485Z
-- 匯出當下六張表皆為 0 rows，因此只有結構、沒有資料。
-- 保留此檔以便必要時還原；確認不需要後可直接刪除本檔。
--
-- 還原順序：achievements -> team_achievements（FK 依賴 achievements）
--           team_exp_records -> team_stats（VIEW 依賴 team_exp_records）
--           region_puzzles、users 無依賴。
-- id 欄位原本是 serial，還原時把 integer + nextval(...) 換成 serial 即可自動建立
-- 對應的 sequence（原有：achievements_id_seq、region_puzzles_id_seq、
-- team_achievements_id_seq、team_exp_records_id_seq、users_id_seq）。

-- achievements  (匯出當下 0 rows)
CREATE TABLE "achievements" (
  "id" integer DEFAULT nextval('achievements_id_seq'::regclass) NOT NULL,
  "name" character varying(100) NOT NULL,
  "description" text NOT NULL,
  "icon" character varying(50) NOT NULL,
  "category" character varying(20) NOT NULL,
  "exp_reward" integer DEFAULT 0,
  "scheduled_time" timestamp with time zone,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "achievements_category_check" CHECK (((category)::text = ANY (ARRAY[('scheduled'::character varying)::text, ('assigned'::character varying)::text]))),
  CONSTRAINT "achievements_pkey" PRIMARY KEY (id)
);

-- region_puzzles  (匯出當下 0 rows)
CREATE TABLE "region_puzzles" (
  "id" integer DEFAULT nextval('region_puzzles_id_seq'::regclass) NOT NULL,
  "region" character(1) NOT NULL,
  "piece_number" integer NOT NULL,
  "name" character varying(100) NOT NULL,
  "is_unlocked" boolean DEFAULT false,
  "unlocked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "region_puzzles_piece_number_check" CHECK (((piece_number >= 1) AND (piece_number <= 3))),
  CONSTRAINT "region_puzzles_pkey" PRIMARY KEY (id),
  CONSTRAINT "region_puzzles_region_piece_number_key" UNIQUE (region, piece_number)
);
CREATE INDEX idx_region_puzzles_region ON public.region_puzzles USING btree (region);

-- team_achievements  (匯出當下 0 rows)
CREATE TABLE "team_achievements" (
  "id" integer DEFAULT nextval('team_achievements_id_seq'::regclass) NOT NULL,
  "team_name" character varying(50) NOT NULL,
  "region" character(1) NOT NULL,
  "achievement_id" integer,
  "unlocked_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "team_achievements_achievement_id_fkey" FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  CONSTRAINT "team_achievements_pkey" PRIMARY KEY (id),
  CONSTRAINT "team_achievements_team_name_achievement_id_key" UNIQUE (team_name, achievement_id),
  CONSTRAINT "unique_team_achievement" UNIQUE (team_name, achievement_id)
);
CREATE INDEX idx_team_achievements_team ON public.team_achievements USING btree (team_name);

-- team_exp_records  (匯出當下 0 rows)
CREATE TABLE "team_exp_records" (
  "id" integer DEFAULT nextval('team_exp_records_id_seq'::regclass) NOT NULL,
  "team_name" character varying(50) NOT NULL,
  "region" character(1) NOT NULL,
  "exp_amount" integer NOT NULL,
  "reason" text NOT NULL,
  "admin_name" character varying(100) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "team_exp_records_exp_amount_check" CHECK ((exp_amount > 0)),
  CONSTRAINT "team_exp_records_pkey" PRIMARY KEY (id)
);
CREATE INDEX idx_team_exp_records_region ON public.team_exp_records USING btree (region);
CREATE INDEX idx_team_exp_records_team ON public.team_exp_records USING btree (team_name);

-- team_stats 是 VIEW，不是 TABLE（依賴 team_exp_records）。
-- 還原時必須排在 team_exp_records 之後建立。
CREATE VIEW "team_stats" AS
 SELECT team_name,
    region,
    COALESCE(sum(exp_amount), 0::bigint) AS total_exp,
    floor((COALESCE(sum(exp_amount), 0::bigint) / 500)::double precision) + 1::double precision AS level,
    count(*) AS record_count
   FROM team_exp_records
  GROUP BY team_name, region;

-- users  (匯出當下 0 rows)
CREATE TABLE "users" (
  "id" integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
  "name" character varying(100) NOT NULL,
  "nickname" character varying(50) NOT NULL,
  "region" character varying(10) NOT NULL,
  "team" character varying(50) NOT NULL,
  "expectations" text,
  "password" character varying(100) NOT NULL,
  "role" character varying(20) DEFAULT 'student'::character varying,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "users_region_check" CHECK (((region)::text = ANY (ARRAY[('R'::character varying)::text, ('G'::character varying)::text, ('O'::character varying)::text]))),
  CONSTRAINT "users_role_check" CHECK (((role)::text = ANY (ARRAY[('student'::character varying)::text, ('admin'::character varying)::text]))),
  CONSTRAINT "users_pkey" PRIMARY KEY (id)
);
CREATE INDEX idx_users_region ON public.users USING btree (region);
CREATE INDEX idx_users_team ON public.users USING btree (team);
