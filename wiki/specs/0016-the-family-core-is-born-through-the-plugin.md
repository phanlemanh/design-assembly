---
type: spec
title: Lõi của họ sản phẩm — plugin dựng lõi khi repo thứ hai cùng họ dùng nó, và repo thừa hưởng bằng cách ghim
status: approved
tier: 1
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/specs/0006-the-reusable-store.md
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0023-nine-answers-for-the-meta-layer.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0060-find-searches-the-store-nearest-first.md
  - wiki/decisions/0091-bring-in-reads-an-outside-source-into-a-candidate-direction.md
  - wiki/decisions/0093-send-out-asks-leave-records-the-push-and-says-when-it-is-behind.md
  - wiki/decisions/0101-the-repository-declares-its-ladder.md
  - wiki/decisions/0103-the-store-improves-widen-a-block-and-see-items-behind-their-pin.md
sources:
  - docs/plan/plan.json
  - docs/architecture/meta-layer.html
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/vocabulary.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/scripts/find.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/skills/new/SKILL.md
  - "repo kiểm chứng ở 1ea13196 và repo cùng họ thứ hai ở 4aebb767d, đọc ngày 2026-11-25, chỉ đọc: tệp package, thư mục design, Makefile"
  - "delivery-loop ở ce713d88, đọc ngày 2026-11-25, chỉ đọc: tri-thuc/README.md và docs/findings/2026-10-24-tang-tri-thuc-llm-wiki.md, mục 3.1"
  - "chủ repo, 2026-11-25: «Nó có giống kho tri thức trong delivery-loop không nghĩa là khi cài đặt thì kho tri thưc mới được tạo ra?»"
  - "chủ repo, 2026-11-25: «Vậy cần làm như sau đứng về design assembly là plugin meta dùng cho mọi, giai đoạn repo và nhiều người dùng. Nên lõi repo cũng phải được sinh ra khi người dùng sử dụng design assembly?»"
  - "chủ repo, 2026-11-25: «Soạn theo hướng này»"
  - "chủ repo, 2026-11-25: «Mô phỏng lại cách vận hành trong thực tế đối với người dùng như tự động, chủ động. Điều gì giúp cho trải nghiệm người dùng tốt hơn, hiệu quả hơn với claude code?»"
  - "chủ repo, 2026-11-25: «Kiểm tra điều gì còn thiếu chưa phủ ví dụ như người dùng có thể chủ động nhập kho,...?»"
  - "chủ repo, 2026-11-25: «Thêm cả hai nhóm»"
  - "chủ repo, 2026-11-25: «Duyệt cả mười ba», đáp câu «Duyệt đề bài 0016 theo khuyến nghị cả mười ba câu?»"
---

# 0016 Lõi của họ sản phẩm — plugin dựng lõi, repo thừa hưởng bằng cách ghim

Máy viết ngày 2026-11-25 theo lời chủ repo («Soạn theo hướng này»), ngay sau khi giai đoạn 10 và 11 đóng và giai đoạn
7 thành giai đoạn đang mở. Đây là đề bài cho cả giai đoạn 7, và là mục 7.0 của kế hoạch. Chủ repo duyệt đề bài và đáp
cả mười ba câu hỏi theo khuyến nghị cùng ngày («Duyệt cả mười ba»); lời đáp ghi dưới từng câu, và bản quyết định là
[0112](../decisions/0112-the-plugin-builds-the-family-core.md). Chưa gì được dựng.

Cùng ngày, chủ repo bảo mô phỏng cách người dùng thật gặp lõi, rồi bảo kiểm điều còn thiếu, nhất là việc người dùng
chủ động làm. Hai lượt ấy thêm vào đề bài, theo lời chủ repo («Thêm cả hai nhóm»): lúc thứ năm «Người dùng chủ động»,
sổ lõi trên máy, phép kiểm đi kèm lời đáp, mục «Ngoài phạm vi», tiêu chí 17 đến 26, và câu hỏi 12 và 13.

## Intent

Chủ repo đã chốt từ ngày 2026-11-13 rằng các repo cùng họ sản phẩm «chung lõi, riêng phần mở rộng»
([0002](0002-meta-layer-for-many-repositories.md)). Lõi giữ hai thứ:

- **lời đáp dùng chung:** câu thiết kế mà cả họ đã trả lời, để repo sau không bị hỏi lại;
- **khối đã nâng hạng:** khối đã chứng minh dùng được ở hơn một repo.

Quyết định [0023](../decisions/0023-nine-answers-for-the-meta-layer.md), câu 7, ghi rằng chủ repo tạo một repo riêng
tư nhỏ cho lõi, và kế hoạch chờ việc ấy. Ngày 2026-11-25 chủ repo nêu điều cách ấy bỏ sót: design-assembly là plugin
cho mọi repo, mọi giai đoạn của repo, và nhiều người dùng. Người dùng khác không có ai tạo repo lõi hộ. Vì thế lõi
phải do chính plugin dựng ra, lúc người dùng cần tới nó.

Đề bài này đổi đúng một điều của câu 7: **ai dựng lõi**. Từ «chủ repo tạo» thành «plugin dựng, người cho phép». Phần
còn lại của câu 7, và cả câu 8 và câu 9, giữ nguyên:

- lõi chỉ ra đời khi có sản phẩm thứ hai;
- lõi bắt đầu với ít khoá;
- repo thắng, bằng cách ghim.

