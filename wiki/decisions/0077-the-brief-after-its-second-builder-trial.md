---
type: decision
title: "Phiếu brief sau lượt thử thứ hai: ba lựa chọn lặng lẽ có chỗ, một câu cho một việc, sổ giới hạn không kể lượt thử"
links:
  - wiki/specs/0010-the-screen-brief.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0074-the-brief-is-twelve-slots-each-read-or-said-open.md
  - wiki/decisions/0075-an-open-slot-gives-its-question-and-an-answer-settles-it.md
  - wiki/decisions/0076-the-brief-after-its-first-builder-trial.md
sources:
  - docs/trials/screen-trial-13-after-the-fixes.md
  - docs/trials/screen-trial-12-with-the-brief.md
  - plugins/design-assembly/scripts/brief.mjs
  - plugins/design-assembly/scripts/brief-slots.mjs
  - plugins/design-assembly/scripts/brief-readers.mjs
  - plugins/design-assembly/scripts/brief-sheet.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-actions.mjs
  - plugins/design-assembly/templates/owned/row-actions.tsx.template
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/brief/SKILL.md
  - plugins/design-assembly/tests/test-brief-trial-13.mjs
  - "chủ repo, 2026-11-21: «Chưa đạt, sửa tiếp», đáp câu «Đi hướng nào với dòng «xong khi» của giai đoạn 5 sau lượt thử 13?»"
---

# 0077 Phiếu brief sau lượt thử thứ hai: ba lựa chọn lặng lẽ có chỗ, một câu cho một việc, sổ giới hạn không kể lượt thử

## Status

Accepted, 2026-11-21. Phần sửa của mục 5.7. Plugin lên 0.26.0. Mục 5.7 chưa xong: nó chỉ xong khi lượt thử thứ ba đã
chạy, và lượt ấy cần lời chủ repo. **Câu trả lời `--json` của `brief` thêm khoá, không bỏ và không đổi nghĩa khoá nào.**
Mười hai ô, ba trạng thái, `--queue`, ba mã thoát và lời phiếu nói các ô không giữ mọi câu hỏi giữ nguyên.

## Context

Lượt thử 13 ([`screen-trial-13-after-the-fixes.md`](../../docs/trials/screen-trial-13-after-the-fixes.md)) đếm 14 chỗ
phải đoán, 11 vào hàng chờ và 3 tự quyết lặng lẽ. Chủ repo coi dòng «xong khi» của giai đoạn 5 là chưa đạt và chọn
«Chưa đạt, sửa tiếp». Lượt ấy để lại ba điều. Ba chỗ lặng lẽ (dòng 20, 21, 22 của bảng đếm) là ba loại lựa chọn không
phần nào của phiếu chỉ tới. Phiếu xếp 10 câu cho 4 việc, vì câu nguyên tắc và câu của một thay đổi mô hình được hỏi lại
trên phiếu của mỗi màn. Và phép đo có lỗ: phiếu in các dòng sổ giới hạn còn mở của vùng mình, mà hai dòng kể điều tác tử
lượt 12 đã làm, nên tác tử lượt 13 đọc được kết quả lượt trước qua chính đầu ra của plugin.

## Decision

1. **Nút trên toast có tính vào cột `actions`, và trang nói điều cổng không phân biệt được.** Phép kiểm màn và hành động
   của cổng (`screen-actions.mjs`) coi mọi tên trong `actions` là «một nút cho hành động ấy», và kiểm rằng một vai mở
   màn được chạy nó; nó chỉ đọc dòng sổ màn, không đọc mã. Trang luật nay nói đúng điều ấy: nút một người bấm trên màn,
   kể cả nút của toast mà màn bật lên (như nút hoàn tác), là một nút cho hành động, nên ghi hành động ấy vào `actions`
   để cổng kiểm ai mở màn được chạy nó. Trang cũng nói cổng không phân biệt nút trên toast với nút vẽ trên màn, nên hành
   động chỉ có nút trên toast vẫn cần một nút của riêng nó, ở màn này hay màn khác. Ô 3 của phiếu đưa dòng ấy, đọc từ
   trang luật kèm số dòng. Trang chưa có dòng ấy (kho chưa chép lại trang) thì phiếu nêu lựa chọn này thành một chỗ ngoài
   ô, gần ô 3. Chọn «có tính» vì đó là nghĩa phép kiểm đang dùng (người bấm nút trên toast cũng phải được chạy hành
   động), và là cách cả hai tác tử lượt 12 và 13 đã chọn.
