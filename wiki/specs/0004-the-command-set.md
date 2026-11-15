---
type: spec
title: Bộ lệnh của design-assembly, theo việc người dùng cần xong
status: needs-approval
tier: 1
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/decisions/0039-plan-recut-by-rhythm-and-tier.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/decisions/0029-the-contract-one-shape-per-ledger.md
sources:
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/skills/audit/SKILL.md
  - plugins/design-assembly/skills/handoff/SKILL.md
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/README.md
  - docs/architecture/meta-layer.html
  - docs/trials/README.md
  - "chủ repo, 2026-11-15: «Dựa vào hành vi và jtbd của người dùng phân tích và đề xuất các tập lệnh»; «kiểm kê kho, các thành phần trong kho»; «Viết bộ lệnh này thành đề bài để tôi duyệt, làm rõ input/output»"
---

# 0004 Bộ lệnh của design-assembly, theo việc người dùng cần xong

Máy viết ngày 2026-11-15 theo lời chủ repo cùng ngày. Chờ chủ repo duyệt. Chưa lệnh mới nào được
dựng; đề bài này chỉ chốt lệnh nào tồn tại, nó nhận gì và trả gì.

## Intent

Plugin có bốn lệnh: `new`, `adopt`, `audit`, `handoff`. Cả bốn phục vụ lúc một repo mới gặp plugin.
Việc người dùng làm lặp lại hằng ngày thì chưa có lệnh: biết đang ở đâu, tra kho trước khi dựng,
nhận bản mới của plugin, đưa một khối mới vào, đổi hay bỏ một thứ đã có.

### Ba người dùng và việc họ cần xong

| Người dùng      | Việc cần xong                                                 | Hành vi quan sát được                                                            | Lệnh hôm nay                |
| --------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------- |
| Chủ repo        | Biết đang ở đâu và việc gì chờ mình                           | Hỏi tiến độ nhiều lần mỗi phiên; 26 dòng chờ duyệt nằm trong một tệp không ai mở | Chưa có                     |
| Chủ repo        | Quyết một lần cho xong, bằng mắt khi là chuyện thẩm mỹ        | Trả lời một chạm; chọn màu bằng bảng mẫu                                         | Một phần, trong `new`       |
| Chủ repo        | Có design system cho repo mới, hoặc đưa plugin vào repo đã có | Chạy cuộc dẫn dắt; cho nhận trên nhánh riêng                                     | `new`, `audit`, `adopt`     |
| Chủ repo        | Nhận bản sửa của plugin                                       | Phải bảo chép tay công cụ; lần gần nhất sổ mất dữ liệu mà không ai báo trước     | Chưa có                     |
| Chủ repo        | Biết kho có gì và còn đáng tin không                          | Sổ ghi trùng chín linh kiện chỉ lộ ra nhờ lượt chấm nghiệm thu                   | Chưa có                     |
| Chủ repo        | Bàn giao cho người khác                                       | Cuốn sổ                                                                          | `handoff`                   |
| Tác tử dựng màn | Dựng một màn mà không phải đoán                               | Lượt thử đếm số chỗ tác tử tự đoán; đây là thước chính của plugin                | Chỉ có trang luật để tự đọc |
| Tác tử dựng màn | Biết đã có thứ nào cho nhu cầu này chưa                       | Tìm lâu hơn tự dựng thì tác tử tự dựng                                           | Chưa có                     |
| Tác tử dựng màn | Thiếu một khối thì lấy ở đâu, ghi lại thế nào                 | Ở repo đối chứng phải dùng công cụ viết tay                                      | Chưa có                     |
| Plugin bên cạnh | Gọi được không cần người, nhận kết quả máy đọc được           | Repo Standards chưa gọi được; kit nghiệm thu đọc tệp, không gọi lệnh             | Chỉ `audit` có `--json`     |

Tài liệu kiến trúc nêu ba điều kiện để tái dùng làm việc nhanh dần: thứ mới được ghi ngay lúc ra
đời, tra lại rẻ hơn làm mới, kho còn đáng tin. Bốn lệnh hôm nay không phủ điều kiện nào trọn vẹn.

### Mười hai lệnh, bốn nhóm

