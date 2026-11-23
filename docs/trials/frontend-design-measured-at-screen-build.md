# Skill frontend-design đo ở ổ dựng màn (mục 10.2, phích thứ ba)

Một lượt, ngày 2026-11-23, lần chạy thử 17. Chủ repo cho chạy («Cho chạy một nhánh») sau khi nghe quy trình và ước tính:
khoảng 550 nghìn token, 90 phút, trần 850 nghìn. Bản quyết định đi kèm:
[0097](../../wiki/decisions/0097-frontend-design-measured-at-the-screen-build-socket.md).

**Kết luận ngắn:**

- Cổng xanh. Tác tử không dừng hỏi người lần nào.
- Sau khi kiểm còn 12 chỗ phải đoán, cả 12 vào hàng chờ, 0 chỗ tự quyết lặng lẽ. Chuỗi lần 11 đến 14 là 9, 11, 14, 13.
- 0 lời đáp ghi thay chủ repo, 0 giá trị thiết kế ngoài sổ.
- Skill đòi bảng màu, font và bố cục riêng. Tác tử theo repo, nên màn mới cùng dáng với màn chính, và skill không đổi
  được gì mà cổng phải chặn.

## Cách làm

- **Skill đo:** `frontend-design:frontend-design`, bản 1.1.1 của plugin chính thức (trang `SKILL.md` 71 dòng, sha1
  `0104e025`). Máy này còn một skill cá nhân cùng tên trần `frontend-design`, nội dung khác hẳn (145 dòng, sha1
  `92cc482f`). Skill ấy không được đo.
- **Bản sao bỏ đi:** `git archive` của `acf3d2a` (plugin 0.48.0) vào thư mục nháp của phiên. Bỏ đúng danh sách của lần
  14: `plugins/`, `docs/`, `wiki/decisions/`, `wiki/specs/`, `tests/plugin-*`, `mk/plugin.mk`, `mk/plan.mk`, hồ sơ bộ kit.
  Bỏ phần kế hoạch của `AGENTS.md`, và 107 dòng của `wiki/index.md`, 193 dòng của `wiki/log.md` trỏ tới trang đã bỏ.
  `git init` riêng, nên tác tử không đọc được lịch sử của kho. `npm ci` riêng, không nối `node_modules` của bản checkout.
- **Xanh trước khi bắt đầu:** `make check` đạt ngay lần đầu: 94 bài đơn vị, 80 bài trình duyệt, 43 quyết định giữ bằng
  83 phép kiểm. Tệp cổng sinh ra được dời khỏi bản sao. Phiếu `brief reference` và trang luật không nêu lượt thử nào.
- **Đề:** [`briefs/screen.md`](briefs/screen.md) nguyên văn, rồi lời thêm của lần 12 đến 14 (đường dẫn, hai lối chạy
  `brief` và `decide`). Thêm một đoạn mới: chủ repo đã chọn skill này để dựng màn; gọi nó bằng công cụ Skill trước khi
  dựng và dùng cùng với điều repo bảo đọc; không gửi gì của repo ra ngoài. Đoạn ấy cũng xin tác tử nói chỗ skill và
  repo chỉ hai hướng, và nó theo bên nào.
- **Tác tử:** một tác tử con mới, kiểu `general-purpose`. Bản ghi cho thấy mọi lượt trả lời đều của `claude-opus-5-5`,
  như lần 12 đến 14. Nó không nhận kết luận nào của phiên điều phối, và không được nói về các lượt trước.
- **Plugin** chạy từ worktree của phiên điều phối, ở `acf3d2a`, không đổi trong lúc tác tử chạy.

## Lượt chạy

Từ 22:39 tới 22:54, qua 58 lần gọi công cụ:

| Bước                                                                                                    | Lần gọi |
| ------------------------------------------------------------------------------------------------------- | ------- |
| Đọc `AGENTS.md`, wiki, trang hành vi, hai trang luật, trang kiểu màn, mã, sổ quyết định                 | 1–13    |
| **Gọi skill `frontend-design:frontend-design`**                                                         | 14      |
| Ghi màn mới vào sổ màn, chạy phiếu của ba màn, `make check` trên bản sao chưa đổi                       | 15–23   |
| Đổi mô hình dữ liệu, sổ màn, `brief --queue`, mười câu `decide --ask`                                   | 24–35   |
| Dựng: hai hook, hai linh kiện, màn chính, màn mới, chữ, dữ liệu mẫu                                     | 36–43   |
| Lint đỏ một lần, bài đơn vị đỏ 14 rồi 1, sửa; bài kiểm mới; thử làm sai mã để xem bài kiểm có bắt không | 44–54   |
| `make check` lần 1 đỏ ở `design-exports`; `make design-exports`; lần 2 xanh                             | 55–57   |
| Chụp màn ở 320 và 1440 px bằng một máy chủ xem trước tại chỗ, xem ảnh                                   | 58–66   |

