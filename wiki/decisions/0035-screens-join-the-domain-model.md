---
type: decision
title: Sổ màn nói màn hiện gì, chào nút nào; cổng nối sổ màn với mô hình nghiệp vụ của repo
links:
  - wiki/specs/0003-screens-join-the-domain-model.md
  - wiki/decisions/0030-one-ledger-of-screens.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/screen-actions.mjs
  - plugins/design-assembly/tests/test-screen-actions.mjs
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/contract.md
  - docs/trials/inventory-shows.json
  - "chủ repo, 2026-11-15: «Duyệt, xây đi» (phiên này), «Duyệt» (phiên điều phối)"
  - "chủ repo, 2026-11-15: «Duyệt, áp bản vá» (phần mô hình)"
  - design/screens.yaml
  - ontology/actions.yaml
---

# 0035 Sổ màn nói màn hiện gì, chào nút nào; cổng nối sổ màn với mô hình nghiệp vụ của repo

## Status

Accepted. Chủ repo duyệt đề bài [0003](../specs/0003-screens-join-the-domain-model.md) ngày
2026-11-15: «Duyệt, xây đi» ở phiên này, «Duyệt» ở phiên điều phối. Lời duyệt phủ các bước của mục
Plan trong repo này, trừ việc đổi mô hình dữ liệu ở bước 4: phần đó chủ repo duyệt riêng cùng ngày
(«Duyệt, áp bản vá»). Hình dạng phần
khai thêm, ba lối đỏ và các thứ cố ý chưa làm là máy chọn, ghi ở đề bài; chờ chủ repo bác.

## Context

Bản rà soát RS2 ở Inventory (2026-11-14) thấy thao tác bị sót trên màn mà không phép kiểm nào đỏ:
phép kiểm nút của Inventory chỉ so những nút đã khai, và sổ màn không nói màn hiện thứ gì. Theo
ranh giới ba kho chủ repo đã chốt, phần «màn hiện gì, nút cho vai nào» là của repo này, và phép kiểm
nối hai sổ đặt ở bên đọc, tức ở đây.

## Decision

1. **Sổ màn khai thêm ba điều cho mỗi màn**, đều không bắt buộc: thứ màn hiện, thao tác mở được màn,
   và thao tác màn có nút. Bên cạnh danh sách màn: khung quanh mọi màn, danh sách thao tác cố ý
   không có màn (để sau, hay không bao giờ kèm tên người quyết), và tên riêng của repo cho các khoá
   ấy. Hợp đồng vẫn phiên bản 1, vì chỉ thêm.
2. **Một dòng sổ mới, `screen-actions`**, trong bảng quyết định chuẩn và trong cổng. Cổng đỏ khi một
   thao tác không màn nào chào ra cho vai được làm nó, khi màn hiện một thứ cho vai không được xem,
   và khi một nút không vai nào mở được màn được bấm. Món nợ «để sau» in ra mỗi lần chạy, không đỏ.
3. **Cuộc dẫn dắt và lối «nhận» đề xuất dòng này chỉ khi** repo có sổ thao tác và sổ màn đã khai ít
   nhất một trong ba điều. Sổ chưa khai gì thì dòng không có, thay vì một dòng «máy giữ» mà chẳng
   kiểm gì. Đã có dòng mà sổ thôi khai, hay mô hình mất sổ thao tác, thì cổng đỏ.
4. **Không bê từ điển nghiệp vụ về plugin**: tên thực thể, thao tác, vai đọc từ repo đang được kiểm.
   Đọc được cả hai cách viết quyền đang có (danh sách vai có kế thừa, và bảng phạm vi theo vai), và
   khối vòng đời khi repo có. Khối đó đã là định dạng chính thức của Repo Standards (PR 9 gộp ngày
   2026-11-15); repo chưa nâng cấp vẫn được kiểm như nhau.
5. **Repo này khai cho hai màn mẫu**: cả hai hiện `Item` và mở bằng `listItems`; màn mẫu có nút thêm
   và xoá, màn quá hạn không có nút nào. Mô hình thêm thao tác xem `listItems` (tên hàm đang làm việc
   đó), vì màn hiện `Item` mà mô hình chưa có thao tác xem nó. Lần đầu máy làm phần này trước khi có
   lời duyệt riêng, rồi gỡ ra khi phiên điều phối nhắc; chủ repo duyệt sau đó và bản vá được áp lại
   nguyên vẹn.
6. Nguồn của dòng sổ ghi cả repo này và sổ của Inventory: sổ đó có dòng «bộ nút theo quyền». Hai
   nguồn làm dòng này thành câu lõi. Đó là máy xếp, chờ chủ repo bác.

## Consequences

- Cổng của repo này giữ 38 quyết định bằng 44 lệnh kiểm (trước là 37 và 43). Bỏ nút xoá khỏi sổ
  màn thì cổng đỏ đúng câu, thử bằng tay ngày 2026-11-15.
- Bài kiểm của plugin thêm 26 bài: 17 bài viết trước mã ở bản thử, rồi các bài cho cổng, cho bộ
  đọc tệp, cho bộ ghi sổ màn và cho kho đối chứng.
- Đo trên Inventory, chỉ đọc, bằng lệnh mới của repo này (nhánh chính `20a13c2`): sổ nguyên trạng
  7 đỏ, 12 nợ; có lớp phủ «màn hiện gì» do máy ghi, 17 đỏ, 12 nợ. Cùng số với bản thử. Chia nhóm và
  so với RS2 ở mục Test plan của đề bài 0003.
- Bảy giới hạn vào sổ giới hạn: chỗ đặt nút; vai không quyền có thật không thấy nút lúc chạy; thuộc
  tính sửa được; phạm vi «của tôi» và «toàn sàn»; một phần màn chỉ cho vài vai; hai thao tác xem cùng
  một thứ; một thao tác đọc cho nhiều thực thể. Hai dòng cuối chuyển sang Repo Standards.
- Inventory chưa nhận gì: khai «màn hiện gì», dòng tên khoá riêng, và quyết sáu thao tác không màn
  là việc ở repo đó, chờ chủ repo cho phép.
