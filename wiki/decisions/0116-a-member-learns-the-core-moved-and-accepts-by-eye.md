---
type: decision
title: "Thành viên biết lõi đã đi trước bản ghim và nhận từng câu, bằng mắt; một dòng lúc mở phiên; lời cho phép đẩy lõi lên"
links:
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/decisions/0112-the-plugin-builds-the-family-core.md
  - wiki/decisions/0113-the-core-shape-and-the-command-that-builds-it.md
  - wiki/decisions/0114-a-repository-joins-its-family-and-inherits.md
  - wiki/decisions/0115-the-family-owner-changes-an-answer-of-the-core.md
  - wiki/decisions/0093-send-out-asks-leave-records-the-push-and-says-when-it-is-behind.md
sources:
  - plugins/design-assembly/scripts/core-moved.mjs
  - plugins/design-assembly/scripts/core-moved-call.mjs
  - plugins/design-assembly/scripts/core-accept.mjs
  - plugins/design-assembly/scripts/core-eye.mjs
  - plugins/design-assembly/scripts/core-publish.mjs
  - plugins/design-assembly/scripts/session-line.mjs
  - plugins/design-assembly/hooks/hooks.json
  - plugins/design-assembly/scripts/core.mjs
  - plugins/design-assembly/scripts/core-list.mjs
  - plugins/design-assembly/scripts/core-join.mjs
  - plugins/design-assembly/scripts/core-change.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/specimen.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/core/SKILL.md
  - plugins/design-assembly/tests/test-core-moved.mjs
  - plugins/design-assembly/tests/test-core-eye.mjs
  - plugins/design-assembly/tests/test-session-line.mjs
  - plugins/design-assembly/tests/test-core-publish.mjs
  - "phiên điều phối, 2026-11-25: chủ repo đáp «Mở ba lát» cho câu «Mở ba phiên song song: 7.1 lát 3, 7.2 lát 1 và nửa «rời họ»?»"
  - "tài liệu Claude Code, đọc ngày 2026-11-25: https://code.claude.com/docs/en/hooks và https://code.claude.com/docs/en/plugins-reference"
  - "ba plugin đã cài trên máy dựng, chỉ đọc tệp hooks/hooks.json: superpowers 6.4.1, vercel 0.56.0, dispatch 3.1.1; Claude Code 2.1.332"
---

# 0116 Thành viên biết lõi đã đi trước bản ghim và nhận từng câu, bằng mắt; một dòng lúc mở phiên; lời cho phép đẩy lõi lên

## Status

Accepted, 2026-11-25, plugin 0.65.0 (dựng ở 0.63.0; nhánh gộp sau nửa «rời họ», quyết định
[0118](0118-a-repository-leaves-its-family.md), rồi sau lát 1 của mục 7.2, quyết định
[0117](0117-tier-three-reads-the-core-and-a-block-is-taken-like-an-outside-item.md), nên lấy main vào hai
lần, mỗi lần một commit gộp, và lên 0.64.0 rồi 0.65.0). Lát 3 của mục 7.1, dựng theo lời chủ repo («Mở ba lát»), theo
đề bài [0016](../specs/0016-the-family-core-is-born-through-the-plugin.md) đã duyệt (tiêu chí 9, 14,
18, 19; lời đáp 9 và 12), song song với lát 1 của mục 7.2 và nửa «rời họ» của lát 4 trên hai nhánh
khác. Lát này đổi hợp đồng sổ ở ba chỗ (điều thành viên ghi khi nhận một phần thay đổi của lõi; dòng
lời cho phép trong tờ khai của lõi; móc lúc mở phiên là một loại thành phần mới của plugin) nên cần
người duyệt trước khi gộp. Một PR: phần mã ngoài bài kiểm dưới ngưỡng 2 500 dòng.

## Context

