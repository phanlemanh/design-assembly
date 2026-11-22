---
type: decision
title: "upgrade ghi cả bước cổng, chỗ giáp với Repo Standards được ghim từ phía kho này, và một lệnh đọc màn cho kit nghiệm thu"
links:
  - wiki/specs/0013-the-two-neighbours-call-and-read.md
  - wiki/decisions/0085-adopt-starter-lays-the-ledgers-a-repository-has-from-birth.md
  - wiki/decisions/0053-a-command-says-which-screens-a-change-reaches.md
  - wiki/decisions/0030-one-ledger-of-screens.md
sources:
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/templates/mk/design-assembly.mk
  - plugins/design-assembly/templates/tools/design-assembly/host-make.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-facts.mjs
  - plugins/design-assembly/templates/tools/design-assembly/derived.mjs
  - plugins/design-assembly/references/host-strings.json
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/upgrade/SKILL.md
  - plugins/design-assembly/tests/test-seam.mjs
  - plugins/design-assembly/tests/test-screen-facts.mjs
  - plugins/design-assembly/tests/test-upgrade.mjs
  - "repo-standards, chỉ đọc, nhánh chính ở b488860, ngày 2026-11-22: docs/seam-contracts.md mục 1, 2 và 5; plugins/repo-setup/presets/_core/starter/mk/derived.mk; plugins/repo-setup/scripts/make_wiring.py"
  - "chủ repo, 2026-11-22: «Duyệt cả tám», đáp câu «Duyệt đề bài 0013 theo cả tám khuyến nghị?»"
---

# 0086 upgrade ghi bước cổng, chỗ giáp được ghim, và một lệnh đọc màn

## Status

Đã nhận, 2026-11-22. Lát 2 của đề bài [0013](../specs/0013-the-two-neighbours-call-and-read.md), tiêu chí 6, 7 và 8,
thuộc mục 6.1; lệnh đọc màn cũng phục vụ mục 6.2. Chủ repo duyệt đề bài và cả tám câu hỏi («Duyệt cả tám»). Plugin
0.35.0.

## Context

- `upgrade` đưa công cụ, dấu bản và các sổ máy ghi lên bản mới, nhưng không đụng bước cổng `mk/design-assembly.mk`. Một
  thay đổi của plugin ở bước cổng không tới được repo nào nhận plugin từ trước (giới hạn `upgrade-leaves-gate-step`).
- Trang hợp đồng chỗ giáp của Repo Standards nêu bốn điều phía kho này chưa giữ:
  - bốn khoá của lệnh `affected` mà bộ chọn bài kiểm đọc, chưa có bài kiểm nào ở kho này ghim;
  - đích dẫn xuất của plugin nối riêng vào `test`, trong khi sàn có danh sách chung `DERIVED_TARGETS`, `DERIVED_FILES`;
  - không ai liệt kê những chuỗi plugin đọc trong Makefile, `mk/` và workflow của repo chủ;
  - `status` trên một repo chưa có sàn kết bằng «nothing to run now», như thể không thiếu gì.
- Kit nghiệm thu khai lại bằng tay màn và trạng thái của mỗi tính năng, dù sổ màn đã là vật máy đọc được.

## Decision

1. **`upgrade` ghi bước cổng, nguyên tệp.** Bước cổng là tệp của plugin. Khi nó khác bản của plugin đã cài, hoặc không
   có, `upgrade` ghi lại. Bản xem trước nói điều ấy trên dòng `gate step`, và khoá `gate_step` của JSON thay cho khoá
   `left` cũ. Cổng sau khi nâng được đo với bước cổng mới: phép kiểm «công cụ có trong cổng» đọc bước sẽ được ghi, không
   đọc bước trên đĩa. Makefile của repo vẫn không bao giờ bị ghi. Giới hạn `upgrade-leaves-gate-step` đóng.
   - `upgrade` không phân biệt được dòng của một bản plugin cũ với dòng người thêm tay. Nên nó nêu từng dòng của bước
     cổng trong repo mà bản mới không có (`drops:`, khoá `dropped`), để người đọc trước khi chạy. Người soát độc lập chỉ
     ra chỗ này: bản đầu ghi đè mà không nói mất gì.
