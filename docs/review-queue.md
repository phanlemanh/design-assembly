# Việc chờ chủ repo xem

Gom ngày 2026-11-14, theo quyết định [0032](../wiki/decisions/0032-review-after-stage-two-and-stage-three-recut.md).
Mỗi dòng trả lời được bằng một chạm: **Giữ** hoặc **Bác**. Bác thì nói thêm một câu muốn đổi thế
nào. Dòng nào đã trả lời thì xoá khỏi trang này và ghi lời đáp vào bản ghi quyết định của nó.

Máy không tự đánh dấu dòng nào là đã duyệt.

## A. Điều máy đã chọn và đã dựng, chờ bác

| #   | Điều máy chọn                                                                              | Ở đâu | Bác thì phải làm gì                                |
| --- | ------------------------------------------------------------------------------------------ | ----- | -------------------------------------------------- |
| A1  | Khung ứng dụng: thanh điều hướng nằm trên đầu, tên ứng dụng bên trái                       | 0025  | Dựng lại khung                                     |
| A2  | Màn thứ hai của ứng dụng mẫu là «mục quá hạn»                                              | 0025  | Đổi màn mẫu thứ hai                                |
| A3  | Chuyển màn không tải lại trang                                                             | 0027  | Khó bác: dữ liệu mẫu sẽ quên việc vừa làm          |
| A4  | Hoàn tác đưa một dòng quay lại thì tiêu điểm vào đúng nút của dòng đó                      | 0027  | Đổi luật tiêu điểm và bài kiểm                     |
| A5  | Dòng đang xoá hiện vòng quay thay cho chữ, vì chữ «Đang xoá» rộng quá 2px ở bề rộng 320    | 0027  | Phải tìm cách khác cho bề rộng 320                 |
| A6  | Plugin cài sẵn khung ứng dụng và phần tải chung của màn danh sách cho repo mới             | 0028  | Gỡ hai phần khỏi bộ cài                            |
| A7  | Sổ token ghi màu bằng mã hex, giữ chữ oklch bên cạnh                                       | 0029  | Kit sẽ lại từ chối sổ token                        |
| A8  | Cấp của linh kiện (atom, molecule, organism) do máy tính từ độ sâu nhập, không ai khai     | 0029  | Thêm chỗ để người khai cấp                         |
| A9  | Sổ linh kiện liệt kê cả linh kiện riêng của repo, không chỉ thư viện                       | 0029  | Thu sổ về thư viện                                 |
| A10 | Mỗi màn ghi ở hai nơi: sổ màn (có gì) và mã (đi tới bằng cách nào)                         | 0030  | Quay lại một nơi; lỗi đọc nhầm trạng thái trở lại  |
| A11 | Repo được thêm khoá riêng vào sổ màn (ví dụ vai nào được mở màn)                           | 0030  | Sổ màn của Inventory sẽ lệch hình dạng ở nhiều chỗ |
| A12 | Năm loại bộ chuyển; trình duyệt tách khỏi nền dựng                                         | 0031  | Gộp lại thành bốn loại                             |
| A13 | Cách xếp 111 giới hạn đang mở vào ba ngăn: 55 sẽ sửa, 50 chấp nhận, 6 chuyển cho repo khác | 0024  | Chuyển ngăn từng dòng                              |

## B. Điều chưa bao giờ được duyệt

| #   | Điều cần duyệt                                                                                | Máy khuyến nghị                                     |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| B1  | Kiến trúc tổng thể của lớp meta (tài liệu kiến trúc). Mới chốt ba điều và chín câu            | Duyệt sau lát đầu trên Inventory, khi đã có số thật |
| B2  | Bộ chỉ số đo hiệu quả                                                                         | Duyệt cùng B3 và B4                                 |
| B3  | Đổi chỉ số chính sang «luật bị phạm, có so với không có trang luật»; số chỗ đoán thành số phụ | Giữ đề xuất                                         |
| B4  | Thang bốn nấc ở Inventory: sổ đúng hình dạng, câu lõi máy giữ, công cụ được thay, bậc của kit | Giữ đề xuất                                         |
| B5  | Ngừng thêm luật bằng lời ở repo này; chỉ sửa 14 giới hạn nguy hiểm khi Inventory đụng tới     | Giữ đề xuất                                         |

## C. Câu còn mở từ trước

| #   | Câu hỏi                                                                                                 | Máy khuyến nghị                                         |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| C1  | Màn mẫu của một kiểu màn là màn thật trong sổ màn (plugin hiểu vậy) hay trang mẫu riêng (Inventory ghi) | Màn thật; sẽ phải chốt khi Inventory nhận sổ màn        |
| C2  | Có ghim màu thương hiệu của repo được nhận không                                                        | Có: hôm nay đổi sang màu khác vẫn qua nếu đủ tương phản |
| C3  | Ba tờ cuối của cuốn sổ bàn giao (kiểu màn, đường đi, trạng thái) chưa được xem                          | Xem một lượt; chỉ mắt người chấm được                   |
| C4  | Phần thêm vào trang kiểu màn «danh sách» sau ngày 2026-11-12 (luồng xoá, dòng tự chờ) là máy viết       | Xác nhận hoặc sửa                                       |
| C5  | Ngôn ngữ và đơn vị tiền của ứng dụng mẫu là máy suy ra                                                  | Xác nhận                                                |

## D. Việc chỉ chủ repo làm được

| #   | Việc                                                            |
| --- | --------------------------------------------------------------- |
| D2  | Cho phép từng bước ở Inventory, delivery-loop và Repo Standards |
| D3  | Cho phép chạy phép đo token chính thức (tốn tiền API)           |
