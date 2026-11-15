---
type: decision
title: Chặng 3, lát ba — bộ đọc linh kiện ngang công cụ của Inventory
links:
  - wiki/decisions/0032-review-after-stage-two-and-stage-three-recut.md
  - wiki/decisions/0029-the-contract-one-shape-per-ledger.md
  - docs/trials/inventory-ladder.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/shadcn.mjs
  - plugins/design-assembly/tests/test-components.mjs
  - docs/trials/ladder.mjs
  - "chủ repo, 2026-11-14: «Làm lát ba»"
---

# 0034 Chặng 3, lát ba: bộ đọc linh kiện ngang công cụ của Inventory

## Status

Accepted. Chủ repo cho làm lát ba ngày 2026-11-14 («Làm lát ba»). Các quy tắc đọc dưới đây là máy
chọn, chờ chủ repo bác. Lát này chỉ đổi plugin và kho này; Inventory không bị đụng.

## Context

Lát đầu (0032) cho thấy ba chỗ bộ đọc linh kiện của plugin kém công cụ Inventory tự viết, nên chưa
thay được công cụ đó:

- sổ không có danh sách thuộc tính, thứ skill dựng màn của Inventory dặn tác tử đọc;
- chỉ một linh kiện là khuôn, Inventory có mười tệp khuôn;
- thư viện mua thứ hai của Inventory bị tính là «của riêng repo».

## Decision

1. **Danh sách thuộc tính.** Mỗi linh kiện ghi `props`: các thuộc tính chữ ký của nó tách ra từng
   cái, theo thứ tự chữ ký, bằng tên người gọi viết. Bỏ `className`, `children` và trục của bộ
   biến thể, vì phần biến thể đã nêu chúng. Thuộc tính nhận một danh sách chữ cố định vẫn nằm ở cả
   hai chỗ, như công cụ của Inventory. Hợp đồng của sổ linh kiện thêm khoá này.
2. **Khuôn theo thư mục.** Linh kiện trong thư mục `templates` là khuôn, cùng với linh kiện mà trang
   kiểu màn gọi là khuôn.
3. **Mọi thư viện.** Thư mục của mỗi kho linh kiện mà tệp thiết lập của thư viện khai thêm là thư
   viện, khi thư mục đó có thật. Bộ chuyển nguồn linh kiện biết điều này; phép kiểm sổ linh kiện ghi
   các thư mục đó.
4. **Ba lỗi đọc sửa luôn**, tìm ra khi so với Inventory:
   - chú thích trong mã không còn bị đọc như cấu trúc: một dòng chú thích giữa các trục biến thể làm
     bộ đọc dừng giữa chừng, và chú thích trong chữ ký làm sót thuộc tính;
   - hai tệp khai cùng một tên bộ biến thể: linh kiện đọc bộ của tệp mình trước;
   - bộ biến thể của tệp khác chỉ góp những trục linh kiện nhận làm thuộc tính: một màn gọi bộ của
     nút với giá trị cố định thì không có biến thể của nút.
5. **So được bằng một lệnh.** Lệnh đo thang, sau bước 3, so sổ plugin ghi với sổ công cụ của
   Inventory ghi, theo tên.

## Consequences

- **Trên bản sao Inventory** ở `1226ec5`, theo tên, 270 linh kiện có ở cả hai:
  - thuộc tính giống 268. Hai chỗ khác, plugin đọc đúng hơn: một linh kiện bọc trong hàm ghi nhớ mà
    công cụ kia không đọc, và một tên thuộc tính công cụ kia ghi kèm dấu ngoặc kép;
  - biến thể giống 262. Tám chỗ khác là thuộc tính nhận danh sách chữ, plugin ghi thêm vào biến thể;
  - tệp khuôn: mười tệp như nhau. Plugin thêm `DataRegion`, vì trang kiểu màn «lưới» của Inventory
    gọi nó là khuôn, còn công cụ kia xếp nó là organism. Hai nguồn của Inventory nói khác nhau; chủ
    repo quyết, ở `docs/review-queue.md` dòng C6;
  - cấp giống 269 trên 270, chỗ khác là `DataRegion`;
  - «của riêng repo» chỉ còn linh kiện dùng chung và khuôn; thư viện mua thứ hai đã là thư viện;
  - 64 tên chỉ công cụ kia có, đều không phải linh kiện: 34 hằng số viết hoa và 30 kiểu dữ liệu.
- **Thay công cụ của Inventory giờ chỉ còn vướng hình dạng sổ.** Sổ của Inventory ghi theo tệp, mỗi
  tệp một danh sách phần; sổ theo hợp đồng ghi theo linh kiện. Skill dựng màn, bài kiểm sổ và lệnh
  sinh lại của Inventory đọc hình dạng cũ, nên phải đổi theo. Đó là bước 3 của lát đầu, làm ở
  Inventory, cần chủ repo cho phép.
- **Kho này:** sổ linh kiện thêm thuộc tính cho 65 linh kiện, không dòng nào bị bớt. Cổng xanh.
- **Sổ giới hạn:** đóng ba dòng (thư viện thứ hai, phạm vi sổ, tiếp quản sổ chưa ngang). Mở hai
  dòng hẹp hơn: sổ chưa ghi trạng thái; thuộc tính chỉ đọc từ chữ ký.
