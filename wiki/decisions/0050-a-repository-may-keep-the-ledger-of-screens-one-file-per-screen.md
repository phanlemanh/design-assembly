---
type: decision
title: "Một repo được giữ sổ màn mỗi màn một tệp: lựa chọn của repo, một bộ đọc cho hai hình dạng, và lệnh tách dừng khi mất mục"
links:
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0049-a-repository-may-keep-the-component-manifest-out-of-git.md
  - wiki/decisions/0048-a-ninth-stage-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0030-one-ledger-of-screens.md
  - wiki/decisions/0029-the-contract-one-shape-per-ledger.md
  - wiki/decisions/0047-tool-stamp-upgrade-and-the-version-rule.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/screen-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-fragments.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/owned/screens-ledger.test.ts.template
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/tests/test-screen-fragments.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - design/screens/_shared.yaml
  - design/theme.json
  - mk/plugin.mk
  - "chủ repo, 2026-11-16: «Duyệt đề bài, luôn nhớ vai trò mà mục đích là hoạt động trên mọi repo và giai đoạn repo.»"
---

# 0050 Một repo được giữ sổ màn mỗi màn một tệp: lựa chọn của repo, một bộ đọc cho hai hình dạng, và lệnh tách dừng khi mất mục

## Status

Accepted, 2026-11-16. Bước 8.1b của đề bài 0005. Máy chọn cách làm trong khuôn đề bài đã duyệt; bốn chỗ lệch với chữ
của đề bài ghi ở mục Decision.

## Context

Sổ màn là sổ ghi tay, mỗi màn một mục, cả sổ một tệp. Ở repo kiểm chứng, 9 trên 30 PR gộp gần nhất chạm tệp này, sáu
lần chỉ để thêm một mục. Hai PR thêm hai màn khác nhau không có lý do gì để đụng nhau; chúng đụng chỉ vì chung một
tệp. Chủ repo duyệt đề bài kèm lời dặn: plugin phải chạy được trên mọi repo, ở mọi giai đoạn của repo. Vì vậy cách làm
không được buộc repo nào đổi, không được vỡ ở repo chưa có gì, và hình dạng cũ phải đọc được mãi.

## Decision

1. **Mỗi màn một tệp là lựa chọn của từng repo, tắt cho tới khi repo bật.** Một lệnh của công cụ đã cài bật nó
   (`screen-fragments.mjs --split`), một lệnh trả lại (`--join`). Repo không bật thì không gì đổi: vẫn một tệp, không
   phép kiểm mới, không tệp nào được viết thêm.
2. **Hình dạng thứ hai là một thư mục.** Thư mục là đường dẫn của sổ bỏ phần đuôi (`design/screens`). Mỗi màn là
   `<mã màn>.yaml`, các khoá của màn viết sát lề. Mọi thứ không phải màn (số hình dạng, kiểu màn, đối tượng, trạng
   thái, khung ứng dụng, hành động không có màn, khoá riêng của repo) nằm ở `_shared.yaml`. Tên mới đều là tiếng Anh.
3. **Một bộ đọc cho cả hai hình dạng, không có hạn chót.** Có thư mục chứa `_shared.yaml` thì đọc thư mục, không thì
   đọc tệp một khối. Thư mục trùng tên mà chứa thứ khác (ảnh chụp màn chẳng hạn) không bị đọc nhầm. Mọi nơi của
   plugin đọc sổ màn qua bộ đọc này: cổng, cuộc dẫn dắt, lệnh nhận, rà soát, lệnh nối sổ màn với mô hình nghiệp vụ, và
   bài kiểm mà cuộc dẫn dắt cài cho repo. Khoá riêng của repo vẫn đi qua bảng ánh xạ khoá như trước.
4. **Tên tệp là mã màn.** Hai màn trùng mã không thể cùng tồn tại; luật ấy nay do cấu trúc giữ. Phép kiểm mới
   `screen-fragments` đỏ khi tên tệp khác mã bên trong, khi tệp không có mã hay thiếu trường bắt buộc, khi tệp phần
   chung tự liệt kê màn, khi tệp một khối nằm lại cạnh thư mục, và khi thư mục biến mất.
