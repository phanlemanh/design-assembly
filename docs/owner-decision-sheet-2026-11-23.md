# Phiếu quyết định cho chủ kho, ngày 2026-11-23

Các câu đang chờ lời chủ kho, gom về một trang để đáp trong một lần ngồi. Trang này không trả lời câu nào: mỗi câu có
một khuyến nghị đứng đầu, căn cứ của nó, điều xảy ra nếu chủ kho không nhận, và điều sẽ đổi ở tệp nào với mỗi lời đáp.
Lời đáp được chép nguyên văn kèm ngày vào dòng «Lời chủ kho» của câu; câu nào đổi một tệp thì việc đổi đi thành một
commit sau của cùng PR với trang này, và dòng ấy nói commit nào.

**Ngày 2026-11-24, chủ kho đáp cả mười tám câu, mỗi câu một chạm, đều theo khuyến nghị.** Năm câu đổi tệp (3.3, 3.4,
4.1, 4.2 và 4.3, cùng lời của 4.4 ghi vào 0077); câu 4.4 cần một bản plugin mới nên vào việc gác lại; câu 5.2 cho dọn
sau khi các phiên đo của mục 10.2 xong.

Nguồn, đọc ngày 2026-11-23 trên nhánh chính ở `acf3d2a` (plugin 0.48.0):

- mục «Quyết định cho chủ repo» của PR #106 (sáu điểm) và PR #110 (bốn điểm), đọc bằng
  `gh pr view <số> --repo phanlemanh/design-assembly --json body`, rồi đối chiếu với nhánh chính hôm nay: bảy PR sửa
  sau đó (#111 tới #117) và hai quyết định [0094](../wiki/decisions/0094-plugs-takes-away-questions-whose-plugs-are-gone-and-asks-again.md),
  [0095](../wiki/decisions/0095-the-owners-word-is-recorded-for-a-place.md) đã đổi một phần điều chúng tả;
- mục «Đang chờ lời chủ kho» của [trang bàn giao](HANDOFF.md);
- dòng giới hạn `design-floor-not-declared-to-kit` của sổ giới hạn (`plugins/design-assembly/references/limits.json`);
- việc gác lại của nhóm «Ai trả lời, ai giữ lời đáp» (`make plan`).

Không câu nào dưới đây chặn dòng «xong khi» của giai đoạn 10. Phiếu xếp năm nhóm, mỗi nhóm không quá bốn câu; nhóm đầu
là các câu chủ kho nên đáp trước, vì chúng nói phích nào được hỏi trên kho của người dùng.

## Không nằm trên phiếu này

- **Lời cho đo từng phích ngoài (mục 10.2), lượt thử có người (mục 10.4), và lời cho đẩy hệ lên Claude**: kế hoạch ghi
  chúng là «needs the owner», hỏi ở đúng lúc chạy, kèm ước tính token và điều sẽ gửi đi. Hai phiên đang đo ReUI và
  frontend-design hỏi chủ kho trong phiên của chúng.
- **PR #107, #108 và #109 cũng có mục «Quyết định cho chủ repo»** (sáu, sáu và bốn điểm: tên lệnh `bring-in` và
  `bring-out`, chỗ đặt `DESIGN.md`, một rem là 16 điểm ảnh, tệp phích của hệ Claude khai lệnh `design-sync`…). Trang
  bàn giao không nêu chúng, nên phiếu này không chép; nếu chủ kho muốn, chúng thành một phiếu thứ hai cùng cách viết.

## Nhóm 1. Chọn phích ở từng ổ (PR #106)

### 1.1 Mắt soát `design-critique` có tính là đã đo không

- **Hỏi:** Phích soát màn `design-critique` có được coi là đã đo (theo bản quyết định 0073) và thua phích của plugin ở ổ
  soát thiết kế không?
