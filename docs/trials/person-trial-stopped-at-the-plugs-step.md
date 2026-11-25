# Lượt thử có người, lần đầu: dừng ở bước plugs

Lần chạy thử 18, ngày 2026-11-25, cho mục 10.4: dòng «xong khi» của giai đoạn 10 (tiêu chí 13 của đề bài
[0014](../../wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md)). Chủ repo cho chạy hai nhánh dựng màn («Cho chạy
hai nhánh»), với ước tính 1,4 triệu token và trần 1,8 triệu. Lượt này dừng trước khi dựng xong hướng thiết kế, theo lời
chủ repo («Sửa trước»). Bản sửa đi kèm: [0108](../../wiki/decisions/0108-session-names-go-one-to-a-flag.md).

**Kết luận ngắn:**

- Bước plugs của `new` chạy một lần như trang skill bảo, và **không hỏi câu nào**.
- Tác tử gom tên của phiên vào ba biến, rồi truyền mỗi biến bằng một vòng lặp. Shell của phiên không tách một biến không
  có dấu nháy thành nhiều từ. Vì vậy mỗi cờ nhận một giá trị duy nhất là mọi tên nối nhau bằng dấu cách.
- Lệnh coi giá trị ấy là một tên, không khớp phích nào, rồi in «No outside plug that was measured is in this repository
  or this session; every socket keeps the plugin's plug.» và thoát 0. Nó không nói rằng nó không đọc được tên nào.
- Trên một bản sao bỏ đi, cùng các tên ấy, tách đúng: lệnh thoát 1 với hai câu, `plug-screen-build` và
  `plug-design-review`.
- Không nửa nào của dòng «xong khi» được cho thấy. Lượt thử sẽ chạy lại từ đầu sau khi bản sửa gộp.

## Bản sao, plugin, tác tử

- **Bản sao:** dựng như lượt 15 và 16. Clone kho này ở `e56e77c`, nhánh `main` tại chỗ, bỏ remote, xoá mọi nhánh và nhãn
  khác, xoá reflog, dọn kho. Còn đúng một commit. `node_modules` của bản checkout chính nối bằng liên kết, ghi vào
  `.git/info/exclude`. `make check` xanh ngay lần đầu: 25 bài đơn vị, 16 bài trình duyệt. Tệp cổng sinh ra được dời ra
  ngoài bản sao.
- **Plugin:** `git archive` của `plugins/design-assembly` ở `3cfa8d7` (plugin 0.57.0), bung cạnh bản sao. Dấu băm cây git
  của thư mục bung ra là `ef685b9`, trùng cây `3cfa8d7:plugins/design-assembly`.
- **Đề:** [`briefs/guide.md`](briefs/guide.md) nguyên văn, rồi bốn câu lời thêm của lượt 15 và 16, chỉ đổi tên lượt.
- **Tác tử:** một tác tử con mới, kiểu `general-purpose`, mọi lượt trả lời của `claude-opus-5-5`. Nó không biết gì về
  các lượt trước.

## Lượt chạy

| Giờ (UTC)        | Việc                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| 23:39:03         | Tác tử nhận đề                                                                          |
| 23:39:59         | Bước plugs, lần gọi duy nhất (mục kế)                                                   |
| 23:40:31         | Dừng ở câu mức accessibility; đáp bằng câu niêm phong 02                                |
| 23:42:01         | Dừng ở câu nguyên tắc; đáp bằng câu 16                                                  |
| 23:42:44         | Dừng ở câu hướng thiết kế (A, B, C trên bảng mẫu); đáp bằng câu 17                      |
| 23:44:05         | Dừng ở câu màu sau một vòng `--around` (G, A, E, B). Không đáp: phiên điều phối bảo giữ |
| 2026-11-25 01:20 | Lời chủ repo «Sửa trước» tới; lượt dừng hẳn, tác tử không nhận thêm lời nào             |

Ba lời đáp đều dán nguyên văn câu niêm phong, không thêm chữ. Không câu nào về phích được hỏi, nên không câu nào được gửi
cho chủ repo.

## Bước plugs: tác tử truyền gì, lệnh in gì

