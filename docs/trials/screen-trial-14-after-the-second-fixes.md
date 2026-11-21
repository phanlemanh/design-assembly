# Chạy thử lần 14: lượt dựng màn thứ ba có phiếu brief, sau các sửa của mục 5.7

Một lượt, ngày 2026-11-21. Chủ repo cho chạy («Cho chạy») sau khi nghe ước tính: khoảng 340 nghìn token cho tác tử
dựng, khoảng 200 nghìn ngữ cảnh cho phiên điều phối, 400 đến 700 nghìn tất cả, khoảng 75 phút. Lời cho chạy chỉ gồm một
lượt vai dựng màn trên đề chuẩn; không có nhánh đối chứng, không có vai dẫn dắt hay vai nhận.

Đây là lượt mục 5.7 chờ. Lượt 13 ([`screen-trial-13-after-the-fixes.md`](screen-trial-13-after-the-fixes.md)) là cách
làm và điểm so của lượt này. Giữa hai lượt, lệnh `brief` có các sửa của quyết định 0077 (plugin 0.26.0). Trang luật và
phiếu nay nói tới ba loại lựa chọn tác tử lần 13 tự quyết lặng lẽ: nút trên toast có tính vào cột `actions` không; tên
đọc của mỗi nút trong danh sách «⋯»; chữ của trạng thái chờ khi nút không hiện chữ nào, chỗ hai luật chọi nhau mà phiếu
nói là của chủ repo, với một câu hỏi cho cả repo. Câu hỏi giống nhau cho nhiều màn được hỏi một lần, dưới mục
`screens:…`. Câu chung có thêm tên thì được thay, không thành câu thứ hai. Các dòng giới hạn phiếu in ra không còn kể điều
một tác tử trước đã làm.

**Kết luận ngắn:** cổng xanh, tác tử không dừng hỏi người lần nào. Sau khi kiểm còn 13 chỗ phải đoán, so với 14 ở lần 13:
10 chỗ vào hàng chờ, 3 chỗ tự quyết lặng lẽ, so với 11 và 3. Cả ba loại lần 13 tự quyết lặng lẽ nay đều không lặng lẽ: hai
loại tác tử hỏi, loại thứ ba nó làm theo trang luật. Ba chỗ lặng lẽ của lần này là loại khác. Hàng chờ có 14 câu cho một
màn, so với 21: 6 câu phiếu xếp (2 câu chung dưới `screens:`), 8 câu tác tử tự hỏi.

## Bản sao

Dựng đúng như lần 13 đã dựng, từ `main` lúc bắt đầu:

- **Nguồn:** clone kho này vào thư mục nháp của phiên, ở `ff590c7`, là `main` lúc bắt đầu, plugin 0.26.0.
- **Checkout thưa** bỏ đúng danh sách của [`README.md`](README.md): `plugins/`, `docs/`, `wiki/decisions/`,
  `wiki/specs/`, `tests/plugin-*`, `mk/plugin.mk`. Cùng các mẫu ấy, bỏ thêm như lần 12 và 13: `mk/plan.mk`, và hồ sơ của
  bộ kit nghiệm thu (`_acceptance/`, `LO-TRINH.html`, `PRODUCT-MAP.md`).
- **Bỏ phần kế hoạch của `AGENTS.md` như lần 13:** mục «The plan», dòng `make plan`, dòng `docs/plan/` trong bản đồ dự
  án. Dòng `tools/` vẫn nhắc «the plan tool».
- **Gỡ các dòng trỏ tới trang đã bỏ:** 88 dòng của `wiki/index.md` (hai mục Specs và Decisions) và 143 dòng của
  `wiki/log.md`, là mọi dòng có liên kết tới một trang bản sao không có. Prettier được chạy lại trên hai trang và trên
  `AGENTS.md`. `wiki-lint` xanh ngay lần đầu. Bốn tệp cũ của `design/waiting/` (`A1`, `A2`, `A4`, `B3`) có nhắc tới các
  lượt thử, như ở bản sao lần 12 và 13.
- **Git:** bỏ remote; nhánh `main` tại chỗ ở `ff590c7`; mọi sửa trên nằm trong một commit, `52f29eb`, trên nhánh
  `trial/screen` cắt từ `main`. Các nhánh khác đều bỏ.
- **Gói cài:** `node_modules` của bản checkout chính, nối bằng một liên kết, ghi vào `.git/info/exclude`.
- **Xanh trước khi bắt đầu:** `make check` đạt ngay lần đầu: lint, typecheck, 89 bài đơn vị, sổ wiki, 39 quyết định giữ
  bằng 48 phép kiểm, các chốt thiết kế, 76 bài trình duyệt.
- **Phiếu so với `main`:** phiên điều phối chạy `brief reference` một lần. Dòng thứ ba của phiếu nói «compared with where
  this branch left main». Sau đó `git status` sạch. Các tệp cổng sinh ra (`coverage/`, `dist/`,
  `design/component-registry.json`, đều bị bỏ qua) được dời ra ngoài bản sao, để tác tử nhận bản sao đúng như lúc clone.

So với bản sao lần 13, bản sao này khác ở các sửa của mục 5.7 (trang luật, bộ đọc hàng chờ `waiting.mjs` mà cổng chép,
dấu bản công cụ), ở `tools/plan.mjs` (không lệnh nào của bản sao chạy nó) và ở các dòng sổ wiki của hai PR từ đó tới nay,
đều bị gỡ vì trỏ tới trang đã bỏ, trừ một dòng của `wiki/log.md` không trỏ tới trang nào.

