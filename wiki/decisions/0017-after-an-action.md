---
type: decision
title: Sau một thao tác — tiêu điểm, danh sách đổi tại chỗ, trạng thái trống, đi lại giữa các màn
links:
  - wiki/decisions/0016-screen-kinds-and-failed-actions.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - src/example/ReferenceScreen.tsx
  - src/lib/notify.ts
  - src/lib/slow.ts
  - tests/focus-after-action.test.tsx
  - plugins/design-assembly/templates/owned/templates.spec.ts.template
  - design/behaviors.md
  - design/patterns/danh-sach.md
---

# 0017 Sau một thao tác: tiêu điểm, danh sách đổi tại chỗ, trạng thái trống, đi lại giữa các màn

## Status

Accepted. Chủ kho duyệt bốn khuyến nghị ngày 2026-11-12 («Làm tiếp»), sau lần chạy thử thứ tư.

## Context

Ở lần chạy thử thứ tư, tác tử dựng màn làm xong việc nhưng phải đoán bốn chỗ mà trang kiểu màn
và trang hành vi chưa nói: liên kết sang màn khác đặt ở đâu; một dòng rời danh sách thế nào và
tiêu điểm về đâu; hoàn tác mà kết quả nằm ở màn khác; trạng thái trống ở màn không tạo được gì.

Nguồn đã đọc ngày 2026-11-12:

- W3C APG, hướng dẫn bàn phím: xoá một mục thì đặt tiêu điểm vào mục kế; nếu không, trình duyệt
  đẩy tiêu điểm ra phần thân trang, tức là mất tiêu điểm.
- W3C WCAG 2.2: điều hướng lặp lại giữ cùng thứ tự ở mọi trang (3.2.3); mỗi trang tới được bằng
  hơn một lối, kể cả ở bộ trang nhỏ (2.4.5). Tiêu chí thứ tự tiêu điểm (2.4.3) không có luật chung
  cho nội dung bị gỡ.
- Material Design 3, navigation rail: điều hướng nằm ở mép cửa sổ, ngoài phần nội dung; chỉ đánh
  dấu một mục đang mở.
- Carbon, trạng thái trống: tiêu đề và câu giải thích là lõi, nút là tuỳ chọn; đừng dẫn vào ngõ
  cụt; đừng đưa nội dung của vùng khác vào.
- Nielsen Norman: trạng thái trống nói vì sao trống và cách lấp đầy; ba mốc thời gian phản hồi
  0,1, 1 và 10 giây.
- Kho đối chứng: điều hướng nằm ở khung ứng dụng, đầu trang chỉ có tiêu đề và việc chính; trạng
  thái trống có lý do, nút là tuỳ chọn.

Không tìm thấy nguồn nào nói riêng về hoàn tác xuyên màn; luật đó suy từ quyết định 0016.

## Decision

1. **Tiêu điểm không bao giờ rơi vào khoảng không** (`focus-after-action`, câu hỏi mới của danh
   mục, ngoài lõi). Phần tử vừa dùng mà rời trang thì tiêu điểm sang cùng nút ở dòng kế, rồi dòng
   trước, rồi nút của trạng thái hiện thay bảng, rồi tiêu đề màn. Nút đang chờ trả lời bị khoá
   nhưng vẫn giữ tiêu điểm. Nút trên toast trả tiêu điểm về nơi người dùng đang đứng.
2. **Một mục thay đổi thì danh sách đổi tại chỗ.** Dòng ở yên tới khi có trả lời. Đang tải chỉ
   dành cho lần tải đầu và lần thử lại. Dưới một giây không báo; từ một giây nút nói nó đang làm.
3. **Hoàn tác đưa về chỗ cũ, không hiện thêm toast**, và ở lại màn nơi thao tác được làm. Hoàn
   tác thất bại nói thứ đó hiện đang ở đâu.
4. **Trạng thái trống** nói vì sao trống và mục tới bằng cách nào; có nút chỉ khi làm được việc
   lấp đầy ngay tại màn.
5. **Đi lại giữa các màn** thuộc về khung ứng dụng, không thuộc về từng màn. Kho này mới có một
   màn nên chưa dựng khung.

Máy giữ điều 1: bài kiểm trình duyệt của plugin kiểm, ở mọi trạng thái đến sau một thao tác, rằng
vẫn có phần tử giữ tiêu điểm khi trang đã yên. Bốn điều còn lại là lời văn cho người và tác tử;
trang luật để lại ở kho xếp chúng dưới một mục ghi rõ «không lệnh kiểm nào giữ».

## Consequences

- **Phép kiểm mới bắt ngay bốn trạng thái của màn mẫu đang làm mất tiêu điểm**: đang xoá, xoá thất
  bại, thêm thất bại, hoàn tác thất bại. Nguyên do: nút bị khoá theo cách rơi khỏi bàn phím, nút
  bị vẽ lại khi cả danh sách tải lại, và toast biến mất mang tiêu điểm theo. Đã sửa cả bốn.
- Màn mẫu đổi hành vi: thêm mục không còn đưa danh sách về đang tải; trạng thái trống ở yên, nút
  bị khoá, và từ một giây thì nút ghi «Đang thêm». Màn mẫu khai thêm trạng thái này.
- Nút của bộ linh kiện sàn nhận thêm dáng «bị khoá» cho trường hợp vẫn giữ tiêu điểm.
- Bài kiểm của kho 58 lên 68; lượt kiểm trình duyệt 40 lên 44; bài kiểm của plugin giữ 150.
- Kho đáp 36/38 quyết định lõi như trước; ngoài lõi thêm một câu «tự khai».

Giới hạn:

- **Phép kiểm chỉ biết có phần tử giữ tiêu điểm, không biết có đúng phần tử không.** Tiêu điểm
  nhảy về đầu trang vẫn qua. Thứ tự «dòng kế, dòng trước, nút trạng thái» được giữ bằng bài kiểm
  của kho cho riêng màn mẫu.
- Phép kiểm chỉ nhìn các trạng thái có bước bấm nút trong sổ màn. Thao tác không được khai thành
  trạng thái thì không ai nhìn.
- Điều 2 đến 5 không có lệnh kiểm.
- Khung điều hướng chưa dựng: luật ở điều 5 chưa có bản cài đặt đối chứng.
- Kho khác đã có màn từ trước có thể đỏ ngay khi nhận bài kiểm này. Đó là lỗi thật của màn, và
  hướng dẫn giờ nói trước điều đó.
- Các sửa đổi này chưa được tác tử độc lập thử.
