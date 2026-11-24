---
type: decision
title: "Phần nổi của món ngoài được mở trên màn dùng nó: tên, chữ của món, và phép kiểm của repo"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0104-filters-taken-in-through-conform-measured.md
  - wiki/decisions/0099-an-outside-item-is-conformed-before-it-is-taken-in.md
  - wiki/decisions/0053-a-command-says-which-screens-a-change-reaches.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/floating-parts.mjs
  - plugins/design-assembly/templates/tools/design-assembly/item-text.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/playwright.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/playwright-floating-parts.mjs
  - plugins/design-assembly/templates/owned/floating-parts.spec.ts.template
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-floating-parts.mjs
  - plugins/design-assembly/tests/test-floating-parts-install.mjs
  - plugins/design-assembly/tests/test-upgrade.mjs
  - "chủ repo, 2026-11-24, qua phiên điều phối: «Mở song song» (dựng 11.7 song song 11.8; 11.8 gộp trước)"
---

# 0106 Phần nổi của món ngoài được mở trên màn dùng nó: tên, chữ của món, và phép kiểm của repo

## Status

Accepted, 2026-11-24, mục 11.7 của kế hoạch: tiêu chí 18 đến 21 ở phần bổ sung của đề bài
[0015](../specs/0015-choose-before-make-conform-before-intake.md), mà chủ repo duyệt cùng PR 133 với tám khuyến nghị.
Plugin 0.57.0. Dựng song song mục 11.8 theo lời chủ repo («Mở song song»). Lượt chạy lại `filters` (tiêu chí 26) không
thuộc mục này.

## Context

Lượt thử lấy lại `filters` ([0104](0104-filters-taken-in-through-conform-measured.md)) cho cổng xanh mà hai lỗi khả năng
truy cập của món vẫn còn trên màn: ô nổi `role="dialog"` không tên sau nút «Thêm bộ lọc», và vùng `role="status"` đọc
«Top level, 2 items», ghép trong tệp của món. Phép kiểm của repo chạy ở từng trạng thái của màn nhưng không mở phần nổi
nào. Dòng giới hạn `conform-runs-no-accessibility-check`.

## Decision

1. **Logic ở thư mục công cụ, một tệp kiểm trình duyệt hai câu lệnh gọi nó** (câu hỏi 1 của phần bổ sung).
   - `floating-parts.mjs` lập kế hoạch và đi từng màn; `item-text.mjs` đọc chữ của món và đối chiếu với bảng chữ.
   - Adapter của trình duyệt kiểm giữ mọi thứ mang tên thư viện: đọc cách repo cấu hình phép kiểm khả năng truy cập của
     nó, chạy phép ấy, và phần chạy trong trình chạy bài kiểm (`adapters/playwright-floating-parts.mjs`). Lõi không nêu
     tên nào.
   - Tệp của repo, `tests/e2e/floating-parts.spec.ts`: một dòng nhập, một vòng lặp khai một bài kiểm cho mỗi màn.
     Trình chạy bài kiểm gắn bài kiểm vào tệp nơi `test()` được gọi, nên tệp của repo phải tự gọi nó; gọi từ một tệp
     của thư mục công cụ thì lệnh chạy riêng tệp ấy không thấy bài kiểm nào.
   - Tệp ấy không nêu `decision:` nào: repo không có phép kiểm mức tuân thủ cũng chạy nó, và nếu nêu một dòng mà sổ
     không có thì cổng đỏ.
2. **Màn nào.** Mỗi màn mà bản đồ thay đổi lần tới từ một tệp của một bản ghi chuẩn hoá, như `change` lần tới các màn của
   một khối; bản đồ không lần được thì mọi màn. Tệp không màn nào nhập thì không tới màn nào. Mở ở bề rộng lớn nhất
   repo kê.
3. **Mở phần nổi.** Trên màn như nó đứng, bấm từng nút có `aria-haspopup` hay `aria-expanded="false"`, mỗi nút trên màn
   nạp lại từ đầu, nên màn luôn như lúc tìm thấy. Một tầng: nút nằm trong phần nổi không được bấm. Không theo liên kết,
   không bấm nút gửi biểu mẫu (biểu mẫu còn bị giữ không gửi), không bấm nút bị khoá; mỗi điều được nói ra. Bấm không mở
   gì thì thử phím mũi tên xuống; vẫn không gì thì đỏ.
