---
type: spec
title: Cắm đồ bên cạnh — một bước thiết lập chọn phích cho từng ổ, và hai cầu nối mang thứ chúng làm vào sổ và ra ngoài
status: needs-approval
tier: 1
links:
  - wiki/specs/0007-widen-the-entry-the-system-and-the-intent.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/specs/0009-review-a-drawn-screen.md
  - wiki/specs/0013-the-two-neighbours-call-and-read.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0062-intake-takes-a-block-in-only-on-the-owners-answer.md
  - wiki/decisions/0069-the-capability-table-and-its-checks.md
  - wiki/decisions/0073-the-review-socket-plugs-an-outside-eye.md
sources:
  - docs/plan/plan.json
  - docs/trials/outside-tools-hands-on.md
  - docs/trials/review-eye-on-a-planted-copy.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/plugs/
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/scripts/review-harvest.mjs
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/font-source.mjs
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/skills/review/SKILL.md
  - "status.mjs --target . --json trên kho này ngày 2026-11-23, khoá sockets"
  - "trang công khai đọc ngày 2026-11-23 bởi một phiên phụ, không gửi gì về kho này: claude.com/blog/claude-design-stays-on-brand-for-daily-work, support.claude.com/en/articles/17440474, github.com/google-labs-code/design.md docs/spec.md, github.com/google-labs-code/stitch-skills, github.com/nexu-io/open-design, developers.figma.com/docs/figma-mcp-server, reui.io/docs/mcp, docs.mobbin.com/mcp"
  - "chủ repo, 2026-11-23: «Với kit design assembly hiện tại thì đã nối các năng lực khác vào chưa ví dụ như claude design, stitch-skills,... mở phiên hỏi đáp về việc này»"
  - "chủ repo, 2026-11-23: «Đưa vào lộ trình thực hiện tiếp tục, và thiết lập luôn ux cho người dùng bước này cách họ thiết lập tốt nhất đảm bảo hiệu quả cao nhất cho kit.»"
---

# 0014 Cắm đồ bên cạnh — một bước thiết lập chọn phích cho từng ổ, và hai cầu nối

Máy viết ngày 2026-11-23 theo lời chủ repo, sau một phiên hỏi đáp chỉ đọc về việc plugin đã nối với công cụ thiết kế
nào. Đây là bản chờ duyệt: chưa gì được dựng. Nó là mục 10.0 của giai đoạn 10 mới trong kế hoạch.

## Intent

Đề bài [0008](0008-capabilities-sockets-and-plugs.md) dựng khung: mỗi việc người dùng cần xong là một **năng lực**,
mỗi năng lực có một **ổ cắm** do plugin giữ, và **phích** là bên làm, của plugin hoặc của người khác. Khung ấy có thật
trong mã (`references/capabilities.json`, chín tệp ở `references/plugs/`, năm phép kiểm ở `scripts/capabilities.mjs`),
nhưng hôm nay nó chỉ **liệt kê**. Người dùng không có lúc nào được hỏi «ổ này anh muốn ai làm», và hầu hết phích ngoài
không được lệnh nào gọi.

Giai đoạn này biến khung thành một **bước thiết lập** người dùng đi qua một lần cho mỗi repo, và hai **cầu nối** để thứ
công cụ ngoài làm ra đi vào sổ, và sổ đi ra công cụ ngoài, mà không phá luật «sổ thắng».

### Hôm nay đứng ở đâu

Lấy từ phiên hỏi đáp ngày 2026-11-23. Bốn mức: (a) lệnh làm thật, có bài kiểm hay lượt thử chứng; (b) có chỗ cắm, chưa
gì dùng; (c) chỉ có tên trong tài liệu; (d) không có.

