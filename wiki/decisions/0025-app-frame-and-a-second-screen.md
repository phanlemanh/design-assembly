---
type: decision
title: Khung ứng dụng và màn thứ hai — luật điều hướng có bản dựng thật
links:
  - wiki/decisions/0017-after-an-action.md
  - wiki/decisions/0021-rules-the-builder-guessed.md
  - wiki/decisions/0022-record-beside-a-list.md
  - wiki/decisions/0024-scope-locked-limits-and-trial-briefs.md
sources:
  - src/App.tsx
  - src/example/OverdueScreen.tsx
  - src/components/item-table.tsx
  - src/components/notice.tsx
  - tests/app-frame.test.tsx
  - design/behaviors.md
  - "chủ repo, 2026-11-13: «Dựng khung và màn»"
---

# 0025 Khung ứng dụng và màn thứ hai: luật điều hướng có bản dựng thật

## Status

Accepted. Việc thứ hai của chặng 1; chủ repo bảo dựng ngày 2026-11-13 («Dựng khung và màn»). Hình
dáng của khung và việc chọn màn thứ hai là máy chọn, chờ chủ repo bác.

## Context

Hai luật đã viết nhưng chưa có gì chứng minh. Luật điều hướng nằm trên trang hành vi mà không màn
nào dựng theo, vì repo chỉ có một màn; chính trang đó ghi «dựng khung cùng lúc với màn thứ hai».
Luật tấm hồ sơ phải chừa thanh đầu của khung thì có phép đo trong bài kiểm trình duyệt, nhưng
phép đo chưa từng chạy trên một thanh đầu thật: lần thử trước phải gắn một thanh đầu tạm rồi gỡ
đi.

Luật thứ ba cũng chưa được thử: phần vẽ hai màn dùng chung phải thành linh kiện của repo, ở phần
`shared`. Một màn thì không có gì để dùng chung.

## Decision

1. **Khung ở `src/App.tsx`.** Một thanh đầu dính ở mép trên, trong đó là một vùng điều hướng liệt
   kê mọi màn của `src/screens.ts` theo đúng thứ tự tệp đó ghi. Danh sách màn là nguồn duy nhất:
   khung không giữ danh sách thứ hai. Mỗi màn vì thế có thêm một trường `title`, lấy từ nơi giữ
   chữ của repo.
2. **Màn đang mở mang dấu `aria-current` và một gạch chân**, không chỉ khác màu. Địa chỉ không
   thuộc màn nào thì khung đánh dấu màn đầu, vì đó là màn đang hiện.
3. **Rời màn thì toast ở lại.** Liên kết điều hướng gọi `notifyClear` trước khi đi.
4. **Màn thứ hai là danh sách mục quá hạn** (`/overdue`), cùng kiểu danh sách với màn mẫu. Màn này
   không thêm được mục: mục tới đây bằng cách qua ngày của nó. Nên trạng thái trống của nó không
   có nút, và không việc nào trên dòng đổi dữ liệu.
5. **Ba phần vẽ dùng chung chuyển xuống `src/components/`** (phần `shared`): `ItemTable` vẽ bảng,
   `Notice` vẽ một trạng thái thay cho bảng, `ItemRecord` vẽ hồ sơ, cộng `ITEM_STATUS` là cách mỗi
   tình trạng hiện ra. Màn mẫu dùng lại đúng ba phần đó, nên hai danh sách là một thứ chứ không
   phải hai bản giống nhau.
6. **Màn thứ hai không phải việc của đề chuẩn.** Đề chuẩn của vai dựng màn yêu cầu một màn cho các
   mục đã cất đi; dựng việc đó thật thì lần thử sau chỉ đọc lại bài làm sẵn. Quyết định 0024 đã
   giữ chỗ cho nó, nên màn thứ hai chọn việc khác.

## Consequences

- Phép đo «tấm hồ sơ chừa thanh đầu» chạy trên thanh đầu thật, ở cả hai bề rộng và cả hai màn. Đã
  thấy nó đỏ: cho tấm chạy từ mép trên thì bốn lượt kiểm đỏ với đúng câu «bắt đầu cao hơn đáy
  thanh đầu; có gì đó che thanh đầu».
- Đo trên màn thật: thanh đầu cao 45px, tấm hồ sơ và lớp mờ đều bắt đầu đúng ở 45, thanh đầu vẫn
  bấm được, và tiêu điểm vào nút Đóng.
- Sổ giới hạn: đóng dòng `nav-frame-unbuilt`. Dòng `record-panel-header-bar` thu hẹp lại, còn hai
  phần chưa giải: bàn phím và trình đọc màn hình chỉ tới được thanh đầu sau khi đóng tấm, và vị
  trí thanh đầu chỉ đo lúc mở chứ không đo lại khi cửa sổ đổi cỡ.
- Cổng kiểm: 86 bài kiểm của repo, 72 lượt kiểm trình duyệt (trước là 82 và 48), 213 bài kiểm của
  plugin. Số lệnh kiểm của tầng design không đổi: 23 quyết định, 29 lệnh kiểm.
- Luật điều hướng vẫn **không có lệnh kiểm của cổng**; nó được giữ bằng một bài kiểm của chính
  repo (`tests/app-frame.test.tsx`). Dòng `post-action-rules-uncheck` của sổ giới hạn đã nói điều
  đó và vẫn mở.
- Chữ của màn mẫu đổi từ «Màn mẫu» thành «Mọi mục», vì hai tên đứng cạnh nhau trên thanh điều
  hướng thì phải đọc được như một cặp.