### Hôm nay đứng ở đâu

- **Thang tra đã chừa chỗ cho lõi.** `find` đi bốn tầng; tầng 3 là kho của họ và hôm nay luôn trả «no family store
  exists yet» (`scripts/find.mjs`).
- **Bản thiết kế chưa có «thừa hưởng».** Mỗi tầng của `design/blueprint.json` ghi lời đáp và nguồn của nó; chưa nguồn
  nào là lõi.
- **Cách đọc một thứ đã ghim đã có.** Sổ nguồn ngoài giữ một bản chép trong repo kèm mã băm, và mọi bên đọc so mã băm
  trước khi tin (quyết định 0057). `inventory` đã báo món đứng sau bản ghim (quyết định 0103).
- **Cách đưa thứ của nơi khác vào mà không ghi đè đã có.** `bring-in` đọc một hệ từ ngoài thành ứng viên, và giá trị
  ngược sổ thành câu hỏi (quyết định 0091).
- **Cách xin phép gửi ra ngoài đã có.** Lời cho phép theo repo và theo phích, ghi thành dòng, rút lại được; mỗi lượt in
  trước gửi gì đi đâu (quyết định 0093).
- **Repo đầu của họ không có bản thiết kế.** Repo kiểm chứng đã được nhận chứ không ra đời qua lối dẫn dắt: lời đáp của
  nó nằm ở sổ quyết định (69 dòng) và sổ token, và kho của nó có 23 khối đã nhập.
- **Repo thứ hai của họ vướng hai giới hạn đang mở.** Nó là repo nhiều gói, màn nằm trong một gói con, và không có
  Makefile:
  - `audit-workspace-reads-top-src-only` (mức nặng): ở repo nhiều gói, audit đọc ra rỗng;
  - `adopt-without-makefile-writes-nothing`: không có Makefile thì lối nhận không ghi gì.

### Kho tri thức của delivery-loop: giống và khác

Chủ repo hỏi lõi có giống kho tri thức không. Giống ở cách ra đời, khác ở phạm vi.

- **Giống:** kho tri thức không sinh ra lúc cài. Repo khai một lần thì mới có; repo không khai thì không gì đổi; phần
  riêng tư đi kèm là một repo người cho phép tạo. Lõi theo đúng nếp ấy.
- **Khác:** mỗi repo có một kho tri thức của riêng nó. Lõi thì một cho cả họ, nhiều repo cùng ghim.

### Bốn luật không đổi

1. **Repo đứng một mình không đổi gì.** Không thêm câu hỏi, không thêm tệp, cổng không đổi. Đây là mặc định. Một
   ngoại lệ có tên: người dùng đã có một lõi trên máy được hỏi đúng một câu ở repo mới, một lần; đáp «không» thì repo ấy
   không bị hỏi lại.
2. **Repo thắng, bằng cách ghim.** Repo giữ một bản chép của lõi kèm mã băm. Lõi đổi thì repo được báo, và người nhận
   từng câu; không gì tự đổi theo.
3. **Không lệnh nào của plugin gọi mạng.** Tạo repo trên GitHub và đẩy lên là việc của phiên làm việc, chỉ sau lời
   người, và in trước gửi gì đi đâu. Lõi dùng được ngay từ một thư mục trên máy.
4. **Plugin không nêu tên sản phẩm hay họ nào.** Tên họ, lời đáp và khối là dữ liệu của người dùng, nằm trong lõi của
   họ, không nằm trong plugin.

## Lõi là gì, nằm ở đâu

Lõi là **một thư mục có hình dạng cố định**, mang số phiên bản hình dạng. Nó là một repo git hay chưa là việc của
người dùng; plugin đọc và ghi thư mục ấy như nhau.

| Phần của lõi       | Chứa gì                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Tờ khai            | Tên họ do người đặt, phiên bản hình dạng, các repo thành viên                                               |
| Hồ sơ lời đáp      | Mỗi lời đáp chung: câu nào, giá trị, **khoá** hay **mặc định**, phép kiểm giữ nó, vì sao, ai chốt, ngày nào |
| Kho khối           | Danh mục khối đã nâng hạng và tệp của chúng, kèm mã băm, bộ chuyển khối cần, repo đang dùng                 |
| Báo cáo thành viên | Mỗi repo đã giải nhu cầu nào (khoá nhu cầu, tên, mô tả); không chép mã                                      |

Ở repo thành viên có hai thứ:

- **một dòng khai** repo thuộc họ nào, kèm bản ghim;
- **một bản chép của lõi** trong repo, so được bằng mã băm.

Nhờ bản chép, repo dựng và kiểm được trên mọi máy và trên CI mà không cần chạm tới repo lõi. Một đồng nghiệp tải repo
về máy mới không phải cài hay khai gì thêm.

Ngoài repo có một thứ nữa, trên máy của người dùng: **sổ lõi trên máy**, mỗi dòng là một lõi máy này đã dựng hay đã
ghim, kèm đường dẫn. Nó không nằm trong repo nào và không bao giờ được gửi đi. Nhờ nó máy tự nhận ra họ ở lúc 2 dưới
đây. Máy chưa có lõi nào thì sổ ấy không tồn tại.

