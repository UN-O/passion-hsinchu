import { Pool, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import ws from "ws"

import * as appSchema from "./schema/app"
import * as authSchema from "./schema/auth"

// 用 neon-serverless（WebSocket）而不是 neon-http：better-auth 的 adapter
// 有些操作需要 transaction，而 neon-http 不支援。
// Node 環境沒有原生 WebSocket，要自己接上。
neonConfig.webSocketConstructor = ws

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("缺少 DATABASE_URL，請參考 .env.example 設定 Neon 連線字串")
}

const pool = new Pool({ connectionString })

export const schema = { ...authSchema, ...appSchema }

export const db = drizzle(pool, { schema })
