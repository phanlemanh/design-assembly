# Bàn giao phiên làm việc

Viết lại ngày 2026-11-14, lúc chủ kho đổi tài khoản lần hai. Trang này đủ để một phiên Claude Code
mới tiếp tục mà không cần bản ghi của phiên cũ. Phiên mới không thấy cuộc trò chuyện cũ, không có
thư mục tạm của phiên cũ, và **không thừa hưởng quyền nào chủ kho đã cho bằng lời**.

## Câu để dán vào phiên mới

> Đọc `docs/HANDOFF.md` rồi tiếp tục từ mục «Việc kế». Trả lời bằng tiếng Việt.

## Đọc theo thứ tự này

1. Trang này.
2. `AGENTS.md` và `CLAUDE.md` ở gốc kho: lệnh, luật, ngôn ngữ.
3. `wiki/decisions/0032-review-after-stage-two-and-stage-three-recut.md`: bản review và việc cắt lại
   chặng 3. Rồi `docs/trials/inventory-ladder.md`: thang bốn nấc và số đo của lát đầu.
4. `docs/review-queue.md`: 25 dòng đang chờ chủ kho xem. Đừng tự coi dòng nào là đã duyệt.
5. `wiki/specs/0002-meta-layer-for-many-repositories.md`: tầm nhìn, bảy tiêu chí, kế hoạch.
   Kiến trúc đầy đủ ở `docs/architecture/meta-layer.html` (chưa duyệt toàn bộ). Tài liệu đó gọi kho
   mã là «repo» và nơi chứa thứ dùng lại là «kho»; trang viết trước 2026-11-13 còn dùng «kho» cho
   repo.
6. `plugins/design-assembly/references/contract.md`: hình dạng của từng sổ. Và
   `references/limits.json`: mọi giới hạn đã biết. Đọc trước khi tin một dòng sổ nào là «máy giữ».
7. Bản ghi quyết định `wiki/decisions/0024` đến `0032` cho các lát gần nhất; `0005` đến `0023` khi
   cần biết vì sao một phần được dựng như vậy.

Ghi nhớ của máy tự nạp nếu phiên mới chạy trên cùng máy, cùng người dùng hệ điều hành:
`~/.claude/projects/-Users-manhphan-dev-design-assembly/memory/`. Trang này lặp lại mọi điều cần
từ đó.

## Kho này là gì

Một plugin Claude Code (`plugins/design-assembly/`) dẫn người dùng tới một design system chuẩn hoá
nằm ngay trong kho của họ, để Claude Code dựng màn mà không phải đoán. Ứng dụng React ở gốc kho là
bản cài đặt đối chứng: plugin sinh gì thì hiện ở đó và được `make check` chấm.

Bốn đường của plugin:

- **audit** (`scripts/inventory.mjs`): chỉ đọc. Đo kho theo danh mục quyết định chuẩn, nói bậc đã
  tới, và in dòng `next:` chỉ skill kế tiếp.
- **new** (`scripts/apply.mjs`): cuộc dẫn dắt. Sinh giá trị từ lựa chọn của người, cài lệnh kiểm.
- **adopt** (`scripts/adopt.mjs`): nhận cái kho đã có, không đổi gì của kho.
- **status** (`scripts/status.mjs`, từ 2026-11-15, quyết định 0041): chỉ đọc. Một màn hình: nấc đã
  tới, mỗi nhịp một dòng, việc chờ chủ kho kèm khuyến nghị, bản công cụ có lệch plugin không, lệnh
  nên chạy kế. Nó chỉ thấy việc chờ nằm trong sổ: 26 dòng ở `docs/review-queue.md` nó không đếm.

Nguyên tắc xuyên suốt: mỗi quyết định thiết kế là một dòng trong sổ `design/decisions.yaml`, trỏ
tới thứ chứng minh nó. Lệnh kiểm của plugin đọc tệp thật và mỗi lần chạy đều tự chứng minh nó đỏ
được trên một bản bị đổi.

## Trạng thái lúc bàn giao

- Nhánh `main`, cây làm việc sạch, mọi thứ đã commit. Kho có trên GitHub từ 2026-11-14, **riêng
  tư**: `phanlemanh/design-assembly`, remote `origin`. Chủ kho bảo tạo và đẩy một lần («Tạo github
  và push»). Cập nhật lần cuối 2026-11-14, sau quyết định 0034.
