import {
  type AnyPgColumn,
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"

// 教材為 Root 的 Threads-like 討論系統。
//
// 這個專案沒有獨立的「教材」資料表——課程內容目前都是寫死在 lib/*-content.ts
// 或靜態頁面裡（conference 工作坊有穩定的 id，camp 聚會頁目前只有一個佔位頁）。
// 所以 root 不掛在另一張 material 表上，而是用 root_key（穩定字串，例如
// "conference-workshop-xxx"）當 anchor：第一次有人打開該頁面的討論時，
// 用 root_key 冪等建立 root（ON CONFLICT DO NOTHING）。
//
// root_key 只由程式碼決定（哪些頁面有討論是開發者/管理者寫死的路由清單），
// 不接受使用者自由輸入，等同於「只有具管理權限的人能建立 root」的精神。
//
// 統一的 conversation tree：所有節點（root / direct reply / nested reply /
// 帶 poll 的 reply）都用同一張 posts，不拆 posts/comments/subcomments。
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // root post 沒有「作者」——它代表教材／活動本身，不是某個使用者寫的。
    // 一般 reply 一定有 authorId，但 NOT NULL 留給應用層驗證（root 需要例外）。
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    // NULL = root post；有值 = 直接父節點（可能是 root 也可能是另一則 reply）
    replyToId: uuid("reply_to_id").references((): AnyPgColumn => posts.id, { onDelete: "cascade" }),
    // root post 是自己的 rootPostId；所有子孫節點都指向同一個 root
    rootPostId: uuid("root_post_id")
      .notNull()
      .references((): AnyPgColumn => posts.id, { onDelete: "cascade" }),
    // intentional denormalization：root 直接子節點（branch 的起點）的 id。
    // root 本身是 NULL；direct reply 是自己；nested reply 沿用 parent 的值。
    // 讓任何深度的 nested reply 都能 O(1) 知道自己屬於哪一條主要討論串，
    // 不必從自己往上 recursive walk 到 root。
    rootBranchId: uuid("root_branch_id").references((): AnyPgColumn => posts.id, { onDelete: "set null" }),
    // 只有 root post 會設定：拿來冪等尋找／建立某個頁面對應的討論 root。
    rootKey: text("root_key"),
    // 「PASSION 官方」顯示旗標：貼文還是原本那個 admin 發的（authorId 不變，
    // 刪除／編輯權限也不變），只是畫面上把作者名稱／icon 換成「PASSION 官方」。
    // 不是獨立帳號——admin 只能切換自己發的貼文（見 mutations.ts toggleOfficial）。
    isOfficial: boolean("is_official").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("posts_root_key_idx").on(table.rootKey),
    // Latest 排序 + 找某節點的所有直接子節點
    index("posts_reply_to_created_idx").on(table.replyToId, table.createdAt, table.id),
    index("posts_root_post_id_idx").on(table.rootPostId),
    index("posts_root_branch_id_idx").on(table.rootBranchId),
  ]
)