5. **Lệnh tách dời dòng, không viết lại.** Ghi chú của người và khoá riêng của repo đi theo màn của chúng. Lệnh in
   trước mọi tệp sẽ ghi và tệp sẽ xoá; `--dry-run` dừng ở đó. Trước khi xoá tệp cũ, lệnh đọc lại các mảnh và so từng
   mục theo cả hai chiều. Nó dừng, không ghi gì, khi một mục mất hay đổi, khi hai mục trùng mã, khi một mã không làm
   được tên tệp, hoặc khi thư mục đã có sẵn tệp sẽ bị đọc thành màn. Tách rồi gộp cho đúng dữ liệu cũ.
6. **Lựa chọn nằm trong dữ liệu công cụ, cạnh phép kiểm hình dạng sổ.** Bước 8.1a đặt lựa chọn của sổ linh kiện cạnh
   phép kiểm của chính sổ ấy. Ở đây chỗ tương ứng là quyết định giữ hình dạng các sổ, vì cả repo do cuộc dẫn dắt dựng
   lẫn repo đã nhận hệ có sẵn đều có quyết định này; quyết định riêng về sổ màn thì chỉ repo do cuộc dẫn dắt dựng mới
   có. Cuộc dẫn dắt và lệnh nhận mang lựa chọn theo ở lần chạy kế, và không viết lại tệp một khối cạnh thư mục. Repo
   chưa có cổng nào giữ sổ vẫn tách được; lệnh nói rõ ở đó chưa có gì kiểm các mảnh.
7. **Lệnh không đụng vào git.** Commit thư mục cùng việc xoá tệp cũ là việc của người, như ở bước 8.1a.
8. **Tệp tổng hợp ở đường dẫn cũ chưa cần ở bước này; nó thuộc bước 8.4.** Căn cứ từ mã:
   - Mọi bên đọc do plugin giao (mục 3) đã đọc được cả hai hình dạng, nên không bên nào cần tệp ở đường dẫn cũ.
   - Bên đọc duy nhất ngoài công cụ ở một repo do cuộc dẫn dắt dựng là bài kiểm được cài một lần. Ở kho này `make
check` chạy bài kiểm trước cổng thiết kế, nên một tệp do cổng vẽ lại sẽ tới muộn trên bản chép sạch. Cho bài kiểm
     ấy đọc thẳng các mảnh mới là cách sửa đúng.
   - Bên thật sự cần tệp ở đường dẫn cũ là các công cụ và bài kiểm riêng của repo kiểm chứng (hơn hai mươi tệp). Thứ
     tự chạy của chúng so với cổng, và việc kit nghiệm thu xử lý tệp bị git bỏ qua, chỉ đo được ở đó.
   - Phần khó đã có sẵn: lệnh `--print` in đúng tệp tổng hợp, và phép so trên bản sao repo kiểm chứng cho thấy nó
     khớp dữ liệu của tệp hôm nay. Bước 8.4 chỉ còn ghi văn bản ấy ra đường dẫn cũ và gắn phép kiểm `untracked` đã có.
9. **Kho này bật lựa chọn ấy.** Sổ màn của kho là hai mảnh và một tệp phần chung; cổng giữ 37 quyết định bằng 45 phép
   kiểm.

Lệch với đề bài 0005:

- Đề bài viết sổ màn «lên hình dạng 2». **Số hình dạng giữ nguyên 1.** Thư mục mảnh là cách xếp thứ hai của cùng một
  dữ liệu; đổi số sẽ làm «tách rồi gộp» không còn cho đúng dữ liệu cũ. Khoá `sizes` của bước 8.2 mới là thay đổi dữ
  liệu, và sẽ mang số mới.
- Đề bài viết tệp ở đường dẫn cũ là vật dẫn xuất được vẽ lại trước mọi phép kiểm. **Bước này chưa dựng phần ấy**, vì
  lý do ở mục 8.
- Đề bài để việc tách cho `upgrade`. **Tách là một lệnh của công cụ đã cài**, repo ở giai đoạn nào cũng gọi được;
  `upgrade` sẽ gọi cùng hàm ấy ở bước 8.4. Cùng lý do như quyết định 0049.
