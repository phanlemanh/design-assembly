# Thư viện linh kiện trong một gói: đo trên bản sao

Đo ngày 2026-11-20, cho mục 4.4 của kế hoạch («Nguồn linh kiện thứ hai»), theo bản quyết định
[0067](../../wiki/decisions/0067-a-component-library-kept-in-a-package-is-read-from-its-settings.md).

## Đo gì, trên đâu

- **Repo:** gói giao diện `packages/ui` của crm-onehub, repo cùng họ mà chủ repo đã chỉ định ở giai
  đoạn 2.
- **Cách đo:** chép gói ấy, trừ `node_modules`, vào thư mục tạm của phiên làm việc. Repo thật chỉ được
  đọc: sau lần đo, `git status` của nó vẫn rỗng.
- **Gói ấy giữ thư viện thế nào:**
  - Cấu hình linh kiện đặt bí danh `@crm/ui/components` cho cả linh kiện lẫn thư viện.
  - `exports` của gói dẫn bí danh ấy tới `src/components`.
  - Trong thư mục ấy, linh kiện của shadcn nằm chung với linh kiện riêng của nhóm.
- **Hai lần chạy:** cùng lệnh, cùng bản sao. Một lần bằng plugin ở `main` (`b00fa2a`), một lần bằng
  plugin của nhánh `claude/stage-4-4`:
  - `audit --target <bản sao> --json`;
  - `adopt --target <bản sao> --dry-run`.

## Kết quả

| Đo                                                   | `main` | Nhánh 4.4 |
| ---------------------------------------------------- | ------ | --------- |
| Chỗ đi vòng thang màu                                | 17     | 17        |
| Chỗ đi vòng thang cỡ chữ                             | 10     | 5         |
| Chỗ đi vòng thang khoảng cách                        | 7      | 0         |
| Chỗ đi vòng thang bo góc                             | 1      | 0         |
| Tổng                                                 | 35     | 22        |
| Tệp bị nói là gọi thẳng thư viện thông báo (`adopt`) | 3      | 2         |

- **Chỗ không còn bị tính:** 13 chỗ, cả 13 nằm trong bảy tệp của thư viện: `avatar`, `button`, `calendar`, `input-group`,
  `tabs`, `toggle-group` và `scroll-area`.
- **Tệp không còn bị nói là gọi thẳng thư viện thông báo:** `src/components/sonner.tsx`, là toaster của thư viện.
- **Phát hiện vẫn còn, và là thật:**
  - Các chỗ đi vòng thang màu, cùng năm chỗ đi vòng thang cỡ chữ, nằm trong linh kiện riêng của nhóm.
  - `copy-value.tsx` và `sortable-list.tsx` của nhóm gọi thẳng thư viện thông báo.

## Chưa đo

- Gói ứng dụng `apps/app` và ba gói ứng dụng còn lại của crm-onehub.
- Một repo giữ bí danh chỉ ở cấu hình TypeScript: dòng giới hạn `library-alias-through-exports-only`.
