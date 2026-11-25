# Mobbin đo ở ổ tham khảo (mục 10.2, phích thứ tư): một lượt dừng giữa chừng

Một lượt, ngày 2026-11-25, từ 09:33 tới 09:41. Chủ repo cho đo («Đo Mobbin xong rồi tạm đóng hạng mục này.»), sau khi
phiên điều phối nói Mobbin gửi chữ tìm tới dịch vụ Mobbin dưới tài khoản của chủ repo, và ổ tham khảo không có phích
nào của plugin để so. Bản quyết định đi kèm: [0109](../../wiki/decisions/0109-mobbin-measured-at-the-reference-socket.md).

**Cả hai nhánh dựng bị dừng trước khi xong**, vì token đã sát trần của phiên điều phối. Bốn thước dưới đây được đọc từ
những gì mỗi nhánh để lại trên đĩa. Mỗi con số có ghi nó cho thấy được gì và không cho thấy được gì.

## Ổ không có phích của plugin

Ổ tham khảo gom sản phẩm thật để nhìn trước khi chọn, ghi một dòng sổ nguồn có ghim, và chủ repo quyết giữ tham khảo
nào. Nó không có phích nào của plugin (dòng giới hạn `capability-reference-has-no-plug`).

Nên «thắng phích của plugin» ở ổ này nghĩa là thắng **plugin như hiện có**, tức không gom tham khảo nào trước câu chọn.
Nhánh đối chứng là đúng điều ấy. Một phích ngoài thắng khi việc nó thêm vào giữ được quyết định tốt hơn, hoặc làm người
dùng đoán ít hơn. Nó không thắng chỉ vì ổ trống.

## Cách làm

- **Đề:** [`briefs/reference.md`](briefs/reference.md), viết mới cho lượt này.
  - Ứng dụng mẫu cần một màn thứ hai: lịch sử thay đổi của một mục, tức ai đổi gì, lúc nào.
  - Việc là chuẩn bị câu chọn cách bày màn cho chủ repo: hai tới bốn cách, một khuyến nghị.
  - Câu hỏi hỏi theo lối của repo, rồi dừng: không tự đáp, không dựng màn.
  - Hai nhánh chỉ khác phần «References».
- **Hai bản sao bỏ đi** của kho này ở `d3be68a` (plugin 0.58.0), dựng bằng `git archive` trong thư mục nháp.
  - Bỏ `plugins/`, `docs/`, `wiki/decisions/`, `wiki/specs/`, `tests/plugin-*`, `mk/plugin.mk` và `mk/plan.mk`, cùng
    các dòng của `wiki/index.md` và `wiki/log.md` trỏ tới chúng.
  - `node_modules` chép bằng `cp -cR`.
  - Mốc đầu của cả hai: `make check` xanh, 80 phép kiểm trình duyệt.
  - Cổng xem trước của mỗi bản sao lấy từ tên thư mục: 4650 và 4541, không phải 4173 của lượt thử 19.
- **Plugin cho tác tử:** bản của `d3be68a`, đặt ngoài bản sao.
- **Hai tác tử mới** (general-purpose), không biết gì về các lượt trước, chạy song song:
  - **Nhánh P (plugin như hiện có):** không công cụ tham khảo nào, cấm dùng web hay Mobbin.
  - **Nhánh M (qua Mobbin):** tìm qua máy chủ MCP của Mobbin, chỉ đọc, nhiều nhất ba lần. Chỉ gửi `query`, `platform`,
    `limit` (8 trở xuống) và `mode`; không gửi `task_intent`, `output_tool`, `output_destination`. Rồi giữ tham khảo theo
    lối repo giữ một nguồn ngoài có ghim.
- **Giữ trần:** một vòng kiểm chạy nền mỗi phút cộng token của hai tác tử, ngưỡng 430 nghìn cho cả hai.
  - Lúc 09:40 hai tác tử đã tới 437 197, cộng phiên này khoảng 190 nghìn.
  - Phiên này dừng cả hai lúc 09:41.
- **Dừng ở đâu:**
  - Nhánh P vừa viết xong câu hỏi, trang quyết định và dòng wiki, và vừa gọi `make check`.
  - Nhánh M đã viết xong mọi tệp và đang đọc một tệp lớn, trước lần `make check` đầu.
  - Báo cáo của hai tác tử (số chỗ tự quyết, lỗi không phép kiểm nào bắt) không còn.
