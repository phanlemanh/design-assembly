# Chạy thử lần 12: một lượt dựng màn có phiếu brief (mục 5.4)

Một lượt, ngày 2026-11-21. Chủ repo cho chạy («Cho chạy») sau khi nghe ước tính: khoảng 250 đến 350 nghìn token cho
tác tử dựng, 350 đến 550 nghìn tất cả, 20 đến 60 phút. Lời cho chạy chỉ gồm một lượt vai dựng màn trên đề chuẩn; không
có nhánh đối chứng, không có vai dẫn dắt hay vai nhận.

Đây là lần đầu tác tử dựng màn có lệnh `brief` (mục 5.1) và trang luật mở đầu bằng điều chủ repo đã chốt (mục 5.5). Lần
trước của vai này là lần 11, ngày 2026-11-18, ghi ở [`stage-8-done-when.md`](stage-8-done-when.md), mục «Chạy thử lần
11».

**Kết luận ngắn:** cổng xanh, tác tử không dừng hỏi lần nào và chạy phiếu trước khi dựng. Sau khi kiểm còn 11 chỗ phải
đoán, so với 9 ở lần 11. Chỉ 2 trong 11 chỗ vào hàng chờ, so với 6 trên 9 ở lần 11. Tác tử xếp đúng ba ô còn mở của
phiếu và không hỏi thêm câu nào của riêng nó.

## Bản sao

- **Nguồn:** clone kho này vào thư mục nháp của phiên, ở `ec6eba9`, là `main` lúc bắt đầu, plugin 0.24.0. Nhánh
  `trial/screen`.
- **Checkout thưa** bỏ đúng danh sách của [`README.md`](README.md): `plugins/`, `docs/`, `wiki/decisions/`,
  `wiki/specs/`, `tests/plugin-*`, `mk/plugin.mk`.
- **Bỏ phần kế hoạch như lần 11:** bỏ `mk/plan.mk`, mục «The plan» của `AGENTS.md`, dòng `make plan` và dòng
  `docs/plan/` trong bản đồ dự án. Dòng `tools/` vẫn nhắc «the plan tool». Tệp `tools/plan.mjs` còn đó nhưng không lệnh
  nào chạy nó.
- **Bỏ hồ sơ của bộ kit nghiệm thu:** `_acceptance/`, `LO-TRINH.html`, `PRODUCT-MAP.md`. Lý do:
  `_acceptance/bang-nang-luc-o-cam/` là hợp đồng, bằng chứng và quyết định của mục 5.0. Hồ sơ ấy nêu các lệnh của plugin
  và ổ cắm của chúng, trong đó có `brief`. Hai tệp kia được vẽ lại từ chính hồ sơ ấy. Lần 11 không phải bỏ chúng vì lúc
  đó chúng chưa có.
- **Gỡ các dòng trỏ tới trang đã bỏ:** 83 dòng của `wiki/index.md` (hai mục Specs và Decisions) và 145 dòng của
  `wiki/log.md`. Trong 145 dòng có hai dòng trỏ tới `mk/plugin.mk`, mà lượt gỡ đầu bỏ sót: lần chạy cổng thứ hai đỏ ở
  `wiki-lint` vì chúng. Prettier được chạy lại trên hai trang sau khi gỡ.
- **Git:** bỏ remote, giữ một nhánh `main` tại chỗ ở `ec6eba9`, vì hai phép kiểm của sổ quyết định so nhánh với `main`.
  Các nhánh khác đều bỏ. Lịch sử git vẫn ở trong bản sao. Đề cấm tìm phần đã bỏ, và danh sách lệnh của tác tử không có
  lệnh nào đọc lịch sử, nhưng tác tử có chạy `git sparse-checkout list`, lệnh in tên những gì đã bỏ.
- **Gói cài:** nối `node_modules` của bản checkout chính bằng một liên kết, ghi vào `.git/info/exclude`.
- **Xanh trước khi bắt đầu:** `make check` đạt sau hai lần sửa bản sao (Prettier, rồi hai dòng sổ trỏ tới
  `mk/plugin.mk`). Lần đạt gồm lint, typecheck, 89 bài đơn vị, sổ wiki, 39 quyết định giữ bằng 48 phép kiểm, các chốt
  thiết kế và 76 bài trình duyệt. Mọi điều trên nằm trong một commit, `c893524`.

## Hai lối chạy lệnh của plugin

