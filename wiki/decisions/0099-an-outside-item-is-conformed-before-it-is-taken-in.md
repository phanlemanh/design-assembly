---
type: decision
title: "Món của nguồn ngoài được chuẩn hoá trước khi nhập kho: bản ghi chuẩn hoá, trạng thái «lấy về», và intake từ chối"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0098-choose-before-make-at-the-components-socket.md
  - wiki/decisions/0096-reui-measured-at-the-components-socket.md
  - wiki/decisions/0062-intake-takes-a-block-in-only-on-the-owners-answer.md
  - wiki/decisions/0052-the-intake-ledger-joins-the-contract-one-file-per-block.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/intake-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-conform.mjs
  - plugins/design-assembly/tests/test-intake.mjs
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Dựng lát 2», sau khi được báo lát này đổi hợp đồng sổ"
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Gộp khi xanh» cho PR #125, nhận hai khuyến nghị giữ tới lát 4"
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Gửi sang sửa», gửi hai điểm soát của PR #126"
---

# 0099 Món của nguồn ngoài được chuẩn hoá trước khi nhập kho

## Status

Accepted, 2026-11-24. Lát 2 của đề bài [0015](../specs/0015-choose-before-make-conform-before-intake.md), mục 11.2 của
kế hoạch, dựng theo lời chủ repo («Dựng lát 2»). Plugin 0.51.0. Lát này đổi hợp đồng sổ: phần «Đổi gì trong hợp đồng»
nói từng chỗ.

## Context

Đề bài 0015 đặt ba trạng thái cho một món lấy từ nguồn ngoài: lấy về, chuẩn hoá, nhập kho. Lát 1
([0098](0098-choose-before-make-at-the-components-socket.md)) đổi lời khuyên ở ổ linh kiện. Lát này dựng bản ghi của
trạng thái giữa và hai chốt chặn quanh nó: cổng đỏ khi mã của repo dùng một món chưa nhập kho, và `intake` không ghi
dòng sổ cho một món chưa chuẩn hoá. Lệnh `conform`, chạy lại bản vá và dừng khi bản vá không khớp, là lát 3.

Lượt đo ReUI cho thấy vì sao cần chốt: lần cài đầu đã sửa ba tệp khai của repo trước khi hỏi gì; 32 tệp vào kho với mã
băm của một tệp; khối được nhập khi người dựng đã tắt sàn cho 16 tệp ([0096](0096-reui-measured-at-the-components-socket.md)).

## Decision

1. **Câu hỏi nói món mang vào những gì, trước khi chủ repo giữ ứng viên** (tiêu chí 3). Đọc từ tệp của món trong bản
   chụp đã ghim, `<snapshot>/<tên món>.json`, theo dạng một registry linh kiện cho một món (`files`, `dependencies`,
   `registryDependencies`), không gọi mạng. Ứng viên mang thêm `brings`: số tệp của chính nó, các gói, các món nó đòi
   thêm, và các tệp của repo nó đòi ghi đè; tờ quyết định in một dòng «brings …» dưới ứng viên. Bản chụp không có tệp
   ấy thì câu hỏi nói không đọc được, và vì sao.
2. **Sổ mới `conform`: bản ghi chuẩn hoá** (tiêu chí 5), mỗi nhu cầu một tệp, `design/conform/<need>.json`. Nó giữ
   `need`, `source`, `item`; `taken`, mọi tệp món mang vào với mã băm lúc lấy về; `conformed`, cùng các tệp ấy với mã băm
   sau khi vá; `patches`, mỗi chỗ sửa kèm lý do; `exemptions`, mỗi luật được miễn kèm tệp và lý do. Cổng đỏ khi thiếu
   một phần, khi `taken` rỗng, khi `conformed` không giữ đúng các tệp của `taken`, khi một bản vá hay một điều miễn nói
   về tệp không thuộc món, và khi tên tệp không là nhu cầu. Bản ghi là một sổ riêng vì nó phải có trước dòng sổ nhập kho.