2. **Bước cổng khai đích dẫn xuất vào danh sách chung.** `DERIVED_TARGETS += design-derived`, và
   `DERIVED_FILES +=` các tệp dữ liệu công cụ để ngoài git. Danh sách tệp in bởi `derived.mjs --list`, một cờ mới chỉ
   đọc. Cổng của Repo Standards chạy mọi đích trong danh sách trước các bước kiểm, nên plugin không nối vào `test` nữa.
   - Cổng dựng trước khi có danh sách chung (như cổng của kho này) không có bước `derived`. Ở đó bước cổng vẫn bắt
     `test` chờ đích dẫn xuất, nhưng chỉ khi không tệp `mk/` nào đọc trước nó đã định nghĩa `DERIVED_TARGETS`.
   - Nếu danh sách được định nghĩa ở một tệp đọc sau, đích chạy từ cả hai lối, mà make chỉ chạy một đích một lần.
   - Khai vào `DERIVED_FILES` chưa làm cổng của Repo Standards bắt thêm gì: phép kiểm của họ chỉ bắt tệp mang dấu
     `sha256:` của tệp vẽ ra, còn tệp JSON của plugin không mang dấu ấy. Phép kiểm riêng của công cụ vẫn là bên bắt một
     bản lọt vào git. Tệp tham chiếu nói rõ điều này.
3. **Một mô-đun đọc Makefile và `mk/`, một tệp tham chiếu liệt kê những gì nó đọc.**
   - Mọi chuỗi plugin đọc trong Makefile, `mk/` và workflow của repo chủ nằm ở `host-make.mjs`: mẫu dòng `include`, cú
     pháp dòng luật, đích `check`, từ `$(CHECK_TARGETS)`, hai dòng của bước cổng, đường dẫn công cụ, các biến
     `DERIVED_*`. Năm chỗ trong mã trước đây tự mở các tệp ấy nay gọi mô-đun này.
   - `references/host-strings.json` liệt kê đúng các chuỗi ấy (mười hai chuỗi đọc, ba dòng ghi), để Repo Standards ghim
     từ phía họ. Plugin không đọc workflow nào.
   - Tệp cũng nêu đích danh các đường công cụ mà một dòng sổ có thể trỏ tới và cổng phải gọi: công cụ của plugin, và
     `tools/design_guards.mjs` của sàn (ba dòng `lint-exceptions`, `terms`, `checks-in-gate`). Nếu Repo Standards dời
     lời gọi ấy khỏi Makefile và `mk/`, ba dòng ấy đỏ. Bài kiểm đỏ khi `known-proofs.json` có đường công cụ mà tệp không
     nêu. Người soát độc lập chỉ ra chỗ này.
   - Một bài kiểm đỏ khi tệp tham chiếu và mô-đun khác nhau, và khi một mô-đun khác tự mở các tệp ấy hay so chữ của
     chúng. Bài kiểm nhận ra việc đọc qua tên tệp, tên danh sách của cổng và tên bước cổng. Một mẫu không nêu tên nào trong
     số ấy thì lọt: giới hạn mới `host-strings-found-by-names`.
4. **`status` trên repo chưa có sàn nói điều còn thiếu.** Thiếu stylesheet (tìm như `adopt` tìm: chỗ dữ liệu công cụ
   ghi, chỗ tệp cài đặt linh kiện ghi, rồi chỗ quen), hoặc Makefile không gom `mk/*.mk`, thì
   dòng cuối nói đúng điều ấy, và nói `adopt --starter` đặt sổ khi đã có sàn. Khoá `missing` của JSON mang cùng câu, và là
   null trên repo có sàn.
   - Khi dựng mới thấy: trên repo có stylesheet mà Makefile không gom `mk/`, `status` cũ bảo chạy `new`, mà `new` sẽ từ
     chối. Khi thiếu sàn, `status` không mời lệnh của lối dẫn dắt hay của `adopt` nữa.
   - Mã thoát không đổi.
   - Bản đầu chỉ tìm stylesheet ở chỗ quen, nên một repo đã nhận plugin với stylesheet ở chỗ khác bị báo «không có sàn».
     Người soát độc lập bắt được; có bài kiểm cho cả hai chỗ khác.
