---
type: spec
title: Figma ở ổ nền — biến của một tệp Figma thành hướng ứng viên, đọc từ tệp người mang tới
status: approved
tier: 1
links:
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0069-the-capability-table-and-its-checks.md
  - wiki/decisions/0088-claude-design-system-measured-on-four-measures.md
  - wiki/decisions/0091-bring-in-reads-an-outside-source-into-a-candidate-direction.md
  - wiki/decisions/0109-mobbin-measured-at-the-reference-socket.md
sources:
  - docs/plan/plan.json
  - docs/trials/figma-variables-hands-on.md
  - docs/figma-variables-how-to.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/plugs/
  - plugins/design-assembly/scripts/bring-in.mjs
  - plugins/design-assembly/scripts/outside-tokens.mjs
  - plugins/design-assembly/skills/bring-in/SKILL.md
  - plugins/design-assembly/skills/plugs/SKILL.md
  - plugins/design-assembly/tests/test-bring-in.mjs
  - "chủ repo, 2026-11-26: «Ghi ba lỗ hổng vào parked, ghi cách thức để làm với figma sau đó lập cách thức và kế hoạch cho nó nối vào design assembly trình cho tôi»"
  - "chủ repo, 2026-11-26: «Duyệt cả bảy nhưng chọn đường file .fig», đáp câu «Anh duyệt đề bài 0018 theo khuyến nghị cả bảy câu?»"
---

# 0018 Figma ở ổ nền — biến của một tệp Figma thành hướng ứng viên, đọc từ tệp người mang tới

Máy viết ngày 2026-11-26 theo lời chủ repo («lập cách thức và kế hoạch cho nó nối vào design assembly trình cho tôi»),
sau lượt thử tay cùng ngày ([`docs/trials/figma-variables-hands-on.md`](../../docs/trials/figma-variables-hands-on.md)).
**Chủ repo duyệt cùng ngày («Duyệt cả bảy nhưng chọn đường file .fig»):** sáu câu hỏi mở nhận theo khuyến nghị, câu 1
chủ repo chọn khác khuyến nghị, lối tệp `.fig` đi trước. Lời đáp ghi dưới từng câu. Giai đoạn 13 vào
`docs/plan/plan.json` cùng lời duyệt ấy. Chưa gì được dựng.

## Intent

Chủ repo có một hệ thiết kế sống trong Figma, với biến chia theo collection và mode. Hôm nay muốn đưa các giá trị ấy vào
plugin thì phải làm tay, và làm tay sai lặng lẽ ở vài chỗ. Đề bài này để một người mang biến của một tệp Figma vào thành
**một hướng ứng viên** mà không phải tự quyết chỗ nào về hình dạng dữ liệu.

### Hôm nay đứng ở đâu

- Đề bài [0014](0014-outside-plugs-set-up-in-one-sitting.md) xếp Figma ở mức (c): chưa có tệp phích, chưa ổ nào khai nó.
  Tiêu chí 9 của đề bài ấy cho cầu `bring-in` đọc «một bản xuất biến kiểu Figma», nhưng chỉ trên mẫu ba biến.
- Việc đo phích Figma là một mục gác lại của giai đoạn 10.
- Lượt thử tay chạy cầu trên dữ liệu thật qua ba lối:

| Lối                             | Cần gì                                   | Cầu đọc được                                                   |
| ------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| Máy chủ MCP của Figma           | tài khoản, ghế, mạng; một lượt mỗi khung | 0 trên 64 mục như công cụ trả; bảy chỗ phải chuyển tay         |
| Nút xuất biến của Figma (DTCG)  | người mở tệp trong Figma                 | đủ 392 token của một tệp, mất tên mode, rồi từ chối            |
| Tệp `.fig`, qua một công cụ đọc | quyền lưu tệp về máy; mã của bên thứ ba  | 1 241 trên 1 403 giá trị, không chỗ nào chuyển tay; ba lỗ hổng |

