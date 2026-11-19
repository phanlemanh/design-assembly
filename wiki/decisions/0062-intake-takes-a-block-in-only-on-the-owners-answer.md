---
type: decision
title: "Lệnh intake nhập một khối vào kho, và chỉ ghi dòng sổ sau lời đáp của chủ repo"
links:
  - wiki/specs/0006-the-reusable-store.md
  - wiki/decisions/0061-inventory-reports-only-what-it-can-see.md
  - wiki/decisions/0060-find-searches-the-store-nearest-first.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0054-the-decision-ledger-stands-in-for-the-head-of-design.md
  - wiki/decisions/0043-decide-reads-ledger-rows-and-a-waiting-list-kept-as-data.md
  - wiki/decisions/0052-the-intake-ledger-joins-the-contract-one-file-per-block.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
sources:
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/intake-write.mjs
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/skills/intake/SKILL.md
  - plugins/design-assembly/tests/test-intake.mjs
  - plugins/design-assembly/tests/test-waiting.mjs
  - design/intake/
  - docs/trials/reusable-store-on-copies.md
  - "chủ repo, 2026-11-19: «Làm 3.3»; cho đo trên bản sao ba repo: «Cho cả ba»; khối đầu tiên: «useList»; danh sách before: «Kê cả bảy»"
---

# 0062 Lệnh intake nhập một khối vào kho, và chỉ ghi dòng sổ sau lời đáp của chủ repo

## Status

Accepted, 2026-11-19. Mục 3.3, theo phần B3 của đề bài 0006 mà chủ repo đã duyệt. Máy chọn cách làm trong khuôn đề bài;
chỗ lệch và chỗ thêm nằm cuối mục Decision.

## Context

`find` trả lời «kho có thứ này chưa», còn `inventory` trả lời «kho đang giữ gì». Còn thiếu lệnh ghi một thứ mới vào kho ngay
lúc nó ra đời. Dòng «xong khi» thứ nhất của giai đoạn 3 đòi một khối vào ứng dụng mẫu qua lệnh, và lần hai cùng nhu cầu
không gọi người. Đề bài 0006 đòi thêm: mọi lời chọn đi qua hàng chờ, để không dòng sổ nào mang tên người khi người chưa đáp.

## Decision

1. **Một lệnh, `scripts/intake.mjs`, theo hợp đồng lệnh chung.**
   - Cờ: `--need KEY` cùng các chữ của nhu cầu, `--kind component|block`, `--by-hand --why`, `--file`, `--before`,
     `--dry-run`, `--target`, `--json`, `--out`.
   - Mã thoát: 0 khi nhu cầu đã có dòng sổ; 1 khi chờ chủ repo đáp, chờ tệp, hoặc chủ repo đã bác; 2 khi gọi sai hoặc repo
     không đọc được, và khi ấy không ghi gì.
   - Không mạng, không tiến trình con. Lệnh không bao giờ chạy dòng `install`.
   - Skill `intake` gọi lệnh. Tài liệu là «Intake report», `intake-report.html`.
2. **Thang ba bậc:**
   - **Bậc 1:** sổ nhập kho có khối cho đúng khoá nhu cầu. Lệnh in khối ấy, không ghi gì, thoát 0. Bậc này không đọc
     hàng chờ, nên một hàng chờ hỏng không chặn lần hỏi lại.
   - **Bậc 2:** `find` tra từ bộ khởi đầu trở ra (cờ mới `from`), lấy tối đa ba ứng viên, thêm «by-hand» ở cuối. Thứ khớp
     chữ trong kho của repo chỉ được kê là gần khớp, không bao giờ được lấy cho nhu cầu này.
   - **Bậc 3:** tạo tay. Gọi với `--by-hand --why` thì «by-hand» đứng đầu, nên giữ khuyến nghị là chọn nó. Câu lý do được in
     nguyên văn cho chủ repo đọc.