## Trước khi tác tử bắt đầu: phiếu và trang luật có kể lượt thử nào không

Phiên điều phối đọc trang luật `.claude/rules/design-assembly.md` của bản sao và phiếu `brief reference`, như một tác tử
dựng đọc, trước khi khởi động tác tử. Không chỗ nào nêu tên một lượt thử hay kể một lỗi của tác tử trước. Chữ «trial»
không có trong cả hai. Dòng `brief-not-tried-by-a-builder` nói chưa lượt chạy nào của một tác tử độc lập chứng được phiếu
làm giảm số chỗ đoán; nó không kể kết quả nào. Dòng `brief-sheet-narrows-what-the-builder-asks` kể những chỗ phiếu chỉ,
không kể tác tử nào đã làm gì. Lần 13, hai dòng ấy kể điều lần 12 tìm ra; lần này không. Nên lượt này bắt đầu.

## Hai lối chạy lệnh của plugin

Như lần 12 và 13, hai tệp chạy nằm ngoài bản sao, trong thư mục nháp, mỗi tệp một dòng:
`exec node <kho này>/plugins/design-assembly/scripts/<brief|decide>.mjs "$@" --target <bản sao>`. Plugin được đọc từ
worktree của phiên điều phối, ở `ff590c7`, và không đổi trong lúc tác tử chạy.

Lời thêm sau đề chuẩn, nguyên văn như lần 12 và 13, chỉ đổi đường dẫn (viết tắt ở đây):

> Your repository is at: `<thư mục nháp>/trial-14/copy`
>
> It has no plugin installed. Where a page of it tells you to run `/design-assembly:brief` or `/design-assembly:decide`,
> run these two instead, with the same arguments after them: `<thư mục nháp>/trial-14/bin/brief` and
> `<thư mục nháp>/trial-14/bin/decide`. Run them; do not read them.

Đề chuẩn [`briefs/screen.md`](briefs/screen.md) được đưa nguyên văn, từ tiêu đề tới câu cuối, rồi một dòng trống, rồi lời
thêm. Tác tử là một tác tử con mới, kiểu `general-purpose`, chạy bằng Opus 5.5, cùng mô hình với lần 12 và 13; bản ghi của
nó cho thấy mọi lượt trả lời đều của `claude-opus-5-5`. Nó không nhận gì khác. Không ai nói với nó về lệnh `brief` hay về
điều các lượt trước tìm ra.

## Lượt chạy

Bắt đầu lúc 10:05, xong lúc 10:27, qua 52 lần gọi công cụ:

| Bước                                                                                                          | Lần gọi |
| ------------------------------------------------------------------------------------------------------------- | ------- |
| Đọc `AGENTS.md`, wiki, mô hình dữ liệu, hai trang luật, trang hành vi, trang kiểu màn, mã, sổ quyết định      | 1–12    |
| `make check` trên bản sao chưa đổi                                                                            | 13      |
| Ghi màn mới vào sổ màn, `status: planned`, `actions: []`, rồi chạy `brief archived` hai lần                   | 14–16   |
| Đọc bài kiểm và tệp sinh ra; thêm `Item.archived`, `archiveItem`, `restoreItem`, sửa mô tả `listItems`        | 17–21   |
| Ghi hành động và trạng thái vào dòng sổ màn, chạy phiếu của ba màn, rồi `--queue` cho cả ba                   | 22–24   |
| Tám câu `decide --ask` của riêng nó; hai câu bị từ chối vì mục `screen:archived:task` và `…:entry`, hỏi lại   | 25–30   |
| Dựng: chữ, dữ liệu mẫu, phần dùng chung, màn chính, màn mới, sổ màn trong mã; lint và typecheck, một vòng sửa | 31–37   |
| Bài kiểm đơn vị: 14 bài cũ đỏ vì bấm thẳng nút «Xoá», sửa cho bấm «⋯» trước; bài kiểm mới                     | 38–42   |
| `make check` đầy đủ lần 1 đỏ ở `tests/e2e/frame.spec.ts`, sửa, lần 2 xanh                                     | 43–45   |
| Thêm trạng thái `row-actions` cho hai màn, chụp ảnh bằng một bài kiểm tạm rồi xoá                             | 46–49   |
| Wiki, `make check` lần 3 xanh, chạy lại `brief archived` sau khi dựng                                         | 50–52   |

Tác tử không dừng hỏi người lần nào, nên không câu niêm phong nào trong `answers/screen/` được mở, và không có câu mới
phải ghi thành tệp. Tác tử không commit; phiên điều phối giữ bài làm của nó trong bản sao ở commit `8bfcd71`. Bản sao nằm
ngoài kho và không được giữ lại.

## Số đo, đặt cạnh lần 11, 12 và 13