- REST API biến của Figma trả đúng hình dạng cầu đọc, nhưng theo trang của Figma chỉ mở cho gói Enterprise.
- Ba lỗ hổng của cầu đã ghi vào phần gác lại của kế hoạch ngày 2026-11-26: alias sang collection có mode sáng hay tối bị
  bỏ, tên trùng giữa các collection bị đè không báo, biến đúng/sai bị báo như lỗi đọc.

### Cách nối: bốn điều

1. **Figma là nguồn ứng viên và là gương để so, không phải nơi quyết.** Ba luật của 0014 giữ nguyên: sổ thắng; mỗi sổ một
   bên ghi; script không gọi mô hình, không dùng mạng.
2. **Người mang tệp tới, plugin đọc tệp.** Phích Figma không gọi Figma từ script nào. Cầu đọc hai hình dạng tệp:
   - **hình dạng REST** (`meta.variables`, `meta.variableCollections`): có từ một công cụ đọc tệp `.fig` do người dùng
     tự chạy, hoặc từ REST API. Lối tệp `.fig` là lối skill khuyên trước, theo lời chủ repo (câu hỏi 1);
   - **bản xuất sẵn có của Figma**, lối thứ hai: một thư mục tệp `.tokens.json`, mỗi tệp một collection và một mode.
3. **Máy chủ MCP không dùng để mang hệ vào.** Nó trả một bản đồ phẳng của một khung, một mode. Trong đề bài này nó chỉ cho
   bước `plugs` biết Figma có trong phiên hay chờ đăng nhập. Skill không bao giờ gọi công cụ ghi của Figma.
4. **Cắm ở ổ hướng đi và ổ nền**, như hai phích ngoài đã khai ở cầu nối vào. Phích chỉ được khuyến nghị sau khi đo bốn
   thước, theo luật của [0008](0008-capabilities-sockets-and-plugs.md).

### Không làm trong đề bài này

- **Chiều ra** (sổ đi sang Figma thành biến). Một đề bài sau, khi đã có phán quyết.
- **Các ổ khác** mà Figma có thể cắm: linh kiện, đề bài màn, soát thiết kế, tài sản thương hiệu. Mỗi ổ cần lượt thử tay
  riêng.
- **Thêm khoá mới cho sổ nền.** Trục mode ngoài sáng và tối (portal, mật độ, điểm gãy) không thành khoá của sổ; cầu chỉ
  nói nó đã không mang trục nào.
- **Đóng gói mã của bên thứ ba.** Plugin không chứa, không tải, không build công cụ đọc `.fig` nào.

## Acceptance criteria

Cầu đọc đúng bản xuất thật (lát 1):

1. Một alias trỏ sang biến của collection khác được giải, kể cả khi collection đích có mode tên sáng hay tối và collection
   nguồn thì không. Nó lấy mode cùng tên ở đích nếu có, không thì mode mặc định của đích. Có bài kiểm.
2. Hai collection có biến trùng tên thì cả hai được giữ, không bản nào đè bản nào. Có bài kiểm làm hỏng: đổi thứ tự đọc,
   kết quả không đổi.
3. Khi tên được chọn làm màu gốc (`primary`, `brand`, `accent`) có ở hai collection với hai giá trị khác nhau, cầu không
   đoán. Nó từ chối, nêu tên hai collection, và nhận `--collection <tên>` để người chọn.
4. Collection là bản sao của thư viện ngoài hay bị ẩn khỏi xuất bản (`remote`, `hiddenFromPublishing`) không vào ứng
   viên. Cầu in một dòng đếm số collection đã bỏ. Alias trỏ vào chúng vẫn được giải.
