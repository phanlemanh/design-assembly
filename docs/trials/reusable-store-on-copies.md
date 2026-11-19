# Lệnh `find` trên bản sao của bốn repo

Chạy ngày 2026-11-19, trong lúc dựng mục 3.2. Đây là phép đo của tiêu chí 6, 7 và 16 trong đề bài 0006 cho lệnh `find`:
trên bản sao của repo thật, mọi lần gọi thoát 0 hoặc 1 và không in dấu vết ngăn xếp; gọi hai lần cho cùng JSON; cây thư
mục, kể cả tệp git bỏ qua, không đổi. Chủ repo cho sao chép ba repo ngoài kho này ngày 2026-11-19 («Cho cả ba»). Các mục
3.3 tới 3.5 ghi số đo của lệnh mình vào trang này.

## Làm gì

- **Lệnh đo:** `node docs/trials/reusable-store-on-copies.mjs --app --reference ~/dev/onehub-inventory --web
~/dev/floorplanstudio --workspace ~/dev/crm`. Lệnh tự clone từng repo vào thư mục tạm của máy, chạy `find.mjs` của kho
  này trên bản sao, rồi xoá bản sao. Không lệnh nào ghi vào repo thật.
- **Bốn repo:** ứng dụng mẫu (kho này, commit `f3793d2`); repo kiểm chứng Inventory (`c79189dd`); floorplanstudio, repo
  web ngoài họ (`b86020f`); crm-onehub, repo nhiều gói cùng họ (`74a29a68d`).
- **Năm lời tra:** một nhu cầu bằng tiếng Anh («many rows»), cùng nhu cầu ấy bằng tiếng Việt như repo kiểm chứng viết
  («bảng nhiều dòng»), một tên linh kiện («data table»), một đầu trang («page header»), và một chữ chỉ danh mục ngoài có
  («gantt»).
- **Nguồn ngoài:** repo kiểm chứng chưa có `design/sources/`. Trên bản sao, lệnh đo thêm một tệp nguồn `reui.json` với
  `pin_file` trỏ thẳng vào `tools/reui_catalog/pin.json`, `snapshot` vào `tools/reui_catalog/snapshot`, `catalog` vào
  `design/reui-catalog.json`, rồi thêm một byte vào bản chụp để xem nguồn thành không đọc được.

## Kết quả

| Repo              | Lời tra         | Thoát | Hai lần như nhau | Trả lời gần nhất           | Khớp | Gần | Kho đã đọc                                              | ms  |
| ----------------- | --------------- | ----- | ---------------- | -------------------------- | ---- | --- | ------------------------------------------------------- | --- |
| Ứng dụng mẫu      | many rows       | 1     | có               | không                      | 0    | 0   | components, screen-kinds, starter                       | 66  |
| Ứng dụng mẫu      | bảng nhiều dòng | 1     | có               | không                      | 0    | 1   | components, screen-kinds, starter                       | 65  |
| Ứng dụng mẫu      | data table      | 1     | có               | không                      | 0    | 5   | components, screen-kinds, starter                       | 69  |
| Ứng dụng mẫu      | page header     | 1     | có               | không                      | 0    | 4   | components, screen-kinds, starter                       | 66  |
| Ứng dụng mẫu      | gantt           | 1     | có               | không                      | 0    | 0   | components, screen-kinds, starter                       | 65  |
| Repo kiểm chứng   | many rows       | 1     | có               | không                      | 0    | 5   | intake, components, screen-kinds, starter, sources/reui | 411 |
| Repo kiểm chứng   | bảng nhiều dòng | 0     | có               | DataRegion (intake)        | 2    | 5   | intake, components, screen-kinds                        | 301 |
| Repo kiểm chứng   | data table      | 0     | có               | DataGridTable (components) | 5    | 5   | intake, components, screen-kinds                        | 311 |
| Repo kiểm chứng   | page header     | 0     | có               | PageHeader (intake)        | 1    | 5   | intake, components, screen-kinds                        | 322 |
| Repo kiểm chứng   | gantt           | 0     | có               | gantt (sources/reui)       | 5    | 0   | intake, components, screen-kinds, starter, sources/reui | 406 |
| Repo web ngoài họ | (cả năm)        | 1     | có               | không                      | 0    | 0   | starter                                                 | ~40 |
| Repo nhiều gói    | (cả năm)        | 1     | có               | không                      | 0    | 0   | screen-kinds, starter                                   | ~42 |

