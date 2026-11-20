# Chạy mục 5.0 bằng bộ Delivery Loop: sổ va chạm

Lượt thử bắt đầu ngày 2026-11-20, trên nhánh `claude/kit-trial-5-0`, cắt từ `main` ở `ae8d9dd`. Chủ repo duyệt lượt
thử bằng câu «Có, thử trên 5.0».

Câu hỏi của lượt thử: chạy kế hoạch của repo này theo cách chủ repo chạy lộ trình ở các repo khác thì vướng ở đâu.
Bộ kit là Delivery Loop bản 3.0.0, ba gói cài ở phạm vi repo: `acceptance-gate`, `feature-loop`, `roadmap`. Việc
được chạy qua bộ kit là mục 5.0 của kế hoạch, theo đề bài
[0008](../../wiki/specs/0008-capabilities-sockets-and-plugs.md).

## Cách ghi

Mỗi mục là một chỗ bộ kit và luật của repo này kéo về hai phía. Mỗi mục có bốn dòng: bộ kit muốn gì, luật của repo
nói gì, đã làm gì, và chủ repo phải quyết điều gì. Không va chạm nào được gỡ bằng cách nới cổng của repo này hay sửa
bộ kit.

Mỗi mục ghi rõ nó là **đã gặp** (có lệnh và đầu ra) hay **đo trước** (đo ở thư mục tạm, chưa xảy ra trong repo).

## Trạng thái gốc, trước khi bộ kit ghi gì

- `make check` trên `main` ở `ae8d9dd` cộng đúng một thay đổi chưa commit: việc cài ba gói ở phạm vi repo.
- Kết quả của `make -k check`: đỏ ở `lint`, vì mục 1 dưới đây. Mọi đích còn lại xanh: typecheck, 102 bài kiểm của
  ứng dụng, wiki-lint (0 lỗi, 1 cảnh báo đã có từ trước về độ dài `wiki/index.md`), 39 quyết định giữ bằng 48 phép
  kiểm, 76 bài kiểm trình duyệt, plan-check, 770 bài kiểm của plugin (9 bỏ qua), plugin bản 0.18.0.

## Các va chạm

### 1. Cài gói ở phạm vi repo viết lại `.claude/settings.json` lệch khuôn của Prettier

Đã gặp, trước bước khởi tạo.

- **Bộ kit muốn:** lệnh cài gói ghi `enabledPlugins` vào `.claude/settings.json`. Nó ghi lại cả tệp theo khuôn của
  nó, nên mảng `ask` đang nằm một dòng bị bẻ thành bốn dòng.
- **Luật của repo:** `make lint` chạy `prettier --check .`; tệp này nằm trong phạm vi kiểm.
- **Đã làm:** đợi bước khởi tạo chạy xong (bước 5b cũng ghi tệp này), rồi định dạng tệp bằng Prettier của repo. Nội
  dung không đổi, chỉ đổi cách xuống dòng.
- **Chủ repo quyết:** không cần quyết gì cho lần này. Điều cần biết: mỗi lần một công cụ ghi lại tệp này (bước 5b
  của lệnh khởi tạo cũng ghi) thì phải chạy `make format` rồi mới commit. `.repo-setup.json` giữ mã băm của tệp
  này, nên Repo Standards sẽ thấy nó khác bản nó đặt.

### 2. Bộ tệp cổng CI mà lệnh khởi tạo gợi ý chép vào repo không qua được `make lint`

Đo trước, ở thư mục tạm, bằng cấu hình ESLint và Prettier của repo này.

- **Bộ kit muốn:** chép các tệp của cổng gộp vào `scripts/` và `lib/` ở gốc repo, giữ nguyên từng byte (bộ kit so
  bản chép với bản gốc và gọi chỗ khác là lệch), rồi thêm một bước vào luồng CI gọi `scripts/pre-merge-check.sh`.
- **Luật của repo:** `eslint .` và `prettier --check .` quét cả gốc repo. Chỉ `tools/**/*.mjs` được khai là mã Node.
  Cài đặt của dự án cấm sửa `.github/workflows/`.
- **Số đo:** 21 tệp mã của bộ chép (bản cơ sở cộng phần lộ trình) cho 365 lỗi ESLint, và cả 21 tệp lệch khuôn
  Prettier.
