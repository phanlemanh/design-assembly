---
type: decision
title: "Cổng giữ biểu tượng mã dùng, câu chuẩn `icons` được đáp, và lối dẫn dắt khuyến nghị bộ của bộ khởi đầu"
links:
  - wiki/specs/0017-brand-assets-the-logo-and-the-icon-set.md
  - wiki/decisions/0123-the-icon-set-enters-through-the-sources-ledger.md
  - wiki/decisions/0124-the-mark-enters-through-the-sources-ledger.md
sources:
  - plugins/design-assembly/references/icon-packages.json
  - plugins/design-assembly/scripts/icon-use.mjs
  - plugins/design-assembly/scripts/icon-source.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/governance.mjs
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/skills/upgrade/SKILL.md
  - plugins/design-assembly/tests/test-icon-set-use.mjs
  - "phiên điều phối, 2026-11-26: chủ repo đáp «Mở hai lát 2» cho câu «Anh cho mở song song lát 2 của 12.1 và 12.2 («Mở hai lát 2»), hay chưa mở («Chưa mở»)?»"
---

# 0125 Cổng giữ biểu tượng mã dùng, câu chuẩn `icons` được đáp, và lối dẫn dắt khuyến nghị bộ của bộ khởi đầu

## Status

Accepted, 2026-11-26, plugin 0.72.0. Lát 2 của mục 12.1, theo đề bài
[0017](../specs/0017-brand-assets-the-logo-and-the-icon-set.md) (chủ repo duyệt ngày 2026-11-25, «Duyệt cả mười hai»)
và lời «Mở hai lát 2» ngày 2026-11-26: lát 2 của mục 12.2 dựng song song ở một nhánh khác. Lát này làm xong mục 12.1.
**Thêm một tệp tham chiếu, một phép kiểm, một dòng sổ quyết định do lệnh viết và một lối của bảng năng lực: cần người
duyệt.** Không đổi `ontology/`.

## Context

Sau lát 1 ([0123](0123-the-icon-set-enters-through-the-sources-ledger.md)), một repo ghi và ghim được bộ biểu tượng
của nó, nhưng cổng không giữ rằng mã chỉ dùng bộ ấy: một màn nhập biểu tượng từ gói khác, hay tự vẽ một thẻ `svg`, vẫn
xanh (giới hạn `icon-set-use-unheld`). Câu chuẩn `icons` của danh mục quyết định («bộ biểu tượng nào, cỡ nào, nét nào»)
vẫn không ai đáp. Và một repo chưa có bộ biểu tượng không được nói nên chọn bộ nào, dù hai mảnh của bộ khởi đầu đã
nhập một bộ.

## Decision

1. **Danh mục gói biểu tượng** là một tệp tham chiếu của plugin, `references/icon-packages.json`: tên các gói công khai
   mà mã nhập biểu tượng từ, mỗi tên một lần, theo thứ tự. Một mô-đun dưới một gói (`tên/đường`) là gói ấy. Danh mục là
   dữ liệu người sửa được; nó nêu thư viện công khai, không nêu thương hiệu nào của người dùng (câu hỏi 4 của đề bài).
2. **Phép kiểm `icon-set-use`** giữ dòng `icons` của sổ quyết định:
   `{ kind: "icon-set-use", source: "design/sources/<id>.json", sources: "<thư mục nguồn>", packages: [...] }`. Nó đỏ
   khi dòng mà quyết định trỏ tới không phải dòng `icon-set`; khi một tệp của thư mục nguồn nhập một gói của `packages`
   (hay mô-đun dưới nó) mà không dòng `icon-set` nào ghi bằng `module` hay gói của ghim; và khi một tệp vẽ (`.jsx`,
   `.tsx`) không thuộc thư viện linh kiện viết thẳng một thẻ `svg`. Tệp dưới `folder` của một dòng `icon-set` là chính
   bộ ấy, không bị đọc. Câu đỏ nêu tệp, gói, và lối sửa: dùng bộ đã ghi, cho bộ thứ hai một dòng của nó bằng
   `icon-source`, hay đặt biểu tượng bộ thiếu vào thư mục một dòng ghi. `packages` chép từ danh mục lúc phép kiểm được
   đặt.
3. **Câu chuẩn `icons` được đáp** bằng một dòng của sổ quyết định:
   `{ id: icons, layer: components, kind: standard, source: design/sources/<id>.json, check: tool:… }`, trỏ tới dòng
   nguồn và do phép kiểm ở điểm 2 giữ. `audit` đếm nó là `held` khi phép kiểm chạy, và không đếm khi phép kiểm bị gỡ
   (cổng nói «the ledger points at this tool, which holds no check for it»). Ba lệnh đặt dòng và phép kiểm, chỉ khi
   repo có dòng `icon-set` và cổng đã cài:
   - `icon-source`, khi viết dòng nguồn: đặt cả khi mã hôm nay chưa theo, và in `gate: red today: …` nêu từng chỗ;
   - `adopt`: như mọi phép kiểm của nó, chỉ đặt khi phép kiểm xanh bây giờ; không thì báo từng chỗ ở «cannot be read
     here»;
   - `upgrade`: trên repo có dòng `icon-set` mà chưa đáp `icons`; cổng đỏ sau nâng thì dừng như mọi lần, chờ
     `--accept-red-gate`.