Sau lát 2 và nửa đầu lát 4, chủ của họ đổi được lời đáp của lõi (`core --change`) nhưng không thành
viên nào biết: thành viên chỉ đọc bản chép của mình, và hai giới hạn `core-member-not-told-core-moved`
và `core-change-tells-no-member` chờ lát này. Đề bài giao bốn phần: báo khi lõi đi trước bản ghim và
nhận từng câu (9), nhận bằng mắt (19), một dòng lúc mở phiên (18, lời đáp 12), lời cho phép và lối
đẩy lõi lên một repo riêng tư (14, lời đáp 9). Đề bài để ngỏ: thành viên tìm lõi ở đâu; bản ghim và
bản chép đi thế nào khi chỉ nhận một phần; điều gì xảy ra với ngoại lệ và câu hỏi của bản ghim cũ;
câu nào «nhìn thấy được»; dòng lúc mở phiên tới phiên bằng lối nào; lời cho phép nằm đâu và lần đẩy
ghi ở đâu. Mỗi điều được chốt dưới đây.

## Decision

### Lõi đi trước bản ghim (tiêu chí 9)

1. **Thành viên tìm lõi qua sổ lõi trên máy, theo tên họ.** Lời khai của thành viên
   (`design/sources/core.json`) không ghi đường dẫn: đường dẫn là chuyện của từng máy. Sổ có một lõi
   mang tên họ ấy thì lấy nó; có hơn một thì lấy lõi mà danh sách thành viên nêu repo này; không
   chọn được thì nói «không nhìn được» và bảo nêu `--core`. Một lõi nằm chỗ khác trên máy được nêu
   bằng `core --moved --core <thư mục>`, và sổ trên máy ghi lõi ấy từ đó (nói rõ khi ghi).
2. **«Không với tới» không là lỗi.** Sổ vắng, sổ hỏng, không dòng nào của họ, thư mục mất, lõi sai
   hình dạng hay mới hơn, thư mục là lõi của họ khác: `status` và `inventory` nói vì sao và giữ mã
   thoát; `core --moved` thoát 0; repo đi tiếp với bản chép. Riêng `core --accept` thì từ chối (mã
   2, không ghi gì), vì nhận thì phải đọc được lõi.
3. **Đi trước nghĩa là `answers.json` của lõi khác bản đã chép**, so bằng mã băm, đúng thứ mã ghim
   là. `core.json` đổi vì một thành viên khác vào họ thì không phải «đi trước». Mỗi câu được nêu:
   `changed` (giá trị, mức khoá, phép kiểm giữ nó, hay chỉ bản ghi), `added`, `retired`; với câu đổi,
   máy in các mục `history` nằm sau những mục bản chép đã có: ai, ngày nào, vì sao. Lịch sử không nối
   tiếp bản chép, hay giá trị đổi mà không có mục nào, thì nói «lịch sử của lõi không nêu ai đổi».
   Tệp chỉ đổi cách viết mà không câu nào đổi thì nói vậy; nhận thì chỉ bản ghim đi.
4. **Ba chỗ nói cùng một điều**: `core --moved` (thêm dòng `here:` nói nhận câu ấy sẽ gặp gì ở repo
   này), `status` (khoá `core.moved`) và `inventory` (khoá `core`, và dòng «not looked at:
   family-core» khi không nhìn được). Không lệnh nào trong ba lệnh ghi gì vào repo. Mã thoát:
   `--moved` 1 khi lõi đi trước; `status` và `inventory` không đổi mã thoát.
5. **Khối của lõi là việc của mục 7.2**: khi danh sách khối của lõi khác bản chép, ba chỗ trên chỉ
   nói một câu rằng nó khác, không nêu khối nào.
6. **Nhận từng câu**: `core --accept <id>` (nhiều lần) hay `core --accept-all`, luôn kèm `--by`; có
   `--dry-run`. **Bản chép và bản ghim đi thế này khi chỉ nhận một phần:** bản chép giữ lời đáp của
   lõi cho câu đã nhận và lời đáp cũ cho câu để lại, theo thứ tự của lõi; câu lõi đã rút ở lại bản
   chép tới khi việc rút được nhận. Mã ghim vẫn là mã băm của `answers.json` như repo đang giữ (quyết
   định 0114, điểm 3), nên nó đổi sau mỗi lần nhận, và phần chưa nhận vẫn hiện là «đi trước» mà
   không cần sổ nào ghi thêm: bản chép là điều repo đã nhận, thư mục lõi là điều họ đang nói, hiệu
   của hai thứ là việc còn chờ. Nhận hết thì bản chép là `answers.json` của lõi, từng byte, và mã
   ghim là của lõi.
