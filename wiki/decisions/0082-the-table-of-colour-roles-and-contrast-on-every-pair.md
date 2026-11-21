---
type: decision
title: "Bảng vai màu: mỗi vai một nguồn nói được, vai thanh bên đi theo màu chính khi chủ repo nói, và cổng đo mọi cặp bảng khai"
links:
  - wiki/specs/0012-foundations-wide-enough.md
  - wiki/decisions/0080-the-typeface-is-a-choice-of-the-foundations.md
  - wiki/decisions/0081-a-font-enters-through-the-sources-ledger.md
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/decisions/0069-the-capability-table-and-its-checks.md
sources:
  - plugins/design-assembly/references/color-roles.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/scripts/color-roles.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/templates/tools/design-assembly/theme.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/color.mjs
  - plugins/design-assembly/tests/test-color-roles.mjs
  - plugins/design-assembly/tests/test-font-source.mjs
  - plugins/design-assembly/skills/new/SKILL.md
  - src/index.css
  - docs/trials/outside-tools-hands-on.md
  - "axe-core 4.14.0, node_modules/axe-core/axe.js: ngưỡng của luật color-contrast (4,5 và 3) và color-contrast-enhanced (7 và 4,5)"
  - "chủ repo, 2026-11-21: «Duyệt cả sáu», đáp câu «Duyệt đề bài 0012 theo cả sáu khuyến nghị?»"
---

# 0082 Bảng vai màu: mỗi vai một nguồn nói được, vai thanh bên đi theo màu chính khi chủ repo nói, và cổng đo mọi cặp bảng khai

## Status

Đã nhận, 2026-11-21. Mục 9.2, lát 1 của đề bài 0012: tiêu chí 6, 7, 9 và 10. Lát 2 (họ trung tính và tông trạng thái
là lựa chọn, kho này đáp; tiêu chí 8 và 11) chưa dựng. Plugin 0.31.0.

## Context

Trước lát này, từ màu gốc máy chỉ viết bảng tông, `--primary`, `--primary-foreground` và `--ring`; 28 trong 31 vai
màu của ứng dụng mẫu là của sàn, không ai nói gì về chúng. Ở giao diện tối, `--sidebar-primary` vẫn là màu xanh của sàn
`oklch(0.488 0.243 264.376)`, không phải màu chủ repo chọn. Cổng chỉ đo hai cặp của màu chính trong mỗi giao diện
(giới hạn `contrast-two-pairs-only`), trong khi dòng sổ `color-contrast` hỏi «mọi cặp vai màu».

Chủ repo đã đáp câu 1 của đề bài: mỗi vai có một nguồn nói được, một trong ba: lựa chọn của chủ repo qua một công thức có
tên; đi theo một vai khác; hoặc «giữ của sàn» bằng lời chủ repo, có tên và ngày. Chủ repo không gõ giá trị nào. Tiêu chí
10: một repo dựng trước bản này không bị đổi giá trị và không đỏ oan khi nâng bản hay nhận vào.

## Decision

1. **Bảng vai màu là một tệp tham chiếu của plugin**, `references/color-roles.json`. Mỗi vai của stylesheet sàn đứng ở
   đúng một mục, gọi tên theo cách bộ chuyển stylesheet gọi (`--sidebar-primary`), không nêu thư viện nào. Mỗi mục nói
   nguồn (`formula` với tên công thức và lựa chọn nó đọc; `follows` với vai nó đi theo; `floor`), câu hỏi chờ lời chủ repo
   (`asks`), và các cặp nó được đo: chữ trên nền (`on`, ngưỡng cho chữ) hay phần không phải chữ trên nền (`against`,
   ngưỡng cho phần không phải chữ). Vai không ở cặp nào nói vì sao (`unmeasured`). Bộ đọc duy nhất là
   `scripts/color-roles.mjs`; `apply`, `adopt`, `status`, trang luật và cuốn sổ đều đọc qua nó. Bài kiểm đỏ khi stylesheet
   sàn có một vai màu bảng không giữ (`tableProblems`). Bảng in ra bằng chữ qua `status --roles`.

