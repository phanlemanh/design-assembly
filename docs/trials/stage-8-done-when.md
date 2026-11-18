# Ba dòng «done when» của giai đoạn 8, chạy bằng lệnh

Chạy ngày 2026-11-18, sau khi mục 8.4 đóng. Kế hoạch chỉ cho đóng giai đoạn 8 khi mỗi dòng «done when» được chứng bằng
một lệnh. Trang này ghi lệnh nào đã chạy và mỗi dòng đứng ở đâu. Kết luận: cả ba dòng đã có lệnh chứng, mỗi dòng kèm
một điều cần biết ghi ở mục của nó. Nửa sau của dòng 1 chứng bằng một phép phát lại, và nửa sau của dòng 3 bằng lần
chạy thử 11, đều thêm cùng ngày. Chủ repo đọc các điều cần biết ấy rồi bảo đóng giai đoạn 8, ngày 2026-11-18; lời ghi
đóng nằm ở `closed` của giai đoạn trong `docs/plan/plan.json`.

## Chạy trên gì

- **Ứng dụng mẫu:** kho này ở `86ea3bc`.
- **Repo kiểm chứng:** một bản sao của Inventory ở `bd32d73e` (sau PR 86 của nó), đặt trong thư mục tạm của phiên. Gói
  cài của Inventory được nối vào bản sao bằng một liên kết, không nằm trong chỉ mục của bản sao.
- Không lệnh nào ghi vào Inventory thật: `git status` ở đó rỗng trước và sau.

| Dòng «done when»                                                                 | Kết quả                                   |
| -------------------------------------------------------------------------------- | ----------------------------------------- |
| 1. Số PR chạm hai sổ về 0, và mỗi PR chỉ chạm mảnh sổ của chính nó               | Đạt; nửa sau bằng phép phát lại           |
| 2. Lệnh bản đồ màn chọn đúng màn bị ảnh hưởng, và trả trọn bộ khi không lần được | Đạt                                       |
| 3. Một lượt dựng màn không hỏi giữa chừng; tường chặn tới khi có lời đáp         | Đạt ở một lượt; 6 trên 9 chỗ vào hàng chờ |

## Dòng 1: PR chạm sổ

Lệnh: `git ls-tree` và `.gitignore` trên nhánh chính của bản sao; rồi `git diff --name-only` giữa cha thứ nhất và
commit gộp của 40 PR gần nhất.

- **Về 0, đạt.** Sổ linh kiện (`design/component-registry.json`) và bảng vai × màn × nút
  (`design/role-screen-buttons.md`) không còn trong git và nằm trong `.gitignore`. Hai PR gộp sau lần nhận 0.7.0 (PR 85
  và 86) chạm 0 tệp trong hai tệp ấy. Trong 37 PR gộp trước lần nhận, 20 PR có chạm ít nhất một tệp.
- **Mảnh của chính nó, trên PR thật: chưa có gì để đếm.** Hai PR ấy không chạm mảnh nào trong `design/screens/` hay
  `design/intake/`. Từ lúc tách mảnh chưa có PR dựng màn nào gộp. Phép phát lại ở dưới chứng nửa này.
- **Một PR đang mở cắt từ trước lần nhận** (PR 83, gốc `ea774a0f`) còn sửa sổ linh kiện. Khi gộp nhánh chính vào, nó
  gặp việc xoá tệp ấy một lần. Đây là điều giới hạn `screen-fragments-git-left-to-a-person` đã nêu.

### Phát lại: hai nhánh, mỗi nhánh thêm một màn

Trên bản sao, hai nhánh cắt từ cùng một commit. Mỗi nhánh thêm một màn chỉ dùng lúc phát triển: một thư mục trang chép
từ màn mẫu `proto/bo-nut-theo-quyen` sang đường dẫn mới, và mục sổ màn của nó. Rồi gộp hai nhánh vào nhau theo cả hai
thứ tự bằng `git merge`. Phép này chạy hai lần: trên bố cục mảnh ở `bd32d73e`, và để đối chứng trên bố cục sổ một tệp
ở `ea774a0f` (trước lần nhận 0.7.0, công cụ bản 0.1.0).

| Đo gì                                            | Sổ một tệp, `ea774a0f`                            | Sổ theo mảnh, `bd32d73e`            |
| ------------------------------------------------ | ------------------------------------------------- | ----------------------------------- |
| Tệp trong `design/` mỗi nhánh chạm               | 2 tệp chung: sổ màn và bảng vai × màn × nút       | 1 tệp: mảnh của chính màn ấy        |
| Tệp xung đột khi gộp nhánh thứ hai               | 2: `design/screens.yaml`, `design/vai-man-nut.md` | 0, ở cả hai thứ tự                  |
| Cổng của công cụ và phép kiểm sổ màn sau khi gộp | không chạy: phải gỡ xung đột bằng tay trước       | xanh; sổ màn ghép lại có cả hai màn |