**Lời đáp đi kèm phép kiểm.** Nguyên tắc của kiến trúc là quyết định và lệnh kiểm cùng đi sang mọi repo. Một câu đã
khoá vì thế mang theo tên phép kiểm giữ nó. Repo thành viên có phép kiểm ấy thì câu được giữ; chưa có thì sổ ghi
«thừa hưởng, chưa có gì giữ», và không ai đếm nó là đã giữ.

## Người dùng thấy gì: năm lúc

1. **Repo đứng một mình.** Không thấy gì mới. `status` có một dòng nói repo đứng một mình và lệnh nào đưa nó vào họ.
2. **Repo thứ hai xuất hiện, lõi ra đời.** Người dùng nói repo này cùng họ với một repo đã có, hoặc trỏ tới nó. Từ lõi
   thứ nhất trở đi, máy tự hỏi: ở một repo mới, khi sổ lõi trên máy có một lõi, lối dẫn dắt hỏi đúng một câu «repo này
   cùng họ với X?».
   - Máy đọc lời đáp **đã được người chốt** của repo đầu, từ bản thiết kế nếu có, từ sổ quyết định và sổ token nếu repo
     ấy được nhận. Lời máy đề xuất mà chưa ai xác nhận không là ứng viên.
   - Máy bày một tờ không quá bốn câu: tên họ; bộ lời đáp đề xuất khoá; bộ đề xuất để mặc định; lõi nằm ở đâu.
   - Người đáp xong, máy dựng thư mục lõi. Repo đầu không bị ghi gì.
3. **Repo thừa hưởng.**
   - Câu lõi đã khoá: không hỏi lại; sổ ghi «thừa hưởng», từ lõi nào, bản nào.
   - Câu lõi để mặc định: điền sẵn, đổi được; đổi thì sổ ghi là đã đổi và vì sao.
   - Câu lõi không đáp: hỏi như hôm nay.
   - Repo đã có lời đáp của riêng nó: so từng câu. Giống thì ghi «thừa hưởng». Khác một câu đã khoá thì thành câu hỏi
     cho chủ repo: theo lõi, hay giữ và ghi ngoại lệ có lý do. Không gì bị ghi đè lặng lẽ.
   - Cuối lượt, máy nói rõ đã bỏ qua câu nào vì lõi đã đáp, kèm ai chốt và ngày nào. Người dùng không phải mở sổ để tin.
4. **Lõi đổi, và khối nâng hạng.**
   - Lõi đi trước bản ghim: `status` và `inventory` nói câu nào, khối nào đã đổi. Người nhận từng câu.
   - Lúc mở phiên, máy nói một dòng khi có việc chờ: lõi đi trước bản ghim, hay một đề xuất chờ lời đáp. Không có gì
     chờ thì im lặng (câu hỏi 12).
   - Nhận bằng mắt: với câu mang giá trị nhìn thấy được, máy vẽ màn của chính repo trước và sau khi đổi, đặt cạnh nhau,
     bằng bảng mẫu plugin đã có.
   - Một nhu cầu repo này cần mà repo khác trong họ đã giải: `find` thấy nó ở tầng 3. Khối chưa nâng hạng thì máy đề
     xuất nâng hạng ngay lúc ấy; chủ của họ duyệt rồi khối mới vào kho của lõi.
   - Lấy khối từ lõi đi cùng lối với mọi món từ ngoài: lấy về, chuẩn hoá, nhập kho. Mã được chép vào repo, dòng sổ ghi
     nguồn và bản ghim.
5. **Người dùng chủ động.** Lõi không chỉ đổi khi máy đề xuất. Năm việc người làm được bằng lời mình:

   | Việc                          | Ai làm         | Điều xảy ra                                                                  |
   | ----------------------------- | -------------- | ---------------------------------------------------------------------------- |
   | Đưa một khối của repo lên lõi | Chủ của họ     | Khối vào kho của lõi, ghi rõ «chưa có lần dùng thứ hai» (câu hỏi 13)         |
   | Đổi một lời đáp của lõi       | Chủ của họ     | Đổi giá trị, lên khoá, xuống mặc định, hay thêm câu mới; các repo được báo   |
   | Đề xuất sửa ngược lên lõi     | Một thành viên | Khối đã sửa hay lời đáp khác thành đề xuất; trong lúc chờ, repo giữ ngoại lệ |
   | Rút một khối hay một lời đáp  | Chủ của họ     | Lõi ghi là đã rút; repo đang dùng được báo và giữ bản của mình như đồ riêng  |
   | Rời họ                        | Chủ của repo   | Lời đáp thừa hưởng thành của riêng repo; bản ghim được gỡ; cổng vẫn xanh     |

**Một ví dụ.** Người dùng đã có sản phẩm A dùng plugin. Họ mở sản phẩm B và gọi lối dẫn dắt.

- Họ nói B cùng họ với A. Máy thấy chưa có lõi, đọc lời đáp của A, và hỏi bốn câu.
- Lõi ra đời trong một thư mục cạnh hai repo. B ghim lõi.
- Lối dẫn dắt của B bỏ qua màu gốc và cách mở hồ sơ, vì lõi đã khoá; nó điền sẵn thang chữ, và chỉ hỏi phần riêng của B.
- B cần một bảng nhiều dòng. `find` thấy A đã giải nhu cầu ấy; máy đề xuất nâng khối lên lõi, người duyệt, B lấy khối
  về qua lối nhập kho.
