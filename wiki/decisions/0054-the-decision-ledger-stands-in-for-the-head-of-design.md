---
type: decision
title: "Sổ quyết định đứng thay trưởng thiết kế: hàng chờ mỗi câu một tệp, phép so tổng, và tường cho khuôn mới và màu gốc"
links:
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0043-decide-reads-ledger-rows-and-a-waiting-list-kept-as-data.md
  - wiki/decisions/0050-a-repository-may-keep-the-ledger-of-screens-one-file-per-screen.md
  - wiki/decisions/0053-a-command-says-which-screens-a-change-reaches.md
  - wiki/decisions/0047-tool-stamp-upgrade-and-the-version-rule.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - plugins/design-assembly/templates/tools/design-assembly/owner-calls.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/skills/decide/SKILL.md
  - plugins/design-assembly/tests/test-waiting.mjs
  - plugins/design-assembly/tests/test-owner-calls.mjs
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - design/waiting/
  - "chủ repo, 2026-11-17: giao mục 8.3 của kế hoạch"
---

# 0054 Sổ quyết định đứng thay trưởng thiết kế: hàng chờ mỗi câu một tệp, phép so tổng, và tường cho khuôn mới và màu gốc

## Status

Accepted, 2026-11-17. Bước 8.3 của đề bài 0005, phần C (8.3a và 8.3b). Máy chọn cách làm trong khuôn đề bài đã duyệt;
mục 6 và mục 8 là chỗ máy phải đọc chữ của đề bài theo một nghĩa, ghi rõ lý do ở đó. Chờ chủ repo bác.

## Context

Biên chủ repo đã chốt ở đề bài 0005: máy tự chọn từ sổ quyết định và danh mục linh kiện; khuôn mới và màu thương hiệu
thì phải hỏi; bất biến máy so là «mọi lựa chọn trỏ về một dòng sổ». Sổ quyết định, lệnh `decide` và trang luật đã có.
Thiếu ba thứ:

- **Hàng chờ là một tệp chung**, `design/waiting-list.json`. Hai nhánh cùng xếp câu thì cùng sửa một tệp, đúng căn bệnh
  phần A của đề bài đã chữa cho sổ màn. Tác tử đang dựng cũng không có đường nào để xếp câu mà không sửa tệp chung.
- **Không phép kiểm nào so tổng.** Một tác tử tự viết dòng «phán xét» vào sổ thì cổng vẫn xanh.
- **Không gì chặn khuôn mới và màu gốc.** Dòng giới hạn `brand-color-not-pinned` mở từ 2026-11-12: đổi màu thương hiệu
  sang một màu khác đủ tương phản thì cổng vẫn xanh.

## Decision

1. **Hàng chờ thành thư mục `design/waiting/`, mỗi câu một tệp `<mã câu>.json`.**
   - Tệp chung cũ vẫn đọc được. Có cả hai thì hàng chờ không đọc được: hai nguồn.
   - Hàng chờ vẫn không phải sổ của hợp đồng; quyết định 0043 giữ nguyên điều đó. Hình dạng của nó viết ở
     `waiting.mjs` của công cụ, không ở `contract.mjs`. Điều đổi so với 0043 mục 1: cổng nay đọc hàng chờ, chỉ cho hai
     dòng mới ở mục 6 và 7.
   - Câu trong thư mục xếp theo mã, so phần số như số: A2 đứng trước A10.
   - Tệp không đuôi `.json` trong thư mục thì không phải câu và được để yên. Hai tên chỉ khác nhau chữ hoa thì không
     đọc được, vì hệ thống không phân biệt chữ hoa chỉ giữ một.
   - Lời đáp chỉ ghi vào tệp của câu được đáp; không tệp nào khác đổi.
2. **Một câu có thêm hai khoá: `item` và `asked_on`.**
   - `item` nêu đúng một thứ câu ấy hỏi về: `decision:<mã dòng>`, `pattern:<tên trang kiểu màn>` hoặc
     `source-color:<giá trị màu>`. Ba loại, không loại nào khác.
   - Tên khoá là `item`, không phải `about`, vì tệp chung cũ đã dùng `about` cho lời tả cả tệp.
   - `asked_on` là ngày tác tử hỏi.
