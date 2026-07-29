# UI 風格規範

寫任何 UI / 元件 / 頁面之前，先讀這份文件。

## 色彩

- 深色背景為主，白色（`--foreground` / `text-white` 等級）作為文字與主要元件的顏色。
- `brand-yellow`（`--primary`，`#F6ED8E`）**只**用在需要強調的地方：
  - 主要按鈕（primary button）
  - 選中狀態（selected / active tab、radio、checkbox）
  - 進度條（progress bar）
  - 分數／重點數字（score、highlight number）
- 除了以上情境，不要把 brand-yellow 用在大面積背景、次要按鈕、裝飾性色塊上。用色要克制，一個畫面裡黃色的量應該很少、很搶眼。
- 次要層級（secondary / muted / border）用深淺不同的灰階／中性色表達，不要另外發明新的強調色。

## Layout

- Mobile-first：先寫手機版（無 prefix）的 class，再用 `sm:` `md:` `lg:` 往上加大螢幕的樣式。不要先寫桌機版再用 `max-*` 往下改。
- 版面乾淨、留白充足。寧可留白多一點，也不要把元素塞滿；用 `gap-*` / `space-y-*` / `p-*` 建立呼吸空間，不要用邊框或色塊去分隔區塊。

## 互動狀態

- hover / active / selected / disabled 用**顏色深淺、border、文字粗細**來表達，不用陰影、不用縮放動畫。
  - 例：未選中 = 中性色 border + 一般文字；選中 = brand-yellow border 或文字 + `font-medium`／`font-semibold`。
  - disabled：降低不透明度（`opacity-50`）+ `cursor-not-allowed`，不要單獨用顏色表達。
- `transition` 只用在狀態切換的基本回饋上（例如按下按鈕的顏色變化、展開／收合），時長短、無裝飾性 easing 花招。不要用 transition 做進場動畫、跳動、漂浮等裝飾效果。

## 禁止事項

- 不用 emoji。
- 不用裝飾性 icon。功能性符號（例如「返回箭頭」）在必要時可以用，但避免純裝飾用途的 icon。
- 不用漸層（`bg-gradient-*`）。
- 不用陰影（`shadow-*`）。
- 不做裝飾性動畫（進場動畫、loading 花俏效果、hover 位移/縮放等）。

## Checklist（寫 UI 前自我檢查）

- [ ] class 是不是先寫手機版，再用 `sm:` `md:` `lg:` 加大？
- [ ] 畫面裡黃色只出現在按鈕／選中／進度／分數，沒有濫用？
- [ ] 有沒有不小心用了 `shadow-*`、`bg-gradient-*`？
- [ ] 有沒有不小心加了 emoji 或裝飾性 icon？
- [ ] 互動狀態是不是用顏色深淺／border／字重表達，而不是動畫或陰影？
