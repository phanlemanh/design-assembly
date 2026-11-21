# Chạy thử lần 13: lượt dựng màn thứ hai có phiếu brief, sau các sửa của mục 5.6

Một lượt, ngày 2026-11-21. Chủ repo cho chạy («Cho chạy») sau khi nghe ước tính: khoảng 300 nghìn token cho tác tử
dựng, khoảng 300 nghìn ngữ cảnh cho phiên điều phối, 400 đến 700 nghìn tất cả, khoảng một giờ. Lời cho chạy chỉ gồm một
lượt vai dựng màn trên đề chuẩn; không có nhánh đối chứng, không có vai dẫn dắt hay vai nhận.

Đây là lượt thứ hai mục 5.6 chờ. Lượt 12 ([`screen-trial-12-with-the-brief.md`](screen-trial-12-with-the-brief.md)) là
cách làm và điểm so của lượt này. Giữa hai lượt, lệnh `brief` có các sửa của quyết định 0076 (plugin 0.25.1). Phiếu và
trang luật nay nói mười hai ô không phải mọi câu hỏi của màn, và đưa lời gọi `decide --ask` cho một lựa chọn ngoài ô.
Phiếu so cây làm việc với nơi nhánh rời `main`. Ô 12 nêu tên các màn cần nhìn. Phiếu chạy sau khi dựng nói câu đang chờ
nào có khuyến nghị ngược với điều repo nay có.

**Kết luận ngắn:** cổng xanh, tác tử không dừng hỏi lần nào. Lần này nó tự hỏi 11 câu bằng `decide --ask`, ngoài 10 câu
phiếu xếp; lần 12 nó không tự hỏi câu nào. Sau khi kiểm còn 14 chỗ phải đoán, so với 11 ở lần 12: 11 chỗ vào hàng chờ, 3
chỗ tự quyết lặng lẽ, so với 2 và 9 ở lần 12. Số chỗ đoán tăng. Phần lớn chỗ tăng là những loại lựa chọn mà lần 12 không
khai, và tác tử lần này khai chúng vì phiếu bảo nó tìm.

## Bản sao

Dựng đúng như lần 12 đã dựng, từ `main` lúc bắt đầu:

- **Nguồn:** clone kho này vào thư mục nháp của phiên, ở `b882803`, là `main` lúc bắt đầu, plugin 0.25.1.
- **Checkout thưa** bỏ đúng danh sách của [`README.md`](README.md): `plugins/`, `docs/`, `wiki/decisions/`,
  `wiki/specs/`, `tests/plugin-*`, `mk/plugin.mk`. Cùng các mẫu ấy, bỏ thêm như lần 12: `mk/plan.mk`, và hồ sơ của bộ
  kit nghiệm thu (`_acceptance/`, `LO-TRINH.html`, `PRODUCT-MAP.md`).
- **Bỏ phần kế hoạch của `AGENTS.md` như lần 12:** mục «The plan», dòng `make plan`, dòng `docs/plan/` trong bản đồ dự
  án. Dòng `tools/` vẫn nhắc «the plan tool».
- **Gỡ các dòng trỏ tới trang đã bỏ:** 90 dòng của `wiki/index.md` (hai mục Specs và Decisions) và 140 dòng của
  `wiki/log.md`, là mọi dòng có liên kết tới một trang bản sao không có. Prettier được chạy lại trên hai trang.
  `wiki-lint` xanh ngay lần đầu. Không dòng nào còn lại trong sổ nhắc lệnh `brief` hay một lượt thử. Bốn tệp cũ của
  `design/waiting/` có nhắc tới các lượt thử, như ở bản sao lần 12.
- **Git:** bỏ remote; nhánh `main` tại chỗ ở `b882803`; mọi sửa trên nằm trong một commit, `2f7e362`, trên nhánh
  `trial/screen` cắt từ `main`. Các nhánh khác đều bỏ.
- **Gói cài:** `node_modules` của bản checkout chính, nối bằng một liên kết, ghi vào `.git/info/exclude`.
- **Xanh trước khi bắt đầu:** `make check` đạt ngay lần đầu: lint, typecheck, 89 bài đơn vị, sổ wiki, 39 quyết định giữ
  bằng 48 phép kiểm, các chốt thiết kế, 76 bài trình duyệt. Lần 12 phải sửa bản sao hai lần mới xanh.
- **Phiếu so với `main`:** phiên điều phối chạy `brief reference` một lần, chỉ đọc. Dòng thứ ba của phiếu nói «compared
  with where this branch left main». Sau đó `git status` sạch. Các tệp cổng sinh ra (`coverage/`, `dist/`,
  `design/component-registry.json`, đều bị bỏ qua) được xoá, để tác tử nhận bản sao đúng như lúc clone.

## Hai lối chạy lệnh của plugin

Như lần 12, hai tệp chạy nằm ngoài bản sao, trong thư mục nháp, mỗi tệp một dòng:
`exec node <kho này>/plugins/design-assembly/scripts/<brief|decide>.mjs "$@" --target <bản sao>`. Plugin được đọc từ
worktree của phiên điều phối, ở `b882803`, và không đổi trong lúc tác tử chạy.