7. **Thành viên ghi gì khi nhận**: `pin.files` và `pin.taken_on` của lời khai theo bản chép mới, và
   một khoá mới `accepted` (lần nhận gần nhất: `by`, `on`, `answers`, `core` là 12 chữ số đầu mã băm
   lời đáp của lõi lúc ấy, `left` là các câu đã đổi mà chưa nhận). Dòng của repo trong danh sách
   thành viên của lõi nhận mã ghim mới: nói trước, chỉ ghi khi thư mục lõi ghi được, như lúc vào họ.
   Danh sách khối trong bản chép giữ nguyên.
8. **Không giá trị nào của repo bị ghi đè.** Câu đã khoá mà repo giữ khác sau khi nhận thành câu hỏi
   `core-<id>-<mã ghim mới>` trên hàng chờ, như lúc vào họ; cổng đỏ tới khi chủ repo đáp. Câu mặc
   định mà repo giữ khác thì ở lại, dòng sổ ghi «changed» với lý do «the repository's own answer
   from before the family core changed this default», người nói là người nhận. Đề bài viết «người
   nhận thì sổ và mã đổi theo»; lát này theo nếp của lát 2 (không lệnh nào viết lại tệp kiểu dáng,
   giới hạn `core-follow-not-carried-out`), nên «mã đổi theo» vẫn là việc của repo sau lời đáp.
9. **Ngoại lệ và lý do của bản ghim cũ được mang sang** khi lời đáp nó nói tới không đổi: ngoại lệ
   cho câu khoá đứng khi giá trị và mức khoá của câu ấy như cũ; lý do giữ khác một câu mặc định đứng
   chừng nào repo còn giữ khác. Câu khoá mà chính nó đổi thì hỏi lại. Nhờ vậy nhận câu A không hỏi
   lại ngoại lệ của câu B; giới hạn `core-exception-keyed-to-pin` thu hẹp còn lối `--join` lại.
10. **Câu hỏi còn chờ của bản ghim cũ bị gỡ** (tệp trong `design/waiting/`), và được hỏi lại ở bản
    ghim mới nếu repo vẫn giữ khác; câu đã đáp thì ở lại như bản ghi. Hàng chờ còn là một tệp chung
    thì không gỡ được: lệnh nêu tên câu ấy (giới hạn mới).
11. **Nhận thì ghi trọn hoặc không ghi gì.** Bản chép được so với mã băm trong lời khai, nên một
    lượt ghi dừng giữa chừng sẽ làm cổng đỏ: lệnh ghi bản chép trước, rồi lời khai và sổ; một tệp
    không ghi được thì mọi tệp đã ghi được trả về như cũ, lệnh thoát 2 và nói vậy. Hai bộ lời đáp
    được so mà không kể thứ tự khoá, nên một lõi được viết lại theo thứ tự khoá khác không hiện ra
    như mọi câu đều đổi.
12. **Mã thoát của `--accept`**: 0 khi không còn gì; 1 khi còn câu để lại hay có câu chờ chủ repo;
    2 và không ghi gì khi repo không thuộc họ nào, bản chép hỏng, lõi không nhìn được, hay nêu một
    câu không đổi. Lệnh nói khi bản xuất tụt lại (`exportsBehind`), như các bước của lát 2.
13. **`core --change` đổi câu nói về thành viên**: không còn «a later slice», mà nói thành viên biết
    khi nhìn được thư mục lõi, và người ở đó nhận từng câu.

### Nhận bằng mắt (tiêu chí 19)

