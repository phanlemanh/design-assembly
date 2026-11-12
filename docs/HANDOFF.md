# Bàn giao phiên làm việc

Viết ngày 2026-11-12, lúc chủ kho đổi tài khoản giữa chừng. Trang này đủ để một phiên Claude Code
mới tiếp tục mà không cần bản ghi của phiên cũ. Khi phiên mới đã bắt nhịp và có bàn giao mới hơn,
sửa trang này hoặc xoá nó.

## Câu để dán vào phiên mới

> Đọc `docs/HANDOFF.md` rồi tiếp tục từ mục «Việc đang chờ anh trả lời». Trả lời bằng tiếng Việt.

## Đọc theo thứ tự này

1. Trang này.
2. `AGENTS.md` và `CLAUDE.md` ở gốc kho: lệnh, luật, ngôn ngữ.
3. `wiki/index.md`, rồi `wiki/specs/0001-design-system-for-claude-code.md` (đề bài và kết quả từng
   lát, ba lần chạy thử).
4. Bản ghi quyết định `wiki/decisions/0005` đến `0015`: mỗi phần đã dựng có một bản, kèm giới hạn.
5. `plugins/design-assembly/references/checks.md`: mọi tệp plugin để lại ở một kho, và mỗi loại
   lệnh kiểm.

Ghi nhớ của máy (nếu phiên mới chạy trên cùng máy, cùng người dùng hệ điều hành thì tự nạp):
`~/.claude/projects/-Users-manhphan-dev-design-assembly/memory/`. Trang này lặp lại mọi điều cần
từ đó, phòng khi ghi nhớ không theo sang.

## Kho này là gì

Một plugin Claude Code (`plugins/design-assembly/`) dẫn người dùng tới một design system chuẩn hoá
nằm ngay trong kho của họ, để Claude Code dựng màn mà không phải đoán. Ứng dụng React ở gốc kho là
bản cài đặt đối chứng: plugin sinh gì thì hiện ở đó và được `make check` chấm.

Ba đường của plugin:

- **audit** (`scripts/inventory.mjs`): chỉ đọc. Đo kho theo danh mục quyết định chuẩn, nói bậc đã
  tới, và in dòng `next:` chỉ skill kế tiếp.
- **new** (`scripts/apply.mjs`): cuộc dẫn dắt. Sinh giá trị từ lựa chọn của người, cài lệnh kiểm.
- **adopt** (`scripts/adopt.mjs`): nhận cái kho đã có, không đổi gì của kho.

Nguyên tắc xuyên suốt: mỗi quyết định thiết kế là một dòng trong sổ `design/decisions.yaml`, trỏ
tới thứ chứng minh nó. Lệnh kiểm của plugin đọc tệp thật và mỗi lần chạy đều tự chứng minh nó đỏ
được trên một bản bị đổi.

## Trạng thái lúc bàn giao

- Nhánh `main`, cây làm việc sạch, commit cuối trước trang này là
  `b09e30b`. **Chưa có remote, chưa đẩy đi đâu**: kho
  chỉ nằm trên máy này. Mọi thứ đều đã commit.
- `make check` xanh: lint, typecheck, 50 bài kiểm của kho, ontology, lệnh kiểm design-assembly
  (17 quyết định, 22 lệnh kiểm), bộ rào của sàn, 16 bài kiểm trình duyệt, 132 bài kiểm của plugin.
- Kho này đáp **28/38 quyết định lõi**: 11 máy giữ, 14 tự khai, 3 đã ghi. Sổ có 34 dòng.

| Bậc                           | Trạng thái       | Còn thiếu                                            |
| ----------------------------- | ---------------- | ---------------------------------------------------- |
| audit                         | đạt              |                                                      |
| foundations                   | 9/9, «tự khai»   | lên «đạt» khi các luật lint của sàn được chạy lại    |
| core components               | 10/10, «tự khai» | như trên                                             |
| trạng thái của màn và lời văn | 7/8              | mở hồ sơ cạnh danh sách: chưa có màn nào cần         |
| templates                     | 0/8              | chưa dựng, là việc kế                                |
| governance                    | 2/3              | hướng nhập giữa các phần; tệp ghi các lần lệch chuẩn |

