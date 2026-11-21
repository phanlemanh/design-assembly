---
type: spec
title: Bài kiểm trình duyệt theo vai — mở từng màn dưới từng vai để thấy đúng nút
status: approved
tier: 1
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/specs/0003-screens-join-the-domain-model.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/specs/0010-the-screen-brief.md
  - wiki/decisions/0028-groundwork-two-rules-into-the-gate.md
  - wiki/decisions/0037-screens-join-the-domain-model.md
  - wiki/decisions/0069-the-capability-table-and-its-checks.md
sources:
  - docs/plan/plan.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/standard-decisions.json
  - plugins/design-assembly/templates/tools/design-assembly/screen-actions.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/playwright.mjs
  - plugins/design-assembly/templates/owned/templates.spec.ts.template
  - plugins/design-assembly/scripts/apply.mjs
  - tests/e2e/templates.spec.ts
  - src/screens.ts
  - design/screens/reference.yaml
  - design/screens/overdue.yaml
  - ontology/actions.yaml
  - ontology/roles.yaml
  - "repo kiểm chứng, chỉ đọc, ngày 2026-11-21: bộ «vai × màn» repo ấy tự viết tay, ba tệp, 410 dòng"
  - "chủ repo, 2026-11-21: «Viết đề bài cho mục 5.3»"
  - "chủ repo, 2026-11-21: «Duyệt cả năm», đáp câu «Duyệt đề bài 0011 theo cả năm khuyến nghị?»"
---

# 0011 Bài kiểm trình duyệt theo vai — mở từng màn dưới từng vai để thấy đúng nút

Máy viết ngày 2026-11-21 theo lời chủ repo («Viết đề bài cho mục 5.3»). Chủ repo duyệt đề bài và đáp cả năm câu hỏi theo
khuyến nghị cùng ngày («Duyệt cả năm»). Đây là đề bài cho mục 5.3 của kế hoạch. Đề bài 0002 nêu việc này ở nhịp «mỗi thay đổi» và xếp nó vào giai
đoạn 5; đề bài 0003 để lại nó cho «bài kiểm trình duyệt». Mục này không nằm trên dòng «xong khi» của giai đoạn 5: nó
đóng một giới hạn mức nặng đang mở.

## Intent

Cổng đã biết, từ sổ màn và mô hình nghiệp vụ, vai nào mở được màn nào và được bấm nút nào. Đó là điều sổ **nói**. Mục
này thêm một bài kiểm trình duyệt mở từng màn dưới từng vai và so điều trang **thật sự cho thấy** với điều sổ nói: vai
có quyền thấy nút của mình, vai không có quyền không thấy nút ấy, vai không mở được màn không thấy gì của màn.

### «Theo vai» nghĩa là gì ở đây

Vai là vai của người dùng trong mô hình nghiệp vụ của repo (`ontology/roles.yaml`, và cột `roles` của từng thao tác
trong `ontology/actions.yaml`). Không phải vai ARIA của một phần tử trên trang.

### Vì sao cần

- Giới hạn mức nặng `screen-actions-runtime-hiding-unchecked`, mở từ 2026-11-15: việc vai không quyền không thấy nút
  mới chỉ được suy ra từ sổ màn và mô hình; chưa bài kiểm nào mở màn dưới từng vai để thấy điều ấy.
- Phép nối của cổng (dòng sổ `screen-actions`, quyết định 0037) chỉ đọc sổ. Một màn mà mã của nó chìa nút xoá cho mọi
  vai vẫn qua cổng, miễn sổ màn ghi đúng.
- Repo kiểm chứng đã tự viết tay một bộ «vai × màn» cho riêng nó (ba tệp, 410 dòng, kèm một bảng «vai × màn × nút»).
  Plugin chưa đưa gì cho việc ấy, trong khi đề bài 0002 đo «công cụ viết tay giảm» (tiêu chí 5).
