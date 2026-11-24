---
type: spec
title: Chọn trước, tạo sau — lấy về, chuẩn hoá, rồi mới nhập kho
status: approved
tier: 1
links:
  - wiki/specs/0006-the-reusable-store.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0062-intake-takes-a-block-in-only-on-the-owners-answer.md
  - wiki/decisions/0096-reui-measured-at-the-components-socket.md
  - wiki/decisions/0104-filters-taken-in-through-conform-measured.md
  - docs/trials/filters-through-conform.md
sources:
  - docs/plan/plan.json
  - docs/trials/README.md
  - docs/trials/reui-components-measured.md
  - plugins/design-assembly/scripts/find.mjs
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/change.mjs
  - plugins/design-assembly/scripts/plugs.mjs
  - plugins/design-assembly/references/vocabulary.json
  - tools/plan.mjs
  - plugins/design-assembly/templates/mk/
  - tools/patch_ui.mjs
  - .claude/rules/ui.md
  - design/decisions.yaml
  - plugins/design-assembly/templates/owned/templates.spec.ts.template
  - plugins/design-assembly/references/limits.json
  - "PR #119 của kho này, số đo ReUI ở ổ linh kiện: chưa gộp lúc đề bài được viết, vào nhánh chính ngày 2026-11-24 ở 6108f8f"
  - "repo kiểm chứng (Inventory), nhánh chính tại 1ad8469f, đọc ngày 2026-11-24, chỉ đọc: wiki/decisions/0023-chon-truoc-tao-sau.md, .claude/skills/inventory-ui/SKILL.md, .claude/rules/ui.md, tools/proof_gate/check.py và khuon-chung-minh.md, tools/reui_catalog/, design/intake/, eslint.config.js, .prettierignore, tools/typecheck_own.mjs, design/tool-stamp.json"
  - "plugs.mjs --dry-run --short, find.mjs và inventory.mjs của nhánh PR #119 chạy lên repo kiểm chứng ngày 2026-11-24; ba lệnh không ghi gì ở kho ấy"
  - "plugs.mjs --dry-run --short chạy lại ngày 2026-11-24 từ nhánh này sau khi gộp nhánh chính bed0eb9 (plugin 0.49.0), lên repo kiểm chứng tại 1ad8469f; kho ấy không đổi tệp nào"
  - "chủ repo, 2026-11-24: «Điều này ban đầu ý định là buộc dùng lại thay vì tự tạo.»"
  - "chủ repo, 2026-11-24: «Cách tôi mô phỏng lại cách làm của con người hay những đội top tier là dùng lại và tối ưu, như cách tạo kho, thì qua thời gian cải tiến nó và nó nhất quán với hành vi chung của cả hệ thống»"
  - "chủ repo, 2026-11-24: «bao giờ khi lấy từ kho ngoài về thì đều không chuẩn và chấp nhận việc này nhưng phải có giải pháp để chuẩn nó, tinh chỉnh trước sau đó mới nhập kho»"
  - "chủ repo, 2026-11-24: «Viết đề bài»"
  - "chủ repo, 2026-11-24: «Duyệt cả chín», đáp câu «Duyệt đề bài 0015 theo khuyến nghị của cả chín câu hỏi không?»"
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối và phiên ấy chuyển lại nguyên văn: «Gửi, mở song song», đáp câu «Anh muốn tôi gửi bốn điểm sang sửa với giai đoạn 11 mở song song giai đoạn 10 («Gửi, mở song song»), hay gửi với lát 1 đi ngoài kế hoạch («Gửi, lát 1 ngoài kế hoạch»)?»"
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Lập mục mới», cho mục 11.7 và 11.8 của kế hoạch"
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Viết bổ sung», cho phần bổ sung của đề bài này"
---

# 0015 Chọn trước, tạo sau — lấy về, chuẩn hoá, rồi mới nhập kho

Máy viết ngày 2026-11-24 theo lời chủ repo («Viết đề bài»), sau lượt đo ReUI ở ổ linh kiện
([0096](../decisions/0096-reui-measured-at-the-components-socket.md)) và một lượt đọc repo kiểm chứng. Chủ repo duyệt
đề bài và đáp cả chín câu hỏi theo khuyến nghị cùng ngày («Duyệt cả chín»). Chưa gì được dựng.

Kế hoạch có thêm giai đoạn 11, đứng sau giai đoạn 10 và trước giai đoạn 7. Cùng ngày, chủ repo cho giai đoạn 11 **mở
song song giai đoạn 10** («Gửi, mở song song»), vì công cụ kế hoạch không nhận một mục của giai đoạn chưa mở. Điều ấy
mở ra ba thứ, nói cho rõ:

- Cả bảy mục của giai đoạn 11 làm được từ hôm nay, không riêng lát 1.
- Mỗi lát vẫn là một PR, và gộp vẫn là lời chủ repo.
- Giai đoạn 10 vẫn là giai đoạn hiện tại, với mục 10.2 và 10.4 chưa xong.

Đề bài này là mục 11.0, ghi xong ngày 2026-11-24.

## Intent

Chủ repo muốn hệ làm việc như một đội giỏi: **dùng lại và tối ưu**, không làm mới mỗi lần. Tách thành bốn vế:

1. **Chọn trước, tạo sau.** Gặp một nhu cầu giao diện, việc đầu tiên là tìm thứ có sẵn. Bên muốn tạo tay phải nêu lý
   do; bên muốn dùng lại thì không.
2. **Kho lớn dần.** Thứ dùng lần đầu, chọn từ nguồn ngoài hay tạo tay, thành của kho; lần sau cùng nhu cầu là bậc 1.
3. **Kho tốt dần.** Một nhu cầu, một lời giải. Lời giải chưa đủ thì mở rộng chính nó và đổi ở mọi nơi dùng.
4. **Nhất quán cả hệ.** Sàn của repo, plugin này và vòng giao việc hiểu cùng một luật.

Thêm một điều chủ repo nêu ngày 2026-11-24: thứ lấy từ nguồn ngoài **luôn lệch chuẩn của repo**. Hệ nhận điều đó là
việc thường, và có một bước **chuẩn hoá** đứng giữa «lấy về» và «nhập kho».

Đề bài [0006](0006-the-reusable-store.md) đã dựng kho và bốn lệnh. Đề bài này không dựng lại kho. Nó sửa **mặc định
và cổng**: hôm nay hệ có đủ lệnh của một kho dùng lại nhưng vẫn nghiêng về tạo tay.

### Hôm nay đứng ở đâu, đọc từ mã

- `find` tra từ kho gần tới kho xa và dừng ở kho đầu tiên đáp: kho của repo, bộ khởi đầu của plugin, kho của họ, rồi
  nguồn ngoài repo đã ghim.
- `intake` đi thang ba bậc, mọi lời chọn là của chủ repo qua hàng chờ
  ([0062](../decisions/0062-intake-takes-a-block-in-only-on-the-owners-answer.md)). Với một món của nguồn ngoài, nó in
  dòng cài và không chạy dòng ấy; dòng sổ giữ mã băm của một tệp do người gọi nêu.
- `inventory` tìm sáu loại lệch, trong đó có «mã dùng mà sổ không ghi». `change` cho một khối nghỉ hoặc gộp nó vào khối
  khác.
- Khuyến nghị 3 của đề bài [0008](0008-capabilities-sockets-and-plugs.md), chủ repo đã duyệt: «mặc định cắm đồ ngoài
  khi nó đạt ổ cắm; tự làm khi đo được là tốt hơn».