## Đã dựng gì, theo thứ tự

| Phần                                                       | Bản ghi | Tệp chính                                                                          |
| ---------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| Bậc deliverable, ranh giới với hai kho bên cạnh, audit     | 0005    | `references/tiers.json`, `scripts/inventory.mjs`                                   |
| Sổ chuẩn, bảy tầng, danh mục 66 quyết định (38 lõi)        | 0006    | `templates/tools/design-assembly/ledger.mjs`, `references/standard-decisions.json` |
| Adopt: nhận giá trị kho đã có                              | 0007    | `scripts/adopt.mjs`, `references/known-proofs.json`                                |
| Tệp design tokens sinh từ stylesheet                       | 0008    | `templates/tools/design-assembly/tokens.mjs`                                       |
| Sổ linh kiện sinh từ mã nguồn                              | 0009    | `templates/tools/design-assembly/components.mjs`                                   |
| Chỉ dòng sổ mới là lời đáp; audit in bước kế               | 0010    | `scripts/inventory.mjs`, `scripts/proofs.mjs`                                      |
| Cỡ vùng bấm đo từ mã nguồn                                 | 0011    | `components.mjs`                                                                   |
| Bảng dữ liệu: kiểu cột quyết định canh lề, bề rộng, mật độ | 0012    | `templates/tools/design-assembly/columns.mjs`, `src/components/ui/typed-table.tsx` |
| Trạng thái, chữ, câu báo lỗi                               | 0013    | `templates/tools/design-assembly/patterns.mjs`                                     |
| Kênh thông báo, hoàn tác, bài kiểm gắn thẻ làm bằng chứng  | 0014    | `src/lib/notify.ts`, `scripts/proofs.mjs`                                          |
| Trang luật cho tác tử; dòng sổ chưa có lệnh kiểm           | 0015    | `.claude/rules/design-assembly.md`, cờ `--hold` của adopt                          |

Lệnh hay dùng ở kho này: `make design-audit`, `make design-plan`, `make design-apply`,
`make design-adopt`, `make design-adopt-reference` (xem trước trên kho đối chứng, không bao giờ
ghi), `make design-tokens`, `make design-components`, `make design-columns`, `make plugin-test`.

## Việc đang chờ anh trả lời

Câu hỏi cuối của phiên cũ, **chưa được trả lời**:

> Chuẩn bị phương án cho bậc templates, kèm luật cho thao tác thất bại?

Nếu anh đồng ý, lượt đó **chỉ phân tích và đề xuất, chưa dựng gì**, làm đúng như hai lần trước:

1. Đọc luật chủ kho đã viết ở kho đối chứng (`~/dev/onehub-inventory`: `design/patterns/`,
   `design/screens.yaml`, `design/behaviors.md`, `design/states.md`). **Đọc lại từ đầu**: kho đó
   đang được phát triển song song và đã đổi luật hai lần trong ngày 12/11.
2. Đọc cái sàn đã có ở kho này (`src/screens.ts`, `tests/e2e/floor.spec.ts`, `design/behaviors.md`).
3. Tra chuẩn ngành tại nguồn, không theo trí nhớ. Trang nào không đọc được thì nói là không đọc
   được.
4. Trình một bộ khuyến nghị, mỗi câu có khuyến nghị trước rồi phương án khác một dòng, và hỏi
   đúng một câu duyệt.

Tám câu của bậc templates: việc chính của mỗi màn; thứ tự thông tin; lời văn của màn; mỗi trang có
đúng một vùng chính và một tiêu đề; trang không cuộn ngang; trang qua kiểm accessibility tự động;
các cỡ màn được kiểm; màn mẫu của từng kiểu màn. Ba câu giữa đã có bài kiểm trình duyệt của sàn
nhưng chưa vào sổ được (xem «Điều còn mở»).

Luật cần gộp vào bộ khuyến nghị đó, vì tác tử dựng màn đã phải đoán: **một thao tác làm ngay mà
thất bại thì báo thế nào, và hoàn tác thất bại thì sao**.

