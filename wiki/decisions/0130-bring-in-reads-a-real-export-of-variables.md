---
type: decision
title: "Cầu nối vào đọc đúng bản xuất biến thật: mỗi biến thuộc collection của nó, alias đi theo id, bản sao bị gạt, mọi thứ bỏ lại đều được đếm"
links:
  - wiki/specs/0018-figma-at-the-foundations-socket.md
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0091-bring-in-reads-an-outside-source-into-a-candidate-direction.md
sources:
  - plugins/design-assembly/scripts/outside-variables.mjs
  - plugins/design-assembly/scripts/outside-tokens.mjs
  - plugins/design-assembly/scripts/bring-in.mjs
  - plugins/design-assembly/skills/bring-in/SKILL.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-bring-in-variables.mjs
  - plugins/design-assembly/tests/helpers/variables-export.mjs
  - plugins/design-assembly/tests/helpers/bring-in-kinds.mjs
  - docs/trials/figma-fig-real-sample.md
  - docs/plan/plan.json
  - "chủ repo, 2026-11-26: «Dựng 13.1», đáp câu «Anh cho dựng lát 13.1 («Dựng 13.1»), hay chưa mở («Chưa mở»)?»"
---

# 0130 Cầu nối vào đọc đúng bản xuất biến thật

## Status

Proposed, 2026-11-26, plugin 0.77.0. Mục 13.1 của kế hoạch, dựng sớm theo lời chủ repo «Dựng 13.1» trong lúc giai đoạn
12 còn mở, như câu hỏi mở 3 của đề bài [0018](../specs/0018-figma-at-the-foundations-socket.md) cho phép; mục giữ `todo`
vì giai đoạn 13 chưa mở, commit mang `Plan: off-plan`. `ontology/` và hợp đồng sổ không đổi.

## Context

Lượt đọc thử tệp `.fig` thật của chủ repo ([`docs/trials/figma-fig-real-sample.md`](../../docs/trials/figma-fig-real-sample.md))
cho thấy cầu `bring-in` đọc sai bản xuất biến ở sáu trên bảy tiêu chí của lát 13.1: 43 collection, 32 là bản sao ẩn của
thư viện; chín trục mode; 1 971 alias, 1 800 chéo collection; 485 tên trùng giữa collection; hai mode «… Light» trong một
collection; biến không có giá trị; giá trị dưới id mode không khai; tên trùng trong một collection; màu có alpha. Cầu cũ
khoá token bằng tên và mode, không có collection, nên bản đọc sau đè bản đọc trước không báo (934 khoá ghi hai lần trở
lên trong 3 060 giá trị đọc được), và tra alias bằng tên nên alias sang collection có mode sáng hay tối hỏng hoặc bắt
nhầm biến cùng tên. Mẫu thử của cầu chỉ có một collection, ba biến.

## Decision

1. **Bản xuất biến có bộ đọc riêng**, `scripts/outside-variables.mjs`; `outside-tokens.mjs` chuyển loại `variables`
   sang đó. Ba loại kia (tệp token, DESIGN.md, thư mục hệ) không đổi một dòng nào: bài kiểm so đầu ra với bản ghi của
   plugin 0.76.0 làm trước khi đổi mã (`tests/helpers/bring-in-kinds-on-0.76.0.json`).
2. **Mỗi biến là token của collection của nó**, tên `Collection:đường.dẫn`, thêm `@mode` khi mode ấy không phải mode gốc.
   Hai collection cùng tên biến, hay hai biến cùng tên trong một collection, đều được giữ; không gì đè gì. Token được xếp
   theo tên collection, tên biến, id biến, nên thứ tự trong tệp không đổi kết quả.
3. **Alias đi theo id biến**, không theo tên: trong cùng collection giữ mode; sang collection khác lấy mode cùng tên, không
   thì mode đọc sáng hay tối như mode nguồn, không thì mode mặc định của đích (tiêu chí 1). Bước giữa là việc chọn thêm
   của lát này: «Agent Dark» trỏ sang collection có «Dark» thì lấy «Dark», điều tiêu chí 1 không nói.