5. Biến đúng/sai và kiểu khác mà ổ nền không dùng được đếm trong một dòng, không in mỗi biến một dòng `not read`.
6. Cầu in tên từng trục mode nó không mang theo, và mode nào của trục ấy nó đã lấy (mode mặc định).
7. Trên một mẫu dữ liệu có cùng hình dạng với tệp thật của lượt thử (nhiều collection, alias chéo, tên trùng, bản sao
   ẩn), cầu không còn giá trị màu, số hay chuỗi nào bị bỏ vì ba lỗ hổng trên.

Cầu đọc bản xuất sẵn có của Figma, lối thứ hai (lát 2):

8. `--from <thư mục>` chứa các tệp `.tokens.json` được đọc như một nguồn: collection lấy từ tên tệp, mode lấy từ
   `$extensions["com.figma.modeName"]`. Mode tên sáng hay tối thành sáng và tối của ứng viên. Có bài kiểm.
9. Thư mục thiếu tệp của một mode mà tệp khác có thì cầu nói rõ thiếu tệp nào, không lấy giá trị sáng làm tối.

Phích và bước thiết lập (lát 3):

10. Có tệp `references/plugs/figma.json`: khai hai ổ hướng đi và nền, cách phiên liệt kê nó, nó cần gì, và nó gửi gì đi
    («khoá tệp và id nút tới Figma khi đọc qua máy chủ MCP; lối tệp không gửi gì»). Phần «cần gì» nêu hai điều của lối
    tệp `.fig`: quyền lưu tệp về máy, và một công cụ đọc `.fig` do người dùng tự chạy; tên và giấy phép của công cụ đã thử
    chỉ nằm ở tệp phích này. Phép kiểm bảng năng lực và phép «lõi sạch» xanh.
11. Bước `plugs` hiện Figma với đúng trạng thái (`in-session`, `needs-sign-in`, `absent`). Không câu hỏi nào khuyến nghị
    nó khi chưa đo.
12. Skill `bring-in` nói cho người dùng cách lấy tệp theo từng lối, lối tệp `.fig` trước, bản xuất sẵn có sau. Nó không
    tải và không chạy công cụ đọc `.fig` thay người dùng. Trước mọi lượt gọi Figma, nó nói gửi gì, đi đâu, và tốn một
    lượt của hạn mức. Nó chỉ gọi công cụ đọc.
13. Bản xuất đã mang vào được giữ theo nếp của sổ nguồn (quyết định
    [0057](../decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md)): một dòng có ghim (ngày lấy,
    `sha256`, phích `figma`). Một lệnh nói được khi tệp khác ghim. Thứ được giữ là tệp JSON biến; tệp `.fig` không vào
    repo.

Đo và phán (lát 4):

14. Có một bản quyết định với số đo bốn thước của phích Figma ở ổ nền, đo trên bản sao bằng đề chuẩn, và `measured` của
    tệp phích được điền. Mục gác lại «Đo phích Figma theo bốn thước» rời phần gác lại.

Giữ cho cả đề bài:

15. Không script nào gọi mạng hay mô hình. Mọi bài kiểm chạy bằng mẫu dữ liệu tự dựng: không tệp của AG Grid, không giá
    trị của hệ thiết kế thật nào vào repo.
16. Tên công cụ ngoài chỉ nằm trong thư mục phích cắm.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Tiêu chí 13 có thể chạm hợp đồng sổ nguồn, tuỳ câu hỏi 4:
nếu bản xuất biến vào sổ nguồn thành một loại nguồn mới thì đó là một thay đổi hợp đồng, cần người duyệt.

## Plan

Đề xuất một giai đoạn mới, **13 — Figma ở ổ nền**, năm mục. Mỗi lát một PR.

