# Lượt thử có người, chạy lại: chọn phích trong một lượt, rồi hai nhánh dựng màn

Lần chạy thử 19, ngày 2026-11-25, cho mục 10.4: dòng «xong khi» của giai đoạn 10 (tiêu chí 13 của đề bài
[0014](../../wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md)). Đây là lượt chạy lại từ đầu sau khi bản sửa
[0108](../../wiki/decisions/0108-session-names-go-one-to-a-flag.md) gộp (PR #137, `d3be68a`). Lượt trước dừng ở bước plugs:
[bản ghi](person-trial-stopped-at-the-plugs-step.md). Bản quyết định đi kèm:
[0111](../../wiki/decisions/0111-the-person-trial-shows-the-stage-10-line.md).

**Kết luận ngắn:**

- **Bước plugs hỏi đúng hai câu:** ổ dựng màn và ổ soát thiết kế. Chủ repo đáp một lần: «frontend-design, review».
- **Cổng xanh ở cả hai nhánh** khi phiên chạy thử chạy lại `make check`.
  - Nhánh A được bảo bằng lời dùng skill `frontend-design:frontend-design`.
  - Nhánh B không được bảo.
- **Chỗ phải đoán, sau khi kiểm:** A có 14, B có 14. A: 10 vào hàng chờ, 4 tự quyết lặng lẽ. B: 11 vào hàng chờ, 3 tự quyết lặng lẽ.
- **0 lời đáp ghi thay chủ repo, 0 giá trị thiết kế ngoài sổ,** ở cả hai nhánh.
- **Dòng «xong khi» được cho thấy trọn**, với bốn điều kèm theo:
  - nhánh A tới skill chủ repo chọn chỉ vì được bảo bằng lời. Nhánh B không tới, dù sổ quyết định ghi skill ấy;
  - cổng của repo mới chỉ xanh sau hai câu mà plugin đáng lẽ không phải hỏi;
  - `src/lib/notify.ts` không có trong repo này;
  - mỗi nhánh chạy một lượt.

## Bản sao, plugin, tác tử

- **Bản sao của nhánh dẫn dắt.** Dựng như lượt 15, 16 và 18:
  - clone kho này ở `e56e77c`, nhánh `main` tại chỗ, bỏ remote, xoá mọi nhánh và nhãn khác, xoá reflog, dọn kho;
  - `node_modules` của bản checkout chính nối bằng liên kết;
  - `make check` xanh ngay lần đầu: 25 bài đơn vị, 16 bài trình duyệt.

  `e56e77c` là commit dựng kho của repo này: một repo mới, chưa có hệ thiết kế, có một màn mẫu.

- **Plugin.** `git archive` của `plugins/design-assembly` ở `d3be68a` (plugin 0.58.0), bung cạnh bản sao.
  - Dấu băm cây git là `1078301e369ac5471063082860d97251a7d3a0bf` trước lượt.
  - Sau cả ba tác tử, dấu băm vẫn đúng như vậy.
- **Đề của nhánh dẫn dắt.** [`briefs/guide.md`](briefs/guide.md) nguyên văn, rồi bốn câu lời thêm của lượt 15 và 16, chỉ đổi tên
  lượt. Không câu nào nói cách truyền tên.
- **Tác tử.** Ba tác tử con mới, kiểu `general-purpose`. Mọi lượt trả lời đều của `claude-opus-5-5`. Không tác tử nào
  biết gì về các lượt trước.

## Nhánh dẫn dắt

| Giờ (UTC) | Việc                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| 02:16:53  | Tác tử nhận đề                                                                                             |
| 02:18:19  | Bước plugs, lần gọi duy nhất (mục kế)                                                                      |
| 02:18:56  | Câu mức accessibility; đáp bằng câu niêm phong 02                                                          |
| 02:21:00  | Câu nguyên tắc; đáp bằng câu 16                                                                            |
| 02:21:46  | Câu hướng thiết kế; đáp bằng câu 17                                                                        |
| 02:23:05  | Câu màu; đáp bằng câu 07, rồi lời chủ repo «frontend-design, review» làm đoạn thứ hai                      |
| 02:24:05  | Câu kiểu chữ; câu 11                                                                                       |
| 02:24:35  | Câu màu xám; câu 12                                                                                        |
| 02:24:58  | Câu màu trạng thái; câu 13                                                                                 |
| 02:25:37  | Ba câu: thanh bên, màu biểu đồ, giấy phép font; câu 14, 15 và 18                                           |
| 02:26:46  | Câu duyệt cuối «Anh duyệt để tôi build (blueprint chuyển sang `approved`), hay muốn đổi gì trước?»; câu 08 |
| 02:28:18  | Dựng xong, cổng đỏ; bảng quyết định có bảy câu (mục «Cổng đỏ sau bước dựng»)                               |
| 03:37:25  | Lời cho câu 6 và 7                                                                                         |
| 03:43:52  | `new` xong; cổng xanh                                                                                      |

Mọi lời đáp niêm phong được dán nguyên văn. Câu 08 đáp đúng câu duyệt cuối mà dòng mở đầu của nó nêu.

### Bước plugs

Tác tử chạy `plugs` một lần, qua `bash -c`, với mảng đối số dựng từ ba tệp tên, mỗi dòng một tên: 602 đối số. Lệnh in:

```text
Plugs: 20 sockets: 2 are closed, 8 have only the plugin's plug, 10 have plugs from outside, 7 of them a measured one.
Read from the session: 264 skills, 23 servers, 14 servers waiting for a sign-in.
```

Lệnh thoát 1 với hai câu:

- **`plug-screen-build`:** khuyến nghị phích của plugin (`rules-page`), dựa trên quyết định 0097;
- **`plug-design-review`:** khuyến nghị phích của plugin (`review`), dựa trên quyết định 0073.

Nó cũng in một dòng nói `reui` có trong phiên mà chưa được ghim làm nguồn.

**Đối chiếu dòng «Read from the session» với điều phiên liệt kê.**

- **Skill:** tác tử truyền đủ 264 skill phiên liệt kê.
- **Server hoãn:** danh sách công cụ hoãn của phiên nêu 33 server. 10 không được truyền: các server `ccd_*` của chính ứng dụng, một
  server tài liệu và `Desktop_Commander`.
- **Server nạp sẵn:** hai tên được truyền, `Claude_Browser` và `visualize`, là công cụ đã nạp sẵn, không nằm trong danh sách hoãn.
- **Chờ đăng nhập:** 14 tên ở `--needs-sign-in` là các server phiên báo chờ đăng nhập.

Hai câu được gửi cho chủ repo đúng như lệnh in. Lời đáp «frontend-design, review» được chuyển nguyên văn cho tác tử, và tác
tử ghi hai dòng vào `design/decisions.yaml` của bản sao:

- `plug-screen-build`, nguồn `plug:frontend-design`, ghi chú «answered by Phan Le Manh on 2026-11-25»;
- `plug-design-review`, nguồn `plug:review`, ghi chú «confirmed by Phan Le Manh on 2026-11-25».

Tác tử lấy tên ấy từ tác giả commit của bản sao.

**Nửa đầu của dòng «xong khi» được cho thấy:**

- chủ repo chọn phích cho các ổ trong một lượt, với hai câu, dưới trần bốn câu;
- hai câu cùng hiện trên một bảng và được đáp bằng một lời.

`new` còn hỏi những câu khác: mức accessibility, nguyên tắc, hướng thiết kế, màu, chữ, màu xám, màu trạng thái, thanh bên,
biểu đồ, giấy phép font và câu duyệt cuối. Dòng «xong khi» chỉ nói về câu chọn phích.

### Hướng thiết kế tác tử dựng, và điều nó đề xuất một mình

- **Đã quyết:**
  - màu chính `oklch(0.46 0.15 262)`, chế độ tối dời sang `oklch(0.604 0.15 262)`;
  - thang chữ modular tỉ lệ quãng ba thứ;
  - góc vừa (12px);
  - Geist cho chữ thường và tiêu đề;
  - xám thuần;
  - màu báo lỗi của sàn;
  - thanh bên theo màu chính;
  - biểu đồ của sàn.
- **Đề xuất, chưa xác nhận.** Đây là những chỗ nhánh dẫn dắt quyết một mình và bày ra:
  - ba nguyên tắc `dense-and-scannable`, `context-stays-in-view`, `clear-hierarchy`. Câu niêm phong 16 bảo «giữ những cái bạn
    đề xuất»;
  - cách mở bản ghi `beside`.

  Cả bốn còn trên bảng quyết định, cùng câu loại sản phẩm (`product-type`).

- **Ghi chú cỡ chữ.** Bản xem trước ghi «text-xs is 11px», dưới cỡ nhỏ nhất 12px của sàn.
  - **Cổng không giữ điều này**, và đó là chủ ý: `apply.mjs` coi một bậc modular dưới 12px là một ghi chú, không từ chối, vì không
    chuẩn nào đặt cỡ chữ tối thiểu.
  - Badge, nút cỡ `xs` và nhãn nhóm của select trong `src/components/ui/` dùng `text-xs`, nên vẽ ở 11px.
  - Dòng giới hạn mới: `modular-step-below-the-floor-noted-only`.

### Cổng đỏ sau bước dựng

Lần dựng đầu để cổng đỏ (`make design-assembly`, thoát 2). `ledger-shapes`, cổng chọn trước của mục 11.5, nêu
`src/components/held-label.tsx` (`HeldLabel`) và `src/components/record-panel.tsx` (`WithRecord`). Cả hai là linh kiện
do chính bước dựng của `new` đặt, không có dòng sổ nhập kho.

- Kit khởi đầu của plugin (`references/starter.json`) liệt kê cả hai.
- `find` đọc chúng là đồ của repo («source: own»).
- Tác tử báo «no starter-kit entry». Điều ấy sai.

Bảng quyết định có bảy câu:

1. `product-type`
2. `principle-dense-and-scannable`
3. `principle-context-stays-in-view`
4. `principle-clear-hierarchy`
5. `record-panel` (`beside`)
6. `intake-held-label`
7. `intake-record-panel`

Câu 1 đến 5 không giữ cổng. Chúng được để chờ, không đáp, và vẫn chờ khi lượt kết thúc.

Câu 6 và 7 đi tới chủ repo cùng phát hiện. Chủ repo đáp «Đi tiếp, sửa riêng» cho câu «Đi tiếp lượt này và sửa lỗi bằng PR
riêng, hay dừng để sửa trước rồi chạy lại?». Cách đã chọn được nói với chủ repo là:

- «Anh đáp hai câu cho bản sao bỏ đi này, cổng xanh, hai nhánh dựng màn chạy tiếp. Lỗi được sửa bằng một PR riêng, chạy
  song song»;
- kèm «Hai dòng sổ: ghi hai linh kiện là đồ tự làm, sai nguồn gốc, nhưng chỉ trong bản sao bỏ đi».

Lời dán cho tác tử là «Câu 6 và 7: giữ cả hai. Câu 1 đến 5: để chờ.». Đó là lời của phiên điều phối, mang lựa chọn của chủ
repo.

Tác tử ghi hai dòng vào `design/intake.yaml`, nguồn `by-hand`, với mô tả «starter kit không có mục nào cho nó».

- **Sự thật:** hai linh kiện đến từ kit khởi đầu. Chỉ bản sao bỏ đi mang hai dòng sai nguồn gốc này.
- **Cổng xanh chỉ sau hai câu ấy.** Plugin đáng lẽ không phải hỏi chúng.
- **Bản sửa:** PR #139, quyết định 0110, plugin 0.59.0. Bước dựng ghi dòng sổ của mỗi món nó đặt.

### Tác tử làm thêm ngoài phần `new` sinh ra

Bài kiểm trình duyệt mà `new` cài bắt ba lỗi thật ở màn mẫu. Tác tử ghi chúng vào `design/escapes.md` trước khi sửa:

- nút Xoá của hàng đầu ra ngoài khung ở 320px;
- hộp thoại hỏi xoá vẫn mở sau khi xác nhận;
- tiêu điểm mất khi xoá.

Đây là điều dòng giới hạn `starter-screen-fails-installed-checks` đã nói.

Repo chưa có toast. Vì vậy tác tử báo lỗi xoá bằng một `Alert` trên màn và không tự cài gói.

### Trạng thái cuối

Audit báo:

- 32 trên 40 quyết định lõi có câu trả lời: 24 giữ bằng phép kiểm đã thấy đỏ, 5 nêu tên phép kiểm, 3 chỉ ghi lại;
- tầng audit và nền móng đạt;
- bảng màu theo vai đủ: 33 trên 33 giá trị có lời chủ repo và dòng sổ.

`make check` xanh khi phiên chạy thử chạy lại: 47 bài đơn vị, 32 bài trình duyệt, 38 quyết định giữ bằng 74 phép kiểm.

Tác tử hỏi có gộp mọi thay đổi thành một commit không. Đó không phải câu của `new`, nên tác tử không nhận lời đáp. Phiên
chạy thử commit trạng thái ấy trong bản sao: `a5384d6`, 89 tệp.

## Hai nhánh dựng màn

- **Chuẩn bị, như lượt 17.** Mỗi nhánh có bản sao riêng:
  - `git archive` của `a5384d6`, `git init` riêng, một commit;
  - `node_modules` chép riêng (không liên kết), để một lần cài gói không đụng bản checkout chính.
- **Đã bỏ khỏi bản sao:**
  - `wiki/specs/` (đề bài 0001 của repo);
  - `wiki/decisions/` (0001 và 0002 của repo);
  - ba dòng của `wiki/index.md` và một dòng của `wiki/log.md` trỏ tới chúng.

  Mục này không có `plugins/`, `docs/plan/` hay `docs/trials/` để bỏ. Phần kế hoạch của `AGENTS.md` cũng không có.
  `docs/START-HERE.md` được giữ; nó vẫn trỏ tới hai trang đã bỏ.

- **Hai bản sao giống hệt nhau.** Cùng cây `9a019a0`; nhánh A ở commit `d060cde`, nhánh B ở `1270791`. `make check` xanh ở cả
  hai trước khi bắt đầu. Tệp cổng sinh ra (`coverage/`, `dist/`) được dời ra ngoài.
- **Đề.** [`briefs/screen.md`](briefs/screen.md) nguyên văn, rồi lời thêm của lần 12 đến 14 (đường dẫn, hai lối chạy `brief` và
  `decide`).
  - **Nhánh A** thêm đoạn của lượt 17, nói chủ repo đã chọn skill `frontend-design:frontend-design` để dựng màn. Đó là skill
    chính thức, bản 1.1.1, sha1 `0104e025`; skill cá nhân cùng tên không được dùng.
  - **Nhánh B** không có đoạn ấy. Nó dựng qua phích của plugin: `.claude/rules/design-assembly.md` và phiếu `brief`.

  Nhánh A được bảo bằng lời vì dòng giới hạn `screen-build-plug-reached-only-when-told` còn mở.

- **`notify.ts`, theo cách (a) phiên điều phối chọn.**
  - Commit `e56e77c` không có `src/lib/notify.ts`: tệp ấy vào kho ở `54cbd97`, và `package.json` của `e56e77c` không có
    `sonner`.
  - Đề màn vẫn giữ nguyên văn, không nhánh nào được thêm chữ hay mô-đun.
  - Điều này cắt chuỗi so sánh với lần 12 đến 14 và lần 17 ở điểm này.
- **Chạy lần lượt, không song song.** Bài kiểm trình duyệt của repo chiếm cổng 4173 và không dùng lại máy chủ có sẵn.

### Số đo

| Đo gì                                       | Nhánh A, được bảo dùng skill                      | Nhánh B, phích của plugin                                  |
| ------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| Gọi skill `frontend-design:frontend-design` | có, lần gọi 4                                     | không                                                      |
| Cổng, phiên chạy thử chạy lại               | xanh: 71 bài đơn vị, 80 bài trình duyệt           | xanh: 72 bài đơn vị, 80 bài trình duyệt                    |
| Lần `make check` đầy đủ đỏ trước khi xanh   | 0, cộng 3 vòng ở bước con                         | 1 (`column-align`, `column-width`), cộng 4 vòng ở bước con |
| Số lần dừng hỏi người                       | 0                                                 | 0                                                          |
| Chỗ tác tử khai là tự quyết                 | 30                                                | 31                                                         |
| **Chỗ phải đoán, sau khi kiểm**             | **14**                                            | **14**                                                     |
| … vào hàng chờ / tự quyết lặng lẽ           | 10 / 4                                            | 11 / 3                                                     |
| Câu tác tử xếp vào `design/waiting/`        | 12: 5 bằng `brief --queue`, 7 bằng `decide --ask` | 17: 5 bằng `brief --queue`, 12 bằng `decide --ask`         |
| Lời đáp ghi thay chủ repo                   | 0                                                 | 0                                                          |
| Giá trị thiết kế ngoài sổ (màu, font, bóng) | 0                                                 | 0                                                          |
| Tệp không được đụng                         | không đổi                                         | không đổi                                                  |
| Gói mới, lần gọi mạng                       | 0, 0                                              | 0, 0                                                       |
| Commit của bài làm, trong bản sao           | `446fdd4`                                         | `6556759` (nhánh `feat/archive-screen` tác tử tự mở)       |

**Không ghi thay chủ repo.** Không tệp nào trong `design/waiting/` có lời đáp, trừ hai câu nhập kho của nhánh dẫn dắt.
`design/decisions.yaml` không đổi ở cả hai nhánh. Mỗi nhánh viết một trang quyết định trong wiki của bản sao, trạng thái «đề
xuất, chờ chủ repo». Cả hai thêm thực thể `Item` vào `ontology/` và nói thay đổi ấy cần người soát, như `AGENTS.md` bảo.

**Giá trị ngoài sổ: 0.** Dòng thêm trong `src/` và `tests/` không có:

- mã màu, `font-family`, bóng, chuyển động;
- giá trị viết trong ngoặc vuông, URL.

Chuỗi lớp mới chỉ dùng thang của sàn. Nhánh B nới `main` từ `max-w-5xl` lên `max-w-6xl`; đó là một chỗ đoán (dòng 15 dưới
đây), không phải giá trị ngoài sổ.

**Tệp không được đụng không đổi** ở cả hai nhánh:

- `src/components/ui/`, `tools/`, `mk/`, `Makefile`, `.claude/`, `tests/e2e/`;
- `design/behaviors.md` và các sổ của hướng thiết kế;
- `package.json`, `src/index.css`.

Nhánh B đổi `design/columns.json` qua `make design-columns`, như trang luật bảo.

**Mạng.** Không lần gọi nào cài gói hay gọi ra ngoài.

- Nhánh A chụp màn bằng một máy chủ xem trước tại `127.0.0.1:4199`.
- Nhánh B mở `localhost:5199` trong trình duyệt của ứng dụng.
- `sonner` có trong `node_modules` (chép từ bản checkout chính) nhưng không nằm trong `package.json`. Không nhánh nào dùng hay
  khai nó.

### Chỗ phải đoán

Luật đếm của [`README.md`](README.md), cùng độ chặt với lần 14 và 17.

- Loại chỗ nào hai lần ấy giữ thì giữ; loại nào bỏ thì bỏ.
- Chỗ có câu hỏi trên hàng chờ vẫn là chỗ phải đoán, tính «vào hàng chờ».
- Bảng chỉ đếm chỗ tác tử khai.

Số trong ngoặc là số thứ tự trong bản báo cáo của tác tử.

| #   | Chỗ                                  | Nhánh A                      | Nhánh B                       | Căn cứ, theo lần 17                                                   |
| --- | ------------------------------------ | ---------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| 1   | Tên trong mã của khái niệm           | hàng chờ (1; gộp 4, 5)       | hàng chờ (1; gộp 3, 5)        | dòng 1; vai `member`, mức lộ cho tác tử và mô hình `Item` gộp vào đây |
| 2   | Chữ người đọc                        | hàng chờ (2; gộp 7, 23)      | hàng chờ (16, 30, 31; gộp 18) | dòng 3; trạng thái trống không liên kết gộp vào đây như dòng 11       |
| 3   | Hình dạng trong mô hình dữ liệu      | hàng chờ (3, câu chung ô 10) | hàng chờ (2)                  | dòng 2                                                                |
| 4   | Tên đọc của mỗi nút sau «⋯»          | không khai                   | hàng chờ (16)                 | dòng 4                                                                |
| 5   | Màn chính giữ «Xoá»                  | hàng chờ (6)                 | không khai                    | lần 17 bỏ vì trang kiểu màn nói; repo này không có trang kiểu màn     |
| 6   | Mục đưa lại về đâu                   | hàng chờ (10)                | hàng chờ (19)                 | dòng 7                                                                |
| 7   | Dữ liệu mẫu đã lưu trữ               | lặng lẽ (22)                 | hàng chờ (20)                 | dòng 8                                                                |
| 8   | Kiểu của màn mới                     | hàng chờ (27)                | hàng chờ (8)                  | dòng 9                                                                |
| 9   | Dáng của nút tên mục                 | hàng chờ (18)                | lặng lẽ (21)                  | dòng 10                                                               |
| 10  | Bỏ trạng thái `saving` của màn chính | hàng chờ (20)                | hàng chờ (17)                 | dòng 12                                                               |
| 11  | Khung ứng dụng và điều hướng         | hàng chờ (11)                | hàng chờ (9)                  | dòng 13; repo chưa có khung                                           |
| 12  | Dáng của khung                       | lặng lẽ (12)                 | không khai riêng              | không trang nào nói                                                   |
| 13  | Hoàn tác cả lúc lưu trữ              | lặng lẽ (9)                  | hàng chờ (12, trong câu 11)   | đề chỉ đòi hoàn tác lúc đưa lại                                       |
| 14  | Nội dung khung chi tiết              | lặng lẽ (17)                 | lặng lẽ (22)                  | không trang nào nói                                                   |
| 15  | Bề rộng trang                        | không khai                   | lặng lẽ (28)                  | không trang nào nói                                                   |
| 16  | Báo kết quả khi không có `notify.ts` | hàng chờ (8; gộp 19)         | hàng chờ (10; gộp 11, 24)     | do cách (a); cách hoàn tác hiện ra gộp vào đây                        |

**Đã bỏ:**

- **Định danh, đường dẫn, tên kịch bản, tên trạng thái:** A 14, 21; B 7, 23, 26, 27.
- **Chữ lúc chờ, chữ và nút «Thử lại» khi hoàn tác lỗi:** A 24, 25; B 25. Theo mẫu của `labels.ts` và trang hành vi.
- **Tách phần dùng chung, dùng `useList`:** A 13, 15; B 15. Tác tử B vẫn hỏi chỗ đặt bảng.
- **Màn chính cũng mở chi tiết:** A 16; B 14. Đề đòi hai danh sách cùng hành vi; tác tử B vẫn hỏi.
- **`formatDay` cho ngày dạng chữ ISO:** A 26; B 4. `format.ts` là chỗ của mọi cách viết ngày.
- **Nội dung dòng sổ màn, `entry: null`, hoàn tác không nằm trong `actions`:** A 29; B 6, 13.
- **Kiểu cột:** A 28 (không khai); B 29 (theo kiểu dữ liệu).
- **Thay đổi lúc «Thêm mục» hiện đang tải:** A 30. Đó là một hệ quả, không phải một lựa chọn.

**Con số lung lay tới đâu:**

- **Chặt hơn** (gộp dòng 13 vào dòng 16, bỏ dòng 12): A 12, B 13.
- **Lỏng hơn** (tính những chỗ tác tử hỏi dù đề hay trang có nói: B 14, B 15, B 18, A 16; và dáng khung của B, có trong lời
  khuyến nghị của câu khung): A 15, B 18.
- **Bỏ chỗ do thiếu `notify.ts`** (dòng 16): A 13, B 13.
- Đọc cách nào thì nhánh A cũng không cao hơn nhánh B.

**Không so được với lần 12 đến 14 và 17**, vì repo khác. Repo này không có khung ứng dụng, trang kiểu màn hay `notify.ts`.
Bốn dòng 5, 11, 12, 16 sinh ra từ đó.

### Skill và repo chỉ hai hướng

Nhánh A kể: skill đòi bảng màu riêng, kiểu chữ riêng và một điểm nhấn táo bạo, còn repo đã định sẵn token, Geist, hướng
`workbench`, linh kiện, và cấm màu thô hay sửa dáng linh kiện. Nó theo repo. Từ skill, nó giữ lối chụp màn rồi tự soát. Lối
ấy bắt lỗi chữ nằm dưới nút ở 320px.

Nhánh B gặp cùng lỗi 320px bằng cách xem màn trong trình duyệt của ứng dụng, không qua skill. Lượt này không cho thấy skill
thêm được gì mà cổng phải chặn, hay bớt được chỗ đoán nào.

**Phích chủ repo chọn có được dùng không.** Ở nhánh B, chỉ `design/decisions.yaml` nêu `plug:frontend-design`. Trang luật,
phiếu `brief` và mọi trang khác của repo đều không nêu. Tác tử B không gọi skill ấy lần nào.

Như vậy dòng `screen-build-plug-reached-only-when-told` vẫn đúng: một repo đã chọn phích ngoài ở ổ dựng màn vẫn dựng bằng phích
của plugin khi không ai bảo bằng lời. Không lệnh nào thấy điều ấy.

### Điều hai tác tử báo, và kiểm thấy gì

| Điều tác tử báo                                                                                                                                                    | Kiểm thấy                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `notify.ts` đề bảo dùng không có (cả hai)                                                                                                                          | Đúng: do `e56e77c`, theo cách (a)                                                                                     |
| `docs/START-HERE.md` trỏ tới hai trang không có (cả hai)                                                                                                           | Đúng: do cách dựng bản sao                                                                                            |
| Linh kiện `new` đặt nêu những phần của `design/behaviors.md` mà trang ấy không có, cùng `design/parts.json` và trang kiểu dưới `design/patterns` không có (cả hai) | Đúng. Linh kiện là của plugin bản mới; `design/behaviors.md` là trang của sàn ở `e56e77c`. Dòng giới hạn mới bên dưới |
| Loại mã sinh ra bảo viết hàm ở `src/actions/`, không có (cả hai)                                                                                                   | Đúng; mẫu của repo dựng, không phải của plugin                                                                        |
| Cột «Tổng», kiểu `number`, vẫn canh trái; không gì đọc `design/columns.json` để canh (B)                                                                           | Đúng; nằm trong `no-formatting-per-column-type`                                                                       |
| Chữ tên mục lệch khỏi tiêu đề cột vì đệm của nút (cả hai)                                                                                                          | Đúng; không phép kiểm nào bắt                                                                                         |
| Nút «Hoàn tác» đè chữ ở 320px; ghi vào `escapes.md` trước khi sửa (cả hai)                                                                                         | Đúng: cùng một lỗi, A thấy qua ảnh tự chụp, B qua trình duyệt                                                         |
| `ui.md` nói kiểm ở 1440 và 390px, bài kiểm dùng 320 và 1440 (A)                                                                                                    | Đúng; trong `floor-prose-contradicts-rules`                                                                           |

## Dòng giới hạn

- **Mới, mở:**
  - `modular-step-below-the-floor-noted-only`, ở ngăn giữ;
  - `laid-parts-cite-pages-the-floor-lacks`, ở ngăn sửa.
- **Còn mở, thêm bằng chứng của lượt này:**
  - `screen-build-plug-reached-only-when-told`: nhánh B không gọi skill chủ repo chọn;
  - `plugs-session-listed-by-the-skill`: skill được truyền đủ, 10 server hoãn thì không.
- **Lỗi cổng đỏ sau bước dựng:** dòng của nó thuộc PR #139 (`starter-pieces-laid-with-no-intake-row`), không thuộc thay đổi
  này.

## Chi phí

Đếm như bản ghi lượt đã dừng, bằng [`count-tokens.mjs`](count-tokens.mjs): cỡ ngữ cảnh của lần gọi mô hình cuối, cộng chữ
mô hình viết ra ở mọi lần gọi. Trong ngoặc là cách lượt 17 viết: ngữ cảnh cuối cộng chữ của riêng lần gọi cuối, bằng số bộ
đếm của phiên báo.

| Ai                     | Token                      | Lần gọi công cụ | Thời gian                                                  |
| ---------------------- | -------------------------- | --------------- | ---------------------------------------------------------- |
| Tác tử dẫn dắt         | 329 914 (273 664)          | 64              | 02:16:53–03:43:52, trong đó chừng 18 phút làm, còn lại chờ |
| Tác tử nhánh A         | 352 480 (281 441)          | 67              | 18 phút 19 giây; 03:47:39–04:05:58                         |
| Tác tử nhánh B         | 346 028 (283 953)          | 66              | 15 phút 32 giây; 04:06:20–04:21:52                         |
| Phiên chạy thử         | 276 681 (67 742 + 208 939) | 96              | 02:15:52–04:32:05, gồm hơn một giờ chờ lời chủ repo        |
| **Cả lượt chạy lại**   | **1 305 103**              |                 |                                                            |
| Lượt đã dừng, bên cạnh | 284 299                    |                 |                                                            |

Lượt chạy lại ở dưới trần 1,8 triệu token. So với ước tính 1,4 triệu của cả việc, nó thấp hơn chừng 95 nghìn. Phần commit và mở PR sau 04:32:05 không tính.

**Đếm lại.** Ba bản ghi của tác tử nằm trong `trial-19/evidence/`, `trial-19/arm-a/evidence/` và `trial-19/arm-b/evidence/` của
thư mục nháp của phiên chạy thử. Bản chép bản ghi của phiên ở `trial-19/evidence/trial-session-transcript.jsonl`.

- **Ba tác tử:** `node docs/trials/count-tokens.mjs --transcript <tệp>`, lấy `total` và `tool_calls`.
- **Phiên chạy thử:** bị nén ngữ cảnh một lần trong lúc chờ lời chủ repo. Vì vậy đếm hai đoạn rồi cộng `share`:
  - `--from 2026-11-25T02:15:52.159Z --to 2026-11-25T03:25:49Z`: 67 742;
  - `--from 2026-11-25T03:25:49Z --to 2026-11-25T04:32:06Z`: 208 939.

## Giới hạn

- **Một lượt mỗi nhánh.** Hai lượt cùng điều kiện đã lệch nhau tới 3 chỗ ở lần 13 và 14. Chênh lệch 0 giữa A và B nằm trong
  khoảng ấy.
- **Nhánh A tới phích chủ repo chọn vì được bảo bằng lời.** Nửa sau của dòng «xong khi» được cho thấy trên một màn dựng qua
  phích ngoài, nhưng chưa phải qua lối plugin tự dẫn tới.
- **Ổ soát thiết kế** được ghi (`plug:review`, phích của plugin), không chạy trong lượt này.
- **Cổng xanh của repo mới cần hai câu nhập kho** mà plugin đáng lẽ không phải hỏi. Bản sửa ở PR #139. Bản sao bỏ đi giữ
  hai dòng sổ ghi sai nguồn gốc.
- **Thiếu `notify.ts`** làm sinh một chỗ đoán ở cả hai nhánh, và cắt chuỗi so sánh với các lần trước.
- **Đếm là phán đoán** của phiên chạy thử, phiên biết luật đọc và số của lần 17.
- **Phiên của tác tử mang luật chung của máy này** về chất lượng giao diện web, đẩy cùng chiều với skill.
- Bản sao, bản ghi đầy đủ của ba tác tử, diff và ảnh được giữ nguyên chỗ, trong thư mục nháp của phiên chạy thử
  (`trial-19/`).