| Đo gì                                       | Lần 11                                                    | Lần 12                                                                   | Lần 13                                                                                   | Lần 14                                                                           |
| ------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Ngày, plugin                                | 2026-11-18, 0.7.1                                         | 2026-11-21, 0.24.0                                                       | 2026-11-21, 0.25.1                                                                       | 2026-11-21, 0.26.0                                                               |
| Cổng lúc tác tử nói xong                    | xanh                                                      | xanh; phiên điều phối chạy lại: 112 bài đơn vị, 128 bài trình duyệt      | xanh; phiên điều phối chạy lại: 115 bài đơn vị, 128 bài trình duyệt                      | xanh; phiên điều phối chạy lại: 113 bài đơn vị, 129 bài trình duyệt              |
| Vòng sửa trước khi xanh                     | —                                                         | 2 ở bước con                                                             | 4 ở bước nhanh (3 lint, 1 bài kiểm); lần chạy đầy đủ đầu tiên đã xanh                    | 2 ở bước con (lint, bài đơn vị), 1 ở lần chạy đầy đủ (bài trình duyệt của khung) |
| Số lần dừng hỏi người                       | 0                                                         | 0                                                                        | 0                                                                                        | 0                                                                                |
| Chỗ tác tử khai là tự quyết                 | 18                                                        | 22                                                                       | 33                                                                                       | 26                                                                               |
| **Chỗ phải đoán, sau khi kiểm**             | **9**                                                     | **11**                                                                   | **14**                                                                                   | **13**                                                                           |
| … vào hàng chờ / tự quyết lặng lẽ           | 6 / 3                                                     | 2 / 9                                                                    | 11 / 3                                                                                   | 10 / 3                                                                           |
| Câu tác tử xếp vào `design/waiting/`        | 6, bằng `decide --ask`                                    | 3, bằng `brief --queue`; 0 bằng `decide --ask`                           | 21: 10 bằng `brief --queue`, 11 bằng `decide --ask`                                      | 14: 6 bằng `brief --queue` (2 câu chung dưới `screens:`), 8 bằng `decide --ask`  |
| Lời đáp tác tử ghi thay chủ repo            | 0                                                         | 0                                                                        | 0                                                                                        | 0                                                                                |
| Dòng tác tử thêm vào sổ lỗi lọt của bản sao | 1                                                         | 1                                                                        | 0; nó nêu ba lỗi trong báo cáo                                                           | 0; nó nêu hai lỗi trong báo cáo                                                  |
| Tệp tác tử không được đụng                  | không đổi: `notify.ts`, `components/ui/`, `tools/`, `mk/` | không đổi: cũng bốn chỗ ấy, cộng `tests/e2e/floor.spec.ts` và `.claude/` | không đổi: cũng sáu chỗ ấy, cộng `Makefile`, `design/behaviors.md` và `design/patterns/` | không đổi: cũng chín chỗ ấy                                                      |
| Tác tử dựng: token, lần gọi, thời gian      | không ghi                                                 | 295.436, 40, 13 phút 42 giây                                             | 338.550, 57, 16 phút 44 giây                                                             | 336.055, 52, 21 phút 56 giây                                                     |

Trong 14 câu trên hàng chờ, 6 câu phiếu xếp là 4 việc phải quyết: nguyên tắc (một câu chung), thay đổi mô hình (một câu
chung), chỗ trên thanh điều hướng, và màn khác đổi theo, mà mỗi phiếu trong ba phiếu xếp một câu riêng (xem
`brief-touched-screens-asked-per-screen`, mới). Lần 13, cũng bốn việc ấy là 10 câu.

## Điều mỗi sửa đổi được ở tác tử

| Sửa của mục 5.7                                                                                                  | Lần 13                                       | Lần 14                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Trang luật và ô 3 nói nút trên toast có tính vào cột `actions`                                                   | Tự quyết lặng lẽ (dòng 20 của bảng lần 13)   | **Làm theo trang.** Màn chính kê `restoreItem`, nút duy nhất của nó ở màn ấy là nút hoàn tác trên toast; màn lưu trữ kê `archiveItem` cùng lý do. Tác tử không khai đây là lựa chọn. Trang chỉ đường là `.claude/rules/design-assembly.md` dòng 88, và dòng của ô 3 trên phiếu                                                             |
| Trang luật và một chỗ gần ô 5 nói `RowActions` không nhận tên cho từng hành động, chỗ trang không nói thì hỏi    | Tự quyết lặng lẽ (dòng 21)                   | **Hỏi.** Câu `row-actions-names` hỏi tên đọc của nút «⋯», tên lúc chờ và tên của mỗi nút trong danh sách. Trang chỉ việc hỏi là trang luật dòng 40 và chỗ «beyond the twelve slots» dưới ô 5                                                                                                                                               |
| Trang luật và một chỗ gần ô 4 nêu hai luật chọi nhau ở chữ của trạng thái chờ, với câu `row-waiting-state-words` | Tự quyết lặng lẽ (dòng 22)                   | **Hỏi, nhưng bằng câu riêng.** Tác tử hỏi `reference-row-waiting-state`, mục `screen:reference:states`, bằng lời của nó, không dùng lời gọi phiếu đưa cho cả repo; nó làm theo khuyến nghị: bỏ trạng thái `saving` của màn chính, màn mới không khai trạng thái chờ nào của dòng. Trang chỉ việc hỏi là trang luật dòng 60 và chỗ dưới ô 4 |
| Câu giống nhau cho nhiều màn được hỏi một lần, dưới mục `screens:…`                                              | 10 câu phiếu xếp cho 4 việc                  | **Đổi được.** `screens:principles` và `screens:model-changes:Item.archived+archiveItem+listItems+restoreItem`, mỗi câu một lần cho cả ba màn; 6 câu phiếu xếp cho 4 việc. Câu của ô 12 vẫn mỗi màn một câu                                                                                                                                 |
| Câu chung có thêm tên thì được thay, không thành câu thứ hai                                                     | Không có                                     | **Không dùng tới.** Tác tử đổi mô hình (lần gọi 21) trước khi chạy phiếu lần hai và xếp (lần gọi 22–24), rồi không viết thêm tên nào vào mô hình. Không câu nào có `replaces`                                                                                                                                                              |
| Dòng giới hạn phiếu in ra không kể điều tác tử trước làm                                                         | Tác tử đọc được điều lần 12 tìm ra qua phiếu | **Đổi được.** Phiếu lần này không nêu lượt thử nào (mục trên). Báo cáo của tác tử không nhắc lượt thử nào                                                                                                                                                                                                                                  |

