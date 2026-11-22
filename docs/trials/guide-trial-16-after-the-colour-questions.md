# Chạy thử lần 16: vai dẫn dắt chạy lại, sau khi cuộc dẫn dắt hỏi mọi câu màu

Một lượt, ngày 2026-11-22, cho mục 9.3: tiêu chí 12 của đề bài
[`0012`](../../wiki/specs/0012-foundations-wide-enough.md), sau các sửa của quyết định
[0084](../../wiki/decisions/0084-the-guide-asks-every-colour-question-and-one-command-prints-what-holds-each-value.md).

Sau [lượt 15](guide-trial-15-foundations-wide-enough.md), chủ repo được hỏi: «Sửa cuộc dẫn dắt để nó hỏi câu thanh bên,
biểu đồ và giấy phép, rồi chạy thêm một lượt?». Chủ repo đáp «Sửa rồi chạy lại». Sau đó chủ repo được hỏi có dựng luôn
lệnh in từng giá trị cạnh dòng sổ và lệnh kiểm không, kèm ước tính 650 đến 800 nghìn token và 80 đến 100 phút cho cả sửa
và chạy. Chủ repo đáp «Dựng luôn (Khuyến nghị)». Lượt này là lượt chạy lại ấy, một lượt vai dẫn dắt trên đề chuẩn.

**Kết luận ngắn:**

- Cổng xanh, độ phủ 32 trên 40 câu lõi. Tác tử hỏi người 8 lần. Lần này nó hỏi câu thanh bên, câu biểu đồ và câu giấy
  phép trước bước duyệt cuối.
- `status --roles` của bản sao in `whole: 33 of 33 values have the owner's word and a row of the ledger with its check`,
  không dòng `not whole:` nào.
- **Dòng «done when» của giai đoạn 9 được chứng** bằng lệnh `node <plugin>/scripts/status.mjs --target <repo> --roles`.
- Sau khi kiểm còn **8 chỗ phải đoán**, so với 10 ở lượt 15: 1 vào hàng chờ, 3 được hỏi người, 4 tự quyết lặng lẽ. Độ
  nổi, chuyển động và mật độ vẫn không có chỗ nào.

## Bản sao và điều tác tử được đưa

- **Bản sao:** dựng đúng như lượt 15: clone ở `e56e77c`, một commit, không remote, `node_modules` nối bằng liên kết.
  `make check` xanh trước khi bắt đầu (25 bài đơn vị, 16 bài trình duyệt).
- **Plugin:** 0.33.0, lấy bằng `git archive` ở `ae3153e`, commit sửa trên nhánh của PR này. Plugin lấy từ nhánh, không
  từ `main` như lượt 15, vì `main` chưa có các sửa. Dấu băm của cây plugin trùng trước và sau lượt chạy.
- **Đề và lời thêm:** đề chuẩn nguyên văn, cùng bốn câu lời thêm như lượt 15, chỉ đổi `trial-15` thành `trial-16`.
- **Tác tử:** một tác tử con mới, kiểu `general-purpose`. Bản ghi của nó cho thấy cả 96 lượt trả lời đều của
  `claude-opus-5-5`. Nó không biết gì về lượt 15.
- **Trang skill mới:** không có chữ «trial» và không kể lượt nào. Đường `new` vẫn chỉ in mã của dòng giới hạn, không in
  lời ghi.

**Câu niêm phong:**

- Câu 16 (nguyên tắc) và câu 17 (hướng thiết kế), ghi sau lượt 15, nay là câu niêm phong.
- Một câu mới, `18-giay-phep-font.md`: «Dùng theo giấy phép SIL Open Font License 1.1, như gói của font ghi.» Đây là lời
  chủ repo đã đáp cho kho này ngày 2026-11-22, khi giữ khuyến nghị cho câu giấy phép của font Geist. Câu được commit
  (`85f6c7b`, 08:47) trước khi tác tử khởi động (08:48).
- Không câu nào phải đáp ngoài các tệp đã niêm phong.

## Lượt chạy

Bắt đầu lúc 08:48, xong lúc 09:01, qua 43 lần gọi công cụ và chín lượt trả lời.

