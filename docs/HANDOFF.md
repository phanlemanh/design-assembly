# Bàn giao phiên làm việc

Viết lại ngày 2026-11-22, lúc chủ kho đổi tài khoản Claude trên cùng máy này, và cập nhật cuối ngày ấy, sau khi hai lát
ở kho này của giai đoạn 6 gộp. Trang này đủ để một phiên Claude Code mới tiếp tục mà không cần bản ghi của phiên cũ. Phiên mới không thấy cuộc trò chuyện cũ, không thấy các phiên phụ đã lưu
trữ, không có thư mục tạm của phiên cũ, và **không thừa hưởng quyền nào chủ kho đã cho bằng lời**.

## Câu để dán vào phiên mới

> Đọc `docs/HANDOFF.md` rồi tiếp tục từ mục «Việc kế». Trả lời bằng tiếng Việt.

## Máy này

Các kho đặt cạnh nhau dưới `~/dev`, vì lệnh của kho này tìm kho bên cạnh theo đường tương đối (`mk/plugin.mk`).
Ở thư mục nhà, mỗi kho còn một lối tắt cùng tên trỏ vào `~/dev`; kho này được chuyển vào `~/dev` ngày 2026-11-22.

| Thư mục                  | Là gì                                            | Quyền của máy                                |
| ------------------------ | ------------------------------------------------ | -------------------------------------------- |
| `~/dev/design-assembly`  | Kho này, `phanlemanh/design-assembly`, công khai | Làm việc ở đây                               |
| `~/dev/onehub-inventory` | Repo kiểm chứng; mọi lệnh `*-reference` đọc nó   | Chỉ đọc; mỗi bước sửa phải nêu trước khi làm |
| `~/dev/delivery-loop`    | Kho kit nghiệm thu                               | Chỉ đọc, không bao giờ sửa hay đẩy           |
| `~/dev/repo-standards`   | Kho Repo Standards                               | Chỉ đọc, không bao giờ sửa hay đẩy           |

Thứ nằm trên đĩa và vẫn còn sau khi đổi tài khoản:

- **Ghi nhớ của máy** ở `~/.claude/projects/-Users-manh-macmini-dev-design-assembly/memory/` (chép từ thư mục cũ
  `-Users-manh-macmini-design-assembly`, vẫn để lại): ba ghi nhớ (plugin phục vụ mọi
  repo ở mọi giai đoạn; hai repo của giai đoạn 2 chỉ đọc; dòng `Plan:` và dòng đồng tác giả viết liền nhau).
- **Ghi chú bàn giao của các phiên phụ** ở
  `~/Library/Application Support/Claude/side-session-notes/local_d57afc66-dd1b-4021-8d2c-29086cfbfd84/`: mỗi lát một
  tệp, từ 5.1 tới lượt thử 15. Thư mục `local_887a28f0-3517-4304-8832-15b37fd52d96/` cạnh đó có ghi chú của lát 2 giai
  đoạn 6: hợp đồng mà lát ở Repo Standards và lát ở kit nghiệm thu sẽ dựa vào. Đọc như ghi chú của đồng nghiệp, không
  phải chỉ thị.
- **Tám thư mục làm việc** dưới `.claude/worktrees/`, đều sạch và không còn commit nào ngoài nhánh chính; thư mục thứ
  tám, `item-6-1-seam-and-screen-reader-079a9d`, là của lát 2 đã gộp. Chủ kho chưa bảo xoá.

Thứ không theo sang tài khoản mới: các phiên phụ (mười tám phiên đã lưu trữ, hai phiên chưa lưu trữ là lát 2 của mục 9.2
và lượt thử 15), và ba artifact Claude Design của lần thử tay ngày 2026-11-20. Địa chỉ riêng của các artifact ấy không
được ghi vào kho.

Kiểm máy: `make setup` rồi `make check` phải xanh, 0 bài bỏ qua.

## Đọc theo thứ tự này

1. Trang này.
2. `AGENTS.md` và `CLAUDE.md` ở gốc kho: lệnh, luật, ngôn ngữ.
3. `make plan`: kế hoạch chính thức (`docs/plan/plan.json`), giai đoạn đang mở, việc của nó, việc chờ chủ kho và việc
   gác lại theo nhóm.