Lời thêm sau đề chuẩn, nguyên văn như lần 12, chỉ đổi đường dẫn (viết tắt ở đây):

> Your repository is at: `<thư mục nháp>/trial-13/copy`
>
> It has no plugin installed. Where a page of it tells you to run `/design-assembly:brief` or `/design-assembly:decide`,
> run these two instead, with the same arguments after them: `<thư mục nháp>/trial-13/bin/brief` and
> `<thư mục nháp>/trial-13/bin/decide`. Run them; do not read them.

Đề chuẩn [`briefs/screen.md`](briefs/screen.md) được đưa nguyên văn, từ tiêu đề tới câu cuối, rồi một dòng trống, rồi lời
thêm. Tác tử là một tác tử con mới, kiểu `general-purpose`, chạy bằng Opus 5.5, cùng mô hình với lần 12. Nó không nhận
gì khác. Không ai nói với nó về lệnh `brief` hay về điều lần 12 tìm ra.

**Một khác biệt phiên điều phối không tránh được:** phiếu in các dòng còn mở của sổ giới hạn vùng `brief`. Từ sau lần
12, hai trong số đó kể lại điều lần 12 tìm ra: `brief-sheet-narrows-what-the-builder-asks` nói tác tử trước «asked no
question of its own, and decided alone nine choices», và `brief-not-tried-by-a-builder` nói nó đếm nhiều chỗ đoán hơn lần
trước. Tác tử đọc được điều ấy qua đầu ra của chính plugin, dù phiên điều phối không nói gì. Muốn tránh thì phải đổi
plugin, mà việc này không được đổi. Ghi ở `trial-builder-reads-findings-through-the-sheet` (mới).

## Lượt chạy

Bắt đầu lúc 08:21, xong lúc 08:38, qua 57 lần gọi công cụ:

| Bước                                                                                                | Lần gọi |
| --------------------------------------------------------------------------------------------------- | ------- |
| Đọc `AGENTS.md`, wiki, mô hình dữ liệu, hai trang luật, trang hành vi, trang kiểu màn, mã, bài kiểm | 1–11    |
| `make check` trên bản sao chưa đổi                                                                  | 12      |
| Ghi màn mới vào sổ màn, `status: planned`, `actions: []`, rồi chạy `brief archived` hai lần         | 14–15   |
| Đọc bài kiểm và tệp sinh ra; thêm trường `archived` và hai hành động vào `ontology/`                | 17–21   |
| Ghi ba hành động vào dòng sổ màn, chạy lại `brief archived`, rồi `brief archived --queue`           | 22–24   |
| Chạy `brief reference` và `brief overdue`, rồi `--queue` cho cả hai                                 | 25–26   |
| `decide --help`, rồi mười câu `decide --ask` của riêng nó                                           | 27–28   |
| Dựng: chữ, dữ liệu mẫu, phần dùng chung, màn chính, màn mới, sổ màn trong mã                        | 31–42   |
| Lint, typecheck, bốn vòng sửa                                                                       | 43–50   |
| Bài kiểm mới; câu `decide --ask` thứ mười một (thứ tự danh sách) khi một bài kiểm đoán sai thứ tự   | 51–54   |
| Bảng thuật ngữ, wiki, `make check` cuối                                                             | 55–57   |

Tác tử không dừng hỏi người lần nào, nên không câu niêm phong nào trong `answers/screen/` được mở, và không có câu mới
phải ghi thành tệp. Tác tử không commit; phiên điều phối giữ bài làm của nó trong bản sao ở commit `3d7fe79`. Bản sao
nằm ngoài kho và không được giữ lại.

## Số đo, đặt cạnh lần 11 và lần 12

| Đo gì                                       | Lần 11                                                    | Lần 12                                                                   | Lần 13                                                                                   |
| ------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Ngày, plugin                                | 2026-11-18, 0.7.1                                         | 2026-11-21, 0.24.0                                                       | 2026-11-21, 0.25.1                                                                       |
| Cổng lúc tác tử nói xong                    | xanh                                                      | xanh; phiên điều phối chạy lại: 112 bài đơn vị, 128 bài trình duyệt      | xanh; phiên điều phối chạy lại: 115 bài đơn vị, 128 bài trình duyệt                      |
| Vòng sửa trước khi xanh                     | —                                                         | 2 ở bước con                                                             | 4 ở bước nhanh (3 lint, 1 bài kiểm); lần chạy đầy đủ đầu tiên đã xanh                    |
| Số lần dừng hỏi người                       | 0                                                         | 0                                                                        | 0                                                                                        |
| Chỗ tác tử khai là tự quyết                 | 18                                                        | 22                                                                       | 33                                                                                       |
| **Chỗ phải đoán, sau khi kiểm**             | **9**                                                     | **11**                                                                   | **14**                                                                                   |
| … vào hàng chờ / tự quyết lặng lẽ           | 6 / 3                                                     | 2 / 9                                                                    | 11 / 3                                                                                   |
| Câu tác tử xếp vào `design/waiting/`        | 6, bằng `decide --ask`                                    | 3, bằng `brief --queue`; 0 bằng `decide --ask`                           | 21: 10 bằng `brief --queue`, 11 bằng `decide --ask`                                      |
| Lời đáp tác tử ghi thay chủ repo            | 0                                                         | 0                                                                        | 0                                                                                        |
| Dòng tác tử thêm vào sổ lỗi lọt của bản sao | 1                                                         | 1                                                                        | 0; nó nêu ba lỗi trong báo cáo                                                           |
| Tệp tác tử không được đụng                  | không đổi: `notify.ts`, `components/ui/`, `tools/`, `mk/` | không đổi: cũng bốn chỗ ấy, cộng `tests/e2e/floor.spec.ts` và `.claude/` | không đổi: cũng sáu chỗ ấy, cộng `Makefile`, `design/behaviors.md` và `design/patterns/` |
| Tác tử dựng: token, lần gọi, thời gian      | không ghi                                                 | 295.436, 40, 13 phút 42 giây                                             | 338.550, 57, 16 phút 44 giây                                                             |

