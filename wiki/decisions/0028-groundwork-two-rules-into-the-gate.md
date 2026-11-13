---
type: decision
title: Dọn nền 2 — đưa luật hay bị phạm vào cổng, và lấp chỗ hổng của repo mới
links:
  - wiki/decisions/0026-one-button-per-row-and-model-review-after.md
  - wiki/decisions/0027-row-waits-alone-and-list-screens-share.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - docs/trials/control-arm.md
  - plugins/design-assembly/templates/tools/design-assembly/patterns.mjs
  - plugins/design-assembly/templates/owned/templates.spec.ts.template
  - plugins/design-assembly/templates/owned/app-frame.tsx.template
  - plugins/design-assembly/templates/owned/list.ts.template
  - "chủ repo, 2026-11-13: «Làm Dọn nền 2»"
---

# 0028 Dọn nền 2: đưa luật hay bị phạm vào cổng, và lấp chỗ hổng của repo mới

## Status

Accepted. Chủ repo chọn làm lát này trước chặng 2 ngày 2026-11-13 («Làm Dọn nền 2»), theo kế
hoạch máy đề xuất sau ba lần chạy nhánh đối chứng. Cách làm từng phần là máy chọn, chờ chủ repo bác.

## Context

Nhánh đối chứng trên repo mới của sàn cho thấy: tác tử không đọc trang luật phạm 3 rồi 6 trên 13
luật tự khai, còn cổng của plugin hầu như không bắt được luật nào trong số đó. Ba luật bị phạm ở
cả hai lượt mà máy kiểm được: liên kết khoác áo nút ở trạng thái trống, liên kết sang màn khác
cạnh tiêu đề, và hộp thoại hỏi trước vẫn mở sau khi người trả lời. Repo mới sau cuộc dẫn dắt còn
bốn chỗ hổng: toast không được gắn, không có khung, màn mẫu xoá theo cách cũ, và cổng đọc danh
sách màn như văn bản mà không trang nào nói.

## Decision

1. **Ba luật vào cổng.** Hai lệnh kiểm đọc mã mới, mỗi lệnh một dòng sổ: `empty-state-actions`
   (không trạng thái trống nào khoác áo nút cho một liên kết) và `navigation-in-frame` (không tệp
   nào dưới khung liên kết tới một màn của danh sách). Một luật mới trong bài kiểm trình duyệt mà
   plugin cài, dòng sổ `asked-action-closes`: khi người trả lời hộp thoại mà một thao tác trên dòng
   hỏi, hộp thoại phải đóng. Ba quyết định mới vào danh mục chuẩn, nguồn là plugin.
2. **Toast phải được gắn.** Lệnh kiểm kênh thông báo đỏ khi màn báo kết quả qua toast mà không nơi
   nào gắn phần vẽ toast đang được dùng.
3. **Khung có sẵn.** Plugin cài `AppFrame` cùng toast: điều hướng một chỗ, đổi màn không tải lại
   trang, đánh dấu màn đang mở, để toast của màn cũ lại, gắn phần vẽ toast một lần. Repo này dùng
   nó cho khung của chính mình.
4. **Phần tải chung của màn danh sách đi theo plugin:** `useList` (`src/lib/list.ts`), cài cùng các
   phần của dòng.
5. **Trang luật nói thêm** rằng cổng đọc danh sách màn đúng như viết.

## Consequences

- Trên bài làm cũ của nhánh không: lượt hai bị bắt ở trạng thái trống, lượt ba bị bắt ở cả trạng
  thái trống lẫn liên kết cạnh tiêu đề; bài làm của nhánh có ở cả hai lượt vẫn xanh. Luật hộp thoại
  đỏ đúng 4 lượt trên repo mới đã qua cuộc dẫn dắt (đang xoá và xoá thất bại, hai bề rộng), và xanh
  trên repo này.
- Cổng của repo này: 25 quyết định, 31 lệnh kiểm; 99 bài kiểm thường, 76 lượt kiểm trình duyệt, 220
  bài kiểm của plugin.
- Sổ giới hạn đóng bốn dòng chỗ hổng của repo mới; mở hai dòng: bài kiểm trình duyệt đã cài không
  bao giờ được viết lại, nên repo dựng trước không nhận luật mới; và phần đổi dòng dùng chung (dời
  có hoàn tác, xoá có hỏi, tiêu điểm) chưa đi theo plugin, dù tác tử nào cũng tự viết lại nó.
- Nghiệm thu: chạy lại nhánh đối chứng trên repo mới, ghi ở `docs/trials/control-arm.md`.