14. **`core --moved --draw [--only <id>]... [--out <thư mục>]`** luôn liệt kê giá trị trước và sau
    của từng thay đổi (trong bản chép, repo đang giữ, trong lõi), rồi vẽ màn của chính repo trước
    (A, repo như hiện có) và sau (B, với giá trị của lõi), sáng và tối, bằng bảng mẫu đã có
    (`draw`, `colorOption`, `standardType` của `specimen.mjs` nay được xuất; tờ mang lời dẫn riêng).
    «Sau» được tính bằng chính mã mà lối dẫn dắt dùng để viết (`buildTheme`, `typeDeclarations`).
15. **Câu nhìn thấy được là màu gốc và thang chữ.** Đó là hai giá trị một lõi giữ mà một màn cho
    thấy nguyên trạng. Cách mở hồ sơ là một cách sắp xếp, đã có mục vẽ riêng của bảng mẫu; bề rộng
    được kiểm không đổi màn nào; bo góc và khoảng cách không là lời đáp của lõi (bảng
    `core-questions.json`), nên đề bài nêu chúng mà chưa có gì để vẽ. Mỗi câu không vẽ đều kèm lý
    do. Giới hạn `core-eye-draws-two-values`.
16. **Không vẽ được thì nói vì sao, cạnh các giá trị**: repo không có trình duyệt, không có tệp kiểu
    dáng, giá trị không vẽ được, câu chỉ đổi mức khoá, repo đã giữ đúng giá trị của lõi. Bài kiểm có
    trình duyệt chạy trên ứng dụng mẫu của kho này và bị bỏ qua khi máy kiểm không có trình duyệt,
    như các bài kiểm bảng mẫu.

### Một dòng lúc mở phiên (tiêu chí 18, lời đáp 12)

17. **Móc đầu tiên của plugin**: `hooks/hooks.json`, sự kiện `SessionStart`, khớp `startup|resume`,
    một lệnh chạy `scripts/session-line.mjs --hook`. Tệp lệnh nằm trong `scripts/` để cây của bản
    plugin tính nó; `hooks/` không nằm trong cây được ghi (giới hạn sẵn có
    `version-counts-templates-and-scripts`).
18. **In không quá một dòng, chỉ khi có việc chờ**: lõi đi trước bản ghim (kèm số câu); có câu hỏi
    `core-…` chờ chủ repo; có câu đã khoá bị giữ khác mà không ngoại lệ (đọc bằng chính hàm của cổng,
    `lockedCoreProblems`; câu đang có câu hỏi chờ không đếm hai lần). Cả ba cùng lúc vẫn là một dòng.
19. **Im lặng trong mọi ca khác**, kể cả ca không đọc được: repo không thuộc họ nào (chỉ một lần
    kiểm tệp lời khai có hay không, rồi dừng; các mô-đun nặng chỉ được nạp sau bước ấy), thư mục
    không là repo, bản chép lệch mã băm, sổ trên máy hỏng, lõi không nhìn được, hàng chờ hỏng. Mọi
    lỗi kết thúc im lặng với mã 0. Không gọi mô hình, không gọi mạng, **không chạy git**: gốc repo
    tìm bằng mục `.git`, và thư mục chính của một worktree đọc từ tệp `.git` và `commondir`.
20. **Dòng tới phiên bằng JSON của móc**: `systemMessage` (hiện cho người) và
    `hookSpecificOutput.additionalContext` (vào ngữ cảnh của phiên), cùng một dòng; không có `--hook`
    thì in dòng chữ thường. Trang skill bảo phiên: nói dòng ấy với người một lần, và không làm gì
    thêm tới khi người bảo.
21. **Lệnh của móc là một dòng bash** kiểm `node` và tệp lệnh có đó rồi mới chạy, hạn 10 giây; thiếu
    một trong hai thì thoát 0 và không in gì.
