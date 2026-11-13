---
type: spec
title: Design-assembly là lớp meta tạo và giữ design system cho nhiều kho
status: draft
tier: 1
links:
  - wiki/specs/0001-design-system-for-claude-code.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/decisions/0006-one-ledger-one-layer-list.md
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/decisions/0022-record-beside-a-list.md
sources:
  - "chủ kho, 2026-11-13: tầm nhìn và ba câu trả lời làm rõ"
  - repo-standards/plugins/repo-setup/capabilities/design/preset.toml
  - repo-standards/docs/superpowers/specs/2026-11-09-design-layer-design.md
  - delivery-loop/design-floor/HOP-DONG-NHAP.md
  - delivery-loop/scripts/design-floor-bac.mjs
  - delivery-loop/docs/plans/lo-trinh-kit.json
  - onehub-inventory/wiki/decisions/0023-chon-truoc-tao-sau.md
  - onehub-inventory/tools/proof_gate/check.py
  - onehub-inventory/tools/design_check.py
---

# 0002 Design-assembly là lớp meta tạo và giữ design system cho nhiều kho

Bản nháp, máy viết ngày 2026-11-13 theo tầm nhìn chủ kho nêu cùng ngày. Chủ kho chưa duyệt bản
này. Ba câu trả lời của chủ kho được ghi nguyên ở mục Intent; mọi thứ còn lại là đề xuất của máy.

Năm sơ đồ đi kèm, vẽ ngày 2026-11-13, nằm ở `docs/diagrams/meta-layer/`: nguyên lý gốc, vai của
người và Claude Code, ranh giới ba plugin, vòng đời một kho, và lộ trình theo chặng.

## Intent

**Tầm nhìn, lời chủ kho (2026-11-13).** Design-assembly được thiết kế như một lớp meta, là một
plugin, để tạo ra design system dùng trên nhiều kho. Inventory hiện làm hệ design bằng tay;
design-assembly sinh ra để lấp đúng khoảng trống đó cho mọi kho. Mỗi lần làm một kho, việc design
bị phân mảnh giữa Repo Standards, Acceptance Gate Kit (sẽ đổi tên thành delivery-loop) và phần tự
dựng bằng tay như Inventory đã làm.

**Ba điều chủ kho đã chốt khi được hỏi lại:**

1. «Meta cho nhiều kho» nghĩa là **chung lõi, riêng phần mở rộng**: các kho cùng họ sản phẩm chia
   một lõi chung; mỗi kho thêm phần riêng; thứ lặp lại ở nhiều kho được nâng lên lõi.
2. **Design-assembly là chủ duy nhất của mọi thứ thuộc design.** Repo Standards chỉ đặt kho và gọi
   nó; delivery-loop chỉ đọc sổ của nó. Phần design đang nằm ở hai kho kia dần chuyển về.
3. Công cụ Inventory tự dựng được **rút vào plugin, và Inventory chuyển sang dùng** plugin.

Câu thứ tư, «mọi kho rộng tới đâu», chủ kho hỏi lại: có giải được cả ba phạm vi không. Phân tích ở
mục «Phạm vi kho: một kiến trúc, ba mức phục vụ».

### Hiện trạng: cùng một việc, ba nơi, nhiều hình dạng

Kiểm kê chỉ đọc ngày 2026-11-13 (ba tác tử, mỗi tác tử một kho):

