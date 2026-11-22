# Chạy thử lần 15: vai dẫn dắt đi hết `new` sau khi nền đủ mảng

Một lượt, ngày 2026-11-22, cho mục 9.3 của kế hoạch: tiêu chí 12 và 13 của đề bài
[`0012`](../../wiki/specs/0012-foundations-wide-enough.md). Chủ repo cho chạy («Cho chạy») khi được hỏi «Cho chạy lượt
thử 15 (vai dẫn dắt), ước tính 450 đến 750 nghìn token?». Ước tính ấy kèm 75 đến 90 phút, rút từ lần 14 (khoảng 490 nghìn
token), vì các lượt dẫn dắt trước không ghi token. Lời cho chạy chỉ gồm một lượt vai dẫn dắt trên đề chuẩn: không lượt
thứ hai, không nhánh đối chứng, không vai nhận hay vai dựng màn.

**Kết luận ngắn:**

- Cổng xanh, độ phủ 32 trên 40 câu lõi. Tác tử hỏi người 8 lần.
- Kiểu chữ và 23 trên 31 vai màu có giá trị có nguồn là lời của chủ repo. 8 vai còn chờ: 3 vai thanh bên, 5 vai biểu đồ.
  Tác tử không hỏi hai câu ấy, vì trang skill chỉ nhắc chúng ở bước dựng «không dừng». Câu niêm phong 14 và 15 vì thế
  không được mở.
- Không lệnh nào in từng giá trị cạnh dòng sổ và lệnh kiểm giữ nó.
- Vì hai điều trên, **dòng «done when» của giai đoạn 9 chưa được chứng**.
- Sau khi kiểm còn **10 chỗ phải đoán**: 3 vào hàng chờ, 1 được hỏi người, 6 tự quyết lặng lẽ. Không chỗ nào thuộc độ
  nổi, chuyển động hay mật độ.

## Bản sao

Dựng theo [`README.md`](README.md), mục «Dựng bản sao», dòng «Repo trước khi có plugin»:

- **Nguồn:** clone kho này vào thư mục nháp của phiên, ở `e56e77c`, commit đầu tiên của kho (repo-setup 0.4.0, mẫu
  react-vite, mức starter, chưa có plugin).
- **Git:** nhánh `main` tại chỗ ở `e56e77c`; bỏ remote, xoá mọi nhánh và nhãn khác. Sau đó xoá reflog và dọn kho, để
  bản sao chỉ còn một commit và không đọc được lịch sử về sau.
- **Gói cài:** `node_modules` của bản checkout chính, nối bằng một liên kết, ghi vào `.git/info/exclude`. `package.json`
  của `main` khác `e56e77c` ba dòng, nên thư mục gói có nhiều hơn những gì bản sao khai.
- **Xanh trước khi bắt đầu:** `make check` đạt ngay lần đầu: 25 bài đơn vị, 16 bài trình duyệt. Các tệp cổng sinh ra
  (`coverage/`, `dist/`) được dời ra ngoài bản sao.
- **Plugin:** `git archive` của `plugins/design-assembly` ở `82c4aee` (`main` lúc bắt đầu, plugin 0.32.0), bung vào thư
  mục nháp, cạnh bản sao, không trong bản sao. Đây là bản cài, như bộ nhớ đệm của plugin khi cài qua marketplace. Dấu
  băm của cả cây được ghi trước lượt chạy; sau lượt chạy vẫn trùng, nên plugin không đổi trong lúc tác tử đọc và chạy.

**Khác bản sao của lần 7 đến 9:**

- Cùng commit `e56e77c`.
- Gói cài lấy từ bản checkout của hôm nay, không phải của ngày 2026-11-13.
- Bản sao không mang lịch sử nào sau `e56e77c`. Không trang nào ghi bản sao của lần 7 đến 9 có lịch sử hay không.
- Không trang nào ghi lần 7 đến 9 đưa plugin cho tác tử bằng cách nào. Lần này plugin là một thư mục cài riêng, đưa
  bằng đường dẫn (mục kế).
- Plugin đi từ bản của ngày 2026-11-13 lên 0.32.0. Cuộc dẫn dắt nay có thêm: nguyên tắc thiết kế, hướng thiết kế, kiểu
  chữ, họ trung tính, tông trạng thái, bảng vai màu. Audit đếm 40 câu lõi thay vì 38.
- Có thêm 5 câu niêm phong, và 2 câu mới ghi sau lượt chạy (mục «Câu trả lời»).

## Trước khi tác tử bắt đầu: điều nó được đưa có kể lượt thử nào không

Phiên điều phối đọc như tác tử sẽ đọc:

- đề chuẩn;
- trang skill `new` và `audit`, các trang tầng;
- đầu ra của `audit` và `status` trên một bản sao thứ hai của bản sao (bản ấy được dời đi sau khi đọc).

Trang skill và trang tầng không có chữ «trial», không kể lượt nào. `audit` và `status` chỉ in mã của các dòng giới hạn,
không in lời ghi. Ba mã có chữ trial: `changes-after-last-trial-untested`, `trials-on-this-repository-only`,
`brief-not-tried-by-a-builder`. Không mã nào kể điều một tác tử đã làm.

Sổ `references/limits.json` của plugin có lời ghi kể điều các lượt dựng màn tìm ra. Đường `new` không in các lời ấy:
chỉ lệnh `brief` in lời của vùng `brief`, và cuộc dẫn dắt không chạy `brief`. Bản ghi của tác tử cho thấy nó không mở
`limits.json`. Các tệp của plugin nó đọc là:

- trang skill `new` và `audit`;
- `references/layers.json` và ba trang tầng `context`, `foundations`, `patterns`;
- `references/principles.json`, `references/vocabulary.json`, `references/checks.md`.

Đó đều là trang skill trỏ tới. Nó không mở mã của script nào; nó chỉ chạy chúng. Vì vậy lượt này bắt đầu.

## Câu trả lời

Năm lựa chọn chưa có khi câu trả lời của vai dẫn dắt được niêm phong: kiểu chữ, họ trung tính, tông trạng thái, vai
thanh bên, vai biểu đồ. Trước khi cho chạy, chủ repo được báo rằng lời họ đã đáp cho kho này ngày 2026-11-21 và 22 sẽ
được niêm phong cho năm lựa chọn ấy, và không phản đối. Năm tệp được viết bằng lời thường. Chúng được commit trước khi
tác tử khởi động (lúc 07:47; tác tử bắt đầu lúc 07:48):

| Tệp                     | Lời niêm phong                                                                                          | Lời gốc của chủ repo, cho kho này                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `11-kieu-chu.md`        | Giữ font của sàn. Tiêu đề cũng dùng đúng font đó.                                                       | «Giữ font của sàn», 2026-11-21, câu `typeface-of-text-and-headings`            |
| `12-ho-trung-tinh.md`   | Xám thuần, không ngả theo màu nào. Để máy tính ra các màu đó.                                           | «Đáp theo khuyến nghị», 2026-11-22: họ trung tính do công thức viết, xám thuần |
| `13-tong-trang-thai.md` | Màu báo lỗi giữ như của sàn.                                                                            | «Đáp theo khuyến nghị», 2026-11-22: `--destructive` giữ của sàn                |
| `14-thanh-ben.md`       | Thanh bên đi theo màu chính: màu nhấn của nó, chữ trên màu ấy và viền tiêu điểm đều lấy theo màu chính. | «Đáp theo khuyến nghị», 2026-11-22: ba vai thanh bên đi theo màu chính         |
| `15-bieu-do.md`         | Các màu biểu đồ giữ như của sàn.                                                                        | «Đáp theo khuyến nghị», 2026-11-22: năm vai biểu đồ giữ của sàn                |

Phiên điều phối không thêm lời đáp nào của riêng nó vào năm tệp ấy.

Tác tử hỏi hai câu không có tệp. Theo README, phiên điều phối trả lời theo giọng các câu đã có, rồi ghi mỗi câu thành
tệp ngay sau lượt chạy:

- **Nguyên tắc thiết kế** (`16-nguyen-tac-thiet-ke.md`): «Phần này tôi không rành; giữ những cái bạn đề xuất.» Đây là
  giọng của câu 10, câu người để máy đề xuất. Không có sở thích nào thêm vào.
- **Hướng thiết kế** (`17-huong-thiet-ke.md`): nguyên văn ba câu niêm phong 03, 04 và 05 gộp làm một. Phiên điều phối
  chỉ thêm hai nhãn nối «Chữ:» và «Góc:».

Câu 01 (loại sản phẩm) không mở: cuộc dẫn dắt đọc nó từ `.repo-setup.json`. Câu 04 và 05 không mở riêng: tác tử ghi
thang chữ và bo góc từ lời của câu hướng thiết kế. Câu 06 (cách mở hồ sơ) không mở: chưa màn nào mở hồ sơ, nên cuộc
dẫn dắt ghi đề xuất mà không hỏi. Đây là giới hạn đã có, `guide-skips-record-question`. Câu 09, 10, 14 và 15 không mở.

## Đưa cho tác tử những gì

Đề chuẩn [`briefs/guide.md`](briefs/guide.md) được đưa nguyên văn, từ tiêu đề tới câu cuối, rồi một dòng trống, rồi lời
thêm sau (đường dẫn viết tắt ở đây):