5. **Bốn khoá của `affected` được ghim bằng một mẫu dữ liệu.** Mẫu ghi cách bộ chọn bài đọc từng khoá: `all`, `why`
   (mỗi mục đúng hai khoá `file`, `reason`), `screens[].route`, `grep`. Bài kiểm chạy lệnh trên kho này, và ghim mã
   thoát: 0 khi có câu trả lời, 2 khi gọi sai, không bao giờ 1.
6. **Lệnh đọc màn: `tools/design-assembly/screen-facts.mjs`, chạy bằng `make design-screen-facts`.**
   - Nó in các màn một tính năng chạm tới, chọn theo mã hay theo đường dẫn. Mỗi màn có mã, đường dẫn, tên, họ, tình
     trạng, các trạng thái sổ ghi, các trạng thái phải có (đã trừ miễn trừ của bảng trạng thái), hành động mở màn và các
     nút, mỗi cái kèm vai giữ nó.
   - Lệnh đọc qua bộ đọc sổ màn chung, nên sổ một tệp hay một thư mục mỗi màn một tệp đều được. Cách viết khoá riêng đọc
     từ `keys` của sổ, hoặc từ `--keys` như phép đo repo kiểm chứng vẫn truyền.
   - Mã thoát: 0 khi đủ, 1 khi một màn được hỏi không có trong sổ (câu trả lời vẫn in ra), 2 khi gọi sai. Repo không có
     bảng trạng thái vẫn thoát 0, mỗi `must_have` là null: bản đầu thoát 1, và kit, như bộ chọn bài, coi mọi mã khác 0
     là «quay về khai tay».
   - Sổ viết khoá theo cách riêng mà không nói ở chỗ lệnh đọc được thì không màn nào có khoá của hợp đồng. Khi ấy khoá
     `keys_not_found` nêu từng khoá không tìm thấy (`entry`, `actions`), và `actions` của mỗi màn là null chứ không phải
     danh sách rỗng, để bên gọi phân biệt «không tìm thấy» với «không có nút». Lệnh vẫn thoát 0, vì mã, đường dẫn và
     trạng thái vẫn đọc được. Phiên điều phối bắt được chỗ này khi chạy lệnh, chỉ đọc, trên repo kiểm chứng: sổ ấy viết
     `vao`, `nut`, chỉ nói trong lời chú thích, nên lệnh trả mọi màn không hành động mà vẫn thoát 0. Cách viết
     `entry=vao,actions=nut` nằm ở Makefile của kho này, không ở repo ấy, nên lệnh không tự tìm được; bên gọi truyền
     `--keys`.
   - Các khoá được ghim ở `tests/test-screen-facts.mjs` và ghi ở `references/checks.md`.
   - Giới hạn mới `screen-facts-read-default-paths`: lệnh chỉ đọc sổ, bảng và mô hình ở chỗ quen.

## Consequences

- Repo Standards (lát 3) có ba thứ để ghim bằng mẫu dữ liệu: tệp `host-strings.json`, dòng `DERIVED_TARGETS` của bước
  cổng (bộ đọc `make_wiring.py` của họ nhận ra `design-derived`, như bài kiểm ở kho này thử lại bằng chính biểu thức
  của họ), và bốn khoá của `affected`.
- Kit nghiệm thu (lát 4) có một lệnh để gọi thay cho khai lại.
- Bài kiểm của plugin thêm mười tám bài: bảy ở `tests/test-seam.mjs`, tám ở `tests/test-screen-facts.mjs`, ba ở
  `tests/test-upgrade.mjs`.
- Mục 6.1 vẫn «todo»: lời gọi của Repo Standards là lát sau, cần lời cho phép riêng ở kho ấy.
