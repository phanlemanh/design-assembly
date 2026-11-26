---
type: decision
title: "Bộ biểu tượng vào sổ nguồn bằng loại `icon-set`, và cổng giữ ghim của nó"
links:
  - wiki/specs/0017-brand-assets-the-logo-and-the-icon-set.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0081-a-font-enters-through-the-sources-ledger.md
sources:
  - plugins/design-assembly/scripts/icon-source.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/shadcn.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/tests/test-icon-set-source.mjs
  - plugins/design-assembly/tests/helpers/brand-free.mjs
  - plugins/design-assembly/tests/helpers/brand-free-on-0.69.0.json
  - "phiên điều phối, 2026-11-26: chủ repo đáp «Mở hai lát» cho câu «Anh cho mở lát 1 của 12.1 («Dựng lát 1»), hay mở song song cả lát 1 của 12.1 và 12.2 («Mở hai lát»)?»"
---

# 0123 Bộ biểu tượng vào sổ nguồn bằng loại `icon-set`, và cổng giữ ghim của nó

## Status

Accepted, 2026-11-26, plugin 0.70.0. Lát 1 của mục 12.1, theo đề bài
[0017](../specs/0017-brand-assets-the-logo-and-the-icon-set.md) (chủ repo duyệt ngày 2026-11-25, «Duyệt cả mười hai»)
và lời «Mở hai lát» ngày 2026-11-26: lát 1 của mục 12.2 (loại `logo`) dựng song song ở một nhánh khác, cùng sửa phần
sổ nguồn của hợp đồng. **Đổi hợp đồng sổ, cần người duyệt.** Không đổi `ontology/`.

## Context

Ổ tài sản thương hiệu có một phích của plugin, `font-source`, và chỉ cho font
([0081](0081-a-font-enters-through-the-sources-ledger.md)). Bộ biểu tượng không có chỗ ghi: một repo nhập một gói biểu
tượng mà sổ không biết, không gì ghim phiên bản của nó, và không gì báo khi phiên bản đổi. Đề bài 0017 đặt lát 1 của
mục 12.1 là: loại nguồn `icon-set` trong hợp đồng; lệnh viết dòng; lối nhận đề xuất; cổng giữ ghim.

## Decision

1. **Loại nguồn `icon-set`** vào sổ nguồn, bên cạnh thư viện, font và lõi. Số phiên bản của sổ vẫn là 1. Dòng có
   `version`, `id`, `kind`, không có `catalog` (bộ biểu tượng không phải kho khối); có thể có `title`, `module` (mô-đun
   mã nhập biểu tượng từ, là tên gói khi bộ là một gói), `folder` (thư mục giữ tệp biểu tượng của chính repo),
   `sizes` (danh sách số, cỡ bằng px) và `stroke` (số, độ dày nét). Hai điều bắt buộc như font: `pin` nằm ngay trong
   dòng (`package` và `version` tệp khoá ghim, hoặc `files`, mỗi tệp kèm `sha256`) và `licence` bằng lời người; dòng do
   lệnh viết ghi `proposed` và chờ giấy phép mà không làm hỏng hình dạng. `own: true` nói repo đã dùng bộ ấy trước khi
   có dòng.
2. **Lệnh `icon-source`** viết dòng từ một gói tệp khoá ghim (`--package`) hay từ một thư mục tệp của repo
   (`--folder`, mọi tệp không ẩn bên dưới, băm tại chỗ). Không tải, không cài: gói tệp khoá không ghim, thư mục ngoài
   repo hay không có tệp, đều không có dòng. Không ghi đè dòng đã có, và không viết dòng thứ hai cho một gói đã có dòng
   ghim. Mã thoát 1 khi dòng được viết, vì giấy phép chờ người.
3. **Lối nhận đề xuất.** `adopt` đọc `iconLibrary` trong cài đặt của thư viện linh kiện (`components.json`), đổi chữ ấy
   ra tên gói theo bảng của bộ chuyển thư viện ấy (bốn chữ: lucide, radix, tabler, phosphor), và khi tệp khoá ghim gói
   thì đề xuất dòng `own: true`. Dòng đã có thì để nguyên. Chữ lạ, hay repo không có tệp khoá công cụ đọc được, vào mục
   «cannot be read here» kèm câu «người viết dòng bằng `icon-source`», và không đổi mã thoát; tệp khoá có mà không ghim
   gói thì vào «needs a person». Không tệp nào của repo bị sửa.
4. **Cổng giữ ghim** bằng phép kiểm mới `icon-set-pin`, đặt dưới dòng `ledger-shapes` chỉ khi repo đã có dòng
   `icon-set`: bởi `icon-source` khi nó viết dòng, bởi `adopt` ở lần đầu đặt dòng `ledger-shapes`, bởi `upgrade` khi
   thiếu. Tệp khoá ghim phiên bản khác hay không ghim gói, hay một tệp lệch mã băm, làm cổng đỏ, câu đỏ nêu dòng.
   Dòng thiếu ghim, hay thiếu giấy phép mà không do lệnh đề xuất, làm `ledger-shapes` đỏ.
5. **`status` hỏi giấy phép** của dòng do lệnh viết (`icon-set-licence-<id>`), như với font, và không bao giờ điền thay.
6. **Repo chưa có dòng nào của loại mới không đổi gì.** Bản ghi đầu ra của plugin 0.69.0 trên bốn loại repo (chưa có
   sổ, đã nhận, do lối dẫn dắt dựng, không có Makefile) được giữ trong bài kiểm, và `status`, `audit`, `new --dry-run`,
   `adopt --dry-run` và cổng in đúng như thế sau lát này.
7. Bảng năng lực có phích thứ hai ở ổ tài sản thương hiệu, `icon-source`; giới hạn `capability-brand-assets-has-no-plug`
   thu hẹp còn logo và việc giữ màn chỉ dùng thứ đã ghi, vẫn mở (tiêu chí 22 đóng nó khi tiêu chí 7, 8 và 9 xanh).

## Consequences

- Một repo dùng bộ biểu tượng của thư viện linh kiện được ghim bộ ấy sau một lần `adopt`, và đổi phiên bản gói mà
  không đổi dòng thì cổng đỏ.
- Năm dòng mới của sổ giới hạn nói điều lát này không giữ: chỉ đọc `package-lock.json`; màn nhập gói khác hay viết thẳng
  thẻ `svg` chưa bị giữ (lát 2); cỡ và nét không phép kiểm nào giữ (câu hỏi 12); `adopt` chỉ biết bốn chữ của một thư
  viện; `adopt` chạy lại trên repo đã nhận đề xuất dòng mà không đặt phép kiểm ghim.
- Bảng chữ → gói nằm ở bộ chuyển của thư viện linh kiện, không phải danh mục gói biểu tượng của lát 2; lát 2 có thể dời
  nó.
- Còn lại cho lát 2 của mục 12.1: danh mục gói biểu tượng, cổng giữ biểu tượng màn dùng, câu chuẩn `icons` được đáp,
  khuyến nghị của lối dẫn dắt.