**Chạy phiếu cho màn nào, lúc nào:** tác tử chạy phiếu cho cả ba màn nó đổi (`archived`, `reference`, `overdue`), trước
khi dựng; màn «Quá hạn» đổi qua nguồn dữ liệu `src/example/data.ts`. Sau khi dựng, nó chạy lại một lần, chỉ cho màn mới
(lần gọi 51); lần 13 không chạy lại lần nào. Phiếu ấy cho 9 / 3 / 0, `against: 0`. Phiên điều phối chạy lại phiếu của cả
ba màn sau khi dựng: đều 9 / 3 / 0, `against: 0`. Phần «stands now» của ô 12 thấy màn chính đổi, không thấy màn «Quá hạn»,
như lần 13 (`queued-recommendation-not-held-against-the-change`).

**Phiếu ở lần đầu và lần cuối tác tử chạy:**

| Màn         | Lần đầu (đã định / đang hỏi / còn mở)                                                | Lần cuối của tác tử                                                                   | Xếp bằng `--queue`                   | Phiên điều phối chạy sau khi dựng |
| ----------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------- |
| `archived`  | 9 / 0 / 3 (ô 8, 11, 12), trước khi đổi mô hình; 5 ô đã định dựa trên điều nhánh viết | sau khi dựng: 9 / 3 / 0 (ô 8, 10, 12 đang hỏi); ô 11 nay đọc được từ `src/screens.ts` | 4 (ô 8, 10 chung; ô 11, 12 riêng)    | 9 / 3 / 0                         |
| `reference` | 9 / 0 / 3 (ô 8, 10, 12)                                                              | chỉ chạy trước khi dựng: 9 / 0 / 3                                                    | 1 riêng (ô 12); ô 8, 10 là câu chung | 9 / 3 / 0                         |
| `overdue`   | 9 / 0 / 3 (ô 8, 10, 12)                                                              | chỉ chạy trước khi dựng: 9 / 0 / 3                                                    | 1 riêng (ô 12); ô 8, 10 là câu chung | 9 / 3 / 0                         |

Lần chạy thứ hai của phiếu màn mới (lần gọi 22), sau khi đổi mô hình, cho 8 / 0 / 4: ô 10 mở theo tên.

## Đếm từng chỗ

Luật đếm của [`README.md`](README.md), cùng độ chặt với bảng của lần 13: một chỗ là một lần tác tử phải chọn giữa hai
cách hợp lệ mà không trang luật, trang kiểu màn hay trang hành vi nào nói chọn cách nào. Loại chỗ nào lần 13 giữ thì lần
này giữ; loại nào lần 13 bỏ thì lần này bỏ. Tên khái niệm trong mã và chữ người đọc thấy vẫn tính hai chỗ. Câu đang chờ
không định một chỗ: chỗ có câu hỏi trên hàng chờ vẫn là chỗ phải đoán, tính «vào hàng chờ». Cột cuối nói chỗ ứng với dòng
nào của bảng lần 13.

