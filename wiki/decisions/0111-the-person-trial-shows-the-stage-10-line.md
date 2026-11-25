---
type: decision
title: "Lượt thử có người cho thấy dòng «xong khi» của giai đoạn 10, với bốn điều kèm theo"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0108-session-names-go-one-to-a-flag.md
  - wiki/decisions/0097-frontend-design-measured-at-the-screen-build-socket.md
sources:
  - docs/trials/person-trial-two-screen-arms.md
  - docs/trials/person-trial-stopped-at-the-plugs-step.md
  - docs/trials/frontend-design-measured-at-screen-build.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/scripts/apply.mjs
  - docs/plan/plan.json
  - "chủ repo, 2026-11-25, qua phiên điều phối: «frontend-design, review», đáp hai câu chọn phích của bước plugs"
  - "chủ repo, 2026-11-25, qua phiên điều phối: «Đi tiếp, sửa riêng», đáp câu «Đi tiếp lượt này và sửa lỗi bằng PR riêng, hay dừng để sửa trước rồi chạy lại?»"
---

# 0111 Lượt thử có người cho thấy dòng «xong khi» của giai đoạn 10, với bốn điều kèm theo

## Status

Accepted, 2026-11-25, mục 10.4 của kế hoạch, plugin 0.58.0. Mục 10.4 chuyển sang xong. Giai đoạn 10 chưa đóng ở đây.

## Context

Dòng «xong khi» của giai đoạn 10 có hai nửa:

- trên một repo mới, chủ repo chọn phích cho các ổ trong một lượt không quá bốn câu;
- một màn dựng qua phích ngoài đã chọn vẫn qua cổng, số chỗ đoán không tăng, và số lần quyết thay bằng 0.

Lượt thử đầu dừng ở bước plugs ([0108](0108-session-names-go-one-to-a-flag.md)). Lượt này chạy lại từ đầu, trên bản sao
mới của `e56e77c`, với plugin `d3be68a` và ba tác tử mới. [Bản ghi](../../docs/trials/person-trial-two-screen-arms.md).

## Decision

1. **Nửa đầu được cho thấy.**
   - Bước plugs của `new` đọc đủ 264 skill phiên liệt kê, cùng 23 server và 14 server chờ đăng nhập. Nó hỏi hai câu: ổ dựng màn
     và ổ soát thiết kế.
   - Chủ repo đáp một lần, «frontend-design, review», và hai dòng `plug-*` vào sổ quyết định.
2. **Nửa sau được cho thấy** trên hai nhánh dựng màn cùng đề, cùng bản sao.
   - **Nhánh A** được bảo bằng lời dùng skill chủ repo chọn, và có gọi skill ấy. Cổng xanh. Nó có 14 chỗ phải đoán: 10 vào hàng
     chờ, 4 lặng lẽ. 0 lời đáp ghi thay chủ repo.
   - **Nhánh B** dựng qua phích của plugin. Nó cũng có 14 chỗ: 11 vào hàng chờ, 3 lặng lẽ.
   - Đọc chặt hay lỏng thì A cũng không cao hơn B.
3. **Mục 10.4 xong.** Bốn điều đứng cạnh nó:
   - **Nhánh A tới skill ấy chỉ vì được bảo bằng lời.** Nhánh B không gọi nó, dù sổ quyết định ghi `plug:frontend-design`.
     Dòng `screen-build-plug-reached-only-when-told` còn mở và nay có thêm bằng chứng.
   - **Cổng của repo mới chỉ xanh sau hai câu nhập kho mà plugin đáng lẽ không phải hỏi.**
     - Bước dựng đặt `HeldLabel` và `WithRecord` của kit khởi đầu mà không ghi dòng sổ nào.
     - `find` đọc chúng là đồ của repo.
     - Chủ repo cho đi tiếp và sửa riêng («Đi tiếp, sửa riêng»). Bản sửa: PR #139, quyết định 0110.
   - **`src/lib/notify.ts` không có ở `e56e77c`.** Đề màn vẫn giữ nguyên văn (cách (a)). Điều này sinh một chỗ đoán ở mỗi
     nhánh và cắt chuỗi so sánh với lần 12 đến 14 và 17.
   - **Mỗi nhánh một lượt.** Ổ soát thiết kế được ghi, không chạy.
4. **Những điều được đề xuất mà chưa ai xác nhận** vẫn chờ trên bảng quyết định của bản sao, và được đếm là chỗ nhánh dẫn
   dắt quyết một mình:
   - ba nguyên tắc;
   - cách mở bản ghi `beside`;
   - loại sản phẩm.
5. **Dòng giới hạn mới:**
   - `modular-step-below-the-floor-noted-only`: bậc `text-xs` 11px của thang quãng ba thứ chỉ là một ghi chú, và cổng không
     giữ cỡ nhỏ nhất. Đây là chủ ý của `apply.mjs`, nên dòng ở ngăn giữ.
   - `laid-parts-cite-pages-the-floor-lacks`: linh kiện bước dựng đặt nêu những phần của `design/behaviors.md`, cùng
     `design/parts.json` và trang kiểu, mà một repo mới không có.

## Consequences

- Giai đoạn 10 có đủ bằng chứng cho dòng «xong khi», kèm bốn điều trên. Đóng giai đoạn là việc của một thay đổi khác, cùng
  giai đoạn 11 («Đóng cùng 10»).
- Dòng `plugs-session-listed-by-the-skill` vẫn mở:
  - skill đã được truyền đủ;
  - server thì không: 10 server hoãn không được truyền, phần lớn là server của chính ứng dụng;
  - chưa phép kiểm nào cho thấy danh sách đủ.
- Chi phí của lượt đã dừng (284 299 token) đứng cạnh chi phí của lượt này, không gộp vào.