Bản sao không có plugin, trong khi trang luật bảo tác tử chạy `/design-assembly:brief <screen id>` và
`/design-assembly:decide --ask …`. Như lần 11 đã làm cho `decide`, phiên điều phối đặt hai tệp chạy ngoài bản sao, trong
thư mục nháp, mỗi tệp một dòng:
`exec node <kho này>/plugins/design-assembly/scripts/<brief|decide>.mjs "$@" --target <bản sao>`.

Lời thêm vào sau đề chuẩn, nguyên văn, chỉ có chừng này (đường dẫn viết tắt ở đây):

> Your repository is at: `<thư mục nháp>/trial-12/copy`
>
> It has no plugin installed. Where a page of it tells you to run `/design-assembly:brief` or `/design-assembly:decide`,
> run these two instead, with the same arguments after them: `<thư mục nháp>/trial-12/bin/brief` and
> `<thư mục nháp>/trial-12/bin/decide`. Run them; do not read them.

Đề chuẩn [`briefs/screen.md`](briefs/screen.md) được đưa nguyên văn, từ tiêu đề tới câu cuối. Tác tử là một tác tử con
mới, kiểu `general-purpose`, chạy bằng mô hình của phiên điều phối lúc ấy (Opus 5.5). Nó không nhận gì khác. Không ai
nói với nó về lệnh `brief`. Plugin không đổi trong lúc nó chạy.

## Lượt chạy

Bắt đầu lúc 06:21, xong lúc 06:35, qua 40 lần gọi công cụ:

| Bước                                                                                        | Lần gọi |
| ------------------------------------------------------------------------------------------- | ------- |
| Đọc `AGENTS.md`, wiki, mô hình dữ liệu, trang hành vi, trang kiểu màn, mã màn, các bài kiểm | 1–12    |
| Chạy `bin/brief` không đối số để xem cách gọi                                               | 11      |
| `make check` trên bản sao chưa đổi                                                          | 13      |
| Thêm trường `archived` và ba hành động vào `ontology/`, chạy `make gen`                     | 15      |
| Ghi màn mới vào sổ màn, `status: planned`, rồi chạy `brief archive`                         | 16      |
| Chạy lại phiếu, lưu ra tệp; rồi `brief archive --queue`                                     | 17–18   |
| Dựng: phần dùng chung, màn chính, màn mới, sổ màn trong mã                                  | 26–33   |
| Lint, bài kiểm, sửa các bài kiểm cũ cho nút «⋯»                                             | 34–38   |
| Wiki, một dòng sổ lỗi lọt, `make check` cuối                                                | 39–40   |

Tác tử không dừng hỏi người lần nào, nên không câu niêm phong nào trong `answers/screen/` được mở. Cũng không có câu
mới phải ghi thành tệp.

## Số đo, đặt cạnh lần 11

| Đo gì                                       | Lần 11                                                                | Lần 12                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Cổng lúc tác tử nói xong                    | xanh                                                                  | xanh; phiên điều phối chạy lại `make check`: 112 bài đơn vị, 128 bài trình duyệt |
| Số lần dừng hỏi người                       | 0                                                                     | 0                                                                                |
| Chỗ tác tử khai là tự quyết                 | 18                                                                    | 22                                                                               |
| **Chỗ phải đoán, sau khi kiểm**             | **9**                                                                 | **11**                                                                           |
| … vào hàng chờ / tự quyết lặng lẽ           | 6 / 3                                                                 | 2 / 9                                                                            |
| Câu tác tử xếp vào `design/waiting/`        | 6, bằng `decide --ask`                                                | 3, bằng `brief --queue`; 0 bằng `decide --ask`                                   |
| Lời đáp tác tử ghi thay chủ repo            | 0                                                                     | 0                                                                                |
| Dòng tác tử thêm vào sổ lỗi lọt của bản sao | 1                                                                     | 1                                                                                |
| Tệp tác tử không được đụng                  | không đổi: `src/lib/notify.ts`, `src/components/ui/`, `tools/`, `mk/` | không đổi: cũng bốn chỗ ấy, cộng `tests/e2e/floor.spec.ts` và `.claude/`         |

Một trong ba câu xếp vào hàng chờ, ô 8, không ứng với một chỗ phải đoán (xem dòng 19 ở bảng đếm). Vì vậy 3 câu trên hàng
chờ chỉ ứng với 2 chỗ.

