# Phích Figma đo ở ổ nền, từ tệp `.fig` thật của chủ repo (mục 13.4)

Một lượt, ngày 2026-11-28, plugin 0.79.0 (`main` ở `d405e7f`). Bản quyết định đi kèm:
[0135](../../wiki/decisions/0135-the-figma-plug-measured-at-the-foundations-socket.md). Đề bài:
[0018](../../wiki/specs/0018-figma-at-the-foundations-socket.md), tiêu chí 14.

## Chạy trên gì

- **Lời chủ repo.** Phiên điều phối hỏi «Anh cho chạy lượt đo 13.4, trần 600 nghìn token, kèm chạy công cụ đọc `.fig`
  của bên thứ ba trên bản chép tệp của anh chứ?». Chủ repo đáp «Chạy 13.4». Lời ấy cho một lượt đo, và cho chạy công cụ
  đọc đã build sẵn trên một bản chép của một tệp, không mạng. Nó không cho tải, cài hay build gì, không cho gọi Figma,
  không cho đọc tệp `.fig` nào khác.
- **Tệp.** Tệp hệ thiết kế OneHub của chủ repo, 219 256 009 byte, đúng tệp của
  [lượt đọc thử ngày 2026-11-26](figma-fig-real-sample.md). Phiên đo chép nó vào thư mục nháp và chỉ chạy trên bản chép.
  `sha256` của tệp gốc trước và sau lượt đo là một (`f82c7efd…7aaf29e`).
- **Dữ liệu riêng.** Tệp và bản xuất biến là dữ liệu thiết kế riêng của chủ repo. Chúng chỉ nằm trong thư mục nháp của
  phiên và trong các bản sao bỏ đi ở đó. Trang này chỉ ghi số đếm, hình dạng và vài tên.
- **Công cụ đọc.** Chương trình `export_variables` đã build ngày 2026-11-26 từ crate `designos-fig` của
  design-os-studio (`a26f09a`, giấy phép PolyForm Shield 1.0.0). Lượt này dùng lại đúng tệp nhị phân ấy.
- **Bản sao bỏ đi.** Ba bản sao của repo này tại `d405e7f`, mỗi bản `git archive HEAD` rồi `git init` riêng, bỏ
  `plugins/`, `docs/`, `wiki/decisions/`, `wiki/specs/`, `tests/plugin-*` và `mk/plugin.mk` như
  [README](README.md) dặn, `node_modules` nối bằng liên kết. Plugin là một bản chép của `plugins/design-assembly` đặt
  ngoài bản sao. Mỗi bản sao có `DESIGN_ASSEMBLY_CORES` riêng trong thư mục nháp.
  - Bản A: phiên đo chạy bằng lệnh, để đếm.
  - Bản B: một tác tử chạy đề chuẩn, nhánh có phích.
  - Bản C: nhánh đối chứng, plugin đã bỏ tệp phích `figma.json`.
- **Đề chuẩn.** [`briefs/foundations.md`](briefs/foundations.md), máy viết trong lượt này vì không đề nào sẵn có hợp
  với một lượt bắt đầu từ tệp người mang tới.
- **Máy.** macOS 26.3, Node 26.7.0.

## Công cụ đọc, một lần, mạng bị chặn

```text
sandbox-exec -p '(version 1)(allow default)(deny network*)' export_variables <bản chép>.fig variables.json
```

| Đo                              | Kết quả                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| Thoát                           | 0                                                            |
| Thời gian                       | 32,7 giây thực (20,8 giây người dùng)                        |
| Dòng báo của nó                 | «variables: 1713, collections: 43»                           |
| Cỡ bản xuất                     | 1 516 734 byte                                               |
| So với bản xuất ngày 2026-11-26 | trùng từng byte (`cmp`), cùng `sha256` (`9f46b438…944f6b5d`) |
| Tệp gốc và bản chép sau khi đọc | không đổi                                                    |

