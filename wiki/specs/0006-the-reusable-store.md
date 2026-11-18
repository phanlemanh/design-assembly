---
type: spec
title: Kho dùng lại — sổ nguồn ngoài, và bốn lệnh tra kho, kiểm kê kho, nhập kho, đổi
status: approved
tier: 1
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0052-the-intake-ledger-joins-the-contract-one-file-per-block.md
  - wiki/decisions/0054-the-decision-ledger-stands-in-for-the-head-of-design.md
  - wiki/decisions/0053-a-command-says-which-screens-a-change-reaches.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0047-tool-stamp-upgrade-and-the-version-rule.md
sources:
  - docs/plan/plan.json
  - docs/architecture/meta-layer.html
  - plugins/design-assembly/templates/tools/design-assembly/intake-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/templates/tools/design-assembly/affected.mjs
  - plugins/design-assembly/scripts/command.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/vocabulary.json
  - docs/trials/breadth-on-two-repositories.md
  - "chủ repo, 2026-11-19: «Duyệt cả mười», đáp câu «Duyệt đề bài 0006 theo cả mười khuyến nghị?»"
  - "chủ repo, 2026-11-19: «Duyệt, mở PR»"
  - "repo kiểm chứng, nhánh chính tại 47d52b06, đọc ngày 2026-11-19, chỉ đọc: design/intake/, design/reui-catalog.json, tools/reui_catalog/, tools/proof_gate/check.py"
---

# 0006 Kho dùng lại — sổ nguồn ngoài, và bốn lệnh tra kho, kiểm kê kho, nhập kho, đổi

Máy viết ngày 2026-11-19, là đề bài chi tiết cho giai đoạn 3 của kế hoạch («Kho dùng lại»), như đề bài 0005 cho giai
đoạn 8. Chủ repo duyệt ngày 2026-11-19 và đáp cả mười câu hỏi theo khuyến nghị («Duyệt cả mười»), kể cả mục 3.0 mới của kế hoạch cho chính đề bài này (câu 1) và một mục để sang bên cho `change --to` và
`--migrate` (câu 8). Mọi điều về mã hiện có ở dưới đã được đọc lại trên `main` tại
`03e2a99`; điều về repo kiểm chứng đọc tại `47d52b06`, chỉ đọc.

## Intent

Giai đoạn 3 làm cho tái dùng rẻ hơn tự dựng. Hai dòng «xong khi» của kế hoạch:

1. Một khối mới vào ứng dụng mẫu qua lệnh; lần hai cùng nhu cầu không gọi người.
2. Kiểm kê báo đủ sáu loại phát hiện trên repo thử, và không báo gì trên repo lành.

Tài liệu kiến trúc (mục «Đường nhập kho» và mục 12) nêu ba điều kiện để tái dùng làm việc nhanh dần: thứ mới được ghi
ngay lúc ra đời, tra lại rẻ hơn làm mới, kho còn đáng tin. Bốn lệnh của giai đoạn này mỗi lệnh giữ một phần: `intake`
ghi, `find` tra, `inventory` giữ cho kho đáng tin, `change` cho một thứ ra khỏi kho mà không làm gãy màn.

### Điều đã có, đọc từ mã

- **Sổ nhập kho đã chốt ở quyết định 0052** (`intake-ledger.mjs`, `contract.mjs`, `contract.md`): sổ thứ mười hai của
  hợp đồng, hình dạng 1, tệp `design/intake.yaml`, danh sách `blocks`. Năm khoá bắt buộc `name`, `file`, `source`,
  `need`, `approved`; bốn khoá tuỳ chọn `pin`, `description`, `record`, `approved_by`; khoá riêng của repo được giữ;
  repo viết khoá kiểu khác thì khai ở `keys`. Repo được chọn giữ sổ mỗi khối một tệp, `design/intake/<need>.yaml`, phần
  chung ở `_shared.yaml`; tắt cho tới khi bật. Một nhu cầu hai lời giải thì cổng đỏ.
- **Sổ nguồn ngoài chưa có hình dạng.** `contract.md` gọi nó là `sources` ở mục «Not settled yet»: thư viện ngoài nào,
  theo thứ tự nào, ghim ở bản nào.
- **Hàng chờ** (`waiting.mjs`, quyết định 0054): mỗi câu một tệp `design/waiting/<id>.json`, hoặc tệp chung cũ
  `design/waiting-list.json`, không bao giờ cả hai. Một câu nêu được một mục (`item`) theo ba loại: `decision:`,
  `pattern:`, `source-color:`; hai loại sau là việc của chủ repo, tác tử hỏi thì không đi tiếp. Lời đáp là `keep`,
  `refuse` hoặc một giá trị, kèm tên người và ngày. `decide --ask` từ chối ghi khi hàng chờ còn là tệp chung.
- **Sổ linh kiện dựng được trong bộ nhớ.** `regenerated(root)` của `components.mjs` trả sổ như lệnh sinh sẽ ghi, không
  ghi gì; nó trả `null` khi dữ liệu công cụ của repo không có phép kiểm `component-manifest`. Mỗi linh kiện có `source`
  là `library` hoặc `own`.
- **Màn nào với tới tệp nào đã đọc được.** `screensOf(root)` của `affected.mjs` (quyết định 0053) trả mỗi màn đã dựng
  cùng mọi tệp nó với tới qua `import`. Khung ứng dụng không phải một màn: với repo khai màn trong một danh sách, như
  ứng dụng mẫu, tệp chỉ khung dùng thì không màn nào với tới.
- **Bộ khởi đầu của plugin** là các tệp ở `templates/owned/`: bảng có kiểu cột, cột thao tác, tấm hồ sơ, khung, báo
  kết quả. `apply.mjs` chép chúng vào repo trên sàn khi đủ điều kiện. Không có bảng nào nói mỗi tệp giải nhu cầu gì.
- **`scripts/inventory.mjs` hôm nay là `audit`.** Năm tệp gọi nó theo tên: `mk/plugin.mk`,
  `skills/audit/SKILL.md`, `scripts/status.mjs` và `scripts/book.mjs` (nhập hàm `inventory`), `docs/trials/ladder.mjs`;
  thêm mười tệp bài kiểm. Mẫu tệp make mà plugin cài vào repo không gọi nó. Ở repo kiểm chứng, một hồ sơ nghiệm thu gọi
  nó ở một commit ghim sẵn (`93daea4`), nên không bị đổi tên ảnh hưởng.
- **Bảng từ vựng** ở `references/vocabulary.json`, giữ bằng `tests/test-vocabulary.mjs`. Đã có: `intake ledger`,
  `derived file`, `upgrade`, `graduation`, `snowflakes`, `registry`, `component manifest`, `audit`. Chưa có tên nào cho
  kiểm kê kho, nguồn ngoài, bản ghim, cho nghỉ.
