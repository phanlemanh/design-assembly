---
type: decision
title: "Vai không mở được màn không thấy gì của màn; giới hạn mức nặng được đóng, phần còn hở thành dòng riêng"
links:
  - wiki/specs/0011-the-browser-test-by-role.md
  - wiki/decisions/0078-a-role-sees-its-buttons-by-their-mark.md
  - wiki/decisions/0037-screens-join-the-domain-model.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/screen-actions-seen.mjs
  - plugins/design-assembly/templates/owned/screen-actions-seen.spec.ts.template
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/tests/test-screen-actions-seen.mjs
  - docs/trials/browser-test-by-role-on-a-two-role-copy.md
  - "chủ repo, 2026-11-21: «Duyệt cả năm», đáp câu «Duyệt đề bài 0011 theo cả năm khuyến nghị?»"
  - "chủ repo, 2026-11-21: «Dựng lát 2 của mục 5.3»"
---

# 0079 Vai không mở được màn không thấy gì của màn; giới hạn mức nặng được đóng, phần còn hở thành dòng riêng

## Status

Accepted, 2026-11-21. Lát 2 của đề bài 0011, mục 5.3, theo lời chủ repo («Dựng lát 2 của mục 5.3»). Plugin lên 0.28.0.
Cùng với lát 1 ([0078](0078-a-role-sees-its-buttons-by-their-mark.md)), cả mười một tiêu chí của đề bài có chứng. Không
thêm thay đổi hợp đồng nào ngoài ba điều của lát 1; bài kiểm theo vai đã cài nay kiểm thêm một nửa.

## Context

Lát 1 dựng nửa «thấy»: vai mở được màn thấy mỗi nút của mình và không nút nào khác. Bài kiểm chưa tạo phép thử nào cho vai
không mở được màn, và kho này chỉ có một vai giữ cả ba thao tác, nên nửa «không thấy» không chứng được ở đây. Giới hạn
mức nặng `screen-actions-runtime-hiding-unchecked` còn mở. Đề bài xin lát 2 chứng nửa ấy trên một bản sao có hai vai,
ghi kết quả ở `docs/trials/`, và đóng hoặc thu hẹp giới hạn.

## Decision

1. **Mỗi vai của mô hình có phép thử ở mỗi màn đã dựng.** Vai mở được màn đi như lát 1. Dấu nay mang tên `data-model-action` (chủ repo đổi tên ngày 2026-11-21, xem 0078). Vai không mở được thì vào bằng
   cửa của nó, tới đường dẫn của màn, chờ trang có tiêu đề cấp một và yên, rồi canh thêm hai giây cho lời của trạng
   thái đầu tiên. Phép so `blockedProblems` đỏ khi trên trang có điều khiển mang dấu của một thao tác dòng sổ của màn ghi
   trong `actions`, khi lời của trạng thái đầu tiên có trên trang, hay khi trang không có đúng một vùng chính và một tiêu
   đề cấp một. Dấu của thao tác khác (của khung chẳng hạn) không phải của màn. Vai ấy thấy gì thay vào đó là lựa chọn
   của sản phẩm, không kiểm (câu hỏi 3 của đề bài).
2. **Lời được tìm trong vùng chính; vai bị chuyển đi chỉ bị kiểm là một trang.** Lời tìm trong cả trang sẽ đọc cả
   vùng điều hướng của khung, mà khung không thuộc phạm vi kiểm. Vai bị chuyển sang đường dẫn khác thì nơi đến là lựa
   chọn của sản phẩm: chỉ đòi nơi ấy vẫn có một vùng chính và một tiêu đề cấp một. Người soát độc lập nêu điều này; ở
   kho này, chuyển vai bị chặn từ `/overdue` sang `/` từng sẽ đỏ oan, vì `/` có cùng lời.
3. **Hai giây là cửa sổ canh, có tên và có dòng giới hạn.** Chứng một điều không có cần một giới hạn thời gian: lời đến
   muộn hơn thế thì không thấy (`blocked-route-watched-briefly`).
4. **Giới hạn mức nặng được đóng, không thu hẹp.** Điều nó nói (chưa bài kiểm nào mở màn dưới từng vai) nay có bài kiểm
   và có lần đo. Điều còn hở được tách thành dòng của chính nó: điều khiển của thao tác không mang dấu thì không thấy
   (`unmarked-action-control-unseen`); vùng điều hướng của khung (`frame-navigation-by-role-unchecked`); điều vai bị
   chặn được cho thấy (`blocked-role-shown-unchecked`); cửa sổ canh; nút đã vắng không được tìm lại (dòng của quyết định 0078,
   `role-lacking-control-skipped-by-words`); và kho này chỉ giữ một nửa trong
   `make check` của nó (`reference-app-holds-one-role`).
5. **Bảng năng lực.** Bài kiểm theo vai là một phích của ổ «screen build», loại `gate`, đọc sổ màn, không mặc định: nó
   chỉ có khi repo có tệp cửa. Ba phép kiểm của bảng (không lủng, không trùng, lõi sạch) vẫn xanh.
6. **Trang skill.** Bước 11 của lệnh dẫn đường nói dòng `screen-actions-seen`, và nói tệp cửa là của người: tác tử nói tệp phải
   có gì và để người viết; người nhờ gõ hộ thì chỉ gõ đúng các bước họ nói, không tự điền bước nào. Trang luật nói cùng
   một điều: plugin không viết tệp ấy, tác tử không viết cách đăng nhập nào người không đưa.

## Consequences

- Lần đo trên bản sao hai vai ([`browser-test-by-role-on-a-two-role-copy.md`](../../docs/trials/browser-test-by-role-on-a-two-role-copy.md)):
  xanh khi màn giấu đúng nút, đỏ đúng câu ở mỗi lần gài của tiêu chí 3, 4 và 5.
- Kho này vẫn đúng bốn bài kiểm theo vai: vai duy nhất mở được cả hai màn, nên không có phép thử nào cho vai bị chặn.
- Không đổi `ontology/`, không đổi bài kiểm trạng thái đã cài, không đổi năm tệp của Repo Standards.
