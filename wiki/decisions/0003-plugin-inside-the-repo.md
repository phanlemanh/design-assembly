---
type: decision
title: Plugin nằm trong kho, ứng dụng làm bãi thử
links: [wiki/specs/0001-design-system-for-claude-code.md]
sources: [plugins/design-assembly/README.md, tests/plugin-manifest.test.ts]
---

# 0003 Plugin nằm trong kho, ứng dụng làm bãi thử

## Status

Accepted. Chủ kho chọn «Dựng khung» ngày 2026-11-11.

## Context

Ý tưởng của kho là một hệ design bằng Claude Code và dành cho Claude Code. Một nửa của «dành cho
Claude Code» là thứ plugin chở được: quy trình lắp màn, móc soát sau mỗi lần sửa, bộ sinh, sổ tra
cứu. Câu hỏi là đổi cả kho thành plugin, hay thêm plugin vào kho đang có.

## Decision

Thêm plugin ở `plugins/design-assembly/`, khai ở `.claude-plugin/marketplace.json`. Ứng dụng ở gốc
kho giữ nguyên và làm bãi thử: plugin sinh gì thì hiện ở đó và bị `make check` chấm.

Đã loại: đổi gốc kho thành plugin. Lý do: thước chấm hiện tại là thước cho ứng dụng, và khuôn kho
plugin của Repo Standards chưa vào nhánh chính.

## Consequences

- Động cơ và nơi dùng tách nhau từ ngày đầu. Plugin chỉ có tiếng Anh và không chứa bối cảnh sản
  phẩm.
- Khung hiện chỉ có tệp khai báo. Cài plugin lúc này không đổi gì.
- `tests/plugin-manifest.test.ts` giữ hai tệp khai báo khớp nhau, và tự chứng minh từng luật đỏ
  được.
- Khi Repo Standards có khuôn kho plugin thì xét chuyển sang khuôn đó: nó có bộ soát tệp khai báo
  và lệnh nâng phiên bản riêng.
- `AGENTS.md` chưa nhắc tới `plugins/`, vì tệp đó do bộ dựng kho giữ. Trang bắt đầu và trang chỉ mục
  của wiki có nhắc.