2. **Tên đọc của từng nút trong «⋯» là lựa chọn của màn, và phiếu nói chỗ nó nấp.** Linh kiện sàn đưa,
   `RowActions`, nhận `name`, `pending`, `busyName`, `ref`: tên của nút «⋯», của danh sách, và của nút lúc đang chờ;
   không thuộc tính nào đặt tên cho một nút bên trong. Trang luật nay nói linh kiện không nhận tên cho từng hành động:
   mỗi nút là nút của màn, nằm trong danh sách mang tên `name`, và tên đọc của nó là chữ của chính nó, màn chọn từ nơi
   giữ chữ của repo; trang nào không nói thì hỏi. Phiếu nêu một chỗ ngoài ô, gần ô 5, khi sổ linh kiện có linh kiện có
   thuộc tính `busyName` và dòng sổ màn có từ hai hành động trở lên, đọc từ sổ linh kiện.
3. **Chữ của trạng thái chờ khi nút không hiện chữ: hai luật chọi nhau, và phiếu đưa câu hỏi cho chủ repo.** Một luật:
   trạng thái được liệt kê với chữ nó đặt lên trang, và bài kiểm trình duyệt chờ chữ ấy. Luật kia: `RowActions` chỉ nói
   đang chờ bằng `busyName`, một tên trình đọc màn hình nghe được mà không đặt chữ nào lên trang. Phiên này **không chọn
   luật nào thắng**, vì chọn là đổi linh kiện sàn hoặc đổi điều bài kiểm đòi. Trang luật nói hai luật gặp nhau ở đó, lựa
   chọn là của chủ repo, và đừng liệt kê trạng thái ấy bằng chữ trang đã hiện từ trước (như tên dòng). Phiếu nêu một chỗ
   gần ô 4 mang câu hỏi riêng của nó, `row-waiting-state-words`, một câu cho cả repo, kèm lời gọi `decide --ask`; khi
   câu đã chờ hay đã có lời đáp, phiếu của mọi màn nói vậy thay cho lời gọi. Khuyến nghị: để trạng thái chờ ấy ra khỏi
   danh sách trạng thái của màn tới khi chủ repo đáp, và nói trong mô tả thay đổi; một trạng thái liệt kê bằng chữ trang
   đã hiện thì qua bài kiểm trước khi tới nơi, và không chứng gì. Bảng trạng thái không đòi trạng thái chờ, nên cổng
   không đỏ vì khuyến nghị ấy.
4. **Một câu cho một việc phải quyết.** Hàng chờ thêm loại mục `screens:`, cho một ô được hỏi một lần cho mọi màn nó liên
   quan: `screens:principles` cho nguyên tắc và hướng đi, và `screens:model-changes:NAMES` cho một thay đổi mô hình,
   `NAMES` là các tên nó nói tới (điều nhánh viết, hay điều dòng sổ màn nêu mà mô hình thiếu), xếp thứ tự và nối bằng
   `+`. Với ô 10, bộ tên là của cả nhóm màn: tên của màn này, cộng tên của mọi màn khác trong sổ có chung một tên với
   nhóm, lặp tới khi không thêm màn nào; lời câu hỏi nói điều phiếu đọc được của cả nhóm. Nên câu ấy không nêu tên một màn
   nào, và màn nào xếp trước cũng viết cùng một câu, từng byte. Phiếu của mỗi màn đọc nó như câu của ô mình: câu có đúng
   mục ấy, hoặc câu có các tên chứa mọi tên của nhóm.