3. **`decide --ask`: tác tử xếp câu mà không sửa tệp chung nào.**
   - Bắt buộc bốn thứ đề bài kê: câu hỏi, khuyến nghị (`--recommend`), căn cứ (`--because`), và khó đảo hay không
     (`--hard-to-undo` hoặc `--easy-to-undo`, đúng một).
   - Lệnh ghi đúng một tệp mới. Mã câu lấy từ `--id`; không có thì làm từ `item`; không có nữa thì là `q-` kèm tám ký tự
     băm của câu hỏi. Nhờ vậy hai tác tử hỏi hai câu trên hai nhánh ghi hai tệp khác nhau.
   - Lệnh từ chối, không ghi gì, khi câu thiếu một thứ, khi mã đã có, khi mã trùng một dòng sổ, và khi hàng chờ còn là
     tệp chung: khi ấy lệnh bảo tách trước bằng `--split`.
   - Sau khi ghi, lệnh bảo tác tử đi tiếp theo khuyến nghị của chính nó, trừ câu về `pattern:` hay `source-color:`: với
     hai loại ấy lệnh bảo dừng. Đây là khuyến nghị ở câu mở 5 của đề bài, và đúng biên chủ repo đã chốt.
4. **`decide --split` tách tệp chung thành mỗi câu một tệp.**
   - `--dry-run` in trước mọi tệp sẽ tạo và tệp sẽ xoá.
   - Lệnh dựng các tệp trong bộ nhớ, đọc lại, và không ghi gì nếu một câu không trở về đúng như cũ.
   - Lời `about` của tệp chung không phải câu nào nên không có tệp; lệnh in nó ra.
   - Ở kho này đã tách: 27 tệp ở `design/waiting/`, tờ trình trước và sau giống hệt.
5. **Trang luật cho tác tử dựng màn có thêm mục «Questions only the owner answers».**
   - Mục ấy nói cách hỏi bằng `--ask`, cấm tác tử ghi lời đáp, và bảo dừng với khuôn mới hay màu gốc.
   - Skill `decide` có thêm phần «Asking: for an agent that builds».
6. **Phép so tổng là dòng `decision-sheet` của tầng governance.** Ba phần, mỗi phần đỏ khi:
   - **Một dòng «phán xét» mà nhánh thêm hoặc đổi, không ai đáp, và không câu nào hỏi.**
     - «Đã đáp»: ghi chú mang dấu `decide` viết (`confirmed by`, `refused by`, `answered by`). Hoặc dòng do cuộc dẫn dắt
       viết từ `design/blueprint.json`, ở tầng mà người tự chọn hoặc tầng có liệt kê lựa chọn ấy trong `confirmed`.
     - «Có câu hỏi»: một câu của hàng chờ nêu `item: decision:<mã>`. Hoặc ghi chú của dòng nói người chưa xác nhận.
   - **Mã nguồn đi vòng một quyết định đã có dòng.** Bộ dò của audit được chuyển sang công cụ và dùng chung, nên audit và
     cổng không bao giờ nói khác nhau. Bộ dò đọc bốn thang: màu viết thẳng, cỡ chữ, khoảng cách và bo góc viết trong
     ngoặc vuông.
   - **Một bài kiểm trong `tests/` gắn `decision:<mã>` mà sổ không có dòng nào mang mã ấy.**

   Máy phải chọn một nghĩa cho hai chữ của đề bài:

   - **«Chưa ai xác nhận» chỉ đọc ở dòng mà nhánh thêm hoặc đổi, so với nhánh chính.**
     - Quy ước của plugin hôm nay là: dòng không có mệnh đề «a person has not confirmed it» là lời của người. `audit`,
       `status` và `decide` đều đọc như vậy. Vì thế chỉ nhìn dữ liệu thì không phân biệt được dòng người đã đáp với dòng
       tác tử tự viết. Chỉ git cho biết dòng nào nhánh này viết.
     - So cả sổ thì cổng đỏ ngay ở hai repo đang có. Ở kho này đỏ ba dòng (`primary-task`, `information-order`,
       `copy-content`), dù chủ repo đã xác nhận cả ba ngày 2026-11-12 (căn cứ của câu C4). Ở bản sao của repo kiểm chứng
       đỏ cả sáu dòng phán xét, những dòng viết theo lời người trước khi có dấu của `decide`.
   - **«Nằm ở hàng chờ» gồm cả dòng tự nói người chưa xác nhận.**
     - `decide` đã trình dòng ấy như một câu (0043 mục 1), nên đòi thêm một tệp ở hàng chờ là hỏi một câu hai lần.
     - Cuộc dẫn dắt cũng viết những dòng như vậy ngay lần chạy đầu, khi người chọn «máy đề xuất».

   Phần «không có dòng» chỉ gồm thứ công cụ đọc được trong repo. Phần còn lại của audit nằm ngoài cổng: giá trị trông
   như lời đáp, và bằng chứng nhận ra nhờ danh mục `known-proofs.json`. Cả hai cần danh mục của plugin, mà danh mục không
   đi theo công cụ đã cài. Câu chỉ người trả lời được mà sổ chưa có dòng đã nằm trên tờ trình, ở mục «answered with
   another command».