| #   | Tác tử hỏi                                                                                                     | Đáp bằng           |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | Mức accessibility                                                                                              | câu 02             |
| 2   | Chọn 3 tới 5 trong 8 nguyên tắc                                                                                | câu 16             |
| 3   | Hướng A, B hay C                                                                                               | câu 17             |
| 4   | Màu G, B, E hay A sau hai vòng `--around`; cùng lượt, nêu cách nó đọc thang chữ và bo góc để người cãi nếu sai | câu 07             |
| 5   | Kiểu chữ của văn bản và của tiêu đề                                                                            | câu 11             |
| 6   | Họ trung tính, rồi tông trạng thái, trong một lượt                                                             | câu 12, rồi câu 13 |
| 7   | Câu thanh bên, câu biểu đồ, câu giấy phép font (kèm điều lockfile ghi: `OFL-1.1`), trong một lượt, bằng lời    | câu 14, 15, 18     |
| 8   | Duyệt cuối                                                                                                     | câu 08             |

Lời đáp của lượt 6 và 7 là các câu niêm phong dán nối nhau, mỗi câu một đoạn, không thêm chữ nào.

Sau câu 8, `make check` đầu tiên đỏ ở 5 bài trình duyệt, như lượt 15 (`starter-screen-fails-installed-checks`). Tác tử
ghi hai dòng sổ lỗi lọt của bản sao, sửa màn mẫu, và lần sau xanh. Nó điền giấy phép vào
`design/sources/geist-variable.json` sau khi `adopt` viết dòng ấy. Nó không commit; phiên điều phối giữ bài làm ở commit
`de3215a` của bản sao.

## Số đo, đặt cạnh lượt 15

| Đo gì                              | Lượt 15                                 | Lượt 16                                         |
| ---------------------------------- | --------------------------------------- | ----------------------------------------------- |
| Plugin                             | 0.32.0 (`main`)                         | 0.33.0 (nhánh, `ae3153e`)                       |
| Độ phủ                             | 32/40 (22, 7, 3)                        | 32/40 (22, 7, 3)                                |
| Cổng, phiên điều phối chạy lại     | xanh: 45 bài đơn vị, 32 bài trình duyệt | xanh: 44 bài đơn vị, 32 bài trình duyệt         |
| Hỏi người                          | 8                                       | 8                                               |
| Câu thanh bên, biểu đồ, giấy phép  | không hỏi, để chờ                       | hỏi trước bước duyệt cuối                       |
| Vai màu có giá trị có lời chủ repo | 23 trên 31 (3 không tên và ngày)        | 31 trên 31, mỗi vai có tên và ngày              |
| Câu chờ chủ repo lúc xong          | 8                                       | 5 (loại sản phẩm, ba nguyên tắc, cách mở hồ sơ) |
| Dòng sổ lỗi lọt tác tử thêm        | 2                                       | 2                                               |
| Chỗ tác tử khai                    | 20                                      | 21                                              |
| **Chỗ phải đoán, sau khi kiểm**    | **10** (3 hàng chờ, 1 hỏi, 6 lặng lẽ)   | **8** (1 hàng chờ, 3 hỏi, 4 lặng lẽ)            |

Hai lượt cùng bản sao, cùng đề, cùng mô hình, cùng người đếm. Chỉ plugin khác: các sửa của quyết định 0084. Nhưng mỗi
bên chỉ một lượt, và hai lượt dựng màn cùng điều kiện từng lệch nhau hai chỗ (lần 7 đến 10). Hai chỗ chênh nằm trong độ
lệch ấy.

## Điều tác tử báo, và kiểm thấy gì

