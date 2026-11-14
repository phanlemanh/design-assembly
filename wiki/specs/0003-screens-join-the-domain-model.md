---
type: spec
title: Sổ màn nói màn hiện gì và chào nút nào cho vai nào, và một phép kiểm nối sổ màn với mô hình nghiệp vụ
status: needs-approval
tier: 1
links:
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/decisions/0030-one-ledger-of-screens.md
  - wiki/specs/0002-meta-layer-for-many-repositories.md
sources:
  - repo-standards/docs/ranh-gioi-ba-kho.md
  - repo-standards/docs/superpowers/specs/2026-11-14-entity-lifecycle-design.md (nhánh feat/entity-lifecycle, chưa gộp)
  - onehub-inventory/.acceptance-runs/dieu-phoi-nen/trinh/ra-soat-crud/bao-cao.md
  - onehub-inventory/design/screens.yaml
  - onehub-inventory/tools/coverage_matrix/buttons.py
  - onehub-inventory/ontology/actions.yaml
---

# 0003 Sổ màn nói màn hiện gì, chào nút nào cho vai nào; phép kiểm nối sổ màn với mô hình nghiệp vụ

Máy viết ngày 2026-11-15, theo việc phiên điều phối giao. **Chủ kho chưa duyệt.** Mọi lựa chọn dưới
đây là đề xuất của máy. Bản thử nằm ngoài kho, ở thư mục ghi chú chung của nhóm phiên
(`side-session-notes/local_b2cb8d3d-…/screen-actions-trial/`), vì đề bài 0002 nói máy chỉ tự xây
trong kho sau khi chủ kho duyệt từng bước.

## Intent

Ngày 2026-11-14, bản rà soát RS2 ở Inventory đếm 21 thứ người dùng thấy trên màn: 7 thao tác thêm,
sửa, bỏ thiếu thật, 5 chỉ hứa trên giấy, 7 do máy tự loại mà không hỏi. Một nguyên nhân gốc (N3 của
RS2): sổ màn không nói màn hiện thứ gì, và phép kiểm nút chỉ so những nút đã khai. Nút chưa ai khai
thì không bao giờ đỏ.

Chủ kho đã chốt «Tách ba phần» (trang ranh giới ba kho của Repo Standards). Phần của kho này: màn
hiện thứ gì, có nút nào, nút đặt ở đâu; vai không có quyền thì không thấy; bài kiểm trình duyệt theo
vai. Luật ranh giới: kho này đọc mô hình nghiệp vụ của repo đang được kiểm, không ghi vào đó; phép
kiểm nối hai sổ đặt ở kho này.

Đề bài này làm hai việc:

1. Sổ màn khai thêm được ba điều cho mỗi màn: thực thể màn hiện, thao tác mở được màn, và thao tác màn
   có nút.
2. Một phép kiểm nối sổ màn với thực thể, thao tác và vai của repo, để thao tác bị sót trên màn thì
   đỏ.

## Acceptance criteria

1. Phép kiểm đỏ ở ba chỗ, mỗi chỗ một câu báo nêu tên màn, thực thể hay thao tác, vai, và cách sửa:
   - (a) một thao tác của mô hình mà không màn nào chào ra cho một vai được làm nó;
   - (b) một màn hiện một thực thể cho một vai mở được màn mà không được xem thực thể đó;
   - (c) một nút trên màn mà không vai nào mở được màn được bấm.
2. Thao tác mà mô hình ghi `later`, `never` hay `via` thì không đòi nút. `later` hiện mỗi lần chạy,
   như một món nợ, kèm các màn đang hiện thực thể đó.
3. Chạy được trên repo chưa có khối `lifecycle:` (định dạng ấy còn trên nhánh chưa gộp của Repo
   Standards). Repo chưa có sổ thao tác, hay sổ màn chưa khai gì trong ba điều trên, thì phép kiểm
   im.