- **Sau khi dừng:** theo lời phiên điều phối, không tác tử mới, không tìm thêm, không dựng lại nhánh nào. Phiên này chỉ
  chạy cổng trên hai bản sao như đang có, và thử ghim trên một bản chép của bản sao nhánh M.

## Ba lần tìm, đúng từng chữ

Cả ba qua máy chủ MCP của Mobbin, dưới phiên đã đăng nhập của chủ repo. Không lần nào hỏi đăng nhập, gói trả tiền hay
điều gì phải chấp nhận. Không lần gọi nào ghi vào tài khoản: không `save_content`, `create_collection` hay `add_comment`.

| Giờ      | Công cụ          | Trường đã gửi                                                                                      | Về                                                                                  |
| -------- | ---------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 09:37:40 | `search_screens` | `query`: «record change history activity log», `platform`: web, `limit`: 8, `mode`: deep           | 8 màn: Basecamp, Xero, 7shifts, Deputy, Productboard, Google Ads, Aboard, 1Password |
| 09:37:55 | `search_screens` | `query`: «version history timeline with changed fields», `platform`: web, `limit`: 6, `mode`: deep | 6 màn: Snowflake, Linear, Customer.io, Adaline, Aboard, Toggl Track                 |
| 09:38:12 | `search_flows`   | `query`: «viewing the change history of a record», `platform`: web, `limit`: 4                     | 4 luồng: Productboard, Pinterest, Mixpanel, Intercom                                |

18 kết quả, kèm ảnh xem trước. Ảnh được lưu ở thư mục kết quả công cụ của phiên Claude trên máy này, ngoài repo. Tác tử
giữ 11 tham khảo.

## Thước 1: giữ được không

| Đo gì                                     | Nhánh P                                  | Nhánh M                                                                                                                                                                                                                                       |
| ----------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Câu hỏi trên hàng chờ                     | `pattern-lich-su`, mục `pattern:lich-su` | `screen-item-history-kind`, mục `screen:item-history:kind`, `hard_to_undo: true`                                                                                                                                                              |
| Tham khảo được giữ                        | không có                                 | dòng sổ nguồn `mobbin-change-history`: `kind: reference`, `plug: mobbin`, ghim `fetched_at` 2026-11-25 cùng `sha256` của `results.json`, danh mục 11 tham khảo có đường dẫn Mobbin                                                            |
| Plugin hiểu dòng ấy là gì                 | không áp dụng                            | Loại `reference` không có nghĩa trong plugin, nên dòng ấy được đọc như một thư viện để lấy khối: `find` xếp nó ở bậc 4 của thang cho một nhu cầu linh kiện                                                                                    |
| Chủ repo quyết giữ tham khảo nào          | không áp dụng                            | Không: câu hỏi hỏi cách bày, không hỏi giữ tham khảo nào; tác tử tự giữ 11 trên 18                                                                                                                                                            |
| Sửa bản chụp đã ghim                      | không áp dụng                            | Trên một bản chép: thay `results.json` thì cổng vẫn xanh, chỉ `find` nói tệp khác ghim (dòng giới hạn có sẵn `library-pin-not-held-by-the-gate`)                                                                                              |
| **Cổng của bản dựng dở** (phiên này chạy) | **xanh**                                 | **đỏ**: `wiki-lint` không tìm thấy liên kết `../entities/item.md` của trang quyết định; bỏ lỗi ấy thì `make design-assembly` chỉ đòi viết lại các tệp xuất. Trên bản chép, sau `make design-exports`, cổng thiết kế xanh với dòng sổ nguồn ấy |

Hai ô cổng là cổng của một bản dựng chưa xong, không phải kết quả của nhánh nào. Nhánh M có thể đã sửa lỗi liên kết ở
vòng `make check` đầu, nhưng nó bị dừng trước vòng ấy.

