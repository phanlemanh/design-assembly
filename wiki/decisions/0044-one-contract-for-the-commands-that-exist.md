---
type: decision
title: "Hợp đồng chung áp cho năm lệnh đang có: một chỗ đọc lời gọi, mã thoát 1 là «xong, còn việc»"
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0041-status-reads-ledger-rows-and-compares-the-tool-by-content.md
  - wiki/decisions/0040-the-plan-of-record-and-how-it-is-kept.md
  - wiki/decisions/0024-scope-locked-limits-and-trial-briefs.md
sources:
  - plugins/design-assembly/scripts/command.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/tests/test-command-contract.mjs
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/checks.md
  - mk/plugin.mk
  - docs/plan/plan.json
  - "chủ repo, 2026-11-15: «Duyệt đề bài»"
---

# 0044 Hợp đồng chung áp cho năm lệnh đang có

## Status

Accepted cho phần đề bài 0004 đã chốt: mục «Hợp đồng chung của mọi lệnh», giới hạn ở kết quả máy đọc
được và mã thoát (mục 0.5 của kế hoạch). Tám lựa chọn ở mục Decision là máy chọn trong lúc dựng, đề
bài không nói tới hoặc nói hai cách; chờ chủ repo bác. Lựa chọn 2 thay đoạn cuối mục Decision của
[0041](0041-status-reads-ledger-rows-and-compares-the-tool-by-content.md).

## Context

Đề bài 0004 đặt một hợp đồng cho mọi lệnh: nhận `--target`, mặc định là thư mục đang đứng; `--json`
cho một tài liệu duy nhất; lệnh chỉ đọc không đổi gì; lệnh ghi có `--dry-run`; mã thoát 0, 1, 2. Năm
lệnh đang có (`status`, `audit`, `new`, `adopt`, `handoff`) mỗi lệnh một kiểu:

- Bốn lệnh bắt buộc `--target`; cờ lạ thì bị bỏ qua, không báo.
- Chỉ `status` và `audit` có `--json`.
- Bốn lệnh kết thúc 0 dù còn việc cho người. Một repo không đọc được làm lệnh sập với mã 1, mà theo
  hợp đồng 1 nghĩa là «xong, còn việc».
- `handoff` không có `--dry-run`.

Dựng mới thấy đề bài để ngỏ, hoặc nói hai cách, ở những chỗ sau:

- Hợp đồng chung ghi 1 khi «có chỗ cần sửa»; dòng riêng của `status` thì không tính lệnh kiểm đang đỏ.
- Dòng riêng của `audit` ghi 1 khi «không giữ» hoặc «bị vòng qua», không nhắc lệnh kiểm đang đỏ.
- `new` phải trả nguyên tắc thiết kế và các hướng đi; hai thứ ấy thuộc giai đoạn 4, chưa có.
- `handoff` phải kết thúc 2 khi repo không có nền dựng để vẽ; hôm nay nó vẫn ghi cuốn sổ không hình.
- Nhiều nơi gọi các lệnh và coi mã khác 0 là hỏng: lệnh `make`, bài kiểm, lệnh đo thang.

## Decision

1. **Hợp đồng viết một chỗ:** `plugins/design-assembly/scripts/command.mjs`. Nó đọc lời gọi theo
   bảng cờ mà lệnh khai, kết thúc lệnh, và từ chối. Cờ lệnh không có là gọi sai. Mọi lỗi ném ra
   trong lúc chạy thành mã 2 kèm lý do ở luồng lỗi, không bao giờ thành 1. Lệnh mới dùng lại đúng
   bốn hàm ấy.
2. **`status` kết thúc 1 cả khi một lệnh kiểm đang đỏ hoặc mã vòng qua một quyết định.** Theo hợp
   đồng chung, 0 nghĩa là không còn gì; lúc ấy `status` đang nêu `audit` làm lệnh kế, tức là còn.
   Dòng giới hạn `status-exit-ignores-failing-checks` đóng.
