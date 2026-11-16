# Bàn giao phiên làm việc

Viết lại ngày 2026-11-16, lúc chủ kho chuyển sang máy Mac Studio. Trang này đủ để một phiên Claude Code mới tiếp tục mà
không cần bản ghi của phiên cũ. Phiên mới không thấy cuộc trò chuyện cũ, không có thư mục tạm và bộ nhớ của máy cũ, và
**không thừa hưởng quyền nào chủ kho đã cho bằng lời**.

## Câu để dán vào phiên mới

> Đọc `docs/HANDOFF.md` rồi tiếp tục từ mục «Việc kế». Trả lời bằng tiếng Việt.

## Chuẩn bị máy mới

Các kho đặt cạnh nhau dưới `~/dev/`, vì lệnh của kho này tìm kho bên cạnh theo đường tương đối (`mk/plugin.mk`).

| Thư mục                             | Lấy từ                                       | Dùng để                                        |
| ----------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| `~/dev/design-assembly`             | `phanlemanh/design-assembly` (riêng tư)      | Kho này                                        |
| `~/dev/onehub-inventory`            | `phanlemanh/onehub-inventory`                | Repo kiểm chứng; mọi lệnh `*-reference` đọc nó |
| `~/dev/delivery-loop`               | kho kit nghiệm thu, nhánh `chuyen-nha`       | Bậc M của kit; chỉ đọc                         |
| `~/dev/acceptance-gate-kit-v2.38.0` | `phanlemanh/acceptance-gate-kit`, bản 2.38.0 | Marketplace thư mục của các plugin nghiệm thu  |
| `~/dev/repo-standards`              | kho Repo Standards                           | Chỉ đọc                                        |

Rồi:

1. `make setup` trong kho này và trong `~/dev/onehub-inventory`. **Thiếu thư viện ở Inventory thì lệnh `upgrade` báo sai**
   (sổ token mất 37 mục, cổng đỏ); xem «Bẫy đã gặp».
2. Thêm marketplace `acceptance-gate-kit` từ thư mục `~/dev/acceptance-gate-kit-v2.38.0`, cài `acceptance-gate`,
   `feature-loop`, `dieu-phoi`. Cài `superpowers` từ `claude-plugins-official`.
3. Đặt ghi nhớ của chủ kho: ghi nhớ của máy cũ nằm ở `~/.claude/projects/-Users-manhphan-dev-design-assembly/memory/`,
   không tự sang máy mới. Chép thư mục ấy sang, hoặc để phiên mới tự học lại từ trang này.
4. Kiểm máy: `make check REFERENCE_LEDGER=$HOME/dev/onehub-inventory ACCEPTANCE_KIT=$HOME/dev/delivery-loop` phải xanh,
   0 bài bỏ qua.

## Đọc theo thứ tự này

1. Trang này.
2. `AGENTS.md` và `CLAUDE.md` ở gốc kho: lệnh, luật, ngôn ngữ.
3. `make plan`: kế hoạch chính thức (`docs/plan/plan.json`, quyết định 0040), giai đoạn đang mở, việc của nó và việc chờ
   chủ kho.
4. `docs/trials/upgrade-inventory.md`: lần lên đời Inventory, việc đang dở.
5. `wiki/index.md` khi cần lý do của một quyết định.

## Kho này là gì

Một plugin Claude Code (`plugins/design-assembly/`, bản 0.1.0) dẫn người dùng tới một design system chuẩn hoá nằm ngay
trong kho của họ, để Claude Code dựng màn mà không phải đoán. Ứng dụng React ở gốc kho là bản cài đặt đối chứng: plugin
sinh gì thì hiện ở đó và được `make check` chấm.

Bảy lệnh của plugin, chung một khế ước gọi (thoát 0 xong, 1 chờ người, 2 gọi sai; quyết định 0044) và một khung tài liệu
(quyết định 0046):

- **status**: một màn hình nấc đã tới, việc chờ, bản công cụ có lệch không, lệnh nên chạy kế.
- **audit**: chỉ đọc, đo theo danh mục quyết định chuẩn.
- **new**: cuộc dẫn dắt dựng hệ mới. **adopt**: nhận hệ đã có, không đổi gì của kho.
- **decide**: tờ gom mọi câu chờ chủ kho (`design/waiting-list.json`), ghi lời đáp kèm tên và ngày.
- **upgrade**: đưa công cụ của plugin vào repo đã có bản sao; in trước mọi thay đổi, dừng khi mất mục hay cổng đỏ; ghi
  dấu bản `design/tool-stamp.json` (quyết định 0047).
- **handoff**: cuốn sổ bàn giao design system.

Số bản plugin do cổng giữ: sửa `templates/` hay `scripts/` thì chạy `make plugin-version VERSION=x.y.z`.

## Trạng thái lúc bàn giao

- **Nhánh chính** ở GitHub: xem `git log origin/main`. Trang này vào nhánh chính cùng bản ghi lần lên đời và dòng giới
  hạn mới.