- **Ứng dụng mẫu** chưa có sổ nhập kho, chưa có nguồn ngoài. Sổ linh kiện dựng ra 65 linh kiện, 58 của thư viện và 7
  của riêng repo. Ba tệp của thư viện (`card`, `select`, `row-actions`) không tệp nào nhập; `app-frame` và `sonner` chỉ
  khung dùng.

### Điều repo kiểm chứng đã tự làm bằng tay

Repo kiểm chứng đã chạy đúng việc của giai đoạn này, bằng công cụ viết riêng. Đó là chỗ giai đoạn 3 rút vào plugin
(tiêu chí 5 của đề bài 0002).

- **Sổ khối** là sổ nhập kho theo mảnh: 23 mảnh ở `design/intake/`, khoá tiếng Việt khai qua `keys`. Nó giữ thêm một
  khoá riêng cạnh danh sách, `khoi_co_truoc`: các khối làm trước khi có sổ, mỗi khối kèm hồ sơ, commit, ngày, lý do.
  `nguon` là tên một khối của thư viện ngoài, hoặc chữ `tao-tay`.
- **Danh mục thư viện ngoài đã ghim.** `tools/reui_catalog/pin.json` ghi ngày lấy và từng tệp (đường dẫn trên mạng, số
  byte, `sha256`). Bản chụp nằm trong git. `design/reui-catalog.json` sinh từ bản chụp, không cần mạng: 678 khối, 27
  linh kiện, 1 264 ví dụ, xếp trong 167 nhóm, mỗi mục có tên, tiêu đề, mô tả. Lệnh tra khớp theo chữ, không theo nghĩa,
  và thoát 1 khi không gì khớp. Chỉ lần ghim lại mới cần mạng.
- **Thang ba bậc trong cổng chứng minh của repo:** `trong-kho`, rồi thư viện ngoài, rồi `ve-tay`. Rơi xuống bậc dưới
  phải có căn cứ; khối thư viện ngoài phải là ứng viên được chọn của nhóm nó; khối trong sổ linh kiện mà chưa có dòng
  nhập kho thì đỏ.

### Mọi repo, mọi giai đoạn

Sáu luật của đề bài 0005 áp nguyên cho giai đoạn này: mặc định là hành vi hôm nay; hình dạng cũ luôn đọc được; chưa có
gì cũng chạy được và đưa câu an toàn; thứ gắn với một loại repo nằm ở bộ chuyển; không tên riêng trong plugin; mỗi phần
thử trên ít nhất ba dáng repo. Mục «Phục vụ mọi repo» bên dưới nói từng lệnh làm gì ở từng dáng.

### Phần A. Hai sổ (mục 3.1)

#### A1. Sổ nhập kho: giữ hình dạng 0052, thêm khoá tuỳ chọn

Hình dạng vẫn là 1. Mọi khoá thêm đều tuỳ chọn, và sổ đã cho phép khoá riêng của repo, nên công cụ bản cũ đọc một sổ
có khoá mới như đọc khoá riêng: không đỏ, không mất gì.

| Khoá          | Ở đâu          | Nghĩa                                                                               | Ai cần                     |
| ------------- | -------------- | ----------------------------------------------------------------------------------- | -------------------------- |
| `from`        | trên khối      | Mã của nguồn trong sổ nguồn ngoài. Bỏ trống được khi repo chỉ ghim một nguồn        | `find`, `inventory`        |
| `taken`       | trên khối      | `sha256` của tệp khối lúc nhập                                                      | phát hiện «sửa khác nguồn» |
| `changed`     | trên khối      | Repo cố ý sửa khối khác nguồn: `{ on, why }`                                        | như trên                   |
| `retired`     | trên khối      | Khối đã cho nghỉ: `{ on, by, why }`                                                 | `change`, `inventory`      |
| `merged_into` | trên khối      | Khối đã gộp vào nhu cầu khác: khoá nhu cầu ấy                                       | như trên                   |
| `before`      | cạnh danh sách | Thứ làm trước khi có sổ: mỗi thứ có `name`, `why`, và có thể có `file`, `record`    | phát hiện «không ghi sổ»   |
| `values`      | cạnh danh sách | Cách repo viết giá trị của hợp đồng, hôm nay chỉ một: `{ by-hand: <chữ của repo> }` | mọi bên đọc                |

`source` giữ nghĩa cũ: tên mục trong danh mục của nguồn, hoặc giá trị «tạo tay». Hợp đồng viết giá trị ấy là `by-hand`;
repo kiểm chứng viết `tao-tay`, khai bằng `values`. `keys` chỉ đổi tên khoá, không đổi giá trị, nên cần một dòng riêng.

#### A2. Sổ nguồn ngoài: hình dạng mới

- **Tên và chỗ.** Sổ thứ mười ba của hợp đồng, `sources`. Thư mục `design/sources/`, mỗi nguồn một tệp
  `design/sources/<id>.json`. Không có hình dạng một tệp: sổ này chưa từng có, nên không có bên đọc cũ nào phải giữ.
  Hai nhánh ghim hai nguồn khác nhau ghi hai tệp; ghim lại một nguồn chỉ chạm tệp của nguồn ấy. Mỗi tệp một bên ghi.
- **Một tệp nguồn** (JSON vì máy ghi, như hàng chờ và dấu bản công cụ):
  - `version`: 1.
  - `id`: chữ thường nối gạch, bằng tên tệp; tên tệp khác `id` thì cổng đỏ.
  - `title`: tên người đọc.
  - `order`: số; `find` tra các nguồn theo số nhỏ trước, rồi theo `id`.
  - `pin`: bản đã ghim, một trong hai dạng. Dạng tệp: `{ fetched_at, files: [{ file, url, bytes, sha256 }] }`, đúng
    từng khoá của tệp ghim ở repo kiểm chứng. Dạng bản: `{ version }`, cho nguồn phát hành theo số bản. Hoặc `pin_file`: đường dẫn tới tệp đang giữ bản
    ghim theo một trong hai dạng ấy, để repo đã có tệp ghim riêng không phải chép lại thành hai nguồn sự thật.
  - `catalog`: đường dẫn tới danh mục trong repo.
  - `install`: dòng lệnh lấy một mục về, có chỗ `{name}`. Đây là dữ liệu của repo, nên nêu tên thư viện ở đây không phạm
    luật «lõi không nêu tên thư viện».
  - `licence`: tuỳ chọn, một câu, ví dụ «cần khoá của repo lúc lấy về». Không bao giờ là khoá.
  - Khoá riêng của repo được giữ.
