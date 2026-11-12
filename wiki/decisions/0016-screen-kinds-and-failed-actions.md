---
type: decision
title: Kiểu màn, cỡ màn được kiểm, và thao tác thất bại
links:
  - wiki/decisions/0014-channels-and-undo.md
  - wiki/decisions/0015-rules-page-and-rows-without-a-check.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/screens.mjs
  - plugins/design-assembly/templates/owned/templates.spec.ts.template
  - plugins/design-assembly/scripts/apply.mjs
  - design/patterns/danh-sach.md
  - design/screen-sizes.json
  - src/lib/notify.ts
  - tests/failed-action.test.tsx
---

# 0016 Kiểu màn, cỡ màn được kiểm, và thao tác thất bại

## Status

Accepted. Chủ kho duyệt bộ khuyến nghị ngày 2026-11-12 («Làm tiếp»), sau khi máy đọc lại luật ở
kho đối chứng, cái sàn ở kho này, và tra chuẩn ngành tại nguồn. Nội dung trang kiểu màn «danh
sách» là máy đề xuất, chủ kho chưa xác nhận; sổ ghi rõ điều đó.

## Context

Bậc templates còn 0/8, và tác tử dựng màn ở lần chạy thử ba đã phải đoán một thao tác làm ngay mà
thất bại thì báo thế nào (quyết định 0015, điều còn mở). Ở kho này, thêm một mục mà hỏng thì danh
sách lặng lẽ tải lại; hoàn tác hỏng cũng vậy. Kho đối chứng chỉ có luật cho mất mạng và lỗi của
một ô.

Nguồn đã đọc ngày 2026-11-12:

- W3C, WCAG 2.2: thông báo trạng thái (4.1.3, lỗi dùng vai trò cảnh báo), reflow (1.4.10, bề rộng
  320 CSS pixel, bảng dữ liệu được miễn còn phần quanh nó thì không), giới hạn thời gian (2.2.1,
  một nút chỉ có trên thông báo tự tắt là một giới hạn thời gian). W3C APG: mỗi trang một vùng
  chính. Hướng dẫn tiêu đề của W3C không bắt buộc đúng một tiêu đề cấp một; đó là quy ước của sàn.
- Material Design 3, snackbar: thông báo có nút ở lại tới khi bấm hoặc đóng; trên web, thông báo
  tự tắt cần cùng nội dung hiện cạnh nơi thao tác; không là lối duy nhất tới một việc cốt lõi; mỗi
  lúc một thông báo.
- Carbon: toast có nút ở lại tới khi đóng; thông báo nghiêm trọng không tự tắt.
- Shopify App Bridge, toast: toast dùng được cho lỗi không chặn việc; nút cho hoàn tác hoặc thử lại.
- Nielsen Norman: lỗi hiện gần nơi phát sinh, giữ thứ người dùng đã làm, kèm cách sửa.
- Atomic Design: template là bố cục, trang thật là thứ thử bố cục ấy.

## Decision

Thao tác thất bại (`failed-action`, câu hỏi mới của danh mục, ngoài lõi):

1. Thất bại báo ở nơi người dùng vừa làm. Hộp thoại hay biểu mẫu còn mở thì báo trong đó; thao
   tác làm ngay thì báo bằng toast qua `notifyFailed`.
2. Toast báo thất bại không tự tắt, nói việc gì chưa xong rồi nói làm gì tiếp, có nút thử lại, và
   được đọc lên như một cảnh báo.
3. Hoàn tác thất bại không bao giờ báo như đã hoàn tác.
4. Toast có nút thì ở lại, kể cả toast báo thành công kèm hoàn tác. Mỗi lúc một toast.
5. Toast không là lối duy nhất; toast không nút chỉ tự tắt vì kết quả đã thấy trên màn.
6. Màn có thao tác làm ngay khai một trạng thái cho thao tác ấy thất bại.

Bậc templates:

7. Câu trả lời đặt theo **kiểu màn**, không theo từng màn. Mỗi kiểu một trang trong
   `design/patterns/`, đúng định dạng kit nghiệm thu đang đọc, để một trang phục vụ cả hai công
   cụ. Kịch bản không bao giờ viết trang ấy: kiểu màn để làm gì là việc quyết với người.
8. Máy giữ ba điều: mỗi màn thuộc đúng một kiểu và trang của kiểu nêu việc chính
   (`page-layouts`); màn mẫu của kiểu là một màn thật thuộc kiểu đó, khai đủ trạng thái
   (`reference-implementation`); các bề rộng được kiểm xuống tới 320 và bài kiểm trình duyệt đọc
   chúng (`test-screen-sizes`).
9. Plugin mang theo một bài kiểm trình duyệt có gắn thẻ, kho sở hữu sau khi cài. Nó kiểm một vùng
   chính và một tiêu đề, không cuộn ngang, accessibility, trên mọi trạng thái của mọi màn ở mọi bề
   rộng đã khai. Ba dòng sổ trỏ tới nó, ở mức «tự khai».
10. Việc chính, thứ tự thông tin, lời văn là phán xét của người: ghi vào sổ, không có lệnh kiểm,
    kèm ghi chú rằng chưa ai xác nhận.

## Consequences

- Kho này đáp 36/38 quyết định lõi (trước là 28): 13 máy giữ, 17 tự khai, 6 đã ghi. Bậc templates
  8/8, trong đó ba câu là «đã ghi» chờ chủ kho xác nhận và ba câu là «tự khai».
- Bài kiểm của kho 50 lên 58; lượt kiểm trình duyệt 16 lên 40; bài kiểm của plugin 132 lên 148.
- **Một lỗi thật lộ ra nhờ trạng thái mới:** nút chính khi rê chuột nhạt đi còn 4,33:1, dưới
  ngưỡng 4,5:1. Trước đây không trạng thái nào để con trỏ nằm trên nút. Đã sửa ở nút và nhãn
  (mức phủ 80% lên 90%, được 5,15:1).
- Toast giờ nằm trong tầm bài kiểm trình duyệt, vì hai trạng thái thất bại hiện nó.
- Ở kho này accessibility được kiểm hai lần, bởi sàn và bởi bài của plugin: cổng chậm thêm
  khoảng năm giây.
- Bài kiểm chung của sàn (`tests/App.test.tsx`) giờ dựng cả toast bên cạnh màn và chờ nút xuất
  hiện, như ứng dụng và bài kiểm trình duyệt vẫn làm.

Giới hạn:

- **Không lệnh kiểm nào đọc được luật thất bại từ mã nguồn.** Nó được giữ bằng bài kiểm của kho
  có gắn thẻ, mức «tự khai». Một màn nuốt lỗi vẫn lọt nếu không ai khai trạng thái thất bại cho nó.
- **Tương phản của nút khi rê chuột không được lệnh kiểm của plugin đo.** Lần này bài kiểm trình
  duyệt bắt được vì con trỏ tình cờ nằm trên nút. Kho khác dùng màu sinh ra vẫn có thể dính.
- **Mất mạng đi chung luật thất bại**; kho này chưa có băng báo sự cố của cả màn.
- **Adopt chưa nhận trang kiểu màn**: nó chỉ nhận ba dòng trỏ tới bài kiểm trình duyệt có thẻ.
- **Màn mẫu theo nghĩa của plugin phải là một màn thật trong sổ màn.** Kho đối chứng đang để ở
  khoá đó một trang mẫu của khuôn, và ghi màn mẫu ở phần thân trang. Hai cách hiểu chưa ai phân xử.
- Trang kiểu màn chỉ được kiểm phần đầu trang; thứ tự thông tin và lời văn ở phần thân không ai
  kiểm.
- Material và Shopify chỉ đọc được ở lượt thứ hai, sau khi chủ kho đưa đường dẫn; trang toast cũ
  của Polaris đã chuyển chỗ và không đọc.
- Các sửa đổi này chưa được tác tử độc lập thử.