| #   | Tác tử khai                                                                   | Kiểm thấy                                                                                                                                                        | Đếm                 | Lần 13 |
| --- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------ |
| 1   | Id, đường dẫn, khoá tiêu đề của màn                                           | `AGENTS.md` bắt định danh tiếng Anh; màn «Quá hạn» cho mẫu                                                                                                       | bỏ                  | 16     |
| 2   | Hình dạng: cờ `archived` hay giá trị thứ tư của `status`                      | Không trang nào nói. Câu chung của ô 10 nêu `Item.archived (boolean)` và nói «each name and its shape is this branch's own choice»                               | giữ, hàng chờ       | 1      |
| 3   | Tên và thông số hành động: `archiveItem`, `restoreItem`, `update`, idempotent | Bảng thuật ngữ và `actions.yaml` không có. Câu chung của ô 10 nêu từng tên và loại                                                                               | giữ, hàng chờ       | 2      |
| 4   | Thêm hàng nào vào bảng thuật ngữ                                              | Tên trong mã là dòng 3, tên hiển thị là dòng 5                                                                                                                   | gộp vào 3 và 5      | 28     |
| 5   | Chữ người đọc: «Lưu trữ», «Đã lưu trữ», «Bỏ lưu trữ», toast, trạng thái trống | Bảng thuật ngữ và `labels.ts` không có. Hỏi ở `archived-words`                                                                                                   | giữ, hàng chờ       | 3      |
| 6   | Tên đọc: nút «⋯» «Thao tác cho X», tên lúc chờ, tên mỗi nút trong danh sách   | Trang luật dòng 40 nói tên mỗi nút là chữ của màn, chỗ không trang nào nói thì hỏi. Hỏi ở `row-actions-names`                                                    | giữ, hàng chờ       | 21     |
| 7   | Màn chính giữ «Xoá»                                                           | `nhan_viec` của trang kiểu danh sách nói việc của màn mẫu, tức chính màn chính, gồm xoá. Tác tử vẫn hỏi (`reference-keeps-delete`)                               | bỏ (tác tử vẫn hỏi) | 6      |
| 8   | Màn «Quá hạn» ẩn mục đã cất                                                   | Không trang nào nói. Hỏi ở `overdue-hides-archived` và ở ô 12; dựng khớp khuyến nghị                                                                             | giữ, hàng chờ       | 7      |
| 9   | Danh sách chính ẩn mục đã cất                                                 | Đề nói người dùng «put an item back into the main list», tức mục đã cất không còn ở đó                                                                           | bỏ                  | mới    |
| 10  | Mở màn bằng `listItems` và một hàm `listArchivedItems`, hay một truy vấn mới  | Không trang nào nói; màn «Quá hạn» cho tiền lệ nhưng không phải màn mẫu. Hỏi ở `archived-entry-action`, và câu chung của ô 10 nêu «changes the action listItems» | giữ, hàng chờ       | 19     |
| 11  | Trạng thái chờ sau «⋯»: bỏ `saving` của màn chính, màn mới không khai         | Trang luật dòng 60 nói chọn luật nào là của chủ repo. Hỏi ở `reference-row-waiting-state`; dựng theo khuyến nghị của phiếu                                       | giữ, hàng chờ       | 22     |
| 12  | Dáng nút trong «⋯»: `ghost`, `destructive`, cỡ `sm`                           | `row-actions.tsx` chỉ nói thứ tự. Hỏi ở `row-actions-variants`                                                                                                   | giữ, hàng chờ       | 8      |
| 13  | Thêm trạng thái `row-actions` cho hai màn, để phép kiểm thấy danh sách mở     | Không trang nào đòi hay cấm một trạng thái có danh sách «⋯» đang mở; màn mẫu trên `main` không có «⋯»                                                            | giữ, lặng lẽ        | mới    |
| 14  | Kê cả trạng thái hoàn tác thất bại                                            | Trang luật: «never tell a failed undo as done»; màn mẫu có `undo-failed`                                                                                         | bỏ                  | 10     |
| 15  | Mục đưa từ màn này sang màn kia đứng ở đâu: theo thứ tự của nguồn dữ liệu     | Trong một danh sách, trang hành vi nói hoàn tác đưa về chỗ cũ. Khi mục tới từ màn khác thì không trang nào nói, như thứ tự danh sách của lần 13                  | giữ, lặng lẽ        | 11     |
| 16  | Gieo sẵn một mục đã cất, quá hạn, vào dữ liệu mẫu                             | Hai cách đều qua luật. Lần 13 tác tử hỏi; lần này không                                                                                                          | giữ, lặng lẽ        | 9      |
| 17  | Hình dạng phần dùng chung: một hook, hai linh kiện                            | Trang luật nói logic xuống một phần, phần vẽ dùng chung thành linh kiện                                                                                          | bỏ                  | 24     |
| 18  | Trạng thái trống không có liên kết                                            | Trang luật dòng 89: cổng đỏ khi một màn trỏ tới màn khác, nên liên kết tới danh sách chính không qua được cổng; chỉ một cách hợp lệ                              | bỏ                  | mới    |
| 19  | Xoá hẳn dùng lại `deleteItem`                                                 | `deleteItem` đúng là xoá không lấy lại được; `AGENTS.md`: tìm cách đã có trước                                                                                   | bỏ                  | 5      |
| 20  | Chỗ trên thanh điều hướng: cuối                                               | Ô 11, xếp vào hàng chờ, dựng theo khuyến nghị                                                                                                                    | giữ, hàng chờ       | 14     |
| 21  | Việc chính của màn                                                            | Trang kiểu chỉ có chỗ cho màn mẫu. Hỏi ở `archived-main-task`                                                                                                    | giữ, hàng chờ       | 12     |
| 22  | Màn khác đổi theo (ô 12)                                                      | Màn chính buộc phải đổi vì đề đòi; phần còn lại là màn «Quá hạn», tức dòng 8                                                                                     | gộp vào 8           | 15     |
| 23  | Nguyên tắc thiết kế: không có gì để dựa                                       | Ô 8 xếp vào hàng chờ; tác tử không chọn giữa hai cách nào                                                                                                        | bỏ (tác tử vẫn hỏi) | —      |
| 24  | Không viết trang `wiki/decisions/`                                            | Bản sao không có thư mục ấy, như lần 12 và 13                                                                                                                    | bỏ                  | 33     |
| 25  | Không ghi các phần dùng chung mới vào sổ nhận                                 | Đầu tệp `design/intake/_shared.yaml` nói sổ giữ các khối repo «took in», với nơi lấy và mốc ghim; phần viết tại chỗ không có cả hai                              | bỏ                  | mới    |
| 26  | Không commit                                                                  | Đề nói xong khi `make check` xanh                                                                                                                                | bỏ                  | mới    |

Giữ 13 chỗ: 2, 3, 5, 6, 8 (gộp 22), 10, 11, 12, 13, 15, 16, 20, 21. Trong đó 10 chỗ vào hàng chờ, 3 chỗ tự quyết lặng lẽ
(13, 15, 16). Ba chỗ lặng lẽ của lần 13 (dòng 20, 21, 22 của bảng ấy) lần này: một chỗ không còn là chỗ, vì trang luật nói
cách làm và tác tử làm theo; hai chỗ vào hàng chờ (dòng 6 và 11). Ba chỗ lặng lẽ lần này: một loại mới (13), một loại lần
13 tác tử đã hỏi (16, dữ liệu mẫu), một loại lần 13 đã giữ vào hàng chờ (15, thứ tự khi mục tới từ màn khác).

Một chỗ lần 13 giữ thì lần này tác tử không khai: màn «Quá hạn» có thao tác lưu trữ không (dòng 29 của lần 13). Màn ấy lần
này cũng không có thao tác lưu trữ. Như lần 12 và 13, bảng chỉ đếm chỗ tác tử khai, nên chỗ này không vào số 13.

