---
type: decision
title: Sổ linh kiện là vật dẫn xuất từ mã nguồn linh kiện
links:
  - wiki/decisions/0008-design-tokens-file.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/tests/test-components.mjs
  - design/component-registry.json
---

# 0009 Sổ linh kiện là vật dẫn xuất từ mã nguồn linh kiện

## Status

Accepted. Chủ kho duyệt hướng ngày 2026-11-12 («Làm tiếp» trước đề xuất dựng sổ linh kiện cho bậc
core components). Nội dung mỗi mục, cách nhận ra biến thể và việc chỉ đọc thư mục linh kiện lõi là
máy chọn sau khi đọc bộ đọc của kit, chờ chủ kho bác.

## Context

Bậc core components đòi một vật: sổ linh kiện ở đường dẫn kit nghiệm thu đọc
(`design_floor.registry`). Lời hứa của bậc là «chọn linh kiện bằng cách tra, và không viết được biến
thể sai». Máy đọc mã bộ đọc của kit trước khi dựng:

- Gốc tệp chỉ nhận hai khoá: `version` (chuỗi) và `components` (danh sách).
- Mỗi mục, kit đọc `name`, `category` và `variants` (danh sách chuỗi). Khoá khác được bỏ qua.
- Lệnh soát kế hoạch của kit so tên linh kiện phải có trong sổ, và biến thể viết dạng
  `Tên (trục=giá trị)` phải có trong `variants` của linh kiện đó.

Sự thật về linh kiện nằm ở mã nguồn. Một sổ chép tay sẽ lệch ngay lần thêm biến thể đầu tiên.

## Decision

1. **Sổ là vật dẫn xuất.** Linh kiện đổi ở tệp nguồn; sổ được ghi lại bằng `make design-components`.
2. **Mỗi linh kiện được xuất ra là một mục**: tên, tệp, các biến thể dạng `trục=giá trị`, và giá
   trị mặc định của từng trục.
3. **Biến thể đọc từ hai chỗ trong mã**: bộ biến thể khai bằng hàm class-variance, và prop được
   gõ kiểu là một danh sách chữ đóng. Prop kiểu đúng/sai không phải biến thể.
4. **Chỉ đọc thư mục linh kiện lõi** mà tệp cấu hình linh kiện của kho chỉ tới.
5. **Một lệnh kiểm giữ sổ khớp mã nguồn theo cả hai chiều**: thêm biến thể hay linh kiện mà chưa
   ghi lại sổ thì đỏ, sửa tay sổ thì đỏ, mất sổ thì đỏ. Đây là một dòng sổ quyết định
   (`component-manifest`).
6. **Sổ người đã tự giữ, nói khác mã nguồn, không bao giờ bị ghi đè.**
7. **Tệp được viết đúng kiểu bộ định dạng của kho để lại**, theo độ rộng dòng kho khai, để ghi lại
   sổ không làm bước kiểm định dạng đỏ.

## Consequences

- **Kho này (2026-11-12):** `design/component-registry.json` có 50 linh kiện, 6 cái có biến thể
  (Alert, Badge, Button, Card, EmptyMedia, SelectTrigger); máy đối chiếu từng cái với mã nguồn.
  Sổ quyết định lên 24 dòng, 8 dòng máy giữ.
- **Lệnh soát kế hoạch thật của kit nhận sổ.** Kế hoạch dùng đúng tên, đúng biến thể và đúng token
  thì qua; sai biến thể, sai tên linh kiện, sai token đều bị bắt. Bài kiểm này chạy khi kit có trên
  máy.
- **Kho đối chứng đã tự giữ một sổ linh kiện kiểu khác** (mỗi tệp một mục, có cấp nguyên tử và các
  phần con, không có biến thể). Adopt nhìn thấy, báo, và không ghi đè. Hai hình dạng sổ đang cùng
  tồn tại.
- **Bậc core components vẫn chưa đạt**: vật đã có, nhưng mới 5/10 quyết định lõi có lời đáp. Năm
  câu còn mở đều về bảng dữ liệu và cỡ vùng bấm.
- Danh mục chuẩn có 66 quyết định (thêm `component-manifest`); số lõi vẫn là 38.

Giới hạn và điều còn mở:

- Bộ đọc mã nguồn dựa trên cách viết của bộ linh kiện ở sàn, không phải bộ phân tích cú pháp đầy
  đủ. Linh kiện viết kiểu khác có thể được liệt kê mà thiếu biến thể. Thiếu thì kit không soát
  biến thể của linh kiện đó, chứ không báo sai.
- Sổ chưa có trạng thái (vô hiệu, lỗi, đang tải), danh sách prop, các phần con, hay cấp nguyên tử.
- Linh kiện ngoài thư mục lõi (linh kiện riêng của sản phẩm) chưa được đọc.
- Kit xếp kho lên bậc M2 khi kho khai cả tệp token lẫn sổ linh kiện trong cấu hình của kit. Kho này
  chưa khai gì với kit; đó là việc của chủ kho.
