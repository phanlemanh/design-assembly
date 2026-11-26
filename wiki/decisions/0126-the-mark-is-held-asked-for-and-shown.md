---
type: decision
title: "Dấu được giữ, được hỏi và được trình bày: phép kiểm logo-use, mục logo:<id> của chủ repo, điều còn thiếu ở status và audit, trang tài sản thương hiệu của cuốn hướng dẫn"
links:
  - wiki/specs/0017-brand-assets-the-logo-and-the-icon-set.md
  - wiki/decisions/0124-the-mark-enters-through-the-sources-ledger.md
  - wiki/decisions/0123-the-icon-set-enters-through-the-sources-ledger.md
  - wiki/decisions/0125-the-gate-holds-which-icons-the-code-uses.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/owner-calls.mjs
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/vite.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/nextjs-build.mjs
  - plugins/design-assembly/scripts/logo-source.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/tool-knows.mjs
  - plugins/design-assembly/scripts/brand-assets.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/audit.mjs
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/tests/test-mark-held.mjs
  - "phiên điều phối, 2026-11-26: chủ repo đáp «Mở hai lát 2» cho câu «Anh cho mở song song lát 2 của 12.1 và 12.2 («Mở hai lát 2»), hay chưa mở («Chưa mở»)?»"
---

# 0126 Dấu được giữ, được hỏi và được trình bày

## Status

Proposed, 2026-11-26, plugin 0.73.0. Lát 2 của mục 12.2, theo đề bài
[0017](../specs/0017-brand-assets-the-logo-and-the-icon-set.md) (chủ repo duyệt ngày 2026-11-25, «Duyệt cả mười hai»),
mở song song với lát 2 của mục 12.1 theo lời chủ repo «Mở hai lát 2», và gộp sau nó
([0125](0125-the-gate-holds-which-icons-the-code-uses.md), plugin 0.72.0) theo lời chủ repo «Gộp lần lượt». Lát này làm mục 12.2 xong. Đổi hàng chờ (mục thứ
ba của chủ repo) và dữ liệu công cụ (một phép kiểm mới), nên chờ chủ repo duyệt ở PR. `ontology/` không đổi.

## Context

Lát 1 ([0124](0124-the-mark-enters-through-the-sources-ledger.md)) cho dấu một chỗ ghi và giữ ghim của nó. Còn bốn
điều đề bài đòi ở lát 2: cổng giữ rằng dấu repo dùng đến từ dòng đã ghi (tiêu chí 9); dấu là mục của chủ repo (tiêu
chí 10); `status` và `audit` nói điều còn thiếu (tiêu chí 14); cuốn hướng dẫn có trang tài sản thương hiệu (tiêu chí
15). Luật đầu tiên vẫn đứng: repo chưa có dòng nào của loại mới thì không đổi gì.

## Decision

1. **Phép kiểm `logo-use`** (tiêu chí 9), đặt dưới `ledger-shapes` cạnh `logo-pins`, chỉ khi repo có dòng `logo`. Nó
   đỏ khi biểu tượng trang mà nền dựng khai, hay ảnh mà khung ứng dụng hiện, không phải tệp của một dòng `logo`; câu đỏ
   nêu tệp, nơi khai và bước kế: «… is no file of a logo row: add it to the row with logo-source --into logo, or …».
   Biểu tượng trang khai bằng địa chỉ ngoài repo cũng đỏ, vì không dòng nào ghim được nó.
2. **Khung ứng dụng là gì do bộ chuyển của nền dựng nói** (hàm mới `frameFiles`), như biểu tượng trang (`markFiles`)
   ở lát 1. Một nền: các tệp nằm ngay dưới `src/`, đúng định nghĩa khung mà phép kiểm điều hướng đã dùng; màn nằm sâu
   hơn, không phải khung. Nền kia: các tệp `layout` của bộ định tuyến, và các mô-đun của repo mà chúng nhập, một bậc
   xuống (khung thường được vẽ ở đó). Ảnh của khung là ảnh nó nhập bằng đường dẫn (tương đối, hay `@/`), hay địa chỉ từ
   gốc trang trỏ vào thư mục công khai. Thứ không dẫn tới tệp nào của repo thì không đọc. Lý do chỉ một bậc: đi sâu hơn
   thì mọi màn đều thành «khung» và mọi hình minh hoạ đều đỏ; điều chưa đọc ghi ở giới hạn `logo-use-frame-read-narrowly`.
3. **Mục `logo:<id>` của hàng chờ** (tiêu chí 10), mục thứ ba của chủ repo sau kiểu màn và màu thương hiệu. `decide
--ask --item logo:<id>` nhận nó và bảo **dừng**. Tường `owner-calls` so sổ nguồn ở gốc nhánh với bây giờ: dòng `logo`
   mới, hay dòng có tệp (tệp cùng mã băm) khác gốc, làm cổng đỏ cho tới khi hàng chờ có lời chủ repo giữ đúng mục ấy.
   Dòng chỉ đổi lời (giấy phép chẳng hạn) không phải dấu mới. Mục mang id của dòng như đề bài viết; vì thế lời đã giữ
   đứng cho cả lần đổi tệp sau của cùng dòng (giới hạn `logo-owner-answer-stands-for-later-changes`).
