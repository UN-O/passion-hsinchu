import localFont from "next/font/local"

// 饅頭黑體（MantouSans），用在營會守則的標題／守則標籤、三區標題、小隊
// 名稱上。
//
// 原本只抽「當下文案實際用到的字」，2.6MB 壓到 ~2KB——但小隊名稱、三區
// 名稱都是會一直加新字的動態內容（見 app/fonts/gen-ryu-min.ts 同樣的
// 考量，那邊的「早」「晨」「凱」「曦」缺字也是同一種成因），改成收 Big5
// 常用字（第一字面，5338 字）＋原本文案用字的聯集，2.6MB 壓到 ~751KB。
// 之後如果又發現缺字（表示那個字冷僻到連常用字表都沒收），把下面指令的
// chars 那行加上新字、重新跑一次：
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
//   open('/tmp/mantou-charset.txt','w',encoding='utf-8').write(''.join(sorted(chars)))
//   "
//   python3 -m fontTools.subset <原始完整字型檔，使用者 Font Book 的
//     MantouSans-Regular.ttf> --text-file=/tmp/mantou-charset.txt \
//     --flavor=woff2 --output-file=app/fonts/MantouSans-Regular.woff2 \
//     --glyph-names --symbol-cmap --legacy-cmap --notdef-glyph \
//     --notdef-outline --recommended-glyphs --name-IDs='*' --name-legacy \
//     --name-languages='*'
export const mantouSans = localFont({
  src: "./MantouSans-Regular.woff2",
  variable: "--font-mantou",
  display: "swap",
})