Trong 21 câu trên hàng chờ, 10 câu phiếu xếp chỉ là 4 việc phải quyết: câu ô 8 (nguyên tắc) giống nhau trên cả ba
phiếu, và một thay đổi mô hình mở ô 10 trên cả ba phiếu (xem `brief-queues-a-question-per-screen`, mới).

## Điều mỗi sửa đổi được ở tác tử

| Sửa của mục 5.6                                                                                      | Lần 12                                                   | Lần 13                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phiếu và trang luật nói mười hai ô không là mọi câu hỏi, đưa lời gọi `decide --ask` cho điều ngoài ô | 0 câu của riêng tác tử                                   | **Đổi được.** 11 câu `decide --ask` của riêng nó: 10 trước khi dựng, ngay sau khi xếp các ô mở, và 1 lúc dựng. Chúng hỏi đúng những chỗ trang luật nay kể: hình dạng và tên của khái niệm mới (`archived-shape`), chữ người đọc thấy (`archived-words`), dáng nút (`archived-control-looks`), điều màn khác làm (`overdue-hides-archived`, `reference-keeps-delete`). Thêm sáu câu khác: hành động xoá hẳn, dữ liệu mẫu, bộ trạng thái, việc chính của màn, hoàn tác chỉ trên toast, thứ tự danh sách                             |
| Phiếu so với nơi nhánh rời `main`; điều nhánh viết vào mô hình mở ô 10 theo tên                      | Ô 10 đã định, vì tác tử đổi mô hình trước khi chạy phiếu | **Đổi được.** Lần chạy đầu (lần gọi 14) đến trước khi tác tử đổi mô hình; ô 10 đã định và được đánh dấu «written on this branch», vì nó đọc từ dòng sổ màn tác tử vừa viết. Sau khi tác tử thêm `Item.archived`, `archiveItem`, `restoreItem` và sửa mô tả `listItems`, `deleteItem`, lần chạy lại (lần gọi 22) mở ô 10 và nêu từng tên. Tác tử xếp câu ấy, và tự hỏi thêm câu hình dạng với ba cách (cờ riêng, giá trị thứ tư của `status`, trường ngày). Ô 10 cũng mở trên phiếu của hai màn kia, nên một thay đổi thành ba câu |
| Dòng đọc từ điều nhánh viết được đánh dấu «written on this branch»                                   | Không có dấu                                             | **Tác tử đọc chúng là của mình.** Ô 4 (trạng thái) đã định từ dòng sổ màn nó viết, có dấu, mà nó vẫn hỏi bộ trạng thái (`archived-states`); cột `actions` nó cũng khai là tự chọn. Không gì cho thấy nó coi dòng có dấu là đã định                                                                                                                                                                                                                                                                                                |
| Ô 12 nêu tên các màn cần nhìn                                                                        | Khuyến nghị «không đổi màn nào khác», tác tử làm ngược   | **Đổi được.** Khuyến nghị nay là «đừng coi như không màn nào đổi; trước khi dựng, nhìn `overdue` và `reference`». Tác tử chạy phiếu của đúng hai màn ấy (lần gọi 25), đổi cả hai: màn chính có thao tác lưu trữ, màn «Quá hạn» bỏ các mục đã cất. Điều đã dựng khớp khuyến nghị đã xếp                                                                                                                                                                                                                                            |
| Phiếu chạy sau khi dựng nói khuyến nghị nào repo nay đi ngược                                        | Không có                                                 | **Không dùng tới.** Tác tử không chạy phiếu sau khi dựng: lần chạy cuối của nó là lần gọi 26, trước dòng mã đầu tiên. Phiên điều phối chạy lại, chỉ đọc: ba phiếu đều `against: 0`. Phần «stands now» của ô 12 thấy màn chính đổi, nhưng không thấy màn «Quá hạn», vì màn này đổi qua nguồn dữ liệu `src/example/data.ts`, không qua dòng sổ hay tệp vẽ nó. Điều ấy đã có trong `queued-recommendation-not-held-against-the-change`                                                                                               |
| Chạy phiếu cho màn khác mình đổi                                                                     | Không                                                    | **Có**, cả hai màn, trước khi dựng, và xếp các ô mở của chúng                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**Phiếu ở lần đầu và lần cuối tác tử chạy:**