- `make check` xanh: lint, typecheck, 102 bài kiểm của kho, ontology, lệnh kiểm design-assembly
  (37 quyết định, 43 lệnh kiểm), bộ rào của sàn, 76 lượt kiểm trình duyệt, 276 bài kiểm của plugin (đường dẫn tới Inventory và kit phải tính được từ thư mục đang chạy, không thì vài bài bị bỏ qua).
- Kho này đáp 39/39 quyết định lõi: 26 máy giữ, 7 tự khai, 6 đã ghi. 11 sổ đúng hình dạng hợp
  đồng.
- **Kế hoạch chính thức, chủ kho duyệt ngày 2026-11-15 (0040):** tám giai đoạn ở `docs/plan/plan.json`.
  Chạy `make plan` để biết giai đoạn đang mở và từng mục; đừng tin câu nào trong trang này về tiến độ
  hơn lệnh đó. Lý do và điều kiện «xong khi» ở mục Plan của
  `wiki/specs/0002-meta-layer-for-many-repositories.md`; bộ mười ba lệnh ở
  `wiki/specs/0004-the-command-set.md` (đã duyệt). Mỗi nhánh kết một commit bằng dòng `Plan: <mã mục>`,
  hoặc `Plan: off-plan — <lý do>`; cổng kiểm giữ điều đó. Lộ trình năm chặng cũ còn ở tài liệu kiến
  trúc, chưa sửa.
