---
type: decision
title: Review sau chặng 2, và cắt lại chặng 3 thành lát mỏng trên Inventory
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/decisions/0029-the-contract-one-shape-per-ledger.md
  - wiki/decisions/0030-one-ledger-of-screens.md
  - wiki/decisions/0031-adapters-hold-library-names.md
sources:
  - docs/architecture/meta-layer.html
  - docs/trials/results.tsv
  - docs/trials/control.tsv
  - plugins/design-assembly/references/limits.json
  - docs/review-queue.md
  - "chủ repo, 2026-11-14: yêu cầu review theo tầm nhìn, mục tiêu, chỉ số và kế hoạch; rồi «Cắt lại như vậy»"
---

# 0032 Review sau chặng 2, và cắt lại chặng 3 thành lát mỏng trên Inventory

## Status

Accepted ở mục 1: chủ repo chọn cắt lại chặng 3 ngày 2026-11-14 («Cắt lại như vậy»). Mục 2 đến 4
là đề xuất của máy đi kèm bản review; chủ repo chưa duyệt riêng từng mục, và chúng nằm trong danh
sách chờ xem ở `docs/review-queue.md`.

## Context

Sau chặng 2, chủ repo bảo dừng lại review theo tầm nhìn, mục tiêu, chỉ số và kế hoạch trước khi đi
tiếp. Số đo ngày 2026-11-14:

- **Bảy tiêu chí của tầm nhìn:** hai tiêu chí đạt phần lớn (mỗi sổ một hình dạng; lõi không nêu
  tên thư viện). Năm tiêu chí còn lại đều đòi rời repo này, và chưa nhúc nhích.
- **Ba số «có thành lớp meta không»:**
  - câu lõi máy giữ ở Inventory: 0 trên 24;
  - công cụ viết tay được thay: 0;
  - repo thứ hai thừa hưởng lõi: chưa có.
- **Chỉ số chính** (số chỗ tác tử phải đoán khi dựng một màn, đích là 0): 12, 12, 13, 11 qua bốn
  lần. Đứng yên. Nó cũng không được đo như định nghĩa: mỗi lần một tác tử thay vì ba, và phiên
  dựng plugin tự chấm.
- **Luật bị phạm, có so với không có trang luật**, trên repo mới của sàn: 0 so với 3, 6, 3. Ở repo
  mà mã đã mang luật, hai nhánh bằng nhau.
- **Chi phí dựng một màn:** nhánh có tốn hơn 13 đến 25 phần trăm token; rào là 1,3 lần. Phép đo
  chính thức chưa chạy lần nào.
- **Sổ giới hạn:** 111 dòng mở, 39 đã đóng. Trong 111 dòng mở:
  - 55 dòng «sẽ sửa», chưa có ngày;
  - 14 dòng là loại lệnh kiểm có thể xanh trong khi điều nó giữ đã hỏng.

  Riêng ngày 2026-11-14 mở 12, đóng 5.

- Lần duy nhất chạy bộ đọc của bên khác, chặng 2 tìm ra một lỗi thật: cổng của kit từ chối sổ
  token.

## Decision

1. **Chặng 3 cắt thành lát mỏng; mỗi lát phải làm một con số nhúc nhích.** Lát đầu không cần bộ
   chuyển mới:
   - đưa các sổ của Inventory về hình dạng chung;
   - sinh sổ token mà Inventory đang thiếu;
   - khai sổ token và sổ linh kiện với kit nghiệm thu.

   Bộ chuyển Next.js cho bảng mẫu và cuốn sổ lùi về sau. Mỗi lát chạy trên bản sao trước; lên
   nhánh thật của Inventory cần chủ repo cho phép riêng.

2. **Thang bốn nấc ở Inventory** thay cho ba số 0 (đề xuất):
   - số sổ đúng hình dạng;
   - số câu lõi máy giữ;
   - số công cụ viết tay được thay;
   - bậc trong thang của kit.
3. **Chỉ số chính đổi cách đo** (đề xuất): lấy «luật bị phạm, có so với không» làm số chính, vì nó
   có nhánh đối chứng. Số chỗ đoán giữ làm số phụ, do một tác tử khác chấm.
4. **Ngừng thêm luật bằng lời ở repo này** (đề xuất). Trong 55 dòng «sẽ sửa», chỉ làm 14 dòng nguy
   hiểm, và làm khi Inventory đụng tới chúng.

## Consequences

- Đề bài 0002 ghi lát đầu của chặng 3 theo mục 1.
- Việc chờ chủ repo xem được gom vào một trang, `docs/review-queue.md`: mỗi dòng trả lời được bằng
  một chạm.
- Kết quả lát đầu trên bản sao Inventory ghi ở `docs/trials/inventory-ladder.md`.
