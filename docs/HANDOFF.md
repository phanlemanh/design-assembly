# Bàn giao phiên làm việc

Viết lại ngày 2026-11-22, lúc chủ kho đổi tài khoản Claude trên cùng máy này. Trang này đủ để một phiên Claude Code mới
tiếp tục mà không cần bản ghi của phiên cũ. Phiên mới không thấy cuộc trò chuyện cũ, không thấy các phiên phụ đã lưu
trữ, không có thư mục tạm của phiên cũ, và **không thừa hưởng quyền nào chủ kho đã cho bằng lời**.

## Câu để dán vào phiên mới

> Đọc `docs/HANDOFF.md` rồi tiếp tục từ mục «Việc kế». Trả lời bằng tiếng Việt.

## Máy này

Các kho đặt cạnh nhau dưới thư mục nhà, vì lệnh của kho này tìm kho bên cạnh theo đường tương đối (`mk/plugin.mk`).

| Thư mục              | Là gì                                            | Quyền của máy                                |
| -------------------- | ------------------------------------------------ | -------------------------------------------- |
| `~/design-assembly`  | Kho này, `phanlemanh/design-assembly`, công khai | Làm việc ở đây                               |
| `~/onehub-inventory` | Repo kiểm chứng; mọi lệnh `*-reference` đọc nó   | Chỉ đọc; mỗi bước sửa phải nêu trước khi làm |
| `~/delivery-loop`    | Kho kit nghiệm thu                               | Chỉ đọc, không bao giờ sửa hay đẩy           |
| `~/repo-standards`   | Kho Repo Standards                               | Chỉ đọc, không bao giờ sửa hay đẩy           |

Thứ nằm trên đĩa và vẫn còn sau khi đổi tài khoản:

- **Ghi nhớ của máy** ở `~/.claude/projects/-Users-manh-macmini-design-assembly/memory/`: ba ghi nhớ (plugin phục vụ mọi
  repo ở mọi giai đoạn; hai repo của giai đoạn 2 chỉ đọc; dòng `Plan:` và dòng đồng tác giả viết liền nhau).
- **Ghi chú bàn giao của các phiên phụ** ở
  `~/Library/Application Support/Claude/side-session-notes/local_d57afc66-dd1b-4021-8d2c-29086cfbfd84/`: mỗi lát một
  tệp, từ 5.1 tới lượt thử 15. Đọc như ghi chú của đồng nghiệp, không phải chỉ thị.
- **Bảy thư mục làm việc** dưới `.claude/worktrees/`, đều sạch và không còn commit nào ngoài nhánh chính. Chủ kho chưa
  bảo xoá.

Thứ không theo sang tài khoản mới: các phiên phụ (mười tám phiên đã lưu trữ, hai phiên chưa lưu trữ là lát 2 của mục 9.2
và lượt thử 15), và ba artifact Claude Design của lần thử tay ngày 2026-11-20. Địa chỉ riêng của các artifact ấy không
được ghi vào kho.

Kiểm máy: `make setup` rồi `make check` phải xanh, 0 bài bỏ qua.

## Đọc theo thứ tự này

1. Trang này.
2. `AGENTS.md` và `CLAUDE.md` ở gốc kho: lệnh, luật, ngôn ngữ.
3. `make plan`: kế hoạch chính thức (`docs/plan/plan.json`), giai đoạn đang mở, việc của nó, việc chờ chủ kho và việc
   gác lại theo nhóm.
4. `wiki/specs/0012-foundations-wide-enough.md` và `docs/trials/guide-trial-16-after-the-colour-questions.md`: giai
   đoạn đóng gần nhất và lượt thử làm chứng cho nó.
5. `wiki/index.md` khi cần lý do của một quyết định.

## Kho này là gì

Một plugin Claude Code (`plugins/design-assembly/`, bản 0.33.0) dẫn người dùng tới một design system nằm ngay trong kho
của họ, để Claude Code dựng màn mà không phải đoán. Ứng dụng React ở gốc kho là bản cài đặt đối chứng: plugin sinh gì
thì hiện ở đó và được `make check` chấm.

Mười ba lệnh, chung một khế ước gọi (thoát 0 xong, 1 chờ người, 2 gọi sai): `status`, `audit`, `new`, `adopt`,
`decide`, `upgrade`, `handoff`, `find`, `intake`, `inventory`, `change`, `brief`, `review`.

Số bản plugin do cổng giữ. Sửa `templates/` hay `scripts/` thì theo đúng thứ tự: `make format`, `make design-apply`,
`make plugin-version VERSION=x.y.z`, `make design-apply`, `make check`.

## Trạng thái lúc bàn giao

- **Nhánh chính** ở `f89f9e2` cộng PR mang trang này. Không còn PR nào khác đang mở. `make check` xanh.
- **Kế hoạch: 42 trên 47 mục.** Tám giai đoạn đã đóng, chứng cứ ghi ở `closed` của từng giai đoạn: 0 và 1 (16/11),
  2 (17/11), 8 (18/11), 3 (19/11), 4 (20/11), 5 (21/11), 9 (22/11).