Trên bố cục mảnh, từng nhánh và cả hai kết quả gộp đều qua ba lệnh: `node tools/design-assembly/derived.mjs`,
`node tools/design-assembly/check.mjs` (19 quyết định, 27 phép kiểm) và `python3 tools/coverage_matrix/check.py`
(11 màn, 10 trang sau khi gộp). Các tệp dẫn xuất được ghi lại mà git không thấy thay đổi nào. Lệnh bản đồ màn trả đúng
màn mới cho tệp trang của mỗi nhánh.

Hai điều cần biết về phép phát lại:

- Hai màn là màn dựng cho phép thử, chép từ một màn mẫu, không phải việc thật của repo kiểm chứng. Chúng không thêm
  thao tác, thực thể hay bài trình duyệt, nên phép này không nói gì về các tệp ấy.
- Ở bố cục cũ, mục sổ màn mới được thêm vào cuối tệp, sau màn đứng cuối. Hai mục thêm vào hai chỗ xa nhau của tệp
  có thể không xung đột, nên con số 2 là của cách thêm này. Sổ linh kiện không đổi ở cả hai nhánh cũ, vì thư mục trang
  chép sang không thêm linh kiện nào vào sổ.

## Dòng 2: lệnh bản đồ màn

**Ứng dụng mẫu.** Lệnh: `node tools/design-assembly/affected.mjs --files <tệp> --json`, và
`node --test plugins/design-assembly/tests/test-affected.mjs` (19 bài đạt).

| Tệp đổi                           | Lệnh trả                                |
| --------------------------------- | --------------------------------------- |
| `src/example/OverdueScreen.tsx`   | màn `overdue`                           |
| `src/example/ReferenceScreen.tsx` | màn `reference`                         |
| `src/components/item-table.tsx`   | cả hai màn                              |
| `src/index.css`                   | trọn bộ: tệp định kiểu                  |
| `design/screens/_shared.yaml`     | trọn bộ: phần sổ màn mọi màn dùng chung |
| `src/greet.ts`                    | trọn bộ: không thuộc màn nào            |

**Bản sao repo kiểm chứng**, bằng công cụ 0.7.1 của chính nó và bản đồ nó đã khai:

| Tệp đổi                                           | Lệnh trả                                   |
| ------------------------------------------------- | ------------------------------------------ |
| Tệp trang của màn đăng nhập, kho hàng, thành viên | đúng màn ấy, ở cả ba phép thử              |
| Lớp vỏ `src/app/(app)/layout.tsx`                 | bảy màn nhân viên, không gồm màn đăng nhập |
| Một mảnh sổ màn                                   | màn của mảnh ấy                            |
| Tệp mà một API route chạy tới                     | trọn bộ: máy chủ chạy tệp ấy cho mọi màn   |
| Tệp định kiểu, phần sổ màn chung                  | trọn bộ                                    |

**Trên PR thật.** Lệnh:
`node docs/trials/declared-against-chosen.mjs --copy <bản sao> --range 'fc18cb2e~1..bd32d73e'`
([`declared-against-chosen.mjs`](declared-against-chosen.mjs)). Nó đưa bản sao về từng commit gộp, lấy màn mà hợp đồng
của vòng ấy khai, và so với màn lệnh của kho này chọn.

- 40 PR đã gộp (PR 38 tới PR 86), 18 PR có hợp đồng khai màn.
- Không PR nào thiếu màn đã khai. Lệnh thoát 0.
- Không PR nào được thu hẹp: cả 40 đều trả «trọn bộ», kể cả PR 85 và 86, gộp sau khi Inventory đã khai bản đồ. Lý do
  của hai PR ấy là «không thuộc màn nào»: chúng chạm bài kiểm và dữ liệu.

Vậy lệnh an toàn và chọn đúng khi lần được, nhưng trên PR thật của repo kiểm chứng nó chưa bớt được bài nào. Số này
khớp phép đo ngày 2026-11-16 ([`affected-on-a-reference-copy.md`](affected-on-a-reference-copy.md)): không khai bản đồ
thì 0 trên 30 PR thu hẹp.

## Dòng 3: hàng chờ và tường

**Tường trên bản sao repo kiểm chứng.** Lệnh: `node tools/design-assembly/check.mjs` của bản sao, trên một nhánh cắt từ
nhánh chính của nó; câu hỏi và lời đáp ghi bằng `decide.mjs` của plugin với `--target`.

