---
type: spec
title: Hai kho bên cạnh gọi và đọc — Repo Standards gọi plugin, kit nghiệm thu đọc sổ màn và bảng trạng thái
status: approved
tier: 1
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0003-plugin-inside-the-repo.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/decisions/0030-one-ledger-of-screens.md
  - wiki/decisions/0039-plan-recut-by-rhythm-and-tier.md
  - wiki/decisions/0053-a-command-says-which-screens-a-change-reaches.md
sources:
  - docs/plan/plan.json
  - docs/architecture/meta-layer.html
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-ledger.mjs
  - mk/plugin.mk
  - "repo-standards, chỉ đọc, nhánh chính ở b488860, ngày 2026-11-22: docs/three-repo-boundaries.md, docs/seam-contracts.md, plugins/repo-setup/skills/new/SKILL.md, plugins/repo-setup/scripts/apply_plan.py, docs/reports/2026-11-20-decision-to-merge-trace.md"
  - "delivery-loop, chỉ đọc, nhánh chính ở 8baa836a, ngày 2026-11-22: plugins/acceptance-gate/skills/acceptance/references/ux-spec-template.md, docs/plans/2026-08-24-hat-giong-khop-vong-dac-ta-ux.md"
  - "chủ repo, 2026-11-22: «Viết đề bài 0013», đáp câu «Viết đề bài 0013 cho giai đoạn 6 để anh duyệt?»"
  - "chủ repo, 2026-11-22: «Duyệt cả tám», đáp câu «Duyệt đề bài 0013 theo cả tám khuyến nghị?»"
---

# 0013 Hai kho bên cạnh gọi và đọc

Máy viết ngày 2026-11-22 theo lời chủ repo («Viết đề bài 0013»). Chủ repo duyệt đề bài và đáp cả tám câu hỏi theo
khuyến nghị cùng ngày («Duyệt cả tám»); câu 1 là lời duyệt kiến trúc của giai đoạn. Đây là mục 6.0 của kế hoạch: đề bài
cho cả giai đoạn 6 (mục 6.1, 6.2 và 6.3). Nó gom luôn bốn việc gác lại của nhóm «Chỗ giáp repo-standards» và việc «Tài
liệu kiến trúc còn vẽ năm chặng cũ». Chưa gì được dựng.

Hai kho bên cạnh chỉ được đọc khi viết trang này. Lời duyệt kiến trúc đã có; lời cho phép sửa ở Repo Standards và ở
delivery-loop thì chưa. Không bước nào ở hai kho ấy được làm trước khi chủ repo cho phép riêng từng kho.

## Intent

Đề bài 0002 chốt vai của ba kho ngày 2026-11-13: **design-assembly là bên duy nhất ghi bộ sổ thiết kế; Repo Standards
đặt repo rồi gọi nó; delivery-loop chỉ đọc sổ của nó.** Trang ranh giới ba kho ở Repo Standards nhận đúng vai ấy
ngày 2026-11-14. Giai đoạn này biến hai câu cuối từ chữ thành lời gọi và lời đọc có thật.

Dòng «xong khi» của giai đoạn: một repo mới ra đời qua Repo Standards có đủ bộ sổ mà không ai gọi tay.

### Hôm nay đứng ở đâu

- **Repo Standards chưa gọi plugin ở chỗ nào.** Ở bước «dựng không dừng» của lối `new`, nó đặt sàn thiết kế (6.1,
  6.2), viết miền nghiệp vụ và dịch màn mẫu (6.3), kiểm và chấm (6.4, 6.5), ghi quyết định và bài giới thiệu (6.6 đến
  6.8), rồi đề nghị một commit. Không skill hay script nào của nó nêu design-assembly. Trang ranh
  giới ghi: sàn «sẽ chuyển đi khi design-assembly sẵn sàng nhận», và khi ấy Repo Standards «chỉ còn một lời gọi».
- **Chỗ hai kho chạm nhau duy nhất lúc chạy:** bộ chọn bài kiểm của sàn gọi lệnh `affected` của plugin khi tệp của
  lệnh có trong repo (0053). Hợp đồng bốn khoá của lệnh ấy nằm ở trang hợp đồng chỗ giáp của Repo Standards; phía kho
  này chưa có bài kiểm nào ghim nó.
- **Cài plugin:** Repo Standards đã biết ghi chợ plugin và bật plugin vào `.claude/settings.json` của repo, nhưng chỉ
  cho plugin của chính nó.
