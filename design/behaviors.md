# Hành vi của màn hình

Mỗi tình huống có một câu trả lời. Dùng nó, đừng nghĩ ra cách khác.

## Trạng thái

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

## Mật độ

Sản phẩm này là công cụ làm việc. Chữ dùng `text-sm`.

Dòng của bảng lấy chiều cao từ mật độ của bảng, màn không tự đặt: bảng ở mức thường (48 px) khi
mọi cột hiện đủ bề rộng tối thiểu, và ở mức dày (40 px) khi không đủ chỗ. Canh lề và bề rộng tối
thiểu của một cột lấy từ kiểu cột của trường (`design/column-types.json`). Dùng `TypedTable`,
`TypedRow`, `TypedHead`, `TypedCell` cho cột dữ liệu.
