---
schema_version: 1
feature: Bảng năng lực của plugin nói ổ cắm và phích của từng năng lực, năm bài kiểm giữ nó, và status in bảng ổ cắm của repo đang đứng
slug: bang-nang-luc-o-cam
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by: Phan Le Manh
approved_at: 2026-11-20T08:46:15Z
design_doc: docs/superpowers/specs/2026-11-20-bang-nang-luc-o-cam-design.md
---

# Acceptance Contract: bang-nang-luc-o-cam

## Context

Mục 5.0 của kế hoạch chính thức (`docs/plan/plan.json`), theo đề bài
`wiki/specs/0008-capabilities-sockets-and-plugs.md`, chủ repo đã duyệt ngày 2026-11-20. Plugin Design Assembly có hai
mươi năng lực trong danh mục đóng. Mục này biến danh mục ấy thành một bảng máy đọc được, đặt các phép kiểm giữ nó, và cho
`status` bày ra ổ nào đang có phích, ổ nào trống. Không lệnh nào đang có được viết lại.

Source input: wiki/specs/0008-capabilities-sockets-and-plugs.md (mục «Acceptance criteria»), qua hàng 5.0 của
docs/plan/lo-trinh.json.

## Criteria

- AC-1: Given plugin ở HEAD, When bài kiểm đọc `plugins/design-assembly/references/capabilities.json`, Then nó thấy đúng hai mươi năng lực, mỗi năng lực có ổ cắm đủ bốn trường (sổ ghi, đầu ra, lệnh kiểm, người quyết) và danh sách phích chỉ tới script có thật; một bản sao thiếu một trường thì bài kiểm đỏ và nêu tên năng lực.
- AC-2: Given bảng năng lực, When một năng lực không có phích mặc định mà cũng không trỏ tới một dòng `open` của `references/limits.json`, Then bài kiểm «không lủng» đỏ và nêu tên năng lực; bảng thật thì xanh.
- AC-3: Given bảng năng lực và các script của plugin, When hai ổ cắm cùng khai ghi một sổ, hoặc một script ghi một sổ không thuộc ổ nào mà nó là phích hay lộ trình của nó đi qua, Then bài kiểm «không trùng» đỏ và nêu tên sổ cùng hai bên; bảng và script thật thì xanh.
- AC-4: Given các tệp phích ngoài trong `references/plugs/`, When một tên trong `names` của chúng xuất hiện trong lõi của plugin (các thư mục lõi của bài kiểm bộ chuyển, tệp bảng năng lực, và `skills/`), Then bài kiểm «lõi sạch» đỏ và nêu tệp cùng tên; plugin thật thì xanh.
- AC-5: Given `references/layers.json` và `references/tiers.json`, When một tầng hay một bậc không được năng lực nào với tới, Then bài kiểm đỏ và nêu tầng hay bậc ấy; bảng thật thì xanh.
- AC-6: Given một repo đích, When chạy `status` của plugin, Then `--json` có thêm khoá `sockets` liệt mỗi năng lực với phích đang cắm hay trạng thái trống kèm dòng giới hạn, và các phích ngoài phát hiện được trong repo ấy; bản cho người nêu số ổ có phích trên tổng số và tên các ổ trống, vẫn vừa một màn (tối đa 40 dòng).
- AC-8: Given bảng năng lực, When một ổ cắm thiếu mặt người hay mặt máy mà không ghi `reason`, Then bài kiểm «hai mặt» đỏ và nêu tên ổ cùng mặt thiếu; bảng thật thì xanh. (judgment)

## Coverage

- Bỏ coverage-scan — phạm vi là tám dòng «Acceptance criteria» của đề bài 0008, chủ repo đã duyệt; danh mục hai mươi
  năng lực đã có lượt quét cho đủ của chính đề bài (entry «bỏ coverage-scan» trong decisions.jsonl).

## Out of scope

- Cắm một phích ngoài thật vào ổ nào, hay đo phích ngoài theo bốn thước (mục 5.2 trở đi).
- Viết lại hay đổi hành vi của lệnh nào đang có; các lệnh chỉ được khai là phích.
- Thêm một sổ mới vào hợp đồng sổ (`contract.mjs`); bảng năng lực là tệp tham chiếu của plugin.
- Phát hiện phích ngoài bằng cách chạy công cụ ngoài hay dùng mạng; `detect` chỉ nhìn tệp trong repo đích.
- Đổi chữ của `references/layers.json` hay tệp tham chiếu nào khác cho «lõi sạch» phủ cả chúng.

## Notes

- Known limits (chủ repo chọn ngày 2026-11-20 ở Cổng Bằng chứng, lối 1 «thu phạm vi»): tiêu chí cũ AC-7, «hành vi các lệnh đang có không đổi», ra khỏi hợp đồng và đi mà không có bằng chứng máy của lượt chấm. Ba lượt chấm đều đỏ ở `plugins/design-assembly/tests/test-next-build.mjs:196`, bài kiểm đếm máy chủ Next.js trên cả máy nên đỏ khi lượt chấm chạy hai bản cùng lúc; `make check` chạy riêng ở commit 26dfebc xanh, 780 bài qua, và phép đo `rang/same-outputs.sh` của hồ sơ xanh ở cả ba lượt. Sửa bài kiểm ấy là một việc riêng.

- Không có màn nào: `status` là đầu ra dòng lệnh và một trang tài liệu. Không có đặc tả UX, không có design-pass
  (entry «bỏ đặc-tả-UX» trong decisions.jsonl).
- Phép dò «script ghi sổ» ở AC-3 là tĩnh: một lời gọi ghi cùng một đường dẫn sổ trong một tệp. Ghi qua tầng gián tiếp
  thì nó không thấy; giới hạn ấy có một dòng trong `references/limits.json`.
- Ô cơ hội khai «Không đo được» ở Cổng Đáng, nên hồ sơ không có mục «Đường đo».