- **Danh mục** là danh sách mục, mỗi mục có `name`, `kind`, `title`, `description`, và có thể có `group`, `page`. Dạng
  xếp nhóm của repo kiểm chứng (mỗi nhóm có `kind`, `group`, `category`, `base`, `items`) đọc ra cùng các mục ấy. Danh mục không
  chứa mã.
- **Plugin không bao giờ dùng mạng.** Không lệnh nào của giai đoạn này lấy hay ghim lại một nguồn; việc ấy là của công
  cụ riêng của repo hoặc của người. Lệnh đọc danh mục thì so bản chụp với `sha256` đã ghim khi bản ghim có dạng tệp; lệch
  thì nguồn ấy bị nói là không đọc được, và không mục nào của nó được đưa ra.
- **Danh mục có phải vật dẫn xuất không** là việc của từng repo, như ở quyết định 0052: sinh lại được mà không cần mạng
  thì có thể để ngoài git bằng phép kiểm `untracked`; repo kiểm chứng đang commit nó, và cách ấy vẫn đúng.
- **Cổng giữ hình dạng** qua dòng `ledger-shapes` đã có: phép kiểm ấy đọc mọi sổ của hợp đồng, nên repo có
  `design/sources/` được giữ ngay khi lên đời; repo không có thì không thấy gì đổi.

#### A3. Tên ngành vào bảng từ vựng

Bảng ở `plugins/design-assembly/references/vocabulary.json`. Mục 3.1 đọc nguồn của từng tên trong ngày, ghi ngày đọc,
và tên nào không lần được về một nguồn thì ghi `coined`, như `intake ledger` ở 0052. Tên dự kiến:

| Tiếng Việt trong tài liệu | Tên tiếng Anh dự kiến | Nguồn dự kiến, đọc lại ở 3.1                                  |
| ------------------------- | --------------------- | ------------------------------------------------------------- |
| kiểm kê kho               | interface inventory   | Brad Frost, bài «Interface Inventory»                         |
| tra kho                   | (lệnh `find`)         | không cần tên ngành riêng; mô tả trong mục của `find`         |
| nguồn ngoài               | external source       | thói quen của ngành                                           |
| bản ghim                  | pin                   | thói quen của các trình quản lý gói (tệp khoá phiên bản)      |
| danh mục                  | catalog               | thói quen của ngành                                           |
| chép vào repo             | vendoring             | thói quen của ngành; registry của thư viện linh kiện mô tả nó |
| thang dùng lại            | reuse ladder          | `coined` nếu không lần được                                   |
| bộ khởi đầu               | starter kit           | thói quen của ngành                                           |
| cho nghỉ                  | deprecation           | trang chính sách của các design system lớn                    |
| lệch bản                  | drift                 | thói quen của ngành                                           |

### Phần B. Bốn lệnh (mục 3.2 tới 3.5)

Mỗi lệnh theo hợp đồng chung (`command.mjs`, quyết định 0044): `--target`, `--json`, mã thoát 0, 1, 2, không in dấu
vết ngăn xếp. Lệnh ghi có `--dry-run` in đúng danh sách tệp lần chạy thật sẽ ghi. Mỗi lệnh có một skill gọi script qua
thư mục gốc của plugin, như bảy lệnh đang có. Tài liệu `--out` theo khung chung (0046), bằng chữ: dòng giới hạn
`document-findings-without-pictures` vẫn mở và nay nói cả bốn lệnh.

#### Tên `inventory`

`scripts/inventory.mjs` hôm nay là `audit`. Đề bài 0004 đã khuyên lệnh kiểm kê mang tên `inventory`, và script của
`audit` đổi tên cho khớp lệnh. Làm theo hai bước, để không có bản nào mà cùng một lời gọi lặng lẽ trả một kết quả khác:

1. **Trước `find`, một PR nhỏ:** `scripts/inventory.mjs` thành `scripts/audit.mjs`, hàm `inventory` thành `audit`,
   `tests/test-inventory.mjs` thành `tests/test-audit.mjs`; năm tệp gọi và mười tệp bài kiểm đổi theo. Ở tên cũ còn một
   tệp nhỏ, gọi nó thì thoát 2 và nói tên mới. Ghi chú phát hành của bản ấy nói việc đổi tên.
2. **Ở mục 3.4,** tệp nhỏ ấy được thay bằng lệnh kiểm kê thật.

`make design-audit` và skill `audit` giữ tên. Trang quyết định cũ nhắc đường dẫn cũ thì để nguyên: đó là lịch sử.

#### B1. `find` — tra kho (mục 3.2)

- **Đầu vào:** `--target`; các chữ của nhu cầu hoặc một tên; `--kind component|block|screen-kind|behaviour`;
  `--limit N` (mặc định 5); `--json`; `--out DIR`.
- **Đọc, từ gần tới xa, gặp ở tầng nào dừng ở tầng đó:**
  1. Kho của repo: sổ nhập kho (tên, nhu cầu, mô tả), sổ linh kiện dựng trong bộ nhớ, trang kiểu màn.
  2. Bộ khởi đầu của plugin, qua một bảng mới `references/starter.json`: mỗi mục có tên, nhu cầu, loại, các tệp mẫu và
     bộ chuyển nó cần. Mục cần bộ chuyển repo không có thì không đưa ra, và `searched[]` nói vì sao.
  3. Kho chung của họ sản phẩm: chưa tồn tại (giai đoạn 7); `searched[]` ghi «không có».
  4. Nguồn ngoài đã ghim, theo `order`.
- **Khớp thế nào, không gọi mô hình.** Chữ được cắt thành từ (chữ thường, tách ở khoảng trắng, gạch nối, gạch dưới và
  chỗ đổi hoa thường). Một mục **khớp** khi lời tra bằng tên hay khoá nhu cầu của nó, hoặc mọi từ của lời tra có trong
  từ của mục. Mục chỉ chứa một phần các từ là **gần khớp**: được kê, không làm dừng việc tra. Xếp: bằng tên hay nhu cầu
  trước, rồi nhiều từ trùng hơn, rồi theo tên.
- **Người nhận:** mỗi thứ khớp một khối: là gì, ở tầng nào, tệp nào, nhận thuộc tính và biến thể nào, màn nào đang dùng
  (từ `screensOf`), lấy từ nguồn nào ở bản nào, trang của nó trong nguồn. Không khớp thì nói đã tra những tầng nào, kê
  các mục gần khớp, và nêu lệnh kế: `intake`.
