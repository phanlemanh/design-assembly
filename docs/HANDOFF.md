# Bàn giao phiên làm việc

Viết ngày 2026-11-12, lúc chủ kho đổi tài khoản giữa chừng. Trang này đủ để một phiên Claude Code
mới tiếp tục mà không cần bản ghi của phiên cũ. Khi phiên mới đã bắt nhịp và có bàn giao mới hơn,
sửa trang này hoặc xoá nó.

## Câu để dán vào phiên mới

> Đọc `docs/HANDOFF.md` rồi tiếp tục từ mục «Việc kế». Trả lời bằng tiếng Việt.

## Đọc theo thứ tự này

1. Trang này.
2. `AGENTS.md` và `CLAUDE.md` ở gốc kho: lệnh, luật, ngôn ngữ.
3. `wiki/index.md`, rồi `wiki/specs/0001-design-system-for-claude-code.md` (đề bài và kết quả từng
   lát, ba lần chạy thử).
4. Bản ghi quyết định `wiki/decisions/0005` đến `0020`: mỗi phần đã dựng có một bản, kèm giới hạn.
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

- Nhánh `main`, cây làm việc sạch. **Chưa có remote, chưa đẩy đi đâu**: kho chỉ nằm trên máy
  này. Mọi thứ đều đã commit. Cập nhật lần cuối 2026-11-12, sau quyết định 0020.
- `make check` xanh: lint, typecheck, 68 bài kiểm của kho, ontology, lệnh kiểm design-assembly
  (22 quyết định, 27 lệnh kiểm), bộ rào của sàn, 44 lượt kiểm trình duyệt, 195 bài kiểm của plugin.
- Kho này đáp **37/38 quyết định lõi**: 14 máy giữ, 17 tự khai, 6 đã ghi. Sổ có 47 dòng. Chủ kho đã
  xác nhận màu gốc `#0246ff` ngày 2026-11-12; năm câu «đã ghi» còn lại vẫn là máy đề xuất, audit
  nêu tên chúng.

| Bậc                           | Trạng thái       | Còn thiếu                                                  |
| ----------------------------- | ---------------- | ---------------------------------------------------------- |
| audit                         | đạt              |                                                            |
| foundations                   | 9/9, «tự khai»   | lên «đạt» khi các luật lint của sàn được chạy lại          |
| core components               | 10/10, «tự khai» | như trên                                                   |
| trạng thái của màn và lời văn | 7/8              | mở hồ sơ cạnh danh sách: chưa có màn nào cần               |
| templates                     | 8/8              | ba câu «đã ghi» chờ chủ kho xác nhận; ba câu mới «tự khai» |
| governance                    | 3/3              | sổ lỗi lọt không ai buộc được người ghi; xem 0018          |

## Đã dựng gì, theo thứ tự

| Phần                                                       | Bản ghi | Tệp chính                                                                                          |
| ---------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| Bậc deliverable, ranh giới với hai kho bên cạnh, audit     | 0005    | `references/tiers.json`, `scripts/inventory.mjs`                                                   |
| Sổ chuẩn, bảy tầng, danh mục 66 quyết định (38 lõi)        | 0006    | `templates/tools/design-assembly/ledger.mjs`, `references/standard-decisions.json`                 |
| Adopt: nhận giá trị kho đã có                              | 0007    | `scripts/adopt.mjs`, `references/known-proofs.json`                                                |
| Tệp design tokens sinh từ stylesheet                       | 0008    | `templates/tools/design-assembly/tokens.mjs`                                                       |
| Sổ linh kiện sinh từ mã nguồn                              | 0009    | `templates/tools/design-assembly/components.mjs`                                                   |
| Chỉ dòng sổ mới là lời đáp; audit in bước kế               | 0010    | `scripts/inventory.mjs`, `scripts/proofs.mjs`                                                      |
| Cỡ vùng bấm đo từ mã nguồn                                 | 0011    | `components.mjs`                                                                                   |
| Bảng dữ liệu: kiểu cột quyết định canh lề, bề rộng, mật độ | 0012    | `templates/tools/design-assembly/columns.mjs`, `src/components/ui/typed-table.tsx`                 |
| Trạng thái, chữ, câu báo lỗi                               | 0013    | `templates/tools/design-assembly/patterns.mjs`                                                     |
| Kênh thông báo, hoàn tác, bài kiểm gắn thẻ làm bằng chứng  | 0014    | `src/lib/notify.ts`, `scripts/proofs.mjs`                                                          |
| Trang luật cho tác tử; dòng sổ chưa có lệnh kiểm           | 0015    | `.claude/rules/design-assembly.md`, cờ `--hold` của adopt                                          |
| Skill bàn giao và cuốn sổ design system                    | 0020    | `scripts/book.mjs`, `scripts/stage.mjs`, `skills/handoff/`, `references/book.md`                   |
| Bảng mẫu thị giác cho tầng foundations                     | 0019    | `scripts/specimen.mjs`, `references/source-colors.json`                                            |
| Hướng nhập giữa các phần, sổ lỗi lọt                       | 0018    | `templates/tools/design-assembly/governance.mjs`, `design/parts.json`, `design/escapes.md`         |
| Sau một thao tác: tiêu điểm, đổi tại chỗ, trống, đi lại    | 0017    | `src/example/ReferenceScreen.tsx`, `src/lib/slow.ts`, `templates/owned/templates.spec.ts.template` |
| Kiểu màn, cỡ màn được kiểm, thao tác thất bại              | 0016    | `templates/tools/design-assembly/screens.mjs`, `design/patterns/`, `src/lib/notify.ts`             |