- Sàn đã có một bản vá ghi lại cho đồ lấy về: `tools/patch_ui.mjs`, chạy sau mỗi lần thêm một linh kiện của thư viện
  nền. Bản vá nằm trong mã, chạy lại ra cùng kết quả, và dừng với thông điệp khi mã gốc không còn khớp.

### Sáu chỗ lệch với bốn vế

1. **Lời khuyên của `plugs` đặt gánh chứng minh ngược** (vế 1). Tiêu chí 5 của đề bài
   [0014](0014-outside-plugs-set-up-in-one-sitting.md) chỉ cho một phích ngoài làm khuyến nghị khi số đo của nó thắng.
   Ở ổ linh kiện, một nguồn ngoài không phải đối thủ của `intake`: nó là một bậc trên thang của `intake`. Số đo ReUI
   đã ở nhánh chính từ ngày 2026-11-24. Cùng ngày, `plugs --dry-run` của plugin 0.49.0 chạy lên repo kiểm chứng hỏi
   «phích nào làm ổ linh kiện» và khuyên phích của plugin, với lý do in ra là ReUI không thắng ở quyết định 0096. Một
   tác tử đọc câu ấy hiểu là đừng chọn ReUI.
2. **Phép đo coi «lấy về» và «tạo tay» là hai đối thủ, và chỉ đo lần dùng đầu** (vế 1, 2). Lượt đo ReUI so đúng như
   vậy. Lợi của dùng lại nằm ở lần thứ hai trở đi và ở việc mọi màn giống nhau; bốn thước không đo hai thứ ấy.
3. **Thang của plugin không phải thang của repo** (vế 4). Plugin xếp bộ khởi đầu và kho của họ trước nguồn ngoài, và chỉ
   đọc nguồn ghim ở `design/sources/`. Repo kiểm chứng khai thang «kho, ReUI, tạo tay» và ghim danh mục theo dạng riêng,
   nên `find` và `intake` không bao giờ tới ReUI ở đó.
4. **Không cổng nào giữ việc chọn** (vế 1). `intake --by-hand --why` nhận mọi câu lý do. Phát hiện «mã dùng mà sổ
   không ghi» chỉ nằm trong báo cáo của `inventory`; bước cổng plugin đặt vào repo không gọi nó.
5. **Kho lớn dần nhưng chưa tốt dần** (vế 3). `change` chỉ cho nghỉ hoặc gộp. Không có lối mở rộng một khối rồi đổi ở
   mọi nơi dùng. Nguồn ngoài ra bản mới thì không gì báo.
6. **Hệ chưa chung một ranh «mã của mình, mã nhà cung cấp»** (vế 4). Phép kiểm của sàn chỉ coi `src/components/ui` là
   mã nhà cung cấp, và trang luật giao diện của sàn ghi khối có sẵn chỉ để xem, không cài. Công cụ của plugin coi cả
   thư mục của một registry ngoài là thư viện. Repo kiểm chứng khai cả hai thư mục là mã nhà cung cấp.

### Điều lượt đo ReUI cho thấy

Trên ứng dụng mẫu, linh kiện `filters` đưa vào 32 tệp và 19 383 dòng. Vừa cài, cổng đỏ: 226 lỗi lint, 71 lỗi kiểu, 8
lỗi phép kiểm sàn. Người dựng làm cổng xanh bằng cách tắt sàn và kiểm kiểu cho 16 tệp, rồi khối được nhập kho. Hai lỗi
lọt qua cổng. Lần cài đầu đã sửa ba tệp khai của repo trước khi hỏi gì.

Đây là thứ bước chuẩn hoá phải xử lý. Số lỗi đếm từ nhật ký của bản sao lúc vừa cài; từng luật và nơi đếm ghi ở mục
«Lỗi lúc vừa cài, theo luật» của [bản ghi lượt đo](../../docs/trials/reui-components-measured.md). Năm dòng lint cộng
lại đúng 226.

| Lệch ở đâu                            | Số chỗ         | Chuẩn hoá bằng cách nào                        |
| ------------------------------------- | -------------- | ---------------------------------------------- |
| Kiểu dáng lệch luật của sàn           | 132 lỗi lint   | Vá về giá trị của hệ, hoặc khai miễn có lý do  |
| Cách tổ chức tệp                      | 68 lỗi lint    | Khai miễn có lý do                             |
| Luật hooks                            | 15 lỗi lint    | Vá, hoặc khai miễn có lý do                    |
| Điều khiển thô thay cho linh kiện nền | 8 lỗi lint     | Vá sang linh kiện nền của repo                 |
| Biến không dùng                       | 3 lỗi lint     | Sửa bằng máy                                   |
| Kiểm kiểu chặt                        | 71 lỗi kiểu    | Vá, hoặc khai miễn có lý do                    |
| Dòng tắt luật không ghi lý do         | 8 lỗi của sàn  | Thêm lý do, bằng bản vá                        |
| Chữ và ngôn ngữ                       | 86 dòng chữ    | Đưa chữ của repo qua tham số, không sửa mã gốc |
| Khả năng truy cập                     | 2 lỗi lọt cổng | Ở lớp bọc; chỗ lớp bọc không tới thì vá        |

Cột «bằng cách nào» là dự kiến của đề bài, chưa ai thử; lượt thử của tiêu chí 14 mới cho biết.

### Điều repo kiểm chứng đã tự làm

- **Luật ba bậc có cổng giữ.** Quyết định 0023 của kho ấy: kho, rồi kho cộng ReUI Pro, rồi tạo tay; «ghép tay nhanh hơn»
  không phải lý do xuống bậc. Cổng chứng minh màn đòi, cho mỗi khối rời bậc kho, chữ đã tra, ứng viên gần nhất và vì
  sao không dùng; khối tạo tay phải kèm hai tới ba ứng viên có ảnh để chủ repo chọn.
- **Khu nhà cung cấp.** Lint, bộ định dạng, phép kiểm kiểu chặt và móc kiểm đều bỏ qua thư mục của thư viện nền và của
  ReUI. Kho ấy đang giữ 39 tệp ReUI, gồm chính `filters`.
- **Thứ nhập kho là bản của repo**, kho ấy gọi là «khuôn», không phải tệp của nhà cung cấp: dòng sổ trỏ vào tệp do
  repo viết, và ghi tên khối ReUI nó xuất phát từ đó.
- **Chưa có:** ghim bản của mã đã cài, phép so tệp nhà cung cấp với bản lúc cài, và lối sửa mã nhà cung cấp. Luật ở đó
  là «không bao giờ sửa».

### Ba luật không đổi

- Plugin không dùng mạng và không chạy dòng cài (đề bài 0006). Lấy về là việc của người hay của công cụ riêng của repo.
- Mọi dòng sổ mang tên một người chỉ sau khi người ấy đáp (0062).
- Lựa chọn của chủ repo thắng khuyến nghị: tạo tay vẫn chọn được, khi có lý do.

## Thiết kế

### Luật: chọn trước, tạo sau

Áp cho ổ linh kiện: linh kiện, khối và kiểu màn. Thang đi từ trên xuống và chỉ xuống bậc khi bậc trên không đáp ứng.
«Không đáp ứng» là một câu trỏ vào việc người dùng cần làm hay một luật của sản phẩm. «Tạo tay nhanh hơn», «tạo tay
gọn hơn» hay «trông chưa đẹp» không phải lý do.