- **Máy nhận:** `matches[]` (`name`, `kind`, `store`, `file`, `props`, `variants`, `used_by[]`, `source`, `pin`,
  `reference`), `near[]`, `searched[]` (`store`, đã đọc gì, bao nhiêu mục, gặp hay không, vì sao không đọc được).
- **Ghi:** không. **Mã thoát:** 0 khi có thứ khớp; 1 khi không; 2 khi gọi sai hoặc repo không đọc được.

#### B2. `inventory` — kiểm kê kho (mục 3.4)

- **Đầu vào:** `--target`; `--store repo|starter|external|all`; `--kind`; `--strict`; `--json`; `--out DIR`.
- **Đọc:** sổ linh kiện dựng trong bộ nhớ, sổ nhập kho, sổ nguồn ngoài và danh mục, sổ màn và `screensOf`, tệp vào
  của khung ứng dụng (bộ chuyển nền dựng chỉ ra), trang kiểu màn, `references/starter.json`.
- **Người nhận:** mỗi kho và mỗi loại có bao nhiêu thứ; rồi các phát hiện, mỗi phát hiện kèm bằng chứng; rồi «không
  thấy gì»: những thứ lệnh không xét được và vì sao (khối không có `taken`, repo không lần được `import`, nguồn không
  đọc được).
- **Máy nhận:** `stores[]` (`store`, `kind`, `count`), `items[]` (`name`, `kind`, `store`, `file`, `source`, `pin`,
  `used_by[]`, `state`: `in-use`, `unused`, `retired`, `retired-in-use`), `findings[]` (`kind`, `items[]`,
  `evidence`), `blind[]`.
- **Ghi:** không. **Mã thoát:** 0; với `--strict`, 1 khi có phát hiện; 2 khi gọi sai hoặc repo không đọc được.

#### B3. `intake` — nhập kho (mục 3.3)

Thang ba bậc của tài liệu kiến trúc, chạy bằng `find`, và mọi lời chọn đi qua hàng chờ để không dòng sổ nào mang tên
người khi người chưa đáp.

- **Đầu vào:** `--target`; `--need KEY` (khoá nhu cầu, bắt buộc); các chữ của nhu cầu; `--kind`; `--by-hand --why
SENTENCE` (tạo tay, kèm lý do hai bậc trên không đáp ứng); `--file PATH` (tệp của khối tạo tay); `--dry-run`;
  `--json`; `--out DIR`.
- **Bậc 1, kho của repo.** Sổ nhập kho đã có khối cho đúng khoá nhu cầu ấy, chưa cho nghỉ: in khối ấy, không ghi gì,
  thoát 0. Đây là «lần hai không gọi người». Thứ khớp chữ mà mang khoá nhu cầu khác chỉ được kê là gần khớp: lệnh không
  tự đoán hai nhu cầu là một.
- **Bậc 2, bộ khởi đầu rồi nguồn ngoài.** Chưa có khối: lệnh lấy tối đa ba ứng viên theo thứ tự của `find`, thêm lựa
  chọn «tạo tay» ở cuối, và ghi **một câu vào hàng chờ**, `design/waiting/intake-<need>.json`: mục `need:<key>`, các
  ứng viên (tên, nguồn, bản ghim, trang, vì sao khớp), khuyến nghị là ứng viên đầu. Không ghi dòng sổ. Thoát 1.
- **Bậc 3, tạo tay.** Không ứng viên nào, hoặc người gọi nêu `--by-hand --why`: câu vào hàng chờ là «tạo tay cho nhu
  cầu này, vì…». Lý do «trông chưa đẹp» hay «ghép tay nhanh hơn» không được nhận: lệnh không chấm được lý do, nên câu
  hỏi in nguyên lời để chủ repo đọc.
- **Chủ repo đáp qua `decide`,** một chỗ duy nhất ghi lời đáp kèm tên và ngày: `keep` nhận khuyến nghị, một giá trị là
  tên ứng viên khác hoặc `by-hand`, `refuse` là không nhận khối nào.
- **Gọi lại `intake --need KEY` sau lời đáp:**
  - Bộ khởi đầu: lệnh chép tệp mẫu, như `apply.mjs` đang chép.
  - Nguồn ngoài: lệnh in dòng `install` của nguồn cho mục đã chọn, và **không tự chạy nó**: dòng ấy cần mạng, có thể
    thêm gói, và thêm gói cần người cho phép. Khi tệp đã có trên đĩa, lần gọi kế ghi dòng sổ. Chưa có thì thoát 1.
  - Tạo tay: cần `--file PATH` đã có trên đĩa.
  - Dòng sổ ghi: `name`, `file`, `source`, `from`, `pin`, `need`, `description`, `approved` (ngày của lời đáp),
    `approved_by` (tên trong lời đáp), `taken`. Repo giữ sổ theo mảnh thì ghi đúng một tệp mới.
- **Repo chưa có sổ nhập kho:** lệnh tạo `design/intake.yaml` một tệp, theo luật «mặc định là hành vi hôm nay» và
  quyết định 0052; repo muốn mảnh thì bật bằng lệnh tách đã có. Ứng dụng mẫu sẽ bật mảnh, như đã bật cho sổ màn.
- **Hàng chờ còn là tệp chung:** từ chối ghi và bảo tách trước, đúng như `decide --ask`.
- **Máy nhận:** `rung` (`store`, `starter`, `external`, `by-hand`), `candidates[]`, `waiting` (mã câu chờ), `chosen`,
  `row`, `install`, `files[]`.
- **Ghi:** câu chờ; sau lời đáp: mã khối (chỉ với bộ khởi đầu) và một dòng sổ. **Mã thoát:** 0 khi khối đã có dòng
  sổ; 1 khi chờ người đáp hoặc chờ tệp; 2 khi gọi sai.

#### B4. `change` — đổi, cho nghỉ, gộp (mục 3.5)

- **Đầu vào:** `--target`; tên một khối hoặc khoá nhu cầu; một trong `--retire --why SENTENCE` hoặc `--merge-into
NEED`; `--dry-run`; `--json`; `--out DIR`.
- **Đọc:** sổ nhập kho, `screensOf`, sổ linh kiện dựng trong bộ nhớ (ai nhập khối này), dữ liệu công cụ (phép kiểm nào
  nêu tệp này).
- **Người nhận:** trước hết là tác động: màn nào, linh kiện nào, phép kiểm nào; không lần được `import` thì tác động là
  «mọi màn», như `affected`. Rồi điều sẽ đổi, và các dòng `import` phải sửa, mỗi dòng một tệp và một số dòng.