| Nhóm  | Lệnh                                   | Trả lời câu                          |
| ----- | -------------------------------------- | ------------------------------------ |
| Biết  | `status`, `audit`, `inventory`, `find` | Đang có gì, ở đâu, còn đúng không    |
| Quyết | `new`, `decide`                        | Chủ repo chọn gì                     |
| Đổi   | `adopt`, `upgrade`, `intake`, `change` | Thứ gì vào, lên đời, đổi, hay ra     |
| Giao  | `brief`, `handoff`                     | Người hay tác tử kế tiếp cần biết gì |

Lệnh máy chạy trong cổng của repo (kiểm, sinh lại sổ token, sổ linh kiện, bảng kiểu cột) giữ nguyên
là lệnh `make` của repo. Người không gõ chúng, nên chúng không thuộc bộ này.

### Hợp đồng chung của mọi lệnh

- **Đích.** Mọi lệnh nhận `--target DIR`, mặc định là thư mục đang đứng. Không lệnh nào ghi ra ngoài
  repo đích.
- **Hai kiểu gọi.** Đối thoại: người gõ lệnh của plugin, lệnh hỏi và bày. Không người: gọi script
  với `--json`, câu trả lời đưa vào bằng `--answers FILE`; để plugin khác gọi được.
- **Lệnh chỉ đọc không đổi gì.** `status`, `audit`, `inventory`, `find`, `brief`: sau khi chạy, cây
  của repo giống từng byte.
- **Lệnh ghi xem trước được.** `new`, `decide`, `adopt`, `upgrade`, `intake`, `change`, `handoff`
  có `--dry-run`, in đúng danh sách tệp sẽ ghi và điều sẽ đổi trong từng sổ.
- **Mã thoát.** 0: xong, không còn gì. 1: xong, và có việc cho người hoặc có chỗ cần sửa. 2: gọi sai,
  hoặc repo không đọc được.
- **Tất định.** Cùng một repo cho cùng một kết quả. Không lệnh nào gọi mô hình để ra kết quả.
- **Quyết định là của người.** Không lệnh nào tự ghi một lời đáp như thể người đã chọn. Điều máy đọc
  ra từ repo là đề xuất, cho tới khi người xác nhận qua `decide`.

### Đầu vào và đầu ra của từng lệnh

Mỗi lệnh ghi theo cùng sáu dòng. «Máy nhận» là các khoá của kết quả `--json`.

#### Nhóm Biết

**`status`** — mới. Chủ repo gọi bất cứ lúc nào.

- Đầu vào: `--target`, `--json`.
- Đọc: mọi sổ của hợp đồng, dấu bản công cụ của repo, bản plugin đang cài.
- Người nhận: một màn hình. Repo ở nấc nào; mỗi nhịp một dòng; danh sách việc chờ chủ repo, mỗi việc
  kèm khuyến nghị; bản công cụ có lệch plugin không; lệnh nên chạy kế.
- Máy nhận: `tier`, `held`, `claimed`, `waiting[]` (mã, câu hỏi, khuyến nghị, lệnh trả lời), `tool`
  (bản đã ghi, bản đang cài, có lệch không), `next[]`.
- Ghi: không.
- Mã thoát: 0 khi không gì chờ; 1 khi có việc chờ người hoặc công cụ lệch bản.

**`audit`** — có hôm nay. Thêm: mã thoát theo hợp đồng chung.

- Đầu vào: `--target`, `--all` (kê mọi quyết định lõi), `--json`.
- Đọc: sổ quyết định, stylesheet, mã màn và linh kiện, cấu hình lint, bài kiểm có gắn tên quyết định.
- Người nhận: từng quyết định chuẩn ở trạng thái nào (máy giữ, tự khai, đã ghi, không giữ, bị vòng
  qua, chưa có dòng); nấc đã đạt; nấc kế thiếu gì; những chỗ plugin mù.
- Máy nhận: `decisions[]` (mã, tầng, trạng thái, giữ bằng gì), `tier`, `missing[]`, `blind[]`.
- Ghi: không.
- Mã thoát: 0; 1 khi có quyết định «không giữ» hoặc «bị vòng qua».

**`inventory`** — mới. Kiểm kê kho. Chủ repo gọi định kỳ và trước khi bàn giao.

