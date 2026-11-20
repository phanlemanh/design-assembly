---
schema_version: 1
slug: bang-nang-luc-o-cam
feature: Bảng năng lực của plugin nói ổ cắm và phích của từng năng lực, năm bài kiểm giữ nó, và status in bảng ổ cắm của repo đang đứng
owner: phanlemanh@gmail.com
stage: decided # discovery | decided | archived
decision: build # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Phan Le Manh
decided_at: 2026-11-20T07:02:08Z # ISO UTC
prototype:
  base_commit: # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition: # keep | archive
lo_trinh_ma: 5.0
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng 5.0 của «Lộ trình design-assembly» (`docs/plan/lo-trinh.json`).

Bảng năng lực của plugin nói ổ cắm và phích của từng năng lực, năm bài kiểm giữ nó, và status in bảng ổ cắm của repo đang đứng

Vì sao: Mục 5.0 của kế hoạch chính thức (docs/plan/plan.json); đề bài 0008 đã duyệt ngày 2026-11-20. Cả tám tiêu chí cùng một kết quả: bảng có, được giữ, và được bày ra; không chạm lớp khó đảo nào

## Ngưỡng chết / ngưỡng UAT

Không đo được — việc nội bộ của bộ công cụ, không có người dùng cuối; thước là tám tiêu chí của đề bài 0008 (wiki/specs/0008-capabilities-sockets-and-plugs.md).

## Cổng 0

- **decision = build** Căn cứ: chủ repo chọn «Làm, không đo được (Recommended)» ngày 2026-11-20, đáp câu «Cổng Đáng của hàng 5.0 … Anh quyết thế nào?».
- **disposition =** không có bản thử; vòng đi thẳng vào S1.