4. **Công cụ đã cài cũ hơn thì không viết gì nó đọc không được**, theo nếp của 0123 và 0124, cùng hàm `toolPredates`
   (thêm tham số `what` để câu nói «question» thay vì «row»). Hàng chờ cũ đọc một mục lạ là hỏng, nên `decide --ask
--item logo:<id>` hỏi bản chép `waiting.mjs` có `logoItem` không; không có thì từ chối, thoát 2, nêu `upgrade`
   trước. `logo-source` (và `adopt`, qua cùng hàm) hỏi bản chép `check.mjs` có `LOGO_USE_CHECK` không; không có thì
   chỉ đặt `logo-pins` và nói `upgrade` sẽ đặt `logo-use`. `upgrade` và lối dẫn dắt đặt cả hai khi repo có dòng.
   Bài kiểm dùng đúng bản công cụ 0.71.0 và 0.72.0 dựng từ cây git mà `references/releases.json` ghi.
5. **`logo-source --into <id>`** thêm tệp vào một dòng đã có, mỗi tệp băm tại chỗ; mọi tệp và mọi lời dòng đang có giữ
   nguyên, tệp đã ghim thì bị từ chối. Đây là bước kế mà câu đỏ của `logo-use` và dòng còn thiếu nêu. Lệnh không ghi
   đè thứ gì dòng đã nói, nên lời tiêu chí 4 («không ghi đè») vẫn đúng; thêm tệp là đổi dấu, nên tường hỏi chủ repo.
   Cả `logo-source` lẫn `--into` nay in thêm bước «a new mark, or a changed file of one, is the owner's call: ask with
   decide --ask --item logo:<id>».
6. **Điều còn thiếu ở `status` và `audit`** (tiêu chí 14), không đổi mã thoát, không làm cổng đỏ: dấu chưa có biến thể
   `mono`, dấu chưa có tệp vai `favicon`, bộ biểu tượng chưa ghi `sizes`. Mỗi dòng nêu bước kế (`logo-source --into`,
   hay viết `sizes` bằng tay vì đó là lời người, câu hỏi 12 của đề bài). Mã đọc nằm ở `scripts/brand-assets.mjs`; với
   `--json` có khoá `brand_gaps`, chỉ khi có điều thiếu. Tài liệu `audit` có thêm một ghi chú.
7. **Trang tài sản thương hiệu của cuốn hướng dẫn** (tiêu chí 15): dấu theo vai và biến thể, mỗi tệp vẽ từ chính byte
   của tệp đã ghim (nhúng vào trang, không qua dữ kiện của sổ, vì dữ kiện không bao giờ giữ hình); bộ biểu tượng với cỡ,
   nét, điều dòng ghim, giấy phép hay «licence not written yet». Repo có bộ biểu tượng mà chưa có dòng `logo` thì trang
   nói dấu là chữ của sàn; repo có dấu mà chưa có bộ biểu tượng thì trang nói chưa ghi. Repo không có dòng nào của hai
   loại: dữ kiện không có khoá `brand`, sổ không có trang (tiêu chí 1). Trang đánh số 08, trang kết thành 09.

## Consequences

- Mục 12.2 xong. Bản ghi «không dấu» của 0.69.0 (`tests/helpers/no-mark-on-0.69.0.json`) vẫn khớp trên bốn loại repo.
- Đóng hai dòng giới hạn: `mark-owner-call-not-held`, `mark-gaps-unsaid`. Mở năm dòng:
  `logo-owner-answer-stands-for-later-changes`, `logo-use-frame-read-narrowly`, `logo-use-other-builds-unread`,
  `mark-used-outside-the-frame-unheld` (tiêu chí 22 đòi ghi), `icon-set-sizes-written-by-hand`.
- `capability-brand-assets-has-no-plug` **đóng** (tiêu chí 22): trên cây đã gộp lát 2 của mục 12.1, tiêu chí 7 (phép
  kiểm `icon-set-pin` và `logo-pins`), 8 (`icon-set-use`, [0125](0125-the-gate-holds-which-icons-the-code-uses.md)) và
  9 (`logo-use`) cùng xanh, mỗi phép có bài kiểm làm hỏng. Ổ cắm tài sản thương hiệu thôi trỏ tới dòng giới hạn; hai
  mặt của nó nói cả phông, bộ biểu tượng và dấu. Điều các phép kiểm chưa thấy nằm ở các dòng mở: gói biểu tượng ngoài
  danh mục, cỡ và nét khi dùng, dấu dùng ngoài khung ứng dụng.
- Chạy thử trên bản sao bỏ đi của một repo hàng xóm (khung ứng dụng hiện ảnh dấu từ thư mục công khai): dòng chỉ có
  tệp khoá ngang thì cổng đỏ đúng một câu, nêu tệp dấu mà khung hiện; thêm tệp ấy bằng `--into` thì câu ấy hết; sổ có
  trang 08 với hai tệp theo vai và biến thể. Ghi ở PR.