- Trang luật plugin sinh nói sổ màn ghi thao tác nào có nút, nhưng không nói một nút trên trang được nhận ra là nút của
  thao tác nào. Bài kiểm trình duyệt đang cài bấm nút theo tên chữ; tên chữ đổi theo từng dòng dữ liệu và từng ngôn ngữ.

### Bốn phần

1. **Bảng kỳ vọng.** Cổng đã tính sẵn bảng «màn × vai»: vai có mở được màn không, thấy thực thể nào, có nút nào
   (`screenTable` trong mã cổng, in bằng `screen-actions --table` và `--json`). Bài kiểm đọc đúng bảng ấy, không tính
   lại, nên sổ và bài kiểm không thể nói hai điều khác nhau.
2. **Cửa vai.** Trình duyệt trở thành một vai bằng cách nào là chuyện riêng của từng repo: có repo đăng nhập bằng mã
   gửi qua thư, có repo không đăng nhập. Repo trả lời ở **một tệp của nó**, mỗi vai của mô hình một lối vào: một người
   giữ đúng vai ấy và không vai nào khác. Hình dạng của lối vào do bộ chuyển trình duyệt định. Plugin không viết mã
   đăng nhập và không đoán repo có đăng nhập hay không (câu hỏi 2).
3. **Dấu của thao tác.** Điều khiển chạy một thao tác của mô hình mang tên thao tác ấy ngay trên nó, dưới dạng một
   thuộc tính (`data-action="deleteItem"`). Bài kiểm nhận ra nút bằng dấu này, không bằng chữ trên nút (câu hỏi 1).
4. **Bài đi.** Một tệp bài kiểm mới do plugin cài, đứng cạnh bài kiểm trạng thái đang có. Với mỗi màn đã dựng, mỗi vai
   và hai bề rộng (hẹp nhất và rộng nhất đã khai), nó vào bằng cửa của vai, đi qua các trạng thái của màn theo đúng
   các bước mà danh sách màn đã khai, và ghi lại mọi điều khiển mang dấu nó gặp.

### Bài kiểm khẳng định điều gì

Với một vai **mở được** màn:

- Mỗi thao tác bảng cho vai ấy được thấy ít nhất một lần, trên một điều khiển mang dấu, ở một trạng thái vai ấy tới
  được. Nút ở đâu trên trang cũng tính: trong dòng, trong danh sách của nút «⋯», trong hộp thoại, trên toast.
- Không trạng thái nào vai ấy tới được có điều khiển mang dấu của một thao tác **ngoài** bảng. «Không thấy» nghĩa là
  điều khiển không có trên trang; một nút bị khoá vẫn là thấy.
- Vai giữ mọi thao tác của màn thì tới được mọi trạng thái của màn. Vai thiếu một thao tác thì được phép không tới
  trạng thái mà bước của nó cần nút ấy; bài kiểm không coi đó là lỗi.

Với một vai **không mở được** màn: tới đường dẫn của màn, sau khi trang đã yên, trang không có điều khiển mang dấu nào
của màn và không có lời của trạng thái đầu tiên của màn. Trang vẫn có một vùng chính và một tiêu đề cấp một, như mọi
trang. Vai ấy thấy gì thay vào đó thì mục này chưa kiểm (câu hỏi 3).

Mỗi câu đỏ nêu màn, vai, thao tác, trạng thái nơi thấy, và việc cần làm.

### Hai mặt bàn giao

- **Cho người:** bảng «màn × vai» mà `screen-actions --table` in, bằng chữ. Chủ repo đọc bảng ấy để biết bài kiểm sẽ
  đòi gì; không có tài liệu mới.
- **Cho máy:** bài kiểm trình duyệt chạy trong `make check` của repo, và một dòng sổ mới mà cổng giữ (mục Domain
  impact). Trang luật và ô «thao tác» của phiếu `brief` nói với tác tử dựng màn rằng điều khiển của một thao tác phải
  mang dấu.

