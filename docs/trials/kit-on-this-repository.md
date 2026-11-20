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

### 9. Cổng Đáng hỏi lại điều kế hoạch của repo đã duyệt, mà không có thẻ hay lệnh nào để ký

Đã gặp, ở bước S0 của vòng (`/feature-loop:feature-loop 5.0`).

- **Bộ kit muốn:** mỗi hàng lộ trình mở thành một ô cơ hội (`_acceptance/bang-nang-luc-o-cam/opportunity.md`) rồi
  dừng ở **Cổng Đáng**: người quyết «có làm việc này không» (`decision: build|iterate|park|kill`), chốt ngưỡng, ký
  `decided_by`/`decided_at`. Thẻ của cổng này không dựng được: `gate-card.js --extract` thoát 2 («hồ sơ chưa có
  contract.md»). Đây là giới hạn chính bộ kit đã khai: làn thẻ cho ô đang chờ Cổng Đáng đã bị gỡ ngày 2026-09-01.
  Cũng không có lệnh nào của người ghi cổng này (`approve` là Cổng Phạm vi, `signoff` là Cổng Bằng chứng).
- **Luật của repo:** mục 5.0 đã được chủ repo duyệt hai lần ngày 2026-11-20: đề bài 0008 («Duyệt cả sáu», «Duyệt cả
  hai») và kế hoạch đặt nó ở trạng thái `doing`. Câu «có làm không» đã có lời đáp.
- **Đã làm:** dừng ở Cổng Đáng như vòng đòi. Không tự điền `decision`. Trình chủ repo một câu đóng, kèm khuyến nghị.
  Lời đáp sẽ được ghi vào ô cơ hội, kèm tên và ngày của chủ repo.
- **Chủ repo quyết:** với một repo mà kế hoạch đã duyệt từng mục, Cổng Đáng là một lượt hỏi thừa. Muốn bỏ nó thì
  phải sửa bộ kit (mở hàng thẳng vào S1 khi hàng trỏ một mục đã duyệt), không sửa ở repo này.

### 10. Prettier viết danh sách của `evals.yaml` ra dạng mà bộ đọc của bộ kit không đọc

Đã gặp, ở bước S1.

- **Bộ kit muốn:** khuôn `evals.yaml` viết danh sách một dòng (`paths: [a, b]`). Bộ đọc danh sách của bộ kit
  (`evalListsOf` trong `lib/evidence-core.cjs`) nhận danh sách một dòng hay danh sách gạch đầu dòng. Nó gọi tên và
  bỏ qua dạng «mở ngoặc không đóng trên cùng dòng».
- **Luật của repo:** `prettier --check .` phủ `.yaml`. Danh sách một dòng dài hơn 100 ký tự bị Prettier bẻ thành
  ngoặc vuông nhiều dòng, đúng dạng bộ kit không đọc. Khi ấy lượt chấm S4 sẽ thiếu `paths` và `inputs`.
- **Đã làm:** viết mọi danh sách thành dạng gạch đầu dòng. Prettier để yên dạng này. Đã kiểm `evalListsOf` đọc đủ
  danh sách của cả mười một phép đo, không cảnh báo.
- **Chủ repo quyết:** không cần quyết. Điều cần biết cho vòng sau: đừng viết danh sách một dòng trong hồ sơ của bộ
  kit ở repo này.

### 11. Skill nghĩ của Superpowers đòi người duyệt từng bước, còn vòng của bộ kit cấm hỏi ở bước ấy

Đã gặp, ở bước S1.

- **Bộ kit muốn:** S1 gọi `superpowers:brainstorming` để dựng phương án nhưng không hỏi người; mọi câu người lẽ ra
  được hỏi thành một dòng sổ có căn cứ, hoặc một câu hỏi trên thẻ Cổng Phạm vi.
- **Skill con nói:** người phải chọn cách làm, rồi duyệt bản thiết kế, trước khi có gì được dựng («HARD-GATE»).
- **Đã làm:** theo bộ kit. Nó ghi rõ cổng của skill con và Cổng Phạm vi gộp làm một, nên bản thiết kế được duyệt ở
  Cổng Phạm vi cùng hợp đồng và phép đo.
