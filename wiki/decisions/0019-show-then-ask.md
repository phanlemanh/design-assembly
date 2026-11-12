---
type: decision
title: Chọn bằng mắt, giữ bằng máy — bảng mẫu cho tầng foundations
links:
  - wiki/decisions/0004-output-and-vocabulary.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/scripts/specimen.mjs
  - plugins/design-assembly/references/source-colors.json
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/tests/test-specimen.mjs
---

# 0019 Chọn bằng mắt, giữ bằng máy: bảng mẫu cho tầng foundations

## Status

Accepted cho lát đầu. Chủ kho nêu hướng ngày 2026-11-12: dẫn dắt như Repo Standards, thị giác
quan trọng hơn từ ngữ, một cố vấn hàng đầu dẫn qua từng hạng mục bằng thị giác nhưng vẫn thoả mãn
sự tất định. Máy đóng khung thành bốn điều kiện dưới đây và chủ kho duyệt dựng lát đầu («Làm
tiếp»). Lát này chỉ nghiệm thu được bằng một lượt chủ kho tự đi qua; lượt đó chưa diễn ra.

## Context

Cuộc dẫn dắt hỏi màu bằng mã, thang chữ bằng tên tỉ lệ, bo góc bằng tên nấc, và trả lời bằng tỉ
số tương phản. Chủ kho phải hỏi lại hai lần mới rõ «sáu câu chờ xác nhận» là gì. Kit nghiệm thu
của chủ kho đã có cùng nguyên tắc: duyệt giao diện trên bản bấm được, không duyệt bằng chữ.

So với cách dẫn dắt của Repo Standards, cuộc dẫn dắt này đã có nhịp đóng khung, phương án, ghi và
hai độ sâu; còn thiếu bước tinh chỉnh có nêu điều để ngỏ, độ sâu «mang sẵn thiết kế tới», phản
biện độc lập trước khi duyệt, và tờ hướng dẫn để lại.

## Decision

Bốn điều kiện để chọn bằng mắt mà vẫn tất định:

1. **Phương án do kịch bản dựng, không do mô hình vẽ.** Mỗi phương án là một giá trị trong danh
   sách đóng (sáu màu khởi đầu, năm tỉ lệ thang chữ, sáu nấc bo góc) hoặc một đầu vào của công
   thức. Cùng đầu vào thì ra cùng bảng mẫu.
2. **Mọi phương án được bày ra đều đã qua luật.** Giá trị của mỗi ô do chính các hàm sẽ ghi vào
   kho tính ra, nên màu gốc không đạt tương phản thì ô hiện màu chính đã chỉnh và nói rõ nó đã
   dịch.
3. **Vẽ trên màn thật của kho**, bằng linh kiện và stylesheet thật, sáng và tối. Không gì được
   ghi vào mã nguồn: bảng mẫu nằm ở thư mục kết quả dựng.
4. **Chọn bằng một chữ cái, và chọn là xác nhận.** Chữ cái ứng với đúng giá trị mà sổ sẽ ghi, và
   được ghi là «người quyết». Giá trị người chưa nhìn thì vẫn là «máy đề xuất».

«Ấm hơn», «nhạt hơn» không do mô hình tự ước: kịch bản vẽ một bước theo mỗi hướng quanh màu đó,
bằng lượng cố định, rồi người lại chọn bằng chữ cái.

Lát đầu chỉ làm tầng foundations: màu gốc, thang chữ, bo góc, và trang «trước và sau» cho bước
xem lại cuối.

## Consequences

- Kịch bản mới mở màn đầu tiên của kho bằng máy chủ phát triển và trình duyệt kiểm thử của chính
  kho đó, đặt từng bộ giá trị rồi chụp. Kho không có hai thứ ấy thì nó in cùng các phương án bằng
  chữ và nói rõ là không vẽ được.
- Bảng mẫu vẽ lần đầu thu màn quá nhỏ, gần như không thấy khác biệt. Đã sửa: cắt sát nội dung,
  vẽ nét gấp đôi, thêm ô màu cho phần màu gốc và danh sách mọi cỡ chữ cho phần thang chữ.
- Hướng dẫn giờ bảo: vẽ rồi mới hỏi, mỗi lần một hạng mục, khuyến nghị đứng đầu kèm lý do và khi
  nào nó sai.
- Bài kiểm của plugin 163 lên 176.

Lượt đi qua đầu tiên, 2026-11-12: chủ kho xem bảng mẫu màu gốc và xác nhận giữ lam `#0246ff`.
Việc đó làm lộ một chỗ hở: bản thiết kế chỉ ghi «ai quyết» cho cả một tầng, nên xác nhận một màu
sẽ thành nhận cả thang chữ lẫn bo góc mà chủ kho chưa xem. Đã thêm: một tầng do máy đề xuất được
liệt kê riêng các câu người đã xác nhận, và chỉ những dòng đó hết ghi là đề xuất.

Giới hạn:

- **Màn có gì thì bảng mẫu cho thấy nấy.** Màn mẫu của sàn dùng rất ít màu chính và chỉ hai cỡ
  chữ; ô màu và danh sách cỡ chữ bù phần đó, nhưng chúng là hình vẽ từ giá trị, không phải linh
  kiện thật.
- Ảnh chụp không tất định tới từng điểm ảnh giữa các máy; phần tất định là danh sách phương án,
  giá trị của chúng và trang HTML.
- Chỉ chạy được ở kho dựng bằng Vite và có trình duyệt kiểm thử của sàn.
- Chưa làm: điểm dừng thị giác cho năm tầng còn lại, phòng trưng bày trạng thái, độ sâu «mang sẵn
  thiết kế tới», phản biện độc lập bằng ảnh, tờ hướng dẫn để lại.
- Tác tử độc lập không nhìn thay người được: lát này chưa có ai đi qua.
