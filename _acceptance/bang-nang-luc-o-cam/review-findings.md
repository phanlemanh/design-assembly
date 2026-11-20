# Review findings: bang-nang-luc-o-cam (round 4)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **feature_loop.suite_keys was cut to the two test files of this slug, but the key applies to the whole repo**
  Người dùng thấy gì: Later features in this repo would be checked against only two small test sets instead of the full repo check. A break elsewhere, like the one caught in round 2, could pass unnoticed.
  Căn cứ: Nothing is lost today and the setting can be changed back at any time, but every later feature inherits a weaker safety net until someone fixes it, so it deserves its own piece of work.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: new-contract

- **The re-sign card still asks the owner Hỏi-1 and Hỏi-2 about criterion 7 and E8, both of which were removed**
  Người dùng thấy gì: The approval card still shows two questions about a criterion that was dropped, so someone reading it later may think the owner approved something that is no longer part of the work.
  Căn cứ: It causes confusion only for readers of the record, not for product users, nothing is lost, and a note on the card or a later redraw fixes it cheaply.
  file: `_acceptance/bang-nang-luc-o-cam/card.html`
  severity: medium
  Đề xuất: known-limits

- **evidence-page.html is a round-3 snapshot that contradicts the narrowed contract**
  Người dùng thấy gì: The evidence page still shows eight criteria and a rejected verdict from before the scope was narrowed, so a reader may take it as the current result.
  Căn cứ: It misleads only people reading the record, no user data or behaviour is affected, and it can be regenerated or labelled as an old snapshot at any time.
  file: `_acceptance/bang-nang-luc-o-cam/evidence-page.html`
  severity: low
  Đề xuất: known-limits

- **Re-signed scope card still asks the owner to approve Hỏi-1 and Hỏi-2, which depend on the removed AC-7 and E8**
  Người dùng thấy gì: The signed scope card keeps questions and trade-offs about a dropped criterion, so what the owner's approval covered no longer matches the contract.
  Căn cứ: The effect is limited to record readability, with no impact on product users, and the fix is a cheap redraw or a note, so it can ship as it is with the limit written down.
  file: `_acceptance/bang-nang-luc-o-cam/card.html`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 4/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, _acceptance/bang-nang-luc-o-cam/card.html, _acceptance/bang-nang-luc-o-cam/evidence-page.html) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