**Thước này cho thấy được:** sổ của plugin nhận một dòng tham khảo có ghim, và cổng không làm đỏ vì dòng ấy. Nhưng plugin
đọc dòng ấy sai, như một thư viện khối. Không gì giữ lời chủ repo về tham khảo nào được giữ. Ghim không được cổng giữ.
**Không cho thấy được:** nhánh M có qua cổng hay không, và một câu hỏi có ảnh tham khảo có giữ quyết định tốt hơn không.
Không có thắng.

## Thước 2: người dùng phải đoán mấy chỗ

- Không đếm được số chỗ tác tử tự quyết: báo cáo của cả hai không còn.
- Đọc từ câu hỏi để lại:
  - cả hai đưa ba cách (A, B, C) và khuyến nghị A, một bảng các lần đổi dựng từ thứ kho đã có;
  - câu của nhánh M trỏ tới trang quyết định có tham khảo của từng cách, nên chủ repo nhìn được sản phẩm thật thay vì đọc
    tả bằng chữ;
  - câu của nhánh P chỉ có chữ.
- Có một chỗ phải đoán chỉ nhánh M sinh ra: chọn giữ tham khảo nào. Tác tử tự giữ 11 trên 18, không hỏi.

**Thước này cho thấy được:** có tham khảo thì các cách được minh hoạ, nhưng lại thêm một chỗ máy quyết thay. **Không cho
thấy được:** số chỗ đoán của mỗi nhánh. Không có thắng.

## Thước 3: chạy được ở đâu

- Cần tài khoản Mobbin và mạng. Lượt này chạy dưới phiên đã đăng nhập của chủ repo, nên không kiểm được nó cần gói nào.
- Gửi đi: chữ tìm và ba trường `platform`, `limit`, `mode`, tới dịch vụ Mobbin.
- Công cụ còn mời gửi thêm `task_intent` (một câu tả việc đang làm) và `output_destination`. Lượt này cấm cả hai, và tác
  tử không gửi.
- Không mã, tệp hay hình nào của repo ra ngoài.

Mạng và tài khoản làm nó thành phích phụ theo luật của 0008.

## Thước 4: tốn bao nhiêu

Token đã xử lý (đầu vào cộng đầu ra cộng ghi bộ đệm, không kể đọc lại bộ đệm), cùng cách đếm của các lượt trước.

| Ai                                 | Token đã xử lý     | Ghi chú                                                  |
| ---------------------------------- | ------------------ | -------------------------------------------------------- |
| Tác tử nhánh P                     | 219 344            | khoảng 7,5 phút, dừng giữa chừng                         |
| Tác tử nhánh M                     | 236 989            | khoảng 7,5 phút, dừng giữa chừng; ba lần tìm mất 32 giây |
| Phiên này, tới lúc dừng hai tác tử | 203 718            |                                                          |
| **Tới lúc dừng**                   | **660 051**        | ước tính 400 tới 600 nghìn                               |
| Phiên này, phần viết bản ghi và PR | số cuối ở mô tả PR |                                                          |

Trần của phiên điều phối là 800 nghìn cho cả tác tử lẫn phiên. Phiên điều phối cho viết nốt bản ghi với giới hạn cứng
820 nghìn: tức cho vượt trần của nó khoảng 20 nghìn để giữ phần đã tiêu. Số cuối ở mô tả PR.

Mỗi tác tử tốn khoảng 86 nghìn token ở lượt gọi đầu, chỉ để ghi bộ đệm của lời nhắc hệ thống và các trang luật của máy
này. Đó là lý do hai tác tử chạm ngưỡng sau khoảng sáu phút.

## Điều lượt đo tìm ra

- **Dòng tham khảo bị đọc như thư viện khối.** Loại `reference` không có nghĩa trong plugin, nên `find` xếp nguồn ấy lên
  thang của nhu cầu linh kiện. Dòng giới hạn mới `reference-row-read-as-a-block-library`.
- **Chủ repo không được hỏi giữ tham khảo nào.** Ổ hứa chủ repo quyết điều này; không lệnh nào hỏi, và tác tử tự chọn.
  Dòng giới hạn mới `reference-kept-without-the-owners-pick`.
- **Ghim không được cổng giữ:** như đã thấy ở ReUI, dòng có sẵn `library-pin-not-held-by-the-gate`.
- Bản chép dùng để thử ghim nằm cạnh hai bản sao, ở thư mục `probe`.