- Đầu vào: `--target`; `--store repo|starter|external|all`; `--kind answers|screen-kinds|components|behaviours`;
  `--strict`; `--json`.
- Đọc: sổ linh kiện, sổ màn, trang kiểu màn, sổ nhập kho, sổ nguồn ngoài, mã màn (để biết thứ nào
  đang được dùng).
- Người nhận: mỗi kho và mỗi loại tài sản có bao nhiêu thứ; rồi sáu loại phát hiện về sức khoẻ: thứ
  không màn nào dùng; thứ mã dùng mà sổ không ghi; hai thứ cùng giải một nhu cầu; thứ lấy từ nguồn
  ngoài đã lệch bản; thứ bị sửa khác nguồn mà không ghi lý do; thứ đã dùng ở hai nơi, đáng nâng hạng.
- Máy nhận: `stores[]` (kho, loại, số lượng), `items[]` (tên, loại, kho, tệp, nguồn và bản, màn đang
  dùng), `findings[]` (loại phát hiện, thứ liên quan, bằng chứng).
- Ghi: không.
- Mã thoát: 0; với `--strict`, 1 khi có phát hiện.

**`find`** — mới. Tra kho. Tác tử gọi trước khi dựng; cũng là bậc một của `intake`.

- Đầu vào: `--target`; một tên, hoặc một nhu cầu viết bằng chữ; `--kind`; `--limit N`; `--json`.
- Đọc: từ gần tới xa, gặp ở tầng nào dừng ở tầng đó: kho của repo, bộ khởi đầu của plugin, nguồn
  ngoài đã ghim.
- Người nhận: mỗi thứ khớp một khối: là gì, nhận thuộc tính và biến thể nào, màn nào đang dùng, lấy
  từ đâu và bản nào, màn mẫu để xem. Không khớp thì nói vậy và nêu lệnh kế (`intake`).
- Máy nhận: `matches[]` (tên, loại, kho, tệp, `props`, `variants`, `used_by[]`, `source`, `reference`),
  `searched[]` (các tầng đã tra).
- Ghi: không.
- Mã thoát: 0 khi có thứ khớp; 1 khi không.

#### Nhóm Quyết

**`new`** — có hôm nay. Dẫn dắt một repo chưa có giá trị thiết kế riêng.

- Đầu vào: `--target`; lời đáp qua đối thoại, hoặc `design/blueprint.json` đã duyệt; `--dry-run`;
  `--replace`.
- Đọc: stylesheet và màn của repo; danh sách quyết định chuẩn; các danh sách lựa chọn đóng.
- Người nhận: từng tầng một khuyến nghị; bảng mẫu vẽ trên chính màn của repo để chọn bằng mắt; bản
  xem trước giá trị và tệp sẽ đổi.
- Máy nhận: `blueprint` (từng tầng: đã quyết gì, ai quyết), `files[]` sẽ ghi.
- Ghi: giá trị vào stylesheet; dòng sổ quyết định; dữ liệu lệnh kiểm; sổ token; sổ linh kiện; trang
  luật cho tác tử; bước trong cổng của repo. Từ chối ghi đè giá trị repo đã có, trừ khi có `--replace`.
- Mã thoát: 0; 1 khi còn tầng chưa quyết; 2 khi bản thiết kế chưa được duyệt mà gọi ghi.

**`decide`** — mới. Gom mọi câu đang chờ chủ repo thành một tờ, trả lời một lần.

- Đầu vào: `--target`; `--only ID[,ID]`; lời đáp qua đối thoại, hoặc `--answers FILE` (mỗi dòng: mã
  câu, rồi «giữ», «bác», hay một giá trị); `--dry-run`.
- Đọc: dòng sổ đã ghi mà chưa ai xác nhận; ứng viên `intake` chờ chọn; đề xuất của `change` và
  `upgrade` cần người; chỗ lệch xin làm ngoại lệ.
- Người nhận: một tờ, mỗi câu một khuyến nghị và căn cứ; câu về thẩm mỹ kèm bảng mẫu; câu khó đảo
  được đánh dấu.