Hai lần đọc cách nhau hai ngày cho cùng một tệp: công cụ đọc ổn định trên tệp này. Điều đó không nói nó đọc đúng.

## Đường đi trong bản sao, theo skill `bring-in`

Lệnh của bản A, theo thứ tự (`<plugin>` là thư mục plugin ngoài bản sao):

```text
node tools/design-assembly/check.mjs                                   # thoát 0, trước khi làm gì
node <plugin>/scripts/status.mjs --target .                            # thoát 0, không gì chờ chủ repo
node <plugin>/scripts/bring-in.mjs --ways                              # thoát 0
cp <bản xuất> design/outside/variables.json                            # việc của «người»
node <plugin>/scripts/variables-source.mjs --target . --file design/outside/variables.json --plug figma   # thoát 0
node <plugin>/scripts/variables-source.mjs --target . --check          # thoát 0
node <plugin>/scripts/bring-in.mjs --from design/outside/variables.json --target . --dry-run --json       # thoát 1
node <plugin>/scripts/bring-in.mjs --from design/outside/variables.json --target .                        # thoát 1
node <plugin>/scripts/specimen.mjs --target . --section direction --from design/outside/variables.json    # thoát 0
node tools/design-assembly/check.mjs                                   # thoát 1: design-exports
make design-exports                                                    # thoát 0
node tools/design-assembly/check.mjs                                   # thoát 0
```

Thoát 1 của `bring-in` nghĩa là có câu hỏi chờ chủ repo, không phải lỗi. Cầu chạy 0,08 giây. Cầu và phép so ghim chạy
lại dưới cùng lệnh chặn mạng và cho cùng kết quả.

`bring-in --ways` in hai lối của phích `figma`: `saved-file` (đọc như bản xuất biến) trước, `own-export` (chưa đọc
được) sau, rồi dòng `sends:` và dòng `on the machine:` nêu tên công cụ đọc đã thử cùng giấy phép của nó.

## Số đếm

Đếm bằng hai cách: lời cầu tự báo (`--json`), và một bộ đếm viết riêng đọc thẳng bản xuất, không dùng mã của cầu. Hai
bên khớp.

| Đếm gì                                                        | Số        |
| ------------------------------------------------------------- | --------- |
| Giá trị trong tệp (1 713 biến, 43 collection)                 | 3 254     |
| Giá trị của 11 collection của tệp (908 biến)                  | 1 715     |
| Cầu đọc được (839 biến, 11 collection)                        | **1 633** |
| Giá trị của tệp không vào                                     | 82        |
| Giá trị của 32 collection bản sao thư viện, gạt ra (805 biến) | 1 539     |
| Dòng `not read` (lỗi đọc thật)                                | 0         |
| Dòng `computed:` (giá trị đi qua alias)                       | 1 114     |

1 633 + 82 + 1 539 = 3 254. Tám mươi hai giá trị không vào, theo loại:

- **2** giá trị của **1 biến đúng/sai**: ổ nền không dùng kiểu này; cầu đếm trong một dòng.
- **72** alias dừng ở một **biến không có giá trị nào** trong bản xuất.
- **8** alias dừng ở một **giá trị thiếu ở một mode** của collection đích.

Cả 80 alias ấy dừng trong 11 collection của tệp, không ở bản sao thư viện. Ngoài ra cầu báo 36 biến rỗng và 11 giá trị
thiếu mode; chúng không phải giá trị của tệp nên không nằm trong 1 715.

Thứ cầu đếm thêm, mỗi thứ một dòng: 4 tên do hai biến của cùng một collection giữ (3 ở Primitives, 1 ở Theme), cả hai
biến được giữ; 8 trục mode không mang (AI / Density, Breakpoint, Density, Icon tone, Input, Portal, Spacing, Themes),
mỗi trục cầu lấy một mode và in ra; 16 màu có alpha dưới 1.

### Ứng viên