- Cả bốn bản sao giữ nguyên cây thư mục sau mười lần gọi.
- **Nguồn ngoài của repo kiểm chứng đọc được qua tệp ghim của chính nó.** Tệp nguồn qua phép kiểm hình dạng; bản chụp khớp
  `sha256` của cả hai tệp; bộ đọc đưa ra 1 969 mục (678 khối, 27 linh kiện, 1 264 ví dụ), đúng số đề bài 0006 ghi. Thêm
  một byte vào `llms-full.txt` thì `find gantt` không đưa mục nào của nguồn ấy, và nói: «tools/reui_catalog/snapshot/
  llms-full.txt is not the file it was pinned with: its sha256 differs from the pin». Đây là điều quyết định 0057 còn ghi
  «chưa đo».

## Đọc kết quả

- **Repo kiểm chứng trả lời từ kho của chính nó.** «bảng nhiều dòng» tới khối `DataRegion` qua khoá nhu cầu
  `bang-nhieu-dong`, nhờ bỏ dấu khi so; kèm 20 thuộc tính và bảy màn đang dùng. «gantt» không có trong kho của repo nên
  tới nguồn ngoài, kèm bản ghim và trang.
- **«many rows» không khớp ở repo kiểm chứng,** vì mọi nhu cầu và mô tả ở đó viết bằng tiếng Việt: dòng giới hạn
  `find-matches-words-not-meaning`.
- **Ứng dụng mẫu chưa có sổ nhập kho và chưa ghim nguồn nào,** nên chỉ kho linh kiện, trang kiểu màn và bộ khởi đầu được
  đọc. «data table» không khớp vì không tên linh kiện nào có chữ «data»; năm linh kiện gần khớp được kê.
- **Ở lần đo đầu, «data table» trên ứng dụng mẫu đưa `TableActions` của bộ khởi đầu** (mô tả của nó có cả hai chữ), trong
  khi ứng dụng mẫu đã cài `table-actions.tsx`. Đã sửa trước lần đo này: mục bộ khởi đầu mà repo đã có linh kiện cùng tên
  thì không đưa ra (quyết định 0060, mục 5).
- **Repo web ngoài họ và repo nhiều gói** không có linh kiện ở `src/components/` tầng trên cùng, như `audit` đã thấy ở giai
  đoạn 2: dòng giới hạn `audit-workspace-reads-top-src-only` nay nói cả `find`. Repo nhiều gói có một trang kiểu màn; không
  lời tra nào khớp nó. Bộ khởi đầu không đưa mục nào ở hai repo này vì chúng thiếu bộ chuyển `components` ở chỗ nó tìm.

## Lệnh `inventory`

Chạy ngày 2026-11-19, trong lúc dựng mục 3.4, bằng cùng lệnh đo: trên mỗi bản sao, sau năm lời tra của `find`, lệnh đo
gọi `inventory --json` hai lần. Chủ repo cho sao chép lại ba repo ngoài kho này cho phép đo này ngày 2026-11-19 («Cho cả
ba»). Ứng dụng mẫu ở commit `67603ba`; ba repo kia ở cùng commit như trên.

| Repo              | Thoát | Hai lần như nhau | Mảnh theo trạng thái    | Phát hiện                      | Không xét                                                              | ms  |
| ----------------- | ----- | ---------------- | ----------------------- | ------------------------------ | ---------------------------------------------------------------------- | --- |
| Ứng dụng mẫu      | 0     | có               | 47 đang dùng, 18 không  | không                          | `unrecorded`, `duplicate`, `outdated`, `modified`                      | 57  |
| Repo kiểm chứng   | 0     | có               | 232 đang dùng, 66 không | 12 `unrecorded`, 1 `duplicate` | `outdated`, `modified`                                                 | 270 |
| Repo web ngoài họ | 0     | có               | không có mảnh nào       | không                          | `unused`, `unrecorded`, `promote`, `duplicate`, `outdated`, `modified` | 36  |
| Repo nhiều gói    | 0     | có               | không có mảnh nào       | không                          | `unused`, `unrecorded`, `promote`, `duplicate`, `outdated`, `modified` | 36  |