Phép đo một nguồn ngoài ở ổ linh kiện từ nay trả lời hai câu khác: **chuẩn hoá món này tốn bao nhiêu**, và **lần dùng
thứ hai tốn bao nhiêu**. Nó không trả lời «có nên tạo tay không».

### Ba trạng thái của một món lấy từ nguồn ngoài

1. **Lấy về.** Tệp của món nằm trong thư mục repo khai cho nguồn ấy. Chưa có dòng sổ. Màn nào dùng nó thì cổng đỏ.
2. **Chuẩn hoá.** Một bản ghi chuẩn hoá của món giữ: mã băm của **mọi** tệp như lúc lấy về, từng bản vá kèm lý do,
   từng điều khai miễn kèm luật, tệp và lý do, và mã băm sau khi vá.
3. **Nhập kho.** `intake` chỉ ghi dòng sổ khi bản ghi chuẩn hoá đủ và cổng của repo xanh với món ấy bên trong.

Danh sách tệp, gói phải cài và linh kiện nền kéo theo đọc được từ bản chụp đã ghim của món, không cần mạng. Vì vậy
trước khi chủ repo giữ một ứng viên, câu hỏi nói được món ấy mang vào bao nhiêu tệp, gói nào, và có đòi ghi đè tệp
nào của repo.

### «Đủ chuẩn» là gì

Hai mức, để một món lớn không phải viết lại trọn mới được dùng:

- **Bắt buộc:** cổng của repo xanh; không luật nào bị tắt ngoài danh sách khai miễn; chữ người dùng thấy đi qua bảng
  chữ của repo; phép kiểm khả năng truy cập của repo qua trên một màn có dùng món; giá trị kiểu dáng là của hệ.
- **Được khai miễn có lý do:** kiểm kiểu chặt và cách tổ chức tệp bên trong mã gốc. Mỗi điều khai miễn một dòng, có
  luật, tệp và lý do; chủ repo thấy danh sách ấy trong câu hỏi nhập kho.

### Sửa mã của người khác: chỉ bằng bản vá ghi lại

Sửa tay vẫn cấm. Mọi chỗ sửa vào tệp của nguồn ngoài là một bản vá nằm trong repo, có lý do, áp lên bản gốc đã ghim.
Chạy lại ra cùng kết quả. Nguồn ra bản mới thì lấy bản gốc mới, chạy lại các bản vá; bản vá nào không còn khớp thì lệnh
dừng và nêu tên nó. `inventory` nhờ vậy phân biệt «sửa có ghi lại» với «ai đó sửa tay».

Theo tầng, như quyết định 0023 của repo kiểm chứng:

- **Linh kiện đơn:** vá ít nhất có thể. Ưu tiên xử lý ở lớp bọc do repo viết.
- **Khối xếp sẵn:** là điểm xuất phát. Vùng nào phục vụ việc của người dùng thì lấy, không thì bỏ, mỗi vùng một lý do.
- **Khối của repo** (repo kiểm chứng gọi là «khuôn»): bản đã chuẩn hoá cho bài toán của mình. Đây là thứ nhập kho, và
  từ đó giữ nguyên hình.

### Thang do repo khai

Sổ nguồn ngoài đã có `order` cho các nguồn và `pin_file` cho repo đã có tệp ghim riêng
([0057](../decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md)). Thêm một điều: repo khai được
nguồn ngoài đứng trước hay sau bộ khởi đầu và kho của họ. Không khai thì thứ tự hôm nay giữ nguyên. Đây là luật «luật
của repo thắng mặc định» của đề bài 0008, áp cho thang.

Ở ổ linh kiện, `plugs` thôi hỏi «phích nào làm ổ này» giữa `intake` và một nguồn ngoài. Nó bày thang của repo: nguồn
nào, ở bậc nào, đã đo chưa, chuẩn hoá tốn bao nhiêu.

### Cổng giữ việc chọn

- Một tệp linh kiện mới của repo, ngoài thư mục nhà cung cấp, không có dòng sổ và không nằm trong danh sách «có từ
  trước» thì cổng đỏ.
- Một dòng tạo tay phải kèm chữ đã tra và ứng viên gần nhất, là một tên có thật trong kho hay trong danh mục đã ghim,
  hoặc kết quả «không gì đáp» của `find` với đúng những chữ ấy. Máy kiểm sự có mặt và tên có thật. Câu lý
  do là của người: chủ repo đọc nó trên tờ quyết định.
- Một nhu cầu, một lời giải: dòng sổ thứ hai cho cùng khoá nhu cầu thì đỏ.

### Kho tốt dần

- **Mở rộng một khối.** `change` có thêm lối mở rộng: nói trước nó chạm màn nào, hỏi chủ repo, rồi ghi một lần sửa vào
  dòng sổ của khối. Không tách nhánh riêng cho một màn.
- **Nguồn ra bản mới.** Khi bản ghim của nguồn đổi, `inventory` nêu từng món đã lấy đứng sau bản ghim, và lệnh chuẩn
  hoá chạy lại bản vá trên bản gốc mới.

### Từ ngữ

Bảng từ của plugin (`references/vocabulary.json`) đã có phần lớn chữ đề bài cần. Chỉ ba từ là mới.

| Tiếng Việt       | Tên trong mã    | Đã có hay mới                                                                                                                                                                                                                                                                                             |
| ---------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| chuẩn hoá        | conform         | Mới, `coined`. Bảng từ đã có «conformance»: việc thứ đã dựng có khớp điều hệ đã quyết không, và các phép kiểm cho thấy điều đó. «conformance» là trạng thái; `conform` là việc làm cho một món của nguồn ngoài đạt trạng thái ấy. Nó không dính tới «conformance level», mức khả năng truy cập A, AA, AAA |
| bản vá           | patch           | Mới; thói quen của ngành (bản vá giữ trên mã thượng nguồn)                                                                                                                                                                                                                                                |
| khai miễn        | exemption       | Mới, `coined`                                                                                                                                                                                                                                                                                             |
| khối             | block           | Đã dùng, chưa là mục riêng của bảng từ: là khoá `blocks` của hợp đồng sổ và chữ trong định nghĩa «intake ledger». Repo kiểm chứng gọi bản của mình là «khuôn»; đề bài không đặt tên mã mới cho nó, vì «templates» trong bảng từ đã là vật cỡ trang của Atomic Design                                      |
| nguồn ngoài      | external source | Đã có                                                                                                                                                                                                                                                                                                     |
| khu nhà cung cấp | (thư mục)       | Không thêm từ: là thư mục của một nguồn ngoài, nơi mã lấy về nằm. Bảng từ đã có «vendoring» cho việc chép mã vào repo                                                                                                                                                                                     |
| thang dùng lại   | reuse ladder    | Đã có, và nghĩa ghi ở đó là «kho của repo, rồi một nguồn đã ghim, rồi tạo tay», đúng thang chủ repo nêu                                                                                                                                                                                                   |
| lệch bản         | drift           | Đã có: món không còn khớp nguồn, do bản ghim đổi hay do tệp bị sửa                                                                                                                                                                                                                                        |

### Ngoài phạm vi

- Plugin lấy một món về hay chạy dòng cài.
- Sửa sàn của Repo Standards: phép kiểm thư mục nhà cung cấp và dòng «không cài khối có sẵn» của trang luật giao diện.
  Đề bài này chỉ nêu việc cần bên ấy làm (câu hỏi 8).
