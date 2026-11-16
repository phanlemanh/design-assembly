---
type: decision
title: "Vật dẫn xuất ngoài git được vẽ trước bên đọc của repo: một lệnh vẽ, bản một tệp của sổ màn, và upgrade không coi chúng là mất"
links:
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0049-a-repository-may-keep-the-component-manifest-out-of-git.md
  - wiki/decisions/0050-a-repository-may-keep-the-ledger-of-screens-one-file-per-screen.md
  - wiki/decisions/0047-tool-stamp-upgrade-and-the-version-rule.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/derived.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-fragments.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/mk/design-assembly.mk
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/tests/test-screen-copy.mjs
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - docs/trials/ledgers-on-a-reference-copy.md
  - "chủ repo, 2026-11-16: «Làm tệp tổng hợp»"
---

# 0051 Vật dẫn xuất ngoài git được vẽ trước bên đọc của repo: một lệnh vẽ, bản một tệp của sổ màn, và upgrade không coi chúng là mất

## Status

Accepted, 2026-11-16. Phần còn thiếu của mục 8.1, theo đề bài 0005 («tệp ở đường dẫn cũ là vật dẫn xuất, không
commit»). Máy chọn cách làm; chủ repo chọn làm phần này trước 8.1c.

## Context

Lần thử bước 8.1a và 8.1b trên một bản sao của repo kiểm chứng (`docs/trials/ledgers-on-a-reference-copy.md`) cho
thấy hai chỗ gãy. Thứ nhất, cổng của repo ấy chạy bài kiểm trước bước thiết kế, nên sổ linh kiện mà cổng tự vẽ lại thì
tới muộn: trên bản chép sạch, 5 bài đỏ. Thứ hai, sau khi tách sổ màn, hơn hai mươi chỗ của repo còn đọc tệp một khối:
99 bài và hai bước khác của cổng đỏ. Quyết định 0050 đã để phần tệp tổng hợp cho bước 8.4; lần thử cho thấy 8.1c sẽ gặp
đúng vấn đề này, nên làm nó một lần, dùng chung.

## Decision

1. **Một lệnh vẽ mọi vật dẫn xuất ngoài git: `derived.mjs`.** Nó đọc dữ liệu công cụ, viết lại từng tệp repo giữ ngoài
   git khi tệp thiếu hoặc cũ, và nói đã viết gì. Repo không giữ tệp nào ngoài git thì nó không viết gì. Cổng gọi nó
   trước khi kiểm, thay cho phần vẽ riêng của cổng ở bước 8.1a; phần ấy chuyển hẳn sang đây, không còn hai bản.
2. **Bản một tệp của sổ màn là lựa chọn của từng repo, tắt cho tới khi bật.** `screen-fragments.mjs --copy` bật,
   `--no-copy` tắt. Bản ấy là vật dẫn xuất: thư mục vẫn là sổ, bản một tệp được viết từ thư mục và nằm ngoài git, giữ
   bằng phép kiểm `untracked` đã có từ bước 8.1a, đặt cạnh phép kiểm mảnh. Lệnh từ chối khi sổ còn là một tệp, và khi
   không có cổng nào giữ hình dạng sổ, vì khi ấy không gì viết bản ấy.
3. **Phép kiểm mảnh nhận bản một tệp đúng một cách.** Tệp một khối nằm cạnh thư mục vẫn là «hai nguồn», trừ khi repo đã
   bật bản một tệp và tệp đúng bằng văn bản ghép từ thư mục. Cổng vẽ lại bản ấy trước khi kiểm, đè cả bản sửa tay,
   như với sổ linh kiện: thư mục là nơi duy nhất một màn đổi. Chỉ trạng thái đọc mà không qua bước vẽ, như bản xem
   trước của `upgrade`, mới có thể mang một bản khác thư mục; khi ấy phép kiểm nêu nó.
4. **`--join` viết tệp một khối vào chỗ của bản sao và tắt cả hai lựa chọn**, kèm việc cho người: bỏ dòng khỏi
   `.gitignore` rồi commit. Bản sao bị sửa tay thì `--join` từ chối, không ghi đè. `--split` không coi bản sao là
   nguồn thứ hai. `--no-copy` xoá bản sao khi nó khớp thư mục, để lại khi nó bị sửa tay.
