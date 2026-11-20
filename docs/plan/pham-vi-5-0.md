# Bản phạm vi của mục 5.0

Đầu vào của skill cắt lượt (`acceptance-gate:scope-slice`) cho lượt thử chạy kế hoạch bằng bộ Delivery Loop
([sổ va chạm](../trials/kit-on-this-repository.md)). Mỗi mã là một dòng của mục «Acceptance criteria» trong đề bài
[0008](../../wiki/specs/0008-capabilities-sockets-and-plugs.md), giữ số của đề bài. Cả tám là việc phát triển; không
có việc vận hành nào phải tách ra.

<!-- <<<PHAM-VI-MA -->

```
dot: muc-5-0
dang: chuoi
nguon: đề bài 0008, mục Acceptance criteria, chủ repo duyệt ngày 2026-11-20

- `0008-1` — plugin có một bảng năng lực máy đọc được: mỗi năng lực nêu ổ cắm (sổ, đầu ra, lệnh kiểm, người quyết) và các phích của nó
- `0008-2` — không lủng: một bài kiểm đỏ khi một năng lực không có phích mặc định mà cũng không có dòng sổ giới hạn
- `0008-3` — không trùng: một bài kiểm đỏ khi hai ổ cắm cùng khai ghi một sổ, hoặc một script ghi một sổ không thuộc ổ cắm của nó
- `0008-4` — lõi sạch: một bài kiểm đỏ khi tên một công cụ bên thứ ba nằm ngoài thư mục phích cắm
- `0008-5` — mỗi tầng của layers.json và mỗi bậc của tiers.json được ít nhất một năng lực với tới; có bài kiểm
- `0008-6` — status in bảng ổ cắm của repo đang đứng: phích nào đang cắm ở ổ nào, ổ nào còn trống
- `0008-7` — hành vi các lệnh đang có không đổi: bộ bài kiểm của plugin xanh, đầu ra chỉ khác ở phần mới của status
- `0008-8` — mỗi ổ cắm khai hai mặt, mặt người và mặt máy; một bài kiểm đỏ khi một ổ cắm thiếu một mặt mà không ghi lý do
```

<!-- PHAM-VI-MA>>> -->