| Tác tử báo                                                                                                                    | Kiểm trên bản sao                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Độ phủ 32/40; `make check` xanh; `make design-rate` 46/52                                                                     | Đúng: chạy lại `audit` và `make check`, thoát 0                                                                                                                                                     |
| `status --roles`: «whole: 33 of 33 values»                                                                                    | Đúng: không dòng `not whole:` nào; 3 tông không chọn không vào số đếm                                                                                                                               |
| 5 câu chờ: loại sản phẩm, ba nguyên tắc, cách mở hồ sơ                                                                        | Đúng: `status` nêu đúng năm câu ấy, không câu màu hay giấy phép nào                                                                                                                                 |
| Màu gốc ghi Manh Phan, 2026-11-22                                                                                             | Đúng: `answered.source_color` có trong bản thiết kế; dòng `source-color` có ghi chú «answered by Manh Phan on 2026-11-22»                                                                           |
| Giấy phép rút gọn thành «SIL Open Font License 1.1», giữ khối `proposed` của dòng                                             | Đúng                                                                                                                                                                                                |
| «Đang xoá» hiện ngay, không đợi một giây                                                                                      | Đúng, cùng lỗi lọt đã ghi ở lượt 15 (`held-label-says-working-at-once`). Tác tử nói thêm: bài kiểm đơn vị của repo chỉ chờ 200 ms                                                                   |
| Xoá dòng cuối thì tiêu điểm về tiêu đề, không về nút của trạng thái trống                                                     | Đúng: `tabIndex={-1}` trên tiêu đề. Trang luật dòng 97 nói ngược thứ tự ấy; cổng xanh. Lỗi lọt mới (mục «Sau khi chạy»)                                                                             |
| Sai ở trang skill: bản xem trước thoát 2 khi các tầng còn `pending`, nên không có khuyến nghị ở điểm dừng nguyên tắc và hướng | Đúng: trên một bản sao thứ hai, bản thiết kế mọi tầng `pending` cho thoát 2 («context: must be decided», «foundations: must be decided»); chỉ còn tầng nền `pending` vẫn thoát 2. Dòng giới hạn mới |
| Sai: loại sản phẩm đọc từ repo vẫn bị gọi là chưa xác nhận                                                                    | Không phải lời sai: bước 0 của trang skill nói đúng như vậy                                                                                                                                         |
| Sai: dòng `direction workbench` vẫn nói «small corners» sau khi bo góc đổi                                                    | Đúng chữ, nhưng dòng ấy tả hướng trong danh mục, không tả giá trị đang chọn. Không tính                                                                                                             |
| Tệp không được đụng                                                                                                           | Không đổi: `Makefile`, `.github/`, `eslint.config.js`, `tools/design_guards.mjs`, `tests/e2e/floor.spec.ts`, `design/behaviors.md`, `package.json`                                                  |

## Tiêu chí 12: dòng «done when»

| Đòi gì                                                                   | Lượt 16                                                                                                                                                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kiểu chữ có nguồn là lời chủ repo                                        | Đạt: câu 11, Manh Phan, 2026-11-22; dòng `typeface` và `font-loaded`; giấy phép của dòng sổ nguồn là câu 18                                                                      |
| Mọi vai màu có nguồn là lời chủ repo                                     | Đạt: 31 vai có giá trị. Trung tính câu 12, `--destructive` câu 13, màu chính và vòng tiêu điểm câu 03 và 07 qua câu 17, thanh bên câu 14, biểu đồ câu 15; mỗi vai có tên và ngày |
| Cổng xanh                                                                | Đạt: `make check` của bản sao thoát 0 khi phiên điều phối chạy lại                                                                                                               |
| Một lệnh in từng giá trị cạnh dòng sổ và lệnh kiểm, không dòng nào trống | Đạt: `status.mjs --target <repo> --roles`, 33 dòng giá trị, dòng `whole: 33 of 33`, không dòng `not whole:`                                                                      |

**Kết luận: dòng «done when» được chứng.** Có ba điều nên nói kèm:

- **Năm vai biểu đồ và ba vai viền** chỉ được giữ bằng `design-tokens`: tệp token phải nói đúng điều stylesheet nói. Lệnh
  kiểm ấy bắt một giá trị đổi trong stylesheet mà tệp token không đổi theo. Nó không bắt một giá trị lệch khỏi giá trị
  của sàn.
- **Plugin của lượt này nằm trên nhánh của PR,** chưa ở `main`. Gộp PR thì `main` có đúng bản đã chạy (0.33.0).
- **Đóng giai đoạn 9 là lời chủ repo.** Mục 9.3 nay `done`; giai đoạn chưa đóng.

## Tiêu chí 13: đếm từng chỗ

Cùng luật và cùng độ chặt như lượt 15.

