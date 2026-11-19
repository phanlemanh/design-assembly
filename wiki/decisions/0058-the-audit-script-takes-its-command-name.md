---
type: decision
title: "Script của audit mang tên lệnh của nó; tên cũ từ chối mọi lời gọi cho tới lệnh kiểm kê"
links:
  - wiki/specs/0006-the-reusable-store.md
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0047-tool-stamp-upgrade-and-the-version-rule.md
sources:
  - plugins/design-assembly/scripts/audit.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/tests/test-audit.mjs
  - plugins/design-assembly/README.md
  - "chủ repo, 2026-11-19: «Làm đổi tên audit»"
---

# 0058 Script của audit mang tên lệnh của nó; tên cũ từ chối mọi lời gọi cho tới lệnh kiểm kê

## Status

Accepted, 2026-11-19. Bước 2 của đề bài 0006, phần một của mục 3.4, theo câu hỏi 2 mà chủ repo đã duyệt («Duyệt cả
mười»).

## Context

Lệnh `audit` chạy từ `scripts/inventory.mjs`, và hàm của nó tên `inventory`. Đề bài 0004 đã khuyên lệnh kiểm kê của kho
mang tên `inventory`; đề bài 0006 dựng lệnh ấy ở mục 3.4. Nếu đổi tên và dựng lệnh mới cùng một lúc, sẽ có một bản mà
cùng một lời gọi `scripts/inventory.mjs` lặng lẽ trả báo cáo của lệnh khác. Năm tệp gọi script theo tên: `mk/plugin.mk`,
`skills/audit/SKILL.md`, `scripts/status.mjs`, `scripts/book.mjs`, `docs/trials/ladder.mjs`; thêm mười tệp bài kiểm.

## Decision

1. **`scripts/inventory.mjs` thành `scripts/audit.mjs`, hàm `inventory` thành `audit`.** Năm tệp gọi và mười tệp bài kiểm
   đổi theo; `tests/test-inventory.mjs` thành `tests/test-audit.mjs`. `make design-audit` và skill `audit` giữ tên. Ở
   `status.mjs` và `book.mjs`, biến cục bộ từng tên `audit` nay tên `audited`, để không che hàm mới.
2. **Ở tên cũ còn một tệp nhỏ.** Gọi nó với cờ nào cũng thoát 2, không in gì ra đầu ra chuẩn, và nói ở luồng lỗi rằng
   `scripts/inventory.mjs` nay là `scripts/audit.mjs`, kèm đường dẫn đầy đủ của script mới. Nó đi qua `start` và
   `refuse` của hợp đồng lệnh chung (quyết định 0044), nên nhập nó từ một tệp khác không in gì. Ở mục 3.4 tệp này được
   thay bằng lệnh kiểm kê thật.
3. **Bài kiểm giữ cả hai điều.** Một bài gọi tên cũ với năm bộ cờ và đòi thoát 2, đầu ra rỗng, câu nêu tên mới. Một bài
   lấy plugin ở `1754568` (commit cuối trước khi đổi tên) bằng `git archive`, chạy script cũ và script mới với `--json`
   trên ba repo thử (rỗng, có sàn, đã qua dẫn dắt), và đòi cùng mã thoát và cùng dữ kiện, trừ mọi khoá `version`.
4. **Ghi chú phát hành nói việc đổi tên ở `README.md` của plugin, mục «Versions».** Ghi chú phát hành mà `upgrade --out`
   viết được dựng từ dữ kiện của một repo: tệp công cụ, sổ máy sinh, cổng. Script của plugin không phải thứ repo nhận,
   nên việc đổi tên không có chỗ trong ghi chú ấy; người dùng plugin đọc nó ở mục «Versions».
5. **Số bản lên `0.9.0`.** Một lời gọi theo tên cũ thôi chạy được. Theo semver cho số 0.x, đổi điều người gọi dựa vào thì
   tăng số giữa.

Lệch với đề bài 0006: đề bài nói «ghi chú phát hành của bản ấy nói việc đổi tên»; ghi chú ấy do máy dựng và không thấy
script, nên câu ấy nằm ở README của plugin (mục 4).

## Consequences

- Điều kiện nghiệm thu 4 của đề bài, đo ngày 2026-11-19 trên repo này:
  `node plugins/design-assembly/scripts/audit.mjs --target . --json` cho đúng dữ kiện của script ở `1754568`, trừ số bản.
  So với `inventory.mjs` ở `03e2a99` (bản 0.7.3) chỉ khác hai dòng giới hạn mà mục 3.1 thêm, `sources-never-fetched` và
  `intake-new-keys-taken-by-own-keys`, ở `limits.open` và `blind`; không điều nào do đổi tên. Ba lần chạy đều thoát 0.
- `node plugins/design-assembly/scripts/inventory.mjs --target .` thoát 2 và nêu `audit.mjs`, như điều kiện ấy đòi.
- Ai gọi `scripts/inventory.mjs` theo tên sẽ nhận thoát 2 ở bản này, rồi một lệnh khác ở bản có mục 3.4. Ngoài năm tệp
  đã đổi, trong kho này không bên nào gọi nó; một hồ sơ nghiệm thu của repo kiểm chứng gọi nó ở một commit ghim sẵn, nên
  không bị ảnh hưởng.
- Các trang quyết định và đề bài cũ nhắc `scripts/inventory.mjs` để nguyên: đó là lịch sử. Tệp nhỏ ở tên cũ còn đó, nên
  đường dẫn trong mục `sources` của chúng vẫn trỏ tới một tệp có thật.
- Hai bài kiểm mới được thấy đỏ trước khi có mã, vì `scripts/audit.mjs` chưa có. Mỗi bài cũng được thấy đỏ bằng cách tạm
  làm hỏng mã rồi trả lại: tệp nhỏ chạy script mới thay vì từ chối, và script mới thêm một khoá vào câu trả lời.
