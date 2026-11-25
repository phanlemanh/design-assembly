---
type: decision
title: "Mobbin được đo ở ổ tham khảo, trên hai bản dựng dừng giữa chừng, và mục 10.2 tạm đóng"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0096-reui-measured-at-the-components-socket.md
  - wiki/decisions/0097-frontend-design-measured-at-the-screen-build-socket.md
  - docs/trials/mobbin-reference-measured.md
sources:
  - docs/trials/mobbin-reference-measured.md
  - docs/trials/briefs/reference.md
  - plugins/design-assembly/references/plugs/mobbin.json
  - plugins/design-assembly/references/limits.json
  - "chủ repo, 2026-11-25, gõ ở phiên điều phối: «Đo Mobbin xong rồi tạm đóng hạng mục này.»"
---

# 0109 Mobbin được đo ở ổ tham khảo, trên hai bản dựng dừng giữa chừng, và mục 10.2 tạm đóng

## Status

Accepted, 2026-11-25. Đây là phích thứ tư của mục 10.2, theo lời chủ repo: «Đo Mobbin xong rồi tạm đóng hạng mục này.»

Cùng lời ấy, Stitch, Open Design và Figma được gác lại, không đo. Mục 10.2 nay xong với bốn phích đã đo: Claude Design
(0088), ReUI (0096), frontend-design (0097) và Mobbin.

## Context

Ổ tham khảo không có phích nào của plugin (`capability-reference-has-no-plug`), nên nhánh đối chứng là plugin như hiện
có: không gom tham khảo nào trước câu chọn. Mobbin là một thư viện màn và luồng của sản phẩm thật, tìm qua máy chủ MCP
dưới tài khoản của người dùng.

Lượt đo cho hai tác tử mới cùng một đề, [`briefs/reference.md`](../../docs/trials/briefs/reference.md): chuẩn bị câu chọn
cách bày màn «lịch sử thay đổi của một mục». Nhánh M được tìm ba lần qua Mobbin.

Cả hai bị dừng trước khi xong, vì token đã sát trần của phiên điều phối. Số đo:
[docs/trials/mobbin-reference-measured.md](../../docs/trials/mobbin-reference-measured.md).

## Decision

1. **Phích `mobbin` nay là «đã đo» ở ổ tham khảo, `beats_plugin: false`.**
   - Lượt đo dừng giữa chừng, nên không cho thấy thắng được.
   - Những gì để lại trên đĩa cũng không cho thấy thắng, ở việc giữ quyết định lẫn ở việc người dùng phải đoán.
2. **«Thắng phích của plugin» ở một ổ không có phích của plugin** nghĩa là thắng plugin như hiện có. Phích ngoài thắng
   khi việc nó thêm vào giữ quyết định tốt hơn, hoặc làm người dùng đoán ít hơn. Ổ trống không tự làm nó thắng.
3. **Số đo theo bốn thước**, mỗi số nói rõ nó không cho thấy được gì vì lượt bị dừng:
   - **Giữ được không.** Sổ nguồn nhận một dòng `kind: reference` có ghim (ngày tìm và mã băm của kết quả), và cổng không
     đỏ vì dòng ấy. Nhưng:
     - plugin đọc nó như một thư viện khối;
     - không gì hỏi chủ repo giữ tham khảo nào;
     - sửa bản chụp đã ghim thì cổng vẫn xanh.

     Cổng của bản dựng dở: nhánh P xanh, nhánh M đỏ vì một liên kết của trang quyết định. Đó không phải kết quả của
     nhánh nào.

   - **Người dùng phải đoán mấy chỗ.** Không đếm được, vì báo cáo của hai tác tử không còn. Cả hai câu hỏi đưa ba cách và
     khuyến nghị cùng một cách. Câu của nhánh M có tham khảo cho từng cách, nhưng thêm một chỗ máy quyết thay: tác tử tự
     giữ 11 trên 18 tham khảo.
   - **Chạy được ở đâu:** cần tài khoản Mobbin và mạng, nên là phích phụ theo luật của 0008.
     - Gửi đi chữ tìm cùng ba trường `platform`, `limit`, `mode`.
     - Công cụ còn mời gửi một câu tả việc đang làm; lượt này cấm, và tác tử không gửi.
     - Không gì của repo ra ngoài.
   - **Tốn bao nhiêu:**
     - tác tử P 219 344 token, tác tử M 236 989, phiên điều phối của lượt 203 718 tới lúc dừng: 660 051;
     - ước tính là 400 tới 600 nghìn, trần 800 nghìn;
     - phần viết bản ghi đưa tổng lên quá trần ấy; phiên điều phối cho tới 820 nghìn, và số cuối ở mô tả PR.
4. **Theo luật chọn của 0008, ổ tham khảo vẫn không có phích mặc định.** Mobbin vẫn được bày, có nhãn «đã đo», và chủ repo
   vẫn chọn được nó.
5. **Đo lại** khi plugin có một loại `reference` trong sổ nguồn và hỏi chủ repo giữ tham khảo nào, hoặc khi có tiền để
   chạy trọn hai nhánh.

## Consequences

- Hai dòng giới hạn mới: `reference-row-read-as-a-block-library` và `reference-kept-without-the-owners-pick`.
- Dòng có sẵn `library-pin-not-held-by-the-gate` nay có thêm chỗ thấy, ở Mobbin.
- Kế hoạch:
  - mục 10.2 xong;
  - Stitch, Open Design và Figma vào `parked`, với lời chủ repo và ngày 2026-11-25;
  - mục 10.4 và hai giai đoạn 10, 11 không đổi; chúng đóng trong một thay đổi sau.
- Không đổi script hay mẫu của plugin, nên không lên bản. Một bài kiểm của `plugs` đổi theo nhãn mới: nay 8 ổ có phích ngoài đã đo.