2. **Bốn câu hỏi, không ba mươi.** Vai «giữ của sàn» hay «đi theo» được gom theo câu sẽ quyết chúng, để chủ repo được hỏi
   bốn lần:
   - `color-roles-sidebar`: ba vai của thanh bên đi theo màu chính, hay giữ của sàn (khuyến nghị: đi theo);
   - `color-roles-neutral`: 19 vai trung tính (nền, chữ, thẻ, hộp nổi, phụ, mờ, nhấn, viền, ô nhập, và phần trung tính
     của thanh bên); lát 2 đưa họ trung tính vào làm lựa chọn, nên câu này khuyến nghị chờ;
   - `color-roles-status`: vai `--destructive`; lát 2 đưa tông trạng thái vào, nên khuyến nghị chờ;
   - `color-roles-chart`: năm vai biểu đồ, «giữ của sàn hay không», như đề bài nói; không công thức nào viết màu biểu đồ ở
     bản này.

   Cách gom dựa vào câu sẽ trả lời chúng: các vai trung tính sẽ cùng ra từ một công thức họ trung tính, nên hỏi riêng
   từng vai là hỏi một điều mười chín lần. Lời chủ repo ghi vào bản thiết kế ở `layers.foundations.roles.<câu>` với
   `source`, `by`, `on`; thiếu tên hay ngày, hay một nguồn câu ấy không nhận, thì `apply` từ chối. Repo nhận vào (không có
   bản thiết kế) giữ lời đáp trên hàng chờ, có tên và ngày. Câu nào chưa có lời thì `status` nêu, kèm khuyến nghị và điều
   nó dựa vào (các cặp dưới ngưỡng kèm con số, và vai đi theo đang khác vai nó theo bao nhiêu); câu đã nằm trên hàng chờ
   thì `status` không hỏi lần hai. Chủ repo «giữ» một khuyến nghị chờ thì đó là lời của họ lúc này: câu không được hỏi
   lại; một lời đáp câu ấy không nhận thì câu được hỏi lại, nói rõ vì sao.

3. **Vai nào đi theo, và vì sao.** Ba vai: `--sidebar-primary` theo `--primary`, `--sidebar-primary-foreground` theo
   `--primary-foreground`, `--sidebar-ring` theo `--ring`. Lý do đọc từ chính sàn: ở giao diện sáng, sàn khai ba vai này
   bằng đúng giá trị của ba vai kia (`0.205`, `0.985`, `0.708`), và `--sidebar-ring` ở giao diện tối cũng bằng `--ring`;
   chỉ cặp chính của thanh bên ở giao diện tối là sàn tự chọn màu xanh riêng. Thanh bên dùng màu chính của nó để đánh dấu
   trang người đang ở, nên giữ của sàn thì dấu ấy không phải màu của chủ repo. Các vai còn lại của thanh bên
   (`--sidebar`, `--sidebar-accent` và chữ của chúng, viền) là trung tính, đi với câu trung tính; lát 2 viết chúng bằng
   công thức họ trung tính, không bằng «đi theo». Khi chủ repo nói «đi theo», khối máy sinh viết ba vai ấy trong cả `:root`
   và `.dark`, bằng giá trị của vai được theo trong cùng giao diện (`theme.json` mang `inputs.colorRoles` và
   `inputs.follows`); chưa có lời thì khối y như bản trước, nên `generated` vẫn xanh trên repo cũ. Viết cả hai giao diện vì
   `.dark` của sàn khai một màu riêng, và khai báo sau cùng mới có hiệu lực.

4. **Cổng đo mọi cặp bảng khai**, 15 cặp mỗi giao diện, sáng và tối: chữ ở ngưỡng cho chữ của mức tuân thủ (AA 4,5:1,
   AAA 7:1), vòng tiêu điểm ở ngưỡng cho phần không phải chữ (3:1). Mọi chữ đo ở ngưỡng chữ thường, chặt hơn chữ lớn.
   Câu đỏ nêu cặp, giao diện, tỉ lệ đo được và ngưỡng: `--secondary-foreground on --secondary in light mode (:root) has a
contrast ratio of 1.xx:1, below 4.5:1`. Một cặp dưới ngưỡng mà có vai còn chờ lời chủ repo thì `apply` ghi phép kiểm
   kèm `waits: <câu>`: cổng nêu nó ở mỗi lần chạy kèm con số («measures 4.34:1, below 4.5:1: not checked until the owner
   answers color-roles-neutral») và không đỏ vì nó; nó vẫn đỏ khi một vai của cặp không còn đọc được, nên phép kiểm vẫn
   thấy đỏ trên bản sao bị đổi. Chủ repo đáp «giữ của sàn» rồi chạy lại hướng dẫn thì cặp ấy thành phép kiểm thường, và
   đỏ nếu nó dưới ngưỡng. Cặp chưa đọc được (màu có độ trong suốt) không thành phép kiểm.

5. **Không đỏ oan.** `upgrade` không ghi lại `theme.json`: repo cũ giữ bốn phép kiểm cũ, cổng xanh, giá trị không đổi;
   `status` đo mọi cặp ngay trên stylesheet và nêu các cặp dưới ngưỡng kèm con số trong lời giải thích của câu hỏi. Chạy
   lại hướng dẫn sau đó thì đo đủ 30 cặp, cặp dưới ngưỡng chờ lời. `adopt` đo mọi cặp của các vai stylesheet có khai: cặp
   đạt được giữ, cặp dưới ngưỡng mà vai chờ lời thì được giữ dạng chờ và in ra kèm con số, cặp dưới ngưỡng của vai đã có
   lời, hay một trong hai cặp của màu chính (màu chính trên nền, chữ trên màu chính), thì như trước, không nhận gì. Hai cặp
   ấy không bao giờ chờ: ở repo nhận vào màu chính là của chính repo, không câu nào của bảng nói thay nó. Lượt soát độc lập
   tìm ra rằng bản đầu để cặp màu chính trên nền chờ câu trung tính, nên một màu chính quá nhạt được nhận và cổng xanh; bài
   kiểm giữ điều ấy. Vòng tiêu điểm của sàn trên nền (2,59:1 ở sàn trơn) thì chờ câu trung tính như mọi cặp khác của vai sàn. `adopt` không thêm cặp vào dòng `color-contrast` đã có
   từ bản trước: đó là dòng giới hạn mới `adopted-contrast-row-keeps-its-pairs`.