### Điều mục này không làm

- Không sửa bài kiểm trạng thái đã cài (`tests/e2e/templates.spec.ts`): tệp ấy giữ nguyên từng byte, và vẫn mở màn như
  nó đang mở. Đưa cửa vai vào bài kiểm ấy là việc khác.
- Không kiểm vùng điều hướng của khung (mục dẫn tới màn mà vai không mở được). Thành một dòng giới hạn mới.
- Không kiểm «một phần màn chỉ cho vài vai» và phạm vi «của tôi» so với «toàn bộ»: hai giới hạn
  `screen-actions-region-by-role` và `screen-actions-scope-ignored` giữ nguyên.
- Không kiểm quyền ở phía máy chủ. Bài kiểm chỉ nói điều trang cho thấy; một lời gọi thẳng tới máy chủ không đi qua nó.
- Không đụng năm tệp của Repo Standards, không đụng repo kiểm chứng.

Hai gạch đầu là máy chọn để mục này nhỏ. Chủ repo duyệt đề bài ngày 2026-11-21 sau khi được nêu riêng hai điều ấy, và
không bác điều nào.

## Acceptance criteria

Mỗi dòng chứng bằng một lệnh.

1. **Một bảng kỳ vọng.** Kế hoạch đi của bài kiểm (màn nào, vai nào, mong nút nào, mong mở hay không) được dựng từ
   bảng của cổng. Bài kiểm của plugin đổi một quyền trong mô hình của một kho dựng tạm và thấy kế hoạch đổi theo.
2. **Dấu của thao tác có luật.** Trang luật plugin sinh và ô «thao tác» của phiếu `brief` nói điều khiển của một thao
   tác mang dấu, chỉ khi repo có sổ thao tác và sổ màn đã khai nút. Linh kiện plugin cài mà vẽ nút của một thao tác (nút
   của dòng, nút trên bảng, nút trên toast) nhận tên thao tác và đặt dấu. Mỗi điều có bài kiểm.
3. **Vai có quyền thấy nút.** Trên một bản sao bỏ đi, gỡ dấu khỏi một nút: bài kiểm đỏ, câu đỏ nêu màn, vai và thao
   tác không được thấy.
4. **Vai không quyền không thấy nút.** Trên một bản sao bỏ đi có hai vai, để vai không có quyền thấy một nút: bài kiểm
   đỏ, câu đỏ nêu màn, vai, thao tác và trạng thái nơi thấy.
5. **Màn không được mở.** Trên bản sao ấy, để vai không mở được màn thấy lời của màn: bài kiểm đỏ.
6. **Cửa vai.** Một vai của mô hình mà tệp cửa không có lối vào: bài kiểm đỏ, nêu tên vai và tên tệp. Plugin không ghi
   mã đăng nhập vào repo nào; có bài kiểm cho thấy lối cài chỉ ghi tệp bài kiểm.
7. **Dòng sổ chỉ có khi giữ được.** Dòng sổ mới chỉ được đề xuất khi repo có dòng `screen-actions`, có trình duyệt
   kiểm thử của bộ chuyển, và có tệp cửa. Thiếu một trong ba thì không có dòng, và `status` nêu điều còn thiếu làm
   bước kế. Đã có dòng mà mất tệp cửa hay mất bài kiểm thì cổng đỏ.
8. **Bài kiểm đã cài không đổi.** Băm của `tests/e2e/templates.spec.ts` trước và sau bằng nhau, ở kho này và ở kho dựng
   tạm đã cài từ trước.
9. **Kho này.** Sổ quyết định có dòng mới, cổng giữ nó; hai màn mẫu mang dấu ở mọi nút của thao tác; `make check`
   xanh. Số bài kiểm trình duyệt thêm đúng bốn: hai màn, một vai, hai bề rộng.