- **Luôn qua hàng chờ:** cho nghỉ hay gộp là một câu, mục `block:<need>`, kèm tác động. Sau lời đáp `keep`, lệnh ghi
  `retired` (và `merged_into` khi gộp) vào đúng mảnh của khối ấy.
- **Không xoá tệp nào,** kể cả tệp không màn nào dùng, và **không sửa mã màn.** Khối đã nghỉ mà màn còn nhập hiện ở
  kiểm kê với trạng thái `retired-in-use`; người hoặc tác tử sửa các dòng `import` đã kê.
- **Máy nhận:** `impact` (`screens[]`, `components[]`, `checks[]`, `all`), `edits[]`, `waiting`, `files[]`.
- **Mã thoát:** 0 khi đã ghi hoặc không còn gì; 1 khi câu chờ người; 2 khi gọi sai, kể cả tên không có trong sổ.

Đề bài 0004 cho `change` thêm `--to GIÁ-TRỊ` (đổi một quyết định đã chốt) và `--migrate` (đưa giá trị viết vòng về
giá trị của hệ). Hai việc ấy là về sổ quyết định và về mã màn, không phải về kho; đề bài này khuyên để sang bên (câu
hỏi 8).

### Phần C. Sáu loại phát hiện của kiểm kê

Mỗi loại có một mã máy đọc, và một chỗ cài trên repo thử để thấy nó hiện ra, rồi gỡ chỗ ấy thì nó mất.

| Mã           | Lời của đề bài 0004                  | Nghĩa đo được                                                                                                                                                                       | Repo thử cài gì                                                                  |
| ------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `unused`     | thứ không màn nào dùng               | Khối chưa nghỉ trong sổ nhập kho, hoặc linh kiện riêng (`own`), mà không màn nào và cả khung ứng dụng không với tới qua `import`. Linh kiện của thư viện chỉ được đếm, không bị báo | Một linh kiện riêng không tệp nào nhập                                           |
| `unrecorded` | thứ mã dùng mà sổ không ghi          | Linh kiện riêng có màn với tới, mà sổ nhập kho không có dòng và `before` không kê. Chỉ xét khi repo có sổ nhập kho                                                                  | Một linh kiện riêng mới, một màn nhập nó, sổ không có dòng                       |
| `duplicate`  | hai thứ cùng giải một nhu cầu        | Hai khối là một thứ lấy hai lần: cùng nguồn và cùng mục dưới hai nhu cầu; hoặc hai tệp khối giống nhau từng byte; hoặc cùng một tên xuất ở hai tệp riêng                            | Chép một khối sang đường dẫn khác, thêm dòng thứ hai trỏ cùng mục của cùng nguồn |
| `outdated`   | thứ lấy từ nguồn ngoài đã lệch bản   | `pin` của khối khác bản ghim hiện tại của nguồn nó                                                                                                                                  | Đổi bản ghim của nguồn, không đổi khối                                           |
| `modified`   | bị sửa khác nguồn mà không ghi lý do | Tệp khối khác `taken`, và khối không có `changed`. Khối từ bộ khởi đầu thì so thẳng với tệp mẫu của bản plugin đang cài                                                             | Sửa một dòng của tệp khối                                                        |
| `promote`    | đã dùng ở hai nơi, đáng nâng hạng    | Một linh kiện định nghĩa ngoài mọi thư mục linh kiện (trong tệp của một màn) mà hai màn trở lên với tới: đáng vào kho của repo                                                      | Khai một linh kiện trong tệp màn A, cho màn B nhập                               |

Điều đo được và không đo được:

- `duplicate` chỉ thấy hai cách lấy cùng một thứ. Hai cách làm khác nhau cho một nhu cầu viết bằng hai lời khác nhau
  thì cần hiểu nghĩa, lệnh không đoán; điều đó thành một dòng giới hạn.
- `modified` cần `taken`. Khối nhập trước mục 3.1 không có nó, nên được kê ở «không thấy gì», không bị báo.
- `promote` trong giai đoạn này chỉ trong một repo: từ một màn lên kho của repo. Nâng lên kho chung của họ cần repo thứ
  hai và kho chung, là việc của giai đoạn 7.
- Khung ứng dụng tính là một bên dùng. Không tìm được tệp vào của khung thì `unused` không được báo, và «không thấy
  gì» nói vì sao: thà không báo còn hơn báo sai một thứ đang được dùng.

**«Không báo gì trên repo lành» đo trên hai repo:**

1. Repo thử mà bài kiểm dựng, trước khi cài sáu chỗ: `findings` rỗng, `--strict` thoát 0. Cùng repo ấy, cài cả sáu:
   đủ sáu mã, mỗi mã đúng một lần.
2. Ứng dụng mẫu, ở commit đóng mục 3.4 và lại ở commit đóng mục 3.3: `--strict` thoát 0. Đọc hôm nay: bảy linh kiện
   riêng của nó đều có màn hoặc khung với tới; ba tệp thư viện không ai nhập chỉ được đếm. Khi 3.3 tạo sổ nhập kho cho
   ứng dụng mẫu, bảy linh kiện ấy vào `before`, do máy đề xuất và chủ repo giữ một lần qua `decide`; không thì chúng
   thành `unrecorded`.

Bản sao của repo kiểm chứng là phép đo, không phải phép đạt: điều lệnh báo ở đó được ghi lên trang thử để chủ repo đọc.

### Thứ tự dựng

Đọc của phiên giao việc: hai lệnh chỉ đọc trước (`find`, rồi `inventory`), rồi `intake`, rồi `change`. Đối chiếu với
mã, thứ tự ấy đúng, với một chỗ thêm ở đầu:

1. **Mục 3.1 trước cả bốn lệnh.** Cả bốn đọc sổ nguồn ngoài và các khoá mới của sổ nhập kho; `inventory` cần `pin`,
   `taken`, `changed`, `before` để có bốn trong sáu phát hiện. Bài kiểm của mỗi lệnh dựng sổ bằng tay theo hình dạng ấy.
2. **Đổi tên script của `audit`** (PR nhỏ, phục vụ 3.4), trước `find`, để tên trống từ sớm.
3. **`find` (3.2).** Chỉ đọc, không cần ai cho phép trên repo thật; `intake` dựng trên nó.
4. **`inventory` (3.4) trước `intake` (3.3).** Không cần `intake`: repo thử dựng sổ bằng tay. Làm trước thì có số đo
   «lành» của ứng dụng mẫu trước khi khối đầu tiên vào, và quyết sớm cách `before` giữ các linh kiện có từ trước, điều
   `intake` cần biết khi tạo sổ. Kế hoạch kê 3.3 trước 3.4; thứ tự trong tệp kế hoạch không đổi, chỉ thứ tự dựng.
