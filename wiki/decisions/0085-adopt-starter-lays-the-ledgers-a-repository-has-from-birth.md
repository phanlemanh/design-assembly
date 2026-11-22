---
type: decision
title: "Lối đặt sổ không hỏi ai là cờ --starter của adopt, và hợp đồng nói sổ nào có từ lúc ra đời"
links:
  - wiki/specs/0013-the-two-neighbours-call-and-read.md
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
sources:
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-starter.mjs
  - "chủ repo, 2026-11-22: «Duyệt cả tám», đáp câu «Duyệt đề bài 0013 theo cả tám khuyến nghị?»"
  - "chủ repo, 2026-11-22: «Dựng lát 1», đáp câu «Dựng lát 1 của đề bài 0013?»"
---

# 0085 Lối đặt sổ không hỏi ai, và sổ nào có từ lúc ra đời

## Status

Đã nhận, 2026-11-22. Lát 1 của đề bài [0013](../specs/0013-the-two-neighbours-call-and-read.md), tiêu chí 1, 2 và 3,
thuộc mục 6.1. Chủ repo duyệt đề bài («Duyệt cả tám») rồi bảo dựng lát này («Dựng lát 1»). Plugin 0.34.0.

## Context

Repo Standards cần một lời gọi chạy được ngay sau khi đặt sàn, không ai phải trả lời gì, mà repo vẫn có đủ bộ sổ.

- `adopt` đã gần làm được việc ấy. Trên một repo vừa có sàn, nó không hỏi gì: nó thêm dòng sổ, kiểm quanh giá trị đang
  có, viết sổ token, bước cổng, công cụ và trang luật. Câu nào chỉ người đáp được thì nằm trên hàng chờ mà `status` in.
- Nhưng nó không viết các sổ mà sau đó người giữ: bảng trạng thái, sổ màn, bảng bề rộng màn, bảng kiểu cột. Chỉ lối dẫn
  dắt viết bản khởi đầu của chúng, khi người đi tới bước dựng.
- Và nó chặn lối dẫn dắt về sau: giá trị đã nhận được coi là của repo, nên `apply` từ chối viết đè, trừ khi người nói
  `--replace`. Trên một repo vừa có sàn, giá trị ấy là của sàn.
- Hợp đồng không nói sổ nào phải có từ lúc ra đời, nên không lệnh nào trả lời được câu «bộ sổ đã đủ chưa».

## Decision

1. **Cờ `--starter` của `adopt`** (câu hỏi 4 của đề bài). Nó làm mọi việc `adopt` vẫn làm, cộng thêm việc đặt bản khởi
   đầu của bảng trạng thái, sổ màn, bảng bề rộng màn và bảng kiểu cột. Mỗi bản viết đúng như lối dẫn dắt viết, và chỉ
   khi mã của sàn có chỗ cho nó: danh sách màn cho hai sổ đầu, bài kiểm trình duyệt của sàn cho bảng bề rộng.
   - Không câu nào được hỏi, không lời nào được viết thay ai. Câu chỉ người đáp được vẫn nằm trên hàng chờ. Lệnh kết thúc
     bằng 1 khi còn lời chờ.
   - Chạy lại lần hai không đổi gì.
   - Từ chối, thoát 2, khi màu chính của stylesheet có sắc của riêng repo, hoặc khi repo đã nhận giá trị của chính nó
     trước đó (bất kỳ giá trị nào không nằm trong danh sách của sàn).
     Repo ấy giữ giá trị qua `adopt` không cờ.
2. **Giá trị nhận trên sàn ghi là của sàn, từng giá trị một.** Tệp dữ liệu công cụ (`design/theme.json`) mang
   `adopted_from_floor`, danh sách các giá trị đã nhận khi đặt sổ trên sàn. `apply` không coi các giá trị ấy là của
   repo, nên lối dẫn dắt viết đè được mà không cần `--replace`.
   - Một giá trị nhận về sau bằng `adopt` không cờ là của repo, không vào danh sách ấy, và lối dẫn dắt vẫn từ chối viết
     đè nó. Người soát độc lập chỉ ra điều này: bản đầu dùng một dấu chung cho cả danh sách.
   - Sau khi lối dẫn dắt viết, danh sách mất cùng danh sách giá trị đã nhận.
3. **Hợp đồng đánh dấu từng sổ, `born`.** Có hai giá trị: `with-the-floor` (có từ lúc ra đời) và
   `with-its-first-entry` (có khi có mục đầu). Trang hợp đồng có thêm cột «From birth», và một bài kiểm giữ hai nơi khớp
   nhau.
4. **`status` nói bộ sổ đủ hay thiếu**, ngay trên dòng của nhịp «the repository is born». Hoặc nó in «all N are here»,
   hoặc nêu từng sổ thiếu. Không thêm dòng, để báo cáo vẫn vừa một màn hình.
5. **Bộ sổ lúc ra đời hẹp hơn khuyến nghị của câu 3.** Câu 3 chỉ để ra ngoài sổ nhập kho, sổ cột và sổ bộ phận. Khi
   dựng, thêm ba sổ nữa phải để ra ngoài, vì chỉ lời người mới viết được chúng:
   - bản thiết kế: lời đáp của người, tầng nào cũng chưa có lúc ra đời;
   - sổ nguồn: dòng nguồn đầu, kể cả font của sàn, cần giấy phép do người điền;
   - trang kiểu màn: người viết từng trang.

   Còn lại bảy sổ có từ lúc ra đời: sổ quyết định, sổ token, sổ linh kiện, bảng kiểu cột, bảng trạng thái, bảng bề rộng
   màn, sổ màn. Đây là điểm khác lời chủ repo đã duyệt, và được nêu với chủ repo khi báo lát này.

## Consequences

- Repo Standards có một lời gọi để dùng (lát 3 của đề bài): `adopt.mjs --target <repo> --starter`. Sau đó nó mời người
  đi tiếp lối dẫn dắt.
- Hai dòng giới hạn mở:
  - `birth-set-reads-default-paths`: sổ token hay sổ linh kiện mà kit nghiệm thu dời chỗ thì `status` tính là thiếu.
  - `starter-takes-every-value-for-the-floors`: một repo giữ màu chính xám mà đã đổi bo góc hay thang chữ thì các giá trị
    ấy bị ghi là của sàn, và lối dẫn dắt có thể viết đè.
- Bài kiểm của plugin: 1075, thêm chín bài ở `tests/test-starter.mjs`.
