# Mắt soát ngoài trên một bản sao có cài chỗ phạm (mục 5.2, tiêu chí 10)

Một lượt, ngày 2026-11-20 sang 2026-11-21, chủ repo cho chạy («Cho chạy») sau khi nghe ước tính. Bản quyết định đi
kèm: [0073](../../wiki/decisions/0073-the-review-socket-plugs-an-outside-eye.md).

## Cách làm

- **Bản sao bỏ đi.** `git archive` của nhánh này, đặt trong thư mục nháp của phiên, thư mục gói cài trỏ về kho này.
  Màn là màn mẫu `reference`: danh sách mục của đề chuẩn dựng màn (`briefs/screen.md`).
- **Năm chỗ phạm cài sẵn**, một chỗ máy đo được và bốn chỗ chỉ mắt thấy:

  | Mã  | Chỗ phạm                                                                 | Ảnh thấy được |
  | --- | ------------------------------------------------------------------------ | ------------- |
  | P1  | Dòng mô tả của mọi trạng thái thay bảng nhạt màu (chữ xám rất nhạt)      | trống, lỗi    |
  | P2  | Tiêu đề màn nhỏ và mảnh hơn chữ của bảng                                 | mọi ảnh       |
  | P3  | Mô tả của trạng thái lỗi chỉ còn «Lỗi.», không nói làm gì tiếp           | lỗi           |
  | P4  | Nút của trạng thái trống viết tiếng Anh, «Add item», giữa giao diện Việt | trống         |
  | P5  | Nút «Xoá» của mỗi dòng thành nút đỏ đặc, át mọi thứ khác trên màn        | sẵn sàng      |

- **Máy chụp và đo trước**: `review reference --states --out` cho 48 ảnh và 4 phát hiện (P1, cùng ba chỗ tương phản ở
  giao diện tối mà kế hoạch đang gác). Máy không gọi mô hình.
- **Mắt soát**: một tác tử con mới, không biết danh sách chỗ phạm, làm theo mục 6 của skill `review`: đọc `eyes`, tìm
  trong phiên skill có tên bảng ổ cắm nêu, đưa nó 5 ảnh (sẵn sàng 320 và 1440 sáng, trống 1440 sáng, lỗi 1440 sáng,
  sẵn sàng 1440 tối) cùng gói soát, ghi tệp phát hiện, chạy phần gặt. Không đọc mã của bản sao.

## Đếm

| Điều đếm                                          | Số                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Chỗ phạm mắt thấy                                 | 5 trên 5 (P1 cao, P2, P3, P4 vừa, P5 thấp)                                                                                     |
| Chỗ phạm mắt bỏ sót                               | 0                                                                                                                              |
| Chỗ phạm máy đo thấy                              | 1 trên 5 (P1)                                                                                                                  |
| Phát hiện khác của mắt, không phải chỗ cài        | 9                                                                                                                              |
| … trong đó số đo của máy nói không phải lỗi       | 2 (huy hiệu «Đang dùng» tối 4,5:1, nút «Xoá» tối 5,3:1; mức AA đòi 4,5:1)                                                      |
| … trong đó trái một luật repo đã viết             | 1 (ba huy hiệu trông khác nhau: luật giao diện đòi các tình trạng phải khác nhau)                                              |
| … trong đó chưa ai phân xử được, để cho người     | 6 (cột tình trạng bị che ở 320, tiêu đề trạng thái trống, cỡ chữ cột tên, lề đầu trang lệch, ô lọc trống, lỗi chỉ bằng màu đỏ) |
| Lượt chạy phần gặt tới khi tệp được nhận          | 1 (không bị từ chối)                                                                                                           |
| Phát hiện của mắt nối được với điều repo đã quyết | 4 trên 14 (3 dòng sổ, 1 dòng trang luật); 10 không dựa vào gì                                                                  |
| Chỗ tác tử tự quyết khi chép lời skill vào tệp    | 26: 14 vị trí ước lượng, 5 lần chọn `rests_on`, 3 lần chọn ảnh, 2 mức hạ vì giao diện tối, 1 bảng đổi mức, 1 lần tách          |
| Token của tác tử con                              | khoảng 171 nghìn (ước tính trước: khoảng 100 nghìn, tối đa 150 nghìn)                                                          |
| Thời gian                                         | khoảng 5 phút                                                                                                                  |

## Điều lộ ra

- Skill soát không chạy riêng: nó là lời dặn nạp vào ngữ cảnh của chính tác tử, nên con mắt và người chép lời nó là
  một. «Không thêm không bớt» không kiểm được.
- Skill không nói theo dạng của tệp phát hiện: nó dùng ba mức của riêng nó, không nêu ảnh hay vị trí cho từng điểm.
  Bảng đổi mức, ảnh và vị trí đều do tác tử.
- Lời khen và ấn tượng chung của skill không có chỗ trong tệp.
- Phát hiện của mắt trùng chỗ với phát hiện của máy (P1) thành hai phát hiện và hai dòng sổ lỗi lọt.
- Hai phát hiện tương phản tối của mắt dựa vào dòng `color-contrast`, nên phần gặt xếp chúng vào nhóm lỗi lọt, dù máy
  đã đo đúng hai chữ ấy đạt mức.
- Dòng trang luật về lời báo lỗi (dòng 38) nằm ngoài mục «No check holds these», nên phần gặt coi là cổng giữ và in
  dòng sổ lỗi lọt; không phép kiểm nào phán được lời một mô tả nói gì.
- Không phát hiện nào thành câu hỏi: gói soát của kho này không có nguyên tắc chủ repo đã chốt, và mắt không nối điểm
  nào với một dòng của mục «No check holds these».

Ba điều có dòng giới hạn mới: `review-eye-and-measure-not-merged`, `review-rule-line-held-read-from-its-section`,
`review-eye-contrast-not-checked-against-the-measure`. Ảnh và tệp phát hiện của lượt thử nằm ngoài repo và không được
giữ: ảnh của repo không ra khỏi phiên.
