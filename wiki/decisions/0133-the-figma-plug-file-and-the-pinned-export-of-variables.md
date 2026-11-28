---
type: decision
title: "Phích Figma có tệp phích, skill bring-in dẫn lối tệp .fig trước, và bản xuất biến mang vào được giữ có ghim bằng loại nguồn variables"
links:
  - wiki/specs/0018-figma-at-the-foundations-socket.md
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0069-the-capability-table-and-its-checks.md
  - wiki/decisions/0124-the-mark-enters-through-the-sources-ledger.md
  - wiki/decisions/0130-bring-in-reads-a-real-export-of-variables.md
sources:
  - plugins/design-assembly/references/plugs/figma.json
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/scripts/bring-in.mjs
  - plugins/design-assembly/scripts/variables-source.mjs
  - plugins/design-assembly/skills/bring-in/SKILL.md
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-bring-in.mjs
  - plugins/design-assembly/tests/test-variables-source.mjs
  - docs/trials/figma-fig-real-sample.md
  - docs/trials/figma-variables-hands-on.md
  - docs/plan/plan.json
  - "chủ repo, 2026-11-28: «Dựng 13.3», đáp câu «Anh cho dựng lát 13.3 (tệp phích Figma, bước `plugs`, skill `bring-in` dẫn lối tệp `.fig` trước) bây giờ chứ?»"
---

# 0133 Phích Figma có tệp phích, và bản xuất biến mang vào được giữ có ghim

## Status

Proposed, 2026-11-28, plugin 0.78.0. Mục 13.3 của kế hoạch, tiêu chí 10 đến 13 của đề bài
[0018](../specs/0018-figma-at-the-foundations-socket.md), cùng tiêu chí 15 và 16. Dựng trên nhánh theo lời chủ repo
(«Dựng 13.3»); lời ấy không gồm đẩy, mở PR hay gộp. **Lát này đổi hợp đồng sổ nguồn, cần người duyệt:** thêm loại nguồn
`variables` (điểm 4). `ontology/` không đổi. Lối bản xuất sẵn có của Figma (13.2) và lượt đo bốn thước (13.4) không
thuộc lát này.

## Context

Sau lát 13.1 ([0130](0130-bring-in-reads-a-real-export-of-variables.md)) cầu `bring-in` đọc đúng một bản xuất biến thật,
nhưng bốn thứ quanh nó chưa có:

- Figma đứng ở mức (c) của đề bài 0014: không có tệp phích, nên bảng phích không nêu nó ở ổ nào.
- Skill `bring-in` chỉ nói «hỏi người dùng tệp»: người chưa có tệp không biết lấy bằng lối nào, và không gì nói plugin
  không tải hay chạy công cụ đọc `.fig` thay họ.
- Bản xuất đã mang vào không được giữ: không gì nói được tệp đã đổi. Đây đúng là chỗ lượt đo Mobbin thua ở thước 1
  (câu hỏi mở 4 của đề bài).
- Tiêu chí 16 đòi tên công cụ ngoài chỉ nằm trong thư mục phích. Skill và script là «lõi»: chúng không được viết chữ
  Figma, và phép «lõi sạch» đỏ nếu viết.

Về sổ nguồn, **không hình dạng sẵn có nào vừa** một bản xuất biến:

- Dòng không có `kind` là một thư viện khối: hợp đồng đòi `catalog`, bộ đọc xếp nó lên thang của ổ linh kiện và `find`
  duyệt nó. Dòng giới hạn `reference-row-read-as-a-block-library` đã ghi đúng điều này cho một loại lạ.
- `font`, `icon-set` và `logo` mang trường riêng của chúng (họ chữ, mô-đun, vai và biến thể của tệp) và đều chờ một câu
  giấy phép do người viết.
- `core` là lõi của họ, mỗi repo một dòng.

## Decision

1. **Tệp phích `references/plugs/figma.json`** (tiêu chí 10). Khai hai ổ `direction` và `foundations`; phiên liệt kê nó
   qua máy chủ (`mcp_servers`), không qua skill nào; `needs` là `account`, `network`, `machine`; `sends` nói «khoá tệp và
   id nút tới Figma khi đọc qua máy chủ MCP; lối tệp không gửi gì»; `machine` nêu hai điều của lối `.fig` (quyền lưu tệp
   về máy, một công cụ đọc `.fig` do người dùng tự chạy) và tên, bản và giấy phép của công cụ đã thử, lấy từ
   [bản ghi lượt thử](../../docs/trials/figma-fig-real-sample.md). Không có mục `measured`. Tên công cụ đọc và tên giấy
   phép cũng nằm trong `names`, để phép «lõi sạch» bắt chúng như bắt tên Figma.
