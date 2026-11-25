---
type: decision
title: "Tầng 3 của thang đọc kho khối của lõi; khối của lõi đi lối lấy về, chuẩn hoá, nhập kho"
links:
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/specs/0006-the-reusable-store.md
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0112-the-plugin-builds-the-family-core.md
  - wiki/decisions/0113-the-core-shape-and-the-command-that-builds-it.md
  - wiki/decisions/0114-a-repository-joins-its-family-and-inherits.md
  - wiki/decisions/0060-find-searches-the-store-nearest-first.md
  - wiki/decisions/0099-an-outside-item-is-conformed-before-it-is-taken-in.md
  - wiki/decisions/0100-the-conform-command-records-and-reapplies-patches.md
  - wiki/decisions/0101-the-repository-declares-its-ladder.md
  - wiki/decisions/0103-the-store-improves-widen-a-block-and-see-items-behind-their-pin.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/scripts/core-blocks.mjs
  - plugins/design-assembly/scripts/core-take.mjs
  - plugins/design-assembly/scripts/core.mjs
  - plugins/design-assembly/scripts/core-join.mjs
  - plugins/design-assembly/scripts/find.mjs
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/conform.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/skills/core/SKILL.md
  - plugins/design-assembly/skills/find/SKILL.md
  - plugins/design-assembly/skills/intake/SKILL.md
  - plugins/design-assembly/skills/inventory/SKILL.md
  - plugins/design-assembly/tests/test-core-blocks.mjs
  - plugins/design-assembly/tests/helpers/core-blocks-repo.mjs
  - "phiên điều phối, 2026-11-25: chủ repo đáp «Mở ba lát» cho câu «Mở ba phiên song song: 7.1 lát 3, 7.2 lát 1 và nửa «rời họ»?»"
  - "repo kiểm chứng ở 1ea13196, chép bằng git archive vào thư mục tạm, chỉ đọc repo thật (kể cả node_modules của nó, để chạy prettier trên bản sao)"
---

# 0117 Tầng 3 của thang đọc kho khối của lõi; khối của lõi đi lối lấy về, chuẩn hoá, nhập kho

## Status

Accepted, 2026-11-25, plugin 0.63.0. Lát 1 của mục 7.2, dựng theo lời chủ repo («Mở ba lát»), theo đề bài
[0016](../specs/0016-the-family-core-is-born-through-the-plugin.md) đã duyệt (tiêu chí 10 và 11, lời đáp 7) và các
quyết định [0113](0113-the-core-shape-and-the-command-that-builds-it.md) và
[0114](0114-a-repository-joins-its-family-and-inherits.md). Lát này đổi hợp đồng sổ (bản chép của lõi giữ thêm tệp
của khối, dòng sổ nhập kho của một khối từ lõi, phép kiểm hình dạng của một kho khối không rỗng) nên cần người duyệt
trước khi gộp.

## Context

Thang tra của `find` đã chừa tầng 3 cho kho của họ từ đề bài 0006, và tới hôm nay tầng ấy luôn trả «no family store
exists yet». Lát 1 của mục 7.1 đã nêu hình dạng kho khối của lõi (`blocks/index.json`, tệp của khối ở
`blocks/<need>/`), lát 2 cho repo khai họ và giữ một bản chép của lõi trong `design/core`, so bằng mã băm; nhưng bản
chép ấy mới có danh mục khối, chưa có tệp của khối, và chưa lệnh nào đọc danh mục.

Lời đáp 7 của đề bài đã chốt: khối của lõi đi cùng một lối với món từ nguồn ngoài, lấy về, chuẩn hoá, rồi nhập kho.
Đề bài để ngỏ: bản chép giữ gì để thành viên lấy được khối; ai chép tệp của khối vào repo và chép vào đâu; dòng sổ
nhập kho và bản chuẩn hoá gọi khối bằng tên nào; «đứng sau bản của lõi» đo bằng gì; dòng của tầng 3 nói gì trên repo
không thuộc họ nào; và phép kiểm hình dạng đòi gì ở một kho không rỗng. Chưa lệnh nào ghi vào kho khối của lõi (nâng
hạng là lát 3 của mục này), nên mọi lõi có khối trong bài kiểm và trong lượt thử đều do tay viết, đúng hình dạng hợp
đồng nêu.

## Decision