| Khái niệm                        | Repo Standards                          | Delivery-loop                               | Inventory tự dựng                               | Design-assembly                    |
| -------------------------------- | --------------------------------------- | ------------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| Sổ quyết định và tỉ lệ máy giữ   | không                                   | không                                       | có (`design_check.py`)                          | có, cùng định dạng                 |
| Giá trị gốc (màu, chữ, bo góc)   | hỏi màu thương hiệu, ghi vào stylesheet | chỉ đọc                                     | tự viết stylesheet                              | hỏi bằng mắt, sinh, giữ            |
| Sổ token                         | nói rõ là không làm                     | đọc; tự nhận «chưa có bộ sinh»              | chưa có                                         | sinh từ stylesheet                 |
| Sổ linh kiện                     | nói rõ là không làm                     | đọc, hình dạng thứ nhất                     | tự sinh, hình dạng thứ hai                      | tự sinh, hình dạng thứ ba          |
| Sổ màn và trạng thái             | `src/screens.ts`                        | không                                       | `design/screens.yaml`                           | đọc bản của sàn                    |
| Trang kiểu màn                   | không                                   | đọc và tự sinh được                         | viết tay, cùng định dạng                        | đọc, cùng định dạng                |
| Luật lint giao diện              | khối lint của sàn                       | bộ dò riêng                                 | 12 luật tự viết                                 | không có, dựa vào sàn              |
| Bài kiểm trình duyệt theo sổ màn | có, khoá bằng băm                       | không                                       | có, kèm ca phá                                  | có, kèm phép đo riêng              |
| Kho khối và thang dùng lại       | không                                   | đang lên kế hoạch (bày ba cách chọn ở cổng) | có (sổ khối, cổng chứng minh màn)               | chưa có                            |
| Danh mục thư viện mua            | ghim bản shadcn                         | không                                       | có (danh mục ReUI ghim băm, tra không cần mạng) | chưa có                            |
| Kho đã có sẵn                    | từ chối với design                      | đọc được, không sinh                        | chính nó                                        | có đường «nhận»                    |
| Chọn bằng mắt, cuốn sổ bàn giao  | không                                   | bản bấm được ở từng tính năng               | ảnh ứng viên ở cổng phạm vi                     | bảng mẫu và cuốn sổ, chỉ trên Vite |

Ba điều rút ra:

- **Sáu khái niệm tồn tại ở hai tới ba hình dạng.** Mỗi hình dạng có một bộ đọc riêng; riêng
  Inventory đã có ba bộ đọc cho cùng một sổ màn.
- **Khoảng giữa không ai nhận.** Repo Standards nói rõ nó dừng sau màn mẫu đầu tiên và không làm kho
  đã có. Kit nói rõ «kho giữ giá trị, kit giữ cơ chế», và tự ghi là thiếu bộ sinh sổ token, bộ sinh
  sổ linh kiện, và thứ chặn được lệch giữa màn với màn. Inventory lấp khoảng đó bằng khoảng hai
  mươi công cụ viết tay, gắn chặt vào tên riêng và chữ tiếng Việt của chính nó.
- **Design-assembly hôm nay mới đứng trên một loại kho.** Phần cài mã, bảng mẫu và cuốn sổ chỉ chạy
  ở kho React dựng bằng Vite trên sàn shadcn. Ở Inventory (Next.js, ReUI) nó chỉ audit và nhận
  được: 24 trên 38 câu lõi, không câu nào máy của nó giữ.

### Nguyên tắc kiến trúc

1. **Luật đi theo, phần ở lại.** Quyết định và lệnh kiểm không phụ thuộc thư viện, nên đi theo sang
   mọi kho. Mã linh kiện thuộc thư viện của từng kho, nên ở lại đó.
2. **Một hợp đồng trong mỗi kho.** Mọi thứ về design của một kho nằm trong một bộ sổ dưới
   `design/`, mỗi khái niệm một sổ, một hình dạng. Ai cần biết về design của kho thì đọc bộ sổ đó,
   không đọc mã.
3. **Một chủ, nhiều người đọc.** Chỉ design-assembly viết bộ sổ (và người, ở những dòng là quyết
   định của người). Repo Standards, delivery-loop và tác tử dựng màn chỉ đọc.
4. **Lõi không biết tên thư viện.** Mọi thứ gắn với một nền dựng, một cách viết giá trị, một thư
   viện linh kiện hay một ngôn ngữ nằm trong bộ chuyển. Thêm một loại kho là thêm bộ chuyển, không
   sửa lõi.
5. **Xoá nhiều hơn thêm.** Thước đo của lớp meta là số công cụ viết tay và số hình dạng trùng nó
   làm biến mất, không phải số thứ nó thêm vào.

### Bốn tầng

| Tầng                | Nằm ở đâu                        | Giữ gì                                                                                                                             |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Chuẩn chung         | trong plugin                     | danh mục quyết định chuẩn, từ vựng, hình dạng của từng sổ, lệnh kiểm trung lập, các đường audit, dẫn dắt, nhận, nhập kho, bàn giao |
| Lõi của họ sản phẩm | một kho nhỏ riêng của chủ kho    | các câu đã trả lời một lần cho cả họ (màu, chữ, cách mở hồ sơ...), và registry các khối đã được nâng hạng                          |
| Hợp đồng của kho    | `design/` của từng kho           | bộ sổ của kho đó: phần thừa hưởng từ lõi của họ, phần riêng, và ngoại lệ có lý do                                                  |
| Bộ chuyển           | trong plugin, chọn theo từng kho | cách mở màn, cách đọc giá trị, cách đọc linh kiện, cách đọc mã nguồn của loại kho đó                                               |