- **Inventory chỉ bị đụng trên một nhánh riêng, đã đẩy và mở PR, chưa gộp:**
  [phanlemanh/onehub-inventory#58](https://github.com/phanlemanh/onehub-inventory/pull/58). Chủ kho cho phép ngày 2026-11-14 làm
  bước 1, 2, lát hai và bước 3 trên nhánh riêng. Tất cả đã commit ở nhánh `chore/adopt-design-assembly`, trong thư
  mục làm việc `~/dev/onehub-inventory/.claude/worktrees/adopt-design-assembly`. Bản chính của
  Inventory vẫn ở `main`. Phép đo vẫn chạy trên bản sao bỏ đi bằng `make design-ladder`.
- Số đo chính hôm nay: số chỗ tác tử phải đoán khi dựng một màn là 12, 12, 13, 11 (đứng yên); luật
  bị phạm có so với không có trang luật là 0 so với 3, 6, 3. Ở Inventory, trên bản sao: sổ đúng
  hình dạng 2/4 lên 5/5, câu lõi máy giữ 0 lên 11, quyết định máy giữ 0 lên 18, kit từ M1 lên M2.

## Đã dựng gì, theo thứ tự

| Phần                                                           | Bản ghi | Tệp chính                                                                                          |
| -------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| Bậc deliverable, ranh giới với hai kho bên cạnh, audit         | 0005    | `references/tiers.json`, `scripts/inventory.mjs`                                                   |
| Sổ chuẩn, bảy tầng, danh mục 66 quyết định (38 lõi)            | 0006    | `templates/tools/design-assembly/ledger.mjs`, `references/standard-decisions.json`                 |
| Adopt: nhận giá trị kho đã có                                  | 0007    | `scripts/adopt.mjs`, `references/known-proofs.json`                                                |
| Tệp design tokens sinh từ stylesheet                           | 0008    | `templates/tools/design-assembly/tokens.mjs`                                                       |
| Sổ linh kiện sinh từ mã nguồn                                  | 0009    | `templates/tools/design-assembly/components.mjs`                                                   |
| Chỉ dòng sổ mới là lời đáp; audit in bước kế                   | 0010    | `scripts/inventory.mjs`, `scripts/proofs.mjs`                                                      |
| Cỡ vùng bấm đo từ mã nguồn                                     | 0011    | `components.mjs`                                                                                   |
| Bảng dữ liệu: kiểu cột quyết định canh lề, bề rộng, mật độ     | 0012    | `templates/tools/design-assembly/columns.mjs`, `src/components/ui/typed-table.tsx`                 |
| Trạng thái, chữ, câu báo lỗi                                   | 0013    | `templates/tools/design-assembly/patterns.mjs`                                                     |
| Kênh thông báo, hoàn tác, bài kiểm gắn thẻ làm bằng chứng      | 0014    | `src/lib/notify.ts`, `scripts/proofs.mjs`                                                          |
| Trang luật cho tác tử; dòng sổ chưa có lệnh kiểm               | 0015    | `.claude/rules/design-assembly.md`, cờ `--hold` của adopt                                          |
| Skill bàn giao và cuốn sổ design system                        | 0020    | `scripts/book.mjs`, `scripts/stage.mjs`, `skills/handoff/`, `references/book.md`                   |
| Bảng mẫu thị giác cho tầng foundations                         | 0019    | `scripts/specimen.mjs`, `references/source-colors.json`                                            |
| Hướng nhập giữa các phần, sổ lỗi lọt                           | 0018    | `templates/tools/design-assembly/governance.mjs`, `design/parts.json`, `design/escapes.md`         |
| Sau một thao tác: tiêu điểm, đổi tại chỗ, trống, đi lại        | 0017    | `src/example/ReferenceScreen.tsx`, `src/lib/slow.ts`, `templates/owned/templates.spec.ts.template` |
| Sáu luật cho điều tác tử dựng màn phải đoán ở lần thử năm      | 0021    | `src/components/held-label.tsx`, `typed-table.tsx`, `design/parts.json`, `ontology/actions.yaml`   |
| Kiểu màn, cỡ màn được kiểm, thao tác thất bại                  | 0016    | `templates/tools/design-assembly/screens.mjs`, `design/patterns/`, `src/lib/notify.ts`             |
| Hợp đồng: mỗi sổ một hình dạng, cổng giữ hình dạng             | 0029    | `templates/tools/design-assembly/contract.mjs`, `references/contract.md`                           |
| Một sổ màn, mã chỉ giữ cách tới từng trạng thái                | 0030    | `design/screens.yaml`, `templates/tools/design-assembly/screen-ledger.mjs`                         |
| Năm bộ chuyển giữ tên thư viện                                 | 0031    | `templates/tools/design-assembly/adapters/`                                                        |
| Bộ đọc linh kiện: thuộc tính, khuôn theo thư mục, mọi thư viện | 0034    | `templates/tools/design-assembly/components.mjs`, `adapters/shadcn.mjs`                            |
| Chạy lại lint của repo trên đoạn mã phạm quyết định            | 0033    | `templates/tools/design-assembly/probes.mjs`, `lint.mjs`, `adapters/eslint.mjs`                    |
| Sổ màn nói màn hiện gì, nút cho ai; cổng nối với mô hình       | 0037    | `templates/tools/design-assembly/screen-actions.mjs`, `make design-screen-actions-reference`       |

Lệnh hay dùng ở kho này: `make design-status`, `make design-audit`, `make design-plan`, `make design-apply`,
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

**Đang chờ chủ kho trả lời:** 25 dòng A, B, C ở `docs/review-queue.md`; C7 là chữ của bốn tiêu chí nêu
tên Inventory. Lệnh `decide` (giai đoạn 0) sẽ gom chúng thành một tờ.

Chủ kho đã đáp ba câu của Inventory ngày 2026-11-14: ứng dụng, mức AA, giữ màu thương hiệu
`#0246ff`. Quyền đã cho ngày đó, bằng lời, trong một phiên: bước 1 và 2 trên nhánh riêng của
Inventory, không đẩy; rồi chạy lại «nhận» ở đó với plugin của lát hai; rồi bước 3. Tất cả đã xong. Phiên mới **hỏi lại** trước khi đụng vào Inventory, vì quyền
bằng lời không theo sang phiên khác. Chủ kho bảo đẩy nhánh và mở PR («Đẩy và mở PR»); việc gộp là của
chủ kho, người giữ mã ký theo luật tự chủ của Inventory.

**Kế tiếp:** chạy `make plan`. Giai đoạn đang mở và mục kế tiếp nằm ở đó, không nằm ở trang này.

**Thứ tự cũ của chặng 3, giữ làm lịch sử** (0032 và `docs/trials/inventory-ladder.md`):

1. Bước 1 và 2 đã xong trên nhánh riêng của Inventory. Gộp nhánh đó là việc của chủ kho: nó đụng
   vùng Inventory xếp vào loại phải có người giữ mã ký.
2. Lát hai đã xong (0033, mục 5 thay bởi 0035) cho phần lint, cả trên nhánh riêng của Inventory (chủ kho cho phép
   2026-11-14). Còn lại: bài kiểm và công cụ của repo chưa được chạy lại; hướng nhập chưa có đoạn
   mã phạm.
3. Lát ba đã xong (0034), và bước 3 của lát đầu đã làm trên nhánh riêng của Inventory (chủ kho cho
   phép 2026-11-14): plugin ghi sổ linh kiện ở đó, công cụ cũ bị bỏ, hai sổ khai với kit. Nhánh có
   đã đẩy, hai lần gộp main để gỡ xung đột. Hai dòng khai với kit tách sang PR nháp
   [phanlemanh/onehub-inventory#59](https://github.com/phanlemanh/onehub-inventory/pull/59), đặt nền
   trên nhánh của #58; bậc M2 chờ #59. **Cổng trước khi gộp của kit vẫn đỏ ở #58**: mọi PR đổi đường
   dẫn T3 phải kèm hồ sơ `_acceptance/<slug>/` có chữ ký người. Việc tách không gỡ được cổng; máy đã
   đoán sai lý do, và đã ghi lại. Chủ kho cho dựng hồ sơ: `_acceptance/adopt-design-assembly/` trên
   nhánh của #58, chạy theo vòng `/feature-loop:feature-loop adopt-design-assembly`. Cổng Phạm vi và
   Cổng 1.5 đã duyệt (2026-11-14); S3 xong; lượt chấm 1 trả REJECT vì lệnh kiểm lint tính «giữ» khi
   luật khác chặn thay luật dòng sổ nêu tên. Chủ kho chọn siết (2026-11-15, «Siết, sửa AC-2»): plugin
   sửa ([0035](../wiki/decisions/0035-the-named-rule-holds-the-row.md)), «khoảng cách» của Inventory
   về lại «tự khai», AC-2 thành 17 quyết định và tám luật, thêm phép đo tắt riêng luật nêu tên.
   Chủ kho duyệt lại Cổng Phạm vi và Cổng 1.5; lượt chấm 2 đạt mọi phép kiểm máy; **chủ kho đã ký Cổng
   Bằng chứng ngày 2026-11-15**, lưới trước khi gộp của kit sạch. 13 mục ngoài hợp đồng ghi vào hạn chế
   đã biết, 2 chấp nhận không sửa, 1 mở hợp đồng mới (sổ linh kiện ghi trùng linh kiện xuất lại qua tệp
   gom, sửa ở plugin). Main gộp lần ba vào nhánh (quyết định của nhánh đổi số thành 0034 vì main đã có
   0032), hồ sơ ghim lại trên cây đã gộp, CI xanh; **chủ kho cho gộp, #58 đã gộp ngày 2026-11-15**
   (commit gộp `2715cf4`). Còn: #59 phải đặt lại nền lên main; bản sửa ghi trùng nằm ở nhánh
   `claude/quizzical-moser-3a6146` của kho này, chưa gộp, chưa đẩy.
   **Tên tệp ở Inventory là tiếng Anh** theo AGENTS.md của nó, dù phần lớn tên có sẵn ở đó là tiếng
   Việt; chủ kho chỉ ra ngày 2026-11-14 và mọi tên của vòng này đã đổi sang tiếng Anh.
4. Sau cùng: bộ chuyển Next.js cho bảng mẫu và cuốn sổ; sổ nguồn ngoài và sổ nhập kho.

**Đừng làm, trừ khi chủ kho bảo:** thêm luật bằng lời ở kho này; chạy thêm lượt thử bằng tác tử
(tốn token); sửa 55 giới hạn «sẽ sửa» ngoài những dòng Inventory đụng tới.

Các lát đã xong, mới nhất trước:

- **Sổ màn nối mô hình nghiệp vụ** (2026-11-15, đề bài 0003, quyết định 0037), phần của repo này
  trong bảng vai × màn × nút theo ranh giới ba kho. Sổ màn khai màn hiện gì, mở bằng thao tác nào,
  có nút nào; cổng đỏ khi thao tác không màn nào chào ra cho vai được làm, màn hiện thứ vai không được
  xem, hay nút không ai bấm được. Ở nhánh `claude/so-man-noi-mo-hinh-95de70`, chưa đẩy. Hai màn mẫu
  đã khai; mô hình thêm hành động xem `listItems`, chủ kho duyệt riêng. Inventory, chỉ đọc: 7 đỏ nguyên trạng, 17 với lớp phủ
  «màn hiện gì» của máy.

- **Chặng 3, lát ba** (2026-11-14, 0034). Sổ linh kiện ghi thuộc tính, khuôn theo thư mục, mọi thư
  viện; bộ đọc bỏ qua chú thích. Trên bản sao Inventory: thuộc tính giống 268/270.
- **Chặng 3, lát hai** (2026-11-14, 0033). Plugin chạy lại lint của chính repo trên đoạn mã phạm
  từng quyết định, trong cổng; bộ chuyển thứ sáu giữ tên công cụ lint. Inventory, bản sao: câu lõi
  máy giữ 2 lên 11.
- **Chặng 3, lát đầu, bước 1 và 2 trên nhánh riêng của Inventory** (2026-11-14). Chủ kho đáp ba
  câu: ứng dụng, AA, giữ màu thương hiệu đang dùng.
- **Review sau chặng 2 và lát đầu của chặng 3 trên bản sao** (2026-11-14, 0032). Plugin đọc được
  màu pha trong oklch, audit đếm sổ đúng hình dạng, «nhận» giữ hình dạng sổ.
- **Chặng 2 «Hợp đồng»** (2026-11-14, 0029 đến 0031). Hình dạng 11 sổ viết một chỗ và cổng giữ
  chúng; sổ mang số phiên bản; sổ token ghi màu bằng hex vì cổng của kit từng từ chối tệp; sổ linh
  kiện thêm cấp, nguồn, các phần; một sổ màn `design/screens.yaml` (thêm màn thì ghi ở cả sổ lẫn
  mã); năm bộ chuyển giữ tên thư viện.
- **Dọn nền 2** (2026-11-13, 0028) và bốn lượt nhánh đối chứng (`docs/trials/control-arm.md`).
- **Chín lần chạy thử** bằng tác tử độc lập: số ở `docs/trials/results.tsv`, lời ở cuối spec 0001.

Việc cũ còn treo, chưa việc nào được duyệt: đo token theo giao thức của Repo Standards (tốn tiền
API); lệnh kiểm tương phản cho nút khi rê chuột; adopt nhận trang kiểu màn ở kho đã có.

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

- **Đẩy lên GitHub chỉ khi chủ kho bảo.** Kho này đã có remote riêng tư từ 2026-11-14 vì chủ kho
  bảo tạo và đẩy lần đó. Lần đẩy sau vẫn cần chủ kho bảo. Không đổi kho sang công khai, không tạo
  kho nào khác; ba kho bên cạnh không bao giờ được đẩy từ đây.
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

Cần chủ kho quyết: mọi câu đã gom vào `docs/review-queue.md`, 25 dòng, mỗi dòng trả lời bằng một
chạm. Hình dạng sổ linh kiện đã được phân xử (0023 câu 1, dựng ở 0029). Riêng ở kho đối chứng: bảy
dòng sổ đã có bài kiểm mà dòng chưa trỏ tới; `adopt --hold` gắn được, làm hay không là việc của
chủ kho ở kho đó.

Cần Repo Standards:

- Luật «tên lớp viết nguyên» của sàn chỉ đọc tên lớp đặt trên linh kiện: tên lớp ghép trên thẻ
  thường lọt qua (0033). Dòng sổ đó ở kho này vẫn là «tự khai».
- Ba bài kiểm trình duyệt của sàn (một vùng chính, không cuộn ngang, accessibility) không mang thẻ
  `decision:<id>`. Sổ giờ trỏ tới bài kiểm của plugin thay cho chúng, nên ở kho này accessibility
  được kiểm hai lần. Khi sàn gắn thẻ thì bỏ được một bên.
- Trang luật giao diện của sàn ghi «đừng ép bề rộng cột», trái với luật bề rộng tối thiểu đã duyệt.
- Một hành vi mới vào mô hình dữ liệu ra sao; kiểu dữ liệu của màn có phải lấy từ mã sinh ra không.

Giới hạn đã biết của plugin (chi tiết ở từng bản ghi):

- Các sửa đổi sau lần chạy thử thứ năm **chưa được tác tử độc lập thử lại**.
- Nhiều dòng «máy giữ» chỉ giữ phần đọc được từ mã nguồn; dòng sổ có ghi chú nói phần nào.
- Tương phản mới kiểm hai cặp của màu chính. Màu viết dạng pha trộn không đọc được.
- Luật thao tác thất bại không đọc được từ mã nguồn: giữ bằng bài kiểm của kho, mức «tự khai».
- Tương phản của nút khi rê chuột không được lệnh kiểm đo. Số hiện ra không qua bộ định dạng thì
  không ai bắt.
- Chưa có token cho phông chữ, khoảng cách, đổ bóng, chuyển động. Chưa có băng báo sự cố.
- Kho này chưa khai gì với kit nghiệm thu, nên bậc M của kit chưa đổi.

## Cách chạy thử bằng tác tử độc lập

Từ lần bảy, bộ đề và chuỗi số nằm ở `docs/trials/`; trang này giữ các bẫy đã gặp. Đọc
`docs/trials/README.md` trước khi dựng bản sao.

Đã làm năm lần, lần nào cũng tìm ra lỗi mà bài kiểm trên kho giả không thấy. Tốn token, nên hỏi chủ
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
- Lần năm: câu trả lời niêm phong viết bằng lời của người («xanh lục», «bản đậm hơn»), không
  bằng chữ cái, để thử việc đổi lời thành giá trị trên bảng mẫu. Cho tác tử tự mở từng ảnh.
- Ở kho này `src/lib/notify.ts` phải giống hệt bản mẫu trong plugin; tác tử dựng màn không biết
  điều đó và bị bài kiểm của plugin đánh đỏ. Dặn trước trong đề bài.
- Tác tử báo về là báo cáo, chưa phải bằng chứng: tự kiểm lại trước khi sửa.

## Bẫy đã gặp

- `.claude/settings.json` của kho chỉ cho sẵn `make`, vài lệnh `git` đọc, và `python3 tools/`.
  Lệnh shell khác đi qua bộ phân loại; `rm -rf` bị từ chối. Sửa tệp bằng công cụ Edit/Write.
- `make check` xem thử ở một cổng lấy từ thư mục của bản làm việc (từ 4173 trở lên), nên hai bản làm
  việc chạy cổng kiểm cùng lúc không tranh nhau. `UI_FLOOR_PORT` đặt cổng bằng tay.
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
- **Thư mục tạm của phiên mất theo phiên.** Lần mất gần nhất làm mất bản sao của lần thử tám. Thứ
  gì cần đo lại thì phải là một lệnh trong kho, như `make design-ladder`; đừng để kết quả chỉ nằm
  ở thư mục tạm.
- Lệnh `rm -rf` bị từ chối trong phiên. Tạo thư mục mới thay vì xoá, hoặc xoá bằng kịch bản node.
- Sau `make format`, tệp trong kho có thể khác bản mẫu của plugin: chạy `make design-apply` rồi mới
  `make check`.
- Đổi hình dạng một sổ hay một lệnh kiểm thì nhiều bài kiểm cũ của plugin đỏ theo, vì chúng khẳng
  định hành vi cũ. Đọc từng bài: phân biệt kỳ vọng cũ với lỗi thật trước khi sửa bài kiểm.
- Kit nghiệm thu có hai bộ đọc token mâu thuẫn nhau: cổng đòi mã hex trong giá trị, bộ đo độ phủ
  không nhận giá trị dạng đối tượng. Chỉ mã hex viết thẳng qua được cả hai.
- Trình duyệt cắt từng kênh màu khi màu ra ngoài dải hiển thị được; đừng giảm độ rực khi tính mã
  hex, nếu không số sẽ lệch với thứ người dùng thấy.