- Sửa repo kiểm chứng. Lượt thử chạy trên bản sao.
- Đưa một khối từ kho của repo lên kho của họ: thuộc giai đoạn 7.
- Các ổ khác ổ linh kiện. Tiêu chí 5 của đề bài 0014 giữ nguyên ở những ổ ấy (câu hỏi 6).

## Acceptance criteria

Mỗi dòng chứng bằng một lệnh hay một bản ghi lượt thử.

1. Một bản quyết định ghi luật «chọn trước, tạo sau» cho ổ linh kiện, kèm bốn vế và điều gì không phải lý do xuống bậc.
2. Ở ổ linh kiện, `plugs` không khuyên phích của plugin vì một nguồn ngoài «thua»; nó in thang của repo. Có bài kiểm,
   gồm một ca chạy lên bản sao repo có nguồn ngoài đã ghim.
3. Trước khi chủ repo giữ một ứng viên của nguồn ngoài, câu hỏi nêu số tệp, các gói và tệp của repo bị đòi ghi đè, đọc
   từ bản chụp đã ghim. Có bài kiểm, không mạng.
4. Một màn dùng tệp của một món đã lấy về mà chưa có dòng sổ thì cổng đỏ, và thông điệp nêu món ấy. Có bài kiểm làm
   hỏng.
5. Bản ghi chuẩn hoá giữ mã băm mọi tệp lúc lấy về và sau khi vá, từng bản vá kèm lý do, từng điều khai miễn kèm luật,
   tệp và lý do. Phép kiểm hình dạng đỏ khi thiếu một phần.
6. `intake` từ chối ghi dòng sổ cho một món của nguồn ngoài khi bản ghi chuẩn hoá thiếu, hoặc khi một luật bị tắt ngoài
   danh sách khai miễn. Có bài kiểm làm hỏng cho từng ca.
7. Chạy lệnh chuẩn hoá hai lần ra cùng mã băm. Đổi một dòng của bản gốc ở chỗ một bản vá chạm tới thì lệnh thoát khác
   0 và nêu tên bản vá. Có bài kiểm.
8. Sửa tay một tệp của nguồn ngoài sau khi nhập kho: `inventory` báo «sửa không ghi lại» cho đúng tệp ấy, với mọi tệp
   của món, không chỉ tệp chính.
9. Repo khai được vị trí của nguồn ngoài trên thang; `find` và `intake` theo thứ tự ấy. Không khai thì kết quả như hôm
   nay. Có bài kiểm cho cả hai ca.
10. Trên bản sao repo kiểm chứng, thêm một tệp nguồn trỏ vào tệp ghim và danh mục kho ấy đã có, thì `find` trả ứng
    viên từ danh mục ấy. Ghi ở bản ghi lượt thử.
11. Một tệp linh kiện mới không dòng sổ làm cổng đỏ; một dòng tạo tay thiếu chữ đã tra hay ứng viên gần nhất làm cổng
    đỏ; dòng sổ thứ hai cho cùng nhu cầu làm cổng đỏ. Mỗi ca một bài kiểm làm hỏng.
12. `change` mở rộng được một khối: in các màn chịu ảnh hưởng, hỏi chủ repo, rồi ghi lần sửa vào dòng sổ. Có bài kiểm.
13. Khi bản ghim của một nguồn đổi, `inventory` nêu từng món đứng sau bản ghim. Có bài kiểm.
14. Một lượt thử lấy lại `filters` qua lối mới trên bản sao của ứng dụng mẫu: cổng xanh, không luật nào tắt ngoài danh
    sách khai miễn, không lỗi nào của hai lỗi đã lọt còn lại. Bản ghi nêu chi phí chuẩn hoá.
15. Cùng lượt thử ấy đo lần dùng thứ hai: một màn thứ hai dùng khối đã nhập kho, với số chỗ phải tự quyết và chi phí
    đặt cạnh lần đầu.
16. Quyết định [0096](../decisions/0096-reui-measured-at-the-components-socket.md) ghi rõ kết luận của nó đúng cho repo chưa có bước chuẩn hoá, và tệp phích của ReUI theo luật mới.
17. Phép «lõi sạch» vẫn xanh: tên công cụ ngoài chỉ nằm trong thư mục phích cắm.

Tiêu chí 18 tới 26 nằm ở mục «Phần bổ sung: mục 11.7 và 11.8» bên dưới, chủ repo đã duyệt.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Hợp đồng sổ đổi, cần người duyệt như mọi thay đổi hợp
đồng: sổ nhập kho thêm bản ghi chuẩn hoá và mã băm của mọi tệp; sổ nguồn ngoài thêm thư mục của nguồn và vị trí trên
thang. Thêm tên lệnh `conform` (câu hỏi 2), và ba từ mới ở mục «Từ ngữ» vào `references/vocabulary.json`.

## Plan

Sáu lát sau lời duyệt, là các mục 11.1 tới 11.6 của kế hoạch, mỗi lát một PR, theo thứ tự:

1. **Luật và lời khuyên** (tiêu chí 1, 2, 16): bản quyết định, `plugs` ở ổ linh kiện, phạm vi của
   [0096](../decisions/0096-reui-measured-at-the-components-socket.md), và các dòng giới hạn cho điều chưa dựng.
2. **Sổ và trạng thái** (tiêu chí 3, 4, 5, 6): bản ghi chuẩn hoá, mã băm mọi tệp, trạng thái «lấy về», `intake` từ
   chối khi chưa chuẩn.
3. **Lệnh chuẩn hoá** (tiêu chí 7, 8): bản vá ghi lại, chạy lại được, dừng khi không khớp.
4. **Thang do repo khai** (tiêu chí 9, 10).
5. **Cổng giữ việc chọn** (tiêu chí 11).
6. **Kho tốt dần và lượt thử** (tiêu chí 12, 13, 14, 15).

Lát 1 đủ để lời khuyên của hệ thôi ngược với luật của repo kiểm chứng. Nó sửa phạm vi của quyết định 0096, đã ở nhánh
chính từ ngày 2026-11-24. Các lát sau không chờ nhau, trừ lát 6 cần lát 2 và 3. Giai đoạn 11 mở song song giai đoạn
10, nên lát nào cũng bắt đầu được; thứ tự trên là thứ tự nên theo.

## Test plan

- Mỗi tiêu chí có bài kiểm của plugin, chạy bằng mẫu dữ liệu, không mạng, không mô hình.
- Phép kiểm làm hỏng cho tiêu chí 4, 6, 7, 8 và 11; mỗi lần phải đỏ với thông điệp nêu đúng chỗ.
- Lượt thử của tiêu chí 10, 14 và 15 chạy trên bản sao bỏ đi, theo `docs/trials/README.md`. Lượt nào tốn token, cần
  tài khoản hay gửi dữ liệu ra ngoài thì hỏi chủ repo trước, kèm ước tính và trần.

## Autonomy tier

Máy tự dựng từng lát sau lời duyệt đề bài, mỗi lát một PR; gộp là lời chủ repo. Luôn là lời chủ repo: đổi hợp đồng sổ,
mỗi lượt thử tốn token, mỗi điều khai miễn của một món cụ thể, và mọi yêu cầu gửi sang Repo Standards. Không sửa Repo
Standards, vòng giao việc hay repo kiểm chứng.

## Phần bổ sung: mục 11.7 và 11.8