Lõi của họ sản phẩm không nằm trong plugin: plugin không nêu tên sản phẩm nào. Nó gồm hai thứ, đúng
như nghĩa của từ distribution trong bảng từ vựng: **một hồ sơ quyết định** mà bản thiết kế của kho
khai là thừa hưởng, và **một registry mã** (cùng kiểu registry mà shadcn và ReUI dùng) cho các khối
đã nâng hạng. Nâng hạng là quyết định của người: một khối đã vào kho ở hai kho thì máy đề xuất,
chủ kho duyệt.

### Bộ sổ của hợp đồng

| Sổ           | Trả lời câu gì                                           | Hôm nay                          |
| ------------ | -------------------------------------------------------- | -------------------------------- |
| Quyết định   | kho đã quyết gì, cái gì giữ từng điều                    | có, một hình dạng                |
| Bản thiết kế | người đã trả lời gì, thừa hưởng từ đâu                   | có; chưa có «thừa hưởng»         |
| Token        | giá trị nào tồn tại                                      | có                               |
| Linh kiện    | linh kiện và khối nào tồn tại, từ nguồn nào              | ba hình dạng, cần gộp            |
| Nhập kho     | nhu cầu nào đã có lời giải, ai duyệt, từ đâu ra          | chỉ Inventory có                 |
| Nguồn ngoài  | thư viện nào được chọn từ, theo thứ tự nào, ghim bản nào | chỉ Inventory có, riêng cho ReUI |
| Màn          | màn nào tồn tại, thuộc kiểu nào, có trạng thái nào       | hai hình dạng, cần gộp           |
| Kiểu màn     | mỗi kiểu màn dựng như thế nào                            | có, một hình dạng (của kit)      |
| Lời          | từ nào không được đổi, chữ lấy từ đâu                    | có                               |
| Lỗi lọt      | cái gì đã lọt qua mọi lệnh kiểm                          | có                               |

Hai sổ «linh kiện» và «nhập kho» giữ riêng: sổ linh kiện do máy sinh từ mã, sổ nhập kho là dòng
người duyệt. Một nhu cầu, một lời giải; thứ tạo ra trong vòng đang làm không tự tính là đã ở trong
kho. Hai luật đó lấy nguyên từ quyết định 0023 của Inventory.

### Bộ chuyển

| Loại bộ chuyển  | Việc của nó                                                  | Có hôm nay              | Cần cho Inventory                 |
| --------------- | ------------------------------------------------------------ | ----------------------- | --------------------------------- |
| Nền dựng        | mở một màn của kho trong trình duyệt                         | Vite                    | Next.js; và «lệnh riêng» chung    |
| Giá trị         | đọc và ghi giá trị thiết kế                                  | biến CSS của Tailwind 4 | cùng loại; thêm `color-mix()`     |
| Nguồn linh kiện | biết thư mục nào là của nhà cung cấp, danh mục nào để chọn   | thư mục của sàn shadcn  | ReUI qua registry, kho khối riêng |
| Mã nguồn        | đọc màn và linh kiện để kiểm chữ, trạng thái, điều khiển thô | React (TSX)             | cùng loại                         |

Phép đo trong trình duyệt không cần bộ chuyển mã nguồn: nó đo qua vai trò, vùng và dấu chung của
trang. Để phép đo đi theo được, mỗi phần của kho khai nó đáp luật nào, bằng một dấu chung thay vì
tên linh kiện của sàn.

### Phạm vi kho: một kiến trúc, ba mức phục vụ

Giải được cả ba phạm vi, với điều kiện coi chúng là ba mức của cùng một kiến trúc chứ không phải ba
sản phẩm. Mức của một kho do số bộ chuyển nó có quyết định, và tỉ lệ máy giữ cho thấy mức đó.

| Mức       | Kho                                                                   | Nhận được                                                                                                       | Giá                                          |
| --------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Trọn      | kho trống trên sàn của Repo Standards                                 | dẫn dắt, cài phần, mọi lệnh kiểm, bảng mẫu, cuốn sổ                                                             | đã có                                        |
| Đồng hành | họ kho của chủ kho: React, Tailwind, shadcn hoặc ReUI, Vite hoặc Next | audit, nhận, bộ sổ, phép đo trình duyệt, nhập kho, chọn bằng mắt, cuốn sổ; không cài phần nào                   | bốn bộ chuyển ở bảng trên                    |
| Chỉ luật  | kho web bất kỳ                                                        | audit, sổ quyết định, phép đo trình duyệt, các câu là quyết định của người; audit nói rõ câu nào chưa có gì giữ | gần như không: là phần giao của hai mức trên |