Bài làm của tác tử được giữ trong bản sao ở commit `e6740a9`. Bản sao nằm ngoài kho và không được giữ lại.

## Phiếu brief: điều lần này đo lần đầu

- **Có chạy phiếu không, và lúc nào:** có, ba lần, cả ba trước khi viết dòng mã màn nào: lần gọi 16, 17 và 18. Nhưng
  lần đầu chạy sau khi tác tử đã đổi mô hình dữ liệu (lần gọi 15). Tác tử không chạy phiếu cho màn chính, dù có đổi màn
  này, và không chạy lại sau khi dựng. Trang luật bảo chạy phiếu «trước khi dựng hoặc đổi một màn»; dòng sổ giới hạn
  `brief-run-before-building-unheld` đã ghi là không phép kiểm nào thấy điều này.
- **Có ghi màn mới vào sổ màn với `planned` trước không:** có. `design/screens/archive.yaml` được ghi với
  `status: planned` ngay trước lần chạy phiếu đầu, rồi chuyển thành `built` khi dựng xong.
- **Phiếu ở lần đầu và lần cuối của tác tử:** cả ba lần đều cho cùng một phiếu: 9 ô đã định, 0 ô đang hỏi, 3 ô còn mở.
  Ba ô mở là ô 8 (nguyên tắc và hướng đi), ô 11 (chỗ trong điều hướng) và ô 12 (các màn khác bị chạm). Lần thứ ba có
  `--queue` và ghi ba câu vào hàng chờ. Phiên điều phối chạy lại phiếu sau khi dựng, chỉ đọc: màn mới có 10 ô đã định,
  2 ô đang hỏi, 0 ô còn mở, vì ô 11 nay đọc được từ `src/screens.ts`. Màn chính và màn «Quá hạn» mỗi màn 10 ô đã định
  và 2 ô còn mở.
- **Ô còn mở được xếp vào hàng chờ:** 3 trên 3. Tác tử xếp chúng bằng `brief --queue` chứ không bằng lời gọi in trên
  phiếu, vì lời gọi ấy trỏ ra ngoài bản sao (xem bảng điều tác tử báo).

**Ba chỗ lần 11 tự quyết lặng lẽ, và ô 10, 11, 12 có bắt được không:**

| Chỗ của lần 11                                | Ô                            | Lần này                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hình dạng khái niệm mới trong mô hình dữ liệu | 10, thay đổi mô hình dữ liệu | **Không bắt.** Tác tử thêm trường và hành động trước khi chạy phiếu, nên ô 10 đọc thấy «the row names nothing the data model lacks» và đã định. Chọn một cờ riêng hay thêm một giá trị tình trạng vẫn tự quyết lặng lẽ (dòng 2 ở bảng đếm). Ô này chỉ hỏi tên có trong mô hình hay chưa, không hỏi hình dạng.                    |
| Màn khác có nhận thao tác mới không           | 12, các màn khác bị chạm     | **Bắt được câu hỏi, không bắt được câu trả lời.** Câu hỏi vào hàng chờ, với khuyến nghị «không đổi màn nào khác». Tác tử làm ngược lại: màn chính nhận thao tác mới (đề đòi vậy), và nguồn dữ liệu của màn «Quá hạn» bỏ các mục đã cất. Tác tử không sửa câu hỏi, nên chủ repo đọc hàng chờ sẽ thấy điều ngược với điều đã dựng. |
| Chỗ của màn mới trong điều hướng              | 11, chỗ trong điều hướng     | **Bắt được.** Câu hỏi vào hàng chờ; màn được dựng theo khuyến nghị: đứng cuối, sau `/overdue`.                                                                                                                                                                                                                                   |

## Đếm từng chỗ

Luật đếm của [`README.md`](README.md): một chỗ là một lần tác tử phải chọn giữa hai cách hợp lệ mà không trang luật,
trang kiểu màn hay trang hành vi nào nói chọn cách nào. Phiên điều phối kiểm từng chỗ trên bản sao của tác tử.