Tác tử không commit. Phiên điều phối giữ bài làm trong bản sao ở commit `9749e1a`: 44 tệp, thêm 1 152 dòng, bớt 248.

## Số đo, đặt cạnh lần 12 đến 14

| Đo gì                                       | Lần 12             | Lần 13             | Lần 14             | Lần 17, có skill                                            |
| ------------------------------------------- | ------------------ | ------------------ | ------------------ | ----------------------------------------------------------- |
| Plugin                                      | 0.24.0             | 0.25.1             | 0.26.0             | 0.48.0                                                      |
| Cổng, phiên điều phối chạy lại              | xanh               | xanh               | xanh               | xanh: 118 bài đơn vị, 126 bài trình duyệt; sổ loại cột khớp |
| Lần `make check` đầy đủ đỏ trước khi xanh   | —                  | 0                  | 1                  | 1 (`design-exports`), cộng 3 vòng ở bước con                |
| Số lần dừng hỏi người                       | 0                  | 0                  | 0                  | 0                                                           |
| Chỗ tác tử khai là tự quyết                 | 22                 | 33                 | 26                 | 30                                                          |
| **Chỗ phải đoán, sau khi kiểm**             | **11**             | **14**             | **13**             | **12**                                                      |
| … vào hàng chờ / tự quyết lặng lẽ           | 2 / 9              | 11 / 3             | 10 / 3             | 12 / 0                                                      |
| Câu tác tử xếp vào `design/waiting/`        | 3                  | 21                 | 14                 | 16: 6 bằng `brief --queue`, 10 bằng `decide --ask`          |
| Lời đáp ghi thay chủ repo                   | 0                  | 0                  | 0                  | 0                                                           |
| Giá trị thiết kế ngoài sổ (màu, font, bóng) | không đo           | không đo           | không đo           | 0                                                           |
| Tệp không được đụng                         | không đổi          | không đổi          | không đổi          | không đổi                                                   |
| Token, lần gọi, thời gian                   | 295 436, 40, 13:42 | 338 550, 57, 16:44 | 336 055, 52, 21:56 | 295 493, 58, 14:51                                          |

## Thước 1: giữ được không

Phiên điều phối đo bằng lệnh, không gọi mô hình, trên bài làm của tác tử:

- `make check` xanh; `make design-columns`: sổ loại cột khớp. Bài trình duyệt theo vai nằm trong 126 bài.
- Màn mới có dòng sổ màn `design/screens/archived.yaml` với hành động và trạng thái; hai màn dùng chung `ItemTable`.
- Các tệp không được đụng không đổi: `src/lib/notify.ts`, `src/components/ui/`, `tools/`, `mk/`, `Makefile`, `.claude/`,
  `tests/e2e/floor.spec.ts`, `design/behaviors.md`, `design/patterns/`, `package.json`, `src/index.css`.
- **Giá trị ngoài sổ: 0.** Dòng thêm trong `src/` và `tests/` không có mã màu, `font-family`, bóng, chuyển động, giá trị
  viết vòng hay URL. Hai chuỗi lớp mới đều chép nguyên từ màn chính và màn «Quá hạn». Biến thể nút (`ghost`,
  `destructive`, `outline`) là biến thể sẵn của linh kiện. Không gói mới.
- **Cổng xuất của mục 10.4 làm đúng việc:** thêm màn làm `DESIGN.md` và bộ hệ trong `design/export/system/` cũ so với
  sổ. Cổng đỏ, nêu lệnh `make design-exports`, và tác tử sửa một bước. Đây là lần đầu một tác tử dựng gặp cổng ấy.
- **Thứ skill bảo làm mà không lệnh nào giữ:** skill bảo lập một bộ token riêng (4 đến 6 mã màu, kiểu chữ, bố cục) rồi
  mới viết mã. Tác tử không lập bộ ấy. Nếu lập và viết vào mã, cổng chặn màu thô; một font mới thì phải qua sổ nguồn.
  Ảnh tự soát skill bảo chụp nằm ngoài bản sao; không lệnh nào đọc chúng.