- Đề bài không nói về thứ tự. **Giữ theo mảnh thì màn được đọc theo thứ tự mã**, vì một danh sách thứ tự chung sẽ lại
  là tệp mọi PR cùng sửa.

## Consequences

- Hai nhánh, mỗi nhánh thêm một màn, gộp vào nhau không xung đột ở thư mục thiết kế. Bài kiểm đối chứng cho thấy
  cũng hai nhánh ấy xung đột khi sổ là một tệp.
- PR ở kho này thêm màn bằng một tệp mới; người duyệt đọc đúng tệp của màn ấy.
- Đã thử trên năm dáng repo dựng tạm: do cuộc dẫn dắt dựng; đã nhận hệ có sẵn rồi mới tách; đã ở dạng mảnh rồi mới
  nhận; chưa có gì (không sổ, không dữ liệu công cụ, không `Makefile`, không nằm trong git); và chỉ có sổ mà không có
  cổng. Thêm một phép so trên bản sao sổ màn và mô hình nghiệp vụ của repo kiểm chứng: 9 màn, không mục nào mất, kết
  quả nối với mô hình không đổi, gộp lại cho đúng dữ liệu cũ. Phép so ấy chạy trong `make check` và có lệnh riêng
  `make design-screen-fragments-reference`; không lệnh nào ghi vào repo thật.
- Chưa thử: các công cụ và bài kiểm riêng của repo kiểm chứng trên thư mục mảnh; kit nghiệm thu; `upgrade` trên repo
  đã tách; máy Windows. CI của kho này không có repo kiểm chứng, nên phép so trên bản sao chỉ chạy ở máy có nó.
- 28 bài kiểm mới. 25 bài đã được thấy đỏ trước khi dựng hoặc trước khi sửa. Ba bài xanh từ lần chạy đầu: bài đối
  chứng (hai nhánh đụng nhau khi sổ là một tệp, tức hành vi hôm nay), bài giữ hai trang tài liệu của plugin (viết sau
  trang), và bài «hai hình dạng nằm cạnh nhau thì lệnh từ chối» (mã đã từ chối sẵn, chỉ thiếu bài).
- Lần đọc lại trước khi xoá tệp cũ là lưới thứ hai: chưa đầu vào nào đã thử chạm tới nó. Hàm so mục của nó được thử
  trực tiếp bằng cách bỏ mục bằng tay.
- Một tác tử độc lập đọc lại thay đổi trước khi commit: không lỗi nặng, ba điểm mức vừa và năm điểm nhẹ. Đã sửa kèm
  bài kiểm: lệnh ghi dở khi đĩa từ chối nay hoàn lại mọi thứ nó vừa ghi; lời gọi sai (cờ lạ, `--target` thiếu thư
  mục) nay bị từ chối thay vì chạy như không có gì; ghi chú nằm ngay trên dòng khoá danh sách màn nay được nêu đúng
  là nguyên nhân; mã trùng tên dành riêng của Windows bị từ chối; hai mảnh chỉ khác chữ hoa bị cổng nêu. Để lại, ghi
  thành dòng giới hạn: ghi chú sát lề danh sách đi theo màn đứng sau nó; dấu xuống dòng đổi về một kiểu.
- Một lỗi có sẵn lộ ra và đã sửa kèm bài kiểm: phép kiểm sổ màn tự chứng bằng cách bỏ mục cuối của sổ, nên khi mục
  cuối là một màn mới ở mức «dự kiến» thì cổng đỏ nhầm. Đọc theo thứ tự mã làm tình huống ấy dễ gặp hơn. Nay bản đối
  chứng thêm một màn vào phía mã, không phụ thuộc mục nào đứng cuối.
- Bài kiểm của plugin đọc thẳng tệp một khối của kho này đã đổi sang bộ đọc chung: đó là kỳ vọng cũ, không phải lỗi.
- Tám dòng giới hạn mới, đều đang mở; nặng nhất là: công cụ riêng của một repo còn đọc tệp một khối sẽ không thấy
  tệp sau khi tách, và `upgrade` chưa mời tách.
- Số bản plugin lên `0.3.0`.