22. **Đã kiểm gì về móc, ở đâu.** Đọc tài liệu Claude Code ngày 2026-11-25
    (`code.claude.com/docs/en/hooks` và `…/plugins-reference`): plugin khai móc ở `hooks/hooks.json`
    tại gốc plugin, tệp phải bọc các sự kiện trong khoá `hooks` (thiếu thì không nạp), có thể có
    `description`; `SessionStart` có các giá trị khớp `startup`, `resume`, `clear`, `compact`,
    `fork`; `${CLAUDE_PLUGIN_ROOT}` được thay trong `command`; biến `CLAUDE_PROJECT_DIR` là gốc dự
    án; với mã thoát 0, chữ in ra được thêm vào ngữ cảnh của phiên; `additionalContext` vào ngữ cảnh
    trước lời đầu tiên; `systemMessage` là «thông điệp hiện cho người dùng»; mã thoát khác 0 của
    `SessionStart` không chặn phiên; tài liệu dặn giữ móc này nhanh vì nó chạy ở mọi phiên. Đối
    chiếu với ba plugin đã cài trên máy dựng (superpowers 6.4.1, vercel 0.56.0, dispatch 3.1.1):
    cùng hình dạng tệp, cùng dạng lệnh. Quan sát trực tiếp trong phiên dựng này: chữ in thường của
    một móc `SessionStart` và `additionalContext` của một móc khác đều tới ngữ cảnh của phiên. Đo
    trên máy dựng: repo đứng một mình 29 ms mỗi lần chạy (riêng `node` khởi động 26 ms), thành viên
    có lõi đi trước 40 ms. **Chưa kiểm:** chưa mở một phiên Claude Code thật có cài bản plugin này
    để thấy dòng hiện ra, và chưa thấy `systemMessage` của `SessionStart` hiện ở đâu trên màn (tài
    liệu không nói riêng cho sự kiện này); việc ấy tốn token và chờ lời chủ repo (giới hạn
    `session-line-not-seen-in-a-live-session`).

### Lời cho phép và lần đẩy lõi (tiêu chí 14, lời đáp 9)

23. **Không script nào gọi mạng**, nên phần của lệnh là bản ghi và lời in trước; tạo repo và đẩy là
    việc của phiên, sau lời người. `core --publish --core <thư mục>` với một trong `--allow`,
    `--revoke`, `--pushed`, hay không gì (in trước).
24. **Lời cho phép là một dòng của tờ khai của lõi** (`core.json`, khoá `publish`): `to` (một nơi),
    `allowed` (ai, ngày nào), và `taken_back` khi đã rút. Vì sao ở đó: nếp của quyết định 0093 là
    ghi lời cho phép thành dòng trong sổ của chính thứ được gửi, kèm tên và ngày; với lõi, sổ ấy là
    tờ khai, và lời cho phép «theo họ» thì nằm trong dữ liệu của họ. Tờ khai vốn `open`, nên bản
    plugin cũ đọc lõi ấy như thường, và **hình dạng lõi giữ số 2**: không bên đọc nào của hình dạng 2
    đọc khoá này, plugin không tự đẩy gì, còn lên số 3 sẽ buộc mọi thành viên lên đời vì một khoá
    họ không dùng. `core --check` giữ hình dạng của khoá.
25. **Một lời cho phép cho một nơi.** Nơi được giữ dưới dạng máy chủ và đường dẫn, bỏ giao thức, tên
    người dùng và `.git`, nên cùng một repo đọc như nhau dù địa chỉ viết kiểu nào. Địa chỉ mang mật
    khẩu hay token bị từ chối và không bao giờ được in lại: chỉ tên đăng nhập của lối ssh
    (`git@máy:đường-dẫn`) được nhận, mọi chữ `@` khác, mọi `?` và `#` đều bị coi là chỗ giấu bí mật;
    `origin` của thư mục viết kiểu ấy thì không gì được gửi hay ghi cho tới khi người sửa nó, và một
    dòng lời cho phép sửa tay mang bí mật bị từ chối mà không in lại. Nơi được nêu, hay `origin` của thư mục,
    khác nơi đã cho phép thì lệnh nói «a new place is asked first» và không in dòng gửi: hỏi lại mỗi
    lần nơi đến là mới.
