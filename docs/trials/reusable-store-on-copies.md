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
  thì không đưa ra (quyết định 0059, mục 5).
- **Repo web ngoài họ và repo nhiều gói** không có linh kiện ở `src/components/` tầng trên cùng, như `audit` đã thấy ở giai
  đoạn 2: dòng giới hạn `audit-workspace-reads-top-src-only` nay nói cả `find`. Repo nhiều gói có một trang kiểu màn; không
  lời tra nào khớp nó. Bộ khởi đầu không đưa mục nào ở hai repo này vì chúng thiếu bộ chuyển `components` ở chỗ nó tìm.