| #   | Tác tử khai                                                                | Kiểm thấy                                                                                                                                                                              | Đếm                               |
| --- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1   | Tên khái niệm trong mã: `archived`, `archiveItem`, `restoreItem`           | Bảng thuật ngữ, `Item.yaml`, `actions.yaml` không có. Trang luật chỉ bảo thêm vào `ontology/` trước                                                                                    | giữ, lặng lẽ                      |
| 2   | Cờ riêng hay thêm một giá trị vào `status`                                 | Không trang nào nói. Đây là chỗ thứ nhất của lần 11                                                                                                                                    | giữ, lặng lẽ                      |
| 3   | Chữ tiếng Việt của khái niệm: «Lưu trữ», «Khôi phục»                       | Bảng thuật ngữ có cột tên hiển thị nhưng không có từ này; `design/terms.json` rỗng                                                                                                     | giữ, lặng lẽ                      |
| 4   | Mọi chữ mới khác: toast, lỗi, trạng thái trống                             | `design/behaviors.md` và trang luật nói mỗi câu phải nói gì; câu chữ cụ thể là việc viết, không phải chọn giữa hai cách                                                                | bỏ                                |
| 5   | Id, đường dẫn, khoá tiêu đề của màn                                        | `AGENTS.md` bắt định danh bằng tiếng Anh; màn «Quá hạn» cho mẫu `overdue`, `/overdue`, `overdueTitle`                                                                                  | bỏ                                |
| 6   | Màn «Quá hạn» bỏ các mục đã cất (gộp với dòng 18)                          | Không trang nào nói. Ô 12 hỏi chung «màn khác có đổi không» với khuyến nghị «không», và tác tử làm ngược                                                                               | giữ, hàng chờ (ngược khuyến nghị) |
| 7   | Gieo sẵn một mục đã cất vào dữ liệu mẫu                                    | Trang luật chỉ nói trạng thái đến từ điều kiện thật, chọn qua nguồn dữ liệu; cả hai cách đều qua luật                                                                                  | giữ, lặng lẽ                      |
| 8   | Màn chính giữ thao tác «Xoá»                                               | `nhan_viec` của `design/patterns/danh-sach.md` nói việc của màn danh sách gồm xoá mục; trang luật bắt mọi hành động được chào trên một màn                                             | bỏ                                |
| 9   | Kiểu nút trong danh sách của «⋯»: `ghost` và `destructive`                 | `row-actions.tsx` chỉ nói thứ tự (đảo được trước, xoá sau); trang hành vi không nói kiểu nút                                                                                           | giữ, lặng lẽ                      |
| 10  | Tên đọc của nút trong danh sách: «Lưu trữ X»                               | Luật chỉ nói tên của nút «⋯»                                                                                                                                                           | giữ, lặng lẽ                      |
| 11  | Chữ của trạng thái `saving` khi nút «⋯» chờ mà không có chữ                | Hai luật chọi nhau: sổ trạng thái cần chữ, nút không có chữ. Cách nào cũng không chứng được trạng thái. Đã có ở `spoken-only-state-unlisted` và `state-words-present-before-the-state` | giữ, lặng lẽ                      |
| 12  | Hình dạng phần dùng chung: hook ở `lib`, hộp thoại ở `components`          | Trang luật nói logic xuống một phần, phần vẽ dùng chung thành linh kiện của phần `shared` (`src/components/**` trong `design/parts.json`); tác tử làm đúng vậy                         | bỏ                                |
| 13  | Hoàn tác đưa dòng về chỗ cũ                                                | Trang luật: «An undo puts the thing back where it was»                                                                                                                                 | bỏ                                |
| 14  | Khai trạng thái nào                                                        | `design/states.json`, luật «thao tác làm ngay có trạng thái thất bại», và màn mẫu mà trang kiểu màn bảo chép                                                                           | bỏ                                |
| 15  | Tên kịch bản thử `fail-archive`, `fail-restore`                            | Theo mẫu `fail-create`, `fail-delete`, `fail-undo` của màn mẫu; trang kiểu màn bảo dựng như màn mẫu                                                                                    | bỏ                                |
| 16  | Cột `actions` của sổ màn có tính hành động chỉ có trên nút của toast không | Trang luật nói «the actions it has buttons for» mà không nói nút của toast có tính không                                                                                               | giữ, lặng lẽ                      |
| 17  | Chỗ trên thanh điều hướng                                                  | Ô 11 của phiếu, xếp vào hàng chờ, dựng theo khuyến nghị                                                                                                                                | giữ, hàng chờ                     |
| 18  | Làm ngược khuyến nghị của ô 12                                             | Màn chính buộc phải đổi vì đề đòi, nên phần ấy không còn hai cách. Phần còn lại là màn «Quá hạn», tức dòng 6                                                                           | gộp vào 6                         |
| 19  | Ô 8, nguyên tắc: xếp câu rồi dựng không có nguyên tắc                      | Không có lựa chọn nào giữa hai cách cho màn: phiếu nói ô mở thì hỏi, tác tử hỏi và làm theo khuyến nghị                                                                                | bỏ                                |
| 20  | Thông số của hành động mới (`kind`, `idempotent`, `agent`, `output`)       | `ontology/roles.yaml` nói không tác tử AI nào chạy ứng dụng, nên `agent: forbidden` có chỗ dựa. Chọn `update` hay `command` thì không trang nào nói                                    | giữ, lặng lẽ                      |
| 21  | Sửa các bài kiểm đang giữ quyết định cho chúng bấm «⋯» trước               | Trang luật: hai thao tác trở lên đi sau một nút, và trạng thái phía sau đến bằng cách bấm nút ấy rồi bấm thao tác. Luật tiêu điểm nói tiêu điểm về nút «⋯». Không còn cách thứ hai     | bỏ                                |
| 22  | Trạng thái trống không có liên kết                                         | Luật cho «nhiều nhất một» liên kết, nên không liên kết là hợp luật; một liên kết thì cổng đỏ (`empty-state-link-fails-the-gate`)                                                       | bỏ                                |