Máy viết ngày 2026-11-24 theo lời chủ repo («Viết bổ sung»), sửa cùng ngày sau lần soát đầu («Gửi sang sửa»). **Chủ
repo duyệt ngày 2026-11-24, khi gộp PR 133, cùng tám khuyến nghị của nó.** Mục 11.8 dựng ngày 2026-11-24
([0105](../decisions/0105-a-mandatory-rule-is-never-exempted.md)); mục 11.7 chưa dựng. Phần này chỉ nói điều đề bài
đã duyệt chưa nói. Mức «bắt buộc» của mục «Đủ chuẩn» giữ nguyên.

### Vì sao có phần này

Lượt thử lấy lại `filters` ([bản ghi](../../docs/trials/filters-through-conform.md), quyết định
[0104](../decisions/0104-filters-taken-in-through-conform-measured.md)) cho thấy cổng xanh mà ba điều của mức bắt buộc
vẫn hở:

- **Hai lỗi khả năng truy cập đã lọt lần trước còn nguyên:**
  - ô nổi `role="dialog"` không tên;
  - vùng `role="status"` đọc «Top level, 2 items». Chữ ấy được ghép trong `cascader-i18n.tsx`, bằng chuỗi mẫu
    `` `${ROOT_LEVEL}, ${itemCount(count)}` ``, từ hằng `ROOT_LEVEL = "Top level"` và chuỗi `"items"` trong hàm
    `itemCount`. Không chuỗi nào trong tệp bằng nguyên chữ trên màn.

  Phép kiểm của repo (`axe` trong `tests/e2e/templates.spec.ts`, bằng chứng của quyết định `wcag-aa`) chạy ở từng trạng
  thái của màn, nhưng không mở ô nổi nào. Dòng giới hạn `conform-runs-no-accessibility-check`.

- **Trong 82 điều khai miễn, 25 điều là luật mà sổ quyết định của repo giữ:**
  - `shadcn/no-arbitrary-values` 7;
  - `no-restricted-syntax` 7;
  - `shadcn/require-static-classes` 5;
  - `shadcn/no-restyle` 3;
  - `shadcn/no-inline-styles` 3.

  Không gì phân biệt luật bắt buộc với luật được khai miễn. Dòng giới hạn `conform-exempts-mandatory-rules`.

- **Lý do của 82 điều khai miễn chưa tới tay chủ repo**, dù mục «Đủ chuẩn» nói chủ repo thấy danh sách ấy trong câu hỏi
  nhập kho. Dòng giới hạn `exemptions-never-reach-the-owner`. Chưa mục kế hoạch nào nhận việc này: câu hỏi 5.

### Thiết kế

**Phần kiểm phần nổi (mục 11.7)**

- **Màn nào:** mỗi màn dùng một món của nguồn ngoài đã lấy về hay đã nhập kho. Món là một bản ghi chuẩn hoá. Màn dùng
  nó là màn mà bản đồ thay đổi lần tới một tệp của bản ghi, như `change` lần tới các màn của một khối.
- **Mở phần nổi:** trên mỗi màn ấy, phần kiểm bấm lần lượt từng nút báo mình mở một phần nổi (`aria-haspopup`, hay
  `aria-expanded="false"`), ở màn như nó đứng. Không cần ai viết sẵn một trạng thái. Chỉ mở một tầng: phần nổi nằm
  trong một phần nổi khác thì không được mở. Dòng giới hạn `item-popups-one-level` được viết cùng lát dựng.
- **Khi phần nổi đang mở, ba điều được kiểm:**
  1. **Tên của phần nổi.** Mỗi phần tử có `role` là `dialog`, `alertdialog`, `menu` hay `listbox` vừa mở phải có tên
     truy cập. Phần kiểm tự giữ điều này, không trông vào cấu hình phép kiểm của repo: `axe` chỉ bắt dialog không tên
     bằng luật `aria-dialog-name`, mang nhãn «best-practice», nên repo chỉ chạy nhãn WCAG sẽ không bắt (câu hỏi 2).
     Lỗi một của lượt thử.
  2. **Chữ của chính món.** Chữ món tự viết sẵn mà bảng chữ của repo không giữ, hiện ra hay được đọc lên, thì đỏ.
     Cách đối chiếu nói ở đoạn dưới. Lỗi hai của lượt thử.
  3. **Phép kiểm của repo,** chạy như repo đã cấu hình nó, khi phần nổi đang mở. Đó là phép mà sổ quyết định nêu làm
     bằng chứng cho mức tuân thủ; ở repo này là `axe`, không lọc nhãn.
- **Chữ của chính món, đối chiếu thế nào:**
  - **Chuỗi của món:** mọi chuỗi viết sẵn trong một tệp của bản ghi, và mọi phần cố định của một chuỗi mẫu, cắt khoảng
    trắng hai đầu, có ít nhất hai chữ cái liền nhau. Không tính chuỗi có dạng một danh sách lớp, một khoá hay một đường
    dẫn: một chuỗi không khoảng trắng mà có `-`, `_`, `/`, `.` hay `:` giữa hai chữ cái. Những chuỗi ấy không bao giờ là
    chữ trên màn.
  - **Chữ trên màn:** tên truy cập của mọi phần tử, chữ của vùng thông báo (`role` là `status`, `alert`, `log`, hay có
    `aria-live`), và chữ hiện ra, đọc khi phần nổi đang mở.
  - **Khớp** (thu hẹp ngày 2026-11-24 theo lời chủ repo, «Thu hẹp luật», ở PR 135): một chuỗi của món khớp một dòng chữ
    trên màn khi nó nằm trong dòng ấy như một phần, tròn chữ: hai đầu là đầu hay cuối dòng, khoảng trắng hay dấu câu. Chuỗi
    từ hai chữ trở lên mà khớp thì đỏ. Chuỗi một chữ mà khớp chỉ đỏ khi trên cùng dòng ấy có một chuỗi từ hai chữ trở lên
    của cùng tệp cũng khớp. Với «Top level, 2 items», «Top level» khớp nên đỏ, «items» cùng tệp nên cũng đỏ, và đỏ nêu
    cả hai cùng tệp của chúng. Dòng dữ liệu «Máy in to» không đỏ dù «in» và «to» là chuỗi của món: không chuỗi hai chữ
    nào của tệp ấy nằm trên dòng. Điều lọt qua: một dòng mà chữ của món trên đó chỉ là chuỗi một chữ, như một nút món tự
    đặt tên «Close» (dòng giới hạn `item-text-one-word-alone`).
  - **Không đỏ:** chuỗi mà bảng chữ của repo giữ, nguyên chuỗi hay như một chữ tròn trong một mục của bảng; chuỗi là số
    hay chỉ có dấu.
- **Phần kiểm nằm ở đâu, để `upgrade` mang nó tới được:**
  - Hôm nay `upgrade` chỉ ghi thư mục công cụ `tools/design-assembly/` và bước cổng. Tệp kiểm trình duyệt của repo
    (`tests/e2e/templates.spec.ts`) là tệp của repo: hướng dẫn chỉ viết nó khi chưa có, và `upgrade` không chạm tới.
  - **Khuyến nghị:** logic của phần kiểm nằm trong thư mục công cụ, nên `upgrade` mang nó tới và giữ nó đúng bản như
    mọi tệp công cụ. Một tệp kiểm trình duyệt hai dòng gọi nó, đặt cạnh tệp kiểm của repo. Hướng dẫn và `adopt` viết tệp
    ấy; `upgrade` viết nó khi repo chưa có, không bao giờ viết đè. Đó là một việc mới của `upgrade`. Đây là câu hỏi 1.
  - **Cách khác:** sửa chính mẫu `templates.spec.ts.template`, và cho `upgrade` viết lại tệp ấy khi nó còn y như mẫu
    cũ. Repo đã sửa tệp ấy thì không nhận được phần kiểm, và `upgrade` chỉ nói vậy.