- Cuối cùng máy hỏi có đẩy lõi lên một repo riêng tư không. Từ chối thì lõi vẫn dùng được trên máy.
- Ba tuần sau, họ đổi màu gốc. Mở phiên ở B, máy nói một dòng. Người bảo xem; máy vẽ màn của B trước và sau. Người nhận
  thì sổ và mã đổi theo; chưa nhận thì B giữ nguyên và vẫn xanh.

### Ngoài phạm vi

Để sau, mỗi việc cần một lời riêng của chủ repo:

- khuôn màn và mẫu hành vi lên lõi: lõi của đề bài này chỉ có lời đáp và khối;
- chuyển sang họ khác, hay ghim lại một bản cũ của lõi;
- dựng lõi trước khi có repo thứ hai, ví dụ từ một bộ nhận diện thương hiệu;
- ngoại lệ có hạn dùng;
- một trang cho người đọc thấy câu nào thừa hưởng từ đâu;
- đổi hình dạng của lõi khi plugin lên đời, và giải tán một họ.

Không làm, kèm lý do:

- nhập thẳng từ nguồn ngoài vào lõi: nhập kho luôn vào kho của repo trước;
- tự nhận thay đổi của lõi mà không hỏi: repo thắng, bằng cách ghim;
- lấy thẳng khối chưa nâng hạng của repo khác: lõi là lối duy nhất giữa hai repo;
- hai lõi cho một họ.

## Acceptance criteria

Mỗi dòng chứng bằng một lệnh hay một bản ghi lượt thử.

1. **Repo đứng một mình không đổi.** Trên một repo không khai họ, ở máy chưa có lõi nào, `status`, `audit`, `new`, `adopt` và cổng không thêm
   câu hỏi, không thêm tệp, không đổi mã thoát. Có bài kiểm so trước và sau trên bốn loại repo: chưa có sổ, đã nhận, do
   lối dẫn dắt dựng, và không có Makefile.
2. **Hình dạng của lõi nằm trong hợp đồng**, có số phiên bản. Phép kiểm hình dạng đỏ khi một phần của lõi sai. Plugin
   gặp hình dạng mới hơn thì không ghi gì và nói cần lên đời.
3. **Lệnh dựng lõi** đọc lời đáp đã chốt của repo đầu và ghi một thư mục lõi; không ghi gì vào repo đầu. Có bài kiểm
   cho cả hai loại repo đầu: có bản thiết kế, và chỉ có sổ quyết định cùng sổ token.
4. **Tờ khoá hay mặc định** không quá bốn câu một lượt. Mỗi câu có `question`, `recommendation`, `basis`, `where`,
   `if_refused`. Không lời đáp nào thành khoá khi chưa có lời người; lời người được ghi kèm tên và ngày.
5. **Repo khai họ và ghim.** Lệnh ghi dòng khai, bản chép của lõi và mã băm. Bản chép lệch mã băm thì lõi không đọc
   được: lệnh nói vì sao, repo không thừa hưởng gì và dùng lời đáp của riêng nó. Có bài kiểm làm hỏng.
6. **Lối dẫn dắt trên repo thành viên:** câu đã khoá không được hỏi và sổ ghi «thừa hưởng» kèm lõi và bản ghim; câu mặc
   định được điền sẵn, và đổi thì ghi lý do; câu lõi không đáp được hỏi như cũ. Cuối lượt, lệnh in từng câu đã bỏ qua
   kèm ai chốt và ngày nào. Có bài kiểm đếm số câu hỏi.
7. **Repo đã có lời đáp vào họ:** mỗi câu khác với một câu đã khoá thành một câu hỏi trên hàng chờ; không giá trị nào
   của repo bị ghi đè trước lời đáp. Có bài kiểm.
8. **Cổng giữ câu đã khoá.** Cổng đỏ khi một câu đã khoá trong repo khác bản ghim mà không có ngoại lệ được ghi. Câu mặc
   định không bao giờ làm cổng đỏ. Có bài kiểm làm hỏng.
9. **Lõi đi trước bản ghim:** `status` và `inventory` nêu từng câu và từng khối đã đổi; repo không đổi gì cho tới khi
   người nhận. Có bài kiểm.
10. **Tầng 3 của thang là thật.** `find` đọc kho khối của bản lõi đã ghim; thứ tự các tầng không đổi; trên repo đứng
    một mình dòng của tầng 3 nói repo không thuộc họ nào. Có bài kiểm.
11. **Khối từ lõi đi lối lấy về, chuẩn hoá, nhập kho.** Dòng sổ nhập kho ghi nguồn là lõi và bản ghim; cổng xanh;
    `inventory` báo khi khối ấy đứng sau bản của lõi.
12. **Báo cáo thành viên** chỉ ghi khoá nhu cầu, tên và mô tả; không chép mã hay nội dung tệp. Lệnh in trước nó sẽ ghi
    gì vào thư mục lõi.
13. **Đề xuất nâng hạng** hiện ở hai chỗ, thành một câu hỏi: ngay lúc `find` hay `intake` gặp một nhu cầu repo khác
    trong họ đã giải, và ở nhịp định kỳ của `status`. Khối chỉ vào kho của lõi sau lời chủ của
    họ. Mục của kho ghi repo đang dùng, mã băm từng tệp và bộ chuyển cần có. Khối cần bộ chuyển repo không có thì không
    được đưa ra, kèm lý do.