- Đọc tĩnh trang skill: nó không nêu sổ, cổng hay hàng chờ nào. Nó nói theo đúng lời của đề khi đề định hướng đi, và
  hỏi lại người khi đề không nói sản phẩm là gì.

## Thước 2: phải đoán mấy chỗ

Luật đếm của [`README.md`](README.md), cùng độ chặt với lần 14. Loại chỗ nào lần 14 giữ thì lần này giữ; loại nào lần
14 bỏ thì lần này bỏ. Chỗ có câu hỏi trên hàng chờ vẫn là chỗ phải đoán, tính «vào hàng chờ».

| #   | Tác tử khai                                                      | Kiểm thấy                                                                                             | Đếm            | Lần 14 |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------- | ------ |
| 1   | Tên trong mã `archived`, `archiveItem`, `restoreItem`            | Câu chung của ô 10 nêu từng tên                                                                       | giữ, hàng chờ  | 3      |
| 2   | Hình dạng: cờ `archived`, không phải giá trị thứ tư của `status` | Câu chung của ô 10                                                                                    | giữ, hàng chờ  | 2      |
| 3   | Chữ «Lưu trữ», «Đã lưu trữ», «Khôi phục», toast                  | Hỏi ở `words-archive-restore`                                                                         | giữ, hàng chờ  | 5      |
| 4   | Tên đọc của mỗi nút trong danh sách «⋯»                          | Trang luật: chỗ không trang nào nói thì hỏi. Hỏi ở `row-actions-button-names`                         | giữ, hàng chờ  | 6      |
| 5   | Màn chính giữ «Xoá»                                              | `nhan_viec` của trang kiểu danh sách gồm xoá. Tác tử vẫn hỏi                                          | bỏ             | 7      |
| 6   | Màn «Quá hạn» ẩn mục đã lưu trữ                                  | Hỏi ở `overdue-hides-archived`                                                                        | giữ, hàng chờ  | 8      |
| 7   | Mục khôi phục về chỗ cũ                                          | Trong một danh sách trang hành vi nói; từ màn khác thì không. Hỏi ở `restored-item-place`             | giữ, hàng chờ  | 15     |
| 8   | Gieo sẵn một mục đã lưu trữ                                      | Hỏi ở `archived-sample-data`                                                                          | giữ, hàng chờ  | 16     |
| 9   | Việc chính của màn mới                                           | Trang kiểu chỉ có chỗ cho màn mẫu. Hỏi ở `archived-main-task`                                         | giữ, hàng chờ  | 21     |
| 10  | Dáng nút trong «⋯»                                               | Phiếu nói biến thể không nằm ở ô nào. Hỏi ở `row-actions-button-looks`                                | giữ, hàng chờ  | 12     |
| 11  | Chữ của trạng thái trống, không liên kết                         | Chữ thuộc dòng 3; không liên kết vì cổng đỏ khi màn trỏ màn khác                                      | gộp vào 3      | 5, 18  |
| 12  | Bỏ trạng thái `saving` của màn chính                             | Trang luật: chọn luật nào là của chủ repo. Hỏi bằng đúng lời gọi phiếu đưa, `row-waiting-state-words` | giữ, hàng chờ  | 11     |
| 13  | Chỗ trên thanh điều hướng                                        | Ô 11, phiếu xếp                                                                                       | giữ, hàng chờ  | 20     |
| 14  | Màn khác đổi theo (ô 12)                                         | Phần còn lại là màn «Quá hạn», tức dòng 6                                                             | gộp vào 6      | 22     |
| 15  | Nguyên tắc thiết kế: không có gì để dựa                          | Ô 8 xếp vào hàng chờ; không chọn giữa hai cách nào                                                    | bỏ             | 23     |
| 16  | Id và đường dẫn của màn                                          | `AGENTS.md` bắt định danh tiếng Anh; màn «Quá hạn» cho mẫu                                            | bỏ             | 1      |
| 17  | Mở màn bằng `listItems`, không thêm truy vấn mới                 | Không trang nào nói. Câu chung của ô 10 nêu `listItems`                                               | giữ, hàng chờ  | 10     |
| 18  | Loại hành động `update`, idempotent, `agent: forbidden`          | Thông số của tên ở dòng 1                                                                             | gộp vào 1      | 3      |
| 19  | Dòng mới của bảng thuật ngữ                                      | Tên trong mã là dòng 1, tên hiển thị là dòng 3                                                        | gộp vào 1 và 3 | 4      |
| 20  | Tên nút «⋯»: «Thao tác cho X»                                    | Câu của dòng 4 nêu tên ấy trong khuyến nghị                                                           | gộp vào 4      | 6      |
| 21  | Tên lúc chờ «Đang lưu trữ X», «Đang khôi phục X»                 | Theo mẫu `deletingItem` («Đang xoá X») của `labels.ts`                                                | bỏ             | 6      |
| 22  | Chữ của toast lỗi và hoàn tác lỗi                                | Trang hành vi định nội dung; theo mẫu `undoFailed` của `labels.ts`                                    | bỏ             | 5      |
| 23  | Trạng thái của màn mới                                           | Trang hành vi: mỗi thao tác làm ngay khai trạng thái thất bại; hoàn tác lỗi không báo như đã xong     | bỏ             | 14     |
| 24  | Trạng thái mới của màn chính                                     | Như dòng 23                                                                                           | bỏ             | 14     |
| 25  | Cách tách phần dùng chung                                        | Trang luật nói logic xuống một phần, phần vẽ thành linh kiện                                          | bỏ             | 17     |
| 26  | Mục lưu trữ giữ nguyên `status`                                  | Hệ quả của hình dạng ở dòng 2                                                                         | gộp vào 2      | —      |
| 27  | Tên kịch bản kiểm thử                                            | Định danh trong mã, theo mẫu các kịch bản có sẵn                                                      | bỏ             | —      |
| 28  | Hoàn tác tính chỗ theo cả danh sách, không theo danh sách lọc    | Một phần của dòng 7                                                                                   | gộp vào 7      | —      |
| 29  | Làm trên một nhánh, không commit                                 | Đề nói xong khi `make check` xanh                                                                     | bỏ             | 26     |
| 30  | Không ghi linh kiện mới vào sổ nhận                              | Sổ nhận giữ khối repo lấy về, có nguồn và ghim; phần viết tại chỗ không có                            | bỏ             | 25     |

