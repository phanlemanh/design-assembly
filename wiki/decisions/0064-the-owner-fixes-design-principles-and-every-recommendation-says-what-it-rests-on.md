---
type: decision
title: "Chủ repo chốt nguyên tắc thiết kế trước mọi giá trị, và mọi khuyến nghị của cuộc dẫn dắt nói nó dựa vào đâu"
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0054-the-decision-ledger-stands-in-for-the-head-of-design.md
  - wiki/decisions/0046-one-frame-for-every-document.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
sources:
  - plugins/design-assembly/references/principles.json
  - plugins/design-assembly/scripts/principles.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/templates/tools/design-assembly/owner-calls.mjs
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/references/layers/context.md
  - plugins/design-assembly/tests/test-principles.mjs
  - "chủ repo, 2026-11-19: «Làm 4.1»; nguồn nguyên tắc: «Danh mục, viết riêng được»; chỗ ghi: «Dòng sổ tầng bối cảnh»"
---

# 0064 Chủ repo chốt nguyên tắc thiết kế trước mọi giá trị, và mọi khuyến nghị của cuộc dẫn dắt nói nó dựa vào đâu

## Status

Accepted, 2026-11-19. Mục 4.1 của kế hoạch, theo đề bài 0004 mà chủ repo đã duyệt ngày 2026-11-15. Giai đoạn 4 không có
đề bài riêng. Hai chỗ đề bài để ngỏ được chủ repo chọn ngày 2026-11-19: nguyên tắc lấy từ một danh mục của plugin, có
cho viết câu riêng; và mỗi nguyên tắc là một dòng sổ ở tầng bối cảnh. Cả hai đều theo lối máy khuyên.

## Context

Đề bài 0004 đòi hai điều cho giai đoạn này:

- **`new` hỏi nguyên tắc trước.** Trước mọi giá trị, cuộc dẫn dắt đưa ra ba tới năm nguyên tắc thiết kế để chủ repo
  chốt, và trả cho máy khoá `principles[]`.
- **Không khuyến nghị nào thiếu lý lẽ** (tiêu chí 14). Mỗi khuyến nghị trỏ tới một nguyên tắc chủ repo đã chốt, một
  chuẩn, hoặc một số đo.

Khung tài liệu đã đòi mỗi khuyến nghị có căn cứ thuộc ba loại ấy. Nhưng chưa lệnh nào ghi nguyên tắc chủ repo đã
chốt, nên chưa căn cứ nào là một nguyên tắc. Sổ giới hạn có hai dòng ghi điều này: `new-json-without-principles` và
`document-rests-on-no-principle-yet`.

Lệnh không gọi mô hình. Vì vậy máy chỉ trỏ được một khuyến nghị về một nguyên tắc khi đã biết trước nguyên tắc ấy
nghiêng về lựa chọn nào.

## Decision

1. **Một danh mục của plugin, `references/principles.json`, có chín nguyên tắc.**
   - Mỗi nguyên tắc có mã, tên, một câu phát biểu, và loại sản phẩm nó hợp trước (`suits`).
   - Mỗi nguyên tắc nêu nó nghiêng về phương án nào của từng lựa chọn, kèm lý do (`favours`).
   - Năm lựa chọn có thể được nghiêng về: mức tuân thủ, thang chữ, tỉ lệ của thang modular, bo góc, và cách mở một bản
     ghi.
   - Nguyên tắc nào nghiêng về một tỉ lệ thì cũng nghiêng về thang modular, vì tỉ lệ chỉ áp cho thang ấy.
   - Mỗi loại sản phẩm có ít nhất năm nguyên tắc hợp, nên chủ repo luôn có chỗ để chọn.
2. **Chủ repo chốt ba tới năm nguyên tắc ở tầng bối cảnh của `design/blueprint.json`.**
   - Nguyên tắc ghi trong `layers.context.principles`, mỗi mục `{ id, source }`.
   - Câu riêng của chủ repo có thêm `text`. Nó được ghi và trích được, nhưng không nghiêng về phương án nào.
   - Nguyên tắc của danh mục mà chủ repo muốn sửa lời thì giữ mã và có `text`, miễn là nghĩa vẫn giữ.
   - Lúc dựng bản thiết kế, ít hơn ba là một khởi đầu. Lúc áp, phải từ ba tới năm.
   - Bản thiết kế không kê nguyên tắc nào là bản quyết trước khi có nguyên tắc. Nó vẫn được áp; bản xem trước nói điều
     ấy bằng một dòng `hint:`.
3. **Mỗi nguyên tắc là một dòng phán xét `principle-<mã>` ở tầng `context` của sổ quyết định.** Không mở sổ mới.
   - `source` của dòng là `design/blueprint.json`. Trang ghi của tầng bối cảnh kê lời của từng nguyên tắc.
   - Nguyên tắc máy đề xuất (`source: proposed`) có dòng tự nói người chưa xác nhận, nên nó lên tờ trình của `decide`.
   - Chủ repo đáp «giữ» thì `decide` ghi `source: user` vào bản thiết kế. Lần dẫn dắt kế giữ nguyên tắc ấy là của chủ
     repo, như với các lựa chọn khác (quyết định 0054).
   - Bỏ một nguyên tắc khỏi bản thiết kế thì dòng của nó rời sổ. Dòng do tay khác viết với cùng tiền tố thì nêu nguồn
     khác, và được giữ.
