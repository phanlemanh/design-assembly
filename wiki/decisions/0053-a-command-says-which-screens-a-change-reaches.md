---
type: decision
title: "Một lệnh chỉ đọc nói thay đổi chạm màn nào, ở khổ nào; không lần được thì trả trọn bộ"
links:
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0050-a-repository-may-keep-the-ledger-of-screens-one-file-per-screen.md
  - wiki/decisions/0047-tool-stamp-upgrade-and-the-version-rule.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/affected.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/nextjs.mjs
  - plugins/design-assembly/templates/tools/design-assembly/governance.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/mk/design-assembly.mk
  - plugins/design-assembly/tests/test-affected.mjs
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - docs/trials/affected-on-a-reference-copy.md
  - "chủ repo, 2026-11-16: «Làm 8.2»"
---

# 0053 Một lệnh chỉ đọc nói thay đổi chạm màn nào, ở khổ nào; không lần được thì trả trọn bộ

## Status

Accepted, 2026-11-16. Bước 8.2 của đề bài 0005, phần B. Máy chọn cách làm trong khuôn đề bài đã duyệt; hai chỗ lệch
với chữ của đề bài nằm cuối mục Decision.

## Context

Mỗi PR hôm nay chạy mọi bài trình duyệt ở mọi khổ, dù chỉ một màn đổi. Đề bài 0005 muốn một lệnh nói thay đổi chạm màn
nào, để bên chạy bài chọn được. Lệnh ấy chỉ nói; chọn bài trong CI là việc của Repo Standards (gói RS3).

## Decision

1. **Lệnh nằm trong công cụ đã cài: `tools/design-assembly/affected.mjs`, chạy bằng `make design-affected`.**
   - CI của một repo gọi được nó mà không cần plugin. Vì vậy nó không phải lệnh hội thoại của plugin.
   - Lệnh theo hợp đồng chung của các lệnh: `--target`, `--json`, thoát 0 khi có câu trả lời, 2 khi gọi sai hoặc repo
     không đọc được. Nó không bao giờ ghi.
   - Thay đổi đọc từ git: khác biệt so với chỗ nhánh tách khỏi nhánh chính, cộng phần chưa commit và tệp git chưa biết.
     `--base` đo từ chỗ khác. `--files` nêu thẳng tệp đổi, không cần git.
2. **Tệp → màn: theo `import`, từ tệp trang của mỗi màn đã dựng.**
   - Bộ đọc `import` của tầng governance được mở rộng một hàm đi hết các tệp mà tệp trang kéo vào. Vẫn chỉ có một bộ
     đọc. Phép kiểm chiều nhập của tầng governance giữ nguyên cách đọc cũ, để cổng của repo nào cũng không đổi màu.
   - Phép lần màn đọc rộng hơn, như bên dựng đọc:
     - `require()`, và `import()` viết bằng chuỗi khuôn;
     - bí danh của `tsconfig.json`;
     - tên đuôi `.js` cho tệp `.ts` mà nó được dựng từ;
     - tệp dữ liệu hay stylesheet mà mã nhập.
   - Một `import` của chính repo không trỏ tới tệp nào, hoặc tên ghép lúc chạy, thì không lần được. Khi một màn có
     `import` như thế, mọi thay đổi của mã đòi trọn bộ.
   - Tệp trang tìm theo hai cách. Cách thứ nhất là danh sách màn trong mã, như ứng dụng mẫu.
   - Cách thứ hai dành cho repo xếp màn theo thư mục: bộ chuyển tiếp mới `nextjs`, loại `routes`.
     - Nó bỏ nhóm `(group)` và khe `@slot` khỏi đường dẫn.
     - Nó coi `layout`, `template`, `loading` và `error` trên đường đi của trang là một phần của màn.
   - Mảnh `design/screens/<id>.yaml` chỉ kéo đúng màn của nó.
3. **Luật an toàn: không lần được thì trả trọn bộ, kèm lý do.** Các trường hợp:
   - stylesheet mà dữ liệu công cụ nêu;
   - tệp mà dữ liệu công cụ khai toàn cục;
   - sổ màn một tệp, hoặc phần chung của sổ mảnh;
   - tệp không thuộc màn nào;
   - mọi tệp mã khi có một màn không tìm được tệp trang;
   - repo không có sổ màn.
4. **Mã mà máy chủ tự chạy cũng đòi trọn bộ.**
   - Bộ chuyển tiếp nêu điểm vào phía máy chủ: route handler, middleware, instrumentation.
   - Tệp nào nằm trong tập của một điểm vào như thế thì đòi trọn bộ, kể cả khi một trang nhập nó. Lý do: một màn khác
     có thể gọi mã ấy lúc chạy, mà không `import` nào cho thấy.
   - Luật này có ra từ phép đo trên repo kiểm chứng: lần đầu, hai PR ở đó bị thu hẹp đúng kiểu có thể bỏ sót màn.