- **Khuyến nghị: có, coi là đã đo và thua.** Bản 0073 có mục số đo theo bốn thước, và kết luận nó là một mắt nhìn thêm,
  không phải phích mặc định của ổ. Coi là đã đo nghĩa là lệnh chọn phích được hỏi về nó khi phiên có nó, với khuyến nghị
  giữ phích của plugin.
- **Căn cứ:** tệp phích `plugins/design-assembly/references/plugs/design-critique.json` hôm nay ghi
  `"measured": {"design-review": {"record": "d0073", "beats_plugin": false}}`;
  [0073](../wiki/decisions/0073-the-review-socket-plugs-an-outside-eye.md). Phiên điều phối từng đề nghị coi là chưa đo.
- **Nếu không nhận:** phích ấy thành chưa đo; lệnh chọn phích không hỏi gì ở ổ soát thiết kế, mắt ấy vẫn được trao ảnh
  khi chưa ai chọn phích cho ổ, như hôm nay.
- **Đổi gì:** Có → không tệp nào đổi. Không → bỏ khoá `measured` khỏi `references/plugs/design-critique.json` và nói
  lại trong 0089; không cần bản plugin mới (cổng chỉ đòi bản mới khi `scripts/` hay `templates/` đổi).
- **Hôm nay ở nhánh chính:** như PR #106 tả, không PR sau nào đổi.
- **Lời chủ kho:** «Coi là đã đo (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi.

### 1.2 Phích chỉ phiên có, đã chọn, hiện là «thiếu» trong báo cáo trạng thái

- **Hỏi:** Báo cáo trạng thái có giữ cách gọi «đã chọn mà vắng» cho một phích chỉ phiên mới có (như hệ của Claude sau
  tài khoản), dù nó không nhìn được phiên không?
- **Khuyến nghị: giữ.** Báo cáo trạng thái không nhìn phiên (script không gọi mô hình, không dùng mạng), nên nó không
  biết phích có mặt hay không; gọi là thiếu thì người đọc đi hỏi, còn im thì giấu một sự vắng có thật. Dòng giới hạn đã
  nói điều ấy.
- **Căn cứ:** dòng giới hạn `plugs-chosen-session-plug-reads-missing` (mở, mức vừa); quyết định
  [0090](../wiki/decisions/0090-plugs-sees-the-session-falls-back-and-shows-the-board.md), điểm 7.
- **Nếu không nhận:** báo cáo trạng thái nói «không biết» cho phích chỉ phiên có, như lệnh chọn phích đã làm khi phiên
  không được liệt kê.
- **Đổi gì:** Có → không tệp nào đổi; dòng giới hạn ở lại. Không → sửa `scripts/status.mjs` và bài kiểm của nó, một bản
  plugin mới, dòng giới hạn đóng.
- **Hôm nay ở nhánh chính: đã đổi một nửa.** PR #107 (quyết định 0090) cho skill liệt kê phiên: lệnh chọn phích thấy
  phích trong phiên, và khi không ai liệt kê phiên thì nó nói «không biết», không gọi là vắng. Câu còn lại chỉ là của
  báo cáo trạng thái.
- **Lời chủ kho:** «Giữ «vắng» (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi.

### 1.3 Dòng sổ ghi một lựa chọn phích

- **Hỏi:** Lựa chọn phích của một ổ có được ghi thành một dòng của sổ quyết định ở tầng quản trị, loại «phán xét», nguồn
  `plug:<phích>`, kèm ghi chú đóng dấu như tờ quyết định, và câu hỏi đã đáp rời hàng chờ ngay khi thành dòng không?
- **Khuyến nghị: có.** Đó là cách mọi lời đáp của hàng chờ đang thành dòng; hàng chờ không nhận câu trùng mã với một
  dòng sổ, nên câu phải rời đi.
- **Căn cứ:** [0089](../wiki/decisions/0089-plugs-command-asks-where-a-measured-plug-is-here.md); dòng giới hạn
  `plugs-row-and-question-share-an-id` (mở, mức nhẹ: lệnh dừng giữa hai bước ghi thì hàng chờ đọc là hỏng tới lần chạy
  sau).
- **Nếu không nhận:** lựa chọn phích ghi ở một sổ riêng; cần thêm một sổ vào hợp đồng, sửa lệnh chọn phích và báo cáo
  trạng thái.
- **Đổi gì:** Có → không tệp nào đổi. Không → một đề bài nhỏ trước, rồi `scripts/plugs.mjs`, `references/contract.md`,
  một bản plugin mới.
- **Hôm nay ở nhánh chính: đã đổi một phần.** Hệ quả «một lựa chọn không có lối quay lại» đã được sửa: `plugs --reask
<ổ>` bỏ dòng và hỏi lại (PR #111, #112, quyết định 0094). Hình dạng dòng thì như PR #106 tả.
- **Lời chủ kho:** «Ghi vào sổ quyết định (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi.

### 1.4 Từ chối ở một ổ

- **Hỏi:** Chủ kho từ chối câu hỏi ở một ổ thì ổ có giữ phích của plugin (và ổ plugin không có phích thì để trống) không?
- **Khuyến nghị: có.** Từ chối là «không đổi», và điều không đổi là phích đang làm ổ ấy.
- **Căn cứ:** PR #106, điểm 6; trên nhánh chính hôm nay, ổ không có phích của plugin mang ứng viên `none`
  (`references/capabilities.json`).
- **Nếu không nhận:** câu bị từ chối ở lại hàng chờ, hoặc được hỏi lại ở lần chạy sau; cần nói cách nào.
- **Đổi gì:** Có → không tệp nào đổi. Không → `scripts/plugs.mjs` và bài kiểm, một bản plugin mới.
- **Hôm nay ở nhánh chính:** như PR #106 tả.
- **Lời chủ kho:** «Giữ phích của plugin (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi.

## Nhóm 2. Lệnh chọn phích và lời cho phép gửi ra ngoài (PR #106, PR #110)

### 2.1 Thứ tự lộ trình theo bảng năng lực

- **Hỏi:** Lộ trình các ổ có đi theo thứ tự của bảng năng lực, tức sáu chặng của vòng đời, không?
- **Khuyến nghị: có.** Một thứ tự, một chỗ giữ; trang toàn cảnh và báo cáo trạng thái đọc cùng thứ tự.
- **Căn cứ:** PR #106, điểm 4; `references/capabilities.json` (khoá `stages` và `capabilities`).
- **Nếu không nhận:** chủ kho nêu thứ tự khác; nó phải được ghi ở bảng năng lực, không ở lệnh.
- **Đổi gì:** Có → không tệp nào đổi. Không → `references/capabilities.json`, và các bài kiểm của bảng.
- **Hôm nay ở nhánh chính:** như PR #106 tả.
- **Lời chủ kho:** «Theo bảng năng lực (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi.

### 2.2 Lệnh chọn phích là một phích của ổ quyết định

- **Hỏi:** Lệnh chọn phích có đứng trong bảng năng lực như một phích không mặc định của ổ quyết định không?
- **Khuyến nghị: có.** Nó ghi sổ quyết định và chỉ ghi lời đáp của chủ kho; phép kiểm «script chỉ chạm sổ của ổ mình»
  thấy và cho phép điều ấy.
- **Căn cứ:** PR #106, điểm 5; `references/capabilities.json`, ổ `decision`: hai phích `decide` (lõi, mặc định) và
  `plugs` (lệnh, không mặc định).
- **Nếu không nhận:** lệnh cần một ổ của riêng nó; phép kiểm sổ của ổ phải cho ổ ấy ghi sổ quyết định.
- **Đổi gì:** Có → không tệp nào đổi. Không → `references/capabilities.json`, `scripts/capabilities.mjs`, một bản
  plugin mới.
- **Hôm nay ở nhánh chính:** như PR #106 tả.
- **Lời chủ kho:** «Phích của ổ quyết định (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi.

### 2.3 Lời cho phép gửi ra ngoài đi qua hàng chờ

- **Hỏi:** Lời cho phép gửi bộ hệ ra ngoài có đi qua hàng chờ và tờ quyết định như mọi câu hỏi khác, đánh dấu khó đảo
  ngược, không?
- **Khuyến nghị: có.** Một lối hỏi cho mọi câu; dấu «khó đảo ngược» làm tờ quyết định nói rõ điều gửi đi không lấy lại
  được.
- **Căn cứ:** PR #110, điểm 1; `scripts/send-out.mjs` (câu hỏi mang `hard_to_undo: true`);
  [0093](../wiki/decisions/0093-send-out-asks-leave-records-the-push-and-says-when-it-is-behind.md).
- **Nếu không nhận:** lời cho phép đi qua một lệnh riêng; một lối hỏi thứ hai.
- **Đổi gì:** Có → không tệp nào đổi. Không → một đề bài nhỏ, rồi `scripts/send-out.mjs`, một bản plugin mới.
- **Hôm nay ở nhánh chính:** như PR #110 tả. Sau đó PR #115 thêm: lời cho phép chỉ tính cho đúng các tệp và nơi đến
  dòng sổ ghi.
- **Lời chủ kho:** «Qua hàng chờ (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi.

### 2.4 Ứng viên đứng đầu của câu cho phép gửi

- **Hỏi:** Ở câu cho phép gửi ra ngoài, «cho phép» có đứng đầu khi phích là phích chủ kho đã nêu ở ổ bàn giao và lời ấy
  được nói về đúng nơi phích gửi tới hôm nay, còn mọi trường hợp khác «chưa» đứng đầu, không?
- **Khuyến nghị: có.** Đứng đầu là khuyến nghị, không phải lời đáp; nó chỉ dựa vào lời của chủ kho khi lời ấy còn nói
  về đúng nơi đến.
- **Căn cứ:** PR #110, điểm 2; [0095](../wiki/decisions/0095-the-owners-word-is-recorded-for-a-place.md);
  `references/plugs/claude-design.json`, khoá `recommended_by_owner` ghi lời ngày 2026-11-23 kèm chữ `sends` lúc ấy.
- **Nếu không nhận:** «chưa» luôn đứng đầu, kể cả với hệ của Claude.
- **Đổi gì:** Có → không tệp nào đổi. Không → `scripts/send-out.mjs` và bài kiểm, một bản plugin mới.
- **Hôm nay ở nhánh chính: đã đổi.** PR #110 tả «phích chủ kho đã nêu thì cho phép đứng đầu». PR #116 và #117 (quyết
  định 0095, theo lời chủ kho «Gửi sang sửa») thu hẹp: lời chủ kho nay ghi cả nơi nó được nói về, và «cho phép» chỉ
  đứng đầu khi phích còn gửi tới đúng nơi ấy, ở lần hỏi đầu, khi hỏi lại và khi chọn lại. Câu trên là câu đã thu hẹp.
- **Lời chủ kho:** «Giữ luật ấy (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi.

## Nhóm 3. Bản ghi lần đẩy, kit nghiệm thu, và ai giữ một giới hạn

### 3.1 Bản ghi lần đẩy không phải một sổ của hợp đồng

- **Hỏi:** Bản ghi các lần đẩy hệ lên Claude có nằm ở `design/export/pushed.json`, ngoài các sổ của hợp đồng, không?
- **Khuyến nghị: có.** Nó là nhật ký của một việc làm ngoài kho (skill ghi lại), không phải lời quyết định; đưa vào hợp
  đồng thì cổng phải giữ một tệp mà không gì trong kho kiểm được đúng sai.
- **Căn cứ:** PR #110, điểm 3; `scripts/send-out.mjs` (`PUSHED`); dòng giới hạn của 0093 về lần đẩy được ghi theo lời
  của skill.
- **Nếu không nhận:** thêm một sổ vào hợp đồng, có hình dạng và phép kiểm.
- **Đổi gì:** Có → không tệp nào đổi. Không → `references/contract.md`, phép kiểm hình dạng, một bản plugin mới.
- **Hôm nay ở nhánh chính:** như PR #110 tả.
- **Lời chủ kho:** «Ngoài hợp đồng (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi.

### 3.2 Câu «đặt làm mặc định» chỉ hỏi ở lần đẩy đầu

- **Hỏi:** Câu «đặt hệ vừa gửi làm mặc định ở Claude?» có chỉ hỏi ở lần đẩy đầu tiên, và chỉ hỏi lại khi câu ấy đã bị bỏ
  khỏi hàng chờ, không?
- **Khuyến nghị: có.** Đổi mặc định của tài khoản đổi mọi thiết kế làm ở đó; hỏi mỗi lần đẩy là hỏi lại một điều đã
  đáp.
- **Căn cứ:** PR #110, điểm 4; `scripts/send-out.mjs` (câu `default-<phích>`, khuyến nghị «có» khi tài khoản chưa có hệ
  mặc định); dòng giới hạn `send-out-default-asked-not-set` (không gì trong plugin đọc lời đáp để tự đặt).
- **Nếu không nhận:** hỏi ở mỗi lần đẩy.
- **Đổi gì:** Có → không tệp nào đổi. Không → `scripts/send-out.mjs`, một bản plugin mới.
- **Hôm nay ở nhánh chính:** như PR #110 tả.
- **Lời chủ kho:** «Chỉ lần đầu (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi.

### 3.3 Khai phần thiết kế của kho này với kit nghiệm thu

- **Hỏi:** Kho này có khai với kit nghiệm thu bề mặt giao diện, tệp token và sổ linh kiện của nó không?
- **Khuyến nghị: có, khai cả ba.** Cả hai vật đã có từ ngày 2026-11-12; không khai thì kit vẫn chấm kho này ở bậc thấp
  nhất, và dòng giới hạn còn mở chỉ vì thế.
- **Căn cứ:** chạy lệnh đọc bậc của kit 3.0.0 ngày 2026-11-23:
  - trên kho này: `{"bac":"M0","ly_do":"chưa khai design.surface_globs", …}`;
  - trên một bản sao sạch (`git archive`) có thêm ba khoá `design.surface_globs: ["src/**/*.tsx"]`,
    `design_floor.tokens: design/tokens.json`, `design_floor.registry: design/component-registry.json`: bậc M1, lý do
    «trỏ tệp không có: design/component-registry.json», vì sổ linh kiện là vật dẫn xuất, không nằm trong git, cổng ghi
    lại nó khi chạy ([0009](../wiki/decisions/0009-component-manifest.md));
  - cùng bản sao, sau khi có sổ linh kiện: bậc M2, «nguồn design/tokens.json · design/component-registry.json».

  Dòng giới hạn `design-floor-not-declared-to-kit` (mở, mức nhẹ, «giữ»); 0009 nói việc khai là của chủ kho.

- **Nếu không nhận:** dòng giới hạn ở lại, kit vẫn chấm M0; không gì khác đổi.
- **Đổi gì:** Có → thêm ba khoá vào `_acceptance/config.yaml`; đóng dòng `design-floor-not-declared-to-kit` (không cần
  bản plugin mới); chạy lại lệnh đọc bậc của kit và ghi kết quả vào commit. Điều còn lại cần nói ra: trên một bản clone
  chưa chạy cổng, kit đọc M1 vì thiếu sổ linh kiện. Không → không tệp nào đổi.
- **Lời chủ kho:** «Khai cả ba (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Đổi trong commit sau của PR này: ba khoá thêm vào `_acceptance/config.yaml`, dòng giới hạn `design-floor-not-declared-to-kit` đóng ngày 2026-11-24. Lệnh đọc bậc của kit chạy lại trên kho này sau khi cổng ghi sổ linh kiện: `{"bac":"M2","ly_do":"nguồn design/tokens.json · design/component-registry.json", …}`.

### 3.4 Ai giữ giới hạn mức nặng `owner-calls-trusts-a-written-answer`

- **Hỏi:** Giới hạn «cửa mở khi câu hỏi của hàng chờ có lời đáp, mà không phân biệt chủ kho hay tác tử viết lời đáp ấy»
  có về lại kho này, ghi «giữ», chờ tới giai đoạn 7, không?
- **Khuyến nghị: có.** Dòng còn ghi giao cho Repo Standards, nhưng phiên giám sát bên ấy báo chủ kho đã chọn không dựng
  phần nhận (RS5a); một dòng giao cho bên không làm thì không ai giữ. Giai đoạn 7, khi nhiều repo và nhiều người trả
  lời, là lúc có người cần phân biệt ai viết lời đáp.
- **Căn cứ:** sổ giới hạn, dòng `owner-calls-trusts-a-written-answer` (mở, mức nặng, `plan: hand-off`,
  `repo: repo-standards`); việc gác lại của nhóm «Ai trả lời, ai giữ lời đáp» (`make plan`); báo cáo
  `docs/reports/2026-11-20-decision-to-merge-trace.md` ở kho Repo Standards (phía kho ấy chưa kiểm ở đây).
- **Nếu không nhận:** dòng giữ giao cho Repo Standards, và việc gác lại ở lại; hoặc chủ kho nêu chủ khác.
- **Đổi gì:** Có → sổ giới hạn: dòng ấy đổi `plan` thành `keep`, bỏ `repo`, ghi chú nói lý do; bỏ việc gác lại ấy khỏi
  `parked` của `docs/plan/plan.json`. Không cần bản plugin mới. Không → không tệp nào đổi.
- **Lời chủ kho:** «Về kho này, giữ (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Đổi trong commit sau của PR này: dòng `owner-calls-trusts-a-written-answer` của sổ giới hạn nay ghi «giữ», bỏ giao cho kho bên cạnh, ghi chú nói lý do; việc gác lại của nhóm «Ai trả lời, ai giữ lời đáp» rời `parked` của kế hoạch.

## Nhóm 4. Những gì đang dùng mà chưa được nhận bằng lời

### 4.1 Bộ sổ lúc ra đời là bảy sổ

- **Hỏi:** Bộ sổ một repo có từ lúc ra đời có là bảy sổ, không phải mười như câu 3 của đề bài 0013 đã duyệt, không?
- **Khuyến nghị: có.** Ba sổ để ra ngoài (bản thiết kế, sổ nguồn, trang kiểu màn) chỉ lời người viết được: lời đáp các
  tầng, giấy phép của font, từng trang kiểu màn. Một máy viết chúng lúc ra đời là máy trả lời thay người.
- **Căn cứ:** [0085](../wiki/decisions/0085-adopt-starter-lays-the-ledgers-a-repository-has-from-birth.md), điểm 5;
  lượt thử cuối của giai đoạn 6 ([`born-through-repo-standards.md`](trials/born-through-repo-standards.md)): `status`
  in đủ bảy sổ trên repo vừa ra đời.
- **Nếu không nhận:** cần một đề bài nói ba sổ kia ra đời với gì khi chưa ai nói gì.
- **Đổi gì:** Có → ghi lời chủ kho vào mục Status của 0085. Không → đề bài mới, rồi `references/contract.md` (cột
  «From birth») và lối đặt sổ, một bản plugin mới.
- **Hôm nay ở nhánh chính:** như 0085 tả; chủ kho được báo trước khi commit và bảo commit, chưa nói gì thêm.
- **Lời chủ kho:** «Bảy sổ (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Đổi trong commit sau của PR này: lời ghi vào mục Status của 0085.

### 4.2 Câu chung cho nhiều màn trên hàng chờ

- **Hỏi:** Hàng chờ có giữ loại mục `screens:` (một câu nguyên tắc hay một câu thay đổi mô hình hỏi một lần cho mọi màn
  liên quan) và khoá `replaces` (câu mới thay câu đang chờ khi thêm tên, cờ `decide --ask --replaces`) không?
- **Khuyến nghị: có.** Trong tình huống của lượt thử 13 nó hạ số câu từ 10 xuống 6; câu đã có lời đáp không bao giờ bị
  thay.
- **Căn cứ:** [0077](../wiki/decisions/0077-the-brief-after-its-second-builder-trial.md), điểm 4 và 5; lượt thử 14
  (`docs/trials/screen-trial-14-after-the-second-fixes.md`): 14 câu so với 21 của lượt 13, 2 câu là câu chung.
- **Nếu không nhận:** quay về hỏi theo từng màn, như công cụ trước 0.26.0.
- **Đổi gì:** Có → ghi lời chủ kho vào mục Status của 0077. Không → đề bài mới; phiếu `brief`, bộ đọc hàng chờ trong
  `templates/`, một bản plugin mới.
- **Lời chủ kho:** «Giữ câu chung (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Đổi trong commit sau của PR này: lời ghi vào mục Status của 0077.

### 4.3 Nút trên toast có tính vào hành động của màn

- **Hỏi:** Một nút trên toast mà màn bật lên (như «Hoàn tác») có tính là một nút cho hành động ấy, ghi vào danh sách
  hành động của màn, không?
- **Khuyến nghị: có.** Đó là nghĩa phép kiểm màn và hành động đang dùng: người bấm nút trên toast cũng phải được chạy
  hành động. Cách ngược lại làm cổng không kiểm ai được bấm «Hoàn tác».
- **Căn cứ:** 0077, điểm 1 và mục «Điều cần chủ repo nhìn lại»; dòng giới hạn `screen-actions-toast-button-unsaid`
  (còn mở: cổng không phân biệt nút trên toast với nút vẽ trên màn).
- **Nếu không nhận:** chỉ nút vẽ trên màn được tính; trang luật và ô 3 của phiếu `brief` đổi lời.
- **Đổi gì:** Có → ghi lời chủ kho vào 0077. Không → mẫu trang luật trong `templates/`, phiếu `brief`, một bản plugin
  mới; trang luật của kho này nhận bản mới qua `make design-apply`.
- **Lời chủ kho:** «Có tính (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Đổi trong commit sau của PR này: lời ghi vào mục Status của 0077.

### 4.4 Chữ của trạng thái chờ ở nút không hiện chữ

- **Hỏi:** Ở chỗ hai luật kéo ngược nhau (trạng thái được liệt kê bằng chữ nó đặt lên trang, còn nút «⋯» của dòng chỉ
  nói đang chờ bằng một tên trình đọc màn hình nghe được), có cho nút ấy đặt tên đang chờ lên trang dưới dạng chữ chỉ
  trình đọc màn hình đọc không?
- **Khuyến nghị: có.** Nút xoá của màn mẫu đã làm đúng như vậy; trạng thái chờ khi ấy có chữ của riêng nó, vắng trước
  khi tới, nên bài kiểm trình duyệt chứng được nó.
- **Căn cứ:** 0077, điểm 3 và mục «Điều cần chủ repo nhìn lại»; linh kiện `templates/owned/row-actions.tsx.template`;
  hai dòng giới hạn `spoken-only-state-unlisted`, `state-words-present-before-the-state`. Câu `row-waiting-state-words`
  chưa từng được xếp trên hàng chờ của kho này.
- **Nếu không nhận:** hai luật vẫn chọi; trạng thái chờ ấy ở ngoài danh sách trạng thái của màn, như khuyến nghị tạm
  của 0077.
- **Đổi gì:** Có → linh kiện và bài kiểm của nó trong `templates/owned/`, một bản plugin mới; kho đã nhận linh kiện giữ
  bản cũ tới khi chép lại; hai dòng giới hạn thu hẹp. Không → ghi lời chủ kho vào 0077, không tệp nào khác đổi.
- **Lời chủ kho:** «Có, đặt chữ ẩn (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Lời ghi vào mục Status của 0077 trong commit sau của PR này. Việc đổi linh kiện mẫu là một bản plugin mới, nên **không làm ở PR này**: nó vào việc gác lại của kế hoạch (nhóm «Dựng màn và soát màn»), chờ một PR riêng.

## Nhóm 5. Sổ giới hạn và dọn máy

### 5.1 Mức và hướng xử lý máy đặt cho các dòng giới hạn của giai đoạn 5 và 9

- **Hỏi:** Chủ kho có nhận mức và hướng xử lý máy đã đặt cho các dòng giới hạn mở trong giai đoạn 5 và 9, và chỉ xem lại
  từng dòng khi một repo thật đụng tới, không?
- **Khuyến nghị: có.** Sổ có 92 dòng đang mở mở từ ngày 2026-11-20 tới 2026-11-22 (2 nặng, 42 vừa, 48 nhẹ; 58 «sửa»,
  34 «giữ»); xét từng dòng không có căn cứ mới nào hơn lúc máy đặt. Đáng chú ý nhất, `unmarked-action-control-unseen`
  (bài kiểm theo vai chỉ thấy nút mang dấu hành động): mức vừa, «giữ», vì trang luật đòi dấu và linh kiện của sàn mang
  dấu.
- **Căn cứ:** sổ giới hạn (đếm ngày 2026-11-23); việc gác lại «Mười chín giới hạn mức nặng đang mở» theo cùng luật
  «chỉ sửa khi một repo thật đụng tới».
- **Nếu không nhận:** chủ kho nêu dòng nào đổi mức hay hướng.
- **Đổi gì:** Có → không tệp nào đổi; bỏ dòng này khỏi «Đang chờ lời chủ kho» của trang bàn giao. Không → các dòng chủ
  kho nêu trong sổ giới hạn; không cần bản plugin mới.
- **Lời chủ kho:** «Nhận như máy đặt (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Không tệp nào đổi ở sổ giới hạn; dòng của câu này rời «Đang chờ lời chủ kho» của trang bàn giao.

### 5.2 Dọn các thư mục làm việc và nhánh đã gộp

- **Hỏi:** Có dọn các thư mục làm việc dưới `.claude/worktrees/` mang nhánh đã gộp và các nhánh đã gộp trên remote không?
- **Khuyến nghị: có, sau khi các phiên đang đo của mục 10.2 xong.** Cuối ngày 2026-11-23 trang bàn giao đếm bốn thư mục
  và mười tám nhánh; hôm nay hai phiên đang làm ở thư mục và nhánh riêng, nên dọn trước khi chúng xong là đụng việc đang
  làm. Mỗi thư mục được xem sạch hay không trước khi bỏ.
- **Căn cứ:** trang bàn giao, mục «Máy này» và «Đang chờ lời chủ kho».
- **Nếu không nhận:** để nguyên; không gì hỏng, chỉ chiếm chỗ.
- **Đổi gì:** Không tệp nào trong kho đổi. Có → xoá thư mục và nhánh bằng lệnh, kể lại từng cái đã xoá; bỏ dòng này
  khỏi trang bàn giao. Đây là việc khó đảo ngược: nhánh đã xoá trên remote chỉ lấy lại được từ commit của nó.
- **Lời chủ kho:** «Dọn sau khi đo xong (Recommended)», ngày 2026-11-24, một chạm trong phiên làm phiếu. Chưa dọn gì: hai phiên đo của mục 10.2 chưa cùng xong lúc lời này được ghi. Trang bàn giao ghi lời cho dọn và điều kiện của nó.
