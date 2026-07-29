export type ConferenceItem = {
  id: string
  label: string
}

export type ConferenceCategory = {
  key: "A" | "B" | "C" | "D"
  label: string
  items: ConferenceItem[]
}

export const conferenceCategories: ConferenceCategory[] = [
  {
    key: "A",
    label: "心裡面的各種內耗",
    items: [
      { id: "accept-imperfection", label: "面對自己的不夠好" },
      { id: "admit-mistakes", label: "承認錯誤" },
      { id: "forgive-others", label: "原諒傷害自己的人" },
    ],
  },
  {
    key: "B",
    label: "要繼續往前走",
    items: [
      { id: "leave-comfort-zone", label: "離開穩定舒適圈" },
      { id: "face-unknown", label: "面對未知的下一步" },
      { id: "face-failure", label: "面對挫折與失敗" },
    ],
  },
  {
    key: "C",
    label: "與人相處的時刻",
    items: [
      { id: "express-love", label: "即時表達愛" },
      { id: "enter-relationship", label: "進入一段關係" },
      { id: "leave-relationship", label: "離開一段關係" },
      { id: "say-no", label: "勇敢說不" },
    ],
  },
  {
    key: "D",
    label: "活出真實的信仰",
    items: [
      { id: "hold-faith-principles", label: "堅持信仰的原則" },
      { id: "submit-to-god", label: "順服神的帶領" },
      { id: "time-for-god", label: "把時間留給神" },
    ],
  },
]

export type VersePrayerContent = {
  itemId: string
  verse: string
  verseRef: string
  // 內含字面 "{}"，實際使用時替換成使用者姓名去掉第一個字
  prayerTemplate: string
}

