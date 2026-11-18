# Ba dòng «done when» của giai đoạn 8, chạy bằng lệnh

Chạy ngày 2026-11-18, sau khi mục 8.4 đóng. Kế hoạch chỉ cho đóng giai đoạn 8 khi mỗi dòng «done when» được chứng bằng
một lệnh. Trang này ghi lệnh nào đã chạy và mỗi dòng đứng ở đâu. Kết luận: dòng 1 và dòng 2 chứng được, dòng 3 mới
chứng được một nửa, nên giai đoạn 8 chưa đóng. Nửa sau của dòng 1 chứng bằng một phép phát lại, thêm cùng ngày.

## Chạy trên gì

- **Ứng dụng mẫu:** kho này ở `86ea3bc`.
- **Repo kiểm chứng:** một bản sao của Inventory ở `bd32d73e` (sau PR 86 của nó), đặt trong thư mục tạm của phiên. Gói
  cài của Inventory được nối vào bản sao bằng một liên kết, không nằm trong chỉ mục của bản sao.
- Không lệnh nào ghi vào Inventory thật: `git status` ở đó rỗng trước và sau.

| Dòng «done when»                                                                 | Kết quả                                |
| -------------------------------------------------------------------------------- | -------------------------------------- |
| 1. Số PR chạm hai sổ về 0, và mỗi PR chỉ chạm mảnh sổ của chính nó               | Đạt; nửa sau bằng phép phát lại        |
| 2. Lệnh bản đồ màn chọn đúng màn bị ảnh hưởng, và trả trọn bộ khi không lần được | Đạt                                    |
| 3. Một lượt dựng màn không hỏi giữa chừng; tường chặn tới khi có lời đáp         | Tường đạt; lượt dựng màn chưa được thử |

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

**Chưa chứng được: một lượt dựng màn không hỏi chủ repo giữa chừng.** Lần chạy thử vai dựng màn gần nhất là lần 10,
ngày 2026-11-13, trước khi có 8.3. Chưa lượt dựng màn nào chạy với hàng chờ. Công cụ cũng chỉ tin tác tử tự đưa câu
vào hàng chờ (giới hạn `decide-ask-trusts-the-agent-to-ask`), nên không lệnh nào ở trên thay được một lượt thật.

## Còn thiếu gì để đóng giai đoạn 8

- **Dòng 1:** không còn thiếu về lệnh. Phép phát lại ở trên là điều
  [`ledgers-on-a-reference-copy.md`](ledgers-on-a-reference-copy.md) ghi là chưa thử. Một PR dựng màn thật ở repo kiểm
  chứng vẫn là bằng chứng mạnh hơn, khi có.
- **Dòng 3:** một lần chạy thử vai dựng màn bằng tác tử độc lập, trên bản sao, đếm số lần nó hỏi giữa chừng và số câu
  nó đưa vào hàng chờ. Lần chạy thử tốn token, nên hỏi chủ repo trước.

## Còn chưa đo

- Phép so trên 40 PR dùng lệnh của kho này, không dùng bản công cụ của Inventory ở từng commit. Bản đồ thay đổi thì
  đọc từ chính commit được đưa về, nên 37 PR trước lần nhận 0.7.0 được đo khi chưa có bản đồ.
- Chưa đo trên repo thứ ba.