4. Không bê từ điển nghiệp vụ về kho này: tên thực thể, thao tác và vai đọc từ repo đang được kiểm.
5. Ra được bảng «màn × vai: mở được không, thấy gì, có nút nào», tính từ sổ màn và mô hình.
6. Mỗi lối đỏ có bài kiểm đỏ trước khi có mã, và một ca phá trên repo thật đỏ đúng chỗ.

## Domain impact

Không đổi mô hình dữ liệu của kho này lúc viết đề bài. Khi xây vào cổng của kho này: màn mẫu hiện
`Item` mà mô hình chưa có thao tác xem `Item`, nên phép kiểm sẽ đỏ ở (b). Sửa chỗ đó là đổi
`ontology/` (thêm thao tác xem, hoặc khối `lifecycle:` khi Repo Standards gộp), qua `/ontology-add`,
cần người duyệt. Phép kiểm cuối nhánh của Repo Standards cũng đỏ đúng chỗ ấy (thiếu xem và sửa
`Item`).

## Plan

### Hình dạng phần khai thêm, và lý do

Ba khoá mới trên mỗi màn, đều không bắt buộc, giữ hợp đồng ở phiên bản 1 vì chỉ thêm:

| Khoá      | Nghĩa                                                     | Vì sao                                                                       |
| --------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `shows`   | Các thực thể màn hiện                                     | Chỗ RS2 thiếu nhất: thiếu nó thì (b) không có gì để so, và màn «Đã gửi» xanh |
| `entry`   | Thao tác vai phải có để mở màn; `null` là mọi vai mở được | Inventory đã có (`vao`); từ đó suy ra ai mở được màn                         |
| `actions` | Các thao tác màn có nút                                   | Inventory đã có (`nut`); vai thấy nút = vai mở được màn và được làm thao tác |

Bên cạnh danh sách màn, ba khoá cũng không bắt buộc:

- `frame`: khung quanh mọi màn, cũng `actions` và `shows`. Inventory đã có (`khung`).
- `no_screen`: thao tác cố ý không có màn, mỗi dòng `{ later: <ở đâu> }` hoặc
  `{ never: <lý do>, decided_by: <người> }`. Mô hình trả lời «thao tác nào không có»; sổ màn trả lời
  «thao tác nào không hiện». Mỗi sổ một bên ghi, nên câu thứ hai nằm ở đây. Dạng giống hệt khối
  `lifecycle:` để người viết chỉ học một lần. `never` thiếu `decided_by` là đỏ; dòng đã có màn chào
  ra là đỏ, vì đã cũ.
- `keys`: tên riêng của repo cho các khoá trên, ví dụ `{ entry: vao, actions: nut, frame: khung }`.
  Lõi viết tiếng Anh; Inventory không phải đổi tên khoá đang có ba bộ đọc. Một dòng trong sổ dễ đảo
  hơn một bộ chuyển bằng mã.

Ai được làm một thao tác: đọc cả hai cách viết đang có, danh sách `roles` có kế thừa (Repo
Standards) và bảng `scope` theo vai (Inventory). Thao tác đánh dấu `status: planned` mà màn đã khai
nút thì là nợ, giống chữ «dự kiến» của bảng vai × màn × nút ở Inventory.

### Ba lối đỏ, và lý do

- (a) Với mỗi thao tác, lấy các vai được làm nó trừ các vai được chào nó ở một màn mà họ mở được. Thao
  tác xem được tính là chào ra ở màn hiện thực thể của nó, kể cả qua thực thể sống theo nó (`via`).
  Còn thiếu vai là đỏ. Chỉ màn «planned» chào ra thì là nợ.
- (b) Với mỗi thực thể màn hiện, vai được xem là vai có một thao tác xem thực thể đó (hay thực thể nó
  sống theo). Vai mở được màn mà không được xem là đỏ. Mô hình chưa có thao tác xem: đỏ, trừ khi mô
  hình ghi `later` (thành nợ); ghi `never` mà màn vẫn hiện thì đỏ.