5. **`intake` (3.3).** Đóng dòng «xong khi» thứ nhất trên ứng dụng mẫu.
6. **`change` (3.5).** Cần trạng thái `retired` mà `inventory` đọc, và tác động lấy từ cùng bộ đọc.

Mỗi bước một nhánh cắt từ `main` mới nhất, một PR, một quyết định ghi lại lựa chọn kỹ thuật, bài kiểm thấy đỏ trước khi
có mã, số bản plugin tăng theo quyết định 0047.

### Phục vụ mọi repo

| Lệnh        | Repo chưa có sổ nào, hoặc không nằm trong git                                                                                                       | Repo đã nhận bằng bản công cụ cũ hơn                                                                                                | Repo khác nền dựng                                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `find`      | Đọc linh kiện bằng bộ chuyển như `audit`; sổ nhập kho và nguồn ngoài «không có» ở `searched[]`; thoát 1 khi không khớp, không bao giờ 2 vì thiếu sổ | Đọc sổ bằng bộ đọc của plugin, đọc được hình dạng cũ; sổ có hình dạng mới hơn thì tầng ấy «không đọc được: cập nhật plugin»         | Repo nhiều gói: `--target` vào gói, như `audit` (giới hạn `audit-workspace-reads-top-src-only`); repo không có linh kiện thì chỉ tra sổ và nguồn ngoài |
| `inventory` | Chỉ đếm; phát hiện chỉ có những loại không cần sổ (`unused`, `promote`); «không thấy gì» nói rõ thiếu sổ nào                                        | Khối không có `pin` hay `taken` không bị báo `outdated` hay `modified`, mà vào «không thấy gì»                                      | Không lần được `import` thì không báo `unused`, `unrecorded`, `promote`, và nói vì sao                                                                 |
| `intake`    | Vẫn ghi: câu chờ và, sau lời đáp, dòng sổ; nói rằng không cổng nào giữ chúng cho tới khi repo nhận plugin, và thoát 1                               | Ghi như thường; công cụ cũ không biết khoá mới nên đọc chúng như khoá riêng; lệnh nói bản công cụ nào mới giữ được và bảo `upgrade` | Bộ khởi đầu không áp dụng (chỉ trên sàn có bộ chuyển của nó); nguồn ngoài và tạo tay chạy được ở mọi nền dựng                                          |
| `change`    | Không có khối nào để đổi: tên lạ là gọi sai, thoát 2 kèm một dòng lý do                                                                             | Như `intake`                                                                                                                        | Tác động không lần được thì là «mọi màn»                                                                                                               |

Mỗi lệnh có bài kiểm trên ba dáng repo dựng tạm: không có gì và không nằm trong git; đã nhận bằng công cụ lấy từ git ở
`03e2a99` (bản 0.7.3); một repo dáng Next.js. Rồi đo, chỉ đọc, trên bản sao trong thư mục nháp của: ứng dụng mẫu, repo
kiểm chứng, và hai repo của giai đoạn 2 (một repo web ngoài họ, một repo nhiều gói cùng họ), nếu chủ repo cho đọc lại.

### Ngoài phạm vi

- Lấy hay ghim lại một nguồn từ mạng; bộ sinh danh mục cho từng thư viện. Công cụ ghim của repo kiểm chứng ở lại với nó.
- Kho chung của họ sản phẩm, nâng hạng giữa các repo, tiền lệ của repo khác (cơ chế 5) và uỷ quyền tăng dần theo đồng
  thuận (cơ chế 6): giai đoạn 7 và sau.
- Hình của ứng viên và của phát hiện (câu hỏi 6).
- `change --to` và `change --migrate` (câu hỏi 8).
- Mẫu hành vi như một món của kho: chưa có kho cho loại này; `--kind behaviour` trả «chưa có kho».
- `brief` dùng `find`: giai đoạn 5. Kit nghiệm thu đọc sổ nhập kho: giai đoạn 6.
- Mọi sửa đổi ở repo kiểm chứng, delivery-loop, Repo Standards, và năm tệp Repo Standards giữ ở kho này.

### Dòng giới hạn

- **Đóng:** `decide-intake-candidates-not-read` (ở 3.3: `decide` đọc câu `need:` mà `intake` xếp), và
  `decide-change-proposals-not-read` (ở 3.5: câu `block:` của `change`).
- **Để nguyên, ghi thêm:** `document-findings-without-pictures` (nay nói cả bốn lệnh); `intake-ledger-path-named-by-hand`
  (bốn lệnh mới đọc đường dẫn ở `ledgers.intake`, nhưng dẫn dắt và nhận vẫn ghi đường dẫn thường);
  `intake-own-keys-need-a-line-in-the-ledger`; `audit-workspace-reads-top-src-only` (áp cả cho `find` và
  `inventory`); `screen-fragments-not-brought-by-upgrade`.
- **Mở mới, dự kiến:**
  - `find-matches-words-not-meaning`: tra theo chữ; nhu cầu viết bằng tiếng của repo không khớp danh mục viết bằng tiếng
    Anh.
  - `inventory-duplicates-by-name-and-source-only`: như trên ở phần C.
  - `inventory-promotion-within-one-repository`: nâng hạng giữa các repo chưa có.
  - `modified-needs-the-hash-taken-at-intake`: khối nhập trước 3.1 không được xét.
  - `sources-never-fetched`: plugin không ghim lại nguồn; bản ghim cũ chỉ được nói, không được làm mới.
  - `intake-candidates-without-pictures`: nếu chủ repo nhận lời khuyên ở câu hỏi 6.
  - `change-to-and-migrate-not-built`: nếu chủ repo nhận lời khuyên ở câu hỏi 8.

## Acceptance criteria

Mỗi tiêu chí là một lệnh chạy được. Các tệp bài kiểm nêu dưới đây là tên dự kiến.

1. **Sổ nguồn ngoài trong hợp đồng.** `node --test plugins/design-assembly/tests/test-sources-ledger.mjs` xanh: tên tệp
   khác `id` thì đỏ; thiếu `pin` thì đỏ; bản chụp lệch `sha256` thì nguồn bị nói không đọc được. `test-contract.mjs` xanh
   với mười ba sổ ở cả `contract.mjs` lẫn `contract.md`.
2. **Khoá mới không làm đỏ công cụ cũ.** Một sổ nhập kho có `from`, `taken`, `changed`, `retired`, `before`, `values`
   qua phép kiểm `ledger-shapes` của công cụ lấy từ git ở `03e2a99` vẫn xanh.
3. **Bảng từ vựng.** `node --test plugins/design-assembly/tests/test-vocabulary.mjs` xanh; mỗi tên mới có nguồn, ngày
   đọc và mức tin, hoặc `coined`.