- Máy nhận: `questions[]` (mã, câu, khuyến nghị, căn cứ, khó đảo hay không), `answered[]`.
- Ghi: chỉ sau khi người trả lời. Dòng sổ quyết định mang tên người và ngày; ngoại lệ vào sổ ghi chỗ
  lệch có chủ ý, kèm lý do.
- Mã thoát: 0 khi mọi câu đã có lời đáp; 1 khi còn câu chờ.

#### Nhóm Đổi

**`adopt`** — có hôm nay. Nhận quanh cái repo đang có.

- Đầu vào: `--target`; `--dry-run`; `--conformance-level AA|AAA`; `--product-type`; `--record ID`;
  `--hold`.
- Đọc: stylesheet qua các tệp nó nhập; cấu hình lint; công cụ và bài kiểm repo đã có; sổ quyết định
  nếu có.
- Người nhận: dòng nào sẽ thêm và giữ bằng gì; dòng nào chỉ khai được; điều nào cần người đáp; điều
  nào đọc không ra.
- Máy nhận: `rows[]` (mã, cách giữ), `rerun[]`, `loose[]`, `person[]`, `files[]`.
- Ghi: dòng mới của sổ quyết định; dữ liệu lệnh kiểm; thư mục công cụ; sổ token; sổ linh kiện; trang
  luật; bước trong cổng. Không đổi giá trị, luật lint, bài kiểm, hay dòng sổ đã có.
- Mã thoát: 0; 1 khi còn điều cần người đáp.

**`upgrade`** — mới. Đưa bản mới của plugin vào repo đã nhận. Chiều ngược, `--remove`, gỡ plugin.

- Đầu vào: `--target`; `--dry-run`; `--remove`.
- Đọc: dấu bản công cụ của repo (số bản và mã cây git của thư mục công cụ); thư mục công cụ của bản
  plugin đang cài; các sổ do máy sinh.
- Người nhận: trước khi ghi, luôn in: tệp công cụ nào đổi; sổ nào sẽ sinh lại khác đi, khác ở mục
  nào; quyết định nào đổi trạng thái (ví dụ từ máy giữ về tự khai); cổng của repo sẽ xanh hay đỏ sau
  khi lên đời.
- Máy nhận: `from`, `to`, `tool_files[]`, `ledgers[]` (sổ, mục thêm, mục bớt, mục đổi), `decisions[]`
  đổi trạng thái, `gate` (xanh hay đỏ, vì sao).
- Ghi: thư mục công cụ; dấu bản; các sổ do máy sinh. Không đổi dòng sổ người đã ghi, stylesheet, hay
  công cụ riêng của repo.
- Mã thoát: 0 khi đã ở bản mới nhất hoặc lên đời xong; 1 khi lên đời sẽ làm cổng đỏ hoặc làm mất mục
  trong một sổ, và lệnh dừng chờ người.

**`intake`** — mới. Nhập kho: một nhu cầu mới thành một dòng sổ.

- Đầu vào: `--target`; nhu cầu viết bằng chữ; `--kind block|component|screen|behaviour`; `--choose N`;
  `--dry-run`.
- Đọc: kết quả của `find` qua mọi tầng; danh mục nguồn ngoài đã ghim.
- Người nhận: theo thang ba bậc. Đã có trong kho: dùng lại, không gọi người. Có ở nguồn ngoài: lần
  đầu của mỗi loại, hai tới ba ứng viên bằng ảnh để chọn. Không có: tạo tay, kèm lý do vì sao hai bậc
  trên không đáp ứng.
- Máy nhận: `rung` (bậc dừng lại), `candidates[]`, `chosen`, `row` (thứ gì, từ đâu và bản nào, cho nhu
  cầu gì, ai duyệt, ngày nào).
- Ghi: mã của khối, chép vào repo chứ không nối phụ thuộc; một dòng sổ nhập kho; sổ linh kiện hoặc sổ
  màn sinh lại.
- Mã thoát: 0 khi đã có dòng sổ; 1 khi chờ người chọn ứng viên.

**`change`** — mới. Đổi, cho nghỉ, hoặc gộp một thứ trong kho; kể cả đổi một quyết định đã chốt.

- Đầu vào: `--target`; tên một thứ hoặc mã một quyết định; một trong `--to GIÁ-TRỊ`, `--retire`,
  `--merge-into TÊN`, `--migrate` (đưa giá trị viết vòng qua hệ về đúng giá trị của hệ); `--dry-run`.
