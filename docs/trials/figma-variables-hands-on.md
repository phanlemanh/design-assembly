# Figma ở ổ nền tảng: thử tay đọc biến thật qua cầu `bring-in`

Một lượt chỉ đọc, ngày 2026-11-26, plugin 0.68.0 (`main` ở `23866a8`). Đây là bước đầu và rẻ nhất trong bốn bước (thử
tay, tệp phích, đo, phán) mà chủ repo cho làm ngoài kế hoạch. Việc đo phích Figma vẫn là một mục `parked` của giai đoạn 10
đã đóng. **Trang này không phải lượt đo**: nó chỉ ghi chỗ dữ liệu thật khác mẫu mà cầu được dựng trên.

## Chạy trên gì

- **Tài khoản:** phiên Figma đã đăng nhập sẵn bằng một tài khoản dùng chung của nhóm, không phải tài khoản riêng của chủ
  repo. Tài khoản ấy có hai chỗ: ghế View ở một nhóm gói starter (vai admin), và ghế Full ở một nhóm gói pro (vai khách).
  Lệnh kiểm tài khoản không cho biết còn bao nhiêu lượt gọi.
- **Tệp:** do chủ repo đưa, kèm lời «Hãy lựa chọn một page phù hợp». Đó là tệp hệ thiết kế của một sản phẩm, kiểu thư
  viện linh kiện shadcn, gồm 63 trang và 7 dòng ngăn:
  - nền tảng: biến và mode, lưới, khoảng cách và bo góc, chữ, màu, độ nổi, chuyển động, biểu tượng;
  - khoảng 40 trang linh kiện;
  - mẫu trang và bản nháp.

  Địa chỉ tệp không ghi ở đây, vì chủ repo chưa nói được ghi.

- **Trang chọn:** «Variables & Modes». Đây là trang tài liệu về biến, gồm 15 mục: ma trận ngữ cảnh, collections, chuỗi
  alias, density, màu theo mode, bàn giao cho dev, v.v. Theo chữ của chính trang ấy, mỗi trục biến thiên là một collection
  riêng: theme, portal, breakpoint, input, density, icon tone. Các collection tên bắt đầu bằng «Prototype ·» bị ẩn khỏi
  publish.
- **Sáu lượt gọi Figma** trên trần tám, đều chỉ đọc, không lượt nào ghi hay gửi gì của repo:

| #   | Công cụ             | Nút                                                 | Về                                                    |
| --- | ------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| 1   | `whoami`            | không                                               | đã đăng nhập; hai ghế như trên                        |
| 2   | `get_metadata`      | không (liệt kê trang)                               | 70 dòng trang                                         |
| 3   | `get_variable_defs` | trang «Variables & Modes»                           | **bị từ chối**: «You currently have nothing selected» |
| 4   | `get_metadata`      | trang ấy                                            | cây khung, 68 540 ký tự, lưu ở thư mục nháp           |
| 5   | `get_variable_defs` | khung tài liệu của trang (toàn bộ 15 mục)           | 64 mục                                                |
| 6   | `get_variable_defs` | khung mẫu «Agent-Default-Pointer-Dark» trong mục 09 | 20 mục                                                |

Lượt 2 phải gọi vì đường dẫn trỏ tới một trang linh kiện, không tới trang biến. Lượt 4 phải gọi vì công cụ không nhận
một trang: nó cần một khung bên dưới.

## Công cụ của Figma cho gì, không cho gì

`get_variable_defs` trả một bản đồ phẳng **từ một chuỗi sang một chuỗi**, chỉ cho những biến mà nút ấy dùng.

- **Chỉ biến được dùng, không phải mọi biến của tệp.** Khung tài liệu lớn nhất của trang biến cho 64 mục. Khung tối cho 20.
- **Tên là cú pháp mã, không phải tên biến Figma.** Mục trả về có tên kiểu `hsl(var(--primary))`, `var(--radius)`,
  `var(--text-body-small)` hay `calc(var(--spacing) * 2)`. Tên có gạch chéo (dạng `color/brand/primary`) không xuất hiện
  lần nào. Đây có vẻ là trường `codeSyntax` (WEB) mà tệp đặt cho từng biến. Đó là suy đoán, chưa kiểm.