2. **Tệp phích có thêm khoá `ways`:** danh sách có thứ tự các lối lấy tệp. Mỗi lối có `id`, `how`, và đúng một trong
   hai: `reads` (loại mà cầu đọc nó) hay `not_read` (vì sao cầu chưa đọc). Lối đầu là lối người dùng được dẫn tới, nên
   phải là lối cầu đọc được. `plugProblems` giữ hình dạng ấy, mỗi lỗi một câu nêu tệp. Đây là khoá của tệp phích, không
   phải của hợp đồng sổ. Tệp của Figma khai hai lối: `saved-file` (tệp `.fig`, đọc như bản xuất biến) đứng trước, rồi
   `own-export` (thư mục `.tokens.json` do Figma xuất), ghi rõ cầu chưa đọc thư mục ấy.
3. **Skill `bring-in` nói các lối mà không gọi tên công cụ nào** (tiêu chí 12 và 16). `bring-in.mjs --ways` in các lối
   của mọi tệp phích có khai, đúng thứ tự, kèm `sends` và `machine`; skill bảo nói từng lối như đã in, lối đầu trước, và
   lối ghi `not read yet` thì nói là chưa đọc, không giả là đọc được. Skill cấm tải, cài, build hay chạy công cụ đọc
   tệp thiết kế thay người dùng. Máy chủ của công cụ trong phiên không phải lối mang hệ vào; nếu người dùng vẫn muốn
   tra gì qua nó thì trước mỗi lượt gọi skill nói gửi gì, đi đâu, tốn một lượt của hạn mức, và chỉ gọi công cụ đọc.
4. **Hợp đồng sổ nguồn thêm loại nguồn `variables`** (tiêu chí 13; thay đổi hợp đồng, cần người duyệt). Một dòng
   `design/sources/<id>.json` có `kind: variables` là một bản xuất biến đã mang vào:
   - không cần `catalog`, và các bộ đọc thư viện (`readPinnedSources`) bỏ nó ra;
   - `pin` bắt buộc, gồm `fetched_at` (ngày lấy, `YYYY-MM-DD`) và `files`, mỗi tệp theo đường dẫn từ gốc repo, với
     `sha256` và có thể `bytes`;
   - `plug` là khoá gốc đã có của sổ, nêu phích mà bản xuất đi qua; ở loại này nó tuỳ chọn;
   - không chờ giấy phép: dòng nói tệp nào được mang vào và ngày nào, không nói quyền dùng.

   Bản của sổ giữ 1, như khi thêm `font`, `icon-set` và `logo`. Vì sao không dùng hình dạng có sẵn: xem Context.

5. **Lệnh `variables-source`** viết dòng ấy theo nếp của `font-source` và `logo-source`: từ một tệp đã nằm trong repo
   (`--file`), băm tại chỗ, không chép, không tải, không ghi đè dòng đã có. `--check` so mọi dòng loại này với repo và
   thoát 1 khi một tệp khác ghim, câu nêu dòng và tệp. `--again --id` ghim lại tệp như nó đang là, kèm ngày, giữ mọi chữ
   khác của dòng. Tệp không phải JSON biến theo collection bị từ chối, nên tệp `.fig` không bao giờ được ghim; tệp ngoài
   repo và tệp nằm thẳng trong `design/sources/` cũng bị từ chối. Repo có bản công cụ chưa biết loại này thì được bảo
   nâng công cụ trước. Trong bảng năng lực, lệnh là một phích của ổ hướng đi, ghi qua ổ tham chiếu
   (`writes_through: reference`), như ba lệnh nguồn kia.
6. **Cổng giữ hình dạng của dòng, không so ghim.** So tệp với ghim là việc của `variables-source --check`. Thêm một
   phép kiểm vào cổng đụng năm lệnh (cổng, `adopt`, dẫn dắt, `upgrade`, lệnh nguồn) và tiêu chí 13 chỉ đòi «một lệnh nói
   được»; dòng giới hạn `variables-pin-not-held-by-the-gate` ghi phần còn thiếu.
7. **Bước `plugs` không đổi mã** (tiêu chí 11). Trạng thái `in-session`, `needs-sign-in`, `absent` của Figma được đọc
   như mọi phích có máy chủ, từ tên tệp phích khai. Luật «phích chưa đo không bao giờ được hỏi hay khuyến nghị» đã có;
   lát này thêm bài kiểm giữ nó cho phích này, và bài ấy đỏ nếu một câu hỏi nêu nó.

Những chỗ máy tự chọn trong khuôn đề bài, cần người xác nhận:

- tên loại nguồn là `variables`, và dòng không chờ giấy phép;
- tệp phải nằm sẵn trong repo, lệnh không chép hộ: bản xuất mang giá trị của hệ thiết kế thật, nên chỉ vào repo khi
  chính người dùng đặt nó vào;