7. **Tường là dòng `owner-calls`. Nó đỏ cho tới khi hàng chờ có câu nêu đúng mục ấy và chủ repo đáp «giữ».** Hai thứ
   làm tường đóng:
   - **Một trang dưới `design/patterns` mà nhánh thêm.** Mục là `pattern:<tên tệp, bỏ .md>`.
   - **Dòng màu gốc khác với ở nhánh chính.** Đó là `--primary` cuối cùng trong khối `:root` cấp đầu của stylesheet, đọc
     đúng như viết. Mục là `source-color:<giá trị mới>`, nên lời «giữ» cho một màu không mở tường cho màu khác. Bỏ dòng
     màu gốc đi cũng là đổi; mục khi ấy là `source-color:none`.

   Lời đáp và chữ trên cổng:

   - Câu đã hỏi mà chưa đáp, bị bác, hay được đáp bằng lời khác: tường vẫn đóng, và cổng nói rõ là trường hợp nào.
   - Việc này đóng dòng giới hạn `brand-color-not-pinned`. Phần ép trên GitHub (nâng hạng PR) vẫn là gói RS5 của Repo
     Standards, ghi ở dòng giới hạn `owner-calls-trusts-a-written-answer`.

8. **Khi nào không so.**
   - **Ngoài git:** cả hai phép kiểm qua, và cổng in rằng nó không so.
   - **Nhánh mà ở chỗ tách ra, nhánh chính chưa có sổ quyết định:** đó là nhánh repo gặp plugin, trong cuộc dẫn dắt hay
     khi nhận, và người trả lời ngồi cùng. Không gì trên nhánh ấy được so. Đề bài không nói tới trường hợp này. Không
     miễn thì cổng đỏ ngay sau cuộc dẫn dắt đầu tiên, vì mọi trang và mọi dòng đều mới.
   - **Repo chưa có commit nào:** repo bắt đầu ở đây, không có gì trước để so; xử như trường hợp trên. Cổng của kho
     này tìm ra trường hợp này: chín bài kiểm của plugin dựng repo bằng `git init` mà chưa commit, và hai phép kiểm đỏ
     ở cả chín cho tới khi sửa.
   - **Có git mà không tìm ra nhánh chính:** cả hai đỏ, thay vì để khuôn mới lọt qua. Nhánh chính là tên đầu tiên git
     biết trong `origin/HEAD`, `main`, `master`, `origin/main`, `origin/master`. Hai tên cuối là cho CI, nơi thường chỉ
     có nhánh ở xa.
   - **Hàng chờ không đọc được:** cả hai đỏ.
9. **Cả hai dòng luôn được cài, không qua phép thử trước.**
   - Cuộc dẫn dắt viết hai dòng mà không chạy thử. Một bức tường chỉ được cài khi không ai đang đẩy nó thì không giữ gì.
   - Lệnh nhận thêm hai dòng như hai ứng viên đi cùng cổng, nên chúng qua phép thử của lệnh nhận như mọi ứng viên.
   - Danh mục quyết định chuẩn có thêm hai mục. Mỗi mục có một nguồn nên không phải câu lõi, và độ phủ của repo nào cũng
     không đổi.
10. **Bản plugin 0.7.0**, theo luật số bản của 0047.

## Review

Một tác tử soát độc lập đọc thay đổi trước khi xong, ngày 2026-11-17, và kết luận «cần sửa»: một lỗi chặn, tám lỗi
nên sửa. Cả chín đã sửa hoặc ghi lại:

- **Lỗi chặn: câu có mã bắt đầu bằng dấu chấm bị mất.** Tệp `.x.json` là tệp ẩn, bộ đọc thư mục bỏ qua nó, và `--split`
  có thể ghi câu vào tệp ẩn rồi xoá tệp chung. Nay mã của câu trong thư mục không được bắt đầu bằng dấu chấm, `--split`
  từ chối khi một mã của tệp chung không làm tên tệp được, và đọc lại thư mục từ đĩa trước khi xoá tệp chung. Có bài
  kiểm đỏ trước.
- **Nhánh chính cũ ở máy được lấy làm chỗ tách.** Một `main` ở máy chưa kéo về làm mọi thứ đã gộp từ đó tính là của
  nhánh này: đỏ sai. Nay tên ở xa đứng trước, và trong các nhánh chính git biết, chỗ tách là chỗ mới nhất.