10. **Một lần đo có hai vai.** Trên một bản sao của kho này được gài thêm một vai chỉ được xem, bài kiểm xanh khi màn
    giấu đúng nút và đỏ đúng câu ở ba lần gài lỗi (tiêu chí 3, 4, 5). Kết quả ghi ở một trang dưới `docs/trials/`.
11. **Sổ giới hạn và bảng năng lực.** `screen-actions-runtime-hiding-unchecked` được đóng, hoặc thu hẹp thành đúng
    điều còn hở. Có dòng mới cho: điều khiển chạy thao tác mà không mang dấu thì bài kiểm không thấy; vùng điều hướng
    của khung; điều vai bị chặn thấy thay vào đó. Ba phép kiểm của bảng năng lực vẫn xanh.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi (câu hỏi 4). Ba thay đổi hợp đồng, chủ repo nhận cùng
lời duyệt đề bài ngày 2026-11-21:

- **Một dòng sổ mới trong bảng quyết định chuẩn**, tên tạm `screen-actions-seen`: «Trong trình duyệt, mỗi vai có thấy
  đúng những nút sổ màn và mô hình cho nó, và không thấy màn nó không được mở không?». Dòng `screen-actions` giữ nguyên
  nghĩa: nó vẫn là điều sổ nói. Tách hai dòng để repo chưa có cửa vai không bị đỏ vì điều nó chưa giữ được. Tên và
  việc tách là máy chọn, đã nêu riêng với chủ repo trước khi duyệt; không bị bác.
- **Một thuộc tính trên điều khiển**, `data-action`, thành luật của trang luật (câu hỏi 1).
- **Một tệp cửa vai** mà repo giữ; với nền đang có là `tests/e2e/roles.ts` (câu hỏi 2).

Sổ màn không thêm khoá nào. Hàng chờ không đổi.

## Plan

Hai PR, mỗi PR chạy được riêng. Bài kiểm viết trước mã.

1. **Lát 1, dấu và nửa «thấy».** Kế hoạch đi dựng từ bảng của cổng; phép so «đã thấy» với «được có» là hàm thuần, có
   bài kiểm không cần trình duyệt; tệp bài kiểm mới và lối cài nó; cửa vai cho nền đang có; dòng sổ mới và điều kiện
   đề xuất; luật về dấu ở trang luật và ở phiếu; linh kiện plugin cài nhận tên thao tác; kho này mang dấu và giữ dòng
   mới. Tiêu chí 1, 2, 3, 6, 7, 8, 9.
2. **Lát 2, nửa «không thấy» và phần đóng sổ.** Vai không mở được màn; lần đo trên bản sao gài hai vai; sổ giới hạn;
   bảng năng lực; trang skill. Tiêu chí 4, 5, 10, 11.

Mã dùng lại: `screenTable` và bộ đọc mô hình của cổng; danh sách màn và các bước tới từng trạng thái mà bài kiểm trạng
thái đã đọc; bộ chuyển trình duyệt. Không thêm thư viện nào. Mẫu của plugin đổi nên số bản tăng.

## Test plan

- Phần thuần (kế hoạch đi, phép so, câu đỏ) có bài kiểm trên kho dựng trong thư mục tạm, mô hình hai vai, không cần
  trình duyệt.
- Phần chạy trong trình duyệt được chứng ở kho này bằng `make check`, và bằng các lần gài lỗi trên bản sao bỏ đi: mỗi
  lần gài thấy đỏ đúng câu, gỡ ra thấy xanh lại.
- Kho này chỉ có một vai, `user`, giữ cả ba thao tác: ở đây bài kiểm chỉ chứng được nửa «thấy». Nửa «không thấy» chứng
  ở lần đo của tiêu chí 10. Lần đo ấy không gọi tác tử độc lập nào, nên không tốn một lượt thử.
- Bài kiểm «không ghi gì ngoài tệp bài kiểm» cho lối cài, và bài kiểm băm cho tệp đã cài từ trước.
- Trên repo có đăng nhập thật và nhiều vai, bài kiểm này chưa được thử. Repo kiểm chứng đang ở bản plugin cũ (mục gác
  lại «Repo kiểm chứng»); đưa bài kiểm sang đó là việc sau, và mỗi bước ở repo ấy vẫn nêu trước khi làm.