| Đồ bên cạnh                    | Ổ nó khai                                    | Mức               | Chứng cứ                                                                                                                                                           |
| ------------------------------ | -------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| shadcn và registry của nó      | linh kiện (qua bộ chuyển)                    | (a)               | bộ chuyển `adapters/shadcn.mjs`; `tests/test-components.mjs`, `tests/test-library-package.mjs`                                                                     |
| ReUI                           | linh kiện                                    | (a) đọc, (b) nhập | `references/plugs/reui.json`; bậc 2 của `intake` nhận «nguồn ngoài có ghim», mới kiểm bằng một nguồn giả (`tests/test-intake.mjs`); kho này chưa ghim danh mục nào |
| Font từ gói hay tệp trong repo | tài sản thương hiệu (ghi qua ổ tham chiếu)   | (a)               | `scripts/font-source.mjs`, `design/sources/geist.json`, giai đoạn 9                                                                                                |
| design-critique                | soát thiết kế                                | (a)               | skill `review` trao ảnh cho mắt bảng ổ cắm nêu; [0073](../decisions/0073-the-review-socket-plugs-an-outside-eye.md), 5 trên 5 chỗ phạm                             |
| axe                            | soát thiết kế, báo cáo khả năng truy cập     | (a)               | `status` báo đang cắm ở kho này; cổng dùng                                                                                                                         |
| Claude Design                  | hướng đi, nền, tài sản thương hiệu, bàn giao | (b)               | `references/plugs/claude-design.json`; không lệnh nào gọi, không có cách nhận ra đã cắm; thử tay một lần ([trang đo](../../docs/trials/outside-tools-hands-on.md)) |
| Stitch và stitch-skills        | hướng đi, nền                                | (b)               | `references/plugs/stitch.json`; thử 4 trên 16 skill ở mức không khoá                                                                                               |
| frontend-design                | dựng màn                                     | (b)               | `references/plugs/frontend-design.json`; không gì gọi                                                                                                              |
| Mobbin                         | tham chiếu                                   | (b)               | `references/plugs/mobbin.json`; ổ tham chiếu trống (`capability-reference-has-no-plug`)                                                                            |
| ux-copy, accessibility-review  | nội dung; báo cáo khả năng truy cập          | (b)               | hai tệp phích; cả hai ổ trống                                                                                                                                      |
| ux-ui-craft                    | dựng màn                                     | (c)               | chỉ trong bảng của đề bài 0008                                                                                                                                     |
| Figma                          | —                                            | (c)               | nêu ở 0009 như điều ngoài phạm vi                                                                                                                                  |
| Open Design                    | —                                            | (d)               | không chữ nào trong kho                                                                                                                                            |
| Logo, bộ icon, ảnh             | tài sản thương hiệu                          | (d)               | dòng mở `capability-brand-assets-has-no-plug`                                                                                                                      |

### Ngoài kho, đọc trang công khai ngày 2026-11-23

Một phiên phụ đọc trang công khai, không gửi gì về kho này. Điều chưa xác nhận được ghi rõ là chưa.

- **Claude Design:** còn beta. Trang trợ giúp của Anthropic xác nhận trang riêng claude.ai/design **đóng ngày
  2026-12-14**; dự án thành artifact trong Claude, design system đi theo chủ và thành chỉ đọc ở trang cũ. Trong Claude
  Code có `/design` và `/design-sync`. Việc `/design-sync` và máy chủ MCP của nó thôi chạy sau ngày ấy chỉ một trang bên
  thứ ba nói, chưa có lời của Anthropic. Định dạng xuất chính thức của một design system chưa thấy trang nào của
  Anthropic nêu.
- **`DESIGN.md` nay có đặc tả viết ra** (bản «alpha», Apache-2.0) và một bộ kiểm (`npx @google/design.md`): khối YAML
  với `colors`, `typography`, `rounded`, `spacing`, `motion`, `components`, linh kiện trỏ token dạng `{colors.primary}`,
  rồi các mục theo thứ tự cố định. Đề bài 0007 loại `DESIGN.md` vì «chưa ai kiểm được đặc tả»; điều kiện ấy nay đã đổi.