Giữ 11 chỗ: 1, 2, 3, 6 (gộp 18), 7, 9, 10, 11, 16, 17, 20. Trong đó 2 chỗ vào hàng chờ (6 và 17), 9 chỗ tự quyết lặng
lẽ.

**Chỗ phải phán đoán khi đếm**, để chủ repo thấy con số lung lay tới đâu:

- Dòng 1 và 3 tính hai chỗ: một là tên trong mã, một là chữ người đọc. Gộp làm một thì còn 10.
- Dòng 16 và 20 nhỏ. Bỏ cả hai thì còn 9, hoặc 8 nếu gộp thêm dòng 1 với 3.
- Dòng 6 tính là vào hàng chờ, vì câu hỏi đã tới chủ repo. Nhưng chủ repo sẽ đọc khuyến nghị ngược với điều đã dựng.
  Tính nó là lặng lẽ thì tỷ lệ thành 1 trên 11.

Đọc chặt nhất mà các trang còn đỡ được thì số chỗ phải đoán là 8 hoặc 9. Đọc theo cách lần 11 đã đếm thì là 11. Đọc
cách nào thì tỷ lệ vào hàng chờ cũng thấp hơn lần 11 nhiều: 2 trên 11 so với 6 trên 9.

## Điều tác tử báo, và kiểm thấy gì

| Điều tác tử báo                                                                               | Kiểm thấy                                                                                                                                                                                                                                                             | Ghi ở                                                                        |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `make check` xanh ở lần chạy đầu, có hai vòng sửa ở bước con trước đó                         | Đúng: phiên điều phối chạy lại, xanh, 112 bài đơn vị và 128 bài trình duyệt                                                                                                                                                                                           | bảng số đo                                                                   |
| Lời gọi «ask it» của phiếu trỏ ra ngoài bản sao, tới mã của plugin                            | Đúng, nhưng là do cách dựng lượt thử. Phiếu in đường dẫn của chính script nó chạy, ở đây là thư mục `plugins/` của kho này. Ở một repo có cài plugin, đường ấy là của plugin thật. Lời gọi vẫn để lộ chỗ đặt mã plugin trên máy, dù tác tử không chạy và không đọc nó | khác biệt của lượt thử, mục cuối                                             |
| Không ghi được trang `wiki/decisions/` vì bản sao không có thư mục ấy                         | Đúng, do bản sao bỏ thư mục ấy. Tác tử ghi lựa chọn vào trang thực thể và chú thích trong `Item.yaml`                                                                                                                                                                 | không ghi sổ                                                                 |
| Không có PR để nêu thay đổi mô hình dữ liệu                                                   | Đúng; tác tử nêu nó trong báo cáo                                                                                                                                                                                                                                     | không ghi sổ                                                                 |
| Trạng thái `saving` không được chứng: chữ nó khai đã có trên trang trước khi trạng thái tới   | Đúng: ở màn mới, `saving` khai bằng tên dòng, vốn hiện sẵn. Bài kiểm cũ của màn chính đổi từ «nút có chữ Đang xoá» sang «nút bị giữ», vì nút «⋯» không có chữ lúc chờ                                                                                                 | `spoken-only-state-unlisted`, `state-words-present-before-the-state` (đã có) |
| Ô 4 và ô 10 «đã định» chỉ vì chính tác tử đã viết sổ màn và mô hình trước khi chạy phiếu      | Đúng: lần gọi 15 đổi mô hình, lần 16 ghi dòng sổ màn rồi chạy phiếu. Phiếu không phân biệt nguồn tác tử vừa viết với nguồn đã có                                                                                                                                      | `brief-settled-by-rows-the-builder-wrote` (mới)                              |
| Đề nói app có một màn, kho có hai                                                             | Đúng, như lần 11. Đề giữ nguyên để không cắt chuỗi                                                                                                                                                                                                                    | không ghi sổ                                                                 |
| Ô 12 khuyến nghị «không đổi màn nào khác», trái với đề                                        | Đúng: phép đo của ô chỉ thấy các màn khác dùng chung `Item` và `deleteItem`, không thấy rằng màn chính cần hành động mới                                                                                                                                              | `brief-touched-screens-recommends-no-change` (mới)                           |
| `nhan_viec` của trang kiểu màn danh sách nói việc chính là thêm hoặc xoá, sai với màn lưu trữ | Đúng: ô 1 của phiếu đưa câu ấy lên như việc của chính màn mới, mà màn mới không thêm được mục nào                                                                                                                                                                     | `brief-kind-job-read-as-the-screens` (mới)                                   |