- **Đã làm:** chưa chép gì. Khuyên chủ repo đáp «chưa chép» ở bước ấy của lệnh khởi tạo trong lượt thử này.
- **Chủ repo quyết:** nếu muốn cổng gộp của bộ kit chạy trong CI của repo này thì chọn một trong ba: (a) thêm thư
  mục chép vào danh sách bỏ qua của ESLint và Prettier, tức là đổi phạm vi của cổng repo; (b) không chép, gọi cổng
  từ gói đã cài qua một đích trong `mk/`, và CI phải có gói; (c) không chạy cổng gộp của bộ kit trong CI, chỉ dùng
  nó ở máy.

### 3. Bước khai gói của lệnh khởi tạo khai thêm hai gói và một nguồn chợ mà repo này chưa chọn

Đo trước, bằng chính script của bộ kit ở chế độ chạy khô (`plugin-declare.mjs --root .`, không có `--write`).

- **Bộ kit muốn:** bước 5b khai ở `.claude/settings.json` bốn gói: `acceptance-gate`, `feature-loop`,
  `diagram-design`, `superpowers`. Nó cũng thêm `extraKnownMarketplaces` trỏ tới kho GitHub của bộ kit.
- **Luật của repo:** «hỏi trước khi cài một gói». Repo này đã công khai (quyết định 0059), nên mọi người mở repo sẽ
  được nhắc cài các gói ấy. `diagram-design` không có trong ba gói phiên điều phối đã cài.
  `.repo-setup.json` giữ mã băm của tệp này.
- **Đã làm:** chủ repo chọn «Duyệt theo khuyến nghị» ngày 2026-11-20, nên bước 5b không chạy và tệp chỉ có ba gói
  phiên điều phối đã cài. Bộ tệp cổng CI (mục 2) cũng không chép.
- **Chủ repo quyết:** sau lượt thử, khai gói ở phạm vi repo cho mọi người hay để mỗi người tự cài. Ba dòng
  `enabledPlugins` hiện có cũng là một quyết định như vậy, và chúng sẽ vào PR.

### 4. Hai kế hoạch: `plan.json` và tệp lộ trình mà bước 5d sẽ đặt cạnh nó

Đo trước, bằng cách đọc script `lo-trinh-khoi-tao.mjs` của bộ kit.

- **Bộ kit muốn:** khi `.claude/settings.json` bật `roadmap@delivery-loop` (đã bật), bước 5d tạo một lộ trình rỗng
  ở `docs/plan/lo-trinh.json`, khai khoá `lo_trinh.tep`, miễn trừ `LO-TRINH.html` và vẽ trang ấy. Trạng thái của
  mỗi hàng do máy suy từ hồ sơ trong `_acceptance/`, không ai ghi tay.
- **Luật của repo:** kế hoạch chính thức là `docs/plan/plan.json`, chủ repo duyệt. Nó có giai đoạn, dòng «xong
  khi», trạng thái mục ghi tay, và `make plan-check` giữ nó. Mỗi nhánh nêu mục nó phục vụ bằng dòng `Plan:`.
- **Đã làm:** bước 5d chạy, thoát 0. Nó khai `lo_trinh.tep: docs/plan/lo-trinh.json`, thêm `LO-TRINH.html` vào
  `t1_skip_globs`, tạo lộ trình rỗng mang tên «Lộ trình design-assembly», vẽ `PRODUCT-MAP.md` và `LO-TRINH.html` ở
  gốc repo. `make plan` không đọc tệp mới, và `make plan-check` không biết nó có. Hai tệp nằm cạnh nhau trong
  `docs/plan/` mà không tệp nào trỏ tới tệp kia.
- **Chủ repo quyết:** cuối lượt thử, tệp nào là kế hoạch duy nhất. Khuyến nghị nằm ở cuối trang.

### 5. Hồ sơ và trang máy vẽ của bộ kit nằm trong phạm vi kiểm của `make lint`

Đo trước, theo cách hai cổng đọc cây thư mục.

- **Bộ kit muốn:** ghi `_acceptance/config.yaml`, `_acceptance/README.md`, hồ sơ từng tính năng dưới
  `_acceptance/<slug>/`, và có thể vẽ `LO-TRINH.html`, `PRODUCT-MAP.md`. Hook của bộ kit đọc `config.yaml` từng dòng,
  và cổng gộp của nó so mã băm của hồ sơ đã ký.
- **Luật của repo:** `prettier --check .` kiểm cả `.md`, `.yaml`, `.json` và `.html` ở mọi thư mục không nằm trong
  `.prettierignore`. `make format` sẽ viết lại các tệp ấy.
- **Rủi ro:** nếu định dạng lại một hồ sơ sau khi ký, cổng của bộ kit sẽ coi bằng chứng đã cũ; nếu không định dạng,
  `make lint` đỏ.