4. **Ba điều khi phần nổi đang mở.**
   - Mỗi phần tử vừa mở có `role` là `dialog`, `alertdialog`, `menu` hay `listbox` phải có tên do người viết
     (`aria-labelledby`, `aria-label`, `title`). Phép kiểm này tự giữ, dù repo chỉ chạy nhãn WCAG (câu hỏi 2).
   - Chữ của món: như đề bài viết, với chuỗi một chữ thu hẹp như mục «Thu hẹp chuỗi một chữ» dưới đây. Máy tính thêm chữ viết giữa hai thẻ là chuỗi viết sẵn (đề bài nói «mọi chuỗi viết
     sẵn»). Đỏ được gộp theo dòng chữ trên màn: một dòng đỏ cho mỗi dòng chữ, nêu mọi chuỗi và tệp của nó. Bảng chữ là
     tệp dữ liệu công cụ nêu ở `words`, hoặc tệp mà nguồn của dòng `labels`, `copy-content` hay `terms` bắt đầu bằng.
   - Phép kiểm của repo chạy như repo cấu hình: đọc từ chuỗi lời gọi giữa bộ dựng và lần chạy trong tệp kiểm mà sổ
     quyết định nêu làm bằng chứng. Repo không có thì hai điều đầu vẫn giữ và bài kiểm nói phép của repo không chạy.
     Cấu hình viết khác giá trị thuần thì đỏ, nêu lý do.
5. **Ai giữ: cổng** (câu hỏi 4). Bước công cụ có phép kiểm `floating-parts` dưới dòng `ledger-shapes`: có bản ghi chuẩn
   hoá mà thiếu tệp kiểm, hay tệp không gọi phép kiểm, thì đỏ. Bài kiểm trình duyệt chạy cùng các bài kiểm trình duyệt
   của repo. `intake` không chạy trình duyệt; câu hỏi nhập kho có thêm dòng «the gate:» nói cổng giữ gì, và nói khi phép
   kiểm của repo không chạy ở đó (câu hỏi 6).
6. **Ai viết tệp kiểm.** Hướng dẫn và `adopt` viết khi repo kê trình duyệt kiểm của adapter và chưa có tệp. `upgrade` viết
   khi chưa có, không bao giờ viết đè, nêu trước các bản ghi chuẩn hoá mà tệp sẽ giữ, không chạy trình duyệt và không nói
   bài kiểm ấy sẽ xanh hay đỏ (câu hỏi 3).

## Đo trên bản sao của lượt thử

Bản sao của lượt thử `filters` (nhánh `second-use`, hai màn dùng món), đưa lên bằng `upgrade` của plugin này:

- Mỗi màn mở một nút, «Thêm bộ lọc». Mỗi màn 5 dòng đỏ:
  - ô nổi `dialog` không tên (lỗi một của lượt thử);
  - «Top level, 2 items» (lỗi hai), nêu 9 chuỗi;
  - «Use the Right Arrow key to open a branch and the Left Arrow key to go back.», một câu tiếng Anh thứ ba của món, lượt
    thử chưa thấy, nêu 18 chuỗi;
  - phép kiểm của repo: `aria-dialog-name` (trùng lỗi một) và `label-title-only` (ô nhập trong phần nổi chỉ có `title`).
- Với luật như đã duyệt (commit `42d7e5b`): 27 chuỗi bị nêu mỗi màn, cả 27 nằm trên chữ của chính món, nhưng chỉ 7 nêu
  đúng tệp đã viết dòng ấy (`cascader-i18n.tsx`); 20 là chữ ngắn của tệp khác trùng chữ trong câu (`level`, `to`,
  `and`, `top`, `back`…). Phiên điều phối thay một dòng dữ liệu mẫu bằng «Máy in to» và thấy dòng ấy đỏ trên cả hai màn,
  không phần nổi nào mở, vì «in» và «to» là chuỗi của món. Dữ liệu của ứng dụng mẫu lấy từ bảng chữ, nên lượt đo đầu
  không gặp ca ấy; dữ liệu thật của một repo không nằm trong bảng chữ nào.