// Pin 是 discussion 的 presentation state，不是 posts 的欄位——Pin 不代表
// 這篇 reply 本身有什麼不同，只代表它在某個 root 底下被摘要／置頂。
// 第一版只允許 pin root 的 direct reply（nested reply 不能被 pin）。
export const discussionPins = pgTable(
  "discussion_pins",
  {
    rootPostId: uuid("root_post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    pinnedBy: text("pinned_by").references(() => user.id, { onDelete: "set null" }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.rootPostId, table.postId] }),
    index("discussion_pins_root_position_idx").on(table.rootPostId, table.position),
  ]
)

// Poll 不是新的 post type，只是「這篇 post 存在一筆 poll relation」。
export const polls = pgTable("polls", {
  postId: uuid("post_id")
    .primaryKey()
    .references(() => posts.id, { onDelete: "cascade" }),
  allowMultiple: boolean("allow_multiple").notNull().default(false),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const pollOptions = pgTable(
  "poll_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pollPostId: uuid("poll_post_id")
      .notNull()
      .references(() => polls.postId, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: integer("position").notNull().default(0),
    // 快取的聚合票數。canonical source 仍然是 poll_votes；這欄只是避免
    // 每次 render 都 COUNT(*) GROUP BY，在 vote 的 transaction 內原子更新。
    voteCount: integer("vote_count").notNull().default(0),
  },
  (table) => [index("poll_options_poll_post_position_idx").on(table.pollPostId, table.position)]
)

export const pollVotes = pgTable(
  "poll_votes",
  {
    pollPostId: uuid("poll_post_id")
      .notNull()
      .references(() => polls.postId, { onDelete: "cascade" }),
    pollOptionId: uuid("poll_option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // 防止對同一個選項重複投票（idempotency）。單選 vs 多選的「一人限一票」
    // 規則由 transaction 內的應用邏輯保證（single-choice 先刪舊票再插新票）。
    primaryKey({ columns: [table.pollPostId, table.pollOptionId, table.userId] }),
    index("poll_votes_user_poll_idx").on(table.userId, table.pollPostId),
  ]
)

// Like 的 canonical source of truth。
export const postLikes = pgTable(
  "post_likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.postId] }),
    index("post_likes_post_created_idx").on(table.postId, table.createdAt),
  ]
)

// Bookmark 是私人的，不公開數量、不做聚合。
export const bookmarks = pgTable(
  "bookmarks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] })]
)

// Derived / rebuildable read model：專門服務快速 discussion 排序渲染。
// 如果整張表被清空，理論上可以從 posts + post_likes 重建。canonical 的
// 「誰按過讚」仍然只在 post_likes；這裡的 like_count 只是快取的聚合值。
export const replyRank = pgTable(
  "reply_rank",
  {
    postId: uuid("post_id")
      .primaryKey()
      .references(() => posts.id, { onDelete: "cascade" }),
    // 與 posts 部分重複（parentId = replyToId），是刻意的 denormalization，
    // 讓 ranking query 可以只靠這張表的單一 B-tree index，不用 join posts。
    parentId: uuid("parent_id").references(() => posts.id, { onDelete: "cascade" }),
    rootPostId: uuid("root_post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    rootBranchId: uuid("root_branch_id").references(() => posts.id, { onDelete: "set null" }),
    likeCount: integer("like_count").notNull().default(0),
    directReplyCount: integer("direct_reply_count").notNull().default(0),
    descendantCount: integer("descendant_count").notNull().default(0),
    replyScore: doublePrecision("reply_score").notNull().default(0),
    branchScore: doublePrecision("branch_score").notNull().default(0),
    bestDirectChildId: uuid("best_direct_child_id").references(() => posts.id, { onDelete: "set null" }),
    bestDirectChildScore: doublePrecision("best_direct_child_score").notNull().default(0),
    rootAuthorParticipated: boolean("root_author_participated").notNull().default(false),
    rootAuthorReplyCount: integer("root_author_reply_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Top 排序：某個 parent 底下依 branch_score 排序（tie-break 用 post_id）
    index("reply_rank_parent_branch_score_idx").on(table.parentId, table.branchScore, table.postId),
    // 找某個 reply 目前最佳的 direct child
    index("reply_rank_parent_reply_score_idx").on(table.parentId, table.replyScore, table.postId),
  ]
)

// Root-level 討論設定。只有 root 存在對應的一列（root 建立時一起建立 default）。
export const discussionSettings = pgTable("discussion_settings", {
  rootPostId: uuid("root_post_id")
    .primaryKey()
    .references(() => posts.id, { onDelete: "cascade" }),
  discussionEnabled: boolean("discussion_enabled").notNull().default(true),
  defaultSort: text("default_sort", { enum: ["top", "latest"] })
    .notNull()
    .default("top"),
  // 0 = 停用 slow mode
  slowModeSeconds: integer("slow_mode_seconds").notNull().default(0),
  allowStudentRootReplies: boolean("allow_student_root_replies").notNull().default(true),
  allowNestedReplies: boolean("allow_nested_replies").notNull().default(true),
  maxReplyDepth: integer("max_reply_depth"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// 貼文附圖。圖檔本體放 Cloudflare R2，這張表只存「指標＋顯示需要的中繼資料」
// （尺寸拿來先撐出正確比例的骨架，避免圖載入後版面跳動）。
//
// postId 可以是 NULL：上傳一定發生在貼文送出之前（使用者在編輯器裡先選圖、
// 壓縮、上傳，最後才按送出），所以先以 postId = NULL 落地一筆「待附加」的
// 圖片，等 createReply 成功後再 UPDATE 綁上去。沒被綁上的孤兒列由
// sweepOrphanImages() 定期回收（連 R2 物件一起刪）。
//
// 一張圖對應 R2 上兩個物件：原圖（storageKey）跟縮圖（thumbKey）。列表用
// 縮圖、放大檢視才載原圖，一則貼文最多 10 張時才不會一次吃掉幾 MB 流量。
export const postImages = pgTable(
  "post_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    // 上傳者。附加到貼文之前，只有上傳者本人能拿它去發文（見 images.ts
    // attachImagesToPost 的 WHERE 條件）——不然拿到別人的 image id 就能把
    // 別人上傳的圖掛到自己的貼文上。
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull().unique(),
    thumbKey: text("thumb_key").notNull(),
    // "image/webp"，或瀏覽器不支援 webp 編碼時退回的 "image/jpeg"
    contentType: text("content_type").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    byteSize: integer("byte_size").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("post_images_post_position_idx").on(table.postId, table.position),
    // 孤兒回收：找出還沒綁上貼文、而且已經放很久的列
    index("post_images_pending_idx").on(table.postId, table.createdAt),
  ]
)