- **stitch-skills:** ba plugin, mười sáu skill, commit mới nhất ngày 2026-11-20; README nói các skill cần máy chủ MCP
  của Stitch, cần khoá API. Stitch xuất và nhập `DESIGN.md`.
- **Open Design:** không gian thiết kế chạy tại chỗ, Apache-2.0, có máy chủ MCP tại chỗ, lái chính Claude Code; mang
  151 design system dựng quanh `DESIGN.md`, xuất HTML, React, bản trình chiếu.
- **Figma:** máy chủ MCP chính thức đọc biến, linh kiện, ảnh chụp; ghế xem hay gói khởi đầu chỉ có 20 lượt gọi một
  tháng, ghế trả phí 200 tới 600 lượt một ngày.
- **ReUI** và **Mobbin** đều có máy chủ MCP chính thức, đăng nhập bằng trình duyệt; ReUI có phần miễn phí (27 linh kiện),
  khối cao cấp cần giấy phép; Mobbin có cần gói trả phí không thì chưa xác nhận.

Nguồn: claude.com/blog/claude-design-stays-on-brand-for-daily-work; support.claude.com/en/articles/17440474;
github.com/google-labs-code/design.md (docs/spec.md); github.com/google-labs-code/stitch-skills;
github.com/nexu-io/open-design; developers.figma.com/docs/figma-mcp-server; reui.io/docs/mcp; docs.mobbin.com/mcp.

Ba điều rút ra:

1. **Không có lúc chọn.** Bảng ổ cắm của `status` nói ổ nào có phích nào, nhưng không bước nào hỏi chủ repo chọn, và
   không sổ nào ghi lựa chọn. Một phích ngoài «đang cắm» chỉ khi một tệp hay một gói của nó nằm trong repo; skill và
   công cụ cần tài khoản thì không bao giờ hiện là đã cắm.
2. **Chỉ một ổ gọi phích ngoài.** Skill `review` là chỗ duy nhất tìm trong phiên một skill bảng ổ cắm nêu, trao việc,
   rồi gặt kết quả về sổ. Đó là mẫu đã chạy, có số đo; giai đoạn này nhân mẫu ấy ra.
3. **Lời hứa bị rơi.** Việc 6 của đề bài [0007](0007-widen-the-entry-the-system-and-the-intent.md) (xuất hệ sang dạng
   của Claude Design) ghi «để sau», nhưng chưa từng thành câu hỏi nên chưa từng vào kế hoạch.

### Ba luật không đổi

Giai đoạn này dựng trên luật của 0008, không nới luật nào:

- **Sổ thắng.** Khi mặc định của một phích ngoài ngược với sổ, sổ thắng. Thứ phích ngoài làm ra chỉ thành **ứng viên**
  trên hàng chờ, không bao giờ được ghi thẳng vào sổ hay stylesheet.
- **Không trùng.** Mỗi sổ một bên được ghi, là ổ của nó. Cầu nối là phần của ổ, không phải của phích.
- **Script không gọi mô hình, không dùng mạng.** Phích ngoài được gọi ở tầng skill; script chỉ đọc tệp phích để lại và
  kiểm. Vì vậy chỉ skill nhìn được phiên có skill nào, máy chủ MCP nào; script nhìn được repo.

## Bước thiết lập: người dùng thấy gì, làm gì

Đây là phần chủ repo bảo «thiết lập luôn». Mục tiêu của bước: **sau một lượt ngồi, mỗi ổ có đúng một bên làm, người
dùng biết vì sao, và Claude Code không phải đoán phải gọi ai.** Hiệu quả cho kit đo bằng hai con số đã có của 0008:
số chỗ đoán và số lần quyết thay, cộng một con số mới: số câu hỏi người phải trả lời (càng ít càng tốt, nhưng không
được bằng cách quyết thay).

### Năm nhịp