- **Repo đã có:** Repo Standards có lối `adopt` và `doctor`; cả hai không nêu plugin. Phía kho này, `adopt` trên một
  repo không có Makefile gom các tệp `mk/` thì không ghi gì (`adopt-without-makefile-writes-nothing`), và `upgrade`
  không ghi bước cổng (`upgrade-leaves-gate-step`).
- **Plugin chưa có lối nào chạy không cần người.** `new` hỏi người từng tầng; `apply` từ chối khi một tầng chưa được
  quyết. Một lời gọi từ Repo Standards hôm nay chỉ có thể là mở cuộc hỏi đáp.
- **Kit nghiệm thu đọc hai trong mười ba sổ:** sổ token và sổ linh kiện, cộng trang kiểu màn. Màn và trạng thái của
  mỗi tính năng được khai lại bằng tay trong mục «Đặc tả UX» của tài liệu thiết kế: bảng «Kiểm kê màn» và bảng «Bảng
  trạng thái», mã trạng thái dạng `ST-<màn>-<trạng-thái>`. Không máy nào đọc hai bảng ấy. Chính kit đã cắt việc kiểm
  bảng trạng thái sau năm vòng hỏng, và đặt điều kiện mở lại: bảng trạng thái phải là một vật máy đọc được thật, có
  một bên đọc.
- **Sổ màn của kho này đã là vật máy đọc được:** mỗi màn có mã, đường dẫn, họ, các trạng thái, các hành động; hành động
  mang vai. `design/states.json` nêu bốn trạng thái mọi màn phải có và màn nào được miễn. Đó đúng là thứ kit chờ.

### Ba mảng

**Mảng 1, Repo Standards gọi plugin khi repo ra đời (mục 6.1, phần đầu).**

- Plugin có thêm **một lối đặt sổ không hỏi ai**: trên một repo vừa có sàn, nó viết đủ bộ sổ lúc ra đời, bước cổng,
  công cụ và trang luật. Mỗi giá trị lấy từ sàn được ghi là «của sàn, chủ repo chưa nói». Mỗi lựa chọn chỉ người làm
  được thành một câu trên hàng chờ. Máy không trả lời hộ ai (câu hỏi 2).
- Lối `new` của Repo Standards thêm một bước sau khi đặt sàn và viết miền nghiệp vụ (sau 6.3), trước bước kiểm (6.4),
  để bước kiểm chạy cả cổng của plugin: bật plugin trong `.claude/settings.json` của repo, gọi lối đặt sổ, rồi mời
  người đi tiếp `new` của plugin ngay hay để sau. Người
  không phải gõ lệnh nào của plugin; bộ sổ có đủ dù người dừng ở đó.
- Hợp đồng nói rõ **bộ sổ lúc ra đời** là những sổ nào. Sổ chỉ có khi có mục đầu (sổ nhập kho, sổ cột, sổ bộ phận)
  không tính là thiếu. `status` in một dòng: bộ sổ lúc ra đời đủ hay thiếu sổ nào (câu hỏi 3).

**Mảng 2, repo đã có, và các chỗ giáp (mục 6.1, phần sau).**

- Lối `adopt` của Repo Standards, sau khi nó đặt Makefile, gọi `audit` rồi `adopt` của plugin. Lối `doctor` của nó
  nêu khi bộ sổ thiếu hay bản công cụ tụt so với plugin, và chỉ tới `upgrade`.
- `upgrade` ghi cả bước cổng, đóng `upgrade-leaves-gate-step`.
- Bốn việc gác lại của nhóm «Chỗ giáp repo-standards» được làm ở đây, vì chúng là một phần của lời gọi:
  - cửa vào cho repo không có sàn, phục vụ ở mức «Chỉ luật»: `status` luôn kết bằng một bước kế hoặc một câu nói rõ
    điều còn thiếu;
  - bốn khoá của lệnh `affected` (`all`, `why`, `screens[].route`, `grep`) được ghim bằng một bài kiểm ở kho này;
  - bước cổng của plugin khai đích dẫn xuất của nó vào danh sách vật dẫn xuất chung của Repo Standards, thay vì nối
    riêng vào `test`;
  - một tệp tham chiếu trong plugin liệt kê mọi chuỗi plugin đọc trong Makefile, `mk/` và workflow của repo chủ, để
    bên Repo Standards ghim bằng bài kiểm của nó.
