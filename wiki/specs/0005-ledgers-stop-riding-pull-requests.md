---
type: spec
title: Sổ thiết kế thôi đi theo PR, bản đồ màn tới bài kiểm, và sổ quyết định đứng thay trưởng thiết kế
status: needs-approval
tier: 1
links:
  - wiki/decisions/0048-a-ninth-stage-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0040-the-plan-of-record-and-how-it-is-kept.md
  - wiki/decisions/0029-the-contract-one-shape-per-ledger.md
  - wiki/decisions/0043-decide-reads-ledger-rows-and-a-waiting-list-kept-as-data.md
  - wiki/decisions/0047-tool-stamp-upgrade-and-the-version-rule.md
  - wiki/specs/0004-the-command-set.md
  - wiki/specs/0003-screens-join-the-domain-model.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/governance.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/references/limits.json
  - design/screen-sizes.json
  - design/waiting-list.json
  - src/screens.ts
  - tests/e2e/routes.ts
  - mk/plugin.mk
  - "repo-standards/docs/thiet-ke-tong-quan-ba-kho.md, mục 4, 5, 7, 9 (PR 14 của kho đó)"
  - "repo kiểm chứng, nhánh chính tại b6f4f29 và 7f113f7, đọc ngày 2026-11-16: 30 PR gộp gần nhất, thư mục thiết kế, các công cụ đọc sổ, cấu hình bộ chạy bài trình duyệt"
  - "delivery-loop, nhánh chuyen-nha, GUIDE.md: khoá design_floor.sinh_lai"
  - "chủ repo, 2026-11-16: «Duyệt kế hoạch»"
---

# 0005 Sổ thiết kế thôi đi theo PR, bản đồ màn tới bài kiểm, và sổ quyết định đứng thay trưởng thiết kế

## Intent

Ở repo kiểm chứng, PR nào cũng đụng PR khác vì cùng ghi vào vài tệp sổ. Đề bài này gỡ phần của lớp thiết kế, theo ba
luật của bản thiết kế tổng quan ba kho:

1. **Mỗi tệp một bên ghi.** Vật dẫn xuất do máy vẽ lại, PR không mang nó. Sổ ghi tay tách mỗi mục một mảnh.
2. **Phạm vi là vật máy đọc được.** Một bài kiểm chỉ chạy lại khi đầu vào của nó đổi. Không biết thì chạy trọn bộ.
3. **Bậc thang thay người.** Bỏ bằng cấu trúc, rồi luật trong mã, rồi uỷ quyền có biên, sau cùng mới là người quyết.

Ba phần, theo thứ tự dựng: phần A là mục 8.1 của kế hoạch, phần B là 8.2, phần C là 8.3. Mục 8.4 đưa cả ba sang repo
kiểm chứng.

### Số đo hôm nay

Đếm trên 30 PR gộp gần nhất của repo kiểm chứng tính tới commit `b6f4f29`. 19 trong 30 PR chạm ít nhất một tệp của thư
mục thiết kế.

| Tệp                  | Nó là gì                         | PR chạm | Mỗi lần đổi thế nào                    | Ai ghi                    |
| -------------------- | -------------------------------- | ------- | -------------------------------------- | ------------------------- |
| Sổ linh kiện         | Máy sinh từ mã, vẫn commit       | 14      | Sinh lại                               | `make gen`                |
| Sổ khối              | Ghi tay, mỗi khối một mục        | 13      | 13 trên 13 lần chỉ thêm dòng           | Vòng nhận khối            |
| Sổ màn               | Ghi tay, mỗi màn một mục         | 9       | 6 lần chỉ thêm; 3 lần sửa một hai dòng | Người hoặc tác tử         |
| Trang mẫu hành vi    | Ghi tay, một bảng                | 8       | 5 lần viết lại gần cả bảng             | Người hoặc tác tử         |
| Bảng vai × màn × nút | Máy sinh từ ba nguồn, vẫn commit | 6       | Sinh lại                               | Công cụ riêng của repo đó |

Hai điều rút ra:

- Sổ khối và sổ màn hầu như chỉ được **thêm mục**. Hai PR thêm hai mục khác nhau không có lý do gì để đụng nhau; chúng
  đụng chỉ vì chung một tệp.
- Trang mẫu hành vi nóng vì **bộ định dạng căn lại cột**: một ô dài hơn là mọi dòng của bảng bị viết lại (PR 55 thêm
  28 dòng và bớt 28 dòng trong một bảng 34 dòng).

### Phần A. Sổ thôi đi theo PR

**Luật chung: mảnh là nguồn; tệp ở đường dẫn cũ là vật dẫn xuất, không commit, và lệnh sinh vẽ lại nó trước mọi phép
kiểm.** Giữ tệp tổng hợp ở đúng đường dẫn cũ là để các bên đang đọc không phải đổi: ở repo kiểm chứng có ít nhất
hai mươi tệp công cụ và bài kiểm nhắc tới sổ màn, bảy tệp nhắc tới sổ khối, và kit nghiệm thu đọc sổ linh kiện.

| Sổ                   | Nguồn sau khi đổi                                                         | Tệp ở đường dẫn cũ    |
| -------------------- | ------------------------------------------------------------------------- | --------------------- |
| Sổ linh kiện         | Mã nguồn linh kiện, như hôm nay                                           | Dẫn xuất, thôi commit |
| Sổ màn               | `design/screens/<mã màn>.yaml`, mỗi màn một tệp; phần chung một tệp riêng | Dẫn xuất, thôi commit |
| Sổ khối              | `design/intake/<khoá nhu cầu>.yaml`, mỗi khối một tệp                     | Dẫn xuất, thôi commit |
| Bảng vai × màn × nút | Ba nguồn như hôm nay                                                      | Dẫn xuất, thôi commit |
| Trang mẫu hành vi    | Giữ một tệp ở đợt này; xem câu hỏi 3                                      | Vẫn commit            |

Chi tiết từng sổ:

- **Sổ linh kiện.** Phép kiểm hôm nay là «tệp đã commit khớp mã». Nó đổi thành «sinh được, và đúng hình dạng của hợp
  đồng»; lệnh sinh chạy trước cổng. Thêm một phép kiểm mới: vật dẫn xuất nằm trong git thì đỏ. Sổ token và sổ cột cùng
  loại nhưng không nóng (sổ token 1 trên 30 PR), nên đợt này để nguyên.
- **Sổ màn.** Tên tệp là mã màn, nên hai mục trùng mã không thể cùng tồn tại: luật ấy được giữ bằng cấu trúc thay cho
  phép kiểm. Phần chung (danh sách kiểu màn, đối tượng, trạng thái, khung ứng dụng) nằm ở một tệp riêng, hiếm đổi. Bộ
  đọc sổ màn nhận cả hai hình dạng: có thư mục thì đọc thư mục, không thì đọc tệp cũ (quyết định 0029: bộ đọc hình
  dạng N đọc được hình dạng cũ hơn).
- **Sổ khối là «sổ nhập kho» của mục 3.1.** Đề bài 0004 đã tả một dòng của sổ nhập kho: thứ gì, từ đâu và bản nào, cho
  nhu cầu gì, ai duyệt, ngày nào. Sổ khối của repo kiểm chứng có đúng các cột ấy. Mục 8.1 chốt hình dạng này và đưa vào
  hợp đồng sổ; mục 3.1 dùng lại, không định hình lần hai. Tên tệp là khoá nhu cầu, nên luật «một nhu cầu, một lời
  giải» cũng được giữ bằng cấu trúc. Một mảnh do đúng một vòng ghi, một lần, kể cả hai cột «hồ sơ nhận» và «ngày
  duyệt»; nhờ vậy sổ vẫn mỗi tệp một bên ghi dù vòng làm việc là bên ghi.
- **Bảng vai × màn × nút.** Công cụ sinh là của repo kiểm chứng, không phải của plugin. Đợt này chỉ đổi một điều: tệp
  thôi commit. Plugin không nhận việc sinh bảng này.
