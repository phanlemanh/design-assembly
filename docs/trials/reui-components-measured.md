# ReUI đo ở ổ linh kiện, qua `intake` (mục 10.2, phích thứ hai)

Một lượt, ngày 2026-11-23, từ 22:08 tới 22:37. Chủ repo cho đo sau khi nghe quy trình, gửi gì đi đâu và ước tính («Đo
đủ, phần miễn phí»). Trước đó chủ repo hỏi bản quyền Pro đã cấu hình chưa: máy chủ MCP của ReUI đã nhận gói Pro qua lần
đăng nhập bằng trình duyệt, còn lệnh cài chưa có khoá ở đâu; lượt đo chỉ dùng phần miễn phí. Bản quyết định đi kèm:
[0096](../../wiki/decisions/0096-reui-measured-at-the-components-socket.md).

## Cách làm

- **Một nhu cầu cho cả hai nhánh:** lọc danh sách theo trạng thái và ngày (khoá `filter-by-status-and-date`). Ứng dụng
  mẫu hôm nay chỉ lọc theo tên; kho chưa có khối nào cho nhu cầu này.
- **Hai bản sao bỏ đi** của kho này tại `acf3d2a`, dựng bằng `git archive` trong thư mục nháp của phiên, theo cách của
  vai dựng màn trong [README](README.md): bỏ `plugins/`, `docs/`, bản quyết định, đề bài, `mk/plugin.mk` và
  `mk/plan.mk` (hai tệp này đọc thứ đã bỏ). Mỗi bản sao có `node_modules` riêng từ `npm ci`. Cả hai xanh ở mốc đầu.
- **Nhánh R (phích ngoài):** phiên này ghim ReUI làm nguồn ngoài, gọi `intake` của plugin lên bản sao, trả lời câu
  chọn ứng viên bằng tên đứng thay «Trial stand-in», chạy dòng cài, rồi ghi dòng sổ bằng `intake --file`.
- **Nhánh P (phích của plugin):** cùng lệnh `intake`, không nguồn ngoài nào, nên chỉ có «by-hand»; cùng tên đứng thay
  đáp giữ.
- **Rồi hai tác tử con**, mỗi tác tử một bản sao, cùng đề mới [`briefs/component.md`](briefs/component.md), chỉ khác
  một đoạn: nhánh R dùng khối có sẵn trong kho, nhánh P tự tạo khối. Không mạng, không cài gói, không gọi máy chủ MCP
  nào. Phiên này kiểm lại điều tác tử khai trên chính bản sao của nó trước khi đếm.
- **Gửi đi:** tới dịch vụ của ReUI qua máy chủ MCP, một câu tìm («filter a list by status and date», chỉ món miễn
  phí) và tên linh kiện `filters`. Tải từ reui.io tệp registry công khai của `filters` (không khoá) và các tệp lệnh cài
  kéo về; tải từ npm hai gói. Không gửi mã, tệp hay hình của kho; không nhập khoá hay giấy phép nào.

## Thước 1: giữ được không

| Đo gì                                         | Nhánh R (ReUI)                                                                                                                                                                                                                   | Nhánh P (tự tạo)                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Đường vào `intake`                            | Phải viết tay nguồn ghim, danh mục 27 món, bản chụp kèm `sha256`; không lệnh nào ghim                                                                                                                                            | Có sẵn: «by-hand» là ứng viên duy nhất                   |
| Chữ của nhu cầu tìm ra món                    | «filter status date» không ra gì; phải đổi sang chữ của danh mục («filter builder»)                                                                                                                                              | Không áp dụng                                            |
| Dòng cài                                      | Trước khi hỏi đã sửa `components.json` (thêm registry `@reui`), `package.json` (2 gói) và `package-lock.json`; rồi hỏi có ghi đè `button.tsx`, `input.tsx` của repo không; không ai đáp thì thoát 0, chưa chép tệp linh kiện nào | Không có                                                 |
| Thứ dòng cài đưa vào                          | 32 tệp, 19 383 dòng (25 tệp ReUI, 7 linh kiện nền mới), 2 gói npm, khai registry `@reui`                                                                                                                                         | 1 tệp khối 84 dòng, 78 dòng bài kiểm                     |
| Khối như được giao, trước khi ai dùng         | Cổng đỏ: 226 lỗi lint, 71 lỗi kiểu, 8 lỗi phép kiểm sàn, tệp chưa định dạng; mọi lỗi nằm trong tệp ReUI                                                                                                                          | Chưa có khối                                             |
| Cổng lúc tác tử nói xong (phiên này chạy lại) | Xanh, 88 phép kiểm trình duyệt                                                                                                                                                                                                   | Xanh, 80 phép kiểm trình duyệt                           |
| Sàn còn giữ khối không                        | Không: 16 tệp `@ts-nocheck`, 18 dòng tắt luật có lý do, một khối tắt luật trong cấu hình lint, cả thư mục ra khỏi bộ định dạng                                                                                                   | Có: mọi luật của sàn áp nguyên                           |
| Lỗi lọt qua cổng                              | 2: ô nổi không tên (tác tử sửa), câu tiếng Anh cho trình đọc màn hình (để lại)                                                                                                                                                   | 0                                                        |
| Dòng sổ                                       | Đủ nguồn, ghim, mã băm, do `intake` ghi; mã băm của 1 trên 32 tệp                                                                                                                                                                | Tác tử viết tay vì bản sao không có plugin; không mã băm |
| Sửa tệp chính sau lúc nhập                    | `inventory` báo «modified»                                                                                                                                                                                                       | Không so được (không mã băm)                             |
| Sửa một trong 31 tệp còn lại                  | Không gì báo                                                                                                                                                                                                                     | Không áp dụng                                            |
| Sửa bản chụp đã ghim                          | `find` báo bản chụp khác ghim; cổng vẫn xanh                                                                                                                                                                                     | Không áp dụng                                            |
| ReUI ra bản mới                               | Không gì báo: registry phục vụ bản mới nhất, dòng cài gọi `shadcn@latest` thay bản 4.23.0 repo ghim                                                                                                                              | Không áp dụng                                            |