> Your repository is at: `<thư mục nháp>/trial-15/copy`
>
> The plugin is installed at: `<thư mục nháp>/trial-15/plugin`
>
> Its skills are not loaded in this session. Where you would run one of its skills (its pages write them as
> `/design-assembly:<name>`), read and follow `<plugin folder>/skills/<name>/SKILL.md`. `${CLAUDE_PLUGIN_ROOT}` is that
> plugin folder.
>
> To ask the person something, end your reply with the question and nothing after it; the answer comes back to you as
> the next message.

Tác tử là một tác tử con mới, kiểu `general-purpose`. Bản ghi của nó cho thấy cả 116 lượt trả lời đều của
`claude-opus-5-5`, cùng mô hình với lần 12 đến 14. Không trang nào ghi mô hình của tác tử lần 7 đến 9. Tác tử không
nhận gì khác: không bối cảnh, không lịch sử plugin, không điều lượt trước tìm ra.

## Lượt chạy

Bắt đầu lúc 07:48, xong lúc 08:02, qua 57 lần gọi công cụ và chín lượt trả lời. Tám lượt đầu mỗi lượt kết bằng một câu
hỏi; mỗi lời đáp được dán đúng nguyên văn:

| #   | Tác tử hỏi                                                                       | Đáp bằng                    |
| --- | -------------------------------------------------------------------------------- | --------------------------- |
| 1   | Mức accessibility, AA hay AAA                                                    | câu 02                      |
| 2   | Chọn 3 tới 5 trong 8 nguyên tắc hợp với một ứng dụng                             | câu mới 16                  |
| 3   | Hướng A, B hay C trên bảng mẫu của màn thật, sáng và tối                         | câu mới 17 (câu 03, 04, 05) |
| 4   | Màu G, E, A hay B, sau hai vòng `--around` (đậm hơn, rồi dịu hơn)                | câu 07                      |
| 5   | Kiểu chữ của văn bản (A, B) và của tiêu đề (A, B, C)                             | câu 11                      |
| 6   | Họ trung tính: xám thuần, xám ngả màu gốc, hay giữ của sàn                       | câu 12                      |
| 7   | Tông trạng thái, chọn chữ cái trong bốn tông; «giữ của sàn» không là một chữ cái | câu 13                      |
| 8   | Duyệt cuối, sau trang trước và sau                                               | câu 08                      |

Sau câu 8, tác tử chạy `apply`, `adopt`, `make format`, `make design-assembly` và `make check` của bản sao.

- Lần `make check` đầu đỏ: 5 bài trình duyệt của `tests/e2e/templates.spec.ts` (`row-actions-in-view` ở 320,
  `asked-action-closes` ở hai trạng thái và hai bề rộng). Màn mẫu của sàn để hộp thoại mở khi xoá và để cột thao tác ra
  ngoài cửa sổ. Đây là giới hạn đã có, `starter-screen-fails-installed-checks`.
- Tác tử sửa màn mẫu. Lần hai đỏ ở 4 bài vì axe (`label-content-name-mismatch` trên nút đang chờ). Nó thêm một chữ cho
  tên đọc của nút ấy. Lần ba xanh.
- Nó ghi hai dòng vào `design/escapes.md` của bản sao, viết trang `wiki/decisions/0003-…` cùng một dòng nhật ký và một
  dòng mục lục, rồi chạy lại audit.
- Nó không commit. Phiên điều phối giữ bài làm trong bản sao ở commit `f174b05`.

## Số đo, đặt cạnh lần 7, 8 và 9

| Đo gì                           | Lần 7      | Lần 8      | Lần 9      | Lần 15                                                                                                 |
| ------------------------------- | ---------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| Ngày, plugin                    | 2026-11-13 | 2026-11-13 | 2026-11-13 | 2026-11-22, 0.32.0                                                                                     |
| Độ phủ lúc xong                 | 36/38      | 36/38      | 36/38      | 32/40: 22 giữ và chạy lại, 7 khai không chạy lại, 3 ghi nhận                                           |
| Cổng lúc tác tử nói xong        | xanh       | xanh       | xanh       | xanh; phiên điều phối chạy lại: 45 bài đơn vị, 32 bài trình duyệt, 36 quyết định giữ bằng 69 lệnh kiểm |
| Số lần dừng hỏi người           | 7          | 9          | 8          | 8                                                                                                      |
| Dòng thêm vào sổ lỗi lọt        | 2          | 1          | 1          | 2                                                                                                      |
| Chỗ tác tử khai là tự quyết     | 20         | không ghi  | không ghi  | 20                                                                                                     |
| **Chỗ phải đoán, sau khi kiểm** | chưa đếm   | chưa đếm   | chưa đếm   | **10**                                                                                                 |