- **Tên.** Mọi tệp và thư mục mới mang tên tiếng Anh, theo luật ngôn ngữ của Repo Standards. Hai tên cũ đang trái luật;
  xem câu hỏi 1.

Đã cân và không chọn:

- **Giữ một tệp, nhờ git tự gộp phần thêm.** Không gỡ được điều đang đo: lối gộp nhanh của đợt điều phối xét theo đường
  dẫn tệp, hai PR chung một tệp vẫn bị coi là đụng nhau.
- **Vẫn commit tệp tổng hợp, để một việc tự động vẽ lại trên nhánh chính sau mỗi lần gộp.** Cần một bên được đẩy thẳng
  lên nhánh chính; tường của Repo Standards đang chặn điều đó, và cơ chế ấy là gói RS2 của họ, chưa có. Nếu RS2 ra đời,
  đường này mở lại được mà không đổi hình dạng mảnh.

### Phần B. Tệp đổi ảnh hưởng màn nào

Một lệnh mới, chỉ đọc: `affected`. Tên lấy từ thuật ngữ ngành «test impact analysis»; vào bảng từ vựng cùng lúc.

- **Đầu vào:** `--target`; `--base NHÁNH` (mặc định: điểm tách khỏi nhánh chính) hoặc `--files`; `--json`.
- **Người nhận:** mỗi màn bị ảnh hưởng một dòng, kèm tệp nào kéo nó vào và khổ màn nó cần; hoặc một câu «chạy trọn bộ»
  kèm lý do.
- **Máy nhận:** `all` (đúng hay sai, và vì sao), `screens[]` (mã, đường dẫn, lý do, khổ màn), `unmapped[]` (tệp đổi mà
  máy không lần được).
- **Mã thoát:** 0; 2 khi gọi sai hoặc repo không đọc được. Lệnh không bao giờ ghi.

Cách lần, ba chiều:

1. **Tệp → màn: máy tự lần.** Từ tệp trang của mỗi màn, đi theo `import` tới mọi tệp nó dùng. Bộ đọc `import` đã có
   (phép kiểm chiều nhập của tầng governance). Tệp đổi nằm trong tập của màn nào thì màn ấy bị ảnh hưởng.
2. **Màn → bài: lấy từ sổ màn.** Bài sinh từ danh sách màn đã mang đường dẫn màn trong tên (ở kho này: mọi bài của
   `templates.spec`). Bài không nêu màn nào thì luôn chạy.
3. **Màn → khổ màn.** Một mục của sổ màn được khai `sizes` riêng; không khai thì dùng danh sách chung như hôm nay.

**Luật an toàn: không lần được thì trả «trọn bộ».** Stylesheet, sổ token, khung ứng dụng, cấu hình dựng, tệp khoá
phiên bản thư viện, nguồn dữ liệu dùng chung, và mọi tệp mã không thuộc tập của màn nào đều rơi vào đây. Danh sách
«tệp toàn cục» khai trong dữ liệu của công cụ, không viết cứng trong mã.

Lệnh chỉ nói; nó không tự đổi cách chạy bài. Lý do: ở kho này lệnh chạy bài trình duyệt và bài `floor.spec` là tệp của
Repo Standards, kho này không được sửa; ở repo kiểm chứng việc chọn bài trong CI là gói RS3 của họ.

### Phần C. Sổ quyết định đứng thay trưởng thiết kế

Biên chủ repo đã chốt: máy tự chọn từ sổ quyết định và danh mục linh kiện; khuôn mới và màu thương hiệu thì phải hỏi;
bất biến máy so là «mọi lựa chọn trỏ về một dòng sổ». Sổ quyết định, lệnh `decide` và trang luật cho tác tử đã có. Ba
thứ còn thiếu:

1. **Hàng chờ theo mảnh, và đường để tác tử đang dựng xếp câu vào đó.** Hôm nay hàng chờ là một tệp chung, cùng căn
   bệnh với các sổ ở phần A. Nó thành `design/waiting/<mã câu>.json`, mỗi câu một tệp. `decide` có thêm đường `--ask`:
   tác tử gặp câu sổ chưa trả lời thì ghi một mảnh (câu hỏi, khuyến nghị, căn cứ, khó đảo hay không) và đi tiếp theo
   khuyến nghị của chính nó. Chủ repo đáp một lần ở cổng; lời đáp ở lại sổ để lần sau máy không hỏi lại. Câu thuộc loại
   «phải hỏi» (mục 3 dưới) thì tác tử không được đi tiếp.
2. **Phép so tổng.** Một phép kiểm trong cổng đỏ khi có dòng loại «phán xét» của sổ quyết định mà chưa ai xác nhận và
   cũng không nằm ở hàng chờ, hoặc khi lệnh rà soát báo một quyết định chuẩn bị đi vòng hay không có dòng. Phép so này
   chỉ phủ các loại lựa chọn máy đọc được: giá trị, linh kiện, kiểu màn, trạng thái, chữ, kiểu cột. Bố cục tự do bên
   trong một màn nằm ngoài; điều đó ghi thành một dòng giới hạn.
3. **Tường cho khuôn mới và màu thương hiệu.** Một phép kiểm so nhánh với nhánh chính: nhánh thêm một trang kiểu màn
   mới, hoặc đổi dòng màu gốc, thì đỏ cho tới khi hàng chờ có lời đáp của chủ repo nêu đúng mục ấy. Việc này đóng luôn
   dòng giới hạn đang mở `brand-color-not-pinned`. Phần ép trên GitHub (nâng hạng PR) là gói RS5 của Repo Standards.

### Ngoài phạm vi

- Nhật ký wiki, trang mục lục wiki (gói RS2), trang lộ trình, bản đồ sản phẩm và tệp cấu hình nghiệm thu (gói DL1).
- Mọi sửa đổi ở delivery-loop.
- Đổi cách CI chọn bài (RS3) và tường trên GitHub (RS5): kho này chỉ cấp đầu vào.
- Việc sinh bảng vai × màn × nút, và đổi các khoá tiếng Việt bên trong sổ của repo kiểm chứng.

## Acceptance criteria

1. Trong kho này, sổ linh kiện không còn trong git; `make check` trên một bản chép sạch vẫn xanh vì lệnh sinh chạy
   trước cổng.
2. Commit một vật dẫn xuất thì cổng đỏ, và nêu tên tệp.
3. Sổ màn của kho này là mỗi màn một tệp. Trên một bản sao của repo kiểm chứng, tệp tổng hợp sinh từ mảnh giống tệp
   hôm nay về dữ liệu, không mất mục nào.
4. Sổ nhập kho có hình dạng trong hợp đồng sổ. Trên bản sao của repo kiểm chứng, tệp tổng hợp sinh từ mảnh giống sổ
   khối hôm nay về dữ liệu.
5. Hai nhánh, mỗi nhánh thêm một màn hoặc một khối khác nhau, gộp vào nhau không xung đột ở thư mục thiết kế.
6. `affected` chọn đúng một màn khi chỉ một tệp riêng của màn ấy đổi, và trả «trọn bộ» khi stylesheet, khung ứng dụng
   hay một tệp không lần được đổi.
7. Trên 30 PR đã gộp của repo kiểm chứng, tập màn `affected` chọn chứa mọi màn mà hợp đồng của vòng ấy khai. Thiếu một
   màn là lỗi; thừa thì ghi số đo.
8. Tác tử ghi được một câu vào hàng chờ bằng `decide --ask` mà không sửa tệp chung nào; `decide` trình câu ấy cùng các
   câu khác.
9. Nhánh thêm một trang kiểu màn mới hoặc đổi màu gốc thì cổng đỏ; có lời đáp của chủ repo cho đúng mục ấy thì xanh.
10. Repo kiểm chứng nhận cả ba phần bằng `upgrade`: lệnh in trước mọi tệp sẽ tách, dừng khi một mục có thể mất.
11. Đo lại sau 30 PR gộp kế tiếp ở repo kiểm chứng: sổ linh kiện và bảng vai × màn × nút 0 PR chạm; mỗi PR chỉ chạm
    mảnh sổ của chính nó.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này. Hợp đồng sổ đổi:

- sổ màn lên hình dạng 2: một thư mục, mỗi màn một tệp, thêm khoá `sizes` tuỳ chọn;
- thêm sổ thứ mười hai, sổ nhập kho, mỗi khối một tệp;
- mỗi sổ khai thêm nó có phải vật dẫn xuất không, và có được commit không;
- hàng chờ thành thư mục, mỗi câu một tệp (hàng chờ không phải sổ của hợp đồng; quyết định 0043 giữ nguyên điều đó).

Bảng từ vựng thêm tên ngành cho: tác động của thay đổi lên bài kiểm, nhập kho, vật dẫn xuất.

## Plan

| Bước | Việc                                                                     | Chạm mục đã có |
| ---- | ------------------------------------------------------------------------ | -------------- |
| 8.1a | Sổ linh kiện thôi commit; phép kiểm «vật dẫn xuất trong git thì đỏ»      | 6.2            |
| 8.1b | Sổ màn theo mảnh; bộ đọc nhận hai hình dạng; lệnh tách tệp cũ thành mảnh | 6.2            |
| 8.1c | Sổ nhập kho vào hợp đồng, theo mảnh; lệnh tách sổ khối cũ                | 3.1, 7.2       |
| 8.2  | Lệnh `affected`; khoá `sizes` theo màn                                   | 5.3            |
| 8.3a | Hàng chờ theo mảnh; `decide --ask`                                       | 5.1            |
| 8.3b | Phép so tổng; tường cho khuôn mới và màu gốc                             | 5.1            |
| 8.4  | Repo kiểm chứng nhận bằng `upgrade`, trên nhánh riêng, hồ sơ có chữ ký   | 1.4            |

Mỗi bước một PR, số bản plugin tăng theo quyết định 0047. Bước 8.4 chỉ bắt đầu khi mục 1.4 đã gộp, để repo kiểm chứng
không mang hai lần lên đời dở cùng lúc.

Gãy khi nâng cấp, biết trước:

- **Cổng của repo đã nhận đỏ cho tới khi lên đời.** Hình dạng sổ màn đổi thì công cụ bản cũ không đọc được mảnh. Bộ
  đọc mới đọc được tệp cũ, nên thứ tự an toàn là: công cụ mới trước, tách mảnh sau.
- **`upgrade` hôm nay không ghi dòng sổ nào.** Tách một sổ ghi tay thành mảnh là việc mới của nó. Nó giữ luật cũ: in
  trước, dừng khi mất mục, chỉ ghi khi người chấp nhận.
- **PR đang mở ở repo kiểm chứng lúc chuyển** đụng một lần cuối, vì chúng còn sửa tệp cũ.
- **Người duyệt PR không còn thấy thay đổi của sổ linh kiện** trong PR; muốn xem thì chạy lệnh sinh.
- **Công cụ riêng của repo kiểm chứng** phải gọi lệnh sinh trước khi đọc tệp tổng hợp; quên thì chúng đọc bản cũ trên
  đĩa.

Chưa thử:

- Kit nghiệm thu có bước «sinh lại tệp dẫn xuất» trong vòng (`sinh_lai`), nhưng hướng dẫn của nó viết «commit trước khi
  chấm». Chưa biết bước ấy làm gì khi tệp bị git bỏ qua. Phải thử trên bản sao trước 8.4, không sửa delivery-loop.
- Bộ lần `import` mới chạy trên ứng dụng mẫu của kho này, nơi màn được nạp từ một danh sách. Ở repo kiểm chứng màn là
  tệp trang theo thư mục; độ chính xác ở đó chưa đo. Tiêu chí 7 là phép đo.
- Ở repo kiểm chứng, bốn khổ màn khai trong cấu hình bộ chạy bài và bài đặt tên theo tính năng. Bản đồ chỉ có ích ở đó
  khi bài mang mã màn; đó là việc trong repo ấy.
