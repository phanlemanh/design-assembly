---
type: spec
title: Nền đủ mảng — kiểu chữ, font thương hiệu và mọi vai màu do chủ repo chốt, mỗi giá trị có lệnh kiểm giữ
status: approved
tier: 1
links:
  - wiki/specs/0007-widen-the-entry-the-system-and-the-intent.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0064-the-owner-fixes-design-principles-and-every-recommendation-says-what-it-rests-on.md
  - wiki/decisions/0065-new-shows-whole-directions-before-any-single-value.md
sources:
  - docs/plan/plan.json
  - docs/trials/outside-tools-hands-on.md
  - docs/trials/results.tsv
  - plugins/design-assembly/references/layers.json
  - plugins/design-assembly/references/directions.json
  - plugins/design-assembly/references/standard-decisions.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/templates/tools/design-assembly/theme.mjs
  - plugins/design-assembly/templates/tools/design-assembly/tokens.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/skills/new/SKILL.md
  - src/index.css
  - design/theme.json
  - "repo kiểm chứng, chỉ đọc, ngày 2026-11-21: 40 vai màu, font nạp bằng bộ nạp font của nền dựng thứ hai"
  - "chủ repo, 2026-11-21: «Có, viết đề bài», đáp câu «Viết đề bài cho mục 9.0 (giai đoạn «Nền đủ mảng»)?»"
  - "chủ repo, 2026-11-21: «Duyệt cả sáu», đáp câu «Duyệt đề bài 0012 theo cả sáu khuyến nghị?»"
---

# 0012 Nền đủ mảng — kiểu chữ, font thương hiệu và mọi vai màu do chủ repo chốt

Máy viết ngày 2026-11-21 theo lời chủ repo («Có, viết đề bài»). Chủ repo duyệt đề bài và đáp cả sáu câu hỏi theo khuyến nghị
cùng ngày («Duyệt cả sáu»). Đây là mục 9.0 của kế hoạch: đề bài chi tiết cho cả giai đoạn 9. Giai đoạn này là việc 5 của đề bài 0007; chủ repo
nhận nó thành một giai đoạn ngày 2026-11-20. Chưa gì được dựng.

## Intent

Hôm nay chủ repo chốt năm điều ở tầng nền: màu gốc, thang chữ, tỉ lệ chữ, đơn vị khoảng cách, bo góc. Từ màu gốc, máy
viết bốn thứ: bảng tông của màu chính, `--primary`, `--primary-foreground`, `--ring`. Mọi thứ khác của giao diện là
của sàn, không ai chốt: font chữ, và 28 vai màu còn lại trong 31 vai của ứng dụng mẫu. Giai đoạn này đưa hai mảng ấy vào cùng một lối như
năm điều đã có: **người chọn, có lý lẽ; máy viết giá trị; một lệnh kiểm giữ từng giá trị.**

Dòng «xong khi» của giai đoạn: một repo đi hết `new` có kiểu chữ và mọi vai màu do chủ repo chốt, mỗi giá trị có lệnh
kiểm giữ.

### Vì sao cần

- **Font không có chỗ vào.** Không có lựa chọn, token hay lệnh kiểm nào cho họ chữ. Ứng dụng mẫu dùng font của sàn;
  repo kiểm chứng tự nạp font của nó. Bảng năng lực ghi ổ cắm «tài sản thương hiệu» chưa có phích nào
  (`capability-brand-assets-has-no-plug`). Sổ nguồn (0057) chỉ tả thư viện khối, chưa tả một font.
- **Cả giao diện không đổi theo màu của người.** Trang skill `new` phải dặn trước: mọi vai màu khác giữ giá trị của
  sàn, kể cả thanh bên. Ở giao diện tối của ứng dụng mẫu, `--sidebar-primary` vẫn là màu xanh của sàn, không phải màu
  chủ repo chọn.
- **Tương phản chỉ đo hai cặp.** Cổng đo `primary` trên nền và chữ trên `primary`. Giới hạn mức nặng
  `contrast-two-pairs-only` mở từ 2026-11-12, trong khi dòng sổ `color-contrast` hỏi «mọi cặp vai màu». Lần thử tay với
  công cụ ngoài (`docs/trials/outside-tools-hands-on.md`) đo 15 cặp của ứng dụng mẫu: hai cặp dưới 4,5:1, trong đó
  `muted-foreground` trên `muted` ở giao diện sáng là 4,34:1, một giá trị của sàn.
- **Bảng quyết định chuẩn có bốn dòng mà kho này chưa có:** `status-tone`, `theme-modes`, `motion`,
  `brand-exceptions`. Không lựa chọn nào của tầng nền dẫn tới chúng.