## Cách chủ kho muốn làm việc

Đây là yêu cầu đã lặp lại nhiều lần, không phải gợi ý.

- Trả lời **tiếng Việt**, bằng **tiếng sản phẩm**: bỏ hết tên tệp, tên hàm đi thì câu vẫn phải có
  nghĩa.
- Nhịp: **phân tích, đánh giá, hoàn thiện, đề xuất**. Chạy hết rồi mới hỏi.
- Kết bài **tối đa một quyết định**, trả lời được bằng một chạm. Một khuyến nghị kèm căn cứ, không
  bày menu. Không có gì cần người thì nói thẳng rồi dừng.
- Việc đảo được và máy chắc thì **làm, báo sau**. Chỉ việc phán xét, trách nhiệm hay khó đảo mới
  hỏi trước.
- Máy không phát ngôn hộ quyết định: không tự đặt «đã duyệt», không viết sẵn verdict. Điều gì máy
  đề xuất thay người thì ghi rõ là đề xuất.
- Báo cáo trung thực: không gọi «máy giữ» cho thứ mới «tự khai»; nêu giới hạn; khi một điều đã nói
  hoá ra sai thì nói lại thẳng ở lượt sau.
- Commit khi xong một việc đã được duyệt («làm tiếp» là đủ). Commit theo Conventional Commits,
  tiếng Anh.

## Ràng buộc cứng

- **Không đẩy, không tạo kho trên GitHub.** Việc đó chủ kho tự làm.
- **Không sửa ba kho bên cạnh**: `~/dev/repo-standards`, `~/dev/delivery-loop` (kit nghiệm thu,
  nhánh `chuyen-nha`), `~/dev/onehub-inventory` (kho đối chứng). Chỉ đọc, hoặc xem trước không ghi.
  Muốn thử trên chúng thì clone vào thư mục tạm.
- **Thư mục `plugins/` chỉ viết tiếng Anh, không nêu tên sản phẩm hay kho của chủ kho.** Tên kho
  thật chỉ nằm ở `mk/plugin.mk`. Từ dùng với người lấy từ `references/vocabulary.json`; bài kiểm
  `tests/plugin-vocabulary.test.ts` bắt từ bị cấm (ví dụ «catalogue», «seed»).
- **Không sửa năm tệp của Repo Standards**: khối lint của sàn, `tools/design_guards.mjs`,
  `tests/e2e/floor.spec.ts`, `mk/design.mk`, `.claude/rules/ui.md`.
- **Thay đổi mô hình dữ liệu (`ontology/`) cần người duyệt**, và làm qua skill `/ontology-add`.
- **Cài gói mới phải hỏi trước.** Lần trước chủ kho duyệt đúng một gói (`sonner`).
- `make check` phải xanh trước khi nói xong việc; sau mỗi việc thêm một dòng vào `wiki/log.md`, và
  lựa chọn kỹ thuật đáng kể thì thêm bản ghi quyết định.

## Điều còn mở

Cần chủ kho quyết:

- Thao tác làm ngay mà thất bại thì báo thế nào (xem «Việc đang chờ»).
- Có ghim màu thương hiệu của kho được nhận hay không. Hiện đổi sang màu khác vẫn đạt tương phản
  thì chỉ cần ghi lại tệp token là qua.
- Hai hình dạng sổ linh kiện đang cùng tồn tại: của plugin (mỗi linh kiện một mục, có biến thể) và
  của kho đối chứng (mỗi tệp một mục, có cấp nguyên tử và phần con). Chưa ai phân xử.
- Ở kho đối chứng, bốn dòng sổ (canh cột, bề rộng cột, mật độ bảng, định dạng số và ngày) đã có
  bài kiểm mà dòng chưa trỏ tới. `adopt --hold` gắn được; làm hay không là việc của chủ kho ở kho
  đó.

Cần Repo Standards:

- Ba bài kiểm trình duyệt của sàn (một vùng chính, không cuộn ngang, accessibility) không mang thẻ
  `decision:<id>`, nên sổ chưa trỏ tới được.
