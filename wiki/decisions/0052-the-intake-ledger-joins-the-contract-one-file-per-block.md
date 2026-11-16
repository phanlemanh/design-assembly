---
type: decision
title: "Sổ nhập kho vào hợp đồng, và một repo có thể giữ nó mỗi khối một tệp, đặt tên theo nhu cầu"
links:
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0050-a-repository-may-keep-the-ledger-of-screens-one-file-per-screen.md
  - wiki/decisions/0051-derived-files-are-written-before-the-repositorys-own-readers.md
  - wiki/decisions/0047-tool-stamp-upgrade-and-the-version-rule.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/intake-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-fragments.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/derived.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/tests/test-intake-ledger.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/vocabulary.json
  - "chủ repo, 2026-11-16: «Làm 8.1c»"
---

# 0052 Sổ nhập kho vào hợp đồng, và một repo có thể giữ nó mỗi khối một tệp, đặt tên theo nhu cầu

## Status

Accepted, 2026-11-16. Bước 8.1c của đề bài 0005, bước cuối của mục 8.1. Máy chọn cách làm trong khuôn đề bài đã duyệt;
ba chỗ lệch với chữ của đề bài nằm cuối mục Decision.

## Context

Hợp đồng sổ có mười một sổ và hai tên chưa chốt hình dạng: sổ nhập kho và sổ nguồn ngoài. Repo kiểm chứng giữ một sổ
khối, mỗi dòng một khối đã nhận: tên, tệp mã, nguồn, khoá nhu cầu, mô tả, hồ sơ nhận, ngày duyệt. Khoá viết bằng tiếng
Việt, tệp mang tên tiếng Việt. Sổ ấy nóng thứ hai sau sổ màn: hai PR thêm hai khối khác nhau vẫn đụng nhau vì chung một
tệp. Đề bài 0005 giao cho 8.1 chốt hình dạng sổ nhập kho; mục 3.1 dùng lại, không định hình lần hai.

## Decision

1. **Sổ nhập kho là sổ thứ mười hai của hợp đồng, hình dạng 1.** Tệp `design/intake.yaml`, danh sách `blocks`.
   - Mỗi khối có năm khoá bắt buộc: `name`, `file`, `source`, `need`, `approved`.
   - Bốn khoá tuỳ chọn: `pin` (bản của nguồn), `description`, `record` (hồ sơ của vòng nhận), `approved_by`.
   - `need` viết chữ thường nối gạch; `approved` viết `YYYY-MM-DD`.
   - Repo được giữ khoá riêng, trên khối lẫn cạnh danh sách.
   - Hai khối cùng một nhu cầu thì cổng đỏ: một nhu cầu, một lời giải.
2. **Repo đã có cách viết khoá riêng khai trong `keys`**, như sổ màn đã làm. Ví dụ:
   `keys: { blocks: khoi, need: nhu_cau, approved: duyet }`. Mọi bên đọc hiểu sổ theo khoá của hợp đồng. Khi thiếu một
   khoá, cổng nêu cả hai tên, như `approved (duyet) is missing`. Vì vậy repo kiểm chứng giữ được khoá tiếng Việt, đúng
   khuyến nghị của câu hỏi 1.
3. **Sổ nhập kho tách được mỗi khối một tệp, `design/intake/<need>.yaml`, phần còn lại ở `_shared.yaml`.**
   - Đây là lựa chọn của từng repo, tắt cho tới khi bật, như sổ màn.
   - Tên tệp là khoá nhu cầu, nên hai lời giải cho một nhu cầu không thể cùng nằm đó.
   - Mỗi mảnh do đúng một vòng ghi một lần, kể cả ngày duyệt, nên mỗi tệp chỉ có một bên ghi.
4. **Một bộ máy mảnh cho cả hai sổ, không phải bản thứ hai.**
   - Phần cắt và ghép của sổ màn nhận thêm hai tham số: khoá của danh sách và khoá đặt tên tệp. Mặc định vẫn là
     `screens` và `id`, nên văn bản của sổ màn không đổi một chữ.
   - Lệnh vẫn là `screen-fragments.mjs`, thêm `--ledger intake`.
   - Phép kiểm vẫn là `screen-fragments`, mang thêm `of: intake`.
   - Bản một tệp ngoài git (`--copy`) và `derived.mjs` dùng được cho sổ nhập kho y như cho sổ màn.
   - Đường dẫn sổ đọc từ `ledgers.intake` của phép kiểm hình dạng, không có thì dùng đường dẫn thường.
   - Trường mới tên `of` chứ không phải `ledger`, vì vài phép kiểm của sổ màn đã dùng `ledger` cho đường dẫn.
5. **Mỗi sổ giữ lựa chọn của riêng nó.** Trước đây bật hay tắt mảnh, bật hay tắt bản sao đều xoá mọi phép kiểm cùng
   loại của quyết định `ledger-shapes`. Có hai sổ, đó là lỗi: bật bản sao của sổ này làm mất bản sao của sổ kia. Nay
   mỗi lệnh chỉ đổi phép kiểm của đúng sổ nó làm.