- **`upgrade` có chạy trình duyệt không:** không.
  - Cổng mà `upgrade` gọi xanh hay đỏ là bước công cụ, chạy trong tiến trình của nó (dòng giới hạn
    `upgrade-gate-is-the-tool-step-only`).
  - `upgrade` nói trước khi ghi: phần kiểm phần nổi được thêm, và liệt kê các bản ghi chuẩn hoá mà phần ấy sẽ giữ.
    Kiểm trình duyệt của repo có thể đỏ trên các màn dùng những món ấy. `upgrade` không nói nó sẽ đỏ hay không, vì nó
    không chạy để biết.
  - Cách khác (câu hỏi 3): `upgrade` chạy kiểm trình duyệt của repo trên các màn ấy trước khi ghi. Mỗi lần lên đời
    chậm thêm cỡ phút, và cần trình duyệt của repo đã cài.
- **Ai giữ:** cổng, qua tệp kiểm trình duyệt ấy. `intake` không tự chạy trình duyệt; câu hỏi nhập kho nói cổng giữ việc
  ấy (câu hỏi 4).
- **Repo không có phép kiểm mức tuân thủ nào:** hai điều đầu (tên phần nổi, chữ của món) vẫn giữ, vì phần kiểm tự giữ
  chúng. Điều thứ ba không chạy, và câu hỏi nhập kho nói vậy (câu hỏi 6).

**Luật nào là bắt buộc, khai ở đâu (mục 11.8)**

- **Một luật là bắt buộc khi sổ quyết định của repo giữ nó.** Tức là có một dòng mà bằng chứng nêu luật ấy:
  `eslint:<rule>` ở `design/decisions.yaml`, hoặc một phép kiểm kiểu `lint` của dữ liệu công cụ.
  - Ở repo này, đọc từ `design/decisions.yaml`, có sáu luật:
    - `shadcn/no-raw-colors` (hai dòng);
    - `shadcn/no-arbitrary-values` (thang chữ, khoảng cách, bo góc);
    - `shadcn/no-restyle`;
    - `shadcn/no-inline-styles`;
    - `shadcn/require-static-classes` (dòng `whole-class-names`);
    - `no-restricted-syntax` (điều khiển thô, bảng thô, định dạng số và ngày).
  - Plugin không viết thêm tên luật nào. Danh sách là của repo, đọc từ sổ của repo.
- **Được khai miễn có lý do, như đề bài nói:**
  - kiểm kiểu chặt: cờ chặt của trình biên dịch, và `@ts-nocheck` ở một tệp, vì trình biên dịch không có công tắc chặt
    cho từng tệp (câu hỏi 7);
  - mọi luật mà không quyết định nào giữ, như luật về cách tổ chức tệp.
- **Repo không khai gì** (không dòng nào nêu luật): không luật lint nào bắt buộc. Bốn điều còn lại của mức bắt buộc vẫn
  giữ. Dòng giới hạn nói vậy.
- **Từ chối ở đâu:**
  - `conform --exempt` từ chối một luật bắt buộc, và nêu dòng quyết định giữ nó.
  - `intake --file` từ chối một bản ghi có điều khai miễn ấy, và cả một dòng chú thích hay một thay đổi cấu hình mà món
    mang tới để tắt luật ấy cho tệp hay thư mục của nó.
  - Phần của thư viện nền mà cấu hình của repo đã tách riêng trước khi có món thì vẫn theo luật của repo cho phần ấy,
    không là điều khai miễn của món. Trong lượt thử, đó là điều `lint-config` cho `src/components/ui`.
- **Áp vào lượt thử:**
  - 25 điều bị từ chối, 57 điều còn khai miễn được.
  - 25 chỗ ấy trong mã của món phải vá, không được khai miễn.

**Repo đang xanh lên đời**

- **Điều khai miễn viết trước** cho một luật nay là bắt buộc: không đỏ.
  - Lần kiểm thường của `conform` và báo cáo `inventory` nêu nó là «khai miễn một luật bắt buộc, viết trước bản này».
  - Lần chuẩn hoá lại hay lần lấy lại còn giữ nó thì bị từ chối.
  - Đây là cách của quyết định 0102: repo xanh hôm nay vẫn xanh trên điều nó đã có.
- **Phần kiểm phần nổi** đến với lần lên đời theo cách ở trên.
  - Từ lần chạy kiểm trình duyệt kế tiếp, cổng của repo có thể đỏ trên màn dùng một món đã nhập kho. Đó là lỗi thật
    trên màn đang chạy, và `upgrade` đã nói trước những món nào sẽ bị giữ.
  - Muốn chỉ giữ món nhập kho từ nay thì phải đánh dấu bản ghi theo bản plugin. Đây là câu hỏi 3.

### Tiêu chí nghiệm thu

Mỗi tiêu chí chứng bằng một bài kiểm của plugin trên mẫu dữ liệu, không mạng, không mô hình, trừ tiêu chí 26 là lượt
thử.

**Mục 11.7**

18. Trên một màn dùng một món của nguồn ngoài, một phần nổi của món mở ra mà không có tên truy cập thì cổng đỏ, nêu màn
    và nút mở nó. Phần kiểm tự giữ điều này, kể cả ở repo mà phép kiểm của mình không bắt dialog không tên. Không cần một
    trạng thái viết sẵn. Bài kiểm làm hỏng: một món có ô nổi `role="dialog"` không tên, ở một repo mà phép kiểm của
    repo chỉ chạy nhãn WCAG.
19. Chữ của chính món lên màn mà bảng chữ của repo không giữ thì cổng đỏ, nêu tệp và chuỗi; cách đối chiếu như đoạn
    «Chữ của chính món, đối chiếu thế nào». Bài kiểm làm hỏng là ca ghép:
    - một tệp của món có `const ROOT = "Top level"` và một chuỗi mẫu `` `${ROOT}, ${n} items` ``;
    - vùng `role="status"` đọc «Top level, 2 items»;
    - cổng đỏ, nêu «Top level» và «items».

    Cùng bài ấy xanh khi bảng chữ của repo giữ hai chuỗi ấy. Một tệp của món chỉ có danh sách lớp và khoá thì không đỏ.
    Một dòng dữ liệu chỉ chứa chữ ngắn của món, như «Máy in to», không đỏ: chuỗi một chữ chỉ đỏ cạnh một chuỗi từ hai chữ
    trở lên của cùng tệp trên cùng dòng (thu hẹp ngày 2026-11-24, «Thu hẹp luật»).

20. Phép kiểm của repo chạy khi phần nổi đang mở, như repo cấu hình nó, bằng trình duyệt của repo, không mạng. Repo không
    có phép kiểm mức tuân thủ nào thì tiêu chí 18 và 19 vẫn giữ, và câu hỏi nhập kho nói phép kiểm của repo không chạy.
    Có bài kiểm cho cả hai ca.
21. `upgrade` mang logic của phần kiểm tới trong thư mục công cụ, và viết tệp kiểm trình duyệt gọi nó khi repo chưa có,
    không viết đè. Trước khi ghi, nó nói phần kiểm được thêm và liệt kê các bản ghi chuẩn hoá mà phần ấy sẽ giữ. Nó không
    chạy trình duyệt và không nói cổng sẽ xanh hay đỏ. Có bài kiểm, không trình duyệt.