Lệnh hay dùng ở kho này: `make design-audit`, `make design-plan`, `make design-apply`,
`make design-adopt`, `make design-adopt-reference` (xem trước trên kho đối chứng, không bao giờ
ghi), `make design-tokens`, `make design-components`, `make design-columns`, `make plugin-test`.

## Hướng chủ kho nêu ngày 2026-11-12

«Tôi thích cách dẫn dắt như ở repo-standards. Ở repo này thị giác quan trọng hơn từ ngữ. Một
chuyên gia cố vấn hàng đầu cần dẫn đi qua các hạng mục bằng thị giác nhưng phải thoả mãn sự tất
định của Claude.» Máy đóng khung thành «chọn bằng mắt, giữ bằng máy» với bốn điều kiện (quyết
định 0019). Lát đầu đã dựng: `make design-specimen` vẽ bảng mẫu cho màu gốc, thang chữ, bo góc.
Nửa «sau khi quyết» cũng đã có lát đầu: skill `handoff` và `make design-book` vẽ cuốn sổ bàn giao
(quyết định 0020), mượn ý từ skill Diagram Design. Lời tiếng Việt của cuốn sổ ở
`design/book-words.json`.
Cuốn sổ đã có tám tờ: bìa, màu, chữ và hình khối, linh kiện, kiểu màn, đường đi, trạng thái, và
«không cho thấy gì». Chủ kho đã xem lát đầu và nói đạt; ba tờ sau chưa được chủ kho nhận xét.
Các lát sau, mỗi lát duyệt riêng: xuất slide theo khổ; điểm dừng
thị giác cho năm tầng còn lại và phòng trưng bày
trạng thái; độ sâu «mang sẵn thiết kế tới»; phản biện độc lập bằng ảnh; tờ hướng dẫn để lại.
Khuôn mẫu về nhịp dẫn dắt: `~/dev/repo-standards/plugins/repo-setup/skills/new/`.

## Việc kế

Câu hỏi về bậc templates và luật thao tác thất bại đã được chủ kho duyệt và dựng xong ngày
2026-11-12 (quyết định 0016). Không còn câu hỏi nào đang treo. Những việc có thể làm tiếp, chưa
việc nào được duyệt:

- **Chủ kho xem cuốn sổ bàn giao một lượt** (`make design-book`, mở
  `coverage/design-book/book.html`): lát 0020 chỉ nghiệm thu được bằng lượt đó.
- **Chủ kho đã đi hết bảng mẫu của foundations** ngày 2026-11-12 và giữ cả ba giá trị đang dùng
  (màu gốc `#0246ff`, thang chữ chuẩn, bo góc của sàn). Tầng foundations giờ ghi là người quyết.
- **Chủ kho đọc trang kiểu màn** `design/patterns/danh-sach.md` rồi xác nhận hoặc sửa. Ba dòng sổ
  (việc chính, thứ tự thông tin, lời văn) đang ghi «chưa ai xác nhận».
- **Lần chạy thử bốn đã xong** (2026-11-12, kết quả ở cuối spec 0001). Điều sai rõ đã sửa, và
  bốn chỗ nó để ngỏ đã thành luật (quyết định 0017). Cả hai đợt sửa chưa được thử lại.
- **Khung điều hướng** chưa dựng: luật có rồi, chờ màn thứ hai.
- **Đo token** theo giao thức của Repo Standards: đề bài hẹn làm khi cuộc dẫn dắt tới bậc
  templates. Tốn tiền API, cần chủ kho cho phép riêng.
- **Gặp lỗi lọt thì ghi `design/escapes.md` trước khi sửa.** Phiên nào cũng phải làm; không máy
  nào nhắc.
- **Lệnh kiểm tương phản cho nút khi rê chuột**: lần này bài kiểm trình duyệt tình cờ bắt được
  (xem 0016, giới hạn).
- **Adopt nhận trang kiểu màn** ở kho đã có.

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