26. **In trước đúng thứ sẽ đi**: thư mục, từng tệp (tệp git sẽ mang nếu thư mục đã là repo, theo
    luật bỏ qua của nó; không thì mọi tệp), tệp nào không là phần của lõi được đánh dấu «sẽ đi
    theo», tên remote, nơi đến, câu «repo ở đó là riêng tư», thư mục đã là repo git chưa và còn bao
    nhiêu tệp chưa commit. Chỉ khi lời cho phép phủ đúng nơi ấy mới có hai dòng `sends:` và `to:`;
    trang skill bảo chỉ đẩy khi thấy cả hai, như 0093.
27. **Lần đẩy được ghi vào sổ lõi trên máy** (`pushed`: `path`, `to`, `on`, `by`, `state`), không
    ghi vào thư mục lõi: ghi vào đó thì thứ vừa đẩy lại đổi ngay sau khi đẩy. `state` là mã băm ngắn
    của các tệp như lúc đẩy; lần in trước kế tiếp nói bản ở đó «behind» khi thư mục đã đi tiếp.
    `core-list.mjs` giữ các dòng `pushed` khi ghi dòng loại khác. Chỉ ghi cho nơi đã được cho phép.
28. **Từ chối**: người nói không thì không gì được ghi, thư mục lõi dùng được trọn (bài kiểm: vẫn
    giữ hình dạng, vẫn đổi được, vẫn nhận thành viên), và trang skill bảo không hỏi lại trong phiên
    ấy. `--revoke` rút một lời đã cho; chưa cho thì nói không có gì để rút.
29. **Mã thoát của `--publish`**: in trước thoát 1 khi một người phải được hỏi (chưa có lời cho
    phép, hay nơi đến là mới), 0 khi lời cho phép phủ nơi ấy hay đã rút; ba bước ghi thoát 0; lời
    gọi sai thoát 2.

### Trên mọi loại repo

| Repo                             | Lệnh làm gì                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Đứng một mình, mọi loại          | Không khoá mới ở `status` và `inventory`, không đọc sổ trên máy, móc im lặng; `--moved`, `--accept` từ chối |
| Thành viên được nhận             | So màu gốc với `color.primary`; câu khoá giữ khác thành câu hỏi; tệp token và tệp kiểu dáng không đổi       |
| Thành viên do lối dẫn dắt dựng   | Đọc bản thiết kế; câu mặc định giữ khác ở lại với lý do; bản thiết kế không đổi; nói khi bản xuất tụt lại   |
| Không có trình duyệt hay màn nào | `--draw` liệt kê giá trị trước và sau, và vì sao không có ảnh                                               |
| Không Makefile, chưa có sổ       | Lời khai và bản chép vẫn đi; không sổ quyết định thì không dòng nào được đánh dấu                           |
| Máy không có lõi, máy khác, CI   | «Không nhìn được», nói vì sao; repo đi tiếp với bản chép; cổng không đổi                                    |
| Gọi từ một worktree              | Cùng lõi, cùng chữ in ra, cùng dòng lúc mở phiên; dòng trong lõi mang tên thư mục chính                     |

## Consequences

- Hợp đồng sổ đổi, cần người duyệt (`plugins/design-assembly/references/contract.md` và
  `contract.mjs`): đoạn mới ở mục `sources` về việc nhận thay đổi của lõi và khoá `accepted`; khoá
  `publish` ở tờ khai của lõi; câu cuối mục lõi về việc thành viên biết lõi đổi; `pushed` và cách
  thành viên tìm lõi ở mục sổ lõi trên máy; mục mới «Not a ledger: the line at the start of a
  session». Sổ và lõi viết trước vẫn đọc như cũ: không khoá nào bắt buộc thêm.