Giữ 12 chỗ: 1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 17. Cả 12 vào hàng chờ; 0 chỗ tự quyết lặng lẽ.

**Con số lung lay tới đâu:**

- Chặt như cách đọc chặt của lần 14 (gộp tên trong mã với chữ người đọc): 11. Lần 14 đọc cách này được 12.
- Chặt hơn nữa (gộp dòng 17 vào 2, bỏ dòng 9): 9. Lần 14 đọc cách này được 9.
- Lỏng hơn (tính cả hai chỗ tác tử vẫn hỏi dù trang có nói hoặc không có gì để chọn, dòng 5 và 15): 14. Tính thêm hai chỗ
  lặng lẽ đã bỏ (21, 30): 16. Lần 14 đọc lỏng được 15, hoặc 17.
- Đọc cách nào thì lần này cũng không cao hơn lần 14 đọc cùng cách.

Ba chỗ lần 14 tự quyết lặng lẽ (trạng thái kê thêm cho phép kiểm, chỗ đứng của mục tới từ màn khác, dữ liệu mẫu) lần này:
hai chỗ sau được hỏi, chỗ đầu tác tử không làm.

Bảng chỉ đếm chỗ tác tử khai. Một chỗ nó không khai: màn «Quá hạn» không có thao tác lưu trữ, như lần 14.

## Thước 3: chạy được ở đâu

- Skill là một trang chữ tại chỗ, trong một plugin của Claude Code. Cài plugin cần mạng một lần; lượt này không cài gì.
- Bản ghi của tác tử không có lần gọi mạng nào: không `curl`, không cài gói, không URL font hay CDN trong mã nó viết.
  Máy chủ xem trước chạy ở `127.0.0.1`. Ảnh tự soát nằm trong thư mục nháp.
- Không gì của repo ra khỏi máy. Tài khoản: không cần.

## Thước 4: tốn bao nhiêu

| Ai              | Token                                        | Lần gọi | Thời gian                     | Ước tính trước            |
| --------------- | -------------------------------------------- | ------- | ----------------------------- | ------------------------- |
| Tác tử dựng     | 295 493, theo bộ đếm của phiên               | 58      | 14 phút 51 giây (22:39–22:54) | 340 đến 420 nghìn         |
| Phiên điều phối | khoảng 150 nghìn ngữ cảnh lúc viết trang này |         | khoảng 70 phút tới lúc mở PR  | 150 đến 200 nghìn         |
| Cộng            | khoảng 450 nghìn                             |         |                               | khoảng 550 nghìn, 90 phút |

