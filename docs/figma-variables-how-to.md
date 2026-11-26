# Mang biến của Figma vào Design Assembly: cách làm hôm nay

Trang này ghi cách làm bằng tay với plugin như nó đang có (0.69.0), theo lượt thử ngày 2026-11-26
([`trials/figma-variables-hands-on.md`](trials/figma-variables-hands-on.md)). Plugin chưa có phích Figma. Việc dựng phích
ấy là đề bài [0018](../wiki/specs/0018-figma-at-the-foundations-socket.md), chủ repo duyệt ngày 2026-11-26 và chọn lối 1
(tệp `.fig`) làm lối đi trước; chưa gì được dựng.

Ba điều không đổi, lối nào cũng vậy:

- **Sổ thắng.** Thứ lấy từ Figma chỉ là một hướng ứng viên. Giá trị nào ngược sổ thành một câu hỏi cho chủ repo.
- **Không gì của repo đi ra Figma.** Mọi lối dưới đây chỉ đọc.
- **Thử trên `--dry-run` trước.** Lệnh thật chỉ ghi câu hỏi vào `design/waiting/`, không ghi sổ hay stylesheet.

## Chọn lối nào

| Anh có gì                                     | Lối                        | Cầu `bring-in` hôm nay                                  |
| --------------------------------------------- | -------------------------- | ------------------------------------------------------- |
| Quyền lưu tệp về máy (File › Save local copy) | 1. Tệp `.fig`              | đọc được, đủ collection, mode và alias; có ba lỗ hổng   |
| Chỉ mở được tệp trong Figma                   | 2. Nút xuất biến của Figma | đọc từng tệp một, mất tên mode; thường từ chối          |
| Chỉ có phiên Claude đã nối Figma              | 3. Máy chủ MCP             | không đọc được như công cụ trả; phải chuyển tay bảy chỗ |
| Ghế Full trong một tổ chức gói Enterprise     | 4. REST API biến           | đọc được như lối 1; chưa thử, không tài khoản nào ở đây |

Lối 1 là lối duy nhất đã chạy trọn trên một tệp thật mà không phải tự quyết chỗ nào.

## Lối 1: tệp `.fig`

Không tốn lượt gọi Figma, không cần mạng lúc đọc.

1. **Lấy tệp.** Trong Figma, mở tệp rồi chọn Main menu › File › Save local copy. Để tệp ngoài repo.
2. **Xuất biến.** Tệp `.fig` là định dạng nhị phân. Công cụ đã thử là design-os-studio
   (github.com/jangtrinh/design-os-studio), mã của bên thứ ba, giấy phép PolyForm Shield.
   - Lệnh của họ, theo README và mã: `designos tệp.fig --export-variables biến.json --format figma-rest`.
   - Lượt thử không chạy chính lệnh ấy. Nó build riêng crate `designos-fig` và gọi hai hàm lệnh ấy dùng, `import_fig` rồi
     `export_variables_json`. Cần Rust 1.93.1; build mất khoảng hai phút rưỡi.
   - Kết quả là một tệp JSON có `meta.variables` và `meta.variableCollections`: đúng hình dạng cầu đọc.
3. **Chạy thử.** `node plugins/design-assembly/scripts/bring-in.mjs --from biến.json --target <repo> --dry-run`. Loại
   được đoán là `variables`.
4. **Đọc kết quả.** Lệnh in màu và token nó lấy màu từ đó, thang chữ, bo góc, font, rồi từng dòng `computed` và
   `not read`.
5. **Chạy thật** (bỏ `--dry-run`) khi kết quả hợp lý. Mã thoát 1 nghĩa là có câu hỏi chờ chủ repo, không phải lỗi.
6. **Trả lời** qua `/design-assembly:decide`. Câu hỏi khuyến nghị giữ giá trị của sổ.

**Phải tự soát, vì cầu chưa làm** (ba mục gác lại trong `docs/plan/plan.json`):

- **Alias sang collection khác.** Dòng `not read: … names no token` thường là một alias trỏ sang collection có mode tên
  light hay dark. Giá trị ấy không vào ứng viên.
- **Tên trùng giữa các collection.** Cầu giữ bản đọc sau cùng và không báo. Trước khi tin màu hay bo góc cầu chọn, xem
  tên ấy có ở mấy collection. Tệp dùng thư viện ngoài thường có nhiều collection là bản sao ẩn (`remote: true`).
- **Biến đúng/sai.** Mỗi biến một dòng `not read`. Bỏ qua được: ổ nền không dùng chúng.

Cầu chỉ lấy bốn điều cho ứng viên: màu gốc (token tên `primary`, `brand` hay `accent`), thang chữ, tỉ lệ thang và bo góc.
Khoảng cách, chiều cao control và các trục mode ngoài sáng và tối không vào đâu.

## Lối 2: nút xuất biến của Figma

Figma xuất biến ra tệp `.tokens.json` theo chuẩn DTCG, mỗi tệp một collection và một mode. Tính năng mở dần từ cuối
2025; chưa kiểm tài khoản của nhóm đã có chưa.

1. Trong bảng biến của Figma, xuất collection cần lấy.
2. Chạy `bring-in.mjs --from <tệp>.tokens.json --target <repo> --dry-run`. Loại được đoán là `tokens`.

Hôm nay lối này hẹp:

- Cầu đọc mỗi lần một tệp, và bỏ qua tên mode ghi trong tệp. Không có sáng và tối cùng lúc.
- Cầu từ chối (mã 2) khi collection ấy không có màu tên `primary`, `brand` hay `accent`. Hệ nào để màu gốc ở một
  collection riêng thì gặp ngay điều này.

Chỉ dùng khi một collection, một mode đã đủ cả màu gốc lẫn cỡ chữ và bo góc.

## Lối 3: máy chủ MCP của Figma

Chỉ nên dùng để nhìn nhanh một khung, không để mang hệ vào.

- **Cần:** phiên đã đăng nhập Figma, và một đường dẫn có `node-id` của một **khung**. Công cụ không nhận trang.
- **Tốn:** mỗi lượt gọi trừ vào hạn mức của ghế. Ghế View hay gói starter có rất ít lượt một tháng.
- **Gửi đi:** khoá tệp và id nút. Không gì của repo.
- **Chỉ gọi công cụ đọc:** `whoami`, `get_metadata`, `get_variable_defs`. Không bao giờ gọi công cụ ghi (`use_figma`,
  `create_*`, `generate_*`, `send_*`, `upload_*`).

`get_variable_defs` chỉ trả biến mà khung ấy dùng, đã giải cho mode đang đặt trên khung, tên theo cú pháp mã
(`hsl(var(--primary))`), không collection, không mode, không alias. Cầu không đọc được kết quả ấy. Muốn đưa vào cầu phải
chuyển tay bảy chỗ, liệt kê ở trang lượt thử; ba chỗ trong đó không có cách đúng nào đọc ra được từ dữ liệu.

## Lối 4: REST API biến

`GET /v1/files/:key/variables/local` trả đúng hình dạng cầu đọc. Trang của Figma ghi API này chỉ mở cho ghế Full trong
tổ chức gói Enterprise, khách không dùng được. Ai có quyền ấy thì lưu thân phản hồi thành tệp JSON rồi làm từ bước 3 của
lối 1. Token của Figma không bao giờ ghi vào repo.

## Chưa biết

- Ghế View có Save local copy được không.
- Đọc `.fig` bằng giải mã ngược có hợp điều khoản của Figma không.
- Giấy phép PolyForm Shield cho phép dùng design-os-studio tới đâu trong việc này.
- Bản xuất của lối 2 ghi alias sang collection khác thế nào.