- **Giá trị đã giải cho một mode: mode đang đặt trên nút.** Cùng `hsl(var(--background))`, khung tài liệu cho `#ffffff`,
  khung tối cho `#0d0f13`. `var(--control-height-default)` cho 32 ở khung này, 36 ở khung kia, vì hai khung đặt density
  hay input khác nhau. Mỗi lần gọi chỉ thấy một tổ hợp mode, và không nói đó là tổ hợp nào.
- **Alias bị làm phẳng.** Trang tài liệu có hẳn mục «chuỗi alias», và tả `space/inset/card` trỏ tới
  `control/padding-x/default`. Công cụ chỉ trả `var(--space-inset-card)`: 12.
- **Không có collection, mode, id, kiểu biến hay đơn vị.** Số đến dưới dạng chữ không đơn vị (`"12"`). Màu đến dưới dạng
  hex sáu hoặc tám chữ số (`#0d0f130a` có alpha).
- **Lẫn thứ không phải biến:**
  - 9 kiểu chữ dạng `Font(family: …, size: var(--text-…), …)`;
  - một mục `currentColor`;
  - 11 mục `calc(var(--spacing) * n)`, tức các lần dùng của một biến `spacing` = 4, không phải 11 biến.

64 mục của lượt 5 chia ra: 15 màu, 28 `var(--…)` (27 số, 1 tên font `Inter`), 11 `calc(…)`, 9 kiểu chữ, 1 `currentColor`.

## Cầu đọc được gì

Bản sao bỏ đi của repo, dựng bằng `git archive HEAD` rồi `git init` riêng trong thư mục nháp. Lệnh là
`bring-in.mjs --from <tệp> --target <bản sao> --dry-run`.

| Đầu vào                                  | Loại              | Kết quả                                                                                  |
| ---------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| kết quả thô lượt 5                       | đoán: `tokens`    | đọc **0 trên 64 mục**, rồi từ chối (thoát 2): «names no primary colour that can be read» |
| kết quả thô lượt 5                       | `variables`       | từ chối (thoát 2): «cannot be read: it lists no variables»                               |
| kết quả thô lượt 6 (khung tối)           | đoán: `tokens`    | từ chối như dòng đầu                                                                     |
| bản chuyển tay (lượt 5 sáng, lượt 6 tối) | đoán: `variables` | đọc được, thoát 1, một câu hỏi                                                           |

- **Kết quả thô** không có `$value` nào, nên cách đọc tệp token không thấy gì.
- **Cách đọc `variables`** đòi `meta.variables` và `meta.variableCollections`. Đó là hình dạng mà
  `plugins/design-assembly/scripts/outside-tokens.mjs` (hàm `fromVariables`) và mẫu thử trong
  `plugins/design-assembly/tests/test-bring-in.mjs` dùng: collection có `modes` và `defaultModeId`, biến có
  `variableCollectionId` và `valuesByMode`, màu là kênh 0 tới 1, alias là `{type: "VARIABLE_ALIAS", id}`.
- Công cụ MCP không trả hình dạng ấy, ở bất kỳ lượt nào.