**Mục 11.8**

22. `conform --exempt` từ chối một luật mà một dòng của sổ quyết định giữ, và nêu dòng ấy. `intake --file` từ chối một
    bản ghi có điều khai miễn như vậy, hay một dòng chú thích hoặc thay đổi cấu hình mà món mang tới để tắt luật ấy. Mỗi
    ca một bài kiểm làm hỏng. Bài kiểm có một ca của `shadcn/require-static-classes` lấy từ sổ quyết định của mẫu dữ
    liệu.
23. Kiểm kiểu chặt (gồm `@ts-nocheck`) và luật mà không dòng nào giữ vẫn khai miễn được, mỗi điều có luật, tệp và lý
    do, như hôm nay. Phần của thư viện nền mà cấu hình của repo đã tách riêng từ trước không bị từ chối. Có bài kiểm.
24. Một bản ghi viết trước có điều khai miễn luật nay là bắt buộc: cổng vẫn xanh; lần kiểm thường của `conform` và
    `inventory` nêu điều ấy. Lần chuẩn hoá lại còn giữ nó thì bị từ chối. Có bài kiểm.

**Danh sách khai miễn tới tay chủ repo** (mục 11.8 hay một mục riêng, câu hỏi 5)

25. Trước khi `intake` ghi dòng sổ cho một món của nguồn ngoài, danh sách khai miễn của bản ghi lên tờ quyết định thành
    một câu hỏi: mỗi điều có luật, tệp và lý do. Dòng sổ chỉ được ghi khi chủ repo giữ. Chủ repo bác thì không gì được
    ghi. Có bài kiểm.

**Lượt chạy lại (mục 11.6, dòng «done when» thứ hai của giai đoạn 11)**

26. Chạy lại lần dùng đầu của lượt thử `filters` trên bản sao ứng dụng mẫu, cùng cách làm. Lượt ấy phải cho thấy tiêu
    chí 14 trọn:
    - cổng xanh;
    - không luật nào tắt ngoài danh sách khai miễn;
    - không điều khai miễn nào thuộc luật bắt buộc;
    - tiêu chí 18 và 19 xanh trên màn dùng món, tức hai lỗi đã lọt không còn.

    Lượt này tốn token và cần lời riêng, kèm ước tính và trần.

    **Ghi chú cho lúc hỏi:** lần này tác tử phải vá 25 chỗ mà lần trước được khai miễn, và sửa hai lỗi khả năng truy
    cập.
    - Lần dùng đầu trước tốn 447 781 token và tác tử không phải làm việc ấy. Ước tính lần này nâng lên khoảng 650 nghìn
      cho tác tử, cộng khoảng 120 nghìn cho phiên chạy: khoảng **770 nghìn**, trần **1,1 triệu**.
    - Lượt có thể vượt ước tính, như lần đo đầu, hoặc chưa xanh khi tới trần. Tới trần thì dừng và báo điều đã đo.

### Hợp đồng đổi gì (cần người duyệt)

- **Sổ chuẩn hoá:** không đổi hình dạng. Điều khai miễn vẫn có luật, tệp và lý do. Điều thay đổi là cái gì được nhận.
- **Thư mục công cụ:** thêm logic của phần kiểm phần nổi. Một tệp kiểm trình duyệt hai dòng do plugin viết khi chưa có.
- **Dữ liệu công cụ:** có thể thêm một phép kiểm dưới một dòng của cổng; hình dạng sẽ nói ở lát dựng.
- **Hàng chờ** (tiêu chí 25): một loại câu hỏi mới về danh sách khai miễn, trong hình dạng câu hỏi đã có.
- Sổ quyết định, sổ nhập kho và sổ nguồn ngoài không đổi.

### Ngoài phạm vi

- Sửa hai lỗi của `filters`. Đó là việc của người dựng khi chuẩn hoá món, không phải của plugin. Lượt chạy lại cho thấy
  cổng bắt được chúng và lối mới buộc chúng được sửa.
- Một bộ luật khả năng truy cập của riêng plugin, hay tên một thư viện hoặc bộ luật trong lõi của plugin. Phần kiểm chỉ
  tự giữ hai điều: phần nổi có tên, và chữ của món đi qua bảng chữ của repo.
- Mở phần nổi nằm trong phần nổi khác (dòng giới hạn `item-popups-one-level`).
- Kiểm khả năng truy cập cho màn không dùng món nào của nguồn ngoài. Tệp kiểm trình duyệt hiện có vẫn giữ việc ấy như
  hôm nay.
- Câu hỏi «chạy lại lượt thử khi nào». Đó là lời riêng của chủ repo, sau khi 11.7 và 11.8 gộp.

### Kế hoạch

- **Mục 11.7:** tiêu chí 18 tới 21.
- **Mục 11.8:** tiêu chí 22 tới 24, và tiêu chí 25 nếu chủ repo đặt việc ấy vào đây (câu hỏi 5).
- **Mục 11.6:** tiêu chí 26. Lượt chạy lại thuộc mục này, và mục ấy xong khi lượt chạy lại cho thấy tiêu chí 14 trọn.
- Hai mục 11.7 và 11.8 không chờ nhau; mỗi mục một PR. Giai đoạn 11 đóng khi cả hai dòng «done when» được cho thấy
  bằng lệnh: dòng một đã có từ lượt thử trước; dòng hai cần tiêu chí 26.

### Câu hỏi mở của phần bổ sung

Mỗi câu kèm một khuyến nghị. Gộp phần này là nhận mọi khuyến nghị.

1. **Phần kiểm phần nổi nằm ở đâu, để `upgrade` mang tới được?**
   - Khuyến nghị: **logic trong thư mục công cụ, gọi từ một tệp kiểm trình duyệt hai dòng**. Hướng dẫn và `adopt` viết
     tệp ấy; `upgrade` viết nó khi chưa có, không viết đè.
   - Căn cứ: thư mục công cụ là thứ `upgrade` đã giữ đúng bản; tệp kiểm của repo vẫn là của repo; logic đổi ở bản sau
     thì tới cùng lần lên đời.
   - Cách khác: sửa mẫu `templates.spec.ts.template`, và `upgrade` viết lại tệp ấy khi nó còn y như mẫu cũ. Repo đã sửa
     tệp ấy thì không nhận được phần kiểm.
2. **Tên của phần nổi do ai giữ?**
   - Khuyến nghị: **phần kiểm tự giữ**, như đã viết.
   - Căn cứ: ARIA đòi dialog có tên; `axe` chỉ bắt bằng một luật «best-practice», nên ở repo chỉ chạy nhãn WCAG, lỗi một
     của lượt thử sẽ lọt. Đây là một trong hai điều duy nhất phần kiểm tự giữ.
   - Cách khác: để phép kiểm của repo giữ như repo đã cấu hình. Tiêu chí 18 khi ấy chỉ đúng ở repo chạy luật ấy.
3. **`upgrade` và kiểm trình duyệt:**
   - Khuyến nghị: **`upgrade` không chạy trình duyệt; nó nói trước phần kiểm được thêm và liệt kê món nào sẽ bị giữ.
     Cổng của repo giữ mọi món, kể cả món đã nhập kho, từ lần chạy kế tiếp.**
   - Căn cứ: `upgrade` hôm nay không chạy trình duyệt; lỗi trên màn đang chạy là lỗi thật; nói trước cho người biết
     trước khi lên đời.
   - Cách khác: `upgrade` chạy kiểm trình duyệt trên các màn ấy trước khi ghi (chậm thêm cỡ phút, cần trình duyệt đã
     cài); hoặc chỉ giữ món nhập kho từ nay, bằng một dấu bản trong bản ghi chuẩn hoá (đổi hợp đồng sổ).