6. **Lỗi font đứng dưới dòng của nó.** Lượt soát độc lập của lát trước để lại: khi font chọn từ sổ nguồn lệch ghim, đổi
   tệp, mất giấy phép hay mất dòng, câu đỏ đúng nhưng đứng dưới `tonal-palette`. Nay dòng `typeface` giữ thêm phép kiểm
   `font-row` cho từng font chọn từ sổ nguồn; lỗi ấy được đánh dấu là của font, và `generated` khi đó chỉ giữ phần khối
   trước kiểu chữ. Repo dựng trước, có dòng `typeface` chưa có `font-row`, vẫn nghe lỗi ở `tonal-palette` như cũ, để lỗi
   không lặng đi sau khi nâng bản. Dòng ghi ở `design/escapes.md`.

7. **Trang luật và phiếu brief.** Trang luật có mục «Colour» chỉ khi dòng `color-contrast` đo các cặp của bảng: nguồn của
   từng vai ở repo này, gom theo câu, và cách các cặp được giữ. Phiếu `brief` đọc nó qua cùng bộ đọc trang luật.

8. **Bảng năng lực.** Ổ «nền» có phích `color-roles` đọc `references/color-roles.json` (trường mới `references`, phép kiểm
   hình dạng đỏ khi tệp không có trong plugin). Ba phép kiểm của bảng vẫn xanh.

### Điều đã đọc

- `color.mjs` của plugin (không đổi): độ chói tương đối theo sRGB tuyến tính (ngưỡng 0,04045, chia 12,92, mũ 2,4) và tỉ lệ
  `(L1 + 0,05) / (L2 + 0,05)`, như WCAG định nghĩa; `THRESHOLDS` của `theme.mjs` đã ghi 4,5 / 7 cho chữ và 3 cho phần
  không phải chữ, theo tiêu chí 1.4.3, 1.4.6 và 1.4.11 của WCAG 2.2. Tôi không đọc lại văn bản của WCAG ở lần này.
- axe-core 4.14.0, `node_modules/axe-core/axe.js`: luật `color-contrast` đòi 4,5 cho chữ thường, 3 cho chữ lớn; luật
  `color-contrast-enhanced` đòi 7 và 4,5. Bảng đo mọi chữ ở ngưỡng chữ thường, nên không lỏng hơn axe.
- `src/index.css` của ứng dụng mẫu: giá trị sàn của ba vai thanh bên đi theo, nêu ở mục 3. Gói sàn không có trong
  `node_modules` một tệp nào dùng `sidebar-primary` để đọc thêm cách dùng; lý do «đánh dấu trang đang ở» là cách đặt tên
  của sàn, không phải điều đã đọc từ mã linh kiện.

## Consequences

- Hợp đồng đổi: tệp tham chiếu mới `color-roles.json`; bản thiết kế có `layers.foundations.roles`; `theme.json` có
  `inputs.colorRoles` và `inputs.follows`; dòng `color-contrast` đo 15 cặp mỗi giao diện, phép kiểm `contrast` nhận
  `waits` và câu đỏ nêu giao diện; phép kiểm mới `font-row`; `status --roles`; phích cắm có trường `references`. Không
  thêm dòng nào vào bảng quyết định chuẩn.
- Kho này: không giá trị nào đổi. Hai cặp của sàn dưới ngưỡng ở giao diện sáng, chờ lời chủ repo:
  `--muted-foreground` trên `--muted` 4,34:1 (dưới 4,5:1, câu trung tính) và `--sidebar-ring` trên `--sidebar` 2,48:1
  (dưới 3:1, câu thanh bên và câu trung tính). Bốn câu nằm trên hàng chờ, mỗi câu một khuyến nghị và điều nó dựa vào.
- Một repo «đã đáp hết» trên sàn này chưa thể xanh trọn ở bản này: giữ các vai trung tính của sàn thì cặp chữ mờ đỏ.
  Đó là việc của lát 2 (tiêu chí 11). Bài kiểm của `status`, `decide` và hợp đồng lệnh dựng repo «đã đáp hết» trên một
  bản sàn có chữ mờ đậm hơn chút (`tests/helpers/answered-roles.mjs`); chỉ bản sao trong bài kiểm đổi.
- Giới hạn: `contrast-two-pairs-only` thu hẹp thành đúng điều còn hở (viền, ô nhập, vai biểu đồ, nền có độ trong suốt,
  cặp linh kiện tự tạo mà bảng không khai, cặp chờ lời). Mới: `adopted-contrast-row-keeps-its-pairs`,
  `color-roles-of-the-floor-only`, `color-role-answer-written-by-hand`. `hover-contrast-unchecked` giữ nguyên.