14. **Không mạng trong lệnh; đẩy lên có lời người.** Các lệnh của lõi không gọi mạng. Skill hỏi trước khi tạo repo hay
    đẩy lên; lời cho phép ghi thành dòng theo họ, rút lại được; mỗi lượt in trước gửi gì đi đâu; repo tạo ra là riêng
    tư. Từ chối thì thư mục lõi trên máy vẫn dùng được trọn. Có bài kiểm cho phần không mạng và phần từ chối.
15. **Tên họ là dữ liệu của người dùng.** Lệnh của lõi chỉ đọc tên họ từ lời người và từ thư mục lõi; không tệp nào
    các lát này thêm dưới `plugins/` nêu tên một họ, một sản phẩm hay một repo. Có bài kiểm: mẫu dữ liệu mang một tên
    họ, và tên ấy chỉ xuất hiện trong thư mục lõi và dòng khai của repo thành viên.
16. **Dòng «xong khi» của giai đoạn:** một lượt thử có người, trên bản sao. Repo thứ hai cùng họ không bị hỏi lại câu
    nào lõi đã đáp; nó dùng lại ít nhất một khối lấy từ lõi qua thang; cổng của nó xanh; số lần quyết thay bằng 0.

Tiêu chí 17 đến 26 được thêm ngày 2026-11-25 theo lời chủ repo («Thêm cả hai nhóm»), sau một lượt mô phỏng năm cảnh
dùng và một lượt quét điều còn thiếu.

17. **Máy tự nhận ra họ.** Khi một lõi được dựng hay được ghim, lệnh ghi một dòng vào sổ lõi trên máy. Trên một repo
    chưa khai họ, `new` và `adopt` hỏi đúng một câu «cùng họ với X?» khi sổ ấy có một lõi đọc được. Đáp «không» thì lời đáp được ghi vào sổ ấy, không ghi vào repo, và repo ấy không bị hỏi lại. Sổ vắng hay không
    đọc được thì không hỏi và không báo lỗi. Sổ không nằm trong repo nào và không lệnh nào gửi nó đi. Có bài kiểm cho
    bốn ca: có lõi, đã đáp «không», không có sổ, sổ hỏng.
18. **Một dòng lúc mở phiên** (theo câu hỏi 12). Lúc mở phiên ở một repo thành viên, plugin in không quá một dòng khi
    có việc chờ: lõi đi trước bản ghim, một đề xuất chờ lời đáp, hay một câu đã khoá đang lệch. Không có gì chờ, hay
    repo đứng một mình, thì không in gì. Phần này không gọi mô hình và không gọi mạng. Có bài kiểm cho cả ba ca.
19. **Nhận bằng mắt.** Khi người xem một thay đổi của lõi ở câu mang giá trị nhìn thấy được (màu, thang chữ, bo góc,
    khoảng cách), lệnh vẽ màn của chính repo trước và sau khi đổi, sáng và tối, bằng bảng mẫu. Repo không có trình
    duyệt thì lệnh liệt kê giá trị trước và sau, và nói vì sao không có ảnh. Có bài kiểm.
20. **Thư mục làm việc riêng.** Gọi từ một thư mục làm việc riêng của git (worktree), mọi lệnh của lõi tìm ra đúng lõi
    như khi gọi từ thư mục chính, và in cùng kết quả. Có bài kiểm dựng một thư mục làm việc riêng.
21. **Chủ của họ chủ động đưa một khối lên lõi** (theo câu hỏi 13). Lệnh nhận một khối đã có dòng sổ nhập kho của repo;
    khối không có dòng sổ thì bị từ chối. Mục của kho ghi ai đưa lên, ngày nào, và «chưa có lần dùng thứ hai». Khối ấy
    chịu mọi đòi hỏi của một khối nâng hạng: mã băm từng tệp và bộ chuyển cần có. Có bài kiểm.
22. **Chủ của họ đổi một lời đáp của lõi.** Lệnh đổi giá trị, đưa một câu mặc định lên khoá, hạ một câu khoá xuống mặc
    định, hay thêm một câu mới, trong thư mục lõi. Mỗi thay đổi ghi ai, ngày nào, vì sao. Khi đưa một câu lên khoá, lệnh
    nhắc luật của quyết định 0023: chỉ khoá khi đã có một lần lệch gây hại thật; người vẫn là người quyết. Lệnh không
    ghi gì vào repo thành viên: họ được báo theo tiêu chí 9. Có bài kiểm.
23. **Thành viên đề xuất sửa ngược lên lõi.** Từ một repo đã sửa khối lấy từ lõi, hay muốn một lời đáp khác, lệnh ghi
    một đề xuất vào thư mục lõi và in trước nó sẽ ghi gì. Đề xuất thành một câu hỏi cho chủ của họ. Trong lúc chờ, repo
    giữ ngoại lệ có lý do và cổng của nó xanh. Được nhận thì lõi đổi và các repo khác được báo theo tiêu chí 9. Có bài
    kiểm.
24. **Rút khỏi lõi.** Lệnh ghi một khối hay một lời đáp là đã rút, kèm lý do và ngày; lịch sử của nó không bị xoá. Repo
    đang dùng được báo ở lần đọc lõi kế tiếp. Bản của repo ở lại: dòng sổ ghi nó nay là của repo, kèm nơi nó từng đến.
    Một lần rút không làm cổng của repo nào đỏ. Có bài kiểm.
