# Hành vi của màn hình

Mỗi tình huống có một câu trả lời. Dùng nó, đừng nghĩ ra cách khác.

## Trạng thái

Mỗi màn khai đủ các trạng thái trong `design/states.json`; màn không tải dữ liệu thì được miễn ở
đó, kèm lý do.

Một trạng thái hiện ra vì một điều kiện thật: yêu cầu đang chờ hoặc thất bại, kết quả rỗng, bộ lọc
không khớp, thao tác của người dùng. Không bao giờ vì một công tắc: một prop hay giá trị trên đường
dẫn chỉ có mặt để chọn trạng thái. Bài kiểm chọn điều kiện qua nguồn dữ liệu.

- **Đang tải (loading):** cho thấy hình dạng của nội dung sắp tới, không dùng vòng quay, bằng `Skeleton`.
- **Trống (empty):** nói rằng chưa có gì và mời làm việc đầu tiên, bằng `Empty` và một `Button`.
- **Lỗi (error):** nói điều gì hỏng và mời thử lại, bằng `Alert` với `variant="destructive"`.
- **Không tìm thấy (no results):** nói rằng tìm không ra và mời xoá bộ lọc, bằng `Empty` và một `Button`.
- **Đang lưu (saving):** giữ biểu mẫu trên màn và khoá nút gửi, bằng `Button` với `disabled`.
- **Xác nhận xoá (confirm delete):** gọi tên thứ sắp xoá và hỏi trước khi làm, bằng `Dialog`.
- **Xoá thất bại (delete failed):** giữ hộp thoại và mục đó, nói rằng chưa xoá được, bằng `Alert`.

## Báo cho người dùng

- **Lỗi của một ô hay một trường:** báo ngay tại ô đó.
- **Kết quả của một thao tác:** báo bằng toast, qua `notifyDone` trong `src/lib/notify.ts`. Màn
  không gọi thẳng thư viện toast, và không mở hộp thoại của trình duyệt.
- **Toast có nút thì ở lại** tới khi người dùng bấm nút đó hoặc bấm đóng. Toast không có nút tự
  tắt, và chỉ được tự tắt vì kết quả cũng đã thấy ngay trên màn.
- **Mỗi lúc một toast:** toast mới thay toast cũ, không xếp chồng.
- **Toast không là lối duy nhất:** việc nút trên toast làm được thì trên màn cũng làm được.
- **Sự cố của cả màn:** hiện ở chỗ của nội dung, như trạng thái lỗi ở trên.

## Đổi dữ liệu

Việc đảo được thì làm ngay, và toast báo kết quả kèm nút hoàn tác: thêm một mục. Việc không đảo
được thì hỏi trước, câu hỏi gọi tên thứ sẽ mất: xoá một mục.

## Thao tác thất bại

Thất bại thì báo ở nơi người dùng vừa làm, và không bao giờ im lặng.

- **Hộp thoại hay biểu mẫu còn mở:** báo ngay trong đó, giữ nguyên thứ người dùng đã nhập: xoá
  một mục thất bại.
- **Thao tác làm ngay:** báo bằng toast qua `notifyFailed` trong `src/lib/notify.ts`. Toast nói
  việc gì chưa xong rồi nói làm gì tiếp, có nút «Thử lại», không tự tắt và được đọc lên như một
  cảnh báo: thêm một mục thất bại.
- **Hoàn tác thất bại:** không bao giờ báo như đã hoàn tác. Thứ đó vẫn còn trên màn, toast nói
  vậy và mời thử lại.
- **Màn có thao tác làm ngay** khai thêm một trạng thái cho thao tác ấy thất bại trong
  `src/screens.ts`, để bài kiểm trình duyệt nhìn thấy cả toast.

## Kiểu màn

Mỗi màn thuộc đúng một kiểu màn. Mỗi kiểu có một trang trong `design/patterns/`: việc chính, thứ
tự các phần, lời văn, và màn mẫu để dựng theo. Đọc trang của kiểu trước khi dựng một màn thuộc
kiểu đó. Cần một kiểu mới thì viết trang của nó trước; đó là quyết định của người.

Mọi trạng thái của mọi màn được kiểm trên trình duyệt ở các bề rộng trong
`design/screen-sizes.json`: một vùng chính, một tiêu đề cấp một, không cuộn ngang, và kiểm
accessibility tự động. Bề rộng hẹp nhất là 320.

## Mật độ

Sản phẩm này là công cụ làm việc. Chữ dùng `text-sm`.

Dòng của bảng lấy chiều cao từ mật độ của bảng, màn không tự đặt: bảng ở mức thường (48 px) khi
mọi cột hiện đủ bề rộng tối thiểu, và ở mức dày (32 px) khi không đủ chỗ. Canh lề và bề rộng tối
thiểu của một cột lấy từ kiểu cột của trường; cột chữ co theo nội dung đang hiện, không quá độ dài
mẫu của kiểu (`design/column-types.json`). Dùng `TypedTable`,
`TypedRow`, `TypedHead`, `TypedCell` cho cột dữ liệu.