- Đóng hai giới hạn: `core-member-not-told-core-moved`, `core-change-tells-no-member`. Thu hẹp
  `core-exception-keyed-to-pin`. Mở mười ba giới hạn: `core-moved-seen-only-where-the-folder-is`
  (mức vừa: máy khác, CI và thư mục chưa kéo về không biết lõi đổi, vì không lệnh nào gọi mạng),
  `core-accept-part-pin-is-no-state-of-the-core`, `core-retired-answer-half-told` (sửa ở mục 7.2),
  `core-moved-question-left-on-a-shared-waiting-list`, `core-moved-not-in-the-inventory-document`,
  `core-eye-draws-two-values`, `core-eye-after-is-what-the-guide-would-write`,
  `session-line-not-seen-in-a-live-session` (mức vừa, sửa), `session-line-needs-bash-and-node`,
  `session-line-says-nothing-of-what-it-cannot-read`, `core-publish-rests-on-the-session` (mức vừa),
  `core-publish-leave-travels-with-the-core`, `core-publish-push-known-on-one-machine`.
- Tiêu chí 1 giữ: bài kiểm chạy `status`, `inventory` và móc trên bốn loại repo đứng một mình, với
  sổ trên máy vắng, hỏng và có một lõi, và đòi cùng chữ, cùng mã thoát, không tệp mới, không chữ nào
  về lõi. Tiêu chí 15: tên họ chỉ nằm ở bản chép và lời khai của thành viên; không tệp nào của lát
  này dưới `plugins/` nêu tên một họ. Tiêu chí 20: `--moved`, `--accept`, `status` và móc in như nhau
  từ worktree. Tiêu chí 14: mọi lời gọi của bài kiểm `--publish` chạy với mạng bị chặn; không bài
  kiểm nào tạo repo hay đẩy gì.
- Lượt thử trên hai bản sao của repo kiểm chứng (1ea13196, chép bằng `git archive` vào thư mục tạm,
  repo thật chỉ được đọc: trạng thái git của nó sau lượt thử không đổi; lõi và sổ trên máy nằm trong
  thư mục tạm): lõi dựng từ bản sao thứ nhất (khoá màu gốc và một luật hành vi, mặc định bề rộng),
  bản sao thứ hai vào họ; chủ của họ đổi màu gốc và bề rộng; `core --moved`, `status` và `inventory`
  nêu đúng hai câu kèm người, ngày, lý do; móc im lặng trước khi vào họ, nói một dòng khi lõi đi
  trước, và một dòng khác khi câu hỏi chờ; nhận riêng bề rộng thì mã ghim đổi và màu gốc còn hiện là
  đi trước; nhận màu gốc thì câu `core-source-color-<mã ghim>` lên hàng chờ, tệp token và tệp kiểu
  dáng không đổi; cổng 0.7.1 của bản sao vẫn thoát 0. Lượt ấy tìm ra một điều đã sửa: phần nhận bằng
  mắt chỉ đọc tệp kiểu dáng ở đường dẫn mặc định, mà repo ấy khai `src/app/globals.css`; nay nó đọc
  tệp mà cổng đọc, và lý do không có ảnh ở bản sao là đúng lý do thật (bản sao không cài gói nào,
  nên không có trình duyệt).
- Bài soát độc lập của phiên điều phối trên head 4f5a029 tìm hai điểm, sửa cả hai theo lời chủ repo
  («Gửi cả ba sang sửa»), mỗi bản sửa có bài kiểm đỏ khi thiếu nó. (1) Lý do nói trong phiên
  (`core --settle --why <id>=<lý do>`) ghi ngoại lệ vào dòng sổ nhưng để câu hỏi `core-<id>-<mã
ghim>` chờ mãi, nên móc nói «một câu hỏi chờ» ở mọi phiên và `status` vẫn đếm nó. Nay bước
  `--settle` đáp luôn câu hỏi ấy như tờ quyết định sẽ viết: `refuse` kèm lý do, tên và ngày mà ghi
  chú của dòng giữ (kể cả câu một lần `--settle` của bản trước đã để lại); và `status` cùng dòng lúc
  mở phiên không bao giờ đếm một câu hỏi mà ngoại lệ của nó đã được ghi ở đúng bản ghim ấy. Mã của
  câu hỏi (`core-<id>-<mã ghim>`) nay ở một chỗ, `coreQuestionId` của `core-moved.mjs`, và
  `core-join.mjs` dùng lại nó. (2) Khi bản chép không đọc được, `core --moved` in «pinned here at
  null»; nay nó nói mã ghim không đọc được, và không in `null` ở đâu.