**Chỗ phải phán đoán khi đếm**, để chủ repo thấy con số lung lay tới đâu:

- **Chặt như cách đọc chặt của lần 12 và 13** (gộp tên trong mã với chữ người đọc): còn 12, 9 vào hàng chờ, 3 lặng lẽ.
  Lần 13 đọc cách này được 12.
- **Chặt hơn nữa**, như cách chặt nhất của lần 13: gộp thêm dòng 10 vào 2 (cùng là hình dạng mô hình), bỏ dòng 21 (chỗ ghi
  một câu, không phải lựa chọn của màn), và bỏ dòng 13 (một trạng thái kê thêm để phép kiểm thấy, gộp vào bộ trạng thái mà
  lần 13 bỏ): còn 9, 7 vào hàng chờ, 2 lặng lẽ. Lần 13 đọc cách này được 9, 7 và 2.
- **Lỏng hơn:** tính cả hai chỗ tác tử đã hỏi dù trang có nói hoặc không có gì để chọn (7, 23): thành 15, 12 vào hàng chờ.
  Tính thêm hai chỗ lặng lẽ đã bỏ (9, 25): 17. Lần 13 đọc lỏng được 18, hoặc 19.
- Dòng 10 tính vào hàng chờ cả qua câu riêng lẫn câu chung của ô 10; hai câu ấy cùng nói về một việc (mục dưới).

Đọc theo cách lần 13 đã đếm thì là 13, so với 14. Đọc cách nào thì lần này cũng không cao hơn lần 13 đọc cùng cách: 12 so
với 12, 9 so với 9, 15 hoặc 17 so với 18 hoặc 19.

## Hàng chờ của màn

Lúc tác tử nói xong, `design/waiting/` có 14 câu mới, đều cho việc của màn này, không câu nào có lời đáp, không câu nào
thay câu khác (`replaces` trống ở cả mười bốn):

| Câu                                                                                                     | Ai xếp           | Mục                            |
| ------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------ |
| `screens-principles`                                                                                    | phiếu, câu chung | `screens:principles`           |
| `screens-model-changes-Item.archived+archiveItem+listItems+restoreItem`                                 | phiếu, câu chung | `screens:model-changes:…`      |
| `screen-archived-navigation`                                                                            | phiếu            | `screen:archived:navigation`   |
| `screen-archived-touched-screens`, `screen-reference-touched-screens`, `screen-overdue-touched-screens` | phiếu            | `screen:<màn>:touched-screens` |
| `archived-words`, `row-actions-names`, `row-actions-variants`                                           | tác tử           | không mục                      |
| `archived-main-task`                                                                                    | tác tử           | `screen:archived:kind`         |
| `archived-entry-action`                                                                                 | tác tử           | `screen:archived:actions`      |
| `reference-keeps-delete`                                                                                | tác tử           | `screen:reference:actions`     |
| `reference-row-waiting-state`                                                                           | tác tử           | `screen:reference:states`      |
| `overdue-hides-archived`                                                                                | tác tử           | `screen:overdue:shows`         |

**Hai câu về một việc:**

- `archived-entry-action` và câu chung của ô 10: câu chung hỏi việc đổi mô tả `listItems` cho màn mới, câu riêng hỏi mở
  màn bằng `listItems` hay một truy vấn mới. Cùng một việc: màn mới lấy dữ liệu qua hành động nào.
- `overdue-hides-archived` và `screen-archived-touched-screens`: câu ô 12 khuyến nghị nhìn màn «Quá hạn», câu riêng hỏi
  đúng điều màn ấy đổi. Một phần của cùng một việc, như lần 13.
- Ba câu ô 12, mỗi màn một câu, cho một việc: thay đổi này chạm những màn nào. Ghi ở `brief-touched-screens-asked-per-screen`
  (mới).
- `row-actions-names` và `archived-words` chạm nhau một phần: tên đọc của mỗi nút trong danh sách là chữ của nút, mà câu
  chữ khuyến nghị. Tên của nút «⋯» và tên lúc chờ thì chỉ câu đầu hỏi. Không tính là một việc.

## Điều tác tử báo, và kiểm thấy gì