- **Chỗ đoán.** Ba lượt thử 12, 13, 14 không ghi chỗ đoán nào về font, màu, bóng hay chuyển động; chỗ gần nhất là dáng
  và cỡ nút trong danh sách «⋯», thuộc tầng linh kiện. Bằng chứng duy nhất về bóng là ở lần thử tay: một bóng đổ lọt
  vào vì không có token bóng. Vì vậy mảng thứ ba (độ nổi, chuyển động, mật độ) chưa có lý do để dựng trước khi đo.

### Ba mảng

**Mảng 1, kiểu chữ (mục 9.1).**

- Tầng nền thêm một lựa chọn: họ chữ của văn bản, và họ chữ của tiêu đề (cùng họ, hay một họ khác). Mỗi họ chữ là một
  trong ba: font của sàn; font hệ thống, không cần tệp nào; hoặc một font có dòng trong sổ nguồn.
- Font thương hiệu vào qua sổ nguồn: một dòng nguồn loại «font» nêu font ấy lấy ở đâu, ghim bản nào (số bản của gói,
  hay băm của từng tệp font), và giấy phép. Máy không tải gì từ mạng.
- Máy viết họ chữ vào khối nó sinh trong stylesheet và vào sổ token (nhóm mới `font`). Lệnh kiểm đỏ khi stylesheet nêu
  một họ chữ mà không gì trong repo nạp nó: trang khi ấy lặng lẽ hiện font dự phòng, đúng lỗi lần thử tay đã gặp.
- Lối `adopt` đọc font repo đang nạp và đề xuất dòng sổ là «của chính repo», như nó đang giữ màu chính của repo (0007).

**Mảng 2, vai màu (mục 9.2).**

- Một **bảng vai màu** trong plugin: mỗi vai của stylesheet đứng ở đúng một dòng, nói giá trị của nó đến từ đâu. Ba
  nguồn được phép: một lựa chọn của chủ repo qua một công thức có tên; đi theo một vai khác (thanh bên đi theo màu
  chính); hoặc «giữ của sàn» bằng lời chủ repo, có tên và ngày. Không vai nào ở trạng thái «chưa ai nói».
- Hai lựa chọn mới: **họ trung tính** (xám thuần, hay xám ngả về màu gốc), và **các tông trạng thái** sản phẩm dùng
  (lỗi luôn có; thành công, cảnh báo, thông tin tuỳ sản phẩm).
- Lệnh kiểm tương phản đo **mọi cặp chữ và nền** mà bảng vai khai, ở cả giao diện sáng và tối. Công thức cho giá trị đủ
  tương phản ngay từ lúc viết; lệnh kiểm giữ điều ấy về sau.

**Mảng 3, độ nổi, chuyển động, mật độ (mục 9.3).** Không dựng gì trước khi đo. Sau hai mảng trên, một lượt thử độc lập
của vai dẫn dắt đi hết `new` trên một repo bỏ đi; lượt ấy vừa là chứng cứ của dòng «xong khi», vừa đếm chỗ đoán theo
mảng. Mảng nào lượt thử chỉ ra thì mới có đề bài riêng; mảng nào không thì thành một dòng giới hạn và mục 9.3 đóng.

### Hai mặt bàn giao

- **Cho người:** ở `new`, mỗi lựa chọn mới hiện như các lựa chọn đang có: trên màn thật, sáng và tối, khuyến nghị đứng
  đầu kèm điều nó dựa vào (0064, 0065). Bảng vai màu in được bằng chữ: mỗi vai, nguồn của nó, cặp nó được đo cùng.
- **Cho máy:** giá trị trong khối stylesheet máy sinh, sổ token, và mỗi dòng sổ quyết định có một lệnh kiểm đã thấy đỏ
  trên một bản sao bị đổi.

### Điều giai đoạn này không làm

- Không sinh hướng đi hay bảng màu bằng mô hình; mọi giá trị ra từ lựa chọn của người qua công thức (đề bài 0007).
- Không logo, không bộ biểu tượng: ổ cắm «tài sản thương hiệu» mới có phích cho font; giới hạn của nó thu hẹp, không
  đóng.
- Không độ đậm chữ, không giãn chữ (câu hỏi 4).
- Không đo tương phản của trạng thái rê chuột hay nhấn: `hover-contrast-unchecked` giữ nguyên. Các nền pha bằng độ
  trong suốt là việc của linh kiện, do lệnh `review` đo trên hình.
- Không màu biểu đồ theo công thức: năm vai `chart` vào bảng vai bằng một câu hỏi «giữ của sàn hay không», qua hàng
  chờ.