- cổng không so ghim (điểm 6), và có `--again` để ghim lại;
- `plug` trên dòng là tuỳ chọn, để bản xuất cùng hình dạng không đi qua phích nào vẫn giữ được;
- khoá `ways` của tệp phích, và việc để tên công cụ đọc cùng giấy phép vào `names`;
- tên máy chủ khai trong tệp phích đọc từ danh sách của một phiên, nơi nó đứng dưới tiền tố của một plugin.

## Consequences

- **Tiêu chí 10:** tệp phích có, `readCapabilities().problems` rỗng, phép «lõi sạch» xanh. **Tiêu chí 11:** bảng phích
  hiện phích ở hai ổ với ba trạng thái; với một phiên giữ mọi phích ngoài, không câu hỏi nào nêu hay khuyến nghị nó.
  **Tiêu chí 12:** `bring-in --ways` in lối `.fig` trước, lối thứ hai kèm «not read yet»; chữ của skill được giữ bằng
  bài kiểm. **Tiêu chí 13:** dòng có ngày lấy, `sha256` và phích; đổi một byte của tệp thì `--check` thoát 1 và nêu dòng
  cùng tệp. **Tiêu chí 15:** mọi lệnh của các bài kiểm chạy với mạng bị chặn và không với tới gì; mẫu thử là mẫu bịa của
  lát 13.1. **Tiêu chí 16:** ngoài thư mục phích, không tệp nào của plugin nêu tên công cụ, và không tệp nào, kể cả bài
  kiểm, nêu tên công cụ đọc hay giấy phép của nó.
- Bài kiểm mới: 8 ở `tests/test-bring-in.mjs`, 14 ở `tests/test-variables-source.mjs`. Mọi bài được thấy đỏ trước khi có
  mã.
- Một tác tử độc lập đọc lại thay đổi trước khi commit: không có lỗi nặng, ba lỗi vừa, ba điểm nhẹ. Máy kiểm lại từng
  điều trên mã, cả sáu đúng; mỗi lỗi vừa có bài kiểm thấy đỏ trước khi sửa:
  - một dòng ghim tệp bằng đường dẫn tuyệt đối, có `..`, nằm thẳng trong `design/sources/`, hay nêu một tệp hai lần vẫn
    qua phép kiểm hình dạng; nay cổng đỏ ở dòng ấy;
  - một tệp hỏng JSON trong `design/sources/` làm `--check` nói «không giữ bản xuất nào» và thoát 0; nay `--check` nêu
    tệp ấy và thoát 1;
  - trên ổ đĩa không phân biệt hoa thường, đường dẫn gõ khác cách đĩa ghi lọt qua phép chặn thư mục của sổ và được ghim
    bằng tên không phải của nó; nay bị từ chối, kèm cách đĩa ghi;
  - điểm nhẹ: bài kiểm còn viết đuôi tệp của công cụ ngoài và bốn byte đầu của định dạng ấy (đã bỏ, tiêu chí 16);
    `--again` lặng lẽ bỏ qua `--plug` và `--title` (nay từ chối); bài kiểm «không câu hỏi nào nêu phích chưa đo» chỉ xem
    các câu của vòng đầu (nay xem mọi ổ của bảng).
- Sổ giới hạn mở mười một dòng, không đóng dòng nào (619 thành 630 dòng, 489 thành 500 dòng mở):
  `design-file-plug-unmeasured`, `design-file-own-export-not-read`, `design-file-reader-terms-unread`,
  `design-tool-server-matched-by-declared-name`, `plug-ways-are-sentences-of-their-day`,
  `bring-in-call-rules-held-by-words`, `variables-pin-not-held-by-the-gate`, `variables-source-keeps-variables-only`,
  `variables-pin-moved-by-a-formatter`, `variables-row-plug-is-the-callers-word`, `design-file-in-a-repository-unseen`.
- Repo không có dòng loại `variables` không thấy gì đổi ở cổng. Repo dùng bản công cụ cũ không viết được dòng mới:
  lệnh từ chối và bảo `upgrade` trước.
- **Chưa chứng:**
  - Chưa ai đi hết lối `.fig` từ tệp thật tới hướng ứng viên qua skill mới; đó là lượt đo của mục 13.4.
  - Luật của skill (nói trước khi gọi, chỉ gọi công cụ đọc, không chạy công cụ đọc `.fig`) được giữ bằng chữ của skill,
    không bằng thứ gì nhìn việc tác tử làm.
  - Giấy phép của công cụ đọc và điều khoản của Figma về việc giải mã tệp `.fig` chưa ai đọc kỹ; tệp phích chỉ bảo người
    dùng đọc giấy phép trước khi chạy.
  - Tên menu và hình dạng bản xuất sẵn có ghi trong `ways` lấy từ hai lượt thử ngày 2026-11-26, không phép kiểm nào
    thấy khi Figma đổi.