- **Chủ repo quyết:** không cần quyết. Điều cần biết: ở Cổng Phạm vi, lời duyệt của anh phủ cả bản thiết kế ở
  `docs/superpowers/specs/2026-11-20-bang-nang-luc-o-cam-design.md`.

### 12. Bộ kit ghi thư điện tử của chủ repo vào tệp được commit của một repo công khai

Đã gặp, ở bước S0 (`opportunity.md`) và S1 (`contract.md`).

- **Bộ kit muốn:** trường `owner:` của ô cơ hội và hợp đồng là `git config user.email`; bộ chống trùng tên hồ sơ so
  trường này khi mở lại.
- **Luật của repo:** repo đã công khai (quyết định 0059). Thư điện tử ấy đã có sẵn trong siêu dữ liệu tác giả của mọi
  commit, nên không lộ thêm gì mới, nhưng nay nó nằm trong nội dung tệp.
- **Đã làm:** giữ như bộ kit ghi, không tự sửa trường ấy. Theo lời phiên điều phối ngày 2026-11-20, hai tệp mang địa
  chỉ (`opportunity.md`, `contract.md` của hồ sơ) chưa được commit hay đẩy lên, và sẽ không được commit cho tới khi
  chủ repo trả lời. Đã kiểm: không tệp nào đã commit trên nhánh mang địa chỉ ấy. Lệnh duyệt Cổng Phạm vi của bộ kit
  tự commit hợp đồng, nên câu hỏi này phải được trả lời trước khi gõ lệnh duyệt.
- **Chủ repo quyết:** ngày 2026-11-20, chủ repo chọn «Giữ như kit ghi». Hồ sơ được commit sau lời đáp ấy. Muốn đổi
  về sau thì phải đổi bộ kit (cho phép một tên thay cho thư điện tử).

### 13. Bộ kit đổi tên phiên làm việc

Đã gặp, ở bước S0.

- **Bộ kit muốn:** đặt tên phiên bằng `ten_phien` của hàng («5.0 · Bảng năng lực của plugin nói… (design-assembly)»).
- **Ảnh hưởng:** phiên này được một phiên khác mở với tên «Thử kit Delivery Loop trên mục 5.0». Đổi tên không cắt
  liên kết giữa hai phiên, nhưng người đọc thanh bên thấy tên khác với tên đã giao việc.
- **Đã làm:** làm theo bộ kit, ghi ở đây.

### 14. Thẻ quyết định của bộ kit nằm trong phạm vi kiểm của Prettier

Đã gặp, ở Cổng Phạm vi.

- **Bộ kit muốn:** dựng thẻ `_acceptance/<slug>/card.html` (về sau còn `evidence-page.html`) ngay trong hồ sơ.
- **Luật của repo:** `prettier --check .` phủ `.html`; thẻ bộ kit vẽ ra lệch khuôn.
- **Đã làm:** định dạng thẻ bằng Prettier của repo trước khi commit. Thẻ chỉ là lớp trình bày, không phép kiểm nào
  của bộ kit so từng byte của nó (khác với `LO-TRINH.html`, mục 8). Mỗi lần dựng lại thẻ phải định dạng lại.
- **Chủ repo quyết:** để vậy, hay thêm `_acceptance/**/*.html` vào `.prettierignore`.

### 15. Skill viết kế hoạch của Superpowers xin người duyệt kế hoạch và chọn cách thi công; vòng T2 của bộ kit không dừng ở đó

Đã gặp, ở bước S2.

- **Skill con muốn:** người đọc kế hoạch, rồi chọn thi công bằng tác tử con hay ngay trong phiên.
- **Bộ kit nói:** ở hạng T2, S2 xong thì vào S3 ngay; chỉ hạng T3 dừng ở Gate 1.5.
- **Đã làm:** theo bộ kit, thi công ngay trong phiên, tuần tự, vì chỉ một việc của kế hoạch là độc lập.
- **Chủ repo quyết:** không cần quyết.

### 16. Lượt chấm S4 cần cây đứng yên, nên sổ va chạm không ghi được trong lúc chấm

Đã gặp, ở bước S4.

- **Bộ kit muốn:** giữa lúc sinh tham số chấm và lúc lượt chấm xong, không tệp nào được theo dõi trong vật hay thước
  của repo đổi. Đổi thì lượt ấy bị bỏ (mã 6, «cây đổi trong lượt chấm»).
