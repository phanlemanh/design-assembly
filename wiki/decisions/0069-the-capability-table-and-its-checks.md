---
type: decision
title: "Bảng năng lực của plugin, phích ngoài mỗi phích một tệp, và năm phép kiểm giữ bảng"
links:
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0031-adapters-hold-library-names.md
  - wiki/decisions/0041-status-reads-ledger-rows-and-compares-the-tool-by-content.md
sources:
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/plugs/
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/tests/test-capabilities.mjs
  - plugins/design-assembly/tests/test-status.mjs
  - _acceptance/bang-nang-luc-o-cam/contract.md
  - _acceptance/bang-nang-luc-o-cam/decisions.jsonl
  - "chủ repo, 2026-11-20: «duyệt» ở Cổng Phạm vi của vòng bang-nang-luc-o-cam, nhận hai khuyến nghị Hỏi-1 và Hỏi-2"
---

# 0069 Bảng năng lực của plugin, phích ngoài mỗi phích một tệp, và năm phép kiểm giữ bảng

## Status

Accepted, 2026-11-20. Mục 5.0 của kế hoạch, theo đề bài 0008. Dựng qua bộ kit Delivery Loop, như một lượt thử
([sổ va chạm](../../docs/trials/kit-on-this-repository.md)). Chủ repo duyệt phạm vi ở Cổng Phạm vi của vòng, cùng hai câu
hỏi theo khuyến nghị. Plugin lên 0.19.0.

## Context

Đề bài 0008 chia Design Assembly thành ba tầng (lõi, ổ cắm, phích) và chốt danh mục đóng hai mươi năng lực. Danh mục
chỉ là một bảng trong văn xuôi: không lệnh nào biết ổ nào trống, sổ nào thuộc ổ nào, hay tên công cụ ngoài nào lọt vào
lõi.

## Decision

1. **Bảng là dữ liệu.** `references/capabilities.json` có hai mươi năng lực. Mỗi năng lực có một ổ cắm:
   - sổ chỉ ổ ấy được ghi (khoá của hợp đồng sổ);
   - thứ nó giao ra;
   - lệnh kiểm giữ nó;
   - người quyết;
   - hai mặt bàn giao: mặt người (bày gì, hỏi gì) và mặt máy (luật gì, lệnh nào giữ).

   Phích của plugin nằm trong bảng. `new`, `adopt` và `change` là lộ trình qua nhiều ổ, không phải phích. Ổ `decision`
   và `governance` đóng: không phích ngoài nào cắm vào.

2. **Phích ngoài mỗi phích một tệp** ở `references/plugs/`, khai ổ nó cắm vào và các tên nó mang. Bảng không nêu tên
   bên thứ ba nào. Thư mục này và thư mục bộ chuyển là hai thư mục phích cắm.
3. **Năm phép kiểm**, cùng một phép kiểm hình dạng, ở `scripts/capabilities.mjs`, bài kiểm ở
   `tests/test-capabilities.mjs`. Mỗi phép kiểm được thấy đỏ trên một bản sao hỏng một chỗ, với thông điệp nêu đúng chỗ.
   - không lủng: ổ không có phích mặc định thì trỏ một dòng mở của sổ giới hạn;
   - không trùng: một sổ một ổ, và một script chỉ chạm sổ của ổ mình;
   - lõi sạch;
   - mọi tầng và mọi bậc có năng lực với tới;
   - hai mặt.
4. **Tám dòng giới hạn mới**: bảy ổ trống, phần nhìn của soát thiết kế, và giới hạn của phép dò tĩnh. Ổ báo cáo khả năng
   truy cập trỏ dòng mở đã có (`audit-document-without-accessibility-chapter`).
5. **`status` bày bảng ổ cắm.** `--json` thêm khoá `sockets` ở cuối. Màn thêm một dòng (hai dòng khi có phích ngoài
   đang cắm), nên vẫn vừa một màn. Trang tài liệu thêm một nhóm trong bảng. Mã thoát không đổi.
6. **Phép «lõi sạch» tìm ra một tên trong lõi:** `components.mjs` nêu thư mục `reui`. Danh sách thư mục linh kiện của
   nhà cung cấp chuyển vào bộ chuyển linh kiện. Biểu thức sinh ra giống hệt từng ký tự.

## Consequences

- Một ổ trống không còn im lặng: nó là một dòng của sổ giới hạn, và `status` gọi tên nó.
- Con số giới hạn mở của `audit` tăng đúng tám, và danh sách dòng mở của nó có thêm đúng tám dòng ấy. Chủ repo đã nhận
  điều này ở Cổng Phạm vi (Hỏi-1).
- Phép dò «script ghi sổ» là tĩnh. Sổ nhập kho được ghi qua một hàm của tệp khác nên không bị thấy; bảng khai điều ấy
  ở `unseen_writes`, trỏ dòng giới hạn `capability-writes-check-is-static`.
- Phích ngoài nào cũng chưa được đo theo bốn thước của đề bài; việc ấy bắt đầu ở mục 5.2.