- Chưa có số đo nào về lợi ích: mọi mức giảm ở trên là kỳ vọng từ phép đếm, chưa đợt nào chạy.

## Test plan

Mỗi phép kiểm mới phải được thấy đỏ trên một bản sao bị đổi trước khi xanh, như mọi phép kiểm của công cụ này.

| Phép kiểm                        | Thấy đỏ khi                                                             |
| -------------------------------- | ----------------------------------------------------------------------- |
| Vật dẫn xuất không nằm trong git | Thêm sổ linh kiện vào git ở bản sao                                     |
| Mảnh sổ màn đúng hình dạng       | Tên tệp khác mã màn bên trong; thiếu trường bắt buộc                    |
| Tách không mất mục               | Bỏ một mục khỏi mảnh rồi so với tệp cũ                                  |
| Mảnh sổ nhập kho đúng hình dạng  | Tên tệp khác khoá nhu cầu; thiếu ngày duyệt                             |
| `affected` chọn đúng             | Cắt một cạnh `import` ở bản sao: màn đáng ra bị chọn mà không được chọn |
| `affected` hỏng về phía an toàn  | Đổi stylesheet hay một tệp lạ mà kết quả không phải «trọn bộ»           |
| Phép so tổng                     | Thêm một dòng «phán xét» không ai xác nhận, không ở hàng chờ            |
| Tường khuôn mới, màu gốc         | Thêm trang kiểu màn, hoặc đổi màu gốc, không kèm lời đáp                |

Bài kiểm của plugin chạy trên repo dựng tạm như hôm nay. Phép so với repo kiểm chứng chạy trên bản sao, không bao giờ
ghi vào repo thật, và thành một lệnh `make` để đo lại được.

## Autonomy tier

Máy tự làm trong kho này sau khi chủ repo duyệt đề bài, theo thứ tự ở mục Plan, mỗi bước một PR. Bước 8.4 và mọi thay
đổi ở repo kiểm chứng cần chủ repo cho phép riêng, từng bước, trên nhánh riêng với hồ sơ có chữ ký. Không sửa
delivery-loop và Repo Standards.

## Open questions

Mỗi câu có khuyến nghị của máy. Câu nào chủ repo không đáp thì máy đi theo khuyến nghị và ghi câu ấy vào hàng chờ.

1. **Hai tên tệp tiếng Việt ở repo kiểm chứng (sổ khối, bảng vai × màn × nút) có đổi sang tiếng Anh không?** Khuyến
   nghị: đổi, trong cùng lần chuyển ở 8.4, vì lúc đó hai tệp đằng nào cũng đổi cấu trúc. Các khoá tiếng Việt bên trong
   sổ thì giữ: plugin đã có bảng ánh xạ khoá, và nhiều tệp công cụ của repo ấy đọc chúng; đổi khoá là một vòng
   riêng. Khó đảo vừa phải: đổi tên lần hai tốn thêm một lượt sửa mọi bên đọc.
2. **Chấp nhận việc PR không còn hiện thay đổi của sổ linh kiện?** Khuyến nghị: chấp nhận. Sổ ấy là bản chụp của mã;
   thay đổi thật đã hiện ở mã.
3. **Trang mẫu hành vi: tách mảnh ngay hay để sau?** Khuyến nghị: để sau, và làm ngay một việc rẻ hơn ở 8.4: đổi bảng
   thành danh sách mục, để thêm một quy tắc không còn viết lại mọi dòng. Đo lại rồi mới quyết có tách mảnh không.
4. **Sổ token và sổ cột cũng là vật dẫn xuất còn commit: có đổi cùng lúc không?** Khuyến nghị: không. Chúng không nóng,
   và kit nghiệm thu đọc sổ token.
5. **Khi tác tử xếp một câu vào hàng chờ, nó được đi tiếp theo khuyến nghị của mình không?** Khuyến nghị: được, trừ
   khuôn mới và màu thương hiệu, đúng biên chủ repo đã chốt. Mọi lần đi tiếp để lại một mảnh hàng chờ, nên đảo được.
