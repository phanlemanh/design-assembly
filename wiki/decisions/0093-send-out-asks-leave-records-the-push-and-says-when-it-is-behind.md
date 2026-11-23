---
type: decision
title: "Cầu nối ra, lát 2: gửi bộ hệ ra ngoài chỉ với lời cho phép theo repo và theo phích, ghi lần đẩy, hỏi đặt mặc định, status báo bản cũ"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0088-claude-design-system-measured-on-four-measures.md
  - wiki/decisions/0092-bring-out-writes-the-ledgers-out-and-the-gate-holds-them.md
sources:
  - plugins/design-assembly/scripts/send-out.mjs
  - plugins/design-assembly/scripts/bring-out.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/skills/bring-out/SKILL.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-send-out.mjs
  - "chủ repo, 2026-11-23: «Dựng lát 2 của mục 10.4»"
---

# 0093 Cầu nối ra, lát 2: lời cho phép, lần đẩy, mặc định

## Status

Accepted, 2026-11-23, chờ chủ repo bác ở các lựa chọn dưới đây. Lát 2 của mục 10.4, sau lát 1
([0092](0092-bring-out-writes-the-ledgers-out-and-the-gate-holds-them.md)). Với hai lát, tiêu chí 10 và 14 của đề bài
0014 được giữ, trừ phần «bản xem linh kiện» đã ghi giới hạn. Mục 10.4 còn lượt thử có người của dòng «xong khi» (tiêu
chí 13). Plugin lên 0.41.0.

## Context

Đề bài 0014, câu hỏi 7 đã duyệt: lời cho phép gửi dữ liệu ra ngoài theo repo và theo phích, ghi thành dòng, rút lại
được; mỗi lượt vẫn in trước gửi gì đi đâu. Mục «Claude Design và hệ mặc định của Claude»: đẩy bộ lên Claude là việc
của skill, chỉ sau lời cho phép; đẩy xong máy hỏi đúng một câu «Đặt hệ này làm mặc định trong Claude?», khuyến nghị là
có khi tài khoản chưa có hệ mặc định; `status` in dòng «bản trên Claude sinh từ bản X, sổ đang ở bản Y» từ bản ghi tại
chỗ của lần đẩy cuối; script không gọi Claude.

## Decision

1. **`bring-out --send <phích>`** (`scripts/send-out.mjs`). Phích phải là phích của ổ bàn giao có khai `sends`. Bộ
   xuất phải đang đúng với sổ; cũ thì từ chối (mã 2) và bảo viết lại trước.
2. **Lời cho phép là một dòng** `send-<phích>` của sổ quyết định (`judgment`, nguồn nêu gửi gì đi đâu, ghi chú đóng dấu
   tên và ngày như tờ quyết định). Chưa có thì đặt câu `send-<phích>` lên hàng chờ, ứng viên `allow` và `not-now`:
   phích chủ repo nêu ở ổ bàn giao (hệ của Claude, 0088) thì `allow` đứng đầu, căn cứ in mã bản ghi và lời chủ repo
   kèm ngày; phích khác thì `not-now` đứng đầu. Câu đánh dấu khó đảo ngược. Đáp `allow` thì dòng được ghi và câu rời
   hàng chờ; từ chối thì không gửi gì.
3. **Có lời cho phép thì in trước** `sends:` (bốn tệp của `design/export/system/`) và `to:` (điều tệp phích khai), kèm
   bản sổ; lệnh không gửi gì. Skill gửi, có người xem.
4. **`--pushed`** ghi lần đẩy vào `design/export/pushed.json` (phích, bản sổ, ngày) và đặt câu `default-<phích>` ở lần
   đẩy đầu, rồi chỉ hỏi lại khi câu ấy đã bị bỏ khỏi hàng chờ: khuyến nghị «có» khi tài khoản chưa có hệ mặc định, «không» khi skill báo
   `--account-has-default`. Chỉ đặt mặc định sau khi chủ repo đáp «có».
5. **`--revoke --by <tên>`** ghi đè dòng thành «refused by tên on ngày: leave taken back», và bỏ câu hỏi cùng mã nếu nó
   còn chờ; từ đó không gửi gì. **`--reask`** bỏ dòng (đã cho hay đã rút) và hỏi lại, thay câu đã đáp; đó là lối chọn
   lại, không cần sửa tay sổ.
6. **`status`** có khoá `pushed` và một dòng cho mỗi lần đẩy: bản sổ nó được viết từ, và khi sổ đã đi tiếp thì nói bản
   trên đó cũ. Mã thoát không đổi.

## Consequences

- Dòng giới hạn `bring-out-not-sent-anywhere` đóng. Ba dòng mới: lần đẩy được ghi theo lời skill, không gì đọc tài
  khoản để chứng; câu đặt mặc định được hỏi, không gì trong plugin đọc lời đáp để đặt; tài khoản đã có mặc định hay
  chưa là lời skill truyền vào.
- Soát độc lập trước khi mở PR: không điểm nghiêm trọng; lối cho phép đúng. Một điểm cao đã sửa, có bài kiểm: rút lời
  cho phép khi câu hỏi còn chờ để lại dòng và câu cùng mã, làm `status`, `decide` và cổng không đọc được hàng chờ; nay
  câu bị bỏ cùng lúc, và mọi lần chạy bỏ câu nằm cạnh dòng. Điểm vừa đã sửa: hàng chờ một tệp chung bị viết thêm câu
  (nay dừng trước khi ghi gì), lời cho phép đã rút không có lối hỏi lại (nay `--reask`), lời «hỏi một lần» nói rõ
  nghĩa. Điểm nhẹ đã sửa: báo xoá tệp đúng loại, câu đã đáp thiếu ứng viên không làm sập, bản ghi lần đẩy hỏng được
  bỏ qua, `--on` không đi kèm `--send` bị từ chối.
- Lựa chọn chờ chủ repo: lời cho phép cũng đi qua hàng chờ và tờ quyết định như mọi câu; `not-now` đứng đầu cho phích
  không ai nêu ở ổ bàn giao; bản ghi lần đẩy ở `design/export/pushed.json`, không phải một sổ của hợp đồng.