5. **Viết thêm tên sau khi đã xếp câu chung thì chủ repo vẫn chỉ có một câu.** Đây là thứ tự mà cả hai tác tử lượt thử
   đã làm: chạy phiếu, đổi mô hình, chạy lại. Câu đang chờ chỉ nói về một phần tên của nhóm thì phiếu hỏi một câu mới
   về mọi tên, và câu mới ghi nó **thay** câu cũ (khoá `replaces` của hàng chờ, cờ `--replaces` của `decide --ask`).
   Lời câu hỏi nêu câu nó thay và các tên mới thêm. Tệp của câu cũ giữ nguyên, không bị ghi đè. Lệnh `decide` để câu cũ
   ra khỏi danh sách đang chờ, liệt kê nó dưới `replaced`, và không nhận lời đáp cho nó. Câu cũ đã có lời đáp thì
   **không bao giờ bị thay**: phiếu nói lời đáp ấy phủ những tên nào («For Item.archived, archiveItem: the owner
   kept …»), rồi chỉ hỏi phần tên còn lại. Lời đáp về hai tên không bao giờ được đọc như lời đáp về ba. Ô chỉ «đã định»
   khi các lời đáp phủ hết mọi tên. `decide --ask` từ chối thay một câu không có, đã có lời đáp, là quyền, hoặc đã bị
   thay. Kho có công cụ trước 0.26.0 không bao giờ nhận khoá ấy, vì phiếu chỉ hỏi câu chung ở kho đọc được nó. Ô 10 chỉ thành câu chung khi dòng sổ màn không thiếu khoá
   nào; thiếu khoá thì đó là việc của riêng màn. Câu cũ dưới mục `screen:<mã màn>:<ô>` vẫn được đọc, cho đúng màn ấy.
   Ô 11 và ô 12 vẫn là câu của từng màn, vì chúng nói về chính màn đó.
6. **Kho có công cụ cũ vẫn chạy như trước.** Cổng của một kho có công cụ trước 0.26.0 đọc mục `screens:` là hỏng, và
   hàng chờ của nó sẽ không đọc được. Nên phiếu đọc tem công cụ: không có tem, hoặc tem 0.26.0 trở lên, thì hỏi câu
   chung; tem cũ hơn, hoặc tem không đọc được (một thư mục, một tệp không phải JSON), thì hỏi dưới mục của từng màn như
   trước. Phiếu vẫn ra ở cả ba trường hợp, có bài kiểm.
7. **Phần «điều phiếu không thấy» không còn kể lượt thử.** Mọi dòng còn mở của các vùng phiếu và hồ sơ in ra (`brief`,
   `review`, `document`) được viết lại thành điều plugin không làm được, không nêu lượt thử nào và không kể tác tử đã làm
   gì. Lượt thử chỉ đứng ở `where` của dòng và trong wiki. Hai dòng của `review` mất phần «trong lượt thử của quyết định
   0073»; `brief-not-tried-by-a-builder` và `brief-sheet-narrows-what-the-builder-asks` không còn kể số chỗ hay câu hỏi
   của lượt 12 và 13. Không dòng nào bị xoá. Một bài kiểm đỏ khi lời ghi của một dòng như vậy nêu lượt thử, nói tác tử đã
   hỏi, quyết, liệt kê, chọn, viết hay đếm gì, hoặc nêu «chỗ phải đoán»; một bài khác chạy phiếu thật, ở bản in cho người
   và trên trang, và kiểm phần ấy cùng cách. Mã định danh của dòng (như `brief-settled-by-rows-the-builder-wrote`) không
   bị kiểm: nó là tên cố định của dòng, các trang khác dẫn tới nó.

## Consequences

- Mười sáu bài kiểm mới trong `tests/test-brief-trial-13.mjs`, viết trước; mười một bài đỏ trước khi có mã, và bài thứ mười bốn (thứ tự xếp) đỏ trước sửa của lượt soát. Hai bài xanh
  từ đầu là bài canh điều phải giữ: bản sao đúng tình huống lượt 13, và cùng phiếu ở hai ngày, từng byte. Kho nháp dựng
  đúng tình huống của lượt: nhánh `main` có màn đã dựng, một màn thứ hai cho thấy cùng bản ghi, trang luật do plugin
  viết và `RowActions` trong sổ linh kiện; trên nhánh, tác tử thêm một trường và hai hành động, khai màn mới với ba nút,
  một trong đó chỉ có nút trên toast.
- **Số câu xếp, trong tình huống của lượt 13:** mã cũ (0.25.1) xếp 10 câu cho ba phiếu, như lượt thử; mã mới xếp 6. Câu
  nguyên tắc một lần thay vì ba, câu của thay đổi mô hình một lần thay vì ba, câu vị trí của màn mới một lần, và câu ô 12
  một lần cho mỗi màn. Lượt thử đếm 10 câu là 4 việc; cách đếm ấy gộp ba câu ô 12 làm một, phiên này không gộp, vì mỗi
  câu hỏi một màn có đổi không.