- **Sàn không chuyển nhà ở giai đoạn này.** Năm tệp của sàn vẫn là của Repo Standards; plugin không sửa chúng (câu
  hỏi 5).

**Mảng 3, kit nghiệm thu đọc sổ màn và bảng trạng thái (mục 6.2).**

- Công cụ plugin cài trong repo có thêm **một lệnh đọc**, theo đúng lối của `affected`: in ra, dạng máy đọc, các màn
  một tính năng chạm tới. Mỗi màn có mã, đường dẫn, họ, các trạng thái phải có (đã trừ miễn trừ), các hành động và vai
  của chúng. Lệnh đọc qua bộ đọc sổ màn đang có, nên sổ một tệp hay một thư mục mỗi màn một tệp đều được, và cách viết
  khoá riêng của repo kiểm chứng cũng vậy. Các khoá in ra được ghim bằng bài kiểm ở kho này và ghi ở trang hợp đồng
  chỗ giáp (câu hỏi 6).
- Kit, khi repo có lệnh ấy, điền sẵn bảng «Kiểm kê màn» và các dòng của «Bảng trạng thái» từ sổ: tên màn, mã trạng
  thái. Phần chỉ tính năng mới biết (vào từ đâu, ra tới đâu, hiển thị gì, người làm gì tiếp) vẫn do người viết trong
  tài liệu của kit, gắn vào mã màn và mã trạng thái của sổ (câu hỏi 7).
- Kit có **một lệnh kiểm**: bảng trạng thái của một tính năng nêu một màn hay một trạng thái mà sổ không có, hoặc
  thiếu một trạng thái sổ bắt màn ấy phải có, thì đỏ, câu đỏ nêu màn và trạng thái. Đây là bên đọc mà điều kiện mở lại
  của kit đòi.
- Repo không có lệnh đọc thì kit làm như hôm nay: người khai tay, không gì đỏ thêm.

### Điều giai đoạn này không làm

- Không chuyển sàn thiết kế từ Repo Standards sang plugin (câu hỏi 5).
- Không đổi hình dạng sổ màn hay bảng trạng thái của kho này: không thêm cạnh điều hướng, không thêm «người làm gì
  tiếp» vào sổ (câu hỏi 7).
- Không sửa ai ghi `design/behaviors.md` và `design/terms.json`: hôm nay Repo Standards dựng chúng, trang ranh giới
  gọi chúng là sổ của plugin. Việc ấy nằm trong việc gác lại «Sàn thiết kế chuyển nhà».
- Không đưa repo kiểm chứng lên bản mới và không đo lại sau 30 PR: hai việc gác lại của nhóm «Repo kiểm chứng» đi riêng
  theo lời cho phép ngày 2026-11-21, không thuộc dòng «xong khi» này.
- Không đụng việc gác lại của nhóm «Ai trả lời» (giới hạn `owner-calls-trusts-a-written-answer`): nó thuộc giai đoạn 7.
- Không bài kiểm nào của kho này chạy công cụ thật của kho kia, và ngược lại. Mỗi bên ghim hợp đồng bằng mẫu dữ liệu;
  chỉ lượt thử cuối chạy cả hai thật (trang hợp đồng chỗ giáp của Repo Standards, mục 5).

## Acceptance criteria

Mỗi dòng chứng bằng một lệnh. Dòng có chữ «Repo Standards» hay «kit» chỉ làm được sau khi chủ repo cho phép ở kho ấy.

1. **Lối đặt sổ không hỏi ai.** Trên một repo bỏ đi vừa có sàn, lối đặt sổ thoát 0, viết đủ bộ sổ lúc ra đời, bước
   cổng, công cụ và trang luật, rồi cổng xanh. Không câu nào được hỏi; mỗi giá trị lấy từ sàn ghi là chưa có lời chủ
   repo; hàng chờ nêu từng lựa chọn chỉ người làm được. Chạy lại lần hai không đổi gì.
2. **`new` chạy được sau lối đặt sổ.** Trên repo của tiêu chí 1, `new` của plugin hỏi như trên một repo chưa có sổ, và
   không bị chặn bởi các giá trị «của sàn». Có bài kiểm.
3. **Bộ sổ lúc ra đời có tên.** Hợp đồng đánh dấu mỗi sổ là «có lúc ra đời» hay «có khi có mục đầu». `status` in một
   dòng nói bộ sổ đủ, hoặc nêu từng sổ thiếu. Có bài kiểm cho cả hai.