Phần đắt là bộ chuyển mã nguồn cho từng ngôn ngữ (Vue, Svelte): chỉ làm khi có một kho thật cần.
Mức «chỉ luật» không cần được tối ưu: nó tự có khi lõi thật sự không biết tên thư viện. Thứ tự đề
xuất: làm mức «đồng hành» trên Inventory, vì đó là nơi buộc lõi phải tách khỏi sàn.

### Ai làm gì, khi nào

| Lúc                               | Ai khởi                        | Design-assembly làm                                                             |
| --------------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| Kho ra đời                        | Repo Standards đặt kho rồi gọi | dẫn dắt: hỏi, sinh, cài, ghi bộ sổ                                              |
| Kho đã có lần đầu gặp plugin      | người                          | audit rồi nhận: ghi bộ sổ quanh cái đang có, không đổi gì                       |
| Một tính năng cần thứ kho chưa có | cổng phạm vi của delivery-loop | nhập kho: tra kho, tra nguồn ngoài, bày ứng viên bằng ảnh, ghi dòng người duyệt |
| Mỗi thay đổi                      | cổng kiểm của kho              | chạy lệnh kiểm; sinh lại các sổ do máy sinh                                     |
| Định kỳ, và trước khi bàn giao    | người                          | audit, cuốn sổ, đề xuất nâng hạng lên lõi của họ                                |

Delivery-loop vẫn chấm từng tính năng và vẫn là nơi chủ kho bấm duyệt. Nó không còn tự sinh hay tự
suy thứ gì về design: việc «bày ba cách chọn khối» nó đang lên kế hoạch là cơ chế nhập kho của
design-assembly, hiện ra trên thẻ cổng của nó.

### Những gì chuyển chỗ

| Từ             | Thứ                                                                  | Đề xuất                                                                          |
| -------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Repo Standards | sàn design: bài kiểm sàn, bộ rào, màn mẫu, trang hành vi, trang luật | thành «bộ chuyển sàn» của design-assembly; Repo Standards chỉ còn một lời gọi    |
| Repo Standards | câu hỏi màu thương hiệu và loại bề mặt                               | bỏ: đã trùng với tầng context và foundations                                     |
| Delivery-loop  | bộ sinh trang kiểu màn; thang M0 tới M3                              | bộ sinh chuyển về; thang đọc kết quả audit thay vì tự đo                         |
| Delivery-loop  | kế hoạch bày ba cách chọn khối và tự ghi danh mục                    | dùng cơ chế nhập kho của design-assembly                                         |
| Inventory      | sổ quyết định, sổ linh kiện, kiểu hiển thị của trường                | đã có bản tương đương; gộp hình dạng rồi bỏ bản viết tay                         |
| Inventory      | danh mục ReUI, sổ khối, phần thang dùng lại của cổng chứng minh màn  | tổng quát hoá thành sổ nguồn ngoài và sổ nhập kho                                |
| Inventory      | bộ bài kiểm trình duyệt sinh từ sổ màn, kèm ca phá                   | gộp với bài kiểm trang của design-assembly                                       |
| Inventory      | 12 luật lint tự viết                                                 | thành gói lint của bộ chuyển React; luật nào riêng của Inventory thì ở lại       |
| Inventory      | ma trận vai × màn, bộ nút theo vai                                   | không phải design system: thuộc delivery-loop, như quyết định 0017 của nó đã ghi |
| Inventory      | phần chứng minh một màn bằng ảnh theo từng vòng                      | thuộc delivery-loop (bằng chứng của một tính năng); nó đọc bộ sổ                 |

Design-assembly không tự sửa ba kho kia. Mỗi dòng ở bảng này là một thay đổi ở kho khác, chủ kho
quyết và cho phép từng cái.

## Acceptance criteria

Tầm nhìn đạt khi, theo thứ tự:

1. Mỗi sổ của hợp đồng có đúng một hình dạng, viết thành tài liệu, và cả ba bên đọc được hình dạng
   đó. Hôm nay sổ linh kiện có ba, sổ màn có hai.
2. Ở Inventory, không cài phần nào của sàn, số câu lõi «máy giữ và chạy lại» lớn hơn 0 và tăng qua
   từng lát; hôm nay là 0 trên 24 câu đã đáp.
