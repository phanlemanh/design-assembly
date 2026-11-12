---
type: decision
title: Một sổ chuẩn, một danh sách tầng, một danh mục quyết định
links:
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/ledger.mjs
  - plugins/design-assembly/references/standard-decisions.json
  - plugins/design-assembly/references/layers.json
  - plugins/design-assembly/tests/test-ledger.mjs
---

# 0006 Một sổ chuẩn, một danh sách tầng, một danh mục quyết định

## Status

Accepted. Chủ kho duyệt ngày 2026-11-12, sau hai lượt phân tích: chọn định dạng sổ, rồi kiểm MECE.

## Context

Quyết định 0005 để mở câu hỏi: sổ quyết định theo định dạng nào. Lúc đó có hai định dạng, mỗi cái
một kho. Thử đề xuất trên 50 quyết định thật của kho đối chứng cho thấy thêm ba điều:

- Có năm danh sách tầng khác nhau đang sống (mười tầng dẫn dắt, sáu bậc, mười một tầng trong sổ của
  kho đối chứng, bảy tầng ở bản kiến trúc, tám nhóm ở ma trận kiểm kê). 11 trong 50 dòng thật không
  có bậc nào nhận.
- Không có thước đo độ phủ: mỗi kho tự đặt tên quyết định, nên không nói được kho nào thiếu câu hỏi
  nào, và hai tỉ lệ tất định tính trên hai mẫu số khác nhau.
- Hai định dạng không làm cùng một việc. Một bên là sổ chỉ mục trỏ tới nơi chứng minh; bên kia là sổ
  kèm tham số cho một công cụ và đầu vào để sinh lại.

## Decision

1. **Sổ chuẩn là `design/decisions.yaml`**, theo định dạng kho đối chứng đã dùng: sáu trường (`id`,
   `layer`, `kind`, `source`, `check`, `note`), bốn loại (`standard`, `formula`, `closed`,
   `judgment`), bốn kiểu con trỏ (`eslint:`, `test:`, `e2e:`, `tool:`). Dòng không chứa giá trị.
2. **Tệp cũ của plugin hạ xuống thành dữ liệu của công cụ**: `design/theme.json` giữ đầu vào và các
   phép kiểm cho từng quyết định plugin giữ. Mỗi quyết định đó là một dòng trong sổ, trỏ tới công cụ
   của plugin. Công cụ kiểm cả hai chiều.
3. **Một danh sách tầng**: context, foundations, components, patterns, content, templates,
   governance. Luật xếp: một quyết định thuộc tầng của vật mà nó ràng buộc. Accessibility,
   conformance và distribution không phải tầng. Tên tầng cũ trong sổ đã có được đọc nguyên và báo
   lại, không bắt sửa.
4. **Một danh mục quyết định chuẩn** đi theo plugin
   (`references/standard-decisions.json`): mỗi câu hỏi có tên, tầng, loại mặc định và nguồn nơi nó
   được thấy. Thấy ở ít nhất hai nguồn thì là lõi. Sổ của mỗi kho dùng lại tên và thêm phần riêng.
5. **Đọc trước, ghi sau.** Bộ đọc sổ và danh mục được dựng và thử trên sổ thật trước khi đổi bộ ghi.

Plugin là nơi định nghĩa lược đồ này, vì nó là bên ghi. Kit nghiệm thu chỉ đọc. Bản kiến trúc từng
giao lược đồ thư mục thiết kế cho kit ở chặng sau; việc đó chưa làm, nên đây là một lần dời ranh
giới có chủ đích.

## Consequences

- **Bộ đọc khớp bộ kiểm của chính kho đối chứng** trên sổ thật: 50 dòng, không lỗi định dạng, 33/50
  có lệnh kiểm, và ghi lại không đổi một byte. Bài kiểm này chạy khi kho đó có trên máy; khi không,
  nó bị bỏ qua và cổng kiểm in số bài bỏ qua.
- **Danh mục có 64 quyết định, 38 lõi.** Bốn nguồn: sổ thật 50 dòng, bản kiểm kê 49 thành phần, sàn
  của Repo Standards, và plugin này.
- **Đo được độ phủ trên cùng một mẫu số** (2026-11-12): kho này đáp 9/38 (2 máy giữ, 4 kho tự khai,
  3 đã ghi); kho đối chứng đáp 26/38 (0 máy giữ, 21 kho tự khai, 5 đã ghi).
- **Bản audit chạy cho mọi bậc.** Một bậc là «đạt» khi mọi quyết định lõi được giữ hoặc đã ghi, là
  «tự khai» khi hoàn chỉnh nhưng dựa vào lệnh kiểm chưa chạy lại.
- **Mười tầng dẫn dắt gộp về bảy.** Conformance level chuyển vào tầng context. Việc cài lệnh kiểm
  vào cổng không còn là một lựa chọn: nó luôn xảy ra. Tệp lựa chọn của kho này đã chuyển sang dạng
  mới; dạng cũ không còn được đọc, vì plugin chưa phát hành.
- **Giá trị và cách dùng là hai quyết định.** Sổ mỗi dòng một con trỏ, nên «nguồn chỉ dùng color
  role» (lint) và «các color role đạt tương phản» (công cụ) tách thành hai dòng.

Giới hạn và điều còn mở:

- Cách xếp 64 quyết định vào bảy tầng là phán đoán của máy, chưa ai phản biện. Bốn ca biên có ghi
  chú trong danh mục.
- Kho này hiện ra nhiều dòng «không có dòng» cho những thứ sàn Repo Standards đã giữ (control trần,
  nhãn, định dạng, một vùng chính). Bản audit không phân biệt được «chưa quyết» với «đã quyết ở chỗ
  sổ không ghi». Việc ghi dòng cho thứ sàn đã giữ chưa dựng. Các bài kiểm trình duyệt của sàn không
  mang thẻ tên quyết định, nên con trỏ tới chúng chưa đặt được; đó là khớp nối cần Repo Standards.
- «Đỏ được» của con trỏ tới lint và bài kiểm là suy ra từ cấu trúc, không phải thử. Chỉ dòng trỏ tới
  công cụ của plugin là được thử thật.
- Sổ không ghi độ chắc của lệnh kiểm, và chưa có kiểu con trỏ cho kiểu dữ liệu, lệnh chấm của kit
  hay bộ lint khác. Thêm khi có một dòng thật cần đến.
- Bản audit chỉ đọc kho web dùng biến CSS và Tailwind. Con trỏ `tool:` cần Makefile hoặc lệnh npm.
- Cuộc dẫn dắt vẫn ghi đè màu chính, nên chưa dùng cho kho đã có giá trị riêng.
