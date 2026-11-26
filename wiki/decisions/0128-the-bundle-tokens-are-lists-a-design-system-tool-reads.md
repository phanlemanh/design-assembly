---
type: decision
title: "Token của gói hệ thiết kế là danh sách mà công cụ hệ thiết kế đọc được; kiểu chữ ra theo stylesheet và bộ nạp font"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0092-bring-out-writes-the-ledgers-out-and-the-gate-holds-them.md
  - wiki/decisions/0093-send-out-asks-leave-records-the-push-and-says-when-it-is-behind.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/exports.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/nextjs-build.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/tailwind.mjs
  - plugins/design-assembly/scripts/outside-tokens.mjs
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-bring-out.mjs
  - "phiên ở repo sản phẩm đầu tiên gửi gói, 2026-11-26: chủ repo xem trang hệ thiết kế trống ở Colors, Typography, Spacing, Radius và đáp «Sửa rồi gửi lại»"
---

# 0128 Token của gói hệ thiết kế là danh sách mà công cụ hệ thiết kế đọc được

## Status

Proposed, 2026-11-26, plugin 0.75.0. Ngoài kế hoạch, theo lời chủ repo «Sửa rồi gửi lại»; thuộc cầu nối ra (đề bài
0014), làm chậm lát 2 của mục 12.3 một PR. `ontology/` và hợp đồng không đổi.

## Context

Repo sản phẩm đầu tiên dùng `bring-out` đã gửi gói `design/export/system/` nguyên văn sang một artifact riêng loại
«Design System» trên claude.ai. Trang ấy hiện Colors, Typography, Spacing, Radius trống: gói viết `tokens.json` theo
dạng nhóm `$value` (màu tối nằm dưới `color.dark`, cỡ chữ dưới `font.size`), còn loại trang ấy chỉ đọc danh sách token
có tên, giá trị theo từng giao diện và ghi chú dùng. Thêm nữa, kiểu chữ không ra: repo ấy nạp Inter bằng bộ nạp font
của Next.js trong `src/app/layout.tsx`, stylesheet chỉ viết `--font-sans: var(--font-sans)`, nên `design/tokens.json`
không có token font nào và gói để trống họ chữ.

## Decision

1. **`tokens.json` của gói theo dạng danh sách** của loại trang hệ thiết kế: `name`, `version`; `color.themes` (sáng
   trước, rồi tối) và `color.tokens`, mỗi token một giá trị cho từng giao diện, vai đi theo vai khác viết `{vai}` ở cả
   hai; `type.families` (`sans`, `heading`, `mono` khi stylesheet có), `type.groups` (chữ chạy và tiêu đề, theo các bậc
   tiêu đề plugin đã có), mỗi bậc cỡ chữ và độ cao dòng tính từ stylesheet; `spacing.tokens` (`spacing-unit`) và
   `radius.tokens` (`radius-<bậc>`). Tên mà công cụ không nhận bị để ra ngoài danh sách và nêu ở `$left_out`. DESIGN.md
   giữ định dạng của nó. Dấu trạng thái của sổ vẫn ở `$description`; cổng vẫn so dữ liệu của tệp với thứ sổ cho ra.
2. **Ghi chú dùng chỉ lấy từ dữ liệu plugin có**: với màu, từ bảng vai màu (`references/color-roles.json`): chữ trên nền
   nào, phần không phải chữ trên nền nào, nền của những vai nào, vì sao không đo; vai bảng không có nói thẳng như vậy.
   Bảng cặp được chép vào công cụ (`exports.mjs`, `ROLE_PAIRS`) vì cổng chạy ở repo không đọc được tài liệu của plugin; một bài
   kiểm của plugin giữ bản chép bằng bảng, như `STARTER_NAMES`.
3. **Kiểu chữ đọc từ stylesheet và thứ nạp nó**: mỗi biến font (`--font-sans`, `--font-heading`, `--font-mono`) như
   stylesheet viết, và khi mục đầu là một biến do bộ nạp font đặt, họ chữ là hàm bộ nạp Google nhập (`Inter`, `_` đọc
   thành khoảng trắng). Mặt chữ host ở Google không có tệp: chỉ nêu ở `type.families`, `type.fonts` để trống.
   `assets.json` thêm `typefaces` (khoá, biến, họ, thứ nạp, có host không) và, với font của sổ nguồn, các tệp nó ghim.
   Kiểu chữ là đầu vào của dấu trạng thái, nên đổi font trong layout làm bản xuất cũ và cổng đỏ.
4. **Cầu nối vào đọc được dạng mới**, nên thứ đi ra vẫn đọc lại vào như sổ giữ.

## Consequences

- Repo đã có bản xuất: sau khi nâng công cụ lên 0.75.0, `make design-exports` viết lại; trước đó cổng đỏ vì dấu trạng
  thái đổi (dòng giới hạn `bring-out-not-rewritten-by-other-writers` vẫn mở).
- Dòng giới hạn `bring-out-bundle-tokens-not-read-by-design-system-tools` mở và đóng cùng ngày. Ba dòng mới mở:
  `bring-out-bundle-font-files-not-carried`, `bring-out-local-face-unnamed`, `bring-out-type-weights-unwritten`.
- Chưa chứng trên trang thật: bài kiểm giữ hình dạng theo luật của loại trang (tên, màu hex hoặc alias, độ dài, ghi chú
  dùng); việc trang hiện đủ bốn mục chỉ thấy khi repo sản phẩm gửi lại.