3. **Hàng chờ nhận hai loại mục mới và khoá `candidates`.**
   - Hai loại mục: `need:<khoá>` và `before:<tên sổ>`. Cả hai không phải việc riêng của chủ repo, nên tác tử đi tiếp theo
     khuyến nghị (câu hỏi 7 của đề bài).
   - Mỗi nhu cầu một câu, `design/waiting/intake-<khoá>.json`.
   - Lời đáp bằng giá trị phải nêu đúng một ứng viên, hoặc `by-hand`. Với `before`, lời đáp nêu một số tên, cách nhau bằng
     dấu phẩy. `decide` từ chối lời đáp lạ, và cổng đọc cùng luật ấy (`answerProblem` trong `waiting.mjs`).
   - `decide` in các ứng viên của câu, ứng viên được khuyên đứng đầu.
4. **Sau lời đáp, lần gọi kế làm theo lời đáp:**
   - **Bộ khởi đầu:** chép tệp mẫu vào đúng chỗ người dẫn dắt đặt nó. Bảng chỗ đặt nay là một: `ownedFileOf` của
     `apply.mjs`. Lệnh không bao giờ chép đè một tệp khác của repo. Tệp đã có và giống hệt tệp mẫu thì chỉ ghi dòng sổ.
   - **Nguồn ngoài:** lệnh in dòng `install` và không chạy nó, rồi chờ `--file PATH`.
   - **Tạo tay:** lệnh cần `--file PATH`.
   - Dòng sổ gồm `name`, `file`, `source`, `from`, `pin`, `need`, `description`, `approved` và `approved_by` lấy từ lời đáp,
     và `taken` là `sha256` của tệp.
   - Khối từ bộ khởi đầu ghi `from: starter` và `pin: design-assembly <bản>`, như quyết định 0061 đã định.
5. **Người ghi sổ, `scripts/intake-write.mjs`:**
   - Ghi bằng cách viết khoá riêng của repo (`keys`, `values`), ở cả hai hình dạng sổ.
   - Sổ một tệp: dòng mới được nối vào cuối danh sách. Sổ giữ mỗi khối một tệp: lệnh ghi một tệp mới mang tên nhu cầu.
   - Mọi thứ được dựng trong bộ nhớ rồi đọc lại bằng chính bộ đọc mà các công cụ dùng. Sổ nào không đọc ra được đủ mọi dòng
     cũ cộng dòng mới thì không được ghi.
   - Repo chưa có sổ thì được tạo `design/intake.yaml` một tệp.
6. **`--before` ghi những gì có trước sổ.**
   - Máy đề xuất theo đúng luật `unrecorded` của `inventory`: các linh kiện riêng mà màn hoặc khung dùng, không khối nào
     ghi và `before` không kê.
   - Chủ repo giữ một lần qua `decide`. Lần gọi kế ghi các mục `before`, mỗi mục kèm `approved` và `approved_by`.
7. **Hỏi lại sau khi bị bác.** Câu bị bác được giữ nguyên làm hồ sơ. Lệnh chỉ hỏi lại khi lần gọi đưa ra điều câu cũ chưa có
   (chữ khác, hoặc tạo tay). Câu mới mang hậu tố: `intake-<khoá>-2`.
8. **`find` nay nêu `intake --need`** ở lời khuyên khi không có mục khớp. Quyết định 0060 bỏ ý này vì lúc ấy lệnh chưa có.

Chỗ lệch và chỗ thêm so với đề bài:

- **Công cụ cũ hơn 0.12.0: lệnh không ghi câu hỏi mà bảo `upgrade` trước.** Đề bài viết «ghi như thường». Nhưng hàng chờ là
  khuôn đóng: công cụ cũ đọc khoá `candidates` thành lỗi và làm cổng của repo đỏ. Sổ nhập kho thì mở, nên dòng sổ vẫn ghi
  được.
- **Nguồn ngoài cần `--file`.** Lệnh không chạy dòng `install`, nên không biết dòng ấy đặt tệp ở đâu. Dòng giới hạn
  `intake-file-of-an-outside-item-named-by-the-caller` ghi điều này.
