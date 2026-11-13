# Chạy thử bằng tác tử độc lập

Đã chạy chín lần tới ngày 2026-11-13, lần nào cũng tìm ra lỗi mà bài kiểm trên kho giả không thấy.
Tốn token, nên hỏi chủ repo trước mỗi lần.

Sáu lần đầu mỗi lần một đề khác nhau, nên các con số không so được với nhau. Từ lần bảy, mỗi vai
chạy **đề chuẩn** cố định trong `briefs/`, và kết quả ghi vào `results.tsv` thành một chuỗi số.

## Ba vai

| Vai      | Đề chuẩn           | Chạy trên                                          | Đo cái gì                        |
| -------- | ------------------ | -------------------------------------------------- | -------------------------------- |
| Dẫn dắt  | `briefs/guide.md`  | Bản sao repo này ở `e56e77c` (trước khi có plugin) | Cuộc dẫn dắt đi trọn được không  |
| Nhận     | `briefs/adopt.md`  | Bản sao repo này ở `main`                          | Nhận mà không đổi gì của repo    |
| Dựng màn | `briefs/screen.md` | Bản sao repo này ở `main`, đã xoá phần cấm đọc     | **Tác tử còn phải đoán mấy chỗ** |

Vai dựng màn đo đúng mục đích của plugin, nên nó là vai quan trọng nhất. Hai vai kia đo rằng cuộc
dẫn dắt và đường nhận chưa hỏng.

## Hai loại đề

- **Đề chuẩn** nằm trong `briefs/`, không đổi giữa các lần. Nó cho chuỗi số so được với nhau. Sửa
  một đề chuẩn là cắt chuỗi: ghi ngày sửa vào `results.tsv` và không so hai bên của vết cắt.
- **Đề dò** viết mới mỗi lần, nhắm vào đúng phần vừa dựng từ lần trước. Nó tìm lỗi mới. Đề dò
  không vào `results.tsv`; điều nó tìm ra thì vào sổ lỗi lọt hoặc sổ giới hạn. Đề dò đã chạy được
  giữ trong `probes/`, tên tệp mở đầu bằng số lần chạy.

Một lần chạy thử đầy đủ gồm ba vai chạy đề chuẩn, cộng một đề dò cho phần mới nhất.

**Đề chuẩn của vai dựng màn giữ chỗ cho chính nó.** Việc nó yêu cầu — một màn cho các mục đã cất
đi — không bao giờ được dựng thật trong repo đối chứng. Dựng rồi thì lần sau tác tử chỉ đọc lại
bài làm sẵn, và con số mất nghĩa. Repo đối chứng cần màn thứ hai thì chọn việc khác.

## Dựng bản sao

- Bản sao đặt ở thư mục tạm của phiên, không bao giờ trong repo này.
- Repo trước khi có plugin: clone repo này rồi checkout `e56e77c`, nối `node_modules` bằng liên kết.
- Repo đối chứng bên ngoài: clone, rồi chỉ chép riêng `node_modules/tailwindcss/theme.css`;
  **không** nối `node_modules` của repo đó.
- Bản sao cho vai dựng màn: xoá `plugins/`, `wiki/`, `docs/`. Tác tử chỉ được đọc `AGENTS.md`,
  `CLAUDE.md`, `.claude/rules/`, `design/`, `src/`, `tests/`.
- Không sửa plugin trong lúc tác tử còn đọc nó.
- Ba tác tử chạy song song dùng chung cổng kiểm trình duyệt: mỗi lệnh `make check` bọc trong một
  khoá bằng thư mục (`mkdir` trước, `rmdir` sau).

## Câu trả lời của người

Nằm trong `answers/`, mỗi câu một tệp. Phiên điều phối mở từng tệp một và dán cho tác tử đúng lúc
nó hỏi; tác tử không bao giờ được đường dẫn tới thư mục này.

Câu trả lời viết bằng lời thường của người, không bằng chữ cái hay giá trị. Đó là một phần của
phép đo: cuộc dẫn dắt phải tự đổi lời thành giá trị trên bảng mẫu.

Tác tử hỏi một câu chưa có tệp thì phiên điều phối trả lời theo giọng các câu đã có, rồi ghi câu
đó thành tệp mới ngay sau lần chạy. Lần bảy thêm theo cách này cả bốn câu của vai nhận, ba câu
cuối của vai dẫn dắt và câu thứ hai của vai dựng màn; từ lần tám, chúng là câu niêm phong như các
câu kia.

## Ghi kết quả

Mỗi vai một dòng trong `results.tsv`, thêm ngay sau lần chạy. Cột trống nghĩa là không áp cho vai
đó.

| Cột        | Nghĩa                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| `trial`    | Số thứ tự lần chạy                                                           |
| `date`     | Ngày chạy                                                                    |
| `role`     | `guide`, `adopt` hay `screen`                                                |
| `brief`    | `standard` hay `ad-hoc` (sáu lần đầu đều là `ad-hoc`)                        |
| `coverage` | Số câu lõi có lời đáp lúc xong, trên tổng                                    |
| `gate`     | `green` hay `red` lúc tác tử nói xong                                        |
| `guesses`  | Số chỗ tác tử phải tự quyết vì không luật nào nói. **Số chính của phép đo.** |
| `asks`     | Số lần tác tử dừng lại hỏi người                                             |
| `escapes`  | Số dòng tác tử thêm vào sổ lỗi lọt                                           |
| `note`     | Một câu, hoặc trống                                                          |

Cách đếm `guesses`: một chỗ tính là một lần tác tử phải chọn giữa hai cách hợp lệ mà không trang
luật, trang kiểu màn hay trang hành vi nào nói chọn cách nào. Tác tử tự khai trong báo cáo của nó;
phiên điều phối kiểm lại từng chỗ trước khi ghi, vì báo cáo của tác tử là báo cáo, chưa phải bằng
chứng.

## Sau khi chạy

1. Kiểm lại từng điều tác tử báo, trên chính bản sao của nó, trước khi sửa gì.
2. Lỗi rõ thì sửa, rồi thử lại đúng chỗ đó.
3. Điều không sửa lần này thì thành một dòng trong `plugins/design-assembly/references/limits.json`.
4. Lỗi lọt qua mọi lệnh kiểm thì thành một dòng trong `design/escapes.md` trước khi sửa.
5. Viết một mục vào đề bài `wiki/specs/0001-design-system-for-claude-code.md`.
