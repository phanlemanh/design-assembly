---
type: spec
title: Mở rộng ở ba chỗ — cửa vào, bề rộng của hệ, và ý đồ thiết kế tới tay tác tử
status: approved
tier: 1
links:
  - wiki/specs/0001-design-system-for-claude-code.md
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0019-show-then-ask.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0061-inventory-reports-only-what-it-can-see.md
  - wiki/decisions/0064-the-owner-fixes-design-principles-and-every-recommendation-says-what-it-rests-on.md
  - wiki/decisions/0065-new-shows-whole-directions-before-any-single-value.md
sources:
  - docs/plan/plan.json
  - plugins/design-assembly/references/layers.json
  - plugins/design-assembly/references/tiers.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/skills/adopt/SKILL.md
  - docs/trials/breadth-on-two-repositories.md
  - docs/trials/results.tsv
  - https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design
  - https://support.claude.com/en/articles/14604416-get-started-with-claude-design
  - https://www.anthropic.com/news/claude-design-anthropic-labs
  - https://claude.com/design
  - "https://github.com/google-labs-code/stitch-skills tại 4cf4db8e4143, giấy phép Apache-2.0, đọc ngày 2026-11-20, chỉ đọc, không chạy"
  - "hai phiên điều tra chỉ đọc ngày 2026-11-20: một về Claude Design, một về stitch-skills; mỗi phiên hai báo cáo"
  - "chủ repo, 2026-11-20: «Tổng hợp […] thành một khuyến nghị hoàn chỉnh cho Design Assembly với lý do rõ ràng.»"
  - "chủ repo, 2026-11-20: «Có, ghi vào wiki»"
  - "chủ repo, 2026-11-20: «Duyệt cả bốn», đáp câu «Duyệt bốn câu còn mở của đề bài 0007 theo khuyến nghị?»"
  - docs/trials/outside-tools-hands-on.md
  - "chủ repo, 2026-11-20: «Tôi muốn bạn có trải nghiệm thử dùng trên chính cả claude design và stitch-skills sau đó viết báo cáo đánh giá.»"
---

# 0007 Mở rộng ở ba chỗ — cửa vào, bề rộng của hệ, và ý đồ thiết kế tới tay tác tử

Máy viết ngày 2026-11-20 theo lời chủ repo, tổng hợp hai bản điều tra chỉ đọc: cách Claude Design giúp người dùng lập
design system, và bộ `stitch-skills` của Google Labs. Lúc viết, đây là một khuyến nghị chờ duyệt. Chủ repo đã đáp
cả năm câu hỏi ngày 2026-11-20 («Duyệt cả bốn» cho bốn câu đầu), và kế hoạch (`docs/plan/plan.json`) đổi theo như mục
Plan ghi. Chưa việc nào trong sáu việc được dựng. Các số liệu về kho này đọc trên `main` tại `b9fb8e9`.

## Intent

Giữ nguyên lõi của Design Assembly: người quyết có lý lẽ, máy giữ quyết định bằng lệnh kiểm. Mở rộng ở ba chỗ hành
trình của người dùng đang hở: cửa vào, bề rộng của hệ, và việc đưa ý đồ thiết kế tới tay tác tử. Hai bản điều tra đi
từ hai sản phẩm khác nhau và cùng dẫn tới ba chỗ này.

### Vì sao giữ lõi

- Claude Design lập design system bằng cách rút từ nguồn có sẵn (codebase, deck, tài sản thương hiệu), sinh một hệ,
  rồi người dùng bật «Published». Trang thiết lập không tả câu hỏi nào Claude đặt ra, cũng không tả bước chọn hướng.
  Hệ là một artifact trên claude.ai. Trang «Get started» ghi rõ chưa có lịch sử phiên bản.
- `stitch-skills` có 16 skill trong 3 plugin; 14 skill cần dịch vụ Stitch và khoá API. Design system của nó là một tệp
  văn xuôi `DESIGN.md` mà tác tử đọc rồi tin theo. Máy kiểm chỉ có hai bộ kiểm cú pháp.
- Cả hai không ghi ai đã quyết và không có lệnh kiểm trong code giữ quyết định sau khi chốt. Design Assembly có cả
  hai: `decide` ghi tên và ngày, cổng kiểm giữ từng dòng sổ (quyết định 0019, 0064).