- Đọc: sổ linh kiện, sổ màn, sổ quyết định, mã màn dùng thứ đó.
- Người nhận: trước hết là tác động: màn nào, linh kiện nào, lệnh kiểm nào bị ảnh hưởng. Rồi điều sẽ
  đổi. Thay đổi cần người quyết thì thành một câu của `decide`.
- Máy nhận: `impact` (màn, linh kiện, lệnh kiểm), `edits[]`, `questions[]` gửi sang `decide`.
- Ghi: dòng sổ liên quan; mã ở chỗ đổi được bằng máy; dấu «cho nghỉ» trên thứ bị thay. Không xoá mã
  mà một màn còn dùng.
- Mã thoát: 0; 1 khi có câu chờ người.

#### Nhóm Giao

**`brief`** — mới. Mọi điều tác tử cần để dựng một màn, trong một lần đọc.

- Đầu vào: `--target`; mã một màn trong sổ màn, hoặc tên một màn sắp dựng kèm kiểu màn; `--json`.
- Đọc: sổ màn, trang kiểu màn và màn mẫu của nó, sổ linh kiện, bảng trạng thái, trang luật, phần nối
  với mô hình nghiệp vụ.
- Người nhận: kiểu màn và màn mẫu; linh kiện dùng được, với thuộc tính và biến thể; trạng thái màn
  phải có; luật áp vào màn, mỗi luật một dòng; thao tác và vai theo mô hình; lệnh kiểm sẽ chấm màn.
- Máy nhận: `screen`, `kind`, `reference`, `components[]`, `states[]`, `rules[]`, `actions[]`,
  `checks[]`.
- Ghi: không.
- Mã thoát: 0; 1 khi màn không thuộc kiểu nào đã khai.

**`handoff`** — có hôm nay. Cuốn sổ bàn giao.

- Đầu vào: `--target`; `--audience client|builder`; `--format html|pdf|png`; `--words FILE`;
  `--out DIR`; `--facts`.
- Đọc: mọi sổ; màn của repo, vẽ bằng chính nền dựng của repo.
- Người nhận: một cuốn sổ: màu theo vai kèm tỉ lệ tương phản, thang chữ, bo góc, khoảng cách, linh
  kiện và biến thể, từng kiểu màn.
- Máy nhận: với `--facts`, mọi dữ kiện cuốn sổ dùng, không vẽ.
- Ghi: chỉ vào `--out`. Hôm nay một đường dẫn tương đối bị đọc theo repo đích, nên cuốn sổ rơi vào
  trong repo; lỗi này phải sửa cùng lệnh.
- Mã thoát: 0; 2 khi repo không có nền dựng nào plugin vẽ được.

## Acceptance criteria

1. Mười hai lệnh tồn tại. Mỗi lệnh gọi được ở cả hai kiểu, và kiểu không người trả đúng các khoá ghi
   ở mục trên.
2. Năm lệnh chỉ đọc để cây của repo giống từng byte sau khi chạy.
3. Mỗi lệnh ghi, khi chạy với `--dry-run`, in đúng danh sách tệp mà lần chạy thật sẽ ghi.
4. Chạy hai lần trên cùng một repo cho cùng một kết quả, với mọi lệnh chỉ đọc.
5. `inventory` báo đủ sáu loại phát hiện trên một repo thử có cài sẵn mỗi loại một chỗ, và không báo
   gì trên repo lành.
6. `find` trả lời bằng một lần gọi, không gọi mô hình.
7. `upgrade`, trên một repo đang chạy bản công cụ cũ, nói trước sổ nào sẽ mất mục. Ca thử là lỗi thật
   đã gặp: bản sửa ghi trùng làm sổ linh kiện mất quan hệ «dựng từ».
8. `intake`: lần thứ hai gặp cùng một nhu cầu dừng ở bậc một, không gọi người.
9. `decide`: không dòng sổ nào mang tên người quyết khi chưa có lời đáp của người.
10. `brief`: một tác tử độc lập dựng một màn chỉ từ kết quả của lệnh; số chỗ nó phải đoán không nhiều
    hơn lượt thử gần nhất.
