import localFont from "next/font/local"

// 源流明體（GenRyuMin2 TW-Bold），用在營會守則、靈修內容、首頁早晨靈修卡片、
// CONF 開場經文／禱告文等處。
//
// 原本只抽「當下文案實際用到的字」，19.7MB 壓到 ~123KB——但 CONF 經文／
// 禱告文裡的 {} 會代入使用者的真實姓名，是無法預先窮舉的動態內容，字沒
// 收進字型檔就會悄悄退回瀏覽器預設字型（先後兩次真的發生：「早」「晨」、
// 「凱」「曦」都是等使用者實際用到才發現缺字）。改成收 Big5 常用字（第一
// 字面，5338 字，涵蓋台灣日常書寫、姓名幾乎全部會用到的字）＋原本文案
// 用字的聯集，19.7MB 壓到 ~1.1MB——體積明顯變大，但用「涵蓋幾乎所有可能
// 姓名字」換掉「等真人回報缺字才補」，這個情境下划算。
// 之後如果又發現缺字（表示那個字冷僻到連常用字表都沒收），把這裡的字元
// 清單加上去、重新跑一次 subset：
//
//   python3 -c "
//   lead_range = range(0xa4, 0xc6)  # Big5 常用字第一字面
//   chars = set()
//   for lead in lead_range:
//       for trail in list(range(0x40,0x7f)) + list(range(0xa1,0xff)):
//           try:
//               ch = bytes([lead, trail]).decode('big5')
//               if len(ch) == 1 and ch.isprintable(): chars.add(ch)
//           except (UnicodeDecodeError, ValueError): pass
//   chars |= set('<這裡加新發現缺字的字元>')
//   open('/tmp/genryu-charset.txt','w',encoding='utf-8').write(''.join(sorted(chars)))
//   "
//   python3 -m fontTools.subset <原始完整字型檔，見下方> \
//     --text-file=/tmp/genryu-charset.txt --flavor=woff2 \
//     --output-file=app/fonts/GenRyuMin2TW-B.woff2 --glyph-names \
//     --symbol-cmap --legacy-cmap --notdef-glyph --notdef-outline \
//     --recommended-glyphs --name-IDs='*' --name-legacy --name-languages='*'
//
// 原始完整字型檔在使用者 Font Book 的 GenRyuMin2TW-B.otf，或
// GenRyuMin2-B.ttc 的第一個 face（TTC 要先用 fontTools.ttLib.TTCollection
// 讀出 face 存成獨立檔案，pyftsubset 不吃 TTC 直接帶 face index）。
export const genRyuMin = localFont({
  src: "./GenRyuMin2TW-B.woff2",
  variable: "--font-genryu",
  display: "swap",
})
