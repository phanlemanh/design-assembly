---
type: decision
title: Kiểu cột quyết định canh lề, bề rộng và mật độ của bảng dữ liệu
links:
  - wiki/decisions/0011-target-size-from-source.md
  - wiki/decisions/0009-component-manifest.md
  - wiki/entities/item.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/columns.mjs
  - plugins/design-assembly/templates/owned/typed-table.tsx.template
  - plugins/design-assembly/tests/test-columns.mjs
  - design/column-types.json
  - src/components/ui/typed-table.tsx
---

# 0012 Kiểu cột quyết định canh lề, bề rộng và mật độ của bảng dữ liệu

## Status

Accepted. Chủ kho duyệt bộ khuyến nghị ngày 2026-11-12 («Duyệt, dựng»): bốn luật dưới đây là luật
chủ kho đã viết ở một kho sản phẩm, đối chiếu với chuẩn ngành trước khi đưa vào plugin. Độ dài mẫu
khởi đầu, cách tách phần máy giữ với phần bài kiểm giữ, và việc siết đệm ô ở mức dày là máy chọn,
chờ chủ kho bác.

## Context

Bậc core components còn bốn câu mở, đều về bảng dữ liệu. Chuẩn ngành đọc tại nguồn: MUI và AG Grid
có danh sách kiểu cột đóng và bề rộng mặc định cố định (100 px, 200 px); Carbon để bề rộng theo nội
dung và có năm mức mật độ; MUI khuyên để người dùng tự chọn mật độ; GOV.UK viết «số để so sánh thì
canh phải». Không hệ nào cho ra cùng một bảng từ cùng một đầu vào. Luật của chủ kho thì có.

## Decision

1. **Kiểu cột hai tầng.** Plugin mang sáu kiểu nền, tên như các lưới dữ liệu gọi: chữ, số, ngày,
   ngày giờ, đúng/sai, chọn. Mỗi kho liệt kê kiểu của mình trong `design/column-types.json`, mỗi
   kiểu nói nó thuộc kiểu nền nào và độ dài mẫu của nó. Tệp này của người.
2. **Mỗi trường khai kiểu cột một lần, ở mô hình dữ liệu** (khoá `display`). Màn chỉ nêu tên
   trường và nhãn.
3. **Canh cột:** kiểu thuộc «số» canh phải, còn lại canh trái. Ngày và số điện thoại là chữ số
   nhưng không phải đại lượng để so, nên canh trái.
4. **Bề rộng cột:** số lớn hơn giữa độ dài nhãn và độ dài mẫu của kiểu, cộng đệm, tính bằng bề
   rộng ký tự. Đó là bề rộng tối thiểu.
5. **Mật độ:** bảng ở mức dày (hàng 40 px) khi các cột không hiện đủ bề rộng tối thiểu trong vùng
   có sẵn, không thì ở mức thường (48 px). Ở mức dày đệm dọc của ô cũng siết lại, vì hàng cao bằng
   ô cao nhất của nó.
6. **Màn không tự đặt** canh lề hay bề rộng lên ô, cũng không đặt chiều cao lên hàng của bảng.
7. **Tệp cho mã đọc là vật dẫn xuất** (`design/columns.json`), ghi lại bằng `make design-columns`.
8. **Các phần bảng áp luật** (`TypedTable`, `TypedRow`, `TypedHead`, `TypedCell`) được cài một lần
   vào thư mục linh kiện lõi rồi thuộc về kho: plugin không ghi đè.

## Consequences

- **Kho này (2026-11-12):** bốn trường của thực thể mẫu `Item` có kiểu cột; bảng của màn mẫu
  chuyển sang các phần bảng mới. Đo trên trình duyệt: màn rộng ở mức thường, hàng 48 px; màn điện
  thoại tự chuyển sang dày, hàng đúng 40 px; cột tiền canh phải; trang không cuộn ngang.
- **Kho đáp 23/38 quyết định lõi** (7 máy giữ, 13 tự khai, 3 đã ghi). Bậc core components đủ 10/10
  và ở mức «tự khai».
- **Mô hình dữ liệu có thay đổi cần người xem lại**: thêm thực thể mẫu `Item` và khoá `display`
  trên thuộc tính. Xem [Item](../entities/item.md).
- **Trang hành vi của kho đổi một đoạn**: sàn ghi «dòng của bảng giữ chiều cao mặc định»; đoạn đó
  giờ nói theo luật mật độ đã duyệt.
- **Kho đối chứng không đổi gì**: sổ của nó đã có dòng cho cả bốn câu, và adopt không ghi bảng kiểu
  cột hay cài mã vào kho đã có hệ riêng.

Giới hạn và điều còn mở:

- **Hai trong bốn dòng chỉ được máy giữ một phần.** Với bề rộng, máy giữ độ dài mẫu, đệm và việc
  màn không tự đặt bề rộng; phép cộng nằm trong linh kiện, do bài kiểm của linh kiện giữ. Với mật
  độ, máy chỉ giữ việc màn không tự đặt chiều cao hàng; luật chọn mức nằm trong linh kiện. Dòng sổ
  ghi rõ phạm vi, nhưng bản audit đếm cả hai là «máy giữ».
- **Trang luật giao diện của sàn có câu «đừng ép bề rộng cột»**, trái với luật bề rộng tối thiểu.
  Trang đó thuộc Repo Standards, kho này không sửa. Bảng vẫn cuộn ngang trong khung của nó trên
  điện thoại, nên bài kiểm của sàn không đỏ; câu chữ thì đang mâu thuẫn.
- Bề rộng tính bằng bề rộng một chữ số, nên với cột chữ chỉ gần đúng.
- Độ dài mẫu khởi đầu là máy đề xuất. Mẫu của kiểu tiền ở kho này (13 ký tự) lấy từ dạng
  «999.999.999 ₫».
- Cột thao tác không phải trường dữ liệu nên không có kiểu, và không được tính vào tổng bề rộng khi
  chọn mật độ.
- Bộ đọc khoá `display` chỉ hiểu hai cách viết thuộc tính mà mô hình dữ liệu của sàn dùng.
- Chưa có định dạng theo kiểu cột (số, tiền, ngày), sửa tại ô, hay lọc: các luật đó ở kho đối
  chứng gắn với kiểu cột nhưng chưa nằm trong lát này.