- Cả bốn bản sao giữ nguyên cây thư mục sau mười hai lần gọi.
- **Ứng dụng mẫu lành:** không phát hiện nào, và `inventory --target . --strict` thoát 0 (tiêu chí 9). Mười tám mảnh không
  dùng đều là linh kiện của thư viện, chỉ được đếm. `AppFrame` chỉ có khung với tới (`index.html` tải `src/main.tsx`,
  tệp ấy nhập `App.tsx`), và được tính là đang dùng. Ứng dụng mẫu chưa có sổ nhập kho, nên bốn loại cần sổ được kê ở
  «không xét».
- **Repo kiểm chứng:**
  - **12 `unrecorded`** là mười hai tệp ở `src/components/candidate/` và `src/components/templates/` mà các màn đang
    dùng, chẳng hạn `app-shell.tsx`, `nav-menu.tsx`, `region-state.tsx`. Sổ khối không có dòng cho chúng, và
    `khoi_co_truoc` không kê chúng. Đây là điều lệnh đo được về repo ấy, không phải một phép đạt; chủ repo đọc và quyết.
  - **1 `duplicate`:** `listing-record.tsx` và `listing-record-full.tsx` cùng ghi là mục `solution-crm-4` của nguồn
    `reui`.
  - **`outdated` và `modified` không xét được,** vì khối của repo ấy chưa có `pin` và `taken`.
- **Lần đo đầu bắt được một lỗi, đã sửa có bài kiểm.** Repo kiểm chứng viết «tạo tay» là `tao-tay` và chưa khai bằng
  `values`, nên chín khối tạo tay bị gom thành một nhóm «cùng lấy mục `tao-tay` hai lần». Nay hai khối chỉ được coi là
  cùng một mục khi danh mục của một nguồn đọc được thật sự có mục ấy (quyết định 0061).
- **Repo web ngoài họ và repo nhiều gói** không có sổ màn và không có sổ nhập kho, nên lệnh chỉ đếm. Không có linh kiện
  nào ở `src/components/` tầng trên cùng: dòng giới hạn `audit-workspace-reads-top-src-only` nay nói cả `inventory`.

## Lệnh `intake`

Đo ngày 2026-11-19, trên cùng các bản sao, sau `find` và `inventory`, vì `intake` ghi: lệnh chỉ ghi vào bản sao. Chủ repo
cho đo trên ba repo ngoài kho này: «Cho cả ba». Mỗi bản sao được hỏi bốn lần, lần nào cũng xem trước hai lần rồi mới chạy
thật:

- ba nhu cầu: `many-rows`, `bang-nhieu-dong` (chữ của repo kiểm chứng), `gantt-chart` (chỉ một danh mục ngoài có);
- những gì có trước sổ: `--before`.

| Repo              | Hỏi                        | Thoát | Bậc     | Ứng viên        | Tệp đổi trên bản sao                         | Xem trước kê đúng | Ngoài hàng chờ |
| ----------------- | -------------------------- | ----- | ------- | --------------- | -------------------------------------------- | ----------------- | -------------- |
| Ứng dụng mẫu      | `many-rows`                | 1     | by-hand | by-hand         | `design/waiting/intake-many-rows.json`       | có                | không          |
| Ứng dụng mẫu      | `bang-nhieu-dong`          | 1     | by-hand | by-hand         | `design/waiting/intake-bang-nhieu-dong.json` | có                | không          |
| Ứng dụng mẫu      | `gantt-chart`              | 1     | by-hand | by-hand         | `design/waiting/intake-gantt-chart.json`     | có                | không          |
| Ứng dụng mẫu      | `--before`                 | 0     | before  | bảy, đã được kê | không                                        | có                | không          |
| Repo kiểm chứng   | `many-rows`, `gantt-chart` | 2     | -       | -               | không                                        | có                | không          |
| Repo kiểm chứng   | `bang-nhieu-dong`          | 0     | store   | -               | không                                        | có                | không          |
| Repo kiểm chứng   | `--before`                 | 2     | -       | -               | không                                        | có                | không          |
| Repo web ngoài họ | ba nhu cầu                 | 1     | by-hand | by-hand         | một câu chờ cho mỗi nhu cầu                  | có                | không          |
| Repo web ngoài họ | `--before`                 | 1     | before  | không           | không                                        | có                | không          |
| Repo nhiều gói    | ba nhu cầu                 | 1     | by-hand | by-hand         | một câu chờ cho mỗi nhu cầu                  | có                | không          |
| Repo nhiều gói    | `--before`                 | 1     | before  | không           | không                                        | có                | không          |