- Sổ giới hạn: đóng `brief-queues-a-question-per-screen` và `trial-builder-reads-findings-through-the-sheet`. Thu hẹp và
  giữ mở: `screen-actions-toast-button-unsaid` (còn: cổng không phân biệt nút trên toast, nên luật «toast không bao giờ
  là lối duy nhất» không phép kiểm nào giữ), `spoken-only-state-unlisted` và `state-words-present-before-the-state`
  (còn: tới khi chủ repo đáp, trạng thái chỉ nghe được vẫn không liệt kê được, và dòng mới của trang luật không phép
  kiểm nào giữ), `brief-settled-by-rows-the-builder-wrote`, `brief-asks-through-an-older-tool` (thêm phần lùi về câu của
  từng màn). `brief-sheet-narrows-what-the-builder-asks` viết lại và giữ mở: **chỉ lượt thử thứ ba đóng được**, vì bài
  kiểm chứng phiếu nói gì, không chứng tác tử có hỏi ba lựa chọn ấy không.
- Mã mẫu chép vào repo đổi ở một tệp: `waiting.mjs` thêm loại mục `screens:`. Kho này nhận bản mới qua
  `make design-apply`; trang luật của kho có thêm ba câu.
- **Điều cần chủ repo nhìn lại**, vì đề bài 0010 không nói:
  - Điểm 1: phiên này chọn «nút trên toast có tính», theo nghĩa phép kiểm đang dùng. Cách ngược lại («chỉ tính nút vẽ
    trên màn») làm cổng không kiểm ai được bấm nút hoàn tác.
  - Điểm 3: hai luật vẫn chọi nhau. Phiên này khuyến nghị chủ repo chốt bằng cách cho `RowActions` đặt `busyName` lên
    trang dưới dạng chữ chỉ trình đọc màn hình đọc, đúng như nút xoá của màn mẫu đã làm (`LABELS.saving` trong
    `src/example/ReferenceScreen.tsx`). Khi ấy trạng thái chờ có chữ của riêng nó, vắng trước khi tới, và hai dòng giới
    hạn của trạng thái chỉ nghe được thu hẹp thêm. Việc ấy đổi một linh kiện sàn: kho đã nhận linh kiện giữ bản cũ.
  - Điểm 4 và 5: câu chung cho ô 10 được khoá theo bộ tên của cả nhóm màn. Viết thêm tên thì câu mới thay câu đang chờ;
    câu đã có lời đáp thì không thay, và câu mới chỉ hỏi phần tên còn lại. Chủ repo đã đáp phần đầu thì có hai lời
    đáp cho một thay đổi mô hình, mỗi lời một phần tên.
- Một lượt soát mã độc lập, chỉ được đưa mã và ý định, nêu năm điểm. Ba điểm đã sửa, mỗi điểm có bài kiểm thấy đỏ
  trước: câu chung của ô 10 tuỳ màn nào xếp trước khi các màn có bộ tên khác nhau (nay khoá theo cả nhóm, điểm 4); kho
  không có tem mà có bản chép công cụ bị coi là công cụ mới (nay phiếu nhận bản chép theo nội dung, không nhận ra thì
  coi là cũ); và bộ đọc mục của cổng sập với một mục như `constructor:x`, lỗi có từ trước (nay từ chối). Một điểm ghi
  vào sổ giới hạn chứ không sửa: hai chỗ của nút «⋯» hiện trên mọi màn có từ hai hành động, vì dòng sổ màn không nói
  hành động nào là của dòng; lời của hai chỗ ấy đã nói có điều kiện («nếu các hành động của dòng nằm sau …»), ghi ở
  `brief-components-not-chosen-for-the-screen`. Một điểm giữ nguyên: chỗ tên đọc của từng nút không mang câu hỏi riêng,
  vì chữ của từng nút là việc của từng màn.
- Một lượt soát độc lập thứ hai trên PR, chủ repo cho gửi sửa («Có, gửi sửa»), chỉ ra điều điểm 5 sửa: trước đó, viết
  thêm một tên làm câu chung bị hỏi lại thành câu thứ hai. Ba bài kiểm mới dựng đúng thứ tự ấy, mỗi bài đỏ trước khi có
  mã: thêm tên khi câu cũ còn chờ; thêm tên khi chủ repo đã đáp câu cũ; và `--replaces` bị từ chối khi không thay được.
  Lệnh `decide --json` thêm khoá `replaced`.
- Chỉ lượt thử thứ ba nói được: tác tử có hỏi ba lựa chọn ấy thay vì tự quyết không; hàng chờ có ít câu lặp hơn không;
  và số chỗ phải đoán có tăng so với lượt 13 không. Lượt ấy chạy trên bản plugin không còn in kết quả của lượt trước.