**1. Máy tự nhìn, không hỏi gì.** Skill liệt kê skill và máy chủ MCP của phiên, khớp với tên các tệp phích khai. Script
đọc repo: gói, thư mục, sổ nguồn, dòng quyết định đã có. Mỗi phích ngoài nhận một trong năm trạng thái:

| Trạng thái           | Nghĩa                                                                |
| -------------------- | -------------------------------------------------------------------- |
| `in-repo`            | tệp hay gói của nó nằm trong repo                                    |
| `in-session`         | skill hay máy chủ MCP của nó có trong phiên này                      |
| `needs-sign-in`      | máy chủ MCP của nó có mặt nhưng chưa được cấp quyền                  |
| `absent`             | không thấy ở đâu                                                     |
| `chosen-but-missing` | sổ ghi repo chọn nó, nhưng phiên này không có (máy khác, người khác) |

Điều máy tự xác định được thì không hỏi (tiêu chí 4 của vùng người, 0008).

**2. Một trang bày toàn cảnh.** Một trang theo khung chung của tài liệu plugin (0046), không phải một tràng chữ trong
khung chat:

- hai mươi ổ, xếp theo sáu chặng của vòng đời, mỗi ổ một dòng: việc nó làm bằng một câu đời thường, ai đang làm, và các
  ứng viên kèm trạng thái;
- mỗi ứng viên có một nhãn đo: **đã đo** (trỏ bản quyết định có số đo bốn thước) hay **chưa đo**;
- mỗi ứng viên cần tài khoản, mạng hay gửi dữ liệu ra ngoài thì có nhãn ấy, nói rõ gửi gì đi đâu;
- ổ không có lựa chọn thật (ổ đóng, hay chỉ có phích của plugin) chỉ được bày, không được hỏi.

**3. Hỏi ít, hỏi đóng, một chạm.** Câu hỏi đi vào hàng chờ như mọi câu khác (`design/waiting/plug-<ổ>.json`), trả lời
bằng `decide`:

- chỉ hỏi ở ổ có ít nhất một ứng viên **đã đo** và **có mặt** (`in-repo` hay `in-session`);
- một lượt **tối đa bốn câu**, theo thứ tự lộ trình đi qua ổ; câu dư chờ lượt sau;
- mỗi câu có khuyến nghị đứng đầu, căn cứ (số đo nào, trên bản sao nào), và điều xảy ra nếu từ chối (ổ giữ phích của
  plugin);
- khuyến nghị theo luật chọn của 0008: phích ngoài chỉ được khuyến nghị khi số đo của nó thắng phích của plugin ở thước
  «giữ được không» hay «người dùng phải đoán mấy chỗ»; nếu không, khuyến nghị là phích của plugin;
- phích **chưa đo** không bao giờ là khuyến nghị. Nó được bày kèm một lời mời: «cho đo trên bản sao, ước tính N token».

**4. Ghi có dấu vết.** Lời đáp thành một dòng có tên và ngày. Chạy lại bước với cùng lời đáp thì không hỏi lại câu nào.
Lời cho phép gửi dữ liệu ra ngoài là một dòng riêng, theo từng phích và từng repo, rút lại được.

**5. Dùng, lùi và giữ.** Khi một lộ trình (`new`, `adopt`, `review`, `intake`…) tới một ổ:

- ổ chọn phích của plugin: chạy như hôm nay;
- ổ chọn phích ngoài và phích có trong phiên: skill gọi nó, rồi cầu nối của ổ đưa kết quả về hình dạng ổ đòi, lệnh của ổ
  ghi sổ, cổng kiểm;
- phích ngoài đã chọn mà phiên không có: lùi về phích của plugin và **nói rõ là đang lùi**, kèm lời mời cài
  (luật 5 của Delivery Loop mà 0008 đã nhận);
- `status` thêm cột «đã chọn» vào bảng ổ cắm, và một dòng khi có ổ ở `chosen-but-missing`.

### Bước nằm ở đâu