- Trang luật giao diện của sàn ghi «đừng ép bề rộng cột», trái với luật bề rộng tối thiểu đã duyệt.
- Một hành vi mới vào mô hình dữ liệu ra sao; kiểu dữ liệu của màn có phải lấy từ mã sinh ra không.

Giới hạn đã biết của plugin (chi tiết ở từng bản ghi):

- Các sửa đổi sau lần chạy thử thứ ba **chưa được tác tử độc lập thử lại**.
- Nhiều dòng «máy giữ» chỉ giữ phần đọc được từ mã nguồn; dòng sổ có ghi chú nói phần nào.
- Tương phản mới kiểm hai cặp của màu chính. Màu viết dạng pha trộn không đọc được.
- Toast nằm ngoài tầm kiểm trình duyệt của sàn. Số hiện ra không qua bộ định dạng thì không ai bắt.
- Chưa có token cho phông chữ, khoảng cách, đổ bóng, chuyển động. Chưa có băng báo sự cố.
- Kho này chưa khai gì với kit nghiệm thu, nên bậc M của kit chưa đổi.

## Cách chạy thử bằng tác tử độc lập

Đã làm ba lần, lần nào cũng tìm ra lỗi mà bài kiểm trên kho giả không thấy. Tốn token, nên hỏi chủ
kho trước.

- Bản sao đặt ở thư mục tạm của phiên. Kho trước khi có plugin: clone kho này rồi checkout
  `e56e77c`, nối `node_modules` bằng liên kết. Kho đối chứng: clone, rồi chỉ chép riêng tệp
  `node_modules/tailwindcss/theme.css`; **không** nối `node_modules` của kho đó.
- Ba vai: đi trọn cuộc dẫn dắt; adopt trên kho đã có hệ riêng; và **dựng màn** trên bản sao kho
  hiện tại, không cho đọc `plugins/` và `wiki/decisions/`. Vai thứ ba đo đúng mục đích của plugin.
- Câu trả lời của người để trong tệp niêm phong, **mỗi câu một tệp**, chỉ mở khi skill bảo hỏi.
- Không sửa plugin trong lúc tác tử còn đọc nó. Hai lượt kiểm trình duyệt dùng chung cổng 4173,
  nên không cho hai tác tử chạy `make check` cùng lúc.
- Tác tử báo về là báo cáo, chưa phải bằng chứng: tự kiểm lại trước khi sửa.

## Bẫy đã gặp

- `.claude/settings.json` của kho chỉ cho sẵn `make`, vài lệnh `git` đọc, và `python3 tools/`.
  Lệnh shell khác đi qua bộ phân loại; `rm -rf` bị từ chối. Sửa tệp bằng công cụ Edit/Write.
- `make check` dùng cổng 4173 cố định. Nếu đỏ chỉ vì cổng bận thì chờ rồi chạy lại.
- Sau `make format`, chạy lại `make design-apply` để bản công cụ trong kho (`tools/design-assembly/`)
  khớp bản mẫu trong plugin. Bốn tệp mẫu «của kho» ở `plugins/design-assembly/templates/owned/`
  phải giống hệt bản đang chạy ở kho này; có bài kiểm giữ điều đó, nên sửa bản ở `src/` hoặc
  `tests/` rồi chép sang.
- **Luôn áp vào kho này rồi chạy cổng trước khi commit**: hai lỗi trong ngày 12/11 chỉ lộ ra ở
  bước đó.
- Mật độ bảng đo bằng ResizeObserver, thứ không chạy khi khung trình duyệt không vẽ khung hình.
  Khi xem thử, chụp màn hình trước rồi mới đọc mật độ. Cấu hình xem thử ở `.claude/launch.json`
  (máy chủ `dev`, cổng 5179).
- Tệp JSON do lệnh ghi phải đúng kiểu bộ định dạng của kho để lại; dùng `renderJson` trong
  `templates/tools/design-assembly/json.mjs`, đừng dùng `JSON.stringify` thẳng cho tệp có mảng.
- Kho đối chứng đổi trong lúc mình làm. Đừng dựa vào con số đã đọc từ nó ở lượt trước.
