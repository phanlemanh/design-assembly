---
type: spec
title: Design-assembly là lớp meta tạo và giữ design system cho nhiều kho
status: draft
tier: 1
links:
  - wiki/decisions/0023-nine-answers-for-the-meta-layer.md
  - wiki/specs/0001-design-system-for-claude-code.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/decisions/0006-one-ledger-one-layer-list.md
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/decisions/0029-the-contract-one-shape-per-ledger.md
  - wiki/decisions/0030-one-ledger-of-screens.md
  - wiki/decisions/0031-adapters-hold-library-names.md
  - wiki/decisions/0032-review-after-stage-two-and-stage-three-recut.md
  - wiki/decisions/0022-record-beside-a-list.md
  - wiki/decisions/0039-plan-recut-by-rhythm-and-tier.md
sources:
  - "chủ kho, 2026-11-13: tầm nhìn và ba câu trả lời làm rõ"
  - docs/architecture/meta-layer.html
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

Mục Plan viết lại ngày 2026-11-15 theo quyết định
[0039](../decisions/0039-plan-recut-by-rhythm-and-tier.md): xếp theo nhịp của vòng đời một repo và
mức phục vụ, thay cho xếp theo repo. Bản viết lại cũng là đề xuất của máy, chờ chủ kho duyệt.

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

Câu thứ tư, «mọi kho rộng tới đâu», chủ kho hỏi lại: có giải được cả ba phạm vi không. Phân tích ở tài liệu kiến trúc, mục «Bộ chuyển, và ba mức phục vụ».

### Kiến trúc

Kiến trúc đầy đủ, kèm sáu sơ đồ, nằm ở `docs/architecture/meta-layer.html`: vấn đề phân mảnh đo trên
ba kho, nguyên lý gốc (dòng sổ quyết định), năm nguyên tắc, ba lớp lời đáp và lựa chọn lúc đặt kho,
bộ sổ của hợp đồng, bộ chuyển và ba mức phục vụ, vai của người và Claude Code, ranh giới ba plugin
và những gì chuyển chỗ, vòng đời một repo và đường nhập kho, kho dùng lại nhiều tầng và bánh đà
tái dùng, họ hàng với kho tri thức, lộ trình, và cách đo hiệu quả.
Trang này chỉ giữ tầm nhìn, tiêu chí, kế hoạch và câu còn mở; hai nơi không chép lẫn nhau.

Tóm tắt: một kho có một hợp đồng design, là một bộ sổ mà chỉ design-assembly ghi; Repo Standards
gọi nó, delivery-loop và tác tử dựng màn đọc nó. Lời đáp của kho đến từ ba lớp: phần riêng của kho,
lõi chung của họ sản phẩm, đề xuất của chuẩn. Thứ gì gắn với một loại kho cụ thể nằm trong bộ
chuyển. Luật đi theo sang mọi kho; mã linh kiện ở lại với thư viện của từng kho.

Từ ngày 2026-11-13, tài liệu kiến trúc theo cách gọi của chủ kho: «repo» là kho mã, «kho» là nơi
chứa thứ dùng lại. Trang này và các trang wiki viết trước đó còn dùng «kho» cho repo.

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

Viết lại ngày 2026-11-15 (0039). Bản trước xếp việc theo repo: kho này, rồi Inventory, rồi hai kho
bên cạnh, rồi lõi của họ. Plugin phục vụ mọi repo ở mọi nhịp của vòng đời, nên kế hoạch xếp theo
hai trục của tài liệu kiến trúc: **năm nhịp** (mục «Vòng đời của một repo») và **ba mức phục vụ**
(mục «Bộ chuyển, và ba mức phục vụ»). Inventory là một repo kiểm chứng của mức «Đồng hành», không
phải trục của kế hoạch.

### Đã xong

- **Hợp đồng** (0029 đến 0031): mười một sổ, mỗi sổ một hình dạng; cổng giữ hình dạng; tên thư viện
  nằm trong bộ chuyển, có bài kiểm.
