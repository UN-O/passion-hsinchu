import { registerHooks } from "node:module"
import { pathToFileURL } from "node:url"

const ROOT = pathToFileURL(process.cwd() + "/").href

// 專案原始碼用 bundler 風格的匯入（無副檔名 + @/ 別名），這對 Next.js 是正確的，
// 但 Node 的 ESM 解析器兩者都不支援。維護腳本透過這個 hook 直接重用 lib/ 底下的
// 程式碼，避免把正規化、schema 之類的邏輯複製一份出來造成漂移。
//
// 用法： node --env-file=.env --import ./scripts/ts-hook.mjs ./scripts/<script>.ts
registerHooks({
  resolve(specifier, context, nextResolve) {
    const spec = specifier.startsWith("@/") ? ROOT + specifier.slice(2) : specifier

    try {
      return nextResolve(spec, context)
    } catch (error) {
      if (!/\.[a-z]+$/i.test(spec)) {
        for (const ext of [".ts", ".tsx", "/index.ts"]) {
          try {
            return nextResolve(spec + ext, context)
          } catch {
            // 換下一個副檔名
          }
        }
      }
      throw error
    }
  },
})