4. **Repo Standards gọi khi repo ra đời.** Lối `new` của Repo Standards bật plugin, gọi lối đặt sổ trước bước kiểm
   của nó, và mời đi tiếp `new` của plugin. Bài kiểm phía Repo Standards dùng mẫu dữ liệu, không chạy plugin thật.
5. **Repo Standards gọi ở repo đã có.** Lối `adopt` của Repo Standards gọi `audit` rồi `adopt` của plugin; lối `doctor`
   nêu bộ sổ thiếu hoặc bản công cụ tụt. Bài kiểm phía Repo Standards, như tiêu chí 4.
6. **`upgrade` ghi bước cổng.** Trên một repo bỏ đi nhận từ bản cũ, `upgrade` đưa bước cổng lên đúng bản của plugin.
   Giới hạn `upgrade-leaves-gate-step` đóng.
7. **Bốn việc của chỗ giáp.** Bốn khoá của `affected` có bài kiểm ở kho này; đích dẫn xuất của plugin nằm trong danh
   sách vật dẫn xuất chung và Repo Standards nhận thấy nó; tệp liệt kê các chuỗi plugin đọc có trong plugin và một bài
   kiểm ở kho này đỏ khi plugin đọc một chuỗi không có trong tệp; `status` trên repo không có sàn kết bằng một bước kế
   hoặc một câu nói điều còn thiếu. Bốn việc gác lại rời `parked`.
8. **Lệnh đọc màn.** Trên kho này và trên một repo bỏ đi với sổ màn dạng thư mục, lệnh đọc in đúng các khoá đã ghim.
   Sổ viết khoá theo kiểu repo kiểm chứng cũng đọc được. Có bài kiểm.
9. **Kit đọc thay cho khai lại.** Trên một repo bỏ đi có lệnh đọc, kit điền sẵn kiểm kê màn và các mã trạng thái từ sổ.
   Trên repo không có lệnh, kit làm như cũ. Bài kiểm phía kit dùng mẫu dữ liệu.
10. **Kit có bên kiểm bảng trạng thái.** Một bảng trạng thái nêu màn hay trạng thái sổ không có, hoặc thiếu trạng thái
    sổ bắt phải có, thì lệnh kiểm của kit đỏ và nêu đích danh. Bài kiểm phía kit.
11. **Một repo ra đời qua Repo Standards.** Một lượt thử: repo bỏ đi ra đời qua lối `new` của Repo Standards, có cả hai
    plugin thật, không ai gõ lệnh nào của design-assembly; sau đó `status` của plugin in bộ sổ lúc ra đời đủ và cổng
    xanh. Ghi ở `docs/trials/`. Đây là dòng «xong khi».
12. **Tài liệu kiến trúc.** Mục «Lộ trình và tiêu chí đạt» của tài liệu kiến trúc vẽ lại theo các giai đoạn của kế hoạch
    chính thức thay cho năm chặng cũ; bảng khái niệm ghi delivery-loop đọc sổ màn và trạng thái. Việc gác lại về tài
    liệu kiến trúc rời `parked`.
13. **Sổ sách.** Mỗi lát một dòng `wiki/log.md`; lựa chọn đáng kể thành bản ghi quyết định; giới hạn
    `nothing-declared-to-kit` đóng hoặc thu hẹp đúng điều còn hở; `make check` xanh ở cả ba kho sau mỗi PR ở kho ấy.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Các thay đổi hợp đồng, cần chủ repo nhận khi duyệt:

- **Plugin thêm một lối đặt sổ không hỏi ai.** Nó là một cờ của lệnh đang có hay một lệnh thứ mười bốn là câu hỏi 4;
  dù cách nào, nó theo khế ước gọi chung (thoát 0, 1, 2).
- **Hợp đồng thêm một đánh dấu cho mỗi sổ:** có lúc ra đời, hay có khi có mục đầu. Chỉ thêm; hình dạng sổ không đổi.
- **Công cụ cài trong repo thêm một lệnh đọc màn,** với các khoá ghim bằng bài kiểm.
- **Plugin thêm một tệp tham chiếu:** các chuỗi nó đọc trong Makefile, `mk/` và workflow của repo chủ.
- **Repo Standards:** lối `new`, `adopt`, `doctor` thêm lời gọi; danh sách plugin bật trong repo thêm design-assembly;
  trang hợp đồng chỗ giáp thêm mục cho lệnh đọc màn và bộ sổ lúc ra đời.