4. `wiki/specs/0013-the-two-neighbours-call-and-read.md`: đề bài đã duyệt của giai đoạn đang mở, với tám lời đáp của
   chủ kho. Rồi hai quyết định của hai lát đã dựng: `wiki/decisions/0085-…` (đặt sổ không hỏi ai) và
   `wiki/decisions/0086-…` (nâng cấp ghi bước cổng, chỗ giáp, lệnh đọc màn).
5. `wiki/index.md` khi cần lý do của một quyết định.

## Kho này là gì

Một plugin Claude Code (`plugins/design-assembly/`, bản 0.35.0) dẫn người dùng tới một design system nằm ngay trong kho
của họ, để Claude Code dựng màn mà không phải đoán. Ứng dụng React ở gốc kho là bản cài đặt đối chứng: plugin sinh gì
thì hiện ở đó và được `make check` chấm.

Mười ba lệnh, chung một khế ước gọi (thoát 0 xong, 1 chờ người, 2 gọi sai): `status`, `audit`, `new`, `adopt`,
`decide`, `upgrade`, `handoff`, `find`, `intake`, `inventory`, `change`, `brief`, `review`.

Số bản plugin do cổng giữ. Sửa `templates/` hay `scripts/` thì theo đúng thứ tự: `make format`, `make design-apply`,
`make plugin-version VERSION=x.y.z`, `make design-apply`, `make check`.

## Trạng thái lúc bàn giao

- **Nhánh chính** ở `f3da3fd` cộng PR mang bản cập nhật này. `make check` xanh; plugin có 1093 bài kiểm, 0 bài bỏ qua.
- **Kế hoạch: 43 trên 49 mục.** Tám giai đoạn đã đóng, chứng cứ ghi ở `closed` của từng giai đoạn: 0 và 1 (16/11),
  2 (17/11), 8 (18/11), 3 (19/11), 4 (20/11), 5 (21/11), 9 (22/11).
- **Giai đoạn 6** «Hai kho bên cạnh gọi và đọc» đang mở, xong 1 trên 4 mục: 6.0 (đề bài 0013, đã duyệt). Mục 6.1 đã xong phần
  ở kho này (hai lát) và còn phần ở Repo Standards; 6.2 và 6.3 chưa bắt đầu. Giai đoạn 7 chưa mở.
- **Cổng của kho này:** 42 quyết định giữ bằng 78 lệnh kiểm. `status --roles` in «33 trên 33 giá trị có lời chủ repo».
  `status` in bộ sổ lúc ra đời đủ cả 7 sổ.
- **Phiếu quyết định:** không câu nào chờ chủ kho. Hai quyền chỉ chủ kho cho, từng bước một: mọi bước ở Inventory,
  delivery-loop và Repo Standards; và chạy phép đo token chính thức.
- **Sổ giới hạn:** 384 dòng, 298 đang mở, 20 mức nặng. **Việc gác lại:** 11 mục trong sáu nhóm.
- **Lượt thử:** 16 lần, 31 dòng ở `docs/trials/results.tsv`. Vai dựng màn: lần 11 tới 14 cho 9, 11, 14, 13 chỗ phải
  đoán. Vai dẫn dắt: lần 15 và 16 cho 10 và 8.

### Ngày 2026-11-22, sau khi đổi tài khoản