- Một lệnh riêng, `/design-assembly:plugs`, chạy được lúc nào cũng được, cho repo đang có.
- `new` và `adopt` gọi nó **một lần**, ngay sau bước rà soát và trước tầng hướng đi, vì ổ hướng đi là ổ đầu tiên có ứng
  viên ngoài. Khi không ổ nào có ứng viên đã đo và có mặt, bước chỉ in một dòng («chưa có công cụ ngoài nào đã đo trên
  máy này; mọi ổ dùng phích của plugin») và không dừng.
- Repo Standards gọi plugin không người (đề bài 0013): ở lối ấy bước thiết lập không hỏi gì; mọi câu thành câu trên hàng
  chờ, như lối đặt sổ không hỏi ai.

### Lối người dùng đi, một ví dụ

Một repo mới, chủ repo có sẵn Claude Design và skill frontend-design trong phiên, Figma có mặt nhưng chưa cấp quyền:

1. `new` rà soát, rồi mở bước thiết lập. Máy in: «Hai mươi ổ. Mười lăm ổ chỉ có phích của plugin. Năm ổ có công cụ ngoài
   trên máy này; hai trong số đó đã được đo.» Kèm đường dẫn tới trang toàn cảnh.
2. Hai câu vào hàng chờ, ví dụ: «Ổ hướng đi: dùng ba hướng của plugin vẽ trên màn thật của repo (khuyến nghị: căn cứ…),
   hay để Claude Design đề xuất?» và «Ổ dựng màn: …».
3. Figma hiện `needs-sign-in`, kèm một dòng chỉ cách cấp quyền; không câu hỏi nào cho nó tới khi có mặt và đã đo.
4. Chủ repo đáp hai câu bằng hai chạm trong `decide`; `new` đi tiếp tới tầng hướng đi bằng phích đã chọn.

## Hai cầu nối

### Cầu nối vào: thứ công cụ ngoài làm ra thành ứng viên

Thứ cần đọc, theo lần thử tay: tệp token và trang hệ của Claude Design, `DESIGN.md` của stitch-skills, biến của Figma.
Cầu nối của ổ hướng đi và ổ nền đọc chúng thành **một hướng ứng viên** đứng cạnh các hướng của plugin trên bảng mẫu,
vẽ trên màn thật của repo, sáng và tối:

- giá trị viết bằng biểu thức (`calc()`) được tính ra giá trị cuối, vì đó là chỗ đã mất khi xuất hệ (bài học 4 của lần
  thử tay);
- giá trị nào ngược với một dòng sổ đã chốt thì thành một câu hỏi, không thay dòng sổ;
- màu không đo được tương phản trên cặp chữ và nền mà bảng vai màu nêu thì hướng ấy hiện kèm số đo, như mọi hướng.

### Cầu nối ra: sổ đi ra công cụ ngoài, và biết khi nào bản chép cũ

Việc 6 của đề bài 0007. Cả hai công cụ đã thử đều mang ý đồ tới tác tử bằng **bản chép**, và bản chép cũ đi ngay khi hệ
đổi mà không gì báo (bài học 1). Cầu nối ra sinh bản xuất từ sổ, mang dấu «sinh từ sổ ở bản X», và cổng đỏ khi sổ đổi
mà bản xuất chưa sinh lại, đúng như trang luật hôm nay. Bản xuất đầu tiên là `DESIGN.md` theo đặc tả của nó, và phải qua
bộ kiểm của đặc tả ấy (câu hỏi 6); dạng của Claude Design đi sau.

## Acceptance criteria

Mỗi dòng chứng bằng một lệnh hay một bản ghi lượt thử.

1. Lệnh `plugs` có phần script in, cho mỗi ổ: phích của plugin, các ứng viên ngoài, và với mỗi ứng viên trạng thái
   phía repo, nhãn đo (mã bản quyết định hay `unmeasured`) và nhu cầu (tài khoản, mạng, gửi gì ra ngoài). `--json`
   theo hợp đồng chung của lệnh (0044).
