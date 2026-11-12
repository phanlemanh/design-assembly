---
type: decision
title: Cỡ vùng bấm được đo từ mã nguồn linh kiện
links:
  - wiki/decisions/0009-component-manifest.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/templates/tools/design-assembly/theme.mjs
  - plugins/design-assembly/tests/test-components.mjs
---

# 0011 Cỡ vùng bấm được đo từ mã nguồn linh kiện

## Status

Accepted. Chủ kho duyệt hướng ngày 2026-11-12 («Làm tiếp» trước đề xuất dựng lệnh kiểm cỡ vùng
bấm). Danh sách phần tử được coi là control và việc chỉ đo chiều cao là máy chọn, chờ chủ kho bác.

## Context

Bậc core components có năm quyết định lõi còn mở. Bốn câu về bảng dữ liệu cần người quyết trước.
Câu thứ năm thì không: «mọi control có đạt cỡ vùng bấm của mức conformance không». Ngưỡng do WCAG
2.2 đặt, và chiều cao của control nằm ngay trong mã nguồn linh kiện mà sổ linh kiện đã đọc.

Ngưỡng được đối chiếu tại nguồn ngày 2026-11-12: tiêu chí 2.5.8 (mức AA) đòi 24 × 24 px, tiêu chí
2.5.5 (mức AAA) đòi 44 × 44 px. Cùng lần đó xác nhận tiêu chí 1.4.6: tương phản chữ mức AAA là
7:1, con số trước đây máy ghi theo trí nhớ.

## Decision

1. **Control là linh kiện vẽ ra một phần tử để bấm**: nút, ô nhập, ô chọn, liên kết, và các phần
   tương ứng của thư viện linh kiện gốc (nút mở, mục chọn, nút đóng…). Danh sách này cố định trong
   công cụ.
2. **Chiều cao đọc từ lớp CSS của chính control**: trên phần tử nó vẽ, và trong bộ biến thể mà
   phần tử đó gọi. Cỡ của phần tử con (biểu tượng) và của phần tử giả không tính. Chiều cao có điều
   kiện vẫn tính: control có thể mang nó.
3. **Chiều cao nhỏ nhất của mỗi control phải đạt ngưỡng của mức conformance.** Sổ linh kiện ghi
   control nào và chiều cao nhỏ nhất của nó.
4. **Không đo được gì thì là lỗi**, không phải là qua.
5. **Control đang dưới ngưỡng thì không có lệnh kiểm**: máy nêu tên từng cái và dừng ở đó. Linh
   kiện đổi trước, hoặc người đổi mức.

## Consequences

- **Kho này (2026-11-12):** ba control được đo. Nhỏ nhất là Button cỡ xs, đúng 24 px, tức vừa
  chạm ngưỡng AA. Ba control không đo được vì chiều cao không nằm trong lớp của chính chúng
  (DialogClose, DialogTrigger, SelectItem). Kho đáp 19/38 quyết định lõi (3 máy giữ, 13 tự khai,
  3 đã ghi); bậc core components lên 6/10.
- **Ở mức AAA cả ba control đều dưới 44 px**, nên chọn AAA thì cuộc dẫn dắt báo tên và không thêm
  lệnh kiểm.
- **Kho đối chứng, chỉ xem:** bốn control đo được, không cái nào dưới 24 px, mười ba cái không đo
  được. Sổ của kho đó đã có dòng cho quyết định này mà chưa có lệnh kiểm; adopt không đụng dòng đã
  có.

Giới hạn và điều còn mở:

- Chỉ đo chiều cao. Chiều rộng của nút chữ tuỳ nội dung, không đọc được từ mã nguồn. Một nút cao
  24 px với nhãn một ký tự có thể hẹp hơn 24 px.
- Đây là phép đo trên mã nguồn, không phải trên màn đã vẽ. WCAG nói về vùng bấm thật trên màn, và
  có ngoại lệ (đủ khoảng cách, nằm trong dòng chữ) mà phép đo này không xét.
- Control không khai chiều cao trong lớp của chính nó thì không được đo; tên chúng nằm trong sổ
  linh kiện (có đánh dấu control, không có chiều cao).
- Phép đổi lớp sang px dùng đơn vị khoảng cách 4 px của framework. Kho tự khai đơn vị khác thì số
  đo sai; quyết định về đơn vị khoảng cách đang giữ điều kiện đó.