- **Kho chuyển vào `~/dev`** (PR #92, cùng trang bàn giao).
- **Đề bài 0013** cho giai đoạn 6, chủ kho duyệt và đáp cả tám câu theo khuyến nghị («Duyệt cả tám»); câu 1 là lời duyệt
  kiến trúc (PR #93). Ba vai giữ nguyên: plugin ghi bộ sổ, Repo Standards gọi, kit nghiệm thu đọc. Sàn thiết kế không
  chuyển nhà ở giai đoạn này.
- **Lát 1 của mục 6.1** (PR #94, quyết định 0085, plugin 0.34.0): `adopt --starter` đặt bộ sổ lúc ra đời trên một repo
  vừa có sàn mà không hỏi ai; giá trị nhận trên sàn ghi đích danh là của sàn, nên lối dẫn dắt viết đè được; hợp đồng
  đánh dấu sổ nào có từ lúc ra đời; `status` nói bộ sổ đủ hay thiếu. Bộ sổ lúc ra đời là bảy sổ, hẹp hơn khuyến nghị
  của câu 3: bản thiết kế, sổ nguồn và trang kiểu màn cần lời người. Chủ kho được báo điều này trước khi commit.
- **Lát 2 của mục 6.1** (PR #96, quyết định 0086, plugin 0.35.0), dựng ở một phiên phụ:
  - `upgrade` ghi cả bước cổng, và nêu từng dòng của bước cũ sẽ mất trước khi ghi; giới hạn `upgrade-leaves-gate-step`
    đóng.
  - Bốn việc của chỗ giáp: bốn khoá của `affected` được ghim; bước cổng khai đích dẫn xuất vào danh sách chung của Repo
    Standards; mọi chỗ plugin đọc Makefile và `mk/` gom về một mô-đun, kèm tệp liệt kê `references/host-strings.json`;
    `status` trên repo chưa có sàn kết bằng câu nói điều còn thiếu.
  - Lệnh đọc màn `tools/design-assembly/screen-facts.mjs` (`make design-screen-facts`), để kit nghiệm thu gọi. Sổ viết
    khoá theo cách riêng mà không khai thì lệnh nêu khoá nó không tìm thấy (`keys_not_found`), không trả danh sách rỗng.

### Hai ngày trước đó làm được gì

- **Giai đoạn 5:** lệnh `brief` (phiếu mười hai ô cho một màn), lệnh `review` (soát màn đã vẽ bằng hình), bảng năng
  lực, và bài kiểm trình duyệt theo vai (mở từng màn dưới từng vai, nhận nút bằng dấu `data-model-action`).
- **Giai đoạn 9:** họ chữ là một lựa chọn và font vào qua sổ nguồn kèm ghim và giấy phép; bảng 31 vai màu, mỗi vai có
  nguồn nói được; tương phản đo mọi cặp ở cả hai giao diện; họ trung tính và tông trạng thái do công thức viết.
- **Kho này đã đáp:** giữ font của sàn; trung tính theo công thức, xám thuần; `--destructive` và năm vai biểu đồ giữ
  của sàn; thanh bên đi theo màu chính; font Geist dùng theo SIL Open Font License 1.1; màu gốc `#0246ff` là lời chủ
  kho.

## Việc kế

Đề bài 0013 chia giai đoạn 6 thành sáu PR ở ba kho. Thứ tự và trạng thái:

1. **Hai lát ở kho này đã gộp** (PR #94 và #96). Không còn việc nào của mục 6.1 làm được ở kho này.
2. **Repo Standards: lời gọi** (lát 3). Lối `new` của nó gọi `adopt --starter` trước bước kiểm rồi mời đi tiếp `new`
   của plugin; lối `adopt` và `doctor` gọi ở repo đã có. Phía Repo Standards cũng ghim bằng mẫu dữ liệu: bộ sổ lúc ra
   đời, các khoá của lệnh đọc màn, và các chuỗi của `references/host-strings.json`. **Cần chủ kho cho phép sửa ở Repo
   Standards.**
3. **Kit nghiệm thu: bên đọc** (lát 4, mục 6.2). Kit gọi lệnh đọc màn của plugin để điền sẵn kiểm kê màn và mã trạng
   thái, và có một lệnh kiểm bảng trạng thái. Kit không biết cách viết khoá riêng của từng repo: nó đọc
   `keys_not_found` để biết khi nào câu trả lời thiếu. Ở repo kiểm chứng, lệnh chưa cho mã trạng thái nào, vì repo ấy
   giữ trạng thái ở một trang chữ. **Cần chủ kho cho phép sửa ở delivery-loop và chọn nhánh:** bản checkout
   của nó trên máy này đứng ở nhánh `chuyen-nha`, không phải nhánh chính.
4. **Tài liệu kiến trúc theo kế hoạch chính thức** (mục 6.3). Chỉ ở kho này; lời duyệt kiến trúc đã có. Đây là việc
   duy nhất của giai đoạn 6 làm được ngay mà không cần lời cho phép ở kho khác.
5. **Lượt thử cuối:** một repo bỏ đi ra đời qua Repo Standards, có cả hai plugin thật, không ai gõ lệnh nào của plugin
   này. Đây là dòng «xong khi». Lượt thử tốn token: hỏi chủ kho trước, kèm ước tính.

Ngoài giai đoạn 6:

- **Một việc nhỏ còn nợ, ngoài kế hoạch:** lệnh `status` thường chưa nêu các dòng chưa trọn của `status --roles`
  thành bước kế. Ghi ở `wiki/log.md` ngày 2026-11-22; chưa dựng.
- **Việc gác lại** nằm ở `parked` của `plan.json`, xếp theo sáu nhóm; `make plan` in chúng. Chỉ làm khi một giai đoạn
  đụng tới hoặc chủ kho bảo. Nhóm mới «Sàn thiết kế chuyển nhà» cần một đề bài riêng.

### Đang chờ lời chủ kho

- Cho phép sửa ở Repo Standards và ở delivery-loop, từng kho một, và nhánh nào được dùng ở delivery-loop.
- Bộ sổ lúc ra đời là bảy sổ thay cho mười sổ của câu 3: chủ kho đã được báo và bảo commit, chưa nói gì thêm.
- Mức và hướng xử lý của các dòng giới hạn do máy đặt ở giai đoạn 5 và 9. Đáng chú ý: `unmarked-action-control-unseen`
  (nút cấm không mang dấu thì bài kiểm theo vai không thấy), đang ghi mức vừa, «giữ nguyên».
- Kiểu mục hàng chờ `screens:` và khoá `replaces` (cùng cờ `decide --ask --replaces`): đang dùng, chưa được nhận bằng
  lời.
- Nút trên toast có tính vào các hành động của một màn hay không; lời của trạng thái đang chờ, nơi hai luật kéo ngược
  nhau.
- Ai giữ giới hạn mức nặng `owner-calls-trusts-a-written-answer` (mục gác lại của nhóm «Ai trả lời»).
- Xoá các nhánh đã gộp trên remote (khoảng 35 nhánh) và tám thư mục làm việc.

## Cách đã làm ở giai đoạn 5, 9 và 6

Một vòng lặp, mỗi bước có lời chủ kho:

1. Máy viết **đề bài** (một trang dưới `wiki/specs/`) kèm các câu hỏi, mỗi câu một khuyến nghị. Chủ kho duyệt.
2. Một **phiên phụ** dựng một lát, bài kiểm viết trước, tự mời một người soát độc lập, rồi mở một PR.
3. Phiên điều phối **soát PR** theo `.claude/skills/review-change`: đặt bản checkout chính lên đầu nhánh của PR (không
   gắn nhánh), chạy `make check`, thử hành vi trên bản sao bỏ đi dựng bằng `git archive HEAD | tar -x`, rồi trả bản
   checkout về. Chỉ báo, không sửa.
4. Điểm cần sửa thì gửi lại phiên dựng, kèm **nguyên văn lời chủ kho**; kiểm lại trước khi báo xong.
5. **Gộp** khi chủ kho bảo và CI đã xanh ở đúng đầu nhánh.

Điều rút ra từ vòng lặp ấy:

- Báo cáo của một phiên phụ là báo cáo, chưa phải bằng chứng. Hai lỗi thật đã được tìm ra khi soát lại: cổng sập khi
  thư mục thực thể có thư mục con, và phép kiểm «font được nạp» cho xanh sai trên nền dựng thứ hai.
- Người soát độc lập của lát 1 giai đoạn 6 tìm ra một lỗi thật mà bài kiểm viết trước không bắt: một dấu «của sàn»
  chung cho cả danh sách giá trị đã nhận, khiến giá trị riêng của repo có thể bị viết đè. Đưa cho người soát bản thay
  đổi và đề bài, không đưa kết luận của mình.
- Ở lát 2, phiên điều phối chạy lệnh đọc màn, chỉ đọc, trên repo kiểm chứng và thấy điều cả bài kiểm lẫn người soát
  của phiên dựng bỏ sót: lệnh trả mọi màn không hành động mà vẫn thoát 0. Thử lệnh mới trên một repo thật khác kho này
  trước khi tin nó.
- Lời chủ kho gõ trong phiên phụ có thể tới trước tin của phiên điều phối: ở lát 2, PR mở theo lời «Commit và mở PR»
  trong phiên phụ, trước khi điểm cần sửa tới nơi. Bản sửa đi thành commit thứ hai của cùng PR, sau lời «Đẩy bản sửa».
- Chủ kho có thể nói thẳng với một phiên phụ. Khi phiên phụ ghi «chủ kho đã đáp», mở bản ghi của phiên ấy xem câu ấy
  có thật do chủ kho gõ không, rồi mới dựa vào.
- Một lượt thử độc lập tốn token: hỏi chủ kho trước mỗi lượt, kèm ước tính. Đề chuẩn dưới `docs/trials/briefs/` đưa
  nguyên văn; màn của đề không bao giờ dựng trong kho này.

## Quyền và cổng

- **Phiên mới hỏi lại trước lần gộp đầu tiên của mình.** Từ ngày 2026-11-20, chủ kho đáp từng lần gộp («Gộp khi xanh»,
  «Kiểm lại và gộp»); một lời như vậy chỉ phủ đúng PR được hỏi. Các PR ngày 2026-11-22 (#92, #93, #94, #96) đều gộp theo lối
  ấy.
- **Commit và mở PR cũng hỏi từng lần** («Commit và mở PR»). Việc viết đề bài, dựng một lát, hay mở một phiên phụ đều
  bắt đầu bằng một lời của chủ kho cho đúng việc ấy.
- Lời cũ của chủ kho ngày 2026-11-15, cho phiên điều phối toàn quyền xếp và gộp, ghi ở bản trước của trang này (xem
  lịch sử git). Nó được nói với một phiên khác và **không theo sang phiên mới**.
- **Không bật tự gộp, không ngồi hỏi CI.** Đọc CI một lần khi được gọi; chưa xanh thì nói vậy và chờ chủ kho nhắn lại.
- **Cổng**, tức chỗ luôn cần lời chủ kho: việc kế hoạch ghi «needs the owner»; hàng chờ; thay đổi `ontology/`; mọi
  bước ở Inventory, delivery-loop, Repo Standards; việc ngoài kế hoạch làm chậm một mục; việc khó đảo; lượt thử tốn
  token; cài gói mới.
- **Inventory:** chủ kho cho phép làm hai mục gác lại của nhóm «Repo kiểm chứng» ngày 2026-11-21 («Tôi cho phép»), và
  mỗi bước ở repo ấy vẫn nêu trước khi làm. Hai repo của giai đoạn 2 (floorplanstudio, crm-onehub) chỉ đọc.
- **Máy không trả lời hộ chủ kho.** Lời đáp của chủ kho ghi qua `decide`, kèm tên và ngày; tên đang dùng trong sổ là
  «Manh Phan». Giấy phép, lựa chọn thiết kế và chữ ký là lời của người.

## Cách chủ kho muốn làm việc

- Trả lời **tiếng Việt**, bằng **tiếng sản phẩm**: bỏ hết tên tệp, tên hàm đi thì câu vẫn phải có nghĩa.
- Chạy hết rồi mới hỏi. Kết bài **tối đa một quyết định**, trả lời một chạm; một khuyến nghị kèm căn cứ, không bày
  menu.
- Việc đảo được và máy chắc thì làm, báo sau. Việc phán xét, trách nhiệm hay khó đảo thì hỏi trước.
- Báo cáo trung thực: nói rõ điều chưa làm và điều chưa tự kiểm; điều đã nói hoá ra sai thì nói lại ở lượt sau.
- Mỗi nhánh có một commit mang `Plan: <mục>` hoặc `Plan: off-plan — <lý do>`; việc ngoài kế hoạch nêu nó thuộc giai
  đoạn nào và làm chậm mục nào.
- Chỉ commit hay đẩy khi chủ kho bảo. Mô tả PR viết tiếng Việt.

## Ràng buộc cứng

- **Thư mục `plugins/` chỉ viết tiếng Anh, không nêu tên sản phẩm hay kho của chủ kho.** Tên thư viện bên thứ ba chỉ
  nằm trong bộ chuyển hoặc dưới `plugins/design-assembly/references/plugs/`.
- **Không sửa năm tệp của Repo Standards**: khối lint của sàn, `tools/design_guards.mjs`, `tests/e2e/floor.spec.ts`,
  `mk/design.mk`, `.claude/rules/ui.md`. Không sửa `.github/workflows/`.
- **Thay đổi `ontology/` cần người duyệt**, làm qua skill `/ontology-add`.
- **Địa chỉ thư của chủ kho là riêng tư**: không ghi vào tệp nào, không gửi ra dịch vụ ngoài.
- Không gửi hình của một repo ra dịch vụ ngoài; mắt soát chạy trong phiên của chủ kho.
- `make check` xanh trước khi nói xong; mỗi việc một dòng `wiki/log.md`; lựa chọn đáng kể thì một bản ghi quyết định;
  lỗi lọt qua mọi lệnh kiểm thì ghi một dòng ở `design/escapes.md` trước khi sửa.
- Gộp PR: `gh pr merge <n> --repo phanlemanh/design-assembly --merge --match-head-commit <sha đủ 40 ký tự>`, rồi
  `git switch main` và `git pull --ff-only`.

## Bẫy đã gặp

- **Dòng `Plan:` phải nằm ở đoạn cuối của thông điệp commit**, liền với dòng đồng tác giả, không có dòng trống ở giữa.
  Sai thì `make check` đỏ sau khi commit dù trước đó xanh.
- **Một hook của máy từ chối lệnh nào có cả `git commit` lẫn một cờ `-n`** (nó đọc `grep -n`, `sed -n` thành
  `--no-verify`). Tách thành các lệnh riêng; commit bằng `git commit -q -F <tệp>`.
- `.claude/settings.json` của kho này từ chối `rm -rf`, đẩy ép, `git reset --hard`, đẩy thẳng `main`.
- **zsh** không tự mở mẫu tên tệp không nháy trong tham số: viết `--include="*.mjs"`.
- **Bài kiểm của plugin đếm ít hơn trong một thư mục làm việc** dưới `.claude/worktrees/` so với bản checkout chính,
  vì gói cài ở đó khác. Con số của CI và của bản checkout chính mới là số để dựa vào.
- **Hai lượt chạy trình duyệt cùng lúc tranh nhau.** Chờ `make check` xong rồi mới chạy thử trình duyệt trên bản sao.
- **PR xếp chồng:** PR nhắm vào nhánh của một PR khác phải được chuyển đích sang `main` sau khi PR dưới gộp.
- **Hai PR cùng thêm một dòng đầu `wiki/log.md` sẽ xung đột.** Gỡ bằng cách giữ cả hai dòng.
- **Chứng một điều «không có» cần biết gói ngoài làm gì thật.** Đọc mã hay tài liệu đi kèm gói trước khi viết luật dựa
  vào nó; lỗi font ở trên đến từ một giả định về bộ nạp font.
- **Thư mục tạm của phiên mất theo phiên.** Thứ cần đo lại phải là một lệnh trong kho.
- Sau `make format`, chạy `make design-apply` rồi mới `make check`, để bản công cụ trong kho khớp bản mẫu của plugin.
- Đổi hình dạng một sổ hay một lệnh kiểm thì bài kiểm cũ của plugin đỏ theo. Phân biệt kỳ vọng cũ với lỗi thật trước
  khi sửa bài kiểm.
- Từ một thư mục làm việc dưới `.claude/worktrees/`, đường `../onehub-inventory` không tới được repo kiểm chứng: truyền
  `REFERENCE_LEDGER=<đường tuyệt đối> ACCEPTANCE_KIT=<đường tuyệt đối>`.
- **Báo cáo của `status` phải vừa một màn hình, 40 dòng**, và một bài kiểm giữ điều ấy cùng danh sách khoá của kết quả
  máy đọc. Thông tin mới thì gộp vào một dòng đang có, như dòng bộ sổ lúc ra đời nằm trên dòng của nhịp «repo ra đời».
- **Mỗi `note` của sổ giới hạn là một câu**, mở bằng chữ hoa và kết bằng dấu chấm; mở bằng tên lệnh viết thường thì bài
  kiểm đỏ.
- `rm -rf` bị từ chối cả ở thư mục tạm: dựng bản sao bỏ đi bằng `mktemp -d`, mỗi lần một thư mục mới.
- Ngay sau khi đẩy một nhánh, lần đọc CI đầu có thể gặp lỗi tạm của GitHub hoặc chưa thấy lượt chạy nào. Đó không phải
  CI đỏ: nói đúng như vậy và chờ chủ kho nhắn lại.