| Mục  | Việc                                                          | Tiêu chí  | Cần chủ repo                                                       |
| ---- | ------------------------------------------------------------- | --------- | ------------------------------------------------------------------ |
| 13.0 | Đề bài này, chủ repo duyệt                                    | —         | duyệt, đáp các câu hỏi mở                                          |
| 13.1 | Cầu đọc đúng bản xuất thật: ba lỗ hổng, bản sao ẩn, trục mode | 1 đến 7   | không                                                              |
| 13.2 | Cầu đọc thư mục bản xuất sẵn có của Figma (lối thứ hai)       | 8, 9      | một bản xuất thật để xem hình dạng trước khi dựng                  |
| 13.3 | Tệp phích, bước `plugs`, skill `bring-in`, bản xuất có ghim   | 10 đến 13 | duyệt thay đổi hợp đồng sổ, nếu có                                 |
| 13.4 | Đo bốn thước ở ổ nền, bản quyết định, phán quyết              | 14        | cho phép lượt đo; một tệp `.fig` của hệ thật; cho chạy công cụ đọc |

- **Thứ tự:** 13.1 trước, vì nó sửa lỗi đọc sai mà không cần gì từ Figma, và chính nó làm lối tệp `.fig` đọc đủ. Rồi
  13.3, rồi 13.4. Lát 13.2 là lối thứ hai: nó chờ một bản xuất thật và không đứng trên đường tới dòng «xong khi».
- **Xong khi:** từ một tệp `.fig` của một tệp Figma thật của chủ repo, một người mang biến vào thành một hướng ứng viên
  mà không tự quyết chỗ nào về hình dạng dữ liệu; mỗi giá trị ngược sổ là một câu hỏi; và phích Figma có bản quyết định
  bốn thước.
- **Ba mục gác lại** của ngày 2026-11-26 rời phần gác lại khi 13.1 xong.
- **Vị trí trong kế hoạch:** câu hỏi 3.

## Test plan

- Mỗi tiêu chí có bài kiểm của plugin trong `tests/test-bring-in.mjs`, chạy bằng mẫu dữ liệu, không mạng.
- Mẫu dữ liệu tự dựng, giữ đúng những nét của tệp thật đã làm cầu vấp: nhiều collection, alias chéo collection, tên
  trùng, bản sao ẩn của thư viện, biến đúng/sai, trục mode ngoài sáng và tối.
- Phép kiểm làm hỏng cho tiêu chí 2, 3, 9 và 13: đổi thứ tự đọc, hai màu gốc khác nhau, thiếu tệp của một mode, tệp khác
  ghim. Mỗi lần phải đỏ với thông điệp nêu đúng chỗ.
- Lượt đo của 13.4 chạy trên bản sao bỏ đi, không đụng repo thật.

## Autonomy tier

Máy tự dựng 13.1, 13.2 và 13.3 sau lời duyệt đề bài, mỗi lát một PR; gộp là lời chủ repo. Luôn là lời chủ repo: mỗi lượt
gọi Figma dưới tài khoản của chủ repo, mỗi lượt đo tốn token, tải hay chạy mã của bên thứ ba, thay đổi hợp đồng sổ, và
đổi phích mặc định của một ổ.

## Open questions

Mỗi câu có một khuyến nghị. Chủ repo đáp ngày 2026-11-26 («Duyệt cả bảy nhưng chọn đường file .fig»): câu 1 chọn khác
khuyến nghị, sáu câu còn lại nhận theo khuyến nghị.

1. **Lối tệp nào là lối skill khuyên trước?** Khuyến nghị: bản xuất sẵn có của Figma. Nó là tính năng chính thức, không
   cần mã của bên thứ ba. Lối `.fig` được nêu như lối thứ hai, khi cần cả tệp trong một lần. Rủi ro: chưa thấy bản xuất
   sẵn có ghi alias sang collection khác thế nào, và chưa biết tài khoản của nhóm đã có nút ấy; lát 13.2 xem trước khi
   dựng. Nếu nó không đủ thì lối `.fig` lên trước.
   Chủ repo chọn khác khuyến nghị: lối tệp `.fig` đi trước, bản xuất sẵn có là lối thứ hai. Điều lời chọn này mang theo,
   ghi ở lượt thử và chưa kiểm: ghế của người lấy tệp có lưu được tệp về máy không; đọc `.fig` là giải mã ngược một định
   dạng Figma không công bố; công cụ đã thử là mã của bên thứ ba; lối này chưa chạy trên tệp của chủ repo; và ở lượt thử
   nó lệch bản xuất của chính Figma một giá trị trên 392. Lượt đo của 13.4 kiểm các điều ấy trên tệp thật.