| Màn         | Lần đầu (đã định / đang hỏi / còn mở)                         | Lần cuối của tác tử   | Xếp bằng `--queue` | Phiên điều phối chạy sau khi dựng                |
| ----------- | ------------------------------------------------------------- | --------------------- | ------------------ | ------------------------------------------------ |
| `archived`  | 9 / 0 / 3 (ô 8, 11, 12); 5 ô đã định dựa trên điều nhánh viết | 8 / 0 / 4 (thêm ô 10) | 4                  | 9 / 3 / 0; ô 11 nay đọc được từ `src/screens.ts` |
| `reference` | 9 / 0 / 3 (ô 8, 10, 12)                                       | chỉ chạy một lần      | 3                  | 9 / 3 / 0                                        |
| `overdue`   | 9 / 0 / 3 (ô 8, 10, 12)                                       | chỉ chạy một lần      | 3                  | 9 / 3 / 0                                        |

## Đếm từng chỗ

Luật đếm của [`README.md`](README.md), cùng độ chặt với bảng của lần 12: một chỗ là một lần tác tử phải chọn giữa hai
cách hợp lệ mà không trang luật, trang kiểu màn hay trang hành vi nào nói chọn cách nào. Loại chỗ nào lần 12 giữ thì lần
này giữ; loại nào lần 12 bỏ thì lần này bỏ. Tên khái niệm trong mã và chữ người đọc thấy vẫn tính hai chỗ. Cột cuối nói
chỗ ứng với dòng nào của bảng lần 12.

