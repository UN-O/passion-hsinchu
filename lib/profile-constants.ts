// 個人資料的固定常數。跟 lib/discussion/constants.ts 同樣的理由：client
// component 也要用（前端限制輸入長度），所以不能放在會 import @/db 的
// lib/profile.ts 裡。
export const HERO_NAME_MAX_LENGTH = 12
