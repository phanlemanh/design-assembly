---
type: decision
title: "Kho công khai trên GitHub, theo giấy phép MIT"
links:
  - wiki/decisions/0002-setup-choices.md
sources:
  - LICENSE
  - package.json
  - plugins/design-assembly/.claude-plugin/plugin.json
  - setup-blueprint.yaml
  - .repo-setup.json
  - "chủ repo, 2026-11-19: «Public repo này», «Mở ngay», «Đổi giấy phép sang MIT»"
---

# 0059 Kho công khai trên GitHub, theo giấy phép MIT

## Status

Accepted, 2026-11-19. Chủ repo quyết. Thay dòng «giấy phép Proprietary» của quyết định 0002.

## Context

Quyết định 0002 chọn giấy phép Proprietary khi kho còn chỉ nằm trên máy, vì đây là việc riêng của một người. Ngày
2026-11-19 chủ repo mở kho công khai trên GitHub. Trước khi mở đã rà: không khoá nào trong 165 commit, không dữ liệu riêng
trong các tệp và 44 PR, quy trình kiểm tự động chỉ có quyền đọc. Quét khoá và chặn đẩy khoá của GitHub được bật cùng
ngày. Sau khi mở, tệp giấy phép vẫn ghi «proprietary and confidential»: người ngoài đọc được mã mà không được dùng lại, và
chữ «confidential» không còn đúng.

## Decision

1. **Giấy phép là MIT**, bản quyền của `phanlemanh`, năm 2026. Tệp `LICENSE` mang văn bản MIT nguyên bản.
2. **Mọi chỗ khai giấy phép nói cùng một điều:** `package.json` và `plugin.json` của plugin khai `MIT`; `.repo-setup.json`
   và `setup-blueprint.yaml` ghi lựa chọn mới, nguồn là chủ repo. `package.json` vẫn giữ `private`, vì kho không phát
   hành lên npm.
3. **Mã băm của `LICENSE` trong `.repo-setup.json` giữ nguyên.** Nó ghi tệp bộ dựng kho đã viết; tệp nay do người đổi,
   và bộ dựng kho cần thấy đúng như thế.

## Consequences

- Ai cũng được dùng, sửa và phát hành lại mã và plugin, miễn giữ dòng bản quyền và lời cho phép.
- Repo nào cài plugin cũng nhận các tệp công cụ theo MIT; plugin không chép tệp giấy phép vào repo đó.
- Từ nay mọi thứ viết vào kho, PR và wiki là công khai ngay. Kho chỉ nhắc một repo còn riêng tư là `floorplanstudio`, ở
  kế hoạch và bản đo độ rộng; chủ repo đã biết và chọn giữ nguyên.