| #   | Tác tử khai                                                               | Kiểm thấy                                                                                                                                                                                   | Đếm                      | Lần 12 |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------ |
| 1   | Hình dạng: cờ `archived`, giá trị thứ tư của `status`, hay trường ngày    | Không trang nào nói; ô 10 hỏi tên và hình dạng, tác tử hỏi thêm `archived-shape`                                                                                                            | giữ, hàng chờ            | 2      |
| 2   | Tên trong mã: `archiveItem`, `restoreItem`                                | Bảng thuật ngữ, `actions.yaml` không có. Câu ô 10 và `archived-shape` nêu tên                                                                                                               | giữ, hàng chờ            | 1      |
| 3   | Chữ người đọc: «Lưu trữ», «Đưa về danh sách», «Thao tác với X»            | Bảng thuật ngữ có cột tên hiển thị nhưng không có từ này; `labels.ts` không có. Hỏi ở `archived-words`                                                                                      | giữ, hàng chờ            | 3      |
| 4   | Tiêu đề màn «Mục đã lưu trữ» hay «Đã lưu trữ»                             | `design/patterns/danh-sach.md` dòng 77: «Tiêu đề là danh từ gọi tên danh sách». Chữ cụ thể thuộc dòng 3                                                                                     | bỏ (chữ gộp vào 3)       | 4      |
| 5   | Xoá hẳn: dùng lại `deleteItem` hay thêm hành động                         | `deleteItem` đúng là «xoá, không lấy lại được»; `AGENTS.md`: tìm cách đã có trước, mỗi luật nghiệp vụ một chỗ                                                                               | bỏ                       | —      |
| 6   | Màn chính giữ «Xoá»                                                       | `nhan_viec` của trang kiểu danh sách nói việc của màn mẫu, tức chính màn chính, gồm xoá                                                                                                     | bỏ                       | 8      |
| 7   | Màn «Quá hạn» ẩn mục đã cất (gộp với dòng 15)                             | Không trang nào nói. Hỏi ở `overdue-hides-archived` và ô 12; dựng khớp khuyến nghị                                                                                                          | giữ, hàng chờ            | 6      |
| 8   | Dáng nút trong «⋯»: `ghost`, `destructive`                                | `row-actions.tsx` chỉ nói thứ tự. Hỏi ở `archived-control-looks`                                                                                                                            | giữ, hàng chờ            | 9      |
| 9   | Gieo sẵn một mục đã cất vào dữ liệu mẫu                                   | Hai cách đều qua luật. Hỏi ở `archived-sample-data`                                                                                                                                         | giữ, hàng chờ            | 7      |
| 10  | Bộ trạng thái của hai màn                                                 | `design/states.json`, luật «thao tác làm ngay có trạng thái thất bại», màn mẫu                                                                                                              | bỏ (tác tử vẫn hỏi)      | 14     |
| 11  | Thứ tự danh sách lưu trữ: thứ tự nguồn hay lúc cất                        | Trang kiểu nói màn mới có «cùng các phần, cùng thứ tự» như màn mẫu, tức thứ tự các phần, không phải thứ tự các mục. Hỏi ở `archived-order`                                                  | giữ, hàng chờ            | mới    |
| 12  | Câu «việc chính của màn» ghi ở đâu                                        | Trang kiểu chỉ có chỗ cho màn mẫu; ô 1 của phiếu nói vậy. Ghi ở chú thích đầu tệp màn hay ở chỗ khác. Hỏi ở `archived-task`                                                                 | giữ, hàng chờ            | mới    |
| 13  | Hoàn tác của «Đưa về danh sách» chỉ trên toast                            | `design/behaviors.md` dòng 72–74: từ màn khác, lối đảo lại là thao tác thường của màn đó. Trang nói, và tác tử làm đúng như vậy                                                             | bỏ (tác tử vẫn hỏi)      | —      |
| 14  | Chỗ trên thanh điều hướng                                                 | Ô 11, xếp vào hàng chờ, dựng theo khuyến nghị: đứng cuối, sau `/overdue`                                                                                                                    | giữ, hàng chờ            | 17     |
| 15  | Màn khác đổi theo (ô 12)                                                  | Màn chính buộc phải đổi vì đề đòi; phần còn lại là màn «Quá hạn», tức dòng 7                                                                                                                | gộp vào 7                | 18     |
| 16  | Id, đường dẫn, khoá tiêu đề                                               | `AGENTS.md` bắt định danh tiếng Anh; màn «Quá hạn» cho mẫu                                                                                                                                  | bỏ                       | 5      |
| 17  | Trường có mặc định `false` chứ không bắt buộc                             | Một phần hình dạng của trường, dòng 1                                                                                                                                                       | gộp vào 1                | —      |
| 18  | Câu chữ của trạng thái trống, toast, lỗi                                  | Trang hành vi nói mỗi câu phải nói gì; câu cụ thể là việc viết                                                                                                                              | bỏ                       | 4      |
| 19  | Mở màn bằng `listItems` (sửa mô tả) hay thêm truy vấn `listArchivedItems` | Không trang nào nói; màn «Quá hạn» cho tiền lệ nhưng không phải màn mẫu. Câu ô 10 nêu «changes the action listItems»                                                                        | giữ, hàng chờ (qua ô 10) | mới    |
| 20  | Cột `actions` của sổ màn có tính hành động chỉ có nút trên toast          | Trang luật nói «the actions it has buttons for» mà không nói nút của toast có tính không                                                                                                    | giữ, lặng lẽ             | 16     |
| 21  | Tên đọc của nút trong «⋯»: «Lưu trữ X»                                    | Luật chỉ nói tên của nút «⋯»; `archived-words` khuyến nghị tên nút «⋯» nhưng không nói tên các nút bên trong                                                                                | giữ, lặng lẽ             | 10     |
| 22  | Trạng thái `saving` chờ chữ tên mục thay cho «Đang xoá»                   | Hai luật chọi nhau như lần 12; nay `saving` của cả hai màn chờ chữ có sẵn từ trước                                                                                                          | giữ, lặng lẽ             | 11     |
| 23  | Tên kịch bản thử `fail-archive`, `fail-restore`…                          | Theo mẫu của màn mẫu                                                                                                                                                                        | bỏ                       | 15     |
| 24  | Hình dạng phần dùng chung: một hook, hai linh kiện, viết lại màn mẫu      | Trang luật nói logic xuống một phần, phần vẽ dùng chung thành linh kiện                                                                                                                     | bỏ                       | 12     |
| 25  | Hoàn tác đưa dòng về chỗ cũ                                               | Trang hành vi: «Hoàn tác đưa mọi thứ về chỗ cũ»                                                                                                                                             | bỏ                       | 13     |
| 26  | Sửa bài kiểm cũ cho bấm «⋯» trước                                         | Trang luật buộc vậy khi hai thao tác đi sau một nút                                                                                                                                         | bỏ                       | 21     |
| 27  | Giữ kiểu `Item` viết tay thay vì kiểu sinh ra                             | `AGENTS.md` nói dùng kiểu sinh ra; tác tử không theo được vì ngày là chuỗi. Là luật không theo được, không phải chọn giữa hai cách mà không trang nào nói; đã có ở `generated-types-unused` | bỏ                       | —      |
| 28  | Thêm hàng nào vào bảng thuật ngữ, với tên hiển thị nào                    | Tên trong mã là dòng 2, tên hiển thị là dòng 3                                                                                                                                              | gộp vào 2 và 3           | —      |
| 29  | Không đặt thao tác lưu trữ ở màn «Quá hạn»                                | Không trang nào nói. Khuyến nghị của `overdue-hides-archived` viết «màn Quá hạn không đổi gì khác»                                                                                          | giữ, hàng chờ            | mới    |
| 30  | Chữ «đang làm»: «Đang lưu trữ X»                                          | Câu cụ thể là việc viết, như dòng 18                                                                                                                                                        | bỏ                       | 4      |
| 31  | Để lại `LABELS.saving` không còn dùng                                     | Không đổi gì người dùng thấy hay sổ nào giữ; là một lỗi tác tử tự nêu, đã có ở `unused-words-unflagged`                                                                                     | bỏ                       | —      |
| 32  | Không sửa trang hành vi và trang kiểu danh sách                           | Không có cách thứ hai cần đến: không gì trong việc đòi sửa chúng                                                                                                                            | bỏ                       | —      |
| 33  | Không viết trang `wiki/decisions/`                                        | Bản sao không có thư mục ấy, như lần 12                                                                                                                                                     | bỏ                       | —      |

