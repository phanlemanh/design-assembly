---
type: decision
title: "Cổng giữ việc chọn: tệp linh kiện mới cần dòng sổ, dòng tạo tay nêu chữ đã tra và ứng viên gần nhất, tính trên điều nhánh thêm"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0098-choose-before-make-at-the-components-socket.md
  - wiki/decisions/0101-the-repository-declares-its-ladder.md
  - docs/trials/choose-first-on-copies.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/choose-first.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/intake-ledger.mjs
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/intake/SKILL.md
  - plugins/design-assembly/tests/test-choose-first.mjs
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Dựng lát 5»"
---

# 0102 Cổng giữ việc chọn: tệp linh kiện mới cần dòng sổ, dòng tạo tay nêu chữ đã tra và ứng viên gần nhất, tính trên điều nhánh thêm

## Status

Accepted, 2026-11-24. Lát 5 của đề bài [0015](../specs/0015-choose-before-make-conform-before-intake.md), mục 11.5 của
kế hoạch, dựng theo lời chủ repo («Dựng lát 5»). Plugin 0.54.0.

## Context

Chỗ lệch 4 của đề bài: không cổng nào giữ việc chọn. `intake --by-hand --why` nhận mọi câu lý do, và «mã dùng mà sổ
không ghi» chỉ là một phát hiện của `inventory`. Câu hỏi 7, chủ repo đã nhận: đỏ cho tệp thêm sau ngày repo có sổ;
tệp có từ trước vào danh sách «có từ trước» một lần, theo lời chủ repo (`intake --before`).

Điều phải giữ khi làm: một repo đang xanh lên đời bản này thì không được đỏ trên tệp và dòng sổ nó đã có.

## Decision

1. **Một phép kiểm mới, `choose-first`, dưới dòng `ledger-shapes`.** Hướng dẫn, `adopt` và `upgrade` đặt nó vào, như
   `taken-down` của lát 2. `upgrade` nói trước khi thêm.
2. **«Mới» là điều nhánh này thêm, so với chỗ nó rời nhánh chính.** Gồm cả điều chưa commit. Cách đọc giống
   `owner-calls`: bản sao nông thì lấy lịch sử của nhánh chính từ remote `origin`, lấy không được thì đỏ và nói lý do;
   ngoài git thì không so và nói vậy; repo chưa có commit nào cũng không so. Như vậy tệp và dòng nhánh chính đã có
   không bao giờ bị giữ, và repo xanh hôm nay vẫn xanh sau khi lên đời.
3. **Tệp linh kiện mới.** Tệp linh kiện của repo, đọc đúng như `find` và `inventory` đọc (hàm `componentsOf`, nay nằm
   trong mẫu công cụ để cổng đọc cùng một chỗ). Đỏ khi nhánh thêm nó và không dòng sổ nào nêu tệp ấy, `before` không
   nêu tệp hay một linh kiện trong nó, không bản ghi chuẩn hoá nào giữ nó, và không nguồn ghim nào khai thư mục của nó.
4. **Dòng tạo tay.** Sổ nhập kho thêm hai khoá không bắt buộc: `searched`, chữ `find` được hỏi; `nearest`, thứ gần
   nhất các kho đưa ra cho chữ ấy, kho gần trước, hoặc `none` khi không gì đáp. `intake` viết cả hai. Một dòng tạo tay
   nhánh viết (điểm rẽ không có dòng cho nhu cầu ấy, hoặc có mà `source` viết khác) thì đỏ khi thiếu một trong hai,
   hoặc khi `nearest` không phải `none` mà cũng không là tên kho của repo, danh mục đã ghim hay bộ khởi đầu giữ, ngoài
   chính khối ấy. Máy kiểm sự có mặt và tên có thật; câu lý do là của người, chủ repo đọc trên tờ quyết định.
5. **Một nhu cầu, hai dòng.** Đã đỏ từ đề bài 0006, qua hình dạng của sổ nhập kho, ở cả hai dạng sổ. Lát này không đổi
   gì ở đó; một bài kiểm trên bản sao giữ nó cùng hai ca kia.
6. **Tên của bộ khởi đầu** là kho duy nhất cổng không đọc được trên đĩa của repo, nên mẫu công cụ giữ một danh sách
   tên; một bài kiểm của plugin giữ danh sách ấy khớp `references/starter.json`.

## Đổi gì trong hợp đồng

- **Sổ nhập kho**, vẫn bản 1: mỗi khối thêm hai khoá không bắt buộc `searched` và `nearest`. Khối viết trước đọc như
  trước. Repo viết khoá theo cách riêng thì viết hai khoá này ở `keys` như các khoá khác.
- **Dữ liệu công cụ**: dòng `ledger-shapes` thêm phép kiểm `choose-first`, có thể kèm `main` và `intake`.

## Consequences

- Một tệp linh kiện viết ra mà không qua `intake` làm cổng đỏ trên nhánh, với câu chỉ lối: tra bằng `find`, rồi nhập
  kho bằng `intake --need`.
- Lượt thử trên hai bản sao: [choose-first-on-copies](../../docs/trials/choose-first-on-copies.md). Lượt ấy bắt hai lỗi
  trước khi mở PR, nay có bài kiểm: khối làm trước khi hỏi bị ghi là ứng viên gần nhất của chính nó; và một repo bắt
  đầu khai `values` biến dòng cũ thành dòng mới.
- Kèm theo, từ lưu ý khi soát PR 128: ở ổ có thang, phích ngoài đã chọn mà không có ở đây không còn bị gọi là
  `chosen-but-missing`; dòng của ổ đã nói lựa chọn đứng ở đâu.
- Sổ giới hạn:
  - **đóng** `choice-not-held-by-the-gate`. Câu của nó nói sai một vế: hai dòng một nhu cầu đã đỏ từ trước.
  - **mới** `choice-held-on-what-a-branch-adds`: tệp đã gộp vào nhánh chính trước khi repo lên đời mà không có dòng sổ
    thì không đỏ, chỉ `inventory` nêu; tệp đổi chỗ tính là tệp thêm.
  - **mới** `nearest-none-taken-as-written`: cổng không chạy `find`, nên `none` được nhận như đã viết.
- Plugin lên 0.54.0. Kế hoạch: mục 11.5 xong.