3. **`audit` kết thúc 1 khi có quyết định không giữ, đang đỏ, hoặc bị vòng qua.** Kết quả cho máy
   thêm ba khoá đề bài kê: `tier` (nấc đã đạt, cùng hình dạng với `status`), `missing` (nấc kế thiếu
   quyết định nào, vật nào), `blind` (mọi dòng giới hạn đang mở). Các khoá cũ giữ nguyên, vì lệnh đo
   thang và `status` đang đọc.
4. **`new` trả `blueprint` và `files`; bỏ trống `principles` và `directions`,** mỗi khoá một dòng
   giới hạn. Nó kết thúc 1 khi còn tầng đã dựng mà chưa quyết, kể cả lúc chưa có bản thiết kế, và khi
   bản xem trước cho thấy lần ghi sẽ bị từ chối vì repo có giá trị riêng (khoá `refused` nói lý do).
   Khi chưa đủ câu trả lời để biết sẽ ghi tệp nào thì `files` cũng bỏ trống.
5. **`adopt` kết thúc 1 khi mục «cần người» còn câu.** Kết quả cho máy là đúng dữ kiện bản in dùng,
   trong đó có năm khoá đề bài kê (`rows`, `rerun`, `loose`, `person`, `files`).
6. **`handoff`: cuốn sổ ghi ra mà thiếu hình thì kết thúc 1, không phải 2 như đề bài.** Từ chối ghi
   cuốn sổ là đổi điều lệnh làm, việc ấy chủ repo quyết; dòng giới hạn
   `handoff-ends-with-1-where-specification-says-2` giữ chỗ lệch này. `--json` trả một tài liệu gồm
   `facts` và `files`; `--facts` giữ nguyên. `--dry-run` kê trang sổ và tệp in; ảnh từng tờ của bản
   `png` thì chưa kê được.
7. **`files` chỉ kê tệp sẽ được ghi,** tạo mới hay sửa, bằng đường dẫn tính từ repo đích; tệp không
   đổi không vào danh sách. Lần chạy thật trả lại đúng danh sách ấy.
8. **Lệnh `make` có từ trước hợp đồng coi mã 1 là xong;** chỉ mã 2 làm chúng đỏ. Một chuỗi lệnh đang
   dựa vào chúng chạy tiếp như cũ. `make design-status` sinh ra cùng hợp đồng nên vẫn đưa mã 1 ra.

## Consequences

- **Một bài kiểm cho cả năm lệnh:** `plugins/design-assembly/tests/test-command-contract.mjs`, một
  bảng, mỗi lệnh một dòng. Nó chạy từng lệnh trên repo bỏ đi và giữ: cờ, khoá của `--json`, mã thoát
  0, 1 và 2, cây không đổi sau lệnh chỉ đọc và sau `--dry-run`, và danh sách tệp của `--dry-run` bằng
  đúng các tệp lần chạy thật ghi. Lệnh mới thêm một dòng vào bảng.
- **Bài kiểm cũ đổi 41 chỗ ở mười một tệp:** nơi đang đòi mã 0 mà lệnh nay trả 1 vì còn việc cho
  người. Không bài kiểm nào bị bỏ.
- **Lệnh đo thang sẽ dừng ở bước đầu** cho tới khi nó thôi coi mã 1 của `adopt` là hỏng:
  `docs/trials/ladder.mjs` ném lỗi với mọi mã khác 0. Tệp ấy thuộc mục 0.4 của kế hoạch, đang làm ở
  nhánh khác, nên không sửa ở đây.
- **Sổ giới hạn:** năm dòng mở (`new-json-without-principles`, `new-json-without-directions`,
  `new-preview-lists-no-files-before-layers-are-decided`,
  `handoff-ends-with-1-where-specification-says-2`, `handoff-preview-does-not-name-png-sheets`), một
  dòng đóng.
- **Chưa làm, thuộc mục khác:** `--answers FILE`; tài liệu bàn giao `--out` và `--format` (mục 0.6);
  `--out` của `handoff` vẫn đọc đường dẫn tương đối theo repo đích. Bảng mẫu (`specimen.mjs`) là dụng
  cụ của cuộc dẫn dắt, không phải lệnh, nên chưa theo hợp đồng.
- Chưa có lượt thử độc lập nào cho hợp đồng này, và chưa lệnh nào được gọi từ một plugin khác.