- **Git không đọc được tệp ở chỗ tách thì bị coi là «chưa có sổ».** Đó là xanh im lặng. Nay chỉ tệp mà chỗ tách thật sự
  không có mới là vắng; lỗi khác của git làm cả hai phép kiểm đỏ.
- **Một ghi chú tự viết qua được phép so tổng.** Ghi dòng giới hạn `decision-sheet-trusts-the-note`, mức cao, và ghi
  chú của dòng `decision-sheet` nói nó đọc lời đáp từ ghi chú.
- **Phần «không có dòng» của audit chỉ dựng một phần.** Ghi dòng giới hạn `decision-sheet-audit-proofs-not-read`.
- **Chưa có bài kiểm cho thư mục con của một repo git.** Đã thêm; mã vốn đúng.
- **Không nói gì về CI và nhánh chính tên khác.** Lời đỏ nay nói `fetch-depth: 0`, và phép kiểm nhận khoá `main` trong
  `design/theme.json`.
- **Hỏi lại một mục đã đáp thì lệnh bảo «chọn mã khác».** Nay lệnh nói chủ repo đã đáp gì và bảo đi tiếp hay dừng.
- **Luật mã chặt hơn làm tệp chung cũ không đọc được.** Tệp chung giữ luật mã cũ; luật chặt chỉ áp cho thư mục,
  `--ask` và `--split`.

## Consequences

- **Ở kho này**, cổng giữ 39 quyết định bằng 47 phép kiểm. Mỗi phép kiểm mới đã được thấy đỏ trên bản sao bị đổi. Hai
  dòng mới nằm ở `design/decisions.yaml`, phép kiểm của chúng ở `design/theme.json`. Hàng chờ có 27 tệp. Nhánh này
  không thêm trang kiểu màn, không đổi màu gốc, và không thêm dòng phán xét nào.
- **Tiêu chí 8 và 9 của đề bài có bài kiểm.** `test-waiting.mjs` chứng minh `--ask` ghi đúng một tệp mới, và `decide`
  trình câu ấy cùng các câu khác. `test-owner-calls.mjs` chứng minh nhánh thêm trang kiểu màn hay đổi màu gốc thì đỏ,
  và có lời «giữ» cho đúng mục ấy thì xanh. Các bài kiểm then chốt đã được kiểm đột biến: sửa hỏng mã có chủ ý, thấy bài
  đỏ, rồi trả mã về. Mười bốn bản đột biến đều bị bài kiểm bắt. Ba bản sống sót và được ghi rõ là tương đương: ghi lại tệp không
  đổi byte nào, và bỏ riêng thứ tự tên nhánh chính hay riêng luật «chỗ tách mới nhất». Mỗi thứ trong hai thứ sau tự nó
  đã chữa được nhánh `main` cũ, nên chỉ bỏ cả hai mới thấy bài đỏ.
- **Điều kiện «xong khi» thứ ba của giai đoạn 8 mới có cơ chế, chưa có số đo.** Điều kiện ấy là: một lượt dựng màn không
  hỏi chủ repo giữa chừng. Chưa tác tử dựng màn nào chạy `--ask` trong một lượt thật.
- **Repo kiểm chứng chưa có hai phép kiểm này.** `upgrade` hôm nay chép công cụ mà không thêm dòng sổ. Hai dòng vào đó
  khi chạy lại lệnh nhận, hoặc ở bước 8.4, với phép của chủ repo. Repo ấy chưa có hàng chờ.
- **Sổ giới hạn:** đóng `brand-color-not-pinned`, mở chín dòng:
  - `owner-calls-root-colour-as-written`: `--primary` trong tệp được nhập, hay trỏ sang biến khác, thì không đọc tới;
  - `owner-calls-trusts-a-written-answer`: mức cao, chuyển cho Repo Standards;
  - `decision-sheet-reads-what-a-branch-writes`;
  - `decision-sheet-free-layout-not-read`: dòng giới hạn mà đề bài đòi;
  - `decision-sheet-four-scales-gone-around`;
  - `owner-calls-needs-git-and-a-main-branch`;
  - `decide-ask-trusts-the-agent-to-ask`;
  - `decision-sheet-trusts-the-note`: mức cao;
  - `decision-sheet-audit-proofs-not-read`.
- **Bảng từ vựng** thêm `total comparison` và `owner's call`, và viết lại nghĩa của `waiting list`.
- **`status` chỉ đổi chữ:** nó không còn nêu một đường dẫn hàng chờ cố định.