4. **Mọi khuyến nghị của cuộc dẫn dắt nói nó dựa vào đâu.**
   - `apply.mjs --json` trả `principles` và `recommendations`. Mỗi khuyến nghị gồm lựa chọn, phương án và căn cứ.
   - **Căn cứ loại `principle`:** khi các nguyên tắc chủ repo đã chốt cùng nghiêng về một phương án. Căn cứ nêu mã và lý
     do của từng nguyên tắc.
   - **Căn cứ loại `standard`:** khi không nguyên tắc đã chốt nào nói tới lựa chọn ấy. Khi ấy khuyến nghị là chuẩn mà
     trang của tầng nêu, theo loại sản phẩm.
   - **Hai nguyên tắc nghiêng về hai phương án:** không nguyên tắc nào quyết, chuẩn đứng. Căn cứ nêu chỗ bất đồng, và
     `conflict` kê từng bên.
   - Chỉ nguyên tắc đã chốt mới quyết được điều gì. Nguyên tắc máy đề xuất là một câu hỏi cho tới khi chủ repo đáp.
   - Giá trị nào của bản thiết kế đi ngược một nguyên tắc đã chốt thì bản xem trước in một dòng `hint:`. Đó không phải
     lỗi: chủ repo có thể biết mà vẫn chọn.
5. **Tài liệu `status` dựa một khuyến nghị vào nguyên tắc.**
   - Một dòng chưa ai xác nhận, thuộc một lựa chọn mà nguyên tắc đã chốt nói tới: `status` khuyên giữ giá trị nguyên tắc
     nghiêng về, hoặc xem lại giá trị đi ngược nó. Căn cứ thuộc loại «A design principle the owner fixed».
   - Dòng của một nguyên tắc chưa chốt được hỏi bằng chính lời của nó.
6. **Cổng của repo nhận dòng nguyên tắc chủ repo đã chốt là đã đáp.** Phép so tổng (quyết định 0054, mục 6) đọc thêm
   `layers.context.principles`. `owner-calls.mjs` nằm trong công cụ chép vào repo, nên plugin lên 0.14.0.

Chỗ lệch và chỗ thêm so với đề bài:

- **Danh mục là chỗ thêm.** Đề bài chỉ nói ba tới năm nguyên tắc để chốt. Danh mục là cách để khuyến nghị dựa vào
  nguyên tắc mà không cần mô hình.
- **Trong các tài liệu, mới `status` dựa vào nguyên tắc.** Các tài liệu khác đo những thứ không phải lựa chọn mà nguyên
  tắc nghiêng về. Bản định hướng thiết kế của `new`, nơi phần lớn khuyến nghị sẽ dựa vào nguyên tắc, chưa dựng.

Một người đọc lại độc lập xác nhận bốn điều. Không đường nào coi một đề xuất là đã chốt. Không dòng sổ nào do tay khác
viết bị đổi hay bị bỏ. Lệnh tất định. Mọi chữ trong `plugins/` là tiếng Anh. Họ nêu năm chỗ, và cả năm đã sửa hoặc đã có
bài kiểm:

- **Lỗi nặng: `status` và `decide` sập khi một mục nguyên tắc không có mã bằng chữ**, như `null` hay một con số. Chỉ
  `apply` kiểm hình dạng, nên một bản thiết kế sửa tay sau lần dẫn dắt cuối chặn cả tờ trình. Nay mọi chỗ đọc đều qua
  một hàm. Hàm ấy bỏ qua mục hỏng và chỉ đếm một lần mã bị nêu hai lần; việc từ chối vẫn chỉ thuộc về `apply`.
- **Thiếu bài kiểm:** bản thiết kế hỏng ở `status` và `decide`, và lời bác của chủ repo phải để nguyên tắc ở trạng thái
  đề xuất. Cả hai nay có bài kiểm.
- **Căn cứ cho câu riêng của chủ repo ghi loại «số đo»,** dù không có phép đo nào. Nay là loại «chuẩn»: cuộc dẫn dắt đòi
  chủ repo chốt nguyên tắc.
- **Nhánh «tầng bối cảnh chưa quyết»** cư xử như với các lựa chọn khác: lời đáp không được ghi vào bản thiết kế. Không
  sửa gì; quyết định 0054 đã nói điều ấy.

Mỗi chỗ sửa được thấy đỏ bằng cách làm hỏng đúng chỗ ấy. Tổng cộng 19 cách làm hỏng mã, cả 19 đều bị bắt.

## Consequences

- **Lệnh chứng:** `node --test plugins/design-assembly/tests/test-principles.mjs`, 17 bài.
  - Danh mục chỉ nghiêng về phương án có thật.
  - Khuyến nghị dựa trên chuẩn khi không có nguyên tắc, và trên nguyên tắc khi có một nguyên tắc đã chốt. Khi hai
    nguyên tắc bất đồng, không bên nào thắng.
  - Nguyên tắc đề xuất hay câu riêng không quyết gì.
  - Hình dạng trong bản thiết kế được kiểm.
  - Dòng sổ được ghi, và rời sổ khi nguyên tắc bị bỏ.
  - `--json` có hai khoá mới, và lần chạy thứ hai không đổi gì.
  - Bản xem trước in `hint:`.
  - Cổng nhận và từ chối đúng chỗ, `decide` chuyển một đề xuất thành của chủ repo, và `status` dựa khuyến nghị vào
    nguyên tắc cả ở tài liệu.
- **Bài kiểm hợp đồng lệnh:** `new` nay trả `principles` và `recommendations`.
- **Sổ giới hạn:**
  - Đóng `new-json-without-principles` và `document-rests-on-no-principle-yet`.
  - Mở ba dòng mới: `principles-speak-to-five-choices`, `own-principle-favours-nothing` và
    `only-status-rests-a-document-on-a-principle`.
- **Bảng từ vựng** thêm «design principle».
- **Kho này:** bản thiết kế của ứng dụng mẫu chưa kê nguyên tắc nào, nên sổ quyết định không đổi. Chọn nguyên tắc cho
  nó là việc của chủ repo.