- **delivery-loop:** mẫu «Đặc tả UX» đọc sổ khi có; thêm một lệnh kiểm bảng trạng thái.

Hàng chờ không thêm loại mục.

## Plan

Sáu PR, ba kho, theo thứ tự. Mỗi PR chạy được riêng; bài kiểm viết trước mã. Các PR ở kho kia chỉ mở sau khi chủ repo
cho phép ở kho ấy, và đi qua lối của chính kho ấy (kit nghiệm thu, cổng, hồ sơ của nó).

1. **Kho này, lát 1: lối đặt sổ và bộ sổ lúc ra đời.** Tiêu chí 1, 2, 3. Mẫu và script của plugin đổi nên số bản tăng.
2. **Kho này, lát 2: chỗ giáp và repo đã có.** `upgrade` ghi bước cổng; bốn việc của chỗ giáp; lệnh đọc màn. Tiêu chí
   6, 7, 8.
3. **Repo Standards: lời gọi.** Lối `new`, `adopt`, `doctor`; ghim bộ sổ lúc ra đời, lệnh đọc màn và danh sách chuỗi
   bằng mẫu dữ liệu. Tiêu chí 4, 5, và phía Repo Standards của 7.
4. **delivery-loop: bên đọc.** Mẫu «Đặc tả UX» đọc sổ; lệnh kiểm bảng trạng thái. Tiêu chí 9, 10. Bản checkout chính của
   delivery-loop trên máy này đang đứng ở nhánh `chuyen-nha`, không phải nhánh chính; PR đi từ nhánh chính, và chủ repo
   nói trước nhánh nào được dùng.
5. **Kho này, lát 3: tài liệu kiến trúc.** Tiêu chí 12. Đi cùng hoặc sau lời duyệt kiến trúc.
6. **Lượt thử cuối.** Tiêu chí 11, 13. Lượt thử tốn token: hỏi chủ repo trước khi chạy, kèm ước tính.

Lát 1 và 2 của kho này không cần kho nào khác và làm được ngay sau khi chủ repo duyệt. Lát 3 và 4 làm song song được,
mỗi lát một phiên ở kho của nó.

Mã dùng lại: `apply` và `adopt` của plugin, bộ đọc sổ màn, bộ đọc hàng chờ, `affected`, bộ ghi `.claude/settings.json`
của Repo Standards. Không thêm thư viện nào.

## Test plan

- Mỗi tiêu chí của kho này có bài kiểm trên repo bỏ đi dựng trong thư mục tạm; mỗi lệnh kiểm mới được thấy đỏ trên
  một bản sao bị đổi, theo lối cổng đang làm.
- Hợp đồng chỗ giáp: mỗi bên một mẫu dữ liệu cho đầu ra của bên kia (đầu ra lối đặt sổ, lệnh đọc màn, bốn khoá của
  `affected`, danh sách chuỗi). Đổi một khoá ở kho này thì bài kiểm ở kho này đỏ trước khi kho kia biết.
- Lượt thử cuối là lần duy nhất ba kho chạy thật cùng nhau. Nó chạy trên một repo bỏ đi, không phải repo kiểm chứng.
- Vẻ ngoài không có gì để soát ở giai đoạn này.
- Repo kiểm chứng không thuộc tiêu chí nào. Nếu chủ repo muốn biết lệnh đọc màn có đọc được sổ của nó không, đó là một
  lần đo chỉ đọc, trên bản sao bỏ đi, nêu trước khi làm.

## Autonomy tier

Máy dựng hai lát đầu ở kho này sau khi chủ repo duyệt đề bài và đáp các câu hỏi; mỗi lát một PR, gộp là lời chủ repo.
Luôn là lời chủ repo: duyệt kiến trúc (mảng 1 đến 3, và tài liệu kiến trúc), cho phép sửa ở Repo Standards, cho phép
sửa ở delivery-loop, chọn nhánh ở delivery-loop, chạy lượt thử cuối. Ở hai kho kia, máy chỉ làm trong phạm vi lời cho
phép của kho ấy và nêu từng bước trước khi làm.

## Open questions

Mỗi câu kèm một khuyến nghị. Chủ repo đáp cả tám theo khuyến nghị ngày 2026-11-22 («Duyệt cả tám»).

