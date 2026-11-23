---
type: decision
title: "Hệ «Design System» của Claude được đo theo bốn thước"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0073-the-review-socket-plugs-an-outside-eye.md
sources:
  - docs/trials/claude-design-system-measured.md
  - docs/trials/outside-tools-hands-on.md
  - plugins/design-assembly/references/plugs/claude-design.json
  - "chủ repo, 2026-11-23: «Đưa loại artifact Design System là loại đề xuất với người dùng mặc định vì đây là cái mà Claude đang làm tốt hơn của repo. Đưa đo claude design lên thực hiện sớm không cần đợi ngày 14/12»"
  - "chủ repo, 2026-11-23: «Cho đo Claude Design»"
---

# 0088 Hệ «Design System» của Claude được đo theo bốn thước

## Status

Accepted, 2026-11-23, cho số đo. Phán quyết ở ổ hướng đi và ổ nền chờ lời chủ repo, theo tiêu chí 16 của đề bài 0014.
Đây là phích đầu tiên của mục 10.2. Giai đoạn 10 chưa mở, nên lượt đo ngoài kế hoạch, theo lời chủ repo.

## Context

Chủ repo quyết hệ loại «Design System» của Claude là khuyến nghị mặc định ở bốn ổ hướng đi, nền, tài sản thương hiệu
và bàn giao, và cho đo sớm. Đề bài 0014 ghi quyết định ấy là ngoại lệ có tên. Căn cứ là lời chủ repo cho tới khi có số
đo. Nếu số đo thua phích của plugin ở thước 1 hay thước 2, máy hỏi chủ repo, không tự đổi khuyến nghị (tiêu chí 16).
Số đo dưới đây từ một lượt trên bản sao bỏ đi:
[docs/trials/claude-design-system-measured.md](../../docs/trials/claude-design-system-measured.md).

## Decision

1. **Phích `claude-design` nay là «đã đo»** ở bốn ổ nó khai, với số đo của lượt ngày 2026-11-23.
2. **Số đo theo bốn thước:**
   - **Giữ được không.**
     - Lúc lập từ code: 76 trên 76 giá trị màu của hai giao diện vào đúng từng ký tự, máy đối chiếu (một giá trị khác
       là màu chính, do việc đổi có chủ ý).
     - `tokens.json` theo một ngữ pháp viết ra, nên một script đọc và đối chiếu được, không cần người.
     - Thứ mất: 6 trên 6 nấc bo góc `calc()`, 9 trên 15 linh kiện, tệp font, và quan hệ «sidebar theo màu chính» của
       sổ.
     - Sau lúc lập, không gì giữ: đổi màu chính thì viền focus, giao diện tối, bảng màu, README và bìa giữ màu cũ, và
       không gì báo.
   - **Người dùng phải đoán mấy chỗ.** Tác tử tự khai, chưa ai đếm lại:
     - Lập từ code có 21 chỗ tự quyết và 5 câu cho người, không câu nào về hướng đi, nguyên tắc hay gu.
     - Lập từ số không có 0 câu; mọi giá trị ngoài ba đầu vào do máy chọn.
     - Đổi một quyết định có 5 chỗ tự quyết.
   - **Chạy được ở đâu:** cần tài khoản Claude và mạng; nội dung của repo ra khỏi máy, vào một artifact riêng tư.
   - **Tốn bao nhiêu:** 227 763 token của một tác tử con theo bộ đếm của phiên, khoảng 9 phút. Ước tính trước là
     khoảng 250 nghìn.
3. **Theo luật chọn của 0008, phích này không tự đủ điều kiện làm mặc định.** Thước 3 xếp nó vào phích phụ vì cần tài
   khoản và mạng. Thước 1 thua ở phần giữ sau lúc lập. Thước 2 thua ở lối lập từ số không, vì máy quyết thay người.
   Quyết định của chủ repo vẫn đứng như ngoại lệ có tên. Theo tiêu chí 16, số đo thua nên thành một câu hỏi cho chủ
   repo; máy không tự đổi khuyến nghị.
4. **Điều nó làm tốt hơn phần của repo:**
   - một trang tham chiếu duyệt được, có bìa và bản xem;
   - một dạng token máy đọc được, giữ đúng giá trị;
   - hệ được đánh dấu mặc định thì Claude dùng cho mọi bản trình chiếu và thiết kế.

   Ba điều ấy hợp nhất với cầu nối ra ở ổ bàn giao (mục 10.4): sổ sinh hệ, Claude trình bày và dùng hệ.

5. **Đo lại** khi loại artifact đổi bản phát hành, khi thử lối «đồng bộ từ code» hay `/design-sync`, hoặc khi cầu
   nối vào (mục 10.3) tính được nấc `calc()` và giữ được quan hệ.

## Consequences

- Câu hỏi cho chủ repo: giữ hệ của Claude là khuyến nghị mặc định ở cả bốn ổ, hay chỉ ở ổ bàn giao và tài sản thương
  hiệu, còn ổ hướng đi và ổ nền khuyến nghị lối của plugin rồi xuất sang hệ của Claude.
- Cầu nối vào (mục 10.3) phải tự tính nấc `calc()` và dựng lại quan hệ «theo» từ sổ, vì hệ của Claude không mang
  chúng. Cầu nối ra (mục 10.4) phải xuất quan hệ thành bí danh `{token}`, vì ngữ pháp của hệ có bí danh.
- Số chỗ tự quyết là tự khai của một tác tử đóng cả hai vai. Một lượt có người thứ hai đếm lại sẽ làm số ấy chắc hơn.
- Hai artifact của lượt đo còn trên tài khoản của chủ repo cho tới khi chủ repo xoá.