- (c) Sổ khai nút theo màn, không theo vai: vai thấy nút được tính ra, nên sổ không thể khai sai «nút
  cho vai không có quyền». Chỗ còn sai được bằng sổ là nút mà không vai nào mở được màn được bấm: nút
  chết. Còn «vai không có quyền thì không thấy nút» lúc chạy thật là việc của bài kiểm trình duyệt
  theo vai (phần dưới).

### Cố ý chưa làm

- **Nút đặt ở đâu.** Inventory đặt nút theo loại nút (đầu màn, vùng, dòng, hồ sơ, đáy), viết ở trang
  hành vi, không theo từng màn. Phép nối với mô hình không cần nó. Lát sau: mỗi nút ghi được
  `{ name, at }`, chỗ lấy từ trang kiểu màn.
- **Bài kiểm trình duyệt theo vai.** Inventory đã có một bộ (`mo_san`). Lát sau sinh danh sách ca của
  bộ đó từ bảng màn × vai, để bộ kiểm và sổ là một.
- **Thuộc tính sửa được mà không màn nào cho sửa.** Mô hình hai repo chưa nói thao tác sửa đụng
  thuộc tính nào. Đây là «thiếu thật» thứ nhất của RS2; ghi thành đề nghị cho Repo Standards.
- **Phạm vi «của tôi» và «toàn sàn».** Phép kiểm coi hai phạm vi như nhau.
- **Một phần của màn chỉ hiện cho vài vai.** Sổ chưa nói được điều đó, nên hôm nay nó đỏ (ví dụ cột
  thứ hai của khung hiện góc nhìn đã lưu cho cả Quản trị sàn).

### Các bước, khi chủ kho duyệt

1. Chuyển bản thử vào plugin: một tệp lệnh kiểm trong bộ công cụ của plugin, đọc tệp bằng bộ đọc YAML
   đang có; mười bảy bài kiểm của bản thử sang bộ kiểm của plugin.
2. Hợp đồng sổ màn ghi thêm sáu khoá; cổng giữ hình dạng của chúng.
3. Một dòng mới trong sổ quyết định chuẩn, giữ bằng lệnh kiểm này trong cổng; một lệnh chỉ đọc chạy
   được trên repo khác (như `make design-adopt-reference`).
4. Kho này khai ba điều cho hai màn mẫu; phần mô hình đi qua `/ontology-add`, chờ người duyệt.
5. Đo lại trên Inventory bằng lệnh mới, chỉ đọc.

## Test plan

Bản thử đã chạy, ngoài kho, ngày 2026-11-15:

- 17 bài kiểm viết trước mã, đỏ trước (không có mô-đun), xanh sau; một bài sửa vì kỳ vọng sai (màn
  hiện cả bản ghi lẫn dòng sống theo nó thì báo hai chỗ, đúng).
- Đo chỉ đọc trên Inventory, nhánh chính `20a13c2`, không ghi gì ở đó (`git status` sạch trước và
  sau). Hai lần:
  - **Nguyên trạng** (sổ màn chưa khai thực thể): 7 đỏ, 12 nợ. Cả 7 là lối (a). (b) im vì không có gì
    để so: đúng chỗ hổng N3 của RS2.
  - **Có lớp phủ** do máy ghi «màn hiện gì» theo phần 1 của RS2, để ngoài kho: 17 đỏ, 12 nợ.
- Ca phá trên lớp phủ: gỡ nút «bỏ căn» khỏi Bảng hàng thì đỏ «bỏ căn không màn nào chào ra cho Đầu
  chủ, Trưởng nhóm»; thêm nút «lưu góc nhìn» vào màn Thành viên thì đỏ «nút chết».

17 chỗ đỏ có lớp phủ, chia theo nghĩa:

| Nhóm                                                                                                          | Số  | Màn                              |
| ------------------------------------------------------------------------------------------------------------- | --- | -------------------------------- |
| Màn hiện thứ mà vai mở được màn không được xem: căn cho Quản trị sàn, chủ nhà cho Đầu khách, góc nhìn ở khung | 3   | Bảng hàng (2), khung (1)         |
| Màn hiện thứ mà mô hình không có thao tác xem: «Lần gửi»                                                      | 1   | Đã gửi                           |
| Một thao tác đọc cho cả danh mục mà mô hình chỉ gắn một thực thể (cây địa lý; bốn phần của tuỳ chỉnh sàn)     | 7   | Bảng hàng (3), Tuỳ chỉnh sàn (4) |
| Thao tác không màn nào chào ra: đọc vai của mình, đọc tên sàn, xem và sửa thoả thuận, xem và sửa mã riêng     | 6   | (không màn nào)                  |

12 nợ: 6 nút của Bảng hàng đã khai mà thao tác còn «dự kiến»; 6 thao tác Liên hệ chỉ màn «planned»
chào ra.

So với RS2 (19 ô của ba nhóm):

| Nhóm của RS2    | Phép kiểm này một mình                                                                                            | Cộng phép kiểm vòng đời của Repo Standards |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 7 thiếu thật    | Đỏ 1 (tắt link: cả «Lần gửi» không có thao tác nào). Nợ 2 (màn Liên hệ, gộp liên hệ). Không thấy 4                | Thêm gỡ chủ khỏi căn: 4 trên 7             |
| 5 hứa trên giấy | Không thấy: đó là câu giao của từng hàng, phần của delivery-loop                                                  | Thêm gỡ thành viên (thiếu xoá `Member`)    |
| 7 máy tự loại   | Không thấy: là phán xét trong từng vòng, phần của delivery-loop; khoản thuế phí còn ở nhánh riêng, chưa vào chính | Không đổi                                  |

Không thấy 4 thiếu thật: sửa thông tin căn ngoài giá (thuộc tính, đã cố ý chưa làm); nhận căn chưa
ai giữ và đổi người giữ căn (mô hình chưa có thao tác nào như vậy, nên không sổ nào chạm tới); gỡ chủ
khỏi căn (thiếu ở mô hình, phần của Repo Standards).

Phép kiểm tìm thêm điều RS2 không đếm: Bảng hàng mở cho mọi vai mà Quản trị sàn không được xem căn
(RS2 ghi «QT chặn», sổ màn không nói); Đầu khách thấy chủ nhà mà mô hình chỉ có «xem số chủ» cho Đầu
chủ và Trưởng nhóm; sáu thao tác không màn nào, RS2 chỉ nhắc hai trong đó như ghi chú.

Lớp phủ do máy ghi, nên 17 là số của máy, không phải lời khai của Inventory.

## Autonomy tier

Máy tự làm các bước của Plan trong kho này sau khi chủ kho duyệt đề bài. Mọi thay đổi ở Inventory và
Repo Standards là đề nghị, chờ chủ kho cho phép ở kho đó:

- Inventory: khai `hien` (màn hiện gì) cho từng màn và một dòng `keys`; người quyết sáu thao tác không
  màn (`later` hay `never`, có tên người quyết); phân xử hai chỗ vai thấy thứ không được xem.
- Repo Standards: cho một thao tác đọc nêu nhiều thực thể (7 trên 17 chỗ đỏ là vậy); cho thao tác sửa
  nói thuộc tính nào; dấu «dự kiến» cho thao tác (Inventory đã dùng `status: planned`, phép kiểm này
  đọc được).

## Open questions

- Một phần của màn chỉ hiện cho vài vai: sổ nói bằng cách nào. Đề xuất: một thực thể trong `shows`
  ghi được thao tác mở riêng của nó, như `entry` của màn. Chưa dựng.
- Thao tác xem được tính là chào ra ở mọi màn hiện thực thể của nó. Hai thao tác xem cùng thực thể
  (xem danh sách thành viên, đọc vai của mình) vì vậy không phân biệt được.
- Ngưỡng của cổng: đỏ chặn ngay, hay để một lượt báo trước ở repo đã có. Máy khuyên đỏ chặn, như phép
  kiểm vòng đời của Repo Standards, vì lỗi này đã lọt ba lần qua lời nhắc.