3. **Trạng thái «lấy về, chưa nhập kho»** (tiêu chí 4), như đề bài định: tệp của món nằm trong thư mục repo khai cho
   nguồn ấy, chưa có dòng sổ. Nguồn khai thư mục bằng khoá mới `folder` của sổ nguồn ngoài, như câu hỏi 5 của đề bài chủ
   repo đã nhận. Cổng đỏ khi một tệp mã của repo, trong thư mục nguồn và ngoài thư mục khai, import:
   - một tệp trong thư mục khai mà không bản ghi chuẩn hoá nào của một món đã nhập kho liệt kê, kể cả khi món chưa có bản
     ghi nào; thông điệp nêu tệp dùng, tệp ấy, thư mục và nguồn;
   - hay một tệp mà một bản ghi chuẩn hoá liệt kê khi chưa dòng sổ nào trả lời nhu cầu của nó; thông điệp nêu thêm tên
     món và nhu cầu.

   Mã trong một thư mục khai import lẫn nhau thì không sao. Phép kiểm mới `taken-down` nằm dưới quyết định
   `ledger-shapes`, cạnh phép kiểm hình dạng. `apply`, `adopt` và `upgrade` đều ghi nó vào dữ liệu công cụ; `upgrade` nói
   trước khi ghi, và nói cổng còn xanh không. Nó được thấy đỏ trên một bản sao nó tự đổi như mọi phép kiểm của cổng.
   - **Món nhập kho bằng 0.50.0 trở về trước**, dòng sổ chỉ nêu một tệp và không có bản ghi: chừng nào nguồn chưa khai
     thư mục, cổng không nói gì. Khi chủ repo khai thư mục, tệp dòng sổ nêu được tính là đã nhập kho; một tệp khác của món
     mà mã import thì được nêu tên, kèm việc phải làm: viết bản ghi chuẩn hoá của món và nhập lại. Khai thư mục là việc
     của người, nên một repo không tự đỏ khi nâng bản.

4. **`intake` từ chối dòng sổ cho một món của nguồn ngoài** (tiêu chí 6), và không ghi gì, khi:
   - không có bản ghi chuẩn hoá cho nhu cầu;
   - bản ghi sai hình dạng;
   - bản ghi nói về món khác, hay nguồn khác, với món chủ repo đã giữ;
   - tệp `--file` không nằm trong bản ghi;
   - một tệp trên đĩa không còn là tệp bản ghi giữ sau khi vá;
   - một tệp của món tắt một luật (một chú thích `eslint-disable`, `@ts-nocheck`, `@ts-ignore`, `@ts-expect-error`) mà
     bản ghi không miễn luật ấy ở tệp ấy.

   Khi đủ, dòng sổ ghi thêm `conform`: đường dẫn tới bản ghi, nơi giữ mã băm của mọi tệp.

5. **Hai lựa chọn chủ repo đã nhận tới lát 4 giữ nguyên:** một phích ngoài là nguồn đã ghim khi `design/sources/` có tệp
   cùng mã; lựa chọn một phích ngoài đã ghi ở ổ linh kiện được giữ, không áp.

## Đổi gì trong hợp đồng

- **Sổ mới `conform`**, `design/conform/<need>.json`, bản 1, có từ mục đầu tiên. Hợp đồng nay có mười bốn sổ.
- **Sổ `intake`**: thêm khoá không bắt buộc `conform` cho một khối. Hình dạng vẫn là bản 1.
- **Sổ `sources`**: thêm khoá không bắt buộc `folder`, thư mục repo cài tệp của các món vào. Hình dạng vẫn là bản 1; một
  nguồn ghi trước khoá này không khai thư mục nào, và cổng không nói gì về nó.
- **Dòng sổ ghi bằng 0.50.0 trở về trước vẫn đọc được**: khoá mới không bắt buộc, nên một khối của nguồn ngoài không có
  `conform` vẫn đúng hình dạng, vẫn là câu trả lời ở bậc kho, và phép kiểm `taken-down` không nói gì về nó (có bài kiểm
  trên sổ như bản cũ ghi). `intake` chỉ đòi bản ghi khi ghi một dòng mới.
- **`upgrade` không viết lại dòng nào của sổ nhập kho hay sổ nguồn ngoài.** Nó thêm phép kiểm `taken-down` vào hàng
  `ledger-shapes` của dữ liệu công cụ khi hàng ấy thiếu nó, nói trước khi ghi, và dừng như mọi lần khi cổng sẽ đỏ. Theo
  tiền lệ của bước cổng `upgrade` đã ghi ([0086](0086-upgrade-writes-the-gate-step-the-seam-is-pinned-and-a-command-reads-the-screens.md)). `adopt` cũng ghi phép kiểm ấy.

## Consequences

- Trang `references/contract.md` có bảng sổ, mục `conform`, câu về khoá `conform` của sổ nhập kho và khoá `folder` của
  sổ nguồn ngoài.
- Năm dòng giới hạn của lát 1 và lượt đo ReUI được thu hẹp vì lát này làm được một phần: món không chuẩn hoá trước khi
  nhập; khối ngoài nhập vào khi còn đỏ; một dòng sổ cho nhiều tệp; dòng cài làm những gì không ai nói trước; sửa mã ngoài
  không bằng bản vá ghi lại. Không dòng nào đóng, vì không dòng nào được làm trọn.
- Ba dòng giới hạn mới. Hai dòng còn mở: điều món mang vào chỉ đọc từ một tệp của bản chụp; cổng chỉ thấy món chưa nhập
  kho qua import, và không thấy tệp của một nguồn chưa khai thư mục. Dòng thứ ba, `upgrade` không thêm phép kiểm mới vào
  dữ liệu công cụ, mở và đóng trong cùng lát này, sau soát.
- Plugin lên 0.51.0.
- Kế hoạch: mục 11.2 xong.