export const versePrayerContent: VersePrayerContent[] = [
  {
    itemId: "accept-imperfection",
    verse: "祂對我說：我的恩典夠你用的，因為我的能力是在人的軟弱上顯得完全。",
    verseRef: "哥林多後書 12:9a",
    prayerTemplate:
      "親愛的主啊，當 {} 因自己的不完美而沮喪時，求祢讓 {} 看見祢毫無保留的接納。求祢使 {} 安息在祢夠用的恩典中，不再定罪自己，靠祢重新得力。奉主耶穌的名求，阿們。",
  },
  {
    itemId: "admit-mistakes",
    verse: "我們若認自己的罪，上帝是信實的，是公義的，必要赦免我們的罪，洗淨我們一切的不義。",
    verseRef: "約翰一書 1:9",
    prayerTemplate:
      "滿有憐憫的上帝，求祢賜 {} 誠實面對錯誤的勇氣，不再掩飾與藉口。當 {} 謙卑俯伏認錯時，求祢赦免 {}，並賜下智慧去修補破口，重新恢復與人、與祢的關係。奉主耶穌名求，阿們。",
  },
  {
    itemId: "forgive-others",
    verse: "並要以恩慈相待，存憐憫的心，彼此饒恕，正如上帝在基督裡饒恕了你們一樣。",
    verseRef: "以弗所書 4:32",
    prayerTemplate:
      "親愛的天父，受傷的痛苦雖然真實地存在，但 {} 選擇順服祢，放下心中的怨恨。求祢醫治 {} 的心，賜下力量去饒恕那傷害 {} 的人，不再讓過去的陰霾囚禁 {} 的未來。奉主耶穌名求，阿們。",
  },
  {
    itemId: "leave-comfort-zone",
    verse: "耶和華對亞伯蘭說：你要離開本地、親族、父家，往我所要指示你的地去。",
    verseRef: "創世記 12:1",
    prayerTemplate:
      "愛 {} 的主，離開熟悉的環境難免感到不安，但深信祢必親自領路。求祢賜下亞伯拉罕般的信心與勇氣，讓 {} 能勇敢踏出這一步，在未知中經歷祢豐富的預備。奉主耶穌名求，阿們。",
  },
  {
    itemId: "face-unknown",
    verse: "祢話是我腳前的燈，是我路上的光。",
    verseRef: "詩篇 119:105",
    prayerTemplate:
      "親愛的上帝，面對未來的迷茫，{} 心中難免有恐懼。求祢賜下信心，讓 {} 不是看著環境，只定睛在祢的身上。請作 {} 腳前的燈，指引跨出每一步，深信祢的恩手必一路牽引。奉主耶穌的名求，阿們。",
  },
  {
    itemId: "face-failure",
    verse: "因為，義人雖七次跌倒，仍必興起；惡人卻被災禍傾倒。",
    verseRef: "箴言 24:16",
    prayerTemplate:
      "掌管明天的主，當挫折與失敗讓 {} 心灰意冷時，求祢聖靈親自的安慰。求祢打開 {} 屬靈的眼睛，看見這是磨練信心的過程。賜下重新站立的勇氣，宣告在祢裡面仍有盼望。奉主耶穌名求，阿們。",
  },
  {
    itemId: "express-love",
    verse: "我們相愛，不要只在言語和舌頭上，總要在行為和誠實上。",
    verseRef: "約翰一書 3:18",
    prayerTemplate:
      "愛 {} 的上帝，求祢賜下敏銳的心與勇氣，讓 {} 不推遲、不退縮，在當下就向身邊的人表達關心與愛意。讓 {} 的愛化為具體的行動，溫暖需要的人。奉主耶穌的名求，阿們。",
  },
  {
    itemId: "enter-relationship",
    verse: "兩個人總比一個人好，因為二人勞碌同得美好的果效。",
    verseRef: "傳道書 4:9",
    prayerTemplate:
      "主啊，祢是看重關係的！感謝祢為 {} 預備同行的夥伴。當準備進入新關係時，求祢賜下真誠、敬畏的心，叫他們能彼此建造、共同成長，在愛中活出祢美好的心意。奉主耶穌的名求，阿們。",
  },
  {
    itemId: "leave-relationship",
    verse: "尋找有時，失落有時。保守有時，捨棄有時。",
    verseRef: "傳道書 3:6",
    prayerTemplate:
      "慈愛的天父，轉身離開一段關係是艱難且痛苦的。求祢安慰 {} 的哀慟，撫平遺憾。賜下放手的勇氣與平靜，將未來交託，深信祢會擦乾眼淚，領 {} 走向新生的季節。奉主耶穌名求，阿們。",
  },
  {
    itemId: "say-no",
    verse: "你們的話，是，就說是；不是，就說不是；若再多說，就是出於那惡者。",
    verseRef: "馬太福音 5:37",
    prayerTemplate:
      "掌管 {} 生命的主，求祢挪去取悅人的壓力和懼怕。賜下智慧與勇氣，讓 {} 在該拒絕時溫和而堅定地說「不」，好守護心靈的界線，專注在祢的呼召中。奉主耶穌名求，阿們。",
  },
  {
    itemId: "hold-faith-principles",
    verse: "不要效法這個世界，只要心意更新而變化，叫你們察驗何為上帝的善良、純全、可喜悅的旨意。",
    verseRef: "羅馬書 12:2",
    prayerTemplate:
      "親愛的天父，在洪流般的世代中要持守真理並不容易。求祢賜給 {} 屬天的膽量與智慧，使 {} 不隨波逐流，不向世俗妥協，能以生命見證祢的公義，對準祢永恆的價值。奉主耶穌名求，阿們。",
  },
  {
    itemId: "submit-to-god",
    verse: "不要照我的意思，只要照祢的意思。",
    verseRef: "馬太福音 26:39c",
    prayerTemplate:
      "主啊，因祢的道路高過人的道路，當 {} 的計畫與祢的意念互相衝突時，求祢降伏那顆驕傲的心。願 {} 效法主耶穌的順服，放下個人的籌算與掌控，將主權全然交託給祢。奉主耶穌名求，阿們。",
  },
  {
    itemId: "time-for-god",
    verse: "你們要休息，要知道我是上帝！",
    verseRef: "詩篇 46:10a",
    prayerTemplate:
      "與我們同在的主啊，在忙碌紛擾的生活中，求祢穩住 {} 焦躁的腳步。求祢赦免 {} 常將祢推擠到角落，幫助 {} 奪回時間的主權，天天進入內室，專心尋求祢的面並重新得力。奉主耶穌名求，阿們。",
  },
]

export function getVersePrayerContent(itemId: string): VersePrayerContent | undefined {
  return versePrayerContent.find((entry) => entry.itemId === itemId)
}

export function getCategoryForItem(itemId: string): ConferenceCategory | undefined {
  return conferenceCategories.find((category) => category.items.some((item) => item.id === itemId))
}

// TODO: 使用者尚未提供實際工作坊清單，先放合理佔位文案
export const conferenceWorkshops: { title: string; body: string }[] = [
  { title: "工作坊一", body: "工作坊詳細內容尚待補充。" },
  { title: "工作坊二", body: "工作坊詳細內容尚待補充。" },
  { title: "工作坊三", body: "工作坊詳細內容尚待補充。" },
]