25. **Rời họ.** Lệnh gỡ dòng khai và bản chép của lõi; mỗi lời đáp thừa hưởng thành lời đáp của riêng repo, kèm ghi chú
    nơi nó từng đến. Sau lệnh, cổng xanh và repo hành xử như một repo đứng một mình. Danh sách thành viên của lõi chỉ
    được sửa khi thư mục lõi với tới được, và lệnh in trước nó sẽ ghi gì; không với tới được thì lệnh nói việc còn lại.
    Có bài kiểm.
26. **Lời đáp đi kèm phép kiểm.** Một câu đã khoá trong lõi mang tên phép kiểm giữ nó. Ở repo thành viên có phép kiểm
    ấy, câu được giữ. Ở repo chưa có, sổ ghi «thừa hưởng, chưa có gì giữ», `status` đếm nó là đã nhận mà chưa giữ, và
    không lệnh nào đếm nó là đã giữ. Có bài kiểm làm hỏng: gỡ phép kiểm thì số câu đã giữ phải giảm.

## Domain impact

- **`ontology/` không đổi.** Mô hình nghiệp vụ của ứng dụng mẫu không liên quan.
- **Hợp đồng sổ đổi, cần người duyệt từng lần:**
  - hình dạng của lõi là phần mới của hợp đồng;
  - cách repo khai họ và ghim (câu hỏi 4);
  - dấu «thừa hưởng» và «đã đổi» ở bản thiết kế và sổ quyết định;
  - dấu «thừa hưởng, chưa có gì giữ» (tiêu chí 26).
- **Hai thứ mới ngoài hợp đồng sổ:**
  - sổ lõi trên máy, nằm ngoài mọi repo (tiêu chí 17);
  - một móc chạy lúc mở phiên, là loại thành phần plugin chưa từng có (tiêu chí 18, câu hỏi 12).
- **Một luật của tài liệu kiến trúc được nới** nếu câu hỏi 13 được nhận: «lên kho chung chỉ bằng nâng hạng, có bằng
  chứng dùng lần hai» thêm một lối bằng lời chủ của họ.
- **Quyết định 0023, câu 7, được sửa** bằng một bản quyết định mới khi đề bài này được duyệt.
- **Bảng năng lực không thêm ổ.** Đề bài 0008 đã ghi giai đoạn 7 không có năng lực nào đứng tên.
- **Tài liệu kiến trúc** (mục 6 và mục 12) được cập nhật khi các lát dựng xong, không ở đề bài này.

## Plan

Giai đoạn 7 giữ ba mục đã có và thêm mục 7.0 cho đề bài, như giai đoạn 10 và 11. Mỗi lát một PR, gộp theo lời chủ repo.

1. **7.0 Đề bài** này, chủ repo duyệt. Cùng thay đổi ấy: bản quyết định sửa câu 7 của 0023, và dòng «cần chủ repo» của
   giai đoạn đổi từ «Tạo repo cho lõi» thành «Cho phép tạo repo lõi và đẩy lên; chốt câu nào khoá; cho phép từng lượt
   thử tốn token».
2. **7.1 Hồ sơ quyết định dùng chung** (tiêu chí 1 đến 9, 14, 15, 17 đến 20, 22, 25 và 26), bốn lát:
   - lát 1: hình dạng của lõi trong hợp đồng, kể cả phép kiểm đi kèm lời đáp; lệnh dựng lõi từ repo đầu; tờ khoá hay
     mặc định;
   - lát 2: repo khai họ và ghim; sổ lõi trên máy và câu hỏi tự nhận ra họ; `new` và `adopt` thừa hưởng và nói rõ câu
     đã bỏ qua; repo đã có lời đáp so từng câu; cổng giữ câu đã khoá; lệnh chạy đúng từ thư mục làm việc riêng;
   - lát 3: báo khi lõi đi trước bản ghim; nhận bằng mắt; một dòng lúc mở phiên; lời cho phép và lối đẩy lõi lên một
     repo riêng tư;
   - lát 4: chủ của họ đổi một lời đáp của lõi; rời họ.
3. **7.2 Kho khối đã nâng hạng** (tiêu chí 10 đến 13, 21, 23 và 24), ba lát:
   - lát 1: tầng 3 của thang đọc kho của lõi; khối từ lõi đi lối lấy về, chuẩn hoá, nhập kho;
   - lát 2: báo cáo thành viên; đề xuất nâng hạng lúc cần khối và ở nhịp định kỳ;
   - lát 3: chủ của họ chủ động đưa một khối lên lõi; thành viên đề xuất sửa ngược lên lõi; rút khỏi lõi.
4. **7.3 Repo thứ hai cùng họ thừa hưởng lõi** (tiêu chí 16): lượt thử của dòng «xong khi», trên bản sao, sau lời chủ
   repo cho từng lượt.

## Test plan

- Mỗi tiêu chí có bài kiểm của plugin, chạy bằng mẫu dữ liệu, không mạng, không mô hình.
- Phép kiểm làm hỏng cho tiêu chí 2, 5, 8, 14 và 26: hình dạng sai, bản chép lệch mã băm, câu đã khoá bị đổi, lệnh
  gọi mạng, phép kiểm của một câu đã khoá bị gỡ; mỗi lần phải đỏ, hay phải đếm lại, với thông điệp nêu đúng chỗ.
- Tiêu chí 17, 18 và 20 chạy trong thư mục tạm với một sổ lõi trên máy giả; không bài kiểm nào đọc hay ghi sổ thật
  của người đang chạy.