4. **Dòng `icons` của người thì để nguyên.** Sổ quyết định đã có dòng `icons` (do người viết, giữ bằng một luật lint
   hay không gì) thì không lệnh nào ghi đè; cả ba lệnh nói: «design/decisions.yaml answers icons already: the row is left
   as it is, so the gate does not hold which icons the code uses; to have it held, take that row out and run upgrade,
   which answers icons with design/sources/<id>.json». Điểm này đến từ lượt chạy thử trên bản sao một repo thật, nơi
   một người đã viết dòng ấy.
5. **Công cụ đã cài cũ hơn phép kiểm thì không đặt nó**, theo luật lát 1 đặt (hàm `toolPredates` của
   `scripts/tool-knows.mjs`): bản sao công cụ của repo mà `check.mjs` không nêu `ICON_USE_CHECK` thì `icon-source` vẫn
   viết dòng nguồn và phép kiểm ghim như trước, không viết dòng `icons`, và nói «predates the check icon-set-use, so the
   gate does not hold yet which icons the code uses: bring the tool up with upgrade, which lays it». `upgrade` viết công
   cụ mới nên đặt được. Bài kiểm dựng bản công cụ của bản phát hành 0.71.0 từ cây git mà `references/releases.json` ghi.
6. **Lối dẫn dắt khuyến nghị một bộ.** `icon-source` không cờ nào thì không ghi gì và nói bộ được khuyến nghị: không bộ
   nào khi sổ đã có dòng `icon-set` (thoát 0); bộ mà mã đang nhập nhiều tệp nhất, khi mã đã nhập một gói của danh mục;
   không thì bộ mà các mảnh của bộ khởi đầu nhập, đọc từ `references/starter.json` và các mẫu của chúng giao với danh
   mục, không viết trong mã lệnh (tiêu chí 12). Câu kèm tệp khoá đứng đâu với gói ấy; `--recommended` viết dòng như
   `--package`, chỉ khi tệp khoá đã ghim gói. Không cài, không tải. Skill `new` gọi bước này sau khi dựng; `status` và
   `audit` không nêu nó, để repo chưa có dòng đọc như trước (tiêu chí 1).
7. **Thư mục của một bộ biểu tượng không phải thư mục của một nguồn ngoài.** Bài kiểm của lát này bắt được một lỗi của
   lát 1: phép kiểm `taken-down` đọc `folder` của mọi dòng sổ nguồn, nên một màn dùng biểu tượng trong thư mục mà một
   dòng `icon-set` ghi làm cổng đỏ, đòi bản ghi conform và dòng intake. Nay `taken-down` bỏ qua dòng `icon-set`. Repo cài
   công cụ 0.70.0 hay 0.71.0 còn đọc như cũ tới khi `upgrade`.
8. Trang luật cho tác tử (`.claude/rules/design-assembly.md`) có mục «Icons» khi dòng `icons` được giữ. Bảng năng lực có
   lối `icon-source` qua ổ tài sản thương hiệu và ổ quyết định, vì lệnh nay viết sổ quyết định.

## Consequences

- Một repo có dòng `icon-set` được giữ rằng mã chỉ lấy biểu tượng từ bộ đã ghi; một gói thứ hai cần một dòng của nó.
- Repo chưa có dòng `icon-set` không đổi: không phép kiểm, không dòng, không câu hỏi mới; bản ghi đầu ra của 0.69.0
  (lát 1) vẫn khớp.
- Lượt thử trên bản sao bỏ đi của một repo cùng họ (42 tệp nhập `lucide-react` 1.70.0, `iconLibrary` là `lucide`): dòng
  `icons` sẵn có của người làm phép kiểm không được đặt, và lệnh nói vậy; khi dòng ấy được gỡ như lệnh bảo, `upgrade`
  đặt dòng và phép kiểm, phép kiểm xanh trên mã thật (0 chỗ: tệp duy nhất có thẻ `svg` thuộc thư mục của một registry
  của thư viện linh kiện), `audit` đếm `icons` là `held`.
- Sổ giới hạn: đóng `icon-set-use-unheld`; mở và đóng cùng ngày `icon-set-folder-read-as-outside-source`; năm dòng mới
  mở: `icon-packages-copied-when-laid`, `icon-package-outside-the-list`, `icon-svg-rule-reads-every-drawing-file`,
  `icon-use-reads-written-imports`, `icon-set-recommendation-asked-not-told`. `capability-brand-assets-has-no-plug` vẫn
  mở: tiêu chí 9 (cổng giữ dấu) là của lát 2 mục 12.2, chưa trên `main`; câu của nó thu hẹp còn phần dấu.
- Mục 12.1 xong.