| Bước                                               | Cổng                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Chưa đổi gì                                        | xanh: 19 quyết định, 27 phép kiểm                                                      |
| Thêm một trang kiểu màn mới vào `design/patterns/` | đỏ ở `owner-calls`, nêu tên kiểu màn và lệnh để hỏi                                    |
| Đổi dòng màu gốc trong tệp định kiểu               | đỏ ở `owner-calls`, nêu màu mới                                                        |
| `decide --ask --item pattern:<kiểu màn>`           | câu hỏi thành một tệp riêng trong `design/waiting/`; cổng vẫn đỏ, ghi đang chờ lời đáp |
| Ghi lời đáp «giữ» cho câu ấy                       | xanh                                                                                   |

Lời đáp ở bước cuối do phép thử ghi trên bản sao, dưới tên «phép thử trên bản sao», không phải lời của chủ repo. Bản
sao được trả về như cũ sau mỗi bước.

**Bài kiểm của plugin.** `node --test` trên `test-waiting.mjs`, `test-owner-calls.mjs` và
`test-owner-calls-shallow.mjs`: 43 bài đạt.

### Chạy thử lần 11: một lượt dựng màn với hàng chờ

Lần chạy thử vai dựng màn trước đó là lần 10, ngày 2026-11-13, trước khi có 8.3. Lần 11 chạy đề chuẩn
`briefs/screen.md`, nguyên văn, bằng một tác tử độc lập, trên một bản sao của kho này ở `315d571`. Chủ repo cho phép
trước khi chạy.

| Đo gì                                           | Kết quả                                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Số lần tác tử dừng lại hỏi người                | 0                                                                                |
| Câu tác tử đưa vào hàng chờ                     | 6, mỗi câu một tệp trong `design/waiting/`, đều «dễ đảo»                         |
| Câu trong hàng chờ có lời đáp do tác tử ghi     | 0                                                                                |
| Cổng lúc tác tử nói xong                        | xanh; phiên điều phối chạy lại `make check`: 124 bài đơn vị, 144 bài trình duyệt |
| Chỗ tác tử khai là tự quyết                     | 18                                                                               |
| Chỗ phải đoán, sau khi phiên điều phối kiểm     | 9: bỏ 9 chỗ đã có trang chỉ hướng                                                |
| Trong 9 chỗ ấy, vào hàng chờ / tự quyết lặng lẽ | 6 / 3                                                                            |
| Dòng thêm vào sổ lỗi lọt                        | 1                                                                                |
| Tệp tác tử không được đụng                      | không đổi: `src/lib/notify.ts`, `src/components/ui/`, `tools/`, `mk/`            |

Ba chỗ tự quyết mà không xếp câu: hình dạng của khái niệm mới trong mô hình dữ liệu (tác tử ghi «cần xác nhận» ở trang
thực thể, theo luật của mô hình dữ liệu), màn «Quá hạn» có nhận thao tác mới hay không, và vị trí của màn mới trong
vùng điều hướng. Lượt này không thêm kiểu màn mới và không đổi màu gốc, nên tường không bị thử ở đây; phép thử tường là
bảng ở trên.

**Bản sao khác các lần 7 đến 10 ở ba chỗ**, nên con số 9 không so thẳng được với chuỗi 12, 12, 13, 11:

- Bản sao bỏ thêm `mk/plan.mk` và mục kế hoạch trong `AGENTS.md`. Kế hoạch có sau lần 10 và đọc `docs/`, là thư mục
  bản sao phải bỏ.
- Trang luật bảo tác tử xếp câu bằng `/design-assembly:decide --ask`. Bản sao không có plugin, nên phiên điều phối đặt
  một tệp chạy ngoài bản sao trỏ tới script của plugin, và dặn tác tử chạy chứ không đọc.
- Đề nói «app có một màn», trong khi kho nay có hai. Đề giữ nguyên để không cắt chuỗi.

**Điều lần thử tìm ra.** Phiên điều phối đã kiểm các con số ở bảng trên. Ngày 2026-11-18, một phiên sau kiểm từng điều
tác tử báo, trên bản sao của nó (nhánh `trial/screen`, commit `e33ed85`, chỉ đọc) và trên nhánh chính của kho này. Cả
bảy điều đứng vững. Không điều nào được sửa ở lượt kiểm ấy; mỗi điều nay nằm ở một dòng của
`plugins/design-assembly/references/limits.json`:

| Điều tác tử báo                                                                                                                                                            | Kiểm thấy                                                                                                                                                                                                          | Dòng sổ giới hạn                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `RowActions` lúc chờ không đưa chữ nào lên trang, trong khi sổ trạng thái cần chữ để bài trình duyệt đợi                                                                   | Đúng: lúc chờ nút chỉ đổi biểu tượng và tên đọc. Bài trình duyệt chỉ đợi chữ xuất hiện, không đòi chữ ấy vắng trước các bước, nên một trạng thái khai bằng chữ luôn có trên trang qua ngay mà không được đo        | `spoken-only-state-unlisted` (đã có), `state-words-present-before-the-state` (mới) |
| Luật «trạng thái trống có nhiều nhất một liên kết trong câu» ngược với cổng                                                                                                | Đúng: phép kiểm `screen-links` đỏ với mọi liên kết từ một màn tới đường dẫn của màn khác, nên liên kết duy nhất luật cho phép không trỏ được tới màn nơi mục tới                                                   | `empty-state-link-fails-the-gate` (mới)                                            |
| Trang hành vi nói nút đang chờ báo «qua `useSlow`», còn `RowActions` giữ hằng một giây của riêng nó                                                                        | Đúng. Trang luật còn bảo màn «không tự viết đồng hồ», nhưng nút không cho màn biết lúc nó bắt đầu báo, nên màn muốn có chữ cho bài kiểm phải viết đồng hồ thứ hai; tác tử đã làm vậy và xếp câu `aside-busy-words` | `row-waiting-words-need-a-second-clock` (mới)                                      |
| Trang kiểu màn danh sách nói màn chỉ đưa nguồn, tiêu đề, lời trạng thái trống và việc trên dòng, trong khi màn mẫu tự giữ mọi việc của dòng (tiêu điểm, chờ, hộp xác nhận) | Đúng: màn mẫu tự giữ nút xoá, đồng hồ chờ, tiêu điểm và hộp thoại; tác tử phải tự viết phần dùng chung cho hai màn                                                                                                 | `row-change-logic-not-shipped` (đã có)                                             |
| Không gì báo một chữ của `src/lib/labels.ts` không còn mã nào dùng                                                                                                         | Đúng, và cả trên nhánh chính: ba chữ mẫu (`sampleFirstBody`, `sampleSecondBody`, `sampleNewBody`) không mã nào dùng, cổng xanh                                                                                     | `unused-words-unflagged` (mới)                                                     |
| Hai câu của trạng thái trống thành sai sau khi có thao tác mới mà mọi phép kiểm vẫn xanh                                                                                   | Đúng: tác tử ghi dòng ngày 2026-11-18 vào sổ lỗi lọt của bản sao rồi sửa hai câu. Lỗi chỉ có trên bản sao, nên sổ lỗi lọt của kho này không thêm dòng                                                              | `post-action-rules-uncheck` (đã có)                                                |
| 3 trên 9 chỗ phải đoán được tự quyết mà không xếp câu, và không phép kiểm nào bắt                                                                                          | Đúng: sáu câu trong `design/waiting/` của bản sao, không câu nào hỏi hình dạng khái niệm mới, việc màn «Quá hạn» nhận thao tác mới, hay vị trí màn mới trong điều hướng                                            | `decide-ask-trusts-the-agent-to-ask` (đã có)                                       |

## Còn thiếu gì để đóng giai đoạn 8

- **Dòng 1:** không còn thiếu về lệnh. Phép phát lại ở trên là điều
  [`ledgers-on-a-reference-copy.md`](ledgers-on-a-reference-copy.md) ghi là chưa thử. Một PR dựng màn thật ở repo kiểm
  chứng vẫn là bằng chứng mạnh hơn, khi có.
- **Dòng 3:** không còn thiếu về lệnh. Lần 11 là một lượt, trên ứng dụng mẫu; 3 trên 9 chỗ phải đoán không vào hàng
  chờ, và không phép kiểm nào bắt được điều đó.
- **Việc theo sau lần 11**, đã làm ngày 2026-11-18 theo mục «Sau khi chạy» của [`README.md`](README.md): bảy điều đã
  kiểm và mỗi điều có dòng sổ giới hạn (bảng ở mục lần 11). Chưa điều nào được sửa; mục gác lại của `docs/plan/plan.json`
  giữ chúng cho giai đoạn 5.

## Còn chưa đo

- Phép so trên 40 PR dùng lệnh của kho này, không dùng bản công cụ của Inventory ở từng commit. Bản đồ thay đổi thì
  đọc từ chính commit được đưa về, nên 37 PR trước lần nhận 0.7.0 được đo khi chưa có bản đồ.
- Chưa đo trên repo thứ ba.
