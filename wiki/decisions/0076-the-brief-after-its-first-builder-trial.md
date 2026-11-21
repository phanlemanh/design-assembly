---
type: decision
title: "Phiếu brief sau lượt thử đầu: nói điều ô không giữ, so với nhánh chính, khuyến nghị theo điều đọc được"
links:
  - wiki/specs/0010-the-screen-brief.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0074-the-brief-is-twelve-slots-each-read-or-said-open.md
  - wiki/decisions/0075-an-open-slot-gives-its-question-and-an-answer-settles-it.md
  - wiki/decisions/0054-the-decision-ledger-stands-in-for-the-head-of-design.md
sources:
  - docs/trials/screen-trial-12-with-the-brief.md
  - plugins/design-assembly/scripts/brief.mjs
  - plugins/design-assembly/scripts/brief-branch.mjs
  - plugins/design-assembly/scripts/brief-slots.mjs
  - plugins/design-assembly/scripts/brief-readers.mjs
  - plugins/design-assembly/scripts/brief-sheet.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/templates/tools/design-assembly/owner-calls.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-actions.mjs
  - plugins/design-assembly/references/brief-slots.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/brief/SKILL.md
  - plugins/design-assembly/tests/test-brief-trial-12.mjs
  - plugins/design-assembly/tests/helpers/brief-repo.mjs
  - "chủ repo, 2026-11-21: «Sửa rồi chạy lại», đáp câu «Đi hướng nào với dòng «xong khi» của giai đoạn 5?»"
---

# 0076 Phiếu brief sau lượt thử đầu: nói điều ô không giữ, so với nhánh chính, khuyến nghị theo điều đọc được

## Status

Accepted, 2026-11-21. Phần sửa của mục 5.6. Plugin lên 0.25.0. Mục 5.6 chưa xong: nó chỉ xong khi lượt thử thứ hai đã
chạy, và lượt ấy cần lời chủ repo. **Câu trả lời `--json` của `brief` thêm khoá, không bỏ và không đổi nghĩa khoá
nào.** Mười hai ô, ba trạng thái, `--queue`, loại mục `screen:<mã màn>:<ô>` và ba mã thoát giữ nguyên.

## Context

Lượt thử 12 ([`screen-trial-12-with-the-brief.md`](../../docs/trials/screen-trial-12-with-the-brief.md)) là lần đầu một
tác tử độc lập dựng màn có phiếu `brief`. Nó đếm 11 chỗ phải đoán so với 9 của lần 11, và chỉ 2 chỗ vào hàng chờ so với 6. Tác tử xếp đúng ba ô còn mở rồi không hỏi thêm câu nào của riêng nó. Chủ repo coi dòng «xong khi» của giai đoạn 5 là
chưa đạt, rồi chọn «Sửa rồi chạy lại». Lượt thử chỉ ra năm điều ở lệnh, mỗi điều là một dòng của sổ giới hạn; một lượt
soát trước đó để lại điều thứ sáu ở `decide --ask`.

## Decision

1. **Phiếu nói thẳng rằng mười hai ô không phải mọi câu hỏi của màn.** Câu ấy đứng ở cả ba dạng: mục «beyond the twelve
   slots» của bản in cho người, khoá `beyond` của `--json` (`note`, `ask`, `call`, `places`), và phần «điều phiếu không
   thấy» cùng bước kế của tài liệu. Nó kèm lời gọi `decide --ask` cho một lựa chọn bất kỳ, và nhắc lại ngay ở chỗ
   `--queue` báo đã ghi gì: các câu vừa xếp là câu của các ô, không hơn. Trang luật thêm đoạn thứ hai sau đoạn trỏ tới
   phiếu, nói cùng điều ấy và trỏ về mục «Questions only the owner answers» khi trang có mục đó. **Không thêm ô thứ mười
   ba:** danh sách ô là danh sách đóng, thêm bớt là lời chủ repo.