1. **Tệp của khối vào bản chép đã ghim.** `core --join` chép thêm mọi tệp của mọi khối, đúng chỗ lõi giữ nó
   (`design/core/blocks/<need>/<file>`), từng byte, và `pin.files` của lời khai ghi mã băm từng tệp cạnh ba phần đã
   có. Nhờ vậy phép so mã băm sẵn có (`readPinnedCore`, kể cả ở bản công cụ cũ đã chép vào repo) giữ luôn tệp của
   khối: một tệp của khối bị đổi trong bản chép làm bản chép không đọc được, như mọi tệp khác, và cổng đỏ.
   - **Vì sao không đọc từ thư mục lõi lúc lấy khối:** thành viên lấy được khối ở đúng bản đã ghim trên mọi máy và
     trên CI, khi thư mục lõi ngoài tầm với; lõi đi trước không ép thành viên ghim lại (và nhận lại từng lời đáp) chỉ
     để lấy một khối; và đó cũng là nếp của nguồn ngoài, nơi ảnh chụp giữ món.
   - **Cái giá:** bản chép lớn dần theo mọi khối của lõi, dù repo có lấy hay không; và mã của khối nằm trong
     `design/core`, nên trình định dạng, lint hay phép kiểm kiểu của repo, nếu đi qua cả repo, sẽ đọc nó. Trình định
     dạng mà viết lại một tệp ấy thì bản chép không đọc được cho tới khi ghim lại. Plugin không ghi dòng bỏ qua nào;
     skill bảo nói với chủ repo. Hai giới hạn ghi lại điều này.
   - **Repo vào họ trước lát này vẫn đọc được:** bản chép của nó có danh mục mà không có tệp của khối. Bản chép vẫn
     đọc được, lời đáp vẫn thừa hưởng; khối nào thiếu tệp thì không được đưa ra, kèm lý do và lệnh `core --join` để
     ghim lại. Mã ghim của thành viên vẫn là 12 chữ số hex của mã băm `answers.json`: khối đổi không làm đổi mã ghim.
2. **Tầng 3 đọc bản chép, không bao giờ đọc thư mục lõi** (`scripts/core-blocks.mjs`). Nhờ vậy cùng một repo luôn
   cho cùng một lời đáp trên mọi máy. Một kết quả ở tầng 3 nêu nhu cầu, tên, mô tả nếu kho có, bộ chuyển khối cần,
   và «from: the family's core, pinned <mã ghim>». Thứ tự các tầng giữ nguyên; nguồn khai `before-starter` vẫn đứng
   ngay sau kho của repo (quyết định 0101).
   - Repo không khai họ: dòng của tầng 3 là «this repository is of no family (core --join declares one)», không đọc
     gì. Đó là dòng duy nhất đổi trên repo đứng một mình.
   - Bản chép lệch mã băm: tầng 3 không đọc, nói vì sao (nêu tệp), và thang đi tiếp sang tầng kế.
   - Khối không được đưa ra, kèm lý do, như bộ khởi đầu làm: thiếu bộ chuyển (`adapters` là loại bộ chuyển, như
     `needs` của bộ khởi đầu); repo đã có một thành phần cùng tên; hay bản chép không giữ tệp của nó.
3. **Một bước riêng lấy khối về: `core --take <khối> [--need <khoá>] [--to <thư mục>] [--dry-run]`**
   (`scripts/core-take.mjs`). Với món từ nguồn ngoài, «lấy về» là dòng cài đặt mà phiên làm việc chạy sau lời chủ
   repo, vì nó cần mạng. Với khối của lõi, «lấy về» là chép từ bản chép, không mạng, nên một lệnh của plugin làm
   được và làm đúng. Lối đi vì thế vẫn ba chặng như món ngoài: `intake` hỏi chủ repo; sau lời đáp, `intake` nêu
   bước `core --take` mà không chạy nó; bước ấy chép tệp và mở bản chuẩn hoá ở trạng thái «như lấy về»; rồi
   `intake --file` ghi dòng sổ, sau mọi phép kiểm nó vẫn làm với một món ngoài. Lựa chọn kia, để `intake` tự chép và
   ghi dòng trong một lần, nhanh hơn một lời gọi nhưng là lối thứ hai phải giữ, điều lời đáp 7 đã từ chối.
   - `<khối>` là khoá nhu cầu của khối trong lõi; `--need` là nhu cầu của chính repo khi nó khác khoá ấy.
   - Tệp vào thư mục thành phần của riêng repo (cạnh thư mục của thư viện), theo tên lõi đặt; `--to` nêu thư mục
     khác. Mã được chép, không bao giờ liên kết.
   - Không ghi gì và thoát 2 khi: repo không thuộc họ nào, bản chép không đọc được, bản chép không có khối ấy, repo
     thiếu bộ chuyển, một tệp khác đã nằm ở chỗ ấy (không bao giờ ghi đè), repo đã có một thành phần cùng tên ở
     chỗ khác, sổ đã đáp nhu cầu ấy bằng khối khác, hay `--to` trỏ ra ngoài repo, vào bản chép (so không phân biệt
     hoa thường) hoặc vào một thư mục ẩn. `--to` viết bằng đường dẫn đầy đủ là cùng thư mục ấy.
   - Thoát 1 khi đã lấy về mà khối tắt một luật: luật một dòng sổ quyết định giữ thì phải vá, không miễn được; luật
     khác cần dòng miễn, và chủ repo được hỏi danh sách miễn như với mọi món.
