---
type: decision
title: "Trang luật mở đầu bằng nguyên tắc và hướng đi chủ repo đã chốt"
links:
  - wiki/specs/0007-widen-the-entry-the-system-and-the-intent.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0064-the-owner-fixes-design-principles-and-every-recommendation-says-what-it-rests-on.md
sources:
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/tests/test-principles.mjs
  - plugins/design-assembly/tests/test-adopt.mjs
  - plugins/design-assembly/references/limits.json
  - "chủ repo, 2026-11-20: «Duyệt cả bốn» (đề bài 0007, câu 3: làm ngay) và «Mục 5.5»"
---

# 0070 Trang luật mở đầu bằng nguyên tắc và hướng đi chủ repo đã chốt

## Status

Accepted, 2026-11-20. Mục 5.5 của kế hoạch, việc 1 của đề bài 0007. Plugin lên 0.20.0.

## Context

Nguyên tắc thiết kế đã là dòng sổ từ quyết định 0064, và hướng đi chủ repo chọn nằm trong bản thiết kế. Nhưng trang
luật mà tác tử đọc trước khi đụng tới một màn (`.claude/rules/design-assembly.md`) không nhắc tới điều nào trong hai
thứ ấy. Tác tử dựng màn vì vậy không biết các lựa chọn còn mở nên nghiêng về đâu. Lần thử 11 còn 9 chỗ đoán, 3 chỗ
trong đó tác tử tự quyết lặng lẽ.

Đề bài 0008 gọi đây là vùng bàn giao cho Claude Code: thứ đã quyết phải tới tay tác tử ở dạng không cần đoán.

## Decision

1. **Trang luật có thêm một mục đứng đầu**, «What the owner fixed before any value». Mục này đọc từ bản thiết kế:
   - mỗi nguyên tắc chủ repo đã chốt một dòng, mở bằng mã dòng sổ của nó (`principle-<id>`) rồi tới lời của nguyên
     tắc;
   - một dòng cho hướng đi chủ repo đã chọn, kèm tính cách của hướng ấy lấy từ danh mục;
   - một dòng nêu tên các nguyên tắc có trong bản thiết kế mà chủ repo chưa chốt, nói rõ chúng chưa quyết điều gì;
   - một dòng cuối nói cách dùng: chỗ còn mở thì theo điều các dòng này nghiêng về và nêu dòng nào; chỗ chúng không
     nói tới hoặc kéo hai phía thì là việc của chủ repo; tác tử không thêm hay viết lại dòng nào.
2. **Không có gì để nói thì không có mục.** Bản thiết kế không có nguyên tắc và không có hướng đi cho ra đúng trang
   như trước. Kho này thuộc trường hợp đó, nên trang luật của chính nó không đổi.
3. **Cả hai lối đều giữ mục này.** Lệnh dẫn dắt viết nó từ bản thiết kế nó vừa đọc. `adopt` không hỏi nguyên tắc,
   nhưng nếu kho đã có bản thiết kế từ một lượt dẫn dắt trước thì nó giữ mục ấy trên trang; bản thiết kế không đọc
   được thì nó báo ở phần «cannot be read here» và viết trang không có mục.
4. **Một bộ đọc.** Trang luật đi qua `principlesOf`, bộ đọc chung của mọi lệnh, nên luật «đề xuất chưa phải của chủ
   repo» chỉ nằm ở một chỗ.

## Consequences

- Tiêu chí 1 của đề bài 0007 có bài kiểm: một lượt dẫn dắt trên kho dựng tạm, rồi so mỗi dòng `principle-*` của sổ
  với trang luật. Bài kiểm đã được thấy đỏ trước khi dựng.
- Các dòng này không có phép kiểm nào giữ trong kho đích. Không lệnh nào so trang với bản thiết kế giữa hai lần chạy,
  và không lệnh nào biết tác tử có theo chúng không. Điều này ghi ở dòng giới hạn `fixed-first-lines-unchecked`.
- Chưa đo được việc này có giảm số chỗ đoán không. Phép đo là một lượt thử vai dựng màn, so với lần 11; lượt thử tốn
  token nên cần chủ repo cho chạy (mục 5.4).
- Lệnh `brief` (mục 5.1) dùng lại được cùng nguồn: nó đọc nguyên tắc và hướng đi qua đúng bộ đọc này.
