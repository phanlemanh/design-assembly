---
type: decision
title: "Lời chủ repo trong tệp phích ghi cả nơi nó được nói về; cho phép chỉ đứng đầu khi phích còn gửi tới đúng nơi ấy"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0088-claude-design-system-measured-on-four-measures.md
  - wiki/decisions/0089-plugs-command-asks-where-a-measured-plug-is-here.md
  - wiki/decisions/0093-send-out-asks-leave-records-the-push-and-says-when-it-is-behind.md
sources:
  - plugins/design-assembly/references/plugs/claude-design.json
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/scripts/send-out.mjs
  - plugins/design-assembly/scripts/plugs.mjs
  - plugins/design-assembly/tests/test-capabilities.mjs
  - plugins/design-assembly/tests/test-send-out.mjs
  - plugins/design-assembly/tests/test-plugs.mjs
  - "phiên điều phối, 2026-11-23: soát PR #116, khe hở còn lại của lời cho phép gửi ra ngoài"
  - "chủ repo, 2026-11-23: «Gửi sang sửa»"
---

# 0095 Lời chủ repo được ghi cho một nơi, không chỉ cho một phích

## Status

Accepted, 2026-11-23. Theo lời chủ repo «Gửi sang sửa», sau khi phiên điều phối soát PR #116. Plugin lên 0.48.0.

## Context

Luật «nơi đến đổi thì không để `allow` đứng đầu» chỉ nằm trong một câu hỏi, và mất theo câu ấy: lời cho phép bị hỏi
lại thì dòng của nó bị bỏ, nên `--reask` sau đó lại hỏi câu thường, `allow` đứng đầu, dẫn 0088 và lời chủ repo, cho
nơi mới. Cùng gốc ấy hiện ra cả khi chưa từng có lời cho phép: một repo được khuyến nghị `allow` cho bất cứ nơi nào
tệp phích nêu hôm nay. Gốc nằm ở tệp phích: `recommended_by_owner.<ổ>` ghi lời, ngày và bản ghi của phích, không ghi
lời ấy được nói về điều gì. «Keep at handoff and brand» được nói khi `sends` đọc như nó đọc ngày 2026-11-23.

## Decision

1. **Lời chủ repo ghi cả nơi nó được nói về.** Mỗi mục `recommended_by_owner.<ổ>` của một phích có gửi ra ngoài mang
   `sends`, đúng chữ `sends` của tệp phích khi lời ấy được nói. Tệp `claude-design.json` ghi chữ của ngày 2026-11-23,
   vẫn y nguyên tới nay; không lời mới nào được bịa. Phép kiểm hình dạng đỏ khi một phích có `sends` mà lời không ghi.
2. **Phép kiểm nơi làm plugin** (`wordProblems`, chạy trong bài kiểm của plugin như `recordProblems`) đỏ khi `sends` của
   phích khác điều lời ghi, nêu tệp, hai chữ và cách ra: nói lại lời, hay bỏ mục. Một bản plugin đổi nơi gửi không thể
   ra đời với lời cũ vẫn đứng đầu.
3. **Một luật cho mọi lần hỏi.** `wordHolds(plug, ổ)`: có lời, và (với phích gửi ra ngoài) lời được nói về đúng chữ
   `sends` hôm nay. Ở lời cho phép gửi ra ngoài, `allow` chỉ đứng đầu khi lời còn giữ, ở lần hỏi đầu, ở `--reask`, và
   ở lần hỏi lại; nhóm «sending out, asked again» nay chỉ đổi lời văn. Lời không còn giữ thì `not-now` đứng đầu, căn cứ
   nói lời được nói về nơi nào và phích nay gửi đi đâu. Phép chặn câu sửa tay theo cùng luật.
4. **Cùng luật ở lệnh `plugs`.** Ngoại lệ có tên ở ổ bàn giao và ổ tài sản thương hiệu cũng dựa vào lời ấy, nên
   `boardOf` chỉ coi là lời của chủ repo khi lời còn giữ. Đây là mở rộng có chủ ý, nói ra ở đây và trong PR.

## Consequences

- Đổi `sends` của một phích có lời chủ repo là việc phải hỏi lại chủ repo: bài kiểm của plugin đỏ cho tới khi lời được
  nói lại cho nơi mới, hay mục bị bỏ.
- Phích chỉ chạy tại chỗ (không `sends`) giữ lời như cũ, không cần ghi nơi.