Giữ 14 chỗ: 1, 2, 3, 7 (gộp 15), 8, 9, 11, 12, 14, 19, 20, 21, 22, 29. Trong đó 11 chỗ vào hàng chờ, 3 chỗ tự quyết lặng
lẽ (20, 21, 22). Ba chỗ lặng lẽ đều thuộc loại lần 12 cũng tự quyết lặng lẽ (dòng 16, 10, 11 của lần 12).

Một chỗ lần 12 giữ thì lần này tác tử không khai: thông số của hành động mới (`kind`, `idempotent`, `agent`), dòng 20 của
lần 12. Lựa chọn ấy có mặt trong khuyến nghị của `archived-shape` («kind update»). Như lần 12, bảng chỉ đếm chỗ tác tử
khai, nên chỗ này không vào số 14.

**Chỗ phải phán đoán khi đếm**, để chủ repo thấy con số lung lay tới đâu:

- **Chặt như cách đọc chặt của lần 12** (gộp tên trong mã với chữ người đọc, bỏ cột `actions` như lần 12 bỏ dòng 16 và
  20): còn 12, 10 vào hàng chờ, 2 lặng lẽ.
- **Chặt hơn nữa**, với bốn loại mới: gộp dòng 29 vào 7 (cùng là điều màn «Quá hạn» làm), gộp dòng 19 vào 1 (cùng là hình
  dạng mô hình), bỏ dòng 12 (chỗ ghi một câu, không phải lựa chọn của màn): còn 9, 7 vào hàng chờ, 2 lặng lẽ.
- **Lỏng hơn:** tính cả bốn chỗ tác tử đã hỏi dù trang có nói (4, 5, 10, 13), vì câu hỏi đã tới chủ repo: thành 18, 15
  vào hàng chờ. Thêm thông số hành động không khai thì 19.
- Dòng 19 tính vào hàng chờ qua câu ô 10, vì câu ấy nêu «changes the action listItems». Câu ấy không nêu cách thứ hai
  (một truy vấn riêng). Tính nó là lặng lẽ thì tỷ lệ thành 10 trên 14.

Đọc theo cách lần 12 đã đếm thì là 14, so với 11. Chỉ khi đọc chặt hơn cách đọc chặt của lần 12 (9 hoặc 10) thì mới
«không tăng», và cách đọc ấy chọn sau khi đã thấy số. Đọc cách nào thì phần vào hàng chờ cũng tăng mạnh: từ 2 trên 11 lên
11 trên 14, hoặc 7 trên 9 khi đọc chặt nhất.

## Điều tác tử báo, và kiểm thấy gì

| Điều tác tử báo                                                                                                                                | Kiểm thấy                                                                                                                                                                                                                                          | Ghi ở                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `make check` xanh ở lần chạy đầy đủ đầu tiên, sau bốn vòng sửa ở bước nhanh                                                                    | Đúng: phiên điều phối chạy lại, xanh, 115 bài đơn vị và 128 bài trình duyệt                                                                                                                                                                        | bảng số đo                                                                   |
| 23 câu trên hàng chờ: 10 do phiếu xếp, 13 tự hỏi bằng `decide --ask`                                                                           | Sai một phần: hàng chờ có 21 tệp mới, 10 của phiếu và **11** của `decide --ask`. Mười ba là số mục trong báo cáo của nó; hai mục (tên trong mã, tiêu đề màn) nằm trong khuyến nghị của `archived-shape` và `archived-words`, không thành câu riêng | bảng số đo                                                                   |
| Không câu nào chặn việc, nên làm tiếp theo khuyến nghị                                                                                         | Đúng: không câu nào có lời đáp, không tệp nào ghi thay chủ repo                                                                                                                                                                                    | bảng số đo                                                                   |
| Không dùng được kiểu sinh ra vì `date` là chuỗi                                                                                                | Đúng: `src/generated/ontology.ts` dòng 11, `date: string`                                                                                                                                                                                          | `generated-types-unused` (đã có)                                             |
| Trang hành vi đòi nút đang xoá nói «Đang xoá», mà sau «⋯» nó chỉ nói bằng tên đọc                                                              | Đúng: `src/screens.ts` dòng 62 và 126, `saving` nay chờ tên mục, vốn hiện sẵn                                                                                                                                                                      | `spoken-only-state-unlisted`, `state-words-present-before-the-state` (đã có) |
| Thay đổi mô hình phải nêu trong PR, mà không có PR                                                                                             | Đúng; tác tử nêu nó ở đầu báo cáo và trong `wiki/entities/item.md`                                                                                                                                                                                 | không ghi sổ                                                                 |
| Lỗi không lệnh kiểm nào bắt: `saving` không còn chứng gì                                                                                       | Đúng, như trên                                                                                                                                                                                                                                     | như trên                                                                     |
| Lỗi không lệnh kiểm nào bắt: `LABELS.saving` không còn chỗ dùng                                                                                | Đúng: không tệp nào trong `src/` hay `tests/` dùng nó                                                                                                                                                                                              | `unused-words-unflagged` (đã có)                                             |
| Lỗi không lệnh kiểm nào bắt: cổng nhận `archiveItem` trong cột `actions` của màn lưu trữ                                                       | Đúng: `design/screens/archived.yaml` kê `archiveItem`, nút duy nhất của nó trên màn này là nút hoàn tác của toast, và cổng xanh. Trang luật không nói nút của toast có tính không; lần 12 cũng chọn như vậy                                        | `screen-actions-toast-button-unsaid` (mới)                                   |
| Lời gọi «ask it» của phiếu và trang luật trỏ tới mã plugin ngoài bản sao                                                                       | Đúng, do cách dựng lượt thử, như lần 12                                                                                                                                                                                                            | khác biệt của lượt thử                                                       |
| Tệp sinh ra nói «Implement these in src/actions/», mà repo không có thư mục ấy; skill `ontology-add` nói trình biên dịch liệt kê hàm còn thiếu | Đúng: `src/generated/ontology.ts` dòng 48; không có `src/actions/`. Đây là phần của bộ sinh mã của sàn, không phải của plugin                                                                                                                      | không ghi sổ; ngoài phạm vi của plugin                                       |
| `ui.md` nói vòng nhanh kiểm ở 1440 và 390 px, mà bài kiểm theo trạng thái chạy ở 320 và 1440                                                   | Đúng: `.claude/rules/ui.md` dòng 26; `design/screen-sizes.json` là 320 và 1440                                                                                                                                                                     | không ghi sổ; `ui.md` là trang của sàn, việc này không được sửa nó           |
| Đề nói app có một màn, kho có hai                                                                                                              | Đúng, như lần 11 và 12                                                                                                                                                                                                                             | `screen-brief-says-one-screen` (đã có)                                       |