2. **Plugin có dựa vào công cụ đọc `.fig` của bên thứ ba không?** Khuyến nghị: không đóng gói, không gọi. Người dùng tự
   chạy công cụ ấy, plugin chỉ đọc tệp JSON nó để lại. Căn cứ: công cụ đã thử có giấy phép PolyForm Shield, cấm dùng để
   làm sản phẩm cạnh tranh; đọc `.fig` là giải mã ngược một định dạng Figma không công bố, có thể gãy khi Figma đổi bản.
   Đã nhận: plugin không đóng gói, không tải, không gọi công cụ đọc `.fig`. Với lối `.fig` đi trước (câu 1), người dùng
   tự chạy công cụ ấy rồi đưa tệp JSON cho cầu; mỗi lần máy tải hay chạy nó vẫn là lời chủ repo.
3. **Giai đoạn 13 đứng ở đâu?** Khuyến nghị: sau giai đoạn 12, riêng lát 13.1 làm được ngay sau khi giai đoạn 7 đóng. Căn
   cứ: 13.1 chỉ đụng `outside-tokens.mjs`, `bring-in.mjs` và bài kiểm của chúng; 13.3 đụng sổ nguồn, nơi giai đoạn 12 cũng
   đang thêm loại nguồn.
   Đã nhận: giai đoạn 13 đứng sau giai đoạn 12. Giai đoạn 7 đã đóng ngày 2026-11-26, nên lát 13.1 làm được khi chủ repo
   mở nó; việc mở một lát trong lúc giai đoạn 12 còn mở là một thay đổi của kế hoạch, theo lời chủ repo.
4. **Bản xuất biến có được giữ trong repo không?** Khuyến nghị: có, dưới sổ nguồn, có ghim. Căn cứ: thước 1 đòi đầu ra
   giữ được và kiểm được bằng lệnh, và lượt đo Mobbin thua ở đúng chỗ này. Từ chối thì cầu vẫn chạy, nhưng không gì nói
   được tệp đã đổi.
   Đã nhận: bản xuất biến được giữ trong repo dưới sổ nguồn, có ghim. Thay đổi hình dạng của sổ, nếu có, vẫn cần người
   duyệt ở lát dựng nó.
5. **Font của tệp Figma khác font của sổ thì có thành câu hỏi không?** Khuyến nghị: có, trong lát 13.1. Hôm nay cầu chỉ
   nêu tên font. Ở lượt thử, tệp dùng Inter còn repo dùng Geist, và không câu hỏi nào được đặt. Khoảng cách thì chưa: sổ
   chỉ có một đơn vị khoảng cách, và hệ thật có nhiều trục.
   Đã nhận: font khác sổ thành một câu hỏi, trong lát 13.1; khoảng cách thì chưa.
6. **Máy chủ MCP có vai gì sau này?** Khuyến nghị: để ngỏ. Nó hợp với việc so một khung đã vẽ với màn đã dựng, tức ổ
   soát thiết kế, hơn là mang hệ vào. Cần lượt thử tay riêng.
   Đã nhận: để ngỏ.
7. **Chiều ra có vào giai đoạn này không?** Khuyến nghị: không. Viết một đề bài riêng sau phán quyết của 13.4.
   Đã nhận: chiều ra không vào giai đoạn này.

Ước lượng: 13.1 tới 13.3 là ba lát cỡ thường. Lượt đo của 13.4 cỡ lượt đo Mobbin, khi ấy ước 400 tới 600 nghìn token.
