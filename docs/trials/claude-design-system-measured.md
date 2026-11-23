# Hệ «Design System» của Claude đo trên bản sao (mục 10.2, phích đầu tiên)

Một lượt, ngày 2026-11-23. Chủ repo cho đo («Cho đo Claude Design») sau khi nghe gửi gì, đi đâu và ước tính token. Giai
đoạn 10 chưa mở, nên lượt này ngoài kế hoạch, theo lời chủ repo. Bản quyết định đi kèm:
[0088](../../wiki/decisions/0088-claude-design-system-measured-on-four-measures.md).

## Cách làm

- **Bản sao bỏ đi** của kho này tại `7dac025`, dựng theo cách của vai dựng màn trong [README](README.md): bỏ
  `plugins/`, `docs/`, các bản quyết định và đề bài. Bản sao nằm trong thư mục nháp của phiên, không có `node_modules`.
- **Loại artifact** «Design System» của Claude, bản phát hành `1795227963-6081`.
- **Ai làm:** một tác tử con đóng vai «Claude của người dùng», chỉ theo hướng dẫn của loại artifact. Nó không được cài
  hay tải gì. Câu nào loại artifact sẽ hỏi người thì nó ghi câu và lời đáp nó tự giả định, rồi làm tiếp. Phiên điều
  phối đọc lại kết quả và đo phần máy đo được.
- **Ba việc:** (A) lập hệ từ code; (B) lập hệ từ số không với một thương hiệu bịa (một tên, một màu `#2F6F5E`, một font
  Inter, một câu về giọng); (C) đổi màu chính của hệ A sang `#2F6F5E`.
- **Gửi đi:** token màu, chữ, khoảng cách và bo góc của bản sao, tên linh kiện cùng hướng dẫn, một README do tác tử
  viết. Hai artifact riêng tư trên tài khoản của chủ repo. Không gửi `.env.example`, lịch sử git, tên hay địa chỉ thư
  của ai.

## Máy đo

Phiên điều phối đọc lại `project/tokens.json` của hệ A từ Claude rồi đối chiếu bằng một script với các biến của
`src/index.css` trong bản sao. Script không gọi mô hình.

| Đo gì                                       | Kết quả                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| Giá trị màu giao diện sáng                  | 45 trên 46 đúng từng ký tự; 1 khác là `primary`, do việc C đổi có chủ ý |
| Giá trị màu giao diện tối                   | 31 trên 31 đúng từng ký tự                                              |
| Biến thiếu trong hệ                         | 0                                                                       |
| Nấc bo góc viết bằng `calc()`               | 6 trên 6 bị bỏ, theo đúng luật của lối lập từ code                      |
| Linh kiện                                   | 6 trên 15 vào hệ: 4 có bản xem viết tay, 2 chỉ có hướng dẫn; 9 bị bỏ    |
| Tệp font                                    | 0; Geist chỉ có tên, bản xem dùng font dự phòng                         |
| Tệp `tokens.json` đọc được bằng script      | có: JSON theo một ngữ pháp viết ra, đối chiếu được không cần người      |
| Quan hệ «sidebar theo màu chính» của sổ     | mất: hệ chép giá trị, không chép quan hệ                                |
| Token của tác tử con, theo bộ đếm của phiên | 227 763; khoảng 9 phút, 33 lần gọi công cụ                              |

Tác tử tự ước khoảng 130 nghìn token. Bộ đếm của phiên đếm 227 763, nên bản ghi này dùng số của bộ đếm.

## Tác tử tự khai, chưa ai kiểm lại

- **34 chỗ tự quyết** mà hướng dẫn không định: 21 ở việc A (ví dụ: biến khai hai lần thì lấy khối sau; bỏ 31 biến
  bắc cầu của Tailwind; tự đặt 7 kiểu chữ và 6 nấc khoảng cách vì nguồn không khai; tự viết luật nội dung «không
  emoji, không chấm than»), 8 ở việc B, 5 ở việc C.
- **8 câu sẽ hỏi người:** 5 ở việc A, đều về «mang gì vào, lấy linh kiện nào, có dựng code không, thiếu font thì sao»;
  3 là lời mời làm tiếp. Không câu nào về hướng đi, nguyên tắc hay gu. Việc B không có câu nào, và mọi giá trị ngoài
  ba đầu vào (9 màu, 6 kiểu chữ, 4 nấc khoảng cách, 3 bo góc) do tác tử tự chọn.
- **58 giá trị bị bỏ, đổi hay làm gần đúng**, mỗi giá trị kèm bản gốc: 6 bo góc `calc()`, 31 biến bắc cầu, 10 giá trị
  ở khối khai đầu bị khối sau đè, tệp font, và các giá trị chỉ sống trong lớp Tailwind (độ trong, bóng, viền).
- **Đổi màu chính (việc C):** nút mặc định, nút dạng liên kết, nhãn mặc định và 4 khối của bìa đổi theo, chỉ ở giao
  diện sáng. Giữ màu xanh cũ: `primary` ở giao diện tối, `ring`, `sidebar-primary`, `sidebar-ring` ở cả hai giao diện
  (viền focus vẫn xanh), 14 sắc độ của bảng màu, 6 ô của bìa, ghi chú của token, hai dòng README và câu trên bìa.
  Không gì báo. Nguyên do một phần là chỗ tự quyết số 3: tác tử chép giá trị y như stylesheet thay vì đặt bí danh theo
  quan hệ «theo» của `design/theme.json`.

## So với lần thử tay ngày 2026-11-20

- Giá trị màu nay vào đủ và đúng từng ký tự. Lần trước không đo được điều này bằng máy.
- Sáu nấc bo góc `calc()` vẫn bị bỏ. Bài học 4 của [lần thử tay](outside-tools-hands-on.md) đứng nguyên.
- Đổi một quyết định vẫn không lan, và vẫn không gì báo. Bài học 1 và 2 đứng nguyên.
- Lập hệ từ số không vẫn tự chọn gần hết giá trị, không trình hướng nào cho người chọn.

## Giới hạn

- Một tác tử đóng cả hai vai. Số chỗ tự quyết là tự khai, chưa có người thứ hai đếm lại.
- Chưa mở trang của hai hệ trong trình duyệt: bìa và bản xem chưa được nhìn ở giao diện nào.
- Chưa thử: lối dựng code thật, `/design-sync` và chế độ «đồng bộ từ code» của loại artifact, việc một người sửa token
  ngay trên trang.
- Phía plugin không đo lại ở lượt này; số của nó lấy từ [đề bài 0008](../../wiki/specs/0008-capabilities-sockets-and-plugs.md)
  và lần thử tay ngày 2026-11-20.
- Nhật ký đầy đủ của tác tử (`log.md`, `log.json`) và tệp đọc về nằm trong thư mục nháp của phiên, không được giữ. Hai
  artifact còn trên tài khoản của chủ repo cho tới khi chủ repo xoá: «Trial A — from code (2026-11-23)» và «Trial B —
  from zero (2026-11-23)».