2. **Phiếu nêu «chỗ» mà lựa chọn ngoài ô hay nấp, đọc từ repo, không bịa.** Ba chỗ, mỗi chỗ chỉ hiện khi repo cho thấy:
   việc của chính màn này (trang kiểu màn chỉ nói việc của màn mẫu); kiểu dáng của một nút hay ô nhập (sổ linh kiện có
   linh kiện nhiều hơn một kiểu dáng); tên trong mã và chữ người đọc của một khái niệm mới với mô hình dữ liệu, khi
   không nơi giữ chữ nào của repo nêu nó (bảng thuật ngữ, và các tệp mà dòng lớp nội dung của sổ quyết định gọi tên).
   Sáu trong chín chỗ tác tử lần 12 tự quyết lặng lẽ rơi vào ba chỗ này hoặc vào ô 10 ở điểm 4; ba chỗ còn lại (dữ liệu
   mẫu, tên đọc của nút, trạng thái chờ không có chữ) phiếu chỉ nói chung, vì không sổ nào để đọc.
3. **Nền để phân biệt «repo đã định» với «nhánh vừa viết» là nơi nhánh rời nhánh chính.** Đó là điểm mà hai phép kiểm
   `decision-sheet` và `owner-calls` của cổng đã so. Phần tìm điểm ấy được tách khỏi `branchFacts` thành `branchBase`
   (`owner-calls.mjs`), để cổng và phiếu dùng chung một luật; phiếu gọi nó với `fetch: false`, nên không bao giờ ra
   mạng. `scripts/brief-branch.mjs` đọc mô hình dữ liệu và sổ màn ở điểm ấy bằng hai lời gọi git, rồi đặt cạnh cây làm
   việc, kể cả phần chưa commit. Bộ đọc mô hình nhận tệp theo đường dẫn (`modelOfFiles`), dùng chung cho đĩa và cho
   một commit.
4. **Ô 10 mở khi chính nhánh đã viết vào mô hình dữ liệu cho màn.** Hành động màn nêu hoặc thuộc thực thể màn cho thấy,
   thực thể màn cho thấy, và trường của thực thể ấy: thêm, đổi hay bỏ đều được nêu tên. Câu hỏi nói từng tên và hình
   dạng; khuyến nghị cho trường hợp này là lời riêng trong danh mục (`ask.cases.written`): giữ điều đã viết tới khi
   chủ repo đáp, nêu tên và hình dạng trong mô tả thay đổi, và nói đã chọn hình dạng nào nếu có hai. Khi nhánh chính đã
   có điều ấy thì ô lại «đã định».
5. **Dòng đọc từ điều nhánh vừa viết được đánh dấu, ô vẫn «đã định».** Nguồn của dòng mang `branch` (`new` hoặc
   `changed`) và bản in ghi «written on this branch»; ô mang `written_on_branch`, tóm tắt đếm `settled_on_branch`. Áp
   cho dòng của sổ màn (kiểu, cho thấy gì, thao tác, trạng thái, tiêu đề) và cho hành động, trường của mô hình. Các ô
   ấy **không mở**, vì ba lẽ: dòng sổ màn là nơi chính khuyến nghị của danh mục bảo tác tử ghi câu trả lời, nên mở ô
   vì dòng vừa được ghi là vòng lặp; màn chưa dựng luôn được khai trên nhánh, nên mọi màn mới sẽ thêm bốn câu hỏi mà
   khuyến nghị chỉ là «giữ điều dòng nói»; và dòng ấy dịch từ đề của chủ repo, được cổng so với bảng trạng thái và mô
   hình. Mô hình dữ liệu thì khác: thêm vào đó là tạo khái niệm, điều trang luật đã bắt một người soát.
6. **Không so được thì vẫn có phiếu, và phiếu nói điều không so được.** Không phải kho git, chưa có commit, git không
   biết nhánh chính nào, bản checkout nông: `branch.compared` là `false` kèm `why`, dòng thứ ba của bản in và ô 10 nói
   rằng điều vừa viết cho màn đọc ra như của repo. Đứng ngay trên nhánh chính, hoặc chưa commit gì quá nó: chỉ phần
   chưa commit được so, và phiếu nói vậy.