- **Ảnh hưởng ở repo này:** `make check` chạy gần năm phút trong mỗi lượt. Trong lúc ấy không sửa được tệp nào, kể cả
  trang tài liệu này. Một lần trước đó, ghi tệp ở gốc repo trong lúc `make check` chạy đã làm bài kiểm cuốn sổ đỏ oan.
- **Đã làm:** soạn sổ ở thư mục tạm, chép vào repo sau khi lượt chấm xong.
- **Chủ repo quyết:** không cần quyết.

### 17. Bản ghi máy viết của bộ kit và tệp tham số chấm gặp Prettier

Đã gặp, ở lượt chấm 1.

- **Bộ kit muốn:** viết `s4-args.json` vào hồ sơ trước mỗi lượt chấm, rồi `evidence-report.md`, `review-findings.md`,
  `usage-report.md` sau lượt; bộ kiểm lại bằng chứng của bộ kit đọc chúng theo dòng.
- **Luật của repo:** `prettier --check .`. Lệnh suite `make check` của lượt 1 đỏ chỉ vì `s4-args.json` chưa định dạng;
  sau lượt 1, `evidence-report.md` và `usage-report.md` cũng lệch khuôn.
- **Đã làm:** thêm năm mẫu đường dẫn của bản ghi máy viết vào `.prettierignore`, kèm dòng chú thích. Không định dạng
  chúng, vì Prettier sẽ viết lại các khối mà bộ kit đọc từng dòng.
- **Chủ repo quyết:** nhận năm dòng bỏ qua này, cùng dòng `LO-TRINH.html` ở mục 8, hay không.

### 18. Bộ bài kiểm của plugin không chạy song song được, mà lượt chấm chạy phép đo song song với suite

Đã gặp, ở lượt chấm 1.

- **Bộ kit muốn:** chạy các phép đo máy song song, và chạy lệnh suite (`make check`) cạnh chúng.
- **Repo này có:** một giới hạn đã ghi ở mục «set aside» của kế hoạch: hai bản bài kiểm của plugin chạy cùng lúc trong
  một thư mục làm việc thì xoá tệp của nhau. E7 (`make plugin-test`) và `make check` chạy cùng lúc, và
  `test-next-build.mjs` đỏ. Chạy riêng thì 780 bài qua.
- **Đã làm:** E7 đo bằng chính lệnh suite, nên bộ kit gộp hai lần chạy làm một. Một dòng `fix` ở sổ quyết định.
- **Chủ repo quyết:** không cần quyết cho vòng này. Giới hạn chạy song song của bộ bài kiểm vẫn mở.

### 19. Các làn chấm chạy đồng thời, mà một bài kiểm của plugin đếm máy chủ trên cả máy

Đã gặp, ở lượt chấm 3. Đây là lý do vòng dừng.

- **Bộ kit muốn:** trong một lượt chấm, chạy lệnh suite ở cây đang kiểm và chạy cùng lệnh ấy ở cây gốc (làn đối chứng),
  song song.
- **Repo này có:** bài kiểm `test-next-build.mjs` (dòng 196) đòi «không còn máy chủ phát triển Next.js nào chạy» sau khi
  cuốn sổ vẽ xong. Nó đếm máy chủ trên cả máy, nên bản chạy ở cây gốc làm bản kia đỏ. Lượt 1 đỏ cùng lớp ấy (hai bản
  chạy cùng lúc). Chạy riêng một bản thì xanh: 780 bài qua ở `26dfebc`.
- **Đã làm:** dừng theo khoản «dừng vá» của bộ kit và trần ba lượt. Không sửa bài kiểm của repo, vì nó không thuộc mục
  5.0 và sửa nó ở đây là nới một phép kiểm để qua cổng.
- **Chủ repo quyết:** chọn một trong ba lối ra trên thẻ Cổng Bằng chứng. Việc thật cần làm là cho bài kiểm ấy chỉ đếm
  máy chủ do chính nó mở, một việc riêng ngoài mục 5.0.

## Số đo

Tính tới lượt chấm 3, ngày 2026-11-20.

