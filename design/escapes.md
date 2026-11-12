# Sổ lỗi lọt

Mỗi lỗi lọt qua mọi lệnh kiểm, rồi được người hoặc một lệnh kiểm về sau tìm ra, ghi một dòng: tầng
nào đáng ra phải chặn (context, foundations, components, patterns, content, templates hoặc
governance), và đã làm gì. Ghi trước khi sửa. Lệnh kiểm của kho (`make design-assembly`) đọc tệp
này: mỗi dòng phải có ngày, tầng và việc đã làm.

| Ngày       | Lỗi                                                                                                                            | Tầng đáng ra phải chặn | Việc đã làm                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------- |
| 2026-11-12 | Thêm một mục mà hỏng thì màn lặng lẽ tải lại, không báo gì; hoàn tác hỏng cũng vậy                                             | patterns               | Luật thao tác thất bại và bài kiểm của kho có gắn thẻ (quyết định 0016)                  |
| 2026-11-12 | Nút chính khi rê chuột chỉ còn 4,33:1, dưới ngưỡng 4,5:1                                                                       | foundations            | Sửa mức phủ ở nút và nhãn. Còn mở: lệnh kiểm tương phản chưa đo trạng thái rê chuột      |
| 2026-11-12 | Lệnh kiểm cỡ màn chỉ tìm tên tệp trong bài kiểm trình duyệt, nên một dòng chú thích cũng đủ qua                                | templates              | Lệnh kiểm giờ đọc mã, bỏ chú thích, và đòi bài kiểm đi qua các bề rộng                   |
| 2026-11-12 | Bốn trạng thái của màn mẫu làm mất tiêu điểm: đang xoá, xoá thất bại, thêm thất bại, hoàn tác thất bại                         | patterns               | Phép kiểm tiêu điểm trong bài kiểm trình duyệt, và sửa màn mẫu (quyết định 0017)         |
| 2026-11-12 | Audit nói «không còn gì để làm» khi trang kiểu màn chưa có, và không nêu những câu «đã ghi» mà chưa ai xác nhận                | governance             | Audit giờ nêu tên cả hai                                                                 |
| 2026-11-12 | Công thức «liên kết trông như nút» trong trang luật giao diện của sàn vẽ ra nút không viền; tác tử dựng màn thấy bằng ảnh      | components             | Chưa sửa: trang đó là của Repo Standards. Ghi ở đây để không mất                         |
| 2026-11-12 | Chữ phụ trên nền phụ (muted-foreground trên muted) ở chế độ sáng chỉ đạt 4,34:1, dưới ngưỡng 4,5:1; cuốn sổ bàn giao làm lộ ra | foundations            | Chưa sửa: giá trị là của sàn. Còn mở: lệnh kiểm tương phản mới giữ hai cặp của màu chính |