- Không viết mã nạp font trên nền dựng mà bộ chuyển chưa biết cách (câu hỏi 5).
- Không đụng Repo Standards, Delivery Loop hay repo kiểm chứng.

## Acceptance criteria

Mỗi dòng chứng bằng một lệnh.

1. **Họ chữ là một lựa chọn.** Tầng nền có lựa chọn họ chữ của văn bản và của tiêu đề; `new` hỏi nó cùng lối với các
   lựa chọn khác; lời đáp vào bản thiết kế kèm tên và ngày. Có bài kiểm.
2. **Font có dòng nguồn.** Một font không phải của sàn, không phải font hệ thống, chỉ chọn được khi sổ nguồn có dòng
   của nó, loại «font», có ghim và giấy phép. Dòng thiếu ghim hay thiếu giấy phép thì cổng đỏ. Không lệnh nào gọi mạng:
   bài kiểm chạy khi không có mạng.
3. **Họ chữ tới stylesheet và sổ token.** Khối máy sinh nêu họ chữ; `design/tokens.json` có nhóm `font`. Đổi lựa chọn
   rồi chạy lại thì cả hai đổi theo; sửa tay khối ấy thì cổng đỏ, như các giá trị khác.
4. **Font được nạp.** Trên một kho dựng tạm, stylesheet nêu một họ chữ mà không gì nạp: cổng đỏ, câu đỏ nêu họ chữ và
   nơi nó được nêu. Bộ chuyển đọc được cách nạp của cả hai nền dựng đang có.
5. **`adopt` giữ font của repo.** Trên một kho dựng tạm đã tự nạp một font, `adopt` đề xuất dòng sổ nói đó là font của
   chính repo và không viết đè gì. Cuốn hướng dẫn nêu tên font và nơi nó đến.
6. **Không vai màu nào chưa ai nói.** Một bài kiểm đỏ khi stylesheet của sàn mà plugin phục vụ có một vai không đứng
   trong bảng vai. Ở một repo, vai có nguồn «giữ của sàn» mà chưa có lời chủ repo thì là một câu trên hàng chờ, và
   `status` nêu nó.
7. **Vai đi theo thì đi theo.** Đổi màu gốc trên một kho dựng tạm: mọi vai bảng ghi là đi theo màu chính đổi theo, ở
   cả hai giao diện. Bài kiểm nêu đích danh `sidebar-primary` ở giao diện tối.
8. **Trung tính và tông trạng thái là lựa chọn.** Mỗi lựa chọn có trong tầng nền, hiện ở `new` trên màn thật, sáng và
   tối; giá trị do công thức viết vào khối máy sinh. Có bài kiểm cho mỗi giá trị của mỗi lựa chọn.
9. **Mọi cặp được đo.** Lệnh kiểm tương phản đo mọi cặp bảng vai khai, sáng và tối, theo ngưỡng của mức tuân thủ repo
   đã chọn. Trên một bản sao bị đổi, hạ một cặp xuống dưới ngưỡng thì cổng đỏ, câu đỏ nêu cặp, giao diện, tỉ lệ đo
   được và ngưỡng. Giới hạn `contrast-two-pairs-only` được đóng, hoặc thu hẹp thành đúng điều còn hở.
10. **Repo đã có không bị đỏ oan.** `upgrade` và `adopt` trên một repo dựng trước bản này không đổi giá trị nào và
    không làm cổng đỏ: lựa chọn mới là câu trên hàng chờ; cặp dưới ngưỡng được nêu ra kèm con số, và chỉ thành lệnh
    kiểm khi chủ repo đáp.
11. **Kho này.** Chủ repo đáp các lựa chọn mới qua `decide`; sau đó cổng của kho này giữ họ chữ, bảng vai và mọi cặp
    tương phản. `make check` xanh. Cặp `muted-foreground` trên `muted` không còn dưới ngưỡng.
12. **Một repo đi hết `new`.** Trên một repo bỏ đi, một lượt `new` với bộ lời đáp niêm phong cho ra: họ chữ và mọi vai
    màu có nguồn là một lời của chủ repo, cổng xanh, và một lệnh in từng giá trị cạnh dòng sổ và lệnh kiểm giữ nó,
    không dòng nào trống. Đây là dòng «xong khi».
13. **Mảng 3 có số đo.** Lượt thử của tiêu chí 12 đếm chỗ đoán theo mảng, ghi ở `docs/trials/`. Mỗi mảng trong ba mảng
    độ nổi, chuyển động, mật độ có một trong hai: một đề bài riêng vì lượt thử chỉ ra, hoặc một dòng giới hạn nói
    lượt thử không chỉ ra gì.
