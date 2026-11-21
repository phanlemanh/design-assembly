---
type: decision
title: "Vai thấy nút của mình, nhận bằng dấu: dòng sổ mới cạnh dòng cũ, cửa vai của repo, «thấy» là có trên trang"
links:
  - wiki/specs/0011-the-browser-test-by-role.md
  - wiki/decisions/0037-screens-join-the-domain-model.md
  - wiki/decisions/0077-the-brief-after-its-second-builder-trial.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/screen-actions-seen.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-actions.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/playwright.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/owned/screen-actions-seen.spec.ts.template
  - plugins/design-assembly/templates/owned/notify.ts.template
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/brief-readers.mjs
  - plugins/design-assembly/references/standard-decisions.json
  - plugins/design-assembly/tests/test-screen-actions-seen.mjs
  - plugins/design-assembly/tests/test-screen-actions-seen-install.mjs
  - plugins/design-assembly/tests/test-action-mark.mjs
  - tests/e2e/roles.ts
  - "chủ repo, 2026-11-21: «Duyệt cả năm», đáp câu «Duyệt đề bài 0011 theo cả năm khuyến nghị?»"
---

# 0078 Vai thấy nút của mình, nhận bằng dấu: dòng sổ mới cạnh dòng cũ, cửa vai của repo, «thấy» là có trên trang

## Status

Accepted, 2026-11-21. Lát 1 của đề bài 0011, mục 5.3. Plugin lên 0.27.0. Mục 5.3 chưa xong: lát 2 (vai không mở được
màn, lần đo trên bản sao có hai vai, sổ giới hạn và bảng năng lực) chưa dựng, và giới hạn
`screen-actions-runtime-hiding-unchecked` còn mở. **Ba thay đổi hợp đồng**, chủ repo nhận cùng lời duyệt đề bài: một
dòng mới trong bảng quyết định chuẩn, `screen-actions-seen`; luật về dấu `data-action` trên trang luật; một tệp cửa vai
mà repo giữ, ở nền này là `tests/e2e/roles.ts`.

## Context

Cổng đã có bảng «màn × vai» (`screenTable` trong `screen-actions.mjs`): vai nào mở màn nào, được có nút nào. Đó là điều
sổ nói. Chưa bài kiểm nào mở màn dưới từng vai để thấy trang có nói giống thế không, và bài kiểm trình duyệt đang cài
nhận nút bằng chữ trên nút, thứ đổi theo dữ liệu và ngôn ngữ. Đề bài 0011 xin bốn phần: bảng kỳ vọng là bảng của cổng,
cửa vai của repo, dấu trên điều khiển, và bài đi mới đứng cạnh bài kiểm trạng thái.

## Decision

1. **Dòng sổ mới đứng cạnh dòng cũ, không nằm trong nó.** `screen-actions` giữ nguyên nghĩa: điều sổ nói, cổng đọc sổ
   và mô hình. `screen-actions-seen` là điều trang cho thấy. Tách hai dòng để repo chưa có cửa vai không đỏ vì điều nó
   chưa giữ được: dòng mới chỉ được đề xuất khi cổng đã giữ `screen-actions`, repo có trình duyệt kiểm thử của bộ chuyển
   (nơi bài kiểm trình duyệt của sàn đã chạy) và có tệp cửa. Một hàm duy nhất, `seenMissing` trong `apply.mjs`, nói điều
   còn thiếu; lệnh dẫn đường và `status` cùng hỏi nó, và `status` nêu điều thiếu làm bước kế. Dòng được cổng giữ
   (`tool:`): phép kiểm `screen-actions-seen` đỏ khi mất tệp cửa, mất bài kiểm, bài kiểm thôi gọi tên quyết định, thôi
   đọc kế hoạch đi của cổng (`walkPlanOf`) hay thôi vào bằng tệp cửa. Bản thân bài kiểm chạy cùng bài kiểm trình duyệt
   của repo, không chạy lại trong cổng.
2. **Kế hoạch đi là bảng của cổng, không tính lại.** `walkPlan` lấy từng dòng của `screenTable` cho màn đã dựng (bỏ màn
   dự kiến và khung), thêm đường dẫn của màn và danh sách thao tác dòng sổ của màn ghi; «vai giữ mọi thao tác của màn»
   là so hai danh sách ấy. Không chỗ nào khác suy ra quyền: đổi một quyền trong mô hình thì kế hoạch đổi theo, có bài
   kiểm chứng.
3. **Hình dạng cửa vai thuộc bộ chuyển trình duyệt; tệp là của repo.** Bộ chuyển khai `door`: tệp
   `tests/e2e/roles.ts`, tên `DOORS`, mỗi vai của mô hình một hàm nhận trang và làm trình duyệt thành đúng vai ấy, hoặc
   không làm gì khi ứng dụng không đăng nhập. Plugin không viết tệp ấy và không viết mã đăng nhập nào: bài kiểm chứng
   rằng lối cài chỉ thêm đúng tệp bài kiểm. Ở kho này `user: async () => {}`: ứng dụng không đăng nhập, mở ra đã là
   `user`. Vai không có lối vào thì bài kiểm đỏ, nêu tên vai và tên tệp.