Vì vậy đề bài này không đề nghị sinh hướng đi bằng mô hình, không lấy văn xuôi làm gốc, không dựa vào dịch vụ đám mây.

### Sáu việc, theo thứ tự nên làm

| #   | Việc                                                                 | Thuộc đâu trong kế hoạch                | Cỡ          |
| --- | -------------------------------------------------------------------- | --------------------------------------- | ----------- |
| 1   | Đưa nguyên tắc và hướng đi đã chốt vào trang luật cho tác tử         | Ngoài kế hoạch, hoặc phần đầu của 5.1   | Nhỏ         |
| 2   | Không để ngõ cụt ở cửa vào                                           | Một phần là 6.1                         | Vừa tới lớn |
| 3   | Cho đường `adopt` phần «studio»; dựng `change --migrate` và `--to`   | Mục để sang bên, đang ghi «giai đoạn 4» | Vừa         |
| 4   | Giai đoạn 5 như đã định, đưa `review` lên trước                      | Giai đoạn 5                             | Đã có       |
| 5   | Nền đủ mảng, nguồn thương hiệu, tầng linh kiện                       | Một giai đoạn mới                       | Lớn         |
| 6   | Xuất hệ ra ngoài repo; biết ai trả lời; đổi hướng hệ đã trưởng thành | Giai đoạn 6 và 7                        | Để sau      |

### Lý do của từng việc

1. **Ý đồ vào trang luật.** Hai bản điều tra cùng tìm ra điểm này, độc lập với nhau: Claude Design viết README nêu tên
   token, Stitch chép khối design vào từng lời nhắc. Hàm `rulesPage` trong `scripts/apply.mjs` không nhắc nguyên tắc
   hay hướng đi nào, dù nguyên tắc đã là dòng sổ (0064). Đây là việc rẻ nhất chạm thẳng mục tiêu «không phải đoán»;
   lần thử 11 còn 9 chỗ đoán (`docs/trials/results.tsv`).
2. **Cửa vào.** Trên hai repo thật ngoài sàn, `audit` ra 0/40 và `status` nói «nothing to run now»
   (`docs/trials/breadth-on-two-repositories.md`). `new` từ chối khi thiếu sàn. Người dùng không bắt đầu được thì các
   phần sau không có dịp chứng tỏ. Bước nhỏ nhất: `status` luôn kết bằng một bước kế, hoặc một câu nói thẳng vì sao
   plugin chưa phục vụ được repo này.
3. **`adopt` và `change`.** Repo đã có giá trị riêng buộc phải đi `adopt` (`skills/new/SKILL.md`, mục 0), mà skill
   `adopt` không nhắc nguyên tắc hay hướng đi lần nào. Vậy phần lớn repo thật không có nguyên tắc để các khuyến nghị
   dựa vào. Các repo ấy cũng kẹt giữa «biết lệch» và «hết lệch»: chưa có lệnh đưa giá trị viết vòng về hệ (dòng giới
   hạn `change-to-and-migrate-not-built`). Kế hoạch để việc này sang bên «cho giai đoạn 4», nhưng giai đoạn 4 không
   có mục nào mang nó.
4. **Giai đoạn 5.** `review` nên đi trước vì cổng xanh chưa có nghĩa là màn ổn. `brief` có thể mượn lối hỏi của loại
   Design trong Claude Design: một lượt, tối đa bốn câu, mỗi lựa chọn là một hướng cụ thể, khuyến nghị đứng đầu. Tầng
   nội dung (`content`, chưa dựng) nên đọc từ `ontology/glossary.md` thay vì hỏi lại.
5. **Nền đủ mảng.** Tầng nền có năm lựa chọn: màu gốc, thang chữ, tỉ lệ chữ, đơn vị khoảng cách, bo góc
   (`references/layers.json`). Skill `new` phải dặn trước rằng cả theme sẽ không đổi theo màu của người dùng. Việc này
   xếp sau giai đoạn 5 vì nó lớn, và lượt thử ở mục 5.4 sẽ cho biết mảng nào gây đoán nhiều nhất. Nên bắt đầu bằng
   kiểu chữ và các vai màu còn lại, vì font và logo thương hiệu hiện không có chỗ vào; nguồn thương hiệu ghi vào sổ
   nguồn ngoài đã có (0057). Độ nổi, chuyển động và mật độ chỉ làm khi một lượt thử chỉ ra. Tầng linh kiện
   (`components`, chưa dựng) cần một điểm dừng trong `new` để chủ repo duyệt bộ lõi, ghép từ `starter.json` và
   `intake`.