14. **Sổ sách.** Bảng năng lực: ổ «tài sản thương hiệu» có phích cho font, ổ «nền» đọc thêm bảng vai; ba phép kiểm của
    bảng vẫn xanh. Trang luật plugin sinh nói họ chữ và các vai màu, chỉ ở repo có các dòng ấy. Phiếu `brief` đọc
    chúng qua cùng bộ đọc.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Các thay đổi hợp đồng, chủ repo nhận cùng
lời duyệt đề bài ngày 2026-11-21:

- **Tầng nền thêm lựa chọn:** họ chữ văn bản, họ chữ tiêu đề, họ trung tính, tông trạng thái.
- **Sổ nguồn thêm một loại nguồn, «font»,** với ghim và giấy phép bắt buộc cho loại ấy. Chỉ thêm; các dòng nguồn đang
  có không đổi.
- **Sổ token thêm nhóm `font`.** Hợp đồng đã cho phép kiểu `fontFamily`; chưa gì viết nó.
- **Bảng quyết định chuẩn:** một dòng mới cho họ chữ; dòng `status-tone`, đã có trong bảng mà kho này chưa có, được
  nối với lựa chọn tông trạng thái và lệnh kiểm; `brand-exceptions` là nơi một màu riêng của thương hiệu đi vào.
- **Một tệp tham chiếu mới trong plugin, bảng vai màu.** Nó nêu tên vai theo cách đặt tên của bộ chuyển stylesheet,
  không nêu tên thư viện trong lõi.

Hàng chờ không thêm loại mục. Khối máy sinh trong stylesheet dài thêm; phần của sàn trong stylesheet không bị sửa.

## Plan

Năm PR, mỗi PR chạy được riêng, bài kiểm viết trước mã.

1. **9.1, lát 1: họ chữ là lựa chọn.** Lựa chọn ở tầng nền, khối máy sinh, nhóm token `font`, lệnh kiểm «được nạp» với
   bộ đọc cho hai nền dựng, trang luật. Tiêu chí 1, 3, 4.
2. **9.1, lát 2: font qua sổ nguồn.** Loại nguồn «font», ghim và giấy phép, `adopt` giữ font của repo, cuốn hướng dẫn,
   bảng năng lực. Tiêu chí 2, 5, và phần font của 14.
3. **9.2, lát 1: bảng vai và mọi cặp.** Bảng vai màu, vai đi theo, lệnh kiểm mọi cặp, lối không làm đỏ repo đã có.
   Tiêu chí 6, 7, 9, 10.
4. **9.2, lát 2: trung tính và tông trạng thái.** Hai lựa chọn, công thức, `new` trình trên màn thật, kho này đáp và
   giữ. Tiêu chí 8, 11, và phần còn lại của 14.
5. **9.3: lượt thử của vai dẫn dắt.** Tiêu chí 12, 13. Lượt thử tốn token: hỏi chủ repo trước khi chạy, kèm ước tính.

Mã dùng lại: bộ viết khối (`theme.mjs`), bộ tính bảng tông và tương phản đang có, bộ đọc sổ nguồn, `decide`, bảng mẫu
vẽ trên màn thật. Không thêm thư viện nào. Mẫu và script của plugin đổi nên số bản tăng ở mỗi lát.

## Test plan

- Mỗi tiêu chí có bài kiểm trên một repo bỏ đi dựng trong thư mục tạm. Mỗi lệnh kiểm mới được thấy đỏ trên một bản sao
  bị đổi, theo lối cổng đang làm.
- Công thức của trung tính và tông trạng thái có bài kiểm cho mọi màu gốc khởi đầu của `source-colors.json`, ở cả hai
  mức tuân thủ: mọi cặp bảng vai khai đạt ngưỡng. Một màu gốc không cho ra giá trị đạt ngưỡng thì công thức nói thẳng,
  không lặng lẽ cho qua.
- Bài kiểm «không gọi mạng» cho mọi lệnh đụng tới font.
- Nền dựng thứ hai: bộ đọc cách nạp font có bài kiểm trên kho dựng tạm của nền ấy. Viết font trên nền ấy chưa được
  thử; thành một dòng giới hạn.
- Vẻ ngoài của các lựa chọn mới không có bài kiểm: chủ repo xem bảng mẫu một lần, ở lát 4.
- Repo kiểm chứng có 40 vai màu và tự nạp font: một lần đo chỉ đọc, trên bản sao bỏ đi, cho biết bảng vai phủ được bao
  nhiêu vai của nó. Chủ repo đã cho phép làm việc với repo ấy ngày 2026-11-21; mỗi bước vẫn nêu trước khi làm. Lần đo
  này không thuộc tiêu chí nào; nó trả lời câu «repo nào cũng dùng được».