| Điều tác tử báo                                                                                                           | Kiểm thấy                                                                                                                                                                                                                   | Ghi ở                                                                        |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `make check` xanh; một vòng sửa ở mức `make check`, ba nếu tính bước con                                                  | Đúng: lint đỏ một lần (`react-hooks/refs`), `make test` đỏ 14 bài trên 101, lần chạy đầy đủ đầu đỏ một bài của `frame.spec.ts`, lần hai và lần ba xanh. Phiên điều phối chạy lại: xanh, 113 bài đơn vị, 129 bài trình duyệt | bảng số đo                                                                   |
| 14 câu trên hàng chờ: 6 do phiếu xếp, 8 bằng `decide --ask`                                                               | Đúng: 14 tệp mới, 6 và 8                                                                                                                                                                                                    | mục hàng chờ                                                                 |
| Không dừng hỏi người lần nào                                                                                              | Đúng: không câu nào có lời đáp, không tệp nào ghi thay chủ repo                                                                                                                                                             | bảng số đo                                                                   |
| Chạy `npx vitest` và `npx playwright` thẳng, trái `AGENTS.md`; bài kiểm tạm để chụp ảnh đã xoá                            | Đúng: lần gọi 42 và 47; `git status` không còn tệp ấy                                                                                                                                                                       | không ghi sổ                                                                 |
| Trang hành vi đòi nút đang xoá nói «Đang xoá», mà sau «⋯» nó chỉ nói bằng tên đọc; bỏ trạng thái ấy và hỏi                | Đúng: màn chính không còn `saving`; câu `reference-row-waiting-state` chờ                                                                                                                                                   | `spoken-only-state-unlisted`, `state-words-present-before-the-state` (đã có) |
| Thay đổi mô hình phải nêu trong PR, mà không có PR                                                                        | Đúng; tác tử nêu nó trong báo cáo và trong `wiki/entities/item.md`                                                                                                                                                          | không ghi sổ                                                                 |
| Lỗ hổng không lệnh kiểm nào bắt: không trạng thái nào mở danh sách «⋯», nên axe không đo các nút trong đó                 | Đúng: mọi trạng thái đi qua «⋯» đóng danh sách trước khi trang được đo; chỉ trạng thái `row-actions` tác tử thêm mở nó. Không gì đòi trạng thái ấy                                                                          | `row-actions-open-list-unmeasured` (mới)                                     |
| `decide --item screen:archived:task` bị từ chối với lời «does not name one screen»; trang luật không nói tên ô nào hợp lệ | Đúng: phiên điều phối chạy lại, cùng lời từ chối, không tệp nào được ghi. Màn có trong sổ màn; điều sai là `task` không phải tên một ô. Trang luật không nêu mục dạng `screen:<màn>:<ô>`                                    | `decide-item-refusal-misnames-the-cause` (mới)                               |
| Nối tám lời gọi `decide` bằng `;` nên lời từ chối bị lấp                                                                  | Đúng; lỗi của chính nó, nó hỏi lại hai câu thiếu                                                                                                                                                                            | không ghi sổ                                                                 |
| `ui.md` nói bài trình duyệt chạy ở 1440 và 390 px, mà sổ cỡ màn là 320 và 1440                                            | Đúng một phần: `make ui-floor` chạy mọi bài trình duyệt; `floor.spec.ts` ở 1440 và 390, `templates.spec.ts` ở 320 và 1440. Tác tử nói chỉ `frame.spec.ts` thêm 390, mà `floor.spec.ts` cũng dùng 390                        | không ghi sổ; `ui.md` là trang của sàn, việc này không được sửa nó           |
| `ui.md` nói đăng ký màn ở `src/screens.ts` là đủ, «nothing else to wire», mà màn còn cần `design/screens/<id>.yaml`       | Đúng: `.claude/rules/ui.md` dòng 15; trang luật của plugin dòng 87 đòi cả hai                                                                                                                                               | không ghi sổ; `ui.md` là trang của sàn                                       |
| Trang hành vi và trang luật chọi nhau ở liên kết trong trạng thái trống                                                   | Đúng: trang luật dòng 89 (không màn nào trỏ tới màn khác) và dòng 90 (nhiều nhất một liên kết trong chữ)                                                                                                                    | `empty-state-link-fails-the-gate` (đã có)                                    |
| `AGENTS.md` nhắc «the plan tool (run through `make`)» mà không có đích ấy                                                 | Đúng, do cách dựng bản sao, như lần 13                                                                                                                                                                                      | khác biệt của lượt thử                                                       |

**Điều phiên điều phối thấy mà tác tử không báo:**

- Câu về chữ của trạng thái chờ được hỏi bằng lời riêng, mục `screen:reference:states`, không bằng lời gọi phiếu đưa cho
  cả repo (`--id row-waiting-state-words`, không mục). Một màn khác về sau gặp cùng chỗ sẽ không thấy câu nào cho cả repo
  đang chờ. Chưa ghi sổ: lời gọi có trên phiếu, và không gì buộc tác tử dùng đúng lời gọi.
- Ba câu ô 12, mỗi màn một câu, cho một việc. Ghi ở `brief-touched-screens-asked-per-screen` (mới).
- Phần «stands now» của ô 12 vẫn không thấy màn «Quá hạn» đã đổi qua nguồn dữ liệu. Đã có ở
  `queued-recommendation-not-held-against-the-change`.

## Sau khi chạy

Theo mục «Sau khi chạy» của [`README.md`](README.md):

1. Mỗi điều tác tử báo đã được kiểm trên bản sao của nó (bảng trên).
2. Không sửa gì trong plugin.
3. `plugins/design-assembly/references/limits.json`:
   - **Thu hẹp** `brief-sheet-narrows-what-the-builder-asks`, với lượt này làm căn cứ: các chỗ phiếu chỉ nay đều được
     hỏi hoặc có trang nói cách làm. Điều còn mở được viết rõ hơn: không gì thấy lựa chọn ngoài mười hai ô và các chỗ phiếu
     chỉ, như dữ liệu mẫu, một trạng thái kê thêm cho phép kiểm, chỗ đứng của mục tới từ màn khác; lời không kể tác tử nào
     đã làm gì. Dòng vẫn mở, mức vừa, `plan: fix`.
   - **Mới:** `row-actions-open-list-unmeasured` (mức vừa), `decide-item-refusal-misnames-the-cause` (mức nhẹ),
     `brief-touched-screens-asked-per-screen` (mức nhẹ), cả ba `plan: fix`. Mức và hướng xử lý là đề xuất của phiên này,
     chờ chủ repo. Dòng thứ ba thuộc vùng `brief`, nên phiếu in nó; lời của nó không nêu lượt thử nào, và bài kiểm của
     plugin giữ điều ấy.
   - Không dòng nào đóng. `screen-actions-toast-button-unsaid`, `spoken-only-state-unlisted`,
     `brief-run-before-building-unheld`, `queued-recommendation-not-held-against-the-change` và
     `brief-not-tried-by-a-builder` để nguyên: lượt này cho thấy đúng điều chúng ghi là còn mở. Dòng
     `trial-builder-reads-findings-through-the-sheet` đã đóng; lượt này là lượt đầu sau khi đóng, và phiếu không kể lượt
     thử nào.