7. **Ô 12 khuyến nghị theo điều phiếu đọc được.** Phép đo nêu màn nào dùng chung thực thể hay hành động với màn này, và
   nhìn vào đâu: hành động của mô hình trên bản ghi màn cho thấy mà không màn nào của sổ có nút, đúng theo luật
   `unoffered` của phép kiểm màn và hành động của cổng; và hành động màn này mang tới trên bản ghi mà màn khác cũng cho
   thấy. Có màn dùng chung thì khuyến nghị là lời `ask.cases.look`: đừng coi là không màn nào đổi, xem từng màn được
   nêu, đổi màn nào buộc phải đổi trong cùng thay đổi, sau khi chạy phiếu của màn ấy. Chỉ khi không màn nào dùng chung
   gì thì khuyến nghị cũ, «không đổi màn nào khác», mới đứng.
8. **Phiếu chạy lại sau khi dựng đặt câu đang chờ cạnh điều đang đứng trong repo.** Câu đang chờ mang `against` (điều
   đi ngược khuyến nghị) và `now` (điều đang đứng cạnh khuyến nghị mà phiếu không phán được, vì khuyến nghị viết bằng lời khác). Cả hai là điều nhánh mang so với nhánh chính, bất kể câu hỏi được xếp lúc nào. Ô mà
   repo nay đã định trong khi câu hỏi về nó vẫn chờ thì mang câu ấy ở `waits`. Hai ô đọc được: ô 12 (nhánh đã đổi dòng
   sổ màn hoặc tệp vẽ của màn khác, trong khi khuyến nghị là không đổi màn nào) và ô 11 (màn không đứng cuối danh sách
   màn, trong khi khuyến nghị là đứng cuối). `summary.against` đếm, bản in nói ở dòng tóm tắt, tài liệu nêu thành một
   phát hiện. Không gì đỏ vì nó: đây là lời báo, không phải cổng.
9. **Ô 1 không còn đưa việc của màn mẫu lên như việc của màn này.** Dòng nói rõ câu ấy là của màn mẫu, kèm tệp, và rằng
   không trang nào nói việc của màn này; chỉ với chính màn mẫu thì nó là «của màn này». `kind.task_of` nêu màn mà câu ấy
   nói về.
10. **`decide --ask` từ chối mục `screen:<mã màn>:<ô>` khi sổ màn không có màn ấy,** nêu các màn sổ có, và không ghi
    gì; repo không có sổ màn cũng bị từ chối như vậy. Mục loại khác không bị tra.

## Consequences

- Mười lăm bài kiểm mới trong `tests/test-brief-trial-12.mjs`, viết trước; mười hai bài thấy đỏ trước khi có mã, ba bài
  xanh từ đầu là bài canh điều phải giữ (cùng phiếu ở hai ngày, khuyến nghị cũ khi không màn nào dùng chung, đích là
  thư mục con của một kho git lớn). Mỗi bài dựng đúng tình huống của lượt thử trên kho nháp có nhánh `main` và nhánh
  làm việc: tác tử đã thêm một trường và hai hành động rồi mới khai màn; màn không chạy được nếu màn khác không đổi;
  phiếu đã xếp hết ô mở vẫn phải bảo hỏi điều ô không giữ. Sáu chỗ của bài kiểm cũ đổi theo hợp đồng mới: hai chỗ so
  nguyên `summary`, một chỗ so nguyên `asked`, hai chỗ «bản in không có `--ask`» nay chỉ xét phần của các ô, và chỗ
  so trang luật có thêm đoạn thứ hai.