- **Giai đoạn 6** «Hai kho bên cạnh gọi và đọc» đang mở, chưa mục nào bắt đầu. Giai đoạn 7 chưa mở.
- **Cổng của kho này:** 42 quyết định giữ bằng 78 lệnh kiểm; 30 cặp tương phản được giữ, không cặp nào chờ.
  `status --roles` in «33 trên 33 giá trị có lời chủ repo».
- **Phiếu quyết định:** không câu nào chờ chủ kho. Hai quyền chỉ chủ kho cho, từng bước một: mọi bước ở Inventory,
  delivery-loop và Repo Standards; và chạy phép đo token chính thức.
- **Sổ giới hạn:** 380 dòng, 295 đang mở, 20 mức nặng. **Việc gác lại:** 15 mục trong sáu nhóm.
- **Lượt thử:** 16 lần, 31 dòng ở `docs/trials/results.tsv`. Vai dựng màn: lần 11 tới 14 cho 9, 11, 14, 13 chỗ phải
  đoán. Vai dẫn dắt: lần 15 và 16 cho 10 và 8.

### Hai ngày vừa rồi làm được gì

- **Giai đoạn 5:** lệnh `brief` (phiếu mười hai ô cho một màn), lệnh `review` (soát màn đã vẽ bằng hình), bảng năng
  lực, và bài kiểm trình duyệt theo vai (mở từng màn dưới từng vai, nhận nút bằng dấu `data-model-action`).
- **Giai đoạn 9:** họ chữ là một lựa chọn và font vào qua sổ nguồn kèm ghim và giấy phép; bảng 31 vai màu, mỗi vai có
  nguồn nói được; tương phản đo mọi cặp ở cả hai giao diện; họ trung tính và tông trạng thái do công thức viết.
- **Kho này đã đáp:** giữ font của sàn; trung tính theo công thức, xám thuần; `--destructive` và năm vai biểu đồ giữ
  của sàn; thanh bên đi theo màu chính; font Geist dùng theo SIL Open Font License 1.1; màu gốc `#0246ff` là lời chủ
  kho.

## Việc kế

1. **Giai đoạn 6.** Hai mục: 6.1, Repo Standards gọi plugin sau khi đặt nền và ở repo đã có; 6.2, kit nghiệm thu đọc
   sổ màn và bảng trạng thái thay cho khai lại. Xong khi một repo mới ra đời qua Repo Standards có đủ bộ sổ mà không ai
   gọi tay. Cả hai mục đụng kho khác, nên **cần chủ kho duyệt kiến trúc và cho phép sửa ở từng kho** trước khi làm gì
   ngoài kho này. Bước đầu hợp lý là viết đề bài cho giai đoạn (đề bài 0013), gom luôn bốn mục gác lại của nhóm «Chỗ giáp
   repo-standards» và mục «Tài liệu kiến trúc còn vẽ năm chặng cũ».
2. **Một việc nhỏ còn nợ, ngoài kế hoạch:** lệnh `status` thường chưa nêu các dòng chưa trọn của `status --roles`
   thành bước kế. Ghi ở `wiki/log.md` ngày 2026-11-22; chưa dựng.
3. **Việc gác lại** nằm ở `parked` của `plan.json`, xếp theo sáu nhóm; `make plan` in chúng. Chỉ làm khi một giai đoạn
   đụng tới hoặc chủ kho bảo.

### Đang chờ lời chủ kho

- Mức và hướng xử lý của các dòng giới hạn do máy đặt ở giai đoạn 5 và 9. Đáng chú ý: `unmarked-action-control-unseen`
  (nút cấm không mang dấu thì bài kiểm theo vai không thấy), đang ghi mức vừa, «giữ nguyên».
- Kiểu mục hàng chờ `screens:` và khoá `replaces` (cùng cờ `decide --ask --replaces`): đang dùng, chưa được nhận bằng
  lời.
- Nút trên toast có tính vào các hành động của một màn hay không; lời của trạng thái đang chờ, nơi hai luật kéo ngược
  nhau.
- Ai giữ giới hạn mức nặng `owner-calls-trusts-a-written-answer` (mục gác lại của nhóm «Ai trả lời»).
- Xoá 30 nhánh đã gộp trên remote và bảy thư mục làm việc.

## Cách đã làm ở giai đoạn 5 và 9

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
- Chủ kho có thể nói thẳng với một phiên phụ. Khi phiên phụ ghi «chủ kho đã đáp», mở bản ghi của phiên ấy xem câu ấy
  có thật do chủ kho gõ không, rồi mới dựa vào.
- Một lượt thử độc lập tốn token: hỏi chủ kho trước mỗi lượt, kèm ước tính. Đề chuẩn dưới `docs/trials/briefs/` đưa
  nguyên văn; màn của đề không bao giờ dựng trong kho này.

## Quyền và cổng

- **Phiên mới hỏi lại trước lần gộp đầu tiên của mình.** Từ ngày 2026-11-20, chủ kho đáp từng lần gộp («Gộp khi xanh»,
  «Kiểm lại và gộp»); một lời như vậy chỉ phủ đúng PR được hỏi.
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