4. **Ai chạy phần kiểm: cổng hay `intake`?**
   - Khuyến nghị: **cổng**.
   - Căn cứ: mỗi luật ở một chỗ; cổng đã chạy trình duyệt của repo; `intake` chưa từng chạy trình duyệt; cổng còn giữ
     món sau khi đã nhập kho.
   - Cách khác: `intake --file` cũng chạy phần ấy trên các màn dùng món, trước khi ghi dòng.
5. **Danh sách khai miễn tới tay chủ repo (tiêu chí 25): trong mục 11.8 hay một mục riêng?**
   - Khuyến nghị: **trong mục 11.8**.
   - Căn cứ: cùng bản ghi, cùng chỗ từ chối (`intake --file`). Điều khai miễn luật bắt buộc bị từ chối trước, nên chủ
     repo chỉ đọc những điều được phép.
   - Cách khác: một mục 11.9. Đó là một thay đổi kế hoạch, cần lời chủ repo.
6. **Repo không có phép kiểm mức tuân thủ nào:**
   - Khuyến nghị: **tên phần nổi và chữ của món vẫn giữ; phép kiểm của repo không chạy, và câu hỏi nhập kho nói vậy**.
   - Căn cứ: hai điều đầu là của phần kiểm, không cần phép kiểm của repo.
   - Cách khác: `intake` từ chối món của nguồn ngoài ở repo ấy.
7. **`@ts-nocheck` có tính là khai miễn kiểm kiểu chặt không?**
   - Khuyến nghị: **có**, mỗi tệp một điều khai miễn.
   - Căn cứ: trình biên dịch không có công tắc chặt cho từng tệp, nên đó là cách duy nhất để bỏ kiểm chặt cho mã gốc mà
     không vá từng lỗi.
   - Cách khác: chỉ nhận khai miễn ở cấu hình trình biên dịch. Món cỡ `filters` khi ấy phải vá trọn 73 lỗi kiểu.
8. **«Chữ của món» nhận ra bằng gì?**
   - Khuyến nghị: **chuỗi viết sẵn và phần cố định của chuỗi mẫu trong tệp của bản ghi, khớp như một phần tròn chữ của
     chữ trên màn**, như đã viết.
   - Căn cứ: bắt được chữ ghép như «Top level, 2 items»; không phải đoán ngôn ngữ; chỉ ra đúng tệp cần vá.
   - Cách khác: đoán ngôn ngữ của chữ so với ngôn ngữ của trang. Cách này dễ sai với tên riêng và số.

## Open questions

Mỗi câu kèm một khuyến nghị.

1. **Việc này đứng ở đâu trong kế hoạch?** Khuyến nghị: một giai đoạn mới ngay sau giai đoạn 10, trước giai đoạn 7,
   và lát 1 làm ngay. Căn cứ: lời khuyên của `plugs` sẽ ngược với luật của repo kiểm chứng ngay khi PR #119 gộp. Từ
   chối thì nó vào danh sách để lại, và PR #119 chỉ thêm một câu về phạm vi.
   Đã nhận: giai đoạn 11 đứng sau giai đoạn 10, trước giai đoạn 7, và lát 1 làm ngay. Công cụ kế hoạch không ghi được
   «làm ngay» cho một mục của giai đoạn chưa mở, nên chủ repo chọn thêm cùng ngày («Gửi, mở song song»): giai đoạn 11
   mở song song giai đoạn 10. Cả bảy mục từ đó làm được; mỗi lát vẫn một PR gộp theo lời chủ repo; giai đoạn 10 vẫn
   là giai đoạn hiện tại.

2. **Chuẩn hoá là một lệnh riêng hay một nhịp của `intake`?** Khuyến nghị: lệnh riêng, tên `conform`. Căn cứ: nó chạy
   nhiều lần cho một món, kể cả sau khi đã nhập kho, mỗi khi nguồn ra bản mới. Từ chối thì `intake` gánh thêm việc
   và phải chạy lại cho món đã có dòng sổ.
   Đã nhận: lệnh riêng, tên `conform`.

3. **Mức «bắt buộc» gồm đúng năm điều ở mục «Đủ chuẩn»?** Khuyến nghị: có. Từ chối theo hướng chặt hơn thì một món cỡ
   `filters` phải sửa trọn 71 lỗi kiểu mới được dùng.
   Đã nhận: đúng năm điều ấy.

4. **Cho vá mã của nhà cung cấp, hay chỉ cho bọc?** Khuyến nghị: cho vá, chỉ bằng bản vá ghi lại, và với linh kiện đơn
   thì bọc trước. Căn cứ: câu tiếng Anh cho trình đọc màn hình của lượt đo nằm trong một tệp của mã gốc
   (`cascader-i18n.tsx`), và chưa ai thử xem lớp bọc có đổi được nó không. Từ chối thì
   luật là «không bao giờ sửa» như repo kiểm chứng, và những chỗ lớp bọc không tới thành điều khai miễn.
   Đã nhận: cho vá, chỉ bằng bản vá ghi lại; linh kiện đơn thì bọc trước. Sửa tay vẫn cấm.

5. **Thư mục của nguồn ngoài khai ở đâu?** Khuyến nghị: một khoá của tệp nguồn trong sổ nguồn ngoài, để mọi công cụ
   đọc cùng một chỗ. Từ chối thì mỗi công cụ tự biết, như hôm nay.
   Đã nhận: một khoá của tệp nguồn trong sổ nguồn ngoài.

6. **Luật này áp cho ổ linh kiện, hay mọi ổ?** Khuyến nghị: chỉ ổ linh kiện. Ở các ổ khác, phích ngoài và phích của
   plugin là hai bên làm cùng một việc, và tiêu chí 5 của đề bài 0014 vẫn hợp.
   Đã nhận: chỉ ổ linh kiện.

7. **Tệp linh kiện mới không dòng sổ: cổng đỏ hay chỉ báo?** Khuyến nghị: đỏ cho tệp thêm sau ngày repo có sổ; tệp
   có từ trước vào danh sách «có từ trước» một lần, theo lời chủ repo. Từ chối thì nó vẫn chỉ là một dòng báo cáo.
   Đã nhận: đỏ cho tệp thêm sau ngày repo có sổ.

8. **Gửi sang Repo Standards hai việc?** Một: phép kiểm của sàn đọc thư mục nhà cung cấp từ sổ nguồn ngoài, thay vì
   viết sẵn một thư mục. Hai: dòng «không cài khối có sẵn» của trang luật giao diện nhường cho luật ba tầng. Khuyến
   nghị: gửi cả hai, sau khi lát 2 có hình dạng sổ. Từ chối thì ở repo dùng sàn ấy, mọi món ngoài phải khai miễn
   phép kiểm của sàn.
   Đã nhận: gửi cả hai, sau khi lát 2 có hình dạng sổ. Mỗi lần gửi vẫn nêu trước gửi gì.

9. **Lượt thử dùng lại `filters`?** Khuyến nghị: có, vì đã có số của lối cũ để đặt cạnh. Ước tính và trần nêu khi hỏi
   lời cho đo.
   Đã nhận: dùng lại `filters`. Lượt thử vẫn cần lời cho đo riêng, kèm ước tính và trần.
