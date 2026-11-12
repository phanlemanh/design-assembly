---
type: log
title: Change log of the wiki and notable code changes
---

# Log

Newest first. One line each: `YYYY-MM-DD — what changed — link`.

- 2026-11-12 — Thêm tệp design tokens sinh từ stylesheet, có lệnh kiểm giữ khớp và lệnh sinh lại; bộ đọc của kit nhận tệp; bậc foundations của kho này lên «tự khai» — [0008](decisions/0008-design-tokens-file.md).
- 2026-11-12 — Thêm lệnh adopt: ghi dòng sổ và đặt lệnh kiểm quanh giá trị kho đã có, không ghi đè; cuộc dẫn dắt từ chối sinh đè lên giá trị riêng; kho này từ 9/38 lên 17/38 quyết định lõi — [0007](decisions/0007-adopt-existing-values.md).
- 2026-11-12 — Sổ quyết định chuyển sang `design/decisions.yaml` chuẩn; mười tầng gộp về bảy; thêm danh mục 64 quyết định chuẩn và audit cho mọi bậc — [0006](decisions/0006-one-ledger-one-layer-list.md).
- 2026-11-12 — Chốt đầu ra là design system chuẩn hoá theo bậc và ranh giới với Repo Standards, kit; dựng bậc audit (kiểm kê chỉ đọc, chạy trên mọi kho) — [0005](decisions/0005-output-tiers-and-boundaries.md), `plugins/design-assembly/scripts/inventory.mjs`.
- 2026-11-11 — Foundations thêm type scale, spacing scale, shape, kèm ba loại lệnh kiểm mới; ghi hai giới hạn của bộ linh kiện sàn — [spec 0001](specs/0001-design-system-for-claude-code.md).
- 2026-11-11 — Chạy thử cuộc dẫn dắt bằng hai tác tử mới (giao hết, từng tầng); sửa bản xem trước để chạy trước khi duyệt, và năm chỗ hướng dẫn mơ hồ — [spec 0001](specs/0001-design-system-for-claude-code.md).
- 2026-11-11 — Dựng lát đầu của plugin: bốn tầng, hàm tính màu từ source color, lệnh kiểm và determinism rate; áp vào ứng dụng gốc — [spec 0001](specs/0001-design-system-for-claude-code.md), `plugins/design-assembly/`, `design/`.
- 2026-11-11 — Thống nhất output là plugin dẫn dắt; thêm bảng từ vựng chuẩn ngành và bài kiểm giữ nó — [0004](decisions/0004-output-and-vocabulary.md), [spec 0001](specs/0001-design-system-for-claude-code.md).
- 2026-11-11 — Thêm khung plugin và viết lại đề bài theo hướng «bằng và cho Claude Code» — [0003](decisions/0003-plugin-inside-the-repo.md), [spec 0001](specs/0001-design-system-for-claude-code.md).
- 2026-11-11 — Thêm đề bài lát mỏng và bản ghi lựa chọn dựng kho — [spec 0001](specs/0001-design-system-for-claude-code.md), [0002](decisions/0002-setup-choices.md).
- 2026-11-11 — Repository created with repo-setup (React + TypeScript SPA — Vite, npm, ESLint (react-hooks), Prettier, Vitest + Testing Library).