| Khoá                 | Ứng viên                            | Sổ đã chốt               | Ngược sổ  | Thành câu hỏi |
| -------------------- | ----------------------------------- | ------------------------ | --------- | ------------- |
| Màu gốc              | `#0246ff`, từ `Theme:color.primary` | `#0246ff`                | không     | —             |
| Thang chữ (và tỉ lệ) | modular, major-second               | standard                 | có        | có            |
| Bo góc               | small                               | floor                    | có        | có            |
| Font chữ thường      | Inter                               | Geist Variable (của sàn) | có        | có            |
| Font tiêu đề         | Inter                               | theo font chữ thường     | theo trên | theo câu trên |

Ba giá trị ngược sổ, ba câu hỏi. Màu tối của nguồn trùng màu sáng và chỉ được nêu, không vẽ. Trên bảng mẫu ứng viên là
hướng D, sau ba hướng A, B, C của plugin; bốn khoá của nó trùng hướng A.

Khoá của sổ mà cầu không so: đơn vị khoảng cách, họ màu trung tính, các tông trạng thái. 1 633 giá trị đọc được dùng để
tính ra bốn khoá trên; không giá trị nào khác của hệ thành token (dòng giới hạn
`bring-in-reads-colour-type-and-corner-only`).

### Ba lỗ hổng của lượt ngày 2026-11-26

| Lỗ hổng                                          | Trên tệp thật hôm nay                                                                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alias sang collection có mode sáng hay tối bị bỏ | Hết. Tệp có 1 194 giá trị là alias, 1 084 sang collection khác, 10 từ collection không có mode sáng tối sang collection có; không dòng `not read` nào.         |
| Tên trùng giữa các collection bị đè không báo    | Hết. Sau khi gạt bản sao thư viện, không tên nào nằm ở hai collection của tệp. 1 633 giá trị, 1 629 khoá; 4 cặp cùng khoá là 4 tên trùng trong một collection. |
| Biến đúng/sai bị báo như lỗi đọc                 | Hết. Một dòng đếm: 1 biến, 2 giá trị.                                                                                                                          |

Đảo thứ tự biến và collection trong tệp rồi đọc lại: cùng giá trị, cùng số đếm.

Trong 98 giá trị lượt trước mất vì biến rỗng và mode thiếu, **80 vẫn mất** (72 và 8 ở trên). Cầu nay đếm chúng riêng
thay vì báo lỗi, nhưng giá trị vẫn không có. Không có bản xuất do chính Figma làm của tệp này, nên không nói được tệp
vốn thế hay công cụ đọc làm mất (dòng giới hạn `bring-in-no-value-not-told-apart`).

## Nhánh có phích: một tác tử, đề chuẩn và skill

Một tác tử mới nhận đề chuẩn (đoạn «With the plug»), đường dẫn bản B, đường dẫn plugin và skill `bring-in`. Nó không
được đọc mã hay bài kiểm của plugin, không mạng, không công cụ của Figma. Phiên đo, đứng vào chỗ «người», đã đặt bản
xuất ở `design/outside/variables.json` của bản B trước đó.

Nó chạy `--ways`, `bring-in`, `specimen`, `variables-source` (ghim, rồi `--check`), cổng và `status`, rồi dừng ở ba câu
hỏi của chủ repo. Phiên đo đối chiếu lại bản B: 3 tệp câu hỏi mới, 1 dòng sổ nguồn mới, 5 tệp xuất đổi đúng dòng dấu,
stylesheet và sổ nền không đổi, bản xuất còn đúng `sha256`.

Tác tử tự khai, phiên đo chưa đếm lại bằng người thứ hai:

- **Chỗ phải tự quyết về hình dạng dữ liệu: 0.** Không cờ `--kind`, không `--collection`, không chọn mode, biến hay tên
  nào, không gõ hay quy đổi giá trị nào, không mở tệp JSON.