## Autonomy tier

Máy dựng sau khi chủ repo duyệt đề bài và đáp các câu hỏi; mỗi lát một PR, gộp là lời của chủ repo. Thêm dòng vào bảng
quyết định chuẩn, thêm luật về dấu, đổi `ontology/`: luôn là lời chủ repo. Không sửa Delivery Loop, Repo Standards hay
repo kiểm chứng.

## Open questions

Mỗi câu kèm một khuyến nghị. Chủ repo đáp cả năm theo khuyến nghị ngày 2026-11-21 («Duyệt cả năm»).

1. **Một nút trên trang được nhận ra là nút của thao tác nào bằng cách gì: một dấu trên chính điều khiển
   (`data-action`), hay một bảng «thao tác → tên nút» khai trong danh sách màn?** Khuyến nghị: dấu trên điều khiển. Tên
   nút đổi theo dòng dữ liệu và theo ngôn ngữ, còn tên thao tác thì không; dấu nằm ngay cạnh mã vẽ nút nên khó lệch;
   và nó cho phép về sau phân biệt nút trên toast với nút trên màn, điều cổng hôm nay không làm được
   (`screen-actions-toast-button-unsaid`). Cái giá: mỗi màn thêm một thuộc tính cho mỗi nút của thao tác, và tác tử
   dựng màn có thêm một dòng luật phải theo. Đã nhận: dấu trên điều khiển.
2. **Cửa vai do ai viết và nằm ở đâu?** Khuyến nghị: repo viết, ở một tệp của repo; plugin cài bài kiểm và chỉ đề
   xuất dòng sổ khi tệp ấy đã có. Plugin không biết repo đăng nhập thế nào, và một tệp cửa do plugin đoán sẽ làm đỏ
   repo vừa cài, đúng lỗi đã ghi ở `starter-screen-fails-installed-checks`. Ở kho này, lát 1 viết tệp cửa cho vai
   `user`: mở ứng dụng như nó vốn mở. Đã nhận: repo viết tệp cửa, plugin chỉ đề xuất dòng sổ khi tệp ấy có.
3. **Vai không mở được màn thì thấy gì: bài kiểm có đòi một trạng thái «không đủ quyền» có tên trong bảng trạng thái
   không?** Khuyến nghị: chưa. Mục này chỉ đòi rằng không có gì của màn hiện ra, và ghi một dòng giới hạn cho điều
   được thấy thay vào đó. Chặn tại chỗ, chuyển đi nơi khác hay báo không tìm thấy là lựa chọn của từng sản phẩm; kho
   này không có vai nào bị chặn để thử, và thêm một trạng thái chuẩn là đổi hợp đồng của bảng trạng thái. Đã nhận: chưa đòi trạng thái có tên; một dòng giới hạn.
4. **Kho này chỉ có một vai. Thêm vai thứ hai vào ứng dụng mẫu để cổng ở đây giữ cả nửa «không thấy», hay chứng nửa ấy
   trên một bản sao có gài?** Khuyến nghị: bản sao có gài. Thêm vai là đổi `ontology/` và dựng một công tắc vai giả
   cho ứng dụng mẫu, một tính năng không ai dùng. Cái giá: ở kho này dòng sổ mới chỉ giữ nửa «thấy», và trang đo phải
   nói thẳng điều ấy. Đã nhận: bản sao có gài, `ontology/` không đổi.
5. **Mục này có chạy qua bộ kit Delivery Loop không?** Khuyến nghị: không, như mục 5.1 và 5.2: đề bài được duyệt, bài
   kiểm viết trước, `make check`, một lượt soát mã độc lập, rồi PR. Đã nhận: không chạy qua kit ở mục này.