Lần cài đầu có thoát 0, nhưng repo đã đổi: phiên này chạy `git diff` trên bản sao giữa lần cài đầu và lần cài thứ hai.
Nó cho thấy `components.json` có thêm registry `@reui`, `package.json` có thêm `@tanstack/react-virtual` và
`date-fns`, và `package-lock.json` cũng đổi. Nhật ký của lần cài đầu cũng ghi bước cài gói xong trước câu hỏi ghi đè.
Lần cài thứ hai đáp «no» cho cả hai câu, và chép 32 tệp.

Hai chỗ phiên này phải tự quyết khi ghim: bảo bộ định dạng chừa bản chụp ra (định dạng lại thì mã băm hỏng), và đổi chữ
của nhu cầu cho khớp danh mục. Thêm một bước phải nhớ: ghi một dòng sổ làm các tệp xuất cũ đi, nên cổng đỏ tới khi
chạy `make design-exports`; điều này xảy ra ở cả hai nhánh.

## Thước 2: người dùng phải đoán mấy chỗ

| Nhánh | Tác tử khai | Phiên này đếm | Bỏ ra và vì sao                                                                                                                                 | Câu lên hàng chờ | Vòng sửa |
| ----- | ----------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------- |
| R     | 32          | 26            | 6 chỗ chỉ có vì bản sao thiếu plugin và kế hoạch: viết hàng chờ tay, khoá mục, trang quyết định, dòng `Plan:`, liên kết nhật ký, lệnh định dạng | 4, viết tay      | 5        |
| P     | 21          | 17            | 2 chỗ chỉ có vì bản sao thiếu plugin (giá trị dòng sổ, giữ tệp hàng chờ); 1 về ngôn ngữ báo cáo; 1 trang kiểu màn đã nói                        | 0                | 2        |

Cùng một việc, nhánh R tự quyết nhiều hơn 9 chỗ. Sáu chỗ đầu của nhánh R chỉ có vì khối ReUI không qua cổng: tắt luật
sàn theo tệp, tắt luật React và TypeScript theo thư mục, `@ts-nocheck`, chừa khỏi bộ định dạng, định dạng 7 linh kiện
nền, ghi `changed` vào dòng sổ. Đó là quyết thay sàn: sàn không còn giữ hình của thanh lọc, hình ấy là của ReUI. Khoảng
80 câu chữ cho thanh lọc tác tử tự viết. Ngược lại, khối ReUI cho người dùng nhiều hơn: bốn điều kiện cho trạng thái
(là, không là, một trong, không thuộc), ba cho ngày, thẻ điều kiện.

Phiên này đã đối chiếu các căn cứ có thể đối chiếu: trang kiểu màn danh sách nói ô lọc chỉ hiện khi có mục; bảng thuật
ngữ nói «trạng thái» còn tiêu đề cột nói «Tình trạng»; phép kiểm sàn coi riêng `src/components/ui` là mã nhà cung cấp;
ô nổi của thanh lọc lúc giao không có tên; câu «Top level» nằm trong `cascader-i18n.tsx` như giao. Hai tác tử không
có người thứ hai đếm lại.

## Thước 3: chạy được ở đâu

- Tìm qua máy chủ MCP cần mạng. Theo tài liệu của ReUI, nó cần một tài khoản ReUI, kể cả cho phần miễn phí (đăng nhập
  bằng trình duyệt). Lượt này không kiểm được điều đó: mọi lần gọi đều đi dưới phiên chủ repo đã đăng nhập, nên không có
  lần gọi nào khi chưa đăng nhập để so.
