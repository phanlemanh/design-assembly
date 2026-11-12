---
type: decision
title: Cuốn sổ bàn giao — design system được cho xem, vẽ từ chính kho
links:
  - wiki/decisions/0019-show-then-ask.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/scripts/stage.mjs
  - plugins/design-assembly/skills/handoff/SKILL.md
  - plugins/design-assembly/references/book.md
  - plugins/design-assembly/tests/test-book.mjs
  - design/book-words.json
---

# 0020 Cuốn sổ bàn giao: design system được cho xem, vẽ từ chính kho

## Status

Accepted cho lát đầu. Chủ kho hỏi ngày 2026-11-12: mượn được gì từ skill Diagram Design để có một
skill tương tự, chuyên cho design system, theo cách nhà thiết kế chuyên nghiệp bàn giao cho khách,
ở chuẩn cao nhất. Máy phân tích, đề xuất, và chủ kho duyệt dựng lát đầu («Làm tiếp»). Lát này
nghiệm thu bằng một lượt chủ kho xem; lượt đó chưa diễn ra.

## Context

Sau cuộc dẫn dắt, người dùng nhận sổ quyết định, tệp token và các trang quy ước: toàn chữ. Bảng
mẫu (quyết định 0019) cho xem _trước_ khi quyết; chưa có gì cho xem _sau_ khi quyết, và cuộc dẫn
dắt còn thiếu «tờ hướng dẫn để lại» mà Repo Standards có.

Đọc ngày 2026-11-12: skill Diagram Design (một hệ chung và quy ước riêng từng loại nạp khi cần;
da thuộc về kho; một điểm nhấn và ngân sách độ dày; bảng lỗi cần tránh; cổng thẩm mỹ kèm kịch bản
kiểm; núm vặn đầu ra; sổ trung thực); Nielsen Norman, Design Systems 101; trang linh kiện của
Carbon; hướng dẫn bàn giao của Figma. Bài «Documenting components» của EightShapes bị chặn, không
đọc.

## Decision

1. **Một skill `handoff` và một kịch bản sinh cuốn sổ.** Kịch bản dựng trang từ dữ liệu của kho;
   skill là nghi thức của người bàn giao: chọn người đọc và định dạng, soát bằng mắt, dẫn người
   xem đi qua từng tờ, và không bao giờ ghi thay người rằng họ đã chấp nhận điều gì.
2. **Không mượn cách để mô hình tự tay viết từng trang.** Với sơ đồ thì cần phán đoán; với design
   system thì trang phải sinh từ kho, nếu không nó lệch khỏi mã ở lần sửa sau.
3. **Chuẩn tám điều** (ghi trong skill): giá trị đọc từ kho; màu hiện theo vai trên đúng nền kèm
   tỉ số tương phản; màn thật ở mọi trạng thái; nói rõ đã quyết, ai quyết, còn mở; mỗi tờ một điểm
   nhấn; vẽ bằng chính hệ nó mô tả; đọc được theo người đọc; cùng trạng thái kho ra cùng cuốn sổ.
4. **Lát đầu có năm tờ:** bìa, màu, chữ và hình khối, trạng thái, và «cuốn sổ này không cho thấy
   gì». Hai núm vặn: người đọc (khách, người dựng) và định dạng (HTML, PDF, ảnh từng tờ).
5. **Cuốn sổ là một tệp không cần gì khác**, ảnh nằm bên trong. Nó mang theo bản kê mọi điều nó
   hiện; đem đối chiếu với kho thì biết phần nào đã lệch. Nó là kết quả dựng, không commit.
6. **Lời của cuốn sổ theo ngôn ngữ tài liệu của kho**, giữ trong một tệp của kho; số, màu và tên
   thì luôn đọc từ kho.

## Consequences

- **Cuốn sổ làm lộ một lỗi thật ngay lần vẽ đầu:** chữ phụ trên nền phụ ở chế độ sáng chỉ đạt
  4,34:1, dưới ngưỡng 4,5:1. Không lệnh kiểm nào giữ cặp đó. Đã ghi vào sổ lỗi lọt; chưa sửa vì
  giá trị là của sàn.
- Kịch bản bảng mẫu và kịch bản cuốn sổ dùng chung một «sân khấu»: máy chủ phát triển và trình
  duyệt kiểm thử của chính kho. Các trạng thái được đọc bằng cách nạp sổ màn như bản dựng của kho
  nạp, nên lời trên nút hiện đúng chữ của kho.
- Bài kiểm của plugin 176 lên 188, trong đó một bài soát rằng mọi màu trên trang đều là màu kho
  có.

Giới hạn:

- **Phần «đẹp» chỉ người nhìn mới chấm được.** Máy đã tự soi năm tờ và chỉnh một lượt; chủ kho
  chưa xem.
- Tệp phông không nằm trong cuốn sổ: máy không có phông của sản phẩm sẽ hiện phông kế tiếp.
- Ảnh không nằm trong bản kê, nên phép đối chiếu không biết ảnh đã cũ.
- Chưa có: tờ linh kiện (cần chỗ dựng từng linh kiện riêng lẻ), tờ hành vi và kiểu màn, xuất
  slide theo khổ.
- Chỉ vẽ được ảnh ở kho dựng bằng Vite có trình duyệt kiểm thử; kho khác vẫn có cuốn sổ, không
  có ảnh, và cuốn sổ nói rõ vì sao.
- Chưa được tác tử độc lập thử.