- **Ba lát trên Inventory** (0032 đến 0036), đã gộp vào `main` của Inventory qua ba PR có hồ sơ
  nghiệm thu chủ kho ký (#58, #59, #67): nhận, chạy lại lint của repo, sổ linh kiện do plugin ghi.
- **Sổ màn nối với mô hình nghiệp vụ** (0037, đề bài 0003), phần của kho này theo trang ranh giới ba
  kho.

### Hiện trạng theo nhịp, đo ngày 2026-11-15

| Nhịp                           | Plugin có gì                                  | Đã chứng minh ở đâu                                                                              | Còn thiếu                                                            |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Repo ra đời                    | Skill dẫn dắt (`new`)                         | Chín lượt thử độc lập, đều trên bản sao của kho này; phủ 36/38 quyết định                        | Repo Standards chưa gọi; mới một nền dựng                            |
| Repo đã có gặp plugin          | Skill `audit` và `adopt`                      | Lượt thử trên bản sao của kho này; một repo thật: Inventory, 10 câu lõi và 17 quyết định máy giữ | Đường nhận lại khi plugin có bản mới; repo thật thứ hai              |
| Tính năng cần khối mới         | Một dòng tên sổ «nhập kho», chưa có hình dạng | Chưa ở đâu                                                                                       | Cả nhịp: sổ nhập kho, sổ nguồn ngoài, skill                          |
| Mỗi thay đổi                   | Lệnh kiểm trong cổng; sinh lại sổ do máy sinh | Cổng của kho này (37 quyết định, 43 lệnh kiểm) và của Inventory (17, 20)                         | Bài kiểm trình duyệt theo vai; 17 giới hạn mức nặng                  |
| Định kỳ, và trước khi bàn giao | Skill `audit` và `handoff` (cuốn sổ)          | Kho này                                                                                          | Cuốn sổ và bảng mẫu chỉ vẽ được trên Vite; chưa có đề xuất nâng hạng |

Ba điều nằm ngang mọi nhịp:

- **Phát hành.** Plugin đóng gói được (tệp marketplace ở gốc kho, bốn skill gọi script qua thư mục
  gốc của plugin), bản 0.0.1 chưa từng tăng. Chưa repo nào cài nó: mọi lần chạy tới nay là lệnh gọi
  từ kho này nhắm vào repo đích. Repo đã nhận giữ một bản chép công cụ và không tự lên đời; hai lần
  đưa bản sửa sang Inventory đều phải chép tay kèm một hồ sơ nghiệm thu.
- **Chứng cứ độc lập.** Mười lượt thử đều chạy trên bản sao của kho này, lượt cuối ngày 2026-11-13;
  từ đó `main` thêm 35 commit. Ở Inventory, người làm là chính phiên đã dựng plugin.
- **Mức phục vụ.** «Trọn»: có, trên một nền dựng. «Đồng hành»: một phần, mỗi loại bộ chuyển mới có
  một bản (Vite, biến CSS của Tailwind, shadcn, React, Playwright, ESLint). «Chỉ luật»: chưa thử lần
  nào trên repo ngoài họ.

Hai kho bên cạnh: trang ranh giới ba kho ở Repo Standards đã chốt vai (2026-11-14), nhưng Repo
Standards chưa gọi plugin ở đâu trong mã; kit nghiệm thu mới đọc hai trong mười một sổ (sổ token và
sổ linh kiện).

### Các đợt, theo thứ tự

Mỗi đợt nêu nó làm ô nào của bảng trên nhúc nhích, xong khi nào, và cần gì ở chủ kho. Đợt sau không
bắt đầu khi đợt trước chưa có số đo.

**Đợt 0. Sửa thước và dọn hàng chờ.** Máy làm trong kho này.

- Lệnh đo thang đo tại chỗ trên repo đã nhận, thay cho diễn lại việc nhận; thêm cách đọc theo nhịp.
  Hôm nay nó in đúng hàng đầu rồi sập trên Inventory đã nhận.
- Một tờ quyết định cho 26 dòng ở `docs/review-queue.md`, gồm cả bản kế hoạch này (dòng B6): mỗi
  dòng một khuyến nghị và căn cứ, chủ kho trả lời một lần.
- Xong khi: `make design-ladder` chạy trọn trên Inventory ở `main`; hàng chờ có lời đáp.

**Đợt 1. Cài được và lên đời được.** Ngang mọi nhịp; máy làm trong kho này.

- Cài plugin qua marketplace vào một repo bỏ đi, rồi đi cả bốn skill bằng đường của plugin, không
  gọi lệnh nào của kho này.
- Lệnh «nhận lại»: chép công cụ của bản plugin đang cài vào repo, ghi vào repo số bản và mã cây git
  của thư mục công cụ; `audit` nói ra khi thư mục lệch bản đã ghi. Có đưa phép kiểm ấy vào cổng của
  repo hay không là lựa chọn của từng repo.
- Số bản của plugin tăng theo mỗi thay đổi đi tới repo.
- Xong khi: trên repo bỏ đi, audit rồi nhận rồi nhận lại sau một bản sửa đều chạy qua plugin đã
  cài; dòng giới hạn `adopt-does-not-refresh-tool` và `plugin-never-installed` đóng.

**Đợt 2. Đo độ rộng.** Chạy song song với đợt 1 được; chỉ đọc, không ghi vào repo nào.

- Chạy audit và xem trước việc nhận trên ít nhất một repo web ngoài họ (mức «Chỉ luật») và một repo
  cùng họ không phải Inventory (mức «Đồng hành»).
- Ghi số cho từng repo: bao nhiêu câu lõi đọc được, chỗ nào plugin sập hay nói sai. Mỗi chỗ thành
  một dòng sổ giới hạn, không sửa ngay.
- Xong khi: có bảng số của ba mức trên ba repo, và không lần chạy nào sập.
- Cần chủ kho: chỉ định repo, và cho phép đọc.

**Đợt 3. Nhịp nhập kho.** Nhịp duy nhất còn trống.

- Hình dạng của sổ nhập kho và sổ nguồn ngoài vào hợp đồng; tên ngành của hai sổ vào bảng từ vựng.
- Skill nhập kho theo thang ba bậc của tài liệu kiến trúc: tra kho, tra nguồn ngoài (bày ứng viên
  bằng ảnh), tạo tay; kết quả là một dòng sổ.
- Chứng minh trên ứng dụng mẫu của kho này trước, rồi trên một repo thật.
- Xong khi: một khối mới vào ứng dụng mẫu qua skill; lần thứ hai gặp cùng nhu cầu là bậc một, không
  gọi người.
- Cần chủ kho: cho phép áp vào repo thật; ở Inventory là thay danh mục và sổ khối viết tay.

**Đợt 4. Bộ chuyển thứ hai cho loại nào repo thật cần.**

- Nền dựng Next.js, để bảng mẫu và cuốn sổ vẽ được ngoài Vite; nguồn linh kiện thứ hai (ReUI hoặc
  kho khối riêng).
- Xong khi: bảng mẫu và cuốn sổ vẽ được trên một repo Next; lõi không đổi dòng nào ngoài thư mục bộ
  chuyển.

**Đợt 5. Nhịp «mỗi thay đổi» theo trang ranh giới ba kho.**

- Bài kiểm trình duyệt theo vai: vai không có quyền thì không thấy nút (dòng giới hạn mức nặng
  `screen-actions-runtime-hiding-unchecked`).
- Các giới hạn mức nặng khác chỉ sửa khi một repo thật đụng tới, như đề xuất B5 của hàng chờ.

**Đợt 6. Hai kho bên cạnh gọi và đọc.** Sau đợt 1 và 3, và sau khi kiến trúc được duyệt (B1).

- Repo Standards gọi skill dẫn dắt sau khi đặt nền, và skill nhận ở repo đã có.
- Kit nghiệm thu đọc sổ màn và bảng trạng thái thay cho khai lại trong bản đặc tả của mỗi tính năng
  (chỗ lệch thứ nhất của trang ranh giới); cổng phạm vi dùng đường nhập kho.
- Cần chủ kho: cho phép sửa ở từng kho.

**Đợt 7. Lõi của họ sản phẩm.** Sau khi kiến trúc được duyệt.

- Hồ sơ quyết định dùng chung, registry khối đã nâng hạng, và đề xuất nâng hạng ở nhịp định kỳ.
- Xong khi: một repo thứ hai cùng họ không bị hỏi lại câu đã trả lời, và dùng lại ít nhất một khối.
- Cần chủ kho: tạo repo cho lõi.

### Mỗi đợt đẩy tiêu chí nào

| Tiêu chí (mục Acceptance criteria)        | Hôm nay                                      | Đợt đẩy tiếp   |
| ----------------------------------------- | -------------------------------------------- | -------------- |
| 1. Mỗi sổ một hình dạng                   | Đạt: 7/7 sổ ở Inventory, 11/11 ở kho này     | 3 (hai sổ mới) |
| 2. Câu lõi máy giữ ở repo đã có           | Đạt và còn tăng được: 10 câu lõi ở Inventory | 1, 5           |
| 3. Bảng mẫu và cuốn sổ ngoài nền dựng đầu | Chưa                                         | 4              |
| 4. Khối mới qua đường nhập kho            | Chưa                                         | 3              |
| 5. Công cụ viết tay giảm                  | Một phần: thay một công cụ ở Inventory       | 3, 4           |
| 6. Repo thứ hai thừa hưởng lõi            | Chưa                                         | 7              |
| 7. Lõi không nêu tên thư viện             | Đạt, có bài kiểm                             | 2, 4 (giữ)     |

### Luật đi kèm mọi đợt

- Thay đổi ở repo khác đi trên nhánh riêng, theo cổng của repo đó; ở Inventory là một hồ sơ nghiệm
  thu có chữ ký. Đợt 1 làm việc ấy rẻ hơn, không bỏ nó.
- Sau mỗi đợt, một lượt thử độc lập cho phần vừa dựng. Lượt thử tốn token, nên cần chủ kho cho chạy.
- Số đo hiện trạng ở trên được đo lại sau mỗi đợt bằng lệnh, không bằng trí nhớ.

## Test plan

- Mỗi hình dạng sổ có bài kiểm đọc được cả tệp của kho này lẫn tệp của Inventory.
- Bài kiểm tên thư viện: lõi không chứa tên nào trong danh sách tên của các bộ chuyển.
- Mỗi lát trên Inventory chạy trên bản sao trước, rồi mới trên một nhánh riêng của kho thật.
- Mỗi công cụ viết tay bị thay phải có một lần chạy song song cho ra cùng kết quả trước khi bỏ.
- Chạy thử độc lập như sáu lần trước, thêm một tác tử làm việc trên bản sao Inventory.
- Đợt 1: một repo bỏ đi cài plugin qua marketplace; bài kiểm cho lệnh nhận lại thấy `audit` nói ra khi
  thư mục công cụ lệch bản đã ghi.
- Đợt 2: mỗi repo được đo có một dòng số, sinh bằng lệnh; lần chạy sập là một dòng sổ giới hạn.
- Đợt 3: bài kiểm hình dạng cho hai sổ mới; một lượt thử độc lập với vai «nhập kho».
- Lệnh đo thang chạy được trên repo đã nhận, và có bài kiểm cho điều đó.

## Autonomy tier

Máy tự làm trong kho này sau khi chủ kho duyệt từng bước của Plan. Mọi thay đổi ở Repo Standards,
delivery-loop và Inventory cần chủ kho cho phép riêng, từng kho một. Tạo kho cho lõi của họ sản
phẩm và mọi việc đẩy lên GitHub là việc của chủ kho.

## Open questions

Chín câu từng còn mở đã được chủ kho chốt ngày 2026-11-13: xem
[0023](../decisions/0023-nine-answers-for-the-meta-layer.md) và mục «Chín câu đã chốt» của tài liệu kiến trúc.

Còn mở:

- Bản kế hoạch viết lại ngày 2026-11-15 (0039) chưa được duyệt.
- Tiêu chí 2 đến 5 nêu tên Inventory. Kế hoạch mới coi Inventory là một repo kiểm chứng: giữ chữ của
  tiêu chí, hay viết lại thành «một repo đã có»? Bảng «Mỗi đợt đẩy tiêu chí nào» tạm đọc theo nghĩa
  rộng.
- Đợt 2 đo trên repo nào ngoài họ và repo nào cùng họ.
- Kiến trúc tổng thể chưa được duyệt: chủ kho mới chốt ba điều ở mục Intent và chín câu ở 0023.
- Với từng lời đáp cụ thể của lõi, xếp vào khoá hay mặc định: chủ kho quyết lúc lõi ra đời.
- Ba việc ở kho khác chờ chủ kho làm hoặc cho phép: thang của delivery-loop đọc kết quả audit,
  delivery-loop nhận phần chứng minh màn, và tạo kho cho lõi của họ.
