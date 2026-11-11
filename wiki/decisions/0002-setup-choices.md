---
type: decision
title: Các lựa chọn khi dựng kho
links: [wiki/specs/0001-design-system-for-claude-code.md]
sources: [setup-blueprint.yaml]
---

# 0002 Các lựa chọn khi dựng kho

## Status

Proposed. Máy chọn hết theo khuyến nghị của `repo-setup` ngày 2026-11-11 và dựng luôn vì kho mới,
trống, chỉ nằm trên máy, xoá là xong. Chủ kho chưa duyệt và có thể bác từng dòng.

## Context

Chủ kho muốn thử ý tưởng «quyết từ trên xuống, dựng từ dưới lên» cho hệ design ở một kho riêng, để
không đụng tới acceptance-gate-kit. Một người làm, không hạn chót, không dữ liệu cần tuân thủ.

## Decision

| Tầng              | Chọn                                                                                                                | Đã loại                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Bối cảnh          | Tên `design-assembly`, chủ `phanlemanh` (lấy từ các kho khác của chủ kho, kho này chưa có remote), chỉ nằm trên máy |                                       |
| Kho               | Một kho một ứng dụng, giấy phép Proprietary                                                                         | Monorepo, nhiều kho                   |
| Kiến trúc         | Không khuôn kiến trúc                                                                                               | Modular monolith, service API         |
| AI trong sản phẩm | Không có                                                                                                            |                                       |
| Nền kỹ thuật      | `react-vite`                                                                                                        | `python`, `ts-api`: không có màn hình |
| Nghiệp vụ         | Bắt đầu trống                                                                                                       | Gieo khái niệm ngay                   |
| Thiết kế          | shadcn, kiểu công cụ, nhận diện mặc định, `vi-VN`, VND                                                              | Hệ của công ty, thư viện khác         |
| Chất lượng        | `starter`                                                                                                           | `team`                                |
| Triển khai        | Chưa có, chạy bằng máy chủ phát triển tại chỗ                                                                       | Container                             |
| Quản trị tác tử   | Chỉ Claude Code tại máy, chính sách mẫu                                                                             | Tác tử trên GitHub, MCP               |

## Consequences

- CI có tệp cấu hình nhưng không chạy, vì chưa có kho trên GitHub. Mọi kiểm tra chạy tại máy bằng
  `make check`.
- shadcn đặt sẵn giá trị nền và linh kiện. Kho này dùng nó làm sàn truy cập, còn phần thử nghiệm là
  cách quyết và cách lắp, không phải vẽ lại linh kiện. Bản phản biện độc lập coi đây là rủi ro lớn
  nhất: thử nghiệm có thể chỉ là khoác áo lại cho shadcn.
- Ngôn ngữ và tiền tệ do máy suy, chưa ai xác nhận.
- Muốn đổi nền kỹ thuật hay mức chất lượng về sau là việc tay: bộ dựng chỉ thêm tệp.