- Tiêu chí 1 chạy trên bốn loại repo, để chứng luật «repo đứng một mình không đổi gì».
- Lượt thử chạy trên bản sao bỏ đi của hai repo cùng họ, lõi nằm trong thư mục tạm. Không ghi, commit hay đẩy gì ở hai
  repo thật, và không tạo repo nào trên GitHub trong lượt thử.

## Autonomy tier

Máy tự dựng từng lát sau lời duyệt đề bài, mỗi lát một PR; gộp là lời chủ repo. Luôn là lời chủ repo:

- mỗi thay đổi hợp đồng sổ;
- câu nào của lõi là khoá;
- tạo một repo, đẩy lõi lên, hay ghi vào một repo khác ngoài kho này;
- mỗi lượt thử tốn token, kèm ước lượng và trần.

Không sửa Repo Standards, delivery-loop, repo kiểm chứng hay repo cùng họ thứ hai.

## Open questions

Mỗi câu kèm một khuyến nghị. Chủ repo nhận cả mười ba ngày 2026-11-25 («Duyệt cả mười ba»).

1. **Sửa câu 7 của quyết định 0023: plugin dựng lõi, người cho phép?** Khuyến nghị: có. Căn cứ: lời chủ repo ngày
   2026-11-25, và luật «plugin phục vụ mọi repo, mọi giai đoạn». Từ chối thì giai đoạn 7 chờ chủ repo tạo repo lõi bằng
   tay, và người dùng khác không có lối tới lõi.
   Đã nhận: plugin dựng lõi, người cho phép; câu 7 của quyết định 0023 được sửa bằng quyết định 0112.

2. **Lệnh tên `core`?** Khuyến nghị: có. Bảng từ vựng của plugin đã có «core design system» và «graduation». Từ chối
   thì đặt tên khác trước lát 1; tên phải vào bảng từ vựng.
   Đã nhận: `/design-assembly:core`.

3. **Khi nào hỏi «repo này thuộc họ nào»?** Khuyến nghị: trong hai trường hợp.
   - Người dùng nói tới một họ, trỏ tới một lõi hay một repo cùng họ.
   - Máy này đã có một lõi: plugin ghi mỗi lõi nó dựng hay ghim vào một sổ trên máy, ngoài mọi repo, không bao giờ gửi
     đi; ở repo mới, có lõi trong sổ thì hỏi đúng một câu.

   Ngoài ra không hỏi, và `status` có một dòng chỉ lối vào họ. Căn cứ: phần lớn repo đứng một mình, và một câu hỏi
   thêm cho mọi người dùng là cái giá không ai trong số họ cần trả; người đã có một lõi thì nhiều khả năng repo kế của
   họ cùng họ. Lõi đầu tiên vẫn cần lời người, vì trước nó máy không có gì để nhận ra. Từ chối phần sổ trên máy thì
   máy chỉ hỏi khi người nói. Từ chối cả hai thì lối dẫn dắt hỏi câu ấy trước mọi câu khác ở mọi repo, như mục 6 của
   tài liệu kiến trúc đang vẽ.
   Đã nhận: hỏi khi người nói tới một họ, hoặc khi sổ lõi trên máy có một lõi; ngoài ra không hỏi.

4. **Repo khai họ và ghim ở đâu?** Khuyến nghị: thành một tệp của sổ nguồn ngoài, với một loại mới là lõi. Căn cứ: sổ
   ấy đã có bản ghim theo mã băm, bản chép trong repo và chỗ trên thang; hợp đồng không thêm sổ. Từ chối thì thêm một
   sổ riêng cho lõi. Cách nào cũng là đổi hợp đồng, cần người duyệt.
   Đã nhận: một tệp của sổ nguồn ngoài với loại mới là lõi; hợp đồng không thêm sổ. Thay đổi hình dạng vẫn cần người duyệt ở lát dựng nó.

5. **Bộ khoá và bộ mặc định lúc đầu?** Khuyến nghị: theo câu 8 của 0023.
   - Khoá: màu gốc, cách mở hồ sơ, các luật hành vi.
   - Mặc định: mật độ bảng, thang chữ, bề rộng được kiểm.
   - Ngoài lõi: kiểu màn, kiểu cột, lời văn.

   Tờ bốn câu trình hai bộ ấy; người đổi từng câu được trước và sau khi lõi ra đời. Từ chối thì máy hỏi từng lời đáp
   một, nhiều câu hơn.
   Đã nhận: khoá màu gốc, cách mở hồ sơ và các luật hành vi; mặc định mật độ bảng, thang chữ và bề rộng được kiểm; kiểu màn, kiểu cột và lời văn ngoài lõi.

6. **Khi nào đề xuất nâng hạng lần đầu?** Khuyến nghị: khi một repo trong họ **cần** một nhu cầu mà repo khác đã giải,
   máy đề xuất nâng khối ấy lên lõi trước khi repo thứ hai tự dựng. Khi hai repo đã giải cùng nhu cầu theo hai cách thì
   đề xuất chọn một. Căn cứ: chờ repo thứ hai dựng xong mới nâng hạng là dựng hai lần rồi bỏ một. Đây là cách máy đọc
   luật «có bằng chứng dùng lần hai» của tài liệu kiến trúc: nhu cầu xuất hiện lần hai là bằng chứng. Từ chối thì chỉ
   nâng hạng khi cả hai repo đã có khối của riêng mình.
   Đã nhận: đề xuất nâng hạng ngay khi một repo cần một nhu cầu repo khác trong họ đã giải; hai cách giải thì đề xuất chọn một.