- **Đã làm:** sẽ đo sau bước khởi tạo.

### 6. Hai ổ cắm thiết kế của bộ kit chưa cắm được plugin của chính repo này

Đã gặp, ở bản nháp cấu hình của lệnh khởi tạo.

- **Bộ kit muốn:** `feature_loop.ui_standards_skill` (S1 nạp làm chuẩn nội) và `design_pass.ds_skill` (nghi thức
  thiết kế nạp làm nguồn luật) là tên một skill đã nạp trong phiên.
- **Repo này có:** mười một skill của plugin ở `plugins/design-assembly/skills/` (`new`, `adopt`, `audit`, `status`,
  `handoff`…) và trang luật `.claude/rules/ui.md`. Nhưng plugin không được cài trong phiên của chính repo này, nên
  không skill nào của nó có tên để khai. Trang luật không phải là skill.
- **Đã làm:** để trống cả hai ổ trong bản nháp, đánh dấu `# cần anh`. Mục 5.0 không dựng màn nào, nên trống không
  chặn lượt thử.
- **Chủ repo quyết:** muốn plugin này làm phích cho hai ổ ấy thì cần một skill chuẩn của plugin mà bộ kit gọi được
  bằng tên. Đây đúng là ý của đề bài 0008: Design Assembly cũng là phích của người khác. Việc ấy thuộc giai đoạn 6.

### 7. Prettier đổi hình của `_acceptance/config.yaml` mà bộ kit đọc từng dòng

Đã gặp, sau bước khởi tạo.

- **Bộ kit muốn:** khuôn config đặt chú thích đuôi canh cột, nối dài sang các dòng dưới. Hook và cổng gộp đọc tệp
  từng dòng: `gap_probe:`, `recheck:` phải có giá trị trên cùng một dòng.
- **Luật của repo:** `prettier --check .` phủ cả `.yaml`. Định dạng khuôn ấy thì Prettier đẩy `advisory` và
  `strict` xuống dòng sau. Đó vẫn là YAML hợp lệ, nhưng bộ đọc từng dòng của bộ kit sẽ thấy giá trị rỗng.
- **Đã làm:** viết lại tệp theo hình Prettier không đổi: mỗi chú thích đứng riêng một dòng trên khoá của nó. Đã
  kiểm bộ đọc danh sách của bộ kit (`configList` trong `lib/workspace-record.cjs`) đọc đủ năm dòng miễn trừ và hai
  đường T3, và `product-map.mjs --check` vẫn xanh.
- **Chủ repo quyết:** không cần quyết. Điều cần biết: bộ kit sẽ ghi thêm vào tệp này ở bước S4
  (`config-patch.mjs`); sau mỗi lần ấy phải chạy `make lint` trước khi commit.

### 8. `LO-TRINH.html`: hai cổng khoá nhau

Đã gặp, sau bước khởi tạo.

- **Bộ kit muốn:** `product-map.mjs --check` đòi trang lộ trình khớp từng byte với bản nó vẽ, và nó vẽ lại trang ấy
  ở mỗi cổng người ký.
- **Luật của repo:** `prettier --check .` đòi định dạng lại trang ấy. Đã thử: định dạng xong thì phép kiểm của bộ
  kit đỏ («`LO-TRINH.html` lệch với tệp ý định và hồ sơ»).
- **Đã làm:** trả trang về bản bộ kit vẽ, và thêm `LO-TRINH.html` vào `.prettierignore`, kèm một dòng chú thích nói
  vì sao. Repo đã làm như vậy với tệp máy sinh khác (`src/generated/`, `CHANGELOG.md`). Đây là thu hẹp phạm vi của
  Prettier một tệp; trang ấy vẫn được giữ từng byte, nhưng bởi lệnh của bộ kit, và lệnh ấy **không** nằm trong
  `make check` hay CI (mục 2).
- **Chủ repo quyết:** nhận dòng bỏ qua này hay không. `.prettierignore` là tệp Repo Standards đặt và giữ mã băm
  trong `.repo-setup.json`, nên `repo-setup:doctor` sẽ thấy nó khác. `PRODUCT-MAP.md` hôm nay qua Prettier, nhưng
  cũng do bộ kit vẽ lại ở mỗi cổng, nên có thể gặp đúng chuyện này khi có hàng.

## Số đo

Điền khi lượt thử chạy.

## Khuyến nghị: tệp nào là kế hoạch duy nhất

Viết khi lượt thử xong.