5. **Bản đồ thay đổi khai trong dữ liệu công cụ:** `"affected": { "global": [...], "none": [...] }`, viết dạng glob.
   - `global` là tệp chạm mọi màn; `none` là tệp không chạm màn nào, như tài liệu. Mặc định cả hai rỗng: mọi tệp
     không lần được đều đòi trọn bộ.
   - Luật của lệnh đứng trước bản đồ. Tệp một màn nhập vẫn là của màn ấy dù `none` nói gì, và sổ màn vẫn đòi trọn bộ.
   - Hướng dẫn và `adopt` giữ khoá ấy nguyên như người viết.
   - Kho này khai: khung ứng dụng là toàn cục; wiki, tài liệu và tệp `.md` ở gốc không chạm màn.
6. **Màn → khổ màn:** khoá `sizes` tuỳ chọn trên một màn, viết bằng số. Không khai thì dùng `screen-sizes.json`.
7. **Màn → bài:** lệnh trả `grep`, một mẫu chọn bài có tên chứa đường dẫn màn như một từ riêng. Bài không nêu màn nào
   là việc của bên chạy bài.
8. **Bảng từ vựng thêm `test impact analysis`.**

Lệch với đề bài 0005:

- Đề bài viết sổ màn «lên hình dạng 2» với khoá `sizes`, và quyết định 0050 nói `sizes` sẽ mang số mới. **Số hình dạng
  giữ nguyên 1.** `sizes` là khoá tuỳ chọn. Công cụ cũ đọc nó như khoá riêng của repo mà không báo lỗi, nên không gì
  mất. Lên số 2 thì công cụ cũ sẽ thôi ghi mọi sổ màn, mà không được gì.
- Đề bài đặt `affected` cạnh các lệnh hội thoại. **Nó là lệnh của công cụ đã cài**, vì bên đọc nó là CI của repo.

## Consequences

- Trên ứng dụng mẫu: tệp riêng của một màn chỉ chọn màn ấy; tệp hai màn cùng dùng chọn cả hai. Stylesheet, khung ứng
  dụng và tệp cấu hình dựng thì đòi trọn bộ. Tiêu chí 6 đạt.
- Trên 30 PR đã gộp của repo kiểm chứng (`docs/trials/affected-on-a-reference-copy.md`), không PR nào thiếu màn mà
  hợp đồng khai, ở mọi lần chạy. Tiêu chí 7 đạt về mặt an toàn. Số PR thu hẹp được:
  - với bản đồ chỉ khai tệp không phải mã: 3 trên 30;
  - với mức trần giả định: 9 trên 30.

  Lý do: PR ở đó chạm bài kiểm, cơ sở dữ liệu và mô hình nghiệp vụ; lớp vỏ ứng dụng của repo ấy cũng kéo khoảng 155
  tệp vào mọi màn nhân viên.

- Chưa có gì chạy bớt bài theo lệnh này. Dòng giới hạn `affected-not-used-by-a-runner` giao việc ấy cho Repo Standards.
- Ba dòng giới hạn mới:
  - `affected-reach-beyond-imports`: đường chạm lúc chạy mà `import` không cho thấy;
  - `affected-imports-through-one-alias`: chỉ đọc đường dẫn tương đối và `@/`;
  - `affected-app-folder-under-src-only`: thư mục trang chỉ tìm dưới `src/app`.
- Bài kiểm mới: 19 bài ở `test-affected.mjs`.
  - Cả tệp được thấy đỏ trước khi có mã.
  - Bảy chỗ chính được thấy đỏ bằng cách tạm làm hỏng mã rồi trả lại: đi theo `import`, tệp toàn cục, tệp không lần
    được, layout bọc trang, hướng dẫn giữ bản đồ, mảnh của màn, màn không tìm được trang.
  - Hai chỗ thêm sau cũng được thấy đỏ: luật máy chủ trước khi dựng, và `adopt` giữ bản đồ.
- Một tác tử độc lập đọc lại thay đổi. Mọi điểm đã sửa kèm bài kiểm, và mỗi bài được thấy đỏ bằng cách tạm trả mã về.
  - **Hai điểm mức cao, đều dựng lại được.**
    - Có những dạng `import` mà bộ đọc không thấy, như `require`, chuỗi khuôn, đuôi `.js` hay bí danh `~/`. Một tệp
      chung mà màn A lần tới, còn màn B tới qua một dạng ấy, thì lệnh chỉ chọn A: đúng kiểu bỏ sót mà luật an toàn
      phải chặn.
    - Danh sách thay đổi từ git có thể bị cắt cụt mà không báo khi vượt 1 MB. Lỗi của git cũng bị đọc thành «không đổi
      gì».
  - **Ba điểm mức vừa:** đường dẫn của git khi `--target` là thư mục con; phần bỏ chú thích xoá mất mã khi `/*` nằm
    trong một chuỗi; `--help` thoát 2 khi `--target` sai.
  - **Một điểm mức nhẹ:** `--base` chưa được chắn để git không đọc nó như một cờ.
  - Phép đo được chạy lại sau các sửa: vẫn không thiếu màn nào.
- Số bản plugin lên `0.6.0`.