**Bản chuyển tay** ([lựa chọn ở dưới](#lựa-chọn-bằng-tay)) giữ 44 trên 64 mục: 15 màu, 28 số, 1 chuỗi. Nó bỏ 20 mục: 10
bội của `spacing`, 9 kiểu chữ và `currentColor`. Cầu đọc 88 token (44 biến, mỗi biến hai mode), không token nào bị từ
chối. Không token nào phải giải (alias hay biểu thức), vì công cụ đã làm phẳng hết.

Ứng viên đọc ra:

| Khoá      | Giá trị                  | Lấy từ                                                                                                                |
| --------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| màu gốc   | `#0246ff`, tối `#0246ff` | `color.primary`; trùng màu chủ repo đã chốt                                                                           |
| thang chữ | `standard`               | **của sàn, không phải của tệp**: 6 cỡ (12, 14, 16, 24, 28, 48) có 28 ngoài thang chuẩn, và bước giữa 1,5 xa mọi tỉ lệ |
| bo góc    | `small` (8px)            | `radius` và `radius/lg`, cả hai 8; đúng một giá trị của plugin                                                        |
| font      | không có                 | tên `font-sans` không có đoạn `family`; đổi tên thành `font/family/sans` thì cầu đọc `Inter` cho cả chữ lẫn tiêu đề   |

Cầu đọc được 88 token, nhưng chỉ khoảng 9 biến vào tới ứng viên: 1 màu, 2 bo góc, 6 cỡ chữ. Các biến còn lại (control,
line-height, icon, layout, các màu khác) không có khoá nào nhận. Khoảng cách cũng vậy: cầu không đọc khoá khoảng cách nào.

**Chạy thật trong bản sao** chỉ ghi một tệp, `design/waiting/outside-figma-variables-converted-760c08-corner-radius.json`:
bo góc `small` của tệp Figma gặp `floor` mà chủ repo đã chốt. Câu hỏi khuyến nghị giữ `floor`. Đây là **khác biệt thật**,
không phải câu thừa: `floor` là 10px (`templates/tools/design-assembly/scale.mjs`), tệp Figma là 8px.

Font cũng lệch (tệp dùng `Inter`, stylesheet của repo đặt `Geist Variable`), nhưng cầu chỉ nói font, không hỏi. Còn
`status` liệt kê đúng một câu chờ chủ repo.

**Cổng của bản sao.** Cổng chạy hai lần, trước và sau khi có câu hỏi. Lần đầu không có `node_modules`, nên cổng đỏ cả
trước lẫn sau vì thiếu lint và không đọc được font, không vì ứng viên. Lần sau mượn `node_modules` của worktree bằng một
liên kết: `make design-assembly` xanh cả hai lần, «43 decisions held by 86 checks», và hai lần ra giống hệt nhau. Ứng
viên không làm hỏng gì; cổng cũng không nói gì về nó.

## Lựa chọn bằng tay

Mỗi lựa chọn là một chỗ người dùng, hoặc plugin, sẽ phải quyết nếu nối Figma vào cầu theo đường này. Mã chuyển nằm ở
thư mục nháp, không vào repo.

0. **Chọn nút.** Công cụ không nhận trang, và chỉ trả biến mà nút dùng. Phải chọn một khung, và khung nào thì quyết định
   biến nào hiện ra. Ở đây chọn khung tài liệu lớn nhất của trang biến, cộng một khung mẫu tối.
1. **Tên biến từ cú pháp mã.** Lấy tên thuộc tính trong `var(--x)` và `hsl(var(--x))`. Coi `calc(var(--spacing) * 1)` là
   biến `spacing`, bỏ các bội khác.
2. **Bỏ thứ không phải biến:** kiểu chữ `Font(…)` và `currentColor`.
3. **Ranh giới nhóm trong tên.** Dấu gạch ngang không nói nhóm kết thúc ở đâu: `muted-foreground` là một tên,
   `font-size` là một nhóm. Luật đã dùng:
   - màu đặt dưới `color/`, giữ nguyên tên;
   - `text-<bậc>` thành `font/size/<bậc>`, và cặp `--line-height` của nó thành `line-height/<bậc>`;
   - `radius-<x>` thành `radius/<x>`;
   - mọi tên khác giữ nguyên.

   Luật này quyết luôn cầu đọc được gì: để `font-sans` nguyên thì mất font.

4. **Kiểu và đơn vị.** Hex thành kênh 0 tới 1, giữ alpha. Chữ số coi là số pixel, vì công cụ không cho đơn vị hay kiểu.
5. **Collection và mode bịa ra.** Một collection «Theme» với Light (mặc định) và Dark. Lượt 5 coi là Light, lượt 6 coi là
   Dark. Tệp thật có ít nhất sáu trục, và không lượt gọi nào nói mình đang ở mode nào.
6. **Chỉ màu lấy giá trị tối.** Số nào lệch ở khung tối (chiều cao control 36 so với 32) là do trục density hay input, nên
   Dark giữ số của Light. 5 màu có giá trị tối riêng; biến nào lượt 6 không có thì Dark giữ giá trị Light.

## Đọc đầu bốn thước, cho phích Figma ở ổ nền tảng

Đây chưa phải lượt đo của 0008. Mỗi thước ghi: thấy, không thấy, hay chưa đo.

- **Thước 1, giữ được và kiểm được bằng lệnh: không thấy, với đường thô.**
  - Kết quả của công cụ không phải một tệp repo giữ. Lượt này lưu nó bằng tay ở thư mục nháp, không ghim.
  - Cầu không đọc được nó như công cụ trả.
  - Sau khi chuyển tay thì thấy: câu hỏi nằm trên hàng chờ, cổng xanh, `status` thấy câu.
- **Thước 2, số chỗ phải đoán: thấy.** Bảy lựa chọn bằng tay (0 tới 6). Thêm một lượt gọi mất vì nút là trang. Ba lựa
  chọn (0, 5, 6) đổi kết quả mà không gì trong dữ liệu chỉ ra cách đúng.
- **Thước 3, chạy ở đâu: thấy.**
  - Cần tài khoản Figma, một ghế, và mạng tới máy chủ MCP của Figma.
  - Gửi đi khoá tệp và id nút, không gì của repo.
  - Lượt này chạy dưới tài khoản dùng chung của nhóm, nên chưa thấy được người có ghế View ở gói starter thì gọi được
    bao nhiêu.
  - Theo luật của 0008: phích phụ.
- **Thước 4, tốn bao nhiêu: chưa đo.**
  - Sáu lượt gọi trên hạn mức của tài khoản, một lượt bị từ chối nhưng có thể vẫn tính. Lệnh kiểm tài khoản không trả hạn
    mức còn lại.
  - Token của phiên này không đếm theo cách của các lượt trước.

## Tệp phích `figma.json` và bước sau cần gì

- **Ổ:** nền tảng. Đầu vào là một liên kết có `node-id` của một khung, không phải trang.
- **Công cụ được gọi:** chỉ nhóm đọc (`whoami`, `get_metadata`, `get_variable_defs`). Trần lượt gọi theo loại ghế.
- **Trạng thái:** đăng nhập hay `needs-sign-in`, như 0014 đã tả. Nói rõ gửi gì đi: khoá tệp, id nút.
- **Một quyết định chưa có, và phải có trước tệp phích:** đường nào đưa biến của Figma vào cầu.
  - **(a) Dạy cầu đọc bản đồ phẳng của MCP.** Mất collection, mode và alias. Mỗi mode là một lượt gọi trên một khung đặt
    sẵn mode ấy, và các lựa chọn 1 tới 6 thành luật của plugin.
  - **(b) Lấy một bản xuất đầy đủ.** Ba lối, theo trang công khai đọc ngày 2026-11-26:
    - **REST API biến** (hình dạng cầu đang đọc): trang của Figma ghi chỉ mở cho người có ghế Full trong một tổ chức gói
      Enterprise, khách không dùng được. Không chỗ ngồi nào ở đây thuộc gói ấy: lối này đóng.
    - **Xuất biến sẵn có của Figma**, theo chuẩn token DTCG: được báo ở Schema 2025 và mở dần từ cuối 2025. Cầu đã đọc tệp
      token DTCG (`--kind tokens`), nhưng chưa thấy bản xuất ấy ghi mode thế nào. Chưa kiểm tài khoản này có lối ấy không.
    - **Plugin Figma** đọc biến qua Plugin API: theo một nguồn thứ ba thì dùng được ở mọi gói, có plugin cộng đồng xuất ra
      JSON. Chưa kiểm ghế View chạy được plugin ấy không.
- Ở cả hai đường, cầu hiện chỉ dùng chừng 9 trên 44 biến. Khoảng cách, chiều cao control và các trục ngoài sáng và tối
  không có khoá nào nhận.

## Lối thứ ba: tệp `.fig` qua mã của design-os-studio

Cùng ngày, chủ repo cho thử thêm một lối không qua Figma: đọc thẳng tệp `.fig` (tệp có được bằng File › Save local copy).

- **Mã đọc.** design-os-studio (github.com/jangtrinh/design-os-studio, `a26f09a`, giấy phép PolyForm Shield 1.0.0) là một
  công cụ thiết kế viết bằng Rust. Crate `designos-fig` của nó giải mã định dạng `fig-kiwi` bên trong tệp `.fig`.
  - Hàm `export_variables_json` của crate ấy cho đúng thân phản hồi `GET /v1/files/:key/variables/local`: hình dạng cầu
    đang đọc.
  - Phiên này build riêng crate ấy, cùng một chương trình 30 dòng gọi `import_fig` rồi `export_variables_json`, chính hai
    hàm mà lệnh `designos FILE --export-variables OUT --format figma-rest` dùng.
  - Rust cài vào thư mục nháp. Build mất 2 phút 29 giây; ứng dụng GUI và phần GPU không build.
- **Tệp thử.** Tệp của chủ repo chưa có bản `.fig`, nên chủ repo cho tải một tệp công khai: hệ thiết kế AG Grid v3.2.0,
  13,5 MB, từ repo GitHub của AG Grid (`ag-grid/ag-grid-figma-design-system`, thư mục `archive/v3-2-0/`). Repo ấy không khai
  giấy phép chung cho tệp `.fig`, nên tệp chỉ dùng để thử, không vào kho này.
- **Không lượt gọi Figma nào**, không tài khoản, không mạng lúc đọc.

### Đọc ra gì

- **Xuất biến mất 3,7 giây:** 26 collection, 770 biến (498 màu, 226 số, 30 đúng/sai, 16 chuỗi), 1 403 giá trị, trong đó
  417 là alias.
- **Collection và mode giữ nguyên tên.** Có «AG Theme» với Quartz Light và Quartz Dark (392 biến), «AG Chart» với bốn bảng
  màu, «AG-Density» với standard, compact và comfort. Có 19 collection là bản sao ẩn của thư viện ngoài, giữ 61 biến.
- **Không cần lựa chọn bằng tay nào.** Bảy chỗ phải đoán của lối MCP không còn: tên có gạch chéo, kiểu biến, mode và alias
  đều có sẵn.

### Có đúng không

AG Grid đăng kèm một tệp biến do chính Figma xuất (nút xuất biến sẵn có, dạng DTCG): collection «AG Theme», mode Quartz
Light. So với `.fig` ở cùng collection và cùng mode:

| Đo                                             | Kết quả                                   |
| ---------------------------------------------- | ----------------------------------------- |
| Biến khớp tên                                  | 392 / 392                                 |
| Biến khớp id (`VariableID:…`)                  | 392 / 392                                 |
| Giá trị đơn trùng nhau                         | 310                                       |
| Alias ở cả hai bên                             | 78                                        |
| Khác cách ghi đúng/sai (0/1 so với false/true) | 3                                         |
| Khác thật                                      | 1: `rows/rowGroupIndentSize` 28 so với 14 |

Chưa phân biệt được chỗ khác thật đến từ cách đọc `.fig` hay từ hai tệp thuộc hai phiên bản khác nhau: tệp biến của AG
Grid không ghi phiên bản.

### Cầu đọc được gì

`bring-in.mjs --from <bản xuất> --target <bản sao> --dry-run`, kind tự đoán đúng là `variables`:

- Đọc **1 241 trên 1 403** giá trị, theo 15 mode. Có **311** token phải đi theo alias tới giá trị cuối.
- Ứng viên:
  - màu `#2196f3` lấy từ `quartz.primary`;
  - bo góc 6px, lấy về `small` (8px), có ghi là xấp xỉ;
  - thang chữ `standard`, đọc từ tệp chứ không lấy của sàn;
  - font `IBM Plex Sans` cho cả chữ lẫn tiêu đề.
- Chạy thật trong bản sao: hai câu hỏi (màu `#2196f3` so với `#0246ff`, bo góc so với `floor`). Câu hỏi là đúng phải có,
  vì đây là hệ của một sản phẩm khác. Cổng của bản sao xanh, «43 decisions held by 86 checks».

**Cầu không đọc được 162 giá trị**, và lấy sai một số khác mà không báo:

- **59 giá trị đúng/sai:** cầu từ chối kiểu này («not text, a length or a colour»). Ở tệp này đó là các công tắc hiện icon,
  nên ổ nền tảng không mất gì.
- **103 alias trỏ sang collection khác:** «names no token». Cầu khoá token của một mode tên light hay dark là `tên@light`,
  và không giữ bản không có mode. Một biến ở collection có mode khác (Mode 1, alpine, sheets…) trỏ sang collection ấy thì
  không tìm thấy gì. Có 194 alias kiểu ấy; những alias nào đi từ một mode light hay dark thì vẫn đọc được.
- **Trùng tên giữa các collection, mất lặng lẽ:** 42 khoá token được ghi hai lần trở lên (99 mục). Ở 9 khoá, các bản ghi
  có giá trị khác nhau, và cầu giữ bản đọc sau cùng, không báo. Ví dụ `ag-foreground-color` có ở ba collection.

### Bản xuất sẵn có của Figma qua cầu

Chạy cầu thẳng trên tệp DTCG mà Figma xuất cho AG Grid:

- Cầu đọc đủ 392 token, không bỏ token nào.
- Nhưng cầu bỏ qua tên mode của tệp (`$extensions["com.figma.modeName"]` là «Quartz Light»), nên mọi token thành không mode.
- Rồi cầu từ chối (thoát 2), vì collection ấy không có màu nào tên primary, brand hay accent: màu chủ đạo nằm ở collection
  khác.
- Lối xuất sẵn có ghi một collection và một mode mỗi tệp. Muốn có cả sáng lẫn tối thì cầu phải đọc nhiều tệp một lúc;
  hiện nó đọc một tệp.

### So ba lối

| Lối                          | Cần gì                                   | Hình dạng ra                    | Cầu đọc được                                         |
| ---------------------------- | ---------------------------------------- | ------------------------------- | ---------------------------------------------------- |
| MCP `get_variable_defs`      | tài khoản, ghế, mạng; một lượt mỗi khung | bản đồ phẳng, một mode          | 0/64 thô; 7 lựa chọn tay                             |
| Xuất sẵn có của Figma (DTCG) | người mở tệp trong Figma                 | một collection × một mode / tệp | 392 token, mất mode, từ chối vì không có màu chủ đạo |
| `.fig` qua design-os-studio  | quyền Save local copy; mã bên thứ ba     | đúng hình dạng REST             | 1 241/1 403, có 3 lỗ hổng                            |

**Bước sau đề xuất:**

1. Chủ repo lưu một bản `.fig` của tệp hệ thiết kế đã thử ở trên, rồi chạy lại lối thứ ba trên đó.
2. Ba lỗ hổng của cầu (alias sang collection có mode light hay dark, trùng tên giữa collection, giá trị đúng/sai) là việc
   của plugin, không phải của Figma. Chúng đi vào phần `parked` của kế hoạch nếu chủ repo đồng ý.
3. Trước khi viết `figma.json`, cần quyết có cho plugin dựa vào mã có giấy phép PolyForm Shield không. Giấy phép ấy cấm
   dùng phần mềm để làm sản phẩm cạnh tranh với nó; chưa đọc kỹ.

## Không kiểm

- Tên `hsl(var(--…))` lấy từ `codeSyntax` là suy đoán.
- Giới hạn Enterprise của REST API chỉ đọc từ trang của Figma (developers.figma.com/docs/rest-api/variables-endpoints),
  chưa thử gọi. Phạm vi của lối xuất sẵn có và của plugin chưa kiểm.
- Hạn mức thật của từng ghế chưa kiểm.
- Bảng mẫu (`specimen.mjs --section direction`) không vẽ ứng viên trong lượt này.
- Lối MCP chỉ đọc một tệp, một trang, hai khung, không phải mọi biến của tệp.
- Lối `.fig` chưa chạy trên tệp của chủ repo, chỉ trên tệp AG Grid. Ghế View có Save local copy được không chưa kiểm.
- Đọc `.fig` bằng giải mã ngược có hợp điều khoản của Figma không, chưa kiểm.
- Chỗ khác `rowGroupIndentSize` chưa rõ nguyên nhân.
