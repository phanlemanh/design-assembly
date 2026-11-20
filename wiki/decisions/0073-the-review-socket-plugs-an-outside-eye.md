---
type: decision
title: "Ổ cắm soát thiết kế cắm một mắt soát ngoài, kèm số đo theo bốn thước"
links:
  - wiki/specs/0009-review-a-drawn-screen.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0072-an-eye-is-a-plug-the-harvest-belongs-to-the-socket.md
  - wiki/decisions/0071-the-review-command-draws-and-measures-before-any-eye.md
sources:
  - docs/trials/review-eye-on-a-planted-copy.md
  - plugins/design-assembly/references/plugs/design-critique.json
  - plugins/design-assembly/skills/review/SKILL.md
  - plugins/design-assembly/references/limits.json
  - "chủ repo, 2026-11-20: «Duyệt cả năm», đáp câu «Duyệt đề bài 0009 theo cả năm khuyến nghị?» (câu 1: cắm design-critique trước)"
  - "chủ repo, 2026-11-20: «Cho chạy (Khuyến nghị)», đáp câu cho chạy lượt thử mắt soát ngoài, ước tính khoảng 100 nghìn token"
---

# 0073 Ổ cắm soát thiết kế cắm một mắt soát ngoài

## Status

Accepted, 2026-11-21. Tiêu chí 10 của đề bài 0009, mục 5.2. Phích được cắm là skill mà tệp
`references/plugs/design-critique.json` nêu, theo câu 1 chủ repo đã đáp.

## Context

Đề bài 0008 đặt luật: mỗi phích ngoài được cắm kèm một bản quyết định có số đo theo bốn thước (giữ được không, người
dùng phải đoán mấy chỗ, chạy được ở đâu, tốn bao nhiêu), đo trên bản sao. Quyết định 0072 dựng chỗ cắm: hợp đồng phát
hiện, phần gặt, và skill `review` gọi mắt qua bảng ổ cắm. Số đo dưới đây đến từ một lượt thử
([docs/trials/review-eye-on-a-planted-copy.md](../../docs/trials/review-eye-on-a-planted-copy.md)): màn mẫu của đề
chuẩn trên một bản sao bỏ đi, cài năm chỗ phạm, một chỗ máy đo được và bốn chỗ chỉ mắt thấy.

## Decision

1. **Cắm mắt soát ngoài vào phần «nhìn» của ổ cắm; phích mặc định vẫn là lệnh `review`.** Lệnh chạy được khi không
   cài thêm gì và giữ phần chụp, đo, gặt. Mắt soát chỉ làm phần nhìn, và chỉ ở nơi phiên có skill ấy.
2. **Số đo theo bốn thước:**
   - **Giữ được:** tệp phát hiện tác tử ghi từ lời skill được nhận ở lượt chạy đầu, không bị từ chối. 4 trên 14 phát
     hiện của mắt nối được với điều repo đã quyết (3 dòng sổ, 1 dòng trang luật); 10 không dựa vào gì và về «cần mắt
     người». Không phép kiểm nào giữ lời mắt nói: 2 phát hiện tương phản của mắt bị số đo của máy bác (4,5:1 và 5,3:1
     khi mức đòi 4,5:1) mà phần gặt vẫn xếp vào nhóm lỗi lọt.
   - **Đoán mấy chỗ:** mắt thấy 5 trên 5 chỗ cài, không bỏ sót chỗ nào; máy chỉ thấy 1. Mắt nêu thêm 9 điều: 2 bị số đo
     bác, 1 trái một luật repo đã viết, 6 chưa ai phân xử được. Khi chép lời skill vào tệp, tác tử tự quyết 26 chỗ
     (14 vị trí ước lượng, 5 lần chọn `rests_on`, 3 lần chọn ảnh, 2 mức hạ, 1 bảng đổi mức, 1 lần tách).
   - **Chạy được ở đâu:** trong phiên của người dùng có cài skill ấy; không cần tài khoản, khoá hay mạng; hình không ra
     khỏi phiên. Ảnh vẫn cần nền dựng và trình duyệt của repo như lát 1.
   - **Tốn bao nhiêu:** khoảng 171 nghìn token của một tác tử con và khoảng 5 phút cho 5 ảnh; ước tính trước là khoảng
     100 nghìn, tối đa 150 nghìn, nên lượt thử vượt ước tính.
3. **Vì sao cắm.** Ở thước 2 mắt hơn hẳn máy trên đúng phần máy không làm được (4 chỗ chỉ mắt thấy, đều được thấy).
   Ở thước 3 nó đủ điều kiện, vì không cần tài khoản hay mạng. Ở thước 1 nó không tự đạt: chính phần gặt của Design
   Assembly mới giữ được lời nó, đúng chỗ chia của đề bài 0008, nên nó là phích của phần nhìn, không phải mặc định của
   ổ cắm.
4. **Đo lại khi skill ngoài đổi bản**, và khi một trong ba giới hạn mới dưới đây được sửa.

## Consequences

- Ba dòng giới hạn mới, vùng `review`: `review-eye-and-measure-not-merged` (một chỗ phạm máy và mắt cùng thấy thành
  hai phát hiện, hai dòng sổ lỗi lọt), `review-rule-line-held-read-from-its-section` (một dòng trang luật ngoài mục
  «No check holds these» bị coi là cổng giữ, dù không phép kiểm nào phán được nó, như lời một mô tả lỗi nói gì), và
  `review-eye-contrast-not-checked-against-the-measure` (phát hiện tương phản của mắt không được đối chiếu với số đo
  của máy).
- Dòng `capability-design-review-eye-unheld` (quyết định 0072) đúng như lượt thử thấy: mắt và người chép lời nó là
  cùng một tác tử, skill không nói theo dạng của tệp, và lời khen hay ấn tượng chung của skill không có chỗ trong tệp.
- Lượt thử không thành câu hỏi nào cho hàng chờ: kho này chưa có nguyên tắc chủ repo đã chốt trong bản thiết kế, và
  mắt không nối điểm nào với một dòng không phép kiểm nào giữ. Nhóm câu hỏi của phần gặt mới được chứng bằng bài kiểm
  viết tay, chưa bằng một mắt thật.
- Một lượt, một màn, một mắt: số đo này chưa nói gì về một repo sản phẩm thật (`review-run-on-no-real-product`).