- **Cờ `--before` và hậu tố `-2`** là chỗ thêm. Đề bài nói «máy đề xuất, chủ repo giữ một lần» mà không nêu cách làm.
- **Repo chưa nhận plugin:** lệnh vẫn ghi, kèm một ghi chú, và thoát 1 sau khi ghi, đúng như bảng «Phục vụ mọi repo».

Một người đọc lại độc lập không làm cho lệnh ghi được tên người khi người chưa đáp, và không thấy lần sập nào có dấu vết
ngăn xếp. Họ nêu năm chỗ cho kết quả sai hoặc dừng sai. Cả năm đã sửa, mỗi chỗ kèm một bài kiểm thấy đỏ trước:

- Một giá trị sổ không giữ được (lý do có xuống dòng, có cả hai loại ngoặc kép, hoặc chữ `null`) chỉ bị bắt sau khi chủ repo
  đã đáp. Nay lệnh kiểm ngay lúc hỏi.
- Một nhu cầu đã bị bác không bao giờ hỏi lại được. Nay lệnh hỏi lại khi lần gọi đưa ra điều mới (mục 7).
- Bậc 1 bị chặn bởi một hàng chờ là tệp chung, hoặc có một tệp hỏng. Nay bậc 1 không đọc hàng chờ.
- `--before` hỏng khi tên sổ có chữ hoa hoặc dấu gạch dưới. Nay tên mục được viết lại thành chữ thường nối gạch.
- Một câu không có ứng viên mà đã có lời đáp thì làm lệnh báo một lỗi lập trình khó hiểu. Nay lệnh nói rõ câu ấy thiếu gì.

Hai điều người đọc nêu được giữ nguyên:

- Lệnh thoát 1 sau khi ghi trên repo chưa nhận plugin; đó là điều đề bài đòi.
- `blocks:` bỏ trống thì không phải danh sách. Đó là cách bộ đọc chung vẫn đọc, và cổng cũng báo đỏ như vậy.

## Consequences

- **Dòng «xong khi» thứ nhất có bằng chứng trên ứng dụng mẫu.**
  - `intake --need list-load-retry-filter` thoát 1. Lệnh thêm đúng một tệp, `design/waiting/intake-list-load-retry-filter.json`,
    và không ghi dòng sổ nào.
  - Chủ repo đáp «useList», được ghi qua `decide`.
  - Gọi lại thì thoát 0 và ghi một mảnh, `design/intake/list-load-retry-filter.yaml`, mang tên Manh Phan và ngày 2026-11-19.
    Không tệp mã nào được chép, vì `src/lib/list.ts` đã giống hệt tệp mẫu.
  - Gọi lần thứ ba thì thoát 0 ở bậc `store`, và cây không đổi.
- **Ứng dụng mẫu có sổ nhập kho**, giữ mỗi khối một tệp ở `design/intake/`.
  - Bảy linh kiện có từ trước nằm ở `before`, do chủ repo giữ («Kê cả bảy»).
  - `inventory --target . --strict` vẫn thoát 0.
- **Lần đo trên bản sao** (`docs/trials/reusable-store-on-copies.md`):
  - Repo kiểm chứng trả lời bậc 1 qua khoá `bang-nhieu-dong`. Các nhu cầu khác thoát 2, vì công cụ của repo ấy là bản 0.7.1.
  - Hai repo của giai đoạn 2 chưa nhận plugin, nên chỉ có «by-hand».
  - Ở mọi bản sao, các tệp lần xem trước kê đúng là các tệp lần chạy thật ghi, và không tệp nào nằm ngoài hàng chờ.
- **Sổ giới hạn:**
  - Dòng `decide-intake-candidates-not-read` đóng.
  - Ba dòng mở mới ở vùng `intake`: `intake-candidates-without-pictures`,
    `intake-file-of-an-outside-item-named-by-the-caller`, `intake-matches-words-not-meaning`.
- **`waiting.mjs` nằm trong công cụ chép vào repo**, nên cây công cụ đổi. Plugin lên 0.12.0.