- Nhánh `first-use`, nơi chỉ màn `/` dùng món: chỉ màn ấy được mở, và đỏ như trên.
- Mỗi màn khoảng 3,5 giây; cả lượt 10 đến 13 giây, kể cả dựng ứng dụng.

## Thu hẹp chuỗi một chữ

Chủ repo chọn «Thu hẹp luật», ngày 2026-11-24. Luật mới, một đoạn ở đề bài 0015 (đoạn «Khớp» và tiêu chí 19): chuỗi từ
hai chữ trở lên khớp một dòng chữ trên màn thì đỏ; chuỗi một chữ chỉ đỏ khi trên cùng dòng có một chuỗi từ hai chữ trở
lên của cùng tệp cũng khớp. Người kiểm tay được: tìm chuỗi nhiều chữ của một tệp trên dòng, rồi mới xét chuỗi một chữ
của tệp ấy.

Đo lại trên bản sao `second-use`, thêm ba dòng dữ liệu: «Máy in to» thay dòng mẫu thứ ba, «Open status report» và
«Gói dữ liệu text and number». Cùng một bản sao, hai bản của plugin:

|                                   | Luật đã duyệt (`42d7e5b`)          | Luật thu hẹp                                           |
| --------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| Ba dòng dữ liệu                   | đỏ (cả ba ở `/`, hai ở `/overdue`) | không đỏ                                               |
| Ô nổi không tên sau «Thêm bộ lọc» | đỏ                                 | đỏ                                                     |
| «Top level, 2 items»              | đỏ, nêu 9 chuỗi                    | đỏ, nêu «Top level» và «items» của `cascader-i18n.tsx` |
| Câu «Use the Right Arrow key…»    | đỏ, nêu 18 chuỗi                   | đỏ, nêu 6 chuỗi của `cascader-i18n.tsx`                |
| Chuỗi bị nêu, cả hai màn          | 71                                 | 16 (8 mỗi màn), cả 16 của tệp đã viết dòng ấy          |

Điều luật thu hẹp để lọt, mà luật đã duyệt bắt: một dòng mà chữ của món trên đó chỉ là chuỗi một chữ, như một nút món
tự đặt tên «Close», hay `${n} items` đứng một mình. Trên bản sao của lượt thử, không chữ nào của món bị lọt như vậy.
Dòng giới hạn `item-text-one-word-alone`. Ngược lại, chuỗi nhiều chữ của món mà một dòng dữ liệu tình cờ có (như «top
level» trong một tên) vẫn đỏ: dòng giới hạn `item-text-phrase-in-data`.

## Consequences

- Sổ giới hạn:
  - **đóng** `conform-runs-no-accessibility-check`, và `item-text-names-every-file-with-the-word` (mở rồi đóng trong
    cùng PR, khi luật được thu hẹp);
  - **mới** `item-popups-one-level` (như phần bổ sung nói), `item-popups-one-width`, `item-popups-opened-as-nobody`,
    `item-popups-pressed-by-click-or-arrow`,
    `own-check-read-from-its-calls`, `item-words-table-found-by-its-row`, `item-used-by-the-frame-only`,
    `item-text-one-word-alone`, `item-text-phrase-in-data`.
- Repo này: chưa có bản ghi chuẩn hoá nào, nên tệp kiểm khai không bài kiểm nào và cổng không chậm thêm. Bài kiểm của
  plugin mở trình duyệt của repo trên trang phục vụ từ máy này; năm bài cần trình duyệt mất khoảng 13 giây, chạy song song
  với các tệp kiểm khác trong `make plugin-test`, sau khi `ui-floor` đã cài trình duyệt.
- Hợp đồng: dữ liệu công cụ có thêm một loại phép kiểm, `{ kind: "floating-parts", test }`, dưới `ledger-shapes`, khoá
  `words` không bắt buộc. Câu hỏi nhập kho có thêm khoá `gate` ở ứng viên của nguồn ngoài. Sổ chuẩn hoá, sổ nhập kho, sổ
  quyết định và sổ nguồn ngoài không đổi.
