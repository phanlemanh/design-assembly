# Bài kiểm theo vai trên một bản sao có hai vai (mục 5.3, tiêu chí 10)

Một lần đo, ngày 2026-11-21, theo lời chủ repo («Dựng lát 2 của mục 5.3»). Đề bài:
[0011](../../wiki/specs/0011-the-browser-test-by-role.md). Quyết định đi kèm:
[0079](../../wiki/decisions/0079-a-role-finds-nothing-of-a-screen-it-may-not-open.md). Lần đo không gọi tác tử nào: máy
gài, máy chạy bài kiểm của repo, máy đọc câu đỏ.

## Cách làm

- **Bản sao bỏ đi** của nhánh lát 2 (plugin 0.28.0), trong thư mục nháp của phiên; `node_modules` trỏ về kho này. Kho
  này giữ nguyên: `ontology/` của nó không đổi.
- **Gài thêm một vai, `viewer`**, chỉ được xem: `listItems` cho cả `user` và `viewer`; một thao tác mới,
  `listOverdueItems`, chỉ cho `user`, làm thao tác mở màn `overdue`. Bảng của cổng (`screen-actions-seen.mjs`) cho:

  | Màn         | `user`                         | `viewer`          |
  | ----------- | ------------------------------ | ----------------- |
  | `reference` | mở, nút createItem, deleteItem | mở, không nút nào |
  | `overdue`   | mở, không nút nào              | không mở được     |

- **Ứng dụng của bản sao giấu đúng**: một công tắc vai gài sẵn đọc vai từ bộ nhớ của trình duyệt; với `viewer` màn
  `reference` không vẽ cột nút xoá và trạng thái trống không có nút thêm; màn `overdue` chỉ vẽ một vùng chính với tiêu
  đề. Cửa vai (`tests/e2e/roles.ts`) đặt vai vào bộ nhớ ấy trước khi trang mở.
- **Năm lần gài**, mỗi lần một lỗi, chạy bài kiểm theo vai, rồi trả tệp về như cũ. Sau lượt soát độc lập, thêm một
  lần nữa: vai bị chặn bị chuyển sang màn `/`.

Phần gài, để làm lại được:

- `ontology/roles.yaml` thêm `- name: viewer`; `ontology/actions.yaml` đổi `roles` của `listItems` thành
  `[user, viewer]` và thêm `listOverdueItems` (`entity: Item`, `kind: query`, `roles: [user]`);
  `design/screens/overdue.yaml` đổi `entry` thành `listOverdueItems`.
- `tests/e2e/roles.ts`: `user` gỡ khoá `role` khỏi bộ nhớ của trình duyệt bằng `page.addInitScript`, `viewer` đặt
  `role` là `viewer`.
- `src/lib/role.ts` đọc khoá ấy và nói vai được chạy thao tác nào, theo đúng mô hình; màn `reference` bỏ cột nút xoá
  và nút thêm khi vai không được chạy chúng; màn `overdue` trả về một vùng chính chỉ có tiêu đề khi vai không được chạy
  `listOverdueItems`.

## Kết quả

Bài kiểm có 8 phép thử: 2 màn × 2 vai × 2 bề rộng (320 và 1440).

| Lần chạy                                                       | Kết quả      | Câu đỏ (ở 320px; 1440px giống vậy)                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Không gài                                                      | 8 xanh       |                                                                                                                                                                                                                                                                                                              |
| Tiêu chí 3: gỡ dấu `createItem` khỏi cả hai nút của nó         | 2 đỏ, 6 xanh | «screen reference, role user, at 320px: no control marked data-model-action="createItem" was seen in any state user reached (states reached: ready, loading, …). Put data-model-action="createItem" on the control that runs createItem, …»                                                                  |
| Tiêu chí 4: `viewer` thấy nút xoá                              | 2 đỏ, 6 xanh | «screen reference, role viewer, state confirm-delete, at 320px: a control marked data-model-action="deleteItem" is on the page, and viewer may not run deleteItem: draw the control only for a role that may run it; a locked button still counts as seen», và cùng câu cho các trạng thái khác nơi nút hiện |
| Tiêu chí 4: `viewer` thấy nút xoá bị khoá                      | 2 đỏ, 6 xanh | «screen reference, role viewer, state confirm-delete, at 320px: a control marked data-model-action="deleteItem" is on the page on the way to the state, which was not reached, and viewer may not run deleteItem: …»                                                                                         |
| Tiêu chí 5: `viewer` mở được màn `overdue`                     | 2 đỏ, 6 xanh | «screen overdue, role viewer, at 320px: viewer may not open the screen, and the words of its first state, ready («Gói hỗ trợ»), are on the page at /overdue. Show a role that may not open the screen nothing of it»                                                                                         |
| Trang chặn không có tiêu đề cấp một                            | 2 đỏ, 6 xanh | «screen overdue, role viewer, at 320px: viewer may not open the screen, and the page at /overdue has 1 main regions and 0 top headings. What such a role is shown instead is still a page, with one of each»                                                                                                 |
| Sau lượt soát: vai bị chặn bị chuyển sang `/`, nơi có cùng lời | 8 xanh       | (bị chuyển đi là lựa chọn của sản phẩm; chỉ trang nơi đến được kiểm là một trang)                                                                                                                                                                                                                            |
| Gỡ hết                                                         | 8 xanh       |                                                                                                                                                                                                                                                                                                              |

Thời gian, khi không gài: `reference` dưới vai `viewer` 21,7 giây mỗi bề rộng; dưới vai `user` 8,7 giây; `overdue`
dưới vai `viewer` 2,1 giây, gần hết là hai giây canh lời đến muộn.

## Điều đọc được

- Nút bị khoá vẫn là thấy, đúng như luật: nút xoá khoá không bấm được, nên vai `viewer` không tới trạng thái hỏi xoá,
  nhưng bài kiểm gặp nút ấy trên đường và đỏ, nói trạng thái không tới được.
- Mỗi câu đỏ nêu màn, vai, thao tác (hay lời của màn), trạng thái nơi thấy, và việc cần làm.
- Nửa «dấu của màn» trong phép so của vai bị chặn chưa đỏ lần nào trong trình duyệt: màn `overdue` không có nút nào của
  thao tác, nên không có gì để gài. Nửa ấy chỉ được bài kiểm thuần (`test-screen-actions-seen.mjs`) chứng.
- Kho này chỉ có một vai, nên `make check` của nó không giữ nửa «không thấy»: dòng giới hạn
  `reference-app-holds-one-role`. Trên repo có đăng nhập thật và nhiều vai, bài kiểm này chưa được thử.