4. **Collection `remote` hay `hiddenFromPublishing` bị gạt trước khi so tên** (tiêu chí 4): không vào ứng viên, đếm trong
   một dòng; alias trỏ vào chúng vẫn được giải. Nhờ thế tên collection của tệp là duy nhất; khi vẫn trùng, collection
   được gọi bằng tên và id, «Look (c-look)». Biến ẩn khỏi xuất bản trong collection không ẩn vẫn được đọc: nó là giá trị
   thật của tệp, alias trỏ tới nó.
5. **Màu gốc ở hai collection với hai giá trị bị từ chối** (tiêu chí 3), cả màu tối, nêu từng collection và giá trị;
   `--collection <tên|id>` chọn collection cho màu gốc. Lựa chọn ấy chỉ hẹp màu gốc: thang chữ và bo góc vẫn đọc từ mọi
   collection được giữ.
6. **Mode của một collection:** mode mặc định là mode gốc (sáng khi tên đọc sáng); khi hai mode đọc sáng, mode mặc định,
   không thì mode đầu, được mang; mode tối được mang là mode có phần tên còn lại giống mode sáng, không thì mode tối đầu.
   Mode không mang vẫn được đọc dưới tên của nó, không bao giờ thành `light` hay `dark`, và mỗi trục không mang có một
   dòng nêu các mode và mode đã lấy (tiêu chí 6).
7. **Mọi thứ bỏ lại được đếm, mỗi loại một dòng**: biến kiểu ổ nền không dùng (đúng/sai) (tiêu chí 5); biến không có giá
   trị, giá trị thiếu một mode, alias dừng ở chúng, giá trị dưới mode không khai, biến của collection bản xuất không liệt
   kê, tách khỏi dòng `not read` của alias không trỏ tới biến nào; tên trùng trong một collection; màu có alpha dưới 1,
   viết thẳng hay qua alias, giữ dạng `#rrggbbaa`. Dòng «read» nêu số
   giá trị, biến, collection đọc được. Dòng `not read` còn lại chỉ là lỗi đọc thật.
8. **Font khác sổ thành câu hỏi** (câu hỏi mở 5), với bản xuất biến: họ chữ của ứng viên so với họ chữ chủ repo đã chốt
   (`text_font`, `heading_font`), đọc từ dòng font của sổ nguồn, từ khai báo của sàn trong stylesheet, hay «the system
   font». Ba loại kia vẫn chỉ nêu tên font như trước; dòng giới hạn `bring-in-font-question-for-variables-only` ghi điều đó.

## Consequences

- Trên bản xuất thật, chạy khô chỉ đọc, đếm trước và sau: 3 060 giá trị đọc và 194 dòng `not read` (144 alias hỏng, 50
  đúng/sai), 934 khoá bị ghi hai lần trở lên, thành 1 633 giá trị đọc của 839 biến trong 11 collection của tệp, 0 dòng
  `not read`, 32 collection bản sao gạt ra (805 biến), 1 biến đúng/sai, 36 biến rỗng, 11 giá trị thiếu mode, 80 alias
  dừng ở chỗ không có giá trị, 8 trục không mang. Ứng viên giữ màu gốc, thang `modular major-second` nay khớp không phải
  lấy xấp xỉ, bo góc `small`; câu hỏi thêm một: font Inter so với Geist Variable của sàn.
- Dòng giới hạn `bring-in-formats-read-from-samples` đóng cho bản xuất biến; bảy dòng mới mở:
  `bring-in-token-file-design-md-system-read-from-samples`, `bring-in-font-question-for-variables-only`,
  `bring-in-alias-mode-by-name`, `bring-in-axes-take-the-default-mode`, `bring-in-other-keys-taken-by-collection-name`,
  `bring-in-no-value-not-told-apart`, `bring-in-one-line-per-alias`.
- Ba mục gác lại ngày 2026-11-26 về ba lỗ hổng của cầu rời phần gác lại của kế hoạch vào mục 13.1.
- Báo cáo vẫn in mỗi giá trị đi qua alias một dòng `computed:`, hơn một nghìn dòng trên tệp thật; chưa sửa ở lát này.
- Chưa chứng: cách chọn mode của alias chéo collection chưa được so với thứ công cụ thiết kế vẽ; công cụ đọc `.fig` có
  làm mất giá trị không vẫn chưa biết.