| #   | Tác tử khai                                                             | Kiểm thấy                                                                                    | Đếm                | Mảng                   | Lượt 15 |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------ | ---------------------- | ------- |
| 1   | Nói tiếng Việt                                                          | `AGENTS.md` nói                                                                              | bỏ                 | khác                   | 1       |
| 2   | Tên: «Manh Phan» (tác giả commit) hay «phanlemanh» (`.repo-setup.json`) | Hai tên trong repo, trang skill chỉ nói «the name the person goes by»                        | giữ, lặng lẽ       | khác: ghi bản thiết kế | 13      |
| 3   | Gộp vài mục vào một lượt hỏi                                            | Trang skill: «ask one section at a time». Trang có nói; tác tử làm khác                      | bỏ                 | khác                   | mới     |
| 4   | Ba nguyên tắc nào, khi người bảo giữ cái bạn đề xuất                    | Không trang nào nói chọn ba cái nào                                                          | giữ, hàng chờ      | khác: nguyên tắc       | 3       |
| 5   | Lấy hướng A làm gốc cho lời của người                                   | Gộp vào 6: cùng việc đổi lời thành màu                                                       | gộp vào 6          | vai màu                | —       |
| 6   | Hai vòng `--around`                                                     | Như lượt 15; người xác nhận G                                                                | giữ, hỏi người     | vai màu                | 6       |
| 7   | «Rõ hơn một chút» thành `minor-third`                                   | Không trang nào nối lời với tỉ lệ. Lần này tác tử nêu cách đọc cho người cãi                 | giữ, hỏi người     | thang chữ, bo góc      | 7       |
| 8   | «Một nấc» thành `medium`                                                | Một đáp án                                                                                   | bỏ                 | thang chữ, bo góc      | 8       |
| 9   | Ghi thang chữ và bo góc mà không hỏi chữ cái                            | Hai cách đọc; lần này cách đọc được bày cho người                                            | giữ, hỏi người     | thang chữ, bo góc      | 9       |
| 10  | Tầng nền `proposed` với `confirmed`, vì khoảng cách chỉ một phương án   | Hai cách đọc như lượt 15; lượt 15 chọn cách kia (`user`)                                     | giữ, lặng lẽ       | khác: ghi bản thiết kế | 11      |
| 11  | Những gì vào `rejected`                                                 | Trang skill nói                                                                              | bỏ                 | khác                   | 12      |
| 12  | «Giữ màu lỗi của sàn» thành `floor`                                     | Trang skill nói                                                                              | bỏ                 | vai màu                | 15      |
| 13  | Ghi cách mở hồ sơ là đề xuất, không hỏi                                 | Trang skill, mục hồ sơ, nói vậy (giới hạn `guide-skips-record-question`)                     | bỏ                 | khác                   | —       |
| 14  | Lời «đồng ý» cuối không xác nhận nguyên tắc và hồ sơ                    | Trang skill: không bao giờ ghi `user` cho nguyên tắc người không chọn                        | bỏ                 | khác                   | 4       |
| 15  | Rút gọn chữ giấy phép; giữ khối `proposed` của dòng sổ nguồn            | Trang skill bảo đặt lời người «as they gave them»; giữ hay bỏ `proposed` không trang nào nói | giữ, lặng lẽ       | kiểu chữ               | 16b     |
| 16  | Báo xoá thất bại bằng `Alert`, vì chưa có toast                         | Như lượt 15                                                                                  | giữ, lặng lẽ       | khác: hành vi màn      | 17a     |
| 17  | «Đang xoá» hiện ngay                                                    | Trang luật nói từ một giây; lỗi lọt đã ghi                                                   | bỏ                 | khác                   | 17c     |
| 18  | Tiêu điểm về tiêu đề khi danh sách trống                                | Trang luật dòng 97 nói thứ tự khác; lỗi lọt mới                                              | bỏ, vào sổ lỗi lọt | khác                   | 17b     |
| 19  | Viết lại hai bài kiểm đơn vị                                            | Không có cách thứ hai                                                                        | bỏ                 | khác                   | 19      |
| 20  | Dòng nhật ký wiki                                                       | `AGENTS.md` nói                                                                              | bỏ                 | khác                   | 20      |
| 21  | Mỗi bảng mẫu một thư mục, đưa đường dẫn, không mời commit               | Cách dùng lệnh, không phải lựa chọn của hệ thiết kế; trang skill bảo mời commit              | bỏ                 | khác                   | mới     |