Tác tử dựng tốn bằng lần 12, ít hơn lần 13 và 14. Vòng lập kế hoạch của skill không xảy ra, nên không có phần token thêm
mà ước tính đã tính cho nó. Con số của phiên điều phối là cỡ ngữ cảnh ước lượng, không phải tổng token đã tính tiền.

## Điều tác tử báo, và kiểm thấy gì

| Điều tác tử báo                                                                     | Kiểm thấy                                                                                                        |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Đã gọi skill                                                                        | Đúng: lần gọi 14; trang nạp vào là bản chính thức 1.1.1                                                          |
| `make check` xanh sau 2 vòng; vòng 1 đỏ ở `design-exports`                          | Đúng (bản ghi `check1.txt` của nó); trước đó lint đỏ một lần, bài đơn vị đỏ 14 rồi 1                             |
| 16 câu trên hàng chờ, 6 phiếu xếp, 10 tự hỏi; không lần nào hỏi người               | Đúng: 16 tệp mới, không tệp nào có lời đáp                                                                       |
| Skill và repo chỉ hai hướng: bảng màu, font, mở đầu gây ấn tượng; nó theo repo      | Đúng: 0 giá trị ngoài sổ (thước 1)                                                                               |
| Từ skill nó giữ hai việc: chụp ảnh tự soát, một tên cho một việc suốt luồng         | Ảnh có trong thư mục nháp. Việc thứ hai không phân biệt được với trang chữ của repo                              |
| Chạy thẳng `npx tsc`, `npx vitest`, Playwright, trái `AGENTS.md`                    | Đúng, như lần 14                                                                                                 |
| Dùng `git stash` trong bản sao                                                      | Đúng: lần gọi 22 và 24, trong `.git` riêng của bản sao, đã áp lại và bỏ                                          |
| `ui.md` nói đăng ký màn ở `src/screens.ts` là đủ; nói kiểm ở 1440 và 390 px         | Đúng, như lần 14; `ui.md` là trang của sàn, không sửa ở đây                                                      |
| Lời gọi «ask it» của phiếu trỏ tới `plugins/…/decide.mjs` không có trong bản sao    | Đúng; do cách dựng bản sao (plugin chạy từ ngoài), không phải lỗi của phiếu                                      |
| Không gì thấy trang kiểu màn (`nhan_viec`) nay không còn nói hết việc của màn chính | Đúng: không lệnh nào so `nhan_viec` với hành động của màn. Nằm trong `brief-sheet-narrows-what-the-builder-asks` |
| Đề nói ứng dụng «có một màn», thực ra có hai                                        | Đúng, như lần 11 đến 14                                                                                          |

## Giới hạn

- **Một nhánh, một lượt.** Không có nhánh không skill cùng ngày ở plugin 0.48.0, nên không tách được phần của skill khỏi
  phần của 22 bản plugin từ lần 14. Hai lượt cùng điều kiện đã lệch nhau tới 3 chỗ.
- **Skill không được dùng ở chỗ nó mạnh nhất.** Repo đã có hướng đi trong sổ, và trang luật cùng cổng giữ nó. Trên một
  repo chưa định hướng đi, skill bảo tự chọn bảng màu, font và bố cục; lượt này không đo chỗ ấy.
- **Đếm là phán đoán** của phiên điều phối, phiên biết luật đọc đặt trước và biết số của lần 14. Phiên này bắt đầu bằng
  Fable 5.2 lúc đọc cách làm và viết quy trình, rồi chạy bằng Opus 5.5 từ lúc dựng bản sao tới hết.
- **Lời thêm dài hơn lần 14 một đoạn**, gồm câu xin nói chỗ skill và repo chỉ hai hướng. Câu ấy có thể làm tác tử khai
  nhiều hơn.
- **Phiên của tác tử mang luật chung của máy này** về chất lượng giao diện web, đẩy cùng chiều với skill. Các lượt trước
  cũng vậy.
- Chưa đo: skill cá nhân cùng tên; skill đứng một mình không có trang luật; mắt người nhìn màn dựng ra.
- Bản sao, bản ghi đầy đủ của tác tử, diff và ảnh nằm trong thư mục nháp của phiên, không được giữ.