## Autonomy tier

Máy dựng sau khi chủ repo duyệt đề bài và đáp các câu hỏi; mỗi lát một PR, gộp là lời của chủ repo. Luôn là lời chủ
repo: thêm lựa chọn vào tầng nền, thêm loại nguồn, đáp các lựa chọn mới của kho này, chạy lượt thử tốn token, và mọi
bước ở repo kiểm chứng. Như các mục 5.1 đến 5.3, giai đoạn này không chạy qua bộ kit Delivery Loop; đó là máy chọn theo
ba lời đáp trước của chủ repo. Điều ấy, cùng ba điều để ngoài (logo và bộ biểu tượng, tương phản lúc rê chuột, màu
biểu đồ theo công thức), đã nêu riêng với chủ repo trước khi duyệt; không điều nào bị bác.

## Open questions

Mỗi câu kèm một khuyến nghị. Chủ repo đáp cả sáu theo khuyến nghị ngày 2026-11-21 («Duyệt cả sáu»).

1. **«Mọi vai màu do chủ repo chốt» nghĩa là chủ repo gõ từng giá trị, hay mỗi vai có một nguồn nói được?** Khuyến
   nghị: mỗi vai có nguồn. Nguồn là một lựa chọn qua công thức, đi theo một vai khác, hoặc lời «giữ của sàn» có tên và
   ngày; không vai nào ở trạng thái chưa ai nói. Gõ ba mươi giá trị là việc không ai làm đúng hai lần, và không lệnh
   kiểm nào biết giá trị ấy đúng hay sai ngoài tương phản. Đã nhận: mỗi vai có một nguồn nói được.
2. **Họ trung tính: máy viết lại mọi vai trung tính bằng công thức, hay giữ giá trị của sàn và chỉ sửa cặp dưới
   ngưỡng?** Khuyến nghị: công thức, với hai lựa chọn xám thuần và xám ngả về màu gốc. Tương phản khi ấy đúng ngay từ
   lúc viết, và cả giao diện đi theo màu của người. Cái giá: lần đầu chủ repo đáp, mọi màn đổi sắc nhẹ; repo đã có giữ
   nguyên cho tới khi được đáp. Đã nhận: công thức, xám thuần hoặc xám ngả về màu gốc.
3. **Tông trạng thái: chủ repo chọn tông nào sản phẩm dùng, còn sắc độ từ một danh sách đóng; hay chủ repo chọn cả
   sắc độ?** Khuyến nghị: chọn tông, sắc độ từ danh sách đóng và công thức, như màu gốc khởi đầu hôm nay. Thương hiệu
   có màu trạng thái riêng thì vào bằng dòng sổ `brand-exceptions`, có lời chủ repo, và vẫn bị đo tương phản.
   Đã nhận: chủ repo chọn tông, sắc độ từ danh sách đóng và công thức.
4. **Kiểu chữ gồm những gì ở giai đoạn này?** Khuyến nghị: họ chữ của văn bản và của tiêu đề. Độ đậm và giãn chữ để
   ngoài, thành một dòng giới hạn: chưa lượt thử nào ghi chỗ đoán ở đó, và thang chữ cùng chiều cao dòng đã có lệnh
   kiểm. Đã nhận: họ chữ của văn bản và của tiêu đề; độ đậm và giãn chữ để ngoài.
5. **Ai viết dòng nguồn của font và mã nạp nó?** Khuyến nghị: `new` và `adopt` viết dòng nguồn khi font là một gói mà
   tệp khoá của repo đã ghim, hoặc là tệp đã nằm trong repo (băm tính tại chỗ); máy không bao giờ tải font. Mã nạp chỉ
   được viết trên nền dựng mà bộ chuyển biết cách; ở nền khác người viết, và lệnh kiểm «được nạp» giữ cả hai trường
   hợp. Giấy phép là trường bắt buộc của một nguồn font, người điền. Đã nhận: máy viết dòng nguồn khi font đã ghim
   hoặc đã có trong repo, không tải font; mã nạp chỉ viết trên nền dựng bộ chuyển biết cách.
6. **Mảng 3 vào bằng cách nào?** Khuyến nghị: bằng số đo của một lượt thử vai dẫn dắt sau hai mảng đầu, không dựng
   trước. Bằng chứng hôm nay chỉ có một bóng đổ lọt ở lần thử tay với công cụ ngoài; chừng ấy chưa đủ để chọn hình
   dạng cho token bóng, chuyển động hay mật độ. Đã nhận: mảng 3 vào bằng số đo của một lượt thử.