**Điều phiên điều phối thấy mà tác tử không báo:**

- Tác tử không chạy phiếu sau khi dựng, dù phiếu nay có phần nói khuyến nghị nào repo đi ngược. Đã có ở
  `queued-recommendation-not-held-against-the-change` («a builder that does not run the sheet again is told nothing»).
- Mười câu phiếu xếp chỉ là bốn việc phải quyết: ô 8 giống hệt nhau trên ba phiếu, ô 10 của một thay đổi mô hình ra ba
  câu. Ghi ở `brief-queues-a-question-per-screen` (mới).
- Phần «stands now» của ô 12 không thấy màn «Quá hạn» đã đổi, vì màn này đổi qua nguồn dữ liệu. Đã có ở
  `queued-recommendation-not-held-against-the-change`.
- Tác tử đọc được điều lần 12 tìm ra qua sổ giới hạn phiếu in ra. Ghi ở `trial-builder-reads-findings-through-the-sheet`
  (mới).

## Sau khi chạy

Theo mục «Sau khi chạy» của [`README.md`](README.md):

1. Mỗi điều tác tử báo đã được kiểm trên bản sao của nó (bảng trên).
2. Không sửa gì trong plugin.
3. `plugins/design-assembly/references/limits.json`:
   - **Thu hẹp** `brief-sheet-narrows-what-the-builder-asks`, với lượt này làm căn cứ: tác tử đã hỏi 11 câu của riêng nó,
     nên lời «ask nothing else» không còn đúng. Điều còn mở: ba lựa chọn phiếu không chỉ chỗ (tên đọc của nút trong «⋯»,
     chữ trạng thái chờ khi trang không hiện chữ nào, nút trên toast có tính vào cột `actions` không) vẫn tự quyết lặng
     lẽ; không gì thấy điều tác tử chọn ngoài mười hai ô; hai lượt không nói được lượt thứ ba cũng hỏi chừng ấy. Mức hạ
     từ nặng xuống vừa. Dòng vẫn mở, `plan` giữ `fix`. Mức là đề xuất của phiên này, chủ repo giữ hoặc đổi.
   - **Viết lại** `brief-not-tried-by-a-builder`: hai tác tử đã dựng từ phiếu; đếm cùng cách là 11 rồi 14; hai lượt chưa
     nói được phiếu có làm giảm số chỗ đoán không. Dòng vẫn mở.
   - **Mới:** `brief-queues-a-question-per-screen` (mức nhẹ), `screen-actions-toast-button-unsaid` (mức nhẹ),
     `trial-builder-reads-findings-through-the-sheet` (mức vừa, `plan: keep`). Hai dòng đầu ghi `plan: fix` như các dòng
     cùng loại; cả ba hướng xử lý là đề xuất, chờ chủ repo.
   - Không dòng nào đóng. `brief-settled-by-rows-the-builder-wrote`, `queued-recommendation-not-held-against-the-change`
     và `brief-run-before-building-unheld` để nguyên: lượt này cho thấy đúng điều chúng đã ghi là còn mở.
4. Sổ lỗi lọt `design/escapes.md` của kho này không thêm dòng. Ba lỗi tác tử gặp chỉ có trên bản sao, và cả ba đã có
   dòng sổ giới hạn (hai dòng cũ, một dòng mới). Lần 11 và 12 cũng làm như vậy với lỗi chỉ có trên bản sao.
5. Đề bài `wiki/specs/0001-design-system-for-claude-code.md` có thêm mục «Chạy thử lần mười ba».

## Chi phí

