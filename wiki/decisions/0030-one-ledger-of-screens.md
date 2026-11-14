---
type: decision
title: Hợp đồng, lát hai — một sổ màn, mã chỉ giữ cách tới từng trạng thái
links:
  - wiki/decisions/0029-the-contract-one-shape-per-ledger.md
  - wiki/decisions/0016-screen-kinds-and-failed-actions.md
  - wiki/specs/0002-meta-layer-for-many-repositories.md
sources:
  - design/screens.yaml
  - plugins/design-assembly/templates/tools/design-assembly/screen-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screens.mjs
  - plugins/design-assembly/templates/owned/screens-ledger.test.ts.template
  - plugins/design-assembly/tests/test-screen-ledger.mjs
  - "chủ repo, 2026-11-14: «Làm lát sổ màn»"
---

# 0030 Hợp đồng, lát hai: một sổ màn, mã chỉ giữ cách tới từng trạng thái

## Status

Accepted. Chủ repo chọn làm lát sổ màn theo hướng máy đề xuất ngày 2026-11-14 («Làm lát sổ màn»).
Hướng đó là: lấy tệp dữ liệu của Inventory làm hình dạng chung, thêm danh sách trạng thái, và một
bài kiểm ràng sổ với mã. Chi tiết cách làm là máy chọn, chờ chủ repo bác.

## Context

Sổ màn có hai hình dạng:

- Ở repo này (và mọi repo trên sàn), nó là mã: danh sách màn kèm cách đi tới từng trạng thái. Cổng
  đọc mã đó như văn bản, nên trạng thái khai bằng hàm bị đọc là không có. Lần nghiệm thu 0028 đỏ
  hai lượt vì chuyện đó.
- Ở Inventory, nó là tệp dữ liệu YAML, có ba bộ đọc, không có trạng thái.

Kit nghiệm thu không đọc sổ màn nào.

## Decision

1. **Một sổ màn dạng dữ liệu**, `design/screens.yaml`, theo hình dạng của Inventory. Mỗi màn có:
   - `id`, `route`, `title` (khoá của tiêu đề trong bộ chữ của repo);
   - `family` (tên kiểu màn, trùng `nhom` của trang kiểu màn);
   - `status` (đã dựng hay mới định);
   - danh sách trạng thái, không bắt buộc.

   Repo được thêm khoá riêng (ví dụ vai nào được mở màn): đó là phần mở rộng của repo, không thuộc
   lõi. Hình dạng nằm trong hợp đồng, phiên bản 1.

2. **Mã chỉ giữ cách tới từng trạng thái.** Sổ nói có gì; mã nói đi tới bằng cách nào. Các lệnh
   kiểm về màn (trạng thái bắt buộc, liên kết giữa màn, kiểu màn, màn mẫu) đọc trạng thái từ sổ khi
   repo có sổ. Mã chỉ còn được đọc để tìm tệp vẽ màn.
3. **Hai lớp ràng sổ với mã.**
   - Cổng (dòng sổ mới `screen-ledger`): sổ đúng hình dạng; sổ và mã cùng danh sách màn đã dựng;
     không mã hay đường dẫn nào lặp; họ màn nào cũng có trang kiểu màn.
   - Bài kiểm của repo, plugin cài một lần: đọc sổ và mã lúc mã chạy, đòi tiêu đề và trạng thái
     từng màn khớp nhau. Vì đọc lúc chạy, trạng thái khai bằng hàm vẫn được đọc đúng.
4. **Cuộc dẫn dắt ghi sổ đầu tiên từ mã**, một lần, rồi sổ thuộc về người. Trạng thái khai bằng
   hàm không đọc được lúc đó: màn ấy nhận danh sách rỗng, và bài kiểm của repo chỉ ra chỗ thiếu.
5. **Trang luật** nói: mỗi màn ghi ở hai nơi, trong cùng một thay đổi; trạng thái trong mã được
   khai bằng hàm.

## Consequences

- Cổng của repo này giữ 27 quyết định bằng 33 lệnh kiểm. Sổ màn của repo có 2 màn, ghi từ mã và
  khớp mã.
- Bài kiểm của repo đỏ đúng chỗ khi sổ thiếu một trạng thái, thử bằng tay ngày 2026-11-14.
- Trên repo mới của sàn dựng lại từ đầu, cuộc dẫn dắt:
  - ghi sổ màn và cài bài kiểm;
  - lệnh kiểm của plugin giữ 23 quyết định;
  - bước kiểm kiểu và bài kiểm thường xanh.

  Năm lượt kiểm trình duyệt đỏ đều là lỗi đã biết của màn mẫu sàn giao: cột thao tác ra ngoài màn
  ở bề rộng 320, và bốn lượt hộp thoại hỏi trước ghi ở 0028.

- Sổ màn của Inventory qua bộ kiểm hình dạng, chỉ thiếu số phiên bản. Họ màn của nó ghi khoá `grid`
  trong khi trang kiểu màn tên `luoi`, nên cổng sẽ báo khi Inventory nhận sổ này. Phép ràng với mã
  hôm nay chỉ đọc danh sách màn của sàn; Inventory dựng màn kiểu khác, cần một bộ chuyển ở chặng 3.
- Sổ giới hạn:
  - đóng hai dòng: trạng thái khai bằng hàm bị đọc là thiếu; sổ màn hai hình dạng;
  - mở ba dòng: phép ràng với mã chỉ qua danh sách màn của sàn; sổ màn của Inventory khác hình
    dạng; một màn ghi ở hai nơi mà chỉ bài kiểm của repo giữ phần tiêu đề và trạng thái.
- Chặng 2 còn một lát: tách tên thư viện vào bộ chuyển.