4. **Dòng sổ nhập kho và bản chuẩn hoá gọi khối bằng khoá nhu cầu của nó trong lõi.** Dòng sổ: `from: core`,
   `source` là khoá ấy, `pin` là mã ghim của lõi, `taken` là mã băm tệp, `conform` là đường tới bản chuẩn hoá. Bản
   chuẩn hoá: `source: core`, `item` là khoá ấy. Khoá nhu cầu là thứ duy nhất hình dạng giữ là không trùng trong một
   kho («một nhu cầu, một khối»); tên thì không. Không khoá nào mới, sổ nhập kho vẫn hình dạng 1.
5. **«Đứng sau» đo theo từng khối, bằng mã băm của khối.** `pin_sha256` của bản chuẩn hoá, với khối của lõi, là mã
   băm của danh sách tệp của khối (tên và mã băm từng tệp, xếp theo tên) như bản chép giữ. Mã ấy chỉ đổi khi một
   tệp của khối đổi, thêm hay bớt. `inventory` báo `outdated` khi mã trong bản chuẩn hoá khác mã của bản chép hôm
   nay. Một lời đáp của lõi đổi, một khối khác đổi, hay một thành viên vào họ không làm khối nào «đứng sau», điều
   mà mã băm của cả bản ghim (cách của nguồn ngoài) sẽ làm.
   - Lõi đổi khối mà repo chưa ghim lại thì `inventory` chưa nói gì: repo thắng, bằng cách ghim, và `inventory` chỉ
     đọc repo. Việc báo «lõi đi trước bản ghim» là lát 3 của mục 7.1.
   - Lấy lại: `core --take` gọi lần nữa chỉ ghi tệp đã đổi, từ chối ghi đè một tệp bị sửa tay, rồi
     `conform --taken-down` áp lại các bản vá. Khối thêm hay bớt tệp giữa hai lần ghim thì không vá chồng: lệnh bảo
     gỡ bản chuẩn hoá và lấy lại từ đầu.
   - Sửa tay: `inventory` báo `modified` bằng đúng phép so sẵn có của món có bản chuẩn hoá.
6. **Phép kiểm hình dạng của một kho không rỗng** (`coreStoreProblems`, chạy trong `core --check` và trước
   `core --join`): khối có ít nhất một tệp; tên tệp là đường trong thư mục của nhu cầu, không dẫn ra ngoài, không
   phần nào bắt đầu bằng dấu chấm (một khối là mã, không là tệp cấu hình hay thư mục của git), không lặp; tệp có đó; là chữ (UTF-8), vì lệnh chép nó nguyên văn; và đúng mã băm đã ghi. Mỗi lỗi nêu danh mục, khối và
   tệp. Khối có thêm khoá tuỳ chọn `description`. Hình dạng của lõi vẫn là 2: không khoá bắt buộc nào thêm.
7. **`rung` của `intake` thêm giá trị `family`**, cạnh `starter`, `external`, `by-hand`: máy đọc `--json` biết lối
   nào đang đi. Câu hỏi cho chủ repo nêu khối mang gì (tệp, bộ chuyển, chép từ bản chép, không tải gì).
8. **`inventory` thêm dòng `family` ở mục kho** trên repo đã khai họ (số khối bản chép giữ, hay vì sao không đọc
   được); repo đứng một mình không có dòng ấy. Khối lấy từ lõi vẫn mang gốc `external` trong `inventory`.