2. Một tệp phích khai được tên skill và tên máy chủ MCP của nó; phép kiểm hình dạng của bảng ổ cắm đỏ khi một tệp phích
   khai sai.
3. Skill `plugs` khớp skill và máy chủ MCP của phiên với tệp phích, và chỉ dùng tên bảng ổ cắm nêu, như skill `review`.
4. Chỉ ổ có ứng viên đã đo và có mặt được hỏi; một lượt tối đa bốn câu; mỗi câu có `question`, `recommendation`,
   `basis`, `where`, `if_refused`. Có bài kiểm.
5. Một phích chưa đo không bao giờ là khuyến nghị. Có bài kiểm.
6. Lời đáp ghi thành dòng có tên và ngày; chạy lại với cùng lời đáp không sinh câu nào. Có bài kiểm.
7. `status` có cột «đã chọn» và trạng thái `chosen-but-missing`; mã thoát không đổi.
8. Một lộ trình tới ổ đã chọn phích ngoài mà phiên không có thì lùi về phích của plugin và in một dòng nói đang lùi. Có
   bài kiểm trên ổ soát thiết kế, ổ đã có mắt ngoài.
9. Cầu nối vào đọc ba mẫu dữ liệu (tệp token kiểu Claude Design, một `DESIGN.md`, một bản xuất biến kiểu Figma) thành
   một hướng ứng viên; biểu thức thành giá trị cuối; giá trị ngược sổ thành câu hỏi. Có bài kiểm bằng mẫu dữ liệu, không
   gọi mạng.
10. Cầu nối ra sinh bản xuất từ sổ kèm dấu bản; cổng đỏ khi sổ đổi mà bản xuất chưa sinh lại. Có bài kiểm làm hỏng.
11. Mỗi phích được đưa lên «đã đo» có một bản quyết định với số đo bốn thước trên bản sao bằng đề chuẩn.
12. Phép «lõi sạch» vẫn xanh: tên công cụ ngoài chỉ nằm trong thư mục phích cắm.
13. Dòng «xong khi» của giai đoạn: một lượt thử có người trên một repo mới, chủ repo chọn phích cho các ổ trong một lượt
    không quá bốn câu, và một màn dựng qua phích ngoài đã chọn vẫn qua cổng, số chỗ đoán không tăng và số lần quyết thay
    bằng 0.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Có thể đổi hợp đồng sổ, tuỳ câu hỏi 2: nếu lựa chọn
phích ghi thành dòng của sổ quyết định thì hợp đồng không thêm sổ nào; nếu ghi thành sổ riêng thì thêm một sổ, cần
người duyệt như mọi thay đổi hợp đồng.

## Plan

Bốn mục sau đề bài, mỗi mục một hay hai PR, theo thứ tự:

1. **10.1 Bước thiết lập** (tiêu chí 1 đến 8): lệnh và skill `plugs`, trang toàn cảnh, câu hỏi trên hàng chờ, dòng ghi
   lựa chọn, cột mới của `status`, lối lùi; `new` và `adopt` gọi bước một lần.
2. **10.2 Đo các phích ưu tiên** (tiêu chí 11): mỗi phích một lượt thử trên bản sao bằng đề chuẩn, mỗi lượt hỏi chủ
   repo trước vì tốn token; thêm tệp phích còn thiếu (Open Design, Figma, ux-ui-craft) khi có ổ cho chúng.
3. **10.3 Cầu nối vào** (tiêu chí 9).
4. **10.4 Cầu nối ra** (tiêu chí 10), rồi lượt thử của dòng «xong khi» (tiêu chí 13).

## Test plan

- Mỗi tiêu chí có bài kiểm của plugin, chạy bằng mẫu dữ liệu, không mạng, không mô hình.
- Phép kiểm làm hỏng cho tiêu chí 2, 5, 8 và 10: tệp phích khai sai, phích chưa đo được khuyến nghị, phích đã chọn vắng
  mặt, bản xuất cũ; mỗi lần phải đỏ với thông điệp nêu đúng chỗ.