| Ai              | Token                                              | Lần gọi công cụ         | Thời gian                                     | Ước tính trước                    |
| --------------- | -------------------------------------------------- | ----------------------- | --------------------------------------------- | --------------------------------- |
| Tác tử dựng     | 338.550                                            | 57                      | 16 phút 44 giây (08:21–08:38)                 | khoảng 300 nghìn                  |
| Phiên điều phối | khoảng 200 nghìn trong ngữ cảnh lúc viết trang này | khoảng 70 tới lúc mở PR | khoảng 75 phút từ lúc nhận việc tới lúc mở PR | khoảng 300 nghìn ngữ cảnh         |
| Cộng            | khoảng 540 nghìn                                   |                         |                                               | 400 đến 700 nghìn, khoảng một giờ |

Tác tử dựng vượt ước tính khoảng 13 phần trăm, và nhiều hơn lần 12 khoảng 15 phần trăm: nó gọi công cụ 57 lần so với 40,
phần lớn để hỏi và chạy phiếu cho ba màn. Con số của phiên điều phối là cỡ ngữ cảnh ước lượng, không phải tổng token đã
tính tiền: mỗi lượt của phiên đọc lại ngữ cảnh, nên tổng thật cao hơn, và phiên không đọc được tổng ấy. Không tính phần
đọc lại thì cả hai cộng lại nằm trong ước tính; thời gian vượt một giờ một chút.

## Vì sao không so thẳng 14 với 11

- **Tác tử khai nhiều loại lựa chọn hơn, vì phiếu bảo nó tìm.** Bốn chỗ giữ là loại lần 12 không khai: thứ tự danh sách,
  chỗ ghi việc chính của màn, truy vấn mở màn, màn «Quá hạn» có thao tác lưu trữ không. Ba chỗ trong đó chỉ thành chỗ vì
  tác tử dừng lại hỏi. Phép đo đếm mỗi lựa chọn được nhận ra là một chỗ, nên sửa làm tác tử tìm kỹ hơn cũng làm số tăng.
  Bỏ bốn loại mới thì còn 10 chỗ thuộc các loại lần 12 đã đếm, so với 11.
- **Tác tử đọc được điều lần 12 tìm ra**, qua sổ giới hạn phiếu in. Lần 12 không có điều này.
- **Plugin đã đổi** từ 0.24.0 lên 0.25.1, và không chỉ ở chỗ mục 5.6 nhắm tới: có cả một sửa ở bộ đọc mô hình của cổng.
- **Mỗi bên chỉ một lượt.** Các lần 7 đến 10 cùng đề cho 12, 12, 13, 11, tức hai lượt cùng điều kiện đã lệch nhau tới hai
  chỗ.
- **Đếm là phán đoán.** Cùng một báo cáo đọc ra được từ 9 tới 19 tuỳ độ chặt. Người đếm của lần 12 và lần 13 là hai
  phiên điều phối khác nhau. Phiên lần này chạy bằng Fable 5.2 lúc dựng bản sao và khởi động tác tử. Chủ repo chuyển nó
  sang Opus 5.5 trong lúc tác tử chạy, nên phần kiểm và đếm làm bằng Opus 5.5.
- **Mô hình của tác tử** là Opus 5.5, như lần 12; điều này không khác.
- **Đề vẫn nói «một màn»**, như lần 11 và 12.

## Dòng «done when» của giai đoạn 5

Dòng ấy đòi: một tác tử độc lập dựng một màn chỉ từ brief, và số chỗ phải đoán không tăng so với lượt thử gần nhất.

- Nửa đầu đạt, như lần 12: tác tử dựng màn chỉ từ đề, tự tìm ra phiếu từ trang luật, chạy nó cho ba màn trước khi dựng,
  và cổng xanh.
- Nửa sau **không chứng được bằng lượt này**: đếm theo cách lần 12 thì 14 so với 11, tức là tăng. Chỉ khi đọc chặt hơn
  cách đọc chặt của lần 12 (9 hoặc 10) thì mới «không tăng», và cách đọc ấy chọn sau khi đã thấy số.
- Điều mục 5.6 nhắm tới thì đổi rõ: 11 câu tự hỏi so với 0, và phần vào hàng chờ từ 2 trên 11 lên 11 trên 14. Số chỗ tự
  quyết lặng lẽ giảm từ 9 xuống 3.

Mục 5.6 đã xong: cả phần sửa và lượt chạy lại đều đã làm. Giai đoạn 5 chưa đóng; đóng hay không là lời của chủ repo.
Phiên điều phối thấy bốn hướng:

- coi dòng «done when» là chưa đạt;
- đổi cách đo theo câu B3 đã giữ ngày 2026-11-16: số chính là số luật bị phạm, có so với không có trang luật, và số chỗ
  đoán thành số phụ. Cách này cần chạy nhánh đối chứng, mà lời cho chạy lần này không gồm;
- đổi điều dòng ấy đếm thành số chỗ tự quyết lặng lẽ, tức chỗ chủ repo không bao giờ thấy. Đây là đề xuất của phiên này,
  không câu nào trên hàng chờ hỏi nó. Đếm như vậy thì là 9 ở lần 12 và 3 ở lần 13, tức giảm. Nhưng nó cũng là một cách đo
  chọn sau khi đã thấy số;
- cho chạy thêm một lượt.