Trang skill `new` (mục «Then the plugs, once») bảo truyền `--skill <name>` cho mỗi skill phiên liệt kê, `--server <name>`
cho mỗi server, `--needs-sign-in <name>` cho mỗi server chờ đăng nhập. Tác tử viết ba chuỗi:

- 35 skill, trong đó `frontend-design`, `frontend-design:frontend-design`, `design:design-critique`,
  `design:accessibility-review`, `design:ux-copy`;
- 25 server, trong đó `mobbin`, `reui`, `open-design`;
- 14 server chờ đăng nhập, trong đó `plugin:product-management:figma`.

Rồi nó dựng mảng đối số bằng `for s in $SK; do ARGS+=(--skill $s); done`. Shell của phiên giữ biến không có dấu nháy
nguyên một từ, nên mảng chỉ có ba cặp: `--skill`, `--server`, `--needs-sign-in`, mỗi cờ một chuỗi dài. Lệnh in:

```text
Plugs: 20 sockets: 2 are closed, 8 have only the plugin's plug, 10 have plugs from outside, 7 of them a measured one.
No outside plug that was measured is in this repository or this session; every socket keeps the plugin's plug.
```

Lệnh thoát 0, không ghi gì. Tác tử báo cho người đúng như dòng ấy rồi đi tiếp các tầng.

**So với điều phiên liệt kê.** Bản ghi của tác tử có danh sách skill của phiên: khoảng 260 mục. Tác tử chọn 35 mục mà nó
cho là gần việc thiết kế, không truyền cả danh sách. Các server có công cụ trong phiên khớp 25 tên nó truyền, cộng các
server của ứng dụng. Như vậy dòng giới hạn `plugs-session-listed-by-the-skill` vẫn mở: lượt này không cho thấy danh sách
được truyền đủ.

**Kiểm trên bản sao bỏ đi.** Kiểm trên một clone của bản sao, không trên bản sao của tác tử. Cùng các tên ấy, mỗi tên
một cờ, lệnh thoát 1 với hai câu:

- `plug-screen-build`: khuyến nghị phích của plugin (`rules-page`), dựa trên quyết định 0097;
- `plug-design-review`: khuyến nghị phích của plugin (`review`), dựa trên quyết định 0073.

Nó cũng in một dòng nói `reui` có trong phiên mà chưa được ghim làm nguồn. Phiên điều phối dựng lại lỗi trên bản sao của
nó. Lệnh nhận một chuỗi nhiều tên mà không nói gì, và khớp gì tuỳ tên cuối của chuỗi: một chuỗi kết bằng
`design:design-critique` cho riêng câu ổ soát màn.

## Dừng

Chủ repo được hỏi «Dừng lượt này để sửa lỗi rồi chạy lại từ đầu, hay chạy tiếp lượt đang dở?» và đáp «Sửa trước». Lượt
dừng ở câu màu. Bản sao, bản ghi của tác tử và bằng chứng được giữ nguyên chỗ, trong thư mục nháp của phiên chạy thử
(`trial-18/`).

## Chi phí

Đếm như lượt 17: cỡ ngữ cảnh của lần gọi mô hình cuối, cộng chữ mô hình viết ra ở mọi lần gọi. Lần gọi công cụ là khối
`tool_use`, khối trùng mã chỉ đếm một lần.

| Ai                  | Token                                                                    | Lần gọi công cụ | Thời gian                        |
| ------------------- | ------------------------------------------------------------------------ | --------------- | -------------------------------- |
| Tác tử dẫn dắt      | 175 992 (ngữ cảnh cuối 161 570, viết ra 14 422)                          | 17              | 5 phút 2 giây; 23:39:03–23:44:05 |
| Phiên chạy thử      | 108 307 (ngữ cảnh từ 139 517 lên 228 238 trong lượt này, viết ra 19 586) | 35              | 23:35:48–23:44:08, rồi chờ       |
| **Cả lượt đã dừng** | **284 299**                                                              |                 |                                  |

Con số của phiên chạy thử chỉ tính phần ngữ cảnh tăng thêm trong lượt này. Lúc nhận việc, phiên đã mang 139 517 token
ngữ cảnh của việc trước. Phần sửa lệnh không tính vào đây. Lượt chạy lại sẽ đặt con số này bên cạnh con số của nó.
