---
type: decision
title: "Cuộc dẫn dắt hỏi mọi câu của bảng vai màu và câu giấy phép trước bước duyệt cuối, màu gốc ghi ai đáp và ngày nào, và status --roles in từng giá trị cạnh dòng sổ và lệnh kiểm giữ nó"
links:
  - wiki/specs/0012-foundations-wide-enough.md
  - wiki/decisions/0082-the-table-of-colour-roles-and-contrast-on-every-pair.md
  - wiki/decisions/0083-the-neutral-family-and-the-status-tones-are-choices-of-the-foundations.md
  - wiki/decisions/0081-a-font-enters-through-the-sources-ledger.md
  - wiki/decisions/0080-the-typeface-is-a-choice-of-the-foundations.md
sources:
  - plugins/design-assembly/scripts/roles-held.mjs
  - plugins/design-assembly/scripts/color-roles.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-roles-held.mjs
  - docs/trials/guide-trial-15-foundations-wide-enough.md
  - "chủ repo, 2026-11-22: «Sửa rồi chạy lại», đáp câu «Sửa cuộc dẫn dắt để nó hỏi câu thanh bên, biểu đồ và giấy phép, rồi chạy thêm một lượt?»"
  - "chủ repo, 2026-11-22: «Dựng luôn (Khuyến nghị)», đáp câu có dựng luôn lệnh in từng giá trị cạnh dòng sổ và lệnh kiểm, kèm kiểu chữ, và ghi tên và ngày cho lời đáp màu gốc"
---

# 0084 Cuộc dẫn dắt hỏi mọi câu màu, và một lệnh in điều giữ từng giá trị

## Status

Đã nhận, 2026-11-22. Mục 9.3 của đề bài [0012](../specs/0012-foundations-wide-enough.md), tiêu chí 12. Chủ repo bảo sửa
sau lượt thử 15 («Sửa rồi chạy lại»), và bảo dựng luôn lệnh in («Dựng luôn (Khuyến nghị)»). Plugin 0.33.0.

## Context

Lượt thử 15 ([trang](../../docs/trials/guide-trial-15-foundations-wide-enough.md)) cho cổng xanh nhưng không chứng được
dòng «done when» của giai đoạn 9, vì ba điều:

- **Hai câu màu không được hỏi.** Trang skill `new` hỏi họ trung tính và tông trạng thái trên bảng mẫu trước bước duyệt
  cuối. Câu thanh bên (`color-roles-sidebar`) và câu biểu đồ (`color-roles-chart`) chỉ được nhắc ở bước 6, bước dựng
  «không dừng». Tác tử để cả hai chờ, nên 3 vai thanh bên và 5 vai biểu đồ không có lời chủ repo. Câu giấy phép của dòng
  sổ nguồn cho font của sàn cũng vậy: `adopt` đề xuất dòng ấy ở bước 6, không có giấy phép.
- **Màu gốc không ghi ai đáp và ngày nào.** Kiểu chữ và các câu của bảng vai đều có `by` và `on`; màu gốc chỉ có nguồn
  của cả tầng. `status --roles` nêu «from the owner's source color» mà không nói ai, khi nào.
- **Không lệnh nào in đủ.** `status --roles` in nguồn và cặp đo của từng vai, không in giá trị, dòng sổ hay lệnh kiểm,
  và không có kiểu chữ.

## Decision

1. **Trang skill `new` có mục «The sidebar, the chart roles and the font's licence»**, ngay sau họ trung tính và tông
   trạng thái, trước bước duyệt cuối.
   - Hai câu của bảng vai mà không bảng mẫu nào vẽ được hỏi mỗi câu một lần, bằng lời. Khuyến nghị và lý do lấy từ
     `references/color-roles.json`.
   - Lời của người ghi vào `layers.foundations.roles.<question>`, với `source`, `by` và `on`.
   - Câu giấy phép được hỏi ở đây, kèm điều lockfile ghi về gói của font. Sau khi bước dựng viết dòng sổ nguồn, lời của
     người được đặt vào `licence`. Không bao giờ viết một giấy phép người không đưa.
   - Bước 6 nay nói các câu ấy đã được hỏi ở bước 4, và bước dựng không dừng để hỏi.
   - Danh sách lời thuộc người có thêm hai câu này (mười thay vì tám).
   - Bước duyệt cuối nêu lời của chủ repo cho từng câu.
2. **Màu gốc ghi ai đáp và ngày nào**, ở `layers.foundations.answered.source_color`, như kiểu chữ.
   - Có tên và ngày thì dòng sổ `source-color` ghi «answered by NAME on DAY», và mọi vai công thức viết từ màu gốc nêu lời
     ấy.
   - Không bắt buộc: bản thiết kế viết trước bản này không có, và vẫn xanh.
   - Có mà thiếu tên hay ngày thì cuộc dẫn dắt từ chối. Có trên một tầng là đề xuất thì cũng từ chối.
   - Luật ấy áp cho `answered` của mọi lựa chọn, không chỉ màu gốc.
3. **`status --roles` in từng giá trị cạnh điều giữ nó**, ở một repo có `design/blueprint.json` và `design/theme.json`.
   Mỗi vai màu và mỗi họ chữ một dòng:
   - nguồn, kèm lời chủ repo, tên và ngày;
   - giá trị ở giao diện sáng và tối;
   - các dòng sổ có phép kiểm nêu nó, mỗi dòng kèm lệnh kiểm nó trỏ tới: `tonal-palette` khi khối máy sinh khai nó,
     `color-contrast` với số cặp, `typeface` và `font-loaded`, `design-tokens` khi tệp token mang nó.

   Rồi một dòng `whole:` đếm bao nhiêu giá trị đủ cả lời chủ repo lẫn một dòng sổ với lệnh kiểm. Mỗi giá trị thiếu một
   trong hai có một dòng `not whole:`. Vai không được khai, như tông chủ repo không chọn, không vào số đếm. Không có bản
   thiết kế thì lệnh in bảng như trước. `--json` có thêm `held`.

4. **Ba dòng giới hạn đóng** theo quyết định này: `guide-leaves-sidebar-and-chart-waiting`,
   `no-command-prints-value-row-and-check`, `source-color-answer-has-no-name-or-day`. Lượt chạy lại của vai dẫn dắt
   (lượt thử 16) là chứng của dòng «done when».

## Consequences

- Dòng «done when» của giai đoạn 9 có một lệnh để chỉ vào: `status.mjs --target <repo> --roles`. Lệnh ấy tự nói dòng nào
  chưa đủ, nên «không dòng nào trống» đọc được từ dòng `whole:`.
- «Giữ» một dòng ở đây là dòng sổ có phép kiểm nêu vai ấy. Với năm vai biểu đồ và vài vai viền, phép kiểm duy nhất là
  `design-tokens`: tệp token phải nói đúng điều stylesheet nói. Nó bắt một giá trị đổi trong stylesheet mà tệp token không
  đổi theo, chứ không bắt một giá trị lệch khỏi giá trị của sàn. Trang lượt thử nói rõ điều này.
- Câu giấy phép vẫn do tác tử chép lời người vào dòng sổ, theo chữ của trang skill. Không phép kiểm nào thấy tác tử chép
  đúng lời. Cổng chỉ giữ rằng dòng có giấy phép (giới hạn `font-licence-is-words`).
- Dòng luật của repo về bảng vai màu không đổi. Lệnh in là của `status`, không phải của trang luật.