**Giữ 8 chỗ:** 2, 4, 6, 7, 9, 10, 15, 16.

- **Vào hàng chờ, 1 chỗ:** 4.
- **Được hỏi người, 3 chỗ:** 6, 7, 9.
- **Tự quyết lặng lẽ, 4 chỗ:** 2, 10, 15, 16.

| Mảng                | Lượt 15       | Lượt 16                       |
| ------------------- | ------------- | ----------------------------- |
| Kiểu chữ            | 1 (giấy phép) | 1 (chữ giấy phép, `proposed`) |
| Vai màu             | 2             | 1                             |
| **Độ nổi**          | **0**         | **0**                         |
| **Chuyển động**     | **0**         | **0**                         |
| **Mật độ**          | **0**         | **0**                         |
| Thang chữ và bo góc | 2             | 2                             |
| Khác                | 5             | 4                             |

**Chỗ phải phán đoán khi đếm:**

- **Chặt hơn,** như lượt 15 (bỏ 9 và hai chỗ ghi chép 2, 10): còn 5, so với 7.
- **Chặt nhất** (chỉ năm mảng của đề bài: 6, 7, 15): còn 3, so với 4.
- **Lỏng hơn:** tính thêm 8, 12, 17, 18: 12, so với 14. Mọi chỗ tác tử khai: 21, so với 20 (24 khi tách).

Đọc cách nào thì lượt 16 cũng không cao hơn lượt 15. Chỗ vai màu đã mất là câu thanh bên và câu biểu đồ: trang skill nay
hỏi chúng, nên tác tử không phải chọn đọc trang theo cách nào. Ba mảng độ nổi, chuyển động, mật độ vẫn 0. Ba dòng giới
hạn `elevation-not-built`, `motion-not-built` và `density-not-built` của lượt 15 vẫn đúng.

## Sau khi chạy

1. Mỗi điều tác tử báo đã được kiểm trên bản sao (bảng trên).
2. Không sửa gì thêm trong plugin sau lượt chạy.
3. `plugins/design-assembly/references/limits.json`:
   - **Thêm một dòng mở:** `guide-preview-refuses-before-foundations` (vừa, `fix`).
   - **Ba dòng đã đóng** bằng quyết định 0084 trước lượt chạy: `guide-leaves-sidebar-and-chart-waiting`,
     `no-command-prints-value-row-and-check`, `source-color-answer-has-no-name-or-day`. Lượt này cho thấy cả ba đã không
     còn.
4. `design/escapes.md` thêm một dòng: tiêu điểm về tiêu đề thay vì nút của trạng thái trống, cổng xanh. Lỗi «đang xoá»
   ngay đã có dòng từ lượt 15, nên không ghi lại.
5. `wiki/specs/0001-design-system-for-claude-code.md` có thêm mục «Chạy thử lần mười sáu».

## Chi phí

| Ai              | Token                                                                                       | Lần gọi công cụ | Thời gian                                |
| --------------- | ------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------- |
| Tác tử lượt 16  | 268.670, cùng thước đo với lượt 15; sổ của bản ghi: 90.132 ra, 19,2 triệu đọc lại từ bộ đệm | 43              | 13 phút 2 giây làm việc; 08:48 tới 09:01 |
| Tác tử lượt 15  | 279.531                                                                                     | 57              | 14 phút 56 giây                          |
| Phiên điều phối | khoảng 560 nghìn trong ngữ cảnh lúc viết trang này, cho cả hai lượt và phần sửa             | khoảng 215      | 07:42 tới khoảng 09:20                   |

Phần sửa và lượt chạy lại (từ lời «Sửa rồi chạy lại», khoảng 08:20, tới lúc đẩy PR) tốn khoảng 270 nghìn token của tác
tử và khoảng 130 nghìn ngữ cảnh thêm của phiên điều phối, khoảng 60 phút. Ước tính là 650 đến 800 nghìn, 80 đến 100
phút, nên thực tế thấp hơn. Như lượt 15, con số của phiên điều phối là cỡ ngữ cảnh, không phải tổng token đã tính tiền:
sổ của bản ghi cả phiên tới lúc viết trang này là 404 nghìn token ra và 145 triệu token đọc lại từ bộ đệm.