- Trang kiểu màn «danh sách» do máy đề xuất: xác nhận hay sửa.
- Màn mẫu của một kiểu là màn thật trong sổ màn (cách plugin hiểu) hay trang mẫu của khuôn (cách
  kho đối chứng đang ghi ở cùng khoá).
- Có ghim màu thương hiệu của kho được nhận hay không. Hiện đổi sang màu khác vẫn đạt tương phản
  thì chỉ cần ghi lại tệp token là qua.
- Hai hình dạng sổ linh kiện đang cùng tồn tại: của plugin (mỗi linh kiện một mục, có biến thể) và
  của kho đối chứng (mỗi tệp một mục, có cấp nguyên tử và phần con). Chưa ai phân xử.
- Ở kho đối chứng, bốn dòng sổ (canh cột, bề rộng cột, mật độ bảng, định dạng số và ngày) đã có
  bài kiểm mà dòng chưa trỏ tới. `adopt --hold` gắn được; làm hay không là việc của chủ kho ở kho
  đó.

Cần Repo Standards:

- Ba bài kiểm trình duyệt của sàn (một vùng chính, không cuộn ngang, accessibility) không mang thẻ
  `decision:<id>`. Sổ giờ trỏ tới bài kiểm của plugin thay cho chúng, nên ở kho này accessibility
  được kiểm hai lần. Khi sàn gắn thẻ thì bỏ được một bên.
- Trang luật giao diện của sàn ghi «đừng ép bề rộng cột», trái với luật bề rộng tối thiểu đã duyệt.
- Một hành vi mới vào mô hình dữ liệu ra sao; kiểu dữ liệu của màn có phải lấy từ mã sinh ra không.

Giới hạn đã biết của plugin (chi tiết ở từng bản ghi):

- Các sửa đổi sau lần chạy thử thứ bốn **chưa được tác tử độc lập thử lại**.
- Nhiều dòng «máy giữ» chỉ giữ phần đọc được từ mã nguồn; dòng sổ có ghi chú nói phần nào.
- Tương phản mới kiểm hai cặp của màu chính. Màu viết dạng pha trộn không đọc được.
- Luật thao tác thất bại không đọc được từ mã nguồn: giữ bằng bài kiểm của kho, mức «tự khai».
- Tương phản của nút khi rê chuột không được lệnh kiểm đo. Số hiện ra không qua bộ định dạng thì
  không ai bắt.
- Chưa có token cho phông chữ, khoảng cách, đổ bóng, chuyển động. Chưa có băng báo sự cố.
- Kho này chưa khai gì với kit nghiệm thu, nên bậc M của kit chưa đổi.

## Cách chạy thử bằng tác tử độc lập

Đã làm bốn lần, lần nào cũng tìm ra lỗi mà bài kiểm trên kho giả không thấy. Tốn token, nên hỏi chủ
kho trước.

- Bản sao đặt ở thư mục tạm của phiên. Kho trước khi có plugin: clone kho này rồi checkout
  `e56e77c`, nối `node_modules` bằng liên kết. Kho đối chứng: clone, rồi chỉ chép riêng tệp
  `node_modules/tailwindcss/theme.css`; **không** nối `node_modules` của kho đó.
- Ba vai: đi trọn cuộc dẫn dắt; adopt trên kho đã có hệ riêng; và **dựng màn** trên bản sao kho
  hiện tại, không cho đọc `plugins/` và `wiki/decisions/`. Vai thứ ba đo đúng mục đích của plugin.
- Câu trả lời của người để trong tệp niêm phong, **mỗi câu một tệp**, chỉ mở khi skill bảo hỏi.
- Không sửa plugin trong lúc tác tử còn đọc nó. Hai lượt kiểm trình duyệt dùng chung cổng 4173:
  lần bốn cho mỗi tác tử một câu lệnh giữ khoá bằng thư mục (`mkdir` trước, `rmdir` sau) quanh
  `make check`, và ba tác tử chạy song song không vướng nhau.
- Bản sao dùng cho vai dựng màn thì xoá trang bàn giao này đi, và cấm đọc cả `wiki/specs/`.
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
- Thư viện toast gỡ một toast ở khung hình kế tiếp. Bài kiểm dùng đồng hồ giả phải giả cả khung
  hình, và phải tua hai nhịp: một nhịp để toast được đánh dấu rời đi, một nhịp để nó biến mất.
- Một khối rỗng không có chiều cao thì không làm trang cuộn ngang. Muốn thử cho bài kiểm cuộn
  ngang đỏ thì khối phải có chiều cao.
- Bộ đọc trang tài liệu không đọc được trang dựng bằng script (Material Design). Mở bằng trình
  duyệt trong ứng dụng thì đọc được.
