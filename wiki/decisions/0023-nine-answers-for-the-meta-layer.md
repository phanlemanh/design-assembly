---
type: decision
title: Chín lời đáp cho các câu còn mở của kiến trúc lớp meta
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/decisions/0006-one-ledger-one-layer-list.md
  - wiki/decisions/0009-component-manifest.md
sources:
  - docs/architecture/meta-layer.html
  - design/component-registry.json
  - "chủ kho, 2026-11-13: «Duyệt cả chín»"
  - delivery-loop/design-floor/vendor/design-os/src/core/registry-store.ts
  - delivery-loop/scripts/design-floor-bac.mjs
  - onehub-inventory/design/component-registry.json
---

# 0023 Chín lời đáp cho các câu còn mở của kiến trúc lớp meta

## Status

Accepted. Máy phân tích chín câu còn mở của tài liệu kiến trúc và đề xuất lời đáp kèm lý do; chủ kho
duyệt cả chín ngày 2026-11-13 («Duyệt cả chín»). Kiến trúc tổng thể vẫn là đề xuất: bản này chỉ chốt
chín câu dưới đây.

Câu 7 được sửa ở một điểm bởi
[0112](0112-the-plugin-builds-the-family-core.md), 2026-11-25: plugin dựng lõi và người cho phép, thay cho việc chủ
kho tạo kho lõi. Phần còn lại vẫn đúng.

## Context

Tài liệu kiến trúc lớp meta (`docs/architecture/meta-layer.html`) để lại chín câu chưa quyết. Bốn
câu chặn chặng «hợp đồng», hai câu chặn chặng Inventory và chặng hai kho đổi vai, ba câu chặn chặng
«lõi của họ».

Câu về sổ linh kiện được thử thật ngày 2026-11-13, chỉ đọc: bộ kiểm kế hoạch dùng lại của
delivery-loop đọc được sổ của kho này (57 tên) và từ chối sổ của Inventory ở trường phiên bản. Các
câu còn lại là suy luận từ kiểm kê ba kho cùng ngày.

## Decision

1. **Sổ linh kiện dùng hình dạng của design-assembly**, thêm ba trường Inventory đang có: cấp, các
   phần, nguồn gốc. Bên đọc của delivery-loop đã đọc được hình dạng này và so biến thể đúng dạng
   «trục=giá trị», nên không sửa bên đọc và không có bản xuất thứ hai.
2. **Khoá tiếng Việt của trang kiểu màn được giữ nguyên**, coi là một hình dạng được nhận. Luật
   «plugin chỉ viết tiếng Anh» áp cho lời plugin tự viết, không áp cho định dạng nó đọc.
3. **Sổ do máy sinh vẫn được commit.** Chúng được khai là tệp sinh: đụng nhau khi gộp thì sinh lại,
   không gộp tay. Việc sinh sổ lúc đọc, như chỉ mục của kho tri thức, đã được cân và không chọn.
4. **Thang M0 tới M3 và sáu bậc không gộp.** Thang của delivery-loop đọc kết quả audit của
   design-assembly thay vì tự dò tệp.
5. **Chứng minh một màn bằng ảnh theo từng vòng thuộc delivery-loop.** Design-assembly giữ thứ đứng
   yên mà phép chứng minh đọc: màn mẫu, bề rộng phải so, trạng thái phải phủ. Phần thang chọn khối
   của công cụ ấy về đường nhập kho.
6. **Kho không dùng Makefile:** plugin phát một lệnh kiểm và khai nó ở chỗ kho đã có (Makefile,
   hoặc lệnh kiểm của gói), và luôn khai với delivery-loop khi kho dùng nó. Chỉ làm khi gặp kho thật
   đầu tiên không có Makefile.
7. **Lõi của họ sản phẩm nằm ở một kho riêng tư nhỏ, mới:** một tệp lời đáp chung và các khối đã
   nâng hạng, phát theo kiểu kho mã mà Inventory đang dùng để lấy ReUI. Chỉ tạo khi có sản phẩm thứ
   hai; trước đó lời đáp của Inventory là ứng viên cho lõi.
8. **Lõi bắt đầu bằng khoá ít.** Khoá thứ người dùng cuối nhận ra khi đổi sản phẩm: màu gốc, cách
   mở hồ sơ, các luật hành vi. Để mặc định thứ chỉ người làm mới thấy: mật độ bảng, thang chữ, bề
   rộng được kiểm. Kiểu màn, kiểu cột và lời văn không thuộc lõi. Một câu chỉ lên «khoá» khi đã có
   một lần lệch gây hại thật.
9. **Kho thắng, bằng cách ghim.** Kho ghim bản lõi nó thừa hưởng; lõi đổi thì audit báo và người
   nhận từng câu. Bộ sổ mang số phiên bản hình dạng: plugin mới đọc được hình dạng cũ, plugin cũ gặp
   hình dạng mới thì từ chối ghi, không đoán.

## Consequences

- Chặng «hợp đồng» không còn câu nào chặn: bốn câu đầu đủ để viết hình dạng từng sổ.
- Câu 4 và câu 5 cần sửa ở kho của delivery-loop; câu 7 cần chủ kho tạo một kho mới. Design-assembly
  không tự làm ba việc đó: mỗi việc chờ chủ kho làm hoặc cho phép.
- Sổ linh kiện của Inventory sẽ phải đổi hình dạng khi Inventory chuyển sang dùng plugin; đó là một
  thay đổi ở kho Inventory, thuộc chặng Inventory.
- Điều kiện xét lại đã ghi cùng từng câu trong tài liệu kiến trúc: bên đọc siết lại và cấm trường lạ
  (câu 1); plugin phát cho người ngoài (câu 2); hàng chục nhánh song song làm việc sinh lại thành chi
  phí thật (câu 3).
- Còn mở sau bản này: kiến trúc tổng thể chưa được duyệt; với từng lời đáp cụ thể của lõi, xếp vào
  khoá hay mặc định là quyết định của chủ kho lúc lõi ra đời.