4. **«Thấy» là có trên trang, ở một trạng thái vai ấy tới được.** Bài đi đọc mọi điều khiển mang dấu trước mỗi bước và
   khi trạng thái đã yên, nên nút chỉ hiện giữa đường (danh sách của nút «⋯» trước khi bấm hành động) cũng được tính.
   Nút bị khoá vẫn là thấy. Một thao tác phải được thấy ít nhất một lần trên cả màn, không phải ở mỗi trạng thái: gỡ dấu
   khỏi một trong nhiều nút của cùng thao tác thì bài kiểm vẫn xanh, đúng như luật. Dấu thấy ở trạng thái không tới được
   không tính. Vai giữ mọi thao tác của màn phải tới mọi trạng thái; vai thiếu một thao tác được phép không tới.
5. **Chỉ nút của thao tác dòng sổ ghi trong `actions` mang dấu.** Điều khiển mở bản ghi, đóng, lọc, hay tải lại danh
   sách sau khi lỗi (chạy lại thao tác mở màn) không mang dấu. Dấu của thao tác nằm ngoài nút của vai là lỗi, kể cả dấu
   của thao tác mở màn; câu đỏ phân biệt ba trường hợp: vai không được chạy, dòng sổ không ghi nút ấy, hay dấu không gọi
   tên thao tác nào.
6. **Nút trên toast tự vẽ để mang dấu.** Thư viện toast tự đặt `data-action` (giá trị không gọi tên thao tác nào) lên
   nút nó vẽ. Mô-đun báo kết quả (`notify.ts`) vì thế vẽ nút của mình với dáng của thư viện, nhận tên thao tác ở khoá
   `action` của lựa chọn, và tự đóng toast khi bấm; không tên thì không dấu. Linh kiện hàng (`RowActions`) và cột thao tác
   (`TableActions`) không tự vẽ nút nào của thao tác: chúng giữ nút của màn, và bài kiểm của mỗi cái chứng dấu của nút
   màn đưa vào vẫn ở đó.
7. **Luật về dấu chỉ có khi có nghĩa.** Trang luật và ô 3 của phiếu `brief` nói luật ấy chỉ khi cổng giữ
   `screen-actions` và sổ màn khai nút cho ít nhất một màn. Ô 3 đọc dòng ấy từ trang luật, kèm số dòng.

Đã có trước, máy chọn và nêu với chủ repo trước khi duyệt đề bài, không bị bác: không kiểm vùng điều hướng của khung;
không đụng bài kiểm trạng thái đã cài (`tests/e2e/templates.spec.ts` giữ nguyên từng byte ở kho này, và ở kho dựng tạm
đã cài từ trước: bài kiểm của lối cài chứng điều ấy).

## Consequences

- Kho này: dấu trên mọi nút của thao tác ở hai màn mẫu (nút xoá của dòng, nút xác nhận xoá, nút thêm của trạng thái
  rỗng, nút hoàn tác và các nút thử lại trên toast); tệp cửa cho vai `user`; dòng sổ mới, cổng giữ; đúng bốn bài kiểm
  trình duyệt mới (hai màn, một vai, hai bề rộng). Kho này chỉ có một vai giữ cả ba thao tác, nên ở đây bài kiểm chỉ
  chứng nửa «thấy».
- Bốn lần gài trên một bản sao bỏ đi của kho này, ngày 2026-11-21, mỗi lần một lỗi rồi gỡ ra. Gỡ dấu khỏi nút xoá của
  dòng (một trong nhiều nút của `deleteItem`): bài kiểm xanh. Gỡ dấu `createItem` khỏi nút thêm của trạng thái rỗng và
  khỏi nút thử lại trên toast, hai chỗ duy nhất của nó: hai bài của màn `reference` đỏ, «screen reference, role user, at
  320px: no control marked data-action="createItem" was seen in any state user reached (states reached: …). Put
  data-action="createItem" on the control that runs createItem, …» (tiêu chí 3). Đặt dấu `createItem` lên một nút ở
  trạng thái rỗng của màn `overdue`: hai bài của màn ấy đỏ, «screen overdue, role user, state empty, at 320px: a control
  marked data-action="createItem" is on the page, and the row of overdue lists no button for createItem. …». Bỏ lối vào
  của `user` khỏi `tests/e2e/roles.ts`: cả bốn bài đỏ, «role user has no way in: tests/e2e/roles.ts gives none for it.
  …» (tiêu chí 6). Gỡ hết: bốn bài xanh.
- Vai không mở được màn chưa được đi: bài kiểm hiện chỉ tạo phép thử cho vai mở được màn. Nửa ấy là lát 2. Lối vào thì
  mỗi bài kiểm đều xét cho mọi vai của mô hình, kể cả vai không mở màn nào.
- Repo đã cài `notify.ts` trước 0.27.0 giữ bản của mình (tệp của repo, không bị ghi đè): nút trên toast của nó mang dấu
  của thư viện, và bài kiểm đỏ ở đó với câu «dấu không gọi tên thao tác nào». Một dòng sổ giới hạn
  (`action-mark-not-in-earlier-owned-parts`).
- Repo đến với plugin qua lệnh nhận (`adopt`) chỉ có dòng mới khi bài kiểm đã có sẵn; lệnh nhận không cài bài kiểm, và
  `status` không nêu bước nào cho trường hợp ấy. Một dòng sổ giới hạn (`seen-row-needs-the-guide-to-install`).