4. **Đổi tên không đổi kết quả.** `node plugins/design-assembly/scripts/audit.mjs --target . --json` cho cùng dữ kiện
   với `inventory.mjs` ở `03e2a99`, trừ số bản; trước mục 3.4, `node plugins/design-assembly/scripts/inventory.mjs
--target .` thoát 2 và nêu `audit.mjs`.
5. **`find` trả lời bằng một lần gọi, không mô hình, không mạng.** `node plugins/design-assembly/scripts/find.mjs
--target <repo thử> --json <chữ>` thoát 0 với các khoá ở B1 khi có thứ khớp, thoát 1 và kê mọi tầng ở `searched[]`
   khi không; bài kiểm chạy dưới một bộ chặn mạng.
6. **Hai lệnh chỉ đọc không đổi gì.** Băm cây của repo (kể cả tệp git bỏ qua) trước và sau `find` và `inventory` bằng
   nhau, trên ứng dụng mẫu và trên ba dáng repo thử.
7. **Tất định.** Hai lần `find` hay `inventory` trên cùng repo cho cùng JSON.
8. **Sáu loại phát hiện, hai chiều.** `node --test plugins/design-assembly/tests/test-inventory-findings.mjs` xanh: mỗi
   chỗ cài làm hiện đúng một mã của nó; gỡ thì mất; repo lành cho `findings: []` và `--strict` thoát 0; cài cả sáu cho đủ
   sáu mã.
9. **Ứng dụng mẫu lành.** `node plugins/design-assembly/scripts/inventory.mjs --target . --strict` thoát 0 ở commit đóng
   3.4, và lại ở commit đóng 3.3.
10. **Khối mới vào ứng dụng mẫu qua lệnh.** Trên nhánh của 3.3: lần đầu `intake --need <key>` thoát 1, thêm đúng một tệp
    ở `design/waiting/`, không có dòng sổ; chủ repo đáp bằng `decide`; gọi lại thì thoát 0, có mã khối và một dòng sổ
    mang tên người và ngày của lời đáp; `make check` xanh.
11. **Lần hai không gọi người.** Gọi lại `intake --need <key>` với cùng khoá: thoát 0, `rung` là `store`,
    `git status --porcelain` rỗng, không thêm tệp nào ở `design/waiting/`.
12. **Không dòng sổ nào mang tên người khi người chưa đáp.** Bài kiểm của `intake`: không có lời đáp thì không bao giờ ghi
    `approved` hay `approved_by`.
13. **`change` không làm gãy màn.** `change <khối> --retire --why … --dry-run` in tác động bằng đúng tập màn `screensOf`
    với tới; sau lời đáp, mảnh của khối có `retired`, tệp khối còn nguyên, và `inventory` cho trạng thái `retired-in-use`
    khi màn còn nhập nó.
14. **`decide` đọc câu của `intake` và `change`.** `node plugins/design-assembly/scripts/decide.mjs --target <repo thử>
--json` kê câu `need:` và câu `block:`; hai dòng giới hạn tương ứng đóng.
15. **Hợp đồng chung.** `test-command-contract.mjs` phủ bốn lệnh mới: `--json` là một tài liệu duy nhất; mã thoát 0, 1,
    2; với `intake` và `change`, danh sách tệp của `--dry-run` bằng danh sách tệp đổi sau lần chạy thật.
16. **Mọi repo.** Mỗi lệnh trên ba dáng repo thử thoát 0, 1 hoặc 2, không dấu vết ngăn xếp; số đo trên các bản sao ghi
    ở `docs/trials/reusable-store-on-copies.md`.
17. **Lõi không nêu tên thư viện,** và mọi thứ dưới `plugins/` bằng tiếng Anh: các bài kiểm hiện có xanh.
18. **`make check` xanh** với các bài kiểm của plugin không bị bỏ qua.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Hợp đồng sổ đổi:

- thêm sổ thứ mười ba, `sources`, mỗi nguồn một tệp ở `design/sources/`;
- sổ nhập kho giữ hình dạng 1, thêm các khoá tuỳ chọn ở phần A1;
- hàng chờ thêm hai loại mục, `need:<key>` và `block:<need>`, và khoá `candidates` trên một câu (hàng chờ không phải
  sổ của hợp đồng; quyết định 0043 giữ nguyên điều đó);
- plugin thêm `references/starter.json`, bảng nhu cầu của bộ khởi đầu.

Bảng từ vựng thêm các tên ở phần A3.

## Plan

| Bước | Nhánh và PR                       | Mục kế hoạch | Việc                                                                      | Cần chủ repo                                   |
| ---- | --------------------------------- | ------------ | ------------------------------------------------------------------------- | ---------------------------------------------- |
| 0    | Nhánh này                         | 3.0          | Đề bài này                                                                | Đã duyệt 2026-11-19                            |
| 1    | Sổ nguồn ngoài, khoá mới, từ vựng | 3.1          | Hình dạng, bộ đọc, phép kiểm, `contract.md`, bảng từ vựng, `starter.json` | Duyệt PR                                       |
| 2    | Đổi tên script của `audit`        | 3.4          | Phần một của 3.4                                                          | Duyệt PR                                       |
| 3    | `find`                            | 3.2          | Lệnh, skill, bài kiểm, đo trên bản sao                                    | Cho đọc lại hai repo của giai đoạn 2; duyệt PR |
| 4    | `inventory`                       | 3.4          | Lệnh, sáu phát hiện, dòng «xong khi» thứ hai, trang thử                   | Duyệt PR                                       |
| 5    | `intake`                          | 3.3          | Lệnh, `before` cho ứng dụng mẫu, khối đầu tiên, dòng «xong khi» thứ nhất  | Đáp một câu chờ; cho phép nếu khối cần gói mới |
| 6    | `change`                          | 3.5          | Lệnh, tác động, cho nghỉ và gộp                                           | Duyệt PR                                       |
| 7    | Đóng giai đoạn                    | —            | Chạy hai dòng «xong khi», ghi ngày và bằng chứng vào `closed`             | Lời của chủ repo                               |

Sau bước 5, nếu chủ repo muốn: một lượt thử độc lập với vai «nhập kho» (đề bài 0002, mục Test plan), và một lần áp lên
repo thật (câu hỏi 9).

Gãy khi nâng cấp, biết trước:

- **Ai gọi `scripts/inventory.mjs` theo tên** sẽ nhận thoát 2 ở bản đổi tên, rồi một lệnh khác ở bản có mục 3.4. Trong
  kho này và các kho bên cạnh, không bên nào ngoài năm tệp đã kê, và một hồ sơ của repo kiểm chứng đã ghim commit; ghi chú phát hành nói điều
  đó.