4. Sổ lỗi lọt `design/escapes.md` của kho này không thêm dòng. Không lỗi nào của màn lọt qua các lệnh kiểm; hai điều tác
   tử nêu là một chỗ phép kiểm không đo và một lời từ chối sai lý do, cả hai đã thành dòng sổ giới hạn. Lần 13 cũng làm
   như vậy.
5. Đề bài `wiki/specs/0001-design-system-for-claude-code.md` có thêm mục «Chạy thử lần mười bốn».

## Chi phí

| Ai              | Token                                              | Lần gọi công cụ         | Thời gian                                     | Ước tính trước                    |
| --------------- | -------------------------------------------------- | ----------------------- | --------------------------------------------- | --------------------------------- |
| Tác tử dựng     | 336.055                                            | 52                      | 21 phút 56 giây (10:05–10:27)                 | khoảng 340 nghìn                  |
| Phiên điều phối | khoảng 150 nghìn trong ngữ cảnh lúc viết trang này | khoảng 60 tới lúc mở PR | khoảng 60 phút từ lúc nhận việc tới lúc mở PR | khoảng 200 nghìn ngữ cảnh         |
| Cộng            | khoảng 490 nghìn                                   |                         |                                               | 400 đến 700 nghìn, khoảng 75 phút |

Tác tử dựng dùng gần đúng ước tính, và gần bằng lần 13 (338.550), với ít lần gọi hơn (52 so với 57) nhưng lâu hơn 5 phút:
phần lớn thời gian thêm là ba lần `make check` đầy đủ, lần 13 chỉ một. Con số của phiên điều phối là cỡ ngữ cảnh ước lượng,
không phải tổng token đã tính tiền: mỗi lượt của phiên đọc lại ngữ cảnh, nên tổng thật cao hơn, và phiên không đọc được
tổng ấy.

## Vì sao không so thẳng 13 với 14

- **Loại chỗ đổi giữa hai lượt.** Ba loại lần 13 tự quyết lặng lẽ nay không lặng lẽ, còn ba chỗ lặng lẽ lần này là loại
  khác. Hai lượt đếm cùng luật nhưng không cùng những lựa chọn: một tác tử khác chọn và khai những chỗ khác. Lần 13 khai 33,
  lần này 26.
- **Mỗi bên chỉ một lượt.** Các lần 7 đến 10 cùng đề cho 12, 12, 13, 11, tức hai lượt cùng điều kiện đã lệch nhau tới hai
  chỗ. Một chỗ chênh (13 so với 14) nằm trong độ lệch ấy.
- **Đếm là phán đoán.** Cùng một báo cáo đọc ra từ 9 tới 17 tuỳ độ chặt. Người đếm của lần 13 và lần 14 là hai phiên điều
  phối khác nhau. Phiên lần này bắt đầu bằng Fable 5.2 lúc đọc cách làm, và chạy bằng Opus 5.5 từ lúc dựng bản sao tới hết,
  nên phần dựng, khởi động tác tử, kiểm và đếm đều làm bằng Opus 5.5. Phiên này biết dòng «done when» đòi số không tăng,
  và đếm sau khi đã biết số của lần 13.
- **Plugin đã đổi** từ 0.25.1 lên 0.26.0, chỉ ở các sửa của mục 5.7; ngoài plugin, bản sao chỉ khác ở `tools/plan.mjs`,
  không lệnh nào của bản sao chạy.
- **Mô hình của tác tử** là Opus 5.5, như lần 12 và 13; điều này không khác.
- **Đề vẫn nói «một màn»**, như lần 11, 12 và 13.

## Dòng «done when» của giai đoạn 5

Dòng ấy đòi: một tác tử độc lập dựng một màn chỉ từ brief, và số chỗ phải đoán không tăng so với lượt thử gần nhất.

- Nửa đầu đạt, như lần 12 và 13: tác tử dựng màn chỉ từ đề, tự tìm ra phiếu từ trang luật, chạy nó cho ba màn trước khi
  dựng, và cổng xanh.
- Nửa sau **được lượt này chứng, theo chữ của dòng ấy**: đếm theo cách lần 13 thì 13 so với 14, tức không tăng. Đọc chặt
  hay lỏng cách nào thì cũng không cao hơn lần 13 đọc cùng cách (12 so với 12, 9 so với 9, 15 hoặc 17 so với 18 hoặc 19).
- Điều nên nói kèm: «lượt thử gần nhất» là lần 13, mà lần 13 cao hơn lần 12 (11) và lần 11 (9). So với lần 12 thì 13 vẫn
  cao hơn 11. Số chỗ tự quyết lặng lẽ, chỗ chủ repo không bao giờ thấy, là 3, bằng lần 13 và thấp hơn 9 của lần 12. Một
  chỗ chênh nằm trong độ lệch của hai lượt cùng điều kiện.

Mục 5.7 xong: cả phần sửa và lượt chạy lại đều đã làm. Giai đoạn 5 chưa đóng; đóng hay không là lời của chủ repo. Mục 5.3
(bài kiểm trình duyệt theo vai) cũng còn `todo`.