7. **Khối từ lõi có đi lối chuẩn hoá như món từ ngoài?** Khuyến nghị: có, một lối cho mọi thứ không phải của repo.
   Khối của lõi đã theo luật của họ nên bản chuẩn hoá thường gần rỗng. Từ chối thì khối của lõi vào thẳng sổ nhập kho,
   nhanh hơn nhưng thêm một lối thứ hai phải giữ.
   Đã nhận: khối từ lõi đi lối lấy về, chuẩn hoá, nhập kho như món từ ngoài.

8. **Lượt thử «xong khi» chạy trên repo thứ hai nào?** Khuyến nghị: trên bản sao của repo cùng họ đã nêu tên ở giai
   đoạn 2, phần gói chứa màn. Căn cứ: đó là sản phẩm thứ hai thật. Rủi ro đã biết: hai giới hạn đang mở (repo nhiều
   gói, không Makefile) có thể chặn lối nhận ở đó. Nếu chúng chặn, máy dừng và hỏi: sửa hai giới hạn ấy thành một mục
   của giai đoạn 7, hay chạy lượt thử trên một repo mới ra đời qua lối dẫn dắt. Từ chối thì lượt thử chạy ngay trên một
   repo mới, rẻ hơn nhưng không chứng được gì về một sản phẩm đã có.
   Đã nhận: trên bản sao của repo cùng họ đã nêu tên ở giai đoạn 2, phần gói chứa màn; nếu hai giới hạn đang mở chặn, máy dừng và hỏi.

9. **Tạo repo lõi và đẩy lên: xin phép thế nào?** Khuyến nghị: lời cho phép theo họ, ghi thành dòng, rút lại được; repo
   tạo ra là riêng tư; mỗi lượt đẩy in trước gửi gì đi đâu. Từ chối thì plugin chỉ dựng thư mục lõi trên máy, và người
   dùng tự đưa nó lên nơi họ muốn.
   Đã nhận: lời cho phép theo họ, ghi thành dòng, rút lại được; repo tạo ra là riêng tư; mỗi lượt in trước gửi gì đi đâu.

10. **Ai là «chủ của họ» khi có nhiều người dùng?** Khuyến nghị: người đáp tờ khoá hay mặc định, ghi kèm tên và ngày.
    Thay đổi về sau đi qua lối soát của chính repo lõi; plugin không tự xét ai có quyền. Từ chối thì lõi cần một danh
    sách người được chốt, là một phần hình dạng mới.
    Đã nhận: chủ của họ là người đáp tờ khoá hay mặc định, ghi kèm tên và ngày; thay đổi về sau đi qua lối soát của repo lõi.

11. **Repo đầu của họ vào họ lúc nào?** Khuyến nghị: không nằm trong dòng «xong khi». Lõi ghi repo đầu là nơi lời đáp
    xuất phát; việc repo ấy khai họ và nhận dấu «thừa hưởng» là một thay đổi ở repo ấy, hỏi riêng khi chủ repo muốn. Từ
    chối thì giai đoạn 7 thêm một mục ghi vào repo kiểm chứng, vốn đang đứng sau bản plugin hiện tại.
    Đã nhận: repo đầu của họ không nằm trong dòng «xong khi»; việc nó khai họ được hỏi riêng.

12. **Plugin có một móc chạy lúc mở phiên?** Khuyến nghị: có, chỉ để in một dòng khi có việc chờ, và im lặng trong mọi
    ca khác. Căn cứ: hôm nay người dùng chỉ biết lõi đã đổi khi tự gọi `status`; một dòng lúc mở phiên là chỗ rẻ nhất
    để máy chủ động. Cái giá: đây là loại thành phần plugin chưa từng có, và nó chạy ở mọi phiên của mọi người cài
    plugin, nên phải nhanh, không gọi mô hình và không gọi mạng. Từ chối thì tiêu chí 18 bỏ, và việc chờ chỉ hiện ở
    `status` và ở đầu các lệnh của lõi.
    Đã nhận: plugin có một móc chạy lúc mở phiên, in không quá một dòng khi có việc chờ, im lặng trong mọi ca khác.

13. **Chủ của họ được đưa một khối lên lõi khi chưa có lần dùng thứ hai?** Khuyến nghị: có, bằng lời chủ của họ, và mục
    của kho ghi rõ «chưa có lần dùng thứ hai». Căn cứ: người dùng biết trước một khối sẽ dùng chung, và bắt họ chờ repo
    thứ hai gặp nhu cầu là chặn một việc họ có quyền quyết. Điều này nới luật «lên kho chung chỉ bằng nâng hạng, có bằng
    chứng dùng lần hai» của tài liệu kiến trúc; lời duyệt câu này là lời nới luật ấy. Từ chối thì tiêu chí 21 bỏ, và
    khối chỉ lên lõi qua đề xuất của máy.
    Đã nhận: chủ của họ được đưa một khối lên lõi bằng lời mình, mục của kho ghi «chưa có lần dùng thứ hai»; luật «có bằng chứng dùng lần hai» của tài liệu kiến trúc được nới bằng lối ấy.
