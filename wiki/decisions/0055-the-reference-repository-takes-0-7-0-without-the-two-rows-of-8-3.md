---
type: decision
title: "Repo kiểm chứng lên 0.7.0 bằng upgrade, chưa có hai dòng của 8.3"
links:
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0049-a-repository-may-keep-the-component-manifest-out-of-git.md
  - wiki/decisions/0050-a-repository-may-keep-the-ledger-of-screens-one-file-per-screen.md
  - wiki/decisions/0051-derived-files-are-written-before-the-repositorys-own-readers.md
  - wiki/decisions/0052-the-intake-ledger-joins-the-contract-one-file-per-block.md
  - wiki/decisions/0053-a-command-says-which-screens-a-change-reaches.md
  - wiki/decisions/0054-the-decision-ledger-stands-in-for-the-head-of-design.md
sources:
  - docs/trials/upgrade-inventory-0-7-0.md
  - https://github.com/phanlemanh/onehub-inventory/pull/84
  - "chủ repo, 2026-11-17: cho phép từng bước ở repo kiểm chứng, ký hồ sơ ở Cổng 2"
---

# 0055 Repo kiểm chứng lên 0.7.0 bằng upgrade, chưa có hai dòng của 8.3

## Status

Accepted, 2026-11-17. Mục 8.4 của kế hoạch. Mọi lựa chọn dưới đây là của chủ repo, hỏi từng bước; máy chỉ đề xuất.

## Context

Bước 8.1 tới 8.3 dựng trong plugin ba thứ: tệp dẫn xuất ra khỏi git, sổ mỗi mục một tệp, và lệnh `affected`. Mục 8.4
đưa chúng vào repo kiểm chứng bằng `upgrade`, nơi có những thứ ứng dụng mẫu không có:

- hai sổ mang tên tiếng Việt;
- bộ đọc riêng viết bằng Python;
- luật riêng là CI chạy trên bản sao nông;
- bộ nghiệm thu đòi hồ sơ T3 cho mọi thay đổi ở `tools/**` và `mk/**`.

## Decision

1. **Đổi tên hai sổ ngay, giữ khoá tiếng Việt.** Sổ khối thành `design/intake.yaml` (thư mục `design/intake/`), và
   khoá riêng của repo khai qua `keys`. Bảng vai × màn × nút thành `design/role-screen-buttons.md`, ra khỏi git, được
   viết lại trước các bước kiểm.
2. **Bảng luật hành vi thành danh sách ngay; tách mảnh thì để sau.**
3. **Bản đồ `affected` khai các tệp không chạm màn,** đúng như đề xuất. Danh sách ở trang thử.
4. **Hoãn hai dòng `decision-sheet` và `owner-calls`.**
   - Trên bản sao nông, cả hai đỏ vì không tìm ra nhánh chính. Đó là đúng hành vi mà quyết định 0054 mục 8 chọn.
   - Repo kiểm chứng giữ CI nông và đòi `make check` xanh ở đó.
   - Hai thứ ấy không cùng đứng được. Chủ repo chọn sửa ở plugin, không ở repo: bản 0.7.1 cho hai phép kiểm tự lấy
     phần lịch sử còn thiếu, rồi một lần lên đời sau thêm hai dòng.
5. **Hồ sơ nghiệm thu chạy trong một phiên mở ở repo kiểm chứng,** không phải ở repo này. Bộ nghiệm thu đọc cấu hình của
   thư mục phiên.

## Consequences

- Repo kiểm chứng có dòng 1 và dòng 2 của giai đoạn 8 về cấu trúc. Dòng 3 thì chưa, nên giai đoạn 8 chưa đóng.
- Mục 8.4 còn dở cho tới khi PR #84 gộp và hai dòng của 8.3 vào được.
- Trang [`upgrade-inventory-0-7-0.md`](../../docs/trials/upgrade-inventory-0-7-0.md) ghi hai điều chưa có dòng giới
  hạn nào của plugin:
  - bộ đọc bài kiểm gắn thẻ đọc cả chuỗi trong dữ liệu mẫu;
  - bản sao ngoài git có thể cũ hơn thư mục mảnh.

  Cả hai thuộc bản plugin 0.7.1, theo luật phiên bản.

- Bộ đọc riêng của repo phải theo khi sổ đổi chỗ. Ở đây có cổng chứng minh bằng Python, ngày luật ra đời đọc từ lịch
  sử, và skill dựng màn. `upgrade` không thấy chúng, nên lần nhận nào có bộ đọc riêng cũng phải dò như lần này.