- **Chỗ khác phải tự quyết: 7.**
  1. Lấy `--plug figma` cho dòng ghim, vì đó là phích duy nhất `--ways` in ra; đề không nêu tên công cụ.
  2. Không truyền `--on`, nên ngày ghim là hôm nay; đề không nói bản xuất lấy ngày nào.
  3. Chạy `--ways` dù người đã có tệp, chỉ để biết id của phích mà bước 6 của skill cần.
  4. Chạy `bring-in` thật ngay, không `--dry-run` trước.
  5. Làm bước 6 (giữ bản xuất) vì đề nói tệp được đặt vào repo «để giữ».
  6. Cổng đỏ sau bước 6 mà skill không nói gì: nó tìm nguyên do bằng cách nhấc dòng sổ nguồn ra rồi đặt lại, rồi chạy
     `make design-exports` theo lời của cổng.
  7. Không mở bảng mẫu, và không kiểm thư mục `design/outside/` có nằm trong tầm của bộ định dạng không.
- **Không chắc là việc của mình: 3** (chạy `make design-exports`; tên phích và ngày trên dòng ghim; việc nhấc dòng sổ
  ra để chẩn đoán).
- **Đáp thay chủ repo: 0.**
- 139 499 token, 13 lần gọi công cụ, 3 phút 34 giây, theo bộ đếm của phiên.

## Ba câu hỏi và lời chủ repo

Phiên đo hỏi chủ repo trong một hộp hỏi, mỗi câu kèm khuyến nghị của chính plugin («sổ thắng nguồn ngoài»):

| Câu của cầu                              | Phiên đo hỏi                                                            | Chủ repo đáp         |
| ---------------------------------------- | ----------------------------------------------------------------------- | -------------------- |
| `outside-variables-97e78a-type-scale`    | tệp Figma dùng thang «modular», sổ chốt «standard»: giữ «standard» chứ? | «Giữ «standard»»     |
| `outside-variables-97e78a-corner-radius` | tệp Figma dùng bo góc «small», sổ chốt «floor»: giữ «floor» chứ?        | «Giữ «floor»»        |
| `outside-variables-97e78a-text-font`     | tệp Figma đặt Inter, sổ chốt Geist Variable: giữ Geist Variable chứ?    | «Giữ Geist Variable» |

Ba lời ấy được ghi vào bản B bằng `decide.mjs --answers` (ba dòng `giữ`). Sau đó:

- `node tools/design-assembly/check.mjs`: thoát 0, «43 decisions held by 86 checks».
- `status.mjs`: thoát 0, «waiting on the owner: nothing in the ledgers or the waiting list», «next: nothing to run now».
- Stylesheet và sổ nền không đổi: sổ thắng, ứng viên vẫn là ứng viên.
- Chạy `bring-in` lần nữa: thoát 0, không hỏi lại, và in «No value of it goes against a value the owner settled», dù
  ứng viên vẫn khác sổ ở cả ba chỗ (dòng giới hạn mới `bring-in-says-no-value-goes-against-once-answered`).

Số lần máy quyết thay chủ repo trong cả lượt: **0**. Hai điều để chủ repo biết, không phải lời đáp thay: cầu tự lấy một
mode ở mỗi trong tám trục theo luật viết sẵn (trong đó Agent thay vì Customer), và tác tử chạy `make design-exports`.

## Nhánh đối chứng: plugin không có tệp phích

Đếm bằng lệnh trên bản C, không chạy bằng tác tử:

- `bring-in.mjs --ways`: «No plug file says how to get a file from its tool: ask the user for the file the tool made.»
- `plugs.mjs`: Figma không còn trên bảng ở ổ nào.
- `specimen.mjs --section direction`: ba hướng A, B, C của plugin, từ màu gốc của sổ; không hướng nào từ hệ của công cụ
  thiết kế.