- Đứng chung với «rời họ» (PR #148, quyết định 0118), sau khi lấy main vào: repo đã rời họ thì dòng
  lúc mở phiên im lặng, `status` và `inventory` không còn khoá `core`, `--moved` và `--accept` từ
  chối; vào họ lại thì được báo lại. Bước rời họ ghi sổ lõi trên máy qua cùng hàm ghi dòng nên các
  lần đẩy đã ghi (`pushed`) ở lại, lời cho phép trong tờ khai của lõi không đổi, và thư mục lõi mất
  một thành viên thì trở về đúng trạng thái đã đẩy. Mỗi điều có bài kiểm.
- Đứng chung với lát 1 của mục 7.2 (PR #149, quyết định 0117), sau khi lấy main vào lần hai: bản
  chép của thành viên nay giữ cả tệp của từng khối, và `pin.files` liệt kê chúng. Nhận lời đáp, một
  câu hay tất cả, chỉ đổi `answers.json`, `core.json` và hai dòng mã băm của chúng: tệp của khối và
  các dòng `pin.files` của chúng giữ nguyên, bản chép vẫn đọc được, cổng xanh. Kho khối của lõi khác
  bản chép thì ba chỗ vẫn chỉ nói rằng nó khác, không nêu khối nào, và nói thêm rằng `core --join`
  là bước ghim khối mới (bước ấy cũng nhận mọi lời đáp của lõi như hiện có). Khối đã lấy về và nhập
  kho, dòng sổ nhập kho, bản ghi chuẩn hoá và phát hiện của `inventory` không đổi khi nhận lời đáp;
  `core --take` nói lại đúng điều nó nói, chỉ khác mã ghim nó nêu. Rời họ sau khi nhận một phần thì
  lời khai (cùng khoá `accepted`) và cả bản chép bị gỡ, dấu ở bản ghim mới thành «own since» như mọi
  dấu, và câu hỏi đã bị gỡ khỏi hàng chờ không quay lại. Một chỗ đụng thật khi gộp: cờ `--to` là
  của cả `--take` (một thư mục) lẫn `--publish` (một nơi), mà `core.mjs` của main từ chối `--to`
  ngoài `--take`; nay các bước của lát này được giao lời gọi trước phép từ chối ấy, và tự kiểm cờ
  của mình. Mỗi điều có bài kiểm (`tests/test-core-slices-together.mjs`).
- Tệp dùng chung chỉ sửa đúng dòng lát này cần: `core.mjs` (cờ và chỗ rẽ), `core-join.mjs` (xuất
  `holdAnswers` và `answeredOf`; `--settle` đáp câu hỏi đã có lý do), `core-join-call.mjs` (một dòng
  in), `core-list.mjs` (`pushed`), `core-change.mjs` (một câu),
  `status.mjs` và `inventory.mjs` (mỗi tệp vài dòng), `specimen.mjs` (xuất ba hàm, một lời dẫn).
- Bảng năng lực không thêm ổ và không thêm lối: `--accept` ghi sổ qua chính hàm của `--join`.
- Một bài soát độc lập của phần mã mới, chạy trước khi mở PR, tìm ba điểm nặng và hai điểm vừa; cả
  năm đã sửa trong cùng thay đổi, mỗi bản sửa có một bài kiểm: lượt nhận dừng giữa chừng để lại bản
  chép lệch mã băm (điểm 11); một địa chỉ mang mật khẩu lọt qua ở vài dạng viết, và `origin` mang bí
  mật bị ghi thành nơi đến (điểm 25); một dòng lời cho phép sửa tay bị in lại nguyên văn; và hai bộ
  lời đáp bị so theo thứ tự khoá.
- Chưa dựng: ghi việc rút một lời đáp (tiêu chí 24), viết giá trị của lõi vào tệp kiểu dáng khi chủ repo chọn theo lõi, và
  một phiên thật để thấy dòng lúc mở phiên.