**Vì sao không so thẳng:**

- Ba lượt kia chưa bao giờ được đếm theo luật đếm. Lần 7 ghi «tác tử khai 20 chỗ, chưa đếm lại».
- Cuộc dẫn dắt nay hỏi những thứ ba lượt kia không có (nguyên tắc, hướng, kiểu chữ, trung tính, trạng thái). Mẫu số câu
  lõi cũng đổi, từ 38 lên 40.
- Bản sao khác ở gói cài, lịch sử git và cách đưa plugin (mục «Bản sao»).
- Mỗi lượt chỉ một tác tử, và ba lượt cùng đề đã lệch nhau một hai câu hỏi.

Lần 15 là điểm đầu của chuỗi đếm cho vai dẫn dắt, như lần 7 là điểm đầu của vai dựng màn.

## Điều tác tử báo, và kiểm thấy gì

| Tác tử báo                                                                              | Kiểm trên bản sao                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Độ phủ 32/40 (22, 7, 3); ngoài lõi 14, 3, 0                                             | Đúng: `audit` chạy lại cho đúng các số ấy                                                                                                                                                                                                     |
| `make check` xanh, 32 bài trình duyệt                                                   | Đúng: chạy lại, thoát 0                                                                                                                                                                                                                       |
| `make design-rate` 46/52                                                                | Đúng: `audit` nói 52 dòng, 46 dòng nêu một lệnh kiểm tìm được                                                                                                                                                                                 |
| Tám câu hỏi, theo thứ tự trên                                                           | Đúng: khớp sổ ghi của phiên điều phối                                                                                                                                                                                                         |
| Câu thanh bên, câu biểu đồ và giấy phép font để chờ                                     | Đúng: `status` nêu 8 câu chờ, trong đó `color-roles-sidebar`, `color-roles-chart`, `font-licence-geist-variable`; `status --roles` nêu 8 vai «waiting on the owner» hoặc «once the owner says so»                                             |
| `--sidebar-ring` trên `--sidebar` 2,48:1 ở giao diện sáng, giữ ở tỉ lệ ấy               | Đúng: dòng `color-contrast, debt:` của cổng                                                                                                                                                                                                   |
| Tên trong `by` là «Manh Phan» (tác giả commit), `git config` nói «Phan Le Manh»         | Đúng cả hai                                                                                                                                                                                                                                   |
| «Giữ màu lỗi của sàn» ghi thành `color-roles-status: floor`, không có `status_tones`    | Đúng; trang skill nói đúng cách ghi ấy                                                                                                                                                                                                        |
| Màn mẫu nói «đang làm» ngay, không đợi một giây                                         | Đúng: `HeldLabel` không có đồng hồ, cổng xanh. Trang luật của bản sao, dòng 96: «From one second on, the control says it is working». Lỗi lọt qua mọi lệnh kiểm (mục «Sau khi chạy»)                                                          |
| Thêm chữ `deletingItem` mà không ai đưa                                                 | Đúng: `src/lib/labels.ts` có thêm một dòng                                                                                                                                                                                                    |
| Báo lỗi xoá bằng `Alert` trên bảng, vì chưa có toast                                    | Đúng                                                                                                                                                                                                                                          |
| Sai ở trang skill: bảng mẫu thang chữ không in cỡ chữ của lựa chọn chuẩn                | Đúng: ở bản tác tử giữ lại (`specimen-type/index.html`), dòng «sizes in px» chỉ có ở hai lựa chọn modular; lựa chọn chuẩn vẽ các bậc mà không in cỡ. Thành dòng giới hạn mới                                                                  |
| Sai: bảng mẫu trung tính không có chữ cái «giữ của sàn»                                 | Đúng một phần: trang skill không hứa một chữ cái, nó bảo nói rằng giữ của sàn vẫn là một lời đáp. Không phải lời sai                                                                                                                          |
| Sai: bước 8 bảo đọc dòng `note:` cho cặp của sàn dưới ngưỡng; không dòng ấy nào hiện ra | Đúng: `apply` chỉ in một `note:` (cỡ text-xs); cặp ấy chỉ hiện ở dòng `debt:` của cổng. Thành dòng giới hạn mới                                                                                                                               |
| Sai: audit không gọi ba nguyên tắc đề xuất là chưa xác nhận                             | Đúng: audit chỉ nêu `product-type` và `record-panel`, và dòng `next:` của nó nói «nothing more to generate or adopt now», trong khi `status` nêu 8 câu chờ. Thành dòng giới hạn mới                                                           |
| Sai: tông trạng thái khuyến nghị «chỉ lỗi» khi màn có huy hiệu «Đang chờ»               | Là phán đoán của tác tử, không phải lời sai của trang. Không tính                                                                                                                                                                             |
| Tệp không được đụng                                                                     | Không đổi: `Makefile`, `.github/`, `eslint.config.js`, `tools/design_guards.mjs`, `tests/e2e/floor.spec.ts`, `design/behaviors.md`, `package.json`, các linh kiện có sẵn của `src/components/ui/`. Thư mục ấy chỉ có thêm hai tệp `apply` cài |