- Skill `new` hỏi người màu gốc, thang chữ, bo góc và họ chữ. Sáu giá trị cầu tự đọc ở nhánh có phích (màu gốc, thang
  chữ, tỉ lệ, bo góc, font chữ thường, font tiêu đề) thì ở đây người phải tự tìm trong công cụ, tự chọn collection và
  mode, rồi gõ hay quy đổi: **6 chỗ** tự quyết về hình dạng dữ liệu, và 0 trên 1 633 giá trị do máy đọc.
- Không lệnh nào so giá trị người gõ với sổ thành câu hỏi.

Cùng tệp JSON thì cầu của plugin đọc như nhau dù có tệp phích hay không. Thứ tệp phích thêm là đường tới tệp ấy.

## Phép thử làm hỏng

- Thêm một byte vào bản xuất đã ghim: `variables-source --check` thoát 1, nêu dòng và tệp. Cổng vẫn thoát 0 (dòng giới
  hạn `variables-pin-not-held-by-the-gate`). Trả tệp về: thoát 0.
- `prettier --check` của repo trên bản xuất như công cụ đọc để lại: thoát 1. `make lint` của một repo thật sẽ đỏ cho
  tới khi tệp được viết lại (ghim đổi) hay thư mục ra khỏi tầm của bộ định dạng (dòng giới hạn mới
  `bring-in-kept-export-fails-the-format-check`).
- Ghim bản xuất làm cổng đỏ ở `design-exports` cho tới khi chạy `make design-exports`; skill không nói điều này (dòng
  giới hạn mới `bring-in-keep-leaves-the-gate-red-on-exports`).

## Hai dòng «xong khi» của giai đoạn 13

| Dòng                                                                                                  | Lệnh cho thấy                                                                                          | Chưa cho thấy                                                                                               |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Từ tệp `.fig` thật, một người mang biến vào thành hướng ứng viên, không tự quyết về hình dạng dữ liệu | công cụ đọc thoát 0; `bring-in` không cần cờ nào; tác tử khai 0 chỗ; hướng D trên bảng mẫu             | việc lưu tệp từ Figma; một người (không phải phiên đo) chạy công cụ đọc; tám trục mode cầu tự lấy theo luật |
| Mỗi giá trị ngược sổ là một câu hỏi                                                                   | `bring-in` thoát 1 với 3 câu cho 3 giá trị khác sổ; `status` đếm 3 chờ chủ repo                        | khoảng cách và các khoá khác của sổ mà cầu không so                                                         |
| Phích Figma có bản quyết định bốn thước ở ổ nền                                                       | trang 0135; `plugs.mjs` in «measured in d0135» ở ổ nền; bài kiểm «0018 criterion 10» và «criterion 11» | ổ hướng đi chưa đo                                                                                          |

Giai đoạn 13 không đóng ở lượt này, và mục 13.2 không bị đụng.

## Không kiểm

- Công cụ đọc là mã của bên thứ ba dưới giấy phép PolyForm Shield 1.0.0; giấy phép cho phép gì chưa được đọc và kiểm.
- Đọc `.fig` là giải mã ngược một định dạng Figma không công bố; có hợp điều khoản của Figma không thì chưa kiểm.
- Không có bản xuất do chính Figma làm của tệp này để so độ đúng.
- Cách cầu chọn mode cho alias chéo collection chưa được so với thứ Figma vẽ (dòng giới hạn
  `bring-in-alias-mode-by-name`).
- Chủ repo giữ cả ba giá trị của sổ, nên đường «bác, chạy lại bước chọn hướng, chọn hướng D, token được viết» chưa đi.
- Chưa ai nhìn bảng mẫu bằng mắt.
- Nhánh đối chứng không chạy bằng tác tử hay bằng người.
- Một tác tử, một lần; số chỗ tự quyết là tự khai.
- Nhật ký lệnh, báo cáo của tác tử và ba bản sao nằm trong thư mục nháp của phiên, không được giữ.