6. **Để sau.** Xuất sang dạng của Claude Design đáng làm vì hệ hiện chỉ sống trong repo. Nhưng trang riêng
   claude.ai/design đóng ngày 2026-12-14 và tính năng design system còn beta, nên chờ định dạng ổn. Ba dòng giới hạn
   mức nặng về người trả lời (`decide-cannot-tell-who-wrote-the-answers`, `owner-calls-trusts-a-written-answer`,
   `escapes-ledger-unenforced`) hợp với giai đoạn 7, khi có nhiều repo và nhiều người.

### Ngoài phạm vi

- Vòng tự dựng cả website, video, React Native, đẩy lên Stitch: đó là việc dựng sản phẩm.
- Sinh hướng đi bằng mô hình: chủ repo đã chốt danh mục đóng (dòng `directions-from-a-closed-catalog`).
- Đọc hoặc xuất `DESIGN.md` lúc này: chưa ai kiểm được đặc tả của nó. Bỏ ngày 2026-11-23: đặc tả nay có bộ kiểm,
  chủ repo duyệt câu hỏi 6 của [0014](0014-outside-plugs-set-up-in-one-sitting.md).
- Phục vụ tác tử ngoài Claude Code.

### Độ tin

- Đã kiểm trên `main` tại `b9fb8e9`: các tầng đã dựng và chưa dựng, năm lựa chọn của nền, số liệu sổ giới hạn (219 mở,
  19 mở mức nặng), các mục kế hoạch, bảng đo trên hai repo thật.
- Đã cho đọc lại bốn trang của Anthropic kê ở phần nguồn; đầu nhánh, giấy phép và số skill của `stitch-skills` đọc qua
  GitHub.
- Đã thử tay ngày 2026-11-20, sau khi đề bài này viết xong: lập hệ, dựng màn theo đề chuẩn, đổi một quyết định và
  phạm một luật, trên Claude Design và trên bốn skill không cần khoá của `stitch-skills`. Kết quả ở
  [trang đo](../../docs/trials/outside-tools-hands-on.md). Lần thử không lật nhận định nào ở trên; nó thêm hai điều:
  bản chép của hệ ở cả hai công cụ không đổi theo khi hệ đổi, và hai cặp màu của ứng dụng mẫu đo được dưới 4,5:1.
- Chưa thử: dịch vụ Stitch (12 trên 16 skill), lối dựng linh kiện thật và `/design-sync` của Claude Design. Hai bộ
  kiểm của `stitch-skills` mới được đọc mã, chưa chạy.
- `new` sau giai đoạn 4 chưa có lượt thử độc lập nào.

## Acceptance criteria

Đề bài này là khuyến nghị về thứ tự. Tiêu chí dưới đây chỉ cho ba việc đầu; việc 4 đã có tiêu chí ở kế hoạch, việc 5
và 6 cần đề bài riêng khi tới lượt.

1. Trang luật do plugin sinh có mỗi nguyên tắc và hướng đi chủ repo đã chốt, mỗi điều một dòng; một bài kiểm đỏ khi sổ
   có nguyên tắc mà trang luật không có.
2. Trên một bản sao của repo ngoài sàn, `status` kết bằng một bước kế chạy được, hoặc một câu nêu điều kiện còn thiếu;
   không còn «nothing to run now».
3. `adopt` hỏi nguyên tắc mà không đổi giá trị nào của repo; một bài kiểm cho thấy stylesheet không đổi sau lượt hỏi.
4. `change --migrate` đưa một giá trị viết vòng về giá trị của hệ trên một bản sao, và cổng xanh sau đó.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Đề bài này tự nó không đổi hợp đồng sổ. Việc 5 sẽ thêm
lựa chọn vào tầng nền và dựng hai tầng mới; hình dạng của chúng thuộc đề bài riêng.