9. **Bảng năng lực** thêm một lối `core-take` qua ổ `components`, vì bước ấy ghi bản chuẩn hoá. Không thêm ổ.

10. **Lối mặc định phải đi trọn trên repo của sàn chuẩn: sửa phép đọc cấu hình, không đổi chỗ đặt khối** (sửa theo
    bài soát độc lập của head 1dc41f9, điểm 1). Phép đọc sẵn có coi một tệp cấu hình là «nêu» thư mục của món khi
    chữ của nó chứa tên thư mục ấy; sàn chuẩn đặt thư mục của thư viện (`src/components/ui/**`) ra ngoài lint, nên
    `src/components`, nơi repo giữ thành phần của riêng nó và nơi khối đáp xuống, bị đọc là «đặt ra ngoài mọi luật».
    Nay một tệp cấu hình nêu một thư mục khi nó nêu **chính thư mục ấy**, viết trọn (có thể kèm `/`, `./` phía trước
    hay `/`, `/**` phía sau); thư mục con, thư mục trùng đầu tên, và thư mục cùng tên dưới một thư mục khác là thư
    mục khác (`namesFolder`, `scripts/conform-rules.mjs`).
    - **Vì sao chọn cách này, không chọn một thư mục mặc định riêng cho khối của họ:** lỗi nằm ở phép đọc, không ở
      chỗ đặt. Một thư mục riêng chỉ né được nó nhờ tên thư mục chưa xuất hiện trong cấu hình, và để nguyên lỗi cho
      mọi món khác đặt cạnh thư mục của thư viện (món từ nguồn ngoài, kể từ đề bài 0015). Khối của họ là thành phần
      của repo sau khi nhập kho, nên nó ở cùng chỗ với thành phần của repo, nơi các luật của repo áp lên nó.
    - **Phép đọc này dùng chung với món từ nguồn ngoài.** Bài kiểm chứng: món đặt trong thư mục mà cấu hình nêu đích
      danh (`src/components/kit/**`) vẫn bị từ chối, cùng câu chữ như trước; mọi bài kiểm sẵn có của `conform` và
      của luật bắt buộc vẫn xanh.
    - **Khi cấu hình nêu đích danh thư mục đáp** (trên bản sao repo kiểm chứng, tệp lint nêu `src/components`) và
      sổ quyết định giữ một luật lint: không bản vá hay dòng miễn nào gỡ được, nên `core --take` từ chối **trước khi
      ghi gì**, kể cả ở `--dry-run`, và chỉ `--to`. Không còn tệp phải gỡ tay trước khi thử lại.
11. **`core --join` nói bản chép nay giữ mã** (điểm 2): khi chép tệp của khối, đầu ra có một dòng nêu số khối, số
    tệp, rằng đó là của lõi và không tệp nào của repo dùng nó, và điều chủ repo có thể muốn làm (giữ trình định
    dạng, lint và phép kiểm kiểu ngoài `design/core`); `--json` có `copied_blocks`. Lệnh không ghi dòng bỏ qua nào.
    Lõi không có khối thì đầu ra như cũ.
12. **`adapters` của một khối là loại bộ chuyển plugin biết** (điểm 3): `build`, `browser`, `values`, `components`,
    `source`, `lint`, `routes`. `core --check` nêu từ nào không phải loại bộ chuyển, và `core --join` từ chối lõi
    ấy. Phép kiểm nằm ở `coreStoreProblems`, chạy khi kiểm và khi vào họ, chứ không nằm trong hình dạng mà cổng
    của thành viên dùng để đọc bản chép: nếu sau này plugin thêm một loại, bản công cụ cũ đã chép vào một thành
    viên vẫn đọc được bản chép có loại ấy, thay vì coi cả bản chép là sai hình dạng và làm cổng đỏ.

### Trên mọi loại repo