1. **Duyệt kiến trúc: ba vai giữ như đề bài 0002?** Design-assembly ghi bộ sổ; Repo Standards gọi; delivery-loop đọc.
   Khuyến nghị: giữ. Trang ranh giới của Repo Standards đã nhận đúng vai ấy; giai đoạn này chỉ biến chữ thành lời gọi. Đã nhận: giữ ba vai; đây là lời duyệt kiến trúc.
2. **«Không ai gọi tay» nghĩa là gì?** Khuyến nghị: người không gõ lệnh nào của plugin, nhưng các lựa chọn vẫn là lời
   người. Repo Standards gọi lối đặt sổ không hỏi ai, nên bộ sổ có đủ dù người dừng; rồi mời người đi tiếp `new` ngay
   trong cùng cuộc trò chuyện. Lối khác, để Repo Standards mở luôn cuộc hỏi đáp của `new`, làm bộ sổ chỉ có khi người đi
   hết, và Repo Standards không kiểm được bằng mẫu dữ liệu. Đã nhận: người không gõ lệnh, lựa chọn vẫn là lời người.
3. **Bộ sổ lúc ra đời gồm sổ nào?** Khuyến nghị: mọi sổ hợp đồng có, trừ ba sổ chỉ có khi có mục đầu: sổ nhập kho (có
   khi nhận khối đầu), sổ cột (có khi có mô hình dữ liệu), sổ bộ phận (có khi có bộ phận đầu). Sổ màn có lúc ra đời,
   với màn mẫu của sàn. Đánh dấu nằm trong hợp đồng, một chỗ, để `status` và Repo Standards đọc cùng một danh sách. Đã nhận: mọi sổ trừ ba sổ có khi có mục đầu.
4. **Lối đặt sổ là cờ của lệnh đang có, hay lệnh mới?** Khuyến nghị: một cờ của `adopt`. Trên repo vừa có sàn, việc
   ấy đúng là nhận giá trị repo đang có, chỉ khác là giá trị ấy của sàn, chưa ai nói. Phải sửa một chỗ: giá trị nhận
   từ sàn không chặn `new` như giá trị riêng của repo (tiêu chí 2). Thêm lệnh thứ mười bốn thì mọi trang, bảng năng
   lực và khế ước gọi phải nêu thêm một lệnh làm gần trùng việc. Đã nhận: một cờ của `adopt`.
5. **Sàn thiết kế có chuyển từ Repo Standards sang plugin ở giai đoạn này?** Khuyến nghị: không. Dòng «xong khi» không
   cần nó; chuyển sàn đụng năm tệp mà luật hôm nay cấm plugin sửa, cùng `design/behaviors.md` và `design/terms.json`.
   Ghi thành một việc gác lại cho một giai đoạn sau, có đề bài riêng. Đã nhận: không chuyển sàn ở giai đoạn này.
6. **Kit đọc sổ màn bằng cách nào?** Khuyến nghị: gọi lệnh đọc màn trong công cụ plugin đã cài ở repo, như bộ chọn bài
   của sàn đang gọi `affected`; không có lệnh thì làm như cũ. Lối khác, kit tự đọc tệp sổ, buộc kit hiểu cả sổ một tệp,
   sổ dạng thư mục và cách viết khoá riêng của repo kiểm chứng, tức chép lại bộ đọc của plugin ở kho thứ hai. Đã nhận: kit gọi lệnh đọc màn của plugin.
7. **Phần «vào từ đâu, ra tới đâu, hiển thị gì, người làm gì tiếp» ở đâu?** Khuyến nghị: ở lại tài liệu của kit, gắn vào
   mã màn và mã trạng thái của sổ. Chúng thuộc một tính năng, không thuộc màn mãi mãi; sổ màn không lớn thêm ở giai đoạn
   này. Một lượt thử chỉ ra chúng lặp lại qua nhiều tính năng thì lúc ấy mới bàn đưa vào sổ. Đã nhận: ở lại tài liệu của kit.
8. **Kế hoạch có thêm mục 6.0 cho đề bài này, như 3.0, 8.0, 9.0?** Khuyến nghị: có, «Đề bài chi tiết cho cả giai đoạn,
   chủ repo duyệt», ghi xong cùng lời duyệt. Bốn việc gác lại của nhóm «Chỗ giáp repo-standards» và việc tài liệu kiến
   trúc rời `parked` vào mục 6.1 và một mục 6.3 «Tài liệu kiến trúc theo kế hoạch chính thức». Đã nhận: kế hoạch thêm 6.0 và 6.3; năm việc gác lại rời `parked`.
