import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/*.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 只管我們自己的表，不要碰 Neon 內建的 neon_auth schema
  schemaFilter: ["public"],
})