6. **`status` nêu sổ nhập kho viết tay khi repo có một.** Nó nói lệnh `intake` chưa dựng, và sổ có đúng hình dạng hay
   không. Trước đây nó nói «không gì ghi nhu cầu nào nhận khối nào», điều không còn đúng với repo đã giữ sổ.
7. **Bảng từ vựng thêm hai tên:** `intake ledger` và `derived file`.
   - `intake ledger` là tên của kho này. Ngành có nói «intake» và «contribution», nhưng máy chưa lần được về một nguồn,
     nên ghi `coined`.
   - `derived file` ghi là thói quen của ngành.

Lệch với đề bài 0005:

- Đề bài viết tệp ở đường dẫn cũ của sổ khối là vật dẫn xuất, thôi commit. **Mặc định tệp một khối vẫn là sổ**. Thư
  mục mảnh và bản sao ngoài git là hai lựa chọn của từng repo, cùng lý do với quyết định 0050: mặc định là hành vi hôm
  nay.
- Đề bài viết lệnh tách sổ khối cũ là việc mới của `upgrade`. **Tách là một lệnh của công cụ đã cài**, như ở 0049 và
  0050; `upgrade` gọi cùng hàm ấy ở bước 8.4.
- Đề bài viết mỗi sổ khai trong hợp đồng nó có phải vật dẫn xuất không, có được commit không. **Lời khai nằm ở dữ liệu
  công cụ của từng repo** (phép kiểm `untracked`), không ở hợp đồng. Cùng một sổ có thể là vật dẫn xuất ở repo này và
  là sổ ở repo khác.

## Consequences

- Repo không có sổ nhập kho không thấy gì đổi.
- Repo có `design/intake.yaml` thì cổng giữ hình dạng của nó ngay khi công cụ mới vào. Lý do: phép kiểm hình dạng đọc
  mọi sổ của hợp đồng, kể cả sổ thêm sau. Một repo đã có tệp ấy mà khác hình dạng sẽ thấy cổng đỏ; `upgrade` nói trước
  và dừng chờ người, như với mọi lần lên đời làm cổng đỏ.
- Repo kiểm chứng cần ba việc ở bước 8.4, mỗi việc xin phép riêng:
  - đổi tên tệp sang `design/intake.yaml`, theo khuyến nghị của câu hỏi 1, hoặc khai đường dẫn ở `ledgers.intake`;
  - thêm dòng `keys`;
  - xem bộ đọc riêng của repo có nhận dòng ấy không.
    Hai dòng giới hạn mới ghi hai việc sau: `intake-ledger-path-named-by-hand` và
    `intake-own-keys-need-a-line-in-the-ledger`.
- Ba dòng giới hạn đã có nay nói cả sổ nhập kho: `screen-fragments-order-is-the-ids`,
  `screen-fragments-not-brought-by-upgrade` và `screen-copy-left-at-old-path`.
- Sổ nguồn ngoài vẫn chưa chốt; nó thuộc mục 3.1.
- Bài kiểm mới: 20 bài ở `test-intake-ledger.mjs`, hai câu thêm ở bài nhịp của `test-status.mjs`.
  - Cả tệp được thấy đỏ trước khi có mã.
  - Bốn chỗ chính được thấy đỏ bằng cách tạm làm hỏng mã rồi trả lại: lựa chọn theo từng sổ, tên mảnh theo nhu cầu,
    một nhu cầu một lời giải, và `adopt` mang theo mảnh.
  - Lỗi xoá nhầm lựa chọn của sổ kia hiện ra đúng khi trả mã về cách cũ.
- Mọi bài của sổ màn xanh như cũ, không bài nào phải sửa.
- Một tác tử độc lập đọc lại thay đổi. Nó không thấy hành vi nào của sổ màn bị đổi, và tìm ra năm điểm, đều đã sửa
  kèm bài kiểm. Mỗi bài được thấy đỏ bằng cách tạm trả mã về rồi xanh lại.
  - **Mức cao:** trang luật cho tác tử viết màn vào `design/screens/<id>.yaml` khi chỉ sổ nhập kho tách mảnh. Nay
    trang chỉ nói vậy khi chính sổ màn tách.
  - **Mức vừa:** lời của lệnh và của cổng gọi khoá là `need` dù repo viết khoá khác. Nay chúng dùng khoá của repo.
  - **Ba điểm nhẹ.** Một cách viết khoá có dấu mà bộ đọc không đọc được, và một tên danh sách có ký tự lạ làm cổng
    ném lỗi: nay cổng nêu cách viết ấy, và không dùng nó. Hai khoá cùng một cách viết từng làm mất một khoá mà không
    báo: nay cổng nêu cả hai.
- Số bản plugin lên `0.5.0`.
