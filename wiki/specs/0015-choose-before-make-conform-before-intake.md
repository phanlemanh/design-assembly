---
type: spec
title: Chọn trước, tạo sau — lấy về, chuẩn hoá, rồi mới nhập kho
status: needs-approval
tier: 1
links:
  - wiki/specs/0006-the-reusable-store.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0062-intake-takes-a-block-in-only-on-the-owners-answer.md
sources:
  - docs/plan/plan.json
  - docs/trials/README.md
  - plugins/design-assembly/scripts/find.mjs
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/change.mjs
  - plugins/design-assembly/scripts/plugs.mjs
  - plugins/design-assembly/templates/mk/
  - tools/patch_ui.mjs
  - .claude/rules/ui.md
  - "PR #119 của kho này, đầu nhánh d6bce7e, chưa gộp lúc viết: quyết định 0096 và bản ghi docs/trials/reui-components-measured.md, số đo ReUI ở ổ linh kiện"
  - "repo kiểm chứng (Inventory), nhánh chính tại 1ad8469f, đọc ngày 2026-11-24, chỉ đọc: wiki/decisions/0023-chon-truoc-tao-sau.md, .claude/skills/inventory-ui/SKILL.md, .claude/rules/ui.md, tools/proof_gate/check.py và khuon-chung-minh.md, tools/reui_catalog/, design/intake/, eslint.config.js, .prettierignore, tools/typecheck_own.mjs, design/tool-stamp.json"
  - "plugs.mjs --dry-run --short, find.mjs và inventory.mjs của nhánh PR #119 chạy lên repo kiểm chứng ngày 2026-11-24; ba lệnh không ghi gì ở kho ấy"
  - "chủ repo, 2026-11-24: «Điều này ban đầu ý định là buộc dùng lại thay vì tự tạo.»"
  - "chủ repo, 2026-11-24: «Cách tôi mô phỏng lại cách làm của con người hay những đội top tier là dùng lại và tối ưu, như cách tạo kho, thì qua thời gian cải tiến nó và nó nhất quán với hành vi chung của cả hệ thống»"
  - "chủ repo, 2026-11-24: «bao giờ khi lấy từ kho ngoài về thì đều không chuẩn và chấp nhận việc này nhưng phải có giải pháp để chuẩn nó, tinh chỉnh trước sau đó mới nhập kho»"
  - "chủ repo, 2026-11-24: «Viết đề bài»"
---

# 0015 Chọn trước, tạo sau — lấy về, chuẩn hoá, rồi mới nhập kho