3. Bảng mẫu và cuốn sổ vẽ được trên Inventory.
4. Một khối mới vào Inventory qua đường nhập kho của plugin, từ nhu cầu tới dòng sổ, không dùng công
   cụ viết tay nào của Inventory.
5. Số công cụ design viết tay của Inventory giảm, đếm được: mỗi công cụ ở bảng «Những gì chuyển
   chỗ» hoặc bị thay, hoặc được ghi rõ là ở lại và vì sao.
6. Một kho thứ hai cùng họ thừa hưởng lõi của họ: không hỏi lại câu đã trả lời, và dùng lại ít nhất
   một khối đã nâng hạng.
7. Lõi không chứa tên thư viện hay nền dựng nào ngoài thư mục bộ chuyển; có bài kiểm cho điều đó.

## Domain impact

Không đổi mô hình dữ liệu của kho này. Hai sổ mới (nhập kho, nguồn ngoài) là tệp dưới `design/`,
không phải thực thể của ontology. Bảng từ vựng cần thêm tên ngành cho sổ nhập kho và sổ nguồn
ngoài trước khi cuộc dẫn dắt dùng tới.

## Plan

Thay cho chặng 4 tới 6 của lộ trình đã tạm duyệt; chặng 1 tới 3 (khoá phạm vi, màn thứ hai và
khung, thử lần bảy) giữ nguyên và đi trước.

1. **Hợp đồng.** Viết hình dạng của từng sổ thành tài liệu. Phân xử ba hình dạng sổ linh kiện và hai
   hình dạng sổ màn. Tách mọi tên thư viện trong plugin vào bộ chuyển.
2. **Đồng hành với Inventory.** Bộ chuyển Next.js cho bảng mẫu và cuốn sổ; phép đo trình duyệt qua
   dấu chung; nhận thật trên một nhánh riêng. Rồi rút từng công cụ của Inventory theo bảng «Những gì
   chuyển chỗ», bắt đầu từ sổ nguồn ngoài và sổ nhập kho.
3. **Hai kho bên cạnh chuyển sang gọi và đọc.** Repo Standards gọi design-assembly cho tầng design;
   delivery-loop đọc bộ sổ và dùng cơ chế nhập kho ở cổng phạm vi.
4. **Lõi của họ sản phẩm.** Hồ sơ quyết định dùng chung và registry khối nâng hạng; chứng minh trên
   một kho thứ hai.

## Test plan

- Mỗi hình dạng sổ có bài kiểm đọc được cả tệp của kho này lẫn tệp của Inventory.
- Bài kiểm tên thư viện: lõi không chứa tên nào trong danh sách tên của các bộ chuyển.
- Mỗi lát trên Inventory chạy trên bản sao trước, rồi mới trên một nhánh riêng của kho thật.
- Mỗi công cụ viết tay bị thay phải có một lần chạy song song cho ra cùng kết quả trước khi bỏ.
- Chạy thử độc lập như sáu lần trước, thêm một tác tử làm việc trên bản sao Inventory.

## Autonomy tier

Máy tự làm trong kho này sau khi chủ kho duyệt từng bước của Plan. Mọi thay đổi ở Repo Standards,
delivery-loop và Inventory cần chủ kho cho phép riêng, từng kho một. Tạo kho cho lõi của họ sản
phẩm và mọi việc đẩy lên GitHub là việc của chủ kho.

## Open questions

- Lõi của họ sản phẩm nằm ở kho nào, và registry mã của nó phát bằng gì.
- Hình dạng nào thắng cho sổ linh kiện: của kit (để kit đọc không cần đổi), hay một hình dạng mới
  mà kit có bản xuất.
- Trang kiểu màn và chứng minh màn của Inventory dùng khoá và tiêu đề tiếng Việt; plugin chỉ viết
  tiếng Anh. Giữ khoá tiếng Việt như một hình dạng được nhận, hay đổi.
- Thang M0 tới M3 của kit và sáu bậc của design-assembly đo gần cùng một thứ. Gộp thành một, hay để
  thang của kit đọc bậc của design-assembly.
- Phần chứng minh màn bằng ảnh theo từng vòng: đề xuất ở đây là thuộc delivery-loop, nhưng nó đọc
  nhiều sổ design nhất. Chủ kho phân xử.
- Kho không dùng Makefile thì cổng kiểm gắn vào đâu.
- Ai giữ phiên bản: một kho dùng plugin bản cũ và lõi của họ bản mới thì bên nào thắng.