## Tiêu chí 12: dòng «done when»

Dòng ấy đòi bốn điều. Mỗi điều kiểm trên bản sao, sau lượt chạy.

**Kiểu chữ có nguồn là lời của chủ repo.** Đạt:

- Bản thiết kế ghi `text_font: floor`, `heading_font: text`, cùng `answered` với «Manh Phan», ngày 2026-11-22. Đó là câu
  niêm phong 11.
- Dòng sổ `typeface` có ghi chú «answered by Manh Phan on 2026-11-22» và được `tool:tools/design-assembly/check.mjs` giữ.
- Dòng `font-loaded` giữ rằng font ấy được nạp.
- Còn chờ: câu giấy phép của dòng sổ nguồn `design/sources/geist-variable.json`, mà không câu niêm phong nào phủ.

**Mọi vai màu có nguồn là lời của chủ repo.** Chưa đạt. `status --roles` kê 34 vai:

| Nhóm vai                                               | Số vai | Nguồn trên bản sao                                                | Lời niêm phong       |
| ------------------------------------------------------ | ------ | ----------------------------------------------------------------- | -------------------- |
| Trung tính (nền, chữ, thẻ, viền, thanh bên trừ ba vai) | 19     | công thức `neutral-family`, lời chủ repo, Manh Phan, 2026-11-22   | 12                   |
| `--destructive`                                        | 1      | giữ của sàn, lời chủ repo, Manh Phan, 2026-11-22                  | 13                   |
| `--primary`, `--primary-foreground`, `--ring`          | 3      | công thức, «from the owner's source color»; không tên, không ngày | 03 và 07, qua câu 17 |
| `--success`, `--warning`, `--info`                     | 3      | không viết: chủ repo không chọn tông ấy                           | 13                   |
| Ba vai thanh bên đi theo màu chính                     | 3      | giữ của sàn, **chờ chủ repo**                                     | 14, không được mở    |
| `--chart-1` tới `--chart-5`                            | 5      | giữ của sàn, **chờ chủ repo**                                     | 15, không được mở    |

23 trên 31 vai có giá trị có nguồn là lời chủ repo. Ba vai màu chính có lời chủ repo nhưng không ghi ai và ngày nào.
Tám vai không có lời nào: trang skill `new` hỏi họ trung tính và tông trạng thái trên bảng mẫu trước bước duyệt cuối,
còn câu thanh bên và câu biểu đồ chỉ được nhắc ở bước 6, bước dựng «không dừng».

**Cổng xanh.** Đạt: `make check` của bản sao thoát 0 khi phiên điều phối chạy lại.

**Một lệnh in từng giá trị cạnh dòng sổ và lệnh kiểm giữ nó, không dòng nào trống.** Chưa có. Ba thứ gần nhất, đặt
cạnh nhau:

| Lệnh hay tệp                               | In ra                                                          | Trống ở đâu                                                                                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node <plugin>/scripts/status.mjs --roles` | mỗi vai màu: nguồn, lời của ai và ngày nào, các cặp nó được đo | không in giá trị, dòng sổ hay lệnh kiểm; không có kiểu chữ; 8 vai «Not measured» (5 vai biểu đồ, `--border`, `--input`, `--sidebar-border`); 8 vai không có lời chủ repo; 3 vai không có tên và ngày |
| `design/decisions.yaml` (và `audit`)       | mỗi dòng sổ: nguồn và lệnh kiểm                                | không in giá trị của từng vai; dòng `source-color` là phán đoán, không có lệnh kiểm                                                                                                                  |
| `design/tokens.json`                       | giá trị của mỗi token, sáng và tối                             | không nói dòng sổ hay lệnh kiểm                                                                                                                                                                      |

Theo việc được giao, mục này không dựng lệnh ấy. Nó thành dòng giới hạn `no-command-prints-value-row-and-check`.

**Kết luận: dòng «done when» chưa được chứng.** Thiếu hai thứ: 8 vai màu chưa có lời chủ repo, vì cuộc dẫn dắt không
hỏi; và không có lệnh nào in đủ ba cột. Các quyết định thuộc chủ repo:

- Sửa cuộc dẫn dắt cho nó hỏi câu thanh bên, câu biểu đồ và câu giấy phép trước bước duyệt cuối, rồi chạy thêm một lượt
  vai dẫn dắt. Lượt ấy cần lời cho chạy riêng.
- Dựng lệnh in giá trị cạnh dòng sổ và lệnh kiểm, hay coi ba thứ đặt cạnh nhau ở trên là đủ cho chữ «một lệnh» của tiêu
  chí.
- Có đòi tên và ngày cho lời đáp màu gốc như kiểu chữ, hay không.

## Tiêu chí 13: đếm từng chỗ, theo mảng

Đếm theo luật của [`README.md`](README.md), cùng độ chặt với các trang lần 12 đến 14. Một chỗ là một lần tác tử phải
chọn giữa hai cách hợp lệ mà không trang nào nói chọn cách nào. Với vai dẫn dắt, «trang» là trang skill, trang tầng,
trang luật nó cài và `AGENTS.md` của bản sao. Chỗ có câu trên hàng chờ vẫn là chỗ phải đoán, tính «vào hàng chờ». Tác tử
khai 20 chỗ; chỗ 16 được tách làm hai vì thuộc hai mảng, chỗ 17 làm bốn vì gồm bốn lựa chọn.

| #   | Tác tử khai                                                                | Kiểm thấy                                                                                                                      | Đếm                | Mảng                   |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------------------- |
| 1   | Nói tiếng Anh trước, rồi tiếng Việt                                        | `AGENTS.md` của bản sao: «Conversation: vi»                                                                                    | bỏ                 | khác                   |
| 2   | `why`, sổ lỗi lọt, wiki viết tiếng Việt                                    | Trang skill: `why` viết bằng ngôn ngữ tài liệu của repo                                                                        | bỏ                 | khác                   |
| 3   | Ba nguyên tắc nào, khi người nói «giữ cái bạn đề xuất» lúc chưa có đề xuất | Trang skill chỉ nói cách làm khi giao hẳn cho Claude («propose three that suit»), không nói chọn ba cái nào trong tám          | giữ, hàng chờ      | khác: nguyên tắc       |
| 4   | Ghi ba nguyên tắc là `proposed`                                            | Trang skill: «Never write `user` for a principle the person did not pick»                                                      | bỏ                 | khác                   |
| 5   | Khuyến nghị hướng A dù A không khớp nguyên tắc đề xuất                     | Trang skill: «Recommend A»                                                                                                     | bỏ                 | màu                    |
| 6   | «Đậm, nghiêm, đừng tươi» thành hai vòng `--around` (đậm hơn, rồi dịu hơn)  | Trang skill nói dùng `--around` và không tự dịch màu, không nói ghép hai hướng đổi thế nào                                     | giữ, hỏi người     | vai màu                |
| 7   | «Rõ hơn một chút» thành `minor-third`                                      | Không trang nào nối lời với tỉ lệ; ghi mà không bày bảng mẫu thang chữ                                                         | giữ, lặng lẽ       | thang chữ, bo góc      |
| 8   | «Mềm hơn một nấc» thành `medium` (12px)                                    | Nấc kế trên thang bo góc là một đáp án                                                                                         | bỏ                 | thang chữ, bo góc      |
| 9   | Không hỏi chữ cái cho thang chữ và bo góc                                  | Trang skill: «ask one section at a time, with the letters»; đề nói đổi lời thành giá trị là việc của tác tử. Hai cách đọc      | giữ, lặng lẽ       | thang chữ, bo góc      |
| 10  | Giữ tên hướng `workbench`                                                  | Trang skill: «A value they change keeps the direction named»                                                                   | bỏ                 | màu                    |
| 11  | Cả tầng nền `source: user`, dù đơn vị khoảng cách chỉ có một phương án     | Trang skill nói cả hai: lựa chọn một phương án là `proposed`, và tầng người đáp hết là `user`                                  | giữ, lặng lẽ       | khác: ghi bản thiết kế |
| 12  | Những gì vào `rejected`                                                    | Trang skill: chỉ phương án đã bày cho người và bị từ chối                                                                      | bỏ                 | khác                   |
| 13  | Tên trong `by`: «Manh Phan» hay «Phan Le Manh»                             | Trang skill: «the name the person goes by in this repository»; repo có hai tên                                                 | giữ, lặng lẽ       | khác: ghi bản thiết kế |
| 14  | «Tiêu đề dùng đúng font đó» thành `heading_font: text`                     | Bảng mẫu: A là «same as text»                                                                                                  | bỏ                 | kiểu chữ               |
| 15  | «Giữ màu lỗi của sàn» thành `floor`, không có `status_tones`               | Trang skill: «Kept from the floor is `"source": "floor"` with no value under `choice`»                                         | bỏ                 | vai màu                |
| 16a | Không hỏi câu thanh bên và câu biểu đồ                                     | Bước 6 nói dựng «without stopping», và cũng nói mỗi câu «asked once for its group». Hai cách đọc; tác tử để chúng chờ          | giữ, hàng chờ      | vai màu                |
| 16b | Không hỏi giấy phép font                                                   | Mục kiểu chữ bảo hỏi giấy phép cho dòng `font-source` viết; dòng này `apply` đề xuất cho font của sàn. Hai cách đọc; để chờ    | giữ, hàng chờ      | kiểu chữ               |
| 17a | Báo xoá thất bại bằng `Alert` trên bảng, vì chưa có toast                  | Trang luật: kết quả báo qua «one module»; repo không có module ấy, không trang nào nói thay bằng gì                            | giữ, lặng lẽ       | khác: hành vi màn      |
| 17b | Tiêu điểm sau khi xoá: hàng sau, hàng trước, rồi nút của trạng thái trống  | Trang luật dòng 97 nói đúng thứ tự ấy                                                                                          | bỏ                 | khác                   |
| 17c | «Đang xoá» hiện ngay, không đợi một giây                                   | Trang luật dòng 96: «From one second on». Trang có nói; tác tử làm khác. Là lỗi lọt, không phải chỗ đoán                       | bỏ, vào sổ lỗi lọt | khác                   |
| 17d | Cột thao tác dùng `TableActionsHead`, `TableActions`                       | Bài kiểm trình duyệt buộc vậy                                                                                                  | bỏ                 | khác                   |
| 18  | Thêm chữ `deletingItem` cho tên đọc lúc chờ                                | Trang luật dòng 66 nói tên đọc của nút «⋯», không nói của một nút giữ bằng `HeldLabel`; dòng 116 bảo hỏi trên phiếu quyết định | giữ, lặng lẽ       | khác: chữ              |
| 19  | Viết lại ba bài kiểm đơn vị của luồng hộp thoại cũ                         | Không có cách thứ hai: hành vi đổi theo luật                                                                                   | bỏ                 | khác                   |
| 20  | Viết trang quyết định, dòng nhật ký, dòng mục lục của wiki                 | `AGENTS.md` của bản sao bảo làm                                                                                                | bỏ                 | khác                   |

**Giữ 10 chỗ:** 3, 6, 7, 9, 11, 13, 16a, 16b, 17a, 18.

- **Vào hàng chờ, 3 chỗ:** 3, 16a, 16b. Ba nguyên tắc chờ chủ repo trên phiếu quyết định; câu thanh bên, câu biểu đồ,
  câu giấy phép chờ trên hàng chờ.
- **Được hỏi người, 1 chỗ:** 6. Màu G bày cho người, và người xác nhận bằng câu 07.
- **Tự quyết lặng lẽ, 6 chỗ:** 7, 9, 11, 13, 17a, 18.

| Mảng                                     | Chỗ        |
| ---------------------------------------- | ---------- |
| Kiểu chữ                                 | 1 (16b)    |
| Vai màu                                  | 2 (6, 16a) |
| **Độ nổi**                               | **0**      |
| **Chuyển động**                          | **0**      |
| **Mật độ**                               | **0**      |
| Thang chữ và bo góc (đã có từ trước 9.1) | 2 (7, 9)   |
| Khác: nguyên tắc                         | 1 (3)      |
| Khác: ghi bản thiết kế                   | 2 (11, 13) |
| Khác: hành vi của màn mẫu                | 1 (17a)    |
| Khác: chữ                                | 1 (18)     |

**Chỗ phải phán đoán khi đếm**, để chủ repo thấy con số lung lay tới đâu:

- **Chặt hơn:** bỏ 9 (đề cho phép đổi lời thành giá trị), 11 và 13 (ghi chép, không phải một lựa chọn thiết kế): còn 7.
  Trong đó 3 vào hàng chờ, 1 được hỏi, 3 lặng lẽ.
- **Chặt nhất:** chỉ giữ lựa chọn thuộc năm mảng của đề bài (6, 7, 16a, 16b): còn 4.
- **Lỏng hơn:** tính thêm 8, 14, 15 và 17c, bốn chỗ mỗi chỗ có thể đọc thành hai cách: 14. Tính mọi chỗ tác tử khai,
  với 16 và 17 tách như trên: 24; theo cách tác tử gộp: 20.

Đọc cách nào thì độ nổi, chuyển động và mật độ cũng không có chỗ nào:

- Chỗ 17c (một giây trước khi nói «đang làm») là mốc thời gian của một hành vi, không phải chuyển động trên màn. Dòng
  luật ấy đã có.
- Hướng `workbench` có nhắc «hàng dày», nhưng không ai phải chọn mật độ. Dòng `table-density` đã có trong sổ.
- Không chỗ nào chạm tới bóng đổ hay lớp nổi.

Theo tiêu chí 13, ba mảng ấy thành ba dòng giới hạn, không thành đề bài:

- `elevation-not-built`
- `motion-not-built`
- `density-not-built`

Cả ba để `plan: keep`, mức nhẹ. Mức và hướng xử lý là đề xuất của phiên này, chờ chủ repo.

## Sau khi chạy

Theo mục «Sau khi chạy» của [`README.md`](README.md):

1. Mỗi điều tác tử báo đã được kiểm trên bản sao của nó (bảng trên).
2. Không sửa gì trong plugin.
3. `plugins/design-assembly/references/limits.json` có thêm 12 dòng mở, mỗi dòng nói điều plugin làm hay không làm. Lời
   ghi không kể tác tử nào đã làm gì.
   - `type-sheet-standard-prints-no-sizes` (nhẹ, `fix`).
   - `guide-leaves-sidebar-and-chart-waiting` (vừa, `fix`): câu thanh bên, câu biểu đồ và câu giấy phép chỉ được nhắc ở
     bước dựng.
   - `no-command-prints-value-row-and-check` (vừa, `fix`): tiêu chí 12.
   - `source-color-answer-has-no-name-or-day` (nhẹ, `fix`).
   - `guide-reads-out-a-note-the-gate-prints-as-debt` (nhẹ, `fix`).
   - `audit-next-silent-on-the-waiting-list` (nhẹ, `fix`).
   - `held-label-says-working-at-once` (nhẹ, `fix`).
   - `held-control-name-words-unsaid` (nhẹ, `fix`).
   - `result-module-absent-without-toast` (nhẹ, `fix`).
   - `elevation-not-built`, `motion-not-built`, `density-not-built` (nhẹ, `keep`): tiêu chí 13.

   Không dòng nào đóng. `guide-skips-record-question` và `starter-screen-fails-installed-checks` để nguyên: lượt này cho
   thấy đúng điều chúng ghi.

4. Sổ lỗi lọt `design/escapes.md` của kho này có thêm một dòng: `HeldLabel` nói «đang làm» ngay, cổng xanh. Hai dòng tác
   tử ghi vào sổ của bản sao là hai bài kiểm trình duyệt đã bắt được, nên không phải lỗi lọt.
5. Đề bài `wiki/specs/0001-design-system-for-claude-code.md` có thêm mục «Chạy thử lần mười lăm».

## Chi phí

| Ai              | Token                                                                                                                                       | Lần gọi công cụ | Thời gian                                                                     | Ước tính trước                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------- | --------------------------------- |
| Tác tử dẫn dắt  | 279.531, cùng thước đo với 336.055 của lần 14. Sổ của bản ghi: 102.303 token ra, 23,9 triệu token đọc lại từ bộ đệm, 535.635 ghi vào bộ đệm | 57              | 14 phút 56 giây làm việc qua chín lượt; 07:48 tới 08:02 kể cả lúc chờ lời đáp |                                   |
| Phiên điều phối | khoảng 420 nghìn trong ngữ cảnh lúc mở PR; sổ của bản ghi tới lúc viết trang này: 134 nghìn token ra, 42 triệu token đọc lại từ bộ đệm      | khoảng 110      | khoảng 70 phút, từ 07:42 tới lúc mở PR                                        |                                   |
| Cộng            | khoảng 700 nghìn, theo thước đo của lần 14                                                                                                  |                 | khoảng 70 phút                                                                | 450 đến 750 nghìn, 75 đến 90 phút |

Tác tử tốn ít hơn tác tử dựng của lần 14, nhưng phiên điều phối tốn nhiều hơn ước tính. Nó phải tìm cách các lượt dẫn
dắt trước đưa plugin cho tác tử, nhưng không trang nào ghi. Mỗi lượt của tác tử cũng cần một vòng hỏi và đáp. Cộng lại
nằm gần đầu trên của ước tính. Con số của phiên điều phối là cỡ ngữ cảnh, không phải tổng token đã tính tiền: mỗi lượt
đọc lại ngữ cảnh, nên tổng thật cao hơn nhiều, như cột sổ của bản ghi cho thấy.

Phiên điều phối mở bằng Fable 5.2 (ba lượt trả lời đầu, lúc đọc cách làm), rồi chạy bằng Opus 5.5 từ lúc dựng bản sao
tới hết.