- Dòng cài cần mạng: tệp từ reui.io, gói từ npm, và bản `shadcn` mới nhất từ npm. Phần miễn phí không cần khoá.
- Sau lúc cài, khối nằm trong repo và chạy không cần mạng.

## Thước 4: tốn bao nhiêu

| Ai              | Số công cụ báo | Token đã xử lý, không kể đọc lại bộ đệm | Kể cả đọc lại bộ đệm | Phút | Lần gọi công cụ | Gói mới | Dòng mã tác tử viết, kể cả bài kiểm |
| --------------- | -------------- | --------------------------------------- | -------------------- | ---- | --------------- | ------- | ----------------------------------- |
| Tác tử R        | 333 978        | 408 265                                 | 23 437 649           | 20,6 | 103             | 2       | 441, cộng khoảng 80 câu chữ         |
| Tác tử P        | 236 855        | 234 307                                 | 8 439 550            | 9,6  | 51              | 0       | 162                                 |
| Phiên điều phối | không có       | 175 454                                 | 22 004 821           |      |                 |         |                                     |
| **Cả lượt**     |                | **818 026**                             | **53 882 020**       |      |                 |         |                                     |

Cả lượt chạy khoảng 30 phút. Số công cụ báo cho một tác tử là cỡ ngữ cảnh ở lượt trả lời cuối của nó, không phải tổng
việc nó làm. Hai cột sau cộng từ nhật ký của từng tác tử và của phiên này, mỗi lượt trả lời một lần. Phần của phiên
điều phối tính từ lúc chủ repo cho đo tới lúc mở PR. Đọc tài liệu ReUI trước lời cho đo, theo câu hỏi của chủ repo,
không tính vào lượt: công cụ báo 72 424, đã xử lý 74 192.

## Vượt lời cho đo

Lời cho đo đi kèm ước tính khoảng 450 nghìn token cho cả lượt, trần 700 nghìn, và trần 300 nghìn cho một tác tử.

- **Cả lượt vượt trần.** Theo số đã xử lý, cả lượt tốn 818 026 token, vượt trần 700 nghìn và gần gấp đôi ước tính.
  Chỉ lấy số công cụ báo cho hai tác tử cộng phần của phiên điều phối thì đã là 746 287. Kể cả đọc lại bộ đệm thì tới
  khoảng 54 triệu. Cách đếm nào cũng vượt.
- **Tác tử R vượt trần của nó:** 333 978 theo số công cụ báo, 408 265 theo số đã xử lý.
- Phiên này không dừng được một tác tử đang chạy, và không có bộ đếm cho chính nó trong lúc chạy, nên chỉ biết các số
  này sau khi xong. Bản ghi đầu tiên chỉ nói tác tử R vượt; điều cả lượt vượt được thêm vào ngày 2026-11-24, sau khi
  soát.

## Lượt này không cho thấy

- Một nhu cầu, một linh kiện trên 27, mỗi nhánh một lượt. `filters` là một trong những món nặng nhất (kéo theo
  `cascader`); một món nhẹ hơn có thể qua sàn dễ hơn.
- Tác tử R không được gọi máy chủ MCP, nên các bước ReUI tự đề ra (`validate_usage`, `get_audit_checklist`) không chạy.
- Hai tác tử không gọi `intake` hay `decide`, vì bản sao không có plugin. Dòng sổ của nhánh P vì vậy viết tay và không
  có mã băm, nên phần «sau lúc nhập» chỉ so được ở nhánh R.
- Không lần gọi nào tới ReUI đi khi chưa đăng nhập. Việc cần tài khoản để tìm là theo tài liệu của ReUI, lượt này không
  kiểm.
- Không ai nhìn thanh lọc trong trình duyệt bằng mắt.
- Khối Pro không được đo.
- Số chỗ tự quyết là tự khai của tác tử, phiên này kiểm từng căn cứ đối chiếu được, chưa có người thứ hai đếm.
- Đề `briefs/component.md` mới, nên số của lượt này không vào `results.tsv`, chuỗi của ba vai cũ.

## Điều thấy thêm

- Câu tìm tự nhiên qua máy chủ MCP của ReUI đưa ví dụ `c-filters-5` lên đầu, không phải linh kiện `filters`.
- Lời nhắc sau khi cài nói thêm `TooltipProvider` vào `app/layout.tsx`, tệp của khung khác; repo này dùng Vite.
- Đường dẫn registry chuyển tới một địa chỉ có mã bản dựng (`?v=dpl_…`): đó là dấu bản gần nhất ReUI có, và không lệnh
  nào đọc nó.
- Phép kiểm sàn (`tools/design_guards.mjs`) coi riêng `src/components/ui` là mã nhà cung cấp, còn công cụ của plugin coi
  cả `ui` lẫn `reui` là thư viện. Tệp ấy là của Repo Standards.
- Nhật ký đầy đủ của tác tử, hai bản sao và các tệp đầu ra nằm trong thư mục nháp của phiên, không được giữ.