**Điều phiên điều phối thấy mà tác tử không báo:**

- Tác tử không hỏi câu nào của riêng nó, dù trang luật bảo hỏi mọi lựa chọn mà sổ, linh kiện và trang kiểu màn không
  định. Lần 11, không có phiếu, tác tử xếp 6 câu bằng `decide --ask`. Lần này nó xếp đúng ba ô mở của phiếu và tự quyết
  9 chỗ khác. Chỉ một lượt thì chưa nói được phiếu làm tác tử hỏi ít đi, nhưng đó là điều lượt này cho thấy. Ghi ở
  `brief-sheet-narrows-what-the-builder-asks` (mới, mức nặng).
- Câu của ô 12 nằm trên hàng chờ với khuyến nghị ngược điều đã dựng, và cổng vẫn xanh. Không gì so điều tác tử dựng với
  khuyến nghị nó đã xếp. Ghi ở `queued-recommendation-not-held-against-the-change` (mới).
- Tác tử không chạy phiếu cho màn chính, dù có đổi màn này. Đã có ở `brief-run-before-building-unheld`.
- Dòng `brief-not-tried-by-a-builder` nói chưa tác tử độc lập nào dựng màn từ phiếu. Điều ấy nay không còn đúng. Dòng sổ
  vẫn mở, vì một lượt chưa nói được phiếu có làm giảm số chỗ đoán không; lời của nó được viết lại cho đúng.

## Sau khi chạy

Theo mục «Sau khi chạy» của [`README.md`](README.md):

1. Mỗi điều tác tử báo đã được kiểm trên bản sao của nó (bảng trên).
2. Không sửa gì trong plugin: các phát hiện chỉ được ghi lại, còn sửa hay không là lời của chủ repo.
3. `plugins/design-assembly/references/limits.json` thêm năm dòng mới và viết lại lời một dòng. Năm dòng mới là
   `brief-sheet-narrows-what-the-builder-asks` (mức nặng), `brief-settled-by-rows-the-builder-wrote`,
   `brief-touched-screens-recommends-no-change`, `queued-recommendation-not-held-against-the-change` (mức vừa) và
   `brief-kind-job-read-as-the-screens` (mức nhẹ). Dòng viết lại là `brief-not-tried-by-a-builder`. Cả năm dòng mới ghi
   `plan: fix` như các dòng cùng loại của lệnh `brief`. Sổ ghi rằng chủ repo là người chốt hướng xử lý của từng dòng, nên
   `fix` ở đây chỉ là đề xuất, chờ chủ repo giữ hoặc đổi.