- Sổ giới hạn: đóng `brief-touched-screens-recommends-no-change` và `brief-kind-job-read-as-the-screens`; thêm rồi đóng
  `decide-ask-takes-a-screen-the-ledger-lacks`; thu hẹp ba dòng và giữ mở. `brief-settled-by-rows-the-builder-wrote`
  còn: các ô đọc từ dòng sổ màn chỉ được đánh dấu, không git thì không so, cùng một thay đổi mở ô 10 trên phiếu của mọi
  màn cho thấy bản ghi ấy, và ô đã hỏi một lần không được hỏi lại khi nhánh viết thêm.
  `queued-recommendation-not-held-against-the-change` còn: chỉ hai ô, chỉ khi khuyến nghị là lời của danh mục, không gì
  đỏ, và tác tử không chạy lại phiếu thì không được báo. `brief-sheet-narrows-what-the-builder-asks` (mức nặng) **không
  đóng bằng bài kiểm**: bài kiểm chứng phiếu nói gì, không chứng tác tử làm gì. Chỉ lượt thử thứ hai đóng được nó.
- **Điều cần chủ repo nhìn lại**, vì đề bài 0010 không nói:
  - Điểm 5: các ô đọc từ dòng sổ màn do nhánh viết chỉ được đánh dấu, không mở. Mở chúng là thêm câu hỏi cho mọi màn
    mới.
  - Điểm 4: «liên quan tới màn» gồm cả hành động của thực thể màn cho thấy, nên một trường mới mở ô 10 trên phiếu của
    mọi màn cho thấy bản ghi ấy, mỗi phiếu một câu hỏi. Ở lượt thử 12 điều ấy đúng với màn «Quá hạn», nhưng là ba câu
    hỏi về cùng một thay đổi.
  - Hai lời khuyến nghị mới (`cases.written`, `cases.look`) là lời của phiên này, nằm trong danh mục dưới dạng dữ liệu.
- Câu trả lời `--json` thêm: `branch`, `beyond`, `summary.settled_on_branch`, `summary.against`,
  `model_changes.written`, `kind.task_of`; trên ô: `written_on_branch`, `waits`, `asked.against`, `asked.now`; trên
  nguồn của một dòng: `branch`.
- Mã mẫu chép vào repo đổi ở hai tệp, không đổi hành vi của cổng: `owner-calls.mjs` (tách `branchBase`) và
  `screen-actions.mjs` (tách `modelOfFiles`). Kho này nhận bản mới qua `make design-apply`; trang luật của kho có thêm
  đoạn thứ hai.
- Phiếu nay chạy thêm khoảng mười lời gọi git mỗi lần. Nó vẫn không đọc đồng hồ và không gọi mô hình: cùng một kho cho
  cùng một phiếu ở hai ngày, từng byte, kể cả trên nhánh.
- Một lượt soát mã độc lập trước PR, chỉ được đưa mã và ý định: không thấy lỗi ở phần đọc git, phần tách mã của cổng
  và `decide`; sáu điểm nhỏ. Bốn điểm đã sửa, mỗi điểm có bài kiểm thấy đỏ trước: lời «since the question was asked»
  nói điều phiếu không đo (nay là «stands now», khoá `now`); nguồn chữ là một thư mục làm phiếu vỡ; đổi thứ tự khoá
  của một trường bị coi là đổi mô hình; và ở bản clone thiếu, git có thể tự tải đối tượng về (nay bị chặn, không đọc
  được thì nói «không so được»). Hai điểm ghi vào sổ giới hạn chứ không sửa: một tên được coi là «đã có chữ» khi từ ấy
  đứng ở bất kỳ đâu trong tệp giữ chữ, và ô 10 mở trên phiếu của mọi màn cho thấy bản ghi. Ba điểm phiên này tự soát
  và sửa kèm bài kiểm: màn khác do nhánh thêm mới không tính là «màn bị đổi»; nguồn chữ viết bằng lời (không phải tệp)
  không bị đọc như tên tệp; sổ màn không đọc được hoặc rỗng làm `decide --ask` từ chối có nêu tệp.
- Chỉ lượt thử thứ hai nói được: tác tử có hỏi điều ngoài ô không khi phiếu bảo vậy; nó có chạy lại phiếu sau khi dựng
  không; và số chỗ phải đoán có giảm không.