| Thước                            | Số                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Lượt người trả lời hay gõ lệnh   | 6: gõ lệnh khởi tạo, duyệt bản nháp, Cổng Đáng, chọn lệnh suite, gõ lệnh duyệt Cổng Phạm vi, câu địa chỉ thư |
| Lượt chấm S4                     | 3, cả ba REJECT; 9, 5 và 6 phút máy                                                                          |
| Tác tử con của lượt chấm         | 18, 16 và 15; khoảng 2,2 triệu token                                                                         |
| Hạn mức tuần đã dùng             | 44% lúc mở vòng, 47% sau lượt 1                                                                              |
| make check ở 26dfebc, chạy riêng | xanh; 780 bài của plugin qua, 9 bỏ qua                                                                       |
| Va chạm ghi được                 | 19                                                                                                           |

Ba lượt đỏ không lượt nào vì sản phẩm. Lượt 1 và lượt 3: các lần chạy đồng thời giẫm lên nhau (mục 18 và 19). Lượt 2:
một chữ phải tránh mà chính lượt sửa 1 đưa vào (bài kiểm từ vựng của repo bắt được).

## Khuyến nghị: tệp nào là kế hoạch duy nhất

Khuyến nghị: giữ `docs/plan/plan.json` là kế hoạch duy nhất. `docs/plan/lo-trinh.json` chỉ là bản chép cho bộ kit chạy,
không ai sửa tay.

- `plan.json` có thứ lộ trình không có: giai đoạn, dòng «xong khi», mục đã gác lại, và lời duyệt của chủ repo.
  `make plan-check` giữ nó, kèm dòng `Plan:` của mỗi nhánh.
- Lộ trình của bộ kit suy trạng thái từ hồ sơ, nên hai tệp sẽ lệch nhau ngay khi một tệp đổi mà tệp kia không
  (mục 4). Lượt thử này giữ khớp bằng tay: mã hàng đặt bằng mã mục (`5.0`), và `plan.json` được đặt `done` trong
  cùng thay đổi.
- Nếu giữ bộ kit: thêm một công cụ của repo sinh các hàng của giai đoạn đang mở từ `plan.json` (một hàng mỗi mục, mã
  bằng mã mục), và một phép kiểm đỏ khi lộ trình có hàng không thuộc mục nào. Khi ấy Cổng Đáng là thừa với mục đã duyệt
  (mục 9); việc bỏ nó thuộc bộ kit.
- Nếu không giữ: bỏ `roadmap` khỏi `.claude/settings.json`, bỏ khoá `lo_trinh`, và chạy vòng bằng một câu mô tả mục.
  Bộ kit cho phép thế khi kho không bật luật chặn lộ trình.

Cái giá của bộ kit ở repo này, đo được ở trên: sáu lượt người tới trước Cổng Bằng chứng; mười chín va chạm; và ba lượt
chấm cùng gặp một giới hạn có sẵn của bộ bài kiểm mà `make check` chạy riêng không gặp.

## Sau khi thu phạm vi

Chủ repo chọn lối 1 («thu phạm vi»): tiêu chí 7 cũ ra Known limits, lệnh suite của lượt chấm là hai bài kiểm của mục,
ký lại Cổng Phạm vi. Lượt chấm 4 ra PENDING-JUDGMENT, không phép đo nào đỏ; Chủ repo chấm E11 «Đạt» và ký Cổng Bằng chứng ngày 2026-11-20; lưới trước-gộp của bộ kit sạch. Tổng cộng chín lượt người: sáu lượt tới Cổng Phạm vi đầu, rồi lối ra, lệnh suite mới, ký lại, và ký Cổng Bằng chứng.

### 20. Bước mở PR của bộ kit coi trang lộ trình nó tự vẽ là vật đổi sau lượt chấm

- **Bộ kit muốn:** `pr-san-sang.mjs` mở PR khi hồ sơ đã chấm; nó từ chối nếu vật đổi sau lượt chấm.
- **Đã gặp:** nó từ chối vì `LO-TRINH.html`, trang chính bộ kit vẽ lại khi ghi hồ sơ, dù trang ấy nằm trong
  `t1_skip_globs` của chính bộ kit.
- **Đã làm:** mở PR bằng `gh` theo quy trình của repo.
- **Chủ repo quyết:** không cần quyết; đây là việc của bộ kit.