- **Repo đã có thư mục `design/sources/` với hình dạng khác** sẽ thấy cổng đỏ khi lên đời; `upgrade` nói trước và dừng.
- **Repo kiểm chứng** giữ `tao-tay` và `khoi_co_truoc` (mỗi mục có `ten`, `ho_so`, `commit`, `ngay`, `vi_sao`); nó cần
  thêm vài chữ ở `_shared.yaml` (`values`, và `before: khoi_co_truoc`, `why: vi_sao` trong `keys`) để các lệnh mới đọc
  đúng. Đó là việc ở repo ấy, chỉ làm khi chủ repo cho phép.

## Test plan

Mỗi phép kiểm mới phải được thấy đỏ trên một repo thử bị đổi trước khi xanh.

| Phép kiểm                                 | Thấy đỏ khi                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| Tệp nguồn đúng hình dạng                  | Tên tệp khác `id`; thiếu `pin`; `order` không phải số                         |
| Bản chụp khớp bản ghim                    | Sửa một byte của bản chụp: nguồn bị nói không đọc được, mục không được đưa ra |
| `find` dừng ở tầng gần nhất               | Cùng một mục ở kho của repo và ở nguồn ngoài: kết quả phải từ kho của repo    |
| `find` không dừng vì gần khớp             | Lời tra chỉ trùng một phần từ: không thoát 0                                  |
| Sáu phát hiện                             | Mỗi chỗ cài ở bảng phần C; gỡ thì mất                                         |
| Khung là một bên dùng                     | Bỏ khung khỏi phép đếm: `app-frame` của ứng dụng mẫu bị báo `unused`          |
| `intake` không ghi tên người khi chưa đáp | Gọi lần hai trước lời đáp: không có dòng sổ                                   |
| `intake` bậc 1                            | Khối đã có: không tệp nào đổi, không câu chờ mới                              |
| `intake` không chạy dòng `install`        | Bộ chặn mạng và bộ chặn tiến trình con: không gì bị gọi                       |
| `change` không xoá, không sửa mã màn      | Băm của `src/` trước và sau bằng nhau                                         |

Bài kiểm của plugin chạy trên repo dựng tạm. Phép đo trên repo thật chạy trên bản sao trong thư mục nháp, không bao giờ
ghi vào repo thật, và thành một lệnh để đo lại được.

## Autonomy tier

Máy tự làm trong kho này sau khi chủ repo duyệt đề bài, theo thứ tự ở mục Plan, mỗi bước một PR; gộp là lời của chủ
repo. Chọn ứng viên cho khối mới, giữ danh sách `before`, cho nghỉ hay gộp một khối: luôn là lời đáp của chủ repo qua
`decide`. Áp bất cứ điều gì lên một repo thật cần chủ repo cho phép riêng, từng bước. Không sửa repo kiểm chứng,
delivery-loop, Repo Standards.

## Open questions

Mỗi câu kèm một khuyến nghị. Chủ repo đáp cả mười câu theo khuyến nghị ngày 2026-11-19
(«Duyệt cả mười»).

1. **Thêm mục 3.0 vào kế hoạch cho đề bài này, như 8.0?** Khuyến nghị: thêm. Kế hoạch là của chủ repo, nên máy chưa sửa
   `docs/plan/plan.json`; hai commit đầu của đề bài phục vụ 3.1. Đã thêm 3.0 khi chủ repo duyệt.
2. **Đổi tên script của `audit` thành `audit.mjs` trước, giữ một tệp nhỏ thoát 2 ở tên cũ cho tới 3.4?** Khuyến nghị:
   có. Làm cùng lúc với 3.4 thì có một bản mà cùng lời gọi `--json` trả một kết quả khác mà không báo.
3. **Sổ nguồn ngoài mỗi nguồn một tệp JSON ở `design/sources/`, bản ghim ghi tại chỗ hoặc trỏ tới tệp ghim sẵn có, và
   plugin không bao giờ dùng mạng?** Khuyến nghị: có.
4. **Dựng `inventory` trước `intake`, ngược thứ tự kê trong kế hoạch?** Khuyến nghị: có, vì lý do ở mục «Thứ tự dựng».
   Khó đảo: thấp.
5. **Ứng viên được chọn qua `decide`, không qua `intake --choose N` như đề bài 0004 viết?** Khuyến nghị: qua `decide`, để
   tác tử không tự chọn thay người, và tên người cùng ngày chỉ được ghi ở một chỗ.
6. **Ở giai đoạn này, ứng viên được trình bằng chữ và trang của nó trong nguồn, chưa bằng ảnh?** Tài liệu kiến trúc nói
   «bằng ảnh». Vẽ ứng viên của nguồn ngoài cần mạng và trình duyệt. Khuyến nghị: bằng chữ và đường dẫn ở giai đoạn này,
   mở dòng giới hạn, và vẽ ứng viên ở giai đoạn 4 cùng nền dựng thứ hai.
7. **Khối mới không phải «việc của chủ repo» làm tác tử dừng?** Biên chủ repo đã chốt ở đề bài 0005 chỉ có khuôn mới và
   màu thương hiệu. Khuyến nghị: tác tử đi tiếp theo ứng viên khuyên, câu nằm ở hàng chờ, và dòng sổ chỉ được ghi sau lời
   đáp; trong lúc chờ, kiểm kê báo khối ấy là `unrecorded`.
8. **`change --to` và `change --migrate` để sang bên, gắn giai đoạn 4?** Khuyến nghị: có. Chúng đổi quyết định và sửa
   mã màn, không thuộc kho; giai đoạn 3 dựng `--retire` và `--merge-into`.
9. **Áp lên repo thật có cần để đóng giai đoạn 3 không?** Hai dòng «xong khi» đo trên ứng dụng mẫu và repo thử. Khuyến
   nghị: không cần để đóng. Sau bước 5, máy đo trên bản sao của repo kiểm chứng và trình kết quả; chủ repo quyết có đưa
   một khối vào repo ấy qua `intake` hay không, trên nhánh riêng có hồ sơ, từng bước. Đó là lúc hỏi phép «áp vào một repo
   thật» mà kế hoạch nêu.
10. **Sáu loại phát hiện đọc theo bảng ở phần C, kể cả `before` cho thứ có từ trước sổ và `promote` chỉ trong một
    repo?** Khuyến nghị: có. Bảng ấy là cách đọc của máy cho sáu câu ngắn của đề bài 0004; mỗi dòng của nó thành một
    phép kiểm hai chiều.