11. Mã thoát của mọi lệnh theo hợp đồng chung.
12. Không lệnh nào nêu tên thư viện hay nền dựng ngoài thư mục bộ chuyển, và không nêu tên repo sản
    phẩm nào.

## Domain impact

Không đổi mô hình dữ liệu của kho này. Hợp đồng sổ thêm:

- hình dạng của sổ nhập kho và sổ nguồn ngoài (hôm nay mới có tên);
- dấu bản công cụ của repo: số bản và mã cây git của thư mục công cụ;
- khoá «ai xác nhận, ngày nào» trên dòng sổ quyết định, để `decide` và `status` đọc cùng một chỗ.

Bảng từ vựng thêm tên ngành cho: kiểm kê kho, nhập kho, nguồn ngoài, cho nghỉ, lên đời.

## Plan

Theo các đợt của kế hoạch viết lại (0039). Mỗi lệnh ra đời cùng skill, script, bài kiểm, dòng trong
bảng từ vựng và mục trong tài liệu các lệnh kiểm.

| Đợt của 0039 | Lệnh                                                                  |
| ------------ | --------------------------------------------------------------------- |
| 0            | `status`; hợp đồng chung áp cho bốn lệnh đang có (`--json`, mã thoát) |
| 0            | `decide`, dùng ngay cho 26 dòng đang chờ                              |
| 1            | `upgrade`                                                             |
| 3            | `find`, rồi `intake`                                                  |
| ngay sau 3   | `inventory`, rồi `change`                                             |
| 5            | `brief`                                                               |

`handoff` và `new` chỉ đổi phần hợp đồng chung; nền dựng thứ hai cho chúng thuộc đợt 4 của 0039.

## Test plan

- Mỗi lệnh có bài kiểm trên một repo bỏ đi dựng trong thư mục tạm, như các bài kiểm hiện có của
  `adopt` và `apply`.
- Bài kiểm «cây không đổi» cho năm lệnh chỉ đọc: so băm của cây trước và sau.
- Bài kiểm «xem trước bằng làm thật»: danh sách tệp của `--dry-run` bằng danh sách tệp đổi sau lần
  chạy thật.
- `inventory`: repo thử có sáu chỗ cài sẵn; mỗi phát hiện có cặp hai chiều, thấy khi có và không thấy
  khi gỡ.
- `upgrade`: repo thử nhận bằng bản công cụ cũ lấy từ lịch sử git của kho này.
- Sau mỗi đợt, một lượt thử độc lập cho lệnh vừa dựng; lượt thử tốn token nên cần chủ repo cho chạy.

## Autonomy tier

Máy tự làm trong kho này sau khi chủ repo duyệt đề bài. Dựng từng lệnh theo thứ tự ở mục Plan; mỗi
lệnh một PR. Áp một lệnh vào repo khác cần chủ repo cho phép riêng.

## Open questions

Mỗi câu kèm lối máy khuyên.

- **Tên lệnh kiểm kê kho.** `inventory` là từ của ngành cho việc này, nhưng script của `audit` đang
  mang tên đó. Khuyên: lệnh tên `inventory`, đổi tên script của `audit` cho khớp tên lệnh.
- **Câu đang chờ nằm ở đâu.** Khuyên: là dòng của sổ quyết định ở trạng thái chưa xác nhận, không mở
  sổ mới; `status` và `decide` cùng đọc một chỗ.
- **`find` khớp nhu cầu thế nào khi lời viết khác nhau.** Khuyên: chỉ khớp chữ trên tên và trên nhu
  cầu đã ghi ở sổ nhập kho, để kết quả tất định; không gọi mô hình.
- **`upgrade` khi lên đời sẽ làm cổng đỏ hay làm sổ mất mục.** Khuyên: dừng, nói rõ, và chỉ ghi khi
  người bảo.
- **Mười hai lệnh có nhiều quá không.** Khuyên: giữ. `status` và `audit` trả lời hai câu khác nhau
  («tôi cần làm gì» và «repo đạt gì»); gộp lại thì cả hai đều dài.
- **Ngưỡng thời gian cho `find`.** Chưa có số đo; đặt sau khi dựng, từ lần đo đầu trên repo đối chứng.