Bản sao của ứng dụng mẫu lấy từ commit `dbf0595` của nhánh mục 3.3, nơi ứng dụng mẫu đã có sổ nhập kho. Ba repo kia ở
đúng các commit của mục `find`.

- **Ứng dụng mẫu:** `--before` không còn gì để kê, vì bảy linh kiện đã ở `before` qua lời đáp của chủ repo. Ba nhu cầu
  mới chỉ có «by-hand», vì bộ khởi đầu không có mảnh nào cho chúng. Kiểm kê trên cùng bản sao không có phát hiện nào, và
  không còn loại nào ở «không xét».
- **Ở mọi bản sao:** mọi lần gọi thoát 0, 1 hoặc 2, không có dấu vết ngăn xếp. Hai lần xem trước cho cùng JSON. Các tệp
  lần xem trước kê đúng là các tệp lần chạy thật ghi, và không tệp nào nằm ngoài `design/waiting/`.
- **Repo kiểm chứng trả lời bậc 1 qua chữ của chính nó.** `bang-nhieu-dong` là khoá nhu cầu của một khối trong sổ khối của
  repo ấy, nên lệnh in khối ấy, không ghi gì và thoát 0.
- **Repo kiểm chứng không nhận câu hỏi nào:** công cụ của nó là bản 0.7.1. Công cụ ấy đọc câu có ứng viên thành lỗi, nên
  cổng của repo sẽ đỏ. Lệnh thoát 2, không ghi gì, và bảo `upgrade` trước. Lên đời repo ấy là việc của chủ repo, chỉ khi
  chủ repo cho phép.
- **Hai repo của giai đoạn 2 chưa nhận plugin.**
  - Bộ khởi đầu không áp dụng ở đó, và không có nguồn ngoài nào được ghim. Vì vậy mỗi nhu cầu chỉ có «by-hand», và mỗi
    nhu cầu ghi đúng một câu chờ.
  - Lệnh ghi kèm một ghi chú: không cổng nào giữ sổ nhập kho và hàng chờ cho tới khi repo nhận plugin.
  - `--before` không đề xuất gì, vì hai repo ấy không có sổ màn, nên lệnh không biết màn nào dùng linh kiện nào.

## Lệnh `change`

Đo ngày 2026-11-19, trên cùng các bản sao, sau `intake`. Chủ repo cho đo trên ba repo ngoài kho này: «Cho cả ba». Trên mỗi
bản sao, lệnh được hỏi cho nghỉ khối đầu tiên còn dùng trong sổ nhập kho: xem trước hai lần, rồi chạy thật. Lệnh chỉ có
thể hỏi; không ai trả lời thay chủ repo.

<!-- change-table -->

- **Ở mọi bản sao:** hai lần xem trước cho cùng JSON. Các tệp mà bản xem trước kê đúng là các tệp lần chạy thật ghi, và
  không tệp nào nằm ngoài `design/waiting/`.
- **Repo kiểm chứng thoát 2 và không ghi gì,** vì công cụ của nó là bản 0.7.1, đọc câu về một khối thành lỗi. Trên bản sao,
  dấu bản công cụ được tạm bỏ cho một lần xem trước rồi đặt lại, để đọc được tác động. Đó là bước dựng của phép đo, không
  phải điều lệnh làm. Kết quả:
  - cho nghỉ khối `bang-nhieu-dong` chạm tới bảy màn: `inventory`, `members`, `proto`, `proto-bo-nut`, `sent`, `today`,
    `tuy-chinh-san`;
  - có 25 dòng `import` nêu tệp của khối, phần lớn ở `src/modules/listings/ui/` và `src/modules/sharing/ui/`;
  - không phép kiểm nào nêu tệp ấy;
  - không linh kiện nào ở thư mục linh kiện nhập nó. Những tệp nhập nó nằm ở `src/modules/` và `src/app/`.
- **Hai repo của giai đoạn 2** chưa có sổ nhập kho, nên không có khối nào để đổi. Lệnh thoát 2 và nói vì sao.