| Repo                                           | Lệnh làm gì                                                                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Không thuộc họ nào (bốn loại)                  | `find`, `intake`, `inventory` in như trên main, trừ dòng của tầng 3; không hỏi, không ghi gì mới, mã thoát như cũ      |
| Thành viên, do lối dẫn dắt dựng                | Tầng 3 đưa khối; lấy về, chuẩn hoá, nhập kho; cổng xanh sau khi repo viết lại sổ thành phần (`make design-components`) |
| Thành viên, được nhận, sổ viết theo khoá riêng | Dòng sổ ghi theo cách viết khoá của repo; khối vào một thư mục mà cấu hình của repo không nêu                          |
| Thành viên thiếu bộ chuyển khối cần            | Khối không được đưa ra, kèm lý do; `core --take` từ chối, không ghi gì                                                 |
| Thành viên vào họ trước lát này                | Bản chép vẫn đọc được; khối không được đưa ra cho tới khi ghim lại bằng `core --join`                                  |
| Bản chép lệch mã băm                           | Tầng 3 không đọc, nói vì sao, thang đi tiếp; `core --take` từ chối; cổng đỏ (quyết định 0114)                          |
| Gọi từ một worktree                            | `find`, `intake`, `inventory` và `core --take` in như từ thư mục chính                                                 |

## Consequences

- **Hợp đồng sổ đổi, cần người duyệt**, ở `plugins/design-assembly/references/contract.md`: đoạn «Since slice 1 of
  item 7.2 the copy also holds the files of every block…» ở mục sổ nguồn ngoài; đoạn «A block taken from the family
  core the repository pinned…» ở mục sổ nhập kho; đoạn «A block of the family core the repository pinned has the
  same record…» ở mục bản chuẩn hoá; và hai đoạn của `blocks` ở mục lõi (khoá `description`, `adapters` là loại bộ
  chuyển, và phép kiểm tệp của kho không rỗng). `contract.mjs` thêm `coreStoreProblems`, `coreBlockFile`,
  `staysInBlock`, `isTextFile`, khoá `description`, và `readPinnedCore` trả thêm `files`.
- **Tiêu chí 1 có hai bằng chứng.** Bài kiểm chạy `find`, `intake` và `inventory` trên bốn loại repo, với sổ lõi
  trên máy vắng và hỏng: cùng mã thoát, không tệp mới, không chữ nào về họ ngoài dòng của tầng 3. Một lượt so trên
  bản sao chạy cùng các lệnh bằng plugin của main (4f9160f) và của nhánh này trên cùng bốn loại repo: mã thoát như
  nhau ở cả bảy lời gọi mỗi loại, tập tệp sau một lần `intake` thật như nhau, và dòng khác duy nhất là dòng của
  tầng 3 (chữ và `--json`).
- **Lượt thử trên repo do lối dẫn dắt dựng** (bản bỏ đi, lõi mẫu một khối): `core --join` chép hai tệp của khối,
  cổng xanh; `find` đưa khối ở tầng 3; `intake` hỏi, chủ repo giữ, `core --take` chép hai tệp và mở bản chuẩn hoá,
  `conform` giữ, `intake --file` ghi dòng sổ với `from: core` và mã ghim. Cổng đỏ đúng một dòng, sổ thành phần cũ,
  cho tới khi chạy bước của repo; sau đó xanh, kể cả `choose-first` trên nhánh.
- **Lượt thử trên bản sao repo kiểm chứng** (1ea13196, công cụ 0.36.1): `find` đưa khối ở tầng 3 giữa 23 khối và
  294 thành phần của repo; dòng sổ được ghi theo cách viết khoá của repo ấy (`ten`, `tep`, `nguon`, `nhu_cau`), ở
  `design/intake/order-lines.yaml`. Cổng của bản sao giữ đúng mười lỗi sẵn có, trước khi vào họ, sau khi vào họ và
  sau khi nhập kho. Lượt thử tìm ra hai điều:
  - Lấy khối vào `src/components` (chỗ mặc định) bị từ chối: tệp cấu hình lint của repo ấy nêu `src/components`, và
    phép đọc cấu hình bằng chữ sẵn có coi đó là «đặt thư mục ra ngoài mọi luật», dù ở đó nó nêu thư mục để giữ luật.
    Đây là hành vi sẵn có với mọi món (giới hạn `outside-block-taken-in-red`). Bước `core --take` nay nói điều ấy
    ngay ở `--dry-run`, trước khi ghi gì, và chỉ lối ra: `--to` một thư mục cấu hình không nêu. Với
    `--to src/components/family`, khối vào kho trọn lối. Giới hạn mới `core-block-folder-the-configuration-names`.
  - `prettier --check` của repo ấy (chạy từ `node_modules` của repo thật, chỉ đọc) đi qua `design/core`: tệp mã của
    khối và hai tệp JSON đạt, còn `blocks/index.json` của lõi mẫu (do bài thử viết tay) thì không. Nghĩa là
    `prettier --write .` của một thành viên sẽ viết lại bản chép và làm nó không đọc được. Điều này đúng cả với ba
    phần JSON mà lát 2 đã chép. Giới hạn `core-copy-holds-code-the-repository-tools-walk`.