- Đo phích ngoài trên bản sao bỏ đi, không đụng repo thật; lượt nào cần tài khoản hay gửi dữ liệu ra ngoài thì nói trước
  gửi gì, đi đâu.

## Autonomy tier

Máy tự dựng 10.1, 10.3 và 10.4 sau lời duyệt đề bài, mỗi mục một PR; gộp là lời chủ repo. Luôn là lời chủ repo: mỗi
lượt đo tốn token, mỗi phích cần tài khoản hay gửi dữ liệu ra ngoài, đổi phích mặc định của một ổ, và thêm hay bớt một
năng lực. Không sửa Repo Standards, delivery-loop hay repo kiểm chứng.

## Open questions

Mỗi câu kèm một khuyến nghị.

1. **Giai đoạn 10 đi trước giai đoạn 7?** Khuyến nghị: có. Giai đoạn 7 cần chủ repo tạo repo cho lõi, việc ấy chưa có;
   giai đoạn 10 không chờ ai và có ích cho mọi repo, kể cả repo Repo Standards vừa đặt. Nếu không, giai đoạn 10 đứng
   sau 7 và không mục nào bị chậm.
2. **Lựa chọn phích ghi ở đâu?** Khuyến nghị: thành dòng của sổ quyết định (mỗi ổ một dòng `plug-<ổ>`), vì lựa chọn
   phích là một quyết định của chủ repo, `decide` đã đọc dòng sổ, và hợp đồng không thêm sổ. Từ chối thì thêm một sổ
   riêng, cần duyệt hợp đồng.
3. **Tên lệnh là `plugs`?** Khuyến nghị: có, theo tên khung đã dùng trong mã (`references/plugs/`). Từ chối thì đặt
   tên khác trước khi dựng 10.1; tên phải vào `references/vocabulary.json`.
4. **Một lượt tối đa bốn câu?** Khuyến nghị: có. Đó là cỡ Claude Design dùng cho một lượt hỏi, và đủ cho năm ổ có ứng
   viên ngoài hôm nay. Từ chối thì không giới hạn, và bước có thể thành một tràng câu hỏi.
5. **Thứ tự đo ở 10.2?** Khuyến nghị: frontend-design ở ổ dựng màn trước, rồi Open Design và Stitch ở ổ hướng đi qua
   `DESIGN.md`, rồi ReUI qua `intake`, rồi Claude Design sau ngày 2026-12-14, rồi Figma và Mobbin. Căn cứ: frontend-design
   chạy tại chỗ, không tài khoản, và ổ dựng màn được dùng ở mọi màn; Claude Design đang đổi chỗ ở (trang riêng đóng ngày
   2026-12-14) nên số đo trước ngày ấy dễ mất giá trị; Figma và Mobbin cần tài khoản, Figma ghế miễn phí chỉ 20 lượt một
   tháng.
6. **Cầu nối ra nhắm định dạng nào trước?** Khuyến nghị: `DESIGN.md` trước, Claude Design sau. Căn cứ: `DESIGN.md` có
   đặc tả viết ra và bộ kiểm chạy được, và ít nhất ba công cụ đọc nó (Stitch, stitch-skills, Open Design); định dạng
   xuất của Claude Design chưa thấy trang nào của Anthropic nêu, và công cụ đang chuyển chỗ. Điều này đảo một dòng
   «ngoài phạm vi» của đề bài 0007 (đọc hay xuất `DESIGN.md`); lời duyệt câu này là lời bỏ dòng ấy.
7. **Lời cho phép gửi dữ liệu ra ngoài theo repo hay theo lần?** Khuyến nghị: theo repo và theo phích, ghi thành dòng,
   rút lại được; mỗi lượt vẫn in trước gửi gì đi đâu. Từ chối thì hỏi mỗi lần, chậm hơn nhưng chặt hơn.