4. Sổ lỗi lọt `design/escapes.md` của kho này không thêm dòng. Hai lỗi lọt qua mọi phép kiểm chỉ có trên bản sao. Lỗi
   thứ nhất là trạng thái `saving` không được chứng: tác tử đã ghi nó vào sổ lỗi lọt của bản sao, và kho này chưa có màn
   nào để hai thao tác sau nút «⋯». Lỗi thứ hai là câu của ô 12 nằm trên hàng chờ ngược với điều đã dựng. Cả hai đều là
   giới hạn của plugin, nên đã ghi ở mục 3. Lần 11 cũng làm như vậy với lỗi chỉ có trên bản sao.
5. Đề bài `wiki/specs/0001-design-system-for-claude-code.md` có thêm mục «Chạy thử lần mười hai», như lần 11.

## Chi phí

| Ai              | Token                                              | Lần gọi công cụ         | Thời gian                                     | Ước tính trước                     |
| --------------- | -------------------------------------------------- | ----------------------- | --------------------------------------------- | ---------------------------------- |
| Tác tử dựng     | 295.436                                            | 40                      | 13 phút 42 giây (06:21–06:35)                 | 250 đến 350 nghìn                  |
| Phiên điều phối | khoảng 300 nghìn trong ngữ cảnh lúc viết trang này | khoảng 60 tới lúc mở PR | khoảng 60 phút từ lúc nhận việc tới lúc mở PR | phần còn lại của 350 đến 550 nghìn |

Tác tử dựng nằm trong ước tính. Con số của phiên điều phối là cỡ ngữ cảnh do ứng dụng đọc ra, không phải tổng token đã
tính tiền. Mỗi lượt của phiên đọc lại ngữ cảnh, nên tổng thật cao hơn, và phiên không đọc được tổng ấy. Hai bên cộng lại
có lẽ vượt cận trên 550 nghìn nếu tính cả phần đọc lại; không tính thì nằm trong ước tính.

## Vì sao không so thẳng 11 với 9

- **Plugin đã đổi nhiều hơn chỉ một phiếu.** Lần 11 chạy trên `315d571`, plugin 0.7.1. Lần này chạy trên `ec6eba9`,
  plugin 0.24.0. Ở giữa có cả giai đoạn 3 và 4, lệnh `review`, bảng năng lực, và trang luật mở đầu bằng điều chủ repo đã
  chốt. Hai chỗ chênh không quy được cho riêng phiếu.
- **Bản sao bỏ thêm.** Lần này bỏ thêm hồ sơ của bộ kit, có hai lối chạy lệnh thay vì một, và giữ `main` tại chỗ.
- **Mỗi bên chỉ một lượt.** Các lần 7 đến 10 cùng đề cho 12, 12, 13, 11, tức hai lượt cùng điều kiện đã lệch nhau tới
  hai chỗ.
- **Đếm là phán đoán.** Người đếm của hai lần khác nhau, và như mục «Đếm từng chỗ» cho thấy, cùng một báo cáo đọc ra
  được từ 8 tới 11.
- **Mô hình của tác tử.** Lần này là Opus 5.5. Lần 11 không ghi mô hình nào.
- **Đề vẫn nói «một màn»**, như lần 11.

## Dòng «done when» của giai đoạn 5

Dòng ấy đòi: một tác tử độc lập dựng một màn chỉ từ brief, và số chỗ phải đoán không tăng so với lượt thử gần nhất.

- Nửa đầu đạt: tác tử dựng màn chỉ từ đề, tự tìm ra phiếu từ trang luật, chạy nó trước khi dựng, và cổng xanh.
- Nửa sau **không chứng được bằng lượt này**: đếm theo cách lần 11 thì 11 so với 9, tức là tăng. Chỉ khi đọc chặt nhất
  (8 hoặc 9) thì mới «không tăng», và cách đọc ấy chọn sau khi đã thấy số. Đếm cách nào thì phần vào hàng chờ cũng giảm:
  từ 6 trên 9 xuống 2 trên 11.

Mục 5.4 đã xong. Giai đoạn 5 chưa đóng. Phiên điều phối đưa chủ repo ba hướng: coi dòng «done when» là chưa đạt, cho
chạy thêm một lượt, hoặc đổi cách đo theo câu B3 đã giữ ngày 2026-11-16.

**Chủ repo chọn ngày 2026-11-21: coi là chưa đạt** («Count it not met»). Giai đoạn 5 vẫn mở. Lời chọn không nói làm gì
tiếp: sửa các dòng sổ giới hạn mới, chạy lượt khác hay đổi cách đo đều chưa được giao.
