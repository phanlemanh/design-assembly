---
type: index
title: design-assembly wiki
---

# design-assembly wiki

Short, linked pages about the _why_ of this project. Agents read this page
first; keep it under ~60 lines. Page formats: `ontology/page-types.yaml`.

## Entities

<!-- - [Customer](entities/customer.md) — who buys; VIP rules -->

- [Item](entities/item.md) — bản ghi mẫu của màn mẫu; mỗi trường khai kiểu cột

## Flows

<!-- - [Checkout](flows/checkout.md) -->

## Specs

- [0001 Plugin dẫn người dùng dựng design system cho Claude Code](specs/0001-design-system-for-claude-code.md) — đề bài đã duyệt; lát đầu đã dựng, kết quả theo từng tiêu chí ở cuối mục tiêu chí

## Decisions

- [0001 Record decisions in the wiki](decisions/0001-record-decisions-in-the-wiki.md)
- [0002 Các lựa chọn khi dựng kho](decisions/0002-setup-choices.md) — máy chọn, chờ chủ kho bác
- [0003 Plugin nằm trong kho, ứng dụng làm bãi thử](decisions/0003-plugin-inside-the-repo.md) — động cơ ở `plugins/design-assembly/`
- [0004 Output là plugin dẫn dắt, từ vựng lấy từ chuẩn của ngành](decisions/0004-output-and-vocabulary.md) — bảng từ vựng ở `plugins/design-assembly/references/vocabulary.json`
- [0005 Đầu ra chuẩn hoá theo bậc; ranh giới với hai kho bên cạnh](decisions/0005-output-tiers-and-boundaries.md) — bảng bậc ở `plugins/design-assembly/references/tiers.json`
- [0014 Kênh thông báo, hỏi trước hay hoàn tác, và bài kiểm của kho làm bằng chứng](decisions/0014-channels-and-undo.md) — mô-đun báo kết quả ở `src/lib/notify.ts`, bộ dò bằng chứng ở `plugins/design-assembly/scripts/proofs.mjs`
- [0013 Trạng thái của màn, chữ trên màn và câu báo lỗi, phần máy đọc được từ mã nguồn](decisions/0013-states-words-error-messages.md) — ba lệnh kiểm ở `plugins/design-assembly/templates/tools/design-assembly/patterns.mjs`; mức dày của bảng sửa về 32 px
- [0012 Kiểu cột quyết định canh lề, bề rộng và mật độ của bảng dữ liệu](decisions/0012-column-types.md) — bảng kiểu cột ở `design/column-types.json`, lệnh kiểm ở `plugins/design-assembly/templates/tools/design-assembly/columns.mjs`
- [0011 Cỡ vùng bấm được đo từ mã nguồn linh kiện](decisions/0011-target-size-from-source.md) — phép đo ở `plugins/design-assembly/templates/tools/design-assembly/components.mjs`
- [0010 Chỉ dòng sổ mới là lời đáp; bản audit tự nói bước kế](decisions/0010-only-a-row-is-an-answer.md) — rút từ lần chạy thử hai; bộ dò bằng chứng chung ở `plugins/design-assembly/scripts/proofs.mjs`
- [0009 Sổ linh kiện là vật dẫn xuất từ mã nguồn linh kiện](decisions/0009-component-manifest.md) — bộ đọc và lệnh kiểm ở `plugins/design-assembly/templates/tools/design-assembly/components.mjs`
- [0008 Tệp design tokens là vật dẫn xuất từ stylesheet](decisions/0008-design-tokens-file.md) — bộ sinh và lệnh kiểm ở `plugins/design-assembly/templates/tools/design-assembly/tokens.mjs`
- [0007 Nhận giá trị kho đã có thay vì sinh đè](decisions/0007-adopt-existing-values.md) — lệnh ở `plugins/design-assembly/scripts/adopt.mjs`, bảng bằng chứng sẵn có ở `plugins/design-assembly/references/known-proofs.json`
- [0006 Một sổ chuẩn, một danh sách tầng, một danh mục quyết định](decisions/0006-one-ledger-one-layer-list.md) — sổ ở `design/decisions.yaml`, danh mục ở `plugins/design-assembly/references/standard-decisions.json`

## Incidents

<!-- - [2026-01-15 Double charge](incidents/2026-01-15-double-charge.md) -->

## Metrics

<!-- weekly reports from tools/sdlc_metrics.py (team level) -->

## Log

See [log.md](log.md) for a chronological list of changes.
