---
type: decision
title: "Lệnh plugs bỏ câu hỏi khi phích của nó đã đi, và hỏi lại một ổ đã chọn bằng --reask"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0089-plugs-command-asks-where-a-measured-plug-is-here.md
  - wiki/decisions/0090-plugs-sees-the-session-falls-back-and-shows-the-board.md
sources:
  - plugins/design-assembly/scripts/plugs.mjs
  - plugins/design-assembly/skills/plugs/SKILL.md
  - plugins/design-assembly/tests/test-plugs.mjs
  - "phiên điều phối, 2026-11-23: soát độc lập PR #106 sau khi gộp, hai điểm nên sửa"
  - "chủ repo, 2026-11-23: «Gửi sang sửa»"
---

# 0094 Câu hỏi đi theo phích của nó, và một lựa chọn có lối quay lại

## Status

Accepted, 2026-11-23. Sửa hai điểm phiên điều phối thấy khi soát PR #106 (lát 1 của mục 10.1), theo lời chủ repo
«Gửi sang sửa». Vẫn là mục 10.1. Plugin lên 0.42.0.

## Context

1. Tiêu chí 4 của đề bài 0014 chỉ hỏi ở ổ có phích đã đo đang có mặt. Một câu đã hỏi lúc phích có mặt vẫn chờ khi
   phích đi mất (tệp bị xoá, hay phiên khác không có nó), và khuyến nghị của nó có thể vẫn là phích ấy; chủ repo giữ
   khuyến nghị rồi mới biết phích vắng qua dòng `chosen-but-missing`.
2. Một lựa chọn đã ghi (dòng `plug-<ổ>`) không có lối quay lại: ổ không bao giờ được hỏi lại, kể cả khi phích có mặt;
   cách duy nhất là sửa tay sổ quyết định, và không trang nào nói thế.

## Decision

1. **Câu hỏi đi theo phích của nó.** Mỗi lần chạy, một câu chưa đáp mà mọi phích ngoài nó hỏi về được biết là đã đi
   thì bị bỏ khỏi hàng chờ, và lệnh in «Taken away: … no longer here». «Được biết là đã đi»: không ở repo và không ở
   phiên, khi phiên được liệt kê, hay khi phích là loại repo cho thấy (`detect`). Phích chỉ phiên có, trong một lần
   chạy không liệt kê phiên, không được biết là đã đi: câu ở lại. Ổ được hỏi lại khi có phích đã đo trở lại. Kết quả
   máy đọc có khoá `withdrawn`.
2. **`--reask <ổ>`** bỏ dòng `plug-<ổ>` khỏi sổ quyết định trong cùng lần ghi, và ổ được hỏi lại theo lượt (tối đa bốn
   câu một lượt vẫn giữ). Không sổ mới, không sửa tay. Trang skill nói cách chọn lại.

## Consequences

- Một câu bị bỏ là việc của máy, không phải lời của người: không gì được ghi vào sổ khi bỏ.
- Khe giữa hai lần ghi (dòng và câu cùng mã, dòng giới hạn `plugs-row-and-question-share-an-id`) vẫn như cũ; thông
  điệp của hàng chờ chưa nói chạy lại `plugs` là cách ra.