- **Giai đoạn 0** đóng ngày 2026-11-16, chứng cứ ghi trong `plan.json`.
- **Giai đoạn 1** «Cài được, lên đời được»: 3 trên 4 mục xong. Mục **1.4** (repo kiểm chứng nhận hai bản sửa còn nợ bằng
  `upgrade`) đang dở, xem dưới.
- **Giai đoạn 2** «Đo độ rộng» được chạy song song, chưa bắt đầu: chờ chủ kho chỉ định hai repo.
- **25 câu của hàng chờ** đã được chủ kho đáp «Giữ hết» ngày 2026-11-16; `make design-decide` báo không còn câu nào.

### Mục 1.4: lên đời Inventory, đang dở

- PR [phanlemanh/onehub-inventory#72](https://github.com/phanlemanh/onehub-inventory/pull/72), nhánh
  `chore/upgrade-design-assembly`.
  - Hồ sơ `_acceptance/upgrade-design-assembly-tool/` của Inventory: chủ kho duyệt phạm vi, kế hoạch, và **đã ký Cổng
    Bằng chứng** ngày 2026-11-16.
  - Lượt chấm 1 ĐẠT.
  - CI xanh trên đầu nhánh `d40007f`.
- **Chưa gộp**, vì Inventory đang chạy một đợt điều phối riêng (`dieu-phoi-nen`, giám sát là phiên «G · Giám sát đợt
  dieu-phoi-nen»). Giám sát xếp #72 gộp sau #65 (đã gộp) và #69 (dán từ Excel). Lần lên đời đi dưới tên dãy C của đợt.
- **Đợt ấy chạy trên máy cũ**: bộ phát lịch, khoá chấm và phiên giám sát đều ở đó. Đổi máy thì có hai đường:
  - đợt vẫn chạy ở máy cũ: chờ giám sát báo «hàng 5 đã gộp», rồi làm bốn bước dưới;
  - đợt được bàn giao sang máy mới bằng `/dieu-phoi:ban-giao` ở máy cũ rồi `/dieu-phoi:tiep-tuc` ở máy mới: phiên mới
    ghi danh lại dãy C từ worktree mới trước khi xin khoá.
- Bốn bước khi tới lượt, trong worktree của nhánh ở Inventory:
  1. gộp nhánh chính mới vào nhánh (luật gộp của đợt: sổ linh kiện lấy main rồi `make gen`; `_acceptance/config.yaml` giữ
     cả hai; LO-TRINH và PRODUCT-MAP lấy main rồi sinh lại; `wiki/log.md` giữ cả hai);
  2. xin khoá chấm của đợt, ghim lại bằng chứng bằng làn máy của kit: `repin-lane.mjs --root . --slug
upgrade-design-assembly-tool --reason "gộp main" --write`; nhả khoá;
  3. đẩy, chờ CI xanh;
  4. xin khoá gộp, `dieu-phoi.mjs gop 72`, báo giám sát sha đã gộp.
- Gộp xong thì ở kho này:
  - đánh dấu 1.4 xong trong `plan.json`, ref là PR #72;
  - xoá dòng «16 vs 18» ở `parked` (đã truy xong, xem bản ghi lần lên đời);
  - đóng giai đoạn 1 nếu cả hai điều kiện «xong khi» chứng được bằng lệnh. Điều kiện hai: với Inventory ở nhánh chính,
    `make design-status-reference` báo bản công cụ khớp bản plugin đang cài, và `make design-upgrade-reference` báo
    không có gì để ghi.

## Việc kế

1. Hoàn tất mục 1.4 như trên.
2. Giai đoạn 2: chờ chủ kho chỉ định hai repo để rà soát chỉ đọc (một repo web ngoài họ, một repo cùng họ khác Inventory).
3. Dòng giới hạn mới cần sửa ở plugin: `upgrade-blames-ledger-for-missing-dependencies`. Lỗi «nhận không ghi gì khi repo
   không có Makefile» (`adopt-without-makefile-writes-nothing`) đã để dành, sửa khi giai đoạn 2 gặp loại repo ấy.

## Quyền và cổng

- **Lời chủ kho ngày 2026-11-15, nguyên văn:** «Để bảo hiệu quả khi thực hiện dự án, bạn giữ toàn quyền điều phối các phiên
  mở ra và sắp xếp giải quyêt các vấn đề phát sinh, bạn toàn quyền sắp xếp gộp và gộp. Bạn cũng giữ quyền thêm lượt để
  đạt được hiệu quả cao nhất. Tôi chỉ xuất hiện ở các cổng.»
  - Phiên mới hỏi lại một chạm trước lần gộp đầu tiên của mình, vì quyền bằng lời không theo sang phiên mới.
- **«Cổng»** — cách máy hiểu, chủ kho chưa sửa:
  - việc của kế hoạch ghi «needs the owner»;
  - hàng chờ;
  - thay đổi `ontology/`;
  - mọi thay đổi ở Inventory (nhánh riêng, hồ sơ có chữ ký);
  - việc ngoài kế hoạch làm chậm một mục;
  - việc khó đảo.
- **Inventory:** cho phép theo từng bước. Lên đời bằng `upgrade` đã được cho phép ngày 2026-11-16. Gộp đi qua khe của
  đợt Inventory; chủ kho dặn đợt ấy «báo trước khi gộp PR ngoài đợt», nên luôn báo giám sát trước.
- **`delivery-loop` và `repo-standards`:** chỉ đọc, không bao giờ sửa hay đẩy.

## Cách chủ kho muốn làm việc

- Trả lời **tiếng Việt**, bằng **tiếng sản phẩm**: bỏ hết tên tệp, tên hàm đi thì câu vẫn phải có nghĩa.
- Nhịp **phân tích, đánh giá, hoàn thiện, đề xuất**. Chạy hết rồi mới hỏi.
- Kết bài **tối đa một quyết định**, trả lời một chạm. Một khuyến nghị kèm căn cứ, không bày menu.
- Việc đảo được và máy chắc thì **làm, báo sau**. Chỉ việc phán xét, trách nhiệm hay khó đảo mới hỏi trước.
- Máy không phát ngôn hộ quyết định: không viết sẵn lời đáp, verdict hay chữ ký.
- Báo cáo trung thực: không gọi «máy giữ» cho thứ mới «tự khai»; điều đã nói hoá ra sai thì nói lại ở lượt sau.
- Mỗi nhánh có một commit mang `Plan: <mục>` hoặc `Plan: off-plan — <lý do>`; việc ngoài kế hoạch nêu một dòng nó thuộc
  giai đoạn nào và làm chậm mục nào.

## Ràng buộc cứng

- **Thư mục `plugins/` chỉ viết tiếng Anh, không nêu tên sản phẩm hay kho của chủ kho.** Tên kho thật chỉ nằm ở
  `mk/plugin.mk`.
- **Không sửa năm tệp của Repo Standards**: khối lint của sàn, `tools/design_guards.mjs`, `tests/e2e/floor.spec.ts`,
  `mk/design.mk`, `.claude/rules/ui.md`.
- **Thay đổi `ontology/` cần người duyệt**, làm qua skill `/ontology-add`. **Cài gói mới phải hỏi trước.**
- `make check` xanh trước khi nói xong; mỗi việc một dòng `wiki/log.md`; lựa chọn đáng kể thì một bản ghi quyết định.
- Gộp PR: kiểm `git rev-list --count origin/main..main` bằng 0 trước, rồi
  `gh pr merge <n> --merge --match-head-commit <sha đủ 40 ký tự>`.

## Bẫy đã gặp

- **Thiếu thư viện thì `upgrade` và lệnh kiểm đọc sai stylesheet.** Stylesheet của Inventory nhập bảng màu của Tailwind
  từ thư mục thư viện. Worktree mới phải `make setup` trước khi xem trước.
- **Heredoc không nháy chạy dấu nháy ngược như lệnh.** Ghi sổ quyết định bằng `<<'JSON'` (có nháy), không `<<JSON`.
- **Ở Inventory, mọi lệnh chấm cần khoá của đợt**, kể cả làn trước chữ ký chỉ bỏ qua. Xin bằng `dieu-phoi.mjs xin s4`,
  chạy việc dài qua `giu-nhip.mjs` để khoá không bị thu hồi; nhường khi giám sát xếp lại.
- **Bộ dò khoá bí mật của Inventory báo nhầm mã băm** trong tệp tham số lượt chấm (`s4-args.json`). Tệp ấy không commit.
- **Công cụ Workflow không đọc tham số từ tệp.** Truyền tham số lượt chấm thẳng, bỏ hai trường ảnh chụp băm
  (`thuocChup`, `cayChup`): lượt chấm không đọc chúng, bước sau lượt đọc chúng từ tệp trên đĩa.
- **Commit ở Inventory** đi qua kiểm thông điệp commit kiểu Conventional Commits, bộ định dạng và bộ dò khoá bí mật.
- `.claude/settings.json` của kho này: `rm -rf`, đẩy ép, `git reset --hard`, đẩy thẳng `main` bị từ chối. Tạo thư mục mới
  thay vì xoá.
- `make check` xem thử ở một cổng suy từ thư mục của bản làm việc, nên nhiều bản làm việc chạy cùng lúc không tranh nhau.
- **Thư mục tạm của phiên mất theo phiên.** Thứ cần đo lại phải là một lệnh trong kho, như `make design-ladder`.
- Sau `make format`, chạy `make design-apply` rồi mới `make check`, để bản công cụ trong kho khớp bản mẫu của plugin.
- Kho đối chứng đổi trong lúc mình làm. Đừng dựa vào con số đọc từ nó ở lượt trước.
- Đổi hình dạng một sổ hay một lệnh kiểm thì bài kiểm cũ của plugin đỏ theo. Phân biệt kỳ vọng cũ với lỗi thật trước khi
  sửa bài kiểm.
- Tác tử báo về là báo cáo, chưa phải bằng chứng: tự kiểm lại trước khi sửa hay gộp.