- **Mở chín giới hạn** (vùng `core`): `core-block-store-filled-by-no-command`,
  `core-copy-holds-code-the-repository-tools-walk`, `core-copy-holds-every-block`, `core-block-imports-not-read`,
  `core-take-does-not-read-the-owners-answer`, `core-block-with-other-files-is-taken-afresh`,
  `core-block-is-a-block-to-find`, `core-block-of-a-name-the-repository-has`,
  `core-block-folder-the-configuration-names`. Không đóng giới hạn nào: `core-member-not-told-core-moved` (lát 3 của
  mục 7.1) và `capability-cross-repo-has-no-plug` vẫn mở.
- **Một bài soát bằng tác tử độc lập** trên commit đầu (fa4e338) tìm bốn điều, sửa cả bốn trong cùng PR, mỗi bản
  sửa có bài kiểm đỏ khi thiếu nó: `--to` viết bằng đường dẫn đầy đủ lọt qua phép «không bao giờ ghi đè» và ghi vào
  một cây thư mục lồng; phép chặn `design/core` phân biệt hoa thường; khối được lấy lần hai cạnh một thành phần cùng
  tên khi nêu `--to`; và một khối có thể mang tệp ẩn (như `.git/hooks/…`). Bài soát cũng nêu bài kiểm tiêu chí 1
  không so với đầu ra của main: phép so ấy là lượt so trên bản sao ở trên, không nằm trong bài kiểm.
- **Bài soát độc lập của phiên điều phối** trên head 1dc41f9 tìm ba điều, sửa cả ba theo lời chủ repo («Gửi cả ba
  sang sửa»), mỗi bản sửa có bài kiểm đỏ khi thiếu nó: điểm 10, 11 và 12 ở trên. Thêm một đoạn hợp đồng cần người
  duyệt, ở mục bản chuẩn hoá: «A configuration file names a folder when it names that folder itself…», và một câu ở
  mục lõi về loại bộ chuyển. Lượt thử trên bản sao của chính kho này ghi ở dưới.
- **Lượt thử trên bản sao của chính kho này** (sàn chuẩn, `git archive` của nhánh, lõi mẫu một khối): `core --join`
  in dòng về mã trong bản chép; `intake` nêu `core --take status-note --need status-note`; đúng lời gọi ấy, không
  thêm cờ nào, chép khối vào `src/components/status-note.tsx` với 0 luật bị tắt; `conform` giữ; `intake --file` ghi
  `design/intake/status-note.yaml` với `from: core`. Cổng của bản sao đỏ hai dòng thuộc bước của chính repo (sổ thành
  phần, rồi bản xuất `DESIGN.md`), và xanh sau `make design-components` và `make design-exports`. Lint của bản sao
  chạy trên khối đã nhập và trên `design/core` không báo gì; `prettier --check` chỉ báo `blocks/index.json` do bài
  thử viết tay.
- **Chưa kiểm được:** lint của repo kiểm chứng trên `design/core` (bản sao không có `node_modules`, nên ESLint
  không nạp được cấu hình); và một khối thật, vì chưa lệnh nào đưa khối lên lõi.
- **Một điều ngoài lát này, chưa sửa:** `core --join` ghi bản chép qua `writeFiles`, mà hàm ấy coi hai tệp JSON
  cùng dữ liệu là «không đổi». Nếu trình định dạng của repo đã viết lại một phần JSON của bản chép, ghim lại sẽ
  không ghi đè tệp ấy trong khi mã băm mới là của tệp trong lõi, nên bản chép vẫn không đọc được sau khi ghim lại.
  Có từ lát 2; nêu cho phiên điều phối.
- **Chưa dựng** (các lát sau của mục 7.2): báo cáo thành viên và đề xuất nâng hạng (lát 2); chủ của họ đưa khối lên
  lõi, thành viên đề xuất sửa ngược lên, rút khối (lát 3). Ngoài mục này: báo khi lõi đi trước bản ghim (mục 7.1
  lát 3) và rời họ.