Máy viết ngày 2026-11-24 theo lời chủ repo («Viết đề bài»), sau lượt đo ReUI ở ổ linh kiện (PR #119) và một lượt đọc
repo kiểm chứng. Đề bài chờ duyệt; chưa gì được dựng, và kế hoạch chưa đổi. Việc này ngoài kế hoạch hôm nay: nó nối
tiếp giai đoạn 10, và nếu được làm trước thì giai đoạn 7 chậm lại (câu hỏi 1).

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
   Ở ổ linh kiện, một nguồn ngoài không phải đối thủ của `intake`: nó là một bậc trên thang của `intake`. Khi số đo của
   PR #119 vào nhánh chính, `plugs` chạy lên repo kiểm chứng sẽ khuyên «phích của plugin» với lý do ReUI thua, và một
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

Các lỗi gom thành năm loại chính, và đây là thứ bước chuẩn hoá phải xử lý (khoảng 27 lỗi lint còn lại thuộc các luật
nhỏ hơn):

| Lệch ở đâu                                  | Số chỗ    | Chuẩn hoá bằng cách nào                        |
| ------------------------------------------- | --------- | ---------------------------------------------- |
| Chữ và ngôn ngữ                             | khoảng 80 | Đưa chữ của repo qua tham số, không sửa mã gốc |
| Khả năng truy cập                           | 2         | Ở lớp bọc; chỗ lớp bọc không tới thì vá        |
| Kiểu dáng lệch luật của sàn                 | 116       | Vá về giá trị của hệ, hoặc khai miễn có lý do  |
| Kiểm kiểu chặt và luật hooks                | 87        | Vá, hoặc khai miễn có lý do                    |
| Cách tổ chức tệp, dòng tắt luật thiếu lý do | 76        | Phần lớn sửa bằng máy                          |

### Điều repo kiểm chứng đã tự làm

- **Luật ba bậc có cổng giữ.** Quyết định 0023 của kho ấy: kho, rồi kho cộng ReUI Pro, rồi tạo tay; «ghép tay nhanh hơn»
  không phải lý do xuống bậc. Cổng chứng minh màn đòi, cho mỗi khối rời bậc kho, chữ đã tra, ứng viên gần nhất và vì
  sao không dùng; khối tạo tay phải kèm hai tới ba ứng viên có ảnh để chủ repo chọn.
- **Khu nhà cung cấp.** Lint, bộ định dạng, phép kiểm kiểu chặt và móc kiểm đều bỏ qua thư mục của thư viện nền và của
  ReUI. Kho ấy đang giữ 39 tệp ReUI, gồm chính `filters`.
- **Thứ nhập kho là khuôn của repo**, không phải tệp của nhà cung cấp: dòng sổ trỏ vào tệp do repo viết, và ghi tên
  khối ReUI nó xuất phát từ đó.
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
- **Khuôn của repo:** bản đã chuẩn hoá cho bài toán của mình. Đây là thứ nhập kho, và từ đó giữ nguyên hình.

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

| Tiếng Việt       | Tên trong mã  | Lấy từ đâu                                                |
| ---------------- | ------------- | --------------------------------------------------------- |
| chuẩn hoá        | conform       | `coined`; gần nhất là «conformance» của các bộ kiểm chuẩn |
| bản vá           | patch         | thói quen của ngành (bản vá giữ trên mã thượng nguồn)     |
| khai miễn        | exemption     | `coined`                                                  |
| khu nhà cung cấp | vendor folder | thói quen của ngành («vendoring»)                         |
| khuôn            | template      | chữ của repo kiểm chứng (quyết định 0023 của kho ấy)      |

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
16. Quyết định 0096 ghi rõ kết luận của nó đúng cho repo chưa có bước chuẩn hoá, và tệp phích của ReUI theo luật mới.
17. Phép «lõi sạch» vẫn xanh: tên công cụ ngoài chỉ nằm trong thư mục phích cắm.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Hợp đồng sổ đổi, cần người duyệt như mọi thay đổi hợp
đồng: sổ nhập kho thêm bản ghi chuẩn hoá và mã băm của mọi tệp; sổ nguồn ngoài thêm thư mục của nguồn và vị trí trên
thang. Thêm một tên lệnh nếu câu hỏi 2 được nhận, và các từ ở mục «Từ ngữ» vào `references/vocabulary.json`.

## Plan

Sáu lát sau lời duyệt, mỗi lát một PR, theo thứ tự:

1. **Luật và lời khuyên** (tiêu chí 1, 2, 16): bản quyết định, `plugs` ở ổ linh kiện, phạm vi của 0096, và các dòng
   giới hạn cho điều chưa dựng.
2. **Sổ và trạng thái** (tiêu chí 3, 4, 5, 6): bản ghi chuẩn hoá, mã băm mọi tệp, trạng thái «lấy về», `intake` từ
   chối khi chưa chuẩn.
3. **Lệnh chuẩn hoá** (tiêu chí 7, 8): bản vá ghi lại, chạy lại được, dừng khi không khớp.
4. **Thang do repo khai** (tiêu chí 9, 10).
5. **Cổng giữ việc chọn** (tiêu chí 11).
6. **Kho tốt dần và lượt thử** (tiêu chí 12, 13, 14, 15).

Lát 1 đủ để lời khuyên của hệ thôi ngược với luật của repo kiểm chứng. Các lát sau không chờ nhau, trừ lát 6 cần lát 2
và 3.

## Test plan

- Mỗi tiêu chí có bài kiểm của plugin, chạy bằng mẫu dữ liệu, không mạng, không mô hình.
- Phép kiểm làm hỏng cho tiêu chí 4, 6, 7, 8 và 11; mỗi lần phải đỏ với thông điệp nêu đúng chỗ.
- Lượt thử của tiêu chí 10, 14 và 15 chạy trên bản sao bỏ đi, theo `docs/trials/README.md`. Lượt nào tốn token, cần
  tài khoản hay gửi dữ liệu ra ngoài thì hỏi chủ repo trước, kèm ước tính và trần.

## Autonomy tier

Máy tự dựng từng lát sau lời duyệt đề bài, mỗi lát một PR; gộp là lời chủ repo. Luôn là lời chủ repo: đổi hợp đồng sổ,
mỗi lượt thử tốn token, mỗi điều khai miễn của một món cụ thể, và mọi yêu cầu gửi sang Repo Standards. Không sửa Repo
Standards, vòng giao việc hay repo kiểm chứng.

## Open questions

Mỗi câu kèm một khuyến nghị.

1. **Việc này đứng ở đâu trong kế hoạch?** Khuyến nghị: một giai đoạn mới ngay sau giai đoạn 10, trước giai đoạn 7,
   và lát 1 làm ngay. Căn cứ: lời khuyên của `plugs` sẽ ngược với luật của repo kiểm chứng ngay khi PR #119 gộp. Từ
   chối thì nó vào danh sách để lại, và PR #119 chỉ thêm một câu về phạm vi.
2. **Chuẩn hoá là một lệnh riêng hay một nhịp của `intake`?** Khuyến nghị: lệnh riêng, tên `conform`. Căn cứ: nó chạy
   nhiều lần cho một món, kể cả sau khi đã nhập kho, mỗi khi nguồn ra bản mới. Từ chối thì `intake` gánh thêm việc
   và phải chạy lại cho món đã có dòng sổ.
3. **Mức «bắt buộc» gồm đúng năm điều ở mục «Đủ chuẩn»?** Khuyến nghị: có. Từ chối theo hướng chặt hơn thì một món cỡ
   `filters` phải sửa trọn 71 lỗi kiểu mới được dùng.
4. **Cho vá mã của nhà cung cấp, hay chỉ cho bọc?** Khuyến nghị: cho vá, chỉ bằng bản vá ghi lại, và với linh kiện đơn
   thì bọc trước. Căn cứ: câu tiếng Anh cho trình đọc màn hình của lượt đo nằm trong một tệp của mã gốc
   (`cascader-i18n.tsx`), và chưa ai thử xem lớp bọc có đổi được nó không. Từ chối thì
   luật là «không bao giờ sửa» như repo kiểm chứng, và những chỗ lớp bọc không tới thành điều khai miễn.
5. **Thư mục của nguồn ngoài khai ở đâu?** Khuyến nghị: một khoá của tệp nguồn trong sổ nguồn ngoài, để mọi công cụ
   đọc cùng một chỗ. Từ chối thì mỗi công cụ tự biết, như hôm nay.
6. **Luật này áp cho ổ linh kiện, hay mọi ổ?** Khuyến nghị: chỉ ổ linh kiện. Ở các ổ khác, phích ngoài và phích của
   plugin là hai bên làm cùng một việc, và tiêu chí 5 của đề bài 0014 vẫn hợp.
7. **Tệp linh kiện mới không dòng sổ: cổng đỏ hay chỉ báo?** Khuyến nghị: đỏ cho tệp thêm sau ngày repo có sổ; tệp
   có từ trước vào danh sách «có từ trước» một lần, theo lời chủ repo. Từ chối thì nó vẫn chỉ là một dòng báo cáo.
8. **Gửi sang Repo Standards hai việc?** Một: phép kiểm của sàn đọc thư mục nhà cung cấp từ sổ nguồn ngoài, thay vì
   viết sẵn một thư mục. Hai: dòng «không cài khối có sẵn» của trang luật giao diện nhường cho luật ba tầng. Khuyến
   nghị: gửi cả hai, sau khi lát 2 có hình dạng sổ. Từ chối thì ở repo dùng sàn ấy, mọi món ngoài phải khai miễn
   phép kiểm của sàn.
9. **Lượt thử dùng lại `filters`?** Khuyến nghị: có, vì đã có số của lối cũ để đặt cạnh. Ước tính và trần nêu khi hỏi
   lời cho đo.
