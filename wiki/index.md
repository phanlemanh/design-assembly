---
type: index
title: design-assembly wiki
---

# design-assembly wiki

Short, linked pages about the _why_ of this project. Agents read this page
first; keep it under ~60 lines. Page formats: `ontology/page-types.yaml`.

## Entities

<!-- - [Customer](entities/customer.md) — who buys; VIP rules -->

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
- [0007 Nhận giá trị kho đã có thay vì sinh đè](decisions/0007-adopt-existing-values.md) — lệnh ở `plugins/design-assembly/scripts/adopt.mjs`, bảng bằng chứng sẵn có ở `plugins/design-assembly/references/known-proofs.json`
- [0006 Một sổ chuẩn, một danh sách tầng, một danh mục quyết định](decisions/0006-one-ledger-one-layer-list.md) — sổ ở `design/decisions.yaml`, danh mục ở `plugins/design-assembly/references/standard-decisions.json`

## Incidents

<!-- - [2026-01-15 Double charge](incidents/2026-01-15-double-charge.md) -->

## Metrics

<!-- weekly reports from tools/sdlc_metrics.py (team level) -->

## Log

See [log.md](log.md) for a chronological list of changes.