## Plan

Lúc viết, máy đề nghị năm điều dưới đây. Sau lời «Duyệt cả bốn» ngày 2026-11-20, kế hoạch đã đổi theo bốn lời đáp:

- việc 1 thành mục 5.5 của giai đoạn 5 (câu 3);
- mục để sang bên của `change --migrate` và `--to` dời từ giai đoạn 4 sang giai đoạn 5 (câu 2; giai đoạn 4 đã đóng
  trước khi câu này được đáp);
- việc 5 thành giai đoạn 9 «Nền đủ mảng», đứng sau giai đoạn 5 (câu 4);
- cửa vào cho repo không có sàn ghi ở mục để sang bên, chờ giai đoạn 6 (câu 1).

Điều 3 và điều 5 dưới đây chưa được hỏi thành câu, nên chưa vào kế hoạch.

1. Việc 1 làm ngay sau mục 4.5, một PR.
2. Chốt chỗ của `change --migrate` và `--to`: thành mục 4.6, hoặc dời mục để sang bên sang giai đoạn 5, trước khi đóng
   giai đoạn 4.
3. Việc 2 và phần `adopt` của việc 3 vào giai đoạn 5, cạnh `brief` và `review`.
4. Việc 5 thành một giai đoạn mới sau giai đoạn 5, có đề bài riêng.
5. Việc 6 ghi vào mục để sang bên cho giai đoạn 6 và 7.

## Test plan

Mỗi việc đo trên bản sao bỏ đi, không trên repo thật. Việc 1 đo lại bằng một lượt thử vai dựng màn, so số chỗ đoán với
lần 11; lượt thử tốn token nên hỏi chủ repo trước mỗi lần. Việc 2 đo lại trên bản sao của hai repo ở
`docs/trials/breadth-on-two-repositories.md`.

## Autonomy tier

Máy chỉ dựng sau khi chủ repo duyệt đề bài và trả lời các câu hỏi dưới đây; mỗi việc một PR, gộp là lời của chủ repo.
Áp bất cứ điều gì lên một repo thật cần chủ repo cho phép riêng. Tạo artifact trên tài khoản của chủ repo, hay gọi một
dịch vụ ngoài, không nằm trong đề bài này.

## Open questions

Mỗi câu kèm một khuyến nghị. Chủ repo đáp cả năm ngày 2026-11-20: câu 5 bằng việc cho thử, bốn câu đầu theo khuyến
nghị («Duyệt cả bốn»).

1. **Repo không có sàn: từ chối, tự đặt sàn tối thiểu, hay phục vụ ở mức «Chỉ luật»?** Khuyến nghị: phục vụ ở mức
   «Chỉ luật» và nói rõ điều còn thiếu để lên mức kế, vì cách này không ghi gì vào repo của người khác. Đề bài 0001
   còn để mở câu này. Đã nhận: phục vụ ở mức «Chỉ luật».
2. **`change --migrate` và `--to` thành mục 4.6, hay dời sang giai đoạn 5?** Khuyến nghị: dời sang giai đoạn 5, để
   giai đoạn 4 đóng theo hai dòng «done when» đã có. Đã nhận: dời sang giai đoạn 5.
3. **Việc 1 làm ngay ngoài kế hoạch, hay chờ `brief`?** Khuyến nghị: làm ngay, vì nó nhỏ và `brief` sẽ dùng lại.
   Đã nhận: làm ngay; ghi thành mục 5.5 để kế hoạch còn là một nguồn.
4. **Nền đủ mảng có thành một giai đoạn mới không?** Khuyến nghị: có, sau giai đoạn 5, bắt đầu bằng kiểu chữ và các
   vai màu còn lại. Đã nhận: giai đoạn 9.
5. **Có thử tay một lần với Claude Design không?** Việc đó tạo artifact trên tài khoản của chủ repo. Khuyến nghị: có,
   một lần, trước khi viết đề bài cho việc 6. Đã thử ngày 2026-11-20 theo lời chủ repo, trên cả Claude Design lẫn
   `stitch-skills` ở mức không khoá; xem [trang đo](../../docs/trials/outside-tools-hands-on.md).