5. **Bước `make` của plugin có `design-derived`, và `make test` chờ nó khi `test` là một bước của cổng.** Điều kiện
   đọc `CHECK_TARGETS` lúc tệp được nạp. Repo mà cổng không có `test`, hoặc nạp tệp trước khi đặt `CHECK_TARGETS`, thì
   `test` không đổi gì. Ở bước này lệnh chỉ nói khi nó viết, và bước bị bỏ qua khi công cụ đã cài còn là bản chưa có
   lệnh, nên repo không bật gì thấy `make test` như cũ.
6. **`upgrade` không coi mục nào của tệp ngoài git là mất.** Trên bản chép sạch tệp ấy không có, nên trước đây `upgrade`
   so với rỗng, đếm một mục mất và dừng. Nay nó vẽ lại tệp ấy, nói «kept out of git: nothing in it is a person's», và
   đi tiếp. Lỗi này lộ ra ở lần thử; quyết định 0049 đã ghi «chưa thử `upgrade` trên repo đã bật».

## Consequences

- Trên bản sao của repo kiểm chứng, bản chép sạch không có sổ linh kiện lẫn bản một tệp: `make -k check` vẽ cả hai trước
  bài kiểm, mọi bước xanh trừ 2 bài. Hai bài ấy là của repo kiểm chứng, chờ màn đứng theo thứ tự người viết, trong khi
  thư mục mảnh đọc theo thứ tự mã (dòng giới hạn `screen-fragments-order-is-the-ids`). Sửa hai bài ấy là việc của repo
  đó, ở bước 8.4.
- Repo không bật lựa chọn nào: không phép kiểm mới, không tệp nào được viết, `make test` in đúng như trước.
- Hai dòng giới hạn đóng: `out-of-git-file-absent-before-the-gate` và `screen-fragments-own-readers-get-no-file`. Một
  dòng mới hẹp hơn còn mở: `derived-files-not-written-for-a-runner-alone`. Bài kiểm chạy thẳng bằng trình chạy, như
  kit nghiệm thu chạy một tệp bài, không qua `make` nên không được vẽ trước. Bước `make` mới cũng chưa tới repo nào qua
  `upgrade` (dòng `upgrade-leaves-gate-step`); ở lần thử, nó được chép tay.
- Kit nghiệm thu vẫn đọc bậc M1 trên worktree mới cho tới khi có gì đó vẽ sổ linh kiện. Đó là việc của kit; dòng giới
  hạn `out-of-git-manifest-lowers-kit-tier` đổi sang «hand-off».
- Thứ tự còn một bẫy với lệnh sinh riêng của repo: ở lần thử, bảng vai × màn × nút sinh trước khi bản một tệp được vẽ
  thì chỉ thấy 1 màn. Lệnh sinh của repo phải chạy sau `derived.mjs`; bước 8.4 phải nối hai việc ấy.
- Bài kiểm mới: 17 bài ở `test-screen-copy.mjs`, một ở `test-components.mjs`, một ở `test-upgrade.mjs`. Mười bốn bài
  của tệp mới được thấy đỏ trước khi dựng. Bài của `upgrade` được thấy đỏ đúng như ở lần thử. Hai bài viết sau lần đọc
  lại được thấy đỏ bằng cách tạm trả mã về bản trước khi sửa. Hai bài xanh từ lần chạy đầu: bài repo đã nhận (lệnh
  nhận vốn không viết lại dữ liệu cũ) và bài `derived.mjs` vẽ sổ linh kiện (viết sau khi lệnh đã có).
- Một tác tử độc lập đọc lại thay đổi: không lỗi nặng, ba điểm mức vừa, đều đã sửa. Tài liệu từng nói cổng đỏ khi bản
  một tệp bị sửa tay, trong khi cổng vẽ đè nó; nay tài liệu nói đúng điều cổng làm. Repo không bật gì từng thấy
  `make test` in thêm một dòng và gãy khi công cụ cài còn cũ; nay im lặng và bỏ qua. Dữ liệu công cụ không phải JSON
  từng ném nguyên vết lỗi; nay lệnh và cổng nêu tên tệp. Bốn điểm nhẹ: một sửa (dòng hướng dẫn của `--dry-run`), một
  ghi thành dòng giới hạn `screen-copy-left-at-old-path` (đổi đường dẫn sổ thì bản cũ nằm lại), hai để lại (thứ tự
  `make -j`, thứ tự dòng nhập).
- Bộ dựng repo tạm của bài sổ màn chuyển sang `tests/helpers/guided-repo.mjs`, dùng chung cho bài mới.
- Số bản plugin lên `0.4.0`.
